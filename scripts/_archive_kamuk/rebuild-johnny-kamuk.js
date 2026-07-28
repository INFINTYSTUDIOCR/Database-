/**
 * Rebuild johnny.ramirez as a clean Kamuk portal student.
 * Preserves KPIs/notes/info where possible; resets auth + access flags.
 */
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';
const INF_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
const INF_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
const API = 'https://alice-by-infinity.onrender.com';

const USER = 'johnny.ramirez';
const PASS = 'kamuk2026';
const NEW_ID = 'KAM-JOHNNY-RAMIREZ';

async function find(url, key, table, user) {
  const r = await fetch(
    url + '/rest/v1/' + table + '?select=id,data&data->>portalUser=eq.' + encodeURIComponent(user) + '&limit=5',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  );
  return r.json();
}

async function getById(url, key, table, id) {
  const r = await fetch(
    url + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id) + '&select=id,data&limit=1',
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

async function del(url, key, table, id) {
  const r = await fetch(url + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  });
  return r.ok;
}

(async () => {
  const kamRows = await find(KAM_URL, KAM_KEY, 'kamuk_students', USER);
  const infRows = await find(INF_URL, INF_KEY, 'infinity_students', USER);
  console.log('before kamuk', kamRows.map((x) => x.id));
  console.log('before infinity', infRows.map((x) => x.id));

  const old = kamRows[0] || (await getById(KAM_URL, KAM_KEY, 'kamuk_students', 'STU-1781417043033'));
  const inf = infRows[0];
  const src = (old && old.data) || (inf && inf.data) || {};

  // Clear ALL kamuk rows with this portalUser to avoid duplicates
  for (const row of kamRows) {
    await del(KAM_URL, KAM_KEY, 'kamuk_students', row.id);
    console.log('deleted old', row.id);
  }
  // Also delete legacy STU if still present under different portalUser lookup miss
  if (old && !kamRows.find((r) => r.id === old.id)) {
    await del(KAM_URL, KAM_KEY, 'kamuk_students', old.id);
  }
  // Delete target id if exists from prior rebuild
  await del(KAM_URL, KAM_KEY, 'kamuk_students', NEW_ID);

  const info = Object.assign({}, src.info || {}, {
    name: (src.info && src.info.name) || (inf && inf.data && inf.data.info && inf.data.info.name) || 'Johnny Ramirez',
    email: (src.info && src.info.email) || '',
    trainer: (src.info && src.info.trainer) || 'Enrique Mena',
    level: (src.info && src.info.level) || 'Emerging',
    phase: (src.info && src.info.phase) || '1',
    grade: (src.info && src.info.grade) || '11'
  });

  const data = {
    id: NEW_ID,
    info,
    kpis: src.kpis || { phase1: { R: '3', IG: '3', PS: '3', RA: '3', ST: '3' } },
    notes: Array.isArray(src.notes) ? src.notes : [],
    portalUser: USER,
    portalPass: PASS,
    portalCredsCreatedAt: new Date().toISOString(),
    portalCredsRebuiltAt: new Date().toISOString(),
    status: 'active',
    infinityTermsAccepted: true,
    aliceEnabled: true,
    jillEnabled: false,
    jillProEnabled: false,
    companionEnabled: true,
    nexoraEnabled: true,
    claireEnabled: false,
    system_mode: 'alice',
    legacyIds: {
      previousKamukId: old ? old.id : null,
      infinityId: inf ? inf.id : null
    }
  };

  await upsert(KAM_URL, KAM_KEY, 'kamuk_students', NEW_ID, data);
  console.log('created', NEW_ID);

  // Verify DB
  const check = await find(KAM_URL, KAM_KEY, 'kamuk_students', USER);
  console.log('after kamuk', check.map((x) => ({
    id: x.id,
    user: x.data.portalUser,
    pass: x.data.portalPass,
    alice: x.data.aliceEnabled,
    nexora: x.data.nexoraEnabled,
    companion: x.data.companionEnabled,
    terms: x.data.infinityTermsAccepted,
    status: x.data.status
  })));

  // Verify API
  const login = await fetch(API + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: USER, password: PASS, role: 'student', product: 'kamuk' })
  });
  const d = await login.json();
  console.log('API login', login.status, {
    studentId: d.studentId,
    name: d.name,
    alice: d.aliceEnabled,
    nexora: d.nexoraEnabled,
    companion: d.companionEnabled
  });

  if (login.status !== 200 || d.studentId !== NEW_ID) {
    process.exitCode = 1;
    console.error('LOGIN VERIFY FAILED');
  } else {
    console.log('OK — use', USER, '/', PASS);
  }
})();
