/**
 * Add Training Book language modules: linkers, affixes, phrasals.
 */
import { readFileSync, writeFileSync } from 'fs';

const BLOCK = `
    linkers: {
      id: 'linkers',
      title: 'Linkers / Conectores',
      icon: 'link',
      mins: 15,
      lead: 'Training Book Fase 2: Idea → Linker → Idea. Sin conectores, las ideas quedan sueltas y fallan nesting (E3 del correo y discurso oral).',
      lessons: [
        {
          title: 'Regla de oro',
          body: 'Cada idea nueva necesita un linker. “I worked yesterday.” solo no es conversación. Expandí: Idea + linker + Idea.',
          bullets: [
            'Patrón: Idea → Linker → Idea → Linker → Idea',
            'No uses “and” más de dos veces seguidas',
            'En el desk: nesting en E3 Explicación (mín. 2 conectores + 1 método linker)'
          ]
        },
        {
          title: 'Categorías del Training Book',
          body: 'Elegí el linker por función, no al azar.',
          bullets: [
            'Añadir: and, also, in addition, furthermore, as well, not only that',
            'Razón: because, since, due to (+ noun), as, given that',
            'Resultado: so, therefore, as a result, consequently, which means that',
            'Contraste: but, however, even though, although, nevertheless, despite this, on the other hand',
            'Secuencia: first, then, after that, finally, eventually',
            'Natural: the thing is, on top of that, to be honest, actually, at the end of the day'
          ]
        },
        {
          title: 'Ejemplos de escritorio',
          body: 'Usá evidencia del CRM + linker + acción.',
          bullets: [
            '“I reviewed Statements because two ACH payments declined. However, I will not lift every control.”',
            '“There is no Lisbon travel notice; therefore I will file the correct one now.”',
            '“Although the card is Active, the Operating Account is Restricted.”'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cliente: payroll bloqueado. Mejor nesting?',
          options: [
            { t: '“I understand payroll is blocked because the Operating Account is Restricted. However, I will escalate to Operations and call you before 4:30 p.m.”', ok: true },
            { t: '“I reviewed. I escalated. I will call.”', ok: false },
            { t: '“And and and I will help.”', ok: false }
          ],
          why: 'Idea → linker (because) → Idea → linker (however) → owned next step.'
        },
        {
          id: 'p2',
          q: '¿Cuál es contraste profesional (nueva frase)?',
          options: [
            { t: 'however', ok: true },
            { t: 'because', ok: false },
            { t: 'first', ok: false }
          ],
          why: 'however = contraste; because = razón; first = secuencia.'
        },
        {
          id: 'p3',
          q: 'due to se usa…',
          options: [
            { t: 'Antes de un sustantivo: due to the hold / due to the mismatch.', ok: true },
            { t: 'Antes de una cláusula completa: due to I reviewed…', ok: false },
            { t: 'Solo al final del correo como regards.', ok: false }
          ],
          why: 'due to + noun; because + clause.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'El patrón Nexus obligatorio es…', options: ['Idea → Linker → Idea', 'Solo una oración suelta', 'Cinco “and” seguidos'], answer: 0, why: 'Fase 2 Training Book.' },
        { id: 'q2', q: 'Linker de resultado formal…', options: ['therefore / as a result', 'also / as well', 'first / then'], answer: 0, why: 'Resultado.' },
        { id: 'q3', q: 'Mejor contraste en email de desk…', options: ['…; however, I will not wire to an unverified channel.', '… and and and…', '… because because…'], answer: 0, why: 'however + policy.' },
        { id: 'q4', q: 'which means that…', options: ['Explica la consecuencia del hecho anterior.', 'Es solo saludo.', 'Reemplaza identity verification.'], answer: 0, why: 'Resultado / clarificación.' },
        { id: 'q5', q: 'En Formato E, nesting vive sobre todo en…', options: ['E3 Explicación (2 conectores + 1 método).', 'Solo E1 Encabezado.', 'Solo el subject.'], answer: 0, why: 'E3.' }
      ]
    },

    affixes: {
      id: 'affixes',
      title: 'Prefixes & Suffixes',
      icon: 'puzzle',
      mins: 12,
      lead: 'Training Book Fase 3: prefijo cambia el SIGNIFICADO; sufijo cambia la FUNCIÓN gramatical. Familias de palabras para nesting natural.',
      lessons: [
        {
          title: 'Prefijos (significado)',
          body: 'Pegá el prefijo a la base para negar, repetir, exagerar o marcar error.',
          bullets: [
            'un- / in- / non-: unauthorized, incomplete, ineligible, non-compliant',
            'dis-: disagree, disconnect, dispute',
            'mis-: mismatch, misunderstand, misread',
            're-: review, replace, reopen, restore',
            'over- / under-: overdraft, overcharge, underestimate, under review',
            'pre-: previous contacts, prepaid, pre-authorized'
          ]
        },
        {
          title: 'Sufijos (función)',
          body: 'Cambiás verbo/adjetivo → sustantivo/adverbio sin reinventar el concepto.',
          bullets: [
            '-ness: happy → happiness; awareness, completeness',
            '-ment: develop → development; replacement, payment',
            '-tion / -ation: authorize → authorization; verification, escalation',
            '-ful / -less: stressful, hopeless',
            '-able: manageable, payable',
            '-ly: quickly, professionally'
          ]
        },
        {
          title: 'Familia de escritorio',
          body: 'authorize → authorization → unauthorized. Misma raíz, tres usos en un case.',
          bullets: [
            '“I need authorization from a supervisor.”',
            '“The charge looks unauthorized.”',
            '“I completed verification before disclosure.”'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cargo no autorizado — mejor forma…',
          options: [
            { t: 'unauthorized', ok: true },
            { t: 'reauthorizedly', ok: false },
            { t: 'overagree', ok: false }
          ],
          why: 'un- + authorize (+ -ed) = unauthorized.'
        },
        {
          id: 'p2',
          q: 'Prefijo mis- significa…',
          options: [
            { t: 'Error / incorrecto (mismatch, misunderstand).', ok: true },
            { t: 'Repetir (como re-).', ok: false },
            { t: 'Antes en el tiempo (como pre-).', ok: false }
          ],
          why: 'mis- = wrong.'
        },
        {
          id: 'p3',
          q: 'Sufijo -ment en desk…',
          options: [
            { t: 'replacement / payment (verbo → sustantivo)', ok: true },
            { t: 'quickly (eso es -ly)', ok: false },
            { t: 'unhappy (eso es un-)', ok: false }
          ],
          why: '-ment = noun from verb.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'Prefijo vs sufijo — regla TB…', options: ['Prefijo = significado; sufijo = función gramatical.', 'Ambos solo cambian el spelling.', 'Sufijo niega; prefijo hace adverbios.'], answer: 0, why: 'Fase 3.' },
        { id: 'q2', q: 'ineligible usa…', options: ['in- (negación / fuera de regla)', 're-', '-ly'], answer: 0, why: 'in- + eligible.' },
        { id: 'q3', q: 'authorize → authorization es…', options: ['Sufijo (-ation) que pasa a sustantivo.', 'Prefijo un-.', 'Phrasal verb.'], answer: 0, why: 'Suffix.' },
        { id: 'q4', q: 'Mejor desk line…', options: ['“Identity is incomplete; the third party is unverified.”', '“Identity is complete-less.”', '“I overagree the client.”'], answer: 0, why: 'incomplete / unverified.' },
        { id: 'q5', q: 're- en desk suele marcar…', options: ['Repetir o volver a hacer: review, replace, restore.', 'Error (mis-).', 'Exceso (over-).'], answer: 0, why: 're- = again.' }
      ]
    },

    phrasals: {
      id: 'phrasals',
      title: 'Phrasal Verbs',
      icon: 'arrows-exchange',
      mins: 14,
      lead: 'Training Book Fase 3 / desk: phrasals naturales en nesting — look into, follow up, sort out — no solo vocabulario aislado.',
      lessons: [
        {
          title: 'Investigar y resolver',
          body: 'Usá phrasals con evidencia del CRM y dueño/hora.',
          bullets: [
            'look into = investigar (inseparable: look into it)',
            'find out / figure out = averiguar / entender el path',
            'sort out = resolver (separable: sort it out)',
            'check on = revisar el estado de un restore / case',
            'write up = documentar audit-ready'
          ]
        },
        {
          title: 'Contacto y ownership',
          body: 'Promesas con phrasal + tiempo observable.',
          bullets: [
            'follow up with someone / on something + hora',
            'call back: I will call you back today before 4:30 p.m.',
            'hold on: keep the client while you look into…',
            'hand off: pasar el caso con dueño nombrado (no dump)',
            'put through: transferir con ownership'
          ]
        },
        {
          title: 'Otros de desk',
          body: 'Naturalidad sin perder control.',
          bullets: [
            'bring up a topic · pick up where we left off',
            'turn down an unsafe request · put off identity = fail',
            'send over a confirmation · fill out a form',
            'come across a notice in the CRM · the system went down → PSA'
          ]
        }
      ],
      practice: [
        {
          id: 'p1',
          q: 'Cliente pide que investigues el cargo. Mejor línea…',
          options: [
            { t: '“I will look into the two postings on Statements and follow up with you before 4:30 p.m.”', ok: true },
            { t: '“I will hang up now.”', ok: false },
            { t: '“I give up.”', ok: false }
          ],
          why: 'look into + follow up + timed next step.'
        },
        {
          id: 'p2',
          q: 'look into es…',
          options: [
            { t: 'Inseparable: look into it (no “look it into”).', ok: true },
            { t: 'Siempre separable: look it into.', ok: false },
            { t: 'Solo para colgar llamadas.', ok: false }
          ],
          why: 'Inseparable phrasal.'
        },
        {
          id: 'p3',
          q: 'Cliente pide PIN por SMS. Mejor phrasal de rechazo…',
          options: [
            { t: '“I must turn down that request; I will not send a PIN by SMS.”', ok: true },
            { t: '“I will put you through to WhatsApp for the PIN.”', ok: false },
            { t: '“I will hang up without a callback.”', ok: false }
          ],
          why: 'turn down = reject unsafe ask.'
        }
      ],
      quiz: [
        { id: 'q1', q: 'follow up en desk debe incluir…', options: ['Con quién/qué + hora observable.', 'Solo “later”.', 'El PIN del cliente.'], answer: 0, why: 'Timed ownership.' },
        { id: 'q2', q: 'sort out significa…', options: ['Resolver / arreglar el problema.', 'Colgar sin aviso.', 'Pedir el CVV.'], answer: 0, why: 'Resolve.' },
        { id: 'q3', q: 'hand off correcto…', options: ['Pasar el caso con dueño nombrado y contexto.', 'Dump sin nota.', 'Pedir OTP al cliente para “probar”.'], answer: 0, why: 'Owned escalation.' },
        { id: 'q4', q: 'Mejor cierre oral…', options: ['“I will call you back today before 4:30 p.m.”', '“I will hang up; figure it out yourself.”', '“I give up on this case.”'], answer: 0, why: 'call back + time.' },
        { id: 'q5', q: 'Los phrasals del TB se usan para…', options: ['Naturalidad dentro del nesting, no chips sueltos.', 'Reemplazar Formato E.', 'Saltar verificación.'], answer: 0, why: 'Fase 3 + nesting.' }
      ]
    },
`;

