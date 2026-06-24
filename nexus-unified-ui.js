/**
 * Nexus UI v2 — additive display layer (Engine + redirects)
 * Does NOT remove underlying save functions; hides legacy entry points.
 */
(function (global) {
  'use strict';

  function deps() { return global.NexusUnified || {}; }

  function getScore(s) {
    if (typeof global.getScore === 'function') return global.getScore(s);
    var kpis = (s.kpis && s.kpis.phase1) || {};
    var t = 0;
    ['IG', 'ST', 'RA', 'PS', 'R'].forEach(function (k) { t += parseInt(kpis[k]) || 0; });
    return t;
  }

  function getLevel(score, s) {
    var scale10 = s && (s.kpiScale === 10 || score > 25);
    if (typeof global.getLevelForStudent === 'function') return global.getLevelForStudent(score, s);
    if (scale10) return score >= 42 ? 'Advanced' : score >= 32 ? 'Functional' : score >= 22 ? 'Emerging' : 'Survival';
    if (typeof global.getLevel === 'function' && !s) return global.getLevel(score);
    if (score <= 10) return 'Survival';
    if (score <= 15) return 'Emerging';
    if (score <= 20) return 'Functional';
    return 'Advanced';
  }

  function trackMicroIds(track) {
    var map = {
      jill: ['k1', 'k2', 'k3', 'k8', 'k9', 'k10', 'k13', 'k14'],
      alice: ['k5', 'k6', 'k11', 'k12', 'k23', 'k24'],
      nexora: ['k18', 'k19', 'k20', 'k21', 'k22', 'k23', 'k25', 'k26']
    };
    return map[track] || map.jill;
  }

  function computeAutoProfile(s) {
    deps().ensureStudentFields(s);
    var macro = {};
    var names = typeof KPI_NAMES !== 'undefined' ? KPI_NAMES : { IG: 1, ST: 1, RA: 1, PS: 1, R: 1 };
    Object.keys(names).forEach(function (k) {
      macro[k] = parseInt((s.kpis && s.kpis.phase1 && s.kpis.phase1[k]) || 3);
    });

    var prev = (s.calibrations || []).slice(-2, -1)[0];
    var prevMacro = prev && prev.kpis ? prev.kpis : null;

    var micro = {};
    var track = (s.track && s.track.current) || 'jill';
    var active = trackMicroIds(track);
    var lastKt = (s.kpiTracker || []).slice(-1)[0];
    if (lastKt && lastKt.scores) active.forEach(function (id) {
      if (lastKt.scores[id] !== undefined) micro[id] = lastKt.scores[id];
    });

    var sessions = (s.calibrations || []).length;
    var quizzes = (s.quizzes || []).length + (s.nemesisQuizzes || []).length;
    var confidence = Math.min(95, 40 + sessions * 4 + quizzes * 2);

    return {
      macro: macro,
      prevMacro: prevMacro,
      micro: micro,
      activeMicro: active,
      confidence: confidence,
      stats: {
        jillSessions: (s.aliceSessions || []).length,
        quizzes: (s.quizzes || []).length,
        nemesis: (s.nemesisQuizzes || []).length,
        nexora: (s.nexoraSessions || []).length || 0
      },
      total: getScore(s),
      prevTotal: prev ? prev.score : ((s.diagnosticReport && s.diagnosticReport.score) || getScore(s))
    };
  }

  function journeyEvents(s) {
    var ev = [];
    if (s.diagnosticReport && s.diagnosticReport.date) {
      ev.push({ date: s.diagnosticReport.date, label: 'Intake · baseline ' + (s.diagnosticReport.score || '—') + '/25' });
    }
    (s.weeklyPulse || []).forEach(function (p) {
      ev.push({ date: p.date || p.updated, label: 'Pulse ' + p.weekId + (p.complete ? ' ✓' : '') });
    });
    (s.calibrations || []).slice(1).forEach(function (c, i) {
      ev.push({ date: c.date, label: 'Sesión ' + (i + 2) + ' · ' + (c.score || '—') + '/25' });
    });
    (s.track && s.track.graduated) && Object.keys(s.track.graduated).forEach(function (t) {
      if (s.track.graduated[t]) ev.push({ date: s.updated_at || '', label: 'Graduación ' + t });
    });
    return ev.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
  }

  function renderStudentJourneyGrid(m) {
    var students = typeof allStudents === 'function' ? allStudents() : [];
    m.innerHTML = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:8px;"><i class="ti ti-route"></i> Viaje del estudiante</h2>'
      + '<div class="ib ib-navy">Solo informativo — las métricas se actualizan con sesiones, quiz y Weekly Pulse. Ya no hace falta el KPI Tracker manual.</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:12px;" id="journey-grid">'
      + students.map(function (s, idx) {
        deps().ensureStudentFields(s);
        var score = getScore(s);
        var track = (s.track && s.track.current) || 'jill';
        var ev = journeyEvents(s);
        return '<div class="card" style="padding:12px;cursor:pointer;" onclick="openStudent(\'' + s.id + '\')">'
          + '<div style="font-size:13px;font-weight:700;color:var(--navy);">' + ((s.info && s.info.name) || s.id) + '</div>'
          + '<div style="font-size:10px;color:var(--t3);margin-bottom:6px;">' + track.toUpperCase() + ' · ' + score + '/25 · ' + getLevel(score) + '</div>'
          + '<div style="height:120px;position:relative;"><canvas id="journey-radar-' + idx + '" data-sid="' + s.id + '"></canvas></div>'
          + '<div style="font-size:10px;color:var(--t2);margin-top:6px;max-height:48px;overflow:hidden;">'
          + (ev.length ? ev.slice(-3).map(function (e) { return '· ' + (e.label || ''); }).join('<br>') : 'Sin historial aún')
          + '</div></div>';
      }).join('')
      + '</div></div>';

    setTimeout(function () {
      students.forEach(function (s, idx) {
        var canvas = document.getElementById('journey-radar-' + idx);
        if (!canvas || typeof Chart === 'undefined') return;
        var kpis = (s.kpis && s.kpis.phase1) || {};
        var labels = typeof KPI_NAMES !== 'undefined' ? Object.values(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];
        var keys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];
        new Chart(canvas, {
          type: 'radar',
          data: {
            labels: labels.map(function (l) { return l.split(' ')[0]; }),
            datasets: [{ data: keys.map(function (k) { return parseInt(kpis[k]) || 0; }), borderColor: '#5B21B6', backgroundColor: 'rgba(91,33,182,0.12)', pointRadius: 2 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 5, ticks: { display: false } } } }
        });
      });
    }, 80);
  }

  function renderWeeklyPulseV2(m, sid) {
    var s = DB[sid];
    if (!s) return;
    deps().ensureStudentFields(s);
    var NU = deps();
    var wk = NU.weekIdFromDate ? NU.weekIdFromDate() : '';
    var prof = computeAutoProfile(s);
    var track = (s.track && s.track.current) || 'jill';
    var macroKeys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];

    var macroHtml = macroKeys.map(function (k) {
      var now = prof.macro[k];
      var prev = prof.prevMacro ? (parseInt(prof.prevMacro[k]) || now) : now;
      var arrow = now > prev ? '▲' : (now < prev ? '▼' : '→');
      return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);">'
        + '<span>' + k + ' ' + (typeof KPI_NAMES !== 'undefined' ? KPI_NAMES[k].split(' ')[0] : '') + '</span>'
        + '<span><strong>' + prev + '→' + now + '</strong> ' + arrow + '</span></div>';
    }).join('');

    var microHtml = prof.activeMicro.map(function (id) {
      var v = prof.micro[id];
      var pct = v !== undefined ? Math.round((v / 5) * 100) : '—';
      return '<div style="font-size:11px;padding:4px 0;color:' + (v !== undefined ? 'var(--text)' : 'var(--t3)') + ';">'
        + id + ' ' + (v !== undefined ? '████░ ' + pct + '%' : '(N/A esta semana)') + '</div>';
    }).join('');

    m.innerHTML = '<div class="fade">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'
      + '<button class="btn btn-outline btn-sm" onclick="showView(\'weekly-pulse\',null)"><i class="ti ti-arrow-left"></i>Volver</button>'
      + '<h2 style="font-size:16px;font-weight:700;color:var(--navy);flex:1;"><i class="ti ti-heartbeat"></i> Weekly Pulse — ' + ((s.info && s.info.name) || sid) + '</h2>'
      + '<button type="button" class="btn btn-outline btn-sm" onclick="NexusManualCal.open(\'' + sid + '\')"><i class="ti ti-adjustments"></i> Calibración manual</button></div>'
      + '<div class="ib ib-navy">Semana <strong>' + wk + '</strong> · Track: <strong>' + track.toUpperCase() + '</strong> · Auto: '
      + prof.stats.quizzes + ' quiz · ' + prof.stats.nemesis + ' nemesis · confianza ' + prof.confidence + '%</div>'
      + '<div class="card" style="margin-top:10px;"><div class="card-title">Resumen (calculado)</div>'
      + macroHtml
      + '<div style="font-size:13px;font-weight:700;margin-top:8px;">Total: ' + prof.prevTotal + ' → ' + prof.total + '/25</div></div>'
      + '<div class="card"><div class="card-title">Profundidad — KPIs activos del track</div>' + microHtml + '</div>'
      + '<div class="card"><div class="card-title">Confirmación trainer</div>'
      + '<label style="font-size:12px;display:block;margin-bottom:8px;"><input type="checkbox" id="pulse-accept" checked> Acepto scores sugeridos (auto)</label>'
      + '<label style="font-size:12px;display:block;margin-bottom:8px;"><input type="checkbox" id="pulse-adjust"> Ajustar manualmente KPIs con discrepancia</label>'
      + '<div id="pulse-adjust-area" style="display:none;margin-bottom:8px;">'
      + macroKeys.map(function (k) {
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:24px;">' + k + '</span>'
          + '<input type="range" min="1" max="5" value="' + prof.macro[k] + '" id="pulse-adj-' + k + '" style="flex:1;">'
          + '<span id="pulse-adj-v-' + k + '">' + prof.macro[k] + '</span></div>';
      }).join('') + '</div>'
      + '<textarea class="inp" id="pulse-notes" placeholder="Notas trainer (opcional)" style="min-height:50px;margin-bottom:8px;"></textarea>'
      + '<select class="inp" id="pulse-hw" style="margin-bottom:8px;"><option value="yes">Homework: Sí</option><option value="partial">Parcial</option><option value="no">No</option></select>'
      + '<button type="button" class="btn btn-outline" style="margin-bottom:8px;" onclick="NexusManualCal.open(\'' + sid + '\')"><i class="ti ti-adjustments"></i> Calibración manual (1–10 · macro + 26)</button>'
      + '<button class="btn btn-navy" onclick="NexusUI.confirmWeeklyPulse(\'' + sid + '\')"><i class="ti ti-check"></i> Confirmar pulso semanal (un solo guardado)</button>'
      + '</div></div>';

    document.getElementById('pulse-adjust').addEventListener('change', function () {
      document.getElementById('pulse-adjust-area').style.display = this.checked ? 'block' : 'none';
    });
  }

  async function confirmWeeklyPulse(sid) {
    var s = DB[sid];
    if (!s) return;
    var prof = computeAutoProfile(s);
    var macro = {};
    var keys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];
    var adjust = document.getElementById('pulse-adjust') && document.getElementById('pulse-adjust').checked;
    keys.forEach(function (k) {
      macro[k] = adjust && document.getElementById('pulse-adj-' + k)
        ? parseInt(document.getElementById('pulse-adj-' + k).value) : prof.macro[k];
    });
    var total = 0;
    keys.forEach(function (k) { total += macro[k]; });

    if (!s.kpis) s.kpis = {};
    if (!s.kpis.phase1) s.kpis.phase1 = {};
    keys.forEach(function (k) { s.kpis.phase1[k] = String(macro[k]); });
    if (s.info) {
      s.info.current_score = total;
      s.info.score = total;
      s.info.level = getLevel(total);
    }

    var wk = deps().weekIdFromDate ? deps().weekIdFromDate() : '';
    var notes = (document.getElementById('pulse-notes') && document.getElementById('pulse-notes').value.trim()) || '';
    var hw = (document.getElementById('pulse-hw') && document.getElementById('pulse-hw').value) || 'yes';
    var pulseId = 'PULSE-' + wk + '-' + Date.now();

    if (!s.calibrations) s.calibrations = [];
    s.calibrations.push({
      date: new Date().toISOString(), trainer: (typeof SESSION !== 'undefined' && SESSION.name) || 'trainer',
      kpis: macro, score: total, hw: hw,
      notes: 'Weekly Pulse auto · ' + total + '/25' + (notes ? (' · ' + notes) : ''),
      pulseSessionId: pulseId, weekId: wk, source: 'weekly-pulse-v2'
    });

    var scores = {};
    prof.activeMicro.forEach(function (id) { if (prof.micro[id] !== undefined) scores[id] = prof.micro[id]; });
    if (!s.kpiTracker) s.kpiTracker = [];
    s.kpiTracker.push({
      date: new Date().toISOString(), trainer: (typeof SESSION !== 'undefined' && SESSION.name) || 'trainer',
      scores: scores, observations: {}, source: 'weekly-pulse-v2', weekId: wk, pulseSessionId: pulseId,
      overall: prof.confidence, notes: 'Auto desde Pulse v2'
    });

    if (!s.weeklyPulse) s.weeklyPulse = [];
    s.weeklyPulse.push({
      weekId: wk, date: new Date().toISOString(), pulseSessionId: pulseId,
      assessmentDone: true, trackerDone: true, complete: true, auto: true
    });

    if (!s.notes) s.notes = [];
    s.notes.push({ date: new Date().toISOString(), trainer: (typeof SESSION !== 'undefined' && SESSION.name) || 'trainer', text: 'Weekly Pulse confirmado · ' + total + '/25', phase: parseInt((s.info && s.info.phase)) || 1 });

    if (s.compliance) s.compliance.attended = (s.compliance.attended || 0) + 1;

    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    if (typeof showToast === 'function') showToast('Pulso semanal guardado (auto + confirmación)');
    if (typeof openStudent === 'function') openStudent(sid);
  }

  function installRedirects() {
    if (typeof showView === 'function' && !showView._nexusUiWrapped) {
      var orig = showView;
      showView = function (view, btn) {
        if (view === 'kpitracker' || view === 'student-journey') {
          currentView = 'student-journey';
          document.querySelectorAll('.sb-item').forEach(function (i) { i.classList.remove('active'); });
          if (btn) btn.classList.add('active');
          renderStudentJourneyGrid(document.getElementById('main-content'));
          return;
        }
        if (view === 'diagnostic') {
          if (typeof showToast === 'function') showToast('Intake Diagnostic — baseline único para leads/nuevos alumnos');
        }
        return orig.apply(this, arguments);
      };
      showView._nexusUiWrapped = true;
    }
    if (typeof openCalibrate === 'function' && !openCalibrate._nexusUiWrapped) {
      var oc = openCalibrate;
      openCalibrate = function (id) {
        if (typeof NexusUI !== 'undefined' && NexusUI.openWeeklyPulse) {
          NexusUI.openWeeklyPulse(id);
          return;
        }
        return oc(id);
      };
      openCalibrate._nexusUiWrapped = true;
    }
    if (global.NexusUnified) {
      global.NexusUnified.openPulse = function (sid) {
        if (typeof DB !== 'undefined' && DB[sid]) renderWeeklyPulseV2(document.getElementById('main-content'), sid);
      };
      global.NexusUnified.renderWeeklyPulse = renderWeeklyPulseV2;
    }
  }

  function openWeeklyPulse(sid) {
    renderWeeklyPulseV2(document.getElementById('main-content'), sid);
  }

  function init() {
    installRedirects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.NexusUI = {
    renderStudentJourneyGrid: renderStudentJourneyGrid,
    renderWeeklyPulseV2: renderWeeklyPulseV2,
    confirmWeeklyPulse: confirmWeeklyPulse,
    openWeeklyPulse: openWeeklyPulse,
    computeAutoProfile: computeAutoProfile,
    journeyEvents: journeyEvents
  };
})(typeof window !== 'undefined' ? window : this);
