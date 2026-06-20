(function () {
  'use strict';

  var STORAGE_KEY = 'infinity-lang';
  var currentLang = 'en';

  var FLAG_US =
    '<svg class="flag flag-us" viewBox="0 0 640 480" aria-hidden="true">' +
    '<path fill="#bd3d44" d="M0 0h640v37.9H0zm0 75.8h640V114H0zm0 75.8h640v37.9H0zm0 75.8h640V266H0zm0 75.9h640v37.9H0zm0 76h640v37.8H0z"/>' +
    '<path fill="#fff" d="M0 37.9h640v37.9H0zm0 75.8h640v37.9H0zm0 75.8h640v37.9H0zm0 75.9h640v37.9H0z"/>' +
    '<path fill="#192f5d" d="M0 0h364.8v258.5H0z"/>' +
    '<g fill="#fff"><g id="s"><g id="r"><path id="t" d="M24.8 22.1l6.9 21.2h22.4l-18.1 13.2 6.9 21.2-18.1-13.2-18.1 13.2 6.9-21.2-18.1-13.2h22.4z"/></g>' +
    '<use href="#t" x="60.8"/><use href="#t" x="121.6"/><use href="#t" x="182.4"/><use href="#t" x="243.2"/></g>' +
    '<use href="#r" y="43"/><use href="#t" x="30.4" y="43"/><use href="#t" x="91.2" y="43"/><use href="#t" x="152" y="43"/><use href="#t" x="212.8" y="43"/><use href="#t" x="273.6" y="43"/></g>' +
    '<use href="#s" y="86"/><use href="#t" x="30.4" y="86"/><use href="#t" x="91.2" y="86"/><use href="#t" x="152" y="86"/><use href="#t" x="212.8" y="86"/><use href="#t" x="273.6" y="86"/></g>' +
    '</svg>';

  var FLAG_CR =
    '<svg class="flag flag-cr" viewBox="0 0 640 480" aria-hidden="true">' +
    '<path fill="#002b7f" d="M0 0h640v80H0zm0 160h640v80H0zm0 160h640v80H0z"/>' +
    '<path fill="#fff" d="M0 80h640v80H0zm0 160h640v80H0z"/>' +
    '<path fill="#ce1126" d="M0 160h640v80H0z"/>' +
    '</svg>';

  var NAV = [
    { s: 'a[href="#problem"]', en: 'The Problem', es: 'El Problema' },
    { s: 'a[href="#ecosystem"]', en: 'What You Get', es: '¿Qué Recibes?' },
    { s: '.nav-drop-btn', en: 'Programs', es: 'Programas' },
    { s: '.nav-drop-label:first-of-type', en: 'Core Training', es: 'Entrenamiento Core' },
    { s: '.nav-drop-label:last-of-type', en: 'Community', es: 'Comunidad' },
    { s: 'a[href="#programs"]', en: 'All Programs', es: 'Todos los Programas' },
    { s: 'a[href="#alice"]', en: 'Alice', es: 'Alice' },
    { s: 'a[href="#about"]', en: 'About', es: 'Nosotros' },
    { s: 'a[href="#contact"]', en: 'Contact', es: 'Contacto' },
    { s: '.nav-cta', en: 'Book Assessment', es: 'Agendar Evaluación' },
    { s: 'a[href="index.html#ecosystem"]', en: 'What You Get', es: '¿Qué Recibes?' },
    { s: 'a[href="index.html#contact"].nav-cta', en: 'Book Assessment', es: 'Agendar Evaluación' }
  ];

  var INDEX = [
    { s: '.hero-headline', en: 'More Than English.', es: 'Más que inglés.' },
    { s: '.hero-sub', html: true, en: 'We develop operational capacity through <strong>AI, simulations and real-time metrics.</strong>', es: 'Desarrollamos capacidad operacional mediante <strong>IA, simulaciones y métricas en tiempo real.</strong>' },
    { s: '.hero-lead', en: 'Track your progress, measure your performance and accelerate your growth from a platform built for the real world — all in the palm of your hand.', es: 'Seguí tu progreso, medí tu desempeño y acelerá tu crecimiento desde una plataforma diseñada para el mundo real, todo en la palma de tu mano.' },
    { s: '.hero-pills .pill:nth-child(1)', en: 'AI-Powered', es: 'Con IA' },
    { s: '.hero-pills .pill:nth-child(2)', en: 'KPI Tracking', es: 'Seguimiento KPI' },
    { s: '.hero-pills .pill:nth-child(3)', en: '26 Years Experience', es: '26 Años de Experiencia' },
    { s: '.hero-pills .pill:nth-child(4)', en: 'Real-Time Coaching', es: 'Coaching en Tiempo Real' },
    { s: '.hero-ctas .btn-primary', en: 'Book Your Assessment', es: 'Agenda Tu Evaluación' },
    { s: '.hero-ctas .btn-secondary', en: 'See The System', es: 'Ver El Sistema' },
    { s: '.stats-bar .stat-item:nth-child(1) .stat-label', en: 'Years of Industry Experience', es: 'Años de Experiencia en la Industria' },
    { s: '.stats-bar .stat-item:nth-child(2) .stat-label', en: 'Operational KPIs Tracked', es: 'KPIs Operacionales Medidos' },
    { s: '.stats-bar .stat-item:nth-child(3) .stat-label', en: 'AI Coaching with Alice', es: 'Coaching con Alice 24/7' },
    { s: '.stats-bar .stat-item:nth-child(4) .stat-label', en: 'Performance-Based', es: 'Basado en Desempeño' },
    { s: '#problem .section-tag', en: 'The Real Problem', es: 'El Problema Real' },
    { s: '#problem .section-title', en: 'Most people don\'t have an English problem.', es: 'La mayoría no tiene un problema de inglés.' },
    { s: '#problem .problem-text:first-of-type', html: true, en: 'They have an <span class="hl">execution problem.</span>', es: 'Tienen un <span class="hl">problema de ejecución.</span>' },
    { s: '#problem .problem-list li:nth-child(1)', html: true, en: '<i class="ti ti-check"></i>They <strong>understand</strong> English', es: '<i class="ti ti-check"></i><strong>Entienden</strong> inglés' },
    { s: '#problem .problem-list li:nth-child(2)', html: true, en: '<i class="ti ti-check"></i>They <strong>read</strong> English', es: '<i class="ti ti-check"></i><strong>Leen</strong> inglés' },
    { s: '#problem .problem-list li:nth-child(3)', html: true, en: '<i class="ti ti-check"></i>They <strong>write</strong> English', es: '<i class="ti ti-check"></i><strong>Escriben</strong> inglés' },
    { s: '#problem .problem-text:last-of-type', html: true, en: 'But when <strong>real interaction</strong> happens — under pressure, with a client, in a meeting, in a job interview...', es: 'Pero cuando ocurre la <strong>interacción real</strong> — bajo presión, con un cliente, en una reunión, en una entrevista...' },
    { s: '.freeze-word', html: true, en: 'They<br>Freeze.', es: 'Se<br>Paralizan.' },
    { s: '.freeze-sub', html: true, en: 'That\'s not an English problem.<br>That\'s an operational readiness problem.<br><br>And we solve it.', es: 'Eso no es un problema de inglés.<br>Es un problema de preparación operacional.<br><br>Y nosotros lo resolvemos.' },
    { s: '#comparison .section-tag', en: 'This Is Different', es: 'Esto Es Diferente' },
    { s: '#comparison .section-title', html: true, en: 'This Is <span style="color:var(--purple)">Not</span> An English Academy.', es: 'Esto <span style="color:var(--purple)">No</span> Es Una Academia de Inglés.' },
    { s: '#comparison .section-sub', en: 'No grammar drills. No textbooks. No certificates for participation. Just real operational capacity.', es: 'Sin gramática memorizada. Sin libros. Sin certificados por asistir. Solo capacidad operacional real.' },
    { s: '#ecosystem .section-tag', en: 'Your Student Kit', es: 'Tu Kit de Estudiante' },
    { s: '#ecosystem .section-title', html: true, en: 'What Do Our <span style="color:var(--purple)">Students Receive?</span>', es: '¿Qué Reciben Nuestros <span style="color:var(--purple)">Estudiantes?</span>' },
    { s: '#ecosystem .section-sub', en: 'Not classes. A complete operational system — AI coaching, live simulations, personalized exercises and real-time performance intelligence.', es: 'No son clases. Es un sistema operacional completo — coaching con IA, simulaciones en vivo, ejercicios personalizados e inteligencia de desempeño en tiempo real.' },
    { s: '.deliverables-tab[data-tab="training-book"]', en: 'Training Book', es: 'Training Book' },
    { s: '.deliverables-tab[data-tab="infinity-engine"]', en: 'Infinity Engine', es: 'Infinity Engine' },
    { s: '#panel-nexora .deliverable-intro h3', en: 'Nexora — Business Simulation Lab', es: 'Nexora — Laboratorio de Simulación Empresarial' },
    { s: '#panel-nexora .deliverable-intro p', en: 'Live-pressure scenarios before real life hits: STAR interviews, customer service calls, negotiations and crisis management — with voice, mic and instant feedback.', es: 'Escenarios bajo presión antes de la vida real: entrevistas STAR, llamadas de servicio al cliente, negociaciones y gestión de crisis — con voz, micrófono y feedback instantáneo.' },
    { s: '#panel-nexora .deliverable-feat:nth-child(1) span', en: 'Voice + microphone simulations', es: 'Simulaciones con voz y micrófono' },
    { s: '#panel-nexora .deliverable-feat:nth-child(2) span', en: 'Interview & CS scenarios', es: 'Escenarios de entrevista y CS' },
    { s: '#panel-nexora .deliverable-feat:nth-child(3) span', en: 'STAR evaluation in real time', es: 'Evaluación STAR en tiempo real' },
    { s: '#panel-nexora .btn-primary', en: 'Try Nexora — 5 min demo', es: 'Probar Nexora — demo 5 min' },
    { s: '#panel-nexora .btn-secondary', en: 'Book full assessment', es: 'Agendar evaluación completa' },
    { s: '#panel-alice .deliverable-intro h3', en: 'Alice — Your 24/7 AI Coach', es: 'Alice — Tu Coach de IA 24/7' },
    { s: '#panel-alice .deliverable-intro p', en: 'Alice doesn\'t give textbook answers. She coaches your connectors, structure and recovery — aligned to your KPIs and Training Book, available any time by voice or text.', es: 'Alice no da respuestas de libro. Entrena tus conectores, estructura y recuperación — alineada a tus KPIs y Training Book, disponible en cualquier momento por voz o texto.' },
    { s: '#panel-alice .deliverable-feat:nth-child(1) span', en: 'Speak or type — Alice listens', es: 'Hablá o escribí — Alice escucha' },
    { s: '#panel-alice .deliverable-feat:nth-child(2) span', en: 'Real-time correction', es: 'Corrección en tiempo real' },
    { s: '#panel-alice .deliverable-feat:nth-child(3) span', en: '24/7 availability', es: 'Disponible 24/7' },
    { s: '#panel-alice .btn-primary', en: 'Try Alice — 5 min demo', es: 'Probar Alice — demo 5 min' },
    { s: '#panel-alice .btn-secondary', en: 'Book full assessment', es: 'Agendar evaluación completa' },
    { s: '#panel-training-book .deliverable-intro h3', en: 'Training Book — Your Personal Development Plan', es: 'Training Book — Tu Plan de Desarrollo Personal' },
    { s: '#panel-training-book .deliverable-intro p', en: 'No two students share the same book. Every exercise targets your operational weaknesses — with KPI charts, phased progression and Alice integrated in the same platform.', es: 'Ningún estudiante comparte el mismo libro. Cada ejercicio apunta a tus debilidades operacionales — con gráficos KPI, progresión por fases y Alice integrada en la misma plataforma.' },
    { s: '#btn-open-tb-mock .btn-open-tb-label', en: 'Open Training Book', es: 'Abrir Training Book' },
    { s: '.tb-mock-hint-text', en: 'Scroll to explore the student view — preview only, not functional.', es: 'Deslizá para explorar la vista del estudiante — solo vista previa, no funcional.' },
    { s: '#panel-infinity-engine .deliverable-intro h3', en: 'Infinity Engine — The Brain Behind Everything', es: 'Infinity Engine — El Cerebro Detrás de Todo' },
    { s: '#panel-infinity-engine .deliverable-intro p', en: 'The platform where human expertise and artificial intelligence converge. Infinity Engine reads every session, rotates your learning path, updates KPIs and tells Alice exactly what to coach next.', es: 'La plataforma donde la experiencia humana y la inteligencia artificial convergen. Infinity Engine lee cada sesión, rota tu ruta de aprendizaje, actualiza KPIs y le dice a Alice exactamente qué entrenar después.' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(1) span', en: '5 operational KPIs — live tracking', es: '5 KPIs operacionales — seguimiento en vivo' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(2) span', en: 'AI diagnostics & pattern analysis', es: 'Diagnósticos IA y análisis de patrones' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(3) span', en: 'Adaptive rotation & learning paths', es: 'Rotación adaptativa y rutas de aprendizaje' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(4) span', en: 'Trainer dashboards & reporting', es: 'Dashboards de trainers e informes' },
    { s: '#panel-infinity-engine .engine-highlight p', html: true, en: '<strong>We didn\'t bolt AI onto a classroom.</strong> Infinity built the methodology for 26 years — then we united it with intelligence that never sleeps. The Engine analyzes how you think under pressure, predicts where you\'ll freeze, and rotates your Training Book before the gap becomes a habit. Human trainers set the standard. AI scales it to every minute between sessions. <strong>That\'s not EdTech. That\'s operational infrastructure.</strong>', es: '<strong>No pegamos IA encima de un aula.</strong> Infinity construyó la metodología durante 26 años — y la unimos con inteligencia que nunca duerme. El Engine analiza cómo pensás bajo presión, predice dónde te vas a paralizar y rota tu Training Book antes de que la brecha se vuelva hábito. Los trainers humanos marcan el estándar. La IA lo escala a cada minuto entre sesiones. <strong>Esto no es EdTech. Es infraestructura operacional.</strong>' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(1) .engine-stat-label', en: 'KPIs tracked weekly', es: 'KPIs medidos semanalmente' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(2) .engine-stat-label', en: 'AI + human sync', es: 'Sincronía IA + humano' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(3) .engine-stat-label', en: 'Adaptive learning loops', es: 'Ciclos adaptativos de aprendizaje' },
    { s: '#diff .section-tag', en: 'Why We\'re Different', es: 'Por Qué Somos Diferentes' },
    { s: '#diff .section-title', html: true, en: 'What Makes Us <span style="color:var(--gold)">Impossible</span> To Replicate', es: 'Lo Que Nos Hace <span style="color:var(--gold)">Imposibles</span> de Replicar' },
    { s: '#diff .section-sub', en: 'Not features. The result of 26 years building operational systems from the inside out.', es: 'No son funciones. Son 26 años construyendo sistemas operacionales desde adentro.' },
    { s: '#kpis .section-tag', en: 'Performance Metrics', es: 'Métricas de Desempeño' },
    { s: '#kpis .section-title', html: true, en: 'We Measure What <span style="color:var(--purple)">Actually Matters</span>', es: 'Medimos Lo Que <span style="color:var(--purple)">Realmente Importa</span>' },
    { s: '#kpis .section-sub', en: 'Not grammar. Not vocabulary lists. We track operational performance — the only metrics that predict real-world success.', es: 'No gramática. No listas de vocabulario. Medimos desempeño operacional — las únicas métricas que predicen éxito real.' },
    { s: '#about .section-tag', en: 'Built From Experience', es: 'Construido Con Experiencia' },
    { s: '#about .section-title', html: true, en: '26 Years In The Industry.<br><span style="color:var(--purple)">Not The Classroom.</span>', es: '26 Años en la Industria.<br><span style="color:var(--purple)">No en el Aula.</span>' },
    { s: '#about .section-sub', en: 'Every methodology, every KPI, every simulation was designed from direct operational experience — not a university curriculum.', es: 'Cada metodología, KPI y simulación fue diseñada desde experiencia operacional directa — no un currículo universitario.' },
    { s: '#programs .section-tag', en: 'Programs', es: 'Programas' },
    { s: '#programs .section-title', html: true, en: 'Core Training &amp; <span style="color:var(--gold)">Community</span>', es: 'Entrenamiento Core &amp; <span style="color:var(--gold)">Comunidad</span>' },
    { s: '#programs .section-sub', en: 'Foundations and ORT are the operational backbone. Off The Clock, The Conversatory and Job Finder are independent satellite programs for community, practice and employability.', es: 'Foundations y ORT son la columna operacional. Off The Clock, El Conversatorio y Job Finder son programas satélite para comunidad, práctica y empleabilidad.' },
    { s: '#core-programs .programs-split-head h3', en: 'Core Training Programs', es: 'Programas de Entrenamiento Core' },
    { s: '#core-programs .programs-split-head p', en: 'The structured operational training path — communication foundation and readiness under pressure.', es: 'La ruta estructurada — base comunicativa y preparación bajo presión.' },
    { s: '#community-programs .programs-split-head h3', en: 'Community Programs', es: 'Programas de Comunidad' },
    { s: '#community-programs .programs-split-head p:first-of-type', en: 'Satellite initiatives that support the ecosystem — not part of Foundations or ORT.', es: 'Iniciativas satélite que apoyan el ecosistema — no forman parte de Foundations ni ORT.' },
    { s: '#community-programs .programs-note', en: 'Purpose: community building, visibility, engagement, exposure and employability support.', es: 'Propósito: comunidad, visibilidad, engagement, exposición y apoyo en empleabilidad.' },
    { s: '.final-cta h2', html: true, en: 'Stop Studying English.<br><span>Start Operating In It.</span>', es: 'Deja de Estudiar Inglés.<br><span>Empieza a Operar En Él.</span>' },
    { s: '.final-cta p', en: 'The only system in Costa Rica built for operational readiness.', es: 'El único sistema en Costa Rica diseñado para preparación operacional.' },
    { s: '.final-cta .btn-gold', en: 'Schedule Your Assessment', es: 'Agenda Tu Evaluación' },
    { s: '#contact .section-tag', en: 'Contact', es: 'Contacto' },
    { s: '#contact .section-title', html: true, en: 'Ready To <span style="color:var(--purple)">Operate</span> In English?', es: '¿Listo Para <span style="color:var(--purple)">Operar</span> En Inglés?' },
    { s: '.contact-form h3', en: 'Book Your Assessment', es: 'Agenda Tu Evaluación' },
    { s: '.contact-form .form-group:nth-child(1) .form-label', en: 'Full Name', es: 'Nombre Completo' },
    { s: '#cf-name', attr: 'placeholder', en: 'Your name', es: 'Tu nombre' },
    { s: '.contact-form .form-group:nth-child(2) .form-label', en: 'Email', es: 'Correo' },
    { s: '#cf-email', attr: 'placeholder', en: 'your@email.com', es: 'tu@email.com' },
    { s: '.contact-form .form-group:nth-child(3) .form-label', en: 'WhatsApp', es: 'WhatsApp' },
    { s: '.contact-form .form-group:nth-child(4) .form-label', en: 'Program Interest', es: 'Programa de Interés' },
    { s: '.contact-form .form-group:nth-child(5) .form-label', en: 'Your goal', es: 'Tu objetivo' },
    { s: '.alice-badge', en: 'Powered by AI', es: 'Impulsado por IA' },
    { s: '.alice-title', en: 'Meet Alice — Your 24/7 Virtual Coach', es: 'Conoce a Alice — Tu Coach Virtual 24/7' },
    { s: '.alice-sub', en: 'Alice doesn\'t just answer questions. She coaches, corrects, challenges, and pushes you to operate in English — any time, anywhere. She knows your KPIs, your Training Book, and your weaknesses.', es: 'Alice no solo responde preguntas. Entrena, corrige, desafía y te impulsa a operar en inglés — en cualquier momento y lugar. Conoce tus KPIs, tu Training Book y tus debilidades.' },
    { s: 'a[href="try-alice.html"].btn-primary', en: 'Try Alice — 5 min', es: 'Probar Alice — 5 min' },
    { s: '#alice .btn-secondary', en: 'Try Nexora demo', es: 'Probar demo Nexora' },
    { s: '#alice a[href="#contact"].btn-primary', en: 'Book Your Assessment', es: 'Agenda Tu Evaluación' },
    { s: '.footer-links a[href="#problem"]', en: 'The Problem', es: 'El Problema' },
    { s: '.footer-links a[href="#ecosystem"]', en: 'What You Get', es: '¿Qué Recibes?' },
    { s: '.footer-links a[href="#programs"]', en: 'Programs', es: 'Programas' },
    { s: '.footer-links a[href="#alice"]', en: 'Alice', es: 'Alice' },
    { s: '.footer-links a[href="#about"]', en: 'About', es: 'Nosotros' },
    { s: '.footer-links a[href="#contact"]', en: 'Contact', es: 'Contacto' },
    { s: '#cf-goal', attr: 'placeholder', en: 'What do you want to achieve with operational English?', es: '¿Qué quieres lograr con inglés operacional?' },
    { s: '.contact-form .btn-primary', en: 'Send via WhatsApp', es: 'Enviar por WhatsApp' },
    { s: '.footer-copy', en: '© 2026 Off The Clock by ∞ Infinity · All rights reserved · studioinfinitycr.com', es: '© 2026 Off The Clock by ∞ Infinity · Todos los derechos reservados · studioinfinitycr.com' }
  ];

  function detectLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
    var browser = (navigator.language || 'en').toLowerCase();
    return browser.indexOf('es') === 0 ? 'es' : 'en';
  }

  function buildToggle() {
    return (
      '<div class="lang-toggle" role="group" aria-label="Language">' +
      '<button type="button" class="lang-btn" data-lang="en" aria-label="English" title="English">' +
      FLAG_US +
      '</button>' +
      '<button type="button" class="lang-btn" data-lang="es" aria-label="Español" title="Español">' +
      FLAG_CR +
      '</button>' +
      '</div>'
    );
  }

  function injectToggle() {
    var nav = document.querySelector('nav');
    if (!nav || nav.querySelector('.lang-toggle')) return;

    var cta = nav.querySelector('.nav-cta');
    var toggle = document.createElement('div');
    toggle.innerHTML = buildToggle();
    var el = toggle.firstElementChild;

    if (cta && cta.parentNode === nav) {
      var actions = nav.querySelector('.nav-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'nav-actions';
        nav.insertBefore(actions, cta);
        actions.appendChild(el);
        actions.appendChild(cta);
      } else {
        actions.insertBefore(el, cta);
      }
    } else {
      nav.appendChild(el);
    }

    el.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang'));
      });
    });
  }

  function applyEntry(entry, lang) {
    var nodes = document.querySelectorAll(entry.s);
    if (!nodes.length) return;
    var text = lang === 'es' ? entry.es : entry.en;
    nodes.forEach(function (node) {
      if (entry.attr) {
        var val = entry.attr === 'placeholder' && lang === 'es' ? (entry.placeholderEs || entry.es) : entry.attr === 'placeholder' ? (entry.placeholderEn || entry.en) : text;
        node.setAttribute(entry.attr, val);
      } else if (entry.html) {
        node.innerHTML = text;
      } else {
        node.textContent = text;
      }
    });
  }

  function applyProgramSelect(lang) {
    var sel = document.getElementById('cf-program');
    if (!sel || sel.dataset.i18nReady) return;
    var opts = sel.querySelectorAll('option');
    if (opts.length >= 4) {
      sel.dataset.i18nEn = opts[0].textContent + '|' + opts[1].textContent + '|' + opts[2].textContent + '|' + opts[3].textContent;
      sel.dataset.i18nEs = 'Programa Individual|Programa Corporativo|Programa Institucional|Aún no estoy seguro';
      sel.dataset.i18nReady = '1';
    }
    var parts = (lang === 'es' ? sel.dataset.i18nEs : sel.dataset.i18nEn || '').split('|');
    opts.forEach(function (opt, i) {
      if (parts[i]) opt.textContent = parts[i];
    });
  }

  function updateToggleUI(lang) {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'es') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    NAV.concat(INDEX).forEach(function (entry) {
      applyEntry(entry, lang);
    });
    applyProgramSelect(lang);
    updateToggleUI(lang);

    document.dispatchEvent(new CustomEvent('infinity:lang', { detail: { lang: lang } }));
  }

  function init() {
    injectToggle();
    currentLang = detectLang();
    setLang(currentLang);
  }

  window.InfinityI18n = { setLang: setLang, getLang: function () { return currentLang; } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
