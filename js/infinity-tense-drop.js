/**
 * Structure Drop — Tetris-style tense/structure chunks + reactive pup "Pip".
 * Catch the correct verbal chunk before the tower collapses.
 */
(function (global) {
  'use strict';

  var MODE = 'tenserdrop';
  var MANTRA = 'LINK · IDEA · LINK';
  var STYLE_VER = '20260812drop1';

  var BANK = [
    {
      id: 'drop-pp-1',
      category: MODE,
      prompt: 'Present Perfect — armá la torre',
      clue: 'I ___ ___ the follow-up twice today.',
      chunks: ['have', 'sent'],
      distractors: ['sented', 'had', 'sending', 'send'],
      explain: 'have + past participle = Present Perfect.'
    },
    {
      id: 'drop-ps-1',
      category: MODE,
      prompt: 'Past Simple — armá la torre',
      clue: 'Yesterday I ___ the client.',
      chunks: ['called'],
      distractors: ['call', 'calling', 'have called', 'calls'],
      explain: 'Past Simple: verbo en pasado (called).'
    },
    {
      id: 'drop-pc-1',
      category: MODE,
      prompt: 'Present Continuous — armá la torre',
      clue: 'She ___ ___ on the proposal now.',
      chunks: ['is', 'working'],
      distractors: ['works', 'worked', 'are', 'have'],
      explain: 'am/is/are + -ing.'
    },
    {
      id: 'drop-q-1',
      category: MODE,
      prompt: 'Question (Do) — armá la torre',
      clue: '___ you ___ remote?',
      chunks: ['Do', 'work'],
      distractors: ['Does', 'working', 'worked', 'Are'],
      explain: 'Do + you + verbo base.'
    },
    {
      id: 'drop-will-1',
      category: MODE,
      prompt: 'Future (will) — armá la torre',
      clue: 'I ___ ___ you before noon.',
      chunks: ['will', 'update'],
      distractors: ['updating', 'updated', 'going', 'am'],
      explain: 'will + verbo base.'
    },
    {
      id: 'drop-going-1',
      category: MODE,
      prompt: 'Going to — armá la torre',
      clue: 'We ___ ___ ___ the launch Friday.',
      chunks: ['are', 'going', 'to ship'],
      distractors: ['will', 'shipped', 'is', 'go'],
      explain: 'be + going to + verbo base.'
    },
    {
      id: 'drop-neg-1',
      category: MODE,
      prompt: 'Negativa Presente — armá la torre',
      clue: 'She ___ ___ Mondays.',
      chunks: ["doesn't", 'work'],
      distractors: ["don't", 'works', 'working', 'worked'],
      explain: "doesn't + verbo base (3ª persona)."
    },
    {
      id: 'drop-pp-2',
      category: MODE,
      prompt: 'Present Perfect — armá la torre',
      clue: 'They ___ ___ three interviews this week.',
      chunks: ['have', 'done'],
      distractors: ['did', 'doing', 'has', 'do'],
      explain: 'have + done (participio).'
    },
    {
      id: 'drop-ps-2',
      category: MODE,
      prompt: 'Past Simple — armá la torre',
      clue: 'Last quarter sales ___.',
      chunks: ['dropped'],
      distractors: ['drop', 'dropping', 'have dropped', 'drops'],
      explain: 'Hecho terminado en el pasado → Past Simple.'
    },
    {
      id: 'drop-mod-1',
      category: MODE,
      prompt: 'Modal (can) — armá la torre',
      clue: 'I ___ ___ the numbers in one minute.',
      chunks: ['can', 'check'],
      distractors: ['checking', 'checked', 'could to', 'am'],
      explain: 'can + verbo base.'
    }
  ];

  function esc(s) {
    if (typeof arcadeEsc === 'function') return arcadeEsc(s);
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function ensureStyles() {
    var el = document.getElementById('infinity-tense-drop-styles');
    if (el && el.getAttribute('data-ver') === STYLE_VER) return;
    if (el) el.parentNode.removeChild(el);
    var st = document.createElement('style');
    st.id = 'infinity-tense-drop-styles';
    st.setAttribute('data-ver', STYLE_VER);
    st.textContent =
      '@keyframes dropFall{0%{transform:translateY(-20px);opacity:0}10%{opacity:1}100%{transform:translateY(118px);opacity:.95}}' +
      '@keyframes dropShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
      '@keyframes dropCrack{0%{opacity:.2}50%{opacity:.8}100%{opacity:.35}}' +
      '@keyframes pupBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}' +
      '@keyframes pupWorry{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(2px) rotate(2deg)}}' +
      '@keyframes pupWipe{0%{transform:rotate(0)}30%{transform:rotate(-12deg) translateX(-4px)}60%{transform:rotate(8deg)}100%{transform:rotate(0)}}' +
      '@keyframes pupSigh{0%,100%{transform:scale(1)}40%{transform:scale(1.06)}70%{transform:scale(.98)}}' +
      '@keyframes pupCheer{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}' +
      '@keyframes pupCrazy{0%{transform:rotate(0) scale(1)}25%{transform:rotate(-18deg) scale(1.12)}50%{transform:rotate(16deg) scale(1.08)}75%{transform:rotate(-10deg) scale(1.15)}100%{transform:rotate(0) scale(1)}}' +
      '@keyframes puff{0%{transform:scale(.4);opacity:.8}100%{transform:scale(1.6);opacity:0}}' +
      '.inf-mod-stage.sky-drop{background:linear-gradient(180deg,#0f172a 0%,#1e3a8a 40%,#5B21B6 70%,#78350f 100%)}' +
      '.inf-drop-wrap{position:relative;z-index:2}' +
      '.inf-drop-board{position:relative;height:210px;border-radius:16px;overflow:hidden;border:2px solid rgba(245,166,35,.4);background:linear-gradient(180deg,rgba(15,23,42,.75),rgba(120,53,15,.45));margin-bottom:10px}' +
      '.inf-drop-skyline{position:absolute;left:0;right:0;bottom:0;height:72px;display:flex;align-items:flex-end;justify-content:center;gap:4px;padding:0 10px 8px;z-index:1}' +
      '.inf-drop-block{flex:1;max-width:48px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#F5A623,#b45309);border:1px solid rgba(255,255,255,.25);min-height:10px;transition:height .25s,filter .2s,opacity .2s}' +
      '.inf-drop-block.empty{opacity:.25;min-height:14px;height:14px!important;background:#334155}' +
      '.inf-drop-block.crack{filter:saturate(.5) brightness(.7);animation:dropShake .4s ease}' +
      '.inf-drop-board.is-collapse{animation:dropShake .5s ease}' +
      '.inf-drop-board.is-collapse .inf-drop-crack{opacity:1}' +
      '.inf-drop-crack{position:absolute;inset:0;pointer-events:none;opacity:0;background:repeating-linear-gradient(120deg,transparent,transparent 18px,rgba(239,68,68,.35) 18px,rgba(239,68,68,.35) 20px);animation:dropCrack 1.2s ease-in-out infinite;z-index:2}' +
      '.inf-drop-lane{position:absolute;inset:8px 8px 80px;z-index:3}' +
      '.inf-drop-piece{position:absolute;top:0;min-width:72px;padding:8px 10px;border-radius:10px;border:2px solid #F5A623;background:rgba(11,6,24,.88);color:#fff;font-weight:900;font-size:12px;cursor:pointer;animation:dropFall 3.2s linear forwards;box-shadow:0 6px 14px rgba(0,0,0,.35);z-index:4}' +
      '.inf-drop-piece:nth-child(1){left:6%;animation-duration:3.4s}' +
      '.inf-drop-piece:nth-child(2){left:36%;animation-duration:2.9s;animation-delay:.15s}' +
      '.inf-drop-piece:nth-child(3){left:66%;animation-duration:3.6s;animation-delay:.08s}' +
      '.inf-drop-piece:nth-child(4){left:20%;animation-duration:3.1s;animation-delay:.25s}' +
      '.inf-drop-piece.is-correct-hint{border-color:#22D3EE}' +
      '.inf-drop-piece:active{transform:scale(.96)}' +
      '.inf-drop-foundation{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:40px;margin:8px 0;padding:8px;border-radius:12px;background:rgba(11,6,24,.7);border:1px dashed rgba(245,166,35,.45)}' +
      '.inf-drop-slot{padding:7px 10px;border-radius:8px;background:rgba(91,33,182,.45);border:1px solid rgba(245,166,35,.35);font-weight:800;font-size:12px}' +
      '.inf-drop-slot.ph{opacity:.4;border-style:dashed}' +
      '.inf-drop-prompt{font-weight:900;font-size:15px;margin-bottom:4px}' +
      '.inf-drop-clue{font-size:13px;opacity:.9;margin-bottom:8px;font-style:italic}' +
      /* Pip the pup */
      '.inf-pup{position:absolute;right:10px;bottom:78px;width:78px;height:72px;z-index:5;animation:pupBob 2s ease-in-out infinite}' +
      '.inf-pup .body{position:absolute;left:16px;bottom:8px;width:46px;height:34px;border-radius:20px 20px 12px 12px;background:linear-gradient(180deg,#f5d0a9,#d97706)}' +
      '.inf-pup .head{position:absolute;left:18px;top:4px;width:42px;height:38px;border-radius:50%;background:linear-gradient(180deg,#fde68a,#d97706);border:2px solid #92400e}' +
      '.inf-pup .ear{position:absolute;top:6px;width:14px;height:22px;border-radius:10px;background:#92400e}' +
      '.inf-pup .ear.l{left:10px;transform:rotate(-18deg)}.inf-pup .ear.r{right:10px;transform:rotate(18deg)}' +
      '.inf-pup .eye{position:absolute;top:14px;width:7px;height:7px;border-radius:50%;background:#111}' +
      '.inf-pup .eye.l{left:10px}.inf-pup .eye.r{right:10px}' +
      '.inf-pup .snout{position:absolute;left:50%;bottom:6px;width:16px;height:10px;margin-left:-8px;border-radius:8px;background:#f8e7d4}' +
      '.inf-pup .nose{position:absolute;left:50%;top:0;width:8px;height:6px;margin-left:-4px;border-radius:4px;background:#111}' +
      '.inf-pup .mouth{position:absolute;left:50%;bottom:1px;width:10px;height:4px;margin-left:-5px;border-radius:0 0 6px 6px;background:#be123c}' +
      '.inf-pup .paw{position:absolute;width:12px;height:10px;border-radius:6px;background:#b45309;bottom:4px}' +
      '.inf-pup .paw.l{left:18px}.inf-pup .paw.r{right:14px}' +
      '.inf-pup .sweat{position:absolute;right:4px;top:8px;width:8px;height:12px;border-radius:6px;background:#22d3ee;opacity:0}' +
      '.inf-pup .puff{position:absolute;left:50%;top:0;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:rgba(255,255,255,.5);opacity:0;pointer-events:none}' +
      '.inf-pup .label{position:absolute;left:50%;bottom:-14px;transform:translateX(-50%);font-size:9px;font-weight:900;letter-spacing:.06em;color:#FDE68A;white-space:nowrap;text-shadow:0 2px 6px #000}' +
      '.inf-pup.is-idle{animation:pupBob 2s ease-in-out infinite}' +
      '.inf-pup.is-worry1{animation:pupWorry 1.2s ease-in-out infinite}' +
      '.inf-pup.is-worry1 .eye{height:4px;border-radius:2px;top:16px}' +
      '.inf-pup.is-worry1 .sweat{opacity:.7}' +
      '.inf-pup.is-worry2{animation:pupWorry .8s ease-in-out infinite}' +
      '.inf-pup.is-worry2 .eye{height:3px;top:15px;background:#7f1d1d}' +
      '.inf-pup.is-worry2 .sweat{opacity:1}' +
      '.inf-pup.is-worry2 .mouth{width:12px;height:3px;margin-left:-6px;border-radius:2px;transform:rotate(-10deg)}' +
      '.inf-pup.is-worry3{animation:pupWorry .45s linear infinite}' +
      '.inf-pup.is-worry3 .eye{box-shadow:0 0 6px #ef4444;background:#7f1d1d}' +
      '.inf-pup.is-worry3 .sweat{opacity:1;height:16px}' +
      '.inf-pup.is-worry3 .body{background:linear-gradient(180deg,#fdba74,#b45309)}' +
      '.inf-pup.is-wipe{animation:pupWipe .7s ease}' +
      '.inf-pup.is-wipe .paw.r{animation:pupWipe .7s ease}' +
      '.inf-pup.is-wipe .sweat{opacity:0}' +
      '.inf-pup.is-wipe .puff{opacity:1;animation:puff .6s ease-out forwards}' +
      '.inf-pup.is-sigh{animation:pupSigh .9s ease}' +
      '.inf-pup.is-sigh .eye{height:2px;border-radius:2px;top:16px}' +
      '.inf-pup.is-sigh .mouth{width:14px;height:6px;margin-left:-7px;border-radius:0 0 10px 10px}' +
      '.inf-pup.is-cheer{animation:pupCheer .45s ease-in-out infinite}' +
      '.inf-pup.is-cheer .eye{height:2px;top:16px}' +
      '.inf-pup.is-cheer .mouth{width:18px;height:10px;margin-left:-9px;border-radius:0 0 12px 12px;background:#be123c}' +
      '.inf-pup.is-cheer .paw{bottom:16px}' +
      '.inf-pup.is-crazy{animation:pupCrazy .55s ease-in-out infinite}' +
      '.inf-pup.is-crazy .eye{background:#16a34a}' +
      '.inf-pup.is-crazy .mouth{width:20px;height:12px;margin-left:-10px}' +
      '.inf-pup.is-crazy .label{color:#86EFAC}' +
      '.inf-pup-hub{position:relative;width:70px;height:78px;margin:0 auto;animation:pupBob 2.2s ease-in-out infinite}' +
      '.inf-pup-hub .body{position:absolute;left:12px;bottom:6px;width:46px;height:34px;border-radius:20px;background:linear-gradient(180deg,#f5d0a9,#d97706)}' +
      '.inf-pup-hub .head{position:absolute;left:14px;top:2px;width:42px;height:38px;border-radius:50%;background:linear-gradient(180deg,#fde68a,#d97706);border:2px solid #92400e}' +
      '.inf-pup-hub .ear{position:absolute;top:4px;width:14px;height:22px;border-radius:10px;background:#92400e}' +
      '.inf-pup-hub .ear.l{left:8px;transform:rotate(-18deg)}.inf-pup-hub .ear.r{right:8px;left:auto;transform:rotate(18deg)}' +
      '.inf-pup-hub .eye{position:absolute;top:14px;width:7px;height:7px;border-radius:50%;background:#111}' +
      '.inf-pup-hub .eye.l{left:10px}.inf-pup-hub .eye.r{right:10px;left:auto}' +
      '.inf-pup-hub .snout{position:absolute;left:50%;bottom:6px;width:16px;height:10px;margin-left:-8px;border-radius:8px;background:#f8e7d4}' +
      '.art-drop{background:linear-gradient(165deg,#0f172a,#1e3a8a 45%,#5B21B6,#b45309)}';
    document.head.appendChild(st);
  }

  var PUP_HTML =
    '<div class="inf-pup is-idle" id="inf-pup-live" aria-live="polite">' +
    '<div class="ear l"></div><div class="ear r"></div>' +
    '<div class="head"><i class="eye l"></i><i class="eye r"></i><div class="snout"><i class="nose"></i><i class="mouth"></i></div></div>' +
    '<div class="body"></div><div class="paw l"></div><div class="paw r"></div>' +
    '<div class="sweat"></div><div class="puff"></div>' +
    '<div class="label">PIP</div></div>';

  var PUP_HUB =
    '<div class="inf-pup-hub" aria-hidden="true"><div class="ear l"></div><div class="ear r"></div>' +
    '<div class="head"><i class="eye l"></i><i class="eye r"></i><div class="snout"></div></div><div class="body"></div></div>';

  var PUP_LABEL = {
    idle: 'PIP',
    worry1: 'uh-oh…',
    worry2: 'cuidado!',
    worry3: '¡colapsa!',
    wipe: 'uff…',
    sigh: 'suspiro',
    cheer: '¡vamos!',
    crazy: '¡LOCO!'
  };

  function setPupMood(mood) {
    var el = document.getElementById('inf-pup-live');
    if (!el) return;
    el.className = 'inf-pup is-' + (mood || 'idle');
    var lab = el.querySelector('.label');
    if (lab) lab.textContent = PUP_LABEL[mood] || 'PIP';
  }

  function clearFallTimer(st) {
    if (st && st._dropFallTimer) {
      clearTimeout(st._dropFallTimer);
      st._dropFallTimer = null;
    }
  }

  function initDropState(st, q) {
    clearFallTimer(st);
    st._drop = {
      next: 0,
      placed: [],
      misses: 0,
      worry: 0,
      done: false,
      chunks: (q.chunks || []).slice(),
      wave: 0
    };
  }

  function foundationHtml(st) {
    var d = st._drop;
    var chunks = d.chunks || [];
    var html = '<div class="inf-drop-foundation" id="inf-drop-foundation">';
    for (var i = 0; i < chunks.length; i++) {
      if (i < d.placed.length) {
        html += '<span class="inf-drop-slot">' + esc(d.placed[i]) + '</span>';
      } else {
        html += '<span class="inf-drop-slot ph">· · ·</span>';
      }
    }
    return html + '</div>';
  }

  function skylineHtml(st) {
    var d = st._drop;
    var n = (d.chunks || []).length || 3;
    var html = '<div class="inf-drop-skyline" id="inf-drop-skyline">';
    for (var i = 0; i < n; i++) {
      var h = i < d.placed.length ? 18 + (i + 1) * 12 : 14;
      var cls = 'inf-drop-block' + (i < d.placed.length ? '' : ' empty');
      if (d.worry >= 2 && i < d.placed.length) cls += ' crack';
      html += '<div class="' + cls + '" style="height:' + h + 'px"></div>';
    }
    return html + '</div>';
  }

  function spawnWave(st) {
    if (!st || !st._drop || st._drop.done || st.answered) return;
    var d = st._drop;
    var need = d.chunks[d.next];
    if (!need) return;
    var q = st.quiz[st.idx] || {};
    var pool = shuffle((q.distractors || []).concat([need])).slice(0, 4);
    if (pool.indexOf(need) < 0) pool[0] = need;
    pool = shuffle(pool);
    var lane = document.getElementById('inf-drop-lane');
    if (!lane) return;
    lane.innerHTML = '';
    pool.forEach(function (text, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inf-drop-piece';
      btn.style.left = 8 + i * 22 + '%';
      btn.style.animationDuration = 2.6 + (i % 3) * 0.35 + 's';
      btn.textContent = text;
      btn.setAttribute('data-chunk', text);
      btn.onclick = function () {
        global._infDropCatch(text);
      };
      lane.appendChild(btn);
    });
    clearFallTimer(st);
    st._dropFallTimer = setTimeout(function () {
      // pieces hit ground without correct catch → soft worry
      if (st.answered || !st._drop || st._drop.done) return;
      st._drop.worry = Math.min(3, (st._drop.worry || 0) + 1);
      st._drop.misses = (st._drop.misses || 0) + 1;
      applyWorryVisual(st);
      if (st._drop.misses >= 3) {
        failDrop(st, 'Se te cayeron los chunks — la torre tembló.');
        return;
      }
      spawnWave(st);
    }, 3600);
  }

  function applyWorryVisual(st) {
    var w = (st._drop && st._drop.worry) || 0;
    setPupMood(w >= 3 ? 'worry3' : w === 2 ? 'worry2' : w === 1 ? 'worry1' : 'idle');
    var board = document.getElementById('inf-drop-board');
    if (board) {
      board.classList.toggle('is-collapse', w >= 2);
      var sky = document.getElementById('inf-drop-skyline');
      if (sky) sky.outerHTML = skylineHtml(st);
    }
  }

  function refreshFoundation(st) {
    var f = document.getElementById('inf-drop-foundation');
    if (f) f.outerHTML = foundationHtml(st);
    var sky = document.getElementById('inf-drop-skyline');
    if (sky) sky.outerHTML = skylineHtml(st);
  }

  function failDrop(st, msg) {
    if (!st || st._drop.done) return;
    st._drop.done = true;
    clearFallTimer(st);
    setPupMood('worry3');
    var board = document.getElementById('inf-drop-board');
    if (board) board.classList.add('is-collapse');
    if (typeof arcadeFinishQuestion === 'function') {
      arcadeFinishQuestion(false, msg || 'Torre colapsada');
    }
  }

  function winDrop(st) {
    if (!st || st._drop.done) return;
    st._drop.done = true;
    clearFallTimer(st);
    var streak = (st.streak || 0) + 1;
    if (streak >= 2) setPupMood('cheer');
    else setPupMood('sigh');
    var sentence = st._drop.placed.join(' ');
    if (typeof arcadeFinishQuestion === 'function') {
      arcadeFinishQuestion(true, sentence);
    }
  }

  global._infDropCatch = function (text) {
    var st = global._arcadeState;
    if (!st || st.answered || !st._drop || st._drop.done) return;
    var d = st._drop;
    var need = d.chunks[d.next];
    if (String(text) === String(need)) {
      d.placed.push(need);
      d.next++;
      d.worry = Math.max(0, d.worry - 1);
      refreshFoundation(st);
      // wipe forehead + sigh
      setPupMood('wipe');
      setTimeout(function () {
        if (st.answered || d.done) return;
        if ((st.streak || 0) >= 1 && d.next < d.chunks.length) setPupMood('cheer');
        else setPupMood('sigh');
      }, 700);
      clearFallTimer(st);
      var lane = document.getElementById('inf-drop-lane');
      if (lane) lane.innerHTML = '';
      if (d.next >= d.chunks.length) {
        setTimeout(function () {
          winDrop(st);
        }, 450);
        return;
      }
      setTimeout(function () {
        spawnWave(st);
      }, 400);
      return;
    }
    // miss
    d.misses++;
    d.worry = Math.min(3, d.worry + 1);
    applyWorryVisual(st);
    if (d.misses >= 3) {
      failDrop(st, 'Chunk incorrecto — Pip casi se desmaya.');
      return;
    }
  };

  function dropBody(st, q) {
    ensureStyles();
    initDropState(st, q);
    setTimeout(function () {
      setPupMood('idle');
      spawnWave(st);
    }, 200);
    return (
      '<div class="inf-drop-wrap">' +
      '<div class="inf-drop-prompt">' +
      esc(q.prompt || 'Armá la estructura') +
      '</div>' +
      '<div class="inf-drop-clue">' +
      esc(q.clue || '') +
      '</div>' +
      '<div class="inf-drop-board" id="inf-drop-board">' +
      '<div class="inf-drop-crack"></div>' +
      '<div class="inf-drop-lane" id="inf-drop-lane"></div>' +
      PUP_HTML +
      skylineHtml(st) +
      '</div>' +
      foundationHtml(st) +
      '<div style="text-align:center;font-size:11px;font-weight:800;color:#C4B5FD;letter-spacing:.08em">' +
      MANTRA +
      ' · tocá el chunk correcto antes de que caiga</div></div>'
    );
  }

  function registerMode() {
    if (typeof ARCADE_MODES === 'undefined') return;
    ARCADE_MODES[MODE] = {
      title: 'Structure Drop',
      icon: 'ti-stack-2',
      desc: 'Chunks de tiempo verbal caen. Armá la torre o Pip colapsa.',
      category: MODE,
      color: '#d97706',
      difficulty: 2,
      stars: '★★ Drop'
    };
  }

  function mergeBank() {
    if (typeof ARCADE_BANK === 'undefined') return;
    if (!ARCADE_BANK[MODE] || !ARCADE_BANK[MODE].length) {
      ARCADE_BANK[MODE] = BANK.slice();
    }
  }

  function patchModernFlag() {
    var prev = global.arcadeIsModernMode;
    global.arcadeIsModernMode = function (mode) {
      if (mode === MODE) return true;
      return typeof prev === 'function' ? prev(mode) : false;
    };
  }

  function patchShell() {
    if (typeof arcadeRoundShell !== 'function') return;
    var prev = arcadeRoundShell;
    global.arcadeRoundShell = function (st, q, body) {
      if (st && st.mode === MODE) {
        // reuse modern shell if available by faking theme via HTML wrapper
        if (typeof global.arcadeIsModernMode === 'function') {
          // build a lightweight modern-like shell
          ensureStyles();
          var menuAction =
            st.containerId === 'inf-arcade-fs-body'
              ? 'closeInfinityArcadeFullscreen()'
              : "renderArcadeMenu('" + st.containerId + "')";
          return (
            '<div class="inf-mod" style="--accent:#d97706">' +
            '<div class="inf-mod-top"><strong>STRUCTURE DROP</strong><button type="button" onclick="' +
            menuAction +
            '">HUB</button></div>' +
            '<div class="inf-mod-stage sky-drop">' +
            '<div class="inf-mod-hud"><span>Pip</span><span>' +
            (st.idx + 1) +
            '/' +
            st.quiz.length +
            '</span><span>STREAK ' +
            st.streak +
            '</span></div>' +
            '<div id="' +
            st.containerId +
            '-combo" class="arcade-combo-chip" style="display:none"></div>' +
            '<div class="inf-mod-body">' +
            body +
            '<div class="inf-mod-result" id="' +
            st.containerId +
            '-result"></div></div></div></div>'
          );
        }
      }
      return prev(st, q, body);
    };
  }

  function patchBodies() {
    if (typeof arcadeQuestionBody !== 'function') return;
    var prev = arcadeQuestionBody;
    global.arcadeQuestionBody = function (st, q) {
      if (st && st.mode === MODE) return dropBody(st, q);
      return prev(st, q);
    };
  }

  function patchPick() {
    if (typeof pickArcadeQuestions !== 'function') return;
    var prev = pickArcadeQuestions;
    global.pickArcadeQuestions = function (mode, s, count, allowRepeat) {
      if (mode === MODE) {
        count = count || 6;
        var pool = shuffle((ARCADE_BANK[MODE] || BANK).map(function (q) {
          return Object.assign({ category: MODE }, q);
        }));
        return pool.slice(0, count);
      }
      return prev(mode, s, count, allowRepeat);
    };
  }

  function patchCategory() {
    if (typeof arcadeCategoryLabel !== 'function') return;
    var prev = arcadeCategoryLabel;
    global.arcadeCategoryLabel = function (cat) {
      if (cat === MODE) return 'Structure Drop';
      return prev(cat);
    };
  }

  function patchFinish() {
    if (typeof arcadeFinishQuestion !== 'function') return;
    var prev = arcadeFinishQuestion;
    global.arcadeFinishQuestion = function (correct, response) {
      var st = global._arcadeState;
      if (st && st.mode === MODE) clearFallTimer(st);
      prev(correct, response);
      st = global._arcadeState;
      if (!st || st.mode !== MODE) return;
      if (correct) {
        if ((st.streak || 0) >= 2) setPupMood('cheer');
        else setPupMood('sigh');
      } else {
        setPupMood('worry3');
      }
      var box = document.getElementById(st.containerId + '-result');
      if (!box) return;
      var q = st.quiz[st.idx] || {};
      box.innerHTML =
        '<div class="box ' +
        (correct ? 'ok' : 'bad') +
        '" style="border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.15);' +
        (correct
          ? 'background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.4)'
          : 'background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35)') +
        '"><div style="font-weight:900;margin-bottom:4px">' +
        (correct ? 'Torre firme — Pip suspira aliviado' : 'La torre colapsó — Pip está fatal') +
        '</div><div style="font-size:13px;opacity:.9">' +
        esc(q.explain || '') +
        '</div><button type="button" class="inf-mod-cta" onclick="arcadeNextQuestion()">' +
        (st.idx + 1 < st.quiz.length ? 'SIGUIENTE' : 'RESULTADO') +
        '</button></div>';
    };
  }

  function patchEnd() {
    if (typeof finishArcadeRound !== 'function') return;
    var prev = finishArcadeRound;
    global.infinityTenseDropFinish = async function (containerId) {
      var st = global._arcadeState;
      if (!st || st.mode !== MODE) return prev(containerId);
      clearFallTimer(st);
      if (typeof arcadeClearQuestionTimer === 'function') arcadeClearQuestionTimer();
      var correct = st.correct;
      var total = st.quiz.length || 1;
      var score = Math.round((correct / total) * 100);
      var reward = arcadeApplyRoundMeta(st, score);
      st._lastReward = reward;
      try {
        await saveArcadeResult(st, score);
      } catch (e) {}
      var c = document.getElementById(containerId);
      if (!c) return;
      ensureStyles();
      var menuAction =
        containerId === 'inf-arcade-fs-body'
          ? 'closeInfinityArcadeFullscreen()'
          : "renderArcadeMenu('" + containerId + "')";
      var pupMood = score >= 70 ? 'crazy' : score >= 40 ? 'cheer' : 'worry2';
      var title = score >= 70 ? 'TOWER SAVED' : score >= 40 ? 'TOWER SHAKY' : 'TOWER DOWN';
      c.innerHTML =
        '<div class="inf-mod"><div class="inf-mod-top"><strong>STRUCTURE DROP</strong><button type="button" onclick="' +
        menuAction +
        '">HUB</button></div><div class="inf-mod-stage sky-drop"><div class="inf-mod-end" style="text-align:center;padding:18px">' +
        '<div class="inf-pup is-' +
        pupMood +
        '" style="position:relative;right:auto;bottom:auto;margin:0 auto 12px">' +
        '<div class="ear l"></div><div class="ear r"></div>' +
        '<div class="head"><i class="eye l"></i><i class="eye r"></i><div class="snout"><i class="nose"></i><i class="mouth"></i></div></div>' +
        '<div class="body"></div><div class="paw l"></div><div class="paw r"></div>' +
        '<div class="label">' +
        (pupMood === 'crazy' ? '¡LOCO!' : pupMood === 'cheer' ? '¡vamos!' : 'uh-oh…') +
        '</div></div>' +
        '<h2 style="font-family:Bebas Neue,sans-serif;font-size:36px;color:#F5A623;margin:0 0 8px">' +
        title +
        '</h2>' +
        '<div style="font-weight:800">' +
        correct +
        '/' +
        total +
        ' · ' +
        score +
        '%</div>' +
        '<div style="margin:12px 0;opacity:.9">' +
        (score >= 70
          ? 'Pip se volvió loco de la emoción.'
          : score >= 40
            ? 'Pip te hace porras — seguí armando.'
            : 'Pip está preocupado. Otra torre.') +
        '</div>' +
        '<div style="font-size:12px;margin:8px 0">' +
        MANTRA +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px">' +
        '<button type="button" class="inf-mod-cta" onclick="startArcadeMode(\'tenserdrop\',\'' +
        containerId +
        '\')">RETRY</button>' +
        '<button type="button" class="inf-mod-cta" style="background:rgba(255,255,255,.12);color:#fff" onclick="' +
        menuAction +
        '">HUB</button></div></div></div></div>';
    };
    global.finishArcadeRound = async function (containerId) {
      var st = global._arcadeState;
      if (!st || st.mode !== MODE) return prev(containerId);
      return global.infinityTenseDropFinish(containerId);
    };
  }

  function patchHubChar() {
    ensureStyles();
    if (!global.INFINITY_CSS_CHARS) global.INFINITY_CSS_CHARS = {};
    global.INFINITY_CSS_CHARS.pup = PUP_HUB;
    var prev = global.infinityCharHtml;
    global.infinityCharHtml = function (key) {
      ensureStyles();
      if (key === 'pup') return PUP_HUB;
      return typeof prev === 'function' ? prev(key) : '';
    };
  }

  function patchPrizes() {
    if (typeof arcadeComputePrizes !== 'function') return;
    var prev = arcadeComputePrizes;
    global.arcadeComputePrizes = function (st, score, metaBefore, metaAfter) {
      var prizes = prev(st, score, metaBefore, metaAfter) || [];
      if (st && st.mode === MODE && score >= 80) {
        prizes.push({ id: 'pip-hero', icon: '', title: 'PIP HERO', coins: 34, xp: 28 });
      }
      return prizes;
    };
  }

  function boot() {
    if (typeof ARCADE_MODES === 'undefined' || typeof arcadeQuestionBody !== 'function') return false;
    ensureStyles();
    registerMode();
    mergeBank();
    patchModernFlag();
    patchShell();
    patchBodies();
    patchPick();
    patchCategory();
    patchFinish();
    patchEnd();
    patchHubChar();
    patchPrizes();
    global.INFINITY_TENSE_DROP = { mode: MODE, bank: BANK };
    return true;
  }

  var tries = 0;
  function schedule() {
    if (boot()) return;
    tries++;
    if (tries < 80) setTimeout(schedule, 120);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})(typeof window !== 'undefined' ? window : globalThis);
