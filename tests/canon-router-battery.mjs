/**
 * Jill DJ — batería anti-regresión del catálogo completo + pedidos visuales.
 * node tests/canon-router-battery.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = require(path.join(__dirname, '..', 'backend', 'jill-canon-router.js'));

const cases = [
  ['explicame el pasado simple', 'past'],
  ['pasado simple', 'past'],
  ['past simple', 'past'],
  ['presente continuo', 'progressive'],
  ['to be + ing', 'progressive'],
  ['presente simple', 'present'],
  ['presente perfecto', 'perfect'],
  ['futuro perfecto', 'modal_have_pp'],
  ['will have finished', 'modal_have_pp'],
  ['should have studied', 'modal_have_pp'],
  ['must have been working', 'modal_have_been'],
  ['have been studying', 'combined'],
  ['perfecto continuo', 'combined'],
  ['futuro', 'future'],
  ['going to', 'future'],
  ['explicame modales', 'modales'],
  ['modales', 'modales'],
  ['metodo moneda', 'modal'],
  ['inversion', 'modal'],
  ['in on at', 'prepositions'],
  ['in on y at', 'prepositions'],
  ['in, on, at', 'prepositions'],
  ['in/on/at', 'prepositions'],
  ['explicame in on at', 'prepositions'],
  ['preposiciones', 'prepositions'],
  ['preposiciones de tiempo', 'prepositions_time'],
  ['on monday', 'prepositions_time'],
  ['there is y there are', 'there'],
  ['there is', 'there'],
  ['hay vs tener', 'there'],
  ['gerundio', 'gerundio'],
  ['qué es el gerundio', 'gerundio'],
  ['imagen del gerundio', 'gerundio'],
  ['gerundio despues de preposicion', 'gerund_prep'],
  ['before leaving', 'gerund_prep'],
  ['if i were', 'if_was_were'],
  ['was vs were', 'if_was_were'],
  ['verbos irregulares', 'irregular_verbs'],
  ['negaciones', 'negations'],
  ["don't", 'negations'],
  ['comparativos', 'comparatives'],
  ['articulos', 'articles'],
  ['have vs had', 'have_had'],
  ['tiempos verbales', 'overview'],
];

// Pedidos visuales / sticky — misma pista que explicación
const resolveCases = [
  ['dame la imagen', 'gerundio', 'gerundio'],
  ['dame la imagen', 'pasado simple', 'past'],
  ['pizarrón del pasado', '', 'past'],
  ['imagen de in on at', '', 'prepositions'],
  ['muéstrame el presente continuo', '', 'progressive'],
  ['tablero de there is', '', 'there'],
  ['imagen de las negaciones', '', 'negations'],
  ['dame la imagen', 'modales', 'modales'],
  ['explicame el futuro', '', 'future'],
  ['imagen del metodo moneda', '', 'modal'],
];

let fail = 0;
for (const [q, expect] of cases) {
  const got = router.pickTrackId(q);
  const ok = got === expect;
  console.log(ok ? 'OK' : 'FAIL', JSON.stringify(q), '->', got, ok ? '' : `(expected ${expect})`);
  if (!ok) fail++;
}

for (const [ask, sticky, expect] of resolveCases) {
  const got = router.resolveAskId(ask, sticky);
  const ok = got === expect;
  console.log(ok ? 'OK' : 'FAIL', 'resolve', JSON.stringify(ask), '+', JSON.stringify(sticky), '->', got, ok ? '' : `(expected ${expect})`);
  if (!ok) fail++;
}

// Confusions that must NOT happen
const never = [
  ['in on at', 'gerund_prep'],
  ['preposiciones', 'gerund_prep'],
  ['modales', 'modal'],
  ['futuro perfecto', 'future'],
  ['pasado simple', 'present'],
  ['presente continuo', 'gerund_prep'],
  ['presente continuo', 'gerundio'],
  ['gerundio', 'progressive'],
];
for (const [q, bad] of never) {
  const got = router.pickTrackId(q);
  const ok = got !== bad;
  console.log(ok ? 'OK' : 'FAIL', 'never', JSON.stringify(q), '!=', bad, '(got', got + ')');
  if (!ok) fail++;
}

if (fail) {
  console.error('\nFAILED', fail);
  process.exit(1);
}
console.log('\nALL PASS', cases.length + resolveCases.length + never.length);
