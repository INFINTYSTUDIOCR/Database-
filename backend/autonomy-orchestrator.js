/**
 * Autonomy orchestrator — closed loop across Jill / Alice / Nexora.
 * measure → decide → enforce (prompt) → verify on next score.
 * Does not redesign UI; writes student.autonomy and hard prompt notes.
 */
'use strict';

const DRILL_PASS = 70;
const SESSION_PASS = 75;
const NEXORA_PASS = 70;

const ACTIONS = {
  JILL_DRILL: 'jill_drill_reinforce',
  JILL_SESSION: 'jill_session_focus',
  ALICE_FOCUS: 'alice_focus',
  NEXORA_PRACTICE: 'nexora_practice',
  HOLD: 'hold_course'
};

function num(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : (fallback != null ? fallback : null);
}

function ensure(student) {
  if (!student) return null;
  student.autonomy = student.autonomy || {
    version: 1,
    nextAction: ACTIONS.HOLD,
    reason: '',
    focusTopics: [],
    targetScore: SESSION_PASS,
    tutor: 'jill',
    lastMeasured: null,
    lastVerified: null,
    improved: null,
    history: []
  };
  if (!Array.isArray(student.autonomy.history)) student.autonomy.history = [];
  if (!Array.isArray(student.autonomy.focusTopics)) student.autonomy.focusTopics = [];
  return student.autonomy;
}

function weakTopics(student) {
  const sl = student?.sharedLearner || {};
  const list = []
    .concat(student?.quizWeakKpis || [])
    .concat(student?.nemesisState?.reinforcement || [])
    .concat(sl.weakTopics || [])
    .concat(student?.jillCalibration?.route?.weakKpis || []);
  return Array.from(new Set(list.map((t) => String(t).trim()).filter(Boolean))).slice(0, 8);
}

function measure(student) {
  const sl = student?.sharedLearner || {};
  const drill = num(
    student?.nemesisState?.lastJillProScore ?? student?.jillRapidDrill?.lastScore,
    null
  );
  const jillSession = num(sl.lastJillScore ?? student?.jillPulse?.lastScore, null);
  const nexora = num(sl.lastNexoraScore, null);
  const aliceSessions = student?.aliceSessions || [];
  const lastAlice = num(
    sl.lastAliceScore
      ?? (aliceSessions.length ? aliceSessions[aliceSessions.length - 1].score : null),
    null
  );
  const weak = weakTopics(student);
  const jillVictory = student?.infinityVictory || {};
  const aliceVictory = student?.aliceVictory || {};
  const drillPillarMet = jillVictory?.pillars?.drill?.met === true
    || (drill != null && drill >= DRILL_PASS);
  const jillSessionMet = jillVictory?.pillars?.session?.met === true
    || (jillSession != null && jillSession >= SESSION_PASS);
  const nexoraMet = aliceVictory?.pillars?.nexora?.met === true
    || (nexora != null && nexora >= NEXORA_PASS);

  return {
    at: new Date().toISOString(),
    drillScore: drill,
    jillSessionScore: jillSession,
    aliceSessionScore: lastAlice,
    nexoraScore: nexora,
    weakTopics: weak,
    drillPillarMet,
    jillSessionMet,
    nexoraMet,
    confusion: num(student?.aiProfile?.learningPrefs?.confusionCount, 0) || 0
  };
}

/**
 * Policy (simple, enforceable) — first match wins:
 * 1) Weak drill / reinforcement KPIs → Jill Rapid drill
 * 2) Weak Jill session / confusion → Jill session focus
 * 3) Foundations OK but Nexora weak → Nexora practice
 * 4) Alice session weak → Alice focus
 * 5) Else hold course
 */
