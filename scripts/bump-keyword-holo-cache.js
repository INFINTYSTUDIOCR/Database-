/** Bump motion + prototype css cache after keyword-holo refactor. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const V = '20261004kwloop1';

function bump(file) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) return false;
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(/motion\.(css|js)\?v=[^"']+/g, `motion.$1?v=${V}`);
  t = t.replace(/prototype\.css\?v=[^"']+/g, `prototype.css?v=${V}`);
  if (t !== before) {
    fs.writeFileSync(fp, t);
    return true;
  }
  return false;
}

let n = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  if (bump(f)) n += 1;
}
const proto = path.join(ROOT, 'prototype-cadamag');
for (const f of fs.readdirSync(proto).filter((x) => x.endsWith('.html'))) {
  if (bump(path.join('prototype-cadamag', f))) n += 1;
}
console.log('bumped', n, 'files →', V);
