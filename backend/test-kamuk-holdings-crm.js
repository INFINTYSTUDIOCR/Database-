const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'kamuk-holdings-local-test-secret';
delete process.env.ANTHROPIC_API_KEY;

const express = require('express');
const { signToken, requireAuth } = require('./auth');
const { registerKamukHoldingsCrm } = require('./kamuk-holdings-crm');
const {
  weekKeyCR, HOME_CASES, passingCoursePayload, gradeHomeAnswer, gradeFormatoE, gradePracticeTouch,
  applyActivityHeartbeat, detectAssistSignals, crDateKey, DELAY_GAP_MS, PRIZE_SCORE,
  applyQualityGates, scoreFromErrors
} = require('./kamuk-holdings-floor');
const { gradeCallTurn, nextCallTurn, isInternalOnly, openingLine } = require('./kamuk-holdings-call-scripts');

function readyHomeAnswers() {
  const answers = {};
  HOME_CASES.forEach((item) => {
    const [c1, c2] = item.connectors;
    const body = [
      `I understand the impact this has on the client ${c1} the ${item.vocab[0]} is still open and the client needs a safe owner.`,
      `${c2} I will not take an unsafe shortcut or over-promise an outcome I do not own.`,
      `I will ${item.phrasal} the ${item.family[1]} trail and confirm whether this looks ${item.family[0]} using the CRM evidence, not memory.`,
      `How did this start, and can you confirm the key fact on a recorded line before we move?`,
      `The safe resolution is ${item.resolution[0]} plus ${item.resolution[1]}. Disposition: ${item.disposition[0]}.`,
      `I will follow up today before 4:30 p.m. after the ${item.vocab[1]} check, and I own that callback.`,
      `In other words, I will leave a brief note so the next agent can continue without repeating identity questions.`,
      `This follows ${item.why.join(' ')} because the documented path is required, even though the client wants a faster shortcut.`
    ].join(' ');
    answers[item.id] = body;
  });
  return answers;
}

const GOLD_EMAIL = 'Hello Marta, thank you for writing. I understand this payroll freeze is blocking supplier payments on the Operating Account. I reviewed the restriction in the CRM because two supplier ACH payments declined. However I will not lift every control blindly. In other words, I verified the freeze, I escalated to Operations, and I have documented Previous contacts. I will call you today before 3:00 p.m. with the authorization path. Kind regards';
const GOLD_NOTE = 'Reviewed authorization evidence, confirmed identity verification, and parked a 3:00 p.m. callback with Operations as owner.';
const PRACTICE_GOLD_NOTE = 'I understand the client called about the payroll freeze. You mentioned the supplier ACH declined. Just to make sure, the Operating Account is restricted and the Obsidian card stays active. I will follow up with Operations today before 4:30 p.m.';
const GOLD_CALL = 'I understand payroll is frozen. You mentioned two supplier ACH payments declined. We are on a recorded line. I will review Statements today before 4:30 p.m. because I own the callback. I cannot send a PIN.';
const BAD_CALL = 'Give me your PIN and full card number. Calm down. Someone will call you whenever.';
const WEAK_PRACTICE_EMAIL = 'ok thanks I blocked it';
const GENERIC_EMAIL = 'Hello, I am writing because we need clarity. However I own the next check and will call tomorrow at 9:00 a.m.';
const AI_EMAIL = 'Hello, I hope this message finds you well. It is important to note that in today\'s fast-paced banking landscape I am here to assist you. Rest assured that I will leverage a robust solution to streamline your experience. Please do not hesitate to reach out should you need anything else regarding this matter today before 3:00 p.m.';

