/**
 * Kamuk trainer audit — login, duration, completions, email Q&A, AI decision report.
 * Kamuk data only. Never mix Infinity students.
 */
const { gradeFormatoE, gradePracticeTouch, HOME_CASES, floorState, validateTrainingProgress, REQUIRED_DONE, deskGuideDoneList } = require('./kamuk-holdings-floor');

function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 400);
}

function emailsFromTouch(touch) {
  const events = (touch.submission && touch.submission.events) || touch.emails || [];
  const out = [];
  events.forEach((event) => {
    const body = event && (event.body || event.text || event.detail);
    if (!body) return;
    if (event.type && event.type !== 'email' && event.type !== 'email-client') return;
    const graded = gradeFormatoE(body);
    out.push({
      studentId: touch.studentId,
      studentName: touch.studentName,
      caseId: touch.caseId,
      caseTitle: touch.caseTitle,
      touchId: touch.id || touch.touchId,
      at: event.at || touch.completedAt,
      subject: event.subject || event.label || '',
      body: String(body).slice(0, 4000),
      formatoE: Boolean(graded.ok),
      missing: graded.missing || [],
      words: graded.words || 0
    });
  });
  return out;
}

function collectEmails(touches, studentId) {
  const list = [];
  (touches || []).forEach((touch) => {
    if (studentId && touch.studentId !== studentId) return;
    emailsFromTouch(touch).forEach((item) => list.push(item));
  });
  return list.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 200);
}

function loginSummary(student) {
  const history = Array.isArray(student.loginHistory) ? student.loginHistory.slice(-20) : [];
  return {
    lastLoginAt: student.lastLoginAt || null,
    loginCount: Number(student.loginCount) || history.length || 0,
    history
  };
}

function durationSummary(touches, live) {
  const deskSec = (touches || []).reduce((sum, touch) => sum + (Number(touch.durationSec) || 0), 0);
  const callSec = (touches || []).reduce((sum, touch) => {
    const call = touch.submission && touch.submission.call;
    return sum + (Number((call && call.durationSec) || touch.callDurationSec) || 0);
  }, 0);
  const liveSec = Number(live && live.sessionSec) || 0;
  return {
    deskSec,
    callSec,
    liveSec,
    deskMin: Math.round(deskSec / 60),
    callMin: Math.round(callSec / 60)
  };
}

function trainingSummary(student, product) {
  const state = floorState(student, product);
  const validated = validateTrainingProgress({
    done: state.trainingDone,
    homeAnswers: state.homeAnswers,
    checks: state.courseChecks,
    quizAnswers: state.courseQuizAnswers,
    mockIndex: state.mockIndex,
    quizAttempts: state.quizAttempts
  });
  const home = (HOME_CASES || []).map((item) => {
    const text = (state.homeAnswers && state.homeAnswers[item.id]) || '';
    return {
      id: item.id,
      title: item.title,
      ready: Boolean((validated.homeStatus || []).find((row) => row.id === item.id && row.ready)),
      words: text ? String(text).trim().split(/\s+/).filter(Boolean).length : 0,
      excerpt: String(text).slice(0, 280)
    };
  });
  return {
    modulesDone: (validated.done || []).filter((step) => REQUIRED_DONE.includes(step)).length,
    modulesTotal: REQUIRED_DONE.length,
    quizScore: validated.quiz && validated.quiz.score,
    quizPassed: Boolean(validated.quiz && validated.quiz.passed),
    quizAttempts: Number(state.quizAttempts) || 0,
    homeReady: home.filter((item) => item.ready).length,
    homeTotal: home.length,
    home,
    courseComplete: Boolean(validated.courseComplete),
    nestingCompletedAt: state.nestingCompletedAt || null,
    deskGuideDone: deskGuideDoneList(state),
    delayStrikes: Number(state.delayStrikes) || 0,
    delayPenalty: Boolean(state.delayPenalty)
  };
}

function workSummary(touches) {
  const list = touches || [];
  return {
    handled: list.length,
    resolved: list.filter((touch) => touch.kind === 'resolved').length,
    pending: list.filter((touch) => touch.pendingEvaluation || (touch.evaluation && touch.evaluation.pendingEvaluation)).length,
    averageScore: list.length
      ? Math.round((list.reduce((sum, touch) => sum + (Number(touch.evaluation && touch.evaluation.casePoints) || 0), 0) / list.length) * 10) / 10
      : 0,
    cases: list.slice(0, 40).map((touch) => ({
      id: touch.id || touch.touchId,
      caseId: touch.caseId,
      title: touch.caseTitle,
      disposition: touch.disposition,
      durationSec: Number(touch.durationSec) || 0,
      score: touch.evaluation && touch.evaluation.casePoints,
      completedAt: touch.completedAt,
      pending: Boolean(touch.pendingEvaluation || (touch.evaluation && touch.evaluation.pendingEvaluation))
    }))
  };
}

function buildDossier({ studentId, student, product, touches, live }) {
  const emails = collectEmails(touches, studentId);
  const training = trainingSummary(student, product);
  const logins = loginSummary(student);
  const duration = durationSummary(touches, live);
  const work = workSummary(touches);
  const emailPass = emails.filter((item) => item.formatoE).length;
  return {
    studentId,
    name: clean(student.info && student.info.name || student.name || studentId, 100),
    product,
    logins,
    duration,
    training,
    work,
    emails,
    emailPass,
    emailFail: emails.length - emailPass,
    generatedAt: new Date().toISOString()
  };
}

