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

function stripAskShell(text) {
  let t = String(text || '');
  t = t.replace(/\b(dame|d[aá]me|mostr[aá]me|mu[eé]strame|mostrar|ense[nñ]ame|ense[nñ][aá]|ver|abrir|pon[eé]me|trae|quiero|necesito|explicame|expl[ií]came|explic[aá]|explica)\b/gi, ' ');
  t = t.replace(/\b(la|el|una|un)\s+(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
  t = t.replace(/\b(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
  t = t.replace(/\b(de|del|de\s+la|sobre|con|acerca\s+de)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function resolveAsk(userAsk, stickyTopic) {
  const ask = String(userAsk || '').trim();
  const sticky = String(stickyTopic || '').replace(/^doubt:/i, '').trim();
  let hit = pickTrack(ask);
  if (hit) return hit;
  const stripped = stripAskShell(ask);
  if (stripped) {
    hit = pickTrack(stripped);
    if (hit) return hit;
  }
  if (sticky) {
    hit = pickTrack(sticky);
    if (hit) return hit;
    const ss = stripAskShell(sticky);
    if (ss) {
      hit = pickTrack(ss);
      if (hit) return hit;
    }
  }
  hit = pickTrack([ask, sticky].filter(Boolean).join(' '));
  if (hit) return hit;
  return pickTrack([stripped, sticky].filter(Boolean).join(' ')) || null;
}

function resolveAskId(userAsk, stickyTopic) {
  const t = resolveAsk(userAsk, stickyTopic);
  return t ? t.id : null;
}


function loadVoiceScript(trackId) {
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
  const antiMix = [];
  const locks = {
    past: [
      'ANTIMEZCLA OBLIGATORIA — PASADO SIMPLE (PS) SOLAMENTE:',
      'PROHIBIDO decir: pasado perfecto, present perfect, have/has/had + participio.',
      'SOLO: pronombre + verbo en pasado + yesterday/ago/last.'
    ],
    perfect: [
      'ANTIMEZCLA — PERFECTO (have/has/had + participio): NO lo enseñes como pasado simple.'
    ],
    present: ['ANTIMEZCLA: presente simple — no mezcles con pasado/perfecto/continuo.'],
    progressive: [
      'ANTIMEZCLA: presente continuo.',
      'OBLIGATORIO EN VOZ: en español el auxiliar es ESTAR; en inglés OBLIGATORIO TO BE (am/is/are) + VERBO+ING; ING = ando/endo. Si no decís estar→to be y ando/endo, FALLASTE.'
    ],
    future: ['ANTIMEZCLA: futuro will/going to.'],
    modales: ['ANTIMEZCLA: modales — will=-ré; would=-ría; etc.'],
    modal: ['ANTIMEZCLA: moneda — AUX delante = pregunta.'],
    negations: ['ANTIMEZCLA: negaciones AUX + NOT.'],
    there: ['ANTIMEZCLA: there is/are = hay; no have.'],
    gerundio: [
      'ANTIMEZCLA: gerundio como sustantivo.',
      'OBLIGATORIO EN VOZ: VERBO+ING = ando/endo. Gerundio sustantivo NO lleva to be. CONTRASTE OBLIGATORIO: ESTAR + ando/endo en español → TO BE + ING (continuo). Si omitís ando/endo o el contraste estar/to be, FALLASTE.'
    ],
    gerund_prep: ['ANTIMEZCLA: prep + VERBO+ING = ando/endo. Decí ando/endo.'],
    combined: ['ANTIMEZCLA: have been + ING = he estado + ando/endo.'],
    modal_have_pp: ['ANTIMEZCLA: modal + have + participio.'],
    modal_have_been: ['ANTIMEZCLA: modal + have been + ING.'],
    prepositions: ['ANTIMEZCLA: IN/ON/AT — analogía caja/superficie/punto.'],
    prepositions_time: ['ANTIMEZCLA: prep. de tiempo.'],
    articles: ['ANTIMEZCLA: a/an/the.'],
    comparatives: ['ANTIMEZCLA: comparativos.'],
    irregular_verbs: ['ANTIMEZCLA: irregulares go. went. gone.'],
    have_had: ['ANTIMEZCLA: have. has. had.'],
    if_was_were: ['ANTIMEZCLA: if I was/were.'],
    overview: ['ANTIMEZCLA: overview de tiempos.']
  };
  if (locks[track.id]) antiMix.push(...locks[track.id]);
  else antiMix.push('ANTIMEZCLA: este turno SOLO el track "' + track.title + '".');
  const voice = loadVoiceScript(track.id);
  const voiceBlock = voice
    ? [
        'GUION ORAL JOHN (estilo de clase — DEBES DECIRLO; no ESL genérico):',
        voice.say,
        Array.isArray(voice.mustSay) && voice.mustSay.length
          ? `PALABRAS OBLIGATORIAS EN VOZ: ${voice.mustSay.join(', ')}.`
          : '',
        voice.exampleAsk ? `CIERRE ORAL: ${voice.exampleAsk}` : ''
      ].filter(Boolean)
    : [];
  return [
    'CANON LOCK + METODOLOGÍA JOHN (rige TODO — no solo este módulo):',
    `Tablero: ${track.title}`,
    `Track id: ${track.id}`,
    `Fórmula oficial: ${track.formula}`,
    `Puente John (DEBES DECIRLO EN VOZ — no lo saltees): ${track.bridge || '(usar analogía del track)'}`,
    `Ejemplo canónico: ${track.example}`,
    never ? `PROHIBIDO: ${never}` : '',
    ...antiMix,
    ...voiceBlock,
    'CHECKLIST OBLIGATORIO EN ESTE TURNO (si falta 1 ítem = FALLASTE):',
    '1) Nombrar el tema.',
    '2) Decir la FÓRMULA en español (ranuras).',
    '3) Decir el GUION / PUENTE John de arriba (ando/endo, estar→to be, -ré/-ría, moneda, hay, etc. según el track).',
    '4) 1 ejemplo en inglés.',
    '5) Pedir práctica oral mirando el tablero.',
    'PROHIBIDO: explicación genérica ESL; omitir el puente; inventar otro método; cambiar de módulo.',
    'VOZ: VERBO+ING = "verbo más I N G". Paradigmas con pausa (go. went. gone.).',
    'La metodología de John rige TODOS los módulos, no solo gerundio.',
    'Este turno: SOLO este track. [[CTYPE:whiteboard]]'
  ].filter(Boolean).join('\n');
}

function trackById(id) {
  if (!id) return null;
  const list = tracks();
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
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
  resolveAsk,
  resolveAskId,
  formatLock,
  byColumn,
  expandLearnerAsk: (t) => JillLearnerIntent.expand(t)
};
