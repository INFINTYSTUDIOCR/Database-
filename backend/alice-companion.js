/**
 * Alice Companion — KPI-aware session logic (testable, server-only).
 * Free chat + on-demand doubt → explain → check → short practice (same arc as Jill Pro).
 */
const COMPANION_EVAL_MODES = new Set(['soft', 'standard', 'rigorous']);
const COMPANION_FOCUS_KPI_LIMIT = 5;
const COMPANION_MIN_TURNS_DEFAULT = 0;
const COMPANION_BRAIN_VER = 'v4-doubt-explain-practice';

const ALICE_LANGUAGE_RULE = `LANGUAGE (STRICT):
- Speak ONLY in English by default — greetings, chat, stories, coaching, corrections, everything.
- Spanish ONLY when the student explicitly asks you to EXPLAIN something (e.g. "explain in Spanish", "explicame", "no entiendo", "en español", "what does X mean — explain it"). Explain clearly in Spanish (bilingual OK for that explanation), then return to English for the conversation.
- NEVER sprinkle Spanish tips, "ALICE: [tip]", or random Spanish lines unless they asked for an explanation in Spanish.
- Understand student input in English, Spanish, or Spanglish — never scold for mixing.`;

function studentWantsSpanishExplanation(message) {
  const t = String(message || '');
  return /\b(explic[aá]me|explain in spanish|en espa[nñ]ol|no entiendo|no comprendo|don't understand|do not understand|what does .+ mean|qu[eé] significa|c[oó]mo se dice|traduc|translate|dime en espa[nñ]ol|in spanish please|habl[aá]me en espa[nñ]ol)\b/i.test(t);
}

/**
 * Class doubt / on-demand mini-lesson — any English topic (grammar, linkers, STAR, phrases).
 */
function isEnglishDoubtRequest(message) {
  const t = String(message || '');
  if (!t.trim()) return false;
  const ask = /\b(explain|teach me|ens[eé][aá]me|explic[aá]me|no entiendo|no me qued[oó]|don't understand|do not understand|how do i|how to use|c[oó]mo se (usa|dice|forma|hace)|what (is|are|does)|help me (understand|with)|can you (explain|help)|en clase|hoy (en clase |vimos |nos ense[nñ])|me ense[nñ]aron|no me qued[oó] claro|ayudame (a )?entender|pod[eé]s ayudarme|podes ayudarme)\b/i.test(t);
  const topic = /\b(gramm|gerund|tense|linker|connectors?|star (method|structure)|phrasal|prepos|modals?|conditionals?|present perfect|past perfect|reported speech|passive voice|collocation|idiom|recovery phrase)\b/i.test(t);
  return ask || (topic && /\b(no |don'?t |how |what |qu[eé] |c[oó]mo |explain|ense|entend|help)/i.test(t));
}

function isClarityReply(message) {
  const t = String(message || '').trim().toLowerCase();
  if (!t || t.length > 80) return false;
  return /^(s[ií]|sip|claro|ok|okay|dale|listo|ya|entend[ií]|me qued[oó]|no|nop|todav[ií]a no|casi|more or less|m[aá]s o menos|un poco|yes|yeah|yep|got it|makes sense|not really|still confused)([.!?\s]|$)/i.test(t)
    || /\b(me qued[oó] claro|ya entend[ií]|todav[ií]a no|no del todo|explicalo otra vez|otra vez|makes sense|got it|still (confused|lost)|not really)\b/i.test(t);
}

const ALICE_COMPANION_DOUBT_MODE = `ON-DEMAND DOUBT MODE (when they ask grammar / class doubt / "explain X" / "enséñame"):
Required flow — you are NOT the classroom tutor, but you DO clarify ANY English topic:
1) EXPLAIN simply (English by default; Spanish if they asked for Spanish explanation): pattern → 1-2 examples → one tip they can use now.
2) CHECK: ask "Does that make sense?" / "¿Te quedó claro?" (match their language).
3) SHORT PRACTICE: if clear, invite 3-6 turns of production (they try; you soft-correct and nudge). No Nexus drills, no STAR homework sheet, no Nexora roleplay.
4) After short practice: return to free chat or ask if they want another topic.
Any topic is fair: linkers, STAR, tenses, phrasals, recovery phrases, professional tone, etc.
If they want full customer/interview simulation: point to Nexora Lab in one warm line, then keep companion chat.`;

const COMPANION_KPI_COACH = {
  k9: 'Idea expansion — ask for more distinct ideas and fuller answers on the topic',
  k10: 'Thought connection — natural linkers (however, on top of that, even though)',
  k13: 'Recovery — model "Let me rephrase that" when they freeze',
  k18: 'Multi-step clarity — confirm understanding before answering',
  k20: 'STAR structure — situation, task, action, result when telling stories',
  k21: 'Professional closure — complete thoughts, offer next step',
  IG: 'Idea Generation — quantity and variety of ideas',
  ST: 'Structure — organized, logical flow',
  RA: 'Recovery Ability — bounce back from mistakes',
  PS: 'Pressure Stability — stay calm, keep going',
  R: 'Risk Taking — try new words and structures'
};

function isCompanionEnabled(student) {
  if (!student) return false;
  const v = student.companionEnabled;
  return v === true || v === 'true' || v === 1;
}

function sanitizeFocusKpis(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  list.forEach((id) => {
    const k = String(id || '').trim();
    if (!k || out.includes(k)) return;
    if (/^k\d{1,2}$/i.test(k) || /^[A-Z]{1,3}$/.test(k)) out.push(k.toLowerCase().startsWith('k') ? k.toLowerCase() : k);
  });
  return out.slice(0, COMPANION_FOCUS_KPI_LIMIT);
}

function defaultFocusKpisFromStudent(student) {
  const kf = student?.kpiFile;
  const fromFile = []
    .concat(kf?.weakMicro || [], kf?.weakMacro || [])
    .map((x) => String(x).trim())
    .filter(Boolean);
  if (fromFile.length) return sanitizeFocusKpis(fromFile);
  const hist = student?.kpiTracker || [];
  const last = hist.length ? hist[hist.length - 1] : null;
  if (last?.scores) {
    const ranked = Object.keys(last.scores)
      .map((id) => ({ id, v: parseInt(last.scores[id], 10) || 0 }))
      .sort((a, b) => a.v - b.v);
    return sanitizeFocusKpis(ranked.slice(0, 3).map((r) => r.id));
  }
  return ['k10', 'k9', 'k13'];
}

function normalizeCompanionConfig(raw, student) {
  const cfg = raw && typeof raw === 'object' ? { ...raw } : {};
  let focusKpis = sanitizeFocusKpis(cfg.focusKpis);
  if (!focusKpis.length) focusKpis = defaultFocusKpisFromStudent(student);
  const evalMode = COMPANION_EVAL_MODES.has(cfg.evalMode) ? cfg.evalMode : 'standard';
  const minTurns = 0;
  const defaultSessionType = cfg.defaultSessionType === 'practice' ? 'practice' : 'companion';
  return {
    setAt: cfg.setAt || null,
    setBy: cfg.setBy || null,
    justification: String(cfg.justification || '').slice(0, 500),
    topicSeeds: String(cfg.topicSeeds || '').slice(0, 200),
    focusKpis,
    evalMode,
    minTurns,
    defaultSessionType
  };
}

function resolveCompanionSession(student, sessionType) {
  const enabled = isCompanionEnabled(student);
  const config = normalizeCompanionConfig(student?.companionConfig, student);
  const requested = sessionType === 'companion' ? 'companion' : 'practice';
  if (requested === 'companion' && !enabled) {
    return {
      allowed: true,
      sessionType: 'practice',
      config,
      companionBlocked: true,
      reason: 'companion_not_enabled'
    };
  }
  return {
    allowed: true,
    sessionType: requested,
    config,
    companionBlocked: false,
    reason: null
  };
}

function inferTopicFromText(text) {
  const t = String(text || '').toLowerCase();
  if (!t || t.length < 4) return '';
  if (isEnglishDoubtRequest(t)) {
    const topicHit = t.match(/\b(linker|connector|however|star|phrasal|gerund|present perfect|past perfect|conditionals?|modal|prepos|recovery|idiom|collocation)\b/i);
    if (topicHit) return `doubt:${topicHit[1].toLowerCase()}`;
    return 'doubt:english';
  }
  const patterns = [
    { re: /\b(history|historical|war|century|ancient|empire|revolution|story|stories|tale|legend)\b/, topic: 'stories' },
    { re: /\b(science|space|nasa|planet|physics|chemistry|biology|discovery)\b/, topic: 'science' },
    { re: /\b(work|job|career|office|customer|call center|interview)\b/, topic: 'work' },
    { re: /\b(family|kids|children|parents|home|friends)\b/, topic: 'family' },
    { re: /\b(travel|trip|vacation|country|city|flight)\b/, topic: 'travel' },
    { re: /\b(sport|football|soccer|gym|exercise|fitness)\b/, topic: 'sports' },
    { re: /\b(movie|film|music|book|series|netflix|song)\b/, topic: 'entertainment' },
    { re: /\b(fashion|style|clothes|outfit|shoes|makeup|brand)\b/, topic: 'fashion' },
    { re: /\b(food|recipe|cook|restaurant|coffee|dinner)\b/, topic: 'food' },
    { re: /\b(love|dating|relationship|feelings|mood|stress|life)\b/, topic: 'life' },
    { re: /\b(news|politics|world|economy)\b/, topic: 'world' },
    { re: /\b(tech|phone|app|ai|internet|game|gaming)\b/, topic: 'tech' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 12) return 'general';
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  if (companionTopic && String(companionTopic).trim()) return String(companionTopic).trim().slice(0, 80);
  const fromLast = inferTopicFromText(lastUserMessage);
  if (fromLast && fromLast !== 'general') return fromLast;
  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const hit = inferTopicFromText(users[i].content);
    if (hit && hit !== 'general') return hit;
  }
  return fromLast || 'open conversation';
}

function resolveCompanionPhase(message, history) {
  if (isEnglishDoubtRequest(message)) return 'doubt_explain';
  if (isClarityReply(message)) {
    const prev = [...(history || [])].reverse().find((m) => m.role === 'assistant');
    const prevText = String(prev?.content || '');
    if (/make sense|qued[oó] claro|entendiste|clear\?|got it\?/i.test(prevText)) {
      return 'doubt_practice';
    }
  }
  const topic = resolveSessionTopic(history, '', message);
  if (String(topic).startsWith('doubt:')) return 'doubt_practice';
  return 'free_chat';
}

function buildCompanionStreamTeachInstruction(topic, message, history) {
  const msg = String(message || '');
  const phase = resolveCompanionPhase(msg, history);
  const wantSpanish = studentWantsSpanishExplanation(msg);

  if (phase === 'doubt_explain') {
    const lang = wantSpanish
      ? 'Explain in Spanish (bilingual OK for examples), then return to English for the check question.'
      : 'Explain in English (clear, simple). Use Spanish only if they asked for it.';
    return `DOUBT MODE — EXPLAIN: student brought an English/class doubt.
1) ${lang} Pattern → 1-2 examples → one usable tip.
2) Ask "Does that make sense?" (or "¿Te quedó claro?" if they are in Spanish).
3) No Nexus drill sheet, no Nexora roleplay.
Topic: "${topic || 'their doubt'}".`;
  }

  if (phase === 'doubt_practice') {
    const negative = /\b(no|nop|todav[ií]a no|casi|m[aá]s o menos|un poco|no del todo|otra vez|not really|still (confused|lost)|don't get it)\b/i.test(msg);
    if (negative && isClarityReply(msg)) {
      return `DOUBT MODE — RE-EXPLAIN: it was not clear. Simpler explanation + a new example. Then check again. ${wantSpanish ? 'Spanish OK for the explanation.' : 'English by default.'}`;
    }
    return `DOUBT MODE — SHORT PRACTICE: they understood (or are practicing) "${topic || 'the doubt'}".
Ask them to produce one sentence/answer using the pattern; soft-correct; invite the next try.
3-6 turns max; then offer free chat or another topic. Stay in English unless they ask for Spanish explanation.`;
  }

  if (wantSpanish) {
    return `TURN: Student asked for explanation — explain in Spanish (bilingual OK), then return to English chat.`;
  }

  return `TURN: Free companion chat on "${topic || 'whatever they want'}". English ONLY. Listen, react, one follow-up. If they bring an English doubt, enter doubt mode.`;
}

function buildFocusKpiCoachLines(focusKpis) {
  return focusKpis.map((id) => {
    const hint = COMPANION_KPI_COACH[id] || COMPANION_KPI_COACH[String(id).toUpperCase()];
    return hint ? `- ${id.toUpperCase()}: ${hint}` : `- ${id}: practice in natural conversation`;
  }).join('\n');
}

function buildCompanionCoachBlock(student, config, topic) {
  const cfg = normalizeCompanionConfig(config, student);
  const isDoubt = String(topic || '').startsWith('doubt:');
  const topicLine = topic
    ? (isDoubt
      ? `ACTIVE DOUBT: "${String(topic).replace(/^doubt:/, '')}" — explain → check → short practice, then free chat.`
      : `ACTIVE TOPIC: "${topic}" — lean in with real interest. Ask, react, share, and go deeper when they want.`)
    : 'They choose: free chat about anything OR bring a class/English doubt.';
  const seeds = cfg.topicSeeds ? `Trainer soft hints (only if natural): ${cfg.topicSeeds}.` : '';
  const focusBlock = buildFocusKpiCoachLines(cfg.focusKpis);
  const rigor = cfg.evalMode === 'rigorous'
    ? 'Light micro-corrections only when natural — never interrupt the vibe.'
    : (cfg.evalMode === 'soft' ? 'Prioritize warmth and flow — short answers are always OK.' : 'Warm first; coach only when it fits the moment.');

  return `COMPANION MODE — ALWAYS-ON ENGLISH COMPANION (personal practice assistant for English)
${topicLine}
${seeds}

WHO YOU ARE:
- A voice companion they can talk to anytime: chat, listen, tell stories, guide, educate, and show genuine interest.
- You talk about ANYTHING: normal daily life, fashion, food, travel, work, feelings, news, hobbies, stories — no topic is off-limits.
- You are NOT a classroom tutor in this mode. You are a friend who clarifies English doubts on demand and practices with them.

HOW YOU BEHAVE:
- LISTEN first. React with real interest ("Oh nice!", "Wait, tell me more", "I love that").
- If they want a STORY — tell one (short or longer). If they want opinions on fashion, food, life — share yours warmly.
- Opening: ask what they want today — free chat OR a class/English doubt. Do not force a lesson.
- ${rigor}
- NEVER cut off mid-sentence. NEVER stop the conversation after a fixed number of turns.
- Do NOT force Nexus drills, STAR homework, or "practice longer". Do NOT roleplay as Nexora customer/interviewer.
${ALICE_COMPANION_DOUBT_MODE}
- Optional soft English growth (invisible):
${focusBlock}

${ALICE_LANGUAGE_RULE}`;
}

function scoreDimensionFluency(metrics) {
  const { turns, avgWords } = metrics;
  let s = 40;
  s += Math.min(25, turns * 4);
  if (avgWords >= 18) s += 25;
  else if (avgWords >= 12) s += 18;
  else if (avgWords >= 7) s += 10;
  else if (avgWords >= 4) s += 4;
  return Math.round(Math.min(100, s));
}

function scoreDimensionStructure(metrics) {
  const c = metrics.connectors?.length || 0;
  let s = 45 + Math.min(35, c * 10);
  if (metrics.avgWords >= 10) s += 10;
  return Math.round(Math.min(100, s));
}

function scoreDimensionVocabulary(metrics) {
  const unique = new Set((metrics.userText || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
  let s = 40 + Math.min(40, unique.size);
  if (metrics.wordCount >= 80) s += 15;
  else if (metrics.wordCount >= 40) s += 8;
  return Math.round(Math.min(100, s));
}

function scoreFocusKpi(id, metrics) {
  const key = String(id).toLowerCase();
  if (key === 'k10' || key === 'st') return scoreDimensionStructure(metrics);
  if (key === 'k9' || key === 'ig') return scoreDimensionVocabulary(metrics);
  if (key === 'k13' || key === 'ra') return Math.min(100, scoreDimensionFluency(metrics) + (metrics.turns >= 4 ? 8 : 0));
  if (key === 'ps' || key === 'r') return scoreDimensionFluency(metrics);
  return Math.round((scoreDimensionFluency(metrics) + scoreDimensionStructure(metrics)) / 2);
}

function scoreCompanionSession(metrics, student, config) {
  const cfg = normalizeCompanionConfig(config, student);
  const fluency = scoreDimensionFluency(metrics);
  const structure = scoreDimensionStructure(metrics);
  const vocabulary = scoreDimensionVocabulary(metrics);
  const focusScores = {};
  cfg.focusKpis.forEach((id) => {
    focusScores[id] = scoreFocusKpi(id, metrics);
  });
  const focusAvg = cfg.focusKpis.length
    ? Math.round(cfg.focusKpis.reduce((a, id) => a + (focusScores[id] || 0), 0) / cfg.focusKpis.length)
    : structure;
  let overall = Math.round(fluency * 0.35 + structure * 0.3 + vocabulary * 0.2 + focusAvg * 0.15);
  if (cfg.evalMode === 'rigorous') overall = Math.round(overall * 0.94);
  if (cfg.evalMode === 'soft') overall = Math.round(Math.min(97, overall * 1.04));
  overall = Math.min(97, Math.max(48, overall));
  return {
    overall_score: overall,
    dimensions: { fluency, structure, vocabulary, focus_avg: focusAvg },
    focus_kpi_scores: focusScores,
    eval_mode: cfg.evalMode,
    free_session: true
  };
}

function buildCompanionEvalUserPrompt(student, hist, metrics, scored, topic, config) {
  const cfg = normalizeCompanionConfig(config, student);
  const name = student?.name || student?.info?.name || 'the student';
  const dim = scored.dimensions;
  const focusLine = Object.entries(scored.focus_kpi_scores || {})
    .map(([k, v]) => `${k}:${v}/100`).join(', ');
  return `Evaluate this COMPANION English conversation for ${name} (level: ${student?.level || 'Functional'}).
Topic: ${topic || 'open'}
Eval mode: ${cfg.evalMode} · Focus KPIs: ${cfg.focusKpis.join(', ')}
Turns: ${metrics.turns} · Words: ${metrics.wordCount} (free session — no minimum required)
Computed dimensions — fluency:${dim.fluency}, structure:${dim.structure}, vocabulary:${dim.vocabulary}
Focus KPI scores: ${focusLine || 'n/a'}
Overall computed: ${scored.overall_score}/100 — your feedback MUST align with this level (${cfg.evalMode === 'rigorous' ? 'be honest and specific' : 'warm but accurate'}).

Session transcript:
${hist}

Return ONLY valid JSON (no overall_score field):
{"best_moment":"Quote or paraphrase something specific they did well on THIS topic","main_improvement":"One concrete improvement tied to focus KPIs and what they said","topic_follow_up":"One sentence challenge for next session on the same topic","alice_message":"2-3 warm sentences in English only","kpi_feedback":{"${cfg.focusKpis[0] || 'k10'}":"one line"}}`;
}

function enrichCompanionEvaluation(qual, scored, metrics, config) {
  const cfg = normalizeCompanionConfig(config, null);
  return {
    overall_score: scored.overall_score,
    dimensions: scored.dimensions,
    focus_kpi_scores: scored.focus_kpi_scores,
    eval_mode: scored.eval_mode,
    free_session: scored.free_session !== false,
    connectors_used: metrics.connectors || [],
    connectors_missed: [],
    best_moment: qual.best_moment || 'You showed up and practiced — that matters.',
    main_improvement: qual.main_improvement || 'Whenever you want, pick up the same topic and keep chatting.',
    topic_follow_up: qual.topic_follow_up || 'Next time, go deeper with one more example.',
    alice_message: qual.alice_message || 'Great conversation today — keep chatting about topics that matter to you.',
    kpi_feedback: qual.kpi_feedback || {}
  };
}

module.exports = {
  COMPANION_BRAIN_VER,
  ALICE_LANGUAGE_RULE,
  ALICE_COMPANION_DOUBT_MODE,
  studentWantsSpanishExplanation,
  isEnglishDoubtRequest,
  isClarityReply,
  COMPANION_KPI_COACH,
  isCompanionEnabled,
  normalizeCompanionConfig,
  resolveCompanionSession,
  inferTopicFromText,
  resolveSessionTopic,
  resolveCompanionPhase,
  buildCompanionStreamTeachInstruction,
  buildCompanionCoachBlock,
  scoreCompanionSession,
  buildCompanionEvalUserPrompt,
  enrichCompanionEvaluation,
  sanitizeFocusKpis,
  defaultFocusKpisFromStudent
};