function decide(student, opts) {
  if (!student) return null;
  const auto = ensure(student);
  const m = measure(student);
  const prevAction = auto.nextAction;
  const prevTopics = (auto.focusTopics || []).slice(0, 8);

  let nextAction = ACTIONS.HOLD;
  let reason = 'Scores OK — keep current path.';
  let tutor = 'jill';
  let targetScore = SESSION_PASS;
  let focus = m.weakTopics.slice(0, 5);
  const reinforce = (student?.nemesisState?.reinforcement || []).slice(0, 5);

  if (!m.drillPillarMet || (m.drillScore != null && m.drillScore < DRILL_PASS) || reinforce.length) {
    nextAction = ACTIONS.JILL_DRILL;
    reason = m.drillScore != null && m.drillScore < DRILL_PASS
      ? `Drill ${m.drillScore}% < ${DRILL_PASS}% — reinforce weak KPIs.`
      : 'Reinforcement KPIs pending — Rapid drill next.';
    tutor = 'jill';
    targetScore = DRILL_PASS;
    focus = (reinforce.length ? reinforce : focus).slice(0, 5);
  } else if (!m.jillSessionMet || (m.jillSessionScore != null && m.jillSessionScore < SESSION_PASS) || m.confusion >= 2) {
    nextAction = ACTIONS.JILL_SESSION;
    reason = m.confusion >= 2
      ? 'Confusion signals — simplify one idea in Jill session.'
      : `Jill session ${m.jillSessionScore ?? 'n/a'} < ${SESSION_PASS} — focus practice.`;
    tutor = 'jill';
    targetScore = SESSION_PASS;
  } else if (!m.nexoraMet || (m.nexoraScore != null && m.nexoraScore < NEXORA_PASS)) {
    nextAction = ACTIONS.NEXORA_PRACTICE;
    reason = m.nexoraScore != null
      ? `Nexora ${m.nexoraScore}% < ${NEXORA_PASS}% — CS simulation next.`
      : 'Foundations OK — run Nexora simulation.';
    tutor = 'nexora';
    targetScore = NEXORA_PASS;
  } else if (m.aliceSessionScore != null && m.aliceSessionScore < SESSION_PASS) {
    nextAction = ACTIONS.ALICE_FOCUS;
    reason = `Alice session ${m.aliceSessionScore}% < ${SESSION_PASS}% — Nexus focus.`;
    tutor = 'alice';
    targetScore = SESSION_PASS;
  } else {
    nextAction = ACTIONS.HOLD;
    reason = 'Pillars on track — continue current tutor path.';
    tutor = 'alice';
    targetScore = SESSION_PASS;
  }

  let improved = null;
  if (opts?.trigger?.score != null && prevAction && prevAction !== ACTIONS.HOLD) {
    const sc = Number(opts.trigger.score);
    improved = sc >= (auto.targetScore || targetScore);
    auto.lastVerified = {
      at: m.at,
      prevAction,
      score: sc,
      improved,
      topics: prevTopics
    };
  }

  auto.nextAction = nextAction;
  auto.reason = reason;
  auto.focusTopics = focus;
  auto.targetScore = targetScore;
  auto.tutor = tutor;
  auto.lastMeasured = m;
  auto.updatedAt = m.at;
  auto.improved = improved;

  auto.history.push({
    at: m.at,
    action: nextAction,
    reason,
    focus,
    trigger: opts?.trigger
      ? { source: opts.trigger.source, kind: opts.trigger.kind, score: opts.trigger.score }
      : null,
    improved
  });
  if (auto.history.length > 24) auto.history = auto.history.slice(-24);

  return auto;
}

function actionLabel(action) {
  switch (action) {
    case ACTIONS.JILL_DRILL: return 'Jill Rapid drill (refuerzo KPI)';
    case ACTIONS.JILL_SESSION: return 'Sesión Jill (foco Foundations)';
    case ACTIONS.ALICE_FOCUS: return 'Sesión Alice (Nexus / connectors)';
    case ACTIONS.NEXORA_PRACTICE: return 'Nexora Lab (simulación CS)';
    default: return 'Seguir el camino actual';
  }
}

