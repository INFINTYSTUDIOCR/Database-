/**
 * Method Router — orquesta ENTREGA de clase (no cambia doctrina John / Nexus).
 * Fuentes: Training Book → track canon → guion oral → Super Brain → rol IA.
 *
 * Separación de producto:
 * - Jill Tutor: ruta oficial Foundations (jill-tutor-path) — SOLO modo tutor Jill.
 * - Jill Companion / Jill Pro: libre; sin ruta secuencial.
 * - Alice Tutor: linkers, phrasals, connectors, idea generation, risk taking, speed, structure.
 * - Alice Companion: práctica libre total; lección solo si la piden.
 * - Claire: TOEIC / TOEFL (TOEFL en desarrollo).
 */
const JillCanonRouter = require('./jill-canon-router');
const JohnDoctrine = require('./john-teaching-doctrine');
const JillTutorPath = require('./jill-tutor-path');

const NEXUS_KPIS = {
  IG: {
    label: 'Idea Generation',
    pattern: 'Idea + Linker + Idea',
    hint: 'Expandir sin que el trainer lo pida — mínimo 3 oraciones conectadas.',
    linkers: ['which means', 'however', 'as a result', 'in addition', 'on top of that']
  },
  ST: {
    label: 'Structure / Linkers',
    pattern: 'Idea + Linker + Idea',
    hint: 'Sin oraciones aisladas — conectores distintos en cadena.',
    linkers: ['however', 'therefore', 'on top of that', 'even though', 'as well as', 'because', 'as a result']
  },
  RA: {
    label: 'Recoverability',
    pattern: 'No Freeze Protocol',
    hint: 'Sustitución profesional — never freeze.',
    phrases: ['something similar to', 'the thing that', 'a kind of', 'think of it as']
  },
  PS: {
    label: 'Problem Solving',
    pattern: '4-Turn Resolution',
    hint: 'Acknowledge → Investigate → Propose → Confirm.',
    phrases: ['i understand that', 'let me check', 'what i can do is', 'does that work']
  },
  R: {
    label: 'Response Time',
    pattern: 'Rapid Fire / Natural Pace',
    hint: 'Respuesta completa en ventana corta — stalling permitido.',
    phrases: ['just to make sure i understood', "that's a great point"]
  }
};

const TB_TRACK_BLOB = [
  ['pronouns', /\b(pronoun|pronombre|possessive|reflexive|mine|myself)\b/i],
  ['present', /\b(present\s+simple|presente|he she it|third person|goes|does)\b/i],
  ['past', /\b(past\s+simple|pasado\s+simple|yesterday|went|was were)\b/i],
  ['perfect', /\b(present\s+perfect|past\s+perfect|have\s+has\s+had|participio|perfecto)\b/i],
  ['combined', /\b(have\s+been|had\s+been|been\s+\+\s*ing)\b/i],
  ['gerundio', /\b(gerundio|gerund|ing\b|ando|endo|to\s+be\s+\+\s*ing)\b/i],
  ['progressive', /\b(present\s+continuous|continuo|progressive)\b/i],
  ['conversacion_libre', /\b(conversaci[oó]n\s*libre|free\s*talk|emoci[oó]n\s*real|conversatorio|tema\s*emocional|empat[ií]a|module\s*8|m016|012)\b/i],
  ['modales_espejo', /\b(espejo|siquiera|confirmaci[oó]n\s*modal|moneda\s*modal|even\s+go|010b|6b)\b/i],
  ['modales', /\b(modal|will|would|should|could|can|must|futuro)\b/i],
  ['future', /\b(future|futuro|will\s+have)\b/i],
  ['prepositions', /\b(preposition|preposici[oó]n|in on at)\b/i],
  ['prepositions_time', /\b(preposition.*time|tiempo.*prep|since for during)\b/i],
  ['negations', /\b(negation|negaci[oó]n|do not|does not|did not)\b/i],
  ['there', /\b(there\s+is|there\s+are|hay\s+existencial)\b/i],
  ['articles', /\b(article|art[ií]culo|a an the)\b/i],
  ['irregular_verbs', /\b(irregular|go went gone|see saw seen)\b/i]
];

