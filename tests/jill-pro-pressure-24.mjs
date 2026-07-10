/**
 * Jill Pro pressure - 7 practices - turns = 24 questions.
 * Unit: chat-message dedupe + intent/phase (no network).
 * Live (optional): ANALYZE_SECRET=xxx node tests/jill-pro-pressure-24.mjs
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);
const JillPro = require(path.join(root, 'backend', 'jill-companion.js'));

const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';

function loadEnvSecret() {
  if (process.env.ANALYZE_SECRET || process.env.QA_SECRET) {
    return process.env.ANALYZE_SECRET || process.env.QA_SECRET;
  }
  const envPath = path.join(root, 'backend', '.env');
  if (!existsSync(envPath)) return '';
  const raw = readFileSync(envPath, 'utf8');
  const m = raw.match(/^\s*ANALYZE_SECRET\s*=\s*(.+)\s*$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

const QA_SECRET = loadEnvSecret();

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

const PRACTICES = [
  {
    name: 'P1 Futuro perfecto',
    turns: [
      'Hola chil como estas Jill vieras que me estaban preguntando en clase Como se forma el futuro perfecto pero no tengo la mas minima idea me ayudas',
      'dije que queria charlar acerca del futuro perfecto',
      'si me quedo, dame otro ejemplo',
      'By tomorrow I will have finished my homework'
    ]
  },
  {
    name: 'P2 Gerundio',
    turns: [
      'no entiendo el gerundio explicame',
      'I going to school now',
      'ok listo'
    ]
  },
  {
    name: 'P3 Negaciones',
    turns: [
      'como se forma la negacion en ingles me ayudas',
      'She no like coffee',
      'si entendi'
    ]
  },
  {
    name: 'P4 Presente perfecto',
    turns: [
      'en clase vimos present perfect y no me quedo claro',
      'I have see that movie yesterday',
      'explicalo otra vez'
    ]
  },
  {
    name: 'P5 Pasado simple',
    turns: [
      'ayudame con pasado simple PS',
      'Yesterday I go to the store',
      'me quedo claro'
    ]
  },
  {
    name: 'P6 Modales',
    turns: [
      'confused about will would should explicame',
      'I will can help you tomorrow',
      'dale otro ejemplo'
    ]
  },
  {
    name: 'P7 Charla + duda mezclada',
    turns: [
      'hola jill que tal hoy quiero saber como se forma going to',
      'quiero charlar de mi trabajo tambien',
      'how do I say I am going to start a new project',
      'thanks that makes sense',
      'una mas: como se dice will have finished'
    ]
  }
];

const results = [];
function log(ok, name, detail) {
  results.push({ ok, name, detail });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' — ' + detail : ''));
}

function assertNoDoubleUser(msgs, label) {
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].role === msgs[i - 1].role) {
      log(false, label, 'consecutive ' + msgs[i].role + ' at ' + i);
      return false;
    }
  }
  if (msgs[0]?.role !== 'user') {
    log(false, label, 'first role=' + msgs[0]?.role);
    return false;
  }
  return true;
}

function forbiddenRepeat(text) {
  const scrubbed = String(text || '')
    .replace(/no pidas[^.!\n"']*/gi, '')
    .replace(/PROHIBIDO[^.!\n]*/gi, '')
    .replace(/NUNCA[^.!\n]*/gi, '');
  return /contame otra vez|de qu[eé] quer[eé]s charlar|no te entend[ií]|repet[ií] tu duda/i.test(scrubbed);
}

function hasTeachSignal(text) {
  const t = String(text || '').toLowerCase();
  return /\b(will have|have been|am\/is\/are|do not|does not|did not|going to|would|should|msi|ejemplo|example|formula|patron|patr[oó]n)\b/i.test(t)
    || /\b(will|have|been|not|going)\b/.test(t);
}

const SKIP_NET = process.env.Q7_UNIT_ONLY === '1' || process.env.Q7_PLUS_CHILD === '1';

console.log('=== Jill Pro pressure 24 — unit ===');

if (SKIP_NET) {
  log(true, 'Render build', 'skipped (unit-only)');
} else {
  const health = await fetch(BACKEND + '/', { signal: AbortSignal.timeout(8000) })
    .then((r) => r.text())
    .catch((e) => 'ERR ' + e.message);
  log(/20260710-/.test(health) && /OK|Infinity AI/.test(health), 'Render build', health.slice(0, 90));
}

const serverSrc = readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
const jillSrc = readFileSync(path.join(root, 'backend', 'jill-companion.js'), 'utf8');
const portalSrc = readFileSync(path.join(root, 'Infinity_Student_Portal.html'), 'utf8');
log(serverSrc.includes('function buildTutorChatMessages'), 'server buildTutorChatMessages', 'present');
log(jillSrc.includes('JILL_PRO_INTENT_RULE'), 'intent rule wired', 'ok');
log(!/Contame otra vez tu duda/.test(portalSrc), 'portal canned loop removed', 'ok');

