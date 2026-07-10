/**
 * Escenario visual Jill - pantalla completa mientras habla y explica.
 * Jill Tutora y Jill Pro comparten este motor.
 */
(function (global) {
  'use strict';

  var active = false;
  var currentColumn = null;

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

  function isExplainText(text) {
    var t = String(text || '');
    return /\b(explic|f[oó]rmula|ranura|auxiliar|negaci|gerundio|estructura|mec[aá]nica|patr[oó]n|modelo|ejemplo|te qued[oó]|arm[aá]|P\s*\+|AUX|whiteboard|pizarr|to be|will have|there is|there are)\b/i.test(t);
  }

  function shouldShow(contentType, text, bundle) {
    if (contentType === 'whiteboard' || contentType === 'example') return true;
    var col = detectColumn(text, bundle);
    var t = String(text || '');
    if (isExplainText(t)) return true;
    if (!col) return false;
    if (/\b(formula|msi|ranura|whiteboard|pizarr|PC|P \+|V\+ing|gerundio|gerund|-ing\b|to be)\b/i.test(t)) return true;
    if (t.length > 100 && col) return true;
    return false;
  }

  function plainCaption(text) {
    return String(text || '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 900);
  }

  /** Enter fullscreen while we still have a user gesture (send/mic). */
  function requestFullscreen() {
    var sh = shell();
    if (!sh) return;
    var already = document.fullscreenElement === sh || document.webkitFullscreenElement === sh;
    if (already) return;
    var req = sh.requestFullscreen || sh.webkitRequestFullscreen;
    if (!req) return;
    req.call(sh).catch(function () {});
  }

  function show(text, contentType, bundle) {
    if (!shouldShow(contentType, text, bundle)) {
      return false;
    }
    var col = detectColumn(text, bundle);
    // Never force a random PC board — if no column match, caption-only stage
    var sh = shell();
    var stage = stageEl();
    var media = mediaEl();
    if (!sh || !stage || !media) return false;

    var caption = plainCaption(text);
    if (captionEl()) captionEl().textContent = caption;

    if (!col || typeof JillCanonVisual === 'undefined') {
      media.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:200px;padding:24px;color:#312e81;font-size:15px;font-weight:700;text-align:center;background:#f3ebff;border-radius:16px;">Explicacion Jill</div>';
      sh.classList.add('jill-stage-active');
      stage.hidden = false;
      active = true;
      currentColumn = null;
      requestFullscreen();
      return true;
    }

    var fallback = null;
    if (typeof JillFoundations !== 'undefined' && JillFoundations.CANON_BY_COLUMN) {
      fallback = JillFoundations.CANON_BY_COLUMN[col];
    }

    JillCanonVisual.loadConfig().then(function () {
      media.innerHTML = JillCanonVisual.renderStage(col, fallback);
      if (captionEl()) captionEl().textContent = caption;
      sh.classList.add('jill-stage-active');
      stage.hidden = false;
      active = true;
      currentColumn = col;
      requestFullscreen();
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
    resetSession: resetSession,
    requestFullscreen: requestFullscreen
  };
})(typeof window !== 'undefined' ? window : globalThis);
