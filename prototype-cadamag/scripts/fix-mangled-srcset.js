const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir, out = []) {
  const SKIP = new Set(['backup', '.git', 'node_modules', 'kamuk', '.cursor']);
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|css|js)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const broken = [];
const fixed = [];

for (const f of walk(ROOT)) {
  let t = fs.readFileSync(f, 'utf8');
  if (!/pngssets\/logos|light\.pngssets|symbol\.pngssets|brand\/png\/[^\s"]+assets\/logos/i.test(t)
    && !/infinity-studio-cr-nav@2x/i.test(t)
    && !/srcset="[^"]*assets\/logos\/infinity/i.test(t)) {
    continue;
  }
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  broken.push(rel);
  const before = t;

  // Fix mangled srcset concatenations
  t = t.replace(
    /srcset="prototype-cadamag\/assets\/brand\/png\/infinity-logo-horizontal-light\.pngssets\/logos\/infinity-studio-cr-nav@2x\.png[^"]*"/gi,
    'srcset="prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png 1x, prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png 2x"'
  );
  t = t.replace(
    /srcset="prototype-cadamag\/assets\/brand\/png\/infinity-symbol\.pngssets\/logos\/infinity-logo\.png[^"]*"/gi,
    'srcset="prototype-cadamag/assets/brand/png/infinity-symbol.png 1x, prototype-cadamag/assets/brand/png/infinity-symbol.png 2x"'
  );
  // Generic mangled pattern: brandPath + "ssets/logos/..."
  t = t.replace(
    /(srcset="[^"]*?prototype-cadamag\/assets\/brand\/png\/[^"\s]+)\.pngssets\/logos\/[^"]+"/gi,
    '$1.png 1x, $1.png 2x"'
  );
  // Any remaining infinity legacy in srcset → brand light logo
  t = t.replace(
    /srcset="[^"]*assets\/logos\/infinity[^"]*"/gi,
    'srcset="prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png 1x, prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png 2x"'
  );

  if (t !== before) {
    fs.writeFileSync(f, t);
    fixed.push(rel);
  }
}

console.log('BROKEN_CANDIDATES=' + broken.length);
console.log(broken.join('\n'));
console.log('FIXED=' + fixed.length);
console.log(fixed.join('\n'));

// Spot-check index nav img
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = idx.match(/class="nav-logo"[^>]*>|<img[^>]*class="nav-logo"[^>]*>/);
const nav = idx.match(/<img[^>]*class="nav-logo"[^>]*>/);
console.log('NAV_IMG=' + (nav ? nav[0].slice(0, 220) : 'none'));
