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
          "futuro perfecto",
          "future perfect",
          "will have",
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
          "will have finished",
          "modal + have"
        ],
        "bridge": "Puente: should have = debería haber + participio; could have = podría haber."
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
          "have had"
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
          "hay"
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
          "prp",
          "have/has + participio",
          "have has participio",
          "had + participio",
          "pronombre + have + participio",
          "perfecto",
          "el perfecto"
        ],
        "bridge": "Puente: have/has + participio = he/ha + participio; had + participio = había + participio (pasado perfecto). NO es pasado simple (worked/went)."
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
          "futuro perfecto / will have",
          "modales should",
          "pasado simple"
        ],
        "aliases": [
          "futuro",
          "future",
          "going to",
          "explicame el futuro",
          "futuro simple",
          "el futuro",
          "will going to",
          "be going to"
        ],
        "bridge": "Puente: will = -ré (decisión/espontáneo); going to = voy a (plan/intención)."
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
  var CACHE_VER = '20260710svg';

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

  function resolveAsk(userAsk, stickyTopic) {
    var ask = String(userAsk || '').trim();
    var sticky = String(stickyTopic || '').replace(/^doubt:/i, '').trim();
    var hit = pickTrack(ask);
    if (hit) return hit;
    var stripped = stripAskShell(ask);
    if (stripped) {
      hit = pickTrack(stripped);
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
    if (track.id === 'past') {
      antiMix.push(
        'ANTIMEZCLA OBLIGATORIA — PASADO SIMPLE (PS) SOLAMENTE:',
        'PROHIBIDO decir: pasado perfecto, present perfect, have/has/had + participio, "I have worked", "had done".',
        'SOLO: pronombre + verbo en pasado (worked / went / saw) + yesterday/ago/last.',
        'El tablero muestra PASADO SIMPLE — tu voz DEBE coincidir. Cero perfecto en este turno.'
      );
    } else if (track.id === 'perfect') {
      antiMix.push(
        'ANTIMEZCLA OBLIGATORIA — PERFECTO (have/has/had + participio):',
        'PROHIBIDO enseñar como pasado simple (worked yesterday).'
      );
    }
    return [
      'JILL DJ — TRACK LOCK DURO (tablero = voz)',
      'Track id: ' + track.id,
      'Track: ' + track.title,
      'Fórmula oficial: ' + track.formula,
      track.bridge ? track.bridge : '',
      'Ejemplo canónico: ' + track.example,
      never ? 'PROHIBIDO mezclar: ' + never : '',
      antiMix.join('\n'),
      'VOZ: ranuras en español. VERBO+ING = "verbo más I N G".',
      'Hablás exactamente lo que se ve en el tablero.',
      'Este turno: SOLO este track. [[CTYPE:whiteboard]]'
    ].filter(Boolean).join('\n');
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
    formatLock: formatLock,
    byColumn: byColumn,
    CACHE_VER: CACHE_VER
  };
})(typeof window !== 'undefined' ? window : globalThis);
