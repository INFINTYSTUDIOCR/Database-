/**
 * Nexora — speak complete lines while LLM streams; track what was already queued.
 */
var NexoraStreamVoice = (function () {
  'use strict';

  var emitted = 0;
  var turnActive = false;

  function beginTurn() {
    emitted = 0;
    turnActive = true;
  }

  function cancelTurn() {
    emitted = 0;
    turnActive = false;
  }

  function endTurn() {
    turnActive = false;
  }

  function isTurnActive() {
    return turnActive;
  }

  function readyLine(line) {
    if (!line || line.length < 12) return false;
    if (typeof nexoraReplyTtsReady === 'function') return nexoraReplyTtsReady(line);
    return (line.match(/\b\w+\b/g) || []).length >= 3;
  }

  function sentencesFrom(rawText, sanitizeFn) {
    var text = typeof sanitizeFn === 'function' ? sanitizeFn(String(rawText || '')) : prepareTtsLine(rawText);
    if (!text) return [];
    return splitTtsSentences(text);
  }

  function feed(rawText, sanitizeFn, queueLine, prefetchFn) {
    if (!turnActive) beginTurn();
    var sentences = sentencesFrom(rawText, sanitizeFn);
    if (!sentences.length) return;
    var complete = sentences.slice(0, sentences.length - 1);
    for (var i = emitted; i < complete.length; i++) {
      var line = prepareTtsLine(complete[i]);
      if (!readyLine(line)) continue;
      if (typeof prefetchFn === 'function') prefetchFn(line);
      if (typeof queueLine === 'function') queueLine(line);
      emitted++;
    }
  }

  function finalize(rawText, sanitizeFn, queueLine, prefetchFn) {
    var sentences = sentencesFrom(rawText, sanitizeFn);
    for (var i = emitted; i < sentences.length; i++) {
      var line = prepareTtsLine(sentences[i]);
      if (!readyLine(line)) continue;
      if (typeof prefetchFn === 'function') prefetchFn(line);
      if (typeof queueLine === 'function') queueLine(line);
      emitted++;
    }
    endTurn();
  }

  return {
    beginTurn: beginTurn,
    cancelTurn: cancelTurn,
    endTurn: endTurn,
    isTurnActive: isTurnActive,
    feed: feed,
    finalize: finalize
  };
})();
