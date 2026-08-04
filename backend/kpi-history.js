/**
 * Durable KPI timeline on student JSON ($0 infra — no vectors / fine-tune).
 * Feeds portal line charts after Alice / Jill / Nexora / drills / trainer edits.
 */
'use strict';

const MACRO_KEYS = ['IG', 'ST', 'RA', 'PS', 'R'];
const MAX_SNAPSHOTS = 40;

function snapshotPhase1(student) {
  const p = (student && student.kpis && student.kpis.phase1) || {};
  const out = {};
  MACRO_KEYS.forEach((k) => {
    out[k] = parseInt(p[k], 10) || 0;
  });
  return out;
}

function totalOf(phase1) {
  return MACRO_KEYS.reduce((s, k) => s + (parseInt(phase1[k], 10) || 0), 0);
}

/**
 * @param {object} student
 * @param {{ source: string, score?: number|null, note?: string, phase1?: object, force?: boolean }} meta
 */
function appendKpiHistory(student, meta) {
  if (!student || typeof student !== 'object') return null;
  const source = String((meta && meta.source) || 'session').slice(0, 32);
  const phase1 = (meta && meta.phase1) ? { ...meta.phase1 } : snapshotPhase1(student);
  const score =
    meta && meta.score != null && !Number.isNaN(Number(meta.score))
      ? Number(meta.score)
      : null;

  if (!student.kpis) student.kpis = {};
  if (!Array.isArray(student.kpis.history)) student.kpis.history = [];

  const last = student.kpis.history[student.kpis.history.length - 1];
  const samePhase =
    last &&
    MACRO_KEYS.every((k) => (parseInt(last.phase1 && last.phase1[k], 10) || 0) === (parseInt(phase1[k], 10) || 0));
  const sameScore =
    last &&
    (last.score == null ? score == null : Number(last.score) === Number(score));
  // Collapse near-duplicates (same source within 2 min) unless forced
  if (!meta?.force && last && last.source === source && samePhase && sameScore) {
    const t0 = Date.parse(last.at || 0) || 0;
    if (Date.now() - t0 < 120000) {
      last.at = new Date().toISOString();
      if (meta?.note) last.note = String(meta.note).slice(0, 160);
      return last;
    }
  }

  const snap = {
    at: new Date().toISOString(),
    source,
    score,
    phase1,
    total: totalOf(phase1),
    note: meta?.note ? String(meta.note).slice(0, 160) : undefined
  };
  student.kpis.history.push(snap);
  if (student.kpis.history.length > MAX_SNAPSHOTS) {
    student.kpis.history = student.kpis.history.slice(-MAX_SNAPSHOTS);
  }
  return snap;
}

function getHistory(student) {
  if (!student?.kpis?.history) return [];
  return student.kpis.history.slice();
}

module.exports = {
  MACRO_KEYS,
  MAX_SNAPSHOTS,
  snapshotPhase1,
  appendKpiHistory,
  getHistory
};
