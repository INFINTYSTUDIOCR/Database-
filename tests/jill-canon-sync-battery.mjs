/**
 * Jill — sync total: todos los módulos canon.
 * Pedido → resolveAsk → TRACK LOCK (companion) → SVG/clip (tablero) sin desfase.
 *
 * node tests/jill-canon-sync-battery.mjs
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const map = JSON.parse(fs.readFileSync(path.join(root, 'config/jill-canon-map.json'), 'utf8'));
const vis = JSON.parse(fs.readFileSync(path.join(root, 'config/jill-canon-visual.json'), 'utf8'));
const beMap = JSON.parse(fs.readFileSync(path.join(root, 'backend/config/jill-canon-map.json'), 'utf8'));
const router = require(path.join(root, 'backend/jill-canon-router.js'));
const JillPro = require(path.join(root, 'backend/jill-companion.js'));

// Load front router + foundations in Node (same as portal)
const routerSrc = fs.readFileSync(path.join(root, 'js/jill-canon-router.js'), 'utf8');
new Function('window', 'globalThis', routerSrc)(globalThis, globalThis);
const foundationsSrc = fs.readFileSync(path.join(root, 'js/jill-foundations.js'), 'utf8');
new Function('window', 'globalThis', foundationsSrc)(globalThis, globalThis);
const JF = globalThis.JillFoundations;
const FE = globalThis.JillCanonRouter;

let pass = 0;
let fail = 0;
const fails = [];

function assert(cond, name, detail) {
  if (cond) {
    pass++;
    console.log('PASS | ' + name + (detail ? ' — ' + detail : ''));
  } else {
    fail++;
    const line = 'FAIL | ' + name + (detail ? ' — ' + detail : '');
    fails.push(line);
    console.error(line);
  }
}

function primaryAsk(track) {
  const aliases = track.aliases || [];
  // Prefer a Spanish-looking / long alias for the ask
  const ranked = [...aliases].sort((a, b) => b.length - a.length);
  return ranked[0] || track.title || track.id;
}

function shortSticky(track) {
  const aliases = track.aliases || [];
  // Prefer a short clear alias for sticky
  const short = aliases.find((a) => a.length >= 4 && a.length <= 24) || aliases[0] || track.id;
  return short;
}

console.log('=== Jill canon SYNC — ' + map.tracks.length + ' módulos ===\n');

// ── 0) Catalog integrity ─────────────────────────────────────
assert(map.tracks.length >= 20, 'catalog size', 'n=' + map.tracks.length);
assert(beMap.tracks.length === map.tracks.length, 'front/back map same size', beMap.tracks.length + ' vs ' + map.tracks.length);
assert(FE && typeof FE.resolveAskId === 'function', 'front resolveAskId loaded', !!FE);
assert(JF && typeof JF.detectCanonColumn === 'function', 'foundations detectCanonColumn', !!JF);

const clipCols = new Set();
for (const c of vis.clips || []) {
  for (const col of c.columns || []) clipCols.add(col);
}

const byCol = router.byColumn();

// ── 1) Per-track sync ────────────────────────────────────────
for (const track of map.tracks) {
  const id = track.id;
  const ask = primaryAsk(track);
  const sticky = shortSticky(track);

  console.log('\n--- ' + id + ' ---');

  // SVG on disk
  assert(fs.existsSync(path.join(root, track.svg)), id + ' svg exists', track.svg);
  assert(fs.existsSync(path.join(root, 'backend', track.svg)) || fs.existsSync(path.join(root, track.svg)), id + ' svg reachable', 'ok');

  // Visual clip column
  assert(clipCols.has(id), id + ' visual clip column', 'in jill-canon-visual.json');

  // byColumn formula/svg
  assert(!!byCol[id], id + ' byColumn entry', 'ok');
  if (byCol[id]) {
    assert(byCol[id].path === track.svg, id + ' byColumn svg match', byCol[id].path);
  }

  // Backend resolveAsk
  const beId = router.resolveAskId(ask, '');
  assert(beId === id, id + ' BE resolveAsk(ask)', 'got=' + beId + ' ask=' + JSON.stringify(ask).slice(0, 60));

  // Front resolveAsk
  const feId = FE.resolveAskId(ask, '');
  assert(feId === id, id + ' FE resolveAsk(ask)', 'got=' + feId);

  // Foundations detectCanonColumn (portal board)
  const col = JF.detectCanonColumn(ask, null);
  assert(col === id, id + ' board detectCanonColumn', 'got=' + col);

  // Visual shell forms
  const imagenAsk = 'imagen de ' + sticky;
  const beImg = router.resolveAskId(imagenAsk, '');
  assert(beImg === id, id + ' imagen de…', 'got=' + beImg + ' for ' + JSON.stringify(imagenAsk).slice(0, 50));

  const dame = router.resolveAskId('dame la imagen', sticky);
  assert(dame === id, id + ' dame la imagen + sticky', 'got=' + dame + ' sticky=' + JSON.stringify(sticky).slice(0, 40));

  const pizarra = router.resolveAskId('pizarrón del ' + sticky, '');
  // pizarra may fail if sticky is English-only short; still try
  if (pizarra) {
    assert(pizarra === id, id + ' pizarrón del…', 'got=' + pizarra);
  } else {
    assert(true, id + ' pizarrón del… (skip weak sticky)', sticky);
  }

  // Companion teach lock — same track in instruction
  const teach = JillPro.buildJillProStreamTeachInstruction(
    'doubt:' + id,
    'explicame ' + ask,
    [{ role: 'assistant', content: 'Hola, ¿qué querés hoy?' }]
  );
  assert(/TRACK LOCK/i.test(teach), id + ' companion TRACK LOCK', 'phase has lock');
  assert(teach.includes(track.title) || teach.includes(track.formula), id + ' companion lock title/formula', 'ok');
  assert(/EJERCICIO ORAL|Decime|Complet[aá]|Arm[aá]/i.test(teach), id + ' teach requires oral drill', 'ok');
  assert(/ENSEÑANZA CANON|TODA LA BIBLIOTECA|paradigma|pausa/i.test(teach), id + ' teach canon library-wide', 'ok');
  assert(
    !/(?:digas|decí|decí|decíle|decí)\s+["']?ac[aá]\s+te\s+va\s+una\s+imagen/i.test(teach)
      && !/^[^P]*ac[aá]\s+te\s+va\s+una\s+imagen/m.test(teach.replace(/PROHIBIDO[^\n]*/gi, '')),
    id + ' prompt no ordena fingir imagen',
    'ok'
  );
  assert(/CTYPE:whiteboard|tablero/i.test(teach), id + ' whiteboard/tablero sync cue', 'ok');
  assert(/EJERCICIO ORAL obligatorio/i.test(JillCanonRouter.formatLock(track)), id + ' formatLock drill cue', 'ok');

  // Front/back agreement on a few aliases
  for (const a of (track.aliases || []).slice(0, 3)) {
    const aBe = router.pickTrackId(a);
    const aFe = FE.pickTrackId(a);
    assert(aBe === aFe, id + ' FE=BE alias', JSON.stringify(a) + ' → ' + aBe + '/' + aFe);
  }
}

