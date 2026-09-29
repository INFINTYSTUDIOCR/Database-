const fs = require('fs');
const path = require('path');
const root = 'D:/Users/carlo/Desktop/Database-';
const files = [
  'foundations.html', 'ort.html', 'para-quien.html', 'job-finder.html',
  'conversatorio.html', 'off-the-clock.html', 'ingles-operacional-latinoamerica.html',
  'casos-de-exito.html', 'pricing.html', 'hablemos.html',
  'foundations-path.html', 'ort-path.html', 'advanced-path.html'
];
const out = {};
for (const f of files) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  const title = (t.match(/<title[^>]*>([^<]+)/i) || [])[1] || '';
  const descM = t.match(/name=["']description["']\s+content=["']([^"']+)/i)
    || t.match(/content=["']([^"']+)["']\s+name=["']description["']/i);
  const desc = descM ? descM[1] : '';
  const h1m = t.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1m ? h1m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const blocks = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(t)) && blocks.length < 8) {
    blocks.push({
      h: m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      p: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320)
    });
  }
  // prices
  const prices = [...t.matchAll(/₡[\d.]+(?:\s*\/\s*\w+)?/g)].map((x) => x[0]).slice(0, 12);
  out[f] = { title, desc, h1, blocks, prices };
}
fs.writeFileSync(
  path.join(root, 'prototype-cadamag/scripts/_content-extract.json'),
  JSON.stringify(out, null, 2)
);
console.log('wrote extract', Object.keys(out).length);
