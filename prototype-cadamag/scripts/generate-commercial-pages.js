/**
 * Generate all commercial subpages under new Infinity shell.
 * Content preserved from legacy pages; design is prototype-only.
 */
const fs = require('fs');
const path = require('path');

const V = '20260928brand2';
const OUT = path.join(__dirname, '..');
const DIAG = 'diagnostico.html';
const WA = 'https://wa.me/50660060981?text=Hola!%20Quiero%20agendar%20mi%20diagn%C3%B3stico%20gratis';

function head(cfg) {
  return `<!DOCTYPE html>
<html lang="${cfg.lang || 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>${cfg.title}</title>
  <meta name="description" content="${cfg.desc}">
  <link rel="canonical" href="${cfg.canonical}">
  <meta property="og:title" content="${cfg.ogTitle || cfg.title}">
  <meta property="og:description" content="${cfg.ogDesc || cfg.desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${cfg.canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" href="assets/brand/svg/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="assets/brand/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="16x16" href="assets/brand/favicon/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/brand/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" href="assets/brand/favicon/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="assets/brand/favicon/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="assets/brand/favicon/icon-512.png">
  <link rel="stylesheet" href="css/prototype.css?v=${V}">
  <link rel="stylesheet" href="css/brand.css?v=${V}">
  <link rel="stylesheet" href="css/motion.css?v=20260929scroll2">
  <link rel="stylesheet" href="css/site-nav.css?v=${V}">
  <link rel="stylesheet" href="css/page-shell.css?v=${V}">
  <link rel="stylesheet" href="css/subpages.css?v=${V}">
  <script src="js/site-nav.js?v=${V}" defer></script>
  <script src="js/site-footer.js?v=${V}" defer></script>
  <script src="js/motion.js?v=20260929scroll2" defer></script>
</head>
<body class="${cfg.bodyClass || ''}" data-nav-root="../" data-nav-home="index.html">
<a class="skip-link" href="#main">Saltar al contenido</a>
<div class="prototype-badge" aria-hidden="true">Prototype · Cadamag</div>
<header class="site-header" data-site-nav></header>
<main id="main" class="page-main">
  <div class="page-atmosphere" aria-hidden="true"></div>
  <div class="page-shell">`;
}

function foot() {
  return `  </div>
</main>
<div data-site-footer></div>
</body>
</html>`;
}

function hero(cfg) {
  return `
    <header class="sp-hero" data-reveal="cinematic">
      <div class="sp-hero-copy">
        <p class="page-eyebrow">${cfg.eyebrow}</p>
        <h1 class="page-hero-title">${cfg.h1}</h1>
        <p class="page-lead">${cfg.lead}</p>
        <div class="page-cta-row">${cfg.ctas}</div>
      </div>
      <aside class="sp-visual ${cfg.motif || ''}" aria-label="Visual del producto">
        <div class="sp-visual-inner">
          <span class="sp-visual-label">${cfg.visualLabel}</span>
          <p class="sp-visual-title">${cfg.visualTitle}</p>
          ${cfg.visualBody}
          <p class="sp-visual-meta">${cfg.visualMeta}</p>
        </div>
      </aside>
    </header>`;
}

function section(title, lead, inner, extraClass) {
  return `
    <section class="sp-section ${extraClass || ''}" data-reveal>
      <h2 class="sp-section-title">${title}</h2>
      ${lead ? `<p class="sp-section-lead">${lead}</p>` : ''}
      ${inner}
    </section>`;
}

function ctaBand(title, text, ctas) {
  return `
    <div class="sp-cta-band" data-reveal>
      <div>
        <h2>${title}</h2>
        <p>${text}</p>
      </div>
      <div class="page-cta-row">${ctas}</div>
    </div>`;
}

function btn(href, label, primary) {
  return `<a class="btn ${primary ? 'btn-primary' : 'btn-secondary'}" href="${href}">${label}</a>`;
}

function write(file, html) {
  fs.writeFileSync(path.join(OUT, file), html);
  console.log('wrote', file);
}

/* ========== PAGES ========== */

write('foundations.html', head({
  title: 'Fundamentos estructurales básicos del inglés (Foundations) | Infinity Studio CR',
  desc: 'Fundamentos estructurales básicos del inglés (Foundations): estructura comunicacional con Jill 24/7 y trainer humano privado. Online para México, Chile, Colombia y toda LATAM. ₡67.500/mes promo 2026.',
  canonical: 'https://studioinfinitycr.com/foundations.html',
  bodyClass: 'motif-foundations'
}) + hero({
  eyebrow: 'Programa · Foundations',
  h1: 'Foundations',
  lead: 'No es un curso de “inglés básico”. Instalás la estructura del idioma — chunks, tiempos, conectores — para participar y colaborar en entornos reales, con trainer privado y Jill de apoyo.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Ver precios'),
  motif: 'motif-foundations',
  visualLabel: 'Base · Structure · Progression',
  visualTitle: 'Construcción por checkpoints',
  visualBody: `<div class="sp-visual-diagram">
    <div class="checkpoint"><span class="checkpoint-dot"></span><span>Estructura · Idea + Linker + Idea</span></div>
    <div class="checkpoint"><span class="checkpoint-dot"></span><span>Confianza progresiva sin presión de entrevista</span></div>
    <div class="checkpoint"><span class="checkpoint-dot"></span><span>Jill 24/7 entre clases</span></div>
    <div class="checkpoint"><span class="checkpoint-dot"></span><span>Camino hacia ORT</span></div>
  </div>`,
  visualMeta: 'Visual conceptual · sistema de progresión Foundations'
}) + section('¿Qué es?', null, `<div class="sp-prose"><p><strong>Foundations</strong> es el programa de instalación estructural de la metodología Infinity. Entrenamiento estructurado — no evento comunitario. Desarrollás habilidades para participar, interactuar y colaborar bajo métricas KPI, no niveles A1–B2.</p></div>`)
+ section('¿Qué desarrollás?', null, `<div class="chips"><span class="chip">Comunicación</span><span class="chip">Participación</span><span class="chip">Interacción</span><span class="chip">Colaboración</span></div>`)
+ section('¿Cómo se usa?', '12 horas/mes con trainer humano privado + Jill 24/7. Instalás rutas con método Nexus.', `<ul class="sp-list">
  <li><strong>IG</strong> — Generación de ideas sin paralizarte</li>
  <li><strong>ST</strong> — Pensamiento estructural (Idea + Linker + Idea)</li>
  <li><strong>RA</strong> — Recuperación cuando te trabás</li>
  <li><strong>PS</strong> — Análisis bajo presión leve</li>
  <li><strong>R</strong> — Fluidez conversacional</li>
</ul>`)
+ section('¿Para quién?', null, `<div class="sp-prose"><p>Quienes parten de cero o base débil y necesitan inglés para trabajar — sin saltarse la estructura. Camino natural hacia <a href="ort.html" style="color:#C4B5FD">ORT</a>.</p></div>`)
+ ctaBand('Empezá con claridad', 'El diagnóstico te dice si Foundations es tu ruta.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('foundations-path.html', 'Ver camino Foundations'))
+ foot());

