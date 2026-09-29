const fs = require('fs');
const j = require('../_audit-live.json');

console.log('HEX', j.findings.legacyHex);
console.log('SPACE', j.findings.spaceGrotesk);
console.log('LOGO', j.findings.oldLogoRefs);
console.log('PAGES', j.findings.pagesCssDependency);
console.log('WHITE', j.findings.whiteChipRisk);

const checks = [
  'Infinity_Nexus_Engine.html',
  'Infinity_Diagnostic_Tool (7).html',
  'Infinity_Training_Book.html',
  'prototype-cadamag/diagnostico.html',
  'prototype-cadamag/foundations.html',
  'prototype-cadamag/portal-access.html',
  'prototype-cadamag/pricing.html'
];

for (const f of checks) {
  const t = fs.readFileSync('D:/Users/carlo/Desktop/Database-/' + f, 'utf8');
  const hits = {
    F5EEFF: /#F5EEFF/i.test(t),
    FFF8F0: /#FFF8F0/i.test(t),
    F3EBFF: /#F3EBFF/i.test(t),
    lavender: /lavender/i.test(t),
    pagescss: /pages\.css/i.test(t),
    shell: /prototype\.css|page-shell|diagnostic-tool|brand-system|subpages\.css/i.test(t),
    brandFav: /assets\/brand/i.test(t),
    lavenderCtx: (t.match(/lavender[\s\S]{0,40}/gi) || []).slice(0, 3)
  };
  console.log('\n' + f);
  console.log(JSON.stringify(hits, null, 2));
}

// Where is the one SPACE and HEX?
const fs2 = require('fs');
const path = require('path');
function walk(dir, out = []) {
  for (const e of fs2.readdirSync(dir, { withFileTypes: true })) {
    if (['backup', '.git', 'node_modules', 'kamuk', 'gospanol', '.cursor'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|css|js)$/i.test(e.name)) out.push(p);
  }
  return out;
}
const ROOT = 'D:/Users/carlo/Desktop/Database-';
for (const f of walk(ROOT)) {
  const r = path.relative(ROOT, f).split(path.sep).join('/');
  if (/scripts\/|_inventory|BRAND-|ASSET_|migrate|inventory|audit|legacy-light/.test(r)) continue;
  const t = fs2.readFileSync(f, 'utf8');
  if (/Space Grotesk|Space\+Grotesk/.test(t)) console.log('SPACE_HIT', r);
  if (/#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF/i.test(t)) console.log('HEX_HIT', r);
  if (/assets\/logos\/infinity/i.test(t)) console.log('LOGO_HIT', r);
}
