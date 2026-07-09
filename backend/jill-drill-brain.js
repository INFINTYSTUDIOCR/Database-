/**
 * Jill Rapid drill  cerebro servidor.
 * Banco, seleccin adaptativa, perfil por estudiante, persistencia y cascada a tutores.
 */
const JillDrillBank = require('../js/jill-drill-bank.js');
const JillMatrixQuiz = require('./jill-matrix-quiz.js');

const DRILL_BRAIN_ID = 'JILL-DRILL-BRAIN';
const QUESTIONS_PER_ROUND = 10;
const WIN_SCORE_PCT = 70;

let _sbSet = null;
let _sbGetOne = null;
let _superBrain = null;

const CORE = [
  { kpi: 'k10', category: 'phrase', q: 'Complet la oracin: I think ___ because', options: ['that', 'the', 'to', 'on'], answer: 0, explain: 'Opinin + because: I think that because' },
  { kpi: 'k8', category: 'expression', q: 'Cul conector muestra contraste?', options: ['on top of that', 'however', 'first of all', 'as well as'], answer: 1, explain: '"However" marca oposicin entre ideas.' },
  { kpi: 'k9', category: 'phrase', q: 'Te preguntan "Do you like your job?"  complet mejor: Yes, ___', options: ['I do because', 'yes', 'job', 'like'], answer: 0, explain: 'Expand: Yes, I do because' },
  { kpi: 'k13', category: 'phrase', q: 'Si te trabs al hablar, lo mejor es', options: ['Callar', '"Let me rephrase" y seguir', 'Colgar', 'Hablar ms fuerte'], answer: 1, explain: 'Reparar y continuar  recovery sin presin.' },
  { kpi: 'k2', category: 'tense', q: 'Complet: Yesterday I ___ to the office.', options: ['went', 'go', 'going', 'goes'], answer: 0, explain: 'Pasado simple: I went.' }
];

const BY_BUNDLE = {
  'F1-msi': [
    { kpi: 'k3', category: 'tense', q: 'Despus de have en perfecto: I have ___ busy all week.', options: ['been', 'be', 'being', 'was'], answer: 0, explain: 'Have + participio: I have been.' },
    { kpi: 'k3', category: 'tense', q: 'Despus de been: I have been ___ on this project.', options: ['working', 'work', 'worked', 'works'], answer: 0, explain: 'Been + -ing: I have been working.' },
    { kpi: 'k2', category: 'tense', q: 'Complet el pasado: They ___ the meeting early.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Pasado simple: finished.' }
  ],
  'F2-pronouns': [
    { kpi: 'k4', category: 'possessive', q: '"This is ___ book"  posesivo de I', options: ['me', 'my', 'mine', 'myself'], answer: 1, explain: 'Antes del sustantivo: my book.' },
    { kpi: 'k4', category: 'reflexive', q: 'Reflexivo de "she" es', options: ['hers', 'herself', 'sheself', 'her'], answer: 1, explain: 'She did it herself.' },
    { kpi: 'k4', category: 'demonstrative', q: 'Demostrativo cerca: ___', options: ['that', 'this', 'those', 'them'], answer: 1, explain: 'This = cerca; That = lejos.' }
  ]
};

const BUNDLE_ID_ALIASES = { 'F1-lego': 'F1-msi' };