write('ort.html', head({
  title: 'ORT — Operational Readiness Training | Infinity Studio CR',
  desc: 'ORT: ejecutar en inglés bajo presión. Alice 24/7, Nexora incluido. ₡67.500/mes promo 2026. Infinity Studio CR Costa Rica.',
  canonical: 'https://studioinfinitycr.com/ort.html',
  lang: 'es',
  bodyClass: 'motif-ort'
}) + hero({
  eyebrow: 'Programa · Operational Readiness',
  h1: 'ORT',
  lead: 'Operational Readiness Training — entrenamiento bajo presión real. El puente entre entender inglés y performar en entrevistas, BPO, call center y roles remotos.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Ver precios'),
  motif: 'motif-ort',
  visualLabel: 'Performance under pressure',
  visualTitle: 'Respuesta · claridad · fluidez',
  visualBody: `<div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="pressure-row"><span>Latency</span><strong>Live</strong><span>Recovery</span></div>`,
  visualMeta: 'Alice 24/7 + Nexora · escenarios bajo presión'
}) + section('¿Qué es?', null, `<div class="sp-prose"><p>ORT es el programa core avanzado de Infinity. Después de Foundations, ORT aplica la capacidad comunicacional bajo presión operacional — simulando demandas de BPO, customer service, tech support y roles remotos internacionales.</p></div>`)
+ section('¿Cómo funciona?', null, `<ul class="sp-list">
  <li>Escenarios realistas con presión de tiempo</li>
  <li>Feedback con KPIs de tu trainer</li>
  <li>Coaching personalizado y seguimiento estructurado</li>
  <li>Alice entre sesiones + Nexora incluida</li>
</ul>`)
+ section('¿Qué eleva?', null, `<ul class="sp-list">
  <li><strong>IG</strong> — Ideas bajo límite de tiempo</li>
  <li><strong>ST</strong> — Conectores en respuestas STAR y cliente</li>
  <li><strong>RA</strong> — Recuperación en vivo con Alice</li>
  <li><strong>PS</strong> — Soluciones estructuradas en llamadas y tickets</li>
  <li><strong>R</strong> — Latencia de respuesta en simulaciones</li>
</ul>`)
+ section('¿Para quién?', null, `<div class="sp-prose"><p>Quienes ya entienden pero se traban en entrevistas o llamadas. Requiere base de Foundations o equivalente. No es programa comunitario: es entrenamiento estructurado.</p></div>`)
+ ctaBand('Entrená cuando importa', 'Diagnóstico gratis para confirmar si ORT es tu nivel.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('ort-path.html', 'Ver camino ORT'))
+ foot());

write('para-quien.html', head({
  title: '¿Es para mí? — Infinity Studio CR',
  desc: 'Si te trabás en entrevistas o llamadas, o casi no sabés inglés y lo necesitás para trabajar — Infinity es para vos. Diagnóstico gratis.',
  canonical: 'https://studioinfinitycr.com/para-quien.html',
  ogTitle: '¿Es para mí? — Infinity Studio CR',
  ogDesc: 'Entrevistas, call center, remoto — o desde cero. Diagnóstico gratis.'
}) + hero({
  eyebrow: 'Selector de ruta',
  h1: '¿Cuál camino es para mí?',
  lead: 'Si te reconocés abajo, probablemente Infinity es para vos. No somos salón grupal: profe 1 a 1 + práctica con IA, para gente que necesita hablar cuando importa.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Ver precios'),
  visualLabel: 'Route selector',
  visualTitle: 'Foundations o ORT',
  visualBody: `<div class="sp-visual-diagram" style="display:grid;gap:.6rem">
    <div class="checkpoint" style="display:grid;grid-template-columns:28px 1fr;gap:.65rem;align-items:center;padding:.45rem;border-radius:10px;background:rgba(8,11,15,.45);border:1px solid rgba(123,77,255,.15)"><span style="width:10px;height:10px;border-radius:50%;background:#7B4DFF;margin:auto"></span><span style="font-size:.84rem;color:#C5C9D6">Base débil → Foundations</span></div>
    <div class="checkpoint" style="display:grid;grid-template-columns:28px 1fr;gap:.65rem;align-items:center;padding:.45rem;border-radius:10px;background:rgba(8,11,15,.45);border:1px solid rgba(255,138,0,.2)"><span style="width:10px;height:10px;border-radius:50%;background:#FF8A00;margin:auto"></span><span style="font-size:.84rem;color:#C5C9D6">Te trabás → ORT</span></div>
  </div>`,
  visualMeta: 'El diagnóstico confirma la ruta exacta'
}) + section('Escenarios reales', 'Elegí el que más se parece a tu situación.', `<div class="sp-card-grid">
  <a class="sp-card" href="ort-path.html"><h3>Te trabás en entrevistas o llamadas</h3><p>Entendés — pero al hablar en vivo se te va la voz.</p><span class="sp-card-tag">→ ORT</span></a>
  <a class="sp-card" href="ort-path.html"><h3>Querés call center, BPO o soporte</h3><p>Pasar la entrevista y atender el primer día.</p><span class="sp-card-tag">→ ORT</span></a>
  <a class="sp-card" href="ort-path.html"><h3>Remoto con equipos en inglés</h3><p>Reuniones y clientes sin quedarte en blanco.</p><span class="sp-card-tag">→ ORT</span></a>
  <a class="sp-card" href="foundations-path.html"><h3>Casi no sabés inglés</h3><p>Base débil o cero. Primero estructura y confianza.</p><span class="sp-card-tag">→ Foundations</span></a>
  <a class="sp-card" href="advanced-path.html"><h3>Ya hablás — falta práctica masiva</h3><p>Simulaciones de entrevista antes del día clave.</p><span class="sp-card-tag">→ Nexora</span></a>
  <a class="sp-card" href="hablemos.html"><h3>Empresa, colegio o municipalidad</h3><p>Equipos, pilotos o empleabilidad — te orientamos.</p><span class="sp-card-tag">→ Consulta</span></a>
</div>`)
+ section('No es para vos si buscás…', null, `<ul class="sp-list"><li>Solo un certificado A1–B1 para el CV</li><li>El curso más barato del mercado</li><li>Solo gramática, sin hablar de verdad</li></ul>`)
+ ctaBand('Confirmá tu ruta', 'Diagnóstico gratis. Te decimos Foundations u ORT.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Ver precios'))
+ foot());

