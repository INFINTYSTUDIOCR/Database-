/**
 * 1) Portal: restore full Infinity_Training_Book.html as primary TB
 * 2) Glossary: add Pronombres, Verbos, Tiempos, Preposiciones, Artículos;
 *    rename base acronyms to full names; enrich connector examples.
 */
import { readFileSync, writeFileSync } from 'fs';

// ── Portal ───────────────────────────────────────────────
const portalPath = 'Infinity_Student_Portal.html';
let portal = readFileSync(portalPath, 'utf8');
const oldTb = /  \/\/ ── TRAINING BOOK[\s\S]*?    \+'<\/div>';\n\n  \/\/ ── RECURSOS/;
const newTb = `  // ── TRAINING BOOK completo (Fases 1–3) · glosario secundario ──
  var tbStudentId = encodeURIComponent(s.id || s.code || '');
  var tbPortalUser = encodeURIComponent(((s.info && s.info.portalUser) || s.portalUser || '').toString().trim().toLowerCase());
  var tbEmbed = 'Infinity_Training_Book.html?embed=1&from=portal&studentId=' + tbStudentId + (tbPortalUser ? ('&portalUser=' + tbPortalUser) : '') + '&v=20260825full';
  var trainingBookHtml = ''
    +'<div class="card" style="padding:0;overflow:hidden;">'
    +'<div class="card-title" style="padding:12px 14px 8px;margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
    +'<span><i class="ti ti-book-2"></i> Training Book completo</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<a href="training-book/glosario/index.html" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="ti ti-vocabulary"></i> Glosario</a>'
    +'<a href="' + '"+tbEmbed+"' + '" target="_blank" rel="noopener" class="btn btn-navy btn-sm" style="text-decoration:none;"><i class="ti ti-external-link"></i> Pantalla completa</a>'
    +'</div></div>'
    +'<p style="font-size:12px;color:var(--t2);line-height:1.5;margin:0 14px 10px;">Fase 1 Arquitectura (pronombres, verbos, tiempos), Fase 2 Expansión (conectores), Fase 3 Naturalidad — sin recortes. El glosario es práctica extra.</p>'
    +'<iframe title="Training Book completo — Infinity" src="' + '"+tbEmbed+"' + '" style="width:100%;height:min(82vh,900px);border:0;display:block;background:#132840;"></iframe>'
    +'</div>'
    +'<div id="simulation-onboarding-root"></div>'
    +'<div id="simulation-nexora-panel" class="card" style="margin-top:16px;">'
    +'<div class="card-title"><i class="ti ti-sparkles"></i> Nexora · Practice lab</div>'
    +'<p style="font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 12px;">Misma experiencia que producción con <strong>Infinity Holdings Inc</strong>. Práctica real. <strong>No impacta</strong> tu score semanal.</p>'
    +'<div id="simulation-nexora-body"></div>'
    +'</div>';

  // ── RECURSOS`;

// Fix the string concatenation carefully for the portal template
const newTbFixed = `  // ── TRAINING BOOK completo (Fases 1–3) · glosario secundario ──
  var tbStudentId = encodeURIComponent(s.id || s.code || '');
  var tbPortalUser = encodeURIComponent(((s.info && s.info.portalUser) || s.portalUser || '').toString().trim().toLowerCase());
  var tbEmbed = 'Infinity_Training_Book.html?embed=1&from=portal&studentId=' + tbStudentId + (tbPortalUser ? ('&portalUser=' + tbPortalUser) : '') + '&v=20260825full';
  var trainingBookHtml = ''
    +'<div class="card" style="padding:0;overflow:hidden;">'
    +'<div class="card-title" style="padding:12px 14px 8px;margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
    +'<span><i class="ti ti-book-2"></i> Training Book completo</span>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<a href="training-book/glosario/index.html" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="ti ti-vocabulary"></i> Glosario</a>'
    +'<a href="'+tbEmbed+'" target="_blank" rel="noopener" class="btn btn-navy btn-sm" style="text-decoration:none;"><i class="ti ti-external-link"></i> Pantalla completa</a>'
    +'</div></div>'
    +'<p style="font-size:12px;color:var(--t2);line-height:1.5;margin:0 14px 10px;">Fase 1 Arquitectura (pronombres, verbos, tiempos), Fase 2 Expansión (conectores), Fase 3 Naturalidad — sin recortes. El glosario es práctica extra.</p>'
    +'<iframe title="Training Book completo — Infinity" src="'+tbEmbed+'" style="width:100%;height:min(82vh,900px);border:0;display:block;background:#132840;"></iframe>'
    +'</div>'
    +'<div id="simulation-onboarding-root"></div>'
    +'<div id="simulation-nexora-panel" class="card" style="margin-top:16px;">'
    +'<div class="card-title"><i class="ti ti-sparkles"></i> Nexora · Practice lab</div>'
    +'<p style="font-size:13px;line-height:1.55;color:var(--t2);margin:0 0 12px;">Misma experiencia que producción con <strong>Infinity Holdings Inc</strong>. Práctica real. <strong>No impacta</strong> tu score semanal.</p>'
    +'<div id="simulation-nexora-body"></div>'
    +'</div>';

  // ── RECURSOS`;

