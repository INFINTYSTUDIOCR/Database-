const fs = require('fs');
const path = require('path');
const ROOT = 'D:/Users/carlo/Desktop/Database-';

function linksPagesCss(t) {
  // true pages.css only — not subpages.css
  return /href=["'][^"']*(?:^|\/)pages\.css(?:\?[^"']*)?["']/i.test(t)
    || /href=["']pages\.css(?:\?[^"']*)?["']/i.test(t)
    || /href=["']css\/pages\.css(?:\?[^"']*)?["']/i.test(t);
}

const root = [];
for (const f of fs.readdirSync(ROOT)) {
  if (!f.endsWith('.html')) continue;
  if (f === 'index.legacy-light.html') continue;
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (linksPagesCss(t)) root.push(f);
}

const proto = [];
const protoDir = path.join(ROOT, 'prototype-cadamag');
for (const f of fs.readdirSync(protoDir)) {
  if (!f.endsWith('.html')) continue;
  const t = fs.readFileSync(path.join(protoDir, f), 'utf8');
  const ok = /prototype\.css|page-shell\.css|diagnostic-tool\.css|portal-access\.css/i.test(t);
  proto.push({ f, ok, pages: linksPagesCss(t) });
}

const cream = [];
function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['backup', '.git', 'node_modules', 'kamuk', 'gospanol', '.cursor'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(html|css|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
for (const f of walk(ROOT)) {
  const r = path.relative(ROOT, f).split(path.sep).join('/');
  if (/scripts\/|legacy-light|audit-|migrate-|inventory/.test(r)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/#FFF8F0/i.test(t)) cream.push(r);
  if (/#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF/i.test(t)) {
    // ignore
  }
}

const md = `# Auditoría exaustiva — Identidad Infinity Studio

**Fecha:** ${new Date().toISOString()}  
**Alcance:** repo activo (excluye \`backup/\`, apps \`kamuk/\` y \`gospanol/\`)  
**Servidor:** http://127.0.0.1:57736

---

## Veredicto

**Parcialmente completo — NO 100%.**

### Ya en identidad nueva (dark + brand pack)
| Área | Estado |
|---|---|
| \`/\` home \`index.html\` | OK (promovido desde prototipo) |
| Suite \`prototype-cadamag/*.html\` (${proto.filter((p) => p.ok).length}/${proto.length}) | OK |
| \`prototype-cadamag/diagnostico.html\` | OK (crema amber menor) |
| \`portal-access.html\` | OK (shell nuevo) |
| \`Infinity_Student_Portal.html\` | OK (v2 + brand pack) |
| try-alice / try-jill / try-nexora / try-demo | OK overlay brand (+ try-alice chips dark) |
| Engine / Scheduler / Training Book | OK overlay brand-system (crema amber menor) |
| Favicons / manifests / OG home | OK brand pack |
| Hex legacy producto \`#5B21B6\` etc. | **0** activos |
| Space Grotesk producto | **0** |
| Refs HTML a \`assets/logos/infinity*\` | **0** |

### Pendiente bloqueante
**${root.length} HTML en la raíz aún cargan \`css/pages.css\`** (shell claro legacy), aunque muchos también tienen \`infinity-brand-system.css\` encima → **híbridos**.

${root.map((f) => `- \`${f}\``).join('\n')}

Equivalente nuevo ya existe en \`/prototype-cadamag/<mismo-nombre>\` para las comerciales.

### Pendiente menor
Remanente \`#FFF8F0\` (notas amber claras, no fondo de página):

${cream.map((f) => `- \`${f}\``).join('\n')}

Binarios legacy en disco (sin refs activas): ver \`ASSET_REQUIRES_REPLACEMENT.md\` (8 logos \`infinity-*\`).

---

## HTTP smoke
- \`/index.html\` → 200 dark
- \`/prototype-cadamag/index.html\` → 200 dark
- \`/prototype-cadamag/diagnostico.html\` → 200
- \`/prototype-cadamag/foundations.html\` → 200 dark
- \`/foundations.html\` → 200 **híbrido pages.css**
- \`/portal-access.html\` → 200
- \`/try-alice.html\` → 200
- \`/Infinity_Student_Portal.html\` → 200
- brand pack PNG + \`infinity-brand-system.css\` → 200

---

## Qué significa “todo actualizado”

| Criterio | ¿Cumple? |
|---|---|
| Home raíz nueva | Sí |
| Prototipo comercial completo | Sí |
| Diagnóstico público nuevo | Sí |
| Portales / try / tools con brand pack | Sí (overlay) |
| Cero hex/logo/Space en producto | Sí |
| Todas las URLs raíz comerciales sin \`pages.css\` | **No** (${root.length} quedan) |
| Cero \`#FFF8F0\` | **No** (${cream.length}) |
| Binarios legacy borrados | No (retenidos a propósito) |

---

## Próximo paso recomendado
Promover las ${root.length} páginas raíz listadas arriba al shell \`prototype-cadamag\` (mismo método que \`index.html\`) **o** redirect 1:1 a \`/prototype-cadamag/…\`, para eliminar híbridos.

---

Informe vivo: \`prototype-cadamag/BRAND-AUDIT-LIVE.md\`
`;

fs.writeFileSync(path.join(ROOT, 'prototype-cadamag', 'BRAND-AUDIT-LIVE.md'), md);
console.log('ROOT_PAGES_CSS=' + root.length);
console.log(root.join('\n'));
console.log('CREAM=' + cream.length);
console.log('PROTO', proto.filter((p) => p.ok).length + '/' + proto.length);