write('job-finder.html', head({
  title: 'Job Finder — Employability Program | Infinity Studio CR',
  desc: 'Job Finder: preparación para empleabilidad, entrevistas y expectativas reales de contratación dentro del ecosistema Infinity.',
  canonical: 'https://studioinfinitycr.com/job-finder.html'
}) + hero({
  eyebrow: 'Experiencia · Employability',
  h1: 'Job Finder',
  lead: 'Preparación para empleabilidad: lo que buscan las empresas, cómo posicionarte y cómo llegar a la entrevista con más claridad.',
  ctas: btn('hablemos.html', 'Consultar', true) + btn(DIAG, 'Diagnóstico'),
  visualLabel: 'Interview readiness',
  visualTitle: 'Employability layer',
  visualBody: `<div class="chips"><span class="chip">Resume</span><span class="chip">LinkedIn</span><span class="chip">Interview</span><span class="chip">Hiring trends</span></div>`,
  visualMeta: 'Programa satélite · no reemplaza Foundations/ORT'
}) + `<p class="notice-satellite" data-reveal><strong>Satellite program:</strong> Job Finder no es parte de Foundations u ORT. Apoya empleabilidad y exposición dentro del ecosistema Infinity.</p>`
+ section('¿Qué es?', null, `<div class="sp-prose"><p>Invita a recruiters, hiring managers, trainers y profesionales de industria a compartir experiencias. Los participantes ganan exposición a expectativas reales de hiring, tendencias del mercado y estrategias de desarrollo profesional.</p></div>`)
+ section('Temas', null, `<div class="chips"><span class="chip">Resume advice</span><span class="chip">LinkedIn</span><span class="chip">Interview prep</span><span class="chip">Hiring trends</span><span class="chip">Industry expectations</span><span class="chip">Career growth</span></div>`)
+ section('Objetivo', null, `<div class="sp-prose"><p>Ayudar a posicionarte para oportunidades reales de empleo — no solo “saber inglés”.</p></div>`)
+ ctaBand('Hablemos de tu caso', 'Te orientamos según tu ruta actual.', btn('hablemos.html', 'Hablemos', true) + btn('pricing.html', 'Precios'))
+ foot());

write('conversatorio.html', head({
  title: 'The Conversatory — Live Practice Experience | Infinity Studio CR',
  desc: 'The Conversatory: práctica conversacional en vivo, invitaciones y experiencias de speaking reales dentro de Infinity Studio.',
  canonical: 'https://studioinfinitycr.com/conversatorio.html'
}) + hero({
  eyebrow: 'Experiencia · Live speaking',
  h1: 'The Conversatory',
  lead: 'Práctica conversacional en vivo. Conversaciones auténticas que muestran la metodología Infinity en acción — no es clase, no es webinar.',
  ctas: btn('hablemos.html', 'Quiero participar', true) + btn('index.html', 'Conocer Infinity'),
  visualLabel: 'Live speaking experience',
  visualTitle: 'Conversation flow',
  visualBody: `<div class="chips"><span class="chip">Live</span><span class="chip">Topics</span><span class="chip">Voice</span><span class="chip">Interaction</span></div>`,
  visualMeta: 'Invitation-only · live practice'
}) + `<p class="notice-satellite" data-reveal><strong>Satellite program:</strong> The Conversatory no es parte de Foundations u ORT. Es práctica en vivo y visibilidad dentro del ecosistema.</p>`
+ section('¿Qué es?', null, `<div class="sp-prose"><p>Participantes de distintas instituciones se unen a estudiantes Infinity en discusiones moderadas en vivo. Sesiones transmitidas en plataformas como TikTok.</p><p>Esto <strong>no</strong> es una lecture. No es webinar. No es clase. Es una experiencia de comunicación en vivo.</p></div>`)
+ section('¿Qué podés hacer?', null, `<ul class="sp-list"><li>Practicar inglés en conversaciones auténticas</li><li>Interactuar con estudiantes Infinity</li><li>Experimentar la metodología de primera mano</li><li>Construir confianza en tiempo real</li></ul>`)
+ ctaBand('Viví la práctica', 'Escribinos para saber próximas fechas.', btn('hablemos.html', 'Hablemos', true))
+ foot());

