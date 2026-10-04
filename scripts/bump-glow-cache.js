const fs = require('fs');
const path = require('path');
const V = '20261004glow1';
let n = 0;
function bump(fp) {
  let t = fs.readFileSync(fp, 'utf8');
  const b = t;
  t = t.replace(/prototype\.css\?v=[^"']+/g, 'prototype.css?v=' + V);
  t = t.replace(/responsive\.css\?v=[^"']+/g, 'responsive.css?v=' + V);
  if (t !== b) {
    fs.writeFileSync(fp, t);
    n += 1;
  }
}
for (const f of fs.readdirSync('.').filter((x) => x.endsWith('.html'))) bump(f);
const p = 'prototype-cadamag';
for (const f of fs.readdirSync(p).filter((x) => x.endsWith('.html'))) bump(path.join(p, f));
console.log('bumped', n, V);
