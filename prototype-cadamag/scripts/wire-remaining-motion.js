const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const V = '20260929scroll1';

// 1) Fix promoted page links
require('./fix-promoted-page-links.js');

// 2) Wire motion on remaining hybrid/public pages
const wire = [
  'try-alice.html',
  'try-jill.html',
  'try-demo.html',
  'try-nexora.html',
  'programa-50.html',
  'gospanol.html'
];

for (const f of wire) {
  const fp = path.join(ROOT, f);
  if (!fs.existsSync(fp)) continue;
  let h = fs.readFileSync(fp, 'utf8');
  if (!/motion\.css/.test(h)) {
    h = h.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="prototype-cadamag/css/motion.css?v=20260929scroll2">\n` +
        `  <script src="prototype-cadamag/js/motion.js?v=20260929scroll2" defer></script>\n</head>`
    );
  } else {
    h = h.replace(/motion\.(css|js)(\?v=[^"']*)?/g, `motion.$1?v=${V}`);
  }
  if (!/infinity-brand-system/.test(h)) {
    h = h.replace(
      /<\/head>/i,
      `<link rel="stylesheet" href="css/infinity-brand-system.css?v=${V}">\n</head>`
    );
  }
  fs.writeFileSync(fp, h);
  console.log('wired', f);
}

// 3) Promote portal-access from proto
const proto = fs.readFileSync(path.join(ROOT, 'prototype-cadamag', 'portal-access.html'), 'utf8');
let pa = proto;
pa = pa.replace(/(href|src)="([^"]+)"/g, (m, a, p) => {
  if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/)/i.test(p)) return m;
  if (p.startsWith('prototype-cadamag/')) return m;
  if (p.startsWith('../')) return `${a}="${p.replace(/^\.\.\//, '')}"`;
  if (/\.html(#.*)?$/i.test(p)) {
    const b = p.replace(/#.*$/, '').split('/').pop();
    if (!/^test-alpha\.html$/i.test(b)) {
      return `${a}="${p.replace(/^\.\//, '')}"`;
    }
  }
  return `${a}="prototype-cadamag/${p}"`;
});
pa = pa.replace(
  /<body[^>]*>/,
  '<body data-nav-root="" data-nav-home="index.html" data-brand-base="prototype-cadamag/" data-pages-base="prototype-cadamag/">'
);
pa = pa.replace(/<div class="prototype-badge"[^>]*>[\s\S]*?<\/div>\s*/i, '');
pa = pa.replace(/\s*<meta name="robots"[^>]*>\s*/i, '\n');
fs.writeFileSync(path.join(ROOT, 'portal-access.html'), pa);
console.log('promoted portal-access');

// Re-run link fix after portal promote
require('./fix-promoted-page-links.js');
console.log('OK');
