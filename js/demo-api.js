var DEMO_BACKEND = 'https://alice-by-infinity.onrender.com';

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

async function demoFetchStatus(service) {
  try {
    var r = await fetch(DEMO_BACKEND + '/demo/status?service=' + encodeURIComponent(service));
    return await r.json();
  } catch (e) {
    return { sessionsLeft: 5, maxSteps: 4 };
  }
}

async function demoStart(service, scenario, name) {
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
  var d = await r.json();
  if (!r.ok) throw d;
  return d;
}

async function demoSend(sessionId, message) {
  var r = await fetch(DEMO_BACKEND + '/demo/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sessionId, message: message })
  });
  var d = await r.json();
  if (!r.ok) throw d;
  return d;
}

function demoAddMsg(container, text, role, label) {
  if (!container) return;
  var wrap = document.createElement('div');
  wrap.className = 'demo-msg ' + (role === 'user' ? 'user' : 'assistant');
  wrap.innerHTML =
    '<div class="demo-msg-label">' + (label || (role === 'user' ? 'YOU' : 'AI')) + '</div>' +
    '<div class="demo-bubble">' + text.replace(/\n/g, '<br>') + '</div>';
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
