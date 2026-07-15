/**
 * Student QA battery — 7 rotation + 7 stress tests against production backend.
 * node tests/student-qa-battery.mjs
 */
const BACKEND = process.env.DEMO_BACKEND || 'https://alice-by-infinity.onrender.com';
const STUDENT = process.env.QA_STUDENT_NAME || 'QA-Estudiante';
const QA_SECRET = process.env.ANALYZE_SECRET || process.env.QA_SECRET || '';

function qaPayload(obj) {
  return Object.assign({}, obj, { qaLive: true, secret: QA_SECRET });
}

const ROTATION_PLAN = [
  { service: 'jill', scenario: 'default', label: 'Jill Foundations' },
  { service: 'alice', scenario: 'default', label: 'Alice Modo Tutor' },
  { service: 'nexora', scenario: 'star', label: 'Nexora STAR' },
  { service: 'nexora', scenario: 'customer_service', label: 'Nexora CS Call' },
  { service: 'jill', scenario: 'default', label: 'Jill rotation 2' },
  { service: 'alice', scenario: 'default', label: 'Alice rotation 2' },
  { service: 'nexora', scenario: 'star', label: 'Nexora lab stream+eval' }
];

const STUDENT_MSGS = {
  jill: [
    'Me llamo Ana y me cuesta hablar en pasado simple en reuniones.',
    'Ayer presenté un reporte pero me trabé cuando me preguntaron detalles.',
    'However, I think I need more practice because I forget linkers under pressure.',
    'Gracias Jill, quiero seguir practicando chunks y conectores esta semana.'
  ],
  alice: [
    'I work in customer success and lead a team of four people in San José.',
    'However, last month we had a deadline and the client changed the scope on top of that.',
    'Even though we were short staffed, we reprioritized and delivered the core features.',
    'I want to sound more confident when I explain trade-offs to international managers.'
  ],
  nexora_star: [
    'In my previous role I had a conflict with a teammate about project priorities and timelines.',
    'I set up a one-on-one, listened to their concerns, and we agreed on a shared plan with clear owners.',
    'We delivered on time and communication improved — our manager noted fewer escalations that quarter.'
  ],
  nexora_cs: [
    'I understand how frustrating this is, Maria. Let me pull up your account ACC-482910 right away.',
    'I see the $49.99 charge — it looks like a duplicate billing cycle. I am escalating a refund today.',
    'You will receive email confirmation within 24 hours. Is there anything else I can help you with today?'
  ]
};

const results = [];
const metrics = { rotation: [], stress: [], tts: [] };

function log(type, name, ok, detail) {
  results.push({ type, name, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + type + ' | ' + name + (detail ? ' — ' + detail : ''));
}

async function api(path, opts = {}) {
  const t0 = Date.now();
  const r = await fetch(BACKEND + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const ms = Date.now() - t0;
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data, ms, headers: r.headers };
}

function spanishRatio(text) {
  const t = String(text || '');
  const es = (t.match(/\b(el|la|los|las|que|de|en|y|por|con|me|te|se|es|un|una|gracias|hola|soy|estoy|practica|porque|sin|más|tu|mi|qué|cómo)\b/gi) || []).length;
  const en = (t.match(/\b(the|and|you|your|I|we|is|are|was|have|with|for|this|that|however|because)\b/gi) || []).length;
  return es / Math.max(1, es + en);
}

function englishRatio(text) {
  return 1 - spanishRatio(text);
}

function hasScore(evalObj) {
  return evalObj && typeof evalObj.overall_score === 'number' && evalObj.overall_score >= 0 && evalObj.overall_score <= 100;
}

function personaLeak(service, text) {
  const t = String(text || '').toLowerCase();
  const leaks = [];
  if (service === 'jill' && /\b(i am alice|i'm alice|soy alice|nexora simulator|customer service call)\b/.test(t)) leaks.push('jill-as-alice/nexora');
  if (service === 'alice' && /\b(i am jill|soy jill|star interview|maria santos)\b/.test(t)) leaks.push('alice-as-jill/nexora');
  if (service === 'nexora' && /\b(i am jill|i am alice|tutor|foundations tutor|nexus method tutor)\b/.test(t)) leaks.push('nexora-as-tutor');
  if (service === 'nexora' && /\b(patricia|sarah mitchell|linda)\b/.test(t) && !/\bmaria santos\b/.test(t)) leaks.push('random-name-leak');
  if (/\*(smil|nod|extend|warmly)\b/i.test(text)) leaks.push('stage-directions');
  return leaks;
}

async function parseStream(sessionId, message) {
  const t0 = Date.now();
  let firstTokenMs = null;
  let fullText = '';
  let meta = null;
  let evaluation = null;

  const r = await fetch(BACKEND + '/demo/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error('stream ' + r.status + ' ' + err.slice(0, 120));
  }

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
        if (evt.t) {
          if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
          fullText += evt.t;
        } else if (evt.token) {
          if (firstTokenMs === null) firstTokenMs = Date.now() - t0;
          fullText += evt.token;
        }
        if (evt.meta) meta = evt.meta;
        if (evt.evaluation) evaluation = evt.evaluation;
        if (evt.done === true) meta = Object.assign({}, meta || {}, { done: true });
        if (evt.error) throw new Error(evt.error);
      } catch (e) {
        if (e.message && e.message !== 'Unexpected end of JSON input') throw e;
      }
    }
  }
  return {
    fullText: fullText.trim(),
    meta,
    evaluation,
    totalMs: Date.now() - t0,
    firstTokenMs: firstTokenMs ?? Date.now() - t0
  };
}

