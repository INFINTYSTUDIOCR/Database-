/**
 * Gate F0-matrix - requisitos para salir de la matriz y avanzar de bundle.
 * Compartido cliente + servidor Node.
 */
(function (global) {
  'use strict';

  var WRITTEN_DAYS_REQUIRED = 22;
  var MAX_AVG_RESPONSE_MS = 15000;
  var HITS_TO_MASTER = 3;
  var VERBS = ['be', 'have', 'do', 'work', 'study', 'go', 'make', 'take', 'get', 'see', 'know', 'think', 'want', 'need', 'say', 'tell'];
  var PRONOUNS = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  var COLUMN_IDS = ['present', 'past', 'progressive', 'perfect', 'combined', 'modal'];

  function cellKey(p, v, col) {
    return p + '|' + v + '|' + col;
  }

  function columnProgress(student, colId) {
    var m = student && student.jillMatrix;
    if (!m || !m.cells) return 0;
    var total = PRONOUNS.length * VERBS.length;
    var hits = 0;
    PRONOUNS.forEach(function (p) {
      VERBS.forEach(function (v) {
        if ((m.cells[cellKey(p, v, colId)] || 0) >= HITS_TO_MASTER) hits++;
      });
    });
    return Math.round((hits / total) * 100);
  }

  function allColumnsMastered(student) {
    for (var i = 0; i < COLUMN_IDS.length; i++) {
      if (columnProgress(student, COLUMN_IDS[i]) < 100) return false;
    }
    return true;
  }

  function f0ExitChecklist(student) {
    var m = (student && student.jillMatrix) || {};
    var matrixOk = !!(m.allColumnsMastered) || allColumnsMastered(student);
    var items = [
      { key: 'matrix', ok: matrixOk, label: 'Matriz 100% (PR/PS/PC/PRP/PPC/MOD)' },
      { key: 'written', ok: (m.writtenDaysCompleted || 0) >= WRITTEN_DAYS_REQUIRED, label: '22 días escritos (15+10 min/día)' },
      { key: 'pulse', ok: !!(m.pulseQuizPassed || (student && student.jillPulse && student.jillPulse.passed)), label: 'Rapid drill / Pulse >=80%' },
      { key: 'anecdote', ok: (m.anecdoteSessions || 0) >= 1 || !!m.anecdoteEvaluated, label: 'Anécdota del cuaderno evaluada' },
      { key: 'time', ok: m.avgResponseMs == null || m.avgResponseMs <= MAX_AVG_RESPONSE_MS, label: 'Tiempo de respuesta bajo 15s' }
    ];
    var pending = items.filter(function (i) { return !i.ok; });
    return {
      ok: pending.length === 0,
      pending: pending,
      items: items,
      writtenDaysCompleted: m.writtenDaysCompleted || 0,
      writtenDaysRequired: WRITTEN_DAYS_REQUIRED
    };
  }

  function getAdvanceBlockReason(student, bundleId) {
    if (bundleId !== 'F0-matrix') return null;
    var check = f0ExitChecklist(student);
    if (check.ok) return null;
    return 'F0 incompleto: ' + check.pending.map(function (p) { return p.label; }).join(' | ');
  }

  function canAdvanceFromBundle(student, bundleId) {
    var reason = getAdvanceBlockReason(student, bundleId);
    return { ok: !reason, reason: reason, checklist: f0ExitChecklist(student) };
  }

  global.JillF0Gate = {
    f0ExitChecklist: f0ExitChecklist,
    getAdvanceBlockReason: getAdvanceBlockReason,
    canAdvanceFromBundle: canAdvanceFromBundle,
    allColumnsMastered: allColumnsMastered,
    WRITTEN_DAYS_REQUIRED: WRITTEN_DAYS_REQUIRED
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.JillF0Gate;
}
