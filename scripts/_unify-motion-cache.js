/** Unify motion cache bust on root public HTML after etapa 4. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const V = '20260929tech1';
let n = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html') && !/\.legacy/i.test(x))) {
  const fp = path.join(ROOT, f);
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(/motion\.(css|js)\?v=[^"']+/g, `motion.$1?v=${V}`);
  if (t !== before) {
    fs.writeFileSync(fp, t);
    n += 1;
  }
}
console.log('unified motion cache on', n, 'files →', V);
