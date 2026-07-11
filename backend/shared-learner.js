/**
 * Shared learner profile — quizzes, evals, prefs, calibration
 * used by Jill, Alice, and Nexora in the same adaptation layer.
 */
'use strict';

function ensure(student) {
  if (!student) return null;
  student.sharedLearner = student.sharedLearner || {
    events: [],
    weakTopics: [],
    lastNexoraScore: null,
    lastJillScore: null,
    lastAliceNote: null,
    updatedAt: null
  };
  if (!Array.isArray(student.sharedLearner.events)) student.sharedLearner.events = [];
  return student.sharedLearner;
}

function recordEvent(student, event) {
  if (!student) return false;
  const sl = ensure(student);
  const row = {
    at: new Date().toISOString(),
    source: String(event.source || 'unknown').slice(0, 40),
    kind: String(event.kind || 'note').slice(0, 40),
    score: event.score != null ? Number(event.score) : null,
    topics: Array.isArray(event.topics) ? event.topics.slice(0, 8).map((t) => String(t).slice(0, 60)) : [],
    summary: String(event.summary || '').slice(0, 240)
  };
  sl.events.push(row);
  if (sl.events.length > 48) sl.events = sl.events.slice(-48);
  if (row.topics.length) {
    const merged = [...(sl.weakTopics || []), ...row.topics];
    sl.weakTopics = Array.from(new Set(merged)).slice(-16);
  }
  if (row.source === 'nexora' && row.score != null) sl.lastNexoraScore = row.score;
  if (row.source === 'jill' && row.score != null) sl.lastJillScore = row.score;
  if (row.source === 'alice' && row.summary) sl.lastAliceNote = row.summary;
  sl.updatedAt = row.at;
  return true;
}

function buildSharedLearnerNote(student) {
  if (!student) return '';
  const parts = [];
  const lp = student.aiProfile?.learningPrefs || {};
  const cal = student.jillCalibration;
  const sl = student.sharedLearner || {};
  const weak = []
    .concat(student.quizWeakKpis || [])
    .concat(sl.weakTopics || [])
    .concat(cal?.route?.weakKpis || []);
  const uniqWeak = Array.from(new Set(weak.map((w) => String(w).trim()).filter(Boolean))).slice(0, 10);

  if (uniqWeak.length) parts.push(`Weak / reinforce topics: ${uniqWeak.join(', ')}`);
  if (lp.confusionCount >= 2) parts.push(`Confusion signals: ${lp.confusionCount} — simplify + check understanding`);
  if (lp.prefersShort) parts.push('Prefers short delivery');
  if (lp.prefersExamples) parts.push('Prefers concrete examples first');
  if (lp.prefersSlow) parts.push('Prefers slower pace');
  if (lp.prefersSpanish) parts.push('May need brief Spanish bridge');
  if (lp.prefersVisual) parts.push('Prefers visual / board support');
  if (cal?.initialDone && cal.route?.summary) parts.push(`Jill calibration route: ${cal.route.summary}`);
  if (sl.lastJillScore != null) parts.push(`Last Jill session score: ${sl.lastJillScore}`);
  if (sl.lastNexoraScore != null) parts.push(`Last Nexora score: ${sl.lastNexoraScore}`);
  if (student.aliceVictory?.level) parts.push(`Alice victory level: ${student.aliceVictory.level}`);
  if (student.jillPulse?.streak != null) parts.push(`Jill pulse streak: ${student.jillPulse.streak}`);

  const recent = (sl.events || []).slice(-4);
  if (recent.length) {
    parts.push('Recent learning events:');
    recent.forEach((e) => {
      parts.push(`- [${e.source}/${e.kind}] ${e.summary || e.topics?.join(', ') || 'ok'}${e.score != null ? ` (score ${e.score})` : ''}`);
    });
  }

  if (!parts.length) return '';
  return `\nSHARED LEARNER (Jill + Alice + Nexora — same student brain):\n${parts.map((p) => (p.startsWith('-') ? p : `- ${p}`)).join('\n')}\nAdapt teaching to this profile. Do not ignore weak topics.`;
}

module.exports = {
  ensure,
  recordEvent,
  buildSharedLearnerNote
};
