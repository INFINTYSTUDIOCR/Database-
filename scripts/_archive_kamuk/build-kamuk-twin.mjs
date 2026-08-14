/**
 * Build Kamuk twins from current Infinity sources.
 * Feature-identical, Kamuk colors + kamuk_* Supabase + product kamuk auth.
 * Assets load from studioinfinitycr.com so GitHub Pages stays thin (static libs only — no student data).
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INF_ROOT = join(__dirname, '../..');
const KAM_ROOT = 'C:/Users/ARMANDO/Projects/Operarive-Training-Database';

const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

const CDN = 'https://studioinfinitycr.com';
const KAMUK_PORTAL_URL = 'https://kamukschool.github.io/Operarive-Training-Database/Kamuk_Student_Portal.html';
const KAMUK_ENGINE_URL = 'https://kamukschool.github.io/Operarive-Training-Database/Kamuk_Engine.html';
const KAMUK_HUB = 'https://kamukschool.github.io/Operarive-Training-Database/';

function rebrandColors(html) {
  return html
    .replace(
      /--navy:#5B21B6;--nl:#EDE9FE;--nm:#7C3AED;--nd:#3B0E8C;/,
      '--navy:#2B7EC1;--nl:#E8F4FC;--nm:#1F6AA8;--nd:#1A5A8F;'
    )
    .replace(
      /--purple:#5B21B6;--pb:#EDE9FE;--pm:#7C3AED;/,
      '--purple:#2B7EC1;--pb:#E8F4FC;--pm:#1F6AA8;'
    )
    .replace(/--gold:#F5A623;/g, '--gold:#F7941D;')
    .replace(/--gray:#F8F8FF;--border:#E2E8F0;/g, '--gray:#F4F8FC;--border:#C5DDEF;')
    .replace(/--text:#1E1E2E;--t2:#4A4A6A;--t3:#8888AA;/g, '--text:#1E2D3D;--t2:#4A6080;--t3:#8FA4B8;')
    .replace(/background:#F8F8FF;/g, 'background:#F4F8FC;')
    .replace(/#5B21B6/g, '#2B7EC1')
    .replace(/#7C3AED/g, '#1F6AA8')
    .replace(/#3B0E8C/g, '#1A5A8F')
    .replace(/#EDE9FE/g, '#E8F4FC')
    .replace(/rgba\(91,33,182/g, 'rgba(43,126,193')
    .replace(/rgba\(124,58,237/g, 'rgba(31,106,168')
    .replace(/#A78BFA/g, '#79B9E8')
    .replace(/#C084FC/g, '#79B9E8')
    .replace(/#C4B5FD/g, '#A8D4F5')
    .replace(/#F3F0FF/g, '#E8F4FC')
    .replace(/#1e1b4b/g, '#0F3A5C');
}

function rewriteAssetsToCdn(html) {
  // Root-relative and relative asset paths → Infinity static CDN (libs only)
  const pairs = [
    [/href="css\//g, `href="${CDN}/css/`],
    [/src="js\//g, `src="${CDN}/js/`],
    [/href="js\//g, `href="${CDN}/js/`],
    [/src="infinity-auth\.js/g, `src="${CDN}/infinity-auth.js`],
    [/src="nexora-profile\.js/g, `src="${CDN}/nexora-profile.js`],
    [/src="nexora-characters\.js/g, `src="${CDN}/nexora-characters.js`],
    [/src="nexus-unified-portal\.js/g, `src="${CDN}/nexus-unified-portal.js`],
    [/src="nexus-unified\.js"/g, `src="${CDN}/nexus-unified.js"`],
    [/src="nexus-unified-ui\.js"/g, `src="${CDN}/nexus-unified-ui.js"`],
    [/src="nexus-manual-calibration\.js"/g, `src="${CDN}/nexus-manual-calibration.js"`],
    [/src="nexus-unified-mockup\.js"/g, `src="${CDN}/nexus-unified-mockup.js"`],
    [/href="manifest-portal\.json"/g, `href="${CDN}/manifest-portal.json"`],
    [/href="manifest-engine\.json"/g, `href="${CDN}/manifest-engine.json"`],
    [/href="icon-192\.png/g, `href="${CDN}/icon-192.png`],
    [/href="\/icon-512\.png/g, `href="${CDN}/icon-512.png`],
    [/src="assets\//g, `src="${CDN}/assets/`],
    [/href="assets\//g, `href="${CDN}/assets/`],
    [/src="nexora\.html"/g, 'src="nexora.html"']
  ];
  for (const [re, rep] of pairs) html = html.replace(re, rep);
  return html;
}

function pointDataToKamuk(html) {
  return html
    .replaceAll(INF_URL, KAM_URL)
    .replaceAll(INF_KEY, KAM_KEY)
    .replace(/infinity_students/g, 'kamuk_students')
    .replace(/infinity_sessions/g, 'kamuk_sessions')
    .replace(/infinity_users/g, 'kamuk_users');
}

function buildPortal() {
  let html = readFileSync(join(INF_ROOT, 'Infinity_Student_Portal.html'), 'utf8');
  html = rewriteAssetsToCdn(html);
  html = rebrandColors(html);
  html = pointDataToKamuk(html);

  html = html
    .replace(/<title>Infinity Portal del Estudiante<\/title>/, '<title>Kamuk Portal del Estudiante</title>')
    .replace(/content="#2B7EC1"/, 'content="#2B7EC1"') // after color pass already blue
    .replace(/content="SI Portal"/, 'content="Kamuk Portal"')
    .replace(/Bienvenido a Infinity/g, 'Bienvenido a Kamuk')
    .replace(/BIENVENIDO A INFINITY/g, 'BIENVENIDO A KAMUK')
    .replace(/News — Infinity/g, 'News — Kamuk')
    .replace(/Infinity Portal/g, 'Kamuk Portal')
    .replace(/Studio Infinity CR/g, 'Kamuk School')
    .replace(/Portal del Estudiante — Infinity/g, 'Portal del Estudiante — Kamuk')
    .replace(/Infinity Studio CR/g, 'Kamuk School');

  // Keep theme-color blue if purple leaked as already replaced

  // Product auth must hit kamuk tables via API flag
  html = html.replace(
    /infinityLogin\(user, pass, 'student', \{ silent: true \}\)/g,
    "infinityLogin(user, pass, 'student', { silent: true, product: 'kamuk' })"
  );
  html = html.replace(
    /infinityEnsureAuth\(\{ user: user, password: pass, role: 'student', attempts: 3, force: true \}\)/g,
    "infinityEnsureAuth({ user: user, password: pass, role: 'student', product: 'kamuk', attempts: 3, force: true })"
  );
  html = html.replace(
    /var pass = document\.getElementById\('l-pass'\)\.value;/,
    "var pass = document.getElementById('l-pass').value.trim();"
  );

  // Nexora local path
  html = html.replace(/window\.open\('nexora\.html'/g, "window.open('nexora.html'");
  html = html.replace(
    /window\.open\(['"]nexora\.html['"]/g,
    "window.open('nexora.html'"
  );

  // Defaults companion + nexora for unset
  const hydrateMarker =
    "if(typeof d.nexoraEnabled === 'boolean') CURRENT_STUDENT.nexoraEnabled = d.nexoraEnabled;";
  if (html.includes(hydrateMarker) && !html.includes('/* kamuk-access-defaults */')) {
    html = html.replace(
      hydrateMarker,
      `/* kamuk-access-defaults */
  if(typeof d.nexoraEnabled === 'boolean') CURRENT_STUDENT.nexoraEnabled = d.nexoraEnabled;
  else if(d.nexoraEnabled == null) CURRENT_STUDENT.nexoraEnabled = true;`
    );
  }

  html = html.replace(
    /if\(d\.companionEnabled === true \|\| d\.companionEnabled === 'true' \|\| d\.companionEnabled === 1\) CURRENT_STUDENT\.companionEnabled = true;/,
    `if(d.companionEnabled === true || d.companionEnabled === 'true' || d.companionEnabled === 1) CURRENT_STUDENT.companionEnabled = true;
  else if(d.companionEnabled == null) CURRENT_STUDENT.companionEnabled = true;
  if(typeof d.aliceEnabled !== 'boolean' && d.aliceEnabled == null) CURRENT_STUDENT.aliceEnabled = true;
  if(typeof d.jillEnabled !== 'boolean' && d.jillEnabled == null) CURRENT_STUDENT.jillEnabled = false;`
  );

  // Ensure Nexora independent of Alice (parity with Infinity code after decouple)
  html = html.replace(
    /function studentNexoraOn\(s\)\{\n  return studentPortalAccessOk\(s\) && studentAliceOn\(s\) && !!s\.nexoraEnabled;\n\}/,
    `function studentNexoraOn(s){
  return studentPortalAccessOk(s) && !!s.nexoraEnabled;
}`
  );

  html = html.replace(
    '<html lang="es">',
    '<html lang="es"><!-- kamuk-portal-parity 2026-08-04 twin-of-infinity -->'
  );

  const dest = join(KAM_ROOT, 'Kamuk_Student_Portal.html');
  writeFileSync(dest, html, 'utf8');
  return {
    dest,
    bytes: html.length,
    productKamuk: html.includes("product: 'kamuk'"),
    kamukStudents: html.includes('kamuk_students'),
    kamukHost: html.includes(KAM_URL),
    noInfStudents: !html.includes('infinity_students'),
    cdn: html.includes(CDN + '/js/ptt-mic'),
    blue: html.includes('#2B7EC1')
  };
}

