/**
 * Kamuk Holdings weekly nesting floor helpers.
 */
const path = require('path');
const crypto = require('crypto');

const pack = require(path.join('..', 'kamuk', 'data', 'kamuk-holdings-crm-pack-v1.json'));
const templateMap = pack.templateMap || Object.fromEntries((pack.cases || []).map((item) => [item.id, item.templateId || item.id]));

const HOME_CASES = [
  { id: 'hc1', connectors: ['because', 'however'], family: ['authorize', 'authorization', 'unauthorized'], phrasal: 'look into', vocab: ['duplicate charge', 'merchant', 'dispute', 'timeline'] },
  { id: 'hc2', connectors: ['because', 'therefore'], family: ['verify', 'verification', 'unverified'], phrasal: 'sort out', vocab: ['decline', 'travel notice', 'limit', 'available'] },
  { id: 'hc3', connectors: ['although', 'in addition'], family: ['cancel', 'cancellation', 'cancelled'], phrasal: 'follow up', vocab: ['recurring payment', 'merchant block', 'evidence', 'chargeback'] },
  { id: 'hc4', connectors: ['because', 'however'], family: ['authorize', 'authorization', 'unauthorized'], phrasal: 'look into', vocab: ['provisional credit', 'block', 'replacement card', 'investigation'] },
  { id: 'hc5', connectors: ['although', 'therefore'], family: ['resolve', 'resolution', 'unresolved'], phrasal: 'sort out', vocab: ['service not rendered', 'booking confirmation', 'evidence', 'merchant response'] },
  { id: 'hc6', connectors: ['however', 'in addition'], family: ['comply', 'compliance', 'non-compliant'], phrasal: 'follow up', vocab: ['provisional credit', 'confirmation', 'case number', 'business day'] },
  { id: 'hc7', connectors: ['because', 'although'], family: ['eligible', 'eligibility', 'ineligible'], phrasal: 'look into', vocab: ['reporting window', 'statement date', 'alternative', 'internal report'] },
  { id: 'hc8', connectors: ['however', 'therefore'], family: ['decide', 'decision', 'undecided'], phrasal: 'follow up', vocab: ['outcome', 'network', 'evidence', 'deadline'] },
  { id: 'hc9', connectors: ['because', 'in addition'], family: ['resolve', 'resolution', 'unresolved'], phrasal: 'sort out', vocab: ['refund', 'double credit', 'withdraw', 'reopen'] },
  { id: 'hc10', connectors: ['therefore', 'however'], family: ['activate', 'activation', 'inactive'], phrasal: 'sort out', vocab: ['virtual card', 'travel notice', 'cash access', 'limitation'] }
];

const REQUIRED_DONE = ['welcome', 'service', 'practice', 'products', 'quiz', 'mock'];
const FOLLOW_DISPOSITIONS = /awaiting action|pending system|returned to queue|\baa\b|\bpsa\b|queue|flagged aa|flagged psa/i;

function clean(value, max = 500) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function productForStudent(studentId) {
  return String(studentId || '').startsWith('KAM-') ? 'kamuk' : 'infinity';
}

function sessionsTable(product) {
  return product === 'kamuk' ? 'kamuk_sessions' : 'infinity_sessions';
}

function studentsTable(product) {
  return product === 'kamuk' ? 'kamuk_students' : 'infinity_students';
}

function holdingsKey(product) {
  return product === 'kamuk' ? 'kamukHoldings' : 'infinitySimulation';
}

