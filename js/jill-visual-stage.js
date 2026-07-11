/**
 * Escenario visual Jill — pantalla completa, solo el tablero del tema.
 * Sin transcripcion: el audio basta (todos hablan espanol).
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

  /** Prefer the student's ask for accuracy; never let Jill's reply steal the track. */
  function resolveColumn(replyText, bundle, userTopic) {
    var user = String(userTopic || '').trim();
    if (!user) return null;
    // Fuente única del catálogo completo (pedido + sticky ya van en userTopic)
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
      cap.hidden = true;
    }
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
      media.innerHTML = html || '';
      sh.classList.add('jill-stage-active');
      stage.hidden = false;
      active = true;
      currentColumn = col || null;
      requestFullscreen();
    }

    if (!col || typeof JillCanonVisual === 'undefined') {
      var label = (userTopic || text || 'Tema').replace(/\s+/g, ' ').trim().slice(0, 80);
      activate(
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:52vh;padding:32px;background:#f3ebff;border-radius:16px;">'
        + '<div style="text-align:center;max-width:640px;">'
        + '<div style="font-size:12px;font-weight:800;letter-spacing:0.14em;color:#7c3aed;margin-bottom:10px;">JILL · EXPLICACION</div>'
        + '<div style="font-size:22px;font-weight:800;color:#312e81;line-height:1.35;">' + String(label).replace(/</g, '&lt;') + '</div>'
        + '<div style="margin-top:14px;font-size:14px;color:#6d28d9;">Escucha la explicacion — el tablero sigue el tema que pediste</div>'
        + '</div></div>'
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
      clearCaption();
    });

    return true;
  }

  function updateCaption() {
    // No transcript overlay — audio only
    clearCaption();
  }

  function hide() {
    var sh = shell();
    var stage = stageEl();
    if (sh) sh.classList.remove('jill-stage-active');
    if (stage) stage.hidden = true;
    if (mediaEl()) mediaEl().innerHTML = '';
    clearCaption();
    var cap = captionEl();
    if (cap) cap.hidden = false;
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
