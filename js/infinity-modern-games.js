/**
 * Infinity Modern Games — themed stages (no handheld, no emoji).
 * Linker Snake = Egypt serpent · Linker Flight = plane · each mode has its own ambient FX.
 */
(function (global) {
  'use strict';

  var MANTRA = 'LINK · IDEA · LINK';
  var MODERN = {
    bosscall: 1,
    star: 1,
    listen: 1,
    tone: 1,
    nemesis: 1,
    snake: 1,
    phrasalswap: 1,
    dailyboss: 1,
    linkerflight: 1,
    tenserdrop: 1
  };

  function isModern(mode) {
    return !!(mode && MODERN[mode]);
  }

  function esc(s) {
    if (typeof arcadeEsc === 'function') return arcadeEsc(s);
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Pure CSS/SVG characters — no emoji */
  var CHARS = {
    irina:
      '<div class="inf-char inf-char-irina" aria-hidden="true"><div class="hair"></div><div class="face"><i class="eye l"></i><i class="eye r"></i><i class="brow l"></i><i class="brow r"></i><i class="mouth mad"></i></div><div class="torso"></div></div>',
    lex:
      '<div class="inf-char inf-char-lex" aria-hidden="true"><div class="hair"></div><div class="face"><i class="eye l"></i><i class="eye r"></i><i class="glasses"></i><i class="mouth calm"></i></div><div class="torso suit"></div></div>',
    nova:
      '<div class="inf-char inf-char-nova" aria-hidden="true"><div class="phones"></div><div class="face"><i class="eye l"></i><i class="eye r"></i><i class="mouth smile"></i></div><div class="torso neon"></div></div>',
    mira:
      '<div class="inf-char inf-char-mira" aria-hidden="true"><div class="hair soft"></div><div class="face"><i class="eye l"></i><i class="eye r"></i><i class="mouth soft"></i></div><div class="torso soft"></div></div>',
    shadow:
      '<div class="inf-char inf-char-shadow" aria-hidden="true"><div class="hood"></div><div class="face dark"><i class="eye l"></i><i class="eye r"></i><i class="mouth flat"></i></div></div>',
    plane:
      '<div class="inf-plane" aria-hidden="true">' +
      '<svg class="inf-plane-svg" viewBox="0 0 160 72" width="148" height="66" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="infFus" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#991B1B"/><stop offset="40%" stop-color="#EF4444"/><stop offset="100%" stop-color="#F5A623"/></linearGradient>' +
      '<linearGradient id="infWing" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FEF08A"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>' +
      '<linearGradient id="infSmoke" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#cbd5e1" stop-opacity=".95"/><stop offset="100%" stop-color="#64748b" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<g opacity=".7"><ellipse cx="16" cy="34" rx="18" ry="6" fill="url(#infSmoke)"/><ellipse cx="6" cy="40" rx="11" ry="4.5" fill="#64748b" opacity=".45"/></g>' +
      '<path d="M44 20 L27 4 L36 22 Z" fill="#DC2626"/><path d="M44 50 L27 66 L36 48 Z" fill="#B91C1C"/>' +
      '<rect x="34" y="27" width="16" height="16" rx="3" fill="#7F1D1D"/>' +
      '<ellipse cx="90" cy="35" rx="48" ry="12" fill="url(#infFus)"/>' +
      '<ellipse cx="112" cy="31" rx="11" ry="7.5" fill="#7F1D1D"/><ellipse cx="114" cy="30" rx="5.5" ry="4" fill="#67E8F9" opacity=".9"/>' +
      '<rect x="58" y="16" width="56" height="8" rx="3" fill="url(#infWing)" transform="skewX(-10)"/>' +
      '<rect x="62" y="44" width="50" height="7" rx="3" fill="#FBBF24" transform="skewX(-10)"/>' +
      '<circle cx="78" cy="20" r="2.4" fill="#fff" opacity=".75"/><circle cx="92" cy="20" r="2.4" fill="#fff" opacity=".75"/>' +
      '<g class="prop"><rect x="136" y="22" width="7" height="26" rx="3.5" fill="#F8FAFC"/><rect x="131" y="32" width="20" height="6" rx="2.5" fill="#E2E8F0"/></g>' +
      '<path d="M50 28 L40 16 L46 34 L40 52 L50 42 Z" fill="#F5A623"/><circle cx="74" cy="35" r="3.2" fill="#FDE047" stroke="#B45309" stroke-width="1"/>' +
      '</svg><i class="flame"></i></div>',
    queen:
      '<div class="inf-char inf-char-queen" aria-hidden="true"><div class="crown"></div><div class="hair gold"></div><div class="face"><i class="eye l"></i><i class="eye r"></i><i class="mouth smile"></i></div><div class="torso gold"></div></div>',
    asp:
      '<div class="inf-asp-char" aria-hidden="true"><div class="asp-hood"></div><div class="asp-head"><i class="eye l"></i><i class="eye r"></i><i class="gem"></i></div><div class="asp-body"><i></i><i></i><i></i></div></div>'
  };

  var MODE_THEME = {
    bosscall: {
      char: 'irina',
      name: 'Irina',
      role: 'Cliente',
      accent: '#FB7185',
      sky: 'boss',
      clear: 'CALL SAVED',
      hit: 'Tono firme — cliente contenido',
      miss: 'Irina sigue en fuego — rearmá'
    },
    dailyboss: {
      char: 'queen',
      name: 'Queen Day',
      role: 'Boss del día',
      accent: '#F5A623',
      sky: 'boss',
      clear: 'CROWN CLAIMED',
      hit: 'Boss del día dominado',
      miss: 'La corona espera — otra vez'
    },
    star: {
      char: 'lex',
      name: 'Coach Lex',
      role: 'Entrevistador',
      accent: '#F5A623',
      sky: 'arena',
      clear: 'STAR CLEAR',
      hit: 'Historia STAR conectada',
      miss: 'Spotlight off — reordená'
    },
    listen: {
      char: 'nova',
      name: 'DJ Nova',
      role: 'Audio coach',
      accent: '#22D3EE',
      sky: 'listen',
      clear: 'SIGNAL LOCKED',
      hit: 'Oíste el linker',
      miss: 'Señal perdida — replay'
    },
    tone: {
      char: 'mira',
      name: 'Mira Soft',
      role: 'Tone guardian',
      accent: '#4ADE80',
      sky: 'tone',
      clear: 'TONE ELEVATED',
      hit: 'Tono que eleva',
      miss: 'Demasiado frío / agresivo'
    },
    nemesis: {
      char: 'shadow',
      name: 'Shadow You',
      role: 'Tu fallo',
      accent: '#F87171',
      sky: 'nemesis',
      clear: 'SHADOW DOWN',
      hit: 'Espejo roto — vos ganás',
      miss: 'Tu sombra te ganó'
    },
    snake: {
      char: 'asp',
      name: 'Aspira',
      role: 'Serpiente del Nilo',
      accent: '#D4AF37',
      sky: 'egypt',
      clear: 'TOMB CLEAR',
      hit: 'La serpiente creció — idea sellada',
      miss: 'La tumba se cierra — mal linker'
    },
    tenserdrop: {
      char: 'pup',
      name: 'Pip',
      role: 'Torre pup',
      accent: '#d97706',
      sky: 'drop',
      clear: 'TOWER SAVED',
      hit: 'Torre firme',
      miss: 'Torre temblando'
    },
    linkerflight: {
      char: 'plane',
      name: 'Aviator Link',
      role: 'Linker Flight',
      accent: '#34D399',
      sky: 'flight',
      clear: 'MISSION CLEAR',
      hit: 'Impacto limpio — idea conectada',
      miss: 'Fallaste el linker — rearmá la cadena'
    },
    phrasalswap: {
      char: 'lex',
      name: 'Rex Swap',
      role: 'Phrasal dealer',
      accent: '#60A5FA',
      sky: 'swap',
      clear: 'SWAP WON',
      hit: 'Phrasal correcto en la cadena',
      miss: 'Carta equivocada'
    }
  };

  function themeFor(st) {
    return MODE_THEME[(st && st.mode) || ''] || MODE_THEME.bosscall;
  }

  var STYLE_VER = '20260812mod6';

  function ensureStyles() {
    var existing = document.getElementById('infinity-modern-games-styles');
    if (existing && existing.getAttribute('data-ver') === STYLE_VER) return;
    if (existing) existing.parentNode.removeChild(existing);
    if (!document.getElementById('infinity-hub-fonts')) {
      var link = document.createElement('link');
      link.id = 'infinity-hub-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    var st = document.createElement('style');
    st.id = 'infinity-modern-games-styles';
    st.setAttribute('data-ver', STYLE_VER);
    st.textContent =
      /* Motion */
      '@keyframes infPlaneFly{0%{transform:translate(0,10px) rotate(-8deg)}50%{transform:translate(14px,-8px) rotate(5deg)}100%{transform:translate(0,10px) rotate(-8deg)}}' +
      '@keyframes infPlaneDash{0%{transform:translateX(-30%) translateY(12px) rotate(-10deg) scale(1)}60%{transform:translateX(55%) translateY(-18px) rotate(8deg) scale(1.05)}100%{transform:translateX(120%) translateY(-28px) rotate(12deg) scale(.95);opacity:.15}}' +
      '@keyframes infPropSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}' +
      '@keyframes infFlame{0%,100%{opacity:.55;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.25)}}' +
      '@keyframes infMissile{0%{transform:translateX(0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translateX(90px) scale(1);opacity:0}}' +
      '@keyframes infBoom{0%{transform:scale(.3);opacity:0}35%{transform:scale(1.15);opacity:1}100%{transform:scale(1.9);opacity:0}}' +
      '@keyframes infTargetPulse{0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,.45),0 8px 18px rgba(0,0,0,.35)}50%{box-shadow:0 0 0 12px rgba(56,189,248,0),0 8px 18px rgba(0,0,0,.35)}}' +
      '@keyframes infCloudDrift{0%{transform:translateX(0)}100%{transform:translateX(-48px)}}' +
      '@keyframes infSeaWave{0%{background-position:0 0}100%{background-position:120px 0}}' +
      '@keyframes infCarrierBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}' +
      '@keyframes infCharBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
      '@keyframes infCloud{0%{transform:translateX(0)}100%{transform:translateX(-40px)}}' +
      '@keyframes infSea{0%{background-position:0 0}100%{background-position:80px 0}}' +
      '@keyframes infSunPulse{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.08);opacity:1}}' +
      '@keyframes infSandDrift{0%{background-position:0 0}100%{background-position:60px 0}}' +
      '@keyframes infAspSlither{0%,100%{transform:translateX(0) rotate(-4deg)}50%{transform:translateX(10px) rotate(4deg)}}' +
      '@keyframes infAspGrow{0%{transform:scaleX(.2);opacity:.3}100%{transform:scaleX(1);opacity:1}}' +
      '@keyframes infHeat{0%,100%{opacity:.15}50%{opacity:.35}}' +
      '@keyframes infPhoneRing{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(8deg)}}' +
      '@keyframes infSpark{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-40px) scale(.2);opacity:0}}' +
      '@keyframes infSpotlight{0%,100%{opacity:.55}50%{opacity:.9}}' +
      '@keyframes infEq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}' +
      '@keyframes infOrb{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}' +
      '@keyframes infMirrorShake{0%,100%{transform:translateX(0)}30%{transform:translateX(-3px)}60%{transform:translateX(3px)}}' +
      '@keyframes infCardFlip{0%,100%{transform:rotateY(0)}50%{transform:rotateY(18deg)}}' +
      '@keyframes infWave{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.8);opacity:0}}' +
      '@keyframes infNovaBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
      '@keyframes infNovaListen{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.03)}}' +
      '@keyframes infNovaHappy{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-10px) rotate(-4deg)}75%{transform:translateY(-6px) rotate(4deg)}}' +
      '@keyframes infNovaMad{0%,20%,40%,60%,80%,100%{transform:translateX(0)}10%,30%,50%,70%,90%{transform:translateX(-5px)}15%,35%,55%,75%{transform:translateX(5px)}}' +
      '@keyframes infNovaConfused{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}' +
      '@keyframes infNovaGlow{0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,.45)}50%{box-shadow:0 0 0 14px rgba(34,211,238,0)}}' +
      '@keyframes infNoteFloat{0%{transform:translateY(0) scale(1);opacity:0}30%{opacity:1}100%{transform:translateY(-28px) scale(1.2);opacity:0}}' +
      /* Shell */
      '.inf-mod{max-width:520px;margin:0 auto;border-radius:22px;overflow:hidden;border:2px solid rgba(245,166,35,.35);box-shadow:0 16px 40px rgba(0,0,0,.35);background:#0B0618;color:#F8F5FF;font-family:Outfit,system-ui,sans-serif}' +
      '.inf-mod-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:rgba(91,33,182,.45);border-bottom:1px solid rgba(245,166,35,.25)}' +
      '.inf-mod-top strong{font-family:"Bebas Neue",sans-serif;font-size:20px;letter-spacing:.06em;color:#F5A623}' +
      '.inf-mod-top button{border:1px solid rgba(245,166,35,.5);background:#1a0a3a;color:#F5A623;border-radius:10px;padding:7px 10px;font-weight:800;font-size:12px;cursor:pointer}' +
      '.inf-mod-stage{position:relative;min-height:220px;padding:14px;overflow:hidden}' +
      '.inf-mod-stage.sky-flight{background:linear-gradient(180deg,#0B1B3A 0%,#1D4ED8 32%,#38BDF8 58%,#0369A1 78%,#0C4A6E 100%)}' +
      '.inf-mod-stage.sky-egypt{background:linear-gradient(180deg,#1a0a2e 0%,#7c2d12 35%,#b45309 55%,#f59e0b 78%,#fde68a 100%)}' +
      '.inf-mod-stage.sky-boss{background:linear-gradient(180deg,#1a0510,#3B0E8C 40%,#9f1239)}' +
      '.inf-mod-stage.sky-arena{background:linear-gradient(180deg,#0f0a1f,#1e1b4b 40%,#5B21B6 70%,#B45309)}' +
      '.inf-mod-stage.sky-listen{background:linear-gradient(180deg,#020617,#0c4a6e 45%,#0891b2,#5B21B6)}' +
      '.inf-mod-stage.sky-tone{background:linear-gradient(180deg,#052e16,#14532d 50%,#5B21B6)}' +
      '.inf-mod-stage.sky-nemesis{background:linear-gradient(180deg,#0a0a0a,#450a0a 45%,#3B0E8C,#7f1d1d)}' +
      '.inf-mod-stage.sky-swap{background:linear-gradient(180deg,#0b1020,#1e3a8a 50%,#5B21B6,#0ea5e9)}' +
      '.inf-mod-stage.sky-drop{background:linear-gradient(180deg,#0f172a 0%,#1e3a8a 40%,#5B21B6 70%,#78350f 100%)}' +
      '.inf-boss-stage{position:relative;border-radius:16px;overflow:hidden;margin-bottom:12px;min-height:150px;padding:12px}' +
      '.inf-irina-live{position:relative;z-index:2;width:90px;margin:0 auto 8px;text-align:center}' +
      '.inf-irina-live .inf-char{margin:0 auto 6px;transform:scale(1.2)}' +
      '.inf-irina-live .mood-label{font-size:10px;font-weight:900;letter-spacing:.08em;color:#FB7185}' +
      '.inf-irina-live.is-mad{animation:infNovaMad .5s linear}' +
      '.inf-irina-live.is-happy .mood-label{color:#86EFAC}' +
      '.inf-irina-live.is-happy{animation:infNovaHappy .7s ease-in-out}' +
      '.inf-irina-live.is-confused{animation:infNovaConfused 1s ease-in-out infinite}' +
      '.inf-fx{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}' +
      '.inf-mod-clouds{position:absolute;inset:0;opacity:.55;background:radial-gradient(40px 18px at 20% 30%,rgba(255,255,255,.7),transparent),radial-gradient(50px 20px at 70% 22%,rgba(255,255,255,.55),transparent);animation:infCloud 12s linear infinite}' +
      '.inf-mod-sea{position:absolute;left:0;right:0;bottom:0;height:28%;background:linear-gradient(180deg,rgba(14,165,233,.3),#0c4a6e);background-size:80px 100%;animation:infSea 4s linear infinite}' +
      /* Egypt decor */
      '.inf-egypt-sun{position:absolute;right:12%;top:8%;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle,#FDE047,#F59E0B 60%,transparent 70%);animation:infSunPulse 3s ease-in-out infinite;box-shadow:0 0 40px rgba(245,158,11,.55)}' +
      '.inf-egypt-pyr{position:absolute;bottom:18%;width:0;height:0;border-style:solid;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}' +
      '.inf-egypt-pyr.a{left:8%;border-width:0 36px 58px 36px;border-color:transparent transparent #92400e transparent}' +
      '.inf-egypt-pyr.b{left:28%;border-width:0 52px 84px 52px;border-color:transparent transparent #78350f transparent}' +
      '.inf-egypt-pyr.c{right:10%;border-width:0 28px 48px 28px;border-color:transparent transparent #a16207 transparent}' +
      '.inf-egypt-sand{position:absolute;left:0;right:0;bottom:0;height:22%;background:repeating-linear-gradient(90deg,#fbbf24 0 12px,#f59e0b 12px 24px);opacity:.85;animation:infSandDrift 6s linear infinite}' +
      '.inf-egypt-heat{position:absolute;inset:20% 0 30%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);animation:infHeat 2.4s ease-in-out infinite}' +
      /* Boss decor */
      '.inf-boss-phone{position:absolute;left:10%;top:18%;width:42px;height:58px;border-radius:10px;background:linear-gradient(180deg,#111,#333);border:2px solid #F5A623;animation:infPhoneRing 1.2s ease-in-out infinite;box-shadow:0 0 0 0 rgba(251,113,133,.5)}' +
      '.inf-boss-phone:before{content:"";position:absolute;left:8px;right:8px;top:10px;height:28px;background:#22d3ee;border-radius:4px;opacity:.7}' +
      '.inf-boss-wave{position:absolute;left:12%;top:22%;width:50px;height:50px;border:2px solid rgba(251,113,133,.6);border-radius:50%;animation:infWave 1.4s ease-out infinite}' +
      '.inf-boss-spark{position:absolute;width:8px;height:8px;border-radius:50%;background:#FDE047;animation:infSpark 1.1s ease-out infinite}' +
      '.inf-boss-spark.s1{left:40%;top:30%;animation-delay:.1s}.inf-boss-spark.s2{left:55%;top:22%;animation-delay:.35s}.inf-boss-spark.s3{left:70%;top:35%;animation-delay:.6s}' +
      /* Arena */
      '.inf-arena-spot{position:absolute;left:50%;top:0;width:160px;height:160px;margin-left:-80px;background:radial-gradient(circle,rgba(253,224,71,.55),transparent 70%);animation:infSpotlight 2s ease-in-out infinite}' +
      '.inf-arena-floor{position:absolute;left:8%;right:8%;bottom:8%;height:18px;border-radius:12px;background:linear-gradient(90deg,#78350f,#F5A623,#78350f);opacity:.85}' +
      '.inf-arena-star{position:absolute;width:10px;height:10px;background:#FDE047;clip-path:polygon(50% 0,61% 35%,100% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,0 35%,39% 35%);animation:infOrb 2.2s ease-in-out infinite}' +
      '.inf-arena-star.a{left:18%;top:28%}.inf-arena-star.b{right:16%;top:22%;animation-delay:.4s}.inf-arena-star.c{left:42%;top:12%;animation-delay:.8s}' +
      /* Listen EQ */
      '.inf-eq{position:absolute;left:12%;right:12%;bottom:14%;height:70px;display:flex;align-items:flex-end;justify-content:center;gap:6px}' +
      '.inf-eq i{flex:1;max-width:14px;height:100%;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,#22D3EE,#5B21B6);transform-origin:bottom;animation:infEq 0.7s ease-in-out infinite}' +
      '.inf-eq i:nth-child(2){animation-delay:.1s}.inf-eq i:nth-child(3){animation-delay:.2s}.inf-eq i:nth-child(4){animation-delay:.05s}.inf-eq i:nth-child(5){animation-delay:.25s}.inf-eq i:nth-child(6){animation-delay:.15s}.inf-eq i:nth-child(7){animation-delay:.3s}' +
      '.inf-vinyl{position:absolute;right:10%;top:16%;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle,#111 30%,#22D3EE 32%,#111 34%,#333 55%,#111 57%,#22D3EE 70%);animation:infSunPulse 1.6s linear infinite}' +
      /* Listen reactive avatar (DJ Nova) */
      '.inf-listen-stage{position:relative;border-radius:16px;overflow:hidden;margin-bottom:12px;min-height:168px;padding:12px 12px 16px;background:linear-gradient(180deg,rgba(2,6,23,.35),rgba(8,145,178,.25))}' +
      '.inf-nova-live{position:relative;z-index:2;width:110px;height:128px;margin:0 auto 6px;animation:infNovaBob 2.4s ease-in-out infinite}' +
      '.inf-nova-live .phones{position:absolute;left:8px;top:22px;width:94px;height:44px;border:6px solid #22D3EE;border-radius:22px;border-top-color:transparent;z-index:1}' +
      '.inf-nova-live .phones:before,.inf-nova-live .phones:after{content:"";position:absolute;top:8px;width:18px;height:28px;border-radius:8px;background:#0891b2;border:2px solid #22D3EE}' +
      '.inf-nova-live .phones:before{left:-4px}.inf-nova-live .phones:after{right:-4px}' +
      '.inf-nova-live .face{position:absolute;left:28px;top:28px;width:54px;height:54px;border-radius:50%;background:#F8E7D4;border:2px solid rgba(0,0,0,.15);z-index:2;overflow:hidden}' +
      '.inf-nova-live .eye{position:absolute;top:18px;width:8px;height:8px;border-radius:50%;background:#111}' +
      '.inf-nova-live .eye.l{left:12px}.inf-nova-live .eye.r{right:12px}' +
      '.inf-nova-live .brow{position:absolute;top:10px;width:14px;height:3px;background:#3f1d0f;border-radius:2px;opacity:0}' +
      '.inf-nova-live .brow.l{left:10px}.inf-nova-live .brow.r{right:10px}' +
      '.inf-nova-live .mouth{position:absolute;left:50%;bottom:12px;width:16px;height:7px;margin-left:-8px;border-radius:0 0 12px 12px;background:#be123c}' +
      '.inf-nova-live .torso{position:absolute;left:30px;bottom:0;width:50px;height:36px;border-radius:12px 12px 6px 6px;background:linear-gradient(180deg,#22D3EE,#0891b2);z-index:1}' +
      '.inf-nova-live .note{position:absolute;right:6px;top:8px;width:14px;height:14px;border-radius:50%;background:#F5A623;opacity:0;z-index:3}' +
      '.inf-nova-live .mood-label{position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);font-size:10px;font-weight:900;letter-spacing:.08em;color:#22D3EE;white-space:nowrap;text-shadow:0 2px 8px rgba(0,0,0,.5)}' +
      /* moods */
      '.inf-nova-live.is-idle{animation:infNovaBob 2.4s ease-in-out infinite}' +
      '.inf-nova-live.is-listening{animation:infNovaListen .7s ease-in-out infinite}' +
      '.inf-nova-live.is-listening .phones{animation:infNovaGlow 1s ease-in-out infinite;border-color:#67e8f9}' +
      '.inf-nova-live.is-listening .eye{height:3px;border-radius:2px;top:20px}' +
      '.inf-nova-live.is-listening .mouth{width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#0891b2}' +
      '.inf-nova-live.is-listening .note{opacity:1;animation:infNoteFloat 1s ease-out infinite}' +
      '.inf-nova-live.is-confused{animation:infNovaConfused 1.1s ease-in-out infinite}' +
      '.inf-nova-live.is-confused .eye.l{transform:translateY(-2px)}.inf-nova-live.is-confused .eye.r{transform:translateY(2px)}' +
      '.inf-nova-live.is-confused .brow{opacity:1}.inf-nova-live.is-confused .brow.l{transform:rotate(18deg)}.inf-nova-live.is-confused .brow.r{transform:rotate(-18deg)}' +
      '.inf-nova-live.is-confused .mouth{width:14px;height:14px;margin-left:-7px;border-radius:50%;background:transparent;border:2px solid #78716c;bottom:10px}' +
      '.inf-nova-live.is-happy{animation:infNovaHappy .7s ease-in-out infinite}' +
      '.inf-nova-live.is-happy .eye{height:3px;border-radius:2px;top:20px;background:#111}' +
      '.inf-nova-live.is-happy .mouth{width:22px;height:12px;margin-left:-11px;border-radius:0 0 14px 14px;background:#be123c}' +
      '.inf-nova-live.is-happy .torso{background:linear-gradient(180deg,#4ade80,#0891b2)}' +
      '.inf-nova-live.is-happy .mood-label{color:#86EFAC}' +
      '.inf-nova-live.is-mad{animation:infNovaMad .45s linear}' +
      '.inf-nova-live.is-mad .brow{opacity:1;background:#7f1d1d}.inf-nova-live.is-mad .brow.l{transform:rotate(28deg)}.inf-nova-live.is-mad .brow.r{transform:rotate(-28deg)}' +
      '.inf-nova-live.is-mad .eye{background:#7f1d1d;box-shadow:0 0 6px #ef4444}' +
      '.inf-nova-live.is-mad .mouth{width:18px;height:4px;margin-left:-9px;border-radius:2px;background:#7f1d1d;transform:rotate(-8deg)}' +
      '.inf-nova-live.is-mad .phones{border-color:#ef4444}.inf-nova-live.is-mad .torso{background:linear-gradient(180deg,#ef4444,#7f1d1d)}' +
      '.inf-nova-live.is-mad .mood-label{color:#FCA5A5}' +
      '.inf-nova-live.is-idle .mood-label{color:#C4B5FD}' +
      '.inf-listen-caption{text-align:center;font-size:11px;font-weight:800;color:rgba(255,255,255,.8);margin-top:4px}' +
      /* Tone */
      '.inf-orb{position:absolute;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,#86efac,#16a34a);opacity:.75;animation:infOrb 2.8s ease-in-out infinite}' +
      '.inf-orb.a{left:16%;top:24%}.inf-orb.b{right:18%;top:30%;animation-delay:.5s;background:radial-gradient(circle,#bbf7d0,#5B21B6)}.inf-orb.c{left:48%;top:14%;animation-delay:1s;width:18px;height:18px}' +
      '.inf-lotus{position:absolute;left:50%;bottom:12%;width:70px;height:28px;margin-left:-35px;border-radius:50%;background:radial-gradient(ellipse,#4ade80,#14532d);opacity:.7}' +
      /* Nemesis */
      '.inf-mirror{position:absolute;left:50%;top:12%;width:90px;height:110px;margin-left:-45px;border-radius:12px;border:3px solid rgba(248,113,113,.7);background:linear-gradient(135deg,rgba(255,255,255,.15),rgba(0,0,0,.55));animation:infMirrorShake 2.4s ease-in-out infinite;box-shadow:0 0 24px rgba(248,113,133,.35)}' +
      '.inf-mirror:after{content:"";position:absolute;inset:18% 22%;background:rgba(15,15,15,.75);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);opacity:.9}' +
      '.inf-crack{position:absolute;left:50%;top:20%;width:2px;height:70px;margin-left:-1px;background:linear-gradient(#fff,transparent);transform:rotate(18deg);opacity:.5}' +
      /* Swap cards */
      '.inf-card{position:absolute;width:36px;height:52px;border-radius:6px;border:2px solid #F5A623;background:linear-gradient(160deg,#1e3a8a,#5B21B6);animation:infCardFlip 2.2s ease-in-out infinite;box-shadow:0 6px 14px rgba(0,0,0,.35)}' +
      '.inf-card.a{left:14%;top:20%}.inf-card.b{left:50%;top:14%;margin-left:-18px;animation-delay:.35s;background:linear-gradient(160deg,#0ea5e9,#5B21B6)}.inf-card.c{right:14%;top:22%;animation-delay:.7s}' +
      /* HUD + body */
      '.inf-mod-hud{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}' +
      '.inf-mod-hud span{font-size:11px;font-weight:800;padding:6px 10px;border-radius:999px;background:rgba(11,6,24,.65);border:1px solid rgba(255,255,255,.18);color:#fff}' +
      '.inf-mod-body{position:relative;z-index:2}' +
      '.inf-mod-card{background:rgba(11,6,24,.82);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:14px;backdrop-filter:blur(8px)}' +
      '.inf-mod-prompt{font-size:16px;font-weight:800;line-height:1.4;margin-bottom:8px}' +
      '.inf-mod-line{font-size:14px;font-style:italic;color:rgba(255,255,255,.88);border-left:3px solid #F5A623;padding:10px 12px;background:rgba(91,33,182,.25);border-radius:0 12px 12px 0;margin-bottom:12px}' +
      '.inf-mod-opts{display:grid;gap:8px}' +
      '.inf-mod-opt{text-align:left;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;border-radius:12px;padding:12px;font-weight:700;font-size:13px;line-height:1.4;cursor:pointer}' +
      '.inf-mod-opt:active{transform:scale(.98)}' +
      '.inf-mod-result{margin-top:12px}' +
      '.inf-mod-result .box{border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,.15)}' +
      '.inf-mod-result .box.ok{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.4)}' +
      '.inf-mod-result .box.bad{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35)}' +
      '.inf-mod-cta{display:inline-flex;margin-top:10px;padding:10px 16px;border:none;border-radius:12px;background:linear-gradient(135deg,#FFD700,#F5A623);color:#1a1200;font-weight:900;cursor:pointer}' +
      /* People chars */
      '.inf-char{position:relative;width:72px;height:88px;margin:0 auto 10px;animation:infCharBob 2.4s ease-in-out infinite}' +
      '.inf-char .face{position:absolute;left:16px;top:22px;width:40px;height:40px;border-radius:50%;background:#F8E7D4;border:2px solid rgba(0,0,0,.15)}' +
      '.inf-char .eye{position:absolute;top:14px;width:6px;height:6px;border-radius:50%;background:#111}' +
      '.inf-char .eye.l{left:10px}.inf-char .eye.r{right:10px}' +
      '.inf-char .brow{position:absolute;top:8px;width:12px;height:3px;background:#3f1d0f;border-radius:2px}' +
      '.inf-char .brow.l{left:7px;transform:rotate(18deg)}.inf-char .brow.r{right:7px;transform:rotate(-18deg)}' +
      '.inf-char .mouth{position:absolute;left:50%;bottom:10px;width:14px;height:6px;margin-left:-7px;border-radius:0 0 10px 10px;background:#b91c1c}' +
      '.inf-char .mouth.mad{height:4px;border-radius:2px;background:#7f1d1d;transform:rotate(-6deg)}' +
      '.inf-char .mouth.calm{height:3px;border-radius:2px;background:#78716c}' +
      '.inf-char .mouth.smile{height:7px;border-radius:0 0 12px 12px;background:#be123c}' +
      '.inf-char .mouth.soft{height:5px;border-radius:0 0 10px 10px;background:#db2777}' +
      '.inf-char .mouth.flat{height:2px;border-radius:1px;background:#a1a1aa}' +
      '.inf-char .hair{position:absolute;left:12px;top:10px;width:48px;height:28px;border-radius:20px 20px 8px 8px;background:#1c1917}' +
      '.inf-char .hair.soft{background:#7c2d12}.inf-char .hair.gold{background:#F5A623}' +
      '.inf-char .torso{position:absolute;left:18px;bottom:0;width:36px;height:28px;border-radius:10px 10px 4px 4px;background:#9f1239}' +
      '.inf-char .torso.suit{background:#1e293b}.inf-char .torso.neon{background:#0891b2}.inf-char .torso.soft{background:#166534}.inf-char .torso.gold{background:#B45309}' +
      '.inf-char-irina .hair{background:#111}.inf-char-lex .glasses{position:absolute;left:6px;top:12px;width:28px;height:12px;border:2px solid #334155;border-radius:4px}' +
      '.inf-char-nova .phones{position:absolute;left:8px;top:18px;width:56px;height:28px;border:4px solid #22D3EE;border-radius:16px;border-top-color:transparent}' +
      '.inf-char-shadow .hood{position:absolute;left:10px;top:8px;width:52px;height:50px;border-radius:26px 26px 8px 8px;background:#111}.inf-char-shadow .face.dark{background:#292524}' +
      '.inf-char-queen .crown{position:absolute;left:20px;top:0;width:32px;height:16px;background:#F5A623;clip-path:polygon(0 100%,20% 30%,40% 100%,60% 30%,80% 100%,100% 30%,100% 100%,0 100%)}' +
      /* Asp portrait (hub) */
      '.inf-asp-char{position:relative;width:70px;height:90px;margin:0 auto;animation:infAspSlither 2.2s ease-in-out infinite}' +
      '.inf-asp-char .asp-hood{position:absolute;left:8px;top:18px;width:54px;height:40px;border-radius:50% 50% 40% 40%;background:linear-gradient(180deg,#F5A623,#92400e);box-shadow:inset 0 -8px 0 rgba(0,0,0,.15)}' +
      '.inf-asp-char .asp-head{position:absolute;left:20px;top:8px;width:30px;height:34px;border-radius:40% 40% 30% 30%;background:linear-gradient(180deg,#FDE047,#B45309);border:2px solid #78350f}' +
      '.inf-asp-char .asp-head .eye{position:absolute;top:12px;width:5px;height:5px;border-radius:50%;background:#111}' +
      '.inf-asp-char .asp-head .eye.l{left:5px}.inf-asp-char .asp-head .eye.r{right:5px}' +
      '.inf-asp-char .asp-head .gem{position:absolute;left:50%;top:4px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444}' +
      '.inf-asp-char .asp-body{position:absolute;left:28px;top:40px;width:14px;display:flex;flex-direction:column;gap:2px}' +
      '.inf-asp-char .asp-body i{display:block;height:12px;border-radius:8px;background:linear-gradient(90deg,#F5A623,#78350f)}' +
      '.inf-asp-char .asp-body i:nth-child(2){margin-left:4px;width:16px}.inf-asp-char .asp-body i:nth-child(3){margin-left:8px;width:18px}' +
      /* Plane — polished SVG biplane */
      '.inf-plane{position:relative;width:148px;height:66px;animation:infPlaneFly 2.2s ease-in-out infinite;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45));transform-origin:center}' +
      '.inf-plane-svg{display:block;overflow:visible}' +
      '.inf-plane .prop{transform-origin:143px 35px;animation:infPropSpin .18s linear infinite}' +
      '.inf-plane .flame{position:absolute;left:2px;top:30px;width:22px;height:10px;border-radius:10px;background:linear-gradient(90deg,transparent,#F97316 30%,#FDE047);animation:infFlame .35s ease-in-out infinite;filter:blur(.4px)}' +
      '.inf-plane.is-dash{animation:infPlaneDash .55s ease-in forwards}' +
      '.inf-plane.is-dash .flame{width:36px;opacity:1}' +
      /* Flight arena */
      '.inf-play-sky{position:relative;min-height:170px;border-radius:16px;overflow:hidden;margin-bottom:12px}' +
      '.inf-play-sky.flight-arena{min-height:220px;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(180deg,#0B1B3A 0%,#1D4ED8 34%,#38BDF8 58%,#0284C7 76%,#0C4A6E 100%);box-shadow:inset 0 -30px 40px rgba(2,8,23,.35)}' +
      '.inf-flight-clouds{position:absolute;inset:0;pointer-events:none;opacity:.72;background:radial-gradient(48px 20px at 18% 22%,rgba(255,255,255,.85),transparent),radial-gradient(60px 24px at 62% 16%,rgba(255,255,255,.7),transparent),radial-gradient(40px 18px at 86% 28%,rgba(255,255,255,.55),transparent),radial-gradient(36px 16px at 40% 30%,rgba(255,255,255,.4),transparent);animation:infCloudDrift 14s linear infinite}' +
      '.inf-flight-sun{position:absolute;right:12%;top:10%;width:42px;height:42px;border-radius:50%;background:radial-gradient(circle,#FEF08A,#F59E0B 60%,transparent 72%);box-shadow:0 0 30px rgba(245,158,11,.55);animation:infSunPulse 3s ease-in-out infinite}' +
      '.inf-flight-sea{position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(14,165,233,.25),#0c4a6e 55%,#082f49);background-size:120px 100%;animation:infSeaWave 5s linear infinite}' +
      '.inf-flight-sea:after{content:"";position:absolute;left:0;right:0;top:0;height:10px;background:repeating-linear-gradient(90deg,transparent,transparent 10px,rgba(255,255,255,.18) 10px,rgba(255,255,255,.18) 14px);opacity:.5}' +
      '.inf-flight-carrier{position:absolute;left:50%;bottom:8%;width:120px;height:28px;margin-left:-60px;animation:infCarrierBob 3.5s ease-in-out infinite;z-index:1}' +
      '.inf-flight-carrier:before{content:"";position:absolute;left:8px;right:8px;bottom:0;height:10px;border-radius:4px;background:linear-gradient(180deg,#64748b,#334155)}' +
      '.inf-flight-carrier:after{content:"";position:absolute;left:28px;bottom:8px;width:64px;height:14px;background:#475569;clip-path:polygon(0 100%,8% 0,92% 0,100% 100%)}' +
      '.inf-flight-plane-wrap{position:absolute;left:6%;top:46%;z-index:5}' +
      '.inf-flight-targets,.inf-egypt-targets{position:absolute;inset:14px 10px 56px;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start;justify-content:flex-end;z-index:4}' +
      '.inf-flight-target{padding:11px 14px;border-radius:999px;border:2px solid rgba(125,211,252,.85);background:linear-gradient(180deg,rgba(15,23,42,.82),rgba(30,58,138,.75));color:#F8FAFC;font-weight:900;font-size:13px;cursor:pointer;animation:infTargetPulse 1.7s ease-in-out infinite;backdrop-filter:blur(4px);text-shadow:0 1px 0 rgba(0,0,0,.4)}' +
      '.inf-egypt-tablet{padding:10px 12px;border-radius:10px;border:2px solid #F5A623;background:linear-gradient(180deg,#78350f,#451a03);color:#fff;font-weight:900;font-size:12px;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(253,224,71,.35);animation:infTargetPulse 1.6s ease-in-out infinite}' +
      '.inf-flight-target:hover{border-color:#FDE047;background:linear-gradient(180deg,rgba(91,33,182,.75),rgba(30,58,138,.9));transform:translateY(-2px)}' +
      '.inf-egypt-tablet:hover{border-color:#FDE047;filter:brightness(1.1)}' +
      '.inf-flight-boom{position:absolute;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle,#FEF08A 0%,#FB923C 35%,#EF4444 55%,transparent 72%);pointer-events:none;animation:infBoom .55s ease-out forwards;z-index:6;filter:drop-shadow(0 0 10px rgba(251,146,60,.8))}' +
      '.inf-flight-missile{position:absolute;width:28px;height:8px;border-radius:8px;background:linear-gradient(90deg,#F8FAFC,#F5A623,#EF4444);box-shadow:0 0 10px rgba(245,166,35,.8);animation:infMissile .45s ease-out forwards;z-index:6;pointer-events:none}' +
      '.inf-egypt-sandburst{position:absolute;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,#FDE047,#b45309,transparent 70%);pointer-events:none;animation:infBoom .5s ease-out forwards;z-index:4}' +
      '.inf-play-idea{position:relative;z-index:2;margin-top:8px;padding:12px;border-radius:14px;background:rgba(11,6,24,.78);border:1px solid rgba(245,166,35,.4);font-size:13px;font-weight:700}' +
      '.inf-play-idea b{color:#F5A623}' +
      /* Live asp in egypt playfield */
      '.inf-asp-live{position:absolute;left:6%;bottom:28%;z-index:3;display:flex;align-items:center;gap:0;animation:infAspSlither 1.8s ease-in-out infinite;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}' +
      '.inf-asp-live .head{width:34px;height:38px;border-radius:40% 40% 30% 30%;background:linear-gradient(180deg,#FDE047,#B45309);border:2px solid #78350f;position:relative;z-index:2}' +
      '.inf-asp-live .head .eye{position:absolute;top:14px;width:5px;height:5px;border-radius:50%;background:#111}' +
      '.inf-asp-live .head .eye.l{left:6px}.inf-asp-live .head .eye.r{right:6px}' +
      '.inf-asp-live .hood{position:absolute;left:-10px;top:8px;width:54px;height:36px;border-radius:50%;background:linear-gradient(180deg,#F5A623,#92400e);z-index:1}' +
      '.inf-asp-live .seg{width:22px;height:14px;margin-left:-4px;border-radius:10px;background:linear-gradient(90deg,#F5A623,#78350f);transform-origin:left center;opacity:.25;transform:scaleX(.3)}' +
      '.inf-asp-live .seg.on{opacity:1;transform:scaleX(1);animation:infAspGrow .35s ease-out}' +
      '.inf-asp-live .seg.on:nth-child(3){background:linear-gradient(90deg,#FDE047,#B45309)}' +
      '.inf-asp-live .seg.on:nth-child(4){background:linear-gradient(90deg,#F5A623,#92400e)}' +
      '.inf-asp-live .seg.on:nth-child(5){background:linear-gradient(90deg,#D4AF37,#78350f)}' +
      /* End */
      '.inf-mod-end{text-align:center;padding:18px 14px;position:relative;z-index:2}' +
      '.inf-mod-end h2{font-family:"Bebas Neue",sans-serif;font-size:36px;letter-spacing:.04em;color:#F5A623;margin:0 0 8px}' +
      '.inf-mod-end .stats{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0}' +
      '.inf-mod-end .prize{margin:12px 0;padding:12px;border-radius:14px;border:2px solid #F5A623;background:rgba(91,33,182,.35)}' +
      '.inf-mod-end .btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}' +
      '.inf-mod-end .btns button{padding:10px 14px;border-radius:12px;border:none;font-weight:900;cursor:pointer}' +
      '.inf-mod-end .btns .pri{background:linear-gradient(135deg,#FFD700,#F5A623);color:#1a1200}' +
      '.inf-mod-end .btns .sec{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)}' +
      '.hub-css-char{width:64px;height:78px;margin:0 auto;transform:scale(1.15)}' +
      '.hub-card-art .hub-css-char,.hub-featured-char-css{position:absolute;right:10%;top:18%;transform:scale(1.6);animation:infCharBob 2.6s ease-in-out infinite}' +
      '.hub-title-char-wrap{display:flex;justify-content:center;margin-bottom:10px}';
    document.head.appendChild(st);
  }

  function stageFx(sky) {
    if (sky === 'egypt') {
      return (
        '<div class="inf-fx" aria-hidden="true">' +
        '<div class="inf-egypt-sun"></div><div class="inf-egypt-heat"></div>' +
        '<div class="inf-egypt-pyr a"></div><div class="inf-egypt-pyr b"></div><div class="inf-egypt-pyr c"></div>' +
        '<div class="inf-egypt-sand"></div></div>'
      );
    }
    if (sky === 'flight') {
      return (
        '<div class="inf-fx" aria-hidden="true">' +
        '<div class="inf-flight-sun"></div><div class="inf-flight-clouds"></div>' +
        '<div class="inf-flight-sea"></div><div class="inf-flight-carrier"></div></div>'
      );
    }
    if (sky === 'boss') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-boss-wave"></div><div class="inf-boss-phone"></div>' +
        '<div class="inf-boss-spark s1"></div><div class="inf-boss-spark s2"></div><div class="inf-boss-spark s3"></div></div>'
      );
    }
    if (sky === 'arena') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-arena-spot"></div><div class="inf-arena-floor"></div>' +
        '<div class="inf-arena-star a"></div><div class="inf-arena-star b"></div><div class="inf-arena-star c"></div></div>'
      );
    }
    if (sky === 'listen') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-vinyl"></div><div class="inf-eq">' +
        '<i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>'
      );
    }
    if (sky === 'tone') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-orb a"></div><div class="inf-orb b"></div><div class="inf-orb c"></div><div class="inf-lotus"></div></div>'
      );
    }
    if (sky === 'nemesis') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-mirror"></div><div class="inf-crack"></div></div>'
      );
    }
    if (sky === 'swap') {
      return (
        '<div class="inf-fx" aria-hidden="true"><div class="inf-card a"></div><div class="inf-card b"></div><div class="inf-card c"></div></div>'
      );
    }
    return '<div class="inf-fx" aria-hidden="true"><div class="inf-mod-clouds"></div></div>';
  }

  function modernShell(st, q, bodyHtml) {
    ensureStyles();
    var th = themeFor(st);
    var menuAction =
      st.containerId === 'inf-arcade-fs-body'
        ? 'closeInfinityArcadeFullscreen()'
        : "renderArcadeMenu('" + st.containerId + "')";
    var timed =
      st.mode === 'bosscall' ||
      st.mode === 'dailyboss' ||
      st.mode === 'nemesis' ||
      st.mode === 'listen' ||
      st.mode === 'snake' ||
      st.mode === 'linkerflight';
    return (
      '<div class="inf-mod" style="--accent:' +
      th.accent +
      '">' +
      '<div class="inf-mod-top"><strong>' +
      esc(st.modeTitle || th.name) +
      '</strong><button type="button" onclick="' +
      menuAction +
      '">HUB</button></div>' +
      '<div class="inf-mod-stage sky-' +
      th.sky +
      '">' +
      stageFx(th.sky) +
      '<div class="inf-mod-hud">' +
      '<span>' +
      esc(th.name) +
      '</span>' +
      '<span>' +
      (st.idx + 1) +
      '/' +
      st.quiz.length +
      '</span>' +
      '<span>STREAK ' +
      st.streak +
      '</span>' +
      '</div>' +
      (timed
        ? '<div class="arcade-q-timer" style="margin:0 0 10px;position:relative;z-index:2"><i id="' +
          st.containerId +
          '-qtimer-bar"></i></div>'
        : '') +
      '<div id="' +
      st.containerId +
      '-combo" class="arcade-combo-chip" style="display:none;position:relative;z-index:2"></div>' +
      '<div class="inf-mod-body">' +
      bodyHtml +
      '<div class="inf-mod-result" id="' +
      st.containerId +
      '-result"></div>' +
      '</div></div></div>'
    );
  }

  function chainProgress(st, q) {
    var opts = q.options || [];
    var ideas = q.ideas || [q.clue || q.prompt || 'idea'];
    st.snakePicks = st.snakePicks || [null, null, null];
    var step = 0;
    for (var i = 0; i < 3; i++) if (st.snakePicks[i] != null) step = i + 1;
    var chain = [];
    for (var j = 0; j < step; j++) {
      chain.push((opts[st.snakePicks[j]] || '?') + ' → ' + (ideas[j] || ideas[0] || 'idea'));
    }
    return { opts: opts, ideas: ideas, step: step, chain: chain };
  }

  function updateChainIdea(elSelector, st, q, slot) {
    var ideaEl = document.querySelector(elSelector);
    if (!ideaEl) return;
    var opts = q.options || [];
    var ideas = q.ideas || [q.clue || q.prompt || 'idea'];
    var parts = [];
    for (var k = 0; k <= slot; k++) {
      parts.push((opts[st.snakePicks[k]] || '?') + ' → ' + (ideas[k] || ideas[0] || 'idea'));
    }
    ideaEl.innerHTML =
      '<b>' +
      MANTRA +
      '</b><div style="margin-top:6px">' +
      esc(parts.join(' · ')) +
      '</div><div style="margin-top:6px;opacity:.85">Paso ' +
      (slot + 2) +
      '/3 · Idea: ' +
      esc(ideas[Math.min(slot + 1, ideas.length - 1)] || ideas[0] || '') +
      '</div>';
  }

  function egyptSnakeBody(st, q) {
    ensureStyles();
    var p = chainProgress(st, q);
    var segs = '';
    for (var s = 0; s < 3; s++) {
      segs += '<div class="seg' + (s < p.step ? ' on' : '') + '"></div>';
    }
    return (
      '<div class="inf-play-sky sky-egypt" style="background:linear-gradient(180deg,#7c2d12,#f59e0b 70%,#fde68a)">' +
      stageFx('egypt') +
      '<div class="inf-asp-live" id="inf-asp-live"><div class="hood"></div><div class="head"><i class="eye l"></i><i class="eye r"></i></div>' +
      segs +
      '</div>' +
      '<div class="inf-egypt-targets">' +
      p.opts
        .map(function (o, oi) {
          return (
            '<button type="button" class="inf-egypt-tablet" onclick="window._infSnakeBite(' +
            oi +
            ')">' +
            esc(o) +
            '</button>'
          );
        })
        .join('') +
      '</div></div>' +
      '<div class="inf-play-idea inf-egypt-idea"><b>' +
      MANTRA +
      '</b><div style="margin-top:6px">' +
      (p.chain.length
        ? esc(p.chain.join(' · '))
        : 'Tocá la tablilla correcta. La serpiente crece con cada linker.') +
      '</div><div style="margin-top:6px;opacity:.85">Paso ' +
      Math.min(p.step + 1, 3) +
      '/3 · Idea: ' +
      esc(p.ideas[Math.min(p.step, p.ideas.length - 1)] || p.ideas[0] || '') +
      '</div></div>'
    );
  }

  function flightBody(st, q) {
    ensureStyles();
    var p = chainProgress(st, q);
    return (
      '<div class="inf-play-sky flight-arena">' +
      stageFx('flight') +
      '<div class="inf-flight-plane-wrap" id="inf-flight-plane">' +
      CHARS.plane +
      '</div>' +
      '<div class="inf-flight-targets">' +
      p.opts
        .map(function (o, oi) {
          return (
            '<button type="button" class="inf-flight-target" onclick="window._infFlightShoot(' +
            oi +
            ')">' +
            esc(o) +
            '</button>'
          );
        })
        .join('') +
      '</div></div>' +
      '<div class="inf-play-idea inf-flight-idea"><b>' +
      MANTRA +
      '</b><div style="margin-top:6px">' +
      (p.chain.length
        ? esc(p.chain.join(' · '))
        : 'Disparale al linker correcto. El avión construye la idea.') +
      '</div><div style="margin-top:6px;opacity:.85">Paso ' +
      Math.min(p.step + 1, 3) +
      '/3 · Idea: ' +
      esc(p.ideas[Math.min(p.step, p.ideas.length - 1)] || p.ideas[0] || '') +
      '</div></div>'
    );
  }

  function applySnakePick(optIdx, fx) {
    var st = global._arcadeState;
    if (!st || st.answered) return;
    var q = st.quiz[st.idx];
    if (!q) return;
    if (typeof fx === 'function') fx();

    if (q.category === 'snake' && Array.isArray(q.answer)) {
      st.snakePicks = st.snakePicks || [null, null, null];
      var slot = 0;
      while (slot < 3 && st.snakePicks[slot] != null) slot++;
      if (slot >= 3) return;
      st.snakePicks[slot] = Number(optIdx);

      var live = document.getElementById('inf-asp-live');
      if (live) {
        var segs = live.querySelectorAll('.seg');
        if (segs[slot]) segs[slot].classList.add('on');
      }

      if (slot < 2) {
        updateChainIdea(
          st.mode === 'snake' ? '.inf-egypt-idea' : '.inf-flight-idea',
          st,
          q,
          slot
        );
        return;
      }
      if (typeof global._lilSnakeSubmit === 'function') global._lilSnakeSubmit();
      return;
    }
    if (typeof arcadeChooseOption === 'function') arcadeChooseOption(Number(optIdx));
  }

  global._infSnakeBite = function (optIdx) {
    applySnakePick(optIdx, function () {
      var burst = document.createElement('div');
      burst.className = 'inf-egypt-sandburst';
      burst.style.left = 50 + Math.random() * 30 + '%';
      burst.style.top = 25 + Math.random() * 30 + '%';
      var sky = document.querySelector('.inf-play-sky');
      if (sky) {
        sky.appendChild(burst);
        setTimeout(function () {
          if (burst.parentNode) burst.parentNode.removeChild(burst);
        }, 500);
      }
    });
  };

  global._infFlightShoot = function (optIdx) {
    applySnakePick(optIdx, function () {
      var sky = document.querySelector('.inf-play-sky.flight-arena') || document.querySelector('.inf-play-sky');
      var plane = document.getElementById('inf-flight-plane');
      if (plane) {
        var p = plane.querySelector('.inf-plane');
        if (p) {
          p.classList.remove('is-dash');
          void p.offsetWidth;
          p.classList.add('is-dash');
        }
      }
      if (sky) {
        var missile = document.createElement('div');
        missile.className = 'inf-flight-missile';
        missile.style.left = '22%';
        missile.style.top = '52%';
        sky.appendChild(missile);
        setTimeout(function () {
          if (missile.parentNode) missile.parentNode.removeChild(missile);
        }, 450);
        var boom = document.createElement('div');
        boom.className = 'inf-flight-boom';
        boom.style.left = 55 + Math.random() * 28 + '%';
        boom.style.top = 18 + Math.random() * 28 + '%';
        setTimeout(function () {
          sky.appendChild(boom);
          setTimeout(function () {
            if (boom.parentNode) boom.parentNode.removeChild(boom);
          }, 550);
        }, 180);
      }
    });
  };

  function modernChoiceBody(st, q, label) {
    var th = themeFor(st);
    var charHtml = CHARS[th.char] || CHARS.lex;
    var optCls = st.mode === 'phrasalswap' ? 'inf-mod-opt inf-swap-opt' : 'inf-mod-opt';
    return (
      '<div class="inf-mod-card">' +
      charHtml +
      '<div style="text-align:center;font-size:12px;font-weight:800;color:#F5A623;margin-bottom:8px">' +
      esc(th.name) +
      ' · ' +
      esc(th.role) +
      '</div>' +
      '<div class="inf-mod-prompt">' +
      esc(q.prompt || label) +
      '</div>' +
      (q.scenario || q.clue
        ? '<div class="inf-mod-line">' + esc(q.scenario || q.clue) + '</div>'
        : '') +
      '<div class="inf-mod-opts">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="' +
            optCls +
            '" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      '<div style="margin-top:10px;text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:#C4B5FD">' +
      MANTRA +
      '</div></div>'
    );
  }

  var LISTEN_MOOD_LABEL = {
    idle: 'LISTO',
    listening: 'ESCUCHANDO…',
    confused: '¿QUÉ OÍSTE?',
    happy: '¡SEÑAL BLOQUEADA!',
    mad: 'SEÑAL PERDIDA'
  };

  function setListenMood(mood) {
    var el = document.getElementById('inf-nova-live');
    if (!el) return;
    el.className = 'inf-nova-live is-' + (mood || 'idle');
    var lab = el.querySelector('.mood-label');
    if (lab) lab.textContent = LISTEN_MOOD_LABEL[mood] || LISTEN_MOOD_LABEL.idle;
    var cap = document.getElementById('inf-listen-caption');
    if (cap) {
      cap.textContent =
        mood === 'listening'
          ? 'Nova está en la cabina — no leas, escuchá el L+I+L'
          : mood === 'confused'
            ? 'Audio listo. Elegí lo que escuchaste.'
            : mood === 'happy'
              ? 'Nova celebra — linker correcto'
              : mood === 'mad'
                ? 'Nova se enoja — volvé a escuchar'
                : 'Tocá REPLAY si necesitás el audio otra vez';
    }
  }

  function speakListenReactive(text) {
    setListenMood('listening');
    try {
      if (!global.speechSynthesis) {
        setTimeout(function () {
          setListenMood('confused');
        }, 900);
        return;
      }
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text || ''));
      u.lang = 'en-US';
      u.rate = 0.95;
      u.onend = function () {
        setListenMood('confused');
      };
      u.onerror = function () {
        setListenMood('confused');
      };
      global.speechSynthesis.speak(u);
      // fallback if onend never fires
      setTimeout(function () {
        var el = document.getElementById('inf-nova-live');
        if (el && el.className.indexOf('is-listening') >= 0) setListenMood('confused');
      }, Math.max(3200, String(text || '').length * 55));
    } catch (e) {
      setListenMood('confused');
    }
  }

  global._infListenReplay = function () {
    var st = global._arcadeState;
    if (!st || st.answered) return;
    var q = st.quiz[st.idx];
    if (!q) return;
    speakListenReactive(q.audioText || '');
  };

  function listenBody(st, q) {
    ensureStyles();
    setTimeout(function () {
      speakListenReactive(q.audioText || '');
    }, 220);
    return (
      '<div class="inf-listen-stage">' +
      stageFx('listen') +
      '<div class="inf-nova-live is-idle" id="inf-nova-live" aria-live="polite">' +
      '<div class="phones"></div>' +
      '<div class="face"><i class="brow l"></i><i class="brow r"></i><i class="eye l"></i><i class="eye r"></i><i class="mouth"></i></div>' +
      '<div class="torso"></div>' +
      '<div class="note"></div>' +
      '<div class="mood-label">LISTO</div>' +
      '</div>' +
      '<div class="inf-listen-caption" id="inf-listen-caption">DJ Nova reacciona a lo que escuchás</div>' +
      '</div>' +
      '<div class="inf-mod-card">' +
      '<div style="text-align:center;font-size:12px;font-weight:800;color:#22D3EE;margin-bottom:8px">DJ Nova · Speed Listen</div>' +
      '<div class="inf-mod-prompt">' +
      esc(q.prompt || '¿Qué oíste?') +
      '</div>' +
      '<div class="inf-mod-opts">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="inf-mod-opt" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      '<div style="text-align:center;margin-top:10px">' +
      '<button type="button" class="inf-mod-cta" onclick="window._infListenReplay()">REPLAY AUDIO</button>' +
      '</div>' +
      '<div style="margin-top:10px;text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:#C4B5FD">' +
      MANTRA +
      '</div></div>'
    );
  }

  function patchShell() {
    if (typeof arcadeRoundShell !== 'function') return;
    var prev = arcadeRoundShell;
    function modernAwareShell(st, q, body) {
      if (st && isModern(st.mode)) return modernShell(st, q, body);
      return prev(st, q, body);
    }
    global.arcadeRoundShell = modernAwareShell;
    global.infinityModernRoundShell = modernShell;
  }

  function buildModernBody(st, q) {
    ensureStyles();
    if (!q) return '';
    if (st && st.mode === 'linkerflight') return flightBody(st, q);
    if (st && (st.mode === 'snake' || q.category === 'snake')) return egyptSnakeBody(st, q);
    if (st && st.mode === 'tenserdrop') {
      // owned by infinity-tense-drop.js — fall through if not ready
      if (typeof global.INFINITY_TENSE_DROP !== 'undefined' && typeof arcadeQuestionBody === 'function') {
        /* tense-drop patches body separately */
      }
    }
    if (q.category === 'star' || (st.mode === 'star' && q.category === 'structure')) {
      if (typeof arcadeStructureBody === 'function') {
        var html = arcadeStructureBody(st, q);
        return (
          '<div class="inf-mod-card">' +
          (CHARS[themeFor(st).char] || '') +
          html.replace('arcade-game-card', '').replace(/class="arcade-game-card"/, '') +
          '</div>'
        );
      }
    }
    if (q.category === 'listen' || st.mode === 'listen') {
      return listenBody(st, q);
    }
    if (st.mode === 'bosscall' || st.mode === 'dailyboss' || q.category === 'bosscall') {
      return bossLiveBody(st, q);
    }
    return modernChoiceBody(st, q, st.modeTitle || 'GAME');
  }

  function bossLiveBody(st, q) {
    ensureStyles();
    var th = themeFor(st);
    return (
      '<div class="inf-boss-stage">' +
      stageFx('boss') +
      '<div class="inf-irina-live is-mad" id="inf-irina-live">' +
      CHARS.irina +
      '<div class="mood-label">ENOJADA</div></div>' +
      '<div class="inf-listen-caption" id="inf-boss-caption">Irina está en la llamada — respondé con estructura</div>' +
      '</div>' +
      '<div class="inf-mod-card">' +
      '<div style="text-align:center;font-size:12px;font-weight:800;color:#FB7185;margin-bottom:8px">' +
      esc(th.name) +
      ' · ' +
      esc(th.role) +
      '</div>' +
      '<div class="inf-mod-prompt">' +
      esc(q.prompt || 'Boss Call') +
      '</div>' +
      (q.scenario || q.clue
        ? '<div class="inf-mod-line">' + esc(q.scenario || q.clue) + '</div>'
        : '') +
      '<div class="inf-mod-opts">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="inf-mod-opt" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      '<div style="margin-top:10px;text-align:center;font-size:11px;font-weight:800;letter-spacing:.1em;color:#C4B5FD">' +
      MANTRA +
      '</div></div>'
    );
  }

  function setBossMood(mood) {
    var el = document.getElementById('inf-irina-live');
    if (!el) return;
    el.className = 'inf-irina-live is-' + (mood || 'mad');
    var lab = el.querySelector('.mood-label');
    var map = { mad: 'ENOJADA', calm: 'CALMANDO…', happy: 'OK — SIGUIENTE', confused: '¿QUÉ?' };
    if (lab) lab.textContent = map[mood] || 'ENOJADA';
    var cap = document.getElementById('inf-boss-caption');
    if (cap) {
      cap.textContent =
        mood === 'happy'
          ? 'Irina bajó la voz — estructura correcta'
          : mood === 'calm'
            ? 'Va mejor… no la enciendas de nuevo'
            : mood === 'confused'
              ? 'Eso no le cerró — rearmá L+I+L'
              : 'Cliente furioso en vivo';
    }
  }

  function patchBodies() {
    if (typeof arcadeQuestionBody !== 'function') return;
    var prev = arcadeQuestionBody;
    global.arcadeQuestionBody = function (st, q) {
      if (st && isModern(st.mode) && st.mode !== 'tenserdrop') {
        return buildModernBody(st, q);
      }
      return prev(st, q);
    };
    global.infinityModernQuestionBody = function (st, q) {
      if (st && st.mode === 'tenserdrop') return prev(st, q);
      return buildModernBody(st, q);
    };
  }

  function patchFinishQuestion() {
    if (typeof arcadeFinishQuestion !== 'function') return;
    var prev = arcadeFinishQuestion;
    global.arcadeFinishQuestion = function (correct, response) {
      prev(correct, response);
      var st = global._arcadeState;
      if (!st || !isModern(st.mode)) return;
      if (st.mode === 'listen') setListenMood(correct ? 'happy' : 'mad');
      if (st.mode === 'bosscall' || st.mode === 'dailyboss') setBossMood(correct ? 'happy' : 'confused');
      var box = document.getElementById(st.containerId + '-result');
      if (!box) return;
      var th = themeFor(st);
      var q = st.quiz[st.idx] || {};
      box.innerHTML =
        '<div class="box ' +
        (correct ? 'ok' : 'bad') +
        '"><div style="font-weight:900;margin-bottom:4px">' +
        esc(correct ? th.hit : th.miss) +
        '</div><div style="font-size:13px;opacity:.9">' +
        esc(q.explain || '') +
        '</div><button type="button" class="inf-mod-cta" onclick="arcadeNextQuestion()">' +
        (st.idx + 1 < st.quiz.length ? 'SIGUIENTE' : 'RESULTADO') +
        '</button></div>';
    };
  }

  function patchEndScreen() {
    if (typeof finishArcadeRound !== 'function') return;
    var prev = finishArcadeRound;
    async function modernFinish(containerId) {
      var st = global._arcadeState;
      if (!st || !isModern(st.mode)) return prev(containerId);
      if (st.mode === 'tenserdrop') {
        if (typeof global.infinityTenseDropFinish === 'function') {
          return global.infinityTenseDropFinish(containerId);
        }
        return prev(containerId);
      }

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
      var th = themeFor(st);
      var menuAction =
        containerId === 'inf-arcade-fs-body'
          ? 'closeInfinityArcadeFullscreen()'
          : "renderArcadeMenu('" + containerId + "')";
      var prize =
        reward.prizes && reward.prizes.length
          ? reward.prizes
              .map(function (p) {
                return (
                  '<div class="prize"><strong>' +
                  esc(p.title) +
                  '</strong><div>+' +
                  (p.coins || 0) +
                  ' coins · +' +
                  (p.xp || 0) +
                  ' XP</div></div>'
                );
              })
              .join('')
          : '<div class="prize"><strong>Seguí la cadena</strong><div>Subí score o racha para premios.</div></div>';
      var charHtml =
        th.char === 'pup' && global.INFINITY_CSS_CHARS && global.INFINITY_CSS_CHARS.pup
          ? global.INFINITY_CSS_CHARS.pup
          : CHARS[th.char] || CHARS.lex;
      c.innerHTML =
        '<div class="inf-mod"><div class="inf-mod-top"><strong>' +
        esc(st.modeTitle) +
        '</strong><button type="button" onclick="' +
        menuAction +
        '">HUB</button></div><div class="inf-mod-stage sky-' +
        th.sky +
        '">' +
        stageFx(th.sky) +
        '<div class="inf-mod-end">' +
        charHtml +
        '<h2>' +
        esc(th.clear || 'MISSION CLEAR') +
        '</h2><div style="font-size:15px;font-weight:700">' +
        correct +
        '/' +
        total +
        ' · ' +
        score +
        '%</div><div class="stats"><span class="inf-mod-hud"><span>BEST ' +
        st.bestStreak +
        '</span><span>+' +
        reward.xpGain +
        ' XP</span><span>+' +
        reward.coinGain +
        ' COINS</span><span>DAY ' +
        reward.meta.dayStreak +
        '</span></span></div>' +
        prize +
        '<div style="font-size:12px;opacity:.85;margin-top:8px">' +
        MANTRA +
        '</div><div class="btns">' +
        '<button type="button" class="pri" onclick="startArcadeMode(\'' +
        st.mode +
        "','" +
        containerId +
        '\')">RETRY</button>' +
        '<button type="button" class="sec" onclick="' +
        menuAction +
        '">HUB</button>' +
        '</div></div></div></div>';
    }
    global.finishArcadeRound = modernFinish;
    global.infinityModernFinishRound = modernFinish;
  }

  function patchHubCharacters() {
    if (!global.INFINITY_CSS_CHARS) global.INFINITY_CSS_CHARS = {};
    Object.keys(CHARS).forEach(function (k) {
      global.INFINITY_CSS_CHARS[k] = CHARS[k];
    });
    var prevChar = global.infinityCharHtml;
    global.infinityCharHtml = function (key) {
      ensureStyles();
      if (global.INFINITY_CSS_CHARS && global.INFINITY_CSS_CHARS[key]) {
        return global.INFINITY_CSS_CHARS[key];
      }
      return CHARS[key] || (typeof prevChar === 'function' ? prevChar(key) : CHARS.lex);
    };
  }

  function addLinkerFlightMode() {
    if (typeof ARCADE_MODES === 'undefined') return;
    ARCADE_MODES.linkerflight = {
      title: 'Linker Flight',
      icon: 'ti-plane',
      desc: 'El avión dispara al linker correcto hasta armar la idea.',
      category: 'snake',
      color: '#0ea5e9',
      difficulty: 2,
      stars: '★★ Flight'
    };
  }

  function patchPickQuestions() {
    if (typeof pickArcadeQuestions !== 'function') return;
    if (patchPickQuestions._done) return;
    var prev = pickArcadeQuestions;
    global.pickArcadeQuestions = function (mode, s, count, allowRepeat) {
      if (mode === 'linkerflight') {
        return prev('snake', s, count || 6, allowRepeat);
      }
      return prev(mode, s, count, allowRepeat);
    };
    patchPickQuestions._done = true;
  }

  function patchPrizes() {
    if (typeof arcadeComputePrizes !== 'function') return;
    if (patchPrizes._done) return;
    var prev = arcadeComputePrizes;
    global.arcadeComputePrizes = function (st, score, metaBefore, metaAfter) {
      var prizes = prev(st, score, metaBefore, metaAfter) || [];
      if (st && st.mode === 'linkerflight' && score >= 80) {
        prizes.push({ id: 'aviator-link', icon: '', title: 'AVIATOR LINK', coins: 32, xp: 26 });
      }
      if (st && st.mode === 'snake' && score >= 80) {
        prizes.push({ id: 'nile-asp', icon: '', title: 'NILE ASP', coins: 30, xp: 24 });
      }
      return prizes;
    };
    patchPrizes._done = true;
  }

  function publishModernApis() {
    global.arcadeIsModernMode = isModern;
    global.infinityModernRoundShell = modernShell;
    global.infinityModernQuestionBody = function (st, q) {
      if (!st || st.mode === 'tenserdrop') return null;
      return buildModernBody(st, q);
    };
    global.infinityModernFinishRound = global.finishArcadeRound;
    global.infinityEnsureModernArcade = ensureModernArcade;
  }

  var _patchedCore = false;
  function ensureModernArcade() {
    ensureStyles();
    addLinkerFlightMode();
    if (!_patchedCore) {
      patchShell();
      patchBodies();
      patchFinishQuestion();
      patchEndScreen();
      patchHubCharacters();
      patchPickQuestions();
      patchPrizes();
      _patchedCore = true;
    }
    publishModernApis();
  }

  var _booted = false;
  function boot() {
    if (typeof ARCADE_MODES === 'undefined' || typeof arcadeRoundShell !== 'function') return false;
    ensureModernArcade();
    if (!_booted) {
      setTimeout(publishModernApis, 500);
      setTimeout(publishModernApis, 1500);
      _booted = true;
    }
    return true;
  }

  var tries = 0;
  function schedule() {
    if (boot()) return;
    tries++;
    if (tries < 60) setTimeout(schedule, 120);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})(typeof window !== 'undefined' ? window : globalThis);
