/**
 * Ecosistema Infinity — module focus (hover/focus/tap)
 * Uses InfinityMotion.initSceneReveal when available.
 * Does not alter hero / know / routes motion.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    if (window.InfinityMotion && typeof window.InfinityMotion.initSceneReveal === 'function') {
      window.InfinityMotion.initSceneReveal('.scene-eco');
      return;
    }
    var section = document.querySelector('.scene-eco');
    if (!section) return;
    if (reduce || !('IntersectionObserver' in window)) {
      section.classList.add('is-in');
      return;
    }
    var done = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (done || !entry.isIntersecting) return;
          done = true;
          section.classList.add('is-in');
          io.disconnect();
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(section);
  }

  function setActive(system, tool) {
    if (!system) return;
    var modules = system.querySelectorAll('[data-eco-tool]');
    var links = system.querySelectorAll('.eco-link');

    if (!tool) {
      system.classList.remove('is-active');
      system.removeAttribute('data-active');
      modules.forEach(function (m) {
        m.classList.remove('is-on');
        m.setAttribute('aria-pressed', 'false');
      });
      links.forEach(function (l) { l.classList.remove('is-lit'); });
      return;
    }

    system.classList.add('is-active');
    system.setAttribute('data-active', tool);
    modules.forEach(function (m) {
      var on = m.getAttribute('data-eco-tool') === tool;
      m.classList.toggle('is-on', on);
      m.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    links.forEach(function (l) {
      l.classList.toggle('is-lit', l.getAttribute('data-link') === tool);
    });
  }

  function initInteractions() {
    var system = document.querySelector('[data-eco-system]');
    if (!system) return;

    var modules = system.querySelectorAll('[data-eco-tool]');
    var isCoarse = window.matchMedia('(hover: none), (max-width: 768px)').matches;

    modules.forEach(function (mod) {
      mod.setAttribute('role', 'button');
      mod.setAttribute('aria-pressed', 'false');

      mod.addEventListener('mouseenter', function () {
        if (isCoarse) return;
        setActive(system, mod.getAttribute('data-eco-tool'));
      });

      mod.addEventListener('mouseleave', function () {
        if (isCoarse) return;
        if (system.contains(document.activeElement) &&
            document.activeElement.hasAttribute('data-eco-tool')) {
          return;
        }
        setActive(system, null);
      });

      mod.addEventListener('focus', function () {
        setActive(system, mod.getAttribute('data-eco-tool'));
      });

      mod.addEventListener('blur', function () {
        window.setTimeout(function () {
          if (!system.contains(document.activeElement)) {
            setActive(system, null);
          }
        }, 0);
      });

      mod.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        if (!isCoarse) return;
        var tool = mod.getAttribute('data-eco-tool');
        var already = mod.classList.contains('is-on');
        setActive(system, already ? null : tool);
      });

      mod.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest('a')) return;
        e.preventDefault();
        var tool = mod.getAttribute('data-eco-tool');
        var already = mod.classList.contains('is-on');
        setActive(system, already ? null : tool);
      });
    });

    system.addEventListener('mouseleave', function () {
      if (isCoarse) return;
      if (!system.contains(document.activeElement)) {
        setActive(system, null);
      }
    });
  }

  function init() {
    initReveal();
    initInteractions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
