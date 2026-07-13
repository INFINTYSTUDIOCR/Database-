require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { signToken, verifyToken, requireAuth, optionalAuth, JWT_EXPIRY_SEC, JWT_EXPIRY_STUDENT_SEC, JWT_SECRET } = require('./auth');
const Companion = require('./alice-companion');
const JillPro = require('./jill-companion');
const JillCanonRouter = require('./jill-canon-router');
const Billing = require('./stripe-billing');
const JillBilling = require('./jill-billing');

const app = express();
app.set('trust proxy', 1);

app.post('/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const result = await Billing.handleWebhook(req.body, sig, sbSet, sbGetOne);
    return res.status(result.status || 200).json(result);
  } catch (err) {
    console.error('Billing webhook error:', err.message);
    return res.status(500).json({ error: 'webhook_failed' });
  }
});

app.use(express.json({ limit: '2mb' }));

// ── SECURITY HEADERS ─────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=()');
  next();
});

// ── CORS (allowed origins only) ──────────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  'https://infintystudiocr.github.io',
  'https://studioinfinitycr.com',
  'https://www.studioinfinitycr.com',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];
const ENV_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
/** Env se SUMA a defaults (no reemplaza) — evita que falte www y tumbe el portal. */
const ALLOWED_ORIGINS = Array.from(new Set(DEFAULT_ALLOWED_ORIGINS.concat(ENV_ALLOWED_ORIGINS)));

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  } catch (e) {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (isLocalDevOrigin(origin)) return true;
  if (ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o.replace(/\/$/, '')))) {
    return true;
  }
  // Apex <-> www equivalentes para el mismo host de marca
  try {
    const u = new URL(origin);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    return ALLOWED_ORIGINS.some((o) => {
      try {
        const ao = new URL(o);
        const ah = ao.hostname.replace(/^www\./i, '').toLowerCase();
        return ao.protocol === u.protocol && ah === host;
      } catch (e) {
        return false;
      }
    });
  } catch (e) {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS blocked:', origin);
    return callback(new Error('CORS not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Bridge-Secret'],
  maxAge: 86400
}));

if (!JWT_SECRET) {
  console.warn('⚠ JWT_SECRET not set — set JWT_SECRET or ANALYZE_SECRET in Render env for production auth.');
}

const { ANTHROPIC_API_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, VERIFY_TOKEN,
        ANALYZE_SECRET, PORT = 3000 } = process.env;
// Same Supabase project as Student Portal / Engine (Render env overrides when set)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rxruvpfdpgowmpvydacd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cnV2cGZkcGdvd21wdnlkYWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzQ4MjAsImV4cCI6MjA5NjcxMDgyMH0.WzwMUnsuZfzkP2QoQzJnnvvgnG-saWkn1IQVDv-_roE';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Raw fetch wrapper — bypasses SDK bug with Render's Node environment
async function claudeCall({ model, max_tokens, system, messages }) {
  const body = { model: model || 'claude-haiku-4-5-20251001', max_tokens: max_tokens || 500, messages };
  if (system) body.system = system;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `HTTP ${r.status}`);
  return data;
}

async function sbGet(table) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('sbGet: SUPABASE_URL or SUPABASE_KEY not configured');
    return [];
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error(`sbGet ${table} failed: ${r.status} ${t.slice(0, 120)}`);
      return [];
    }
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`sbGet ${table} error:`, err.message);
    return [];
  }
}

async function sbSet(table, id, data) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('sbSet: SUPABASE not configured');
    return false;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
                 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id, data, updated_at: new Date().toISOString() })
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error(`sbSet ${table}/${id} failed: ${r.status} ${t.slice(0, 160)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`sbSet ${table}/${id} error:`, err.message);
    return false;
  }
}

async function sbGetOne(table, id) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !id) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=id,data&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (err) {
    console.warn(`sbGetOne ${table}/${id}:`, err.message);
    return null;
  }
}

async function sbQuery(table, queryString) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryString}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`sbQuery ${table}:`, err.message);
    return [];
  }
}

async function sbDelete(table, id) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !id) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return r.ok;
  } catch (err) {
    console.warn(`sbDelete ${table}/${id}:`, err.message);
    return false;
  }
}

async function sbFindStudentByPortalLogin(portalUser, password) {
  const loginUser = String(portalUser || '').trim().toLowerCase();
  if (!loginUser) return null;
  const rows = await sbQuery(
    'infinity_students',
    `select=id,data&data->>portalUser=eq.${encodeURIComponent(loginUser)}&limit=10`
  );
  return rows.find(r => r.data && r.data.portalPass === password) || null;
}

const Brain = require('./nexus-brain');
Brain.initNexusBrain({ sbGetOne, sbSet });

const SuperBrain = require('./super-brain');
const JillDrillBrain = require('./jill-drill-brain');
const InfinityVictory = require('./infinity-victory');
const JohnDoctrine = require('./john-teaching-doctrine');
const SharedLearner = require('./shared-learner');
SuperBrain.initSuperBrain({ sbGetOne, sbSet, sbGet: sbGet, brain: Brain });
JillDrillBrain.initJillDrillBrain({ sbSet, sbGetOne, superBrain: SuperBrain });

// Seed M001/M002 canon → Super Cerebro (idempotente; no rompe si SB off)
setTimeout(() => {
  SuperBrain.seedCanonTeachingModules()
    .then((r) => {
      if (r && r.published && r.published.length) {
        console.log('Super Brain canon seed:', r.published.map((x) => x.canonKey).join(', '));
      }
    })
    .catch((e) => console.warn('Super Brain canon seed:', e.message));
}, 2500);

const JillClassAnalyzer = require('./jill-class-analyzer');
JillClassAnalyzer.initClassAnalyzer({ superBrain: SuperBrain, sbSet, sbGetOne });

const TrainerModel = require('./trainer-model');
const JillStructureCoach = require('./jill-structure-coach');
const JillMethodOS = require('./jill-method-os');
const JillTrainerInsights = require('./jill-trainer-insights');
const JillCalibration = require('./jill-calibration');
const JillF0Gate = require('./jill-f0-gate.js');

const TikTokJill = require('./tiktok-jill');
TikTokJill.initTikTokJill({ sbGetOne, sbSet });

// ── OPENING ROTATION LOG (Alice / Jill / Nexora session starts) ──
const OPENING_LOG_MAX = 8;

function resolveActorKey({ student, req, profile }) {
  if (student?.id) return String(student.id);
  if (req?.auth?.studentId) return String(req.auth.studentId);
  if (req?.auth?.sub) return String(req.auth.sub);
  if (profile?.account) return 'acct-' + String(profile.account).replace(/\W/g, '');
  return 'anon';
}

/** Brain LLM cache must be per-student — never share personalized greetings across actors. */
function brainScopeExtra(student, req, suffix) {
  const actorKey = resolveActorKey({ student, req });
  const display = getStudentDisplayName(student);
  return `${actorKey}:${display}:${suffix || ''}`;
}

function openingLogId(actorKey, product) {
  const safe = String(actorKey || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return `OPENING-${product}-${safe}`;
}

async function getRecentOpenings(actorKey, product) {
  if (!actorKey) return [];
  try {
    const row = await sbGetOne('infinity_sessions', openingLogId(actorKey, product));
    return (row?.data?.openings || []).slice(-OPENING_LOG_MAX);
  } catch (e) {
    return [];
  }
}

async function recordOpening(actorKey, product, text, meta = {}) {
  if (!actorKey || !text) return;
  const snippet = String(text).replace(/\s+/g, ' ').trim().slice(0, 280);
  if (snippet.length < 8) return;
  try {
    const id = openingLogId(actorKey, product);
    const row = await sbGetOne('infinity_sessions', id);
    const data = row?.data || { product, actorKey, openings: [] };
    data.openings = [...(data.openings || []), { text: snippet, ts: new Date().toISOString(), ...meta }].slice(-OPENING_LOG_MAX);
    await sbSet('infinity_sessions', id, data);
  } catch (e) {
    console.error('recordOpening:', e.message);
  }
}

function buildOpeningVariationNote(recent, lang) {
  if (!recent.length) return '';
  const lines = recent.map((o, i) => `${i + 1}. "${o.text}"`).join('\n');
  if (lang === 'es') {
    return `\n\nAPERTURAS RECIENTES DE ESTE ESTUDIANTE (NO repetir la misma pregunta ni un parafraseo cercano):\n${lines}\nInventá un saludo y UNA pregunta nuevos, con ángulo distinto (tema, tono o situación).`;
  }
  return `\n\nRECENT OPENINGS FOR THIS STUDENT (do NOT repeat the same opening question or a close paraphrase):\n${lines}\nInvent a fresh greeting and ONE new opening question with a different angle (topic, tone, or situation).`;
}

function extractOpeningSnippet(text) {
  const t = String(text || '').trim();
  const q = t.match(/[^.!?]*\?/);
  return (q ? q[0] : t.split(/[.!]/)[0] || t).trim().slice(0, 280);
}

// ── HEALTHCHECK ──────────────────────────────────────────────
app.get('/', (req, res) => res.send(`Infinity AI — Jill · Alice · Nexora — OK (${APP1_BUILD})`));
app.get('/health', (req, res) => res.json({
  ok: true,
  build: APP1_BUILD,
  companion: true,
  brain: Brain.isBrainEnabled(),
  superBrain: SuperBrain.isSuperBrainEnabled(),
  services: ['jill', 'jill/drill', 'jill/victory-metric', 'alice', 'nexora', 'demo/stream', 'nexora/stream', 'brain/stats', 'super-brain', 'companion']
}));

// ── KEY DIAGNOSTIC (temp) ────────────────────────────────────
app.get('/keycheck', async (req, res) => {
  const k = process.env.ANTHROPIC_API_KEY || '';
  const preview = k ? k.slice(0,12)+'...'+k.slice(-4) : '(NOT SET)';
  // Test via raw fetch (bypasses SDK)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': k,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:10, messages:[{role:'user',content:'Say OK'}] })
    });
    const data = await r.json();
    return res.json({ key: preview, status: r.ok ? 'WORKS' : 'API_ERROR', httpStatus: r.status, data });
  } catch(e) {
    return res.json({ key: preview, status: 'NETWORK_FAIL', error: e.message });
  }
});

// ── RATE LIMIT ───────────────────────────────────────────────
const TUTOR_LIMIT = 200;
const COOLDOWN_MS = 3 * 60 * 60 * 1000;

/** Per-student Companion caps (preguntas = user turns). Matched by name/id. */
const COMPANION_QUOTA_OVERRIDES = [
  {
    nameRe: /\beddy[\s._-]*flores\b/i,
    maxQuestions: 25,
    cooldownMs: 5 * 60 * 60 * 1000
  }
];

function studentDisplayBlob(student) {
  return [
    student?.id,
    student?.portalUser,
    student?.name,
    student?.info?.name,
    student?.info?.fullName
  ].filter(Boolean).join(' ');
}

function resolveCompanionQuota(student) {
  if (!student) return null;
  const blob = studentDisplayBlob(student);
  for (const rule of COMPANION_QUOTA_OVERRIDES) {
    if (Array.isArray(rule.ids) && rule.ids.some((id) => String(id) === String(student.id))) {
      return { maxQuestions: rule.maxQuestions, cooldownMs: rule.cooldownMs };
    }
    if (rule.nameRe && rule.nameRe.test(blob)) {
      return { maxQuestions: rule.maxQuestions, cooldownMs: rule.cooldownMs };
    }
  }
  const cfg = student.companionConfig && typeof student.companionConfig === 'object'
    ? student.companionConfig
    : null;
  const maxQ = cfg && Number(cfg.maxQuestions);
  if (maxQ > 0) {
    const hours = Number(cfg.cooldownHours);
    return {
      maxQuestions: maxQ,
      cooldownMs: (hours > 0 ? hours : 5) * 60 * 60 * 1000
    };
  }
  return null;
}

function formatCooldownWait(msLeft) {
  const mins = Math.max(1, Math.ceil(msLeft / 60000));
  if (mins < 60) return `${mins} minuto${mins === 1 ? '' : 's'}`;
  const hours = Math.ceil(mins / 60);
  return `${hours} hora${hours === 1 ? '' : 's'}`;
}

async function checkTutorLimit(sid, tutor, table) {
  if (!sid) return { ok: true };
  const t = table || 'infinity_sessions';
  const prefix = ({ alice: 'ALICE', jill: 'JILL', nexora: 'NEXORA' }[tutor] || 'ALICE') + '-LIMIT';
  try {
    const rows = await sbGet(t);
    const row = rows.find(r => r.id === `${prefix}-${sid}`);
    let d = row?.data || { count: 0, resetAt: null };
    if (d.resetAt && Date.now() > new Date(d.resetAt).getTime()) { d.count = 0; d.resetAt = null; }
    if (d.count >= TUTOR_LIMIT) {
      if (!d.resetAt) { d.resetAt = new Date(Date.now() + COOLDOWN_MS).toISOString(); await sbSet(t, `${prefix}-${sid}`, d); }
      const wait = formatCooldownWait(new Date(d.resetAt).getTime() - Date.now());
      return { ok: false, wait };
    }
    d.count++;
    await sbSet(t, `${prefix}-${sid}`, d);
    return { ok: true };
  } catch (e) { return { ok: true }; }
}

/** Alice Companion only: question quota for matched students (e.g. Eddy Flores = 25 / 5h). */
async function checkCompanionQuestionLimit(student, table) {
  const quota = resolveCompanionQuota(student);
  if (!quota || !student?.id) return { ok: true };
  const t = table || 'infinity_sessions';
  const key = `COMPANION-Q-${student.id}`;
  try {
    const rows = await sbGet(t);
    const row = rows.find((r) => r.id === key);
    let d = row?.data || { count: 0, resetAt: null };
    if (d.resetAt && Date.now() > new Date(d.resetAt).getTime()) {
      d.count = 0;
      d.resetAt = null;
    }
    if (d.count >= quota.maxQuestions) {
      if (!d.resetAt) {
        d.resetAt = new Date(Date.now() + quota.cooldownMs).toISOString();
        await sbSet(t, key, d);
      }
      const wait = formatCooldownWait(new Date(d.resetAt).getTime() - Date.now());
      return {
        ok: false,
        wait,
        maxQuestions: quota.maxQuestions,
        reply:
          `You've used all ${quota.maxQuestions} Companion questions for now. Come back in ${wait}.\n` +
          `ALICE: Llegaste a ${quota.maxQuestions} preguntas en Companion. Descansá ${wait} y volvé.`
      };
    }
    d.count++;
    await sbSet(t, key, d);
    return { ok: true, remaining: Math.max(0, quota.maxQuestions - d.count) };
  } catch (e) {
    return { ok: true };
  }
}

async function checkLimit(sid, table) {
  return checkTutorLimit(sid, 'alice', table);
}

// ── LOGIN RATE LIMIT (brute force) — solo cuenta intentos fallidos ──
const loginRateMap = new Map();
const LOGIN_MAX_ATTEMPTS = 40;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

function checkLoginRateLimit(ip) {
  const now = Date.now();
  let entry = loginRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginRateMap.set(ip, entry);
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { ok: false, waitMin: Math.max(1, Math.ceil((entry.resetAt - now) / 60000)) };
  }
  return { ok: true };
}

function recordLoginFailure(ip) {
  const now = Date.now();
  let entry = loginRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  }
  entry.count++;
  loginRateMap.set(ip, entry);
}

function clearLoginRateLimit(ip) {
  loginRateMap.delete(ip);
}

const AUTH_ROLES = ['student', 'trainer', 'superadmin', 'master'];
const requireProductAuth = requireAuth(['student', 'trainer', 'superadmin', 'master']);
const requireMasterAccess = requireAuth(['superadmin', 'master']);

function requireMasterOrAnalyzeSecret(req, res, next) {
  const secret = req.headers['x-analyze-secret'] || req.body?.secret || req.query?.secret;
  if (ANALYZE_SECRET && secret === ANALYZE_SECRET) {
    req.auth = { role: 'superadmin', sub: 'ANALYZE-SECRET', name: 'Master' };
    return next();
  }
  return requireMasterAccess(req, res, next);
}

function isAnalyzeSecretMatch(secret) {
  return !!(ANALYZE_SECRET && secret && secret === ANALYZE_SECRET);
}

/** QA battery (7+7): live AI demos with ANALYZE_SECRET — public site stays buffered. */
function isQaLiveDemo(req, body) {
  const secret = req.headers['x-analyze-secret'] || body?.secret || body?.qaSecret;
  const qaLive = body?.qaLive === true || req.headers['x-qa-live'] === '1';
  return qaLive && isAnalyzeSecretMatch(secret);
}

app.get('/brain/stats', requireProductAuth, async (req, res) => {
  try {
    return res.json(await Brain.brainGetStats());
  } catch (err) {
    return res.status(500).json({ error: 'Brain stats unavailable' });
  }
});

function assertStudentScope(req, studentId) {
  if (req.auth.role === 'student' && studentId && studentId !== req.auth.studentId) {
    return false;
  }
  return true;
}

function isStudentSuspended(student) {
  if (!student) return false;
  if (student.status === 'suspended') return true;
  if (student.infinityTermsAccepted === false) return true;
  return false;
}

function normalizeCompanionEnabled(student) {
  if (!student) return false;
  const v = student.companionEnabled;
  return v === true || v === 'true' || v === 1;
}

function studentAccessFlags(student) {
  if (!student) return {};
  return {
    status: student.status || 'active',
    nexoraEnabled: isNexoraEnabledForStudent(student),
    aliceEnabled: typeof student.aliceEnabled === 'boolean'
      ? student.aliceEnabled
      : (student.system_mode || 'jill') === 'alice',
    jillEnabled: typeof student.jillEnabled === 'boolean'
      ? student.jillEnabled
      : (student.system_mode || 'jill') !== 'alice',
    jillProEnabled: student.jillProEnabled === true,
    companionEnabled: normalizeCompanionEnabled(student)
  };
}

function isNexoraEnabledForStudent(student) {
  if (!student) return false;
  if (!student.nexoraEnabled) return false;
  if (typeof student.aliceEnabled === 'boolean') return student.aliceEnabled;
  return (student.system_mode || 'jill') === 'alice';
}

