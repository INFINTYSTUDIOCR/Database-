/**
 * Broaden Fase 1 grammar examples + language e-learn modules (no bank/health acronym focus).
 */
import { readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';

// ── Glossary architecture (pronouns → articles) ──
{
  const path = 'js/infinity-recursos-library.js';
  let s = readFileSync(path, 'utf8');

  s = s.replace(
    'Tocá una tarjeta (Email Formato E, Phone AMR, Método…). Abajo vas a ver la explicación completa y los ejemplos en inglés.',
    'Tocá una tarjeta. Abajo vas a ver la explicación completa y ejemplos en inglés amplio (vida, estudio, trabajo cotidiano).'
  );
  s = s.replace(
    "placeholder=\"' + (kind === 'gloss' ? 'Buscá: Encabezado, AMR, however, PIN, AA…' : 'Buscá: Burns, BBC Scotland, Austen…') + '\"",
    "placeholder=\"' + (kind === 'gloss' ? 'Buscá: however, -tion, look into, will, because…' : 'Buscá: Burns, BBC Scotland, Austen…') + '\""
  );

  const arch = `    // ── Fase 1 Arquitectura (Training Book — inglés amplio) ──
    item("pronouns", "I / me / myself / my", "Yo", "Personal I · objeto me · reflexivo myself · posesivo my. Automatizá la tabla en menos de 1 segundo.", "I will call you today. Please stay with me while I finish this myself.", "She asked me to help her with her notes.", {"why":"Sin pronombres automáticos no hay velocidad al hablar.","examples":["Can you help me with my homework?","I made this cake myself.","They invited us to their house."]}),
    item("pronouns", "you / you / yourself / your", "Tú / usted", "Singular. En plural: yourselves.", "You should trust yourself more when you speak.", "Is this your book or mine?", {"why":"you / your / yourself.","examples":["Did you enjoy yourself at the party?","Please introduce yourself.","Is that your bag?"]} ),
    item("pronouns", "he / him / himself / his", "Él", "Masculino singular.", "He taught himself to play the guitar.", "I gave him his ticket.", {"why":"he / him / his / himself.","examples":["He finished his essay himself.","Tell him the meeting is at five.","His idea was clear."]}),
    item("pronouns", "she / her / herself / her", "Ella", "Femenino singular. her = objeto y posesivo.", "She prepared herself before the interview.", "I called her about her trip.", {"why":"she / her / herself.","examples":["She wrote the letter herself.","Please give her these notes.","Her English improves every week."]}),
    item("pronouns", "it / it / itself / its", "Eso / esa", "Cosas, ideas, animales neutros. its sin apóstrofe.", "The city is famous for its parks.", "The machine turned itself off.", {"why":"it / its / itself.","examples":["I like this café — it is quiet.","The dog scratched itself.","The company changed its name."]}),
    item("pronouns", "we / us / ourselves / our", "Nosotros", "Primera persona plural.", "We organized the event ourselves.", "They thanked us for our help.", {"why":"we / us / our / ourselves.","examples":["We enjoyed ourselves at the festival.","Come with us.","Our plan is simple."]}),
    item("pronouns", "you / you / yourselves / your", "Ustedes", "Plural. yourselves en reflexivo.", "Please help yourselves to some fruit.", "Did you all bring your passports?", {"why":"Plural you / yourselves.","examples":["Enjoy yourselves.","Are these your seats?","You can decide for yourselves."]}),
    item("pronouns", "they / them / themselves / their", "Ellos / ellas", "Personas o grupos.", "They built the project themselves.", "I asked them about their plans.", {"why":"they / them / their / themselves.","examples":["They finished their homework early.","Listen to them carefully.","The students organized themselves into pairs."]}),
`;

  // Replace from Fase 1 marker through articles (before base AMR)
  const a0 = s.indexOf('    // ── Fase 1 Arquitectura');
  const a1 = s.indexOf("    item('base'");
  if (a0 < 0 || a1 < 0) {
    console.error('arch markers', a0, a1);
  } else {
    // Keep verbs/tenses/prep/articles - replace whole arch section with full broad content
    const verbs = [
      ['come / came / come', 'venir'],
      ['let / let / let', 'dejar / permitir'],
      ['go / went / gone', 'ir'],
      ['put / put / put', 'poner'],
      ['take / took / taken', 'tomar / llevar'],
      ['give / gave / given', 'dar'],
      ['get / got / gotten', 'obtener / llegar'],
      ['keep / kept / kept', 'mantener / guardar'],
      ['make / made / made', 'hacer / crear'],
      ['do / did / done', 'hacer (acción)'],
      ['say / said / said', 'decir'],
      ['see / saw / seen', 'ver'],
      ['send / sent / sent', 'enviar'],
      ['be / was-were / been', 'ser / estar'],
      ['have / had / had', 'tener / haber'],
      ['seem / seemed / seemed', 'parecer']
    ];
    let verbItems = '';
    for (const [en, es] of verbs) {
      const [inf, past, part] = en.split(' / ');
      const present = inf === 'be' ? 'am/is/are' : inf === 'have' ? 'have' : inf;
      verbItems += `    item("verbs", "To ${inf} — ${en}", ${JSON.stringify(es)}, "Verbo irregular (16 obligatorios). Presente / pasado / participio en menos de 1 segundo.", "Yesterday I ${past} home after I had ${part} my work.", "I will ${inf} early tomorrow.", {"why":"Los 16 irregulares son cimiento. Si tardás más de 1 segundo, repetí hasta automatizar.","examples":["Present: I ${present} · Past: I ${past} · Participle: I have ${part}.","I ${past} the message and then I left.","Say the three forms out loud in under one second: ${en}."]}),\n`;
    }

    const mid = `
    item("tenses", "will + verb", "Futuro real (-ré)", "Correré = I will run. Decisión o futuro real.", "I will call you tomorrow morning.", "I will finish this chapter tonight.", {"why":"Interruptor: -ré en español → will.","examples":["I will travel next year.","She will explain the rule again.","We will meet at the library."]}),
    item("tenses", "would + verb", "Futuro hipotético (-ría)", "Correría = I would run. Condición / cortesía.", "I would rather practice now than rush later.", "What would you like to improve first?", {"why":"Interruptor: -ría → would.","examples":["I would go if I had time.","Would you help me with this sentence?","He would feel better after a break."]}),
    item("tenses", "have + participle", "Presente perfecto", "He corrido = I have run. Pasado que afecta ahora.", "I have already finished the exercise.", "She has lived here for three years.", {"why":"have + participio.","examples":["I have seen that movie.","We have started a new habit.","Have you eaten yet?"]} ),
    item("tenses", "had + participle", "Pasado perfecto", "Había corrido = I had run. Antes de otro pasado.", "When you called, I had already left.", "I had studied the list before the quiz.", {"why":"had + participio.","examples":["She had packed before the taxi arrived.","They had met once before.","I had never tried that food."]}),
    item("tenses", "have been + -ing", "Perfecto continuo", "He estado corriendo. Empezó antes y sigue.", "I have been practicing English every morning.", "We have been waiting for twenty minutes.", {"why":"have been + -ing.","examples":["She has been learning French this year.","It has been raining all day.","I have been reading a short novel."]}),
    item("tenses", "am/is/are + -ing", "Presente continuo", "Acción en proceso ahora.", "I am writing three connected sentences.", "They are preparing dinner.", {"why":"be + -ing.","examples":["She is studying in the kitchen.","We are listening carefully.","Are you coming with us?"]} ),
    item("tenses", "simple past", "Pasado simple", "Hecho cerrado en el pasado.", "I visited my aunt yesterday.", "They watched a documentary last night.", {"why":"Pasado cerrado.","examples":["He cooked pasta on Sunday.","We traveled in July.","She called me twice."]}),
    item("tenses", "ING vs TO", "Intención TO · actividad ING", "want/need → TO. enjoy / after preposition → ING.", "I need to practice. I enjoy practicing with music.", "After finishing the draft, I want to rest.", {"why":"TO = dirección/intención · ING = actividad.","examples":["I want to improve.","I enjoy reading.","After studying, I went for a walk."]}),
    item("prep", "in", "en (ciudad / mes / year / inside)", "I live in San José. We met in March. The keys are in the bag.", "She studied in Scotland for a year.", {"why":"in = dentro / periodos largos.","examples":["I work in an office.","He was born in 1998.","The milk is in the fridge."]}),
    item("prep", "on", "en (día / superficie)", "We meet on Monday. The book is on the table.", "I put a note on the door.", {"why":"on = días y superficies.","examples":["See you on Friday.","The picture is on the wall.","She left her phone on the couch."]}),
    item("prep", "at", "en (hora / lugar puntual)", "We meet at 5 p.m. She is at the station.", "I will call you at noon.", {"why":"at = hora y punto.","examples":["I am at home.","The class starts at nine.","Meet me at the entrance."]}),
    item("prep", "for", "para / por (destinatario / duración)", "This gift is for you. I waited for two hours.", "She studied for the exam all week.", {"why":"for = destinatario o duración.","examples":["I bought tickets for my parents.","He lived there for six months.","Thanks for your help."]}),
    item("prep", "to", "a / hacia", "I go to school by bus. Send the file to me.", "She moved to another city.", {"why":"to = dirección.","examples":["Walk to the corner.","Talk to your partner.","I need to go to the store."]}),
    item("prep", "from", "de / desde", "I am from Costa Rica. Count from one to ten.", "A call from Lisbon woke me up.", {"why":"from = origen.","examples":["This letter is from my sister.","We traveled from north to south.","Take the book from the shelf."]}),
    item("prep", "with", "con", "I will go with you. Coffee with milk, please.", "She works with a small team.", {"why":"with = compañía / instrumento.","examples":["Stay with me.","Cut it with a knife.","I agree with that idea."]}),
    item("prep", "about", "sobre / acerca de", "We talked about the movie. Tell me about your day.", "I am calling about the schedule.", {"why":"about = tema.","examples":["A book about travel.","Do not worry about small mistakes.","What is this song about?"]} ),
    item("prep", "by", "para (deadline) / por (medio)", "I will finish by Friday. We went by train.", "Send it by email.", {"why":"by = plazo o medio.","examples":["Be here by noon.","She learned by listening.","The letter arrived by courier."]}),
    item("prep", "without", "sin", "I cannot decide without more information.", "He left without saying goodbye.", {"why":"without = sin.","examples":["Do not leave without your keys.","Coffee without sugar.","She spoke without fear."]}),
    item("prep", "after", "después de", "After reviewing the notes, I slept well.", "After dinner we walked.", {"why":"after + noun / -ing.","examples":["After class, call me.","After reading, write three sentences.","We met after the concert."]}),
    item("prep", "before", "antes de", "I will call you before noon.", "Before you send it, check spelling.", {"why":"before + noun / clause.","examples":["Wash your hands before eating.","Think before you answer.","Arrive before eight."]}),
    item("articles", "a", "un/una (consonante)", "a book, a useful tip, a university (sonido /ju/). a/an = no específico aún.", "I need a pen and a notebook.", "She found a quiet café near the park.", {"why":"a = sonido consonante.","examples":["a day, a week, a friend","I saw a bird on the roof.","He shared a clear example."]}),
    item("articles", "an", "un/una (vocal sound)", "an apple, an hour (/aʊ/), an email. Depende del SONIDO, no solo de la letra.", "I ate an apple. She waited an hour.", "That was an honest answer.", {"why":"an = sonido vocal.","examples":["an idea, an open window","an easy exercise","an unexpected result."]}),
    item("articles", "the", "el/la (específico)", "the sun, the book on the table (ya identificado).", "Please close the door. The idea we discussed is good.", "I returned the book to the library.", {"why":"the = específico / único / ya mencionado.","examples":["the Internet, the moon","Pass me the salt.","The students in this room are ready."]}),
`;

    // Fix accidental spaces in `} ),` from arch template
    const fullArch = (arch + verbItems + mid).replace(/\}\s*\),/g, '}),');
    s = s.slice(0, a0) + fullArch + '\n' + s.slice(a1);
    writeFileSync(path, s);
    console.log('arch broadened');
  }
}

