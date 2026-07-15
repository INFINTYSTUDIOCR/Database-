/**
 * Jill F0 — Matriz estructural: pronombres × 16 verbos × columnas de tiempo.
 * Gate estricto 100% · KPI tiempo de respuesta · canon visual.
 */
(function (global) {
  'use strict';

  var VERBS = ['be', 'have', 'do', 'work', 'study', 'go', 'make', 'take', 'get', 'see', 'know', 'think', 'want', 'need', 'say', 'tell'];
  var PRONOUNS = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  var HITS_TO_MASTER = 3;
  var MASTERY_RATIO = 1;
  var TARGET_RESPONSE_MS = 12000;
  var MAX_AVG_RESPONSE_MS = 15000;

  var MODALS = ['will', 'would', 'can', 'could', 'should'];

  var CANON_BY_COLUMN = {
    present: { id: 'tiempos', path: 'assets/canon/tiempos.svg', title: 'Tiempos PR' },
    past: { id: 'tiempos', path: 'assets/canon/tiempos.svg', title: 'Tiempos PS' },
    progressive: { id: 'preposiciones', path: 'assets/canon/preposiciones.svg', title: 'PC + prep en C' },
    perfect: { id: 'articulos', path: 'assets/canon/articulos.svg', title: 'PRP + artículos' },
    combined: { id: 'tiempos', path: 'assets/canon/tiempos.svg', title: 'PPC combinado' },
    modal: { id: 'moneda', path: 'assets/canon/moneda.svg', title: 'MOD · will=-RE / would=-RÍA' }
  };

  var COLUMNS = [
    { id: 'present', sigla: 'PR', label: 'Col 1 · PR Presente', formula: 'P + V + C', notation: 'P + verbo (presente) + complemento' },
    { id: 'past', sigla: 'PS', label: 'Col 2 · PS Pasado', formula: 'P + V(pasado) + C', notation: 'P + verbo (pasado) + complemento' },
    { id: 'progressive', sigla: 'PC', label: 'Col 3 · PC Continuo', formula: 'P + TO BE + V+ing + C', notation: 'P + To Be + verbo(-ing) + complemento' },
    { id: 'perfect', sigla: 'PRP', label: 'Col 4 · PRP Perfecto', formula: 'P + HAVE + PP + C', notation: 'P + Have/Has/Had + participio + complemento' },
    { id: 'combined', sigla: 'PPC', label: 'Col 5 · PPC Combinado', formula: 'P + HAVE + been + V+ing + C', notation: 'P + Have/Had + been + verbo(-ing) + complemento' },
    { id: 'modal', sigla: 'MOD', label: 'Col 6 · MOD Modales', formula: 'P + M + V + C', notation: 'P + Modal (will/would/can/could/should) + verbo base + complemento' }
  ];

  function ensureMatrix(student) {
    if (!student) return null;
    if (!student.jillMatrix || typeof student.jillMatrix !== 'object') {
      student.jillMatrix = {
        columnIndex: 0,
        cells: {},
        drillCursor: 0,
        anecdoteUnlocked: false,
        anecdoteActive: false,
        anecdoteStartedAt: null,
        responseSamples: [],
        avgResponseMs: null,
        failStreak: {},
        pulseQuizPassed: false,
        drillStartedAt: null
      };
    }
    if (!student.jillMatrix.cells) student.jillMatrix.cells = {};
    if (!student.jillMatrix.responseSamples) student.jillMatrix.responseSamples = [];
    if (!student.jillMatrix.failStreak) student.jillMatrix.failStreak = {};
    return student.jillMatrix;
  }

  function cellKey(pronoun, verb, colId) {
    return String(pronoun) + '|' + String(verb) + '|' + String(colId);
  }

  function activeColumn(student) {
    var m = ensureMatrix(student);
    var idx = Math.min(m.columnIndex || 0, COLUMNS.length - 1);
    return COLUMNS[idx];
  }

  function columnProgress(student, colIdx) {
    var col = COLUMNS[colIdx];
    if (!col) return 0;
    var m = ensureMatrix(student);
    var total = PRONOUNS.length * VERBS.length;
    var hits = 0;
    PRONOUNS.forEach(function (p) {
      VERBS.forEach(function (v) {
        if ((m.cells[cellKey(p, v, col.id)] || 0) >= HITS_TO_MASTER) hits++;
      });
    });
    return Math.round((hits / total) * 100);
  }

  function isColumnMastered(student, colIdx) {
    return columnProgress(student, colIdx) >= Math.round(MASTERY_RATIO * 100);
  }

  function tryAdvanceColumn(student) {
    var m = ensureMatrix(student);
    var idx = m.columnIndex || 0;
    if (idx >= COLUMNS.length - 1) {
      if (isColumnMastered(student, idx)) m.anecdoteUnlocked = true;
      return false;
    }
    if (isColumnMastered(student, idx)) {
      m.columnIndex = idx + 1;
      m.drillCursor = 0;
      m.drillStartedAt = new Date().toISOString();
      if (m.columnIndex >= COLUMNS.length - 1 && isColumnMastered(student, m.columnIndex)) {
        m.anecdoteUnlocked = true;
      }
      return true;
    }
    return false;
  }

  function recordResponseTime(student, ms) {
    var m = ensureMatrix(student);
    if (!ms || ms < 500 || ms > 120000) return;
    m.responseSamples.push(ms);
    if (m.responseSamples.length > 20) m.responseSamples = m.responseSamples.slice(-20);
    var sum = m.responseSamples.reduce(function (a, b) { return a + b; }, 0);
    m.avgResponseMs = Math.round(sum / m.responseSamples.length);
  }

  function recordPractice(student, ok, topic) {
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var total = PRONOUNS.length * VERBS.length;
    var cursor = m.drillCursor || 0;
    var vi = cursor % VERBS.length;
    var pi = Math.floor(cursor / VERBS.length) % PRONOUNS.length;
    var pronoun = PRONOUNS[pi];
    var verb = VERBS[vi];
    var key = cellKey(pronoun, verb, col.id);
    topic = topic || col.id;
    if (ok) {
      m.cells[key] = (m.cells[key] || 0) + 1;
      m.failStreak[topic] = 0;
      tryAdvanceColumn(student);
    } else {
      m.failStreak[topic] = (m.failStreak[topic] || 0) + 1;
    }
    m.drillCursor = (cursor + 1) % total;
    m.drillStartedAt = new Date().toISOString();
    return { pronoun: pronoun, verb: verb, column: col };
  }

  function getDrillPrompt(student) {
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var total = PRONOUNS.length * VERBS.length;
    var cursor = m.drillCursor || 0;
    var vi = cursor % VERBS.length;
    var pi = Math.floor(cursor / VERBS.length) % PRONOUNS.length;
    if (!m.drillStartedAt) m.drillStartedAt = new Date().toISOString();
    var modal = col.id === 'modal' ? MODALS[cursor % MODALS.length] : null;
    return {
      pronoun: PRONOUNS[pi],
      verb: VERBS[vi],
      modal: modal,
      column: col,
      sigla: col.sigla,
      formula: col.formula,
      notation: col.notation,
      instruction: col.id === 'modal'
        ? 'Practica UNA oración (MOD): ' + PRONOUNS[pi] + ' + ' + modal + ' + ' + VERBS[vi] + ' — ' + col.formula
        : 'Practica UNA oración (' + col.sigla + '): ' + PRONOUNS[pi] + ' + ' + VERBS[vi] + ' — ' + col.formula
    };
  }

  function isMatrixBundle(bundle) {
    return !!(bundle && bundle.id === 'F0-matrix');
  }

  function isAnecdoteMode(student) {
    var m = ensureMatrix(student);
    return !!(m && m.anecdoteActive);
  }

  function startAnecdote(student) {
    var m = ensureMatrix(student);
    if (!m.anecdoteUnlocked && !isColumnMastered(student, COLUMNS.length - 1)) return false;
    m.anecdoteActive = true;
    m.anecdoteStartedAt = new Date().toISOString();
    return true;
  }

  function endAnecdote(student) {
    var m = ensureMatrix(student);
    m.anecdoteActive = false;
    m.anecdoteSessions = (m.anecdoteSessions || 0) + 1;
    m.anecdoteStartedAt = null;
  }

  function gateStatus(student) {
    var m = ensureMatrix(student);
    var colIdx = m.columnIndex || 0;
    var pct = columnProgress(student, colIdx);
    var avg = m.avgResponseMs;
    var timeOk = avg == null || avg <= MAX_AVG_RESPONSE_MS;
    return {
      columnPct: pct,
      columnMastered: isColumnMastered(student, colIdx),
      avgResponseMs: avg,
      timeOk: timeOk,
      targetResponseMs: TARGET_RESPONSE_MS,
      hitsRequired: HITS_TO_MASTER,
      failStreak: m.failStreak[activeColumn(student).id] || 0
    };
  }

  function getApiContext(student, bundle) {
    if (!isMatrixBundle(bundle)) return null;
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var drill = getDrillPrompt(student);
    var gate = gateStatus(student);
    var cols = COLUMNS.map(function (c, i) {
      return c.sigla + (i <= (m.columnIndex || 0) ? ' ' + columnProgress(student, i) + '%' : ' 🔒');
    }).join(' | ');
    var drillLine = col.id === 'modal' && drill.modal
      ? drill.pronoun + ' + ' + drill.modal + ' + ' + drill.verb + ' — ' + col.formula
      : drill.pronoun + ' + ' + drill.verb + ' — ' + col.formula;
    return {
      bundleId: 'F0-matrix',
      activeColumn: col.id,
      sigla: col.sigla,
      phaseLabel: col.label,
      formula: col.formula,
      notation: col.notation,
      drillPrompt: drillLine,
      drillModal: drill.modal || null,
      drillVerb: drill.verb || null,
      columnProgress: gate.columnPct,
      columnsSummary: cols,
      anecdoteMode: !!m.anecdoteActive,
      anecdoteUnlocked: !!m.anecdoteUnlocked,
      gateMode: 'matrix-only',
      avgResponseMs: m.avgResponseMs,
      targetResponseMs: TARGET_RESPONSE_MS,
      timeOk: gate.timeOk,
      failStreak: gate.failStreak,
      cronogramHint: gate.failStreak >= 3 ? 'explain_alternate_channel' : 'normal',
      hitsRequired: HITS_TO_MASTER,
      masteryRequiredPct: 100,
      conversationPhase: isStructureComplete(student)
    };
  }

  function isStructureComplete(student) {
    for (var i = 0; i < COLUMNS.length; i++) {
      if (!isColumnMastered(student, i)) return false;
    }
    var m = ensureMatrix(student);
    var pulseOk = !!(m.pulseQuizPassed);
  if (!pulseOk && student) {
      pulseOk = !!(student.jillPulse && student.jillPulse.passed);
    }
    var anecdoteOk = (m.anecdoteSessions || 0) >= 1 || !!m.anecdoteEvaluated;
    var timeOk = m.avgResponseMs == null || m.avgResponseMs <= MAX_AVG_RESPONSE_MS;
    return pulseOk && anecdoteOk && timeOk;
  }

  function canonAssetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '/') return path;
    return '/' + path.replace(/^\//, '');
  }

  function renderCanonThumb(colId) {
    var ref = CANON_BY_COLUMN[colId] || CANON_BY_COLUMN.present;
    if (typeof JillCanonVisual !== 'undefined') {
      return JillCanonVisual.render(colId, ref);
    }
    var src = canonAssetUrl(ref.path) + '?v=20260707j';
    return '<div style="margin-top:4px;text-align:center;">'
      + '<img src="' + src + '" alt="' + escHtml(ref.title) + '" style="max-width:100%;width:min(100%,320px);height:auto;border-radius:8px;border:1px solid rgba(61,220,151,0.35);display:block;margin:0 auto;" loading="eager" decoding="async">'
      + '</div>';
  }

  /** Vista alumno en sesión: solo referencia visual (canon), sin barras ni prerequisitos. */
  function renderPanel(student, bundle) {
    if (!student || !isMatrixBundle(bundle)) return '';
    var col = activeColumn(student);
    var drill = getDrillPrompt(student);
    var drillLine = drill.modal
      ? drill.pronoun + ' + ' + drill.modal + ' + ' + drill.verb
      : drill.pronoun + ' + ' + drill.verb;
    return '<div id="jill-matrix-panel" style="margin-bottom:12px;">'
      + '<div style="font-size:12px;color:#ecfdf5;text-align:center;margin-bottom:6px;"><strong>' + col.sigla + '</strong> · ' + escHtml(drillLine) + '</div>'
      + renderCanonThumb(col.id)
      + '</div>';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  global.JillMatrix = {
    VERBS: VERBS,
    MODALS: MODALS,
    PRONOUNS: PRONOUNS,
    COLUMNS: COLUMNS,
    HITS_TO_MASTER: HITS_TO_MASTER,
    TARGET_RESPONSE_MS: TARGET_RESPONSE_MS,
    ensureMatrix: ensureMatrix,
    isMatrixBundle: isMatrixBundle,
    getApiContext: getApiContext,
    renderPanel: renderPanel,
    recordPractice: recordPractice,
    recordResponseTime: recordResponseTime,
    getDrillPrompt: getDrillPrompt,
    startAnecdote: startAnecdote,
    endAnecdote: endAnecdote,
    isAnecdoteMode: isAnecdoteMode,
    columnProgress: columnProgress,
    gateStatus: gateStatus,
    isColumnMastered: isColumnMastered,
    isStructureComplete: isStructureComplete
  };
})(typeof window !== 'undefined' ? window : globalThis);
