const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const V = '20260929holo2';

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'backup' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.html$/i.test(ent.name)) out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  let t = fs.readFileSync(file, 'utf8');
  const before = t;
  t = t.replace(/motion\.(css|js)\?v=[^"'\s>]+/g, function (m, kind) {
    return 'motion.' + kind + '?v=' + V;
  });
  t = t.replace(/prototype\.css\?v=[^"'\s>]+/g, 'prototype.css?v=' + V);
  if (t !== before) {
    fs.writeFileSync(file, t);
    n += 1;
  }
}
console.log('bumped', n, '→', V);
