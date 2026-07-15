import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'config', 'jill-canon-map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const extra = {
  past: ['pasado', 'el pasado', 'pizarron del pasado', 'imagen del pasado'],
  present: ['presente', 'el presente'],
  progressive: ['continuo', 'el continuo', 'ing continuo'],
  perfect: ['perfecto', 'el perfecto'],
  future: ['el futuro'],
  there: ['existencial', 'hay'],
  negations: ['negacion', 'negación', 'aux + not'],
  modales: ['los modales'],
  modal: ['la moneda', 'metodo de moneda'],
  prepositions: ['in on', 'on at'],
  gerundio: ['el gerund', 'que es gerundio'],
  gerund_prep: ['despues de preposicion'],
  articles: ['a an the', 'a/an/the'],
  comparatives: ['superlativo'],
  irregular_verbs: ['irregulares'],
  if_was_were: ['was were', 'if was'],
  have_had: ['have has had'],
  combined: ['been + ing', 'perfecto continuo'],
  modal_have_pp: ['modal + have'],
  modal_have_been: ['modal + have been'],
  overview: ['matriz', 'todos los tiempos']
};

for (const tr of map.tracks) {
  const add = extra[tr.id] || [];
  const set = new Set(tr.aliases || []);
  for (const a of add) set.add(a);
  tr.aliases = [...set];
}

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.copyFileSync(mapPath, path.join(root, 'backend', 'config', 'jill-canon-map.json'));

const beResolve = `
function wantsVisual(text) {
  return /\\b(imagen|pizarr[oó]n|whiteboard|tablero|visual|diagrama|cuadro)\\b/i.test(String(text || ''));
}

function stripAskShell(text) {
  let t = String(text || '');
  t = t.replace(/\\b(dame|d[aá]me|mostr[aá]me|mu[eé]strame|mostrar|ense[nñ]ame|ense[nñ][aá]|ver|abrir|pon[eé]me|trae|quiero|necesito|explicame|expl[ií]came|explic[aá]|explica)\\b/gi, ' ');
  t = t.replace(/\\b(la|el|una|un)\\s+(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\\b/gi, ' ');
  t = t.replace(/\\b(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\\b/gi, ' ');
  t = t.replace(/\\b(de|del|de\\s+la|sobre|con|acerca\\s+de)\\b/gi, ' ');
  return t.replace(/\\s+/g, ' ').trim();
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
`;

const bePath = path.join(root, 'backend', 'jill-canon-router.js');
let be = fs.readFileSync(bePath, 'utf8');
if (!be.includes('function resolveAsk')) {
  be = be.replace(
    'function pickTrackId(text) {\n  const t = pickTrack(text);\n  return t ? t.id : null;\n}\n',
    'function pickTrackId(text) {\n  const t = pickTrack(text);\n  return t ? t.id : null;\n}\n' + beResolve + '\n'
  );
  be = be.replace(
    'module.exports = {\n  loadMap,\n  normalize,\n  pickTrack,\n  pickTrackId,\n  formatLock,\n  byColumn\n};',
    'module.exports = {\n  loadMap,\n  normalize,\n  pickTrack,\n  pickTrackId,\n  wantsVisual,\n  stripAskShell,\n  resolveAsk,\n  resolveAskId,\n  formatLock,\n  byColumn\n};'
  );
  fs.writeFileSync(bePath, be);
}