write('off-the-clock.html', head({
  title: 'Off The Clock — Talk Show · Infinity Studio CR',
  desc: 'Off The Clock: conversaciones reales fuera del formato tradicional. Talk show de Infinity Studio CR.',
  canonical: 'https://studioinfinitycr.com/off-the-clock.html'
}) + hero({
  eyebrow: 'Experiencia · Talk show',
  h1: 'Off The Clock',
  lead: 'Conversaciones reales fuera del formato tradicional. Un espacio más relajado para conectar con la comunidad Infinity — sin dejar de ser Infinity.',
  ctas: btn('hablemos.html', 'Saber más', true) + btn('index.html', 'Inicio'),
  visualLabel: 'Beyond the classroom',
  visualTitle: 'Talk show · community',
  visualBody: `<div class="chips"><span class="chip">Current events</span><span class="chip">Work</span><span class="chip">Culture</span><span class="chip">Stories</span></div>`,
  visualMeta: 'Tono más relajado · misma identidad'
}) + `<p class="notice-satellite" data-reveal><strong>Satellite · talk show:</strong> Off The Clock no es parte de Foundations u ORT. Iniciativa de comunidad y conexión de marca.</p>`
+ section('Propósito', null, `<div class="sp-prose"><p>Construir comunidad, engagement y conexión. El objetivo no es enseñar clase — es conversación, interacción y relación.</p></div>`)
+ section('Temas típicos', null, `<div class="chips"><span class="chip">Actualidad</span><span class="chip">Tech &amp; AI</span><span class="chip">Trabajo</span><span class="chip">Business</span><span class="chip">Cultura</span><span class="chip">Historias</span></div>`)
+ ctaBand('Quedate cerca', 'Seguí las próximas sesiones desde Hablemos.', btn('hablemos.html', 'Hablemos', true))
+ foot());

write('ingles-operacional-latinoamerica.html', head({
  title: 'Inglés operacional Latinoamérica — Entrenamiento con IA | Infinity Studio CR',
  desc: 'Inglés operacional para profesionales en Latinoamérica: entrevistas BPO, call center, reuniones remotas. Alice, Nexora, método Nexus. Prueba desde México, Colombia, Guatemala y toda la región.',
  canonical: 'https://studioinfinitycr.com/ingles-operacional-latinoamerica.html',
  ogTitle: 'Inglés operacional Latinoamérica — Infinity Studio CR',
  ogDesc: 'No es una academia: entrenamiento operacional con IA 24/7, simulaciones reales y trainer humano.'
}) + hero({
  eyebrow: 'LATAM · Operational English',
  h1: 'Inglés operacional para Latinoamérica',
  lead: 'Entrenamiento para contextos profesionales: entrevistas BPO, call center, reuniones remotas y trabajo con equipos en inglés — con trainer e IA.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('../try-alice.html', 'Probar Alice'),
  visualLabel: 'LATAM · remote · BPO',
  visualTitle: 'Operational English',
  visualBody: `<div class="chips"><span class="chip">México</span><span class="chip">Colombia</span><span class="chip">Costa Rica</span><span class="chip">Chile</span><span class="chip">Guatemala</span><span class="chip">+ LATAM</span></div>`,
  visualMeta: 'Online · premium · profesional'
}) + section('Para profesionales que necesitan ejecutar', null, `<div class="sp-prose"><p>No es academia de salón. Es entrenamiento operacional: práctica por voz, simulaciones laborales y acompañamiento de trainer según tu ruta (Foundations u ORT).</p></div>`)
+ section('¿Qué incluye el ecosistema?', null, `<ul class="sp-list"><li>Práctica conversacional con Alice</li><li>Simulaciones con Nexora</li><li>Drills Foundations con Jill</li><li>Planes con profe 1 a 1</li></ul>`)
+ ctaBand('Empezá desde tu país', 'Diagnóstico gratis. Te decimos Foundations u ORT.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Precios'))
+ foot());

/* Tools */
const micSvg = `<div class="mic-ring"><svg viewBox="0 0 24 24"><path d="M12 3v2M8 8a4 4 0 0 1 8 0v3a4 4 0 0 1-8 0V8z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div><div class="wave" aria-hidden="true" style="display:flex;align-items:flex-end;gap:5px;height:48px"><i style="display:block;width:5px;height:40%;border-radius:4px;background:#7B4DFF"></i><i style="display:block;width:5px;height:70%;border-radius:4px;background:#9B74FF"></i><i style="display:block;width:5px;height:55%;border-radius:4px;background:#7B4DFF"></i><i style="display:block;width:5px;height:90%;border-radius:4px;background:#FF8A00"></i><i style="display:block;width:5px;height:48%;border-radius:4px;background:#7B4DFF"></i></div>`;

write('alice.html', head({
  title: 'Alice — Práctica de conversación por voz | Infinity Studio',
  desc: 'Alice es la práctica conversacional por voz de Infinity Studio: entrenamiento recurrente en inglés para situaciones reales.',
  canonical: 'https://studioinfinitycr.com/alice.html',
  bodyClass: 'motif-alice'
}) + hero({
  eyebrow: 'Herramienta IA · Voice practice',
  h1: 'Alice',
  lead: 'Práctica de conversación en inglés por voz. Entrenamiento recurrente para hablar con más claridad cuando la situación lo exige.',
  ctas: btn('../try-alice.html', 'Probar Alice', true) + btn('hablemos.html', 'Hablemos'),
  motif: 'motif-alice',
  visualLabel: 'Voice practice',
  visualTitle: 'Mic · waveform · turn',
  visualBody: micSvg,
  visualMeta: 'Companion de práctica por voz · demo pública disponible'
}) + section('¿Qué hace?', null, `<ul class="sp-list"><li>Práctica conversacional por voz</li><li>Entrenamiento recurrente entre clases</li><li>Enfoque en uso real del inglés</li></ul>`)
+ section('¿Para quién?', null, `<div class="sp-prose"><p>Personas que ya entienden bastante, pero necesitan practicar hablar bajo condiciones más reales — entrevistas, trabajo y conversación profesional.</p></div>`)
+ section('¿Cómo se usa en Infinity?', null, `<div class="sp-prose"><p>Alice acompaña el trabajo con trainer. En ORT es central; también como práctica IA standalone. Se integra con Foundations y ORT.</p></div>`)
+ ctaBand('Probá Alice', 'Demo pública sin tarjeta.', btn('../try-alice.html', 'Probar Alice', true) + btn('ort.html', 'Ver ORT'))
+ foot());