function initJillDrillBrain({ sbSet, sbGetOne, superBrain }) {
  _sbSet = sbSet;
  _sbGetOne = sbGetOne;
  _superBrain = superBrain;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isRapidDrillQuestion(item) {
  if (!item || !item.q) return false;
  const q = String(item.q);
  if (/P\s*\+\s*V\s*\+\s*C/i.test(q)) return false;
  if (/frmula\s+P\+V/i.test(q)) return false;
  return true;
}

function resolveBundleId(id) {
  return BUNDLE_ID_ALIASES[id] || id;
}

function bundleIdFromStudent(student, activeBundle) {
  if (activeBundle && activeBundle.id) return activeBundle.id;
  if (typeof activeBundle === 'string') return activeBundle;
  return student?.jillProgress?.activeBundle || '';
}

function ensureDrillProfile(student) {
  if (!student.jillDrillProfile) {
    student.jillDrillProfile = { weakCategories: {}, mastery: {}, lastFailures: [] };
  }
  return student.jillDrillProfile;
}

function ensureRapidDrillStats(student) {
  if (!student.jillRapidDrill) {
    student.jillRapidDrill = { winStreak: 0, bestWinStreak: 0, totalWins: 0, trophies: 0 };
  }
  return student.jillRapidDrill;
}

function collectWeakCategories(student) {
  const prof = ensureDrillProfile(student);
  const scored = [];
  Object.keys(prof.mastery || {}).forEach((cat) => {
    const m = prof.mastery[cat];
    const total = (m.ok || 0) + (m.fail || 0);
    if (total < 1) return;
    const failRate = (m.fail || 0) / total;
    if (failRate >= 0.4 || (prof.weakCategories[cat] || 0) >= 2) {
      scored.push({ cat, weight: failRate + (prof.weakCategories[cat] || 0) * 0.15 });
    }
  });
  Object.keys(prof.weakCategories || {}).forEach((cat) => {
    if (scored.some((s) => s.cat === cat)) return;
    scored.push({ cat, weight: prof.weakCategories[cat] });
  });
  scored.sort((a, b) => b.weight - a.weight);
  return scored.map((s) => s.cat).slice(0, 6);
}

function collectNemesisKpis(student) {
  const ordered = [];
  function add(k) {
    if (!k || ordered.includes(k)) return;
    ordered.push(k);
  }
  const ns = student?.nemesisState || {};
  (ns.reinforcement || []).forEach(add);
  (student.quizWeakKpis || []).forEach(add);
  (student.jillProNemesis || []).slice(-5).forEach((q) => {
    (q.kpiResults || []).forEach((r) => { if (!r.correct) add(r.kpi); });
  });
  return ordered;
}

function allTaggedQuestions() {
  const out = CORE.slice();
  (JillDrillBank.BANK || []).forEach((q) => out.push(q));
  Object.keys(BY_BUNDLE).forEach((bid) => {
    (BY_BUNDLE[bid] || []).forEach((q) => out.push({ ...q, bundleId: bid }));
  });
  return out;
}

function pickQuestions(student, activeBundle, count) {
  count = count || QUESTIONS_PER_ROUND;
  const bid = resolveBundleId(bundleIdFromStudent(student, activeBundle));
  if (bid === 'F0-matrix') {
    const matrixQs = JillMatrixQuiz.pickQuestions(student, count);
    if (matrixQs.length >= Math.min(3, count)) return matrixQs.slice(0, count);
  }
  const nemesisKpis = collectNemesisKpis(student);
  const pool = [];
  const seenQ = {};

  function pushQ(item) {
    if (!item || !item.q || seenQ[item.q]) return;
    if (!isRapidDrillQuestion(item)) return;
    seenQ[item.q] = true;
    pool.push(item);
  }

  collectWeakCategories(student).forEach((cat) => {
    shuffle(JillDrillBank.byCategory(cat)).slice(0, 2).forEach(pushQ);
  });

  nemesisKpis.forEach((kpi) => {
    allTaggedQuestions().forEach((q) => {
      if (q.kpi === kpi) pushQ(q);
    });
  });

  if (bid) {
    const bqs = BY_BUNDLE[bid] || BY_BUNDLE[resolveBundleId(bid)];
    if (bqs) {
      bqs.forEach((q) => {
        if (!nemesisKpis.length || nemesisKpis.includes(q.kpi)) pushQ({ ...q, bundleId: bid });
      });
    }
  }

  shuffle(JillDrillBank.BANK || []).slice(0, 4).forEach(pushQ);
  if (pool.length < count) shuffle(allTaggedQuestions()).forEach(pushQ);

  return shuffle(pool).slice(0, count).map((q) => ({
    kpi: q.kpi || 'k10',
    category: q.category || 'tense',
    q: q.q,
    options: (q.options || []).slice(),
    answer: q.answer,
    explain: q.explain || ''
  }));
}

function updateDrillProfile(student, kpiResults) {
  const prof = ensureDrillProfile(student);
  (kpiResults || []).forEach((r) => {
    if (!r.category) return;
    if (!prof.mastery[r.category]) prof.mastery[r.category] = { ok: 0, fail: 0 };
    if (r.correct) prof.mastery[r.category].ok++;
    else {
      prof.mastery[r.category].fail++;
      prof.weakCategories[r.category] = (prof.weakCategories[r.category] || 0) + 1;
      prof.lastFailures.unshift({
        category: r.category,
        kpi: r.kpi,
        at: new Date().toISOString()
      });
    }
  });
  prof.lastFailures = (prof.lastFailures || []).slice(0, 24);
}

function updateNemesisState(student, kpiResults, score) {
  if (!student.nemesisState) student.nemesisState = { domain: [], reinforcement: [] };
  const byKpi = {};
  (kpiResults || []).forEach((r) => {
    if (!byKpi[r.kpi]) byKpi[r.kpi] = { ok: 0, fail: 0 };
    r.correct ? byKpi[r.kpi].ok++ : byKpi[r.kpi].fail++;
  });
  const domain = [];
  const reinforcement = [];
  Object.keys(byKpi).forEach((k) => {
    const b = byKpi[k];
    const pct = b.ok / (b.ok + b.fail);
    if (pct >= 0.75) domain.push(k);
    else if (pct < 0.5) reinforcement.push(k);
  });
  student.nemesisState.domain = domain;
  student.nemesisState.reinforcement = reinforcement;
  student.nemesisState.lastJillProScore = score;
  student.nemesisState.lastJillProDate = new Date().toISOString();
  student.quizWeakKpis = reinforcement.concat(
    Object.keys(byKpi).filter((k) => !reinforcement.includes(k) && !domain.includes(k))
  );
}

function applyWinStreak(student, score, perfect) {
  const rd = ensureRapidDrillStats(student);
  const won = score >= WIN_SCORE_PCT;
  if (won) {
    rd.totalWins = (rd.totalWins || 0) + 1;
    rd.winStreak = (rd.winStreak || 0) + 1;
    rd.trophies = (rd.trophies || 0) + (perfect || score >= 100 ? 3 : (score >= 80 ? 2 : 1));
    if (rd.winStreak > (rd.bestWinStreak || 0)) rd.bestWinStreak = rd.winStreak;
  } else {
    rd.winStreak = 0;
  }
  rd.lastScore = score;
  rd.lastDate = new Date().toISOString();
  return { won, rd };
}

function calcXp(result) {
  let xp = 8 + (result.correct || 0) * 6;
  if (result.correct === result.total && result.total > 0) xp += 22;
  if ((result.streak || 0) >= 3) xp += 10;
  if (result.nemesisMode) xp += 5;
  if (result.wonRound) xp += 15 + (result.winStreak || 0) * 4;
  return xp;
}

async function loadBrainAggregate() {
  if (!_sbGetOne) return { patterns: [], studentSnapshots: {} };
  try {
    const row = await _sbGetOne('infinity_sessions', DRILL_BRAIN_ID);
    return row?.data || { patterns: [], studentSnapshots: {} };
  } catch {
    return { patterns: [], studentSnapshots: {} };
  }
}

async function saveBrainAggregate(data) {
  if (!_sbSet) return false;
  data.updatedAt = new Date().toISOString();
  return _sbSet('infinity_sessions', DRILL_BRAIN_ID, data);
}

async function cascadeFailuresToBrain(student, kpiResults) {
  const failures = (kpiResults || []).filter((r) => !r.correct && r.category);
  if (!failures.length) return;

  const agg = await loadBrainAggregate();
  agg.patterns = agg.patterns || [];
  const name = student?.name || student?.info?.name || student?.id || 'estudiante';

  failures.forEach((f) => {
    const label = JillDrillBank.categoryLabel(f.category);
    const key = `${f.category}:${f.kpi}`;
    let pat = agg.patterns.find((p) => p.key === key);
    if (!pat) {
      pat = { key, category: f.category, kpi: f.kpi, label, count: 0, students: [], lastAt: null };
      agg.patterns.push(pat);
    }
    pat.count++;
    pat.lastAt = new Date().toISOString();
    if (!pat.students.includes(student.id)) pat.students.push(student.id);
    if (pat.students.length > 40) pat.students = pat.students.slice(-40);
  });

  if (agg.patterns.length > 120) {
    agg.patterns.sort((a, b) => (b.count || 0) - (a.count || 0));
    agg.patterns = agg.patterns.slice(0, 120);
  }

  agg.studentSnapshots = agg.studentSnapshots || {};
  agg.studentSnapshots[student.id] = {
    name,
    weakCategories: collectWeakCategories(student),
    reinforcement: student.nemesisState?.reinforcement || [],
    lastScore: student.nemesisState?.lastJillProScore,
    at: new Date().toISOString()
  };

  await saveBrainAggregate(agg);

  if (_superBrain?.ingestFromDrillFailure) {
    for (const f of failures.slice(0, 3)) {
      await _superBrain.ingestFromDrillFailure({
        studentName: name,
        category: f.category,
        categoryLabel: JillDrillBank.categoryLabel(f.category),
        kpi: f.kpi
      }).catch(() => {});
    }
  }
}

async function persistStudent(student) {
  if (!_sbSet || !student?.id) return false;
  return _sbSet('infinity_students', student.id, student);
}

/**
 * Cascada POR TURNO de conversacin (Jill DJ): fallos de estructura detectados
 * mientras el alumno habla, no solo en el Rapid drill. Alimenta el mismo perfil
 * y el mismo cerebro compartido que el drill, para que las sesiones y los tutores
 * refuercen lo que el alumno falla al conversar.
 */
async function cascadeTurnFailures(student, findings) {
  if (!student) return null;
  const results = (findings || [])
    .filter((f) => f && f.category)
    .map((f) => ({ category: f.category, kpi: f.kpi || 'k10', correct: false }));
  if (!results.length) return null;
  updateDrillProfile(student, results);
  await cascadeFailuresToBrain(student, results);
  await persistStudent(student);
  return { weakCategories: collectWeakCategories(student) };
}

async function completeDrill(student, result) {
  const xp = calcXp(result);
  if (!student.jillGrowth) student.jillGrowth = { habit: {}, badges: [], xp: 0, pulses: [] };
  student.jillGrowth.xp = (student.jillGrowth.xp || 0) + xp;

  if (!student.jillProNemesis) student.jillProNemesis = [];
  const wrongKpis = (result.kpiResults || []).filter((r) => !r.correct).map((r) => r.kpi);
  student.jillProNemesis.push({
    date: new Date().toISOString(),
    type: 'nemesis-kahoot',
    correct: result.correct,
    total: result.total,
    score: result.score,
    bundleId: result.bundleId || '',
    kpiResults: result.kpiResults || [],
    wrongKpis,
    nemesisKpis: result.nemesisKpis || []
  });
  if (student.jillProNemesis.length > 25) student.jillProNemesis = student.jillProNemesis.slice(-25);

  if (!student.jillQuizzes) student.jillQuizzes = [];
  student.jillQuizzes.push({
    date: new Date().toISOString(),
    correct: result.correct,
    total: result.total,
    score: result.score,
    bundleId: result.bundleId || '',
    mode: 'jill-pro-nemesis',
    wrongKpis
  });
  if (student.jillQuizzes.length > 30) student.jillQuizzes = student.jillQuizzes.slice(-30);

  updateNemesisState(student, result.kpiResults || [], result.score);
  updateDrillProfile(student, result.kpiResults || []);
  const winMeta = applyWinStreak(student, result.score, result.correct === result.total && result.total > 0);

  if (result.score >= 80) {
    if (!student.jillPulse) student.jillPulse = {};
    student.jillPulse.lastScore = result.score;
    student.jillPulse.lastDate = new Date().toISOString();
    student.jillPulse.passed = true;
    if (student.jillMatrix) student.jillMatrix.pulseQuizPassed = true;
  }

  await cascadeFailuresToBrain(student, result.kpiResults || []);
  InfinityVictory.applyJillVictoryToStudent(student);
  await persistStudent(student);

  return {
    xp,
    won: winMeta.won,
    jillRapidDrill: student.jillRapidDrill,
    nemesisState: student.nemesisState,
    jillDrillProfile: student.jillDrillProfile,
    quizWeakKpis: student.quizWeakKpis,
    jillGrowth: student.jillGrowth,
    jillPulse: student.jillPulse,
    infinityVictory: student.infinityVictory
  };
}

async function getPropagatedDrillContext(charLimit = 900) {
  const agg = await loadBrainAggregate();
  const patterns = (agg.patterns || [])
    .filter((p) => (p.count || 0) >= 2)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 8);
  if (!patterns.length) return '';
  const lines = ['RAPID DRILL PATTERNS (cerebro  reforzar en sesin):'];
  patterns.forEach((p) => {
    lines.push(`- ${p.label || p.category} (${p.kpi}): ${p.count} fallos recientes entre estudiantes`);
  });
  return lines.join('\n').slice(0, charLimit);
}

