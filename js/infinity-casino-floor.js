/**
 * Infinity Practice Hub — stylized gaming lobby + character title screens.
 * Based on games_complete.html concept, adapted to Infinity palette (navy/gold).
 * Warm, character-led — not cold SaaS.
 */
(function (global) {
  'use strict';

  var MANTRA = 'LINK · IDEA · LINK';
  var VER = '20260812hub10';

  /** Solo Rapid Drill + Knight's Quest */
  var GAMES = [
    {
      id: 'knight',
      kind: 'knight',
      title: "KNIGHT'S QUEST",
      sub: 'Caballero teutónico. Linkers bajo fuego. Fever mount.',
      badge: 'hot',
      badgeLabel: 'NUEVO',
      xp: '+60 XP',
      diff: 3,
      art: 'knight',
      featured: true,
      portrait: 'knight',
      char: {
        name: 'Teutonic Knight',
        role: 'Linker crusader',
        mood: 'En batalla',
        line: '"Slash the wrong word. Build the chain. Claim the XP."',
        color: '#E8C547'
      }
    },
    {
      id: 'rapid',
      kind: 'rapid',
      title: 'RAPID DRILL',
      sub: 'Kaboom · Foundations.',
      badge: '',
      badgeLabel: '',
      xp: '+30 XP',
      diff: 2,
      art: 'rapid',
      portrait: 'kaboom',
      char: {
        name: 'Kaboom',
        role: 'Rapid Jill',
        mood: 'Drill',
        line: '"Foundations fast. No fluff."',
        color: '#FBBF24'
      }
    }
  ];

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function findGame(id) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
    return null;
  }

  function diffPips(n) {
    var h = '<div class="hub-card-diff">';
    for (var i = 1; i <= 3; i++) {
      var cls = 'diff-pip';
      if (i <= n) cls += n >= 3 ? ' r' : n === 2 ? ' a' : ' g';
      h += '<i class="' + cls + '"></i>';
    }
    return h + '</div>';
  }

  function kaboomSvg() {
    return (
      '<svg class="hub-kaboom-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="hubBoomCore" cx="50%" cy="45%" r="55%">' +
      '<stop offset="0%" stop-color="#FEF08A"/><stop offset="55%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B91C1C"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<polygon fill="#7F1D1D" points="100,8 122,48 168,28 148,72 192,92 148,112 168,158 122,138 100,182 78,138 32,158 52,112 8,92 52,72 32,28 78,48"/>' +
      '<polygon fill="url(#hubBoomCore)" points="100,28 116,58 152,44 136,78 172,96 136,114 152,148 116,132 100,164 84,132 48,148 64,114 28,96 64,78 48,44 84,58"/>' +
      '<circle cx="100" cy="96" r="34" fill="#111827"/>' +
      '<ellipse cx="88" cy="84" rx="10" ry="7" fill="#fff" opacity=".35"/>' +
      '<path d="M100 62 C108 48 118 40 128 34" fill="none" stroke="#92400E" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="132" cy="30" r="10" fill="#EF4444"/>' +
      '<circle cx="132" cy="30" r="5" fill="#FDE047"/>' +
      '<text x="100" y="188" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="28" font-weight="900" fill="#FACC15" stroke="#111" stroke-width="3" paint-order="stroke">KA-BOOM</text>' +
      '<text x="168" y="168" font-family="Impact,Arial Black,sans-serif" font-size="36" font-weight="900" fill="#38BDF8" stroke="#111" stroke-width="3" paint-order="stroke">!</text>' +
      '</svg>'
    );
  }

  function portraitHtml(g, wrapClass) {
    var cls = wrapClass || 'hub-css-char';
    var kind = (g && (g.portrait || g.kind || g.id)) || '';
    if (kind === 'knight') {
      return (
        '<div class="' +
        cls +
        ' hub-portrait-knight">' +
        '<img src="games/knights-quest/assets/hub-knight.png" alt="" class="hub-knight-img" ' +
        'onerror="this.onerror=null;this.src=\'games/knights-quest/assets/icon.png\'">' +
        '</div>'
      );
    }
    if (kind === 'kaboom' || kind === 'rapid') {
      return '<div class="' + cls + ' hub-portrait-kaboom">' + kaboomSvg() + '</div>';
    }
    var key = (g && g.charKey) || 'lex';
    var inner =
      typeof infinityCharHtml === 'function'
        ? infinityCharHtml(key)
        : '<div class="hub-char-fallback" style="--char-c:' +
          esc((g.char && g.char.color) || '#F5A623') +
          '"></div>';
    return '<div class="' + cls + '">' + inner + '</div>';
  }

  function hudPills() {
    var meta =
      typeof arcadeGetMeta === 'function' ? arcadeGetMeta(global.CURRENT_STUDENT || {}) : null;
    if (!meta) {
      return (
        '<div class="pill pill-xp">XP —</div>' +
        '<div class="pill pill-streak">DAY —</div>' +
        '<div class="pill pill-day">COINS —</div>'
      );
    }
    return (
      '<div class="pill pill-xp">XP ' +
      esc(meta.lifetimeXp || 0) +
      '</div>' +
      '<div class="pill pill-streak">DAY ' +
      esc(meta.dayStreak || 0) +
      '</div>' +
      '<div class="pill pill-day">COINS ' +
      esc(meta.coins || 0) +
      '</div>'
    );
  }

  function ensureStyles() {
    var existing = document.getElementById('infinity-practice-hub-styles');
    if (existing && existing.getAttribute('data-ver') === VER) return;
    if (existing) existing.remove();
    if (!document.getElementById('infinity-hub-fonts')) {
      var link = document.createElement('link');
      link.id = 'infinity-hub-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    var st = document.createElement('style');
    st.id = 'infinity-practice-hub-styles';
    st.setAttribute('data-ver', VER);
    st.textContent =
      ':root{--inf-navy:#5B21B6;--inf-deep:#3B0E8C;--inf-gold:#F5A623;--inf-gold2:#FFD700;--inf-ink:#0B0618;--inf-surface:#140B28;--inf-text:#F8F5FF;--inf-mute:#B8A9D9;}' +
      '@keyframes hubFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
      '@keyframes hubPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,.35)}50%{box-shadow:0 0 0 12px rgba(245,166,35,0)}}' +
      '@keyframes hubCardIn{0%{opacity:0;transform:translateY(18px) scale(.96)}100%{opacity:1;transform:none}}' +
      '@keyframes hubShine{0%{transform:translateX(-130%) skewX(-12deg)}100%{transform:translateX(230%) skewX(-12deg)}}' +
      '@keyframes hubTitleIn{0%{opacity:0;transform:scale(.85) translateY(20px)}100%{opacity:1;transform:none}}' +
      '@keyframes hubCharBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
      '@keyframes hubAura{0%,100%{filter:drop-shadow(0 0 12px var(--char-c))}50%{filter:drop-shadow(0 0 28px var(--char-c))}}' +
      '.inf-hub{position:fixed;inset:0;z-index:2398;display:none;flex-direction:column;background:var(--inf-ink);color:var(--inf-text);font-family:Outfit,system-ui,sans-serif;overflow:hidden}' +
      '.inf-hub.is-open{display:flex}' +
      '.inf-hub-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 15% 0%,rgba(91,33,182,.45),transparent 50%),radial-gradient(ellipse at 85% 10%,rgba(245,166,35,.2),transparent 45%),linear-gradient(180deg,#1a0a3a 0%,#0B0618 55%,#070412 100%)}' +
      '.inf-hub-bg:before{content:"";position:absolute;inset:0;opacity:.4;background-image:radial-gradient(1.5px 1.5px at 10% 20%,#fff,transparent),radial-gradient(1px 1px at 30% 8%,#F5A623,transparent),radial-gradient(1px 1px at 70% 15%,#C084FC,transparent),radial-gradient(1.5px 1.5px at 88% 28%,#fff,transparent);animation:hubFloat 8s ease-in-out infinite}' +
      '.inf-hub-top{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:max(10px,env(safe-area-inset-top)) 16px 10px;border-bottom:1px solid rgba(245,166,35,.22);background:rgba(11,6,24,.88);backdrop-filter:blur(12px)}' +
      '.inf-hub-logo{font-family:"Bebas Neue",sans-serif;font-size:clamp(22px,5vw,30px);letter-spacing:.06em;color:#fff}' +
      '.inf-hub-logo span{color:var(--inf-gold)}' +
      '.inf-hub-pills{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}' +
      '.inf-hub .pill{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800}' +
      '.pill-xp{background:rgba(91,33,182,.35);border:1px solid rgba(192,132,252,.45);color:#E9D5FF}' +
      '.pill-streak{background:rgba(245,166,35,.15);border:1px solid rgba(245,166,35,.4);color:#FBBF24}' +
      '.pill-day{background:rgba(34,197,94,.12);border:1px solid rgba(74,222,128,.35);color:#86EFAC}' +
      '.inf-hub-close{border:2px solid var(--inf-gold);background:#1a0a3a;color:var(--inf-gold);border-radius:10px;padding:7px 12px;font-weight:800;font-size:12px;cursor:pointer}' +
      '.inf-hub-scroll{position:relative;z-index:2;flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:16px 16px max(20px,env(safe-area-inset-bottom))}' +
      '.inf-hub-mantra{text-align:center;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--inf-gold);margin:0 0 12px;opacity:.95}' +
      '.hub-featured{position:relative;border-radius:18px;overflow:hidden;margin-bottom:18px;height:min(200px,32vh);cursor:pointer;border:2px solid rgba(245,166,35,.45);box-shadow:0 12px 36px rgba(59,14,140,.45),0 0 0 1px rgba(255,255,255,.06);background:linear-gradient(125deg,#3B0E8C 0%,#5B21B6 40%,#7C3AED 70%,#B45309 100%);animation:hubPulse 2.8s ease-in-out infinite}' +
      '.hub-featured.art-knight{background:linear-gradient(125deg,#1a0508 0%,#7f1d1d 35%,#ea580c 70%,#fbbf24 100%);border-color:rgba(251,191,36,.55)}' +
      '.hub-featured.art-rapid{background:linear-gradient(125deg,#FFE8C8 0%,#FDBA74 40%,#9a3412 100%);border-color:rgba(251,191,36,.45)}' +
      '.hub-featured:active{transform:scale(.99)}' +
      '.hub-featured-shine{position:absolute;inset:0;overflow:hidden;pointer-events:none}' +
      '.hub-featured-shine:after{content:"";position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:hubShine 3.2s ease-in-out infinite}' +
      '.hub-featured-char{position:absolute;right:8%;top:50%;transform:translateY(-55%);animation:hubCharBob 2.6s ease-in-out infinite;filter:drop-shadow(0 8px 20px rgba(0,0,0,.45));transform-origin:center}' +
      '.hub-featured-char .inf-char,.hub-featured-char .inf-plane{transform:scale(1.55)}' +
      '.hub-char-fallback{width:56px;height:56px;border-radius:16px;background:linear-gradient(145deg,var(--char-c,#F5A623),#5B21B6);border:2px solid rgba(255,255,255,.35);box-shadow:0 8px 20px rgba(0,0,0,.35)}' +
      '.hub-card-art .hub-css-char{position:absolute;top:14%;left:50%;transform:translateX(-50%) scale(1.05);animation:hubAura 2.4s ease-in-out infinite;--char-c:#F5A623}' +
      '.hub-title-char-css{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(1.7);animation:hubCharBob 2.2s ease-in-out infinite}' +
      '.hub-featured-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,6,24,.92) 0%,rgba(11,6,24,.2) 55%,transparent 100%)}' +
      '.hub-featured-content{position:absolute;left:0;right:0;bottom:0;padding:18px 20px;z-index:2}' +
      '.hub-featured-badge{display:inline-block;background:var(--inf-gold);color:#1a1200;font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:4px;margin-bottom:8px}' +
      '.hub-featured-title{font-family:"Bebas Neue",sans-serif;font-size:clamp(32px,8vw,46px);letter-spacing:.04em;line-height:1;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.5)}' +
      '.hub-featured-sub{font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;font-weight:600}' +
      '.hub-featured-char-name{font-size:12px;font-weight:800;color:var(--inf-gold);margin-top:6px}' +
      '.hub-grid-title{font-family:"Bebas Neue",sans-serif;font-size:18px;letter-spacing:.08em;color:var(--inf-mute);margin:4px 0 12px}' +
      '.hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;max-width:960px;margin:0 auto}' +
      '.hub-card{border-radius:16px;overflow:hidden;cursor:pointer;aspect-ratio:3/4;position:relative;border:2px solid rgba(255,255,255,.08);animation:hubCardIn .45s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .15s,border-color .15s}' +
      '.hub-card:nth-child(1){animation-delay:.03s}.hub-card:nth-child(2){animation-delay:.06s}.hub-card:nth-child(3){animation-delay:.09s}.hub-card:nth-child(4){animation-delay:.12s}' +
      '.hub-card:active{transform:translateY(2px) scale(.98)}' +
      '.hub-card-art{position:absolute;inset:0}' +
      '.hub-portrait-knight,.hub-portrait-kaboom{position:absolute;inset:8% 6% 28%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1}' +
      '.hub-knight-img{width:100%;height:100%;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 10px 18px rgba(0,0,0,.55));animation:hubCharBob 2.4s ease-in-out infinite}' +
      '.hub-kaboom-svg{width:88%;height:88%;max-width:180px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.4));animation:hubCharBob 2.2s ease-in-out infinite}' +
      '.hub-featured-char.hub-portrait-knight,.hub-featured-char.hub-portrait-kaboom{inset:auto;right:4%;top:8%;width:42%;height:78%;transform:none}' +
      '.hub-featured-char .hub-knight-img,.hub-featured-char .hub-kaboom-svg{width:100%;height:100%}' +
      '.hub-title-char-css.hub-portrait-knight,.hub-title-char-css.hub-portrait-kaboom{position:absolute;left:50%;top:46%;width:70%;height:70%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center}' +
      '.hub-title-char-css .hub-knight-img,.hub-title-char-css .hub-kaboom-svg{width:100%;height:100%;max-height:180px}' +
      '.hub-card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,6,24,.95) 0%,rgba(11,6,24,.35) 50%,transparent 100%)}' +
      '.hub-card-body{position:absolute;bottom:0;left:0;right:0;padding:12px 10px;z-index:2}' +
      '.hub-card-title{font-family:"Bebas Neue",sans-serif;font-size:22px;letter-spacing:.04em;line-height:1;margin-bottom:3px}' +
      '.hub-card-sub{font-size:11px;color:rgba(255,255,255,.6);margin-bottom:8px;line-height:1.35;font-weight:600}' +
      '.hub-card-footer{display:flex;align-items:center;justify-content:space-between}' +
      '.hub-card-diff{display:flex;gap:3px}' +
      '.diff-pip{width:14px;height:3px;border-radius:2px;background:rgba(255,255,255,.15);display:block}' +
      '.diff-pip.g{background:#22C55E}.diff-pip.a{background:#F5A623}.diff-pip.r{background:#EF4444}' +
      '.hub-card-xp{font-size:10px;font-weight:800;color:rgba(255,255,255,.85)}' +
      '.hub-card-badge{position:absolute;top:8px;left:8px;z-index:3;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;padding:3px 7px;border-radius:4px}' +
      '.b-new{background:var(--inf-navy);color:#fff;border:1px solid rgba(245,166,35,.5)}' +
      '.b-hot{background:#EF4444;color:#fff}' +
      '.b-today{background:var(--inf-gold);color:#1a1200}' +
      '.art-boss{background:linear-gradient(170deg,#2a0a18,#5B21B6 55%,#9f1239)}' +
      '.art-star{background:linear-gradient(180deg,#1a0a3a,#3B0E8C,#B45309)}' +
      '.art-listen{background:linear-gradient(160deg,#0c1a3a,#1e3a5f,#0891b2)}' +
      '.art-tone{background:linear-gradient(160deg,#0a2418,#14532d,#3B0E8C)}' +
      '.art-nemesis{background:linear-gradient(180deg,#1a0508,#3B0E8C,#7f1d1d)}' +
      '.art-snake{background:linear-gradient(165deg,#1a0a2e 0%,#7c2d12 40%,#b45309 70%,#f59e0b)}' +
      '.art-drop{background:linear-gradient(165deg,#0f172a,#1e3a8a 45%,#5B21B6,#b45309)}' +
      '.art-phrasal{background:linear-gradient(160deg,#0b1430,#1e3a8a,#5B21B6)}' +
      '.art-daily{background:linear-gradient(160deg,#2a1800,#5B21B6,#B45309)}' +
      '.art-frenzy{background:linear-gradient(160deg,#2a0a00,#7c2d12,#5B21B6)}' +
      '.art-challenge{background:linear-gradient(160deg,#2a1808,#5B21B6,#F5A623)}' +
      '.art-verb{background:linear-gradient(160deg,#042f2e,#0f766e,#5B21B6)}' +
      '.art-structure{background:linear-gradient(160deg,#1e1b4b,#5B21B6,#7C3AED)}' +
      '.art-linker{background:linear-gradient(160deg,#1e103a,#5B21B6,#6d28d9)}' +
      '.art-prep{background:linear-gradient(160deg,#2a1508,#9a3412,#5B21B6)}' +
      '.art-rapid{background:linear-gradient(165deg,#FFE8C8 0%,#FDBA74 35%,#7C2D12 78%,#1c0a08 100%)}' +
      '.art-knight{background:linear-gradient(165deg,#1a0508 0%,#7f1d1d 40%,#ea580c 70%,#fbbf24 100%)}' +
      /* Title / character splash */
      '.inf-hub-title{position:fixed;inset:0;z-index:2406;display:none;align-items:stretch;justify-content:center;padding:0;box-sizing:border-box}' +
      '.inf-hub-title.is-open{display:flex}' +
      '.inf-hub-title-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 20%,color-mix(in srgb,var(--t-c,#F5A623) 35%,#3B0E8C),#0B0618 70%)}' +
      '.inf-hub-title-panel{position:relative;z-index:1;width:min(440px,100%);margin:auto;padding:max(16px,env(safe-area-inset-top)) 18px max(20px,env(safe-area-inset-bottom));text-align:center;animation:hubTitleIn .5s cubic-bezier(.2,.85,.2,1)}' +
      '.hub-char-stage{position:relative;margin:0 auto 14px;width:min(280px,80vw);height:200px;border-radius:24px;border:3px solid var(--inf-gold);background:linear-gradient(165deg,rgba(91,33,182,.55),rgba(11,6,24,.9));box-shadow:0 0 40px rgba(245,166,35,.25),0 16px 40px rgba(0,0,0,.45);overflow:hidden}' +
      '.hub-char-stage:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.12),transparent 55%)}' +
      '.hub-char-face{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:88px;animation:hubCharBob 2.2s ease-in-out infinite;filter:drop-shadow(0 10px 20px rgba(0,0,0,.4));--char-c:var(--t-c,#F5A623)}' +
      '.hub-char-plate{position:absolute;left:12px;right:12px;bottom:10px;background:rgba(11,6,24,.88);border:1px solid rgba(245,166,35,.35);border-radius:12px;padding:8px 10px;text-align:left}' +
      '.hub-char-plate .nm{font-family:"Bebas Neue",sans-serif;font-size:20px;letter-spacing:.04em;color:var(--inf-gold);line-height:1}' +
      '.hub-char-plate .rl{font-size:11px;font-weight:700;color:rgba(255,255,255,.7)}' +
      '.hub-title-h{font-family:"Bebas Neue",sans-serif;font-size:clamp(36px,10vw,52px);letter-spacing:.04em;line-height:1;margin:0 0 6px;color:#fff;text-shadow:0 0 24px rgba(245,166,35,.35)}' +
      '.hub-title-mood{font-size:13px;font-weight:800;color:var(--t-c,#F5A623);margin-bottom:8px}' +
      '.hub-title-line{font-size:14px;font-weight:600;line-height:1.45;color:rgba(255,255,255,.85);font-style:italic;background:rgba(91,33,182,.35);border-left:3px solid var(--inf-gold);padding:10px 12px;border-radius:0 12px 12px 0;text-align:left;margin:0 0 12px}' +
      '.hub-title-lil{font-size:11px;font-weight:800;letter-spacing:.12em;color:#C4B5FD;margin-bottom:16px}' +
      '.hub-title-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:200px;padding:14px 22px;border:none;border-radius:14px;background:linear-gradient(135deg,#FFD700,#F5A623);color:#1a1200;font-family:"Bebas Neue",sans-serif;font-size:22px;letter-spacing:.06em;cursor:pointer;box-shadow:0 8px 28px rgba(245,166,35,.4);animation:hubPulse 1.8s ease-in-out infinite}' +
      '.hub-title-back{display:block;margin:14px auto 0;background:transparent;border:none;color:var(--inf-mute);font-weight:700;font-size:13px;cursor:pointer;text-decoration:underline}' +
      'body.inf-hub-lock{overflow:hidden;touch-action:none}';
    document.head.appendChild(st);
  }

  function cardHtml(g) {
    var badge = g.badge
      ? '<span class="hub-card-badge b-' + g.badge + '">' + esc(g.badgeLabel) + '</span>'
      : '';
    return (
      '<button type="button" class="hub-card" onclick="openInfinityCasinoTitle(\'' +
      g.id +
      '\')">' +
      badge +
      '<div class="hub-card-art art-' +
      g.art +
      '" style="--char-c:' +
      esc((g.char && g.char.color) || '#F5A623') +
      '">' +
      portraitHtml(g, 'hub-css-char') +
      '</div>' +
      '<div class="hub-card-overlay"></div>' +
      '<div class="hub-card-body">' +
      '<div class="hub-card-title">' +
      esc(g.title) +
      '</div>' +
      '<div class="hub-card-sub">' +
      esc(g.sub) +
      '</div>' +
      '<div class="hub-card-footer">' +
      diffPips(g.diff || 1) +
      '<span class="hub-card-xp">' +
      esc(g.xp || '') +
      '</span>' +
      '</div></div></button>'
    );
  }

  function renderHub() {
    var scroll = document.getElementById('inf-hub-scroll');
    if (!scroll) return;
    var featured = null;
    for (var i = 0; i < GAMES.length; i++) {
      if (GAMES[i].featured) {
        featured = GAMES[i];
        break;
      }
    }
    if (!featured) featured = GAMES[0];

    var html =
      '<div class="inf-hub-mantra">' +
      MANTRA +
      ' · PARA EL PUEBLO</div>' +
      '<div class="hub-featured art-' +
      (featured.art || '') +
      '" onclick="openInfinityCasinoTitle(\'' +
      featured.id +
      '\')">' +
      '<div class="hub-featured-shine"></div>' +
      portraitHtml(featured, 'hub-featured-char') +
      '<div class="hub-featured-overlay"></div>' +
      '<div class="hub-featured-content">' +
      '<div class="hub-featured-badge">DESTACADO · PERFORMANCE</div>' +
      '<div class="hub-featured-title">' +
      esc(featured.title) +
      '</div>' +
      '<div class="hub-featured-sub">' +
      esc(featured.sub) +
      '</div>' +
      '<div class="hub-featured-char-name">' +
      esc(featured.char ? featured.char.name + ' — ' + featured.char.role : '') +
      '</div>' +
      '</div></div>' +
      '<div class="hub-grid-title">ELEGÍ TU PARTIDA</div>' +
      '<div class="hub-grid">';

    GAMES.forEach(function (g) {
      html += cardHtml(g);
    });
    html += '</div>';
    scroll.innerHTML = html;
  }

  function ensureShell() {
    ensureStyles();
    var el = document.getElementById('inf-casino-floor');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inf-casino-floor';
      el.className = 'inf-hub';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.innerHTML =
        '<div class="inf-hub-bg" aria-hidden="true"></div>' +
        '<div class="inf-hub-top">' +
        '<div class="inf-hub-logo">INFINITY <span>HUB</span></div>' +
        '<div class="inf-hub-pills" id="inf-hub-pills"></div>' +
        '<button type="button" class="inf-hub-close" onclick="closeInfinityCasinoFloor()">Cerrar</button>' +
        '</div>' +
        '<div class="inf-hub-scroll" id="inf-hub-scroll"></div>';
      document.body.appendChild(el);
    } else {
      el.className = 'inf-hub' + (el.classList.contains('is-open') ? ' is-open' : '');
    }

    if (!document.getElementById('inf-casino-title')) {
      var title = document.createElement('div');
      title.id = 'inf-casino-title';
      title.className = 'inf-hub-title';
      title.innerHTML =
        '<div class="inf-hub-title-bg" id="inf-casino-title-bg"></div>' +
        '<div class="inf-hub-title-panel" id="inf-casino-title-panel"></div>';
      document.body.appendChild(title);
    } else {
      document.getElementById('inf-casino-title').className = 'inf-hub-title';
    }
    return el;
  }

  function openFloor() {
    if (typeof studentGamesOn === 'function' && !studentGamesOn(global.CURRENT_STUDENT)) {
      if (typeof showToast === 'function')
        showToast('Activá Jill, Modo Libre o Alice con tu trainer.', 'err');
      return;
    }
    if (typeof closeInfinityArcadeMonitor === 'function') closeInfinityArcadeMonitor(true);
    var oldLobby = document.getElementById('inf-arcade-lobby');
    if (oldLobby) oldLobby.classList.remove('is-open');
    document.body.classList.remove('inf-arcade-lobby-lock');
    global._infArcadeLobbyOpen = false;

    ensureShell();
    if (typeof infinityCharHtml === 'function') infinityCharHtml('plane');
    var pills = document.getElementById('inf-hub-pills');
    if (pills) pills.innerHTML = hudPills();
    renderHub();
    var el = document.getElementById('inf-casino-floor');
    if (el) {
      el.className = 'inf-hub is-open';
    }
    document.body.classList.add('inf-hub-lock');
    global._infCasinoOpen = true;
  }

  function closeFloor() {
    closeTitle();
    var el = document.getElementById('inf-casino-floor');
    if (el) el.classList.remove('is-open');
    document.body.classList.remove('inf-hub-lock');
    document.body.classList.remove('inf-casino-lock');
    global._infCasinoOpen = false;
    global._infArcadeLobbyOpen = false;
  }

  function openTitle(gameId) {
    var g = findGame(gameId);
    if (!g) return;
    ensureShell();
    var wrap = document.getElementById('inf-casino-title');
    var bg = document.getElementById('inf-casino-title-bg');
    var panel = document.getElementById('inf-casino-title-panel');
    if (!wrap || !panel) return;
    var c = g.char || {
      name: g.title,
      role: 'Coach',
      mood: '',
      line: MANTRA,
      color: '#F5A623'
    };
    if (bg) bg.style.setProperty('--t-c', c.color);
    panel.style.setProperty('--t-c', c.color);
    panel.className = 'inf-hub-title-panel';
    panel.innerHTML =
      '<div class="hub-char-stage">' +
      portraitHtml(g, 'hub-title-char-css') +
      '<div class="hub-char-plate"><div class="nm">' +
      esc(c.name) +
      '</div><div class="rl">' +
      esc(c.role) +
      '</div></div>' +
      '</div>' +
      '<h1 class="hub-title-h">' +
      esc(g.title) +
      '</h1>' +
      '<div class="hub-title-mood">' +
      esc(c.mood) +
      '</div>' +
      '<div class="hub-title-line">' +
      esc(c.line) +
      '</div>' +
      '<div class="hub-title-lil">' +
      MANTRA +
      '</div>' +
      '<button type="button" class="hub-title-cta" onclick="launchInfinityCasinoGame(\'' +
      g.id +
      '\')">JUGAR</button>' +
      '<button type="button" class="hub-title-back" onclick="closeInfinityCasinoTitle()">← Volver al hub</button>';
    wrap.className = 'inf-hub-title is-open';
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
    if (g.kind === 'rapid') {
      if (typeof infinityArcadePickRapid === 'function') infinityArcadePickRapid();
      else if (typeof portalOpenRapidDrill === 'function') portalOpenRapidDrill('foundations');
      return;
    }
    if (g.kind === 'knight') {
      if (typeof openInfinityArcadeFullscreen === 'function') {
        openInfinityArcadeFullscreen("Knight's Quest", 'Pantalla completa · Teutonic');
      }
      var fsShell = document.getElementById('inf-arcade-fs');
      if (fsShell) fsShell.classList.add('is-knight-mode');
      var body = document.getElementById('inf-arcade-fs-body');
      if (body) {
        body.classList.add('is-knight-fit');
        body.innerHTML =
          '<iframe src="games/knights-quest/index.html?v=' +
          VER +
          '" title="Knight\'s Quest" class="inf-knight-frame" allow="autoplay; fullscreen" allowfullscreen></iframe>';
      }
      if (typeof infinityArcadeRequestBrowserFullscreen === 'function') {
        infinityArcadeRequestBrowserFullscreen(fsShell);
      }
      return;
    }
    var fsBodyClear = document.getElementById('inf-arcade-fs-body');
    if (fsBodyClear) fsBodyClear.classList.remove('is-knight-fit');
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

  global.openInfinityCasinoFloor = openFloor;
  global.closeInfinityCasinoFloor = closeFloor;
  global.openInfinityCasinoTitle = openTitle;
  global.closeInfinityCasinoTitle = closeTitle;
  global.launchInfinityCasinoGame = launchGame;
  global.INFINITY_CASINO_GAMES = GAMES;

  global.openInfinityArcadeLobby = function () {
    openFloor();
  };
  global.closeInfinityArcadeLobby = function () {
    closeFloor();
  };

  window.addEventListener('message', function (ev) {
    var data = ev && ev.data;
    if (!data || data.type !== 'knight-request-fullscreen') return;
    if (typeof infinityArcadeRequestBrowserFullscreen === 'function') {
      infinityArcadeRequestBrowserFullscreen(document.getElementById('inf-arcade-fs'));
    }
  });
  function notifyKnightFs() {
    var frame = document.querySelector('.inf-knight-frame');
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'knight-fs-changed' }, '*');
    } catch (e) {}
  }
  document.addEventListener('fullscreenchange', notifyKnightFs);
  document.addEventListener('webkitfullscreenchange', notifyKnightFs);

  console.log('[Infinity Hub]', VER, GAMES.length, 'games characters ready');
})(typeof window !== 'undefined' ? window : globalThis);
