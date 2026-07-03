/**
 * Append cache-bust query to Infinity brand logo URLs in root HTML files.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = '?v=20260702';
const files = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')),
];

const bases = [
  'infinity-studio-cr-nav.png',
  'infinity-studio-cr-logo.png',
  'infinity-studio-cr.png',
];

for (const file of files) {
  const path = join(root, file);
  let html = readFileSync(path, 'utf8');
  let changed = false;
  for (const base of bases) {
    const busted = base + V;
    if (html.includes(base) && !html.includes(busted)) {
      html = html.split(base).join(busted);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(path, html);
    console.log('Updated', file);
  }
}
