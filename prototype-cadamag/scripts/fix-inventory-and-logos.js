const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

// Fix corrupted FONT_RE in inventory
const inv = path.join(__dirname, 'inventory-brand-legacy.js');
let invT = fs.readFileSync(inv, 'utf8');
invT = invT.replace(
  /const FONT_RE = \/[^/]+\/g;/,
  'const FONT_RE = /Space Grotesk|Space\\+Grotesk/g;'
);
fs.writeFileSync(inv, invT);
console.log('fixed FONT_RE');

// Clear remaining assets/logos/infinity refs in active Infinity files
const targets = [
  'Infinity_Nexus_Engine.html',
  'nexora.html',
  'nexora-legacy.html',
  'nexora-next/lab.html',
  'portal-access.html',
  'prototype-cadamag/portal-access.html',
  'try-demo.html',
  'sw.js',
  'gospanol.html',
  'index.html'
];

const logoPairs = [
  [/assets\/logos\/infinity-studio-cr-nav\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png'],
  [/assets\/logos\/infinity-studio-cr-logo\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png'],
  [/assets\/logos\/infinity-studio-cr\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-symbol.png'],
  [/assets\/logos\/infinity-engine\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-stacked-dark.png'],
  [/assets\/logos\/training-book\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-symbol.png'],
  [/['"]assets\/logos\/infinity[^'"]+['"]/gi, (m) => m.replace(/assets\/logos\/infinity[^'"]+/i, 'prototype-cadamag/assets/brand/png/infinity-symbol.png')]
];

for (const rel of targets) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  for (const [a, b] of logoPairs) t = t.replace(a, b);
  // sw.js cache lists
  t = t.replace(/\/assets\/logos\/infinity[^"'\\s,]*/gi, '/prototype-cadamag/assets/brand/png/infinity-symbol.png');
  if (t !== before) {
    fs.writeFileSync(f, t);
    console.log('patched logos', rel);
  } else {
    console.log('no logo change', rel, 'still?', /assets\/logos\/infinity/i.test(t));
  }
}

// Ensure try-* have brand CSS
for (const name of ['try-alice.html', 'try-jill.html', 'try-nexora.html', 'try-demo.html']) {
  const f = path.join(ROOT, name);
  if (!fs.existsSync(f)) continue;
  let t = fs.readFileSync(f, 'utf8');
  if (!/infinity-brand-system\.css/i.test(t) && /<\/head>/i.test(t)) {
    t = t.replace(/<\/head>/i, '<link rel="stylesheet" href="css/infinity-brand-system.css?v=20260928brandmig2">\n</head>');
    fs.writeFileSync(f, t);
    console.log('brand css', name);
  }
}
