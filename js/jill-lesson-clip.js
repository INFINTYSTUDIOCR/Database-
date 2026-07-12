/**
 * Jill Lesson Clip — ejercicios reales (cajas EN→ES con flechas) + botones de fórmula.
 * Sin glow/flash palabra-por-palabra (nada estilo Duolingo).
 */
(function (global) {
  'use strict';

  var VERSION = '20260711fp';
  var _host = null;
  var _timer = null;
  var _gen = 0;
  var _playing = false;

  var DEFAULT_COLORS = {
    1: '#A78BFA',
    2: '#F59E0B',
    3: '#38BDF8',
    4: '#34D399',
    5: '#F472B6'
  };

  /* Pace: sentences stay on screen long enough to read while Jill speaks */
  var DEFAULT_PACE = { slotMs: 480, spaceMs: 90, betweenMs: 2200, endHoldMs: 2800, loop: false };

  function T(parts) { return { text: parts }; }

  function clip(def) {
    def.colors = def.colors || DEFAULT_COLORS;
    def.pace = def.pace || DEFAULT_PACE;
    return def;
  }

  function row(left, right, note) {
    return { left: left, right: right, note: note || '' };
  }
  function tip(left, right, tipText) {
    return { left: left, right: right, tip: tipText || '' };
  }

  /** Ejercicios reales — cajas con flechas (estilo lección Claude). */
  var BOARDS = {
    negations: {
      rules: [row('do not', "don't", '(no)'), row('does not', "doesn't", '(no — para He / She / It)')],
      examples: [row("I don't go", 'Yo no voy'), row("He doesn't work", 'Él no trabaja'), row("She doesn't know", 'Ella no sabe')],
      pattern: '¿Notás el patrón? Cuando usás DON\'T o DOESN\'T — el verbo vuelve a su forma original.',
      transforms: [tip('He goes', "He doesn't go", 'no "goes" — vuelve a "go"'), tip('She has', "She doesn't have", 'no "has" — vuelve a "have"')],
      takeaway: 'El verbo principal siempre vuelve al infinitivo cuando hay negación.'
    },
    present: {
      rules: [
        row('TO + verbo', 'señal de infinitivo', 'desaparece al conjugar'),
        row('I / you / we / they', 'verbo base', 'sin cambio'),
        row('he / she / it', 'verbo + S', 'regla de oro'),
        row('go / do', 'goes / does', 'termina en O → ES'),
        row('have', 'has', 'cambia completo'),
        row('be', 'am / is / are', 'único con 3 formas')
      ],
      examples: [
        row('To go → I go', 'TO se fue al conjugar'),
        row('She goes', 'She + O → ES'),
        row('He does', 'He + O → ES'),
        row('It has', 'Have → Has'),
        row('She sees me', 'verbo + objeto (M1)'),
        row('He keeps his car', 'verbo + pos.adj (M1)'),
        row('She sees herself', 'verbo + reflexivo (M1)')
      ],
      pattern: 'He, She, It — agrega S. Go y Do — agrega ES. Have — cambia a Has. Be — am/is/are. Los módulos se conectan.',
      transforms: [
        tip('She / go', 'She goes', 'O → ES'),
        tip('He / do', 'He does', 'O → ES'),
        tip('It / have', 'It has', 'Have → Has'),
        tip('They / go', 'They go', 'They no cambia'),
        tip('She / make', 'She makes', '+ S')
      ],
      takeaway: '16 verbos + He/She/It. Antes de conjugar: ¿Es He, She o It?'
    },
    past: {
      rules: [row('verbo regular', 'verbo + ed', '(worked)'), row('verbo irregular', 'forma 2', '(went / saw / made)')],
      examples: [row('She worked yesterday', 'Ella trabajó ayer'), row('I went home', 'Yo me fui a casa'), row('They saw the movie', 'Ellos vieron la película')],
      pattern: 'Pasado = acción terminada. No hace falta auxiliar en afirmativa.',
      transforms: [tip('I work', 'I worked', 'regular → -ed'), tip('I go', 'I went', 'irregular → forma 2')],
      takeaway: 'En pasado afirmativo: solo cambiás el verbo. En negativa: did + not + base.'
    },
    progressive: {
      rules: [row('español', 'ESTAR + ando/endo', ''), row('inglés', 'TO BE + VERBO+ING', '(am / is / are)')],
      examples: [row('I am studying English now', 'Estoy estudiando inglés ahora'), row('She is cooking dinner', 'Ella está cocinando la cena'), row('They are playing soccer', 'Ellos están jugando fútbol')],
      pattern: 'Sin TO BE no hay progresivo. ING = ando/endo.',
      transforms: [tip('I study', 'I am studying', 'añadís am/is/are + ING'), tip('She cooks', 'She is cooking', 'cook → cooking')],
      takeaway: 'Progresivo = TO BE + verbo + í ene je (ando/endo).'
    },
    perfect: {
      rules: [
        row('have · has · had', 'jaf · jas · jad', '(decí con pausa)'),
        row('I / you / we / they', 'have + participio', '(he…)'),
        row('he / she / it', 'has + participio', '(ha…)'),
        row('todos', 'had + participio', '(había… = pasado perfecto)')
      ],
      examples: [
        row('have · has · had', 'jaf · jas · jad'),
        row('I have finished', 'Yo he terminado'),
        row('She has seen it', 'Ella lo ha visto'),
        row('I had finished', 'Yo había terminado'),
        row('They had gone', 'Ellos habían ido')
      ],
      pattern: 'Primero el paradigm: jaf. jas. jad. Luego: have/has + participio = presente perfecto. Had + participio = pasado perfecto (había).',
      transforms: [
        tip('have / has', 'he / ha + participio', 'presente perfecto'),
        tip('had', 'había + participio', 'pasado perfecto'),
        tip('I finished yesterday', 'I had finished before…', 'pasado simple ≠ pasado perfecto')
      ],
      takeaway: 'Siempre empezá por jaf. jas. jad. Presente perfecto = have/has + participio. Pasado perfecto = had + participio.'
    },
    have_had: {
      rules: [
        row('have', 'jaf', 'I / you / we / they'),
        row('has', 'jas', 'he / she / it'),
        row('had', 'jad', 'pasado / pasado perfecto')
      ],
      examples: [
        row('have · has · had', 'jaf · jas · jad'),
        row('I have finished', 'Yo he terminado'),
        row('She has finished', 'Ella ha terminado'),
        row('I had finished', 'Yo había terminado')
      ],
      pattern: 'Decí con pausa en voz CR: jaf. jas. jad. — nunca "ave".',
      transforms: [
        tip('have', 'has', '3ª persona → jas'),
        tip('have / has', 'had', 'pasado / había → jad')
      ],
      takeaway: 'jaf. jas. jad. — tres formas. Had = pasado perfecto auxiliar.'
    },
    future: {
      rules: [row('will + verbo', '-ré / -rá', '(decisión / futuro)'), row('going to + verbo', 'voy a…', '(plan)')],
      examples: [row('I will call you tomorrow', 'Te llamaré mañana'), row('I am going to study', 'Voy a estudiar'), row('They are going to travel', 'Ellos van a viajar')],
      pattern: 'Will = decisión o predicción. Going to = plan ya pensado.',
      transforms: [tip('I call', 'I will call', 'will + base'), tip('I study', 'I am going to study', 'be + going to + base')],
      takeaway: 'Futuro: will + base, o am/is/are + going to + base.'
    },
    future_perfect: {
      rules: [
        row('will + have + participio', 'habré / habrá…', '(futuro perfecto)'),
        row('by Friday / by then', 'antes de ese punto', '(marca de tiempo)')
      ],
      examples: [
        row('I will have finished', 'Yo habré terminado'),
        row('She will have left by 5', 'Ella habrá salido para las 5'),
        row('They will have done it', 'Ellos lo habrán hecho'),
        row('We will have arrived', 'Habremos llegado')
      ],
      pattern: 'Will + have + participio = acción terminada ANTES de un momento futuro. No es should have.',
      transforms: [
        tip('I finish', 'I will have finished', 'will + have + V3'),
        tip('I will finish', 'I will have finished', 'futuro simple ≠ futuro perfecto')
      ],
      takeaway: 'Futuro perfecto = will + have + participio (habré terminado). Pediste esto → esto se enseña YA.'
    },
    modales: {
      rules: [row('will', '-ré', ''), row('would', '-ría', ''), row('should', 'debería', ''), row('can', 'puedo', '')],
      examples: [row('I can work', 'Yo puedo trabajar'), row('She should study', 'Ella debería estudiar'), row('They will call you', 'Ellos te llamarán')],
      pattern: 'Modal + verbo BASE (sin to). Nunca "can to work".',
      transforms: [tip('I work', 'I can work', 'modal + base'), tip('She studies', 'She should study', 'should + base (sin -s)')],
      takeaway: 'Después del modal el verbo vuelve a la forma base.'
    },
    combined: {
      rules: [row('have / has / had', 'been', ''), row('been + VERBO+ING', 'he estado + ando/endo', '')],
      examples: [row('I have been studying English', 'He estado estudiando inglés'), row('She has been working', 'Ella ha estado trabajando'), row('They have been waiting', 'Ellos han estado esperando')],
      pattern: 'Have + been + ING = duración hasta ahora (ando/endo).',
      transforms: [tip('I study', 'I have been studying', 'have + been + ING'), tip('She works', 'She has been working', 'has + been + ING')],
      takeaway: 'Have/has + been + verbo + í ene je.'
    },
    there: {
      rules: [row('There is', 'hay (1)', ''), row('There are', 'hay (2+)', ''), row('have / has', 'posesión', '(tengo / tiene)')],
      examples: [row('There is a book on the table', 'Hay un libro en la mesa'), row('There are two chairs', 'Hay dos sillas'), row('I have a book', 'Yo tengo un libro')],
      pattern: 'There is/are = existencia (HAY). Have/has = posesión (TENGO).',
      transforms: [tip('I have a car', 'There is a car', 'posesión vs existencia'), tip('She has two dogs', 'There are two dogs', 'has ≠ there are')],
      takeaway: 'No mezcles HAY (there) con TENGO (have).'
    },
    prepositions: {
      rules: [row('IN', 'dentro / caja', ''), row('ON', 'encima / superficie', ''), row('AT', 'punto en el mapa', '')],
      examples: [row('The book is on the table', 'El libro está sobre la mesa'), row('I am at home', 'Estoy en casa'), row('She lives in San José', 'Ella vive en San José')],
      pattern: 'IN = caja, ON = superficie, AT = punto.',
      transforms: [tip('in the box', 'on the table', 'dentro vs encima'), tip('at the door', 'in the room', 'punto vs interior')],
      takeaway: 'Las prep de lugar van en el complemento, no en el verbo.'
    },
    prepositions_time: {
      rules: [row('IN', 'mes / año', ''), row('ON', 'día / fecha', ''), row('AT', 'hora', '')],
      examples: [row('We meet on Monday', 'Nos vemos el lunes'), row('In March it rains', 'En marzo llueve'), row('At 5 pm we start', 'A las 5 empezamos')],
      pattern: 'Misma lógica: IN amplio, ON día, AT hora exacta.',
      transforms: [tip('in 2024', 'on Friday', 'año vs día'), tip('at 5', 'in the morning', 'hora vs parte del día')],
      takeaway: 'IN mes/año · ON día · AT hora.'
    },
    gerundio: {
      rules: [row('VERBO + ING', 'ando / endo como sustantivo', '(sin to be)'), row('TO BE + ING', 'progresivo', '(estar + ando/endo)')],
      examples: [row('I like running', 'Me gusta correr'), row('Playing guitar is fun', 'Tocar guitarra es divertido'), row('She enjoys cooking', 'A ella le gusta cocinar')],
      pattern: 'Sin TO BE, el ING actúa como sustantivo (gerundio).',
      transforms: [tip('I run', 'I like running', 'verbo → ING sustantivo'), tip('I am running', 'I like running', 'progresivo ≠ gerundio')],
      takeaway: 'Gerundio = VERBO+ING sin to be. Progresivo = to be + ING.'
    },
    gerund_prep: {
      rules: [row('preposición', 'VERBO + ING', '(ando/endo)'), row('before / after / without / by', '+ leaving / eating…', '')],
      examples: [row('Before leaving, call me', 'Antes de irte, llamame'), row('After eating, we left', 'Después de comer, nos fuimos'), row('By practicing, you improve', 'Practicando, mejorás')],
      pattern: 'Después de prep, el verbo va en ING — no en base.',
      transforms: [tip('before leave', 'before leaving', 'prep + ING'), tip('without think', 'without thinking', 'nunca prep + base')],
      takeaway: 'Tras preposición → VERBO + í ene je.'
    },
    modal: {
      rules: [row('Aux ANTES del pronombre', 'pregunta', ''), row('Aux DESPUÉS del pronombre', 'respuesta', '')],
      examples: [row('Are you coming?', '¿Venís?'), row('You are coming', 'Vos venís'), row('Do you work?', '¿Trabajás?')],
      pattern: 'Método moneda: el auxiliar se voltea para preguntar.',
      transforms: [tip('You are ready', 'Are you ready?', 'aux al frente'), tip('She works', 'Does she work?', 'does + base')],
      takeaway: 'Pregunta = auxiliar delante del pronombre.'
    },
    irregular_verbs: {
      rules: [row('Columna 1', 'presente', 'go · do · see'), row('Columna 2', 'pasado', 'went · did · saw'), row('Columna 3', 'participio', 'gone · done · seen')],
      examples: [row('go · went · gone', 'ir · fui · ido'), row('do · did · done', 'hacer · hice · hecho'), row('see · saw · seen', 'ver · vi · visto')],
      pattern: 'Decí las tres formas con pausa: go. went. gone.',
      transforms: [tip('I go', 'I went', 'forma 2'), tip('I went', 'I have gone', 'forma 3 con have')],
      takeaway: 'Tres fotos del verbo irregular — de memoria con ritmo.'
    },
    articles: {
      rules: [row('a / an', 'uno / una', '(indefinido)'), row('the', 'el / la / los / las', '(definido)')],
      examples: [row('I see a cat', 'Veo un gato'), row('The cat is black', 'El gato es negro'), row('She is an engineer', 'Ella es ingeniera')],
      pattern: 'A/an = primera mención. The = ya sabemos de cuál.',
      transforms: [tip('a apple', 'an apple', 'an ante vocal'), tip('a cat', 'the cat', 'ya conocido → the')],
      takeaway: 'A/an introduce; the señala algo conocido.'
    },
    pronouns: {
      rules: [
        row('Sujeto', 'hace la acción', 'I · You · He · She · It · We · They'),
        row('Objeto', 'recibe la acción', 'Me · You · Him · Her · It · Us · Them'),
        row('Pos.Adj', 'acompaña', 'My · Your · His · Her · Its · Our · Their'),
        row('Pos.Pron', 'reemplaza', 'Mine · Yours · His · Hers · Ours · Theirs'),
        row('Reflexivo', 'vuelve al sujeto', 'Myself · Yourself · Himself · Herself · Itself · Ourselves · Yourselves · Themselves')
      ],
      examples: [
        row('She goes to work', 'Sujeto — She hace'),
        row('I called her', 'Objeto — her recibe'),
        row('Her phone is here', 'Pos.Adj — acompaña'),
        row('That bag is hers', 'Pos.Pron — reemplaza'),
        row('He hurt himself', 'Reflexivo — vuelve'),
        row('She · Her · Her · Hers · Herself', '5 formas · 5 funciones'),
        row('We · Us · Our · Ours · Ourselves', 'progresión nosotros')
      ],
      pattern: 'Misma lógica ES↔EN. You/It no cambian sujeto↔objeto. His igual adj/pronominal.',
      transforms: [
        tip('Ella — sujeto', 'She', 'hace'),
        tip('Ella — objeto', 'Her', 'recibe'),
        tip('Ella — pos.adj', 'Her', 'acompaña'),
        tip('Ella — pos.pron', 'Hers', 'reemplaza'),
        tip('Ella — reflexivo', 'Herself', 'vuelve')
      ],
      takeaway: 'Cinco tipos. Rapid Fire: español + tipo → inglés <2s.'
    },
    comparatives: {
      rules: [row('adjetivo corto', '-er + than', 'taller than'), row('adjetivo largo', 'more + than', 'more interesting'), row('igualdad', 'as … as', 'as tall as')],
      examples: [row('She is taller than me', 'Ella es más alta que yo'), row('This is more interesting than that', 'Esto es más interesante'), row('He is as tall as his brother', 'Él es tan alto como su hermano')],
      pattern: 'Corto → -er. Largo → more. Igual → as…as.',
      transforms: [tip('tall', 'taller than', '-er'), tip('interesting', 'more interesting than', 'more')],
      takeaway: 'Comparás con -er/more + than, o as…as para igualdad.'
    },
    if_was_were: {
      rules: [row('If I was', 'pasado real', ''), row('If I were', 'hipótesis', ''), row('If I were to', 'poco probable', '')],
      examples: [row('If I was tired, I rested', 'Si estaba cansado, descansé'), row('If I were rich, I would travel', 'Si fuera rico, viajaría'), row('If I were to win, I would celebrate', 'Si llegara a ganar, celebraría')],
      pattern: 'Was = real. Were = imaginario. Were to = todavía más hipotético.',
      transforms: [tip('If I was…', 'pasado que pasó', 'real'), tip('If I were…', 'would + base', 'hipótesis')],
      takeaway: 'Was / were / were to — tres grados de realidad.'
    },
    modal_have_pp: {
      rules: [row('should have + participio', 'debería haber…', ''), row('could have + participio', 'podría haber…', '')],
      examples: [row('You should have studied more', 'Deberías haber estudiado más'), row('She could have called', 'Ella podría haber llamado'), row('I would have helped', 'Yo habría ayudado')],
      pattern: 'Modal + have + participio = pasado hipotético / arrepentimiento.',
      transforms: [tip('You study', 'You should have studied', 'should + have + V3'), tip('She calls', 'She could have called', 'could + have + V3')],
      takeaway: 'Modal + have + participio — nunca "should had".'
    },
    modal_have_been: {
      rules: [row('modal + have been', '+ VERBO+ING', ''), row('must have been working', 'debió haber estado…', '')],
      examples: [row('She must have been working', 'Ella debió haber estado trabajando'), row('They should have been studying', 'Deberían haber estado estudiando'), row('He could have been sleeping', 'Podría haber estado durmiendo')],
      pattern: 'Modal + have + been + ING = conjetura sobre una acción en progreso.',
      transforms: [tip('She was working', 'She must have been working', 'conjetura'), tip('They study', 'They should have been studying', 'deberían haber estado')],
      takeaway: 'Modal + have been + verbo + í ene je.'
    },
    overview: {
      rules: [row('PR', 'presente', 'I work'), row('PS', 'pasado', 'I worked'), row('PC', 'continuo', 'I am working'), row('PRP', 'perfecto', 'I have worked')],
      examples: [row('I work', 'Yo trabajo (hábito)'), row('I worked', 'Yo trabajé'), row('I am working', 'Estoy trabajando'), row('I have worked', 'He trabajado')],
      pattern: 'Misma idea — distinta ranura de tiempo.',
      transforms: [tip('work', 'worked / working / have worked', 'cambiá la ranura')],
      takeaway: 'Elegí el tiempo según cuándo / cómo pasó la acción.'
    }
  };

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
      title: 'Módulo 2 · 16 verbos presente',
      bridge: 'TO=infinitivo · He/She/It +S · Go/Do→ES · Have→Has · Be am/is/are',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Verbo', hint: 'base / +s / ES / has' },
        { id: 3, label: 'Complemento', hint: 'objeto / pos / reflexivo' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['go', 2], [' ', 0], ['home every day.', 3]]),
        T([['She', 1], [' ', 0], ['goes', 2], [' ', 0], ['to work.', 3]]),
        T([['He', 1], [' ', 0], ['does', 2], [' ', 0], ['his homework.', 3]]),
        T([['It', 1], [' ', 0], ['has', 2], [' ', 0], ['a meeting.', 3]]),
        T([['She', 1], [' ', 0], ['sees', 2], [' ', 0], ['me.', 3]]),
        T([['He', 1], [' ', 0], ['keeps', 2], [' ', 0], ['himself focused.', 3]])
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
      title: 'Have / Has / Had + Participio',
      bridge: 'jaf. jas. jad. → have/has + participio (he/ha) · had + participio (había = pasado perfecto)',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · he · they' },
        { id: 2, label: 'Have / Has / Had', hint: 'jaf · jas · jad' },
        { id: 3, label: 'Participio', hint: 'done · gone · seen' }
      ],
      examples: [
        T([['have', 2], ['. ', 0], ['has', 2], ['. ', 0], ['had', 2], ['.', 0]]),
        T([['He', 1], [' ', 0], ['has', 2], [' ', 0], ['done', 3], [' it.', 0]]),
        T([['I', 1], [' ', 0], ['have', 2], [' ', 0], ['seen', 3], [' that.', 0]]),
        T([['I', 1], [' ', 0], ['had', 2], [' ', 0], ['finished', 3], ['.', 0]]),
        T([['They', 1], [' ', 0], ['had', 2], [' ', 0], ['gone', 3], ['.', 0]])
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

    future_perfect: clip({
      id: 'future_perfect',
      title: 'Futuro perfecto · will have + participio',
      bridge: 'will + have + participio = habré / habrá terminado (antes de un punto futuro)',
      slots: [
        { id: 1, label: 'Pronombre', hint: 'I · she · they' },
        { id: 2, label: 'Will have', hint: 'habré / habrá' },
        { id: 3, label: 'Participio', hint: 'finished · done · left' }
      ],
      examples: [
        T([['I', 1], [' ', 0], ['will have', 2], [' ', 0], ['finished', 3], ['.', 0]]),
        T([['She', 1], [' ', 0], ['will have', 2], [' ', 0], ['left', 3], [' by 5.', 0]]),
        T([['They', 1], [' ', 0], ['will have', 2], [' ', 0], ['done', 3], [' it.', 0]]),
        T([['We', 1], [' ', 0], ['will have', 2], [' ', 0], ['arrived', 3], ['.', 0]]),
        T([['You', 1], [' ', 0], ['will have', 2], [' ', 0], ['seen', 3], [' it.', 0]])
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

    pronouns: clip({
      id: 'pronouns',
      title: 'Los 5 tipos de pronombres',
      bridge: 'Sujeto · Objeto · Pos.Adj · Pos.Pron · Reflexivo — misma lógica ES↔EN',
      slots: [
        { id: 1, label: 'Sujeto', hint: 'hace' },
        { id: 2, label: 'Objeto', hint: 'recibe' },
        { id: 3, label: 'Pos.Adj', hint: 'acompaña' },
        { id: 4, label: 'Pos.Pron', hint: 'reemplaza' },
        { id: 5, label: 'Reflexivo', hint: 'vuelve' }
      ],
      examples: [
        T([['She', 1], [' goes to work.', 0]]),
        T([['I called', 0], [' ', 0], ['her', 2], ['.', 0]]),
        T([['Her', 3], [' phone is here.', 0]]),
        T([['That bag is', 0], [' ', 0], ['hers', 4], ['.', 0]]),
        T([['He hurt', 0], [' ', 0], ['himself', 5], ['.', 0]])
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
    var c = CLIPS[columnId] || null;
    if (!c) return null;
    if (!c.board && BOARDS[columnId]) c.board = BOARDS[columnId];
    return c;
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function joinExample(ex) {
    if (!ex || !ex.text) return '';
    return ex.text.map(function (p) { return p[0]; }).join('');
  }

  function normalizeBoard(def) {
    if (def.board) return def.board;
    if (BOARDS[def.id]) return BOARDS[def.id];
    var examples = (def.examples || []).slice(0, 4).map(function (ex) {
      return row(joinExample(ex), '');
    });
    return {
      rules: def.bridge ? [row(def.title, def.bridge, '')] : [],
      examples: examples,
      pattern: '',
      transforms: [],
      takeaway: ''
    };
  }

  function renderLine(item, mode) {
    var left = esc(item.left || '');
    var right = esc(item.right || '');
    var note = esc(item.note || '');
    var tipHtml = item.tip ? '<span class="jill-ex-tip">&lt;- ' + esc(item.tip) + '</span>' : '';
    var noteHtml = note ? '<span class="jill-ex-note">' + note + '</span>' : '';
    if (mode === 'rule') {
      return '<div class="jill-ex-line">'
        + '<span class="jill-ex-en">' + left + '</span>'
        + '<span class="jill-ex-arrow" aria-hidden="true">-&gt;</span>'
        + '<span class="jill-ex-es">' + right + '</span>'
        + (noteHtml ? ' ' + noteHtml : '')
        + '</div>';
    }
    if (mode === 'transform') {
      return '<div class="jill-ex-line jill-ex-line-transform">'
        + '<span class="jill-ex-en">' + left + '</span>'
        + '<span class="jill-ex-arrow" aria-hidden="true">-&gt;</span>'
        + '<span class="jill-ex-es">' + right + '</span>'
        + tipHtml
        + '</div>';
    }
    return '<div class="jill-ex-line">'
      + '<span class="jill-ex-en">' + left + '</span>'
      + (right ? '<span class="jill-ex-arrow" aria-hidden="true">-&gt;</span><span class="jill-ex-es">' + right + '</span>' : '')
      + '</div>';
  }

  function renderBox(lines, mode) {
    if (!lines || !lines.length) return '';
    return '<div class="jill-ex-box">' + lines.map(function (L) { return renderLine(L, mode); }).join('') + '</div>';
  }

  function markActiveSlot(root, n) {
    if (!root) return;
    var siblings = root.querySelectorAll('.jill-clip-slot');
    for (var i = 0; i < siblings.length; i++) {
      var on = String(siblings[i].getAttribute('data-slot')) === String(n);
      siblings[i].classList.toggle('is-active', on);
      siblings[i].classList.remove('is-pulse');
    }
  }

  function buildMarkup(def) {
    var board = normalizeBoard(def);
    var slotsHtml = def.slots.map(function (s, idx) {
      var plus = idx < def.slots.length - 1
        ? '<span class="jill-clip-plus" aria-hidden="true">+</span>'
        : '';
      return '<button type="button" class="jill-clip-slot" data-slot="' + s.id + '" aria-label="' + esc(s.label) + '">'
        + '<span class="jill-clip-slot-label">' + esc(s.label) + '</span>'
        + '<span class="jill-clip-slot-hint">' + esc(s.hint) + '</span>'
        + '</button>' + plus;
    }).join('');

    return ''
      + '<div class="jill-clip jill-clip-exercises" data-clip="' + esc(def.id) + '" data-ver="' + VERSION + '">'
      + '  <p class="jill-clip-title">' + esc(def.title) + '</p>'
      + '  <div class="jill-ex-sheet">'
      +      renderBox(board.rules, 'rule')
      +      renderBox(board.examples, 'example')
      +      (board.pattern ? '<p class="jill-ex-pattern">' + esc(board.pattern) + '</p>' : '')
      +      renderBox(board.transforms, 'transform')
      +      (board.takeaway ? '<p class="jill-ex-takeaway">' + esc(board.takeaway) + '</p>' : '')
      + '  </div>'
      + '  <div class="jill-clip-row" role="group" aria-label="Fórmula">' + slotsHtml + '</div>'
      + '  <div class="jill-clip-footer">'
      + '    <span class="jill-clip-progress">Ejercicios · practicá con el mic</span>'
      + '  </div>'
      + '</div>';
  }

  function wire(root) {
    var slots = root.querySelectorAll('.jill-clip-slot');
    for (var i = 0; i < slots.length; i++) {
      slots[i].addEventListener('click', function (ev) {
        var n = parseInt(ev.currentTarget.getAttribute('data-slot'), 10) || 0;
        markActiveSlot(root, n);
      });
    }
  }

  function mount(host, columnId) {
    unmount();
    var def = getClip(columnId);
    if (!host || !def) return false;
    _host = host;
    host.innerHTML = buildMarkup(def);
    var root = host.querySelector('.jill-clip');
    if (!root) return false;
    wire(root);
    _gen += 1;
    _playing = false;
    return true;
  }

  function unmount() {
    _gen += 1;
    if (_timer) { clearTimeout(_timer); _timer = null; }
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
    CLIPS: CLIPS,
    BOARDS: BOARDS
  };
})(typeof window !== 'undefined' ? window : globalThis);
