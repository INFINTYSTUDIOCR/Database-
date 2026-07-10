/**
 * Métricas de victoria  Jill (Foundations) y Alice (+ Nexora).
 * Vive en el cerebro; Jill y Nexora no se mezclan.
 */
const STREAK_REQUIRED = 30;
const DRILL_SCORE_REQUIRED = 70;
const JILL_SESSION_SCORE_REQUIRED = 75;
const NEXORA_SCORE_REQUIRED = 70;
const NEXORA_MIN_TALK_SEC = 45;

function bestDrillScore(student) {
  const ns = student?.nemesisState || {};
  if (ns.lastJillProScore != null) return parseInt(ns.lastJillProScore, 10) || 0;
  const runs = (student?.jillProNemesis || []).slice(-8);
  let best = 0;
  runs.forEach((r) => {
    const sc = parseInt(r.score, 10) || 0;
    if (sc > best) best = sc;
  });
  const rd = student?.jillRapidDrill || {};
  if (rd.lastScore != null) best = Math.max(best, parseInt(rd.lastScore, 10) || 0);
  return best;
}

function bestJillSessionScore(student) {
  let best = 0;
  if (student?.jillPulse?.lastScore != null) {
    best = Math.max(best, parseInt(student.jillPulse.lastScore, 10) || 0);
  }
  if (student?.jillPulse?.passed) {
    best = Math.max(best, 80);
  }
  (student?.jillSessions || []).forEach((s) => {
    best = Math.max(best, parseInt(s.score, 10) || 0);
  });
  const req = student?.jillGraduationRequest;
  if (req?.sessionScore != null) {
    best = Math.max(best, parseInt(req.sessionScore, 10) || 0);
  }
  return best;
}

function bestNexoraSession(student) {
  const sessions = (student?.nexoraSessions || []).slice().reverse();
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const score = parseInt(s.score, 10) || 0;
    const talk = parseInt(s.talkTime, 10) || 0;
    if (score >= NEXORA_SCORE_REQUIRED && talk >= NEXORA_MIN_TALK_SEC && !s.transferred) {
      return s;
    }
  }
  return null;
}

function streakValue(student) {
  const h = student?.jillGrowth?.habit || {};
  return Math.max(parseInt(h.streak, 10) || 0, parseInt(h.bestStreak, 10) || 0);
}

function aliceStreakValue(student) {
  const h = student?.aliceGrowth?.habit || student?.aliceHabit || {};
  return Math.max(parseInt(h.streak, 10) || 0, parseInt(h.bestStreak, 10) || 0);
}

function bestAliceSessionScore(student) {
  let best = 0;
  (student?.aliceSessions || []).forEach((s) => {
    best = Math.max(best, parseInt(s.score, 10) || 0);
  });
  return best;
}

/** Infinity Victory  solo Foundations / Jill (sin Nexora). */
function computeJillVictoryMetric(student) {
  const streak = streakValue(student);
  const drillScore = bestDrillScore(student);
  const sessionScore = bestJillSessionScore(student);

  const pillars = {
    streak: {
      label: 'Constancia Jill',
      required: STREAK_REQUIRED,
      current: streak,
      met: streak >= STREAK_REQUIRED,
      hint: 'Practicá con Jill ' + STREAK_REQUIRED + ' días seguidos.'
    },
    drill: {
      label: 'Rapid drill',
      required: DRILL_SCORE_REQUIRED,
      current: drillScore,
      met: drillScore >= DRILL_SCORE_REQUIRED,
      hint: 'Ganá una ronda Rapid drill con ' + DRILL_SCORE_REQUIRED + '% o más.'
    },
    session: {
      label: 'Sesión Jill fuerte',
      required: JILL_SESSION_SCORE_REQUIRED,
      current: sessionScore,
      met: sessionScore >= JILL_SESSION_SCORE_REQUIRED,
      hint: 'Completá una sesión con Jill evaluada en ' + JILL_SESSION_SCORE_REQUIRED + '+ (tutora Foundations).'
    }
  };

  const metCount = [pillars.streak.met, pillars.drill.met, pillars.session.met].filter(Boolean).length;
  const progressPct = Math.round(
    (Math.min(streak / STREAK_REQUIRED, 1) * 33.4)
    + (Math.min(drillScore / DRILL_SCORE_REQUIRED, 1) * 33.3)
    + (Math.min(sessionScore / JILL_SESSION_SCORE_REQUIRED, 1) * 33.3)
  );

  const achieved = pillars.streak.met && pillars.drill.met && pillars.session.met;
  const prev = student?.infinityVictory || {};

  return {
    track: 'jill',
    achieved,
    achievedAt: achieved ? (prev.achievedAt || new Date().toISOString()) : null,
    pillars,
    progressPct: achieved ? 100 : Math.min(99, progressPct),
    metCount,
    totalPillars: 3,
    title: achieved ? 'Infinity Victory · Foundations' : 'Camino a Victory · Jill',
    tagline: achieved
      ? 'Constancia, drill y sesión Jill  estándar Foundations cumplido.'
      : 'Tres pilares Jill: constancia, Rapid drill y sesión fuerte.',
    shareLine: achieved
      ? 'Completé Infinity Victory Foundations en Studio Infinity CR  Jill, Rapid drill y sesión fuerte.'
      : null,
    updatedAt: new Date().toISOString()
  };
}