const feResolve = `
  function wantsVisual(text) {
    return /\\b(imagen|pizarr[oó]n|whiteboard|tablero|visual|diagrama|cuadro)\\b/i.test(String(text || ''));
  }

  function stripAskShell(text) {
    var t = String(text || '');
    t = t.replace(/\\b(dame|d[aá]me|mostr[aá]me|mu[eé]strame|mostrar|ense[nñ]ame|ense[nñ][aá]|ver|abrir|pon[eé]me|trae|quiero|necesito|explicame|expl[ií]came|explic[aá]|explica)\\b/gi, ' ');
    t = t.replace(/\\b(la|el|una|un)\\s+(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\\b/gi, ' ');
    t = t.replace(/\\b(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\\b/gi, ' ');
    t = t.replace(/\\b(de|del|de\\s+la|sobre|con|acerca\\s+de)\\b/gi, ' ');
    return t.replace(/\\s+/g, ' ').trim();
  }

  function resolveAsk(userAsk, stickyTopic) {
    var ask = String(userAsk || '').trim();
    var sticky = String(stickyTopic || '').replace(/^doubt:/i, '').trim();
    var hit = pickTrack(ask);
    if (hit) return hit;
    var stripped = stripAskShell(ask);
    if (stripped) {
      hit = pickTrack(stripped);
      if (hit) return hit;
    }
    if (sticky) {
      hit = pickTrack(sticky);
      if (hit) return hit;
      var ss = stripAskShell(sticky);
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
    var t = resolveAsk(userAsk, stickyTopic);
    return t ? t.id : null;
  }
`;

const fePath = path.join(root, 'js', 'jill-canon-router.js');
let fe = fs.readFileSync(fePath, 'utf8');
const start = fe.indexOf('var EMBEDDED_MAP = ');
const end = fe.indexOf('var MAP = EMBEDDED_MAP;');
if (start < 0 || end < 0) throw new Error('embed markers missing');
fe = fe.slice(0, start) + 'var EMBEDDED_MAP = ' + JSON.stringify(map, null, 2) + ';\n\n  ' + fe.slice(end);
fe = fe.replace(/var CACHE_VER = '[^']+';/, "var CACHE_VER = '20260710lib';");
if (!fe.includes('function resolveAsk')) {
  fe = fe.replace(
    'function pickTrackId(text) {\n    var t = pickTrack(text);\n    return t ? t.id : null;\n  }',
    'function pickTrackId(text) {\n    var t = pickTrack(text);\n    return t ? t.id : null;\n  }\n' + feResolve
  );
  fe = fe.replace(
    'pickTrack: pickTrack,\n    pickTrackId: pickTrackId,\n    formatLock: formatLock,\n    byColumn: byColumn,\n    CACHE_VER: CACHE_VER',
    'pickTrack: pickTrack,\n    pickTrackId: pickTrackId,\n    wantsVisual: wantsVisual,\n    stripAskShell: stripAskShell,\n    resolveAsk: resolveAsk,\n    resolveAskId: resolveAskId,\n    formatLock: formatLock,\n    byColumn: byColumn,\n    CACHE_VER: CACHE_VER'
  );
}
fs.writeFileSync(fePath, fe);

const visPath = path.join(root, 'config', 'jill-canon-visual.json');
const vis = JSON.parse(fs.readFileSync(visPath, 'utf8'));
vis.version = 7;
for (const c of vis.clips) {
  if (c.id === 'gerundio-prep' && !c.columns.includes('gerundio')) c.columns.push('gerundio');
}
fs.writeFileSync(visPath, JSON.stringify(vis, null, 2) + '\n');
const beVis = path.join(root, 'backend', 'config', 'jill-canon-visual.json');
try { fs.copyFileSync(visPath, beVis); } catch (_) { /* optional */ }

// Fresh require of backend router (MAP may be stale if already loaded — rewrite file forces new process)
const r = require(path.join(root, 'backend', 'jill-canon-router.js'));
const samples = [
  ['dame la imagen', 'gerundio', 'gerundio'],
  ['pizarrón del pasado', '', 'past'],
  ['imagen de in on at', '', 'prepositions'],
  ['dame la imagen', 'pasado simple', 'past'],
  ['explicame las negaciones', '', 'negations'],
  ['muéstrame el presente continuo', '', 'progressive'],
  ['tablero de there is', '', 'there'],
  ['imagen del gerundio', '', 'gerundio']
];
let fail = 0;
for (const [ask, sticky, expect] of samples) {
  const got = r.resolveAskId(ask, sticky);
  const ok = got === expect;
  console.log(ok ? 'OK' : 'FAIL', JSON.stringify(ask), '+', JSON.stringify(sticky), '->', got, ok ? '' : `(expected ${expect})`);
  if (!ok) fail++;
}
if (fail) process.exit(1);
console.log('resolveAsk samples OK; tracks', map.tracks.length);