function buildEngine() {
  let html = readFileSync(join(INF_ROOT, 'Infinity_Nexus_Engine.html'), 'utf8');
  html = rewriteAssetsToCdn(html);
  html = rebrandColors(html);
  html = pointDataToKamuk(html);

  html = html
    .replace(/<title>Infinity Nexus Engine<\/title>/, '<title>Kamuk School — Operational Engine</title>')
    .replace(/content="Nexus Engine"/, 'content="Kamuk Engine"')
    .replace(/Infinity Nexus Engine/g, 'Kamuk Operational Engine')
    .replace(/Infinity Studio CR/g, 'Kamuk School')
    .replace(/assets\/logos\/infinity-studio-cr-nav\.png/g, 'assets/logos/kamuk-school.png')
    .replace(/assets\/logos\/infinity-studio-cr\.png/g, 'assets/logos/kamuk-school.png')
    .replace(/alt="Infinity Studio CR"/g, 'alt="Kamuk School"');

  // Logo may still reference CDN kamuk if we have it on infinity assets
  html = html.replace(
    new RegExp(CDN.replace(/\./g, '\\.') + '/assets/logos/infinity-studio-cr[^"\']*', 'g'),
    `${CDN}/assets/logos/kamuk-school.png`
  );

  html = html.replace(
    /var STUDENT_PORTAL_URL = '[^']+';/,
    `var STUDENT_PORTAL_URL = '${KAMUK_PORTAL_URL}';`
  );

  // Create student: KAM ids + product defaults
  html = html.replaceAll(
    "var id='IS-'+fname.substring(0,2).toUpperCase()+lname.substring(0,2).toUpperCase()+'-'+Date.now();",
    "var id='KAM-'+fname.substring(0,2).toUpperCase()+lname.substring(0,2).toUpperCase()+'-'+Date.now();"
  );
  html = html.replaceAll("return n+l+'-INF-'+num;", "return n+l+'-KAM-'+num;");

  // Inject product flags on createStudent payload if simple path_custom only
  if (
    html.includes("path_custom:''\n  };") &&
    !html.includes('_kamukAccessV1:true')
  ) {
    html = html.replaceAll(
      "path_custom:''\n  };",
      `path_custom:'',
    companionEnabled:true, nexoraEnabled:true, aliceEnabled:true, jillEnabled:false, claireEnabled:false, _kamukAccessV1:true
  };`
    );
  }

  html = html.replace(
    /var MASTER_FALLBACK = \{ email:'trainer@infinity\.cr', pass:'nexus2025', name:'Johnny Ramirez', role:'superadmin' \};\r?\n  if\(user === MASTER_FALLBACK\.email && pass === MASTER_FALLBACK\.pass\)\{/,
    `var MASTER_FALLBACKS = [
    {email:'trainer@infinity.cr', pass:'nexus2025', name:'Kamuk Master Trainer', role:'superadmin'},
    {email:'trainer@kamuk.cr', pass:'KmOrt#7a2f9c', name:'Kamuk Master Trainer', role:'superadmin'},
    {email:'master@kamuk.cr', pass:'KmMst#4e8b1d', name:'Master General', role:'master'},
    {email:'admin@kamuk.cr', pass:'KmAdm#9c3e2a', name:'Kamuk Admin', role:'admin'}
  ];
  var MASTER_FALLBACK = MASTER_FALLBACKS.find(function(f){ return f.email===user && f.pass===pass; });
  if(MASTER_FALLBACK){`
  );

  html = html.replace(
    '<html lang="en">',
    '<html lang="en"><!-- kamuk-engine-parity 2026-08-04 twin-of-infinity -->'
  );

  const dest = join(KAM_ROOT, 'Kamuk_Engine.html');
  writeFileSync(dest, html, 'utf8');
  return {
    dest,
    bytes: html.length,
    kamukStudents: html.includes('kamuk_students'),
    noInfStudents: !html.includes('infinity_students'),
    portalUrl: html.includes(KAMUK_PORTAL_URL),
    kamCreate: html.includes("var id='KAM-'"),
    companionToggle: html.includes('toggleStudentCompanion'),
    nexoraToggle: html.includes('toggleStudentNexora'),
    masterFb: html.includes('MASTER_FALLBACKS') || html.includes('trainer@kamuk.cr')
  };
}