if (portal.includes('Infinity_Training_Book.html?embed=1')) {
  console.log('portal already on full TB — skip');
} else if (!oldTb.test(portal)) {
  console.error('portal TB block not found');
  process.exit(1);
} else {
  portal = portal.replace(oldTb, newTbFixed);
  writeFileSync(portalPath, portal);
  console.log('portal OK');
}

// ── Glossary architecture block ──────────────────────────
const libPath = 'js/infinity-recursos-library.js';
let lib = readFileSync(libPath, 'utf8');

const cats = `  var GLOSS_CATS = [
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
  ];`;
lib = lib.replace(/  var GLOSS_CATS = \[[\s\S]*?\];/, cats);

function it(cat, en, es, how, a, b, extra) {
  const rest = extra ? ', ' + JSON.stringify(extra) : '';
  return `    item(${JSON.stringify(cat)}, ${JSON.stringify(en)}, ${JSON.stringify(es)}, ${JSON.stringify(how)}, ${JSON.stringify(a)}, ${JSON.stringify(b)}${rest}),`;
}

const arch = [];

// Pronouns from TB
const pronouns = [
  ['I / me / myself / my', 'Yo', 'Personal I · objeto me · reflexivo myself · posesivo my.'],
  ['you / you / yourself / your', 'Tú / usted', 'Singular. En plural: yourselves.'],
  ['he / him / himself / his', 'Él', 'Masculino singular.'],
  ['she / her / herself / her', 'Ella', 'Femenino singular. her = objeto y posesivo.'],
  ['it / it / itself / its', 'Eso / esa', 'Cosas, cuentas, sistemas. its sin apóstrofe.'],
  ['we / us / ourselves / our', 'Nosotros', 'Primera persona plural.'],
  ['you / you / yourselves / your', 'Ustedes', 'Plural. yourselves en reflexivo.'],
  ['they / them / themselves / their', 'Ellos / ellas', 'Personas o grupos.']
];
pronouns.forEach(([en, es, how]) => {
  arch.push(it('pronouns', en, es,
    how + ' Tabla de pronombres del Training Book Fase 1 — Arquitectura. Respuesta bajo 1 segundo.',
    'I will call you today. Please stay with me while I look into your account myself.',
    'They asked us to confirm their identity. She called him about their statement.',
    {
      why: 'Sin pronombres automáticos no hay velocidad (KPI Responsiveness). Fase 1 del Training Book.',
      examples: [
        'I reviewed the statement for you. Can you confirm the amount for me?',
        'He said the charge was unauthorized. She asked us to look into it ourselves.',
        'They want their card replaced. We will send it to them within five business days.'
      ]
    }));
});

// Irregular verbs — full 16 from TB
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
verbs.forEach(([en, es]) => {
  const [inf, past, part] = en.split(' / ');
  arch.push(it('verbs', 'To ' + inf.replace(/^to /i, '') + ' — ' + en, es,
    'Verbo irregular del Training Book (16 obligatorios). Presente / pasado / participio en menos de 1 segundo. Speed Drill Fase 1.',
    'Yesterday I ' + past + ' the note after I had ' + part + ' the review.',
    'I will ' + inf.replace(/^to /i, '') + ' the client today before 4:30 p.m.',
    {
      why: 'Los 16 irregulares son cimiento. Si tardás más de 1 segundo, se repite hasta automatizar.',
      examples: [
        'Present: I ' + (inf === 'be' ? 'am' : inf === 'have' ? 'have' : inf) + ' / Past: I ' + past + ' / Participle: I have ' + part + '.',
        'Desk: After I had ' + part + ' the identity check, I ' + past + ' the next step to the client.',
        'Speed: say the three forms out loud in under one second — ' + en + '.'
      ]
    }));
});

