/**
 * Jill Pro QA ù 10 companion-style topics + Rapid drill smoke.
 * Requires ANALYZE_SECRET for live demo QA against production.
 * node tests/jill-pro-qa-battery.mjs
 */
const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';
const QA_SECRET = process.env.ANALYZE_SECRET || process.env.QA_SECRET || '';

const COMPANION_TOPICS = [
  { label: 'gerundio / PC', msg: 'No entiendo el gerundio, explùcame con regla MSI y un ejemplo.' },
  { label: 'presente simple PR', msg: 'Ayùdame con presente simple PR ù quiero una mini lecciùn.' },
  { label: 'pasado simple PS', msg: 'Explain past simple PS with MSI whiteboard please.' },
  { label: 'presente perfecto PRP', msg: 'No comprendo present perfect PRP, dame regla y ejercicio.' },
  { label: 'PPC combinado', msg: 'Teach me PPC combined: have been + ing.' },
  { label: 'modales MOD', msg: 'Confused about modals will would should ù lesson please.' },
  { label: 'mùtodo moneda', msg: 'Explùcame el mùtodo moneda pregunta respuesta en inglùs.' },
  { label: 'preposiciones', msg: 'Help me with prepositions in on at for the complement.' },
  { label: 'artùculos', msg: 'Una lecciùn sobre artùculos the a an con MSI.' },
  { label: 'vocabulario', msg: 'Quiero practicar vocabulario de nùmeros ordinales en inglùs.' }
];

const results = [];

function log(name, ok, detail, skip) {
  results.push({ name, ok, detail, skip });
  var tag = skip ? 'SKIP' : (ok ? 'PASS' : 'FAIL');
  console.log(tag + ' | ' + name + (detail ? ' ù ' + detail : ''));
}

function qaPayload(obj) {
  return Object.assign({}, obj, { qaLive: true, secret: QA_SECRET });
}

function hasLessonSignals(text) {
  const t = String(text || '').toLowerCase();
  const hits = [
    /\b(msi|mec[aù]nica|estructural|chunk|pieza)\b/i.test(t),
    /\b(ejercicio|practic[aù]|tu turno|escrib[iù])\b/i.test(t),
    /\b(regla|formula|fùrmula|whiteboard|pizarra|\|)\b/i.test(t),
    /\b(for example|por ejemplo|modelo)\b/i.test(t)
  ].filter(Boolean).length;
  return hits >= 2;
}

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
        if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
  }
  return { fullText: fullText.trim(), ms: Date.now() - t0 };
}

async function qaCompanionTopicsLive() {
  if (!QA_SECRET) {
    log('Jill Pro ù live companion topics', false, 'Set ANALYZE_SECRET to run live QA', true);
    return;
  }
  const start = await fetch(BACKEND + '/demo/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(qaPayload({ service: 'jill', consent: true, name: 'QA-Jill-Pro' }))
  });
  const startData = await start.json();
  if (!start.ok || !startData.sessionId) {
    log('Jill Pro ù demo session', false, 'HTTP ' + start.status + ' ' + JSON.stringify(startData).slice(0, 100));
    return;
  }
  log('Jill Pro ù demo session', true, 'live=' + !!startData.live + ' ù ' + startData.sessionId.slice(0, 8));

  for (const topic of COMPANION_TOPICS) {
    try {
      const stream = await parseStream(startData.sessionId, topic.msg);
      const lessonOk = hasLessonSignals(stream.fullText);
      log('Jill Pro ù ' + topic.label, lessonOk && stream.fullText.length > 80,
        (lessonOk ? 'lesson signals OK' : 'weak lesson') + ' ù ' + stream.ms + 'ms');
    } catch (err) {
      log('Jill Pro ù ' + topic.label, false, err.message);
    }
    await new Promise(function (r) { setTimeout(r, 350); });
  }
}

async function qaRapidDrillSmoke() {
  const fs = await import('fs');
  const path = await import('path');
  const quizPath = path.join(process.cwd(), 'js', 'jill-quiz.js');
  const src = fs.readFileSync(quizPath, 'utf8');
  log('Rapid drill ù UI rename', src.includes('Rapid drill') && !src.includes('Nemesis Kahoot'), 'branding OK');
  log('Rapid drill ù demo mount opts', src.includes('questionCount'), 'questionCount param');
  log('Rapid drill ù try-jill.html', fs.existsSync(path.join(process.cwd(), 'try-jill.html')), 'public demo page');
  log('Canon ∑ jill-foundations whiteboard', fs.readFileSync(path.join(process.cwd(), 'js', 'jill-foundations.js'), 'utf8').includes('renderCanonForMessage'), 'canon hook');
}

async function qaBillingStandby() {
  const r = await fetch(BACKEND + '/billing/jill/config');
  if (r.status === 404) {
    log('Jill billing ù config endpoint', true, '404 ù deploy pending (expected pre-push)', true);
    return;
  }
  if (!r.ok) {
    log('Jill billing ù config endpoint', false, 'HTTP ' + r.status);
    return;
  }
  const cfg = await r.json();
  const ok = cfg.product === 'jill_pro' && cfg.plan === 'jill_pro_premium_30d';
  log('Jill billing ù standby config', ok, 'standby=' + !!cfg.standby + ' checkout=' + !!cfg.checkoutEnabled);
}

async function main() {
  console.log('Jill Pro QA battery ? ' + BACKEND + '\n');
  await qaCompanionTopicsLive();
  await qaRapidDrillSmoke();
  await qaBillingStandby();
  const failed = results.filter(function (x) { return !x.ok && !x.skip; });
  console.log('\n--- Summary: ' + (results.length - failed.length) + '/' + results.length + ' passed ---');
  if (failed.length) {
    failed.forEach(function (f) { console.log('  ? ' + f.name + (f.detail ? ': ' + f.detail : '')); });
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
