const fs = require('fs');
const path = require('path');

const credit = `<footer class="cadamag-credit" aria-label="Autoría">
  <p class="cadamag-credit-line">
    <span class="cadamag-credit-by">Created by Cadamag Automação</span>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="mailto:cadamag.automacao@gmail.com">cadamag.automacao@gmail.com</a>
    <span class="cadamag-credit-sep" aria-hidden="true">·</span>
    <a class="cadamag-credit-link" href="https://wa.me/5592984168201" target="_blank" rel="noopener noreferrer">+55 (92) 98416-8201</a>
  </p>
</footer>`;

function page(cfg) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>${cfg.title}</title>
  <meta name="description" content="${cfg.desc}">
  <link rel="canonical" href="${cfg.canonical}">
  <meta property="og:title" content="${cfg.title}">
  <meta property="og:description" content="${cfg.desc}">
  <meta property="og:type" content="website">
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
  <link rel="stylesheet" href="css/prototype.css?v=20260928nav1">
  <link rel="stylesheet" href="css/brand.css?v=20260928nav1">
  <link rel="stylesheet" href="css/site-nav.css?v=20260928nav1">
  <link rel="stylesheet" href="css/site-page.css?v=20260928nav1">
  <script src="js/site-nav.js?v=20260928nav1" defer></script>
</head>
<body data-nav-root="../" data-nav-home="index.html">
<a class="skip-link" href="#main">Saltar al contenido</a>
<div class="prototype-badge" aria-hidden="true">Prototype · Cadamag</div>
<header class="site-header" data-site-nav></header>
<main id="main" class="page-main">
  <div class="page-atmosphere" aria-hidden="true"></div>
  <div class="page-shell">
    <p class="page-eyebrow">${cfg.eyebrow}</p>
    <h1 class="page-hero-title">${cfg.h1}</h1>
    <p class="page-lead">${cfg.lead}</p>
    <div class="page-cta-row">${cfg.ctaHtml}</div>
    <div class="page-grid">
      <div>${cfg.blocks}</div>
      <aside class="page-visual" aria-label="Vista del producto">
        <span class="page-visual-label">${cfg.visual.label}</span>
        <div class="page-visual-body">${cfg.visual.body}</div>
        <p class="page-visual-meta">${cfg.visual.meta}</p>
      </aside>
    </div>
    <div class="page-relation">${cfg.relation}</div>
  </div>
</main>
<nav class="site-footer-mini" aria-label="Enlaces">
  <a href="index.html">Inicio</a>
  <a href="../pricing.html">Precios</a>
  <a href="../hablemos.html">Hablemos</a>
  <a href="../portal-access.html">Portal</a>