async function runFullDemoSession(plan, roundIdx) {
  const msgsKey = plan.service === 'nexora'
    ? (plan.scenario === 'customer_service' ? 'nexora_cs' : 'nexora_star')
    : plan.service;
  const msgs = STUDENT_MSGS[msgsKey];

  const start = await api('/demo/start', {
    method: 'POST',
    body: JSON.stringify(qaPayload({
      service: plan.service,
      scenario: plan.scenario === 'default' ? undefined : plan.scenario,
      consent: true,
      name: STUDENT + '-' + roundIdx
    }))
  });

  if (!start.ok) throw new Error('start ' + start.status + ' ' + JSON.stringify(start.data).slice(0, 150));
  const { sessionId, reply, maxSteps, live, buffered, voiceProfile } = start.data;
  if (!live || buffered) throw new Error('not live session');
  if (!sessionId) throw new Error('no sessionId');

  const openingLeaks = personaLeak(plan.service, reply);
  const latencies = [{ phase: 'start', ms: start.ms, firstTokenMs: start.ms }];
  let lastReply = reply;
  let evaluation = null;
  let done = false;

  for (let i = 0; i < msgs.length; i++) {
    const stream = await parseStream(sessionId, msgs[i]);
    lastReply = stream.fullText;
    latencies.push({
      phase: 'turn' + (i + 1),
      ms: stream.totalMs,
      firstTokenMs: stream.firstTokenMs
    });
    if (stream.meta?.done) {
      done = true;
      evaluation = stream.evaluation;
      break;
    }
    if (i === msgs.length - 1 && !stream.meta?.done) {
      // one more if needed
      const extra = await parseStream(sessionId, 'One more short answer to finish the session please.');
      if (extra.meta?.done) {
        done = true;
        evaluation = extra.evaluation;
        lastReply = extra.fullText;
      }
    }
  }

  const langOk = plan.service === 'jill'
    ? spanishRatio(lastReply) >= 0.25 || spanishRatio(reply) >= 0.25
    : englishRatio(lastReply) >= 0.5;

  const leaks = [...openingLeaks, ...personaLeak(plan.service, lastReply)];
  const avgFirst = latencies.slice(1).reduce((a, b) => a + b.firstTokenMs, 0) / Math.max(1, latencies.length - 1);
  const avgTotal = latencies.slice(1).reduce((a, b) => a + b.ms, 0) / Math.max(1, latencies.length - 1);

  return {
    plan,
    sessionId,
    voiceProfile,
    maxSteps,
    done,
    evaluation,
    lastReply: lastReply.slice(0, 200),
    opening: reply.slice(0, 120),
    langOk,
    leaks,
    avgFirstTokenMs: Math.round(avgFirst),
    avgTotalMs: Math.round(avgTotal),
    replyLen: lastReply.length
  };
}

async function testNexoraLabEval(sessionId) {
  const ctx = {
    demoSessionId: sessionId,
    message: 'START_CALL',
    history: [],
    agentName: STUDENT,
    profile: { name: 'Maria Santos', firstName: 'Maria', account: 'ACC-482910' },
    scenario: { type: 'customer_service', title: 'Unrecognized charge', desc: 'Billing dispute', mood: 'frustrated' },
    accountContext: { name: 'Maria Santos', disputeAmount: '$49.99' }
  };

  const t0 = Date.now();
  const streamR = await fetch(BACKEND + '/demo/nexora-lab/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ctx)
  });
  let openText = '';
  if (streamR.ok) {
    const reader = streamR.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      for (const line of buf.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.t) openText += evt.t;
        } catch {}
      }
    }
  }
  const streamMs = Date.now() - t0;

  const agentReply = 'I understand your frustration Maria. I reviewed account ACC-482910 and I will reverse the $49.99 charge within 24 hours.';
  const t1 = Date.now();
  const stream2 = await fetch(BACKEND + '/demo/nexora-lab/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...ctx,
      message: agentReply,
      history: [
        { role: 'assistant', content: openText || 'Hello, this is Maria Santos calling about a charge.' },
        { role: 'user', content: agentReply }
      ]
    })
  });
  await stream2.text();
  const turnMs = Date.now() - t1;

  const transcript = `Agent: ${agentReply}\nClient: ${openText}`;
  const evalR = await api('/demo/nexora-lab/eval', {
    method: 'POST',
    body: JSON.stringify({
      demoSessionId: sessionId,
      transcript,
      scenario: ctx.scenario,
      profile: ctx.profile,
      agentName: STUDENT,
      talkTime: 95,
      holdEvents: [],
      transferred: false
    })
  });

  return {
    streamMs,
    turnMs,
    openText: openText.slice(0, 120),
    evalOk: evalR.ok && hasScore(evalR.data),
    score: evalR.data?.overall_score,
    evalData: evalR.data
  };
}

