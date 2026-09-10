/**
 * Word Lab — juegos nuevos (NO arcade).
 * UI profesional · niveles Foundation / ORT / Pro · mín. 14 palabras.
 */
(function (global) {
  'use strict';

  var CONFIG_VER = '20260910play';
  var MIN_WORDS = 14;
  var _extraPool = null;
  var _extraLoad = null;
  var _level = 'ort';
  var _stylesInjected = false;
  var _round = null;

  var WORD_HIT_COLORS = [
    { bg: 'linear-gradient(145deg,#86efac,#22c55e)', fg: '#14532d', chip: '#86efac', border: 'rgba(34,197,94,.55)' },
    { bg: 'linear-gradient(145deg,#93c5fd,#3b82f6)', fg: '#1e3a8a', chip: '#93c5fd', border: 'rgba(59,130,246,.55)' },
    { bg: 'linear-gradient(145deg,#fcd34d,#f59e0b)', fg: '#78350f', chip: '#fcd34d', border: 'rgba(245,158,11,.55)' },
    { bg: 'linear-gradient(145deg,#f9a8d4,#ec4899)', fg: '#831843', chip: '#f9a8d4', border: 'rgba(236,72,153,.55)' },
    { bg: 'linear-gradient(145deg,#c4b5fd,#8b5cf6)', fg: '#4c1d95', chip: '#c4b5fd', border: 'rgba(139,92,246,.55)' },
    { bg: 'linear-gradient(145deg,#67e8f9,#06b6d4)', fg: '#164e63', chip: '#67e8f9', border: 'rgba(6,182,212,.55)' },
    { bg: 'linear-gradient(145deg,#fdba74,#f97316)', fg: '#7c2d12', chip: '#fdba74', border: 'rgba(249,115,22,.55)' },
    { bg: 'linear-gradient(145deg,#bef264,#84cc16)', fg: '#365314', chip: '#bef264', border: 'rgba(132,204,22,.55)' },
    { bg: 'linear-gradient(145deg,#fda4af,#f43f5e)', fg: '#881337', chip: '#fda4af', border: 'rgba(244,63,94,.55)' },
    { bg: 'linear-gradient(145deg,#a5b4fc,#6366f1)', fg: '#312e81', chip: '#a5b4fc', border: 'rgba(99,102,241,.55)' },
    { bg: 'linear-gradient(145deg,#5eead4,#14b8a6)', fg: '#134e4a', chip: '#5eead4', border: 'rgba(20,184,166,.55)' },
    { bg: 'linear-gradient(145deg,#e9d5ff,#d946ef)', fg: '#701a75', chip: '#e9d5ff', border: 'rgba(217,70,239,.55)' }
  ];

  /** Randomizer interno — todo el Word Lab pasa por acá. */
  var RNG = (function () {
    var _seed = (Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0;
    function reseed(n) {
      _seed = (n >>> 0) || ((Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0);
    }
    function next() {
      _seed = (_seed + 0x6D2B79F5) >>> 0;
      var t = _seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = (next() * (i + 1)) | 0;
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    return {
      reseed: reseed,
      next: next,
      shuffle: shuffle,
      pick: function (arr) {
        if (!arr || !arr.length) return null;
        return arr[(next() * arr.length) | 0];
      },
      pickN: function (arr, n) {
        return shuffle(arr).slice(0, n);
      },
      chance: function (p) { return next() < p; },
      int: function (min, max) {
        return min + ((next() * (max - min + 1)) | 0);
      }
    };
  })();

  var LEVELS = [
    { id: 'foundation', label: 'Foundation', wordMin: 3, wordMax: 7, gridSize: 16, hints: true, sub: 'Corto · guía visible' },
    { id: 'ort', label: 'ORT', wordMin: 4, wordMax: 11, gridSize: 18, hints: true, sub: 'Operacional · 14 palabras' },
    { id: 'pro', label: 'Pro', wordMin: 5, wordMax: 14, gridSize: 20, hints: false, sub: 'Sin lista · solo pistas' }
  ];

  var PUZZLE_CATS = [
    { id: 'linkers', label: 'Linkers', gloss: ['extra'], icon: 'ti-route' },
    { id: 'rules', label: 'Reglas / método', gloss: ['base', 'prep', 'articles'], icon: 'ti-book' },
    { id: 'verbs', label: 'Verbos', gloss: ['verbs'], icon: 'ti-target-arrow' },
    { id: 'tenses', label: 'Tiempos', gloss: ['tenses'], icon: 'ti-clock' },
    { id: 'phrasals', label: 'Phrasals', gloss: ['phrasals'], icon: 'ti-puzzle' },
    { id: 'affixes', label: 'Prefijos / sufijos', gloss: ['affix', 'suffix'], icon: 'ti-letter-a' },
    { id: 'expressions', label: 'Expresiones', gloss: ['natural'], icon: 'ti-message' },
    { id: 'mixed', label: 'Mix ecosistema', gloss: null, icon: 'ti-sparkles' }
  ];

  var GAME_TYPES = [
    { id: 'wordsearch', label: 'Sopa de letras', desc: 'Colores que se quedan · arrastrá para marcar', icon: 'ti-grid-dots' },
    { id: 'findword', label: 'Find the Word', desc: '14 pistas · buscá en la grilla', icon: 'ti-search' },
    { id: 'hangman', label: 'Ahorcado', desc: 'Completá la palabra letra por letra', icon: 'ti-writing' },
    { id: 'wordrush', label: 'Word Rush', desc: 'Modo agresivo · vidas + timer', icon: 'ti-flame' },
    { id: 'crossword', label: 'Crucigrama', desc: '14 entradas cruzadas · pistas numeradas', icon: 'ti-layout-grid' }
  ];

  function levelCfg(id) {
    return LEVELS.find(function (l) { return l.id === (id || _level); }) || LEVELS[1];
  }

  function esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function normWord(w) {
    return String(w || '').toUpperCase().replace(/[^A-Z]/g, '');
  }

  function pick(arr, n) {
    return RNG.pickN(arr, n);
  }

  function todayKey() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function studentTable(s) {
    if (s && String(s.id || '').indexOf('KAM-') === 0) return 'kamuk_students';
    var p = (global.location && global.location.pathname) || '';
    return p.indexOf('/kamuk') >= 0 ? 'kamuk_students' : 'infinity_students';
  }

  function ensureWordLabMeta(s) {
    if (!s) return null;
    if (!s.wordLabMeta || typeof s.wordLabMeta !== 'object') {
      s.wordLabMeta = {
        rounds: 0,
        bestScore: 0,
        bestFindStreak: 0,
        lastPlayDate: '',
        dayStreak: 0
      };
    }
    return s.wordLabMeta;
  }

  function wordLabComputePrizes(round, score, metaBefore, metaAfter) {
    var prizes = [];
    if (typeof global.arcadeComputePrizes === 'function') {
      prizes = global.arcadeComputePrizes(round, score, metaBefore, metaAfter).slice();
    }
    if (score === 100) {
      prizes.push({ id: 'wordlab-perfect', icon: '💎', title: 'WORD LAB PERFECT', coins: 30, xp: 25 });
    }
    if ((round.bestWordStreak || 0) >= 5) {
      prizes.push({ id: 'wordlab-combo', icon: '⚡', title: 'WORD COMBO x' + round.bestWordStreak, coins: 18, xp: 12 });
    }
    if (RNG.chance(0.12)) {
      var bonus = RNG.pick([
        { id: 'wordlab-lucky', icon: '🍀', title: 'LUCKY WORD', coins: 20, xp: 10 },
        { id: 'wordlab-rare', icon: '✨', title: 'RARE FIND', coins: 15, xp: 15 },
        { id: 'wordlab-vault', icon: '🎁', title: 'VAULT DROP', coins: 25, xp: 8 }
      ]);
      if (bonus) prizes.push(bonus);
    }
    var seen = {};
    var out = [];
    prizes.forEach(function (p) {
      if (!p || seen[p.id]) return;
      seen[p.id] = 1;
      out.push(p);
    });
    return out.slice(-3);
  }

  function applyWordLabRewards(round, score) {
    var s = global.CURRENT_STUDENT;
    if (!s) return null;
    var wlm = ensureWordLabMeta(s);
    var today = todayKey();
    if (wlm.lastPlayDate === today) { /* same day */ }
    else if (wlm.lastPlayDate) {
      var last = new Date(wlm.lastPlayDate + 'T12:00:00');
      var now = new Date(today + 'T12:00:00');
      var diff = Math.round((now - last) / 86400000);
      wlm.dayStreak = diff === 1 ? (wlm.dayStreak || 0) + 1 : 1;
    } else {
      wlm.dayStreak = 1;
    }
    wlm.lastPlayDate = today;
    wlm.rounds = (wlm.rounds || 0) + 1;
    wlm.bestScore = Math.max(wlm.bestScore || 0, score);
    wlm.bestFindStreak = Math.max(wlm.bestFindStreak || 0, round.bestWordStreak || 0);

    var reward = null;
    if (typeof global.arcadeGetMeta === 'function' && typeof global.arcadeApplyRoundMeta === 'function') {
      var metaBefore = global.arcadeGetMeta(s);
      var metaAfter = Object.assign({}, metaBefore);
      var prizes = wordLabComputePrizes(round, score, metaBefore, metaAfter);
      reward = global.arcadeApplyRoundMeta(round, score);
      if (reward && prizes.length) {
        prizes.forEach(function (p) {
          reward.coinGain = (reward.coinGain || 0) + (p.coins || 0);
          reward.xpGain = (reward.xpGain || 0) + (p.xp || 0);
          if (p.id && reward.meta && reward.meta.trophies && reward.meta.trophies.indexOf(p.id) < 0) {
            reward.meta.trophies.push(p.id);
          }
        });
        reward.prizes = (reward.prizes || []).concat(prizes);
        if (typeof global.arcadePersistMeta === 'function') global.arcadePersistMeta(s, reward.meta);
      }
    } else {
      reward = { xpGain: 10 + score, coinGain: Math.round(score / 4), prizes: wordLabComputePrizes(round, score, {}, {}), meta: {} };
    }

    if (typeof global.JillProgress !== 'undefined' && global.JillProgress.recordSessionEnd) {
      global.JillProgress.recordSessionEnd(s, {
        score: score,
        turns: round.foundCount || 0,
        minutes: Math.max(1, Math.round((round.foundCount || MIN_WORDS) / 4))
      });
      if (global.JillProgress.checkBadges) {
        global.JillProgress.checkBadges(s, { score: score, quizPerfect: score === 100 });
      }
    }

    if (!s.quizzes) s.quizzes = [];
    s.quizzes.push({
      date: new Date().toISOString(),
      mode: 'word-lab',
      arcadeMode: round.modeTitle,
      correct: round.foundCount || 0,
      total: round.totalWords || MIN_WORDS,
      score: score,
      bestStreak: round.bestWordStreak || 0,
      prizes: (reward.prizes || []).map(function (p) { return p.id; })
    });
    if (s.quizzes.length > 40) s.quizzes = s.quizzes.slice(-40);

    if (s.id && typeof global.dbSet === 'function') {
      global.dbSet(studentTable(s), s.id, s).catch(function () {});
    }
    return reward;
  }

  function renderRewardBanner(reward, round) {
    if (!reward) return '';
    var meta = reward.meta || {};
    var prizes = reward.prizes || [];
    var chips = prizes.map(function (p) {
      return '<span class="iwp-prize-chip">' + esc(p.icon || '🏆') + ' ' + esc(p.title || p.id) + '</span>';
    }).join('');
    return '<div class="iwp-reward" id="iwp-reward">'
      + '<div class="iwp-reward-title">Ronda completada</div>'
      + '<div class="iwp-reward-row">'
      + '<span>+' + (reward.xpGain || 0) + ' XP</span>'
      + '<span>+' + (reward.coinGain || 0) + ' coins</span>'
      + '<span>🔥 Día ' + (meta.dayStreak || round.dayStreak || 1) + '</span>'
      + '<span>Combo ' + (round.bestWordStreak || 0) + '</span>'
      + '</div>'
      + (chips ? '<div class="iwp-reward-prizes">' + chips + '</div>' : '')
      + '</div>';
  }

  function onRoundComplete(foundCount, totalWords) {
    if (_round && _round.completed) return;
    if (!_round) return;
    _round.completed = true;
    _round.foundCount = foundCount;
    _round.totalWords = totalWords;
    var score = Math.min(100, Math.round((foundCount / Math.max(1, totalWords)) * 100));
    if (foundCount >= totalWords) score = 100;
    var reward = applyWordLabRewards(_round, score);
    var box = document.getElementById('iwp-reward-slot');
    if (box) box.innerHTML = renderRewardBanner(reward, _round);
    var st = document.getElementById('iwp-status');
    if (st) st.textContent = 'Completado · +' + (reward ? reward.xpGain : 0) + ' XP · +' + (reward ? reward.coinGain : 0) + ' coins';
    if (typeof global.showToast === 'function') {
      global.showToast('Word Lab: +' + (reward ? reward.xpGain : 0) + ' XP · racha día ' + ((reward && reward.meta && reward.meta.dayStreak) || 1), 'ok');
    }
  }

  function initRound(catId, gameType, totalWords) {
    RNG.reseed(Date.now() ^ RNG.int(1, 999999));
    var titles = { wordsearch: 'Sopa', findword: 'Find', hangman: 'Ahorcado', wordrush: 'Word Rush', crossword: 'Crucigrama' };
    _round = {
      mode: 'wordlab-' + gameType,
      modeTitle: 'Word Lab · ' + (titles[gameType] || gameType),
      catId: catId,
      gameType: gameType,
      wordStreak: 0,
      bestWordStreak: 0,
      completed: false,
      foundCount: 0,
      totalWords: totalWords,
      results: []
    };
  }

  function injectStyles() {
    var styleId = 'iwp-styles-' + CONFIG_VER;
    if (document.getElementById(styleId)) return;
    _stylesInjected = true;
    var css = ''
      + '.iwp-shell{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;'
      + 'background:radial-gradient(ellipse 80% 60% at 15% 0%,rgba(91,33,182,.22),transparent),'
      + 'radial-gradient(ellipse 70% 50% at 85% 100%,rgba(61,220,151,.1),transparent),#07050f;'
      + 'font-family:system-ui,-apple-system,sans-serif;}'
      + '.iwp-panel{width:min(780px,100%);max-height:94vh;overflow:auto;border-radius:22px;'
      + 'background:linear-gradient(155deg,rgba(28,22,58,.98) 0%,rgba(12,8,28,.99) 100%);'
      + 'border:1px solid rgba(167,139,250,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 28px 80px rgba(0,0,0,.55);'
      + 'position:relative;}'
      + '.iwp-panel::before{content:"";position:absolute;inset:0;border-radius:22px;pointer-events:none;opacity:.045;'
      + 'background-image:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E");}'
      + '.iwp-head{display:flex;justify-content:space-between;align-items:flex-start;padding:18px 20px 14px;border-bottom:1px solid rgba(167,139,250,.14);position:relative;}'
      + '.iwp-kicker{font-size:9px;font-weight:800;letter-spacing:.18em;color:#a78bfa;text-transform:uppercase;}'
      + '.iwp-title{font-size:20px;font-weight:900;color:#f5f3ff;letter-spacing:-.02em;margin-top:4px;}'
      + '.iwp-body{padding:16px 20px 22px;position:relative;}'
      + '.iwp-close{border:none;background:rgba(255,255,255,.06);color:#e9d5ff;width:38px;height:38px;border-radius:11px;cursor:pointer;font-size:20px;line-height:1;border:1px solid rgba(167,139,250,.2);}'
      + '.iwp-close:hover{background:rgba(167,139,250,.18);}'
      + '.iwp-level-bar{display:flex;gap:6px;padding:4px;background:rgba(0,0,0,.35);border-radius:14px;border:1px solid rgba(167,139,250,.15);margin-bottom:16px;}'
      + '.iwp-lv{flex:1;border:none;background:transparent;color:rgba(255,255,255,.5);font-size:11px;font-weight:800;padding:10px 8px;border-radius:10px;cursor:pointer;text-align:center;line-height:1.25;}'
      + '.iwp-lv small{display:block;font-weight:600;font-size:9px;opacity:.75;margin-top:2px;}'
      + '.iwp-lv.is-on{background:linear-gradient(135deg,rgba(91,33,182,.55),rgba(124,58,237,.4));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);}'
      + '.iwp-card{text-align:left;border:1px solid rgba(167,139,250,.18);background:rgba(255,255,255,.04);border-radius:14px;padding:14px;cursor:pointer;width:100%;transition:background .15s,border-color .15s,transform .15s;}'
      + '.iwp-card:hover{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.35);transform:translateY(-1px);}'
      + '.iwp-card-title{font-weight:800;color:#e9d5ff;font-size:14px;}'
      + '.iwp-card-sub{font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;line-height:1.45;}'
      + '.iwp-grid-wrap{overflow:auto;padding:12px;background:rgba(0,0,0,.35);border-radius:16px;border:1px solid rgba(167,139,250,.12);margin-bottom:14px;}'
      + '.iwp-grid{display:inline-grid;gap:3px;user-select:none;}'
      + '.iwp-cell{width:30px;height:30px;border-radius:6px;border:1px solid rgba(167,139,250,.2);'
      + 'background:linear-gradient(145deg,#faf8ff,#ede9fe);font-weight:800;font-size:12px;color:#3b0764;cursor:pointer;padding:0;'
      + 'box-shadow:inset 0 -1px 0 rgba(91,33,182,.08);touch-action:none;transition:transform .18s ease,box-shadow .18s ease,background .2s;}'
      + '.iwp-cell.iwp-hit{background:var(--iwp-hit-bg,linear-gradient(145deg,#86efac,#3ddc97))!important;color:var(--iwp-hit-fg,#064e3b)!important;border-color:var(--iwp-hit-bd,rgba(61,220,151,.5))!important;}'
      + '.iwp-cell.iwp-sel{background:linear-gradient(145deg,#c4b5fd,#a78bfa)!important;color:#1e1b4b;transform:scale(1.06);}'
      + '.iwp-cell.iwp-pop{animation:iwpPop .45s cubic-bezier(.2,1.4,.4,1);}'
      + '@keyframes iwpPop{0%{transform:scale(.86)}55%{transform:scale(1.18)}100%{transform:scale(1)}}'
      + '@keyframes iwpShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}'
      + '@keyframes iwpPulse{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,.45)}50%{box-shadow:0 0 0 10px rgba(248,113,113,0)}}'
      + '.iwp-xword{width:28px;height:28px;text-align:center;border:1px solid rgba(167,139,250,.35);border-radius:5px;'
      + 'font-weight:800;font-size:11px;text-transform:uppercase;background:#faf8ff;color:#3b0764;padding:0;}'
      + '.iwp-xvoid{width:28px;height:28px;background:rgba(91,33,182,.12);border-radius:4px;}'
      + '.iwp-chip{display:inline-block;margin:3px 5px 3px 0;padding:5px 11px;border-radius:999px;font-size:10px;font-weight:800;'
      + 'background:rgba(167,139,250,.15);color:#ddd6fe;border:1px solid rgba(167,139,250,.25);transition:background .25s,color .25s,transform .25s;}'
      + '.iwp-chip.done{text-decoration:none;opacity:1;color:#0f172a!important;background:var(--iwp-chip-bg,#86efac)!important;border-color:transparent;transform:scale(1.04);}'
      + '.iwp-status{font-size:12px;font-weight:700;color:#86efac;margin-bottom:12px;letter-spacing:.02em;}'
      + '.iwp-meta{font-size:12px;color:rgba(255,255,255,.55);margin-bottom:14px;line-height:1.5;}'
      + '.iwp-back{border:none;background:transparent;color:#a78bfa;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:12px;padding:0;}'
      + '.iwp-btn{width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#5b21b6,#7c3aed);'
      + 'color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-top:12px;box-shadow:0 8px 24px rgba(91,33,182,.35);}'
      + '.iwp-btn:hover{filter:brightness(1.06);}'
      + '.iwp-btn:disabled{opacity:.45;cursor:not-allowed;filter:none;}'
      + '.iwp-btn.danger{background:linear-gradient(135deg,#b91c1c,#ef4444);box-shadow:0 8px 24px rgba(239,68,68,.35);}'
      + '.iwp-progress{font-size:13px;font-weight:800;color:#e9d5ff;margin-bottom:8px;}'
      + '.iwp-clue{font-size:12px;color:rgba(255,255,255,.72);padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);line-height:1.45;}'
      + '.iwp-hint-box{padding:12px 14px;border-radius:14px;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);margin-bottom:12px;}'
      + '.iwp-streak-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;font-size:11px;font-weight:700;color:#ddd6fe;}'
      + '.iwp-streak-bar span{background:rgba(255,255,255,.06);border:1px solid rgba(167,139,250,.18);padding:6px 10px;border-radius:999px;}'
      + '.iwp-reward{margin-bottom:14px;padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(61,220,151,.18),rgba(91,33,182,.25));border:1px solid rgba(134,239,172,.35);}'
      + '.iwp-reward-title{font-weight:900;color:#ecfdf5;margin-bottom:8px;}'
      + '.iwp-reward-row{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;font-weight:700;color:#bbf7d0;}'
      + '.iwp-reward-prizes{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;}'
      + '.iwp-prize-chip{font-size:11px;font-weight:800;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.25);color:#fef3c7;}'
      + '.iwp-random-btn{margin-bottom:14px;}'
      + '.iwp-hang-wrap{text-align:center;padding:8px 0 16px;}'
      + '.iwp-hang-word{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:18px 0 22px;min-height:52px;}'
      + '.iwp-hang-slot{min-width:34px;height:44px;border-bottom:3px solid rgba(233,213,255,.55);display:flex;align-items:center;justify-content:center;'
      + 'font-size:22px;font-weight:900;color:#f5f3ff;letter-spacing:.02em;}'
      + '.iwp-hang-slot.filled{border-bottom-color:#86efac;color:#86efac;animation:iwpPop .35s ease;}'
      + '.iwp-hang-meta{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:14px;font-size:12px;font-weight:800;color:#e9d5ff;}'
      + '.iwp-hang-meta span{padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(167,139,250,.2);}'
      + '.iwp-hang-meta .danger{color:#fecaca;border-color:rgba(248,113,113,.45);animation:iwpPulse 1.2s infinite;}'
      + '.iwp-keys{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:420px;margin:0 auto;}'
      + '.iwp-key{width:34px;height:38px;border-radius:9px;border:1px solid rgba(167,139,250,.28);background:rgba(255,255,255,.08);'
      + 'color:#f5f3ff;font-weight:800;font-size:13px;cursor:pointer;}'
      + '.iwp-key:hover:not(:disabled){background:rgba(167,139,250,.25);}'
      + '.iwp-key.used{opacity:.35;cursor:default;}'
      + '.iwp-key.good{background:rgba(34,197,94,.35);border-color:rgba(134,239,172,.55);}'
      + '.iwp-key.bad{background:rgba(239,68,68,.35);border-color:rgba(252,165,165,.55);}'
      + '.iwp-rush.shake{animation:iwpShake .35s ease;}'
      + '.iwp-clue-big{font-size:15px;font-weight:700;color:#ddd6fe;line-height:1.5;margin:8px 0 4px;}';
    var st = document.createElement('style');
    st.id = styleId;
    st.textContent = css;
    document.head.appendChild(st);
  }

  function renderLevelToggle(onclickFn) {
    var fn = onclickFn || 'InfinityWordPuzzles.setLevelAndHub';
    return '<div class="iwp-level-bar" role="group" aria-label="Nivel">'
      + LEVELS.map(function (lv) {
        var on = lv.id === _level ? ' is-on' : '';
        return '<button type="button" class="iwp-lv' + on + '" onclick="' + fn + '(\'' + lv.id + '\')">'
          + esc(lv.label) + '<small>' + esc(lv.sub) + '</small></button>';
      }).join('')
      + '</div>';
  }

  function clueFromItem(it) {
    if (!it) return '';
    if (it.es) return String(it.es).slice(0, 140);
    if (it.how) return String(it.how).slice(0, 140);
    return String(it.en || '').slice(0, 100);
  }

  function wordFromItem(it) {
    if (!it) return '';
    var en = String(it.en || '').trim();
    var m = en.match(/^([a-zA-Z\-]+)/);
    if (m) return m[1];
    if (it.forms && it.forms.examples && it.forms.examples[0]) {
      var ex = String(it.forms.examples[0]);
      var w = ex.match(/\b([A-Za-z]{3,})\b/);
      if (w) return w[1];
    }
    return en.split(/\s+/)[0] || '';
  }

  function collectGlossary(catIds) {
    var lib = global.InfinityRecursosLibrary || global.KamukRecursosLibrary;
    var items = (lib && lib.items) ? lib.items : [];
    var out = [];
    items.forEach(function (it) {
      if (!it || !it.cat) return;
      if (catIds && catIds.indexOf(it.cat) < 0) return;
      var w = normWord(wordFromItem(it));
      if (w.length < 3 || w.length > 14) return;
      out.push({ word: w, clue: clueFromItem(it), cat: it.cat, source: 'glosario', label: it.en });
    });
    return out;
  }

  function configBase() {
    var p = (global.location && global.location.pathname) || '';
    return p.indexOf('/kamuk') >= 0 ? '../config/' : 'config/';
  }

  function loadExtraPool() {
    if (_extraPool) return Promise.resolve(_extraPool);
    if (_extraLoad) return _extraLoad;
    var base = configBase();
    _extraLoad = Promise.all([
      fetch(base + 'trainer-drills.json?v=' + CONFIG_VER).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(base + 'jill-vocab-functional.json?v=' + CONFIG_VER).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(base + 'jill-foundations-modules.json?v=' + CONFIG_VER).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (parts) {
      var out = [];
      var drills = parts[0];
      var vocab = parts[1];
      var modules = parts[2];
      if (drills && drills.drills) {
        Object.keys(drills.drills).forEach(function (key) {
          var d = drills.drills[key];
          (d.linkers || []).forEach(function (lk) {
            var w = normWord(lk);
            if (w.length >= 3 && w.length <= 14) {
              out.push({ word: w, clue: d.title || 'Linker método', cat: 'extra', source: 'trainer-drills', label: lk });
            }
          });
        });
      }
      if (vocab && vocab.domains) {
        Object.keys(vocab.domains).forEach(function (dom) {
          (vocab.domains[dom] || []).forEach(function (wrd) {
            var w = normWord(wrd);
            if (w.length >= 3 && w.length <= 14) {
              out.push({ word: w, clue: dom + ' · vocab funcional', cat: 'natural', source: 'jill-vocab', label: wrd });
            }
          });
        });
      }
      if (modules && modules.modules) {
        (modules.modules || []).forEach(function (mod) {
          (mod.kaboomBank || []).forEach(function (q) {
            var opts = q.options || [];
            var ans = typeof q.answer === 'number' ? opts[q.answer] : q.answer;
            var w = normWord(ans || opts[0]);
            if (w.length >= 3 && w.length <= 14) {
              out.push({
                word: w,
                clue: q.prompt || mod.title || mod.id,
                cat: mod.trackId || 'verbs',
                source: 'jill-modules',
                label: String(ans || opts[0] || '')
              });
            }
          });
        });
      }
      _extraPool = dedupeEntries(out);
      return _extraPool;
    });
    return _extraLoad;
  }

  function collectExtra(catIds) {
    if (!_extraPool) return [];
    if (!catIds) return _extraPool.slice();
    return _extraPool.filter(function (e) {
      return catIds.indexOf(e.cat) >= 0
        || (catIds.indexOf('extra') >= 0 && e.source === 'trainer-drills')
        || (catIds.indexOf('natural') >= 0 && e.source === 'jill-vocab');
    });
  }

  function dedupeEntries(list) {
    var seen = {};
    var out = [];
    list.forEach(function (e) {
      if (seen[e.word]) return;
      seen[e.word] = 1;
      out.push(e);
    });
    return out;
  }

  function buildPool(catId) {
    var cat = PUZZLE_CATS.find(function (c) { return c.id === catId; }) || PUZZLE_CATS[0];
    var glossIds = cat.gloss;
    var pool = [];
    if (!glossIds || catId === 'mixed') {
      PUZZLE_CATS.forEach(function (c) {
        if (c.gloss) pool = pool.concat(collectGlossary(c.gloss));
      });
      pool = pool.concat(collectExtra(null));
    } else {
      pool = collectGlossary(glossIds).concat(collectExtra(glossIds));
    }
    return dedupeEntries(pool);
  }

  function filterByLevel(pool, cfg) {
    return pool.filter(function (e) {
      return e.word.length >= cfg.wordMin && e.word.length <= cfg.wordMax;
    });
  }

  function pickWordsForRound(catId, cfg, minCount) {
    minCount = minCount || MIN_WORDS;
    var pool = filterByLevel(buildPool(catId), cfg);
    if (pool.length < minCount) {
      pool = filterByLevel(buildPool('mixed'), cfg);
    }
    if (pool.length < minCount) {
      pool = buildPool('mixed').filter(function (e) {
        return e.word.length >= 3 && e.word.length <= cfg.wordMax;
      });
    }
    return pick(pool, Math.max(minCount + 6, pool.length));
  }

  function randLetter() {
    return String.fromCharCode(65 + (RNG.int(0, 25)));
  }

  function makeEmptyGrid(size) {
    var g = [];
    for (var r = 0; r < size; r++) {
      g[r] = [];
      for (var c = 0; c < size; c++) g[r][c] = '';
    }
    return g;
  }

  function canPlace(grid, word, r, c, dr, dc) {
    var size = grid.length;
    for (var i = 0; i < word.length; i++) {
      var rr = r + dr * i;
      var cc = c + dc * i;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) return false;
      if (grid[rr][cc] && grid[rr][cc] !== word[i]) return false;
    }
    return true;
  }

  function placeWord(grid, word, r, c, dr, dc, num) {
    for (var i = 0; i < word.length; i++) {
      grid[r + dr * i][c + dc * i] = word[i];
    }
    return { word: word, r: r, c: c, dr: dr, dc: dc, num: num };
  }

  function fillGridRandom(grid) {
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (!grid[r][c]) grid[r][c] = randLetter();
      }
    }
  }

  function buildWordSearch(words, size) {
    var grid = makeEmptyGrid(size);
    var placed = [];
    var sorted = words.slice().sort(function (a, b) { return b.word.length - a.word.length; });
    sorted.forEach(function (entry, idx) {
      var w = entry.word;
      var dirs = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
      for (var attempt = 0; attempt < 120; attempt++) {
        var d = dirs[RNG.int(0, dirs.length - 1)];
        var r = RNG.int(0, size - 1);
        var c = RNG.int(0, size - 1);
        if (canPlace(grid, w, r, c, d[0], d[1])) {
          placed.push(placeWord(grid, w, r, c, d[0], d[1], idx + 1));
          entry.num = idx + 1;
          break;
        }
      }
    });
    fillGridRandom(grid);
    return { grid: grid, words: sorted.filter(function (e) { return e.num; }), placed: placed, size: size };
  }

  function buildWordSearchMin(catId, cfg, minWords) {
    minWords = minWords || MIN_WORDS;
    var best = null;
    for (var t = 0; t < 8; t++) {
      var candidates = pickWordsForRound(catId, cfg, minWords);
      var puzzle = buildWordSearch(candidates, cfg.gridSize);
      if (!best || puzzle.words.length > best.words.length) best = puzzle;
      if (puzzle.words.length >= minWords) return puzzle;
    }
    return best || buildWordSearch(pickWordsForRound(catId, cfg, minWords), cfg.gridSize);
  }

  function buildCrossword(words, size) {
    size = size || 20;
    var grid = makeEmptyGrid(size);
    var placed = [];
    var sorted = words.slice().sort(function (a, b) { return b.word.length - a.word.length; });
    var num = 1;
    sorted.forEach(function (entry) {
      var w = entry.word;
      if (placed.length === 0) {
        var startC = Math.floor((size - w.length) / 2);
        var startR = Math.floor(size / 2);
        placed.push(placeWord(grid, w, startR, startC, 0, 1, num++));
        entry.num = placed[placed.length - 1].num;
        entry.dir = 'across';
        return;
      }
      var ok = false;
      for (var pi = 0; pi < placed.length && !ok; pi++) {
        var p = placed[pi];
        for (var i = 0; i < p.word.length; i++) {
          for (var j = 0; j < w.length; j++) {
            if (p.word[i] !== w[j]) continue;
            var pr = p.r + p.dr * i;
            var pc = p.c + p.dc * i;
            var dr = p.dr === 0 ? 1 : 0;
            var dc = p.dc === 0 ? 1 : 0;
            var nr = pr - dr * j;
            var nc = pc - dc * j;
            if (canPlace(grid, w, nr, nc, dr, dc)) {
              placed.push(placeWord(grid, w, nr, nc, dr, dc, num++));
              entry.num = num - 1;
              entry.dir = dr === 0 ? 'across' : 'down';
              ok = true;
              break;
            }
          }
        }
      }
    });
    fillGridRandom(grid);
    return { grid: grid, words: sorted.filter(function (e) { return e.num; }), placed: placed, size: size };
  }

  function buildCrosswordMin(catId, cfg, minWords) {
    minWords = minWords || MIN_WORDS;
    var best = null;
    for (var t = 0; t < 6; t++) {
      var candidates = pickWordsForRound(catId, cfg, minWords);
      var puzzle = buildCrossword(candidates, cfg.gridSize);
      if (!best || puzzle.words.length > best.words.length) best = puzzle;
      if (puzzle.words.length >= Math.min(minWords, 10)) return puzzle;
    }
    return best;
  }

  function shell(title, body) {
    return '<div class="iwp-shell"><div class="iwp-panel">'
      + '<div class="iwp-head"><div>'
      + '<div class="iwp-kicker">Word Lab · Studio Infinity</div>'
      + '<div class="iwp-title">' + esc(title) + '</div></div>'
      + '<button type="button" class="iwp-close" onclick="InfinityWordPuzzles.close()" aria-label="Cerrar">×</button>'
      + '</div><div class="iwp-body">' + body + '</div></div></div>';
  }

  function renderGridHtml(puzzle, cellClass) {
    cellClass = cellClass || 'iwp-cell';
    var size = puzzle.size;
    var cellPx = size > 18 ? 26 : 30;
    var html = '<div class="iwp-grid" style="grid-template-columns:repeat(' + size + ',' + cellPx + 'px);">';
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        html += '<button type="button" data-r="' + r + '" data-c="' + c + '" class="' + cellClass + '">' + esc(puzzle.grid[r][c]) + '</button>';
      }
    }
    html += '</div>';
    return html;
  }

  function renderCrosswordHtml(puzzle) {
    var size = puzzle.size;
    var html = '<div class="iwp-grid" style="grid-template-columns:repeat(' + size + ',28px);">';
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var ch = puzzle.grid[r][c];
        if (!/[A-Z]/.test(ch)) {
          html += '<span class="iwp-xvoid"></span>';
          continue;
        }
        html += '<input type="text" maxlength="1" data-r="' + r + '" data-c="' + c + '" data-ans="' + ch + '" class="iwp-xword" />';
      }
    }
    html += '</div>';
    return html;
  }

  function mountOverlay(html) {
    injectStyles();
    var el = document.getElementById('iwp-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'iwp-overlay';
      document.body.appendChild(el);
    }
    el.innerHTML = html;
  }

  function streakBarHtml() {
    var s = global.CURRENT_STUDENT;
    var wlm = s ? ensureWordLabMeta(s) : null;
    var am = (typeof global.arcadeGetMeta === 'function' && s) ? global.arcadeGetMeta(s) : null;
    var day = (am && am.dayStreak) || (wlm && wlm.dayStreak) || 0;
    var coins = (am && am.coins) || 0;
    var xp = (am && am.lifetimeXp) || 0;
    var jStreak = (s && s.jillGrowth && s.jillGrowth.habit) ? s.jillGrowth.habit.streak : 0;
    return '<div class="iwp-streak-bar">'
      + '<span>🔥 Racha día ' + day + '</span>'
      + '<span>🌿 Jill ' + jStreak + 'd</span>'
      + '<span>🪙 ' + coins + '</span>'
      + '<span>⭐ ' + xp + ' XP</span>'
      + '</div>';
  }

  function renderHub() {
    var catBtns = RNG.shuffle(PUZZLE_CATS).map(function (cat) {
      return '<button type="button" class="iwp-card" onclick="InfinityWordPuzzles.pickCat(\'' + cat.id + '\')">'
        + '<div class="iwp-card-title">' + esc(cat.label) + '</div>'
        + '<div class="iwp-card-sub">Glosario · trainer-drills · Jill modules</div></button>';
    }).join('');
    var body = streakBarHtml()
      + renderLevelToggle('InfinityWordPuzzles.setLevelAndHub')
      + '<button type="button" class="iwp-btn iwp-random-btn" onclick="InfinityWordPuzzles.playRandom()">🎲 Ronda aleatoria (categoría + modo + nivel)</button>'
      + '<p class="iwp-meta">Cada ronda: <strong style="color:#c4b5fd;">mínimo ' + MIN_WORDS + ' palabras</strong> · premios XP/coins · rachas conectadas al portal.</p>'
      + '<div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:#a78bfa;margin-bottom:10px;">CATEGORÍA</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">' + catBtns + '</div>';
    mountOverlay(shell('Word Lab', body));
  }

  function renderGamePicker(catId) {
    var cat = PUZZLE_CATS.find(function (c) { return c.id === catId; }) || PUZZLE_CATS[0];
    var cfg = levelCfg();
    var pool = filterByLevel(buildPool(catId), cfg);
    var btns = GAME_TYPES.map(function (g) {
      return '<button type="button" class="iwp-card" style="margin-bottom:8px;" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'' + g.id + '\')">'
        + '<div class="iwp-card-title">' + esc(g.label) + '</div>'
        + '<div class="iwp-card-sub">' + esc(g.desc) + '</div></button>';
    }).join('');
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndPickCat')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.openHub()">← Categorías</button>'
      + '<div class="iwp-meta"><strong style="color:#e9d5ff;">' + esc(cat.label) + '</strong> · Nivel ' + esc(cfg.label)
      + ' · ' + pool.length + ' entradas · mín. ' + MIN_WORDS + ' palabras/ronda</div>'
      + btns;
    mountOverlay(shell(cat.label, body));
  }

  function bindWordSearch(puzzle) {
    var found = {};
    var colorByWord = {};
    var colorN = 0;
    var cells = document.querySelectorAll('.iwp-cell');
    var selecting = false;
    var path = [];

    function paintHit(el, color) {
      if (!el || !color) return;
      el.classList.add('iwp-hit');
      el.style.setProperty('--iwp-hit-bg', color.bg);
      el.style.setProperty('--iwp-hit-fg', color.fg);
      el.style.setProperty('--iwp-hit-bd', color.border);
      el.classList.remove('iwp-pop');
      void el.offsetWidth;
      el.classList.add('iwp-pop');
    }

    function highlightPath() {
      cells.forEach(function (el) {
        el.classList.remove('iwp-sel');
      });
      path.forEach(function (p) { p.classList.add('iwp-sel'); });
    }

    function updateProgress() {
      var n = Object.keys(found).length;
      var total = puzzle.words.length;
      var pr = document.getElementById('iwp-progress');
      if (pr) pr.textContent = n + ' / ' + total + ' palabras';
      if (n >= total) {
        var st = document.getElementById('iwp-status');
        if (st) st.textContent = 'Ronda completada — ' + total + ' colores en la grilla';
        onRoundComplete(n, total);
      }
    }

    function markPlacedWord(entry, color) {
      if (!entry) return;
      for (var i = 0; i < entry.word.length; i++) {
        var rr = entry.r + entry.dr * i;
        var cc = entry.c + entry.dc * i;
        var el = document.querySelector('.iwp-cell[data-r="' + rr + '"][data-c="' + cc + '"]');
        paintHit(el, color);
      }
    }

    function checkWord() {
      if (path.length < 2) return;
      var letters = path.map(function (el) { return el.textContent; }).join('');
      var rev = letters.split('').reverse().join('');
      var hit = false;
      puzzle.words.forEach(function (w) {
        if (found[w.word]) return;
        if (letters === w.word || rev === w.word) {
          found[w.word] = true;
          hit = true;
          var color = WORD_HIT_COLORS[colorN % WORD_HIT_COLORS.length];
          colorByWord[w.word] = color;
          colorN++;
          if (_round) {
            _round.wordStreak = (_round.wordStreak || 0) + 1;
            _round.bestWordStreak = Math.max(_round.bestWordStreak || 0, _round.wordStreak);
          }
          var placed = (puzzle.placed || []).find(function (p) { return p.word === w.word; });
          if (placed) markPlacedWord(placed, color);
          else path.forEach(function (el) { paintHit(el, color); });
          var chip = document.getElementById('iwp-word-' + w.word);
          if (chip) {
            chip.classList.add('done');
            chip.style.setProperty('--iwp-chip-bg', color.chip);
          }
          var st = document.getElementById('iwp-status');
          if (st) st.textContent = '✓ ' + w.word + ' · color ' + colorN + ' se queda';
          updateProgress();
        }
      });
      if (!hit && _round) _round.wordStreak = 0;
    }

    function onStart(el) {
      selecting = true;
      path = [el];
      highlightPath();
    }
    function onMove(el) {
      if (!selecting || path.indexOf(el) >= 0) return;
      path.push(el);
      highlightPath();
    }
    function onEnd() {
      selecting = false;
      checkWord();
      path.forEach(function (p) { p.classList.remove('iwp-sel'); });
      path = [];
      highlightPath();
    }

    cells.forEach(function (el) {
      el.addEventListener('mousedown', function (e) { e.preventDefault(); onStart(el); });
      el.addEventListener('mouseenter', function () { onMove(el); });
      el.addEventListener('mouseup', onEnd);
      el.addEventListener('touchstart', function (e) { e.preventDefault(); onStart(el); }, { passive: false });
      el.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        var target = document.elementFromPoint(t.clientX, t.clientY);
        if (target && target.classList.contains('iwp-cell')) onMove(target);
      }, { passive: false });
      el.addEventListener('touchend', onEnd);
    });
  }

  function alphabetKeysHtml() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function (ch) {
      return '<button type="button" class="iwp-key" data-letter="' + ch + '">' + ch + '</button>';
    }).join('');
  }

  function pickLetterGameWords(catId, cfg, n) {
    var pool = filterByLevel(buildPool(catId), cfg).filter(function (w) {
      var nw = normWord(w.word || w.label || w);
      return nw.length >= Math.max(4, cfg.wordMin || 4) && nw.length <= Math.min(12, cfg.wordMax || 12);
    });
    return pick(pool.length ? pool : filterByLevel(buildPool(catId), cfg), n).map(function (w) {
      return {
        word: normWord(w.word || w.label || w),
        clue: w.clue || w.label || clueFromItem(w) || 'Complete the word',
        label: w.label || w.word
      };
    }).filter(function (w) { return w.word.length >= 3; });
  }

  function renderHangman(catId) {
    var cfg = levelCfg();
    var queue = pickLetterGameWords(catId, cfg, Math.max(8, Math.min(12, MIN_WORDS - 2)));
    if (!queue.length) queue = [{ word: 'PRACTICE', clue: 'What we do every day' }];
    initRound(catId, 'hangman', queue.length);
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndRestart')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.pickCat(\'' + catId + '\')">← Modos</button>'
      + '<div id="iwp-reward-slot"></div>'
      + '<div class="iwp-progress" id="iwp-progress">Palabra 1 / ' + queue.length + '</div>'
      + '<div class="iwp-status" id="iwp-status">Ahorcado · tocá letras para completar la palabra</div>'
      + '<div class="iwp-hang-wrap" id="iwp-hang-root"></div>'
      + '<button type="button" class="iwp-btn" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'hangman\')">Nueva ronda</button>';
    mountOverlay(shell('Ahorcado · ' + cfg.label, body));
    setTimeout(function () { bindHangmanGame(queue, { maxWrong: 6, aggressive: false, title: 'Ahorcado' }); }, 30);
  }

  function renderWordRush(catId) {
    var cfg = levelCfg();
    var queue = pickLetterGameWords(catId, cfg, Math.max(10, MIN_WORDS));
    if (!queue.length) queue = [{ word: 'PRESSURE', clue: 'What Rush mode feels like' }];
    initRound(catId, 'wordrush', queue.length);
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndRestart')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.pickCat(\'' + catId + '\')">← Modos</button>'
      + '<div id="iwp-reward-slot"></div>'
      + '<div class="iwp-progress" id="iwp-progress">Palabra 1 / ' + queue.length + '</div>'
      + '<div class="iwp-status" id="iwp-status">Word Rush · 3 vidas · 40s por palabra · sin piedad</div>'
      + '<div class="iwp-hang-wrap iwp-rush" id="iwp-hang-root"></div>'
      + '<button type="button" class="iwp-btn danger" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'wordrush\')">Reiniciar Rush</button>';
    mountOverlay(shell('Word Rush · ' + cfg.label, body));
    setTimeout(function () { bindHangmanGame(queue, { maxWrong: 3, aggressive: true, seconds: 40, title: 'Word Rush' }); }, 30);
  }

  function bindHangmanGame(queue, opts) {
    opts = opts || {};
    var maxWrong = opts.maxWrong || 6;
    var aggressive = !!opts.aggressive;
    var seconds = opts.seconds || 0;
    var idx = 0;
    var solved = 0;
    var timer = null;
    var root = document.getElementById('iwp-hang-root');
    if (!root) return;

    function clearTimer() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function paintWord(entry, guessed) {
      return entry.word.split('').map(function (ch) {
        var show = guessed[ch];
        return '<div class="iwp-hang-slot' + (show ? ' filled' : '') + '">' + (show ? esc(ch) : '') + '</div>';
      }).join('');
    }

    function startWord() {
      clearTimer();
      if (idx >= queue.length) {
        root.innerHTML = '<div class="iwp-status">Completaste ' + solved + ' / ' + queue.length + ' palabras</div>';
        onRoundComplete(solved, queue.length);
        return;
      }
      var entry = queue[idx];
      var guessed = {};
      var wrong = 0;
      var left = seconds;
      var pr = document.getElementById('iwp-progress');
      if (pr) pr.textContent = 'Palabra ' + (idx + 1) + ' / ' + queue.length + (aggressive ? ' · Rush' : '');
      var st = document.getElementById('iwp-status');
      if (st) st.textContent = (aggressive ? 'Rush · ' : '') + 'Completá: ' + entry.word.length + ' letras';

      function render() {
        var livesLeft = maxWrong - wrong;
        root.innerHTML = ''
          + '<div class="iwp-clue-big">' + esc(entry.clue || entry.label || 'Guess the word') + '</div>'
          + '<div class="iwp-hang-meta">'
          + '<span>Vidas ' + livesLeft + '/' + maxWrong + '</span>'
          + (aggressive ? '<span class="' + (left <= 10 ? 'danger' : '') + '" id="iwp-rush-clock">⏱ ' + left + 's</span>' : '')
          + '<span>Resueltas ' + solved + '</span>'
          + '</div>'
          + '<div class="iwp-hang-word">' + paintWord(entry, guessed) + '</div>'
          + '<div class="iwp-keys">' + alphabetKeysHtml() + '</div>';

        root.querySelectorAll('.iwp-key').forEach(function (btn) {
          var ch = btn.getAttribute('data-letter');
          if (guessed[ch] === 'good') { btn.classList.add('used', 'good'); btn.disabled = true; }
          if (guessed[ch] === 'bad') { btn.classList.add('used', 'bad'); btn.disabled = true; }
          btn.addEventListener('click', function () { guess(ch, btn); });
        });
      }

      function failWord(msg) {
        clearTimer();
        if (st) st.textContent = msg || ('Fallaste · era ' + entry.word);
        root.classList.add('shake');
        setTimeout(function () { root.classList.remove('shake'); }, 400);
        if (_round) _round.wordStreak = 0;
        idx++;
        setTimeout(startWord, aggressive ? 700 : 900);
      }

      function winWord() {
        clearTimer();
        solved++;
        if (_round) {
          _round.wordStreak = (_round.wordStreak || 0) + 1;
          _round.bestWordStreak = Math.max(_round.bestWordStreak || 0, _round.wordStreak);
        }
        if (st) st.textContent = '✓ ' + entry.word + (aggressive ? ' · ¡seguí!' : '');
        idx++;
        setTimeout(startWord, aggressive ? 450 : 700);
      }

      function guess(ch, btn) {
        if (guessed[ch]) return;
        if (entry.word.indexOf(ch) >= 0) {
          guessed[ch] = 'good';
          if (btn) { btn.classList.add('used', 'good'); btn.disabled = true; }
          render();
          var done = entry.word.split('').every(function (c) { return guessed[c] === 'good'; });
          if (done) winWord();
        } else {
          guessed[ch] = 'bad';
          wrong++;
          if (btn) { btn.classList.add('used', 'bad'); btn.disabled = true; }
          if (aggressive) {
            left = Math.max(0, left - 5);
            root.classList.add('shake');
            setTimeout(function () { root.classList.remove('shake'); }, 350);
          }
          if (wrong >= maxWrong) failWord(aggressive ? 'Sin vidas · ' + entry.word : 'Ahorcado · ' + entry.word);
          else render();
        }
      }

      render();
      if (aggressive && seconds > 0) {
        timer = setInterval(function () {
          left--;
          var clock = document.getElementById('iwp-rush-clock');
          if (clock) {
            clock.textContent = '⏱ ' + left + 's';
            if (left <= 10) clock.classList.add('danger');
          }
          if (left <= 0) failWord('Tiempo · ' + entry.word);
        }, 1000);
      }
    }

    startWord();
  }

  function bindCrossword() {
    var inputs = document.querySelectorAll('.iwp-xword');
    inputs.forEach(function (inp) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
        var ok = true;
        var filled = true;
        inputs.forEach(function (x) {
          if (!x.value) filled = false;
          else if (x.value !== x.getAttribute('data-ans')) ok = false;
        });
        if (filled && ok) {
          var st = document.getElementById('iwp-status');
          if (st) st.textContent = 'Crucigrama completado';
          if (_round) {
            _round.bestWordStreak = Math.max(_round.bestWordStreak || 0, inputs.length);
            onRoundComplete(inputs.length, inputs.length);
          }
        }
      });
    });
  }

  function renderWordSearch(catId) {
    var cfg = levelCfg();
    var puzzle = buildWordSearchMin(catId, cfg, MIN_WORDS);
    var placed = puzzle.words.length;
    initRound(catId, 'wordsearch', placed);
    var showWords = cfg.hints;
    var list = showWords
      ? puzzle.words.map(function (w) {
          return '<span id="iwp-word-' + w.word + '" class="iwp-chip">' + esc(w.word) + '</span>';
        }).join('')
      : '';
    var clues = puzzle.words.map(function (w, i) {
      return '<div class="iwp-clue"><strong>' + (i + 1) + '.</strong>' + esc(w.clue || w.label) + '</div>';
    }).join('');
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndRestart')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.pickCat(\'' + catId + '\')">← Modos</button>'
      + '<div id="iwp-reward-slot"></div>'
      + '<div class="iwp-progress" id="iwp-progress">0 / ' + placed + ' palabras</div>'
      + '<div class="iwp-status" id="iwp-status">Arrastrá · cada palabra queda de un color distinto</div>'
      + '<div class="iwp-grid-wrap">' + renderGridHtml(puzzle) + '</div>'
      + (showWords ? '<div style="margin-bottom:12px;">' + list + '</div>' : '')
      + '<div style="font-size:10px;font-weight:800;letter-spacing:.12em;color:#a78bfa;margin-bottom:8px;">PISTAS</div>'
      + '<div style="max-height:180px;overflow-y:auto;">' + clues + '</div>'
      + '<button type="button" class="iwp-btn" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'wordsearch\')">Nueva ronda</button>';
    mountOverlay(shell('Sopa de letras · ' + cfg.label, body));
    setTimeout(function () { bindWordSearch(puzzle); }, 30);
  }

  function renderFindWord(catId) {
    var cfg = levelCfg();
    var puzzle = buildWordSearchMin(catId, cfg, MIN_WORDS);
    var placed = puzzle.words.length;
    initRound(catId, 'findword', placed);
    var clues = puzzle.words.map(function (w, i) {
      return '<div class="iwp-clue"><strong>' + (i + 1) + '.</strong>' + esc(w.clue || w.label) + '</div>';
    }).join('');
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndRestart')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.pickCat(\'' + catId + '\')">← Modos</button>'
      + '<div id="iwp-reward-slot"></div>'
      + '<div class="iwp-hint-box"><div style="font-size:10px;font-weight:800;letter-spacing:.12em;color:#a78bfa;">FIND THE WORD</div>'
      + '<div style="font-size:13px;color:rgba(255,255,255,.8);margin-top:6px;line-height:1.5;">'
      + placed + ' palabras escondidas. Usá las pistas — en nivel Pro no ves la lista de palabras.</div></div>'
      + '<div class="iwp-progress" id="iwp-progress">0 / ' + placed + ' palabras</div>'
      + '<div class="iwp-status" id="iwp-status">Marcá cada palabra en la grilla</div>'
      + '<div class="iwp-grid-wrap">' + renderGridHtml(puzzle) + '</div>'
      + '<div style="max-height:200px;overflow-y:auto;margin-bottom:8px;">' + clues + '</div>'
      + '<button type="button" class="iwp-btn" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'findword\')">Nueva ronda</button>';
    mountOverlay(shell('Find the Word · ' + cfg.label, body));
    setTimeout(function () { bindWordSearch(puzzle); }, 30);
  }

  function renderCrossword(catId) {
    var cfg = levelCfg();
    var puzzle = buildCrosswordMin(catId, cfg, MIN_WORDS);
    var placed = puzzle.words.length;
    initRound(catId, 'crossword', placed);
    var cluesA = puzzle.words.filter(function (w) { return w.dir === 'across'; }).map(function (w) {
      return '<div class="iwp-clue"><strong>' + w.num + ' →</strong>' + esc(w.clue || w.label) + '</div>';
    }).join('');
    var cluesD = puzzle.words.filter(function (w) { return w.dir === 'down'; }).map(function (w) {
      return '<div class="iwp-clue"><strong>' + w.num + ' ↓</strong>' + esc(w.clue || w.label) + '</div>';
    }).join('');
    var body = renderLevelToggle('InfinityWordPuzzles.setLevelAndRestart')
      + '<button type="button" class="iwp-back" onclick="InfinityWordPuzzles.pickCat(\'' + catId + '\')">← Modos</button>'
      + '<div id="iwp-reward-slot"></div>'
      + '<div class="iwp-meta">' + placed + ' entradas cruzadas · objetivo ' + MIN_WORDS + ' · nivel ' + esc(cfg.label) + '</div>'
      + '<div class="iwp-status" id="iwp-status">Completá la grilla</div>'
      + '<div class="iwp-grid-wrap">' + renderCrosswordHtml(puzzle) + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div><div style="font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:6px;">HORIZONTALES</div>' + (cluesA || '—') + '</div>'
      + '<div><div style="font-size:10px;font-weight:800;color:#a78bfa;margin-bottom:6px;">VERTICALES</div>' + (cluesD || '—') + '</div></div>'
      + '<button type="button" class="iwp-btn" onclick="InfinityWordPuzzles.start(\'' + catId + '\',\'crossword\')">Nuevo crucigrama</button>';
    mountOverlay(shell('Crucigrama · ' + cfg.label, body));
    setTimeout(bindCrossword, 30);
  }

  function closeOverlay() {
    var el = document.getElementById('iwp-overlay');
    if (el) el.remove();
  }

  function setLevel(id) {
    if (LEVELS.some(function (l) { return l.id === id; })) _level = id;
  }

  function setLevelAndHub(id) {
    setLevel(id);
    renderHub();
  }

  function setLevelAndPickCat(id) {
    setLevel(id);
    renderGamePicker(global._iwpLastCat || 'mixed');
  }

  function setLevelAndRestart(id) {
    setLevel(id);
    start(global._iwpLastCat || 'mixed', global._iwpLastGame || 'wordsearch');
  }

  function playRandom() {
    loadExtraPool().then(function () {
      var cat = RNG.pick(PUZZLE_CATS);
      var game = RNG.pick(GAME_TYPES);
      var lv = RNG.pick(LEVELS);
      if (lv) setLevel(lv.id);
      if (cat && game) start(cat.id, game.id);
    });
  }

  function openHub() {
    loadExtraPool().then(renderHub);
  }

  function pickCat(catId) {
    global._iwpLastCat = catId;
    loadExtraPool().then(function () { renderGamePicker(catId); });
  }

  function start(catId, gameType) {
    global._iwpLastCat = catId;
    global._iwpLastGame = gameType;
    loadExtraPool().then(function () {
      if (gameType === 'crossword') renderCrossword(catId);
      else if (gameType === 'findword') renderFindWord(catId);
      else if (gameType === 'hangman') renderHangman(catId);
      else if (gameType === 'wordrush') renderWordRush(catId);
      else renderWordSearch(catId);
    });
  }

  global.InfinityWordPuzzles = {
    PUZZLE_CATS: PUZZLE_CATS,
    GAME_TYPES: GAME_TYPES,
    LEVELS: LEVELS,
    MIN_WORDS: MIN_WORDS,
    RNG: RNG,
    buildPool: buildPool,
    loadExtraPool: loadExtraPool,
    setLevel: setLevel,
    setLevelAndHub: setLevelAndHub,
    setLevelAndPickCat: setLevelAndPickCat,
    setLevelAndRestart: setLevelAndRestart,
    playRandom: playRandom,
    openHub: openHub,
    pickCat: pickCat,
    start: start,
    close: closeOverlay
  };
  global.openWordPuzzleLab = openHub;
})(typeof window !== 'undefined' ? window : globalThis);
