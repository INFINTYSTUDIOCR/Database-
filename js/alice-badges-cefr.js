/**
 * Alice — badges de logro + nivel CEFR estimado.
 */
(function (global) {
  'use strict';

  var BADGE_DEFS = [
    { id: 'first_chat', icon: '💬', name: 'Primera charla', desc: 'Completaste tu primera sesión con Alice' },
    { id: 'streak_3', icon: '🔥', name: 'Racha 3', desc: '3 días seguidos practicando' },
    { id: 'streak_7', icon: '⚡', name: 'Racha 7', desc: 'Una semana de práctica' },
    { id: 'daily_goal', icon: '✅', name: 'Meta diaria', desc: 'Alcanzaste tu meta de minutos hoy' },
    { id: 'companion_5', icon: '🎙️', name: 'Conversador', desc: '5 sesiones companion' },
    { id: 'spoken_70', icon: '📈', name: 'Fluidez 70+', desc: 'Inglés hablado sobre 70' },
    { id: 'minutes_30', icon: '⏱️', name: '30 minutos', desc: '30 minutos totales con Alice' },
    { id: 'clarity_75', icon: '🎯', name: 'Claridad', desc: 'Claridad al hablar 75+' }
  ];

  var CEFR_BANDS = [
    { min: 0, level: 'A1', label: 'Principiante', color: '#FCA5A5' },
    { min: 36, level: 'A2', label: 'Elemental', color: '#FCD34D' },
    { min: 51, level: 'B1', label: 'Intermedio', color: '#86EFAC' },
    { min: 66, level: 'B2', label: 'Intermedio alto', color: '#67E8F9' },
    { min: 79, level: 'C1', label: 'Avanzado', color: '#C084FC' },
    { min: 89, level: 'C2', label: 'Maestría', color: '#F5A623' }
  ];

  function spokenToCefr(spokenScore) {
    var s = parseInt(spokenScore, 10) || 0;
    var band = CEFR_BANDS[0];
    for (var i = CEFR_BANDS.length - 1; i >= 0; i--) {
      if (s >= CEFR_BANDS[i].min) { band = CEFR_BANDS[i]; break; }
    }
    return { level: band.level, label: band.label, color: band.color, score: s };
  }

  function ensureBadges(student) {
    if (!student) return [];
    if (!student.aliceGrowth) student.aliceGrowth = { habit: {}, pulses: [], spokenScore: 0 };
    if (!Array.isArray(student.aliceGrowth.badges)) student.aliceGrowth.badges = [];
    return student.aliceGrowth.badges;
  }

  function unlockBadge(student, id) {
    var badges = ensureBadges(student);
    if (badges.indexOf(id) >= 0) return false;
    badges.push(id);
    student.aliceGrowth.badges = badges;
    return true;
  }

  function checkBadges(student, opts) {
    if (!student) return [];
    opts = opts || {};
    var g = student.aliceGrowth || {};
    var h = g.habit || {};
    var unlocked = [];
    var compN = (student.companionSessions || []).length;
    var spoken = g.spokenScore || 0;

    if ((h.totalSessions || 0) >= 1 && unlockBadge(student, 'first_chat')) unlocked.push('first_chat');
    if ((h.streak || 0) >= 3 && unlockBadge(student, 'streak_3')) unlocked.push('streak_3');
    if ((h.streak || 0) >= 7 && unlockBadge(student, 'streak_7')) unlocked.push('streak_7');
    if (opts.dailyGoalMet && unlockBadge(student, 'daily_goal')) unlocked.push('daily_goal');
    if (compN >= 5 && unlockBadge(student, 'companion_5')) unlocked.push('companion_5');
    if (spoken >= 70 && unlockBadge(student, 'spoken_70')) unlocked.push('spoken_70');
    if ((h.totalMinutes || 0) >= 30 && unlockBadge(student, 'minutes_30')) unlocked.push('minutes_30');
    if ((opts.clarityScore || 0) >= 75 && unlockBadge(student, 'clarity_75')) unlocked.push('clarity_75');

    var cefr = spokenToCefr(spoken);
    if (!g.cefr) g.cefr = {};
    g.cefr.level = cefr.level;
    g.cefr.label = cefr.label;
    g.cefr.updated = new Date().toISOString();
    student.aliceGrowth = g;
    return unlocked;
  }

  function getBadgeDef(id) {
    for (var i = 0; i < BADGE_DEFS.length; i++) {
      if (BADGE_DEFS[i].id === id) return BADGE_DEFS[i];
    }
    return null;
  }

  function renderBadgesRow(student) {
    var badges = ensureBadges(student);
    if (!badges.length) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:12px;">Practicá con Alice para desbloquear badges 🏅</div>';
    }
    return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">'
      + badges.map(function (id) {
        var b = getBadgeDef(id);
        if (!b) return '';
        return '<span title="' + b.desc + '" style="display:inline-flex;align-items:center;gap:4px;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.3);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#F5A623;">'
          + b.icon + ' ' + b.name + '</span>';
      }).join('')
      + '</div>';
  }

  function renderCefrPill(student, spokenScore) {
    var cefr = spokenToCefr(spokenScore != null ? spokenScore : ((student.aliceGrowth && student.aliceGrowth.spokenScore) || 0));
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid ' + cefr.color + ';border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;color:' + cefr.color + ';">'
      + 'CEFR ' + cefr.level + ' · ' + cefr.label + '</span>';
  }

  function renderNewBadgeToast(unlocked) {
    if (!unlocked || !unlocked.length) return '';
    return unlocked.map(function (id) {
      var b = getBadgeDef(id);
      return b ? ('🏅 Badge desbloqueado: ' + b.icon + ' ' + b.name) : '';
    }).filter(Boolean).join('\n');
  }

  global.AliceBadgesCefr = {
    BADGE_DEFS: BADGE_DEFS,
    CEFR_BANDS: CEFR_BANDS,
    spokenToCefr: spokenToCefr,
    checkBadges: checkBadges,
    renderBadgesRow: renderBadgesRow,
    renderCefrPill: renderCefrPill,
    renderNewBadgeToast: renderNewBadgeToast,
    getBadgeDef: getBadgeDef
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
