/**
 * Etapa 5 — QA estático: assets rotos, leftovers light, badge/noindex, contrast tokens.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  'index.html',
  'foundations.html',
  'foundations-path.html',
  'ort.html',
  'ort-path.html',
  'pricing.html',
  'hablemos.html',
  'diagnostico.html',
  'programa-50.html',
  'gospanol.html',
  'try-alice.html',
  'try-jill.html',
  'Infinity_Student_Portal.html',
  'Infinity_Nexus_Engine.html',
  'Infinity_Training_Book.html',
  'Infinity_Diagnostic_Tool (7).html'
];

const LIGHT_LEFTOVERS = [
  /#F4F1EA/i,
  /#faf8f4/i,
  /cream|#FFF8F0/i,
  /pages\.css(?![^"']*infinity)/i // alone pages.css without dark overlay may be ok on hybrids
];

function existsRel(fromFile, rel) {
  if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/i.test(rel)) return true;
  const clean = rel.split('?')[0].split('#')[0];
  if (!clean) return true;
  const base = path.dirname(fromFile);
  const abs = path.normalize(path.join(base, clean));
  return fs.existsSync(abs);
}

const report = { pages: [], critical: [], warn: [] };

for (const name of PAGES) {
  const fp = path.join(ROOT, name);
  if (!fs.existsSync(fp)) {
    report.critical.push('MISSING ' + name);
    continue;
  }
  const html = fs.readFileSync(fp, 'utf8');
  const entry = { name, issues: [] };

  const canon = (html.match(/rel=["']canonical["']/gi) || []).length;
  if (canon > 1) entry.issues.push({ sev: 'critical', msg: 'duplicate canonical ' + canon });
  if (/prototype-badge/i.test(html) && !/try-/i.test(name)) {
    entry.issues.push({ sev: 'warn', msg: 'prototype-badge still present' });
  }
  if (/noindex/i.test(html) && !/try-|Diagnostic_Tool|Training_Book/i.test(name)) {
    entry.issues.push({ sev: 'warn', msg: 'noindex on public page' });
  }
  if (/prototype-cadamag\/diagnostico\.html/i.test(html)) {
    entry.issues.push({ sev: 'critical', msg: 'old diagnostico path' });
  }

  // broken local assets in href/src
  const refs = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((m) => m[1]);
  const broken = [];
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/i.test(r)) continue;
    if (!existsRel(fp, r)) broken.push(r);
  }
  if (broken.length) {
    entry.issues.push({
      sev: 'critical',
      msg: 'broken assets: ' + broken.slice(0, 8).join(', ') + (broken.length > 8 ? '…+' + (broken.length - 8) : '')
    });
  }

  // dark brand signals
  const dark =
    /#080B0F|#171C26|infinity-apps-dark|infinity-brand-system|prototype-cadamag\/css\/prototype\.css|data-theme=["']dark["']/i.test(
      html
    );
  if (!dark && !/try-/i.test(name)) {
    entry.issues.push({ sev: 'warn', msg: 'weak dark-brand signal' });
  }

  // light leftover hex in inline or linked expectation — only flag inline
  if (/#F4F1EA|#FAF8F4|#FFF8F0/i.test(html)) {
    entry.issues.push({ sev: 'warn', msg: 'light cream hex in HTML' });
  }

  // motion present on commercial
  if (/foundations|ort|pricing|index|hablemos|diagnostico|para-quien|casos|advanced/i.test(name)) {
    if (!/motion\.js/i.test(html)) entry.issues.push({ sev: 'warn', msg: 'missing motion.js' });
  }

  report.pages.push(entry);
  for (const i of entry.issues) {
    (i.sev === 'critical' ? report.critical : report.warn).push(name + ': ' + i.msg);
  }
}

// contrast tokens in CSS
const cssFiles = [
  'prototype-cadamag/css/page-shell.css',
  'prototype-cadamag/css/subpages.css',
  'prototype-cadamag/css/prototype.css',
  'css/pages.css',
  'css/infinity-brand-system.css',
  'css/infinity-apps-dark.css'
];
report.cssTokens = {};
for (const c of cssFiles) {
  const fp = path.join(ROOT, c);
  if (!fs.existsSync(fp)) continue;
  const t = fs.readFileSync(fp, 'utf8');
  report.cssTokens[c] = {
    hasE0: /#E0E3ED/i.test(t),
    hasB4: /#B4BAC9/i.test(t),
    has080: /#080B0F/i.test(t),
    has7B: /#7B4DFF/i.test(t)
  };
}

fs.writeFileSync(
  path.join(ROOT, 'prototype-cadamag', '_etapa5-qa.json'),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify({ critical: report.critical, warn: report.warn, cssTokens: report.cssTokens }, null, 2));
