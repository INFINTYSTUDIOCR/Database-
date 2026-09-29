/**
 * Promote prototype-cadamag/index.html → root index.html (dark Infinity identity)
 * Keeps SEO from previous root index; rewrites asset paths; no commit.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PROTO = path.join(ROOT, 'prototype-cadamag', 'index.html');
const OUT = path.join(ROOT, 'index.html');
const BAK = path.join(ROOT, 'index.legacy-light.html');

const old = fs.readFileSync(OUT, 'utf8');
const proto = fs.readFileSync(PROTO, 'utf8');

if (!fs.existsSync(BAK)) {
  fs.writeFileSync(BAK, old);
  console.log('backup → index.legacy-light.html');
}

function one(re, s) {
  const m = s.match(re);
  return m ? m[0] : '';
}

function all(re, s) {
  return [...s.matchAll(re)].map((m) => m[0]);
}

const descContent =
  (old.match(/<meta name="description" content="([^"]*)"/) || [])[1] ||
  '¿Te trabás al hablar inglés? Foundations u ORT. Profe 1 a 1 + IA 24/7.';

const title =
  'Infinity Studio CR — Inglés para la entrevista, el call center y el trabajo';

const seoBits = [
  one(/<meta name="google-site-verification"[^>]*>/, old),
  one(/<meta name="keywords"[^>]*>/, old),
  one(/<link rel="canonical"[^>]*>/, old),
  one(/<link rel="alternate"[^>]*llms\.txt[^>]*>/, old),
  ...all(/<meta property="og:[^"]+"[^>]*>/g, old),
  ...all(/<meta name="twitter:[^"]+"[^>]*>/g, old),
  one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, old)
].filter(Boolean);

let html = proto;

html = html.replace(/\s*<meta name="robots"[^>]*>\s*/i, '\n');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${descContent.replace(/"/g, '&quot;')}">`
);

// Prefix prototype-relative assets; unwrap ../ to root; keep commercial HTML at root
html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, p) => {
  if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/)/i.test(p)) return m;
  if (p.startsWith('prototype-cadamag/')) return m;
  if (p.startsWith('../')) {
    return `${attr}="${p.replace(/^\.\.\//, '')}"`;
  }
  if (/\.html(#.*)?$/i.test(p)) {
    const base = p.replace(/#.*$/, '').split('/').pop();
    if (!/^test-alpha\.html$/i.test(base)) {
      return `${attr}="${p.replace(/^\.\//, '')}"`;
    }
  }
  return `${attr}="prototype-cadamag/${p}"`;
});

html = html.replace(
  /<body[^>]*>/,
  '<body data-nav-root="" data-nav-home="index.html" data-brand-base="prototype-cadamag/" data-pages-base="">'
);

html = html.replace(/<div class="prototype-badge"[^>]*>[\s\S]*?<\/div>\s*/i, '');

// Hero CTA: diagnóstico (promoted to root)
html = html.replace(/href="#diagn[^"]*"/gi, 'href="diagnostico.html"');
html = html.replace(
  /href="prototype-cadamag\/#diagn[^"]*"/gi,
  'href="diagnostico.html"'
);
html = html.replace(
  /href="prototype-cadamag\/diagnostico\.html"/gi,
  'href="diagnostico.html"'
);

// Avoid duplicate SEO when proto already has canonical/og/twitter
html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
html = html.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '');
html = html.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');

// Inject SEO after viewport
html = html.replace(
  /(<meta name="viewport"[^>]*>)/i,
  `$1\n${seoBits.join('\n')}`
);

// Ensure theme-color
if (!/theme-color/i.test(html)) {
  html = html.replace(/<head[^>]*>/i, (h) => `${h}\n<meta name="theme-color" content="#080B0F">`);
}

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, 'bytes', html.length);
console.log('backup', fs.existsSync(BAK));
console.log('dark css', /prototype-cadamag\/css\/prototype\.css/.test(html));
console.log('noindex', /noindex/i.test(html));
console.log('badge', /prototype-badge/i.test(html));
console.log('body', (html.match(/<body[^>]*>/) || [])[0]);
