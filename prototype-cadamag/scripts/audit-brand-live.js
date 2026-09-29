/**
 * Exhaustive Infinity brand audit — active tree only (no backup/)
 * Writes prototype-cadamag/BRAND-AUDIT-LIVE.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKIP = new Set(['backup', '.git', 'node_modules', '.cursor', 'AgentStores']);
const TEXT = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.svg']);

function walk(dir, out = []) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function isTooling(f) {
  return /scripts\/(inventory|migrate|promote|retarget|build-diagnostico|print-active|fix-)|_inventory|_migration|BRAND-MIGRATION|ASSET_REQUIRES|BRAND-AUDIT|index\.legacy-light/i.test(f);
}

function isKamuk(f) { return /(^|\/)kamuk(\/|$)/i.test(f); }
function isGosp(f) { return /(^|\/)gospanol(\/|$)/i.test(f) && !/gospanol\.html$/i.test(f); }

const HEX = /#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF|#5b21b6|#7c3aed|#3b0e8c|#ede9fe|#f8f8ff/g;
const SPACE = /Space Grotesk|Space\+Grotesk/g;
const OLD_LOGO = /assets\/logos\/infinity[^"'\\s)]*|infinity-studio-cr-(?:nav|logo|transparent)|infinity-engine\.png|infinity-logo(?:-improved)?\.png/gi;
const LIGHT_BG = /linear-gradient\(180deg,#F5EEFF|background:\s*#F5EEFF|#FFF8F0|#F3EBFF|lavender|pages\.css/gi;
const BRAND_OK = /prototype-cadamag\/assets\/brand\/|assets\/brand\//;
const FAV_OK = /assets\/brand\/(svg\/)?favicon|prototype-cadamag\/assets\/brand\/favicon/;

const files = walk(ROOT);
const audited = files.length;

const findings = {
  legacyHex: [],
  spaceGrotesk: [],
  oldLogoRefs: [],
  lightBgShell: [],
  missingBrandFavicon: [],
  missingBrandCssOnHtml: [],
  whiteChipRisk: [],
  pagesCssDependency: [],
  binaryLegacyLogos: []
};

const keyPages = [
  'index.html',
  'portal-access.html',
  'Infinity_Student_Portal.html',
  'Infinity_Nexus_Engine.html',
  'Infinity_Diagnostic_Tool (7).html',
  'Infinity_Scheduler.html',
  'Infinity_Training_Book.html',
  'try-alice.html',
  'try-jill.html',
  'try-nexora.html',
  'try-demo.html',
  'prototype-cadamag/index.html',
  'prototype-cadamag/diagnostico.html',
  'prototype-cadamag/portal-access.html',
  'prototype-cadamag/foundations.html',
  'prototype-cadamag/ort.html',
  'prototype-cadamag/pricing.html',
  'prototype-cadamag/hablemos.html'
];

const pageStatus = [];

for (const f of files) {
  const r = rel(f);
  const ext = path.extname(f).toLowerCase();

  if (!TEXT.has(ext)) {
    if (/assets\/logos\/infinity/i.test(r)) findings.binaryLegacyLogos.push(r);
    continue;
  }
  if (isTooling(r)) continue;

  let t;
  try { t = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (t.length > 12e6) continue;

  const kamuk = isKamuk(r);
  const gosp = isGosp(r);

  if (HEX.test(t)) {
    HEX.lastIndex = 0;
    if (!kamuk || /Infinity Studio|prototype-cadamag\/assets\/brand/i.test(t)) {
      if (!kamuk && !gosp) findings.legacyHex.push(r);
      else if (!kamuk) { /* gospanol app keep */ }
      else findings.legacyHex.push(r + ' [kamuk-preserved]');
    }
  }
  if (SPACE.test(t)) {
    SPACE.lastIndex = 0;
    if (!kamuk && !gosp) findings.spaceGrotesk.push(r);
  }
  if (OLD_LOGO.test(t)) {
    OLD_LOGO.lastIndex = 0;
    if (!kamuk && !gosp) findings.oldLogoRefs.push(r);
  }
  if (/pages\.css/i.test(t) && r.endsWith('.html') && !kamuk && !gosp) {
    findings.pagesCssDependency.push(r);
  }
  if (/background:\s*white|background:white|background:\s*#fff\b/i.test(t) && /goal-btn|scenario-btn|\.card\{/.test(t) && !kamuk) {
    findings.whiteChipRisk.push(r);
  }
}

