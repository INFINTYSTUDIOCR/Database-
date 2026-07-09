/**
 * Vocabulario gradual Jill — palabras usadas en práctica, no listas muertas.
 */
(function (global) {
  'use strict';

  var MAX_ACTIVE = 24;
  var SEED = ['work', 'study', 'home', 'today', 'yesterday', 'office', 'family', 'time', 'meeting', 'because'];

  function ensureVocab(student) {
    if (!student) return null;
    if (!student.jillVocab || typeof student.jillVocab !== 'object') {
      student.jillVocab = { active: SEED.slice(), used: {}, addedAt: {} };
    }
    if (!Array.isArray(student.jillVocab.active)) student.jillVocab.active = SEED.slice();
    if (!student.jillVocab.used) student.jillVocab.used = {};
    return student.jillVocab;
  }

  function normalizeWord(w) {
    return String(w || '').toLowerCase().replace(/[^a-z'-]/g, '').trim();
  }

  function addWord(student, word, source) {
    var v = ensureVocab(student);
    var w = normalizeWord(word);
    if (!w || w.length < 2 || w.length > 24) return false;
    var skip = { the: 1, and: 1, you: 1, are: 1, was: 1, have: 1, with: 1, for: 1, this: 1, that: 1 };
    if (skip[w]) return false;
    if (v.active.indexOf(w) < 0) {
      if (v.active.length >= MAX_ACTIVE) v.active.shift();
      v.active.push(w);
      v.addedAt[w] = new Date().toISOString().slice(0, 10);
    }
    v.used[w] = (v.used[w] || 0) + 1;
    if (source) v.lastSource = source;
    return true;
  }

  function harvestFromText(student, text) {
    if (!text) return;
    String(text).toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).forEach(function (tok) {
      if (tok.length >= 4) addWord(student, tok, 'harvest');
    });
  }

  function getActiveList(student, limit) {
    var v = ensureVocab(student);
    limit = limit || 12;
    return (v.active || []).slice(-limit);
  }

  function getApiContext(student) {
    var list = getActiveList(student, 16);
    return {
      activeWords: list,
      total: (ensureVocab(student).active || []).length,
      rule: 'Usá solo vocab de la lista activa o del drill; agregá 1 palabra nueva por sesión en contexto.'
    };
  }

  function renderRecursosCard(student) {
    var list = getActiveList(student, 10);
    if (!list.length) return '';
    return '<div style="margin-top:10px;font-size:12px;color:var(--t2);">'
      + '<strong>Tu vocab activo Jill</strong> (gradual): '
      + list.map(function (w) { return '<code style="background:var(--gray);padding:2px 6px;border-radius:4px;margin:2px;">' + w + '</code>'; }).join(' ')
      + '</div>';
  }

  global.JillVocab = {
    ensureVocab: ensureVocab,
    addWord: addWord,
    harvestFromText: harvestFromText,
    getActiveList: getActiveList,
    getApiContext: getApiContext,
    renderRecursosCard: renderRecursosCard,
    MAX_ACTIVE: MAX_ACTIVE
  };
})(typeof window !== 'undefined' ? window : globalThis);
