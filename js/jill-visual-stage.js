/**
 * Escenario visual Jill — tablero SVG a pantalla completa + interacción.
 * Sin bloques de texto-ejercicio: el SVG enseña; el audio guía.
 */
(function (global) {
  'use strict';

  var active = false;
  var currentColumn = null;
  var pulseTimer = null;
  var pulseStep = 0;

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

  function resolveColumn(replyText, bundle, userTopic) {
    var user = String(userTopic || '').trim();
    if (!user) return null;
    if (typeof JillCanonRouter !== 'undefined' && JillCanonRouter.resolveAskId) {
      var id = JillCanonRouter.resolveAskId(user, '');
      if (id) return id;
    }
    var fromUser = detectColumn(user, bundle);
    if (fromUser) return fromUser;
    return null;
  }

  function isExplainTurn(contentType, text, userTopic) {
    if (contentType === 'whiteboard' || contentType === 'example') return true;
    var user = String(userTopic || '');
    var reply = String(text || '');
    if (/qu[eé] gusto|de nuevo|podemos charlar|qu[eé] quer[eé]s (hoy|hacer|charlar)|bienvenid/i.test(reply)
      && !/\b(explic|ens[eé][nñ]|negaci|gerundio|f[oó]rmula|ranura|preposici|tiempo|modal|pasado|futuro|continuo|there|hay|imagen|pizarr|tablero)\b/i.test(user)) {
      return false;
    }
    if (user && typeof JillCanonRouter !== 'undefined') {
      if (JillCanonRouter.resolveAskId && JillCanonRouter.resolveAskId(user, '')) return true;
      if (JillCanonRouter.pickTrackId && JillCanonRouter.pickTrackId(user)) return true;
      if (JillCanonRouter.wantsVisual && JillCanonRouter.wantsVisual(user)) return true;
    }
    var blob = user + ' ' + reply;
    return /\b(explic|ens[eé][nñ]|no entiendo|duda|c[oó]mo se|qu[eé] es|f[oó]rmula|ranura|auxiliar|negaci|gerundio|estructura|mec[aá]nica|patr[oó]n|modelo|ejemplo|te qued[oó]|arm[aá]|whiteboard|pizarr|imagen|tablero|to be|will have|there is|there are|preposici|tiempo verbal|modal|moneda|art[ií]culo|comparativ|pronombre|pregunta|pasado simple|presente|futuro)\b/i.test(blob);
  }

  function shouldShow(contentType, text, bundle, userTopic) {
    if (!isExplainTurn(contentType, text, userTopic)) return false;
    return !!resolveColumn(text, bundle, userTopic);
  }

  function requestFullscreen() {
    var sh = shell();
    if (!sh) return;
    var already = document.fullscreenElement === sh || document.webkitFullscreenElement === sh;
    if (already) return;
    var req = sh.requestFullscreen || sh.webkitRequestFullscreen;
    if (!req) return;
    req.call(sh).catch(function () {});
  }

  function clearCaption() {
    var cap = captionEl();
    if (cap) {
      cap.textContent = '';
      cap.innerHTML = '';
      cap.hidden = true;
    }
  }

  function stopPulse() {
    if (pulseTimer) {
      clearInterval(pulseTimer);
      pulseTimer = null;
    }
    pulseStep = 0;
  }

  /** Zonas táctiles sobre el SVG — sin párrafos; solo glow interactivo. */
  function interactOverlayHtml(columnId) {
    var zones = 3;
    if (columnId === 'prepositions' || columnId === 'prepositions_time') zones = 3;
    if (columnId === 'negations' || columnId === 'articles') zones = 2;
    if (columnId === 'overview') zones = 4;
    var html = '<div class="jill-svg-interact" data-track="' + String(columnId || '') + '" aria-hidden="false">';
    for (var i = 0; i < zones; i++) {
      html += '<button type="button" class="jill-svg-hotspot" data-step="' + i + '" aria-label="Zona ' + (i + 1) + '"></button>';
    }
    html += '</div>';
    return html;
  }

  function wireInteract(root) {
    if (!root) return;
    var layer = root.querySelector('.jill-svg-interact');
    if (!layer) return;
    var spots = layer.querySelectorAll('.jill-svg-hotspot');
    function light(idx) {
      for (var i = 0; i < spots.length; i++) {
        if (i === idx) spots[i].classList.add('is-lit');
        else spots[i].classList.remove('is-lit');
      }
    }
    for (var s = 0; s < spots.length; s++) {
      (function (btn, idx) {
        btn.addEventListener('click', function (ev) {
          ev.preventDefault();
          light(idx);
          pulseStep = idx;
        });
      })(spots[s], s);
    }
    stopPulse();
    light(0);
    pulseTimer = setInterval(function () {
      if (!active || !spots.length) return;
      pulseStep = (pulseStep + 1) % spots.length;
      light(pulseStep);
    }, 2200);
  }

  function show(text, contentType, bundle, opts) {
    opts = opts || {};
    var userTopic = opts.userTopic || '';
    if (!shouldShow(contentType, text, bundle, userTopic)) {
      return false;
    }
    var col = opts.column || resolveColumn(text, bundle, userTopic);
    var sh = shell();
    var stage = stageEl();
    var media = mediaEl();
    if (!sh || !stage || !media) return false;

    clearCaption();

    function activate(html) {
      media.innerHTML = (html || '') + interactOverlayHtml(col);
      sh.classList.add('jill-stage-active');
      stage.hidden = false;
      active = true;
      currentColumn = col || null;
      requestFullscreen();
      wireInteract(media);
    }

    if (!col || typeof JillCanonVisual === 'undefined') {
      activate(
        '<div class="jill-canon-stage-frame" style="position:relative;width:100%;height:100%;min-height:280px;border-radius:16px;overflow:hidden;background:#f3ebff;"></div>'
      );
      return true;
    }

    var fallback = null;
    if (typeof JillCanonRouter !== 'undefined' && JillCanonRouter.byColumn) {
      fallback = JillCanonRouter.byColumn()[col] || null;
    }
    if (!fallback && typeof JillFoundations !== 'undefined' && JillFoundations.CANON_BY_COLUMN) {
      fallback = JillFoundations.CANON_BY_COLUMN[col];
    }

    JillCanonVisual.loadConfig().then(function () {
      activate(JillCanonVisual.renderStage(col, fallback));
    });

    return true;
  }

  function updateCaption() {
    // Sin transcript ni drill de texto — el SVG + audio bastan
    clearCaption();
  }

  function hide() {
    stopPulse();
    var sh = shell();
    var stage = stageEl();
    if (sh) sh.classList.remove('jill-stage-active');
    if (stage) stage.hidden = true;
    if (mediaEl()) mediaEl().innerHTML = '';
    clearCaption();
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
    shouldShow: function (ct, text, bundle) { return shouldShow(ct, text, bundle, ''); },
    isActive: isActive,
    resetSession: resetSession,
    requestFullscreen: requestFullscreen,
    resolveColumn: resolveColumn
  };
})(typeof window !== 'undefined' ? window : globalThis);
