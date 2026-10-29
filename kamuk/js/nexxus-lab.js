/**
 * NeXxus lab shell — Kamuk.
 * Same cycle as a simulation lab: program, floor, speak, listen, transcript, next.
 * Storage keys are nexxus_* only. No Infinity auth, no shared lab runtime.
 */
(function (global) {
  'use strict';

  var RUNTIME_KEY = 'nexxus_lab_runtime';
  var SID_KEY = 'nexxus_student_id';
  var NAME_KEY = 'nexxus_student_name';
  var KAMUK_SID = /^KAM-[A-Za-z0-9-]+$/;

  var state = {
    sid: '',
    name: '',
    blocked: '',
    index: 0,
    transcript: [],
    listening: false,
    speaking: false,
    recog: null,
    floor: false
  };

  function $(id) { return document.getElementById(id); }

  function scenes() {
    var program = global.NEXXUS_PROGRAM;
    if (!program || !Array.isArray(program.scenes)) return [];
    return program.scenes.filter(function (scene) { return scene && typeof scene === 'object'; });
  }

  function current() {
    var list = scenes();
    if (!list.length) return null;
    if (state.index < 0 || state.index >= list.length) state.index = 0;
    return list[state.index];
  }

  function textOf(scene, key) {
    if (!scene || scene[key] == null) return '';
    return String(scene[key]).trim();
  }

  function setStatus(message) {
    var el = $('nxu-status');
    if (el) el.textContent = message || '';
  }

  function persist() {
    try {
      sessionStorage.setItem(RUNTIME_KEY, JSON.stringify({
        sid: state.sid,
        name: state.name,
        index: state.index,
        transcript: state.transcript,
        floor: state.floor,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }

  function restore() {
    try {
      var raw = sessionStorage.getItem(RUNTIME_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || saved.sid !== state.sid) return;
      state.index = Number(saved.index) || 0;
      state.transcript = Array.isArray(saved.transcript) ? saved.transcript : [];
      state.floor = !!saved.floor;
    } catch (e) {}
  }

  function stopSpeech() {
    if (global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) {}
    }
    state.speaking = false;
  }

  function speak(line, onEnd) {
    stopSpeech();
    var clean = String(line || '').trim();
    if (!clean || !global.speechSynthesis) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    var utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-US';
    utter.rate = 0.96;
    var voices = global.speechSynthesis.getVoices() || [];
    var pick = voices.filter(function (voice) { return /^en/i.test(voice.lang); })[0];
    if (pick) utter.voice = pick;
    utter.onend = function () {
      state.speaking = false;
      if (typeof onEnd === 'function') onEnd();
    };
    utter.onerror = function () {
      state.speaking = false;
      if (typeof onEnd === 'function') onEnd();
    };
    state.speaking = true;
    global.speechSynthesis.speak(utter);
  }

  function stopListen() {
    state.listening = false;
    var mic = $('nxu-mic');
    if (mic) {
      mic.classList.remove('on');
      mic.disabled = !current();
      mic.textContent = 'Hablar';
    }
    if (state.recog) {
      try { state.recog.onresult = null; state.recog.onend = null; state.recog.stop(); } catch (e) {}
      state.recog = null;
    }
  }

  function pushLine(who, text) {
    var line = String(text || '').trim();
    if (!line) return;
    state.transcript.push({ who: who, text: line, at: new Date().toISOString() });
    renderTranscript();
    persist();
  }

  function renderTranscript() {
    var box = $('nxu-transcript');
    if (!box) return;
    if (!state.transcript.length) {
      box.innerHTML = '<p class="empty">La transcripción aparece acá cuando haya una escena y alguien hable.</p>';
      return;
    }
    box.innerHTML = state.transcript.map(function (line) {
      var who = line.who === 'student' ? 'Vos' : 'Escena';
      return '<p><b>' + who + '</b> ' + escapeHtml(line.text) + '</p>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  function renderRail() {
    var rail = $('nxu-scenes');
    if (!rail) return;
    var list = scenes();
    if (!list.length) {
      rail.innerHTML = '<p class="empty">Sin escenarios. El programa está vacío a propósito.</p>';
      return;
    }
    rail.innerHTML = list.map(function (scene, index) {
      var title = textOf(scene, 'title') || ('Escena ' + (index + 1));
      return '<button type="button" class="' + (index === state.index ? 'on' : '') + '" data-index="' + index + '">'
        + '<span>' + (index + 1) + '</span>' + escapeHtml(title) + '</button>';
    }).join('');
    Array.prototype.forEach.call(rail.querySelectorAll('button'), function (button) {
      button.onclick = function () { select(Number(button.getAttribute('data-index'))); };
    });
  }

  function renderStage() {
    var scene = current();
    var count = $('nxu-count');
    var title = $('nxu-title');
    var role = $('nxu-role');
    var prompt = $('nxu-prompt');
    var goal = $('nxu-goal');
    var mic = $('nxu-mic');
    var next = $('nxu-next');
    var hear = $('nxu-hear');
    var list = scenes();
    if (count) count.textContent = list.length ? ((state.index + 1) + ' / ' + list.length) : '0 escenas';
    if (!scene) {
      if (title) title.textContent = 'Lab listo';
      if (role) role.textContent = '';
      if (prompt) prompt.textContent = 'NeXxus ya tiene el piso: programa, voz, micrófono y transcripción. Falta el programa de escenarios.';
      if (goal) goal.textContent = '';
      if (mic) mic.disabled = true;
      if (next) next.disabled = true;
      if (hear) hear.disabled = true;
      setStatus('Esperando escenarios.');
      return;
    }
    if (title) title.textContent = textOf(scene, 'title') || ('Escena ' + (state.index + 1));
    if (role) role.textContent = textOf(scene, 'role');
    if (prompt) prompt.textContent = textOf(scene, 'prompt') || 'Esta escena no trae línea todavía.';
    if (goal) goal.textContent = textOf(scene, 'goal') || textOf(scene, 'cue');
    if (mic) mic.disabled = false;
    if (hear) hear.disabled = !textOf(scene, 'prompt');
    if (next) next.disabled = list.length < 2;
    setStatus('Escena cargada. Podés escucharla y responder.');
  }

  function showFloor() {
    state.floor = true;
    if ($('nxu-lobby')) $('nxu-lobby').hidden = true;
    if ($('nxu-floor')) $('nxu-floor').hidden = false;
    renderRail();
    renderStage();
    renderTranscript();
    persist();
  }

  function select(index) {
    var list = scenes();
    if (!list.length) return;
    stopListen();
    stopSpeech();
    state.index = Math.max(0, Math.min(list.length - 1, index));
    renderRail();
    renderStage();
    persist();
  }

  function hearScene() {
    var scene = current();
    var line = textOf(scene, 'prompt');
    if (!line) {
      setStatus('Esta escena no tiene línea para leer.');
      return;
    }
    setStatus('Leyendo la escena…');
    pushLine('scene', line);
    speak(line, function () { setStatus('Tu turno. Tocá Hablar.'); });
  }

  function startListen() {
    if (state.speaking || !current()) return;
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) {
      setStatus('Este navegador no reconoce voz. Usá Chrome o Edge.');
      return;
    }
    stopListen();
    var recog = new SR();
    state.recog = recog;
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.continuous = false;
    var mic = $('nxu-mic');
    if (mic) {
      mic.classList.add('on');
      mic.textContent = 'Escuchando…';
    }
    state.listening = true;
    setStatus('Escuchando.');
    recog.onresult = function (event) {
      var said = '';
      for (var i = 0; i < event.results.length; i++) said += event.results[i][0].transcript;
      if (said.trim()) pushLine('student', said.trim());
    };
    recog.onerror = function () {
      stopListen();
      setStatus('No se escuchó. Tocá Hablar otra vez.');
    };
    recog.onend = function () {
      stopListen();
      if (state.transcript.length) setStatus('Quedó en la transcripción.');
    };
    try { recog.start(); } catch (e) {
      stopListen();
      setStatus('No se pudo abrir el micrófono.');
    }
  }

  function nextScene() {
    var list = scenes();
    if (list.length < 2) return;
    select((state.index + 1) % list.length);
  }

  function bind() {
    if ($('nxu-enter')) $('nxu-enter').onclick = showFloor;
    if ($('nxu-hear')) $('nxu-hear').onclick = hearScene;
    if ($('nxu-mic')) $('nxu-mic').onclick = function () {
      if (state.listening) { stopListen(); setStatus('Micrófono detenido.'); return; }
      startListen();
    };
    if ($('nxu-next')) $('nxu-next').onclick = nextScene;
    if (global.speechSynthesis) {
      global.speechSynthesis.getVoices();
      global.speechSynthesis.onvoiceschanged = function () { global.speechSynthesis.getVoices(); };
    }
  }

  function boot() {
    var params = new URLSearchParams(global.location.search);
    var fromUrl = String(params.get('sid') || '').trim();
    if (/^IS-/i.test(fromUrl)) {
      state.blocked = 'infinity';
    } else if (fromUrl && !KAMUK_SID.test(fromUrl)) {
      state.blocked = 'id';
    } else if (KAMUK_SID.test(fromUrl)) {
      state.sid = fromUrl;
    } else {
      try {
        var stored = localStorage.getItem(SID_KEY) || '';
        if (KAMUK_SID.test(stored)) state.sid = stored;
      } catch (e) {}
    }
    try {
      state.name = localStorage.getItem(NAME_KEY) || '';
    } catch (e2) {}
    if (state.sid) {
      try { localStorage.setItem(SID_KEY, state.sid); } catch (e3) {}
    }

    var gate = $('nxu-gate');
    var lobby = $('nxu-lobby');
    if (state.blocked === 'infinity' || state.blocked === 'id') {
      if (gate) gate.hidden = false;
      if (lobby) lobby.hidden = true;
      return;
    }
    if (!state.sid) {
      if ($('nxu-need-portal')) $('nxu-need-portal').hidden = false;
      if ($('nxu-enter')) $('nxu-enter').disabled = true;
    } else {
      if ($('nxu-who')) $('nxu-who').textContent = state.name ? (state.name + ' · ' + state.sid) : state.sid;
      restore();
    }
    bind();
    if (state.floor && state.sid) showFloor();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
