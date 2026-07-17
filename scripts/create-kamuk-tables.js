/**
 * Create kamuk_* tables if DATABASE_URL or SUPABASE_DB_URL is available.
 * Otherwise prints SQL for the dashboard.
 */
const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname, 'ensure-kamuk-tables.sql'), 'utf8');

async function tryPg() {
  const url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL;
  if (!url) {
    console.log('NO_DB_URL');
    return false;
  }
  let pg;
  try {
    pg = require('pg');
  } catch (e) {
    console.log('NO_PG_MODULE');
    return false;
  }
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('CREATED_VIA_PG');
  return true;
}

async function cleanupKvMix() {
  const LIVE_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
  const LIVE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
  const headers = {
    apikey: LIVE_KEY,
    Authorization: 'Bearer ' + LIVE_KEY,
  };
  for (const pref of ['KMSTU_', 'KMUSR_', 'KMSES_', 'KMRES_']) {
    const list = await fetch(
      LIVE_URL +
        '/rest/v1/infinity_sessions?id=like.' +
        encodeURIComponent(pref) +
        '*&select=id',
      { headers }
    ).then((r) => (r.ok ? r.json() : []));
    for (const row of list || []) {
      const del = await fetch(
        LIVE_URL +
          '/rest/v1/infinity_sessions?id=eq.' +
          encodeURIComponent(row.id),
        { method: 'DELETE', headers }
      );
      console.log('deleted mix row', row.id, del.status);
    }
  }
}

async function seedMastersIfTablesExist() {
  const LIVE_URL = 'https://rxruvpfdpgowmpvydacd.supabase.co';
  const LIVE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';
  const probe = await fetch(LIVE_URL + '/rest/v1/kamuk_users?select=id&limit=1', {
    headers: { apikey: LIVE_KEY, Authorization: 'Bearer ' + LIVE_KEY },
  });
  if (!probe.ok) {
    console.log('TABLES_MISSING', probe.status);
    return false;
  }
  const users = [
    {
      id: 'USR-MASTER-001',
      data: {
        id: 'USR-MASTER-001',
        email: 'trainer@kamuk.cr',
        pass: 'KmOrt#7a2f9c',
        name: 'Kamuk Master Trainer',
        role: 'superadmin',
        department: 'admin',
        status: 'active',
      },
    },
    {
      id: 'USR-MASTER-002',
      data: {
        id: 'USR-MASTER-002',
        email: 'master@kamuk.cr',
        pass: 'KmMst#4e8b1d',
        name: 'Master General',
        role: 'master',
        department: 'admin',
        status: 'active',
      },
    },
    {
      id: 'USR-ADMIN-001',
      data: {
        id: 'USR-ADMIN-001',
        email: 'admin@kamuk.cr',
        pass: 'KmAdm#9c3e2a',
        name: 'Kamuk Admin',
        role: 'admin',
        department: 'admin',
        status: 'active',
      },
    },
  ];
  for (const u of users) {
    const r = await fetch(LIVE_URL + '/rest/v1/kamuk_users', {
      method: 'POST',
      headers: {
        apikey: LIVE_KEY,
        Authorization: 'Bearer ' + LIVE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: u.id,
        data: u.data,
        updated_at: new Date().toISOString(),
      }),
    });
    console.log('seed', u.data.email, r.status);
  }
  return true;
}

(async () => {
  await tryPg();
  await cleanupKvMix();
  await seedMastersIfTablesExist();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
