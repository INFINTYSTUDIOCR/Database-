(function() {
  var deferredPrompt = null;
  var bar = null;
  var iosHelp = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function hideBar() {
    if (bar) bar.hidden = true;
  }

  function updateBarMessage() {
    if (!bar) return;
    var msg = bar.querySelector('.pwa-install-msg');
    if (!msg) return;
    if (isIos()) {
      msg.textContent = 'iPhone/iPad: tocá Instalar y seguí los 3 pasos (Safari).';
    } else if (deferredPrompt) {
      msg.textContent = 'Instalá el Portal — acceso directo desde tu pantalla de inicio.';
    } else if (isAndroid()) {
      msg.textContent = 'Android: menú ⋮ de Chrome → "Instalar app" o "Agregar a inicio".';
    } else {
      msg.textContent = 'Instalá el Portal en tu dispositivo para acceso rápido.';
    }
  }

  function showBar() {
    if (isStandalone()) {
      hideBar();
      return;
    }
    bar = document.getElementById('pwa-install-bar');
    if (!bar) return;
    updateBarMessage();
    bar.hidden = false;
  }

  function showIosHelp() {
    iosHelp = document.getElementById('pwa-ios-help');
    if (iosHelp) {
      iosHelp.hidden = false;
      iosHelp.classList.add('show');
      return;
    }
    alert('iPhone/iPad (Safari):\n1. Tocá Compartir (cuadrado con flecha)\n2. "Agregar a pantalla de inicio"\n3. Tocá Agregar\n\nLa app debe abrir studioinfinitycr.com/kamuk/ si sos estudiante Kamuk.');
  }

  function hideIosHelp() {
    if (!iosHelp) iosHelp = document.getElementById('pwa-ios-help');
    if (iosHelp) {
      iosHelp.hidden = true;
      iosHelp.classList.remove('show');
    }
  }

  window.infinityPwaHideIosHelp = hideIosHelp;

  window.infinityPwaInstall = function() {
    if (isStandalone()) {
      return;
    }
    if (isIos()) {
      showIosHelp();
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function() {
        deferredPrompt = null;
        updateBarMessage();
      });
      return;
    }
    if (isAndroid()) {
      showBar();
      alert('En Chrome: tocá el menú ⋮ (arriba a la derecha) → "Instalar app" o "Agregar a pantalla de inicio".');
      return;
    }
    alert('Abrí esta página en Chrome (Android) o Safari (iPhone) y usá Instalar app / Agregar a pantalla de inicio.');
  };

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showBar();
  });

  window.addEventListener('appinstalled', function() {
    hideBar();
    hideIosHelp();
  });

  var isKamukPortal = /\/kamuk(\/|$)/i.test(location.pathname || '');
  if ('serviceWorker' in navigator && !isKamukPortal) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function() { return navigator.serviceWorker.ready; })
      .catch(function(err) {
        console.warn('PWA service worker:', err);
        return navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function() {});
      });
  }

  function initPwaUi() {
    if (isStandalone()) {
      hideBar();
      hideIosHelp();
      return;
    }
    showBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPwaUi);
  } else {
    initPwaUi();
  }
})();
