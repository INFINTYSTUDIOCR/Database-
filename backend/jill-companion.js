/**
 * Jill Pro — Foundations Companion.
 * Charla libre de cualquier tema + coach en vivo (duda o mala estructura).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const JILL_PRO_BRAIN_VER = 'v16-canon-map';

const JILL_LANGUAGE_RULE = `IDIOMA (ESTRICTO):
- Hablás SOLO en ESPAÑOL por defecto — saludo, charla, explicaciones, correcciones, confirmaciones, todo.
- Español de Costa Rica / Centroamérica (voseo): vos, podés, querés, decime, armá, practicá. Natural, cálida, clara.
- PROHIBIDO español de España: vosotros, vale, tío, mola, currar, ordenador, coche, chaval, tío/a como muletilla, "os" (os digo).
- Usá: computadora (no ordenador), carro (no coche), vos (no tú forzado ni vosotros).
- Inglés ÚNICAMENTE cuando el estudiante pide practicar/hablar en inglés, o como EJEMPLO MODELO corto dentro de una corrección/explicación.
- En ejemplos en inglés: escribí las palabras en inglés limpio (can, should, go) — no las "españolices" en la prosa.
- Entendés español, inglés o Spanglish — sin reproche. Nunca mezcles inglés en la charla si no pidieron practicar.`;

const JILL_PRO_INTENT_RULE = `INTERPRETACIÓN DE INTENCIÓN (OBLIGATORIO — sos Claude, no un bot de menú):
- Leé el mensaje COMPLETO aunque venga desordenado, con typos, Spanglish, voz-a-texto, saludos mezclados o frases largas.
- Inferí QUÉ QUIERE: ¿explicación de gramática? ¿charlar? ¿practicar en inglés? ¿corrección? ¿ejemplo?
- Si la intención es recuperable, RESPONDÉ a eso de una. PROHIBIDO: "contame otra vez", "no te entendí", "repetí tu duda", "de qué querés charlar" cuando YA lo dijeron.
- Ejemplo: "hola cómo estás vieras que en clase preguntaban cómo se forma el futuro perfecto me ayudas" → saludá 1 frase y EXPLICÁ futuro perfecto (will have + V3). No pidas que lo repita.
- Si de verdad no hay contenido usable (solo "hola" / "ok" / ruido), ahí sí preguntá qué quieren.`;

function studentWantsEnglishPractice(message) {
  const t = String(message || '');
  return /\b(practicar en ingl[eé]s|practice english|speak english|let'?s (talk|speak|practice) in english|hablar en ingl[eé]s|hablemos en ingl[eé]s|quiero practicar|resp[oó]ndeme en ingl[eé]s|in english please|dec[ií]melo en ingl[eé]s|charlemos en ingl[eé]s|en ingl[eé]s por favor)\b/i.test(t);
}

function isEnglishDoubtRequest(message) {
  const t = String(message || '');
  if (!t.trim()) return false;
  const ask = /\b(explain|teach me|ens[eé][aá]me|expl[ií]c[aá]me|no entiendo|no me qued[oó]|don't understand|do not understand|how do i|how to use|c[oó]mo se (usa|dice|forma|hace)|qu[eé] es|ayud[aá]me( a )?entender|ayud[aá]me|pod[eé]s ayudarme|podes ayudarme|help me (understand|with)|can you (explain|help)|no me qued[oó] claro|me ense[nñ]aron|en clase|hoy (en clase |vimos |nos ense[nñ])|whiteboard|lecci[oó]n|duda|confund|confused|no s[eé] c[oó]mo|me ayudas|me ayud[aá]s|charlar acerca|hablar de|quiero (saber|entender|aprender))\b/i.test(t);
  const topic = /\b(gramm|gerund(?:io)?|tense|tiempo verbal|present (simple|continuous|perfect)|past (simple|continuous|perfect)|present perfect|past perfect|future (simple|continuous|perfect)|futuro(?:\s+perfecto)?|going to|modales?|preposici[oó]n(?:es)?|there (is|are)|ing vs to|infinitiv|inversi[oó]n|to be \+ ?ing|negaci[oó]n|don'?t|doesn'?t|didn'?t|isn'?t|aux\s*\+?\s*not|will have)\b/i.test(t);
  return ask || (topic && /\b(no |don'?t |how |qu[eé] |c[oó]mo |explain|ense|entend|duda|ayud|forma|charlar|hablar)\b/i.test(t));
}

function isClarityReply(message) {
  const t = String(message || '').trim().toLowerCase();
  if (!t || t.length > 80) return false;
  return /^(s[ií]|sip|claro|ok|okay|dale|listo|ya|entend[ií]|me qued[oó]|no|nop|todav[ií]a no|casi|more or less|m[aá]s o menos|un poco|yes|yeah|yep)([.!?\s]|$)/i.test(t)
    || /\b(me qued[oó] claro|ya entend[ií]|todav[ií]a no|no del todo|explicalo otra vez|otra vez|ahora s[ií])\b/i.test(t);
}

/** Heurística: intento en inglés mal armado (estructura rota / ranuras rotas). */
function looksLikeBrokenEnglish(message) {
  const t = String(message || '').trim();
  if (t.length < 4) return false;
  const hasLatin = /[áéíóúñ¿¡]/i.test(t);
  const enWords = (t.match(/\b[a-zA-Z']+\b/g) || []).length;
  const esCue = /\b(el|la|los|las|que|con|para|por|hoy|estoy|estás|porque|también|después)\b/i.test(t);
  // Mostly Spanish chat → not a broken English production turn
  if (hasLatin && esCue && enWords < 4) return false;
  if (enWords < 2) return false;

  const lower = t.toLowerCase();
  const brokenPatterns = [
    /\b(i|you|he|she|we|they)\s+(going|doing|working|eating|studying|watching)\b/i, // missing am/is/are
    /\b(i|you|he|she|we|they)\s+\w+ing\b/i,
    /\bi\s+is\b|\byou\s+is\b|\bhe\s+are\b|\bshe\s+are\b|\bthey\s+is\b/i,
    /\b(yesterday|last\s+\w+)\s+i\s+(go|see|eat|work|do|have|make)\b/i, // past with base verb
    /\bi\s+have\s+\w+ed\s+yesterday\b/i,
    /\bi\s+have\s+(see|go|eat|do|make|write|speak)\b/i, // wrong PP
    /\b(me|him|her)\s+(is|are|go|want|like)\b/i, // object as subject
    /\b(he|she|it)\s+no\s+\w+/i, // She no like
    /\b(will|would|should|can|could|must)\s+(can|could|will|would|must|should)\b/i, // I will can
    /\bwant\s+go\b|\blike\s+go\b|\bneed\s+go\b/i,
    /\b(to\s+)?be\s+go\b/i,
    /^[a-zA-Z']+(\s+[a-zA-Z']+){0,2}$/ // ultra-short fragment when longer expected
  ];
  if (brokenPatterns.some((re) => re.test(lower))) return true;

  // Spanglish mash with English verbs but Spanish glue and no clear P+V+C
  if (enWords >= 3 && esCue && !/\b(i|you|he|she|we|they)\s+(am|is|are|was|were|will|have|has|had|do|does|did|can|could|would|should)\b/i.test(lower)) {
    if (/\b(go|going|work|working|eat|eating|do|doing|see|seeing|make|making)\b/i.test(lower)) return true;
  }
  return false;
}

function lastAssistantAskedForEnglish(history) {
  const prev = [...(history || [])].reverse().find((m) => m.role === 'assistant');
  const t = String(prev?.content || '');
  return /\b(arm[aá]s|armá|dec[ií]melo en ingl[eé]s|en ingl[eé]s|tu turno|prob[aá]|modelo:|I am |You are |practica|practicá|oraci[oó]n en ingl[eé]s)\b/i.test(t);
}

/**
 * Flujo OBLIGATORIO cuando hay duda O estructura rota:
 * DETENER → feedback → explicar → ejemplo → confirmar → continuar.
 */
const JILL_PRO_LIVE_COACH = `COACH EN VIVO (OBLIGATORIO — cualquier tema, por complejo que sea):
${JILL_PRO_INTENT_RULE}
Conversás con sentido: seguí el hilo, reaccioná, profundizá. NO ignores el contenido de lo que dicen.

Si hay DUDA ("no entiendo", "enséñame", duda de clase, "cómo se forma X") O producen inglés MAL ESTRUCTURADO:
1) DETENÉ el flujo de charla libre un momento (sin regañar).
2) FEEDBACK claro en español: qué falló o qué no quedó (1 frase).
3) EXPLICÁ en español: puente con español → patrón/fórmula simple.
4) EJEMPLO: 1 modelo corto en inglés bien armado.
5) CONFIRMAR: "¿Te quedó claro?" / "¿Lo armamos de nuevo?"
6) CONTINUAR: si sí → pedí que lo digan ellos; si no → re-explicá más simple + otro ejemplo; luego retomá la charla del tema.

Evaluación en tiempo real en CADA turno donde intenten inglés:
- Mirás ranuras P | M/aux | V | C (Foundations).
- Si está bien: confirmá breve ("Bien armado") y seguí la conversación.
- Si está mal: aplicá el flujo 1-6 arriba — NO sigas de largo como si nada.

Charla de temas complejos (ciencia, trabajo, historia, sentimientos, etc.): OK total.
Cuando charlan en español sobre el tema: escuchá y conversá; invitá a meter 1 frase en inglés cuando fluya.
NO bundles, NO matriz F0 forzada, NO sermones.
Cuando EXPLICÁS gramática/duda: usá [[CTYPE:whiteboard]] para que el portal muestre el canon a pantalla completa.
Si piden linkers avanzados / STAR / Nexora / customer service: 1 frase → Alice.`;

const JILL_PRO_DOUBT_MODE = `MODO DUDA (pedido de gramática/clase — explícito o implícito):
Mismo flujo coach: feedback → explicar → ejemplo → "¿Te quedó claro?" → práctica corta → volver a la charla.
Cualquier tema Foundations: gerundio/-ING, tiempos (PR/PS/PC/PRP/futuro — cada uno con su tablero), modales (can/could/should/must — P + MODAL + V base), método moneda (inversión pregunta/respuesta — NO es lo mismo que modales), preposiciones IN/ON/AT/BY, preposiciones de tiempo, there is/are, ING vs TO, negaciones, articulos, comparativos.
Si piden PASADO SIMPLE / PS: tablero PS (no PR, no moneda).
Si piden IN ON AT BY / preposiciones: tablero preposiciones (core IN|ON|AT|BY).
Si piden MODALES: can/could/should/must + verbo base. NO abras Método Moneda.
Si piden MONEDA / inversión: Are you…? = V+P. NO abras el tablero de modales.
Si piden PRESENTE PERFECTO: tablero PRP (have + participio) — NO articulos.
Si mencionan el tema + piden ayuda, EXPLICÁ ya — no pidas confirmación del tema.
En explicaciones: cerrá con [[CTYPE:whiteboard]].`;

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION + COACH EN VIVO:
- Sos Jill, compañera de práctica en inglés (Foundations). Voz femenina, cálida, natural, inteligente.
${JILL_LANGUAGE_RULE}
${JILL_PRO_INTENT_RULE}
- NO sos Jill Tutora de bundle: sin currículo F0 forzado ni matriz obligatoria.
- Charlá de CUALQUIER tema con sentido (simple o complejo): vida, trabajo, ciencia, historias, dudas de clase.
- Si solo saludan SIN tema: preguntá qué quieren hoy — charlar o traer una duda. 2-3 oraciones.
- Si saludan Y traen tema/duda en el mismo mensaje: respondé al tema; el saludo es secundario.
- Cuando explicás o corregís estructura: [[CTYPE:whiteboard]] para pantalla completa con el canon.
${JILL_PRO_LIVE_COACH}
${JILL_PRO_DOUBT_MODE}
- 2-7 oraciones (hasta ~9 en explicación). Completá cada oración. NUNCA cortes a mitad.
- contentType: "whiteboard" en explicaciones/correcciones; "text" en charla pura.`;

function isJillProEnabled(student) {
  return !!(student && student.jillProEnabled === true);
}

function resolveJillProSession(student, sessionType) {
  const enabled = isJillProEnabled(student);
  const requested = sessionType === 'companion' ? 'companion' : 'tutor';
  if (requested === 'companion' && !enabled) {
    return {
      sessionType: 'tutor',
      companionBlocked: true,
      reason: 'jill_pro_not_enabled'
    };
  }
  return {
    sessionType: requested,
    companionBlocked: false,
    reason: null
  };
}

function inferChatTopic(text) {
  const t = String(text || '').toLowerCase();
  if (!t || t.length < 4) return '';
  if (isEnglishDoubtRequest(t)) {
    const topicHit = t.match(/\b(futuro\s+perfecto|future\s+perfect|gerund(?:io)?|present\s+(?:simple|continuous|perfect)|past\s+(?:simple|continuous|perfect)|present\s+perfect|past\s+perfect|future\s+(?:simple|continuous|perfect)|modales?|preposici[oó]n(?:es)?|there\s+(?:is|are)|to\s+be|ing\s+vs\s+to|infinitiv[oa]?|inversi[oó]n|going\s+to|will\s+have|will)\b/i);
    if (topicHit) return `doubt:${topicHit[1].toLowerCase()}`;
    return 'doubt:english';
  }
  const patterns = [
    { re: /\b(work|job|office|career|interview|trabajo)\b/, topic: 'work' },
    { re: /\b(travel|trip|vacation|flight|viaje|viajar)\b/, topic: 'travel' },
    { re: /\b(food|recipe|cook|restaurant|comida)\b/, topic: 'food' },
    { re: /\b(family|kids|parents|familia)\b/, topic: 'family' },
    { re: /\b(sport|football|soccer|gym|deporte)\b/, topic: 'sports' },
    { re: /\b(movie|music|book|series|netflix|pel[ií]cula)\b/, topic: 'entertainment' },
    { re: /\b(science|space|history|politic|econom|ciencia|historia)\b/, topic: 'deep topic' },
    { re: /\b(study|school|class|university|clase|estudio)\b/, topic: 'school' },
    { re: /\b(weekend|today|yesterday|plans|hoy|ayer)\b/, topic: 'daily life' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 10) return 'general chat';
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  // Fresh doubt in the latest message always wins over a sticky companionTopic.
  const fromLast = inferChatTopic(lastUserMessage);
  if (fromLast && String(fromLast).startsWith('doubt:')) return fromLast;
  if (companionTopic && String(companionTopic).trim()) {
    const sticky = String(companionTopic).trim().slice(0, 80);
    // If sticky was a wrong early guess and latest turn has a clearer chat topic, prefer latest.
    if (fromLast && fromLast !== 'general chat' && fromLast !== 'open chat' && !/^doubt:/i.test(sticky)) {
      return fromLast;
    }
    return sticky;
  }
  if (fromLast) return fromLast;
  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const hit = inferChatTopic(users[i].content);
    if (hit) return hit;
  }
  return 'open chat';
}

function resolveCompanionPhase(message, history) {
  if (studentWantsEnglishPractice(message)) return 'english_practice';
  if (isEnglishDoubtRequest(message)) return 'doubt_explain';
  if (isClarityReply(message)) {
    const prev = [...(history || [])].reverse().find((m) => m.role === 'assistant');
    const prevText = String(prev?.content || '');
    if (/qued[oó] claro|entendiste|te queda|did that make sense|clear\?|lo armamos|prob[aá] de nuevo/i.test(prevText)) {
      return 'doubt_practice';
    }
  }
  if (looksLikeBrokenEnglish(message) || (lastAssistantAskedForEnglish(history) && looksLikeBrokenEnglish(message))) {
    return 'live_correct';
  }
  if (lastAssistantAskedForEnglish(history) && /\b[a-zA-Z]{2,}\b/.test(message) && !/[áéíóúñ¿¡]/.test(message)) {
    // They answered in English after being asked — evaluate this turn
    return 'live_evaluate';
  }
  const topic = resolveSessionTopic(history, '', message);
  if (String(topic).startsWith('doubt:')) return 'doubt_practice';
  return 'free_chat';
}

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open chat'
    ? (String(topic).startsWith('doubt:')
      ? `MODO DUDA ACTIVO: "${topic.replace(/^doubt:/, '')}" — detener → feedback → explicar → ejemplo → confirmar → continuar.`
      : `TEMA DE CHARLA: "${topic}" — conversá con sentido; si duda o mala estructura, coach en vivo.`)
    : 'Sin tema fijo: charlá o duda — cualquier tema vale.';
  return `${JILL_PRO_COMPANION_RULES}\n${topicLine}`;
}

function buildJillProCompanionSystem(displayName, level, profileNote, adaptNote, topic) {
  return `Sos Jill Pro — compañera de inglés en Infinity Studio CR (Foundations).
Tu nombre es Jill. Sos mujer, voz femenina, cálida e inteligente. NUNCA hables como hombre ni como profesora de bundle rígida.
${JILL_PRO_COMPANION_RULES}
ESTUDIANTE: ${displayName} | Nivel: ${level || 'Foundations'}${profileNote || ''}${adaptNote || ''}
TEMA: ${topic || 'open chat'}`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display} EN ESPAÑOL (2-3 oraciones). Preguntá qué quieren hoy: charlar de cualquier tema (aunque sea complejo) O traer una duda. Dejá claro que si se traban o lo arman mal, pausás, explicás con ejemplo y seguís.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesión Jill Pro con ${display}: saludo cálido EN ESPAÑOL. Companion + coach en vivo. Preguntá de qué quieren hablar o qué duda traen. 2-3 oraciones.`;
}

function buildJillProStreamTeachInstruction(topic, message, history) {
  const msg = String(message || '');
  const phase = resolveCompanionPhase(msg, history);
  const heard = `MENSAJE DEL ESTUDIANTE (interpretá la intención aunque venga desordenado; NO pidas que lo repita si ya se entiende):\n"""${msg.slice(0, 500)}"""\n`;

  if (phase === 'english_practice') {
    return `${heard}MODO PRÁCTICA EN INGLÉS — pidieron hablar en inglés. Este turno en inglés.
Si la estructura está mal: DETENÉ → feedback en español → explicación corta → 1 ejemplo → "¿Te quedó?" → pedí que lo digan de nuevo.
Si está bien: confirmá breve y seguí la conversación con sentido. [[CTYPE:text]]`;
  }

  if (phase === 'doubt_explain') {
    return `${heard}MODO DUDA — ACCURACY TOTAL (tema: "${topic || 'su duda'}").
REGLA DE ORO: explicá ÚNICAMENTE lo que el estudiante pidió. Cero temas vecinos. Cero relleno.
1) 1 frase: "Pediste X" (nombrá el tema exacto).
2) Explicá EN ESPAÑOL solo X (puente → patrón/fórmula de X).
   Mapas (elegí UNO, el que pidió):
   - ING tras prep (before/after/without) → PREP + V-ing — NO Presente Continuo
   - Presente Continuo / PC → P + To Be + V+ing + C
   - Negaciones → P + AUX + NOT + V + C
   - There is/are → there + be
   - Preposiciones lugar/tiempo → ranura C
   - Tiempos (PR/PS/PRP/PPC) → la fórmula de ESE tiempo
   - Modales / moneda / preguntas → inversión / will-would
   - Artículos / comparativos → solo eso
   - Cualquier otra duda Foundations → explicá ESA, no inventes otro módulo
3) 1-2 ejemplos en inglés SOLO de X.
4) "¿Te quedó claro?"
PROHIBIDO: mezclar PC con gerundio-prep, listar temas extra, pedir que repita la duda.
Cerrá con [[CTYPE:whiteboard]].`;
  }

  if (phase === 'live_correct') {
    return `${heard}MODO COACH EN VIVO — ESTRUCTURA ROTA.
DETENÉ. EN ESPAÑOL, solo el error de ESTE turno:
1) Feedback (ranura/auxiliar/tiempo) 1 frase.
2) Patrón correcto de ESE error.
3) 1 ejemplo modelo.
4) "¿Te quedó? Probá de nuevo."
NO cambies de tema. [[CTYPE:whiteboard]]`;
  }

  if (phase === 'live_evaluate') {
    return `${heard}MODO EVALUACIÓN EN VIVO — produjeron inglés.
Si está BIEN armado (P+aux/V+C): "Bien" + 1 reacción al CONTENIDO + seguí la charla.
Si está MAL: mismo flujo coach (feedback → explicar → ejemplo → confirmar → que lo digan otra vez).
Tema: "${topic || 'la conversación'}". [[CTYPE:text]]`;
  }

  if (phase === 'doubt_practice') {
    const negative = /\b(no|nop|todav[ií]a no|casi|m[aá]s o menos|un poco|no del todo|otra vez)\b/i.test(msg);
    if (negative && isClarityReply(msg)) {
      return `${heard}RE-EXPLICÁ más simple EN ESPAÑOL + ejemplo nuevo. Luego "¿Ahora sí te quedó?". [[CTYPE:whiteboard]]`;
    }
    return `${heard}PRÁCTICA TRAS DUDA ("${topic || 'duda'}"): pedí 1 oración en inglés; evaluá en vivo; si mal → coach; si bien → confirmá y seguí charla. [[CTYPE:text]]`;
  }

  return `${heard}TURNO COMPANION — interpretá qué quiere y respondé EN ESPAÑOL con sentido (tema hint: "${topic || 'lo que sea'}").
Si trae duda/tema gramatical mezclado con saludo: EXPLICÁ el tema; no pidas que elija tema otra vez.
Si es charla: reaccioná + UNA pregunta de seguimiento.
Si aparece duda o inglés mal armado: DETENÉ → feedback → explicar → ejemplo → confirmar → continuar.
[[CTYPE:text]]`;
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evalua esta sesion Jill Pro (companion + coach en vivo) de ${name}.
Tema: ${topic || 'charla libre'}. Turnos: ${metrics.turns || 0}.
Valorá: conversación con sentido, correcciones a tiempo, claridad de explicaciones, si confirmó entendimiento.

Sesion:
${hist}

JSON unicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases calidas en espanol","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  JILL_LANGUAGE_RULE,
  JILL_PRO_INTENT_RULE,
  studentWantsEnglishPractice,
  isEnglishDoubtRequest,
  isClarityReply,
  looksLikeBrokenEnglish,
  JILL_PRO_LIVE_COACH,
  JILL_PRO_DOUBT_MODE,
  JILL_PRO_COMPANION_RULES,
  isJillProEnabled,
  resolveJillProSession,
  resolveSessionTopic,
  resolveCompanionPhase,
  buildJillProCoachBlock,
  buildJillProCompanionSystem,
  buildJillProOpeningInstruction,
  buildJillProStreamTeachInstruction,
  buildJillProEvalPrompt
};