write('nexora.html', head({
  title: 'Nexora — Simulation Lab | Infinity Studio',
  desc: 'Nexora Simulation Lab: simulaciones de situaciones laborales — entrevistas, reuniones y respuesta profesional bajo presión.',
  canonical: 'https://studioinfinitycr.com/nexora.html',
  bodyClass: 'motif-nexora'
}) + hero({
  eyebrow: 'Herramienta IA · Simulation Lab',
  h1: 'Nexora',
  lead: 'Simulaciones de situaciones reales de trabajo. Entrená respuestas profesionales antes de que la presión llegue de verdad.',
  ctas: btn('../try-nexora.html', 'Conocer demo', true) + btn('hablemos.html', 'Solicitar demo'),
  motif: 'motif-nexora',
  visualLabel: 'Real-world simulation',
  visualTitle: 'Simulation Lab',
  visualBody: `<div class="scenario-list"><div class="scenario">Interview · response path</div><div class="scenario">Client call · workplace pressure</div><div class="scenario">Meeting · professional clarity</div></div>`,
  visualMeta: 'Escenarios respaldados por el Simulation Lab actual'
}) + section('¿Qué hace?', null, `<ul class="sp-list"><li>Simulation Lab para escenarios laborales</li><li>Práctica de entrevistas y situaciones profesionales</li><li>Entrenamiento orientado a respuesta bajo presión</li></ul>`)
+ section('¿Para quién?', null, `<div class="sp-prose"><p>Profesionales y aspirantes que necesitan ensayar interacciones reales. Se alinea especialmente con ORT.</p></div>`)
+ ctaBand('Conocé Nexora', 'Demo o solicitud según tu caso.', btn('../try-nexora.html', 'Conocer demo', true) + btn('hablemos.html', 'Solicitar demo'))
+ foot());

write('jill.html', head({
  title: 'Jill — Drills Foundations bajo presión | Infinity Studio',
  desc: 'Jill: rapid drills de Foundations bajo presión. Práctica estructural entre clases dentro del ecosistema Infinity.',
  canonical: 'https://studioinfinitycr.com/jill.html',
  bodyClass: 'motif-jill'
}) + hero({
  eyebrow: 'Herramienta IA · Foundations drills',
  h1: 'Jill',
  lead: 'Drills Foundations bajo presión. Rapid practice para instalar estructura cuando todavía no estás en modo entrevista.',
  ctas: btn('../try-jill.html', 'Probar Jill', true) + btn('foundations.html', 'Ver Foundations'),
  motif: 'motif-jill',
  visualLabel: 'Train under pressure',
  visualTitle: 'Rapid drills · timers',
  visualBody: `<div class="drill-meter">
    <div class="drill-label"><span>Structure</span><span>82%</span></div>
    <div class="drill-bar"><span style="width:82%"></span></div>
    <div class="drill-label"><span>Recovery</span><span>64%</span></div>
    <div class="drill-bar"><span style="width:64%"></span></div>
    <div class="drill-label"><span>Fluency</span><span>71%</span></div>
    <div class="drill-bar"><span style="width:71%"></span></div>
  </div>`,
  visualMeta: 'Visual conceptual · KPIs Foundations'
}) + section('¿Qué hace?', null, `<ul class="sp-list"><li>Rapid drills de Foundations</li><li>Práctica bajo presión controlada</li><li>Apoyo 24/7 entre clases con trainer</li></ul>`)
+ section('Relación con Foundations', null, `<div class="sp-prose"><p>Jill es la capa de drills del camino Foundations. No reemplaza al profe: sostiene el ritmo entre sesiones.</p></div>`)
+ ctaBand('Probá Jill', 'Demo pública disponible.', btn('../try-jill.html', 'Probar Jill', true) + btn('foundations.html', 'Foundations'))
+ foot());

write('claire.html', head({
  title: 'Claire — Práctica TOEIC | Infinity Studio',
  desc: 'Claire apoya práctica TOEIC con corrección inmediata: Listening, Reading y feedback directo dentro del ecosistema Infinity.',
  canonical: 'https://studioinfinitycr.com/claire.html',
  bodyClass: 'motif-claire'
}) + hero({
  eyebrow: 'Herramienta IA · TOEIC practice',
  h1: 'Claire',
  lead: 'Práctica TOEIC con corrección inmediata. Listening, Reading y feedback directo para entrenar con más precisión.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Conocer los programas'),
  motif: 'motif-claire',
  visualLabel: 'TOEIC practice',
  visualTitle: 'Question · correction · progress',
  visualBody: `<div class="q-card"><div class="q">Reading Part 5 · choose the best option</div><div class="ok">Immediate correction · feedback loop</div></div>
    <div class="q-card"><div class="q">Listening · short talk</div><div class="ok">Score-oriented practice modes</div></div>`,
  visualMeta: 'Capacidades verificadas · sin demo pública standalone'
}) + section('¿Qué hace?', null, `<ul class="sp-list"><li>Práctica TOEIC (Listening / Reading)</li><li>Corrección inmediata durante el ejercicio</li><li>Modos de práctica orientados a score</li></ul>`)
+ section('¿Para quién?', null, `<div class="sp-prose"><p>Quienes necesitan preparar TOEIC con práctica guiada dentro de un plan Infinity — no como producto aislado.</p></div>`)
+ ctaBand('Empezá por el diagnóstico', 'No hay botón “Probar” público separado.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Programas y precios'))
+ foot());

write('training-book.html', head({
  title: 'Training Book — Progreso entre clases | Infinity Studio',
  desc: 'Training Book: ejercicios, seguimiento y práctica entre clases. La capa de progreso del entrenamiento Infinity.',
  canonical: 'https://studioinfinitycr.com/training-book.html',
  bodyClass: 'motif-book'
}) + hero({
  eyebrow: 'Sistema · Between classes',
  h1: 'Training Book',
  lead: 'Your training continues between classes. Ejercicios, seguimiento y progreso — sin exponer datos privados de estudiantes.',
  ctas: btn('index.html#ecosistema', 'Conocer Infinity', true) + btn('../portal-access.html', 'Portal'),
  motif: 'motif-book',
  visualLabel: 'Progress · checkpoints',
  visualTitle: 'Between-class continuity',
  visualBody: `<div class="progress-stack">
    <div class="progress-item"><em>Week</em>Exercises · path · feedback</div>
    <div class="progress-item"><em>History</em>Checkpoints visibles para estudiante y trainer</div>
    <div class="progress-item"><em>Access</em>Producto operativo vía Portal autorizado</div>
  </div>`,
  visualMeta: 'Landing comercial · no contenido privado'
}) + section('¿Qué hace?', null, `<ul class="sp-list"><li>Ejercicios entre clases</li><li>Seguimiento de progreso</li><li>Práctica estructurada junto a Foundations y ORT</li></ul>`)
+ section('¿Cómo se usa?', null, `<div class="sp-prose"><p>El Training Book operativo vive en el Portal. Esta página explica el rol del sistema; el acceso al producto es autorizado.</p></div>`)
+ ctaBand('Continuá el entrenamiento', 'Conocé Infinity o entrá al Portal si ya sos estudiante.', btn('index.html', 'Conocer Infinity', true) + btn('../portal-access.html', 'Portal'))
+ foot());

