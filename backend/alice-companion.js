/**
 * Alice Companion — KPI-aware session logic (testable, server-only).
 */
const COMPANION_EVAL_MODES = new Set(['soft', 'standard', 'rigorous']);
const COMPANION_FOCUS_KPI_LIMIT = 5;
const COMPANION_MIN_TURNS_DEFAULT = 0;
const COMPANION_BRAIN_VER = 'v1-kpi-companion';

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
  return !!(student && student.companionEnabled === true);
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
  const patterns = [
    { re: /\b(history|historical|war|century|ancient|empire|revolution)\b/, topic: 'history' },
    { re: /\b(science|space|nasa|planet|physics|chemistry|biology|discovery)\b/, topic: 'science' },
    { re: /\b(work|job|career|office|customer|call center)\b/, topic: 'work' },
    { re: /\b(family|kids|children|parents|home)\b/, topic: 'family' },
    { re: /\b(travel|trip|vacation|country|city)\b/, topic: 'travel' },
    { re: /\b(sport|football|soccer|gym|exercise)\b/, topic: 'sports' },
    { re: /\b(movie|film|music|book|series)\b/, topic: 'entertainment' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 12) return 'general';
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  if (companionTopic && String(companionTopic).trim()) return String(companionTopic).trim().slice(0, 80);
  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const hit = inferTopicFromText(users[i].content);
    if (hit && hit !== 'general') return hit;
  }
  const fromLast = inferTopicFromText(lastUserMessage);
  return fromLast || 'open conversation';
}

function buildFocusKpiCoachLines(focusKpis) {
  return focusKpis.map((id) => {
    const hint = COMPANION_KPI_COACH[id] || COMPANION_KPI_COACH[String(id).toUpperCase()];
    return hint ? `- ${id.toUpperCase()}: ${hint}` : `- ${id}: practice in natural conversation`;
  }).join('\n');
}

function buildCompanionCoachBlock(student, config, topic) {
  const cfg = normalizeCompanionConfig(config, student);
  const topicLine = topic ? `ACTIVE TOPIC: "${topic}" — stay curious, branch into dates/places/examples when relevant.` : 'Let the student pick the topic; ask what they want to talk about today.';
  const seeds = cfg.topicSeeds ? `Trainer topic hints: ${cfg.topicSeeds}.` : '';
  const focusBlock = buildFocusKpiCoachLines(cfg.focusKpis);
  const rigor = cfg.evalMode === 'rigorous'
    ? 'If they give a very short reply, still accept it warmly — only nudge for more when they seem engaged.'
    : (cfg.evalMode === 'soft' ? 'Prioritize confidence and flow — short answers are always OK.' : 'Balance warmth with light micro-corrections when natural.');

  return `COMPANION MODE — FREE CONVERSATION (like a friendly Siri for English practice)
${topicLine}
${seeds}

TRAINER FOCUS KPIs (weave invisibly — never lecture or drill):
${focusBlock}

CONVERSATION RULES:
- No minimum turns, no exercises, no pressure. The student can chat as little or as long as they want.
- Follow their topic with genuine curiosity (history → dates/places; science → how/why; anything they choose).
- Short replies are welcome. Answer questions, react naturally, keep it light and human.
- ${rigor}
- 2-4 natural sentences; a follow-up question is optional, not a test. Never cut off mid-thought.
- Do NOT roleplay as Nexora customer/interviewer. Do NOT ask them to "practice longer".
- End with: ALICE: [one brief tip in Spanish — only if it fits naturally]`;
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
{"best_moment":"Quote or paraphrase something specific they did well on THIS topic","main_improvement":"One concrete improvement tied to focus KPIs and what they said","topic_follow_up":"One sentence challenge for next session on the same topic","alice_message":"2-3 sentences. End with: ALICE: [motivating Spanish line]","kpi_feedback":{"${cfg.focusKpis[0] || 'k10'}":"one line"}}`;
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
    alice_message: qual.alice_message || 'Great conversation today!\nALICE: ¡Seguí practicando con temas que te importan!',
    kpi_feedback: qual.kpi_feedback || {}
  };
}

module.exports = {
  COMPANION_BRAIN_VER,
  COMPANION_KPI_COACH,
  isCompanionEnabled,
  normalizeCompanionConfig,
  resolveCompanionSession,
  inferTopicFromText,
  resolveSessionTopic,
  buildCompanionCoachBlock,
  scoreCompanionSession,
  buildCompanionEvalUserPrompt,
  enrichCompanionEvaluation,
  sanitizeFocusKpis,
  defaultFocusKpisFromStudent
};
