/**
 * Jill Pro — Nemesis Quest Kahoot
 * Preguntas priorizadas por KPIs/temas que el estudiante falla (nemesis + quizzes + refuerzo Jill).
 */
(function (global) {
  'use strict';

  var BRAND = 'Jill Pulse';
  var MODE_LABEL = 'Foundations Quiz';

  var PULSE_OPTS = [
    { bg: '#5B21B6', shape: '⬡' },
    { bg: '#0a5c3c', shape: '⬢' },
    { bg: '#D97706', shape: '✦' },
    { bg: '#7C3AED', shape: '◇' }
  ];

  var KAHOOT = PULSE_OPTS;

  var TIMER_SEC = 15;
  var QUESTIONS_PER_ROUND = 5;

  var COIN_QUESTIONS = [
    { kpi: 'k3', topic: 'coin', q: 'Método Moneda: ¿Cuál es PREGUNTA?', options: ['You are ready.', 'Are you ready?', 'Ready you are?', 'You ready are?'], answer: 1, explain: 'Are a la izquierda de you → pregunta.' },
    { kpi: 'k3', topic: 'coin', q: 'Moneda: ¿Cuál es RESPUESTA?', options: ['Did she work?', 'She worked yesterday.', 'Work she did?', 'Did work she?'], answer: 1, explain: 'worked después de she → afirmación.' },
    { kpi: 'k3', topic: 'coin', q: 'Excepción moneda: WH-question válida…', options: ['You are what?', 'What are you doing?', 'Are what you?', 'Doing you what?'], answer: 1, explain: 'What primero; moneda aplica al bloque aux+pronombre.' },
    { kpi: 'k3', topic: 'coin', q: '¿Pregunta con Did?', options: ['He did go.', 'Did he go?', 'He go did?', 'Go did he?'], answer: 1, explain: 'Did antes del pronombre.' },
    { kpi: 'k14', topic: 'coin', q: 'Identificá rápido: pregunta', options: ['They are coming.', 'Are they coming?', 'Coming they are.', 'They coming are?'], answer: 1, explain: 'Velocidad + patrón moneda.' }
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

  var TENSE_SIGLA_QUESTIONS = [
    { kpi: 'k3', topic: 'tense', q: 'Sigla PR = …', options: ['P + V + C', 'P + To Be + ing', 'P + Have + PP', 'P + M + V'], answer: 0, explain: 'Presente simple.' },
    { kpi: 'k3', topic: 'tense', q: 'Sigla PC = …', options: ['P + V + C', 'P + To Be + V+ing', 'P + Have + PP', 'P + Had + PP'], answer: 1, explain: 'Presente continuo.' },
    { kpi: 'k3', topic: 'tense', q: 'I will go → fórmula', options: ['P + V + C', 'P + M + V', 'P + Have + PP', 'P + M + HAVE + PP'], answer: 1, explain: 'P + M + V (will = -RE).' },
    { kpi: 'k3', topic: 'tense', q: 'I could have done → fórmula', options: ['P + M + V', 'P + M + HAVE + PP', 'P + HAVE + PP', 'P + M + HAVE + BEEN + ing'], answer: 1, explain: 'Modal perfecto.' }
  ];

  var FOUNDATIONS_DRILL = COIN_QUESTIONS.concat(PREP_QUESTIONS).concat(ARTICLE_QUESTIONS).concat(TENSE_SIGLA_QUESTIONS);

  var CORE = [
    { kpi: 'k10', q: 'En el Método Nexus, un "chunk" es…', options: ['Una palabra suelta', 'Un bloque listo para usar', 'Solo gramática', 'Traducción literal'], answer: 1, explain: 'Los chunks son piezas que ensamblás sin traducir palabra por palabra.' },
    { kpi: 'k8', q: '¿Cuál conector muestra contraste?', options: ['on top of that', 'however', 'first of all', 'as well as'], answer: 1, explain: '"However" marca oposición entre ideas.' },
    { kpi: 'k9', q: 'Respuesta corta en inglés — ¿qué conviene agregar?', options: ['Nada más', 'Because + detalle', 'Solo "yes"', 'Cambiar a español'], answer: 1, explain: 'Expandí: Yes, because… on top of that…' },
    { kpi: 'k13', q: 'Si te trabás al hablar, lo mejor es…', options: ['Callar', '"Let me rephrase" y seguir', 'Colgar', 'Hablar más fuerte'], answer: 1, explain: 'Reparar y continuar — recovery sin presión.' },
    { kpi: 'k3', q: 'Foundations enseña inglés como…', options: ['Lista infinita', 'Mecánica Estructural Infinity®', 'Solo traducción', 'Memorizar diálogos'], answer: 1, explain: 'Piezas + reglas de conexión = Método Nexus.' }
  ];

  var BY_BUNDLE = {
    'F0-matrix': TENSE_SIGLA_QUESTIONS.concat(COIN_QUESTIONS.slice(0, 1)).concat(PREP_QUESTIONS.slice(0, 1)),
    'F1-msi': [
      { kpi: 'k3', q: 'Regla MSI®: después de HAVE va…', options: ['Infinitivo (-ing)', 'Participio', 'Modal solo', 'Artículo'], answer: 1, explain: 'HAVE → participio (been, worked…).' },
      { kpi: 'k10', q: 'Con TO BE en la cadena, el verbo principal suele ir en…', options: ['-ed', '-ing', 'infinitivo', 'sin verbo'], answer: 1, explain: 'TO BE → ING: I have been working.' },
      { kpi: 'k4', q: '¿Qué NO es el objetivo de la Mecánica Estructural Infinity®?', options: ['Ver piezas', 'Memorizar oraciones enteras', 'Diagramas', 'Reglas de conexión'], answer: 1, explain: 'No memorizar oraciones — ensamblar piezas.' }
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

  function allTaggedQuestions() {
    var out = CORE.slice();
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
      explain: b.explain || 'Refuerzo Nemesis — practicá este tema con Jill.'
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

  function renderNemesisTopics(student) {
    var kpis = collectNemesisKpis(student).slice(0, 6);
    if (!kpis.length) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:center;margin-bottom:8px;">Sin fallos recientes — Pulse mezcla tu módulo + estructura + KPIs</div>';
    }
    return '<div style="margin-bottom:10px;">'
      + '<div style="font-size:10px;font-weight:800;letter-spacing:0.08em;color:#fcd34d;margin-bottom:6px;">💀 TUS NEMESIS (temas a vencer)</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">'
      + kpis.map(function (k) {
        return '<span style="font-size:10px;font-weight:700;background:rgba(245,166,35,0.18);border:1px solid rgba(245,166,35,0.45);color:#fde68a;padding:4px 10px;border-radius:16px;">' + esc(kpiLabel(k)) + '</span>';
      }).join('')
      + '</div></div>';
  }

  function pickNemesisQuestions(student, activeBundle, count) {
    count = count || QUESTIONS_PER_ROUND;
    var nemesisKpis = collectNemesisKpis(student);
    var bid = bundleIdFromStudent(student, activeBundle);
    var pool = [];
    var seenQ = {};

    function pushQ(item) {
      if (!item || !item.q || seenQ[item.q]) return;
      seenQ[item.q] = true;
      pool.push(item);
    }

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

    shuffle(FOUNDATIONS_DRILL).slice(0, 2).forEach(function (q) { pushQ(q); });

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

    return { xp: xp, unlocked: unlocked };
  }

  function mount(rootEl, student, activeBundle, onDone) {
    if (!rootEl) return;
    var nemesisKpis = collectNemesisKpis(student);
    var quiz = pickNemesisQuestions(student, activeBundle);
    var brandLine = BRAND + ' · ' + MODE_LABEL + ' — estructura, tiempos, moneda, prep, vocab';
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
      var tag = q.kpi ? '<span style="font-size:9px;background:rgba(245,166,35,0.25);color:#fde68a;padding:2px 8px;border-radius:10px;margin-bottom:8px;display:inline-block;">Pulse · ' + esc(kpiLabel(q.kpi)) + '</span>' : '';
      return '<div id="jill-kahoot-inner" style="animation:jillKahootIn .35s ease;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;font-weight:800;color:#e9d5ff;">'
        + '<span>⚡ ' + MODE_LABEL + ' · ' + (state.idx + 1) + '/' + state.quiz.length + '</span>'
        + '<span>🔥 ' + state.streak + '</span>'
        + '<span>✓ ' + state.correct + '</span>'
        + '</div>'
        + '<div style="height:6px;background:rgba(0,0,0,0.3);border-radius:6px;margin-bottom:14px;overflow:hidden;">'
        + '<div style="height:100%;width:' + pct + '%;background:' + timerColor + ';transition:width .9s linear;border-radius:6px;"></div></div>'
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
      return '<div style="text-align:center;padding:8px 0;">'
        + '<div style="font-size:42px;margin-bottom:8px;">' + (wasCorrect ? '🎉' : '💀') + '</div>'
        + '<div style="font-size:20px;font-weight:900;color:' + (wasCorrect ? '#86EFAC' : '#FCD34D') + ';margin-bottom:8px;">'
        + (wasCorrect ? '¡Nemesis vencido!' : 'Casi — correcta: ' + esc(q.options[q.answer]))
        + '</div>'
        + '<div style="font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6;margin-bottom:16px;">' + esc(q.explain || '') + '</div>'
        + '<button type="button" id="jill-kahoot-next" style="background:linear-gradient(135deg,#5b21b6,#7c3aed);border:none;color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;cursor:pointer;">'
        + (state.idx + 1 < state.quiz.length ? 'Siguiente →' : 'Ver resultado')
        + '</button></div>';
    }

    function renderResults() {
      clearTimer();
      var total = state.quiz.length;
      var score = Math.round((state.correct / total) * 100);
      var emoji = score >= 80 ? '🏆' : score >= 60 ? '⚡' : '💀';
      var rec = recordQuiz(student, {
        correct: state.correct,
        total: total,
        score: score,
        streak: state.bestStreak,
        bundleId: state.bundleId,
        kpiResults: state.kpiResults,
        nemesisKpis: state.nemesisKpis,
        nemesisMode: true
      });
      if (student && score >= 70) {
        if (!student.jillPulse) student.jillPulse = {};
        student.jillPulse.lastScore = score;
        student.jillPulse.lastDate = new Date().toISOString();
        if (score >= 80) {
          student.jillPulse.passed = true;
          if (student.jillMatrix) student.jillMatrix.pulseQuizPassed = true;
        }
      }
      if (student && student.id && typeof dbSet === 'function') {
        dbSet('infinity_students', student.id, student).catch(function () {});
      }
      if (typeof showToast === 'function' && rec.xp) {
        showToast('+' + rec.xp + ' XP · ' + BRAND);
      }
      if (rec.unlocked && rec.unlocked.length && typeof JillProgress !== 'undefined' && typeof showToast === 'function') {
        var badgeMsg = JillProgress.renderNewBadgeToast(rec.unlocked);
        if (badgeMsg) setTimeout(function () { showToast(badgeMsg); }, 700);
      }

      var reinforce = (student.nemesisState && student.nemesisState.reinforcement) || [];
      var domain = (student.nemesisState && student.nemesisState.domain) || [];

      rootEl.innerHTML = '<div style="text-align:center;padding:12px 8px;">'
        + '<div style="font-size:48px;margin-bottom:8px;">' + emoji + '</div>'
        + '<div style="font-size:11px;font-weight:800;color:#c4b5fd;letter-spacing:0.12em;margin-bottom:4px;">' + BRAND + '</div>'
        + '<div style="font-size:26px;font-weight:900;color:#e9d5ff;">' + state.correct + '/' + total + '</div>'
        + '<div style="font-size:14px;color:#ddd6fe;margin-bottom:8px;">' + score + '% · racha ' + state.bestStreak + '</div>'
        + (domain.length ? '<div style="font-size:11px;color:#86EFAC;margin-bottom:4px;">Dominio: ' + domain.map(kpiLabel).join(', ') + '</div>' : '')
        + (reinforce.length ? '<div style="font-size:11px;color:#fcd34d;margin-bottom:10px;">Sigue en refuerzo: ' + reinforce.map(kpiLabel).join(', ') + '</div>' : '')
        + '<div style="font-size:12px;color:rgba(255,255,255,0.75);margin-bottom:16px;">+' + (rec.xp || 0) + ' XP · Jill usará tus fallos en la próxima sesión</div>'
        + '<button type="button" onclick="jillCloseKahootQuiz(true)" style="background:linear-gradient(135deg,#5b21b6,#7c3aed);border:none;color:white;font-weight:800;font-size:15px;padding:12px 28px;border-radius:12px;cursor:pointer;margin-right:8px;">Listo</button>'
        + '<button type="button" onclick="jillOpenKahootQuiz()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(167,139,250,0.5);color:#e9d5ff;font-weight:700;font-size:13px;padding:12px 20px;border-radius:12px;cursor:pointer;">Otra ronda Nemesis</button>'
        + '</div>';
      if (typeof onDone === 'function') onDone({ correct: state.correct, total: total, score: score, xp: rec.xp });
    }

    function afterAnswer(wasCorrect, picked) {
      var q = state.quiz[state.idx];
      state.kpiResults.push({ kpi: q.kpi || 'k10', correct: wasCorrect });
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
        var inner = rootEl.querySelector('#jill-kahoot-inner');
        if (inner) {
          var track = inner.children[1];
          if (track && track.firstElementChild) {
            var pct = Math.max(0, Math.round((state.timeLeft / TIMER_SEC) * 100));
            track.firstElementChild.style.width = pct + '%';
            track.firstElementChild.style.background = state.timeLeft <= 5 ? '#fca5a5' : '#c4b5fd';
          }
        }
        if (state.timeLeft <= 0 && !state.answered) {
          state.answered = true;
          clearTimer();
          state.streak = 0;
          var q = state.quiz[state.idx];
          rootEl.querySelectorAll('.jill-kahoot-opt').forEach(function (b, i) {
            b.disabled = true;
            b.style.opacity = i === q.answer ? '1' : '0.35';
          });
          state.kpiResults.push({ kpi: q.kpi || 'k10', correct: false });
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

    rootEl.innerHTML = '<style>@keyframes jillKahootIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}</style>'
      + '<div style="background:rgba(88,28,135,0.35);border:1px solid rgba(167,139,250,0.45);border-radius:16px;padding:14px;">'
      + '<div style="text-align:center;font-size:12px;color:#e9d5ff;font-weight:700;margin-bottom:10px;">' + esc(brandLine) + '</div>'
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