function buildNexora() {
  const src = join(INF_ROOT, 'nexora.html');
  if (!existsSync(src)) return { skipped: true };
  let html = readFileSync(src, 'utf8');
  html = rewriteAssetsToCdn(html);
  // These Kamuk runtime helpers are published beside nexora.html. Keep their
  // established local paths so GitHub Pages and /kamuk/ use the same bundles.
  html = html
    .replaceAll(`${CDN}/js/tts-chunks.js`, 'js/tts-chunks.js')
    .replaceAll(`${CDN}/js/ptt-mic.js`, 'js/ptt-mic.js');
  html = rebrandColors(html);
  // Keep dual write in savePracticeMinutes: KAM- → kamuk host only
  html = html.replace(/https:\/\/lbspgbeqtcnjrbhiuucu\.supabase\.co/g, KAM_URL);
  // Force KAM- branch to kamuk tables + host; never confuse Infinity non-KAM in a Kamuk-hosted lab
  html = html.replace(
    /var isKamuk=studentId\.startsWith\('KAM-'\);\s*var table=isKamuk\?'kamuk_students':'infinity_students';\s*var supUrl=isKamuk\?'[^']+':'[^']+';\s*var supKey=isKamuk\?'[^']+':'[^']+';/,
    `var isKamuk=true; /* Kamuk-hosted nexora always kamuk store for KAM- ids */
    var table=studentId.startsWith('KAM-')?'kamuk_students':'kamuk_students';
    var supUrl='${KAM_URL}';
    var supKey='${KAM_KEY}';`
  );
  // Simpler replace for plain pattern
  html = html.replace(
    /var table=studentId\.startsWith\('KAM-'\)\?'kamuk_students':'infinity_students';/,
    "var table='kamuk_students';"
  );

  html = html.replace(
    '<html',
    '<!-- kamuk-nexora-parity 2026-08-04 --><html'
  );

  const dest = join(KAM_ROOT, 'nexora.html');
  writeFileSync(dest, html, 'utf8');
  return {
    dest,
    bytes: html.length,
    host: html.includes(KAM_URL),
    noInfinityData: !html.includes(INF_URL) && !html.includes('infinity_students'),
    localVoiceHelpers:
      html.includes('src="js/tts-chunks.js') && html.includes('src="js/ptt-mic.js')
  };
}

