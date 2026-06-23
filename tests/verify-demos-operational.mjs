/**
 * Verifica que el stack de demos (caratula + Jill/Alice/Nexora live + IP limit) responde.
 * node tests/verify-demos-operational.mjs
 */
const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';

const checks = [];
const pass = (n, d) => checks.push({ ok: true, n, d });
const fail = (n, d) => checks.push({ ok: false, n, d });

async function j(path, opts) {
  const r = await fetch(BACKEND + path, opts);
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

async function main() {
  try {
    const health = await j('/health');
    if (health.ok && health.data?.ok) pass('GET /health', JSON.stringify(health.data).slice(0, 120));
    else fail('GET /health', health.status + ' ' + String(health.data).slice(0, 80));
  } catch (e) {
    fail('GET /health', e.message);
  }

  for (const route of ['/demo/voices', '/demo/my-ip', '/demo/status?service=jill']) {
    try {
      const r = await j(route);
      if (r.ok) pass(route, 'OK');
      else fail(route, r.status);
    } catch (e) {
      fail(route, e.message);
    }
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.SKIP_LIVE_DEMO) {
    pass('POST /demo/start (live)', 'skipped — set SKIP_LIVE_DEMO=0 + ANTHROPIC on server to test live');
  } else {
    try {
      const r = await j('/demo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'jill', consent: true, name: 'VerifyBot' })
      });
      if (r.ok && r.data?.sessionId && r.data?.reply) {
        pass('POST /demo/start jill', 'live session ' + r.data.sessionId.slice(0, 8));
      } else if (r.status === 429) {
        pass('POST /demo/start jill', 'limit OK (IP gate works)');
      } else if (r.status === 503) {
        fail('POST /demo/start jill', 'live_unavailable — ANTHROPIC_API_KEY missing on Render');
      } else {
        fail('POST /demo/start jill', r.status + ' ' + JSON.stringify(r.data).slice(0, 100));
      }
    } catch (e) {
      fail('POST /demo/start jill', e.message);
    }
  }

  const fs = await import('fs');
  const path = await import('path');
  const root = path.join(import.meta.dirname, '..');
  for (const f of ['try-demo.html', 'try-jill.html', 'try-alice.html', 'try-nexora.html', 'nexora.html', 'js/demo-stream.js', 'js/demo-api.js']) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) pass('file ' + f, 'present');
    else fail('file ' + f, 'MISSING');
  }

  const alice = fs.readFileSync(path.join(root, 'try-alice.html'), 'utf8');
  if (alice.includes('demo-stream.js') && alice.includes('demoStreamSend')) pass('try-alice live stream', 'wired');
  else fail('try-alice live stream', 'still buffered — missing demoStreamSend');

  const nex = fs.readFileSync(path.join(root, 'nexora.html'), 'utf8');
  if (nex.includes('isNexoraPublicDemo') && nex.includes('/demo/nexora-lab/stream')) pass('nexora public demo', 'wired');
  else fail('nexora public demo', 'missing demo lab stream path');

  console.log('\n=== Demo operational verify ===\n');
  for (const c of checks) console.log((c.ok ? 'PASS' : 'FAIL') + ' | ' + c.n + (c.d ? ' — ' + c.d : ''));
  const bad = checks.filter(c => !c.ok);
  console.log('\n' + checks.length + ' checks | ' + bad.length + ' failed\n');
  process.exit(bad.length ? 1 : 0);
}

main();
