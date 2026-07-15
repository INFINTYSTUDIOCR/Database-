/**
 * Demo voice — mic input + stable TTS for Alice / Jill / Nexora mini sessions
 */
var DemoVoice = (function () {
  'use strict';

  var BACKEND = typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com';
  var _audio = null;
  var _mic = null;
  var _micOn = false;
  var _silenceTimer = null;
  var _browserVoiceCache = {};
  var _activeProfile = null;
  var DEFAULT_SILENCE_MS = 2200;

  function normalizeProfile(profile) {
    if (!profile) return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('alice') : { voiceId: 'r1KmysJdVYZjJCm4mL3b', gender: 'female', lang: 'en-US' };
    if (typeof profile === 'string') {
      if (profile === 'jill') return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('jill') : null;
      if (profile === 'nexora') return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('nexora', 'star') : null;
      return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('alice') : { voiceId: 'r1KmysJdVYZjJCm4mL3b', gender: 'female', lang: 'en-US' };
    }
    return profile;
  }

  function profileLang(profile) {
    var p = normalizeProfile(profile || _activeProfile);
    return (p && p.lang) || 'en-US';
  }

  function setProfile(profile) {
    _activeProfile = normalizeProfile(profile);
    return _activeProfile;
  }

  function clean(text) {
    return String(text || '')
      .replace(/ALICE:|CLAIRE:|JILL:|INTERVIEWER:|CLIENT:|MARIA:/gi, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[*_#<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stopAudio() {
    if (_audio) {
      try { _audio.pause(); } catch (e) {}
      _audio = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function clearSilenceTimer() {
    if (_silenceTimer) {
      clearTimeout(_silenceTimer);
      _silenceTimer = null;
    }
  }

  function playBlob(blob, onEnd) {
    stopAudio();
    _audio = new Audio(URL.createObjectURL(blob));
    _audio.onended = function () { if (typeof onEnd === 'function') onEnd(); };
    _audio.play().catch(function () { if (typeof onEnd === 'function') onEnd(); });
  }

  function getBrowserVoice(profile) {
    if (!window.speechSynthesis) return null;
    var p = normalizeProfile(profile);
    var lang = profileLang(p);
    var langPrefix = lang.split('-')[0];
    var key = (p.voiceId || p.gender || 'default') + ':' + lang;
    if (_browserVoiceCache[key]) return _browserVoiceCache[key];

    var voices = window.speechSynthesis.getVoices();
    var hints = p.browserHints || [];
    var pick = null;
    var i;

    for (i = 0; i < hints.length; i++) {
      pick = voices.find(function (v) {
        return v.name && v.name.toLowerCase().indexOf(hints[i].toLowerCase()) >= 0 && v.lang && v.lang.indexOf(langPrefix) === 0;
      });
      if (pick) break;
    }

    if (!pick && p.gender === 'female') {
      pick = voices.find(function (v) {
        return v.lang && v.lang.indexOf(lang) === 0 && /zira|samantha|jenny|aria|female|helena|sabina|paulina|monica|lucia/i.test(v.name);
      }) || voices.find(function (v) {
        return v.lang && v.lang.indexOf(langPrefix) === 0 && /female|zira|samantha|helena|paulina/i.test(v.name);
      });
    }

    if (!pick && p.gender === 'male') {
      pick = voices.find(function (v) {
        return v.lang && v.lang.indexOf(langPrefix) === 0 && /david|guy|mark|male|ryan|christopher|jorge|carlos|pablo/i.test(v.name);
      });
    }

    if (!pick) {
      pick = voices.find(function (v) { return v.lang && v.lang.indexOf(lang) === 0; })
        || voices.find(function (v) { return v.lang && v.lang.indexOf(langPrefix) === 0; });
    }

    _browserVoiceCache[key] = pick || null;
    return _browserVoiceCache[key];
  }

  function browserSpeak(text, profile, onEnd) {
    if (!window.speechSynthesis || !text) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    stopAudio();
    var p = normalizeProfile(profile);
    var u = new SpeechSynthesisUtterance(text);
    u.lang = profileLang(p);
    u.rate = p.gender === 'male' ? 0.94 : 0.97;
    u.pitch = p.gender === 'male' ? 0.95 : 1.02;
    var voice = getBrowserVoice(p);
    if (voice) u.voice = voice;
    u.onend = function () { if (typeof onEnd === 'function') onEnd(); };
    window.speechSynthesis.speak(u);
  }

  function speak(text, profile, onEnd) {
    var p = normalizeProfile(profile || _activeProfile);
    if (!p) return;
    _activeProfile = p;

    var cleanText = clean(text);
    if (cleanText.length < 4) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }

    fetch(BACKEND + '/demo/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voiceId: p.voiceId, voice: p.voiceId ? undefined : 'alice' })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('tts_fail');
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.indexOf('audio') >= 0) return r.blob();
        throw new Error('not_audio');
      })
      .then(function (blob) { playBlob(blob, onEnd); })
      .catch(function () {
        if (p.source === 'elevenlabs-account' || p.source === 'jill-voices.json' || p.source === 'NEXORA_DEMO_MALE_VOICE_ID' || p.source === 'NEXORA_DEMO_FEMALE_VOICE_ID' || p.source === 'voices.json') {
          browserSpeak(cleanText, p, onEnd);
        } else if (typeof onEnd === 'function') {
          onEnd();
        }
      });
  }

  var _ttsQueue = [];
  var _ttsBusy = false;

  function queueSpeak(text, profile) {
    splitTtsChunks(text, 450).forEach(function (chunk) {
      _ttsQueue.push({ text: chunk, profile: profile || _activeProfile });
    });
    if (!_ttsBusy) drainQueue();
  }

  function drainQueue() {
    if (!_ttsQueue.length) {
      _ttsBusy = false;
      return;
    }
    _ttsBusy = true;
    var item = _ttsQueue.shift();
    speak(item.text, item.profile, drainQueue);
  }

  function clearQueue() {
    _ttsQueue = [];
    _ttsBusy = false;
    stopAudio();
  }

  function micStatusText(profile, on) {
    if (!on) return '';
    var lang = profileLang(profile);
    if (lang.indexOf('es') === 0) return '🎙 Escuchando… hablá todo lo que necesites, espero a que termines';
    return '🎙 Listening… take your time, say as much as you need';
  }

  function setMicUi(on, btn, statusEl, profile) {
    if (btn) {
      btn.classList.toggle('recording', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (statusEl) {
      statusEl.style.display = on ? 'block' : 'none';
      statusEl.textContent = micStatusText(profile, on);
    }
  }

  var _micTranscript = '';

  function scheduleMicSend(input, btn, statusEl, opts) {
    clearSilenceTimer();
    _silenceTimer = setTimeout(function () {
      _silenceTimer = null;
      if (!_micOn) return;
      var text = _micTranscript.trim();
      _micTranscript = '';
      if (input) input.value = '';
      stopMic(btn, statusEl, opts.profile);
      if (text.length >= 2 && typeof opts.onSend === 'function') opts.onSend(text);
    }, opts.silenceMs || DEFAULT_SILENCE_MS);
  }

  function bindMic(opts) {
    var input = document.getElementById(opts.inputId);
    var btn = document.getElementById(opts.micBtnId);
    var statusEl = opts.statusId ? document.getElementById(opts.statusId) : null;
    if (!input || !btn) return;

    if (typeof PttMic !== 'undefined') {
      PttMic.bind({
        btn: btn,
        lang: opts.lang || profileLang(opts.profile || _activeProfile),
        canStart: function () { return !_micOn; },
        onBeforeStart: function () {
          stopAudio();
          clearQueue();
          _micTranscript = '';
          if (input) input.value = '';
          _micOn = true;
        },
        onUi: function (listening) {
          setMicUi(listening, btn, statusEl, opts.profile || _activeProfile);
          if (!listening) _micOn = false;
        },
        onSend: function (text) {
          _micTranscript = '';
          if (input) input.value = '';
          if (text.length >= 1 && typeof opts.onSend === 'function') opts.onSend(text);
        },
        onError: function () {
          alert('Voice input needs Chrome or Edge. You can still type your answers.');
        }
      });
      return;
    }

    btn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (_micOn) return;
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert('Voice input needs Chrome or Edge. You can still type your answers.');
        return;
      }
      stopAudio();
      clearQueue();
      _micTranscript = '';
      if (input) input.value = '';
      _mic = new SR();
      _mic.lang = opts.lang || profileLang(opts.profile || _activeProfile);
      _mic.interimResults = true;
      _mic.continuous = true;
      _micOn = true;
      setMicUi(true, btn, statusEl, opts.profile || _activeProfile);
      _mic.onresult = function (ev) {
        for (var i = 0; i < ev.results.length; i++) _micTranscript += ev.results[i][0].transcript;
      };
      _mic.onend = function () { _mic = null; };
      _mic.onerror = function () { stopMic(btn, statusEl, opts.profile); };
      try { _mic.start(); } catch (err) { stopMic(btn, statusEl, opts.profile); }
    });
    btn.addEventListener('mouseup', function () {
      if (!_micOn) return;
      var text = _micTranscript.trim();
      stopMic(btn, statusEl, opts.profile);
      if (text.length >= 1 && typeof opts.onSend === 'function') opts.onSend(text);
    });
    btn.addEventListener('mouseleave', function () {
      if (!_micOn) return;
      var text = _micTranscript.trim();
      stopMic(btn, statusEl, opts.profile);
      if (text.length >= 1 && typeof opts.onSend === 'function') opts.onSend(text);
    });
    btn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }, { passive: false });
    btn.addEventListener('touchend', function (e) {
      e.preventDefault();
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
  }

  function stopMic(btn, statusEl, profile) {
    clearSilenceTimer();
    _micTranscript = '';
    if (_mic) { try { _mic.stop(); } catch (e) {} _mic = null; }
    _micOn = false;
    setMicUi(false, btn, statusEl, profile);
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.addEventListener('voiceschanged', function () {
      window.speechSynthesis.getVoices();
    });
  }

  return {
    speak: speak,
    queueSpeak: queueSpeak,
    clearQueue: clearQueue,
    bindMic: bindMic,
    stop: stopAudio,
    setProfile: setProfile,
    nexoraProfile: function (scenario) {
      return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('nexora', scenario) : null;
    }
  };
})();
