/**
 * Alice Growth QA — streak, spoken score, timeline, KPI hints
 * Ejecutar: node tests/alice-growth-qa.mjs
 */
import { readFileSync, existsSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const results = [];
function pass(n, d) { results.push({ ok: true, name: n, detail: d }); }
function fail(n, d) { results.push({ ok: false, name: n, detail: d }); }

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

const apJs = readFileSync(path.join(root, 'js/alice-progress.js'), 'utf8');
const portal = read('Infinity_Student_Portal.html');
const engine = read('Infinity_Nexus_Engine.html');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(apJs, sandbox);
const AP = sandbox.AliceProgress;

if (AP) pass('AliceProgress module', 'loads');
else { fail('AliceProgress module', 'MISSING'); process.exit(1); }

// Streak
var s1 = { id: 't1', aliceSessions: [], companionSessions: [] };
AP.recordSessionEnd(s1, { sessionType: 'companion', score: 70, turns: 2, minutes: 2, topic: 'science' });
if (s1.aliceGrowth.habit.streak === 1) pass('streak day 1', 'ok');
else fail('streak day 1', String(s1.aliceGrowth.habit.streak));

AP.recordSessionEnd(s1, { sessionType: 'companion', score: 75, turns: 3, minutes: 2 });
if (s1.aliceGrowth.habit.streak === 1 && s1.aliceGrowth.habit.totalSessions === 2) pass('streak same day', 'no double');
else fail('streak same day', JSON.stringify(s1.aliceGrowth.habit));

// Spoken score
s1.companionSessions = [{ date: '2026-07-01T10:00:00Z', score: 60 }, { date: '2026-07-02T10:00:00Z', score: 80 }];
var spoken = AP.computeSpokenScore(s1);
if (spoken >= 60 && spoken <= 85) pass('spoken score blend', String(spoken));
else fail('spoken score blend', String(spoken));

// Timeline
var tl = AP.buildTimeline(s1, 5);
if (tl.length >= 2) pass('timeline', String(tl.length) + ' events');
else fail('timeline', String(tl.length));

// KPI hints
var s2 = { id: 't2', kpiFile: { weakMicro: [] } };
AP.applyCompanionKpiHints(s2, { k10: 55, k9: 70 }, 65);
if (s2.kpiFile.companionHints && s2.kpiFile.companionHints.k10 === 55) pass('kpi hints', 'k10=55');
else fail('kpi hints', JSON.stringify(s2.kpiFile.companionHints));

// Continue topic
if (AP.getContinueTopic(s1) === 'science') pass('continue topic', 'science');
else fail('continue topic', AP.getContinueTopic(s1));

// Static wiring
if (portal.includes('js/alice-progress.js')) pass('portal script', 'loaded');
else fail('portal script', 'MISSING');

if (portal.includes('startAliceCompanionQuick') && portal.includes('recordSessionEnd')) pass('portal wiring', 'quick + record');
else fail('portal wiring', 'incomplete');

if (engine.includes('js/alice-progress.js') && engine.includes('renderEngineTrainerBlock')) pass('engine wiring', 'ok');
else fail('engine wiring', 'incomplete');

if (existsSync(path.join(root, 'js/alice-progress.js'))) pass('file exists', 'ok');
else fail('file exists', 'no');

const failed = results.filter((r) => !r.ok);
console.log('\n=== Alice Growth QA ===\n');
results.forEach((r) => console.log((r.ok ? '✓' : '✗') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')));
console.log('\n' + results.length + ' checks, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
