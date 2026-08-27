(function (global) {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Desk-first chips (screenshot order), then language architecture.
  var GLOSS_CATS = [
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'metodo', label: 'Método' },
    { id: 'natural', label: 'Expresiones' },
    { id: 'extra', label: 'Conectores' },
    { id: 'phrasals', label: 'Phrasals' },
    { id: 'base', label: 'Fundamentos' },
    { id: 'pronouns', label: 'Pronombres' },
    { id: 'verbs', label: 'Verbos' },
    { id: 'tenses', label: 'Tiempos' },
    { id: 'prep', label: 'Preposiciones' },
    { id: 'articles', label: 'Artículos' },
    { id: 'affix', label: 'Prefijos' },
    { id: 'suffix', label: 'Sufijos' },
    { id: 'tech', label: 'Technicismos' },
    { id: 'casos', label: 'Casos' }
  ];

  function item(cat, en, es, how, a, b, forms) {
    var extra = Array.isArray(forms) ? { forms: forms } : (forms && typeof forms === 'object' ? forms : {});
    var examples = [];
    if (Array.isArray(extra.examples) && extra.examples.length) {
      examples = extra.examples.slice();
    } else {
      if (a) examples.push(a);
      if (b) examples.push(b);
      if (extra.c) examples.push(extra.c);
      if (extra.d) examples.push(extra.d);
    }
    return {
      cat: cat,
      en: en,
      es: es,
      how: how,
      why: extra.why || '',
      steps: extra.steps || [],
      avoid: extra.avoid || [],
      examples: examples.filter(Boolean),
      gloss: extra.gloss || '',
      forms: extra.forms || []
    };
  }

  function section(title, bodyHtml) {
    if (!bodyHtml) return '';
    return '<div class="inf-tb-sec"><div class="inf-tb-sec-label">' + esc(title) + '</div>' + bodyHtml + '</div>';
  }

  function renderDetail(selected) {
    if (!selected) {
      return '<div class="inf-tb-panel kh-lib-panel"><p class="inf-tb-empty kh-lib-empty">Tocá una tarjeta. Abajo vas a ver la explicación completa y ejemplos en inglés amplio (vida, estudio, trabajo cotidiano).</p></div>';
    }
    var ex = (selected.examples || []).filter(Boolean);
    var exHtml = ex.length
      ? '<ol class="inf-tb-ex-blocks">' + ex.map(function (e) {
          return '<li><blockquote class="inf-tb-quote">' + esc(e) + '</blockquote></li>';
        }).join('') + '</ol>'
      : '';
    var stepsHtml = (selected.steps && selected.steps.length)
      ? '<ol class="inf-tb-steps">' + selected.steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>'
      : '';
    var avoidHtml = (selected.avoid && selected.avoid.length)
      ? '<ul class="inf-tb-avoid">' + selected.avoid.map(function (av) { return '<li>' + esc(av) + '</li>'; }).join('') + '</ul>'
      : '';
    var formsHtml = (selected.forms && selected.forms.length)
      ? '<ul class="inf-tb-ex kh-lib-ex">' + selected.forms.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>'
      : '';
    var whyHtml = selected.why
      ? '<p class="inf-tb-how kh-lib-how">' + esc(selected.why) + '</p>'
      : '';
    var howHtml = selected.how
      ? '<p class="inf-tb-how kh-lib-how">' + esc(selected.how) + '</p>'
      : '';
    return '<div class="inf-tb-panel kh-lib-panel is-rich">'
      + '<h4>' + esc(selected.en) + '</h4>'
      + '<div class="inf-tb-es kh-lib-es">Español: <strong>' + esc(selected.es) + '</strong>' + (selected.gloss ? ' — ' + esc(selected.gloss) : '') + '</div>'
      + section('Para qué sirve', whyHtml)
      + section('Explicación completa', howHtml)
      + section((function () {
        var lang = { pronouns:1, verbs:1, tenses:1, prep:1, articles:1, extra:1, natural:1, phrasals:1, affix:1, suffix:1 };
        return lang[selected.cat] ? 'Cómo usarlo' : 'Cómo usarlo en la práctica';
      })(), stepsHtml)
      + section('Formas, conjugaciones y para qué', formsHtml)
      + section('Ejemplos en inglés (estudiá y adaptá — no copies ciego)', exHtml)
      + section('Evitá / no hagas esto', avoidHtml)
      + '</div>';
  }

  var GLOSS_ITEMS = [
    // ── Fase 1 Arquitectura (Training Book — inglés amplio) ──
    item("pronouns", "I / me / myself / my", "Yo", "Personal I · objeto me · reflexivo myself · posesivo my. Automatizá la tabla en menos de 1 segundo.", "I will call you today. Please stay with me while I finish this myself.", "She asked me to help her with her notes.", {"why":"Sin pronombres automáticos no hay velocidad al hablar.","examples":["Can you help me with my homework?","I made this cake myself.","They invited us to their house."]}),
    item("pronouns", "you / you / yourself / your", "Tú / usted", "Singular. En plural: yourselves.", "You should trust yourself more when you speak.", "Is this your book or mine?", {"why":"you / your / yourself.","examples":["Did you enjoy yourself at the party?","Please introduce yourself.","Is that your bag?"]}),
    item("pronouns", "he / him / himself / his", "Él", "Masculino singular.", "He taught himself to play the guitar.", "I gave him his ticket.", {"why":"he / him / his / himself.","examples":["He finished his essay himself.","Tell him the meeting is at five.","His idea was clear."]}),
    item("pronouns", "she / her / herself / her", "Ella", "Femenino singular. her = objeto y posesivo.", "She prepared herself before the interview.", "I called her about her trip.", {"why":"she / her / herself.","examples":["She wrote the letter herself.","Please give her these notes.","Her English improves every week."]}),
    item("pronouns", "it / it / itself / its", "Eso / esa", "Cosas, ideas, animales neutros. its sin apóstrofe.", "The city is famous for its parks.", "The machine turned itself off.", {"why":"it / its / itself.","examples":["I like this café — it is quiet.","The dog scratched itself.","The company changed its name."]}),
    item("pronouns", "we / us / ourselves / our", "Nosotros", "Primera persona plural.", "We organized the event ourselves.", "They thanked us for our help.", {"why":"we / us / our / ourselves.","examples":["We enjoyed ourselves at the festival.","Come with us.","Our plan is simple."]}),
    item("pronouns", "you / you / yourselves / your", "Ustedes", "Plural. yourselves en reflexivo.", "Please help yourselves to some fruit.", "Did you all bring your passports?", {"why":"Plural you / yourselves.","examples":["Enjoy yourselves.","Are these your seats?","You can decide for yourselves."]}),
    item("pronouns", "they / them / themselves / their", "Ellos / ellas", "Personas o grupos.", "They built the project themselves.", "I asked them about their plans.", {"why":"they / them / their / themselves.","examples":["They finished their homework early.","Listen to them carefully.","The students organized themselves into pairs."]}),
    item("verbs", "To come — come / came / come", "venir", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I came home after I had come my work.", "I will come early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I come · Past: I came · Participle: I have come.","I came the message and then I left.","Say the three forms out loud in under one second: come / came / come."]}),
    item("verbs", "To let — let / let / let", "dejar / permitir", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I let home after I had let my work.", "I will let early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I let · Past: I let · Participle: I have let.","I let the message and then I left.","Say the three forms out loud in under one second: let / let / let."]}),
    item("verbs", "To go — go / went / gone", "ir", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I went home after I had gone my work.", "I will go early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I go · Past: I went · Participle: I have gone.","I went the message and then I left.","Say the three forms out loud in under one second: go / went / gone."]}),
    item("verbs", "To put — put / put / put", "poner", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I put home after I had put my work.", "I will put early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I put · Past: I put · Participle: I have put.","I put the message and then I left.","Say the three forms out loud in under one second: put / put / put."]}),
    item("verbs", "To take — take / took / taken", "tomar / llevar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I took home after I had taken my work.", "I will take early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I take · Past: I took · Participle: I have taken.","I took the message and then I left.","Say the three forms out loud in under one second: take / took / taken."]}),
    item("verbs", "To give — give / gave / given", "dar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I gave home after I had given my work.", "I will give early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I give · Past: I gave · Participle: I have given.","I gave the message and then I left.","Say the three forms out loud in under one second: give / gave / given."]}),
    item("verbs", "To get — get / got / gotten", "obtener / llegar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I got home after I had gotten my work.", "I will get early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I get · Past: I got · Participle: I have gotten.","I got the message and then I left.","Say the three forms out loud in under one second: get / got / gotten."]}),
    item("verbs", "To keep — keep / kept / kept", "mantener / guardar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I kept home after I had kept my work.", "I will keep early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I keep · Past: I kept · Participle: I have kept.","I kept the message and then I left.","Say the three forms out loud in under one second: keep / kept / kept."]}),
    item("verbs", "To make — make / made / made", "hacer / crear", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I made home after I had made my work.", "I will make early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I make · Past: I made · Participle: I have made.","I made the message and then I left.","Say the three forms out loud in under one second: make / made / made."]}),
    item("verbs", "To do — do / did / done", "hacer (acción)", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I did home after I had done my work.", "I will do early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I do · Past: I did · Participle: I have done.","I did the message and then I left.","Say the three forms out loud in under one second: do / did / done."]}),
    item("verbs", "To say — say / said / said", "decir", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I said home after I had said my work.", "I will say early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I say · Past: I said · Participle: I have said.","I said the message and then I left.","Say the three forms out loud in under one second: say / said / said."]}),
    item("verbs", "To see — see / saw / seen", "ver", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I saw home after I had seen my work.", "I will see early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I see · Past: I saw · Participle: I have seen.","I saw the message and then I left.","Say the three forms out loud in under one second: see / saw / seen."]}),
    item("verbs", "To send — send / sent / sent", "enviar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I sent home after I had sent my work.", "I will send early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I send · Past: I sent · Participle: I have sent.","I sent the message and then I left.","Say the three forms out loud in under one second: send / sent / sent."]}),
    item("verbs", "To be — be / was-were / been", "ser / estar", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I was-were home after I had been my work.", "I will be early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I am/is/are · Past: I was-were · Participle: I have been.","I was-were the message and then I left.","Say the three forms out loud in under one second: be / was-were / been."]}),
    item("verbs", "To have — have / had / had", "tener / haber", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I had home after I had had my work.", "I will have early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I have · Past: I had · Participle: I have had.","I had the message and then I left.","Say the three forms out loud in under one second: have / had / had."]}),
    item("verbs", "To seem — seem / seemed / seemed", "parecer", "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I seemed home after I had seemed my work.", "I will seem early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I seem · Past: I seemed · Participle: I have seemed.","I seemed the message and then I left.","Say the three forms out loud in under one second: seem / seemed / seemed."]}),

    item("tenses", "will + verb", "Futuro real (-ré)", "Correré = I will run. Decisión o futuro real.", "I will call you tomorrow morning.", "I will finish this chapter tonight.", {"why":"Interruptor: -ré en español → will.","examples":["I will travel next year.","She will explain the rule again.","We will meet at the library."]}),
    item("tenses", "would + verb", "Futuro hipotético (-ría)", "Correría = I would run. Condición / cortesía.", "I would rather practice now than rush later.", "What would you like to improve first?", {"why":"Interruptor: -ría → would.","examples":["I would go if I had time.","Would you help me with this sentence?","He would feel better after a break."]}),
    item("tenses", "have + participle", "Presente perfecto", "He corrido = I have run. Pasado que afecta ahora.", "I have already finished the exercise.", "She has lived here for three years.", {"why":"have + participio.","examples":["I have seen that movie.","We have started a new habit.","Have you eaten yet?"]}),
    item("tenses", "had + participle", "Pasado perfecto", "Había corrido = I had run. Antes de otro pasado.", "When you called, I had already left.", "I had studied the list before the quiz.", {"why":"had + participio.","examples":["She had packed before the taxi arrived.","They had met once before.","I had never tried that food."]}),
    item("tenses", "have been + -ing", "Perfecto continuo", "He estado corriendo. Empezó antes y sigue.", "I have been practicing English every morning.", "We have been waiting for twenty minutes.", {"why":"have been + -ing.","examples":["She has been learning French this year.","It has been raining all day.","I have been reading a short novel."]}),
    item("tenses", "am/is/are + -ing", "Presente continuo", "Acción en proceso ahora.", "I am writing three connected sentences.", "They are preparing dinner.", {"why":"be + -ing.","examples":["She is studying in the kitchen.","We are listening carefully.","Are you coming with us?"]}),
    item("tenses", "simple past", "Pasado simple", "Hecho cerrado en el pasado.", "I visited my aunt yesterday.", "They watched a documentary last night.", {"why":"Pasado cerrado.","examples":["He cooked pasta on Sunday.","We traveled in July.","She called me twice."]}),
    item("tenses", "ING vs TO", "Intención TO · actividad ING", "want/need → TO. enjoy / after preposition → ING.", "I need to practice. I enjoy practicing with music.", "After finishing the draft, I want to rest.", {"why":"TO = dirección/intención · ING = actividad.","examples":["I want to improve.","I enjoy reading.","After studying, I went for a walk."]}),
    item("prep", "in", "en (ciudad / mes / year / inside)", "I live in San José. We met in March. The keys are in the bag.", "She studied in Scotland for a year.", {"why":"in = dentro / periodos largos.","examples":["I work in an office.","He was born in 1998.","The milk is in the fridge."]}),
    item("prep", "on", "en (día / superficie)", "We meet on Monday. The book is on the table.", "I put a note on the door.", {"why":"on = días y superficies.","examples":["See you on Friday.","The picture is on the wall.","She left her phone on the couch."]}),
    item("prep", "at", "en (hora / lugar puntual)", "We meet at 5 p.m. She is at the station.", "I will call you at noon.", {"why":"at = hora y punto.","examples":["I am at home.","The class starts at nine.","Meet me at the entrance."]}),
    item("prep", "for", "para / por (destinatario / duración)", "This gift is for you. I waited for two hours.", "She studied for the exam all week.", {"why":"for = destinatario o duración.","examples":["I bought tickets for my parents.","He lived there for six months.","Thanks for your help."]}),
    item("prep", "to", "a / hacia", "I go to school by bus. Send the file to me.", "She moved to another city.", {"why":"to = dirección.","examples":["Walk to the corner.","Talk to your partner.","I need to go to the store."]}),
    item("prep", "from", "de / desde", "I am from Costa Rica. Count from one to ten.", "A call from Lisbon woke me up.", {"why":"from = origen.","examples":["This letter is from my sister.","We traveled from north to south.","Take the book from the shelf."]}),
    item("prep", "with", "con", "I will go with you. Coffee with milk, please.", "She works with a small team.", {"why":"with = compañía / instrumento.","examples":["Stay with me.","Cut it with a knife.","I agree with that idea."]}),
    item("prep", "about", "sobre / acerca de", "We talked about the movie. Tell me about your day.", "I am calling about the schedule.", {"why":"about = tema.","examples":["A book about travel.","Do not worry about small mistakes.","What is this song about?"]}),
    item("prep", "by", "para (deadline) / por (medio)", "I will finish by Friday. We went by train.", "Send it by email.", {"why":"by = plazo o medio.","examples":["Be here by noon.","She learned by listening.","The letter arrived by courier."]}),
    item("prep", "without", "sin", "I cannot decide without more information.", "He left without saying goodbye.", {"why":"without = sin.","examples":["Do not leave without your keys.","Coffee without sugar.","She spoke without fear."]}),
    item("prep", "after", "después de", "After reviewing the notes, I slept well.", "After dinner we walked.", {"why":"after + noun / -ing.","examples":["After class, call me.","After reading, write three sentences.","We met after the concert."]}),
    item("prep", "before", "antes de", "I will call you before noon.", "Before you send it, check spelling.", {"why":"before + noun / clause.","examples":["Wash your hands before eating.","Think before you answer.","Arrive before eight."]}),
    item("articles", "a", "un/una (consonante)", "a book, a useful tip, a university (sonido /ju/). a/an = no específico aún.", "I need a pen and a notebook.", "She found a quiet café near the park.", {"why":"a = sonido consonante.","examples":["a day, a week, a friend","I saw a bird on the roof.","He shared a clear example."]}),
    item("articles", "an", "un/una (vocal sound)", "an apple, an hour (/aʊ/), an email. Depende del SONIDO, no solo de la letra.", "I ate an apple. She waited an hour.", "That was an honest answer.", {"why":"an = sonido vocal.","examples":["an idea, an open window","an easy exercise","an unexpected result."]}),
    item("articles", "the", "el/la (específico)", "the sun, the book on the table (ya identificado).", "Please close the door. The idea we discussed is good.", "I returned the book to the library.", {"why":"the = específico / único / ya mencionado.","examples":["the Internet, the moon","Pass me the salt.","The students in this room are ready."]}),

    item('base', 'Acknowledge Mirror Respond', 'Reconocer → Espejo → Responder',
      'AMR es la estructura obligatoria de la LLAMADA y de la NOTA INTERNA (Previous contacts). No es el correo al cliente. Primero reconocés el impacto (Acknowledge), después repetís el hecho clave para confirmar (Mirror), y al final prometés una acción con dueño y hora (Respond: I will + today / 4:30 p.m.). Si falta una de las tres piezas, la nota no pasa el grader del desk.',
      'I understand payroll is frozen. You mentioned two supplier ACH declined. I will review Statements and call you today before 4:30 p.m.',
      'Thank you for waiting. I hear this is the third call. Just to make sure, the decline was at the Lisbon hotel. I will check travel notice and MCC now.',
      {
        why: 'AMR protege al cliente (se siente escuchado) y al bank (queda audit trail claro). Es el estándar de phone + note en Infinity Holdings.',
        steps: [
          'Acknowledge: I understand / I hear / thank you for waiting + el impacto concreto del case.',
          'Mirror: you said / you mentioned / so you / just to make sure / what happened was + UN hecho (monto, merchant, cuenta).',
          'Respond: I will + qué vas a hacer vos + marca de tiempo.',
          'Guardá la nota en Previous contacts con el mismo AMR.'
        ],
        avoid: [
          'Empezar con política o “según el sistema…” sin reconocer el impacto.',
          'Mirror vacío (“entiendo”) sin repetir el hecho.',
          'Respond sin hora (“I will call you soon”).'
        ],
        c: 'I understand the urgency. You mentioned the $18,400 ACH. I will escalate to Operations and follow up within two business days.'
      }),
    item('base', 'Evidencia', 'Prueba en el CRM antes de hablar',
      'Evidencia = lo que VOS miraste o documentaste en el CRM antes de explicar o cerrar. No es “lo que el cliente dijo de memoria”. Ejemplos: Statements, Card transactions, Previous contacts, travel notice, MCC block, identity data points, case brief. Sin evidencia, tu Explicación (E3) y tu Ejecución (E4) suenan a plantilla. En práctica guiada, los tabs rojos te dicen DÓNDE ir a buscarla.',
      'I reviewed Statements and Previous contacts before I wrote the note.',
      'I verified identity on the recorded line and I checked Card transactions for the Miami decline.',
      {
        why: 'El Training Book mide lo que hacés con el inglés en el desk real: evidencia + estructura. Alice QA y el Resolve miran si hay prueba.',
        steps: [
          'Leé el case brief / quote.',
          'Abrí los tabs del Desk playbook (Overview, Statements, Cards & PIN, etc.).',
          'Anotá 1–3 hechos concretos (montos, flags, dates).',
          'Usá esos hechos en AMR (nota) y en Formato E (correo).'
        ],
        avoid: [
          'Escribir el correo sin abrir Statements.',
          'Inventar un “I reviewed…” que no hiciste.',
          'Pedir PIN o PAN completo “para investigar”.'
        ],
        c: 'Evidence on file: Operating Account Restricted; two ACH declines; Obsidian card still Active.'
      }),
    item('base', 'Nesting', 'Inglés anidado de escritorio',
      'Nesting es el método de inglés del Training Book: no frases sueltas. Anidás ideas con conectores (because, however, therefore…) + método linkers (in other words, even though, as well as, which means…) + phrasals + prefijos/sufijos cuando ayudan. También es la etapa “Nesting” del portal: 10 casos escritos + práctica en el desk. En el correo, el nesting vive sobre todo en E3 Explicación.',
      'I reviewed the restriction because two ACH payments declined. However I will not lift every control. In other words, Operations owns the restore.',
      'Even though the card is Active, the Operating Account is Restricted, which means payroll is still blocked.',
      {
        why: 'Nesting demuestra que podés explicar política con claridad profesional — no IELTS dump ni español traducido palabra por palabra.',
        steps: [
          'Elegí 2 conectores de escritorio (because / however / therefore…).',
          'Sumá 1 método linker (in other words / even though / which means…).',
          'Pegá un hecho de evidencia del CRM en la misma explicación.',
          'Practicá más chips en Método, Conectores y Phrasals.'
        ],
        avoid: [
          'Tirar cinco conectores seguidos sin evidencia.',
          'Explicar en español en el desk EN.',
          'Copiar el gold sample sin adaptar el case.'
        ],
        c: 'The refund posted; therefore I will withdraw the dispute. On the other hand, we can reopen within 10 days if it reverses.'
      }),
    item('base', 'Estructura del correo al cliente', 'Encabezado Empatía Explicación Ejecución Encierro',
      'Formato E (también dicho EC = Estructura del Correo) es el estándar del EMAIL al cliente. El botón Send lo gradea. Son 5 bloques: E1 Encabezado (Hello/Dear + nombre), E2 Empatía (impacto), E3 Explicación (2 conectores + 1 método), E4 Ejecución (qué YA hiciste en el CRM), E5 Encierro (I will + hora + Kind/Best regards). Mínimo 55 palabras. No es la nota interna (eso es AMR).',
      'Hello Marta, thank you for writing. I understand the payroll freeze is blocking supplier ACH. I reviewed the Operating Account because two payments declined. However I will not lift every control. In other words, Operations owns the restore. I escalated to Operations. I will call you today before 4:30 p.m. Kind regards',
      'Hello Daniel, I hear the Miami hotel declined your card. I verified identity because we were on a recorded line. However there was no travel notice. In other words, the decline was a control. I set a travel notice. I will confirm by call today before 5:00 p.m. Kind regards',
      {
        why: 'El cliente ve el correo; el bank audita Formato E. Soft Skills dan tono; Formato E da la estructura que el desk exige.',
        steps: [
          'Abrí Emails → Compose.',
          'Escribí E1→E5 en inglés (sin pegar).',
          'Revisá: nombre, empatía con impacto, 2 conectores + 1 método, acciones YA hechas, I will + hora, regards, 55+ palabras.',
          'Send solo cuando el coach esté en verde.'
        ],
        avoid: [
          'Dear Client / sin nombre.',
          'Correo corto sin E3/E4.',
          'Copiar el modelo rojo del desk word-for-word en otro case.'
        ],
        gloss: 'EC = Formato E',
        c: 'Tocá Email en este glosario para ver E1–E6 con explicación completa y ejemplos.'
      }),
    item('base', 'Anti-Money Laundering', 'Prevención de lavado de dinero',
      'AML = Anti-Money Laundering (prevención de lavado de dinero). En el desk es un tipo de case / alerta de compliance. Si ves AML Alert o un wire/payroll en hold de compliance: NO tip-off (nunca digas “we are investigating you for money laundering”), NO limpies el flag vos, SÍ documentá evidencia y escalá a Compliance / el dueño del proceso con next step timed. Los fondos pueden seguir intactos aunque estén en hold.',
      'I understand the payroll wire is on a compliance hold and the funds are still intact. I reviewed Statements and I routed the case to Compliance. I will call you tomorrow before noon with the outcome.',
      'According to policy this stays with Compliance. I will not clear the flag myself. I documented Previous contacts and I set AA until Compliance replies.',
      {
        why: 'AML protege al cliente y al bank. Un tip-off o un “clear” improvisado es fail grave de compliance.',
        steps: [
          'Reconocé el impacto sin tip-off.',
          'Revisá Statements / brief (evidencia).',
          'Documentá nota AMR + disposition correcta (suele ser AA / pending Compliance).',
          'Encierro con hora: quién llama y cuándo.'
        ],
        avoid: [
          'Tip-off: “we suspect money laundering”.',
          'Prometer que vos liberás el wire hoy.',
          'Pedir al cliente que “explique el origen de fondos” de forma acusatoria en chat abierto.'
        ],
        gloss: 'Si leés ANL en apuntes, casi siempre es AML',
        c: 'I cannot release the hold from this desk. Compliance owns the review; I own the callback tomorrow before noon.'
      }),
    item('base', 'Cómo se usan juntos', 'Orden del caso en el desk',
      'Orden de estudiante (acordate de esto en cada PRACTICE): 1) Buscá EVIDENCIA en los tabs del CRM. 2) Si es llamada/nota → AMR. 3) Si es correo al cliente → Formato E (EC) con NESTING en la Explicación. 4) Si el case es AML → misma estructura, sin tip-off. 5) Resolve / Submit solo cuando email + note + disposition cierran el caso.',
      'Evidence → AMR note → Formato E email → Resolve with AA/PSA/Resolved.',
      'Queue → Accept → Statements (evidencia) → Emails Compose (Formato E) → Previous contacts (AMR) → Resolve → Submit.',
      {
        why: 'No son cinco temas sueltos: son una sola rutina de escritorio. El Training Book y el desk rojo te guían en ese orden.',
        steps: [
          'Accept el caso PRACTICE.',
          'Leé evidencia (tabs).',
          'Compose Formato E.',
          'Add note AMR.',
          'Resolve + Submit.'
        ],
        avoid: [
          'Mandar correo sin evidencia.',
          'Nota sin AMR.',
          'Resolve sin email ni note.'
        ],
        c: 'Práctica 1/10: el recuadro amarillo te dice el paso; los rojos te dicen dónde click.'
      }),
    item('email', 'E1 Encabezado', 'Hello / Dear + nombre',
      'El encabezado es la primera línea del correo al cliente. Abrí Emails → Compose. Escribí Dear / Hello / Hi + el first name del case (Marta, Daniel). Nunca “Dear Client” ni “Dear Sir/Madam”. Sin E1, Send no pasa el grader de Formato E.',
      'Hello Marta,',
      'Hi Daniel,',
      {
        why: 'Identifica a la persona. El desk de Infinity Holdings exige nombre real del case brief — no plantillas genéricas.',
        steps: [
          'Abrí el case y leé el first name del cliente.',
          'Emails → Compose.',
          'Primera línea: Hello / Hi / Dear + nombre + coma (Hello Marta,).',
          'Seguí con E2 Empatía en la siguiente frase.'
        ],
        avoid: [
          'Dear Client / Dear Customer / To whom it may concern.',
          'Solo el nombre sin saludo (“Marta,”).',
          'Usar un apellido o un ticket number como saludo.'
        ],
        c: 'Dear Sofia,',
        d: 'Hello Carlos,'
      }),
    item('email', 'E2 Empatía', 'Acknowledge impact',
      'Después del encabezado, nombrá el impacto que ves en el case brief o en la quote del cliente. No digas solo “I understand your concern”: nombrá payroll freeze, third call, hotel decline, etc. Verbos seguros: understand, hear, sorry, apologize, thank you for writing / calling / waiting.',
      'Thank you for writing. I understand the payroll freeze is blocking supplier ACH.',
      'I hear this is the third call. I will review Previous contacts first.',
      {
        why: 'La empatía profesional baja la temperatura y prueba que leíste el caso antes de explicar política.',
        steps: [
          'Leé el impacto en el brief (payroll, decline, dispute, hold).',
          'Abrí con thank you for writing/calling O I understand / I hear + el impacto concreto.',
          'No prometás aún el resultado: eso va en E4/E5.'
        ],
        avoid: [
          '“I understand your concern” sin decir cuál es el impacto.',
          'Empatía falsa + “but” agresivo en la misma frase.',
          'Pedir PIN o datos sensibles en la empatía.'
        ],
        c: 'I am sorry the hotel declined your Obsidian card in Miami — I hear how urgent check-in is.',
        d: 'Thank you for waiting. I understand the $180,000 payroll wire is on a compliance hold and the funds are still intact.'
      }),
    item('email', 'E3 Explicación + linkers', '2 conectores + 1 método',
      'En la Explicación necesitás evidencia + nesting: mínimo 2 conectores de escritorio (because, however, therefore, although, in addition, as a result…) y 1 método linker (in other words, even though, even when, as well as, which means, on the other hand, the thing is that). Explicá el mecanismo sin culpar al cliente.',
      'I reviewed the Operating Account restriction because two supplier ACH payments declined. However I will not lift every control. In other words, Operations owns the restore.',
      'Even though the Obsidian card is Active, the Operating Account is Restricted; therefore payroll is still blocked.',
      {
        why: 'E3 es donde se ve el nesting del Training Book: no es un dump de conectores IELTS; es lógica de desk.',
        steps: [
          'Nombrá el hecho del CRM (restriction, decline, refund posted…).',
          'Conector 1: because / as a result / therefore…',
          'Conector 2: however / although / on the other hand…',
          'Método linker: in other words / even though / which means…',
          'Tocá Método y Conectores en este glosario para más chips con ejemplos completos.'
        ],
        avoid: [
          'Tirar 5 conectores seguidos sin evidencia.',
          'Culpar al cliente (“you failed to…”).',
          'Explicar AML tip-off o revelar controles internos sensibles.'
        ],
        c: 'I verified identity because date of birth must match on a recorded line. However I cannot send a PIN. In other words, last 6 only after full verification.',
        d: 'The refund posted; therefore I will withdraw the open dispute. On the other hand, we can reopen within 10 days if the refund reverses.'
      }),
    item('email', 'E4 Ejecución', 'Qué YA hiciste en el CRM',
      'Ejecución = acciones ya hechas en el desk, en pasado / presente perfecto: I reviewed, I verified, I escalated, I blocked, I set, I opened, I documented, I activated. No es una promesa (“I will look into it” eso es E5). El cliente y el auditor deben ver ownership real.',
      'I reviewed Statements, I verified the freeze flag, and I escalated to Operations.',
      'I have documented Previous contacts and I set AA until Operations restores the account.',
      {
        why: 'Sin E4 el correo suena a plantilla. Con E4 demostrás que trabajaste el CRM antes de cerrar.',
        steps: [
          'Antes de Compose: hacé la acción en el CRM (Statements, note, escalate, travel notice…).',
          'En el correo: listá 1–3 acciones con I reviewed / I verified / I escalated…',
          'Si todavía no hiciste nada, volvé al CRM primero — no inventes E4.'
        ],
        avoid: [
          'Mezclar E4 con “I will” (eso es Encierro).',
          'Decir “I fixed it” sin evidencia en el CRM.',
          'Copiar la gold sample sin acciones reales de ESTE case.'
        ],
        c: 'I verified identity on the recorded line, I checked Card transactions, and I set a travel notice for Miami.',
        d: 'I reviewed Card transactions, I opened the dispute, and I blocked the card for reissue.'
      }),
    item('email', 'E5 Encierro', 'I will + hora + regards',
      'Cierre con dueño + reloj: I will + today / before 4:30 p.m. / within two business days / tomorrow before noon. Después: Kind regards o Best regards. El correo completo debe tener mínimo 55 palabras (E1–E5 juntos).',
      'I will call you today before 4:30 p.m. with the Operations outcome. Kind regards',
      'I will follow up within two business days. Best regards',
      {
        why: 'El cliente necesita un next step con hora. “I will call you soon” no pasa el grader.',
        steps: [
          'Escribí I will + acción concreta (call / email / follow up).',
          'Agregá marca de tiempo: today before 4:30 p.m. / within two business days…',
          'Cerrá con Kind regards o Best regards.',
          'Contá palabras: si van menos de 55, expandí E2/E3/E4 con un hecho más del CRM.'
        ],
        avoid: [
          '“I will call you soon / later / ASAP” sin hora.',
          'Cerrar sin regards.',
          'Prometer un resultado que no controlás (network win, same-day goodwill).'
        ],
        c: 'I will email the case number today before 4:45 p.m. Kind regards',
        d: 'I will call you tomorrow before noon with the Compliance outcome. Best regards'
      }),
    item('email', 'E6 Email completo', 'Formato E en un solo pase',
      'Un correo de escritorio completo une E1–E5 en un solo pase: saludo con nombre, empatía con impacto, explicación con 2 conectores + 1 método, ejecución de lo YA hecho en el CRM, y encierro con I will + hora + regards. Mínimo 55 palabras. Estudiá la estructura; no copies ciego en drills ni en el desk.',
      'Hello Marta, thank you for writing. I understand the payroll freeze is blocking supplier ACH. I reviewed the Operating Account restriction because two supplier ACH payments declined. However I will not lift every control. In other words, Operations owns the restore. I reviewed Statements, I verified the freeze flag, and I escalated to Operations. I will call you today before 4:30 p.m. with the Operations outcome. Kind regards',
      'Hello Daniel, thank you for calling. I hear the Miami hotel declined your Obsidian card at check-in. I verified identity because we were on a recorded line. However there was no travel notice on file. In other words, the decline was a control, not a lost card. I checked Card transactions and I set a travel notice for Miami. I will confirm by call today before 5:00 p.m. Kind regards',
      {
        why: 'E6 es el modelo mental del Send button: el grader mira las cinco piezas juntas, no cinco oraciones sueltas.',
        steps: [
          'Armá el outline E1→E5 antes de escribir.',
          'Pegá hechos del case brief (nombres, montos, disposition).',
          'Revisá: 2 conectores + 1 método + I will con hora + 55+ palabras.',
          'Send solo cuando el grader del desk esté en verde.'
        ],
        avoid: [
          'Copiar este gold sample en un drill o en un case distinto.',
          'Saltar E4 (acciones) o E3 (linkers).',
          'Meter un PIN o un PAN completo en el correo.'
        ],
        c: 'Hello Sofia, thank you for writing. I understand the $180,000 payroll wire is on a compliance hold and the funds are still intact. I reviewed Statements because the batch did not post. However this is a standard review, not a loss. In other words, Compliance owns the release timing. I documented Previous contacts and I routed the case to Compliance. I will call you tomorrow before noon with the outcome. Kind regards'
      }),
    item('email', 'Technicismos in the email', 'AA, PSA, PIN, MCC, last 6',
      'En el correo usá el vocabulario del desk cuando aporta claridad: AA (awaiting action), PSA (pending system), MCC block, travel notice, last 6. Nunca envíes, leas ni escribas un PIN. Last 6 solo después de identity en línea grabada. AA/PSA son dispositions, no relleno decorativo.',
      'I set AA and I will call you today before 4:30 p.m. I cannot send a PIN; last 6 only after identity on a recorded line.',
      'PSA: the restore is with Operations. I reviewed the hotel MCC block and the travel notice in Cards.',
      {
        why: 'Los technicismos alinean al cliente con el status real del case y dejan audit trail claro.',
        steps: [
          'Elegí el disposition correcto (AA vs PSA) según quién tiene la próxima acción.',
          'Si hablás de last 6, dejá claro: after identity / never the PIN.',
          'MCC / travel notice: nombrá cuál regla disparó el decline.'
        ],
        avoid: [
          'Poner un PIN en el email o en chat.',
          'Prometer “I will text the PIN”.',
          'Usar AA/PSA sin explicar el next step.'
        ],
        c: 'Disposition AA: waiting on the booking confirmation. I will follow up today before 4:30 p.m.',
        d: 'I will not confirm last 6 until identity is complete on the recorded line.'
      }),
    item('phone', 'Acknowledge (reconocer impacto)', 'Acknowledge',
      'En llamada o nota, AMR empieza con Acknowledge: primera frase = el impacto. Estás en línea grabada. Entendé antes de investigar. Usá I understand / I hear / thank you for waiting + el hecho concreto del case.',
      'I understand payroll is frozen and two supplier payments declined.',
      'Thank you for waiting. I hear this is the third call.',
      {
        why: 'Acknowledge baja la emoción y prueba que escuchaste antes del Mirror y del Respond.',
        steps: [
          'Dejá que el cliente termine el turn.',
          'Nombrá el impacto en una frase (payroll, decline, third call…).',
          'No abras el CRM en silencio sin decir qué estás haciendo.'
        ],
        avoid: [
          'Interrumpir para pedir PIN de entrada.',
          '“I understand” vacío.',
          'Empezar con política antes de reconocer el impacto.'
        ],
        c: 'I understand the Lisbon hotel declined the card and you are at the desk now.',
        d: 'I hear the urgency around the payroll wire — thank you for staying on the line.'
      }),
    item('phone', 'Mirror (espejo del hecho)', 'Mirror',
      'Mirror = repetí el hecho clave para confirmar: you said / you mentioned / so you / just to make sure / what happened was. Cerrá con una confirmación corta. Esto gana 3 segundos y evita arreglar el problema equivocado.',
      'You mentioned the supplier ACH of $18,400 declined. Just to make sure, that is on the Operating Account.',
      'So you need the card to work at the Lisbon hotel desk — what happened was a decline, not a lost card.',
      {
        why: 'Mirror alinea el caso: monto, cuenta, merchant, ciudad. Sin Mirror, Respond suele ir al control equivocado.',
        steps: [
          'Elegí UN hecho clave (monto, merchant, account).',
          'Repetilo con you mentioned / so you / just to make sure…',
          'Esperá el “yes” del cliente antes de Respond.'
        ],
        avoid: [
          'Espejo de la emoción sola (“you are angry”) sin el hecho.',
          'Repetir todo el relato de 2 minutos.',
          'Mirror en español en el desk EN.'
        ],
        c: 'Just to make sure I understood: you want last 6, not the PIN.',
        d: 'You said the notice on file is Paris, but the decline was in Lisbon — correct?'
      }),
    item('phone', 'Respond (responder con hora)', 'Respond',
      'Respond = I will + dueño + hora. Después documentá la nota interna con el mismo AMR. En phone: decí la acción y el reloj en voz alta. En note: escribí Acknowledge → Mirror → Respond con tiempo.',
      'I will review Statements now and I will call you today before 4:30 p.m.',
      'I will escalate to Operations and I will follow up within two business days.',
      {
        why: 'Sin Respond con reloj, la llamada queda abierta y el KPI de ownership se cae.',
        steps: [
          'Nombrá la acción que vos hacés ahora o hoy.',
          'Pegá una marca de tiempo audible.',
          'Escribí la nota AMR en Previous contacts / Internal note.'
        ],
        avoid: [
          '“Someone will call you” sin dueño.',
          'Respond sin hora.',
          'Prometer un win de network o goodwill que no autorizás.'
        ],
        c: 'I will activate the virtual card now and I will stay on the line while it provisions.',
        d: 'I will set AA and I will call you today before 4:30 p.m. with the Operations outcome.'
      }),
    item('phone', 'Recorded line + hold', 'Línea grabada / hold',
      'Identidad y last 6 viven en recorded line. Si ponés hold: decí por qué y cuánto aproximadamente, y volvé. No dejes al cliente colgado sin contexto.',
      'We are on a recorded line. Please stay with me while I look into Statements.',
      'I am placing you on a brief hold to review Previous contacts. I will be right back.',
      {
        why: 'Hold profesional protege compliance y la experiencia del cliente.',
        steps: [
          'Confirmá recorded line cuando vayas a identity / last 6.',
          'Antes del hold: “I am placing you on a brief hold to…”',
          'Al volver: thank you for waiting + Mirror corto.'
        ],
        avoid: [
          'Hold mudo de varios minutos.',
          'Pedir PIN fuera de recorded line.',
          'Colgar “por accidente” sin callback timed.'
        ],
        c: 'Please stay with me on the recorded line while I complete identity.',
        d: 'Thank you for holding. I reviewed Previous contacts and I am ready with the next step.'
      }),
    item('phone', 'Identity before disclosure', 'Identidad primero',
      'Verify identity en Cards & PIN antes de last 6. Nunca PAN completo. Nunca PIN. Si date of birth u otro data point no matchea, no confirmés last 6.',
      'Once identity is complete on the recorded line, I can confirm last 6 — never the PIN.',
      'Date of birth does not match. I will not confirm last 6 until verification is complete.',
      {
        why: 'Disclosure sin identity es un fail de compliance. El Training Book y el desk lo tratan como hard stop.',
        steps: [
          'Recorded line on.',
          'Corrés los data points del perfil.',
          'Solo entonces last 6 — nunca PIN / nunca PAN completo.'
        ],
        avoid: [
          'Confirmar last 6 “porque el cliente tiene prisa”.',
          'Leer el PIN “para ayudar”.',
          'Identity por SMS o WhatsApp no verificado.'
        ],
        c: 'Mother’s maiden name matched; date of birth did not — I stay on the recorded line and I will not confirm last 6 yet.',
        d: 'I will complete identity verification before I confirm last 6.'
      }),
    item('phone', 'Ownership, no PIN', 'Dueño + política PIN',
      'Nombrá qué vas a hacer vos. Policy: never send, read or email a PIN. SMS no es canal para PIN. Ofrecé el path seguro: identity + last 6, virtual card, travel notice, escalate con hora.',
      'I own the callback today before 4:30 p.m. I cannot text the PIN.',
      'I will not email the PIN. I will complete identity and confirm last 6 only.',
      {
        why: 'Ownership + PIN policy es la línea que protege al cliente y al desk.',
        steps: [
          'Decí “I own…” + next step timed.',
          'Si piden PIN: policy clara + alternativa segura.',
          'Documentá en la nota: no PIN / last 6 after identity.'
        ],
        avoid: [
          '“Maybe my supervisor can text the PIN”.',
          'Pasar el caso sin dueño ni hora.',
          'Discutir la policy en tono pelea.'
        ],
        c: 'I cannot send a PIN by SMS. I will activate the virtual card instead so you can pay today.',
        d: 'I own this next step: identity now, then last 6 only — never the full number.'
      }),
        item('metodo', 'Even when / even though', 'Aun cuando', 'Use even though to keep the policy after naming a fact that does not change the decision.', 'Even though the flight is tonight, I cannot send a PIN.', 'Even when the merchant refunded, I will confirm before I close the claim.'),
    item('metodo', 'Once', 'Una vez que', 'Use once for a condition that unlocks the next safe action.', 'Once identity is complete on the recorded line, I can confirm last 6.', 'Once the travel notice is on file, I will re-try the authorization.'),
    item('metodo', 'however', 'Sin embargo', 'Use however to contrast the client request with policy without sounding rude.', 'I hear the urgency; however, I cannot wire to an unverified WhatsApp agency.', 'The refund posted; however, I must withdraw the open dispute to avoid a double credit.'),
    item('metodo', 'What happens is that…', 'Lo que pasa es que', 'Use this to explain the mechanism, not to blame the client.', 'What happens is that a deposit plus a balance is not a duplicate charge.', 'What happens is that PIN-present ATM needs investigation, not an instant refund.'),
    item('metodo', 'When was that?', '¿Cuándo fue qué?', 'A closed time question to pin the event before you act.', 'When was that decline at the hotel desk?', 'When was that second posting on the statement?'),
    item('metodo', 'when thinking', 'Cuando se piensa', 'Use when thinking to show you are working the logic, then land on a decision.', 'When thinking about both credits, I will not keep the dispute and the refund open.', 'When thinking about the window, the network dispute is ineligible.'),
    item('metodo', 'in which / on which', 'En la que', 'Nesting: attach the clause to the account, card or date.', 'This is the card on which the Lisbon hotel declined.', 'This is the statement in which the reporting window starts.'),
    item('metodo', 'which is used for', 'La cual se usa', 'Define a product or control by its purpose.', 'The Operating Account is used for payroll and supplier payments.', 'A travel notice is used for expected spend outside the usual country.'),
    item('metodo', 'despite that', 'Pero a pesar de eso', 'Concede the emotion, then hold the safe action.', 'I understand the queue at check-in; despite that, I will not lift every block blindly.', 'The previous note says ID OK; despite that, date of birth does not match.'),
    item('metodo', 'in other words', 'En otras palabras', 'Restate policy in plain desk English.', 'In other words, I can confirm last 6 after full identity — never the PIN.', 'In other words, I cannot guarantee a network win.'),
    item('metodo', 'which means', 'Lo que / lo cual significa', 'Name the consequence of the evidence.', 'The descriptors say DEPOSIT then BALANCE, which means this is not a duplicate.', 'Chip-and-PIN was used, which means this is not automatic unauthorized fraud.'),
    item('metodo', 'not only that… but also', 'No solo eso, sino que también', 'Stack two facts without dumping IELTS connectors.', 'Not only is there no Lisbon travel notice, but also a hotel MCC block remains.', 'Not only did the refund post, but also an open dispute is still live.'),
    item('metodo', 'as well as', 'Así como', 'Add a second professional action.', 'I will set the travel notice as well as activate the virtual card.', 'I will document the screenshot as well as the merchant contact date.'),
    item('metodo', 'The thing is that', 'El asunto es que', 'Focus the client on the one constraint that matters.', 'The thing is that I cannot send a PIN by SMS.', 'The thing is that the 60-day window is counted from the statement date.'),
    item('metodo', 'You know what I mean', 'Usted sabe a qué me refiero', 'Use sparingly to check shared understanding, then confirm in clear English.', 'I will call you today before 4:30 p.m. — you know what I mean, a timed next step.', 'Last 6 only after identity — you know what I mean, never the full number.'),
    item('metodo', 'it is said that', 'Se dice que', 'Distance yourself from an unofficial claim (sales, chat, another agent).', 'It is said that VIP gets same-day goodwill; I still need supervisor authority.', 'It is said that “we always win”; I cannot promise the network outcome.'),
    item('metodo', 'It should be done', 'Debería ser hecho', 'State the required process, not a vague hope.', 'Identity verification should be done on the recorded line.', 'The dispute should be withdrawn because the merchant refund already posted.'),
    item('metodo', 'somehow', 'De alguna forma', 'Avoid promising a magic fix. Prefer a named action.', 'I will not “somehow” refund outside policy; I will open the billing inquiry.', 'We will find a safe path: virtual card, not a wire to WhatsApp.'),
    item('metodo', 'I realized', 'Me di cuenta', 'Use after you reviewed CRM evidence.', 'I realized the two postings are deposit and balance, not a duplicate.', 'I realized the travel notice was filed for Paris, not Lisbon.'),
    item('metodo', 'find a way / figure out', 'Encontrar la manera', 'Safe problem-solving: a policy-legal path, not a shortcut.', 'I will figure out which control fired before I lift anything.', 'I will find a way to keep you spending: virtual card plus travel notice.'),
    item('metodo', 'In the', 'En la (dentro)', 'Nesting brick: in the + noun. Desk: in the CRM / in the statement.', 'The mismatch is in the date of birth on file.', 'I see the duplicate flags in the statement, but the descriptors differ.'),
    item('metodo', 'in / on / a / an', 'En una', 'Choose in/on/a/an by the noun: on the card, in an email, a case number.', 'I will put a travel notice on the card for Lisbon.', 'I opened a billing inquiry in the CRM.'),
    item('metodo', 'by the / for the / to the', 'Por la', 'by the policy; for the client; to the merchant / supervisor.', 'By the policy I may confirm last 6 after identity.', 'I will escalate to the supervisor for goodwill.'),
    item('metodo', 'without the / it / her', 'Sin la', 'without the PIN / without evidence / without lifting every block.', 'I will not send the PIN without full identity on a recorded line.', 'I cannot file the chargeback without the booking confirmation.'),
    item('metodo', 'by now', 'Por ahora', 'A deadline already passed or expected to have happened.', 'By now you should have a case number and the two-business-day path.', 'The statement date has passed; by now the reporting window is closed.'),
    item('metodo', 'for the moment / so far', 'Por el momento', 'Temporary status while investigation runs.', 'For the moment the funds are under investigation.', 'So far I have blocked the card and ordered a replacement.'),
    item('metodo', 'instead of', 'En vez de', 'Offer the safe alternative you own.', 'I will activate the virtual card instead of wiring to WhatsApp.', 'I will open an internal report instead of an ineligible chargeback.'),
    item('metodo', 'about to', 'A punto de', 'Imminent action — useful for next steps.', 'I am about to document the identity mismatch on the recorded line.', 'The flight is about to leave; I will activate the virtual card now.'),
    item('metodo', 'around', 'Alrededor de', 'Approximate time or amount. Then confirm in CRM.', 'The posting is around $1,200 — I will confirm the exact amount on the statement.', 'The callback will be around 4:30 p.m. Costa Rica time.'),
    item('metodo', 'near, close to', 'Cerca de', 'Proximity in time or risk — then be specific.', 'We are close to the 60-day window; I will check the statement date.', 'The hotel is near check-in; I will confirm which rule fired.'),
    item('metodo', 'far from', 'Lejos de', 'Correct a wrong conclusion professionally.', 'This is far from an automatic refund: PIN was present.', 'We are far from closing both credits; I will withdraw the dispute.'),
    item('metodo', 'unless', 'A menos que', 'Condition that would change the path.', 'I cannot file the network dispute unless we are inside the reporting window.', 'I will not lift the MCC block unless we confirm it is the rule that fired.'),
    item('metodo', 'rather… than', 'Preferir que', 'Choose the professional option.', 'I would rather verify identity than send a PIN by SMS.', 'I would rather activate the virtual card than wire to an unverified party.'),
    item('metodo', 'on the other hand', 'Por el otro lado', 'Second side of the case. Official English: on the other hand (not “in the other hand”).', 'The client wants both credits; on the other hand, that creates a double credit.', 'Sales promised a win; on the other hand, policy forbids guaranteeing the network.'),
    item('metodo', 'according to', 'De acuerdo con', 'Cite policy, CRM or the statement — not memory.', 'According to policy, last 6 only after identity on a recorded line.', 'According to the statement date, the reporting window has closed.'),
    item('metodo', 'combine pronouns and tenses', 'No / sí / podría / debería ser', 'Nesting drill: rotate I/you/we + can/could/should + the verb.', 'I should document this. You could confirm last 6. We cannot send the PIN.', 'She cannot approve goodwill. I will escalate. You should keep the card blocked.'),
    item('metodo', 'such as', 'Tal como', 'Give a concrete example, then act.', 'I need evidence such as the booking confirmation.', 'Safe actions such as block, replace and investigate — not an instant refund.'),
    // ── Conectores (Training Book LINKERS — lista completa) ──

    // ── Conectores (inglés amplio — Training Book Fase 2) ──
    item('extra', "and", "y", "Une dos ideas del mismo nivel. No lo uses más de dos veces seguidas: varía con also / in addition.", "I finished the report and I sent it to my manager.", "She likes coffee and she prefers tea in the afternoon.", {"why":"Linker básico para añadir. Idea → and → Idea.","examples":["I studied yesterday and I practiced speaking with a friend.","We visited the museum and we walked by the river.","He cooks dinner and she sets the table."]}),
    item('extra', "also", "también", "Agrega un segundo punto. Suele ir al inicio o antes del verbo principal.", "I reviewed the notes. Also, I prepared three examples.", "She speaks English. She also studies French on weekends.", {"why":"Añadir información sin repetir and.","examples":["I work full time. Also, I take evening classes.","The movie was long. It was also very funny.","We need clarity. We also need patience under pressure."]}),
    item('extra', "in addition", "además", "Formal: segundo hecho. Ideal en escritura y presentaciones.", "The plan is clear. In addition, the timeline is realistic.", "She leads the team. In addition, she mentors new hires.", {"why":"Añadir con tono profesional.","examples":["The city is safe. In addition, public transport is reliable.","I improved my grammar. In addition, I expanded my vocabulary.","The course is free. In addition, you get weekly feedback."]}),
    item('extra', "furthermore", "además / más aún", "Añadir con fuerza formal. Usalo una vez, no en cadena.", "The argument is solid. Furthermore, the evidence is recent.", "He apologized. Furthermore, he fixed the mistake the same day.", {"why":"Añadir con énfasis.","examples":["The book is short. Furthermore, the language is clear.","I arrived early. Furthermore, I had already prepared my notes.","Customer service matters. Furthermore, tone matters as much as the fix."]}),
    item('extra', "as well", "también", "Al final: …as well. Sonido natural en oral.", "I brought the documents as well.", "She invited her cousins as well.", {"why":"Añadir al cierre de la frase.","examples":["I cleaned the kitchen and the living room as well.","He speaks Spanish and English as well.","Bring your ID and your notebook as well."]}),
    item('extra', "not only that", "no solo eso", "Abre un segundo punto fuerte después de uno ya dicho.", "The trip was cheap. Not only that, the hotel was excellent.", "She finished early. Not only that, she helped the rest of the team.", {"why":"Añadir con punch.","examples":["The exam was hard. Not only that, the room was freezing.","He missed the bus. Not only that, it started to rain.","I learned the rule. Not only that, I used it in a real conversation."]}),
    item('extra', "because", "porque", "Razón + cláusula completa (sujeto + verbo).", "I stayed home because it was raining.", "She improved because she practiced every day.", {"why":"Dar razón con idea completa.","examples":["I expanded my answer because one sentence is not a conversation.","We left early because the roads get busy after five.","He felt confident because he had prepared well."]}),
    item('extra', "since", "ya que / puesto que", "Razón conocida o contexto ya compartido.", "Since you are here early, we can start now.", "I took the bus since my car was in the shop.", {"why":"Razón con tono natural.","examples":["Since the library was closed, we studied at home.","I called her since I had good news.","Since English is used at work, I practice every morning."]}),
    item('extra', "due to", "debido a", "Solo antes de un sustantivo: due to the delay / due to the weather.", "The flight was late due to the storm.", "Classes were canceled due to the holiday.", {"why":"due to + noun (no + cláusula completa).","examples":["The match was postponed due to heavy rain.","She was late due to traffic.","The delay was due to a power cut."]}),
    item('extra', "as", "como / ya que", "Razón corta o simultánea.", "As I was leaving, the phone rang.", "As you already know, the deadline is Friday.", {"why":"Razón o simultaneidad.","examples":["As it was getting dark, we headed back.","As he speaks slowly, beginners understand him.","As I had free time, I wrote three paragraphs."]}),
    item('extra', "given that", "dado que", "Razón formal / contexto de política o hechos claros.", "Given that time is limited, we will focus on the main point.", "Given that she studied hard, her score makes sense.", {"why":"Razón formal.","examples":["Given that everyone arrived, we can begin.","Given that the instructions were clear, mistakes should be rare.","Given that English needs practice, short daily sessions help."]}),
    item('extra', "so", "así que", "Resultado simple y oral.", "It was late, so we took a taxi.", "I was hungry, so I made a sandwich.", {"why":"Resultado cotidiano.","examples":["The room was noisy, so I closed the door.","She finished early, so she reviewed her notes.","I did not understand, so I asked again."]}),
    item('extra', "therefore", "por lo tanto", "Consecuencia formal (a menudo con punto y coma).", "The evidence is clear; therefore the decision is simple.", "He missed three classes; therefore he needs a catch-up plan.", {"why":"Resultado profesional.","examples":["Customer service is the backbone of the business; therefore tone matters.","The instructions were wrong; therefore we restarted.","She met the goal; therefore the team celebrated."]}),
    item('extra', "as a result", "como resultado", "Outcome claro después de una causa.", "He trained for months. As a result, he finished the race.", "I finished everything on time. As a result, I felt productive.", {"why":"Resultado explícito.","examples":["It rained all week. As a result, the streets flooded.","She practiced daily. As a result, her fluency improved.","We cut the budget. As a result, the trip was shorter."]}),
    item('extra', "consequently", "en consecuencia", "Formal — una vez, no dump.", "The contract changed. Consequently, we updated the plan.", "He ignored the warning. Consequently, the project slipped.", {"why":"Resultado formal.","examples":["Demand rose. Consequently, prices went up.","She arrived late. Consequently, she missed the intro.","The data was incomplete. Consequently, we delayed the launch."]}),
    item('extra', "which means that", "lo cual significa que", "Consecuencia o clarificación del hecho anterior.", "I work in customer service, which means that I speak English every day.", "The store is closed, which means that we must come back tomorrow.", {"why":"Explica qué implica el hecho.","examples":["He won the scholarship, which means that tuition is covered.","The battery is dead, which means that we need a charger.","She lives abroad, which means that calls are expensive."]}),
    item('extra', "but", "pero", "Contraste básico. Alterná con however en escritura.", "I like the idea, but I need more time.", "The weather was cold, but the hike was worth it.", {"why":"Contraste simple.","examples":["She is tired, but she keeps practicing.","The book is long, but it is easy to read.","I wanted coffee, but the café was closed."]}),
    item('extra', "however", "sin embargo", "Contraste profesional: nueva frase + coma.", "I wanted to go out. However, it started raining.", "The plan looked perfect. However, the budget was too high.", {"why":"Contraste escrito / formal.","examples":["I worked yesterday because I had a key meeting; however, it did not go as expected.","The city is beautiful. However, housing is expensive.","He speaks fast. However, his ideas are clear."]}),
    item('extra', "even though", "aunque / aun cuando", "Concede un hecho y mantenés tu punto.", "Even though I was nervous, I spoke clearly.", "Even though it was late, they kept working.", {"why":"Concesión + idea principal.","examples":["Even though the test was hard, she stayed calm.","Even though he disagrees, he listens.","Even though English felt strange at first, it became natural."]}),
    item('extra', "although", "aunque", "Contraste dentro de una oración. No “although… but”.", "Although it can be challenging, I keep a professional tone.", "Although she was busy, she answered every question.", {"why":"Concesión en una sola oración.","examples":["Although the room was small, it was comfortable.","Although he studied little, he remembered the key points.","Although traffic was heavy, we arrived on time."]}),
    item('extra', "nevertheless", "no obstante", "Concede y seguís adelante.", "My performance was disappointing. Nevertheless, that experience built resilience.", "The path was steep. Nevertheless, we reached the top.", {"why":"Concesión + continuidad.","examples":["The news was bad. Nevertheless, the team stayed focused.","She felt sick. Nevertheless, she finished the presentation.","It looked impossible. Nevertheless, they tried again."]}),
    item('extra', "despite this", "a pesar de esto", "Después de un hecho difícil.", "The first attempt failed. Despite this, we kept improving.", "He lost the map. Despite this, he found the trail.", {"why":"Contraste después de un obstáculo.","examples":["The schedule was full. Despite this, she made time to practice.","Prices rose. Despite this, demand stayed strong.","It was her first speech. Despite this, the audience listened carefully."]}),
    item('extra', "on the other hand", "por el otro lado", "Segunda cara del argumento (forma completa).", "Speed matters; on the other hand, clarity without structure still fails.", "Remote work is flexible; on the other hand, it needs discipline.", {"why":"Presentar la otra cara.","examples":["The course is cheap; on the other hand, it demands daily practice.","Living downtown is lively; on the other hand, it is noisy.","A short answer is fast; on the other hand, it may sound incomplete."]}),
    item('extra', "first", "primero", "Orden de pasos.", "First I outline the idea, then I add examples.", "First check the date, then check the place.", {"why":"Secuencia.","examples":["First introduce yourself. Then state your goal.","First read the question carefully.","First write three sentences with linkers."]}),
    item('extra', "then", "después", "Siguiente paso.", "I verified the facts. Then I wrote the summary.", "She listened. Then she asked a smart question.", {"why":"Secuencia.","examples":["Mix the flour. Then add the milk.","Finish the draft. Then edit the grammar.","Greet the person. Then explain the situation."]}),
    item('extra', "after that", "después de eso", "Secuencia oral/escrita.", "We visited the museum. After that, we had lunch.", "I sent the email. After that, I waited for a reply.", {"why":"Secuencia.","examples":["Warm up for five minutes. After that, start the drill.","He introduced the topic. After that, he showed examples.","Save the file. After that, share the link."]}),
    item('extra', "finally", "finalmente", "Cierre de secuencia.", "Finally, I checked spelling and sent the message.", "Finally, we agreed on a date.", {"why":"Último paso.","examples":["First plan, then draft, finally revise.","We packed, we traveled, and finally we arrived.","Finally, thank the listener and stop."]}),
    item('extra', "eventually", "al final / con el tiempo", "Resultado tras un proceso, no necesariamente el último paso inmediato.", "She practiced for months and eventually felt confident.", "The delay was long, but we eventually boarded.", {"why":"Resultado con el tiempo.","examples":["He kept applying and eventually got the job.","The rain stopped eventually.","If you nest ideas every day, you eventually sound natural."]}),
    item('extra', "subsequently", "posteriormente", "Formal: después en el proceso.", "The meeting ended. Subsequently, we sent the minutes.", "She filed the form. Subsequently, she received a confirmation.", {"why":"Secuencia formal.","examples":["He graduated. Subsequently, he moved abroad.","We tested the idea. Subsequently, we improved it.","The error was found. Subsequently, it was corrected."]}),

    // ── Phrasals (inglés amplio) ──
    item('phrasals', "look into", "investigar", "Inseparable: look into it / look into the problem. Significa investigar o examinar con cuidado.", "I will look into the delay and tell you what I find.", "Please look into these three options before Friday.", {"why":"Phrasal de investigación. Usalo en nesting, no solo suelto.","examples":["The manager will look into the complaint.","I looked into several universities before I chose one.","Can you look into why the printer stopped working?"]} ),
    item('phrasals', "sort out", "resolver / organizar", "Separable: sort it out / sort the problem out. Resolver o poner en orden.", "We need to sort out the schedule this week.", "I sorted the files out before the meeting.", {"why":"Resolver o ordenar.","examples":["Let's sort out who brings what to the party.","She sorted out the misunderstanding with a calm talk.","I still need to sort my suitcase out."]}),
    item('phrasals', "follow up", "dar seguimiento", "follow up with someone / on something. Volver a contactar o continuar un tema.", "I will follow up with you tomorrow morning.", "She followed up on the application after one week.", {"why":"Seguimiento claro.","examples":["Please follow up on that email if you get no reply.","He followed up with the teacher after class.","I followed up on my request yesterday."]}),
    item('phrasals', "hand off", "pasar (una tarea)", "Pasar responsabilidad a otra persona con contexto, no abandonar el tema.", "I will hand off this task to Ana with clear notes.", "When you hand work off, explain what is done and what is pending.", {"why":"Transferencia con ownership.","examples":["She handed the project off to the new lead.","Do not hand off a task without the files.","I handed off the booking to my colleague."]}),
    item('phrasals', "write up", "redactar / documentar", "Escribir un resumen formal de lo que pasó.", "Please write up what we decided in three short paragraphs.", "I wrote up the interview while it was fresh.", {"why":"Documentar en inglés claro.","examples":["Write up your day using five linkers.","He wrote up the accident for the report.","I need to write up my notes before I forget."]}),
    item('phrasals', "write down", "anotar", "Escribir algo breve para no olvidarlo.", "Write down three new words after each lesson.", "I wrote her number down on a sticky note.", {"why":"Anotar.","examples":["Write the password down in a safe place.","She wrote down every example from the board.","I forgot to write the address down."]}),
    item('phrasals', "find out", "averiguar / descubrir", "Descubrir información (a menudo después de preguntar o buscar).", "I need to find out what time the train leaves.", "She found out the truth later that night.", {"why":"Averiguar.","examples":["Can you find out if the museum is open on Mondays?","He found out he had passed the exam.","I still have not found out the price."]}),
    item('phrasals', "figure out", "entender / resolver cómo", "Entender cómo funciona algo o cómo resolverlo.", "I cannot figure out this instruction. Can you help?", "She figured out a faster route home.", {"why":"Comprender / resolver.","examples":["Let's figure out a study plan for the week.","He finally figured out the puzzle.","I am trying to figure out how this app works."]}),
    item('phrasals', "call back", "devolver la llamada", "Llamar de nuevo a alguien.", "I will call you back after lunch.", "She called me back within ten minutes.", {"why":"Devolver llamada.","examples":["Sorry I missed you — I will call back soon.","Please call me back when you are free.","He never called back."]}),
    item('phrasals', "hold on", "esperá / aguantá", "Pedir que esperen un momento (teléfono o conversación).", "Hold on a second while I check the date.", "Hold on — I am almost finished.", {"why":"Pedir espera breve.","examples":["Hold on, let me find a pen.","Can you hold on while I open the file?","Hold on, I did not hear the last part."]}),
    item('phrasals', "hang up", "colgar", "Terminar una llamada telefónica.", "Do not hang up until we confirm the next step.", "She hung up by accident.", {"why":"Colgar.","examples":["I have to hang up now; traffic is bad.","He hung up before I could answer.","Please do not hang up — I am still here."]}),
    item('phrasals', "put through", "pasar (una llamada)", "Conectar a alguien con otra persona por teléfono.", "Could you put me through to the manager?", "The receptionist put me through right away.", {"why":"Transferir llamada.","examples":["I will put you through to support.","They put her through after a short wait.","Can you put me through to room 12?"]} ),
    item('phrasals', "fill out", "llenar (formulario)", "Completar un formulario.", "Please fill out this form in English.", "I filled out the application last night.", {"why":"Llenar formulario.","examples":["Fill out your name and address carefully.","She filled the survey out in five minutes.","Did you fill out section two?"]} ),
    item('phrasals', "check on", "revisar el estado de", "Ver cómo está alguien o algo.", "I will check on the delivery this afternoon.", "Can you check on your grandmother later?", {"why":"Revisar estado.","examples":["Check on the cake — it may be ready.","He checked on the kids after school.","I need to check on my reservation."]}),
    item('phrasals', "turn down", "rechazar / bajar", "Rechazar una oferta, o bajar volumen.", "I had to turn down the invitation because I was busy.", "Please turn the music down.", {"why":"Rechazar o bajar.","examples":["She turned down the job offer.","Turn down the heat a little.","He politely turned down the second dessert."]}),
    item('phrasals', "pick up", "recoger / aprender / contestar", "Recoger algo/a alguien; aprender; contestar el teléfono.", "I will pick you up at six.", "She picks up new phrases very quickly.", {"why":"Varios sentidos comunes.","examples":["Pick up some milk on the way home.","He picked up French while living abroad.","Can you pick up the phone?"]} ),
    item('phrasals', "bring up", "mencionar / criar", "Mencionar un tema; o criar hijos.", "May I bring up one more question?", "They brought up three children in Scotland.", {"why":"Mencionar o criar.","examples":["Do not bring up politics at dinner.","She brought up a useful example.","He was brought up in a small town."]}),
    item('phrasals', "carry on", "continuar", "Seguir haciendo algo.", "Please carry on with your story.", "They carried on working despite the noise.", {"why":"Continuar.","examples":["Carry on reading from page ten.","Sorry for the interruption — carry on.","We carried on until midnight."]}),
    item('phrasals', "give up", "rendirse / dejar", "Dejar de intentar, o dejar un hábito.", "Do not give up after one mistake.", "He gave up sugar for a month.", {"why":"No rendirse en el aprendizaje; o abandonar un hábito.","examples":["She almost gave up, but she tried again.","I will not give up on this skill.","He gave up smoking years ago."]}),
    item('phrasals', "run out of", "quedarse sin", "Acabarse un recurso.", "We ran out of time before the last question.", "I ran out of milk this morning.", {"why":"Quedarse sin.","examples":["Do not run out of battery mid-call.","They ran out of tickets.","I ran out of ideas, so I took a break."]}),
    item('phrasals', "look after", "cuidar / encargarse", "Cuidar personas, animales o responsabilidades.", "Can you look after my bag for a minute?", "She looks after her younger brother.", {"why":"Cuidar.","examples":["Who looks after the plants when you travel?","I will look after this task today.","They look after each other."]}),
    item('phrasals', "wake up", "despertarse", "Dejar de dormir; a veces darse cuenta.", "I wake up at six on weekdays.", "The noise woke me up.", {"why":"Despertar.","examples":["Wake up — we will be late.","She wakes up early to study.","I woke up in the middle of the night."]}),
    item('phrasals', "turn off", "apagar", "Apagar un aparato o luz.", "Please turn off the lights when you leave.", "I turned my phone off during the movie.", {"why":"Apagar.","examples":["Turn off the stove before you go.","He forgot to turn the laptop off.","Turn off notifications while you practice."]}),
    item('phrasals', "drop off", "dejar / entregar", "Dejar a alguien o algo en un lugar.", "I will drop you off at the station.", "She dropped the package off this morning.", {"why":"Dejar / entregar.","examples":["Can you drop me off near the library?","He dropped the kids off at school.","I dropped my keys off at the front desk."]}),
    item('phrasals', "call off", "cancelar", "Cancelar un evento o plan.", "They called off the picnic because of rain.", "Management called the meeting off.", {"why":"Cancelar.","examples":["Do we need to call off tonight's class?","The flight was called off.","She called off the wedding."]}),
    item('phrasals', "send over", "enviar (hacia alguien)", "Enviar algo a otra persona (archivo, foto, documento).", "I will send over the notes after class.", "Please send the photos over when you can.", {"why":"Enviar.","examples":["Send over your draft by Friday.","He sent the invoice over yesterday.","Can you send that link over?"]} ),
    item('phrasals', "go down", "bajar / caerse (sistema)", "Bajar de nivel/precio; o un sistema deja de funcionar.", "Prices went down last month.", "The website went down for an hour.", {"why":"Bajar o caer.","examples":["Temperature will go down tonight.","My internet went down during the call.","Interest in the topic never went down."]}),
    item('phrasals', "put off", "posponer", "Dejar algo para más tarde.", "Do not put off practicing until the night before.", "They put the trip off until spring.", {"why":"Posponer.","examples":["I keep putting off this essay.","We put off dinner because of traffic.","Do not put off asking questions."]}),
    item('phrasals', "take off", "despegar / quitarse / despegar (éxito)", "Avión despega; quitarse ropa; o empezar a tener éxito.", "The plane takes off at noon.", "Take off your jacket if you are hot.", {"why":"Varios sentidos.","examples":["Her career took off after the internship.","Take your shoes off at the door.","What time does the flight take off?"]} ),
    item('phrasals', "come across", "encontrarse con / parecer", "Encontrar por casualidad; o dar cierta impresión.", "I came across a useful article yesterday.", "He comes across as confident.", {"why":"Encontrar o parecer.","examples":["I came across my old notebook.","She comes across as friendly.","Did you come across any errors?"]} ),

    // ── Prefijos (inglés amplio) ──
    item('affix', "un-", "negación", "Prefijo: cambia el SIGNIFICADO. happy → unhappy; fair → unfair; lock → unlock.", "I was unhappy with my first draft, so I rewrote it.", "It is unfair to judge before you listen.", {"why":"Prefijo = significado. Forma familias: happy / unhappy / happiness.","steps":["Identificá la base (happy, fair, clear).","Agregá un- para negar.","Usá la palabra nueva en una frase real."],"examples":["The instructions were unclear at first.","Please unlock the door.","An unexpected guest arrived."]}),
    item('affix', "dis-", "contrario", "Prefijo: agree → disagree; appear → disappear; connect → disconnect.", "I disagree with that conclusion, but I respect it.", "The signal disappeared in the tunnel.", {"why":"dis- marca lo contrario o la separación.","steps":["Partí de agree / appear / connect.","Formá disagree / disappear / disconnect.","Decí una frase con cada una."],"examples":["They disagree about the schedule.","Do not disconnect before you save.","Her smile disappeared when she heard the news."]}),
    item('affix', "mis-", "error", "Prefijo: understand → misunderstand; spell → misspell; place → misplace.", "I misunderstood the question, so I answered the wrong part.", "I misplaced my keys again.", {"why":"mis- = mal / por error.","steps":["Pensá la base correcta.","Agregá mis- para marcar el error.","Corregí en la siguiente frase."],"examples":["Do not misread the deadline.","She misspelled three words.","We misunderstood each other."]}),
    item('affix', "re-", "repetir / de nuevo", "Prefijo: do → redo; write → rewrite; read → reread; view → review.", "I will rewrite the paragraph with better linkers.", "Please reread the last sentence out loud.", {"why":"re- = otra vez.","steps":["Elegí un verbo (write, do, build).","Agregá re-.","Usalo para mostrar mejora."],"examples":["We need to rebuild the outline.","He redid the exercise carefully.","I reviewed my notes before bed."]}),
    item('affix', "over-", "exceso", "Prefijo: react → overreact; cook → overcook; work → overwork.", "Do not overreact to one mistake.", "I overcooked the rice.", {"why":"over- = demasiado.","steps":["Base + over-.","Preguntate: ¿es exceso?","Usá un ejemplo cotidiano."],"examples":["She overworked herself last week.","The room was overcrowded.","Try not to overexplain."]}),
    item('affix', "under-", "insuficiente / debajo", "Prefijo: estimate → underestimate; pay → underpay; ground → underground.", "Do not underestimate daily practice.", "The café is underground, next to the station.", {"why":"under- = de menos o debajo.","steps":["Base + under-.","Decidí si es cantidad o lugar.","Frase completa."],"examples":["We underestimated the time we needed.","The pipe runs underground.","He felt underprepared at first."]}),
    item('affix', "in- / non-", "no / fuera de", "Prefijo: complete → incomplete; correct → incorrect; sense → nonsense; stop → nonstop.", "My notes are still incomplete.", "That explanation is incorrect.", {"why":"in-/im-/il-/ir-/non- niegan según la base.","steps":["Probá in- o non- según la palabra.","Decí el opuesto.","Usalo en una oración."],"examples":["The form is incomplete.","Nonstop flights are faster.","An informal tone can still be polite."]}),
    item('affix', "pre-", "antes", "Prefijo: pay → prepay; view → preview; heat → preheat.", "Please preheat the oven.", "I watched a preview of the documentary.", {"why":"pre- = antes.","steps":["Pensá la acción.","Agregá pre- si ocurre antes.","Ejemplo oral."],"examples":["We prepaid the tickets.","Read the preview before the chapter.","A prearranged meeting saves time."]}),

    // ── Sufijos (inglés amplio) ──
    item('suffix', "-ness", "adjetivo → sustantivo", "Sufijo: cambia la FUNCIÓN. happy → happiness; dark → darkness; kind → kindness.", "Happiness is not the same as comfort.", "Her kindness made the first day easier.", {"why":"Sufijo = función gramatical (aquí: adjetivo → sustantivo abstracto).","steps":["Tomá el adjetivo (happy, dark, kind).","Agregá -ness.","Usá el sustantivo en una frase."],"examples":["The darkness outside made the room feel quiet.","I noticed a sudden sadness in his voice.","Weakness can become strength with practice."]}),
    item('suffix', "-ment", "verbo → sustantivo", "Sufijo: develop → development; agree → agreement; improve → improvement.", "There was clear improvement after two weeks.", "We reached an agreement before lunch.", {"why":"Verbo → sustantivo de resultado/proceso.","steps":["Identificá el verbo.","Agregá -ment.","Usalo como sujeto u objeto."],"examples":["Personal development takes consistency.","The announcement surprised everyone.","Payment is due on Monday."]}),
    item('suffix', "-tion / -ation", "verbo → sustantivo", "Sufijo: educate → education; inform → information; create → creation; celebrate → celebration.", "Education opens options you cannot see yet.", "Thank you for the information — it was clear.", {"why":"Verbo → sustantivo. Muy común en inglés escrito y oral.","steps":["Partí del verbo (educate, inform, create).","Formá education / information / creation.","Escribí dos ejemplos naturales."],"examples":["The celebration lasted all evening.","Communication improves when we nest ideas.","His explanation helped more than a long list of words."]}),
    item('suffix', "-ful", "sustantivo → adjetivo", "Sufijo: care → careful; help → helpful; use → useful; beauty → beautiful.", "Be careful with irregular verbs.", "That tip was really helpful.", {"why":"Lleno de / con esa cualidad.","steps":["Sustantivo o base + -ful.","Usalo antes de un sustantivo o después de be.","Ejemplo oral."],"examples":["She gave a beautiful answer.","A useful example beats a long definition.","Stay hopeful when progress feels slow."]}),
    item('suffix', "-less", "sustantivo → adjetivo (sin)", "Sufijo: hope → hopeless; use → useless; care → careless; end → endless.", "The list felt endless, so I split it into three parts.", "A careless mistake is still a chance to learn.", {"why":"Sin esa cosa / sin esa cualidad.","steps":["Base + -less.","Contraste con -ful cuando exista (careful / careless).","Frase completa."],"examples":["Do not feel hopeless after one quiz.","A wireless mouse is convenient.","His reply was pointless and vague."]}),
    item('suffix', "-able", "verbo → adjetivo (posible)", "Sufijo: manage → manageable; read → readable; rely → reliable; enjoy → enjoyable.", "Break the task into manageable steps.", "Is this text readable for beginners?", {"why":"Puede hacerse / digno de.","steps":["Verbo + -able / -ible.","Preguntá: ¿es posible?","Ejemplo."],"examples":["She is a reliable friend.","The movie was enjoyable.","Keep your goals achievable this month."]}),
    item('suffix', "-ly", "adjetivo → adverbio", "Sufijo: quick → quickly; clear → clearly; polite → politely; professional → professionally.", "Speak clearly, even when you feel nervous.", "She answered politely and firmly.", {"why":"Describe cómo se hace la acción.","steps":["Adjetivo + -ly (ojo: good → well).","Poné el adverbio cerca del verbo.","Practicá en voz alta."],"examples":["He improved quickly after daily practice.","Please write carefully.","They worked quietly in the library."]}),
    item('suffix', "-er / -or", "verbo → persona/agente", "Sufijo: teach → teacher; write → writer; act → actor; supervise → supervisor.", "A good teacher explains with examples, not only rules.", "She wants to be a writer.", {"why":"Persona que hace la acción.","steps":["Verbo + -er / -or.","Usalo con a/an/the.","Ejemplo de vida real."],"examples":["The speaker was calm and clear.","My brother is a driver.","The editor fixed three sentences."]}),

    // ── Expresiones naturales (TB) + cliente→desk (antes “Slang”) ──
    item('natural', "the thing is / the thing is that", "el asunto es que / lo que pasa es que", "Enfoca UNA restricción. Presente: the thing is. Pasado: the thing was.", "The thing is I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "what happens is that / what happened was", "lo que pasa es que / lo que pasó fue", "Presente = regla. Pasado = este caso.", "What happens is that I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "on top of that", "encima de eso / además", "Segundo hecho, tono natural (Fase 3).", "On top of that I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "to be honest", "para ser honesto / con franqueza", "Bajá expectativa falsa y ofrecé lo que sí podés.", "To be honest I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "actually", "en realidad / de hecho", "Corregí un dato del CRM sin pelear.", "Actually I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "at the end of the day", "al final / en resumen", "Cierre: dueño + hora. Una vez, no tres.", "At the end of the day I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "not only that", "no solo eso", "Segundo punto fuerte.", "Not only that I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "despite / in spite of", "a pesar de", "Concede y mantenés la acción segura.", "Despite I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "I realized", "me di cuenta", "Después de mirar evidencia.", "I realized I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "find a way / figure out", "encontrar la manera", "Path legal, no shortcut.", "Find a way I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "here’s the thing / the point is", "el punto es", "Voy a ser directo + decisión.", "Here’s the thing I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "what I mean is / I mean", "lo que quiero decir es", "Reformulá sin relleno.", "What I mean is I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "as it turns out", "resulta que", "Después del CRM.", "As it turns out I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "just to make sure I understood", "solo para confirmar que entendí", "Stall + pregunta cerrada.", "Just to make sure I understood I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "that is a great point. Let me address that", "buen punto, déjeme atenderlo", "Stall de 5 segundos + evidencia.", "That is a great point. Let me address that I cannot send a PIN by SMS.", "Natural expression from the Training Book Phase 3 list.", {"why":"Expresión natural del Training Book. Cuenta para el mínimo de 5 en la anécdota Fase 2–3."}),
    item('natural', "“fix it now” → I will take a safe action", "“arréglalo ya”", "No prometás un fix ilegal. Nombrá la acción segura. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. I will take a safe action", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“my money is gone” → the funds are under investigation", "“se desapareció mi plata”", "No confirmés pérdida. Lenguaje de investigación. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. the funds are under investigation", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“just in case” → I will not keep both credits open", "“por si acaso”", "Dispute + refund = riesgo de doble crédito. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. I will not keep both credits open", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“just refund me” → I will follow the eligible path", "“devolvéme la plata ya”", "Refund no es automático. Nombrá el path. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. I will follow the eligible path", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“this is ridiculous / third time” → acknowledge + CRM history", "“esto es ridículo / tercera vez”", "Empatía + Previous contacts. No reinicies de cero. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. acknowledge + CRM history", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“I already told you” → I have the prior note", "“ya se lo dije”", "Ownership del CRM. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. I have the prior note", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“my card died” → the card is blocked / declined", "“se me murió la tarjeta”", "Desk: declined, blocked o expired. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. the card is blocked / declined", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“they stole my money” → unauthorized vs PIN-present", "“me robaron”", "No confirmés robo. Evidencia primero. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. unauthorized vs PIN-present", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“I don’t have time” → one concrete next step", "“no tengo tiempo”", "Camino más corto, aún legal + hora. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. one concrete next step", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“you guys always…” → this case, this evidence", "“ustedes siempre…”", "Trabajá ESTE file, no la empresa. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. this case, this evidence", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“hang on / wait wait” → please stay with me", "“esperá / hold on”", "Keep the client. Nombrá qué estás haciendo. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. please stay with me", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    item('natural', "“I need this like yesterday” → timed owner", "“esto era para ayer”", "Urgencia + reloj. Sin promesas falsas. (Cliente → inglés de desk. Antes estaba en “Slang”; ahora vive en Expresiones para no duplicar.)", "I understand. timed owner", "Client line mapped to professional desk English.", {"why":"Misma familia que Expresiones: tono natural del cliente → respuesta profesional del desk."}),
    // ── Casos / technicismos siguen abajo ──
    item('tech', 'PIN', 'PIN', 'Never send, read or email a PIN. Last 6 only after identity.', 'I cannot text the PIN. Policy is last 6 after verification on a recorded line.', 'PIN-present ATM is not automatic unauthorized fraud.'),
    item('tech', 'last 6', 'últimos 6', 'Last six digits of the card after full identity.', 'After identity I can confirm last 6 — never the full PAN.', 'Please wait while I verify, then I will confirm last 6.'),
    item('tech', 'travel notice', 'aviso de viaje', 'Expected country/dates on the card. File the correct city.', 'There is a notice for Paris, not Lisbon. I will file Lisbon now.', 'I will set a travel notice before you use the virtual card.'),
    item('tech', 'provisional credit', 'crédito provisional', 'Temporary credit after a case number — not an instant refund.', 'Provisional credit is two business days after the case number.', 'I cannot promise same-day provisional credit for a Standard client.'),
    item('tech', 'chargeback', 'contracargo', 'Network dispute. Needs evidence and a live window.', 'I will not file a chargeback without the booking confirmation.', 'A chargeback after the reporting window is ineligible.'),
    item('tech', 'reporting window', 'ventana de reporte', 'Usually 60 days from the statement date.', 'According to the statement date, the reporting window has closed.', 'We are still inside the reporting window, so I can file with evidence.'),
    item('tech', 'virtual card', 'tarjeta virtual', 'Digital card you can activate when the plastic is blocked.', 'I will activate the virtual card instead of wiring money.', 'The virtual card can take the airline payment today.'),
    item('tech', 'AA (awaiting action)', 'AA — awaiting action', 'Disposition: waiting on client, merchant or you.', 'I will set AA and call you today at 4:30 p.m.', 'Disposition AA: waiting on the booking confirmation.'),
    item('tech', 'PSA (pending system)', 'PSA — pending system', 'Waiting on a system, network or another desk.', 'PSA: representment pending. I will follow up in 12 business days.', 'I cannot guarantee the outcome while the case is PSA.'),
    item('tech', 'disposition', 'disposición', 'The official case status you name and justify.', 'I will name the disposition and explain why in the note.', 'Safe disposition: AA until identity is complete.'),
    item('tech', 'goodwill', 'gesto comercial / goodwill', 'Supervisor authority. Do not match an invalid promise yourself.', 'Goodwill is supervisor-only. I will hand this off with the case number.', 'I cannot pay goodwill from desk funds today.'),
    item('tech', 'MCC block', 'bloqueo MCC', 'Merchant category control. Confirm which rule fired.', 'A $500 hotel MCC block remains from a prior dispute.', 'I will not lift every MCC block until we know which rule fired.'),
    item('casos', 'identity verification', 'verificación de identidad', 'Recorded line, data points, then last 6. Never PIN.', 'Identity verification is incomplete: date of birth does not match.', 'I will complete identity verification before I confirm last 6.'),
    item('casos', 'recorded line', 'línea grabada', 'Where identity and PIN rules live.', 'We are on a recorded line. I will not send the PIN.', 'Mother’s maiden name matched; date of birth did not — I stay on the recorded line.'),
    item('casos', 'service not rendered', 'servicio no prestado', 'Usually merchant first unless written refusal exists.', 'This is service not rendered: overbooking. I will document merchant contact.', 'A screenshot can be enough if I write it up clearly.'),
    item('casos', 'double credit', 'doble crédito', 'Refund + live dispute. Withdraw one.', 'Keeping both creates a double credit. I will withdraw the dispute.', 'I confirmed the $620 merchant refund posted yesterday.'),
    item('casos', 'withdraw / reopen', 'retirar / reabrir', 'Close the extra claim; reopen if the refund reverses.', 'I will withdraw the dispute and explain the 10-day reopen path.', 'If the refund reverses, we can reopen within 10 days.'),
    item('casos', 'operating account', 'cuenta operativa', 'Daily business money: payroll, suppliers, transfers.', 'Payroll moves on the Operating Account, not the Obsidian card.', 'I will check the Operating Account statements for the supplier payment.'),
    item('casos', 'Obsidian card', 'tarjeta Obsidian', 'Corporate travel and spend. Notices and limits apply.', 'The Obsidian card declined in Lisbon. I will check travel notice and MCC.', 'Obsidian is spend; the Operating Account is payroll.')
  ];

  var READ_CATS = [
    { id: 'learn', label: 'Aprendizaje' },
    { id: 'enlit', label: 'Literatura EN' },
    { id: 'sclit', label: 'Literatura escocesa' },
    { id: 'news', label: 'Noticias UK-Scotland' }
  ];

  var READ_ITEMS = [
    { cat: 'learn', title: 'BBC Learning English', why: 'Gratis. Home de noticias y series para estudiantes.', url: 'https://www.bbc.co.uk/learningenglish' },
    { cat: 'learn', title: 'BBC Lingohack', why: 'Noticias reales de la BBC con vocabulario de apoyo.', url: 'https://www.bbc.co.uk/learningenglish/english/features/lingohack' },
    { cat: 'learn', title: 'BBC 6 Minute English', why: 'Audio corto, transcripción libre, sin suscripción.', url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
    { cat: 'learn', title: 'VOA Learning English', why: 'Noticias lentas y claras. Gratis.', url: 'https://learningenglish.voanews.com/' },
    { cat: 'learn', title: 'British Council — Reading', why: 'Lecturas por nivel, sin paywall de curso.', url: 'https://learnenglish.britishcouncil.org/skills/reading' },
    { cat: 'learn', title: 'La Nación — El Mundo', why: 'Resumí un titular en inglés (PR/PC). Portada libre.', url: 'https://www.nacion.com/el-mundo/' },
    { cat: 'enlit', title: 'Pride and Prejudice — Austen', why: 'Novela completa en Gutenberg, lectura en el navegador.', url: 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html' },
    { cat: 'enlit', title: 'Jane Eyre — Charlotte Brontë', why: 'Texto público, sin descarga rara.', url: 'https://www.gutenberg.org/cache/epub/1260/pg1260-images.html' },
    { cat: 'enlit', title: 'Alice in Wonderland — Carroll', why: 'Corto y claro para 5–10 min de lectura.', url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html' },
    { cat: 'enlit', title: 'Frankenstein — Shelley', why: 'Clásico EN; HTML verificado 200.', url: 'https://www.gutenberg.org/cache/epub/84/pg84-images.html' },
    { cat: 'enlit', title: 'A Christmas Carol — Dickens', why: 'Relato corto, inglés de escritorio narrativo.', url: 'https://www.gutenberg.org/cache/epub/46/pg46-images.html' },
    { cat: 'enlit', title: 'Standard Ebooks — catálogo', why: 'Ediciones limpias, sin DRM. Gratis.', url: 'https://standardebooks.org/' },
    { cat: 'sclit', title: 'Robert Burns — Complete Works', why: 'Poesía escocesa de dominio público (Gutenberg).', url: 'https://www.gutenberg.org/cache/epub/18500/pg18500-images.html' },
    { cat: 'sclit', title: 'Treasure Island — Stevenson', why: 'Escocia → aventura. Lectura online verificada.', url: 'https://www.gutenberg.org/cache/epub/120/pg120-images.html' },
    { cat: 'sclit', title: 'Kidnapped — Stevenson', why: 'Novela escocesa completa, HTML 200.', url: 'https://www.gutenberg.org/cache/epub/421/pg421-images.html' },
    { cat: 'sclit', title: 'Dr Jekyll and Mr Hyde — Stevenson', why: 'Corto. Edición Standard Ebooks de una página.', url: 'https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde/text/single-page' },
    { cat: 'sclit', title: 'Sherlock Holmes — Conan Doyle', why: 'Autor escocés; cuentos completos en Gutenberg.', url: 'https://www.gutenberg.org/cache/epub/1661/pg1661-images.html' },
    { cat: 'sclit', title: 'The Thirty-Nine Steps — Buchan', why: 'Thriller escocés, dominio público.', url: 'https://www.gutenberg.org/cache/epub/558/pg558-images.html' },
    { cat: 'sclit', title: 'Scottish Poetry Library', why: 'Poemas para leer en el sitio, sin suscripción.', url: 'https://www.scottishpoetrylibrary.org.uk/' },
    { cat: 'news', title: 'BBC News', why: 'Portada libre de la BBC.', url: 'https://www.bbc.co.uk/news' },
    { cat: 'news', title: 'BBC News UK', why: 'Sección Reino Unido, sin muro duro.', url: 'https://www.bbc.co.uk/news/uk' },
    { cat: 'news', title: 'BBC News Scotland', why: 'Escocia. URL verificada 200.', url: 'https://www.bbc.co.uk/news/scotland' },
    { cat: 'news', title: 'STV News', why: 'TV escocesa, noticias libres en el sitio.', url: 'https://news.stv.tv/' },
    { cat: 'news', title: 'CBBC Newsround', why: 'Noticias más simples, ideales para práctica.', url: 'https://www.bbc.co.uk/newsround' }
  ];

  function resolveBrand(opts) {
    opts = opts || {};
    var b = String(opts.brand || '').toLowerCase();
    if (b === 'kamuk') return 'kamuk';
    if (b === 'infinity') return 'infinity';
    try {
      if (/\/kamuk\//i.test(String(location.pathname || ''))) return 'kamuk';
    } catch (e) {}
    return 'infinity';
  }

  function brandLead(kind, brand) {
    if (kind !== 'gloss') {
      return 'Después de Jill, leé 5–10 min. Solo sitios libres verificados (sin 404, sin muro duro). Abrí en una pestaña nueva.';
    }
    var desk = brand === 'kamuk' ? 'Kamuk Holdings' : 'Infinity Holdings';
    return 'Buscá Encabezado, AMR, however o PIN. Cada chip es un ejemplo para el desk de ' + desk + ' (queue, Emails/Compose/Send, notes, Resolve).';
  }

  function ensureIds(items) {
    items.forEach(function (it, i) {
      if (!it._id) it._id = it.cat + '-' + i + '-' + fold(it.en || it.title || '').slice(0, 24);
    });
  }

  function explorer(el, cats, items, kind, opts) {
    if (!el) return;
    opts = opts || {};
    var brand = resolveBrand(opts);
    var cat = cats[0].id;
    var q = '';
    var openId = '';

    ensureIds(items);
    if (kind === 'gloss') {
      cat = 'email';
      var pick = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].cat === 'email' && /E2\s*Empat/i.test(items[i].en || '')) { pick = items[i]; break; }
      }
      if (!pick) {
        for (var j = 0; j < items.length; j++) {
          if (items[j].cat === 'email') { pick = items[j]; break; }
        }
      }
      if (pick) openId = pick._id;
    }

    function filtered() {
      var query = fold(q);
      return items.filter(function (it) {
        if (!query && it.cat !== cat) return false;
        if (!query) return true;
        var blob = fold([it.en, it.es, it.how, it.title, it.why, (it.steps || []).join(' '), (it.avoid || []).join(' '), (it.examples || []).join(' '), (it.forms || []).join(' ')].join(' '));
        return blob.indexOf(query) >= 0;
      });
    }

    function render() {
      var list = filtered();
      var chips = '';
      if (kind === 'gloss') {
        chips = list.map(function (it) {
          return '<button type="button" class="inf-tb-card kh-lib-chip' + (openId === it._id ? ' is-on' : '') + '" data-id="' + esc(it._id) + '"><b>' + esc(it.en) + '</b><small>' + esc(it.es) + '</small></button>';
        }).join('');
      } else {
        chips = list.map(function (it) {
          return '<a class="inf-tb-read-card kh-read-card" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer"><strong>' + esc(it.title) + '</strong><span>' + esc(it.why) + '</span><span class="inf-tb-read-go kh-read-go">Abrir ↗</span></a>';
        }).join('');
      }
      var selected = null;
      if (kind === 'gloss' && openId) {
        selected = list.filter(function (it) { return it._id === openId; })[0] || items.filter(function (it) { return it._id === openId; })[0];
      }
      var panel = '';
      if (kind === 'gloss') {
        panel = renderDetail(selected);
      }
      var leadClass = opts.hideLead ? 'inf-tb-lead kh-lib-lead' : 'inf-tb-lead kh-lib-lead';
      var leadStyle = opts.hideLead ? ' style="display:none"' : '';
      el.innerHTML = '<p class="' + leadClass + '"' + leadStyle + '>' + brandLead(kind, brand) + '</p>'
        + '<input class="inf-tb-search kh-lib-search" type="search" enterkeyhint="search" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' + (kind === 'gloss' ? 'Buscá: Encabezado, AMR, however, PIN, AA…' : 'Buscá: Burns, BBC Scotland, Austen…') + '" value="' + esc(q) + '">'
        + '<div class="inf-tb-cats kh-lib-cats">' + cats.map(function (c) {
          return '<button type="button" class="inf-tb-cat kh-lib-cat' + (c.id === cat ? ' is-on' : '') + '" data-cat="' + c.id + '">' + esc(c.label) + '</button>';
        }).join('') + '</div>'
        + '<div class="inf-tb-count kh-lib-count">' + list.length + (kind === 'gloss' ? ' expresiones' : ' lecturas') + (q ? ' · filtro activo' : '') + '</div>'
        + (kind === 'gloss' ? '<div class="inf-tb-grid kh-lib-chips">' + (chips || '<p class="inf-tb-empty kh-lib-empty">Nada con esa búsqueda.</p>') + '</div>' + panel
          : '<div class="inf-tb-read-grid kh-read-grid">' + (chips || '<p class="inf-tb-empty kh-lib-empty">Nada con esa búsqueda.</p>') + '</div>');
      var search = el.querySelector('.inf-tb-search') || el.querySelector('.kh-lib-search');
      if (search && q) {
        search.focus();
        try { search.setSelectionRange(q.length, q.length); } catch (e) {}
      }
    }

    el.className = (el.className + ' inf-tb-shell kh-lib').replace(/\s+/g, ' ').trim();
    el.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-cat]');
      if (c) { cat = c.getAttribute('data-cat'); q = ''; openId = ''; render(); return; }
      var chip = ev.target.closest('[data-id]');
      if (chip) {
        var id = chip.getAttribute('data-id');
        openId = id;
        render();
        setTimeout(function () {
          var p = el.querySelector('.inf-tb-panel');
          if (p && p.scrollIntoView) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 30);
      }
    });
    el.addEventListener('input', function (ev) {
      var t = ev.target;
      if (!t.classList.contains('inf-tb-search') && !t.classList.contains('kh-lib-search')) return;
      q = t.value;
      openId = '';
      render();
    });
    render();
  }

  function makeApi(defaultBrand) {
    return {
      mountGlossary: function (el, opts) {
        opts = opts || {};
        if (!opts.brand && defaultBrand) opts.brand = defaultBrand;
        explorer(el, GLOSS_CATS, GLOSS_ITEMS, 'gloss', opts);
      },
      mountReadings: function (el, opts) {
        opts = opts || {};
        if (!opts.brand && defaultBrand) opts.brand = defaultBrand;
        explorer(el, READ_CATS, READ_ITEMS, 'read', opts);
      },
      cats: GLOSS_CATS,
      items: GLOSS_ITEMS
    };
  }

  // Infinity default brand; Kamuk API defaults to Kamuk lead (also path /kamuk/).
  global.InfinityRecursosLibrary = makeApi('infinity');
  global.KamukRecursosLibrary = makeApi('kamuk');
})(window);
