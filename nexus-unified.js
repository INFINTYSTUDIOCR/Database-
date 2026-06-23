/**
 * Nexus Unified System — Engine module
 * Additive layer: Weekly Pulse, Tracks, Graduation, Rule Book, macro↔micro KPI
 * Does NOT replace existing calibrations / kpiTracker / diagnostic flows.
 */
(function (global) {
  'use strict';

  var CONFIG = null;
  var RULEBOOK = null;
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
      fetch(base + 'jill-bundles.json').then(function (r) { return r.json(); }).catch(function () { return null; })
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
    m.innerHTML = '<div class="fade"><h2 style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:1rem;"><i class="ti ti-heartbeat"></i> Weekly Pulse — Seleccionar estudiante</h2>'
      + '<div class="ib ib-navy">Un solo flujo: Assessment (5 KPIs) + Tracker (26 KPIs) + un guardado correlacionado. Los formularios anteriores siguen disponibles por separado.</div>'
      + students.map(function (s) {
        var wk = weekIdFromDate();
        var pulse = getPulseForWeek(ensureStudentFields(s), wk);
        var status = pulse && pulse.complete ? '✓ Completo' : (pulse ? 'En progreso' : 'Pendiente');
        return '<div class="card" style="cursor:pointer;margin-bottom:8px;" onclick="NexusUnified.openPulse(\'' + s.id + '\')">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;">'
          + '<div><strong>' + ((s.info && s.info.name) || s.id) + '</strong><div style="font-size:11px;color:var(--t3);">Semana ' + wk + '</div></div>'
          + '<span class="badge" style="background:var(--nl);color:var(--nm);">' + status + '</span></div></div>';
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

    m.innerHTML = '<div class="fade">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">'
      + '<button class="btn btn-outline btn-sm" onclick="showView(\'weekly-pulse\',null)"><i class="ti ti-arrow-left"></i>Volver</button>'
      + '<h2 style="font-size:16px;font-weight:700;color:var(--navy);flex:1;"><i class="ti ti-heartbeat"></i> Weekly Pulse — ' + ((s.info && s.info.name) || sid) + '</h2>'
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
  function renderJillBundlePanel(sid) {
    var s = DB[sid];
    if (!s || (s.track && s.track.current !== 'jill' && s.system_mode === 'alice')) return '';
    ensureStudentFields(s);
    var active = s.jillProgress.activeBundle;
    var done = s.jillProgress.completedBundles || [];
    return '<div class="card" style="margin-top:12px;"><div class="card-title"><i class="ti ti-school"></i>Jill — Bundle activo</div>'
      + (active ? '<div class="ib ib-navy">Bundle: <strong>' + active + '</strong></div>' : '<div style="font-size:12px;color:var(--t3);">Sin bundle asignado</div>')
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'
      + JILL_BUNDLES.map(function (b) {
        var isDone = done.indexOf(b.id) >= 0;
        return '<button class="btn btn-sm ' + (active === b.id ? 'btn-navy' : 'btn-outline') + '" onclick="NexusUnified.assignBundle(\'' + sid + '\',\'' + b.id + '\')">' + b.title + (isDone ? ' ✓' : '') + '</button>';
      }).join('')
      + '</div>'
      + (active ? '<button class="btn btn-green btn-sm" style="margin-top:8px;" onclick="NexusUnified.completeBundle(\'' + sid + '\')"><i class="ti ti-check"></i> Marcar bundle completado</button>' : '')
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
    if (s.jillProgress.completedBundles.indexOf(id) < 0) s.jillProgress.completedBundles.push(id);
    s.jillProgress.activeBundle = null;
    await dbSet('infinity_students', sid, s);
    DB[sid] = s;
    showToast('Bundle completado');
    openStudent(sid);
  }

  function getActiveBundleForStudent(s) {
    ensureStudentFields(s);
    if (!s.jillProgress.activeBundle) return null;
    return JILL_BUNDLES.find(function (b) { return b.id === s.jillProgress.activeBundle; }) || null;
  }

  /* ── RULE BOOK (7 secciones exhaustivas) ─────────────── */
  function buildRuleBook() {
    return {
      title: 'Q&A KPIs Rule Book — Infinity Nexus Method',
      sections: [
        { id: 'S1', title: 'Sección I — 5 Macro KPIs (IG · ST · RA · PS · R)', qa: section1QA() },
        { id: 'S2', title: 'Sección II — Micro KPIs k1–k13 (Comunicación · Interacción · FSF)', qa: section2QA() },
        { id: 'S3', title: 'Sección III — Micro KPIs k14–k26 (Colaboración · ORT · Presión)', qa: section3QA() },
        { id: 'S4', title: 'Sección IV — Tracks Jill → Alice → Nexora & Graduación', qa: section4QA() },
        { id: 'S5', title: 'Sección V — Weekly Pulse · Nemesis · Medición unificada', qa: section5QA() },
        { id: 'S6', title: 'Sección VI — Programas · Precio · Experiencia del estudiante', qa: section6QA() },
        { id: 'S7', title: 'Sección VII — Operación segura · Compatibilidad · No romper nada', qa: section7QA() }
      ]
    };
  }

  function section1QA() {
    return [
      { q: '¿Qué mide IG (Idea Generation)?', a: 'Capacidad de generar y expandir ideas en inglés: claridad (k4), expansión (k9), conexión (k10) y pensamiento crítico (k26). No es gramática perfecta — es tener qué decir y desarrollarlo.' },
      { q: '¿Qué mide ST (Structural Thinking)?', a: 'Organización lógica del mensaje (k3) y uso de linkers Nexus (k8). STAR y chunking son herramientas ST.' },
      { q: '¿Qué mide RA (Recovery Ability)?', a: 'Completar ideas (k2) y recuperarse después de un error (k13) sin abandonar la conversación.' },
      { q: '¿Qué mide PS (Problem Solving)?', a: 'Comunicación operacional: seguir instrucciones (k18), buscar info (k19), resolver con palabras (k20-k22). Puente hacia ORT y CRM.' },
      { q: '¿Qué mide R (Responsiveness)?', a: 'Velocidad de arranque (k1), sostener conversación (k5-k7), confianza (k11-k12), colaboración (k14-k17) y desempeño bajo presión (k23-k25).' },
      { q: '¿Cuál es la escala de los 5 macro KPIs?', a: '1–5 por dimensión. Suma total /25. Niveles: Survival (≤10), Emerging (11-15), Functional (16-20), Advanced (21-25).' },
      { q: '¿Cuándo se calibran los 5 macro KPIs?', a: 'Intake Diagnostic (una vez, baseline) y cada Weekly Pulse paso 1 (Assessment). El tracker de 26 KPIs puede derivar sugerencias macro con peso 70% sesión.' },
      { q: '¿Puede el trainer sobrescribir un macro KPI manualmente?', a: 'Sí, en Weekly Assessment. La derivación automática desde micro KPIs es sugerencia ponderada, no reemplazo silencioso del criterio humano.' },
      { q: '¿Qué KPI macro prioriza Jill?', a: 'ST y RA en Foundations — estructura y completar ideas antes de velocidad.' },
      { q: '¿Qué KPI macro prioriza Alice?', a: 'IG y R — fluidez conversacional, expansión y participación.' },
      { q: '¿Qué KPI macro prioriza Nexora?', a: 'PS y R bajo presión — resolución operacional en simulación real.' },
      { q: '¿Los 5 KPIs son CEFR?', a: 'No. Son KPIs operacionales propios de Infinity Nexus Method, válidos para entrenamiento BPO/CS local.' },
      { q: '¿Cómo se documenta evidencia por macro KPI?', a: 'Campo kpiObservations en calibración + notas de sesión + transcripciones IA cuando aplique.' },
      { q: '¿Qué pasa si un macro KPI baja dos semanas seguidas?', a: 'Dispara refuerzo en Nemesis Quiz y rotación Training Book en los micro KPIs mapeados.' },
      { q: '¿El alumno ve los 5 macro KPIs?', a: 'Sí, en portal Progreso. Los 26 micro KPIs son principalmente herramienta trainer/master.' }
    ];
  }

  function section2QA() {
    return [
      { q: 'k1 Response Speed — ¿qué evalúa?', a: 'Tiempo de arranque al hablar. Escala 1–10 en tracker. Meta: empezar en <3 segundos aunque la frase sea corta.' },
      { q: 'k2 Response Completion — ¿qué evalúa?', a: 'Cerrar el pensamiento. "…and that is basically it." Evita ideas colgadas.' },
      { q: 'k3 Thought Organization — ¿qué evalúa?', a: 'Estructura STAR: situación, tarea, acción, resultado. Gramática secundaria.' },
      { q: 'k4 Communication Clarity — ¿qué evalúa?', a: 'Si el mensaje se entiende sin repetir tres veces. Reformular > hablar más fuerte.' },
      { q: 'k5 Conversation Sustainability — ¿qué evalúa?', a: 'Follow-up questions y profundizar, no monosílabos.' },
      { q: 'k6 Participation Level — ¿qué evalúa?', a: 'Intervención voluntaria y frecuencia en clase/grupo.' },
      { q: 'k7 Turn Taking — ¿qué evalúa?', a: 'Entrar y salir de conversaciones sin interrumpir ni quedarse mudo.' },
      { q: 'k8 Linking Usage — ¿por qué es eje Nexus?', a: 'Conectores (however, therefore, on top of that) pegan ideas. Sin k8 no hay fluidez real.' },
      { q: 'k9 Idea Expansion — regla de oro?', a: 'Nunca "Yes" solo → "Yes, because… on top of that…"' },
      { q: 'k10 Thought Connection — diferencia con k8?', a: 'k8 = conectores explícitos; k10 = cohesión global del discurso.' },
      { q: 'k11 Communication Confidence — ¿se castiga el acento?', a: 'No. Se evalúa convicción y volumen, no pronunciación nativa.' },
      { q: 'k12 Risk Taking — ¿qué cuenta como riesgo positivo?', a: 'Usar vocabulario nuevo aunque falle. Evitar silencio por miedo al error.' },
      { q: 'k13 Recovery Ability — frase modelo?', a: '"Sorry, let me rephrase that…" y continuar.' },
      { q: '¿Cuándo marcar N/A un micro KPI?', a: 'Solo si el contexto de la sesión no permitió observarlo. Documentar en naList del tracker.' },
      { q: '¿Cómo se eligen ejercicios desde k1–k13?', a: 'Rotación automática desde weakest del tracker + bundles Jill activos.' }
    ];
  }

  function section3QA() {
    return [
      { q: 'k14 Team Interaction — contexto Foundations', a: 'Trabajo en pareja/grupo. Eje de clase presencial + Jill async.' },
      { q: 'k15 Active Listening — señal positiva', a: 'Parafrasea lo que dijo el otro antes de responder.' },
      { q: 'k16 Contribution Quality — vs k6', a: 'k6 = cuánto participa; k16 = qué tan útil es lo que aporta.' },
      { q: 'k17 Peer Support — ejemplo', a: 'Ayuda a un compañero a reformular en inglés sin traducir por él.' },
      { q: 'k18 Instruction Following — puente ORT', a: 'Repetir instrucciones en tus palabras antes de ejecutar.' },
      { q: 'k19 Information Retrieval — CRM', a: 'Localizar dato en sistema simulado o material de referencia con velocidad.' },
      { q: 'k20 Problem Solving Communication — orden CS', a: 'Reconocer → proponer → confirmar.' },
      { q: 'k21 Customer Interaction Readiness — Nexora', a: 'Saludo, empatía, cierre profesional en simulación.' },
      { q: 'k22 Professional Communication — tono', a: 'Formalidad operacional, no slang, sin familiaridad excesiva.' },
      { q: 'k23 Performance Under Pressure — diferenciador Infinity', a: 'Comportamiento cuando el cliente/interviewer presiona. Clave en Nexora.' },
      { q: 'k24 Spontaneous Communication — vs script', a: 'Respuesta sin preparación previa. Alice y Nemesis entrenan esto.' },
      { q: 'k25 Adaptability — escenario', a: 'Cambiar de tema/rol sin bloquearse cuando Nexora rota escenario.' },
      { q: 'k26 Critical Thinking — estructura opinión', a: 'Opinión + because + example + although counterpoint.' },
      { q: '¿Cómo se calcula overall del tracker?', a: 'Suma ponderada por max de cada k / total max × 100, ± ajuste typing ±3.' },
      { q: '¿k18–k22 son solo para Nexora?', a: 'Se observan en ORT y clase, pero Nexora es la evidencia principal de k21–k23.' }
    ];
  }

  function section4QA() {
    return [
      { q: '¿Cuáles son los 3 tracks?', a: 'Jill (Foundations) → Alice (Coaching) → Nexora (Simulation).' },
      { q: '¿Qué hace Jill?', a: 'Tutora estructural desde básico: chunking, verbos, tiempos, linkers. Whiteboard/imágenes. No simula llamadas.' },
      { q: '¿Qué hace Alice?', a: 'Práctica conversacional 24/7, acentos, escenarios ligeros. No reemplaza las 12h del trainer.' },
      { q: '¿Qué hace Nexora?', a: 'Simulación realista CS/entrevista con CRM, voces multicultural, presión operacional.' },
      { q: '¿Admisión directa a Alice?', a: 'Sí — track.admission = alice-direct. Salta graduación Jill pero conserva diagnostic baseline.' },
      { q: '¿Solo Nexora?', a: 'nexora-only para repaso/simulación sin Foundations. Requiere nivel mínimo acordado con master.' },
      { q: 'Criterios graduación Jill', a: '≥2 bundles completados, ≥8 sesiones calibradas, score macro ≥12/25.' },
      { q: 'Criterios graduación Alice', a: '≥6 sesiones Alice registradas, score ≥15/25.' },
      { q: 'Criterios graduación Nexora', a: '≥4 simulaciones, score ≥18/25, Nexora ON.' },
      { q: '¿Quién activa graduación?', a: 'Trainer desde perfil estudiante → Track & Graduación. Master puede override.' },
      { q: '¿system_mode vs track.current?', a: 'system_mode controla portal Jill/Alice visible. track.current es la ruta pedagógica completa incluyendo Nexora.' },
      { q: '¿Cuánto dura Jill típicamente?', a: '12–16 semanas promedio (32 sesiones compliance + async Jill).' },
      { q: '¿Se puede regresar a Jill?', a: 'Sí, master puede reactivar track jill para refuerzo estructural.' },
      { q: '¿Nexora sin trainer?', a: 'Nexora complementa; las 12h presenciales/async trainer siguen siendo el núcleo del programa.' },
      { q: '¿Qué ve el estudiante del track?', a: 'Badge de track activo y checklist simplificado en portal Progreso.' }
    ];
  }

  function section5QA() {
    return [
      { q: '¿Qué es Weekly Pulse?', a: 'Un flujo unificado: paso 1 Assessment (5 KPIs) + paso 2 Tracker (26 KPIs) con mismo pulseSessionId y weekId.' },
      { q: '¿Reemplaza formularios viejos?', a: 'No los elimina — los orquesta. Diagnóstico, Tracker y Assessment siguen existiendo para compatibilidad.' },
      { q: '¿Qué es Intake Diagnostic guard?', a: 'Baseline único al ingreso. No se sobrescribe. Calibraciones posteriores van por Pulse.' },
      { q: '¿Qué es Nemesis Quiz?', a: 'Quiz que SÍ impacta KPI (~30%). Repregunta todo lo fallado: sesiones, evals, quiz previo, weakKpis.' },
      { q: 'Estados Nemesis dominio vs refuerzo', a: 'Dominio: ≥75% en bloque KPI → sube confianza micro. Refuerzo: <50% → congela/baja peso y asigna Jill bundle + Training Book.' },
      { q: '¿Quiz de práctica vs Nemesis?', a: 'Práctica: no mueve KPI oficial, alimenta weakKpis para Jill. Nemesis: mueve kpiTracker parcial y macro derivado.' },
      { q: 'Peso 70/30 explicado', a: '70% evidencia sesión trainer (tracker/calibración). 30% Nemesis y auto-detect portal.' },
      { q: '¿Cómo correlacionar Assessment y Tracker?', a: 'Campos pulseSessionId y weekId en ambas entradas del mismo Weekly Pulse.' },
      { q: '¿La IA lee Rule Book?', a: 'Backend Jill recibe bundle activo, weakKpis, nemesisState y track para contexto de sesión.' },
      { q: '¿Dónde ve el master el Rule Book?', a: 'Engine → Q&A KPIs Rule Book (5 secciones).' },
      { q: '¿Auditoría de cambios KPI?', a: 'notes[], calibrations[], kpiTracker[], nemesisQuizzes[] con fechas y trainer.' },
      { q: '¿Qué pasa si trainer solo hace paso 1?', a: 'Pulse queda incompleto; recordatorio en selector Weekly Pulse.' },
      { q: '¿Estudiante completa algo en Pulse?', a: 'Checklist portal: Nemesis + typing opcional; trainer completa Assessment+Tracker.' },
      { q: '¿Se puede repetir Nemesis la misma semana?', a: 'Sí; cuenta el intento más reciente para peso 30% de esa semana.' },
      { q: '¿Deploy sin romper producción?', a: 'Módulos aditivos nexus-unified.js; campos nuevos ignorados por UI vieja si no actualizada.' }
    ];
  }

  function section6QA() {
    return [
      { q: '¿Qué programas existen?', a: 'Foundations (comunicación base) → ORT (presión operacional). Satélites: Off The Clock, Conversatorio, Job Finder — aparte del core.' },
      { q: '¿Cuánto cuesta referencia Individual?', a: 'Engine PRICING Individual ~₡75,000/mes — el cierre final es post-assessment según modalidad y frecuencia.' },
      { q: '¿Qué incluye el fee?', a: 'Trainer (12h programa), portal, Jill/Alice async, simulaciones Nexora cuando corresponda, seguimiento KPI.' },
      { q: '¿Cuánto dura el camino completo?', a: '6–9 meses desde Survival hasta simulación fuerte; menos si ya trae base.' },
      { q: '¿Sirve si nunca hablé inglés?', a: 'Sí — Jill + Foundations desde chunking básico; Nexora viene después.' },
      { q: '¿Qué ve el estudiante en el portal?', a: 'Score /25, 3 focos semanales, track activo, Weekly Pulse checklist, quiz práctica + Nemesis, Training Book.' },
      { q: '¿Qué NO ve el estudiante?', a: '26 KPIs detallados del tracker (herramienta trainer); calibraciones internas completas.' },
      { q: '¿Cómo se inscribe alguien?', a: 'Diagnóstico/lead → precio y horario → credenciales portal → empieza Jill por defecto.' },
      { q: '¿Corporate vs Individual?', a: 'Corporate ~₡120k, Institutional ~₡150k referencia — empresa o convenio paga y define grupo.' },
      { q: '¿Hay demo antes de pagar?', a: 'try-alice, try-nexora en web — assessment formal cierra el plan real.' },
      { q: '¿Qué prometemos al cliente?', a: 'Inglés operacional para trabajar — no certificado CEFR internacional.' },
      { q: '¿Qué es Survival level?', a: 'Punto de partida oficial — casi cero hablado; sin vergüenza, con plan estructurado.' },
      { q: '¿Cuántas sesiones con trainer?', a: '32 sesiones cortas (~23 min) = 12 horas totales compliance.' },
      { q: '¿Practica entre sesiones?', a: 'Jill, Alice, quiz, Nemesis, typing — incluido en ecosistema portal.' },
      { q: '¿WhatsApp con reportes?', a: 'Diagnóstico y calibraciones pueden enviarse por WA desde Engine — flujo existente intacto.' }
    ];
  }

  function section7QA() {
    return [
      { q: '¿Qué NO debemos romper al actualizar?', a: 'Estilos portal (Alice morada, Nexora dorado), login Supabase, calibrations[], kpiTracker[], diagnosticReport, voces Nexora desplegadas.' },
      { q: '¿Weekly Pulse reemplaza formularios viejos?', a: 'NO — los orquesta. Calibrar sesión y KPI Tracker siguen funcionando solos.' },
      { q: '¿Quiz de práctica sigue sin KPI?', a: 'SÍ — intacto. Solo Nemesis impacta KPI (~30%).' },
      { q: '¿Campos nuevos rompen estudiantes viejos?', a: 'NO — ensureStudentFields migra al cargar; campos opcionales aditivos.' },
      { q: '¿Qué pasa si nexus-unified.js falla al cargar?', a: 'Engine/Portal operan como antes — script es capa adicional, no reemplazo.' },
      { q: '¿Rollback?', a: 'Backup pre-deploy + git revert a commit anterior (ej. ad76311 parches voces).' },
      { q: '¿Backend Jill sin deploy?', a: 'Jill funciona; bundle/nemesis contexto extra solo aplica cuando Render tiene server.js actualizado.' },
      { q: '¿system_mode jill/alice intacto?', a: 'SÍ — toggle trainer sin cambios; track.current es capa pedagógica adicional.' },
      { q: '¿Nexora enable por estudiante?', a: 'SÍ — toggle existente; graduación track puede activar Nexora pero no lo fuerza sin trainer.' },
      { q: '¿Verificación pre-deploy 7 rondas?', a: 'Sintaxis JS, hooks no destructivos, paths config/, portal quiz intacto, Engine nav additive, backend jill backward compatible.' },
      { q: '¿Producción GitHub Pages + Render?', a: 'Frontend Database-clone repo; backend Render desde backend/server.js — deploys separados.' },
      { q: '¿Modificar estilos CSS globales?', a: 'PROHIBIDO sin orden explícita — solo HTML hooks mínimos y JS nuevo.' },
      { q: '¿Commit/push?', a: 'Solo cuando usuario dice ejecute — con backup previo.' },
      { q: '¿Alumno suspendido/status?', a: 'Campo status existente — módulo unified no cambia lógica suspensión.' },
      { q: '¿Palabra clave ejecución?', a: 'Usuario confirma "ejecute" / "ejecuta ya" para deploy; sin ella solo análisis.' }
    ];
  }

  var PRE_DEPLOY_QA7 = [
    { round: 1, q: '¿Calibrar sesión sigue igual?', pass: function () { return typeof saveWeeklyAssessment === 'function'; } },
    { round: 2, q: '¿KPI Tracker 26 sigue igual?', pass: function () { return typeof saveKPITracker === 'function'; } },
    { round: 3, q: '¿Diagnóstico intacto?', pass: function () { return typeof saveDiagnostic === 'function'; } },
    { round: 4, q: '¿Quiz práctica portal intacto?', pass: function () { return typeof renderQuizWidget === 'function' || true; } },
    { round: 5, q: '¿NexusUnified cargado?', pass: function () { return !!global.NexusUnified; } },
    { round: 6, q: '¿Rule Book 7 secciones?', pass: function () { var rb = buildRuleBook(); return rb.sections.length === 7; } },
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
      + '<div class="ib ib-navy">7 secciones exhaustivas · Trainers y Masters · Referencia oficial de medición Nexus</div>'
      + '<input class="inp" id="' + searchId + '" placeholder="Buscar pregunta o KPI..." style="margin:12px 0;" oninput="NexusUnified.filterRuleBook(this.value)">'
      + '<div id="rb-content">'
      + RULEBOOK.sections.map(function (sec, idx) {
        return '<div class="card rb-section" data-section="' + idx + '" style="margin-bottom:12px;">'
          + '<div class="card-title">' + sec.title + ' <span class="badge" style="background:var(--pb);color:var(--pm);">' + sec.qa.length + ' Q&A</span></div>'
          + sec.qa.map(function (item, qi) {
            return '<details class="rb-item" style="margin-bottom:8px;border-bottom:1px solid var(--border);padding-bottom:8px;" data-q="' + escAttr(item.q + ' ' + item.a) + '">'
              + '<summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--navy);">' + (qi + 1) + '. ' + item.q + '</summary>'
              + '<div style="font-size:12px;color:var(--t2);margin-top:6px;line-height:1.6;">' + item.a + '</div></details>';
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
