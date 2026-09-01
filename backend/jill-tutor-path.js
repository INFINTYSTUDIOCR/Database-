/**
 * Ruta oficial Jill Tutor — Foundations desde cero.
 * SOLO aplica a Jill Tutor (no Alice, no Claire, no Jill Companion/Pro).
 */
const fs = require('fs');
const path = require('path');
const JillF0Gate = require('./jill-f0-gate');

let _map = null;

function loadMap() {
  if (_map) return _map;
  const candidates = [
    path.join(__dirname, 'config', 'jill-tutor-path.json'),
    path.join(__dirname, '..', 'config', 'jill-tutor-path.json')
  ];
  for (let i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        _map = JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
        return _map;
      }
    } catch (_) { /* next */ }
  }
  _map = { steps: [], phases: [], startStepId: 'P01' };
  return _map;
}

function steps() {
  return (loadMap().steps || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
}

function stepById(id) {
  const want = String(id || '').trim();
  return steps().find((s) => s.id === want) || null;
}

function phaseById(id) {
  return (loadMap().phases || []).find((p) => p.id === id) || null;
}

function ensureProgress(student) {
  if (!student) return { currentStepId: loadMap().startStepId || 'P01', completedSteps: [] };
  if (!student.jillTutorPath || typeof student.jillTutorPath !== 'object') {
    student.jillTutorPath = {
      currentStepId: loadMap().startStepId || 'P01',
      completedSteps: [],
      startedAt: new Date().toISOString(),
      anecdoteTexts: [],
      writtenDaysLog: []
    };
  }
  if (!Array.isArray(student.jillTutorPath.completedSteps)) {
    student.jillTutorPath.completedSteps = [];
  }
  if (!student.jillTutorPath.currentStepId) {
    student.jillTutorPath.currentStepId = loadMap().startStepId || 'P01';
  }
  if (!Array.isArray(student.jillTutorPath.anecdoteTexts)) {
    student.jillTutorPath.anecdoteTexts = [];
  }
  if (!Array.isArray(student.jillTutorPath.writtenDaysLog)) {
    student.jillTutorPath.writtenDaysLog = [];
  }
  return student.jillTutorPath;
}

function getCurrentStep(student) {
  const prog = ensureProgress(student);
  return stepById(prog.currentStepId) || steps()[0] || null;
}

function pathProgressPct(student) {
  const list = steps();
  if (!list.length) return 0;
  const prog = ensureProgress(student);
  const done = (prog.completedSteps || []).length;
  const cur = getCurrentStep(student);
  const curIdx = cur ? list.findIndex((s) => s.id === cur.id) : 0;
  const partial = Math.max(done, curIdx);
  return Math.min(100, Math.round((partial / list.length) * 100));
}

function syncBundleFromPath(student) {
  const step = getCurrentStep(student);
  if (!step || !step.bundleId || !student) return;
  if (!student.jillProgress) student.jillProgress = { activeBundle: null, completedBundles: [], sessionLog: [] };
  student.jillProgress.activeBundle = step.bundleId;
}

function resolveTrackFromStudent(student) {
  const step = getCurrentStep(student);
  return step && step.canonTrackId ? String(step.canonTrackId) : null;
}

function canCompleteStep(student, stepId) {
  const step = stepById(stepId);
  if (!step) return { ok: false, reason: 'Paso no encontrado' };
  const prog = ensureProgress(student);

  if (step.f0Gate) {
    const gate = JillF0Gate.canAdvanceFromBundle(student, 'F0-matrix');
    return gate.ok
      ? { ok: true }
      : { ok: false, reason: gate.reason || 'F0 incompleto', checklist: gate.checklist };
  }

  if (step.writtenDaysRequired) {
    const m = student.jillMatrix || {};
    const days = m.writtenDaysCompleted || prog.writtenDaysLog.length || 0;
    const need = step.writtenDaysRequired || 22;
    if (days < need) return { ok: false, reason: `Faltan días escritos: ${days}/${need}` };
    return { ok: true };
  }

  if (step.anecdoteStep) {
    const texts = prog.anecdoteTexts || [];
    const last = texts[texts.length - 1];
    const lines = last && last.text ? String(last.text).split(/\n/).filter((l) => l.trim()).length : 0;
    if (lines < 12) return { ok: false, reason: 'Pegá tu anécdota (mínimo 12 líneas) en el portal.' };
    return { ok: true };
  }

  if (step.moduleId) {
    const mods = student.jillModuleProgress || {};
    const rec = mods[step.moduleId];
    if (rec && rec.passed === true) return { ok: true };
    if (rec && rec.bestScore >= 80) return { ok: true };
    return { ok: false, reason: step.gateLabel || `Completá ${step.moduleId}` };
  }

  return { ok: true, reason: step.gateLabel || 'Sesión completada' };
}

function completeStep(student, stepId, opts) {
  const options = opts && typeof opts === 'object' ? opts : {};
  const step = stepById(stepId);
  if (!step) return { ok: false, error: 'Paso no encontrado' };
  const prog = ensureProgress(student);
  if (prog.currentStepId !== stepId && (prog.completedSteps || []).indexOf(stepId) < 0) {
    return { ok: false, error: 'Ese paso no es el activo' };
  }

  if (step.anecdoteStep && options.anecdoteText) {
    prog.anecdoteTexts.push({
      date: new Date().toISOString(),
      text: String(options.anecdoteText).slice(0, 12000),
      stepId
    });
    if (!student.jillMatrix) student.jillMatrix = {};
    student.jillMatrix.anecdoteEvaluated = true;
    student.jillMatrix.anecdoteSessions = (student.jillMatrix.anecdoteSessions || 0) + 1;
  }

  const check = canCompleteStep(student, stepId);
  if (!check.ok && !options.force) return { ok: false, error: check.reason, checklist: check.checklist };

  if ((prog.completedSteps || []).indexOf(stepId) < 0) {
    prog.completedSteps.push(stepId);
  }
  const list = steps();
  const idx = list.findIndex((s) => s.id === stepId);
  const next = list[idx + 1];
  prog.currentStepId = next ? next.id : stepId;
  prog.lastCompletedAt = new Date().toISOString();
  syncBundleFromPath(student);
  return { ok: true, nextStepId: prog.currentStepId, completedStepId: stepId };
}

function recordModulePass(student, moduleId, score) {
  if (!student || !moduleId) return;
  if (!student.jillModuleProgress) student.jillModuleProgress = {};
  const id = String(moduleId).toUpperCase();
  const prev = student.jillModuleProgress[id] || {};
  student.jillModuleProgress[id] = {
    bestScore: Math.max(prev.bestScore || 0, score || 0),
    passed: (score || 0) >= 80 || prev.passed === true,
    lastAt: new Date().toISOString()
  };
  const step = getCurrentStep(student);
  if (step && step.moduleId && String(step.moduleId).toUpperCase() === id && (score || 0) >= 80) {
    completeStep(student, step.id, { force: false });
  }
}

function formatDeliveryBlock(student) {
  const step = getCurrentStep(student);
  const prog = ensureProgress(student);
  const map = loadMap();
  if (!step) return '';

  const phase = phaseById(step.phaseId);
  const lines = [
    'RUTA JILL TUTOR (OFICIAL — todos empiezan aquí):',
    `${map.title} · Paso ${step.order}/${steps().length}`,
    phase ? `Fase: ${phase.title}` : '',
    `PASO ACTIVO: ${step.id} — ${step.title}`,
    step.jillOpen ? `APERTURA CLASE: ${step.jillOpen}` : '',
    step.studentTask ? `TAREA ASIGNADA: ${step.studentTask}` : '',
    step.gateLabel ? `PARA AVANZAR: ${step.gateLabel}` : '',
    step.canonTrackId ? `TRACK CANON OBLIGATORIO ESTE PASO: ${step.canonTrackId} — un solo tema, guion oral John.` : 'Sin track canon — vocabulario/supervivencia en oraciones.',
    (prog.completedSteps || []).length
      ? `Completados: ${prog.completedSteps.join(', ')}`
      : 'Primer paso — bienvenida desde cero.',
    'ENTREGA: explicá como clase John (puente ES→EN → ejemplo → práctica oral → ¿Te quedó?). PROHIBIDO saltar pasos.'
  ];
  return lines.filter(Boolean).join('\n');
}

function snapshot(student) {
  const step = getCurrentStep(student);
  const prog = ensureProgress(student);
  const list = steps();
  return {
    title: loadMap().title,
    subtitle: loadMap().subtitle,
    startStepId: loadMap().startStepId,
    progressPct: pathProgressPct(student),
    currentStepId: prog.currentStepId,
    completedSteps: prog.completedSteps || [],
    current: step,
    steps: list.map((s) => ({
      id: s.id,
      order: s.order,
      phaseId: s.phaseId,
      shortTitle: s.shortTitle,
      title: s.title,
      icon: s.icon,
      done: (prog.completedSteps || []).indexOf(s.id) >= 0,
      active: s.id === prog.currentStepId
    })),
    canAdvance: step ? canCompleteStep(student, step.id) : { ok: false },
    writtenDays: (student.jillMatrix && student.jillMatrix.writtenDaysCompleted)
      || prog.writtenDaysLog.length
      || 0,
    writtenDaysRequired: 22
  };
}

module.exports = {
  loadMap,
  steps,
  stepById,
  ensureProgress,
  getCurrentStep,
  pathProgressPct,
  syncBundleFromPath,
  resolveTrackFromStudent,
  canCompleteStep,
  completeStep,
  recordModulePass,
  formatDeliveryBlock,
  snapshot
};
