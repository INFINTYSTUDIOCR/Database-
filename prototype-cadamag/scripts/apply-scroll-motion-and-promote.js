/**
 * 1) Bump motion cache on all prototype HTML
 * 2) Assign left/top scroll reveals on bare data-reveal
 * 3) Remap cream #FFF8F0 in active Infinity product surfaces
 * 4) Promote commercial pages to root
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const PROTO = path.join(ROOT, 'prototype-cadamag');
const V = '20260929scroll1';

function walkHtml(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.html') && !f.includes('test-alpha'))
    .map((f) => path.join(dir, f));
}

function bumpMotion(file) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(/motion\.(css|js)(\?v=[^"']*)?/g, `motion.$1?v=${V}`);
  if (!/motion\.js/i.test(html) && /motion\.css/i.test(html)) {
    html = html.replace(
      /(<\/head>)/i,
      `  <script src="js/motion.js?v=20260929scroll2" defer></script>\n$1`
    );
  }
  // Alternating left/top on bare section reveals
  let i = 0;
  html = html.replace(/\sdata-reveal(?:=["'](?:cinematic|soft)?["'])?/g, (m) => {
    if (/data-reveal=["'](left|right|top|up|down)["']/.test(m)) return m;
    if (/cinematic/.test(m)) {
      return ` data-reveal="top" data-delay="1"`;
    }
    if (/soft/.test(m)) {
      return ` data-reveal="left" data-delay="2"`;
    }
    const dir = i % 2 === 0 ? 'left' : 'top';
    const delay = (i % 4) + 1;
    i += 1;
    return ` data-reveal="${dir}" data-delay="${delay}"`;
  });
  if (html !== before) {
    fs.writeFileSync(file, html);
    console.log('motion+', path.basename(file));
  }
}

walkHtml(PROTO).forEach(bumpMotion);

// Cream remap — active Infinity only
const CREAM = /#FFF8F0/gi;
const CREAM_DARK = 'rgba(255,138,0,0.12)';
const remapTargets = [
  path.join(ROOT, 'css', 'pages.css'),
  path.join(ROOT, 'Infinity_Training_Book.html'),
  path.join(ROOT, 'Infinity_Training_Book (1).html'),
  path.join(ROOT, 'Infinity_Nexus_Engine.html'),
  path.join(ROOT, 'Infinity_Diagnostic_Tool (7).html'),
  path.join(PROTO, 'diagnostico.html')
];

remapTargets.forEach((f) => {
  if (!fs.existsSync(f)) return;
  let t = fs.readFileSync(f, 'utf8');
  if (!CREAM.test(t)) return;
  t = t.replace(CREAM, CREAM_DARK);
  // pages.css body light gradient → dark brand atmosphere
  if (f.endsWith('pages.css')) {
    t = t.replace(
      /background:#F6F0FF;background-image:radial-gradient\([^;]+;/,
      'background:#080B0F;background-image:radial-gradient(ellipse 90% 55% at 0% 0%,rgba(123,77,255,0.18),transparent 58%),radial-gradient(ellipse 75% 50% at 100% 8%,rgba(255,138,0,0.10),transparent 52%),linear-gradient(180deg,#080B0F 0%,#0E1219 50%,#080B0F 100%);'
    );
    t = t.replace(
      /\.page-hero\{padding:120px 2rem 64px;background:linear-gradient\([^;]+;/,
      '.page-hero{padding:120px 2rem 64px;background:linear-gradient(135deg,#0E1219 0%,rgba(123,77,255,0.22) 45%,#12161f 100%);'
    );
  }
  fs.writeFileSync(f, t);
  console.log('cream→dark', path.relative(ROOT, f));
});

// Promote commercial twins
execSync('node scripts/promote-root-pages.js', { cwd: PROTO, stdio: 'inherit' });
if (fs.existsSync(path.join(PROTO, 'scripts', 'promote-root-index.js'))) {
  execSync('node scripts/promote-root-index.js', { cwd: PROTO, stdio: 'inherit' });
}

console.log('OK');
