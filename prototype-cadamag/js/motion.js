/**
 * Cadamag prototype — Global Cinematic Motion System
 * Tokens live in css/motion.css. This file owns reveal orchestration + keyword holo + welcome video.
 *
 * Reveal: IntersectionObserver — acople al entrar, desacople al salir del viewport.
 * Keyword holo: one semantic word per title — same scramble/blur cycle as the old
 * full-title holo, looping while visible (hero always). Rest of title stays sharp.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REVEAL_THRESHOLD = [0, 0.08, 0.18, 0.35];
  var REVEAL_ROOT_MARGIN = '0px 0px -12% 0px';
  var REVEAL_OPTS = { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN };

  /* Same cycle language as the previous full-title holo */
  var INTRO_MS = 60;
  var REVEAL_MS = 2800;
  var STABLE_MS = 5200;
  var HIDE_MS = 420;
  var BRIDGE_MS = 180;
  var CHAR_TICK_MS = 55;
  var CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+-_';
  var CYCLE_MS = INTRO_MS + REVEAL_MS + STABLE_MS + HIDE_MS + BRIDGE_MS;

  if (window.matchMedia('(max-width: 768px)').matches) {
    REVEAL_MS = 2600;
    STABLE_MS = 5600;
    CHAR_TICK_MS = 70;
    CYCLE_MS = INTRO_MS + REVEAL_MS + STABLE_MS + HIDE_MS + BRIDGE_MS;
  }

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

  var HOLO_STOPWORDS = {
    el: 1, la: 1, los: 1, las: 1, un: 1, una: 1, unos: 1, unas: 1,
    de: 1, del: 1, al: 1, a: 1, en: 1, con: 1, sin: 1, por: 1, para: 1,
    y: 1, o: 1, u: 1, que: 1, qué: 1, como: 1, cómo: 1, cuando: 1, más: 1,
    te: 1, tu: 1, tus: 1, se: 1, es: 1, lo: 1, le: 1, les: 1, me: 1,
    mi: 1, mis: 1, su: 1, sus: 1, no: 1, si: 1, sí: 1, ya: 1, hay: 1,
    the: 1, of: 1, and: 1, to: 1, in: 1, for: 1, a: 1, an: 1
  };

  /** Semantic keyword map — first matching snippet wins. */
  var HOLO_KEYWORD_RULES = [
    [/en blanco|quedás en blanco/i, 'blanco'],
    [/de lo que creés/i, 'creés'],
    [/mismo lugar/i, 'lugar'],
    [/entrena contigo/i, 'entrena'],
    [/bajo presión/i, 'presión'],
    [/qué desarrollás/i, 'desarrollás'],
    [/cómo se usa/i, 'usa'],
    [/para quién/i, 'quién'],
    [/qué eleva/i, 'eleva'],
    [/qué hace/i, 'hace'],
    [/cómo funciona/i, 'funciona'],
    [/cómo se ve/i, 've'],
    [/qué podés/i, 'podés'],
    [/qué incluye/i, 'incluye'],
    [/qué es\b/i, 'Qué']
  ];

  function titlePlainText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.holo-follow, .holo-context, .sr-only, .hero-holo, .holo-live, .holo-sizer').forEach(function (n) {
      n.remove();
    });
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function resolveKeyword(el) {
    var attr = el.getAttribute('data-holo-keyword') || el.getAttribute('data-holo-highlight');
    if (attr && attr.trim()) return attr.trim();

    var plain = titlePlainText(el);
    for (var i = 0; i < HOLO_KEYWORD_RULES.length; i++) {
      if (HOLO_KEYWORD_RULES[i][0].test(plain)) return HOLO_KEYWORD_RULES[i][1];
    }

    var words = plain.replace(/[¿?¡!.,;:"""«»]/g, '').split(/\s+/).filter(Boolean);
    var candidates = words.filter(function (w) {
      return w.length >= 4 && !HOLO_STOPWORDS[w.toLowerCase()];
    });
    if (candidates.length) return candidates[candidates.length - 1];
    for (var j = words.length - 1; j >= 0; j--) {
      if (!HOLO_STOPWORDS[words[j].toLowerCase()]) return words[j];
    }
    return '';
  }

  /**
   * Wrap the first case-insensitive match of keyword in a text node.
   * Preserves <br> and existing markup; skips follow/context/sr-only.
   */
  function wrapKeyword(el, keyword) {
    if (!el || !keyword) return null;
    var existing = el.querySelector('.holo-keyword');
    if (existing) return existing;

    var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(escaped, 'i');
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('.holo-follow, .holo-context, .sr-only, .holo-keyword, script, style')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue || '';
      var m = text.match(re);
      if (!m) continue;
      var idx = m.index;
      var matched = m[0];
      var before = text.slice(0, idx);
      var after = text.slice(idx + matched.length);
      var span = document.createElement('span');
      span.className = 'holo-keyword';
      span.setAttribute('data-holo-keyword-target', '');
      span.textContent = matched;
      var parent = node.parentNode;
      if (before) parent.insertBefore(document.createTextNode(before), node);
      parent.insertBefore(span, node);
      if (after) parent.insertBefore(document.createTextNode(after), node);
      parent.removeChild(node);
      return span;
    }
    return null;
  }

  /**
   * Collapse legacy dual-layer holo markup (sr-only + aria-hidden live) into visible text.
   * Keeps follow/context. Ensures one accessible heading without duplicates.
   */
  function unwrapLegacyHolo(el) {
    if (!el) return;
    var liveLine = el.querySelector('[data-holo-line="headline"]');
    var sizer = el.querySelector('.holo-sizer .holo-headline');
    var follow = el.querySelector('.holo-follow');
    var context = el.querySelector('.holo-context');
    var followHtml = follow ? follow.outerHTML : '';
    var contextHtml = context ? context.outerHTML : '';

    var headlineHtml = '';
    if (sizer && sizer.innerHTML.trim()) {
      headlineHtml = sizer.innerHTML.trim();
    } else if (liveLine && liveLine.innerHTML.trim()) {
      headlineHtml = liveLine.innerHTML.trim();
    } else {
      var attr = el.getAttribute('data-holo-headline');
      if (attr) headlineHtml = attr;
    }

    if (!headlineHtml && !el.querySelector('.hero-holo, .title-holo, [data-holo-live]')) return;

    if (headlineHtml) {
      el.innerHTML = headlineHtml + followHtml + contextHtml;
    }
    el.classList.remove('has-holo', 'holo-static');
    el.removeAttribute('data-holo-headline');
  }

  function isLockedChar(ch) {
    return ch === ' ' || /[¿?¡!.,;:'"\-–—…]/.test(ch);
  }

  function paintKeyword(el, target, resolvedCount) {
    var WINDOW = window.matchMedia('(max-width: 768px)').matches ? 2 : 3;
    var len = target.length;
    var out = '';
    for (var i = 0; i < len; i++) {
      var real = target[i];
      if (isLockedChar(real) || i < resolvedCount) {
        out += real;
      } else if (i < resolvedCount + WINDOW) {
        out += CHARSET[(Math.random() * CHARSET.length) | 0];
      } else {
        out += real;
      }
    }
    el.textContent = out;
  }

  function scrambleKeyword(el, target, durationMs) {
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
          paintKeyword(el, target, resolved);
        }
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          paintKeyword(el, target, len);
          resolve();
        }
      }

      paintKeyword(el, target, 0);
      requestAnimationFrame(frame);
    });
  }

  function prepareTitleKeyword(el) {
    if (!el) return null;
    unwrapLegacyHolo(el);
    el.classList.add('has-holo-keyword');
    /* Disable full-block blur on the reveal parent — only the keyword animates */
    var revealParent = el.closest(
      '.know-reveal, .routes-reveal, .results-reveal, .eco-reveal, [data-reveal]'
    );
    if (revealParent) revealParent.classList.add('has-holo-title');
    var keyword = resolveKeyword(el);
    if (!keyword) return null;
    el.setAttribute('data-holo-keyword', keyword);
    var kw = wrapKeyword(el, keyword);
    if (kw) {
      kw.setAttribute('data-holo-word', keyword);
      /* Stable accessible name while letters scramble */
      kw.setAttribute('aria-label', keyword);
    }
    return kw;
  }

  /**
   * Loop the previous full-title holo cycle on ONE keyword:
   * enter blur → scramble reveal → stable → soft hide → bridge → repeat.
   * Pauses when the title leaves the viewport (hero always runs).
   */
  function startKeywordHolo(root) {
    var kw = prepareTitleKeyword(root);
    if (!kw) return;

    var word = kw.getAttribute('data-holo-word') || kw.textContent || '';
    if (!word) return;

    if (reduce) {
      kw.textContent = word;
      kw.classList.add('is-sharp');
      kw.classList.remove('is-entering', 'is-hiding', 'is-decoding', 'is-blur');
      return;
    }

    document.documentElement.classList.add('holo-ready');
    root.dataset.holoCycleMs = String(CYCLE_MS);
    kw.textContent = word;

    var running = false;
    var loopActive = false;
    var firstPass = true;

    async function cycle() {
      if (loopActive) return;
      loopActive = true;
      while (running) {
        if (firstPass) {
          firstPass = false;
          kw.classList.remove('is-hiding', 'is-entering', 'is-blur');
        } else {
          kw.classList.remove('is-hiding');
          kw.classList.add('is-entering', 'is-blur');
          await wait(INTRO_MS);
          if (!running) break;
          kw.classList.remove('is-entering', 'is-blur');
        }

        kw.classList.add('is-decoding');
        await scrambleKeyword(kw, word, REVEAL_MS);
        kw.classList.remove('is-decoding');
        kw.classList.add('is-sharp');
        if (!running) break;

        await wait(STABLE_MS);
        if (!running) break;

        kw.classList.remove('is-sharp');
        kw.classList.add('is-hiding', 'is-blur');
        await wait(HIDE_MS);
        await wait(BRIDGE_MS);
        kw.classList.remove('is-hiding', 'is-blur');
      }
      loopActive = false;
      kw.textContent = word;
      kw.classList.remove('is-hiding', 'is-entering', 'is-decoding', 'is-blur');
      kw.classList.add('is-sharp');
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

    /* Only titles that already used the cinematic title accent — no new pages */
    var selectors = [
      '[data-holo]',
      '[data-holo-keyword]',
      '.scene-know-title',
      '.routes-title',
      '.eco-title',
      '.results-title'
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.id === 'hero-title') return;
        if (el.closest('nav, footer, .cadamag-credit, .site-header')) return;
        roots.push(el);
      });
    });

    var seen = [];
    roots.forEach(function (el) {
      if (seen.indexOf(el) !== -1) return;
      seen.push(el);
      startKeywordHolo(el);
    });
  }

  /**
   * Layout X of an element ignoring CSS transforms (reveal slide/scale).
   * getBoundingClientRect() includes the pre-scroll reveal offset (−220px),
   * which is NOT where “Sabés más…” finally sits.
   */
  function layoutLeftIgnoreTransform(el) {
    if (!el) return 0;
    var x = 0;
    var node = el;
    while (node && node !== document.documentElement) {
      x += node.offsetLeft;
      node = node.offsetParent;
    }
    return x;
  }

  /**
   * Pin the woman’s wrapper left edge to the know-section text column
   * (“Sabés más inglés…”), using its final layout column — not the
   * reveal-transformed rect. Video crops transparent padding so she
   * starts appearing at that same edge.
   */
  function alignHeroPersonToKnow() {
    if (window.matchMedia('(max-width: 768px)').matches) {
      var resetPerson = document.querySelector('.woman-wrapper, .hero-person');
      var resetDash = document.querySelector('.dash, .dashboard-wrapper');
      var resetVideo = document.getElementById('welcome-video');
      if (resetPerson) resetPerson.style.left = '';
      if (resetDash) resetDash.style.right = '';
      if (resetVideo) {
        resetVideo.style.marginLeft = '';
        resetVideo.style.width = '';
        resetVideo.style.maxWidth = '';
      }
      return;
    }
    var person = document.querySelector('.woman-wrapper, .hero-person');
    var stage = document.querySelector('.hero-visual-stage, .hero-stage');
    var lead = document.querySelector('.scene-know-lead');
    var guide = document.querySelector('.scene-know-title') || document.querySelector('.scene-know-eyebrow');
    var video = document.getElementById('welcome-video');
    if (!person || !stage || !guide) return;

    var stageBox = stage.getBoundingClientRect();
    /* Final column X (shell + lead.offsetLeft), not transformed rect */
    var guideL = lead
      ? layoutLeftIgnoreTransform(lead)
      : layoutLeftIgnoreTransform(guide);

    /* Wrapper left = text left (she begins where the title begins) */
    person.style.left = (guideL - stageBox.left) + 'px';

    /* Pull video left to cancel intrinsic transparent padding (~112/768) */
    if (video && video.videoWidth > 0) {
      var padPct = 0;
      try {
        var iw = video.videoWidth;
        var ih = video.videoHeight;
        var c = document.createElement('canvas');
        var scale = Math.min(1, 400 / iw);
        var w = Math.max(1, Math.floor(iw * scale));
        var h = Math.max(1, Math.floor(ih * scale));
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, w, h);
        /* One buffer read — avoids per-pixel getImageData main-thread cost */
        var pixels = ctx.getImageData(0, 0, w, h).data;
        var opaqueX = 0;
        var y0 = Math.floor(h * 0.1);
        outer: for (var x = 0; x < w; x++) {
          var run = 0;
          for (var y = y0; y < h; y++) {
            if (pixels[(y * w + x) * 4 + 3] > 28) {
              run++;
              if (run >= 2) { opaqueX = x / w; break outer; }
            } else run = 0;
          }
        }
        padPct = opaqueX * 100;
      } catch (e) {
        padPct = 14.5;
      }
      if (padPct > 0.5 && padPct < 40) {
        video.style.marginLeft = (-padPct) + '%';
        video.style.width = (100 + padPct) + '%';
        video.style.maxWidth = 'none';
      }
    }

    /* Keep dash clear of the woman */
    var dash = document.querySelector('.dash, .dashboard-wrapper');
    if (!dash) return;
    dash.style.right = '';
    var p2 = person.getBoundingClientRect();
    var d2 = dash.getBoundingClientRect();
    var gap = d2.left - p2.right;
    if (gap < 28) {
      var curRight = parseFloat(getComputedStyle(dash).right) || 0;
      dash.style.right = (curRight - (28 - gap)) + 'px';
    }
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

    function afterVideoReady() {
      playIntro();
      alignHeroPersonToKnow();
      window.setTimeout(alignHeroPersonToKnow, 120);
      window.setTimeout(alignHeroPersonToKnow, 400);
    }

    if (video.readyState >= 2 && video.videoWidth) {
      afterVideoReady();
    } else {
      video.addEventListener('loadedmetadata', afterVideoReady, { once: true });
      video.addEventListener('loadeddata', afterVideoReady, { once: true });
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
    alignHeroPersonToKnow();
    var alignTimer = null;
    window.addEventListener('resize', function () {
      if (alignTimer) window.clearTimeout(alignTimer);
      alignTimer = window.setTimeout(alignHeroPersonToKnow, 80);
    });
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
