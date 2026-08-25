/**
 * Publish Kamuk portal + engine under studioinfinitycr.com/kamuk/
 *
 * Infinity (Database-clone) is MASTER.
 * Flow: irrigate Infinity-owned files → ./kamuk/ (hosted twin), then prep
 * cache-bust + site URLs. Optionally mirror ./kamuk/ → Operarive (legacy
 * client only). NEVER copies Operarive → Infinity / kamuk as source of truth.
 *
 * Usage:
 *   node scripts/publish-kamuk-to-site.mjs
 *   node scripts/publish-kamuk-to-site.mjs --no-mirror
 *   node scripts/publish-kamuk-to-site.mjs --mirror
 *
 * Default: mirror to Operarive when that folder exists (skip with --no-mirror).
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  existsSync,
  readdirSync,
  statSync
} from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INF_ROOT = join(__dirname, '..');
const DEST = join(INF_ROOT, 'kamuk');
const OPER_ROOT =
  process.env.KAMUK_MIRROR ||
  'C:/Users/ARMANDO/Projects/Operarive-Training-Database';
const SITE = 'https://studioinfinitycr.com';

const argv = new Set(process.argv.slice(2));
const wantMirror = argv.has('--mirror')
  ? true
  : argv.has('--no-mirror')
    ? false
    : existsSync(OPER_ROOT);

// Shared Infinity trees overlaid into the Kamuk twin (kamuk-only files stay).
const IRRIGATION_DIRS = ['js', 'css', 'games', 'training-book'];
// Extra HTML pages that live next to the portal (CRM desk + supervisor).
const EXTRA_HTML = [
  'kamuk-holdings-crm.html',
  'kamuk-holdings-supervisor.html'
];
const PREP_HTML = [
  'index.html',
  'Kamuk_Engine.html',
  'nexora.html',
  ...EXTRA_HTML
];
// Bumped on publish so returning students never keep a cached Companion Hub bundle.
const CASINO_FLOOR_V = '20260814refresh';
const SIM_V = '20260825sched';
const CRM_V = '20260825nxlive';
const RECURSOS_V = '20260818fmtE';
const SCHED_V = '20260825sched';

if (!existsSync(DEST)) {
  throw new Error('Missing Kamuk twin folder (Infinity master): ' + DEST);
}

function walkFiles(root) {
  const out = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(full);
    }
  }
  if (existsSync(root)) walk(root);
  return out;
}

/**
 * Overlay Infinity → kamuk for shared trees.
 * Updates paths already in the twin and adds new Infinity-only files.
 * Never deletes kamuk-only files (no Infinity counterpart).
 */
function irrigateDir(relDir) {
  const src = join(INF_ROOT, relDir);
  const dst = join(DEST, relDir);
  if (!existsSync(src)) {
    console.log('skip irrigate (no Infinity source):', relDir);
    return 0;
  }
  mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const file of walkFiles(dst)) {
    const rel = relative(dst, file);
    const master = join(src, rel);
    if (!existsSync(master)) continue;
    cpSync(master, file);
    n++;
  }
  // Add new master files that do not exist yet in the twin.
  for (const file of walkFiles(src)) {
    const rel = relative(src, file);
    const twin = join(dst, rel);
    if (existsSync(twin)) continue;
    mkdirSync(dirname(twin), { recursive: true });
    cpSync(file, twin);
    n++;
  }
  return n;
}

