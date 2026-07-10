/**
 * Escenario visual Jill - pantalla completa mientras habla y explica.
 * Jill Tutora y Jill Pro comparten este motor; solo cambia el flujo companion en backend/UI.
 */
(function (global) {
  'use strict';

  var active = false;
  var currentColumn = null;
  var autoFsDone = false;

  function shell() {
    return document.getElementById('jill-lesson-shell');
  }

  function stageEl() {
    return document.getElementById('jill-visual-stage');
  }

  function mediaEl() {
    return document.getElementById('jill-stage-media');
  }

  function captionEl() {
    return document.getElementById('jill-stage-caption');
  }

  function detectColumn(text, bundle) {
    if (typeof JillFoundations !== 'undefined' && JillFoundations.detectCanonColumn) {
      return JillFoundations.detectCanonColumn(text, bundle);
    }
    return null;
  }

  function shouldShow(contentType, text, bundle) {
    if (contentType === 'whiteboard') return true;
    var col = detectColumn(text, bundle);
    if (!col) return false;
    var t = String(text || '');
    if (/\b(formula|msi|ranura|whiteboard|pizarr|PC|P \+|V\+ing|gerundio|gerund|-ing\b|to be)\b/i.test(t)) return true;
    if (t.length > 120 && col) return true;
    return false;
  }

  function plainCaption(text) {
    return String(text || '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 280);
  }

  function requestFullscreenOnce() {
    if (autoFsDone) return;
    var sh = shell();
    if (!sh) return;
    var already = document.fullscreenElement === sh || document.webkitFullscreenElement === sh;
    if (already) { autoFsDone = true; return; }
    var req = sh.requestFullscreen || sh.webkitRequestFullscreen;
    if (!req) return;
    autoFsDone = true;
    req.call(sh).catch(function () { autoFsDone = false; });
  }

  function show(text, contentType, bundle) {
    if (!shouldShow(contentType, text, bundle)) {
      hide();
      return false;
    }
    var col = detectColumn(text, bundle) || 'progressive';
    var sh = shell();
    var stage = stageEl();
    var media = mediaEl();
    if (!sh || !stage || !media || typeof JillCanonVisual === 'undefined') return false;

    var fallback = null;
    if (typeof JillFoundations !== 'undefined' && JillFoundations.CANON_BY_COLUMN) {
      fallback = JillFoundations.CANON_BY_COLUMN[col];
    }

    JillCanonVisual.loadConfig().then(function () {
      media.innerHTML = JillCanonVisual.renderStage(col, fallback);
      if (captionEl()) captionEl().textContent = plainCaption(text);
      sh.classList.add('jill-stage-active');
      stage.hidden = false;
      active = true;
      currentColumn = col;
      requestFullscreenOnce();
    });

    return true;
  }

  function updateCaption(text) {
    if (!active || !captionEl()) return;
    captionEl().textContent = plainCaption(text);
  }

  function hide() {
    var sh = shell();
    var stage = stageEl();
    if (sh) sh.classList.remove('jill-stage-active');
    if (stage) stage.hidden = true;
    if (mediaEl()) mediaEl().innerHTML = '';
    if (captionEl()) captionEl().textContent = '';
    active = false;
    currentColumn = null;
  }

  function resetSession() {
    autoFsDone = false;
    hide();
  }

  function isActive() {
    return active;
  }

  global.JillVisualStage = {
    show: show,
    hide: hide,
    updateCaption: updateCaption,
    shouldShow: shouldShow,
    isActive: isActive,
    resetSession: resetSession
  };
})(typeof window !== 'undefined' ? window : globalThis);
