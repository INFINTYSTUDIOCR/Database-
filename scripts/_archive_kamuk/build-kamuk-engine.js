/**
 * Build Kamuk Engine from Infinity Nexus Engine.
 * Same UX/graphics/experience; Kamuk colors; yellow-tab sidebar removed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Infinity_Nexus_Engine.html');
const DEST = path.join(ROOT, 'kamuk', 'Kamuk_Engine.html');

const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

let html = fs.readFileSync(SRC, 'utf8');

// Asset paths from /kamuk/
html = html
  .replace(/href="css\//g, 'href="../css/')
  .replace(/src="js\//g, 'src="../js/')
  .replace(/src="nexus-unified\.js"/g, 'src="../nexus-unified.js"')
  .replace(/src="nexus-unified-ui\.js"/g, 'src="../nexus-unified-ui.js"')
  .replace(/src="nexus-manual-calibration\.js"/g, 'src="../nexus-manual-calibration.js"')
  .replace(/src="nexus-unified-mockup\.js"/g, 'src="../nexus-unified-mockup.js"')
  .replace(/href="manifest-engine\.json"/g, 'href="../manifest-engine.json"')
  .replace(/href="icon-192\.png/g, 'href="../icon-192.png')
  .replace(/src="assets\//g, 'src="../assets/')
  .replace(/href="assets\//g, 'href="../assets/');

// Branding
html = html
  .replace(/<title>Infinity Nexus Engine<\/title>/, '<title>Kamuk School — Operational Engine</title>')
  .replace(/content="#5B21B6"/, 'content="#2B7EC1"')
  .replace(/content="Nexus Engine"/, 'content="Kamuk Engine"')
  .replace(/Infinity Nexus Engine/g, 'Kamuk Operational Engine')
  .replace(/Infinity Studio CR/g, 'Kamuk School')
  .replace(/assets\/logos\/infinity-studio-cr-nav\.png/g, 'assets/logos/kamuk-school.png')
  .replace(/assets\/logos\/infinity-studio-cr\.png/g, 'assets/logos/kamuk-school.png')
  .replace(/alt="Infinity Studio CR"/g, 'alt="Kamuk School"');

// Colors — Kamuk palette (never Infinity purple)
html = html
  .replace(
    /--navy:#5B21B6;--nl:#EDE9FE;--nm:#7C3AED;--nd:#3B0E8C;/,
    '--navy:#2B7EC1;--nl:#E8F4FC;--nm:#1F6AA8;--nd:#1A5A8F;'
  )
  .replace(
    /--purple:#5B21B6;--pb:#EDE9FE;--pm:#7C3AED;/,
    '--purple:#2B7EC1;--pb:#E8F4FC;--pm:#1F6AA8;'
  )
  .replace(/--gold:#F5A623;/, '--gold:#F7941D;')
  .replace(/--gray:#F8F8FF;--border:#E2E8F0;/, '--gray:#F4F8FC;--border:#C5DDEF;')
  .replace(/--text:#1E1E2E;--t2:#4A4A6A;--t3:#8888AA;/, '--text:#1E2D3D;--t2:#4A6080;--t3:#8FA4B8;')
  .replace(/background:#F8F8FF;/g, 'background:#F4F8FC;')
  .replace(/#5B21B6/g, '#2B7EC1')
  .replace(/#7C3AED/g, '#1F6AA8')
  .replace(/#3B0E8C/g, '#1A5A8F')
  .replace(/#EDE9FE/g, '#E8F4FC')
  .replace(/rgba\(91,33,182/g, 'rgba(43,126,193')
  .replace(/#C4B5FD/g, '#A8D4F5')
  .replace(/#F3F0FF/g, '#E8F4FC');

// Supabase + tables → Kamuk project
html = html
  .replace(INF_URL, KAM_URL)
  .replace(INF_KEY, KAM_KEY)
  .replace(/infinity_students/g, 'kamuk_students')
  .replace(/infinity_sessions/g, 'kamuk_sessions')
  .replace(/infinity_users/g, 'kamuk_users');

// Portal URL
html = html.replace(
  /var STUDENT_PORTAL_URL = '[^']+';/,
  "var STUDENT_PORTAL_URL = 'https://studioinfinitycr.com/kamuk/Kamuk_Student_Portal.html';"
);

// Slim sidebar: replace entire trainer-nav block (yellow tabs removed)
const slimNav = `    <div id="trainer-nav">
      <div class="sb-section">Dashboard</div>
      <div class="sb-item active" onclick="showView('dashboard',this)"><i class="ti ti-dashboard"></i>Overview</div>
      <div class="sb-item" id="nav-students" onclick="showView('students',this)"><i class="ti ti-users"></i>Estudiantes<span class="sb-badge blue" id="sb-count">0</span></div>
      <div class="sb-section">Mi clase</div>
      <div class="sb-item" onclick="showView('student-journey',this)"><i class="ti ti-route"></i>Viaje estudiantes</div>
      <div class="sb-item" onclick="showView('weekly-pulse',this)"><i class="ti ti-heartbeat"></i>Weekly Pulse</div>
      <div class="sb-item" onclick="showView('kpi-rulebook',this)"><i class="ti ti-book-2"></i>Q&A KPIs Rule Book</div>
      <div class="sb-item" id="nav-assign-ex" onclick="showView('assign-exercises',this)"><i class="ti ti-dumbbell"></i>Asignar ejercicios</div>
      <div class="sb-item" onclick="showView('exercises',this)"><i class="ti ti-books"></i>Catálogo Nexus</div>
      <div class="sb-item" onclick="showView('calendar',this)"><i class="ti ti-calendar"></i>Calendario</div>
      <div class="sb-item" onclick="showView('attendance',this)"><i class="ti ti-clipboard-check"></i>Asistencia</div>
      <div class="sb-section">Analytics</div>
      <div class="sb-item" onclick="showView('analytics',this)"><i class="ti ti-chart-bar"></i>Estadísticas</div>
      <div class="sb-item" onclick="showView('reports',this)"><i class="ti ti-file-text"></i>Reportes</div>
      <div class="sb-section" id="nav-master-section">Master</div>
      <div class="sb-item" id="nav-resources" onclick="showView('resources',this)"><i class="ti ti-package"></i>Resource Manager</div>
      <div class="sb-item" id="nav-users" onclick="showView('users',this)"><i class="ti ti-shield"></i>Gestión de usuarios</div>
      <div class="sb-item" id="nav-auditlog" onclick="showView('auditlog',this)"><i class="ti ti-history"></i>Log de auditoría</div>
      <div class="sb-item" id="nav-broadcast" onclick="openBroadcastModal()"><i class="ti ti-brand-whatsapp"></i>Comunicado general</div>
      <div class="sb-item" id="nav-new-student" onclick="openNewStudentModal()"><i class="ti ti-user-plus"></i>Nuevo estudiante</div>
      <div class="sb-section">Departamentos</div>
      <div class="sb-item" id="nav-dept-misc" onclick="showView('dept-misc',this)"><i class="ti ti-news"></i>Misceláneos</div>
    </div>`;

html = html.replace(/<div id="trainer-nav">[\s\S]*?<\/div>\s*<\/div>\s*\r?\n\s*<!-- CONTENT -->/, slimNav + '\n  </div>\n\n  <!-- CONTENT -->');

// Patch startApp body only (do NOT match past startApp — goHome shares the same showView line)
html = html.replace(
  /function startApp\(\)\{\r?\n  document\.getElementById\('login-screen'\)\.style\.display='none';\r?\n  document\.getElementById\('app-wrap'\)\.classList\.add\('show'\);\r?\n  document\.getElementById\('tb-right'\)\.style\.display='flex';\r?\n  document\.getElementById\('tb-user'\)\.textContent = SESSION\.name;\r?\n  document\.getElementById\('tb-role-badge'\)\.textContent = hasMasterAccess\(\)\?'Master Trainer':'Trainer';\r?\n  document\.getElementById\('tb-role-badge'\)\.className = 'tb-role '\+\(hasMasterAccess\(\)\?'role-master':'role-trainer'\);\r?\n  document\.getElementById\('sb-name'\)\.textContent = SESSION\.name;\r?\n  if\(!hasMasterAccess\(\)\)\{[\s\S]*?queueEngineDailyInspiration\(\);\r?\n\}/,
  `function startApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app-wrap').classList.add('show');
  document.getElementById('tb-right').style.display='flex';
  document.getElementById('tb-user').textContent = SESSION.name;
  document.getElementById('tb-role-badge').textContent = hasMasterAccess()?'Master Trainer':'Trainer';
  document.getElementById('tb-role-badge').className = 'tb-role '+(hasMasterAccess()?'role-master':'role-trainer');
  document.getElementById('sb-name').textContent = SESSION.name;
  function hideNav(id){ var el=document.getElementById(id); if(el) el.style.display='none'; }
  if(!hasMasterAccess()){
    ['nav-users','nav-master-section','nav-auditlog','nav-broadcast','nav-new-student','nav-resources'].forEach(hideNav);
    document.getElementById('nav-students').onclick = function(){ showView('my-students', this); };
  }
  showView('dashboard', document.querySelector('.sb-item'));
  maybeShowEngineTermsGate();
  var termsEl = document.getElementById('modal-infinity-terms');
  if(!termsEl || !termsEl.classList.contains('show')) queueEngineDailyInspiration();
}`
);

// Master login fallbacks for Kamuk
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

// createStudent → KAM ids + Companion/Nexora defaults
html = html.replace(
  "var id='IS-'+fname.substring(0,2).toUpperCase()+lname.substring(0,2).toUpperCase()+'-'+Date.now();\n  var student={\n    id, code,\n    info:{ name:fname+' '+lname, email:document.getElementById('ns-email').value, phone:document.getElementById('ns-phone').value, program:document.getElementById('ns-program').value, fee:document.getElementById('ns-fee').value, trainer:SESSION.name, start:new Date().toISOString().split('T')[0], phase:'1', level:'Emerging', score:0, current_score:0, obs:document.getElementById('ns-obs').value },\n    skills:{}, kpis:{ phase1:{IG:'',ST:'',RA:'',PS:'',R:''}, phase2:{}, phase3:{}, phase4:{} },\n    calibrations:[], notes:[], compliance:{ scheduled:32, attended:0 }, path_custom:''\n  };",
  "var id='KAM-'+fname.substring(0,2).toUpperCase()+lname.substring(0,2).toUpperCase()+'-'+Date.now();\n  var student={\n    id, code,\n    info:{ name:fname+' '+lname, email:document.getElementById('ns-email').value, phone:document.getElementById('ns-phone').value, program:document.getElementById('ns-program').value, fee:document.getElementById('ns-fee').value, trainer:SESSION.name, start:new Date().toISOString().split('T')[0], phase:'1', level:'Emerging', score:0, current_score:0, obs:document.getElementById('ns-obs').value },\n    skills:{}, kpis:{ phase1:{IG:'',ST:'',RA:'',PS:'',R:''}, phase2:{}, phase3:{}, phase4:{} },\n    calibrations:[], notes:[], compliance:{ scheduled:32, attended:0 }, path_custom:'',\n    companionEnabled:true, nexoraEnabled:true, aliceEnabled:true, jillEnabled:false, claireEnabled:false, _kamukAccessV1:true\n  };"
);

html = html.replace(
  "return n+l+'-INF-'+num;",
  "return n+l+'-KAM-'+num;"
);

// Wire journey / pulse / rulebook + default access helpers
html = html.replace(
  /else if\(view==='kpitracker'\) renderKPITrackerSelect\(m\);/,
  `else if(view==='kpitracker' || view==='weekly-pulse') renderKPITrackerSelect(m);
  else if(view==='student-journey') renderStudentJourney(m);
  else if(view==='kpi-rulebook') renderKpiRulebook(m);`
);

const helpers = `
function renderStudentJourney(m){
  var students = hasMasterAccess() ? allStudents() : getMyStudents();
  students = students.sort(function(a,b){ return ((a.info&&a.info.name)||'').localeCompare((b.info&&b.info.name)||''); });
  var phases = [1,2,3,4];
  m.innerHTML = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:1rem;"><i class="ti ti-route"></i> Viaje estudiantes</h2>'
    +'<div class="ib ib-navy">Vista rápida del progreso por fase · Kamuk School (Método Nexus).</div>'
    +'<div class="card"><div class="card-title"><i class="ti ti-users"></i>Cohorte</div>'
    +(students.length ? '<table class="tbl"><thead><tr><th>Estudiante</th><th>Fase</th><th>Nivel</th><th>Score</th><th></th></tr></thead><tbody>'
      +students.map(function(s){
        var phase = parseInt((s.info&&s.info.phase)||1)||1;
        var score = (typeof getScore==='function') ? getScore(s) : 0;
        var dots = phases.map(function(p){
          return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;background:'+(p<=phase?'var(--navy)':'var(--border)')+';"></span>';
        }).join('');
        return '<tr><td style="font-weight:600;">'+((s.info&&s.info.name)||'—')+'</td><td>'+dots+' '+(typeof getPhaseBadge==='function'?getPhaseBadge(phase):phase)+'</td><td>'+(typeof getLevelBadge==='function'?getLevelBadge((typeof getLevel==='function'?getLevel(score):'—')):'—')+'</td><td>'+score+'/25</td><td><button class="btn btn-outline btn-sm" data-sid="'+s.id+'" onclick="openStudent(this.dataset.sid)">Abrir</button></td></tr>';
      }).join('')+'</tbody></table>' : '<div class="ib ib-amber">No hay estudiantes.</div>')
    +'</div></div>';
}
function renderKpiRulebook(m){
  if(typeof KPI_TRACKER_AREAS==='undefined'){ m.innerHTML='<div class="ib ib-amber">Rule book no disponible.</div>'; return; }
  var html = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:1rem;"><i class="ti ti-book-2"></i> Q&A KPIs Rule Book</h2><div class="ib ib-navy">Reglas de evaluación · Método Nexus.</div>';
  KPI_TRACKER_AREAS.forEach(function(area){
    html += '<div class="card"><div class="card-title">'+area.id+' — '+area.name+'</div>';
    area.kpis.forEach(function(k){
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border);"><div style="font-weight:700;color:var(--navy);">'+k.id+' · '+k.name+'</div><div style="font-size:12px;color:var(--t2);">'+(k.evaluates||[]).join(' · ')+'</div>'+(k.note?'<div style="font-size:12px;margin-top:4px;color:var(--ad);">'+k.note+'</div>':'')+'</div>';
    });
    html += '</div>';
  });
  m.innerHTML = html+'</div>';
}
async function ensureKamukDefaultAccess(){
  var ids = Object.keys(DB); var n=0;
  for(var i=0;i<ids.length;i++){
    var id=ids[i]; var s=DB[id];
    if(!s || s._kamukAccessV1) continue;
    s.companionEnabled=true; s.nexoraEnabled=true; s.aliceEnabled=true; s.jillEnabled=false; s.claireEnabled=false; s._kamukAccessV1=true;
    try{ await dbSet('kamuk_students', id, s); DB[id]=s; n++; }catch(e){}
  }
  if(n) console.log('[Kamuk] Companion+Nexora defaults applied to', n);
}
`;
html = html.replace('// ── HELPERS ───────────────────────────────────────────────', helpers + '\n// ── HELPERS ───────────────────────────────────────────────');

// Hook default access after students load — look for sb-count assignment in loadCoreData/loadData
if (!html.includes('await ensureKamukDefaultAccess()')) {
  html = html.replace(
    /document\.getElementById\('sb-count'\)\.textContent = allStudents\(\)\.length;/,
    `await ensureKamukDefaultAccess();\n  document.getElementById('sb-count').textContent = allStudents().length;`
  );
}

// Guard CRM / diagnostic nav lookups
html = html.replace(/document\.getElementById\('nav-crm'\)/g, "(document.getElementById('nav-crm')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-diagnostic'\)/g, "(document.getElementById('nav-diagnostic')||null)");
html = html.replace(/document\.getElementById\('nav-finance'\)/g, "(document.getElementById('nav-finance')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-super-brain'\)/g, "(document.getElementById('nav-super-brain')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-ops'\)/g, "(document.getElementById('nav-ops')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-network'\)/g, "(document.getElementById('nav-network')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-transcripts'\)/g, "(document.getElementById('nav-transcripts')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-dashboard'\)/g, "(document.getElementById('nav-dashboard')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-roster'\)/g, "(document.getElementById('nav-roster')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-avail-overview'\)/g, "(document.getElementById('nav-avail-overview')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-dept-admin'\)/g, "(document.getElementById('nav-dept-admin')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-dept-training'\)/g, "(document.getElementById('nav-dept-training')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-dept-marketing'\)/g, "(document.getElementById('nav-dept-marketing')||{style:{}})");
html = html.replace(/document\.getElementById\('nav-my-profile'\)/g, "(document.getElementById('nav-my-profile')||{style:{}})");

html = html.replace(
  '<html lang="en">',
  '<html lang="en"><!-- kamuk-engine-build 2026-07-17: infinity-parity aesthetics colors-only slim-nav -->'
);

fs.writeFileSync(DEST, html, 'utf8');
console.log('Wrote', DEST, '(' + html.length + ' bytes)');

const checks = {
  'showView': html.includes('function showView('),
  'renderDashboard': html.includes('function renderDashboard('),
  'createStudent': html.includes('async function createStudent('),
  'toggleCompanion': html.includes('function toggleStudentCompanion('),
  'KAM create': html.includes("var id='KAM-'"),
  'master fallbacks': html.includes('MASTER_FALLBACKS'),
  'hideNav': html.includes('function hideNav(id)'),
  'no nav-crm': !/id="nav-crm"/.test(html),
  'no nav-my-profile': !/id="nav-my-profile"/.test(html),
  'kamuk_students': html.includes('kamuk_students'),
  'kamuk color': html.includes('#2B7EC1'),
  'goHome intact': html.includes('function goHome('),
  'journey helper': html.includes('function renderStudentJourney('),
};
Object.entries(checks).forEach(([k, v]) => console.log(v ? 'OK' : 'FAIL', k));
