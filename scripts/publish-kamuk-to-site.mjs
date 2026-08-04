/**
 * Publish Kamuk portal + engine under studioinfinitycr.com/kamuk/
 * so portal-access.html can log everyone in from the official site.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INF_ROOT = join(__dirname, '..');
const KAM_ROOT = 'C:/Users/ARMANDO/Projects/Operarive-Training-Database';
const DEST = join(INF_ROOT, 'kamuk');
const SITE = 'https://studioinfinitycr.com';

mkdirSync(DEST, { recursive: true });

function prep(html, kind) {
  // /kamuk/js/* would 404 — drop local override script tags (CDN remains above them)
  html = html.replace(/\n<script src="js\/[^"]+"><\/script>/g, '');
  html = html.replace(
    /https:\/\/kamukschool\.github\.io\/Operarive-Training-Database\/Kamuk_Student_Portal\.html/g,
    SITE + '/kamuk/'
  );
  html = html.replace(
    /https:\/\/kamukschool\.github\.io\/Operarive-Training-Database\//g,
    SITE + '/kamuk/'
  );
  if (kind === 'engine') {
    html = html.replace(
      /var STUDENT_PORTAL_URL = '[^']*'/,
      "var STUDENT_PORTAL_URL = '" + SITE + "/kamuk/'"
    );
  }
  return html;
}

const portal = prep(readFileSync(join(KAM_ROOT, 'index.html'), 'utf8'), 'portal');
writeFileSync(join(DEST, 'index.html'), portal);

const engine = prep(readFileSync(join(KAM_ROOT, 'Kamuk_Engine.html'), 'utf8'), 'engine');
writeFileSync(join(DEST, 'Kamuk_Engine.html'), engine);

writeFileSync(
  join(DEST, 'README.md'),
  [
    '# Kamuk — hosted on studioinfinitycr.com',
    '',
    '- Student portal: ' + SITE + '/kamuk/',
    '- Engine: ' + SITE + '/kamuk/Kamuk_Engine.html',
    '- Official login gate: ' + SITE + '/portal-access.html',
    '',
    'Data stays in kamuk_* Supabase (never infinity_*).',
    ''
  ].join('\n')
);

console.log('Published', DEST);
console.log('portal bytes', portal.length, 'engine bytes', engine.length);
console.log('local js leftover', (portal.match(/src="js\//g) || []).length);
console.log(
  'engine portal URL ok',
  engine.includes("STUDENT_PORTAL_URL = 'https://studioinfinitycr.com/kamuk/'")
);
