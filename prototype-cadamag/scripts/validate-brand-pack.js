const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'test-alpha.html');
const need = [
  'assets/brand/svg/favicon.svg',
  'assets/brand/favicon/favicon.ico',
  'assets/brand/favicon/favicon-16x16.png',
  'assets/brand/favicon/favicon-32x32.png',
  'assets/brand/favicon/apple-touch-icon.png',
  'assets/brand/favicon/icon-192.png',
  'assets/brand/favicon/icon-512.png'
];
const banned = ['public/brand/', 'infinity-mark.svg', 'infinity-studio-cr-nav.png'];
let fail = 0;
for (const p of pages) {
  const t = fs.readFileSync(path.join(dir, p), 'utf8');
  const miss = need.filter((n) => !t.includes(n));
  const bad = banned.filter((n) => t.includes(n));
  const ok = miss.length === 0 && bad.length === 0;
  if (!ok) fail++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + p + (miss.length ? ' MISS:' + miss.join(',') : '') + (bad.length ? ' BAD:' + bad.join(',') : ''));
}
const nav = fs.readFileSync(path.join(dir, 'js/site-nav.js'), 'utf8');
const foot = fs.readFileSync(path.join(dir, 'js/site-footer.js'), 'utf8');
console.log('NAV_LOGO', nav.includes('infinity-logo-horizontal-light.png') ? 'OK' : 'FAIL');
console.log('FOOTER_LOGO', foot.includes('infinity-logo-horizontal-light.png') ? 'OK' : 'FAIL');
console.log('NO_OLD_NAV', !nav.includes('public/brand') && !nav.includes('brand-word') ? 'OK' : 'CHECK');
console.log('FAILS', fail);
