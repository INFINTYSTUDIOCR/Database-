/**
 * Jill Pro — Foundations Companion (Alice Companion style, MSI® scope).
 * Cualquier tema que pida el estudiante ? lección MSI (regla + canon + práctica).
 */
const JILL_PRO_BRAIN_VER = 'v2-any-topic-lesson';

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

/** Extrae el tema cuando el estudiante pide lección explícitamente. */
function extractLessonTopic(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.length < 4) return '';
  const t = raw.toLowerCase();

  const triggers = [
    /\b(?:ayud[aá]me|ayuda|help me|help)\s+(?:con|with|sobre|about|to)\s+(.+)/i,
    /\b(?:no entiendo|no comprendo|don't understand|do not understand|confused about)\s+(.+)/i,
    /\b(?:quiero|want to|need to|necesito)\s+(?:practicar|practice|aprender|learn|estudiar|study)\s+(.+)/i,
    /\b(?:explic[aá]me|explícame|explain|teach me|ens[eé][aá]me)\s+(.+)/i,
    /\b(?:una lecci[oó]n|a lesson|mini lecci[oó]n|mini-lesson)\s+(?:de|sobre|about|on|del|de la|of)\s+(.+)/i,
    /\b(?:c[oó]mo se dice|how do you say|how to use|c[oó]mo usar)\s+(.+)/i,
    /\bjill[\s,]*(.+)/i
  ];

  for (const re of triggers) {
    const m = raw.match(re);
    if (m && m[1]) {
      let topic = m[1].replace(/[?.!]+$/, '').trim();
      topic = topic.replace(/^(sobre|about|on|con|with)\s+/i, '').trim();
      if (topic.length >= 3) return topic.slice(0, 120);
    }
  }

  if (/\b(no entiendo|no comprendo|help|ayuda|explain|explic)/i.test(raw) && raw.length > 12) {
    return raw.slice(0, 120);
  }
  return '';
}

function inferFoundationsTopic(text) {
  const extracted = extractLessonTopic(text);
  if (extracted) return extracted;

  const t = String(text || '').toLowerCase();
  const patterns = [
    { re: /\b(gerundio|gerund|-ing\b|progressive|continuo|presente continuo|\bpc\b)/, topic: 'gerundio / PC (P + To Be + V+ing)' },
    { re: /\b(presente simple|present simple|\bpr\b)/, topic: 'presente simple PR' },
    { re: /\b(pasado simple|past simple|\bps\b)/, topic: 'pasado simple PS' },
    { re: /\b(presente perfecto|present perfect|\bprp\b)/, topic: 'presente perfecto PRP' },
    { re: /\b(pasado perfecto|past perfect|\bpap\b|\bppc\b)/, topic: 'pasado perfecto / PPC' },
    { re: /\b(modal|will|would|should|can|could|must|may|might)/, topic: 'modales MOD' },
    { re: /\b(moneda|pregunta|question|respuesta|affirm)/, topic: 'metodo moneda' },
    { re: /\b(preposici|prep\b|\bin on at\b)/, topic: 'preposiciones' },
    { re: /\b(art[ií]culo|article|\bthe\b|\ba an\b)/, topic: 'articulos' },
    { re: /\b(pronoun|pronombre)/, topic: 'pronombres P' },
    { re: /\b(estructura|msi|chunk|ranura|mec[aá]nica)/, topic: 'MSI estructura' },
    { re: /\b(vocab|palabra|word|numeros|numbers|ordinals)/, topic: 'vocabulario / numeros' },
    { re: /\b(conversaci|speak|hablar|charla|talk)/, topic: 'conversacion libre Foundations' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 8) return raw.slice(0, 120);
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  if (companionTopic && String(companionTopic).trim()) {
    return String(companionTopic).trim().slice(0, 120);
  }
  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const extracted = extractLessonTopic(users[i].content);
    if (extracted) return extracted;
    const hit = inferFoundationsTopic(users[i].content);
    if (hit) return hit;
  }
  const fromLast = inferFoundationsTopic(lastUserMessage);
  return fromLast || 'open practice';
}

