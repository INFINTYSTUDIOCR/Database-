/**
 * Jill Pro ù Foundations Companion (Alice Companion style, MSIù scope).
 * Cualquier tema que pida el estudiante ? lecciùn MSI (regla + canon + prùctica).
 */
const JILL_PRO_BRAIN_VER = 'v2-any-topic-lesson-v3';

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

/** Extrae el tema cuando el estudiante pide lecciùn explùcitamente. */
function extractLessonTopic(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.length < 4) return '';
  const t = raw.toLowerCase();

  const triggers = [
    /\b(?:me explic[a\u00e1]s?|me explic[a\u00e1]me)\s+(.+)/i,
    /\b(?:ayud[a\u00e1]me|ayuda|help me|help)\s+(?:con|with|sobre|about|to)\s+(.+)/i,
    /\b(?:no entiendo|no comprendo|don't understand|do not understand|confused about)\s+(.+)/i,
    /\b(?:quiero|want to|need to|necesito)\s+(?:practicar|practice|aprender|learn|estudiar|study)\s+(.+)/i,
    /\b(?:explic[aù]me|explùcame|explain|teach me|ens[eù][aù]me)\s+(.+)/i,
    /\b(?:una lecci[où]n|a lesson|mini lecci[où]n|mini-lesson)\s+(?:de|sobre|about|on|del|de la|of)\s+(.+)/i,
    /\b(?:c[où]mo se dice|how do you say|how to use|c[où]mo usar)\s+(.+)/i,
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
    { re: /\b(futuro|future tense|\bfut\b)/, topic: 'futuro MOD (P + will + V + C)' },
    { re: /\b(modal|will|would|should|can|could|must|may|might)/, topic: 'modales MOD' },
    { re: /\b(moneda|pregunta|question|respuesta|affirm)/, topic: 'metodo moneda' },
    { re: /\b(preposici|prep\b|\bin on at\b)/, topic: 'preposiciones' },
    { re: /\b(art[iù]culo|article|\bthe\b|\ba an\b)/, topic: 'articulos' },
    { re: /\b(pronoun|pronombre)/, topic: 'pronombres P' },
    { re: /\b(estructura|msi|chunk|ranura|mec[aù]nica)/, topic: 'MSI estructura' },
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
  const explicit = /\b(ayud|help|explic|ens[eù]ù|lecci[où]n|lesson|no entiendo|don't understand|quiero practic|want to practice|teach me)\b/.test(t);
  return {
    isLessonRequest: !!(topic && (explicit || topic.length > 6)),
    topic: topic || ''
  };
}

const JILL_PRO_ANY_TOPIC_LESSON_RULE = `
REGLA UNIVERSAL JILL PRO ù CUALQUIER TEMA ? LECCIùN (OBLIGATORIO):
Cuando el estudiante pida ayuda con CUALQUIER tema (gramùtica, vocab, pronunciaciùn, tiempos, duda concreta, "no entiendo X", charla con correcciùn):
1) Confirmù el tema en 1 frase: "Claro, [tema] ù"
2) Regla MSIù en espaùol (1-3 oraciones) + fùrmula si aplica (PR/PS/PC/PRP/MOD/moneda)
3) Canon / whiteboard: contentType "whiteboard" con fùrmula ranuras P|M|V|C o ejemplo estructurado
4) UN ejemplo concreto en inglùs + puente en espaùol
5) UNA prùctica corta (contentType "exercise") ù el estudiante responde en el siguiente turno
6) Despuùs podùs seguir charlando o profundizar si piden mùs ù pero SIEMPRE entregù la mini-lecciùn primero
NUNCA digas "eso lo vemos despuùs" ni "esperù al bundle". El tema que piden manda.
Si el tema es conversaciùn libre: corregù suave en el flujo y enseùù la estructura del error en 1 ranura.
Si piden linkers avanzados / STAR / Nexora: redirigù a Alice en 1 frase sin mini-clase de linkers.`;

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open practice'
    ? `TEMA ACTIVO (lecciùn bajo demanda): "${topic}" ù convertù esto en lecciùn MSI completa (pasos 1-5 de la regla universal).`
    : 'Modo libre: el estudiante puede pedir CUALQUIER tema ù cada pedido explùcito se convierte en lecciùn (regla + canon + prùctica).';
  const weak = [...(student?.quizWeakKpis || []), ...(student?.nemesisState?.reinforcement || [])].slice(0, 5);
  const weakLine = weak.length
    ? `Refuerzo Rapid drill (opcional en la charla): ${weak.join(', ')}.`
    : '';

  return `JILL PRO ù FOUNDATIONS COMPANION (modo libre, como Alice Companion pero MSIù)
${JILL_PRO_ANY_TOPIC_LESSON_RULE}
${topicLine}
${weakLine}

QUIùN SOS:
- Compaùera de prùctica Foundations ù charla libre, calidez, interùs real.
- Corrigùs con cariùo tipo Alice: reformulaciùn, ùnimo, recuperaciùn.
- Preparùs para Alice ù NO curriculum de linkers avanzados, NO STAR, NO Nexora.

CùMO TE COMPORTùS:
- Escuchù primero. Cualquier mensaje con duda o tema = oportunidad de lecciùn.
- Correcciùn suave en charla; lecciùn estructurada cuando piden aprender algo concreto.
- 2-8 oraciones segùn haga falta; whiteboard cuando hay fùrmula.
- NUNCA cortes a mitad de oraciùn.`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display}. Preguntù quù tema quiere hoy ù cualquier duda Foundations se convierte en lecciùn (regla + ejemplo + prùctica). 2-3 oraciones.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesiùn Jill Pro con ${display}: saludo cùlido. Decile que puede pedir CUALQUIER tema ("gerundio", "preposiciones", "present perfect", vocab, charla) y vos lo convertùs en lecciùn MSI sin presiùn. 2-4 oraciones.`;
}

function buildJillProStreamTeachInstruction(topic, message) {
  const req = detectLessonRequest(message);
  const activeTopic = req.topic || topic;
  const clarify = /\b(no entiendo|m[a\u00e1]s simple|m[a\u00e1]s f[a\u00e1]cil|otra vez|repeat|simpler)\b/i.test(String(message || ''));
  if (clarify && activeTopic && activeTopic !== 'open practice') {
    return `CAMBIO DE ENFOQUE ó el estudiante NO entendiÛ. Tema activo: "${activeTopic}". NO repitas la respuesta anterior palabra por palabra. Re-explic· M¡S SIMPLE: 1 frase en espaÒol + fÛrmula MSI + 1 ejemplo corto en inglÈs + pregunta de pr·ctica. Si pidiÛ otro tema (ej. futuro), ese tema manda ó NO vuelvas a "be" ni presente si no corresponde.`;
  }
  if (req.isLessonRequest && activeTopic) {
    return `MODO LIBRE ó PIDI” LECCI”N SOBRE "${activeTopic}": ejecut· la REGLA UNIVERSAL (confirmar + regla MSI + whiteboard + ejemplo + 1 ejercicio). contentType exercise en el cierre. IGNOR¡ el tema anterior si el mensaje pide uno nuevo.`;
  }
  if (activeTopic && activeTopic !== 'open practice') {
    return `MODO COMPANION: tema activo "${activeTopic}". Si el mensaje toca ese tema, mini-lecciùn MSI; si es charla, corregù suave y anclù a ranuras.`;
  }
  return 'MODO COMPANION libre: charla + correcciùn suave MSIù. Si surge cualquier duda gramatical, convertila en mini-lecciùn al instante.';
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evaluù esta sesiùn Jill Pro (Foundations Companion) de ${name}.
Tema principal: ${topic || 'libre'}. Turnos estudiante: ${metrics.turns}. Palabras: ${metrics.wordCount}.

Sesiùn:
${hist}

JSON ùnicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases cùlidas en espaùol + ùnimo para seguir con Foundations","companion_score":0-100}`;
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