/* Results */
write('casos-de-exito.html', head({
  title: 'Casos de Éxito — Infinity Studio CR | Impacto documentado Costa Rica',
  desc: 'Casos de éxito documentados: Goicoechea 2021 (informe municipal). Fuentes oficiales verificables — no claims de marketing.',
  canonical: 'https://studioinfinitycr.com/casos-de-exito.html',
  ogTitle: 'Casos de Éxito — Infinity Studio CR',
  ogDesc: 'Pilotos municipales con resultados medibles — transparencia pública.'
}) + hero({
  eyebrow: 'Resultados · Evidencia',
  h1: 'Casos de éxito',
  lead: 'No claims de marketing. Pilotos del sector público con resultados medibles, fuentes oficiales y cobertura verificable. TU506 es el nombre anterior de Infinity Studio CR.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('para-quien.html', '¿Es para mí?'),
  visualLabel: 'Case study',
  visualTitle: 'Documented impact',
  visualBody: `<div class="chips"><span class="chip">Goicoechea 2021</span><span class="chip">Informe oficial</span><span class="chip">Empleabilidad</span></div>`,
  visualMeta: 'Solo evidencia documentada'
}) + `
    <article class="case-study sp-section" id="goicoechea" data-reveal style="border-top:0;padding-top:0">
      <span class="case-badge">Sector público · Goicoechea · 2021</span>
      <h2>Municipalidad de Goicoechea — Piloto de preparación para call center</h2>
      <p>Alianza estratégica municipal para preparar jóvenes del cantón de Goicoechea para entrevistas en call center. Programa diseñado y liderado por nuestro fundador como instructor principal (marca TU506).</p>
      <p><strong>Video municipal (Facebook):</strong> «JÓVENES QUE RECIBIERON CURSO DE INGLÉS YA TRABAJAN GRACIAS A ALIANZA DE MUNICIPALIDAD DE GOICOECHEA Y TU506» — <a href="https://www.facebook.com/watch/?v=263792665317206" target="_blank" rel="noopener noreferrer" style="color:#C4B5FD">ver en Facebook</a></p>
      <h3 style="font-family:var(--font-display);font-size:1rem;color:#E8EAF0;margin:1.25rem 0 .5rem">Informe de Labores 2022 — cita textual oficial (p. 34)</h3>
      <p style="font-size:.82rem;color:#8B92A8">Sección «Cursos de inglés preparatorios para call center» · Municipalidad de Goicoechea</p>
      <blockquote>
        <p><strong>Cursos de inglés preparatorios para call center</strong></p>
        <p>Como parte de las alianzas estratégicas realizadas por parte de esta Administración, se logró realizar un curso de inglés dirigido a jóvenes del cantón de Goicoechea, con la finalidad de prepararles para la entrevista en los call center y así pudieran colocarse de manera más expedita en un puesto de trabajo.</p>
        <p>Este curso lo iniciaron 90 de las 100 escogidas y se redujo a 60 debido a diversos conflictos de horario y trabajo de las y los interesados, aún continúan en clase preparatoria 25 del grupo de básico y 10 han sido colocados exitosamente en un empleo confirmado, a este momento 15 aún están en proceso de aplicación. Este curso no representaba ningún costo para los y las beneficiadas, ya que fue financiado por la empresa privada, como parte de un plan piloto en nuestro Cantón.</p>
      </blockquote>
      <ul class="case-metrics">
        <li><strong>90</strong><span>Residentes iniciaron (de 100 seleccionados)</span></li>
        <li><strong>10</strong><span>Contrataciones confirmadas en call center</span></li>
        <li><strong>15</strong><span>En proceso activo de aplicación</span></li>
        <li><strong>25</strong><span>Aún en entrenamiento preparatorio</span></li>
      </ul>
      <p class="case-sources">
        <a href="https://transparencia.munigoicoechea.go.cr/wp-content/uploads/2023/05/INFORMEDELABORES2022.pdf" target="_blank" rel="noopener noreferrer">Fuente oficial — Informe de Labores 2022 (PDF)</a>
        <a href="https://transparencia.munigoicoechea.go.cr/" target="_blank" rel="noopener noreferrer">Portal Transparencia · Municipalidad de Goicoechea</a>
      </p>
    </article>`
+ ctaBand('¿Querés un camino claro?', 'Diagnóstico gratis.', btn(DIAG, 'Hacé tu diagnóstico', true) + btn('para-quien.html', '¿Es para mí?'))
+ foot());

