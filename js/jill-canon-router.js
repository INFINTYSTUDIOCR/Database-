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
        "svg": "assets/canon/will-would.svg",
        "title": "Clase 010 — WILL + HAVE + PP y BY",
        "formula": "BY + momento futuro + pronombre + will + have + PARTICIPIO",
        "example": "By Monday, I will have finished the report.",
        "never": [
          "futuro simple will + base sin have",
          "should have / could have / would have (eso pertenece a modal_have_pp)",
          "will have + pasado en vez de participio",
          "olvidar BY como momento límite",
          "cortar o reescribir el guion canon module-06"
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
        "bridge": "Puente Módulo 6 / Clase 010: WILL=RÉ, WOULD=RÍA y modal + verbo sin TO. Futuro perfecto = WILL + HAVE + PARTICIPIO; BY introduce el momento límite. I will have gone, nunca will have went."
      },
      {
        "id": "combined",
        "svg": "assets/canon/verbos-perfecto.svg",
        "title": "Modulo 4 — BEEN + ING (perfecto continuo)",
        "formula": "HAVE/HAS/HAD + BEEN + VERBO-ING — BEEN activa el ING (ando/endo)",
        "example": "I have been working. She had been studying before the exam.",
        "never": [
          "presente continuo sin have",
          "BEEN sin ING cuando la acción sigue",
          "cortar el guion canon module-04"
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
          "have been + v",
          "he estado trabajando",
          "habia estado"
        ],
        "bridge": "Puente Modulo 4 (BEEN): BEEN = participio de BE → activa ING. HAVE/HAS+BEEN+ING = he estado + ando/endo. HAD+BEEN+ING = había estado. Misma clase que HAVE+PP."
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
        "svg": "assets/canon/gerundio.svg",
        "title": "Clase 009 · Gerundio — TO BE + ING / TO vs ING",
        "formula": "TO BE + VERBO-ING = continuo | TO + VERBO = dirección/intención | VERBO-ING = concepto | preposición + VERBO-ING",
        "example": "I am working. / I want to work. / I enjoy working. / I am interested in learning.",
        "never": [
          "presente continuo sin contrastar",
          "IN ON AT lugar",
          "cortar o reescribir el guion canon module-05"
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
          "que es gerundio",
          "ando endo",
          "ando/endo",
          "get it straight",
          "get it straight ing",
          "off the clock",
          "i like watching",
          "i like to watch",
          "abuso del infinitivo",
          "modulo 5",
          "módulo 5",
          "clase 009",
          "clase 9",
          "to be + ing",
          "to vs ing"
        ],
        "bridge": "Puente Módulo 5 / Clase 009: TO BE = llave; ING = puerta; TO = flecha; ING = concepto; después de preposición, siempre ING."
      },
      {
        "id": "gerund_prep",
        "svg": "assets/canon/gerundio.svg",
        "title": "Clase 009 · Preposición + ING — siempre",
        "formula": "preposición + VERBO-ING — in/at/of/about/for + ING, siempre",
        "example": "I am interested in learning. / She is good at speaking English.",
        "never": [
          "presente continuo",
          "IN ON AT como tema",
          "preposiciones lugar",
          "cortar o reescribir el guion canon module-05"
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
          "despues de preposicion",
          "modulo 5",
          "módulo 5",
          "clase 009",
          "clase 9",
          "el gerundio",
          "to be + ing",
          "to vs ing"
        ],
        "bridge": "Puente Módulo 5 / Clase 009: TO BE = llave; ING = puerta; TO = flecha; ING = concepto; después de preposición, siempre ING."
      },
      {
        "id": "prepositions_time",
        "svg": "assets/canon/preposiciones.svg",
        "title": "Clase 011 — Preposiciones de tiempo (IN / ON / AT)",
        "formula": "IN = períodos largos | ON = días y fechas | AT = horas exactas | SINCE/FOR/DURING/BY",
        "example": "We meet on Monday in March at 5 pm. / I have worked here since 2020.",
        "never": [
          "gerundio",
          "artículos a/an/the como foco",
          "cortar o reescribir el guion canon module-07"
        ],
        "aliases": [
          "preposiciones de tiempo",
          "preposicion de tiempo",
          "prep tiempo",
          "preposiciones tiempo",
          "explicame preposiciones de tiempo",
          "prep de tiempo in on at",
          "since for during by",
          "since vs for",
          "durante vs for"
        ],
        "bridge": "Puente Módulo 7 / Clase 011: mismos tres círculos — IN períodos; ON días/fechas; AT horas. SINCE=punto; FOR=duración; DURING=evento; BY=límite."
      },
      {
        "id": "prepositions",
        "svg": "assets/canon/preposiciones.svg",
        "title": "Clase 011 — IN / ON / AT + Preposiciones (Módulo 7)",
        "formula": "IN = adentro (grande) | ON = encima (mediano) | AT = punto exacto | resto por función",
        "example": "The book is on the table. / I am at home. / She walked into the room.",
        "never": [
          "gerundio",
          "gerundio-prep",
          "artículos a/an/the como foco de esta clase",
          "cortar o reescribir el guion canon module-07"
        ],
        "aliases": [
          "preposiciones",
          "preposicion",
          "prepositions",
          "prep lugar",
          "preposiciones de lugar",
          "in on at",
          "in on y at",
          "in, on, at",
          "in/on/at",
          "in on at by",
          "explicame in on at",
          "corregime in on at",
          "explicame preposiciones",
          "modulo 7",
          "módulo 7",
          "clase 011",
          "clase 11",
          "tres circulos",
          "tres círculos",
          "since for during by",
          "like vs as",
          "into",
          "los tres circulos"
        ],
        "bridge": "Puente Módulo 7 / Clase 011: EN español hace los tres. IN=adentro (grande); ON=encima (mediano); AT=punto exacto. Tres círculos. Solo preposiciones — no artículos."
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
        "svg": "assets/canon/gerundio.svg",
        "title": "Clase 009 · TO BE + ING — la llave y la puerta",
        "formula": "TO BE (am/is/are/was/were/been) + VERBO-ING — TO BE es la llave; ING es la puerta",
        "example": "I am working. / They were eating. / She has been studying.",
        "never": [
          "gerundio-prep",
          "have been + ing",
          "pasado simple",
          "IN ON AT",
          "gerundio sin to be",
          "cortar o reescribir el guion canon module-05"
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
          "ing continuo",
          "estar + ando",
          "estar + endo",
          "estoy trabajando",
          "ando endo continuo",
          "modulo 5",
          "módulo 5",
          "clase 009",
          "clase 9",
          "el gerundio",
          "to vs ing"
        ],
        "bridge": "Puente Módulo 5 / Clase 009: TO BE = llave; ING = puerta; TO = flecha; ING = concepto; después de preposición, siempre ING."
      },
      {
        "id": "perfect",
        "svg": "assets/canon/verbos-perfecto.svg",
        "title": "Modulo 4 — Perfecto HAVE/HAS/HAD + BEEN+ING",
        "formula": "HAVE/HAS+PP · HAD+PP · HAVE/HAS+BEEN+ING · HAD+BEEN+ING — español HABER primero",
        "example": "I have gone. She has seen it. When I arrived she had left. I have been working here.",
        "never": [
          "enseñar perfecto como pasado simple con ancla yesterday",
          "I gone / she seen sin HAVE/HAS",
          "HAS en pasado perfecto (solo HAD)",
          "BEEN sin ING cuando la acción sigue",
          "cortar o reescribir el guion canon module-04"
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
          "modulo 4",
          "módulo 4",
          "modulo 4 perfecto",
          "clase 008",
          "clase 8",
          "have has had participio",
          "explicame el perfecto",
          "explicame el presente perfecto",
          "explicame pasado perfecto",
          "enseñame el perfecto",
          "he ido",
          "habia ido",
          "había ido"
        ],
        "bridge": "Puente Modulo 4: español HABER+participio → HAVE/HAS+PP (afecta ahora) · HAD+PP (antes de otro pasado) · BEEN activa ING (sigue ahora). Piezas LEGO. Integra M1+M2+M3."
      },
      {
        "id": "past",
        "svg": "assets/canon/verbos-pasado.svg",
        "title": "Modulo 3 — Pasado simple (16 verbos)",
        "formula": "En pasado nadie cambia · BE → was/were · ancla yesterday/last/ago · put/cut/let iguales",
        "example": "She went yesterday. They were here. I put my keys on the table last night.",
        "never": [
          "presente perfecto",
          "pasado perfecto",
          "past perfect",
          "have/has/had + participio",
          "moneda",
          "continuo",
          "cortar o reescribir el guion canon module-03",
          "agregar ED a irregulares (goed/sended/maked)"
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
          "imagen del pasado",
          "modulo 3",
          "módulo 3",
          "modulo 3 pasado",
          "clase 007",
          "clase 7",
          "16 verbos en pasado",
          "verbos en pasado",
          "was were en pasado",
          "was y were en pasado",
          "ancla temporal",
          "yesterday last week",
          "explicame el pasado",
          "enseñame el pasado"
        ],
        "bridge": "Puente Modulo 3: en pasado nadie cambia el verbo (alivio vs presente). Excepción BE: I/He/She/It → WAS; You/We/They → WERE. put/cut/let iguales — ancla dice el tiempo. Integra M1+M2."
      },
      {
        "id": "present",
        "svg": "assets/canon/verbos-presente.svg",
        "title": "Modulo 2 — Verbos presente + conjugacion",
        "formula": "TO = infinitivo · He/She/It + S · Go/Do → ES · Have → Has · Be → am/is/are",
        "example": "She goes. He does. It has. I go. We see them.",
        "never": [
          "presente continuo",
          "presente perfecto",
          "pasado simple",
          "cortar o reescribir el guion canon module-02"
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
          "el presente",
          "modulo 2",
          "módulo 2",
          "modulo 2 verbos",
          "16 verbos",
          "dieciseis verbos",
          "verbos en presente",
          "conjugacion presente",
          "conjugaciones de pronombre",
          "to infinitivo",
          "goes does has",
          "explicame los 16 verbos",
          "enseñame el presente"
        ],
        "bridge": "Puente Modulo 2: pronombre solo no sirve — necesita verbo. TO = señal de infinitivo (desaparece al conjugar). He/She/It → +S; Go/Do → ES; Have → Has; Be → am/is/are. 16 verbos. Conecta con los 5 tipos de pronombres."
      },
      {
        "id": "modales",
        "svg": "assets/canon/will-would.svg",
        "title": "Clase 010 — WILL / WOULD y modales (Módulo 6)",
        "formula": "pronombre + modal + verbo base (sin TO) + complemento",
        "example": "I will go. / I would go. / She should study.",
        "never": [
          "metodo moneda",
          "inversion",
          "confundir would have / should have con este track",
          "modal + TO",
          "cortar o reescribir el guion canon module-06"
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
          "explicame would",
          "modulo 6",
          "módulo 6",
          "clase 010",
          "clase 10",
          "el ré",
          "el ría",
          "ré y ría"
        ],
        "bridge": "Puente Módulo 6 / Clase 010: WILL=RÉ (va a pasar de verdad); WOULD=RÍA (hipotético). Todos los modales van con verbo base sin TO. El sistema culmina en WILL + HAVE + PARTICIPIO, con BY como momento límite."
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
        "svg": "assets/canon/will-would.svg",
        "title": "Clase 010 — WILL = RÉ (futuro real)",
        "formula": "pronombre + will + verbo base (sin TO) + complemento",
        "example": "I will call you tomorrow. / She will work on Monday.",
        "never": [
          "convertir going to en el foco principal de la clase",
          "usar wills o will + TO",
          "mezclar would have / should have",
          "cortar o reescribir el guion canon module-06"
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
          "will y going to",
          "el ré"
        ],
        "bridge": "Puente Módulo 6 / Clase 010: WILL=RÉ cuando va a pasar de verdad; WOULD=RÍA cuando es hipotético. Modal + verbo base sin TO. Going to puede nombrarse como plan, pero el foco es WILL/WOULD. Con WILL + HAVE + PARTICIPIO y BY se forma el futuro perfecto."
      },
      {
        "id": "pronouns",
        "svg": "assets/canon/pronombres.svg",
        "title": "Los 5 tipos de pronombres",
        "formula": "Sujeto | Objeto | Posesivo Adj | Posesivo Pron | Reflexivo",
        "example": "She / Her / Her / Hers / Herself — We / Us / Our / Ours / Ourselves",
        "never": [
          "enseñar solo I/you/he sin los 5 tipos",
          "mezclar con tiempos verbales en esta lección",
          "cortar o reescribir el guion canon module-01"
        ],
        "aliases": [
          "pronombres",
          "los pronombres",
          "5 tipos de pronombres",
          "cinco tipos de pronombres",
          "los 5 tipos",
          "módulo 1",
          "modulo 1",
          "modulo 1 pronombres",
          "pronouns",
          "subject pronouns",
          "object pronouns",
          "posesivo adjetivo",
          "posesivo pronominal",
          "reflexivos",
          "myself yourself himself",
          "mine yours hers",
          "explicame los pronombres",
          "enseñame los pronombres"
        ],
        "bridge": "Puente: 5 tipos — sujeto hace la acción; objeto recibe; pos.adj acompaña; pos.pron reemplaza; reflexivo vuelve al sujeto. Misma lógica ES↔EN."
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
  var CACHE_VER = '20260804canon1';
  var VOICE_PACK = {
    tracks: {
      gerundio: {
        say: "Mucha gente se confunde con el í ene je. Tres formas: uno, to be más verbo más í ene je es progreso — ando endo. Sin to be no hay ese progresivo. Dos, verbo más í ene je sin to be es actividad general: I like watching TV. Tres, to más verbo es intención: I like to watch TV. Mirás el tablero y practicás una oral."
      },
      progressive: {
        say: "Presente progresivo: to be más verbo más í ene je es acción en progreso — ando endo. Ejemplo: I am watching TV. Sin to be no hay progresivo. No lo confundás con I like watching, que es general, ni con I like to watch, que es intención."
      },
      gerund_prep: {
        say: "Tras prep, verbo más í ene je igual a ando endo. Before leaving. No lleva am is are."
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

  /** Solo comando de enseñar (explicame / explain / teach me). NO palabras sueltas ni “qué es”. */
  function isTeachCommand(text) {
    var t = String(text || '');
    return /\b(explicame|expl[ií]c[aá](?:me|melo|me\s+lo)?|explain(?:\s+me)?|teach(?:\s+me)?|ense[nñ]ame|ense[nñ][aá](?:me)?|mostr[aá]me(?:\s+el)?\s+(tablero|imagen|pizarra)|show\s+me)\b/i.test(t);
  }

  function isExplicitTopicAsk(text) {
    return isTeachCommand(text);
  }

  function isEnglishPracticeUtterance(text) {
    var t = String(text || '').trim();
    if (!t || t.length > 220) return false;
    if (isExplicitTopicAsk(t)) return false;
    if (/[áéíóúñ¿¡]/i.test(t)) return false;
    return /\b(i|you|he|she|it|we|they|will|would|can|like|watch|watching|go|going|am|is|are|have|has|had|the|a|an|in|on|at|to|for|morning|today|tomorrow)\b/i.test(t)
      && /[a-zA-Z]{2,}/.test(t);
  }

  function isStrongTopicSwitch(ask, namedTrack) {
    if (!namedTrack) return false;
    var n = normalize(ask);
    var aliases = namedTrack.aliases || [];
    var best = 0;
    for (var i = 0; i < aliases.length; i++) {
      var a = normalize(aliases[i]);
      if (!a || a.length < 2) continue;
      if (n.indexOf(a) === -1) continue;
      if (a.length > best) best = a.length;
    }
    if (best >= 8) return true;
    return /\b(preposicion(?:es)?|gerundio|futuro|pasado|presente|pronombre(?:s)?|art[ií]culo(?:s)?|negacion(?:es)?|modales|perfecto|continuo|comparativ|irregular)\b/i.test(String(ask || ''));
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
    var stickyTrack = sticky ? (trackById(sticky) || pickTrack(sticky) || pickTrack(stripAskShell(sticky))) : null;
    // LOCK GENERAL: lección activa → solo pedido EXPLÍCITO de OTRO tema puede cambiar
    if (stickyTrack) {
      if (isExplicitTopicAsk(ask)) {
        // Solo otro MÓDULO nombrado (alias fuerte) — no "qué es will"
        var named = pickTrack(ask) || pickTrack(stripAskShell(ask));
        if (named && named.id !== stickyTrack.id && isStrongTopicSwitch(ask, named)) return named;
      }
      return stickyTrack;
    }
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
      past: [
        'ANTIMEZCLA — MÓDULO 3 PASADO SIMPLE (16 VERBOS + WAS/WERE):',
        'PROHIBIDO: pasado perfecto, present perfect, have/has/had + participio, ED en irregulares.',
        'SOLO: en pasado nadie cambia; BE → was/were; ancla yesterday/last/ago.',
        'SEGUÍ EL GUION CANON module-03-pasado-simple SIN CORTAR NI REESCRIBIR.'
      ],
      perfect: [
        'ANTIMEZCLA — MÓDULO 4 PERFECTO (HAVE/HAS/HAD + BEEN+ING):',
        'PROHIBIDO I gone sin HAVE/HAS; PROHIBIDO HAS en pasado perfecto; PROHIBIDO perfecto como yesterday.',
        'SEGUÍ EL GUION CANON module-04-perfecto SIN CORTAR NI REESCRIBIR.'
      ],
      combined: [
        'ANTIMEZCLA — MÓDULO 4 BEEN+ING:',
        'BEEN activa ING. SEGUÍ guion module-04-perfecto.'
      ],
      present: [
        'ANTIMEZCLA — MÓDULO 2 VERBOS PRESENTE (16 VERBOS + CONJUGACIÓN):',
        'SOLO presente simple + TO infinitivo + He/She/It +S/ES/Has + Be am/is/are.',
        'PROHIBIDO presente continuo / perfecto / pasado en esta lección.',
        'SEGUÍ EL GUION CANON module-02-verbos-presente SIN CORTAR NI REESCRIBIR.'
      ],
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
      prepositions: [
        'ANTIMEZCLA — MÓDULO 7 / CLASE 011 PREPOSICIONES:',
        'SOLO preposiciones. PROHIBIDO artículos a/an/the como foco.',
        'Tres círculos: IN grande=adentro; ON mediano=encima; AT=punto.',
        'SEGUÍ EL GUION CANON module-07-preposiciones ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
      ],
      prepositions_time: [
        'ANTIMEZCLA — MÓDULO 7 / CLASE 011 PREPOSICIONES (tiempo):',
        'IN períodos; ON días; AT horas; SINCE/FOR/DURING/BY.',
        'SEGUÍ EL GUION CANON module-07-preposiciones ÍNTEGRO SIN CORTAR NI REESCRIBIR.'
      ],
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
    isTeachCommand: isTeachCommand,
    isExplicitTopicAsk: isExplicitTopicAsk,
    isEnglishPracticeUtterance: isEnglishPracticeUtterance,
    resolveAsk: resolveAsk,
    resolveAskId: resolveAskId,
    resolvePieceTrack: resolvePieceTrack,
    trackById: trackById,
    formatLock: formatLock,
    byColumn: byColumn,
    CACHE_VER: CACHE_VER
  };
})(typeof window !== 'undefined' ? window : globalThis);