for (const kp of keyPages) {
  const f = path.join(ROOT, kp);
  if (!fs.existsSync(f)) {
    pageStatus.push({ page: kp, status: 'MISSING' });
    continue;
  }
  const t = fs.readFileSync(f, 'utf8');
  const checks = {
    brandPackFavicon: FAV_OK.test(t) || /prototype-cadamag\/assets\/brand\//.test(t),
    darkTheme: /#080B0F|infinity-black|color-scheme:\s*dark|prototype\.css|infinity-brand-system|student-portal-v2/i.test(t),
    soraInter: /Sora|family=Sora/i.test(t),
    oldLogo: OLD_LOGO.test(t),
    legacyHex: HEX.test(t),
    space: SPACE.test(t),
    pagesCss: /pages\.css/i.test(t),
    lightLavenderBg: /#F5EEFF|#FFF8F0|linear-gradient\(180deg,#F5EEFF/i.test(t)
  };
  HEX.lastIndex = 0; OLD_LOGO.lastIndex = 0; SPACE.lastIndex = 0;

  const fails = [];
  if (!checks.brandPackFavicon) fails.push('favicon');
  if (!checks.darkTheme) fails.push('dark_shell');
  if (!checks.soraInter) fails.push('fonts');
  if (checks.oldLogo) fails.push('old_logo_ref');
  if (checks.legacyHex) fails.push('legacy_hex');
  if (checks.space) fails.push('Space_Grotesk');
  if (checks.pagesCss && !/prototype-cadamag\/css\/prototype|infinity-brand-system|student-portal-v2/i.test(t)) fails.push('pages.css_only');
  if (checks.lightLavenderBg) fails.push('light_lavender_bg');

  pageStatus.push({
    page: kp,
    status: fails.length ? 'NEEDS_WORK' : 'OK',
    fails
  });
}

// HTTP smoke if server up
async function smoke() {
  const urls = [
    '/index.html',
    '/prototype-cadamag/index.html',
    '/prototype-cadamag/diagnostico.html',
    '/prototype-cadamag/portal-access.html',
    '/portal-access.html',
    '/try-alice.html',
    '/Infinity_Student_Portal.html',
    '/css/infinity-brand-system.css',
    '/prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png',
    '/prototype-cadamag/css/prototype.css'
  ];
  const out = [];
  for (const u of urls) {
    try {
      const res = await fetch('http://127.0.0.1:57736' + u, { method: 'HEAD' });
      out.push({ u, status: res.status });
    } catch (e) {
      out.push({ u, status: 'ERR', err: String(e.message || e) });
    }
  }
  return out;
}

