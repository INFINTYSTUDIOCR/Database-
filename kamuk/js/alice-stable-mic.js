/**
 * Alice Stable Mic — hold-to-speak with MediaRecorder + server STT (Whisper/Scribe).
 * Replaces fragile browser SpeechRecognition for Alice (the product voice).
 * Falls back to PttMic (Web Speech) only if MediaRecorder/getUserMedia unavailable.
 */
var AliceStableMic = (function () {
  'use strict';

  var MAX_HOLD_MS = 90000;
  var instances = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function pickMime() {
    var candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    for (var i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
    }
    return '';
  }

  function canUse() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  function bind(opts) {
    var btn = typeof opts.btn === 'string' ? document.getElementById(opts.btn) : opts.btn;
    if (!btn) return null;
    if (!canUse()) return null;

    var prev = instances && instances.get(btn);
    if (prev && prev.destroy) prev.destroy();

    var media = null;
    var stream = null;
    var chunks = [];
    var mime = '';
    var holding = false;
    var sending = false;
    var pointerId = null;
    var maxHoldTimer = null;
    var sessionId = 0;

    function setUi(listening) {
      try { btn.classList.toggle('ptt-active', !!listening); } catch (e) {}
      if (typeof opts.onUi === 'function') opts.onUi(!!listening, btn);
    }

    function clearMaxHold() {
      clearTimeout(maxHoldTimer);
      maxHoldTimer = null;
    }

    function stopTracks() {
      if (!stream) return;
      try {
        stream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) {}
      stream = null;
    }

    function killRecorder() {
      clearMaxHold();
      if (media) {
        try {
          media.ondataavailable = null;
          media.onstop = null;
          media.onerror = null;
          if (media.state === 'recording' || media.state === 'paused') media.stop();
        } catch (e) {}
      }
      media = null;
      stopTracks();
    }

    function fail(code) {
      holding = false;
      sending = false;
      killRecorder();
      setUi(false);
      try { btn.classList.remove('ptt-busy', 'ptt-active'); } catch (e) {}
      if (typeof opts.onError === 'function') opts.onError(code || 'start-failed');
    }

    async function startHold(ev) {
      if (holding || sending) return;
      if (typeof opts.canStart === 'function' && !opts.canStart()) return;
      if (ev && ev.pointerId != null) {
        pointerId = ev.pointerId;
        try { btn.setPointerCapture(pointerId); } catch (eCap) {}
      }
      holding = true;
      chunks = [];
      sessionId += 1;
      var mySession = sessionId;
      setUi(true);
      if (typeof opts.onBeforeStart === 'function') opts.onBeforeStart();

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (eMic) {
        fail((eMic && eMic.name === 'NotAllowedError') ? 'not-allowed' : 'audio-capture');
        return;
      }
      if (!holding || mySession !== sessionId) {
        stopTracks();
        return;
      }

      mime = pickMime();
      try {
        media = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (eRec) {
        fail('start-failed');
        return;
      }
      mime = media.mimeType || mime || 'audio/webm';
      media.ondataavailable = function (ev2) {
        if (ev2.data && ev2.data.size) chunks.push(ev2.data);
      };
      media.onerror = function () { fail('start-failed'); };
      try {
        media.start(250);
      } catch (eStart) {
        fail('start-failed');
        return;
      }
      clearMaxHold();
      maxHoldTimer = setTimeout(function () {
        if (holding) endHold(true);
      }, MAX_HOLD_MS);
    }

    function endHold(fromTimer) {
      if (!holding) return;
      holding = false;
      clearMaxHold();
      setUi(false);
      var rec = media;
      media = null;
      if (!rec) {
        stopTracks();
        return;
      }
      sending = true;
      try { btn.classList.add('ptt-busy'); } catch (eB) {}
      if (typeof opts.onUi === 'function') {
        opts.onUi(false, btn);
      }
      var st = document.getElementById('alice-status');
      if (st) st.textContent = fromTimer
        ? 'Tope de tiempo — transcribiendo…'
        : 'Transcribiendo con Alice STT…';

      rec.onstop = function () {
        stopTracks();
        var blob = new Blob(chunks, { type: mime || 'audio/webm' });
        chunks = [];
        if (!blob.size || blob.size < 400) {
          sending = false;
          try { btn.classList.remove('ptt-busy'); } catch (e1) {}
          if (typeof opts.onEmpty === 'function') opts.onEmpty();
          else if (st) st.textContent = 'No se escuchó audio — mantené más tiempo o hablá más cerca.';
          return;
        }
        uploadBlob(blob);
      };
      try {
        if (rec.state === 'recording' || rec.state === 'paused') rec.stop();
        else rec.onstop();
      } catch (eStop) {
        sending = false;
        try { btn.classList.remove('ptt-busy'); } catch (e2) {}
        fail('start-failed');
      }
    }

    function uploadBlob(blob) {
      var fd = new FormData();
      var ext = (mime || '').indexOf('mp4') >= 0 ? 'm4a' : 'webm';
      fd.append('audio', blob, 'alice-ptt.' + ext);
      fd.append('lang', 'en');
      var fetchFn = typeof infinityFetch === 'function' ? infinityFetch : fetch;
      var headers = typeof authHeaders === 'function' ? authHeaders() : {};
      // FormData: do not set Content-Type (boundary)
      var hdr = {};
      Object.keys(headers || {}).forEach(function (k) {
        if (String(k).toLowerCase() !== 'content-type') hdr[k] = headers[k];
      });
      fetchFn('/alice/stt', { method: 'POST', headers: hdr, body: fd })
        .then(function (r) {
          if (!r.ok) throw new Error('stt_' + r.status);
          return r.json();
        })
        .then(function (j) {
          var text = String((j && j.text) || '').replace(/\s+/g, ' ').trim();
          if (typeof opts.normalizeTranscript === 'function') {
            try {
              var n = opts.normalizeTranscript(text);
              if (n == null) text = '';
              else text = String(n).trim();
            } catch (eN) { /* keep */ }
          }
          sending = false;
          try { btn.classList.remove('ptt-busy', 'ptt-active'); } catch (e3) {}
          var st2 = document.getElementById('alice-status');
          if (st2) st2.textContent = '';
          if (text && typeof opts.onSend === 'function') opts.onSend(text);
          else if (!text && typeof opts.onEmpty === 'function') opts.onEmpty();
          else if (!text && st2) st2.textContent = 'No se entendió — intentá de nuevo o escribí.';
        })
        .catch(function (err) {
          sending = false;
          try { btn.classList.remove('ptt-busy', 'ptt-active'); } catch (e4) {}
          var code = 'network';
          var msg = String((err && err.message) || '');
          if (msg.indexOf('stt_401') >= 0) code = 'not-allowed';
          if (msg.indexOf('stt_403') >= 0) code = 'service-not-allowed';
          if (msg.indexOf('stt_503') >= 0 || msg.indexOf('stt_422') >= 0) code = 'start-failed';
          if (typeof opts.onError === 'function') opts.onError(code);
        });
    }

    function onPointerDown(ev) {
      if (ev.button != null && ev.button !== 0) return;
      ev.preventDefault();
      startHold(ev);
    }
    function onPointerUp(ev) {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      ev.preventDefault();
      endHold(false);
      pointerId = null;
    }
    function onPointerCancel() {
      endHold(false);
      pointerId = null;
    }

    btn.style.touchAction = 'none';
    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointercancel', onPointerCancel);
    // Do NOT bind pointerleave — that was cutting speech mid-sentence on desktop
    btn._aliceStableBound = true;

    var api = {
      destroy: function () {
        holding = false;
        killRecorder();
        btn.removeEventListener('pointerdown', onPointerDown);
        btn.removeEventListener('pointerup', onPointerUp);
        btn.removeEventListener('pointercancel', onPointerCancel);
        btn._aliceStableBound = false;
        if (instances) instances.delete(btn);
      },
      stop: function () {
        if (holding) endHold(false);
        else killRecorder();
      }
    };
    if (instances) instances.set(btn, api);
    return api;
  }

  return { bind: bind, canUse: canUse };
})();
