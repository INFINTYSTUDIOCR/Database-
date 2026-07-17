/**
 * Unmix Kamuk from Infinity storage.
 * - Kamuk apps talk ONLY to kamuk_* tables (never infinity_sessions KV).
 * - Same Supabase project host is OK; tables are fully separate.
 */
const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const LIVE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';

const DB_GET_ENGINE = `async function dbGet(table){ const r=await fetch(SUPA_URL+'/rest/v1/'+table+'?select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}); if(!r.ok){ var t=await r.text(); console.error('dbGet '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error leyendo '+table+': '+r.status,'err'); return []; } return await r.json(); }`;

const DB_SET_ENGINE = `async function dbSet(table,id,data){ const r = await fetch(SUPA_URL+'/rest/v1/'+table,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify({id,data,updated_at:new Date().toISOString()})}); if(!r.ok){ var t=await r.text(); console.error('dbSet '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error guardando: '+r.status,'err'); } }`;

const DB_DEL_ENGINE = `async function dbDel(table,id){ const r=await fetch(SUPA_URL+'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}); if(!r.ok){ var t=await r.text(); console.error('dbDel '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error eliminando: '+r.status,'err'); return false; } return true; }`;

const DB_GET_PORTAL = `async function dbGet(table){ const r=await fetch(SUPA_URL+'/rest/v1/'+table+'?select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}); return await r.json(); }`;
const DB_SET_PORTAL = `async function dbSet(table,id,data){ await fetch(SUPA_URL+'/rest/v1/'+table,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify({id,data,updated_at:new Date().toISOString()})}); }`;

function stripAdapter(h) {
  // Remove adapter block if present
  return h.replace(
    /\n\/\/ ── KAMUK STORAGE ADAPTER[\s\S]*?async function kamukResolveStorage\(\)\{[\s\S]*?\n\}\n/,
    '\n'
  );
}

function setSupa(h) {
  h = h.replace(/const SUPA_URL = 'https:\/\/[^']+';/, `const SUPA_URL = '${LIVE_URL}';`);
  h = h.replace(/const SUPA_KEY = 'eyJ[^']+';/, `const SUPA_KEY = '${LIVE_KEY}';`);
  return h;
}

function replaceFn(h, name, arity, body) {
  const multi = new RegExp(
    `async function ${name}\\(${arity}\\)\\{[\\s\\S]*?\\n\\}`,
    'm'
  );
  if (multi.test(h)) return h.replace(multi, body);
  const one = new RegExp(`async function ${name}\\(${arity}\\)\\{[^\\n]*\\}`);
  if (one.test(h)) return h.replace(one, body);
  console.warn('missing', name);
  return h;
}

function patchEngine(file) {
  let h = fs.readFileSync(file, 'utf8');
  h = stripAdapter(h);
  h = setSupa(h);
  // Remove any leftover adapter symbols
  h = h.replace(/await kamukResolveStorage\(\);\n?/g, '');
  h = replaceFn(h, 'dbGet', 'table', DB_GET_ENGINE);
  h = replaceFn(h, 'dbSet', 'table,id,data', DB_SET_ENGINE);
  h = replaceFn(h, 'dbDel', 'table,id', DB_DEL_ENGINE);
  fs.writeFileSync(file, h);
  console.log(
    'engine',
    path.basename(file),
    !h.includes('KAMUK_KV'),
    !h.includes('KMSTU_'),
    h.includes(LIVE_URL)
  );
}

function patchPortal(file) {
  let h = fs.readFileSync(file, 'utf8');
  h = stripAdapter(h);
  h = setSupa(h);
  h = h.replace(/await kamukResolveStorage\(\);\s*/g, '');
  // If db helpers got corrupted, nuke and reinsert after SUPA_KEY
  if (
    h.includes('KAMUK_KV') ||
    h.includes('kamukResolveStorage') ||
    !h.includes('async function dbGet') ||
    !h.includes('async function dbSet')
  ) {
    h = h.replace(
      /\/\/ ── KAMUK STORAGE ADAPTER[\s\S]*?(?=async function dbGet|\/\/ ──|var |const |function )/m,
      ''
    );
    h = h.replace(/async function dbGet\(table\)\{[\s\S]*?\n\}/m, '');
    h = h.replace(/async function dbGet\(table\)\{[^\\n]*\}/, '');
    h = h.replace(/async function dbSet\(table,id,data\)\{[\s\S]*?\n\}/m, '');
    h = h.replace(/async function dbSet\(table,id,data\)\{[^\\n]*\}/, '');
    h = h.replace(
      /(const SUPA_KEY = '[^']+';)/,
      `$1\n${DB_GET_PORTAL}\n${DB_SET_PORTAL}`
    );
  } else {
    h = replaceFn(h, 'dbGet', 'table', DB_GET_PORTAL);
    h = replaceFn(h, 'dbSet', 'table,id,data', DB_SET_PORTAL);
  }
  // Restore direct student fetch if we rewrote to dbGet earlier — keep dbGet/dbSet usage OK
  fs.writeFileSync(file, h);
  console.log(
    'portal',
    path.basename(file),
    !h.includes('KAMUK_KV'),
    h.includes('async function dbSet'),
    h.includes(LIVE_URL)
  );
}

