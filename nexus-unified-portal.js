/**
 * Nexus Unified System — Portal module
 * Nemesis Quiz (impacta KPI), Weekly Pulse checklist estudiante, Track badge
 */
(function (global) {
  'use strict';

  var NEMESIS_WEIGHT = 0.3;

  function ensureFields(s) {
    if (global.NexusUnified && NexusUnified.ensureStudentFields) return NexusUnified.ensureStudentFields(s);
    if (!s.track) s.track = { current: 'jill', graduated: { jill: false, alice: false, nexora: false } };
    if (!s.nemesisQuizzes) s.nemesisQuizzes = [];
    if (!s.nemesisState) s.nemesisState = { domain: [], reinforcement: [] };
    if (!s.weeklyPulseCompletions) s.weeklyPulseCompletions = [];
    if (!s.kpiTracker) s.kpiTracker = [];
    return s;
  }

  function weekIdFromDate(d) {
    d = d || new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + String(week).padStart(2, '0');
  }

  function collectFailedKpis(s) {
    var failed = {};
    function add(k) { if (k) failed[k] = (failed[k] || 0) + 1; }

    (s.quizzes || []).slice(-10).forEach(function (q) {
      (q.kpiResults || []).forEach(function (r) { if (!r.correct) add(r.kpi); });
    });
    (s.nemesisQuizzes || []).slice(-5).forEach(function (q) {
      (q.kpiResults || []).forEach(function (r) { if (!r.correct) add(r.kpi); });
    });
    (s.quizWeakKpis || []).forEach(add);

    var lastKt = (s.kpiTracker || []).slice(-1)[0];
    if (lastKt && lastKt.weakest) lastKt.weakest.forEach(function (w) { add(w.id); });

    (s.calibrations || []).slice(-1)[0];
    var kpis = (s.kpis && s.kpis.phase1) || {};
    if (typeof KPI_NAMES !== 'undefined') {
      Object.keys(KPI_NAMES).forEach(function (mk) {
        if ((parseInt(kpis[mk]) || 5) <= 2) {
          var map = { IG: ['k4', 'k9', 'k10'], ST: ['k3', 'k8'], RA: ['k2', 'k13'], PS: ['k18', 'k20'], R: ['k1', 'k5'] };
          (map[mk] || []).forEach(add);
        }
      });
    }

    return Object.keys(failed).sort(function (a, b) { return failed[b] - failed[a]; });
  }

  function generateNemesisQuiz(s) {
    var pool = collectFailedKpis(s);
    var bank = typeof QUIZ_BANK !== 'undefined' ? QUIZ_BANK : {};
    var questions = [];
    pool.forEach(function (k) {
      if (bank[k] && questions.length < 10) questions.push(Object.assign({ kpi: k }, bank[k]));
    });
    var allKeys = Object.keys(bank);
    var tries = 0;
    while (questions.length < 8 && tries < 200) {
      var rk = allKeys[Math.floor(Math.random() * allKeys.length)];
      if (!questions.some(function (q) { return q.kpi === rk; })) {
        questions.push(Object.assign({ kpi: rk }, bank[rk]));
      }
      tries++;
    }
    return questions.slice(0, 10);
  }

  function renderNemesisWidget(containerId) {
    var s = typeof CURRENT_STUDENT !== 'undefined' ? CURRENT_STUDENT : null;
    if (!s) return;
    ensureFields(s);
    var quiz = generateNemesisQuiz(s);
    global._nemesisQuiz = quiz;
    var c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = '<div class="ib ib-amber" style="margin-bottom:8px;"><strong>Nemesis Quiz</strong> — repregunta tus fallos. <strong>Sí impacta KPI</strong> (~30% peso semanal).</div>'
      + (quiz.length ? quiz.map(function (item, i) {
        return '<div class="card" style="margin-bottom:8px;"><div style="font-size:13px;font-weight:700;margin-bottom:8px;">' + (i + 1) + '. [' + item.kpi + '] ' + item.q + '</div>'
          + item.options.map(function (opt, j) {
            return '<label style="display:block;font-size:13px;padding:6px 0;cursor:pointer;"><input type="radio" name="nemesis-q' + i + '" value="' + j + '" style="margin-right:8px;">' + opt + '</label>';
          }).join('') + '</div>';
      }).join('') : '<div style="font-size:13px;color:var(--t3);">No hay preguntas disponibles.</div>')
      + '<div style="display:flex;justify-content:flex-end;margin-top:8px;">'
      + '<button class="btn btn-navy" onclick="NexusPortal.submitNemesis(\'' + containerId + '\')"><i class="ti ti-skull"></i> Enviar Nemesis</button></div>'
      + '<div id="' + containerId + '-nemesis-result"></div>';
  }

  async function submitNemesis(containerId) {
    var quiz = global._nemesisQuiz || [];
    var s = CURRENT_STUDENT;
    if (!s || !quiz.length) return;
    ensureFields(s);

    var correct = 0;
    var kpiResults = [];
    var byKpi = {};

    quiz.forEach(function (item, i) {
      var sel = document.querySelector('input[name="nemesis-q' + i + '"]:checked');
      var selVal = sel ? parseInt(sel.value) : -1;
      var isCorrect = selVal === item.answer;
      if (isCorrect) correct++;
      kpiResults.push({ kpi: item.kpi, correct: isCorrect });
      if (!byKpi[item.kpi]) byKpi[item.kpi] = { ok: 0, fail: 0 };
      isCorrect ? byKpi[item.kpi].ok++ : byKpi[item.kpi].fail++;
    });

    var score = Math.round((correct / quiz.length) * 100);
    var domain = [];
    var reinforcement = [];
    Object.keys(byKpi).forEach(function (k) {
      var b = byKpi[k];
      var pct = b.ok / (b.ok + b.fail);
      if (pct >= 0.75) domain.push(k);
      else if (pct < 0.5) reinforcement.push(k);
    });

    var entry = {
      date: new Date().toISOString(),
      type: 'nemesis',
      correct: correct,
      total: quiz.length,
      score: score,
      kpiResults: kpiResults,
      domain: domain,
      reinforcement: reinforcement,
      weekId: weekIdFromDate()
    };

    s.nemesisQuizzes.push(entry);
    s.nemesisState = { domain: domain, reinforcement: reinforcement, lastScore: score, lastDate: entry.date };

    applyNemesisToTracker(s, entry);

    var wk = weekIdFromDate();
    var wc = s.weeklyPulseCompletions.find(function (x) { return x.weekId === wk; });
    if (!wc) {
      wc = { weekId: wk, nemesisDone: false, typingDone: false, date: new Date().toISOString() };
      s.weeklyPulseCompletions.push(wc);
    }
    wc.nemesisDone = true;
    wc.nemesisScore = score;
    wc.updated = new Date().toISOString();

    s.quizWeakKpis = reinforcement.concat(
      Object.keys(byKpi).filter(function (k) { return reinforcement.indexOf(k) < 0 && domain.indexOf(k) < 0; })
    );

    await dbSet('infinity_students', s.id, s);

    var msg = score >= 75 ? 'Dominio — KPIs reforzados positivamente.'
      : score >= 50 ? 'Progreso mixto — algunos KPIs en refuerzo.'
      : 'Refuerzo activo — Jill y Training Book priorizarán fallos.';

    document.getElementById(containerId + '-nemesis-result').innerHTML =
      '<div class="card" style="margin-top:10px;"><div style="text-align:center;font-size:24px;font-weight:800;">' + correct + '/' + quiz.length + ' (' + score + '%)</div>'
      + '<div style="font-size:12px;text-align:center;color:var(--t2);margin-bottom:8px;">' + msg + '</div>'
      + (domain.length ? '<div style="font-size:11px;color:var(--gm);">Dominio: ' + domain.join(', ') + '</div>' : '')
      + (reinforcement.length ? '<div style="font-size:11px;color:var(--rm);">Refuerzo: ' + reinforcement.join(', ') + '</div>' : '')
      + '<button class="btn btn-navy btn-sm" style="margin-top:10px;" onclick="NexusPortal.renderNemesisWidget(\'' + containerId + '\')">Nuevo Nemesis</button></div>';
  }

  function applyNemesisToTracker(s, entry) {
    var microScores = {};
    entry.kpiResults.forEach(function (r) {
      if (!microScores[r.kpi]) microScores[r.kpi] = [];
      microScores[r.kpi].push(r.correct ? 1 : 0);
    });
    var scores = {};
    Object.keys(microScores).forEach(function (k) {
      var arr = microScores[k];
      var pct = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
      scores[k] = Math.round(pct * 5);
    });

    var ktEntry = {
      date: entry.date,
      trainer: 'Nemesis Quiz (auto)',
      scores: scores,
      observations: {},
      source: 'nemesis',
      weekId: entry.weekId,
      overall: Math.round(entry.score),
      notes: 'Nemesis Quiz ' + entry.correct + '/' + entry.total + ' — dominio: ' + (entry.domain || []).join(',') + ' — refuerzo: ' + (entry.reinforcement || []).join(',')
    };

    s.kpiTracker.push(ktEntry);

    applyNemesisMacroBlend(s, scores);
  }

  function applyNemesisMacroBlend(s, microScores) {
    var macroMap = {
      IG: ['k4', 'k9', 'k10', 'k26'], ST: ['k3', 'k8'], RA: ['k2', 'k13'],
      PS: ['k18', 'k19', 'k20', 'k21', 'k22'],
      R: ['k1', 'k5', 'k6', 'k7', 'k11', 'k12', 'k14', 'k15', 'k16', 'k17', 'k23', 'k24', 'k25']
    };
    if (!s.kpis) s.kpis = {};
    if (!s.kpis.phase1) s.kpis.phase1 = {};
    var w = NEMESIS_WEIGHT;
    Object.keys(macroMap).forEach(function (macro) {
      var ids = macroMap[macro];
      var total = 0, count = 0;
      ids.forEach(function (id) {
        if (microScores[id] !== undefined) { total += microScores[id]; count++; }
      });
      if (!count) return;
      var derived = Math.max(1, Math.min(5, Math.round((total / count))));
      var cur = parseInt(s.kpis.phase1[macro]) || 3;
      s.kpis.phase1[macro] = String(Math.max(1, Math.min(5, Math.round(cur * (1 - w) + derived * w))));
    });
    if (s.info && typeof KPI_NAMES !== 'undefined') {
      var total = 0;
      Object.keys(KPI_NAMES).forEach(function (k) { total += parseInt(s.kpis.phase1[k]) || 0; });
      s.info.current_score = total;
      s.info.score = total;
      if (typeof getLevel === 'function') s.info.level = getLevel(total);
    }
  }

  function renderJourneyPath(s) {
    ensureFields(s);
    var track = (s.track && s.track.current) || 'jill';
    var steps = ['jill', 'alice', 'nexora'];
    var labels = { jill: 'Jill', alice: 'Alice', nexora: 'Nexora' };
    var idx = steps.indexOf(track);
    var pathHtml = steps.map(function (t, i) {
      var done = (s.track.graduated && s.track.graduated[t]) || i < idx;
      var active = t === track;
      return (i ? '━━━━' : '') + '<span style="color:' + (active ? 'var(--pm)' : (done ? 'var(--gm)' : 'var(--t3)') ) + ';font-weight:' + (active ? '700' : '400') + ';">' + (done && !active ? '✓' : (active ? '●' : '○')) + ' ' + labels[t] + '</span>';
    }).join('');

    var start = (s.info && s.info.start) || (s.diagnosticReport && s.diagnosticReport.date) || '';
    var weeks = start ? Math.max(1, Math.floor((Date.now() - new Date(start)) / (7 * 86400000))) : 1;
    var target = track === 'jill' ? 14 : (track === 'alice' ? 10 : 8);

    return '<div class="card" style="margin-bottom:12px;"><div class="card-title"><i class="ti ti-route"></i>Tu camino</div>'
      + '<div style="font-size:12px;line-height:1.8;margin-bottom:8px;">' + pathHtml + '</div>'
      + '<div style="font-size:11px;color:var(--t2);">Estás en <strong>' + labels[track] + '</strong> · Semana ~' + weeks + ' de ~' + target + '</div></div>';
  }

  function renderMacroTrends(s) {
    var kpis = (s.kpis && s.kpis.phase1) || {};
    var cals = (s.calibrations || []);
    var prev = cals.length >= 2 ? cals[cals.length - 2].kpis : null;
    var keys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];
    return '<div class="card" style="margin-bottom:12px;"><div class="card-title"><i class="ti ti-chart-bar"></i>KPIs (macro) · tendencia</div>'
      + keys.map(function (k) {
        var v = parseInt(kpis[k]) || 0;
        var pv = prev ? (parseInt(prev[k]) || v) : v;
        var arrow = v > pv ? '▲' : (v < pv ? '▼' : '→');
        var col = v >= 4 ? 'var(--gm)' : (v >= 3 ? 'var(--nm)' : 'var(--rm)');
        return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;">'
          + '<span style="width:100px;">' + (typeof KPI_NAMES !== 'undefined' ? KPI_NAMES[k].split(' ')[0] : k) + '</span>'
          + '<div style="flex:1;background:var(--gray);border-radius:4px;height:8px;"><div style="width:' + (v / 5 * 100) + '%;background:' + col + ';height:8px;border-radius:4px;"></div></div>'
          + '<span style="width:48px;text-align:right;">' + v + '/5 ' + arrow + '</span></div>';
      }).join('')
      + '</div>';
  }

  function renderNextMilestone(s) {
    var score = 0;
    var keys = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES) : ['IG', 'ST', 'RA', 'PS', 'R'];
    keys.forEach(function (k) { score += parseInt((s.kpis && s.kpis.phase1 && s.kpis.phase1[k]) || 0); });
    var target = 16;
    var level = score >= 16 ? 'Functional' : (score >= 21 ? 'Advanced' : 'Functional (16/25)');
    var weak = keys.filter(function (k) { return (parseInt((s.kpis && s.kpis.phase1 && s.kpis.phase1[k]) || 0) < 3); }).slice(0, 2);
    return '<div class="card" style="margin-bottom:12px;"><div class="card-title"><i class="ti ti-flag"></i>Próximo hito</div>'
      + '<div style="font-size:13px;">Meta: <strong>' + level + '</strong> (' + target + '/25)</div>'
      + '<div style="font-size:12px;color:var(--t2);margin-top:6px;">Score actual: ' + score + '/25'
      + (weak.length ? ' · Te faltan refuerzo en: ' + weak.join(', ') : '')
      + '</div></div>';
  }

  function renderWeeklyPulseStudent(s) {
    ensureFields(s);
    var wk = weekIdFromDate();
    var pulse = (s.weeklyPulse || []).find(function (p) { return p.weekId === wk; });
    var wc = (s.weeklyPulseCompletions || []).find(function (x) { return x.weekId === wk; });
    var trainerDone = pulse && pulse.complete;
    var nemesisDone = wc && wc.nemesisDone;
    var typingDone = wc && wc.typingDone;

    return '<div class="card" style="margin-bottom:12px;"><div class="card-title"><i class="ti ti-heartbeat"></i>Weekly Pulse — Semana ' + wk + '</div>'
      + '<div style="font-size:12px;color:var(--t2);margin-bottom:10px;">Las métricas se actualizan solas. Tu trainer confirma el pulso; vos completás práctica y Nemesis.</div>'
      + checklistRow('Trainer confirmó pulso semanal', trainerDone)
      + checklistRow('Nemesis Quiz (impacta KPI)', nemesisDone)
      + checklistRow('Typing Test (opcional)', typingDone)
      + '</div>';
  }

  function checklistRow(label, done) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">'
      + '<span style="color:' + (done ? 'var(--gm)' : 'var(--t3)') + ';">' + (done ? '✓' : '○') + '</span>'
      + '<span style="font-size:13px;">' + label + '</span></div>';
  }

  function renderTrackBadge(s) {
    ensureFields(s);
    var labels = { jill: 'Foundations · Jill', alice: 'Coaching · Alice', nexora: 'Simulation · Nexora' };
    var t = (s.track && s.track.current) || 'jill';
    return '<span class="badge" style="background:var(--pb);color:var(--pm);">' + (labels[t] || t) + '</span>';
  }

  function renderStudentFocus(s) {
    var kpis = (s.kpis && s.kpis.phase1) || {};
    var weakK = (s.quizWeakKpis || []).slice(0, 3);
    var sorted = typeof KPI_NAMES !== 'undefined' ? Object.keys(KPI_NAMES).sort(function (a, b) {
      return (parseInt(kpis[a]) || 0) - (parseInt(kpis[b]) || 0);
    }) : [];
    var macroWeak = sorted.slice(0, 2);
    return '<div class="card" style="margin-bottom:12px;"><div class="card-title"><i class="ti ti-focus-2"></i>Foco esta semana (auto)</div>'
      + (weakK.length ? weakK.map(function (k) {
        return '<div style="font-size:13px;padding:4px 0;">· ' + k + '</div>';
      }).join('') : macroWeak.map(function (k) {
        return '<div style="font-size:13px;padding:4px 0;">· ' + (typeof KPI_NAMES !== 'undefined' ? KPI_NAMES[k] : k) + '</div>';
      }).join(''))
      + '</div>';
  }

  function patchPortalTyping() {
    if (typeof savePortalTypingResult !== 'function' || savePortalTypingResult._nexusWrapped) return;
    var orig = savePortalTypingResult;
    savePortalTypingResult = async function (result) {
      await orig.apply(this, arguments);
      var s = CURRENT_STUDENT;
      if (!s) return;
      ensureFields(s);
      var wk = weekIdFromDate();
      var wc = s.weeklyPulseCompletions.find(function (x) { return x.weekId === wk; });
      if (!wc) {
        wc = { weekId: wk, nemesisDone: false, typingDone: false };
        s.weeklyPulseCompletions.push(wc);
      }
      wc.typingDone = true;
      wc.updated = new Date().toISOString();
      await dbSet('infinity_students', s.id, s);
    };
    savePortalTypingResult._nexusWrapped = true;
  }

  function getJillContext(s) {
    ensureFields(s);
    var bundle = global.NexusUnified && NexusUnified.getActiveBundleForStudent ? NexusUnified.getActiveBundleForStudent(s) : null;
    return {
      track: s.track,
      nemesisState: s.nemesisState,
      weakKpis: s.quizWeakKpis || [],
      jillBundle: bundle,
      reinforcement: (s.nemesisState && s.nemesisState.reinforcement) || []
    };
  }

  function init() {
    patchPortalTyping();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.NexusPortal = {
    renderNemesisWidget: renderNemesisWidget,
    submitNemesis: submitNemesis,
    renderWeeklyPulseStudent: renderWeeklyPulseStudent,
    renderTrackBadge: renderTrackBadge,
    renderJourneyPath: renderJourneyPath,
    renderMacroTrends: renderMacroTrends,
    renderNextMilestone: renderNextMilestone,
    renderStudentFocus: renderStudentFocus,
    getJillContext: getJillContext,
    collectFailedKpis: collectFailedKpis
  };
})(typeof window !== 'undefined' ? window : this);
