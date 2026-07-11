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


function formatLock(track) {
  if (!track) return '';
  const never = (track.never || []).join('; ');
  const antiMix = [];
  if (track.id === 'past') {
    antiMix.push(
      'ANTIMEZCLA OBLIGATORIA — PASADO SIMPLE (PS) SOLAMENTE:',
      'PROHIBIDO decir: pasado perfecto, present perfect, have/has/had + participio, "I have worked", "had done", "he/ha/había + participio".',
      'SOLO enseñá: pronombre + verbo en pasado (worked / went / saw) + complemento (yesterday / ago / last…).',
      'El tablero del estudiante muestra PASADO SIMPLE — tu voz DEBE coincidir palabra por palabra con ese tablero. Cero contraste con perfecto en este turno.'
    );
  } else if (track.id === 'perfect') {
    antiMix.push(
      'ANTIMEZCLA OBLIGATORIA — PERFECTO (have/has/had + participio):',
      'PROHIBIDO enseñar esto como pasado simple (worked yesterday / went).',
      'Si es pasado perfecto: had + participio. Si es presente perfecto: have/has + participio. Nunca verbos en -ed sueltos como si fueran PS.'
    );
  } else if (track.id === 'present') {
    antiMix.push('ANTIMEZCLA: presente simple — no mezcles con pasado simple ni perfecto ni continuo.');
  } else if (track.id === 'progressive') {
    antiMix.push('ANTIMEZCLA: presente continuo (am/is/are + ING) — no lo mezcles con gerundio suelto ni con perfecto continuo.');
  }
  return [
    'JILL DJ — TRACK LOCK DURO (el tablero del portal muestra ESTE módulo — tu explicación DEBE ser el mismo)',
    `Track id: ${track.id}`,
    `Track: ${track.title}`,
    `Fórmula oficial: ${track.formula}`,
    track.bridge || '',
    `Ejemplo canónico: ${track.example}`,
    never ? `PROHIBIDO mezclar: ${never}` : '',
    ...antiMix,
    'VOZ: decí ranuras en español (pronombre/modal/verbo/complemento). VERBO+ING = "verbo más I N G". Paradigmas con pausa (go. went. gone.).',
    'ESTILO JOHN: paciencia + flujo normal. Fórmula + bridge + 1 analogía. Sin improvisar otro tiempo/módulo.',
    'Hablás exactamente lo que se ve en el tablero. Cero "además te explico el perfecto" si el lock es otro.',
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
