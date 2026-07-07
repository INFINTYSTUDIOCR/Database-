/**
 * Motor de drills Infinity ù reglas del trainer en cliente (Jill + Alice).
 */
(function (global) {
  'use strict';

  var PRONOUNS = ['i', 'you', 'he', 'she', 'it', 'we', 'they'];
  var THIRD = { he: 1, she: 1, it: 1 };
  var LINKER_RE = /\b(and|but|however|because|so|therefore|although|furthermore|also|plus|then|when|while|after|before|as well as|in addition|on top of that|as a result|which means|despite)\b/i;

  var VERB_FORMS = {
    be: { base: 'be', pr3: 'is', ps: 'was', pp: 'been', ing: 'being' },
    have: { base: 'have', pr3: 'has', ps: 'had', pp: 'had', ing: 'having' },
    do: { base: 'do', pr3: 'does', ps: 'did', pp: 'done', ing: 'doing' },
    work: { base: 'work', pr3: 'works', ps: 'worked', pp: 'worked', ing: 'working' },
    study: { base: 'study', pr3: 'studies', ps: 'studied', pp: 'studied', ing: 'studying' },
    go: { base: 'go', pr3: 'goes', ps: 'went', pp: 'gone', ing: 'going' },
    make: { base: 'make', pr3: 'makes', ps: 'made', pp: 'made', ing: 'making' },
    take: { base: 'take', pr3: 'takes', ps: 'took', pp: 'taken', ing: 'taking' },
    get: { base: 'get', pr3: 'gets', ps: 'got', pp: 'gotten', ing: 'getting' },
    see: { base: 'see', pr3: 'sees', ps: 'saw', pp: 'seen', ing: 'seeing' },
    know: { base: 'know', pr3: 'knows', ps: 'knew', pp: 'known', ing: 'knowing' },
    think: { base: 'think', pr3: 'thinks', ps: 'thought', pp: 'thought', ing: 'thinking' },
    want: { base: 'want', pr3: 'wants', ps: 'wanted', pp: 'wanted', ing: 'wanting' },
    need: { base: 'need', pr3: 'needs', ps: 'needed', pp: 'needed', ing: 'needing' },
    say: { base: 'say', pr3: 'says', ps: 'said', pp: 'said', ing: 'saying' },
    tell: { base: 'tell', pr3: 'tells', ps: 'told', pp: 'told', ing: 'telling' }
  };

  var _cfg = null;
  var _load = null;

  function loadDrills() {
    if (_cfg) return Promise.resolve(_cfg);
    if (_load) return _load;
    _load = fetch('config/trainer-drills.json?v=20260707d')
      .then(function (r) { return r.ok ? r.json() : { drills: {} }; })
      .then(function (d) { _cfg = d; return d; })
      .catch(function () { _cfg = { drills: {} }; return _cfg; });
    return _load;
  }

  function countEnglishSentences(text) {
    var t = String(text || '').trim();
    if (!t) return 0;
    var parts = t.split(/(?<=[.!?])\s+/).filter(function (s) { return /[a-zA-Z]/.test(s); });
    if (parts.length > 1) return parts.length;
    if (/[.!?]/.test(t)) return 1;
    return /[a-zA-Z]{3,}/.test(t) ? 1 : 0;
  }

  function englishWordCount(text) {
    return (String(text || '').match(/\b[a-zA-Z']+\b/g) || []).length;
  }

  function detectPronoun(text) {
    var m = String(text || '').toLowerCase().match(/\b(i|you|he|she|it|we|they)\b/);
    return m ? m[1] : null;
  }

  function validateMatrixSentence(text, matrixContext) {
    if (!matrixContext || matrixContext.bundleId !== 'F0-matrix' || matrixContext.anecdoteMode || matrixContext.conversationPhase) {
      return { ok: null, issues: [] };
    }
    var raw = String(text || '').trim();
    var lower = raw.toLowerCase();
    var issues = [];
    var sigla = String(matrixContext.sigla || '').toUpperCase();
    var col = String(matrixContext.activeColumn || '').toLowerCase();
    var expectedP = String(matrixContext.drillPrompt || '').split('+')[0].trim().toLowerCase();
    var verb = matrixContext.drillVerb
      ? String(matrixContext.drillVerb).toLowerCase()
      : ((matrixContext.drillPrompt || '').match(/\+\s*([a-z]+)/i) || [])[1];
    if (verb) verb = String(verb).toLowerCase();
    var forms = verb && VERB_FORMS[verb] ? VERB_FORMS[verb] : null;
    var pronoun = detectPronoun(lower);

    if (!pronoun) issues.push('Falta pronombre (P).');
    else if (expectedP && pronoun !== expectedP) issues.push('Usù el pronombre del drill: ' + expectedP + '.');

    if (sigla === 'PR' || col === 'present') {
      if (forms && pronoun) {
        var hasForm = lower.indexOf(forms.base) >= 0 || (forms.pr3 && lower.indexOf(forms.pr3) >= 0);
        if (!hasForm) issues.push('Falta verbo (V): ' + verb + '.');
        if (THIRD[pronoun] && forms.pr3 && !new RegExp('\\b' + forms.pr3 + '\\b').test(lower)) {
          issues.push('3ù persona: ' + pronoun + ' + ' + forms.pr3 + ' (+s).');
        }
      }
    } else if (sigla === 'PS' || col === 'past') {
      if (forms && lower.indexOf(forms.ps) < 0) issues.push('Pasado (PS): ' + forms.ps + '.');
    } else if (sigla === 'PC' || col === 'progressive') {
      if (!/\b(am|is|are|was|were)\b/.test(lower)) issues.push('Falta To Be (PC).');
      if (forms && lower.indexOf(forms.ing) < 0) issues.push('Falta V+ing: ' + forms.ing + '.');
    } else if (sigla === 'PRP' || col === 'perfect') {
      if (!/\b(have|has|had)\b/.test(lower)) issues.push('Falta Have/Has/Had (PRP).');
      if (forms && lower.indexOf(forms.pp) < 0) issues.push('Falta participio: ' + forms.pp + '.');
    } else if (sigla === 'PPC' || col === 'combined') {
      if (!/\b(have|has|had)\b/.test(lower) || lower.indexOf('been') < 0) issues.push('Falta have/had + been (PPC).');
      if (forms && lower.indexOf(forms.ing) < 0) issues.push('Falta V+ing: ' + forms.ing + '.');
    } else if (sigla === 'MOD' || col === 'modal') {
      var modalWord = matrixContext.drillModal;
      if (!/\b(will|would|can|could|should|must|may|might)\b/.test(lower)) issues.push('Falta modal (M).');
      if (modalWord && lower.indexOf(String(modalWord).toLowerCase()) < 0) issues.push('Usù el modal del drill: ' + modalWord + '.');
      if (forms && lower.indexOf(forms.base) < 0) issues.push('Verbo base despuùs del modal: ' + (verb || forms.base) + '.');
    }
    if (raw.split(/\s+/).length < 3) issues.push('Complemento (C) muy corto.');
    return { ok: issues.length === 0, issues: issues };
  }

  function pickActiveDrill(student, tutor, bundle, matrixContext) {
    var drills = (_cfg && _cfg.drills) || {};
    var tb = (student && student.trainingBook || [])[0];
    if (tb && tb.kpi) {
      var keys = Object.keys(drills);
      for (var i = 0; i < keys.length; i++) {
        if (drills[keys[i]].kpi === tb.kpi && (drills[keys[i]].tutor || []).indexOf(tutor) >= 0) {
          return Object.assign({ id: keys[i] }, drills[keys[i]]);
        }
      }
    }
    var weak = ((student && student.quizWeakKpis) || []).concat((student && student.nemesisState && student.nemesisState.reinforcement) || []);
    if (bundle && (bundle.id === 'F0-matrix' || bundle.gateMode === 'matrix-only')) {
      if (matrixContext && matrixContext.conversationPhase) {
        return Object.assign({ id: 'CONV_polish' }, drills.CONV_polish || { title: 'Conversaciùn Foundations', script: 'Jill escucha; estudiante habla.' });
      }
      return Object.assign({ id: 'MSI_matrix' }, drills.MSI_matrix || {});
    }
    if (weak.some(function (p) { return /k9|IG/i.test(p); }) && tutor !== 'jill') return Object.assign({ id: 'IG_critical' }, drills.IG_critical || {});
    if (weak.some(function (p) { return /k8|ST/i.test(p); }) && tutor !== 'jill') return Object.assign({ id: 'ST_critical' }, drills.ST_critical || {});
    if (tutor === 'jill') return Object.assign({ id: 'MSI_matrix' }, drills.MSI_matrix || {});
    return Object.assign({ id: 'ST_critical' }, drills.ST_critical || {});
  }

  function evaluateTurn(text, opts) {
    opts = opts || {};
    var student = opts.student;
    var tutor = opts.tutor || 'jill';
    var bundle = opts.bundle;
    var matrixContext = opts.matrixContext;
    var responseMs = opts.responseMs;
    var drill = pickActiveDrill(student, tutor, bundle, matrixContext);
    var result = {
      drillId: drill.id || null,
      drillTitle: drill.title || null,
      forcedReply: null,
      structureOk: null,
      issues: [],
      coachNote: ''
    };

    if (!text || !String(text).trim()) {
      result.forcedReply = drill.forcedReply || 'Say something in English.';
      return result;
    }

    if (matrixContext && matrixContext.conversationPhase && !matrixContext.anecdoteMode) {
      var w = englishWordCount(text);
      if (w < 2) {
        result.forcedReply = 'Keep going ù say more in English.';
        return result;
      }
      result.coachNote = 'Fase conversaciùn ù Jill evalùa tiempo verbal, coordinaciùn, lùgica y fluidez.';
      result.structureOk = null;
      return result;
    }

    if (drill.id === 'MSI_matrix' || (matrixContext && matrixContext.bundleId === 'F0-matrix' && !matrixContext.anecdoteMode && !matrixContext.conversationPhase)) {
      var v = validateMatrixSentence(text, matrixContext);
      result.structureOk = v.ok;
      result.issues = v.issues;
      if (v.ok === false) result.coachNote = 'Ranuras: ' + v.issues.join(' ');
      else if (v.ok === true) result.coachNote = 'Estructura MSIù vùlida.';
      return result;
    }

    var sentences = countEnglishSentences(text);
    var words = englishWordCount(text);

    if (drill.id === 'IG_critical' && sentences < (drill.minSentences || 3)) {
      result.forcedReply = drill.forcedReply || 'Keep going.';
      result.issues.push('Menos de ' + (drill.minSentences || 3) + ' oraciones.');
      return result;
    }
    if (drill.id === 'ST_critical' && tutor === 'alice' && sentences >= (drill.minSentences || 2) && drill.requireLinker && !LINKER_RE.test(text)) {
      result.forcedReply = drill.forcedReply || 'Add a linker ù keep going.';
      result.issues.push('Falta linker.');
      return result;
    }
    if (drill.id === 'RA_critical' && words < (drill.minWords || 1)) {
      result.forcedReply = drill.forcedReply || 'Say anything in English ù start now.';
      return result;
    }
    if (drill.id === 'R_critical' && responseMs && responseMs > (drill.maxResponseMs || 12000)) {
      result.coachNote = 'Meta respuesta <12s.';
    }

    result.structureOk = sentences >= 1 && words >= 2;
    return result;
  }

  global.TrainerDrill = {
    loadDrills: loadDrills,
    evaluateTurn: evaluateTurn,
    validateMatrixSentence: validateMatrixSentence,
    pickActiveDrill: pickActiveDrill
  };
})(typeof window !== 'undefined' ? window : global);
