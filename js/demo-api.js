var DEMO_BACKEND = 'https://alice-by-infinity.onrender.com';

var DEMO_LIMITS = {
  alice: { sessionsPerDay: 5, maxSteps: 4 },
  nexora: { sessionsPerDay: 5, maxSteps: 3 }
};

var localDemoSessions = {};

function demoGetConsent() {
  var el = document.getElementById('demo-consent');
  return el ? el.checked : false;
}

function demoTrack(event, label) {
  fetch(DEMO_BACKEND + '/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: event, label: label, ts: new Date().toISOString() })
  }).catch(function () {});
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function stripMd(text) {
  return String(text || '').replace(/\*\*/g, '');
}

function getLocalBuffer(service, scenario) {
  var buf = window.DEMO_BUFFER || {};
  if (service === 'alice') return buf.alice;
  if (service === 'nexora') {
    return scenario === 'customer_service' ? buf.nexora_cs : buf.nexora_star;
  }
  return null;
}

function getLocalIpBucket(service) {
  var key = 'infinity-demo-ip-' + service;
  try {
    var raw = localStorage.getItem(key);
    var data = raw ? JSON.parse(raw) : {};
    var day = todayKey();
    if (data.day !== day) return { day: day, sessions: 0, messages: 0 };
    return data;
  } catch (e) {
    return { day: todayKey(), sessions: 0, messages: 0 };
  }
}

function saveLocalIpBucket(service, bucket) {
  try {
    localStorage.setItem('infinity-demo-ip-' + service, JSON.stringify(bucket));
  } catch (e) {}
}

function checkLocalLimit(service, action) {
  var limits = DEMO_LIMITS[service] || DEMO_LIMITS.alice;
  var bucket = getLocalIpBucket(service);
  if (action === 'session') {
    if (bucket.sessions >= limits.sessionsPerDay) {
      return { ok: false, error: 'limit', message: 'Daily demo limit reached.', sessionsLeft: 0 };
    }
    bucket.sessions++;
  }
  if (action === 'message') bucket.messages = (bucket.messages || 0) + 1;
  saveLocalIpBucket(service, bucket);
  return {
    ok: true,
    sessionsLeft: Math.max(0, limits.sessionsPerDay - bucket.sessions)
  };
}

async function demoParseResponse(r) {
  var ct = (r.headers.get('content-type') || '').toLowerCase();
  var text = await r.text();
  if (ct.indexOf('application/json') >= 0 || (text.trim().charAt(0) === '{' || text.trim().charAt(0) === '[')) {
    try {
      return { ok: r.ok, status: r.status, data: JSON.parse(text), fromServer: true };
    } catch (e) {
      return { ok: false, status: r.status, error: 'invalid_json', message: 'Server returned invalid JSON.', fromServer: false };
    }
  }
  return {
    ok: false,
    status: r.status,
    error: 'html_response',
    message: r.status === 404
      ? 'Demo API not deployed yet — running local buffered mode.'
      : 'Demo server unavailable — running local buffered mode.',
    fromServer: false
  };
}

function demoStartLocal(service, scenario, name) {
  var limit = checkLocalLimit(service, 'session');
  if (!limit.ok) throw limit;

  var buf = getLocalBuffer(service, scenario);
  if (!buf) throw { message: 'Demo buffer missing on this page.' };

  var sessionId = 'local-' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  var reply = stripMd(buf.start);
  localDemoSessions[sessionId] = {
    service: service,
    scenario: scenario || (service === 'nexora' ? 'star' : 'default'),
    step: 0,
    name: name || 'Guest',
    history: [{ role: 'assistant', content: reply }]
  };

  return {
    sessionId: sessionId,
    reply: reply,
    step: 0,
    maxSteps: DEMO_LIMITS[service].maxSteps,
    buffered: true,
    local: true,
    sessionsLeft: limit.sessionsLeft
  };
}

function demoSendLocal(sessionId, message) {
  var session = localDemoSessions[sessionId];
  if (!session) throw { message: 'Session expired. Start a new demo.' };

  checkLocalLimit(session.service, 'message');
  var buf = getLocalBuffer(session.service, session.scenario);
  var maxSteps = DEMO_LIMITS[session.service].maxSteps;

  session.history.push({ role: 'user', content: message.trim() });
  session.step++;

  var reply;
  var done = session.step >= maxSteps;

  if (done) {
    reply = buf.finish.reply;
  } else {
    reply = stripMd(buf.steps[session.step - 1] || buf.steps[buf.steps.length - 1]);
  }

  session.history.push({ role: 'assistant', content: reply });

  var payload = { reply: reply, step: session.step, done: done, buffered: true, local: true, maxSteps: maxSteps };
  if (done) payload.evaluation = buf.finish.evaluation;
  return payload;
}

