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
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'metodo', label: 'Método' },
    { id: 'natural', label: 'Expresiones' },
    { id: 'extra', label: 'Conectores' },
    { id: 'phrasals', label: 'Phrasals' },
    { id: 'affix', label: 'Prefijos' },
    { id: 'tech', label: 'Technicismos' },
    { id: 'slang', label: 'Slang' },
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
    item('phone', 'AMR Acknowledge', 'Acknowledge',
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
    item('phone', 'AMR Mirror', 'Mirror',
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
    item('phone', 'AMR Respond', 'Respond',
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
    item('natural', 'the thing is / the thing is that', 'el asunto es que / lo que pasa es que', 'Inglés natural del método. Sirve para enfocar UNA restricción antes de la acción. No es grosería.', 'The thing is that I cannot send a PIN by SMS.', 'The thing is, the reporting window is counted from the statement date.', [
      'Presente: the thing is / the thing is that…',
      'Pasado: the thing was / the thing was that…',
      'Futuro: preferí the next step is… (the thing will be that es raro)',
      'Para qué: meter el problema real sin pelear. Luego nombrás la acción segura.'
    ]),
    item('natural', 'what happened was / what happens is that', 'lo que pasó fue / lo que pasa es que', 'Contás el mecanismo o el evento. Presente = regla del sistema. Pasado = el hecho de ESTE caso.', 'What happens is that a deposit plus a balance is not a duplicate charge.', 'What happened was the hotel MCC block fired because there was no Lisbon notice.', [
      'Presente (regla): what happens is that…',
      'Pasado (este caso): what happened was… / what happened is…',
      'Pasado perfecto: what had happened was… (contacto previo)',
      'Futuro: what will happen is that… (próximo paso del proceso)',
      'Pregunta: what happened? When was that?',
      'Para qué: explicar sin culpar. Luego evidencia + next step.'
    ]),
    item('natural', 'here’s the thing / the point is', 'el punto es / mira, el tema es', 'Misma familia que the thing is. El punto es = la decisión. Here’s the thing = voy a ser directo.', 'Here’s the thing: I can activate the virtual card today.', 'The point is I need identity on the recorded line before last 6.'),
    item('natural', 'what I mean is / I mean', 'lo que quiero decir es', 'Reformulá si el cliente no entendió. No lo uses para rellenar.', 'What I mean is last 6 only — never the PIN.', 'I mean the dispute must be withdrawn because the refund already posted.'),
    item('natural', 'actually', 'en realidad / de hecho', 'Corregí un dato del CRM o del cliente sin pelear.', 'Actually, the notice on file is Paris, not Lisbon.', 'Actually, those two postings are deposit and balance.'),
    item('natural', 'on top of that', 'encima de eso / además', 'Segundo hecho, tono natural (semana 4 Nexus).', 'There is no Lisbon notice. On top of that, a hotel MCC block is still on.', 'The refund posted. On top of that, an open dispute is still live.'),
    item('natural', 'to be honest', 'con franqueza', 'Bajá expectativa falsa (promesa de ventas) y ofrecé lo que sí podés.', 'To be honest, I cannot guarantee a network win.', 'To be honest, goodwill is supervisor-only. I will hand this off.'),
    item('natural', 'at the end of the day', 'al final / en resumen', 'Cierre: dueño + hora. Una vez por correo, no tres.', 'At the end of the day, you will have a virtual card and a 4:30 p.m. call.', 'At the end of the day I own the note, the email and the disposition.'),
    item('natural', 'as it turns out', 'resulta que', 'Después de mirar el CRM. No adivinés antes.', 'As it turns out, the two descriptors are not the same merchant.', 'As it turns out, identity is incomplete: date of birth does not match.'),
    item('natural', 'just to make sure I understood', 'solo para confirmar que entendí', 'Stall profesional + pregunta cerrada. Gana 3 segundos.', 'Just to make sure I understood: the decline was at the Lisbon hotel desk, correct?', 'Just to make sure I understood: you want last 6, not the PIN.'),
    item('natural', 'that is a great point. Let me address that', 'buen punto, déjeme atenderlo', 'Stall de 5 segundos. Luego evidencia, no relleno.', 'That is a great point. Let me address that: I will check which control fired.', 'That is a great point. Let me look into the statement date first.'),
    item('natural', 'I realized / I notice / I can see', 'me di cuenta / veo / noto', 'Verbos de evidencia. Conjugá según el momento.', 'I realized the travel notice was for Paris.', 'I can see two postings; I notice the descriptors differ.', [
      'Presente: I notice / I can see / I am looking at…',
      'Pasado: I realized / I saw / I found…',
      'Presente perfecto: I have noticed / I have confirmed…',
      'Para qué: mostrar que usaste el CRM, no la memoria.'
    ]),
    item('extra', 'because', 'porque', 'Give the reason after the decision.', 'I will not send the PIN because identity is incomplete.', 'I opened a billing inquiry because this is not a duplicate.'),
    item('extra', 'therefore', 'por lo tanto', 'Result of the evidence.', 'There is no Lisbon notice; therefore I will file the correct one.', 'The refund posted; therefore I will withdraw the dispute.'),
    item('extra', 'although', 'aunque', 'Concede, then keep policy.', 'Although the client is in hospital, I still need documents for hardship.', 'Although the hotel refused in chat, I will still document merchant contact.'),
    item('extra', 'in addition', 'además', 'Second action or fact.', 'I blocked the card. In addition, I ordered a replacement.', 'I set the travel notice. In addition, I activated the virtual card.'),
    item('extra', 'as a result', 'como resultado', 'Outcome of the investigation.', 'Chip-and-PIN was used; as a result this is not automatic fraud.', 'The window closed; as a result I will file an internal report, not a chargeback.'),
    item('extra', 'consequently', 'en consecuencia', 'Formal result — use once, not in a dump.', 'The descriptors differ; consequently I will not open fraud today.', 'Identity mismatches; consequently I will not confirm last 6 yet.'),
    item('phrasals', 'look into', 'investigar', 'Start evidence work in the CRM.', 'I will look into the two postings on the statement now.', 'Let me look into which control fired at the hotel.'),
    item('phrasals', 'sort out', 'resolver', 'Fix the process you own.', 'I will sort out the travel notice for Lisbon.', 'I will sort out the double-credit risk by withdrawing the dispute.'),
    item('phrasals', 'follow up', 'dar seguimiento', 'Timed next step with an owner.', 'I will follow up today before 4:30 p.m.', 'A supervisor will follow up on goodwill within two business days.'),
    item('phrasals', 'hand off', 'pasar el caso', 'Escalate with a named owner, not a dump.', 'I will hand off goodwill to a supervisor with the case number.', 'I am handing off underwriting; I will not promise approval.'),
    item('phrasals', 'write up', 'documentar', 'Audit-ready note: evidence, action, time.', 'I will write up the identity mismatch and the next step.', 'Please wait while I write up the merchant screenshot.'),
    item('affix', 'un- (unauthorized, unverified, unresolved)', 'prefijo un-', 'un- = not done / not confirmed. Use the family in nesting.', 'The third party is unverified, so I will not send the wire.', 'The prior note is unauthorized as identity evidence — there are no data points.'),
    item('affix', 'in- / non- (ineligible, non-compliant)', 'prefijo in- / non-', 'ineligible = outside the rule; non-compliant = breaks policy.', 'The dispute is ineligible because the reporting window closed.', 'Sending a PIN by SMS would be non-compliant.'),
    item('affix', '-tion / -ment (authorization, verification, replacement, activation)', 'sufijos -tion / -ment', 'Turn the verb into the desk noun you document.', 'I completed verification. Next: replacement and activation of the virtual card.', 'I cannot give authorization for an instant refund.'),
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
    item('slang', 'the thing is (inglés natural)', 'el asunto es que', 'Slang de escritorio, no grosería. Sirve para enfocar. Conjugá: is / was.', 'The thing is I cannot text a PIN.', 'The thing was the window had already closed.', [
      'the thing is that… (presente)',
      'the thing was that… (pasado)',
      'Para qué: una sola restricción + acción. También está en Expresiones.'
    ]),
    item('slang', 'what happened was (inglés natural)', 'lo que pasó fue que', 'Contá el hecho. Presente = how the system works. Pasado = this case.', 'What happened was the MCC block fired.', 'What happens is that PIN-present ATM needs investigation.', [
      'what happens is that… (regla)',
      'what happened was… (este caso)',
      'what will happen is that… (próximo paso)'
    ]),
    item('slang', '“fix it now” → I will take a safe action', '“arréglalo ya”', 'Do not promise an illegal fix. Name the safe action.', 'I will take a safe action now: file the correct travel notice.', 'I cannot “fix it now” by lifting every control.'),
    item('slang', '“my money is gone” → the funds are under investigation', '“se desapareció mi plata”', 'Do not confirm loss. Investigation language.', 'The funds are under investigation; I blocked the card and ordered a replacement.', 'I will not say the money is gone. I will look into the ATM trail.'),
    item('slang', '“just in case” → I will not keep both credits open', '“por si acaso”', 'Keeping dispute + refund = double credit risk.', 'I will not keep both credits open. I will withdraw the dispute.', 'We can reopen within 10 days if the refund reverses.'),
    item('slang', '“just refund me” → I will follow the eligible path', '“devolvéme la plata ya”', 'Refund is not automatic. Name the path you own.', 'I cannot refund on the spot. I will open the billing inquiry with a case number.', 'If the merchant already refunded, I will confirm the posting instead of a second credit.'),
    item('slang', '“this is ridiculous / third time” → acknowledge + CRM history', '“esto es ridículo / tercera vez”', 'Empathy: name the repeated effort. Then previous contacts. Do not restart from zero.', 'I understand this is the third time. I will review previous contacts in the CRM first.', 'I will not ask you to explain everything from the beginning.'),
    item('slang', '“I already told you” → I have the prior note', '“ya se lo dije”', 'Ownership: the CRM should show it. If not, you write it now.', 'I see the prior note. I will not make you repeat the whole story.', 'The previous contact is incomplete; I will document this call properly.'),
    item('slang', '“my card died” → the card is blocked / declined', '“se me murió la tarjeta”', 'Desk: declined, blocked, or expired. Check which control fired.', 'The card declined at the hotel. I will check travel notice and MCC.', 'The card is blocked after the ATM case. I can activate the virtual card.'),
    item('slang', '“they stole my money” → unauthorized vs PIN-present', '“me robaron”', 'Do not confirm theft. Evidence first.', 'I will look into whether PIN was present before I call it unauthorized.', 'I blocked the card and ordered a replacement while we investigate.'),
    item('slang', '“I don’t have time” → one concrete next step', '“no tengo tiempo”', 'Shorter path, still legal. Timed callback.', 'I will do identity now and call you today before 4:30 p.m.', 'I can activate the virtual card in this call so you can pay the airline.'),
    item('slang', '“you guys always…” → this case, this evidence', '“ustedes siempre…”', 'Do not defend the company. Work THIS file.', 'I will work this case on the evidence in the CRM, not on what usually happens.', 'I cannot speak for another desk. I own this next step.'),
    item('slang', '“hang on / wait wait” → please stay with me', '“esperá / hold on”', 'Keep the client. Name what you are doing.', 'Please stay with me while I look into the statement.', 'I am still here. I am writing up the identity check.'),
    item('slang', '“I need this like yesterday” → timed owner', '“esto era para ayer”', 'Urgency + a clock. No fake same-day promises.', 'I hear the urgency. The next step I own is today before 4:30 p.m.', 'Same-day goodwill is not something I can promise. I will escalate with a time.'),
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
      var e2 = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].en === 'E2 Empatía') { e2 = items[i]; break; }
      }
      if (e2) openId = e2._id;
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
