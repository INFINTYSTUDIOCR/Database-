/**
 * Ops interconnect battery — doctrina John cableada en Jill/Alice/Nexora paths.
 * Run: node tests/ops-interconnect-battery.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const John = require(path.join(root, 'backend/john-teaching-doctrine.js'));
const Router = require(path.join(root, 'backend/jill-canon-router.js'));
const JillPro = require(path.join(root, 'backend/jill-companion.js'));
const MethodOS = require(path.join(root, 'backend/jill-method-os.js'));

let failed = 0;
function ok( Cond, label) {
  if (Cond) console.log('OK', label);
  else { console.log('FAIL', label); failed += 1; }
}

const gerundio = Router.trackById('gerundio');
const lock = Router.formatLock(gerundio);
ok(!!gerundio, 'track gerundio exists');
ok(/GUION ORAL JOHN/.test(lock), 'formatLock has oral script');
ok(/ando/.test(lock) && /estar/i.test(lock), 'formatLock ando + estar');

const mandateJill = John.mandateBlock('jill');
ok(/GUIONES ORALES|ando/.test(mandateJill), 'jill mandate has oral doctrine');
ok(/DOCTRINA OBLIGATORIA/.test(mandateJill), 'jill mandate header');

const mandateAlice = John.mandateBlock('alice');
ok(/ALICE|Idea \+ Linker|linkers/i.test(mandateAlice), 'alice mandate has nexus voice');

const mandateNexora = John.mandateBlock('nexora');
ok(/NEXORA/.test(mandateNexora), 'nexora has ops note');
ok(!/CHECKLIST OBLIGATORIO EN ESTE TURNO/.test(mandateNexora) || /QUEDATE EN PERSONAJE/.test(mandateNexora), 'nexora stays in character note');

const fb = John.fastFallbackBlock('jill', 'gerundio', 'LEARNER:test');
ok(/ando/.test(fb) && /LEARNER:test/.test(fb), 'fastFallback keeps track voice + learner');

const teach = JillPro.buildJillProStreamTeachInstruction('doubt:gerundio', 'explicame el gerundio', [], 'gerundio');
ok(/GUION ORAL JOHN|ando/.test(teach), 'Jill teach instruction has voice');
ok(/TRACK LOCK|CANON LOCK|Tablero/i.test(teach), 'Jill teach has track lock');

ok(!!MethodOS.METHOD_OS_CORE && MethodOS.METHOD_OS_CORE.length > 200, 'METHOD_OS_CORE loaded');

const voice = John.getTrackVoice('progressive');
ok(!!voice && /to be/i.test(voice.say), 'progressive voice script');

console.log(failed ? `\nFAILED ${failed}` : '\nALL PASS');
process.exit(failed ? 1 : 0);
