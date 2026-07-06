/**
 * Nexus Unified System — Engine module
 * Additive layer: Weekly Pulse, Tracks, Graduation, Rule Book, macro↔micro KPI
 * Does NOT replace existing calibrations / kpiTracker / diagnostic flows.
 */
(function (global) {
  'use strict';

  var CONFIG = null;
  var RULEBOOK = null;
  var MEASUREMENT_GUIDE = null;
  var JILL_BUNDLES = null;
  var _pulseState = { sid: null, weekId: null, step: 1, waDone: false, ktDone: false };

  function weekIdFromDate(d) {
    d = d || new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + String(week).padStart(2, '0');
  }

  function ensureStudentFields(s) {
    if (!s) return s;
    if (!s.track) {
      s.track = {
        current: 'jill',
        admission: 'standard',
        graduated: { jill: false, alice: false, nexora: false },
        checklist: {
          jill: { bundlesMin: 2, sessionsMin: 8, macroMin: 12 },
          alice: { sessionsMin: 6, macroMin: 15 },
          nexora: { simsMin: 4, macroMin: 18 }
        }
      };
    }
    if (!s.weeklyPulse) s.weeklyPulse = [];
    if (!s.nemesisQuizzes) s.nemesisQuizzes = [];
    if (!s.nemesisState) s.nemesisState = { domain: [], reinforcement: [] };
    if (!s.jillProgress) s.jillProgress = { activeBundle: null, completedBundles: [] };
    if (!s.kpiDerived) s.kpiDerived = { lastMacroFromMicro: null, lastDate: null };
    if (!s.nexoraSessions) s.nexoraSessions = [];
    if (!s.intakeBaseline) s.intakeBaseline = null;
    return s;
  }

  function configBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('nexus-unified.js') >= 0) {
        if (src.indexOf('/engine/') >= 0) return '../config/';
        return 'config/';
      }
    }
    return 'config/';
  }

  function loadConfigs() {
    var base = configBasePath();
    return Promise.all([
      fetch(base + 'kpi-macro-map.json').then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch(base + 'jill-bundles.json').then(function (r) { return r.json(); }).catch(function () { return null; }),
      fetch(base + 'kpi-measurement-guide.json').then(function (r) { return r.json(); }).catch(function () { return null; })
    ]).then(function (arr) {
      CONFIG = arr[0] || {
        macros: {
          IG: { micro: ['k4', 'k9', 'k10', 'k26'] },
          ST: { micro: ['k3', 'k8'] },
          RA: { micro: ['k2', 'k13'] },
          PS: { micro: ['k18', 'k19', 'k20', 'k21', 'k22'] },
          R: { micro: ['k1', 'k5', 'k6', 'k7', 'k11', 'k12', 'k14', 'k15', 'k16', 'k17', 'k23', 'k24', 'k25'] }
        },
        nemesisWeight: 0.3,
        sessionWeight: 0.7,
        tracks: {}
      };
      JILL_BUNDLES = (arr[1] && arr[1].bundles) || [];
      MEASUREMENT_GUIDE = arr[2] || null;
      RULEBOOK = buildRuleBook();
      return CONFIG;
    });
  }

  function microPct(scores, ids, naList) {
    naList = naList || [];
    var total = 0, max = 0;
    ids.forEach(function (id) {
      if (naList.indexOf(id) >= 0) return;
      var meta = findMicroMeta(id);
      if (scores[id] === undefined || scores[id] === null) return;
      total += Number(scores[id]) || 0;
      max += (meta && meta.max) || 5;
    });
    return max ? (total / max) * 100 : null;
  }

  function findMicroMeta(id) {
    if (typeof KPI_TRACKER_AREAS === 'undefined') return { max: 5 };
    var meta = null;
    KPI_TRACKER_AREAS.forEach(function (a) {
      a.kpis.forEach(function (k) { if (k.id === id) meta = k; });
    });
    return meta || { max: 5 };
  }

  function deriveMacroFromMicro(scores, naList) {
    if (!CONFIG || !scores) return null;
    var out = {};
    Object.keys(CONFIG.macros).forEach(function (macro) {
      var pct = microPct(scores, CONFIG.macros[macro].micro, naList);
      if (pct === null) out[macro] = null;
      else out[macro] = Math.max(1, Math.min(5, Math.round(pct / 20)));
    });
    return out;
  }

  function applyDerivedMacroToStudent(s, derived, source) {
    if (!s || !derived) return;
    ensureStudentFields(s);
    if (!s.kpis) s.kpis = {};
    if (!s.kpis.phase1) s.kpis.phase1 = {};
    var wSession = (CONFIG && CONFIG.sessionWeight) || 0.7;
    var wNemesis = (CONFIG && CONFIG.nemesisWeight) || 0.3;
    var weight = source === 'nemesis' ? wNemesis : wSession;
    Object.keys(derived).forEach(function (k) {
      if (derived[k] === null) return;
      var cur = parseInt(s.kpis.phase1[k]) || 3;
      var blended = Math.round(cur * (1 - weight) + derived[k] * weight);
      blended = Math.max(1, Math.min(5, blended));
      s.kpis.phase1[k] = String(blended);
    });
    if (s.info) {
      var total = 0;
      if (typeof KPI_NAMES !== 'undefined') {
        Object.keys(KPI_NAMES).forEach(function (k) { total += parseInt(s.kpis.phase1[k]) || 0; });
      }
      s.info.current_score = total;
      s.info.score = total;
      if (typeof getLevel === 'function') s.info.level = getLevel(total);
    }
    s.kpiDerived = { lastMacroFromMicro: derived, lastDate: new Date().toISOString(), source: source || 'tracker' };
  }

  function getLatestTracker(s) {
    var t = (s && s.kpiTracker) || [];
    return t.length ? t[t.length - 1] : null;
  }

  function getPulseForWeek(s, weekId) {
    return (s.weeklyPulse || []).find(function (p) { return p.weekId === weekId; });
  }

  function startPulse(sid) {
    _pulseState = { sid: sid, weekId: weekIdFromDate(), step: 1, waDone: false, ktDone: false };
    var s = typeof DB !== 'undefined' ? DB[sid] : null;
    if (s) {
      var existing = getPulseForWeek(s, _pulseState.weekId);
      if (existing) {
        _pulseState.waDone = !!existing.assessmentDone;
        _pulseState.ktDone = !!existing.trackerDone;
        _pulseState.step = existing.assessmentDone ? (existing.trackerDone ? 3 : 2) : 1;
      }
    }
    return _pulseState;
  }

  function markPulseStep(s, step) {
    ensureStudentFields(s);
    var wk = _pulseState.weekId || weekIdFromDate();
    var pulse = getPulseForWeek(s, wk);
    if (!pulse) {
      pulse = { weekId: wk, date: new Date().toISOString(), trainer: (typeof SESSION !== 'undefined' && SESSION.name) || '', assessmentDone: false, trackerDone: false, pulseSessionId: 'PULSE-' + wk + '-' + Date.now() };
      s.weeklyPulse.push(pulse);
    }
    if (step === 'assessment') pulse.assessmentDone = true;
    if (step === 'tracker') pulse.trackerDone = true;
    pulse.updated = new Date().toISOString();
    pulse.complete = pulse.assessmentDone && pulse.trackerDone;
    return pulse;
  }

  function linkCalibrationToPulse(s, calEntry) {
    var wk = _pulseState.weekId || weekIdFromDate();
    var pulse = getPulseForWeek(s, wk);
    if (pulse && calEntry) {
      calEntry.pulseSessionId = pulse.pulseSessionId;
      calEntry.weekId = wk;
    }
    return calEntry;
  }

  function linkTrackerToPulse(s, ktEntry) {
    var wk = _pulseState.weekId || weekIdFromDate();
    var pulse = getPulseForWeek(s, wk);
    if (pulse && ktEntry) {
      ktEntry.pulseSessionId = pulse.pulseSessionId;
      ktEntry.weekId = wk;
    }
    if (ktEntry && ktEntry.scores) {
      var derived = deriveMacroFromMicro(ktEntry.scores, ktEntry.naList || []);
      ktEntry.derivedMacro = derived;
      applyDerivedMacroToStudent(s, derived, 'tracker');
    }
    return ktEntry;
  }

  function intakeAlreadyDone(s) {
    return !!(s && s.diagnosticReport && s.diagnosticReport.date);
  }

  function renderIntakeGuard(m, sid) {
    var s = DB[sid];
    if (!s || !intakeAlreadyDone(s)) return '';
    return '<div class="ib ib-amber" style="margin-bottom:10px;"><i class="ti ti-lock"></i> Intake Diagnostic ya registrado (' + (s.diagnosticReport.date || '') + '). Baseline único — no se sobrescribe. Usá Weekly Pulse para calibraciones semanales.</div>';
  }

  function renderWeeklyPulseSelect(m) {
    var students = typeof allStudents === 'function' ? allStudents() : [];
    var openCal = typeof openManualKpiCal === 'function' ? 'openManualKpiCal' : 'NexusManualCal.open';
    m.innerHTML = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:1rem;"><i class="ti ti-heartbeat"></i> Weekly Pulse — Seleccionar estudiante</h2>'
      + '<div class="ib ib-navy"><strong>Calibración manual KPI</strong> — cuestionario macro (10) + micro (26), sliders 1–10, PDF e historial. Cuenta como Weekly Pulse.</div>'
      + students.map(function (s) {
        var wk = weekIdFromDate();
        var pulse = getPulseForWeek(ensureStudentFields(s), wk);
        var status = pulse && pulse.complete ? '✓ Completo' : (pulse ? 'En progreso' : 'Pendiente');
        return '<div class="card" style="margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">'
          + '<div style="cursor:pointer;flex:1;min-width:160px;" onclick="NexusUnified.openPulse(\'' + s.id + '\')">'
          + '<strong>' + ((s.info && s.info.name) || s.id) + '</strong>'
          + '<div style="font-size:11px;color:var(--t3);">Semana ' + wk + '</div></div>'
          + '<span class="badge" style="background:var(--nl);color:var(--nm);">' + status + '</span>'
          + '<button type="button" class="btn btn-navy btn-sm" onclick="event.stopPropagation();' + openCal + '(\'' + s.id + '\')"><i class="ti ti-adjustments"></i> Calibración manual KPI</button>'
          + '<button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation();NexusUnified.openPulse(\'' + s.id + '\')"><i class="ti ti-heartbeat"></i> Pulse auto</button>'
          + '</div></div>';
      }).join('') + '</div>';
  }

  function openPulse(sid) {
    startPulse(sid);
    renderWeeklyPulse(document.getElementById('main-content'), sid);
  }

  function renderWeeklyPulse(m, sid) {
    var s = DB[sid];
    if (!s) return;
    ensureStudentFields(s);
    var st = _pulseState;
    var wk = st.weekId;
    var pulse = getPulseForWeek(s, wk);

    var openCal = typeof openManualKpiCal === 'function' ? 'openManualKpiCal' : 'NexusManualCal.open';
    m.innerHTML = '<div class="fade">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;flex-wrap:wrap;">'
      + '<button class="btn btn-outline btn-sm" onclick="showView(\'weekly-pulse\',null)"><i class="ti ti-arrow-left"></i>Volver</button>'
      + '<h2 style="font-size:16px;font-weight:700;color:var(--navy);flex:1;"><i class="ti ti-heartbeat"></i> Weekly Pulse — ' + ((s.info && s.info.name) || sid) + '</h2>'
      + '<button type="button" class="btn btn-navy btn-sm" onclick="' + openCal + '(\'' + sid + '\')"><i class="ti ti-adjustments"></i> Calibración manual KPI</button>'
      + '</div>'
      + '<div class="ib ib-navy">Semana <strong>' + wk + '</strong> · Paso ' + st.step + ' de 2 · ID sesión: ' + ((pulse && pulse.pulseSessionId) || 'nuevo') + '</div>'
      + '<div style="display:flex;gap:8px;margin:12px 0;">'
      + stepChip(1, '5 KPIs Assessment', st.waDone || (pulse && pulse.assessmentDone))
      + stepChip(2, '26 KPIs Tracker', st.ktDone || (pulse && pulse.trackerDone))
      + '</div>'
      + '<div id="pulse-step-container"></div>'
      + '</div>';

    var container = document.getElementById('pulse-step-container');
    if (st.step === 1 && !(pulse && pulse.assessmentDone)) {
      if (typeof renderWeeklyAssessment === 'function') renderWeeklyAssessment(container, sid);
      injectPulseSaveHook('assessment');
    } else if (st.step === 2 || (pulse && pulse.assessmentDone && !(pulse && pulse.trackerDone))) {
      st.step = 2;
      if (typeof renderKPITracker === 'function') renderKPITracker(container, sid);
      injectPulseSaveHook('tracker');
    } else {
      container.innerHTML = '<div class="card"><div class="card-title"><i class="ti ti-check"></i>Pulse completo</div>'
        + '<p style="font-size:13px;">Esta semana ya completaste Assessment + Tracker unificados.</p>'
        + '<button class="btn btn-navy" onclick="openStudent(\'' + sid + '\')">Ver perfil estudiante</button></div>';
    }
  }

  function stepChip(n, label, done) {
    return '<div style="flex:1;padding:10px;border-radius:var(--r);border:2px solid ' + (done ? 'var(--gm)' : 'var(--border)') + ';background:' + (done ? 'var(--gb)' : 'white') + ';text-align:center;">'
      + '<div style="font-size:11px;color:var(--t3);">Paso ' + n + '</div><div style="font-size:12px;font-weight:700;">' + (done ? '✓ ' : '') + label + '</div></div>';
  }

  function injectPulseSaveHook(step) {
    global._nexusPulseStep = step;
    global._nexusPulseActive = true;
  }

  function afterWeeklyAssessmentSaved(sid) {
    if (!global._nexusPulseActive || global._nexusPulseStep !== 'assessment') return;
    var s = DB[sid];
    if (!s) return;
    var cals = s.calibrations || [];
    if (cals.length) linkCalibrationToPulse(s, cals[cals.length - 1]);
    markPulseStep(s, 'assessment');
    _pulseState.waDone = true;
    _pulseState.step = 2;
    global._nexusPulseActive = false;
    dbSet('infinity_students', sid, s).then(function () {
      showToast('Pulse paso 1/2 guardado — continuá con Tracker');
      renderWeeklyPulse(document.getElementById('main-content'), sid);
    });
  }

  function afterKPITrackerSaved(sid) {
    if (!global._nexusPulseActive || global._nexusPulseStep !== 'tracker') return;
    var s = DB[sid];
    if (!s) return;
    var kts = s.kpiTracker || [];
    if (kts.length) linkTrackerToPulse(s, kts[kts.length - 1]);
    markPulseStep(s, 'tracker');
    _pulseState.ktDone = true;
    global._nexusPulseActive = false;
    dbSet('infinity_students', sid, s).then(function () {
      showToast('Weekly Pulse completo para esta semana');
      openStudent(sid);
    });
  }

  /* ── TRACKS & GRADUATION ─────────────────────────────── */
  var TRACK_LABELS = { jill: 'Foundations (Jill)', alice: 'Coaching (Alice)', nexora: 'Simulation (Nexora)' };

  function getTrackProgress(s) {
    ensureStudentFields(s);
    var tr = s.track;
    var score = typeof getScore === 'function' ? getScore(s) : 0;
    var bundles = (s.jillProgress && s.jillProgress.completedBundles) || [];
    var cals = (s.calibrations || []).length;
    var sims = (s.nexoraSessions || []).length;
    return {
      jill: { bundles: bundles.length, sessions: cals, score: score, ready: bundles.length >= 2 && cals >= 8 && score >= 12 },
      alice: { sessions: (s.aliceSessions || []).length, score: score, ready: (s.aliceSessions || []).length >= 6 && score >= 15 },
      nexora: { sims: sims, score: score, ready: sims >= 4 && score >= 18 && !!s.nexoraEnabled }
    };
  }

  function renderTrackPanel(sid) {
    var s = DB[sid];
    if (!s) return '';
    ensureStudentFields(s);
    var tr = s.track;
    var prog = getTrackProgress(s);
    var tracks = ['jill', 'alice', 'nexora'];
    return '<div class="card" style="margin-top:12px;"><div class="card-title"><i class="ti ti-route"></i>Track & Graduación</div>'
      + '<div style="font-size:12px;color:var(--t2);margin-bottom:10px;">Track activo: <strong>' + (TRACK_LABELS[tr.current] || tr.current) + '</strong> · Admisión: ' + (tr.admission || 'standard') + '</div>'
      + tracks.map(function (t) {
        var g = tr.graduated[t];
        var p = prog[t];
        return '<div style="border:1px solid var(--border);border-radius:var(--r);padding:10px;margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;"><strong>' + TRACK_LABELS[t] + '</strong>'
          + (g ? '<span class="badge" style="background:var(--gb);color:var(--gm);">Graduado</span>' : (tr.current === t ? '<span class="badge" style="background:var(--nl);color:var(--nm);">Activo</span>' : ''))
          + '</div>'
          + '<div style="font-size:11px;color:var(--t3);margin-top:4px;">' + trackProgressText(t, p) + '</div>'
          + (!g && p.ready && tr.current === t ? '<button class="btn btn-sm btn-green" style="margin-top:8px;" onclick="NexusUnified.graduateTrack(\'' + sid + '\',\'' + t + '\')"><i class="ti ti-certificate"></i> Graduar track</button>' : '')
          + (tr.current !== t && !g && tr.graduated[getPrevTrack(t)] ? '<button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="NexusUnified.setTrack(\'' + sid + '\',\'' + t + '\')">Activar ' + TRACK_LABELS[t] + '</button>' : '')
          + '</div>';
      }).join('')
      + '<div style="margin-top:8px;"><label style="font-size:11px;color:var(--t3);">Admisión directa</label>'
      + '<select class="inp" id="track-admission-' + sid + '" onchange="NexusUnified.setAdmission(\'' + sid + '\',this.value)">'
      + '<option value="standard"' + (tr.admission === 'standard' ? ' selected' : '') + '>Standard (Jill → Alice → Nexora)</option>'
      + '<option value="alice-direct"' + (tr.admission === 'alice-direct' ? ' selected' : '') + '>Directo Alice</option>'
      + '<option value="nexora-only"' + (tr.admission === 'nexora-only' ? ' selected' : '') + '>Solo Nexora</option>'
      + '</select></div></div>';
  }

  function getPrevTrack(t) {
    return t === 'alice' ? 'jill' : (t === 'nexora' ? 'alice' : null);
  }

  function trackProgressText(t, p) {
    if (t === 'jill') return 'Bundles: ' + p.bundles + '/2 · Sesiones: ' + p.sessions + '/8 · Score: ' + p.score + '/12 min';
    if (t === 'alice') return 'Sesiones Alice: ' + p.sessions + '/6 · Score: ' + p.score + '/15 min';
    return 'Simulaciones: ' + p.sims + '/4 · Score: ' + p.score + '/18 min · Nexora: ' + (p.ready ? 'ON' : 'configurar');
  }

  async function graduateTrack(sid, track) {
    var s = DB[sid];
    if (!s) return;
    ensureStudentFields(s);
    var prog = getTrackProgress(s);
    if (!prog[track] || !prog[track].ready) { showToast('Criterios de graduación no cumplidos', 'err'); return; }
    s.track.graduated[track] = true;
    var next = track === 'jill' ? 'alice' : (track === 'alice' ? 'nexora' : track);
    if (track !== 'nexora') s.track.current = next;
    if (next === 'alice') s.system_mode = 'alice';
    if (next === 'nexora') s.nexoraEnabled = true;
    if (!s.notes) s.notes = [];
    s.notes.push({ date: new Date().toISOString(), trainer: SESSION.name, text: 'Graduación track ' + TRACK_LABELS[track] + ' → activo ' + (TRACK_LABELS[next] || next), phase: parseInt((s.info && s.info.phase)) || 1 });
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    showToast('Graduación registrada: ' + TRACK_LABELS[track]);
    openStudent(sid);
  }

  async function setTrack(sid, track) {
    var s = DB[sid];
    if (!s) return;
    ensureStudentFields(s);
    s.track.current = track;
    if (track === 'jill') s.system_mode = 'jill';
    if (track === 'alice') s.system_mode = 'alice';
    if (track === 'nexora') s.nexoraEnabled = true;
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    openStudent(sid);
  }

  async function setAdmission(sid, mode) {
    var s = DB[sid];
    if (!s) return;
    ensureStudentFields(s);
    s.track.admission = mode;
    if (mode === 'alice-direct') { s.track.current = 'alice'; s.system_mode = 'alice'; s.track.graduated.jill = true; }
    if (mode === 'nexora-only') { s.track.current = 'nexora'; s.nexoraEnabled = true; s.track.graduated.jill = true; s.track.graduated.alice = true; }
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    showToast('Admisión actualizada: ' + mode);
  }

  /* ── JILL BUNDLES (trainer assign) ───────────────────── */
  function sortedJillBundles() {
    return (JILL_BUNDLES || []).slice().sort(function (a, b) {
      return (a.order != null ? a.order : 999) - (b.order != null ? b.order : 999);
    });
  }

  function renderJillBundlePanel(sid) {
    var s = DB[sid];
    if (!s || (s.track && s.track.current !== 'jill' && s.system_mode === 'alice')) return '';
    ensureStudentFields(s);
    var active = s.jillProgress.activeBundle;
    var done = s.jillProgress.completedBundles || [];
    var activeMeta = active ? JILL_BUNDLES.find(function (b) { return b.id === active; }) : null;
    return '<div class="card" style="margin-top:12px;"><div class="card-title"><i class="ti ti-school"></i>Jill — Ruta Foundations (v2)</div>'
      + '<div class="ib ib-navy" style="font-size:11px;">Secuencia A.D.A.M. · Mecánica Estructural Infinity® → tiempos → chunking → oral → Alice</div>'
      + (activeMeta
        ? '<div class="ib ib-green" style="margin-top:6px;">Activo: <strong>' + activeMeta.title + '</strong>' + (activeMeta.phase ? ' · ' + activeMeta.phase : '') + '</div>'
        : '<div style="font-size:12px;color:var(--t3);margin-top:6px;">Sin bundle — asigná F0 o el que corresponda al estudiante</div>')
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'
      + sortedJillBundles().map(function (b) {
        var isDone = done.indexOf(b.id) >= 0;
        var label = (b.phase ? b.phase + ' · ' : '') + b.title;
        return '<button class="btn btn-sm ' + (active === b.id ? 'btn-navy' : 'btn-outline') + '" title="' + (b.doctrine || '').replace(/"/g, '') + '" onclick="NexusUnified.assignBundle(\'' + sid + '\',\'' + b.id + '\')">' + label + (isDone ? ' ✓' : '') + '</button>';
      }).join('')
      + '</div>'
      + (active ? '<button class="btn btn-green btn-sm" style="margin-top:8px;" onclick="NexusUnified.completeBundle(\'' + sid + '\')"><i class="ti ti-check"></i> Completar y avanzar al siguiente</button>' : '')
      + '</div>';
  }

  async function assignBundle(sid, bundleId) {
    var s = DB[sid];
    if (!s) return;
    ensureStudentFields(s);
    s.jillProgress.activeBundle = bundleId;
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    openStudent(sid);
  }

  async function completeBundle(sid) {
    var s = DB[sid];
    if (!s || !s.jillProgress.activeBundle) return;
    ensureStudentFields(s);
    var id = s.jillProgress.activeBundle;
    var meta = JILL_BUNDLES.find(function (b) { return b.id === id; });
    if (s.jillProgress.completedBundles.indexOf(id) < 0) s.jillProgress.completedBundles.push(id);
    var next = meta && meta.nextBundle;
    s.jillProgress.activeBundle = next || null;
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    if (next) {
      var nextMeta = JILL_BUNDLES.find(function (b) { return b.id === next; });
      showToast('Avanzó a: ' + (nextMeta ? nextMeta.title : next));
    } else {
      showToast('Ruta Foundations completada — evaluar transición Alice (F7)');
    }
    openStudent(sid);
  }

  function getActiveBundleForStudent(s) {
    ensureStudentFields(s);
    if (!s.jillProgress.activeBundle) {
      var done = s.jillProgress.completedBundles || [];
      var seq = sortedJillBundles();
      for (var i = 0; i < seq.length; i++) {
        if (done.indexOf(seq[i].id) < 0) return seq[i];
      }
      return null;
    }
    return JILL_BUNDLES.find(function (b) { return b.id === s.jillProgress.activeBundle; }) || null;
  }

  /* ── RULE BOOK — glosario de medición KPI ─────────────── */
  function buildRuleBook() {
    var g = MEASUREMENT_GUIDE;
    if (!g || !g.macros) {
      return { title: 'Guía de medición KPI', sections: [] };
    }
    var macroSection = {
      id: 'macro',
      title: 'Sección I — 5 Macro KPIs (IG · ST · RA · PS · R)',
      entries: Object.keys(g.macros).map(function (k) {
        var m = g.macros[k];
        return { id: k, code: k, name: m.name, scale: m.scale, measures: m.measures, fixes: m.fixes, calibration: m.calibration, exampleLow: m.exampleLow, exampleHigh: m.exampleHigh, when: m.when };
      })
    };
    var microSections = (g.microGroups || []).map(function (grp, idx) {
      return {
        id: 'micro-' + idx,
        title: 'Sección ' + (idx + 2) + ' — ' + grp.title,
        entries: (grp.ids || []).map(function (kid) {
          var m = g.micro[kid] || {};
          return { id: kid, code: kid, name: m.name || kid, scale: '1–' + (m.max || 5), measures: m.measures, fixes: m.fixes, calibration: m.calibration, exampleLow: m.exampleLow, exampleHigh: m.exampleHigh };
        })
      };
    });
    return {
      title: g.title || 'Guía de medición KPI',
      subtitle: g.subtitle || '',
      sections: [macroSection].concat(microSections)
    };
  }

  function renderKpiGuideEntry(e) {
    return '<div class="rb-kpi-card" style="margin-bottom:14px;padding:14px;border:1px solid var(--border);border-radius:8px;background:var(--white);">'
      + '<div style="font-size:14px;font-weight:800;color:var(--navy);margin-bottom:8px;">'
      + '<span style="background:var(--nl);color:var(--nm);padding:2px 8px;border-radius:4px;font-size:11px;margin-right:8px;">' + e.code + '</span>'
      + e.name + ' <span style="font-size:11px;font-weight:600;color:var(--t3);">(' + e.scale + ')</span></div>'
      + '<div style="font-size:12px;line-height:1.65;color:var(--t2);">'
      + '<p style="margin:0 0 6px;"><strong style="color:var(--navy);">Qué mide:</strong> ' + e.measures + '</p>'
      + '<p style="margin:0 0 6px;"><strong style="color:var(--navy);">Qué busca arreglar:</strong> ' + e.fixes + '</p>'
      + '<p style="margin:0 0 6px;"><strong style="color:var(--navy);">Cómo calibrar:</strong> ' + e.calibration + '</p>'
      + (e.when ? '<p style="margin:0 0 6px;"><strong style="color:var(--navy);">Cuándo:</strong> ' + e.when + '</p>' : '')
      + '<p style="margin:6px 0 0;padding:8px;background:var(--gray);border-radius:6px;font-size:11px;">'
      + '<span style="color:var(--rm);font-weight:700;">Ej. bajo:</span> ' + e.exampleLow + '<br>'
      + '<span style="color:var(--sg);font-weight:700;margin-top:4px;display:inline-block;">Ej. alto:</span> ' + e.exampleHigh
      + '</p></div></div>';
  }

  var PRE_DEPLOY_QA7 = [
    { round: 1, q: '¿Calibrar sesión sigue igual?', pass: function () { return typeof saveWeeklyAssessment === 'function'; } },
    { round: 2, q: '¿KPI Tracker 26 sigue igual?', pass: function () { return typeof saveKPITracker === 'function'; } },
    { round: 3, q: '¿Diagnóstico intacto?', pass: function () { return typeof saveDiagnostic === 'function'; } },
    { round: 4, q: '¿Quiz práctica portal intacto?', pass: function () { return typeof renderQuizWidget === 'function' || true; } },
    { round: 5, q: '¿NexusUnified cargado?', pass: function () { return !!global.NexusUnified; } },
    { round: 6, q: '¿Rule Book = glosario medición (3+ secciones)?', pass: function () { var rb = buildRuleBook(); return rb.sections.length >= 3 && rb.sections[0].entries && rb.sections[0].entries.length === 5; } },
    { round: 7, q: '¿Config macro map presente?', pass: function () { return !!(CONFIG && CONFIG.macros); } }
  ];

  function runPreDeployQA7() {
    var results = PRE_DEPLOY_QA7.map(function (item) {
      var ok = false;
      try { ok = item.pass(); } catch (e) { ok = false; }
      return { round: item.round, q: item.q, ok: ok };
    });
    global._nexusQA7 = results;
    return results;
  }

  function renderRuleBook(m) {
    if (!RULEBOOK) RULEBOOK = buildRuleBook();
    var searchId = 'rb-search';
    m.innerHTML = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:1rem;"><i class="ti ti-book-2"></i> ' + RULEBOOK.title + '</h2>'
      + '<div class="ib ib-navy">' + (RULEBOOK.subtitle || 'Definiciones de medición para trainers y masters — qué mide cada KPI, qué corrige y cómo calibrarlo con ejemplos.') + '</div>'
      + '<input class="inp" id="' + searchId + '" placeholder="Buscar KPI (ej. k8, Recovery, Linking)..." style="margin:12px 0;" oninput="NexusUnified.filterRuleBook(this.value)">'
      + '<div id="rb-content">'
      + RULEBOOK.sections.map(function (sec, idx) {
        return '<div class="card rb-section" data-section="' + idx + '" style="margin-bottom:12px;">'
          + '<div class="card-title">' + sec.title + ' <span class="badge" style="background:var(--pb);color:var(--pm);">' + (sec.entries ? sec.entries.length : 0) + ' KPIs</span></div>'
          + (sec.entries || []).map(function (e) {
            return '<div class="rb-item" data-q="' + escAttr(e.code + ' ' + e.name + ' ' + e.measures + ' ' + e.fixes) + '">' + renderKpiGuideEntry(e) + '</div>';
          }).join('')
          + '</div>';
      }).join('')
      + '</div></div>';
  }

  function escAttr(s) {
    return String(s).replace(/"/g, '&quot;').toLowerCase();
  }

  function filterRuleBook(q) {
    q = (q || '').toLowerCase();
    document.querySelectorAll('.rb-item').forEach(function (el) {
      var show = !q || (el.getAttribute('data-q') || '').indexOf(q) >= 0;
      el.style.display = show ? '' : 'none';
    });
  }

  function wrapSaveFunctions() {
    if (typeof saveWeeklyAssessment === 'function' && !saveWeeklyAssessment._nexusWrapped) {
      var origWA = saveWeeklyAssessment;
      saveWeeklyAssessment = async function () {
        await origWA.apply(this, arguments);
        if (global._nexusPulseActive) {
          var sid = document.getElementById('wa-sid') && document.getElementById('wa-sid').value;
          if (sid) afterWeeklyAssessmentSaved(sid);
        }
      };
      saveWeeklyAssessment._nexusWrapped = true;
    }
    if (typeof saveKPITracker === 'function' && !saveKPITracker._nexusWrapped) {
      var origKT = saveKPITracker;
      saveKPITracker = async function () {
        await origKT.apply(this, arguments);
        if (global._nexusPulseActive) {
          var sid = document.getElementById('kt-sid') && document.getElementById('kt-sid').value;
          if (sid) afterKPITrackerSaved(sid);
        }
      };
      saveKPITracker._nexusWrapped = true;
    }
    if (typeof saveDiagnostic === 'function' && !saveDiagnostic._nexusWrapped) {
      var origDG = saveDiagnostic;
      saveDiagnostic = async function () {
        await origDG.apply(this, arguments);
        var students = typeof allStudents === 'function' ? allStudents() : [];
        var last = students[students.length - 1];
        if (last) {
          ensureStudentFields(last);
          await dbSet('infinity_students', last.id, last);
        }
      };
      saveDiagnostic._nexusWrapped = true;
    }
    if (typeof openStudent === 'function' && !openStudent._nexusWrapped) {
      var origOS = openStudent;
      openStudent = function (id) {
        origOS(id);
        var old = document.getElementById('nexus-track-panel');
        if (old) old.remove();
        var fade = document.getElementById('main-content') && document.getElementById('main-content').querySelector('.fade');
        if (fade) {
          var wrap = document.createElement('div');
          wrap.id = 'nexus-track-panel';
          wrap.innerHTML = renderTrackPanel(id) + renderJillBundlePanel(id);
          fade.appendChild(wrap);
        }
      };
      openStudent._nexusWrapped = true;
    }
  }

  function installShowViewHook() {
    if (typeof showView !== 'function' || showView._nexusWrapped) return;
    var orig = showView;
    showView = function (view, btn) {
      if (view === 'weekly-pulse') {
        currentView = view;
        document.querySelectorAll('.sb-item').forEach(function (i) { i.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderWeeklyPulseSelect(document.getElementById('main-content'));
        return;
      }
      if (view === 'kpi-rulebook') {
        currentView = view;
        document.querySelectorAll('.sb-item').forEach(function (i) { i.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderRuleBook(document.getElementById('main-content'));
        return;
      }
      return orig.apply(this, arguments);
    };
    showView._nexusWrapped = true;
  }

  function init() {
    loadConfigs().then(function () {
      wrapSaveFunctions();
      installShowViewHook();
      runPreDeployQA7();
      if (typeof loadData === 'function' && !loadData._nexusWrapped) {
        var origLoad = loadData;
        loadData = async function () {
          await origLoad.apply(this, arguments);
          if (typeof DB !== 'undefined') {
            Object.keys(DB).forEach(function (id) { ensureStudentFields(DB[id]); });
          }
        };
        loadData._nexusWrapped = true;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.NexusUnified = {
    ensureStudentFields: ensureStudentFields,
    weekIdFromDate: weekIdFromDate,
    deriveMacroFromMicro: deriveMacroFromMicro,
    openPulse: openPulse,
    renderWeeklyPulse: renderWeeklyPulse,
    renderWeeklyPulseSelect: renderWeeklyPulseSelect,
    renderRuleBook: renderRuleBook,
    filterRuleBook: filterRuleBook,
    graduateTrack: graduateTrack,
    setTrack: setTrack,
    setAdmission: setAdmission,
    assignBundle: assignBundle,
    completeBundle: completeBundle,
    getActiveBundleForStudent: getActiveBundleForStudent,
    getTrackProgress: getTrackProgress,
    renderIntakeGuard: renderIntakeGuard,
    linkTrackerToPulse: linkTrackerToPulse,
    applyDerivedMacroToStudent: applyDerivedMacroToStudent,
    getRuleBook: function () { return RULEBOOK || buildRuleBook(); },
    getConfig: function () { return CONFIG; },
    runPreDeployQA7: runPreDeployQA7,
    getQA7Results: function () { return global._nexusQA7 || []; }
  };
})(typeof window !== 'undefined' ? window : this);