// Tenses / switches
const tenses = [
  ['will + verb', 'Futuro real (-ré)', 'Correré = I will run. Decisión o futuro real.',
    'I will call you today before 4:30 p.m. with the Operations outcome.',
    'I will activate the virtual card now so you can check in.'],
  ['would + verb', 'Futuro hipotético (-ría)', 'Correría = I would run. Condición / cortesía.',
    'I would rather verify identity than send a PIN by SMS.',
    'What would you like me to do first — block the card or file the dispute?'],
  ['have + participle', 'Presente perfecto', 'He corrido = I have run. Pasado que afecta ahora.',
    'I have reviewed Statements and I have documented Previous contacts.',
    'I have already escalated this to Operations.'],
  ['had + participle', 'Pasado perfecto', 'Había corrido = I had run. Antes de otro pasado.',
    'When you called, I had already blocked the card.',
    'I had verified identity before I confirmed last six digits.'],
  ['have been + -ing', 'Perfecto continuo', 'He estado corriendo. Empezó antes y sigue.',
    'I have been looking into the two postings on your statement.',
    'We have been waiting on Compliance since yesterday.'],
  ['am/is/are + -ing', 'Presente continuo', 'Acción en proceso ahora.',
    'I am reviewing your Card transactions right now.',
    'We are placing you on a brief hold to check Previous contacts.'],
  ['simple past', 'Pasado simple', 'Hecho cerrado en el pasado.',
    'I reviewed the freeze flag and I escalated to Operations.',
    'The hotel declined the card at check-in yesterday.'],
  ['ING vs TO', 'Intención TO · actividad ING', 'want/need → TO. enjoy/after prep → ING.',
    'I need to verify identity. I enjoy helping clients under pressure.',
    'After reviewing Statements, I want to escalate to Operations.']
];
tenses.forEach(([en, es, how, a, b]) => {
  arch.push(it('tenses', en, es, how + ' Interruptor Nexus del Training Book Fase 1.',
    a, b, {
      why: 'El método no enseña 20 tiempos: enseña INTERRUPTORES (will / would / have / had / been / is).',
      examples: [a, b, 'Switch drill: same situation — I will… / I would… / I have… / I had… / I have been… / I am…']
    }));
});

// Prepositions
const preps = [
  ['in', 'en (ciudad / mes / year / inside)', 'I live in San José. The mismatch is in the date of birth.', 'I opened a billing inquiry in the CRM.'],
  ['on', 'en (día / superficie / card)', 'We meet on Monday. I put a travel notice on the card.', 'The decline is on the Operating Account.'],
  ['at', 'en (hora / lugar puntual)', 'We meet at 5 p.m. The client is at the hotel desk.', 'I will call you at noon tomorrow.'],
  ['for', 'para / por (destinatario / duración)', 'I will call for you. Waiting for two business days.', 'This email is for Marta.'],
  ['to', 'a / hacia (dirección / persona)', 'I escalated to Operations. Send the confirmation to me.', 'I need to go to Statements.'],
  ['from', 'de / desde', 'The window is counted from the statement date.', 'A call from Lisbon triggered the decline.'],
  ['with', 'con', 'I will follow up with Compliance today.', 'Please stay with me on the recorded line.'],
  ['about', 'sobre / acerca de', 'I am calling about the payroll freeze.', 'Let me ask about the merchant contact.'],
  ['by', 'para (deadline) / por (medio)', 'I will call you by 4:30 p.m. By policy, last six only after identity.', 'Payment by wire is not allowed here.'],
  ['without', 'sin', 'I will not send the PIN without full identity.', 'I cannot file without the booking confirmation.'],
  ['after', 'después de (+ ING / noun)', 'After reviewing Statements, I escalated.', 'After identity, I can confirm last six.'],
  ['before', 'antes de', 'I will call you before 4:30 p.m.', 'Before I disclose last six, identity must match.']
];
preps.forEach(([en, es, a, b]) => {
  arch.push(it('prep', en, es,
    'Preposición del Training Book / Jill (Clase IN ON AT y tiempo). Elegí según lugar, tiempo o relación.',
    a, b, {
      why: 'Preposiciones mal = frase “traducida”. Automatizá in/on/at de lugar y tiempo.',
      examples: [a, b, 'Drill: I live ___ Costa Rica / We meet ___ Friday / The call is ___ 4:30 p.m. → in / on / at.']
    }));
});

