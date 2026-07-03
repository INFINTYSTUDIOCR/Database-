/**
 * Alice — claridad / pronunciación estimada desde transcripción (sin API fonética).
 */
(function (global) {
  'use strict';

  var FILLERS = /\b(um+|uh+|erm+|eh+|like|you know|sort of|kind of)\b/gi;

  function tokenize(text) {
    return (String(text || '').toLowerCase().match(/\b[a-z']{2,}\b/g) || []);
  }

  function scoreClarityFromHistory(history) {
    var users = (history || []).filter(function (m) {
      return m.role === 'user' && String(m.content || '').trim();
    });
    if (!users.length) return { clarity_score: 0, fillers: 0, avg_words_per_turn: 0, unique_words: 0 };

    var allText = users.map(function (m) { return String(m.content); }).join(' ');
    var words = tokenize(allText);
    var fillers = (allText.match(FILLERS) || []).length;
    var unique = new Set(words);
    var avgTurn = words.length / users.length;

    var score = 48;
    score += Math.min(28, avgTurn * 4);
    score += Math.min(18, unique.size * 0.8);
    score -= fillers * 6;
    if (avgTurn >= 8) score += 8;
    score = Math.max(35, Math.min(96, Math.round(score)));

    return {
      clarity_score: score,
      fillers: fillers,
      avg_words_per_turn: Math.round(avgTurn * 10) / 10,
      unique_words: unique.size
    };
  }

  function renderClarityHtml(metrics) {
    if (!metrics || !metrics.clarity_score) return '';
    var col = metrics.clarity_score >= 75 ? '#86EFAC' : (metrics.clarity_score >= 55 ? '#FCD34D' : '#FCA5A5');
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;background:rgba(255,255,255,0.05);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">'
      + '<div style="font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">CLARIDAD AL HABLAR</div>'
      + '<div style="margin-left:auto;font-size:20px;font-weight:900;color:' + col + ';">' + metrics.clarity_score + '<span style="font-size:11px;opacity:0.5;">/100</span></div>'
      + '</div>';
  }

  global.AlicePronunciation = {
    scoreClarityFromHistory: scoreClarityFromHistory,
    renderClarityHtml: renderClarityHtml
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
