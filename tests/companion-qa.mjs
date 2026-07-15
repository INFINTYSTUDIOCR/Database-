/**
 * Alice Modo Libre — unit + static integration QA
 * Ejecutar: node tests/companion-qa.mjs
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);
const Companion = require(path.join(root, 'backend', 'alice-companion.js'));

const results = [];
function pass(name, detail) { results.push({ ok: true, name, detail }); }
function fail(name, detail) { results.push({ ok: false, name, detail }); }

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

// ── Module: sanitizeFocusKpis ─────────────────────────────────
const kpis = Companion.sanitizeFocusKpis(['k10', 'k10', 'k9', 'bad', 'IG', 'k99', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6']);
if (kpis.length === 5 && kpis[0] === 'k10' && kpis.includes('IG')) pass('sanitizeFocusKpis', kpis.join(','));
else fail('sanitizeFocusKpis', JSON.stringify(kpis));

// ── Module: resolveCompanionSession ───────────────────────────
const blocked = Companion.resolveCompanionSession({ id: 's1' }, 'companion');
if (blocked.sessionType === 'practice' && blocked.companionBlocked) pass('resolveCompanion blocked', blocked.reason);
else fail('resolveCompanion blocked', JSON.stringify(blocked));

const allowed = Companion.resolveCompanionSession({ id: 's1', companionEnabled: true, companionConfig: { focusKpis: ['k9'] } }, 'companion');
if (allowed.sessionType === 'companion' && !allowed.companionBlocked) pass('resolveCompanion allowed', 'companion');
else fail('resolveCompanion allowed', JSON.stringify(allowed));

// ── Module: topic inference ───────────────────────────────────
// history/ancient map to "stories" (Companion free-flow personality)
if (Companion.inferTopicFromText('I love ancient history and the Roman empire') === 'stories') pass('inferTopic history→stories', 'ok');
else fail('inferTopic history→stories', Companion.inferTopicFromText('I love ancient history'));

if (Companion.inferTopicFromText('NASA discovered a new planet') === 'science') pass('inferTopic science', 'ok');
else fail('inferTopic science', 'miss');

// ── Module: scoreCompanionSession ─────────────────────────────
const metrics = {
  turns: 8,
  wordCount: 120,
  avgWords: 15,
  connectors: ['however', 'therefore'],
  userText: 'however I think science and history are fascinating therefore we should explore more'
};
const student = { companionEnabled: true, companionConfig: { focusKpis: ['k10', 'k9'], evalMode: 'standard' } };
const scored = Companion.scoreCompanionSession(metrics, student, student.companionConfig);
if (scored.overall_score >= 48 && scored.overall_score <= 97 && scored.dimensions.fluency > 0) pass('scoreCompanionSession', 'score=' + scored.overall_score);
else fail('scoreCompanionSession', JSON.stringify(scored));

const brief = Companion.scoreCompanionSession({ turns: 1, wordCount: 40, avgWords: 40, connectors: ['however'], userText: 'however I really enjoy talking about space and planets today' }, student, student.companionConfig);
if (brief.overall_score >= 55 && brief.free_session === true) pass('scoreCompanion free session', 'no turn minimum, score=' + brief.overall_score);
else fail('scoreCompanion free session', JSON.stringify(brief));

// ── Module: enrichCompanionEvaluation ─────────────────────────
const enriched = Companion.enrichCompanionEvaluation({ best_moment: 'Great' }, scored, metrics, student.companionConfig);
if (enriched.overall_score === scored.overall_score && enriched.dimensions) pass('enrichCompanionEvaluation', 'merged');
else fail('enrichCompanionEvaluation', JSON.stringify(enriched));

// ── Module: buildCompanionCoachBlock ──────────────────────────
const block = Companion.buildCompanionCoachBlock(student, student.companionConfig, 'history');
if (block.includes('COMPANION + LIVE COACH') && /k10/i.test(block) && block.includes('history')) pass('buildCompanionCoachBlock', 'ok');
else fail('buildCompanionCoachBlock', block.slice(0, 120));

// ── Module: doubt mini-lesson ─────────────────────────────────
if (Companion.isEnglishDoubtRequest('explicame how however works')) pass('isEnglishDoubtRequest linker', 'ok');
else fail('isEnglishDoubtRequest linker', 'miss');

if (Companion.resolveCompanionPhase('teach me STAR structure', []) === 'doubt_explain') pass('phase doubt_explain', 'ok');
else fail('phase doubt_explain', Companion.resolveCompanionPhase('teach me STAR structure', []));

const teach = Companion.buildCompanionStreamTeachInstruction('doubt:star', 'teach me STAR', []);
if (teach.includes('MINI-LESSON') && teach.includes('pattern')) pass('teachInstr mini-lesson', 'ok');
else fail('teachInstr mini-lesson', teach.slice(0, 100));

if (String(Companion.ALICE_COMPANION_TEACH_CANON || '').includes('MINI-LESSON')) pass('ALICE_COMPANION_TEACH_CANON', 'exported');
else fail('ALICE_COMPANION_TEACH_CANON', 'missing');

if (Companion.inferTopicFromText('can you explain present perfect') === 'doubt:present perfect' || Companion.inferTopicFromText('can you explain present perfect').startsWith('doubt:')) pass('inferTopic doubt', Companion.inferTopicFromText('can you explain present perfect'));
else fail('inferTopic doubt', Companion.inferTopicFromText('can you explain present perfect'));

// ── Static: backend server.js ─────────────────────────────────
const serverJs = read('backend/server.js');
for (const sym of ['resolveCompanionSession', 'scoreCompanionSession', 'buildCompanionCoachBlock', 'enrichCompanionEvaluation', 'buildCompanionEvalUserPrompt']) {
  if (serverJs.includes('Companion.' + sym)) pass('server uses ' + sym, 'wired');
  else fail('server uses ' + sym, 'MISSING');
}
if (serverJs.includes('companionTopic')) pass('server companionTopic', 'body field');
else fail('server companionTopic', 'MISSING');

try {
  execSync('node --check "' + path.join(root, 'backend', 'server.js') + '"', { stdio: 'pipe' });
  pass('server.js syntax', 'OK');
} catch (e) {
  fail('server.js syntax', String(e.stderr || e.message));
}

// ── Static: Nexus Engine ──────────────────────────────────────
const engineHtml = read('Infinity_Nexus_Engine.html');
for (const sym of ['modal-companion-config', 'toggleStudentCompanion', 'confirmStudentCompanion', 'companionEnabled']) {
  if (engineHtml.includes(sym)) pass('engine ' + sym, 'present');
  else fail('engine ' + sym, 'MISSING');
}

// ── Static: Student Portal ────────────────────────────────────
const portalHtml = read('Infinity_Student_Portal.html');
if (portalHtml.includes('aliceCompanionEnabled') && portalHtml.includes('companionSessions')) pass('portal companion gating', 'wired');
else fail('portal companion gating', 'incomplete');

if (portalHtml.includes('companionTopic')) pass('portal companionTopic payload', 'ok');
else fail('portal companionTopic payload', 'MISSING');

if (portalHtml.includes('companionEnabled') && portalHtml.includes('companionConfig')) pass('portal student payload', 'fields');
else fail('portal student payload', 'MISSING');

// ── Module file exists ────────────────────────────────────────
if (existsSync(path.join(root, 'backend', 'alice-companion.js'))) pass('alice-companion.js', 'present');
else fail('alice-companion.js', 'MISSING');

// ── Report ────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log('\n=== Alice Modo Libre QA ===\n');
results.forEach((r) => console.log((r.ok ? '✓' : '✗') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')));
console.log('\n' + results.length + ' checks, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
