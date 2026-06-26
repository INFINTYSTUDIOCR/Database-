/**
 * Push-to-Talk mic — hold to speak, release to send.
 * Waits for speech recognition to finish before sending (no half words).
 * Auto-restarts recognition while the button is held so long answers are not lost.
 */
var PttMic = (function () {
  'use strict';

  var instances = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var fallbackInstances = {};
  var RESTART_MS = 80;
  var SEND_WAIT_MS = 280;
  var RECOVERABLE_ERRORS = { 'no-speech': 1, network: 1, 'audio-capture': 1, 'service-not-allowed': 1 };

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
    var committed = [];
    var lastFinalCount = 0;
    var holding = false;
    var active = false;
    var sent = false;
    var stopLock = false;
    var wantSend = false;
    var sendTimer = null;
    var restartTimer = null;
    var lastResults = null;
    var sessionId = 0;

    function ui(listening) {
      if (typeof opts.onUi === 'function') opts.onUi(listening, btn);
    }

    function clearRestartTimer() {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    function clearSendTimer() {
      clearTimeout(sendTimer);
      sendTimer = null;
    }

    function unlockStop() {
      stopLock = false;
      wantSend = false;
    }

    function commitFromEvent(ev) {
      if (!ev || !ev.results || !ev.results.length) return;
      for (var i = lastFinalCount; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          var part = String(ev.results[i][0].transcript || '').trim();
          if (part) committed.push(part);
          lastFinalCount = i + 1;
        }
      }
    }

    function rebuildTranscript(ev) {
      commitFromEvent(ev);
      var base = committed.join(' ').replace(/\s+/g, ' ').trim();
      if (!ev || !ev.results || !ev.results.length) return base || transcript;
      var last = ev.results[ev.results.length - 1];
      if (last && !last.isFinal && last[0] && last[0].transcript) {
        var interim = String(last[0].transcript).trim();
        if (interim) return base ? (base + ' ' + interim).trim() : interim;
      }
      if (base) return base;
      for (var i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          var t = String(ev.results[i][0].transcript || '').trim();
          if (t) return t;
        }
      }
      return (last && last[0] && last[0].transcript) ? String(last[0].transcript).trim() : transcript;
    }

    function syncTranscript() {
      if (lastResults) transcript = rebuildTranscript(lastResults);
      else transcript = committed.join(' ').replace(/\s+/g, ' ').trim();
      return transcript;
    }

    function flushSend() {
      clearSendTimer();
      if (sent || !wantSend) {
        unlockStop();
        return;
      }
      var text = syncTranscript().trim();
      transcript = '';
      committed = [];
      lastFinalCount = 0;
      unlockStop();
      sent = true;
      if (text && typeof opts.onSend === 'function') opts.onSend(text);
      setTimeout(function () { sent = false; }, 120);
    }

    function scheduleSend() {
      clearSendTimer();
      var wait = SEND_WAIT_MS;
      if (transcript.length > 120) wait += 120;
      if (transcript.length > 400) wait += 180;
      sendTimer = setTimeout(function () {
        syncTranscript();
        flushSend();
      }, wait);
    }

    function killRec(abortOnly) {
      if (!rec) return;
      var r = rec;
      rec = null;
      try {
        r.onresult = null;
        r.onend = null;
        r.onerror = null;
        if (abortOnly && typeof r.abort === 'function') r.abort();
        else if (typeof r.abort === 'function') r.abort();
        else r.stop();
      } catch (e) {}
    }

    function resetSession(cancelSend) {
      clearRestartTimer();
      clearSendTimer();
      killRec(true);
      active = false;
      holding = false;
      stopLock = false;
      if (cancelSend) wantSend = false;
      committed = [];
      lastFinalCount = 0;
      transcript = '';
      lastResults = null;
      ui(false);
    }

    function shouldKeepListening() {
      return holding && !wantSend;
    }

    function scheduleRestart(sid) {
      clearRestartTimer();
      restartTimer = setTimeout(function () {
        restartTimer = null;
        if (sid !== sessionId || !shouldKeepListening()) return;
        spawnRec(sid);
      }, RESTART_MS);
    }

    function handleRecFinished(sid) {
      syncTranscript();
      rec = null;
      if (shouldKeepListening()) {
        scheduleRestart(sid);
        return;
      }
      if (wantSend) scheduleSend();
      else unlockStop();
    }

    function spawnRec(sid) {
      if (sid !== sessionId || !shouldKeepListening()) return false;

      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        if (typeof opts.onError === 'function') opts.onError('no-sr');
        return false;
      }

      killRec(true);
      lastFinalCount = 0;
      lastResults = null;
      active = true;
      ui(true);

      var r = new SR();
      rec = r;
      r.lang = opts.lang || 'en-US';
      r.interimResults = true;
      r.continuous = true;
      r.onresult = function (ev) {
        if (sid !== sessionId) return;
        lastResults = ev;
        transcript = rebuildTranscript(ev);
      };
      r.onend = function () {
        if (sid !== sessionId) return;
        handleRecFinished(sid);
      };
      r.onerror = function (ev) {
        if (sid !== sessionId) return;
        if (ev && ev.error === 'aborted') return;
        if (ev && !RECOVERABLE_ERRORS[ev.error] && !shouldKeepListening()) {
          resetSession(false);
          return;
        }
        handleRecFinished(sid);
      };
      try {
        r.start();
        return true;
      } catch (err) {
        rec = null;
        if (shouldKeepListening()) {
          scheduleRestart(sid);
          return false;
        }
        active = false;
        ui(false);
        if (typeof opts.onError === 'function') opts.onError('start-failed');
        return false;
      }
    }

    function stop(send) {
      if (!holding && !active && !rec && !wantSend && !sendTimer && !restartTimer) return;
      if (send && stopLock) return;

      holding = false;

      if (send) {
        stopLock = true;
        wantSend = true;
      } else {
        wantSend = false;
        clearSendTimer();
      }

      clearRestartTimer();
      active = false;
      ui(false);

      if (rec) {
        var r = rec;
        var sid = sessionId;
        r.onend = function () {
          if (sid !== sessionId) return;
          handleRecFinished(sid);
        };
        r.onerror = function (ev) {
          if (sid !== sessionId) return;
          if (ev && ev.error === 'aborted') return;
          handleRecFinished(sid);
        };
        try { r.stop(); } catch (e) {
          rec = null;
          handleRecFinished(sid);
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
      holding = true;

      if (typeof opts.onBeforeStart === 'function') opts.onBeforeStart();

      var sid = sessionId;
      if (!spawnRec(sid)) {
        if (!shouldKeepListening()) holding = false;
      }
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
      if (holding && e.pointerType !== 'mouse') stop(true);
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
