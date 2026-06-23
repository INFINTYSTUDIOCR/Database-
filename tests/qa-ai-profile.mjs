/**
 * Q&A 7 — AI Profile (Fase 2: preferred name + returning sessions)
 * Ejecutar: node tests/qa-ai-profile.mjs
 */
import { readFileSync, existsSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const results = [];
function pass(name, detail) { results.push({ ok: true, name, detail }); }
function fail(name, detail) { results.push({ ok: false, name, detail }); }

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

const portalHtml = read('Infinity_Student_Portal.html');
const serverJs = read('backend/server.js');
const aiJs = read('js/ai-profile.js');

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

// ── 7.5 Backend live ping (read-only) ─────────────────────────
try {
  const resp = await fetch('https://alice-by-infinity.onrender.com/');
  const text = await resp.text();
  if (resp.ok && /OK|Infinity|Alice/i.test(text)) pass('backend live ping', resp.status + ' — ' + text.slice(0, 60));
  else fail('backend live ping', resp.status + ' — ' + text.slice(0, 80));
} catch (e) {
  fail('backend live ping', e.message);
}

const failed = results.filter(r => !r.ok);
console.log('\n=== Q&A 7 — AI Profile (Fase 2) ===\n');
for (const r of results) {
  console.log((r.ok ? 'PASS' : 'FAIL') + ' | ' + r.name + (r.detail ? ' — ' + r.detail : ''));
}
console.log('\nTotal: ' + results.length + ' | Passed: ' + (results.length - failed.length) + ' | Failed: ' + failed.length);
process.exit(failed.length ? 1 : 0);
