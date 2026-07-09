/**
 * Jill Pro - Foundations Companion (comportamiento normal, no modo demo).
 * Flujo: saludo -> ensenar duda de clase -> quedo claro? -> rutina ~15 min con correccion oral.
 */
const JILL_PRO_BRAIN_VER = 'v4-classroom-tutor-flow-any-topic';

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

/** Extrae el tema cuando el estudiante pide leccion explicitamente. */
function extractLessonTopic(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.length < 4) return '';
  const t = raw.toLowerCase();

  const triggers = [
    /\b(?:me explic[a\u00e1]s?|me explic[a\u00e1]me)\s+(.+)/i,
    /\b(?:ayud[a\u00e1]me|ayuda|help me|help)\s+(?:con|with|sobre|about|to)\s+(.+)/i,
    /\b(?:no entiendo|no comprendo|don't understand|do not understand|confused about)\s+(.+)/i,
    /\b(?:en clase|today in class|we learned|nos ense[n\u00f1]aron|vimos)\s+(.+)/i,
    /\b(?:quiero|want to|need to|necesito)\s+(?:practicar|practice|aprender|learn|estudiar|study)\s+(.+)/i,
    /\b(?:explic[a\u00e1]me|expl\u00edcame|explain|teach me|ens[e\u00e9][a\u00e1]me)\s+(.+)/i,
    /\b(?:una lecci[o\u00f3]n|a lesson|mini lecci[o\u00f3]n|mini-lesson)\s+(?:de|sobre|about|on|del|de la|of)\s+(.+)/i,
    /\b(?:c[o\u00f3]mo se dice|how do you say|how to use|c[o\u00f3]mo usar)\s+(.+)/i,
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

  if (/\b(no entiendo|no comprendo|help|ayuda|explain|explic|no me qued[o\u00f3])\b/i.test(raw) && raw.length > 12) {
    return raw.slice(0, 120);
  }
  return '';
}

function inferFoundationsTopic(text) {
  const extracted = extractLessonTopic(text);
  if (extracted) return extracted;

  const raw = String(text || '').trim();
  const t = raw.toLowerCase();
  const patterns = [
    { re: /\b(gerundio|gerund|-ing\b|progressive|continuo|presente continuo|\bpc\b)/, topic: 'gerundio / PC (P + To Be + V+ing)' },
    { re: /\b(presente simple|present simple|\bpr\b)/, topic: 'presente simple PR' },
    { re: /\b(pasado simple|past simple|\bps\b)/, topic: 'pasado simple PS' },
    { re: /\b(presente perfecto|present perfect|\bprp\b)/, topic: 'presente perfecto PRP' },
    { re: /\b(pasado perfecto|past perfect|\bpap\b|\bppc\b)/, topic: 'pasado perfecto / PPC' },
    { re: /\b(futuro|future tense|\bfut\b)/, topic: 'futuro MOD (P + will + V + C)' },
    { re: /\b(modal|will|would|should|can|could|must|may|might)/, topic: 'modales MOD' },
    { re: /\b(moneda|pregunta|question|respuesta|affirm)/, topic: 'metodo moneda' },
    { re: /\b(preposici|prep\b|\bin on at\b)/, topic: 'preposiciones' },
    { re: /\b(art[i\u00ed]culo|article|\bthe\b|\ba an\b)/, topic: 'articulos' },
    { re: /\b(pronoun|pronombre)/, topic: 'pronombres P' },
    { re: /\b(estructura|msi|chunk|ranura|mec[a\u00e1]nica)/, topic: 'MSI estructura' },
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
  const lastExtracted = extractLessonTopic(lastUserMessage);
  const lastInferred = inferFoundationsTopic(lastUserMessage);
  const fromLast = lastExtracted || (lastInferred && lastInferred !== 'open practice' ? lastInferred : '');
  if (fromLast) return String(fromLast).trim().slice(0, 120);

  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const extracted = extractLessonTopic(users[i].content);
    if (extracted) return extracted;
    const hit = inferFoundationsTopic(users[i].content);
    if (hit && hit !== 'open practice') return hit;
  }
  if (companionTopic && String(companionTopic).trim()) {
    return String(companionTopic).trim().slice(0, 120);
  }
  return 'open practice';
}

function detectLessonRequest(message) {
  const topic = extractLessonTopic(message) || inferFoundationsTopic(message);
  const t = String(message || '').toLowerCase();
  const explicit = /\b(ayud|help|explic|ens[e\u00e9][a\u00e1]|lecci[o\u00f3]n|lesson|no entiendo|don't understand|quiero practic|want to practice|teach me|en clase|nos ense[n\u00f1]aron|no me qued[o\u00f3])\b/.test(t);
  return {
    isLessonRequest: !!(topic && (explicit || topic.length > 6)),
    topic: topic || ''
  };
}

function lastAssistantMessage(history) {
  const assistants = (history || []).filter((m) => m.role === 'assistant' && m.content);
  return assistants.length ? String(assistants[assistants.length - 1].content) : '';
}

function askedClarityCheck(text) {
  const s = String(text || '');
  return /\b(te qued[o\u00f3] claro|qued[o\u00f3] claro|entendiste|tiene sentido|fue claro|me explico)\b/i.test(s)
    || /te qued[o\u00f3] claro\s*\?/i.test(s);
}

function launchedPracticeRoutine(text) {
  return /\b(rutina de|practicemos|practiquemos|15 min|en voz alta|leelo|ahora produc|rapid fire|oracion \d|ronda \d|siguiente oraci)\b/i.test(String(text || ''));
}

function detectClarityConfirmed(message) {
  const t = String(message || '').toLowerCase().trim();
  if (detectClarityDenied(message)) return false;
  return /^(si|s[i\u00ed]|yes|yep|yeah|claro|entendi|ok|okay|dale|listo|perfecto|afirmativo)\b/.test(t)
    || /\b(me quedo claro|me qued[o\u00f3] claro|todo claro|ya entendi|creo que si|y si|sip)\b/.test(t);
}

function detectClarityDenied(message) {
  return /\b(no entiendo|no me queda|mas simple|m[a\u00e1]s simple|otra vez|confus|todavia no|todav[i\u00ed]a no|no quedo claro|no qued[o\u00f3] claro|explica otra)\b/i.test(String(message || ''));
}

function detectPracticeRequest(message) {
  return /\b(practicar|rutina|15 min|ejercicio|evalua|corrige|en voz alta)\b/i.test(String(message || ''));
}

function sessionHasTeaching(history) {
  return (history || []).some((m) => m.role === 'assistant' && m.content && (
    askedClarityCheck(m.content)
    || launchedPracticeRoutine(m.content)
    || (/\b(formula|whiteboard|MSI|ranura|P \+|be \+|V\+ing)\b/i.test(m.content) && m.content.length > 180)
  ));
}

/**
 * Fases del flujo normal Jill Pro (no demo).
 * opening -> teach -> clarity_check -> practice_routine -> free_chat
 */
function resolveCompanionPhase(history, message, topic) {
  const lastAsst = lastAssistantMessage(history);
  const activeTopic = topic && topic !== 'open practice' ? topic : '';

  if (askedClarityCheck(lastAsst)) {
    if (detectClarityConfirmed(message)) return 'practice_routine';
    if (detectClarityDenied(message)) return 'teach';
  }

  if (launchedPracticeRoutine(lastAsst) || (history || []).some((m) => m.role === 'assistant' && launchedPracticeRoutine(m.content))) {
    return 'practice_routine';
  }

  const lesson = detectLessonRequest(message);
  if (lesson.isLessonRequest) return 'teach';

  if (detectPracticeRequest(message) && activeTopic) return 'practice_routine';

  if (activeTopic && sessionHasTeaching(history) && !askedClarityCheck(lastAsst)) {
    return 'clarity_check';
  }

  if (activeTopic && !sessionHasTeaching(history)) return 'teach';

  return 'free_chat';
}

const JILL_PRO_CORE_FLOW = `
FLUJO NORMAL JILL PRO (SIEMPRE - no es demo, es tu comportamiento por defecto):

1) APERTURA: saludo calido + "Que vamos a practicar hoy?" - espera el tema del estudiante.
2) ENSENAR: cuando traen duda de clase o piden un tema:
   - Confirma el tema en 1 frase ("Claro, [tema] -")
   - Explica COMPLETO desde el espanol (puente logico, no memorizacion)
   - Formula MSI + whiteboard (contentType "whiteboard") cuando aplique
   - 2-4 ejemplos concretos en ingles con puente en espanol
   - Cierra SIEMPRE con: "Te quedo claro?"
3) SI DICE NO / NO ENTIENDO: re-explica MAS SIMPLE (otras palabras, 1 ejemplo nuevo). Vuelve a preguntar si quedo claro.
4) SI DICE SI / CLARO: pasa a RUTINA DE PRACTICA (~15 min):
   - "Perfecto - practiquemos unos 15 minutos usando [tema]."
   - UN ejercicio por turno (contentType "exercise")
   - Pide que lo diga o lo lea EN VOZ ALTA (microfono o escrito)
   - Corrige AL INSTANTE: reformulacion + 1 ranura MSI - no des la respuesta completa
   - Rota: pronombres, afirmacion + pregunta (metodo moneda), variantes del tema
   - Al final de cada correccion: siguiente micro-ejercicio hasta completar la rutina
5) CHARLA LIBRE: si solo conversan, corrige suave en el flujo; si surge duda gramatical -> vuelve al paso 2.

NUNCA digas "eso lo vemos despues" ni "espera al bundle". El tema que traen de clase manda ? CUALQUIER tema Foundations.
TEMAS (ejemplos, no lista cerrada): gerundio/PC, presente simple, pasado simple, present perfect, past perfect, modales, preposiciones, articulos, pronombres, there is/are, vocab, moneda/preguntas, comparativos, condicionales, phrasal verbs, pronunciacion, o cualquier duda que traigan de clase.
El flujo es IDENTICO para todos: explicar -> quedo claro? -> rutina 15 min. El gerundio es solo UN ejemplo de muchos.
NUNCA te quedes solo en teoria: despues de explicar, SIEMPRE practica guiada.
Si piden linkers avanzados / STAR / Nexora: redirige a Alice en 1 frase.`;

const JILL_PRO_TOPIC_EXAMPLES = `
EJEMPLOS DE PATRON (usa el que corresponda al tema activo ? NO solo gerundio):
- Gerundio/PC: P + be + V+ing + C | ING vs TO segun general vs especifico
- Presente simple PR: P + V + C
- Pasado simple PS: P + V pasado + C
- Present perfect PRP: P + have/has + participio + C
- Modales MOD: P + M + V + C
- Preposiciones/articulos: ranura C + regla de uso
- Moneda: afirmacion vs pregunta (inversion de pieza verbal)
- Vocab/pronunciacion: patron + produccion oral inmediata
Si el tema no esta en la lista, igual aplicas el flujo universal con la logica MSI que corresponda.`;

const JILL_PRO_GERUND_PEDAGOGY = `
REFERENCIA GERUNDIO (solo si el tema activo es gerundio/-ING ? no usar para otros temas):
- Espanol: para -ando/-iendo necesitamos auxiliar (estoy, esta, estamos...)
- Ingles PC: P + am/is/are/was/were + V+ing + C - "I am working", "She is watching"
- Perfectos continuos: have/had + been + V+ing - "I have been studying"
- ING general (gusto/habito): I like dancing - no especifica cuando ni como
- TO + V (decision/especifico): I like to dance rock - aclara tipo o intencion
- Whiteboard: PC = P | be | V+ing | C`;

const JILL_PRO_ANY_TOPIC_LESSON_RULE = `
REGLA UNIVERSAL - CUALQUIER TEMA -> LECCION + PRACTICA (sin excepcion):
${JILL_PRO_CORE_FLOW}
${JILL_PRO_TOPIC_EXAMPLES}
${JILL_PRO_GERUND_PEDAGOGY}`;

function buildJillProCoachBlock(student, topic) {
  const phase = topic && topic !== 'open practice' ? 'tema activo' : 'esperando tema';
  const topicLine = topic && topic !== 'open practice'
    ? `TEMA ACTIVO: "${topic}" - sigue el flujo normal (ensenar -> quedo claro? -> rutina 15 min).`
    : 'Sin tema aun: saluda y pregunta que practicamos hoy.';
  const weak = [...(student?.quizWeakKpis || []), ...(student?.nemesisState?.reinforcement || [])].slice(0, 5);
  const weakLine = weak.length
    ? `Refuerzo opcional en la rutina: ${weak.join(', ')}.`
    : '';

  return `JILL PRO - TUTORA DE CLASE (comportamiento normal)
${JILL_PRO_ANY_TOPIC_LESSON_RULE}
${topicLine}
${weakLine}
Fase actual inferida: ${phase}.

QUIEN SOS:
- Tutora que explica lo de clase, verifica que entendio, y practica en vivo con correccion.
- Calida, directa, sin condescendencia. Preparas para Alice - no linkers avanzados ni Nexora.

COMO TE COMPORTAS:
- Espanol primero -> patron MSI -> produccion del estudiante -> correccion.
- Ensenanza puede ser 6-12 oraciones si hace falta (dudas de clase merecen explicacion completa).
- Despues de cada "si, entendi" -> rutina de practica, no mas teoria.
- NUNCA cortes a mitad de oracion.`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display}. Pregunta: "Que vamos a practicar hoy?" - natural, 2-3 oraciones. NO des teoria todavia.${topic ? ` Si retoman "${topic}", ofrece seguir con practica o un tema nuevo.` : ''}`;
  }
  return `Primera sesion Jill Pro con ${display}: saludo calido. Pregunta directamente "Que vamos a practicar hoy?" - dile que puede traer CUALQUIER duda de clase (gramatica, vocab, tiempos, lo que sea). 2-3 oraciones. NO expliques nada todavia.`;
}

function buildJillProStreamTeachInstruction(topic, message, history) {
  const activeTopic = topic && topic !== 'open practice' ? topic : (detectLessonRequest(message).topic || topic);
  const phase = resolveCompanionPhase(history, message, activeTopic);

  if (phase === 'practice_routine') {
    return `FASE PRACTICA (~15 min) - tema "${activeTopic || 'activo'}".
El estudiante ya entendio la teoria. Ahora:
- UN micro-ejercicio por turno (oracion, parrafo corto, o pregunta para leer en voz alta).
- Si produjo texto/voz: corrige AL INSTANTE (reformulacion + ranura MSI). Luego siguiente ejercicio.
- Rota pronombres, afirmacion/pregunta (moneda), variantes del tema.
- Si acaba de confirmar "si/claro": arranca la rutina - "Perfecto, practiquemos 15 minutos con [tema]..." + primer ejercicio.
- contentType "exercise". NO repitas toda la teoria.`;
  }

  if (phase === 'teach') {
    const clarify = detectClarityDenied(message);
    if (clarify) {
      return `REENSENAR - el estudiante NO entendio "${activeTopic}". NO repitas palabra por palabra.
Re-explica MAS SIMPLE: 1-2 frases espanol + formula MSI + whiteboard + 1 ejemplo + "Te quedo claro?"`;
    }
    return `FASE ENSENAR - tema "${activeTopic || 'del estudiante'}" (cualquier tema Foundations).
Ejecuta explicacion COMPLETA para ESE tema (no asumas gerundio salvo que sea el tema):
1) "Claro, [tema] -"
2) Puente espanol -> logica del patron (suficiente detalle para que entienda de verdad)
3) Whiteboard con formula MSI (contentType "whiteboard")
4) 2-4 ejemplos en ingles
5) Cierra con "Te quedo claro?" - NO pases a practica hasta que confirmen.
contentType "whiteboard" si hay formula; si no, "text".`;
  }

  if (phase === 'clarity_check') {
    return `CIERRE DE LECCION - tema "${activeTopic}". Pregunta explicitamente "Te quedo claro?" si aun no lo hiciste. Espera confirmacion antes de la rutina.`;
  }

  const req = detectLessonRequest(message);
  if (req.isLessonRequest && req.topic) {
    return `NUEVA DUDA - "${req.topic}": empieza FASE ENSENAR completa. Explicacion + whiteboard + ejemplos + "Te quedo claro?"`;
  }

  if (detectPracticeRequest(message) && activeTopic && activeTopic !== 'open practice') {
    return `PIDEN PRACTICAR "${activeTopic}": arranca rutina ~15 min con primer ejercicio. contentType "exercise".`;
  }

  return `CHARLA LIBRE Jill Pro: conversa con correccion suave MSI. Si surge cualquier duda gramatical o de clase -> FASE ENSENAR (explicar + quedo claro? + rutina). Si solo saludan, pregunta que practicamos hoy.`;
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evalua esta sesion Jill Pro de ${name}.
Tema principal: ${topic || 'libre'}. Turnos estudiante: ${metrics.turns}. Palabras: ${metrics.wordCount}.

Sesion:
${hist}

JSON unicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases calidas en espanol + animo para seguir practicando","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  JILL_PRO_ANY_TOPIC_LESSON_RULE,
  JILL_PRO_CORE_FLOW,
  isJillProEnabled,
  resolveJillProSession,
  extractLessonTopic,
  inferFoundationsTopic,
  detectLessonRequest,
  resolveSessionTopic,
  resolveCompanionPhase,
  detectClarityConfirmed,
  detectClarityDenied,
  buildJillProCoachBlock,
  buildJillProOpeningInstruction,
  buildJillProStreamTeachInstruction,
  buildJillProEvalPrompt
};