async function assertNexoraStudentAccess(req, res, bodyStudent) {
  if (req.auth.role !== 'student') return bodyStudent || resolveNexoraStudent(bodyStudent, req);
  const student = await loadStudentRecordForAuth(req, bodyStudent);
  if (!student?.id) {
    res.status(403).json({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' });
    return null;
  }
  if (!assertStudentScope(req, student.id)) {
    res.status(403).json({ error: 'Student scope mismatch' });
    return null;
  }
  if (isStudentSuspended(student)) {
    res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    return null;
  }
  if (!isNexoraEnabledForStudent(student)) {
    res.status(403).json({ error: 'Nexora access disabled', code: 'NEXORA_DISABLED' });
    return null;
  }
  return student;
}

function isTutorEnabledForStudent(student, tutor, opts = {}) {
  if (!student) return true;
  if (tutor === 'alice') {
    const sessionType = opts.sessionType || null;
    if (sessionType === 'companion' && normalizeCompanionEnabled(student)) return true;
    if (opts.allowCompanionProduct && normalizeCompanionEnabled(student)) return true;
    if (typeof student.aliceEnabled === 'boolean') return student.aliceEnabled;
    return (student.system_mode || 'jill') === 'alice';
  }
  if (tutor === 'jill') {
    const sessionType = opts.sessionType || null;
    if (sessionType === 'companion' && !!student.jillProEnabled) return true;
    if (opts.allowJillProProduct && !!student.jillProEnabled) return true;
    if (typeof student.jillEnabled === 'boolean') return student.jillEnabled;
    return (student.system_mode || 'jill') !== 'alice';
  }
  return true;
}

async function loadStudentRecordForAuth(req, bodyStudent) {
  if (req.auth.role === 'student' && req.auth.studentId) {
    try {
      const row = await sbGetOne('infinity_students', req.auth.studentId);
      if (row?.data) {
        const merged = { ...row.data, id: req.auth.studentId };
        // Client is source of truth for live calibration + study prefs until synced
        if (bodyStudent?.jillCalibration) merged.jillCalibration = bodyStudent.jillCalibration;
        if (bodyStudent?.aiProfile?.learningPrefs) {
          merged.aiProfile = { ...(merged.aiProfile || {}), ...(bodyStudent.aiProfile || {}) };
          merged.aiProfile.learningPrefs = {
            ...(merged.aiProfile.learningPrefs || {}),
            ...bodyStudent.aiProfile.learningPrefs
          };
        }
        return merged;
      }
    } catch (e) { /* fall through */ }
  }
  return bodyStudent || null;
}

async function assertStudentTutorAccess(req, res, tutor, bodyStudent, opts = {}) {
  if (req.auth.role !== 'student') return bodyStudent || null;
  const student = await loadStudentRecordForAuth(req, bodyStudent);
  if (!assertStudentScope(req, student?.id)) {
    res.status(403).json({ error: 'Student scope mismatch' });
    return null;
  }
  if (isStudentSuspended(student)) {
    res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    return null;
  }
  const sessionType = opts.sessionType || req.body?.sessionType || null;
  const accessOpts = { sessionType, ...opts };
  if (!isTutorEnabledForStudent(student, tutor, accessOpts)) {
    res.status(403).json({ error: 'Tutor access disabled', tutorOff: tutor });
    return null;
  }
  return student;
}

// ── AUTH ─────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  try {
    const { user, password, role } = req.body || {};
    const ip = getClientIp(req);
    const rl = checkLoginRateLimit(ip);
    if (!rl.ok) {
      return res.status(429).json({ error: 'Too many login attempts', waitMin: rl.waitMin });
    }
    if (!user || !password || !role) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    if (!JWT_SECRET) {
      return res.status(503).json({ error: 'Auth not configured on server' });
    }

    const loginUser = String(user).trim().toLowerCase();

    if (role === 'student') {
      const match = await sbFindStudentByPortalLogin(user, password);
      if (!match) {
        recordLoginFailure(ip);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (match.data.status === 'suspended') {
        return res.status(403).json({ error: 'Account suspended' });
      }
      clearLoginRateLimit(ip);
      const token = signToken({
        sub: match.id,
        role: 'student',
        studentId: match.id,
        name: match.data.info?.name || loginUser
      }, JWT_EXPIRY_STUDENT_SEC);
      const st = match.data;
      return res.json({
        token,
        expiresIn: JWT_EXPIRY_STUDENT_SEC,
        role: 'student',
        studentId: match.id,
        name: st.info?.name || loginUser,
        ...studentAccessFlags(st)
      });
    }

    if (role === 'trainer') {
      const masterEmail = (process.env.MASTER_TRAINER_EMAIL || 'trainer@infinity.cr').toLowerCase();
      const masterPass = process.env.MASTER_TRAINER_PASS || process.env.ANALYZE_SECRET || 'nexus2025';
      if (loginUser === masterEmail && password === masterPass) {
        clearLoginRateLimit(ip);
        const token = signToken({
          sub: 'USR-MASTER',
          role: 'superadmin',
          name: process.env.MASTER_TRAINER_NAME || 'Master Trainer',
          email: masterEmail
        });
        return res.json({
          token,
          expiresIn: JWT_EXPIRY_SEC,
          role: 'superadmin',
          name: process.env.MASTER_TRAINER_NAME || 'Master Trainer'
        });
      }
      const rows = await sbGet('infinity_users');
      const match = rows.find(r =>
        r.data &&
        String(r.data.email || '').trim().toLowerCase() === loginUser &&
        r.data.pass === password
      );
      if (!match) {
        recordLoginFailure(ip);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (match.data.status === 'suspended') {
        return res.status(403).json({ error: 'Account suspended' });
      }
      clearLoginRateLimit(ip);
      const trainerRole = match.data.role || 'trainer';
      const token = signToken({
        sub: match.id,
        role: trainerRole,
        name: match.data.name,
        email: match.data.email,
        department: match.data.department
      });
      return res.json({
        token,
        expiresIn: JWT_EXPIRY_SEC,
        role: trainerRole,
        name: match.data.name
      });
    }

    return res.status(400).json({ error: 'Invalid role' });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

app.get('/auth/verify', requireProductAuth, async (req, res) => {
  const payload = {
    ok: true,
    role: req.auth.role,
    sub: req.auth.sub,
    name: req.auth.name,
    studentId: req.auth.studentId || null
  };
  if (req.auth.role === 'student' && req.auth.studentId) {
    try {
      const row = await sbGetOne('infinity_students', req.auth.studentId);
      const student = row?.data;
      if (!student || isStudentSuspended(student)) {
        return res.status(403).json({ ok: false, error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
      }
      Object.assign(payload, studentAccessFlags(student));
    } catch (e) {
      return res.status(503).json({ ok: false, error: 'Could not verify student access' });
    }
  }
  res.json(payload);
});

// ── DEMO: IP LIMITS + RESPONSE BUFFER ────────────────────────
const DEMO_LIMITS = {
  // Public website: ONE demo ever per IP per product (no daily reset). Pay to continue.
  alice:  { sessionsLifetime: 1, maxSteps: 0 },
  alice_companion: { sessionsLifetime: 1, maxSteps: 0, messagesLifetime: 12 },
  jill:   { sessionsLifetime: 1, maxSteps: 0 },
  nexora: { sessionsLifetime: 1, maxSteps: 0 },
  claire: { sessionsPerDay: 3, messagesPerDay: 30 },
  tts:    { sessionsLifetime: 1, messagesLifetime: 40, ttsLifetime: 40 }
};

/** Demo products that never reset (one free try forever unless premium). */
const DEMO_LIFETIME_SERVICES = new Set(['alice', 'alice_companion', 'jill', 'nexora', 'tts']);

const APP1_BUILD = '20260711-relevance';
const JILL_BRAIN_VER = 'v42-es-tts-fix';
const ALICE_BRAIN_VER = 'v26-get-it-straight-ing';

function isCompanionDemoSession(session) {
  return !!(session && (session.demoMode === 'companion' || session.scenario === 'companion'));
}

function demoLimitService(session) {
  if (isCompanionDemoSession(session)) return 'alice_companion';
  return session?.service || 'alice';
}

/** 0 = unlimited (Alice Companion Premium). Otherwise session.maxSteps from trial/paid tier. */
function demoSessionMaxSteps(session) {
  if (typeof session?.maxSteps === 'number') return session.maxSteps;
  if (isCompanionDemoSession(session)) return DEMO_LIMITS.alice_companion.maxSteps;
  return (DEMO_LIMITS[session?.service] || DEMO_LIMITS.alice).maxSteps;
}

function demoStreamMeta(session, done, maxSteps, extra) {
  const buffered = !!(session && (session.buffered || session.live === false));
  return Object.assign({
    step: session.step,
    done,
    maxSteps,
    live: !buffered,
    buffered,
    trialEnd: !!(done && isCompanionDemoSession(session) && !session.premium),
    product: isCompanionDemoSession(session) ? 'alice_companion' : session.service,
    turnsLeft: maxSteps > 0 ? Math.max(0, maxSteps - session.step) : null
  }, extra || {});
}

function demoSessionDone(session) {
  const max = demoSessionMaxSteps(session);
  return max > 0 && session.step >= max;
}
const IP_DAY_MS = 24 * 60 * 60 * 1000;
const demoResponseCache = new Map();
const DEMO_CACHE_MAX = 300;

let DEMO_BUFFER = {};
try {
  const bufCandidates = [
    path.join(__dirname, '../config/demo-buffer.json'),
    path.join(__dirname, 'config/demo-buffer.json')
  ];
  for (const bufPath of bufCandidates) {
    if (fs.existsSync(bufPath)) {
      DEMO_BUFFER = JSON.parse(fs.readFileSync(bufPath, 'utf8'));
      console.log('demo-buffer loaded:', bufPath);
      break;
    }
  }
  if (!Object.keys(DEMO_BUFFER).length) console.warn('demo-buffer.json not found in config paths');
} catch (e) {
  console.warn('demo-buffer.json not loaded:', e.message);
}

const ELEVEN_KEY = process.env.ELEVENLABS_KEY || '';
// Alice tutor + Alice Companion — same ElevenLabs voice (do not diverge).
const ALICE_VOICE_ID = 'r1KmysJdVYZjJCm4mL3b';
const SUPER_BRAIN_VOICE_ID = process.env.SUPER_BRAIN_VOICE_ID || 'Gubgw9l4dtIoQA9YZHgx';
// Jill: por defecto misma voz que Alice. Para forzar una voz latina distinta: JILL_VOICE_ID en Render.
const JILL_VOICE_ID = (process.env.JILL_VOICE_ID || '').trim() || ALICE_VOICE_ID;
const CLAIRE_VOICE_ID = process.env.CLAIRE_VOICE_ID || 'FGLJyeekUzxl8M3CTG9M';

function loadVoicesConfig() {
  const candidates = [
    path.join(__dirname, '../config/voices.json'),
    path.join(__dirname, 'config/voices.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { /* next path */ }
  }
  return {};
}

function getDemoVoiceProfiles() {
  const cfg = loadVoicesConfig();
  const nd = cfg.nexora_demo || {};
  const starFromEnv = (process.env.NEXORA_DEMO_MALE_VOICE_ID || '').trim();
  const csFromEnv = (process.env.NEXORA_DEMO_FEMALE_VOICE_ID || '').trim();
  const starFromFile = (nd.star_interviewer?.voiceId || '').trim();
  const csFromFile = (nd.cs_client?.voiceId || JILL_VOICE_ID).trim();
  const starId = starFromEnv || starFromFile || ALICE_VOICE_ID;
  const csId = csFromEnv || csFromFile;
  return {
    jill: {
      voiceId: JILL_VOICE_ID,
      label: cfg.jill?.label || 'Jill',
      gender: 'female',
      lang: 'es-CR',
      source: process.env.JILL_VOICE_ID ? 'env-JILL_VOICE_ID' : 'elevenlabs-account'
    },
    alice: {
      voiceId: ALICE_VOICE_ID,
      label: cfg.alice?.label || 'Alice',
      gender: 'female',
      source: 'elevenlabs-account'
    },
    nexora_star: {
      voiceId: starId,
      label: nd.star_interviewer?.label || 'Interviewer',
      gender: 'male',
      source: starFromEnv ? 'NEXORA_DEMO_MALE_VOICE_ID' : (starFromFile ? 'voices.json' : 'alice-fallback'),
      needsMaleVoice: !starFromEnv && !starFromFile
    },
    nexora_cs: {
      voiceId: csId,
      label: nd.cs_client?.label || 'Maria Santos',
      gender: 'female',
      source: csFromEnv ? 'NEXORA_DEMO_FEMALE_VOICE_ID' : 'jill-voices.json'
    }
  };
}

function getDemoTtsAllowlist() {
  const p = getDemoVoiceProfiles();
  const cfg = loadVoicesConfig();
  const nd = cfg.nexora_demo || {};
  return new Set([
    ALICE_VOICE_ID, JILL_VOICE_ID, CLAIRE_VOICE_ID,
    p.nexora_star.voiceId, p.nexora_cs.voiceId,
    nd.star_interviewer?.voiceId,
    nd.cs_client?.voiceId,
    'r1KmysJdVYZjJCm4mL3b', 'NoOVOzCQFLOvtsMoNcdT', 'bfGb7JTLUnZebZRiFYyq',
    '1a0nAYA3FcNQcMMfbddY', 'NyZqLdjqUb8SpOUKIlWT', 'ztyYYqlYMny7nllhThgo',
    'NIkIuJZ8oQMuKZqwKtnm', '8WqHCYyrnUqoK70Px5EJ', 'b4XCIIupgo5eH7TxhBNk'
  ].filter(Boolean));
}

const NEXORA_MALE_VOICE_IDS = new Set([
  'bfGb7JTLUnZebZRiFYyq', 'eVKQybPTL0poBPxBa8L6', '8WqHCYyrnUqoK70Px5EJ',
  'b4XCIIupgo5eH7TxhBNk', 'Xh5OictnmgRO4dff7pLm', 'NIkIuJZ8oQMuKZqwKtnm', 'IP2syKL31S2JthzSSfZH'
]);
const NEXORA_FEMALE_VOICE_IDS = new Set([
  'r1KmysJdVYZjJCm4mL3b', 'NoOVOzCQFLOvtsMoNcdT', 'KeMlo4IJd6GMKdqA5lLY',
  'NyZqLdjqUb8SpOUKIlWT', 'ztyYYqlYMny7nllhThgo', 'J60xcCIM7ET7HMi7hMZu',
  '1a0nAYA3FcNQcMMfbddY', 'k6aNMn2EN3T8vpJSBhQw'
]);
const NEXORA_FEMALE_FIRST_NAMES = new Set([
  'Sarah', 'Jennifer', 'Elizabeth', 'Margaret', 'Emily', 'Ashley', 'Karen', 'Lisa',
  'Amanda', 'Patricia', 'Linda', 'Rachel', 'Sandra', 'Jessica', 'Nicole', 'Maria',
  'Diana', 'Victoria', 'Elena', 'Hannah', 'Olivia', 'Emma', 'Priya', 'Ananya',
  'Sofia', 'Michelle', 'Angela', 'Laura', 'Rebecca', 'Stephanie', 'Melissa',
  'Deborah', 'Nancy', 'Susan', 'Chloe', 'Grace', 'Natalie', 'Brooke', 'Charlotte',
  'Sophie', 'Natasha', 'Olga', 'Irina', 'Mei', 'Li', 'Yan', 'Greta', 'Lena',
  'Camila', 'Lucia', 'Valentina', 'Neha', 'Deepa', 'Katya', 'Anya', 'Anna'
]);
const NEXORA_MALE_FIRST_NAMES = new Set([
  'James', 'Michael', 'William', 'David', 'Robert', 'John', 'Brian', 'Kevin',
  'Mark', 'Steven', 'Daniel', 'Christopher', 'Carlos', 'Raj', 'Arjun', 'Vikram',
  'Oliver', 'Harry', 'George', 'Jack', 'Thomas', 'Wei', 'Jun', 'Miguel', 'Diego',
  'Luis', 'Pablo', 'Andres', 'Hans', 'Klaus', 'Dmitri', 'Ivan', 'Aiden', 'Ethan',
  'Noah', 'Liam', 'Jacob', 'Nathan', 'Tyler', 'Ryan', 'Eric', 'Adam', 'Jason',
  'Andrew', 'Joshua', 'Benjamin', 'Samuel', 'Gabriel', 'Lucas', 'Henry', 'Leo'
]);

function enforceNexoraTtsVoice(firstName, voiceId) {
  const first = String(firstName || '').trim().split(/\s+/)[0];
  if (!first) return voiceId;
  const female = NEXORA_FEMALE_FIRST_NAMES.has(first);
  const male = NEXORA_MALE_FIRST_NAMES.has(first);
  const vid = String(voiceId || '').trim();
  if (female) {
    if (!vid || NEXORA_MALE_VOICE_IDS.has(vid)) {
      return process.env.NEXORA_DEMO_FEMALE_VOICE_ID || JILL_VOICE_ID || ALICE_VOICE_ID;
    }
    return vid;
  }
  if (male && NEXORA_FEMALE_VOICE_IDS.has(vid)) {
    return process.env.NEXORA_DEMO_MALE_VOICE_ID || 'bfGb7JTLUnZebZRiFYyq';
  }
  return vid || voiceId;
}

function getDemoVoiceProfileFor(service, scenario) {
  const profiles = getDemoVoiceProfiles();
  if (service === 'alice') return profiles.alice;
  if (service === 'jill') return profiles.jill;
  if (service === 'nexora') {
    return scenario === 'customer_service' ? profiles.nexora_cs : profiles.nexora_star;
  }
  return profiles.alice;
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function ipStorageKey(ip) {
  return 'DEMO-IP-' + crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

function loadDemoIpWhitelist() {
  const fromEnv = (process.env.DEMO_IP_WHITELIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  let fromFile = [];
  const candidates = [
    path.join(__dirname, '../config/demo-ip-whitelist.json'),
    path.join(__dirname, 'config/demo-ip-whitelist.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        fromFile = (j.ips || []).map(String);
        break;
      }
    } catch (e) { /* next */ }
  }
  return new Set([...fromEnv, ...fromFile]);
}

const DEMO_IP_WHITELIST = loadDemoIpWhitelist();
['38.210.166.95'].forEach(ip => DEMO_IP_WHITELIST.add(ip));

function isDemoIpWhitelisted(ip) {
  if (!ip || ip === 'unknown') return false;
  return DEMO_IP_WHITELIST.has(ip.trim());
}

async function resetDemoLimitsForIp(ip) {
  const { id, data } = await getIpRecord(ip);
  const day = todayKey();
  Object.keys(DEMO_LIMITS).forEach(service => {
    data[service] = { day, sessions: 0, messages: 0, tts: 0 };
  });
  await saveIpRecord(id, data);
  return { id, ip };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getIpRecord(ip) {
  const id = ipStorageKey(ip);
  try {
    const row = await sbGetOne('infinity_sessions', id);
    return { id, data: row?.data || {} };
  } catch (e) {
    return { id, data: {} };
  }
}

async function saveIpRecord(id, data) {
  try { await sbSet('infinity_sessions', id, data); } catch (e) {}
}

async function checkDemoIpLimit(ip, service, { action, premiumToken } = {}) {
  if (premiumToken && await Billing.isPremiumActive(premiumToken, sbGetOne)) {
    return { ok: true, sessionsLeft: 999, premium: true };
  }
  if (!ip || ip === 'unknown') {
    const lim = DEMO_LIMITS[service];
    return { ok: true, sessionsLeft: lim?.sessionsLifetime || lim?.sessionsPerDay || 1 };
  }
  if (isDemoIpWhitelisted(ip)) {
    return { ok: true, sessionsLeft: 999, whitelisted: true };
  }
  const limits = DEMO_LIMITS[service];
  if (!limits) return { ok: true };

  const lifetime = DEMO_LIFETIME_SERVICES.has(service);
  const sessionCap = limits.sessionsLifetime || limits.sessionsPerDay || 1;
  const messageCap = limits.messagesLifetime || limits.messagesPerDay || null;
  const ttsCap = limits.ttsLifetime || limits.ttsPerDay || messageCap || 40;

  const { id, data } = await getIpRecord(ip);
  const bucket = data[service] || { sessions: 0, messages: 0, tts: 0 };
  // Lifetime demos never reset. Other services (e.g. claire) still reset daily.
  if (!lifetime) {
    const day = todayKey();
    if (bucket.day !== day) {
      bucket.day = day;
      bucket.sessions = 0;
      bucket.messages = 0;
      bucket.tts = 0;
    }
  }

  if (action === 'session') {
    if (bucket.sessions >= sessionCap) {
      return {
        ok: false,
        reason: 'sessions',
        wait: lifetime ? null : '24 horas',
        sessionsLeft: 0,
        lifetime: !!lifetime
      };
    }
    bucket.sessions++;
  }

  if (action === 'message') {
    bucket.messages = (bucket.messages || 0) + 1;
    if (messageCap && bucket.messages > messageCap) {
      data[service] = bucket;
      await saveIpRecord(id, data);
      return { ok: false, reason: 'messages', wait: lifetime ? null : '24 horas', sessionsLeft: 0, lifetime: !!lifetime };
    }
  }

  if (action === 'tts') {
    bucket.tts = (bucket.tts || 0) + 1;
    if (bucket.tts > ttsCap) {
      data[service] = bucket;
      await saveIpRecord(id, data);
      return { ok: false, reason: 'tts', wait: lifetime ? null : '24 horas', sessionsLeft: 0, lifetime: !!lifetime };
    }
  }

  data[service] = bucket;
  await saveIpRecord(id, data);
  return {
    ok: true,
    sessionsLeft: Math.max(0, sessionCap - bucket.sessions),
    messagesLeft: messageCap ? Math.max(0, messageCap - (bucket.messages || 0)) : null,
    lifetime: !!lifetime
  };
}

function bufferKey(service, scenario, step) {
  return service + ':' + (scenario || 'default') + ':' + step;
}

function cacheDemoResponse(key, reply) {
  if (demoResponseCache.size >= DEMO_CACHE_MAX) {
    demoResponseCache.delete(demoResponseCache.keys().next().value);
  }
  demoResponseCache.set(key, reply);
}

function getDemoBuffer(service, scenario) {
  if (service === 'alice' && scenario === 'companion') {
    return DEMO_BUFFER.alice_companion || DEMO_BUFFER.alice;
  }
  if (service === 'alice') return DEMO_BUFFER.alice;
  if (service === 'jill') return DEMO_BUFFER.jill;
  if (service === 'nexora') {
    return scenario === 'customer_service' ? DEMO_BUFFER.nexora_cs : DEMO_BUFFER.nexora_star;
  }
  return null;
}

function stripDemoMd(text) {
  return String(text || '').replace(/\*\*/g, '');
}

function demoBufferMaxSteps(buf) {
  if (!buf || !Array.isArray(buf.steps)) return 4;
  return buf.steps.length + 1;
}

function demoBufferOpening(buf) {
  // Fixed script text (no name injection) so ElevenLabs audio stays cacheable.
  return stripDemoMd(buf?.start || '');
}

function demoBufferNextReply(buf, step) {
  const steps = (buf && buf.steps) || [];
  if (step > steps.length) {
    return {
      reply: stripDemoMd(buf?.finish?.reply || 'Thanks for trying the demo!'),
      done: true,
      evaluation: buf?.finish?.evaluation || null
    };
  }
  return {
    reply: stripDemoMd(steps[step - 1] || steps[steps.length - 1] || ''),
    done: false,
    evaluation: null
  };
}

const ALICE_EVAL_CONNECTORS = [
  'however', 'on top of that', 'even though', 'therefore', 'besides', 'so far',
  'in other words', 'despite', 'as a result', 'in addition', 'rather than', 'as long as'
];

function detectConnectors(text, list) {
  const items = list || ALICE_EVAL_CONNECTORS;
  const lower = (text || '').toLowerCase();
  return items.filter(c => lower.includes(c));
}

function buildAliceSessionMetrics(history) {
  const users = (history || []).filter(m => m.role === 'user' && String(m.content || '').trim());
  const userText = users
    .map(m => String(m.content).replace(/ALICE:.*/gis, '').replace(/\s+/g, ' ').trim())
    .join(' ');
  const words = userText.match(/\b[a-zA-Z']+\b/g) || [];
  const connectors = detectConnectors(userText);
  const turns = users.length;
  const avgWords = turns ? words.length / turns : 0;
  return { turns, wordCount: words.length, avgWords, connectors, userText };
}

function scoreAliceSessionFromMetrics(metrics) {
  const { turns, wordCount, connectors, avgWords } = metrics;
  if (!turns) return 55;
  let score = 50;
  score += Math.min(22, turns * 5);
  score += Math.min(16, Math.floor(wordCount / 10));
  score += Math.min(24, connectors.length * 8);
  if (avgWords >= 14) score += 8;
  else if (avgWords >= 8) score += 5;
  else if (avgWords >= 4) score += 2;
  return Math.round(Math.min(97, Math.max(54, score)));
}

function aliceEvalConnectorsMissed(used) {
  return ALICE_EVAL_CONNECTORS.filter(c => !used.includes(c)).slice(0, 4);
}

function enrichEvaluation(baseEval, history) {
  const userText = (history || []).filter(m => m.role === 'user').map(m => m.content).join(' ');
  const found = detectConnectors(userText);
  const ev = JSON.parse(JSON.stringify(baseEval));
  if (found.length && ev.connectors_found !== undefined) ev.connectors_found = found;
  if (found.length && ev.connectors_suggested) {
    ev.connectors_suggested = ev.connectors_suggested.filter(c => !found.includes(c));
  }
  if (found.length >= 2 && ev.overall_score) ev.overall_score = Math.min(95, ev.overall_score + 10);
  else if (found.length === 1 && ev.overall_score) ev.overall_score = Math.min(90, ev.overall_score + 5);
  if (history) {
    const metrics = buildAliceSessionMetrics(history);
    ev.overall_score = scoreAliceSessionFromMetrics(metrics);
    ev.connectors_used = metrics.connectors;
    if (ev.connectors_missed === undefined) ev.connectors_missed = aliceEvalConnectorsMissed(metrics.connectors);
  }
  return ev;
}

async function saveDemoKb({ service, scenario, history, evaluation, consent, ip }) {
  if (!consent) return;
  const day = todayKey();
  const kbId = 'DEMO-KB-' + day;
  try {
    const row = await sbGetOne('infinity_sessions', kbId);
    const data = row?.data || { sessions: [] };
    data.sessions.push({
      service, scenario,
      turns: (history || []).length,
      evaluation,
      connectors: detectConnectors((history || []).filter(m => m.role === 'user').map(m => m.content).join(' ')),
      ts: new Date().toISOString(),
      ipHash: ipStorageKey(ip || 'unknown')
    });
    if (data.sessions.length > 500) data.sessions = data.sessions.slice(-500);
    await sbSet('infinity_sessions', kbId, data);
  } catch (e) {
    console.error('Demo KB save failed:', e.message);
  }
}

const DEMO_SESSIONS_MEM = new Map();
const DEMO_SESSION_TTL_MS = 60 * 60 * 1000;

function demoMemKey(sessionId) {
  return String(sessionId || '');
}

function pruneDemoSessionsMem() {
  if (DEMO_SESSIONS_MEM.size <= 800) return;
  const cutoff = Date.now() - DEMO_SESSION_TTL_MS;
  for (const [k, v] of DEMO_SESSIONS_MEM) {
    if (!v || v.at < cutoff) DEMO_SESSIONS_MEM.delete(k);
  }
}

async function getDemoSession(sessionId) {
  if (!sessionId) return null;
  const key = demoMemKey(sessionId);
  const mem = DEMO_SESSIONS_MEM.get(key);
  if (mem && Date.now() - mem.at < DEMO_SESSION_TTL_MS) return mem.data;
  try {
    const row = await sbGetOne('infinity_sessions', 'DEMO-SESSION-' + sessionId);
    if (row?.data) {
      DEMO_SESSIONS_MEM.set(key, { data: row.data, at: Date.now() });
      return row.data;
    }
  } catch (e) { /* fall through */ }
  return null;
}

async function saveDemoSession(sessionId, data) {
  if (!sessionId) return false;
  const key = demoMemKey(sessionId);
  DEMO_SESSIONS_MEM.set(key, { data, at: Date.now() });
  pruneDemoSessionsMem();
  try {
    const ok = await sbSet('infinity_sessions', 'DEMO-SESSION-' + sessionId, data);
    if (!ok) console.error('saveDemoSession supabase failed:', sessionId);
  } catch (e) {
    console.error('saveDemoSession error:', e.message);
  }
  return true;
}

app.post('/demo/start', async (req, res) => {
  try {
    const { service, scenario, consent, name, onboarding, premiumToken } = req.body || {};
    if (!consent) return res.status(400).json({ error: 'Consent required' });
    if (!['alice', 'jill', 'nexora'].includes(service)) return res.status(400).json({ error: 'Invalid service' });

    const sc = scenario || (service === 'nexora' ? 'star' : 'default');
    const companionDemo = service === 'alice' && sc === 'companion';
    const limitService = companionDemo ? 'alice_companion' : service;
    const ip = getClientIp(req);
    const ipLimit = await checkDemoIpLimit(ip, limitService, { action: 'session', premiumToken });
    if (!ipLimit.ok) {
      return res.status(429).json({
        error: 'limit',
        message: companionDemo
          ? 'Ya usaste tu demo gratis. Para seguir, desbloqueá Alice Companion o escribinos por WhatsApp.'
          : 'Ya usaste tu demo gratis. Para seguir, escribinos por WhatsApp o elegí un plan.',
        wait: ipLimit.wait,
        product: companionDemo ? 'alice_companion' : service
      });
    }

    const guest = name || 'Guest';
    const sessionId = crypto.randomUUID();
    const isPremium = !!(premiumToken && await Billing.isPremiumActive(premiumToken, sbGetOne));
    const qaLive = isQaLiveDemo(req, req.body || {});
    if (!companionDemo && !qaLive) {
      return res.status(403).json({
        error: 'demo_by_request',
        message: 'Los demos de Jill, Alice Coach y Nexora son con cita. Solicitá una demo en hablemos.html — Alice Companion sigue en try-alice.html.',
        requestUrl: 'https://studioinfinitycr.com/hablemos.html#consulta'
      });
    }
    // Public Companion demo: scripted buffer only. Live AI solo QA (qaLive + secret).
    const useLive = !!qaLive;

    if (!useLive) {
      const buf = getDemoBuffer(service, sc);
      if (!buf) return res.status(503).json({ error: 'buffer_missing', message: 'Demo script unavailable.' });
      const reply = demoBufferOpening(buf);
      const sessionMaxSteps = demoBufferMaxSteps(buf);
      const session = {
        service,
        scenario: sc,
        step: 0,
        name: guest,
        onboarding: onboarding || null,
        demoMode: companionDemo ? 'companion' : 'standard',
        maxSteps: sessionMaxSteps,
        premium: false,
        buffered: true,
        live: false,
        consent: true,
        ip,
        history: [{ role: 'assistant', content: reply }],
        createdAt: new Date().toISOString(),
        apiCalls: 0
      };
      await saveDemoSession(sessionId, session);
      return res.json({
        sessionId,
        reply,
        step: 0,
        maxSteps: sessionMaxSteps,
        buffered: true,
        live: false,
        premium: false,
        trial: companionDemo,
        product: companionDemo ? 'alice_companion' : service,
        sessionsLeft: ipLimit.sessionsLeft,
        whitelisted: !!ipLimit.whitelisted,
        voiceProfile: getDemoVoiceProfileFor(service, sc)
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'live_unavailable', message: 'Live Companion requires AI — try again shortly.' });
    }

    const reply = await demoGenerateOpening(service, sc, guest, onboarding);
    const liveMaxSteps = (companionDemo && isPremium && !qaLive)
      ? 0
      : (DEMO_LIMITS[limitService] || DEMO_LIMITS.alice).maxSteps;
    const session = {
      service,
      scenario: sc,
      step: 0,
      name: guest,
      onboarding: onboarding || null,
      demoMode: qaLive ? 'qa' : (companionDemo ? 'companion' : 'standard'),
      maxSteps: liveMaxSteps,
      premium: !!(companionDemo && isPremium),
      buffered: false,
      live: true,
      consent: true,
      ip,
      history: [{ role: 'assistant', content: reply }],
      createdAt: new Date().toISOString(),
      apiCalls: 1
    };
    await saveDemoSession(sessionId, session);

    return res.json({
      sessionId,
      reply,
      step: 0,
      maxSteps: liveMaxSteps,
      buffered: false,
      live: true,
      premium: !!(companionDemo && isPremium),
      trial: companionDemo && !isPremium,
      qaLive: !!qaLive,
      product: companionDemo ? 'alice_companion' : service,
      sessionsLeft: ipLimit.sessionsLeft,
      whitelisted: !!ipLimit.whitelisted,
      voiceProfile: getDemoVoiceProfileFor(service, sc)
    });
  } catch (err) {
    console.error('Demo start error:', err.message);
    return res.status(500).json({ error: 'Demo unavailable', message: err.message });
  }
});

app.post('/demo/message', async (req, res) => {
  try {
    const { sessionId, message, premiumToken } = req.body || {};
    if (!sessionId || !message?.trim()) return res.status(400).json({ error: 'Missing sessionId or message' });

    const session = await getDemoSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session expired. Start a new demo.' });

    const ip = getClientIp(req);
    const ipLimit = await checkDemoIpLimit(ip, demoLimitService(session), { action: 'message', premiumToken });
    if (!ipLimit.ok) {
      return res.status(429).json({
        error: 'limit',
        message: isCompanionDemoSession(session)
          ? 'Ya usaste tu demo gratis. Para seguir, desbloqueá Companion o escribinos por WhatsApp.'
          : 'Ya usaste tu demo gratis. Para seguir, escribinos por WhatsApp o elegí un plan.',
        wait: ipLimit.wait,
        product: isCompanionDemoSession(session) ? 'alice_companion' : session.service
      });
    }

    const maxSteps = demoSessionMaxSteps(session);
    session.history.push({ role: 'user', content: message.trim() });
    session.step++;
    session.apiCalls = (session.apiCalls || 0) + 1;

    // Website demos: scripted buffer (full reply, no live AI cut-offs)
    if (session.buffered || session.live === false) {
      const buf = getDemoBuffer(session.service, session.scenario);
      if (!buf) return res.status(503).json({ error: 'buffer_missing' });
      const next = demoBufferNextReply(buf, session.step);
      session.history.push({ role: 'assistant', content: next.reply });
      await saveDemoSession(sessionId, session);
      const payload = {
        reply: next.reply,
        step: session.step,
        done: next.done,
        buffered: true,
        live: false,
        maxSteps,
        trialEnd: next.done && isCompanionDemoSession(session),
        product: isCompanionDemoSession(session) ? 'alice_companion' : session.service
      };
      if (next.done && next.evaluation) {
        payload.evaluation = enrichEvaluation(next.evaluation, session.history);
        await saveDemoKb({
          service: session.service,
          scenario: session.scenario,
          history: session.history,
          evaluation: payload.evaluation,
          consent: session.consent,
          ip
        });
      }
      return res.json(payload);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'live_unavailable', message: 'Live Companion requires AI — try again shortly.' });
    }

    const done = demoSessionDone(session);
    let reply;

    if (done) {
      reply = await demoGenerateClosingReply(session);
    } else {
      reply = await demoGenerateReply(session);
    }

    session.history.push({ role: 'assistant', content: reply });
    await saveDemoSession(sessionId, session);

    const payload = {
      reply, step: session.step, done, buffered: false, live: true, maxSteps,
      trialEnd: done && isCompanionDemoSession(session) && !session.premium,
      product: isCompanionDemoSession(session) ? 'alice_companion' : session.service
    };
    if (done) {
      payload.evaluation = await demoGenerateEvaluation(session);
      await saveDemoKb({
        service: session.service,
        scenario: session.scenario,
        history: session.history,
        evaluation: payload.evaluation,
        consent: session.consent,
        ip
      });
    }

    return res.json(payload);
  } catch (err) {
    console.error('Demo message error:', err.message);
    return res.status(500).json({ error: 'Demo unavailable', message: err.message });
  }
});

app.post('/demo/stream', async (req, res) => {
  try {
    const { sessionId, message, premiumToken } = req.body || {};
    if (!sessionId || !message?.trim()) return res.status(400).json({ error: 'Missing sessionId or message' });

    const session = await getDemoSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session expired. Start a new demo.' });

    const ip = getClientIp(req);
    const ipLimit = await checkDemoIpLimit(ip, demoLimitService(session), { action: 'message', premiumToken });
    if (!ipLimit.ok) {
      return res.status(429).json({
        error: 'limit',
        message: isCompanionDemoSession(session)
          ? 'Ya usaste tu demo gratis. Para seguir, desbloqueá Companion o escribinos por WhatsApp.'
          : 'Ya usaste tu demo gratis. Para seguir, escribinos por WhatsApp o elegí un plan.',
        wait: ipLimit.wait,
        product: isCompanionDemoSession(session) ? 'alice_companion' : session.service
      });
    }

    const maxSteps = demoSessionMaxSteps(session);
    session.history.push({ role: 'user', content: message.trim() });
    session.step++;
    session.apiCalls = (session.apiCalls || 0) + 1;

    // Buffered website demos: full scripted reply over SSE (no live model, no mid-cut)
    if (session.buffered || session.live === false) {
      const buf = getDemoBuffer(session.service, session.scenario);
      if (!buf) return res.status(503).json({ error: 'buffer_missing' });
      const next = demoBufferNextReply(buf, session.step);
      session.history.push({ role: 'assistant', content: next.reply });
      await saveDemoSession(sessionId, session);
      let evaluation = null;
      if (next.done && next.evaluation) {
        evaluation = enrichEvaluation(next.evaluation, session.history);
        await saveDemoKb({
          service: session.service,
          scenario: session.scenario,
          history: session.history,
          evaluation,
          consent: session.consent,
          ip
        });
      }
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.flushHeaders?.();
      const meta = demoStreamMeta(session, next.done, maxSteps, { buffered: true, live: false });
      meta.live = false;
      meta.buffered = true;
      res.write(`data: ${JSON.stringify({ meta })}\n\n`);
      // Send full reply in one chunk (t = demo-stream.js / QA battery; token = legacy alias)
      res.write(`data: ${JSON.stringify({ t: next.reply, token: next.reply })}\n\n`);
      if (evaluation) res.write(`data: ${JSON.stringify({ evaluation })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'live_unavailable', message: 'Live Companion requires AI — try again shortly.' });
    }

    const done = demoSessionDone(session);

    const streamCfg = getDemoStreamConfig(session, done);
    let fullText = '';
    const demoExtra = `${session.service}:${session.scenario || 'default'}:step${session.step}`;
    const brain = await Brain.brainGetLLM('demo', session.service, message.trim(), demoExtra);

    if (brain.hit) {
      fullText = brain.reply;
      if (session.service === 'jill') fullText = parseJillResponse(fullText).reply || fullText;
      if (session.service === 'nexora') {
        const ctx = getDemoNexoraContext(session.scenario, session.name);
        fullText = finishNexoraReply(fullText, ctx.profile, buildNexoraSystemPrompt(ctx).scType);
      }
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'X-Brain-LLM': 'HIT'
      });
      res.write(`data: ${JSON.stringify({ t: fullText })}\n\n`);
      session.history.push({ role: 'assistant', content: fullText.trim() });
      await saveDemoSession(sessionId, session);
      res.write(`data: ${JSON.stringify({ meta: demoStreamMeta(session, done, maxSteps, { brainCache: true }) })}\n\n`);
      if (done) {
        const evaluation = await demoGenerateEvaluation(session);
        res.write(`data: ${JSON.stringify({ evaluation })}\n\n`);
        await saveDemoKb({ service: session.service, scenario: session.scenario, history: session.history, evaluation, consent: session.consent, ip });
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: streamCfg.max_tokens,
        stream: true,
        system: streamCfg.system,
        messages: streamCfg.messages
      })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: err?.error?.message || 'API error' })}\n\n`);
      return res.end();
    }

    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done: streamDone, value } = await reader.read();
      if (streamDone) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
            fullText += evt.delta.text;
            res.write(`data: ${JSON.stringify({ t: evt.delta.text })}\n\n`);
          } else if (evt.type === 'message_stop') {
            break;
          }
        } catch {}
      }
    }

    if (session.service === 'jill') {
      fullText = parseJillResponse(fullText).reply;
    }
    if (session.service === 'nexora') {
      const ctx = getDemoNexoraContext(session.scenario, session.name);
      fullText = finishNexoraReply(fullText, ctx.profile, buildNexoraSystemPrompt(ctx).scType);
    }

    if (brain.hash && fullText.trim().length > 8) {
      Brain.brainSetLLM(brain.hash, 'demo', session.service, message.trim(), fullText.trim(), demoExtra).catch(() => {});
    }

    session.history.push({ role: 'assistant', content: fullText.trim() });
    await saveDemoSession(sessionId, session);

    const meta = demoStreamMeta(session, done, maxSteps);
    res.write(`data: ${JSON.stringify({ meta })}\n\n`);

    if (done) {
      const evaluation = await demoGenerateEvaluation(session);
      res.write(`data: ${JSON.stringify({ evaluation })}\n\n`);
      await saveDemoKb({
        service: session.service,
        scenario: session.scenario,
        history: session.history,
        evaluation,
        consent: session.consent,
        ip
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Demo stream error:', err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Demo stream unavailable', message: err.message });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.post('/demo/nexora-lab/stream', async (req, res) => {
  try {
    const { demoSessionId, ...body } = req.body || {};
    if (!demoSessionId) return res.status(400).json({ error: 'Missing demoSessionId' });
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'live_unavailable', message: 'Live demo requires AI.' });
    }

    const session = await getDemoSession(demoSessionId);
    if (!session || session.service !== 'nexora') {
      return res.status(403).json({ error: 'Invalid or expired demo session' });
    }

    const ip = getClientIp(req);
    const ipLimit = await checkDemoIpLimit(ip, 'nexora', { action: 'message' });
    if (!ipLimit.ok && !ipLimit.whitelisted) {
      return res.status(429).json({ error: 'limit', message: 'Daily demo message limit reached.' });
    }

    const ctx = await prepareNexoraRequest(body);
    await streamAnthropicSSE(res, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: ctx.systemPrompt + '\nNEVER cut off mid-sentence. Always finish the spoken line completely.',
      messages: ctx.msgs
    });
  } catch (err) {
    console.error('Demo nexora lab stream error:', err.message);
    if (!res.headersSent) return res.status(500).json({ error: 'Stream unavailable' });
    res.end();
  }
});

app.post('/demo/nexora-lab/eval', async (req, res) => {
  try {
    const { demoSessionId, transcript, scenario, profile, agentName, talkTime, holdEvents, transferred } = req.body || {};
    if (!demoSessionId) return res.status(400).json({ error: 'Missing demoSessionId' });

    const session = await getDemoSession(demoSessionId);
    if (!session || session.service !== 'nexora') {
      return res.status(403).json({ error: 'Invalid or expired demo session' });
    }

    const ip = getClientIp(req);
    await checkDemoIpLimit(ip, 'nexora', { action: 'message' });

    const evalPrompt = `You are evaluating a customer service call simulation.

Agent: ${agentName || 'Agent'}
Scenario: ${scenario?.title || 'Customer Service'} — ${scenario?.desc || ''}
Client: ${profile?.name || 'Client'} (mood: ${scenario?.mood || 'normal'})
Talk time: ${talkTime || 0} seconds
Hold events: ${JSON.stringify(holdEvents || [])}
Transferred to supervisor: ${transferred ? 'YES' : 'NO'}

Transcript:
${transcript || '(no transcript)'}

IMPORTANT: Do NOT penalize the agent for asking the client to repeat or clarify (e.g. "what did you say", "can you repeat", "sorry I didn't catch that") when the client's line was incomplete, inaudible, or cut off. That is valid professional recovery — not poor performance.

Respond ONLY with valid JSON, no markdown:
{
  "overall_score": 78,
  "client_satisfaction": 7.5,
  "wins": ["specific win 1", "specific win 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "connectors_used": ["however", "on top of that"],
  "connectors_missed": ["despite", "therefore"],
  "hold_feedback": "comment about hold usage if applicable",
  "transferred_feedback": "comment about supervisor transfer if applicable",
  "verdict": "Start by celebrating 1-2 specific things the agent did well. Be warm and specific. Then mention 1-2 concrete improvements. End with an encouraging line.",
  "practice_minutes": ${Math.ceil((talkTime || 60) / 60)}
}`;

    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: 'You evaluate call simulations. Respond ONLY with valid JSON. No markdown.',
      messages: [{ role: 'user', content: evalPrompt }]
    });

    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return res.json(JSON.parse(clean));
  } catch (err) {
    console.error('Demo nexora lab eval error:', err.message);
    return res.status(500).json({ error: 'Evaluation failed' });
  }
});

app.get('/demo/my-ip', (req, res) => {
  const ip = getClientIp(req);
  return res.json({
    ip,
    whitelisted: isDemoIpWhitelisted(ip),
    demoLimitPerService: 1
  });
});

app.post('/demo/reset-limits', async (req, res) => {
  try {
    const ip = getClientIp(req);
    if (!isDemoIpWhitelisted(ip)) {
      return res.status(403).json({ error: 'forbidden', message: 'Only whitelisted owner IPs can reset demo limits.' });
    }
    await resetDemoLimitsForIp(ip);
    return res.json({ ok: true, ip, whitelisted: true, message: 'Demo limits reset for today.' });
  } catch (err) {
    return res.status(500).json({ error: 'Reset failed' });
  }
});

app.get('/demo/status', async (req, res) => {
  try {
    const ip = getClientIp(req);
    const service = req.query.service || 'alice';
    const { data } = await getIpRecord(ip);
    const bucket = data[service] || { sessions: 0, messages: 0 };
    const limits = DEMO_LIMITS[service] || DEMO_LIMITS.alice;
    const sessionCap = limits.sessionsLifetime || limits.sessionsPerDay || 1;
    const sessionsUsed = bucket.sessions || 0;
    return res.json({
      service,
      sessionsUsed,
      sessionsLeft: Math.max(0, sessionCap - sessionsUsed),
      maxSteps: limits.maxSteps || 4,
      lifetime: DEMO_LIFETIME_SERVICES.has(service)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Status unavailable' });
  }
});

app.get('/billing/config', (req, res) => {
  try {
    return res.json(Billing.publicConfig());
  } catch (err) {
    return res.status(500).json({ error: 'config_unavailable' });
  }
});

app.get('/billing/status', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.json({ active: false });
    const active = await Billing.isPremiumActive(token, sbGetOne);
    const row = await sbGetOne('infinity_sessions', 'ALICE-PREMIUM-' + token);
    return res.json({
      active,
      expiresAt: row?.data?.expiresAt || null,
      plan: active ? 'alice_premium_30d' : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'status_unavailable' });
  }
});

app.post('/billing/checkout', async (req, res) => {
  try {
    if (!Billing.isConfigured()) {
      return res.status(503).json({
        error: 'billing_unconfigured',
        message: 'Card checkout not configured yet. Contact us on WhatsApp.',
        ...Billing.publicConfig()
      });
    }
    const { email, successUrl, cancelUrl } = req.body || {};
    const result = await Billing.createCheckoutSession({ email, successUrl, cancelUrl });
    if (result.error) return res.status(503).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Checkout error:', err.message);
    return res.status(500).json({ error: 'checkout_failed', message: err.message });
  }
});

app.get('/billing/activate', async (req, res) => {
  try {
    const checkout = req.query.checkout;
    const result = await Billing.activateFromCheckout(checkout, sbGetOne, sbSet);
    if (result.error) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Activate error:', err.message);
    return res.status(500).json({ error: 'activate_failed' });
  }
});

/** Recover premium token with the same email used at activation. */
app.post('/billing/restore', async (req, res) => {
  try {
    const email = (req.body && req.body.email) || '';
    const result = await Billing.restoreByEmail(email, sbGetOne);
    if (result.error === 'invalid_email') return res.status(400).json(result);
    if (result.error === 'not_found' || result.error === 'expired') return res.status(404).json(result);
    if (result.error) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Restore error:', err.message);
    return res.status(500).json({ error: 'restore_failed' });
  }
});

/** Jill Pro Premium — standby Stripe (WhatsApp activation primary). */
app.get('/billing/jill/config', (req, res) => {
  try {
    return res.json(JillBilling.publicConfig());
  } catch (err) {
    return res.status(500).json({ error: 'config_unavailable' });
  }
});

app.get('/billing/jill/status', async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.json({ active: false });
    const active = await JillBilling.isPremiumActive(token, sbGetOne);
    const row = await sbGetOne('infinity_sessions', JillBilling.premiumRecordId(token));
    return res.json({
      active,
      expiresAt: row?.data?.expiresAt || null,
      plan: active ? 'jill_pro_premium_30d' : null
    });
  } catch (err) {
    return res.status(500).json({ error: 'status_unavailable' });
  }
});

app.post('/billing/jill/checkout', async (req, res) => {
  try {
    if (!JillBilling.isConfigured()) {
      return res.status(503).json({
        error: 'billing_unconfigured',
        standby: true,
        message: 'Jill Pro card checkout not connected yet. Contact us on WhatsApp.',
        ...JillBilling.publicConfig()
      });
    }
    const { email, successUrl, cancelUrl } = req.body || {};
    const result = await JillBilling.createCheckoutSession({ email, successUrl, cancelUrl });
    if (result.error) return res.status(503).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Jill checkout error:', err.message);
    return res.status(500).json({ error: 'checkout_failed', message: err.message });
  }
});

app.get('/billing/jill/activate', async (req, res) => {
  try {
    const checkout = req.query.checkout;
    const result = await JillBilling.activateFromCheckout(checkout, sbGetOne, sbSet);
    if (result.error) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Jill activate error:', err.message);
    return res.status(500).json({ error: 'activate_failed' });
  }
});

app.post('/billing/jill/restore', async (req, res) => {
  try {
    const email = (req.body && req.body.email) || '';
    const result = await JillBilling.restoreByEmail(email, sbGetOne);
    if (result.error === 'invalid_email') return res.status(400).json(result);
    if (result.error === 'not_found' || result.error === 'expired') return res.status(404).json(result);
    if (result.error) return res.status(500).json(result);
    return res.json(result);
  } catch (err) {
    console.error('Jill restore error:', err.message);
    return res.status(500).json({ error: 'restore_failed' });
  }
});

app.post('/billing/jill/manual-grant', async (req, res) => {
  try {
    if (!bridgeAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });
    const email = (req.body && req.body.email) || '';
    const days = req.body?.days;
    const phone = (req.body && req.body.phone) || '';
    const source = (req.body && req.body.source) || 'whatsapp_bridge';
    const result = await JillBilling.manualGrant(sbSet, sbGetOne, { email, days, source });
    if (result.error === 'invalid_email') return res.status(400).json(result);
    if (result.error) return res.status(500).json(result);

    let whatsapp = null;
    if (phone) {
      const clientUrl = process.env.PUBLIC_SITE_URL || 'https://studioinfinitycr.com/Infinity_Student_Portal.html';
      const message = JillBilling.clientActivationMessage(result.email, result.expiresAt, clientUrl);
      whatsapp = await Billing.enqueueWhatsApp(sbSet, sbGetOne, {
        phone,
        message,
        email: result.email
      });
    }

    return res.json({ ...result, whatsapp });
  } catch (err) {
    console.error('Jill manual grant error:', err.message);
    return res.status(500).json({ error: 'grant_failed', message: err.message });
  }
});

function bridgeAuthorized(req) {
  const secret = req.headers['x-bridge-secret'] || req.body?.secret || req.query?.secret || '';
  const expected = process.env.WA_BRIDGE_SECRET || process.env.ANALYZE_SECRET || '';
  return !!(expected && secret === expected);
}

/**
 * Manual activation (activar.html or admin).
 * Optional phone → queues WhatsApp for PC auto-sender.
 * Header: X-Bridge-Secret: ANALYZE_SECRET (or WA_BRIDGE_SECRET).
 */
app.post('/billing/manual-grant', async (req, res) => {
  try {
    if (!bridgeAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });
    const email = (req.body && req.body.email) || '';
    const days = req.body?.days;
    const phone = (req.body && req.body.phone) || '';
    const source = (req.body && req.body.source) || 'whatsapp_bridge';
    const result = await Billing.manualGrant(sbSet, sbGetOne, { email, days, source });
    if (result.error === 'invalid_email') return res.status(400).json(result);
    if (result.error) return res.status(500).json(result);

    let whatsapp = null;
    if (phone) {
      const clientUrl = process.env.PUBLIC_SITE_URL || 'https://studioinfinitycr.com/try-alice.html';
      const message = Billing.clientActivationMessage(result.email, result.expiresAt, clientUrl);
      whatsapp = await Billing.enqueueWhatsApp(sbSet, sbGetOne, {
        phone,
        message,
        email: result.email
      });
    }

    return res.json({ ...result, whatsapp });
  } catch (err) {
    console.error('Manual grant error:', err.message);
    return res.status(500).json({ error: 'grant_failed', message: err.message });
  }
});

/** PC bridge polls pending WhatsApp messages to send automatically. */
app.get('/billing/wa-outbox', async (req, res) => {
  try {
    if (!bridgeAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });
    const items = await Billing.listPendingWhatsApp(sbGet, sbQuery, sbGetOne);
    return res.json({ items, outbox: 'v2' });
  } catch (err) {
    console.error('WA outbox error:', err.message);
    return res.status(500).json({ error: 'outbox_failed' });
  }
});

app.post('/billing/wa-outbox/ack', async (req, res) => {
  try {
    if (!bridgeAuthorized(req)) return res.status(401).json({ error: 'unauthorized' });
    const id = (req.body && req.body.id) || '';
    const status = (req.body && req.body.status) || 'sent';
    const result = await Billing.ackWhatsApp(sbSet, sbGetOne, id, status);
    if (result.error === 'not_found') return res.status(404).json(result);
    if (result.error) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error('WA ack error:', err.message);
    return res.status(500).json({ error: 'ack_failed' });
  }
});

app.get('/demo/voices', (req, res) => {
  try {
    return res.json(getDemoVoiceProfiles());
  } catch (err) {
    return res.status(500).json({ error: 'Voices unavailable' });
  }
});

app.post('/demo/tts', async (req, res) => {
  try {
    const { text, voiceId: bodyVoiceId, firstName, voice, product, premiumToken } = req.body || {};
    const ip = getClientIp(req);

    const requested = String(bodyVoiceId || '').trim();
    const wantsAlice =
      voice === 'alice' ||
      product === 'alice' ||
      product === 'alice_companion' ||
      requested === ALICE_VOICE_ID ||
      requested === 'r1KmysJdVYZjJCm4mL3b';

    const isPremiumTts = !!(premiumToken && await Billing.isPremiumActive(premiumToken, sbGetOne));
    const owner = isDemoIpWhitelisted(ip);

    // Free demos: ElevenLabs ONLY for fixed buffer script lines (served from cache after first gen).
    if (!isPremiumTts && !owner) {
      const bufVoice = demoBufferVoiceForText(text);
      if (!bufVoice) {
        return res.status(403).json({
          error: 'demo_tts_buffer_only',
          message: 'Free demos only play buffered ElevenLabs clips. Unlock premium for live voice.'
        });
      }
      return await synthesizeSpeech(req, res, { text, voiceId: bufVoice, label: 'Demo buffer' });
    }

    // Premium / owner: Alice voice or requested allowlisted voice
    if (wantsAlice) {
      return await synthesizeSpeech(req, res, { text, voiceId: ALICE_VOICE_ID, label: 'Alice' });
    }

    const ipLimit = await checkDemoIpLimit(ip, 'tts', { action: 'tts', premiumToken });
    if (!ipLimit.ok) {
      return res.status(429).json({ error: 'limit', message: 'Demo voice limit reached for today.' });
    }

    const voiceId = enforceNexoraTtsVoice(firstName, requested);
    const allowlist = getDemoTtsAllowlist();
    if (!voiceId || !allowlist.has(voiceId)) {
      const fallback = NEXORA_FEMALE_FIRST_NAMES.has(String(firstName || '').trim().split(/\s+/)[0])
        ? (JILL_VOICE_ID || ALICE_VOICE_ID)
        : (getDemoVoiceProfiles().nexora_star?.voiceId || 'bfGb7JTLUnZebZRiFYyq');
      return await synthesizeSpeech(req, res, { text, voiceId: fallback, label: 'Nexora demo' });
    }

    const label = voiceId === ALICE_VOICE_ID ? 'Alice' : 'Nexora demo';
    return await synthesizeSpeech(req, res, { text, voiceId, label });
  } catch (err) {
    console.error('Demo TTS error:', err.message);
    return res.status(500).json({ error: 'TTS unavailable' });
  }
});

