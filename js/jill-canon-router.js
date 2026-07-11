/**
 * Jill DJ — pickTrack: mensaje del estudiante → track del catálogo Foundations.
 * Una sola fuente: config/jill-canon-map.json
 */
(function (global) {
  'use strict';

  var EMBEDDED_MAP = {
    "version": 2,
    "title": "Jill DJ — Foundations canon tracks",
    "tracks": [
      {
        "id": "modal_have_been",
        "svg": "assets/canon/modal-have-been-ing.svg",
        "title": "Pronombre + Modal + Have Been + Verbo ING",
        "formula": "pronombre + modal + have + been + VERBO + ING + complemento",
        "example": "She must have been working.",
        "never": [
          "presente continuo solo",
          "have been sin modal",
          "moneda"
        ],
        "aliases": [
          "modal have been",
          "must have been",
          "should have been",
          "could have been",
          "may have been",
          "might have been",
          "would have been",
          "modal + have been",
          "have been despues del modal",
          "must have been working",
          "should have been working",
          "could have been working",
          "modal + have been + ing"
        ],
        "bridge": "Puente: must have been working = debió haber estado trabajando (modal + have + been + VERBO+ING)."
      },
      {
        "id": "modal_have_pp",
        "svg": "assets/canon/modal-have-pp.svg",
        "title": "Modal + Have + Participio",
        "formula": "modal + have + PARTICIPIO (should/could/must have + participio)",
        "example": "You should have studied more.",
        "never": [
          "have been + ing",
          "pasado simple solo",
          "moneda",
          "gerundio"
        ],
        "aliases": [
          "should have",
          "could have",
          "would have",
          "must have",
          "might have",
          "may have",
          "modal + have + participio",
          "modal have participio",
          "estructura + sensacion",
          "should have studied",
          "must have forgotten",
          "modal + have",
          "deberia haber",
          "podria haber"
        ],
        "bridge": "Puente: should have = debería haber + participio; could have = podría haber. NO es futuro perfecto (will have)."
      },
      {
        "id": "future_perfect",
        "svg": "assets/canon/tiempos-prp.svg",
        "title": "Futuro perfecto · will have + participio",
        "formula": "pronombre + will + have + PARTICIPIO + complemento",
        "example": "I will have finished by Friday.",
        "never": [
          "futuro simple will + base sin have",
          "should have / could have (eso es modal + have)",
          "presente perfecto sin will",
          "pasado perfecto had"
        ],
        "aliases": [
          "futuro perfecto",
          "future perfect",
          "will have",
          "will have + participio",
          "will have finished",
          "will have done",
          "explicame el futuro perfecto",
          "explicame futuro perfecto",
          "el futuro perfecto",
          "enseña el futuro perfecto",
          "ensename el futuro perfecto",
          "quiero el futuro perfecto",
          "will have + participle"
        ],
        "bridge": "Puente: will have + participio = habrá / habré + participio (acción terminada antes de un punto futuro). I will have finished = yo habré terminado. NO es should have."
      },
      {
        "id": "combined",
        "svg": "assets/canon/have-been-ing.svg",
        "title": "Pronombre + Have + Been + Verbo (ING)",
        "formula": "pronombre + have/has/had + been + VERBO + ING + complemento",
        "example": "I have been studying English.",
        "never": [
          "presente continuo sin have",
          "presente perfecto sin been",
          "gerundio-prep"
        ],
        "aliases": [
          "have been",
          "has been",
          "had been",
          "have + been",
          "been + ing",
          "been + v + ing",
          "perfecto continuo",
          "present perfect continuous",
          "presente perfecto continuo",
          "ppc",
          "have been + v"
        ],
        "bridge": "Puente: have been + VERBO+ING = he estado + ando/endo (duración hasta ahora)."
      },
      {
        "id": "have_had",
        "svg": "assets/canon/have-had.svg",
        "title": "Have / Has / Had",
        "formula": "have. has. had. — paradigm con pausa",
        "example": "I have finished. / I had finished.",
        "never": [
          "to have posesion / there is",
          "pasado simple sin had auxiliar"
        ],
        "aliases": [
          "have y had",
          "have vs had",
          "has vs had",
          "have/has/had",
          "have has had",
          "diferencia entre have y had",
          "have had",
          "had",
          "qué es had",
          "que es had",
          "what is had",
          "el had",
          "had auxiliar",
          "forma had",
          "have has y had",
          "tres formas de have"
        ],
        "bridge": "Puente: have/has/had — decir con pausa: have. has. had."
      },
      {
        "id": "if_was_were",
        "svg": "assets/canon/if-was-were.svg",
        "title": "If I was / If I were / If I were to",
        "formula": "was = pasado real/posible | were = hipótesis irreal | were to = futuro poco probable",
        "example": "If I were rich, I would travel.",
        "never": [
          "pasado simple sin if",
          "modales sueltos"
        ],
        "aliases": [
          "if i was",
          "if i were",
          "if i were to",
          "was vs were",
          "were vs was",
          "if was",
          "if were",
          "segundo condicional",
          "second conditional",
          "condicional hipotetico",
          "hipotesis irreal",
          "was were"
        ],
        "bridge": "Puente: was = pasado real; were = hipótesis irreal (If I were…); were to = poco probable."
      },
      {
        "id": "irregular_verbs",
        "svg": "assets/canon/verbos-irregulares.svg",
        "title": "Verbos irregulares (Presente / PS / Participio)",
        "formula": "Col1 PRESENTE | Col2 PASADO | Col3 PARTICIPIO — decir con pausa: go. went. gone.",
        "example": "go. went. gone. / do. did. done. — NUNCA pegado",
        "never": [
          "pasado simple como unica columna",
          "presente perfecto sin lista"
        ],
        "aliases": [
          "verbos irregulares",
          "verbo irregular",
          "irregular verbs",
          "irregular verb",
          "lista de irregulares",
          "tres columnas",
          "3 columnas",
          "presente pasado participio",
          "1a 2a 3a columna",
          "irregulares"
        ],
        "bridge": "Puente: col1 presente / col2 pasado / col3 participio — siempre con pausa: go. went. gone."
      },
      {
        "id": "there",
        "svg": "assets/canon/there-existencial.svg",
        "title": "There is / There are / To Have / Exist",
        "formula": "There is + 1 | There are + 2+ | Sujeto + have/has (posesión) | There exist(s) (formal)",
        "example": "There is a book on the table. / I have a book.",
        "never": [
          "thee is",
          "gerundio",
          "have como perfecto auxiliar",
          "presente continuo"
        ],
        "aliases": [
          "there is",
          "there are",
          "there was",
          "there were",
          "is there",
          "are there",
          "existencial",
          "there be",
          "hay vs tener",
          "tener vs hay",
          "there is vs have",
          "there exists",
          "there is y there are",
          "hay vs there",
          "explicame hay",
          "qué es hay",
          "que es hay"
        ],
        "bridge": "Puente: There is = hay (1); There are = hay (2+); have/has = posesión (no “hay”)."
      },
      {
        "id": "gerundio",
        "svg": "assets/canon/gerundio-prep.svg",
        "title": "Gerundio = VERBO + ING como sustantivo",
        "formula": "VERBO + ING (= ando/endo) funciona como SUSTANTIVO. Tras prep: preposición + VERBO + ING.",
        "example": "I like running. / Playing guitar is fun.",
        "never": [
          "presente continuo (am/is/are + ing)",
          "IN ON AT lugar"
        ],
        "aliases": [
          "gerundio",
          "el gerundio",
          "que es el gerundio",
          "qué es el gerundio",
          "imagen del gerundio",
          "imagen gerundio",
          "sustantivo con -ing",
          "v-ing como sustantivo",
          "gerund",
          "el gerund",
          "que es gerundio"
        ],
        "bridge": "Puente: VERBO+ING = ando/endo como sustantivo (I like running = me gusta correr/corriendo)."
      },
      {
        "id": "gerund_prep",
        "svg": "assets/canon/gerundio-prep.svg",
        "title": "Gerundio despues de preposicion",
        "formula": "preposición (before/after/without/by/good at) + VERBO + ING (= ando/endo) + complemento",
        "example": "Before leaving, call me. (saliendo → leaving)",
        "never": [
          "presente continuo",
          "IN ON AT como tema",
          "preposiciones lugar"
        ],
        "aliases": [
          "gerundio despues de preposicion",
          "gerundio tras prep",
          "prep + ing",
          "before leaving",
          "after working",
          "without saying",
          "good at",
          "interested in going",
          "afraid of",
          "instead of",
          "despues de preposicion"
        ],
        "bridge": "Puente: tras prep, VERBO+ING = ando/endo (Before leaving = antes de salir/saliendo)."
      },
      {
        "id": "prepositions_time",
        "svg": "assets/canon/preposiciones-tiempo.svg",
        "title": "Preposiciones de tiempo",
        "formula": "IN (mes/año/parte del día) | ON (día/fecha) | AT (hora puntual)",
        "example": "We meet on Monday in March at 5 pm.",
        "never": [
          "gerundio",
          "preposiciones lugar sin tiempo",
          "presente continuo"
        ],
        "aliases": [
          "preposiciones de tiempo",
          "preposicion de tiempo",
          "prep tiempo",
          "in the morning",
          "in the afternoon",
          "on monday",
          "on friday",
          "at 5",
          "in march",
          "preposiciones tiempo"
        ],
        "bridge": "Puente: IN = mes/año/parte del día; ON = día/fecha; AT = hora puntual."
      },
      {
        "id": "prepositions",
        "svg": "assets/canon/preposiciones.svg",
        "title": "Preposiciones IN ON AT BY",
        "formula": "IN = dentro | ON = encima/superficie | AT = punto exacto | BY = medio — van en el complemento",
        "example": "The book is on the table. / I am at home.",
        "never": [
          "gerundio",
          "gerundio-prep",
          "presente continuo",
          "V-ing",
          "there is"
        ],
        "aliases": [
          "preposiciones",
          "preposicion",
          "prepositions",
          "prep",
          "in on at",
          "in on y at",
          "in, on, at",
          "in/on/at",
          "in on at by",
          "at in on",
          "on at in",
          "by car",
          "by bus",
          "in the box",
          "on the table",
          "at the office",
          "at home",
          "explicame in on at",
          "corregime in on at",
          "in on",
          "on at"
        ],
        "bridge": "Puente: IN = dentro; ON = encima; AT = punto; BY = medio — van en el complemento."
      },
      {
        "id": "negations",
        "svg": "assets/canon/negaciones.svg",
        "title": "Negaciones - AUX + NOT",
        "formula": "pronombre + auxiliar + not + verbo + complemento",
        "example": "I do not work. / She doesn't go.",
        "never": [
          "modales sin not",
          "moneda"
        ],
        "aliases": [
          "negaciones",
          "negations",
          "don't",
          "doesn't",
          "didn't",
          "isn't",
          "aren't",
          "won't",
          "haven't",
          "aux + not",
          "auxiliar + not",
          "negacion",
          "negación"
        ],
        "bridge": "Puente: auxiliar + not + verbo base (I do not work — nunca “I no work”)."
      },
      {
        "id": "comparatives",
        "svg": "assets/canon/comparativos.svg",
        "title": "Comparativos",
        "formula": "adjetivo-er / more + adjetivo + than | the + adjetivo-est / most + adjetivo | as + adjetivo + as",
        "example": "She is taller than me.",
        "never": [
          "preposiciones",
          "modales"
        ],
        "aliases": [
          "comparativos",
          "comparativo",
          "superlativos",
          "superlativo",
          "more than",
          "less than",
          "as as",
          "mejor que",
          "peor que",
          "the most",
          "the least"
        ],
        "bridge": "Puente: -er/more + than = más… que; -est/most = el más…; as…as = tan…como."
      },
      {
        "id": "articles",
        "svg": "assets/canon/articulos.svg",
        "title": "Articulos a/an/the",
        "formula": "a/an (indefinido) | the (definido) | much/many/a lot of",
        "example": "I see a cat. / The cat is black.",
        "never": [
          "presente perfecto",
          "there is como articulo"
        ],
        "aliases": [
          "articulos",
          "articulo",
          "articles",
          "a/an",
          "indefinido",
          "definido",
          "cuantificadores",
          "much/many",
          "a lot of",
          "a an the",
          "a/an/the"
        ],
        "bridge": "Puente: a/an = uno/una (indefinido); the = el/la (definido)."
      },
      {
        "id": "progressive",
        "svg": "assets/canon/presente-continuo.svg",
        "title": "Pronombre + To Be + Verbo (ING)",
        "formula": "pronombre + am/is/are + VERBO + ING (= ando/endo) + complemento",
        "example": "I am studying English now.",
        "never": [
          "gerundio-prep",
          "have been + ing",
          "pasado simple",
          "IN ON AT"
        ],
        "aliases": [
          "presente continuo",
          "present continuous",
          "pc",
          "to be + verbo",
          "to be + ing",
          "to be + v + ing",
          "ahora mismo",
          "pronombre + to be",
          "continuo",
          "el continuo",
          "ing continuo"
        ],
        "bridge": "Puente: am/is/are + VERBO+ING = estoy/está + ando/endo (presente continuo, no gerundio suelto)."
      },
      {
        "id": "perfect",
        "svg": "assets/canon/tiempos-prp.svg",
        "title": "Pronombre + Have/Has + Participio",
        "formula": "have/has + PARTICIPIO (presente perfecto) vs had + PARTICIPIO (pasado perfecto)",
        "example": "He has done it.",
        "never": [
          "pasado simple",
          "have been + ing",
          "articulos",
          "to have posesion"
        ],
        "aliases": [
          "presente perfecto",
          "present perfect",
          "pasado perfecto",
          "past perfect",
          "pasada perfecto",
          "prp",
          "have/has + participio",
          "have has participio",
          "had + participio",
          "had participio",
          "pronombre + have + participio",
          "perfecto",
          "el perfecto",
          "qué es had",
          "que es had",
          "what is had",
          "omission of had",
          "omisión de had",
          "omitir had",
          "had en pasado perfecto",
          "had en el perfecto",
          "jaf jas jad",
          "explicame el pasado perfecto",
          "explicame pasado perfecto"
        ],
        "bridge": "Puente: have/has + participio = he/ha + participio; had + participio = había + participio (pasado perfecto). Empezá en voz: jaf. jas. jad. NO es pasado simple (worked/went)."
      },
      {
        "id": "past",
        "svg": "assets/canon/tiempos-ps.svg",
        "title": "Pasado simple PS",
        "formula": "pronombre + verbo(pasado) + complemento",
        "example": "She worked yesterday.",
        "never": [
          "presente perfecto",
          "pasado perfecto",
          "past perfect",
          "have/has/had + participio",
          "presente simple",
          "moneda",
          "continuo"
        ],
        "aliases": [
          "pasado simple",
          "past simple",
          "ps",
          "explicame el pasado simple",
          "explicame pasado simple",
          "pasado",
          "el pasado",
          "pizarron del pasado",
          "imagen del pasado"
        ],
        "bridge": "Puente: verbo en pasado (worked / went) = ayer/acción terminada. NO es pasado perfecto (had + participio)."
      },
      {
        "id": "present",
        "svg": "assets/canon/tiempos-pr.svg",
        "title": "Presente simple PR",
        "formula": "pronombre + verbo + complemento (he/she/it + verbo+s)",
        "example": "I go home every day.",
        "never": [
          "presente continuo",
          "presente perfecto",
          "pasado simple"
        ],
        "aliases": [
          "presente simple",
          "present simple",
          "pr",
          "habitos",
          "habits",
          "todos los dias",
          "every day",
          "he/she/it + s",
          "explicame el presente simple",
          "presente",
          "el presente"
        ],
        "bridge": "Puente: hábito/hecho; he/she/it lleva verbo+s (she works)."
      },
      {
        "id": "modales",
        "svg": "assets/canon/modales.svg",
        "title": "Pronombre + Modal + Verbo",
        "formula": "pronombre + modal + verbo(base, sin to) + complemento",
        "example": "I can work. / She should study.",
        "never": [
          "metodo moneda",
          "inversion",
          "have + participio",
          "gerundio"
        ],
        "aliases": [
          "modales",
          "pronombre + modal",
          "explicame modales",
          "los modales",
          "will",
          "would",
          "willy",
          "wood",
          "will y would",
          "would y will",
          "will would",
          "can",
          "could",
          "should",
          "must",
          "may",
          "might",
          "modal will",
          "modal would",
          "como funciona will",
          "como funciona would",
          "explicame will",
          "explicame would"
        ],
        "bridge": "Puente: will=-ré; would=-ría; should=debería; can=puedo; could=podría — modal + verbo base (sin to)."
      },
      {
        "id": "modal",
        "svg": "assets/canon/moneda.svg",
        "title": "Metodo moneda (inversion)",
        "formula": "verbo auxiliar ANTES del pronombre = pregunta | DESPUÉS del pronombre = respuesta",
        "example": "Are you coming? / You are coming.",
        "never": [
          "modales can/should",
          "there is",
          "gerundio"
        ],
        "aliases": [
          "moneda",
          "metodo moneda",
          "metodo de la moneda",
          "inversion",
          "are you",
          "v + p",
          "pregunta / respuesta",
          "la moneda",
          "metodo de moneda"
        ],
        "bridge": "Puente: método moneda — auxiliar ANTES del pronombre = pregunta; DESPUÉS = respuesta."
      },
      {
        "id": "future",
        "svg": "assets/canon/tiempos-fut.svg",
        "title": "Futuro will / going to",
        "formula": "pronombre + will + verbo + complemento | pronombre + be + going to + verbo + complemento",
        "example": "I will call you tomorrow. / I am going to study.",
        "never": [
          "futuro perfecto (will have + participio — otro módulo)",
          "modales should",
          "pasado simple"
        ],
        "aliases": [
          "futuro simple",
          "future simple",
          "futuro",
          "future",
          "el futuro",
          "going to",
          "will going to",
          "be going to",
          "explicame el futuro simple",
          "futuro will",
          "will y going to"
        ],
        "bridge": "Puente: will = -ré (decisión/espontáneo); going to = voy a (plan/intención). Si piden futuro PERFECTO → will have + participio (otro track)."
      },
      {
        "id": "overview",
        "svg": "assets/canon/tiempos.svg",
        "title": "Tiempos overview",
        "formula": "presente simple | pasado simple | presente continuo | presente perfecto | futuro",
        "example": "I work / I worked / I am working / I have worked",
        "never": [
          "un solo tiempo como si fuera overview"
        ],
        "aliases": [
          "tiempos verbales",
          "tiempos",
          "siglas pr",
          "matriz de tiempos",
          "overview tiempos",
          "todos los tiempos",
          "matriz"
        ],
        "bridge": "Puente: PR=presente simple; PS=pasado simple; PC=presente continuo; PRP=presente perfecto."
      }
    ]
  };

  var MAP = EMBEDDED_MAP;
  var LOAD = null;
  var CACHE_VER = '20260711clean';
  var VOICE_PACK = {
    tracks: {
      gerundio: {
        say: "Mucha gente se confunde con el í ene ge. Tres formas: uno, to be más verbo más í ene ge es progreso — ando endo. Sin to be no hay ese progresivo. Dos, verbo más í ene ge sin to be es actividad general: I like watching TV. Tres, to más verbo es intención: I like to watch TV. Mirás el tablero y practicás una oral."
      },
      progressive: {
        say: "Presente progresivo: to be más verbo más í ene ge es acción en progreso — ando endo. Ejemplo: I am watching TV. Sin to be no hay progresivo. No lo confundás con I like watching, que es general, ni con I like to watch, que es intención."
      },
      gerund_prep: {
        say: "Tras prep, verbo más í ene ge igual a ando endo. Before leaving. No lleva am is are."
      },
      past: {
        say: "Pasado simple = foto terminada de ayer. Verbo en pasado + yesterday/ago/last. No es have + participio."
      },
      modales: {
        say: "Will = -ré; would = -ría; should = debería; can = puedo. Modal + verbo base."
      },
      there: {
        say: "There is/are = hay. Have/has = posesión."
      }
    }
  };

  function loadVoicePack() {
    try {
      fetch('config/john-voice-scripts.json?v=' + CACHE_VER)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && data.tracks) VOICE_PACK = data;
        })
        .catch(function () { /* keep embedded */ });
    } catch (e) { /* ignore */ }
  }
  loadVoicePack();

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\/|,;]+/g, ' ')
      .replace(/\by\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function loadMap() {
    if (MAP) return Promise.resolve(MAP);
    if (LOAD) return LOAD;
    LOAD = fetch('config/jill-canon-map.json?v=' + CACHE_VER)
      .then(function (r) { return r.ok ? r.json() : { tracks: [] }; })
      .then(function (data) {
        MAP = data || { tracks: [] };
        return MAP;
      })
      .catch(function () {
        MAP = { tracks: [] };
        return MAP;
      });
    return LOAD;
  }

  function setMap(data) {
    MAP = data || { tracks: [] };
  }

  function tracks() {
    return (MAP && MAP.tracks) || [];
  }

  function trackById(id) {
    if (!id) return null;
    var list = tracks();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  /** Longest alias win; tie → earlier track in catalog (more specific). */
  function pickTrackExact(text) {
    var n = normalize(text);
    if (!n || n.length < 2) return null;
    var best = null;
    var bestLen = 0;
    var list = tracks();
    for (var i = 0; i < list.length; i++) {
      var tr = list[i];
      var aliases = tr.aliases || [];
      for (var j = 0; j < aliases.length; j++) {
        var a = normalize(aliases[j]);
        if (!a || a.length < 2) continue;
        if (n.indexOf(a) === -1) continue;
        // Short tokens (can, will, pr) must be whole words
        if (a.length <= 3) {
          var re = new RegExp('\\b' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
          if (!re.test(n)) continue;
        }
        if (a.length > bestLen) {
          bestLen = a.length;
          best = tr;
        }
      }
    }
    return best;
  }

  function pickTrack(text) {
    var raw = String(text || '');
    var expanded = (typeof JillLearnerIntent !== 'undefined' && JillLearnerIntent.expand)
      ? JillLearnerIntent.expand(raw)
      : raw;
    return pickTrackExact(expanded) || pickTrackExact(raw);
  }

  function pickTrackId(text) {
    var t = pickTrack(text);
    return t ? t.id : null;
  }

  function wantsVisual(text) {
    return /\b(imagen|pizarr[oó]n|whiteboard|tablero|visual|diagrama|cuadro)\b/i.test(String(text || ''));
  }

  function stripAskShell(text) {
    var t = String(text || '');
    t = t.replace(/\b(dame|d[aá]me|mostr[aá]me|mu[eé]strame|mostrar|ense[nñ]ame|ense[nñ][aá]|ver|abrir|pon[eé]me|trae|quiero|necesito|explicame|expl[ií]came|explic[aá]|explica)\b/gi, ' ');
    t = t.replace(/\b(la|el|una|un)\s+(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
    t = t.replace(/\b(imagen|pizarr[oó]n|tablero|whiteboard|visual|diagrama|cuadro)\b/gi, ' ');
    t = t.replace(/\b(de|del|de\s+la|sobre|con|acerca\s+de)\b/gi, ' ');
    return t.replace(/\s+/g, ' ').trim();
  }

  function resolvePieceTrack(userAsk, stickyTopic) {
    var ask = String(userAsk || '').trim();
    if (!ask) return null;
    var n = normalize(ask);
    var sticky = normalize(String(stickyTopic || '').replace(/^doubt:/i, ''));
    var blob = n + ' ' + sticky;
    var asksPiece = /\b(que es|qué es|what is|significa|explicame|explic[aá]|para que sirve|para qué sirve|eso de|omision|omitir|omission)\b/i.test(ask)
      || /^(el |la )?(have|has|had|been|will|would|should|could|can|do|does|did|am|is|are|was|were|ing)\??$/i.test(ask.trim());
    if (!asksPiece) return null;
    if (/\bhad\b/.test(n)) {
      if (/\b(been|continuo|continuous)\b/.test(blob)) return trackById('combined') || trackById('perfect');
      if (/\b(perfecto|perfect|participio|prp)\b/.test(blob)) return trackById('perfect') || trackById('have_had');
      return trackById('have_had') || trackById('perfect');
    }
    if (/\bbeen\b/.test(n)) return trackById('combined') || trackById('perfect');
    if (/\b(have|has)\b/.test(n)) {
      if (/\b(perfecto|perfect|participio|prp)\b/.test(blob)) return trackById('perfect') || trackById('have_had');
      return trackById('have_had') || trackById('perfect');
    }
    if (/\b(will|would|should|could|can|must)\b/.test(n)) return trackById('modales');
    if (/\b(do|does|did)\b/.test(n)) return trackById('negations') || trackById('modal');
    if (/\b(get|got|gotten)\b/.test(n)) return trackById('irregular_verbs');
    if (/\b(go|went|gone|see|saw|seen|make|made|take|took|taken)\b/.test(n)) return trackById('irregular_verbs');
    return null;
  }

  function resolveAsk(userAsk, stickyTopic) {
    var ask = String(userAsk || '').trim();
    var sticky = String(stickyTopic || '').replace(/^doubt:/i, '').trim();
    var hit = resolvePieceTrack(ask, sticky);
    if (hit) return hit;
    hit = pickTrack(ask);
    if (hit) return hit;
    var stripped = stripAskShell(ask);
    if (stripped) {
      hit = pickTrack(stripped);
      if (hit) return hit;
      hit = resolvePieceTrack(stripped, sticky);
      if (hit) return hit;
    }
    if (sticky) {
      hit = pickTrack(sticky);
      if (hit) return hit;
      var ss = stripAskShell(sticky);
      if (ss) {
        hit = pickTrack(ss);
        if (hit) return hit;
      }
    }
    hit = pickTrack([ask, sticky].filter(Boolean).join(' '));
    if (hit) return hit;
    return pickTrack([stripped, sticky].filter(Boolean).join(' ')) || null;
  }

  function resolveAskId(userAsk, stickyTopic) {
    var t = resolveAsk(userAsk, stickyTopic);
    return t ? t.id : null;
  }


  function formatLock(track) {
    if (!track) return '';
    var never = (track.never || []).join('; ');
    var antiMix = [];
    var locks = {
      past: ['ANTIMEZCLA: pasado simple — no perfecto.'],
      perfect: ['ANTIMEZCLA: perfecto — no pasado simple.'],
      present: ['ANTIMEZCLA: presente simple.'],
      progressive: [
        'ANTIMEZCLA: presente continuo.',
        'OBLIGATORIO EN VOZ: español ESTAR + ando/endo → inglés TO BE (am/is/are) + VERBO+ING. Decí ando/endo. Sin to be no hay continuo.'
      ],
      future: ['ANTIMEZCLA: futuro.'],
      modales: ['ANTIMEZCLA: modales — will=-ré; would=-ría.'],
      modal: ['ANTIMEZCLA: moneda.'],
      negations: ['ANTIMEZCLA: AUX + NOT.'],
      there: ['ANTIMEZCLA: there is/are = hay.'],
      gerundio: [
        'ANTIMEZCLA: gerundio sustantivo.',
        'OBLIGATORIO EN VOZ: ING = ando/endo. Sin to be. CONTRASTE: ESTAR + ando/endo → TO BE + ING (continuo).'
      ],
      gerund_prep: ['ANTIMEZCLA: prep + ING = ando/endo.'],
      combined: ['ANTIMEZCLA: have been + ING.'],
      modal_have_pp: ['ANTIMEZCLA: modal + have + PP.'],
      modal_have_been: ['ANTIMEZCLA: modal + have been + ING.'],
      prepositions: ['ANTIMEZCLA: IN/ON/AT.'],
      prepositions_time: ['ANTIMEZCLA: prep. tiempo.'],
      articles: ['ANTIMEZCLA: artículos.'],
      comparatives: ['ANTIMEZCLA: comparativos.'],
      irregular_verbs: ['ANTIMEZCLA: irregulares.'],
      have_had: ['ANTIMEZCLA: have/had.'],
      if_was_were: ['ANTIMEZCLA: if I was/were.'],
      overview: ['ANTIMEZCLA: overview.']
    };
    if (locks[track.id]) antiMix = antiMix.concat(locks[track.id]);
    else antiMix.push('ANTIMEZCLA: SOLO el track "' + track.title + '".');
    var voiceSay = '';
    try {
      if (VOICE_PACK && VOICE_PACK.tracks && VOICE_PACK.tracks[track.id] && VOICE_PACK.tracks[track.id].say) {
        voiceSay = VOICE_PACK.tracks[track.id].say;
      }
    } catch (e) { /* ignore */ }
    var bridgeClean = String(track.bridge || '')
      .replace(/\bGet It Straight(?:\s*ING)?\b/gi, '')
      .replace(/\b(?:John\s+)?Off the Clock\b/gi, '')
      .replace(/\bPuente\s+JOHN\b/gi, 'Puente')
      .replace(/\s{2,}/g, ' ')
      .trim();
    var lines = [
      'CANON LOCK + METODOLOGÍA INFINITY (rige TODO):',
      'Tablero: ' + track.title,
      'Track id: ' + track.id,
      'Fórmula: ' + track.formula,
      'Puente pedagógico (DEBES DECIRLO EN VOZ — contenido, no nombres internos): ' + (bridgeClean || ''),
      'Ejemplo: ' + track.example,
      never ? 'PROHIBIDO: ' + never : '',
      'PROHIBIDO EN VOZ/CHAT: nombres internos de lección, shows o trainers.',
      antiMix.join('\n'),
      voiceSay ? ('GUION ORAL DEL CURSO: ' + voiceSay) : '',
      'CHECKLIST: fórmula + puente/analogía + ejemplo + práctica. Omitir puente = FALLAR.',
      'Este turno: SOLO este track. [[CTYPE:whiteboard]]'
    ];
    return lines.filter(Boolean).join('\n');
  }

  function byColumn() {
    var out = {};
    tracks().forEach(function (tr) {
      out[tr.id] = {
        id: (tr.svg || '').split('/').pop().replace(/\.svg$/, ''),
        path: tr.svg,
        title: tr.title,
        formula: tr.formula,
        example: tr.example
      };
    });
    return out;
  }

  global.JillCanonRouter = {
    loadMap: loadMap,
    setMap: setMap,
    normalize: normalize,
    pickTrack: pickTrack,
    pickTrackId: pickTrackId,
    wantsVisual: wantsVisual,
    stripAskShell: stripAskShell,
    resolveAsk: resolveAsk,
    resolveAskId: resolveAskId,
    resolvePieceTrack: resolvePieceTrack,
    trackById: trackById,
    formatLock: formatLock,
    byColumn: byColumn,
    CACHE_VER: CACHE_VER
  };
})(typeof window !== 'undefined' ? window : globalThis);