function prep(html, kind) {
  html = html.replace(
    /https:\/\/kamukschool\.github\.io\/Operarive-Training-Database\/Kamuk_Student_Portal\.html/g,
    SITE + '/kamuk/'
  );
  html = html.replace(
    /https:\/\/kamukschool\.github\.io\/Operarive-Training-Database\//g,
    SITE + '/kamuk/'
  );
  html = html.replace(
    /(src="js\/infinity-casino-floor\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + CASINO_FLOOR_V + '"'
  );
  html = html.replace(
    /(src="js\/(?:simulation-(?:onboarding|access|supervisor|crm-bridge|formato-e)|infinity-holdings-config|infinity-holdings-nexora-live|infinity-scheduler)\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + SIM_V + '"'
  );
  html = html.replace(
    /(href="css\/infinity-scheduler\.css)(\?v=[^"]*)?"/g,
    '$1?v=' + SCHED_V + '"'
  );
  html = html.replace(
    /(src="js\/kamuk-holdings-crm\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + CRM_V + '"'
  );
  html = html.replace(
    /(src="js\/kamuk-holdings-call\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + CRM_V + '"'
  );
  html = html.replace(
    /(src="js\/kamuk-desk-english\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + CRM_V + '"'
  );
  html = html.replace(
    /(src="js\/kamuk-recursos-library\.js)(\?v=[^"]*)?"/g,
    '$1?v=' + RECURSOS_V + '"'
  );
  if (kind === 'engine' || kind === 'Kamuk_Engine.html') {
    html = html.replace(
      /var STUDENT_PORTAL_URL = '[^']*'/,
      "var STUDENT_PORTAL_URL = '" + SITE + "/kamuk/'"
    );
  }
  return html;
}

console.log('Master: Infinity', INF_ROOT);
console.log('Twin:  ', DEST);
console.log(
  'Direction: Infinity → kamuk' +
    (wantMirror ? ' → Operarive (mirror)' : ' (no Operarive mirror)')
);

let irrigated = 0;
for (const dir of IRRIGATION_DIRS) {
  const n = irrigateDir(dir);
  irrigated += n;
  console.log('irrigated', dir + ':', n, 'files');
}

for (const name of PREP_HTML) {
  const htmlPath = join(DEST, name);
  if (!existsSync(htmlPath)) {
    throw new Error('Missing Kamuk page (edit under Infinity/kamuk): ' + htmlPath);
  }
  const kind =
    name === 'Kamuk_Engine.html' ? 'engine' : name === 'index.html' ? 'portal' : name;
  writeFileSync(htmlPath, prep(readFileSync(htmlPath, 'utf8'), kind));
}

const portal = readFileSync(join(DEST, 'index.html'), 'utf8');
const engine = readFileSync(join(DEST, 'Kamuk_Engine.html'), 'utf8');
const nexora = readFileSync(join(DEST, 'nexora.html'), 'utf8');

writeFileSync(
  join(DEST, 'README.md'),
  [
    '# Kamuk — hosted on studioinfinitycr.com',
    '',
    '- Student portal: ' + SITE + '/kamuk/',
    '- Engine: ' + SITE + '/kamuk/Kamuk_Engine.html',
    '- Simulation CRM: ' + SITE + '/kamuk/kamuk-holdings-crm.html',
    '- Official login gate: ' + SITE + '/portal-access.html',
    '',
    '**Infinity is master.** Edit under Database-clone (Infinity root + `kamuk/` twin),',
    'then run `node scripts/publish-kamuk-to-site.mjs`.',
    'Optional legacy mirror: copies this twin → Operarive-Training-Database (never the reverse).',
    'Data stays in kamuk_* Supabase (never infinity_*).',
    ''
  ].join('\n')
);

if (wantMirror) {
  if (!existsSync(OPER_ROOT)) {
    console.warn('Mirror skipped — Operarive not found at', OPER_ROOT);
  } else {
    const mirrorDirs = ['js', 'css', 'games', 'data', 'training-book'];
    for (const dir of mirrorDirs) {
      const src = join(DEST, dir);
      if (!existsSync(src)) continue;
      const dst = join(OPER_ROOT, dir);
      mkdirSync(dst, { recursive: true });
      cpSync(src, dst, { recursive: true });
    }
    for (const name of [
      'index.html',
      'Kamuk_Engine.html',
      'nexora.html',
      'manifest.webmanifest',
      ...EXTRA_HTML
    ]) {
      const src = join(DEST, name);
      if (existsSync(src)) cpSync(src, join(OPER_ROOT, name));
    }
    if (existsSync(join(DEST, 'index.html'))) {
      cpSync(join(DEST, 'index.html'), join(OPER_ROOT, 'Kamuk_Student_Portal.html'));
    }
    console.log('Mirrored kamuk twin → Operarive (client only):', OPER_ROOT);
  }
}

console.log('Published', DEST);
console.log('portal bytes', portal.length, 'engine bytes', engine.length);
console.log('irrigated files', irrigated);
console.log('extra html', EXTRA_HTML.join(', '));

const checks = [
  ['casino floor script published', existsSync(join(DEST, 'js/infinity-casino-floor.js'))],
  ['arcade run script published', existsSync(join(DEST, 'games/_shared/infinity-arcade-run.js'))],
  ['portal loads casino floor', portal.includes('js/infinity-casino-floor.js?v=' + CASINO_FLOOR_V)],
  ['portal opens Companion Hub', portal.includes('Abrir Companion Hub')],
  ['no arcade cabinet entry', !portal.includes('Abrir Infinity Arcade')],
  ['Nexora published', existsSync(join(DEST, 'nexora.html'))],
  ['Nexora keeps local TTS helper', nexora.includes('src="js/tts-chunks.js')],
  ['Nexora keeps local PTT helper', nexora.includes('src="js/ptt-mic.js')],
  ['Nexora uses Kamuk Supabase', nexora.includes('lbspgbeqtcnjrbhiuucu.supabase.co')],
  ['Nexora excludes Infinity Supabase', !nexora.includes('rxruvpfdpgowmpvydacd.supabase.co')],
  ['Nexora excludes Infinity student table', !nexora.includes('infinity_students')],
  ['simulation onboarding published', existsSync(join(DEST, 'js/simulation-onboarding.js'))],
  ['simulation crm bridge published', existsSync(join(DEST, 'js/simulation-crm-bridge.js'))],
  ['simulation formato e published', existsSync(join(DEST, 'js/simulation-formato-e.js'))],
  ['infinity holdings config published', existsSync(join(DEST, 'js/infinity-holdings-config.js'))],
  ['legal pack published', existsSync(join(DEST, 'data/infinity-holdings-pack-legal-v1.json'))],
  ['medical pack published', existsSync(join(DEST, 'data/infinity-holdings-pack-medical-v1.json'))],
  ['simulation access published', existsSync(join(DEST, 'js/simulation-access.js'))],
  ['CRM page published', existsSync(join(DEST, 'kamuk-holdings-crm.html'))],
  ['CRM pack published', existsSync(join(DEST, 'data/kamuk-holdings-crm-pack-v1.json'))],
  ['CRM css published', existsSync(join(DEST, 'css/kamuk-holdings-crm.css'))],
  ['portal loads simulation onboarding', portal.includes('js/simulation-onboarding.js?v=' + SIM_V)],
  ['portal loads simulation crm bridge', portal.includes('js/simulation-crm-bridge.js?v=' + SIM_V)],
  ['portal loads simulation formato e', portal.includes('js/simulation-formato-e.js?v=' + SIM_V)],
  ['portal loads recursos library', portal.includes('js/kamuk-recursos-library.js?v=' + RECURSOS_V)],
  ['iOS login form submit', portal.includes('id="login-form"') && portal.includes('autocapitalize="none"')],
  ['kamuk PWA manifest', portal.includes('href="manifest.webmanifest"')],
  ['no endless glossary wall', !portal.includes("['Aun cuando','Even when")],
  ['matching dropdowns', readFileSync(join(DEST, 'js/simulation-onboarding.js'), 'utf8').includes('Elegí el propósito')],
  ['portal mounts simulation for every student', portal.includes('mountKamukSimulation')],
  ['CRM practice cache-bust', existsSync(join(DEST, 'js/kamuk-holdings-crm.js'))],
  ['CRM 10 practice cases', readFileSync(join(DEST, 'js/kamuk-holdings-crm.js'), 'utf8').includes("id: 'gp10'")],
  ['CRM Formato E send gate', readFileSync(join(DEST, 'js/kamuk-holdings-crm.js'), 'utf8').includes('gradeFormatoE')],
  ['desk English grader published', existsSync(join(DEST, 'js/kamuk-desk-english.js'))],
  ['CRM call scripts published', existsSync(join(DEST, 'js/kamuk-holdings-call.js')) && readFileSync(join(DEST, 'js/kamuk-holdings-call.js'), 'utf8').includes('call/turn')],
  ['Nexora lab pre-July-27', readFileSync(join(DEST, 'nexora.html'), 'utf8').includes('Operational Simulation Lab') && !readFileSync(join(DEST, 'nexora.html'), 'utf8').includes('nexora-simulation-program')],
  ['Recursos Email + Phone', readFileSync(join(DEST, 'js/kamuk-recursos-library.js'), 'utf8').includes("id: 'email'") && readFileSync(join(DEST, 'js/kamuk-recursos-library.js'), 'utf8').includes("id: 'phone'")],
  ['mock Formato E step', readFileSync(join(DEST, 'js/simulation-onboarding.js'), 'utf8').includes("grade: 'formato-e'")],
  ['Auditoría Kamuk in Engine', engine.includes('Auditoría Kamuk') && engine.includes('robert.grego@kamuk.cr')],
  ['supervisor Q&A audit UI', readFileSync(join(DEST, 'js/simulation-supervisor.js'), 'utf8').includes('sim-audit-ask')],
  ['CRM red coach', readFileSync(join(DEST, 'css/kamuk-holdings-crm.css'), 'utf8').includes('desk-guide-look')],
  [
    'engine portal URL ok',
    engine.includes("STUDENT_PORTAL_URL = 'https://studioinfinitycr.com/kamuk/'")
  ]
];
for (const [label, ok] of checks) console.log((ok ? 'OK   ' : 'FAIL ') + label);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
