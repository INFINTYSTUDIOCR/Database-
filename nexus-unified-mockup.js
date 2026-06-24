/**
 * Nexus Mockup Cierre — Intake 4 tabs + Weekly Pulse 4 tabs
 * Additive only; wraps existing Engine functions.
 */
(function (global) {
  'use strict';

  var INTAKE_MICRO = ['k1', 'k2', 'k3', 'k8', 'k9', 'k10', 'k13'];
  var INTAKE_MICRO_LABELS = {
    k1: 'Response Speed', k2: 'Response Completion', k3: 'Thought Organization',
    k8: 'Linking Usage', k9: 'Idea Expansion', k10: 'Thought Connection', k13: 'Recovery Ability'
  };

  function deps() { return global.NexusUnified || {}; }

  function weekId() {
    return deps().weekIdFromDate ? deps().weekIdFromDate() : '';
  }

  function tabBtn(n, label, active) {
    return '<button type="button" class="btn btn-sm ' + (active ? 'btn-navy' : 'btn-outline') + '" onclick="NexusMockup.intakeTab(' + n + ')" id="intake-tab-' + n + '">' + label + '</button>';
  }

  function pulseTabBtn(n, label, active) {
    return '<button type="button" class="btn btn-sm ' + (active ? 'btn-navy' : 'btn-outline') + '" onclick="NexusMockup.pulseTab(' + n + ')" id="pulse-tab-' + n + '">' + label + '</button>';
  }

  function enhanceIntakeAfterRender() {
    var fade = document.querySelector('#main-content .fade');
    if (!fade || fade.getAttribute('data-intake-v2')) return;
    fade.setAttribute('data-intake-v2', '1');

    var cards = fade.querySelectorAll('.card');
    if (!cards.length) return;

    var bar = document.createElement('div');
    bar.className = 'card';
    bar.style.marginBottom = '12px';
    bar.innerHTML = '<div class="card-title"><i class="ti ti-layout-tabs"></i>Intake Diagnostic — 4 pasos</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">'
      + tabBtn(1, '1 · Observación', true) + tabBtn(2, '2 · Profundidad k') + tabBtn(3, '3 · Placement') + tabBtn(4, '4 · Plan')
      + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;">'
      + '<label>Track: <select class="inp" id="intake-track-select" style="width:auto;display:inline-block;"><option value="jill">Jill (Foundations)</option><option value="alice">Alice direct</option><option value="nexora">Nexora-only</option></select></label>'
      + '<label>system_mode: <select class="inp" id="intake-mode-select" style="width:auto;"><option value="jill">Jill</option><option value="alice">Alice</option></select></label>'
      + '<label>Nexora: <select class="inp" id="intake-nexora-select" style="width:auto;"><option value="0">OFF</option><option value="1">ON</option></select></label>'
      + '</div>';

    fade.insertBefore(bar, cards[0]);

    var microCard = document.createElement('div');
    microCard.className = 'card intake-panel intake-panel-2';
    microCard.style.display = 'none';
    microCard.innerHTML = '<div class="card-title"><i class="ti ti-chart-dots"></i>Profundidad k1–k13 (track Jill — intake)</div>'
      + '<div class="ib ib-navy">Estimación rápida en intake. El resto N/A hasta Weekly Pulse.</div>'
      + INTAKE_MICRO.map(function (k) {
        return '<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:600;">' + k + ' — ' + INTAKE_MICRO_LABELS[k] + '</div>'
          + '<input type="range" min="1" max="5" value="3" id="intake-micro-' + k + '" style="width:100%;"></div>';
      }).join('');
    fade.insertBefore(microCard, cards[0].nextSibling);

    cards.forEach(function (card, i) {
      card.classList.add('intake-panel', 'intake-panel-1');
      if (i >= 2) card.classList.add('intake-panel-3');
    });
    var reportDiv = document.getElementById('dg-report');
    if (reportDiv) {
      reportDiv.classList.add('intake-panel', 'intake-panel-4');
      reportDiv.style.display = 'none';
    }
    var genBtn = fade.querySelector('button[onclick*="generateDiagnosticReport"]');
    if (genBtn && genBtn.parentElement) {
      genBtn.parentElement.classList.add('intake-panel', 'intake-panel-4');
      genBtn.parentElement.style.display = 'none';
    }
    intakeTab(1);
  }

  function intakeTab(n) {
    [1, 2, 3, 4].forEach(function (i) {
      var btn = document.getElementById('intake-tab-' + i);
      if (btn) btn.className = 'btn btn-sm ' + (i === n ? 'btn-navy' : 'btn-outline');
    });
    document.querySelectorAll('.intake-panel-1').forEach(function (el) { el.style.display = n === 1 ? '' : 'none'; });
    document.querySelectorAll('.intake-panel-2').forEach(function (el) { el.style.display = n === 2 ? '' : 'none'; });
    document.querySelectorAll('.intake-panel-3').forEach(function (el) { el.style.display = n === 3 ? '' : 'none'; });
    document.querySelectorAll('.intake-panel-4').forEach(function (el) { el.style.display = n === 4 ? '' : 'none'; });
  }

  function collectIntakeMicro() {
    var o = {};
    INTAKE_MICRO.forEach(function (k) {
      var el = document.getElementById('intake-micro-' + k);
      if (el) o[k] = parseInt(el.value) || 3;
    });
    return o;
  }

  function wrapIntake() {
    if (typeof renderDiagnostic === 'function' && !renderDiagnostic._mockupWrapped) {
      var origR = renderDiagnostic;
      renderDiagnostic = function (m, leadId) {
        origR(m, leadId);
        setTimeout(enhanceIntakeAfterRender, 50);
      };
      renderDiagnostic._mockupWrapped = true;
    }
    if (typeof saveDiagnostic === 'function' && !saveDiagnostic._mockupWrapped) {
      var origS = saveDiagnostic;
      saveDiagnostic = async function () {
        window._intakeExtra = {
          micro: collectIntakeMicro(),
          track: (document.getElementById('intake-track-select') && document.getElementById('intake-track-select').value) || 'jill',
          mode: (document.getElementById('intake-mode-select') && document.getElementById('intake-mode-select').value) || 'jill',
          nexora: document.getElementById('intake-nexora-select') && document.getElementById('intake-nexora-select').value === '1'
        };
        await origS();
        var students = typeof allStudents === 'function' ? allStudents() : [];
        var last = students[students.length - 1];
        if (last && window._intakeExtra) {
          deps().ensureStudentFields(last);
          last.intakeBaseline = {
            id: 'INTAKE-' + Date.now(),
            date: new Date().toISOString(),
            micro: window._intakeExtra.micro,
            track: window._intakeExtra.track,
            source: 'intake-v2'
          };
          last.track.current = window._intakeExtra.track;
          last.system_mode = window._intakeExtra.mode;
          if (window._intakeExtra.nexora) last.nexoraEnabled = true;
          if (last.calibrations && last.calibrations[0]) {
            last.calibrations[0].source = 'intake-baseline';
            last.calibrations[0].baselineId = last.intakeBaseline.id;
          }
          await dbSet('infinity_students', last.id, last);
          DB[last.id] = last;
        }
        delete window._intakeExtra;
      };
      saveDiagnostic._mockupWrapped = true;
    }
  }

  function renderWeeklyPulseMockup(m, sid) {
    var s = DB[sid];
    if (!s) return;
    deps().ensureStudentFields(s);
    var prof = global.NexusUI && NexusUI.computeAutoProfile ? NexusUI.computeAutoProfile(s) : { macro: {}, prevMacro: null, micro: {}, activeMicro: [], confidence: 70, stats: {}, total: 0, prevTotal: 0 };
    var track = (s.track && s.track.current) || 'jill';
    var wk = weekId();
    global._pulseSid = sid;
    global._pulseProf = prof;

    m.innerHTML = '<div class="fade" id="pulse-mockup-root">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'
      + '<button class="btn btn-outline btn-sm" onclick="showView(\'weekly-pulse\',null)"><i class="ti ti-arrow-left"></i>Volver</button>'
      + '<h2 style="font-size:16px;font-weight:700;color:var(--navy);flex:1;"><i class="ti ti-heartbeat"></i> Weekly Pulse — ' + ((s.info && s.info.name) || sid) + '</h2>'
      + '<button type="button" class="btn btn-outline btn-sm" onclick="NexusManualCal.open(\'' + sid + '\')"><i class="ti ti-adjustments"></i> Calibración manual</button></div>'
      + '<div class="ib ib-navy">Semana <strong>' + wk + '</strong> · Track: <strong>' + track.toUpperCase() + '</strong> · Auto: '
      + (s.aliceSessions || []).length + ' Jill/Alice · ' + prof.stats.quizzes + ' quiz · ' + (s.nexoraSessions || []).length + ' Nexora · Confianza ' + prof.confidence + '%</div>'
      + '<div class="card" style="margin-top:10px;"><div style="display:flex;flex-wrap:wrap;gap:6px;">'
      + pulseTabBtn(1, 'Confirmación', true) + pulseTabBtn(2, 'Profundidad') + pulseTabBtn(3, 'Práctica') + pulseTabBtn(4, 'Acciones')
      + '</div><div id="pulse-tab-body" style="margin-top:12px;"></div></div></div>';

    pulseTab(1);
  }

  function pulseTab(n) {
    [1, 2, 3, 4].forEach(function (i) {
      var btn = document.getElementById('pulse-tab-' + i);
      if (btn) btn.className = 'btn btn-sm ' + (i === n ? 'btn-navy' : 'btn-outline');
    });
    var sid = global._pulseSid;
    var s = DB[sid];
    var prof = global._pulseProf;
    if (!s || !prof) return;
    var body = document.getElementById('pulse-tab-body');
    if (!body) return;
    var track = (s.track && s.track.current) || 'jill';
    var macro = prof.macro || {};
    var scale10 = s.kpiScale === 10 || macro.ST > 5 || macro.IG > 5;
    var th = scale10 ? 6 : 3;
    var gradReady = macro.ST >= th && macro.RA >= th && macro.IG >= th && track === 'jill';
    var keys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];

    if (n === 1) {
      body.innerHTML = '<div class="ib ib-green">Resumen calculado — confirmá o ajustá solo KPIs con ⚠</div>'
        + keys.map(function (k) {
          var now = prof.macro[k];
          var prev = prof.prevMacro ? (parseInt(prof.prevMacro[k]) || now) : now;
          var disc = Math.abs(now - prev) >= 2;
          return '<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'
            + k + ': ' + prev + '→' + now + (disc ? ' ⚠' : '')
            + (disc ? ' <input type="number" min="1" max="5" value="' + now + '" id="pulse-adj-' + k + '" style="width:48px;margin-left:8px;">' : '')
            + '</div>';
        }).join('')
        + '<div style="font-weight:700;margin:8px 0;">Total: ' + (global.fmtScore ? global.fmtScore(prof.prevTotal, s) : prof.prevTotal) + ' → ' + (global.fmtScore ? global.fmtScore(prof.total, s) : prof.total + '/50') + '</div>'
        + '<label style="font-size:12px;display:block;margin:8px 0;"><input type="checkbox" id="pulse-accept" checked> Acepto scores sugeridos</label>'
        + '<textarea class="inp" id="pulse-notes" placeholder="Notas trainer" style="min-height:50px;"></textarea>'
        + '<select class="inp" id="pulse-hw" style="margin-top:8px;"><option value="yes">Homework: Sí</option><option value="partial">Parcial</option><option value="no">No</option></select>';
    } else if (n === 2) {
      body.innerHTML = '<div class="ib ib-navy">KPIs activos del track — pre-llenados desde última evidencia</div>'
        + prof.activeMicro.map(function (id) {
          var v = prof.micro[id];
          var pct = v !== undefined ? Math.round((v / 5) * 100) : null;
          return '<div style="font-size:12px;padding:8px 0;border-bottom:1px solid var(--border);">'
            + '<strong>' + id + '</strong> ' + (pct !== null ? ('████░ ' + pct + '%') : '<span style="color:var(--t3);">N/A</span>')
            + '<div style="font-size:10px;color:var(--t3);">Evidencia: sesiones + quiz + Nemesis</div></div>';
        }).join('');
    } else if (n === 3) {
      var lastQuiz = (s.quizzes || []).slice(-1)[0];
      var lastNem = (s.nemesisQuizzes || []).slice(-1)[0];
      var quizLine = lastQuiz ? (lastQuiz.correct + '/' + lastQuiz.total + ' (' + lastQuiz.score + '%)') : 'Sin quiz esta semana';
      var nemLine = lastNem ? (lastNem.correct + '/' + lastNem.total + ' (' + lastNem.score + '%)') : 'Sin Nemesis esta semana';
      body.innerHTML = '<div style="font-size:13px;line-height:1.8;">'
        + '<div><strong>Quiz semanal:</strong> ' + quizLine + '</div>'
        + '<div><strong>Nemesis:</strong> ' + nemLine + '</div>'
        + '<div class="ib ib-navy" style="margin-top:8px;">Ya contado en auto — el alumno no repite aquí.</div></div>';
    } else {
      body.innerHTML = '<div style="font-size:13px;margin-bottom:10px;">Training Book: rotación automática al confirmar pulso.</div>'
        + '<button type="button" class="btn btn-outline" style="margin-bottom:8px;" onclick="NexusManualCal.open(\'' + sid + '\')"><i class="ti ti-adjustments"></i> Calibración manual (macro + 26 · 1–10)</button>'
        + (gradReady ? '<label style="font-size:12px;display:block;margin-bottom:10px;"><input type="checkbox" id="pulse-suggest-grad"> Sugerir graduación → Alice (ST≥3 ✓ RA≥3 ✓ IG≥3 ✓)</label>' : '<div class="ib ib-amber">Graduación aún no cumple criterios mínimos.</div>')
        + '<button class="btn btn-navy" onclick="NexusMockup.confirmPulse()"><i class="ti ti-check"></i> Confirmar pulso semanal — UN SOLO SAVE</button>';
    }
  }

  async function confirmPulse() {
    if (global.NexusUI && global.NexusUI.confirmWeeklyPulse) {
      var suggest = document.getElementById('pulse-suggest-grad');
      global._pulseSuggestGrad = suggest && suggest.checked;
      await global.NexusUI.confirmWeeklyPulse(global._pulseSid);
      if (global._pulseSuggestGrad && global.NexusUnified && NexusUnified.graduateTrack) {
        await NexusUnified.graduateTrack(global._pulseSid, 'jill');
      }
    }
  }

  function installPulseOverride() {
    if (global.NexusUI) {
      global.NexusUI.renderWeeklyPulseV2 = renderWeeklyPulseMockup;
      global.NexusUI.openWeeklyPulse = function (sid) { renderWeeklyPulseMockup(document.getElementById('main-content'), sid); };
    }
    if (deps()) {
      deps().openPulse = function (sid) { renderWeeklyPulseMockup(document.getElementById('main-content'), sid); };
      deps().renderWeeklyPulse = renderWeeklyPulseMockup;
    }
  }

  function init() {
    wrapIntake();
    installPulseOverride();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.NexusMockup = {
    intakeTab: intakeTab,
    pulseTab: pulseTab,
    confirmPulse: confirmPulse,
    enhanceIntakeAfterRender: enhanceIntakeAfterRender
  };
})(typeof window !== 'undefined' ? window : this);