// Articles
[['a', 'un/una (consonante)', 'a case number, a travel notice, a recorded line'],
 ['an', 'un/una (vocal sound)', 'an email, an open dispute, an unauthorized charge'],
 ['the', 'el/la (específico)', 'the Operating Account, the statement date, the client']
].forEach(([en, es, tip]) => {
  arch.push(it('articles', en, es,
    'Artículo. ' + tip + '. a/an = no específico aún; the = ya identificado en el case.',
    'I opened a billing inquiry. The inquiry is now with Operations.',
    'There is an unauthorized charge on the statement. I blocked the card.',
    { why: 'Artículos correctos suenan a inglés de desk, no a traducción.' }
  ));
});

// Rename base items - replace AMR, Formato E (EC), AML titles
lib = lib.replace("item('base', 'AMR', 'Acknowledge → Mirror → Respond'",
  "item('base', 'Acknowledge Mirror Respond', 'Reconocer → Espejo → Responder'");
lib = lib.replace("item('base', 'Formato E (EC)', 'Estructura del correo al cliente'",
  "item('base', 'Estructura del correo al cliente', 'Encabezado Empatía Explicación Ejecución Encierro'");
lib = lib.replace("item('base', 'AML', 'Anti-Money Laundering (a veces escrito ANL)'",
  "item('base', 'Anti-Money Laundering', 'Prevención de lavado de dinero'");
lib = lib.replace("item('phone', 'AMR Acknowledge'", "item('phone', 'Acknowledge (reconocer impacto)'");
lib = lib.replace("item('phone', 'AMR Mirror'", "item('phone', 'Mirror (espejo del hecho)'");
lib = lib.replace("item('phone', 'AMR Respond'", "item('phone', 'Respond (responder con hora)'");

// Default open category → pronouns for architecture feel, or keep base
lib = lib.replace("cat = 'base';\n      var first = null;\n      for (var i = 0; i < items.length; i++) {\n        if (items[i].cat === 'base' && items[i].en === 'AMR') { first = items[i]; break; }\n      }",
  "cat = 'pronouns';\n      var first = null;\n      for (var i = 0; i < items.length; i++) {\n        if (items[i].cat === 'pronouns') { first = items[i]; break; }\n      }");
// Also try new name
lib = lib.replace("items[i].en === 'AMR'", "items[i].en === 'Acknowledge Mirror Respond'");

if (lib.includes("item('pronouns',")) {
  console.log('architecture already in glossary — skip insert');
} else {
  const insertAfter = "  var GLOSS_ITEMS = [\n";
  if (!lib.includes(insertAfter)) {
    console.error('GLOSS_ITEMS start not found');
    process.exit(1);
  }
  lib = lib.replace(insertAfter, insertAfter + '    // ── Fase 1 Arquitectura (Training Book completo) ──\n' + arch.join('\n') + '\n');
}

