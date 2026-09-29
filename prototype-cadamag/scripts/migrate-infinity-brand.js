/**
 * Bulk-migrate active Infinity Studio files to brand pack v2.
 * Skips: backup/, kamuk/ (except Infinity chrome refs), gospanol/, node_modules, .git
 *
 * Does NOT change business logic — visual/branding only.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORT = path.join(__dirname, '..', '_migration-run.json');

const SKIP_DIRS = new Set([
  'backup', '.git', 'node_modules', '.cursor', 'kamuk', 'gospanol', 'AgentStores'
]);

const COLOR_MAP = [
  ['#5B21B6', '#7B4DFF'],
  ['#5b21b6', '#7B4DFF'],
  ['#7C3AED', '#9B74FF'],
  ['#7c3aed', '#9B74FF'],
  ['#3B0E8C', '#5A2FE0'],
  ['#3b0e8c', '#5A2FE0'],
  ['#EDE9FE', 'rgba(123,77,255,0.16)'],
  ['#ede9fe', 'rgba(123,77,255,0.16)'],
  ['#F8F8FF', '#12161f'],
  ['#f8f8ff', '#12161f'],
  ['#F8F9FC', '#171C26'],
  ['#f8f9fc', '#171C26'],
  ['#B5D4F4', 'rgba(123,77,255,0.35)'],
  ['rgba(91,33,182', 'rgba(123,77,255'],
  ['rgba(124,58,237', 'rgba(155,116,255']
];

const LOGO_REPLACEMENTS = [
  // Root-relative
  [/assets\/logos\/infinity-studio-cr-nav\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png'],
  [/assets\/logos\/infinity-studio-cr-logo\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png'],
  [/assets\/logos\/infinity-studio-cr\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-symbol.png'],
  [/assets\/logos\/infinity-engine\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-stacked-dark.png'],
  [/assets\/logos\/training-book\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-symbol.png'],
  // Absolute production URLs
  [/https:\/\/studioinfinitycr\.com\/assets\/logos\/infinity-studio-cr-logo\.png[^"'\\s)]*/gi, 'https://studioinfinitycr.com/prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png'],
  [/https:\/\/studioinfinitycr\.com\/assets\/logos\/infinity-studio-cr\.png[^"'\\s)]*/gi, 'https://studioinfinitycr.com/prototype-cadamag/assets/brand/png/infinity-symbol.png'],
  [/https:\/\/studioinfinitycr\.com\/icon-192\.png[^"'\\s)]*/gi, 'https://studioinfinitycr.com/prototype-cadamag/assets/brand/favicon/icon-192.png'],
  // Relative icon roots
  [/href=["']icon-192\.png[^"']*["']/gi, 'href="../../prototype-cadamag/assets/brand/favicon/icon-192.png"'],
  [/href=["']\/icon-192\.png[^"']*["']/gi, 'href="/prototype-cadamag/assets/brand/favicon/icon-192.png"'],
  [/href=["']favicon\.ico[^"']*["']/gi, 'href="../../prototype-cadamag/assets/brand/favicon/favicon.ico"'],
  [/href=["']apple-touch-icon\.png[^"']*["']/gi, 'href="../../prototype-cadamag/assets/brand/favicon/apple-touch-icon.png"']
];

const FAVICON_BLOCK = `  <link rel="icon" href="../../prototype-cadamag/assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="../../prototype-cadamag/assets/brand/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="../../prototype-cadamag/assets/brand/favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../../prototype-cadamag/assets/brand/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" href="../../prototype-cadamag/assets/brand/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="../../prototype-cadamag/assets/brand/favicon/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="../../prototype-cadamag/assets/brand/favicon/icon-512.png">
`;

const BRAND_CSS_LINK = `<link rel="stylesheet" href="css/infinity-brand-system.css?v=20260928brandmig1">`;
const BRAND_CSS_LINK_FROM_SUB = `<link rel="stylesheet" href="../css/infinity-brand-system.css?v=20260928brandmig1">`;

const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">`;

const CADAMAG = `
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

const TEXT_EXTS = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.svg']);

function walk(dir, out = []) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function depthFromRoot(rel) {
  const parts = rel.split('/').filter(Boolean);
  return Math.max(0, parts.length - 1);
}

function brandCssFor(rel) {
  if (rel.startsWith('prototype-cadamag/')) return null; // prototype has own system
  if (rel.startsWith('css/')) return null;
  if (rel.includes('/')) {
    const d = depthFromRoot(rel);
    return `<link rel="stylesheet" href="${'../'.repeat(d)}css/infinity-brand-system.css?v=20260928brandmig1">`;
  }
  return BRAND_CSS_LINK;
}

function faviconBlockFor(rel) {
  const prefix = rel.includes('/') ? '../'.repeat(depthFromRoot(rel)) + 'prototype-cadamag/assets/brand/' : 'prototype-cadamag/assets/brand/';
  return `  <link rel="icon" href="${prefix}svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="${prefix}favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="${prefix}favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" href="${prefix}favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="${prefix}favicon/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="${prefix}favicon/icon-512.png">
`;
}

function remapColors(text) {
  let t = text;
  for (const [a, b] of COLOR_MAP) t = t.split(a).join(b);
  return t;
}

function remapFonts(text) {
  return text
    .replace(/family=Space\+Grotesk:[^"'&]+/g, 'family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800')
    .replace(/Space\+Grotesk/g, 'Sora')
    .replace(/Sora/g, 'Sora')
    .replace(/'Sora'/g, "'Sora'")
    .replace(/"Sora"/g, '"Sora"');
}

function remapLogos(text, rel) {
  let t = text;
  for (const [re, rep] of LOGO_REPLACEMENTS) t = t.replace(re, rep);
  // Fix double prototype prefix from nested pages
  if (rel.includes('/')) {
    t = t.replace(/href="prototype-cadamag\//g, `href="${'../'.repeat(depthFromRoot(rel))}prototype-cadamag/`);
    t = t.replace(/src="prototype-cadamag\//g, `src="${'../'.repeat(depthFromRoot(rel))}prototype-cadamag/`);
  }
  return t;
}

function injectHead(html, rel) {
  let t = html;
  const brandCss = brandCssFor(rel);

  // theme-color
  if (/theme-color/i.test(t)) {
    t = t.replace(/<meta\s+name=["']theme-color["'][^>]*>/gi, '<meta name="theme-color" content="#080B0F">');
  } else if (/<head[^>]*>/i.test(t)) {
    t = t.replace(/<head[^>]*>/i, (m) => m + '\n<meta name="theme-color" content="#080B0F">');
  }

  // fonts
  if (!/fonts\.googleapis\.com.*Sora/i.test(t) && /<head/i.test(t)) {
    if (/fonts\.googleapis\.com/i.test(t)) {
      // already have google fonts — Sora remap handles family
    } else {
      t = t.replace(/<head[^>]*>/i, (m) => m + '\n' + FONT_LINK);
    }
  }

  // favicons: strip old icon links then inject brand pack once
  if (/<head/i.test(t) && !/assets\/brand\/(svg\/)?favicon/i.test(t) && !rel.startsWith('prototype-cadamag/')) {
    t = t.replace(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon|alternate icon)["'][^>]*>\s*/gi, '');
    t = t.replace(/<head[^>]*>/i, (m) => m + '\n' + faviconBlockFor(rel));
  }

  // brand CSS
  if (brandCss && /<head/i.test(t) && !/infinity-brand-system\.css/i.test(t) && !/student-portal-v2\.css/i.test(t)) {
    if (/<\/head>/i.test(t)) {
      t = t.replace(/<\/head>/i, brandCss + '\n</head>');
    }
  }

  // og:image → brand logo
  t = t.replace(
    /(<meta\s+property=["']og:image["']\s+content=["'])([^"']+)(["'])/gi,
    `$1https://studioinfinitycr.com/prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png$3`
  );
  t = t.replace(
    /(<meta\s+name=["']twitter:image["']\s+content=["'])([^"']+)(["'])/gi,
    `$1https://studioinfinitycr.com/prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png$3`
  );

  // JSON-LD logo
  t = t.replace(
    /("logo"\s*:\s*")https?:\/\/studioinfinitycr\.com\/assets\/logos\/[^"]+(")/gi,
    `$1https://studioinfinitycr.com/prototype-cadamag/assets/brand/png/infinity-symbol.png$2`
  );

  return t;
}

function injectCadamag(html, rel) {
  if (/cadamag-credit/i.test(html)) return html;
  if (rel.startsWith('prototype-cadamag/')) return html; // footer.js handles
  if (!/<\/body>/i.test(html)) return html;
  // Skip tiny utility pages without Infinity chrome? still add discreet credit
  return html.replace(/<\/body>/i, CADAMAG + '\n</body>');
}

function shouldProcess(rel) {
  if (rel.startsWith('backup/')) return false;
  if (rel.startsWith('kamuk/')) return false;
  if (rel.startsWith('gospanol/')) return false;
  if (rel.includes('node_modules/')) return false;
  // skip inventory/report outputs we generate
  if (rel.includes('_inventory') || rel.includes('_migration-run') || rel.includes('BRAND-MIGRATION')) return false;
  if (rel.includes('ASSET_REQUIRES')) return false;
  return true;
}

function isInfinityActive(rel, text) {
  if (/^Infinity_|^infinity-|^try-|^activar|^portal-access|^programa-50|^arcade-demo|^nexora\.html|^index\.html/i.test(path.basename(rel))) return true;
  if (rel.startsWith('prototype-cadamag/')) return true;
  if (rel.startsWith('css/') || rel.startsWith('js/') || rel.startsWith('assets/')) {
    return /infinity|Infinity|nexus|portal|diagnostic|alice|jill|nexora|claire/i.test(rel + text.slice(0, 500));
  }
  // commercial root pages
  const commercial = [
    'foundations.html', 'foundations-path.html', 'ort.html', 'ort-path.html', 'advanced-path.html',
    'para-quien.html', 'pricing.html', 'hablemos.html', 'casos-de-exito.html',
    'ingles-operacional-latinoamerica.html', 'job-finder.html', 'conversatorio.html',
    'off-the-clock.html', 'alice.html', 'jill.html', 'claire.html', 'training-book.html',
    'nexora.html', 'programa-50.html'
  ];
  if (commercial.includes(path.basename(rel)) && !rel.includes('/')) return true;
  if (/manifest.*\.json$/i.test(rel) && /infinity/i.test(text)) return true;
  return /Infinity Studio|studioinfinitycr|Infinity_/i.test(text.slice(0, 4000));
}

const modified = [];
const skipped = [];
const files = walk(ROOT);

for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (!shouldProcess(rel)) continue;
  const ext = path.extname(f).toLowerCase();
  if (!TEXT_EXTS.has(ext)) continue;

  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (text.length > 15_000_000) continue;
  if (!isInfinityActive(rel, text)) {
    skipped.push(rel);
    continue;
  }

  let next = text;
  next = remapColors(next);
  next = remapFonts(next);
  next = remapLogos(next, rel);

  if (ext === '.html') {
    next = injectHead(next, rel);
    next = injectCadamag(next, rel);
  }

  if (ext === '.json' || ext === '.webmanifest') {
    // theme/background in manifests
    next = next.replace(/"theme_color"\s*:\s*"[^"]+"/gi, '"theme_color": "#080B0F"');
    next = next.replace(/"background_color"\s*:\s*"[^"]+"/gi, '"background_color": "#080B0F"');
    next = next.replace(/icon-192\.png/g, 'prototype-cadamag/assets/brand/favicon/icon-192.png');
    next = next.replace(/icon-512\.png/g, 'prototype-cadamag/assets/brand/favicon/icon-512.png');
  }

  if (next !== text) {
    fs.writeFileSync(f, next);
    modified.push(rel);
  }
}

const out = {
  at: new Date().toISOString(),
  modifiedCount: modified.length,
  modified,
  note: 'Visual/branding remap only. Logic preserved. backup/kamuk/gospanol skipped.'
};
fs.writeFileSync(REPORT, JSON.stringify(out, null, 2));
console.log('MODIFIED=' + modified.length);
console.log(modified.slice(0, 80).join('\n'));
if (modified.length > 80) console.log('... +' + (modified.length - 80) + ' more');
