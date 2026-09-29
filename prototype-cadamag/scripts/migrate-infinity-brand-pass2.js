/**
 * Restore + harden Infinity brand migration (pass 2).
 * - Restores inventory/migrate COLOR patterns (self-corruption fix)
 * - Forces brand-system.css after inline <style> on tool pages
 * - Remaps Engine/Scheduler/TB :root navy-blue tokens → Infinity violet system
 * - Ensures Sora+Inter on tools
 * - Builds asset replacement list for binary logos still on disk
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// —— 1) Restore scripts ——
const MIG = path.join(__dirname, 'migrate-infinity-brand.js');
const INV = path.join(__dirname, 'inventory-brand-legacy.js');

function restoreScriptPatterns(file, kind) {
  let t = fs.readFileSync(file, 'utf8');
  if (kind === 'migrate') {
    t = t.replace(
      /const COLOR_MAP = \[[\s\S]*?\];/,
      `const COLOR_MAP = [
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
];`
    );
  } else {
    t = t.replace(
      /const COLOR_RE = \/[^/]+\/g;/,
      'const COLOR_RE = /#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF|#5b21b6|#7c3aed|#3b0e8c|#ede9fe|#f8f8ff/g;'
    );
  }
  fs.writeFileSync(file, t);
  console.log('restored', path.basename(file));
}

restoreScriptPatterns(MIG, 'migrate');
restoreScriptPatterns(INV, 'inv');

const TOOL_ROOT_REMAP = [
  ['--navy:#1e3a5f', '--navy:#7B4DFF'],
  ['--navy: #1e3a5f', '--navy: #7B4DFF'],
  ['--nl:#e6f1fb', '--nl:rgba(123,77,255,0.16)'],
  ['--nl: #e6f1fb', '--nl: rgba(123,77,255,0.16)'],
  ['--nm:#185fa5', '--nm:#9B74FF'],
  ['--nm: #185fa5', '--nm: #9B74FF'],
  ['--nd:#0f2744', '--nd:#C4B5FD'],
  ['--nd: #0f2744', '--nd: #C4B5FD'],
  ['--accent:#185fa5', '--accent:#7B4DFF'],
  ['--accent: #185fa5', '--accent: #7B4DFF'],
  ['--accent-bg:#e6f1fb', '--accent-bg:rgba(123,77,255,0.14)'],
  ['--accent-border:#b5d4f4', '--accent-border:rgba(123,77,255,0.35)'],
  ['--purple:#5B21B6', '--purple:#7B4DFF'],
  ['--gold:#F5A623', '--gold:#FF8A00'],
  ['--gold:#f5a623', '--gold:#FF8A00'],
  ['background:#F8F9FC', 'background:#080B0F'],
  ['background: #F8F9FC', 'background: #080B0F'],
  ['background:#fff', 'background:#171C26'],
  ['background:#ffffff', 'background:#171C26'],
  ['#1e3a5f', '#7B4DFF'],
  ['#185fa5', '#9B74FF'],
  ['#0f2744', '#C4B5FD'],
  ['#e6f1fb', 'rgba(123,77,255,0.16)'],
  ['#b5d4f4', 'rgba(123,77,255,0.35)']
];

const TOOL_FILES = [
  'Infinity_Nexus_Engine.html',
  'Infinity_Scheduler.html',
  'Infinity_Training_Book.html',
  'Infinity_Training_Book (1).html',
  'Infinity_Diagnostic_Tool (7).html',
  'try-alice.html',
  'try-jill.html',
  'try-nexora.html',
  'try-demo.html',
  'activar.html',
  'arcade-demo.html',
  'infinity-holdings-crm.html',
  'nexora.html',
  'programa-50.html'
];

const BRAND_LINK = '<link rel="stylesheet" href="css/infinity-brand-system.css?v=20260928brandmig2">\n';
const FONT_SORA = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">\n';

const CADAMAG = `<footer class="cadamag-credit" aria-label="Autoría">
  <p class="cadamag-credit-line">
    <span class="cadamag-credit-by">Created by Cadamag Automação</span>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="mailto:cadamag.automacao@gmail.com">cadamag.automacao@gmail.com</a>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="https://wa.me/5592984168201" target="_blank" rel="noopener noreferrer">+55 (92) 98416-8201</a>
  </p>
</footer>
`;

let modified = [];

for (const name of TOOL_FILES) {
  const f = path.join(ROOT, name);
  if (!fs.existsSync(f)) continue;
  let t = fs.readFileSync(f, 'utf8');
  const before = t;

  for (const [a, b] of TOOL_ROOT_REMAP) t = t.split(a).join(b);

  // Force Sora+Inter if missing Sora
  if (!/family=Sora/i.test(t) && /fonts\.googleapis/i.test(t)) {
    t = t.replace(
      /href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"/i,
      'href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"'
    );
  } else if (!/fonts\.googleapis/i.test(t) && /<head/i.test(t)) {
    t = t.replace(/<head[^>]*>/i, (m) => m + '\n' + FONT_SORA);
  }

  // Inject brand CSS just before </head> (wins over earlier rules for shared classes;
  // :root remaps above handle inline tokens)
  if (!/infinity-brand-system\.css/i.test(t) && /<\/head>/i.test(t)) {
    t = t.replace(/<\/head>/i, BRAND_LINK + '</head>');
  }

  // Favicon pack if still missing brand pack
  if (!/assets\/brand\/(svg\/)?favicon|assets\/brand\/favicon/i.test(t) && /<head/i.test(t)) {
    const block = `  <link rel="icon" href="prototype-cadamag/assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="prototype-cadamag/assets/brand/favicon/favicon.ico">
  <link rel="apple-touch-icon" href="prototype-cadamag/assets/brand/favicon/apple-touch-icon.png">
`;
    t = t.replace(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>\s*/gi, '');
    t = t.replace(/<head[^>]*>/i, (m) => m + '\n' + block);
  }

  // Logo src swaps remaining
  t = t.replace(/assets\/logos\/infinity-studio-cr[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png');
  t = t.replace(/assets\/logos\/infinity-engine\.png[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-stacked-dark.png');

  if (!/cadamag-credit/i.test(t) && /<\/body>/i.test(t)) {
    t = t.replace(/<\/body>/i, CADAMAG + '</body>');
  }

  if (t !== before) {
    fs.writeFileSync(f, t);
    modified.push(name);
  }
}

// Commercial root pages: ensure brand CSS + cadamag + logo/favicon (pass may have partial)
const COMMERCIAL = [
  'index.html', 'foundations.html', 'foundations-path.html', 'ort.html', 'ort-path.html',
  'advanced-path.html', 'para-quien.html', 'pricing.html', 'hablemos.html',
  'casos-de-exito.html', 'ingles-operacional-latinoamerica.html', 'job-finder.html',
  'conversatorio.html', 'off-the-clock.html', 'alice.html', 'jill.html', 'claire.html',
  'training-book.html', 'gospanol.html'
];

for (const name of COMMERCIAL) {
  const f = path.join(ROOT, name);
  if (!fs.existsSync(f)) continue;
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  if (!/infinity-brand-system\.css/i.test(t) && /<\/head>/i.test(t)) {
    t = t.replace(/<\/head>/i, BRAND_LINK + '</head>');
  }
  t = t.replace(/Space Grotesk/g, 'Sora').replace(/Space\+Grotesk/g, 'Sora');
  t = t.replace(/assets\/logos\/infinity-studio-cr[^"'\\s)]*/gi, 'prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png');
  if (!/cadamag-credit/i.test(t) && /<\/body>/i.test(t)) {
    t = t.replace(/<\/body>/i, CADAMAG + '</body>');
  }
  // theme-color
  if (!/theme-color/i.test(t) && /<head/i.test(t)) {
    t = t.replace(/<head[^>]*>/i, (m) => m + '\n<meta name="theme-color" content="#080B0F">');
  }
  if (t !== before) {
    fs.writeFileSync(f, t);
    modified.push(name);
  }
}

// live-kpi-charts palette
const charts = path.join(ROOT, 'js', 'live-kpi-charts.js');
if (fs.existsSync(charts)) {
  let t = fs.readFileSync(charts, 'utf8');
  const before = t;
  const pairs = [
    ['#5B21B6', '#7B4DFF'], ['#7C3AED', '#9B74FF'], ['#3B0E8C', '#5A2FE0'],
    ['#1e3a5f', '#7B4DFF'], ['#185fa5', '#9B74FF'], ['#F5A623', '#FF8A00']
  ];
  for (const [a, b] of pairs) t = t.split(a).join(b);
  if (t !== before) {
    fs.writeFileSync(charts, t);
    modified.push('js/live-kpi-charts.js');
  }
}

// Asset list for leftover binary logos
const logosDir = path.join(ROOT, 'assets', 'logos');
const pending = [];
if (fs.existsSync(logosDir)) {
  for (const name of fs.readdirSync(logosDir)) {
    if (/infinity/i.test(name)) {
      pending.push({
        path: 'assets/logos/' + name,
        reason: 'Legacy Infinity logo file still on disk; active HTML refs remapped to brand pack',
        usedBy: 'historically referenced; verify no remaining active refs'
      });
    }
  }
}

// Scan remaining logo refs in active tree
function walk(dir, out = []) {
  const SKIP = new Set(['backup', '.git', 'node_modules', 'kamuk', 'gospanol', '.cursor']);
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|css|js|json|webmanifest|xml|svg)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const remainingLogoRefs = [];
const remainingHex = [];
for (const f of walk(ROOT)) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  if (rel.includes('scripts/migrate') || rel.includes('scripts/inventory') || rel.includes('_inventory') || rel.includes('BRAND-MIGRATION') || rel.includes('ASSET_REQUIRES')) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/assets\/logos\/infinity/i.test(t)) remainingLogoRefs.push(rel);
  if (/#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF/i.test(t)) remainingHex.push(rel);
}

const assetMd = [
  '# ASSET_REQUIRES_REPLACEMENT',
  '',
  'Legacy binary assets still present under `assets/logos/` (files kept for history; active refs remapped).',
  '',
  '| Path | Why | Action |',
  '|---|---|---|',
  ...pending.map((p) => `| \`${p.path}\` | ${p.reason} | Optional delete after QA; do not serve as brand |`),
  '',
  '## Active refs still pointing at assets/logos/infinity*',
  remainingLogoRefs.length ? remainingLogoRefs.map((r) => `- \`${r}\``).join('\n') : '_None found outside skipped dirs._',
  '',
  '## Active files still containing known legacy hex',
  remainingHex.length ? remainingHex.map((r) => `- \`${r}\``).join('\n') : '_None found outside skipped dirs / tooling scripts._',
  ''
].join('\n');

fs.writeFileSync(path.join(ROOT, 'prototype-cadamag', 'ASSET_REQUIRES_REPLACEMENT.md'), assetMd);

fs.writeFileSync(
  path.join(__dirname, '..', '_migration-pass2.json'),
  JSON.stringify({ modified, remainingLogoRefs, remainingHex, pendingAssets: pending }, null, 2)
);

console.log('PASS2_MODIFIED=' + modified.length);
console.log(modified.join('\n'));
console.log('REMAINING_LOGO_REFS=' + remainingLogoRefs.length);
console.log(remainingLogoRefs.join('\n'));
console.log('REMAINING_HEX=' + remainingHex.length);
console.log(remainingHex.join('\n'));
