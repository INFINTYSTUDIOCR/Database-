/**
 * Learner intent — mala pronunciación / ortografía → track correcto
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Intent = require(path.join(root, 'backend', 'jill-learner-intent.js'));
const Router = require(path.join(root, 'backend', 'jill-canon-router.js'));

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('PASS |', msg); }
  else { fail++; console.log('FAIL |', msg); }
}

const cases = [
  ['Willy good', 'modales'],
  ['me gustaría que me explicaras cómo funciona Willy good', 'modales'],
  ['ambas Wood y', 'modales'],
  ['wood y will', 'modales'],
  ['explicame shud', 'modales'],
  ['como funciona der is', 'there'],
  ['explicame gonna', 'future'],
  ['que es el jerundio', 'gerundio'],
  ['pasao simple', 'past'],
  ['presente kontinuo', 'progressive'],
  ['inonat', 'prepositions'],
  ['shoulda', 'modal_have_pp'],
  ['must haf bin', 'modal_have_been']
];

for (const [ask, expect] of cases) {
  const expanded = Intent.expand(ask);
  const id = Router.resolveAskId(ask, '') || Router.pickTrackId(ask);
  assert(id === expect, `${JSON.stringify(ask)} → ${id} (want ${expect})  expanded=${JSON.stringify(expanded).slice(0, 80)}`);
}

console.log('\n========== LEARNER INTENT ==========');
console.log('PASS', pass, 'FAIL', fail);
process.exit(fail ? 1 : 0);