async function demoFetchStatus(service) {
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/status?service=' + encodeURIComponent(service));
    var parsed = await demoParseResponse(r);
    if (parsed.data && parsed.ok) return parsed.data;
  } catch (e) {}
  var limits = DEMO_LIMITS[service] || DEMO_LIMITS.alice;
  var bucket = getLocalIpBucket(service);
  return {
    sessionsLeft: Math.max(0, limits.sessionsPerDay - bucket.sessions),
    maxSteps: limits.maxSteps
  };
}

async function demoStart(service, scenario, name) {
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: service,
        scenario: scenario,
        consent: true,
        name: name || 'Guest'
      })
    });
    var parsed = await demoParseResponse(r);
    if (parsed.data && parsed.ok) return parsed.data;
    if (parsed.data && !parsed.ok) throw parsed.data;
  } catch (e) {
    if (e && e.error === 'limit') throw e;
  }
  return demoStartLocal(service, scenario, name);
}

async function demoSend(sessionId, message) {
  if (String(sessionId).indexOf('local-') === 0) {
    return demoSendLocal(sessionId, message);
  }

  try {
    var r = await fetch(DEMO_BACKEND + '/demo/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, message: message })
    });
    var parsed = await demoParseResponse(r);
    if (parsed.data && parsed.ok) return parsed.data;
    if (parsed.data && !parsed.ok) throw parsed.data;
  } catch (e) {
    if (e && e.error === 'limit') throw e;
  }

  throw { message: 'Connection issue — try again later.' };
}

function demoAddMsg(container, text, role, label) {
  if (!container) return;
  var wrap = document.createElement('div');
  wrap.className = 'demo-msg ' + (role === 'user' ? 'user' : 'assistant');
  wrap.innerHTML =
    '<div class="demo-msg-label">' + (label || (role === 'user' ? 'YOU' : 'AI')) + '</div>' +
    '<div class="demo-bubble">' + String(text).replace(/\n/g, '<br>') + '</div>';
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
}

function demoRenderEval(container, evaluation, service) {
  if (!evaluation || !container) return;
  var score = evaluation.overall_score != null ? evaluation.overall_score : '—';
  var wins = evaluation.wins || evaluation.highlights || [];
  var imps = evaluation.improvements || [];
  var verdict = evaluation.verdict || '';
  var html =
    '<div class="demo-eval">' +
    '<div class="demo-score">' + score + '<span style="font-size:14px;color:var(--t3);"> / 100</span></div>' +
    '<h3>Mini evaluation</h3>';
  if (wins.length) {
    html += '<p style="font-size:13px;font-weight:700;margin-top:8px;">Wins</p><ul>';
    wins.forEach(function (w) { html += '<li>' + w + '</li>'; });
    html += '</ul>';
  }
  if (imps.length) {
    html += '<p style="font-size:13px;font-weight:700;margin-top:8px;">Improve</p><ul>';
    imps.forEach(function (w) { html += '<li>' + w + '</li>'; });
    html += '</ul>';
  }
  if (evaluation.connectors_found && evaluation.connectors_found.length) {
    html += '<p style="font-size:12px;margin-top:8px;color:var(--purple);">Connectors detected: ' + evaluation.connectors_found.join(', ') + '</p>';
  }
  if (verdict) html += '<p style="font-size:13px;margin-top:10px;line-height:1.6;">' + verdict + '</p>';
  html +=
    '<a class="demo-cta-wa" href="https://wa.me/50660060981?text=' + encodeURIComponent('Hola! Completé el demo de ' + service + ' y quiero agendar mi evaluación gratuita') + '" target="_blank" rel="noopener">' +
    '<i class="ti ti-brand-whatsapp"></i> Agendar evaluación gratis</a></div>';
  container.innerHTML = html;
}

function demoWaCta(service) {
  return 'https://wa.me/50660060981?text=' + encodeURIComponent('Hola! Completé el demo de ' + service + ' en Off The Clock y quiero mi evaluación gratuita.');
}
