/**
 * Push-to-Talk mic — hold to speak, release to send.
 * Waits for speech recognition to finish before sending (no half words).
 * Tolerates rapid press/release cycles without locking the mic.
 */
var PttMic = (function () {
  'use strict';

  var instances = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var fallbackInstances = {};

  function getInst(btn) {
    if (!btn) return null;
    if (instances) return instances.get(btn) || null;
    return fallbackInstances[btn.id || btn] || null;
  }

  function setInst(btn, inst) {
    if (instances) instances.set(btn, inst);
    else fallbackInstances[btn.id || 'btn'] = inst;
  }

  function delInst(btn) {
    if (instances) instances.delete(btn);
    else delete fallbackInstances[btn.id || 'btn'];
  }

  function bind(opts) {
    var btn = typeof opts.btn === 'string' ? document.getElementById(opts.btn) : opts.btn;
    if (!btn) return null;

    var prev = getInst(btn);
    if (prev && prev.destroy) prev.destroy();

    var rec = null;
    var transcript = '';
    var active = false;
    var sent = false;
    var stopLock = false;
    var wantSend = false;
    var sendTimer = null;
    var lastResults = null;
    var sessionId = 0;

    function ui(listening) {
      if (typeof opts.onUi === 'function') opts.onUi(listening, btn);
    }

    function rebuildTranscript(ev) {
      if (!ev || !ev.results || !ev.results.length) return transcript;
      var parts = [];
      for (var i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) parts.push(String(ev.results[i][0].transcript || '').trim());
      }
      if (parts.length) return parts.join(' ').replace(/\s+/g, ' ').trim();
      var last = ev.results[ev.results.length - 1];
      return (last && last[0] && last[0].transcript) ? String(last[0].transcript).trim() : transcript;
    }

    function clearSendTimer() {
      clearTimeout(sendTimer);
      sendTimer = null;
    }

    function unlockStop() {
      stopLock = false;
      wantSend = false;
    }

    function flushSend() {
      clearSendTimer();
      if (sent || !wantSend) {
        unlockStop();
        return;
      }
      var text = transcript.trim();
      transcript = '';
      unlockStop();
      sent = true;
      if (text && typeof opts.onSend === 'function') opts.onSend(text);
      setTimeout(function () { sent = false; }, 120);
    }

    function scheduleSend() {
      clearSendTimer();
      sendTimer = setTimeout(function () {
        if (lastResults) transcript = rebuildTranscript(lastResults);
        flushSend();
      }, 220);
    }

    function killRec() {
      if (!rec) return;
      var r = rec;
      rec = null;
      try {
        r.onresult = null;
        r.onend = null;
        r.onerror = null;
        if (typeof r.abort === 'function') r.abort();
        else r.stop();
      } catch (e) {}
    }

    function resetSession(cancelSend) {
      clearSendTimer();
      killRec();
      active = false;
      stopLock = false;
      if (cancelSend) wantSend = false;
      ui(false);
    }

    function stop(send) {
      if (!active && !rec && !wantSend && !sendTimer) return;
      if (send && stopLock) return;

      if (send) {
        stopLock = true;
        wantSend = true;
      } else {
        wantSend = false;
        clearSendTimer();
      }

      active = false;
      ui(false);

      if (rec) {
        var r = rec;
        var sid = sessionId;
        r.onend = function () {
          if (sid !== sessionId) return;
          if (r === rec) rec = null;
          if (lastResults) transcript = rebuildTranscript(lastResults);
          if (wantSend) scheduleSend();
          else unlockStop();
        };
        r.onerror = function (ev) {
          if (sid !== sessionId) return;
          if (ev && ev.error === 'aborted') return;
          if (r === rec) rec = null;
          if (wantSend) scheduleSend();
          else unlockStop();
        };
        try { r.stop(); } catch (e) {
          if (r === rec) rec = null;
          if (wantSend) scheduleSend();
          else unlockStop();
        }
      } else if (send) {
        scheduleSend();
      } else {
        unlockStop();
      }
    }

    function start(e) {
      if (e) e.preventDefault();
      if (typeof opts.canStart === 'function' && !opts.canStart()) return;

      sessionId++;
      resetSession(true);
      clearSendTimer();
      unlockStop();
      sent = false;

      if (typeof opts.onBeforeStart === 'function') opts.onBeforeStart();

      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        if (typeof opts.onError === 'function') opts.onError('no-sr');
        return;
      }

      active = true;
      transcript = '';
      lastResults = null;
      var sid = sessionId;
      rec = new SR();
      rec.lang = opts.lang || 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = function (ev) {
        if (sid !== sessionId) return;
        lastResults = ev;
        transcript = rebuildTranscript(ev);
      };
      rec.onerror = function (ev) {
        if (sid !== sessionId) return;
        if (ev && ev.error === 'aborted') return;
        resetSession(false);
      };
      try {
        rec.start();
      } catch (err) {
        killRec();
        active = false;
        ui(false);
        if (typeof opts.onError === 'function') opts.onError('start-failed');
        return;
      }
      ui(true);
    }

    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      try { btn.setPointerCapture(e.pointerId); } catch (e2) {}
      start(e);
    }

    function onPointerUp(e) {
      try { btn.releasePointerCapture(e.pointerId); } catch (e2) {}
      stop(true);
    }

    function onPointerCancel() {
      stop(false);
    }

    function onPointerLeave(e) {
      if (active && e.pointerType !== 'mouse') stop(true);
    }

    btn.addEventListener('pointerdown', onPointerDown);
    btn.addEventListener('pointerup', onPointerUp);
    btn.addEventListener('pointercancel', onPointerCancel);
    btn.addEventListener('pointerleave', onPointerLeave);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var inst = {
      stop: function (send) { stop(!!send); },
      reset: function () { sessionId++; resetSession(true); unlockStop(); sent = false; },
      destroy: function () {
        sessionId++;
        resetSession(true);
        btn.removeEventListener('pointerdown', onPointerDown);
        btn.removeEventListener('pointerup', onPointerUp);
        btn.removeEventListener('pointercancel', onPointerCancel);
        btn.removeEventListener('pointerleave', onPointerLeave);
        delInst(btn);
        btn._pttBound = false;
      }
    };
    setInst(btn, inst);
    btn._pttBound = true;
    return inst;
  }

  function stop(btn) {
    var b = typeof btn === 'string' ? document.getElementById(btn) : btn;
    var inst = b && getInst(b);
    if (inst) inst.stop(false);
  }

  function reset(btn) {
    var b = typeof btn === 'string' ? document.getElementById(btn) : btn;
    var inst = b && getInst(b);
    if (inst && inst.reset) inst.reset();
  }

  function stopAll() {
    document.querySelectorAll('[data-ptt-mic], [id$="-mic-btn"]').forEach(function (b) {
      var inst = getInst(b);
      if (inst) inst.stop(false);
    });
  }

  return { bind: bind, stop: stop, reset: reset, stopAll: stopAll };
})();