/* Pricing */
write('pricing.html', head({
  title: 'Precios — Infinity Studio CR | Inglés para trabajar',
  desc: 'Foundations (desde cero) u ORT (si te trabás): ₡67.500/mes con profe. Práctica con IA desde ₡12.500. Diagnóstico gratis. Colones.',
  canonical: 'https://studioinfinitycr.com/pricing.html',
  ogTitle: 'Precios — Infinity Studio CR',
  ogDesc: 'Dos caminos con profe a ₡67.500/mes. Práctica con IA desde ₡12.500. Diagnóstico gratis.'
}) + hero({
  eyebrow: 'Precios · colones',
  h1: 'Dos caminos con profe.<br>Práctica con IA si querés.',
  lead: 'Si necesitás inglés para conseguir o mantener un trabajo, acá está lo que pagás — sin menú de 9 productos.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('../try-alice.html', 'Probar práctica'),
  visualLabel: 'Plans',
  visualTitle: 'Foundations · ORT · IA',
  visualBody: `<div class="chips"><span class="chip">₡67.500/mes profe</span><span class="chip">IA desde ₡12.500</span><span class="chip">Diagnóstico gratis</span></div>`,
  visualMeta: 'Datos de precios preservados del listado vigente'
}) + section('Empezá acá (gratis)', null, `<div class="sp-prose"><p><strong>1.</strong> Diagnóstico — te decimos si vas a Foundations o a ORT.</p><p><strong>2.</strong> O probá práctica por voz en la web (sin tarjeta).</p><p>Pagás después de entender tu caso. Todo en <strong>colones (₡)</strong>.</p></div>`)
+ section('Con profe · ₡67.500/mes', 'Mismo precio. Distinto nivel. 12 horas al mes 1 a 1 + IA entre clases.', `<div class="price-grid">
  <article class="price-card is-featured">
    <span class="price-badge">Desde cero</span>
    <div class="price-tag">Casi no sé inglés</div>
    <h3>Foundations</h3>
    <div class="price-was">Lista ₡96.000</div>
    <div class="price-amount">₡67.500 <small>/mes</small></div>
    <div class="price-note">Regular ₡75.000 · promo sujeta a cupos</div>
    <p>Armás oraciones, confianza y base para hablar — sin saltarte pasos. Profe + Jill 24/7.</p>
    <ul><li>12 h con tu profe</li><li>Jill entre clases</li><li>Avance semanal en tu portal</li></ul>
    ${btn(DIAG, 'Quiero Foundations', true)}
  </article>
  <article class="price-card is-featured">
    <span class="price-badge">Si te trabás</span>
    <div class="price-tag">Entendés · te congelás</div>
    <h3>ORT</h3>
    <div class="price-was">Lista ₡127.500</div>
    <div class="price-amount">₡67.500 <small>/mes</small></div>
    <div class="price-note">Regular ₡75.000 · mismo precio, otro nivel</div>
    <p>Para la entrevista, el call center y las llamadas. Entrenás bajo presión con Alice y Nexora.</p>
    <ul><li>12 h con tu profe</li><li>Alice (hablar con flujo)</li><li>Nexora (simulaciones reales)</li></ul>
    ${btn(DIAG, 'Quiero ORT', true)}
  </article>
</div>`)
+ section('Solo práctica con IA · sin profe', 'Puente mientras decidís, o complemento entre sesiones.', `<div class="ia-grid">
  <div class="ia-card"><h3>Jill</h3><div class="ia-who">Base débil · estructura</div><div class="ia-price">₡12.500/mes</div>${btn('../try-jill.html', 'Probar')}</div>
  <div class="ia-card"><h3>Alice Tutor</h3><div class="ia-who">Flujo, estructura, corrección</div><div class="ia-price">₡18.500/mes</div>${btn('hablemos.html?solicitar=alice-coach#consulta', 'Demo')}</div>
  <div class="ia-card"><h3>Alice Libre</h3><div class="ia-who">Practicar cualquier tema 24/7</div><div class="ia-price">₡24.500/mes</div>${btn('../try-alice.html', 'Gratis en la web')}</div>
  <div class="ia-card"><h3>Nexora</h3><div class="ia-who">Entrevistas y llamadas bajo presión</div><div class="ia-price">₡28.500/mes</div>${btn('hablemos.html?solicitar=nexora#consulta', 'Demo')}</div>
  <div class="ia-card"><h3>Alice+</h3><div class="ia-who">Tutor + Libre + Nexora (sin profe)</div><div class="ia-price">₡49.500/mes</div>${btn('https://wa.me/50660060981?text=Hola!%20Quiero%20Alice%2B', 'WhatsApp')}</div>
  <div class="ia-card"><h3>Claire</h3><div class="ia-who">Listening / Reading bajo presión</div><div class="ia-price">En el diagnóstico</div>${btn('hablemos.html?solicitar=claire#consulta', 'Hablar de TOEIC')}</div>
</div>
<div class="market-grid">
  <div class="market-card"><h3>Costa Rica</h3><p>Colones · SINPE. Los precios de esta página son en ₡.</p></div>
  <div class="market-card"><h3>Resto de LATAM</h3><p>TC + 8%. Convertimos al tipo de cambio del día. Te decimos el monto exacto <strong>antes</strong> de cobrar.</p></div>
</div>`)
+ ctaBand('Pagás después de entender tu caso', 'Diagnóstico gratis. Foundations u ORT = ₡67.500/mes con profe.', btn(WA, 'WhatsApp diagnóstico', true) + btn('../try-alice.html', 'Probar práctica'))
+ foot());

/* Hablemos */
write('hablemos.html', head({
  title: 'Hablemos — Infinity Studio CR',
  desc: 'Contacto Infinity Studio CR: diagnóstico, consulta y WhatsApp. Te orientamos Foundations, ORT o práctica con IA.',
  canonical: 'https://studioinfinitycr.com/hablemos.html'
}) + hero({
  eyebrow: 'Contacto',
  h1: 'Hablemos',
  lead: '¿No sabés por dónde empezar? Contanos tu caso — te decimos Foundations, ORT o solo práctica. Sin compromiso.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn(WA, 'WhatsApp'),
  visualLabel: 'Consulta',
  visualTitle: 'Camino claro',
  visualBody: `<div class="chips"><span class="chip">1. Nos escribís</span><span class="chip">2. Diagnóstico</span><span class="chip">3. Ruta</span></div>`,
  visualMeta: 'Respuesta humana · sin menú confuso'
}) + section('Elegí cómo empezar', null, `<div class="contact-grid" id="consulta">
  <a class="contact-card" href="${DIAG}"><h3>Diagnóstico</h3><p>90 min para ubicar Foundations u ORT.</p></a>
  <a class="contact-card" href="${WA}" target="_blank" rel="noopener noreferrer"><h3>WhatsApp</h3><p>+506 6006 0981 — respuesta directa.</p></a>
  <a class="contact-card" href="pricing.html"><h3>Ver precios</h3><p>Planes con profe e IA en colones.</p></a>
  <a class="contact-card" href="../portal-access.html"><h3>Portal</h3><p>Si ya sos estudiante o trainer.</p></a>
</div>`)
+ section('¿Cómo funciona?', null, `<ul class="sp-list"><li>Nos escribís o hacés el diagnóstico</li><li>Entendemos tu caso</li><li>Te decimos Foundations, ORT, solo práctica o TOEIC</li><li>Agendás si querés — sin presión</li></ul>`)
+ ctaBand('Estamos listos', 'Elegí el canal que te quede más fácil.', btn(DIAG, 'Diagnóstico', true) + btn(WA, 'WhatsApp'))
+ foot());

