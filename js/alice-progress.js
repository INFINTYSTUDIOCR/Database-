/**
 * Alice Growth — hábito diario, spoken score, timeline unificado, KPI pulses.
 * Browser + testable (vm) via global AliceProgress.
 */
(function (global) {
  'use strict';

  var DAILY_GOAL_MINUTES = 2;
  var SPOKEN_WINDOW = 12;

  function todayKey(d) {
    var x = d ? new Date(d) : new Date();
    return x.toISOString().split('T')[0];
  }

  function yesterdayKey() {
    var x = new Date();
    x.setDate(x.getDate() - 1);
    return todayKey(x);
  }

  function daysBetween(a, b) {
    var da = new Date(a + 'T12:00:00');
    var db = new Date(b + 'T12:00:00');
    return Math.round((db - da) / 86400000);
  }

  function ensureGrowth(student) {
    if (!student) return { habit: defaultHabit(), pulses: [], spokenScore: 0 };
    if (!student.aliceGrowth || typeof student.aliceGrowth !== 'object') {
      student.aliceGrowth = { habit: defaultHabit(), pulses: [], spokenScore: 0 };
    }
    if (!student.aliceGrowth.habit) student.aliceGrowth.habit = defaultHabit();
    if (!Array.isArray(student.aliceGrowth.pulses)) student.aliceGrowth.pulses = [];
    return student.aliceGrowth;
  }

  function defaultHabit() {
    return {
      streak: 0,
      lastPracticeDate: null,
      totalSessions: 0,
      totalMinutes: 0,
      dailyGoalMinutes: DAILY_GOAL_MINUTES,
      todayMinutes: 0,
      todayDate: null,
      lastTopic: '',
      bestStreak: 0
    };
  }

  function estimateMinutes(turns, wordCount) {
    var fromTurns = (turns || 0) * 0.45;
    var fromWords = (wordCount || 0) / 90;
    return Math.max(0.5, Math.round((fromTurns + fromWords) * 10) / 10);
  }

  function countUserTurns(history) {
    return (history || []).filter(function (m) { return m.role === 'user' && String(m.content || '').trim(); }).length;
  }

  function countWords(history) {
    var text = (history || []).filter(function (m) { return m.role === 'user'; })
      .map(function (m) { return String(m.content || ''); }).join(' ');
    return (text.match(/\b[a-zA-Z']+\b/g) || []).length;
  }

  function updateStreak(habit, practiceDate) {
    var today = practiceDate || todayKey();
    if (habit.lastPracticeDate === today) return habit;
    if (!habit.lastPracticeDate) {
      habit.streak = 1;
    } else {
      var gap = daysBetween(habit.lastPracticeDate, today);
      if (gap === 1) habit.streak = (habit.streak || 0) + 1;
      else if (gap > 1) habit.streak = 1;
    }
    habit.lastPracticeDate = today;
    habit.bestStreak = Math.max(habit.bestStreak || 0, habit.streak || 0);
    return habit;
  }

  function updateTodayMinutes(habit, minutes, practiceDate) {
    var today = practiceDate || todayKey();
    if (habit.todayDate !== today) {
      habit.todayDate = today;
      habit.todayMinutes = 0;
    }
    habit.todayMinutes = Math.round(((habit.todayMinutes || 0) + minutes) * 10) / 10;
    return habit;
  }

  function collectSessionScores(student) {
    var rows = [];
    (student.aliceSessions || []).forEach(function (s) {
      if (s && s.date && s.score != null) rows.push({ date: s.date, score: parseInt(s.score, 10) || 0, type: 'practice' });
    });
    (student.companionSessions || []).forEach(function (s) {
      if (s && s.date && s.score != null) rows.push({ date: s.date, score: parseInt(s.score, 10) || 0, type: 'companion' });
    });
    (student.aliceGrowth && student.aliceGrowth.pulses || []).forEach(function (p) {
      if (p && p.date && p.score != null) rows.push({ date: p.date, score: parseInt(p.score, 10) || 0, type: p.type || 'pulse' });
    });
    rows.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    var seen = {};
    return rows.filter(function (r) {
      var k = r.date + '|' + r.type + '|' + r.score;
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });
  }

  function computeSpokenScore(student) {
    var rows = collectSessionScores(student).slice(-SPOKEN_WINDOW);
    if (!rows.length) return 0;
    var sum = 0;
    rows.forEach(function (r, i) {
      var w = 0.7 + (i / rows.length) * 0.6;
      sum += r.score * w;
    });
    var wsum = 0;
    rows.forEach(function (r, i) { wsum += 0.7 + (i / rows.length) * 0.6; });
    return Math.round(sum / wsum);
  }

  function spokenScoreDelta(student) {
    var rows = collectSessionScores(student);
    if (rows.length < 2) return null;
    var recent = computeSpokenScore(student);
    var withoutLast = { aliceSessions: (student.aliceSessions || []).slice(0, -1), companionSessions: student.companionSessions || [], aliceGrowth: student.aliceGrowth };
    if (rows.length) {
      var clone = Object.assign({}, student);
      if (rows[rows.length - 1].type === 'practice' && clone.aliceSessions && clone.aliceSessions.length) {
        clone.aliceSessions = clone.aliceSessions.slice(0, -1);
      } else if (rows[rows.length - 1].type === 'companion' && clone.companionSessions && clone.companionSessions.length) {
        clone.companionSessions = clone.companionSessions.slice(0, -1);
      }
      return recent - computeSpokenScore(clone);
    }
    return null;
  }

  function buildTimeline(student, limit) {
    var max = limit || 8;
    var events = [];
    (student.aliceSessions || []).forEach(function (s) {
      events.push({ date: s.date, type: 'practice', label: 'Práctica Nexus', score: s.score, icon: '🎓' });
    });
    (student.companionSessions || []).forEach(function (s) {
      events.push({
        date: s.date, type: 'companion',
        label: s.topic ? ('Companion · ' + s.topic) : 'Companion',
        score: s.score, icon: '💬', topic: s.topic || ''
      });
    });
  (student.kpiTracker || []).forEach(function (k) {
      events.push({ date: k.date, type: 'kpi', label: 'Evaluación trainer', score: k.overall, icon: '📊' });
    });
    events.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return events.slice(0, max);
  }

  function getContinueTopic(student) {
    var g = student && student.aliceGrowth;
    if (g && g.habit && g.habit.lastTopic) return g.habit.lastTopic;
    var comp = (student.companionSessions || []).slice(-1)[0];
    return (comp && comp.topic) ? comp.topic : '';
  }

  function recordSessionEnd(student, opts) {
    if (!student) return null;
    opts = opts || {};
    var growth = ensureGrowth(student);
    var habit = growth.habit;
    var turns = opts.turns != null ? opts.turns : 0;
    var minutes = opts.minutes != null ? opts.minutes : estimateMinutes(turns, opts.wordCount || 0);
    var today = todayKey();
    var prevDate = habit.lastPracticeDate;
    var prevTodayMin = habit.todayDate === today ? (habit.todayMinutes || 0) : 0;
    var goalMin = habit.dailyGoalMinutes || DAILY_GOAL_MINUTES;

    updateStreak(habit, today);
    updateTodayMinutes(habit, minutes, today);
    habit.totalSessions = (habit.totalSessions || 0) + 1;
    habit.totalMinutes = Math.round(((habit.totalMinutes || 0) + minutes) * 10) / 10;
    if (opts.topic) habit.lastTopic = String(opts.topic).slice(0, 80);

    var pulse = {
      date: new Date().toISOString(),
      type: opts.sessionType === 'companion' ? 'companion' : 'practice',
      score: opts.score != null ? opts.score : 0,
      topic: opts.topic || '',
      turns: turns,
      minutes: minutes,
      dimensions: opts.dimensions || null,
      focus_kpi_scores: opts.focus_kpi_scores || null,
      clarity_score: opts.clarity_score != null ? opts.clarity_score : null
    };
    growth.pulses.push(pulse);
    if (growth.pulses.length > 60) growth.pulses = growth.pulses.slice(-60);

    growth.spokenScore = computeSpokenScore(student);
    growth.spokenScoreUpdated = new Date().toISOString();

    if (opts.sessionType === 'companion' && opts.focus_kpi_scores) {
      applyCompanionKpiHints(student, opts.focus_kpi_scores, opts.score);
    }

    student.aliceGrowth = growth;
    return {
      growth: growth,
      streakExtended: prevDate !== today,
      newStreak: habit.streak || 0,
      dailyGoalJustMet: habit.todayDate === today && prevTodayMin < goalMin && (habit.todayMinutes || 0) >= goalMin
    };
  }

  function applyCompanionKpiHints(student, focusScores, sessionScore) {
    if (!student || !focusScores || typeof focusScores !== 'object') return;
    if (!student.kpiFile) student.kpiFile = { macro: {}, micro: {}, weakMacro: [], weakMicro: [] };
    var hints = student.kpiFile.companionHints || {};
    Object.keys(focusScores).forEach(function (id) {
      var v = parseInt(focusScores[id], 10) || 0;
      var prev = hints[id];
      hints[id] = prev == null ? v : Math.round((prev * 0.6) + (v * 0.4));
    });
    hints._lastSession = sessionScore;
    hints._updated = new Date().toISOString();
    student.kpiFile.companionHints = hints;
    var ranked = Object.keys(hints).filter(function (k) { return k.charAt(0) !== '_'; })
      .map(function (id) { return { id: id, v: hints[id] }; })
      .sort(function (a, b) { return a.v - b.v; });
    if (ranked.length) {
      student.kpiFile.weakMicro = ranked.slice(0, 3).map(function (r) { return r.id; });
    }
  }

  function dailyGoalMet(student) {
    var h = ensureGrowth(student).habit;
    if (h.todayDate !== todayKey()) return false;
    return (h.todayMinutes || 0) >= (h.dailyGoalMinutes || DAILY_GOAL_MINUTES);
  }

  function renderHabitStrip(student) {
    if (!student) return '';
    var g = ensureGrowth(student);
    var h = g.habit;
    var spoken = g.spokenScore || computeSpokenScore(student);
    var delta = spokenScoreDelta(student);
    var goal = h.dailyGoalMinutes || DAILY_GOAL_MINUTES;
    var todayMin = h.todayDate === todayKey() ? (h.todayMinutes || 0) : 0;
    var pct = Math.min(100, Math.round((todayMin / goal) * 100));
    var streak = h.streak || 0;
    var deltaHtml = delta != null
      ? '<span style="font-size:10px;color:' + (delta >= 0 ? '#86EFAC' : '#FCA5A5') + ';">' + (delta >= 0 ? '▲+' : '▼') + delta + '</span>'
      : '';
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:1rem;">'
      + '<div style="background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.25);border-radius:12px;padding:10px 12px;text-align:center;">'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">RACHA</div>'
      + '<div style="font-size:22px;font-weight:900;color:#F5A623;">🔥 ' + streak + '</div>'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.45);">día' + (streak === 1 ? '' : 's') + '</div></div>'
      + '<div style="background:rgba(134,239,172,0.1);border:1px solid rgba(134,239,172,0.22);border-radius:12px;padding:10px 12px;text-align:center;">'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">INGLÉS HABLADO</div>'
      + '<div style="font-size:22px;font-weight:900;color:#86EFAC;">' + spoken + '<span style="font-size:11px;opacity:0.5;">/100</span></div>'
      + deltaHtml + '</div>'
      + '<div style="background:rgba(192,132,252,0.1);border:1px solid rgba(192,132,252,0.22);border-radius:12px;padding:10px 12px;text-align:center;">'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">HOY</div>'
      + '<div style="font-size:22px;font-weight:900;color:#C084FC;">' + todayMin + '<span style="font-size:11px;opacity:0.5;">/' + goal + 'm</span></div>'
      + '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:4px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#7C3AED,#C084FC);"></div></div>'
      + '</div>'
      + '<div style="grid-column:1/-1;text-align:center;margin-top:2px;">'
      + (typeof AliceBadgesCefr !== 'undefined' ? AliceBadgesCefr.renderCefrPill(student, spoken) : '')
      + '</div></div>';
  }

  function renderQuickStart(student, companionEnabled) {
    if (!companionEnabled) return '';
    var topic = getContinueTopic(student);
    var quick = '<button type="button" onclick="startAliceCompanionQuick()" style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 16px;border-radius:12px;border:2px solid #86EFAC;background:rgba(134,239,172,0.15);color:#86EFAC;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:10px;">'
      + '<i class="ti ti-microphone"></i> Charla rápida con Alice <span style="font-size:11px;opacity:0.8;">(libre · sin mínimo)</span></button>';
    var cont = topic
      ? '<button type="button" onclick=\'startAliceCompanionQuick(' + JSON.stringify(topic) + ')\' style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(192,132,252,0.35);background:rgba(192,132,252,0.08);color:#C084FC;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:10px;">'
        + '<i class="ti ti-message-circle"></i> Seguir charlando: ' + escapeHtml(topic) + '</button>'
      : '';
    return quick + cont;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderProgressAddon(student) {
    if (!student) return '';
    var g = ensureGrowth(student);
    var spoken = g.spokenScore || computeSpokenScore(student);
    var timeline = buildTimeline(student, 5);
    if (!spoken && !timeline.length) return '';
    var tl = timeline.map(function (e) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'
        + '<span>' + e.icon + ' ' + escapeHtml(e.label) + '</span>'
        + '<span style="color:#F5A623;font-weight:700;">' + (e.score != null ? e.score + '/100' : '') + '</span></div>';
    }).join('');
    return '<div style="background:linear-gradient(135deg,#1a0533,#2d1060);border-radius:14px;padding:1rem 1.25rem;margin-bottom:1rem;color:white;border:1px solid rgba(192,132,252,0.2);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
      + '<div style="font-size:11px;letter-spacing:0.12em;color:rgba(255,255,255,0.5);font-weight:700;">ALICE · INGLÉS HABLADO</div>'
      + '<div style="font-size:28px;font-weight:900;color:#86EFAC;">' + spoken + '<span style="font-size:12px;opacity:0.5;">/100</span></div></div>'
      + (tl ? '<div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700;margin-bottom:4px;">ACTIVIDAD RECIENTE</div>' + tl : '')
      + '</div>';
  }

  function renderEngineTrainerBlock(student, sid) {
    if (!student) return '';
    var g = ensureGrowth(student);
    var h = g.habit;
    var spoken = g.spokenScore || computeSpokenScore(student);
    var compN = (student.companionSessions || []).length;
    var aliceN = (student.aliceSessions || []).length;
    var id = sid || student.id || '';
    return '<div class="card" style="margin-bottom:1rem;border-left:4px solid #86EFAC;">'
      + '<div class="card-title"><i class="ti ti-messages" style="color:#059669;"></i>Alice Growth</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px;">'
      + '<span><strong>Inglés hablado:</strong> ' + spoken + '/100</span>'
      + '<span><strong>Racha:</strong> 🔥 ' + (h.streak || 0) + ' días</span>'
      + '<span><strong>Sesiones:</strong> ' + aliceN + ' práctica · ' + compN + ' companion</span>'
      + '<span><strong>Minutos totales:</strong> ' + (h.totalMinutes || 0) + '</span>'
      + (h.lastTopic ? '<span><strong>Último tema:</strong> ' + escapeHtml(h.lastTopic) + '</span>' : '')
      + (g.cefr && g.cefr.level ? '<span><strong>CEFR:</strong> ' + g.cefr.level + '</span>' : '')
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">'
      + '<button type="button" class="btn btn-outline btn-sm" onclick="exportAliceB2BReport(\'' + id + '\')"><i class="ti ti-download"></i> Exportar informe Alice</button>'
      + '</div></div>';
  }

  global.AliceProgress = {
    DAILY_GOAL_MINUTES: DAILY_GOAL_MINUTES,
    todayKey: todayKey,
    ensureGrowth: ensureGrowth,
    estimateMinutes: estimateMinutes,
    countUserTurns: countUserTurns,
    countWords: countWords,
    computeSpokenScore: computeSpokenScore,
    spokenScoreDelta: spokenScoreDelta,
    buildTimeline: buildTimeline,
    getContinueTopic: getContinueTopic,
    recordSessionEnd: recordSessionEnd,
    applyCompanionKpiHints: applyCompanionKpiHints,
    dailyGoalMet: dailyGoalMet,
    renderHabitStrip: renderHabitStrip,
    renderQuickStart: renderQuickStart,
    renderProgressAddon: renderProgressAddon,
    renderEngineTrainerBlock: renderEngineTrainerBlock
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
