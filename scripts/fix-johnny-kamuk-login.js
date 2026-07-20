/**
 * Sync johnny.ramirez Kamuk password to Infinity + enable Companion/Nexora/Alice.
 */
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';
const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';

const USER = 'johnny.ramirez';

async function find(url, key, table) {
  const r = await fetch(
    url + '/rest/v1/' + table + '?select=id,data&data->>portalUser=eq.' + encodeURIComponent(USER) + '&limit=1',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  );
  const rows = await r.json();
  return rows[0] || null;
}

async function upsert(url, key, table, id, data) {
  const r = await fetch(url + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error('upsert ' + table + ' ' + r.status + ' ' + (await r.text()));
}

(async () => {
  const inf = await find(INF_URL, INF_KEY, 'infinity_students');
  const kam = await find(KAM_URL, KAM_KEY, 'kamuk_students');
  if (!kam) throw new Error('Johnny not in Kamuk');
  if (!inf?.data?.portalPass) throw new Error('Johnny missing Infinity password');

  const data = Object.assign({}, kam.data);
  data.id = kam.id;
  data.portalUser = USER;
  data.portalPass = inf.data.portalPass;
  data.aliceEnabled = true;
  data.jillEnabled = false;
  data.companionEnabled = true;
  data.nexoraEnabled = true;
  data.claireEnabled = false;
  data.system_mode = 'alice';
  if (data.infinityTermsAccepted == null) data.infinityTermsAccepted = true;

  await upsert(KAM_URL, KAM_KEY, 'kamuk_students', kam.id, data);
  console.log('Updated', kam.id, {
    portalPass: data.portalPass,
    alice: data.aliceEnabled,
    nexora: data.nexoraEnabled,
    companion: data.companionEnabled
  });

  // Verify portal path + product-aware API (local expectation once deployed)
  const loginInf = await fetch('https://alice-by-infinity.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: USER, password: data.portalPass, role: 'student' })
  });
  const loginKam = await fetch('https://alice-by-infinity.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: USER, password: data.portalPass, role: 'student', product: 'kamuk' })
  });
  const dInf = await loginInf.json();
  const dKam = await loginKam.json();
  console.log('API without product →', loginInf.status, dInf.studentId);
  console.log('API product=kamuk →', loginKam.status, dKam.studentId, '(needs deploy for Kamuk id)');
})();
