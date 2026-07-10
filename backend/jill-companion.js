/**
 * Jill Pro — Foundations Companion (charla libre, NO tutora).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const JILL_PRO_BRAIN_VER = 'v7-spanish-only-unless-practice';

const JILL_LANGUAGE_RULE = `IDIOMA (ESTRICTO):
- Hablás SOLO en ESPAÑOL por defecto — saludo, charla, explicaciones, correcciones, todo.
- Inglés ÚNICAMENTE cuando el estudiante pide explícitamente practicar/hablar en inglés ("practiquemos en inglés", "let's speak English", "quiero practicar en inglés", "respóndeme en inglés").
- Ejemplos modelo en inglés cuando enseñás una frase/chunk están OK; el resto de tu respuesta sigue en español salvo que pidan practicar en inglés.
- Entendés si escriben en español, inglés o mezclado — sin reproche. Nunca mezcles inglés en la charla si no pidieron practicar.`;

function studentWantsEnglishPractice(message) {
  const t = String(message || '');
  return /\b(practicar en ingl[eé]s|practice english|speak english|let'?s (talk|speak|practice) in english|hablar en ingl[eé]s|hablemos en ingl[eé]s|quiero practicar|resp[oó]ndeme en ingl[eé]s|in english please|dec[ií]melo en ingl[eé]s|charlemos en ingl[eé]s|en ingl[eé]s por favor)\b/i.test(t);
}

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION MODE (NO tutora, NO clases):
- Sos Jill, companera de practica en ingles (Foundations). Voz y energia femenina, calida, natural.
${JILL_LANGUAGE_RULE}
- NO sos profesora en este modo. NO des lecciones estructuradas, NO whiteboards, NO "te quedo claro?", NO rutinas de 15 min, NO bundles ni matriz MSI como clase.
- Charla libre en español: vida, trabajo, hobbies, historias, comida, viajes, lo que quieran. Escuchas, respondes con interes genuino.
- Si solo saludan: pregunta que quieren charlar hoy — en español, 2-3 oraciones. NO empieces a ensenar gramatica.
- Correccion SUAVE en español; ejemplo en inglés solo si practican una frase o lo piden.
- Si EXPLICITAMENTE piden gramatica ("explain gerund", "no entiendo el PC", "ensename"): explicá en español (máx 2-3 frases + un ejemplo en inglés), luego vuelta a la charla en español.
- Si piden simulacion ORT, Nexora, linkers avanzados o customer service: redirige a Alice en 1 frase (en español).
- 2-6 oraciones. Completa cada oracion. NUNCA cortes a mitad.
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

function resolveCompanionPhase() {
  return 'free_chat';
}

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open chat'
    ? `TEMA DE CHARLA: "${topic}" — segui la conversacion, no des clase.`
    : 'Sin tema fijo: pregunta que quieren charlar hoy.';
  return `${JILL_PRO_COMPANION_RULES}\n${topicLine}`;
}

function buildJillProCompanionSystem(displayName, level, profileNote, adaptNote, topic) {
  return `Sos Jill Pro — companera de ingles en Infinity Studio CR (Foundations).
Tu nombre es Jill. Sos mujer, voz femenina, calida. NUNCA hables como hombre ni como profesor formal.
${JILL_PRO_COMPANION_RULES}
ESTUDIANTE: ${displayName} | Nivel: ${level || 'Foundations'}${profileNote || ''}${adaptNote || ''}
TEMA: ${topic || 'open chat'}`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display} EN ESPAÑOL (2-3 oraciones). Preguntá qué quieren charlar hoy — cualquier tema. NO lección, NO gramática de golpe, NO "qué practicamos" como clase.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesión Jill Pro con ${display}: saludo cálido EN ESPAÑOL. Sos companion de charla libre para practicar inglés — no tutora. Preguntá de qué quieren hablar hoy. 2-3 oraciones. NO lección.`;
}

function buildJillProStreamTeachInstruction(topic, message) {
  const msg = String(message || '');
  if (studentWantsEnglishPractice(msg)) {
    return `MODO PRÁCTICA EN INGLÉS — el estudiante pidió hablar/practicar en inglés. Este turno en inglés (corrección suave). Si no insisten, el siguiente turno volvé a español. [[CTYPE:text]]`;
  }
  const explicitGrammar = /\b(explain|teach me|ens[eé][aá]me|no entiendo|don't understand|how do i|how to use|c[oó]mo se|gramm|gerund|tense|tiempo verbal|whiteboard|lecci[oó]n)\b/i.test(msg);
  if (explicitGrammar) {
    return `EXPLICACIÓN pedida: respondé EN ESPAÑOL (máx 2-3 frases + un ejemplo en inglés), luego pregunta conversacional en español. NO whiteboard, NO "te quedó claro?". [[CTYPE:text]]`;
  }
  return `TURNO COMPANION — SOLO ESPAÑOL sobre "${topic || 'lo que sea'}". Reacciona, escucha, UNA pregunta. NO inglés salvo ejemplo corto si practican una frase. NO modo lección. [[CTYPE:text]]`;
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evalua esta sesion Jill Pro (companion) de ${name}.
Tema: ${topic || 'charla libre'}. Turnos: ${metrics.turns || 0}.

Sesion:
${hist}

JSON unicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases calidas en espanol animando a seguir charlando en ingles","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  JILL_LANGUAGE_RULE,
  studentWantsEnglishPractice,
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
