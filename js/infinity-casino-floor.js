/**
 * Infinity Casino Floor — virtual casino lobby + per-game title splash screens.
 * Replaces the physical arcade-cabinet UX. Pedagogy: LINK · IDEA · LINK.
 */
(function (global) {
  'use strict';

  var MANTRA = 'LINK · IDEA · LINK';
  var CACHE_BUST = '20260812casino';

  var FLOOR_GAMES = [
    {
      id: 'bosscall',
      mode: 'bosscall',
      title: 'BOSS CALL',
      sub: 'Cliente enojado · respondé con estructura',
      badge: 'NUEVO',
      accent: '#fb7185',
      glow: '#be123c',
      icon: '📞',
      stars: '★★★'
    },
    {
      id: 'star',
      mode: 'star',
      title: 'STAR ARENA',
      sub: 'Entrevista · Situation → Result',
      badge: 'NUEVO',
      accent: '#fbbf24',
      glow: '#ca8a04',
      icon: '⭐',
      stars: '★★'
    },
    {
      id: 'listen',
      mode: 'listen',
      title: 'SPEED LISTEN',
      sub: 'Oí la cadena · respondé YA',
      badge: 'NUEVO',
      accent: '#22d3ee',
      glow: '#0891b2',
      icon: '🎧',
      stars: '★★'
    },
    {
      id: 'tone',
      mode: 'tone',
      title: 'TONE POLICE',
      sub: 'Misma idea · tono que eleva',
      badge: 'NUEVO',
      accent: '#4ade80',
      glow: '#059669',
      icon: '🕊️',
      stars: '★'
    },
    {
      id: 'nemesis',
      mode: 'nemesis',
      title: 'NEMESIS DUEL',
      sub: 'Solo tus fallos · venganza útil',
      badge: 'NUEVO',
      accent: '#fb923c',
      glow: '#c2410c',
      icon: '⚔️',
      stars: '★★★'
    },
    {
      id: 'snake',
      mode: 'snake',
      title: 'LINKER SNAKE',
      sub: 'Encadená linker → idea → linker',
      badge: 'NUEVO',
      accent: '#a78bfa',
      glow: '#6d28d9',
      icon: '🐍',
      stars: '★★'
    },
    {
      id: 'phrasalswap',
      mode: 'phrasalswap',
      title: 'PHRASAL SWAP',
      sub: 'Phrasal correcto dentro del L+I+L',
      badge: 'NUEVO',
      accent: '#60a5fa',
      glow: '#1d4ed8',
      icon: '🔀',
      stars: '★★'
    },
    {
      id: 'dailyboss',
      mode: 'dailyboss',
      title: 'DAILY BOSS',
      sub: 'Un jefe del día · trophy rotativo',
      badge: 'HOY',
      accent: '#fde047',
      glow: '#a16207',
      icon: '👑',
      stars: '★★★'
    },
    {
      id: 'frenzy',
      mode: 'frenzy',
      title: 'FRENZY',
      sub: 'Todo mezclado · timer · fallos primero',
      badge: '',
      accent: '#f472b6',
      glow: '#be123c',
      icon: '🔥',
      stars: '★★★'
    },
    {
      id: 'challenge',
      mode: 'challenge',
      title: 'CHALLENGE',
      sub: 'Presión · linkers + estructura',
      badge: '',
      accent: '#f59e0b',
      glow: '#b45309',
      icon: '⚡',
      stars: '★★'
    },
    {
      id: 'verb',
      mode: 'verb',
      title: 'VERB HUNT',
      sub: 'Word reveal operacional',
      badge: '',
      accent: '#2dd4bf',
      glow: '#0f766e',
      icon: '🎯',
      stars: '★'
    },
    {
      id: 'structure',
      mode: 'structure',
      title: 'STRUCTURE',
      sub: 'Armá oraciones de trabajo real',
      badge: '',
      accent: '#c4b5fd',
      glow: '#5b21b6',
      icon: '🧱',
      stars: '★'
    },
    {
      id: 'linker',
      mode: 'linker',
      title: 'LINKER QUEST',
      sub: 'Conectores de entrevista y meetings',
      badge: '',
      accent: '#ddd6fe',
      glow: '#6d28d9',
      icon: '🔗',
      stars: '★★'
    },
    {
      id: 'phrasal',
      mode: 'phrasal',
      title: 'PHRASAL MASTER',
      sub: 'Phrasals de call / follow-up',
      badge: '',
      accent: '#93c5fd',
      glow: '#1d4ed8',
      icon: '🧩',
      stars: '★★'
    },
    {
      id: 'preposition',
      mode: 'preposition',
      title: 'PREPOSITIONS',
      sub: 'in / on / at / by bajo contexto',
      badge: '',
      accent: '#fdba74',
      glow: '#b45309',
      icon: '📍',
      stars: '★'
    },
    {
      id: 'rapid',
      kind: 'rapid',
      title: 'RAPID DRILL',
      sub: 'Kaboom · Foundations',
      badge: '',
      accent: '#fda4af',
      glow: '#e11d48',
      icon: '💥',
      stars: '★★'
    }
  ];

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ensureStyles() {
    if (document.getElementById('infinity-casino-floor-styles')) return;
    if (!document.getElementById('casino-display-font')) {
      var link = document.createElement('link');
      link.id = 'casino-display-font';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bungee&family=Press+Start+2P&display=swap';
      document.head.appendChild(link);
    }
    var st = document.createElement('style');
    st.id = 'infinity-casino-floor-styles';
    st.textContent =
      '@keyframes casinoNeonPulse{0%,100%{filter:brightness(1);text-shadow:0 0 12px currentColor}50%{filter:brightness(1.25);text-shadow:0 0 28px currentColor,0 0 48px currentColor}}' +
      '@keyframes casinoChipSpin{0%{transform:rotateY(0) translateY(0)}50%{transform:rotateY(180deg) translateY(-6px)}100%{transform:rotateY(360deg) translateY(0)}}' +
      '@keyframes casinoMarquee{0%{background-position:0 0}100%{background-position:120px 0}}' +
      '@keyframes casinoCardIn{0%{opacity:0;transform:translateY(28px) scale(.92)}100%{opacity:1;transform:none}}' +
      '@keyframes casinoTitleBoom{0%{opacity:0;transform:scale(.6) rotate(-4deg)}60%{opacity:1;transform:scale(1.08) rotate(1deg)}100%{transform:scale(1) rotate(0)}}' +
      '@keyframes casinoLightSweep{0%{transform:translateX(-120%) rotate(12deg)}100%{transform:translateX(220%) rotate(12deg)}}' +
      '@keyframes casinoFloorDrift{0%{background-position:0 0,0 0}100%{background-position:80px 40px,40px 80px}}' +
      '@keyframes casinoSpark{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}' +
      '@keyframes casinoCtaPulse{0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,.0),4px 4px 0 #000}50%{box-shadow:0 0 0 10px rgba(250,204,21,.18),4px 4px 0 #000}}' +
      '.inf-casino{position:fixed;inset:0;z-index:2398;display:none;flex-direction:column;background:#07040f;color:#fff;font-family:system-ui,Segoe UI,sans-serif;overflow:hidden}' +
      '.inf-casino.is-open{display:flex}' +
      '.inf-casino-bg{position:absolute;inset:0;background:' +
      'radial-gradient(ellipse at 20% 10%,rgba(250,204,21,.18),transparent 45%),' +
      'radial-gradient(ellipse at 80% 20%,rgba(244,114,182,.16),transparent 40%),' +
      'radial-gradient(ellipse at 50% 100%,rgba(34,211,238,.12),transparent 50%),' +
      'linear-gradient(180deg,#1a0a14 0%,#0a0612 40%,#050308 100%);' +
      'background-size:auto,auto,auto,auto}' +
      '.inf-casino-bg:before{content:"";position:absolute;inset:0;opacity:.35;background-image:linear-gradient(rgba(250,204,21,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(244,114,182,.05) 1px,transparent 1px);background-size:28px 28px;animation:casinoFloorDrift 18s linear infinite}' +
      '.inf-casino-bg:after{content:"";position:absolute;top:-20%;left:0;width:40%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);animation:casinoLightSweep 4.5s ease-in-out infinite}' +
      '.inf-casino-top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:max(10px,env(safe-area-inset-top)) 14px 8px;gap:10px}' +
      '.inf-casino-brand{font-family:Bungee,cursive;font-size:clamp(16px,4.5vw,28px);letter-spacing:.04em;color:#fde047;animation:casinoNeonPulse 2.4s ease-in-out infinite}' +
      '.inf-casino-mantra{font-family:"Press Start 2P",monospace;font-size:7px;color:#67e8f9;letter-spacing:.08em;opacity:.95}' +
      '.inf-casino-close{border:2px solid #fde047;background:#111;color:#fde047;border-radius:10px;padding:8px 12px;font-weight:900;font-size:12px;cursor:pointer;box-shadow:3px 3px 0 #000}' +
      '.inf-casino-scroll{position:relative;z-index:2;flex:1;overflow:auto;padding:8px 14px max(18px,env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}' +
      '.inf-casino-lead{text-align:center;margin:4px 0 14px}' +
      '.inf-casino-lead h2{margin:0 0 6px;font-family:Bungee,cursive;font-size:clamp(18px,5vw,32px);color:#fff;text-shadow:0 0 18px rgba(250,204,21,.45)}' +
      '.inf-casino-lead p{margin:0;font-size:13px;color:#e2e8f0;line-height:1.45;max-width:34rem;margin-inline:auto}' +
      '.inf-casino-marquee{height:28px;margin:0 0 14px;border-radius:999px;border:2px solid rgba(250,204,21,.55);background:repeating-linear-gradient(90deg,#111 0 12px,#1f2937 12px 24px);background-size:120px 100%;animation:casinoMarquee 1.2s linear infinite;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
      '.inf-casino-marquee span{font-family:"Press Start 2P",monospace;font-size:8px;color:#fde68a;white-space:nowrap}' +
      '.inf-casino-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;max-width:920px;margin:0 auto}' +
      '.inf-casino-card{position:relative;border:3px solid var(--c-accent,#fde047);border-radius:18px;padding:14px 12px 12px;background:linear-gradient(165deg,rgba(15,10,20,.95),rgba(8,6,14,.98));box-shadow:4px 4px 0 #000,0 0 22px color-mix(in srgb, var(--c-glow,#fde047) 35%, transparent);cursor:pointer;text-align:center;animation:casinoCardIn .5s cubic-bezier(.2,.8,.2,1) both;min-height:168px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:transform .15s ease}' +
      '.inf-casino-card:nth-child(1){animation-delay:.02s}.inf-casino-card:nth-child(2){animation-delay:.05s}' +
      '.inf-casino-card:nth-child(3){animation-delay:.08s}.inf-casino-card:nth-child(4){animation-delay:.11s}' +
      '.inf-casino-card:nth-child(5){animation-delay:.14s}.inf-casino-card:nth-child(6){animation-delay:.17s}' +
      '.inf-casino-card:nth-child(7){animation-delay:.2s}.inf-casino-card:nth-child(8){animation-delay:.23s}' +
      '.inf-casino-card:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #000}' +
      '.inf-casino-card .ico{font-size:28px;filter:drop-shadow(0 0 8px var(--c-accent));animation:casinoChipSpin 3.2s ease-in-out infinite}' +
      '.inf-casino-card .ttl{font-family:Bungee,cursive;font-size:14px;line-height:1.15;color:var(--c-accent);letter-spacing:.02em}' +
      '.inf-casino-card .sub{font-size:11px;color:#cbd5e1;line-height:1.35}' +
      '.inf-casino-card .stars{font-size:10px;color:#fde68a;font-weight:900}' +
      '.inf-casino-card .badge{position:absolute;top:-8px;right:-6px;background:#f43f5e;color:#fff;font-size:9px;font-weight:900;padding:4px 8px;border-radius:999px;border:2px solid #fff;box-shadow:2px 2px 0 #000;letter-spacing:.06em}' +
      '.inf-casino-hud{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 12px}' +
      '.inf-casino-hud span{font-family:"Press Start 2P",monospace;font-size:7px;padding:8px 10px;border-radius:999px;background:#111;color:#fde68a;border:2px solid #fbbf24;box-shadow:2px 2px 0 #000}' +
      '.inf-casino-title{position:fixed;inset:0;z-index:2405;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}' +
      '.inf-casino-title.is-open{display:flex}' +
      '.inf-casino-title-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,var(--t-glow,#be123c) 0%,#050308 70%)}' +
      '.inf-casino-title-bg:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.15) 3px,rgba(0,0,0,.15) 6px);opacity:.5}' +
      '.inf-casino-title-panel{position:relative;z-index:1;width:min(420px,94vw);text-align:center;padding:28px 18px;border:4px solid var(--t-accent,#fde047);border-radius:22px;background:linear-gradient(180deg,rgba(10,8,16,.92),rgba(5,3,10,.96));box-shadow:0 0 40px color-mix(in srgb, var(--t-glow,#fde047) 45%, transparent),8px 8px 0 #000;animation:casinoTitleBoom .55s cubic-bezier(.2,.9,.2,1)}' +
      '.inf-casino-title-panel .spark{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;animation:casinoSpark 1s ease-in-out infinite}' +
      '.inf-casino-title-panel .ico{font-size:52px;margin-bottom:8px;filter:drop-shadow(0 0 16px var(--t-accent));animation:casinoChipSpin 2.4s ease-in-out infinite}' +
      '.inf-casino-title-panel h1{margin:0 0 8px;font-family:Bungee,cursive;font-size:clamp(26px,8vw,42px);line-height:1.05;color:var(--t-accent);animation:casinoNeonPulse 1.8s ease-in-out infinite}' +
      '.inf-casino-title-panel .tag{font-family:"Press Start 2P",monospace;font-size:8px;color:#e2e8f0;line-height:1.6;margin-bottom:10px}' +
      '.inf-casino-title-panel .lil{font-family:"Press Start 2P",monospace;font-size:7px;color:#67e8f9;margin-bottom:16px;letter-spacing:.06em}' +
      '.inf-casino-title-panel .cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:180px;padding:14px 18px;border:3px solid #111;border-radius:12px;background:linear-gradient(135deg,#fde047,#f59e0b);color:#111;font-family:Bungee,cursive;font-size:16px;cursor:pointer;box-shadow:4px 4px 0 #000;animation:casinoCtaPulse 1.6s ease-in-out infinite}' +
      '.inf-casino-title-panel .back{display:block;margin:14px auto 0;background:transparent;border:none;color:#94a3b8;font-weight:800;font-size:12px;cursor:pointer;text-decoration:underline}' +
      'body.inf-casino-lock{overflow:hidden;touch-action:none}';
    document.head.appendChild(st);
  }

  function hudHtml() {
    if (typeof arcadeHudHtml === 'function') return arcadeHudHtml(global.CURRENT_STUDENT || {});
    return '';
  }

  function ensureShell() {
    ensureStyles();
    var el = document.getElementById('inf-casino-floor');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'inf-casino-floor';
    el.className = 'inf-casino';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="inf-casino-bg" aria-hidden="true"></div>' +
      '<div class="inf-casino-top">' +
      '<div><div class="inf-casino-brand">INFINITY CASINO</div>' +
      '<div class="inf-casino-mantra">' +
      MANTRA +
      '</div></div>' +
      '<button type="button" class="inf-casino-close" onclick="closeInfinityCasinoFloor()">Cerrar</button>' +
      '</div>' +
      '<div class="inf-casino-scroll" id="inf-casino-scroll"></div>';
    document.body.appendChild(el);

    var title = document.createElement('div');
    title.id = 'inf-casino-title';
    title.className = 'inf-casino-title';
    title.innerHTML =
      '<div class="inf-casino-title-bg" id="inf-casino-title-bg"></div>' +
      '<div class="inf-casino-title-panel" id="inf-casino-title-panel"></div>';
    document.body.appendChild(title);
    return el;
  }

  function findGame(id) {
    for (var i = 0; i < FLOOR_GAMES.length; i++) {
      if (FLOOR_GAMES[i].id === id) return FLOOR_GAMES[i];
    }
    return null;
  }

  function renderFloor() {
    var scroll = document.getElementById('inf-casino-scroll');
    if (!scroll) return;
    // Prefer NEW performance games first
    var html =
      '<div class="inf-casino-lead">' +
      '<h2>ELEGÍ TU MESA</h2>' +
      '<p>Casino virtual Infinity — cada juego abre con su pantalla de inicio. En todos corre la idea: <strong>' +
      MANTRA +
      '</strong>.</p>' +
      '</div>' +
      '<div class="inf-casino-marquee"><span>★ NUEVOS · BOSS CALL · STAR · LISTEN · TONE · NEMESIS · SNAKE · DAILY BOSS ★</span></div>' +
      '<div class="inf-casino-hud">' +
      hudHtml() +
      '</div>' +
      '<div class="inf-casino-grid">';

    FLOOR_GAMES.forEach(function (g) {
      html +=
        '<button type="button" class="inf-casino-card" style="--c-accent:' +
        g.accent +
        ';--c-glow:' +
        g.glow +
        '" onclick="openInfinityCasinoTitle(\'' +
        g.id +
        '\')">' +
        (g.badge ? '<span class="badge">' + esc(g.badge) + '</span>' : '') +
        '<div class="ico">' +
        g.icon +
        '</div>' +
        '<div class="ttl">' +
        esc(g.title) +
        '</div>' +
        '<div class="stars">' +
        esc(g.stars) +
        '</div>' +
        '<div class="sub">' +
        esc(g.sub) +
        '</div>' +
        '</button>';
    });
    html += '</div>';
    scroll.innerHTML = html;
  }

  function openFloor() {
    if (typeof studentGamesOn === 'function' && !studentGamesOn(global.CURRENT_STUDENT)) {
      if (typeof showToast === 'function')
        showToast('Activá Jill, Modo Libre o Alice con tu trainer.', 'err');
      return;
    }
    // Close machine UX if open
    if (typeof closeInfinityArcadeMonitor === 'function') closeInfinityArcadeMonitor(true);
    var oldLobby = document.getElementById('inf-arcade-lobby');
    if (oldLobby) oldLobby.classList.remove('is-open');
    document.body.classList.remove('inf-arcade-lobby-lock');
    global._infArcadeLobbyOpen = false;

    ensureShell();
    renderFloor();
    var el = document.getElementById('inf-casino-floor');
    if (el) el.classList.add('is-open');
    document.body.classList.add('inf-casino-lock');
    global._infCasinoOpen = true;
  }

  function closeFloor() {
    closeTitle();
    var el = document.getElementById('inf-casino-floor');
    if (el) el.classList.remove('is-open');
    document.body.classList.remove('inf-casino-lock');
    global._infCasinoOpen = false;
    if (typeof closeInfinityArcadeLobby === 'function') {
      // also clear arcade lobby lock if any
      document.body.classList.remove('inf-arcade-lobby-lock');
      global._infArcadeLobbyOpen = false;
    }
  }

  function openTitle(gameId) {
    var g = findGame(gameId);
    if (!g) return;
    ensureShell();
    var wrap = document.getElementById('inf-casino-title');
    var bg = document.getElementById('inf-casino-title-bg');
    var panel = document.getElementById('inf-casino-title-panel');
    if (!wrap || !panel) return;
    if (bg) {
      bg.style.setProperty('--t-glow', g.glow);
      bg.style.setProperty('--t-accent', g.accent);
    }
    panel.style.setProperty('--t-accent', g.accent);
    panel.style.setProperty('--t-glow', g.glow);
    panel.innerHTML =
      '<span class="spark" style="left:12%;top:18%"></span>' +
      '<span class="spark" style="right:14%;top:22%;animation-delay:.2s"></span>' +
      '<span class="spark" style="left:20%;bottom:16%;animation-delay:.4s"></span>' +
      '<div class="ico">' +
      g.icon +
      '</div>' +
      '<h1>' +
      esc(g.title) +
      '</h1>' +
      '<div class="tag">' +
      esc(g.sub) +
      '</div>' +
      '<div class="lil">' +
      MANTRA +
      ' · para el pueblo</div>' +
      '<button type="button" class="cta" onclick="launchInfinityCasinoGame(\'' +
      g.id +
      '\')">JUGAR</button>' +
      '<button type="button" class="back" onclick="closeInfinityCasinoTitle()">← Volver al casino</button>';
    wrap.classList.add('is-open');
    global._infCasinoTitleGame = g.id;
  }

  function closeTitle() {
    var wrap = document.getElementById('inf-casino-title');
    if (wrap) wrap.classList.remove('is-open');
    global._infCasinoTitleGame = null;
  }

  function launchGame(gameId) {
    var g = findGame(gameId) || findGame(global._infCasinoTitleGame);
    if (!g) return;
    closeTitle();
    // Keep casino behind; open fullscreen play surface
    if (g.kind === 'rapid') {
      if (typeof infinityArcadePickRapid === 'function') infinityArcadePickRapid();
      else if (typeof portalOpenRapidDrill === 'function') portalOpenRapidDrill('foundations');
      return;
    }
    var mode = g.mode || g.id;
    if (typeof infinityArcadeStartMode === 'function') {
      infinityArcadeStartMode(mode);
      return;
    }
    if (typeof startArcadeMode === 'function') {
      if (typeof openInfinityArcadeFullscreen === 'function') {
        openInfinityArcadeFullscreen(g.title, MANTRA);
      }
      startArcadeMode(mode, 'inf-arcade-fs-body');
    }
  }

  // Public API
  global.openInfinityCasinoFloor = openFloor;
  global.closeInfinityCasinoFloor = closeFloor;
  global.openInfinityCasinoTitle = openTitle;
  global.closeInfinityCasinoTitle = closeTitle;
  global.launchInfinityCasinoGame = launchGame;
  global.INFINITY_CASINO_GAMES = FLOOR_GAMES;

  // Replace machine lobby entry point
  global.openInfinityArcadeLobby = function () {
    openFloor();
  };

  global.closeInfinityArcadeLobby = function () {
    closeFloor();
    try {
      var lobby = document.getElementById('inf-arcade-lobby');
      if (lobby) lobby.classList.remove('is-open');
      document.body.classList.remove('inf-arcade-lobby-lock');
      global._infArcadeLobbyOpen = false;
    } catch (e) {}
  };

  console.log('[Infinity Casino] floor ready', CACHE_BUST, FLOOR_GAMES.length, 'tables');
})(typeof window !== 'undefined' ? window : globalThis);
