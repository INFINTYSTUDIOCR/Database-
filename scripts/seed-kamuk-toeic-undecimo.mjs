/**
 * Seed Kamuk TOEIC cohort · Undécimo (11-1 / 11-2 / 11-3)
 * Tutors: Alice (Companion) + Claire TOEIC · full Kamuk access
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

const SOURCE_DIR = 'C:\\Users\\ARMANDO\\Desktop\\omceavos';
const OUT_CSV = path.join(SOURCE_DIR, 'kamuk-toeic-credenciales.csv');
const OUT_JSON = path.join(SOURCE_DIR, 'kamuk-toeic-seed-report.json');

const FILES = [
  { file: 'Kamuk 11-1 emails.xlsx', section: '11-1' },
  { file: 'Kamuk 11-2 emails.xlsx', section: '11-2' },
  { file: 'Kamuk 11-3 emails.xlsx', section: '11-3' }
];

function stripAccents(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function makePass() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let p = '';
  for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

/** "Acuña Zúñiga Emiliano" → given Emiliano, family Acuña Zúñiga */
function splitCrName(full) {
  const parts = String(full || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (parts.length === 0) return { given: 'Estudiante', family: '', display: 'Estudiante' };
  if (parts.length === 1) return { given: parts[0], family: '', display: parts[0] };
  if (parts.length === 2) {
    return { given: parts[1], family: parts[0], display: parts[1] + ' ' + parts[0] };
  }
  // 3+: last token = given (or last two if compound given like "Daniel Alonso")
  // Heuristic: if last two look like given names (short / common), keep last as given only for email match style
  const given = parts[parts.length - 1];
  const family = parts.slice(0, -1).join(' ');
  return { given, family, display: given + ' ' + family };
}

function makeId(given, family, section, n) {
  const g = stripAccents(given).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'XX';
  const f = stripAccents(family).replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'XX';
  return 'KAM-T11' + section.replace('-', '') + '-' + g + f + '-' + String(n).padStart(2, '0');
}

function makeCode(given, family) {
  const g = stripAccents(given).replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || 'X';
  const f = stripAccents(family).replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || 'X';
  const num = String(Math.floor(100 + Math.random() * 900));
  return g + f + '-KAM-' + num;
}

function portalUserFromEmail(email, used) {
  let base = String(email || '')
    .split('@')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  if (!base) base = 'estudiante';
  let user = base;
  let n = 2;
  while (used.has(user)) {
    user = base + n;
    n++;
  }
  used.add(user);
  return user;
}

function loadStudents() {
  const out = [];
  for (const spec of FILES) {
    const fp = path.join(SOURCE_DIR, spec.file);
    const wb = XLSX.readFile(fp);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    let i = 0;
    for (const row of rows) {
      const nameRaw = String(row['Nombre Estudiante'] || row.Nombre || '').trim();
      const email = String(row.Email || row.email || '')
        .trim()
        .toLowerCase();
      if (!nameRaw || !email) continue;
      i++;
      const { given, family, display } = splitCrName(nameRaw);
      out.push({
        section: spec.section,
        nameRaw,
        given,
        family,
        display,
        email,
        id: makeId(given, family, spec.section, i),
        n: i
      });
    }
  }
  return out;
}

async function listExisting() {
  const r = await fetch(KAM_URL + '/rest/v1/kamuk_students?select=id,data', {
    headers: { apikey: KAM_KEY, Authorization: 'Bearer ' + KAM_KEY }
  });
  if (!r.ok) throw new Error('list failed ' + r.status + ' ' + (await r.text()));
  return r.json();
}

async function upsert(id, data) {
  const r = await fetch(KAM_URL + '/rest/v1/kamuk_students', {
    method: 'POST',
    headers: {
      apikey: KAM_KEY,
      Authorization: 'Bearer ' + KAM_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error('upsert ' + id + ' ' + r.status + ' ' + (await r.text()));
}

function buildStudentPayload(stu, portalUser, portalPass) {
  return {
    id: stu.id,
    code: makeCode(stu.given, stu.family),
    info: {
      name: stu.display,
      nameOfficial: stu.nameRaw,
      email: stu.email,
      phone: '',
      program: 'TOEIC · Undécimo ' + stu.section,
      fee: '',
      trainer: 'Kamuk TOEIC',
      start: new Date().toISOString().split('T')[0],
      phase: '1',
      level: 'Emerging',
      score: 0,
      current_score: 0,
      grade: '11',
      section: stu.section,
      cohort: 'Kamuk TOEIC 11',
      obs: 'Cohorte TOEIC · Alice + Claire · acceso completo Kamuk'
    },
    skills: {},
    kpis: {
      phase1: { IG: '', ST: '', RA: '', PS: '', R: '' },
      phase2: {},
      phase3: {},
      phase4: {}
    },
    calibrations: [],
    notes: [
      {
        at: new Date().toISOString(),
        text: 'Alta masiva TOEIC Undécimo ' + stu.section + ' · tutores Alice + Claire TOEIC'
      }
    ],
    compliance: { scheduled: 32, attended: 0 },
    path_custom: 'toeic-undecimo',
    portalUser,
    portalPass,
    portalCredsCreatedAt: new Date().toISOString(),
    status: 'active',
    // Full Kamuk + TOEIC tutors
    aliceEnabled: true,
    companionEnabled: true,
    claireEnabled: true,
    nexoraEnabled: true,
    jillEnabled: true,
    jillProEnabled: true,
    simulationEnabled: true,
    _kamukAccessV1: true,
    product: 'kamuk'
  };
}

async function main() {
  const students = loadStudents();
  console.log('Loaded', students.length, 'students from Excel');

  const existing = await listExisting();
  const usedUsers = new Set();
  const byEmail = new Map();
  for (const row of existing) {
    const d = row.data || {};
    if (d.portalUser) usedUsers.add(String(d.portalUser).toLowerCase());
    const em = (d.info && d.info.email) || '';
    if (em) byEmail.set(String(em).toLowerCase(), row);
  }

  const report = { created: [], updated: [], failed: [] };

  for (const stu of students) {
    try {
      const prior = byEmail.get(stu.email);
      let id = stu.id;
      let portalUser;
      let portalPass;
      let data;

      if (prior && prior.data) {
        id = prior.id;
        data = Object.assign({}, prior.data);
        data.id = id;
        portalUser = data.portalUser || portalUserFromEmail(stu.email, usedUsers);
        portalPass = data.portalPass || makePass();
        usedUsers.add(String(portalUser).toLowerCase());
        // merge flags + TOEIC profile without wiping KPIs
        const fresh = buildStudentPayload(stu, portalUser, portalPass);
        data.info = Object.assign({}, data.info || {}, fresh.info);
        data.portalUser = portalUser;
        data.portalPass = portalPass;
        data.aliceEnabled = true;
        data.companionEnabled = true;
        data.claireEnabled = true;
        data.nexoraEnabled = true;
        data.jillEnabled = true;
        data.jillProEnabled = true;
        data.simulationEnabled = true;
        data._kamukAccessV1 = true;
        data.path_custom = 'toeic-undecimo';
        data.status = 'active';
        data.product = 'kamuk';
        if (!Array.isArray(data.notes)) data.notes = [];
        data.notes.push({
          at: new Date().toISOString(),
          text: 'Actualizado cohorte TOEIC · Alice + Claire ON · ' + stu.section
        });
        await upsert(id, data);
        report.updated.push({
          id,
          section: stu.section,
          name: stu.display,
          email: stu.email,
          user: portalUser,
          pass: portalPass
        });
        console.log('UPD', stu.section, portalUser, stu.display);
      } else {
        portalUser = portalUserFromEmail(stu.email, usedUsers);
        portalPass = makePass();
        data = buildStudentPayload(stu, portalUser, portalPass);
        await upsert(id, data);
        report.created.push({
          id,
          section: stu.section,
          name: stu.display,
          email: stu.email,
          user: portalUser,
          pass: portalPass
        });
        console.log('NEW', stu.section, portalUser, stu.display);
      }
    } catch (e) {
      console.error('FAIL', stu.email, e.message);
      report.failed.push({ email: stu.email, name: stu.nameRaw, error: e.message });
    }
  }

  const allCreds = [...report.created, ...report.updated];
  const csv =
    'Seccion,Nombre,Email,UsuarioPortal,Contrasena,ID\n' +
    allCreds
      .map((c) =>
        [c.section, c.name, c.email, c.user, c.pass, c.id]
          .map((x) => '"' + String(x).replace(/"/g, '""') + '"')
          .join(',')
      )
      .join('\n');
  fs.writeFileSync(OUT_CSV, csv, 'utf8');
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        totals: {
          loaded: students.length,
          created: report.created.length,
          updated: report.updated.length,
          failed: report.failed.length
        },
        report
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('\nDone. created=', report.created.length, 'updated=', report.updated.length, 'failed=', report.failed.length);
  console.log('CSV:', OUT_CSV);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
