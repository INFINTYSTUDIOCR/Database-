import { readFileSync } from 'fs';
const m = readFileSync('js/infinity-recursos-library.js', 'utf8');
for (const c of ['pronouns', 'verbs', 'tenses', 'prep', 'articles', 'extra']) {
  const n1 = (m.match(new RegExp(`item\\('${c}'`, 'g')) || []).length;
  const n2 = (m.match(new RegExp(`item\\("${c}"`, 'g')) || []).length;
  console.log(c, 'sq', n1, 'dq', n2);
}
const idx = m.indexOf('item("pronouns"');
console.log('first pronoun line:', m.slice(idx, idx + 120).replace(/\n/g, ' '));
console.log('GLOSS_CATS snippet:', m.match(/var GLOSS_CATS = \[[\s\S]*?\];/)[0].slice(0, 400));
