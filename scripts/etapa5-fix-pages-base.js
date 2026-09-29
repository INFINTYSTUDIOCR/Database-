const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const V = '20260929qa5';

let cleared = 0;
let bumped = 0;

for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  const fp = path.join(ROOT, f);
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(/data-pages-base="prototype-cadamag\/"/g, 'data-pages-base=""');
  t = t.replace(/site-nav\.js\?v=[^"']+/g, `site-nav.js?v=${V}`);
  t = t.replace(/site-footer\.js\?v=[^"']+/g, `site-footer.js?v=${V}`);
  if (t !== before) {
    fs.writeFileSync(fp, t);
    if (/data-pages-base=""/.test(t) && /data-pages-base="prototype-cadamag\//.test(before)) cleared += 1;
    bumped += 1;
  }
}

// Also bump in prototype sources that use relative nav
for (const f of fs.readdirSync(path.join(ROOT, 'prototype-cadamag')).filter((x) => x.endsWith('.html'))) {
  const fp = path.join(ROOT, 'prototype-cadamag', f);
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(/site-nav\.js\?v=[^"']+/g, `site-nav.js?v=${V}`);
  t = t.replace(/site-footer\.js\?v=[^"']+/g, `site-footer.js?v=${V}`);
  if (t !== before) {
    fs.writeFileSync(fp, t);
    bumped += 1;
  }
}

// promote scripts: empty pages-base going forward
for (const rel of [
  'prototype-cadamag/scripts/promote-root-pages.js',
  'prototype-cadamag/scripts/promote-root-index.js'
]) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) continue;
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(
    /data-pages-base="prototype-cadamag\/"/g,
    'data-pages-base=""'
  );
  if (t !== before) {
    fs.writeFileSync(fp, t);
    console.log('patched', rel);
  }
}

console.log({ cleared, bumped, V });
