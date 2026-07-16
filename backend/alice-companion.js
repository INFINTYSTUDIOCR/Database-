/**
 * Alice Modo Libre — KPI-aware session logic (testable, server-only).
 * Free chat + on-demand mini-lesson: doubt → full explain → confirm → short oral practice → back to chat.
 */
const COMPANION_BRAIN_VER = 'v13-cool-fast';
const COMPANION_EVAL_MODES = new Set(['soft', 'standard', 'rigorous']);
const COMPANION_FOCUS_KPI_LIMIT = 5;
const COMPANION_MIN_TURNS_DEFAULT = 0;

const ALICE_LANGUAGE_RULE = `LANGUAGE (STRICT — ES CR + EN US ONLY):
- Speak ONLY English (American) by default — greetings, chat, stories, coaching, corrections.
- Spanish (Costa Rica / clear LatAm tico) ONLY when the student uses an explain command: "explicame", "explícame", "explain", "teach me", "en español", "no entiendo".
- After a Spanish explanation, return to English.
- Letter names in Spanish explanations: R=erre, G=je, J=jota, I=i, L=ele, T=te — NEVER ar/gee/jay/eye/el/tee. ING = "í ene je".
- FORBIDDEN any other language or foreign phonetics (Portuguese, French, Italian, German, Spain Castilian, Rioplatense, IPA, "ai en yi") even if it sounds similar.
- NEVER use other languages. NEVER invent pronunciation guides from other languages.
- Understand English, Spanish, or messy ASR — never scold for mixing.
- TOPIC LOCK: do NOT start a new Nexus mini-lesson because a word SOUNDS similar in Spanish/English or appears alone. Stay on the current thread. Switch teach topic ONLY on explicame / explain / teach me.`;

const ALICE_JOHN_STYLE = `JOHN RAMÍREZ STYLE (MANDATORY FOR ALL ALICE TEACHING):
- Use Infinity institutional doctrine (Super Brain class transcripts + Nexus Method). Forbidden to teach as a generic chatbot.
- If you improvise an example, adjust it to John's style: clear analogy, patience, normal pace (not express, not dragging).
- Prefer pattern + bridge + example + confirm. Never invent foreign methods.`;

const ALICE_COMPANION_INTENT_RULE = `INTENT INTERPRETATION (REQUIRED — you are Claude, not a menu bot):
- Read the FULL message even if messy, typo-filled, Spanglish, or voice-to-text garbage.
- Infer what they WANT: explanation, chat, practice, correction, example.
- If intent is recoverable, answer it immediately. FORBIDDEN: "tell me again", "what do you want to talk about" when they already said it.
- Greeting + topic in one message → greet briefly and address the topic.`;

/** Full mini-lesson checklist — complete enough to feel like a real explanation, not a 2-line tip. */
const ALICE_COMPANION_TEACH_CANON = `ON-DEMAND MINI-LESSON (ANY English topic they ask about):
You are still a companion — NOT a rigid classroom tutor. No forced curriculum, no Nexus drill sheets, no Nexora roleplay.
When they bring a doubt OR ask "explain / teach me / how does X work / what is X":
CHECKLIST (skipping any step = FAIL the turn):
1) NAME the topic in one clear line.
2) PATTERN / FORMULA — the rule in plain words (e.g. Idea + Linker + Idea; have + past participle; Situation-Task-Action-Result).
3) BRIDGE — one short why/how it works (John analogy when it fits; ES↔EN bridge only if they asked for Spanish).
4) 1–2 MODEL sentences they can copy (spoken clearly; pause on paradigms).
5) CONFIRM — "Does that make sense?" / "Want to try one?"
6) ORAL PRACTICE — next turn they speak 1 sentence using the pattern; you live-evaluate; then resume free chat.
LENGTH: 4–8 complete sentences at calm John pace. Finish every sentence. Never cut mid-thought.
SCOPE: ANY English doubt — linkers, STAR, tenses, phrasals, recovery, tone, collocations, conditionals, reported speech, passive, idioms, pronunciation tips, class doubts.
Foundations MSI slots (P|M|V|C bundles) → one warm line pointing to Jill if they want the full Foundations track; still give a clear mini-answer here first if they asked.
FORBIDDEN: one-liner "tips"; walls of text; inventing non-John methods; dumping a written quiz.`;