function decide(dossier) {
  const reasons = [];
  if (!dossier.training.nestingCompletedAt) reasons.push('Nesting course is not complete.');
  if (!dossier.training.quizPassed) reasons.push('Certification quiz is not passed.');
  if (dossier.training.delayPenalty) reasons.push('Delay penalty is active — attendance/rhythm issue.');
  if (dossier.emailFail > 0) reasons.push(dossier.emailFail + ' emails fail Formato E.');
  if (dossier.training.homeReady < dossier.training.homeTotal) reasons.push('Written cases still open (' + dossier.training.homeReady + '/' + dossier.training.homeTotal + ').');
  if (!dossier.logins.lastLoginAt) reasons.push('No portal login recorded yet.');
  let decision = 'ready';
  let label = 'Listo para seguir en el desk';
  if (!dossier.training.nestingCompletedAt || !dossier.training.quizPassed) {
    decision = 'hold';
    label = 'Retener: terminar curso y certificación';
  } else if (dossier.emailFail >= 2 || dossier.training.delayPenalty) {
    decision = 'coach';
    label = 'Coaching urgente: correos / ritmo';
  } else if (reasons.length) {
    decision = 'watch';
    label = 'Vigilar esta semana';
  }
  return { decision, label, reasons };
}

function deterministicReport(dossier) {
  const verdict = decide(dossier);
  const lines = [
    'Reporte de auditoría Kamuk — ' + dossier.name + ' (' + dossier.studentId + ')',
    'Decisión: ' + verdict.label + ' [' + verdict.decision + ']',
    '',
    'Logins: ' + dossier.logins.loginCount + ' · último ' + (dossier.logins.lastLoginAt || '—'),
    'Duración desk: ' + dossier.duration.deskMin + ' min · llamadas ' + dossier.duration.callMin + ' min',
    'Curso: ' + dossier.training.modulesDone + '/' + dossier.training.modulesTotal + ' módulos · quiz ' + (dossier.training.quizPassed ? 'PASS' : 'FAIL') + ' ' + (dossier.training.quizScore || 0) + '%',
    'Casos escritos: ' + dossier.training.homeReady + '/' + dossier.training.homeTotal + ' · prácticas CRM ' + (dossier.training.deskGuideDone || []).join(', '),
    'Nesting: ' + (dossier.training.nestingCompletedAt || 'pendiente'),
    'Trabajo CRM: ' + dossier.work.handled + ' touches · ' + dossier.work.resolved + ' resolved · promedio ' + dossier.work.averageScore + '/10',
    'Correos: ' + dossier.emailPass + ' Formato E OK · ' + dossier.emailFail + ' fallan',
    '',
    verdict.reasons.length ? ('Hallazgos:\n- ' + verdict.reasons.join('\n- ')) : 'Sin hallazgos bloqueantes.',
    '',
    'Acción del trainer: ' + (verdict.decision === 'hold'
      ? 'No abrir más casos semanales hasta cerrar curso/certificación.'
      : (verdict.decision === 'coach'
        ? 'Revisá los correos que fallan Formato E (E1–E5 + conectores) y pedí reescritura.'
        : 'Podés avanzar. Revisá un correo al azar esta semana.'))
  ];
  return {
    ok: true,
    source: 'rules',
    decision: verdict.decision,
    label: verdict.label,
    reasons: verdict.reasons,
    report: lines.join('\n'),
    dossier
  };
}

function askFallback(dossier, question) {
  const q = String(question || '').toLowerCase();
  const verdict = decide(dossier);
  let answer = verdict.label + '. ' + (verdict.reasons[0] || 'El expediente está en orden.');
  if (/correo|email|formato/.test(q)) {
    answer = dossier.emails.length
      ? (dossier.emailFail + ' correos fallan Formato E de ' + dossier.emails.length + '. ' + (dossier.emails.find((item) => !item.formatoE)?.missing || []).join(' · '))
      : 'Todavía no hay correos de desk para auditar.';
  } else if (/login|entra|sesión|sesion/.test(q)) {
    answer = 'Logins: ' + dossier.logins.loginCount + '. Último: ' + (dossier.logins.lastLoginAt || 'sin registro') + '.';
  } else if (/duraci|tiempo|minut/.test(q)) {
    answer = 'Desk ' + dossier.duration.deskMin + ' min. Llamadas ' + dossier.duration.callMin + ' min.';
  } else if (/complet|curso|nesting|quiz/.test(q)) {
    answer = 'Módulos ' + dossier.training.modulesDone + '/' + dossier.training.modulesTotal + '. Quiz ' + (dossier.training.quizPassed ? 'aprobado' : 'no aprobado') + '. Nesting ' + (dossier.training.nestingCompletedAt ? 'completo' : 'pendiente') + '.';
  }
  return { ok: true, source: 'rules', answer, decision: verdict.decision, label: verdict.label };
}

function recordLoginPatch(student) {
  const at = new Date().toISOString();
  const history = Array.isArray(student && student.loginHistory) ? student.loginHistory.slice(-19) : [];
  history.push({ at, source: 'portal' });
  return {
    lastLoginAt: at,
    loginCount: (Number(student && student.loginCount) || 0) + 1,
    loginHistory: history
  };
}

module.exports = {
  collectEmails,
  buildDossier,
  deterministicReport,
  askFallback,
  recordLoginPatch,
  decide
};