const NEXORA_DIALOGUE_RULE = '\nOUTPUT FORMAT: Spoken dialogue ONLY. No stage directions, no *actions*, no narration (never write "smiles warmly", "extends hand", "nods", etc.). Start directly with what you SAY out loud.';
const TUTOR_PACE_RULE = '\nPACING (spoken aloud): Sound 100% human — like a real CR tutor in class. Prefer commas over heavy periods, no ellipses (...), no staccato fragments, no "Paso 1/2" textbook tone. Warm, clear, natural.';
const TUTOR_LATENCY_RULE = '\nLIVE TURN (charla libre solamente): 2-3 oraciones cortas. Sin relleno. Respondé al toque.';
const TUTOR_TEACH_COMPLETE_RULE = `\nTEACH TURN (OBLIGATORIO — anula "corto" — ESTILO DE CLASE / GUION ORAL):
HABLA el GUION ORAL del track (john-voice-scripts / trascriciones de clase). Esa es TU voz — no ESL de internet.
El TABLERO ya está en pantalla: NO lo leás fila por fila (prohibido rules→examples→transforms→takeaway como lista).
Completá: guion oral + 1–2 ejemplos señalados + práctica oral + "¿Te quedó?".
PROHIBIDO tip corto. PROHIBIDO chatbot ESL. PROHIBIDO imponer otro módulo si pidieron X → enseñá X YA.
Si perfecto / have-has-had: en VOZ decí "jáf. jás. jád." con JOTA española (nunca "yaf" de J inglesa, nunca "ave").
Si futuro perfecto: will + have + participio.
Si ING: "í ene je" (español CR).`;
const TURN_TAKING_RULE = '\nTURN-TAKING: The student finishes speaking before you reply. Respond promptly once they are done — no long pauses or filler. Never interrupt mid-thought. If they struggle to understand, stay calm and explain the same idea from another angle until it clicks.';
function stripStageDirections(text) {
  if (!text) return text;
  let s = String(text).trim();
  s = s.replace(/\*[^*]{1,160}\*/g, ' ').replace(/\[[^\]]{1,160}\]/g, ' ');
  s = s.replace(/\([^)]{0,120}(?:smil|nod|extend|lean|sigh|look|wave|hand|warmly|firmly|pause|breath|clear throat|gesture|body language)[^)]*\)/gi, ' ');
  const dialogueStart = s.search(/\b(Hello|Hi|Hey|Good morning|Good afternoon|Good evening|I['']m|I am|My name|This is|Well|Yes|No|Um|So|Look|Excuse me|Sorry|Thank you|Thanks)\b/i);
  if (dialogueStart > 0) {
    const before = s.slice(0, dialogueStart);
    if (/(?:smil|nod|extend|lean|sigh|look|wave|hand|warmly|firmly|speaks?|answers?|responds?|client|customer)/i.test(before)) {
      s = s.slice(dialogueStart);
    }
  }
  const quoted = s.match(/["']([^"']{4,})["']/);
  if (quoted && /(?:smil|nod|extend|warmly|hand)/i.test(s.replace(quoted[0], ''))) s = quoted[1];
  return s.replace(/\s+/g, ' ').trim();
}

function enforceNexoraClientName(reply, profile) {
  if (!reply || !profile?.name) return reply;
  const full = String(profile.name).trim();
  const first = String(profile.firstName || full.split(' ')[0] || '').trim();
  if (!first) return reply;
  const notNames = new Set(['calling','looking','trying','wondering','sorry','just','not','here','going','having','getting','checking','waiting','following','writing','working','thinking','sure','afraid','glad','happy','really','very','also','still','actually','about','from','with','because']);
  const fixName = (match, name) => {
    const n = String(name).trim();
    if (!n) return match;
    const head = n.split(' ')[0].toLowerCase();
    if (notNames.has(head)) return match;
    if (n.toLowerCase() === first.toLowerCase() || n.toLowerCase() === full.toLowerCase()) return match;
    return match.replace(name, first);
  };
  let fixed = reply;
  fixed = fixed.replace(/\b[Mm]y name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, fixName);
  fixed = fixed.replace(/\b[Tt]his is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, fixName);
  fixed = fixed.replace(/\bI'm\s+([A-Z][a-z]+)\b/g, fixName);
  fixed = fixed.replace(/\bI am\s+([A-Z][a-z]+)\b/g, fixName);
  return fixed;
}

function buildNexoraSystemPrompt({ profile, scenario, agentName, accountContext, negRole }) {
  const p = profile || {};
  const sc = scenario || {};
  const moodInstructions = {
    frustrated: 'You are frustrated and mildly upset. You want this resolved quickly.',
    angry: 'You are angry. Your tone is sharp. You interrupt if the agent rambles.',
    very_angry: 'You are very angry. You are close to demanding a supervisor. You repeat yourself.',
    furious: 'You are furious. You threaten to leave. Nothing satisfies you easily.',
    impatient: 'You are in a hurry. You want quick answers. You get annoyed at long explanations.',
    cold: 'You are cold and distant. Short answers. You are already decided to leave.',
    worried: 'You are worried and anxious. You need reassurance.',
    disappointed: 'You are disappointed and feel misled. You are calm but firm.',
    indignant: 'You feel wronged. You have proof and you want justice.',
    pleasant: 'You are friendly and open. Easy to help, but you have specific questions.'
  };
  const mood = moodInstructions[sc.mood] || 'You are a normal customer with a concern.';
  let accountDetails = '';
  if (accountContext) {
    accountDetails = `\nYOUR ACCOUNT DETAILS (reference ONLY these exact facts — do not invent anything):
- Name: ${accountContext.name || p.name}
- Account: ${accountContext.account || p.account}
- Services: ${(accountContext.services || []).join(', ') || 'standard account'}`;
    if (accountContext.billingAlerts?.length > 0) {
      accountDetails += `\n- Billing alerts: ${accountContext.billingAlerts.map(b => b.label + (b.amount ? ' ' + b.amount : '') + ' on ' + b.date).join('; ')}`;
    }
    if (accountContext.disputeAmount) accountDetails += `\n- The unexpected charge you are calling about: ${accountContext.disputeAmount}`;
    if (accountContext.lateFee) accountDetails += `\n- The late fee you are disputing: ${accountContext.lateFee}`;
    if (accountContext.refundAmount) accountDetails += `\n- The refund amount you are requesting: ${accountContext.refundAmount}`;
    if (accountContext.issueType) accountDetails += `\n- Issue type (ONLY discuss this): ${accountContext.issueType}`;
    if (accountContext.issueTitle) accountDetails += `\n- Call reason title: ${accountContext.issueTitle}`;
    if (accountContext.issueDesc) accountDetails += `\n- Call reason detail: ${accountContext.issueDesc}`;
    if (accountContext.onlineAccessLocked) accountDetails += `\n- Online banking access: LOCKED — client cannot log in`;
    if (accountContext.cardBlocked) accountDetails += `\n- Card status: BLOCKED by fraud hold`;
  }
  const scType = sc.type || 'customer_service';
  let systemPrompt = '';
  if (scType === 'star_interview') {
    const ctx = accountContext || {};
    const starFocusStr = ctx.starFocus?.length ? ctx.starFocus.map((q, i) => (i + 1) + '. ' + q).join('\n') : 'General STAR questions';
    systemPrompt = `You are ${ctx.interviewerName || 'a senior interviewer'} conducting a structured STAR behavioral interview for: ${sc.title}.
Company: ${ctx.company || sc.company || 'the company'}

STAR FOCUS QUESTIONS (use these as your guide):
${starFocusStr}

YOUR ROLE:
- YOU are the interviewer. ${agentName} is the candidate being evaluated.
- Ask strictly STAR-format questions: Situation, Task, Action, Result.
- Probe for specifics: "What was YOUR specific action?" "What was the measurable result?"
- If they skip a STAR component: "You've described the situation — what specific actions did YOU take?"
- Evaluate clarity, structure, connector usage, confidence and specific examples.
- After 2-3 exchanges, give brief feedback and move to the next question.
- 1-3 sentences per turn. Professional and focused.
- Your name is ${ctx.interviewerName || 'the interviewer'}. NEVER change your name.
- FIRST TURN ONLY: One-sentence intro (name, title, ${ctx.company || sc.company || 'company'}). Then ask question 1 from STAR FOCUS immediately. Must end with a complete question mark. Never use ellipsis (...). Never stop at "and I".
- NEVER break character. You are the interviewer, ${agentName} is the one being evaluated.`;
  } else if (scType === 'interview') {
    const ctx = accountContext || {};
    const panelStr = ctx.panelists?.length > 0 ? `You are one of a panel of interviewers: ${ctx.panelists.join(', ')}.` : `You are ${ctx.interviewerName || p.name}, ${ctx.role || 'HR Manager'} at ${ctx.company || 'the company'}.`;
    systemPrompt = `You are conducting a job interview for: ${sc.title}.
${panelStr}

INTERVIEW CONTEXT: ${sc.desc}
CANDIDATE NAME: ${agentName || 'the candidate'}

YOUR ROLE AS INTERVIEWER:
- Ask behavioral, situational and STAR-format questions (Situation, Task, Action, Result)
- Be professional but warm. Evaluate clarity, confidence and English fluency.
- If the candidate's answer is vague or too short, follow up with "Can you elaborate?" or "Give me a specific example."
- After 3-4 exchanges, transition to a new topic or question naturally.
- React to the quality of their answers — good answers get positive acknowledgment, weak answers get probing follow-ups.
- Keep each response to 1-3 sentences. This is a real interview — pace it naturally.
- Your name is ${ctx.interviewerName || p.name}. NEVER introduce yourself with a different name.
- NEVER mention English tutoring, learning or AI. YOU are the interviewer, ${agentName} is the candidate being evaluated.`;
  } else if (scType === 'meeting') {
    const ctx = accountContext || {};
    systemPrompt = `You are a participant in a professional meeting: ${sc.title}.
Meeting context: ${sc.desc}
Participants: ${(ctx.participants || []).join(', ')}
You are playing the role of the first participant (not "You"): ${ctx.participants?.[0] || 'Team Lead'}

YOUR ROLE:
- Engage naturally in the meeting topic. Ask questions, share opinions, challenge ideas professionally.
- React to what ${agentName || 'the participant'} says — agree, disagree, ask for clarification.
- Keep the meeting moving. If there is silence, prompt the next agenda point.
- Be professional but natural. Use meeting language: "I think we should...", "Can you walk us through...", "Let me push back on that..."
- 1-3 sentences per turn. Realistic meeting pace.
- NEVER mention English tutoring or AI. You are a real meeting participant.`;
  } else if (scType === 'negotiation') {
    const ctx = accountContext || {};
    systemPrompt = `You are ${sc.counterpart || 'a negotiation counterpart'} in a professional negotiation.
Context: ${sc.title} — ${sc.desc}

${negRole === 'receiver'
  ? `OPENING ROLE: YOU go first. Make your opening offer or state your position clearly. ${agentName} will respond and counter-negotiate.`
  : `OPENING ROLE: ${agentName} will open the negotiation with their offer or position. You respond to what they propose.`
}

YOUR APPROACH:
- Be firm on your key points but open to genuine compromise.
- Strong, logical arguments from ${agentName} move you. Weak arguments get pushback.
- Use negotiation language: "I understand your position, however...", "We could consider that if...", "That doesn't work for us unless..."
- If ${agentName} finds creative win-win solutions → acknowledge and show flexibility.
- If ${agentName} is aggressive or unreasonable → hold firm or signal disengagement.
- Track what has been agreed and what is still open.
- 1-3 sentences per turn. Professional, direct.
- NEVER break character or mention AI. You are evaluating ${agentName}'s negotiation skills.`;
  } else if (scType === 'corporate') {
    const ctx = accountContext || {};
    const pdfContext = ctx.pdfContent ? `\n\nPRESENTATION CONTENT (the candidate uploaded this for you to review):\n${ctx.pdfContent.slice(0, 2000)}` : '';
    const stakesStr = ctx.stakes?.length ? ctx.stakes.join('; ') : '';
    systemPrompt = `You are ${sc.role || 'a Board Director'} at ${sc.company || 'the company'}.
Meeting: ${sc.title}
Context: ${sc.desc}
${stakesStr ? 'Key concerns: ' + stakesStr : ''}${pdfContext}

YOUR ROLE:
- YOU are the executive/director. ${agentName} is presenting TO YOU and being evaluated.
- Be demanding. Expect precision, data and clear ROI from ${agentName}.
- Challenge weak points: "What's the evidence for that assumption?"
- Ask about risks, timelines, financials and strategic fit.
- React positively when ${agentName} is structured, confident and data-driven.
- React skeptically when ${agentName} is vague or unconfident.
- You decide whether to approve, reject or request more information.
- 1-3 sentences per turn. Boardroom pace.
- Your name/role is ${sc.role || 'Board Director'}. NEVER introduce yourself with a different name.
- NEVER break character or mention AI. You are evaluating ${agentName}.`;
  } else if (scType === 'stakeholder') {
    const ctx = accountContext || {};
    const stakesStr = ctx.stakes?.length ? '\nKey tensions:\n' + ctx.stakes.map(s => '- ' + s).join('\n') : '';
    const pdfContext = ctx.pdfContent ? `\n\nUPLOADED DOCUMENT (review carefully):\n${ctx.pdfContent.slice(0, 2500)}` : '';
    const pdfExtra = ctx.pdfPrompt ? `\nEXTRA REVIEW INSTRUCTIONS: ${ctx.pdfPrompt}` : '';
    systemPrompt = `You are ${sc.role || 'a key stakeholder'} in a high-stakes meeting.
Meeting: ${sc.title}
Context: ${sc.desc}${stakesStr}
Participants: ${(ctx.participants || []).join(', ')}${pdfContext}${pdfExtra}

YOUR ROLE:
- YOU are the stakeholder with a specific agenda. ${agentName} must manage YOU and align you.
- Evaluate HOW ${agentName} expresses ideas and HOW they explain ROI / financial impact of the project.
- Push for clarity on numbers, assumptions, risks, payback and strategic fit.
- If a document was uploaded, reference it and challenge weak ROI claims.
- If ${agentName} is clear, structured and data-driven → gradually align.
- If ${agentName} is vague, dismissive or unprepared → escalate resistance.
- Before the meeting ends you MUST decide explicitly: APPROVE, REJECT, or REQUEST REVISION — and say so out loud.
- Use stakeholder language: "From our department's perspective...", "Walk me through the ROI..."
- 1-3 sentences. You are testing ${agentName}'s stakeholder communication and financial storytelling.
- NEVER break character.`;
  } else if (scType === 'medical') {
    systemPrompt = `You are ${p.name || 'a patient'} speaking with a healthcare provider.
Situation: ${sc.desc}
Your mood: ${mood}

YOUR ROLE:
- YOU are the patient. ${agentName} is the healthcare provider being evaluated.
- Ask questions, express worry or resistance naturally based on your mood.
- Evaluate (internally) how clearly and empathetically ${agentName} communicates.
- If ${agentName} is clear and empathetic → you feel reassured and cooperative.
- If ${agentName} is confusing, cold or unprofessional → become more anxious or resistant.
- Use natural patient language. 1-3 sentences per turn.
- NEVER break character. You are evaluating ${agentName}'s patient communication skills.`;
  } else {
    const clientFirst = p.firstName || (p.name ? p.name.split(' ')[0] : 'the client');
    const issueType = accountContext?.issueType || sc.issueType || '';
    const issueGuard = issueType
      ? `\nISSUE ALIGNMENT (mandatory):
- Your ONLY reason for calling is: ${sc.title} — ${sc.desc}
- Issue type: ${issueType}. Do NOT change topics.
- Do NOT mention account lockout, login problems, or portal access unless issue type is "technical" or online access is listed as LOCKED above.
- Do NOT mention fees, charges, or billing disputes unless issue type is billing_dispute, late_fee, or amounts are listed above.
- Do NOT invent problems that are not in YOUR ISSUE or account details above.`
      : '';
    systemPrompt = `You are ${p.name || 'a customer'} (first name: ${clientFirst}), account ${p.account || 'unknown'}, calling customer service.

YOUR ISSUE: ${sc.title} — ${sc.desc}
YOUR MOOD: ${mood}
${accountDetails}${issueGuard}

CRITICAL RULES:
- Your name is ${p.name}. Your first name is ${clientFirst}. NEVER use any other name — not Sarah, Patricia, Linda, or any other name.
- Do NOT introduce yourself unless the agent asks. Jump straight into your issue.
- You are 100% the CLIENT. NEVER break character. NEVER mention English, learning, or AI.
- ONLY reference the exact account details provided above. Do NOT invent charges, fees, or amounts that are not listed.
- React naturally to the agent ${agentName || ''}.
- Professional empathetic agent → you warm up slightly.
- Rude or unhelpful agent → escalate.
- Hold without asking → express annoyance when they return.
- Keep responses SHORT — 1-3 sentences max. Real phone call pace.`;
  }
  const agentLabel = String(agentName || 'Agent').trim() || 'Agent';
  const agentIdentity = `\nAGENT IDENTITY: The call-center agent (the human you're speaking with) is "${agentLabel}" ONLY. Never call them Byron, Johnny, or any other name.`;
  return { systemPrompt: systemPrompt + NEXORA_DIALOGUE_RULE + TURN_TAKING_RULE + TUTOR_PACE_RULE + agentIdentity, p, sc, scType };
}

function finishNexoraReply(raw, p, scType) {
  let fixed = stripStageDirections(raw);
  if ((scType || 'customer_service') === 'customer_service' || !scType) {
    fixed = enforceNexoraClientName(fixed, p);
  }
  return fixed.trim();
}

function isNexoraReplyIncomplete(text, scType) {
  const t = String(text || '').trim();
  if (!t || t.length < 12) return true;
  if (/\.{2,}$|\.\.\./.test(t)) return true;
  if (/\band I\.?$/i.test(t)) return true;
  if (/\b(I|I'm|I've|I'll|I'd|because|and|but|so|when|where|that)\.?$/i.test(t)) return true;
  if (scType === 'star_interview' || scType === 'interview') {
    if (!/\?/.test(t)) return true;
    if (!/[.!?]"?$/.test(t)) return true;
    return false;
  }
  if (t.length < 28 && !/[.!?]$/.test(t)) return true;
  return false;
}

function buildNexoraOpeningNote(scType, variation) {
  if (scType === 'star_interview' || scType === 'interview') {
    return `${variation || ''}\nOPENING TURN: Brief intro (name, role, company) in one sentence. Then ask your FIRST behavioral/STAR question. Must end with ?. Never use ellipsis (...). Never stop at "and I". Two or three complete sentences total.`;
  }
  if (scType === 'meeting' || scType === 'corporate' || scType === 'stakeholder' || scType === 'negotiation' || scType === 'medical') {
    return `${variation || ''}\nOPENING: One short professional greeting, then continue naturally. Complete sentences only — no ellipsis.`;
  }
  return `${variation || ''}\nThis is the FIRST line of the call — open with a NEW greeting and reason for calling. Do not reuse phrasing from recent openings.`;
}

async function prepareNexoraRequest(body, req) {
  const { message, history, profile, scenario, agentName: agentNameRaw, accountContext, negRole, student: studentRaw } = body || {};
  const student = resolveNexoraStudent(studentRaw, req);
  const agentName = resolveNexoraAgentName(student, agentNameRaw, req);
  const { systemPrompt, p, sc, scType } = buildNexoraSystemPrompt({ profile, scenario, agentName, accountContext, negRole });
  const msgStr = String(message || '');
  const isOpening = /^START_/.test(msgStr) && (!history || history.length === 0);
  let prompt = systemPrompt;
  const actorKey = resolveActorKey({ student, profile: p });
  const openingProduct = `nexora-${scType}-${sc.id || msgStr || 'default'}`;
  if (isOpening) {
    const recent = (scType === 'customer_service' || !scType) ? await getRecentOpenings(actorKey, openingProduct) : [];
    const variation = buildOpeningVariationNote(recent, 'en');
    prompt += buildNexoraOpeningNote(scType, variation);
  }
  const hist = (history || []).slice(-14);
  const msgs = buildTutorChatMessages(hist, message, 14);
  const brainSlice = await tutorKnowledgeSliceFast(msgStr, student, 'nexora');
  const learnerNote = SharedLearner.buildSharedLearnerNote(student);
  const finalPrompt = [prompt, brainSlice, learnerNote].filter(Boolean).join('');
  return { systemPrompt: finalPrompt, msgs, p, sc, scType, isOpening, actorKey, openingProduct, agentName, student };
}

// ── DEMO LIVE AI (real product taste, IP-limited) ─────────────
function getDemoAliceSystem(name) {
  const guest = name || 'Guest';
  return `You are Alice, a warm, patient, and encouraging English tutor using the Nexus Method at Infinity Studio CR.

PERSONALITY: Warm, human, celebratory, patient. Speak like a real person — not a script.
COACHING: Answer questions and explain concepts warmly (linkers, recovery, tone, etc.). Tie every example to what you are practicing now. Never scold or shame the student.
METHOD — NEXUS: Idea + Linker + Idea. Connectors: however, on top of that, even though, therefore, besides, so far, in other words.
RESPONSE STYLE: 3-4 natural sentences max. Complete every sentence. React to what the visitor said. Ask ONE follow-up question.
ROLE: Tutor only. NEVER roleplay as customer, interviewer, or Nexora character.
LANGUAGE: English ONLY. Spanish ONLY if they explicitly ask you to explain something — then explain in Spanish and return to English. No automatic Spanish tips.

DEMO MODE: This is a REAL mini-session for website visitor ${guest} — not a recording. Adapt every reply to their words.`;
}

function getDemoCompanionSystem(name, onboarding) {
  const guest = name || 'Guest';
  const goal = onboarding?.goal || 'practice English';
  const level = onboarding?.level || 'intermediate';
  return `You are Alice Companion — an always-on English voice companion (personal practice assistant), NOT a classroom tutor and NOT a Nexus drill coach.

Visitor: ${guest}. Goal: ${goal}. Level: ${level}.

WHO YOU ARE:
- You talk, listen, interact, guide, educate, and show genuine interest.
- ANY topic is welcome: daily life, fashion, food, travel, work, feelings, news, hobbies, stories — anything.
- If they want a story, tell one. If they want opinions (fashion, life, trends), share warmly.
- If they bring an English/class doubt: explain simply → ask if it makes sense → short practice (a few turns) → back to free chat.

FLOW RULES (critical):
- Unlimited flowing conversation — never stop after a fixed number of turns.
- Complete every sentence and every story. NEVER cut off mid-thought or mid-word.
- 2-8 natural English sentences depending on what they need (short chat vs story).
- React with real interest. Ask follow-ups when it fits — not as a test.
- No markdown headers (#). No "demo", no "Infinity Studio CR", no product meta-talk.
- Opening: warm greeting in English + ask what they want to talk about (or dive in if they already said).
- Sound like a friend in their ear 24/7 — bus, car, lunch break, anytime.
- English ONLY. Spanish ONLY when they explicitly ask you to explain something.`;
}

function sanitizeDemoCompanionReply(text) {
  let t = String(text || '').trim();
  if (!t) return t;
  t = t.split(/\n-{3,}\s*\n/)[0].trim();
  const h1parts = t.split(/\n(?=#+\s)/);
  if (h1parts.length > 1) t = h1parts[0].trim();
  t = t.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim();
  return t;
}

function getDemoNexoraContext(scenario, name) {
  const guest = name || 'Guest';
  if (scenario === 'customer_service') {
    return {
      profile: { name: 'Maria Santos', firstName: 'Maria', account: 'ACC-482910' },
      scenario: {
        type: 'customer_service',
        title: 'Unrecognized charge',
        desc: 'Customer was charged $49.99 they do not recognize.',
        mood: 'frustrated'
      },
      agentName: guest,
      accountContext: {
        name: 'Maria Santos',
        account: 'ACC-482910',
        disputeAmount: '$49.99',
        services: ['Premium Plan']
      }
    };
  }
  return {
    profile: { name: 'Alex' },
    scenario: {
      type: 'star_interview',
      title: 'STAR Behavioral Interview',
      desc: 'Brief STAR behavioral interview demo',
      company: 'Corporate'
    },
    agentName: guest,
    accountContext: {
      interviewerName: 'Alex',
      company: 'Corporate',
      starFocus: [
        'Tell me about a time you had to handle a difficult situation at work.',
        'Tell me about a time you had to meet a tight deadline while quality still mattered.'
      ]
    }
  };
}

function demoHistoryText(session) {
  const guest = session.name || 'Guest';
  const label = session.service === 'nexora'
    ? (session.scenario === 'customer_service' ? 'CLIENT' : 'INTERVIEWER')
    : session.service.toUpperCase();
  return (session.history || []).filter(m => m.content?.trim())
    .map(m => `${m.role === 'user' ? guest : label}: ${m.content.split('\n')[0]}`).join('\n');
}

function getDemoStreamConfig(session, closing) {
  const guest = session.name || 'Guest';
  const msgs = (session.history || []).slice(-12);
  const hist = demoHistoryText(session);

  if (session.service === 'alice') {
    const isCompanion = session.demoMode === 'companion';
    return {
      max_tokens: closing ? 400 : 900,
      system: (isCompanion ? getDemoCompanionSystem(guest, session.onboarding) : getDemoAliceSystem(guest))
        + '\nNEVER cut off mid-sentence. Always finish every spoken line completely. Full replies only.',
      messages: closing
        ? [{ role: 'user', content: `Final turn of Alice demo for ${guest}. Wrap up warmly in 2-3 complete sentences.\n\n${hist}` }]
        : msgs
    };
  }
  if (session.service === 'jill') {
    return {
      max_tokens: closing ? 400 : 900,
      system: JILL_SYSTEM_PROMPT + `\n\nMODO DEMO WEB: Visitante ${guest}. Texto directo (sin JSON). 4-8 oraciones completas, método Nexus, tono natural.${closing ? ' Cerrá la demo e invitá a agendar evaluación.' : ''}\nNEVER cut off mid-sentence.`,
      messages: closing
        ? [{ role: 'user', content: `Cierre final Foundations demo.\n\n${hist}` }]
        : msgs
    };
  }
  if (session.service === 'nexora') {
    const ctx = getDemoNexoraContext(session.scenario, guest);
    const { systemPrompt } = buildNexoraSystemPrompt(ctx);
    return {
      max_tokens: 450,
      system: systemPrompt + (closing ? '\nFINAL TURN: Close the simulation naturally in character.' : '') + '\nNEVER cut off mid-sentence. Always finish the spoken line completely.',
      messages: closing
        ? [{ role: 'user', content: `Close simulation.\n\n${hist}` }]
        : msgs
    };
  }
  throw new Error('Unknown demo service');
}

async function demoGenerateOpening(service, scenario, name, onboarding) {
  const guest = name || 'Guest';
  if (service === 'alice') {
    const isCompanion = scenario === 'companion';
    const goal = onboarding?.goal || 'practice English';
    const level = onboarding?.level || 'not sure';
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: isCompanion ? getDemoCompanionSystem(guest, onboarding) : getDemoAliceSystem(guest),
      messages: [{ role: 'user', content: isCompanion
        ? `Open Alice Companion for ${guest}. ONE warm greeting + ONE question about what they want to talk about today.`
        : `Open a real 5-minute Alice demo for ${guest}. Welcome them warmly and ask ONE engaging question about their work in English.` }]
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return isCompanion ? sanitizeDemoCompanionReply(raw) : raw;
  }
  if (service === 'jill') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: JILL_SYSTEM_PROMPT + `\n\nMODO DEMO WEB: Visitante ${guest}. Sesión REAL de 5 min. Bienvenida breve + enseguida el primer chunk/ejercicio. Ritmo ágil, sin charla previa.`,
      messages: [{ role: 'user', content: `Iniciá demo Foundations con ${guest}. Respondé SOLO JSON: {"reply":"...","contentType":"text"}` }]
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return parseJillResponse(raw).reply;
  }
  if (service === 'nexora') {
    const ctx = getDemoNexoraContext(scenario, guest);
    const { systemPrompt, p, scType } = buildNexoraSystemPrompt(ctx);
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: systemPrompt + '\nFIRST TURN: Open the simulation with your first spoken line only. NEVER cut off mid-sentence.',
      messages: [{ role: 'user', content: 'START_DEMO' }]
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return finishNexoraReply(raw, p, scType);
  }
  throw new Error('Unknown demo service');
}

async function demoGenerateReply(session) {
  const guest = session.name || 'Guest';
  const msgs = (session.history || []).slice(-12);

  if (session.service === 'alice') {
    const isCompanion = session.demoMode === 'companion';
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: (isCompanion ? getDemoCompanionSystem(guest, session.onboarding) : getDemoAliceSystem(guest))
        + '\nNEVER cut off mid-sentence. Always finish every spoken line completely.',
      messages: msgs
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return isCompanion ? sanitizeDemoCompanionReply(raw) : raw;
  }
  if (session.service === 'jill') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: JILL_SYSTEM_PROMPT + `\n\nMODO DEMO WEB: Visitante ${guest}. Respondé de forma real y adaptada al mensaje. JSON: {"reply":"...","contentType":"text"}\nNEVER cut off mid-sentence.`,
      messages: msgs
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return parseJillResponse(raw).reply;
  }
  if (session.service === 'nexora') {
    const ctx = getDemoNexoraContext(session.scenario, guest);
    const { systemPrompt, p, scType } = buildNexoraSystemPrompt(ctx);
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 450,
      system: systemPrompt + '\nNEVER cut off mid-sentence. Always finish the spoken line completely.',
      messages: msgs
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return finishNexoraReply(raw, p, scType);
  }
  throw new Error('Unknown demo service');
}

async function demoGenerateClosingReply(session) {
  const guest = session.name || 'Guest';
  const hist = demoHistoryText(session);
  if (session.service === 'alice') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: getDemoAliceSystem(guest),
      messages: [{ role: 'user', content: `This is the final turn of the Alice demo for ${guest}. Warmly wrap up in 2-3 sentences and invite them to book a full assessment.\n\nSession so far:\n${hist}` }]
    });
    return resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  }
  if (session.service === 'jill') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 280,
      system: JILL_SYSTEM_PROMPT + `\n\nMODO DEMO WEB: Cierre final para ${guest}. JSON: {"reply":"...","contentType":"text"}`,
      messages: [{ role: 'user', content: `Cerrá la demo Foundations con calidez e invitá a agendar evaluación.\n\n${hist}` }]
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return parseJillResponse(raw).reply;
  }
  if (session.service === 'nexora') {
    const ctx = getDemoNexoraContext(session.scenario, guest);
    const { systemPrompt, p, scType } = buildNexoraSystemPrompt(ctx);
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: systemPrompt + '\nNEVER cut off mid-sentence. Always finish the spoken line completely.',
      messages: [{ role: 'user', content: `Final turn — close the simulation naturally in character.\n\n${hist}` }]
    });
    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return finishNexoraReply(raw, p, scType);
  }
  return 'Thanks for trying the demo!';
}

async function demoGenerateEvaluation(session) {
  const guest = session.name || 'Guest';
  const hist = demoHistoryText(session);
  const parseEval = (text, fallback) => {
    try { return JSON.parse(text.replace(/```json|```/g, '').trim()); } catch (e) { return fallback; }
  };

  if (session.service === 'alice') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: 450,
      system: 'Respond ONLY with valid JSON. No markdown. Do NOT include overall_score — scoring is computed separately.',
      messages: [{ role: 'user', content: `Evaluate this Alice demo for ${guest}.\n\n${hist}\n\nReturn ONLY JSON:\n{"highlights":["specific thing they did well"],"improvements":["specific tip"],"verdict":"2 warm sentences"}` }]
    });
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const qual = parseEval(text, { highlights: ['You completed the demo'], improvements: ['Practice Idea + Linker + Idea'], verdict: 'Good start — book your free assessment for full Alice coaching.' });
    return enrichEvaluation({ ...qual, overall_score: scoreAliceSessionFromMetrics(buildAliceSessionMetrics(session.history)) }, session.history);
  }
  if (session.service === 'jill') {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: 450,
      system: 'Respond ONLY with valid JSON. No markdown.',
      messages: [{ role: 'user', content: `Evaluate this Jill Foundations demo for ${guest}.\n\n${hist}\n\nJSON: {"overall_score":70,"highlights":["..."],"improvements":["..."],"verdict":"..."}` }]
    });
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return parseEval(text, { overall_score: 70, highlights: ['Completed Jill demo'], improvements: ['Practice because/however in every answer'], verdict: 'Solid Foundations taste — full Jill program builds your base step by step.' });
  }
  if (session.service === 'nexora') {
    const kind = session.scenario === 'customer_service' ? 'customer service call' : 'STAR interview';
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      system: 'Respond ONLY with valid JSON. No markdown.',
      messages: [{ role: 'user', content: `Evaluate this Nexora ${kind} demo for ${guest}.\n\n${hist}\n\nJSON: {"overall_score":70,"wins":["..."],"improvements":["..."],"verdict":"..."}` }]
    });
    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return parseEval(text, { overall_score: 68, wins: ['You stayed in the simulation'], improvements: ['Be more specific in your answers'], verdict: 'Good demo — full Nexora runs longer scenarios with live scoring.' });
  }
  return { overall_score: 70, highlights: ['Demo completed'] };
}

// ── ALICE — Tutora de práctica ────────────────────────────────

// ── TTS CACHE (en memoria) ─────────────────────────────────────
// Evita llamadas repetidas a ElevenLabs para el mismo texto
const ttsCache = new Map();
const TTS_CACHE_MAX = 200; // máximo de entradas

function getTTSCacheKey(text, voiceId, languageCode, speed, modelId){
  const lang = languageCode ? String(languageCode).slice(0, 8) : 'auto';
  const spd = Number(speed ?? 1.08).toFixed(2);
  // MUST hash FULL text — slicing to 100 chars made stream-prefetch clips
  // poison the final reply (same prefix → short audio, voice cuts mid-sentence).
  // v=dualaccent1: LatAm Spanish + American English ONLY
  const model = modelId ? String(modelId).slice(0, 24) : 'default';
  const hash = crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex').slice(0, 32);
  return voiceId + ':' + lang + ':s' + spd + ':dualaccent1:' + model + ':' + hash;
}

function cacheTTS(key, buffer){
  if(ttsCache.size >= TTS_CACHE_MAX){
    // Eliminar la entrada más vieja
    ttsCache.delete(ttsCache.keys().next().value);
  }
  ttsCache.set(key, buffer);
}