function studentWantsSpanishExplanation(message) {
  const t = String(message || '');
  return /\b(explic[aá]me|explain in spanish|en espa[nñ]ol|no entiendo|no comprendo|don't understand|do not understand|what does .+ mean|qu[eé] significa|c[oó]mo se dice|traduc|translate|dime en espa[nñ]ol|in spanish please|habl[aá]me en espa[nñ]ol)\b/i.test(t);
}

function isEnglishDoubtRequest(message) {
  const t = String(message || '');
  if (!t.trim()) return false;
  const ask = /\b(explain|teach me|ens[eé][aá]me|explic[aá]me|no entiendo|no me qued[oó]|don't understand|do not understand|how do i|how to (use|say|form|make)|c[oó]mo se (usa|dice|forma|hace)|what (is|are|does|do)|help me (understand|with)|can you (explain|help|teach)|en clase|hoy (en clase |vimos |nos ense[nñ])|me ense[nñ]aron|no me qued[oó] claro|ayudame (a )?entender|pod[eé]s ayudarme|podes ayudarme|duda|confund|stuck|not sure how|show me how|walk me through|break( it)? down)\b/i.test(t);
  const topic = /\b(gramm|gerund|tense|linker|connectors?|star (method|structure)|phrasal|prepos|modals?|conditionals?|present perfect|past perfect|future perfect|reported speech|passive voice|collocation|idiom|recovery phrase|idea\s*\+?\s*linker|nexus|however|on top of that|even though)\b/i.test(t);
  return ask || (topic && /\b(no |don'?t |how |what |qu[eé] |c[oó]mo |explain|ense|entend|help|duda|teach|show)/i.test(t));
}

function isClarityReply(message) {
  const t = String(message || '').trim().toLowerCase();
  if (!t || t.length > 80) return false;
  return /^(s[ií]|sip|claro|ok|okay|dale|listo|ya|entend[ií]|me qued[oó]|no|nop|todav[ií]a no|casi|more or less|m[aá]s o menos|un poco|yes|yeah|yep|got it|makes sense|not really|still confused)([.!?\s]|$)/i.test(t)
    || /\b(me qued[oó] claro|ya entend[ií]|todav[ií]a no|no del todo|explicalo otra vez|otra vez|makes sense|got it|still (confused|lost)|not really)\b/i.test(t);
}

/** Broken English / weak structure heuristics for live coaching. */
function looksLikeBrokenEnglish(message) {
  const t = String(message || '').trim();
  if (t.length < 4) return false;
  const enWords = (t.match(/\b[a-zA-Z']+\b/g) || []).length;
  if (enWords < 2) return false;
  const lower = t.toLowerCase();
  const broken = [
    /\b(i|you|he|she|we|they)\s+(going|doing|working|eating|studying|watching)\b/i,
    /\bi\s+is\b|\byou\s+is\b|\bhe\s+are\b|\bshe\s+are\b|\bthey\s+is\b/i,
    /\b(yesterday|last\s+\w+)\s+i\s+(go|see|eat|work|do|have|make)\b/i,
    /\b(me|him|her)\s+(is|are|go|want|like)\b/i,
    /\bwant\s+go\b|\blike\s+go\b|\bneed\s+go\b/i,
    /\bi\s+have\s+\w+\s+yesterday\b/i
  ];
  if (broken.some((re) => re.test(lower))) return true;
  // Very short / fragmented when they were clearly trying a full answer
  if (enWords <= 3 && !/[.!?]$/.test(t) && /\b(i|my|the|a)\b/i.test(lower)) return true;
  // Missing linkers when answer is long and choppy (multiple short clauses without connectors)
  if (enWords >= 12 && !/\b(however|because|so|then|and|but|although|therefore|on top of that|even though)\b/i.test(lower)) {
    const clauses = t.split(/[,;]+/).filter((c) => c.trim().length > 8);
    if (clauses.length >= 3) return true;
  }
  return false;
}

const ALICE_COMPANION_LIVE_COACH = `LIVE COACH (REQUIRED — any topic, even complex):
${ALICE_JOHN_STYLE}
${ALICE_COMPANION_INTENT_RULE}
Talk with real sense: follow their thread, react, go deeper. Never ignore content.

If they have a DOUBT OR produce poorly structured English:
1) PAUSE the free-chat flow (warm, never scolding).
2) FEEDBACK: one clear line on what broke (structure, linker, tense, clarity).
3) EXPLAIN with the mini-lesson checklist (pattern → bridge → examples → confirm) — not a one-liner tip.
4) EXAMPLE: 1–2 strong model sentences they can copy (spoken clearly; pause between forms if A/B/C).
5) CONFIRM: "Does that make sense?" / "Try it again?" — they SPEAK; do not dump written drill paragraphs.
6) CONTINUE: if yes → they produce; if no → re-explain simpler + new example; then resume the topic.

VISUAL-FIRST TEACHING: less text, more interaction. No vulgar walls of explanation. No fake "exercise" text blocks.
Real-time evaluation every turn they speak English:
- If solid: brief confirm + continue the conversation meaningfully.
- If weak: run steps 1-6 — do NOT steamroll past the error.

Complex topics (science, work, politics, feelings, stories): fully welcome.
No Nexus drill sheets, no Nexora roleplay. If they want full simulation → one warm line to Nexora Lab.`;

const ALICE_COMPANION_DOUBT_MODE = `ON-DEMAND DOUBT → FULL MINI-LESSON (not a tip):
${ALICE_COMPANION_TEACH_CANON}
Flow: doubt → name topic → pattern → bridge → 1–2 examples → "Does that make sense?" → they speak one sentence → live-evaluate → back to free chat.
Any English topic they ask about. Prefer pattern + example over long prose. Never invent non-John methods.
You are companion+coach, not a curriculum tutor — no forced modules, no turn quotas.`;

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
    const topicHit = t.match(/\b(linker|connectors?|however|star|phrasal|gerund|present perfect|past perfect|future perfect|conditionals?|modals?|prepos|recovery|idiom|collocation|reported speech|passive|nexus|idea\s*\+?\s*linker)\b/i);
    if (topicHit) return `doubt:${topicHit[1].toLowerCase().replace(/\s+/g, '_')}`;
    return 'doubt:english';
  }
  const patterns = [
    { re: /\b(horror|scary|scare[ds]?|ghost|haunted|creepy|thriller|nightmare|monster|zombie|vampire|terror|miedo|espanto|aparecido|fantasma|bruj[ao]|leyenda\s+urbana|cuento\s+de\s+miedo|historia\s+de\s+terror)\b/i, topic: 'horror' },
    { re: /\b(mystery|detective|crime|asesinato|misterio|suspense|whodunit)\b/i, topic: 'mystery' },
    { re: /\b(adventure|quest|explore|jungle|pirate|aventura|explor)\b/i, topic: 'adventure' },
    { re: /\b(romance|love\s+story|dating|crush|romance|enamor)\b/i, topic: 'romance' },
    { re: /\b(history|historical|war|century|ancient|empire|revolution|story|stories|tale|legend|cuento|historias?|narrat|fábula|fabula)\b/i, topic: 'stories' },
    { re: /\b(science|space|nasa|planet|physics|chemistry|biology|discovery|ciencia|espacio)\b/i, topic: 'science' },
    { re: /\b(work|job|career|office|customer|call center|interview|trabajo|oficina)\b/i, topic: 'work' },
    { re: /\b(family|kids|children|parents|home|friends|familia|hijos|amigos)\b/i, topic: 'family' },
    { re: /\b(travel|trip|vacation|country|city|flight|viaje|viajar|vacaciones)\b/i, topic: 'travel' },
    { re: /\b(sport|football|soccer|gym|exercise|fitness|deporte|fútbol|futbol)\b/i, topic: 'sports' },
    { re: /\b(movie|film|music|book|series|netflix|song|pel[ií]cula|música|musica|libro)\b/i, topic: 'entertainment' },
    { re: /\b(fashion|style|clothes|outfit|shoes|makeup|brand|moda|ropa)\b/i, topic: 'fashion' },
    { re: /\b(food|recipe|cook|restaurant|coffee|dinner|comida|cocina|receta)\b/i, topic: 'food' },
    { re: /\b(love|feelings|mood|stress|life|sentimientos|estr[eé]s|vida)\b/i, topic: 'life' },
    { re: /\b(news|politics|world|economy|noticias|pol[ií]tica)\b/i, topic: 'world' },
    { re: /\b(tech|phone|app|ai|internet|game|gaming|tecnolog|juego)\b/i, topic: 'tech' }
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
    if (/make sense|qued[oó] claro|entendiste|clear\?|got it\?|try (it |that )?again/i.test(prevText)) {
      return 'doubt_practice';
    }
  }
  if (looksLikeBrokenEnglish(message)) return 'live_correct';
  const topic = resolveSessionTopic(history, '', message);
  if (String(topic).startsWith('doubt:')) return 'doubt_practice';
  // Default: free chat with live evaluate hint when they wrote substantial English
  const enWords = (String(message || '').match(/\b[a-zA-Z']+\b/g) || []).length;
  if (enWords >= 6) return 'live_evaluate';
  return 'free_chat';
}

function buildCompanionStreamTeachInstruction(topic, message, history) {
  const msg = String(message || '');
  const phase = resolveCompanionPhase(msg, history);
  const wantSpanish = studentWantsSpanishExplanation(msg);
  const doubtLabel = String(topic || '').replace(/^doubt:/, '') || 'their doubt';

  if (phase === 'doubt_explain') {
    const lang = wantSpanish
      ? 'Explain in Spanish (bilingual OK for English examples), then return to English for the oral check.'
      : 'Explain in English (clear, simple, complete).';
    return `DOUBT → FULL MINI-LESSON ("${doubtLabel}").
${ALICE_COMPANION_TEACH_CANON}
THIS TURN — complete the checklist:
1) Name the topic.
2) Pattern / formula in plain words.
3) Bridge / short why (John analogy if it fits).
4) 1–2 model sentences.
5) Confirm: "Does that make sense? Want to try one?"
${lang}
LENGTH: 4–8 complete sentences. Finish every sentence. Never cut mid-thought.
End the turn with a new line exactly: [[CTYPE:whiteboard]] when you taught Nexus (linkers, STAR, Idea+Linker+Idea, recovery) or a clear structure pattern.
No drill sheet, no Nexora roleplay, no forced curriculum.`;
  }

  if (phase === 'live_correct') {
    return `LIVE COACH — WEAK STRUCTURE detected.
PAUSE. Warm feedback on what broke → mini-lesson pattern (short) → one strong example → "Does that make sense? Try again."
Do NOT ignore the error. Then continue the topic. ${wantSpanish ? 'Spanish OK for the explanation.' : 'English by default.'}`;
  }

  if (phase === 'live_evaluate') {
    return `LIVE EVALUATE — they spoke English on "${topic || 'the topic'}".
If solid: short cool confirm (1 beat) + continue with real energy — keep the vibe alive.
If weak: pause → feedback → mini-lesson explain → example → confirm → they retry.
Stay in English unless they asked for Spanish explanation.
STORY turns: if the chat is a story, keep building atmosphere — don't flatten into a quiz.`;
  }

  if (phase === 'doubt_practice') {
    const negative = /\b(no|nop|todav[ií]a no|casi|m[aá]s o menos|un poco|no del todo|otra vez|not really|still (confused|lost)|don't get it)\b/i.test(msg);
    if (negative && isClarityReply(msg)) {
      return `RE-EXPLAIN simpler + new example (still follow mini-lesson checklist, shorter). Then check again. ${wantSpanish ? 'Spanish OK.' : 'English by default.'}`;
    }
    return `SHORT ORAL PRACTICE after mini-lesson ("${doubtLabel}"):
1) Ask them to produce ONE spoken sentence using the pattern you just taught.
2) Live-evaluate: solid → warm confirm + resume free chat on whatever they want; weak → coach arc (feedback → re-explain → new example → retry).
Do NOT start a new unrelated lesson. Stay on this pattern until they land one clean sentence.`;
  }

  if (wantSpanish) {
    return `TURN: They asked for explanation — run the mini-lesson in Spanish (bilingual OK), then return to English chat.`;
  }

  return `FREE CHAT on "${topic || 'anything'}" — even complex topics. English ONLY.
VOICE: cool, natural, expressive — like a sharp friend in their ear. Not flat. Not textbook.
Listen, react with personality, one follow-up.
STORY MODE (horror / mystery / adventure / tales): if they want a story or are in one — tell it FULLY with atmosphere, tension, detail. Finish the beat. Longer replies OK.
Normal chat: lively 3–7 sentences. No mini-lesson unless they ask or break structure.
If doubt or broken structure appears: PAUSE → full mini-lesson (pattern → bridge → examples → confirm) → oral try → continue.`;
}

/** Lean system extras for fast companion turns — keep cool vibe, skip Super Brain. */
const ALICE_COMPANION_FAST_VOICE = `VOICE & VIBE:
- Cool, natural, expressive English — sharp friend in their ear, NEVER flat chatbot or dry ESL.
- Real reactions, vivid words, light humor when it fits. Complete every sentence.
- STORY MODE (horror, mystery, adventure, stories, romance, entertainment): build atmosphere — scene, tension, detail. Tell the beat fully. Longer is OK.
- Normal chat: lively 3–7 sentences + one follow-up.
- Mini-lesson ONLY if they ask or structure breaks.
${ALICE_COMPANION_INTENT_RULE}`;

function isCompanionStoryTopic(topic) {
  return /^(horror|mystery|adventure|stories|romance|entertainment)\b/i.test(String(topic || '').trim());
}

function companionFastMaxTokens(topic) {
  return isCompanionStoryTopic(topic) ? 900 : 560;
}

function buildCompanionFastMethodBlock(topic) {
  return `COMPANION FAST CHAT — topic "${topic || 'open'}".
${ALICE_COMPANION_FAST_VOICE}
React with cool energy. Stay on the topic. If story mode — tell it, don't summarize it away.`;
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
      ? `ACTIVE DOUBT: "${String(topic).replace(/^doubt:/, '')}" — run FULL mini-lesson (name → pattern → bridge → examples → confirm → oral practice → back to chat).`
      : `ACTIVE TOPIC: "${topic}" — converse with real sense; if doubt or structure breaks, run the mini-lesson arc.`)
    : 'They choose any topic (simple or complex) OR bring any English doubt for a full mini-lesson.';
  const seeds = cfg.topicSeeds ? `Trainer soft hints (only if natural): ${cfg.topicSeeds}.` : '';
  const focusBlock = buildFocusKpiCoachLines(cfg.focusKpis);

  return `COMPANION + LIVE COACH — always-on English practice companion
${ALICE_JOHN_STYLE}
${topicLine}
${seeds}

WHO YOU ARE:
- A voice companion: chat, listen, guide, educate, show genuine interest.
- ANY topic is welcome — daily life, science, work, feelings, stories — no limits.
- Friend who also teaches English on demand: when they ask, you give a COMPLETE mini-lesson (not a tip), then a short oral try, then back to chat.

HOW YOU BEHAVE:
- LISTEN first. React with real interest. Follow their lead on complex topics.
- Opening: free chat OR a class/English doubt — if doubt, teach it fully.
- NEVER cut off mid-sentence. No turn caps.
- Do NOT force Nexus drill sheets or Nexora roleplay.
${ALICE_COMPANION_LIVE_COACH}
${ALICE_COMPANION_DOUBT_MODE}
- Soft growth focus (invisible unless correcting):
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
  ALICE_JOHN_STYLE,
  ALICE_COMPANION_INTENT_RULE,
  ALICE_COMPANION_TEACH_CANON,
  looksLikeBrokenEnglish,
  ALICE_COMPANION_LIVE_COACH,
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
