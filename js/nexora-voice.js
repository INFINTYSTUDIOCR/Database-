/**
 * Nexora TTS — ElevenLabs via /nexora-tts with verified voice IDs + browser fallback.
 */
var NEXORA_DEFAULT_VOICE = 'r1KmysJdVYZjJCm4mL3b';
var NEXORA_INTERVIEWER_VOICE = 'bfGb7JTLUnZebZRiFYyq';
var NEXORA_CLIENT_VOICE = 'NoOVOzCQFLOvtsMoNcdT';

var NEXORA_VOICES_MALE = [
  { id: NEXORA_INTERVIEWER_VOICE, accent: 'American Male' },
  { id: NEXORA_DEFAULT_VOICE, accent: 'American Male' }
];
var NEXORA_VOICES_FEMALE = [
  { id: NEXORA_CLIENT_VOICE, accent: 'American Female' },
  { id: NEXORA_DEFAULT_VOICE, accent: 'American Female' }
];

function nexoraCleanTTS(text) {
  return String(text || '')
    .replace(/ALICE:|CLAIRE:|JILL:|INTERVIEWER:|CLIENT:/gi, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_#\[\]{}<>|~`^]/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/,/g, ' ')
    .replace(/;/g, ' ')
    .replace(/:/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function nexoraStopAudio() {
  if (window._nxAudio) {
    try { window._nxAudio.pause(); } catch (e) {}
    if (window._nxAudio.src && window._nxAudio.src.indexOf('blob:') === 0) {
      try { URL.revokeObjectURL(window._nxAudio.src); } catch (e) {}
    }
    window._nxAudio = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function nexoraBrowserSpeak(text, gender) {
  if (!window.speechSynthesis || !text) return false;
  nexoraStopAudio();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = gender === 'male' ? 0.94 : 0.97;
  var voices = window.speechSynthesis.getVoices();
  var pick = voices.find(function (v) {
    return v.lang && v.lang.indexOf('en-US') === 0;
  });
  if (pick) u.voice = pick;
  window.speechSynthesis.speak(u);
  return true;
}

function nexoraFetchTTS(text, voiceId) {
  var fetchFn = typeof infinityFetch === 'function' ? infinityFetch : fetch;
  var url = typeof INFINITY_API !== 'undefined' ? INFINITY_API + '/nexora-tts' : '/nexora-tts';
  var opts = {
    method: 'POST',
    headers: typeof authHeaders === 'function' ? authHeaders() : { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text, voiceId: voiceId || NEXORA_DEFAULT_VOICE })
  };
  if (fetchFn === fetch) {
    return fetch(url, opts);
  }
  return fetchFn('/nexora-tts', opts);
}

function nexoraPlayBlob(blob, onDone) {
  if (!blob) { if (onDone) onDone(false); return; }
  nexoraStopAudio();
  var url = URL.createObjectURL(blob);
  window._nxAudio = new Audio(url);
  window._nxAudio.onended = function () {
    URL.revokeObjectURL(url);
    window._nxAudio = null;
    if (onDone) onDone(true);
  };
  window._nxAudio.onerror = function () {
    URL.revokeObjectURL(url);
    window._nxAudio = null;
    if (onDone) onDone(false);
  };
  var p = window._nxAudio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(function () { if (onDone) onDone(false); });
  }
}

function nexoraSpeak(text, profile) {
  var clean = nexoraCleanTTS(text);
  if (clean.length < 3) return;

  if (typeof stopMic === 'function') stopMic();
  if (typeof stopNexoraMic === 'function') stopNexoraMic();

  var primary = (profile && profile.voiceId) ? profile.voiceId : NEXORA_DEFAULT_VOICE;
  var gender = (profile && profile.gender) || 'female';
  var fallbacks = [primary];
  if (fallbacks.indexOf(NEXORA_DEFAULT_VOICE) === -1) fallbacks.push(NEXORA_DEFAULT_VOICE);

  function tryVoice(idx) {
    if (idx >= fallbacks.length) {
      nexoraBrowserSpeak(clean, gender);
      return;
    }
    nexoraFetchTTS(clean, fallbacks[idx])
      .then(function (r) {
        if (!r.ok) throw new Error('tts_' + r.status);
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.indexOf('audio') < 0) throw new Error('not_audio');
        return r.blob();
      })
      .then(function (blob) {
        nexoraPlayBlob(blob, function (ok) {
          if (!ok) tryVoice(idx + 1);
        });
      })
      .catch(function () { tryVoice(idx + 1); });
  }

  tryVoice(0);
}
