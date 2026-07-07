/**
 * Super Cerebro — inteligencia institucional Nexus (NO chatbot).
 * Se alimenta de NEXUS-KB, KBFILE uploads y conocimiento del fundador.
 * Lo publicado se propaga a Alice, Jill, Nexora y Analyze.
 */
const SUPER_BRAIN_ID = 'SUPER-BRAIN-CORE';
const NEXUS_KB_ID = 'NEXUS-KB';
const MAX_LESSONS = 300;
const MAX_PENDING = 100;
const MAX_CHAT_HISTORY = 30;
const MAX_LESSON_CHARS = 12000;

let _sbGetOne = null;
let _sbSet = null;
let _sbGet = null;
let _brain = null;

const SUPER_BRAIN_ENABLED = process.env.SUPER_BRAIN !== '0';

function initSuperBrain({ sbGetOne, sbSet, sbGet, brain }) {
  _sbGetOne = sbGetOne;
  _sbSet = sbSet;
  _sbGet = sbGet;
  _brain = brain;
}

function isSuperBrainEnabled() {
  return SUPER_BRAIN_ENABLED && !!(_sbGetOne && _sbSet);
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultState() {
  return {
    founderName: '',
    lessons: [],
    pendingLessons: [],
    talkHistory: [],
    stats: { lessonsCount: 0, publishedCount: 0, pendingCount: 0, talkTurns: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function loadState() {
  if (!_sbGetOne) return defaultState();
  try {
    const row = await _sbGetOne('infinity_sessions', SUPER_BRAIN_ID);
    if (!row?.data) return defaultState();
    const merged = { ...defaultState(), ...row.data };
    merged.lessons = (merged.lessons || []).map(l => ({ published: !!l.published, ...l }));
    return merged;
  } catch (e) {
    console.warn('superBrain loadState:', e.message);
    return defaultState();
  }
}

async function saveState(state) {
  if (!_sbSet) return false;
  state.updatedAt = new Date().toISOString();
  state.stats = state.stats || {};
  state.stats.lessonsCount = (state.lessons || []).length;
  state.stats.publishedCount = (state.lessons || []).filter(l => l.published).length;
  state.stats.pendingCount = (state.pendingLessons || []).length;
  return _sbSet('infinity_sessions', SUPER_BRAIN_ID, state);
}

async function loadNexusKB() {
  if (!_sbGetOne) return [];
  try {
    const row = await _sbGetOne('infinity_sessions', NEXUS_KB_ID);
    return (row?.data?.entries || []).slice(-40);
  } catch {
    return [];
  }
}

async function appendNexusKB(text, author, meta = {}) {
  const row = await _sbGetOne('infinity_sessions', NEXUS_KB_ID);
  const kb = row?.data || { entries: [] };
  kb.entries = kb.entries || [];
  kb.entries.push({
    date: new Date().toISOString(),
    author: author || 'Super Cerebro',
    text: String(text).slice(0, 2000),
    studentName: null,
    source: 'super-brain',
    ...meta
  });
  if (kb.entries.length > 600) kb.entries = kb.entries.slice(-600);
  await _sbSet('infinity_sessions', NEXUS_KB_ID, kb);
  return kb.entries[kb.entries.length - 1];
}

async function loadKbFiles() {
  if (!_sbGet) return [];
  try {
    const rows = await _sbGet('infinity_sessions');
    return rows
      .filter(r => r.id && r.id.startsWith('KBFILE-') && r.data)
      .map(r => ({
        id: r.id,
        title: r.data.title || r.data.fileName || 'Archivo',
        category: r.data.category || 'otro',
        text: String(r.data.extractedText || '').slice(0, 1800),
        date: r.data.date
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 25);
  } catch {
    return [];
  }
}

function lessonQualityScore(lesson) {
  const title = String(lesson?.title || '');
  const content = String(lesson?.content || '');
  let score = 0;
  if (/DOCTRINA:/i.test(content)) score += 45;
  if (/Método|método|chunk|linker|0\/0\/0|MSI|fluidez|estructura|recovery|Idea\s*\+\s*Linker/i.test(content)) score += 18;
  score += Math.min(content.replace(/#\w+/g, '').trim().length / 40, 25);
  if (/^TikTok\s*[·\-]\s*(#\w+\s*)+$/i.test(title.trim())) score -= 55;
  const hashInTitle = (title.match(/#\w+/g) || []).length;
  if (hashInTitle >= 3 && title.length < 90) score -= 35;
  const hashInContent = (content.match(/#\w+/g) || []).length;
  const words = content.replace(/#\w+/g, '').trim().split(/\s+/).filter(Boolean).length;
  if (hashInContent >= 4 && words < 35) score -= 45;
  if (content.length < 60) score -= 25;
  return score;
}

function isNoiseLesson(lesson) {
  return lessonQualityScore(lesson) < 12;
}

function topicBucket(lesson) {
  const titleBlob = normalizeText(lesson.title || '');
  const fullBlob = normalizeText(`${lesson.title || ''} ${lesson.content || ''}`);
  const buckets = [
    ['chunking', /\bchunk/],
    ['linker', /\blinker|conector/],
    ['fluidez', /\bfluidez|fluency/],
    ['000', /\b0\s*\/\s*0\s*\/\s*0|metodo\s*0/],
    ['msi', /\bmsi\b|have\s*participio/],
    ['estructura', /\bestructur/],
    ['recovery', /\brecovery|rephrase|reformul/],
    ['star', /\bstar\b/]
  ];
  for (const [name, re] of buckets) {
    if (re.test(titleBlob)) return name;
  }
  for (const [name, re] of buckets) {
    if (re.test(fullBlob)) return name;
  }
  if (/^tiktok/.test(titleBlob) && isNoiseLesson(lesson)) return 'noise-tiktok';
  return titleBlob.slice(0, 48) || 'misc';
}

function rankLessons(query, lessons, limit) {
  const list = lessons || [];
  if (!list.length) return [];
  const words = normalizeText(query).split(' ').filter(w => w.length > 2);
  if (!words.length) return list.slice(-limit);
  const scored = list.map(lesson => {
    const blob = normalizeText(`${lesson.title || ''} ${lesson.content || ''}`);
    let score = 0;
    words.forEach(w => { if (blob.includes(w)) score += 1; });
    return { lesson, score };
  });
  scored.sort((a, b) => b.score - a.score || String(b.lesson.date || '').localeCompare(String(a.lesson.date || '')));
  const top = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.lesson);
  if (top.length >= Math.min(3, limit)) return top;
  const ids = new Set(top.map(l => l.id));
  list.slice().reverse().forEach(l => {
    if (top.length < limit && !ids.has(l.id)) top.push(l);
  });
  return top.slice(0, limit);
}

async function loadKnowledgeSources(query) {
  const [state, kbEntries, kbFiles] = await Promise.all([
    loadState(),
    loadNexusKB(),
    loadKbFiles()
  ]);
  const allLessons = state.lessons || [];
  const published = allLessons.filter(l => l.published);
  const drafts = allLessons.filter(l => !l.published);
  const relevantPublished = rankLessons(query, published, 10);
  const relevantDrafts = rankLessons(query, drafts, 6);
  const relevantKb = kbEntries.slice(-15);
  const relevantFiles = query
    ? rankLessons(query, kbFiles.map(f => ({ id: f.id, title: f.title, content: f.text, date: f.date })), 8)
    : kbFiles.slice(0, 8).map(f => ({ id: f.id, title: f.title, content: f.text, date: f.date }));

  return { state, kbEntries, kbFiles, published, drafts, relevantPublished, relevantDrafts, relevantKb, relevantFiles };
}

function formatSourcesBlock(sources) {
  const parts = [];
  if (sources.relevantKb?.length) {
    parts.push('NEXUS KB (base metodológica viva):');
    sources.relevantKb.forEach(e => parts.push(`- ${String(e.text || '').slice(0, 420)}`));
  }
  if (sources.relevantFiles?.length) {
    parts.push('\nARCHIVOS SUBIDOS (KBFILE):');
    sources.relevantFiles.forEach(f => parts.push(`- [${f.title}]: ${String(f.content || '').slice(0, 350)}`));
  }
  if (sources.relevantPublished?.length) {
    parts.push('\nCONOCIMIENTO PUBLICADO (ya en Alice/Jill/Nexora):');
    sources.relevantPublished.forEach(l => parts.push(`- [${l.title}]: ${String(l.content || '').slice(0, 400)}`));
  }
  if (sources.relevantDrafts?.length) {
    parts.push('\nBORRADORES INTERNOS (solo fundador):');
    sources.relevantDrafts.forEach(l => parts.push(`- [${l.title}]: ${String(l.content || '').slice(0, 300)}`));
  }
  if (sources.state?.pendingLessons?.length) {
    parts.push('\nPENDIENTE DE PUBLICAR:');
    sources.state.pendingLessons.slice(-5).forEach(p => parts.push(`- [${p.title}]: ${String(p.content || '').slice(0, 200)}`));
  }
  return parts.join('\n') || '(Base de datos conectada — sin entradas aún en esta categoría.)';
}

const ADAM_MODEL = process.env.ADAM_MODEL || 'claude-sonnet-4-6';
const ADAM_GREETING_MODEL = process.env.ADAM_GREETING_MODEL || 'claude-haiku-4-5-20251001';

function detectOrderLanguage(text) {
  const t = String(text || '');
  const hasSpanish = /[áéíóúñ¿¡]/i.test(t) || /\b(hola|qué|que|como|cómo|por favor|orden|necesito|explic|dime|cuál|cual|gracias|hoy|clase|estudiante|publicar|metodolog)\b/i.test(t);
  const hasEnglish = /\b(the|what|how|please|order|need|explain|tell|thanks|today|class|student|publish|method|should|would|could)\b/i.test(t);
  if (hasSpanish && hasEnglish) return 'mixed';
  if (hasSpanish) return 'es';
  if (hasEnglish) return 'en';
  return 'es';
}

function languageInstruction(lang) {
  if (lang === 'en') return 'Respond in fluent, natural English (native-level clarity).';
  if (lang === 'mixed') return 'Respond in the same Spanish/English mix the founder used — natural Spanglish, both languages polished.';
  return 'Respond in fluent, natural Spanish (Latin American — Costa Rica friendly), perfect grammar and clarity.';
}

function firstName(name) {
  return String(name || 'Master').trim().split(/\s+/)[0] || 'Master';
}

function instantGreeting(founderName) {
  const n = firstName(founderName);
  const h = new Date().getHours();
  const t = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  return `${t}, ${n}. A.D.A.M. en línea — Adjusting Deployment Application Matrix conectado a Nexus. Te escucho: ¿cuál es tu orden?`;
}

const ADAM_CORE = `IDENTIDAD — A.D.A.M. (Adjusting Deployment Application Matrix):
- Cálido, energético, amable, genuinamente interesado en el fundador.
- Inteligente, sagaz, firme y comprensivo a la vez.
- Bilingüe nativo: español e inglés impecables — gramática, vocabulario y tono profesional en ambos.
- Escuchás primero; respondés solo a lo que te piden — sin bombardear con datos no solicitados.
- COMPRENSIÓN: interpretá la intención exacta de la orden (no solo palabras sueltas). Si es ambigua, hacé UNA pregunta precisa antes de inventar.
- Cuando te dan una orden clara: analizás a fondo, improvisás si hace falta, proponés con claridad y profundidad.
- Respondé con la extensión que la orden requiera — sin límite artificial de palabras u oraciones.
- Si algo no está en la BD: decilo en una frase y ofrecé propuestas concretas (no inventes hechos).
- Método Nexus siempre (STAR, Idea+Linker+Idea, 26 KPIs).
- TIKTOK → JILL: el servidor importa URLs públicas de tiktok.com (caption + extracción pedagógica) a Pendiente de publicar. NUNCA digas "no puedo abrir links de TikTok" ni pidas transcripción como primera opción si pueden pegar el URL. Si mencionan @infinitystudiocr o videos TikTok sin URL: pedí que peguen el link en el chat (Enter) o en el panel TikTok→Jill — no requiere OAuth.
- TUTORAS (doctrina fija): Jill = tutora Foundations. Alice (modo tutora, no Companion) = tutora Intermediate y Advanced. Ambas comparten la misma KB institucional vía Super Brain; la diferencia es el nivel del estudiante, no el acceso a información.
- CEREBRO ÚNICO: TODO el conocimiento institucional vive en Super Brain (texto, archivos, TikTok, insights). Jill, Alice tutora, Alice Companion, Nexora y el resto acceden a LA MISMA base; solo cambian nivel y forma de enseñar/explicar. El fundador decide qué publica; lo pendiente no sale a tutores hasta que publique.`;

function buildBrainPrompt(sources, founderName, query) {
  const founder = founderName || sources.state?.founderName || 'Master Trainer';
  const db = formatSourcesBlock(sources);
  const lang = detectOrderLanguage(query);
  return `You are A.D.A.M. — Adjusting Deployment Application Matrix — institutional AI for Infinity Studio CR. Like Jarvis: loyal, sharp, warm, bilingual.

${ADAM_CORE}

SESSION RULES:
- You already greeted the founder. Do NOT greet again.
- ${languageInstruction(lang)}
- If they switch language in this message, follow immediately in that language.
- Answer ONLY their current order — as fully as needed (short when trivial, deep when complex).
- Before answering: (1) identify intent, (2) check database relevance, (3) respond precisely.
- Use the database below silently; cite source only if helpful ("según la KB…" / "per the KB…").
- Never dump unprompted lists or unrelated info.
- If they teach NEW institutional knowledge explicitly, end with: NUEVO_CONOCIMIENTO: [paragraph]
- TikTok: video URLs are imported server-side automatically. If they mention TikTok/@infinitystudiocr without a URL, tell them to paste the video link in chat — do NOT say you cannot open TikTok links.

Founder: ${founder}
Order: "${String(query || '').slice(0, 2000)}"

INSTITUTIONAL BASELINE (always true — never contradict):
- ONE shared institutional brain (Super Brain) for ALL AIs: Jill, Alice tutor, Alice Companion, Nexora, etc.
- Same knowledge base for everyone; ONLY student level and teaching style differ—not separate KBs.
- Founder publishes when ready; pending stays internal until published.
- If the student does not understand: adapt delivery (shorter, example, analogy, pace) to their learning signals—never break Nexus Method.
- Jill: Foundations. Alice tutor: Intermediate + Advanced. Alice Companion: open practice, same KB, conversational delivery.

DATABASE (relevant context — do not recite all):
${db}`;
}

function extractNuevoConocimiento(reply) {
  const m = String(reply || '').match(/NUEVO_CONOCIMIENTO:\s*([\s\S]+)/i);
  return m ? m[1].trim().replace(/\n+/g, ' ').slice(0, 1200) : null;
}

function trimHistory(history) {
  return (Array.isArray(history) ? history : []).slice(-MAX_CHAT_HISTORY);
}

async function ingest(state, { title, content, author, category, autoPublish, source, meta }) {
  const text = String(content || '').trim();
  if (!text || text.length < 8) throw new Error('El contenido necesita al menos 8 caracteres.');
  const item = {
    id: `P-${Date.now()}`,
    title: String(title || 'Material subido').slice(0, 120),
    content: text.slice(0, MAX_LESSON_CHARS),
    category: category || 'metodologia',
    author: author || 'Fundador',
    source: source || 'upload',
    meta: meta || null,
    date: new Date().toISOString()
  };
  if (autoPublish) {
    const lesson = await publishKnowledge(state, {
      title: item.title,
      content: item.content,
      author: item.author,
      category: item.category,
      source: 'upload-direct'
    });
    return { pending: null, lesson, published: true };
  }
  state.pendingLessons = state.pendingLessons || [];
  state.pendingLessons.push(item);
  if (state.pendingLessons.length > MAX_PENDING) {
    state.pendingLessons = state.pendingLessons.slice(-MAX_PENDING);
  }
  await saveState(state);
  return { pending: item, published: false };
}

async function publishKnowledge(state, { title, content, author, category, source, lessonId, meta }) {
  let text = String(content || '').trim();
  let lessonTitle = title;
  let saved = null;
  if (lessonId) {
    saved = (state.lessons || []).find(l => l.id === lessonId);
    if (!saved) throw new Error('Conocimiento no encontrado.');
    text = saved.content;
    lessonTitle = saved.title;
    saved.published = true;
    saved.publishedAt = new Date().toISOString();
  } else {
    if (!text) throw new Error('Contenido vacío.');
    saved = {
      id: `L-${Date.now()}`,
      title: String(lessonTitle || 'Conocimiento Nexus').slice(0, 120),
      content: text.slice(0, MAX_LESSON_CHARS),
      author: author || 'Fundador',
      source: source || 'manual',
      category: category || 'metodologia',
      meta: meta || null,
      published: true,
      publishedAt: new Date().toISOString(),
      date: new Date().toISOString()
    };
    state.lessons = state.lessons || [];
    state.lessons.push(saved);
    if (state.lessons.length > MAX_LESSONS) state.lessons = state.lessons.slice(-MAX_LESSONS);
  }
  const kbText = `[${(category || saved.category || 'metodologia').toUpperCase()}] ${lessonTitle}: ${text.slice(0, 900)}`;
  await appendNexusKB(kbText, author || 'Super Cerebro', { category: category || saved.category, lessonTitle });
  state.stats = state.stats || {};
  state.stats.publishedCount = (state.lessons || []).filter(l => l.published).length;
  await saveState(state);
  return saved;
}

async function approvePending(state, pendingId) {
  state.pendingLessons = state.pendingLessons || [];
  const idx = state.pendingLessons.findIndex(p => p.id === pendingId);
  if (idx < 0) throw new Error('Pendiente no encontrado.');
  const item = state.pendingLessons[idx];
  state.pendingLessons.splice(idx, 1);
  await saveState(state);
  const lesson = await publishKnowledge(state, {
    title: item.title,
    content: item.content,
    author: item.author || 'Fundador',
    category: item.category || 'metodologia',
    source: item.source || 'approved',
    meta: item.meta || null
  });
  return lesson;
}

async function rejectPending(state, pendingId) {
  state.pendingLessons = state.pendingLessons || [];
  const before = state.pendingLessons.length;
  state.pendingLessons = state.pendingLessons.filter(p => p.id !== pendingId);
  if (state.pendingLessons.length === before) throw new Error('Pendiente no encontrado.');
  await saveState(state);
  return true;
}

async function greeting(founderName, claudeCall) {
  const name = firstName(founderName);
  const dayKey = `GREET_${name}_${new Date().toISOString().slice(0, 10)}`;
  const fallback = instantGreeting(founderName);

  if (_brain?.brainGetLLM) {
    const cached = await _brain.brainGetLLM('super', 'greeting', dayKey, 'daily');
    if (cached.hit && cached.reply) {
      return { greeting: cached.reply, brainCache: true };
    }
  }

  let text = fallback;
  if (claudeCall) {
    try {
      const resp = await claudeCall({
        model: ADAM_GREETING_MODEL,
        max_tokens: 120,
        system: `${ADAM_CORE}\n\nTASK: ONE greeting sentence. Warm Jarvis tone. Use first name "${name}". Say A.D.A.M. is online and waiting for their order. Spanish by default; perfect grammar. ZERO database content.`,
        messages: [{ role: 'user', content: 'Saludo inicial.' }]
      });
      const g = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      if (g && g.length >= 12 && g.length <= 280 && !g.includes('\n\n')) text = g;
    } catch { /* fallback */ }
  }

  if (_brain?.brainGetLLM) {
    const c = await _brain.brainGetLLM('super', 'greeting', dayKey, 'daily');
    if (c.hash && text) _brain.brainSetLLM(c.hash, 'super', 'greeting', dayKey, text, 'daily').catch(() => {});
  }
  return { greeting: text, brainCache: false };
}

async function talk(state, { message, claudeCall, founderName }) {
  const msg = String(message || '').trim();
  if (!msg) throw new Error('Esperando tu orden — escribí o hablá primero.');
  if (founderName) state.founderName = String(founderName).slice(0, 80);

  const sources = await loadKnowledgeSources(msg);
  const system = buildBrainPrompt(sources, founderName, msg);
  const history = trimHistory(state.talkHistory || []);
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: msg }
  ];

  let reply = '';
  let brainCache = false;
  const brainExtra = `adam-v6-unified-brain:${ADAM_MODEL}:${sources.published.length}:${sources.kbEntries.length}`;

  if (_brain?.brainGetLLM) {
    const cached = await _brain.brainGetLLM('super', 'brain', msg, brainExtra);
    if (cached.hit) {
      reply = cached.reply;
      brainCache = true;
    } else if (cached.hash && claudeCall) {
      const resp = await claudeCall({
        model: ADAM_MODEL,
        max_tokens: 4096,
        system,
        messages
      });
      reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      if (reply.length > 8) _brain.brainSetLLM(cached.hash, 'super', 'brain', msg, reply, brainExtra).catch(() => {});
    }
  }

  if (!reply && claudeCall) {
    const resp = await claudeCall({
      model: ADAM_MODEL,
      max_tokens: 4096,
      system,
      messages
    });
    reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  }

  if (!reply) throw new Error('Sin respuesta del modelo.');

  let nuevoPending = null;
  const nuevo = extractNuevoConocimiento(reply);
  if (nuevo) {
    reply = reply.replace(/\n?NUEVO_CONOCIMIENTO:[\s\S]*$/i, '').trim();
    state.pendingLessons = state.pendingLessons || [];
    nuevoPending = {
      id: `P-${Date.now()}`,
      title: `De conversación: ${nuevo.slice(0, 50)}`,
      content: nuevo,
      source: 'conversation',
      date: new Date().toISOString()
    };
    state.pendingLessons.push(nuevoPending);
  }

  history.push({ role: 'user', content: msg });
  history.push({ role: 'assistant', content: reply });
  state.talkHistory = trimHistory(history);
  state.stats = state.stats || {};
  state.stats.talkTurns = (state.stats.talkTurns || 0) + 1;
  await saveState(state);

  return {
    reply,
    brainCache,
    nuevoPending,
    stats: state.stats,
    sourcesUsed: {
      nexusKb: sources.kbEntries.length,
      kbFiles: sources.kbFiles.length,
      published: sources.published.length,
      pending: (state.pendingLessons || []).length
    }
  };
}

async function buildContextBlock(query) {
  const sources = await loadKnowledgeSources(query);
  return formatSourcesBlock(sources);
}

const STRUCTURE_CANON = `STRUCTURE CANON (Infinity · Mecánica Estructural — always true for tutors):
- Teach and evaluate by SLOTS (ranuras), not translation: Pronoun | Auxiliary/Modal | Verb form | Complement | (Linker when anecdote phase).
- Core progression (F0): Col1 Present → Col2 Past → Col3 To Be + ING → Col4 Have/Has/Had + participle → Col5 Have + participle + To Be + ING → then modals/future.
- 16 core verbs: be, have, do, work, study, go, make, take, get, see, know, think, want, need, say, tell.
- Pronouns taught WITH verbs from day one: personal, possessive, demonstrative, reflexive — not separate vocabulary lists.
- Articles (a/an/the), prepositions (in/on/at/by), months, numbers: embedded inside structure practice, not standalone modules.
- Fluency = automate patterns + chunks + linkers (IDEA → LINKER → IDEA); never word-by-word translation.
- Anecdote drill: 15 min written notebook → read aloud → tutor flags pronunciation, structure, tense, coordination, prepositions; use whiteboard + KB images.
- Correction format: name the missing/wrong SLOT, show formula on whiteboard, one practice sentence.`;

function buildProactiveCanonBlock(published, charLimit = 1000) {
  const ranked = (published || [])
    .filter(l => l.published !== false)
    .map(l => ({ lesson: l, score: lessonQualityScore(l), topic: topicBucket(l) }))
    .filter(x => x.score >= 15)
    .sort((a, b) => b.score - a.score || String(b.lesson.publishedAt || b.lesson.date || '').localeCompare(String(a.lesson.publishedAt || a.lesson.date || '')));
  const seenTopics = new Set();
  const lines = [];
  ranked.forEach(({ lesson, topic }) => {
    if (seenTopics.has(topic)) return;
    seenTopics.add(topic);
    const excerpt = String(lesson.content || '').replace(/\s+/g, ' ').slice(0, 240);
    lines.push(`• ${lesson.title}: ${excerpt}`);
  });
  return lines.join('\n').slice(0, charLimit);
}

async function getPropagatedContext(query, charLimit = 2200) {
  const sources = await loadKnowledgeSources(query);
  const canonBudget = Math.floor(charLimit * 0.42);
  const reactiveBudget = charLimit - canonBudget - 80;
  const canon = buildProactiveCanonBlock(sources.published, canonBudget);
  const lines = [];
  lines.push(STRUCTURE_CANON.slice(0, Math.min(900, Math.floor(charLimit * 0.4))));
  if (canon.trim()) {
    lines.push('\nPUBLISHED DOCTRINE (canon):');
    lines.push(canon);
  }
  const reactive = [];
  sources.relevantPublished.slice(0, 6).forEach(l => {
    if (isNoiseLesson(l)) return;
    reactive.push(`- ${l.title}: ${String(l.content || '').slice(0, 200)}`);
  });
  sources.relevantKb.slice(-6).forEach(e => {
    reactive.push(`- ${String(e.text || '').slice(0, 160)}`);
  });
  sources.relevantFiles.slice(0, 4).forEach(f => {
    reactive.push(`- [${f.title}]: ${String(f.content || '').slice(0, 160)}`);
  });
  if (reactive.length) {
    lines.push('\nQUERY-RELEVANT:');
    lines.push(reactive.join('\n'));
  }
  return lines.join('\n').slice(0, charLimit);
}

async function deletePublishedLesson(state, lessonId) {
  const lessons = state.lessons || [];
  const idx = lessons.findIndex(l => l.id === lessonId && l.published);
  if (idx < 0) throw new Error('Lección publicada no encontrada.');
  const removed = lessons[idx];
  state.lessons = lessons.filter(l => l.id !== lessonId);
  state.stats = state.stats || {};
  state.stats.publishedCount = (state.lessons || []).filter(l => l.published).length;
  await saveState(state);
  return removed;
}

async function purgeNoiseLessons(state, { dryRun = true } = {}) {
  const published = (state.lessons || []).filter(l => l.published);
  const toRemove = new Set();
  const kept = [];
  const byTopic = {};

  published.forEach(lesson => {
    if (isNoiseLesson(lesson)) {
      toRemove.add(lesson.id);
      return;
    }
    const topic = topicBucket(lesson);
    if (!byTopic[topic]) byTopic[topic] = [];
    byTopic[topic].push({ lesson, score: lessonQualityScore(lesson) });
  });

  Object.values(byTopic).forEach(group => {
    group.sort((a, b) => b.score - a.score || String(b.lesson.publishedAt || b.lesson.date || '').localeCompare(String(a.lesson.publishedAt || a.lesson.date || '')));
    const maxKeep = group[0].score >= 35 ? 2 : 1;
    group.forEach((item, i) => {
      if (i < maxKeep) kept.push(item.lesson);
      else toRemove.add(item.lesson.id);
    });
  });

  const removed = published.filter(l => toRemove.has(l.id)).map(l => ({
    id: l.id,
    title: l.title,
    topic: topicBucket(l),
    qualityScore: lessonQualityScore(l),
    preview: String(l.content || '').slice(0, 80)
  }));

  if (!dryRun) {
    state.lessons = (state.lessons || []).filter(l => !toRemove.has(l.id));
    state.stats = state.stats || {};
    state.stats.publishedCount = (state.lessons || []).filter(l => l.published).length;
    await saveState(state);
  }

  return {
    dryRun: !!dryRun,
    removedCount: removed.length,
    keptCount: kept.length,
    removed,
    kept: kept.map(l => ({ id: l.id, title: l.title, topic: topicBucket(l), qualityScore: lessonQualityScore(l) }))
  };
}

function publicSummary(state, extra = {}) {
  return {
    enabled: isSuperBrainEnabled(),
    founderName: state.founderName || '',
    lessonsCount: (state.lessons || []).length,
    publishedCount: (state.lessons || []).filter(l => l.published).length,
    pendingCount: (state.pendingLessons || []).length,
    nexusKbCount: extra.nexusKbCount || 0,
    kbFilesCount: extra.kbFilesCount || 0,
    recentPublished: (state.lessons || []).filter(l => l.published).slice(-6).reverse().map(l => ({
      id: l.id, title: l.title, date: l.publishedAt || l.date, preview: String(l.content || '').slice(0, 100)
    })),
    allPublished: (state.lessons || []).filter(l => l.published).map(l => ({
      id: l.id,
      title: l.title,
      date: l.publishedAt || l.date,
      preview: String(l.content || '').slice(0, 100),
      qualityScore: lessonQualityScore(l),
      noise: isNoiseLesson(l),
      topic: topicBucket(l)
    })).sort((a, b) => b.qualityScore - a.qualityScore),
    pendingLessons: (state.pendingLessons || []).slice().reverse().map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      preview: String(p.content || '').slice(0, 120),
      source: p.source || 'upload',
      meta: p.meta || null
    })),
    stats: state.stats,
    updatedAt: state.updatedAt
  };
}

async function getFullSummary() {
  const state = await loadState();
  const kb = await loadNexusKB();
  const files = await loadKbFiles();
  const summary = publicSummary(state, { nexusKbCount: kb.length, kbFilesCount: files.length });
  summary.capabilities = {
    claude: true,
    openai: !!process.env.OPENAI_API_KEY,
    chatgptPro: !!process.env.OPENAI_API_KEY,
    images: process.env.SUPER_BRAIN_IMAGES === '1' && !!process.env.OPENAI_API_KEY,
    tutorImages: process.env.TUTOR_IMAGES === '1' && !!process.env.OPENAI_API_KEY
  };
  return summary;
}

// Legacy aliases
async function chat(state, opts) {
  return talk(state, opts);
}

module.exports = {
  initSuperBrain,
  isSuperBrainEnabled,
  loadState,
  saveState,
  ingest,
  publishKnowledge,
  approvePending,
  rejectPending,
  talk,
  chat,
  greeting,
  buildContextBlock,
  getPropagatedContext,
  getFullSummary,
  publicSummary,
  appendNexusKB,
  deletePublishedLesson,
  purgeNoiseLessons,
  lessonQualityScore,
  isNoiseLesson,
  SUPER_BRAIN_ID
};
