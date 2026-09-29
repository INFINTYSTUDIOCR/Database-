const fs = require('fs');
const path = require('path');
const root = 'D:/Users/carlo/Desktop/Database-';
const proto = path.join(root, 'prototype-cadamag');
const files = [
  'index.html',
  'alice.html',
  'jill.html',
  'nexora.html',
  'claire.html',
  'training-book.html',
  'js/site-nav.js'
];
const hrefs = new Set();
for (const f of files) {
  const t = fs.readFileSync(path.join(proto, f), 'utf8');
  for (const m of t.matchAll(/href=["']([^"']+)["']/g)) hrefs.add(m[1]);
}
const rows = [];
for (const h of [...hrefs].sort()) {
  if (
    h.startsWith('#') ||
    h.startsWith('mailto:') ||
    h.startsWith('https://') ||
    h.startsWith('http://') ||
    h === 'javascript:void(0)' ||
    h === '#'
  ) {
    rows.push({
      item: h.slice(0, 60),
      exists: h === '#' || h.startsWith('javascript') ? 'NO' : 'n/a',
      estado: h === '#' || h.startsWith('javascript') ? 'BROKEN' : 'OK'
    });
    continue;
  }
  const rel = h.split('?')[0].replace(/%20/g, ' ');
  let full;
  if (rel.startsWith('../')) full = path.normalize(path.join(proto, rel));
  else if (
    /^(foundations|ort|para-quien|job-finder|conversatorio|off-the-clock|ingles|try-|pricing|hablemos|portal|casos|Infinity_)/.test(
      rel
    )
  ) {
    full = path.join(root, rel);
  } else {
    full = path.join(proto, rel);
  }
  const exists = fs.existsSync(full);
  rows.push({
    item: h.slice(0, 70),
    dest: path.relative(root, full).slice(0, 50),
    exists: exists ? 'YES' : 'NO',
    estado: exists ? 'OK' : 'BROKEN'
  });
}
console.table(rows);
const broken = rows.filter((r) => r.estado === 'BROKEN');
console.log('BROKEN_COUNT', broken.length);
if (broken.length) console.log(broken);
