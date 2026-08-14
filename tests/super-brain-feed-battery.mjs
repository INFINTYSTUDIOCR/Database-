import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SuperBrain = require(path.join(root, 'backend/super-brain.js'));

let failed = 0;
function ok(condition, label) {
  if (condition) console.log('OK', label);
  else {
    console.log('FAIL', label);
    failed += 1;
  }
}

const publishedAt = '2026-08-14T12:00:00.000Z';
const lesson = {
  id: 'L-JOHNNY-3-LAYERS',
  title: 'Johnny class: present perfect',
  content: 'DOCTRINA: Teach present perfect with a bridge, a model, and oral practice.',
  published: true,
  publishedAt,
  meta: {
    layers: {
      pedagogy: [{ name: 'Bridge before rule', evidence: 'John connects Spanish first', whyItWorks: 'Reduces abstraction' }],
      delivery: [{ segment: 'Model, pause, student repeats', approxSec: 30, kind: 'exercise' }],
      structures: [{ pattern: 'P + HAVE + PP', shortcut: 'have + participle', exampleEN: 'I have finished.', howToInstall: 'Echo then swap' }]
    }
  }
};

SuperBrain.initSuperBrain({
  sbGetOne: async (_table, id) => {
    if (id === SuperBrain.SUPER_BRAIN_ID) return { data: { lessons: [lesson], pendingLessons: [] } };
    return { data: { entries: [] } };
  },
  sbSet: async () => true,
  sbGet: async () => [],
  brain: null
});

const snapshot = await SuperBrain.getPropagatedContextSnapshot('present perfect have participle', 4500);
ok(snapshot.revision === `${lesson.id}@${publishedAt}`, 'published revision fingerprints cache');
ok(/PEDAGOGY:/.test(snapshot.context), 'pedagogy layer reaches retrieval context');
ok(/DELIVERY:/.test(snapshot.context), 'delivery layer reaches retrieval context');
ok(/STRUCTURES:/.test(snapshot.context), 'structures layer reaches retrieval context');
ok(/P \+ HAVE \+ PP/.test(snapshot.context), 'published structure content is preserved');

const serverSource = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
for (const persona of ['alice', 'jill', 'claire', 'nexora']) {
  ok(
    serverSource.includes(`loadSuperBrainContextFast(message, student, '${persona}'`)
      || serverSource.includes(`loadSuperBrainContext(message, student, '${persona}'`)
      || new RegExp(`loadSuperBrainContext(?:Fast)?\\([^\\n]+['"]${persona}['"]`).test(serverSource),
    `${persona} uses shared Super Brain loader`
  );
}
ok(/:sb:\$\{sharedBrain\.revision\}/.test(serverSource), 'tutor caches vary by published revision');

console.log(failed ? `\nFAILED ${failed}` : '\nALL PASS');
process.exit(failed ? 1 : 0);
