/**
 * Infinity Studio — shared commercial navigation
 * Mounts into [data-site-nav] and wires mega-menus + mobile drawer.
 *
 * body[data-nav-root] = prefix to site root pages (e.g. "../" from prototype pages)
 * body[data-nav-home] = home path (default "index.html")
 * body[data-nav-active] = optional active section key
 */
(function () {
  'use strict';

  function root() {
    var r = document.body.getAttribute('data-nav-root');
    return r == null ? '../' : r;
  }

  function home() {
    return document.body.getAttribute('data-nav-home') || 'index.html';
  }

  function brandBase() {
    return document.body.getAttribute('data-brand-base') || '';
  }

  function pagesBase() {
    return document.body.getAttribute('data-pages-base') || '';
  }

  var LOCAL_PAGES = {
    'index.html': 1,
    'diagnostico.html': 1,
    'portal-access.html': 1,
    'foundations.html': 1,
    'ort.html': 1,
    'para-quien.html': 1,
    'job-finder.html': 1,
    'conversatorio.html': 1,
    'off-the-clock.html': 1,
    'ingles-operacional-latinoamerica.html': 1,
    'alice.html': 1,
    'jill.html': 1,
    'nexora.html': 1,
    'claire.html': 1,
    'training-book.html': 1,
    'casos-de-exito.html': 1,
    'pricing.html': 1,
    'hablemos.html': 1,
    'foundations-path.html': 1,
    'ort-path.html': 1,
    'advanced-path.html': 1
  };

  function abs(path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '#' || path.indexOf('mailto:') === 0) {
      return path;
    }
    // Commercial HTML is at site root (promoted). Always resolve via nav-root.
    return root() + path;
  }

  var ICONS = {
    foundations: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M6 20V10l6-4 6 4v10M9 20v-6h6v6"/></svg>',
    ort: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    which: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01"/></svg>',
    job: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    conversatory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10h8M8 14h5"/><path d="M21 12a8.5 8.5 0 0 1-11.6 7.9L5 21l1.2-3.5A8.5 8.5 0 1 1 21 12z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    latam: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    alice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v2M8 8a4 4 0 0 1 8 0v3a4 4 0 0 1-8 0V8z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    nexora: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
    jill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-14h-7l0-6z"/></svg>',
    claire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v5h5M8 13h8M8 17h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 0-2 2V5z"/><path d="M6 3v16"/></svg>',
    results: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/></svg>',
    cases: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12h6M9 16h4"/><path d="M7 4h7l5 5v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
    goico: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/></svg>'
  };

  function entry(href, icon, name, desc) {
    return (
      '<a class="nav-entry" href="' + href + '">' +
        '<span class="nav-entry-icon" aria-hidden="true">' + (ICONS[icon] || '') + '</span>' +
        '<span><span class="nav-entry-name">' + name + '</span>' +
        '<span class="nav-entry-desc">' + desc + '</span></span>' +
      '</a>'
    );
  }

  function chevron() {
    return '<svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  }

  function buildNavHtml() {
    var h = home();
    var diagnostic = abs('diagnostico.html');
    var portal = abs('portal-access.html');
    var pricing = abs('pricing.html');

    return (
      '<div class="header-inner">' +
        '<a class="brand" href="' + h + '#inicio" aria-label="Infinity Studio">' +
          '<img class="brand-logo" src="' + brandBase() + 'assets/brand/png/infinity-logo-horizontal-light.png" width="168" height="36" alt="Infinity Studio">' +
        '</a>' +
        '<nav class="nav-center" id="site-nav-center" aria-label="Principal">' +
          '<div class="nav-item"><a class="nav-link" href="' + h + '#inicio">Inicio</a></div>' +

          '<div class="nav-item" data-nav-menu="programas">' +
            '<button type="button" class="nav-trigger" aria-expanded="false" aria-controls="panel-programas" id="trigger-programas">' +
              'Programas ' + chevron() +
            '</button>' +
            '<div class="nav-panel nav-panel-programs" id="panel-programas" role="region" aria-labelledby="trigger-programas">' +
              '<div class="nav-panel-grid">' +
                '<div class="nav-panel-col">' +
                  '<p class="nav-panel-label">Rutas principales</p>' +
                  entry(abs('foundations.html'), 'foundations', 'Foundations', 'Construí una base sólida.') +
                  entry(abs('ort.html'), 'ort', 'ORT', 'Usá tu inglés cuando más importa.') +
                  entry(abs('para-quien.html'), 'which', '¿Cuál es para mí?', 'Encontrá la ruta según tu situación.') +
                '</div>' +
                '<div class="nav-panel-col">' +
                  '<p class="nav-panel-label">Experiencias</p>' +
                  entry(abs('job-finder.html'), 'job', 'Job Finder', 'Preparación para empleabilidad.') +
                  entry(abs('conversatorio.html'), 'conversatory', 'The Conversatory', 'Práctica conversacional en vivo.') +
                  entry(abs('off-the-clock.html'), 'clock', 'Off the Clock', 'Conversaciones fuera del formato tradicional.') +
                  entry(abs('ingles-operacional-latinoamerica.html'), 'latam', 'Inglés operacional Latam', 'Contextos profesionales en Latinoamérica.') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="nav-item" data-nav-menu="herramientas">' +
            '<button type="button" class="nav-trigger" aria-expanded="false" aria-controls="panel-herramientas" id="trigger-herramientas">' +
              'Herramientas IA ' + chevron() +
            '</button>' +
            '<div class="nav-panel nav-panel-tools" id="panel-herramientas" role="region" aria-labelledby="trigger-herramientas">' +
              '<div class="nav-panel-list">' +
                entry('alice.html', 'alice', 'Alice', 'Práctica de conversación por voz.') +
                entry('nexora.html', 'nexora', 'Nexora', 'Simulaciones laborales.') +
                entry('jill.html', 'jill', 'Jill', 'Drills Foundations bajo presión.') +
                entry('claire.html', 'claire', 'Claire', 'Práctica TOEIC con corrección inmediata.') +
                entry('training-book.html', 'book', 'Training Book', 'Ejercicios y progreso entre clases.') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="nav-item" data-nav-menu="resultados">' +
            '<button type="button" class="nav-trigger" aria-expanded="false" aria-controls="panel-resultados" id="trigger-resultados">' +
              'Resultados ' + chevron() +
            '</button>' +
            '<div class="nav-panel nav-panel-results" id="panel-resultados" role="region" aria-labelledby="trigger-resultados">' +
              '<div class="nav-panel-list">' +
                entry(h + '#resultados', 'results', 'Resultados', 'Evidencia en contexto real.') +
                entry(abs('casos-de-exito.html'), 'cases', 'Casos de éxito', 'Impacto documentado.') +
                entry(abs('casos-de-exito.html') + '#goicoechea', 'goico', 'Goicoechea', 'Piloto municipal 2021.') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="nav-item"><a class="nav-link" href="' + pricing + '">Precios</a></div>' +

          '<div class="nav-mobile-actions">' +
            '<a class="btn btn-primary" href="' + diagnostic + '">Hacé tu diagnóstico</a>' +
            '<a class="nav-portal" href="' + portal + '">Portal</a>' +
          '</div>' +
        '</nav>' +

        '<div class="header-right">' +
          '<button type="button" class="lang-pill" aria-label="Idioma: Español">' +
            '<svg class="language-flag" viewBox="0 0 30 18" width="20" height="12" aria-hidden="true" focusable="false">' +
              '<rect width="30" height="3" y="0" fill="#002B7F"/>' +
              '<rect width="30" height="3" y="3" fill="#FFFFFF"/>' +
              '<rect width="30" height="6" y="6" fill="#CE1126"/>' +
              '<rect width="30" height="3" y="12" fill="#FFFFFF"/>' +
              '<rect width="30" height="3" y="15" fill="#002B7F"/>' +
            '</svg>' +
            '<span>ES</span>' +
          '</button>' +
          '<a class="nav-portal" href="' + portal + '">Portal</a>' +
          '<a class="btn btn-primary btn-header" href="' + diagnostic + '">Hacé tu diagnóstico</a>' +
          '<button type="button" class="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="site-nav-center">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="nav-drawer-backdrop" data-nav-backdrop hidden></div>'
    );
  }

  function closeAllMenus(except) {
    document.querySelectorAll('.nav-item.is-open').forEach(function (item) {
      if (except && item === except) return;
      item.classList.remove('is-open');
      var btn = item.querySelector('.nav-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function closeMobile() {
    var nav = document.getElementById('site-nav-center');
    var toggle = document.querySelector('.nav-toggle');
    var backdrop = document.querySelector('[data-nav-backdrop]');
    if (nav) nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.hidden = true;
    }
    closeAllMenus();
  }

  function wireInteractions(header) {
    var closeTimer = null;
    var OPEN_DELAY = 60;
    var CLOSE_DELAY = 180;
    var isCoarse = window.matchMedia('(hover: none), (max-width: 980px)').matches;

    function openItem(item) {
      closeAllMenus(item);
      item.classList.add('is-open');
      var btn = item.querySelector('.nav-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    header.querySelectorAll('[data-nav-menu]').forEach(function (item) {
      var trigger = item.querySelector('.nav-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var open = item.classList.contains('is-open');
        if (open) {
          item.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          openItem(item);
        }
      });

      if (!isCoarse) {
        item.addEventListener('mouseenter', function () {
          window.clearTimeout(closeTimer);
          window.setTimeout(function () { openItem(item); }, OPEN_DELAY);
        });
        item.addEventListener('mouseleave', function () {
          window.clearTimeout(closeTimer);
          closeTimer = window.setTimeout(function () {
            item.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
          }, CLOSE_DELAY);
        });
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobile();
    });

    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) closeMobile();
    });

    var toggle = header.querySelector('.nav-toggle');
    var nav = header.querySelector('.nav-center');
    var backdrop = header.querySelector('[data-nav-backdrop]');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (backdrop) {
          backdrop.hidden = !open;
          backdrop.classList.toggle('is-open', open);
        }
        if (!open) closeAllMenus();
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', closeMobile);
    }

    // Scroll state
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function mount() {
    var host = document.querySelector('[data-site-nav]');
    if (!host) return;
    host.classList.add('site-header');
    host.innerHTML = buildNavHtml();
    wireInteractions(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