/* Path pages */
write('foundations-path.html', head({
  title: 'Desde cero en inglés — Foundations | Infinity Studio CR',
  desc: 'Casi no sabés inglés y lo necesitás para trabajar. Foundations: profe 1 a 1 + Jill 24/7. ₡67.500/mes. Diagnóstico gratis.',
  canonical: 'https://studioinfinitycr.com/foundations-path.html',
  ogTitle: 'Desde cero en inglés — Foundations | Infinity Studio CR',
  ogDesc: 'Armás base y confianza para hablar. Profe 1 a 1 + Jill. ₡67.500/mes.'
}) + hero({
  eyebrow: 'Camino · Foundations',
  h1: 'Casi no sé inglés — y lo necesito para trabajar',
  lead: 'Foundations no es otro “inglés básico” de salón. Armás oraciones y confianza para hablar, con profe 1 a 1 (12 h/mes) y Jill entre clases. ₡67.500/mes.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('pricing.html', 'Ver precios'),
  visualLabel: 'Path',
  visualTitle: 'Base sin presión',
  visualBody: `<ol class="path-timeline" style="margin:0"><li><strong>Diagnóstico</strong><span>90 min gratis</span></li><li><strong>Base</strong><span>Jill + profe</span></li><li><strong>ORT</strong><span>cuando estás listo</span></li></ol>`,
  visualMeta: 'Ruta Foundations'
}) + section('¿Cómo se ve?', null, `<ol class="path-timeline">
  <li><strong>Diagnóstico (gratis)</strong><span>90 min: dónde estás y si Foundations es tu camino.</span></li>
  <li><strong>Base sin presión</strong><span>Oraciones, tiempos, práctica diaria con Jill. El profe calibra.</span></li>
  <li><strong>Primera presión leve</strong><span>Charlas más largas. Cuando estás listo, pasás a ORT o seguís consolidando.</span></li>
</ol>`)
+ section('Para vos si…', null, `<div class="sp-card-grid">
  <div class="sp-card"><h3>Cero o casi cero</h3><p>No querés otros 3 años de salón.</p></div>
  <div class="sp-card"><h3>Inglés para trabajar</h3><p>Call center, BPO o entrevista — no solo certificado.</p></div>
  <div class="sp-card"><h3>1 a 1 + práctica</h3><p>No solo 2 horas a la semana.</p></div>
</div>`)
+ ctaBand('Resultado', 'Dejar de quedarte en blanco en lo básico — y tener base para hablar cuando importa.', btn(DIAG, 'Diagnóstico gratis', true) + btn('ort-path.html', 'Ya entendés pero te trabás →'))
+ foot());

write('ort-path.html', head({
  title: 'Te trabás al hablar — ORT | Infinity Studio CR',
  desc: 'Entendés inglés pero te congelás en entrevistas o llamadas. ORT: entrenamiento bajo presión. ₡67.500/mes. Diagnóstico gratis.',
  canonical: 'https://studioinfinitycr.com/ort-path.html'
}) + hero({
  eyebrow: 'Camino · ORT',
  h1: 'Entendés — pero te trabás cuando importa',
  lead: 'ORT entrena ejecución bajo presión: entrevistas, call center y llamadas reales. Profe 1 a 1 + Alice + Nexora. ₡67.500/mes.',
  ctas: btn(DIAG, 'Hacé tu diagnóstico', true) + btn('ort.html', 'Ver ORT'),
  visualLabel: 'Path',
  visualTitle: 'Pressure readiness',
  visualBody: `<div class="chips"><span class="chip">Interview</span><span class="chip">BPO</span><span class="chip">Calls</span><span class="chip">Remote</span></div>`,
  visualMeta: 'Ruta ORT'
}) + section('¿Cómo se ve?', null, `<ol class="path-timeline">
  <li><strong>Diagnóstico</strong><span>Confirmamos que ORT es tu nivel (no Foundations).</span></li>
  <li><strong>Presión calibrada</strong><span>Escenarios con Alice y Nexora + trainer.</span></li>
  <li><strong>Ejecución</strong><span>Respuesta más clara cuando la situación es real.</span></li>
</ol>`)
+ ctaBand('Confirmá tu nivel', 'Diagnóstico gratis.', btn(DIAG, 'Diagnóstico', true) + btn('foundations-path.html', '← Casi no sé inglés'))
+ foot());

write('advanced-path.html', head({
  title: 'Práctica intensiva — Nexora | Infinity Studio CR',
  desc: 'Ya hablás y necesitás práctica masiva bajo presión. Nexora: simulaciones laborales. Consultá disponibilidad.',
  canonical: 'https://studioinfinitycr.com/advanced-path.html'
}) + hero({
  eyebrow: 'Camino · Avanzado',
  h1: 'Ya hablás — falta práctica masiva',
  lead: 'Simulaciones de entrevista y situaciones laborales antes del día que no podés repetir. Nexora dentro del ecosistema Infinity.',
  ctas: btn('hablemos.html?solicitar=nexora#consulta', 'Solicitar demo', true) + btn('../try-nexora.html', 'Conocer demo'),
  visualLabel: 'Advanced',
  visualTitle: 'Nexora simulations',
  visualBody: `<div class="scenario-list motif-nexora"><div class="scenario">Interview drill</div><div class="scenario">Workplace pressure</div></div>`,
  visualMeta: '₡28.500 / 30 días según listado vigente'
}) + section('Para vos si…', null, `<ul class="sp-list"><li>Ya tenés base conversacional</li><li>Necesitás volumen de práctica bajo presión</li><li>Querés simulaciones antes de entrevistas reales</li></ul>`)
+ ctaBand('Hablemos de Nexora', 'Demo o consulta según tu caso.', btn('hablemos.html', 'Hablemos', true) + btn('pricing.html', 'Precios'))
+ foot());

console.log('done');
