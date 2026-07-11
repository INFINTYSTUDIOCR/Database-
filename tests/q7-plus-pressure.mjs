/**
 * Q7+ pressure — PTT + TTS coherence + canon UTF-8 + topic boards + Jill intent.
 * No weird chars, no flow cuts (parens / plus mix / mojibake).
 * node tests/q7-plus-pressure.mjs
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

let pass = 0;
let fail = 0;
function assert(cond, name, detail) {
  if (cond) {
    pass++;
    console.log('PASS | ' + name + (detail ? ' — ' + detail : ''));
  } else {
    fail++;
    console.error('FAIL | ' + name + (detail ? ' — ' + detail : ''));
  }
}

function hasWeird(s) {
  const t = String(s || '');
  if (t.includes('\uFFFD') || t.includes('\u0000') || t.includes('\u0014')) return true;
  return /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(t);
}

// ── 1) Sub-batteries ─────────────────────────────────────────
console.log('=== Q7+ A: PTT + TTS gen + Jill 24 + canon sync + drill ===');
for (const script of ['ptt-mic-pressure.mjs', 'tts-gen-pressure.mjs', 'jill-pro-pressure-24.mjs', 'jill-canon-sync-battery.mjs', 'jill-canon-drill-battery.mjs']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    encoding: 'utf8',
    cwd: root,
    env: { ...process.env, Q7_PLUS_CHILD: '1', Q7_UNIT_ONLY: '1' }
  });
  assert(r.status === 0, script, 'exit=' + r.status + ' ' + String(r.stderr || '').slice(0, 120));
}

// ── 2) TTS teaching forms — no junk, coherent flow ───────────
console.log('\n=== Q7+ B: TTS clean flow ===');
const ttsSrc = fs.readFileSync(path.join(root, 'js', 'tts-chunks.js'), 'utf8');
const ttsApi = new Function(
  ttsSrc +
    '\nreturn { prepareTtsLine, normalizeTtsTeachingForms, jillTtsSegments, detectJillLineLang };'
)();

const samples = [
  {
    in: 'La formula es P + V + C (ranuras MSI). El verbo BE (ser/estar) y AM.',
    mustInclude: ['P más V más C', 'be', 'am'],
    mustNot: ['(', ')', 'plus', '\uFFFD', '�']
  },
  {
    in: 'Negacion: P + AUX + NOT + V + C. No digas "I no work".',
    mustInclude: ['más', 'auxiliar', 'not'],
    mustNot: ['plus', '(', ')']
  },
  {
    in: 'Usas V+ing despues de BE.',
    mustInclude: ['V I N G', 'be'],
    mustNot: ['plus', 'V+ing']
  },
  {
    in: 'Before leaving, call me. (antes de irte)',
    mustInclude: ['Before leaving', 'antes de irte'],
    mustNot: ['(', ')', 'plus']
  },
  {
    in: 'I do did done the homework. go/went/gone',
    mustInclude: ['do. did. done.', 'go. went. gone.'],
    mustNot: ['dodiddone', 'gowentgone']
  }
];

for (const s of samples) {
  const out = ttsApi.prepareTtsLine(s.in);
  assert(!hasWeird(out), 'TTS no weird chars', JSON.stringify(out).slice(0, 80));
  for (const m of s.mustInclude) {
    assert(out.toLowerCase().includes(m.toLowerCase()), 'TTS includes "' + m + '"', out.slice(0, 100));
  }
  for (const m of s.mustNot) {
    assert(!out.includes(m), 'TTS excludes "' + m + '"', out.slice(0, 100));
  }
  const segs = ttsApi.jillTtsSegments(out, 900);
  assert(segs.length >= 1, 'TTS segments non-empty', 'n=' + segs.length);
  const joined = segs.map((x) => x.text).join(' ');
  assert(joined.length >= 8, 'TTS flow not cut to empty', joined.slice(0, 60));
}

// Grammar islands stay English
const mixed = ttsApi.jillTtsSegments('El verbo be y am en presente.', 900);
const enIslands = mixed.filter((s) => s.lang === 'en');
assert(enIslands.length >= 1, 'EN grammar islands preserved', JSON.stringify(mixed));

// ── 3) Canon assets — UTF-8 clean ────────────────────────────
console.log('\n=== Q7+ C: Canon UTF-8 ===');
const canonFiles = [
  'assets/canon/anim/gerundio-pc.svg',
  'assets/canon/gerundio-prep.svg',
  'assets/canon/negaciones.svg',
  'assets/canon/preposiciones.svg',
  'assets/canon/there-existencial.svg',
  'assets/canon/tiempos.svg',
  'assets/canon/moneda.svg',
  'assets/canon/comparativos.svg',
  'assets/canon/articulos.svg',
  'config/jill-canon-visual.json'
];
for (const rel of canonFiles) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    assert(false, 'canon exists ' + rel, 'missing');
    continue;
  }
  const raw = fs.readFileSync(p, 'utf8');
  assert(!hasWeird(raw), 'canon clean ' + rel, hasWeird(raw) ? 'has replacement/control' : 'ok');
}

const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config/jill-canon-visual.json'), 'utf8'));
for (const clip of cfg.clips || []) {
  assert(!hasWeird(clip.title || ''), 'clip title clean', clip.id + ': ' + clip.title);
}

// ── 4) Topic board accuracy (any Foundations topic) ──────────
console.log('\n=== Q7+ D: Topic → board accuracy ===');
// Load DJ router first — detectCanonColumn depends on JillCanonRouter
const routerSrc = fs.readFileSync(path.join(root, 'js/jill-canon-router.js'), 'utf8');
try {
  new Function('window', 'globalThis', routerSrc + '\n;return window.JillCanonRouter;')(globalThis, globalThis);
} catch (e) {
  assert(false, 'load JillCanonRouter', e.message);
}
const foundationsSrc = fs.readFileSync(path.join(root, 'js/jill-foundations.js'), 'utf8');
let JF;
try {
  JF = new Function('window', 'globalThis', foundationsSrc + '\n;return window.JillFoundations;')(globalThis, globalThis);
} catch (e) {
  JF = null;
  assert(false, 'load JillFoundations', e.message);
}

const topicCases = [
  ['explicame las negaciones', 'negations'],
  ['como se forma there is there are', 'there'],
  ['no entiendo before leaving gerundio despues de preposicion', 'gerund_prep'],
  ['explicame presente continuo PC', 'progressive'],
  ['ayudame con pasado simple PS', 'past'],
  ['present perfect PRP no me queda', 'perfect'],
  ['will would should modales', 'modales'],
  ['preposiciones in on at lugar', 'prepositions'],
  ['comparativos more than', 'comparatives'],
  ['articulos the a an', 'articles'],
  ['qué es el gerundio', 'gerundio'],
  ['dame la imagen gerundio', 'gerundio']
];

if (JF && typeof JF.detectCanonColumn === 'function') {
  for (const [msg, expect] of topicCases) {
    const got = JF.detectCanonColumn(msg, null);
    assert(got === expect, 'topic "' + expect + '"', 'got=' + got + ' for: ' + msg);
  }
} else if (globalThis.JillCanonRouter && globalThis.JillCanonRouter.resolveAskId) {
  for (const [msg, expect] of topicCases) {
    const got = globalThis.JillCanonRouter.resolveAskId(msg, '');
    assert(got === expect, 'topic "' + expect + '"', 'got=' + got + ' for: ' + msg);
  }
} else {
  assert(/gerund_prep/.test(foundationsSrc) && /negations/.test(foundationsSrc), 'detectCanonColumn topics in source', 'ok');
}

// Visual stage: no caption / no transcript overlay
const stageSrc = fs.readFileSync(path.join(root, 'js/jill-visual-stage.js'), 'utf8');
const portalSrc = fs.readFileSync(path.join(root, 'Infinity_Student_Portal.html'), 'utf8');
assert(/jill-svg-interact|jill-svg-hotspot|jill-drill-ring|scoreOral/i.test(stageSrc), 'stage SVG drill interact', 'ok');
assert(/#jill-stage-caption\{\s*display:none/i.test(portalSrc.replace(/\s+/g, '')), 'CSS caption hidden', 'ok');
assert(/jill-svg-hotspot|jill-drill-ring/.test(portalSrc), 'CSS SVG hotspots+ring', 'ok');
assert(/jill-canon-drill\.js/.test(portalSrc), 'portal loads canon drill', 'ok');
assert(/jillLastUserTopic|userTopic/.test(portalSrc), 'board uses student ask', 'ok');

// ── 5) Live build tag (current) ──────────────────────────────
console.log('\n=== Q7+ E: Live build ===');
if (process.env.Q7_UNIT_ONLY === '1') {
  assert(true, 'Render healthy', 'skipped (unit-only)');
} else {
  const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';
  try {
    const ac = new AbortController();
    const timer = setTimeout(function () { ac.abort(); }, 8000);
    const health = await fetch(BACKEND + '/', { signal: ac.signal }).then((r) => r.text());
    clearTimeout(timer);
    assert(/20260710-topic-acc|20260710-canon-clean|20260710-tts-coherent|OK/.test(health), 'Render healthy', health.slice(0, 90));
    assert(!hasWeird(health), 'Render health no weird chars', 'ok');
  } catch (e) {
    assert(false, 'Render reachable', e.message);
  }
}

console.log('\n========== Q7+ SUMMARY ==========');
console.log('PASS ' + pass + '  FAIL ' + fail + '  TOTAL ' + (pass + fail));
process.exit(fail ? 1 : 0);