</nav>
${credit}
</body>
</html>`;
  fs.writeFileSync(path.join(__dirname, '..', cfg.file), html);
  console.log('wrote', cfg.file);
}

page({
  file: 'alice.html',
  title: 'Alice — Práctica de conversación por voz | Infinity Studio',
  desc: 'Alice es la práctica conversacional por voz de Infinity Studio: entrenamiento recurrente en inglés para situaciones reales.',
  canonical: 'https://studioinfinitycr.com/alice.html',
  eyebrow: 'Herramienta IA · Speaking',
  h1: 'Alice',
  lead: 'Práctica de conversación en inglés por voz. Entrenamiento recurrente para hablar con más claridad cuando la situación lo exige.',
  ctaHtml: '<a class="btn btn-primary" href="../try-alice.html">Probar Alice</a><a class="btn btn-secondary" href="../hablemos.html">Hablemos</a>',
  blocks: `<section class="page-block"><h2>Qué hace</h2><ul>
    <li>Práctica conversacional por voz</li>
    <li>Disponible para entrenamiento recurrente entre clases</li>
    <li>Enfoque en uso real del inglés, no solo teoría</li>
  </ul></section>
  <section class="page-block"><h2>Para quién</h2><p>Personas que ya entienden bastante, pero necesitan practicar hablar bajo condiciones más reales — entrevistas, trabajo y conversación cotidiana profesional.</p></section>
  <section class="page-block"><h2>Cómo se usa en Infinity</h2><p>Alice acompaña el trabajo con trainer. Entre clases, podés practicar por voz y sostener el ritmo de entrenamiento.</p></section>`,
  visual: {
    label: 'Mini visual',
    body: 'Alice Speaking Coach<br>Live practice layer<br><span style="opacity:.7">Mic active · voice turn</span>',
    meta: 'Vista conceptual basada en el Companion de práctica por voz.'
  },
  relation: '<p>Se integra con <a href="../foundations.html">Foundations</a> y <a href="../ort.html">ORT</a> como práctica entre sesiones. <a href="index.html#ecosistema">Ver ecosistema</a>.</p>'
});

page({
  file: 'jill.html',
  title: 'Jill — Drills Foundations bajo presión | Infinity Studio',
  desc: 'Jill entrena drills de Foundations bajo presión: práctica rápida y estructurada para construir respuestas con más solidez.',
  canonical: 'https://studioinfinitycr.com/jill.html',
  eyebrow: 'Herramienta IA · Foundations',
  h1: 'Jill',
  lead: 'Drills de Foundations bajo presión. Práctica rápida para construir estructura, velocidad de respuesta y claridad.',
  ctaHtml: '<a class="btn btn-primary" href="../try-jill.html">Probar Jill</a><a class="btn btn-secondary" href="../foundations.html">Ver Foundations</a>',
  blocks: `<section class="page-block"><h2>Qué hace</h2><ul>
    <li>Rapid drills alineados a Foundations</li>
    <li>Práctica bajo presión controlada</li>
    <li>Enfoque en estructura y respuesta, no solo vocabulario suelto</li>
  </ul></section>
  <section class="page-block"><h2>Para quién</h2><p>Quienes necesitan fortalecer la base y entrenar respuestas con más ritmo antes de enfrentar entrevistas o situaciones exigentes.</p></section>
  <section class="page-block"><h2>Cómo se usa en Infinity</h2><p>Jill refuerza Foundations entre clases. Complementa el trabajo 1 a 1 del trainer con drills repetibles.</p></section>`,
  visual: {
    label: 'Mini visual',
    body: 'Foundations drill<br>Q → response under pressure<br><span style="opacity:.7">Rapid cycle · structured output</span>',
    meta: 'Basado en el flujo de drills Foundations verificado en el proyecto.'
  },
  relation: '<p>Diseñada para <a href="../foundations.html">Foundations</a>. En ORT el foco pasa a escenarios operacionales con otras capas del ecosistema.</p>'
});

page({
  file: 'nexora.html',
  title: 'Nexora — Simulaciones laborales | Infinity Studio',
  desc: 'Nexora es el Simulation Lab de Infinity Studio: simulaciones de situaciones laborales para entrenar respuestas profesionales.',
  canonical: 'https://studioinfinitycr.com/nexora.html',
  eyebrow: 'Herramienta IA · Simulation Lab',
  h1: 'Nexora',
  lead: 'Simulaciones de situaciones reales de trabajo. Entrená respuestas profesionales antes de que la presión llegue de verdad.',
  ctaHtml: '<a class="btn btn-primary" href="../try-nexora.html">Conocer demo</a><a class="btn btn-secondary" href="../hablemos.html">Solicitar demo</a>',
  blocks: `<section class="page-block"><h2>Qué hace</h2><ul>
    <li>Simulation Lab para escenarios laborales</li>
    <li>Práctica de entrevistas y situaciones profesionales</li>
    <li>Entrenamiento orientado a respuesta bajo presión</li>
  </ul></section>
  <section class="page-block"><h2>Para quién</h2><p>Profesionales y aspirantes que necesitan ensayar interacciones reales: entrevista, atención, reunión o respuesta estructurada.</p></section>
  <section class="page-block"><h2>Cómo se usa en Infinity</h2><p>Nexora conecta el entrenamiento con escenarios. Se usa junto a ORT y la práctica con trainer para ensayar antes del momento real.</p></section>`,
  visual: {
    label: 'Mini visual',
    body: 'Scenario · Client call…<br>Interview / workplace simulation<br><span style="opacity:.7">Pressure layer · response path</span>',
    meta: 'Representación editorial del Simulation Lab (sin exponer datos privados).'
  },
  relation: '<p>Se alinea especialmente con <a href="../ort.html">ORT</a>. También aparece en el <a href="index.html#ecosistema">ecosistema Infinity</a>.</p>'
});

page({
  file: 'claire.html',
  title: 'Claire — Práctica TOEIC | Infinity Studio',
  desc: 'Claire apoya práctica TOEIC con corrección inmediata: Listening, Reading y feedback directo dentro del ecosistema Infinity.',
  canonical: 'https://studioinfinitycr.com/claire.html',
  eyebrow: 'Herramienta IA · TOEIC',
  h1: 'Claire',
  lead: 'Práctica TOEIC con corrección inmediata. Listening, Reading y feedback directo para entrenar con más precisión.',
  ctaHtml: '<a class="btn btn-primary" href="diagnostico.html">Hacé tu diagnóstico</a><a class="btn btn-secondary" href="../pricing.html">Conocer los programas</a>',
  blocks: `<section class="page-block"><h2>Qué hace</h2><ul>
    <li>Práctica TOEIC (Listening / Reading)</li>
    <li>Corrección inmediata durante el ejercicio</li>
    <li>Modos de práctica directa orientados a score</li>
  </ul></section>
  <section class="page-block"><h2>Para quién</h2><p>Quienes necesitan preparar TOEIC con práctica guiada y feedback inmediato, dentro de un plan Infinity — no como producto aislado.</p></section>
  <section class="page-block"><h2>Cómo se usa en Infinity</h2><p>Claire se integra al ecosistema de entrenamiento. El plan concreto se define en el diagnóstico y con el trainer.</p></section>`,
  visual: {
    label: 'Mini visual',
    body: 'TOEIC practice<br>Reading Part 5 · Listening<br><span style="opacity:.7">Immediate correction loop</span>',
    meta: 'Capacidades verificadas en claire.js / portal. Sin demo pública standalone.'
  },
  relation: '<p>No hay botón “Probar” público separado. Empezá por el <a href="diagnostico.html">diagnóstico</a> o revisá <a href="../pricing.html">programas y precios</a>.</p>'
});

page({
  file: 'training-book.html',
  title: 'Training Book — Progreso entre clases | Infinity Studio',
  desc: 'Training Book concentra ejercicios, seguimiento y práctica entre clases para sostener el progreso dentro de Infinity Studio.',
  canonical: 'https://studioinfinitycr.com/training-book.html',
  eyebrow: 'Sistema · Progreso',
  h1: 'Training Book',
  lead: 'Ejercicios y progreso entre clases. La capa que sostiene el entrenamiento cuando no estás en sesión con tu profe.',
  ctaHtml: '<a class="btn btn-primary" href="index.html#ecosistema">Conocer Infinity</a><a class="btn btn-secondary" href="../portal-access.html">Portal</a>',
  blocks: `<section class="page-block"><h2>Qué hace</h2><ul>
    <li>Ejercicios entre clases</li>
    <li>Seguimiento de progreso visible para estudiante y trainer</li>
    <li>Práctica estructurada que acompaña Foundations y ORT</li>
  </ul></section>
  <section class="page-block"><h2>Para quién</h2><p>Estudiantes Infinity que necesitan continuidad entre sesiones — no solo “estudiar cuando hay clase”.</p></section>
  <section class="page-block"><h2>Cómo se usa en Infinity</h2><p>El Training Book operativo vive en el Portal autorizado. Esta página explica el rol del sistema; no expone contenido privado de estudiantes.</p></section>`,
  visual: {
    label: 'Mini visual',
    body: 'Weekly progress<br>Exercises · path · feedback<br><span style="opacity:.7">Student + trainer shared view</span>',
    meta: 'Presentación comercial. Acceso al producto vía Portal.'
  },
  relation: '<p>Parte del <a href="index.html#ecosistema">ecosistema</a>. Acceso operativo: <a href="../portal-access.html">Portal</a>. Consultas: <a href="../hablemos.html">Hablemos</a>.</p>'
});
