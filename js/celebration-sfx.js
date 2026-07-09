/**
 * Gamified celebration SFX — Web Audio API (no external files).
 * Rachas, badges, confetti, aciertos Kaboom, meta diaria, XP.
 */
var CelebrationSfx = (function () {
  'use strict';

  var LS_KEY = 'infinity_sfx_enabled';
  var ctx = null;
  var master = 0.42;

  function isEnabled() {
    try {
      var v = localStorage.getItem(LS_KEY);
      if (v === null) return true;
      return v !== '0' && v !== 'false';
    } catch (e) {
      return true;
    }
  }

  function setEnabled(on) {
    try { localStorage.setItem(LS_KEY, on ? '1' : '0'); } catch (e) {}
  }

  function toggle() {
    setEnabled(!isEnabled());
    return isEnabled();
  }

  function getCtx() {
    if (!isEnabled()) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function unlock() {
    var c = getCtx();
    return c ? c.resume() : Promise.resolve();
  }

  function playTone(freq, when, dur, type, vol, detune) {
    var c = getCtx();
    if (!c) return;
    var t0 = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (detune) osc.detune.setValueAtTime(detune, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, (vol || 0.12) * master), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.12));
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + (dur || 0.12) + 0.02);
  }

  function playSeq(notes, gap) {
    var step = gap || 0.07;
    notes.forEach(function (n, i) {
      playTone(n.f, i * step, n.d || 0.1, n.t || 'square', n.v || 0.14, n.det);
    });
  }

  /** Acierto Kaboom — ding corto */
  function correct() {
    playSeq([
      { f: 523.25, t: 'square', v: 0.11, d: 0.08 },
      { f: 783.99, t: 'square', v: 0.13, d: 0.12 }
    ], 0.05);
  }

  /** Racha de aciertos en drill (3+ = más épico) */
  function streak(n) {
    var s = n || 1;
    if (s < 3) { correct(); return; }
    var base = s >= 5 ? [523, 659, 784, 988, 1175] : [440, 554, 659, 784];
    playSeq(base.map(function (f) { return { f: f, t: 'square', v: 0.13, d: 0.1 }; }), 0.06);
    if (s >= 5) {
      setTimeout(function () {
        playSeq([
          { f: 880, t: 'triangle', v: 0.1, d: 0.14 },
          { f: 1108, t: 'triangle', v: 0.12, d: 0.18 }
        ], 0.08);
      }, 280);
    }
  }

  /** Badge / premio desbloqueado */
  function badge(count) {
    var n = count || 1;
    playSeq([
      { f: 392, t: 'square', v: 0.12, d: 0.09 },
      { f: 494, t: 'square', v: 0.13, d: 0.09 },
      { f: 587, t: 'square', v: 0.14, d: 0.09 },
      { f: 784, t: 'square', v: 0.15, d: 0.14 }
    ], 0.07);
    if (n > 1) {
      setTimeout(function () {
        playSeq([{ f: 988, t: 'triangle', v: 0.14, d: 0.2 }], 0);
      }, 320);
    }
  }

  /** Victoria + confetti / trofeo */
  function victory() {
    playSeq([
      { f: 523, t: 'square', v: 0.13, d: 0.1 },
      { f: 659, t: 'square', v: 0.14, d: 0.1 },
      { f: 784, t: 'square', v: 0.15, d: 0.1 },
      { f: 1047, t: 'square', v: 0.16, d: 0.14 }
    ], 0.065);
    setTimeout(function () {
      playSeq([
        { f: 1175, t: 'triangle', v: 0.12, d: 0.12 },
        { f: 1319, t: 'triangle', v: 0.14, d: 0.2 }
      ], 0.07);
    }, 300);
    setTimeout(function () {
      var c = getCtx();
      if (!c) return;
      for (var i = 0; i < 6; i++) {
        playTone(700 + Math.random() * 500, 0.45 + i * 0.04, 0.06, 'square', 0.06);
      }
    }, 420);
  }

  /** XP ganado — moneda */
  function xp() {
    playSeq([
      { f: 880, t: 'square', v: 0.1, d: 0.06 },
      { f: 1175, t: 'square', v: 0.12, d: 0.1 }
    ], 0.04);
  }

  /** Meta diaria / level up */
  function dailyGoal() {
    playSeq([
      { f: 330, t: 'square', v: 0.11, d: 0.08 },
      { f: 440, t: 'square', v: 0.12, d: 0.08 },
      { f: 554, t: 'square', v: 0.13, d: 0.08 },
      { f: 659, t: 'square', v: 0.14, d: 0.1 },
      { f: 880, t: 'triangle', v: 0.15, d: 0.18 }
    ], 0.075);
  }

  /** Día de racha sumado al terminar sesión */
  function streakDay(days) {
    var d = days || 1;
    playTone(220, 0, 0.08, 'sawtooth', 0.06);
    setTimeout(function () {
      playSeq([
        { f: 440, t: 'square', v: 0.12, d: 0.09 },
        { f: 554, t: 'square', v: 0.13, d: 0.11 }
      ], 0.05);
    }, 60);
    if (d >= 3) {
      setTimeout(function () { streak(Math.min(d, 7)); }, 220);
    }
  }

  /** Fallo suave — no castiga */
  function fail() {
    playSeq([
      { f: 220, t: 'triangle', v: 0.08, d: 0.12 },
      { f: 185, t: 'triangle', v: 0.07, d: 0.14 }
    ], 0.09);
  }

  function onBadgesUnlocked(unlocked) {
    if (!unlocked || !unlocked.length) return;
    badge(unlocked.length);
  }

  function onSessionGrowth(meta) {
    if (!meta) return;
    if (meta.dailyGoalJustMet) dailyGoal();
    else if (meta.streakExtended) streakDay(meta.newStreak || 1);
    if (meta.xpGain && meta.xpGain > 0) {
      setTimeout(function () { xp(); }, meta.dailyGoalJustMet ? 400 : 120);
    }
  }

  return {
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    toggle: toggle,
    unlock: unlock,
    correct: correct,
    streak: streak,
    badge: badge,
    victory: victory,
    xp: xp,
    dailyGoal: dailyGoal,
    streakDay: streakDay,
    fail: fail,
    onBadgesUnlocked: onBadgesUnlocked,
    onSessionGrowth: onSessionGrowth
  };
})();
