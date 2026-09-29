/**
 * Fix: broken personas/.png (PowerShell ate $1) + Spanish ¿? on interrogative section titles.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TITLE_MAP = [
  ['Qué es', '¿Qué es?'],
  ['Qué desarrollás', '¿Qué desarrollás?'],
  ['Cómo se usa en Infinity', '¿Cómo se usa en Infinity?'],
  ['Cómo se usa', '¿Cómo se usa?'],
  ['Para quién', '¿Para quién?'],
  ['Qué hace', '¿Qué hace?'],
  ['Cómo funciona', '¿Cómo funciona?'],
  ['Qué eleva', '¿Qué eleva?'],
  ['Cómo se ve', '¿Cómo se ve?'],
  ['Qué podés hacer', '¿Qué podés hacer?'],
  ['Qué incluye el ecosistema', '¿Qué incluye el ecosistema?']
];

function fixTitles(html) {
  for (const [from, to] of TITLE_MAP) {
    // only in section titles / h2 that lack opening ¿
    const re = new RegExp(
      `(<(?:h2|h3)[^>]*class="[^"]*sp-section-title[^"]*"[^>]*>)\\s*${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(</(?:h2|h3)>)`,
      'g'
    );
    html = html.replace(re, `$1${to}$2`);
    // also plain without requiring class order variations
    const re2 = new RegExp(
      `(<h2 class="sp-section-title">)${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(</h2>)`,
      'g'
    );
    html = html.replace(re2, `$1${to}$2`);
  }
  return html;
}

function fixPersonas(html) {
  // <persona-avatar name="Alice" ... src="...personas/alice.png"
  html = html.replace(
    /(<persona-avatar\b[^>]*\bname=")(Alice|Nexora|Jill|Claire)("[\s\S]*?\bsrc=")([^"]*personas\/)\.png(")/gi,
    (m, a, name, b, prefix, c) => a + name + b + prefix + name.toLowerCase() + '.png' + c
  );
  // src before name
  html = html.replace(
    /(<persona-avatar\b[^>]*\bsrc=")([^"]*personas\/)\.png("[\s\S]*?\bname=")(Alice|Nexora|Jill|Claire)(")/gi,
    (m, a, prefix, b, name, c) => a + prefix + name.toLowerCase() + '.png' + b + name + c
  );
  // alice-avatar always Alice
  html = html.replace(
    /(class="alice-avatar"\s+src=")([^"]*personas\/)\.png(")/gi,
    '$1$2alice.png$3'
  );
  // comment example in persona-avatar.js
  html = html.replace(
    /src="public\/personas\/\.png"/g,
    'src="public/personas/alice.png"'
  );
  // any remaining personas/.png near a known name in preceding 200 chars
  html = html.replace(/([\s\S]{0,220})(src=")([^"]*personas\/)\.png(")/gi, (m, before, a, prefix, c) => {
    const nameMatch = before.match(/\bname="(Alice|Nexora|Jill|Claire)"/i) || before.match(/\b(Alice|Nexora|Jill|Claire)\b/i);
    if (!nameMatch) return m;
    const name = (nameMatch[1] || '').toLowerCase();
    if (!name) return m;
    return before + a + prefix + name + '.png' + c;
  });
  return html;
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(backup|node_modules|\.git)$/.test(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(html|js)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

const report = { files: [], leftovers: [] };

for (const file of walk(ROOT)) {
  let t = fs.readFileSync(file, 'utf8');
  if (!/personas\/\.png|sp-section-title">Qué |sp-section-title">Cómo |sp-section-title">Para quién/.test(t)) {
    // still try title fixes for other patterns
    if (!/sp-section-title/.test(t) && !/personas\/\.png/.test(t)) continue;
  }
  const before = t;
  t = fixPersonas(t);
  if (/\.html$/i.test(file)) t = fixTitles(t);
  if (t !== before) {
    fs.writeFileSync(file, t);
    report.files.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}

// scan leftovers
for (const file of walk(ROOT)) {
  const t = fs.readFileSync(file, 'utf8');
  if (/personas\/\.png/.test(t)) {
    report.leftovers.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}

// patch generator source titles for future promotes
const gen = path.join(ROOT, 'prototype-cadamag', 'scripts', 'generate-commercial-pages.js');
if (fs.existsSync(gen)) {
  let g = fs.readFileSync(gen, 'utf8');
  const gb = g;
  g = fixTitles(
    g
      .replace(/section\('Qué es'/g, "section('¿Qué es?'")
      .replace(/section\('Qué desarrollás'/g, "section('¿Qué desarrollás?'")
      .replace(/section\('Cómo se usa'/g, "section('¿Cómo se usa?'")
      .replace(/section\('Para quién'/g, "section('¿Para quién?'")
      .replace(/section\('Cómo funciona'/g, "section('¿Cómo funciona?'")
      .replace(/section\('Qué eleva'/g, "section('¿Qué eleva?'")
      .replace(/section\('Qué hace'/g, "section('¿Qué hace?'")
      .replace(/section\('Cómo se ve'/g, "section('¿Cómo se ve?'")
      .replace(/section\('Qué podés hacer'/g, "section('¿Qué podés hacer?'")
      .replace(/section\('Cómo se usa en Infinity'/g, "section('¿Cómo se usa en Infinity?'")
      .replace(/section\('Qué incluye el ecosistema'/g, "section('¿Qué incluye el ecosistema?'")
  );
  if (g !== gb) {
    fs.writeFileSync(gen, g);
    report.files.push('prototype-cadamag/scripts/generate-commercial-pages.js');
  }
}

fs.writeFileSync(path.join(ROOT, 'prototype-cadamag', '_fix-grammar-images.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
