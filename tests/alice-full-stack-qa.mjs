/**
 * Alice full stack QA — growth + badges + CEFR + pronunciation + B2C + reminders
 * Ejecutar: node tests/alice-full-stack-qa.mjs
 */
import { readFileSync, existsSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);
const results = [];
function pass(n, d) { results.push({ ok: true, name: n, detail: d }); }
function fail(n, d) { results.push({ ok: false, name: n, detail: d }); }

function read(rel) { return readFileSync(path.join(root, rel), 'utf8'); }
function loadGlobal(rel, name) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(read(rel), sandbox);
  return sandbox[name];
}

const AP = loadGlobal('js/alice-progress.js', 'AliceProgress');
const BC = loadGlobal('js/alice-badges-cefr.js', 'AliceBadgesCefr');
const PR = loadGlobal('js/alice-pronunciation.js', 'AlicePronunciation');

// CEFR
const cefr = BC.spokenToCefr(72);
if (cefr.level === 'B2') pass('CEFR B2 at 72', cefr.level);
else fail('CEFR B2 at 72', JSON.stringify(cefr));

// Badges
var st = { aliceGrowth: { habit: { streak: 3, totalSessions: 1, totalMinutes: 5 }, spokenScore: 0 }, companionSessions: [] };
var u = BC.checkBadges(st, {});
if (u.indexOf('streak_3') >= 0) pass('badge streak_3', 'ok');
else fail('badge streak_3', u.join(','));

// Pronunciation
var clarity = PR.scoreClarityFromHistory([
  { role: 'user', content: 'However I think science and space exploration are fascinating topics to discuss today.' },
  { role: 'user', content: 'NASA discovered many planets and I want to learn more about them.' }
]);
if (clarity.clarity_score >= 55) pass('clarity score', String(clarity.clarity_score));
else fail('clarity score', String(clarity.clarity_score));

// Companion module still ok
const Companion = require(path.join(root, 'backend', 'alice-companion.js'));
if (Companion.resolveCompanionSession({ companionEnabled: true }, 'companion').sessionType === 'companion') pass('companion module', 'ok');
else fail('companion module', 'broken');

// Static files
for (const f of ['js/alice-reminders.js', 'js/b2b-alice-report.js', 'manifest-alice.json']) {
  if (existsSync(path.join(root, f))) pass('file ' + f, 'present');
  else fail('file ' + f, 'MISSING');
}

const portal = read('Infinity_Student_Portal.html');
const tryAlice = read('try-alice.html');
const engine = read('Infinity_Nexus_Engine.html');
const server = read('backend/server.js');

if (portal.includes('AliceReminders') && portal.includes('AliceBadgesCefr')) pass('portal full stack', 'wired');
else fail('portal full stack', 'incomplete');

if (tryAlice.includes('onboarding') && tryAlice.includes('companion')) pass('try-alice B2C', 'onboarding');
else fail('try-alice B2C', 'incomplete');

if (engine.includes('exportAliceB2BReport')) pass('engine B2B export', 'ok');
else fail('engine B2B export', 'MISSING');

if (server.includes("scenario === 'companion'") && server.includes('onboarding')) pass('demo companion API', 'ok');
else fail('demo companion API', 'incomplete');

if (server.includes('demoSessionMaxSteps') && server.includes('demoSessionDone') && server.includes('APP1_BUILD')) pass('companion demo unlimited turns', 'ok');
else fail('companion demo unlimited turns', 'incomplete');

if (read('manifest-portal.json').includes('shortcuts')) pass('portal manifest shortcuts', 'ok');
else fail('portal manifest shortcuts', 'MISSING');

try {
  execSync('node --check "' + path.join(root, 'backend', 'server.js') + '"', { stdio: 'pipe' });
  pass('server syntax', 'OK');
} catch (e) {
  fail('server syntax', String(e.stderr || e.message));
}

const failed = results.filter((r) => !r.ok);
console.log('\n=== Alice Full Stack QA ===\n');
results.forEach((r) => console.log((r.ok ? '✓' : '✗') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')));
console.log('\n' + results.length + ' checks, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
