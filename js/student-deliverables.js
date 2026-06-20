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

  function initTrainingBookMock() {
    var btn = document.getElementById('btn-open-tb-mock');
    var mock = document.getElementById('tb-student-mock');
    if (!btn || !mock) return;

    btn.addEventListener('click', function () {
      var open = mock.hidden;
      mock.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        mock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function init() {
    initTabs();
    initTrainingBookMock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
