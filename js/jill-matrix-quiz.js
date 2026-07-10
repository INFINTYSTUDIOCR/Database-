/**
 * Jill F0 - Rapid drill atado a celdas de la matriz (pronombre x verbo x columna).
 * Compartido cliente + servidor Node.
 */
(function (global) {
  'use strict';

  var VERBS = ['be', 'have', 'do', 'work', 'study', 'go', 'make', 'take', 'get', 'see', 'know', 'think', 'want', 'need', 'say', 'tell'];
  var PRONOUNS = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  var MODALS = ['will', 'would', 'can', 'could', 'should'];
  var HITS_TO_MASTER = 3;

  var COLUMNS = [
    { id: 'present', sigla: 'PR', label: 'Presente simple' },
    { id: 'past', sigla: 'PS', label: 'Pasado simple' },
    { id: 'progressive', sigla: 'PC', label: 'Presente continuo' },
    { id: 'perfect', sigla: 'PRP', label: 'Presente perfecto' },
    { id: 'combined', sigla: 'PPC', label: 'Perfecto continuo' },
    { id: 'modal', sigla: 'MOD', label: 'Modales' }
  ];

  /** Complementos por columna - evita PR + "now" / PS + "now" (preguntas incoherentes). */
  var COMPLEMENTS_BY_COL = {
    present: ['every day', 'at home', 'at the office', 'hard', 'English', 'today'],
    past: ['yesterday', 'before', 'at home', 'at the office', 'hard'],
    progressive: ['now', 'today', 'at the office', 'hard', 'English'],
    perfect: ['before', 'today', 'this week', 'already'],
    combined: ['today', 'all week', 'hard', 'at the office'],
    modal: ['soon', 'today', 'at the office', 'hard', 'English']
  };

  var VERB_FORMS = {
    be: { base: 'be', pres: { I: 'am', you: 'are', he: 'is', she: 'is', it: 'is', we: 'are', they: 'are' }, past: { I: 'was', you: 'were', he: 'was', she: 'was', it: 'was', we: 'were', they: 'were' }, pp: 'been', ing: 'being' },
    have: { base: 'have', pres: { I: 'have', you: 'have', he: 'has', she: 'has', it: 'has', we: 'have', they: 'have' }, past: { all: 'had' }, pp: 'had', ing: 'having' },
    do: { base: 'do', pres: { I: 'do', you: 'do', he: 'does', she: 'does', it: 'does', we: 'do', they: 'do' }, past: { all: 'did' }, pp: 'done', ing: 'doing' },
    work: { base: 'work', regular: true },
    study: { base: 'study', regularY: true },
    go: { base: 'go', pres3: 'goes', past: { all: 'went' }, pp: 'gone', ing: 'going' },
    make: { base: 'make', pres3: 'makes', past: { all: 'made' }, pp: 'made', ing: 'making' },
    take: { base: 'take', pres3: 'takes', past: { all: 'took' }, pp: 'taken', ing: 'taking' },
    get: { base: 'get', pres3: 'gets', past: { all: 'got' }, pp: 'gotten', ing: 'getting' },
    see: { base: 'see', pres3: 'sees', past: { all: 'saw' }, pp: 'seen', ing: 'seeing' },
    know: { base: 'know', pres3: 'knows', past: { all: 'knew' }, pp: 'known', ing: 'knowing' },
    think: { base: 'think', pres3: 'thinks', past: { all: 'thought' }, pp: 'thought', ing: 'thinking' },
    want: { base: 'want', regular: true },
    need: { base: 'need', regular: true },
    say: { base: 'say', pres3: 'says', past: { all: 'said' }, pp: 'said', ing: 'saying' },
    tell: { base: 'tell', pres3: 'tells', past: { all: 'told' }, pp: 'told', ing: 'telling' }
  };

  function presForm(verb, pronoun) {
    var f = VERB_FORMS[verb] || { base: verb };
    if (f.pres && f.pres[pronoun]) return f.pres[pronoun];
    if (f.regularY) return (pronoun === 'he' || pronoun === 'she' || pronoun === 'it') ? verb.replace(/y$/, 'ies') : verb;
    if (f.regular) return (pronoun === 'he' || pronoun === 'she' || pronoun === 'it') ? verb + 's' : verb;
    if (f.pres3 && (pronoun === 'he' || pronoun === 'she' || pronoun === 'it')) return f.pres3;
    return f.base || verb;
  }

  function pastForm(verb, pronoun) {
    var f = VERB_FORMS[verb] || { base: verb };
    if (f.past) {
      if (f.past.all) return f.past.all;
      if (pronoun && f.past[pronoun]) return f.past[pronoun];
      return f.past.I || f.past.he || 'was';
    }
    if (f.regularY) return verb.replace(/y$/, 'ied');
    if (f.regular) return verb + 'ed';
    return (f.base || verb) + 'ed';
  }

  function baseForm(verb) {
    var f = VERB_FORMS[verb] || { base: verb };
    return f.base || verb;
  }

  function pickComplement(colId, seed) {
    var list = COMPLEMENTS_BY_COL[colId] || COMPLEMENTS_BY_COL.present;
    return list[Math.abs(seed) % list.length];
  }

  /** Solo ASCII en el enunciado - el punto medio se rompe en algunos encodings. */
  function qPrefix(sigla, bits) {
    return 'Completa (' + sigla + ' - ' + bits + '): ';
  }

  function ppForm(verb) {
    var f = VERB_FORMS[verb] || { base: verb };
    if (f.pp) return f.pp;
    if (f.regularY) return verb.replace(/y$/, 'ied');
    if (f.regular) return verb + 'ed';
    return verb + 'ed';
  }

  function ingForm(verb) {
    var f = VERB_FORMS[verb] || { base: verb };
    if (f.ing) return f.ing;
    if (/e$/.test(verb) && verb !== 'be') return verb.replace(/e$/, '') + 'ing';
    return verb + 'ing';
  }

  function haveForm(pronoun) {
    return (pronoun === 'he' || pronoun === 'she' || pronoun === 'it') ? 'has' : 'have';
  }

  function tbPres(pronoun) {
    return presForm('be', pronoun);
  }

  function cellKey(pronoun, verb, colId) {
    return pronoun + '|' + verb + '|' + colId;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function uniqueOptions(correct, pool, n) {
    var opts = [correct];
    pool.forEach(function (o) {
      if (opts.length >= n) return;
      if (o && opts.indexOf(o) < 0) opts.push(o);
    });
    while (opts.length < n) {
      var filler = pool[opts.length % pool.length];
      if (filler && opts.indexOf(filler) < 0) opts.push(filler);
      else opts.push(correct + String(opts.length));
    }
    return shuffle(opts);
  }

  function answerIndex(options, correct) {
    var idx = options.indexOf(correct);
    return idx >= 0 ? idx : 0;
  }

  function activeColumn(student) {
    var m = student && student.jillMatrix;
    var idx = m && m.columnIndex != null ? m.columnIndex : 0;
    return COLUMNS[Math.min(idx, COLUMNS.length - 1)];
  }

  function drillCursor(student) {
    return (student && student.jillMatrix && student.jillMatrix.drillCursor) || 0;
  }

  function getDrillCell(student) {
    var col = activeColumn(student);
    var cursor = drillCursor(student);
    var vi = cursor % VERBS.length;
    var pi = Math.floor(cursor / VERBS.length) % PRONOUNS.length;
    var modal = col.id === 'modal' ? MODALS[cursor % MODALS.length] : null;
    return { pronoun: PRONOUNS[pi], verb: VERBS[vi], column: col, modal: modal };
  }

  function weakCells(student, limit) {
    var m = (student && student.jillMatrix) || {};
    var cells = m.cells || {};
    var col = activeColumn(student);
    var out = [];
    PRONOUNS.forEach(function (p) {
      VERBS.forEach(function (v) {
        var hits = cells[cellKey(p, v, col.id)] || 0;
        if (hits < HITS_TO_MASTER) out.push({ pronoun: p, verb: v, column: col, hits: hits, modal: col.id === 'modal' ? MODALS[out.length % MODALS.length] : null });
      });
    });
    out.sort(function (a, b) { return a.hits - b.hits; });
    return out.slice(0, limit || 8);
  }

  function buildQuestion(cell) {
    var p = cell.pronoun;
    var v = cell.verb;
    var col = cell.column;
    var modal = cell.modal || MODALS[0];
    var comp = pickComplement(col.id, p.length + v.length + (col.sigla || '').length);
    var correct = '';
    var q = '';
    var pool = [];
    var explain = '';
    var base = baseForm(v);

    if (col.id === 'present') {
      correct = presForm(v, p);
      q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ___ ' + comp + '.';
      pool = [presForm(v, 'he'), pastForm(v, p), ingForm(v), presForm(v, p === 'I' ? 'you' : 'I')];
      explain = col.sigla + ': ' + p + ' + ' + correct + ' + C.';
    } else if (col.id === 'past') {
      correct = pastForm(v, p);
      q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ___ ' + comp + '.';
      pool = [presForm(v, p), ingForm(v), ppForm(v), pastForm(v === 'go' ? 'make' : v, p)];
      explain = col.sigla + ': pasado -> ' + correct + '.';
    } else if (col.id === 'progressive') {
      if (Math.random() < 0.5) {
        correct = tbPres(p);
        q = qPrefix(col.sigla, p + ' + ' + v + '-ing') + p + ' ___ ' + ingForm(v) + ' ' + comp + '.';
        pool = [presForm('be', p === 'I' ? 'you' : 'I'), 'was', 'were', 'been'];
        explain = 'PC: To Be (' + correct + ') + -ing.';
      } else {
        correct = ingForm(v);
        q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ' + tbPres(p) + ' ___ ' + comp + '.';
        pool = [presForm(v, p), pastForm(v, p), ppForm(v), ingForm(v === 'work' ? 'study' : v)];
        explain = 'PC: ' + tbPres(p) + ' + ' + correct + '.';
      }
    } else if (col.id === 'perfect') {
      if (Math.random() < 0.45) {
        correct = haveForm(p);
        q = qPrefix(col.sigla, p + ' + have + ' + v) + p + ' ___ ' + ppForm(v) + ' ' + comp + '.';
        pool = ['have', 'has', 'had', 'having'];
        explain = 'PRP: ' + correct + ' + participio (' + ppForm(v) + ').';
      } else {
        correct = ppForm(v);
        q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ' + haveForm(p) + ' ___ ' + comp + '.';
        pool = [presForm(v, p), pastForm(v, p), ingForm(v), ppForm(v === 'see' ? 'know' : v)];
        explain = 'PRP: have + participio -> ' + correct + '.';
      }
    } else if (col.id === 'combined') {
      if (Math.random() < 0.45) {
        correct = 'been';
        q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ' + haveForm(p) + ' ___ ' + ingForm(v) + ' ' + comp + '.';
        pool = ['be', 'being', 'was', 'were'];
        explain = 'PPC: have + been + -ing.';
      } else {
        correct = ingForm(v);
        q = qPrefix(col.sigla, p + ' + ' + v) + p + ' ' + haveForm(p) + ' been ___ ' + comp + '.';
        pool = [presForm(v, p), pastForm(v, p), ppForm(v), ingForm(v === 'work' ? 'go' : v)];
        explain = 'PPC: have been + ' + correct + '.';
      }
    } else {
      if (Math.random() < 0.5) {
        correct = modal;
        q = qPrefix(col.sigla, p + ' + ' + modal + ' + ' + v) + p + ' ___ ' + base + ' ' + comp + '.';
        pool = MODALS.slice();
        explain = 'MOD: ' + modal + ' + verbo base.';
      } else {
        correct = base;
        q = qPrefix(col.sigla, p + ' + ' + modal) + p + ' ' + modal + ' ___ ' + comp + '.';
        pool = [pastForm(v, p), ingForm(v), ppForm(v), presForm(v, p === 'I' ? 'they' : 'I')];
        explain = 'MOD: modal + verbo base -> ' + correct + '.';
      }
    }

    var options = uniqueOptions(correct, pool, 4);
    return {
      kpi: 'k3',
      category: 'tense',
      topic: 'matrix-' + col.id,
      q: q,
      options: options,
      answer: answerIndex(options, correct),
      explain: explain,
      matrixCell: cellKey(p, v, col.id),
      matrixSigla: col.sigla
    };
  }

  function pickQuestions(student, count) {
    count = count || 5;
    if (!student) return [];
    var seen = {};
    var out = [];
    var cells = [];

    cells.push(getDrillCell(student));
    weakCells(student, 12).forEach(function (c) { cells.push(c); });

    shuffle(cells).forEach(function (cell) {
      if (out.length >= count) return;
      var key = cellKey(cell.pronoun, cell.verb, cell.column.id);
      if (seen[key]) return;
      seen[key] = true;
      out.push(buildQuestion(cell));
    });

    var guard = 0;
    while (out.length < count && guard++ < 40) {
      var rnd = {
        pronoun: PRONOUNS[guard % PRONOUNS.length],
        verb: VERBS[guard % VERBS.length],
        column: activeColumn(student),
        modal: MODALS[guard % MODALS.length]
      };
      var k2 = cellKey(rnd.pronoun, rnd.verb, rnd.column.id);
      if (seen[k2]) continue;
      seen[k2] = true;
      out.push(buildQuestion(rnd));
    }

    return shuffle(out).slice(0, count);
  }

  global.JillMatrixQuiz = {
    pickQuestions: pickQuestions,
    buildQuestion: buildQuestion,
    getDrillCell: getDrillCell,
    VERBS: VERBS,
    PRONOUNS: PRONOUNS,
    COLUMNS: COLUMNS
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.JillMatrixQuiz;
}
