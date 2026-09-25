/**
 * Alice Interactive Quiz — Salonera bilingüe
 * Alice = guest at the table (NOT companion / Jill). Asks in English, listens, corrects, final grade.
 */
(function (global) {
  'use strict';

  var BACKEND = 'https://alice-by-infinity.onrender.com';
  var ALICE_VOICE = 'r1KmysJdVYZjJCm4mL3b';

  var TURNS = [
    {
      id: 'approach',
      alice: 'Good evening. We just sat down — two adults. Could we get some water and see the menu, please?',
      need: ['welcome', 'water', 'name', 'menu'],
      anyOf: [
        ['welcome', 'good evening', 'hello', 'hi'],
        ['water', 'still', 'sparkling'],
        ['name', 'i\'m', 'my name', 'i am'],
        ['menu', 'menus']
      ],
      tip: 'Greet them, say your name, offer still or sparkling water, and the menus.',
      model: 'Good evening. Welcome to Casa Marina. My name is Karina and I\'ll be taking care of you tonight. May I start you with still or sparkling water? Here are the menus.'
    },
    {
      id: 'order',
      alice: 'I\'ll have the catch of the day with rice. He wants the ribeye, medium-rare, with mashed potatoes. And she\'s vegetarian — what do you recommend?',
      need: ['confirm', 'fish', 'steak', 'veg'],
      anyOf: [
        ['confirm', 'just to confirm', 'so that\'s', 'one catch', 'one ribeye'],
        ['fish', 'catch', 'day', 'rice'],
        ['steak', 'ribeye', 'medium'],
        ['veg', 'vegetarian', 'pasta', 'vegetables', 'recommend']
      ],
      tip: 'Repeat every item back, include cooking preference, and offer one clear vegetarian option.',
      model: 'Just to confirm: one catch of the day with rice, one ribeye medium-rare with mashed potatoes, and for her I recommend the vegetarian pasta without cheese. Is that correct?'
    },
    {
      id: 'allergy',
      alice: 'Wait — I\'m allergic to shellfish and peanuts. Is the ceviche safe for me?',
      need: ['thank', 'allergy', 'no-ceviche', 'alt'],
      anyOf: [
        ['thank', 'thank you', 'thanks', 'appreciate'],
        ['allergy', 'allergic', 'shellfish', 'peanut', 'flag', 'kitchen', 'chef'],
        ['no-ceviche', 'ceviche', 'shrimp', 'don\'t recommend', 'not recommend', 'contains'],
        ['alt', 'suggest', 'instead', 'grilled', 'vegetables', 'catch']
      ],
      tip: 'Thank them, flag the allergy, refuse unsafe items, and suggest a safe alternative.',
      model: 'Thank you for telling me. I\'ll flag shellfish and peanut allergies with the kitchen. Our ceviche contains shrimp, so I don\'t recommend it. May I suggest the grilled catch with vegetables instead?'
    },
    {
      id: 'upsell',
      alice: 'Hmm, what drink would go well with the fish? And do you have a dessert worth saving for later?',
      need: ['pair', 'dessert', 'ask'],
      anyOf: [
        ['pair', 'mojito', 'passion', 'pairs', 'drink', 'citrus'],
        ['dessert', 'tres leches', 'house favorite', 'dessert'],
        ['ask', 'would you like', 'shall i', 'save']
      ],
      tip: 'One drink suggestion with a reason + one dessert offer. Don\'t push five things.',
      model: 'If you like citrus flavors, the passion-fruit mojito pairs very well with the fish. For dessert, our tres leches is the house favorite — would you like me to save two portions?'
    },
    {
      id: 'recovery',
      alice: 'Excuse me — I ordered medium-rare and this steak is well-done. This is not what I asked for.',
      need: ['sorry', 'remake', 'comp'],
      anyOf: [
        ['sorry', 'i\'m sorry', 'apologize', 'apology'],
        ['remake', 'remake', 'kitchen', 'medium-rare', 'right away', 'again'],
        ['comp', 'on us', 'complimentary', 'appetizer', 'while you wait']
      ],
      tip: 'Apologize, remake correctly, offer a small compensation. Never blame the guest.',
      model: 'I\'m sorry — that\'s not what you ordered. I\'ll have the kitchen remake it medium-rare right away, and this dish is on us. Can I bring you a complimentary appetizer while you wait?'
    },
    {
      id: 'check',
      alice: 'We\'re finished, thank you. Could we get the check? Can we pay separately?',
      need: ['check', 'split', 'pay', 'bye'],
      anyOf: [
        ['check', 'check', 'bill'],
        ['split', 'separate', 'together', 'split'],
        ['pay', 'card', 'cash', 'accept'],
        ['bye', 'wonderful', 'see you', 'thank you', 'evening']
      ],
      tip: 'Offer the check, confirm together or separate, payment options, warm goodbye.',
      model: 'Of course — would you like the checks separate? We accept cards and cash. Have a wonderful evening, and we hope to see you again.'
    }
  ];

  var state = {
    i: 0,
    scores: [],
    listening: false,
    speaking: false,
    done: false,
    recog: null,
    audio: null
  };

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
    if (!h || h.length < 4) return { pct: 0, hit: 0, total: turn.anyOf.length, missing: turn.need.slice() };
    var hit = 0;
    var missing = [];
    turn.anyOf.forEach(function (group, idx) {
      var ok = group.some(function (kw) { return h.indexOf(norm(kw)) >= 0; });
      if (ok) hit++;
      else missing.push(turn.need[idx] || ('part ' + (idx + 1)));
    });
    var polite = /\b(please|thank|of course|certainly|right away|welcome)\b/.test(h) ? 8 : 0;
    var englishBias = /\b(the|you|your|i|we|would|may|can)\b/.test(h) ? 5 : 0;
    var pct = Math.min(100, Math.round((hit / turn.anyOf.length) * 87) + polite + englishBias);
    return { pct: pct, hit: hit, total: turn.anyOf.length, missing: missing };
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
        a.onerror = function () {
          state.speaking = false;
          browserSpeak(clean, onEnd);
        };
        return a.play();
      })
      .catch(function () {
        browserSpeak(clean, onEnd);
      });
  }

  function stopListen() {
    state.listening = false;
    var btn = $('ap-mic');
    if (btn) {
      btn.classList.remove('listening');
      btn.textContent = '🎤 Hablar (vos = salonera)';
    }
    if (state.recog) {
      try { state.recog.onresult = null; state.recog.onend = null; state.recog.stop(); } catch (e) {}
      state.recog = null;
    }
  }

  function setStatus(t) {
    var el = $('ap-status');
    if (el) el.textContent = t || '';
  }

  function renderTurn() {
    var turn = TURNS[state.i];
    var bubble = $('ap-alice');
    var step = $('ap-step');
    var heard = $('ap-heard');
    var fb = $('ap-feedback');
    var evalBox = $('ap-eval');
    if (evalBox) { evalBox.className = 'ap-eval'; evalBox.innerHTML = ''; }
    if (heard) heard.textContent = '';
    if (fb) { fb.className = 'ap-feedback'; fb.textContent = ''; }
    if (step) step.textContent = 'Turno ' + (state.i + 1) + ' / ' + TURNS.length;
    if (bubble) bubble.textContent = turn ? turn.alice : '';
    var mic = $('ap-mic');
    var next = $('ap-next');
    if (mic) mic.disabled = !turn || state.done;
    if (next) next.disabled = true;
    setStatus(turn ? 'Alice (guest) está hablando…' : '');
  }

  function playCurrent() {
    var turn = TURNS[state.i];
    if (!turn) return;
    renderTurn();
    aliceSpeak(turn.alice, function () {
      setStatus('Tu turno: respondé en inglés como salonera. Tocá Hablar.');
    });
  }

  function feedbackFor(sc, turn) {
    if (sc.pct >= 80) {
      return {
        ok: true,
        text: 'Nice. You covered the service points. ' + (sc.pct >= 92 ? 'Very professional.' : 'Small polish: keep confirming clearly.')
      };
    }
    if (sc.pct >= 55) {
      return {
        ok: false,
        text: 'Almost — missing: ' + sc.missing.join(', ') + '. Tip: ' + turn.tip + ' Try again or hear the model.'
      };
    }
    return {
      ok: false,
      text: 'Let\'s fix that. ' + turn.tip + ' Model: “' + turn.model + '”'
    };
  }

  function onHeard(text) {
    stopListen();
    var turn = TURNS[state.i];
    if (!turn) return;
    var heardEl = $('ap-heard');
    if (heardEl) heardEl.textContent = 'Vos dijiste: “' + text + '”';
    var sc = scoreTurn(text, turn);
    state.scores[state.i] = sc;
    var fb = feedbackFor(sc, turn);
    var fbEl = $('ap-feedback');
    if (fbEl) {
      fbEl.className = 'ap-feedback ' + (fb.ok ? 'ok' : 'fix');
      fbEl.textContent = 'Alice: ' + fb.text;
    }
    aliceSpeak(fb.text, function () {
      setStatus(fb.ok ? 'Bien. Tocá Siguiente turno.' : 'Podés reintentar Hablar, o Siguiente para continuar.');
      var next = $('ap-next');
      if (next) next.disabled = false;
    });
  }

  function startListen() {
    if (state.speaking || state.done) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus('Este navegador no soporta micrófono de voz. Usá Chrome o Edge.');
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
    var btn = $('ap-mic');
    if (btn) {
      btn.classList.add('listening');
      btn.textContent = '● Escuchando… hablá';
    }
    state.listening = true;
    setStatus('Escuchando… respondé en inglés.');
    recog.onresult = function (ev) {
      var chunk = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript + ' ';
      }
      var heardEl = $('ap-heard');
      if (heardEl) heardEl.textContent = 'Escuchando: “' + (finalText || chunk).trim() + '”';
    };
    recog.onerror = function () {
      stopListen();
      setStatus('No se escuchó bien. Tocá Hablar de nuevo.');
    };
    recog.onend = function () {
      state.listening = false;
      if (btn) {
        btn.classList.remove('listening');
        btn.textContent = '🎤 Hablar (vos = salonera)';
      }
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
    state.scores.forEach(function (s) { total += (s && s.pct) || 0; });
    var avg = state.scores.length ? Math.round(total / TURNS.length) : 0;
    var pass = avg >= 80;
    var weak = [];
    TURNS.forEach(function (t, idx) {
      var s = state.scores[idx];
      if (!s || s.pct < 80) weak.push(t.id);
    });
    var lines = pass
      ? 'Alice final: Strong table service — ' + avg + '/100. You confirmed orders, handled safety, and recovered professionally. Ready for real guests.'
      : 'Alice final: ' + avg + '/100 — keep drilling: ' + (weak.join(', ') || 'clarity') + '. Aim for clear confirms, allergy protocol, and calm recovery. Practice again.';
    var box = $('ap-eval');
    if (box) {
      box.className = 'ap-eval ' + (pass ? 'ok' : 'bad');
      box.innerHTML = '<strong>Evaluación final</strong><br>' + lines
        + '<br><span style="font-weight:600;opacity:.85;">Detalle: '
        + TURNS.map(function (t, i) {
          var s = state.scores[i];
          return t.id + ' ' + ((s && s.pct) || 0) + '%';
        }).join(' · ')
        + '</span>';
    }
    setStatus(pass ? 'Aprobaste la práctica oral Alice.' : 'Repetí la práctica — mínimo 80%.');
    var mic = $('ap-mic');
    var next = $('ap-next');
    if (mic) mic.disabled = true;
    if (next) next.disabled = true;
    try {
      localStorage.setItem('inf_kt_salonera_alice', JSON.stringify({
        avg: avg, pass: pass, scores: state.scores.map(function (s) { return s ? s.pct : 0; }), at: new Date().toISOString()
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
    var startBtn = $('ap-start');
    if (startBtn) startBtn.textContent = 'Reiniciar práctica';
    playCurrent();
  }

  function mount() {
    var startBtn = $('ap-start');
    var mic = $('ap-mic');
    var next = $('ap-next');
    var replay = $('ap-replay');
    if (startBtn) startBtn.onclick = start;
    if (mic) mic.onclick = function () {
      if (state.listening) { stopListen(); setStatus('Micrófono detenido.'); return; }
      startListen();
    };
    if (next) next.onclick = nextTurn;
    if (replay) replay.onclick = function () {
      var turn = TURNS[state.i];
      if (!turn || state.done) return;
      aliceSpeak(turn.alice, function () { setStatus('Tu turno otra vez.'); });
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); };
    }
  }

  global.AliceSaloneraPractice = { mount: mount, start: start };
})(window);
