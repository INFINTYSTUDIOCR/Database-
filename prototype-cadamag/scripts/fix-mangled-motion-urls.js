/**
 * Fix mangled motion.=VERSION URLs (PowerShell ate $1 in replace).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const V = '20260929scroll2';

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'backup' || ent.name === '.git') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.html$/i.test(ent.name)) out.push(p);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  let t = fs.readFileSync(file, 'utf8');
  const before = t;
  t = t.replace(/motion\.=([0-9a-z]+)/gi, 'motion.css?v=$1');
  t = t.replace(/js\/motion\.css\?v=/gi, 'js/motion.js?v=');
  t = t.replace(
    /(<script[^>]+src="[^"]*\/)motion\.css(\?v=[^"]+")/gi,
    '$1motion.js$2'
  );
  t = t.replace(
    /(href="[^"]*\/)motion\.js(\?v=[^"]+")/gi,
    '$1motion.css$2'
  );
  t = t.replace(/motion\.(css|js)\?v=[^"'\s>]+/g, function (_, kind) {
    return 'motion.' + kind + '?v=' + V;
  });
  if (t !== before) {
    fs.writeFileSync(file, t);
    n += 1;
    console.log('fixed', path.relative(ROOT, file));
  }
}
console.log('files', n);
