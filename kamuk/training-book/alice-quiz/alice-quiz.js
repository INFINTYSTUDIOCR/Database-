/**
 * Alice Interactive Quiz — Kamuk
 * Alice plays a role in English, listens, corrects each answer, and grades at the end.
 * Separate from Companion / Jill / Claire.
 */
(function (global) {
  'use strict';

  var BACKEND = 'https://alice-by-infinity.onrender.com';
  var ALICE_VOICE = 'r1KmysJdVYZjJCm4mL3b';
  var MIC_IDLE = '🎤 Hablar';

  var TURNS = [];
  var STORAGE_KEY = 'kamuk_alice_quiz';

  var state = { i: 0, scores: [], listening: false, speaking: false, done: false, recog: null, audio: null };

  function $(id) { return document.getElementById(id); }

  function norm(t) {
    return String(t || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9'\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scoreTurn(heard, turn) {
    var h = norm(heard);
    if (!h || h.length < 4) return { pct: 0, missing: turn.need.slice() };
    var hit = 0;
    var missing = [];
    turn.anyOf.forEach(function (group, idx) {
      var ok = group.some(function (kw) { return h.indexOf(norm(kw)) >= 0; });
      if (ok) hit++;
      else missing.push(turn.need[idx] || ('part ' + (idx + 1)));
    });
    var polite = /\b(please|thank|of course|certainly|sure|happy to)\b/.test(h) ? 8 : 0;
    var englishBias = /\b(the|you|your|i|we|would|could|will|can)\b/.test(h) ? 5 : 0;
    var pct = Math.min(100, Math.round((hit / turn.anyOf.length) * 87) + polite + englishBias);
    return { pct: pct, missing: missing };
  }

  function stopAudio() {
    if (state.audio) {
      try { state.audio.pause(); } catch (e) {}
      state.audio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    state.speaking = false;
  }

  function browserSpeak(text, onEnd) {
    if (!window.speechSynthesis) {
      state.speaking = false;
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.96;
    u.pitch = 1.02;
    var voices = window.speechSynthesis.getVoices() || [];
    var pick = voices.find(function (v) {
      return /en-?us/i.test(v.lang) && /zira|samantha|jenny|aria|female|google us english/i.test(v.name);
    }) || voices.find(function (v) { return /^en/i.test(v.lang); });
    if (pick) u.voice = pick;
    u.onend = function () { state.speaking = false; if (typeof onEnd === 'function') onEnd(); };
    u.onerror = function () { state.speaking = false; if (typeof onEnd === 'function') onEnd(); };
    state.speaking = true;
    window.speechSynthesis.speak(u);
  }

  function aliceSpeak(text, onEnd) {
    stopAudio();
    var clean = String(text || '').trim();
    if (!clean) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    state.speaking = true;
    fetch(BACKEND + '/demo/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice: 'alice', product: 'alice', voiceId: ALICE_VOICE })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('tts');
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.indexOf('audio') < 0) throw new Error('not_audio');
        return r.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = new Audio(url);
        state.audio = a;
        a.onended = function () {
          state.speaking = false;
          state.audio = null;
          try { URL.revokeObjectURL(url); } catch (e) {}
          if (typeof onEnd === 'function') onEnd();
        };
        a.onerror = function () { browserSpeak(clean, onEnd); };
        return a.play();
      })
      .catch(function () { browserSpeak(clean, onEnd); });
  }

  function resetMicButton() {
    var btn = $('aq-mic');
    if (btn) {
      btn.classList.remove('listening');
      btn.textContent = MIC_IDLE;
    }
  }

  function stopListen() {
    state.listening = false;
    resetMicButton();
    if (state.recog) {
      try { state.recog.onresult = null; state.recog.onend = null; state.recog.stop(); } catch (e) {}
      state.recog = null;
    }
  }

  function setStatus(t) {
    var el = $('aq-status');
    if (el) el.textContent = t || '';
  }

  function renderTurn() {
    var turn = TURNS[state.i];
    var evalBox = $('aq-eval');
    if (evalBox) { evalBox.className = 'aq-eval'; evalBox.innerHTML = ''; }
    if ($('aq-heard')) $('aq-heard').textContent = '';
    if ($('aq-feedback')) { $('aq-feedback').className = 'aq-feedback'; $('aq-feedback').textContent = ''; }
    if ($('aq-step')) $('aq-step').textContent = 'Turno ' + (state.i + 1) + ' / ' + TURNS.length;
    if ($('aq-role')) $('aq-role').textContent = turn ? turn.role : '';
    if ($('aq-alice')) $('aq-alice').textContent = turn ? turn.alice : '';
    if ($('aq-mic')) $('aq-mic').disabled = !turn || state.done;
    if ($('aq-next')) $('aq-next').disabled = true;
    setStatus(turn ? 'Alice está hablando…' : '');
  }

  function playCurrent() {
    var turn = TURNS[state.i];
    if (!turn) return;
    renderTurn();
    aliceSpeak(turn.alice, function () {
      setStatus('Tu turno: respondé en inglés. Tocá Hablar.');
    });
  }

  function feedbackFor(sc, turn) {
    if (sc.pct >= 80) {
      return { ok: true, text: 'Good answer. ' + (sc.pct >= 92 ? 'Very professional.' : 'Small polish: be a little more specific.') };
    }
    if (sc.pct >= 55) {
      return { ok: false, text: 'Almost. You missed: ' + sc.missing.join(', ') + '. Tip: ' + turn.tip + ' Try again.' };
    }
    return { ok: false, text: 'Let\'s fix that. ' + turn.tip + ' You could say: ' + turn.model };
  }

  function onHeard(text) {
    stopListen();
    var turn = TURNS[state.i];
    if (!turn) return;
    if ($('aq-heard')) $('aq-heard').textContent = 'Vos dijiste: “' + text + '”';
    var sc = scoreTurn(text, turn);
    state.scores[state.i] = sc;
    var fb = feedbackFor(sc, turn);
    var fbEl = $('aq-feedback');
    if (fbEl) {
      fbEl.className = 'aq-feedback ' + (fb.ok ? 'ok' : 'fix');
      fbEl.textContent = 'Alice: ' + fb.text;
    }
    aliceSpeak(fb.text, function () {
      setStatus(fb.ok ? 'Bien. Tocá Siguiente turno.' : 'Podés intentar de nuevo con Hablar, o seguir con Siguiente.');
      if ($('aq-next')) $('aq-next').disabled = false;
    });
  }

  function startListen() {
    if (state.speaking || state.done) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus('Este navegador no soporta reconocimiento de voz. Usá Chrome o Edge.');
      return;
    }
    stopListen();
    var recog = new SR();
    state.recog = recog;
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;
    var finalText = '';
    var btn = $('aq-mic');
    if (btn) {
      btn.classList.add('listening');
      btn.textContent = '● Escuchando…';
    }
    state.listening = true;
    setStatus('Escuchando… respondé en inglés.');
    recog.onresult = function (ev) {
      var chunk = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript + ' ';
      }
      if ($('aq-heard')) $('aq-heard').textContent = 'Escuchando: “' + (finalText || chunk).trim() + '”';
    };
    recog.onerror = function () {
      stopListen();
      setStatus('No se escuchó bien. Tocá Hablar de nuevo.');
    };
    recog.onend = function () {
      state.listening = false;
      state.recog = null;
      resetMicButton();
      var t = finalText.trim();
      if (t) onHeard(t);
      else setStatus('No capturé audio. Tocá Hablar otra vez.');
    };
    try { recog.start(); } catch (e) {
      stopListen();
      setStatus('No se pudo abrir el micrófono.');
    }
  }

  function finalEval() {
    state.done = true;
    stopListen();
    stopAudio();
    var total = 0;
    TURNS.forEach(function (t, idx) { total += (state.scores[idx] && state.scores[idx].pct) || 0; });
    var avg = TURNS.length ? Math.round(total / TURNS.length) : 0;
    var pass = avg >= 80;
    var weak = [];
    TURNS.forEach(function (t, idx) {
      var s = state.scores[idx];
      if (!s || s.pct < 80) weak.push(t.label);
    });
    var lines = pass
      ? 'Final evaluation: ' + avg + ' out of 100. Clear, polite and complete answers. Well done.'
      : 'Final evaluation: ' + avg + ' out of 100. Keep practicing: ' + (weak.join(', ') || 'clarity') + '. Try the quiz again.';
    var box = $('aq-eval');
    if (box) {
      box.className = 'aq-eval ' + (pass ? 'ok' : 'bad');
      box.innerHTML = '<strong>Evaluación final de Alice</strong><br>' + lines
        + '<br><span style="font-weight:600;opacity:.85;">Detalle: '
        + TURNS.map(function (t, i) {
          var s = state.scores[i];
          return t.label + ' ' + ((s && s.pct) || 0) + '%';
        }).join(' · ')
        + '</span>';
    }
    setStatus(pass ? 'Aprobado (mínimo 80%).' : 'No aprobado todavía — mínimo 80%.');
    if ($('aq-mic')) $('aq-mic').disabled = true;
    if ($('aq-next')) $('aq-next').disabled = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        avg: avg, pass: pass, scores: TURNS.map(function (t, i) { return (state.scores[i] && state.scores[i].pct) || 0; }), at: new Date().toISOString()
      }));
    } catch (e) {}
    aliceSpeak(lines, function () {});
  }

  function nextTurn() {
    if (state.i >= TURNS.length - 1) {
      finalEval();
      return;
    }
    state.i++;
    playCurrent();
  }

  function start() {
    stopListen();
    stopAudio();
    state.i = 0;
    state.scores = [];
    state.done = false;
    if ($('aq-start')) $('aq-start').textContent = 'Reiniciar quiz';
    playCurrent();
  }

  function mount(opts) {
    opts = opts || {};
    TURNS = opts.turns || [];
    STORAGE_KEY = opts.storageKey || STORAGE_KEY;
    if ($('aq-start')) $('aq-start').onclick = start;
    if ($('aq-mic')) $('aq-mic').onclick = function () {
      if (state.listening) { stopListen(); setStatus('Micrófono detenido.'); return; }
      startListen();
    };
    if ($('aq-next')) $('aq-next').onclick = nextTurn;
    if ($('aq-replay')) $('aq-replay').onclick = function () {
      var turn = TURNS[state.i];
      if (!turn || state.done) return;
      aliceSpeak(turn.alice, function () { setStatus('Tu turno otra vez.'); });
    };
    if ($('aq-step')) $('aq-step').textContent = 'Turno — / ' + TURNS.length;
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); };
    }
  }

  global.KamukAliceQuiz = { mount: mount, start: start };
})(window);
