const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const out = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  const c = (t.match(/rel=["']canonical["']/gi) || []).length;
  const badge = /prototype-badge/i.test(t);
  const noindex = /noindex/i.test(t);
  const oldDiag = /prototype-cadamag\/diagnostico\.html/i.test(t);
  const motionBroken = /motion\.=/.test(t);
  if (c > 1 || badge || noindex || oldDiag || motionBroken) {
    out.push({ f, c, badge, noindex, oldDiag, motionBroken });
  }
}
console.log(JSON.stringify(out, null, 2));
console.log('count', out.length);
