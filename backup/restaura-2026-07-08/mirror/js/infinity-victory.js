/**
 * Infinity Victory ù UI delgada (datos desde cerebro).
 */
(function (global) {
  'use strict';

  var _cache = null;
  var _cacheAt = 0;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pillarRow(p, icon) {
    var pct = p.required ? Math.min(100, Math.round((p.current / p.required) * 100)) : 0;
    var color = p.met ? '#86EFAC' : '#FCD34D';
    var bar = p.met ? 100 : pct;
    return '<div style="margin-bottom:10px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
      + '<span style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);">' + icon + ' ' + esc(p.label) + '</span>'
      + '<span style="font-size:11px;font-weight:800;color:' + color + ';">' + (p.met ? '?' : (p.current + '/' + p.required)) + '</span>'
      + '</div>'
      + '<div style="height:5px;background:rgba(0,0,0,0.25);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;width:' + bar + '%;background:' + (p.met ? 'linear-gradient(90deg,#0a5c3c,#86EFAC)' : 'linear-gradient(90deg,#b45309,#fbbf24)') + ';border-radius:4px;"></div>'
      + '</div>'
      + (p.met ? '' : '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:3px;">' + esc(p.hint) + '</div>')
      + '</div>';
  }

  function renderCard(metric) {
    if (!metric) return '';
    var achieved = !!metric.achieved;
    var border = achieved
      ? 'border:1px solid rgba(251,191,36,0.65);box-shadow:0 0 24px rgba(251,191,36,0.2);'
      : 'border:1px solid rgba(167,139,250,0.35);';
    var head = achieved
      ? '<div style="font-size:11px;font-weight:900;letter-spacing:0.12em;color:#fcd34d;margin-bottom:4px;">?? INFINITY VICTORY</div>'
      : '<div style="font-size:11px;font-weight:900;letter-spacing:0.12em;color:#c4b5fd;margin-bottom:4px;">?? INFINITY VICTORY</div>';
    var sub = '<div style="font-size:12px;color:rgba(255,255,255,0.75);margin-bottom:12px;line-height:1.5;">' + esc(metric.tagline) + '</div>';
    var progress = '<div style="font-size:22px;font-weight:900;color:' + (achieved ? '#fcd34d' : '#e9d5ff') + ';margin-bottom:10px;">'
      + metric.progressPct + '%</div>';
    var pillars = metric.pillars
      ? pillarRow(metric.pillars.streak, '??') + pillarRow(metric.pillars.drill, '?') + pillarRow(metric.pillars.session, '??')
      : '';
    var share = achieved && metric.shareLine
      ? '<button type="button" class="infinity-victory-share" data-share="' + esc(metric.shareLine) + '" style="margin-top:10px;width:100%;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);color:#fde68a;font-weight:700;font-size:12px;padding:10px;border-radius:10px;cursor:pointer;">Compartir logro</button>'
      : '';
    return '<div class="infinity-victory-card" style="background:rgba(0,0,0,0.2);' + border + 'border-radius:16px;padding:14px;margin-bottom:14px;">'
      + head + sub + progress + pillars + share + '</div>';
  }

  function fetchFromBrain() {
    var now = Date.now();
    if (_cache && now - _cacheAt < 45000) return Promise.resolve(_cache);
    if (typeof infinityFetch !== 'function') return Promise.reject(new Error('no auth'));
    return infinityFetch('/jill/victory-metric')
      .then(function (r) { if (!r.ok) throw new Error('brain'); return r.json(); })
      .then(function (data) {
        _cache = data.metric || data;
        _cacheAt = now;
        return _cache;
      });
  }

  function renderFromStudent(student) {
    if (student && student.infinityVictory) return renderCard(student.infinityVictory);
    return '<div class="infinity-victory-card" style="font-size:12px;color:rgba(255,255,255,0.55);text-align:center;padding:12px;margin-bottom:14px;">Cargando Infinity Victoryù</div>';
  }

  function bindShareButtons(root) {
    if (!root) return;
    root.querySelectorAll('.infinity-victory-share').forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-share') || '';
        if (navigator.share) {
          navigator.share({ title: 'Infinity Victory', text: text, url: 'https://studioinfinitycr.com' }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text + ' https://studioinfinitycr.com').then(function () {
            if (typeof showToast === 'function') showToast('Texto copiado ù compartilo donde quieras');
          });
        }
      });
    });
  }

  function hydrate(root, student) {
    if (!root) return;
    root.innerHTML = renderFromStudent(student);
    fetchFromBrain().then(function (metric) {
      if (student) student.infinityVictory = metric;
      root.innerHTML = renderCard(metric);
      bindShareButtons(root);
    }).catch(function () {
      if (student && student.infinityVictory) {
        root.innerHTML = renderCard(student.infinityVictory);
        bindShareButtons(root);
      }
    });
  }

  global.InfinityVictory = {
    renderCard: renderCard,
    renderFromStudent: renderFromStudent,
    fetchFromBrain: fetchFromBrain,
    hydrate: hydrate,
    invalidateCache: function () { _cache = null; _cacheAt = 0; }
  };
})(typeof window !== 'undefined' ? window : global);
