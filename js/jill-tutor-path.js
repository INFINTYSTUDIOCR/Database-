/**
 * Ruta Jill Tutor — UI portal (Foundations desde cero).
 * SOLO pestaña Jill · Modo Tutor. Alice/Claire no usan este módulo.
 */
(function (global) {
  'use strict';

  var MAP = null;
  var LOAD = null;
  var CACHE_VER = '20260825path1';

  function configUrl() {
    var p = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    return (p.indexOf('/kamuk') >= 0 ? '../config/jill-tutor-path.json' : 'config/jill-tutor-path.json') + '?v=' + CACHE_VER;
  }

  function load() {
    if (MAP) return Promise.resolve(MAP);
    if (LOAD) return LOAD;
    LOAD = fetch(configUrl())
      .then(function (r) { return r.ok ? r.json() : { steps: [] }; })
      .then(function (data) {
        MAP = data;
        return MAP;
      })
      .catch(function () {
        MAP = { steps: [], startStepId: 'P01' };
        return MAP;
      });
    return LOAD;
  }

  function ensureProgress(s) {
    if (!s) return null;
    if (!s.jillTutorPath) {
      s.jillTutorPath = {
        currentStepId: (MAP && MAP.startStepId) || 'P01',
        completedSteps: [],
        startedAt: new Date().toISOString(),
        anecdoteTexts: [],
        writtenDaysLog: []
      };
    }
    return s.jillTutorPath;
  }

  function steps() {
    return ((MAP && MAP.steps) || []).slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function stepById(id) {
    var want = String(id || '');
    var list = steps();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === want) return list[i];
    }
    return null;
  }

  function getCurrentStep(s) {
    ensureProgress(s);
    return stepById(s.jillTutorPath.currentStepId) || steps()[0] || null;
  }

  function progressPct(s) {
    var list = steps();
    if (!list.length || !s || !s.jillTutorPath) return 0;
    var cur = getCurrentStep(s);
    var curIdx = cur ? list.findIndex(function (x) { return x.id === cur.id; }) : 0;
    var done = (s.jillTutorPath.completedSteps || []).length;
    return Math.min(100, Math.round((Math.max(done, curIdx) / list.length) * 100));
  }

  function esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderPanel(s, opts) {
    opts = opts || {};
    if (!s || !MAP) return '';
    ensureProgress(s);
    var step = getCurrentStep(s);
    if (!step) return '';
    var pct = progressPct(s);
    var list = steps();
    var phaseTitle = '';
    if (MAP.phases && step.phaseId) {
      for (var p = 0; p < MAP.phases.length; p++) {
        if (MAP.phases[p].id === step.phaseId) phaseTitle = MAP.phases[p].title;
      }
    }

    var chips = list.map(function (st) {
      var done = (s.jillTutorPath.completedSteps || []).indexOf(st.id) >= 0;
      var active = st.id === step.id;
      var bg = done ? 'rgba(61,220,151,0.35)' : (active ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.06)');
      var border = active ? '2px solid #A78BFA' : '1px solid rgba(255,255,255,0.12)';
      var color = done ? '#bbf7d0' : (active ? '#e9d5ff' : 'rgba(255,255,255,0.55)');
      return '<span title="' + esc(st.title) + '" style="font-size:10px;font-weight:700;padding:4px 7px;border-radius:999px;background:' + bg + ';border:' + border + ';color:' + color + ';white-space:nowrap;">'
        + (done ? '✓ ' : (active ? '▶ ' : '')) + esc(st.shortTitle || st.id)
        + '</span>';
    }).join('');

    var anecdoteBox = step.anecdoteStep
      ? '<div style="margin-top:10px;">'
        + '<div style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:6px;">Pegá tu anécdota (15 min escrita, mín. 12 líneas):</div>'
        + '<textarea id="jill-path-anecdote" rows="6" placeholder="I worked yesterday because…" style="width:100%;border-radius:10px;border:1px solid rgba(167,139,250,0.35);background:rgba(0,0,0,0.25);color:white;padding:10px;font-size:12px;line-height:1.5;resize:vertical;"></textarea>'
        + '<button type="button" onclick="jillTutorPathSubmitAnecdote()" style="margin-top:8px;width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:white;font-weight:800;font-size:13px;cursor:pointer;">Enviar anécdota y analizar</button>'
        + '</div>'
      : '';

    var advanceBtn = !step.anecdoteStep
      ? '<button type="button" onclick="jillTutorPathMarkComplete()" style="margin-top:10px;width:100%;padding:9px;border-radius:10px;border:1px solid rgba(61,220,151,0.45);background:rgba(61,220,151,0.12);color:#86EFAC;font-weight:700;font-size:12px;cursor:pointer;">Marcar paso completado (con tu profe)</button>'
      : '';

    return '<div id="jill-tutor-path-panel" style="background:linear-gradient(165deg,rgba(30,27,75,0.95),rgba(49,46,129,0.85));border:1px solid rgba(167,139,250,0.4);border-radius:14px;padding:12px 14px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">'
      + '<div>'
      + '<div style="font-size:10px;font-weight:800;letter-spacing:0.1em;color:#c4b5fd;">RUTA OFICIAL · EMPEZÁ ACÁ</div>'
      + '<div style="font-size:14px;font-weight:900;color:white;margin-top:4px;">Paso ' + step.order + '/' + list.length + ' — ' + esc(step.title) + '</div>'
      + (phaseTitle ? '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">' + esc(phaseTitle) + '</div>' : '')
      + '</div>'
      + '<div style="font-size:11px;font-weight:800;color:#86EFAC;">' + pct + '%</div>'
      + '</div>'
      + '<div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7c3aed,#3DDC97);"></div>'
      + '</div>'
      + '<div style="font-size:12px;color:rgba(255,255,255,0.82);line-height:1.55;margin-top:10px;">'
      + '<strong style="color:#e9d5ff;">Hoy:</strong> ' + esc(step.studentTask || '')
      + '</div>'
      + '<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:6px;">Para avanzar: ' + esc(step.gateLabel || '') + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;max-height:72px;overflow-y:auto;">' + chips + '</div>'
      + anecdoteBox
      + advanceBtn
      + '</div>';
  }

  function persistStudent(s) {
    if (!s || !s.id || typeof dbSet !== 'function') return Promise.resolve();
    return dbSet('infinity_students', s.id, s).catch(function () {});
  }

  function markComplete(force) {
    var s = typeof CURRENT_STUDENT !== 'undefined' ? CURRENT_STUDENT : null;
    if (!s || !s.jillTutorPath) return;
    var step = getCurrentStep(s);
    if (!step) return;
    var api = (typeof API !== 'undefined' ? API : '') + '/jill/tutor-path/advance';
    fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (typeof getToken === 'function' ? getToken() : '') },
      body: JSON.stringify({ student: s, stepId: step.id, force: !!force })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.ok && data.snapshot) {
        s.jillTutorPath.currentStepId = data.snapshot.currentStepId;
        s.jillTutorPath.completedSteps = data.snapshot.completedSteps;
        persistStudent(s);
        if (typeof renderJill === 'function') renderJill();
      } else if (data.error) {
        alert(data.error);
      }
    }).catch(function () {
      if ((s.jillTutorPath.completedSteps || []).indexOf(step.id) < 0) {
        s.jillTutorPath.completedSteps.push(step.id);
      }
      var list = steps();
      var idx = list.findIndex(function (x) { return x.id === step.id; });
      if (list[idx + 1]) s.jillTutorPath.currentStepId = list[idx + 1].id;
      persistStudent(s);
      if (typeof renderJill === 'function') renderJill();
    });
  }

  function submitAnecdote() {
    var s = typeof CURRENT_STUDENT !== 'undefined' ? CURRENT_STUDENT : null;
    var ta = document.getElementById('jill-path-anecdote');
    var text = ta ? String(ta.value || '').trim() : '';
    if (!s || !text) { alert('Escribí o pegá tu anécdota primero.'); return; }
    var lines = text.split(/\n/).filter(function (l) { return l.trim(); }).length;
    if (lines < 12) { alert('Mínimo 12 líneas conectadas. Llevás ' + lines + '.'); return; }
    var step = getCurrentStep(s);
    var api = (typeof API !== 'undefined' ? API : '') + '/jill/tutor-path/advance';
    fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (typeof getToken === 'function' ? getToken() : '') },
      body: JSON.stringify({ student: s, stepId: step && step.id, anecdoteText: text })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.ok) {
        if (data.snapshot) {
          s.jillTutorPath = s.jillTutorPath || {};
          s.jillTutorPath.currentStepId = data.snapshot.currentStepId;
          s.jillTutorPath.completedSteps = data.snapshot.completedSteps;
        }
        persistStudent(s);
        if (typeof renderJill === 'function') renderJill();
        if (typeof startJillSessionClick === 'function') startJillSessionClick('tutor');
      } else {
        alert(data.error || 'No se pudo enviar.');
      }
    }).catch(function () { alert('Error de conexión.'); });
  }

  global.JillTutorPath = {
    load: load,
    ensureProgress: ensureProgress,
    getCurrentStep: getCurrentStep,
    progressPct: progressPct,
    renderPanel: renderPanel,
    markComplete: markComplete,
    submitAnecdote: submitAnecdote
  };
  global.jillTutorPathMarkComplete = function () { markComplete(true); };
  global.jillTutorPathSubmitAnecdote = submitAnecdote;
})(typeof window !== 'undefined' ? window : globalThis);