function parseTrainingBook(student) {
  return (student?.trainingBook || []).slice(0, 8).map((ex) => ({
    title: String(ex.title || '').trim(),
    kpi: String(ex.kpi || '').trim().toUpperCase(),
    objective: String(ex.objective || '').trim(),
    studentTask: String(ex.studentTask || ex.task || '').trim(),
    script: String(ex.script || '').trim(),
    trackId: ex.trackId || ex.canonTrackId || null,
    source: ex.source || ''
  })).filter((ex) => ex.title || ex.studentTask || ex.objective);
}

function inferTrackIdFromExercise(ex) {
  if (ex.trackId && JillCanonRouter.trackById(ex.trackId)) return ex.trackId;
  const blob = [ex.title, ex.objective, ex.studentTask, ex.script].filter(Boolean).join(' ');
  if (!blob) return null;
  const picked = JillCanonRouter.pickTrack(blob)
    || JillCanonRouter.resolvePieceTrack(blob, '')
    || null;
  if (picked) return picked.id;
  for (let i = 0; i < TB_TRACK_BLOB.length; i++) {
    if (TB_TRACK_BLOB[i][1].test(blob)) return TB_TRACK_BLOB[i][0];
  }
  return null;
}

function trackFromTrainingBook(student) {
  const exercises = parseTrainingBook(student);
  for (let i = 0; i < exercises.length; i++) {
    const trackId = inferTrackIdFromExercise(exercises[i]);
    if (trackId && JillCanonRouter.trackById(trackId)) {
      return { exercise: exercises[i], track: JillCanonRouter.trackById(trackId), trackId };
    }
  }
  return null;
}

function nexusFocusFromTrainingBook(student) {
  const exercises = parseTrainingBook(student);
  const kpis = [];
  exercises.forEach((ex) => {
    const k = ex.kpi;
    if (k && NEXUS_KPIS[k] && !kpis.includes(k)) kpis.push(k);
  });
  return kpis.map((k) => ({ kpi: k, ...NEXUS_KPIS[k] }));
}

function buildSuperBrainQuery(message, student, persona) {
  const parts = [String(message || '').slice(0, 400)];
  const tb = parseTrainingBook(student);
  tb.slice(0, 3).forEach((ex) => {
    parts.push([ex.title, ex.kpi, ex.objective, ex.studentTask].filter(Boolean).join(' '));
  });
  const focuses = nexusFocusFromTrainingBook(student);
  if (persona === 'alice' || persona === 'nexora') {
    focuses.forEach((f) => {
      parts.push(`${f.pattern} ${f.label} ${(f.linkers || f.phrases || []).join(' ')}`);
    });
    if (!focuses.length) parts.push('Idea Linker Idea Nexus STAR recovery linkers');
  }
  if (persona === 'jill') {
    const hit = trackFromTrainingBook(student);
    if (hit?.track) parts.push(`${hit.track.title} ${hit.track.formula} ${hit.track.bridge || ''}`);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 1400);
}