function detectLessonRequest(message) {
  const topic = extractLessonTopic(message) || inferFoundationsTopic(message);
  const t = String(message || '').toLowerCase();
  const explicit = /\b(ayud|help|explic|ens[eé]ñ|lecci[oó]n|lesson|no entiendo|don't understand|quiero practic|want to practice|teach me)\b/.test(t);
  return {
    isLessonRequest: !!(topic && (explicit || topic.length > 6)),
    topic: topic || ''
  };
}

const JILL_PRO_ANY_TOPIC_LESSON_RULE = `
REGLA UNIVERSAL JILL PRO — CUALQUIER TEMA ? LECCIÓN (OBLIGATORIO):
Cuando el estudiante pida ayuda con CUALQUIER tema (gramática, vocab, pronunciación, tiempos, duda concreta, "no entiendo X", charla con corrección):
1) Confirmá el tema en 1 frase: "Claro, [tema] —"
2) Regla MSI® en español (1-3 oraciones) + fórmula si aplica (PR/PS/PC/PRP/MOD/moneda)
3) Canon / whiteboard: contentType "whiteboard" con fórmula ranuras P|M|V|C o ejemplo estructurado
4) UN ejemplo concreto en inglés + puente en español
5) UNA práctica corta (contentType "exercise") — el estudiante responde en el siguiente turno
6) Después podés seguir charlando o profundizar si piden más — pero SIEMPRE entregá la mini-lección primero
NUNCA digas "eso lo vemos después" ni "esperá al bundle". El tema que piden manda.
Si el tema es conversación libre: corregí suave en el flujo y enseñá la estructura del error en 1 ranura.
Si piden linkers avanzados / STAR / Nexora: redirigí a Alice en 1 frase sin mini-clase de linkers.`;

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open practice'
    ? `TEMA ACTIVO (lección bajo demanda): "${topic}" — convertí esto en lección MSI completa (pasos 1-5 de la regla universal).`
    : 'Modo libre: el estudiante puede pedir CUALQUIER tema — cada pedido explícito se convierte en lección (regla + canon + práctica).';
  const weak = [...(student?.quizWeakKpis || []), ...(student?.nemesisState?.reinforcement || [])].slice(0, 5);
  const weakLine = weak.length
    ? `Refuerzo Rapid drill (opcional en la charla): ${weak.join(', ')}.`
    : '';

  return `JILL PRO — FOUNDATIONS COMPANION (modo libre, como Alice Companion pero MSI®)
${JILL_PRO_ANY_TOPIC_LESSON_RULE}
${topicLine}
${weakLine}

QUIÉN SOS:
- Compañera de práctica Foundations — charla libre, calidez, interés real.
- Corrigís con cariño tipo Alice: reformulación, ánimo, recuperación.
- Preparás para Alice — NO curriculum de linkers avanzados, NO STAR, NO Nexora.

CÓMO TE COMPORTÁS:
- Escuchá primero. Cualquier mensaje con duda o tema = oportunidad de lección.
- Corrección suave en charla; lección estructurada cuando piden aprender algo concreto.
- 2-8 oraciones según haga falta; whiteboard cuando hay fórmula.
- NUNCA cortes a mitad de oración.`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display}. Preguntá qué tema quiere hoy — cualquier duda Foundations se convierte en lección (regla + ejemplo + práctica). 2-3 oraciones.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesión Jill Pro con ${display}: saludo cálido. Decile que puede pedir CUALQUIER tema ("gerundio", "preposiciones", "present perfect", vocab, charla) y vos lo convertís en lección MSI sin presión. 2-4 oraciones.`;
}

function buildJillProStreamTeachInstruction(topic, message) {
  const req = detectLessonRequest(message);
  const activeTopic = req.topic || topic;
  if (req.isLessonRequest && activeTopic) {
    return `MODO LIBRE — PIDIÓ LECCIÓN SOBRE "${activeTopic}": ejecutá la REGLA UNIVERSAL (confirmar + regla MSI + whiteboard + ejemplo + 1 ejercicio). contentType exercise en el cierre.`;
  }
  if (activeTopic && activeTopic !== 'open practice') {
    return `MODO COMPANION: tema activo "${activeTopic}". Si el mensaje toca ese tema, mini-lección MSI; si es charla, corregí suave y anclá a ranuras.`;
  }
  return 'MODO COMPANION libre: charla + corrección suave MSI®. Si surge cualquier duda gramatical, convertila en mini-lección al instante.';
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evaluá esta sesión Jill Pro (Foundations Companion) de ${name}.
Tema principal: ${topic || 'libre'}. Turnos estudiante: ${metrics.turns}. Palabras: ${metrics.wordCount}.

Sesión:
${hist}

JSON únicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases cálidas en español + ánimo para seguir con Foundations","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  JILL_PRO_ANY_TOPIC_LESSON_RULE,
  isJillProEnabled,
  resolveJillProSession,
  extractLessonTopic,
  inferFoundationsTopic,
  detectLessonRequest,
  resolveSessionTopic,
  buildJillProCoachBlock,
  buildJillProOpeningInstruction,
  buildJillProStreamTeachInstruction,
  buildJillProEvalPrompt
};