// ── E-learn modules: rewrite linkers/affixes/phrasals leads to broad English ──
{
  for (const path of ['js/simulation-corporate-learn.js', 'kamuk/js/simulation-corporate-learn.js']) {
    let s = readFileSync(path, 'utf8');
    s = s.replace(
      "lead: 'Training Book Fase 2: Idea → Linker → Idea. Sin conectores, las ideas quedan sueltas y fallan nesting (E3 del correo y discurso oral).'",
      "lead: 'Training Book Fase 2: Idea → Linker → Idea. Inglés amplio — conversación, estudio y escritura. Sin conectores, las ideas quedan sueltas.'"
    );
    s = s.replace(
      "'En el desk: nesting en E3 Explicación (mín. 2 conectores + 1 método linker)'",
      "'En cualquier texto o monólogo: mínimo 2–3 conectores de categorías distintas'"
    );
    s = s.replace(
      /\{ id: 'p1',\s*q: 'Cliente: payroll bloqueado\. Mejor nesting\?',[\s\S]*?why: 'Idea → linker \(because\) → Idea → linker \(however\) → owned next step\.'\s*\},/,
      `{ id: 'p1',
          q: 'Querés expandir “I studied yesterday.” ¿Cuál es mejor nesting?',
          options: [
            { t: '“I studied yesterday because I had an exam. However, I still reviewed in the morning.”', ok: true },
            { t: '“I studied. I reviewed. I slept.”', ok: false },
            { t: '“And and and I studied.”', ok: false }
          ],
          why: 'Idea → linker → Idea → linker → Idea.'
        },`
    );
    s = s.replace(
      "{ id: 'q5', q: 'En Formato E, nesting vive sobre todo en…', options: ['E3 Explicación (2 conectores + 1 método).', 'Solo E1 Encabezado.', 'Solo el subject.'], answer: 0, why: 'E3.' }",
      "{ id: 'q5', q: 'Nesting bien hecho significa…', options: ['Ideas conectadas con linkers, no oraciones sueltas.', 'Solo una palabra por respuesta.', 'Solo listas sin verbos.'], answer: 0, why: 'Idea + linker + Idea.' }"
    );
    s = s.replace(
      "lead: 'Training Book Fase 3: prefijo cambia el SIGNIFICADO; sufijo cambia la FUNCIÓN gramatical. Familias de palabras para nesting natural.'",
      "lead: 'Training Book Fase 3: prefijo cambia el SIGNIFICADO; sufijo cambia la FUNCIÓN gramatical. Inglés amplio — familias de palabras para sonar natural.'"
    );
    s = s.replace(
      /'un- \/ in- \/ non-: unauthorized, incomplete, ineligible, non-compliant'/,
      "'un- / in- / non-: unhappy, incomplete, incorrect, nonsense'"
    );
    s = s.replace(
      /'dis-: disagree, disconnect, dispute'/,
      "'dis-: disagree, disappear, disconnect'"
    );
    s = s.replace(
      /'mis-: mismatch, misunderstand, misread'/,
      "'mis-: misunderstand, misspell, misplace'"
    );
    s = s.replace(
      /'re-: review, replace, reopen, restore'/,
      "'re-: rewrite, reread, review, rebuild'"
    );
    s = s.replace(
      /'over- \/ under-: overdraft, overcharge, underestimate, under review'/,
      "'over- / under-: overreact, overcook, underestimate, underground'"
    );
    s = s.replace(
      /'pre-: previous contacts, prepaid, pre-authorized'/,
      "'pre-: preheat, preview, prepaid, prearranged'"
    );
    s = s.replace(
      /'-tion \/ -ation: authorize → authorization; verification, escalation'/,
      "'-tion / -ation: educate → education; inform → information; create → creation'"
    );
    s = s.replace(
      /'“I need authorization from a supervisor\.”'/,
      "'“Thank you for the information — it was clear.”'"
    );
    s = s.replace(
      /'“The charge looks unauthorized\.”'/,
      "'“Education opens options you cannot see yet.”'"
    );
    s = s.replace(
      /'“I completed verification before disclosure\.”'/,
      "'“Communication improves when we nest ideas.”'"
    );
    s = s.replace(
      /\{ id: 'p1',\s*q: 'Cargo no autorizado — mejor forma…',[\s\S]*?why: 'un- \+ authorize \(\+ -ed\) = unauthorized\.'\s*\},/,
      `{ id: 'p1',
          q: 'happy + un- →',
          options: [
            { t: 'unhappy', ok: true },
            { t: 'happinessly', ok: false },
            { t: 'overhappy', ok: false }
          ],
          why: 'un- niega el adjetivo.'
        },`
    );
    s = s.replace(
      "{ id: 'q2', q: 'ineligible usa…', options: ['in- (negación / fuera de regla)', 're-', '-ly'], answer: 0, why: 'in- + eligible.' }",
      "{ id: 'q2', q: 'incomplete usa…', options: ['in- (negación)', 're-', '-ly'], answer: 0, why: 'in- + complete.' }"
    );
    s = s.replace(
      "{ id: 'q4', q: 'Mejor desk line…', options: ['“Identity is incomplete; the third party is unverified.”', '“Identity is complete-less.”', '“I overagree the client.”'], answer: 0, why: 'incomplete / unverified.' }",
      "{ id: 'q4', q: 'Mejor frase natural…', options: ['“My notes are still incomplete.”', '“Identity is complete-less.”', '“I overagree the idea.”'], answer: 0, why: 'incomplete.' }"
    );
    s = s.replace(
      "lead: 'Training Book Fase 3 / desk: phrasals naturales en nesting — look into, follow up, sort out — no solo vocabulario aislado.'",
      "lead: 'Training Book Fase 3: phrasals naturales en nesting — look into, follow up, sort out — inglés de vida diaria y trabajo, no solo listas sueltas.'"
    );
    s = s.replace(
      /\{ id: 'p1',\s*q: 'Cliente pide que investigues el cargo\. Mejor línea…',[\s\S]*?why: 'look into \+ follow up \+ timed next step\.'\s*\},/,
      `{ id: 'p1',
          q: 'Querés investigar un retraso. Mejor línea…',
          options: [
            { t: '“I will look into the delay and follow up with you tomorrow morning.”', ok: true },
            { t: '“I will hang up now.”', ok: false },
            { t: '“I give up.”', ok: false }
          ],
          why: 'look into + follow up.'
        },`
    );
    s = s.replace(
      /\{ id: 'p3',\s*q: 'Cliente pide PIN por SMS\. Mejor phrasal de rechazo…',[\s\S]*?why: 'turn down = reject unsafe ask\.'\s*\},/,
      `{ id: 'p3',
          q: 'Te invitan a una fiesta pero estás ocupado. Mejor…',
          options: [
            { t: '“I must turn down the invitation because I already have plans.”', ok: true },
            { t: '“I will hang up without a callback.”', ok: false },
            { t: '“I give up on weekends.”', ok: false }
          ],
          why: 'turn down = rechazar.'
        },`
    );
    s = s.replace(
      "{ id: 'q1', q: 'follow up en desk debe incluir…', options: ['Con quién/qué + hora observable.', 'Solo “later”.', 'El PIN del cliente.'], answer: 0, why: 'Timed ownership.' }",
      "{ id: 'q1', q: 'follow up claro incluye…', options: ['Con quién/qué + cuándo.', 'Solo “later”.', 'Nada — solo silence.'], answer: 0, why: 'Seguimiento concreto.' }"
    );
    s = s.replace(
      "{ id: 'q3', q: 'hand off correcto…', options: ['Pasar el caso con dueño nombrado y contexto.', 'Dump sin nota.', 'Pedir OTP al cliente para “probar”.'], answer: 0, why: 'Owned escalation.' }",
      "{ id: 'q3', q: 'hand off correcto…', options: ['Pasar la tarea con contexto claro.', 'Abandonar sin explicación.', 'Borrar el archivo y callar.'], answer: 0, why: 'Transferencia con contexto.' }"
    );
    s = s.replace(
      "{ id: 'q4', q: 'Mejor cierre oral…', options: ['“I will call you back today before 4:30 p.m.”', '“I will hang up; figure it out yourself.”', '“I give up on this case.”'], answer: 0, why: 'call back + time.' }",
      "{ id: 'q4', q: 'Mejor cierre oral…', options: ['“I will call you back after lunch.”', '“I will hang up; figure it out yourself.”', '“I give up.”'], answer: 0, why: 'call back.' }"
    );
    writeFileSync(path, s);
    console.log('elearn patched', path);
  }
}

for (const p of ['js/infinity-recursos-library.js', 'js/simulation-corporate-learn.js', 'kamuk/js/simulation-corporate-learn.js']) {
  const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
  console.log(p, r.status === 0 ? 'ok' : r.stderr);
}
