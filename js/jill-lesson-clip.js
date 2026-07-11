/**
 * Jill Lesson Clip — tablero HTML animado por ranuras (estilo John / Infinity).
 * Todos los tracks del canon Foundations. Reproducción lineal (no bucle infinito).
 */
(function (global) {
  'use strict';

  var VERSION = '20260711align';
  var _host = null;
  var _timer = null;
  var _gen = 0;
  var _playing = false;

  var DEFAULT_COLORS = {
    1: '#A78BFA',
    2: '#F59E0B',
    3: '#C4B5FD',
    4: '#34D399',
    5: '#F472B6'
  };

  var DEFAULT_PACE = { slotMs: 420, spaceMs: 110, betweenMs: 1500, endHoldMs: 2200, loop: false };

  function T(parts) { return { text: parts }; }

  function clip(def) {
    def.colors = def.colors || DEFAULT_COLORS;
    def.pace = def.pace || DEFAULT_PACE;
    return def;
  }

  /** Catálogo completo — mismo estilo visual; datos por track del canon. */
  var CLIPS = {
    progressive: clip({
      id: 'progressive',
      title: 'Pronombre + To Be + Verbo + ING',
      bridge: 'español ESTAR + ando/endo → inglés TO BE (am/is/are) + VERBO+ING · ING = ando/endo',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'To be', hint: 'am · is · are' },
        { id: 3, label: 'Verbo + ING', hint: 'ando / endo' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['am', 2], [' ', 0], ['studying', 3], [' English now.', 0]]),
        T([['She', 1], [' ', 0], ['is', 2], [' ', 0], ['cooking', 3], [' dinner.', 0]]),
        T([['They', 1], [' ', 0], ['are', 2], [' ', 0], ['playing', 3], [' soccer.', 0]]),
        T([['We', 1], [' ', 0], ['are', 2], [' ', 0], ['meeting', 3], [' tomorrow.', 0]]),
        T([['You', 1], [' ', 0], ['are', 2], [' ', 0], ['using', 3], [' your phone.', 0]])
      ]
    }),

    present: clip({
      id: 'present',
      title: 'Presente simple · PR',
      bridge: 'Hábito / hecho · he/she/it → verbo + s',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Verbo', hint: 'base / +s' },
        { id: 3, label: 'Complemento', hint: 'qué / cuándo' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['go', 2], [' ', 0], ['home every day.', 3]]),
        T([['She', 1], [' ', 0], ['works', 2], [' ', 0], ['in San José.', 3]]),
        T([['They', 1], [' ', 0], ['study', 2], [' ', 0], ['English.', 3]]),
        T([['He', 1], [' ', 0], ['likes', 2], [' ', 0], ['coffee.', 3]]),
        T([['We', 1], [' ', 0], ['live', 2], [' ', 0], ['here.', 3]])
      ]
    }),

    past: clip({
      id: 'past',
      title: 'Pasado simple · PS',
      bridge: 'Acción terminada · worked / went = ayer',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Verbo pasado', hint: '-ed / irregular' },
        { id: 3, label: 'Complemento', hint: 'yesterday / ago' }
      ],
      examples: [
        T([['She', 1], [' ', 0], ['worked', 2], [' ', 0], ['yesterday.', 3]]),
        T([['I', 1], [' ', 0], ['went', 2], [' ', 0], ['home.', 3]]),
        T([['They', 1], [' ', 0], ['saw', 2], [' ', 0], ['the movie.', 3]]),
        T([['We', 1], [' ', 0], ['studied', 2], [' ', 0], ['last night.', 3]]),
        T([['He', 1], [' ', 0], ['made', 2], [' ', 0], ['coffee.', 3]])
      ]
    }),

    perfect: clip({
      id: 'perfect',
      title: 'Have / Has + Participio',
      bridge: 'have/has + participio = he/ha · had + participio = había',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · he · they' },
        { id: 2, label: 'Have / Has', hint: 'have · has · had' },
        { id: 3, label: 'Participio', hint: 'done · gone · seen' }
      ],
      examples: [
        T([['He', 1], [' ', 0], ['has', 2], [' ', 0], ['done', 3], [' it.', 0]]),
        T([['I', 1], [' ', 0], ['have', 2], [' ', 0], ['seen', 3], [' that.', 0]]),
        T([['They', 1], [' ', 0], ['have', 2], [' ', 0], ['finished', 3], [' already.', 0]]),
        T([['She', 1], [' ', 0], ['has', 2], [' ', 0], ['gone', 3], [' home.', 0]]),
        T([['We', 1], [' ', 0], ['had', 2], [' ', 0], ['eaten', 3], [' before.', 0]])
      ]
    }),

    future: clip({
      id: 'future',
      title: 'Futuro · will / going to',
      bridge: 'will = -ré · going to = voy a (plan)',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · we' },
        { id: 2, label: 'Will / Going to', hint: '-ré · voy a' },
        { id: 3, label: 'Verbo', hint: 'base' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['will', 2], [' ', 0], ['call', 3], [' you tomorrow.', 0]]),
        T([['She', 1], [' ', 0], ['will', 2], [' ', 0], ['help', 3], [' us.', 0]]),
        T([['I', 1], [' ', 0], ['am going to', 2], [' ', 0], ['study', 3], ['.', 0]]),
        T([['They', 1], [' ', 0], ['are going to', 2], [' ', 0], ['travel', 3], ['.', 0]]),
        T([['We', 1], [' ', 0], ['will', 2], [' ', 0], ['meet', 3], [' at 5.', 0]])
      ]
    }),

    modales: clip({
      id: 'modales',
      title: 'Pronombre + Modal + Verbo',
      bridge: 'will=-ré · would=-ría · should=debería · can=puedo · modal + verbo base (sin to)',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Modal', hint: 'can · will · should' },
        { id: 3, label: 'Verbo base', hint: 'sin to' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['can', 2], [' ', 0], ['work', 3], ['.', 0]]),
        T([['She', 1], [' ', 0], ['should', 2], [' ', 0], ['study', 3], ['.', 0]]),
        T([['They', 1], [' ', 0], ['will', 2], [' ', 0], ['call', 3], [' you.', 0]]),
        T([['We', 1], [' ', 0], ['would', 2], [' ', 0], ['help', 3], ['.', 0]]),
        T([['You', 1], [' ', 0], ['must', 2], [' ', 0], ['try', 3], ['.', 0]])
      ]
    }),

    combined: clip({
      id: 'combined',
      title: 'Have + Been + Verbo + ING',
      bridge: 'have been + VERBO+ING = he estado + ando/endo',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Have / Has', hint: 'have · has · had' },
        { id: 3, label: 'Been', hint: 'been' },
        { id: 4, label: 'Verbo + ING', hint: 'ando / endo' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['studying', 4], [' English.', 0]]),
        T([['She', 1], [' ', 0], ['has', 2], [' ', 0], ['been', 3], [' ', 0], ['working', 4], ['.', 0]]),
        T([['They', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['waiting', 4], ['.', 0]]),
        T([['We', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['living', 4], [' here.', 0]]),
        T([['He', 1], [' ', 0], ['had', 2], [' ', 0], ['been', 3], [' ', 0], ['running', 4], ['.', 0]])
      ]
    }),

    modal_have_pp: clip({
      id: 'modal_have_pp',
      title: 'Modal + Have + Participio',
      bridge: 'should have = debería haber · could have = podría haber',
      slots: [
        { id: 1, label: 'Modal', hint: 'should · could · must' },
        { id: 2, label: 'Have', hint: 'have' },
        { id: 3, label: 'Participio', hint: 'studied · gone' }
      ],
      examples: [
        T([['You', 0], [' ', 0], ['should', 1], [' ', 0], ['have', 2], [' ', 0], ['studied', 3], [' more.', 0]]),
        T([['She', 0], [' ', 0], ['could', 1], [' ', 0], ['have', 2], [' ', 0], ['called', 3], ['.', 0]]),
        T([['They', 0], [' ', 0], ['must', 1], [' ', 0], ['have', 2], [' ', 0], ['forgotten', 3], ['.', 0]]),
        T([['I', 0], [' ', 0], ['would', 1], [' ', 0], ['have', 2], [' ', 0], ['helped', 3], ['.', 0]]),
        T([['We', 0], [' ', 0], ['will', 1], [' ', 0], ['have', 2], [' ', 0], ['finished', 3], [' by then.', 0]])
      ]
    }),

    modal_have_been: clip({
      id: 'modal_have_been',
      title: 'Modal + Have Been + Verbo + ING',
      bridge: 'must have been working = debió haber estado trabajando',
      slots: [
        { id: 1, label: 'Modal', hint: 'must · should' },
        { id: 2, label: 'Have', hint: 'have' },
        { id: 3, label: 'Been', hint: 'been' },
        { id: 4, label: 'Verbo + ING', hint: 'ando / endo' }
      ],
      examples: [
        T([['She', 0], [' ', 0], ['must', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['working', 4], ['.', 0]]),
        T([['They', 0], [' ', 0], ['should', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['studying', 4], ['.', 0]]),
        T([['He', 0], [' ', 0], ['could', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['sleeping', 4], ['.', 0]]),
        T([['You', 0], [' ', 0], ['might', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['waiting', 4], ['.', 0]]),
        T([['We', 0], [' ', 0], ['would', 1], [' ', 0], ['have', 2], [' ', 0], ['been', 3], [' ', 0], ['traveling', 4], ['.', 0]])
      ]
    }),

    have_had: clip({
      id: 'have_had',
      title: 'Have · Has · Had',
      bridge: 'Decí con pausa: have. has. had.',
      slots: [
        { id: 1, label: 'Have', hint: 'I / you / we / they' },
        { id: 2, label: 'Has', hint: 'he / she / it' },
        { id: 3, label: 'Had', hint: 'pasado' }
      ],
      examples: [
        T([['have', 1], ['. ', 0], ['has', 2], ['. ', 0], ['had', 3], ['.', 0]]),
        T([['I', 0], [' ', 0], ['have', 1], [' finished.', 0]]),
        T([['She', 0], [' ', 0], ['has', 2], [' finished.', 0]]),
        T([['I', 0], [' ', 0], ['had', 3], [' finished.', 0]]),
        T([['They', 0], [' ', 0], ['have', 1], [' a plan.', 0]])
      ]
    }),

    if_was_were: clip({
      id: 'if_was_were',
      title: 'If I was / were / were to',
      bridge: 'was = pasado real · were = hipótesis · were to = poco probable',
      slots: [
        { id: 1, label: 'Was', hint: 'pasado real' },
        { id: 2, label: 'Were', hint: 'hipótesis' },
        { id: 3, label: 'Were to', hint: 'poco probable' }
      ],
      examples: [
        T([['If I', 0], [' ', 0], ['was', 1], [' tired, I rested.', 0]]),
        T([['If I', 0], [' ', 0], ['were', 2], [' rich, I would travel.', 0]]),
        T([['If she', 0], [' ', 0], ['were', 2], [' here, she would help.', 0]]),
        T([['If I', 0], [' ', 0], ['were to', 3], [' win, I would celebrate.', 0]]),
        T([['If they', 0], [' ', 0], ['were', 2], [' ready, we would start.', 0]])
      ]
    }),

    irregular_verbs: clip({
      id: 'irregular_verbs',
      title: 'Verbos irregulares',
      bridge: 'Col1 presente · Col2 pasado · Col3 participio — con pausa',
      slots: [
        { id: 1, label: 'Presente', hint: 'go · do · see' },
        { id: 2, label: 'Pasado', hint: 'went · did · saw' },
        { id: 3, label: 'Participio', hint: 'gone · done · seen' }
      ],
      examples: [
        T([['go', 1], ['. ', 0], ['went', 2], ['. ', 0], ['gone', 3], ['.', 0]]),
        T([['do', 1], ['. ', 0], ['did', 2], ['. ', 0], ['done', 3], ['.', 0]]),
        T([['see', 1], ['. ', 0], ['saw', 2], ['. ', 0], ['seen', 3], ['.', 0]]),
        T([['take', 1], ['. ', 0], ['took', 2], ['. ', 0], ['taken', 3], ['.', 0]]),
        T([['make', 1], ['. ', 0], ['made', 2], ['. ', 0], ['made', 3], ['.', 0]])
      ]
    }),

    there: clip({
      id: 'there',
      title: 'There is / There are / Have',
      bridge: 'There is = hay (1) · There are = hay (2+) · have = posesión',
      slots: [
        { id: 1, label: 'There is', hint: 'hay · 1' },
        { id: 2, label: 'There are', hint: 'hay · 2+' },
        { id: 3, label: 'Have / Has', hint: 'posesión' }
      ],
      examples: [
        T([['There is', 1], [' a book on the table.', 0]]),
        T([['There are', 2], [' two chairs.', 0]]),
        T([['I', 0], [' ', 0], ['have', 3], [' a book.', 0]]),
        T([['There is', 1], [' a problem.', 0]]),
        T([['She', 0], [' ', 0], ['has', 3], [' a car.', 0]])
      ]
    }),

    gerundio: clip({
      id: 'gerundio',
      title: 'Gerundio = VERBO + ING (sustantivo)',
      bridge: 'ING = ando/endo como sustantivo (sin to be) · si usás ESTAR + ando/endo → TO BE + ING (continuo)',
      slots: [
        { id: 1, label: 'Verbo + ING', hint: 'ando / endo' },
        { id: 2, label: 'Como sustantivo', hint: 'gustar / sujeto' }
      ],
      examples: [
        T([['I like', 2], [' ', 0], ['running', 1], ['.', 0]]),
        T([['Playing', 1], [' guitar', 0], [' is fun.', 2]]),
        T([['She enjoys', 2], [' ', 0], ['cooking', 1], ['.', 0]]),
        T([['Swimming', 1], [' is healthy.', 2]]),
        T([['They hate', 2], [' ', 0], ['waiting', 1], ['.', 0]])
      ]
    }),

    gerund_prep: clip({
      id: 'gerund_prep',
      title: 'Preposición + VERBO + ING',
      bridge: 'Tras prep → VERBO+ING = ando/endo (Before leaving)',
      slots: [
        { id: 1, label: 'Preposición', hint: 'before · after · by' },
        { id: 2, label: 'Verbo + ING', hint: 'ando / endo' },
        { id: 3, label: 'Complemento', hint: 'qué sigue' }
      ],
      examples: [
        T([['Before', 1], [' ', 0], ['leaving', 2], [',', 0], [' call me.', 3]]),
        T([['After', 1], [' ', 0], ['eating', 2], [',', 0], [' we left.', 3]]),
        T([['Without', 1], [' ', 0], ['thinking', 2], [',', 0], [' she spoke.', 3]]),
        T([['By', 1], [' ', 0], ['practicing', 2], [',', 0], [' you improve.', 3]]),
        T([['Good at', 1], [' ', 0], ['speaking', 2], [' English.', 3]])
      ]
    }),

    prepositions: clip({
      id: 'prepositions',
      title: 'IN · ON · AT · BY',
      bridge: 'IN=dentro · ON=encima · AT=punto · BY=medio — van en el complemento',
      slots: [
        { id: 1, label: 'IN', hint: 'dentro' },
        { id: 2, label: 'ON', hint: 'encima' },
        { id: 3, label: 'AT', hint: 'punto' },
        { id: 4, label: 'BY', hint: 'medio' }
      ],
      examples: [
        T([['The book is', 0], [' ', 0], ['on', 2], [' the table.', 0]]),
        T([['I am', 0], [' ', 0], ['at', 3], [' home.', 0]]),
        T([['She lives', 0], [' ', 0], ['in', 1], [' San José.', 0]]),
        T([['I go', 0], [' ', 0], ['by', 4], [' bus.', 0]]),
        T([['Meet me', 0], [' ', 0], ['at', 3], [' the door.', 0]])
      ]
    }),

    prepositions_time: clip({
      id: 'prepositions_time',
      title: 'Preposiciones de tiempo',
      bridge: 'IN = mes/año · ON = día · AT = hora',
      slots: [
        { id: 1, label: 'IN', hint: 'mes / año' },
        { id: 2, label: 'ON', hint: 'día / fecha' },
        { id: 3, label: 'AT', hint: 'hora' }
      ],
      examples: [
        T([['We meet', 0], [' ', 0], ['on', 2], [' Monday.', 0]]),
        T([['In', 1], [' March', 0], [' it rains.', 0]]),
        T([['At', 3], [' 5 pm', 0], [' we start.', 0]]),
        T([['On', 2], [' Friday', 0], [' I rest.', 0]]),
        T([['In', 1], [' the morning', 0], [' I study.', 0]])
      ]
    }),

    negations: clip({
      id: 'negations',
      title: 'Negaciones · AUX + NOT',
      bridge: 'auxiliar + not + verbo base — nunca “I no work”',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Aux + not', hint: "don't · isn't" },
        { id: 3, label: 'Verbo', hint: 'base' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['do not', 2], [' ', 0], ['work', 3], ['.', 0]]),
        T([['She', 1], [' ', 0], ["doesn't", 2], [' ', 0], ['go', 3], ['.', 0]]),
        T([['They', 1], [' ', 0], ["aren't", 2], [' ', 0], ['ready', 3], ['.', 0]]),
        T([['We', 1], [' ', 0], ["didn't", 2], [' ', 0], ['see', 3], [' it.', 0]]),
        T([['He', 1], [' ', 0], ["won't", 2], [' ', 0], ['call', 3], ['.', 0]])
      ]
    }),

    comparatives: clip({
      id: 'comparatives',
      title: 'Comparativos',
      bridge: '-er/more + than · -est/most · as…as',
      slots: [
        { id: 1, label: '-er / more', hint: 'más…' },
        { id: 2, label: 'than', hint: 'que' },
        { id: 3, label: 'as…as', hint: 'tan…como' }
      ],
      examples: [
        T([['She is', 0], [' ', 0], ['taller', 1], [' ', 0], ['than', 2], [' me.', 0]]),
        T([['This is', 0], [' ', 0], ['more', 1], [' interesting', 0], [' ', 0], ['than', 2], [' that.', 0]]),
        T([['He is', 0], [' ', 0], ['as', 3], [' tall', 0], [' ', 0], ['as', 3], [' his brother.', 0]]),
        T([['Today is', 0], [' ', 0], ['hotter', 1], [' ', 0], ['than', 2], [' yesterday.', 0]]),
        T([['English is', 0], [' ', 0], ['as', 3], [' useful', 0], [' ', 0], ['as', 3], [' Spanish.', 0]])
      ]
    }),

    articles: clip({
      id: 'articles',
      title: 'Artículos a / an / the',
      bridge: 'a/an = uno/una · the = el/la',
      slots: [
        { id: 1, label: 'a / an', hint: 'indefinido' },
        { id: 2, label: 'the', hint: 'definido' },
        { id: 3, label: 'much / many', hint: 'cantidad' }
      ],
      examples: [
        T([['I see', 0], [' ', 0], ['a', 1], [' cat.', 0]]),
        T([['The', 2], [' cat is black.', 0]]),
        T([['She is', 0], [' ', 0], ['an', 1], [' engineer.', 0]]),
        T([['I need', 0], [' ', 0], ['a', 1], [' lot of', 3], [' time.', 0]]),
        T([['The', 2], [' sun is bright.', 0]])
      ]
    }),

    modal: clip({
      id: 'modal',
      title: 'Método moneda (inversión)',
      bridge: 'Auxiliar ANTES del pronombre = pregunta · DESPUÉS = respuesta',
      slots: [
        { id: 1, label: 'Aux antes', hint: 'pregunta' },
        { id: 2, label: 'Pronombre', hint: 'you · she' },
        { id: 3, label: 'Aux después', hint: 'respuesta' }
      ],
      examples: [
        T([['Are', 1], [' ', 0], ['you', 2], [' coming?', 0]]),
        T([['You', 2], [' ', 0], ['are', 3], [' coming.', 0]]),
        T([['Do', 1], [' ', 0], ['you', 2], [' work?', 0]]),
        T([['She', 2], [' ', 0], ['does', 3], [' work.', 0]]),
        T([['Can', 1], [' ', 0], ['he', 2], [' help?', 0]])
      ]
    }),

    overview: clip({
      id: 'overview',
      title: 'Tiempos · overview',
      bridge: 'PR · PS · PC · PRP — misma idea, distinta ranura',
      slots: [
        { id: 1, label: 'PR', hint: 'presente' },
        { id: 2, label: 'PS', hint: 'pasado' },
        { id: 3, label: 'PC', hint: 'continuo' },
        { id: 4, label: 'PRP', hint: 'perfecto' }
      ],
      examples: [
        T([['I', 0], [' ', 0], ['work', 1], ['.', 0]]),
        T([['I', 0], [' ', 0], ['worked', 2], ['.', 0]]),
        T([['I', 0], [' am ', 0], ['working', 3], ['.', 0]]),
        T([['I', 0], [' have ', 0], ['worked', 4], ['.', 0]]),
        T([['I', 0], [' will ', 0], ['work', 1], ['.', 0]])
      ]
    }),

    /* ── Nexus (Alice tutor + companion) — mismo estilo visual ── */
    nexus_idea_chain: clip({
      id: 'nexus_idea_chain',
      title: 'Nexus · Idea + Linker + Idea',
      bridge: 'Una idea → conector → otra idea (flujo Intermediate+)',
      slots: [
        { id: 1, label: 'Idea 1', hint: 'punto claro' },
        { id: 2, label: 'Linker', hint: 'conector' },
        { id: 3, label: 'Idea 2', hint: 'expansión' }
      ],
      examples: [
        T([['I was tired', 1], [', ', 0], ['however', 2], [', ', 0], ['I finished the report.', 3]]),
        T([['She studied hard', 1], ['. ', 0], ['On top of that', 2], [', ', 0], ['she practiced speaking.', 3]]),
        T([['It was raining', 1], [', ', 0], ['even though', 2], [' ', 0], ['we went out.', 3]]),
        T([['I need time', 1], ['. ', 0], ['In other words', 2], [', ', 0], ['I cannot rush this.', 3]]),
        T([['We tried', 1], ['. ', 0], ['As a result', 2], [', ', 0], ['the client stayed.', 3]])
      ]
    }),

    nexus_linkers: clip({
      id: 'nexus_linkers',
      title: 'Nexus · Linkers',
      bridge: 'however · on top of that · even though · therefore · in other words…',
      slots: [
        { id: 1, label: 'Contrast', hint: 'however · even though' },
        { id: 2, label: 'Add', hint: 'on top of that · besides' },
        { id: 3, label: 'Result / clarify', hint: 'therefore · in other words' }
      ],
      examples: [
        T([['I liked the plan', 0], ['; ', 0], ['however', 1], [', I needed more time.', 0]]),
        T([['He is fast', 0], ['. ', 0], ['On top of that', 2], [', he is careful.', 0]]),
        T([['We stayed', 0], [', ', 0], ['even though', 1], [' it was late.', 0]]),
        T([['She prepared', 0], ['. ', 0], ['Therefore', 3], [', the call went well.', 0]]),
        T([['I am stuck', 0], ['. ', 0], ['In other words', 3], [', I need help.', 0]])
      ]
    }),

    nexus_star: clip({
      id: 'nexus_star',
      title: 'Nexus · STAR',
      bridge: 'Situation → Task → Action → Result',
      slots: [
        { id: 1, label: 'Situation', hint: 'contexto' },
        { id: 2, label: 'Task', hint: 'reto' },
        { id: 3, label: 'Action', hint: 'qué hice' },
        { id: 4, label: 'Result', hint: 'resultado' }
      ],
      examples: [
        T([['S: ', 0], ['A client was upset', 1], ['.', 0]]),
        T([['T: ', 0], ['I had to calm them', 2], ['.', 0]]),
        T([['A: ', 0], ['I listened and offered options', 3], ['.', 0]]),
        T([['R: ', 0], ['They stayed with us', 4], ['.', 0]]),
        T([['S→T→A→R', 1], [' — ', 0], ['one story', 2], [', ', 0], ['clear flow', 3], ['.', 0]])
      ]
    }),

    nexus_recovery: clip({
      id: 'nexus_recovery',
      title: 'Nexus · Recovery phrases',
      bridge: 'Comprá tiempo · reformulá · seguí con control',
      slots: [
        { id: 1, label: 'Buy time', hint: 'let me think' },
        { id: 2, label: 'Rephrase', hint: 'in other words' },
        { id: 3, label: 'Continue', hint: 'what I mean is' }
      ],
      examples: [
        T([['Let me think for a second', 1], ['.', 0]]),
        T([['In other words', 2], [', I need more details.', 0]]),
        T([['What I mean is', 3], [', we can fix this today.', 0]]),
        T([['That is a good question', 1], ['. Let me explain.', 0]]),
        T([['So far', 2], [', the main point is this.', 0]])
      ]
    })
  };

  function resolveNexusId(text) {
    var t = String(text || '').toLowerCase();
    if (!t.trim()) return null;
    if (/\b(star\s*method|s\.?\s*t\.?\s*a\.?\s*r|situation.{0,12}task.{0,12}action|star structure)\b/.test(t)) return 'nexus_star';
    if (/\b(recovery|buy time|let me think|frase de recuperaci|what i mean is)\b/.test(t)) return 'nexus_recovery';
    if (/\b(idea\s*\+\s*linker|idea linker idea|m[eé]todo nexus|nexus method|chunking)\b/.test(t)) return 'nexus_idea_chain';
    if (/\b(linkers?|conectores?( nexus)?|however|on top of that|even though|in other words|as a result|furthermore|besides|so far|therefore)\b/.test(t)) {
      return 'nexus_linkers';
    }
    return null;
  }

  function listIds() {
    return Object.keys(CLIPS);
  }

  function supports(columnId) {
    return !!(columnId && CLIPS[columnId]);
  }

  function getClip(columnId) {
    return CLIPS[columnId] || null;
  }

  function clearTimer() {
    if (_timer) {
      clearTimeout(_timer);
      _timer = null;
    }
  }

  function wait(ms, gen) {
    return new Promise(function (resolve) {
      _timer = setTimeout(function () {
        _timer = null;
        if (gen !== _gen) return resolve(false);
        resolve(true);
      }, ms);
    });
  }

  function pulseSlot(root, n) {
    if (!n || !root) return;
    var box = root.querySelector('.jill-clip-slot[data-slot="' + n + '"]');
    if (!box) return;
    box.classList.remove('is-pulse');
    void box.offsetWidth;
    box.classList.add('is-pulse', 'is-active');
    var siblings = root.querySelectorAll('.jill-clip-slot');
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] !== box) siblings[i].classList.remove('is-active');
    }
    var media = root.closest('#jill-stage-media, #alice-stage-media');
    if (media) {
      var spots = media.querySelectorAll('.jill-svg-hotspot, .jill-clip-slot');
      for (var s = 0; s < spots.length; s++) {
        var slotAttr = spots[s].getAttribute('data-slot');
        var stepAttr = spots[s].getAttribute('data-step');
        var match = slotAttr != null
          ? (String(slotAttr) === String(n))
          : (String(Number(stepAttr) + 1) === String(n));
        spots[s].classList.toggle('is-lit', match);
        spots[s].classList.toggle('is-active', match && spots[s].classList.contains('jill-clip-slot'));
      }
    }
  }

  function buildMarkup(def) {
    var slotsHtml = def.slots.map(function (s, idx) {
      var plus = idx < def.slots.length - 1
        ? '<span class="jill-clip-plus" aria-hidden="true">+</span>'
        : '';
      return '<button type="button" class="jill-clip-slot" data-slot="' + s.id + '" aria-label="' + s.label + '">'
        + '<span class="jill-clip-slot-label">' + s.label + '</span>'
        + '<span class="jill-clip-slot-hint">' + s.hint + '</span>'
        + '</button>' + plus;
    }).join('');

    return ''
      + '<div class="jill-clip" data-clip="' + def.id + '" data-ver="' + VERSION + '">'
      + '  <div class="jill-clip-aura" aria-hidden="true"></div>'
      + '  <p class="jill-clip-title">' + def.title + '</p>'
      + '  <p class="jill-clip-bridge">' + def.bridge + '</p>'
      + '  <div class="jill-clip-row">' + slotsHtml + '</div>'
      + '  <p class="jill-clip-example" aria-live="polite"></p>'
      + '  <div class="jill-clip-footer">'
      + '    <span class="jill-clip-progress"></span>'
      + '    <button type="button" class="jill-clip-replay">Replay</button>'
      + '  </div>'
      + '</div>';
  }

  async function playSentence(root, def, idx, gen) {
    var el = root.querySelector('.jill-clip-example');
    if (!el) return false;
    el.innerHTML = '';
    el.classList.remove('is-done');
    var parts = def.examples[idx].text;
    var pace = def.pace || DEFAULT_PACE;
    var colors = def.colors || DEFAULT_COLORS;
    for (var p = 0; p < parts.length; p++) {
      if (gen !== _gen) return false;
      var word = parts[p][0];
      var group = parts[p][1];
      var span = document.createElement('span');
      span.className = 'jill-clip-word' + (group ? ' is-slot-' + group : '');
      span.textContent = word;
      if (group && colors[group]) span.style.color = colors[group];
      el.appendChild(span);
      requestAnimationFrame(function (node) {
        return function () { node.classList.add('is-in'); };
      }(span));
      if (group) pulseSlot(root, group);
      var ok = await wait(group ? (pace.slotMs || 420) : (pace.spaceMs || 110), gen);
      if (!ok) return false;
    }
    el.classList.add('is-done');
    return true;
  }

  async function runSequence(root, def, gen) {
    _playing = true;
    var progress = root.querySelector('.jill-clip-progress');
    var total = def.examples.length;
    var i = 0;
    do {
      if (progress) progress.textContent = (i + 1) + ' / ' + total;
      var ok = await playSentence(root, def, i, gen);
      if (!ok) { _playing = false; return; }
      ok = await wait(def.pace.betweenMs || 1500, gen);
      if (!ok) { _playing = false; return; }
      i += 1;
      if (i >= total) {
        if (def.pace.loop) i = 0;
        else break;
      }
    } while (gen === _gen);

    if (gen === _gen) {
      await wait(def.pace.endHoldMs || 2000, gen);
      if (progress) progress.textContent = 'Listo · practicá con el mic';
      var slots = root.querySelectorAll('.jill-clip-slot');
      for (var s = 0; s < slots.length; s++) slots[s].classList.remove('is-active', 'is-pulse');
    }
    _playing = false;
  }

  function wire(root, def) {
    var slots = root.querySelectorAll('.jill-clip-slot');
    for (var i = 0; i < slots.length; i++) {
      slots[i].addEventListener('click', function (ev) {
        var n = parseInt(ev.currentTarget.getAttribute('data-slot'), 10) || 0;
        pulseSlot(root, n);
      });
    }
    var replay = root.querySelector('.jill-clip-replay');
    if (replay) {
      replay.addEventListener('click', function () {
        startPlay(root, def);
      });
    }
  }

  function startPlay(root, def) {
    _gen += 1;
    clearTimer();
    runSequence(root, def, _gen);
  }

  function mount(host, columnId) {
    unmount();
    var def = CLIPS[columnId];
    if (!host || !def) return false;
    _host = host;
    host.innerHTML = buildMarkup(def);
    var root = host.querySelector('.jill-clip');
    if (!root) return false;
    wire(root, def);
    _gen += 1;
    var gen = _gen;
    _timer = setTimeout(function () {
      _timer = null;
      if (gen !== _gen) return;
      runSequence(root, def, gen);
    }, 380);
    return true;
  }

  function unmount() {
    _gen += 1;
    clearTimer();
    _playing = false;
    if (_host) {
      _host.innerHTML = '';
      _host = null;
    }
  }

  function isPlaying() {
    return _playing;
  }

  global.JillLessonClip = {
    VERSION: VERSION,
    supports: supports,
    getClip: getClip,
    listIds: listIds,
    resolveNexusId: resolveNexusId,
    mount: mount,
    unmount: unmount,
    isPlaying: isPlaying,
    CLIPS: CLIPS
  };
})(typeof window !== 'undefined' ? window : globalThis);