function patchNexora(file) {
  let h = fs.readFileSync(file, 'utf8');
  // Restore clean savePracticeMinutes without KV
  const clean = `async function savePracticeMinutes(mins){
  try{
    var studentId=localStorage.getItem('nexora_student_id');
    if(!studentId) return;
    var table=studentId.startsWith('KAM-')?'kamuk_students':'infinity_students';
    var supUrl='${LIVE_URL}';
    var supKey='${LIVE_KEY}';
    var rows=await fetch(supUrl+'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(studentId),{headers:{apikey:supKey,Authorization:'Bearer '+supKey}}).then(function(r){return r.ok?r.json():[];});
    if(rows&&rows[0]){
      var d=rows[0].data||{};
      d.nexoraPracticeMinutes=(d.nexoraPracticeMinutes||0)+mins;
      d.nexoraSessionCount=(d.nexoraSessionCount||0)+1;
      await fetch(supUrl+'/rest/v1/'+table,{method:'POST',headers:{apikey:supKey,Authorization:'Bearer '+supKey,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:studentId,data:d,updated_at:new Date().toISOString()})});
    }
  }catch(e){}
}`;
  if (/async function savePracticeMinutes\(mins\)\{[\s\S]*?\n\}/.test(h)) {
    h = h.replace(/async function savePracticeMinutes\(mins\)\{[\s\S]*?\n\}/, clean);
  }
  h = h.replace(/https:\/\/lbspgbeqtcnjrbhiuucu\.supabase\.co/g, LIVE_URL);
  fs.writeFileSync(file, h);
  console.log('nexora', path.basename(file), !h.includes('KMSTU_'), !h.includes('KAMUK NEXORA'));
}

function patchInfinityPortal(file) {
  let h = fs.readFileSync(file, 'utf8');
  // Remove KV fallback block
  h = h.replace(
    /\n\s*\/\/ KAMUK INF PORTAL STORE[\s\S]*?var _rowId = _kamukKv \? \('KMSTU_'\+student\.id\) : student\.id;/g,
    ''
  );
  h = h.replace(
    /var rows = await fetch\(SUPA_URL\+'\/rest\/v1\/'\+table\+'\?id=eq\.'\+encodeURIComponent\(typeof _rowId!=='undefined'\?_rowId:student\.id\),\{headers:\{apikey:SUPA_KEY,Authorization:'Bearer '\+SUPA_KEY\}\}\)\.then\(function\(r\)\{return r\.ok\?r\.json\(\):\[\];\}\);/g,
    "var rows = await fetch(SUPA_URL+'/rest/v1/'+table+'?id=eq.'+student.id,{headers:{apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY}}).then(function(r){return r.json();});"
  );
  h = h.replace(
    /body:JSON\.stringify\(\{id:\(typeof _rowId!=='undefined'\?_rowId:student\.id\),data:d,updated_at:new Date\(\)\.toISOString\(\)\}\)/g,
    'body:JSON.stringify({id:student.id,data:d,updated_at:new Date().toISOString()})'
  );
  fs.writeFileSync(file, h);
  console.log('inf portal', !h.includes('KMSTU_'), !h.includes('KAMUK INF PORTAL'));
}

const root = path.join(__dirname, '..');
patchEngine(path.join(root, 'kamuk', 'Kamuk_Engine.html'));
patchPortal(path.join(root, 'kamuk', 'Kamuk_Student_Portal.html'));
patchNexora(path.join(root, 'kamuk', 'nexora.html'));
patchNexora(path.join(root, 'nexora.html'));
patchInfinityPortal(path.join(root, 'Infinity_Student_Portal.html'));

const sibling = 'C:/Users/ARMANDO/Projects/Operarive-Training-Database';
if (fs.existsSync(sibling)) {
  patchEngine(path.join(sibling, 'Kamuk_Engine.html'));
  patchPortal(path.join(sibling, 'Kamuk_Student_Portal.html'));
  if (fs.existsSync(path.join(sibling, 'nexora.html'))) {
    patchNexora(path.join(sibling, 'nexora.html'));
  }
}

console.log('unmix done');
