/**
 * Push-to-Talk mic — hold button to speak, release to send.
 */
var PttMic = (function () {
  'use strict';

  function bind(opts) {
    var btn = typeof opts.btn === 'string' ? document.getElementById(opts.btn) : opts.btn;
    if (!btn) return;

    var rec = null;
    var transcript = '';
    var active = false;

    function ui(listening) {
      if (typeof opts.onUi === 'function') opts.onUi(listening, btn);
    }

    function stop(send) {
      if (!active && !rec) return;
      active = false;
      var text = transcript.trim();
      transcript = '';
      if (rec) {
        try { rec.stop(); } catch (e) {}
        rec = null;
      }
      ui(false);
      if (send && text && typeof opts.onSend === 'function') opts.onSend(text);
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
      active = true;
      transcript = '';
      rec = new SR();
      rec.lang = opts.lang || 'en-US';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = function (ev) {
        transcript = Array.from(ev.results).map(function (r) { return r[0].transcript; }).join('');
      };
      rec.onend = function () { rec = null; };
      rec.onerror = function () { stop(false); };
      try { rec.start(); } catch (err) { active = false; rec = null; ui(false); return; }
      ui(true);
    }

    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', function () { stop(true); });
    btn.addEventListener('mouseleave', function () { if (active) stop(true); });
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', function (e) { e.preventDefault(); stop(true); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  return { bind: bind };
})();
