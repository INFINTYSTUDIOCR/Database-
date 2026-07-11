/**
 * Canon drill unit — tap + oral score.
 * node tests/jill-canon-drill-battery.mjs
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const src = fs.readFileSync(path.join(root, 'js/jill-canon-drill.js'), 'utf8');
new Function('window', 'globalThis', src)(globalThis, globalThis);
const Drill = globalThis.JillCanonDrill;

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

assert(!!Drill, 'JillCanonDrill loaded');
Drill.start('irregular_verbs');
assert(Drill.getChallenge().target === 0, 'start target 0');
assert(Drill.registerTap(1).ok === false, 'wrong tap miss');
assert(Drill.registerTap(0).ok === true, 'correct tap ok');
assert(Drill.getChallenge().target === 1, 'advance target after hit');

const oralGood = Drill.scoreUtterance('Yesterday I went home', 'past');
assert(oralGood.ok === true, 'oral past ok', 'score=' + oralGood.score);
const oralProg = Drill.scoreUtterance('She is working now', 'progressive');
assert(oralProg.ok === true, 'oral progressive ok', 'score=' + oralProg.score);
const oralBad = Drill.scoreUtterance('hola', 'irregular_verbs');
assert(oralBad.ok === false, 'oral junk not ok', 'score=' + oralBad.score);

const there = Drill.scoreUtterance('There are two books', 'there');
assert(there.ok === true, 'oral there ok');

const prep = Drill.scoreUtterance('I am in the office', 'prepositions');
assert(prep.ok === true, 'oral prep ok');

assert(Drill.combinedScore() >= 0, 'combined score', String(Drill.combinedScore()));

console.log('\n========== DRILL SUMMARY ==========');
console.log('PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
