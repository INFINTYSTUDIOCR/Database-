/**
 * Jill F0 — Matriz estructural: pronombres × 16 verbos × columnas de tiempo.
 * Gate: solo matriz hasta dominar; luego ritual anécdota 15 min.
 */
(function (global) {
  'use strict';

  var VERBS = ['be', 'have', 'do', 'work', 'study', 'go', 'make', 'take', 'get', 'see', 'know', 'think', 'want', 'need', 'say', 'tell'];
  var PRONOUNS = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  var HITS_TO_MASTER = 2;
  var MASTERY_RATIO = 0.72;

  var COLUMNS = [
    { id: 'present', label: 'Col 1 · Presente', formula: 'Pronombre + verbo (presente) + complemento' },
    { id: 'past', label: 'Col 2 · Pasado simple', formula: 'Pronombre + verbo (pasado) + complemento' },
    { id: 'progressive', label: 'Col 3 · Progresivo', formula: 'Pronombre + To Be + verbo(-ing) + complemento' },
    { id: 'perfect', label: 'Col 4 · Perfecto', formula: 'Pronombre + Have/Has/Had + participio + complemento' },
    { id: 'combined', label: 'Col 5 · Combinado', formula: 'Pronombre + Have/Has + participio + (To Be) + verbo(-ing)' }
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
        anecdoteStartedAt: null
      };
    }
    if (!student.jillMatrix.cells) student.jillMatrix.cells = {};
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

  function unlockedColumnCount(student) {
    return Math.min((ensureMatrix(student).columnIndex || 0) + 1, COLUMNS.length);
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

  function tryAdvanceColumn(student) {
    var m = ensureMatrix(student);
    var idx = m.columnIndex || 0;
    if (idx >= COLUMNS.length - 1) {
      m.anecdoteUnlocked = true;
      return false;
    }
    if (columnProgress(student, idx) >= Math.round(MASTERY_RATIO * 100)) {
      m.columnIndex = idx + 1;
      m.drillCursor = 0;
      if (m.columnIndex >= COLUMNS.length - 1 && columnProgress(student, m.columnIndex) >= Math.round(MASTERY_RATIO * 100)) {
        m.anecdoteUnlocked = true;
      }
      return true;
    }
    return false;
  }

  function recordPractice(student, ok) {
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var total = PRONOUNS.length * VERBS.length;
    var cursor = m.drillCursor || 0;
    var vi = cursor % VERBS.length;
    var pi = Math.floor(cursor / VERBS.length) % PRONOUNS.length;
    var pronoun = PRONOUNS[pi];
    var verb = VERBS[vi];
    var key = cellKey(pronoun, verb, col.id);
    if (ok) {
      m.cells[key] = (m.cells[key] || 0) + 1;
      tryAdvanceColumn(student);
    }
    m.drillCursor = (cursor + 1) % total;
    return { pronoun: pronoun, verb: verb, column: col };
  }

  function getDrillPrompt(student) {
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var total = PRONOUNS.length * VERBS.length;
    var cursor = m.drillCursor || 0;
    var vi = cursor % VERBS.length;
    var pi = Math.floor(cursor / VERBS.length) % PRONOUNS.length;
    return {
      pronoun: PRONOUNS[pi],
      verb: VERBS[vi],
      column: col,
      formula: col.formula,
      instruction: 'Practica UNA oración: ' + PRONOUNS[pi] + ' + ' + VERBS[vi] + ' (' + col.label + '). Estructura, no traducción.'
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
    if (!m.anecdoteUnlocked && (m.columnIndex || 0) < COLUMNS.length - 1) return false;
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

  function getApiContext(student, bundle) {
    if (!isMatrixBundle(bundle)) return null;
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var drill = getDrillPrompt(student);
    var cols = COLUMNS.map(function (c, i) {
      return c.label + (i <= (m.columnIndex || 0) ? ' ' + columnProgress(student, i) + '%' : ' (bloqueada)');
    }).join(' | ');
    return {
      bundleId: 'F0-matrix',
      activeColumn: col.id,
      phaseLabel: col.label,
      formula: col.formula,
      drillPrompt: drill.pronoun + ' + ' + drill.verb + ' — ' + col.formula,
      columnProgress: columnProgress(student, m.columnIndex || 0),
      columnsSummary: cols,
      anecdoteMode: !!m.anecdoteActive,
      anecdoteUnlocked: !!m.anecdoteUnlocked,
      gateMode: 'matrix-only'
    };
  }

  function renderPanel(student, bundle) {
    if (!student || !isMatrixBundle(bundle)) return '';
    var m = ensureMatrix(student);
    var col = activeColumn(student);
    var pct = columnProgress(student, m.columnIndex || 0);
    var drill = getDrillPrompt(student);
    var colBars = COLUMNS.map(function (c, i) {
      var locked = i > (m.columnIndex || 0);
      var p = locked ? 0 : columnProgress(student, i);
      return '<div style="margin:4px 0;font-size:10px;color:' + (locked ? 'rgba(255,255,255,0.35)' : '#bbf7d0') + ';">'
        + c.label + (locked ? ' 🔒' : ' — ' + p + '%')
        + '<div style="height:4px;background:rgba(0,0,0,0.25);border-radius:4px;margin-top:2px;"><div style="width:' + p + '%;height:100%;background:#3DDC97;border-radius:4px;"></div></div></div>';
    }).join('');
    var anecdoteBtn = m.anecdoteUnlocked
      ? '<button type="button" class="jill-chip" onclick="jillMatrixStartAnecdote()" style="border-color:#F5A623;color:#FCD34D;">📓 Anécdota 15 min</button>'
      : '';
    return '<div id="jill-matrix-panel" style="background:rgba(10,92,60,0.35);border:1px solid rgba(61,220,151,0.45);border-radius:12px;padding:12px;margin-bottom:12px;">'
      + '<div style="font-size:11px;font-weight:800;color:#86EFAC;letter-spacing:0.06em;margin-bottom:6px;">MATRIZ ESTRUCTURAL · F0</div>'
      + '<div style="font-size:12px;color:#ecfdf5;margin-bottom:8px;"><strong>' + col.label + '</strong><br><span style="opacity:0.85;">' + col.formula + '</span></div>'
      + '<div style="font-size:11px;background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;margin-bottom:8px;color:#fff;">'
      + '🎯 Practica: <strong>' + drill.pronoun + '</strong> + <strong>' + drill.verb + '</strong> — ' + pct + '% columna</div>'
      + colBars
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">'
      + '<button type="button" class="jill-chip" onclick="jillMatrixMark(true)">✓ Lo dominé</button>'
      + anecdoteBtn
      + '</div>'
      + (m.anecdoteActive ? '<div style="font-size:11px;color:#FCD34D;margin-top:8px;">📓 Modo anécdota — escribí 15 min en cuaderno, pegá o leé el texto. Jill corrige estructura y tiempos.</div>' : '')
      + '</div>';
  }

  global.JillMatrix = {
    VERBS: VERBS,
    PRONOUNS: PRONOUNS,
    COLUMNS: COLUMNS,
    ensureMatrix: ensureMatrix,
    isMatrixBundle: isMatrixBundle,
    getApiContext: getApiContext,
    renderPanel: renderPanel,
    recordPractice: recordPractice,
    getDrillPrompt: getDrillPrompt,
    startAnecdote: startAnecdote,
    endAnecdote: endAnecdote,
    isAnecdoteMode: isAnecdoteMode,
    columnProgress: columnProgress
  };
})(typeof window !== 'undefined' ? window : globalThis);