function cleanTtsText(text) {
  let t = (text || '')
    .replace(/ALICE:|CLAIRE:|JILL:/gi, '')
    .replace(/\bGet It Straight(?:\s*ING)?\b[:\s—–\-]*/gi, '')
    .replace(/\b(?:John\s+)?Off the Clock\b[:\s—–\-]*/gi, '')
    .replace(/\bJohn\s+Ram[ií]rez\b/gi, '')
    .replace(/\bJohnny(?:\s+Ram[ií]rez)?\b/gi, '')
    .replace(/\bPuente\s+JOHN\b[:\s—–\-]*/gi, 'Puente: ')
    .replace(/\blecci[oó]n\s+(?:can[oó]nica\s+)?John\b[:\s—–\-]*/gi, '')
    .replace(/\bM[oó]dulo\s*0*\d+[A-Z-]*/gi, '')
    .replace(/\bestilo\s+John(?:\s+Ram[ií]rez)?\b/gi, 'estilo Infinity')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\[\[CTYPE:[^\]]*\]\]/gi, ' ')
    .replace(/[*_#\[\]{}<>|~`^]/g, ' ');
  t = t.replace(/\(([^)]*)\)/g, ' $1 ').replace(/\[([^\]]*)\]/g, ' $1 ');
  t = t.replace(/\b([A-Za-z]{2,14})\s*\/\s*([A-Za-z]{2,14})\s*\/\s*([A-Za-z]{2,14})\b/g, '$1. $2. $3.');
  t = t.replace(/\b([A-Za-z]{2,14})\s*\/\s*([A-Za-z]{2,14})\b/g, '$1. $2.');
  t = t.replace(/\b(do)\s+(did)\s+(done)\b/gi, 'do. did. done.');
  t = t.replace(/\b(go)\s+(went)\s+(gone)\b/gi, 'go. went. gone.');
  t = t.replace(/\b(have)\s+(has)\s+(had)\b/gi, 'have. has. had.');
  t = t.replace(/\bI\s+do\s+did\s+done\b/gi, 'I do. did. done.');
  t = t.replace(/\bI\s+have\s+has\s+had\b/gi, 'I have. has. had.');
  // Cascada MSI — toda la biblioteca (mismas reglas que js/tts-chunks.js)
  t = t.replace(/\bGOING\s+TO\b/gi, ' going to ');
  t = t.replace(/\bTO\s+BE\b/gi, ' to be ');
  t = t.replace(/\bPARTICIPIO\b/gi, ' participio ');
  t = t.replace(/\bPREP\b/gi, ' preposicion ');
  t = t.replace(/\bMODAL(?:ES)?\b/gi, ' modal ');
  t = t.replace(/\bAUX(?:ILIAR)?\b/gi, ' auxiliar ');
  t = t.replace(/\bADJ(?:ECTIVE|ETIVO)?\b/gi, ' adjetivo ');
  t = t.replace(/\bPRP\b/gi, ' presente perfecto ');
  t = t.replace(/\bPPC\b/gi, ' pasado perfecto continuo ');
  t = t.replace(/\bPAP\b/gi, ' pasado perfecto ');
  t = t.replace(/\bPR\b/gi, ' presente simple ');
  t = t.replace(/\bPS\b/gi, ' pasado simple ');
  t = t.replace(/\bPC\b/gi, ' presente continuo ');
  t = t.replace(/\bPP\b/gi, ' participio ');
  t = t.replace(/\bTB\b/gi, ' to be ');
  t = t.replace(/\bBEEN\b/gi, ' been ');
  t = t.replace(/\bHAVE\b/gi, ' have ');
  t = t.replace(/\bHAS\b/gi, ' has ');
  t = t.replace(/\bHAD\b/gi, ' had ');
  t = t.replace(/\bWILL\b/gi, ' will ');
  // ING → CR letter names with JOTA: í ene je (never English "gee" / ge gringo)
  t = t.replace(/\bVERBO\s*[+|\/]\s*ING\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bV\s*[+|\/]\s*ing\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bV\s*-\s*ing\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bVing\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bV\s*[+|\/]\s*s\b/gi, ' verbo más S ');
  t = t.replace(/\bV3\b/gi, ' past participle ');
  t = t.replace(/\bP\s*[|+/]\s*AUX(?:ILIAR)?\s*[|+/]\s*NOT\s*[|+/]\s*V\s*[|+/]\s*C\b/gi,
    ' pronombre más auxiliar más not más verbo más complemento ');
  t = t.replace(/\bP\s*[|+/]\s*M\s*[|+/]\s*V\s*[|+/]\s*C\b/gi,
    ' pronombre más modal más verbo más complemento ');
  t = t.replace(/\bP\s*[|+/]\s*V\s*[|+/]\s*C\b/gi,
    ' pronombre más verbo más complemento ');
  t = t.replace(/\b([PMVC])\s*\+\s*([PMVC])\s*\+\s*([PMVC])(?:\s*\+\s*([PMVC]))?\b/gi, (_, a, b, c, d) => {
    const map = { P: 'pronombre', M: 'modal', V: 'verbo', C: 'complemento', p: 'pronombre', m: 'modal', v: 'verbo', c: 'complemento' };
    const parts = [map[a] || a, map[b] || b, map[c] || c];
    if (d) parts.push(map[d] || d);
    return ' ' + parts.join(' más ') + ' ';
  });
  t = t.replace(/\+/g, ' más ');
  t = t.replace(/\s*\|\s*/g, ' más ');
  t = t.replace(/\bVERBO\s*más\s*ING\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bV\s*más\s*ing\b/gi, ' verbo más í ene je ');
  t = t.replace(/\bV\s*más\s*s\b/gi, ' verbo más S ');
  t = t.replace(/\bI\s+N\s+G\b/g, ' í ene je ');
  // Force jota: "ge" → English gee; always speak "je"
  t = t.replace(/\bí\s+ene\s+ge\b/gi, ' í ene je ');
  t = t.replace(/\bP\b/g, ' pronombre ');
  t = t.replace(/\bM\b/g, ' modal ');
  t = t.replace(/\bV\b/g, ' verbo ');
  t = t.replace(/\bC\b/g, ' complemento ');
  t = t.replace(/\bBE\b/g, ' be ');
  t = t.replace(/\bAM\b/g, ' am ');
  t = t.replace(/\bIS\b/g, ' is ');
  t = t.replace(/\bARE\b/g, ' are ');
  t = t.replace(/\bWAS\b/g, ' was ');
  t = t.replace(/\bWERE\b/g, ' were ');
  t = t.replace(/\bNOT\b/g, ' not ');
  t = t.replace(/\bTHAN\b/gi, ' than ');
  t = t.replace(/\bTHE\b/g, ' the ');
  t = t.replace(/\bAS\b/g, ' as ');
  t = t.replace(/\bING\b/g, ' í ene je ');
  return t
    .replace(/[¿¡]/g, '')
    .replace(/[—–―…]/g, '. ')
    .replace(/\.{2,}/g, '. ')
    .replace(/[;:/]+/g, ' ')
    .replace(/\s*[-]{1,3}\s*/g, ' ')
    .replace(/<br>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Soft spoken cadence — Costa Rica Tico, never Rioplatense "Mirá". */
function humanizeSpokenForTts(text) {
  return String(text || '')
    .replace(/\bPaso\s*\d+\s*[:.\-–—]*/gi, '')
    .replace(/\b(?:Primero|Segundo|Tercero|Cuarto|Quinto)\s*[:.\-–—]/gi, '')
    .replace(/\bEs importante destacar que\b/gi, 'Mira, ')
    .replace(/\bCabe mencionar que\b/gi, '')
    .replace(/\bA continuaci[oó]n\b/gi, 'Entonces')
    .replace(/\bEn conclusi[oó]n\b/gi, 'Entonces')
    .replace(/\bProcedamos a\b/gi, 'Vamos a')
    .replace(/\b(?:OK|Ok),?\s+/g, 'Bueno, ')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/\.{3,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** CR classroom letters: L=ele, G=je (jota), R=erre — never English el/gee/ar. */
const CR_LETTER_NAME = {
  a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'efe', g: 'je', h: 'hache',
  i: 'i', j: 'jota', k: 'ka', l: 'ele', m: 'eme', n: 'ene', o: 'o', p: 'pe',
  q: 'cu', r: 'erre', s: 'ese', t: 'te', u: 'u', v: 'uve', w: 'doble uve',
  x: 'equis', y: 'ye', z: 'zeta'
};

/** CR letter names + kill English gee on ING. Do NOT deform Spanish words (trabajo, etc.). */
function applyCrIngPhonetics(text) {
  let t = String(text || '');
  t = t.replace(/\b(la|el|letra)\s+L\b/gi, '$1 ele');
  t = t.replace(/\b(la|el|letra)\s+G\b/gi, '$1 je');
  t = t.replace(/\b(la|el|letra)\s+R\b/gi, '$1 erre');
  t = t.replace(/\b(la|el|letra)\s+J\b/gi, '$1 jota');
  t = t.replace(/\b([A-Za-zÁÉÍÓÚÑáéíóúñ])(?:\s+([A-Za-zÁÉÍÓÚÑáéíóúñ])){1,6}\b/g, (m) => {
    const parts = m.trim().split(/\s+/);
    if (parts.length < 2 || !parts.every((p) => p.length === 1)) return m;
    return parts.map((p) => {
      if (p.toLowerCase() === 'ñ') return 'eñe';
      const k = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return CR_LETTER_NAME[k] || p;
    }).join(' ');
  });
  t = t.replace(/\bí\s+ene\s+ge\b/gi, 'í ene je');
  t = t.replace(/\bene\s+ge\b/gi, 'ene je');
  return t.replace(/\s{2,}/g, ' ').trim();
}

/**
 * CR classroom phonetics: English HAVE/HAS/HAD → jáf/jás/jád.
 * CRITICAL: NEVER rewrite Spanish "has" (¿Has entendido? / has visto) — that destroys spoken Spanish.
 * CRITICAL: jáf must sound like Spanish JOTA (/x/), never English J ("yaf").
 */
function applyCrHavePhonetics(text) {
  let t = String(text || '');
  t = t.replace(/\byaf\b/gi, 'jáf');
  t = t.replace(/\byas\b/gi, 'jás');
  t = t.replace(/\byad\b/gi, 'jád');
  t = t.replace(/\bjaf\b/gi, 'jáf');
  t = t.replace(/\bjas\b/gi, 'jás');
  t = t.replace(/\bjad\b/gi, 'jád');
  // Explicit paradigms
  t = t.replace(/\bhave\s*\.\s*has\s*\.\s*had\b/gi, 'jáf. jás. jád.');
  t = t.replace(/\bhave\s+has\s+had\b/gi, 'jáf. jás. jád.');
  // Uppercase teaching tokens only
  t = t.replace(/\bHAVE\b/g, ' jáf ');
  t = t.replace(/\bHAS\b/g, ' jás ');
  t = t.replace(/\bHAD\b/g, ' jád ');
  // English subjects + auxiliary
  t = t.replace(/\b(I|you|we|they)\s+have\b/gi, '$1 jáf');
  t = t.replace(/\b(he|she|it)\s+has\b/gi, '$1 jás');
  t = t.replace(/\b(I|you|he|she|it|we|they)\s+had\b/gi, '$1 jád');
  // English perfect: have/has/had + English participle (not Spanish)
  t = t.replace(/\bhave\s+(been|gone|done|seen|made|taken|given|gotten|got|said|sent|kept|put|let|cut|worked|finished|studied|eaten|come)\b/gi, 'jáf $1');
  t = t.replace(/\bhas\s+(been|gone|done|seen|made|taken|given|gotten|got|said|sent|kept|put|let|cut|worked|finished|studied|eaten|come)\b/gi, 'jás $1');
  t = t.replace(/\bhad\s+(been|gone|done|seen|made|taken|given|gotten|got|said|sent|kept|put|let|cut|worked|finished|studied|eaten|come)\b/gi, 'jád $1');
  // Bare English "have" / "had" only — NEVER bare lowercase "has" (Spanish: ¿Has…?)
  t = t.replace(/\bhave\b/gi, 'jáf');
  t = t.replace(/\bhad\b/gi, 'jád');
  return forceSpanishJotaHave(t);
}

/**
 * ElevenLabs multilingual often reads "jáf" with English J (= "yaf").
 * Double-j seeds Spanish jota /x/ in LatAm models; never leave bare yaf.
 */
function forceSpanishJotaHave(text) {
  return String(text || '')
    .replace(/\byaf\b/gi, 'jjáf')
    .replace(/\byas\b/gi, 'jjás')
    .replace(/\byad\b/gi, 'jjád')
    .replace(/\bjáf\b/gi, 'jjáf')
    .replace(/\bjás\b/gi, 'jjás')
    .replace(/\bjád\b/gi, 'jjád')
    .replace(/\bjaf\b/gi, 'jjáf')
    .replace(/\bjas\b/gi, 'jjás')
    .replace(/\bjad\b/gi, 'jjád')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * DO NOT rewrite C/Z→S for TTS. That orthography looks Brazilian Portuguese
 * and ElevenLabs drifts to PT accent. CR seseo is spoken, not spelled.
 */
function applyLatAmSeseoForTts(text) {
  return String(text || '');
}

/** Strip Brazil / Rioplatense / Spain / internal labels — Tico CR only. */
function scrubNonCrSpanish(text) {
  return String(text || '')
    .replace(/\[\[CTYPE:[^\]]*\]\]/gi, '')
    .replace(/\bGet It Straight(?:\s*ING)?\b[:\s—–\-]*/gi, '')
    .replace(/\b(?:John\s+)?Off the Clock\b[:\s—–\-]*/gi, '')
    .replace(/\bJohn\s+Ram[ií]rez\b/gi, '')
    .replace(/\bJohnny(?:\s+Ram[ií]rez)?\b/gi, '')
    .replace(/\bPuente\s+JOHN\b[:\s—–\-]*/gi, 'Puente: ')
    .replace(/\blecci[oó]n\s+(?:can[oó]nica\s+)?John\b[:\s—–\-]*/gi, '')
    .replace(/\bM[oó]dulo\s*0*\d+[A-Z-]*/gi, '')
    .replace(/\bestilo\s+John(?:\s+Ram[ií]rez)?\b/gi, 'estilo Infinity')
    // Spain → Costa Rica
    .replace(/\bvosotros\b/gi, 'ustedes')
    .replace(/\bvosotras\b/gi, 'ustedes')
    .replace(/\bvuestra(?:s)?\b/gi, 'su')
    .replace(/\bvuestro(?:s)?\b/gi, 'su')
    .replace(/\borderadores?\b/gi, 'computadora')
    .replace(/\bcoches?\b/gi, 'carro')
    .replace(/\bm[oó]viles?\b/gi, 'celular')
    .replace(/\bzumos?\b/gi, 'jugo')
    .replace(/\bpatatas?\b/gi, 'papa')
    .replace(/\bchavales?\b/gi, '')
    .replace(/\bt[ií]o\b(?!\s+[A-ZÁÉÍÓÚ])/gi, '')
    .replace(/\bmola\b/gi, 'está bueno')
    .replace(/\bguay\b/gi, 'tuanis')
    .replace(/\bcurrar\b/gi, 'trabajar')
    .replace(/\bcurrando\b/gi, 'trabajando')
    .replace(/\bvale\b(?!\s+(la|el|una?|unos|unas)\b)/gi, 'claro')
    // Argentina / Mar del Plata / Rioplatense — PROHIBIDO (no es tico)
    .replace(/(^|[\s,.—–\-¿¡])che\b[,!.…]*/gi, '$1')
    .replace(/bolud[oa]s?/gi, '')
    .replace(/\blaburando\b/gi, 'trabajando')
    .replace(/\blaburar\b/gi, 'trabajar')
    .replace(/\blabur[aá]s\b/gi, 'trabajás')
    .replace(/\blabura\b/gi, 'trabaja')
    .replace(/\blaburo\b/gi, 'trabajo')
    .replace(/laburo/gi, 'trabajo')
    .replace(/\bte\s+late\b/gi, 'qué te parece')
    .replace(/\bme\s+late\b/gi, 'tuanis')
    .replace(/pib[ea]s?/gi, '')
    .replace(/\bminas?\b(?=\s|$|[.,!?])/gi, '')
    .replace(/en pedo/gi, '')
    .replace(/\bre\s+(bueno|malo|lindo|copado|facil|fácil)\b/gi, 'muy $1')
    .replace(/\bcopado\b/gi, 'tuanis')
    .replace(/\bposta\b/gi, 'de verdad')
    .replace(/\bquilombo\b/gi, 'lío')
    .replace(/\bfiaca\b/gi, 'flojera')
    .replace(/mirá/gi, 'mira')
    .replace(/fíjate/gi, 'fijate')
    // Brasil / portugués — PROHIBIDO (scrub duro: el modelo a veces cuela portuñol)
    .replace(/voc[eê]s?/gi, 'vos')
    .replace(/obrigad[oa]/gi, 'gracias')
    .replace(/beleza/gi, 'tuanis')
    .replace(/valeu/gi, 'gracias')
    .replace(/então/gi, 'entonces')
    .replace(/\bnao\b/gi, 'no')
    .replace(/não/gi, 'no')
    .replace(/\bpra\b/gi, 'para')
    .replace(/\bt[aá]\b(?=\s|$|[.,!?])/gi, 'está')
    .replace(/né/gi, '')
    .replace(/\bpois\b/gi, '')
    .replace(/\bagora\b/gi, 'ahora')
    .replace(/\bmuito\b/gi, 'muy')
    .replace(/\blegal\b/gi, 'tuanis')
    // "mais" (PT) ≠ "mas/más" (ES) — queja recurrente
    .replace(/\bmais\b/gi, 'más')
    .replace(/\btamb[eé]m\b/gi, 'también')
    .replace(/\bainda\b/gi, 'todavía')
    .replace(/\bhoje\b/gi, 'hoy')
    .replace(/\bamanh[ãa]\b/gi, 'mañana')
    .replace(/\bontem\b/gi, 'ayer')
    .replace(/\bcoisa(?:s)?\b/gi, 'cosa')
    .replace(/\bcerto\b/gi, 'cierto')
    .replace(/\berrado\b/gi, 'incorrecto')
    .replace(/\bbem\b/gi, 'bien')
    .replace(/\bbom\b/gi, 'bueno')
    .replace(/\bsim\b(?=\s*[,.!?…]|$)/gi, 'sí')
    // Portuguese "só" (only) — NEVER touch English linker "so" (was destroying Alice TTS)
    .replace(/(^|[^A-Za-zÁÉÍÓÚáéíóúÜüñÑ])só(?=[^A-Za-zÁÉÍÓÚáéíóúÜüñÑ]|$)/gi, '$1solo')
    .replace(/(^|[^A-Za-zÁÉÍÓÚáéíóúÜüñÑ])já(?=[^A-Za-zÁÉÍÓÚáéíóúÜüñÑ]|$)/gi, '$1ya')
    .replace(/\baqui\b/gi, 'aquí')
    .replace(/\bali\b/gi, 'allí')
    .replace(/\bvoc[eê]\s+pode\b/gi, 'vos podés')
    .replace(/\bpreciso\s+de\b/gi, 'necesito')
    .replace(/\ba\s+gente\b/gi, 'nosotros')
    .replace(/\bqualquer\b/gi, 'cualquier')
    .replace(/\bquando\b/gi, 'cuando')
    .replace(/\bporque\b(?=\s+que\b)/gi, 'porque')
    .replace(/\bcomigo\b/gi, 'conmigo')
    .replace(/\bcontigo\b/gi, 'contigo')
    .replace(/\bdepois\b/gi, 'después')
    .replace(/\bantes\b/gi, 'antes')
    .replace(/\bmuito\s+bem\b/gi, 'muy bien')
    .replace(/\best[aá]\s+bom\b/gi, 'está bien')
    .replace(/\bok\s+ent[aã]o\b/gi, 'ok entonces')
    .replace(/qu[eé]\s+gusto\s+verte(?:\s+de\s+nuevo)?(?:\s*,?\s*[A-Za-zÁÉÍÓÚáéíóúñÑ]+)?\s*[—–\-,:.]?\s*/gi, '')
    .replace(/\bclaro\s*,\s*[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s*[—–\.]\s*(?=ac[aá]\s+te\s+va)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

/** Fixed demo script lines → voiceId (ElevenLabs only once per line, then cache forever). */
let DEMO_BUFFER_VOICE_MAP = null;
function getDemoBufferVoiceMap() {
  if (DEMO_BUFFER_VOICE_MAP) return DEMO_BUFFER_VOICE_MAP;
  DEMO_BUFFER_VOICE_MAP = new Map();
  const profiles = getDemoVoiceProfiles();
  const entries = [
    ['alice', ALICE_VOICE_ID],
    ['alice_companion', ALICE_VOICE_ID],
    ['jill', JILL_VOICE_ID],
    ['nexora_star', profiles.nexora_star?.voiceId || ALICE_VOICE_ID],
    ['nexora_cs', profiles.nexora_cs?.voiceId || JILL_VOICE_ID]
  ];
  const add = (raw, voiceId) => {
    const c = cleanTtsText(stripDemoMd(raw));
    if (c && voiceId) DEMO_BUFFER_VOICE_MAP.set(c, voiceId);
  };
  for (const [key, voiceId] of entries) {
    const b = DEMO_BUFFER[key];
    if (!b) continue;
    add(b.start, voiceId);
    (b.steps || []).forEach((s) => add(s, voiceId));
    if (b.finish?.reply) add(b.finish.reply, voiceId);
  }
  return DEMO_BUFFER_VOICE_MAP;
}

function demoBufferVoiceForText(text) {
  const c = cleanTtsText(stripDemoMd(text));
  if (!c) return null;
  return getDemoBufferVoiceMap().get(c) || null;
}

/**
 * Get TTS audio from RAM/brain cache, or call ElevenLabs once and store.
 * Returns { buffer, cache: 'RAM'|'HIT'|'MISS' }
 */
/**
 * IRREMPIBLE — solo DOS acentos / idiomas en tutores (Jill / Alice classroom TTS):
 *   1) Español = latinoamericano (es-CR / LatAm)
 *   2) Inglés  = americano (en-US)
 * Cualquier otro código (en-GB, pt, es-ES, auto, mix) se fuerza a uno de esos dos.
 */
function resolveTutorTtsLang(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'en' || s === 'en-us' || s.startsWith('en')) return 'en-US';
  return 'es-CR';
}

function tutorTtsIsEnglish(lang) {
  return resolveTutorTtsLang(lang) === 'en-US';
}

function tutorElevenLanguageCode(lang) {
  // ElevenLabs: 'es' = Spanish (LatAm with our settings); 'en' = American English
  return tutorTtsIsEnglish(lang) ? 'en' : 'es';
}

async function getOrCreateTtsAudio(text, voiceId, label, opts = {}) {
  if (!ELEVEN_KEY) throw new Error('ELEVENLABS_KEY not configured');
  if (!voiceId) throw new Error(`${label || 'TTS'} voice ID not configured`);
  let clean = cleanTtsText(text);
  if (!clean) throw new Error('Empty text');
  const languageCode = resolveTutorTtsLang(opts.languageCode || 'es-CR');
  // Español un poco más natural; inglés puede ir un toque más rápido
  const speed = opts.speed ?? (tutorTtsIsEnglish(languageCode) ? 1.08 : 1.0);
  const isSpanish = !tutorTtsIsEnglish(languageCode);
  // Tico CR: scrub AR/PT/ES-Spain. NEVER C/Z→S rewrite (that causes Brazilian drift).
  if (isSpanish) {
    clean = scrubNonCrSpanish(clean);
    clean = humanizeSpokenForTts(clean);
    // Fonética MSI solo donde hay inglés de clase — NO romper español ("¿Has entendido?" ≠ jás)
    // NO aplicar en Alice English chat: have debe sonar "have", no "yaf/jáf"
    if (/\b(have|has|had|HAVE|HAS|HAD|jáf|jás|jád|jjáf|jjás|jjád|yaf|ing|ING)\b/.test(clean)) {
      clean = applyCrHavePhonetics(clean);
      clean = applyCrIngPhonetics(clean);
    }
  } else {
    // English path: if model already wrote jáf/yaf, still force jota (never English J)
    if (/\b(jáf|jás|jád|jaf|jas|jad|jjáf|yaf|yas|yad)\b/i.test(clean)) {
      clean = forceSpanishJotaHave(clean);
    }
  }
  if (!clean) throw new Error('Empty text');

  // Clips with classroom HAVE phonetics → force Spanish so jota is /x/ not English "yaf"
  let effectiveLang = languageCode;
  if (/\b(jjáf|jjás|jjád|jáf|jás|jád)\b/i.test(clean)) {
    effectiveLang = 'es-CR';
  }
  const effectiveIsSpanish = !tutorTtsIsEnglish(effectiveLang);

  // turbo_v2_5 + language_code: Spanish LatAm / English American — no Castilian/PT/British drift
  const modelId = effectiveIsSpanish
    ? (process.env.ELEVEN_TTS_MODEL_ES || 'eleven_turbo_v2_5')
    : (process.env.ELEVEN_TTS_MODEL_EN || process.env.ELEVEN_TTS_MODEL || 'eleven_turbo_v2_5');

  const elevenLang = tutorElevenLanguageCode(effectiveLang);
  // dualaccent1 + jota3: LatAm ES + American EN; HAVE = Spanish jota not English J
  const brainLang = `${effectiveLang}|${elevenLang}|s${Number(speed).toFixed(2)}|dualaccent1|jota3|${modelId}`;
  const cacheKey = getTTSCacheKey(clean, voiceId, effectiveLang + '|jota3', speed, modelId);
  if (ttsCache.has(cacheKey)) {
    return { buffer: ttsCache.get(cacheKey), cache: 'RAM', clean };
  }

  const brainTts = await Brain.brainGetTTS(clean, voiceId, brainLang);
  if (brainTts.hit) {
    cacheTTS(cacheKey, brainTts.buffer);
    return { buffer: brainTts.buffer, cache: 'HIT', clean };
  }

  const payload = {
    text: clean,
    model_id: modelId,
    language_code: elevenLang,
    voice_settings: {
      stability: opts.stability ?? 0.52,
      similarity_boost: opts.similarityBoost ?? 0.78,
      style: opts.style ?? 0.12,
      use_speaker_boost: true,
      speed
    }
  };

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(payload)
  });

  if (!r.ok) {
    const err = await r.text();
    console.error(`${label || 'TTS'} ElevenLabs ${r.status}:`, err.slice(0, 500));
    if (r.status === 401 || /quota|limit_exceeded|credit|subscription/i.test(err)) {
      throw new Error('ELEVENLABS_QUOTA');
    }
    throw new Error('TTS failed');
  }

  const buf = Buffer.from(await r.arrayBuffer());
  cacheTTS(cacheKey, buf);
  if (brainTts.hash) await Brain.brainSetTTS(brainTts.hash, clean, voiceId, buf, brainLang);
  return { buffer: buf, cache: 'MISS', clean };
}

async function synthesizeSpeech(req, res, { text, voiceId, label, stability, similarityBoost, style, speed, languageCode }) {
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const { buffer, cache } = await getOrCreateTtsAudio(text, voiceId, label, {
      stability, similarityBoost, style, speed, languageCode
    });
    res.set('Content-Type', 'audio/mpeg');
    res.set('X-Cache', cache === 'MISS' ? 'MISS' : 'HIT');
    res.set('X-Brain-TTS', cache);
    if (cache === 'MISS') res.set('Cache-Control', 'no-cache');
    return res.send(buffer);
  } catch (err) {
    if (err.message === 'Empty text') return res.status(400).json({ error: 'Empty text' });
    if (err.message.includes('not configured')) return res.status(503).json({ error: err.message, code: 'ELEVEN_KEY_MISSING' });
    if (err.message === 'ELEVENLABS_QUOTA') return res.status(503).json({ error: 'ElevenLabs quota or key invalid', code: 'ELEVEN_QUOTA' });
    return res.status(500).json({ error: 'TTS failed', code: 'ELEVEN_ERROR' });
  }
}

/** Pre-generate all demo buffer lines once (ElevenLabs only on cache miss). */
async function warmDemoBufferTts() {
  if (!ELEVEN_KEY) {
    console.warn('Demo TTS warm skipped: no ELEVENLABS_KEY');
    return;
  }
  const map = getDemoBufferVoiceMap();
  console.log('Warming demo buffer TTS:', map.size, 'clips');
  let miss = 0;
  for (const [text, voiceId] of map) {
    try {
      const r = await getOrCreateTtsAudio(text, voiceId, 'Demo buffer');
      if (r.cache === 'MISS') miss++;
      await new Promise((ok) => setTimeout(ok, 250));
    } catch (e) {
      console.warn('Demo TTS warm fail:', e.message);
    }
  }
  console.log('Demo buffer TTS ready. New ElevenLabs calls this boot:', miss);
}


// ── AI PROFILE — preferred name + returning sessions ────────
function getStudentFirstName(student) {
  const full = String(student?.info?.name || student?.name || '').trim();
  return full.split(/\s+/)[0] || 'estudiante';
}

function getStudentDisplayName(student) {
  sanitizeStudentAiProfile(student);
  return getStudentFirstName(student);
}

function sanitizeStudentAiProfile(student) {
  if (!student?.aiProfile) return;
  const raw = String(student.aiProfile.preferredName || '').trim();
  if (!raw) return;
  const valid = sanitizePreferredNameServer(raw);
  const registered = getStudentFirstName(student).toLowerCase();
  const token = raw.split(/\s+/)[0].toLowerCase();
  if (!valid || PREFERRED_NAME_NON_WORDS.has(valid.toLowerCase()) || STAFF_NAME_BLOCKLIST.has(token) || token !== registered) {
    student.aiProfile.preferredName = '';
  }
}

const PREFERRED_NAME_BLOCKLIST = ['idiota','tonto','stupid','idiot','puto','puta','mierda','shit','fuck','asshole','pendejo','cabron','cabrón','imbecil','imbécil','moron','retard','bitch','perra','slut','whore'];
const STAFF_NAME_BLOCKLIST = new Set(['johnny','john','trainer','admin','guest','student','teacher','infinity','alice','jill','nexora','claire','adam']);
const PREFERRED_NAME_NON_WORDS = new Set([
  'planning','planing','planned','going','doing','trying','thinking','learning','studying','practicing','working',
  'looking','speaking','talking','writing','reading','watching','listening','feeling','having','being',
  'getting','waiting','calling','helping','starting','finishing','meeting','running','walking','busy',
  'ready','fine','good','great','here','back','sorry','happy','tired','well','okay','ok','yes','no',
  'just','only','really','very','also','still','about','today','tomorrow','practice','english','lesson'
]);

function sanitizePreferredNameServer(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 24) return null;
  if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/.test(clean)) return null;
  const token = clean.split(/\s+/)[0];
  const lower = token.toLowerCase();
  if (PREFERRED_NAME_NON_WORDS.has(lower)) return null;
  if (PREFERRED_NAME_BLOCKLIST.some(b => lower.includes(b))) return null;
  if (STAFF_NAME_BLOCKLIST.has(lower)) return null;
  if (/ing$/i.test(token) && token.length > 4) return null;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function isReturningStudent(student, tutor) {
  const key = tutor === 'alice' ? 'alice' : 'jill';
  return !!(student?.aiProfile?.firstGreetingDone && student.aiProfile.firstGreetingDone[key]);
}

function buildAiProfileNote(student, tutor) {
  const key = tutor === 'alice' ? 'alice' : 'jill';
  const first = getStudentFirstName(student);
  const display = getStudentDisplayName(student);
  const ai = student?.aiProfile || {};
  const returning = !!(ai.firstGreetingDone && ai.firstGreetingDone[key]);
  let note = `\nSTUDENT NAME — ONLY use "${display}" (registered: "${first}"). Never guess or reuse another name.`;
  if (returning) {
    note += tutor === 'alice'
      ? ` RETURNING student: say "Welcome back, ${display}" briefly (1-2 sentences). Do NOT greet like a first meeting.`
      : ` RETURNING student: say "Qué gusto verte de nuevo, ${display}" briefly. Do NOT greet like a first meeting.`;
  } else {
    note += tutor === 'alice'
      ? ` FIRST meeting: warm intro + ONE practice question. Do NOT ask how they prefer to be called — use "${display}" only.`
      : ` FIRST meeting: brief intro + ONE practice question. Do NOT ask preferred name — use "${display}" only.`;
  }
  note += ` NEVER use Johnny, Planning, Going, Trying, or any -ing verb as a name. NEVER use trainer/staff/demo names.`;
  note += ` Never use humiliating, sexual, or offensive nicknames. Professional warmth always.`;
  return note + buildKpiFileNote(student);
}

function buildKpiFileNote(student) {
  const kf = student?.kpiFile;
  if (!kf || !kf.macro) return '';
  const macroLine = Object.keys(kf.macro).map(k => `${k}:${kf.macro[k]}/10`).join(', ');
  const weak = [...(kf.weakMacro || []), ...(kf.weakMicro || [])].slice(0, 8).join(', ');
  return `\nKPI FILE (trainer calibration · scale 1–10): ${kf.score || '—'}/${kf.scoreMax || 50} · ${kf.level || ''}. Macro: ${macroLine}. Micro overall: ${kf.microOverall ?? '—'}/100.${weak ? ` Prioritize: ${weak}.` : ''}${kf.trainerNotes ? ` Trainer note: ${String(kf.trainerNotes).slice(0, 200)}` : ''}`;
}

const INSTITUTIONAL_BRAIN_RULE = `INSTITUTIONAL BRAIN (always true):
- ONE shared knowledge base (Super Brain) for Jill, Alice tutor, Alice Companion, Nexora, and all Infinity AIs.
- Same data for everyone — ONLY student level and how you teach/explain differ, not separate KBs.
- PROACTIVE: weave relevant canon doctrine (chunking, linkers, structure, 0/0/0) into each teaching turn when natural — do not wait for the student to ask.
- If the student does not understand: adapt delivery (shorter, example, analogy, slower pace)—never break Nexus Method.
- ABSOLUTE: John Ramírez teaching style ONLY (class transcripts + canon). Forbidden to teach as a generic chatbot.`;

const JILL_INSTITUTIONAL_BRAIN_RULE = `INSTITUTIONAL BRAIN (Jill / Foundations MSI®):
- ONE shared Super Brain — same data as Alice/Nexora; YOUR delivery is Mecánica Estructural Infinity® (P|M|V|C), método moneda, chunks de UNA oración estructurada.
- PROACTIVE: weave MSI® doctrine (ranuras, fórmulas PR/PS/PC/PRP/PPC/MOD, método moneda) — NEVER proactive linker chains or Idea+Linker+Idea.
- Linkers avanzados (however, furthermore, on top of that, as a result…) = territorio Alice. Redirigí en una frase si preguntan.
- If the student does not understand: adapt delivery — never break MSI® method.
- ABSOLUTE: estilo John Ramírez ONLY. Prohibido improvisar otro método.`;

function jillReplyHasAliceLinkers(text) {
  const raw = String(text || '');
  const t = raw.toLowerCase();
  if (/idea\s*\+\s*linker\s*\+\s*idea/i.test(raw)) return true;
  if (/\b(on top of that|furthermore|as a result|even though|in other words|therefore|besides|so far)\b/i.test(raw)) {
    if (/alice|intermediate|profundiz|territorio de alice/i.test(t)) return false;
    return true;
  }
  if (/\b(linkers?|conectores nexus)\b/i.test(raw) && !/alice|profundiz/i.test(t)) return true;
  if (/\bhowever\b/i.test(raw) && /\b(practic[aá]|us[aá]|conect|linker|cadena)\b/i.test(t)) return true;
  return false;
}

function filterJillSuperBrainContext(ctx, lockedTrackId) {
  const locked = String(lockedTrackId || '').trim();
  return String(ctx || '').split('\n').filter((line) => {
    const l = line.toLowerCase();
    if (/idea\s*\+\s*linker/i.test(line)) return false;
    if (/\blinkers?\b/.test(l) && /nexus|conector|however|furthermore|on top of that/i.test(l)) return false;
    if (/mínimo.*linker|3 linkers|tres conectores/i.test(l)) return false;
    // F0 / STRUCTURE CANON mete TODOS los tiempos en cada turno → Jill enseña panorama en vez del pedido.
    if (/structure canon\b/i.test(l)) return false;
    if (/f0 progression/i.test(l)) return false;
    if (/pr\s*→\s*ps\s*→\s*pc/i.test(l)) return false;
    if (/siglas:\s*pr=/i.test(l)) return false;
    if (/formulas:\s*pr:/i.test(l)) return false;
    if (/sistema completo|once estructuras|11 tiempos|overview de tiempos/i.test(l)) return false;
    if (locked) {
      // Con cualquier lock: no colar doctrina de otros tiempos/módulos.
      if (locked === 'past' && /\b(presente simple|present perfect|futuro|will have|gerundio|will=-ré)\b/i.test(l) && !/pasado|past|was|were|yesterday/i.test(l)) return false;
      if (locked === 'present' && /\b(pasado simple|presente perfecto|pasado perfecto|futuro perfecto|will have|would=-r[ií]a)\b/i.test(l)) return false;
      if ((locked === 'pronouns') && /\b(pasado|perfecto|futuro|gerundio|will|would|f0)\b/i.test(l)) return false;
    }
    return true;
  }).join('\n').trim();
}

function detectStudySignals(text) {
  const t = String(text || '').toLowerCase();
  const signals = {};
  if (/\b(no entiendo|no comprendo|confus|perdid|lost|don't understand|do not understand|confused|what do you mean)\b/.test(t)) signals.confused = true;
  if (/\b(más corto|más breve|shorter|resume|resumí|keep it short|too long)\b/.test(t)) signals.prefersShort = true;
  if (/\b(otro ejemplo|another example|dame un ejemplo|give me an example|más ejemplos)\b/.test(t)) signals.prefersExamples = true;
  if (/\b(más lento|slow down|despacio|muy rápido|too fast)\b/.test(t)) signals.prefersSlow = true;
  if (/\b(en español|in spanish|explicame en español|explain in spanish)\b/.test(t)) signals.prefersSpanish = true;
  if (/\b(visual|diagrama|dibujo|picture|see it)\b/.test(t)) signals.prefersVisual = true;
  return signals;
}

function mergeStudyPrefs(student, message) {
  if (!student) return false;
  const signals = detectStudySignals(message);
  if (!Object.keys(signals).length) return false;
  student.aiProfile = student.aiProfile || {};
  const lp = { ...(student.aiProfile.learningPrefs || {}) };
  if (signals.confused) lp.confusionCount = (lp.confusionCount || 0) + 1;
  if (signals.prefersShort) lp.prefersShort = true;
  if (signals.prefersExamples) lp.prefersExamples = true;
  if (signals.prefersSlow) lp.prefersSlow = true;
  if (signals.prefersSpanish) lp.prefersSpanish = true;
  if (signals.prefersVisual) lp.prefersVisual = true;
  lp.lastSignalAt = new Date().toISOString();
  student.aiProfile.learningPrefs = lp;
  return true;
}

async function persistStudentLearningState(student) {
  if (!student?.id) return;
  try {
    const row = await sbGetOne('infinity_students', student.id);
    const data = { ...(row?.data || {}), id: student.id };
    if (student.aiProfile?.learningPrefs) {
      data.aiProfile = { ...(data.aiProfile || {}), ...(student.aiProfile || {}) };
      data.aiProfile.learningPrefs = student.aiProfile.learningPrefs;
    }
    if (student.jillCalibration) data.jillCalibration = student.jillCalibration;
    if (student.sharedLearner) data.sharedLearner = student.sharedLearner;
    if (student.quizWeakKpis) data.quizWeakKpis = student.quizWeakKpis;
    await sbSet('infinity_students', student.id, data);
  } catch (e) {
    console.warn('persistStudentLearningState:', e.message);
  }
}

function buildStudyAdaptationNote(student, message) {
  const lp = student?.aiProfile?.learningPrefs || {};
  const live = detectStudySignals(message);
  const parts = [];
  if (live.confused || (lp.confusionCount || 0) >= 2) {
    parts.push('Student signaled confusion — simplify to ONE idea, check understanding, then practice.');
  }
  if (live.prefersShort || lp.prefersShort) parts.push('Prefer SHORT delivery (2-3 sentences before practice).');
  if (live.prefersExamples || lp.prefersExamples) parts.push('Lead with a CONCRETE example before rules.');
  if (live.prefersSlow || lp.prefersSlow) parts.push('Slower pace — smaller steps, confirm each step.');
  if (live.prefersSpanish || lp.prefersSpanish) parts.push('Add a brief Spanish bridge if needed (Jill: in Spanish; Alice: ALICE tip line).');
  if (live.prefersVisual || lp.prefersVisual) parts.push('Use a visual/analogy description (whiteboard-style if available).');
  const cal = student?.jillCalibration;
  if (cal?.initialDone && cal.route?.summary) {
    parts.push(`Calibration route saved: ${cal.route.summary}`);
    if (cal.route.weakKpis?.length) parts.push(`Prioritize KPIs from calibration: ${cal.route.weakKpis.join(', ')}.`);
  }
  const shared = SharedLearner.buildSharedLearnerNote(student);
  if (shared) parts.push(shared.trim());
  if (!parts.length) return '';
  return `\nADAPTATION (same brain, different delivery — prefs + calibration + shared learner):\n${parts.map((p) => `- ${p}`).join('\n')}`;
}

function loadJsonFromConfig(name) {
  const paths = [
    path.join(__dirname, '../config/' + name),
    path.join(__dirname, 'config/' + name)
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { /* try next */ }
  }
  return null;
}

let _jillStructureCanonCache = null;
function getJillStructureCanon() {
  if (!_jillStructureCanonCache) _jillStructureCanonCache = loadJsonFromConfig('jill-structure-canon.json');
  return _jillStructureCanonCache;
}

function buildJillStructureNotationBlock() {
  const c = getJillStructureCanon();
  if (!c) return '';
  const sym = Object.entries(c.symbols || {}).map(([k, v]) => `${k}=${v}`).slice(0, 12).join('; ');
  const forms = (c.formulas || []).map(f => `${f.sigla}: ${f.notation} → ${f.example}`).join(' | ');
  const coin = c.coinMethod ? `\nMÉTODO MONEDA: ${c.coinMethod.rule} Excepciones: ${(c.coinMethod.exceptions || []).join('; ')}` : '';
  const bridge = c.modalBridge
    ? '\nPUENTE MODALES CR: ' + Object.entries(c.modalBridge).map(([m, v]) => `${m}: ${v.hint}`).join(' · ')
    : '';
  const kpis = (c.kpiFocus || []).map(k => k.name).join(', ');
  const gate = c.gate ? `\nGATE: ${Math.round((c.gate.masteryRatio || 1) * 100)}% celdas × ${c.gate.hitsPerCell || 3} aciertos; meta respuesta <${c.gate.targetResponseMs || 12000}ms.` : '';
  const disc = c.foundationsDiscipline
    ? `\nDISCIPLINA F0: ${c.foundationsDiscipline.rule} Verbos núcleo (16): ${(c.foundationsDiscipline.coreVerbs16 || []).join(', ')}. ${c.foundationsDiscipline.vocabCeiling || ''}`
    : '';
  return `\nNOTACIÓN MSI® (usar en whiteboard con siglas PR/PS/PC/PRP/MOD/MP/MC):\nSímbolos: ${sym}\nFórmulas: ${forms}${coin}${bridge}\nKPI foco por turno (rotar): ${kpis}.${gate}${disc}\nCorrección SIEMPRE por ranuras P|M|V|C. Pronunciación: da sonidos imitables (seem/síim, gets/guéts). Cuaderno: anécdota 15 min → leer → coaching on-the-go.`;
}

const JILL_STRUCTURE_NOTATION = buildJillStructureNotationBlock();

const JILL_COIN_METHOD_RULE = `
MÉTODO DE LA MONEDA (pregunta vs respuesta):
- Regla: auxiliar/verbo a la IZQUIERDA del pronombre → pregunta (Are you…? Did she…?).
- Verbo a la DERECHA del pronombre → afirmación (You are… / She worked…).
- Excepciones: WH- al inicio; imperativo sin pronombre; tag questions.
- Practicá con quiz Pulse; en sesión pedí identificar pregunta vs respuesta en 1 oración.`;

function formatJillVocabNote(vocabContext) {
  if (!vocabContext || !vocabContext.activeWords?.length) return '';
  return `\nVOCAB ACTIVO (techo gradual — drill + lista activa, max ~24): ${vocabContext.activeWords.slice(0, 14).join(', ')}. Solo palabras dentro de P+V+C; dominios funcionales ya introducidos.`;
}

function formatJillResponseKpiNote(matrixContext) {
  if (!matrixContext || matrixContext.bundleId !== 'F0-matrix') return '';
  const avg = matrixContext.avgResponseMs;
  const target = matrixContext.targetResponseMs || 12000;
  if (avg == null) return '\nKPI TIEMPO: medir respuesta estructurada; meta <12s desde el drill.';
  return `\nKPI TIEMPO RESPUESTA: promedio ${avg}ms (meta <${target}ms). Si >meta: simplificar drill a UNA ranura.`;
}

function formatJillBundleNote(jillBundle) {
  if (!jillBundle) return '';
  const parts = [
    `\nBUNDLE ACTIVO JILL (Foundations): ${jillBundle.title || jillBundle.id}`,
    jillBundle.phase ? `Fase ${jillBundle.phase}` : '',
    jillBundle.foundationsSection ? `Sección: ${jillBundle.foundationsSection}` : '',
    jillBundle.doctrine ? `Doctrina: ${jillBundle.doctrine}` : '',
    jillBundle.structureRules?.length ? `Reglas Mecánica Estructural Infinity®: ${jillBundle.structureRules.join(' | ')}` : (jillBundle.legoRules?.length ? `Reglas Mecánica Estructural Infinity®: ${jillBundle.legoRules.join(' | ')}` : ''),
    jillBundle.structures?.length ? `Estructuras: ${jillBundle.structures.join('; ')}` : '',
    jillBundle.vocabDomains?.length ? `Dominios vocab: ${jillBundle.vocabDomains.slice(0, 6).join(', ')}` : '',
    jillBundle.exitCriteria?.length ? `Perfil salida (checklist): ${jillBundle.exitCriteria.join('; ')}` : '',
    jillBundle.aliceTransition ? `Transición Alice: ${jillBundle.aliceTransition}` : '',
    `Temas: ${(jillBundle.topics || []).join('; ')}`,
    `Whiteboard: ${(jillBundle.whiteboard || []).join(' | ')}`,
    `KPIs bundle: ${(jillBundle.kpis || []).join(', ')}`,
    'Enseñá Mecánica Estructural Infinity® + chunking — NO listas ni frases memorizadas. El bundle es la guía de HOY (prioridad), pero podés atender preguntas Foundations válidas fuera del bundle y volver al tema activo.'
  ].filter(Boolean);
  return parts.join('. ') + '.';
}

const JILL_F0_MATRIX_RULE = `
F0 MATRIX MODE (OBLIGATORIO cuando bundle F0-matrix o matrixContext activo):
- Columnas 1-5 primero; Col 6 MOD (will=-RE / would=-RÍA) solo cuando matrixContext.activeColumn=modal o columnas previas dominadas.
- NO Nexora, entrevistas STAR ni chunking avanzado hasta anecdoteUnlocked.
- Evalúa cada respuesta por RANURAS: P | M | V | C (modal en col 6).
- IMPERATIVO MÉTODO: rotar pronombre (no solo I) y tiempo/columna; cada afirmación exige par pregunta con inversión (método moneda: aux/be/modal al frente).
- Si falla una ranura: nombra la ranura, muestra la fórmula en whiteboard, pide UNA oración + la MISMA en pregunta (inversión).
- Usa matrixContext.drillPrompt como objetivo del turno; luego pide variante (otro pronombre del drill o pregunta moneda).
- Modo anécdota (anecdoteMode true): corrige pronunciación, tiempos, coordinación, preposiciones en el texto leído/pegado — sin cambiar de tema.
- Ritmo: regla corta + 1 ejemplo modelo + 1 práctica afirmación + 1 práctica pregunta. Explicación en español; práctica en inglés estructurado.`;

const JILL_CONVERSATION_POLISH_RULE = `
FASE CONVERSACIÓN FOUNDATIONS (matrixContext.conversationPhase true — estructura y teoría dominadas):
- YA NO es solo drill de una oración: FORZÁ conversación sostenida. Jill habla poco; el estudiante habla mucho.
- IMPERATIVO: el estudiante DEMUESTRA dominio conjugando tiempos y pronombres en contexto, haciendo preguntas con inversión (moneda), y combinando estructuras (MSI + prep + there + artículos) sin que vos nombres la gramática.
- Pedí variantes en vivo: "ahora en pasado", "otro pronombre", "hacelo pregunta", "combiná con in/on/at o there is".
- Escuchá cada turno, compará contra MSI® (ranuras P|M|V|C) y canon — NO exijas linkers Nexus (however, furthermore, on top of that). Eso es Alice.
- Analizá: tiempo verbal correcto, preguntas invertidas, coordinación básica (and/but), lógica, improvisación, esfuerzo evidente bajo, fluidez.
- Corregí on-the-go con afecto firme — como trainer en sala, no como chatbot.
- Hacé preguntas de seguimiento, cambiá de tema dentro de Foundations, pedí que amplíe con detalle concreto.
- NUNCA gradués automáticamente. Solo al terminar sesión (modo evaluate) podés marcar graduation_request:true si TODOS los KPIs conversacionales de Johnny se cumplen en la evidencia del transcript (incluye conjugación + inversión + combinación).
- Si aún hay errores de tiempo, inversión en preguntas, coordinación o esfuerzo evidente: seguí puliendo — graduation_request:false.`;

function jillStructurePrerequisitesMet(student, matrixContext) {
  const m = student?.jillMatrix || {};
  const ctx = matrixContext || {};
  const pulseOk = !!(m.pulseQuizPassed || student?.jillPulse?.passed);
  const anecdoteOk = (m.anecdoteSessions || 0) >= 1 || !!m.anecdoteEvaluated;
  const timeOk = m.avgResponseMs == null || m.avgResponseMs <= 15000;
  const writtenOk = (m.writtenDaysCompleted || 0) >= (ctx.writtenDaysRequired || 22)
    || !!ctx.writtenPhaseOk;
  const colsOk = !!(m.allColumnsMastered || ctx.allColumnsMastered)
    || JillF0Gate.allColumnsMastered(student);
  if (!pulseOk || !anecdoteOk || !timeOk || !writtenOk || !colsOk) return false;
  return true;
}

function jillBundleAdvanceAllowed(student, jillBundle) {
  const bid = jillBundle?.id || student?.jillProgress?.activeBundle;
  if (bid !== 'F0-matrix') return { ok: true, reason: null };
  const gate = JillF0Gate.canAdvanceFromBundle(student, bid);
  return { ok: gate.ok, reason: gate.reason };
}

function formatJillConversationNote(matrixContext, student) {
  const phase = matrixContext?.conversationPhase || jillStructurePrerequisitesMet(student, matrixContext);
  if (!phase) return '';
  const pending = student?.jillGraduationRequest?.pending;
  return pending ? '\nSOLICITUD GRADUACIÓN PENDIENTE: el estudiante puede confirmar — vos ya evaluaste que cumple KPIs conversacionales.' : '';
}

async function finalizeJillEvaluation(student, evaluation, hist) {
  let trainerInsight = null;
  if (student && evaluation && hist && hist.length >= 12) {
    try {
      trainerInsight = await JillTrainerInsights.generateTrainerInsights(claudeCall, SuperBrain, {
        student,
        evaluation,
        hist,
        displayName: getStudentDisplayName(student)
      });
    } catch (e) {
      console.warn('jill trainer insight:', e.message);
    }
  }
  if (student && evaluation) {
    SharedLearner.recordEvent(student, {
      source: 'jill',
      kind: 'session_eval',
      score: evaluation.overall_score != null ? evaluation.overall_score : null,
      topics: evaluation.weak_areas || evaluation.improvements || [],
      summary: String(evaluation.main_improvement || evaluation.jill_message || '').slice(0, 200)
    });
    persistStudentLearningState(student).catch(() => {});
  }
  const payload = { evaluation };
  if (trainerInsight) {
    payload.trainerInsight = trainerInsight;
    payload.kpis = student.kpis ? { phase1: { ...student.kpis.phase1 } } : null;
  }
  return payload;
}

function formatJillMatrixNote(matrixContext) {
  if (!matrixContext || matrixContext.bundleId !== 'F0-matrix') return '';
  const parts = [
    '\nMATRIZ F0 (gate matrix-only · 100% celdas × 3 aciertos):',
    matrixContext.phaseLabel ? `Columna: ${matrixContext.phaseLabel}` : '',
    matrixContext.sigla ? `Sigla: ${matrixContext.sigla}` : '',
    matrixContext.formula ? `Fórmula: ${matrixContext.formula}` : '',
    matrixContext.drillPrompt ? `Drill activo: ${matrixContext.drillPrompt}` : '',
    matrixContext.drillQuestionPrompt ? `Drill pregunta: ${matrixContext.drillQuestionPrompt}` : '',
    matrixContext.conjugationRule ? `Conjugacion: ${matrixContext.conjugationRule}` : '',
    matrixContext.columnProgress != null ? `Progreso columna: ${matrixContext.columnProgress}%` : '',
    matrixContext.columnsSummary ? `Estado columnas: ${matrixContext.columnsSummary}` : '',
    matrixContext.anecdoteMode ? 'MODO ANÉCDOTA — cuaderno 15 min → leer → coaching estructura/coherencia/pronunciación.' : '',
    matrixContext.anecdoteUnlocked && !matrixContext.anecdoteMode ? 'Anécdota desbloqueada cuando 100% columnas.' : '',
    matrixContext.writtenDaysCompleted != null
      ? `FASE ESCRITA 15+10: día ${matrixContext.writtenDaysCompleted}/${matrixContext.writtenDaysRequired || 22} (obligatorio antes de conversación oral).`
      : '',
    matrixContext.writtenPhaseOk ? '22 días escritos cumplidos — puede activar fase conversación si matriz+Pulse+anécdota OK.' : '',
    matrixContext.allColumnsMastered ? 'Matriz 100% columnas PR·PS·PC·PRP·PPC·MOD.' : '',
    matrixContext.linkersFoundations
      ? `LINKERS FOUNDATIONS (solo): ${matrixContext.linkersFoundations}. NO however/furthermore (Alice).`
      : 'LINKERS FOUNDATIONS: and, but, because, so. NO however/furthermore (Alice).',
    matrixContext.cronogramHint === 'explain_alternate_channel'
      ? 'CRONOGRAMA: falla sistemática 3+ — explicá el MISMO tema de 3 formas distintas (verbal → tabla PR/PS → método moneda) antes de avanzar.'
      : '',
    'NO modales avanzados hasta gate. Corrección por ranuras P|M|V|C. Sin linkers Nexus — eso es Alice. Sonidos imitables en pronunciación.'
  ].filter(Boolean);
  return parts.join(' ') + '.';
}

function jillMatrixPromptExtras(jillBundle, matrixContext, student) {
  const isF0 = jillBundle?.id === 'F0-matrix' || jillBundle?.gateMode === 'matrix-only' || matrixContext?.gateMode === 'matrix-only';
  const convPhase = matrixContext?.conversationPhase || jillStructurePrerequisitesMet(student, matrixContext);
  return {
    isF0,
    matrixNote: formatJillMatrixNote(matrixContext),
    matrixRule: isF0 ? (convPhase ? JILL_CONVERSATION_POLISH_RULE : JILL_F0_MATRIX_RULE) : '',
    conversationNote: formatJillConversationNote(matrixContext, student)
  };
}

app.post('/alice', requireProductAuth, async (req, res) => {
  try {
    let { student, history, message, mode, secret, nexora, sessionType, companionTopic } = req.body || {};
    student = await assertStudentTutorAccess(req, res, 'alice', student, {
      sessionType: sessionType || req.body?.sessionType || null,
      allowCompanionProduct: sessionType === 'companion'
    });
    if (!student) return;
    sanitizeStudentAiProfile(student);
    const companionCtx = Companion.resolveCompanionSession(student, sessionType);
    const effectiveSessionType = companionCtx.sessionType;
    const companionCfg = companionCtx.config;

    const isKamuk = student?.id && student.id.startsWith('KAM-');
    const tutorName = 'Alice';
    const sessionTable = isKamuk ? 'kamuk_sessions' : 'infinity_sessions';

    // START / RETURN SESSION
    if (mode === 'start_session' || mode === 'return_session') {
      const tb = (student?.trainingBook || []).slice(0,4)
        .map(ex => `- ${ex.title}: ${ex.studentTask || ''}`).join('\n');
      const actorKey = resolveActorKey({ student, req });
      const recent = await getRecentOpenings(actorKey, 'alice');
      const variation = buildOpeningVariationNote(recent, 'en');
      const display = getStudentDisplayName(student);
      const returning = mode === 'return_session' || isReturningStudent(student, 'alice');
      const profileNote = buildAiProfileNote(student, 'alice');
      const companion = effectiveSessionType === 'companion';
      const topicHint = companion ? Companion.resolveSessionTopic(history, companionTopic, message) : '';
      const greetInstruction = companion
        ? (returning
          ? `Welcome back ${display} like a friend (2-3 sentences). Show you're happy to talk. Ask what they feel like chatting about — anything: life, fashion, stories, work, whatever.`
          : `First companion session: greet ${display} warmly like a personal practice assistant ready to chat — friendly, ready to talk about ANYTHING. Ask what they want to talk about today (stories, fashion, daily life, work, food — no limits).`)
        : (returning
          ? `Welcome back ${display} briefly (max 2 sentences). Continue practice with ONE engaging question — NOT a first-meeting intro.`
          : `First session: greet warmly using ONLY the name "${display}" from the student record. ONE engaging practice question. Do NOT ask how they prefer to be called. Never say Johnny, Planning, or any name not in the student record.`);

      const openExtra = brainScopeExtra(student, req, `${mode}:${companion ? 'companion' : 'practice'}:${student?.level || 'Functional'}:${returning ? 'return' : 'new'}:${ALICE_BRAIN_VER}:${Companion.COMPANION_BRAIN_VER}`);
      const openBrain = await Brain.brainGetLLM('alice', 'opening', `START_${mode}`, openExtra);
      if (openBrain.hit) {
        return res.json({
          opening: plainBrainReply(openBrain.reply),
          sessionMode: returning ? 'return_session' : 'start_session',
          sessionType: effectiveSessionType,
          companionEnabled: Companion.isCompanionEnabled(student),
          brainCache: true
        });
      }

      const companionBlock = companion ? '\n\n' + Companion.buildCompanionCoachBlock(student, companionCfg, topicHint) : '';
      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001', max_tokens: companion ? 400 : 250,
        messages: [{ role: 'user', content: companion
          ? `You are Alice Companion (always ALICE). You are an always-on English voice companion — a personal practice assistant. You talk, listen, tell stories, show interest, and chat about anything. ${greetInstruction}\n\nStudent: ${student?.level||'Functional'}.${profileNote}${variation}${companionBlock}\n\n${Companion.ALICE_LANGUAGE_RULE}\nNever cut off mid-sentence.`
          : `You are Alice (your name is ALICE, not Alaiz, not Alicia — always ALICE). You are a warm and encouraging English tutor using the Nexus Method. ${greetInstruction} You are a tutor only — never roleplay as a customer, interviewer, or Nexora simulator.\n\nStudent level: ${student?.level||'Functional'}. Their exercises:\n${tb||'(none yet)'}${profileNote}${variation}\n\n${Companion.ALICE_LANGUAGE_RULE}` }]
      });
      const opening = resp.content.filter(b=>b.type==='text').map(b=>b.text).join('');
      if (openBrain.hash && opening) await Brain.brainSetLLM(openBrain.hash, 'alice', 'opening', `START_${mode}`, opening, openExtra);
      recordOpening(actorKey, 'alice', extractOpeningSnippet(opening)).catch(() => {});
      return res.json({
        opening,
        sessionMode: returning ? 'return_session' : 'start_session',
        sessionType: effectiveSessionType,
        companionEnabled: Companion.isCompanionEnabled(student)
      });
    }

    // EVALUATE
    if (mode === 'evaluate') {
      const companion = effectiveSessionType === 'companion';
      const hist = (history || []).filter(m => m.content?.trim())
        .map(m => `${m.role === 'user' ? 'Student' : 'Alice'}: ${String(m.content).replace(/\n+/g, ' ').trim()}`)
        .join('\n');

      const metrics = buildAliceSessionMetrics(history);
      const topic = Companion.resolveSessionTopic(history, companionTopic, message);
      const connectors_used = metrics.connectors;
      const connectors_missed = aliceEvalConnectorsMissed(connectors_used);

      if (companion) {
        const scored = Companion.scoreCompanionSession(metrics, student, companionCfg);
        const resp = await claudeCall({
          model: 'claude-haiku-4-5-20251001', max_tokens: 500,
          system: 'You are Alice companion evaluator. Respond ONLY with valid JSON. No markdown. No overall_score — score is precomputed.',
          messages: [{ role: 'user', content: Companion.buildCompanionEvalUserPrompt(student, hist, metrics, scored, topic, companionCfg) }]
        });
        const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
        try {
          const qual = JSON.parse(text.replace(/```json|```/g, '').trim());
          return res.json({ evaluation: Companion.enrichCompanionEvaluation(qual, scored, metrics, companionCfg) });
        } catch (e) {
          return res.json({ evaluation: Companion.enrichCompanionEvaluation({}, scored, metrics, companionCfg) });
        }
      }

      const overall_score = scoreAliceSessionFromMetrics(metrics);

      if (!hist || hist.length < 20) {
        return res.json({ evaluation: {
          overall_score: Math.max(54, overall_score),
          connectors_used,
          connectors_missed,
          best_moment: 'You started the session — that takes courage.',
          main_improvement: 'Practice a bit longer next time for a full evaluation.',
          alice_message: `Good start, ${student?.name || ''}! Every session counts.\nALICE: ¡Buen comienzo! Cada sesión te hace más fuerte.`
        }});
      }

      const statsNote = `Session stats: ${metrics.turns} student turns, ${metrics.wordCount} words, connectors used: ${connectors_used.join(', ') || 'none'}. Computed score: ${overall_score}/100 — your feedback must match this performance level.`;

      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001', max_tokens: 400,
        system: 'You are Alice, a warm English tutor. Respond ONLY with valid JSON. No markdown. No overall_score field — score is already computed from the transcript.',
        messages: [{ role: 'user', content: `Evaluate this English practice session for ${student?.name || 'the student'} (level: ${student?.level || 'Functional'}).\n\n${statsNote}\n\nSession:\n${hist}\n\nReturn ONLY this JSON (no overall_score):\n{"best_moment":"One specific warm thing they did well","main_improvement":"One concrete tip tied to what they actually said","alice_message":"2-3 warm encouraging sentences in English only"}` }]
      });

      const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      try {
        const qual = JSON.parse(text.replace(/```json|```/g, '').trim());
        return res.json({ evaluation: {
          overall_score,
          connectors_used,
          connectors_missed,
          best_moment: qual.best_moment || 'You showed up and practiced — that matters.',
          main_improvement: qual.main_improvement || 'Keep using Idea + Linker + Idea in every answer.',
          alice_message: qual.alice_message || `Great work, ${student?.name || ''}!\nALICE: ¡Muy bien! Seguí practicando.`
        }});
      } catch (e) {
        return res.json({ evaluation: {
          overall_score,
          connectors_used,
          connectors_missed,
          best_moment: 'Good effort today',
          main_improvement: 'Keep practicing connectors in full sentences',
          alice_message: `Great work, ${student?.name || ''}!\nALICE: ¡Muy bien! Seguí practicando.`
        }});
      }
    }

    // CHAT
    const companionEarly = effectiveSessionType === 'companion';
    if (companionEarly) {
      const cq = await checkCompanionQuestionLimit(student, sessionTable);
      if (!cq.ok) {
        return res.json({
          reply: cq.reply || `You've reached your Companion limit. Come back in ${cq.wait}.`,
          limitReached: true,
          wait: cq.wait,
          companionQuota: true
        });
      }
    } else {
      const limit = await checkLimit(student?.id, sessionTable);
      if (!limit.ok) return res.json({
        reply: `You've reached your practice limit for today. Rest and come back in ${limit.wait}!\nALICE: ¡Muy bien por practicar! Descansá ${limit.wait} y volvé con energía.`,
        limitReached: true
      });
    }

    const companion = companionEarly;
    const tb = (student?.trainingBook||[]).slice(0,5)
      .map(ex=>`- ${ex.title} (${ex.kpi||''}): ${ex.studentTask||''}`).join('\n');
    const topicHint = companion ? Companion.resolveSessionTopic(history, companionTopic, message) : '';
    const companionPhase = companion ? Companion.resolveCompanionPhase(message, history) : null;
    const companionFast = companion && (companionPhase === 'free_chat' || companionPhase === 'live_evaluate');
    if (mergeStudyPrefs(student, message) || student?.jillCalibration) {
      persistStudentLearningState(student).catch(() => {});
    }
    const adaptNote = buildStudyAdaptationNote(student, message);
    const teachInstr = companion
      ? (function () {
          try { return Companion.buildCompanionStreamTeachInstruction(topicHint, message, history); }
          catch (e) { return 'TURN: Help with any English doubt or free chat.'; }
        })()
      : '';
    const aliceLangTurn = companion
      ? `\n${teachInstr}`
      : (Companion.studentWantsSpanishExplanation(message)
        ? '\nTURN: Student asked for explanation — explain in Spanish (bilingual OK), then return to English.'
        : '\nTURN: English ONLY — no Spanish unless they ask to explain.');
    const methodBlock = companion
      ? (companionFast
        ? `COMPANION FAST CHAT — topic "${topicHint || 'open'}".
VOICE: cool natural English, expressive, human — never flat ESL.
STORY topics (horror/mystery/adventure/tales): tell it with atmosphere; finish the beat.
React, one follow-up. Mini-lesson only if they ask or structure breaks.`
        : `${ALICE_COMPANION_RULES}\n\n${Companion.buildCompanionCoachBlock(student, companionCfg, topicHint)}`)
      : `METHOD — NEXUS: Idea + Linker + Idea. Key connectors: however, on top of that, even though, therefore, besides, so far, in other words, rather than, figure out, as long as. Help students use these naturally — give examples, show them how.\n\n${ALICE_COACHING_RULES}`;

    const knowledgeSlice = companionFast
      ? ''
      : (companion
        ? await tutorKnowledgeSliceFast(message, student, 'alice', { timeoutMs: 800 })
        : await tutorKnowledgeSlice(message, student, 'alice'));

    const storyMood = /^(horror|mystery|adventure|stories|romance|entertainment)$/i.test(String(topicHint || ''));
    const companionFastTokens = storyMood ? 900 : 550;

    const systemPrompt = companionFast
      ? `You are Alice Companion — English voice companion. Name: ALICE.
PERSONALITY: Cool, warm, curious friend in their ear — expressive spoken English, not a robotic tutor.
${Companion.ALICE_COMPANION_INTENT_RULE}
${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}
${methodBlock}
Complete every sentence. NEVER cut off. If they want a story, tell it fully.
STUDENT: ${getStudentDisplayName(student)} | Level: ${student?.level||'Functional'}${buildAiProfileNote(student, 'alice')}${adaptNote}`
      : companion
      ? `You are Alice Companion — an always-on English voice companion (personal practice assistant). Your name is ALICE.
${INSTITUTIONAL_BRAIN_RULE}
${JohnDoctrine.mandateBlock('alice')}

ROLE: Talk, listen, interact, guide, educate, and show genuine interest. ANY topic.
Free chat OR on-demand English doubt as a FULL mini-lesson (name → pattern → bridge → examples → confirm → short oral practice → back to chat).

PERSONALITY: Warm, curious, human, never robotic. You sound like a friend in their ear 24/7.

${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}

${methodBlock}
${TUTOR_TEACH_COMPLETE_RULE}

RESPONSE STYLE:
- Match length to the moment; on DOUBT/TEACH turns complete formula + bridge + example — NEVER cut off
- Complete every sentence and every story
- Show real interest; react before you teach
- Unlimited flowing conversation — no turn caps

STUDENT: ${getStudentDisplayName(student)} | Level: ${student?.level||'Functional'}${buildAiProfileNote(student, 'alice')}${adaptNote}
${knowledgeSlice}`
      : `You are Alice, a warm, patient, and encouraging English tutor. You love helping people and you never rush.
${INSTITUTIONAL_BRAIN_RULE}

ROLE: You are a tutor and coach only. You NEVER roleplay as a customer, client, interviewer, manager, or Nexora character. Answer questions and explain concepts freely; for full simulations, point them warmly to Nexora Lab and keep coaching in the current practice.

PERSONALITY: Warm, human, celebratory, patient. You speak like a real person — not a textbook. You use natural expressions, tell short examples, and explain things clearly. Never robotic. Never cut yourself off mid-sentence.

PATIENCE: Students make mistakes. They speak slowly. They freeze. That is okay. You wait. You encourage. You never pressure. If they write a short answer, you gently push for more — but with kindness. You always complete your full thought before asking anything.

${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}

${methodBlock}
${JillMethodOS.METHOD_OS_CORE}${JillMethodOS.METHOD_OS_ALICE_NOTE}
${TUTOR_TEACH_COMPLETE_RULE}

RESPONSE STYLE: 
- On teach turns: finish formula + bridge + example + practice (not 2-sentence ESL)
- Complete every sentence — never get cut off
- React naturally to what the student said
- Give ONE specific example when explaining something
- Ask ONE follow-up question at the end
- One flowing spoken turn — prefer commas over heavy periods; no ellipses or dramatic pauses

STUDENT: ${getStudentDisplayName(student)} | Level: ${student?.level||'Functional'}${buildAiProfileNote(student, 'alice')}${adaptNote}
EXERCISES:\n${tb||'(none yet)'}${knowledgeSlice}`;

    const msgs = buildTutorChatMessages(history, message, companionFast ? 10 : 20);

    const levelExtra = brainScopeExtra(student, req, `${student?.level || 'Functional'}:${ALICE_BRAIN_VER}:${companion ? Companion.COMPANION_BRAIN_VER : 'practice'}${companionFast ? ':fast' : ''}`);
    const brain = await Brain.brainGetLLM('alice', 'chat', message, levelExtra);
    if (brain.hit) {
      res.set('X-Brain-LLM', 'HIT');
      return res.json({ reply: plainBrainReply(brain.reply), brainCache: true });
    }

    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: companionFast ? companionFastTokens : (companion ? 900 : 1000),
      system: systemPrompt, messages: msgs
    });
    const reply = resp.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    if (brain.hash && reply) await Brain.brainSetLLM(brain.hash, 'alice', 'chat', message, reply, levelExtra);
    res.set('X-Brain-LLM', 'MISS');
    return res.json({ reply });

  } catch(err) {
    console.error('Alice error:', err.message, err.status);
    return res.status(500).json({ error: 'Alice no está disponible ahora.', detail: err.message });
  }
});

