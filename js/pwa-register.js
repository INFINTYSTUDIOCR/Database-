(function() {
  var deferredPrompt = null;
  var bar = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function showIosHint() {
    alert('En iPhone/iPad: tocá Compartir en Safari → "Agregar a pantalla de inicio".');
  }

  function showAndroidHint() {
    alert('En Chrome: menú ⋮ → "Instalar app" o "Agregar a pantalla de inicio".');
  }

  window.infinityPwaInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function() {
        deferredPrompt = null;
        hideBar();
      });
      return;
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) showIosHint();
    else showAndroidHint();
  };

  function hideBar() {
    if (bar) bar.hidden = true;
  }

  function showBar() {
    if (isStandalone()) return;
    bar = document.getElementById('pwa-install-bar');
    if (bar) bar.hidden = false;
  }

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    showBar();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function(err) {
        console.warn('PWA service worker:', err);
      });
    });
  }

  window.addEventListener('appinstalled', hideBar);

  setTimeout(function() {
    if (!deferredPrompt && !isStandalone() && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      showBar();
    }
  }, 2000);
})();