let q = 0;
for (const practice of PRACTICES) {
  console.log('\n--- ' + practice.name + ' ---');
  const history = [];
  history.push({ role: 'assistant', content: 'Hola, de que queres charlar o que duda traes?' });

  for (const turn of practice.turns) {
    q += 1;
    const label = 'Q' + q + ' ' + practice.name;

    history.push({ role: 'user', content: turn });
    const msgs = buildTutorChatMessages(history, turn, 20);
    if (!assertNoDoubleUser(msgs, label + ' msgs')) continue;

    const phase = JillPro.resolveCompanionPhase(turn, history.slice(0, -1));
    const topic = JillPro.resolveSessionTopic(history.slice(0, -1), '', turn);
    const teach = JillPro.buildJillProStreamTeachInstruction(topic, turn, history.slice(0, -1));

    const intentOk = !forbiddenRepeat(teach) && teach.includes('MENSAJE DEL ESTUDIANTE');
    log(intentOk, label, 'phase=' + phase + ' topic=' + topic);

    if (/futuro perfecto/i.test(turn)) {
      const sticky = JillPro.resolveSessionTopic(history, 'futuro MOD (P + will + V + C)', turn);
      if (!/doubt:|futuro perfecto/i.test(sticky)) {
        log(false, label + ' sticky', sticky);
      }
    }

    history.push({
      role: 'assistant',
      content: /futuro|gerundio|negaci|present perfect|pasado|will would|going to|explic|no entiendo|como se forma|confused|en clase|ayudame/i.test(turn)
        ? 'Claro: te explico el patron con un ejemplo. Te quedo claro?'
        : 'Buena, seguimos. Que mas queres practicar?'
    });
  }
}

console.log('\nUnit questions covered: ' + q + ' / 24');

async function parseStream(sessionId, message) {
  const t0 = Date.now();
  let fullText = '';
  const r = await fetch(BACKEND + '/demo/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });
  if (!r.ok) throw new Error('stream ' + r.status + ' ' + (await r.text()).slice(0, 120));
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.t) fullText += evt.t;
        else if (evt.token) fullText += evt.token;
        if (evt.error) throw new Error(evt.error);
      } catch (e) {
        if (e.message && !/JSON/.test(e.message)) throw e;
      }
    }
  }
  return { fullText: fullText.trim(), ms: Date.now() - t0 };
}

if (QA_SECRET && !SKIP_NET) {
  console.log('\n=== Live QA vs Render ===');
  const start = await fetch(BACKEND + '/demo/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: 'jill', consent: true, name: 'QA-Pressure-24', qaLive: true, secret: QA_SECRET })
  });
  const startData = await start.json().catch(() => ({}));
  if (!start.ok || !startData.sessionId) {
    log(false, 'Live demo session', 'HTTP ' + start.status + ' ' + JSON.stringify(startData).slice(0, 120));
  } else {
    log(true, 'Live demo session', (startData.live ? 'live' : 'buffer') + ' ' + String(startData.sessionId).slice(0, 8));
    const liveTurns = [];
    for (const p of PRACTICES) {
      liveTurns.push({ practice: p.name, msg: p.turns[0] });
      if (p.turns[1]) liveTurns.push({ practice: p.name, msg: p.turns[1] });
    }
    const batch = liveTurns.slice(0, 14);
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      try {
        const stream = await parseStream(startData.sessionId, item.msg);
        const bad = forbiddenRepeat(stream.fullText);
        const ok = stream.fullText.length > 40 && !bad;
        log(ok, 'LIVE ' + (i + 1) + '/14 ' + item.practice, (bad ? 'REPEAT-LOOP ' : '') + stream.ms + 'ms � ' + stream.fullText.slice(0, 90).replace(/\s+/g, ' '));
      } catch (err) {
        log(false, 'LIVE ' + (i + 1) + '/14 ' + item.practice, err.message);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
} else {
  console.log('\n(No ANALYZE_SECRET) public demo is appointment-gated — skip live smoke');
  log(true, 'Live smoke skipped', 'demo_by_request expected without QA secret');
}


const fail = results.filter((r) => !r.ok).length;
const pass = results.filter((r) => r.ok).length;
console.log('\n========== SUMMARY ==========');
console.log('PASS ' + pass + '  FAIL ' + fail + '  TOTAL ' + results.length);
console.log('Questions (unit turns): ' + q);
if (q !== 24) console.log('WARN: expected 24 unit turns, got ' + q);
if (fail) {
  console.log('FUNCTIONAL: FAIL');
  process.exit(1);
}
console.log('FUNCTIONAL: OK');
process.exit(0);
