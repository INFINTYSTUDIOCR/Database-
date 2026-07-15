/**
 * Jill Structure Coach ù "Learning DJ".
 *
 * Escucha el turno del alumno (texto ya transcrito por el micrùfono) y detecta
 * fallos de ESTRUCTURA, no de acento. En la metodologùa Infinity el acento se
 * contagia de la pronunciaciùn del TTS de Jill, asù que acù SOLO miramos:
 *   - tiempos verbales (tense)
 *   - preposiciones (preposition)
 *   - expresiones / colocaciones (expression)
 *   - vocabulario / fuga de espaùol y falsos amigos (vocab)
 *   - orden de palabras (word_order)
 *
 * Ademùs fija el "ritmo" adaptativo (tempo): down / hold / up ù como un DJ que
 * pone el BPM correcto segùn cùmo viene el alumno en la sesiùn.
 *
 * Los detectores son heurùsticos y CONSERVADORES (alta precisiùn): solo marcan
 * patrones clùsicos de hispanohablantes. La correcciùn fina la hace Claude con
 * la directiva que este mùdulo arma; las marcas heurùsticas alimentan el cerebro
 * (cascada) y el tempo del DJ.
 */

'use strict';

const MODALS = new Set([
  'will', 'would', 'can', 'could', 'should', 'must', 'may', 'might',
  'do', "don't", 'does', "doesn't", 'did', "didn't", 'to', 'not', 'never',
  "can't", "won't", "shouldn't", "wouldn't", "couldn't", 'please', "let's"
]);
const THIRD = new Set(['he', 'she', 'it']);
const TOBE = new Set(['am', 'is', 'are', 'was', 'were']);
const BASE_VERBS = new Set([
  'go', 'do', 'have', 'make', 'take', 'want', 'need', 'say', 'work', 'study',
  'live', 'like', 'play', 'know', 'think', 'get', 'see', 'come', 'feel', 'look',
  'watch', 'talk', 'eat', 'drink', 'speak', 'read', 'write', 'run', 'walk', 'call'
]);
const THIRD_S = {
  go: 'goes', do: 'does', have: 'has', study: 'studies', watch: 'watches'
};

const PREP_FIXES = [
  { re: /\bdepends?\s+of\b/i, msg: 'depend ON (no "of")' },
  { re: /\bdepend\s+in\b/i, msg: 'depend ON (no "in")' },
  { re: /\bmarried\s+with\b/i, msg: 'married TO' },
  { re: /\barrive(d|s)?\s+to\b/i, msg: 'arrive AT / IN (sin "to")' },
  { re: /\blisten\s+(music|the|radio|me|him|her|them|you)\b/i, msg: 'listen TO' },
  { re: /\bgood\s+in\s+(?!the\b)/i, msg: 'good AT' },
  { re: /\binterested\s+(on|for)\b/i, msg: 'interested IN' },
  { re: /\bexplain\s+me\b/i, msg: 'explain TO me' },
  { re: /\bdiscuss\s+about\b/i, msg: 'discuss (sin "about")' },
  { re: /\bwait\s+(me|him|her|them|you)\b/i, msg: 'wait FOR' },
  { re: /\bin\s+the\s+night\b/i, msg: 'AT night' },
  { re: /\bafraid\s+(to\s+the|for)\b/i, msg: 'afraid OF' }
];

const EXPR_FIXES = [
  { re: /\bi\s+have\s+\d+\s+years?\b/i, msg: 'I AM X years old (no "have")' },
  { re: /\bmake\s+a\s+question\b/i, msg: 'ASK a question' },
  { re: /\bmake\s+a\s+party\b/i, msg: 'HAVE / THROW a party' },
  { re: /\btake\s+a\s+decision\b/i, msg: 'MAKE a decision' },
  { re: /\bput\s+attention\b/i, msg: 'PAY attention' },
  { re: /\bi\s+am\s+agree\b/i, msg: 'I AGREE (sin "am")' }
];

