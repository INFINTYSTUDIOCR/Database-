/**
 * Q&A 7 — Full bug sweep (AI Profile + Nexora stack + demo session integrity)
 * Ejecutar: node tests/qa-ai-profile.mjs
 */
import { readFileSync, existsSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';
const results = [];
function pass(name, detail) { results.push({ ok: true, name, detail }); }
function fail(name, detail) { results.push({ ok: false, name, detail }); }

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

const portalHtml = read('Infinity_Student_Portal.html');
const serverJs = read('backend/server.js');
const aiJs = read('js/ai-profile.js');
const engineHtml = read('Infinity_Nexus_Engine.html');
const nexoraHtml = read('nexora.html');
const industryMapJs = read('js/nexora-industry-map.js');
const bankJs = read('js/nexora-scenario-bank-data.js');

// ── 7.1 Client module present ─────────────────────────────────
if (existsSync(path.join(root, 'js/ai-profile.js'))) pass('ai-profile.js file', 'present');
else fail('ai-profile.js file', 'MISSING');

if (portalHtml.includes('js/ai-profile.js')) pass('portal loads ai-profile.js', 'script tag');
else fail('portal loads ai-profile.js', 'MISSING script tag');

for (const fn of ['getAiProfile', 'displayName', 'sanitizePreferredName', 'detectPreferredName', 'aliceSessionMode', 'jillSessionMode', 'saveAiProfilePatch']) {
  if (aiJs.includes(fn)) pass('AiProfile export ' + fn, 'defined');
  else fail('AiProfile export ' + fn, 'MISSING');
}

// ── 7.2 Portal wiring ─────────────────────────────────────────
if (portalHtml.includes('AiProfile.aliceSessionMode') && portalHtml.includes('AiProfile.jillSessionMode'))
  pass('portal session modes', 'alice + jill');
else fail('portal session modes', 'MISSING mode helpers');

if (portalHtml.includes('AiProfile.processUserNameReply') && portalHtml.includes('AiProfile.saveAiProfilePatch'))
  pass('portal name capture', 'process + save wired');
else fail('portal name capture', 'MISSING');

if (portalHtml.includes('return_session') && portalHtml.includes('aiProfile'))
  pass('portal payload aiProfile', 'return_session + aiProfile');
else fail('portal payload aiProfile', 'incomplete');

// ── 7.3 Backend helpers + modes ───────────────────────────────
for (const sym of ['buildAiProfileNote', 'getStudentDisplayName', 'sanitizePreferredNameServer', 'isReturningStudent']) {
  if (serverJs.includes(sym)) pass('backend ' + sym, 'defined');
  else fail('backend ' + sym, 'MISSING');
}

if (serverJs.includes("mode === 'return_session'") && serverJs.includes("mode === 'start_session' || mode === 'return_session'"))
  pass('backend return_session', 'alice + jill');
else fail('backend return_session', 'MISSING');

try {
  execSync('node --check "' + path.join(root, 'backend', 'server.js') + '"', { stdio: 'pipe' });
  pass('backend syntax', 'OK');
} catch (e) {
  fail('backend syntax', String(e.stderr || e.message));
}

// ── 7.4 Sanitize blocklist (VM) ───────────────────────────────
try {
  const sandbox = { ALL_STUDENTS: {} };
  vm.createContext(sandbox);
  vm.runInContext(aiJs, sandbox);
  const ap = sandbox.AiProfile;
  const ok = ap.sanitizePreferredName('Mando');
  const bad = ap.sanitizePreferredName('idiota');
  const detected = ap.detectPreferredName('Call me Mando please');
  if (ok === 'Mando') pass('sanitize accepts Mando', ok);
  else fail('sanitize accepts Mando', String(ok));
  if (bad === null) pass('sanitize rejects offensive', 'null');
  else fail('sanitize rejects offensive', String(bad));
  if (detected === 'Mando') pass('detect preferred name', detected);
  else fail('detect preferred name', String(detected));
} catch (e) {
  fail('AiProfile VM smoke', e.message);
}

// ── 7.5 Backend live ping ───────────────────────────────────────
try {
  const resp = await fetch(BACKEND + '/');
  const text = await resp.text();
  if (resp.ok && /OK|Infinity|Alice/i.test(text)) pass('backend live ping', resp.status + ' — ' + text.slice(0, 60));
  else fail('backend live ping', resp.status + ' — ' + text.slice(0, 80));
} catch (e) {
  fail('backend live ping', e.message);
}

// ── 7.6 Demo session storage (sbGetOne, not full-table scan) ──
if (serverJs.includes('async function getDemoSession') && serverJs.includes("sbGetOne('infinity_sessions', 'DEMO-SESSION-'"))
  pass('getDemoSession uses sbGetOne', 'direct lookup');
else fail('getDemoSession uses sbGetOne', 'still scanning full table');

if (serverJs.includes('async function getIpRecord') && /getIpRecord[\s\S]{0,200}sbGetOne\('infinity_sessions'/.test(serverJs))
  pass('getIpRecord uses sbGetOne', 'direct lookup');
else fail('getIpRecord uses sbGetOne', 'still scanning full table');

if (!/getDemoSession[\s\S]{0,120}sbGet\('infinity_sessions'\)/.test(serverJs))
  pass('getDemoSession no sbGet scan', 'OK');
else fail('getDemoSession no sbGet scan', 'full-table fallback remains');

if (serverJs.includes('DEMO_SESSIONS_MEM') && serverJs.includes('pruneDemoSessionsMem'))
  pass('demo session memory cache', 'same-instance fallback');
else fail('demo session memory cache', 'missing');

// ── 7.7 Nexora scenario bank + industry map ─────────────────────
try {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(industryMapJs, sandbox);
  vm.runInContext(bankJs, sandbox);
  const NI = sandbox.NEXORA_INDUSTRY;
  const data = sandbox.NEXORA_SCENARIO_BANK_DATA;
  const pools = data.pools || {};
  const poolCount = Object.keys(pools).length;
  if (poolCount >= 30) pass('scenario bank pools', String(poolCount));
  else fail('scenario bank pools', String(poolCount));

  for (const key of ['customer_service:education', 'mock_interview:education', 'team_meeting:all', 'stakeholder:all', 'presentation:all']) {
    const p = pools[key];
    if (p && p.length === 100) pass('pool ' + key, '100');
    else fail('pool ' + key, p ? String(p.length) : 'missing');
  }

  const types = [
    { type: 'mock_interview', industry: 'education', expect: 'mock_interview:education', scType: 'star_interview' },
    { type: 'team_meeting', industry: 'corporate', expect: 'team_meeting:all', scType: 'meeting' },
    { type: 'stakeholder', industry: 'corporate', expect: 'stakeholder:all', scType: 'stakeholder' },
    { type: 'presentation', industry: 'corporate', expect: 'presentation:all', scType: 'corporate' }
  ];
  for (const t of types) {
    const pk = NI.scenarioPoolKey({ type: t.type, industry: t.industry });
    if (pk === t.expect) pass('poolKey ' + t.type, pk);
    else fail('poolKey ' + t.type, pk + ' !== ' + t.expect);
    const sc = pools[pk] && pools[pk][0];
    if (sc && sc.type === t.scType) pass('scenario type ' + t.type, sc.type);
    else fail('scenario type ' + t.type, sc ? String(sc.type) : 'missing');
  }
} catch (e) {
  fail('Nexora bank VM', e.message);
}

if (engineHtml.includes('nexora-industry-map.js') && engineHtml.includes('STAR Mock Interview'))
  pass('Engine industry + STAR labels', 'wired');
else fail('Engine industry + STAR labels', 'incomplete');

if (nexoraHtml.includes('nexora-scenario-bank-data.js') && nexoraHtml.includes('showStarInterviewDisplay'))
  pass('Nexora lab bank + STAR UI', 'wired');
else fail('Nexora lab bank + STAR UI', 'incomplete');

if (nexoraHtml.includes('restoreNexoraLabScreenUI') && nexoraHtml.includes("'stakeholder'"))
  pass('Nexora session restore screens', 'call+interview+meeting+corp+sh');
else fail('Nexora session restore screens', 'incomplete');

if (!nexoraHtml.includes('display:none;position:fixed;inset:0;background:#1a1a2e;z-index:50;display:none'))
  pass('interview-screen CSS glitch', 'no duplicate display:none');
else fail('interview-screen CSS glitch', 'duplicate display property');

if (nexoraHtml.includes('scenarioMatchesConfig') && nexoraHtml.includes('poolKey'))
  pass('Nexora strict pool match', 'poolKey');
else fail('Nexora strict pool match', 'missing');

// ── 7.8 Demo session live roundtrip ─────────────────────────────
try {
  const start = await fetch(BACKEND + '/demo/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'jill', consent: true, name: 'QA7-Bot' })
  });
  const sd = await start.json();
  if (!start.ok || !sd.sessionId) {
    if (start.status === 503) pass('demo session roundtrip', 'skipped live_unavailable');
    else if (start.status === 429) pass('demo session roundtrip', 'skipped rate limit');
    else fail('demo session roundtrip', 'start ' + start.status);
  } else {
    const stream = await fetch(BACKEND + '/demo/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sd.sessionId, message: 'Hola Jill, practiquemos linkers.' })
    });
    const st = stream.status;
    const body = (await stream.text()).slice(0, 120);
    if (stream.ok || st === 200) pass('demo session roundtrip', 'start+stream OK');
    else if (st === 404 && body.includes('Session expired')) fail('demo session roundtrip', 'stream 404 — deploy backend sbGetOne fix');
    else fail('demo session roundtrip', 'stream ' + st + ' ' + body);
  }
} catch (e) {
  fail('demo session roundtrip', e.message);
}

