const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const pages = [
  'index.html',
  'foundations.html', 'ort.html', 'para-quien.html',
  'job-finder.html', 'conversatorio.html', 'off-the-clock.html',
  'ingles-operacional-latinoamerica.html',
  'alice.html', 'jill.html', 'nexora.html', 'claire.html', 'training-book.html',
  'casos-de-exito.html', 'pricing.html', 'hablemos.html',
  'foundations-path.html', 'ort-path.html', 'advanced-path.html'
];
const legacyNeedles = [
  'css/pages.css',
  'css/pricing.css',
  'css/path-pages.css',
  'css/program-vignettes.css',
  'css/lang-toggle.css',
  'Sora',
  'tabler-icons',
  'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png',
  'subpage-hero',
  'page-footer',
  'nav-logo-page'
];
const required = [
  'assets/brand/svg/favicon.svg',
  'css/brand.css',
  'css/site-nav.css',
  'css/page-shell.css',
  'js/site-nav.js',
  'js/site-footer.js',
  'data-site-nav',
  'data-site-footer',
  'font-family: Inter',
  'Sora'
];

console.log('Página | Legacy removed | New shell | Status');
for (const p of pages) {
  const t = fs.readFileSync(path.join(dir, p), 'utf8');
  const hits = legacyNeedles.filter((n) => t.includes(n));
  const missing = required.filter((n) => {
    if (n === 'font-family: Inter') return !t.includes('family=Inter');
    if (n === 'Sora') return !t.includes('family=Sora') && !t.includes('Sora');
    return !t.includes(n);
  });
  // index doesn't need page-shell content sections but should have nav/footer
  const indexExempt = p === 'index.html';
  const shellOk = indexExempt
    ? t.includes('data-site-nav') && t.includes('data-site-footer') && t.includes('brand.css')
    : missing.filter((m) => m !== 'css/page-shell.css' || t.includes('page-shell.css')).length === 0 || missing.length === 0;
  const legacyOk = hits.length === 0;
  const status = legacyOk && (indexExempt ? true : missing.length === 0) ? 'PASS' : 'CHECK';
  console.log(
    [
      p,
      legacyOk ? 'YES' : 'NO:' + hits.join(','),
      indexExempt || missing.length === 0 ? 'YES' : 'MISS:' + missing.join(','),
      status
    ].join(' | ')
  );
}
