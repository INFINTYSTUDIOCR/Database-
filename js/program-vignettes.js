(function () {
  'use strict';

  /**
   * Viñetas de producto
   * ─────────────────────
   * Para animaciones PRO (stickman fluido), exporta Lottie JSON y colócalo en:
   *   assets/animations/{id}.json
   *
   * IDs: foundations | ort | nexora | job-finder | off-the-clock
   *
   * Herramientas recomendadas: LottieFiles.com, Rive.app, After Effects + Bodymovin
   */

  var LOTTIE_CDN = 'https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js';

  var SVG = {
    foundations:
      '<svg class="vig-foundations" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="320" height="220" fill="#0A0A0F"/>' +
      '<rect x="40" y="175" width="240" height="8" rx="2" fill="#1A1A28"/>' +
      '<rect class="nail" x="198" y="148" width="6" height="30" rx="1" fill="#F5A623"/>' +
      '<g stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="95" cy="72" r="14" fill="#5B21B6"/>' +
      '<line x1="95" y1="86" x2="95" y2="130"/>' +
      '<line x1="95" y1="100" x2="130" y2="88"/>' +
      '<line x1="95" y1="130" x2="72" y2="168"/>' +
      '<line x1="95" y1="130" x2="118" y2="168"/>' +
      '<g class="hammer-arm">' +
      '<line x1="130" y1="88" x2="168" y2="72"/>' +
      '<rect x="162" y="58" width="28" height="18" rx="3" fill="#7C3AED"/>' +
      '<rect x="188" y="52" width="10" height="30" rx="2" fill="#F5A623"/>' +
      '</g></g>' +
      '<text x="16" y="24" fill="rgba(255,255,255,0.35)" font-size="10" font-family="Inter,sans-serif" font-weight="700">FOUNDATIONS</text>' +
      '</svg>',

    ort:
      '<svg class="vig-ort" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="320" height="220" fill="#0A0A0F"/>' +
      '<rect x="0" y="178" width="320" height="42" fill="#12121A"/>' +
      '<g opacity="0.9">' +
      '<polygon points="248,168 268,108 288,168" fill="#E2E8F0"/>' +
      '<rect x="258" y="168" width="20" height="14" fill="#F5A623"/>' +
      '<polygon points="252,120 274,120 268,95" fill="#EF4444"/>' +
      '</g>' +
      '<g class="walker" stroke="#fff" stroke-width="3" stroke-linecap="round">' +
      '<circle cx="72" cy="88" r="13" fill="#F5A623"/>' +
      '<line x1="72" y1="101" x2="72" y2="138"/>' +
      '<line x1="72" y1="115" x2="52" y2="128"/>' +
      '<line class="leg-left" x1="72" y1="138" x2="58" y2="168"/>' +
      '<line class="leg-right" x1="72" y1="138" x2="86" y2="168"/>' +
      '</g>' +
      '<text x="16" y="24" fill="rgba(255,255,255,0.35)" font-size="10" font-family="Inter,sans-serif" font-weight="700">ORT · READINESS</text>' +
      '</svg>',

    nexora:
      '<svg class="vig-nexora" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="320" height="220" fill="#0A0A0F"/>' +
      '<rect x="120" y="175" width="80" height="12" fill="#1A1A28"/>' +
      '<ellipse class="smoke" cx="130" cy="172" rx="14" ry="8" fill="rgba(255,255,255,0.15)"/>' +
      '<ellipse class="smoke smoke-2" cx="160" cy="172" rx="18" ry="10" fill="rgba(255,255,255,0.12)"/>' +
      '<ellipse class="smoke smoke-3" cx="190" cy="172" rx="14" ry="8" fill="rgba(255,255,255,0.15)"/>' +
      '<g class="rocket-group">' +
      '<polygon class="exhaust" points="148,168 160,200 172,168" fill="#F97316"/>' +
      '<polygon class="exhaust" points="152,168 160,190 168,168" fill="#FBBF24"/>' +
      '<rect x="148" y="118" width="24" height="52" rx="2" fill="#E2E8F0"/>' +
      '<polygon points="148,118 160,88 172,118" fill="#fff"/>' +
      '<polygon points="148,130 138,155 148,150" fill="#EF4444"/>' +
      '<polygon points="172,130 182,155 172,150" fill="#EF4444"/>' +
      '<rect x="154" y="95" width="12" height="18" fill="#5B21B6"/>' +
      '</g>' +
      '<text x="16" y="24" fill="rgba(255,255,255,0.35)" font-size="10" font-family="Inter,sans-serif" font-weight="700">NEXORA · LAUNCH</text>' +
      '</svg>',

    'job-finder':
      '<svg class="vig-job-finder" viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="320" height="220" fill="#0A0A0F"/>' +
      '<g class="detective" stroke="#fff" stroke-width="3" stroke-linecap="round">' +
      '<path d="M108 58 L132 52 L156 58 L148 72 L116 72 Z" fill="#7C4A0A" stroke="#7C4A0A"/>' +
      '<circle cx="132" cy="88" r="14" fill="#F5A623"/>' +
      '<line x1="132" y1="102" x2="132" y2="145"/>' +
      '<line x1="132" y1="118" x2="108" y2="135"/>' +
      '<line x1="132" y1="145" x2="115" y2="172"/>' +
      '<line x1="132" y1="145" x2="149" y2="172"/>' +
      '</g>' +
      '<g class="magnifier">' +
      '<circle cx="168" cy="98" r="22" stroke="#F5A623" stroke-width="4" fill="rgba(245,166,35,0.08)"/>' +
      '<line x1="184" y1="114" x2="202" y2="132" stroke="#F5A623" stroke-width="5" stroke-linecap="round"/>' +
      '</g>' +
      '<text x="16" y="24" fill="rgba(255,255,255,0.35)" font-size="10" font-family="Inter,sans-serif" font-weight="700">JOB FINDER</text>' +
      '</svg>'
  };

  var LOTTIE_MAP = {
    foundations: 'assets/animations/foundations.json',
    ort: 'assets/animations/ort.json',
    nexora: 'assets/animations/nexora.json',
    'job-finder': 'assets/animations/job-finder.json',
    'off-the-clock': 'assets/animations/off-the-clock.json'
  };

  var LOGO_MAP = {
    'off-the-clock': 'assets/logos/off-the-clock.png'
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.lottie) {
        resolve(window.lottie);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(window.lottie); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function tryLottie(el, id) {
    var path = LOTTIE_MAP[id];
    if (!path) return Promise.resolve(false);

    return fetch(path, { method: 'HEAD' })
      .then(function (r) {
        if (!r.ok) return false;
        return loadScript(LOTTIE_CDN).then(function (lottie) {
          el.innerHTML = '';
          lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: path
          });
          return true;
        });
      })
      .catch(function () { return false; });
  }

  function renderLogo(el, id) {
    var src = LOGO_MAP[id];
    if (!src) return false;

    el.innerHTML =
      '<img class="vignette-logo" src="' + src + '" alt="Off The Clock">' +
      '<div class="vignette-logo-fallback" hidden>Off The Clock<br><small style="opacity:.7">Sube assets/logos/off-the-clock.png</small></div>';

    var img = el.querySelector('.vignette-logo');
    var fb = el.querySelector('.vignette-logo-fallback');
    img.onerror = function () {
      img.style.display = 'none';
      if (fb) fb.hidden = false;
    };
    return true;
  }

  function renderSvg(el, id) {
    if (SVG[id]) {
      el.innerHTML = SVG[id];
      return true;
    }
    return false;
  }

  function mount(el) {
    var id = el.getAttribute('data-vignette');
    if (!id) return;

    tryLottie(el, id).then(function (loaded) {
      if (loaded) return;
      if (id === 'off-the-clock' && renderLogo(el, id)) return;
      renderSvg(el, id);
    });
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
