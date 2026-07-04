var DEMO_BACKEND = 'https://alice-by-infinity.onrender.com';

var DEMO_LIMITS = {
  alice: { sessionsPerDay: 1, maxSteps: 4, messagesPerDay: 12 },
  jill: { sessionsPerDay: 1, maxSteps: 4, messagesPerDay: 12 },
  nexora: { sessionsPerDay: 1, maxSteps: 3, messagesPerDay: 50 }
};

var localDemoSessions = {};
var demoWhitelisted = false;
var demoMyIp = null;
var DEMO_OWNER_IPS = ['38.210.166.95'];

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
  if (service === 'alice' && scenario === 'companion') return buf.alice_companion || buf.alice;
  if (service === 'alice') return buf.alice;
  if (service === 'jill') return buf.jill;
  if (service === 'nexora') {
    return scenario === 'customer_service' ? buf.nexora_cs : buf.nexora_star;
  }
  return null;
}

function localBufferMaxSteps(buf) {
  if (!buf || !buf.steps || !buf.steps.length) return 4;
  return buf.steps.length + 1;
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
  if (demoWhitelisted) {
    return { ok: true, sessionsLeft: 999, whitelisted: true };
  }
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
      ? 'Live demo API not available — try again in a moment.'
      : 'Live demo server unavailable — try again in a moment.',
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

  var maxSteps = localBufferMaxSteps(buf);
  localDemoSessions[sessionId].maxSteps = maxSteps;

  return {
    sessionId: sessionId,
    reply: reply,
    step: 0,
    maxSteps: maxSteps,
    buffered: true,
    live: false,
    local: true,
    sessionsLeft: limit.sessionsLeft,
    voiceProfile: typeof demoVoiceProfile === 'function' ? demoVoiceProfile(service, scenario) : null
  };
}

function demoSendLocal(sessionId, message) {
  var session = localDemoSessions[sessionId];
  if (!session) throw { message: 'Session expired. Start a new demo.' };

  checkLocalLimit(session.service, 'message');
  var buf = getLocalBuffer(session.service, session.scenario);
  var maxSteps = session.maxSteps || localBufferMaxSteps(buf);

  session.history.push({ role: 'user', content: message.trim() });
  session.step++;

  var reply;
  var done = session.step >= maxSteps;
  var evaluation = null;

  if (done) {
    reply = stripMd(buf.finish.reply);
    evaluation = buf.finish.evaluation;
  } else {
    reply = stripMd(buf.steps[session.step - 1] || buf.steps[buf.steps.length - 1]);
  }

  session.history.push({ role: 'assistant', content: reply });

  var payload = {
    reply: reply,
    step: session.step,
    done: done,
    buffered: true,
    live: false,
    local: true,
    maxSteps: maxSteps
  };
  if (done && evaluation) payload.evaluation = evaluation;
  return payload;
}

async function demoFetchMyIp() {
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/my-ip');
    var parsed = await demoParseResponse(r);
    if (parsed.data) {
      demoMyIp = parsed.data.ip || null;
      demoWhitelisted = !!parsed.data.whitelisted;
      if (demoWhitelisted) return parsed.data;
    }
  } catch (e) {}
  if (!demoWhitelisted) {
    try {
      var ipR = await fetch('https://api.ipify.org?format=json');
      var ipData = await ipR.json();
      if (ipData && ipData.ip && DEMO_OWNER_IPS.indexOf(ipData.ip) >= 0) {
        demoMyIp = ipData.ip;
        demoWhitelisted = true;
        try {
          await fetch(DEMO_BACKEND + '/demo/reset-limits', { method: 'POST' });
        } catch (e2) {}
        return { ip: ipData.ip, whitelisted: true, demoLimitPerService: 999 };
      }
    } catch (e2) {}
  }
  return null;
}

async function demoFetchStatus(service) {
  if (demoWhitelisted) {
    var wl = DEMO_LIMITS[service] || DEMO_LIMITS.alice;
    return { service: service, sessionsUsed: 0, sessionsLeft: 999, maxSteps: wl.maxSteps, whitelisted: true };
  }
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/status?service=' + encodeURIComponent(service));
    var parsed = await demoParseResponse(r);
    if (parsed.data && parsed.ok) {
      if (parsed.data.whitelisted) demoWhitelisted = true;
      return parsed.data;
    }
  } catch (e) {}
  var limits = DEMO_LIMITS[service] || DEMO_LIMITS.alice;
  var bucket = getLocalIpBucket(service);
  return {
    sessionsLeft: Math.max(0, limits.sessionsPerDay - bucket.sessions),
    maxSteps: limits.maxSteps
  };
}

function demoCanUseLocalFallback(service, scenario) {
  return !!getLocalBuffer(service, scenario);
}

function demoPremiumFields() {
  if (typeof AliceBilling !== 'undefined' && AliceBilling.payload) {
    return AliceBilling.payload();
  }
  try {
    var t = localStorage.getItem('alice_premium_token');
    return t ? { premiumToken: t } : {};
  } catch (e) {
    return {};
  }
}

async function demoStart(service, scenario, name, onboarding) {
  await demoFetchMyIp();
  var premium = demoPremiumFields();
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: service,
        scenario: scenario,
        consent: true,
        name: name || 'Guest',
        onboarding: onboarding || null,
        premiumToken: premium.premiumToken
      })
    });
    var parsed = await demoParseResponse(r);
    if (parsed.data && parsed.ok) return parsed.data;
    if (parsed.data && !parsed.ok) {
      if (parsed.data.error === 'limit' || parsed.status === 429) {
        if (demoWhitelisted) {
          try {
            await fetch(DEMO_BACKEND + '/demo/reset-limits', { method: 'POST' });
            var r2 = await fetch(DEMO_BACKEND + '/demo/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ service: service, scenario: scenario, consent: true, name: name || 'Guest' })
            });
            var parsed2 = await demoParseResponse(r2);
            if (parsed2.data && parsed2.ok) return parsed2.data;
          } catch (e2) {}
          if (demoCanUseLocalFallback(service, scenario)) {
            return demoStartLocal(service, scenario, name);
          }
        }
        throw parsed.data;
      }
      if (parsed.data.error === 'Invalid service' && demoCanUseLocalFallback(service, scenario)) {
        return demoStartLocal(service, scenario, name);
      }
      throw { message: parsed.data.message || parsed.data.error || 'Live demo unavailable.' };
    }
    if (!parsed.fromServer && demoCanUseLocalFallback(service, scenario)) {
      return demoStartLocal(service, scenario, name);
    }
  } catch (e) {
    if (e && e.error === 'limit') {
      if (demoWhitelisted && demoCanUseLocalFallback(service, scenario)) {
        return demoStartLocal(service, scenario, name);
      }
      throw e;
    }
    if (e && e.message) throw e;
  }
  if (demoCanUseLocalFallback(service, scenario)) {
    return demoStartLocal(service, scenario, name);
  }
  throw { message: 'Live demo unavailable. Check your connection and try again.' };
}

async function demoSend(sessionId, message) {
  if (String(sessionId).indexOf('local-') === 0) {
    return demoSendLocal(sessionId, message);
  }

  try {
    var r = await fetch(DEMO_BACKEND + '/demo/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ sessionId: sessionId, message: message }, demoPremiumFields()))
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
  return 'https://wa.me/50660060981?text=' + encodeURIComponent('Hola! Completé el demo de ' + service + ' en Infinity Studio CR y quiero mi evaluación gratuita.');
}
