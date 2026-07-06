/**
 * Jill Growth — racha, XP, premios/badges, meta diaria (tema verde Foundations).
 */
(function (global) {
  'use strict';

  var DAILY_GOAL_MINUTES = 2;
  var XP_PER_LEVEL = 80;

  var LEVEL_TITLES = ['Aprendiz', 'Chunker', 'Constructor', 'Linker', 'Nexus Pro', 'Maestro'];

  var BADGE_DEFS = [
    { id: 'first_jill', icon: '🌿', name: 'Primera sesión', desc: 'Completaste tu primera sesión con Jill' },
    { id: 'streak_3', icon: '🔥', name: 'Racha 3', desc: '3 días seguidos con Jill' },
    { id: 'streak_7', icon: '⚡', name: 'Racha 7', desc: 'Una semana de práctica' },
    { id: 'daily_goal', icon: '✅', name: 'Meta diaria', desc: 'Alcanzaste tu meta de minutos hoy' },
    { id: 'score_75', icon: '💪', name: 'Sesión fuerte', desc: 'Evaluación 75+ en una sesión' },
    { id: 'bundle_done', icon: '🧱', name: 'Módulo listo', desc: 'Completaste un bundle Foundations' },
    { id: 'bundles_3', icon: '🏗️', name: 'Constructor', desc: '3 bundles completados' },
    { id: 'minutes_20', icon: '⏱️', name: '20 minutos', desc: '20 minutos totales con Jill' },
    { id: 'xp_150', icon: '⭐', name: 'Estrella Nexus', desc: '150 XP acumulados' },
    { id: 'quiz_100', icon: '💀', name: 'Nemesis vencido', desc: '100% en Jill Pro Nemesis Quest' }
  ];

  function todayKey(d) {
    var x = d ? new Date(d) : new Date();
    return x.toISOString().split('T')[0];
  }

  function daysBetween(a, b) {
    var da = new Date(a + 'T12:00:00');
    var db = new Date(b + 'T12:00:00');
    return Math.round((db - da) / 86400000);
  }

  function ensureGrowth(student) {
    if (!student) return { habit: defaultHabit(), badges: [], xp: 0 };
    if (!student.jillGrowth || typeof student.jillGrowth !== 'object') {
      student.jillGrowth = { habit: defaultHabit(), badges: [], xp: 0, pulses: [] };
    }
    if (!student.jillGrowth.habit) student.jillGrowth.habit = defaultHabit();
    if (!Array.isArray(student.jillGrowth.badges)) student.jillGrowth.badges = [];
    if (!Array.isArray(student.jillGrowth.pulses)) student.jillGrowth.pulses = [];
    if (student.jillGrowth.xp == null) student.jillGrowth.xp = 0;
    return student.jillGrowth;
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
      bestStreak: 0
    };
  }

  function estimateMinutes(turns, wordCount) {
    var fromTurns = (turns || 0) * 0.5;
    var fromWords = (wordCount || 0) / 85;
    return Math.max(0.5, Math.round((fromTurns + fromWords) * 10) / 10);
  }

  function countUserTurns(history) {
    return (history || []).filter(function (m) { return m.role === 'user' && String(m.content || '').trim(); }).length;
  }

  function countWords(history) {
    var text = (history || []).filter(function (m) { return m.role === 'user'; })
      .map(function (m) { return String(m.content || ''); }).join(' ');
    return (text.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ']+\b/gi) || []).length;
  }

  function updateStreak(habit, practiceDate) {
    var today = practiceDate || todayKey();
    if (habit.lastPracticeDate === today) return habit;
    if (!habit.lastPracticeDate) habit.streak = 1;
    else {
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

  function levelFromXp(xp) {
    return Math.max(1, Math.floor((xp || 0) / XP_PER_LEVEL) + 1);
  }

  function levelTitle(level) {
    return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || 'Maestro';
  }

  function xpProgress(xp) {
    var inLevel = (xp || 0) % XP_PER_LEVEL;
    return Math.round((inLevel / XP_PER_LEVEL) * 100);
  }

  function addXp(growth, amount) {
    growth.xp = Math.max(0, (growth.xp || 0) + (amount || 0));
    return growth.xp;
  }

  function unlockBadge(student, id) {
    var g = ensureGrowth(student);
    if (g.badges.indexOf(id) >= 0) return false;
    g.badges.push(id);
    student.jillGrowth = g;
    return true;
  }

  function getBadgeDef(id) {
    for (var i = 0; i < BADGE_DEFS.length; i++) {
      if (BADGE_DEFS[i].id === id) return BADGE_DEFS[i];
    }
    return null;
  }

  function dailyGoalMet(student) {
    var h = ensureGrowth(student).habit;
    if (h.todayDate !== todayKey()) return false;
    return (h.todayMinutes || 0) >= (h.dailyGoalMinutes || DAILY_GOAL_MINUTES);
  }

  function checkBadges(student, opts) {
    if (!student) return [];
    opts = opts || {};
    var g = ensureGrowth(student);
    var h = g.habit || {};
    var unlocked = [];
    var bundlesDone = (student.jillProgress && student.jillProgress.completedBundles) || [];

    if ((h.totalSessions || 0) >= 1 && unlockBadge(student, 'first_jill')) unlocked.push('first_jill');
    if ((h.streak || 0) >= 3 && unlockBadge(student, 'streak_3')) unlocked.push('streak_3');
    if ((h.streak || 0) >= 7 && unlockBadge(student, 'streak_7')) unlocked.push('streak_7');
    if (opts.dailyGoalMet && unlockBadge(student, 'daily_goal')) unlocked.push('daily_goal');
    if ((opts.score || 0) >= 75 && unlockBadge(student, 'score_75')) unlocked.push('score_75');
    if (opts.bundleReady && unlockBadge(student, 'bundle_done')) unlocked.push('bundle_done');
    if (bundlesDone.length >= 3 && unlockBadge(student, 'bundles_3')) unlocked.push('bundles_3');
    if ((h.totalMinutes || 0) >= 20 && unlockBadge(student, 'minutes_20')) unlocked.push('minutes_20');
    if ((g.xp || 0) >= 150 && unlockBadge(student, 'xp_150')) unlocked.push('xp_150');
    if (opts.quizPerfect && unlockBadge(student, 'quiz_100')) unlocked.push('quiz_100');

    return unlocked;
  }

  function recordSessionEnd(student, opts) {
    if (!student) return null;
    opts = opts || {};
    var growth = ensureGrowth(student);
    var habit = growth.habit;
    var turns = opts.turns != null ? opts.turns : 0;
    var minutes = opts.minutes != null ? opts.minutes : estimateMinutes(turns, opts.wordCount || 0);
    var score = opts.score != null ? parseInt(opts.score, 10) || 0 : 0;
    var today = todayKey();

    updateStreak(habit, today);
    updateTodayMinutes(habit, minutes, today);
    habit.totalSessions = (habit.totalSessions || 0) + 1;
    habit.totalMinutes = Math.round(((habit.totalMinutes || 0) + minutes) * 10) / 10;

    var xpGain = 12 + Math.min(20, Math.round(score / 5));
    if (opts.bundleReady) xpGain += 25;
    if (habit.streak >= 3) xpGain += 5;
    addXp(growth, xpGain);

    var pulse = {
      date: new Date().toISOString(),
      score: score,
      bundleId: opts.bundleId || '',
      turns: turns,
      minutes: minutes,
      xpGain: xpGain
    };
    growth.pulses.push(pulse);
    if (growth.pulses.length > 50) growth.pulses = growth.pulses.slice(-50);
    student.jillGrowth = growth;

    if (!student.jillSessions) student.jillSessions = [];
    student.jillSessions.push({
      date: pulse.date,
      score: score,
      bundleId: opts.bundleId || '',
      turns: turns,
      minutes: minutes
    });
    if (student.jillSessions.length > 40) student.jillSessions = student.jillSessions.slice(-40);

    return { growth: growth, xpGain: xpGain };
  }

  function renderHabitStrip(student) {
    if (!student) return '';
    var g = ensureGrowth(student);
    var h = g.habit;
    var goal = h.dailyGoalMinutes || DAILY_GOAL_MINUTES;
    var todayMin = h.todayDate === todayKey() ? (h.todayMinutes || 0) : 0;
    var pct = Math.min(100, Math.round((todayMin / goal) * 100));
    var streak = h.streak || 0;
    var xp = g.xp || 0;
    var lvl = levelFromXp(xp);
    var lvlPct = xpProgress(xp);
    var title = levelTitle(lvl);

    return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">'
      + '<div style="background:rgba(245,166,35,0.14);border:1px solid rgba(245,166,35,0.35);border-radius:12px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.55);font-weight:800;letter-spacing:0.06em;">RACHA</div>'
      + '<div style="font-size:22px;font-weight:900;color:#FCD34D;">🔥 ' + streak + '</div>'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.45);">mejor ' + (h.bestStreak || 0) + '</div></div>'
      + '<div style="background:rgba(61,220,151,0.12);border:1px solid rgba(61,220,151,0.35);border-radius:12px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.55);font-weight:800;">NIVEL ' + lvl + '</div>'
      + '<div style="font-size:13px;font-weight:900;color:#86EFAC;">' + title + '</div>'
      + '<div style="font-size:9px;color:#bbf7d0;">' + xp + ' XP</div>'
      + '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:3px;margin-top:4px;"><div style="height:100%;width:' + lvlPct + '%;background:#3DDC97;border-radius:3px;"></div></div></div>'
      + '<div style="background:rgba(134,239,172,0.1);border:1px solid rgba(134,239,172,0.28);border-radius:12px;padding:10px 8px;text-align:center;">'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.55);font-weight:800;">HOY</div>'
      + '<div style="font-size:20px;font-weight:900;color:#86EFAC;">' + todayMin + '<span style="font-size:10px;opacity:0.55;">/' + goal + 'm</span></div>'
      + '<div style="height:3px;background:rgba(0,0,0,0.2);border-radius:3px;margin-top:4px;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#0a5c3c,#86EFAC);"></div></div></div>'
      + '</div>';
  }

  function renderBadgesRow(student) {
    var badges = ensureGrowth(student).badges;
    if (!badges.length) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:12px;text-align:center;">🏅 Practicá con Jill para desbloquear premios</div>';
    }
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;">'
      + badges.map(function (id) {
        var b = getBadgeDef(id);
        if (!b) return '';
        return '<span title="' + b.desc + '" style="display:inline-flex;align-items:center;gap:4px;background:rgba(61,220,151,0.15);border:1px solid rgba(61,220,151,0.4);border-radius:20px;padding:5px 11px;font-size:11px;font-weight:700;color:#bbf7d0;">'
          + b.icon + ' ' + b.name + '</span>';
      }).join('')
      + '</div>';
  }

  function nextPrizeHint(student) {
    var g = ensureGrowth(student);
    var h = g.habit || {};
    var badges = g.badges || [];
    var hints = [];
    if (badges.indexOf('first_jill') < 0) hints.push('🌿 Primera sesión');
    else if ((h.streak || 0) < 3 && badges.indexOf('streak_3') < 0) hints.push('🔥 Racha 3 días');
    else if (!dailyGoalMet(student) && badges.indexOf('daily_goal') < 0) hints.push('✅ Meta diaria (' + DAILY_GOAL_MINUTES + ' min)');
    else if (badges.indexOf('quiz_100') < 0) hints.push('💀 Jill Pro Nemesis 100%');
    else if ((g.xp || 0) < 150 && badges.indexOf('xp_150') < 0) hints.push('⭐ 150 XP');
    if (!hints.length) hints.push('💪 Sesión 75+ para premio extra');
    return hints[0];
  }

  function renderMotivation(student) {
    var hint = nextPrizeHint(student);
    var met = dailyGoalMet(student);
    if (met) {
      return '<div style="text-align:center;font-size:12px;color:#86EFAC;font-weight:700;margin-bottom:10px;">✨ ¡Meta de hoy cumplida! Seguí sumando XP</div>';
    }
    return '<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.75);margin-bottom:10px;">Próximo premio: <strong style="color:#FCD34D;">' + hint + '</strong></div>';
  }

  function renderNewBadgeToast(unlocked) {
    if (!unlocked || !unlocked.length) return '';
    return unlocked.map(function (id) {
      var b = getBadgeDef(id);
      return b ? ('🏅 Premio: ' + b.icon + ' ' + b.name) : '';
    }).filter(Boolean).join('\n');
  }

  global.JillProgress = {
    DAILY_GOAL_MINUTES: DAILY_GOAL_MINUTES,
    BADGE_DEFS: BADGE_DEFS,
    ensureGrowth: ensureGrowth,
    recordSessionEnd: recordSessionEnd,
    checkBadges: checkBadges,
    dailyGoalMet: dailyGoalMet,
    countUserTurns: countUserTurns,
    countWords: countWords,
    estimateMinutes: estimateMinutes,
    renderHabitStrip: renderHabitStrip,
    renderBadgesRow: renderBadgesRow,
    renderMotivation: renderMotivation,
    renderNewBadgeToast: renderNewBadgeToast,
    levelFromXp: levelFromXp,
    levelTitle: levelTitle
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
