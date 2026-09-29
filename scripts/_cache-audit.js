const fs = require('fs');
const path = require('path');
const root = '.';
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html') && !/\.legacy/i.test(f));
const versions = {};
for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of t.matchAll(/(motion\.(?:css|js)|page-shell\.css|prototype\.css|brand\.css)\?v=([^"'&\s]+)/g)) {
    const key = m[1];
    versions[key] = versions[key] || {};
    versions[key][m[2]] = (versions[key][m[2]] || 0) + 1;
  }
}
console.log(JSON.stringify(versions, null, 2));

// foundations canonical + diag link sanity
const f = fs.readFileSync('foundations.html', 'utf8');
console.log('foundations canon', (f.match(/rel=["']canonical["']/gi) || []).length);
console.log('foundations diag', [...f.matchAll(/href=["']([^"']*diagnostico[^"']*)["']/gi)].map((x) => x[1]));
console.log('index diag', [...fs.readFileSync('index.html','utf8').matchAll(/href=["']([^"']*diagnostico[^"']*)["']/gi)].map((x)=>x[1]));
