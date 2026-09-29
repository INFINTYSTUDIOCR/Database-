/**
 * Patch all prototype HTML + generators to official brand pack favicons/logos.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const FAVICON_BLOCK = `  <link rel="icon" href="assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="assets/brand/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/brand/favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" href="assets/brand/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/brand/favicon/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="assets/brand/favicon/icon-512.png">`;

const OLD_FAVICON_RE =
  /\s*<link rel="icon"[^>]*public\/brand\/favicon\.svg[^>]*>\s*<link rel="apple-touch-icon"[^>]*public\/brand\/apple-touch-icon\.png[^>]*>/g;

const OLD_FAVICON_SINGLE =
  /\s*<link rel="icon"[^>]*(?:public\/brand\/favicon\.svg|assets\/brand\/svg\/favicon\.svg)[^>]*>\s*(?:<link rel="alternate icon"[^>]*>\s*)?(?:<link rel="icon"[^>]*favicon-\d+x\d+\.png[^>]*>\s*)*(?:<link rel="apple-touch-icon"[^>]*>\s*)?(?:<link rel="icon"[^>]*icon-\d+\.png[^>]*>\s*)*/g;

function patchHtml(filePath) {
  let t = fs.readFileSync(filePath, 'utf8');
  const before = t;
  // Replace public/brand favicon pair
  if (t.includes('assets/brand/svg/favicon.svg') || t.includes('public/brand/apple-touch-icon')) {
    t = t.replace(OLD_FAVICON_RE, '\n' + FAVICON_BLOCK);
  }
  // Also catch if only one line remains
  if (t.includes('assets/brand/svg/favicon.svg')) {
    t = t.replace(
      /<link rel="icon"[^>]*public\/brand\/favicon\.svg[^>]*>\s*/g,
      FAVICON_BLOCK + '\n'
    );
    t = t.replace(/<link rel="apple-touch-icon"[^>]*public\/brand\/apple-touch-icon\.png[^>]*>\s*/g, '');
  }
  // Replace any remaining infinity-mark references
  t = t.replace(/public\/brand\/infinity-mark\.svg/g, 'assets/brand/png/infinity-symbol.png');
  t = t.replace(/public\/brand\/favicon\.svg/g, 'assets/brand/svg/favicon.svg');
  t = t.replace(/public\/brand\/apple-touch-icon\.png/g, 'assets/brand/favicon/apple-touch-icon.png');

  if (t !== before) {
    fs.writeFileSync(filePath, t);
    return true;
  }
  return false;
}

function patchGenerator(filePath) {
  let t = fs.readFileSync(filePath, 'utf8');
  const before = t;
  const oldPair = `  <link rel="icon" href="assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/brand/favicon/apple-touch-icon.png">`;
  if (t.includes(oldPair)) {
    t = t.replace(oldPair, FAVICON_BLOCK);
  }
  t = t.replace(/public\/brand\/favicon\.svg/g, 'assets/brand/svg/favicon.svg');
  t = t.replace(/public\/brand\/apple-touch-icon\.png/g, 'assets/brand/favicon/apple-touch-icon.png');
  t = t.replace(/public\/brand\/infinity-mark\.svg/g, 'assets/brand/png/infinity-symbol.png');
  if (t !== before) {
    fs.writeFileSync(filePath, t);
    return true;
  }
  return false;
}

const changed = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'Infinity_Studio_Brand_Assets_Cursor') continue;
      walk(p);
    } else if (name.endsWith('.html')) {
      if (patchHtml(p)) changed.push(path.relative(root, p));
    } else if (name.endsWith('.js') && dir.endsWith('scripts')) {
      if (patchGenerator(p)) changed.push(path.relative(root, p));
    }
  }
}

walk(root);

// Validate remaining legacy refs
const leftover = [];
function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'Infinity_Studio_Brand_Assets_Cursor' || name === 'public') continue;
      scan(p);
    } else if (/\.(html|js|css)$/.test(name)) {
      const t = fs.readFileSync(p, 'utf8');
      if (/public\/brand\//.test(t) || /infinity-mark\.svg/.test(t)) {
        leftover.push(path.relative(root, p));
      }
    }
  }
}
scan(root);

console.log('CHANGED', changed.length);
changed.forEach((c) => console.log(' -', c));
console.log('LEFTOVER_PUBLIC_BRAND', leftover.length);
leftover.forEach((c) => console.log(' !', c));
