/**
 * Push-to-Talk mic — hold to speak, release to send.
 * Waits for speech recognition to finish before sending (no half words).
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

    function flushSend() {
      clearTimeout(sendTimer);
      sendTimer = null;
      if (sent || !wantSend) {
        wantSend = false;
        stopLock = false;
        return;
      }
      var text = transcript.trim();
      transcript = '';
      wantSend = false;
      sent = true;
      if (text && typeof opts.onSend === 'function') opts.onSend(text);
      setTimeout(function () { stopLock = false; sent = false; }, 500);
    }

    function scheduleSend() {
      clearTimeout(sendTimer);
      sendTimer = setTimeout(function () {
        if (lastResults) transcript = rebuildTranscript(lastResults);
        flushSend();
      }, 220);
    }

    function teardownRec() {
      if (!rec) return;
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch (e) {}
      rec = null;
    }

    function stop(send) {
      if (!active && !rec && !wantSend) return;
      if (send && stopLock) return;
      if (send) stopLock = true;
      wantSend = !!send;
      active = false;
      ui(false);
      if (rec) {
        var r = rec;
        r.onend = function () {
          if (r === rec) rec = null;
          if (lastResults) transcript = rebuildTranscript(lastResults);
          scheduleSend();
        };
        r.onerror = function (ev) {
          if (ev && ev.error === 'aborted') return;
          if (r === rec) rec = null;
          scheduleSend();
        };
        try { r.stop(); } catch (e) { rec = null; scheduleSend(); }
      } else if (send) {
        scheduleSend();
      } else {
        wantSend = false;
        stopLock = false;
      }
    }

    function start(e) {
      if (e) e.preventDefault();
      if (active) return;
      if (typeof opts.canStart === 'function' && !opts.canStart()) return;
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        if (typeof opts.onError === 'function') opts.onError('no-sr');
        return;
      }
      if (typeof opts.onBeforeStart === 'function') opts.onBeforeStart();
      sent = false;
      stopLock = false;
      wantSend = false;
      clearTimeout(sendTimer);
      active = true;
      transcript = '';
      lastResults = null;
      rec = new SR();
      rec.lang = opts.lang || 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = function (ev) {
        lastResults = ev;
        transcript = rebuildTranscript(ev);
      };
      rec.onend = function () {
        if (active) {
          active = false;
          ui(false);
        }
      };
      rec.onerror = function (ev) {
        if (ev && ev.error === 'aborted') return;
        stop(false);
      };
      try {
        rec.start();
      } catch (err) {
        active = false;
        rec = null;
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
      destroy: function () {
        clearTimeout(sendTimer);
        stop(false);
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

  function stopAll() {
    document.querySelectorAll('[data-ptt-mic], [id$="-mic-btn"]').forEach(function (b) {
      var inst = getInst(b);
      if (inst) inst.stop(false);
    });
  }

  return { bind: bind, stop: stop, stopAll: stopAll };
})();
