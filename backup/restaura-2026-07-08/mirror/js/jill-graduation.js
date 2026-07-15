/**
 * Graduación Foundations ? Alice: prerequisitos estructurales + solicitud de Jill (no automática).
 */
(function (global) {
  'use strict';

  var MAX_AVG_MS = 15000;
  var MIN_PULSE_SCORE = 80;

  function ensureTrack(student) {
    if (!student) return null;
    if (!student.track || typeof student.track !== 'object') {
      student.track = { current: 'jill', graduated: { jill: false, alice: false, nexora: false } };
    }
    if (!student.track.graduated) student.track.graduated = { jill: false, alice: false, nexora: false };
    return student.track;
  }

  function allMatrixColumnsMastered(student) {
    if (typeof JillMatrix === 'undefined') return false;
    for (var i = 0; i < JillMatrix.COLUMNS.length; i++) {
      if (!JillMatrix.isColumnMastered(student, i)) return false;
    }
    return true;
  }

  /** Prerequisitos estructurales (teoría + matriz) — no gradúan solos. */
  function checkStructurePrerequisites(student) {
    var missing = [];
    var m = (student && student.jillMatrix) || {};
    var pulseOk = !!(m.pulseQuizPassed || (student.jillPulse && student.jillPulse.passed));
    var anecdoteOk = (m.anecdoteSessions || 0) >= 1 || !!m.anecdoteEvaluated;
    var timeOk = m.avgResponseMs == null || m.avgResponseMs <= MAX_AVG_MS;

    if (!allMatrixColumnsMastered(student)) missing.push('Matriz 100% (cols 1-6)');
    if (!pulseOk) missing.push('Pulse quiz ?' + MIN_PULSE_SCORE + '%');
    if (!anecdoteOk) missing.push('Anécdota cuaderno evaluada');
    if (!timeOk) missing.push('Tiempo respuesta <' + (MAX_AVG_MS / 1000) + 's promedio');

    return {
      ok: missing.length === 0,
      missing: missing,
      pulseOk: pulseOk,
      anecdoteOk: anecdoteOk,
      timeOk: timeOk
    };
  }

  function isConversationPhase(student) {
    if (!student || (student.track && student.track.graduated && student.track.graduated.jill)) return false;
    return checkStructurePrerequisites(student).ok;
  }

  function hasPendingGraduationRequest(student) {
    return !!(student && student.jillGraduationRequest && student.jillGraduationRequest.pending);
  }

  /** Jill solicita graduación tras evaluar conversación — el alumno/trainer confirma. */
  function recordGraduationRequest(student, evaluation) {
    if (!student || !evaluation || !evaluation.graduation_request) return null;
    var prereq = checkStructurePrerequisites(student);
    if (!prereq.ok) return { ok: false, missing: prereq.missing };

    student.jillGraduationRequest = {
      pending: true,
      requestedAt: new Date().toISOString(),
      sessionScore: evaluation.overall_score,
      reason: evaluation.graduation_reason || evaluation.jill_message || '',
      conversationKpis: evaluation.conversation_kpis || null,
      bestMoment: evaluation.best_moment || null
    };
    return { ok: true, request: student.jillGraduationRequest };
  }

  /** Aplica graduación solo con solicitud pendiente de Jill o force (trainer). */
  function confirmGraduation(student, opts) {
    opts = opts || {};
    if (!student) return { ok: false, missing: ['sin estudiante'] };
    ensureTrack(student);
    if (student.track.graduated.jill) return { ok: true, already: true };

    if (!opts.force && !hasPendingGraduationRequest(student)) {
      return {
        ok: false,
        missing: ['Jill aún no solicitó graduación — necesitás demostrar conversación fluida en sesión con Jill.']
      };
    }

    var prereq = checkStructurePrerequisites(student);
    if (!prereq.ok && !opts.force) return prereq;

    student.track.graduated.jill = true;
    student.track.current = 'alice';
    student.aliceEnabled = true;
    if (!student.jillEnabled && student.jillEnabled !== false) student.jillEnabled = true;

    var lvl = String(student.level || '').toLowerCase();
    if (!lvl || lvl === 'foundations' || lvl === 'survival' || lvl === 'emerging') {
      student.level = 'Functional';
    }

    if (student.jillProgress) {
      var done = student.jillProgress.completedBundles || [];
      if (done.indexOf('F7-alice-ready') < 0) done.push('F7-alice-ready');
      student.jillProgress.completedBundles = done;
      student.jillProgress.activeBundle = null;
      student.jillProgress.graduatedAt = new Date().toISOString();
    }

    student.jillGraduation = {
      date: new Date().toISOString(),
      source: opts.source || 'jill-request',
      level: student.level,
      reason: (student.jillGraduationRequest && student.jillGraduationRequest.reason) || ''
    };

    if (student.jillGraduationRequest) {
      student.jillGraduationRequest.pending = false;
      student.jillGraduationRequest.confirmedAt = new Date().toISOString();
    }

    return { ok: true, graduated: true, message: 'Foundations completo — Alice activada (graduación confirmada).' };
  }

  function renderGateStatus(student) {
    if (student && student.track && student.track.graduated && student.track.graduated.jill) {
      return '<div style="font-size:11px;color:#86EFAC;margin-top:8px;font-weight:700;">? Graduado a Alice</div>';
    }
    if (hasPendingGraduationRequest(student)) {
      return '<div style="font-size:11px;color:#FCD34D;margin-top:8px;font-weight:700;">?? Jill solicitó graduación — confirmá al terminar la sesión.</div>';
    }
    if (isConversationPhase(student)) {
      return '<div style="font-size:11px;color:#86EFAC;margin-top:8px;font-weight:700;">Fase conversación — Jill pulirá diálogo y evaluará si podés graduar.</div>';
    }
    var g = checkStructurePrerequisites(student);
    if (g.ok) {
      return '<div style="font-size:11px;color:#bbf7d0;margin-top:8px;">Estructura lista — Jill pasará a conversación guiada.</div>';
    }
    return '<div style="font-size:10px;color:rgba(255,255,255,0.65);margin-top:8px;">Prerequisitos: falta ' + g.missing.join(' · ') + '</div>';
  }

  function markAnecdoteEvaluated(student) {
    if (!student || !student.jillMatrix) return;
    if (student.jillMatrix.anecdoteEvaluated) return;
    student.jillMatrix.anecdoteEvaluated = true;
    if (typeof JillMatrix !== 'undefined') JillMatrix.endAnecdote(student);
  }

  global.JillGraduation = {
    checkStructurePrerequisites: checkStructurePrerequisites,
    checkAliceExitGate: checkStructurePrerequisites,
    isConversationPhase: isConversationPhase,
    hasPendingGraduationRequest: hasPendingGraduationRequest,
    recordGraduationRequest: recordGraduationRequest,
    confirmGraduation: confirmGraduation,
    tryGraduateToAlice: confirmGraduation,
    renderGateStatus: renderGateStatus,
    markAnecdoteEvaluated: markAnecdoteEvaluated,
    allMatrixColumnsMastered: allMatrixColumnsMastered
  };
})(typeof window !== 'undefined' ? window : globalThis);