function resolveLockedTrackId(opts) {
  const {
    message = '',
    canonTrackId = null,
    stickyTopic = '',
    student = null,
    persona = 'alice',
    explicitTeach = false,
    isCompanion = false
  } = opts || {};

  if (canonTrackId && JillCanonRouter.trackById(String(canonTrackId))) {
    return { id: String(canonTrackId), source: 'portal-sticky' };
  }

  const tbHit = trackFromTrainingBook(student);
  const tbSticky = tbHit?.trackId || '';

  if (persona === 'jill') {
    if (isCompanion) {
      if (!explicitTeach) return { id: null, source: null };
      const fromMsg = JillCanonRouter.resolveAskId
        ? JillCanonRouter.resolveAskId(message, stickyTopic || tbSticky)
        : null;
      return fromMsg ? { id: fromMsg, source: 'student-ask' } : { id: null, source: null };
    }
    const pathTrack = JillTutorPath.resolveTrackFromStudent(student);
    if (pathTrack && JillCanonRouter.trackById(pathTrack)) {
      return { id: pathTrack, source: 'tutor-path' };
    }
    if (explicitTeach) {
      const fromMsg = JillCanonRouter.resolveAskId
        ? JillCanonRouter.resolveAskId(message, stickyTopic || tbSticky)
        : null;
      if (fromMsg) return { id: fromMsg, source: 'student-ask' };
    }
    if (tbHit?.trackId) return { id: tbHit.trackId, source: 'training-book' };
    if (explicitTeach) {
      const fromMsg = JillCanonRouter.resolveAskId
        ? JillCanonRouter.resolveAskId(message, stickyTopic || '')
        : null;
      if (fromMsg) return { id: fromMsg, source: 'student-ask' };
    }
    return { id: null, source: null };
  }

  if (explicitTeach && (persona === 'alice' || persona === 'nexora')) {
    const fromMsg = JillCanonRouter.resolveAskId
      ? JillCanonRouter.resolveAskId(message, stickyTopic || tbSticky)
      : null;
    if (fromMsg) return { id: fromMsg, source: 'student-ask' };
  }

  return { id: null, source: null };
}

function buildDeliveryBlock(route) {
  const lines = [
    'METHOD ROUTER — ENTREGA DE ESTE TURNO (doctrina John/Nexus intacta; solo orquestación):'
  ];

  if (route.primaryExercise) {
    const ex = route.primaryExercise;
    lines.push(`TRAINING BOOK PRIMARIO: "${ex.title}"${ex.kpi ? ` [KPI ${ex.kpi}]` : ''}`);
    if (ex.objective) lines.push(`OBJETIVO ASIGNADO: ${ex.objective.slice(0, 600)}`);
    if (ex.studentTask) lines.push(`TAREA DEL ESTUDIANTE (refuerza en voz, no leas como lista): ${ex.studentTask.slice(0, 700)}`);
  } else if (route.trainingBook.length) {
    lines.push(`TRAINING BOOK (${route.trainingBook.length} ejercicios activos — priorizá el primero).`);
  }

  route.nexusFocus.forEach((f) => {
    lines.push(`FOCO NEXUS ${f.kpi} — ${f.label}: ${f.pattern}. ${f.hint}`);
    const lex = (f.linkers || f.phrases || []).slice(0, 6).join(', ');
    if (lex) lines.push(`  Léxico operativo: ${lex}`);
  });

  if (route.lockedTrack) {
    lines.push(`TRACK CANON (${route.trackSource || 'canon'}): ${route.lockedTrack.title} (${route.lockedTrack.id})`);
    if (route.persona === 'jill' && route.trackSource === 'tutor-path') {
      lines.push('RUTA OFICIAL JILL TUTOR (solo Jill Tutor): un paso activo — NO saltar al siguiente tema hasta completar el gate.');
    }
    lines.push('SECUENCIA DE ENTREGA: 1) guion oral local → 2) puente ES→EN → 3) ejemplo en inglés → 4) práctica oral → 5) ¿Te quedó?');
    lines.push('PROHIBIDO: leer tablero fila por fila; ESL genérico; otro módulo "de paso".');
  } else if (route.persona === 'alice') {
    if (route.isCompanion) {
      lines.push('ENTREGA ALICE COMPANION (libre): práctica conversacional total — charla libre; mini-lección solo si el estudiante la pide explícitamente.');
    } else {
      lines.push('ENTREGA ALICE TUTOR: linkers · phrasals · connectors · idea generation · risk taking · response speed · structure building.');
      lines.push('Patrones: Idea + Linker + Idea · STAR · No Freeze · tono coach John.');
    }
  } else if (route.persona === 'nexora') {
    lines.push('ENTREGA NEXORA: en rolplay quedate en personaje; feedback post-turno con pedagogía John.');
  }

  if (route.persona === 'claire') {
    lines.push('ENTREGA CLAIRE: TOEIC / TOEFL — estrategia de examen directa (TOEFL aún en desarrollo). Doctrina Nexus solo si refuerza el ítem.');
  }

  return lines.join('\n');
}

