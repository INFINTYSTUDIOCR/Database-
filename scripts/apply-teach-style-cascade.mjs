/**
 * Apply John teaching style (puente ES↔EN + fórmulas hablables) to all canon tracks,
 * sync backend map + embedded router map, strengthen formatLock.
 */
import fs from 'fs';

const BRIDGES = {
  modal_have_been: 'Puente: must have been working = debió haber estado trabajando (modal + have + been + VERBO+ING).',
  modal_have_pp: 'Puente: should have = debería haber + participio; could have = podría haber.',
  combined: 'Puente: have been + VERBO+ING = he estado + ando/endo (duración hasta ahora).',
  perfect: 'Puente: have/has + participio = he/ha + participio; had + participio = había + participio.',
  if_was_were: 'Puente: was = pasado real; were = hipótesis irreal (If I were…); were to = poco probable.',
  irregular_verbs: 'Puente: col1 presente / col2 pasado / col3 participio — siempre con pausa: go. went. gone.',
  there: 'Puente: There is = hay (1); There are = hay (2+); have/has = posesión (no “hay”).',
  gerundio: 'Puente: VERBO+ING = ando/endo como sustantivo (I like running = me gusta correr/corriendo).',
  gerund_prep: 'Puente: tras prep, VERBO+ING = ando/endo (Before leaving = antes de salir/saliendo).',
  prepositions_time: 'Puente: IN = mes/año/parte del día; ON = día/fecha; AT = hora puntual.',
  prepositions: 'Puente: IN = dentro; ON = encima; AT = punto; BY = medio — van en el complemento.',
  negations: 'Puente: auxiliar + not + verbo base (I do not work — nunca “I no work”).',
  comparatives: 'Puente: -er/more + than = más… que; -est/most = el más…; as…as = tan…como.',
  articles: 'Puente: a/an = uno/una (indefinido); the = el/la (definido).',
  progressive: 'Puente: am/is/are + VERBO+ING = estoy/está + ando/endo (presente continuo, no gerundio suelto).',
  past: 'Puente: verbo en pasado (worked / went) = ayer/acción terminada.',
  present: 'Puente: hábito/hecho; he/she/it lleva verbo+s (she works).',
  modales: 'Puente: will=-ré; would=-ría; should=debería; can=puedo; could=podría — modal + verbo base (sin to).',
  modal: 'Puente: método moneda — auxiliar ANTES del pronombre = pregunta; DESPUÉS = respuesta.',
  future: 'Puente: will = -ré (decisión/espontáneo); going to = voy a (plan/intención).',
  overview: 'Puente: PR=presente simple; PS=pasado simple; PC=presente continuo; PRP=presente perfecto.',
  have_had: 'Puente: have/has/had — decir con pausa: have. has. had.'
};

const FORMULAS = {
  modal_have_been: 'pronombre + modal + have + been + VERBO + ING + complemento',
  modal_have_pp: 'modal + have + PARTICIPIO (should/could/must have + participio)',
  combined: 'pronombre + have/has/had + been + VERBO + ING + complemento',
  perfect: 'have/has + PARTICIPIO (presente perfecto) vs had + PARTICIPIO (pasado perfecto)',
  if_was_were: 'was = pasado real/posible | were = hipótesis irreal | were to = futuro poco probable',
  irregular_verbs: 'Col1 PRESENTE | Col2 PASADO | Col3 PARTICIPIO — decir con pausa: go. went. gone.',
  there: 'There is + 1 | There are + 2+ | Sujeto + have/has (posesión) | There exist(s) (formal)',
  gerundio: 'VERBO + ING (= ando/endo) funciona como SUSTANTIVO. Tras prep: preposición + VERBO + ING.',
  gerund_prep: 'preposición (before/after/without/by/good at) + VERBO + ING (= ando/endo) + complemento',
  prepositions_time: 'IN (mes/año/parte del día) | ON (día/fecha) | AT (hora puntual)',
  prepositions: 'IN = dentro | ON = encima/superficie | AT = punto exacto | BY = medio — van en el complemento',
  negations: 'pronombre + auxiliar + not + verbo + complemento',
  comparatives: 'adjetivo-er / more + adjetivo + than | the + adjetivo-est / most + adjetivo | as + adjetivo + as',
  articles: 'a/an (indefinido) | the (definido) | much/many/a lot of',
  progressive: 'pronombre + am/is/are + VERBO + ING (= ando/endo) + complemento',
  past: 'pronombre + verbo(pasado) + complemento',
  present: 'pronombre + verbo + complemento (he/she/it + verbo+s)',
  modales: 'pronombre + modal + verbo(base, sin to) + complemento',
  modal: 'verbo auxiliar ANTES del pronombre = pregunta | DESPUÉS del pronombre = respuesta',
  future: 'pronombre + will + verbo + complemento | pronombre + be + going to + verbo + complemento',
  overview: 'presente simple | pasado simple | presente continuo | presente perfecto | futuro',
  have_had: 'have. has. had. — paradigm con pausa'
};

