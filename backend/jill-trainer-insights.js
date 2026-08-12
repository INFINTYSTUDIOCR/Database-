/**
 * Jill ? KPI charts + justificación master trainer + resumen trainers asignados.
 */
const KpiHistory = require('./kpi-history');
const MACRO_KEYS = ['IG', 'ST', 'RA', 'PS', 'R'];

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function collectAssignedTrainers(student) {
  const names = new Set();
  const primary = String(student?.info?.trainer || '').trim();
  if (primary) names.add(primary);
  (student?.info?.coTrainers || []).forEach((t) => {
    const n = String(t || '').trim();
    if (n) names.add(n);
  });
  (student?.kpiTracker || []).slice(-10).forEach((e) => {
    if (e?.trainer) names.add(String(e.trainer).trim());
  });
  (student?.calibrations || []).slice(-6).forEach((e) => {
    if (e?.trainer) names.add(String(e.trainer).trim());
  });
  return [...names].filter(Boolean);
}

function snapshotPhase1(student) {
  const p = student?.kpis?.phase1 || {};
  const out = {};
  MACRO_KEYS.forEach((k) => { out[k] = parseInt(p[k], 10) || 0; });
  return out;
}

function applyChartUpdates(student, phase1Updates, maxDelta = 10) {
  if (!student.kpis) student.kpis = {};
  if (!student.kpis.phase1) {
    student.kpis.phase1 = { IG: '50', ST: '50', RA: '50', PS: '50', R: '50' };
  }
  const prev = snapshotPhase1(student);
  const next = { ...prev };
  const deltas = {};
  const rationaleByKpi = {};

  MACRO_KEYS.forEach((k) => {
    if (phase1Updates[k] == null) return;
    const cur = prev[k] || 0;
    const target = clamp(parseInt(phase1Updates[k], 10) || cur, 0, 100);
    const bounded = clamp(target, cur - maxDelta, cur + maxDelta);
    deltas[k] = bounded - cur;
    next[k] = bounded;
    student.kpis.phase1[k] = String(bounded);
  });

  return { prev, next, deltas, rationaleByKpi };
}