function buildRoute(opts) {
  const persona = ['alice', 'jill', 'claire', 'nexora'].includes(opts?.persona)
    ? opts.persona
    : 'alice';
  const trainingBook = parseTrainingBook(opts?.student);
  const tbHit = trackFromTrainingBook(opts?.student);
  const lock = resolveLockedTrackId({ ...opts, persona, trainingBook });
  const lockedTrack = lock.id ? JillCanonRouter.trackById(lock.id) : null;
  const voiceScript = lock.id ? JohnDoctrine.getTrackVoice(lock.id) : null;

  const route = {
    persona,
    isCompanion: !!opts?.isCompanion,
    trainingBook,
    primaryExercise: tbHit?.exercise || trainingBook[0] || null,
    nexusFocus: nexusFocusFromTrainingBook(opts?.student),
    lockedTrackId: lock.id,
    lockedTrack,
    trackSource: lock.source,
    voiceScript,
    superBrainQuery: buildSuperBrainQuery(opts?.message, opts?.student, persona),
    deliveryBlock: ''
  };
  route.deliveryBlock = buildDeliveryBlock(route);
  route.meta = {
    trackSource: route.trackSource,
    lockedTrackId: route.lockedTrackId,
    primaryKpi: route.primaryExercise?.kpi || null,
    primaryTitle: route.primaryExercise?.title || null,
    nexusKpis: route.nexusFocus.map((f) => f.kpi)
  };
  return route;
}

function scoreTurn(reply, route) {
  const text = String(reply || '');
  const lower = text.toLowerCase();
  if (!text.trim()) {
    return { score: 0, flags: ['empty'], mustSayHits: 0, mustSayTotal: 0 };
  }

  let score = 35;
  const flags = [];

  const mustSay = (route?.voiceScript?.mustSay || []).map((w) => String(w).toLowerCase());
  let mustSayHits = 0;
  mustSay.forEach((w) => {
    if (w && lower.includes(w)) mustSayHits++;
  });
  if (mustSay.length) {
    score += Math.round(28 * (mustSayHits / mustSay.length));
  } else if (route?.persona === 'alice' || route?.nexusFocus?.length) {
    const linkers = route.nexusFocus.flatMap((f) => f.linkers || []).slice(0, 8);
    const linkerHits = linkers.filter((l) => lower.includes(String(l).toLowerCase())).length;
    if (linkerHits) score += Math.min(20, linkerHits * 5);
  }

  if (/\b(te qued[oó]|does that make sense|practic[aá]|dec[ií]lo|say it|repeat)\b/i.test(text)) {
    score += 12;
    flags.push('oral-close');
  }
  if (/\b(idea|linker|conector|however|therefore|because|as a result)\b/i.test(lower)) {
    score += 8;
    flags.push('nexus-language');
  }
  if (route?.lockedTrack && /\b(puente|rapid fire|¿te qued[oó]|patr[oó]n|formula|fórmula)\b/i.test(lower)) {
    score += 10;
    flags.push('john-delivery');
  }
  if (/\b(as an ai|chatgpt|generic esl|grammar rule \d)\b/i.test(lower)) {
    score -= 25;
    flags.push('generic-esl');
  }
  if (route?.primaryExercise?.studentTask) {
    const taskWords = route.primaryExercise.studentTask.toLowerCase().split(/\W+/).filter((w) => w.length > 5);
    const taskHits = taskWords.filter((w) => lower.includes(w)).length;
    if (taskHits >= 2) {
      score += 8;
      flags.push('tb-aligned');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    flags,
    mustSayHits,
    mustSayTotal: mustSay.length,
    trackSource: route?.trackSource || null,
    lockedTrackId: route?.lockedTrackId || null
  };
}

module.exports = {
  parseTrainingBook,
  trackFromTrainingBook,
  nexusFocusFromTrainingBook,
  buildSuperBrainQuery,
  resolveLockedTrackId,
  buildDeliveryBlock,
  buildRoute,
  scoreTurn,
  NEXUS_KPIS
};
