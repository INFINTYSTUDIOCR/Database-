/**
 * Generate portalUser/portalPass for all kamuk_students missing credentials.
 */
const SUPA_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

function makePass() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

function makeUser(name, id, used) {
  const parts = String(name || '').trim().split(/\s+/);
  let base = ((parts[0] || '') + (parts[1] ? '.' + parts[1] : '')).toLowerCase().replace(/[^a-z.]/g, '');
  if (!base) base = 'estudiante';
  let user = base;
  let n = 2;
  while (used.has(user)) {
    user = base + n;
    n++;
  }
  // if still colliding with id-based uniqueness needed
  if (used.has(user)) user = base + '.' + String(id).replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase();
  used.add(user);
  return user;
}

async function main() {
  const r = await fetch(SUPA_URL + '/rest/v1/kamuk_students?select=id,data', {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }
  });
  if (!r.ok) throw new Error('list failed ' + r.status + ' ' + (await r.text()));
  const rows = await r.json();
  const used = new Set();
  rows.forEach((row) => {
    if (row.data && row.data.portalUser) used.add(String(row.data.portalUser).toLowerCase());
  });

  const created = [];
  for (const row of rows) {
    const s = row.data || {};
    s.id = row.id;
    if (s.portalUser && s.portalPass) {
      used.add(String(s.portalUser).toLowerCase());
      continue;
    }
    const name = (s.info && s.info.name) || row.id;
    s.portalUser = makeUser(name, row.id, used);
    s.portalPass = makePass();
    s.portalCredsCreatedAt = new Date().toISOString();
    if (!s.status) s.status = 'active';

    const up = await fetch(SUPA_URL + '/rest/v1/kamuk_students', {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: row.id, data: s, updated_at: new Date().toISOString() })
    });
    if (!up.ok) {
      console.error('FAIL', row.id, await up.text());
      continue;
    }
    created.push({ id: row.id, name, user: s.portalUser, pass: s.portalPass });
  }

  console.log('Created credentials for', created.length, 'students');
  console.log('Usuario,Contraseña,Nombre,ID');
  created.forEach((c) => console.log([c.user, c.pass, c.name, c.id].join(',')));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
