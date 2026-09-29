const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const V = '20260929contrast1';

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
  t = t.replace(/page-shell\.css\?v=[^"'\s>]+/g, 'page-shell.css?v=' + V);
  t = t.replace(/brand\.css\?v=[^"'\s>]+/g, 'brand.css?v=' + V);
  t = t.replace(/subpages\.css\?v=[^"'\s>]+/g, 'subpages.css?v=' + V);
  t = t.replace(/prototype\.css\?v=[^"'\s>]+/g, 'prototype.css?v=' + V);
  t = t.replace(/pages\.css\?v=[^"'\s>]+/g, 'pages.css?v=' + V);
  t = t.replace(/infinity-brand-system\.css\?v=[^"'\s>]+/g, 'infinity-brand-system.css?v=' + V);
  if (t !== before) {
    fs.writeFileSync(file, t);
    n += 1;
  }
}
console.log('bumped', n, '→', V);