function parseInsightJson(raw) {
  const clean = String(raw || '').replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildInsightPrompt(student, ctx) {
  const trainers = collectAssignedTrainers(student);
  const phase1 = snapshotPhase1(student);
  const m = student?.jillMatrix || {};
  const lines = [
    'Sos Jill analista de Infinity Studio CR. Con TODO el contexto del estudiante, proponé ajustes de KPI macro (gráficos) y reportes para trainers.',
    '',
    `Estudiante: ${ctx.displayName}`,
    `Nivel: ${student?.level || 'Foundations'}`,
    `Trainers asignados: ${trainers.join(', ') || 'sin asignar'}`,
    `KPI macro actual (0-100): IG=${phase1.IG} ST=${phase1.ST} RA=${phase1.RA} PS=${phase1.PS} R=${phase1.R}`,
    `Sesión Jill score: ${ctx.evaluation?.overall_score ?? '—'}/100 · turnos: ${ctx.evaluation?.student_turns ?? '—'}`,
    `Fase conversación: ${ctx.evaluation?.conversation_phase ? 'sí' : 'no'}`,
    `Graduation request: ${ctx.evaluation?.graduation_request ? 'sí' : 'no'}`,
    ctx.evaluation?.graduation_reason ? `Razón graduación: ${ctx.evaluation.graduation_reason}` : '',
    ctx.evaluation?.conversation_kpis ? `KPIs conversación: ${JSON.stringify(ctx.evaluation.conversation_kpis)}` : '',
    m.columnIndex != null ? `Matriz F0 columna activa idx: ${m.columnIndex}` : '',
    m.avgResponseMs != null ? `Tiempo respuesta promedio: ${m.avgResponseMs}ms` : '',
    student?.jillPulse?.lastScore != null ? `Pulse último: ${student.jillPulse.lastScore}%` : '',
    '',
    'TRANSCRIPT (última sesión Jill):',
    ctx.hist || '(corto)',
    '',
    'REGLAS:',
    '- Ajustá phase1 solo donde la evidencia del transcript lo justifique (cambios típicos ±3 a ±8 puntos).',
    '- IG=idea/generación · ST=coordinación/linkers · RA=recuperabilidad/esfuerzo · PS=estructura oral · R=tiempo verbal.',
    '- masterJustification: texto para MASTER TRAINER explicando criterio, ranuras P|M|V|C, y por qué moviste cada gráfico.',
    '- trainerSummaries: un resumen accionable por cada trainer en la lista (mismo orden si están en la lista).',
    '- chartRationale: objeto con clave IG/ST/RA/PS/R y una frase por KPI modificado.',
    '',
    'Respondé SOLO JSON válido:',
    '{"phase1":{"IG":0,"ST":0,"RA":0,"PS":0,"R":0},"chartRationale":{"IG":"...","ST":"..."},"masterJustification":"...","trainerSummaries":[{"trainer":"Nombre","summary":"..."}]}'
  ];
  return lines.filter(Boolean).join('\n');
}

async function generateTrainerInsights(claudeCall, SuperBrain, opts) {
  const { student, evaluation, hist, brainContext } = opts;
  if (!student || !evaluation) return null;

  const displayName = opts.displayName || student?.name || student?.info?.name || 'estudiante';
  let prompt = buildInsightPrompt(student, { displayName, evaluation, hist });

  if (SuperBrain?.isSuperBrainEnabled?.()) {
    try {
      const ctx = await SuperBrain.getPropagatedContext(String(hist || '').slice(0, 400), 1800);
      if (ctx?.trim()) prompt = `INSTITUTIONAL KNOWLEDGE (Super Brain):\n${ctx}\n\n---\n\n${prompt}`;
    } catch { /* optional */ }
  }
  if (brainContext) prompt = `${brainContext}\n\n---\n\n${prompt}`;

  const resp = await claudeCall({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }]
  });
  const raw = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const parsed = parseInsightJson(raw);
  if (!parsed) return null;

  const trainers = collectAssignedTrainers(student);
  const chartApplied = applyChartUpdates(student, parsed.phase1 || {});

  const summaries = Array.isArray(parsed.trainerSummaries) ? parsed.trainerSummaries : [];
  const byTrainer = {};
  summaries.forEach((row) => {
    const name = String(row?.trainer || '').trim();
    if (name) byTrainer[name] = String(row.summary || '').trim();
  });
  trainers.forEach((name) => {
    if (!byTrainer[name]) {
      byTrainer[name] = parsed.masterJustification
        ? String(parsed.masterJustification).slice(0, 280) + '…'
        : 'Revisá la sesión Jill del alumno en el portal.';
    }
  });

  const insight = {
    date: new Date().toISOString(),
    source: 'jill-evaluate',
    sessionScore: evaluation.overall_score,
    graduationRequest: !!evaluation.graduation_request,
    chartUpdates: {
      prev: chartApplied.prev,
      next: chartApplied.next,
      deltas: chartApplied.deltas,
      rationale: parsed.chartRationale || {}
    },
    masterJustification: String(parsed.masterJustification || '').trim(),
    trainerSummaries: Object.keys(byTrainer).map((trainer) => ({
      trainer,
      summary: byTrainer[trainer]
    }))
  };

  if (!student.trainerInsightLog) student.trainerInsightLog = [];
  student.trainerInsightLog.push({
    date: insight.date,
    score: insight.sessionScore,
    deltas: chartApplied.deltas,
    graduationRequest: insight.graduationRequest
  });
  if (student.trainerInsightLog.length > 24) {
    student.trainerInsightLog = student.trainerInsightLog.slice(-24);
  }

  student.jillTrainerInsight = insight;
  try {
    KpiHistory.appendKpiHistory(student, {
      source: 'jill',
      score: evaluation.overall_score != null ? evaluation.overall_score : null,
      phase1: chartApplied.next,
      note: String(parsed.masterJustification || '').slice(0, 120),
      force: true
    });
  } catch (_) { /* non-fatal */ }
  return insight;
}

module.exports = {
  MACRO_KEYS,
  collectAssignedTrainers,
  applyChartUpdates,
  generateTrainerInsights
};
