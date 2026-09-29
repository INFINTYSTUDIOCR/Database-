const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function check(file) {
  const t = fs.readFileSync(file, 'utf8');
  return {
    f: path.relative(root, file).replace(/\\/g, '/'),
    canon: (t.match(/rel=["']canonical["']/gi) || []).length,
    badge: /prototype-badge/i.test(t),
    noindex: /noindex/i.test(t),
    oldDiag: /prototype-cadamag\/diagnostico\.html/i.test(t),
    newDiag: /href=["']diagnostico\.html["']/i.test(t),
    brandAssets: /prototype-cadamag\/css\/prototype\.css/.test(t) || /prototype-cadamag\/css\/diagnostic-tool/.test(t),
    siteUrls: /src=["']js\/site-urls\.js["']/.test(t) || /src=["']\.\.\/js\/site-urls/.test(t)
  };
}

const roots = ['diagnostico.html', 'index.html', 'foundations.html', 'pricing.html', 'hablemos.html'];
console.log('ROOT', roots.map((f) => check(path.join(root, f))));

// count remaining old diag links anywhere except backups
let oldHits = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/^(backup|node_modules|\.git)$/.test(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(html|js)$/i.test(ent.name)) {
      const t = fs.readFileSync(p, 'utf8');
      if (/prototype-cadamag\/diagnostico\.html/.test(t) && !/promote-root|fix-promoted|audit-|etapa4|_scan/.test(p)) {
        oldHits.push(path.relative(root, p).replace(/\\/g, '/'));
      }
    }
  }
}
walk(root);
console.log('oldDiagHits', oldHits.slice(0, 40), 'total', oldHits.length);

const d = fs.readFileSync(path.join(root, 'diagnostico.html'), 'utf8');
console.log('diag head sample:');
console.log(d.split('\n').slice(0, 40).join('\n'));