// ── JILL — Tutora Foundations ────────────────────────────────

const ALICE_COACHING_RULES = `COACHING — JOHN STYLE + NEXUS INTERMEDIATE+ (Alice is NOT Jill):
- ABSOLUTE: John Ramírez teaching style ONLY (class doctrine + Nexus Intermediate+). Forbidden to teach as a generic ESL chatbot.
- If you invent an example, it MUST fit John's style: clear analogy, patience, normal classroom flow (not rushed express, not dragging).
- You are a warm coach, not a rigid script. Explain linkers, recovery, tone, STAR, grammar — always anchored to Nexus Method and Super Brain doctrine.
- Pattern every time: (1) answer clearly → (2) ONE concrete example with linkers/chunks for THIS practice → (3) invite them to try it now.
- When teaching Nexus (Idea+Linker+Idea, linkers, STAR, recovery): keep oral short; the portal shows an animated board — end with [[CTYPE:whiteboard]] on its own last line.
- NEVER scold. Celebrate curiosity; steer back gently.
- If they want full Nexora roleplay: point to Nexora Lab, keep coaching here.`;

const ALICE_COMPANION_RULES = `COMPANION + LIVE COACH — always-on English companion (JOHN STYLE REQUIRED):
- Talk, listen, guide, educate — ANY topic — but ALL teaching uses John/Nexus doctrine (Super Brain + canon). No improvising foreign methods.
- Opening: free chat OR a class/English doubt.
- ON-DEMAND MINI-LESSON: if they ask to explain/teach anything in English → FULL arc (name topic → pattern → bridge → 1–2 examples → confirm → short oral practice → back to chat). Not a one-liner tip. Not a forced curriculum.
- LIVE COACH: if doubt OR weak structure → PAUSE → feedback → mini-lesson → example → confirm → continue.
- Real-time evaluate every English turn. Never ignore broken structure.
- Never force Nexus drill sheets or Nexora roleplay.
- Complete every sentence. No turn quota.`;

/** Never stream or cache raw {"reply":...} to clients/TTS. */
function plainBrainReply(raw) {
  const parsed = parseJillResponse(raw);
  return parsed.reply || String(raw || '').trim();
}

/**
 * Portal often pushes the user turn into history AND sends `message`.
 * Appending again creates two consecutive `user` roles → Anthropic 400 → our 500.
 */
function buildTutorChatMessages(history, message, limit) {
  const lim = Math.max(4, Math.min(40, limit || 20));
  const msg = String(message || '').trim();
  const hist = (history || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim())
    .map((m) => ({ role: m.role, content: String(m.content).trim() }))
    .slice(-lim);
  if (!msg) {
    const out = hist.slice();
    while (out.length && out[0].role !== 'user') out.shift();
    return out.length ? out : [{ role: 'user', content: '(empty)' }];
  }
  let msgs;
  const last = hist[hist.length - 1];
  if (last && last.role === 'user') {
    msgs = hist.slice(0, -1).concat([{ role: 'user', content: msg }]);
  } else {
    msgs = hist.concat([{ role: 'user', content: msg }]);
  }
  const out = [];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1] = m;
    else out.push(m);
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out.length ? out : [{ role: 'user', content: msg }];
}
const JILL_FOUNDATIONS_SCOPE = `
ALCANCE JILL (Foundations) — NO ES ALICE:
- Jill enseña Mecánica Estructural Infinity®: ranuras P | M | V | C, matriz F0, método moneda, chunks de UNA oración estructurada.
- PROHIBIDO enseñar o exigir Idea + Linker + Idea, cadena de conectores Nexus (however, furthermore, on top of that, as a result, etc.) ni "mínimo 3 linkers por respuesta".
- Eso es territorio de ALICE (Intermediate+). Si el estudiante pregunta por linkers avanzados: "Eso lo profundizás con Alice — hoy trabajamos estructura MSI."
- En Foundations solo coordinación mínima cuando el bundle lo pide: and / but entre dos ideas (Col PC+). Nunca curriculum de linkers.
- Práctica típica Jill: UNA oración con fórmula del drill (P+V+C, To Be+ing, etc.) — no ensayos conectados con linkers Nexus.`;

const JILL_SYSTEM_PROMPT = `Sos Jill, la tutora de Foundations de Infinity Studio CR.
${TrainerModel.JOHNNY_TRAINER_RULE}
${JILL_FOUNDATIONS_SCOPE}
${JILL_INSTITUTIONAL_BRAIN_RULE}
Compartís la misma base que Alice, Alice Companion y Nexora (Super Brain); tu rol es Foundations y cómo lo explicás, no un subconjunto de datos.

IDENTIDAD:
Tu nombre es Jill. Sos paciente, clara y natural — nunca generás presión. Enseñás ÚNICAMENTE con el estilo John Ramírez (Método Nexus / MSI® + doctrina de sus clases). PROHIBIDO improvisar otro método; si inventás un ejemplo, debe ajustarse a su estilo (puente ES↔EN, analogía, fórmula, paciencia).
Corregís con afecto y claridad, sin sermones ni relleno.
CRÍTICO: Solo dirigite al estudiante cuyo nombre aparece en la línea ESTUDIANTE del contexto. Nunca uses el nombre de otra persona, trainer, o visitante.

ESTILO — FIDELIDAD JOHN (OBLIGATORIO):
- Directa al tema, con calma y flujo normal — ni express atropellado ni lento apelotado.
- Mini-analogías y ejemplos vivos SOLO anclados al Método Nexus / canon / Super Brain (transcripciones de clase).
- Cada respuesta mueve la lección: fórmula + puente/analogía + ejemplo + práctica. Típicamente 4-7 oraciones.
- El bundle/ejercicio activo guía el tema; el track canon/SVG sincroniza la explicación.
- Si hay INSTITUTIONAL KNOWLEDGE / doctrina de clase: OBEDECELO. Nunca contradigas a John.

GUION vs PREGUNTAS FOUNDATIONS (OBLIGATORIO):
- El bundle activo es tu guion de hoy — siempre retomalo después de responder.
- Si hay TRACK LOCK / CANON LOCK de un tema: SOLO ese tema. NO des mini-clase de otro Foundations "de paso".
- Si preguntan algo de Foundations distinto al lock (y lo pidieron EXPLÍCITO): cambias al nuevo pedido. Si NO lo pidieron, no lo abras.
- Si preguntan linkers avanzados, Idea+Linker+Idea, STAR, Nexora o customer service: redirigí a Alice en 1 frase — sin mini-clase de linkers.

RITMO HABLADO — 100% HUMANA TICA:
- Escribí como HABLA una tutora real de Costa Rica: mira, fijate, o sea, entonces, te lo pongo así, diay, vieras.
- Una sola respuesta fluida; preferí comas antes que muchos puntos seguidos.
- Sin elipsis (...) ni frases teatrales con pausas dramáticas.
- PROHIBIDO tono de manual o IA: "Paso 1", "Primero:", "Segundo:", "Es importante destacar", "A continuación".
- PROHIBIDO acento gringo en español: nada de ritmo/pronunciación/calco de inglés al hablar español. Sonás tica, no gringa leyendo español.
- Explicá en clase viva: tema → fórmula en palabras simples → puente/analogía → ejemplos con calma → "¿Te quedó?".
- NUNCA digas "no sé" / "no existe" ante una palabra o pieza de inglés (HAD, GET, HAVE, WILL…). EXPLICÁLA YA.

IDIOMA (ESTRICTO — YA ESTABLECIDO, SIN EXCUSAS):
El estudiante puede escribir o hablar en español, inglés o mezclado (Spanglish). Entendés los tres sin reproche — sacá la intención aunque venga desordenado.
Hablás SOLO en ESPAÑOL CORRECTO de Costa Rica / Centroamérica (voseo tico: vos, podés, querés, decime, armá) por defecto — saludo, charla, explicaciones, correcciones, teoría, análisis.
ESPAÑOL CORRECTO (IRROMPIBLE): ortografía bien; conjugación bien; concordancia sujeto-verbo y género/número. Frases claras.
PROHIBIDO ABSOLUTO acento gringo en español: no "español de gringo", no calco del inglés, no ritmo estadounidense al explicar en español, no deformar palabras.
PROHIBIDO ABSOLUTO portugués/portuñol: "mais" (decí "más"/"mas"), você, pra, então, não, também, hoje, amanhã — NUNCA.
PROHIBIDO: español de España (vosotros, vale muletilla, tío, ordenador, coche, ceceo), rioplatense/Argentina (che, boludo, laburo, mirá porteña), y portugués/Brasil (você, pra, então, não, mais).
REGLA IRROMPIBLE: español = acento latino/tico CR; inglés = acento americano. NADA MÁS. NUNCA digas "che".
Inglés ÚNICAMENTE cuando el estudiante pide explícitamente practicar/hablar en inglés, o cuando el ejercicio/chunk requiere que produzcan la oración en inglés (ejemplo modelo + práctica oral).
Cuando das un ejemplo en inglés, lo contextualizás en español primero — en una frase, no en un párrafo.
Nunca rechaces un mensaje por idioma, mezcla o transcripción imperfecta del micrófono.

SCOPE DE TURNO (IRROMPIBLE — CANDADO UNIVERSAL):
Pediste pasado simple → SOLO pasado simple. Presente → SOLO presente. Perfecto → SOLO perfecto. Gerundio → SOLO gerundio. WILL/WOULD → SOLO eso. Pronombres → SOLO pronombres.
PROHIBIDO "clase de todos los tiempos", F0, panorama MSI de PR/PS/PC/PRP, o "sistema completo" cuando no lo pidieron.
PROHIBIDO abrir otro tiempo "para contexto" o "después vemos". Una lección por pedido. Y ya.

FILOSOFÍA CENTRAL — Mecánica Estructural Infinity® (MSI):
No enseñás inglés genérico ni oraciones memorizadas — enseñás a armar el idioma por RANURAS: Pronombre | Modal/aux | Verbo | Complemento.
El estudiante ejecuta la fórmula del bundle activo (solo la pedida este turno) y la llena con una idea concreta en C.
Corregís por ranura equivocada, no por traducción palabra a palabra.

MÉTODO — CHUNKS ESTRUCTURALES (no linkers Nexus):
El cerebro procesa bloques con forma gramatical clara — una oración operativa por turno en drill, no párrafos conectados con however/furthermore (eso es Alice).

PRESIÓN CERO:
Práctica segura. Equivocarse no tiene costo emocional — pero seguís avanzando en la lección, sin rodeos.

ENTRADA POR VOZ (PTT) — OBLIGATORIO:
El mensaje del estudiante puede venir del micrófono con errores de transcripción: palabras mezcladas, typos, frases rotas o palabras inventadas. Eso NO es "ruido" ni desinterés — es normal en voz, sobre todo en español, inglés o Spanglish.
- NUNCA digas "ruido", "palabras al aire", "tirando palabras" ni regañes por cómo llegó el texto.
- Buscá intento en cualquier idioma (aunque sea una palabra) o el tema de la pregunta activa; construí sobre eso con calma.
- Si no entendés del todo: UNA aclaración amable ("¿Quisiste decir I watched TV?" / "¿Ayer trabajaste o descansaste?") + un ejemplo mínimo para repetir.
- Si mezcló español e inglés: normal en CR — tomá ambos fragmentos y ayudá a armar el chunk en inglés, sin sermón.

LOS KPIs QUE EVALUÁS EN FOUNDATIONS (no los de Alice):
1. Implementación de estructura (P|M|V|C) — ¿la oración respeta la fórmula del drill?
2. Tiempo verbal correcto — ¿PR/PS/PC/PRP/PPC/MOD según columna activa?
3. Generación de idea — ¿el complemento tiene una idea concreta?
4. Coordinación mínima — solo and/but cuando aplica Col PC+ (no curriculum linkers)
5. Tiempo de respuesta — meta <12s en drill estructurado
6. Pronunciación imitable — sonidos claros en la oración modelo
7. Recuperabilidad básica — ¿sigue intentando sin congelarse?
8. Vocab del drill — palabras de la lista activa, no traducción libre

ROL EN ESTE SISTEMA:
Vos sos el Modo Jill. Mientras vos estás activa, el sistema está en modo aprendizaje.
NO simulás escenarios de trabajo, entrevistas, clientes ni llamadas.
NO evaluás para certificación ni ORT.
SÍ enseñás el método con espontaneidad natural: explicás, demostrás, guiás y practicás — guiada por bundle/ejercicio activo.
Si el estudiante pregunta por simulaciones: le decís que eso es Alice Mode.

CONTENIDO ADAPTABLE:
Cuando querés mostrar algo visual o estructurado, usás el campo contentType en tu respuesta para señalarlo.
- "text" — respuesta conversacional normal
- "exercise" — ejercicio estructurado que el estudiante debe hacer
- "example" — demostración de una técnica con ejemplo concreto
- "whiteboard" — explicación estructurada como si fuera un pizarrón (listas, pasos, tabla)

RESPUESTA:
Respondé siempre en JSON válido con este formato:
{"reply":"tu respuesta aquí","contentType":"text|exercise|example|whiteboard"}
No uses markdown. No uses texto fuera del JSON.` + JILL_STRUCTURE_NOTATION + JILL_COIN_METHOD_RULE + JillMethodOS.METHOD_OS_CORE + (JillMethodOS.METHOD_OS_STUDENT_ORDERS || '') + (JillPro.STUDENT_ORDERS_RULE ? '\n' + JillPro.STUDENT_ORDERS_RULE : '');

