/**
 * Build Kamuk Student Portal from Infinity Student Portal.
 * Same product surface; Kamuk colors; no News tab; Companion+Nexora defaults.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Infinity_Student_Portal.html');
const DEST = path.join(ROOT, 'kamuk', 'Kamuk_Student_Portal.html');

const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

let html = fs.readFileSync(SRC, 'utf8');

// Asset paths from /kamuk/
html = html
  .replace(/href="css\//g, 'href="../css/')
  .replace(/src="js\//g, 'src="../js/')
  .replace(/src="infinity-auth\.js/g, 'src="../infinity-auth.js')
  .replace(/src="nexora-profile\.js/g, 'src="../nexora-profile.js')
  .replace(/src="nexora-characters\.js/g, 'src="../nexora-characters.js')
  .replace(/src="nexus-unified-portal\.js/g, 'src="../nexus-unified-portal.js')
  .replace(/href="manifest-portal\.json"/g, 'href="../manifest-portal.json"')
  .replace(/href="icon-192\.png/g, 'href="../icon-192.png')
  .replace(/href="\/icon-512\.png/g, 'href="/icon-512.png');

// Branding + colors
html = html
  .replace(/<title>Infinity Portal del Estudiante<\/title>/, '<title>Kamuk Portal del Estudiante</title>')
  .replace(/content="#5B21B6"/, 'content="#2B7EC1"')
  .replace(/content="SI Portal"/, 'content="Kamuk Portal"')
  .replace(
    /--navy:#5B21B6;--nl:#EDE9FE;--nm:#7C3AED;--nd:#3B0E8C;/,
    '--navy:#2B7EC1;--nl:#E8F4FC;--nm:#1F6AA8;--nd:#1A5A8F;'
  )
  .replace(
    /--purple:#5B21B6;--pb:#EDE9FE;--pm:#7C3AED;/,
    '--purple:#2B7EC1;--pb:#E8F4FC;--pm:#1F6AA8;'
  )
  .replace(/#5B21B6/g, '#2B7EC1')
  .replace(/#7C3AED/g, '#1F6AA8')
  .replace(/#3B0E8C/g, '#1A5A8F')
  .replace(/#1e1b4b/g, '#0F3A5C')
  .replace(/Bienvenido a Infinity/g, 'Bienvenido a Kamuk')
  .replace(/BIENVENIDO A INFINITY/g, 'BIENVENIDO A KAMUK')
  .replace(/News — Infinity/g, 'News — Kamuk')
  .replace(/Infinity Portal/g, 'Kamuk Portal')
  .replace(/Studio Infinity CR/g, 'Kamuk School')
  .replace(/Portal del Estudiante — Infinity/g, 'Portal del Estudiante — Kamuk');

// Supabase → Kamuk project
html = html
  .replace(INF_URL, KAM_URL)
  .replace(INF_KEY, KAM_KEY)
  .replace(/infinity_students/g, 'kamuk_students')
  .replace(/infinity_sessions/g, 'kamuk_sessions');

// Remove News nav item
html = html.replace(
  /\n\s*<div class="portal-nav-item" data-tab="news" onclick="switchPortalTab\('news'\)"><i class="ti ti-news"><\/i>News<\/div>/,
  ''
);

// Defaults: Companion + Nexora (Alice on for Nexora gate); Jill/Claire off
html = html.replace(
  /jillEnabled: true,\n    jillProEnabled: true,\n    aliceEnabled: false,\n    companionEnabled: false,\n    claireEnabled: false,\n    system_mode: 'jill',/,
  `jillEnabled: false,
    jillProEnabled: false,
    aliceEnabled: true,
    companionEnabled: true,
    nexoraEnabled: true,
    claireEnabled: false,
    system_mode: 'alice',`
);

// After hydrating student flags from DB, apply Kamuk product defaults when unset
const hydrateMarker = 'if(typeof d.nexoraEnabled === \'boolean\') CURRENT_STUDENT.nexoraEnabled = d.nexoraEnabled;';
if (html.includes(hydrateMarker) && !html.includes('/* kamuk-access-defaults */')) {
  html = html.replace(
    hydrateMarker,
    `/* kamuk-access-defaults */
  if(typeof d.nexoraEnabled === 'boolean') CURRENT_STUDENT.nexoraEnabled = d.nexoraEnabled;
  else if(d.nexoraEnabled == null) CURRENT_STUDENT.nexoraEnabled = true;`
  );
}

// Companion default true when unset
html = html.replace(
  /if\(d\.companionEnabled === true \|\| d\.companionEnabled === 'true' \|\| d\.companionEnabled === 1\) CURRENT_STUDENT\.companionEnabled = true;/,
  `if(d.companionEnabled === true || d.companionEnabled === 'true' || d.companionEnabled === 1) CURRENT_STUDENT.companionEnabled = true;
  else if(d.companionEnabled == null) CURRENT_STUDENT.companionEnabled = true;
  if(typeof d.aliceEnabled !== 'boolean' && d.aliceEnabled == null) CURRENT_STUDENT.aliceEnabled = true;
  if(typeof d.jillEnabled !== 'boolean' && d.jillEnabled == null) CURRENT_STUDENT.jillEnabled = false;`
);

// Nexora gate: allow with companion OR alice (Kamuk product)
html = html.replace(
  /function studentNexoraOn\(s\)\{\n  return studentPortalAccessOk\(s\) && studentAliceOn\(s\) && !!s\.nexoraEnabled;\n\}/,
  `function studentNexoraOn(s){
  return studentPortalAccessOk(s) && !!s.nexoraEnabled && (studentAliceOn(s) || studentCompanionOn(s));
}`
);

// Terms / first tab: progress instead of news when possible
html = html.replace(
  /switchPortalTab\('news'\);/,
  "switchPortalTab('progreso');"
);

// Inject marker so we know build version
html = html.replace(
  '<html lang="es">',
  '<html lang="es"><!-- kamuk-portal-build 2026-07-17: infinity-parity colors-only no-news companion+nexora -->'
);

fs.writeFileSync(DEST, html, 'utf8');
console.log('Wrote', DEST, '(' + html.length + ' bytes)');
