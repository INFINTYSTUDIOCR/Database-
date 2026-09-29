/**
 * Etapa 2 — unify hybrid public pages to dark shell.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V = '20260929hyb1';

const FILES = [
  'programa-50.html',
  'gospanol.html',
  'try-alice.html',
  'try-jill.html',
  'try-demo.html',
  'try-nexora.html'
];

const CREDIT = `
<footer class="cadamag-credit" aria-label="Autoría">
  <p class="cadamag-credit-line">
    <span class="cadamag-credit-by">Created by Cadamag Automação</span>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="mailto:cadamag.automacao@gmail.com">cadamag.automacao@gmail.com</a>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="https://wa.me/5592984168201" target="_blank" rel="noopener noreferrer">+55 (92) 98416-8201</a>
  </p>
</footer>
`;

function ensureCss(html) {
  html = html.replace(/css\/pages\.css\?v=[^"']+/g, `css/pages.css?v=${V}`);
  html = html.replace(/css\/demo\.css(\?v=[^"']+)?/g, `css/demo.css?v=${V}`);

  if (!/infinity-brand-system\.css/.test(html)) {
    html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="css/infinity-brand-system.css?v=${V}">\n</head>`);
  } else {
    html = html.replace(/css\/infinity-brand-system\.css\?v=[^"']+/g, `css/infinity-brand-system.css?v=${V}`);
  }

  if (!/infinity-apps-dark\.css/.test(html)) {
    html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="css/infinity-apps-dark.css?v=${V}">\n</head>`);
  } else {
    html = html.replace(/css\/infinity-apps-dark\.css\?v=[^"']+/g, `css/infinity-apps-dark.css?v=${V}`);
  }

  html = html.replace(/motion\.(css|js)\?v=[^"'\s>]+/g, function (_, k) {
    return 'motion.' + k + '?v=' + V;
  });

  return html;
}

function ensureCredit(html) {
  if (/cadamag-credit/.test(html)) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, CREDIT + '\n</body>');
  }
  return html;
}

function patchGospanol(html, name) {
  if (name !== 'gospanol.html') return html;
  html = html.replace(
    /<h1>GOSpanol<\/h1>/,
    '<h1 data-reveal="top" data-delay="1">GOSpanol</h1>'
  );
  html = html.replace(
    /<article class="case">/,
    '<article class="case" data-reveal="left" data-delay="2">'
  );
  html = html.replace(
    /<h2>What you get<\/h2>/,
    '<h2 data-reveal="top" data-delay="1">What you get</h2>'
  );
  return html;
}

function patchProgramaFormInputs(html, name) {
  if (name !== 'programa-50.html') return html;
  if (html.includes('.form-panel input,')) return html;
  const block = `
    .form-panel input,.form-panel select,.form-panel textarea{
      width:100%;padding:11px 12px;border-radius:10px;margin-bottom:10px;
      background:rgba(8,11,15,.75)!important;border:1px solid rgba(232,234,240,.14)!important;
      color:#E8EAF0!important;font-family:inherit;font-size:14px;
    }
    .form-panel label{color:#C5C9D6;font-size:12px;font-weight:700;}
    .form-panel h2,.campaign-card h2{color:#C4B5FD;}
`;
  return html.replace('</style>', block + '</style>');
}

for (const name of FILES) {
  const fp = path.join(ROOT, name);
  if (!fs.existsSync(fp)) {
    console.log('skip', name);
    continue;
  }
  let html = fs.readFileSync(fp, 'utf8');
  html = ensureCss(html);
  html = ensureCredit(html);
  html = patchGospanol(html, name);
  html = patchProgramaFormInputs(html, name);
  fs.writeFileSync(fp, html);
  console.log('hybrid-dark', name);
}

console.log('OK etapa2', V);