function patch(path) {
  let s = readFileSync(path, 'utf8');
  if (s.includes("id: 'linkers'")) {
    console.log('already has linkers', path);
    return;
  }
  if (!s.includes("id: 'phishing'")) {
    console.error('phishing module not found', path);
    process.exit(1);
  }
  // Insert before closing of MODULES (after phishing module's final `    }\n  };`)
  const marker = "      ]\n    }\n  };\n\n  var MODULE_ORDER";
  const idx = s.lastIndexOf(marker);
  if (idx < 0) {
    console.error('MODULES end marker not found', path);
    process.exit(1);
  }
  // Find the phishing closing - the last `    }\n  };` before MODULE_ORDER
  const insertAt = s.indexOf("\n  };\n\n  var MODULE_ORDER");
  if (insertAt < 0) {
    console.error('insert point not found', path);
    process.exit(1);
  }
  s = s.slice(0, insertAt) + ',\n' + BLOCK.trimEnd() + '\n' + s.slice(insertAt);

  s = s.replace(
    "var MODULE_ORDER = ['empathy', 'rapport', 'qakpi', 'verify', 'antifraud', 'aml', 'idtheft', 'phishing'];",
    "var MODULE_ORDER = ['empathy', 'rapport', 'qakpi', 'verify', 'antifraud', 'aml', 'idtheft', 'phishing', 'linkers', 'affixes', 'phrasals'];"
  );

  // Add 3 final quiz items related to language (replace is optional - append by swapping f20 area)
  if (!s.includes("module: 'linkers'")) {
    s = s.replace(
      "    { id: 'f20', module: 'qakpi', q: 'Timed next step must include…', options: ['Observable time and usually a named owner.', '“Later”.', '“Whenever”.'], answer: 0, why: 'KPI.' }\n  ];",
      "    { id: 'f20', module: 'qakpi', q: 'Timed next step must include…', options: ['Observable time and usually a named owner.', '“Later”.', '“Whenever”.'], answer: 0, why: 'KPI.' },\n" +
      "    { id: 'f21', module: 'linkers', q: 'Nesting pattern?', options: ['Idea → Linker → Idea', 'Isolated one-liners only', 'Only “and” five times'], answer: 0, why: 'TB Fase 2.' },\n" +
      "    { id: 'f22', module: 'affixes', q: 'Prefix vs suffix?', options: ['Prefix changes meaning; suffix changes grammar role.', 'Both only change spelling', 'Suffix always negates'], answer: 0, why: 'TB Fase 3.' },\n" +
      "    { id: 'f23', module: 'phrasals', q: 'Best investigate line?', options: ['I will look into it and follow up before 4:30 p.m.', 'I give up', 'Hang up with no callback'], answer: 0, why: 'Desk phrasals.' }\n  ];"
    );
  }

  writeFileSync(path, s);
  console.log('patched', path);
}

patch('js/simulation-corporate-learn.js');
patch('kamuk/js/simulation-corporate-learn.js');
