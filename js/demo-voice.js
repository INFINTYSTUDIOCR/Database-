/**
 * Demo voice — mic input + stable TTS for Alice / Nexora mini sessions
 */
var DemoVoice = (function () {
  'use strict';

  var BACKEND = typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com';
  var _audio = null;
  var _mic = null;
  var _micOn = false;
  var _browserVoiceCache = {};
  var _activeProfile = null;

  function normalizeProfile(profile) {
    if (!profile) return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('alice') : { voiceId: 'r1KmysJdVYZjJCm4mL3b', gender: 'female' };
    if (typeof profile === 'string') {
      if (profile === 'nexora') return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('nexora', 'star') : null;
      return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('alice') : { voiceId: 'r1KmysJdVYZjJCm4mL3b', gender: 'female' };
    }
    return profile;
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

  function getBrowserVoice(profile) {
    if (!window.speechSynthesis) return null;
    var key = profile.voiceId || profile.gender || 'default';
    if (_browserVoiceCache[key]) return _browserVoiceCache[key];

    var voices = window.speechSynthesis.getVoices();
    var hints = profile.browserHints || [];
    var pick = null;
    var i;

    for (i = 0; i < hints.length; i++) {
      pick = voices.find(function (v) {
        return v.name && v.name.toLowerCase().indexOf(hints[i].toLowerCase()) >= 0 && v.lang && v.lang.indexOf('en') === 0;
      });
      if (pick) break;
    }

    if (!pick && profile.gender === 'female') {
      pick = voices.find(function (v) {
        return v.lang && v.lang.indexOf('en-US') === 0 && /zira|samantha|jenny|aria|female/i.test(v.name);
      }) || voices.find(function (v) {
        return v.lang && v.lang.indexOf('en') === 0 && !/hazel|uk|british|india|australian/i.test(v.name) && /zira|samantha|jenny|aria|female/i.test(v.name);
      });
    }

    if (!pick && profile.gender === 'male') {
      pick = voices.find(function (v) {
        return v.lang && v.lang.indexOf('en-US') === 0 && /david|guy|mark|male|ryan|christopher/i.test(v.name);
      }) || voices.find(function (v) {
        return v.lang && v.lang.indexOf('en') === 0 && !/hazel|uk|british|india|australian/i.test(v.name) && /david|guy|mark|male|ryan|christopher/i.test(v.name);
      });
    }

    if (!pick) {
      pick = voices.find(function (v) {
        return v.lang && v.lang.indexOf('en-US') === 0;
      });
    }

    _browserVoiceCache[key] = pick || null;
    return _browserVoiceCache[key];
  }

  function browserSpeak(text, profile) {
    if (!window.speechSynthesis || !text) return;
    stopAudio();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = profile.gender === 'male' ? 0.94 : 0.97;
    u.pitch = profile.gender === 'male' ? 0.95 : 1.02;
    var voice = getBrowserVoice(profile);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  function speak(text, profile) {
    var p = normalizeProfile(profile || _activeProfile);
    if (!p) return;
    _activeProfile = p;

    var cleanText = clean(text);
    if (cleanText.length < 4) return;

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
      .then(function (blob) { playBlob(blob); })
      .catch(function () {
        if (p.source === 'elevenlabs-account' || p.source === 'jill-voices.json' || p.source === 'NEXORA_DEMO_MALE_VOICE_ID' || p.source === 'NEXORA_DEMO_FEMALE_VOICE_ID' || p.source === 'voices.json') {
          browserSpeak(cleanText, p);
        }
      });
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

  return {
    speak: speak,
    bindMic: bindMic,
    stop: stopAudio,
    setProfile: setProfile,
    nexoraProfile: function (scenario) {
      return typeof demoVoiceProfile === 'function' ? demoVoiceProfile('nexora', scenario) : null;
    }
  };
})();