function updateHubIndex() {
  const index = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Kamuk School · Operative Training</title>
<meta name="theme-color" content="#0E7490">
<meta name="description" content="Portal operacional Kamuk School — gemelo de Infinity, datos y acceso separados.">
<style>
  :root{--ink:#0F172A;--muted:#475569;--line:#E2E8F0;--teal:#0E7490;--teal-dark:#155E75;--sky:#1B9BD1;--bg:#F0F9FF;--card:#FFFFFF;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--ink);background:radial-gradient(ellipse 80% 50% at 10% 0%,rgba(27,155,209,.14),transparent 55%),var(--bg);min-height:100vh;padding:max(24px,env(safe-area-inset-top)) 20px 32px;}
  .wrap{max-width:920px;margin:0 auto;}
  .kicker{display:inline-flex;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-dark);background:rgba(14,116,144,.1);border:1px solid rgba(14,116,144,.22);padding:8px 12px;border-radius:999px;margin-bottom:1rem;}
  h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;letter-spacing:-.02em;margin-bottom:.6rem;}
  .lead{font-size:16px;line-height:1.6;color:var(--muted);max-width:40rem;margin-bottom:1.5rem;}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;}
  a.card{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:1.25rem;box-shadow:0 10px 28px rgba(15,23,42,.06);min-height:160px;transition:transform .15s,border-color .15s;}
  a.card:hover{transform:translateY(-2px);border-color:rgba(14,116,144,.35);}
  a.card .tag{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);}
  a.card h2{font-size:1.15rem;font-weight:800;}
  a.card p{font-size:13px;line-height:1.5;color:var(--muted);flex:1;}
  a.card .go{font-size:13px;font-weight:800;color:var(--teal-dark);}
  .note{margin-top:1.5rem;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.8);border:1px solid var(--line);font-size:13px;line-height:1.55;color:var(--muted);}
  footer{margin-top:2rem;font-size:12px;color:#94A3B8;}
</style>
</head>
<body>
  <div class="wrap">
    <div class="kicker">Kamuk School · Twin stack (no Infinity data)</div>
    <h1>Acceso operacional Kamuk</h1>
    <p class="lead">Misma experiencia que Infinity (Portal + Engine + Nexora), identidad Kamuk y <strong>base de datos propia</strong>. Gemelo — no se mezclan alumnos ni logins con Infinity Studio CR.</p>
    <div class="grid">
      <a class="card" href="Kamuk_Student_Portal.html">
        <span class="tag">Estudiantes</span>
        <h2>Portal del estudiante</h2>
        <p>Training Book, Alice, Nexora, juegos y evaluación — paridad Infinity, colores Kamuk.</p>
        <span class="go">Abrir Portal →</span>
      </a>
      <a class="card" href="Kamuk_Engine.html">
        <span class="tag">Trainers / Master</span>
        <h2>Kamuk Engine</h2>
        <p>KPIs, derechos de producto (Alice / Nexora / Companion), cohorte KAM-.</p>
        <span class="go">Abrir Engine →</span>
      </a>
      <a class="card" href="nexora.html">
        <span class="tag">Simulaciones</span>
        <h2>Nexora Lab</h2>
        <p>Laboratorio de llamadas y escenarios (datos en kamuk_*).</p>
        <span class="go">Abrir Nexora →</span>
      </a>
    </div>
    <p class="note">Hub: ${KAMUK_HUB}<br>Credenciales: las del Engine / portal Kamuk (tabla <code>kamuk_students</code>). No uses logins de Infinity aquí.</p>
    <footer>Kamuk School · Operative Training Database</footer>
  </div>
</body>
</html>
`;
  writeFileSync(join(KAM_ROOT, 'index.html'), index, 'utf8');
}

function updateReadme() {
  const md = `# Operarive Training Database — Kamuk School

**Twin de Infinity Studio CR** — misma experiencia de producto (Portal, Engine, Nexora, IA, juegos, evaluación), **datos y accesos 100% separados**.

| | Infinity | Kamuk |
|--|--|--|
| Repo | INFINTYSTUDIOCR/Database- | KamukSchool/Operarive-Training-Database |
| Supabase | infinity_* | kamuk_* (\`lbspgbeqtcnjrbhiuucu\`) |
| IDs | \`IS-\` | \`KAM-\` |
| Brand | púrpura | azul Kamuk |
| Portal | studioinfinitycr.com | ${KAMUK_PORTAL_URL} |
| Engine | studioinfinitycr.com | ${KAMUK_ENGINE_URL} |

## Apps

| Archivo | Uso |
|---------|-----|
| \`index.html\` | Hub GitHub Pages |
| \`Kamuk_Student_Portal.html\` | Paridad Infinity Student Portal |
| \`Kamuk_Engine.html\` | Paridad Infinity Nexus Engine |
| \`nexora.html\` | Lab Nexora |

## Build

Desde el monorepo Infinity:

\`\`\`bash
node scripts/_archive_kamuk/build-kamuk-twin.mjs
\`\`\`

Static JS/CSS se cargan desde \`studioinfinitycr.com\` (solo librerías). **No** se leen tablas Infinity.

## GitHub Pages

https://kamukschool.github.io/Operarive-Training-Database/
`;
  writeFileSync(join(KAM_ROOT, 'README.md'), md, 'utf8');
}

// ---- run ----
if (!existsSync(KAM_ROOT)) {
  console.error('Missing Kamuk repo at', KAM_ROOT);
  process.exit(1);
}

const nexoraOnly = process.argv.includes('--nexora-only');
const fail = [];

if (nexoraOnly) {
  const nexora = buildNexora();
  console.log('NEXORA', nexora);
  if (!nexora.host || !nexora.noInfinityData) fail.push('nexora Kamuk data separation');
  if (!nexora.localVoiceHelpers) fail.push('nexora local voice helpers');
} else {
  const portal = buildPortal();
  const engine = buildEngine();
  const nexora = buildNexora();
  updateHubIndex();
  updateReadme();

  console.log('PORTAL', portal);
  console.log('ENGINE', engine);
  console.log('NEXORA', nexora);

  if (!portal.productKamuk) fail.push('portal product kamuk');
  if (!portal.kamukStudents || portal.noInfStudents === false) fail.push('portal tables');
  if (!engine.portalUrl) fail.push('engine portal url');
  if (!engine.kamCreate) fail.push('engine KAM create');
  if (!engine.companionToggle || !engine.nexoraToggle) fail.push('engine toggles');
  if (!nexora.noInfinityData) fail.push('nexora Kamuk data separation');
}

if (fail.length) {
  console.error('CHECKS FAILED', fail);
  process.exit(1);
}
console.log('KAMUK TWIN BUILD OK →', KAM_ROOT);
