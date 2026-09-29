/**
 * Fix promote over-prefix: commercial page links should stay at root.
 * Assets stay under prototype-cadamag/. Diagnostico is promoted to root.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const ROOT_PAGES = new Set([
  'index.html',
  'foundations.html',
  'foundations-path.html',
  'ort.html',
  'ort-path.html',
  'advanced-path.html',
  'para-quien.html',
  'pricing.html',
  'hablemos.html',
  'casos-de-exito.html',
  'ingles-operacional-latinoamerica.html',
  'job-finder.html',
  'conversatorio.html',
  'off-the-clock.html',
  'alice.html',
  'jill.html',
  'claire.html',
  'nexora.html',
  'training-book.html',
  'portal-access.html',
  'programa-50.html',
  'gospanol.html',
  'try-alice.html',
  'try-jill.html',
  'try-demo.html',
  'try-nexora.html',
  'diagnostico.html'
]);

const files = [
  'index.html',
  ...[...ROOT_PAGES].filter((p) => p !== 'index.html')
];

let fixed = 0;
files.forEach((name) => {
  const fp = path.join(ROOT, name);
  if (!fs.existsSync(fp)) return;
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;
  html = html.replace(
    /(href|src)="prototype-cadamag\/([^"]+\.html)(#[^"]*)?"/gi,
    (m, attr, page, hash) => {
      const base = page.split('/').pop();
      if (ROOT_PAGES.has(base) || ROOT_PAGES.has(page)) {
        return `${attr}="${base}${hash || ''}"`;
      }
      // test-alpha and other proto-only stay prefixed
      return m;
    }
  );
  // Also unwrap ../ that somehow remained
  html = html.replace(/(href|src)="\.\.\/([a-z0-9\-]+\.html)"/gi, '$1="$2"');
  if (html !== before) {
    fs.writeFileSync(fp, html);
    fixed += 1;
    console.log('fixed links', name);
  }
});

console.log('done', fixed);
