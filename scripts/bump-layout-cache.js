const fs = require('fs');
const path = require('path');
const V = '20261004layout1';
const ROOT = path.resolve(__dirname, '..');

function bump(file) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) return false;
  let t = fs.readFileSync(fp, 'utf8');
  const before = t;
  t = t.replace(/brand\.css\?v=[^"']+/g, `brand.css?v=${V}`);
  t = t.replace(/page-shell\.css\?v=[^"']+/g, `page-shell.css?v=${V}`);
  t = t.replace(/prototype\.css\?v=[^"']+/g, `prototype.css?v=${V}`);
  t = t.replace(/responsive\.css\?v=[^"']+/g, `responsive.css?v=${V}`);
  t = t.replace(/section-know\.css\?v=[^"']+/g, `section-know.css?v=${V}`);
  t = t.replace(/section-routes\.css\?v=[^"']+/g, `section-routes.css?v=${V}`);
  t = t.replace(/section-eco\.css\?v=[^"']+/g, `section-eco.css?v=${V}`);
  t = t.replace(/section-results\.css\?v=[^"']+/g, `section-results.css?v=${V}`);
  t = t.replace(/site-nav\.css\?v=[^"']+/g, `site-nav.css?v=${V}`);
  t = t.replace(/diagnostic-tool\.css\?v=[^"']+/g, `diagnostic-tool.css?v=${V}`);
  if (t !== before) {
    fs.writeFileSync(fp, t);
    return true;
  }
  return false;
}

let n = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  if (bump(f)) n += 1;
}
const proto = path.join(ROOT, 'prototype-cadamag');
for (const f of fs.readdirSync(proto).filter((x) => x.endsWith('.html'))) {
  if (bump(path.join('prototype-cadamag', f))) n += 1;
}
console.log('bumped', n, 'files →', V);