/**
 * Hard enforcement note for LLM prompts.
 * tutor = 'jill' | 'alice' | 'nexora' | 'claire' | 'any'
 */
function buildEnforceNote(student, tutor) {
  const auto = student?.autonomy;
  if (!auto?.nextAction) return '';
  const focus = (auto.focusTopics || []).slice(0, 5);
  const focusLine = focus.length ? focus.join(', ') : 'the weakest recent topic';
  const lines = [
    'AUTONOMY ORCHESTRATOR (ENFORCE — not optional):',
    `- Next system action: ${actionLabel(auto.nextAction)} (${auto.nextAction})`,
    `- Why: ${auto.reason || 'adapt to weak KPIs'}`,
    `- Focus topics this turn: ${focusLine}`,
    `- Target score: ${auto.targetScore ?? SESSION_PASS}+`
  ];

  const t = String(tutor || 'any').toLowerCase();
  if (t === 'jill' || t === 'any') {
    if (auto.nextAction === ACTIONS.JILL_DRILL || auto.nextAction === ACTIONS.JILL_SESSION) {
      lines.push(`- YOU ARE ON DUTY: stay on Foundations. Drill/practice ONLY: ${focusLine}. Do not invent a new track.`);
    } else if (auto.nextAction === ACTIONS.NEXORA_PRACTICE) {
      lines.push('- Foundations look ready — after this turn, nudge student toward Nexora Lab for CS practice (do not teach Nexora content here).');
    } else if (auto.nextAction === ACTIONS.ALICE_FOCUS) {
      lines.push('- After this Foundations beat, student should continue with Alice for Nexus connectors (do not teach Nexus linkers as Jill).');
    }
  }
  if (t === 'alice' || t === 'any') {
    if (auto.nextAction === ACTIONS.ALICE_FOCUS || auto.nextAction === ACTIONS.HOLD) {
      lines.push(`- YOU ARE ON DUTY: Nexus English. Reinforce: ${focusLine}. American English + CR Spanish only on explicame.`);
    } else if (auto.nextAction === ACTIONS.JILL_DRILL || auto.nextAction === ACTIONS.JILL_SESSION) {
      lines.push('- Student still needs Jill Foundations reinforcement — keep Alice light; send them back to Jill/drill for weak KPIs.');
    } else if (auto.nextAction === ACTIONS.NEXORA_PRACTICE) {
      lines.push('- Point student to Nexora Lab for scored CS simulation after a short warm-up.');
    }
  }
  if (t === 'nexora' || t === 'any') {
    if (auto.nextAction === ACTIONS.NEXORA_PRACTICE) {
      lines.push(`- YOU ARE ON DUTY: run a clean CS scenario. Watch: ${focusLine}.`);
    } else if (auto.nextAction === ACTIONS.JILL_DRILL || auto.nextAction === ACTIONS.JILL_SESSION) {
      lines.push('- Foundations gaps remain — keep scenario simple; student should return to Jill drill after.');
    }
  }
  if (auto.lastVerified) {
    lines.push(
      `- Last verify: action ${auto.lastVerified.prevAction} → score ${auto.lastVerified.score}`
      + (auto.lastVerified.improved ? ' (improved ✓)' : ' (not yet — keep reinforcing)')
    );
  }
  return lines.join('\n');
}

function snapshot(student) {
  const auto = ensure(student);
  return {
    nextAction: auto.nextAction,
    reason: auto.reason,
    focusTopics: auto.focusTopics || [],
    targetScore: auto.targetScore,
    tutor: auto.tutor,
    label: actionLabel(auto.nextAction),
    lastMeasured: auto.lastMeasured || null,
    lastVerified: auto.lastVerified || null,
    improved: auto.improved,
    updatedAt: auto.updatedAt || null
  };
}

module.exports = {
  ACTIONS,
  ensure,
  measure,
  decide,
  buildEnforceNote,
  snapshot,
  actionLabel
};