const mapPath = 'config/jill-canon-map.json';
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
for (const tr of map.tracks) {
  if (FORMULAS[tr.id]) tr.formula = FORMULAS[tr.id];
  if (BRIDGES[tr.id]) tr.bridge = BRIDGES[tr.id];
  // titles: avoid bare V-ing
  if (tr.title) tr.title = tr.title.replace(/\bV-ing\b/gi, 'VERBO + ING').replace(/\bV\+ing\b/gi, 'VERBO + ING');
}
map.version = (map.version || 1) + 1;
fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync('backend/config/jill-canon-map.json', JSON.stringify(map, null, 2) + '\n');

// Rebuild embedded map in js/jill-canon-router.js
const routerPath = 'js/jill-canon-router.js';
let router = fs.readFileSync(routerPath, 'utf8');
const embStart = router.indexOf('var EMBEDDED_MAP = ');
const embEnd = router.indexOf(';\n', embStart);
if (embStart < 0 || embEnd < 0) throw new Error('EMBEDDED_MAP not found');
// Find the closing of the object — embEnd of first `;\n` after start might be wrong if nested.
// Safer: match from `var EMBEDDED_MAP = ` to `\n  var MAP =` or next function
const after = router.indexOf('\n  var MAP =', embStart);
const endAt = after > 0 ? after : embEnd;
const json = JSON.stringify(map, null, 2).split('\n').map((line, i) => (i === 0 ? line : '  ' + line)).join('\n');
router = router.slice(0, embStart) + 'var EMBEDDED_MAP = ' + json + ';\n' + router.slice(endAt);

const lockOld = `function formatLock(track) {
    if (!track) return '';
    var never = (track.never || []).join('; ');
    return [
      'JILL DJ — TRACK LOCK (pedido del estudiante)',
      'Track: ' + track.title,
      'Fórmula oficial: ' + track.formula,
      'Ejemplo: ' + track.example,
      never ? 'PROHIBIDO mezclar: ' + never : '',
      'VOZ: paradigmas con pausa (A. B. C.) — nunca pegados.',
      'El SVG enseña; vos guiás en voz corta. Cero bloques de texto-ejercicio.',
      'Explicá SOLO este track. No cambies de módulo. [[CTYPE:whiteboard]]'
    ].filter(Boolean).join('\\n');
  }`;

// Flexible replace for formatLock in browser router
router = router.replace(
  /function formatLock\(track\) \{[\s\S]*?\n  \}/,
  `function formatLock(track) {
    if (!track) return '';
    var never = (track.never || []).join('; ');
    return [
      'JILL DJ — TRACK LOCK (pedido del estudiante)',
      'Track: ' + track.title,
      'Fórmula oficial: ' + track.formula,
      track.bridge ? track.bridge : '',
      'Ejemplo: ' + track.example,
      never ? 'PROHIBIDO mezclar: ' + never : '',
      'VOZ: decí ranuras en español (pronombre/modal/verbo/complemento). VERBO+ING = "verbo más I N G". Paradigmas con pausa (go. went. gone.).',
      'FORMA JOHN: puente ES↔EN en 1 frase; práctica en el SVG (blank/mic); cero "mirá el ejercicio" sin blank en el board.',
      'El SVG enseña; vos guiás en voz corta. Cero bloques de texto-ejercicio.',
      'Explicá SOLO este track. No cambies de módulo. [[CTYPE:whiteboard]]'
    ].filter(Boolean).join('\\n');
  }`
);
fs.writeFileSync(routerPath, router);

// backend formatLock
const bePath = 'backend/jill-canon-router.js';
let be = fs.readFileSync(bePath, 'utf8');
be = be.replace(
  /function formatLock\(track\) \{[\s\S]*?\n\}/,
  `function formatLock(track) {
  if (!track) return '';
  const never = (track.never || []).join('; ');
  return [
    'JILL DJ — TRACK LOCK (pedido del estudiante)',
    \`Track: \${track.title}\`,
    \`Fórmula oficial: \${track.formula}\`,
    track.bridge || '',
    \`Ejemplo: \${track.example}\`,
    never ? \`PROHIBIDO mezclar: \${never}\` : '',
    'VOZ: decí ranuras en español (pronombre/modal/verbo/complemento). VERBO+ING = "verbo más I N G". Paradigmas con pausa (go. went. gone.).',
    'FORMA JOHN: puente ES↔EN en 1 frase; práctica en el SVG (blank/mic); cero "mirá el ejercicio" sin blank en el board.',
    'El SVG enseña; vos guiás en voz corta. Cero bloques de texto-ejercicio.',
    'Explicá SOLO este track. No cambies de módulo. [[CTYPE:whiteboard]]'
  ].filter(Boolean).join('\\n');
}`
);
fs.writeFileSync(bePath, be);

console.log('tracks', map.tracks.length, 'version', map.version);
console.log('bridges', map.tracks.filter((t) => t.bridge).length);
