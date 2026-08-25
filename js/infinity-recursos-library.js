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

  var GLOSS_CATS = [
    { id: 'base', label: 'Fundamentos' },
    { id: 'pronouns', label: 'Pronombres' },
    { id: 'verbs', label: 'Verbos' },
    { id: 'tenses', label: 'Tiempos' },
    { id: 'prep', label: 'Preposiciones' },
    { id: 'articles', label: 'Artículos' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'metodo', label: 'Método' },
    { id: 'extra', label: 'Conectores' },
    { id: 'natural', label: 'Expresiones' },
    { id: 'phrasals', label: 'Phrasals' },
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
      return '<div class="inf-tb-panel kh-lib-panel"><p class="inf-tb-empty kh-lib-empty">Tocá una tarjeta (Email Formato E, Phone AMR, Método…). Abajo vas a ver la explicación completa y los ejemplos en inglés.</p></div>';
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
      + section('Cómo hacerlo en el desk', stepsHtml)
      + section('Formas, conjugaciones y para qué', formsHtml)
      + section('Ejemplos en inglés (estudiá y adaptá — no copies ciego)', exHtml)
      + section('Evitá / no hagas esto', avoidHtml)
      + '</div>';
  }

  var GLOSS_ITEMS = [
    // ── Fase 1 Arquitectura (Training Book completo) ──
    item("pronouns", "I / me / myself / my", "Yo", "Personal I · objeto me · reflexivo myself · posesivo my. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "you / you / yourself / your", "Tú / usted", "Singular. En plural: yourselves. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "he / him / himself / his", "Él", "Masculino singular. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "she / her / herself / her", "Ella", "Femenino singular. her = objeto y posesivo. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "it / it / itself / its", "Eso / esa", "Cosas, cuentas, sistemas. its sin apóstrofe. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "we / us / ourselves / our", "Nosotros", "Primera persona plural. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "you / you / yourselves / your", "Ustedes", "Plural. yourselves en reflexivo. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("pronouns", "they / them / themselves / their", "Ellos / ellas", "Personas o grupos. Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.", "I will call you today. Please stay with me while I look into your account myself.", "They asked us to confirm their identity. She called him about their statement.", {"why":"Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.","examples":["I reviewed the statement for you. Can you confirm the amount for me?","He said the charge was unauthorized. She asked us to look into it ourselves.","They want their card replaced. We will send it to them within five business days."]}),
    item("verbs", "To come — come / came / come", "venir", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I came the note after I had come the review.", "I will come the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I come / Past: I came / Participle: I have come.","Desk: After I had come the identity check, I came the next step to the client.","Speed: say the three forms out loud in under one second — come / came / come."]}),
    item("verbs", "To let — let / let / let", "dejar / permitir", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I let the note after I had let the review.", "I will let the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I let / Past: I let / Participle: I have let.","Desk: After I had let the identity check, I let the next step to the client.","Speed: say the three forms out loud in under one second — let / let / let."]}),
    item("verbs", "To go — go / went / gone", "ir", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I went the note after I had gone the review.", "I will go the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I go / Past: I went / Participle: I have gone.","Desk: After I had gone the identity check, I went the next step to the client.","Speed: say the three forms out loud in under one second — go / went / gone."]}),
    item("verbs", "To put — put / put / put", "poner", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I put the note after I had put the review.", "I will put the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I put / Past: I put / Participle: I have put.","Desk: After I had put the identity check, I put the next step to the client.","Speed: say the three forms out loud in under one second — put / put / put."]}),
    item("verbs", "To take — take / took / taken", "tomar / llevar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I took the note after I had taken the review.", "I will take the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I take / Past: I took / Participle: I have taken.","Desk: After I had taken the identity check, I took the next step to the client.","Speed: say the three forms out loud in under one second — take / took / taken."]}),
    item("verbs", "To give — give / gave / given", "dar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I gave the note after I had given the review.", "I will give the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I give / Past: I gave / Participle: I have given.","Desk: After I had given the identity check, I gave the next step to the client.","Speed: say the three forms out loud in under one second — give / gave / given."]}),
    item("verbs", "To get — get / got / gotten", "obtener / llegar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I got the note after I had gotten the review.", "I will get the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I get / Past: I got / Participle: I have gotten.","Desk: After I had gotten the identity check, I got the next step to the client.","Speed: say the three forms out loud in under one second — get / got / gotten."]}),
    item("verbs", "To keep — keep / kept / kept", "mantener / guardar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I kept the note after I had kept the review.", "I will keep the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I keep / Past: I kept / Participle: I have kept.","Desk: After I had kept the identity check, I kept the next step to the client.","Speed: say the three forms out loud in under one second — keep / kept / kept."]}),
    item("verbs", "To make — make / made / made", "hacer / crear", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I made the note after I had made the review.", "I will make the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I make / Past: I made / Participle: I have made.","Desk: After I had made the identity check, I made the next step to the client.","Speed: say the three forms out loud in under one second — make / made / made."]}),
    item("verbs", "To do — do / did / done", "hacer (acción)", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I did the note after I had done the review.", "I will do the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I do / Past: I did / Participle: I have done.","Desk: After I had done the identity check, I did the next step to the client.","Speed: say the three forms out loud in under one second — do / did / done."]}),
    item("verbs", "To say — say / said / said", "decir", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I said the note after I had said the review.", "I will say the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I say / Past: I said / Participle: I have said.","Desk: After I had said the identity check, I said the next step to the client.","Speed: say the three forms out loud in under one second — say / said / said."]}),
    item("verbs", "To see — see / saw / seen", "ver", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I saw the note after I had seen the review.", "I will see the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I see / Past: I saw / Participle: I have seen.","Desk: After I had seen the identity check, I saw the next step to the client.","Speed: say the three forms out loud in under one second — see / saw / seen."]}),
    item("verbs", "To send — send / sent / sent", "enviar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I sent the note after I had sent the review.", "I will send the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I send / Past: I sent / Participle: I have sent.","Desk: After I had sent the identity check, I sent the next step to the client.","Speed: say the three forms out loud in under one second — send / sent / sent."]}),
    item("verbs", "To be — be / was-were / been", "ser / estar", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I was-were the note after I had been the review.", "I will be the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I am / Past: I was-were / Participle: I have been.","Desk: After I had been the identity check, I was-were the next step to the client.","Speed: say the three forms out loud in under one second — be / was-were / been."]}),
    item("verbs", "To have — have / had / had", "tener / haber", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I had the note after I had had the review.", "I will have the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I have / Past: I had / Participle: I have had.","Desk: After I had had the identity check, I had the next step to the client.","Speed: say the three forms out loud in under one second — have / had / had."]}),
    item("verbs", "To seem — seem / seemed / seemed", "parecer", "Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.", "Yesterday I seemed the note after I had seemed the review.", "I will seem the client today before 4:30 p.m.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.","examples":["Present: I seem / Past: I seemed / Participle: I have seemed.","Desk: After I had seemed the identity check, I seemed the next step to the client.","Speed: say the three forms out loud in under one second — seem / seemed / seemed."]}),
    item("tenses", "will + verb", "Futuro real (-ré)", "Correré = I will run. Decisión o futuro real. Interruptor Nexus del Training Book Fase 1.", "I will call you today before 4:30 p.m. with the Operations outcome.", "I will activate the virtual card now so you can check in.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I will call you today before 4:30 p.m. with the Operations outcome.","I will activate the virtual card now so you can check in.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "would + verb", "Futuro hipotético (-ría)", "Correría = I would run. Condición / cortesía. Interruptor Nexus del Training Book Fase 1.", "I would rather verify identity than send a PIN by SMS.", "What would you like me to do first — block the card or file the dispute?", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I would rather verify identity than send a PIN by SMS.","What would you like me to do first — block the card or file the dispute?","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "have + participle", "Presente perfecto", "He corrido = I have run. Pasado que afecta ahora. Interruptor Nexus del Training Book Fase 1.", "I have reviewed Statements and I have documented Previous contacts.", "I have already escalated this to Operations.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I have reviewed Statements and I have documented Previous contacts.","I have already escalated this to Operations.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "had + participle", "Pasado perfecto", "Había corrido = I had run. Antes de otro pasado. Interruptor Nexus del Training Book Fase 1.", "When you called, I had already blocked the card.", "I had verified identity before I confirmed last six digits.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["When you called, I had already blocked the card.","I had verified identity before I confirmed last six digits.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "have been + -ing", "Perfecto continuo", "He estado corriendo. Empezó antes y sigue. Interruptor Nexus del Training Book Fase 1.", "I have been looking into the two postings on your statement.", "We have been waiting on Compliance since yesterday.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I have been looking into the two postings on your statement.","We have been waiting on Compliance since yesterday.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "am/is/are + -ing", "Presente continuo", "Acción en proceso ahora. Interruptor Nexus del Training Book Fase 1.", "I am reviewing your Card transactions right now.", "We are placing you on a brief hold to check Previous contacts.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I am reviewing your Card transactions right now.","We are placing you on a brief hold to check Previous contacts.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "simple past", "Pasado simple", "Hecho cerrado en el pasado. Interruptor Nexus del Training Book Fase 1.", "I reviewed the freeze flag and I escalated to Operations.", "The hotel declined the card at check-in yesterday.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I reviewed the freeze flag and I escalated to Operations.","The hotel declined the card at check-in yesterday.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("tenses", "ING vs TO", "Intención TO · actividad ING", "want/need → TO. enjoy/after prep → ING. Interruptor Nexus del Training Book Fase 1.", "I need to verify identity. I enjoy helping clients under pressure.", "After reviewing Statements, I want to escalate to Operations.", {"why":"El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).","examples":["I need to verify identity. I enjoy helping clients under pressure.","After reviewing Statements, I want to escalate to Operations.","Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…"]}),
    item("prep", "in", "en (ciudad / mes / year / inside)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I live in San José. The mismatch is in the date of birth.", "I opened a billing inquiry in the CRM.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I live in San José. The mismatch is in the date of birth.","I opened a billing inquiry in the CRM.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "on", "en (día / superficie / card)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "We meet on Monday. I put a travel notice on the card.", "The decline is on the Operating Account.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["We meet on Monday. I put a travel notice on the card.","The decline is on the Operating Account.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "at", "en (hora / lugar puntual)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "We meet at 5 p.m. The client is at the hotel desk.", "I will call you at noon tomorrow.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["We meet at 5 p.m. The client is at the hotel desk.","I will call you at noon tomorrow.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "for", "para / por (destinatario / duración)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I will call for you. Waiting for two business days.", "This email is for Marta.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I will call for you. Waiting for two business days.","This email is for Marta.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "to", "a / hacia (dirección / persona)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I escalated to Operations. Send the confirmation to me.", "I need to go to Statements.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I escalated to Operations. Send the confirmation to me.","I need to go to Statements.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "from", "de / desde", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "The window is counted from the statement date.", "A call from Lisbon triggered the decline.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["The window is counted from the statement date.","A call from Lisbon triggered the decline.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "with", "con", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I will follow up with Compliance today.", "Please stay with me on the recorded line.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I will follow up with Compliance today.","Please stay with me on the recorded line.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "about", "sobre / acerca de", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I am calling about the payroll freeze.", "Let me ask about the merchant contact.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I am calling about the payroll freeze.","Let me ask about the merchant contact.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "by", "para (deadline) / por (medio)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I will call you by 4:30 p.m. By policy, last six only after identity.", "Payment by wire is not allowed here.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I will call you by 4:30 p.m. By policy, last six only after identity.","Payment by wire is not allowed here.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "without", "sin", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I will not send the PIN without full identity.", "I cannot file without the booking confirmation.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I will not send the PIN without full identity.","I cannot file without the booking confirmation.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "after", "después de (+ ING / noun)", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "After reviewing Statements, I escalated.", "After identity, I can confirm last six.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["After reviewing Statements, I escalated.","After identity, I can confirm last six.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("prep", "before", "antes de", "Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.", "I will call you before 4:30 p.m.", "Before I disclose last six, identity must match.", {"why":"Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.","examples":["I will call you before 4:30 p.m.","Before I disclose last six, identity must match.","Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at."]}),
    item("articles", "a", "un/una (consonante)", "Artículo. a case number, a travel notice, a recorded line. a/an = no específico aún; the = ya identificado en el case.", "I opened a billing inquiry. The inquiry is now with Operations.", "There is an unauthorized charge on the statement. I blocked the card.", {"why":"Artículos correctos suenan a inglés de desk, no a traducción."}),
    item("articles", "an", "un/una (vocal sound)", "Artículo. an email, an open dispute, an unauthorized charge. a/an = no específico aún; the = ya identificado en el case.", "I opened a billing inquiry. The inquiry is now with Operations.", "There is an unauthorized charge on the statement. I blocked the card.", {"why":"Artículos correctos suenan a inglés de desk, no a traducción."}),
    item("articles", "the", "el/la (específico)", "Artículo. the Operating Account, the statement date, the client. a/an = no específico aún; the = ya identificado en el case.", "I opened a billing inquiry. The inquiry is now with Operations.", "There is an unauthorized charge on the statement. I blocked the card.", {"why":"Artículos correctos suenan a inglés de desk, no a traducción."}),
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
    item('extra', "and", "y", "Une dos ideas. No lo uses más de dos veces seguidas. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . And, I documented the note.", "Desk: use \"and\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "also", "también", "Agrega un segundo punto. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Also, I documented the note.", "Desk: use \"also\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "in addition", "además", "Formal: segundo hecho o acción. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . In addition, I set AA.", "Desk: use \"in addition\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: I blocked the card. In addition, I ordered a replacement and activated the virtual card.","Legal: I updated the docket. In addition, I notified opposing counsel by email.","Medical: I confirmed the referral. In addition, I sent the records to the specialist portal.","General: On top of that / In addition, I have to maintain a professional tone under pressure."]}),
    item('extra', "furthermore", "además / más aún", "Añadir con tono formal. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Furthermore, I documented the note.", "Desk: use \"furthermore\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: I verified identity. Furthermore, I documented the mismatch on the recorded line.","Legal: The complaint is timely. Furthermore, damages are supported by the invoices attached.","Medical: Vital signs are stable. Furthermore, the care plan was updated in the chart.","General: Furthermore, how you communicate is just as important as what you say."]}),
    item('extra', "as well", "también", "Al final de la frase: …as well. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . As well, I documented the note.", "Desk: use \"as well\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "not only that", "no solo eso", "Abre un segundo punto fuerte. Categoría Training Book: Añadir información. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Not only that, I documented the note.", "Desk: use \"not only that\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Añadir información). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "because", "porque", "Razón + cláusula completa. Categoría Training Book: Dar razón. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements because two ACH payments declined.", "Desk: use \"because\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar razón). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: I will not send the PIN because identity is incomplete on the recorded line.","Legal: We cannot file the motion today because the affidavit is still missing two exhibits.","Medical: I rescheduled the procedure because the pre-authorization was not on file.","General: I expanded my answer because one sentence is not a conversation — Idea plus linker plus Idea."]}),
    item('extra', "since", "ya que / puesto que", "Razón conocida. Categoría Training Book: Dar razón. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Since, I documented the note.", "Desk: use \"since\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar razón). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "due to", "debido a", "Solo antes de un sustantivo: due to the hold. Categoría Training Book: Dar razón. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Due to, I documented the note.", "Desk: use \"due to\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar razón). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "as", "como / ya que", "Razón corta. Categoría Training Book: Dar razón. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . As, I documented the note.", "Desk: use \"as\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar razón). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "given that", "dado que", "Razón formal de política. Categoría Training Book: Dar razón. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Given that, I documented the note.", "Desk: use \"given that\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar razón). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "so", "así que", "Resultado simple. Categoría Training Book: Dar resultado. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . So, I documented the note.", "Desk: use \"so\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar resultado). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "therefore", "por lo tanto", "Consecuencia formal. Categoría Training Book: Dar resultado. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements ; therefore Operations owns the restore.", "Desk: use \"therefore\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar resultado). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: There is no Lisbon travel notice; therefore I will file the correct one now.","Legal: Discovery closes Friday; therefore I will send the production list today before noon.","Medical: Labs are back and clear; therefore the physician can proceed with the follow-up visit.","General: Customer service is the backbone of the business; therefore tone matters as much as the fix."]}),
    item('extra', "as a result", "como resultado", "Outcome de la investigación. Categoría Training Book: Dar resultado. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . As a result, payroll is still blocked.", "Desk: use \"as a result\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar resultado). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: Chip-and-PIN was used; as a result this is not automatic unauthorized fraud.","Legal: The deadline was missed; as a result we must request an extension before close of business.","Medical: The prior auth expired; as a result the claim was denied pending resubmission.","General: I finished everything on time. As a result, I felt productive by the end of the day."]}),
    item('extra', "consequently", "en consecuencia", "Formal — una vez, no dump. Categoría Training Book: Dar resultado. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Consequently, I documented the note.", "Desk: use \"consequently\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar resultado). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "which means that", "lo cual significa que", "Consecuencia del hecho. Categoría Training Book: Dar resultado. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Which means that, I documented the note.", "Desk: use \"which means that\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Dar resultado). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: The descriptors say DEPOSIT then BALANCE, which means that this is not a duplicate charge.","Legal: Venue lies in federal court, which means that we remove before the answer deadline.","Medical: The referral is out of network, which means that higher cost-sharing may apply.","General: I work in customer service, which means that I speak English every day under pressure."]}),
    item('extra', "but", "pero", "Contraste básico. Alterná con however. Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . But, I documented the note.", "Desk: use \"but\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "however", "sin embargo", "Contraste profesional (nueva frase + coma). Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements ; however, I will not lift every control.", "Desk: use \"however\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: I hear the urgency; however, I cannot wire money to an unverified WhatsApp agency.","Legal: The client wants an immediate filing; however, conflict check is still pending.","Medical: The symptoms sound urgent; however, I must verify insurance before I confirm the slot.","General: I worked yesterday because I had a key meeting; however, it did not go as expected."]}),
    item('extra', "even though", "aunque / aun cuando", "Concede un hecho y mantenés la policy. Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Even though, I documented the note.", "Desk: use \"even though\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "although", "aunque", "Contraste dentro de una oración. No “although… but”. Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Although the card is Active, the account is Restricted.", "Desk: use \"although\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: Although the Obsidian card is Active, the Operating Account is Restricted.","Legal: Although the client is upset, we still need a signed engagement letter.","Medical: Although the patient is in pain, controlled substances require a verified prescription.","General: Although it can be challenging, I keep a professional tone when clients speak fast."]}),
    item('extra', "nevertheless", "no obstante", "Concede y seguís. Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Nevertheless, I documented the note.", "Desk: use \"nevertheless\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: The prior note says ID OK; nevertheless, date of birth does not match today.","Legal: The facts favor us; nevertheless, we must disclose adverse authority.","Medical: The patient prefers a walk-in; nevertheless, triage still requires a nurse assessment.","General: My performance was disappointing. Nevertheless, that experience built resilience."]}),
    item('extra', "despite this", "a pesar de esto", "Después de un hecho difícil. Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Despite this, I documented the note.", "Desk: use \"despite this\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "on the other hand", "por el otro lado", "Segunda cara del case (oficial: on the other hand). Categoría Training Book: Contrastar. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . On the other hand, I will not keep both credits open.", "Desk: use \"on the other hand\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Contrastar). Sin conectores, las ideas quedan sueltas y fallan nesting.","examples":["Banking: The client wants both credits; on the other hand, that creates a double-credit risk.","Legal: Settlement is faster; on the other hand, trial preserves the full claim value.","Medical: An earlier slot is available; on the other hand, the specialist of record is only free Thursday.","General: Speed matters; on the other hand, clarity without structure is still a fail."]}),
    item('extra', "first", "primero", "Orden de pasos. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . First I verified identity.", "Desk: use \"first\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "then", "después", "Siguiente paso. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Then I escalated to Operations.", "Desk: use \"then\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "after that", "después de eso", "Secuencia oral/escrita. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . After that, I documented the note.", "Desk: use \"after that\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "finally", "finalmente", "Cierre de secuencia. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Finally, I documented the note.", "Desk: use \"finally\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "eventually", "al final / con el tiempo", "Resultado tras proceso. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Eventually, I documented the note.", "Desk: use \"eventually\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
    item('extra', "subsequently", "posteriormente", "Formal: después en el proceso. Categoría Training Book: Secuencia. Usalo en Idea → Linker → Idea (Fase 2).", "I reviewed Statements . Subsequently, I documented the note.", "Desk: use \"subsequently\" to connect evidence → action without isolated sentences.", {"why":"Linker del Training Book (Secuencia). Sin conectores, las ideas quedan sueltas y fallan nesting."}),
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
    // ── Phrasals (TB + desk + quiz bank) ──
    item('phrasals', "look into", "investigar", "Inseparable: look into it. Empezá evidencia en el CRM.", "I will look into the case with evidence from Statements.", "Desk English: \"look into\" — investigar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "sort out", "resolver", "Separable: sort it out. Problema que vos podés cerrar.", "I will sort out the case with evidence from Statements.", "Desk English: \"sort out\" — resolver.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "follow up", "dar seguimiento", "follow up with someone / on something + hora.", "I will follow up the case with evidence from Statements.", "Desk English: \"follow up\" — dar seguimiento.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "hand off", "pasar el caso", "Escalar con dueño nombrado, no dump.", "I will hand off the case with evidence from Statements.", "Desk English: \"hand off\" — pasar el caso.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "write up", "documentar", "Nota audit-ready: evidencia + acción + hora.", "I will write up the case with evidence from Statements.", "Desk English: \"write up\" — documentar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "write down", "anotar", "Escribí el case number / monto.", "I will write down the case with evidence from Statements.", "Desk English: \"write down\" — anotar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "find out", "averiguar / descubrir", "Confirmá un dato en el CRM.", "I will find out the case with evidence from Statements.", "Desk English: \"find out\" — averiguar / descubrir.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "figure out", "entender / resolver cómo", "Encontrá el path seguro.", "I will figure out the case with evidence from Statements.", "Desk English: \"figure out\" — entender / resolver cómo.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "call back", "devolver la llamada", "I will call you back today before 4:30 p.m.", "I will call back the case with evidence from Statements.", "Desk English: \"call back\" — devolver la llamada.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "hold on", "esperá en línea", "Keep the client: hold on while I look into…", "I will hold on the case with evidence from Statements.", "Desk English: \"hold on\" — esperá en línea.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "hang up", "colgar", "No cuelgues sin callback timed.", "I will hang up the case with evidence from Statements.", "Desk English: \"hang up\" — colgar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "put through", "transferir (llamada)", "put you through to a supervisor — con ownership.", "I will put through the case with evidence from Statements.", "Desk English: \"put through\" — transferir (llamada).", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "fill out", "llenar (formulario)", "fill out the dispute form / identity fields.", "I will fill out the case with evidence from Statements.", "Desk English: \"fill out\" — llenar (formulario).", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "check on", "revisar el estado de", "check on the restore / the case.", "I will check on the case with evidence from Statements.", "Desk English: \"check on\" — revisar el estado de.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "turn down", "rechazar", "I cannot turn down policy for a PIN by SMS.", "I will turn down the case with evidence from Statements.", "Desk English: \"turn down\" — rechazar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "pick up", "retomar / contestar", "pick up where we left off / pick up the call.", "I will pick up the case with evidence from Statements.", "Desk English: \"pick up\" — retomar / contestar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "bring up", "mencionar un tema", "May I bring up the travel notice?", "I will bring up the case with evidence from Statements.", "Desk English: \"bring up\" — mencionar un tema.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "carry on", "continuar", "Please carry on with your answer.", "I will carry on the case with evidence from Statements.", "Desk English: \"carry on\" — continuar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "give up", "rendirse", "No te rindás: reformulá. En desk: no “I give up”.", "I will give up the case with evidence from Statements.", "Desk English: \"give up\" — rendirse.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "run out of", "quedarse sin", "run out of time / available balance.", "I will run out of the case with evidence from Statements.", "Desk English: \"run out of\" — quedarse sin.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "look after", "cuidar / encargarse", "I will look after this case today.", "I will look after the case with evidence from Statements.", "Desk English: \"look after\" — cuidar / encargarse.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "wake up", "despertarse", "Phrasal TB básico (Fase 3 naturalidad).", "I will wake up the case with evidence from Statements.", "Desk English: \"wake up\" — despertarse.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "turn off", "apagar / desactivar", "turn off a control only after evidence.", "I will turn off the case with evidence from Statements.", "Desk English: \"turn off\" — apagar / desactivar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "drop off", "dejar / entregar", "drop off documents / replacement card pickup.", "I will drop off the case with evidence from Statements.", "Desk English: \"drop off\" — dejar / entregar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "call off", "cancelar", "call off an incorrect dispute path.", "I will call off the case with evidence from Statements.", "Desk English: \"call off\" — cancelar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "send over", "enviar (archivo)", "send over the booking confirmation.", "I will send over the case with evidence from Statements.", "Desk English: \"send over\" — enviar (archivo).", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "go down", "caerse (sistema)", "the system went down — set PSA.", "I will go down the case with evidence from Statements.", "Desk English: \"go down\" — caerse (sistema).", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "put off", "posponer", "Do not put off identity on a recorded line.", "I will put off the case with evidence from Statements.", "Desk English: \"put off\" — posponer.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "take off", "despegar / quitar", "flight takes off; take off a block only if confirmed.", "I will take off the case with evidence from Statements.", "Desk English: \"take off\" — despegar / quitar.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    item('phrasals', "come across", "encontrarse con", "I came across a Paris notice, not Lisbon.", "I will come across the case with evidence from Statements.", "Desk English: \"come across\" — encontrarse con.", {"why":"Phrasal del Training Book / desk. Usalo en nesting, no solo en vocabulario aislado."}),
    // ── Prefijos (lista Training Book Fase 3) ──
    item('affix', "un-", "negación", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: happy → unhappy. En el desk: unauthorized, unverified, unresolved, incomplete.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "dis-", "contrario", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: agree → disagree. En el desk: dispute, disconnect, disagree.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "mis-", "error", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: understand → misunderstand. En el desk: mismatch, misread, misunderstand.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "re-", "repetir", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: do → redo. En el desk: review, replace, reopen, restore.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "over-", "exceso", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: react → overreact. En el desk: overdraft, overbooked, overcharge.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "under-", "insuficiente", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: estimate → underestimate. En el desk: underwriting, underpaid, under review.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "in- / non-", "no / fuera de regla", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: eligible → ineligible. En el desk: ineligible, incomplete, non-compliant.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    item('affix', "pre-", "antes", "Prefijo del Training Book (Fase 3): cambia el SIGNIFICADO. Base: pay → prepay. En el desk: previous contacts, prepaid, pre-authorized.", "The dispute is ineligible because the reporting window closed.", "Identity is incomplete / the third party is unverified.", {"why":"Regla TB: Prefijo → cambia el significado. Usalo en nesting y en familias (authorize → unauthorized).","steps":["Aprendé el prefijo + significado.","Formá la palabra del case (unauthorized, ineligible…).","Usala en una frase con evidencia."]}),
    // ── Sufijos (lista Training Book Fase 3) ──
    item('suffix', "-ness", "adjetivo → sustantivo", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. happy → happiness. Desk: awareness, completeness.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-ment", "verbo → sustantivo", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. develop → development. Desk: replacement, payment, document.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-tion / -ation", "verbo → sustantivo", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. authorize → authorization. Desk: verification, activation, investigation.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-ful", "sustantivo → adjetivo", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. stress → stressful. Desk: helpful, useful.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-less", "sustantivo → adjetivo (sin)", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. hope → hopeless. Desk: cashless, regardless.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-able", "verbo → adjetivo (posible)", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. manage → manageable. Desk: available, payable, eligible.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-ly", "adjetivo → adverbio", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. quick → quickly. Desk: immediately, currently, professionally.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
    item('suffix', "-er / -or", "verbo → persona/agente", "Sufijo del Training Book (Fase 3): cambia la FUNCIÓN gramatical. supervise → supervisor. Desk: customer, processor.", "I completed verification. Next: replacement and activation of the virtual card.", "I need authorization from a supervisor for goodwill.", {"why":"Regla TB: Sufijo → cambia la función. authorize → authorization → unauthorized (prefijo+sufijo).","steps":["Identificá el verbo/adjetivo base.","Agregá el sufijo correcto.","Usalo en E3/E4 del correo o en la nota AMR."]}),
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
    return 'Empezá por Pronombres, Verbos, Tiempos y Preposiciones (Fase 1). Después Fundamentos del desk, Conectores, Expresiones y Phrasals. Todo del Training Book completo — sin recortes — para el desk de ' + desk + '.';
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
      cat = 'pronouns';
      var first = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].cat === 'pronouns') { first = items[i]; break; }
      }
      if (first) openId = first._id;
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
