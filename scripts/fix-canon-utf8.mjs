import fs from 'fs';
import path from 'path';

const root = path.resolve('assets/canon');

const gerundio = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" role="img" aria-label="Gerundio PC - P + To Be + V+ing + C">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3ebff"/>
      <stop offset="100%" stop-color="#ede9fe"/>
    </linearGradient>
    <style>
      .title { font-family: Inter,Segoe UI,sans-serif; font-weight: 800; fill: #5B21B6; }
      .sub { font-family: Inter,Segoe UI,sans-serif; fill: #6d28d9; }
      .slot { opacity: 0; transform: translateY(12px); }
      .slot-label { font-family: Inter,Segoe UI,sans-serif; font-weight: 700; fill: #5B21B6; font-size: 22px; }
      .slot-hint { font-family: Inter,Segoe UI,sans-serif; fill: #312e81; font-size: 16px; }
      .example { opacity: 0; }
      .ex-word { font-family: ui-monospace,Consolas,monospace; font-size: 28px; font-weight: 700; fill: #312e81; }
      .ex-ing { fill: #D97706; }
      .pulse { animation: pulse 2.4s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #s-p { animation: fadeUp 0.7s ease forwards 0.3s; }
      #s-be { animation: fadeUp 0.7s ease forwards 1.1s; }
      #s-v { animation: fadeUp 0.7s ease forwards 1.9s; }
      #s-c { animation: fadeUp 0.7s ease forwards 2.7s; }
      #formula { animation: fadeUp 0.8s ease forwards 3.5s; }
      #ex1 { animation: fadeUp 0.8s ease forwards 4.3s; }
      #ex2 { animation: fadeUp 0.8s ease forwards 5.1s; }
      #note { animation: fadeUp 0.8s ease forwards 5.9s; }
    </style>
  </defs>
  <rect width="960" height="540" fill="url(#bg)" rx="16"/>
  <text x="480" y="52" text-anchor="middle" class="title" font-size="28">GERUNDIO - PC (Presente Continuo)</text>
  <text x="480" y="82" text-anchor="middle" class="sub" font-size="16">Mecanica Estructural Infinity - ranuras P | To Be | V+ing | C</text>

  <g id="s-p" class="slot">
    <rect x="48" y="120" width="180" height="100" rx="14" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>
    <text x="138" y="162" text-anchor="middle" class="slot-label">P</text>
    <text x="138" y="192" text-anchor="middle" class="slot-hint">Pronombre</text>
    <text x="138" y="214" text-anchor="middle" class="slot-hint" font-size="14">I | You | He | She | They</text>
  </g>
  <g id="s-be" class="slot">
    <rect x="258" y="120" width="180" height="100" rx="14" fill="#ddd6fe" stroke="#7c3aed" stroke-width="2"/>
    <text x="348" y="162" text-anchor="middle" class="slot-label">To Be</text>
    <text x="348" y="192" text-anchor="middle" class="slot-hint">am | is | are</text>
    <text x="348" y="214" text-anchor="middle" class="slot-hint" font-size="14">concuerda con P</text>
  </g>
  <g id="s-v" class="slot pulse">
    <rect x="468" y="120" width="210" height="100" rx="14" fill="#fef3c7" stroke="#D97706" stroke-width="2.5"/>
    <text x="573" y="162" text-anchor="middle" class="slot-label" fill="#B45309">V + ing</text>
    <text x="573" y="192" text-anchor="middle" class="slot-hint" fill="#92400E">gerundio</text>
    <text x="573" y="214" text-anchor="middle" class="slot-hint" font-size="14" fill="#92400E">work - working | go - going</text>
  </g>
  <g id="s-c" class="slot">
    <rect x="708" y="120" width="204" height="100" rx="14" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>
    <text x="810" y="162" text-anchor="middle" class="slot-label">C</text>
    <text x="810" y="192" text-anchor="middle" class="slot-hint">Complemento</text>
    <text x="810" y="214" text-anchor="middle" class="slot-hint" font-size="14">now | at home | today</text>
  </g>

  <g id="formula" class="example">
    <rect x="120" y="248" width="720" height="44" rx="10" fill="rgba(91,33,182,0.08)" stroke="rgba(91,33,182,0.25)"/>
    <text x="480" y="278" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="22" font-weight="700" fill="#5B21B6">P + To Be + V+ing + C</text>
  </g>

  <g id="ex1" class="example">
    <text x="480" y="330" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" fill="#6d28d9">Afirmativa</text>
    <text x="480" y="368" text-anchor="middle">
      <tspan class="ex-word">They </tspan>
      <tspan class="ex-word">are </tspan>
      <tspan class="ex-word ex-ing">coming</tspan>
      <tspan class="ex-word"> now</tspan>
    </text>
  </g>

  <g id="ex2" class="example">
    <text x="480" y="410" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" fill="#6d28d9">Pregunta (moneda)</text>
    <text x="480" y="448" text-anchor="middle">
      <tspan class="ex-word">Are </tspan>
      <tspan class="ex-word">they </tspan>
      <tspan class="ex-word ex-ing">coming</tspan>
      <tspan class="ex-word"> now?</tspan>
    </text>
  </g>

  <g id="note" class="example">
    <text x="480" y="510" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" fill="#312e81">Accion en progreso - ahora - en este momento</text>
  </g>
</svg>
`;

const negaciones = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="Negaciones MSI">
  <rect width="320" height="200" rx="12" fill="none"/>
  <text x="160" y="24" text-anchor="middle" fill="#5B21B6" font-family="Inter,sans-serif" font-size="12" font-weight="bold">NEGACION - P + AUX + NOT + V + C</text>
  <text x="160" y="42" text-anchor="middle" fill="#92400e" font-family="Inter,sans-serif" font-size="9">espanol: no + verbo  |  ingles: auxiliar + not (nunca "I no work")</text>

  <rect x="12" y="52" width="48" height="28" rx="6" fill="#ede9fe" stroke="#7c3aed"/><text x="36" y="70" text-anchor="middle" fill="#5B21B6" font-size="10" font-weight="bold">P</text>
  <text x="68" y="70" text-anchor="middle" fill="#6d28d9" font-size="14">+</text>
  <rect x="78" y="52" width="56" height="28" rx="6" fill="#fef3c7" stroke="#D97706"/><text x="106" y="70" text-anchor="middle" fill="#92400e" font-size="10" font-weight="bold">AUX</text>
  <text x="142" y="70" text-anchor="middle" fill="#6d28d9" font-size="14">+</text>
  <rect x="152" y="52" width="48" height="28" rx="6" fill="#fee2e2" stroke="#dc2626"/><text x="176" y="70" text-anchor="middle" fill="#b91c1c" font-size="10" font-weight="bold">NOT</text>
  <text x="208" y="70" text-anchor="middle" fill="#6d28d9" font-size="14">+</text>
  <rect x="218" y="52" width="40" height="28" rx="6" fill="#ede9fe" stroke="#7c3aed"/><text x="238" y="70" text-anchor="middle" fill="#5B21B6" font-size="10" font-weight="bold">V</text>
  <text x="266" y="70" text-anchor="middle" fill="#6d28d9" font-size="14">+</text>
  <rect x="276" y="52" width="32" height="28" rx="6" fill="#ede9fe" stroke="#7c3aed"/><text x="292" y="70" text-anchor="middle" fill="#5B21B6" font-size="10" font-weight="bold">C</text>

  <text x="20" y="100" fill="#6d28d9" font-size="9" font-weight="bold">PR</text>
  <text x="48" y="100" fill="#312e81" font-size="9">do / does + not + V</text>
  <text x="200" y="100" fill="#D97706" font-size="9">I don't work</text>

  <text x="20" y="116" fill="#6d28d9" font-size="9" font-weight="bold">PS</text>
  <text x="48" y="116" fill="#312e81" font-size="9">did + not + V</text>
  <text x="200" y="116" fill="#D97706" font-size="9">I didn't go</text>

  <text x="20" y="132" fill="#6d28d9" font-size="9" font-weight="bold">BE/PC</text>
  <text x="52" y="132" fill="#312e81" font-size="9">am/is/are + not (+ing)</text>
  <text x="200" y="132" fill="#D97706" font-size="9">She isn't working</text>

  <text x="20" y="148" fill="#6d28d9" font-size="9" font-weight="bold">PRP</text>
  <text x="48" y="148" fill="#312e81" font-size="9">have/has + not + PP</text>
  <text x="200" y="148" fill="#D97706" font-size="9">We haven't finished</text>

  <text x="20" y="164" fill="#6d28d9" font-size="9" font-weight="bold">MOD</text>
  <text x="48" y="164" fill="#312e81" font-size="9">will/would/can + not + V</text>
  <text x="200" y="164" fill="#D97706" font-size="9">I won't / wouldn't</text>

  <text x="160" y="188" text-anchor="middle" fill="#6d28d9" font-size="9">Trampa: I no work  -&gt;  I not work  -&gt;  I don't work</text>
</svg>
`;

fs.mkdirSync(path.join(root, 'anim'), { recursive: true });
fs.writeFileSync(path.join(root, 'anim', 'gerundio-pc.svg'), gerundio, 'utf8');
fs.writeFileSync(path.join(root, 'negaciones.svg'), negaciones, 'utf8');

const cfg = {
  version: 3,
  background: '#f3ebff',
  backgroundImage: 'assets/canon/frame-bg.png',
  frame: { width: 320, height: 180, radius: 12 },
  stage: { aspectRatio: '16/9', minHeightVh: 52 },
  palette: {
    title: '#5B21B6',
    label: '#6d28d9',
    body: '#312e81',
    accent: '#7c3aed',
    example: '#D97706'
  },
  clips: [
    {
      id: 'gerundio-pc',
      columns: ['progressive'],
      svg: 'assets/canon/anim/gerundio-pc.svg',
      animatedSvg: 'assets/canon/anim/gerundio-pc.svg',
      gif: null,
      title: 'Gerundio - PC (P + To Be + V+ing + C)'
    },
    { id: 'tiempos', columns: ['present', 'past', 'combined'], svg: 'assets/canon/tiempos.svg', gif: null, title: 'Tiempos verbales' },
    { id: 'preposiciones', columns: ['prepositions'], svg: 'assets/canon/preposiciones.svg', gif: null, title: 'Preposiciones' },
    { id: 'preposiciones-tiempo', columns: [], svg: 'assets/canon/preposiciones-tiempo.svg', gif: null, title: 'Preposiciones tiempo' },
    { id: 'there-existencial', columns: ['there'], svg: 'assets/canon/there-existencial.svg', gif: null, title: 'There is / There are' },
    { id: 'negaciones', columns: ['negations'], svg: 'assets/canon/negaciones.svg', gif: null, title: 'Negaciones - AUX + NOT' },
    { id: 'comparativos', columns: [], svg: 'assets/canon/comparativos.svg', gif: null, title: 'Comparativos' },
    { id: 'articulos', columns: ['perfect'], svg: 'assets/canon/articulos.svg', gif: null, title: 'Articulos y cuantificadores' },
    { id: 'moneda', columns: ['modal'], svg: 'assets/canon/moneda.svg', gif: null, title: 'Metodo moneda' }
  ]
};

fs.writeFileSync('config/jill-canon-visual.json', JSON.stringify(cfg, null, 2) + '\n', 'utf8');
fs.writeFileSync('backend/config/jill-canon-visual.json', JSON.stringify(cfg, null, 2) + '\n', 'utf8');
console.log('canon UTF-8 assets rewritten');
