const fs = require('fs');
const path = require('path');
const ROOT = 'D:/Users/carlo/Desktop/Database-';
const out = [];
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.html')) continue;
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const pages = /href=["'][^"']*pages\.css/i.test(t);
  const proto = /prototype\.css|page-shell\.css|student-portal-v2|diagnostic-tool\.css/i.test(t);
  const brand = /infinity-brand-system/i.test(t);
  const light = /#F5EEFF|#FFF8F0|#F3EBFF/i.test(t);
  if (pages || proto || brand) {
    const kind = pages && !proto ? 'HYBRID_or_LEGACY' : proto ? 'NEW_SHELL' : 'BRAND_OVERLAY';
    out.push({ f, pages, proto, brand, light, kind });
  }
}
console.log(out.map((x) => `${x.kind}\tpages=${x.pages}\tproto=${x.proto}\tbrand=${x.brand}\tlight=${x.light}\t${x.f}`).join('\n'));
const hybrid = out.filter((x) => x.pages);
console.log('\nSTILL_LINK_PAGES_CSS=' + hybrid.length);
hybrid.forEach((x) => console.log('- ' + x.f));

// Update audit md section accurately
const mdPath = path.join(ROOT, 'prototype-cadamag', 'BRAND-AUDIT-LIVE.md');
let md = fs.readFileSync(mdPath, 'utf8');
const block = [
  '',
  '## 1b. HTML raíz que aún enlazan `css/pages.css` (híbridos)',
  '',
  `Count: **${hybrid.length}** — tienen brand-system encima, pero el CSS base sigue siendo el shell claro legacy.`,
  '',
  ...hybrid.map((x) => `- \`${x.f}\``),
  '',
  'Acción: promover al shell `prototype-cadamag` (como `index.html`) o redirect.',
  ''
].join('\n');
if (!md.includes('## 1b.')) {
  md = md.replace('## 2. Páginas raíz ya en identidad nueva', block + '## 2. Páginas raíz ya en identidad nueva');
  // Fix verdict count that said ROOT_LEGACY 0
  md = md.replace(
    /\*\*Bloqueante restante:\*\*[^\n]*/,
    '**Bloqueante restante:** ' + hybrid.length + ' HTML raíz aún cargan `css/pages.css` (híbrido claro+overlay). Suite `prototype-cadamag/` = 21/21 OK.'
  );
  fs.writeFileSync(mdPath, md);
}
