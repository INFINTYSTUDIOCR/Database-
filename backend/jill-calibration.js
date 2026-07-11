'use strict';

const DIM_LABELS = {
  verbs: 'verbos',
  transitions: 'conectores basicos',
  articles: 'articulos',
  prepositions: 'preposiciones',
  msi: 'estructura MSI'
};

function formatCalibrationNote(calibrationContext, student) {
  const ctx = calibrationContext || {};
  const cal = student?.jillCalibration || {};
  if (!ctx.active && cal.initialDone) {
    return formatCalibrationMemory(student);
  }
  if (!ctx.active) return '';

  const probe = ctx.currentProbe;
  const idx = ctx.probeIndex || 0;
  const total = ctx.probeTotal || 10;
  const lines = [
    '',
    'CALIBRACION INICIAL (OBLIGATORIO — antes del bundle):',
    '- Estas midiendo conocimiento real: verbos, conectores basicos, articulos, preposiciones, MSI. NO saltes al curriculum todavia.',
    `- Progreso: ${idx}/${total} pruebas completadas.`,
  ];

  if (probe) {
    lines.push(`- PROXIMA PRUEBA (${probe.label || probe.dim}): "${probe.ask}"`);
    if (probe.hint) lines.push(`- Pista permitida si se traban: ${probe.hint}`);
    lines.push('- Una sola pregunta por turno. Corregi breve (1 frase) la respuesta anterior si hubo error, luego lanza la prueba actual.');
    lines.push('- Tono: trainer en sala, cero presion, cero sermon motivacional.');
  } else if (idx >= total) {
    lines.push('- Calibracion terminada: transiciona al bundle activo con naturalidad usando la RUTA abajo.');
  }

  const scored = Object.entries(cal.dimensions || {})
    .filter(([, d]) => d && d.score != null)
    .map(([k, d]) => `${DIM_LABELS[k] || k}: ${d.score}% (${d.band})`);
  if (scored.length) lines.push(`- Areas ya medidas: ${scored.join(' · ')}`);

  if (cal.route?.summary) {
    lines.push(`- RUTA DISENADA: ${cal.route.summary}`);
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
  if (!cal?.initialDone) return '';
  const mem = (cal.lessonMemory || []).slice(-4);
  const lines = [
    '',
    'MEMORIA CALIBRACION (GUARDADA — OBLIGATORIO usar en lecciones futuras):',
    '- La calibracion ya se midio y se GUARDO en el perfil del estudiante. NO la ignores ni la reinicies.',
    '- Ensena CUALQUIER tema que pidan, siempre estilo John. Usa esta memoria para priorizar refuerzo y ritmo.',
  ];
  if (cal.route?.summary) {
    lines.push(`- RUTA GUARDADA: ${cal.route.summary}`);
    lines.push(`- KPIs a priorizar: ${(cal.route.weakKpis || []).join(', ') || 'segun progreso'}.`);
    if (cal.route.bundleHints?.length) {
      lines.push(`- Bundles sugeridos por calibracion: ${cal.route.bundleHints.join(', ')}.`);
    }
  } else if (cal.legacySkip) {
    lines.push('- Calibracion marcada (legado): sigue preferencias de estudio + KPIs debiles del perfil.');
  }
  const scored = Object.entries(cal.dimensions || {})
    .filter(([, d]) => d && d.score != null)
    .map(([k, d]) => `${DIM_LABELS[k] || k}: ${d.score}% (${d.band})`);
  if (scored.length) lines.push(`- Dimensiones medidas: ${scored.join(' · ')}`);
  lines.push('- Ejecuta lecciones futuras con esta ruta: refuerza lo debil, prueba lo inestable, no repitas lo ya dominado.');
  if (mem.length) {
    lines.push('- Lecciones recientes (memoria persistente):');
    mem.forEach((m) => lines.push(`  · ${m.note || m.kind}`));
  }
  return lines.join('\n');
}

function calibrationTeachInstruction(calibrationContext) {
  if (!calibrationContext?.active) return null;
  return 'MODO CALIBRACION: solo pruebas diagnosticas + feedback minimo. NO drills del bundle ni matriz MSI hasta terminar las 10 pruebas.';
}

module.exports = {
  formatCalibrationNote,
  formatCalibrationMemory,
  calibrationTeachInstruction,
  DIM_LABELS
};
