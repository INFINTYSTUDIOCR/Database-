/**
 * Wire Kamuk apps to Infinity live Supabase.
 * - Points SUPA_URL/KEY to rxruvpfdpgowmpvydacd
 * - Adds storage adapter: real kamuk_* tables if present, else KV in infinity_sessions
 */
const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const LIVE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';

const ADAPTER = `
// ── KAMUK STORAGE ADAPTER (Infinity Supabase) ─────────────────
// Prefer real kamuk_* tables; if missing, store as KV rows in infinity_sessions.
var KAMUK_STORAGE = { mode: 'probe', phys: 'infinity_sessions', ready: null };
var KAMUK_KV = { kamuk_students:'KMSTU_', kamuk_users:'KMUSR_', kamuk_sessions:'KMSES_', kamuk_resources:'KMRES_' };
function kamukPhysId(table,id){ return (KAMUK_KV[table]||('KM_'+table+'_'))+id; }
function kamukLogicId(table,physId){ var p=KAMUK_KV[table]||('KM_'+table+'_'); return (physId&&physId.indexOf(p)===0)?physId.slice(p.length):physId; }
async function kamukResolveStorage(){
  if(KAMUK_STORAGE.ready) return KAMUK_STORAGE.ready;
  KAMUK_STORAGE.ready = (async function(){
    try{
      var r=await fetch(SUPA_URL+'/rest/v1/kamuk_students?select=id&limit=1',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
      if(r.ok){ KAMUK_STORAGE.mode='tables'; return KAMUK_STORAGE.mode; }
    }catch(e){}
    KAMUK_STORAGE.mode='kv';
    return KAMUK_STORAGE.mode;
  })();
  return KAMUK_STORAGE.ready;
}
`;

const DB_GET_ENGINE = `async function dbGet(table){
  await kamukResolveStorage();
  if(KAMUK_STORAGE.mode==='tables'){
    const r=await fetch(SUPA_URL+'/rest/v1/'+table+'?select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
    if(!r.ok){ var t=await r.text(); console.error('dbGet '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error leyendo '+table+': '+r.status,'err'); return []; }
    return await r.json();
  }
  var pref=KAMUK_KV[table]||('KM_'+table+'_');
  const r=await fetch(SUPA_URL+'/rest/v1/'+KAMUK_STORAGE.phys+'?id=like.'+encodeURIComponent(pref)+'*&select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
  if(!r.ok){ var t=await r.text(); console.error('dbGet KV '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error leyendo '+table+': '+r.status,'err'); return []; }
  var rows=await r.json();
  return (rows||[]).map(function(row){ return {id:kamukLogicId(table,row.id), data:row.data}; });
}`;

const DB_SET_ENGINE = `async function dbSet(table,id,data){
  await kamukResolveStorage();
  var rowId = (KAMUK_STORAGE.mode==='tables') ? id : kamukPhysId(table,id);
  var target = (KAMUK_STORAGE.mode==='tables') ? table : KAMUK_STORAGE.phys;
  const r = await fetch(SUPA_URL+'/rest/v1/'+target,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify({id:rowId,data:data,updated_at:new Date().toISOString()})});
  if(!r.ok){ var t=await r.text(); console.error('dbSet '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error guardando: '+r.status,'err'); }
}`;

const DB_DEL_ENGINE = `async function dbDel(table,id){
  await kamukResolveStorage();
  var rowId = (KAMUK_STORAGE.mode==='tables') ? id : kamukPhysId(table,id);
  var target = (KAMUK_STORAGE.mode==='tables') ? table : KAMUK_STORAGE.phys;
  const r=await fetch(SUPA_URL+'/rest/v1/'+target+'?id=eq.'+encodeURIComponent(rowId),{method:'DELETE',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}});
  if(!r.ok){ var t=await r.text(); console.error('dbDel '+table+' failed: '+r.status+' '+t); if(typeof showToast==='function') showToast('Error eliminando: '+r.status,'err'); return false; }
  return true;
}`;

