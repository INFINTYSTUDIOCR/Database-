import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const navImg =
  '<a href="index.html" aria-label="Infinity Studio CR home"><img src="assets/logos/infinity-studio-cr-nav.png" alt="Infinity Studio CR — Operational Communication Systems" class="nav-logo"></a>';
const heroImg =
  '<img src="assets/logos/infinity-studio-cr.png" alt="Infinity Studio CR — Operational Communication Systems" class="hero-logo">';
const footerImg =
  '<img src="assets/logos/infinity-studio-cr-nav.png" alt="Infinity Studio CR" class="footer-logo">';

html = html.replace(/<nav>\s*\n\s*(?:<a[^>]*>\s*)?<img src="data:image[^"]+"[^>]*>\s*(?:<\/a>\s*)?\n/, `<nav>\n  ${navImg}\n`);
html = html.replace(/<img src="data:image[^"]+" class="hero-logo"[^>]*>/, heroImg);
html = html.replace(/<img src="data:image[^"]+" class="footer-logo"[^>]*>/, footerImg);

fs.writeFileSync(file, html);
console.log('index.html logos → assets/logos/');