async function testTTS(voiceId, text, label) {
  const t0 = Date.now();
  const r = await fetch(BACKEND + '/demo/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  });
  const ms = Date.now() - t0;
  const ct = r.headers.get('content-type') || '';
  const buf = await r.arrayBuffer();
  return { label, ok: r.ok && buf.byteLength > 500, ms, bytes: buf.byteLength, ct, status: r.status };
}

async function rotationRound(i, plan) {
  const name = `R${i + 1} ${plan.label}`;
  try {
    if (plan.label.includes('lab stream')) {
      const start = await api('/demo/start', {
        method: 'POST',
        body: JSON.stringify(qaPayload({ service: 'nexora', scenario: 'customer_service', consent: true, name: STUDENT + '-lab' }))
      });
      if (!start.ok) throw new Error('start failed');
      const lab = await testNexoraLabEval(start.data.sessionId);
      const ok = lab.evalOk && lab.openText.length > 10 && lab.streamMs < 45000;
      log('ROTATION', name, ok, `score=${lab.score} stream=${lab.streamMs}ms turn=${lab.turnMs}ms open="${lab.openText.slice(0, 60)}"`);
      metrics.rotation.push({ name, ok, ...lab });
      return;
    }

    const session = await runFullDemoSession(plan, i + 1);
    const scoreOk = session.done && hasScore(session.evaluation);
    const logicOk = session.replyLen >= 40 && session.leaks.length === 0;
    const speedOk = session.avgFirstTokenMs < 12000 && session.avgTotalMs < 35000;
    const ok = session.langOk && scoreOk && logicOk && speedOk;
    log('ROTATION', name, ok,
      `score=${session.evaluation?.overall_score} lang=${session.langOk} leaks=${session.leaks.join('|') || 'none'} 1st=${session.avgFirstTokenMs}ms total=${session.avgTotalMs}ms voice=${session.voiceProfile?.voiceId?.slice(0, 8)}`);
    metrics.rotation.push({ name, ok, ...session });
  } catch (e) {
    log('ROTATION', name, false, e.message);
    metrics.rotation.push({ name, ok: false, error: e.message });
  }
}

async function stressRound(i) {
  const name = `S${i + 1}`;
  try {
    if (i === 0) {
      const parallel = await Promise.all(['jill', 'alice', 'nexora'].map(s =>
        api('/demo/start', { method: 'POST', body: JSON.stringify(qaPayload({ service: s, consent: true, name: STUDENT + '-p' + s, scenario: s === 'nexora' ? 'star' : undefined })) })
      ));
      const ok = parallel.every(p => p.ok && p.data.live);
      log('STRESS', name + ' parallel starts', ok, parallel.map(p => p.status).join(','));
      return;
    }
    if (i === 1) {
      const start = await api('/demo/start', { method: 'POST', body: JSON.stringify(qaPayload({ service: 'alice', consent: true, name: STUDENT + '-rapid' })) });
      const sid = start.data.sessionId;
      const outs = [];
      for (let j = 0; j < 3; j++) {
        outs.push(await parseStream(sid, `Rapid message ${j + 1}: I work in ops and need clearer English under pressure.`));
      }
      const ok = outs.every(o => o.fullText.length > 20);
      log('STRESS', name + ' rapid 3-turn burst', ok, `lens=${outs.map(o => o.fullText.length).join(',')}`);
      return;
    }
    if (i === 2) {
      const start = await api('/demo/start', { method: 'POST', body: JSON.stringify(qaPayload({ service: 'jill', consent: true, name: STUDENT + '-empty' })) });
      const bad = await api('/demo/stream', { method: 'POST', body: JSON.stringify({ sessionId: start.data.sessionId, message: '   ' }) });
      const ok = bad.status === 400 || bad.status === 422;
      log('STRESS', name + ' empty message rejected', ok, 'status=' + bad.status);
      return;
    }
    if (i === 3) {
      const start = await api('/demo/start', { method: 'POST', body: JSON.stringify(qaPayload({ service: 'alice', consent: true, name: STUDENT + '-long' })) });
      const longMsg = 'I work in international logistics and yesterday I had to explain a delay to a client however the warehouse team did not update the system on top of that the carrier changed the route even though we had promised delivery by Friday therefore I needed to reset expectations while keeping trust and I used connectors like however on top of that and even though but I still felt my pacing was too slow when the client pushed back.';
      const stream = await parseStream(start.data.sessionId, longMsg);
      const ok = stream.fullText.length > 30 && stream.totalMs < 45000;
      log('STRESS', name + ' long input handled', ok, `${stream.totalMs}ms len=${stream.fullText.length}`);
      return;
    }
    if (i === 4) {
      const voices = await api('/demo/voices');
      const v = voices.data;
      const ttsResults = await Promise.all([
        testTTS(v.jill.voiceId, 'Hola, soy Jill. Practiquemos chunks y linkers sin presión.', 'Jill TTS'),
        testTTS(v.alice.voiceId, 'Hi, I am Alice. Let us practice operational English together.', 'Alice TTS'),
        testTTS(v.nexora_star.voiceId, 'Tell me about a time you handled a difficult situation at work.', 'Nexora TTS')
      ]);
      const ok = ttsResults.every(t => t.ok);
      log('STRESS', name + ' triple TTS', ok, ttsResults.map(t => `${t.label}:${t.bytes}b/${t.ms}ms`).join(' | '));
      metrics.tts.push(...ttsResults);
      return;
    }
    if (i === 5) {
      const start = await api('/demo/start', { method: 'POST', body: JSON.stringify(qaPayload({ service: 'nexora', scenario: 'customer_service', consent: true, name: STUDENT + '-nxstress' })) });
      const turns = [];
      for (let t = 0; t < 4; t++) {
        turns.push(testNexoraLabEval(start.data.sessionId));
      }
      const outs = await Promise.all(turns);
      const ok = outs.filter(o => o.evalOk).length >= 2;
      log('STRESS', name + ' nexora lab 4x parallel eval', ok, outs.map(o => o.score).join(','));
      return;
    }
    if (i === 6) {
      const chain = [];
      for (const svc of ['jill', 'alice', 'nexora']) {
        chain.push(runFullDemoSession({ service: svc, scenario: svc === 'nexora' ? 'star' : 'default', label: svc }, 90 + i));
      }
      const sessions = await Promise.all(chain);
      const ok = sessions.every(s => s.done && hasScore(s.evaluation) && s.leaks.length === 0);
      log('STRESS', name + ' 3 full sessions concurrent', ok, sessions.map(s => s.evaluation?.overall_score).join(','));
      return;
    }
  } catch (e) {
    log('STRESS', name, false, e.message);
  }
}

async function main() {
  console.log('\n=== STUDENT QA BATTERY — ' + BACKEND + ' ===\n');
  if (!QA_SECRET) {
    console.error('FAIL: Set ANALYZE_SECRET or QA_SECRET env var (must match backend Render).');
    process.exit(1);
  }
  const health = await api('/health');
  log('PREFLIGHT', 'health', health.ok, JSON.stringify(health.data));

  console.log('\n--- 7 ROTATION TESTS (student persona) ---\n');
  for (let i = 0; i < ROTATION_PLAN.length; i++) {
    await rotationRound(i, ROTATION_PLAN[i]);
  }

  console.log('\n--- 7 STRESS TESTS ---\n');
  for (let i = 0; i < 7; i++) {
    await stressRound(i);
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  console.log('\n=== SUMMARY ===');
  console.log(`${passed}/${results.length} checks passed`);
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) console.log(' - ' + f.type + ' | ' + f.name + ': ' + f.detail);
  }

  const rotOk = metrics.rotation.filter(r => r.ok).length;
  console.log(`\nRotation sessions OK: ${rotOk}/${metrics.rotation.length}`);
  if (metrics.rotation.length) {
    const avgFirst = Math.round(metrics.rotation.filter(r => r.avgFirstTokenMs).reduce((a, b) => a + b.avgFirstTokenMs, 0) / Math.max(1, metrics.rotation.filter(r => r.avgFirstTokenMs).length));
    const avgTotal = Math.round(metrics.rotation.filter(r => r.avgTotalMs).reduce((a, b) => a + b.avgTotalMs, 0) / Math.max(1, metrics.rotation.filter(r => r.avgTotalMs).length));
    console.log(`Avg first token: ${avgFirst}ms | Avg turn total: ${avgTotal}ms`);
  }

  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