const DB_GET_PORTAL = `async function dbGet(table){ await kamukResolveStorage(); if(KAMUK_STORAGE.mode==='tables'){ const r=await fetch(SUPA_URL+'/rest/v1/'+table+'?select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}); return await r.json(); } var pref=KAMUK_KV[table]||('KM_'+table+'_'); const r=await fetch(SUPA_URL+'/rest/v1/'+KAMUK_STORAGE.phys+'?id=like.'+encodeURIComponent(pref)+'*&select=id,data',{headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}); var rows=await r.json(); return (rows||[]).map(function(row){ return {id:kamukLogicId(table,row.id), data:row.data}; }); }`;

const DB_SET_PORTAL = `async function dbSet(table,id,data){ await kamukResolveStorage(); var rowId=(KAMUK_STORAGE.mode==='tables')?id:kamukPhysId(table,id); var target=(KAMUK_STORAGE.mode==='tables')?table:KAMUK_STORAGE.phys; await fetch(SUPA_URL+'/rest/v1/'+target,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},body:JSON.stringify({id:rowId,data:data,updated_at:new Date().toISOString()})}); }`;

function wireSupa(h) {
  h = h.replace(/const SUPA_URL = 'https:\/\/[^']+';/, `const SUPA_URL = '${LIVE_URL}';`);
  h = h.replace(/const SUPA_KEY = 'eyJ[^']+';/, `const SUPA_KEY = '${LIVE_KEY}';`);
  if (!h.includes('KAMUK STORAGE ADAPTER')) {
    h = h.replace(/(const SUPA_KEY = '[^']+';)/, `$1\n${ADAPTER}`);
  }
  return h;
}

function replaceFn(h, name, arityRe, body) {
  const re = new RegExp(
    `async function ${name}\\(${arityRe}\\)\\{[\\s\\S]*?\\n\\}`,
    'm'
  );
  if (!re.test(h)) {
    // one-line variants
    const re1 = new RegExp(`async function ${name}\\(${arityRe}\\)\\{[^\\n]*\\}`);
    if (re1.test(h)) return h.replace(re1, body);
    console.warn('  ! could not find', name);
    return h;
  }
  return h.replace(re, body);
}

function patchEngine(file) {
  let h = fs.readFileSync(file, 'utf8');
  h = wireSupa(h);
  h = replaceFn(h, 'dbGet', 'table', DB_GET_ENGINE);
  h = replaceFn(h, 'dbSet', 'table,id,data', DB_SET_ENGINE);
  h = replaceFn(h, 'dbDel', 'table,id', DB_DEL_ENGINE);
  // Direct deletes of kamuk_sessions in engine
  h = h.replace(
    /await fetch\(SUPA_URL\+'\/rest\/v1\/kamuk_sessions\?id=eq\.'\+id,\{method:'DELETE',headers:\{apikey:SUPA_KEY,Authorization:'Bearer '\+SUPA_KEY\}\}\);/g,
    "await dbDel('kamuk_sessions',id);"
  );
  fs.writeFileSync(file, h);
  console.log(
    'OK engine',
    file,
    'url',
    h.includes(LIVE_URL),
    'adapter',
    h.includes('KAMUK STORAGE ADAPTER')
  );
}

function patchPortal(file) {
  let h = fs.readFileSync(file, 'utf8');
  h = wireSupa(h);
  h = replaceFn(h, 'dbGet', 'table', DB_GET_PORTAL);
  h = replaceFn(h, 'dbSet', 'table,id,data', DB_SET_PORTAL);
  // Portal also has inline fetch to kamuk tables — rewrite id=eq student fetches via helper remains if using dbGet/dbSet
  // Fix leftover dead project URLs if any
  h = h.replace(/https:\/\/lbspgbeqtcnjrbhiuucu\.supabase\.co/g, LIVE_URL);
  fs.writeFileSync(file, h);
  console.log(
    'OK portal',
    file,
    'url',
    h.includes(LIVE_URL),
    'adapter',
    h.includes('KAMUK STORAGE ADAPTER')
  );
}

function patchNexora(file) {
  let h = fs.readFileSync(file, 'utf8');
  const oldUrl = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
  const oldKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';
  // Unify Kamuk branch to Infinity project + same key as Infinity portal
  h = h.replaceAll(oldUrl, LIVE_URL);
  h = h.replaceAll(oldKey, LIVE_KEY);
  // Also fix stale Infinity key variants in nexora Kamuk ternary to LIVE_KEY
  h = h.replace(
    /var supUrl=studentId\.startsWith\('KAM-'\)\?'[^']+':'[^']+';/,
    `var supUrl='${LIVE_URL}';`
  );
  h = h.replace(
    /var supKey=studentId\.startsWith\('KAM-'\)\?'[^']+':'[^']+';/,
    `var supKey='${LIVE_KEY}';`
  );
  // For KAM students without kamuk_students table, try KMSTU_ kv then infinity
  if (!h.includes('KAMUK NEXORA STORAGE')) {
    h = h.replace(
      /async function savePracticeMinutes\(mins\)\{[\s\S]*?\n\}/,
      `async function savePracticeMinutes(mins){
  try{
    var studentId=localStorage.getItem('nexora_student_id');
    if(!studentId) return;
    // KAMUK NEXORA STORAGE — Infinity project only
    var isKamuk=studentId.startsWith('KAM-');
    var table=isKamuk?'kamuk_students':'infinity_students';
    var supUrl='${LIVE_URL}';
    var supKey='${LIVE_KEY}';
    async function loadRow(){
      var rows=await fetch(supUrl+'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(studentId),{headers:{apikey:supKey,Authorization:'Bearer '+supKey}}).then(function(r){return r.ok?r.json():[];});
      if(rows&&rows[0]) return {table:table,id:studentId,data:rows[0].data||{}};
      if(isKamuk){
        var kid='KMSTU_'+studentId;
        var krows=await fetch(supUrl+'/rest/v1/infinity_sessions?id=eq.'+encodeURIComponent(kid),{headers:{apikey:supKey,Authorization:'Bearer '+supKey}}).then(function(r){return r.ok?r.json():[];});
        if(krows&&krows[0]) return {table:'infinity_sessions',id:kid,data:krows[0].data||{}};
      }
      return null;
    }
    var row=await loadRow();
    if(!row) return;
    var d=row.data||{};
    d.nexoraPracticeMinutes=(d.nexoraPracticeMinutes||0)+mins;
    d.nexoraSessionCount=(d.nexoraSessionCount||0)+1;
    await fetch(supUrl+'/rest/v1/'+row.table,{method:'POST',headers:{apikey:supKey,Authorization:'Bearer '+supKey,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:row.id,data:d,updated_at:new Date().toISOString()})});
  }catch(e){}
}`
    );
  }
  fs.writeFileSync(file, h);
  console.log('OK nexora', file, !h.includes('lbspgbeqtcnjrbhiuucu'));
}

const root = path.join(__dirname, '..');
patchEngine(path.join(root, 'kamuk', 'Kamuk_Engine.html'));
patchPortal(path.join(root, 'kamuk', 'Kamuk_Student_Portal.html'));
patchNexora(path.join(root, 'kamuk', 'nexora.html'));
patchNexora(path.join(root, 'nexora.html'));

const sibling = 'C:/Users/ARMANDO/Projects/Operarive-Training-Database';
if (fs.existsSync(sibling)) {
  patchEngine(path.join(sibling, 'Kamuk_Engine.html'));
  patchPortal(path.join(sibling, 'Kamuk_Student_Portal.html'));
  if (fs.existsSync(path.join(sibling, 'nexora.html'))) {
    patchNexora(path.join(sibling, 'nexora.html'));
  }
}

console.log('done');
