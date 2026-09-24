/**
 * Setup Robert Grego (master/full audit) + assign TOEIC Undécimo cohort,
 * wine Training Book theme + Seniors tag, email credentials from info@.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadNodemailer() {
  const candidates = [
    path.join(__dirname, '..', 'backend', 'node_modules', 'nodemailer'),
    'nodemailer'
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch (_) {}
  }
  throw new Error('nodemailer no encontrado (instalá en backend/)');
}

const KAM_URL = 'https://lbspgbeqtcnjrbhiuucu.supabase.co';
const KAM_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxic3BnYmVxdGNuanJiaGl1dWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDgzNzgsImV4cCI6MjA5NjYyNDM3OH0.j1NRrwxmCVipIlHgEPhkdQQfnhMZVK713mFq8LnvufM';

const SOURCE_DIR = 'C:\\Users\\ARMANDO\\Desktop\\omceavos';
const CREDS_CSV = path.join(SOURCE_DIR, 'kamuk-toeic-credenciales.csv');
const MAIL_REPORT = path.join(SOURCE_DIR, 'kamuk-toeic-mail-report.json');

const GREGO = {
  id: 'USR-KAM-GREGO',
  email: 'robert.grego@kamuk.cr',
  pass: 'KmRg#8d2c4a',
  name: 'Robert Grego',
  role: 'master',
  department: 'training',
  status: 'active',
  kamukAudit: true,
  fullEngagement: true,
  canViewPractice: true,
  canViewConnectionTime: true
};

const WINE = '#722F37';
const SMTP_USER = String(process.env.OE50_SMTP_USER || 'info@studioinfinitycr.com').trim();
function resolveSmtpPass() {
  const fromEnv = String(process.env.OE50_SMTP_APP_PASSWORD || '').replace(/\s+/g, '');
  if (fromEnv.length >= 8) return fromEnv;
  const fileCandidates = [
    process.env.OE50_SMTP_APP_PASSWORD_FILE,
    path.join(SOURCE_DIR, 'smtp-app-password.txt'),
    path.join(SOURCE_DIR, 'OE50_SMTP_APP_PASSWORD.txt'),
    path.join(__dirname, '..', 'backend', '.smtp-app-password')
  ].filter(Boolean);
  for (const f of fileCandidates) {
    try {
      if (fs.existsSync(f)) {
        const v = String(fs.readFileSync(f, 'utf8')).replace(/\s+/g, '');
        if (v.length >= 8) return v;
      }
    } catch (_) {}
  }
  return '';
}
const SMTP_PASS = resolveSmtpPass();
const DRY_MAIL = process.argv.includes('--dry-mail');
const BACKEND_URL = String(process.env.BACKEND_URL || 'https://alice-by-infinity.onrender.com').replace(/\/$/, '');
const ANALYZE_SECRET = String(process.env.ANALYZE_SECRET || '').trim();

async function upsert(table, id, data) {
  const r = await fetch(KAM_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      apikey: KAM_KEY,
      Authorization: 'Bearer ' + KAM_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error(table + ' ' + id + ' ' + r.status + ' ' + (await r.text()));
}

async function listStudents() {
  const r = await fetch(KAM_URL + '/rest/v1/kamuk_students?select=id,data', {
    headers: { apikey: KAM_KEY, Authorization: 'Bearer ' + KAM_KEY }
  });
  if (!r.ok) throw new Error('list students ' + r.status);
  return r.json();
}

function isToeicCohort(d) {
  if (!d) return false;
  if (d.path_custom === 'toeic-undecimo') return true;
  const program = String((d.info && d.info.program) || '');
  const cohort = String((d.info && d.info.cohort) || '');
  return /TOEIC/i.test(program) || /TOEIC/i.test(cohort) || String(d.id || '').includes('KAM-T11');
}

function parseCredsCsv() {
  if (!fs.existsSync(CREDS_CSV)) return new Map();
  const lines = fs.readFileSync(CREDS_CSV, 'utf8').split(/\r?\n/).filter(Boolean);
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]*)/g) || [];
    const clean = cols.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
    if (clean.length < 5) continue;
    const email = clean[2].toLowerCase();
    map.set(email, {
      section: clean[0],
      name: clean[1],
      email,
      user: clean[3],
      pass: clean[4],
      id: clean[5] || ''
    });
  }
  return map;
}

function mailHtml(stu) {
  const portal = 'https://studioinfinitycr.com/kamuk/';
  return (
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1e1e2e;">' +
    '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#722F37;margin-bottom:12px;">Kamuk School · TOEIC Seniors</div>' +
    '<h1 style="font-size:22px;margin:0 0 12px;color:#722F37;">Bienvenido/a, ' +
    esc(stu.name) +
    '</h1>' +
    '<p style="line-height:1.55;font-size:15px;">Ya tenés acceso a tu Training Book Kamuk (tema <strong>vino</strong> · tag <strong>Seniors</strong>) con tutores <strong>Alice</strong> y <strong>Claire TOEIC</strong>. Tu trainer es <strong>Robert Grego</strong>.</p>' +
    '<div style="background:#F5E6E8;border:1px solid #D4A5AB;border-radius:12px;padding:16px;margin:18px 0;">' +
    '<div style="font-size:12px;font-weight:700;color:#722F37;margin-bottom:8px;">TUS CREDENCIALES</div>' +
    '<p style="margin:0 0 6px;font-size:15px;"><strong>Portal:</strong> <a href="' +
    portal +
    '">' +
    portal +
    '</a></p>' +
    '<p style="margin:0 0 6px;font-size:15px;"><strong>Usuario:</strong> ' +
    esc(stu.user) +
    '</p>' +
    '<p style="margin:0;font-size:15px;"><strong>Contraseña:</strong> ' +
    esc(stu.pass) +
    '</p>' +
    '</div>' +
    '<p style="font-size:13px;color:#6b7280;line-height:1.5;">Sección: ' +
    esc(stu.section || '') +
    ' · Guardá este correo. Si no podés entrar, escribí a ' +
    esc(SMTP_USER) +
    '.</p>' +
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0;">' +
    '<p style="margin:0;font-size:12px;color:#6b7280;">Kamuk School · info@studioinfinitycr.com</p>' +
    '</div>'
  );
}

function mailText(stu) {
  return (
    'Kamuk School · TOEIC Seniors\n\n' +
    'Hola ' +
    stu.name +
    ',\n\n' +
    'Ya tenés acceso a tu Training Book (tema vino · tag Seniors) con Alice y Claire TOEIC.\n' +
    'Trainer: Robert Grego\n\n' +
    'Portal: https://studioinfinitycr.com/kamuk/\n' +
    'Usuario: ' +
    stu.user +
    '\n' +
    'Contraseña: ' +
    stu.pass +
    '\n\n' +
    'Sección: ' +
    (stu.section || '') +
    '\n' +
    '— Kamuk School · ' +
    SMTP_USER
  );
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendMails(list) {
  const report = { sent: [], failed: [], skipped: false, via: null };
  if (DRY_MAIL) {
    report.skipped = true;
    report.reason = 'dry-mail flag';
    return report;
  }
  if (ANALYZE_SECRET && (!SMTP_PASS || SMTP_PASS.length < 8)) {
    try {
      console.log('Trying backend mail endpoint…', BACKEND_URL);
      const r = await fetch(BACKEND_URL + '/kamuk/mail/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-analyze-secret': ANALYZE_SECRET
        },
        body: JSON.stringify({ recipients: list, confirmCount: list.length })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        report.via = 'backend';
        report.sent = j.sentEmails || [];
        report.failed = j.failures || [];
        return report;
      }
      console.warn('Backend mail failed:', r.status, j.error || j);
    } catch (e) {
      console.warn('Backend mail error:', e.message);
    }
  }
  if (!SMTP_PASS || SMTP_PASS.length < 8) {
    report.skipped = true;
    report.reason = 'OE50_SMTP_APP_PASSWORD no disponible (env o archivo smtp-app-password.txt en omceavos)';
    console.warn('MAIL SKIPPED:', report.reason);
    try {
      await upsert('kamuk_sessions', 'KAMUK-MAIL-JOB-TOEIC-SENIORS', {
        type: 'kamuk-credential-mail',
        status: 'pending',
        from: SMTP_USER,
        createdAt: new Date().toISOString(),
        recipients: list.map((s) => ({
          name: s.name,
          email: s.email,
          user: s.user,
          pass: s.pass,
          section: s.section
        }))
      });
      report.queuedJob = 'KAMUK-MAIL-JOB-TOEIC-SENIORS';
      console.log('Queued mail job in kamuk_sessions: KAMUK-MAIL-JOB-TOEIC-SENIORS');
    } catch (e) {
      console.warn('Could not queue mail job:', e.message);
    }
    return report;
  }
  const transport = loadNodemailer().createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  report.via = 'smtp-local';
  for (const stu of list) {
    try {
      await transport.sendMail({
        from: `"Kamuk School" <${SMTP_USER}>`,
        to: stu.email,
        replyTo: SMTP_USER,
        subject: 'Kamuk TOEIC Seniors — tus credenciales de acceso',
        text: mailText(stu),
        html: mailHtml(stu)
      });
      report.sent.push(stu.email);
      console.log('MAIL OK', stu.email);
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) {
      report.failed.push({ email: stu.email, error: e.message });
      console.error('MAIL FAIL', stu.email, e.message);
    }
  }
  return report;
}

async function main() {
  console.log('1) Upsert Robert Grego (master + full engagement)…');
  await upsert('kamuk_users', GREGO.id, GREGO);
  const roster = {
    userId: GREGO.id,
    name: GREGO.name,
    email: GREGO.email,
    exp: 'Master Trainer · Kamuk TOEIC Seniors · full engagement audit',
    bio: 'Trainer principal de la cohorte TOEIC Undécimo (Seniors). Acceso completo a práctica, conexiones al portal y tiempo estimado conectado.',
    nexoraEnabled: true,
    fullEngagement: true,
    canViewPractice: true,
    canViewConnectionTime: true
  };
  await upsert('kamuk_sessions', 'ROSTER-' + GREGO.id, roster);
  console.log('   ', GREGO.email, GREGO.pass, 'role=', GREGO.role);
  console.log('   Roster profile OK');

  console.log('2) Tag wine + Seniors + assign trainer on TOEIC cohort…');
  const rows = await listStudents();
  const creds = parseCredsCsv();
  const mailList = [];
  let updated = 0;
  for (const row of rows) {
    const d = row.data || {};
    if (!isToeicCohort(d)) continue;
    d.info = Object.assign({}, d.info || {}, {
      trainer: GREGO.name,
      tag: 'Seniors',
      tags: ['Seniors'],
      bookTheme: 'wine',
      bookAccent: WINE,
      cohort: 'Kamuk TOEIC 11 · Seniors'
    });
    d.tags = Array.from(new Set([...(d.tags || []), 'Seniors']));
    d.bookTheme = 'wine';
    d.bookAccent = WINE;
    d.aliceEnabled = true;
    d.companionEnabled = true;
    d.claireEnabled = true;
    d.nexoraEnabled = true;
    d.jillEnabled = true;
    d.jillProEnabled = true;
    d._kamukAccessV1 = true;
    if (!Array.isArray(d.notes)) d.notes = [];
    const noteText = 'Asignado a Robert Grego · Training Book vino · tag Seniors';
    if (!d.notes.some((n) => n && n.text === noteText)) {
      d.notes.push({ at: new Date().toISOString(), text: noteText });
    }
    await upsert('kamuk_students', row.id, d);
    updated++;
    const em = String((d.info && d.info.email) || '').toLowerCase();
    const c = creds.get(em);
    if (c) {
      mailList.push({
        name: (d.info && d.info.name) || c.name,
        email: em,
        user: d.portalUser || c.user,
        pass: d.portalPass || c.pass,
        section: (d.info && d.info.section) || c.section
      });
    } else if (d.portalUser && d.portalPass && em) {
      mailList.push({
        name: (d.info && d.info.name) || em,
        email: em,
        user: d.portalUser,
        pass: d.portalPass,
        section: (d.info && d.info.section) || ''
      });
    }
  }
  console.log('   Students updated:', updated, 'mail queue:', mailList.length);

  console.log('3) Send credentials from', SMTP_USER, '…');
  const mailReport = await sendMails(mailList);
  fs.writeFileSync(
    MAIL_REPORT,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        grego: { email: GREGO.email, pass: GREGO.pass, role: GREGO.role },
        studentsUpdated: updated,
        mail: mailReport
      },
      null,
      2
    ),
    'utf8'
  );
  console.log('Report:', MAIL_REPORT);
  if (mailReport.skipped) {
    console.log('\n⚠ Correos NO enviados aún (' + mailReport.reason + ').');
    console.log('  Definí OE50_SMTP_APP_PASSWORD y corré:');
    console.log('  node scripts/setup-kamuk-toeic-grego.mjs');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
