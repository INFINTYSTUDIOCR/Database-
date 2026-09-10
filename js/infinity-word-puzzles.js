/**
 * Word Lab — juegos nuevos (NO arcade).
 * UI profesional · niveles Foundation / ORT / Pro · mín. 14 palabras.
 */
(function (global) {
  'use strict';

  var CONFIG_VER = '20260825word4';
  var MIN_WORDS = 14;
  var _extraPool = null;
  var _extraLoad = null;
  var _level = 'ort';
  var _stylesInjected = false;
  var _round = null;

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
    { id: 'wordsearch', label: 'Sopa de letras', desc: '14+ palabras · arrastrá para marcar', icon: 'ti-grid-dots' },
    { id: 'findword', label: 'Find the Word', desc: '14 pistas · buscá en la grilla', icon: 'ti-search' },
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
    var titles = { wordsearch: 'Sopa', findword: 'Find', crossword: 'Crucigrama' };
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
    if (_stylesInjected) return;
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
      + '.iwp-card{text-align:left;border:1px solid rgba(167,139,250,.18);background:rgba(255,255,255,.04);border-radius:14px;padding:14px;cursor:pointer;width:100%;transition:background .15s,border-color .15s;}'
      + '.iwp-card:hover{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.35);}'
      + '.iwp-card-title{font-weight:800;color:#e9d5ff;font-size:14px;}'
      + '.iwp-card-sub{font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;line-height:1.45;}'
      + '.iwp-grid-wrap{overflow:auto;padding:12px;background:rgba(0,0,0,.35);border-radius:16px;border:1px solid rgba(167,139,250,.12);margin-bottom:14px;}'
      + '.iwp-grid{display:inline-grid;gap:3px;user-select:none;}'
      + '.iwp-cell{width:30px;height:30px;border-radius:6px;border:1px solid rgba(167,139,250,.2);'
      + 'background:linear-gradient(145deg,#faf8ff,#ede9fe);font-weight:800;font-size:12px;color:#3b0764;cursor:pointer;padding:0;'
      + 'box-shadow:inset 0 -1px 0 rgba(91,33,182,.08);touch-action:none;}'
      + '.iwp-cell.iwp-hit{background:linear-gradient(145deg,#86efac,#3ddc97)!important;color:#064e3b;border-color:rgba(61,220,151,.5);}'
      + '.iwp-cell.iwp-sel{background:linear-gradient(145deg,#c4b5fd,#a78bfa)!important;color:#1e1b4b;}'
      + '.iwp-xword{width:28px;height:28px;text-align:center;border:1px solid rgba(167,139,250,.35);border-radius:5px;'
      + 'font-weight:800;font-size:11px;text-transform:uppercase;background:#faf8ff;color:#3b0764;padding:0;}'
      + '.iwp-xvoid{width:28px;height:28px;background:rgba(91,33,182,.12);border-radius:4px;}'
      + '.iwp-chip{display:inline-block;margin:3px 5px 3px 0;padding:5px 11px;border-radius:999px;font-size:10px;font-weight:800;'
      + 'background:rgba(167,139,250,.15);color:#ddd6fe;border:1px solid rgba(167,139,250,.25);}'
      + '.iwp-chip.done{text-decoration:line-through;opacity:.45;}'
      + '.iwp-status{font-size:12px;font-weight:700;color:#86efac;margin-bottom:12px;letter-spacing:.02em;}'
      + '.iwp-meta{font-size:12px;color:rgba(255,255,255,.55);margin-bottom:14px;line-height:1.5;}'
      + '.iwp-back{border:none;background:transparent;color:#a78bfa;font-weight:700;font-size:12px;cursor:pointer;margin-bottom:12px;padding:0;}'
      + '.iwp-btn{width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#5b21b6,#7c3aed);'
      + 'color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-top:12px;box-shadow:0 8px 24px rgba(91,33,182,.35);}'
      + '.iwp-btn:hover{filter:brightness(1.06);}'
      + '.iwp-clue{padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.1);margin-bottom:6px;font-size:12px;color:rgba(255,255,255,.85);line-height:1.45;}'
      + '.iwp-clue strong{color:#c4b5fd;margin-right:6px;}'
      + '.iwp-progress{font-size:11px;font-weight:800;color:#a78bfa;margin-bottom:10px;}'
      + '.iwp-hint-box{background:rgba(91,33,182,.12);border:1px solid rgba(167,139,250,.2);border-radius:14px;padding:14px;margin-bottom:14px;}'
      + '.iwp-reward{background:linear-gradient(135deg,rgba(61,220,151,.18),rgba(91,33,182,.22));border:1px solid rgba(61,220,151,.35);border-radius:14px;padding:14px;margin-bottom:14px;}'
      + '.iwp-reward-title{font-size:14px;font-weight:900;color:#86efac;margin-bottom:8px;}'
      + '.iwp-reward-row{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;font-weight:800;color:#e9d5ff;}'
      + '.iwp-reward-prizes{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}'
      + '.iwp-prize-chip{font-size:10px;font-weight:800;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.3);color:#fcd34d;border:1px solid rgba(252,211,77,.3);}'
      + '.iwp-random-btn{background:linear-gradient(135deg,#0e7490,#5b21b6)!important;margin-bottom:14px;}'
      + '.iwp-streak-bar{font-size:11px;color:rgba(255,255,255,.65);margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;}';;
    var el = document.createElement('style');
    el.id = 'iwp-styles';
    el.textContent = css;
    document.head.appendChild(el);
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
    var cells = document.querySelectorAll('.iwp-cell');
    var selecting = false;
    var path = [];

    function highlightPath() {
      cells.forEach(function (el) {
        el.classList.remove('iwp-sel', 'iwp-hit');
        if (found[el.textContent]) el.classList.add('iwp-hit');
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
        if (st) st.textContent = 'Ronda completada — ' + total + ' palabras';
        onRoundComplete(n, total);
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
          if (_round) {
            _round.wordStreak = (_round.wordStreak || 0) + 1;
            _round.bestWordStreak = Math.max(_round.bestWordStreak || 0, _round.wordStreak);
          }
          var chip = document.getElementById('iwp-word-' + w.word);
          if (chip) chip.classList.add('done');
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
      + '<div class="iwp-status" id="iwp-status">Arrastrá sobre las letras · ' + placed + ' palabras en la grilla</div>'
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
