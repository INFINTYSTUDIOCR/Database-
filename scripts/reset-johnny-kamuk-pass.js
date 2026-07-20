/**
 * Reset johnny.ramirez Kamuk password to a clear shared value.
 * Keeps Infinity password unchanged unless --also-infinity is passed.
 */
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

const USER = 'johnny.ramirez';
const NEW_PASS = 'kamuk2026';

(async () => {
  const r = await fetch(
    KAM_URL + '/rest/v1/kamuk_students?select=id,data&data->>portalUser=eq.' + encodeURIComponent(USER) + '&limit=1',
    { headers: { apikey: KAM_KEY, Authorization: 'Bearer ' + KAM_KEY } }
  );
  const rows = await r.json();
  const kam = rows[0];
  if (!kam) throw new Error('not found');
  const data = Object.assign({}, kam.data);
  data.id = kam.id;
  data.portalUser = USER;
  data.portalPass = NEW_PASS;
  data.aliceEnabled = true;
  data.jillEnabled = false;
  data.companionEnabled = true;
  data.nexoraEnabled = true;
  data.system_mode = 'alice';
  if (data.infinityTermsAccepted == null) data.infinityTermsAccepted = true;

  const up = await fetch(KAM_URL + '/rest/v1/kamuk_students', {
    method: 'POST',
    headers: {
      apikey: KAM_KEY,
      Authorization: 'Bearer ' + KAM_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id: kam.id, data, updated_at: new Date().toISOString() })
  });
  if (!up.ok) throw new Error(await up.text());

  const login = await fetch('https://alice-by-infinity.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: USER, password: NEW_PASS, role: 'student', product: 'kamuk' })
  });
  const d = await login.json();
  console.log('password set to', NEW_PASS);
  console.log('API', login.status, d.studentId, d.name);
})();
