/**
 * Build prototype-cadamag/diagnostico.html from legacy diagnostic tool.
 * Preserves logic; replaces visual shell with Infinity brand system.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'Infinity_Diagnostic_Tool (7).html');
const OUT = path.join(__dirname, '..', 'diagnostico.html');
const V = '20260928diag1';

const raw = fs.readFileSync(SRC, 'utf8');

const mainStart = raw.indexOf('<div class="main">');
const scriptMarker = '<script>\nconst SUPA_URL';
let scriptIdx = raw.indexOf(scriptMarker);
if (scriptIdx < 0) scriptIdx = raw.indexOf('<script>\r\nconst SUPA_URL');
if (scriptIdx < 0) scriptIdx = raw.indexOf('const SUPA_URL');
if (mainStart < 0 || scriptIdx < 0) throw new Error('Could not locate main/script');

// Find opening <script> just before SUPA_URL
const scriptOpen = raw.lastIndexOf('<script>', scriptIdx);
const scriptClose = raw.indexOf('</script>', scriptIdx);
if (scriptOpen < 0 || scriptClose < 0) throw new Error('Could not locate script tags');

let mainBlock = raw.slice(mainStart, scriptOpen).trim();
if (!mainBlock.startsWith('<div class="main">') || !mainBlock.endsWith('</div>')) {
  throw new Error('Unexpected main block shape');
}
let mainInner = mainBlock
  .slice('<div class="main">'.length)
  .replace(/\s*<\/div>\s*$/, '');
let script = raw.slice(scriptOpen + '<script>'.length, scriptClose);

// Remap leftover old hex in script-generated UI strings
const colorPairs = [
  ['#7B4DFF', '#7B4DFF'],
  ['#7B4DFF', '#7B4DFF'],
  ['#9B74FF', '#9B74FF'],
  ['#5A2FE0', '#5A2FE0'],
  ['rgba(123,77,255,0.16)', 'rgba(123,77,255,0.16)'],
  ['#12161f', '#12161f'],
  ['#171C26', '#171C26'],
  ['rgba(123,77,255,0.35)', 'rgba(123,77,255,0.35)'],
  ['rgba(123,77,255', 'rgba(123,77,255']
];
for (const [a, b] of colorPairs) {
  script = script.split(a).join(b);
  mainInner = mainInner.split(a).join(b);
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Diagnóstico operacional de inglés | Infinity Studio</title>
  <meta name="description" content="Herramienta de diagnóstico operacional Infinity: KPIs, recomendaciones, session plan y reporte para Foundations u ORT.">
  <link rel="canonical" href="https://studioinfinitycr.com/diagnostico.html">
  <meta property="og:title" content="Diagnóstico operacional | Infinity Studio">
  <meta property="og:description" content="Evaluá KPIs operacionales y obtené recomendaciones Foundations u ORT.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" href="assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="assets/brand/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/brand/favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" href="assets/brand/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/brand/favicon/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="assets/brand/favicon/icon-512.png">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css">
  <link rel="stylesheet" href="css/prototype.css?v=${V}">
  <link rel="stylesheet" href="css/brand.css?v=${V}">
  <link rel="stylesheet" href="css/motion.css?v=20260929scroll2">
  <link rel="stylesheet" href="css/site-nav.css?v=${V}">
  <link rel="stylesheet" href="css/page-shell.css?v=${V}">
  <link rel="stylesheet" href="css/diagnostic-tool.css?v=${V}">
  <script src="../js/site-urls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="../js/live-kpi-charts.js"></script>
  <script src="js/site-nav.js?v=${V}" defer></script>
  <script src="js/site-footer.js?v=${V}" defer></script>
</head>
<body class="diag-page" data-nav-root="../" data-nav-home="index.html">
<a class="skip-link" href="#main">Saltar al contenido</a>
<div class="prototype-badge" aria-hidden="true">Prototype · Cadamag</div>
<header class="site-header" data-site-nav></header>

<div class="main" id="main">
  <p class="diag-eyebrow">Herramienta · Operacional</p>
  <h1 class="diag-page-title">Diagnóstico operacional</h1>
  <p class="diag-hero-note">Evaluá las 5 dimensiones KPI, observá parámetros en vivo y generá el reporte con recomendaciones, ejercicios y plan de 4 semanas. Misma lógica del diagnóstico Infinity — nueva identidad visual.</p>
  <div class="diag-actions no-print">
    <button type="button" class="btn btn-outline" onclick="window.print()"><i class="ti ti-printer"></i> Imprimir</button>
    <button type="button" class="btn btn-outline" onclick="resetAll()"><i class="ti ti-refresh"></i> Reset</button>
  </div>
${mainInner}
</div>

<div data-site-footer></div>
<script>
${script}
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, 'bytes', html.length);
