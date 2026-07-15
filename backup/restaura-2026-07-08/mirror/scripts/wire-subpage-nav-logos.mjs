import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo =
  '<a href="index.html" class="nav-brand nav-brand-logo" aria-label="Infinity Studio CR home"><img src="assets/logos/infinity-studio-cr-nav.png" alt="Infinity Studio CR — Operational Communication Systems" class="nav-logo-page"></a>';
const re = /<a href="index\.html" class="nav-brand[^"]*"[^>]*>[\s\S]*?<\/a>/;

const files = [
  'foundations.html', 'ort.html', 'off-the-clock.html', 'job-finder.html', 'conversatorio.html',
  'portal-access.html', 'try-nexora.html', 'try-demo.html', 'try-alice.html', 'try-jill.html', 'hablemos.html'
];

for (const f of files) {
  const p = path.join(root, f);
  let html = fs.readFileSync(p, 'utf8');
  if (!re.test(html)) {
    console.log('skip', f);
    continue;
  }
  fs.writeFileSync(p, html.replace(re, logo));
  console.log('updated', f);
}