// Extracts {reply, contentType} from Claude response regardless of markdown wrapping
function parseJillResponse(raw) {
  try {
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(clean);
    if (parsed.reply) {
      parsed.reply = scrubNonCrSpanish(parsed.reply);
      return parsed;
    }
  } catch {}
  // Try to find JSON object anywhere in the string
  const match = raw.match(/\{[\s\S]*?"reply"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed.reply) parsed.reply = scrubNonCrSpanish(parsed.reply);
      return parsed;
    } catch {}
  }
  // Fallback: use raw text as reply
  return { reply: scrubNonCrSpanish(raw.replace(/```[\s\S]*?```/g, '').trim()), contentType: 'text' };
}

app.post('/jill', requireProductAuth, async (req, res) => {
  try {
    let { student, history, message, mode, weakKpis, jillBundle, nemesisState, track, reinforcement, matrixContext, vocabContext, calibrationContext, sessionType, companionTopic, canonTrackId } = req.body || {};
    const requestedSessionType = sessionType === 'companion' ? 'companion' : 'tutor';
    student = await assertStudentTutorAccess(req, res, 'jill', student, { sessionType: requestedSessionType });
    if (!student) return;
    const jillProCtx = JillPro.resolveJillProSession(student, requestedSessionType);
    const effectiveSessionType = jillProCtx.sessionType;
    const isJillCompanion = effectiveSessionType === 'companion';
    sanitizeStudentAiProfile(student);
    const topicHint = isJillCompanion
      ? JillPro.resolveSessionTopic(history, companionTopic, message)
      : '';
    const companionBlock = isJillCompanion
      ? '\n\n' + JillPro.buildJillProCoachBlock(student, topicHint)
      : '';

    const name = student?.name || student?.info?.name || 'estudiante';
    const level = student?.level || student?.info?.level || 'Foundations';
    const exercises = (student?.trainingBook || []).slice(0, 4)
      .map(ex => `- ${ex.title}: ${ex.studentTask || ''}`).join('\n');
    const weakNote = (weakKpis && weakKpis.length)
      ? `\nÁREAS DÉBILES EN QUIZ (reforzar hoy): ${weakKpis.join(', ')}.`
      : '';
    const bundleNote = formatJillBundleNote(jillBundle);
    const matrixExtras = jillMatrixPromptExtras(jillBundle, matrixContext, student);
    const vocabNote = formatJillVocabNote(vocabContext);
    const responseKpiNote = formatJillResponseKpiNote(matrixContext);
    const nemesisNote = JillDrillBrain.getStudentDrillNote(student)
      || (nemesisState?.reinforcement?.length
        ? `\nRAPID DRILL REFUERZO (prioridad): ${nemesisState.reinforcement.join(', ')}.`
        : (reinforcement?.length ? `\nRAPID DRILL REFUERZO: ${reinforcement.join(', ')}.` : ''));
    const trackNote = track?.current
      ? `\nTRACK ACTIVO: ${track.current}. Graduados: jill=${!!track.graduated?.jill}, alice=${!!track.graduated?.alice}, nexora=${!!track.graduated?.nexora}.`
      : '';
    const calibrationNote = JillCalibration.formatCalibrationNote(calibrationContext, student);

    if (mode === 'calibration_start') {
      const display = getStudentDisplayName(student);
      const profileNote = buildAiProfileNote(student, 'jill');
      const probe = calibrationContext?.currentProbe;
      const probeLine = probe
        ? `Empezá la calibración: explicá en 2 frases que vas a medir verbos, conectores, artículos, preposiciones y MSI® sin presión. Luego lanzá EXACTAMENTE esta primera prueba: "${probe.ask}"`
        : 'Empezá la calibración diagnóstica antes del bundle.';
      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: JILL_SYSTEM_PROMPT + calibrationNote,
        messages: [{
          role: 'user',
          content: `El estudiante ${display} abre su primera sesión Foundations. ${probeLine}${profileNote}${bundleNote}${trackNote}\n\nRESPONDE ÚNICAMENTE JSON: {"reply":"...","contentType":"text"}`
        }]
      });
      const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const parsed = parseJillResponse(raw);
      return res.json(Object.assign({}, parsed, { sessionMode: 'calibration_start' }));
    }

    if (mode === 'start_session' || mode === 'return_session') {
      const actorKey = resolveActorKey({ student, req });
      const recent = await getRecentOpenings(actorKey, 'jill');
      const variation = buildOpeningVariationNote(recent, 'es');
      const display = getStudentDisplayName(student);
      const returning = mode === 'return_session' || isReturningStudent(student, 'jill');
      const profileNote = buildAiProfileNote(student, 'jill');
      const greetInstruction = isJillCompanion
        ? JillPro.buildJillProOpeningInstruction(display, returning, topicHint)
        : (returning
          ? `Saludo breve a ${display} y retomá el bundle/ejercicio activo — natural, sin preámbulos largos.`
          : `Bienvenida corta usando SOLO el nombre "${display}" del registro. Decile qué chunk/tema de hoy y UNA pregunta de práctica. Nunca digas Johnny, Planning, ni otro nombre.`);

      const openExtra = brainScopeExtra(student, req, `${mode}:${isJillCompanion ? 'companion' : 'tutor'}:${level}:${returning ? 'return' : 'new'}:${JILL_BRAIN_VER}:${JillPro.JILL_PRO_BRAIN_VER}`);
      const openBrain = await Brain.brainGetLLM('jill', 'opening', `START_${mode}_${effectiveSessionType}`, openExtra);
      if (openBrain.hit && !calibrationNote.trim() && !jillReplyHasAliceLinkers(openBrain.reply)) {
        try {
          const parsed = parseJillResponse(openBrain.reply);
          return res.json(Object.assign({}, parsed, { sessionMode: returning ? 'return_session' : 'start_session', sessionType: effectiveSessionType, brainCache: true }));
        } catch (e) {
          return res.json({ reply: openBrain.reply, contentType: 'text', sessionMode: returning ? 'return_session' : 'start_session', sessionType: effectiveSessionType, brainCache: true });
        }
      }

      const bundleCtx = isJillCompanion ? '' : `${weakNote}${bundleNote}${matrixExtras.matrixNote}${matrixExtras.matrixRule}${matrixExtras.conversationNote || ''}`;
      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: isJillCompanion ? 400 : 350,
        system: JILL_SYSTEM_PROMPT + calibrationNote + companionBlock + JohnDoctrine.mandateBlock('jill'),
        messages: [{
          role: 'user',
          content: `El estudiante ${display} (nivel: ${level}) abre su sesión${isJillCompanion ? ' Jill Pro Companion' : ''}. ${greetInstruction}${profileNote}${bundleCtx}${vocabNote}${responseKpiNote}${nemesisNote}${trackNote}${variation}\nEjercicios asignados:\n${exercises || '(ninguno aún)'}\n\nRESPONDE ÚNICAMENTE con este JSON exacto, sin nada más antes ni después:\n{"reply":"tu saludo aquí","contentType":"text"}`
        }]
      });
      const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const parsed = parseJillResponse(raw);
      if (openBrain.hash && raw) await Brain.brainSetLLM(openBrain.hash, 'jill', 'opening', `START_${mode}_${effectiveSessionType}`, raw, openExtra);
      recordOpening(actorKey, 'jill', extractOpeningSnippet(parsed.reply)).catch(() => {});
      return res.json(Object.assign({}, parsed, { sessionMode: returning ? 'return_session' : 'start_session', sessionType: effectiveSessionType }));
    }

    if (mode === 'evaluate') {
      const hist = (history || []).filter(m => m.content?.trim())
        .map(m => `${m.role === 'user' ? 'Estudiante' : 'Jill'}: ${String(m.content).replace(/\n+/g, ' ').trim()}`)
        .join('\n');
      const metrics = buildAliceSessionMetrics(history);
      const userTurns = metrics.turns;
      let overall_score = scoreAliceSessionFromMetrics(metrics);
      if (userTurns < 2) overall_score = Math.max(48, overall_score - 12);

      if (isJillCompanion) {
        const topic = JillPro.resolveSessionTopic(history, companionTopic, message);
        if (!hist || hist.length < 12) {
          return res.json({
            evaluation: {
              overall_score: Math.max(55, overall_score),
              best_moment: 'Practicaste en voz alta con Jill Pro — eso suma.',
              main_improvement: 'La próxima vez, pedí un tema concreto (gerundio, tiempos, vocab) y sostené 5 turnos.',
              jill_message: `Buen inicio, ${getStudentDisplayName(student)}. Seguí charlando — cada tema que practiques te acerca a Alice.`,
              sessionType: 'companion',
              companion_topic: topic
            }
          });
        }
        const resp = await claudeCall({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 450,
          system: 'Evaluadora Jill Pro Foundations. JSON válido únicamente.',
          messages: [{ role: 'user', content: JillPro.buildJillProEvalPrompt(student, hist, metrics, topic) }]
        });
        const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
        try {
          const qual = JSON.parse(text.replace(/```json|```/g, '').trim());
          const score = qual.companion_score != null ? parseInt(qual.companion_score, 10) : overall_score;
          return res.json({
            evaluation: {
              overall_score: Math.min(100, Math.max(50, score || overall_score)),
              best_moment: qual.best_moment || 'Buena actitud en la charla.',
              main_improvement: qual.main_improvement || 'Seguí pidiendo mini-lecciones sobre tus dudas.',
              jill_message: qual.jill_message || `Seguí así, ${getStudentDisplayName(student)}.`,
              sessionType: 'companion',
              companion_topic: topic
            }
          });
        } catch (e) {
          return res.json({
            evaluation: {
              overall_score,
              best_moment: 'Practicaste conversación Foundations.',
              main_improvement: 'Pedí un tema específico la próxima vez.',
              jill_message: `Gracias por practicar, ${getStudentDisplayName(student)}.`,
              sessionType: 'companion',
              companion_topic: topic
            }
          });
        }
      }

      const bundleTitle = jillBundle?.title || 'Foundations';
      const bundleKpis = (jillBundle?.kpis || []).join(', ') || 'estructura MSI, chunks, tiempos verbales';
      const convPhase = matrixContext?.conversationPhase || jillStructurePrerequisitesMet(student, matrixContext);
      const structPrereq = jillStructurePrerequisitesMet(student, matrixContext);

      if (!hist || hist.length < 16) {
        return res.json(await finalizeJillEvaluation(student, {
          overall_score: Math.max(50, overall_score),
          student_turns: userTurns,
          bundle_ready: false,
          graduation_request: false,
          best_moment: 'Abriste la sesión y practicaste con Jill.',
          main_improvement: convPhase
            ? 'La próxima vez, sostené al menos 5 turnos en inglés en conversación con Jill.'
            : 'La próxima vez, completá al menos 3 respuestas en inglés sobre el bundle.',
          jill_message: `Buen inicio, ${getStudentDisplayName(student)}. Seguí con ${convPhase ? 'conversación guiada' : 'el bundle "' + bundleTitle + '"'} mañana.`,
          conversation_phase: convPhase
        }, hist));
      }

      const statsNote = `Bundle: ${bundleTitle}. KPIs del bundle: ${bundleKpis}. Turnos estudiante: ${userTurns}. Palabras: ${metrics.wordCount}. Conectores: ${metrics.connectors.join(', ') || 'ninguno'}. Score calculado: ${overall_score}/100. Fase conversación: ${convPhase ? 'SÍ' : 'NO'}. Prerequisitos estructura: ${structPrereq ? 'cumplidos' : 'pendientes'}.`;

      const evalSystem = convPhase
        ? `Sos Jill evaluadora Foundations en FASE CONVERSACIÓN. El estudiante ya dominó estructura/teoría. Evaluá si DEMOSTRÓ en el transcript: conjugación correcta de tiempos y pronombres, preguntas con inversión (método moneda), combinación natural de estructuras (MSI+prep+there), conversar sin errores graves, coordinación, lógica, poco esfuerzo evidente, fluidez sostenida. Compará contra Mecánica Estructural Infinity (P|M|V|C). NUNCA gradués automáticamente — solo podés SOLICITAR graduación (graduation_request:true) si la evidencia es clara y consistente en TODA la sesión. Si hay duda, graduation_request:false y seguí puliendo. Respondé SOLO JSON válido. Sin markdown. Sin overall_score.`
        : 'Sos Jill evaluadora Foundations. Respondé SOLO JSON válido. Sin markdown. Sin overall_score — ya está calculado.';

      const evalJsonSchema = convPhase
        ? `{"best_moment":"logro específico en español","main_improvement":"un tip concreto del método Nexus","jill_message":"2-3 frases cálidas en español + feedback conversacional","bundle_ready":true o false,"graduation_request":true solo si KPIs conversacionales Johnny satisfechos en evidencia,"graduation_reason":"por qué solicitás o no graduación a Alice","conversation_kpis":{"tense_accuracy":"ok|weak|fail","question_inversion":"ok|weak|fail","combination":"ok|weak|fail","coordination":"ok|weak|fail","logic":"ok|weak|fail","effort":"ok|weak|fail","fluency":"ok|weak|fail"}}`
        : `{"best_moment":"logro específico en español","main_improvement":"un tip concreto del método Nexus/bundle","jill_message":"2-3 frases cálidas en español + una frase modelo en inglés del chunk de hoy","bundle_ready":true o false si dominó el bundle según evidencia,"graduation_request":false}`;

      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 550,
        system: evalSystem,
        messages: [{ role: 'user', content: `Evaluá esta sesión Foundations de ${getStudentDisplayName(student)}.\n\n${statsNote}\n\nTranscript:\n${hist}\n\nJSON exacto:\n${evalJsonSchema}` }]
      });

      const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      try {
        const qual = JSON.parse(text.replace(/```json|```/g, '').trim());
        const gradRequest = convPhase && structPrereq && !!qual.graduation_request
          && overall_score >= 78 && userTurns >= 5;
        const advanceGate = jillBundleAdvanceAllowed(student, jillBundle);
        const bundleReadyRaw = !!qual.bundle_ready && overall_score >= 72 && userTurns >= 4;
        const bundleReady = bundleReadyRaw && advanceGate.ok;
        return res.json(await finalizeJillEvaluation(student, {
          overall_score,
          student_turns: userTurns,
          connectors_used: metrics.connectors,
          bundle_id: jillBundle?.id || null,
          conversation_phase: convPhase,
          best_moment: qual.best_moment || 'Practicaste con constancia.',
          main_improvement: qual.main_improvement || 'Seguí con chunks del bundle activo.',
          jill_message: qual.jill_message || `Muy bien, ${getStudentDisplayName(student)}.`,
          bundle_ready: bundleReady,
          bundle_blocked: bundleReadyRaw && !advanceGate.ok,
          bundle_block_reason: advanceGate.reason || null,
          graduation_request: gradRequest,
          graduation_reason: gradRequest ? (qual.graduation_reason || '') : (qual.graduation_reason || qual.main_improvement || ''),
          conversation_kpis: qual.conversation_kpis || null
        }, hist));
      } catch (e) {
        const advanceGate = jillBundleAdvanceAllowed(student, jillBundle);
        const bundleReadyRaw = overall_score >= 75 && userTurns >= 5;
        return res.json(await finalizeJillEvaluation(student, {
          overall_score,
          student_turns: userTurns,
          bundle_ready: bundleReadyRaw && advanceGate.ok,
          bundle_blocked: bundleReadyRaw && !advanceGate.ok,
          bundle_block_reason: advanceGate.reason || null,
          graduation_request: false,
          best_moment: 'Buen esfuerzo en la sesión.',
          main_improvement: 'Repetí el chunk del bundle en voz alta 3 veces.',
          jill_message: `Seguí así, ${getStudentDisplayName(student)} — el método Nexus es práctica, no teoría.`,
          conversation_phase: convPhase
        }, hist));
      }
    }

    if (!message) return res.status(400).json({ error: 'Missing message' });

    const limit = await checkTutorLimit(student?.id, 'jill', 'infinity_sessions');
    if (!limit.ok) {
      return res.json({
        reply: `Alcanzaste el límite de práctica con Jill por hoy. Descansá ${limit.wait} y volvé con energía.`,
        contentType: 'text',
        limitReached: true
      });
    }

    const levelExtra = brainScopeExtra(student, req, `${level}:${JILL_BRAIN_VER}${isJillCompanion ? ':' + JillPro.JILL_PRO_BRAIN_VER : ''}`);
    const brain = await Brain.brainGetLLM('jill', 'chat', message, levelExtra);
    if (!isJillCompanion && brain.hit) {
      const cachedPlain = plainBrainReply(brain.reply);
      if (cachedPlain.length > 12 && !jillReplyHasAliceLinkers(cachedPlain)) {
        res.set('X-Brain-LLM', 'HIT');
        try {
          const parsed = parseJillResponse(brain.reply);
          const plain = parsed.reply || cachedPlain;
          return res.json({ ...parsed, reply: plain, brainCache: true });
        } catch (e) {
          return res.json({ reply: cachedPlain, contentType: 'text', brainCache: true });
        }
      }
    }

    const msgs = buildTutorChatMessages(history, message, 12);
    if (mergeStudyPrefs(student, message) || student?.jillCalibration) {
      persistStudentLearningState(student).catch(() => {});
    }
    const adaptNote = buildStudyAdaptationNote(student, message);
    const bundleCtxChat = isJillCompanion
      ? `${weakNote}${nemesisNote}${trackNote}`
      : `${weakNote}${bundleNote}${matrixExtras.matrixNote}${matrixExtras.matrixRule}${matrixExtras.conversationNote || ''}${vocabNote}${responseKpiNote}${nemesisNote}${trackNote}`;
    const teachInstrChat = isJillCompanion
      ? (function () {
          try { return JillPro.buildJillProStreamTeachInstruction(topicHint, message, history, canonTrackId || null); }
          catch (e) { return 'TURNO COMPANION — ayudá con cualquier duda de inglés o charlá. [[CTYPE:text]]'; }
        })()
      : (JillPro.studentWantsEnglishPractice(message)
        ? 'MODO PRÁCTICA EN INGLÉS — el estudiante pidió practicar en inglés este turno.'
        : '');
    const lockedTrackIdChat = (JillCanonRouter.resolveAskId ? JillCanonRouter.resolveAskId(message, companionTopic || topicHint || '') : null)
      || canonTrackId
      || null;
    const lockedTrackChat = lockedTrackIdChat && JillCanonRouter.trackById
      ? JillCanonRouter.trackById(lockedTrackIdChat)
      : null;
    const hardLockChat = lockedTrackChat
      ? ('\n\n' + JillCanonRouter.formatLock(lockedTrackChat)
        + '\n' + (JillPro.formatBoardSync ? JillPro.formatBoardSync(lockedTrackChat) : '')
        + '\n' + (JillPro.FULL_TEACH_ALL || '')
        + '\n' + (JillPro.STUDENT_ORDERS_RULE || ''))
      : '';
    const displayChat = getStudentDisplayName(student);
    const profileNoteChat = buildAiProfileNote(student, 'jill');
    const doctrineChat = await tutorKnowledgeSliceForJill(message, student, { canonTrackId: lockedTrackIdChat });
    const teachCompleteChat = (lockedTrackChat || isJillCompanion || /doubt_explain|MODO DUDA|TRACK LOCK/i.test(teachInstrChat))
      ? TUTOR_TEACH_COMPLETE_RULE
      : '';
    const systemWithContext = isJillCompanion
      ? `${JillPro.buildJillProCompanionSystem(displayChat, level, profileNoteChat, adaptNote, topicHint, calibrationNote)}${doctrineChat}${hardLockChat}${teachCompleteChat}\n\n${teachInstrChat}\n\nRESPONDE ÚNICAMENTE con JSON: {"reply":"...","contentType":"text|whiteboard"} — whiteboard en mini-lección. NEVER cut off. HABLA el GUION ORAL de clase (no leas el tablero). Completá guion + ¿Te quedó?.`
      : JILL_SYSTEM_PROMPT + calibrationNote + companionBlock + `\n\nESTUDIANTE: ${displayChat} | Nivel: ${level}${profileNoteChat}${adaptNote}\nEJERCICIOS ASIGNADOS:\n${exercises || '(ninguno aún)'}${bundleCtxChat}${doctrineChat}${hardLockChat}${teachCompleteChat}${teachInstrChat ? '\n\n' + teachInstrChat : ''}\n\nRESPONDE ÚNICAMENTE con JSON: {"reply":"...","contentType":"text|exercise|example|whiteboard"} — sin texto fuera del JSON. NEVER cut off mid-sentence.`;

    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: (isJillCompanion || lockedTrackChat) ? 2000 : 1400,
      system: systemWithContext,
      messages: msgs
    });

    const raw = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const parsed = parseJillResponse(raw);
    if (brain.hash && parsed?.reply) await Brain.brainSetLLM(brain.hash, 'jill', 'chat', message, raw, levelExtra);
    res.set('X-Brain-LLM', 'MISS');
    return res.json(parsed);

  } catch (err) {
    console.error('Jill error:', err.message, err.status);
    return res.status(500).json({ error: 'Jill no está disponible ahora.', detail: err.message });
  }
});

// ── STREAMING HELPER ─────────────────────────────────────────
async function streamAnthropicSSE(res, { model, max_tokens, system, messages, brainMeta }) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'X-Brain-LLM': brainMeta ? 'MISS' : 'OFF'
  });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({ model: model || 'claude-haiku-4-5-20251001', max_tokens: max_tokens || 400, stream: true, system, messages })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const errMsg = err?.error?.message || 'API error';
    if (brainMeta && system && messages) {
      try {
        const resp = await claudeCall({ model: model || 'claude-haiku-4-5-20251001', max_tokens: max_tokens || 400, system, messages });
        const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
        if (text.length > 8) {
          res.write(`data: ${JSON.stringify({ t: text })}\n\n`);
          res.write('data: [DONE]\n\n');
          if (brainMeta.hash && text.length > 40) {
            Brain.brainSetLLM(brainMeta.hash, brainMeta.tutor, brainMeta.intent, brainMeta.message, text, brainMeta.extra).catch(() => {});
          }
          return res.end();
        }
      } catch (fallbackErr) {
        console.error('Stream fallback error:', fallbackErr.message);
      }
    }
    res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
    return res.end();
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
          fullText += evt.delta.text;
          res.write(`data: ${JSON.stringify({ t: evt.delta.text })}\n\n`);
        } else if (evt.type === 'message_stop') {
          res.write('data: [DONE]\n\n');
        }
      } catch {}
    }
  }
  if (brainMeta?.hash && fullText.trim().length > 40 && /[a-zA-Záéíóúñ]{10,}/i.test(fullText)) {
    Brain.brainSetLLM(
      brainMeta.hash,
      brainMeta.tutor,
      brainMeta.intent,
      brainMeta.message,
      fullText.trim(),
      brainMeta.extra
    ).catch(() => {});
  }
  res.end();
}

// ── JILL STREAM ──────────────────────────────────────────────
app.post('/jill/stream', requireProductAuth, async (req, res) => {
  try {
    let { student, history, message, weakKpis, jillBundle, nemesisState, track, reinforcement, matrixContext, vocabContext, calibrationContext, sessionType, companionTopic, canonTrackId } = req.body || {};
    const requestedSessionType = sessionType === 'companion' ? 'companion' : 'tutor';
    student = await assertStudentTutorAccess(req, res, 'jill', student, { sessionType: requestedSessionType });
    if (!student) return;
    const jillProCtx = JillPro.resolveJillProSession(student, requestedSessionType);
    const effectiveSessionType = jillProCtx.sessionType;
    const isJillCompanion = effectiveSessionType === 'companion';
    sanitizeStudentAiProfile(student);
    if (!message) return res.status(400).end();
    const topicHint = isJillCompanion
      ? JillPro.resolveSessionTopic(history, companionTopic, message)
      : '';
    // Board/voz sync: portal track wins; else resolve from this message
    const lockedTrackId = (typeof JillCanonRouter !== 'undefined' && JillCanonRouter.resolveAskId
        ? JillCanonRouter.resolveAskId(message, companionTopic || topicHint || '')
        : null)
      || canonTrackId
      || null;
    const lockedTrack = lockedTrackId && JillCanonRouter.trackById
      ? JillCanonRouter.trackById(lockedTrackId)
      : null;
    const hardTrackLock = lockedTrack
      ? ('\n\n' + JillCanonRouter.formatLock(lockedTrack)
        + '\n' + (JillPro.formatBoardSync ? JillPro.formatBoardSync(lockedTrack) : '')
        + '\n' + (JillPro.FULL_TEACH_ALL || '')
        + '\n' + (JillPro.STUDENT_ORDERS_RULE || ''))
      : '';
    const companionBlock = isJillCompanion
      ? '\n\n' + JillPro.buildJillProCoachBlock(student, topicHint) + hardTrackLock
      : hardTrackLock;
    const limit = await checkTutorLimit(student?.id, 'jill', 'infinity_sessions');
    if (!limit.ok) {
      return res.status(429).json({ error: 'limit', message: `Jill practice limit reached. Wait ${limit.wait}.`, wait: limit.wait });
    }
    const name = student?.name || student?.info?.name || 'estudiante';
    const level = student?.level || student?.info?.level || 'Foundations';
    const exercises = (student?.trainingBook || []).slice(0, 4)
      .map(ex => `- ${ex.title}: ${ex.studentTask || ''}`).join('\n');
    const weakNote = weakKpis?.length ? `\nTemas a reforzar hoy: ${weakKpis.join(', ')}.` : '';
    const bundleNote = formatJillBundleNote(jillBundle);
    const matrixExtras = jillMatrixPromptExtras(jillBundle, matrixContext, student);
    const vocabNote = formatJillVocabNote(vocabContext);
    const responseKpiNote = formatJillResponseKpiNote(matrixContext);
    const nemesisNote = nemesisState?.reinforcement?.length
      ? `\nRAPID DRILL: ${nemesisState.reinforcement.join(', ')}.`
      : (reinforcement?.length ? `\nRAPID DRILL: ${reinforcement.join(', ')}.` : '');
    const trackNote = track?.current ? `\nTRACK: ${track.current}.` : '';
    const calibrationNote = JillCalibration.formatCalibrationNote(calibrationContext, student);
    const calibrating = !!calibrationContext?.active;
    const responseMs = req.body?.responseMs;
    const drillEval = (isJillCompanion || calibrating)
      ? { forcedReply: null, structureOk: null }
      : TrainerModel.evaluateStudentTurn(message, {
          student, tutor: 'jill', bundle: jillBundle, matrixContext, responseMs
        });
    if (drillEval && drillEval.forcedReply) {
      return Brain.writeBrainSSE(res, drillEval.forcedReply + '\n[[CTYPE:text]]');
    }
    // Jill DJ — escucha estructural en vivo (tiempos/prep/expresiones/vocab) + ritmo adaptativo.
    const isMetaTurn = TrainerModel.isJillCoachMetaRequest(message);
    let structureNote = '';
    if (!isJillCompanion && !calibrating && !isMetaTurn) {
      const structAnalysis = JillStructureCoach.analyzeTurn(message, { student, matrixContext });
      const turnOk = structAnalysis.findings.length
        ? false
        : (typeof drillEval.structureOk === 'boolean' ? drillEval.structureOk : null);
      const dj = JillStructureCoach.djMove(student?.id, turnOk);
      structureNote = JillStructureCoach.formatCoachNote(structAnalysis, dj);
      if (structAnalysis.findings.length) {
        JillDrillBrain.cascadeTurnFailures(student, structAnalysis.findings).catch(() => {});
      }
    }
    const trainerNote = (isJillCompanion || calibrating) ? '' : (TrainerModel.formatTrainerDrillNote(student, 'jill', jillBundle, matrixContext)
      + TrainerModel.formatTrainerEvalNote(drillEval) + structureNote);
    if (mergeStudyPrefs(student, message) || student?.jillCalibration) {
      persistStudentLearningState(student).catch(() => {});
    }
    const displayName = getStudentDisplayName(student);
    const profileNote = buildAiProfileNote(student, 'jill');
    const adaptNote = buildStudyAdaptationNote(student, message);
    const msgs = buildTutorChatMessages(history, message, 20);
    const levelExtra = brainScopeExtra(student, req, `${level}:${JILL_BRAIN_VER}${isJillCompanion ? ':' + JillPro.JILL_PRO_BRAIN_VER : ''}`);
    const brain = await Brain.brainGetLLM('jill', 'stream', message, levelExtra);
    const cachedPlain = brain.hit ? plainBrainReply(brain.reply) : '';
    if (!isJillCompanion && brain.hit && cachedPlain.length > 12 && !jillReplyHasAliceLinkers(cachedPlain)) {
      return Brain.writeBrainSSE(res, cachedPlain);
    }
    const convPhase = !isJillCompanion && (matrixContext?.conversationPhase || jillStructurePrerequisitesMet(student, matrixContext));
    const calTeach = JillCalibration.calibrationTeachInstruction(calibrationContext);
    const jillLangTurn = JillPro.studentWantsEnglishPractice(message)
      ? 'MODO PRÁCTICA EN INGLÉS — el estudiante pidió practicar en inglés este turno. '
      : '';
    const teachInstr = isJillCompanion
      ? (function () {
          try { return JillPro.buildJillProStreamTeachInstruction(topicHint, message, history, lockedTrackId); }
          catch (e) { return 'TURNO COMPANION — respondé en español, ayudá con cualquier duda de inglés, luego charla. [[CTYPE:text]]'; }
        })()
      : (jillLangTurn + (calTeach || (convPhase
        ? 'FASE CONVERSACIÓN: Jill escucha; el estudiante habla. UNA pregunta de seguimiento + corrección breve de ranura si aplica. NO drills de una sola oración.'
        : 'Enseñá SOLO el módulo del TRACK LOCK si hay uno; HABLA el GUION ORAL de clase (no leas el tablero). NUNCA cortes.')) + hardTrackLock
      + (lockedTrack
        ? ('\n' + (function () {
            try {
              const Mods = require('./jill-foundations-modules');
              const board = JillPro.formatBoardSync ? JillPro.formatBoardSync(lockedTrack) : '';
              return (Mods.moduleTeachBlock(lockedTrack.id) || '') + '\n' + board + '\n' + JillPro.FULL_TEACH_ALL;
            } catch (_) { return ''; }
          })())
        : ''));
    const bundleCtxStream = isJillCompanion
      ? `${weakNote}${nemesisNote}${trackNote}`
      : `${weakNote}${bundleNote}${matrixExtras.matrixNote}${matrixExtras.matrixRule}${matrixExtras.conversationNote || ''}${vocabNote}${responseKpiNote}${nemesisNote}${trackNote}`;
    const jillDoctrineSlice = await tutorKnowledgeSliceForJillFast(message, student, { canonTrackId: lockedTrackId });
    const teachLatency = (lockedTrack || isJillCompanion || /doubt_explain|MODO DUDA|TRACK LOCK|MINI-LECCIÓN|LECCIÓN COMPLETA/i.test(teachInstr))
      ? TUTOR_TEACH_COMPLETE_RULE
      : TUTOR_LATENCY_RULE;
    const jillCompanionSystem = isJillCompanion
      ? JillPro.buildJillProCompanionSystem(displayName, level, profileNote, adaptNote, topicHint, calibrationNote) + jillDoctrineSlice + TUTOR_TEACH_COMPLETE_RULE
      : JILL_SYSTEM_PROMPT + calibrationNote + companionBlock + `\n\nESTUDIANTE: ${displayName} | Nivel: ${level}${profileNote}${adaptNote}${trainerNote}\nEJERCICIOS:\n${exercises || '(ninguno)'}${bundleCtxStream}${jillDoctrineSlice}${teachLatency}`;
    await streamAnthropicSSE(res, {
      max_tokens: (isJillCompanion || lockedTrack) ? 2000 : 1400,
      system: isJillCompanion
        ? `${jillCompanionSystem}\n\n${teachInstr}\nAl final, línea nueva: [[CTYPE:whiteboard]] si es mini-lección/duda/tablero; [[CTYPE:text]] solo en charla libre. NEVER cut off. HABLA el GUION ORAL completo (estilo de clase) — el tablero se ve, no se lee.`
        : `${jillCompanionSystem}\n\nFASE: tutor\n\n${teachInstr}\nAl final de tu respuesta, en una línea nueva: ${lockedTrack ? '[[CTYPE:whiteboard]]' : '[[CTYPE:text]] o [[CTYPE:exercise]] o [[CTYPE:example]] o [[CTYPE:whiteboard]]'} según el turno. NEVER cut off mid-sentence. Si hay TRACK LOCK: lección COMPLETA del tablero.`,
      messages: msgs,
      brainMeta: { hash: brain.hash, tutor: 'jill', intent: 'stream', message, extra: levelExtra }
    });
  } catch (err) {
    console.error('Jill stream error:', err.message);
    try {
      if (!res.headersSent) {
        return Brain.writeBrainSSE(res, 'Perdón, tuve un corte técnico. Mandame de nuevo el mismo mensaje y te respondo al toque.\n[[CTYPE:text]]');
      }
    } catch (e2) { /* fall through */ }
    if (!res.headersSent) res.status(500).json({ error: 'Jill stream failed', detail: err.message });
    else res.end();
  }
});

async function tutorKnowledgeSlice(message, student, tutor, opts) {
  const who = tutor === 'jill' ? 'jill' : (tutor === 'nexora' ? 'nexora' : 'alice');
  const options = opts && typeof opts === 'object' ? opts : {};
  const learner = SharedLearner.buildSharedLearnerNote(student);
  const drillGlobal = await JillDrillBrain.getPropagatedDrillContext(600).catch(() => '');
  const drillStudent = student && who === 'jill' ? JillDrillBrain.getStudentDrillNote(student) : '';
  let trackVoice = '';
  let lockedId = options.canonTrackId || null;
  if (who === 'jill') {
    try {
      if (!lockedId) {
        const hit = JillCanonRouter.pickTrack(String(message || ''));
        if (hit) lockedId = hit.id;
      }
      if (lockedId) trackVoice = JohnDoctrine.trackVoiceBlock(lockedId) || '';
    } catch (_) { /* ignore */ }
  }
  if (!SuperBrain.isSuperBrainEnabled()) {
    const merged = [trackVoice, drillStudent, drillGlobal, learner].filter(Boolean).join('\n');
    return JohnDoctrine.wrapKnowledgeSlice(
      merged ? `LEARNER + DRILL BRAIN + GUION JOHN:\n${merged}` : '',
      who,
      lockedId
    );
  }
  try {
    const ctx = await SuperBrain.getPropagatedContext(String(message || '').slice(0, 400), 4500);
    let body = ctx.trim()
      ? `INSTITUTIONAL KNOWLEDGE (Nexus Super Brain — shared by Jill, Alice, Nexora):\nPROACTIVE RULE: Prefer published class doctrine language. Local john-voice-scripts win on Foundations tracks. Si hay TRACK LOCK: SOLO ese tema — no panorama F0.\n${ctx}`
      : '';
    if (who === 'jill' && body) body = filterJillSuperBrainContext(body, lockedId);
    const extras = [trackVoice, drillStudent, drillGlobal, learner].filter(Boolean).join('\n');
    if (extras) body = [body, extras].filter(Boolean).join('\n\n');
    return JohnDoctrine.wrapKnowledgeSlice(body, who, lockedId);
  } catch {
    return JohnDoctrine.wrapKnowledgeSlice([trackVoice, learner].filter(Boolean).join('\n') || '', who, lockedId);
  }
}

