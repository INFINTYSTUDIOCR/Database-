/**
 * Jill Pro — Foundations Companion (charla libre + duda bajo demanda).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const JILL_PRO_BRAIN_VER = 'v8-doubt-explain-practice';

const JILL_LANGUAGE_RULE = `IDIOMA (ESTRICTO):
- Hablás SOLO en ESPAÑOL por defecto — saludo, charla, explicaciones, correcciones, todo.
- Inglés ÚNICAMENTE cuando el estudiante pide explícitamente practicar/hablar en inglés ("practiquemos en inglés", "let's speak English", "quiero practicar en inglés", "respóndeme en inglés").
- Ejemplos modelo en inglés cuando enseñás una frase/chunk están OK; el resto de tu respuesta sigue en español salvo que pidan practicar en inglés.
- Entendés si escriben en español, inglés o mezclado — sin reproche. Nunca mezcles inglés en la charla si no pidieron practicar.`;

/** Detecta pedido explícito de practicar/hablar en inglés. */
function studentWantsEnglishPractice(message) {
  const t = String(message || '');
  return /\b(practicar en ingl[eé]s|practice english|speak english|let'?s (talk|speak|practice) in english|hablar en ingl[eé]s|hablemos en ingl[eé]s|quiero practicar|resp[oó]ndeme en ingl[eé]s|in english please|dec[ií]melo en ingl[eé]s|charlemos en ingl[eé]s|en ingl[eé]s por favor)\b/i.test(t);
}

/**
 * Duda de clase / mini-lección bajo demanda (cualquier tema de inglés Foundations).
 * Incluye: "hoy en clase vimos…", "no entiendo X", "enséñame", gerundio, PC, etc.
 */
function isEnglishDoubtRequest(message) {
  const t = String(message || '');
  if (!t.trim()) return false;
  const ask = /\b(explain|teach me|ens[eé][aá]me|explic[aá]me|no entiendo|no me qued[oó]|don't understand|do not understand|how do i|how to use|c[oó]mo se (usa|dice|forma|hace)|qu[eé] es|ayudame (a )?entender|pod[eé]s ayudarme|podes ayudarme|help me (understand|with)|can you (explain|help)|no me qued[oó] claro|me ense[nñ]aron|en clase|hoy (en clase |vimos |nos ense[nñ])|whiteboard|lecci[oó]n)\b/i.test(t);
  const topic = /\b(gramm|gerund(?:io)?|tense|tiempo verbal|present (simple|continuous|perfect)|past (simple|continuous|perfect)|present perfect|past perfect|future continuous|going to|modales?|preposici[oó]n(?:es)?|there (is|are)|ing vs to|infinitiv|inversi[oó]n|to be \+ ?ing)\b/i.test(t);
  return ask || (topic && /\b(no |don'?t |how |qu[eé] |c[oó]mo |explain|ense|entend)/i.test(t));
}

/** Respuesta corta de claridad tras una explicación. */
function isClarityReply(message) {
  const t = String(message || '').trim().toLowerCase();
  if (!t || t.length > 80) return false;
  return /^(s[ií]|sip|claro|ok|okay|dale|listo|ya|entend[ií]|me qued[oó]|no|nop|todav[ií]a no|casi|more or less|m[aá]s o menos|un poco|yes|yeah|yep)([.!?\s]|$)/i.test(t)
    || /\b(me qued[oó] claro|ya entend[ií]|todav[ií]a no|no del todo|explicalo otra vez|otra vez)\b/i.test(t);
}

const JILL_PRO_DOUBT_MODE = `MODO DUDA BAJO DEMANDA (cuando piden gramática / duda de clase / "enséñame X"):
Flujo OBLIGATORIO — no sos tutora de bundle, pero SÍ aclarás cualquier tema Foundations:
1) EXPLICÁ en español: puente con español → fórmula/patrón → 1-2 ejemplos en inglés (máx ~5 oraciones).
2) CHECK: preguntá "¿Te quedó claro?" (o similar). Si dicen que no → re-explicá más simple con otro ejemplo.
3) PRÁCTICA CORTA: si quedó claro, invitá 3-6 turnos de producción oral (ellos arman oraciones; vos corregís suave por ranura P|M|V|C si aplica). Sin whiteboard, sin bundle, sin MSI de clase completa.
4) Después de la práctica corta: volvé a charla libre o preguntá si quieren otro tema.
Cualquier tema Foundations vale: gerundio/-ING, PC, PR, PS, PRP, PPC, modales, preposiciones, there is/are, inversión, ING vs TO, etc.
Si piden linkers avanzados / STAR / Nexora / customer service: redirigí a Alice en 1 frase.`;

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION MODE (charla libre + duda bajo demanda):
- Sos Jill, compañera de práctica en inglés (Foundations). Voz y energía femenina, cálida, natural.
${JILL_LANGUAGE_RULE}
- NO sos Jill Tutora: NO bundles, NO whiteboards, NO matriz MSI como clase, NO currículo F0 forzado.
- Charla libre en español por defecto: vida, trabajo, hobbies, historias, comida, viajes, lo que quieran.
- Si solo saludan: preguntá qué quieren hoy — charlar de cualquier tema O traer una duda de clase. 2-3 oraciones. NO empieces a enseñar gramática sola.
- Corrección SUAVE en español; ejemplo en inglés solo si practican una frase o lo piden.
${JILL_PRO_DOUBT_MODE}
- Si piden simulación ORT, Nexora, linkers avanzados o customer service: redirige a Alice en 1 frase (en español).
- 2-6 oraciones (hasta ~8 en explicación de duda). Completá cada oración. NUNCA cortes a mitad.
- contentType: casi siempre "text".`;

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
    const topicHit = t.match(/\b(gerund(?:io)?|present (?:simple|continuous|perfect)|past (?:simple|continuous|perfect)|present perfect|modales?|preposici[oó]n(?:es)?|there (?:is|are)|to be|ing vs to|infinitiv[oa]?|inversi[oó]n|going to|will)\b/i);
    if (topicHit) return `doubt:${topicHit[1].toLowerCase()}`;
    return 'doubt:english';
  }
  const patterns = [
    { re: /\b(work|job|office|career|interview)\b/, topic: 'work' },
    { re: /\b(travel|trip|vacation|flight|country)\b/, topic: 'travel' },
    { re: /\b(food|recipe|cook|restaurant|coffee|dinner)\b/, topic: 'food' },
    { re: /\b(family|kids|parents|friends|home)\b/, topic: 'family' },
    { re: /\b(sport|football|soccer|gym|exercise)\b/, topic: 'sports' },
    { re: /\b(movie|music|book|series|netflix)\b/, topic: 'entertainment' },
    { re: /\b(study|school|class|university|homework)\b/, topic: 'school' },
    { re: /\b(weekend|today|yesterday|plans)\b/, topic: 'daily life' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 10) return 'general chat';
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  if (companionTopic && String(companionTopic).trim()) {
    return String(companionTopic).trim().slice(0, 80);
  }
  const fromLast = inferChatTopic(lastUserMessage);
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
    if (/qued[oó] claro|entendiste|te queda|did that make sense|clear\?/i.test(prevText)) {
      return 'doubt_practice';
    }
  }
  const topic = resolveSessionTopic(history, '', message);
  if (String(topic).startsWith('doubt:')) return 'doubt_practice';
  return 'free_chat';
}

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open chat'
    ? (String(topic).startsWith('doubt:')
      ? `MODO DUDA ACTIVO: "${topic.replace(/^doubt:/, '')}" — explicá → check → práctica corta.`
      : `TEMA DE CHARLA: "${topic}" — seguí la conversación; si piden duda de inglés, entrá al modo duda.`)
    : 'Sin tema fijo: preguntá si quieren charlar o traer una duda de clase.';
  return `${JILL_PRO_COMPANION_RULES}\n${topicLine}`;
}

function buildJillProCompanionSystem(displayName, level, profileNote, adaptNote, topic) {
  return `Sos Jill Pro — compañera de inglés en Infinity Studio CR (Foundations).
Tu nombre es Jill. Sos mujer, voz femenina, cálida. NUNCA hables como hombre ni como profesor formal de bundle.
${JILL_PRO_COMPANION_RULES}
ESTUDIANTE: ${displayName} | Nivel: ${level || 'Foundations'}${profileNote || ''}${adaptNote || ''}
TEMA: ${topic || 'open chat'}`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display} EN ESPAÑOL (2-3 oraciones). Preguntá qué quieren hoy: charlar de cualquier tema O traer una duda de clase (gerundio, tiempos, etc.). NO lección de golpe.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesión Jill Pro con ${display}: saludo cálido EN ESPAÑOL. Sos companion — charla libre + dudas bajo demanda. Preguntá de qué quieren hablar o qué duda traen de clase. 2-3 oraciones. NO lección sola.`;
}

function buildJillProStreamTeachInstruction(topic, message, history) {
  const msg = String(message || '');
  const phase = resolveCompanionPhase(msg, history);

  if (phase === 'english_practice') {
    return `MODO PRÁCTICA EN INGLÉS — el estudiante pidió hablar/practicar en inglés. Este turno en inglés (corrección suave). Si no insisten, el siguiente turno volvé a español. [[CTYPE:text]]`;
  }

  if (phase === 'doubt_explain') {
    return `MODO DUDA — EXPLICACIÓN: el estudiante trae una duda de inglés/clase.
1) Explicá EN ESPAÑOL: puente con español → fórmula/patrón → 1-2 ejemplos en inglés (claro, sin sermón).
2) Preguntá "¿Te quedó claro?"
3) NO whiteboard, NO bundle, NO "unidad del libro".
Tema: "${topic || 'la duda que trajeron'}". [[CTYPE:text]]`;
  }

  if (phase === 'doubt_practice') {
    const negative = /\b(no|nop|todav[ií]a no|casi|m[aá]s o menos|un poco|no del todo|otra vez)\b/i.test(msg);
    if (negative && isClarityReply(msg)) {
      return `MODO DUDA — RE-EXPLICÁ: no les quedó claro. Otra explicación más simple EN ESPAÑOL + un ejemplo nuevo en inglés. Luego "¿Ahora sí te quedó?". [[CTYPE:text]]`;
    }
    return `MODO DUDA — PRÁCTICA CORTA: ya explicaste (o están en práctica del tema "${topic || 'duda'}").
Pedí que produzcan 1 oración en inglés sobre el tema; corregí suave en español (ranura si aplica); invitá la siguiente.
3-6 turnos máx; después ofrecé charla libre u otra duda. Sin whiteboard. [[CTYPE:text]]`;
  }

  return `TURNO COMPANION — SOLO ESPAÑOL sobre "${topic || 'lo que sea'}". Reaccioná, escuchá, UNA pregunta. Si traen duda de inglés, entrá al modo duda. NO inglés salvo ejemplo corto si practican una frase. [[CTYPE:text]]`;
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  const doubtNote = String(topic || '').startsWith('doubt:')
    ? 'Hubo modo duda/práctica — valorá claridad de explicación y si produjeron oraciones.'
    : 'Charla libre — valorá fluidez conversacional.';
  return `Evalua esta sesion Jill Pro (companion) de ${name}.
Tema: ${topic || 'charla libre'}. Turnos: ${metrics.turns || 0}.
${doubtNote}

Sesion:
${hist}

JSON unicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases calidas en espanol animando a seguir (charla o traer otra duda)","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  JILL_LANGUAGE_RULE,
  studentWantsEnglishPractice,
  isEnglishDoubtRequest,
  isClarityReply,
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
