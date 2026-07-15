/**
 * Tutor reply parsing — strip JSON wrappers, never leak {"reply":...} to UI/TTS.
 */
(function (global) {
  'use strict';

  var JSON_LEAK = /^\s*\{\s*"reply"\s*:\s*"([\s\S]*?)"\s*,?\s*"contentType"[\s\S]*?\}\s*$/;
  var JSON_PREFIX = /^\s*\{\s*"reply"\s*:\s*"?/;

  function extractTutorReply(raw) {
    if (!raw) return '';
    var text = String(raw).trim();
    if (!text) return '';
    try {
      var clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      if (clean.charAt(0) === '{') {
        var parsed = JSON.parse(clean);
        if (parsed && parsed.reply) return String(parsed.reply).trim();
      }
    } catch (e) { /* partial JSON during stream */ }
    var m = text.match(/\{[\s\S]*?"reply"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (m) {
      try { return JSON.parse('"' + m[1] + '"'); } catch (e2) { return m[1].replace(/\\n/g, '\n'); }
    }
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(JSON_PREFIX, '')
      .replace(/"?\s*,?\s*"contentType"\s*:\s*"[^"]*"\s*\}?\s*$/i, '')
      .replace(/"?\s*\}\s*$/,'')
      .replace(/\\n/g, '\n')
      .trim();
  }

  function streamPlainText(raw) {
    var t = extractTutorReply(raw);
    if (t && t.indexOf('{') !== 0) return t;
    return String(raw || '')
      .replace(JSON_PREFIX, '')
      .replace(/\\n/g, '\n')
      .replace(/"\s*,\s*"contentType"[\s\S]*$/,'')
      .trim();
  }

  function looksLikeJsonLeak(text) {
    var t = String(text || '').trim();
    return t.indexOf('{"reply"') === 0 || t.indexOf('{\"reply\"') === 0 || JSON_PREFIX.test(t);
  }

  global.TutorReply = {
    extract: extractTutorReply,
    streamPlain: streamPlainText,
    looksLikeJson: looksLikeJsonLeak
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