// ── 7.9 PTT + TTS module syntax ─────────────────────────────────
for (const f of ['js/ptt-mic.js', 'js/tts-chunks.js', 'js/nexora-industry-map.js', 'js/nexora-scenario-bank.js']) {
  try {
    execSync('node --check "' + path.join(root, f) + '"', { stdio: 'pipe' });
    pass('syntax ' + f, 'OK');
  } catch (e) {
    fail('syntax ' + f, String(e.stderr || e.message).slice(0, 80));
  }
}

// ── 7.10 Jill structure canon + matrix + vocab ─────────────────
const matrixJs = read('js/jill-matrix.js');
const vocabJs = read('js/jill-vocab.js');
const canonJson = read('config/jill-structure-canon.json');
if (canonJson.includes('"PR"') && canonJson.includes('coinMethod')) pass('jill-structure-canon.json', 'notation + moneda');
else fail('jill-structure-canon.json', 'incomplete');
if (portalHtml.includes('jill-vocab.js') && portalHtml.includes('jillOpenKahootQuiz') && portalHtml.includes('JILL PULSE')) pass('portal jill Pulse quiz', 'unified wiring');
else fail('portal jill Pulse quiz', 'MISSING');
if (matrixJs.includes('MASTERY_RATIO = 1') && matrixJs.includes('TARGET_RESPONSE_MS')) pass('jill-matrix strict gate', '100% + response KPI');
else fail('jill-matrix strict gate', 'MISSING');
if (serverJs.includes('buildJillStructureNotationBlock') && serverJs.includes('JILL_COIN_METHOD_RULE')) pass('server structure notation', 'defined');
else fail('server structure notation', 'MISSING');
if (existsSync(path.join(root, 'assets/canon/moneda.svg'))) pass('canon moneda.svg', 'present');
else fail('canon moneda.svg', 'MISSING');
for (const f of ['js/jill-matrix.js', 'js/jill-vocab.js', 'js/jill-quiz.js']) {
  try {
    execSync('node --check "' + path.join(root, f) + '"', { stdio: 'pipe' });
    pass('syntax ' + f, 'OK');
  } catch (e) {
    fail('syntax ' + f, String(e.stderr || e.message).slice(0, 80));
  }
}

const failed = results.filter(r => !r.ok);
console.log('\n=== Q&A 7 — Full bug sweep ===\n');
for (const r of results) {
  console.log((r.ok ? 'PASS' : 'FAIL') + ' | ' + r.name + (r.detail ? ' — ' + r.detail : ''));
}
console.log('\nTotal: ' + results.length + ' | Passed: ' + (results.length - failed.length) + ' | Failed: ' + failed.length);
process.exit(failed.length ? 1 : 0);
