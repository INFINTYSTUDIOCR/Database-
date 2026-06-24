/**
 * Super Cerebro — entrenamiento personal del fundador.
 * Modos: alumno → asistente → colega.
 * Fases: auto-aprendizaje (APRENDÍ), ranking semántico ligero, contexto para analyze.
 */
const SUPER_BRAIN_ID = 'SUPER-BRAIN-CORE';
const NEXUS_KB_ID = 'NEXUS-KB';
const MODES = ['alumno', 'asistente', 'colega'];
const MAX_LESSONS = 200;
const MAX_CORRECTIONS = 500;
const MAX_PENDING = 80;
const MAX_CHAT_HISTORY = 40;
const MAX_LESSON_CHARS = 12000;

let _sbGetOne = null;
let _sbSet = null;
let _brain = null;

const SUPER_BRAIN_ENABLED = process.env.SUPER_BRAIN !== '0';

function initSuperBrain({ sbGetOne, sbSet, brain }) {
  _sbGetOne = sbGetOne;
  _sbSet = sbSet;
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
    mode: 'alumno',
    founderName: '',
    lessons: [],
    corrections: [],
    pendingLessons: [],
    chatHistory: [],
    stats: { lessonsCount: 0, correctionsCount: 0, chatTurns: 0, autoLearned: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function loadState() {
  if (!_sbGetOne) return defaultState();
  try {
    const row = await _sbGetOne('infinity_sessions', SUPER_BRAIN_ID);
    if (!row?.data) return defaultState();
    return { ...defaultState(), ...row.data };
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
  state.stats.correctionsCount = (state.corrections || []).length;
  state.stats.pendingCount = (state.pendingLessons || []).length;
  return _sbSet('infinity_sessions', SUPER_BRAIN_ID, state);
}

async function loadNexusKB() {
  if (!_sbGetOne) return [];
  try {
    const row = await _sbGetOne('infinity_sessions', NEXUS_KB_ID);
    return (row?.data?.entries || []).slice(-20);
  } catch {
    return [];
  }
}

function trimHistory(history) {
  return (Array.isArray(history) ? history : []).slice(-MAX_CHAT_HISTORY);
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
  scored.sort((a, b) => b.score - a.score || (b.lesson.date || '').localeCompare(a.lesson.date || ''));
  const top = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.lesson);
  if (top.length >= Math.min(3, limit)) return top;
  const ids = new Set(top.map(l => l.id));
  list.slice().reverse().forEach(l => {
    if (top.length < limit && !ids.has(l.id)) top.push(l);
  });
  return top.slice(0, limit);
}

function buildLessonsBlock(lessons, query) {
  const list = query ? rankLessons(query, lessons, 12) : (lessons || []).slice(-24);
  if (!list.length) return '(Todavía no hay clases registradas — el fundador las irá agregando.)';
  return list.map((l, i) => {
    const title = l.title || `Clase ${i + 1}`;
    const date = l.date ? l.date.slice(0, 10) : '';
    const tag = l.source === 'auto-aprendi' ? ' [auto]' : '';
    return `### ${title}${tag}${date ? ` (${date})` : ''}\n${String(l.content || '').slice(0, 2000)}`;
  }).join('\n\n');
}

function buildCorrectionsBlock(corrections) {
  const list = (corrections || []).slice(-16);
  if (!list.length) return '';
  return '\n\nCORRECCIONES DEL FUNDADOR (aprendé de estos ajustes):\n'
    + list.map(c => `- Cuando dijiste "${String(c.wrong || '').slice(0, 120)}" → correcto: "${String(c.right || '').slice(0, 120)}"${c.note ? ` (${c.note})` : ''}`).join('\n');
}

function buildKbBlock(entries) {
  if (!entries?.length) return '(KB metodológica vacía por ahora.)';
  return entries.map(e => `- ${String(e.text || '').slice(0, 400)}`).join('\n');
}

function buildSystemPrompt(mode, state, kbEntries, query) {
  const founder = state.founderName || 'el fundador de Infinity Studio CR';
  const lessons = buildLessonsBlock(state.lessons, query);
  const corrections = buildCorrectionsBlock(state.corrections);
  const kb = buildKbBlock(kbEntries);
  const base = `Sos el Super Cerebro de Infinity Studio CR — entrenado personalmente por ${founder}.
Método Nexus: STAR, Idea+Linker+Idea, 26 KPIs, comunicar > perfección.
Nunca contradigas la metodología Nexus. Respondé en español salvo que pidan inglés.

CLASES DEL FUNDADOR (memoria principal — priorizadas por relevancia):
${lessons}
${corrections}

CONTEXTO METODOLÓGICO (Nexus KB compartida):
${kb}`;

  if (mode === 'alumno') {
    return `${base}

MODO ALUMNO: Sos el estudiante del fundador. Escuchás con atención, hacés preguntas inteligentes (máx 2 por turno), repetís lo esencial para confirmar que entendiste, y admitís cuando no sabés algo. No des órdenes — aprendés. Al final de cada respuesta, si aprendiste algo nuevo, agregá una línea: APRENDÍ: [resumen de 1 oración].`;
  }
  if (mode === 'asistente') {
    return `${base}

MODO ASISTENTE: Sos el asistente personal del fundador. Ejecutás tareas, resumís, proponés borradores, recordás lo que te enseñó en las clases. Sé proactivo pero conciso. Priorizá acciones concretas.`;
  }
  return `${base}

MODO COLEGA: Sos colega senior del fundador — mismo nivel estratégico. Cuestioná ideas con respeto, proponé alternativas, co-diseñá soluciones. No seas obsecuente; aportá criterio propio basado en las clases y la KB.`;
}

function extractAprendi(reply) {
  const m = String(reply || '').match(/APREND[IÍ]:\s*(.+)/i);
  return m ? m[1].trim().slice(0, 500) : null;
}

async function addLesson(state, { title, content, author, source }) {
  const text = String(content || '').trim();
  if (!text || text.length < 8) throw new Error('La clase necesita al menos 8 caracteres.');
  const lesson = {
    id: `L-${Date.now()}`,
    title: String(title || 'Clase sin título').trim().slice(0, 120),
    content: text.slice(0, MAX_LESSON_CHARS),
    author: author || 'Fundador',
    source: source || 'manual',
    date: new Date().toISOString()
  };
  state.lessons = state.lessons || [];
  state.lessons.push(lesson);
  if (state.lessons.length > MAX_LESSONS) state.lessons = state.lessons.slice(-MAX_LESSONS);
  await saveState(state);
  return lesson;
}

async function addPendingLesson(state, { content, source, title }) {
  const text = String(content || '').trim();
  if (!text || text.length < 8) return null;
  state.pendingLessons = state.pendingLessons || [];
  const item = {
    id: `P-${Date.now()}`,
    title: String(title || 'Aprendizaje automático').slice(0, 120),
    content: text.slice(0, MAX_LESSON_CHARS),
    source: source || 'auto',
    date: new Date().toISOString()
  };
  state.pendingLessons.push(item);
  if (state.pendingLessons.length > MAX_PENDING) {
    state.pendingLessons = state.pendingLessons.slice(-MAX_PENDING);
  }
  await saveState(state);
  return item;
}

async function approvePending(state, pendingId) {
  state.pendingLessons = state.pendingLessons || [];
  const idx = state.pendingLessons.findIndex(p => p.id === pendingId);
  if (idx < 0) throw new Error('Pendiente no encontrado.');
  const item = state.pendingLessons[idx];
  state.pendingLessons.splice(idx, 1);
  const lesson = await addLesson(state, {
    title: item.title,
    content: item.content,
    author: 'Super Cerebro',
    source: item.source || 'approved-pending'
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

async function addCorrection(state, { wrong, right, note, lessonId }) {
  const w = String(wrong || '').trim();
  const r = String(right || '').trim();
  if (!w || !r) throw new Error('Corrección requiere respuesta incorrecta y correcta.');
  const correction = {
    id: `C-${Date.now()}`,
    wrong: w.slice(0, 500),
    right: r.slice(0, 500),
    note: String(note || '').slice(0, 300),
    lessonId: lessonId || null,
    date: new Date().toISOString()
  };
  state.corrections = state.corrections || [];
  state.corrections.push(correction);
  if (state.corrections.length > MAX_CORRECTIONS) {
    state.corrections = state.corrections.slice(-MAX_CORRECTIONS);
  }
  await saveState(state);
  return correction;
}

async function setMode(state, mode) {
  if (!MODES.includes(mode)) throw new Error(`Modo inválido. Usá: ${MODES.join(', ')}`);
  state.mode = mode;
  await saveState(state);
  return state.mode;
}

async function buildContextBlock(query, maxLessons) {
  const state = await loadState();
  const kb = await loadNexusKB();
  const lessons = buildLessonsBlock(state.lessons, query).slice(0, 6000);
  const kbText = buildKbBlock(kb).slice(0, 3000);
  return `SUPER CEREBRO DEL FUNDADOR (clases prioritarias):\n${lessons}\n\nNEXUS KB:\n${kbText}`;
}

async function chat(state, { message, claudeCall, founderName, autoApproveLearn }) {
  const msg = String(message || '').trim();
  if (!msg) throw new Error('Mensaje vacío.');
  if (founderName) state.founderName = String(founderName).slice(0, 80);

  const mode = state.mode || 'alumno';
  const kbEntries = await loadNexusKB();
  const system = buildSystemPrompt(mode, state, kbEntries, msg);

  const history = trimHistory(state.chatHistory || []);
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: msg }
  ];

  let reply = '';
  let brainCache = false;
  let autoLearned = null;
  const brainExtra = `${mode}:${state.lessons?.length || 0}:${state.corrections?.length || 0}`;

  if (_brain?.brainGetLLM) {
    const cached = await _brain.brainGetLLM('super', mode, msg, brainExtra);
    if (cached.hit) {
      reply = cached.reply;
      brainCache = true;
    } else if (cached.hash && claudeCall) {
      const resp = await claudeCall({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'colega' ? 700 : 550,
        system,
        messages
      });
      reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
      if (reply.length > 8) {
        _brain.brainSetLLM(cached.hash, 'super', mode, msg, reply, brainExtra).catch(() => {});
      }
    }
  }

  if (!reply && claudeCall) {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: mode === 'colega' ? 700 : 550,
      system,
      messages
    });
    reply = resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  }

  if (!reply) throw new Error('Sin respuesta del modelo.');

  const aprendi = extractAprendi(reply);
  if (aprendi && mode === 'alumno') {
    if (autoApproveLearn) {
      autoLearned = await addLesson(state, {
        title: `Auto: ${aprendi.slice(0, 60)}`,
        content: aprendi,
        author: 'Super Cerebro',
        source: 'auto-aprendi'
      });
      state.stats.autoLearned = (state.stats.autoLearned || 0) + 1;
    } else {
      autoLearned = await addPendingLesson(state, {
        title: `APRENDÍ: ${aprendi.slice(0, 50)}`,
        content: aprendi,
        source: 'auto-aprendi'
      });
    }
  }

  history.push({ role: 'user', content: msg });
  history.push({ role: 'assistant', content: reply });
  state.chatHistory = trimHistory(history);
  state.stats = state.stats || {};
  state.stats.chatTurns = (state.stats.chatTurns || 0) + 1;
  await saveState(state);

  return { reply, mode, brainCache, autoLearned, stats: state.stats };
}

function publicSummary(state) {
  return {
    enabled: isSuperBrainEnabled(),
    mode: state.mode,
    founderName: state.founderName || '',
    lessonsCount: (state.lessons || []).length,
    correctionsCount: (state.corrections || []).length,
    pendingCount: (state.pendingLessons || []).length,
    recentLessons: (state.lessons || []).slice(-8).reverse().map(l => ({
      id: l.id,
      title: l.title,
      date: l.date,
      source: l.source,
      preview: String(l.content || '').slice(0, 120)
    })),
    pendingLessons: (state.pendingLessons || []).slice().reverse().map(p => ({
      id: p.id,
      title: p.title,
      date: p.date,
      preview: String(p.content || '').slice(0, 120)
    })),
    stats: state.stats,
    modes: MODES,
    updatedAt: state.updatedAt
  };
}

module.exports = {
  initSuperBrain,
  isSuperBrainEnabled,
  loadState,
  saveState,
  addLesson,
  addCorrection,
  addPendingLesson,
  approvePending,
  rejectPending,
  setMode,
  chat,
  buildContextBlock,
  publicSummary,
  rankLessons,
  extractAprendi,
  MODES,
  SUPER_BRAIN_ID
};
