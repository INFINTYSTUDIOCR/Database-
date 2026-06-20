(function () {
  'use strict';

  function initTabs() {
    var tabs = document.querySelectorAll('.deliverables-tab');
    var panels = document.querySelectorAll('.deliverables-panel');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.id === 'panel-' + id);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
  } else {
    initTabs();
  }
})();
