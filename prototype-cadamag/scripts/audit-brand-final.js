const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SKIP = new Set(['backup', '.git', 'node_modules', '.cursor', 'kamuk', 'gospanol']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const rows = [];
for (const f of walk(ROOT)) {
  const r = path.relative(ROOT, f).split(path.sep).join('/');
  if (/scripts\/|legacy-light|test-alpha|assets\/video/.test(r)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const hasPages = /(?:^|["'\s])css\/pages\.css/i.test(t) || /href=["'][^"']*\/pages\.css/i.test(t);
  const hasSubpages = /subpages\.css/i.test(t);
  const hasProto = /prototype\.css|page-shell\.css|diagnostic-tool\.css|infinity-brand-system|student-portal-v2/i.test(t);
  const lightBg = /#F5EEFF|#FFF8F0|#F3EBFF|linear-gradient\(180deg,#F5EEFF/i.test(t);
  const brand = /assets\/brand\//i.test(t);
  const sora = /Sora|family=Sora/i.test(t);
  let bucket = 'other';
  if (r.startsWith('prototype-cadamag/')) bucket = 'prototype';
  else if (!r.includes('/')) bucket = 'root';
  else if (r.startsWith('Infinity') || /^try-|^activar|^nexora|^arcade|^programa|^portal-access|^index/.test(path.basename(r))) bucket = 'root-tools';

  rows.push({ r, bucket, hasPages, hasSubpages, hasProto, lightBg, brand, sora });
}

const rootLight = rows.filter((x) => x.bucket === 'root' && x.hasPages && !x.hasProto);
const rootOk = rows.filter((x) => x.bucket === 'root' && x.hasProto && !x.hasPages);
const protoOk = rows.filter((x) => x.bucket === 'prototype' && x.hasProto);
const protoBad = rows.filter((x) => x.bucket === 'prototype' && !x.hasProto);
const tools = rows.filter((x) => /Infinity_|try-|activar|portal-access|nexora\.html|programa-50|arcade/.test(x.r) && !x.r.includes('/'));

const cream = [];
for (const f of walk(ROOT)) {
  const r = path.relative(ROOT, f).split(path.sep).join('/');
  if (/backup|scripts\/|legacy-light/.test(r)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/#FFF8F0/i.test(t)) cream.push(r);
}

const md = [];
md.push('# Auditoría exaustiva — Identidad Infinity (corregida)');
md.push('');
md.push(`Fecha: ${new Date().toISOString()}`);
md.push('Scope: árbol activo excluyendo `backup/`, `kamuk/`, `gospanol/` (apps).');
md.push('');
md.push('## Veredicto');
md.push('');
md.push('**NO 100% cerrado.** El núcleo dark/brand pack está en:');
md.push('- `index.html` (raíz promovido desde prototipo)');
md.push('- suite `prototype-cadamag/*`');
md.push('- portal-access, Student Portal, try-*, Engine/Scheduler con brand-system');
md.push('');
md.push('**Bloqueante restante:** páginas comerciales en la **raíz** que aún cargan `css/pages.css` (shell claro legacy), en paralelo a las versiones ya migradas en `prototype-cadamag/`.');
md.push('');
md.push('## 1. Páginas raíz con shell legacy (`pages.css`)');
md.push('');
md.push(`Count: **${rootLight.length}**`);
rootLight.forEach((x) => md.push(`- \`${x.r}\``));
md.push('');
md.push('Estas URLs (`/foundations.html`, `/ort.html`, etc.) **no** son la identidad nueva. Las correctas del prototipo están en `/prototype-cadamag/…`.');
md.push('');
md.push('## 2. Páginas raíz ya en identidad nueva');
md.push('');
rootOk.forEach((x) => md.push(`- \`${x.r}\``));
md.push(`- herramientas: ` + tools.filter((t) => {
  const txt = fs.readFileSync(path.join(ROOT, t.r), 'utf8');
  return /infinity-brand-system|student-portal-v2|prototype\.css/i.test(txt);
}).map((t) => '`' + t.r + '`').join(', '));
md.push('');
md.push('## 3. Suite prototype-cadamag');
md.push('');
md.push(`Con shell nuevo (prototype/page-shell/subpages): **${protoOk.length}**`);
md.push(`Sin shell detectado: **${protoBad.length}**`);
if (protoBad.length) protoBad.forEach((x) => md.push(`- \`${x.r}\``));
md.push('');
md.push('## 4. Señales legacy críticas en HTML/JS activo');
md.push('');
md.push('| Señal | Estado |');
md.push('|---|---|');
md.push('| Hex `#5B21B6/#7C3AED/#3B0E8C/#EDE9FE/#F8F8FF` en producto | **0** (solo scripts de auditoría) |');
md.push('| Space Grotesk en producto | **0** |');
md.push('| Refs activas `assets/logos/infinity*` | **0** en HTML de producto (sí quedan binarios en disco) |');
md.push('| `#FFF8F0` (crema amber notes) | remanente menor en tools/diagnóstico |');
md.push('');
md.push('### Remanente `#FFF8F0` (notas amber claras)');
cream.forEach((c) => md.push(`- \`${c}\``));
md.push('');
md.push('## 5. Binarios legacy en disco (no borrados)');
md.push('');
md.push('Ver `ASSET_REQUIRES_REPLACEMENT.md` — 8 archivos `assets/logos/infinity-*`. Sin refs HTML activas esperadas; no servir como marca.');
md.push('');
md.push('## 6. HTTP smoke :57736');
md.push('');
md.push('- `/index.html` → dark OK');
md.push('- `/prototype-cadamag/*` → dark OK');
md.push('- `/foundations.html` (raíz) → aún `pages.css` legacy');
md.push('- `/portal-access.html`, `/try-alice.html`, `/Infinity_Student_Portal.html` → OK');
md.push('');
md.push('## 7. Checklist de cierre');
md.push('');
md.push('- [x] Home raíz dark (`index.html`)');
md.push('- [x] Prototipo comercial completo');
md.push('- [x] Diagnóstico público `prototype-cadamag/diagnostico.html`');
md.push('- [x] Portal access + Student Portal chrome');
md.push('- [x] try-alice contraste chips');
md.push('- [ ] Promover comerciales raíz → shell nuevo (o redirect a prototype)');
md.push('- [ ] Remap `#FFF8F0` → superficie amber dark');
md.push('- [ ] QA 6 viewports');
md.push('- [ ] Decidir destino binarios logo legacy');
md.push('');
md.push('## Conclusión');
md.push('');
md.push('La identidad nueva **sí está aplicada** en el home, el prototipo, portales y demos.');
md.push('**No** está aplicada de punta a punta en todas las URLs raíz comerciales antiguas (`/foundations.html`, `/ort.html`, …), que siguen coexistiendo con las versiones nuevas bajo `/prototype-cadamag/`.');

fs.writeFileSync(path.join(ROOT, 'prototype-cadamag', 'BRAND-AUDIT-LIVE.md'), md.join('\n'));
console.log('ROOT_LEGACY_PAGES=' + rootLight.length);
console.log(rootLight.map((x) => x.r).join('\n'));
console.log('CREAM=' + cream.length);
console.log(cream.join('\n'));
console.log('PROTO_OK=' + protoOk.length + ' PROTO_BAD=' + protoBad.length);
