/**
 * Jill — Rapid drill Kahoot
 * Preguntas priorizadas por KPIs/temas que el estudiante falla (rapid drill + quizzes + refuerzo Jill).
 */
(function (global) {
  'use strict';

  var BRAND = 'Rapid drill';
  var MODE_LABEL = 'Rapid drill';

  var PULSE_OPTS = [
    { bg: '#5B21B6', shape: '⬡' },
    { bg: '#0a5c3c', shape: '⬢' },
    { bg: '#D97706', shape: '✦' },
    { bg: '#7C3AED', shape: '◇' }
  ];

  var KAHOOT = PULSE_OPTS;

  var TIMER_SEC = 60;
  var QUESTIONS_PER_ROUND = 5;
  var WIN_SCORE_PCT = 70;
  var GOLD_SCORE_PCT = 100;
  var SILVER_SCORE_PCT = 80;

  function ensureRapidDrillStats(student) {
    if (!student) return { winStreak: 0, bestWinStreak: 0, totalWins: 0, trophies: 0 };
    if (!student.jillRapidDrill) {
      student.jillRapidDrill = { winStreak: 0, bestWinStreak: 0, totalWins: 0, trophies: 0 };
    }
    return student.jillRapidDrill;
  }

  function pressureRatio(state) {
    var timeP = 1 - (state.timeLeft / TIMER_SEC);
    var qP = state.idx / Math.max(1, state.quiz.length);
    return Math.min(0.98, Math.max(0.05, timeP * 0.72 + qP * 0.28));
  }

  function injectRapidDrillStyles() {
    if (document.getElementById('jill-rapid-drill-styles')) return;
    var st = document.createElement('style');
    st.id = 'jill-rapid-drill-styles';
    st.textContent = ''
      + '@keyframes jillKahootIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
      + '@keyframes jillFlameFlicker{0%,100%{transform:scale(1) rotate(-4deg);filter:brightness(1)}50%{transform:scale(1.14) rotate(4deg);filter:brightness(1.2)}}'
      + '@keyframes jillPressureShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}'
      + '@keyframes jillTrophyPop{0%{transform:scale(0.2) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}'
      + '@keyframes jillStreakPulse{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.5)}50%{box-shadow:0 0 18px 6px rgba(251,191,36,0.35)}}'
      + '@keyframes jillConfettiFall{0%{transform:translateY(-12px) rotate(0);opacity:1}100%{transform:translateY(90px) rotate(280deg);opacity:0}}'
      + '.jill-pressure-track{position:relative;height:58px;margin:0 0 12px;border-radius:12px;background:linear-gradient(90deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%);border:1px solid rgba(251,191,36,0.35);overflow:hidden}'
      + '.jill-pressure-track.critical{animation:jillPressureShake .35s ease-in-out infinite;border-color:rgba(252,165,165,0.75)}'
      + '.jill-polvorin{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:10px;background:linear-gradient(145deg,#78350f,#92400e);border:2px solid #fcd34d;box-shadow:inset 0 -4px 0 rgba(0,0,0,0.25),0 0 14px rgba(251,191,36,0.25);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fef3c7;letter-spacing:.04em;text-align:center;line-height:1.05}'
      + '.jill-flame-wrap{position:absolute;top:50%;transform:translateY(-50%);transition:left .85s linear;z-index:2}'
      + '.jill-flame{font-size:30px;line-height:1;animation:jillFlameFlicker .55s ease-in-out infinite;filter:drop-shadow(0 0 8px rgba(251,146,60,0.9))}'
      + '.jill-pressure-label{position:absolute;left:10px;top:6px;font-size:9px;font-weight:800;letter-spacing:.1em;color:rgba(254,243,199,0.85);text-transform:uppercase}'
      + '.jill-pressure-danger{position:absolute;left:10px;bottom:6px;font-size:10px;font-weight:800;color:#fca5a5}'
      + '.jill-trophy-burst{font-size:52px;animation:jillTrophyPop .55s cubic-bezier(.2,1.1,.3,1) both}'
      + '.jill-streak-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(251,191,36,0.18);border:1px solid rgba(251,191,36,0.55);color:#fde68a;font-size:12px;font-weight:800;animation:jillStreakPulse 1.2s ease-in-out infinite}'
      + '.jill-confetti span{position:absolute;top:0;width:8px;height:14px;border-radius:2px;animation:jillConfettiFall 1.1s ease-in forwards}'
      + '.jill-rapid-tier-bronze .jill-tier-badge{background:linear-gradient(135deg,#92400e,#b45309);color:#fef3c7}'
      + '.jill-rapid-tier-silver .jill-tier-badge{background:linear-gradient(135deg,#64748b,#94a3b8);color:#f8fafc}'
      + '.jill-rapid-tier-gold .jill-pressure-track,.jill-rapid-tier-legend .jill-pressure-track{border-color:rgba(251,191,36,0.75);box-shadow:0 0 20px rgba(251,191,36,0.25)}'
      + '.jill-rapid-tier-gold .jill-tier-badge,.jill-rapid-tier-legend .jill-tier-badge{background:linear-gradient(135deg,#b45309,#fbbf24,#f59e0b);color:#1c1917;box-shadow:0 0 18px rgba(251,191,36,0.45)}'
      + '.jill-rapid-tier-legend #jill-kahoot-inner{border:1px solid rgba(251,191,36,0.35);border-radius:16px;padding:4px}'
      + '.jill-tier-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:.08em;margin-bottom:8px}';
    document.head.appendChild(st);
  }

  function renderPressureScene(state) {
    var ratio = pressureRatio(state);
    var leftPct = Math.round(8 + ratio * 62);
    var critical = state.timeLeft <= 5;
    var danger = critical ? '¡La llama casi toca el polvorín!' : (ratio > 0.55 ? 'Respondé rápido — sube la presión' : 'La llama se acerca al polvorín…');
    return '<div id="jill-pressure-track" class="jill-pressure-track' + (critical ? ' critical' : '') + '">'
      + '<div class="jill-pressure-label">Presión psicológica</div>'
      + '<div class="jill-pressure-danger" id="jill-pressure-danger">' + esc(danger) + '</div>'
      + '<div id="jill-pressure-flame" class="jill-flame-wrap" style="left:' + leftPct + '%;"><div class="jill-flame">🔥</div></div>'
      + '<div class="jill-polvorin" title="Polvorín">PÓLVORA</div>'
      + '</div>';
  }

  function updatePressureDom(state) {
    var track = document.getElementById('jill-pressure-track');
    var flame = document.getElementById('jill-pressure-flame');
    var danger = document.getElementById('jill-pressure-danger');
    if (!flame) return;
    var ratio = pressureRatio(state);
    flame.style.left = Math.round(8 + ratio * 62) + '%';
    if (track) track.classList.toggle('critical', state.timeLeft <= 5);
    if (danger) {
      danger.textContent = state.timeLeft <= 5
        ? '¡La llama casi toca el polvorín!'
        : (ratio > 0.55 ? 'Respondé rápido — sube la presión' : 'La llama se acerca al polvorín…');
    }
  }

  function renderMiniTrophy(streak) {
    var tier = streak >= 5 ? '🏆' : (streak >= 3 ? '🥇' : '⭐');
    var label = streak >= 5 ? 'RACHA LEGENDARIA' : (streak >= 3 ? 'RACHA EN FUEGO' : 'BIEN');
    return '<div class="jill-trophy-burst" style="margin-bottom:6px;">' + tier + '</div>'
      + '<div class="jill-streak-pill">🔥 Racha ' + streak + ' · ' + label + '</div>';
  }

  function renderConfettiBurst() {
    var colors = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#c4b5fd', '#fb923c'];
    var html = '<div class="jill-confetti" style="position:relative;height:70px;margin:0 auto 8px;max-width:280px;overflow:hidden;">';
    for (var i = 0; i < 14; i++) {
      var left = 8 + Math.floor(Math.random() * 84);
      var delay = (Math.random() * 0.35).toFixed(2);
      var col = colors[i % colors.length];
      html += '<span style="left:' + left + '%;background:' + col + ';animation-delay:' + delay + 's;"></span>';
    }
    return html + '</div>';
  }

  function trophyForScore(score, perfect) {
    if (perfect || score >= GOLD_SCORE_PCT) return { icon: '🏆', title: 'TROFEO DE ORO', sub: 'Rapid drill perfecto' };
    if (score >= SILVER_SCORE_PCT) return { icon: '🥇', title: 'TROFEO DE PLATA', sub: 'Excelente bajo presión' };
    if (score >= WIN_SCORE_PCT) return { icon: '🥈', title: 'TROFEO DE BRONCE', sub: 'Ganaste la ronda' };
    return { icon: '💀', title: 'Casi — otra ronda', sub: 'La llama sigue cerca del polvorín' };
  }

  function applyWinStreak(student, score, perfect) {
    var rd = ensureRapidDrillStats(student);
    var won = score >= WIN_SCORE_PCT;
    if (won) {
      rd.winStreak = (rd.winStreak || 0) + 1;
      rd.totalWins = (rd.totalWins || 0) + 1;
      rd.trophies = (rd.trophies || 0) + (perfect || score >= GOLD_SCORE_PCT ? 3 : (score >= SILVER_SCORE_PCT ? 2 : 1));
      if (rd.winStreak > (rd.bestWinStreak || 0)) rd.bestWinStreak = rd.winStreak;
    } else {
      rd.winStreak = 0;
    }
    rd.lastScore = score;
    rd.lastDate = new Date().toISOString();
    rd.tier = rapidDrillTier(student);
    return { won: won, rd: rd };
  }

  var COIN_QUESTIONS = [
    { kpi: 'k3', topic: 'coin', q: 'Completá la pregunta: ___ you ready?', options: ['Are', 'Is', 'Do', 'Does'], answer: 0, explain: 'Pregunta con to be: Are + you.' },
    { kpi: 'k3', topic: 'coin', q: 'Completá la respuesta: Yes, I ___ ready.', options: ['am', 'is', 'are', 'be'], answer: 0, explain: 'Respuesta afirmativa: I am ready.' },
    { kpi: 'k3', topic: 'coin', q: 'Completá la pregunta en pasado: ___ she work yesterday?', options: ['Did', 'Does', 'Do', 'Was'], answer: 0, explain: 'Pasado en pregunta: Did + sujeto + verbo base.' },
    { kpi: 'k3', topic: 'coin', q: 'Completá la respuesta: She ___ yesterday.', options: ['worked', 'work', 'working', 'works'], answer: 0, explain: 'Afirmación en pasado: verbo en -ed.' },
    { kpi: 'k14', topic: 'coin', q: '¿Cuál es pregunta correcta?', options: ['They are coming.', 'Are they coming?', 'Coming they are.', 'They coming are?'], answer: 1, explain: 'Auxiliar al inicio: Are they…?' }
  ];

  var PREP_QUESTIONS = [
    { kpi: 'k4', topic: 'prep', q: 'I live ___ San José (ciudad)', options: ['in', 'on', 'at', 'by'], answer: 0, explain: 'in + ciudad/país.' },
    { kpi: 'k4', topic: 'prep', q: 'The book is ___ the table', options: ['in', 'on', 'at', 'by'], answer: 1, explain: 'on + superficie.' },
    { kpi: 'k4', topic: 'prep', q: 'We meet ___ 5 pm', options: ['in', 'on', 'at', 'by'], answer: 2, explain: 'at + hora.' },
    { kpi: 'k4', topic: 'prep', q: 'I go ___ car', options: ['in', 'on', 'at', 'by'], answer: 3, explain: 'by + transporte.' }
  ];

  var ARTICLE_QUESTIONS = [
    { kpi: 'k4', topic: 'article', q: 'I need ___ hour (sonido vocal)', options: ['a', 'an', 'the', '—'], answer: 1, explain: 'an antes de sonido vocal.' },
    { kpi: 'k4', topic: 'article', q: '___ sun is bright (único)', options: ['A', 'An', 'The', '—'], answer: 2, explain: 'the + único conocido.' },
    { kpi: 'k4', topic: 'article', q: 'She is ___ engineer', options: ['a', 'an', 'the', '—'], answer: 1, explain: 'an + engineer.' }
  ];

  var CONSTRUCTION_QUESTIONS = [
    { kpi: 'k3', topic: 'tense', q: 'Para completar el presente perfecto continuo: I have been ___', options: ['going', 'gone', 'go', 'went'], answer: 0, explain: 'Have been + verbo en -ing: I have been going / working.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el presente simple: I ___ to work every day.', options: ['go', 'goes', 'went', 'going'], answer: 0, explain: 'I + verbo base en presente: I go.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el pasado simple: She ___ the report yesterday.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Pasado regular: verbo + -ed.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el presente continuo: They are ___ English now.', options: ['learning', 'learned', 'learn', 'learns'], answer: 0, explain: 'Am/is/are + -ing: They are learning.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el presente perfecto: I have ___ there before.', options: ['been', 'be', 'being', 'was'], answer: 0, explain: 'Have + participio: I have been.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el futuro con will: I ___ call you tomorrow.', options: ['will', 'would', 'am', 'was'], answer: 0, explain: 'Will + verbo base: I will call.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar con modal: You ___ see a doctor.', options: ['should', 'shoulds', 'shoulding', 'shoulded'], answer: 0, explain: 'Modal + verbo base: You should see.' },
    { kpi: 'k2', topic: 'tense', q: 'Para completar el pasado simple: We ___ late last night.', options: ['arrived', 'arrive', 'arriving', 'arrives'], answer: 0, explain: 'Pasado: arrived.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el pasado perfecto: She had ___ before I arrived.', options: ['left', 'leave', 'leaving', 'leaves'], answer: 0, explain: 'Had + participio: She had left.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar: I have not ___ yet.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Have + participio en negativo: have not finished.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar el continuo: He is ___ a presentation.', options: ['preparing', 'prepared', 'prepare', 'prepares'], answer: 0, explain: 'Is + -ing: He is preparing.' },
    { kpi: 'k3', topic: 'tense', q: 'Para completar con could + perfecto: He could have ___ earlier.', options: ['come', 'came', 'coming', 'comes'], answer: 0, explain: 'Could have + participio: could have come.' },
    { kpi: 'k1', topic: 'tense', q: 'Elige la forma correcta: She ___ coffee every morning.', options: ['drinks', 'drink', 'drinking', 'drank'], answer: 0, explain: 'Presente 3ra persona: she drinks.' },
    { kpi: 'k2', topic: 'tense', q: 'Elige la forma correcta: ___ they working now?', options: ['Are', 'Is', 'Do', 'Did'], answer: 0, explain: 'Pregunta continua: Are they working?' }
  ];

  var FOUNDATIONS_DRILL = CONSTRUCTION_QUESTIONS.concat(COIN_QUESTIONS).concat(PREP_QUESTIONS).concat(ARTICLE_QUESTIONS);

  var CORE = [
    { kpi: 'k10', q: 'Completá la oración: I think ___ because…', options: ['that', 'the', 'to', 'on'], answer: 0, explain: 'Opinión + because: I think that… because…' },
    { kpi: 'k8', q: '¿Cuál conector muestra contraste?', options: ['on top of that', 'however', 'first of all', 'as well as'], answer: 1, explain: '"However" marca oposición entre ideas.' },
    { kpi: 'k9', q: 'Te preguntan "Do you like your job?" — completá mejor: Yes, ___', options: ['I do because…', 'yes', 'job', 'like'], answer: 0, explain: 'Expandí: Yes, I do because…' },
    { kpi: 'k13', q: 'Si te trabás al hablar, lo mejor es…', options: ['Callar', '"Let me rephrase" y seguir', 'Colgar', 'Hablar más fuerte'], answer: 1, explain: 'Reparar y continuar — recovery sin presión.' },
    { kpi: 'k2', q: 'Completá: Yesterday I ___ to the office.', options: ['went', 'go', 'going', 'goes'], answer: 0, explain: 'Pasado simple: I went.' }
  ];

  var BY_BUNDLE = {
    'F0-matrix': CONSTRUCTION_QUESTIONS.slice(0, 4).concat(COIN_QUESTIONS.slice(0, 2)).concat(PREP_QUESTIONS.slice(0, 1)),
    'F1-msi': [
      { kpi: 'k3', q: 'Después de have en perfecto: I have ___ busy all week.', options: ['been', 'be', 'being', 'was'], answer: 0, explain: 'Have + participio: I have been.' },
      { kpi: 'k3', q: 'Después de been: I have been ___ on this project.', options: ['working', 'work', 'worked', 'works'], answer: 0, explain: 'Been + -ing: I have been working.' },
      { kpi: 'k2', q: 'Completá el pasado: They ___ the meeting early.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Pasado simple: finished.' }
    ],
    'B2-verbs': [
      { kpi: 'k1', q: 'Tres formas clave de un verbo son…', options: ['Presente · pasado · participio', 'Solo presente', 'Solo infinitivo', 'Artículo · sustantivo · verbo'], answer: 0, explain: 'Present · Past · Participle — piezas operativas.' },
      { kpi: 'k2', q: 'I ___ yesterday. (trabajar)', options: ['work', 'worked', 'working', 'have work'], answer: 1, explain: 'Pasado simple: worked.' },
      { kpi: 'k4', q: 'I have ___ there. (estar)', options: ['be', 'been', 'being', 'was'], answer: 1, explain: 'Have + participio: have been.' }
    ],
    'F2-pronouns': [
      { kpi: 'k4', q: '"This is ___ book" — posesivo de I', options: ['me', 'my', 'mine', 'myself'], answer: 1, explain: 'Antes del sustantivo: my book.' },
      { kpi: 'k4', q: 'Reflexivo de "she" es…', options: ['hers', 'herself', 'sheself', 'her'], answer: 1, explain: 'She did it herself.' },
      { kpi: 'k4', q: 'Demostrativo cerca: ___', options: ['that', 'this', 'those', 'them'], answer: 1, explain: 'This = cerca; That = lejos.' }
    ],
    'B1-chunking': [
      { kpi: 'k9', q: 'Un chunk útil para opiniones…', options: ['I think because…', 'Word by word', 'Only yes', 'Translate all'], answer: 0, explain: 'Opinión + because + ejemplo.' },
      { kpi: 'k8', q: '"On top of that" sirve para…', options: ['Contrastar', 'Agregar idea', 'Cerrar', 'Disculparse'], answer: 1, explain: 'Agrega información relacionada.' },
      { kpi: 'k10', q: 'Chunking evita…', options: ['Hablar fluido', 'Traducir cada palabra', 'Usar conectores', 'Practicar'], answer: 1, explain: 'Bloques listos > traducción mental.' }
    ],
    'B4-transitions': [
      { kpi: 'k8', q: 'Linker de causa…', options: ['however', 'because', 'although', 'meanwhile'], answer: 1, explain: 'Because explica el porqué.' },
      { kpi: 'k8', q: 'Para ordenar pasos usás…', options: ['First… Then… Finally', 'However…', 'Although…', 'Anyway…'], answer: 0, explain: 'Secuencia clara en narrativas.' },
      { kpi: 'k8', q: '"Therefore" indica…', options: ['Contraste', 'Conclusión', 'Ejemplo', 'Saludo'], answer: 1, explain: 'Therefore = por eso / conclusión.' }
    ],
    'F6-oral-production': [
      { kpi: 'k5', q: 'Para describir, empezá con…', options: ['Silencio', 'Una imagen o detalle concreto', 'Solo "I don\'t know"', 'Traducir todo'], answer: 1, explain: 'Describe con detalles visibles.' },
      { kpi: 'k11', q: 'Opinión completa = …', options: ['I think', 'I think because… for example…', 'Yes', 'Maybe'], answer: 1, explain: 'Opinión + razón + ejemplo.' },
      { kpi: 'k6', q: 'En narración, el orden típico es…', options: ['Finally first', 'First → Then → Finally', 'Random', 'Solo pasado'], answer: 1, explain: 'Primero, después, al final.' }
    ],
    'B6-recovery': [
      { kpi: 'k13', q: 'Frase de reparación útil…', options: ['Let me rephrase that', 'I quit', 'No English', 'Louder please'], answer: 0, explain: 'Reformulá y seguí.' },
      { kpi: 'k12', q: 'Después de un error, Jill quiere que…', options: ['Pares', 'Cierres la idea igual', 'Cambies de idioma', 'Te disculpes 10 veces'], answer: 1, explain: '…and that is basically it — cerrá la idea.' },
      { kpi: 'k2', q: 'Recovery bajo presión significa…', options: ['No arriesgar', 'Seguir con frase de reparo', 'Evitar hablar', 'Solo escribir'], answer: 1, explain: 'Equivocarse no tiene costo emocional.' }
    ]
  };

  var BUNDLE_ID_ALIASES = { 'F1-lego': 'F1-msi' };
  function resolveBundleId(id) {
    return id ? (BUNDLE_ID_ALIASES[id] || id) : id;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function bundleIdFromStudent(student, activeBundle) {
    if (activeBundle && activeBundle.id) return resolveBundleId(activeBundle.id);
    if (student && student.jillProgress && student.jillProgress.activeBundle) return resolveBundleId(student.jillProgress.activeBundle);
    return null;
  }

  function rapidDrillTier(student) {
    var rd = ensureRapidDrillStats(student);
    var peak = Math.max(rd.winStreak || 0, rd.bestWinStreak || 0);
    if (peak >= 10) return 'legend';
    if (peak >= 5) return 'gold';
    if (peak >= 3) return 'silver';
    if (peak >= 1) return 'bronze';
    return 'none';
  }

  function tierBadgeHtml(tier) {
    if (tier === 'legend') return '<div class="jill-tier-badge">👑 LEYENDA · interfaz dorada</div>';
    if (tier === 'gold') return '<div class="jill-tier-badge">🏆 ORO · racha en fuego</div>';
    if (tier === 'silver') return '<div class="jill-tier-badge">🥈 PLATA · subiendo nivel</div>';
    if (tier === 'bronze') return '<div class="jill-tier-badge">🥉 BRONCE · primera victoria</div>';
    return '';
  }

  function ensureDrillProfile(student) {
    if (!student) return null;
    if (!student.jillDrillProfile) {
      student.jillDrillProfile = { weakCategories: {}, mastery: {}, lastFailures: [] };
    }
    return student.jillDrillProfile;
  }

  function updateDrillProfile(student, kpiResults) {
    var prof = ensureDrillProfile(student);
    if (!prof) return;
    (kpiResults || []).forEach(function (r) {
      if (!r.category) return;
      if (!prof.mastery[r.category]) prof.mastery[r.category] = { ok: 0, fail: 0 };
      if (r.correct) prof.mastery[r.category].ok++;
      else {
        prof.mastery[r.category].fail++;
        prof.weakCategories[r.category] = (prof.weakCategories[r.category] || 0) + 1;
        prof.lastFailures.unshift({
          category: r.category,
          kpi: r.kpi,
          at: new Date().toISOString()
        });
      }
    });
    prof.lastFailures = (prof.lastFailures || []).slice(0, 24);
  }

  function collectWeakCategories(student) {
    var prof = ensureDrillProfile(student);
    if (!prof) return [];
    var scored = [];
    Object.keys(prof.mastery || {}).forEach(function (cat) {
      var m = prof.mastery[cat];
      var total = (m.ok || 0) + (m.fail || 0);
      if (total < 1) return;
      var failRate = (m.fail || 0) / total;
      if (failRate >= 0.4 || (prof.weakCategories[cat] || 0) >= 2) {
        scored.push({ cat: cat, weight: failRate + (prof.weakCategories[cat] || 0) * 0.15 });
      }
    });
    Object.keys(prof.weakCategories || {}).forEach(function (cat) {
      if (scored.some(function (s) { return s.cat === cat; })) return;
      scored.push({ cat: cat, weight: prof.weakCategories[cat] });
    });
    scored.sort(function (a, b) { return b.weight - a.weight; });
    return scored.map(function (s) { return s.cat; }).slice(0, 6);
  }

  function drillBankQuestions() {
    if (typeof JillDrillBank !== 'undefined' && JillDrillBank.BANK) {
      return JillDrillBank.BANK.slice();
    }
    return CONSTRUCTION_QUESTIONS.concat(COIN_QUESTIONS).concat(PREP_QUESTIONS).concat(ARTICLE_QUESTIONS);
  }

  function categoryLabel(cat) {
    if (typeof JillDrillBank !== 'undefined' && JillDrillBank.categoryLabel) {
      return JillDrillBank.categoryLabel(cat);
    }
    var labels = {
      word_order: 'Orden de palabras', tense: 'Tiempos verbales', negation: 'Negaciones',
      affirmation: 'Afirmaciones', preposition: 'Preposiciones', number: 'Números',
      possessive: 'Posesivos', demonstrative: 'Demostrativos', personal_pronoun: 'Personales',
      reflexive: 'Reflexivos', comparative: 'Comparativos', superlative: 'Superlativos',
      synonym: 'Sinónimos', antonym: 'Antónimos', phrase: 'Frases', expression: 'Expresiones',
      compound: 'Compuestas', coin: 'Pregunta / respuesta'
    };
    return labels[cat] || cat;
  }

  function drillApiBase(opts) {
    opts = opts || {};
    if (opts.demoMode) {
      return (typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com');
    }
    return '';
  }

  function mergeBrainProfile(student, profile) {
    if (!student || !profile) return;
    if (profile.jillRapidDrill) student.jillRapidDrill = profile.jillRapidDrill;
    if (profile.jillDrillProfile) student.jillDrillProfile = profile.jillDrillProfile;
    if (profile.reinforcement || profile.domain) {
      student.nemesisState = student.nemesisState || {};
      if (profile.reinforcement) student.nemesisState.reinforcement = profile.reinforcement;
      if (profile.domain) student.nemesisState.domain = profile.domain;
    }
    if (profile.weakCategories) {
      student.jillDrillProfile = student.jillDrillProfile || { weakCategories: {}, mastery: {}, lastFailures: [] };
      profile.weakCategories.forEach(function (c) {
        student.jillDrillProfile.weakCategories[c] = student.jillDrillProfile.weakCategories[c] || 1;
      });
    }
  }

  function completeDrillLocal(student, payload, opts) {
    opts = opts || {};
    var perfect = payload.correct === payload.total && payload.total > 0;
    var previewWin = payload.score >= WIN_SCORE_PCT;
    payload.wonRound = previewWin;
    payload.winStreak = previewWin ? ((student.jillRapidDrill && student.jillRapidDrill.winStreak) || 0) + 1 : 0;
    var rec = recordQuiz(student, payload);
    var winMeta = applyWinStreak(student, payload.score, perfect);
    if (payload.score >= 80) {
      if (!student.jillPulse) student.jillPulse = {};
      student.jillPulse.lastScore = payload.score;
      student.jillPulse.lastDate = new Date().toISOString();
      student.jillPulse.passed = true;
      if (student.jillMatrix) student.jillMatrix.pulseQuizPassed = true;
    }
    if (!opts.demoMode && student.id && typeof dbSet === 'function') {
      dbSet('infinity_students', student.id, student).catch(function () {});
    }
    return {
      xp: rec.xp || 0,
      unlocked: rec.unlocked || [],
      won: winMeta.won,
      jillRapidDrill: student.jillRapidDrill,
      nemesisState: student.nemesisState,
      jillDrillProfile: student.jillDrillProfile,
      quizWeakKpis: student.quizWeakKpis,
      jillGrowth: student.jillGrowth,
      jillPulse: student.jillPulse,
      source: 'local'
    };
  }

  function fetchBrainQuestions(student, activeBundle, count, opts) {
    opts = opts || {};
    var bid = bundleIdFromStudent(student, activeBundle);
    var qs = '?count=' + encodeURIComponent(count) + '&bundleId=' + encodeURIComponent(bid || '');
    if (opts.demoMode) {
      return fetch(drillApiBase(opts) + '/demo/jill/drill/questions' + qs)
        .then(function (r) { if (!r.ok) throw new Error('brain'); return r.json(); });
    }
    if (typeof infinityFetch === 'function') {
      return infinityFetch('/jill/drill/questions' + qs, { headers: typeof authHeaders === 'function' ? authHeaders() : {} })
        .then(function (r) { if (!r.ok) throw new Error('brain'); return r.json(); });
    }
    return Promise.reject(new Error('brain unavailable'));
  }

  function submitBrainComplete(student, payload, opts) {
    opts = opts || {};
    if (opts.demoMode) {
      return fetch(drillApiBase(opts) + '/demo/jill/drill/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: payload })
      }).then(function (r) { if (!r.ok) throw new Error('brain'); return r.json(); });
    }
    if (typeof infinityFetch === 'function') {
      return infinityFetch('/jill/drill/complete', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, typeof authHeaders === 'function' ? authHeaders() : {}),
        body: JSON.stringify({ result: payload })
      }).then(function (r) { if (!r.ok) throw new Error('brain'); return r.json(); });
    }
    return Promise.reject(new Error('brain unavailable'));
  }

  function questionsForCategory(cat) {
    if (typeof JillDrillBank !== 'undefined' && JillDrillBank.byCategory) {
      return JillDrillBank.byCategory(cat);
    }
    return [];
  }

  function allTaggedQuestions() {
    var out = CORE.slice();
    drillBankQuestions().forEach(function (q) { out.push(q); });
    FOUNDATIONS_DRILL.forEach(function (q) { out.push(q); });
    Object.keys(BY_BUNDLE).forEach(function (bid) {
      (BY_BUNDLE[bid] || []).forEach(function (q) {
        out.push(Object.assign({ bundleId: bid }, q));
      });
    });
    return out;
  }

  function questionFromQuizBank(kpi) {
    var bank = typeof QUIZ_BANK !== 'undefined' ? QUIZ_BANK : null;
    if (!bank || !bank[kpi]) return null;
    var b = bank[kpi];
    return {
      kpi: kpi,
      q: b.q,
      options: b.options.slice(),
      answer: b.answer,
      explain: b.explain || 'Refuerzo Rapid drill — practicá este tema con Jill.'
    };
  }

  function collectNemesisKpis(student) {
    var ordered = [];
    function add(k) {
      if (!k || ordered.indexOf(k) >= 0) return;
      ordered.push(k);
    }

    var ns = (student && student.nemesisState) || {};
    (ns.reinforcement || []).forEach(add);

    if (typeof NexusPortal !== 'undefined' && NexusPortal.collectFailedKpis) {
      NexusPortal.collectFailedKpis(student).forEach(add);
    } else {
      (student.quizWeakKpis || []).forEach(add);
      (student.quizzes || []).slice(-8).forEach(function (q) {
        (q.kpiResults || []).forEach(function (r) { if (!r.correct) add(r.kpi); });
      });
      (student.nemesisQuizzes || []).slice(-5).forEach(function (q) {
        (q.kpiResults || []).forEach(function (r) { if (!r.correct) add(r.kpi); });
      });
    }

    (student.jillProNemesis || []).slice(-5).forEach(function (q) {
      (q.kpiResults || []).forEach(function (r) { if (!r.correct) add(r.kpi); });
    });

    var lastKt = (student.kpiTracker || []).slice(-1)[0];
    if (lastKt && lastKt.weakest) lastKt.weakest.forEach(function (w) { add(w.id || w); });

    return ordered;
  }

  function kpiLabel(kpi) {
    if (typeof KPI_NAMES !== 'undefined' && KPI_NAMES[kpi]) return KPI_NAMES[kpi];
    return kpi;
  }

  /** Rapid drill = construcción real. Sin siglas ni fórmulas P+V+C. */
  function isRapidDrillQuestion(item) {
    if (!item || !item.q) return false;
    var q = String(item.q);
    var ql = q.toLowerCase();
    if (/\bsigla\b|\bfórmula\b|\bmsi®?\b|mecánica estructural|método moneda\b/i.test(ql)) return false;
    if (/\bp\s*\+\s*v|\bp\s*\+\s*m|\bto be\s*\+|\bhave\s*\+\s*pp\b/i.test(q)) return false;
    if (/\b(PR|PS|PC|PRP|PPC|MOD)\b/.test(q) && /\b=\b|sigla|fórmula/i.test(ql)) return false;
    var opts = item.options || [];
    for (var i = 0; i < opts.length; i++) {
      if (/P\s*\+\s*[VMC]|To Be\s*\+|Have\s*\+\s*PP|M\s*\+\s*V/i.test(String(opts[i]))) return false;
    }
    return true;
  }

  function renderNemesisTopics(student) {
    var kpis = collectNemesisKpis(student).slice(0, 6);
    var weakCats = collectWeakCategories(student).slice(0, 5);
    var rd = ensureRapidDrillStats(student);
    var tier = rapidDrillTier(student);
    var streakBar = (rd.winStreak || rd.bestWinStreak)
      ? '<div style="font-size:10px;color:#e9d5ff;text-align:center;margin-bottom:8px;font-weight:700;">🏆 Racha victorias: ' + (rd.winStreak || 0) + (rd.bestWinStreak ? ' · récord ' + rd.bestWinStreak : '') + ' · trofeos ' + (rd.trophies || 0) + '</div>'
      : '';
    var tierBar = tier !== 'none' ? tierBadgeHtml(tier) : '';
    if (!kpis.length && !weakCats.length) {
      return streakBar + tierBar + '<div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;margin-bottom:8px;">Rapid drill adapta preguntas a tus fallos — orden, tiempos, prep, números…</div>';
    }
    var catHtml = weakCats.length
      ? '<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:800;letter-spacing:0.08em;color:#fcd34d;margin-bottom:6px;">🎯 ÁREAS A REFORZAR</div>'
        + '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">'
        + weakCats.map(function (c) {
          return '<span style="font-size:10px;font-weight:700;background:rgba(239,68,68,0.15);border:1px solid rgba(248,113,113,0.45);color:#fecaca;padding:4px 10px;border-radius:16px;">' + esc(categoryLabel(c)) + '</span>';
        }).join('')
        + '</div></div>'
      : '';
    return streakBar + tierBar + catHtml + '<div style="margin-bottom:10px;">'
      + '<div style="font-size:10px;font-weight:800;letter-spacing:0.08em;color:#fcd34d;margin-bottom:6px;">⚡ TUS TEMAS RAPID DRILL</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">'
      + kpis.map(function (k) {
        return '<span style="font-size:10px;font-weight:700;background:rgba(245,166,35,0.18);border:1px solid rgba(245,166,35,0.45);color:#fde68a;padding:4px 10px;border-radius:16px;">' + esc(kpiLabel(k)) + '</span>';
      }).join('')
      + '</div></div>';
  }

  function pickMatrixQuestions(student, count) {
    if (typeof JillMatrixQuiz === 'undefined') return [];
    return JillMatrixQuiz.pickQuestions(student, count || QUESTIONS_PER_ROUND);
  }

  function pickNemesisQuestions(student, activeBundle, count) {
    count = count || QUESTIONS_PER_ROUND;
    var nemesisKpis = collectNemesisKpis(student);
    var bid = bundleIdFromStudent(student, activeBundle);
    if (bid === 'F0-matrix') {
      var matrixQs = pickMatrixQuestions(student, count);
      if (matrixQs.length >= Math.min(3, count)) return matrixQs.slice(0, count);
    }
    var pool = [];
    var seenQ = {};

    function pushQ(item) {
      if (!item || !item.q || seenQ[item.q]) return;
      if (!isRapidDrillQuestion(item)) return;
      seenQ[item.q] = true;
      pool.push(item);
    }

    var weakCats = collectWeakCategories(student);
    weakCats.forEach(function (cat) {
      shuffle(questionsForCategory(cat)).slice(0, 2).forEach(pushQ);
    });

    nemesisKpis.forEach(function (kpi) {
      var fromBank = questionFromQuizBank(kpi);
      if (fromBank) pushQ(fromBank);
      allTaggedQuestions().forEach(function (q) {
        if (q.kpi === kpi) pushQ(q);
      });
    });

    if (bid) {
      var bqs = BY_BUNDLE[bid] || BY_BUNDLE[resolveBundleId(bid)];
      if (bqs) bqs.forEach(function (q) {
        if (!nemesisKpis.length || nemesisKpis.indexOf(q.kpi) >= 0) pushQ(Object.assign({ bundleId: bid }, q));
      });
    }

    shuffle(drillBankQuestions()).slice(0, 4).forEach(function (q) { pushQ(q); });

    if (pool.length < count) {
      shuffle(allTaggedQuestions()).forEach(pushQ);
    }
    if (pool.length < count && typeof QUIZ_BANK !== 'undefined') {
      shuffle(Object.keys(QUIZ_BANK)).forEach(function (k) {
        if (pool.length >= count) return;
        pushQ(questionFromQuizBank(k));
      });
    }

    pool = shuffle(pool);
    return pool.slice(0, count);
  }

  function pickQuestions(student, activeBundle, count) {
    return pickNemesisQuestions(student, activeBundle, count);
  }

  function pickCoinQuestions(count) {
    count = count || 3;
    return shuffle(COIN_QUESTIONS).slice(0, count);
  }

  function updateNemesisState(student, kpiResults, score) {
    if (!student) return;
    if (!student.nemesisState) student.nemesisState = { domain: [], reinforcement: [] };
    if (!student.jillProNemesis) student.jillProNemesis = [];

    var byKpi = {};
    kpiResults.forEach(function (r) {
      if (!byKpi[r.kpi]) byKpi[r.kpi] = { ok: 0, fail: 0 };
      r.correct ? byKpi[r.kpi].ok++ : byKpi[r.kpi].fail++;
    });

    var domain = [];
    var reinforcement = [];
    Object.keys(byKpi).forEach(function (k) {
      var b = byKpi[k];
      var pct = b.ok / (b.ok + b.fail);
      if (pct >= 0.75) domain.push(k);
      else if (pct < 0.5) reinforcement.push(k);
    });

    student.nemesisState.domain = domain;
    student.nemesisState.reinforcement = reinforcement;
    student.nemesisState.lastJillProScore = score;
    student.nemesisState.lastJillProDate = new Date().toISOString();
    student.quizWeakKpis = reinforcement.concat(
      Object.keys(byKpi).filter(function (k) { return reinforcement.indexOf(k) < 0 && domain.indexOf(k) < 0; })
    );
  }

  function recordQuiz(student, result) {
    if (!student) return { xp: 0 };
    var xp = 0;
    var unlocked = [];

    if (typeof JillProgress !== 'undefined') {
      var g = JillProgress.ensureGrowth(student);
      xp = 8 + (result.correct || 0) * 6;
      if (result.correct === result.total && result.total > 0) xp += 22;
      if ((result.streak || 0) >= 3) xp += 10;
      if (result.nemesisMode) xp += 5;
      if (result.wonRound) xp += 15 + (result.winStreak || 0) * 4;
      g.xp = (g.xp || 0) + xp;
      student.jillGrowth = g;
      unlocked = JillProgress.checkBadges(student, {
        quizPerfect: result.correct === result.total && result.total > 0
      }) || [];
    }

    if (!student.jillProNemesis) student.jillProNemesis = [];
    var wrongKpis = (result.kpiResults || []).filter(function (r) { return !r.correct; }).map(function (r) { return r.kpi; });

    student.jillProNemesis.push({
      date: new Date().toISOString(),
      type: 'nemesis-kahoot',
      correct: result.correct,
      total: result.total,
      score: result.score,
      bundleId: result.bundleId || '',
      kpiResults: result.kpiResults || [],
      wrongKpis: wrongKpis,
      nemesisKpis: result.nemesisKpis || []
    });
    if (student.jillProNemesis.length > 25) student.jillProNemesis = student.jillProNemesis.slice(-25);

    if (!student.jillQuizzes) student.jillQuizzes = [];
    student.jillQuizzes.push({
      date: new Date().toISOString(),
      correct: result.correct,
      total: result.total,
      score: result.score,
      bundleId: result.bundleId || '',
      mode: 'jill-pro-nemesis',
      wrongKpis: wrongKpis
    });
    if (student.jillQuizzes.length > 30) student.jillQuizzes = student.jillQuizzes.slice(-30);

    updateNemesisState(student, result.kpiResults || [], result.score);
    updateDrillProfile(student, result.kpiResults || []);

    return { xp: xp, unlocked: unlocked };
  }

  function mount(rootEl, student, activeBundle, onDone, opts) {
    if (!rootEl) return;
    opts = opts || {};
    injectRapidDrillStyles();
    var rdStats = ensureRapidDrillStats(student);
    var tier = rapidDrillTier(student);
    if (rootEl.parentElement) {
      rootEl.parentElement.className = 'jill-rapid-tier-' + tier;
    }
    var nemesisKpis = collectNemesisKpis(student);
    var qCount = opts.questionCount || QUESTIONS_PER_ROUND;
    var brandLine = BRAND + ' · ' + MODE_LABEL + ' — completá tiempos, preguntas y construcción';
    var mountOpts = opts;

    rootEl.innerHTML = '<div style="text-align:center;padding:24px;color:#e9d5ff;font-size:13px;">'
      + '<div style="font-size:28px;margin-bottom:8px;">🧠</div>'
      + 'Cargando preguntas del cerebro…</div>';

    fetchBrainQuestions(student, activeBundle, qCount, mountOpts).then(function (data) {
      if (data && data.profile) mergeBrainProfile(student, data.profile);
      var qs = (data && data.questions && data.questions.length) ? data.questions : pickQuestions(student, activeBundle, qCount);
      startDrillRound(rootEl, student, activeBundle, onDone, mountOpts, qs, nemesisKpis, brandLine, qCount);
    }).catch(function () {
      var qs = pickQuestions(student, activeBundle, qCount);
      if (!qs.length) {
        rootEl.innerHTML = '<div style="text-align:center;padding:20px;color:#fecaca;font-size:13px;">'
          + 'No se pudo conectar al cerebro Jill. Verificá sesión o redeploy del backend.</div>';
        return;
      }
      startDrillRound(rootEl, student, activeBundle, onDone, mountOpts, qs, nemesisKpis, brandLine, qCount);
    });
  }

  function startDrillRound(rootEl, student, activeBundle, onDone, opts, quiz, nemesisKpis, brandLine, qCount) {
    if (!quiz.length) {
      rootEl.innerHTML = '<div style="text-align:center;padding:1rem;color:#fde68a;">Sin preguntas — practicá con Jill y volvé.</div>';
      return;
    }

    var state = {
      idx: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      answered: false,
      timer: null,
      timeLeft: TIMER_SEC,
      quiz: quiz,
      bundleId: bundleIdFromStudent(student, activeBundle),
      nemesisKpis: nemesisKpis,
      kpiResults: []
    };

    function clearTimer() {
      if (state.timer) { clearInterval(state.timer); state.timer = null; }
    }

    function renderGrid() {
      var q = state.quiz[state.idx];
      var pct = Math.round((state.timeLeft / TIMER_SEC) * 100);
      var timerColor = state.timeLeft <= 5 ? '#fca5a5' : '#c4b5fd';
      var tag = q.kpi ? '<span style="font-size:9px;background:rgba(245,166,35,0.25);color:#fde68a;padding:2px 8px;border-radius:10px;margin-bottom:8px;display:inline-block;">Kahoot · ' + esc(kpiLabel(q.kpi)) + '</span>' : '';
      return '<div id="jill-kahoot-inner" style="animation:jillKahootIn .35s ease;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;font-weight:800;color:#e9d5ff;">'
        + '<span>⚡ ' + MODE_LABEL + ' · ' + (state.idx + 1) + '/' + state.quiz.length + '</span>'
        + '<span title="Racha de aciertos">🔥 ' + state.streak + '</span>'
        + '<span>✓ ' + state.correct + '</span>'
        + '<span title="Racha de victorias">🏆 ' + (rdStats.winStreak || 0) + '</span>'
        + '</div>'
        + renderPressureScene(state)
        + '<div id="jill-kahoot-timer" style="height:6px;background:rgba(0,0,0,0.3);border-radius:6px;margin-bottom:14px;overflow:hidden;">'
        + '<div id="jill-kahoot-timer-fill" style="height:100%;width:' + pct + '%;background:' + timerColor + ';transition:width .9s linear;border-radius:6px;"></div></div>'
        + '<div style="text-align:center;">' + tag + '</div>'
        + '<div style="background:rgba(255,255,255,0.96);color:#1e1b4b;border-radius:16px;padding:16px 18px;font-size:16px;font-weight:800;line-height:1.45;margin-bottom:14px;text-align:center;min-height:72px;display:flex;align-items:center;justify-content:center;">'
        + esc(q.q)
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        + q.options.map(function (opt, i) {
          return '<button type="button" class="jill-kahoot-opt" data-idx="' + i + '" style="'
            + 'background:' + KAHOOT[i].bg + ';color:white;border:none;border-radius:14px;padding:16px 12px;'
            + 'font-size:14px;font-weight:800;cursor:pointer;min-height:72px;display:flex;align-items:center;gap:10px;'
            + 'box-shadow:0 4px 0 rgba(0,0,0,0.22);transition:transform .12s;">'
            + '<span style="font-size:20px;opacity:0.9;">' + KAHOOT[i].shape + '</span>'
            + '<span style="text-align:left;line-height:1.3;">' + esc(opt) + '</span>'
            + '</button>';
        }).join('')
        + '</div>'
        + '<div style="margin-top:12px;text-align:center;">'
        + '<button type="button" onclick="jillCloseKahootQuiz()" style="background:transparent;border:1px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.7);font-size:11px;padding:6px 14px;border-radius:8px;cursor:pointer;">Salir</button>'
        + '</div></div>';
    }

    function renderFeedback(wasCorrect) {
      var q = state.quiz[state.idx];
      var celebrate = wasCorrect ? renderMiniTrophy(state.streak) : '<div style="font-size:40px;margin-bottom:8px;">💥</div><div style="font-size:12px;color:#fca5a5;font-weight:800;margin-bottom:8px;">La llama avanzó — corregí y seguí</div>';
      return '<div style="text-align:center;padding:8px 0;">'
        + celebrate
        + '<div style="font-size:18px;font-weight:900;color:' + (wasCorrect ? '#86EFAC' : '#FCD34D') + ';margin-bottom:8px;">'
        + (wasCorrect ? '¡Acertaste bajo presión!' : 'Casi — correcta: ' + esc(q.options[q.answer]))
        + '</div>'
        + '<div style="font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;margin-bottom:16px;">' + esc(q.explain || '') + '</div>'
        + '<button type="button" id="jill-kahoot-next" style="background:linear-gradient(135deg,#5b21b6,#7c3aed);border:none;color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;cursor:pointer;">'
        + (state.idx + 1 < state.quiz.length ? 'Siguiente →' : 'Ver trofeos')
        + '</button></div>';
    }

    function renderResults() {
      clearTimer();
      var total = state.quiz.length;
      var score = Math.round((state.correct / total) * 100);
      var perfect = state.correct === total && total > 0;
      var previewWin = score >= WIN_SCORE_PCT;
      var payload = {
        correct: state.correct,
        total: total,
        score: score,
        streak: state.bestStreak,
        bundleId: state.bundleId,
        kpiResults: state.kpiResults,
        nemesisKpis: state.nemesisKpis,
        wonRound: previewWin,
        winStreak: previewWin ? ((student.jillRapidDrill && student.jillRapidDrill.winStreak) || 0) + 1 : 0
      };

      rootEl.innerHTML = '<div style="text-align:center;padding:20px;color:#e9d5ff;">🧠 Guardando en el cerebro…</div>';

      submitBrainComplete(student, payload, opts).then(function (brain) {
        paintBrainResults(brain);
      }).catch(function () {
        paintBrainResults(completeDrillLocal(student, payload, opts));
      });
    }

    function paintBrainResults(brain) {
        var rec = { xp: brain.xp || 0, unlocked: brain.unlocked || [] };
        if (brain.jillRapidDrill) student.jillRapidDrill = brain.jillRapidDrill;
        if (brain.nemesisState) student.nemesisState = brain.nemesisState;
        if (brain.jillDrillProfile) student.jillDrillProfile = brain.jillDrillProfile;
        if (brain.quizWeakKpis) student.quizWeakKpis = brain.quizWeakKpis;
        if (brain.jillGrowth) student.jillGrowth = brain.jillGrowth;
        if (brain.jillPulse) student.jillPulse = brain.jillPulse;
        if (brain.infinityVictory) student.infinityVictory = brain.infinityVictory;
        if (typeof InfinityVictory !== 'undefined') InfinityVictory.invalidateCache();
        if (typeof JillProgress !== 'undefined' && !opts.demoMode && !rec.unlocked.length) {
          rec.unlocked = JillProgress.checkBadges(student, { quizPerfect: perfect }) || [];
        }
        var winMeta = {
          won: !!brain.won,
          rd: student.jillRapidDrill || ensureRapidDrillStats(student)
        };
        var trophy = trophyForScore(score, perfect);
        paintResultsUI(winMeta, rec, trophy, score, perfect);
    }

    function paintResultsUI(winMeta, rec, trophy, score, perfect) {
      if (typeof showToast === 'function' && rec.xp) {
        showToast('+' + rec.xp + ' XP · ' + BRAND);
      }
      if (winMeta.won && typeof showToast === 'function') {
        setTimeout(function () {
          showToast('🏆 ' + trophy.title + ' · racha ' + winMeta.rd.winStreak);
        }, winMeta.won ? 450 : 0);
      }
      if (rec.unlocked && rec.unlocked.length && typeof JillProgress !== 'undefined' && typeof showToast === 'function') {
        var badgeMsg = JillProgress.renderNewBadgeToast(rec.unlocked);
        if (badgeMsg) setTimeout(function () { showToast(badgeMsg); }, 700);
      }

      var reinforce = (student.nemesisState && student.nemesisState.reinforcement) || [];
      var domain = (student.nemesisState && student.nemesisState.domain) || [];
      var streakLine = winMeta.won
        ? '<div class="jill-streak-pill" style="margin:10px auto 12px;">🏆 Victoria · racha ' + winMeta.rd.winStreak + (winMeta.rd.bestWinStreak > winMeta.rd.winStreak ? ' · récord ' + winMeta.rd.bestWinStreak : '') + '</div>'
        : '<div style="font-size:11px;color:#fca5a5;margin:8px 0;">Racha de victorias reiniciada — la llama sigue cerca</div>';

      rootEl.innerHTML = (winMeta.won ? renderConfettiBurst() : '')
        + '<div style="text-align:center;padding:12px 8px;">'
        + '<div class="jill-trophy-burst">' + trophy.icon + '</div>'
        + '<div style="font-size:13px;font-weight:900;color:#fcd34d;letter-spacing:.08em;margin-bottom:4px;">' + esc(trophy.title) + '</div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:8px;">' + esc(trophy.sub) + '</div>'
        + '<div style="font-size:11px;font-weight:800;color:#c4b5fd;letter-spacing:0.12em;margin-bottom:4px;">' + BRAND + '</div>'
        + '<div style="font-size:26px;font-weight:900;color:#e9d5ff;">' + state.correct + '/' + state.quiz.length + '</div>'
        + '<div style="font-size:14px;color:#ddd6fe;margin-bottom:6px;">' + score + '% · racha aciertos ' + state.bestStreak + '</div>'
        + streakLine
        + '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-bottom:10px;">Trofeos acumulados: ' + (winMeta.rd.trophies || 0) + ' · victorias: ' + (winMeta.rd.totalWins || 0) + '</div>'
        + (domain.length ? '<div style="font-size:11px;color:#86EFAC;margin-bottom:4px;">Dominio: ' + domain.map(kpiLabel).join(', ') + '</div>' : '')
        + (reinforce.length ? '<div style="font-size:11px;color:#fcd34d;margin-bottom:10px;">Sigue en refuerzo: ' + reinforce.map(kpiLabel).join(', ') + '</div>' : '')
        + '<div style="font-size:12px;color:rgba(255,255,255,0.75);margin-bottom:16px;">+' + (rec.xp || 0) + ' XP · perfil guardado en el cerebro (cascada a tutores)</div>'
        + '<button type="button" onclick="jillCloseKahootQuiz(true)" style="background:linear-gradient(135deg,#5b21b6,#7c3aed);border:none;color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;cursor:pointer;margin-right:8px;">Listo</button>'
        + '<button type="button" onclick="jillOpenKahootQuiz()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(167,139,250,0.5);color:#e9d5ff;font-weight:700;font-size:13px;padding:12px 20px;border-radius:12px;cursor:pointer;">Otra ronda Rapid drill</button>'
        + '</div>';
      if (typeof onDone === 'function') onDone({ correct: state.correct, total: state.quiz.length, score: score, xp: rec.xp });
    }

    function afterAnswer(wasCorrect, picked) {
      var q = state.quiz[state.idx];
      state.kpiResults.push({ kpi: q.kpi || 'k10', correct: wasCorrect, category: q.category || 'tense' });
      if (wasCorrect) {
        state.correct++;
        state.streak++;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
      } else {
        state.streak = 0;
      }
      rootEl.querySelectorAll('.jill-kahoot-opt').forEach(function (b, i) {
        b.disabled = true;
        b.style.opacity = i === q.answer ? '1' : (i === picked && !wasCorrect ? '0.55' : '0.35');
        b.style.transform = i === q.answer ? 'scale(1.03)' : 'none';
        b.style.boxShadow = i === q.answer ? '0 0 0 3px #fff' : 'none';
      });
      var fb = document.createElement('div');
      fb.style.marginTop = '14px';
      fb.innerHTML = renderFeedback(wasCorrect);
      rootEl.querySelector('#jill-kahoot-inner').appendChild(fb);
      var nextBtn = document.getElementById('jill-kahoot-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          state.idx++;
          state.answered = false;
          if (state.idx >= state.quiz.length) renderResults();
          else showQuestion();
        });
      }
    }

    function bindOptions() {
      rootEl.querySelectorAll('.jill-kahoot-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (state.answered) return;
          state.answered = true;
          clearTimer();
          var picked = parseInt(btn.getAttribute('data-idx'), 10);
          var q = state.quiz[state.idx];
          afterAnswer(picked === q.answer, picked);
        });
      });
    }

    function startTimer() {
      clearTimer();
      state.timeLeft = TIMER_SEC;
      state.timer = setInterval(function () {
        state.timeLeft--;
        var fill = document.getElementById('jill-kahoot-timer-fill');
        if (fill) {
          var pct = Math.max(0, Math.round((state.timeLeft / TIMER_SEC) * 100));
          fill.style.width = pct + '%';
          fill.style.background = state.timeLeft <= 5 ? '#fca5a5' : '#c4b5fd';
        }
        updatePressureDom(state);
        if (state.timeLeft <= 0 && !state.answered) {
          state.answered = true;
          clearTimer();
          state.streak = 0;
          var q = state.quiz[state.idx];
          rootEl.querySelectorAll('.jill-kahoot-opt').forEach(function (b, i) {
            b.disabled = true;
            b.style.opacity = i === q.answer ? '1' : '0.35';
          });
          state.kpiResults.push({ kpi: q.kpi || 'k10', correct: false, category: q.category || 'tense' });
          var fb = document.createElement('div');
          fb.style.marginTop = '14px';
          fb.innerHTML = '<div style="text-align:center;"><div style="font-size:32px;">⏱️</div>'
            + '<div style="color:#FCD34D;font-weight:800;margin:8px 0 12px;">Tiempo — seguí practicando este tema</div>'
            + '<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-bottom:14px;">Correcta: <strong>' + esc(q.options[q.answer]) + '</strong></div>'
            + '<button type="button" id="jill-kahoot-next" style="background:linear-gradient(135deg,#5b21b6,#7c3aed);border:none;color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;cursor:pointer;">'
            + (state.idx + 1 < state.quiz.length ? 'Siguiente →' : 'Ver resultado') + '</button></div>';
          rootEl.querySelector('#jill-kahoot-inner').appendChild(fb);
          document.getElementById('jill-kahoot-next').addEventListener('click', function () {
            state.idx++;
            state.answered = false;
            if (state.idx >= state.quiz.length) renderResults();
            else showQuestion();
          });
        }
      }, 1000);
    }

    function showQuestion() {
      rootEl.innerHTML = renderGrid();
      bindOptions();
      startTimer();
    }

    rootEl.innerHTML = '<div style="background:rgba(88,28,135,0.35);border:1px solid rgba(167,139,250,0.45);border-radius:16px;padding:14px;">'
      + '<div style="text-align:center;font-size:12px;color:#e9d5ff;font-weight:700;margin-bottom:6px;">' + esc(brandLine) + '</div>'
      + '<div style="text-align:center;font-size:10px;color:#fcd34d;margin-bottom:10px;font-weight:700;">🔥 La llama avanza hacia el polvorín — respondé antes de que explote la presión</div>'
      + '<div id="jill-kahoot-stage"></div></div>';
    var stage = document.getElementById('jill-kahoot-stage');
    rootEl = stage;
    showQuestion();
  }

  global.JillQuiz = {
    BRAND: BRAND,
    MODE_LABEL: MODE_LABEL,
    pickQuestions: pickQuestions,
    pickNemesisQuestions: pickNemesisQuestions,
    pickCoinQuestions: pickCoinQuestions,
    collectNemesisKpis: collectNemesisKpis,
    renderNemesisTopics: renderNemesisTopics,
    mount: mount,
    recordQuiz: recordQuiz,
    QUESTIONS_PER_ROUND: QUESTIONS_PER_ROUND,
    FOUNDATIONS_DRILL: FOUNDATIONS_DRILL
  };
})(typeof window !== 'undefined' ? window : this);
