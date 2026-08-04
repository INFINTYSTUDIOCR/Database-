/**
 * Product-scoped usage / practice archive ($0 — Supabase JSON only).
 * Kamuk → kamuk_sessions / kamuk_students. Infinity → infinity_*.
 * Never mixes products. Does not call Claude or ElevenLabs.
 */
'use strict';

const MAX_TRANSCRIPT_CHARS = 12000;
const MAX_EVAL_CHARS = 2000;
const MAX_STUDENT_ARCHIVE = 80;
const MAX_INDEX_EVENTS = 500;

function isKamukId(id) {
  return !!(id && String(id).startsWith('KAM-'));
}

function productForId(id) {
  return isKamukId(id) ? 'kamuk' : 'infinity';
}

function sessionsTableForId(id) {
  return isKamukId(id) ? 'kamuk_sessions' : 'infinity_sessions';
}

function studentsTableForId(id) {
  return isKamukId(id) ? 'kamuk_students' : 'infinity_students';
}

function trimText(s, max) {
  const t = String(s || '');
  if (t.length <= max) return t;
  return t.slice(0, max) + '…[truncated]';
}

function normalizeTranscript(input) {
  if (!input) return '';
  if (Array.isArray(input)) {
    return input
      .map((m) => {
        if (!m) return '';
        if (typeof m === 'string') return m;
        const role = m.role || m.speaker || m.who || 'turn';
        const content = m.content || m.text || m.message || m.reply || '';
        return `${role}: ${content}`;
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(input);
}

/**
 * @param {{ sbSet: Function, sbGetOne?: Function }} deps
 * @param {object} event
 */
async function recordPracticeSession(deps, event) {
  const sbSet = deps?.sbSet;
  if (!sbSet || !event?.studentId) return null;

  const studentId = String(event.studentId);
  const product = productForId(studentId);
  const table = sessionsTableForId(studentId);
  const ts = event.at || new Date().toISOString();
  const day = ts.slice(0, 10);
  const surface = String(event.surface || 'unknown').slice(0, 32);
  const shortId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const id = `PRACT-${product}-${studentId.slice(0, 28)}-${shortId}`.slice(0, 120);

  const transcript = trimText(
    normalizeTranscript(event.transcript || event.hist || event.history),
    MAX_TRANSCRIPT_CHARS
  );
  const evaluation = event.evaluation
    ? trimText(
        typeof event.evaluation === 'string'
          ? event.evaluation
          : JSON.stringify(event.evaluation),
        MAX_EVAL_CHARS
      )
    : null;

  const payload = {
    type: 'practice_session',
    product,
    studentId,
    surface,
    mode: event.mode || null,
    at: ts,
    day,
    score: event.score != null ? Number(event.score) : null,
    topics: Array.isArray(event.topics) ? event.topics.slice(0, 12) : undefined,
    summary: event.summary ? String(event.summary).slice(0, 400) : undefined,
    evaluation,
    transcript: transcript || undefined,
    transcriptChars: transcript ? transcript.length : 0,
    meta: event.meta && typeof event.meta === 'object' ? event.meta : undefined
  };

  await sbSet(table, id, payload);

  // Daily product index for cohort export (30 students → one row per day)
  try {
    const indexId = `USAGE-IDX-${product}-${day}`;
    const row = deps.sbGetOne ? await deps.sbGetOne(table, indexId) : null;
    const data = row?.data || { type: 'usage_index', product, day, events: [] };
    data.events = data.events || [];
    data.events.push({
      id,
      studentId,
      surface,
      score: payload.score,
      at: ts,
      transcriptChars: payload.transcriptChars
    });
    if (data.events.length > MAX_INDEX_EVENTS) {
      data.events = data.events.slice(-MAX_INDEX_EVENTS);
    }
    data.updatedAt = new Date().toISOString();
    await sbSet(table, indexId, data);
  } catch (e) {
    console.warn('usage index:', e.message);
  }

  return { id, table, product, payload };
}

/**
 * Append lightweight pointer on student blob for "reuse later" without opening every PRACT row.
 * Mutates student in place; caller must sbSetStudent.
 */
function appendStudentArchivePointer(student, sessionRef) {
  if (!student || !sessionRef?.id) return student;
  if (!Array.isArray(student.usageArchive)) student.usageArchive = [];
  student.usageArchive.push({
    id: sessionRef.id,
    at: sessionRef.at || new Date().toISOString(),
    surface: sessionRef.surface,
    score: sessionRef.score != null ? sessionRef.score : null,
    table: sessionRef.table
  });
  if (student.usageArchive.length > MAX_STUDENT_ARCHIVE) {
    student.usageArchive = student.usageArchive.slice(-MAX_STUDENT_ARCHIVE);
  }
  return student;
}

async function recordAndTagStudent(deps, student, event) {
  if (!student?.id) return null;
  const full = { ...event, studentId: student.id };
  const ref = await recordPracticeSession(deps, full);
  if (ref) {
    appendStudentArchivePointer(student, {
      id: ref.id,
      at: ref.payload.at,
      surface: ref.payload.surface,
      score: ref.payload.score,
      table: ref.table
    });
  }
  return ref;
}

module.exports = {
  isKamukId,
  productForId,
  sessionsTableForId,
  studentsTableForId,
  recordPracticeSession,
  appendStudentArchivePointer,
  recordAndTagStudent,
  MAX_TRANSCRIPT_CHARS,
  MAX_STUDENT_ARCHIVE
};
