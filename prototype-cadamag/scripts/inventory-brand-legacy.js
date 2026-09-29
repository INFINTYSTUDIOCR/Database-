/**
 * Infinity Studio — full-repo brand inventory (excludes backup/, .git, node_modules)
 * Writes: prototype-cadamag/_inventory-raw.json + prototype-cadamag/_inventory.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_JSON = path.join(__dirname, '..', '_inventory-raw.json');
const OUT_MD = path.join(__dirname, '..', '_inventory.md');

const SKIP_DIRS = new Set([
  'backup', '.git', 'node_modules', '.cursor',
  'agent-transcripts', 'AgentStores'
]);

const EXTS = new Set([
  '.html', '.css', '.js', '.json', '.webmanifest', '.xml',
  '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico'
]);

const TEXT_EXTS = new Set([
  '.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.svg'
]);

function walk(dir, out = []) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function collectMatches(re, text, max = 8) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) && out.length < max) out.push(m[0]);
  return uniq(out);
}

function isKamukOrGosp(rel) {
  return /(^|\/)kamuk(\/|$)/i.test(rel) || /(^|\/)gospanol(\/|$)/i.test(rel);
}

function hasBrandPackFavicon(text) {
  return /assets\/brand\/(favicon|svg\/favicon)/.test(text)
    || /prototype-cadamag\/assets\/brand\//.test(text)
    || /public\/brand\//.test(text);
}

const files = walk(ROOT);
const rows = [];
let audited = 0;

const COLOR_RE = /#5B21B6|#7C3AED|#3B0E8C|#EDE9FE|#F8F8FF|#5b21b6|#7c3aed|#3b0e8c|#ede9fe|#f8f8ff/g;
const FONT_RE = /Space Grotesk|Space\+Grotesk/g;
const LOGO_RE = /assets\/logos\/infinity[^"'\\s)]*|infinity-studio-cr[^"'\\s)]*|infinity-engine\\.png|training-book\\.png/gi;

for (const f of files) {
  audited++;
  const ext = path.extname(f).toLowerCase();
  const rel = path.relative(ROOT, f).split(path.sep).join('/');

  if (!TEXT_EXTS.has(ext)) {
    const n = path.basename(f).toLowerCase();
    if (
      /infinity-studio-cr|infinity-engine|infinity-logo|og-|social|share|apple-touch/.test(n)
      || /assets\/logos\//.test(rel)
    ) {
      rows.push({
        file: rel,
        type: ext.slice(1) || 'bin',
        legacy: ['asset_path_or_filename'],
        action: 'inspect; replace active refs; keep file until unused'
      });
    }
    continue;
  }

  let t;
  try {
    t = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  if (t.length > 12_000_000) continue;

  const hits = [];
  const colors = collectMatches(COLOR_RE, t);
  if (colors.length) hits.push('legacy_hex:' + colors.join(','));

  if (FONT_RE.test(t)) {
    FONT_RE.lastIndex = 0;
    hits.push('Space_Grotesk');
  }

  const logos = collectMatches(LOGO_RE, t);
  if (logos.length) hits.push('logo_refs:' + logos.join('|'));

  if (/assets\/logos\//i.test(t) && /infinity/i.test(t)) {
    hits.push('assets_logos_infinity');
  }

  if (/og:image/i.test(t)) hits.push('og:image');
  if (/twitter:image/i.test(t)) hits.push('twitter:image');

  if (/apple-touch-icon/i.test(t) && !hasBrandPackFavicon(t)) {
    hits.push('apple-touch_non_brandpack');
  }
  if (/rel=["']icon/i.test(t) && !hasBrandPackFavicon(t)) {
    hits.push('favicon_non_brandpack');
  }

  if (/theme-color/i.test(t) && !/#080B0F|#7B4DFF/i.test(t)) {
    hits.push('theme-color_legacy');
  }

  if (/font-family:\s*['"]?Segoe UI/i.test(t) && /Infinity|infinity/i.test(rel + t.slice(0, 2000))) {
    hits.push('Segoe_UI_branding');
  }

  // Skip pure Kamuk/GOSpanol unless Infinity chrome markers
  if (isKamukOrGosp(rel)) {
    const infinityChrome = /Infinity Studio|studioinfinity|prototype-cadamag\/assets\/brand|assets\/brand\/png\/infinity/i.test(t);
    const relevant = hits.filter((h) =>
      /legacy_hex|Space_Grotesk|logo_refs|assets_logos_infinity|favicon|apple-touch|og:image|theme-color/i.test(h)
    );
    if (!infinityChrome && !relevant.some((h) => /logo_refs|assets_logos_infinity|legacy_hex|Space_Grotesk/i.test(h))) {
      continue;
    }
  }

  if (!hits.length) continue;

  let action = 'migrate_visual';
  if (rel.startsWith('prototype-cadamag/') && hits.every((h) => h === 'og:image' || h === 'twitter:image')) {
    action = 'verify_og_assets';
  }
  if (hits.every((h) => h.startsWith('legacy_hex')) && /student-portal-v2|diagnostic-tool|brand\.css|brand-tokens/.test(rel)) {
    action = 'verify_remap_guards';
  }

  rows.push({ file: rel, type: ext.slice(1), legacy: hits, action });
}

rows.sort((a, b) => a.file.localeCompare(b.file));

const byHit = {};
for (const r of rows) {
  for (const h of r.legacy) {
    const k = h.split(':')[0];
    byHit[k] = (byHit[k] || 0) + 1;
  }
}

const htmlHits = rows.filter((r) => r.type === 'html');
const cssHits = rows.filter((r) => r.type === 'css');
const jsHits = rows.filter((r) => r.type === 'js');

const payload = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  audited,
  hitCount: rows.length,
  byHit,
  counts: {
    html: htmlHits.length,
    css: cssHits.length,
    js: jsHits.length,
    other: rows.length - htmlHits.length - cssHits.length - jsHits.length
  },
  rows
};

fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2));

const md = [
  '# Infinity Brand Inventory (pre-migration)',
  '',
  `- Generated: ${payload.generatedAt}`,
  `- Audited files: **${audited}**`,
  `- Files with legacy signals: **${rows.length}**`,
  '',
  '## Hit summary',
  '',
  ...Object.entries(byHit).map(([k, v]) => `- ${k}: ${v}`),
  '',
  '| ARCHIVO | TIPO | BRANDING LEGACY DETECTADO | ACCIÓN NECESARIA |',
  '|---|---|---|---|',
  ...rows.map((r) =>
    `| \`${r.file}\` | ${r.type} | ${r.legacy.join('; ').replace(/\|/g, '\\|')} | ${r.action} |`
  ),
  ''
].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log('AUDITED_FILES=' + audited);
console.log('HIT_ROWS=' + rows.length);
console.log('BY_HIT=' + JSON.stringify(byHit));
console.log('HTML=' + htmlHits.length + ' CSS=' + cssHits.length + ' JS=' + jsHits.length);
console.log('wrote', path.relative(ROOT, OUT_JSON));
console.log('wrote', path.relative(ROOT, OUT_MD));
