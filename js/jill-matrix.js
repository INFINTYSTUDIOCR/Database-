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
  var WRITTEN_DAYS_REQUIRED = 22;

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
        drillStartedAt: null,
        writtenDaysCompleted: 0,
        writtenPhaseLastDate: null,
        allColumnsMastered: false
      };
    }
    if (!student.jillMatrix.cells) student.jillMatrix.cells = {};
    if (!student.jillMatrix.responseSamples) student.jillMatrix.responseSamples = [];
    if (!student.jillMatrix.failStreak) student.jillMatrix.failStreak = {};
    if (student.jillMatrix.writtenDaysCompleted == null) student.jillMatrix.writtenDaysCompleted = 0;
    if (student.jillMatrix.allColumnsMastered == null) student.jillMatrix.allColumnsMastered = false;
    return student.jillMatrix;
  }

  function allColumnsMastered(student) {
    for (var i = 0; i < COLUMNS.length; i++) {
      if (!isColumnMastered(student, i)) return false;
    }
    return true;
  }

  function syncMatrixFlags(student) {
    var m = ensureMatrix(student);
    m.allColumnsMastered = allColumnsMastered(student);
    if (m.allColumnsMastered && !m.anecdoteUnlocked) m.anecdoteUnlocked = true;
    return m;
  }

  function recordWrittenDay(student) {
    var m = ensureMatrix(student);
    var today = new Date().toISOString().slice(0, 10);
    if (m.writtenPhaseLastDate === today) return m.writtenDaysCompleted || 0;
    m.writtenDaysCompleted = (m.writtenDaysCompleted || 0) + 1;
    m.writtenPhaseLastDate = today;
    return m.writtenDaysCompleted;
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
    syncMatrixFlags(student);
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
    syncMatrixFlags(student);
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
      drillQuestionPrompt: 'Pregunta (moneda): invertir aux/be/modal al frente — mismo pronombre+verbo/columna.',
      conjugationRule: 'Rotar pronombres y tiempos; afirmacion + pregunta cada practica.',
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
      allColumnsMastered: !!m.allColumnsMastered,
      writtenDaysCompleted: m.writtenDaysCompleted || 0,
      writtenDaysRequired: WRITTEN_DAYS_REQUIRED,
      writtenPhaseOk: (m.writtenDaysCompleted || 0) >= WRITTEN_DAYS_REQUIRED,
      linkersFoundations: 'and, but, because, so',
      conversationPhase: isStructureComplete(student)
    };
  }

  function isStructureComplete(student) {
    syncMatrixFlags(student);
    if (!allColumnsMastered(student)) return false;
    var m = ensureMatrix(student);
    var pulseOk = !!(m.pulseQuizPassed);
    if (!pulseOk && student) {
      pulseOk = !!(student.jillPulse && student.jillPulse.passed);
    }
    var anecdoteOk = (m.anecdoteSessions || 0) >= 1 || !!m.anecdoteEvaluated;
    var timeOk = m.avgResponseMs == null || m.avgResponseMs <= MAX_AVG_RESPONSE_MS;
    var writtenOk = (m.writtenDaysCompleted || 0) >= WRITTEN_DAYS_REQUIRED;
    return pulseOk && anecdoteOk && timeOk && writtenOk;
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

  function renderGateChecklist(student) {
    if (typeof JillF0Gate === 'undefined') return '';
    var check = JillF0Gate.f0ExitChecklist(student);
    if (check.ok) {
      return '<div style="margin-top:8px;padding:8px 10px;background:rgba(61,220,151,0.15);border:1px solid rgba(134,239,172,0.45);border-radius:10px;font-size:11px;color:#bbf7d0;text-align:center;font-weight:700;">✓ F0 completo — podés avanzar a F1</div>';
    }
    var rows = check.items.map(function (it) {
      var icon = it.ok ? '✓' : '○';
      var col = it.ok ? '#86EFAC' : 'rgba(255,255,255,0.55)';
      return '<div style="font-size:10px;color:' + col + ';margin:2px 0;">' + icon + ' ' + escHtml(it.label) + '</div>';
    }).join('');
    return '<div style="margin-top:8px;padding:10px;background:rgba(0,0,0,0.22);border:1px solid rgba(61,220,151,0.3);border-radius:10px;">'
      + '<div style="font-size:10px;font-weight:800;color:#bbf7d0;letter-spacing:0.06em;margin-bottom:6px;">GATE F0 — para avanzar de bundle</div>'
      + rows
      + '</div>';
  }

  function renderWrittenDayPanel(student) {
    var m = ensureMatrix(student);
    var done = m.writtenDaysCompleted || 0;
    var pct = Math.min(100, Math.round((done / WRITTEN_DAYS_REQUIRED) * 100));
    var today = new Date().toISOString().slice(0, 10);
    var alreadyToday = m.writtenPhaseLastDate === today;
    var btnLabel = alreadyToday ? '✓ Hoy registrado' : 'Registrar práctica escrita de hoy';
    var btnStyle = alreadyToday
      ? 'background:rgba(61,220,151,0.2);border:1px solid rgba(134,239,172,0.5);color:#86EFAC;cursor:default;'
      : 'background:linear-gradient(135deg,#0a5c3c,#0e7a50);border:none;color:white;cursor:pointer;';
    return '<div style="margin-top:10px;padding:10px;background:rgba(0,0,0,0.25);border:1px solid rgba(61,220,151,0.35);border-radius:10px;">'
      + '<div style="font-size:10px;font-weight:800;color:#bbf7d0;letter-spacing:0.06em;">CUADERNO · 15+10 min/día</div>'
      + '<div style="font-size:12px;color:#ecfdf5;margin:6px 0;">Día ' + done + '/' + WRITTEN_DAYS_REQUIRED + '</div>'
      + '<div style="height:4px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;margin-bottom:8px;">'
      + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3DDC97,#86EFAC);"></div>'
      + '</div>'
      + '<button type="button" id="jill-written-day-btn" onclick="jillRecordWrittenDay()" style="width:100%;font-size:11px;font-weight:800;padding:8px 12px;border-radius:8px;' + btnStyle + '">' + btnLabel + '</button>'
      + '<div style="font-size:9px;color:rgba(255,255,255,0.45);margin-top:6px;text-align:center;">Un registro por día · obligatorio antes de conversación oral</div>'
      + '</div>';
  }

  /** Vista alumno en sesión: canon + progreso escrito + gate F0. */
  function renderPanel(student, bundle) {
    if (!student || !isMatrixBundle(bundle)) return '';
    var col = activeColumn(student);
    var drill = getDrillPrompt(student);
    var gate = gateStatus(student);
    var drillLine = drill.modal
      ? drill.pronoun + ' + ' + drill.modal + ' + ' + drill.verb
      : drill.pronoun + ' + ' + drill.verb;
    return '<div id="jill-matrix-panel" style="margin-bottom:12px;">'
      + '<div style="font-size:12px;color:#ecfdf5;text-align:center;margin-bottom:6px;"><strong>' + col.sigla + '</strong> · ' + escHtml(drillLine) + ' · ' + gate.columnPct + '%</div>'
      + renderCanonThumb(col.id)
      + renderWrittenDayPanel(student)
      + renderGateChecklist(student)
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
    allColumnsMastered: allColumnsMastered,
    isStructureComplete: isStructureComplete,
    recordWrittenDay: recordWrittenDay,
    renderWrittenDayPanel: renderWrittenDayPanel,
    renderGateChecklist: renderGateChecklist,
    WRITTEN_DAYS_REQUIRED: WRITTEN_DAYS_REQUIRED
  };
})(typeof window !== 'undefined' ? window : globalThis);