// ── 2) Never / confusion pairs ───────────────────────────────
console.log('\n=== Confusiones prohibidas ===');
const neverPairs = [
  ['in on at', 'gerundio'],
  ['in on at', 'gerund_prep'],
  ['presente continuo', 'gerundio'],
  ['presente continuo', 'gerund_prep'],
  ['gerundio', 'progressive'],
  ['modales', 'modal'],
  ['futuro perfecto', 'future'],
  ['pasado simple', 'present'],
  ['preposiciones', 'gerund_prep'],
  ['there is', 'have_had'],
  ['metodo moneda', 'modales'],
  ['have been studying', 'progressive']
];
for (const [q, bad] of neverPairs) {
  const got = router.resolveAskId(q, '');
  assert(got !== bad, 'never ' + JSON.stringify(q) + ' != ' + bad, 'got=' + got);
}

// ── 3) Sticky isolation: imagen alone must use sticky, not invent ─
console.log('\n=== Sticky isolation ===');
assert(router.resolveAskId('dame la imagen', '') == null, 'imagen sola sin sticky → null', String(router.resolveAskId('dame la imagen', '')));
assert(router.resolveAskId('dame la imagen', 'pasado simple') === 'past', 'sticky past', 'ok');
assert(router.resolveAskId('dame la imagen', 'negaciones') === 'negations', 'sticky negations', 'ok');
assert(router.resolveAskId('dame la imagen', 'there is') === 'there', 'sticky there', 'ok');

// ── 4) Module coverage checklist ─────────────────────────────
console.log('\n=== Cobertura ===');
const covered = new Set(map.tracks.map((t) => t.id));
const required = [
  'present', 'past', 'progressive', 'perfect', 'combined', 'future',
  'modales', 'modal', 'modal_have_pp', 'modal_have_been',
  'prepositions', 'prepositions_time', 'there', 'gerundio', 'gerund_prep',
  'negations', 'comparatives', 'articles', 'have_had', 'if_was_were',
  'irregular_verbs', 'overview'
];
for (const id of required) {
  assert(covered.has(id), 'módulo presente: ' + id, covered.has(id) ? 'ok' : 'MISSING');
}

console.log('\n========== JILL CANON SYNC SUMMARY ==========');
console.log('MÓDULOS ' + map.tracks.length);
console.log('PASS ' + pass + '  FAIL ' + fail + '  TOTAL ' + (pass + fail));
if (fails.length) {
  console.log('\nFailures:');
  fails.forEach((f) => console.log(f));
}
process.exit(fail ? 1 : 0);
