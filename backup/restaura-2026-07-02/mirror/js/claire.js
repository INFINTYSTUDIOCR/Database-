var CLAIRE_BACKEND = 'https://alice-by-infinity.onrender.com';
var _ch = [], _open = false, _started = false, _count = 0, _LIMIT = 20;
var _mic = null, _micOn = false;

function toggleClaire() {
  _open = !_open;
  document.getElementById('cw').style.display = _open ? 'block' : 'none';
  if (_open && !_started){ startClaire(); trackClaireEvent("claire_opened","widget"); }
  if (!_open && window._ca) window._ca.pause();
}

async function startClaire() {
  _started = true;
  showTyping(true);
  try {
    var r = await fetch(CLAIRE_BACKEND + '/claire', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({mode:'start'})
    });
    var d = await r.json();
    showTyping(false);
    addMsg(d.reply, 'c');
    speak(d.reply);
    _ch.push({role:'assistant', content:d.reply});
  } catch(e) {
    showTyping(false);
    addMsg('¡Hola! Soy Claire de Infinity Studio CR. ¿En qué puedo ayudarte? 😊', 'c');
  }
}

var _sending = false;

function trackClaireEvent(action, label){
  if(typeof gtag !== 'undefined'){
    gtag('event', action, { event_category:'Claire', event_label:label });
  }
  fetch('https://alice-by-infinity.onrender.com/track', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({event:action, label:label, ts:new Date().toISOString()})
  }).catch(function(){});
}

async function sendClaire() {
  if(_sending) return;
  var inp = document.getElementById('ci');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  _sending = true;
  setTimeout(function(){ _sending = false; }, 1000);
  if (_count >= _LIMIT) { showLimit(); return; }
  inp.value = '';
  addMsg(txt, 'u');
  _ch.push({role:'user', content:txt});
  _count++;
  updateCount();
  if (_count === 17) setTimeout(function(){ addMsg('💡 Nos quedan pocos mensajes — si querés continuar, agendá tu evaluación gratuita cuando quieras.', 'c'); }, 300);
  if (_count >= _LIMIT) { setTimeout(showLimit, 600); return; }
  showTyping(true);
  try {
    var r = await fetch(CLAIRE_BACKEND + '/claire', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({mode:'chat', message:txt, history:_ch.slice(-12)})
    });
    var d = await r.json();
    showTyping(false);
    addMsg(d.reply, 'c');
    speak(d.reply);
    _ch.push({role:'assistant', content:d.reply});
  } catch(e) {
    showTyping(false);
    addMsg('Disculpá, hubo un problema. Escribinos al WhatsApp: +506 6006 0981', 'c');
  }
}

function speak(text) {
  var clean = text.replace(/[*_#<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,400);
  if (clean.length < 5) return;
  fetch(CLAIRE_BACKEND + '/claire-tts', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({text:clean})
  }).then(function(r){ return r.ok ? r.blob() : null; })
  .then(function(b){
    if (!b) return;
    if (window._ca) window._ca.pause();
    window._ca = new Audio(URL.createObjectURL(b));
    window._ca.play();
  }).catch(function(){});
}

function toggleMic() {
  if (_micOn) { stopMic(); return; }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Usá Chrome para el micrófono'); return; }
  if (window._ca) window._ca.pause();
  _mic = new SR();
  _mic.lang = 'es-CR'; _mic.interimResults = true; _mic.continuous = false;
  _micOn = true;
  var btn = document.getElementById('cmb');
  if (btn) { btn.style.background='rgba(239,68,68,0.2)'; btn.style.borderColor='#EF4444'; }
  var vi = document.getElementById('cvi');
  if (vi) vi.style.display = 'flex';
  _mic.onresult = function(e) {
    var t = Array.from(e.results).map(function(r){ return r[0].transcript; }).join('');
    var inp = document.getElementById('ci');
    if (inp) inp.value = t;
  };
  _mic.onend = function() {
    stopMic();
    var inp = document.getElementById('ci');
    if (inp && inp.value.trim()) sendClaire();
  };
  _mic.onerror = function() { stopMic(); };
  _mic.start();
}

function stopMic() {
  if (_mic) { try { _mic.stop(); } catch(e){} }
  _micOn = false;
  var btn = document.getElementById('cmb');
  if (btn) { btn.style.background='rgba(91,33,182,0.08)'; btn.style.borderColor='rgba(91,33,182,0.2)'; }
  var vi = document.getElementById('cvi');
  if (vi) vi.style.display = 'none';
}

function addMsg(text, from) {
  var msgs = document.getElementById('cm');
  if (!msgs) return;
  var isC = from === 'c';
  var d = document.createElement('div');
  d.style.cssText = 'display:flex;flex-direction:column;align-items:'+(isC?'flex-start':'flex-end')+';margin-bottom:10px;';
  d.innerHTML = (isC ? '<div style="font-size:10px;font-weight:700;color:#5B21B6;margin-bottom:3px;letter-spacing:0.05em;">CLAIRE</div>' : '')
    + '<div style="max-width:88%;background:'+(isC?'white':'#5B21B6')+';color:'+(isC?'#1E1E2E':'white')
    + ';border-radius:'+(isC?'4px 14px 14px 14px':'14px 4px 14px 14px')
    + ';padding:10px 14px;font-size:13px;line-height:1.7;box-shadow:0 2px 8px rgba(0,0,0,0.06);">'
    + text + '</div>';
  msgs.appendChild(d);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping(show) {
  var el = document.getElementById('ct');
  if (el) el.style.display = show ? 'block' : 'none';
}

function updateCount() {
  var el = document.getElementById('cc');
  if (!el) return;
  var rem = _LIMIT - _count;
  el.textContent = rem <= 5 && rem > 0 ? rem + ' mensaje' + (rem===1?'':'s') + ' restante' + (rem===1?'':'s') : '';
  if (rem <= 5) el.style.color = '#F5A623';
}

function showLimit() {
  var inp = document.getElementById('ci');
  if (inp) { inp.disabled = true; inp.placeholder = 'Sesión completada ✓'; inp.style.background='#F4F6FB'; }
  var cmb = document.getElementById('cmb');
  if (cmb) cmb.disabled = true;
  if (window._ca) window._ca.pause();
  trackClaireEvent('claire_limit_reached','20_messages');
  addMsg('¡Fue un gusto hablar con vos! Agendá tu evaluación gratuita por WhatsApp cuando quieras.', 'c');
}

window.addEventListener('beforeunload', function(){ if(window._ca) window._ca.pause(); });
document.addEventListener('visibilitychange', function(){ if(document.hidden && window._ca) window._ca.pause(); });
