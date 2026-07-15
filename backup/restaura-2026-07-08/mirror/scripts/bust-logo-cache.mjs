/**
 * Append cache-bust query to Infinity brand logo URLs in root HTML files.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const V = '?v=20260703';
const files = [
  ...readdirSync(root).filter((f) => f.endsWith('.html')),
];

const bases = [
  'infinity-studio-cr-nav.png',
  'infinity-studio-cr-nav@2x.png',
  'infinity-studio-cr-logo.png',
  'infinity-studio-cr.png',
  'infinity-logo.png',
  'icon-192.png',
  'icon-512.png',
];

for (const file of files) {
  const path = join(root, file);
  const original = readFileSync(path, 'utf8');
  let html = original;
  html = html.replace(/\?v=20260703\?v=20260702/g, V);
  html = html.replace(/\?v=20260702/g, V);
  for (const base of bases) {
    const busted = base + V;
    if (html.includes(base) && !html.includes(busted)) {
      html = html.split(base).join(busted);
    }
  }
  if (html !== original) {
    writeFileSync(path, html);
    console.log('Updated', file);
  }
}