const VOCAB_FIXES = [
  { re: /\bassist\s+to\b/i, msg: 'ATTEND (no "assist to")' },
  { re: /\bmake\s+(my|the|your|his|her)\s+homework\b/i, msg: 'DO homework' }
];

const WORD_ORDER_FIXES = [
  { re: /\bhow\s+i\s+can\b/i, msg: 'how CAN I (verbo antes del sujeto)' },
  { re: /\bwhat\s+means\b/i, msg: 'what DOES it mean' }
];

const ES_LEAK = /\b(pero|porque|entonces|tambien|tambiùn|siempre|nunca|muy|mucho|hacer|tengo|quiero|puedo|estoy|trabajo|gente|cosa|casa|comida|ahora|luego|aqui|aquù|alli|allù|todavia|todavùa)\b/i;

function englishWordCount(text) {
  return (String(text || '').match(/\b[a-zA-Z']+\b/g) || []).length;
}

function tokenize(text) {
  return String(text || '').toLowerCase().match(/[a-z']+/g) || [];
}

function pushFinding(list, seen, finding) {
  if (seen.has(finding.category)) return;
  seen.add(finding.category);
  list.push(finding);
}

function scanTense(text, tokens, findings, seen) {
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    const next = tokens[i + 1];
    const prev = i > 0 ? tokens[i - 1] : '';
    if (MODALS.has(prev)) continue;

    if (THIRD.has(w) && BASE_VERBS.has(next)) {
      const correct = THIRD_S[next] || (next + 's');
      pushFinding(findings, seen, {
        category: 'tense', kpi: 'k2',
        issue: `3ù persona: "${w} ${next}" ? "${w} ${correct}"`
      });
      return;
    }
    if (TOBE.has(w) && BASE_VERBS.has(next) && !next.endsWith('ing')) {
      pushFinding(findings, seen, {
        category: 'tense', kpi: 'k3',
        issue: `Progresivo: "${w} ${next}" ? "${w} ${next}ing" (To Be + V-ing)`
      });
      return;
    }
    if ((w === 'did' || w === "didn't") && (next.endsWith('ed') || THIRD_S[next])) {
      pushFinding(findings, seen, {
        category: 'tense', kpi: 'k2',
        issue: `Doble pasado: despuùs de "did" va verbo base, no "${next}"`
      });
      return;
    }
  }

  // Marcador de pasado + verbo en base (clasico: "yesterday I go").
  if (!seen.has('tense')) {
    const mark = text.match(/\b(yesterday|last\s+(?:night|week|month|year)|ago)\b/i);
    if (mark) {
      for (let i = 0; i < tokens.length; i++) {
        const w = tokens[i];
        const prev = i > 0 ? tokens[i - 1] : '';
        if (BASE_VERBS.has(w) && !MODALS.has(prev) && !THIRD.has(prev) && !TOBE.has(prev)) {
          pushFinding(findings, seen, {
            category: 'tense', kpi: 'k2',
            issue: 'Marcador de pasado ("' + mark[0] + '"): "' + w + '" va en pasado'
          });
          break;
        }
      }
    }
  }
}

function scanList(text, list, category, kpi, findings, seen) {
  for (const f of list) {
    if (f.re.test(text)) {
      pushFinding(findings, seen, { category, kpi, issue: f.msg });
      return;
    }
  }
}

/**
 * Analiza un turno del alumno. Devuelve findings + structureOk heurùstico.
 * structureOk === false si detectù algùn fallo; null si no hay seùal suficiente.
 */
function analyzeTurn(text, opts = {}) {
  const raw = String(text || '').trim();
  const words = englishWordCount(raw);
  const findings = [];
  const seen = new Set();

  if (words < 2) {
    return { findings: [], structureOk: null, mostlyEnglish: false };
  }

  const tokens = tokenize(raw);
  scanTense(raw, tokens, findings, seen);
  scanList(raw, PREP_FIXES, 'preposition', 'k5', findings, seen);
  scanList(raw, EXPR_FIXES, 'expression', 'k8', findings, seen);
  scanList(raw, VOCAB_FIXES, 'vocab', 'k7', findings, seen);
  scanList(raw, WORD_ORDER_FIXES, 'word_order', 'k6', findings, seen);

  const mostlyEnglish = words >= 3;
  if (mostlyEnglish && ES_LEAK.test(raw)) {
    pushFinding(findings, seen, {
      category: 'vocab', kpi: 'k7',
      issue: 'Metiù una palabra en espaùol ù buscù el tùrmino en inglùs'
    });
  }

  const capped = findings.slice(0, 3);
  return {
    findings: capped,
    structureOk: capped.length ? false : null,
    mostlyEnglish
  };
}

/* ------------------------------------------------------------------ *
 *  DJ del ritmo ù ventana de sesiùn en memoria (no persiste).
 *  Fija el tempo segùn cùmo viene el alumno en la sesiùn actual.
 * ------------------------------------------------------------------ */
const DJ = new Map();
const DJ_TTL_MS = 60 * 60 * 1000;
const DJ_WINDOW = 6;

function pruneDj() {
  const now = Date.now();
  for (const [id, s] of DJ) {
    if (now - (s.at || 0) > DJ_TTL_MS) DJ.delete(id);
  }
}

function djMove(studentId, structureOk) {
  if (!studentId) return { tempo: 'hold', window: [] };
  pruneDj();
  let s = DJ.get(studentId);
  if (!s) { s = { window: [], at: Date.now() }; DJ.set(studentId, s); }
  if (structureOk === true) s.window.push(1);
  else if (structureOk === false) s.window.push(0);
  if (s.window.length > DJ_WINDOW) s.window = s.window.slice(-DJ_WINDOW);
  s.at = Date.now();

  const win = s.window;
  const last3 = win.slice(-3);
  let tempo = 'hold';
  if (last3.length === 3 && last3.every((x) => x === 0)) tempo = 'down';
  else if (last3.length === 3 && last3.every((x) => x === 1)) tempo = 'up';
  else if (win.length >= 3) {
    const okRate = win.reduce((a, b) => a + b, 0) / win.length;
    if (okRate < 0.4) tempo = 'down';
    else if (okRate > 0.8 && win.length >= 4) tempo = 'up';
  }
  return { tempo, window: win.slice() };
}

const DJ_DIRECTIVE = {
  down: 'RITMO ? (bajù el tempo): el alumno viene fallando. Repetù el MISMO patrùn con otra frase simple y corta, mùs lento, UNA sola idea. No metas estructura nueva hasta que lo clave.',
  hold: 'RITMO = (mantenù): una correcciùn puntual + una prùctica del mismo tipo. Ritmo normal.',
  up: 'RITMO ? (subù el tempo): viene limpio. Felicitù corto, subù la dificultad: UNA estructura nueva o una idea mùs larga, ritmo ùgil.'
};

/**
 * Arma la directiva de escucha estructural + ritmo para el system prompt de Jill.
 */
function formatCoachNote(analysis, dj) {
  const lines = [
    '\nESCUCHA ESTRUCTURAL (Jill DJ de aprendizaje):',
    '- Escuchù el turno y detectù fallos SOLO en: tiempos verbales, preposiciones, expresiones, vocabulario y orden de palabras.',
    '- Si hay un fallo, dù UNA micro-correcciùn hablada y natural ("you went ? casi; decù I go conmigo"), modelù la forma correcta en voz alta (el acento se contagia de tu pronunciaciùn) y seguù.',
    '- Mùximo 1 correcciùn por turno. NO corrijas acento, tildes ni ortografùa. Correcciùn con afecto firme, no chatbot motivacional.'
  ];
  if (analysis?.findings?.length) {
    lines.push('- PISTAS (posibles fallos detectados por el oùdo): '
      + analysis.findings.map((f) => f.issue).join(' | '));
  }
  if (dj?.tempo && DJ_DIRECTIVE[dj.tempo]) {
    lines.push('- ' + DJ_DIRECTIVE[dj.tempo]);
  }
  return lines.join('\n');
}

module.exports = {
  analyzeTurn,
  djMove,
  formatCoachNote,
  englishWordCount
};
