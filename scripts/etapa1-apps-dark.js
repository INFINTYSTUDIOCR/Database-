/**
 * Etapa 1 — dark shell on product apps (tokens + link apps-dark CSS).
 * No logic / JS changes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V = '20260929apps1';

const DARK_ROOT = `:root{
  --navy:#7B4DFF;--nl:rgba(123,77,255,0.16);--nm:#9B74FF;--nd:#C4B5FD;
  --accent:#7B4DFF;--accent-bg:rgba(123,77,255,0.14);--accent-border:rgba(123,77,255,0.35);
  --green:#34d399;--gb:rgba(52,211,153,0.12);--gm:#6ee7b7;
  --amber:#FFA940;--ab:rgba(255,138,0,0.12);--ad:#FFD08A;
  --red:#f87171;--rb:rgba(248,113,113,0.12);--rm:#fca5a5;
  --purple:#7B4DFF;--pb:rgba(123,77,255,0.14);--pm:#9B74FF;
  --purple-light:#9B74FF;--purple-glow:rgba(123,77,255,0.12);
  --gold:#FF8A00;--gray:#12161f;--border:rgba(232,234,240,0.12);
  --text:#E8EAF0;--t2:#C5C9D6;--t3:#8B92A8;
  --r:10px;--rl:14px;
  --bg:#080B0F;--surface:#171C26;
}`;

const FILES = [
  'Infinity_Student_Portal.html',
  'Infinity_Nexus_Engine.html',
  'Infinity_Training_Book.html',
  'Infinity_Training_Book (1).html',
  'Infinity_Diagnostic_Tool (7).html'
];

function patchRoot(html) {
  // Replace first :root{...} block in a <style> (non-greedy enough via brace balance)
  const idx = html.indexOf(':root{');
  if (idx < 0) return html;
  let i = idx + 6;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const ch = html[i++];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  return html.slice(0, idx) + DARK_ROOT + html.slice(i);
}

function ensureLinks(html) {
  const brand = `css/infinity-brand-system.css?v=${V}`;
  const apps = `css/infinity-apps-dark.css?v=${V}`;

  if (!/infinity-brand-system\.css/.test(html)) {
    html = html.replace(
      /<\/head>/i,
      `<link rel="stylesheet" href="${brand}">\n</head>`
    );
  } else {
    html = html.replace(
      /css\/infinity-brand-system\.css\?v=[^"']+/g,
      brand
    );
  }

  if (!/infinity-apps-dark\.css/.test(html)) {
    html = html.replace(
      /<\/head>/i,
      `<link rel="stylesheet" href="${apps}">\n</head>`
    );
  } else {
    html = html.replace(/css\/infinity-apps-dark\.css\?v=[^"']+/g, apps);
  }

  html = html.replace(
    /css\/student-portal-v2\.css\?v=[^"']+/g,
    `css/student-portal-v2.css?v=${V}`
  );

  return html;
}

function patchPortalLights(html, name) {
  if (!/Student_Portal/.test(name)) return html;
  html = html.replace(
    /background:linear-gradient\(165deg,rgba\(123,77,255,0\.16\) 0%,#080B0F 55%,#fff 100%\);/g,
    'background:linear-gradient(165deg,rgba(123,77,255,0.16) 0%,#080B0F 55%,#12161f 100%);'
  );
  html = html.replace(
    /\.inf-action-soft\{background:#fff;color:var\(--nd\);/g,
    '.inf-action-soft{background:rgba(23,28,38,0.95);color:var(--nd);'
  );
  html = html.replace(
    /\.login-card\{background:white;/g,
    '.login-card{background:rgba(23,28,38,0.95);'
  );
  html = html.replace(
    /\.card\{background:white;/g,
    '.card{background:rgba(23,28,38,0.94);'
  );
  html = html.replace(
    /\.btn-outline\{background:white;color:var\(--t2\);/g,
    '.btn-outline{background:rgba(255,255,255,0.04);color:var(--t2);'
  );
  return html;
}

function patchEngineLights(html, name) {
  if (!/Nexus_Engine/.test(name)) return html;
  html = html.replace(/\.ltab\{[^}]*background:white;/g, (m) =>
    m.replace('background:white;', 'background:rgba(8,11,15,0.65);')
  );
  html = html.replace(
    /\.btn-outline\{background:white;color:var\(--t2\);/g,
    '.btn-outline{background:rgba(255,255,255,0.04);color:var(--t2);'
  );
  html = html.replace(
    /body\{font-family:'Inter',system-ui,sans-serif;background:var\(--bg\);/,
    "body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);"
  );
  return html;
}

function patchBookLights(html, name) {
  if (!/Training_Book/.test(name)) return html;
  html = html.replace(/\.sel-card\{background:white;/g, '.sel-card{background:rgba(23,28,38,0.95);');
  html = html.replace(/\.sidebar\{[^}]*background:white;/g, (m) =>
    m.replace('background:white;', 'background:rgba(23,28,38,0.96);')
  );
  html = html.replace(/\.student-card\{[^}]*background:white;/g, (m) =>
    m.replace('background:white;', 'background:rgba(23,28,38,0.96);')
  );
  html = html.replace(
    /\.portal-section\{background:white;/g,
    '.portal-section{background:rgba(23,28,38,0.94);'
  );
  html = html.replace(
    /body\{font-family:'Inter'[^;]*;background:#12161f;/,
    (m) => m.replace('background:#12161f;', 'background:#080B0F;')
  );
  return html;
}

function patchDiagLights(html, name) {
  if (!/Diagnostic_Tool/.test(name)) return html;
  html = html.replace(/\.card\{background:white;/g, '.card{background:rgba(23,28,38,0.94);');
  html = html.replace(
    /\.kpi-btn\{[^}]*background:white;/g,
    (m) => m.replace('background:white;', 'background:rgba(8,11,15,0.7);')
  );
  html = html.replace(
    /body\{font-family:-apple-system[^;]*;background:#12161f;/,
    (m) =>
      m
        .replace('background:#12161f;', 'background:#080B0F;')
        .replace(
          "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
          "font-family:'Inter',system-ui,sans-serif;"
        )
  );
  return html;
}

for (const name of FILES) {
  const fp = path.join(ROOT, name);
  if (!fs.existsSync(fp)) {
    console.log('skip missing', name);
    continue;
  }
  let html = fs.readFileSync(fp, 'utf8');
  html = patchRoot(html);
  html = ensureLinks(html);
  html = patchPortalLights(html, name);
  html = patchEngineLights(html, name);
  html = patchBookLights(html, name);
  html = patchDiagLights(html, name);
  fs.writeFileSync(fp, html);
  console.log('darkened', name);
}

console.log('OK etapa1 apps', V);