async function run() {
  const students = new Map([
    ['KAM-TEST-01', { id: 'KAM-TEST-01', name: 'QA Student A', portalUser: 'q.student' }],
    ['KAM-TEST-02', { id: 'KAM-TEST-02', name: 'QA Student B', portalUser: 'q.student.b' }],
    ['KAM-TEST-03', { id: 'KAM-TEST-03', name: 'QA Enabled', portalUser: 'q.enabled', simulationEnabled: true, kamukHoldings: { enabled: true } }],
    ['INF-TEST-01', { id: 'INF-TEST-01', name: 'Infinity Student', portalUser: 'i.student' }]
  ]);
  const sessions = new Map();
  const infinitySessions = new Map();
  let claudePayload = null;
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const requireProductAuth = requireAuth(['student', 'trainer', 'superadmin', 'master']);
  const requireTeacherAccess = requireAuth(['trainer', 'superadmin', 'master']);

  function storeFor(table) {
    if (table === 'kamuk_sessions') return sessions;
    if (table === 'infinity_sessions') return infinitySessions;
    return null;
  }

  const deps = {
    requireProductAuth,
    requireTeacherAccess,
    sbGetStudentRow: async (id) => (students.has(id) ? { id, data: students.get(id) } : null),
    sbSetStudent: async (id, data) => { students.set(id, data); return true; },
    sbGet: async (table) => {
      if (table === 'kamuk_students') return [...students].filter(([id]) => id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      if (table === 'infinity_students') return [...students].filter(([id]) => !id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      const store = storeFor(table);
      return store ? [...store].map(([id, data]) => ({ id, data })) : [];
    },
    sbSet: async (table, id, data) => {
      const store = storeFor(table);
      assert.ok(store, `unexpected table ${table}`);
      store.set(id, data);
      return true;
    },
    sbGetOne: async (table, id) => {
      if (table === 'kamuk_students' || table === 'infinity_students') {
        return students.has(id) ? { id, data: students.get(id) } : null;
      }
      const store = storeFor(table);
      if (!store || !store.has(id)) return null;
      return { id, data: store.get(id) };
    },
    sbInsertOnly: async (table, id, data) => {
      const store = storeFor(table);
      assert.ok(store, `unexpected table ${table}`);
      if (store.has(id)) return { ok: true, created: false, row: { id, data: store.get(id) } };
      store.set(id, data);
      return { ok: true, created: true, row: { id, data } };
    },
    claudeCall: async () => {
      if (!claudePayload) throw new Error('AI must not run unless mocked');
      return { content: [{ type: 'text', text: JSON.stringify(claudePayload) }] };
    }
  };
  registerKamukHoldingsCrm(app, deps);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const tokenA = signToken({ role: 'student', studentId: 'KAM-TEST-01', name: 'QA Student A', sub: 'KAM-TEST-01' }, 300);
  const tokenB = signToken({ role: 'student', studentId: 'KAM-TEST-02', name: 'QA Student B', sub: 'KAM-TEST-02' }, 300);
  const tokenEnabled = signToken({ role: 'student', studentId: 'KAM-TEST-03', name: 'QA Enabled', sub: 'KAM-TEST-03' }, 300);
  const trainerToken = signToken({ role: 'trainer', name: 'QA Supervisor', sub: 'qa-supervisor' }, 300);
  const course = passingCoursePayload();
  const doneSteps = course.done;
  const goldAnswers = readyHomeAnswers();
  HOME_CASES.forEach((item) => {
    const graded = gradeHomeAnswer(item, goldAnswers[item.id], { previousWords: 40 });
    assert.equal(graded.ready, true, `${item.id} gold should certify: ${graded.message}`);
  });
  const terse = gradeHomeAnswer(HOME_CASES[0], 'I will help today.', { previousWords: 0 });
  assert.equal(terse.ready, false);
  assert.ok(/substance/i.test(terse.message));

  const day = new Date('2026-08-17T16:00:00-06:00');
  let delayState = { lastActivityAt: new Date(day.getTime() - DELAY_GAP_MS - 1000).toISOString(), delayDayKey: crDateKey(day), delayStrikes: 0 };
  delayState = applyActivityHeartbeat(delayState, day);
  delayState = applyActivityHeartbeat(delayState, new Date(day.getTime() + DELAY_GAP_MS + 2000));
  delayState = applyActivityHeartbeat(delayState, new Date(day.getTime() + 2 * DELAY_GAP_MS + 4000));
  assert.ok(delayState.delayStrikes >= 3);
  assert.equal(delayState.delayPenalty, true);
  const overnight = applyActivityHeartbeat(delayState, new Date('2026-08-18T09:00:00-06:00'));
  assert.equal(overnight.delayStrikes, 0);
  assert.equal(overnight.delayPenalty, false);
  const delayedScore = applyQualityGates(scoreFromErrors([]), { delayPenalty: true });
  assert.ok(delayedScore.casePoints <= 9);
  assert.ok(delayedScore.errors.some((item) => item.code === 'delay-strikes'));

  const aiLike = detectAssistSignals(AI_EMAIL, { previousWords: 0 });
  assert.equal(aiLike.blockPrize, true);

  const gatedByIntegrity = applyQualityGates(scoreFromErrors([]), { integrity: aiLike });
  assert.equal(gatedByIntegrity.prizeEligible, false);
  assert.equal(gatedByIntegrity.competitionEligible, false);

  function certify(homeAnswers) {
    return Object.assign({}, course, { homeAnswers: homeAnswers || {} });
  }

  async function request(path, token, body, expectOk = true) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (expectOk) assert.equal(response.ok, true, `${path}: ${JSON.stringify(data)}`);
    return { status: response.status, data };
  }

  // Nesting denial before certification.
  const denied = await request('/kamuk-holdings/crm/presence', tokenA, { status: 'online' }, false);
  assert.equal(denied.status, 403);
  assert.equal(denied.data.code, 'NESTING_REQUIRED');

  const enabledAccess = await request('/kamuk-holdings/crm/training/progress', tokenEnabled);
  assert.equal(enabledAccess.data.crmEnabled, true);
  const enabledDesk = await request('/kamuk-holdings/crm/presence', tokenEnabled, { status: 'online' });
  assert.equal(enabledDesk.data.employee.id, 'KAM-TEST-03');

  const incomplete = await request('/kamuk-holdings/crm/training/progress', tokenA, {
    done: doneSteps,
    homeAnswers: readyHomeAnswers()
  });
  assert.equal(incomplete.data.complete, false);
  assert.equal(incomplete.data.courseComplete, false);
  assert.ok(!incomplete.data.nestingCompletedAt);

  const failedQuiz = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign({}, course, {
    quizAnswers: { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 2, q7: 0, q8: 2, q9: 0, q10: 2 },
    homeAnswers: readyHomeAnswers()
  }));
  assert.equal(failedQuiz.data.quiz.passed, false);
  assert.ok(!failedQuiz.data.nestingCompletedAt);

  const progress = await request('/kamuk-holdings/crm/training/progress', tokenA, certify(readyHomeAnswers()));
  assert.ok(progress.data.nestingCompletedAt);
  assert.equal(progress.data.complete, true);
  assert.equal(progress.data.courseComplete, true);
  assert.ok(progress.data.quiz.passed);
  assert.equal(progress.data.casesRulesAccepted, false);
  const rules = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign(certify(readyHomeAnswers()), { acceptCasesRules: true }));
  assert.equal(rules.data.casesRulesAccepted, true);
  const rulesAgain = await request('/kamuk-holdings/crm/training/progress', tokenA);
  assert.equal(rulesAgain.data.casesRulesAccepted, true);
  assert.ok(rulesAgain.data.homeAnswers && rulesAgain.data.homeAnswers.hc1);
  assert.equal(rulesAgain.data.deskGuideCompleted, false);
  const goldFormato = gradeFormatoE(GOLD_EMAIL);
  assert.equal(goldFormato.ok, true, 'gold Formato E: ' + goldFormato.missing.join(' · '));
  const weakFormato = gradePracticeTouch({ email: WEAK_PRACTICE_EMAIL });
  assert.equal(weakFormato.ok, false);
  const practiceMissing = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign(certify(readyHomeAnswers()), { practiceCaseId: 'gp1' }), false);
  assert.equal(practiceMissing.status, 400);
  assert.equal(practiceMissing.data.code, 'FORMATO_E');
  assert.ok(Array.isArray(practiceMissing.data.missing) && practiceMissing.data.missing.length >= 1);
  const practiceWeak = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign(certify(readyHomeAnswers()), {
    practiceCaseId: 'gp1',
    practiceEmail: WEAK_PRACTICE_EMAIL
  }), false);
  assert.equal(practiceWeak.status, 400);
  assert.equal(practiceWeak.data.code, 'FORMATO_E');
  const practiceOne = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign(certify(readyHomeAnswers()), {
    practiceCaseId: 'gp1',
    practiceEmail: GOLD_EMAIL,
    practiceNote: PRACTICE_GOLD_NOTE
  }));
  assert.equal(practiceOne.data.deskGuideCompleted, false);
  assert.ok(Array.isArray(practiceOne.data.deskGuideDone) && practiceOne.data.deskGuideDone.indexOf('gp1') >= 0);
  const practiceClaim = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: 'PRACTICE-gp1' }, false);
  assert.equal(practiceClaim.status, 400);
  assert.equal(practiceClaim.data.code, 'PRACTICE_ONLY');
  const practiceResolve = await request('/kamuk-holdings/crm/case/resolve', tokenA, { caseId: 'KH-PRAC-GP1' }, false);
  assert.equal(practiceResolve.status, 400);
  assert.equal(practiceResolve.data.code, 'PRACTICE_ONLY');
  const guide = await request('/kamuk-holdings/crm/training/progress', tokenA, Object.assign(certify(readyHomeAnswers()), { acceptDeskGuide: true }));
  assert.equal(guide.data.deskGuideCompleted, true);
  assert.equal(guide.data.deskGuideDone.length, 10);
  const guideAgain = await request('/kamuk-holdings/crm/training/progress', tokenA);
  assert.equal(guideAgain.data.deskGuideCompleted, true);

  await request('/kamuk-holdings/crm/training/progress', tokenB, certify(readyHomeAnswers()));

  const presence = await request('/kamuk-holdings/crm/presence', tokenA, { status: 'online' });
  assert.equal(presence.data.employee.id, 'KAM-TEST-01');

  const pool = await request('/kamuk-holdings/crm/pool', tokenA);
  assert.ok(pool.data.fresh.length >= 40);
  const firstCaseId = pool.data.fresh[0].caseId;
  const firstWorkItemId = pool.data.fresh[0].workItemId;

  // Atomic double-claim rejection.
  const claimA = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: firstWorkItemId });
  assert.equal(claimA.data.assignment.caseId, firstCaseId);
  const claimConflict = await request('/kamuk-holdings/crm/case/claim', tokenB, { workItemId: firstWorkItemId }, false);
  assert.equal(claimConflict.status, 409);

  assert.equal(isInternalOnly({ id: 'KH-1084' }), true);
  assert.equal(isInternalOnly({ id: 'KH-1042' }), false);
  assert.equal(gradeCallTurn(GOLD_CALL).amr, true);
  assert.equal(gradeCallTurn(BAD_CALL).pinAsk, true);
  assert.equal(gradeCallTurn(BAD_CALL).quality, 'poor');
  const freezeCase = { id: 'KH-1042', templateId: 'KH-1042', client: { name: 'Marta Rivera' }, mood: 'distressed' };
  const goodScript = nextCallTurn({ caseData: freezeCase, agentText: GOLD_CALL, mood: 'distressed', score: 40 });
  const badScript = nextCallTurn({ caseData: freezeCase, agentText: BAD_CALL, mood: 'distressed', score: 40 });
  assert.ok(goodScript.score > 40);
  assert.ok(badScript.score < 40);
  assert.ok(openingLine(freezeCase).toLowerCase().includes('frozen') || openingLine(freezeCase).toLowerCase().includes('third'));

  const practiceCall = await request('/kamuk-holdings/crm/call/token', tokenA, { caseId: 'KH-PRAC-GP1' });
  assert.ok(practiceCall.data.firstMessage);
  assert.ok(practiceCall.data.voiceId);
  const practiceGood = await request('/kamuk-holdings/crm/call/turn', tokenA, {
    caseId: 'KH-PRAC-GP1', text: GOLD_CALL, mood: practiceCall.data.mood, score: 40
  });
  assert.ok(practiceGood.data.reply);
  assert.equal(practiceGood.data.amr, true);
  const practiceBad = await request('/kamuk-holdings/crm/call/turn', tokenA, {
    caseId: 'KH-PRAC-GP1', text: BAD_CALL, mood: 'distressed', score: 40
  });
  assert.ok(practiceBad.data.coaching && practiceBad.data.coaching.length >= 1);
  const liveCall = await request('/kamuk-holdings/crm/call/token', tokenA, { caseId: firstCaseId });
  assert.ok(liveCall.data.firstMessage);
  const internalCall = await request('/kamuk-holdings/crm/call/token', tokenA, { caseId: 'KH-1084' }, false);
  assert.equal(internalCall.status, 400);
  assert.equal(internalCall.data.code, 'NO_CLIENT_CALL');

  // Mandatory email + note.
  const missingEvidence = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: firstCaseId,
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Documented the investigation and restored access with a timed callback before close of business today.',
      nextStep: 'Call the client before 4:45 PM with confirmation.'
    }
  }, false);
  assert.equal(missingEvidence.status, 400);
  assert.equal(missingEvidence.data.code, 'TOUCH_EVIDENCE_REQUIRED');

  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: firstCaseId,
    type: 'note',
    payload: { channel: 'Internal note', text: 'Reviewed evidence and documented the action path for this touch.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: firstCaseId,
    type: 'email',
    payload: {
      subject: 'Update on your case',
      body: 'Hello, I reviewed your case because the timeline matters. I own the next step and will call you today before 4:45 p.m.',
      to: 'client@example.com'
    }
  });
  for (const key of ['acknowledge', 'note', 'next-step']) {
    await request('/kamuk-holdings/crm/case/action', tokenA, {
      caseId: firstCaseId,
      action: { key, label: key, at: new Date().toISOString() }
    });
  }

  // AI pending when Anthropic is unavailable.
  const pending = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: firstCaseId,
    risk: { type: 'Operational', probability: 'Medium', impact: 'High', amlStage: 'None' },
    resolution: {
      disposition: 'Flagged AA — awaiting client action',
      summary: 'Asked the client for the missing authorization letter and parked the case as AA with a review date.',
      nextStep: 'Review the client upload tomorrow at 10:00 a.m.'
    },
    durationSec: 120
  });
  assert.equal(pending.data.evaluation.pendingEvaluation, true);
  assert.equal(pending.data.evaluation.pointsAwarded, 0);
  assert.ok(pending.data.nextWorkItem);
  assert.equal(pending.data.nextWorkItem.touchNumber, 2);

  // Prior agent cannot claim own follow-up.
  const selfFollow = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: pending.data.nextWorkItem.workItemId }, false);
  assert.equal(selfFollow.status, 409);

  // Student B takes follow-up and resolves with mocked Alice scoring.
  process.env.ANTHROPIC_API_KEY = 'test-key';
  claudePayload = {
    errors: [
      { code: 'tone', label: 'Tone drift', evidence: 'One sentence sounded defensive.' },
      { code: 'timeline', label: 'Soft timeline', evidence: 'Next step lacked an exact clock time.' }
    ],
    summary: 'Solid handoff with two deductions.',
    strengths: ['Clear ownership', 'Useful note'],
    improvements: ['Tighten the timed next step'],
    dimensions: { English: 82, Judgment: 80, Compliance: 78, Documentation: 84 }
  };
  const claimB = await request('/kamuk-holdings/crm/case/claim', tokenB, { workItemId: pending.data.nextWorkItem.workItemId });
  assert.equal(claimB.data.assignment.touchNumber, 2);
  assert.ok((claimB.data.assignment.history || []).length >= 1);

  await request('/kamuk-holdings/crm/case/event', tokenB, {
    caseId: firstCaseId,
    type: 'note',
    payload: { channel: 'Internal note', text: GOLD_NOTE, at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenB, {
    caseId: firstCaseId,
    type: 'email',
    payload: {
      subject: 'Case closed',
      body: GOLD_EMAIL,
      to: 'client@example.com'
    }
  });
  for (const key of ['acknowledge', 'note', 'next-step', 'operational-risk', 'escalate-operations']) {
    await request('/kamuk-holdings/crm/case/action', tokenB, {
      caseId: firstCaseId,
      action: { key, label: key, at: new Date().toISOString() }
    });
  }

  const scored = await request('/kamuk-holdings/crm/case/resolve', tokenB, {
    caseId: firstCaseId,
    risk: { type: 'Operational', probability: 'Low', impact: 'Medium', amlStage: 'None' },
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Validated the uploaded authorization, restored the operational path and confirmed the outcome with the client.',
      nextStep: 'Send written confirmation before 3:00 p.m. today.'
    },
    durationSec: 180
  });
  assert.equal(scored.data.evaluation.casePoints, 8);
  assert.equal(scored.data.evaluation.competitionEligible, true);
  assert.equal(scored.data.evaluation.prizeEligible, true);
  assert.equal(scored.data.evaluation.pointsAwarded, 8);
  assert.equal(scored.data.evaluation.pendingEvaluation, false);

  // Quality gate: below 7 awards no competition points.
  claudePayload = {
    errors: Array.from({ length: 4 }, (_, i) => ({ code: `e${i}`, label: `Error ${i}`, evidence: 'Evidence' })),
    summary: 'Needs coaching.',
    strengths: [],
    improvements: ['Rebuild the email'],
    dimensions: { English: 50, Judgment: 55, Compliance: 40, Documentation: 45 }
  };
  const pool2 = await request('/kamuk-holdings/crm/pool', tokenA);
  const second = pool2.data.fresh.find((item) => item.caseId !== firstCaseId);
  assert.ok(second);
  await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: second.workItemId });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: second.caseId,
    type: 'note',
    payload: { channel: 'Internal note', text: 'Brief factual note for the second touch.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: second.caseId,
    type: 'email',
    payload: {
      subject: 'Update',
      body: 'Hello, I am writing because we need clarity. However I own the next check and will call tomorrow at 9:00 a.m.',
      to: 'client@example.com'
    }
  });
  const gated = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: second.caseId,
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Closed after reviewing the available evidence and confirming the outcome with the client on the recorded channel.',
      nextStep: 'Call tomorrow at 9:00 a.m. with confirmation.'
    },
    durationSec: 90
  });
  assert.ok(gated.data.evaluation.casePoints < PRIZE_SCORE);
  assert.equal(gated.data.evaluation.competitionEligible, false);
  assert.equal(gated.data.evaluation.pointsAwarded, 0);

  claudePayload = { errors: [], summary: 'Polished but assisted.', strengths: [], improvements: [], dimensions: { Resolution: 90, Language: 90, Explanation: 90, Execution: 90, Transition: 90, Connectors: 90, Documentation: 90, Clarity: 90 } };
  const poolAi = await request('/kamuk-holdings/crm/pool', tokenA);
  const aiCase = poolAi.data.fresh.find((item) => item.caseId !== firstCaseId && item.caseId !== second.caseId);
  assert.ok(aiCase);
  await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: aiCase.workItemId });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: aiCase.caseId,
    type: 'note',
    payload: { channel: 'Internal note', text: GOLD_NOTE, at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: aiCase.caseId,
    type: 'email',
    payload: { subject: 'Update', body: AI_EMAIL, to: 'client@example.com' }
  });
  const aiScored = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: aiCase.caseId,
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Validated the uploaded authorization, restored the operational path and confirmed the outcome with the client.',
      nextStep: 'Send written confirmation before 3:00 p.m. today.'
    },
    durationSec: 90
  });
  assert.equal(aiScored.data.evaluation.prizeEligible, false);
  assert.equal(aiScored.data.evaluation.competitionEligible, false);
  assert.equal(aiScored.data.evaluation.pointsAwarded, 0);

  const board = await request('/kamuk-holdings/crm/leaderboard', tokenB);
  assert.equal(board.data.weekKey, weekKeyCR());
  assert.ok(board.data.board.length >= 1);
  const rowB = board.data.board.find((row) => row.studentId === 'KAM-TEST-02');
  assert.ok(rowB.weeklyPoints >= 8);
  assert.ok(rowB.resolved >= 1);

  const supervisor = await request('/kamuk-holdings/crm/supervisor?product=kamuk', trainerToken);
  assert.ok(supervisor.data.leaderboard.length >= 1);
  assert.ok(supervisor.data.winner);
  assert.ok(supervisor.data.summary.freshPool >= 0);
  assert.ok(supervisor.data.recentTouches.length >= 2);
  assert.ok(Array.isArray(supervisor.data.training));
  const trainA = supervisor.data.training.find((row) => row.studentId === 'KAM-TEST-01');
  assert.ok(trainA);
  assert.equal(trainA.quizPassed, true);
  assert.equal(trainA.homeReady, 10);
  assert.ok(trainA.nestingCompletedAt);
  assert.ok(Array.isArray(supervisor.data.emails));
  const emailAudit = supervisor.data.emails.find((row) => row.studentId === 'KAM-TEST-02');
  assert.ok(emailAudit);
  assert.equal(emailAudit.formatoE, true);
  const dossier = await request('/kamuk-holdings/crm/supervisor/student/KAM-TEST-02?product=kamuk', trainerToken);
  assert.equal(dossier.data.dossier.studentId, 'KAM-TEST-02');
  const ask = await request('/kamuk-holdings/crm/supervisor/ask?product=kamuk', trainerToken, {
    studentId: 'KAM-TEST-02',
    question: 'Este correo pasa Formato E y esta listo para el desk?'
  });
  assert.ok(ask.data.answer);
  const report = await request('/kamuk-holdings/crm/supervisor/report?product=kamuk', trainerToken, { studentId: 'KAM-TEST-02' });
  assert.ok(report.data.report);
  assert.ok(report.data.decision);

  const coach = await request('/kamuk-holdings/crm/supervisor/coaching', trainerToken, {
    studentId: 'KAM-TEST-02',
    touchId: scored.data.touchId,
    note: 'Strong handoff. Keep the timed next step explicit.'
  });
  assert.ok(coach.data.coaching.id);

  // Product isolation: Infinity student cannot use Kamuk routes.
  const infinityToken = signToken({ role: 'student', studentId: 'INF-TEST-01', name: 'Infinity Student', sub: 'INF-TEST-01' }, 300);
  await request('/infinity-holdings/crm/training/progress', infinityToken, certify(readyHomeAnswers()));
  const cross = await request('/kamuk-holdings/crm/presence', infinityToken, { status: 'online' }, false);
  assert.equal(cross.status, 403);
  await request('/infinity-holdings/crm/presence', infinityToken, { status: 'online' });
  const infinityPool = await request('/infinity-holdings/crm/pool', infinityToken);
  assert.ok(infinityPool.data.fresh.length >= 40);
  assert.ok([...infinitySessions.keys()].some((id) => id.includes('infinity')));
  assert.ok(![...sessions.keys()].some((id) => id.includes('INF-TEST-01')));

  // Round fairness: after A and B each have a fresh touch, A may claim another fresh only if everyone certified has touched.
  // Both certified students already touched, so round should be open.
  const pool3 = await request('/kamuk-holdings/crm/pool', tokenA);
  const third = pool3.data.fresh[0];
  const claimThird = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: third.workItemId });
  assert.equal(claimThird.data.ok, true);

  await new Promise((resolve) => server.close(resolve));
  console.log('Kamuk Holdings nesting floor integration test passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
