'use strict';

const DIM_LABELS = {
  verbs: 'verbos',
  transitions: 'conectores básicos',
  articles: 'artículos',
  prepositions: 'preposiciones',
  msi: 'estructura MSI®'
};

function formatCalibrationNote(calibrationContext, student) {
  const ctx = calibrationContext || {};
  const cal = student?.jillCalibration || {};
  if (!ctx.active && cal.initialDone && cal.route) {
    return formatCalibrationMemory(student);
  }
  if (!ctx.active) return '';

  const probe = ctx.currentProbe;
  const idx = ctx.probeIndex || 0;
  const total = ctx.probeTotal || 10;
  const lines = [
    '',
    'CALIBRACIÓN INICIAL (OBLIGATORIO — antes del bundle):',
    `- Estás midiendo conocimiento real: verbos, conectores básicos, artículos, preposiciones, MSI®. NO saltes al curriculum todavía.`,
    `- Progreso: ${idx}/${total} pruebas completadas.`,
  ];

  if (probe) {
    lines.push(`- PRÓXIMA PRUEBA (${probe.label || probe.dim}): "${probe.ask}"`);
    if (probe.hint) lines.push(`- Pista permitida si se traban: ${probe.hint}`);
    lines.push('- Una sola pregunta por turno. Corregí breve (1 frase) la respuesta anterior si hubo error, luego lanzá la prueba actual.');
    lines.push('- Tono: trainer en sala, cero presión, cero sermón motivacional.');
  } else if (idx >= total) {
    lines.push('- Calibración terminada: transicioná al bundle activo con naturalidad usando la RUTA abajo.');
  }

  const scored = Object.entries(cal.dimensions || {})
    .filter(([, d]) => d && d.score != null)
    .map(([k, d]) => `${DIM_LABELS[k] || k}: ${d.score}% (${d.band})`);
  if (scored.length) lines.push(`- Áreas ya medidas: ${scored.join(' · ')}`);

  if (cal.route?.summary) {
    lines.push(`- RUTA DISEÑADA: ${cal.route.summary}`);
    if (cal.route.bundleHints?.length) {
      lines.push(`- Bundles sugeridos: ${cal.route.bundleHints.join(', ')}`);
    }
  }

  const mem = (ctx.lessonMemory || cal.lessonMemory || []).slice(-3);
  if (mem.length) {
    lines.push('- Memoria reciente del estudiante:');
    mem.forEach((m) => lines.push(`  · ${m.note || m.kind}`));
  }

  return lines.join('\n');
}

function formatCalibrationMemory(student) {
  const cal = student?.jillCalibration;
  if (!cal?.initialDone || !cal.route) return '';
  const mem = (cal.lessonMemory || []).slice(-4);
  const lines = [
    '',
    'MEMORIA CALIBRACIÓN JILL (personalizada — improvisá la ruta dentro del método):',
    `- ${cal.route.summary}`,
    `- KPIs a priorizar hoy: ${(cal.route.weakKpis || []).join(', ') || 'según bundle'}.`,
    '- Recordá sesiones anteriores: reforzá lo débil, probá lo inestable, no repitas lo que ya domina.',
  ];
  if (mem.length) {
    lines.push('- Lecciones recientes:');
    mem.forEach((m) => lines.push(`  · ${m.note || m.kind}`));
  }
  return lines.join('\n');
}

function calibrationTeachInstruction(calibrationContext) {
  if (!calibrationContext?.active) return null;
  return 'MODO CALIBRACIÓN: solo pruebas diagnósticas + feedback mínimo. NO drills del bundle ni matriz MSI hasta terminar las 10 pruebas.';
}

module.exports = {
  formatCalibrationNote,
  formatCalibrationMemory,
  calibrationTeachInstruction,
  DIM_LABELS
};
