(function () {
  var cfg = (typeof window !== 'undefined' && window.INFINITY_SITE) ? window.INFINITY_SITE : {};
  var id = String(cfg.gaMeasurementId || '').trim();
  if (!id || id === 'G-PLACEHOLDER' || !/^G-[A-Z0-9]+$/i.test(id)) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