/** Alice Victory  incluye Nexora (simulación). */
function computeAliceVictoryMetric(student) {
  const streak = aliceStreakValue(student);
  const aliceScore = bestAliceSessionScore(student);
  const nexoraOk = bestNexoraSession(student);
  const nexoraLast = (student?.nexoraSessions || []).slice(-1)[0];

  const pillars = {
    streak: {
      label: 'Constancia Alice',
      required: STREAK_REQUIRED,
      current: streak,
      met: streak >= STREAK_REQUIRED,
      hint: 'Practicá con Alice ' + STREAK_REQUIRED + ' días seguidos.'
    },
    session: {
      label: 'Sesión Alice',
      required: JILL_SESSION_SCORE_REQUIRED,
      current: aliceScore,
      met: aliceScore >= JILL_SESSION_SCORE_REQUIRED,
      hint: 'Sesión Alice evaluada en ' + JILL_SESSION_SCORE_REQUIRED + '+.'
    },
    nexora: {
      label: 'Nexora en vivo',
      required: NEXORA_SCORE_REQUIRED,
      current: nexoraLast ? (parseInt(nexoraLast.score, 10) || 0) : 0,
      met: !!nexoraOk,
      hint: 'Simulación Nexora ' + NEXORA_SCORE_REQUIRED + '+ pts, sin transferir a supervisor.'
    }
  };

  const metCount = [pillars.streak.met, pillars.session.met, pillars.nexora.met].filter(Boolean).length;
  const progressPct = Math.round(
    (Math.min(streak / STREAK_REQUIRED, 1) * 33.4)
    + (Math.min(aliceScore / JILL_SESSION_SCORE_REQUIRED, 1) * 33.3)
    + (pillars.nexora.met ? 33.3 : Math.min((pillars.nexora.current / NEXORA_SCORE_REQUIRED) * 33.3, 33.2))
  );

  const achieved = pillars.streak.met && pillars.session.met && pillars.nexora.met;
  const prev = student?.aliceVictory || {};

  return {
    track: 'alice',
    achieved,
    achievedAt: achieved ? (prev.achievedAt || new Date().toISOString()) : null,
    pillars,
    progressPct: achieved ? 100 : Math.min(99, progressPct),
    metCount,
    totalPillars: 3,
    title: achieved ? 'Infinity Victory · Alice' : 'Camino a Victory · Alice',
    tagline: achieved
      ? 'Alice + Nexora  producción real bajo presión.'
      : 'Alice enseña y acompaña; Nexora pone a prueba en llamadas.',
    shareLine: achieved
      ? 'Completé Infinity Victory Alice en Studio Infinity CR  coaching y Nexora.'
      : null,
    updatedAt: new Date().toISOString()
  };
}

function applyJillVictoryToStudent(student) {
  if (!student) return null;
  const metric = computeJillVictoryMetric(student);
  student.infinityVictory = metric;
  return metric;
}

function applyAliceVictoryToStudent(student) {
  if (!student) return null;
  const metric = computeAliceVictoryMetric(student);
  student.aliceVictory = metric;
  return metric;
}

/** @deprecated use applyJillVictoryToStudent */
function applyVictoryToStudent(student) {
  return applyJillVictoryToStudent(student);
}

function computeVictoryMetric(student) {
  return computeJillVictoryMetric(student);
}

function recordNexoraSession(student, ev, opts) {
  if (!student) return null;
  opts = opts || {};
  const talkTime = parseInt(opts.talkTime, 10) || 0;
  const transferred = !!opts.transferred;
  const score = Math.round(parseInt(ev?.overall_score, 10) || 0);
  if (!student.nexoraSessions) student.nexoraSessions = [];
  student.nexoraSessions.push({
    date: new Date().toISOString(),
    score,
    talkTime,
    transferred,
    scenario: opts.scenarioTitle || '',
    clientSatisfaction: ev?.client_satisfaction || null,
    cleanRun: score >= NEXORA_SCORE_REQUIRED && talkTime >= NEXORA_MIN_TALK_SEC && !transferred
  });
  if (student.nexoraSessions.length > 40) student.nexoraSessions = student.nexoraSessions.slice(-40);
  student.nexoraSessionCount = student.nexoraSessions.length;
  student.nexoraPracticeMinutes = (student.nexoraPracticeMinutes || 0) + (ev?.practice_minutes || Math.ceil(talkTime / 60) || 1);
  return applyAliceVictoryToStudent(student);
}

module.exports = {
  STREAK_REQUIRED,
  DRILL_SCORE_REQUIRED,
  JILL_SESSION_SCORE_REQUIRED,
  NEXORA_SCORE_REQUIRED,
  computeJillVictoryMetric,
  computeAliceVictoryMetric,
  computeVictoryMetric,
  applyJillVictoryToStudent,
  applyAliceVictoryToStudent,
  applyVictoryToStudent,
  recordNexoraSession
};
