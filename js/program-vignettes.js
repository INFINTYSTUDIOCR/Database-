(function () {
  'use strict';

  var LOGO_MAP = {
    foundations: { src: 'assets/logos/foundations.png', alt: 'Foundations' },
    ort: { src: 'assets/logos/ort.png', alt: 'ORT — Operational Readiness Training' },
    nexora: { src: 'assets/logos/nexora.png', alt: 'Nexora' },
    'job-finder': { src: 'assets/logos/job-finder.png', alt: 'Job Finder' },
    'off-the-clock': { src: 'assets/logos/off-the-clock.png', alt: 'Off The Clock' },
    conversatorio: { src: 'assets/logos/conversatorio.png', alt: 'The Conversatory — El Conversatorio' }
  };

  function renderLogo(el, id) {
    var meta = LOGO_MAP[id];
    if (!meta) return false;

    el.innerHTML =
      '<img class="vignette-logo" src="' + meta.src + '" alt="' + meta.alt + '">' +
      '<div class="vignette-logo-fallback" hidden>' + meta.alt + '</div>';

    var img = el.querySelector('.vignette-logo');
    var fb = el.querySelector('.vignette-logo-fallback');
    img.onerror = function () {
      if (id === 'foundations' && img.getAttribute('data-fallback-tried') !== '1') {
        img.setAttribute('data-fallback-tried', '1');
        img.style.display = '';
        img.src = 'assets/logos/jill.png';
        return;
      }
      img.style.display = 'none';
      if (fb) fb.hidden = false;
    };
    return true;
  }

  function mount(el) {
    var id = el.getAttribute('data-vignette');
    if (!id) return;
    renderLogo(el, id);
  }

  function init() {
    document.querySelectorAll('[data-vignette]').forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
