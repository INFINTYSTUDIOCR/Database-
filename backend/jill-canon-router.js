/**
 * Jill DJ — pickTrack (Node). Misma lógica que js/jill-canon-router.js
 */
const fs = require('fs');
const path = require('path');
const JillLearnerIntent = require('./jill-learner-intent');

let MAP = null;

function loadMap() {
  if (MAP) return MAP;
  const candidates = [
    path.join(__dirname, 'config', 'jill-canon-map.json'),
    path.join(__dirname, '..', 'config', 'jill-canon-map.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        MAP = JSON.parse(fs.readFileSync(p, 'utf8'));
        return MAP;
      }
    } catch (_) { /* next */ }
  }
  MAP = { tracks: [] };
  return MAP;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/|,;]+/g, ' ')
    .replace(/\by\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tracks() {
  return (loadMap().tracks) || [];
}

function pickTrack(text) {
  const raw = String(text || '');
  const expanded = JillLearnerIntent.expand(raw);
  return pickTrackExact(expanded) || pickTrackExact(raw);
}

function pickTrackExact(text) {
  const n = normalize(text);
  if (!n || n.length < 2) return null;
  let best = null;
  let bestLen = 0;
  const list = tracks();
  for (let i = 0; i < list.length; i++) {
    const tr = list[i];
    const aliases = tr.aliases || [];
    for (let j = 0; j < aliases.length; j++) {
      const a = normalize(aliases[j]);
      if (!a || a.length < 2) continue;
      if (!n.includes(a)) continue;
      if (a.length <= 3) {
        const re = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (!re.test(n)) continue;
      }
      if (a.length > bestLen) {
        bestLen = a.length;
        best = tr;
      }
    }
  }
  return best;
}

function pickTrackId(text) {
  const t = pickTrack(text);
  return t ? t.id : null;
}

function wantsVisual(text) {
  return /\b(imagen|pizarr[oó]n|whiteboard|tablero|visual|diagrama|cuadro)\b/i.test(String(text || ''));
}

/** Pedido explícito de tema (español) vs frase de práctica en inglés. */
function isExplicitTopicAsk(text) {
  const t = String(text || '');
  return /\b(explicame|expl[ií]came|explic[aá]|ense[nñ]ame|ense[nñ][aá]|mostr[aá]me|dame|quiero (saber|aprender|entender)|qu[eé] es|c[oó]mo se (usa|forma|dice)|ayudame|ayud[aá]me|duda|hablame de|habl[aá]me de|tema de|lecci[oó]n|m[oó]dulo)\b/i.test(t)
    || /\b(preposiciones|gerundio|futuro|pasado|presente|pronombres|art[ií]culos|modales|negaciones)\b/i.test(t);
}

/** Producción oral / ejemplo en inglés (no es pedido de nuevo módulo). */
function isEnglishPracticeUtterance(text) {
  const t = String(text || '').trim();
  if (!t || t.length > 220) return false;
  if (isExplicitTopicAsk(t)) return false;
  if (/[áéíóúñ¿¡]/i.test(t)) return false;
  // Mostly ASCII English words — student attempt / example
  return /\b(i|you|he|she|it|we|they|will|would|can|like|watch|watching|go|going|am|is|are|have|has|had|the|a|an|in|on|at|to|for|morning|today|tomorrow)\b/i.test(t)
    && /[a-zA-Z]{2,}/.test(t);
}

/** Cambio de módulo solo con alias fuerte (no "will"/"can" sueltos). */
function isStrongTopicSwitch(ask, namedTrack) {
  if (!namedTrack) return false;
  const n = normalize(ask);
  const aliases = namedTrack.aliases || [];
  let best = 0;
  for (let i = 0; i < aliases.length; i++) {
    const a = normalize(aliases[i]);
    if (!a || a.length < 2) continue;
    if (!n.includes(a)) continue;
    if (a.length > best) best = a.length;
  }
  if (best >= 8) return true;
  return /\b(preposicion(?:es)?|gerundio|futuro|pasado|presente|pronombre(?:s)?|art[ií]culo(?:s)?|negacion(?:es)?|modales|perfecto|continuo|comparativ|irregular)\b/i.test(String(ask || ''));
}

function stripAskShell(text) {
  let t = String(text || '');
  t = t.replace(/\b(dame|d[aá]me|mostr[aá]me|mu[eé]strame|mostrar|ense[nñ]ame|ense[nñ][aá]|ver|abrir|pon[eé]me|trae|quiero|necesito|explicame|expl[ií]came|explic[aá]|explica)\b/gi, ' ');
  t = t.replace(/\b(la|el|una|un)\s+(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
  t = t.replace(/\b(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
  t = t.replace(/\b(de|del|de\s+la|sobre|con|acerca\s+de)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function trackById(id) {
  if (!id) return null;
  const list = tracks();
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

/** "qué es HAD / have / been…" — nunca devolver null: enrutá a la pieza correcta. */
function resolvePieceTrack(userAsk, stickyTopic) {
  const ask = String(userAsk || '').trim();
  if (!ask) return null;
  const n = normalize(ask);
  const sticky = normalize(String(stickyTopic || '').replace(/^doubt:/i, ''));
  const blob = `${n} ${sticky}`;
  const asksPiece = /\b(que es|qué es|what is|significa|explicame|explic[aá]|para que sirve|para qué sirve|eso de|omision|omision de|omitir|omission)\b/i.test(ask)
    || /^(el |la )?(have|has|had|been|will|would|should|could|can|do|does|did|am|is|are|was|were|ing)\??$/i.test(ask.trim());
  if (!asksPiece) return null;

  if (/\bhad\b/.test(n)) {
    if (/\b(been|continuo|continuous)\b/.test(blob)) return trackById('combined') || trackById('perfect');
    if (/\b(perfecto|perfect|participio|prp)\b/.test(blob)) return trackById('perfect') || trackById('have_had');
    return trackById('have_had') || trackById('perfect');
  }
  if (/\bbeen\b/.test(n)) {
    return trackById('combined') || trackById('perfect');
  }
  if (/\b(have|has)\b/.test(n)) {
    if (/\b(perfecto|perfect|participio|prp)\b/.test(blob)) return trackById('perfect') || trackById('have_had');
    return trackById('have_had') || trackById('perfect');
  }
  if (/\b(will|would|should|could|can|must)\b/.test(n)) return trackById('modales');
  if (/\b(do|does|did)\b/.test(n)) return trackById('negations') || trackById('modal');
  if (/\b(get|got|gotten)\b/.test(n)) return trackById('irregular_verbs');
  if (/\b(go|went|gone|see|saw|seen|make|made|take|took|taken)\b/.test(n) && asksPiece) {
    return trackById('irregular_verbs');
  }
  if (/\b(am|is|are|was|were)\b/.test(n) && /\b(to be|continuo|progressive|ing)\b/.test(blob)) return trackById('progressive');
  return null;
}

function resolveAsk(userAsk, stickyTopic) {
  const ask = String(userAsk || '').trim();
  const sticky = String(stickyTopic || '').replace(/^doubt:/i, '').trim();
  const stickyTrack = sticky
    ? (trackById(sticky) || pickTrack(sticky) || pickTrack(stripAskShell(sticky)))
    : null;

  // LOCK GENERAL: con lección activa NO se abre otro módulo por aliases incidentales,
  // ejemplos en inglés, "dame un ejemplo", correcciones, etc.
  // SOLO un pedido EXPLÍCITO de OTRO tema puede cambiar.
  if (stickyTrack) {
    if (isExplicitTopicAsk(ask)) {
      // Solo cambiar si el alias que ganó es FUERTE (módulo nombrado), no "will"/"can"/"had"
      const named = pickTrack(ask) || pickTrack(stripAskShell(ask));
      if (named && named.id !== stickyTrack.id && isStrongTopicSwitch(ask, named)) return named;
    }
    return stickyTrack;
  }

  let hit = resolvePieceTrack(ask, sticky);
  if (hit) return hit;
  hit = pickTrack(ask);
  if (hit) return hit;
  const stripped = stripAskShell(ask);
  if (stripped) {
    hit = pickTrack(stripped);
    if (hit) return hit;
    hit = resolvePieceTrack(stripped, sticky);
    if (hit) return hit;
  }
  hit = pickTrack([ask, sticky].filter(Boolean).join(' '));
  if (hit) return hit;
  return pickTrack([stripped, sticky].filter(Boolean).join(' ')) || null;
}

function resolveAskId(userAsk, stickyTopic) {
  const t = resolveAsk(userAsk, stickyTopic);
  return t ? t.id : null;
}


function loadModuleCanonTranscript(trackId) {
  const files = {
    pronouns: 'module-01-pronombres.txt',
    present: 'module-02-verbos-presente.txt',
    past: 'module-03-pasado-simple.txt',
    perfect: 'module-04-perfecto.txt',
    combined: 'module-04-perfecto.txt',
    gerundio: 'module-05-gerundio.txt',
    progressive: 'module-05-gerundio.txt',
    gerund_prep: 'module-05-gerundio.txt',
    modales: 'module-06-will-would.txt',
    future: 'module-06-will-would.txt',
    future_perfect: 'module-06-will-would.txt'
  };
  const name = files[String(trackId || '').trim()];
  if (!name) return null;
  const paths = [
    path.join(__dirname, 'config', 'canon', name),
    path.join(__dirname, '..', 'config', 'canon', name)
  ];
  for (let i = 0; i < paths.length; i++) {
    try {
      if (fs.existsSync(paths[i])) return fs.readFileSync(paths[i], 'utf8');
    } catch (_) { /* next */ }
  }
  return null;
}

function loadVoiceScript(trackId) {
  const fromFile = loadModuleCanonTranscript(trackId);
  if (fromFile) {
    const id = String(trackId || '').trim();
    if (id === 'modales' || id === 'future' || id === 'future_perfect') {
      return {
        say: fromFile,
        mustSay: ['will', 'would', 'ré', 'ría', 'by'],
        exampleAsk: 'Antes de construir: ¿va a pasar de verdad o es hipotético? Real → WILL/RÉ; hipotético → WOULD/RÍA.'
      };
    }
    if (id === 'gerundio' || id === 'progressive' || id === 'gerund_prep') {
      return {
        say: fromFile,
        mustSay: ['to be', 'ing', 'ando', 'endo', 'to'],
        exampleAsk: 'Antes del ING continuo: ¿cuál es la llave? Decí TO BE y construí una frase.'
      };
    }
    if (id === 'perfect' || id === 'combined') {
      return {
        say: fromFile,
        mustSay: ['have', 'has', 'had', 'been', 'been + ing'],
        exampleAsk: 'Antes: ¿sigue o terminó? ¿Conecta con presente o con otro pasado? Rapid Fire: Go → Gone. She → Has.'
      };
    }
    if (id === 'past') {
      return {
        say: fromFile,
        mustSay: ['went', 'was', 'were', 'yesterday', 'nadie cambia'],
        exampleAsk: 'Antes de construir: ¿pasado o presente? Rapid Fire: Go → Went. They → Were.'
      };
    }
    if (id === 'present') {
      return {
        say: fromFile,
        mustSay: ['to', 'goes', 'does', 'has', 'he she it'],
        exampleAsk: 'Antes de conjugar: ¿Es He, She o It? Rapid Fire: To go / She go → She goes.'
      };
    }
    return {
      say: fromFile,
      mustSay: ['sujeto', 'objeto', 'my', 'mine', 'myself'],
      exampleAsk: 'Rapid Fire: Ella — sujeto / objeto / posesivo adjetivo / pronominal / reflexivo.'
    };
  }
  try {
    const paths = [
      path.join(__dirname, 'config', 'john-voice-scripts.json'),
      path.join(__dirname, '..', 'config', 'john-voice-scripts.json')
    ];
    for (let i = 0; i < paths.length; i++) {
      if (!fs.existsSync(paths[i])) continue;
      const pack = JSON.parse(fs.readFileSync(paths[i], 'utf8'));
      const v = pack && pack.tracks && pack.tracks[trackId];
      if (v && v.say) return v;
    }
  } catch (_) { /* ignore */ }
  return null;
}

function formatLock(track) {
  if (!track) return '';
  const never = (track.never || []).join('; ');
  const soloScope = [
    `CANDADO UNIVERSAL — PEDIDO = ÚNICO TEMA:`,
    `Este turno SOLO "${track.title}" (id=${track.id}). Nada más.`,
    `PROHIBIDO ABSOLUTO: panorama F0, overview de tiempos, "sistema completo", once estructuras, u otro módulo/tiempo "de paso" / "para contexto" / "después vemos".`,
    `Si el estudiante pidió pasado simple → SOLO pasado simple. Presente → SOLO presente. Perfecto → SOLO perfecto. Gerundio → SOLO gerundio. WILL/WOULD → SOLO eso. Pronombres → SOLO pronombres.`,
    `ESPAÑOL: tico CR correcto. PROHIBIDO acento gringo en español (pronunciación, ritmo o frases calco del inglés).`
  ];
  const antiMix = [];
  const locks = {
    past: [
      'ANTIMEZCLA — MÓDULO 3 PASADO SIMPLE (16 VERBOS + WAS/WERE):',
      'SOLO pasado simple. PROHIBIDO presente, perfecto, continuo, futuro, will/would, panorama F0, "sistema completo".',
      'PROHIBIDO: pasado perfecto, present perfect, have/has/had + participio, ED en irregulares (goed/sended).',
      'SOLO: en pasado nadie cambia; BE → was/were; ancla yesterday/last/ago; put/cut/let + ancla.',
      'SEGUÍ EL GUION CANON module-03-pasado-simple SIN CORTAR NI REESCRIBIR.',
      'ANTES de construir: preguntá "¿pasado o presente?" — y quedate en PASADO.'
    ],
    perfect: [
      'ANTIMEZCLA — MÓDULO 4 PERFECTO (HAVE/HAS/HAD + BEEN+ING):',
      'SOLO perfecto (HAVE/HAS/HAD + PP / BEEN+ING). PROHIBIDO panorama F0, futuro, will/would overview, otros módulos.',
      'PROHIBIDO enseñar como pasado simple con yesterday; PROHIBIDO I gone sin HAVE/HAS; PROHIBIDO HAS en pasado perfecto.',
      'SOLO: HAVE/HAS+PP · HAD+PP · HAVE/HAS+BEEN+ING · HAD+BEEN+ING. Español HABER primero.',
      'SEGUÍ EL GUION CANON module-04-perfecto SIN CORTAR NI REESCRIBIR.',
      'ANTES: ¿sigue o terminó? ¿Conecta con presente o con otro pasado?'
    ],
    combined: [
      'ANTIMEZCLA — MÓDULO 4 BEEN+ING (misma clase module-04):',
      'SOLO BEEN+ING. PROHIBIDO panorama de todos los tiempos.',
      'BEEN activa ING. HAVE/HAS/HAD + BEEN + VERBO-ING = he/había estado + ando/endo.',
      'SEGUÍ EL GUION CANON module-04-perfecto SIN CORTAR NI REESCRIBIR.'
    ],
    present: [
      'ANTIMEZCLA — MÓDULO 2 VERBOS PRESENTE (16 VERBOS + CONJUGACIÓN):',
      'SOLO presente simple + TO infinitivo + He/She/It +S/ES/Has + Be am/is/are.',
      'PROHIBIDO ABSOLUTO: panorama de todos los tiempos, F0, overview, pasado, perfecto, continuo, futuro, will/would, "sistema completo", once estructuras.',
      'PROHIBIDO presente continuo / perfecto / pasado / futuro en esta lección — aunque Super Brain o MSI listen otras siglas.',
      'SEGUÍ EL GUION CANON module-02-verbos-presente SIN CORTAR NI REESCRIBIR.',
      'ANTES de conjugar He/She/It: preguntá "¿Es He, She o It? — entonces qué le pasa al verbo?"'
    ],
    progressive: [
      'ANTIMEZCLA — MÓDULO 5 / CLASE 009 GERUNDIO:',
      'SOLO gerundio/continuo de esta clase. PROHIBIDO panorama F0 / otros tiempos.',
      'TO BE=llave; ING=puerta; TO=flecha; ING=concepto; después de preposición siempre ING.',
      'SEGUÍ EL GUION CANON module-05-gerundio ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    future: [
      'ANTIMEZCLA — MÓDULO 6 / CLASE 010 WILL-WOULD:',
      'SOLO WILL/WOULD + modales + futuro perfecto de ESTA clase. PROHIBIDO reabrir presente/pasado/perfecto como clase aparte.',
      'WILL=RÉ real; WOULD=RÍA hipotético; modal + verbo base sin TO; WILL+HAVE+PP; BY marca el límite.',
      'SEGUÍ EL GUION CANON module-06-will-would ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    future_perfect: [
      'ANTIMEZCLA — MÓDULO 6 / CLASE 010 WILL-WOULD:',
      'SOLO WILL/WOULD + futuro perfecto. PROHIBIDO panorama de otros módulos.',
      'WILL=RÉ real; WOULD=RÍA hipotético; modal + verbo base sin TO; WILL+HAVE+PP; BY marca el límite.',
      'SEGUÍ EL GUION CANON module-06-will-would ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    modales: [
      'ANTIMEZCLA — MÓDULO 6 / CLASE 010 WILL-WOULD:',
      'SOLO WILL/WOULD + modales de ESTA clase. PROHIBIDO panorama F0 de todos los tiempos.',
      'WILL=RÉ real; WOULD=RÍA hipotético; modal + verbo base sin TO; WILL+HAVE+PP; BY marca el límite.',
      'SEGUÍ EL GUION CANON module-06-will-would ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    modal: [
      'ANTIMEZCLA: moneda — AUX delante = pregunta.',
      'SOLO método moneda. PROHIBIDO abrir otros módulos.'
    ],
    negations: [
      'ANTIMEZCLA: negaciones AUX + NOT.',
      'SOLO negaciones. PROHIBIDO panorama de tiempos.'
    ],
    there: [
      'ANTIMEZCLA: there is/are = hay; no have.',
      'SOLO there is/are. PROHIBIDO otros módulos.'
    ],
    gerundio: [
      'ANTIMEZCLA — MÓDULO 5 / CLASE 009 GERUNDIO:',
      'SOLO gerundio de esta clase. PROHIBIDO panorama F0 / otros tiempos.',
      'TO BE=llave; ING=puerta; TO=flecha; ING=concepto; después de preposición siempre ING.',
      'SEGUÍ EL GUION CANON module-05-gerundio ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    gerund_prep: [
      'ANTIMEZCLA — MÓDULO 5 / CLASE 009 GERUNDIO:',
      'SOLO gerundio + prep. PROHIBIDO panorama F0 / otros tiempos.',
      'TO BE=llave; ING=puerta; TO=flecha; ING=concepto; después de preposición siempre ING.',
      'SEGUÍ EL GUION CANON module-05-gerundio ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
    ],
    modal_have_pp: [
      'ANTIMEZCLA: modal + have + participio.',
      'SOLO modal + have + PP. PROHIBIDO futuro perfecto will have ni panorama F0.'
    ],
    modal_have_been: [
      'ANTIMEZCLA: modal + have been + ING.',
      'SOLO modal + have been + ING. PROHIBIDO otros módulos.'
    ],
    prepositions: [
      'ANTIMEZCLA: IN/ON/AT — analogía caja/superficie/punto.',
      'SOLO preposiciones pedidas. Nunca hijackear otra lección.'
    ],
    prepositions_time: [
      'ANTIMEZCLA: prep. de tiempo.',
      'SOLO si el estudiante PIDIÓ preposiciones de tiempo. "in the morning" dentro de un ejemplo de futuro NO abre este módulo.'
    ],
    articles: [
      'ANTIMEZCLA: a/an/the.',
      'SOLO artículos. PROHIBIDO otros módulos.'
    ],
    comparatives: [
      'ANTIMEZCLA: comparativos.',
      'SOLO comparativos. PROHIBIDO otros módulos.'
    ],
    irregular_verbs: [
      'ANTIMEZCLA: irregulares go. went. gone.',
      'SOLO paradigmas irregulares pedidos. PROHIBIDO clase completa de todos los tiempos.'
    ],
    have_had: [
      'ANTIMEZCLA: have. has. had.',
      'SOLO have/has/had. PROHIBIDO panorama F0.'
    ],
    if_was_were: [
      'ANTIMEZCLA: if I was/were.',
      'SOLO was/were condicional. PROHIBIDO otros módulos.'
    ],
    pronouns: [
      'ANTIMEZCLA — MÓDULO 1 PRONOMBRES (5 TIPOS):',
      'SOLO los cinco tipos: sujeto, objeto, posesivo adjetivo, posesivo pronominal, reflexivo.',
      'PROHIBIDO mezclar con tiempos verbales / gerundio / perfecto / panorama F0 en esta lección.',
      'SEGUÍ EL GUION CANON module-01-pronombres SIN CORTAR NI REESCRIBIR.'
    ],
    overview: [
      'ANTIMEZCLA: overview de tiempos.',
      'SOLO overview SI el estudiante PIDIÓ panorama/todos los tiempos. Si pidió un solo tiempo, NO uses este track.'
    ]
  };
  if (locks[track.id]) antiMix.push(...locks[track.id]);
  else antiMix.push('ANTIMEZCLA: este turno SOLO el track "' + track.title + '". PROHIBIDO panorama F0 u otros módulos.');
  const voice = loadVoiceScript(track.id);
  const voiceBlock = voice
    ? [
        '===== GUION ORAL DE CLASE (HABLA ESTO — no ESL genérico; no leas el tablero) =====',
        voice.say,
        Array.isArray(voice.mustSay) && voice.mustSay.length
          ? `PALABRAS OBLIGATORIAS EN VOZ: ${voice.mustSay.join(', ')}.`
          : '',
        voice.exampleAsk ? `CIERRE ORAL: ${voice.exampleAsk}` : '',
        '===== FIN GUION — el tablero solo se SEÑALA, no se lee ====='
      ].filter(Boolean)
    : [];
  const bridgeClean = String(track.bridge || '')
    .replace(/\bGet It Straight(?:\s*ING)?\b/gi, '')
    .replace(/\b(?:John\s+)?Off the Clock\b/gi, '')
    .replace(/\bPuente\s+JOHN\b/gi, 'Puente')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return [
    'CANON LOCK + ESTILO DE CLASE (rige TODO):',
    `Tablero en pantalla: ${track.title} (id=${track.id}) — el estudiante YA LO VE.`,
    `Fórmula: ${track.formula}`,
    `Puente (contenido, no nombres internos): ${bridgeClean || '(usar guion del track)'}`,
    `Ejemplo canónico: ${track.example}`,
    never ? `PROHIBIDO: ${never}` : '',
    'PROHIBIDO EN VOZ/CHAT: nombres internos de lección, shows o trainers.',
    ...soloScope,
    ...antiMix,
    ...voiceBlock,
    'CHECKLIST ESTE TURNO (si falta 1 = FALLASTE):',
    '1) Hablar el GUION ORAL de arriba (estilo de clase).',
    '2) Incluir fórmula/puente del guion en español TICO correcto (sin acento gringo).',
    '3) 1 ejemplo en inglés + práctica oral mirando el tablero.',
    '4) ¿Te quedó?',
    'PROHIBIDO: ESL genérico; leer tablero fila por fila; inventar otro método; cambiar de módulo; panorama de tiempos.',
    'RELEVANCIA IRROMPIBLE: SOLO este track. PROHIBIDO abrir otro tablero/tema (preposiciones, artículos, otro tiempo, etc.) por palabras incidentales del ejemplo.',
    'VOZ: VERBO+ING = "verbo más í ene je". Paradigmas con pausa (go. went. gone.).',
    'Este turno: SOLO este track. [[CTYPE:whiteboard]]'
  ].filter(Boolean).join('\n');
}

function byColumn() {
  const out = {};
  tracks().forEach((tr) => {
    out[tr.id] = {
      id: String(tr.svg || '').split('/').pop().replace(/\.svg$/, ''),
      path: tr.svg,
      title: tr.title,
      formula: tr.formula,
      example: tr.example
    };
  });
  return out;
}

module.exports = {
  loadMap,
  normalize,
  pickTrack,
  pickTrackId,
  trackById,
  wantsVisual,
  stripAskShell,
  isExplicitTopicAsk,
  isEnglishPracticeUtterance,
  resolveAsk,
  resolveAskId,
  resolvePieceTrack,
  formatLock,
  byColumn,
  expandLearnerAsk: (t) => JillLearnerIntent.expand(t)
};
