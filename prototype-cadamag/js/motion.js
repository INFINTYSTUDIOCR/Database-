/**
 * Cadamag prototype — Global Cinematic Motion System
 * Tokens live in css/motion.css. This file owns reveal orchestration + holo + welcome video.
 *
 * Reveal: IntersectionObserver — acople al entrar, desacople al salir del viewport.
 * Holo cycle (11500ms): intro → reveal → stable → soft-dim → bridge. Never empties.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REVEAL_THRESHOLD = [0, 0.08, 0.18, 0.35];
  var REVEAL_ROOT_MARGIN = '0px 0px -12% 0px';
  var REVEAL_OPTS = { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN };

  var INTRO_MS = 60;
  var REVEAL_MS = 2800;
  var STABLE_MS = 5200;
  var HIDE_MS = 420;
  var BRIDGE_MS = 180;
  var SCAN_MS = 2000;
  var CHAR_TICK_MS = 55;
  var CYCLE_MS = INTRO_MS + REVEAL_MS + STABLE_MS + HIDE_MS + BRIDGE_MS;

  if (window.matchMedia('(max-width: 768px)').matches) {
    REVEAL_MS = 2600;
    STABLE_MS = 5600;
    SCAN_MS = 1600;
    CHAR_TICK_MS = 70;
    CYCLE_MS = INTRO_MS + REVEAL_MS + STABLE_MS + HIDE_MS + BRIDGE_MS;
  }

  var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+-_';

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function markIn(el) {
    if (el) el.classList.add('is-in');
  }

  function markOut(el) {
    if (el) el.classList.remove('is-in');
  }

  function markAllIn(nodes) {
    nodes.forEach(function (el) { markIn(el); });
  }

  /** Observe once; fire callback on first intersect, then disconnect. */
  function observeOnce(el, onEnter, options) {
    if (!el) return;
    if (reduce || !('IntersectionObserver' in window)) {
      onEnter(el);
      return;
    }
    var done = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (done || !entry.isIntersecting) return;
          done = true;
          onEnter(entry.target);
          io.disconnect();
        });
      },
      options || REVEAL_OPTS
    );
    io.observe(el);
  }

  /**
   * Acople / desacople continuo: .is-in al entrar, se quita al salir.
   * El texto se acopla al viewport y se desacopla de lo que queda atrás.
   */
  function observeToggle(el, options) {
    if (!el) return;
    if (reduce || !('IntersectionObserver' in window)) {
      markIn(el);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.06) {
            markIn(entry.target);
          } else if (!entry.isIntersecting) {
            markOut(entry.target);
          }
        });
      },
      options || REVEAL_OPTS
    );
    io.observe(el);
  }

  /** Hero load entrance — single shot, no scroll re-fire. */
  function revealEntrances() {
    var nodes = document.querySelectorAll(
      '.enter, .enter-person, .enter-dash, .enter-float, .enter-chip'
    );
    if (!nodes.length) return;

    if (reduce) {
      markAllIn(nodes);
      return;
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        markAllIn(nodes);
      });
    });
  }

  /** Section chapter reveal — acople / desacople con el scroll. */
  function initSceneReveal(selector) {
    var section = document.querySelector(selector);
    if (!section) return;
    observeToggle(section);
  }

  /**
   * Auto-tag common editorial nodes with Camilo-like scroll directions
   * (left / top) when they lack an explicit data-reveal.
   * Does not touch hero .enter* or nav/footer chrome.
   */
  function autoTagScrollReveals() {
    if (document.documentElement.hasAttribute('data-motion-manual')) return;

    var dirs = ['left', 'top', 'left', 'top'];
    var selectors = [
      '.sp-hero .page-eyebrow',
      '.sp-hero .page-hero-title',
      '.sp-hero .page-lead',
      '.sp-hero .page-cta-row',
      '.sp-hero .sp-visual',
      '.sp-section .sp-section-title',
      '.sp-section .sp-section-lead',
      '.sp-section .sp-prose',
      '.sp-section .sp-list',
      '.sp-section .chips',
      '.sp-cta-band',
      '.page-hero .page-eyebrow',
      '.page-hero h1',
      '.page-hero .page-lead',
      '.page-section h2',
      '.page-section .section-lead',
      '.know-copy > *',
      '.routes-copy > *',
      '.results-copy > *',
      '.eco-panel',
      'main .site-page h2',
      'main .site-page h3'
    ];

    var idx = 0;
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest('nav, .site-nav, footer, .cadamag-credit, .prototype-badge, .site-header')) return;
        if (el.closest('.enter, .enter-title, .enter-person, [data-holo-live]')) return;
        if (el.classList.contains('know-reveal') || el.classList.contains('routes-reveal')) return;
        // Upgrade bare data-reveal / cinematic sections to directional entrances
        var existing = el.getAttribute('data-reveal');
        if (existing && existing !== '' && existing !== 'soft' && existing !== 'cinematic') {
          return;
        }
        if (!el.textContent || !String(el.textContent).trim()) return;
        var dir = dirs[idx % dirs.length];
        el.setAttribute('data-reveal', dir);
        if (!el.hasAttribute('data-delay')) {
          el.setAttribute('data-delay', String((idx % 4) + 1));
        }
        idx += 1;
      });
    });

    // Directional upgrade for section-level bare reveals
    document.querySelectorAll('[data-reveal=""], [data-reveal]:not([data-reveal="left"]):not([data-reveal="right"]):not([data-reveal="top"]):not([data-reveal="up"]):not([data-reveal="down"]):not([data-reveal="soft"]):not([data-reveal="cinematic"])').forEach(function (el) {
      var val = el.getAttribute('data-reveal');
      if (val && val !== '') return;
      el.setAttribute('data-reveal', dirs[idx % dirs.length]);
      if (!el.hasAttribute('data-delay')) el.setAttribute('data-delay', String((idx % 4) + 1));
      idx += 1;
    });
  }

  /**
   * Generic [data-reveal] nodes — Camilo-like scroll entrances.
   * Skips nodes already covered by section .is-in parent patterns.
   */
  function initDataReveals() {
    autoTagScrollReveals();

    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;

    if (reduce) {
      markAllIn(nodes);
      return;
    }

    nodes.forEach(function (el) {
      if (el.classList.contains('know-reveal') || el.classList.contains('routes-reveal') || el.classList.contains('results-reveal')) {
        return;
      }
      /* Hero load entrances stay one-shot via .enter*; scroll copy toggles */
      if (el.classList.contains('enter') || el.closest('.hero, .hero-stage, [data-hero]')) {
        observeOnce(el, function (target) { markIn(target); });
        return;
      }
      observeToggle(el);
    });
  }

  function isLockedChar(ch) {
    return ch === ' ' || ch === '\n' || /[¿?¡!.,;:'"\-–—…]/.test(ch);
  }

  function paintHeadline(el, target, resolvedCount) {
    var WINDOW = window.matchMedia('(max-width: 768px)').matches ? 2 : 3;
    var len = target.length;
    var out = '';
    for (var i = 0; i < len; i++) {
      var real = target[i];
      if (real === '\n') {
        out += '<br>';
      } else if (isLockedChar(real) || i < resolvedCount) {
        out += real;
      } else if (i < resolvedCount + WINDOW) {
        out += CHARSET[(Math.random() * CHARSET.length) | 0];
      } else {
        out += real;
      }
    }
    el.innerHTML = out;
  }

  function scrambleReveal(el, target, durationMs) {
    return new Promise(function (resolve) {
      var len = target.length;
      var start = performance.now();
      var lastTick = -1;

      function frame(now) {
        var elapsed = now - start;
        var t = Math.min(1, elapsed / durationMs);
        var resolved = Math.min(len, Math.floor(t * len));
        var tick = Math.floor(elapsed / CHAR_TICK_MS);
        if (tick !== lastTick || t >= 1) {
          lastTick = tick;
          paintHeadline(el, target, resolved);
        }
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          paintHeadline(el, target, len);
          resolve();
        }
      }

      paintHeadline(el, target, 0);
      requestAnimationFrame(frame);
    });
  }

  function runScan(scanEl) {
    if (!scanEl) return;
    scanEl.classList.remove('is-active');
    void scanEl.offsetWidth;
    scanEl.classList.add('is-active');
    window.setTimeout(function () {
      scanEl.classList.remove('is-active');
    }, SCAN_MS + 80);
  }

  function resolveHeadlineTarget(root) {
    var sizer = root.querySelector('.holo-sizer .holo-headline');
    if (sizer) {
      var parts = [];
      sizer.childNodes.forEach(function (node) {
        if (node.nodeName === 'BR') {
          parts.push('\n');
        } else {
          parts.push(node.textContent || '');
        }
      });
      var fromSizer = parts.join('').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      if (fromSizer.trim()) return fromSizer;
    }
    return root.getAttribute('data-holo-headline') || '';
  }

  /** Wrap a plain heading into the same holo markup as the hero title. */
  function wrapTitleAsHolo(el) {
    if (!el || el.querySelector('[data-holo-live]')) return el;

    var html = el.innerHTML.trim();
    if (!html) return el;

    var plainParts = [];
    el.childNodes.forEach(function (node) {
      if (node.nodeName === 'BR') plainParts.push('\n');
      else plainParts.push(node.textContent || '');
    });
    var plain = plainParts.join('').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!plain) return el;

    el.setAttribute('data-holo-headline', plain.replace(/\n/g, ' '));
    el.classList.add('has-holo');
    el.innerHTML =
      '<span class="sr-only">' + plain.replace(/\n/g, ' ') + '</span>' +
      '<span class="hero-holo title-holo" aria-hidden="true">' +
        '<span class="holo-sizer"><span class="holo-headline">' + html + '</span></span>' +
        '<span class="holo-live" data-holo-live>' +
          '<span class="holo-scan" data-holo-scan aria-hidden="true"></span>' +
          '<span class="holo-headline" data-holo-line="headline"></span>' +
        '</span>' +
      '</span>';
    return el;
  }

  /**
   * Same scramble loop as the hero title.
   * Runs in bucle while the title is in (or near) the viewport; pauses when out.
   */
  function startHoloCycle(root) {
    if (!root) return;

    var headlineText = resolveHeadlineTarget(root);
    var live = root.querySelector('[data-holo-live]');
    var headlineEl = root.querySelector('[data-holo-line="headline"]');
    var scanEl = root.querySelector('[data-holo-scan]');

    if (!live || !headlineEl || !headlineText) return;

    if (reduce) {
      root.classList.add('holo-static');
      paintHeadline(headlineEl, headlineText, headlineText.length);
      return;
    }

    root.classList.remove('holo-static');
    paintHeadline(headlineEl, headlineText, headlineText.length);
    root.dataset.holoCycleMs = String(CYCLE_MS);

    var running = false;
    var loopActive = false;
    var firstPass = true;

    async function cycle() {
      if (loopActive) return;
      loopActive = true;
      while (running) {
        /* First kick: scramble immediately — no intro lag */
        if (firstPass) {
          firstPass = false;
          live.classList.remove('is-hiding', 'is-entering');
        } else {
          live.classList.remove('is-hiding');
          live.classList.add('is-entering');
          await wait(INTRO_MS);
          if (!running) break;
          live.classList.remove('is-entering');
        }

        headlineEl.classList.add('is-decoding');
        runScan(scanEl);
        await scrambleReveal(headlineEl, headlineText, REVEAL_MS);
        headlineEl.classList.remove('is-decoding');
        if (!running) break;

        await wait(STABLE_MS);
        if (!running) break;

        live.classList.add('is-hiding');
        await wait(HIDE_MS);
        await wait(BRIDGE_MS);
      }
      loopActive = false;
      paintHeadline(headlineEl, headlineText, headlineText.length);
      live.classList.remove('is-hiding', 'is-entering');
    }

    function start() {
      if (running) return;
      running = true;
      firstPass = true;
      cycle();
    }

    function stop() {
      running = false;
    }

    /* Hero always loops; section titles loop when visible */
    if (root.id === 'hero-title' || root.hasAttribute('data-holo-always')) {
      start();
      return;
    }

    if (!('IntersectionObserver' in window)) {
      start();
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start();
          else stop();
        });
      },
      { threshold: 0.05, rootMargin: '12% 0px 8% 0px' }
    );
    io.observe(root);
  }

  function initHolo() {
    var roots = [];

    var hero = document.getElementById('hero-title');
    if (hero) roots.push(hero);

    var selectors = [
      '[data-holo]',
      '.scene-know-title',
      '.routes-title',
      '.eco-title',
      '.results-title',
      '.page-hero-title',
      '.sp-section-title'
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.id === 'hero-title') return;
        if (el.closest('nav, footer, .cadamag-credit, .site-header')) return;
        wrapTitleAsHolo(el);
        roots.push(el);
      });
    });

    var seen = [];
    roots.forEach(function (el) {
      if (seen.indexOf(el) !== -1) return;
      seen.push(el);
      startHoloCycle(el);
    });
  }

  function initWelcomeVideo() {
    var video = document.getElementById('welcome-video');
    var btn = document.getElementById('welcome-audio-btn');
    if (!video) return;

    var label = btn ? btn.querySelector('[data-audio-label]') : null;
    var idleLabel = 'Escuchar bienvenida';
    var playingLabel = 'Reproduciendo...';
    var audioMode = false;

    function setBtnPlaying(on) {
      if (!btn || !label) return;
      btn.classList.toggle('is-playing', on);
      btn.setAttribute('aria-label', on ? 'Reproduciendo bienvenida' : 'Escuchar bienvenida con audio');
      label.textContent = on ? playingLabel : idleLabel;
    }

    function resetToIdle() {
      audioMode = false;
      video.muted = true;
      setBtnPlaying(false);
      try {
        if (video.ended && video.duration && isFinite(video.duration)) {
          video.currentTime = Math.max(0, video.duration - 0.05);
        }
      } catch (e) { /* ignore seek errors */ }
    }

    video.loop = false;
    video.muted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;

    var playIntro = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { /* autoplay blocked */ });
      }
    };

    if (video.readyState >= 2) {
      playIntro();
    } else {
      video.addEventListener('loadeddata', playIntro, { once: true });
    }

    video.addEventListener('ended', function () {
      if (audioMode) {
        resetToIdle();
      } else {
        try {
          if (video.duration && isFinite(video.duration)) {
            video.currentTime = Math.max(0, video.duration - 0.05);
          }
        } catch (e) { /* ignore */ }
        video.pause();
      }
    });

    if (!btn) return;

    btn.addEventListener('click', function () {
      audioMode = true;
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) { /* ignore */ }
      video.muted = false;
      video.volume = 1;
      setBtnPlaying(true);
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          resetToIdle();
        });
      }
    });
  }

  function init() {
    revealEntrances();
    initHolo();
    initWelcomeVideo();
    initSceneReveal('.scene-know');
    initSceneReveal('.scene-routes');
    initSceneReveal('.scene-results');
    initDataReveals();
  }

  /* Public hooks for future sections (Ecosistema cards, etc.) */
  window.InfinityMotion = {
    observeOnce: observeOnce,
    observeToggle: observeToggle,
    initSceneReveal: initSceneReveal,
    markIn: markIn,
    markOut: markOut,
    reduce: reduce
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
