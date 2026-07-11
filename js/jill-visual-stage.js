/**
 * Escenario visual Jill — SVG interactivo + drill (tap + score oral).
 * Sin bloques de texto-ejercicio: glow / anillo / audio.
 */
(function (global) {
  'use strict';

  var active = false;
  var currentColumn = null;
  var pulseTimer = null;

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
    return detectColumn(user, bundle);
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
  }

  function zoneCount(columnId) {
    if (typeof JillCanonDrill !== 'undefined' && JillCanonDrill.zoneCount) {
      return JillCanonDrill.zoneCount(columnId);
    }
    if (columnId === 'negations' || columnId === 'there' || columnId === 'future' || columnId === 'past' || columnId === 'present') return 2;
    if (columnId === 'overview') return 4;
    return 3;
  }

  function interactOverlayHtml(columnId) {
    var zones = zoneCount(columnId);
    var html = '<div class="jill-svg-interact" data-track="' + String(columnId || '') + '">';
    for (var i = 0; i < zones; i++) {
      html += '<button type="button" class="jill-svg-hotspot" data-step="' + i + '" aria-label="Zona ' + (i + 1) + '"></button>';
    }
    html += '</div>';
    html += '<div class="jill-drill-ring" aria-hidden="true"><svg viewBox="0 0 36 36">'
      + '<path class="jill-drill-ring-bg" d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"/>'
      + '<path class="jill-drill-ring-fg" stroke-dasharray="0,100" d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"/>'
      + '</svg></div>';
    return html;
  }

  function paintTarget(spots, target) {
    for (var i = 0; i < spots.length; i++) {
      spots[i].classList.remove('is-lit', 'is-ok', 'is-miss');
      if (i === target) spots[i].classList.add('is-lit');
    }
  }

  function setRing(pct) {
    var media = mediaEl();
    if (!media) return;
    var fg = media.querySelector('.jill-drill-ring-fg');
    if (!fg) return;
    var v = Math.max(0, Math.min(100, pct || 0));
    fg.setAttribute('stroke-dasharray', v + ',100');
    var ring = media.querySelector('.jill-drill-ring');
    if (ring) {
      ring.classList.toggle('is-hot', v >= 70);
      ring.classList.toggle('is-warm', v >= 40 && v < 70);
    }
  }

  function flashSpot(spot, ok) {
    if (!spot) return;
    spot.classList.remove('is-ok', 'is-miss');
    spot.classList.add(ok ? 'is-ok' : 'is-miss');
    setTimeout(function () {
      spot.classList.remove('is-ok', 'is-miss');
    }, 520);
  }

  function wireInteract(root, columnId) {
    if (!root) return;
    var layer = root.querySelector('.jill-svg-interact');
    if (!layer) return;
    var spots = layer.querySelectorAll('.jill-svg-hotspot');
    var challenge = { target: 0 };
    if (typeof JillCanonDrill !== 'undefined') {
      challenge = JillCanonDrill.start(columnId) || challenge;
    }
    paintTarget(spots, challenge.target || 0);
    setRing(0);

    for (var s = 0; s < spots.length; s++) {
      (function (btn, idx) {
        btn.addEventListener('click', function (ev) {
          ev.preventDefault();
          var result = { ok: false, challenge: { target: 0 }, scorePct: 0 };
          if (typeof JillCanonDrill !== 'undefined') {
            result = JillCanonDrill.registerTap(idx);
          } else {
            result.ok = idx === challenge.target;
            if (result.ok) challenge.target = (challenge.target + 1) % spots.length;
            result.challenge = challenge;
          }
          flashSpot(btn, !!result.ok);
          var next = (result.challenge && result.challenge.target != null) ? result.challenge.target : 0;
          setTimeout(function () {
            paintTarget(spots, next);
          }, 280);
          var snap = (typeof JillCanonDrill !== 'undefined' && JillCanonDrill.snapshot)
            ? JillCanonDrill.snapshot()
            : { combined: result.scorePct || 0 };
          setRing(snap.combined || result.scorePct || 0);
          if (typeof global.jillOnCanonTap === 'function') {
            try { global.jillOnCanonTap(result); } catch (e) { /* ignore */ }
          }
        });
      })(spots[s], s);
    }

    stopPulse();
    // Soft reminder pulse on the target only
    pulseTimer = setInterval(function () {
      if (!active || !spots.length) return;
      var t = 0;
      if (typeof JillCanonDrill !== 'undefined' && JillCanonDrill.getChallenge) {
        t = JillCanonDrill.getChallenge().target || 0;
      }
      paintTarget(spots, t);
    }, 2400);
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
      wireInteract(media, col);
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
    clearCaption();
  }

  /** Score spoken line against active track; update ring. */
  function scoreOral(text) {
    if (!active || typeof JillCanonDrill === 'undefined') return null;
    var trackId = currentColumn;
    var result = JillCanonDrill.scoreUtterance(text, trackId);
    var snap = JillCanonDrill.snapshot();
    setRing(snap.combined || result.score || 0);
    var media = mediaEl();
    if (media) {
      media.classList.remove('jill-oral-ok', 'jill-oral-miss');
      media.classList.add(result.ok ? 'jill-oral-ok' : 'jill-oral-miss');
      setTimeout(function () {
        media.classList.remove('jill-oral-ok', 'jill-oral-miss');
      }, 700);
    }
    return result;
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

  function getTrackId() {
    return currentColumn;
  }

  global.JillVisualStage = {
    show: show,
    hide: hide,
    updateCaption: updateCaption,
    scoreOral: scoreOral,
    shouldShow: function (ct, text, bundle) { return shouldShow(ct, text, bundle, ''); },
    isActive: isActive,
    getTrackId: getTrackId,
    resetSession: resetSession,
    requestFullscreen: requestFullscreen,
    resolveColumn: resolveColumn
  };
})(typeof window !== 'undefined' ? window : globalThis);
