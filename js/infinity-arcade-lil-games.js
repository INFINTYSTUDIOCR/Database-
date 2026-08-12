/**
 * Infinity Arcade — Performance games (L+I+L)
 * Subliminal method: LINKER → IDEA → LINKER (connect thought for the pueblo).
 * Extends Language Arcade modes without replacing the core engine.
 */
(function (global) {
  'use strict';

  var LIL_MANTRA = 'LINK · IDEA · LINK';

  function lilRibbon(L1, idea, L2) {
    L1 = L1 || 'Because';
    idea = idea || 'your idea';
    L2 = L2 || 'therefore';
    return (
      '<div class="lil-ribbon" aria-hidden="true">' +
      '<span class="lil-chip lil-l">' +
      esc(L1) +
      '</span>' +
      '<i class="lil-arrow"></i>' +
      '<span class="lil-chip lil-i">' +
      esc(idea) +
      '</span>' +
      '<i class="lil-arrow"></i>' +
      '<span class="lil-chip lil-l2">' +
      esc(L2) +
      '</span>' +
      '</div>'
    );
  }

  function lilFoot() {
    return '<div class="lil-mantra">' + LIL_MANTRA + ' · para pensar claro</div>';
  }

  function esc(s) {
    if (typeof arcadeEsc === 'function') return arcadeEsc(s);
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function shuffle(arr) {
    if (typeof arcadeShuffle === 'function') return arcadeShuffle(arr.slice());
    var a = arr.slice();
    for (var i = a.length - 1; i > 1; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Banks — every item embeds L+I+L pedagogy */
  var LIL_BANK = {
    bosscall: [
      {
        id: 'boss-billing',
        kpi: 'k15',
        prompt: 'Cliente enojado: cobro duplicado',
        scenario: '"This is the second charge this month. Fix it NOW."',
        options: [
          'I understand the frustration. Because the charge looks duplicated, I will reverse it today; therefore you will see the credit within 24 hours.',
          'Calm down. It is not my fault. Call accounting.',
          'Maybe you are wrong. Check your email.',
          'Ok whatever, I will see.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'duplicated charge', L2: 'therefore' },
        explain: 'Validate + Because (causa) + acción + therefore (resultado). Eso es L+I+L bajo fuego.'
      },
      {
        id: 'boss-delay',
        kpi: 'k15',
        prompt: 'Entrega atrasada',
        scenario: '"You promised Friday. It is Monday. Why should I trust you?"',
        options: [
          'You are right to be upset. Although we missed Friday, we finished the fix; therefore I will send the update in the next hour.',
          'Servers were down, not my problem.',
          'Relax, it happens.',
          'I do not know what you mean.'
        ],
        answer: 0,
        lil: { L1: 'Although', idea: 'we missed Friday', L2: 'therefore' },
        explain: 'Although = contraste honesto; therefore = compromiso concreto.'
      },
      {
        id: 'boss-refund',
        kpi: 'k15',
        prompt: 'Pide reembolso agresivo',
        scenario: '"I want a full refund or I escalate to your manager."',
        options: [
          'I hear you. Because your case qualifies, I can start the refund now; on top of that I will confirm by email.',
          'Escalate then. Bye.',
          'Refunds are impossible. End of story.',
          'Please stop threatening me.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'case qualifies', L2: 'on top of that' },
        explain: 'Because justifica; on top of that suma el follow-up.'
      },
      {
        id: 'boss-hold',
        kpi: 'k14',
        prompt: 'Quiere hablar con supervisor YA',
        scenario: '"Put your supervisor on the line right now."',
        options: [
          'I can do that. First let me capture the issue clearly; then I will connect you so we do not waste their time.',
          'No. Deal with me.',
          'Supervisors never answer.',
          'Hold forever.'
        ],
        answer: 0,
        lil: { L1: 'First', idea: 'capture the issue', L2: 'then' },
        explain: 'First → idea → then: secuencia limpia bajo presión.'
      },
      {
        id: 'boss-accent',
        kpi: 'k14',
        prompt: 'Cliente no entiende tu acento',
        scenario: '"I cannot understand you. Get me someone else."',
        options: [
          'Thank you for telling me. Because clarity matters, I will slow down and confirm each step; therefore we finish this together.',
          'My English is fine. Listen harder.',
          'Fine, goodbye.',
          'Whatever.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'clarity matters', L2: 'therefore' },
        explain: 'Ownership sin pelear. Because → idea → therefore.'
      },
      {
        id: 'boss-upsell',
        kpi: 'k15',
        prompt: 'Objeción de precio',
        scenario: '"Your plan is too expensive for what I get."',
        options: [
          'I get that. Although price is higher, you unlock live coaching; as a result your interview speed improves faster.',
          'If you cannot pay, leave.',
          'Cheap plans are trash.',
          'I do not set prices.'
        ],
        answer: 0,
        lil: { L1: 'Although', idea: 'price is higher', L2: 'as a result' },
        explain: 'Contraste + valor + resultado. L+I+L de ventas éticas.'
      },
      {
        id: 'boss-missed-sla',
        kpi: 'k15',
        prompt: 'SLA roto',
        scenario: '"You broke the SLA again. This is unacceptable."',
        options: [
          'You are correct. Because we missed the SLA, I am opening a priority ticket; therefore you get a status update every two hours.',
          'SLAs are just guidelines.',
          'Blame the night shift.',
          'Send an angry email.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'missed the SLA', L2: 'therefore' },
        explain: 'Admití + Because + plan + therefore.'
      },
      {
        id: 'boss-privacy',
        kpi: 'k15',
        prompt: 'Pide datos de otra cuenta',
        scenario: '"Just tell me my partner\'s password reset link."',
        options: [
          'I cannot share that. Although I want to help, privacy rules block it; however I can guide your partner to reset safely.',
          'Sure, here it is.',
          'Hack it yourself.',
          'I will email you their code.'
        ],
        answer: 0,
        lil: { L1: 'Although', idea: 'I want to help', L2: 'however' },
        explain: 'Although + límite + however + camino legal.'
      }
    ],
    tone: [
      {
        id: 'tone-late',
        kpi: 'k14',
        prompt: 'Avisá que llegarás 10 min tarde',
        options: [
          'I am running 10 minutes late. Because traffic is heavy, I will join ASAP; therefore please start without me if needed.',
          'lol stuck, wait',
          'Not my fault. Deal with it.',
          'Maybe I come, maybe not.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'traffic is heavy', L2: 'therefore' },
        explain: 'Tono profesional = claro + Because + therefore.'
      },
      {
        id: 'tone-disagree',
        kpi: 'k10',
        prompt: 'Discrepá en un meeting sin pelear',
        options: [
          'I see your point. Although that path is faster, it increases risk; therefore I recommend the safer option.',
          'That idea is stupid.',
          'Whatever you say, boss.',
          'I do not care.'
        ],
        answer: 0,
        lil: { L1: 'Although', idea: 'faster path', L2: 'therefore' },
        explain: 'Respeto + contraste + recomendación.'
      },
      {
        id: 'tone-followup',
        kpi: 'k21',
        prompt: 'Follow-up de email sin sonar needy',
        options: [
          'Quick follow-up. Because the deadline is Thursday, I am checking status; on top of that I can jump on a call if useful.',
          'WHY IGNORE ME???',
          'Hello?????!!!!!!!!!!',
          'I guess you hate me.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'deadline Thursday', L2: 'on top of that' },
        explain: 'Because da razón; on top of that ofrece ayuda.'
      },
      {
        id: 'tone-feedback',
        kpi: 'k10',
        prompt: 'Dale feedback duro a un peer',
        options: [
          'The deck was unclear. Because slide 3 mixed two ideas, readers got lost; therefore let us split them next time.',
          'Your work is garbage.',
          'Nice try I guess.',
          'I will fix everything myself forever.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'mixed two ideas', L2: 'therefore' },
        explain: 'Feedback = hecho + Because + next step.'
      },
      {
        id: 'tone-reject',
        kpi: 'k12',
        prompt: 'Rechazá una meeting invite',
        options: [
          'Thanks for the invite. Although I cannot join at 3, I can do 5; therefore please send a new hold.',
          'No. Busy.',
          'Meetings are a waste.',
          'Ignore this forever.'
        ],
        answer: 0,
        lil: { L1: 'Although', idea: 'cannot join at 3', L2: 'therefore' },
        explain: 'Rechazo amable con alternativa (L+I+L).'
      },
      {
        id: 'tone-apology',
        kpi: 'k15',
        prompt: 'Disculpa profesional por error tuyo',
        options: [
          'I am sorry. Because I sent the wrong file, you lost time; therefore I am sending the correct one now with a checklist.',
          'Mistakes happen. Move on.',
          'Not a big deal.',
          'Blame the tool.'
        ],
        answer: 0,
        lil: { L1: 'Because', idea: 'wrong file', L2: 'therefore' },
        explain: 'Sorry + Because + repair.'
      }
    ],
    listen: [
      {
        id: 'listen-eta',
        kpi: 'k14',
        audioText:
          'Hi, I need an update. Because the client is waiting, can you confirm the ETA? Therefore please reply before noon.',
        prompt: '¿Qué piden?',
        options: ['Confirmar ETA antes del mediodía', 'Cancelar el proyecto', 'Cambiar de proveedor', 'Ignorar al cliente'],
        answer: 0,
        lil: { L1: 'Because', idea: 'client is waiting', L2: 'therefore' },
        explain: 'Oíste Because (urgencia) → idea (ETA) → therefore (deadline).'
      },
      {
        id: 'listen-interview',
        kpi: 'k20',
        audioText:
          'Tell me about a conflict. Although it was tense, I stayed calm; therefore we reached a fair agreement.',
        prompt: '¿Qué estructura usó la persona?',
        options: ['Although → idea → therefore (L+I+L)', 'Solo gritó', 'Cambió de tema', 'Pidió un reembolso'],
        answer: 0,
        lil: { L1: 'Although', idea: 'it was tense', L2: 'therefore' },
        explain: 'Eso es la estructura Infinity: linker + idea + linker.'
      },
      {
        id: 'listen-cs',
        kpi: 'k15',
        audioText:
          'I am frustrated. First I want a refund timeline; then I need written confirmation.',
        prompt: '¿Cuál es el orden de pedidos?',
        options: ['First timeline, then confirmation', 'Solo confirmation', 'Solo insultos', 'Cancelar cuenta ya'],
        answer: 0,
        lil: { L1: 'First', idea: 'refund timeline', L2: 'then' },
        explain: 'First / then = cadena clara. Escuchá el esqueleto.'
      },
      {
        id: 'listen-offer',
        kpi: 'k10',
        audioText:
          'The salary is lower. However the growth path is strong; on top of that you get mentorship.',
        prompt: '¿Qué suma valor además del growth?',
        options: ['Mentorship', 'Free lunch forever', 'No work Fridays', 'A company car'],
        answer: 0,
        lil: { L1: 'However', idea: 'growth path', L2: 'on top of that' },
        explain: 'However contraste; on top of that agrega.'
      },
      {
        id: 'listen-risk',
        kpi: 'k10',
        audioText:
          'We can ship Friday. Although testing is incomplete, marketing wants it live; therefore I recommend a soft launch.',
        prompt: '¿Cuál es la recomendación?',
        options: ['Soft launch', 'Cancel marketing', 'Ignore testing', 'Ship with zero QA'],
        answer: 0,
        lil: { L1: 'Although', idea: 'testing incomplete', L2: 'therefore' },
        explain: 'Although marca riesgo; therefore marca decisión.'
      },
      {
        id: 'listen-star',
        kpi: 'k20',
        audioText:
          'Situation: sales dropped. Task: recover the account. Action: I called the same day. Result: because we acted fast, trust returned; therefore they renewed.',
        prompt: '¿Qué cerró el Result?',
        options: ['Because + action + therefore renewed', 'Solo Situation', 'Un phrasal random', 'Silencio'],
        answer: 0,
        lil: { L1: 'Because', idea: 'acted fast', L2: 'therefore' },
        explain: 'STAR vive cuando el Result usa L+I+L.'
      }
    ],
    star: [
      {
        id: 'star-lil-conflict',
        kpi: 'k20',
        prompt: 'Armá el Result con L+I+L',
        clue: 'Conflict → calm → agreement',
        blocks: ['Although it was tense', 'I stayed calm', 'therefore', 'we reached agreement'],
        answer: ['Although it was tense', 'I stayed calm', 'therefore', 'we reached agreement'],
        lil: { L1: 'Although', idea: 'I stayed calm', L2: 'therefore' },
        explain: 'Result = linker + idea + linker. El pueblo entiende cuando conectás.'
      },
      {
        id: 'star-lil-deadline',
        kpi: 'k20',
        prompt: 'Armá Action + Result',
        clue: 'Late delivery recovery',
        blocks: ['I called the client', 'because the delay hurt trust', 'therefore', 'I offered a clear plan'],
        answer: ['I called the client', 'because the delay hurt trust', 'therefore', 'I offered a clear plan'],
        lil: { L1: 'because', idea: 'delay hurt trust', L2: 'therefore' },
        explain: 'Action concreta + Because + therefore.'
      },
      {
        id: 'star-lil-team',
        kpi: 'k20',
        prompt: 'Armá Situation → Result',
        clue: 'Team missed target',
        blocks: ['Last month we missed the target', 'however', 'we rebuilt the process', 'as a result we hit goal'],
        answer: ['Last month we missed the target', 'however', 'we rebuilt the process', 'as a result we hit goal'],
        lil: { L1: 'however', idea: 'rebuilt the process', L2: 'as a result' },
        explain: 'Honest Situation + however + as a result.'
      },
      {
        id: 'star-lil-cs',
        kpi: 'k20',
        prompt: 'Customer save — armá la cadena',
        clue: 'Angry → fix → renew',
        blocks: ['The client was angry', 'so I owned the issue', 'on top of that', 'I confirmed the fix in writing'],
        answer: ['The client was angry', 'so I owned the issue', 'on top of that', 'I confirmed the fix in writing'],
        lil: { L1: 'so', idea: 'owned the issue', L2: 'on top of that' },
        explain: 'so + ownership + on top of that = trust.'
      },
      {
        id: 'star-lil-learn',
        kpi: 'k20',
        prompt: 'Armá learning story',
        clue: 'Fail → learn → win',
        blocks: ['I failed the first interview', 'because my answers were short', 'therefore', 'I trained with L+I+L'],
        answer: ['I failed the first interview', 'because my answers were short', 'therefore', 'I trained with L+I+L'],
        lil: { L1: 'because', idea: 'answers were short', L2: 'therefore' },
        explain: 'Tu historia también es L+I+L. Eso escala al pueblo.'
      },
      {
        id: 'star-lil-lead',
        kpi: 'k20',
        prompt: 'Leadership Result',
        clue: 'Confusion → clarity',
        blocks: ['The team was confused', 'first I clarified the goal', 'then', 'everyone moved in sync'],
        answer: ['The team was confused', 'first I clarified the goal', 'then', 'everyone moved in sync'],
        lil: { L1: 'first', idea: 'clarified the goal', L2: 'then' },
        explain: 'First / then lidera sin gritar.'
      }
    ],
    snake: [
      {
        id: 'snake-1',
        kpi: 'k8',
        prompt: 'Completá la serpiente L+I+L',
        ideas: ['sales dropped', 'we called clients', 'renewals recovered'],
        options: ['Because', 'however', 'therefore', 'lol'],
        answer: [0, 1, 2],
        pattern: ['Because', 'IDEA', 'however', 'IDEA', 'therefore', 'IDEA'],
        explain: 'Because → idea → however → idea → therefore → idea. Pensamiento completo.'
      },
      {
        id: 'snake-2',
        kpi: 'k8',
        prompt: 'Cadena de entrevista',
        ideas: ['I lacked experience', 'I prepared hard', 'I passed'],
        options: ['Although', 'therefore', 'on top of that', 'whatever'],
        answer: [0, 1, 2],
        patternHint: 'Although + prep + therefore/on top',
        explain: 'Although abre contraste; therefore / on top cierran victoria.'
      },
      {
        id: 'snake-3',
        kpi: 'k10',
        prompt: 'Cadena de meeting',
        ideas: ['risk is high', 'we slow down', 'we protect quality'],
        options: ['Because', 'as a result', 'in addition', 'nah'],
        answer: [0, 1, 2],
        explain: 'Because → as a result → in addition. Escalera lógica.'
      },
      {
        id: 'snake-4',
        kpi: 'k8',
        prompt: 'Cadena CS',
        ideas: ['the charge failed', 'I apologized', 'I fixed billing'],
        options: ['First', 'then', 'therefore', 'idk'],
        answer: [0, 1, 2],
        explain: 'First / then / therefore = servicio con cerebro.'
      },
      {
        id: 'snake-5',
        kpi: 'k8',
        prompt: 'Cadena de objeción',
        ideas: ['price feels high', 'value is coaching', 'students advance faster'],
        options: ['Although', 'however', 'as a result', 'nope'],
        answer: [0, 1, 2],
        explain: 'Although + however + as a result: objeción → valor → resultado.'
      },
      {
        id: 'snake-6',
        kpi: 'k10',
        prompt: 'Cadena de progreso personal',
        ideas: ['I used to freeze', 'I practiced daily', 'I speak with structure'],
        options: ['Because', 'on top of that', 'therefore', 'meh'],
        answer: [0, 1, 2],
        explain: 'Tu avance también es L+I+L. Eso es el método para el pueblo.'
      }
    ],
    phrasalswap: [
      {
        id: 'pswap-1',
        kpi: 'k12',
        prompt: 'Elegí el phrasal que cierra el L+I+L',
        clue: 'Because the numbers looked wrong, I ___ the error; therefore we fixed billing.',
        options: ['pointed out', 'gave up', 'turned off', 'ran away'],
        answer: 0,
        lil: { L1: 'Because', idea: 'numbers looked wrong', L2: 'therefore' },
        explain: 'Point out = señalar. El phrasal vive entre linkers.'
      },
      {
        id: 'pswap-2',
        kpi: 'k12',
        prompt: 'Phrasal bajo presión',
        clue: 'Although the call dropped, please ___ ; therefore we finish the answer.',
        options: ['carry on', 'give in', 'shut up', 'hang forever'],
        answer: 0,
        lil: { L1: 'Although', idea: 'call dropped', L2: 'therefore' },
        explain: 'Carry on mantiene la idea viva.'
      },
      {
        id: 'pswap-3',
        kpi: 'k15',
        prompt: 'CS phrasal',
        clue: 'Because the invoice is wrong, let me ___ today; on top of that I will email proof.',
        options: ['sort out', 'put off', 'turn down', 'look after cats'],
        answer: 0,
        lil: { L1: 'Because', idea: 'invoice wrong', L2: 'on top of that' },
        explain: 'Sort out = resolver el nudo.'
      },
      {
        id: 'pswap-4',
        kpi: 'k12',
        prompt: 'Interview phrasal',
        clue: 'I need to ___ my value clearly; therefore the panel remembers me.',
        options: ['get across', 'run out', 'set off', 'zone out'],
        answer: 0,
        lil: { L1: '—', idea: 'get across my value', L2: 'therefore' },
        explain: 'Get across = hacer entender tu idea.'
      },
      {
        id: 'pswap-5',
        kpi: 'k12',
        prompt: 'Meeting phrasal',
        clue: 'Can I ___ the budget risk now? Because if we wait, therefore we escalate later.',
        options: ['bring up', 'give up', 'turn down', 'chill out'],
        answer: 0,
        lil: { L1: 'Because', idea: 'if we wait', L2: 'therefore' },
        explain: 'Bring up = poner el tema en la mesa.'
      },
      {
        id: 'pswap-6',
        kpi: 'k12',
        prompt: 'Deadline phrasal',
        clue: 'We cannot ___ the launch again; as a result trust would drop.',
        options: ['put off', 'look for', 'set up', 'follow up'],
        answer: 0,
        lil: { L1: '—', idea: 'cannot put off', L2: 'as a result' },
        explain: 'Put off = posponer. Consecuencia con as a result.'
      }
    ]
  };

  var NEW_MODES = {
    bosscall: {
      title: 'Boss Call',
      icon: 'ti-phone-call',
      desc: 'Cliente enojado. Respondé con L+I+L bajo fuego.',
      category: 'bosscall',
      color: '#be123c',
      difficulty: 3,
      stars: '★★★ Frenzy',
      timed: true
    },
    star: {
      title: 'STAR Arena',
      icon: 'ti-stars',
      desc: 'Entrevista: armá Situation→Result con linkers.',
      category: 'star',
      color: '#7c3aed',
      difficulty: 2,
      stars: '★★ Pressure',
      build: true
    },
    listen: {
      title: 'Speed Listen',
      icon: 'ti-headphones',
      desc: 'Oí la cadena L+I+L y respondé YA.',
      category: 'listen',
      color: '#0891b2',
      difficulty: 2,
      stars: '★★ Pressure',
      timed: true,
      tts: true
    },
    tone: {
      title: 'Tone Police',
      icon: 'ti-mood-check',
      desc: 'Misma idea, tono profesional con linkers.',
      category: 'tone',
      color: '#059669',
      difficulty: 1,
      stars: '★ Easy'
    },
    nemesis: {
      title: 'Nemesis Duel',
      icon: 'ti-swords',
      desc: 'Solo tus fallos. Timer agresivo. Venganza útil.',
      category: 'mixed',
      color: '#b45309',
      difficulty: 3,
      stars: '★★★ Frenzy',
      timed: true,
      special: 'nemesis'
    },
    snake: {
      title: 'Linker Snake',
      icon: 'ti-route-2',
      desc: 'Encadená linker→idea→linker. Pensá en cadena.',
      category: 'snake',
      color: '#6d28d9',
      difficulty: 2,
      stars: '★★ Pressure',
      snake: true
    },
    phrasalswap: {
      title: 'Phrasal Swap',
      icon: 'ti-arrows-exchange',
      desc: 'El phrasal correcto dentro del L+I+L.',
      category: 'phrasalswap',
      color: '#1d4ed8',
      difficulty: 2,
      stars: '★★ Pressure'
    },
    dailyboss: {
      title: 'Daily Boss',
      icon: 'ti-crown',
      desc: 'Un jefe del día. Trophy rotativo. Volvé mañana.',
      category: 'bosscall',
      color: '#ca8a04',
      difficulty: 3,
      stars: '★★★ Frenzy',
      timed: true,
      special: 'daily'
    }
  };

  function ensureLilStyles() {
    if (document.getElementById('infinity-arcade-lil-styles')) return;
    var st = document.createElement('style');
    st.id = 'infinity-arcade-lil-styles';
    st.textContent =
      '@keyframes lilRibbonIn{0%{opacity:0;transform:translateY(10px) scale(.96)}100%{opacity:1;transform:none}}' +
      '@keyframes lilPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,211,238,0)}50%{box-shadow:0 0 0 6px rgba(34,211,238,.18)}}' +
      '@keyframes lilArrowSlide{0%{transform:translateX(-4px);opacity:.4}100%{transform:translateX(0);opacity:1}}' +
      '@keyframes lilBossIn{0%{opacity:0;transform:scale(.9) rotate(-1deg)}100%{opacity:1;transform:none}}' +
      '@keyframes lilListenWave{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1)}}' +
      '@keyframes lilSnakeGrow{0%{width:0;opacity:0}100%{width:100%;opacity:1}}' +
      '@keyframes lilAdvance{0%{transform:translateY(8px);opacity:0}100%{transform:none;opacity:1}}' +
      '.lil-ribbon{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin:0 0 12px;animation:lilRibbonIn .45s ease}' +
      '.lil-chip{font-family:"Press Start 2P",monospace;font-size:7px;padding:8px 10px;border-radius:8px;border:2px solid #111;box-shadow:2px 2px 0 #000;line-height:1.35;max-width:46%;animation:lilPulse 2.8s ease-in-out infinite}' +
      '.lil-chip.lil-l,.lil-chip.lil-l2{background:linear-gradient(135deg,#22d3ee,#38bdf8);color:#0f172a}' +
      '.lil-chip.lil-i{background:linear-gradient(135deg,#fde68a,#fbbf24);color:#111;max-width:70%}' +
      '.lil-arrow{width:14px;height:3px;background:#94a3b8;border-radius:2px;position:relative;animation:lilArrowSlide .5s ease}' +
      '.lil-arrow:after{content:"";position:absolute;right:-2px;top:-3px;border:4px solid transparent;border-left-color:#94a3b8}' +
      '.lil-mantra{text-align:center;font-family:"Press Start 2P",monospace;font-size:6px;letter-spacing:.08em;color:#67e8f9;opacity:.9;margin-top:10px;animation:lilAdvance .5s ease}' +
      '.lil-boss-card{animation:lilBossIn .4s cubic-bezier(.2,.8,.2,1);border:3px solid #fb7185!important}' +
      '.lil-scenario{font-family:ui-monospace,monospace;font-size:13px;line-height:1.45;background:#0f172a;color:#fecdd3;border-radius:8px;padding:12px;margin:0 0 12px;border:2px solid #fb7185}' +
      '.lil-listen-wave{display:flex;gap:4px;justify-content:center;align-items:flex-end;height:28px;margin:8px 0 12px}' +
      '.lil-listen-wave b{width:5px;background:linear-gradient(180deg,#22d3ee,#a78bfa);border-radius:2px;animation:lilListenWave 0.9s ease-in-out infinite}' +
      '.lil-listen-wave b:nth-child(2){animation-delay:.1s;height:70%}' +
      '.lil-listen-wave b:nth-child(3){animation-delay:.2s;height:100%}' +
      '.lil-listen-wave b:nth-child(4){animation-delay:.3s;height:60%}' +
      '.lil-listen-wave b:nth-child(5){animation-delay:.15s;height:85%}' +
      '.lil-snake-track{display:flex;flex-direction:column;gap:8px;margin:10px 0}' +
      '.lil-snake-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;padding:8px;border-radius:8px;background:rgba(15,23,42,.06);animation:lilSnakeGrow .35s ease}' +
      '.lil-snake-idea{font-size:12px;font-weight:800;color:#334155;padding:6px 8px;background:#fff;border:2px dashed #94a3b8;border-radius:8px}' +
      '.lil-snake-pick{min-width:110px}' +
      '.lil-progress-pip{display:inline-flex;gap:4px;margin:0 0 8px}' +
      '.lil-progress-pip i{width:10px;height:10px;border-radius:50%;background:#cbd5e1;border:2px solid #111}' +
      '.lil-progress-pip i.on{background:#22c55e;box-shadow:0 0 8px #22c55e}' +
      '.arcade-diff-new{display:inline-block;margin-left:6px;font-size:9px;padding:2px 6px;border-radius:999px;background:#fef3c7;color:#92400e;font-weight:900}' +
      '.lil-section-title{font-family:"Press Start 2P",monospace;font-size:8px;color:#7c3aed;margin:14px 0 8px;text-align:center;letter-spacing:.06em}';
    document.head.appendChild(st);
  }

  var _booted = false;

  function mergeModes() {
    if (typeof ARCADE_MODES === 'undefined') return;
    Object.keys(NEW_MODES).forEach(function (k) {
      ARCADE_MODES[k] = NEW_MODES[k];
    });
  }

  function mergeBank() {
    if (typeof ARCADE_BANK === 'undefined') return;
    Object.keys(LIL_BANK).forEach(function (cat) {
      var existing = ARCADE_BANK[cat] || [];
      if (existing.some(function (q) {
        var id = String((q && q.id) || '');
        return (
          id.indexOf('boss-') === 0 ||
          id.indexOf('snake-') === 0 ||
          id.indexOf('listen-') === 0 ||
          id.indexOf('tone-') === 0 ||
          id.indexOf('star-lil-') === 0 ||
          id.indexOf('pswap-') === 0
        );
      })) {
        return;
      }
      ARCADE_BANK[cat] = existing.concat(LIL_BANK[cat]);
    });
  }

  function crToday() {
    if (typeof arcadeCrToday === 'function') return arcadeCrToday();
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Costa_Rica' });
  }

  function dailyIndex(len) {
    var d = crToday().replace(/-/g, '');
    var n = parseInt(d, 10) || 1;
    return Math.abs(n) % Math.max(1, len);
  }

  function patchCategoryLabel() {
    if (typeof arcadeCategoryLabel !== 'function') return;
    var prev = arcadeCategoryLabel;
    global.arcadeCategoryLabel = function (cat) {
      var map = {
        bosscall: 'Boss Call',
        tone: 'Tone',
        listen: 'Listen',
        star: 'STAR',
        snake: 'Linker Snake',
        phrasalswap: 'Phrasal Swap',
        dailyboss: 'Daily Boss',
        nemesis: 'Nemesis'
      };
      return map[cat] || prev(cat);
    };
  }

  function pickFromCats(cats, count, s, allowRepeat) {
    var seen = allowRepeat ? [] : ((s && s.arcadeSeen) || global._arcadeSeen || []);
    var pool = [];
    var used = {};
    function push(q) {
      var key = typeof arcadeQuestionKey === 'function' ? arcadeQuestionKey(q) : q.id;
      if (!q || !key || used[key]) return;
      if (!allowRepeat && seen.indexOf(key) >= 0) return;
      used[key] = true;
      pool.push(q);
    }
    cats.forEach(function (cat) {
      shuffle(ARCADE_BANK[cat] || []).forEach(function (q) {
        push(Object.assign({ category: cat }, q));
      });
    });
    if (pool.length < count) {
      allowRepeat = true;
      cats.forEach(function (cat) {
        shuffle(ARCADE_BANK[cat] || []).forEach(function (q) {
          if (pool.length < count) {
            var key = q.id || cat;
            if (!used[key]) {
              used[key] = true;
              pool.push(Object.assign({ category: cat }, q));
            }
          }
        });
      });
    }
    return pool.slice(0, count);
  }

  function patchPickQuestions() {
    if (typeof pickArcadeQuestions !== 'function') return;
    var prev = pickArcadeQuestions;
    global.pickArcadeQuestions = function (mode, s, count, allowRepeat) {
      if (mode === 'nemesis') {
        var weak =
          typeof arcadeWeakCategories === 'function' ? arcadeWeakCategories(s) : [];
        var cats = weak.length ? weak : ['linker', 'structure', 'phrasal', 'bosscall', 'tone'];
        // Always sprinkle linkers so L+I+L stays present
        if (cats.indexOf('linker') < 0) cats = ['linker'].concat(cats);
        count = count || 8;
        return pickFromCats(cats, count, s, true);
      }
      if (mode === 'dailyboss') {
        var bosses = (ARCADE_BANK.bosscall || []).slice();
        if (!bosses.length) return prev(mode, s, count, allowRepeat);
        var idx = dailyIndex(bosses.length);
        var one = Object.assign({ category: 'bosscall', daily: true }, bosses[idx]);
        // Daily = 1 boss + 2 tone warmups with L+I+L
        var tones = pickFromCats(['tone'], 2, s, true);
        return [one].concat(tones).slice(0, 3);
      }
      if (mode === 'challenge' || mode === 'frenzy') {
        var base = prev(mode, s, count, allowRepeat) || [];
        // Inject 1–2 L+I+L performance items into mixed modes
        var inject = pickFromCats(['bosscall', 'tone', 'snake'], 2, s, true);
        return shuffle(base.concat(inject)).slice(0, count || base.length);
      }
      if (NEW_MODES[mode] && NEW_MODES[mode].category && NEW_MODES[mode].category !== 'mixed') {
        count = count || (NEW_MODES[mode].difficulty >= 3 ? 7 : 6);
        var cat = NEW_MODES[mode].category;
        var list = pickFromCats([cat], count, s, allowRepeat);
        if (cat === 'star' && typeof arcadeEnsureStructureSolvable === 'function') {
          list = list.map(function (q) {
            return arcadeEnsureStructureSolvable(q);
          });
        }
        return list;
      }
      return prev(mode, s, count, allowRepeat);
    };
  }

  function speakListen(text) {
    try {
      if (!global.speechSynthesis) return;
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text || ''));
      u.lang = 'en-US';
      u.rate = 0.95;
      global.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function bossBody(st, q) {
    var lil = q.lil || { L1: 'Because', idea: 'your next step', L2: 'therefore' };
    return (
      '<div class="arcade-game-card lil-boss-card">' +
      '<div class="arcade-game-label">BOSS CALL</div>' +
      lilRibbon(lil.L1, lil.idea, lil.L2) +
      '<div class="arcade-game-prompt">' +
      esc(q.prompt) +
      '</div>' +
      '<div class="lil-scenario">' +
      esc(q.scenario || '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="arcade-pix-opt" style="text-align:left;line-height:1.45;" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      lilFoot() +
      '</div>'
    );
  }

  function toneBody(st, q) {
    var lil = q.lil || { L1: 'Because', idea: 'clear message', L2: 'therefore' };
    return (
      '<div class="arcade-game-card">' +
      '<div class="arcade-game-label">TONE POLICE</div>' +
      lilRibbon(lil.L1, lil.idea, lil.L2) +
      '<div class="arcade-game-prompt">' +
      esc(q.prompt) +
      '</div>' +
      '<div class="arcade-game-clue">Elegí el tono que eleva al pueblo — no el que pelea.</div>' +
      '<div style="display:grid;grid-template-columns:1fr;gap:8px;">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="arcade-pix-opt" style="text-align:left;" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      lilFoot() +
      '</div>'
    );
  }

  function listenBody(st, q) {
    var lil = q.lil || { L1: 'Because', idea: 'what you heard', L2: 'therefore' };
    setTimeout(function () {
      speakListen(q.audioText);
    }, 280);
    return (
      '<div class="arcade-game-card">' +
      '<div class="arcade-game-label">SPEED LISTEN</div>' +
      lilRibbon(lil.L1, lil.idea, lil.L2) +
      '<div class="lil-listen-wave" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></div>' +
      '<div class="arcade-game-prompt">' +
      esc(q.prompt) +
      '</div>' +
      '<button type="button" class="arcade-pix-btn secondary" style="margin:0 auto 12px;display:block;" onclick="window._lilReplayListen && window._lilReplayListen()">REPLAY</button>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="arcade-pix-opt" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      lilFoot() +
      '</div>'
    );
  }

  function starBody(st, q) {
    var lil = q.lil || { L1: 'Although', idea: 'action', L2: 'therefore' };
    // Reuse structure builder UI with STAR label + ribbon
    if (typeof arcadeStructureBody === 'function') {
      var html = arcadeStructureBody(st, q);
      html = html.replace('STRUCTURE CREATOR', 'STAR ARENA');
      html = html.replace(
        '<div class="arcade-game-label">STAR ARENA</div>',
        '<div class="arcade-game-label">STAR ARENA</div>' + lilRibbon(lil.L1, lil.idea, lil.L2)
      );
      return html + lilFoot();
    }
    return toneBody(st, q);
  }

  function snakeBody(st, q) {
    st.snakePicks = st.snakePicks || [null, null, null];
    var ideas = q.ideas || ['idea A', 'idea B', 'idea C'];
    var opts = q.options || [];
    function row(i) {
      var selected = st.snakePicks[i];
      return (
        '<div class="lil-snake-row">' +
        '<select class="arcade-pix-opt lil-snake-pick" onchange="window._lilSnakePick(' +
        i +
        ', this.value)">' +
        '<option value="">linker…</option>' +
        opts
          .map(function (o, oi) {
            return (
              '<option value="' +
              oi +
              '"' +
              (String(selected) === String(oi) ? ' selected' : '') +
              '>' +
              esc(o) +
              '</option>'
            );
          })
          .join('') +
        '</select>' +
        '<span class="lil-snake-idea">' +
        esc(ideas[i]) +
        '</span>' +
        '</div>'
      );
    }
    return (
      '<div class="arcade-game-card">' +
      '<div class="arcade-game-label">LINKER SNAKE</div>' +
      lilRibbon('LINK', 'IDEA', 'LINK') +
      '<div class="arcade-game-prompt">' +
      esc(q.prompt) +
      '</div>' +
      '<div class="arcade-game-clue">Elegí 3 linkers que hagan sentido en orden.</div>' +
      '<div class="lil-snake-track">' +
      row(0) +
      row(1) +
      row(2) +
      '</div>' +
      '<button type="button" class="arcade-pix-btn" style="display:block;margin:0 auto;" onclick="window._lilSnakeSubmit()">CHECK CHAIN</button>' +
      lilFoot() +
      '</div>'
    );
  }

  function phrasalSwapBody(st, q) {
    var lil = q.lil || { L1: 'Because', idea: 'phrasal', L2: 'therefore' };
    return (
      '<div class="arcade-game-card">' +
      '<div class="arcade-game-label">PHRASAL SWAP</div>' +
      lilRibbon(lil.L1, lil.idea, lil.L2) +
      '<div class="arcade-game-prompt">' +
      esc(q.prompt) +
      '</div>' +
      '<div class="arcade-game-clue">' +
      esc(q.clue || '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      (q.options || [])
        .map(function (opt, i) {
          return (
            '<button type="button" class="arcade-pix-opt" onclick="arcadeChooseOption(' +
            i +
            ')">' +
            esc(opt) +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      lilFoot() +
      '</div>'
    );
  }

  function patchQuestionBody() {
    if (typeof arcadeQuestionBody !== 'function') return;
    var prev = arcadeQuestionBody;
    global.arcadeQuestionBody = function (st, q) {
      ensureLilStyles();
      global._lilReplayListen = function () {
        if (q && q.audioText) speakListen(q.audioText);
      };
      if (!q) return prev(st, q);
      if (q.category === 'bosscall') return bossBody(st, q);
      if (q.category === 'tone') return toneBody(st, q);
      if (q.category === 'listen') return listenBody(st, q);
      if (q.category === 'star') return starBody(st, q);
      if (q.category === 'snake') return snakeBody(st, q);
      if (q.category === 'phrasalswap') return phrasalSwapBody(st, q);
      // Subliminal ribbon on classic choice modes when explain/linkers present
      var html = prev(st, q);
      if (q.category === 'linker' || q.category === 'structure') {
        var ribbon = lilRibbon('LINK', 'your idea', 'LINK');
        html = html.replace('<div class="arcade-game-card">', '<div class="arcade-game-card">' + ribbon);
        if (html.indexOf('lil-mantra') < 0) html = html.replace('</div>', lilFoot() + '</div>');
      }
      return html;
    };
  }

  function patchStructureEnsure() {
    if (typeof arcadeEnsureStructureSolvable !== 'function') return;
    var prev = arcadeEnsureStructureSolvable;
    global.arcadeEnsureStructureSolvable = function (q) {
      if (q && q.category === 'star') {
        var copy = Object.assign({}, q, { category: 'structure' });
        var fixed = prev(copy);
        fixed.category = 'star';
        return fixed;
      }
      return prev(q);
    };
  }
    if (typeof renderArcadeRound !== 'function') return;
    var prev = renderArcadeRound;
    global.renderArcadeRound = function (st) {
      if (st) st.snakePicks = [null, null, null];
      return prev(st);
    };
  }

  global._lilSnakePick = function (idx, val) {
    var st = global._arcadeState;
    if (!st) return;
    st.snakePicks = st.snakePicks || [null, null, null];
    st.snakePicks[idx] = val === '' ? null : Number(val);
  };

  global._lilSnakeSubmit = function () {
    var st = global._arcadeState;
    if (!st) return;
    var q = st.quiz[st.idx];
    if (!q || q.category !== 'snake') return;
    var picks = st.snakePicks || [];
    var ans = q.answer || [];
    var correct =
      picks.length >= 3 &&
      picks.every(function (p, i) {
        return Number(p) === Number(ans[i]);
      });
    var labels = (picks || []).map(function (p) {
      return (q.options || [])[p] || '?';
    });
    if (typeof arcadeFinishQuestion === 'function') arcadeFinishQuestion(correct, labels.join(' → '));
  };

  function patchPressure() {
    if (typeof arcadePressureHtml !== 'function') return;
    var prev = arcadePressureHtml;
    global.arcadePressureHtml = function (st, q) {
      if (st && (st.mode === 'bosscall' || st.mode === 'dailyboss' || st.mode === 'nemesis')) {
        return (
          '<div class="arcade-pressure" aria-hidden="true">' +
          '<div class="arcade-focus-ring"><b></b></div>' +
          '<div class="arcade-pressure-inner">' +
          '<div class="arcade-pressure-dot"></div>' +
          '<div class="arcade-pressure-copy"><em>LIVE</em> ' +
          esc(st.modeTitle || 'BOSS') +
          '<span>LINK · IDEA · LINK — respondé con estructura, no con pánico.</span></div>' +
          '</div>' +
          '<div class="arcade-pressure-bar"><i></i></div>' +
          '</div>'
        );
      }
      if (st && st.mode === 'listen') {
        return (
          '<div class="arcade-pressure" aria-hidden="true">' +
          '<div class="arcade-focus-ring"><b></b></div>' +
          '<div class="arcade-pressure-inner">' +
          '<div class="arcade-pressure-dot"></div>' +
          '<div class="arcade-pressure-copy"><em>EAR</em> SPEED LISTEN<span>Escuchá los linkers: ahí está la idea.</span></div>' +
          '</div>' +
          '<div class="arcade-pressure-bar"><i></i></div>' +
          '</div>'
        );
      }
      return prev(st, q);
    };
  }

  function patchTimerArm() {
    if (typeof arcadeArmQuestionTimer !== 'function') return;
    var prev = arcadeArmQuestionTimer;
    global.arcadeArmQuestionTimer = function (st) {
      if (
        st &&
        (st.mode === 'bosscall' ||
          st.mode === 'dailyboss' ||
          st.mode === 'nemesis' ||
          st.mode === 'listen' ||
          st.mode === 'frenzy' ||
          st.mode === 'challenge')
      ) {
        // Force timed modes through existing timer by temporarily tagging
        var realMode = st.mode;
        if (realMode === 'bosscall' || realMode === 'dailyboss' || realMode === 'nemesis' || realMode === 'listen') {
          st.mode = realMode === 'listen' ? 'challenge' : 'frenzy';
          prev(st);
          st.mode = realMode;
          return;
        }
      }
      return prev(st);
    };
  }

  function patchRoundShellTimer() {
    // Ensure timer bar HTML for new timed modes
    if (typeof arcadeRoundShell !== 'function') return;
    var prev = arcadeRoundShell;
    global.arcadeRoundShell = function (st, q, body) {
      var timed =
        st.mode === 'bosscall' ||
        st.mode === 'dailyboss' ||
        st.mode === 'nemesis' ||
        st.mode === 'listen' ||
        st.mode === 'frenzy' ||
        st.mode === 'challenge';
      if (!timed) return prev(st, q, body);
      var fake = Object.assign({}, st, { mode: st.mode === 'listen' ? 'challenge' : 'frenzy' });
      return prev(fake, q, body).replace(
        'STREAK ' + fake.streak,
        'STREAK ' + st.streak
      );
    };
  }

  function patchPrizes() {
    if (typeof arcadeComputePrizes !== 'function') return;
    var prev = arcadeComputePrizes;
    global.arcadeComputePrizes = function (st, score, metaBefore, metaAfter) {
      var prizes = prev(st, score, metaBefore, metaAfter) || [];
      if (st.mode === 'bosscall' && score >= 80)
        prizes.push({ id: 'boss-tamer', icon: '📞', title: 'BOSS TAMER', coins: 35, xp: 25 });
      if (st.mode === 'nemesis' && score >= 70)
        prizes.push({ id: 'nemesis-down', icon: '⚔️', title: 'NEMESIS DOWN', coins: 40, xp: 30 });
      if (st.mode === 'dailyboss' && score >= 60)
        prizes.push({ id: 'daily-slayer-' + crToday(), icon: '👑', title: 'DAILY SLAYER', coins: 50, xp: 40 });
      if (st.mode === 'snake' && score >= 80)
        prizes.push({ id: 'chain-master', icon: '🐍', title: 'CHAIN MASTER', coins: 28, xp: 22 });
      if (st.mode === 'listen' && score >= 80)
        prizes.push({ id: 'ear-sharp', icon: '🎧', title: 'EAR SHARP', coins: 28, xp: 22 });
      if (st.mode === 'star' && score >= 85)
        prizes.push({ id: 'star-story', icon: '⭐', title: 'STAR STORY', coins: 30, xp: 24 });
      if (st.mode === 'tone' && score === 100)
        prizes.push({ id: 'tone-guardian', icon: '🕊️', title: 'TONE GUARDIAN', coins: 22, xp: 18 });
      // Deduplicate-ish
      var seen = {};
      var out = [];
      prizes.forEach(function (p) {
        if (!p || seen[p.id]) return;
        seen[p.id] = true;
        out.push(p);
      });
      return out.slice(-2);
    };
  }

  function patchXpBonus() {
    if (typeof arcadeApplyRoundMeta !== 'function') return;
    var prev = arcadeApplyRoundMeta;
    global.arcadeApplyRoundMeta = function (st, score) {
      var result = prev(st, score);
      if (!result || !result.meta) return result;
      var extra = 0;
      if (st.mode === 'bosscall' || st.mode === 'nemesis' || st.mode === 'dailyboss') extra = 12;
      else if (st.mode === 'listen' || st.mode === 'snake' || st.mode === 'star') extra = 8;
      else if (st.mode === 'tone' || st.mode === 'phrasalswap') extra = 5;
      if (extra) {
        result.meta.lifetimeXp = (result.meta.lifetimeXp || 0) + extra;
        result.xpGain = (result.xpGain || 0) + extra;
        if (typeof arcadePersistMeta === 'function') arcadePersistMeta(CURRENT_STUDENT, result.meta);
      }
      return result;
    };
  }

  function patchMenuBadge() {
    if (typeof renderArcadeMenuHtml !== 'function') return;
    var prev = renderArcadeMenuHtml;
    global.renderArcadeMenuHtml = function (containerId) {
      ensureLilStyles();
      var html = prev(containerId);
      // Insert section label before performance modes if not present
      if (html.indexOf('PERFORMANCE GAMES') < 0) {
        html = html.replace(
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;">',
          '<div class="lil-section-title">LANGUAGE + PERFORMANCE · ' +
            LIL_MANTRA +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;">'
        );
      }
      // Mark new modes
      Object.keys(NEW_MODES).forEach(function (key) {
        var title = NEW_MODES[key].title;
        html = html.replace(
          '>' + title + '</div>',
          '>' + title + ' <span class="arcade-diff-new">NEW</span></div>'
        );
      });
      return html;
    };
  }

  function patchMonitorGrid() {
    if (typeof openInfinityArcadeMonitor !== 'function') return;
    var prev = openInfinityArcadeMonitor;
    global.openInfinityArcadeMonitor = function () {
      prev();
      var grid = document.getElementById('inf-arcade-monitor-grid');
      if (!grid || typeof ARCADE_MODES === 'undefined') return;
      var keys = Object.keys(ARCADE_MODES).filter(function (k) {
        return k !== 'challenge';
      });
      grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;font-size:10px;color:#c4b5fd;margin-bottom:6px;">' +
        LIL_MANTRA +
        '</div>' +
        keys
          .map(function (key) {
            var m = ARCADE_MODES[key];
            var isNew = !!NEW_MODES[key];
            return (
              '<button type="button" onclick="infinityArcadeStartMode(\'' +
              key +
              '\')">' +
              (m.icon ? '<i class="ti ' + m.icon + '"></i> ' : '') +
              (m.title || key) +
              (isNew ? ' · NEW' : '') +
              '</button>'
            );
          })
          .join('');
    };
  }

  function patchFinishExplain() {
    if (typeof arcadeFinishQuestion !== 'function') return;
    var prev = arcadeFinishQuestion;
    global.arcadeFinishQuestion = function (correct, response) {
      prev(correct, response);
      var st = global._arcadeState;
      if (!st) return;
      var box = document.getElementById(st.containerId + '-result');
      if (!box || box.innerHTML.indexOf('lil-mantra') >= 0) return;
      var note = document.createElement('div');
      note.className = 'lil-mantra';
      note.style.marginTop = '8px';
      note.textContent = LIL_MANTRA + (correct ? ' ✓ cadena clara' : ' · rearmá la cadena');
      box.appendChild(note);
    };
  }

  function boot() {
    if (typeof ARCADE_MODES === 'undefined' || typeof pickArcadeQuestions !== 'function') return false;
    if (_booted) {
      mergeModes();
      return true;
    }
    mergeModes();
    mergeBank();
    ensureLilStyles();
    patchCategoryLabel();
    patchPickQuestions();
    patchQuestionBody();
    patchStructureEnsure();
    patchRenderRound();
    patchPressure();
    patchTimerArm();
    patchRoundShellTimer();
    patchPrizes();
    patchXpBonus();
    patchMenuBadge();
    patchMonitorGrid();
    patchFinishExplain();
    global.INFINITY_LIL_GAMES = { modes: NEW_MODES, bank: LIL_BANK, mantra: LIL_MANTRA };
    _booted = true;
    return true;
  }

  function scheduleBoot() {
    if (boot()) return;
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (boot() || tries > 50) clearInterval(t);
    }, 120);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBoot);
  } else {
    scheduleBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
