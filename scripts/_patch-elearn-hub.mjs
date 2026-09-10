/**
 * Patch simulation-corporate-learn.js: Training/Mini quiz/Certification labels + mountHub.
 */
import { readFileSync, writeFileSync } from 'fs';

function patch(path) {
  let s = readFileSync(path, 'utf8');

  s = s.replace(
    "{ id: 'learn', label: '1 · Learn' },\n        { id: 'practice', label: '2 · Practice' },\n        { id: 'quiz', label: '3 · Quiz 80%' }",
    "{ id: 'learn', label: '1 · Training' },\n        { id: 'practice', label: '2 · Mini quiz' },\n        { id: 'quiz', label: '3 · Certification' }"
  );
  s = s.replace('Continue to practice', 'Continue to mini quiz');
  s = s.replace('Practice complete.', 'Mini quiz complete.');
  s = s.replace('Start certification quiz', 'Start certification');

  if (!s.includes('.cl-hub-grid')) {
    s = s.replace(
      ".cl-score{font-size:13px;font-weight:800;margin:8px 0}'\n    ].join('');",
      `.cl-score{font-size:13px;font-weight:800;margin:8px 0}',
      '.cl-hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:0 0 12px}',
      '.cl-hub-card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;text-align:left;cursor:pointer;font:inherit;color:inherit;transition:border-color .15s,box-shadow .15s}',
      '.cl-hub-card:hover{border-color:' + accent + ';box-shadow:0 6px 18px rgba(15,23,42,.08)}',
      '.cl-hub-card.done{border-color:#86efac;background:#f0fdf4}',
      '.cl-hub-kicker{font:800 10px Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:6px}',
      '.cl-hub-title{font:800 14px Inter,Arial,sans-serif;color:#0f172a;margin:0 0 6px}',
      '.cl-hub-meta{font-size:11px;line-height:1.45;color:#64748b}',
      '.cl-hub-badge{display:inline-block;margin-top:8px;font:800 10px Inter,Arial,sans-serif;color:#166534;background:#dcfce7;border-radius:999px;padding:3px 8px}',
      '.cl-hub-back{margin:0 0 12px}'
    ].join('');`
    );
  }

  if (!s.includes('function mountHub')) {
    const hub = `
  function mountHub(root, opts) {
    if (!root) return;
    opts = opts || {};
    var product = opts.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = opts.accent || (product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var studentId = String(opts.studentId || '').trim();
    var desk = product === 'kamuk' ? 'Kamuk Holdings' : 'Infinity Holdings Inc';
    styles(accent);

    var view = { mode: 'hub', moduleId: null };

    function backHub() {
      view.mode = 'hub';
      view.moduleId = null;
      render();
    }

    function render() {
      if (view.mode === 'module') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        mountModule(root.querySelector('#cl-hub-slot'), {
          moduleId: view.moduleId,
          product: product,
          studentId: studentId,
          accent: accent,
          onContinue: backHub
        });
        return;
      }
      if (view.mode === 'final') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        mountFinal(root.querySelector('#cl-hub-slot'), {
          product: product,
          studentId: studentId,
          accent: accent,
          onContinue: backHub
        });
        return;
      }
      if (view.mode === 'formato') {
        root.innerHTML = '<div class="cl"><button type="button" class="cl-btn ghost cl-hub-back" id="cl-hub-back">← All modules</button><div id="cl-hub-slot"></div></div>';
        root.querySelector('#cl-hub-back').addEventListener('click', backHub);
        var slot = root.querySelector('#cl-hub-slot');
        if (global.SimulationFormatoE && typeof global.SimulationFormatoE.mount === 'function') {
          global.SimulationFormatoE.mount(slot, {
            product: product,
            studentId: studentId,
            accent: accent,
            onContinue: backHub
          });
        } else {
          slot.innerHTML = '<div class="cl-msg err">Formato E module missing. Reload the portal.</div>';
        }
        return;
      }

      var cards = MODULE_ORDER.map(function (id, i) {
        var mod = MODULES[id];
        var done = isCertified(id, product, studentId);
        return '<button type="button" class="cl-hub-card' + (done ? ' done' : '') + '" data-mod="' + id + '">'
          + '<div class="cl-hub-kicker">Module ' + (i + 1) + ' · ' + (mod.mins || 10) + ' min</div>'
          + '<div class="cl-hub-title">' + esc(mod.title) + '</div>'
          + '<div class="cl-hub-meta">Training · Mini quiz · Certification (80%)</div>'
          + (done ? '<span class="cl-hub-badge">Certified</span>' : '')
          + '</button>';
      }).join('');

      var formatoDone = global.SimulationFormatoE && typeof global.SimulationFormatoE.isCertified === 'function'
        ? global.SimulationFormatoE.isCertified(product, studentId)
        : false;
      cards += '<button type="button" class="cl-hub-card' + (formatoDone ? ' done' : '') + '" data-formato="1">'
        + '<div class="cl-hub-kicker">Email standard · desk</div>'
        + '<div class="cl-hub-title">Formato E</div>'
        + '<div class="cl-hub-meta">Training · Drills · Certification</div>'
        + (formatoDone ? '<span class="cl-hub-badge">Certified</span>' : '')
        + '</button>';

      var finalDone = isFinalCertified(product, studentId);
      cards += '<button type="button" class="cl-hub-card' + (finalDone ? ' done' : '') + '" data-final="1">'
        + '<div class="cl-hub-kicker">Capstone · 20 questions</div>'
        + '<div class="cl-hub-title">Final certification</div>'
        + '<div class="cl-hub-meta">All modules · 80% pass</div>'
        + (finalDone ? '<span class="cl-hub-badge">Certified</span>' : '')
        + '</button>';

      root.innerHTML = '<div class="cl">'
        + '<p class="cl-lead">E-learning for the ' + esc(desk) + ' desk. Each module has <strong>Training</strong>, a <strong>Mini quiz</strong>, then <strong>Certification</strong> at 80%.</p>'
        + '<div class="cl-hub-grid">' + cards + '</div>'
        + '</div>';

      root.querySelectorAll('[data-mod]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          view.mode = 'module';
          view.moduleId = btn.getAttribute('data-mod');
          render();
        });
      });
      var fe = root.querySelector('[data-formato]');
      if (fe) fe.addEventListener('click', function () { view.mode = 'formato'; view.moduleId = null; render(); });
      var fi = root.querySelector('[data-final]');
      if (fi) fi.addEventListener('click', function () { view.mode = 'final'; view.moduleId = null; render(); });
    }

    render();
  }

`;
    s = s.replace(
      '  global.SimulationCorporateLearn = {\n    MODULES: MODULES,\n    MODULE_ORDER: MODULE_ORDER,\n    FINAL_QUIZ: FINAL_QUIZ,\n    PASS: PASS,\n    mountModule: mountModule,\n    mountFinal: mountFinal,\n    isCertified: isCertified,\n    isFinalCertified: isFinalCertified\n  };',
      hub + '  global.SimulationCorporateLearn = {\n    MODULES: MODULES,\n    MODULE_ORDER: MODULE_ORDER,\n    FINAL_QUIZ: FINAL_QUIZ,\n    PASS: PASS,\n    mountModule: mountModule,\n    mountFinal: mountFinal,\n    mountHub: mountHub,\n    isCertified: isCertified,\n    isFinalCertified: isFinalCertified\n  };'
    );
  }

  writeFileSync(path, s);
  console.log('patched', path, s.includes('mountHub'), s.includes('1 · Training'));
}

patch('js/simulation-corporate-learn.js');
patch('kamuk/js/simulation-corporate-learn.js');
