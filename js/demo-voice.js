/**
 * Demo voice — mic input + TTS for Alice / Nexora mini sessions
 * Uses ElevenLabs via /demo/tts when live; browser speech as fallback.
 */
var DemoVoice = (function () {
  'use strict';

  var BACKEND = typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com';
  var _audio = null;
  var _mic = null;
  var _micOn = false;

  function clean(text) {
    return String(text || '')
      .replace(/ALICE:|CLAIRE:|JILL:|INTERVIEWER:|CLIENT:/gi, '')
      .replace(/[*_#<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  }

  function stopAudio() {
    if (_audio) {
      try { _audio.pause(); } catch (e) {}
      _audio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function playBlob(blob) {
    stopAudio();
    _audio = new Audio(URL.createObjectURL(blob));
    _audio.play().catch(function () {});
  }

  function browserSpeak(text, profile) {
    if (!window.speechSynthesis || !text) return;
    stopAudio();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = profile === 'nexora' ? 0.92 : 0.95;
    u.pitch = profile === 'nexora' ? 1 : 1.05;
    var voices = window.speechSynthesis.getVoices();
    var pick = voices.find(function (v) {
      return v.lang && v.lang.indexOf('en') === 0 && (profile === 'alice' ? /female|samantha|zira|jenny/i.test(v.name) : true);
    }) || voices.find(function (v) { return v.lang && v.lang.indexOf('en') === 0; });
    if (pick) u.voice = pick;
    window.speechSynthesis.speak(u);
  }

  function speak(text, profile) {
    var cleanText = clean(text);
    if (cleanText.length < 4) return;

    fetch(BACKEND + '/demo/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: profile || 'alice' })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('tts_fail');
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.indexOf('audio') >= 0) return r.blob();
        throw new Error('not_audio');
      })
      .then(function (blob) { playBlob(blob); })
      .catch(function () { browserSpeak(cleanText, profile); });
  }

  function setMicUi(on, btn, statusEl) {
    if (btn) {
      btn.classList.toggle('recording', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (statusEl) {
      statusEl.style.display = on ? 'block' : 'none';
      statusEl.textContent = on ? '🎙 Listening… speak in English' : '';
    }
  }

  function bindMic(opts) {
    var input = document.getElementById(opts.inputId);
    var btn = document.getElementById(opts.micBtnId);
    var statusEl = opts.statusId ? document.getElementById(opts.statusId) : null;
    if (!input || !btn) return;

    btn.addEventListener('click', function () {
      if (_micOn) {
        stopMic(btn, statusEl);
        return;
      }
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert('Voice input needs Chrome or Edge. You can still type your answers.');
        return;
      }
      stopAudio();
      _mic = new SR();
      _mic.lang = opts.lang || 'en-US';
      _mic.interimResults = true;
      _mic.continuous = false;
      _micOn = true;
      setMicUi(true, btn, statusEl);

      _mic.onresult = function (e) {
        input.value = Array.from(e.results).map(function (r) { return r[0].transcript; }).join('');
      };
      _mic.onend = function () {
        var hadText = input.value.trim().length > 0;
        stopMic(btn, statusEl);
        if (hadText && typeof opts.onSend === 'function') opts.onSend();
      };
      _mic.onerror = function () { stopMic(btn, statusEl); };
      _mic.start();
    });
  }

  function stopMic(btn, statusEl) {
    if (_mic) { try { _mic.stop(); } catch (e) {} _mic = null; }
    _micOn = false;
    setMicUi(false, btn, statusEl);
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.addEventListener('voiceschanged', function () {
      window.speechSynthesis.getVoices();
    });
  }

  return { speak: speak, bindMic: bindMic, stop: stopAudio };
})();
