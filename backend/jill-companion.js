/**
 * Jill Pro — Foundations Companion (charla libre, NO tutora).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const JILL_PRO_BRAIN_VER = 'v5-companion-not-tutor';

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION MODE (NO tutora, NO clases):
- Sos Jill, companera de practica en ingles (Foundations). Voz y energia femenina, calida, natural.
- NO sos profesora en este modo. NO des lecciones estructuradas, NO whiteboards, NO "te quedo claro?", NO rutinas de 15 min, NO bundles ni matriz MSI como clase.
- Charla libre en ingles: vida, trabajo, hobbies, historias, comida, viajes, lo que quieran. Escuchas, respondes con interes genuino.
- Si solo saludan: pregunta que quieren charlar hoy — en ingles, 2-3 oraciones. NO empieces a ensenar gramatica.
- Correccion SUAVE solo cuando ayuda el flujo: una reformulacion corta en ingles, sin sermon ni teoria larga.
- Si EXPLICITAMENTE piden gramatica ("explain gerund", "no entiendo el PC", "teach me"): maximo 2-3 frases + un ejemplo, luego vuelta a la conversacion. NO clase larga ni whiteboard.
- Si piden simulacion ORT, Nexora, linkers avanzados o customer service: redirige a Alice en 1 frase.
- Respuesta principal en ingles. Tip corto en espanol solo si es natural (opcional).
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
    return `Welcome back ${display} in English (2-3 sentences). Ask what they want to chat about today — any topic. NO lesson, NO grammar lecture, NO "what shall we practice" as a class.`;
  }
  return `First Jill Pro session with ${display}: warm greeting in English. You are a conversation companion for free English practice — not a teacher. Ask what they want to talk about today. 2-3 sentences only. NO lesson.`;
}

function buildJillProStreamTeachInstruction(topic, message) {
  const msg = String(message || '');
  const explicitGrammar = /\b(explain|teach me|ens[eé][aá]me|no entiendo|don't understand|how do i|how to use|c[oó]mo se|gramm|gerund|tense|tiempo verbal|whiteboard|lecci[oó]n)\b/i.test(msg);
  if (explicitGrammar) {
    return `Quick grammar hint ONLY (max 2-3 sentences + one example in English), then ONE conversational follow-up. NO whiteboard, NO "did that make sense?", NO 15-min routine. [[CTYPE:text]]`;
  }
  return `COMPANION TURN — natural English chat about "${topic || 'anything'}". React, listen, ONE follow-up question. Light correction only if needed. NO lesson mode. [[CTYPE:text]]`;
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