async function tutorKnowledgeSliceFast(message, student, tutor, opts) {
  const who = tutor === 'jill' ? 'jill' : (tutor === 'nexora' ? 'nexora' : 'alice');
  const options = opts && typeof opts === 'object' ? opts : {};
  let lockedId = options.canonTrackId || null;
  if (who === 'jill' && !lockedId) {
    try {
      const hit = JillCanonRouter.pickTrack(String(message || ''));
      if (hit) lockedId = hit.id;
    } catch (_) { /* ignore */ }
  }
  const learner = SharedLearner.buildSharedLearnerNote(student) || '';
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 2500;
  try {
    return await Promise.race([
      tutorKnowledgeSlice(message, student, who, { ...options, canonTrackId: lockedId }),
      new Promise((resolve) => setTimeout(
        () => resolve(JohnDoctrine.fastFallbackBlock(who, lockedId, learner)),
        timeoutMs
      ))
    ]);
  } catch {
    return JohnDoctrine.fastFallbackBlock(who, lockedId, learner);
  }
}

async function tutorKnowledgeSliceForJill(message, student, opts) {
  return tutorKnowledgeSlice(message, student, 'jill', opts);
}

async function tutorKnowledgeSliceForJillFast(message, student, opts) {
  return tutorKnowledgeSliceFast(message, student, 'jill', opts);
}

// ── ALICE STREAM ─────────────────────────────────────────────
app.post('/alice/stream', requireProductAuth, async (req, res) => {
  try {
    let { student, history, message, scenario, secret, sessionType, companionTopic } = req.body || {};
    student = await assertStudentTutorAccess(req, res, 'alice', student, {
      sessionType: sessionType || req.body?.sessionType || null,
      allowCompanionProduct: sessionType === 'companion'
    });
    if (!student) return;
    sanitizeStudentAiProfile(student);
    if (!message) return res.status(400).end();
    const companionCtx = Companion.resolveCompanionSession(student, sessionType);
    const effectiveSessionType = companionCtx.sessionType;
    const companionCfg = companionCtx.config;
    const companion = effectiveSessionType === 'companion';
    if (companion) {
      const cq = await checkCompanionQuestionLimit(student, 'infinity_sessions');
      if (!cq.ok) {
        return Brain.writeBrainSSE(res, cq.reply || `You've reached your Companion limit. Come back in ${cq.wait}.`);
      }
    }
    const tb = (student?.trainingBook || []).slice(0, 5)
      .map(ex => `- ${ex.title} (${ex.kpi || ''}): ${ex.studentTask || ''}`).join('\n');
    const sceneNote = scenario ? `\nActive scenario: ${scenario.title || ''} — ${scenario.desc || ''}` : '';
    if (mergeStudyPrefs(student, message) || student?.jillCalibration) {
      persistStudentLearningState(student).catch(() => {});
    }
    const displayName = getStudentDisplayName(student);
    const profileNote = buildAiProfileNote(student, 'alice');
    const adaptNote = buildStudyAdaptationNote(student, message);
    const topicHint = companion ? Companion.resolveSessionTopic(history, companionTopic, message) : '';
    const companionPhase = companion ? Companion.resolveCompanionPhase(message, history) : null;
    const companionFast = companion && (companionPhase === 'free_chat' || companionPhase === 'live_evaluate');
    let trainerNote = '';
    if (!companion) {
      const drillEval = TrainerModel.evaluateStudentTurn(message, {
        student, tutor: 'alice', bundle: null, responseMs: req.body?.responseMs
      });
      if (drillEval.forcedReply) {
        return Brain.writeBrainSSE(res, drillEval.forcedReply + '\n\nKeep expanding your idea.');
      }
      trainerNote = TrainerModel.formatTrainerDrillNote(student, 'alice', null)
        + TrainerModel.formatTrainerEvalNote(drillEval)
        + '\n' + TrainerModel.JOHNNY_TRAINER_RULE;
    }
    const aliceLangTurn = companion
      ? (function () {
          try { return '\n' + Companion.buildCompanionStreamTeachInstruction(topicHint, message, history); }
          catch (e) { return '\nTURN: Help with any English doubt or free chat. English by default.'; }
        })()
      : (Companion.studentWantsSpanishExplanation(message)
        ? '\nTURN: Student asked for explanation — explain in Spanish (bilingual OK), then return to English.'
        : '\nTURN: English ONLY — no Spanish unless they ask to explain.');
    const methodBlock = companion
      ? (companionFast
        ? `COMPANION FAST CHAT — topic "${topicHint || 'open'}".
VOICE: cool natural English, expressive, human — never flat ESL.
STORY topics (horror/mystery/adventure/tales): tell it with atmosphere; finish the beat.
React, one follow-up. Mini-lesson only if they ask or structure breaks.`
        : `${ALICE_COMPANION_RULES}\n\n${Companion.buildCompanionCoachBlock(student, companionCfg, topicHint)}`)
      : `METHOD — NEXUS: Idea + Linker + Idea. Connectors: however, on top of that, even though, therefore, besides, so far, in other words.\n${ALICE_COACHING_RULES}`;
    const knowledgeSlice = companionFast
      ? ''
      : await tutorKnowledgeSliceFast(message, student, 'alice', companion ? { timeoutMs: 800 } : undefined);
    const storyMood = /^(horror|mystery|adventure|stories|romance|entertainment)$/i.test(String(topicHint || ''));
    const companionFastTokens = storyMood ? 900 : 550;
    const system = companionFast
      ? `You are Alice Companion — English voice companion. Name: ALICE.
PERSONALITY: Cool, warm, curious friend in their ear — expressive spoken English, not a robotic tutor.
${Companion.ALICE_COMPANION_INTENT_RULE}
${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}
${methodBlock}
Complete every sentence. NEVER cut off. If they want a story, tell it fully.
STUDENT: ${displayName} | Level: ${student?.level || 'Functional'}${profileNote}${adaptNote}${sceneNote}`
      : companion
      ? `You are Alice Companion — always-on English voice companion (personal practice assistant). Name: ALICE.
${INSTITUTIONAL_BRAIN_RULE}
${JohnDoctrine.mandateBlock('alice')}
Talk, listen, interact, guide, educate, show genuine interest. ANY topic.
Free chat OR on-demand English doubt as a FULL mini-lesson (name → pattern → bridge → examples → confirm → short oral practice → back to chat).
${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}
${methodBlock}
${TUTOR_TEACH_COMPLETE_RULE}
Complete every sentence and story. NEVER cut off. On teach turns finish formula + bridge + example.
STUDENT: ${displayName} | Level: ${student?.level || 'Functional'}${profileNote}${adaptNote}
${sceneNote}${knowledgeSlice}`
      : `You are Alice, a warm, patient, and encouraging English tutor using the Nexus Method.
${INSTITUTIONAL_BRAIN_RULE}
ROLE: Tutor for Intermediate and Advanced students (ORT track) at Infinity Studio CR — not Alice Companion.
You share the same institutional KB as Jill and Companion (Super Brain); Jill covers Foundations, you cover higher levels — same data, different student level and delivery.
Tutor only — NEVER roleplay as customer/interviewer/Nexora character.
PERSONALITY: Warm, human, celebratory, patient. Speak like a real person.
${Companion.ALICE_LANGUAGE_RULE}
${aliceLangTurn}
${methodBlock}
${JillMethodOS.METHOD_OS_CORE}${JillMethodOS.METHOD_OS_ALICE_NOTE}
${TUTOR_TEACH_COMPLETE_RULE}
RESPONSE STYLE: Complete every sentence — NEVER cut off mid-thought, mid-explanation, or mid-word. On teach turns: formula + bridge + example + practice. Ask ONE follow-up question. Always finish the full reply.
STUDENT: ${displayName} | Level: ${student?.level || 'Functional'}${profileNote}${adaptNote}${trainerNote}
EXERCISES:\n${tb || '(none yet)'}${sceneNote}${knowledgeSlice}`;
    const msgs = buildTutorChatMessages(history, message, companionFast ? 10 : 20);
    const levelExtra = brainScopeExtra(student, req, `${student?.level || 'Functional'}:${ALICE_BRAIN_VER}:${companion ? Companion.COMPANION_BRAIN_VER : 'practice'}${companionFast ? ':fast' : ''}`);
    const brain = await Brain.brainGetLLM('alice', 'stream', message, levelExtra);
    if (brain.hit) return Brain.writeBrainSSE(res, plainBrainReply(brain.reply));
    await streamAnthropicSSE(res, {
      max_tokens: companionFast ? companionFastTokens : (companion ? 900 : 1000),
      system,
      messages: msgs,
      brainMeta: { hash: brain.hash, tutor: 'alice', intent: 'stream', message, extra: levelExtra }
    });
  } catch (err) {
    console.error('Alice stream error:', err.message);
    try {
      if (!res.headersSent) {
        return Brain.writeBrainSSE(res, "Sorry — I hit a glitch. Say that again and I'll help you right away.");
      }
    } catch (e2) { /* fall through */ }
    if (!res.headersSent) res.status(500).json({ error: 'Alice stream failed', detail: err.message });
    else res.end();
  }
});

// ── CLAIRE — Agente comercial ─────────────────────────────────
const CLAIRE_KB = `
QUIÉNES SOMOS:
Infinity Studio CR — No somos una academia de inglés. Somos un sistema de desarrollo de comunicación operacional en inglés.

MÉTODO NEXUS:
La estructura es: Idea + Linker + Idea. Los conectores (however, on top of that, even though, therefore, besides, so far, despite, so) son los que le dan velocidad, dirección y vida a una conversación. Sin conectores, la persona habla plano, cuadrado, sin fluir. Con conectores, la conversación se mueve, gira, camina, se redirige.

Lo más importante no es la gramática sola — es la estructura oral y la escogencia de palabras cuando forman chunks (bloques de frases predeterminadas). Si en español alguien no usa "además, pero, sin embargo, lo que pasa es que" — se traba igual en inglés.

DOS PERFILES DE CLIENTE:
1. EL BLOQUEADO: Entiende, lee y escribe inglés pero cuando habla se congela. Sobrecarga cognitiva — le vienen muchas palabras a la vez y el cerebro colapsa. Se queda en blanco. El miedo lo paraliza.

2. EL CUADRADO: Habla inglés pero suena académico, de libro. No usa conectores, no usa patrones, no usa expresiones base, no hilvanar bien la conversación, habla solo en presente, no usa phrasal verbs, no tiene estructura oral. Ha gastado años y dinero en academias y aún no puede responder una pregunta STAR.

LA DEMO DE CLAIRE:
Siempre hacer UNA pregunta en inglés sin avisar. Dejar que el cliente responda. Mostrarle exactamente qué faltó y por qué. Nunca atacar — siempre con calidez. El cliente debe decir "wow, nunca me habían explicado así".

PRECIOS (presentar solo con interés claro):
- Foundations: ₡75,000/mes (valor lista ₡96,000) — 12 h/mes trainer humano + Jill 24/7 + Portal + 5 KPIs. Oferta 2026: ₡67,500/mes sujeto a disponibilidad.
- ORT: ₡75,000/mes (valor lista ₡127,500) — 12 h/mes trainer + Alice 24/7 + Nexora incluida + KPIs bajo presión. Oferta 2026: ₡67,500/mes sujeto a disponibilidad.
- Nexora Professional: ₡75,000/30 días (valor lista ₡135,750) — acceso 24/7 full Nexora, simulaciones en su campo, evaluación instantánea. Oferta 2026: ₡67,500 sujeto a disponibilidad.
- Premium (opcional): ₡97,800/mes — sesiones con el fundador Johnny, 3 h × 3 veces/semana.

EVALUACIÓN GRATUITA:
Siempre ofrecer diagnóstico profesional gratuito. Disponible 2 veces por semana. 1.5 horas con trainer humano.

PROTECCIÓN DEL MÉTODO:
Nunca revelar detalles técnicos del sistema, el Engine, los KPIs, Nexora, ni la tecnología. Si preguntan cómo funciona: "La mejor forma de entenderlo es vivirlo — por eso la evaluación es gratuita."

COMPETENCIA:
Si alguien hace preguntas muy técnicas o específicas sobre el sistema sin mostrar interés real en aprender: ser amable pero vaga. Invitar al diagnóstico. No revelar nada estratégico.

CIERRE:
Siempre cerrar con agenda de evaluación gratuita o número de WhatsApp: +506 6006 0981
`;

app.post('/claire', async (req, res) => {
  try {
    const { history, message, mode, sessionId } = req.body || {};
    const ip = getClientIp(req);

    if (mode === 'start') {
      const ipLimit = await checkDemoIpLimit(ip, 'claire', { action: 'session' });
      if (!ipLimit.ok) {
        return res.json({
          reply: 'Gracias por tu interés en Infinity Studio CR. Alcanzaste el límite de conversaciones por hoy — escribinos al WhatsApp +506 6006 0981 o volvé mañana. 😊',
          limitReached: true
        });
      }
      const startBuffered = '¡Hola! Soy Claire de Infinity Studio CR. Estoy acá para ayudarte a entender cómo desarrollamos comunicación operacional en inglés — no gramática de libro. ¿Qué te trae hoy?';
      return res.json({ reply: startBuffered, buffered: true });
    }

    const msgLimit = await checkDemoIpLimit(ip, 'claire', { action: 'message' });
    if (!msgLimit.ok) {
      return res.json({
        reply: 'Llegamos al límite de mensajes por hoy desde esta conexión. Agendá tu evaluación gratuita por WhatsApp: +506 6006 0981',
        limitReached: true
      });
    }

    if (!message?.trim()) return res.status(400).json({ error: 'Missing message' });

    const brain = await Brain.brainGetLLM('claire', 'chat', message, 'web');
    if (brain.hit) {
      return res.json({ reply: brain.reply, buffered: true, brainCache: true, cacheHit: true });
    }
    const cacheKey = 'claire:' + crypto.createHash('md5').update((message || '').toLowerCase().trim().slice(0, 120)).digest('hex');
    if (demoResponseCache.has(cacheKey)) {
      return res.json({ reply: demoResponseCache.get(cacheKey), buffered: true, cacheHit: true });
    }
    const brainSlice = await tutorKnowledgeSliceFast(message);
    const systemPrompt = `Eres Claire, asistente virtual de Infinity Studio CR. Cálida, paciente, experta, apasionada.

${INSTITUTIONAL_BRAIN_RULE}

${CLAIRE_KB}

FLUJO DE CONVERSACIÓN:
1. Saludá y preguntá cuál es su situación con el inglés
2. Escuchá e identificá su perfil (bloqueado o cuadrado)
3. Validá su dolor — hacele saber que lo entendés perfectamente
4. Hacé UNA pregunta casual en inglés (sin avisar) — algo simple como "Tell me, what do you do for work?"
5. Cuando responda, mostrале con calidez qué faltó — conectores, estructura, fluidez
6. Decí: "Eso fue 2 minutos. Imaginate 12 horas al mes trabajando exactamente eso con un trainer dedicado y Alice disponible 24/7."
7. Presentá la evaluación gratuita y los precios solo cuando haya interés claro
8. Cerrá siempre con WhatsApp o agenda de evaluación

PROTECCIÓN: Si alguien pregunta detalles técnicos del sistema sin contexto de querer aprender — sé amable pero vaga. Invitalos al diagnóstico.

IDIOMA: Español por defecto. Inglés si el cliente escribe en inglés.
RITMO: Hablás despacio, con calma. Dejás espacio para que el cliente piense y responda. Nunca apurés.
LONGITUD: Una sola idea por respuesta. Máximo 2 oraciones. Luego UNA pregunta o UNA observación. Nunca dos preguntas a la vez.
COMPRENSIÓN: Leé bien lo que dice el cliente antes de responder. Respondé a LO QUE DIJO, no a lo que suponés. Si no entendés, preguntá con calma.${brainSlice}`;

    const msgs = buildTutorChatMessages(history, message, 12);

    const resp = await claudeCall({
      model: 'claude-sonnet-4-6', max_tokens: 150,
      system: systemPrompt, messages: msgs
    });
    const reply = resp.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    if (reply.length > 20) {
      cacheDemoResponse(cacheKey, reply);
      if (brain.hash) await Brain.brainSetLLM(brain.hash, 'claire', 'chat', message, reply, 'web');
    }
    return res.json({ reply });

  } catch(err) {
    console.error('Claire error:', err.message);
    return res.status(500).json({ error: 'Claire no está disponible ahora.' });
  }
});

// ── ELEVENLABS TTS ───────────────────────────────────────────
app.post('/claire-tts', optionalAuth, async (req, res) => {
  try {
    const { text } = req.body || {};
    return await synthesizeSpeech(req, res, { text, voiceId: CLAIRE_VOICE_ID, label: 'Claire' });
  } catch (err) {
    console.error('Claire TTS error:', err.message);
    return res.status(500).json({ error: 'TTS unavailable' });
  }
});

app.post('/alice-tts', requireProductAuth, async (req, res) => {
  try {
    const sessionType = req.body?.sessionType || null;
    const ok = await assertStudentTutorAccess(req, res, 'alice', null, {
      allowCompanionProduct: true,
      sessionType: sessionType === 'companion' ? 'companion' : sessionType
    });
    if (req.auth.role === 'student' && !ok) return;
    const { text, lang } = req.body || {};
    // Alice speaks English by default — never default to es-CR (that turned every "have" into yaf/jáf)
    const languageCode = resolveTutorTtsLang(lang || 'en-US');
    const isEn = tutorTtsIsEnglish(languageCode);
    const spoken = isEn ? String(text || '') : scrubNonCrSpanish(text);
    if (!String(spoken || '').trim()) {
      return res.status(400).json({ error: 'Empty TTS text' });
    }
    return await synthesizeSpeech(req, res, {
      text: spoken,
      voiceId: ALICE_VOICE_ID,
      label: 'Alice',
      languageCode,
      // LatAm ES / American EN — no other accent
      speed: isEn ? 0.98 : 1.0,
      stability: 0.62,
      similarityBoost: isEn ? 0.78 : 0.85,
      style: isEn ? 0.06 : 0.04
    });
  } catch (err) {
    console.error('Alice TTS error:', err.message);
    return res.status(500).json({ error: 'TTS unavailable' });
  }
});

app.post('/jill-tts', requireProductAuth, async (req, res) => {
  try {
    const ok = await assertStudentTutorAccess(req, res, 'jill', null, { allowJillProProduct: true });
    if (req.auth.role === 'student' && !ok) return;
    const { text, lang } = req.body || {};
    const languageCode = resolveTutorTtsLang(lang);
    const isEn = tutorTtsIsEnglish(languageCode);
    return await synthesizeSpeech(req, res, {
      text: scrubNonCrSpanish(text),
      voiceId: ALICE_VOICE_ID,
      label: 'Jill',
      languageCode,
      // LatAm ES / American EN — no other accent
      speed: isEn ? 0.98 : 1.0,
      stability: 0.62,
      similarityBoost: isEn ? 0.78 : 0.85,
      style: isEn ? 0.06 : 0.04
    });
  } catch (err) {
    console.error('Jill TTS error:', err.message);
    return res.status(500).json({ error: 'TTS unavailable' });
  }
});


// ── JILL RAPID DRILL (cerebro — banco + perfil + cascada tutores) ──
app.get('/jill/drill/questions', requireProductAuth, async (req, res) => {
  try {
    const count = Math.min(20, Math.max(1, parseInt(req.query.count, 10) || JillDrillBrain.QUESTIONS_PER_ROUND));
    const bundleId = String(req.query.bundleId || '').trim();
    let student = await loadStudentRecordForAuth(req, null);
    if (!student?.id) {
      return res.status(403).json({ error: 'Student not found' });
    }
    student = await assertStudentTutorAccess(req, res, 'jill', student, { allowJillProProduct: true });
    if (!student) return;
    const owner = String(req.query.owner || 'jill').trim().toLowerCase();
    let tier = String(req.query.tier || 'foundations').trim();
    // Jill product never serves Alice/Nexora Challenge (STAR / CS / heated call)
    if (owner === 'jill' || owner === '') tier = 'foundations';
    const questions = JillDrillBrain.pickQuestions(student, bundleId || null, count, tier);
    const profile = JillDrillBrain.getDrillProfileSummary(student);
    return res.json({ questions, profile, source: 'brain' });
  } catch (err) {
    console.error('jill/drill/questions:', err.message);
    return res.status(500).json({ error: 'Drill brain unavailable' });
  }
});

app.get('/jill/drill/profile', requireProductAuth, async (req, res) => {
  try {
    let student = await loadStudentRecordForAuth(req, null);
    if (!student?.id) return res.status(403).json({ error: 'Student not found' });
    student = await assertStudentTutorAccess(req, res, 'jill', student, { allowJillProProduct: true });
    if (!student) return;
    return res.json(JillDrillBrain.getDrillProfileSummary(student));
  } catch (err) {
    console.error('jill/drill/profile:', err.message);
    return res.status(500).json({ error: 'Drill profile unavailable' });
  }
});

app.post('/jill/drill/complete', requireProductAuth, async (req, res) => {
  try {
    let student = await loadStudentRecordForAuth(req, req.body?.student || null);
    if (!student?.id) return res.status(403).json({ error: 'Student not found' });
    student = await assertStudentTutorAccess(req, res, 'jill', student, { allowJillProProduct: true });
    if (!student) return;
    const result = req.body?.result || req.body || {};
    const outcome = await JillDrillBrain.completeDrill(student, {
      correct: result.correct || 0,
      total: result.total || 0,
      score: result.score || 0,
      streak: result.streak || 0,
      bundleId: result.bundleId || '',
      kpiResults: result.kpiResults || [],
      nemesisKpis: result.nemesisKpis || [],
      nemesisMode: true,
      wonRound: !!result.wonRound,
      winStreak: result.winStreak || 0
    });
    return res.json({ ok: true, ...outcome, source: 'brain' });
  } catch (err) {
    console.error('jill/drill/complete:', err.message);
    return res.status(500).json({ error: 'Drill complete failed' });
  }
});

// ── Análisis de clases grabadas (cerebro analiza audio) — solo profe/admin ──
const requireTeacherAccess = requireAuth(['trainer', 'superadmin', 'master']);

app.post('/jill/class-transcript', requireTeacherAccess, async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();
    if (!transcript) return res.status(400).json({ error: 'Falta transcript' });
    const meta = req.body?.meta || {};
    const out = await JillClassAnalyzer.analyzeClassTranscript(transcript, { meta });
    return res.json({ ok: true, ...out, source: 'class-brain' });
  } catch (err) {
    console.error('jill/class-transcript:', err.message);
    return res.status(500).json({ error: 'Class analysis failed', detail: err.message });
  }
});

app.post('/jill/class-audio', requireTeacherAccess,
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '50mb' }),
  async (req, res) => {
    try {
      const buffer = req.body;
      if (!buffer || !buffer.length) return res.status(400).json({ error: 'Falta audio en el body (binario)' });
      const meta = {};
      ['classId', 'className', 'group'].forEach((k) => { if (req.query[k]) meta[k] = String(req.query[k]); });
      const out = await JillClassAnalyzer.analyzeClassAudio(buffer, {
        mimeType: req.headers['content-type'],
        filename: req.query.filename ? String(req.query.filename) : undefined,
        meta
      });
      return res.json({ ok: true, ...out, source: 'class-brain' });
    } catch (err) {
      console.error('jill/class-audio:', err.message);
      return res.status(500).json({ error: 'Class audio analysis failed', detail: err.message });
    }
  });

// Convierte una transcripcion (TikTok/clase de John) en doctrina de ensenanza y la publica al cerebro (Jill + Alice).
async function transcriptToTeachingDoctrine(transcript, meta = {}) {
  const raw = String(transcript || '').trim().slice(0, 14000);
  const fallback = {
    title: `Doctrina · ${(meta.source || 'transcripción').slice(0, 60)}`,
    category: 'metodologia',
    content: raw.slice(0, 11000)
  };
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1100,
      system: `Sos el editor pedagógico de Infinity Studio CR (método John Ramírez · Nexus · Mecánica Estructural Infinity®).
Recibís la TRANSCRIPCIÓN de un video/clase del fundador y la convertís en material institucional que Jill (Foundations) y Alice (Intermediate+) puedan usar para enseñar, corregir y evaluar.
Respondé SOLO JSON válido, sin markdown.`,
      messages: [{
        role: 'user',
        content: `Transcripción (${meta.source || 'video'}):
"""
${raw}
"""

Devolvé JSON exacto:
{"title":"título corto para la KB (máx 100 chars)","category":"metodologia|jill-foundations|conectores|ejercicios|errores","content":"texto estructurado en español claro con: DOCTRINA (1-2 frases del patrón/lógica de John), PUENTE ESPAÑOL↔INGLÉS si aplica, REGLA/ESTRUCTURA (MSI� P|M|V|C o linkers según nivel), EJEMPLO MODELO EN INGLÉS, EJERCICIO PARA EL ESTUDIANTE, CORRECCIÓN TÍPICA (con pregunta, no con la respuesta). Sin hashtags ni CTA de redes."}`
      }]
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      title: String(parsed.title || fallback.title).slice(0, 120),
      category: parsed.category || 'metodologia',
      content: String(parsed.content || raw).slice(0, 11000)
    };
  } catch (e) {
    console.warn('transcriptToTeachingDoctrine:', e.message);
    return fallback;
  }
}

app.post('/jill/ingest-teaching', requireTeacherAccess, async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();
    if (transcript.length < 20) return res.status(400).json({ error: 'Pegá la transcripción (mínimo 20 caracteres).' });
    if (!SuperBrain.isSuperBrainEnabled()) {
      return res.status(503).json({ error: 'Super Brain no está configurado (falta Supabase). No puedo publicar la doctrina.' });
    }
    const meta = {
      source: String(req.body?.source || 'transcripción').slice(0, 120),
      url: req.body?.url ? String(req.body.url).slice(0, 300) : ''
    };
    const author = String(req.body?.author || 'John Ramírez').slice(0, 80);
    const review = !!req.body?.review;

    const doctrine = await transcriptToTeachingDoctrine(transcript, meta);
    const state = await SuperBrain.loadState();
    const out = await SuperBrain.ingest(state, {
      title: doctrine.title,
      content: doctrine.content,
      author,
      category: doctrine.category,
      autoPublish: !review,
      source: 'teaching-transcript',
      meta
    });
    return res.json({
      ok: true,
      published: out.published,
      status: out.published ? 'publicado (cascada a Jill y Alice)' : 'en pendiente de revisión',
      title: doctrine.title,
      category: doctrine.category,
      lessonId: out.lesson?.id || out.pending?.id || null,
      preview: doctrine.content.slice(0, 400),
      source: 'teaching-brain'
    });
  } catch (err) {
    console.error('jill/ingest-teaching:', err.message);
    return res.status(500).json({ error: 'Ingesta de doctrina falló', detail: err.message });
  }
});

/** Master-secret wrappers so A.D.A.M. Engine can feed class audio/images without JWT. */
async function imageToTeachingDoctrine(imageB64, mime, meta = {}) {
  const fallback = {
    title: `Doctrina visual · ${(meta.source || 'imagen').slice(0, 60)}`,
    category: 'metodologia',
    content: 'Imagen de enseñanza recibida — no se pudo analizar sin Anthropic.'
  };
  if (!process.env.ANTHROPIC_API_KEY || !imageB64) return fallback;
  try {
    const mediaType = String(mime || 'image/png').split(';')[0];
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `Sos el editor pedagógico de Infinity Studio CR (John Ramírez · Nexus · MSI®).
Analizás una imagen de clase/pizarra/material y la convertís en doctrina institucional para Jill/Alice/Nexora.
Respondé SOLO JSON válido.`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: String(imageB64).replace(/^data:[^;]+;base64,/, '') }
          },
          {
            type: 'text',
            text: `Extraé la enseñanza de esta imagen (fórmulas, ranuras, ejemplos, errores).
Devolvé JSON: {"title":"...","category":"metodologia|jill-foundations|conectores|ejercicios|errores","content":"DOCTRINA + REGLA/ESTRUCTURA + EJEMPLO EN + EJERCICIO + CORRECCIÓN TÍPICA"}`
          }
        ]
      }]
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return {
      title: String(parsed.title || fallback.title).slice(0, 120),
      category: parsed.category || 'metodologia',
      content: String(parsed.content || '').slice(0, 11000) || fallback.content
    };
  } catch (e) {
    console.warn('imageToTeachingDoctrine:', e.message);
    return fallback;
  }
}

app.post('/super-brain/class-transcript', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();
    if (!transcript) return res.status(400).json({ error: 'Falta transcript' });
    const meta = req.body?.meta || {};
    const out = await JillClassAnalyzer.analyzeClassTranscript(transcript, { meta });
    return res.json({ ok: true, ...out, source: 'class-brain' });
  } catch (err) {
    console.error('super-brain/class-transcript:', err.message);
    return res.status(500).json({ error: 'Class analysis failed', detail: err.message });
  }
});