function getStudentDrillNote(student) {
  const weak = collectWeakCategories(student);
  const reinforce = student?.nemesisState?.reinforcement || [];
  const parts = [];
  if (weak.length) parts.push(`Categoras dbiles drill: ${weak.map(JillDrillBank.categoryLabel).join(', ')}.`);
  if (reinforce.length) parts.push(`KPI refuerzo: ${reinforce.join(', ')}.`);
  const fails = (student?.jillDrillProfile?.lastFailures || []).slice(0, 4);
  if (fails.length) {
    parts.push(`ltimos fallos: ${fails.map((f) => JillDrillBank.categoryLabel(f.category)).join(', ')}.`);
  }
  return parts.length ? `\nDRILL BRAIN (estudiante): ${parts.join(' ')}` : '';
}

function getDrillProfileSummary(student) {
  return {
    weakCategories: collectWeakCategories(student),
    nemesisKpis: collectNemesisKpis(student),
    reinforcement: student?.nemesisState?.reinforcement || [],
    domain: student?.nemesisState?.domain || [],
    jillRapidDrill: student?.jillRapidDrill || {},
    jillDrillProfile: student?.jillDrillProfile || {}
  };
}

module.exports = {
  initJillDrillBrain,
  pickQuestions,
  completeDrill,
  cascadeTurnFailures,
  getPropagatedDrillContext,
  getStudentDrillNote,
  getDrillProfileSummary,
  calcXp,
  QUESTIONS_PER_ROUND,
  JillDrillBank
};
