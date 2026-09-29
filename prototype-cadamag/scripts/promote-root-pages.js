/**
 * Promote prototype commercial pages → root (dark Infinity shell).
 * Keeps SEO from old root file when present. Backs up to *.legacy-light.html once.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PROTO = path.join(ROOT, 'prototype-cadamag');

const PAGES = [
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
  'training-book.html'
];

function one(re, s) {
  const m = s.match(re);
  return m ? m[0] : '';
}
function all(re, s) {
  return [...s.matchAll(re)].map((m) => m[0]);
}

function promote(name) {
  const srcPath = path.join(PROTO, name);
  const outPath = path.join(ROOT, name);
  if (!fs.existsSync(srcPath)) {
    console.log('skip (no proto)', name);
    return;
  }

  const proto = fs.readFileSync(srcPath, 'utf8');
  const old = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  const bak = path.join(ROOT, name.replace(/\.html$/, '.legacy-light.html'));
  if (old && !fs.existsSync(bak) && /pages\.css/i.test(old)) {
    fs.writeFileSync(bak, old);
  }

  const title = one(/<title>[^<]*<\/title>/, old) || one(/<title>[^<]*<\/title>/, proto);
  const desc =
    one(/<meta name="description" content="[^"]*">/, old) ||
    one(/<meta name="description" content="[^"]*">/, proto);
  const canonical = one(/<link rel="canonical"[^>]*>/, old);
  const og = all(/<meta property="og:[^"]+"[^>]*>/g, old);
  const tw = all(/<meta name="twitter:[^"]+"[^>]*>/g, old);

  let html = proto;
  html = html.replace(/\s*<meta name="robots"[^>]*>\s*/i, '\n');
  if (title) html = html.replace(/<title>[^<]*<\/title>/, title);
  if (desc) html = html.replace(/<meta name="description" content="[^"]*">/, desc);

  html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, p) => {
    if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/)/i.test(p)) return m;
    if (p.startsWith('prototype-cadamag/')) return m;
    if (p.startsWith('../')) return `${attr}="${p.replace(/^\.\.\//, '')}"`;
    // Keep sibling commercial HTML at root (promoted); assets go to proto
    if (/\.html(#.*)?$/i.test(p)) {
      const base = p.replace(/#.*$/, '').split('/').pop();
      const keepInProto = /^test-alpha\.html$/i.test(base);
      if (!keepInProto) return `${attr}="${p.replace(/^\.\//, '')}"`;
    }
    return `${attr}="prototype-cadamag/${p}"`;
  });

  html = html.replace(
    /<body[^>]*>/,
    '<body data-nav-root="" data-nav-home="index.html" data-brand-base="prototype-cadamag/" data-pages-base="">'
  );
  html = html.replace(/<div class="prototype-badge"[^>]*>[\s\S]*?<\/div>\s*/i, '');
  html = html.replace(/href="#diagn[^"]*"/gi, 'href="diagnostico.html"');

  // Bump motion cache
  html = html.replace(/motion\.(css|js)\?v=[^"']+/g, 'motion.$1?v=20260929scroll1');
  html = html.replace(/page-shell\.css\?v=[^"']+/g, 'page-shell.css?v=20260929scroll1');

  // Avoid duplicate SEO when proto already has canonical/og/twitter
  html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');

  const seo = [canonical, ...og, ...tw].filter(Boolean).join('\n');
  if (seo) {
    html = html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${seo}`);
  }

  fs.writeFileSync(outPath, html);
  console.log('promoted', name);
}

PAGES.forEach(promote);
console.log('done', PAGES.length);
