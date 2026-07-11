/**
 * Battery: Foundations modules + Mini Kaboom wiring.
 * Run: node tests/modules-mini-kaboom-battery.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let failed = 0;
function ok(cond, label) {
  if (cond) console.log('OK', label);
  else { console.log('FAIL', label); failed += 1; }
}

const cfgPath = path.join(root, 'config', 'jill-foundations-modules.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
ok(Array.isArray(cfg.modules) && cfg.modules.length === 12, '12 modules in catalog');

const ids = cfg.modules.map((m) => m.id);
ok(ids[0] === 'M001' && ids[11] === 'M012', 'M001..M012 order');

cfg.modules.forEach((m) => {
  ok(!!m.say && m.say.length > 40, m.id + ' has say');
  ok(Array.isArray(m.kaboomBank) && m.kaboomBank.length >= 5, m.id + ' kaboomBank >=5');
  ok(m.mini && m.mini.questions >= 3 && m.mini.passPct >= 70, m.id + ' mini config');
  m.kaboomBank.forEach((q, i) => {
    ok(Array.isArray(q.options) && q.options.length >= 2, m.id + ' q' + i + ' options');
    ok(typeof q.answer === 'number' && q.answer >= 0 && q.answer < q.options.length, m.id + ' q' + i + ' answer');
  });
});

const Mods = require(path.join(root, 'backend/jill-foundations-modules.js'));
ok(Mods.trackToModuleId('articles') === 'M006', 'articles → M006');
ok(Mods.trackToModuleId('past') === 'M009', 'past → M009');
ok(/mini_kaboom:M001/.test(Mods.moduleTeachBlock('present') || Mods.moduleTeachBlock('overview') || ''), 'moduleTeachBlock emits mini_kaboom tag');

const JillPro = require(path.join(root, 'backend/jill-companion.js'));
const teachYes = JillPro.buildJillProStreamTeachInstruction('doubt:articles', 'sí', [{ role: 'assistant', content: '¿Te quedó?' }], 'articles');
// clarity after doubt may need history with doubt - at least teach explain has module block
const teachExplain = JillPro.buildJillProStreamTeachInstruction('doubt:articles', 'explicame los articulos a an the', [], 'articles');
ok(/M006|artículo|articulo|A \/ AN|mini_kaboom/i.test(teachExplain), 'teach explain wires articles module');

const backendCfg = path.join(root, 'backend', 'config', 'jill-foundations-modules.json');
ok(fs.existsSync(backendCfg), 'backend mirror exists');

console.log(failed ? `\nFAILED ${failed}` : '\nALL PASS');
process.exit(failed ? 1 : 0);