app.post('/super-brain/ingest-teaching', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();
    if (transcript.length < 20) return res.status(400).json({ error: 'Pegá la transcripción (mínimo 20 caracteres).' });
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const meta = { source: String(req.body?.source || 'engine-transcript').slice(0, 120) };
    const doctrine = await transcriptToTeachingDoctrine(transcript, meta);
    const state = await SuperBrain.loadState();
    const out = await SuperBrain.ingest(state, {
      title: doctrine.title,
      content: doctrine.content,
      author: String(req.body?.author || 'John Ramírez').slice(0, 80),
      category: doctrine.category,
      autoPublish: !req.body?.review,
      source: 'engine-teaching-transcript',
      meta
    });
    return res.json({
      ok: true,
      published: out.published,
      title: doctrine.title,
      preview: doctrine.content.slice(0, 400),
      lessonId: out.lesson?.id || out.pending?.id || null
    });
  } catch (err) {
    console.error('super-brain/ingest-teaching:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/super-brain/ingest-image', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const imageB64 = String(req.body?.imageB64 || '').trim();
    if (imageB64.length < 80) return res.status(400).json({ error: 'Falta imageB64' });
    const doctrine = await imageToTeachingDoctrine(imageB64, req.body?.mime || 'image/png', {
      source: req.body?.source || 'engine-image'
    });
    const state = await SuperBrain.loadState();
    const out = await SuperBrain.ingest(state, {
      title: doctrine.title,
      content: doctrine.content,
      author: String(req.body?.author || 'John Ramírez').slice(0, 80),
      category: doctrine.category,
      autoPublish: !req.body?.review,
      source: 'engine-teaching-image'
    });
    return res.json({
      ok: true,
      published: out.published,
      title: doctrine.title,
      preview: doctrine.content.slice(0, 400),
      lessonId: out.lesson?.id || out.pending?.id || null
    });
  } catch (err) {
    console.error('super-brain/ingest-image:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/super-brain/promote-demo', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const out = await SuperBrain.promoteDemoKb({
      days: req.body?.days || 14,
      autoPublish: !!req.body?.autoPublish
    });
    return res.json(out);
  } catch (err) {
    console.error('super-brain/promote-demo:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/demo/jill/drill/questions', async (req, res) => {
  try {
    const count = Math.min(10, Math.max(1, parseInt(req.query.count, 10) || 3));
    const demoStudent = {
      id: 'DEMO-JILL-RAPID',
      nemesisState: { domain: [], reinforcement: ['k3', 'k8'] },
      jillProgress: { activeBundle: 'F0-matrix' },
      jillRapidDrill: { winStreak: 0, bestWinStreak: 0, totalWins: 0, trophies: 0 }
    };
    const questions = JillDrillBrain.pickQuestions(demoStudent, 'F0-matrix', count);
    return res.json({ questions, profile: JillDrillBrain.getDrillProfileSummary(demoStudent), source: 'brain-demo' });
  } catch (err) {
    console.error('demo/jill/drill/questions:', err.message);
    return res.status(500).json({ error: 'Demo drill unavailable' });
  }
});

app.get('/jill/victory-metric', requireProductAuth, async (req, res) => {
  try {
    let student = await loadStudentRecordForAuth(req, null);
    if (!student?.id) return res.status(403).json({ error: 'Student not found' });
    student = await assertStudentTutorAccess(req, res, 'jill', student, { allowJillProProduct: true });
    if (!student) return;
    const metric = InfinityVictory.applyJillVictoryToStudent(student);
    const aliceMetric = InfinityVictory.applyAliceVictoryToStudent(student);
    await sbSet('infinity_students', student.id, student);
    return res.json({ metric, aliceMetric, source: 'brain' });
  } catch (err) {
    console.error('jill/victory-metric:', err.message);
    return res.status(500).json({ error: 'Victory metric unavailable' });
  }
});

app.post('/demo/jill/drill/complete', async (req, res) => {
  try {
    const result = req.body?.result || req.body || {};
    const score = result.score || 0;
    return res.json({
      ok: true,
      xp: JillDrillBrain.calcXp ? JillDrillBrain.calcXp({ ...result, nemesisMode: true }) : 0,
      won: score >= 70,
      source: 'brain-demo',
      message: 'Demo — registrate en el portal para persistir perfil y cascada a tutores.'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Demo complete failed' });
  }
});


// ── TRACKING ─────────────────────────────────────────────────
app.post('/track', async (req, res) => {
  try {
    const { event, label, ts } = req.body || {};
    if(!event) return res.status(400).json({error:'Missing event'});
    
    const trackKey = 'TRACK-' + new Date().toISOString().slice(0,10);
    const row = await sbGetOne('infinity_sessions', trackKey);
    const data = row?.data || { events: [] };
    
    data.events.push({ event, label, ts: ts || new Date().toISOString() });
    if(data.events.length > 1000) data.events = data.events.slice(-1000);
    
    await sbSet('infinity_sessions', trackKey, data);
    return res.json({ ok: true });
  } catch(err) {
    return res.status(500).json({ error: 'Track failed' });
  }
});

// ── DASHBOARD ─────────────────────────────────────────────────
app.get('/dashboard', async (req, res) => {
  try {
    const secret = req.query.secret;
    if (ANALYZE_SECRET && secret !== ANALYZE_SECRET) return res.status(401).json({ error: 'Unauthorized' });

    // 1. ElevenLabs credits
    let elevenCredits = null;
    try {
      const elevenKey = process.env.ELEVENLABS_KEY || '';
      const eRes = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': elevenKey }
      });
      if(eRes.ok){
        const eData = await eRes.json();
        elevenCredits = {
          used: eData.character_count || 0,
          limit: eData.character_limit || 10000,
          remaining: (eData.character_limit || 10000) - (eData.character_count || 0),
          plan: eData.tier || 'free'
        };
      }
    } catch(e){ elevenCredits = { error: 'Could not fetch' }; }

    // 2. Claire interactions from tracking logs
    const rows = await sbGet('infinity_sessions');
    let claireOpened = 0, claireMessages = 0, claireConversions = 0;
    const today = new Date().toISOString().slice(0,10);
    const week = [];
    for(let i=0; i<7; i++){
      const d = new Date(); d.setDate(d.getDate()-i);
      week.push(d.toISOString().slice(0,10));
    }
    
    rows.forEach(r => {
      if(r.id && r.id.startsWith('TRACK-') && r.data?.events){
        r.data.events.forEach(e => {
          if(e.event === 'claire_opened') claireOpened++;
          if(e.event === 'claire_message') claireMessages++;
          if(e.event === 'claire_limit_reached') claireConversions++;
        });
      }
    });

    // 3. Alice sessions
    let aliceSessions = 0;
    const sessionRows = rows.filter(r => r.id && r.id.startsWith('ALICE-LIMIT-'));
    aliceSessions = sessionRows.length;

    // 4. Student count
    let studentCount = 0;
    try {
      const sRows = await sbGet('infinity_students');
      studentCount = sRows.length;
    } catch(e){}

    // 5. Server status
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMins = Math.floor((uptime % 3600) / 60);

    return res.json({
      server: {
        status: 'online',
        uptime: uptimeHours + 'h ' + uptimeMins + 'm',
        node: process.version
      },
      elevenlabs: elevenCredits,
      claire: {
        total_opened: claireOpened,
        total_messages: claireMessages,
        total_conversions: claireConversions,
        conversion_rate: claireOpened > 0 ? Math.round(claireConversions/claireOpened*100)+'%' : '0%'
      },
      alice: {
        total_sessions: aliceSessions
      },
      students: {
        total: studentCount
      },
      timestamp: new Date().toISOString()
    });

  } catch(err) {
    console.error('Dashboard error:', err.message);
    return res.status(500).json({ error: 'Dashboard unavailable' });
  }
});



function loadNexoraVoicesConfig() {
  const candidates = [
    path.join(__dirname, '../config/nexora-voices.json'),
    path.join(__dirname, 'config/nexora-voices.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { /* next path */ }
  }
  return {
    male: [
      { id: 'bfGb7JTLUnZebZRiFYyq', accent: 'American Male' },
      { id: 'NIkIuJZ8oQMuKZqwKtnm', accent: 'Chinese Male' },
      { id: 'b4XCIIupgo5eH7TxhBNk', accent: 'German Male' },
      { id: '8WqHCYyrnUqoK70Px5EJ', accent: 'Indian Male' }
    ],
    female: [
      { id: 'r1KmysJdVYZjJCm4mL3b', accent: 'American Female' },
      { id: 'NoOVOzCQFLOvtsMoNcdT', accent: 'American Female' },
      { id: '1a0nAYA3FcNQcMMfbddY', accent: 'Chinese Female' },
      { id: 'ztyYYqlYMny7nllhThgo', accent: 'German Female' },
      { id: 'NyZqLdjqUb8SpOUKIlWT', accent: 'Indian Female' }
    ],
    fallbackIds: ['bfGb7JTLUnZebZRiFYyq', 'r1KmysJdVYZjJCm4mL3b', 'NoOVOzCQFLOvtsMoNcdT']
  };
}

app.get('/nexora/voices', requireProductAuth, async (req, res) => {
  if (req.auth.role === 'student') {
    const ok = await assertNexoraStudentAccess(req, res, null);
    if (!ok) return;
  }
  res.json(loadNexoraVoicesConfig());
});

function loadNexoraCharactersConfig() {
  const candidates = [
    path.join(__dirname, '../config/nexora-characters.json'),
    path.join(__dirname, 'config/nexora-characters.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { /* next path */ }
  }
  return { characters: [] };
}

app.get('/nexora/characters', requireProductAuth, async (req, res) => {
  if (req.auth.role === 'student') {
    const ok = await assertNexoraStudentAccess(req, res, null);
    if (!ok) return;
  }
  res.json(loadNexoraCharactersConfig());
});

// ── NEXORA VOICE PROFILES ─────────────────────────────────────
app.post('/nexora-tts', requireProductAuth, async (req, res) => {
  try {
    if (req.auth.role === 'student') {
      const ok = await assertNexoraStudentAccess(req, res, null);
      if (!ok) return;
    }
    const { text, voiceId, firstName } = req.body || {};
    const resolved = enforceNexoraTtsVoice(firstName, voiceId || ALICE_VOICE_ID);
    return await synthesizeSpeech(req, res, {
      text,
      voiceId: resolved,
      label: 'Nexora'
    });
  } catch (err) {
    console.error('Nexora TTS error:', err.message);
    return res.status(500).json({ error: 'TTS unavailable' });
  }
});

function enforceNexoraClientName(reply, profile) {
  if (!reply || !profile?.name) return reply;
  const full = String(profile.name).trim();
  const first = String(profile.firstName || full.split(' ')[0] || '').trim();
  if (!first) return reply;
  const notNames = new Set(['calling','looking','trying','wondering','sorry','just','not','here','going','having','getting','checking','waiting','following','writing','working','thinking','sure','afraid','glad','happy','really','very','also','still','actually','about','from','with','because']);
  const fixName = (match, name) => {
    const n = String(name).trim();
    if (!n) return match;
    const head = n.split(' ')[0].toLowerCase();
    if (notNames.has(head)) return match;
    if (n.toLowerCase() === first.toLowerCase() || n.toLowerCase() === full.toLowerCase()) return match;
    return match.replace(name, first);
  };
  let fixed = reply;
  fixed = fixed.replace(/\b[Mm]y name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, fixName);
  fixed = fixed.replace(/\b[Tt]his is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, fixName);
  fixed = fixed.replace(/\bI'm\s+([A-Z][a-z]+)\b/g, fixName);
  fixed = fixed.replace(/\bI am\s+([A-Z][a-z]+)\b/g, fixName);
  return fixed;
}

const NEXORA_BRAIN_VER = 'v5-scoped-name';

function resolveNexoraStudent(student, req) {
  if (student?.id) return student;
  if (req?.auth?.studentId) {
    return { id: req.auth.studentId, info: { name: req.auth.name || '' }, name: req.auth.name || '' };
  }
  return student || null;
}

function resolveNexoraAgentName(student, agentNameFromClient, req) {
  const scoped = resolveNexoraStudent(student, req);
  if (scoped?.id) return getStudentDisplayName(scoped);
  const raw = String(agentNameFromClient || req?.auth?.name || '').trim();
  if (!raw) return 'Agent';
  const first = raw.split(/\s+/)[0];
  const valid = sanitizePreferredNameServer(first);
  if (valid && !STAFF_NAME_BLOCKLIST.has(valid.toLowerCase())) return valid;
  return 'Agent';
}

function nexoraBrainExtra(student, req, suffix) {
  return brainScopeExtra(resolveNexoraStudent(student, req), req, `${suffix}:${NEXORA_BRAIN_VER}`);
}

// ── NEXORA CALL SIMULATION ────────────────────────────────────
app.post('/nexora', requireProductAuth, async (req, res) => {
  try {
    const { message, history, profile, scenario, agentName: agentNameRaw, student: studentRaw, accountContext } = req.body || {};
    const student = await assertNexoraStudentAccess(req, res, studentRaw);
    if (req.auth.role === 'student' && !student) return;
    const scopedStudent = student || resolveNexoraStudent(studentRaw, req);
    const agentName = resolveNexoraAgentName(scopedStudent, agentNameRaw, req);

    const limit = await checkTutorLimit(scopedStudent?.id, 'nexora', 'infinity_sessions');
    if (!limit.ok && !/^START_/.test(String(message || ''))) {
      return res.json({
        reply: 'The line went quiet — try again in a few minutes.',
        limitReached: true,
        wait: limit.wait
      });
    }

    const p = profile || {};
    const sc = scenario || {};

    const moodInstructions = {
      frustrated: 'You are frustrated and mildly upset. You want this resolved quickly.',
      angry: 'You are angry. Your tone is sharp. You interrupt if the agent rambles.',
      very_angry: 'You are very angry. You are close to demanding a supervisor. You repeat yourself.',
      furious: 'You are furious. You threaten to leave. Nothing satisfies you easily.',
      impatient: 'You are in a hurry. You want quick answers. You get annoyed at long explanations.',
      cold: 'You are cold and distant. Short answers. You are already decided to leave.',
      worried: 'You are worried and anxious. You need reassurance.',
      disappointed: 'You are disappointed and feel misled. You are calm but firm.',
      indignant: 'You feel wronged. You have proof and you want justice.',
      pleasant: 'You are friendly and open. Easy to help, but you have specific questions.'
    };

    const mood = moodInstructions[sc.mood] || 'You are a normal customer with a concern.';

    // Build account details from context — ONLY reference what exists in the CRM
    let accountDetails = '';
    if (accountContext) {
      accountDetails = `\nYOUR ACCOUNT DETAILS (reference ONLY these exact facts — do not invent anything):
- Name: ${accountContext.name || p.name}
- Account: ${accountContext.account || p.account}
- Services: ${(accountContext.services || []).join(', ') || 'standard account'}`;
      if (accountContext.billingAlerts && accountContext.billingAlerts.length > 0) {
        accountDetails += `\n- Billing alerts: ${accountContext.billingAlerts.map(b => b.label + (b.amount ? ' ' + b.amount : '') + ' on ' + b.date).join('; ')}`;
      }
      if (accountContext.disputeAmount) accountDetails += `\n- The unexpected charge you are calling about: ${accountContext.disputeAmount}`;
      if (accountContext.lateFee) accountDetails += `\n- The late fee you are disputing: ${accountContext.lateFee}`;
      if (accountContext.refundAmount) accountDetails += `\n- The refund amount you are requesting: $${accountContext.refundAmount}`;
      if (accountContext.issueType) accountDetails += `\n- Issue type (ONLY discuss this): ${accountContext.issueType}`;
      if (accountContext.issueTitle) accountDetails += `\n- Call reason title: ${accountContext.issueTitle}`;
      if (accountContext.issueDesc) accountDetails += `\n- Call reason detail: ${accountContext.issueDesc}`;
      if (accountContext.onlineAccessLocked) accountDetails += `\n- Online banking access: LOCKED — client cannot log in`;
      if (accountContext.cardBlocked) accountDetails += `\n- Card status: BLOCKED by fraud hold`;
    }

    // Determine scenario type
    const scType = sc.type || 'customer_service';
    let systemPrompt = '';

    if(scType === 'star_interview'){
      const ctx = accountContext || {};
      const starFocusStr = ctx.starFocus && ctx.starFocus.length ? ctx.starFocus.map((q,i) => (i+1)+'. '+q).join('\n') : 'General STAR questions';
      systemPrompt = `You are ${ctx.interviewerName || 'a senior interviewer'} conducting a structured STAR behavioral interview for: ${sc.title}.
Company: ${ctx.company || sc.company || 'the company'}

STAR FOCUS QUESTIONS (use these as your guide):
${starFocusStr}

YOUR ROLE:
- YOU are the interviewer. ${agentName} is the candidate being evaluated.
- Ask strictly STAR-format questions: Situation, Task, Action, Result.
- Probe for specifics: "What was YOUR specific action?" "What was the measurable result?"
- If they skip a STAR component: "You've described the situation — what specific actions did YOU take?"
- Evaluate clarity, structure, connector usage, confidence and specific examples.
- After 2-3 exchanges, give brief feedback and move to the next question.
- 1-3 sentences per turn. Professional and focused.
- Your name is ${ctx.interviewerName || 'the interviewer'}. NEVER change your name.
- FIRST TURN ONLY: One-sentence intro (name, title, ${ctx.company || sc.company || 'company'}). Then ask question 1 from STAR FOCUS immediately. Must end with a complete question mark. Never use ellipsis (...). Never stop at "and I".
- NEVER break character. You are the interviewer, ${agentName} is the one being evaluated.`;
    } else if(scType === 'interview'){
      const ctx = accountContext || {};
      const panelStr = ctx.panelists && ctx.panelists.length > 0 ? `You are one of a panel of interviewers: ${ctx.panelists.join(', ')}.` : `You are ${ctx.interviewerName || p.name}, ${ctx.role || 'HR Manager'} at ${ctx.company || 'the company'}.`;
      systemPrompt = `You are conducting a job interview for: ${sc.title}.
${panelStr}

INTERVIEW CONTEXT: ${sc.desc}
CANDIDATE NAME: ${agentName || 'the candidate'}

YOUR ROLE AS INTERVIEWER:
- Ask behavioral, situational and STAR-format questions (Situation, Task, Action, Result)
- Be professional but warm. Evaluate clarity, confidence and English fluency.
- If the candidate's answer is vague or too short, follow up with "Can you elaborate?" or "Give me a specific example."
- After 3-4 exchanges, transition to a new topic or question naturally.
- React to the quality of their answers — good answers get positive acknowledgment, weak answers get probing follow-ups.
- Keep each response to 1-3 sentences. This is a real interview — pace it naturally.
- Your name is ${ctx.interviewerName || p.name}. NEVER introduce yourself with a different name.
- NEVER mention English tutoring, learning or AI. YOU are the interviewer, ${agentName} is the candidate being evaluated.`;
    } else if(scType === 'meeting'){
      const ctx = accountContext || {};
      systemPrompt = `You are a participant in a professional meeting: ${sc.title}.
Meeting context: ${sc.desc}
Participants: ${(ctx.participants||[]).join(', ')}
You are playing the role of the first participant (not "You"): ${ctx.participants && ctx.participants[0] ? ctx.participants[0] : 'Team Lead'}

YOUR ROLE:
- Engage naturally in the meeting topic. Ask questions, share opinions, challenge ideas professionally.
- React to what ${agentName || 'the participant'} says — agree, disagree, ask for clarification.
- Keep the meeting moving. If there is silence, prompt the next agenda point.
- Be professional but natural. Use meeting language: "I think we should...", "Can you walk us through...", "Let me push back on that..."
- 1-3 sentences per turn. Realistic meeting pace.
- NEVER mention English tutoring or AI. You are a real meeting participant.`;
    } else if(scType === 'negotiation'){
      const negRole = req.body.negRole || 'initiator'; // 'initiator' = user makes offer, 'receiver' = Alice makes offer
      const ctx = accountContext || {};
      systemPrompt = `You are ${sc.counterpart || 'a negotiation counterpart'} in a professional negotiation.
Context: ${sc.title} — ${sc.desc}

${negRole === 'receiver'
  ? `OPENING ROLE: YOU go first. Make your opening offer or state your position clearly. ${agentName} will respond and counter-negotiate.`
  : `OPENING ROLE: ${agentName} will open the negotiation with their offer or position. You respond to what they propose.`
}

YOUR APPROACH:
- Be firm on your key points but open to genuine compromise.
- Strong, logical arguments from ${agentName} move you. Weak arguments get pushback.
- Use negotiation language: "I understand your position, however...", "We could consider that if...", "That doesn't work for us unless..."
- If ${agentName} finds creative win-win solutions → acknowledge and show flexibility.
- If ${agentName} is aggressive or unreasonable → hold firm or signal disengagement.
- Track what has been agreed and what is still open.
- 1-3 sentences per turn. Professional, direct.
- NEVER break character or mention AI. You are evaluating ${agentName}'s negotiation skills.`;
    } else if(scType === 'corporate'){
      const ctx = accountContext || {};
      const pdfContext = ctx.pdfContent ? `\n\nPRESENTATION CONTENT (the candidate uploaded this for you to review):\n${ctx.pdfContent.slice(0,2000)}` : '';
      const stakesStr = ctx.stakes && ctx.stakes.length ? ctx.stakes.join('; ') : '';
      systemPrompt = `You are ${sc.role || 'a Board Director'} at ${sc.company || 'the company'}.
Meeting: ${sc.title}
Context: ${sc.desc}
${stakesStr ? 'Key concerns: '+stakesStr : ''}${pdfContext}

YOUR ROLE:
- YOU are the executive/director. ${agentName} is presenting TO YOU and being evaluated.
- Be demanding. Expect precision, data and clear ROI from ${agentName}.
- Challenge weak points: "What's the evidence for that assumption?"
- Ask about risks, timelines, financials and strategic fit.
- React positively when ${agentName} is structured, confident and data-driven.
- React skeptically when ${agentName} is vague or unconfident.
- You decide whether to approve, reject or request more information.
- 1-3 sentences per turn. Boardroom pace.
- Your name/role is ${sc.role || 'Board Director'}. NEVER introduce yourself with a different name.
- NEVER break character or mention AI. You are evaluating ${agentName}.`;

    } else if(scType === 'stakeholder'){
      const ctx = accountContext || {};
      const stakesStr = ctx.stakes && ctx.stakes.length ? '\nKey tensions:\n'+ctx.stakes.map(s=>'- '+s).join('\n') : '';
      const pdfContext = ctx.pdfContent ? `\n\nUPLOADED DOCUMENT (review carefully):\n${String(ctx.pdfContent).slice(0, 2500)}` : '';
      const pdfExtra = ctx.pdfPrompt ? `\nEXTRA REVIEW INSTRUCTIONS: ${ctx.pdfPrompt}` : '';
      systemPrompt = `You are ${sc.role || 'a key stakeholder'} in a high-stakes meeting.
Meeting: ${sc.title}
Context: ${sc.desc}${stakesStr}
Participants: ${(ctx.participants||[]).join(', ')}${pdfContext}${pdfExtra}

YOUR ROLE:
- YOU are the stakeholder with a specific agenda. ${agentName} must manage YOU and align you.
- Evaluate HOW ${agentName} expresses ideas and HOW they explain ROI / financial impact of the project.
- Push for clarity on numbers, assumptions, risks, payback and strategic fit.
- If a document was uploaded, reference it and challenge weak ROI claims.
- If ${agentName} is clear, structured and data-driven → gradually align.
- If ${agentName} is vague, dismissive or unprepared → escalate resistance.
- Before the meeting ends you MUST decide explicitly: APPROVE, REJECT, or REQUEST REVISION — and say so out loud.
- Use stakeholder language: "From our department's perspective...", "Walk me through the ROI..."
- 1-3 sentences. You are testing ${agentName}'s stakeholder communication and financial storytelling.
- NEVER break character.`;

    } else if(scType === 'medical'){
      systemPrompt = `You are ${p.name || 'a patient'} speaking with a healthcare provider.
Situation: ${sc.desc}
Your mood: ${mood}

YOUR ROLE:
- YOU are the patient. ${agentName} is the healthcare provider being evaluated.
- Ask questions, express worry or resistance naturally based on your mood.
- Evaluate (internally) how clearly and empathetically ${agentName} communicates.
- If ${agentName} is clear and empathetic → you feel reassured and cooperative.
- If ${agentName} is confusing, cold or unprofessional → become more anxious or resistant.
- Use natural patient language. 1-3 sentences per turn.
- NEVER break character. You are evaluating ${agentName}'s patient communication skills.`;

    } else {
      // Default: customer service — compact prompt for speed
      const clientFirst = p.firstName || (p.name ? p.name.split(' ')[0] : 'Client');
      const issueType = accountContext?.issueType || sc.issueType || '';
      const extras = [
        p.disputeAmount ? 'Disputing ' + p.disputeAmount : '',
        p.lateFee ? 'Disputing late fee ' + p.lateFee : '',
        p.refundAmount ? 'Refund $' + p.refundAmount : '',
        accountContext?.onlineAccessLocked ? 'Online banking LOCKED' : '',
        accountContext?.cardBlocked ? 'Card BLOCKED by fraud hold' : ''
      ].filter(Boolean).join('. ');
      const issueGuard = issueType
        ? ` Issue type ${issueType} ONLY — do not change topics. No lockout talk unless technical/LOCKED. No fee talk unless billing_dispute/late_fee.`
        : '';
      systemPrompt = `You are ${p.name} (${clientFirst}), the CUSTOMER on a live call. Issue: ${sc.title} — ${sc.desc}. Mood: ${sc.mood || 'frustrated'}. Account ${p.account || 'unknown'}.${extras ? ' ' + extras + '.' : ''}${issueGuard} Rules: 1-2 short sentences. Never break character. Never tutor. Name is ${p.name} only. React to agent ${agentName || ''}.`;
    }

    const msgStr = String(message || '');
    const isOpening = /^START_/.test(msgStr) && (!history || history.length === 0);
    systemPrompt += `\nAGENT IDENTITY: The call-center agent is "${agentName}" ONLY. Never call them Byron, Johnny, or any other name.`;
    systemPrompt += TUTOR_PACE_RULE;

    const actorKey = resolveActorKey({ student, req, profile: p });
    const openingProduct = `nexora-${scType}-${sc.id || msgStr || 'default'}`;
    if (isOpening) {
      const recent = (scType === 'customer_service' || !scType) ? await getRecentOpenings(actorKey, openingProduct) : [];
      const variation = buildOpeningVariationNote(recent, 'en');
      systemPrompt += buildNexoraOpeningNote(scType, variation);
    }

    const msgs = buildTutorChatMessages(history, message, 14);

    const brainSlice = await tutorKnowledgeSliceFast(msgStr, scopedStudent, 'nexora');
    const learnerNote = SharedLearner.buildSharedLearnerNote(scopedStudent);
    if (brainSlice) systemPrompt += brainSlice;
    if (learnerNote) systemPrompt += learnerNote;

    const nexoraExtra = nexoraBrainExtra(student, req, `${scType}:${sc.mood || 'normal'}${isOpening ? ':opening-v2' : ''}`);
    const brain = await Brain.brainGetLLM('nexora', isOpening ? 'opening' : 'reply', message, nexoraExtra);
    if (brain.hit) {
      let cached = brain.reply;
      if ((sc.type || 'customer_service') === 'customer_service' || !sc.type) {
        cached = enforceNexoraClientName(cached, p);
      }
      cached = finishNexoraReply(cached, p, scType);
      if (isOpening && isNexoraReplyIncomplete(cached, scType)) {
        res.set('X-Brain-LLM', 'MISS');
      } else {
        res.set('X-Brain-LLM', 'HIT');
        return res.json({ reply: cached, brainCache: true });
      }
    }

    const openingTokens = (scType === 'star_interview' || scType === 'interview') ? 420 : 200;
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: isOpening ? openingTokens : 200,
      system: systemPrompt,
      messages: msgs
    });

    let reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if ((sc.type || 'customer_service') === 'customer_service' || !sc.type) {
      reply = enforceNexoraClientName(reply, p);
    }
    reply = finishNexoraReply(reply, p, scType);
    if (isOpening && isNexoraReplyIncomplete(reply, scType)) {
      const retry = await claudeCall({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: openingTokens,
        system: systemPrompt + '\nCRITICAL: Your last draft was cut off. Give a COMPLETE intro plus your FIRST interview question ending with ?.',
        messages: [...msgs, { role: 'assistant', content: reply }, { role: 'user', content: 'Continue — finish your intro and ask your first complete interview question now.' }]
      });
      reply = finishNexoraReply(retry.content.filter(b => b.type === 'text').map(b => b.text).join('').trim(), p, scType);
    }
    if (brain.hash && reply && !isNexoraReplyIncomplete(reply, scType)) await Brain.brainSetLLM(brain.hash, 'nexora', isOpening ? 'opening' : 'reply', message, reply, nexoraExtra);
    if (isOpening) {
      recordOpening(actorKey, openingProduct, extractOpeningSnippet(reply), { scenarioId: sc.id || null }).catch(() => {});
    }
    res.set('X-Brain-LLM', 'MISS');
    return res.json({ reply });

  } catch(err) {
    console.error('Nexora error:', err.message);
    return res.status(500).json({ error: 'Nexora unavailable' });
  }
});

app.post('/nexora/stream', requireProductAuth, async (req, res) => {
  try {
    const studentOk = await assertNexoraStudentAccess(req, res, req.body?.student);
    if (req.auth.role === 'student' && !studentOk) return;
    const ctx = await prepareNexoraRequest(req.body, req);
    const nexoraExtra = nexoraBrainExtra(ctx.student, req, `${ctx.scType || 'customer_service'}:${ctx.sc?.mood || 'normal'}`);
    const brain = await Brain.brainGetLLM('nexora', 'stream', req.body?.message, nexoraExtra);
    if (brain.hit) {
      const fixed = finishNexoraReply(brain.reply, ctx.p, ctx.scType);
      return Brain.writeBrainSSE(res, fixed);
    }
    await streamAnthropicSSE(res, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 320,
      system: ctx.systemPrompt + TUTOR_LATENCY_RULE + '\nNEVER cut off mid-sentence. Always finish the spoken line completely.',
      messages: ctx.msgs,
      brainMeta: { hash: brain.hash, tutor: 'nexora', intent: 'stream', message: req.body?.message, extra: nexoraExtra }
    });
  } catch (err) {
    console.error('Nexora stream error:', err.message);
    if (!res.headersSent) res.status(500).end(); else res.end();
  }
});

// ── NEXORA EVALUATION ─────────────────────────────────────────
app.post('/nexora-eval', requireProductAuth, async (req, res) => {
  try {
    let student = req.body?.student || null;
    if (req.auth.role === 'student') {
      student = await assertNexoraStudentAccess(req, res, student);
      if (!student) return;
    }
    const { transcript, scenario, profile, agentName, talkTime, holdEvents, transferred } = req.body || {};

    const evalPrompt = `You are evaluating a customer service call simulation.

Agent: ${agentName || 'Agent'}
Scenario: ${scenario?.title || 'Customer Service'} — ${scenario?.desc || ''}
Client: ${profile?.name || 'Client'} (mood: ${scenario?.mood || 'normal'})
Talk time: ${talkTime || 0} seconds
Hold events: ${JSON.stringify(holdEvents || [])}
Transferred to supervisor: ${transferred ? 'YES' : 'NO'}

Transcript:
${transcript || '(no transcript)'}

IMPORTANT: Do NOT penalize the agent for asking the client to repeat or clarify (e.g. "what did you say", "can you repeat", "sorry I didn't catch that") when the client's line was incomplete, inaudible, or cut off. That is valid professional recovery — not poor performance.

Respond ONLY with valid JSON, no markdown:
{
  "overall_score": 78,
  "client_satisfaction": 7.5,
  "wins": ["specific win 1", "specific win 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "connectors_used": ["however", "on top of that"],
  "connectors_missed": ["despite", "therefore"],
  "hold_feedback": "comment about hold usage if applicable",
  "transferred_feedback": "comment about supervisor transfer if applicable",
  "verdict": "Start by celebrating 1-2 specific things the agent did well. Be warm and specific. Then mention 1-2 concrete improvements. End with an encouraging line.",
  "practice_minutes": ${Math.ceil((talkTime || 60) / 60)}
}`;

    const resp = await claudeCall({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: 'You evaluate customer service call simulations. Respond ONLY with valid JSON. No markdown. No extra text.',
      messages: [{ role: 'user', content: evalPrompt }]
    });

    const text = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const ev = JSON.parse(clean);

    if (student?.id && req.auth.role === 'student') {
      InfinityVictory.recordNexoraSession(student, ev, {
        talkTime: talkTime || 0,
        transferred: !!transferred,
        scenarioTitle: scenario?.title || ''
      });
      SharedLearner.recordEvent(student, {
        source: 'nexora',
        kind: 'sim_eval',
        score: ev.overall_score != null ? ev.overall_score : null,
        topics: [].concat(ev.improvements || [], ev.connectors_missed || []).slice(0, 8),
        summary: String(ev.verdict || '').slice(0, 200)
      });
      await sbSet('infinity_students', student.id, student);
      ev.aliceVictory = student.aliceVictory;
      ev.sharedLearner = student.sharedLearner;
    }

    return res.json(ev);

  } catch(err) {
    console.error('Nexora eval error:', err.message);
    return res.status(500).json({ error: 'Evaluation failed' });
  }
});

// ── SUPER CEREBRO (inteligencia institucional — no chatbot) ──
app.get('/super-brain', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) {
      return res.status(503).json({ error: 'Super Brain disabled' });
    }
    return res.json(await SuperBrain.getFullSummary());
  } catch (err) {
    console.error('super-brain GET:', err.message);
    return res.status(500).json({ error: 'Super Brain unavailable' });
  }
});

app.get('/super-brain/greeting', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const founderName = req.query.name || req.auth?.name || 'Fundador';
    const result = await SuperBrain.greeting(founderName, claudeCall);
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: 'Greeting failed' });
  }
});

app.post('/super-brain/talk', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { message, founderName, force } = req.body || {};
    const tiktokUrls = TikTokJill.extractUrlsFromText(message);
    if (tiktokUrls.length) {
      const author = req.auth?.name || founderName || 'Fundador';
      const importResult = await TikTokJill.syncFromUrls(tiktokUrls, claudeCall, author, { force: !!force });
      const reply = `${importResult.message || `Importados: ${importResult.queued || 0}`}\n\nRevisá «Pendiente de publicar» → Publicar a tutores cuando esté bien.`;
      const state = await SuperBrain.loadState();
      const history = (state.talkHistory || []).slice(-48);
      history.push({ role: 'user', content: String(message || '').trim() });
      history.push({ role: 'assistant', content: reply });
      state.talkHistory = history;
      await SuperBrain.saveState(state);
      return res.json({
        ok: true,
        reply,
        brainCache: false,
        tiktokImport: importResult,
        stats: state.stats,
        sourcesUsed: { tiktok: tiktokUrls.length }
      });
    }
    const state = await SuperBrain.loadState();
    const result = await SuperBrain.talk(state, { message, founderName, claudeCall });
    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('super-brain talk:', err.message);
    return res.status(400).json({ error: err.message || 'Talk failed' });
  }
});

app.post('/super-brain/chat', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { message, founderName } = req.body || {};
    const state = await SuperBrain.loadState();
    const result = await SuperBrain.talk(state, { message, founderName, claudeCall });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Talk failed' });
  }
});

app.post('/super-brain/ingest', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { title, content, category, autoPublish } = req.body || {};
    const state = await SuperBrain.loadState();
    const result = await SuperBrain.ingest(state, {
      title,
      content,
      category,
      author: req.auth?.name || 'Fundador',
      autoPublish: !!autoPublish
    });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Ingest failed' });
  }
});

app.post('/super-brain/publish', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { pendingId, lessonId, title, content, category } = req.body || {};
    const state = await SuperBrain.loadState();
    if (pendingId) {
      const lesson = await SuperBrain.approvePending(state, pendingId);
      return res.json({ ok: true, lesson, published: true });
    }
    const lesson = await SuperBrain.publishKnowledge(state, {
      lessonId,
      title,
      content,
      category,
      author: req.auth?.name || 'Fundador'
    });
    return res.json({ ok: true, lesson, published: true });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Publish failed' });
  }
});

app.post('/super-brain/tts', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const { text } = req.body || {};
    return await synthesizeSpeech(req, res, {
      text,
      voiceId: SUPER_BRAIN_VOICE_ID,
      label: 'A.D.A.M.',
      stability: 0.42,
      similarityBoost: 0.82,
      style: 0.35
    });
  } catch (err) {
    return res.status(500).json({ error: 'TTS failed' });
  }
});

app.post('/super-brain/image', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (process.env.SUPER_BRAIN_IMAGES !== '1' || !openaiKey) {
      return res.status(503).json({
        error: 'not_configured',
        message: 'Imágenes desactivadas. En Render: OPENAI_API_KEY + SUPER_BRAIN_IMAGES=1'
      });
    }
    const { prompt } = req.body || {};
    if (!prompt || String(prompt).trim().length < 8) {
      return res.status(400).json({ error: 'Prompt too short' });
    }
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: String(prompt).slice(0, 900),
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
      })
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || 'OpenAI image error' });
    }
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: 'No image returned' });
    return res.json({ ok: true, imageB64: b64, mime: 'image/png' });
  } catch (err) {
    console.error('super-brain image:', err.message);
    return res.status(500).json({ error: 'Image generation failed' });
  }
});

app.post('/super-brain/approve', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { pendingId } = req.body || {};
    const state = await SuperBrain.loadState();
    const lesson = await SuperBrain.approvePending(state, pendingId);
    return res.json({ ok: true, lesson, published: true, message: 'Publicado en Nexus KB — Alice, Jill y Nexora lo reciben.' });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Could not approve' });
  }
});

app.post('/super-brain/reject', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { pendingId } = req.body || {};
    const state = await SuperBrain.loadState();
    await SuperBrain.rejectPending(state, pendingId);
    return res.json({ ok: true, pendingCount: state.pendingLessons.length });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Could not reject' });
  }
});

app.post('/super-brain/delete-lesson', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { lessonId } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });
    const state = await SuperBrain.loadState();
    const removed = await SuperBrain.deletePublishedLesson(state, lessonId);
    return res.json({ ok: true, removed: { id: removed.id, title: removed.title }, publishedCount: (state.lessons || []).filter(l => l.published).length });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Could not delete lesson' });
  }
});

app.post('/super-brain/purge-noise', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { dryRun } = req.body || {};
    const state = await SuperBrain.loadState();
    const result = await SuperBrain.purgeNoiseLessons(state, { dryRun: dryRun !== false });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Purge failed' });
  }
});

// ── TIKTOK → JILL (sync con revisión en pending) ─────────────
app.get('/super-brain/tiktok/status', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const syncState = await TikTokJill.loadSyncState();
    return res.json({ ok: true, ...TikTokJill.publicStatus(syncState) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'TikTok status failed' });
  }
});

app.get('/super-brain/tiktok/oauth/url', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const { url, state } = TikTokJill.buildOAuthUrl();
    return res.json({ ok: true, url, state });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'OAuth URL failed' });
  }
});

app.get('/super-brain/tiktok/oauth/callback', async (req, res) => {
  const { code, state, error, error_description: errDesc } = req.query || {};
  const failHtml = (msg) => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>TikTok · Infinity</title></head><body style="font-family:system-ui;padding:32px;max-width:480px;margin:auto;"><h2>TikTok — error</h2><p>${msg}</p><p>Cerrá esta ventana y volvé a A.D.A.M.</p></body></html>`;
  const okHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>TikTok conectado</title></head><body style="font-family:system-ui;padding:32px;max-width:480px;margin:auto;"><h2 style="color:#059669;">✓ TikTok conectado</h2><p>Tu cuenta quedó vinculada. Cerrá esta ventana y en A.D.A.M. tocá <strong>Sincronizar videos</strong>.</p><script>setTimeout(function(){window.close();},4000);</script></body></html>`;
  try {
    if (error) return res.status(400).send(failHtml(errDesc || error));
    if (!code || !state) return res.status(400).send(failHtml('Faltan parámetros OAuth.'));
    await TikTokJill.handleOAuthCallback(code, state);
    return res.send(okHtml);
  } catch (err) {
    console.error('tiktok oauth callback:', err.message);
    return res.status(400).send(failHtml(err.message || 'OAuth falló'));
  }
});

app.post('/super-brain/tiktok/sync', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const author = req.auth?.name || 'Fundador';
    const result = await TikTokJill.syncFromApi(claudeCall, author);
    return res.json({ ok: true, ...result, message: `Sync API: ${result.queued} nuevo(s) en pendiente de revisión.` });
  } catch (err) {
    console.error('tiktok sync:', err.message);
    return res.status(400).json({ error: err.message || 'Sync failed' });
  }
});

app.post('/super-brain/tiktok/sync-urls', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    if (!SuperBrain.isSuperBrainEnabled()) return res.status(503).json({ error: 'Super Brain disabled' });
    const { urls, force } = req.body || {};
    const author = req.auth?.name || 'Fundador';
    const result = await TikTokJill.syncFromUrls(urls, claudeCall, author, { force: !!force });
    return res.json({ ok: true, ...result, message: result.message || `Importados: ${result.queued} en pendiente de revisión.` });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Import failed' });
  }
});

app.post('/super-brain/tiktok/configure', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const { username } = req.body || {};
    const state = await TikTokJill.loadSyncState();
    if (username) state.username = String(username).replace(/^@/, '').slice(0, 64);
    await TikTokJill.saveSyncState(state);
    return res.json({ ok: true, ...TikTokJill.publicStatus(state) });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Configure failed' });
  }
});

// ── ANALYZE ──────────────────────────────────────────────────
app.post('/analyze', async (req, res) => {
  try {
    const { prompt, secret } = req.body || {};
    if (ANALYZE_SECRET && secret !== ANALYZE_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    let fullPrompt = prompt;
    if (SuperBrain.isSuperBrainEnabled()) {
      try {
        const ctx = await SuperBrain.buildContextBlock(String(prompt).slice(0, 500), 10);
        fullPrompt = `${ctx}\n\n---\n\n${prompt}`;
      } catch (e) {
        console.warn('analyze superBrain ctx:', e.message);
      }
    }
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: 1000,
      messages: [{ role:'user', content: fullPrompt }]
    });
    const text = resp.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    return res.json({ result: text, text });
  } catch(err) {
    return res.status(500).json({ error: 'Analyze no disponible.' });
  }
});

// ── SUPABASE MAINTENANCE ──────────────────────────────────────
app.post('/admin/prune-sessions', requireMasterOrAnalyzeSecret, async (req, res) => {
  try {
    const logDays = Math.max(30, Math.min(365, parseInt(req.body?.logDays, 10) || 120));
    const cacheDays = Math.max(3, Math.min(90, parseInt(req.body?.cacheDays, 10) || 14));
    const logCutoff = Date.now() - logDays * 86400000;
    const cacheCutoff = Date.now() - cacheDays * 86400000;
    const rows = await sbGet('infinity_sessions');
    let deleted = 0;
    for (const row of rows) {
      if (!row?.id || !row.data) continue;
      const ts = row.data.ts ? new Date(row.data.ts).getTime() : 0;
      if (!ts) continue;
      if (row.id.startsWith('LOG-') && ts < logCutoff) {
        if (await sbDelete('infinity_sessions', row.id)) deleted++;
      } else if (row.id.startsWith('ACACHE-') && ts < cacheCutoff) {
        if (await sbDelete('infinity_sessions', row.id)) deleted++;
      }
    }
    return res.json({ ok: true, deleted, logDays, cacheDays });
  } catch (err) {
    console.error('prune-sessions:', err.message);
    return res.status(500).json({ error: 'Prune failed' });
  }
});

// ── WHATSAPP WEBHOOK ──────────────────────────────────────────
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode']==='subscribe' && req.query['hub.verify_token']===VERIFY_TOKEN)
    return res.status(200).send(req.query['hub.challenge']);
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!entry?.messages?.length) return res.sendStatus(200);
    const msg = entry.messages[0];
    if (msg.type !== 'text') return res.sendStatus(200);
    const from = msg.from;
    const text = msg.text.body;

    const convRow = await sbGetOne('infinity_sessions', `WA-${from}`);
    let conv = convRow?.data || { history: [] };
    conv.history.push({ role:'user', content:text });
    if (conv.history.length > 20) conv.history = conv.history.slice(-20);

    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001', max_tokens: 300,
      system: `Eres Claire, asistente de Infinity Studio CR en WhatsApp. Cálida, breve, directa. Mensajes cortos — máximo 3 líneas. Si hay interés real en el programa, pedí nombre y horario preferido para la evaluación gratuita. WhatsApp: +506 6006 0981`,
      messages: conv.history.slice(-10)
    });
    const reply = resp.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    conv.history.push({ role:'assistant', content:reply });
    await sbSet('infinity_sessions', `WA-${from}`, conv);

    await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization:`Bearer ${WHATSAPP_TOKEN}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ messaging_product:'whatsapp', to:from, type:'text', text:{ body:reply } })
    });
    return res.sendStatus(200);
  } catch(err) {
    console.error('Webhook error:', err.message);
    return res.sendStatus(500);
  }
});

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS not allowed') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  // Pre-cache demo buffer audio (ElevenLabs only on miss — not on every visitor).
  setTimeout(() => {
    warmDemoBufferTts().catch((e) => console.warn('Demo TTS warm error:', e.message));
  }, 4000);
  const tiktokHours = parseInt(process.env.TIKTOK_SYNC_INTERVAL_HOURS || '0', 10);
  if (tiktokHours > 0 && TikTokJill.isConfigured()) {
    const ms = tiktokHours * 3600000;
    setTimeout(() => {
      TikTokJill.scheduledSyncIfDue(claudeCall).catch(() => {});
    }, 60000);
    setInterval(() => {
      TikTokJill.scheduledSyncIfDue(claudeCall).catch(() => {});
    }, ms);
    console.log(`TikTok → Jill auto-sync cada ${tiktokHours}h`);
  }
});