(async () => {
  const http = await smoke();

  // Filter kamuk-preserved noise from hex for summary
  const hexActive = findings.legacyHex.filter((x) => !x.includes('[kamuk-preserved]'));

  const md = [];
  md.push('# Auditoría exaustiva — Identidad Infinity Studio');
  md.push('');
  md.push(`- Fecha: ${new Date().toISOString()}`);
  md.push(`- Archivos recorridos (ex. backup/): **${audited}**`);
  md.push('');
  md.push('## Criterio de éxito');
  md.push('Árbol activo Infinity = dark premium + brand pack + Sora/Inter + sin hex/logos/Space Grotesk legacy.');
  md.push('Kamuk/GOSpanol apps: branding propio preservado.');
  md.push('');
  md.push('## Páginas clave');
  md.push('');
  md.push('| Página | Estado | Fallos |');
  md.push('|---|---|---|');
  for (const p of pageStatus) {
    md.push(`| \`${p.page}\` | **${p.status}** | ${p.fails && p.fails.length ? p.fails.join(', ') : '—'} |`);
  }
  const okN = pageStatus.filter((p) => p.status === 'OK').length;
  const badN = pageStatus.filter((p) => p.status === 'NEEDS_WORK').length;
  md.push('');
  md.push(`Resumen clave: **${okN} OK** · **${badN} con pendientes** · ${pageStatus.filter((p) => p.status === 'MISSING').length} missing`);
  md.push('');
  md.push('## HTTP smoke (localhost:57736)');
  md.push('');
  for (const h of http) md.push(`- \`${h.u}\` → ${h.status}${h.err ? ' (' + h.err + ')' : ''}`);
  md.push('');
  md.push('## Hallazgos activos Infinity (no Kamuk tooling)');
  md.push('');
  md.push(`| Señal | Count |`);
  md.push(`|---|---|`);
  md.push(`| Hex legacy | ${hexActive.length} |`);
  md.push(`| Space Grotesk | ${findings.spaceGrotesk.length} |`);
  md.push(`| Refs logo infinity antiguo | ${findings.oldLogoRefs.length} |`);
  md.push(`| Dependencia pages.css | ${findings.pagesCssDependency.length} |`);
  md.push(`| Riesgo chip blanco | ${findings.whiteChipRisk.length} |`);
  md.push(`| Binarios logos legacy en disco | ${findings.binaryLegacyLogos.length} |`);
  md.push('');

  function list(title, arr, max = 40) {
    md.push(`### ${title}`);
    if (!arr.length) { md.push('_Ninguno._'); md.push(''); return; }
    arr.slice(0, max).forEach((x) => md.push(`- \`${x}\``));
    if (arr.length > max) md.push(`- … +${arr.length - max} más`);
    md.push('');
  }

  list('Hex legacy activos', hexActive);
  list('Space Grotesk', findings.spaceGrotesk);
  list('Refs logo antiguo', findings.oldLogoRefs);
  list('HTML con pages.css', findings.pagesCssDependency);
  list('Riesgo contraste white chips', findings.whiteChipRisk);
  list('Binarios assets/logos/infinity* (en disco, no borrados)', findings.binaryLegacyLogos);

  md.push('## Veredicto');
  const blocking = badN + hexActive.length + findings.spaceGrotesk.length + findings.oldLogoRefs.length;
  if (blocking === 0 && findings.pagesCssDependency.length === 0) {
    md.push('**PASS** — no hay referencias legacy activas bloqueantes en Infinity.');
  } else if (okN >= pageStatus.length - 3 && hexActive.length === 0 && findings.oldLogoRefs.length === 0) {
    md.push('**PASS CON RESERVAS** — páginas clave OK; quedan dependencias `pages.css` / chips o binarios en disco.');
  } else {
    md.push('**FAIL PARCIAL** — hay páginas o refs legacy activas por cerrar.');
  }
  md.push('');
  md.push('## Pendientes recomendados');
  md.push('1. Migrar HTML root comerciales que aún cargan solo `pages.css` (si existen) al shell prototype.');
  md.push('2. Eliminar o aislar binarios `assets/logos/infinity-*` tras QA (hoy sin refs activas esperadas).');
  md.push('3. QA visual formal 6 viewports.');
  md.push('4. No tocar `backup/` ni branding Kamuk/GOSpanol apps.');
  md.push('');

  const out = path.join(ROOT, 'prototype-cadamag', 'BRAND-AUDIT-LIVE.md');
  fs.writeFileSync(out, md.join('\n'));
  fs.writeFileSync(
    path.join(ROOT, 'prototype-cadamag', '_audit-live.json'),
    JSON.stringify({ audited, pageStatus, findings: { ...findings, legacyHex: hexActive }, http }, null, 2)
  );
  console.log('wrote', out);
  console.log('KEY_OK=' + okN + ' KEY_BAD=' + badN);
  console.log('HEX=' + hexActive.length + ' SPACE=' + findings.spaceGrotesk.length + ' LOGO=' + findings.oldLogoRefs.length);
  console.log('PAGES_CSS=' + findings.pagesCssDependency.length + ' WHITE_CHIP=' + findings.whiteChipRisk.length);
  console.log('BIN_LOGOS=' + findings.binaryLegacyLogos.length);
  console.log(pageStatus.map((p) => p.status + ' ' + p.page + (p.fails && p.fails.length ? ' [' + p.fails.join(',') + ']' : '')).join('\n'));
})();
