/**
 * Point Kamuk apps back to dedicated Kamuk Supabase (resumed).
 * Never points Kamuk data at Infinity tables.
 */
const fs = require('fs');
const path = require('path');

const KAMUK_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAMUK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';
const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';

function setConst(h, name, value) {
  const re = new RegExp(`const ${name} = '[^']+';`);
  if (!re.test(h)) {
    console.warn('missing const', name);
    return h;
  }
  return h.replace(re, `const ${name} = '${value}';`);
}

function patchKamukApp(file) {
  let h = fs.readFileSync(file, 'utf8');
  h = setConst(h, 'SUPA_URL', KAMUK_URL);
  h = setConst(h, 'SUPA_KEY', KAMUK_KEY);
  // strip any leftover mix adapters
  h = h.replace(/\n\/\/ ── KAMUK STORAGE ADAPTER[\s\S]*?async function kamukResolveStorage\(\)\{[\s\S]*?\n\}\n/g, '\n');
  h = h.replace(/await kamukResolveStorage\(\);\n?/g, '');
  fs.writeFileSync(file, h);
  console.log(
    'app',
    path.basename(file),
    h.includes(KAMUK_URL),
    !h.includes(INF_URL) || file.includes('nexora')
  );
}

function patchNexoraSplit(file) {
  let h = fs.readFileSync(file, 'utf8');
  // Ensure KAM- branch uses Kamuk project; Infinity branch uses Infinity
  const clean = `async function savePracticeMinutes(mins){
  try{
    var studentId=localStorage.getItem('nexora_student_id');
    if(!studentId) return;
    var isKamuk=studentId.startsWith('KAM-');
    var table=isKamuk?'kamuk_students':'infinity_students';
    var supUrl=isKamuk?'${KAMUK_URL}':'${INF_URL}';
    var supKey=isKamuk?'${KAMUK_KEY}':'${INF_KEY}';
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
  fs.writeFileSync(file, h);
  console.log('nexora', path.basename(path.dirname(file)), path.basename(file), h.includes(KAMUK_URL));
}

const root = path.join(__dirname, '..');
patchKamukApp(path.join(root, 'kamuk', 'Kamuk_Engine.html'));
patchKamukApp(path.join(root, 'kamuk', 'Kamuk_Student_Portal.html'));
patchNexoraSplit(path.join(root, 'kamuk', 'nexora.html'));
patchNexoraSplit(path.join(root, 'nexora.html'));

const sibling = 'C:/Users/ARMANDO/Projects/Operarive-Training-Database';
if (fs.existsSync(sibling)) {
  patchKamukApp(path.join(sibling, 'Kamuk_Engine.html'));
  patchKamukApp(path.join(sibling, 'Kamuk_Student_Portal.html'));
  if (fs.existsSync(path.join(sibling, 'nexora.html'))) {
    patchNexoraSplit(path.join(sibling, 'nexora.html'));
  }
}

console.log('rewire kamuk done');