// Enrich connectors: replace thin examples with rich multi-industry ones
const richConnectors = {
  because: {
    examples: [
      'Banking: I will not send the PIN because identity is incomplete on the recorded line.',
      'Legal: We cannot file the motion today because the affidavit is still missing two exhibits.',
      'Medical: I rescheduled the procedure because the pre-authorization was not on file.',
      'General: I expanded my answer because one sentence is not a conversation — Idea plus linker plus Idea.'
    ]
  },
  however: {
    examples: [
      'Banking: I hear the urgency; however, I cannot wire money to an unverified WhatsApp agency.',
      'Legal: The client wants an immediate filing; however, conflict check is still pending.',
      'Medical: The symptoms sound urgent; however, I must verify insurance before I confirm the slot.',
      'General: I worked yesterday because I had a key meeting; however, it did not go as expected.'
    ]
  },
  therefore: {
    examples: [
      'Banking: There is no Lisbon travel notice; therefore I will file the correct one now.',
      'Legal: Discovery closes Friday; therefore I will send the production list today before noon.',
      'Medical: Labs are back and clear; therefore the physician can proceed with the follow-up visit.',
      'General: Customer service is the backbone of the business; therefore tone matters as much as the fix.'
    ]
  },
  'in addition': {
    examples: [
      'Banking: I blocked the card. In addition, I ordered a replacement and activated the virtual card.',
      'Legal: I updated the docket. In addition, I notified opposing counsel by email.',
      'Medical: I confirmed the referral. In addition, I sent the records to the specialist portal.',
      'General: On top of that / In addition, I have to maintain a professional tone under pressure.'
    ]
  },
  'as a result': {
    examples: [
      'Banking: Chip-and-PIN was used; as a result this is not automatic unauthorized fraud.',
      'Legal: The deadline was missed; as a result we must request an extension before close of business.',
      'Medical: The prior auth expired; as a result the claim was denied pending resubmission.',
      'General: I finished everything on time. As a result, I felt productive by the end of the day.'
    ]
  },
  although: {
    examples: [
      'Banking: Although the Obsidian card is Active, the Operating Account is Restricted.',
      'Legal: Although the client is upset, we still need a signed engagement letter.',
      'Medical: Although the patient is in pain, controlled substances require a verified prescription.',
      'General: Although it can be challenging, I keep a professional tone when clients speak fast.'
    ]
  },
  'on the other hand': {
    examples: [
      'Banking: The client wants both credits; on the other hand, that creates a double-credit risk.',
      'Legal: Settlement is faster; on the other hand, trial preserves the full claim value.',
      'Medical: An earlier slot is available; on the other hand, the specialist of record is only free Thursday.',
      'General: Speed matters; on the other hand, clarity without structure is still a fail.'
    ]
  },
  'which means that': {
    examples: [
      'Banking: The descriptors say DEPOSIT then BALANCE, which means that this is not a duplicate charge.',
      'Legal: Venue lies in federal court, which means that we remove before the answer deadline.',
      'Medical: The referral is out of network, which means that higher cost-sharing may apply.',
      'General: I work in customer service, which means that I speak English every day under pressure.'
    ]
  },
  furthermore: {
    examples: [
      'Banking: I verified identity. Furthermore, I documented the mismatch on the recorded line.',
      'Legal: The complaint is timely. Furthermore, damages are supported by the invoices attached.',
      'Medical: Vital signs are stable. Furthermore, the care plan was updated in the chart.',
      'General: Furthermore, how you communicate is just as important as what you say.'
    ]
  },
  nevertheless: {
    examples: [
      'Banking: The prior note says ID OK; nevertheless, date of birth does not match today.',
      'Legal: The facts favor us; nevertheless, we must disclose adverse authority.',
      'Medical: The patient prefers a walk-in; nevertheless, triage still requires a nurse assessment.',
      'General: My performance was disappointing. Nevertheless, that experience built resilience.'
    ]
  }
};

// Patch connector items that exist - inject examples array via string replace on each
for (const [key, val] of Object.entries(richConnectors)) {
  const needle = `item('extra', "${key}"`;
  const idx = lib.indexOf(needle);
  if (idx < 0) {
    // try single quotes
    const n2 = `item('extra', '${key}'`;
    const i2 = lib.indexOf(n2);
    if (i2 < 0) continue;
  }
}

// Simpler: append a post-process that finds each extra item and replaces the trailing object
for (const [key, val] of Object.entries(richConnectors)) {
  const re = new RegExp(
    `(item\\('extra', ["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][\\s\\S]*?)(\\{"why":[^}]+\\}\\))`,
    'm'
  );
  if (re.test(lib)) {
    lib = lib.replace(re, (full, head, obj) => {
      const whyMatch = obj.match(/"why":"([^"]*)"/);
      const why = whyMatch ? whyMatch[1] : 'Linker del Training Book.';
      return head + JSON.stringify({ why, examples: val.examples }) + ')';
    });
  }
}

writeFileSync(libPath, lib);
console.log('glossary architecture items', arch.length);
console.log('lib bytes', lib.length);
