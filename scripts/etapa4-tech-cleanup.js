/**
 * Etapa 4 — limpieza técnica:
 * 1) Deduplicar canonical (y og/twitter repetidos) en HTML raíz públicos
 * 2) Promover diagnostico.html a raíz (canonical ya apunta ahí)
 * 3) Unificar hrefs → diagnostico.html
 * 4) Quitar prototype-badge / noindex en páginas raíz
 * 5) Parchear scripts de promote para no recrear el bug
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROTO = path.join(ROOT, 'prototype-cadamag');
const V = '20260929tech1';

function one(re, s) {
  const m = s.match(re);
  return m ? m[0] : '';
}

function dedupeByKey(html, re, keyFn) {
  const seen = new Set();
  return html.replace(re, (m) => {
    const key = keyFn(m);
    if (seen.has(key)) return '';
    seen.add(key);
    return m;
  });
}

function cleanHeadDupes(html) {
  html = dedupeByKey(html, /<link[^>]*rel=["']canonical["'][^>]*>\s*/gi, () => 'canonical');
  html = dedupeByKey(
    html,
    /<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi,
    (m) => {
      const p = (m.match(/property=["']([^"']+)["']/) || [])[1] || m;
      return 'og:' + p;
    }
  );
  html = dedupeByKey(
    html,
    /<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi,
    (m) => {
      const n = (m.match(/name=["']([^"']+)["']/) || [])[1] || m;
      return 'tw:' + n;
    }
  );
  html = dedupeByKey(html, /<meta\s+name=["']description["'][^>]*>\s*/gi, () => 'description');
  html = dedupeByKey(html, /<title>[^<]*<\/title>\s*/gi, () => 'title');
  return html;
}

function stripProtoNoise(html) {
  html = html.replace(/<div class="prototype-badge"[^>]*>[\s\S]*?<\/div>\s*/gi, '');
  html = html.replace(/\s*<meta name="robots"[^>]*noindex[^>]*>\s*/gi, '\n');
  return html;
}

function unifyDiagLinks(html) {
  return html
    .replace(/href=(["'])prototype-cadamag\/diagnostico\.html\1/gi, 'href=$1diagnostico.html$1')
    .replace(/href=(["'])#diagn[^"']*\1/gi, 'href=$1diagnostico.html$1');
}

function rewriteProtoAssets(html) {
  return html.replace(/(href|src)="([^"]+)"/g, (m, attr, p) => {
    if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/)/i.test(p)) return m;
    if (p.startsWith('prototype-cadamag/')) return m;
    if (p.startsWith('../')) return `${attr}="${p.replace(/^\.\.\//, '')}"`;
    if (/\.html(#.*)?$/i.test(p)) {
      const base = p.replace(/#.*$/, '').split('/').pop();
      // test-alpha stays in proto; diagnostico is now at root
      if (/^test-alpha\.html$/i.test(base)) {
        return `${attr}="prototype-cadamag/${p.replace(/^\.\//, '')}"`;
      }
      return `${attr}="${p.replace(/^\.\//, '')}"`;
    }
    return `${attr}="prototype-cadamag/${p}"`;
  });
}

function promoteDiagnostico() {
  const src = path.join(PROTO, 'diagnostico.html');
  const out = path.join(ROOT, 'diagnostico.html');
  if (!fs.existsSync(src)) {
    console.log('skip promote diagnostico');
    return false;
  }

  const proto = fs.readFileSync(src, 'utf8');
  const old = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  const bak = path.join(ROOT, 'diagnostico.legacy-light.html');
  if (old && !fs.existsSync(bak)) fs.writeFileSync(bak, old);

  const title = one(/<title>[^<]*<\/title>/, old) || one(/<title>[^<]*<\/title>/, proto);
  const desc =
    one(/<meta name="description" content="[^"]*">/, old) ||
    one(/<meta name="description" content="[^"]*">/, proto);
  const canonical =
    one(/<link rel="canonical"[^>]*>/, old) ||
    '<link rel="canonical" href="https://studioinfinitycr.com/diagnostico.html">';
  const og = [...(old.matchAll(/<meta property="og:[^"]+"[^>]*>/g) || [])].map((m) => m[0]);
  const tw = [...(old.matchAll(/<meta name="twitter:[^"]+"[^>]*>/g) || [])].map((m) => m[0]);

  let html = proto;
  html = html.replace(/\s*<meta name="robots"[^>]*>\s*/i, '\n');
  if (title) html = html.replace(/<title>[^<]*<\/title>/, title);
  if (desc) html = html.replace(/<meta name="description" content="[^"]*">/, desc);

  // Remove proto-level SEO that we'll re-inject once (avoid dupes)
  html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');

  html = rewriteProtoAssets(html);
  html = html.replace(
    /<body[^>]*>/,
    '<body class="diag-page" data-nav-root="" data-nav-home="index.html" data-brand-base="prototype-cadamag/" data-pages-base="prototype-cadamag/">'
  );
  html = stripProtoNoise(html);

  const seo = [canonical, ...og, ...tw].filter(Boolean).join('\n');
  html = html.replace(/(<meta name="viewport"[^>]*>)/i, `$1\n${seo}`);

  html = html.replace(/diagnostic-tool\.css\?v=[^"']+/g, `diagnostic-tool.css?v=${V}`);
  html = html.replace(/motion\.(css|js)\?v=[^"']+/g, `motion.$1?v=${V}`);
  html = html.replace(/page-shell\.css\?v=[^"']+/g, `page-shell.css?v=${V}`);
  html = cleanHeadDupes(html);
  html = unifyDiagLinks(html);

  fs.writeFileSync(out, html);
  console.log('promoted diagnostico.html', html.length);
  return true;
}

// --- run ---
promoteDiagnostico();

const report = {
  cleaned: [],
  canonicalWas: {},
  stillIssues: []
};

for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  if (/\.legacy/i.test(f)) continue;
  const file = path.join(ROOT, f);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const canonBefore = (html.match(/rel=["']canonical["']/gi) || []).length;

  html = cleanHeadDupes(html);
  html = stripProtoNoise(html);
  html = unifyDiagLinks(html);
  // fix mangled motion URLs if any
  html = html.replace(/motion\.=(\d+)/g, 'motion.css?v=$1');
  html = html.replace(/motion\.js\.=(\d+)/g, 'motion.js?v=$1');

  if (html !== before) {
    fs.writeFileSync(file, html);
    report.cleaned.push(f);
    if (canonBefore > 1) report.canonicalWas[f] = `${canonBefore}→1`;
  }

  const t = html;
  const c = (t.match(/rel=["']canonical["']/gi) || []).length;
  const badge = /prototype-badge/i.test(t);
  const noindex = /noindex/i.test(t);
  const oldDiag = /prototype-cadamag\/diagnostico\.html/i.test(t);
  if (c > 1 || badge || (noindex && !/^try-/i.test(f)) || oldDiag) {
    report.stillIssues.push({ f, c, badge, noindex, oldDiag });
  }
}

// Also unify diag links inside prototype commercial sources (keep assets relative)
let protoFixed = 0;
for (const f of fs.readdirSync(PROTO).filter((x) => x.endsWith('.html'))) {
  const file = path.join(PROTO, f);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  // In proto, diagnostico.html is sibling — keep as diagnostico.html (already)
  // But if someone linked prototype-cadamag/diagnostico from within proto, fix
  html = html.replace(
    /href=(["'])prototype-cadamag\/diagnostico\.html\1/gi,
    'href=$1diagnostico.html$1'
  );
  // CTAs that pointed at root via ../diagnostico — after promote, from proto still ../diagnostico OR we leave relative diagnostico for in-proto and ../ for pages that expect root
  // Root pages already use diagnostico.html. Proto pages used diagnostico.html as sibling — OK for local preview; for production CTAs from promoted pages use root.
  if (html !== before) {
    fs.writeFileSync(file, html);
    protoFixed += 1;
  }
}

fs.writeFileSync(
  path.join(PROTO, '_etapa4-report.json'),
  JSON.stringify({ report, protoFixed, hasRootDiag: fs.existsSync(path.join(ROOT, 'diagnostico.html')) }, null, 2)
);
console.log(JSON.stringify({ cleaned: report.cleaned.length, canonicalWas: report.canonicalWas, stillIssues: report.stillIssues, protoFixed }, null, 2));
console.log('OK etapa4');
