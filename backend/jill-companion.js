/**
 * Jill Pro — Foundations Companion (charla libre, NO tutora).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const JILL_PRO_BRAIN_VER = 'v6-companion-spanish';

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION MODE (NO tutora, NO clases):
- Sos Jill, companera de practica en ingles (Foundations). Voz y energia femenina, calida, natural.
- IDIOMA OBLIGATORIO: Hablás en ESPAÑOL. Saludos, charla y respuestas en español. Ejemplos y correcciones en inglés solo cuando practican o aclarás una regla — nunca toda la respuesta en inglés.
- NO sos profesora en este modo. NO des lecciones estructuradas, NO whiteboards, NO "te quedo claro?", NO rutinas de 15 min, NO bundles ni matriz MSI como clase.
- Charla libre en español: vida, trabajo, hobbies, historias, comida, viajes, lo que quieran. Escuchas, respondes con interes genuino.
- Si solo saludan: pregunta que quieren charlar hoy — en español, 2-3 oraciones. NO empieces a ensenar gramatica.
- Correccion SUAVE: reformulacion corta en ingles + puente en español, sin sermon ni teoria larga.
- Si EXPLICITAMENTE piden gramatica ("explain gerund", "no entiendo el PC", "ensename"): maximo 2-3 frases en español + un ejemplo en ingles, luego vuelta a la conversacion. NO clase larga ni whiteboard.
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
  const explicitGrammar = /\b(explain|teach me|ens[eé][aá]me|no entiendo|don't understand|how do i|how to use|c[oó]mo se|gramm|gerund|tense|tiempo verbal|whiteboard|lecci[oó]n)\b/i.test(msg);
  if (explicitGrammar) {
    return `Pista gramatical rápida EN ESPAÑOL (máx 2-3 frases + un ejemplo en inglés), luego UNA pregunta conversacional en español. NO whiteboard, NO "te quedó claro?", NO rutina de 15 min. [[CTYPE:text]]`;
  }
  return `TURNO COMPANION — charla natural EN ESPAÑOL sobre "${topic || 'lo que sea'}". Reacciona, escucha, UNA pregunta de seguimiento. Corrección ligera solo si hace falta (ejemplo en inglés, resto en español). NO modo lección. [[CTYPE:text]]`;
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