function weekKeyCR(date = new Date()) {
  const crMs = date.getTime() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  const day = cr.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate() + diffToMonday));
  const yearStart = new Date(Date.UTC(monday.getUTCFullYear(), 0, 1));
  const week = Math.floor((monday - yearStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return monday.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

function workItemId(product, weekKey, caseId) {
  return 'KHCRM-WI-' + product + '-' + weekKey + '-' + caseId;
}

function claimLockId(product, weekKey, caseId) {
  return 'KHCRM-CLAIM-' + product + '-' + weekKey + '-' + caseId;
}

function homeAnswerReady(item, answer) {
  const text = String(answer || '').trim();
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const connectorCount = item.connectors.filter((word) => lower.includes(word.toLowerCase())).length;
  const familyUsed = item.family.some((word) => lower.includes(word.toLowerCase()));
  const phrasalUsed = lower.includes(item.phrasal.toLowerCase());
  const vocabCount = item.vocab.filter((word) => lower.includes(word.toLowerCase())).length;
  return words >= 80 && words <= 180 && connectorCount >= 2 && familyUsed && phrasalUsed && vocabCount >= 2;
}

function validateTrainingProgress(payload) {
  const done = Array.isArray(payload && payload.done) ? payload.done.map((item) => clean(item, 40)).filter(Boolean) : [];
  const homeAnswers = payload && payload.homeAnswers && typeof payload.homeAnswers === 'object' ? payload.homeAnswers : {};
  const missingSteps = REQUIRED_DONE.filter((step) => !done.includes(step));
  const homeStatus = HOME_CASES.map((item) => ({ id: item.id, ready: homeAnswerReady(item, homeAnswers[item.id]) }));
  const homeReady = homeStatus.every((item) => item.ready);
  return { done, homeAnswers, missingSteps, homeStatus, homeReady, complete: missingSteps.length === 0 && homeReady };
}

function floorState(student, product) {
  return (student && (student[holdingsKey(product)] || student.infinitySimulation || student.kamukHoldings)) || {};
}

function isNestingComplete(student, product) {
  return Boolean(floorState(student, product).nestingCompletedAt);
}

function metricsFromFloor(state) {
  const started = Math.max(0, Number(state.started) || 0);
  const resolved = Math.max(0, Number(state.resolved) || 0);
  const handled = Math.max(0, Number(state.handled) || 0);
  const weeklyPoints = Math.max(0, Number(state.weeklyPoints) || 0);
  const qaTotal = Math.max(0, Number(state.qaTotal) || 0);
  return {
    started,
    resolved,
    handled,
    resolutionRate: started ? Math.round((resolved / started) * 100) : 0,
    qaAverage: handled ? Math.round(qaTotal / handled) : null,
    points: Math.max(0, Number(state.points) || 0),
    weeklyPoints,
    team: state.team || null,
    nestingCompletedAt: state.nestingCompletedAt || null
  };
}

function dispositionKind(disposition) {
  const text = clean(disposition, 120).toLowerCase();
  if (FOLLOW_DISPOSITIONS.test(text)) {
    if (/pending system|\bpsa\b/.test(text)) return 'psa';
    if (/awaiting action|\baa\b/.test(text)) return 'aa';
    return 'queue';
  }
  return 'resolved';
}

function listWorkItems(rows, product, weekKey) {
  return rows
    .filter((row) => String(row.id || '').startsWith('KHCRM-WI-' + product + '-' + weekKey + '-') && row.data && row.data.product === product)
    .map((row) => Object.assign({ id: row.id }, row.data));
}

function listTouches(rows, product, weekKey) {
  return rows
    .filter((row) => String(row.id || '').startsWith('KHCRM-TOUCH-' + product + '-' + weekKey + '-') && row.data && row.data.product === product)
    .map((row) => Object.assign({ id: row.id }, row.data));
}

function scoreFromErrors(errors) {
  const list = Array.isArray(errors) ? errors.slice(0, 10) : [];
  const casePoints = Math.max(0, 10 - list.length);
  return {
    errors: list.map((item) => ({
      code: clean((item && item.code) || 'error', 40),
      label: clean((item && (item.label || item.code)) || 'Error', 120),
      evidence: clean((item && item.evidence) || '', 300)
    })),
    casePoints,
    competitionEligible: casePoints >= 7,
    qaScore: casePoints * 10,
    verdict: casePoints >= 9 ? 'Corporate standard exceeded' : casePoints >= 7 ? 'Banking standard met' : 'Coaching required'
  };
}

function deterministicErrors(caseData, submission) {
  const errors = [];
  const keys = new Set((submission.actions || []).map((action) => action.key));
  (caseData.requiredActions || []).forEach((key) => {
    if (!keys.has(key)) errors.push({ code: 'missing-' + key, label: 'Missing control: ' + key.replace(/-/g, ' '), evidence: 'Required desk control was not evidenced in this touch.' });
  });
  (caseData.forbiddenActions || []).forEach((key) => {
    if (keys.has(key)) errors.push({ code: 'forbidden-' + key, label: 'Unsafe action: ' + key.replace(/-/g, ' '), evidence: 'A forbidden control appeared in the evidence trail.' });
  });
  const email = (submission.events || []).find((event) => event.type === 'email' && event.body);
  const note = (submission.notes || [])[0];
  if (!email) errors.push({ code: 'missing-email', label: 'Missing client email', evidence: 'No outbound email was recorded for this touch.' });
  if (!note) errors.push({ code: 'missing-note', label: 'Missing interaction note', evidence: 'No brief internal note was recorded for this touch.' });
  if (email) {
    const lower = String(email.body || '').toLowerCase();
    if (!/^(dear|hello|hi)\b/.test(lower)) errors.push({ code: 'email-opening', label: 'Unnatural email opening', evidence: 'Client email should open with Dear, Hello or Hi.' });
    if (!/(because|however|therefore|although|in addition|as a result)/.test(lower)) errors.push({ code: 'email-connector', label: 'Missing connector in email', evidence: 'Use at least one professional connector naturally.' });
    if (!/\b(today|tomorrow|within|by\s+\d|business day|a\.m\.|p\.m\.)\b/i.test(email.body || '')) errors.push({ code: 'email-next-step', label: 'Missing timed next step in email', evidence: 'The email must include a timed next step.' });
  }
  return scoreFromErrors(errors.slice(0, 10));
}

function buildFloorAlicePrompt(caseData, submission, fallback, kind) {
  return 'You are Alice, Senior QA Director for Kamuk Holdings nesting floor.\n'
    + 'Score ONE agent touch from 10 points. Every distinct error deducts exactly 1 point.\n'
    + 'Return ONLY JSON: {"errors":[{"code":"short-code","label":"short label","evidence":"proof"}],"summary":"2 sentences","strengths":["max 4"],"improvements":["max 4"],"dimensions":{"English":0-100,"Judgment":0-100,"Compliance":0-100,"Documentation":0-100}}\n'
    + 'Touch kind: ' + kind + '\n'
    + 'CASE:\n' + JSON.stringify({ id: caseData.id, type: caseData.type, brief: caseData.brief, expectedResolution: caseData.expectedResolution, requiredActions: caseData.requiredActions, forbiddenActions: caseData.forbiddenActions }) + '\n'
    + 'EVIDENCE:\n' + JSON.stringify(submission) + '\n'
    + 'CONTROL PRECHECK:\n' + JSON.stringify(fallback);
}

function normalizeFloorEvaluation(value, fallback) {
  const scored = scoreFromErrors(value && value.errors && value.errors.length ? value.errors : fallback.errors);
  const dimensions = (value && value.dimensions) || {};
  const bounded = (number) => Math.max(0, Math.min(100, Math.round(Number(number) || 0)));
  return Object.assign({}, scored, {
    summary: clean((value && value.summary) || fallback.summary || scored.verdict, 700),
    strengths: (Array.isArray(value && value.strengths) ? value.strengths : fallback.strengths || []).slice(0, 4).map((item) => clean(item, 180)),
    improvements: (Array.isArray(value && value.improvements) ? value.improvements : fallback.improvements || []).slice(0, 4).map((item) => clean(item, 180)),
    dimensions: {
      English: bounded(dimensions.English != null ? dimensions.English : 70),
      Judgment: bounded(dimensions.Judgment != null ? dimensions.Judgment : scored.casePoints * 10),
      Compliance: bounded(dimensions.Compliance != null ? dimensions.Compliance : scored.casePoints * 10),
      Documentation: bounded(dimensions.Documentation != null ? dimensions.Documentation : 70)
    },
    pointsAwarded: scored.competitionEligible ? scored.casePoints : 0,
    pendingEvaluation: false
  });
}

function pendingEvaluationResult(fallback) {
  return Object.assign({}, fallback, {
    pendingEvaluation: true,
    pointsAwarded: 0,
    competitionEligible: false,
    summary: 'AI evaluation is pending. This touch is saved for Alice scoring and will not add competition points until evaluated.',
    verdict: 'Pending evaluation'
  });
}

function leaderboardFromTouches(touches, studentsById) {
  const byStudent = new Map();
  touches.forEach((touch) => {
    if (touch.pendingEvaluation) return;
    const id = touch.studentId;
    if (!id) return;
    const current = byStudent.get(id) || {
      studentId: id,
      name: touch.studentName || (studentsById.get(id) && studentsById.get(id).info && studentsById.get(id).info.name) || id,
      weeklyPoints: 0,
      resolved: 0,
      handled: 0,
      started: 0,
      scoreTotal: 0
    };
    current.handled += 1;
    current.started += 1;
    if (touch.kind === 'resolved') current.resolved += 1;
    const pts = Number(touch.evaluation && touch.evaluation.casePoints) || 0;
    current.scoreTotal += pts;
    if (touch.evaluation && touch.evaluation.competitionEligible) current.weeklyPoints += pts;
    byStudent.set(id, current);
  });
  return [...byStudent.values()]
    .map((row) => Object.assign({}, row, {
      resolutionRate: row.started ? Math.round((row.resolved / row.started) * 100) : 0,
      averageScore: row.handled ? Math.round((row.scoreTotal / row.handled) * 10) / 10 : 0
    }))
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints || b.resolved - a.resolved || b.averageScore - a.averageScore || String(a.name).localeCompare(String(b.name)))
    .map((row, index) => Object.assign({}, row, { rank: index + 1 }));
}

function hasTouchEvidence(events, acceptedAt, type) {
  const start = acceptedAt ? new Date(acceptedAt).getTime() : 0;
  return (events || []).some((event) => {
    if (event.type !== type) return false;
    const at = event.at ? new Date(event.at).getTime() : 0;
    return !start || at >= start - 1000;
  });
}

module.exports = {
  HOME_CASES,
  REQUIRED_DONE,
  pack,
  templateMap,
  clean,
  productForStudent,
  sessionsTable,
  studentsTable,
  holdingsKey,
  weekKeyCR,
  workItemId,
  claimLockId,
  validateTrainingProgress,
  floorState,
  isNestingComplete,
  metricsFromFloor,
  dispositionKind,
  listWorkItems,
  listTouches,
  scoreFromErrors,
  deterministicErrors,
  buildFloorAlicePrompt,
  normalizeFloorEvaluation,
  pendingEvaluationResult,
  leaderboardFromTouches,
  hasTouchEvidence,
  crypto
};
