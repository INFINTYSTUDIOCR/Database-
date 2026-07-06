(function () {
  'use strict';

  var STORAGE_KEY = 'infinity-lang';
  var currentLang = 'es';

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
    { s: 'a[href="#pricing"]', en: 'Pricing', es: 'Precios' },
    { s: 'a[href="#alice"]', en: 'Alice', es: 'Alice' },
    { s: 'a[href="#about"]', en: 'About', es: 'Nosotros' },
    { s: 'a[href="#contact"]', en: 'Contact', es: 'Contacto' },
    { s: '.nav-cta', en: 'Book diagnostic', es: 'Agenda diagnóstico' },
    { s: 'a[href="index.html#ecosystem"]', en: 'What You Get', es: '¿Qué Recibes?' },
    { s: 'a[href="index.html#contact"].nav-cta', en: 'Book diagnostic', es: 'Agenda diagnóstico' },
    { s: 'a[href="#contact"].nav-cta', en: 'Book diagnostic', es: 'Agenda diagnóstico' }
  ];

  var INDEX = [
    { s: '.hero-mirror-hope', en: 'We\'re not a language school. We help people who already know some English but freeze in interviews, calls or meetings.', es: 'No somos una academia. Ayudamos a gente que ya sabe algo de inglés pero se bloquea en entrevistas, llamadas o reuniones.' },
    { s: '.hero-tagline', en: 'Private video classes + AI practice · from Costa Rica for all Latin America', es: 'Clases privadas por videollamada + práctica con IA · desde Costa Rica para toda Latinoamérica' },
    { s: '.hero-headline', en: 'Stop going blank when it matters most.', es: 'Dejá de quedarte en blanco cuando más importa.' },
    { s: '.hero-pills .pill:nth-child(1)', en: '12 h/month with your coach', es: '12 h al mes con tu profe' },
    { s: '.hero-pills .pill:nth-child(2)', en: 'AI practice at night', es: 'Práctica con IA de noche' },
    { s: '.hero-pills .pill:nth-child(3)', en: 'We track your progress', es: 'Te decimos cómo vas' },
    { s: '.hero-ctas .btn-primary', en: 'Is this for me?', es: '¿Es para mí?' },
    { s: '.hero-ctas a[href="try-alice.html"]', en: 'Try free (no payment)', es: 'Probar gratis (sin pagar)' },
    { s: '.hero-photo-tag', html: true, en: '<i class="ti ti-user-heart"></i> Private 1-on-1', es: '<i class="ti ti-user-heart"></i> Privado 1 a 1' },
    { s: '.stats-bar .stat-item:nth-child(1) .stat-label', en: 'h/month private trainer', es: 'h/mes trainer privado' },
    { s: '.stats-bar .stat-item:nth-child(2) .stat-label', en: 'AI support', es: 'IA de apoyo' },
    { s: '.stats-bar .stat-item:nth-child(3) .stat-label', en: 'Weekly KPIs', es: 'KPIs semanales' },
    { s: '#elegi-tu-vida .section-tag', en: 'Your motivation', es: 'Tu motivación' },
    { s: '#elegi-tu-vida .section-title', html: true, en: 'What brings you <span style="color:var(--purple)">here?</span>', es: '¿Qué te trae <span style="color:var(--purple)">aquí?</span>' },
    { s: '#elegi-tu-vida .section-sub', en: 'Pick the real reason — we take you to the right path, not a generic course.', es: 'Elige el motivo real — te llevamos al camino correcto, no a un curso genérico.' },
    { s: '#elegi-tu-vida .who-more a', en: 'Try Alice Companion free →', es: 'Probar Alice Companion gratis →' },
    { s: '#para-mi .para-mi-head h2', en: 'Is this for you?', es: '¿Es para vos?' },
    { s: '#para-mi .who-grid a:nth-child(1) h3', html: true, en: '<i class="ti ti-seedling"></i> I barely know English', es: '<i class="ti ti-seedling"></i> Casi no sé inglés' },
    { s: '#para-mi .who-grid a:nth-child(2) h3', html: true, en: '<i class="ti ti-bolt"></i> I freeze when I speak', es: '<i class="ti ti-bolt"></i> Me trabo al hablar' },
    { s: '#para-mi .who-grid a:nth-child(3) h3', html: true, en: '<i class="ti ti-microphone"></i> I speak — need more practice', es: '<i class="ti ti-microphone"></i> Ya hablo — quiero practicar más' },
    { s: '#trust-proof span', html: true, en: '<strong>10</strong> documented placements · Goicoechea 2021', es: '<strong>10</strong> colocaciones documentadas · Goicoechea 2021' },
    { s: '#trust-proof a', en: 'See official case →', es: 'Ver caso oficial →' },
    { s: '#pricing .section-title', html: true, en: 'Clear pricing · <span style="color:var(--purple)">2026</span>', es: 'Precios claros · <span style="color:var(--purple)">2026</span>' },
    { s: '#pricing .section-sub', en: 'Plans with a trainer or AI-only. Prices in colones. LATAM: daily exchange rate + 8%.', es: 'Planes con trainer o solo IA. Precios en colones. LATAM: tipo de cambio del día + 8%.' },
    { s: '#pricing .pricing-home-actions .btn-primary', html: true, en: '<i class="ti ti-tags"></i> See full details', es: '<i class="ti ti-tags"></i> Ver detalle completo' },
    { s: '#pricing .pricing-home-actions .btn-secondary', html: true, en: '<i class="ti ti-calendar-check"></i> Book diagnostic', es: '<i class="ti ti-calendar-check"></i> Agenda diagnóstico' },
    { s: '#pricing .pricing-home-legal', en: 'Foundations & ORT: promo ₡67,500 (regular ₡75,000). Subject to availability · 90-min diagnostic, no commitment.', es: 'Foundations y ORT: promo ₡67.500 (regular ₡75.000). Sujeto a cupos · diagnóstico 90 min sin compromiso.' },
    { s: '#problem .section-tag', en: 'The Real Problem', es: 'El Problema Real' },
    { s: '#problem .section-title', en: 'Most people don\'t have an English problem.', es: 'La mayoría no tiene un problema de inglés.' },
    { s: '#problem .problem-text:first-of-type', html: true, en: 'They have an <span class="hl">execution problem.</span>', es: 'Tienen un <span class="hl">problema de ejecución.</span>' },
    { s: '#problem .problem-list li:nth-child(1)', html: true, en: '<i class="ti ti-check"></i>They <strong>understand</strong> English', es: '<i class="ti ti-check"></i><strong>Entienden</strong> inglés' },
    { s: '#problem .problem-list li:nth-child(2)', html: true, en: '<i class="ti ti-check"></i>They <strong>read</strong> English', es: '<i class="ti ti-check"></i><strong>Leen</strong> inglés' },
    { s: '#problem .problem-list li:nth-child(3)', html: true, en: '<i class="ti ti-check"></i>They <strong>write</strong> English', es: '<i class="ti ti-check"></i><strong>Escriben</strong> inglés' },
    { s: '#problem .problem-text:last-of-type', html: true, en: 'But when <strong>real interaction</strong> happens — under pressure, with a client, in a meeting, in a job interview...', es: 'Pero cuando ocurre la <strong>interacción real</strong> — bajo presión, con un cliente, en una reunión, en una entrevista...' },
    { s: '.freeze-word', html: true, en: 'They<br>Freeze.', es: 'Se<br>Paralizan.' },
    { s: '.freeze-sub', html: true, en: 'That\'s not an English problem.<br>That\'s an operational readiness problem.<br><br><strong>Infinity Studio CR</strong> was built for you — in Mexico, Chile, Colombia or wherever you are in LATAM — private sessions, not group classrooms.', es: 'Eso no es un problema de inglés.<br>Es un problema de preparación operacional.<br><br><strong>Infinity Studio CR</strong> fue creado para ti — en México, Chile, Colombia o donde estés en LATAM — sesiones privadas, no aulas grupales.' },
    { s: '#comparison .section-tag', en: 'This Is Different', es: 'Esto Es Diferente' },
    { s: '#comparison .section-title', html: true, en: 'This Is <span style="color:var(--purple)">Not</span> Just Another English Academy.', es: 'Esto <span style="color:var(--purple)">no</span> es una academia más de inglés.' },
    { s: '#comparison .section-sub', en: 'Private sessions for one person: you. No crowded classrooms in any country — just your pain point, your Training Book, your results.', es: 'Sesiones privadas para una persona: tú. Sin aulas llenas en ningún país — solo tu dolor, tu Training Book, tus resultados.' },
    { s: '#ecosystem .section-tag', en: 'Your Student Kit', es: 'Tu Kit de Estudiante' },
    { s: '#ecosystem .section-title', html: true, en: 'What Do Our <span style="color:var(--purple)">Students Receive?</span>', es: '¿Qué Reciben Nuestros <span style="color:var(--purple)">Estudiantes?</span>' },
    { s: '#ecosystem .section-sub', en: 'Not group lessons. A private operational system — your trainer, AI support, simulations and metrics, where you freeze.', es: 'No son clases grupales. Es un sistema operacional privado — tu trainer, IA de apoyo, simulaciones y métricas, donde te paralizas.' },
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
    { s: '#panel-infinity-engine .deliverable-intro h3', en: 'Infinity Engine — The Brain Behind Everything', es: 'Infinity Engine — El cerebro del sistema' },
    { s: '#panel-infinity-engine .deliverable-intro p', en: 'The platform where human expertise and artificial intelligence converge. Infinity Engine reads every session, rotates your learning path, updates KPIs and tells Alice exactly what to coach next.', es: 'La plataforma donde la experiencia humana y la inteligencia artificial convergen. Infinity Engine lee cada sesión, rota tu ruta de aprendizaje, actualiza KPIs y le dice a Alice exactamente qué entrenar después.' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(1) span', en: '5 operational KPIs — live tracking', es: '5 KPIs operacionales — seguimiento en vivo' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(2) span', en: 'AI diagnostics & pattern analysis', es: 'Diagnósticos IA y análisis de patrones' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(3) span', en: 'Adaptive rotation & learning paths', es: 'Rotación adaptativa y rutas de aprendizaje' },
    { s: '#panel-infinity-engine .deliverable-feat:nth-child(4) span', en: 'Trainer dashboards & reporting', es: 'Dashboards de trainers e informes' },
    { s: '#panel-infinity-engine .engine-highlight p', html: true, en: '<strong>We didn\'t bolt AI onto a classroom.</strong> Infinity built the methodology for 26 years — then we united it with intelligence that never sleeps. The Engine analyzes how you think under pressure, predicts where you\'ll freeze, and rotates your Training Book before the gap becomes a habit. Human trainers set the standard. AI scales it to every minute between sessions. <strong>That\'s not EdTech. That\'s operational infrastructure.</strong>', es: '<strong>No pegamos IA encima de un aula.</strong> Infinity construyó la metodología durante 26 años — y la unimos con inteligencia que nunca duerme. El Engine analiza cómo piensas bajo presión, predice dónde te vas a paralizar y rota tu Training Book antes de que la brecha se vuelva hábito. Los trainers humanos marcan el estándar. La IA lo escala a cada minuto entre sesiones. <strong>Esto no es EdTech. Es infraestructura operacional.</strong>' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(1) .engine-stat-label', en: 'KPIs tracked weekly', es: 'KPIs medidos semanalmente' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(2) .engine-stat-label', en: 'AI + human sync', es: 'Sincronía IA + humano' },
    { s: '#panel-infinity-engine .engine-stat:nth-child(3) .engine-stat-label', en: 'Adaptive learning loops', es: 'Ciclos adaptativos' },
    { s: '#diff .section-tag', en: 'Why We\'re Different', es: 'Por Qué Somos Diferentes' },
    { s: '#diff .section-title', html: true, en: 'What Makes Us <span style="color:var(--gold)">Impossible</span> To Replicate', es: 'Lo Que Nos Hace <span style="color:var(--gold)">Imposibles</span> de Replicar' },
    { s: '#diff .section-sub', en: 'Not features. The result of 26 years building operational systems from the inside out.', es: 'No son funciones. Son 26 años construyendo sistemas operacionales desde adentro.' },
    { s: '#kpis .section-tag', en: 'Performance Metrics', es: 'Métricas de Desempeño' },
    { s: '#kpis .section-title', html: true, en: 'We Measure What <span style="color:var(--purple)">Actually Matters</span>', es: 'Medimos Lo Que <span style="color:var(--purple)">Realmente Importa</span>' },
    { s: '#kpis .section-sub', en: 'Not grammar. Not vocabulary lists. We track operational performance — the only metrics that predict real-world success.', es: 'No gramática. No listas de vocabulario. Medimos desempeño operacional — las únicas métricas que predicen éxito real.' },
    { s: '#pricing .section-tag', en: 'Investment', es: 'Inversión' },
    { s: '.footer-links a[href="#pricing"]', en: 'Pricing', es: 'Precios' },
    { s: '#about .section-tag', en: 'Built From Experience', es: 'Construido Con Experiencia' },
    { s: '#about .section-title', html: true, en: '26 Years In The Industry.<br><span style="color:var(--purple)">Not The Classroom.</span>', es: '26 Años en la Industria.<br><span style="color:var(--purple)">No en el Aula.</span>' },
    { s: '#about .section-sub', en: 'Every methodology, every KPI, every simulation was designed from direct operational experience — not a university curriculum.', es: 'Cada metodología, KPI y simulación fue diseñada desde experiencia operacional directa — no un currículo universitario.' },
    { s: 'a[href="#success-stories"]', en: 'Success Stories', es: 'Casos de Éxito' },
    { s: 'a[href="#who-its-for"]', en: 'Who It\'s For', es: 'Para Quién' },
    { s: '#who-its-for .section-tag', en: 'Who It\'s For', es: 'Para Quién' },
    { s: '#who-its-for .section-title', html: true, en: 'Built for People Who <span style="color:var(--purple)">Freeze When It Counts</span>', es: 'Creado para Personas que se <span style="color:var(--purple)">Paralizan Cuando Importa</span>' },
    { s: '#who-its-for .section-sub', en: 'Private operational English — not group classrooms. If you understand English but fail under pressure, this system was built for you.', es: 'Inglés operacional privado — no aulas grupales. Si entendés inglés pero fallás bajo presión, este sistema fue creado para vos.' },
    { s: '#who-its-for .who-card:nth-child(1) h3', html: true, en: '<i class="ti ti-headset"></i> Call center &amp; BPO', es: '<i class="ti ti-headset"></i> Call center y BPO' },
    { s: '#who-its-for .who-card:nth-child(1) p', en: 'Pass interviews, handle clients in English, perform from day one — not just pass a level test.', es: 'Pasá entrevistas, atendé clientes en inglés, performá desde el día uno — no solo aprobar un examen de nivel.' },
    { s: '#who-its-for .who-card:nth-child(1) a', en: 'ORT program →', es: 'Programa ORT →' },
    { s: '#who-its-for .who-card:nth-child(2) h3', html: true, en: '<i class="ti ti-briefcase"></i> Remote &amp; international roles', es: '<i class="ti ti-briefcase"></i> Roles remotos e internacionales' },
    { s: '#who-its-for .who-card:nth-child(2) p', en: 'Meetings, stakeholders, negotiations — respond fast and structured without going blank.', es: 'Reuniones, stakeholders, negociaciones — respondé rápido y estructurado sin quedarte en blanco.' },
    { s: '#who-its-for .who-card:nth-child(2) a', en: 'ORT program →', es: 'Programa ORT →' },
    { s: '#who-its-for .who-card:nth-child(3) h3', html: true, en: '<i class="ti ti-book"></i> Weak base, academies failed you', es: '<i class="ti ti-book"></i> Base débil, las academias no sirvieron' },
    { s: '#who-its-for .who-card:nth-child(3) p', en: 'Install communication routes from zero — chunks, linkers, structure — before operational pressure.', es: 'Instalá rutas de comunicación desde cero — chunks, conectores, estructura — antes de la presión operacional.' },
    { s: '#who-its-for .who-card:nth-child(3) a', en: 'Structural foundations (Foundations) →', es: 'Fundamentos estructurales (Foundations) →' },
    { s: '#who-its-for .who-card:nth-child(4) h3', html: true, en: '<i class="ti ti-microphone"></i> Already speak — need volume practice', es: '<i class="ti ti-microphone"></i> Ya hablás — necesitás práctica masiva' },
    { s: '#who-its-for .who-card:nth-child(4) p', en: 'STAR interviews, difficult clients, instant scoring — without paying per hour of role-play.', es: 'Entrevistas STAR, clientes difíciles, puntaje instantáneo — sin pagar por hora de role-play.' },
    { s: '#who-its-for .who-card:nth-child(4) a', en: 'Nexora Pro →', es: 'Nexora Pro →' },
    { s: '#who-its-for .who-card:nth-child(5) h3', html: true, en: '<i class="ti ti-school"></i> Bilingual schools &amp; institutions', es: '<i class="ti ti-school"></i> Colegios bilingües e instituciones' },
    { s: '#who-its-for .who-card:nth-child(5) p', en: 'ORT pilots for high-performance bilingual employability — KPIs, not grammar scores.', es: 'Pilotos ORT para empleabilidad bilingüe de alto desempeño — KPIs, no puntajes de gramática.' },
    { s: '#who-its-for .who-card:nth-child(5) a', en: 'Institutional inquiry →', es: 'Consulta institucional →' },
    { s: '#who-its-for .who-card:nth-child(6) h3', html: true, en: '<i class="ti ti-building-community"></i> Public sector &amp; municipalities', es: '<i class="ti ti-building-community"></i> Sector público y municipalidades' },
    { s: '#who-its-for .who-card:nth-child(6) p', en: 'Youth employability programs with documented transparency outcomes.', es: 'Programas de empleabilidad juvenil con resultados documentados en transparencia.' },
    { s: '#who-its-for .who-card:nth-child(6) a', en: 'Goicoechea case →', es: 'Caso Goicoechea →' },
    { s: '#who-its-for .who-more', html: true, en: '<a href="para-quien.html">Full audience guide (para quién) →</a> · <a href="casos-de-exito.html">Documented success stories →</a>', es: '<a href="para-quien.html">Guía completa para quién →</a> · <a href="casos-de-exito.html">Casos de éxito documentados →</a>' },
    { s: '.footer-links a[href="#success-stories"]', en: 'Success Stories', es: 'Casos de Éxito' },
    { s: '#success-stories .section-tag', en: 'Success Stories', es: 'Casos de Éxito' },
    { s: '#success-stories .section-title', html: true, en: 'Documented Impact — <span style="color:var(--purple)">Not Marketing Claims</span>', es: 'Impacto Documentado — <span style="color:var(--purple)">No Claims de Marketing</span>' },
    { s: '#success-stories .section-sub', en: 'Public-sector pilots with measurable outcomes — municipal transparency reports and documented employability results.', es: 'Pilotos del sector público con resultados medibles — informes de transparencia municipal y empleabilidad documentada.' },
    { s: '#success-stories .success-badge', en: 'Public sector · Goicoechea · 2021', es: 'Sector público · Goicoechea · 2021' },
    { s: '#success-stories .success-document h3', en: 'Municipalidad de Goicoechea — Call Center Readiness Pilot', es: 'Municipalidad de Goicoechea — Piloto de Preparación para Call Center' },
    { s: '#success-stories .success-report-heading', en: 'Informe de Labores 2022 — official excerpt', es: 'Informe de Labores 2022 — cita textual oficial' },
    { s: '#success-stories .success-report-ref', en: 'Section «Cursos de inglés preparatorios para call center» · page 34 · Municipalidad de Goicoechea', es: 'Sección «Cursos de inglés preparatorios para call center» · p. 34 · Municipalidad de Goicoechea' },
    { s: '#success-stories .success-excerpt-lead', en: 'Cursos de inglés preparatorios para call center', es: 'Cursos de inglés preparatorios para call center' },
    { s: '#success-stories .success-excerpt p:nth-of-type(2)', en: 'As part of the strategic alliances carried out by this Administration, an English course was held for young people in the canton of Goicoechea, aimed at preparing them for call-center interviews so they could be placed more quickly in a job.', es: 'Como parte de las alianzas estratégicas realizadas por parte de esta Administración, se logró realizar un curso de inglés dirigido a jóvenes del cantón de Goicoechea, con la finalidad de prepararles para la entrevista en los call center y así pudieran colocarse de manera más expedita en un puesto de trabajo.' },
    { s: '#success-stories .success-excerpt p:nth-of-type(3)', en: '90 of the 100 selected started the course and it was reduced to 60 due to schedule and work conflicts. 25 remain in basic preparatory classes, 10 were successfully placed in confirmed employment, and 15 were still in the application process. The course had no cost for beneficiaries — it was financed by a private company as a pilot plan in our canton.', es: 'Este curso lo iniciaron 90 de las 100 escogidas y se redujó a 60 debido a diversos conflictos de horario y trabajo de las y los interesados, aún continúan en clase preparatoria 25 del grupo de básico y 10 han sido colocados exitosamente en un empleo confirmado, a este momento 15 aún están en proceso de aplicación. Este curso no representaba ningún costo para los y las beneficiadas, ya que fue financiado por la empresa privada, como parte de un plan piloto en nuestro Cantón.' },
    { s: '#success-stories .success-excerpt p:nth-of-type(4)', en: 'The goal is for more young people to enroll in the project and thereby help improve living conditions for residents of our canton.', es: 'El objetivo es lograr que más jóvenes puedan inscribirse en el proyecto y con esto contribuir a mejorar las condiciones de vida de los y las habitantes de nuestro cantón.' },
    { s: '#success-stories .success-video-channel', html: true, en: '<i class="ti ti-brand-facebook"></i> Municipalidad de Goicoechea · Facebook', es: '<i class="ti ti-brand-facebook"></i> Municipalidad de Goicoechea · Facebook' },
    { s: '#success-stories .success-video-title', en: 'YOUNG GRADUATES OF ENGLISH COURSE ALREADY WORKING THANKS TO ALLIANCE BETWEEN GOICOECHEA MUNICIPALITY AND TU506', es: 'JÓVENES QUE RECIBIERON CURSO DE INGLÉS YA TRABAJAN GRACIAS A ALIANZA DE MUNICIPALIDAD DE GOICOECHEA Y TU506' },
    { s: '#success-stories .success-video-note', html: true, en: 'Official municipal coverage · <strong>TU506</strong> (Training United 506) is our legacy name — today <strong>Infinity Studio CR</strong> · Program led by our founder', es: 'Cobertura municipal oficial · <strong>TU506</strong> (Training United 506) es nuestro nombre anterior — hoy <strong>Infinity Studio CR</strong> · Programa liderado por nuestro fundador' },
    { s: '#success-stories .success-legacy-note', html: true, en: '<strong>TU506 → Infinity Studio CR.</strong> Training United 506 (TU506) was our name when this municipal alliance ran in 2021 — same methodology, same founder. Our founder designed and led the program as head instructor.', es: '<strong>TU506 → Infinity Studio CR.</strong> Training United 506 (TU506) era nuestro nombre cuando corrió esta alianza municipal en 2021 — misma metodología, mismo fundador. Nuestro fundador diseñó y lideró el programa como instructor principal.' },
    { s: '#success-stories .success-video-link', html: true, en: '<i class="ti ti-brand-facebook"></i> Watch video on Facebook <i class="ti ti-external-link" style="font-size:12px;"></i>', es: '<i class="ti ti-brand-facebook"></i> Ver video en Facebook <i class="ti ti-external-link" style="font-size:12px;"></i>' },
    { s: '#success-stories .success-metrics li:nth-child(1) .success-metric-label', en: 'Residents started (of 100 selected)', es: 'Residentes iniciaron (de 100 seleccionados)' },
    { s: '#success-stories .success-metrics li:nth-child(2) .success-metric-label', en: 'Confirmed hires in call-center roles', es: 'Contrataciones confirmadas en call center' },
    { s: '#success-stories .success-metrics li:nth-child(3) .success-metric-label', en: 'In active application process', es: 'En proceso activo de aplicación' },
    { s: '#success-stories .success-metrics li:nth-child(4) .success-metric-label', en: 'Still in preparatory training', es: 'Aún en entrenamiento preparatorio' },
    { s: '#success-stories .success-link.official', html: true, en: '<i class="ti ti-file-certificate"></i> Official source — Informe de Labores 2022 (p. 34) <i class="ti ti-external-link" style="font-size:12px;"></i>', es: '<i class="ti ti-file-certificate"></i> Fuente oficial — Informe de Labores 2022 (p. 34) <i class="ti ti-external-link" style="font-size:12px;"></i>' },
    { s: '#success-stories .success-links a:nth-child(2)', html: true, en: '<i class="ti ti-building-community"></i> Portal Transparencia · Municipalidad de Goicoechea <i class="ti ti-external-link" style="font-size:12px;"></i>', es: '<i class="ti ti-building-community"></i> Portal Transparencia · Municipalidad de Goicoechea <i class="ti ti-external-link" style="font-size:12px;"></i>' },
    { s: '#success-stories .success-source', en: 'Video title and coverage published by the Municipality on Facebook. Report text quoted verbatim from the transparency portal PDF.', es: 'Título y cobertura publicados por la Municipalidad en Facebook. Texto del informe citado textualmente del PDF del portal de transparencia.' },
    { s: '#programs .section-tag', en: 'Programs', es: 'Programas' },
    { s: '#programs .section-title', html: true, en: 'Core Training &amp; <span style="color:var(--gold)">Community</span>', es: 'Entrenamiento Core &amp; <span style="color:var(--gold)">Comunidad</span>' },
    { s: '#programs .section-sub', en: 'Fundamentos estructurales (Foundations) and ORT are the backbone. Off The Clock, El Conversatorio and Job Finder are community and employability satellites.', es: 'Fundamentos estructurales (Foundations) y ORT son la columna vertebral. Off The Clock, El Conversatorio y Job Finder son satélites de comunidad y empleabilidad.' },
    { s: '#core-programs .programs-split-head h3', en: 'Core Training Programs', es: 'Programas de Entrenamiento Core' },
    { s: '#core-programs .programs-split-head p', en: 'The structured operational training path — communication foundation and readiness under pressure.', es: 'La ruta estructurada — base comunicativa y preparación bajo presión.' },
    { s: '#community-programs .programs-split-head h3', en: 'Community Programs', es: 'Programas de Comunidad' },
    { s: '#community-programs .programs-split-head p:first-of-type', en: 'Satellite initiatives — not Fundamentos estructurales (Foundations) or ORT.', es: 'Iniciativas satélite — no son Fundamentos estructurales (Foundations) ni ORT.' },
    { s: '#community-programs .programs-note', en: 'Purpose: community building, visibility, engagement, exposure and employability support.', es: 'Comunidad, visibilidad, práctica en vivo y apoyo en empleabilidad — complementan, no reemplazan, Fundamentos estructurales (Foundations) ni ORT.' },
    { s: '.final-cta h2', html: true, en: 'Private training.<br><span>Not classrooms.</span>', es: 'Entrenamiento privado.<br><span>No aulas grupales.</span>' },
    { s: '.final-cta p', en: 'The same pain in Chile, Mexico or Colombia: you understand English but freeze when it counts.', es: 'El mismo dolor en Chile, México o Colombia: entiendes inglés pero te paralizas cuando importa.' },
    { s: '.final-cta .btn-gold', en: 'Discover your score in 90 minutes', es: 'Descubre tu score en 90 minutos' },
    { s: '#contact .section-tag', en: 'Contact', es: 'Contacto' },
    { s: '#contact .section-title', html: true, en: 'Ready To <span style="color:var(--purple)">Operate</span> In English?', es: '¿Listo Para <span style="color:var(--purple)">Operar</span> En Inglés?' },
    { s: '.contact-form h3', en: 'Book your diagnostic session', es: 'Agenda tu sesión de diagnóstico' },
    { s: '.contact-form .form-group:nth-child(2) .form-label', en: 'Full name', es: 'Nombre completo' },
    { s: '#cf-name', attr: 'placeholder', en: 'Your name', es: 'Tu nombre' },
    { s: '.contact-form .form-group:nth-child(3) .form-label', en: 'Email', es: 'Correo' },
    { s: '#cf-email', attr: 'placeholder', en: 'you@email.com', es: 'tu@correo.com' },
    { s: '.contact-form .form-group:nth-child(4) .form-label', en: 'WhatsApp', es: 'WhatsApp' },
    { s: '#cf-phone', attr: 'placeholder', en: '+52, +56, +57…', es: '+52, +56, +57…' },
    { s: '.contact-form .form-group:nth-child(5) .form-label', en: 'Program of interest', es: 'Programa de interés' },
    { s: '.contact-form .form-group:nth-child(6) .form-label', en: 'Your goal', es: 'Tu meta' },
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
    { s: '.footer-links a[href="#who-its-for"]', en: 'Who It\'s For', es: 'Para Quién' },
    { s: '.footer-links a[href="para-quien.html"]', en: 'Para quién', es: 'Para quién' },
    { s: '.footer-links a[href="casos-de-exito.html"]', en: 'Casos de éxito', es: 'Casos de éxito' },
    { s: '#cf-goal', attr: 'placeholder', en: 'What do you want to achieve with operational English?', es: '¿Qué quieres lograr con inglés operacional?' },
    { s: '.contact-form .btn-primary', en: 'Send via WhatsApp', es: 'Enviar por WhatsApp' },
    { s: '.footer-copy', en: '© 2026 Infinity Studio CR · All rights reserved · studioinfinitycr.com', es: '© 2026 Infinity Studio CR · Todos los derechos reservados · studioinfinitycr.com' }
  ];

  var INDEX_MORE = [
    { s: '.comp-card.trad .comp-title', html: true, en: '<i class="ti ti-x" style="color:#EF4444"></i>Traditional English', es: '<i class="ti ti-x" style="color:#EF4444"></i>Inglés Tradicional' },
    { s: '.comp-card.trad .comp-item:nth-child(2)', en: 'Grammar memorization', es: 'Memorización de gramática' },
    { s: '.comp-card.trad .comp-item:nth-child(3)', en: 'Homework assignments', es: 'Tareas para la casa' },
    { s: '.comp-card.trad .comp-item:nth-child(4)', en: 'Levels A1, A2, B1...', es: 'Niveles A1, A2, B1...' },
    { s: '.comp-card.trad .comp-item:nth-child(5)', en: 'One-size-fits-all tests', es: 'Exámenes genéricos para todos' },
    { s: '.comp-card.trad .comp-item:nth-child(6)', en: 'Participation certificates', es: 'Certificados por asistir' },
    { s: '.comp-card.trad .comp-item:nth-child(7)', en: 'Academic fluency only', es: 'Solo fluidez académica' },
    { s: '.comp-card.trad .comp-item:nth-child(8)', en: 'Group classes with strangers', es: 'Clases grupales con desconocidos' },
    { s: '.comp-card.otc .comp-title', html: true, en: '<i class="ti ti-rocket"></i>Infinity Studio CR System', es: '<i class="ti ti-rocket"></i>Sistema Infinity Studio CR' },
    { s: '.comp-card.otc .comp-item:nth-child(2)', en: 'Private 1-on-1 sessions', es: 'Sesiones privadas 1 a 1' },
    { s: '.comp-card.otc .comp-item:nth-child(3)', en: 'Real-time interaction', es: 'Interacción en tiempo real' },
    { s: '.comp-card.otc .comp-item:nth-child(4)', en: 'Personalized Training Book', es: 'Training Book personalizado' },
    { s: '.comp-card.otc .comp-item:nth-child(5)', en: '5 Operational KPIs', es: '5 KPIs operacionales' },
    { s: '.comp-card.otc .comp-item:nth-child(6)', en: 'Weekly performance tracking', es: 'Seguimiento semanal de desempeño' },
    { s: '.comp-card.otc .comp-item:nth-child(7)', en: 'AI coaching 24/7', es: 'Coaching con IA 24/7' },
    { s: '.comp-card.otc .comp-item:nth-child(8)', en: 'Operational readiness', es: 'Preparación operacional' },
    { s: '.deliverables-tab[data-tab="nexora"]', en: 'Nexora', es: 'Nexora' },
    { s: '.deliverables-tab[data-tab="jill"]', en: 'Jill', es: 'Jill' },
    { s: '.deliverables-tab[data-tab="alice"]', en: 'Alice', es: 'Alice' },
    { s: '#panel-jill .deliverable-intro h3', en: 'Jill — Fundamentos estructurales (Foundations) Tutor', es: 'Jill — Tutora del programa Fundamentos estructurales (Foundations)' },
    { s: '#panel-jill .deliverable-intro p', en: 'Your entry point into operational English: chunking, verb tenses, linkers and structure — guided step by step before Alice coaches fluency and Nexora adds pressure.', es: 'Tu punto de entrada al inglés operacional: chunks, tiempos verbales, conectores y estructura — guiado paso a paso antes de que Alice entrene fluidez y Nexora agregue presión.' },
    { s: '#panel-jill .deliverable-feat:nth-child(1) span', en: 'Fundamentos estructurales (Foundations) track — async tutor', es: 'Ruta Fundamentos estructurales (Foundations) — tutora asíncrona' },
    { s: '#panel-jill .deliverable-feat:nth-child(2) span', en: 'Voice + text — Jill listens', es: 'Voz + texto — Jill escucha' },
    { s: '#panel-jill .deliverable-feat:nth-child(3) span', en: 'Idea + Linker + Idea from day one', es: 'Idea + Conector + Idea desde el día uno' },
    { s: '#panel-jill .btn-primary', html: true, en: '<i class="ti ti-player-play"></i>Try Jill — 5 min demo', es: '<i class="ti ti-player-play"></i>Probar Jill — demo 5 min' },
    { s: '#panel-jill .btn-secondary', html: true, en: '<i class="ti ti-book"></i>Fundamentos estructurales (Foundations) program', es: '<i class="ti ti-book"></i>Programa Fundamentos estructurales (Foundations)' },
    { s: '#diff .diff-card:nth-child(1) .diff-title', en: 'Real-Time Correction', es: 'Corrección en tiempo real' },
    { s: '#diff .diff-card:nth-child(1) .diff-desc', en: 'Mistakes caught and corrected in the moment — not reviewed two weeks later.', es: 'Errores detectados y corregidos al instante — no revisados dos semanas después.' },
    { s: '#diff .diff-card:nth-child(2) .diff-title', en: 'AI-Integrated Learning', es: 'Aprendizaje integrado con IA' },
    { s: '#diff .diff-card:nth-child(2) .diff-desc', en: 'Alice coaches based on your specific KPI profile and Training Book — not a generic script.', es: 'Alice entrena según tu perfil KPI y Training Book — no un guion genérico.' },
    { s: '#diff .diff-card:nth-child(3) .diff-title', en: 'Weekly KPI Tracking', es: 'Seguimiento KPI semanal' },
    { s: '#diff .diff-card:nth-child(3) .diff-desc', en: '5 operational KPIs measured every session. Progress is visible, specific, and real.', es: '5 KPIs operacionales medidos cada sesión. El progreso es visible, específico y real.' },
    { s: '#diff .diff-card:nth-child(4) .diff-title', en: 'Personalized Training Book', es: 'Training Book personalizado' },
    { s: '#diff .diff-card:nth-child(4) .diff-desc', en: 'No two students have the same exercises. Your weaknesses define your program.', es: 'Ningún estudiante tiene los mismos ejercicios. Tus debilidades definen tu programa.' },
    { s: '#diff .diff-card:nth-child(5) .diff-title', en: 'Operational Simulations', es: 'Simulaciones operacionales' },
    { s: '#diff .diff-card:nth-child(5) .diff-desc', en: 'Nexora puts you in real business scenarios before you ever face them in real life.', es: 'Nexora te pone en escenarios empresariales reales antes de enfrentarlos en la vida real.' },
    { s: '#diff .diff-card:nth-child(6) .diff-title', en: 'Industry-Built Methodology', es: 'Metodología de la industria' },
    { s: '#diff .diff-card:nth-child(6) .diff-desc', en: 'Built from 26 years inside Multinacionales, BPO, leadership, and instructional design.', es: 'Construida desde 26 años dentro de multinacionales, BPO, liderazgo y diseño instruccional.' },
    { s: '.jill-badge', html: true, en: '<i class="ti ti-message-circle"></i>Fundamentos estructurales (Foundations) · Step 1', es: '<i class="ti ti-message-circle"></i>Fundamentos estructurales (Foundations) · Paso 1' },
    { s: '.jill-title', en: 'Meet Jill — Your Fundamentos estructurales (Foundations) Tutor', es: 'Conoce a Jill — tutora del programa Fundamentos estructurales (Foundations)' },
    { s: '.jill-sub', en: 'Jill builds the structure behind English before you need to perform under pressure. Chunks, tenses, linkers and recovery — aligned to your KPIs from day one.', es: 'Jill construye la estructura detrás del inglés antes de que necesites rendir bajo presión. Chunks, tiempos, conectores y recuperación — alineados a tus KPIs desde el día uno.' },
    { s: '#jill .alice-cap:nth-child(1)', html: true, en: '<i class="ti ti-check"></i>Chunking & verb tenses', es: '<i class="ti ti-check"></i>Chunking y tiempos verbales' },
    { s: '#jill .alice-cap:nth-child(2)', html: true, en: '<i class="ti ti-check"></i>First Nexus linkers', es: '<i class="ti ti-check"></i>Primeros conectores Nexus' },
    { s: '#jill .alice-cap:nth-child(3)', html: true, en: '<i class="ti ti-check"></i>Voice & text', es: '<i class="ti ti-check"></i>Voz y texto' },
    { s: '#jill .alice-cap:nth-child(4)', html: true, en: '<i class="ti ti-check"></i>Fundamentos estructurales (Foundations) track', es: '<i class="ti ti-check"></i>Ruta Fundamentos estructurales (Foundations)' },
    { s: '#jill a[href="hablemos.html?solicitar=jill#consulta"]', html: true, en: '<i class="ti ti-calendar"></i>Request Jill demo', es: '<i class="ti ti-calendar"></i>Solicitar demo Jill' },
    { s: '#jill a[href="foundations.html"]', html: true, en: '<i class="ti ti-book"></i>Fundamentos estructurales (Foundations) program', es: '<i class="ti ti-book"></i>Programa Fundamentos estructurales (Foundations)' },
    { s: '#alice .alice-cap:nth-child(1)', html: true, en: '<i class="ti ti-check"></i>Real-time correction', es: '<i class="ti ti-check"></i>Corrección en tiempo real' },
    { s: '#alice .alice-cap:nth-child(2)', html: true, en: '<i class="ti ti-check"></i>Nexus Method coaching', es: '<i class="ti ti-check"></i>Coaching Método Nexus' },
    { s: '#alice .alice-cap:nth-child(3)', html: true, en: '<i class="ti ti-check"></i>Nexora simulations', es: '<i class="ti ti-check"></i>Simulaciones Nexora' },
    { s: '#alice .alice-cap:nth-child(4)', html: true, en: '<i class="ti ti-check"></i>Voice & text', es: '<i class="ti ti-check"></i>Voz y texto' },
    { s: '#alice .alice-cap:nth-child(5)', html: true, en: '<i class="ti ti-check"></i>Progress tracking', es: '<i class="ti ti-check"></i>Seguimiento de progreso' },
    { s: '#alice .alice-cap:nth-child(6)', html: true, en: '<i class="ti ti-check"></i>24/7 availability', es: '<i class="ti ti-check"></i>Disponible 24/7' },
    { s: '#kpis .kpi-card:nth-child(1) .kpi-name', en: 'Idea Generation', es: 'Generación de Ideas' },
    { s: '#kpis .kpi-card:nth-child(1) .kpi-desc', en: 'Can you produce ideas spontaneously in English without freezing?', es: '¿Puedes generar ideas en inglés sin paralizarte?' },
    { s: '#kpis .kpi-card:nth-child(2) .kpi-name', en: 'Structural Thinking', es: 'Pensamiento Estructural' },
    { s: '#kpis .kpi-card:nth-child(2) .kpi-desc', en: 'Do your ideas have logic, order, and connectors?', es: '¿Tus ideas tienen lógica, orden y conectores?' },
    { s: '#kpis .kpi-card:nth-child(3) .kpi-name', en: 'Recovery Ability', es: 'Capacidad de Recuperación' },
    { s: '#kpis .kpi-card:nth-child(3) .kpi-desc', en: 'When you lose a word, can you reformulate and keep going?', es: 'Cuando pierdes una palabra, ¿puedes reformular y seguir?' },
    { s: '#kpis .kpi-card:nth-child(4) .kpi-name', en: 'Problem Solving', es: 'Resolución de Problemas' },
    { s: '#kpis .kpi-card:nth-child(4) .kpi-desc', en: 'Can you analyze and propose solutions under pressure in English?', es: '¿Puedes analizar y proponer soluciones bajo presión en inglés?' },
    { s: '#kpis .kpi-card:nth-child(5) .kpi-name', en: 'Responsiveness', es: 'Capacidad de Respuesta' },
    { s: '#kpis .kpi-card:nth-child(5) .kpi-desc', en: 'How fast can you respond? Can you sustain a real conversation?', es: '¿Qué tan rápido respondes? ¿Puedes sostener una conversación real?' },
    { s: '#about .tl-item:nth-child(1) .tl-text', en: 'Multinacionales & BPO Operations', es: 'Operaciones en Multinacionales y BPO' },
    { s: '#about .tl-item:nth-child(1) .tl-sub', en: 'Where operational English is not optional', es: 'Donde el inglés operacional no es opcional' },
    { s: '#about .tl-item:nth-child(2) .tl-text', en: 'Leadership & Training', es: 'Liderazgo y Entrenamiento' },
    { s: '#about .tl-item:nth-child(2) .tl-sub', en: 'Building teams that perform under pressure', es: 'Construir equipos que rinden bajo presión' },
    { s: '#about .tl-item:nth-child(3) .tl-text', en: 'Instructional Design', es: 'Diseño Instruccional' },
    { s: '#about .tl-item:nth-child(3) .tl-sub', en: 'Converting experience into repeatable systems', es: 'Convertir experiencia en sistemas repetibles' },
    { s: '#about .tl-item:nth-child(4) .tl-text', en: 'AI Integration', es: 'Integración con IA' },
    { s: '#about .tl-item:nth-child(4) .tl-sub', en: 'Human trainer + AI support — for students across LATAM', es: 'Trainer humano + apoyo IA — para estudiantes en toda LATAM' },
    { s: '.exp-label', en: 'Years of Industry Experience', es: 'Años de Experiencia en la Industria' },
    { s: '.exp-tags .exp-tag:nth-child(1)', en: 'Multinacionales', es: 'Multinacionales' },
    { s: '.exp-tags .exp-tag:nth-child(2)', en: 'BPO', es: 'BPO' },
    { s: '.exp-tags .exp-tag:nth-child(3)', en: 'Leadership', es: 'Liderazgo' },
    { s: '.exp-tags .exp-tag:nth-child(4)', en: 'Training', es: 'Entrenamiento' },
    { s: '.exp-tags .exp-tag:nth-child(5)', en: 'Instructional Design', es: 'Diseño Instruccional' },
    { s: '.exp-tags .exp-tag:nth-child(6)', en: 'Quality', es: 'Calidad' },
    { s: '.exp-tags .exp-tag:nth-child(7)', en: 'Project Management', es: 'Gestión de Proyectos' },
    { s: '.exp-tags .exp-tag:nth-child(8)', en: 'AI Integration', es: 'Integración IA' },
    { s: '#core-programs a.program-card:nth-of-type(1) .program-badge', en: 'Core · Training', es: 'Core · Entrenamiento' },
    { s: '#core-programs a.program-card:nth-of-type(1) h3', en: 'Fundamentos estructurales (Foundations)', es: 'Fundamentos estructurales (Foundations)' },
    { s: '#core-programs a.program-card:nth-of-type(1) p', en: 'Structural foundations of English — participation, interaction and collaboration. You install language structure before operating under pressure (not a “basic English” course).', es: 'Fundamentos estructurales básicos del inglés — participación, interacción y colaboración. Instalas la estructura del idioma antes de operar bajo presión (no es un curso de “inglés básico”).' },
    { s: '#core-programs a.program-card:nth-of-type(1) .card-cta', html: true, en: '<i class="ti ti-arrow-right"></i> View program', es: '<i class="ti ti-arrow-right"></i> Ver programa' },
    { s: '#core-programs a.program-card:nth-of-type(2) .program-badge', en: 'Core · Training', es: 'Core · Entrenamiento' },
    { s: '#core-programs a.program-card:nth-of-type(2) h3', en: 'ORT', es: 'ORT' },
    { s: '#core-programs a.program-card:nth-of-type(2) p', en: 'Operational Readiness Training — pressure-based execution under real conditions. No comfort zones.', es: 'Operational Readiness Training — ejecución bajo presión en condiciones reales. Sin zonas de confort.' },
    { s: '#core-programs a.program-card:nth-of-type(2) .card-cta', html: true, en: '<i class="ti ti-arrow-right"></i> View program', es: '<i class="ti ti-arrow-right"></i> Ver programa' },
    { s: '#community-programs a.program-card:nth-of-type(1) .program-badge', en: 'Community · Talk Show', es: 'Comunidad · Talk Show' },
    { s: '#community-programs a.program-card:nth-of-type(1) h3', en: 'Off The Clock', es: 'Off The Clock' },
    { s: '#community-programs a.program-card:nth-of-type(1) p', en: 'Infinity Studio\'s live talk show — conversation, entertainment and relationship building beyond the classroom.', es: 'El talk show en vivo de Infinity Studio — conversación, entretenimiento y relaciones más allá del aula.' },
    { s: '#community-programs a.program-card:nth-of-type(1) .card-cta', html: true, en: '<i class="ti ti-arrow-right"></i> Learn more', es: '<i class="ti ti-arrow-right"></i> Saber más' },
    { s: '#community-programs a.program-card:nth-of-type(2) .program-badge', en: 'Live Practice', es: 'Práctica en Vivo' },
    { s: '#community-programs a.program-card:nth-of-type(2) h3', en: 'The Conversatory', es: 'El Conversatorio' },
    { s: '#community-programs a.program-card:nth-of-type(2) p', en: 'Invitation-only live communication experience — authentic conversations broadcast on social media.', es: 'Experiencia de comunicación en vivo solo por invitación — conversaciones auténticas en redes sociales.' },
    { s: '#community-programs a.program-card:nth-of-type(2) .card-cta', html: true, en: '<i class="ti ti-arrow-right"></i> Learn more', es: '<i class="ti ti-arrow-right"></i> Saber más' },
    { s: '#community-programs a.program-card:nth-of-type(3) .program-badge', en: 'Employability', es: 'Empleabilidad' },
    { s: '#community-programs a.program-card:nth-of-type(3) h3', en: 'Job Finder', es: 'Job Finder' },
    { s: '#community-programs a.program-card:nth-of-type(3) p', en: 'Career development with recruiters and industry professionals — real hiring expectations and market insights.', es: 'Desarrollo profesional con reclutadores y expertos — expectativas reales de contratación e insights del mercado.' },
    { s: '#community-programs a.program-card:nth-of-type(3) .card-cta', html: true, en: '<i class="ti ti-arrow-right"></i> Learn more', es: '<i class="ti ti-arrow-right"></i> Saber más' },
    { s: '.nav-drop-menu a[href="foundations.html"]', en: 'Fundamentos estructurales (Foundations)', es: 'Fundamentos estructurales (Foundations)' },
    { s: '.nav-drop-menu a[href="ort.html"]', en: 'ORT', es: 'ORT' },
    { s: '.nav-drop-menu a[href="off-the-clock.html"]', en: 'Off The Clock', es: 'Off The Clock' },
    { s: '.nav-drop-menu a[href="conversatorio.html"]', en: 'The Conversatory', es: 'El Conversatorio' },
    { s: '.nav-drop-menu a[href="job-finder.html"]', en: 'Job Finder', es: 'Job Finder' },
    { s: 'a.hero-portal-lock', attr: 'title', en: 'Portal Access', es: 'Acceso al Portal' },
    { s: 'a.hero-portal-lock', attr: 'aria-label', en: 'Portal Access', es: 'Acceso al Portal' },
    { s: '.contact-cards .cc:nth-child(5) .cc-label', en: 'Website', es: 'Sitio Web' },
    { s: '.contact-cards .cc:nth-child(6) .cc-label', en: 'Coverage', es: 'Cobertura' },
    { s: '.contact-cards .cc:nth-child(6) .cc-value', en: 'Latin America · HQ Costa Rica', es: 'Latinoamérica · sede Costa Rica' },
    { s: '.tb-section-title', en: 'Operational KPI Radar', es: 'Radar KPI Operacional' },
    { s: '.tb-section-sub', en: 'Weekly snapshot — your 5 performance dimensions', es: 'Instantánea semanal — tus 5 dimensiones de desempeño' },
    { s: '#panel-training-book .tb-section-title:nth-of-type(2)', en: 'Assigned Exercises', es: 'Ejercicios Asignados' },
    { s: '#panel-training-book .tb-section-sub:nth-of-type(2)', en: 'Personalized by your trainer and Infinity Engine', es: 'Personalizados por tu trainer e Infinity Engine' },
    { s: '#panel-training-book .tb-section-title:nth-of-type(3)', en: 'Alice — Recent Session', es: 'Alice — Sesión Reciente' },
    { s: '#panel-training-book .tb-section-sub:nth-of-type(3)', en: 'Preview of coaching inside your Training Book', es: 'Vista previa del coaching en tu Training Book' },
    { s: '#panel-training-book .tb-section-title:nth-of-type(4)', en: 'Nexora — Upcoming Simulation', es: 'Nexora — Próxima Simulación' },
    { s: '#panel-training-book .tb-section-sub:nth-of-type(4)', en: 'Assigned scenario based on your readiness profile', es: 'Escenario asignado según tu perfil de preparación' },
    { s: '#panel-training-book .tb-section-title:nth-of-type(5)', en: 'Weekly Progress', es: 'Progreso Semanal' },
    { s: '#ci', attr: 'placeholder', en: 'Type your message…', es: 'Escribe tu mensaje…' },
    { s: '#ct', en: 'Claire is typing...', es: 'Claire está escribiendo...' }
  ];

  var SUBPAGE_COMMON = [
    { s: 'a[href="index.html#ecosystem"]', en: 'Ecosystem', es: 'Ecosistema' },
    { s: '.content-block:nth-child(1) h2', en: 'What it is', es: 'Qué es' },
    { s: '.page-main > .btn-primary', html: true, en: '<i class="ti ti-calendar"></i> Book your assessment', es: '<i class="ti ti-calendar"></i> Agenda tu evaluación' }
  ];

  var FOUNDATIONS_SUBPAGE = SUBPAGE_COMMON.concat([
    { s: 'body.page-foundations .page-title', en: 'Structural foundations of English (Foundations)', es: 'Fundamentos estructurales básicos del inglés (Foundations)' },
    { s: 'body.page-foundations .page-lead', en: 'Not a “basic English” course. You install language structure — chunks, tenses, connectors — to participate and collaborate in real environments, with a private trainer and Jill support. Online across Latin America.', es: 'No es un curso de “inglés básico”. Instalás la estructura del idioma — chunks, tiempos, conectores — para participar y colaborar en entornos reales, con trainer privado y Jill de apoyo. Online para toda Latinoamérica.' },
    { s: 'body.page-foundations .content-block:nth-child(1) p', en: 'Structural foundations of English (Foundations) is Infinity’s structural installation program. Structured training — not a community event. Students develop skills to participate, interact and collaborate under KPI metrics, not A1–B2 levels.', es: 'Fundamentos estructurales básicos del inglés (Foundations) es el programa de instalación estructural de la metodología Infinity. Entrenamiento estructurado — no evento comunitario. Desarrollás habilidades para participar, interactuar y colaborar bajo métricas KPI, no niveles A1–B2.' },
    { s: 'body.page-foundations .content-block:nth-child(2) h2', en: 'What you develop', es: 'Qué desarrollás' },
    { s: 'body.page-foundations .feature-chip:nth-child(1)', html: true, en: '<i class="ti ti-message"></i> Communication', es: '<i class="ti ti-message"></i> Comunicación' },
    { s: 'body.page-foundations .feature-chip:nth-child(2)', html: true, en: '<i class="ti ti-hand-stop"></i> Participation', es: '<i class="ti ti-hand-stop"></i> Participación' },
    { s: 'body.page-foundations .feature-chip:nth-child(3)', html: true, en: '<i class="ti ti-arrows-exchange"></i> Interaction', es: '<i class="ti ti-arrows-exchange"></i> Interacción' },
    { s: 'body.page-foundations .feature-chip:nth-child(4)', html: true, en: '<i class="ti ti-users-group"></i> Collaboration', es: '<i class="ti ti-users-group"></i> Colaboración' },
    { s: 'body.page-foundations .content-block:nth-child(3) h2', en: 'Pathway', es: 'Ruta' },
    { s: 'body.page-foundations .content-block:nth-child(3) p', en: 'Structural foundations of English (Foundations) leads into ORT (Operational Readiness Training) for pressure-based execution. Community programs such as Off The Clock, The Conversatory and Job Finder support the ecosystem but are separate from this core track.', es: 'Fundamentos estructurales (Foundations) lleva a ORT (Operational Readiness Training) para ejecutar bajo presión. Los programas de comunidad (Off The Clock, The Conversatory, Job Finder) son satélites aparte.' },
    { s: 'body.page-foundations .visual-tag', en: 'Core · Communication', es: 'Core · Comunicación' },
    { s: '#pricing-foundations h3', en: 'Structural foundations (Foundations) — Investment', es: 'Fundamentos estructurales (Foundations) — Inversión' },
    { s: '#pricing-foundations .pricing-kpis-title', en: 'KPIs Jill trains', es: 'KPIs que entrena Jill' }
  ]);

  var ORT_SUBPAGE = SUBPAGE_COMMON.concat([
    { s: 'body.page-ort .page-title', en: 'ORT', es: 'ORT' },
    { s: 'body.page-ort .page-lead', en: 'Operational Readiness Training — pressure-based training that forces execution under real conditions. No comfort zones.', es: 'Operational Readiness Training — entrenamiento bajo presión que fuerza ejecución en condiciones reales. Sin zonas de confort.' },
    { s: 'body.page-ort .content-block:nth-child(1) p', en: 'ORT is the advanced core program of Infinity Studio. After Structural foundations of English (Foundations) builds communication capacity, ORT applies it under operational pressure — simulating the demands of BPO, customer service, tech support and international remote roles.', es: 'ORT es el programa core avanzado de Infinity Studio. Después de que Fundamentos estructurales básicos del inglés (Foundations) construye capacidad comunicativa, ORT la aplica bajo presión operacional — simulando las exigencias de BPO, servicio al cliente, soporte técnico y roles remotos internacionales.' },
    { s: 'body.page-ort .content-block:nth-child(2) h2', en: 'How it works', es: 'Cómo funciona' },
    { s: 'body.page-ort .content-block:nth-child(2) li:nth-child(1)', en: 'Realistic scenarios with time pressure and performance expectations', es: 'Escenarios realistas con presión de tiempo y expectativas de desempeño' },
    { s: 'body.page-ort .content-block:nth-child(2) li:nth-child(2)', en: 'KPI-driven feedback from your trainer', es: 'Feedback guiado por KPIs de tu trainer' },
    { s: 'body.page-ort .content-block:nth-child(2) li:nth-child(3)', en: 'Personalized coaching and structured follow-up', es: 'Coaching personalizado y seguimiento estructurado' },
    { s: 'body.page-ort .content-block:nth-child(2) li:nth-child(4)', en: 'Exercises targeted to your operational weaknesses', es: 'Ejercicios dirigidos a tus debilidades operacionales' },
    { s: 'body.page-ort .content-block:nth-child(3) h2', en: 'Not a community program', es: 'No es un programa comunitario' },
    { s: 'body.page-ort .content-block:nth-child(3) p', en: 'ORT is structured training — distinct from satellite initiatives like Off The Clock (talk show), The Conversatory (live practice events) and Job Finder (employability).', es: 'ORT es entrenamiento estructurado — distinto de iniciativas satélite como Off The Clock (talk show), El Conversatorio (práctica en vivo) y Job Finder (empleabilidad).' },
    { s: 'body.page-ort .visual-tag', en: 'Core · Readiness', es: 'Core · Preparación' },
    { s: '#pricing-ort h3', en: 'ORT — Investment', es: 'ORT — Inversión' },
    { s: '#pricing-ort .pricing-kpis-title', en: 'KPIs Alice + trainer elevate', es: 'KPIs que elevan Alice + trainer' },
    { s: 'body.page-ort .page-main .btn-secondary', html: true, en: '<i class="ti ti-arrow-left"></i> Start with Structural foundations (Foundations)', es: '<i class="ti ti-arrow-left"></i> Empezar con Fundamentos estructurales (Foundations)' }
  ]);

  var DEMO_COMMON = [
    { s: 'a[href="try-demo.html"]', en: '← All demos', es: '← Todos los demos' },
    { s: '.demo-limit p', html: true, en: '<strong>You already used your free demo.</strong> Unlock a plan or contact us on WhatsApp to continue.', es: '<strong>Ya usaste tu demo gratis.</strong> Para seguir, escribinos por WhatsApp o elegí un plan.' }
  ];

  var DEMO_ALICE = DEMO_COMMON.concat([
    { s: '#btn-start', en: 'Start Alice demo', es: 'Iniciar demo Alice' },
    { s: '#inp', attr: 'placeholder', en: 'Speak or type in English…', es: 'Hablá o escribí en inglés…' },
    { s: '#typing', en: 'Alice is typing…', es: 'Alice está escribiendo…' },
    { s: '#voice-hint', html: true, en: '<i class="ti ti-volume"></i> Alice speaks — tap <strong>mic</strong> to answer by voice or type below. Chrome recommended.', es: '<i class="ti ti-volume"></i> Alice habla — tocá <strong>mic</strong> para responder por voz o escribí abajo. Chrome recomendado.' }
  ]);

  var DEMO_NEXORA = DEMO_COMMON.concat([
    { s: '.demo-hero-compact h1', en: 'Nexora — Business Simulation Lab', es: 'Nexora — Laboratorio de simulación empresarial' },
    { s: '.demo-hero-compact p', en: 'Same lab students use in the portal: interview room or incoming call + CRM, voice, mic and live AI — one free try per day.', es: 'El mismo lab del portal: sala de entrevista o llamada entrante + CRM, voz, micrófono e IA en vivo — una prueba gratis por día.' },
    { s: '#btn-start', html: true, en: '<i class="ti ti-external-link"></i> Open Nexora Lab', es: '<i class="ti ti-external-link"></i> Abrir Nexora Lab' },
    { s: '#pre-start .consent-label span', en: 'Anonymized demo data may be used to improve Nexora scenarios and coaching.', es: 'Los datos anonimizados del demo pueden usarse para mejorar escenarios y coaching de Nexora.' },
    { s: '#pre-start p:nth-of-type(1)', en: 'Opens the full Nexora simulation — not a chat widget. Allow pop-ups for this site.', es: 'Abre la simulación completa de Nexora — no es un chat. Permití ventanas emergentes para este sitio.' }
  ]);

  var DEMO_JILL = DEMO_COMMON.concat([
    { s: '#btn-start', en: 'Start Jill demo — 5 min', es: 'Iniciar demo Jill — 5 min' },
    { s: '#inp', attr: 'placeholder', en: 'Speak or type in English…', es: 'Hablá o escribí en inglés…' },
    { s: '#typing', en: 'Jill is typing…', es: 'Jill está escribiendo…' },
    { s: '#voice-hint', html: true, en: '<i class="ti ti-volume"></i> Jill speaks — tap <strong>mic</strong> to answer by voice or type below. Chrome recommended.', es: '<i class="ti ti-volume"></i> Jill habla — tocá <strong>mic</strong> para responder por voz o escribí abajo. Chrome recomendado.' }
  ]);

  function applyDataI18nAttributes(lang) {
    document.querySelectorAll('[data-i18n-en]').forEach(function (node) {
      var val = lang === 'es' ? (node.getAttribute('data-i18n-es') || node.getAttribute('data-i18n-en')) : node.getAttribute('data-i18n-en');
      if (val == null) return;
      if (node.getAttribute('data-i18n-html') === '1') node.innerHTML = val;
      else if (node.getAttribute('data-i18n-attr')) node.setAttribute(node.getAttribute('data-i18n-attr'), val);
      else node.textContent = val;
    });
  }

  function pageEntries() {
    var page = (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');
    if (page === 'index.html') return NAV.concat(INDEX).concat(INDEX_MORE);
    if (page === 'try-alice.html') return NAV.concat(DEMO_ALICE);
    if (page === 'try-nexora.html') return NAV.concat(DEMO_NEXORA);
    if (page === 'try-jill.html') return NAV.concat(DEMO_JILL);
    if (page === 'try-demo.html') return NAV.concat(DEMO_COMMON);
    if (page === 'foundations.html') return NAV.concat(FOUNDATIONS_SUBPAGE);
    if (page === 'ort.html') return NAV.concat(ORT_SUBPAGE);
    return NAV;
  }

  function applyClaireWidget(lang) {
    var online = document.querySelector('#claire-widget [style*="Infinity Studio CR"]');
    if (online) online.innerHTML = '<span style="width:6px;height:6px;background:#25D366;border-radius:50%;display:inline-block;"></span>' + (lang === 'es' ? 'Infinity Studio CR · En línea' : 'Infinity Studio CR · Online');
    var vi = document.getElementById('cvi');
    if (vi && vi.style.display !== 'none') vi.textContent = lang === 'es' ? '🎙 Escuchando' : '🎙 Listening';
  }
  function detectLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en') return 'en';
    return 'es';
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

    pageEntries().forEach(function (entry) {
      applyEntry(entry, lang);
    });
    applyProgramSelect(lang);
    applyDataI18nAttributes(lang);
    applyClaireWidget(lang);
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
