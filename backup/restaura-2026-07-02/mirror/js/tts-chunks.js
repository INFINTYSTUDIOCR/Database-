/**
 * Split long tutor/voice text into TTS-safe chunks without cutting mid-sentence.
 */
function protectTtsDecimalPoints(text) {
  return String(text || '')
    .replace(/(\d)\.(\d)/g, '$1<TTS_DOT>$2')
    .replace(/\b([A-Za-z])\./g, '$1<TTS_ABBR>');
}

function restoreTtsDecimalPoints(text) {
  return String(text || '')
    .replace(/<TTS_DOT>/g, '.')
    .replace(/<TTS_ABBR>/g, '.');
}

function splitTtsSentences(text) {
  var src = String(text || '').replace(/\s+/g, ' ').trim();
  if (!src) return [];
  var shielded = protectTtsDecimalPoints(src);
  var parts = [];
  var re = /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g;
  var m;
  while ((m = re.exec(shielded)) !== null) {
    var s = restoreTtsDecimalPoints(m[0].trim());
    if (s.length > 1) parts.push(s);
  }
  return parts.length ? parts : [src];
}

function isCompleteSpokenLine(text, minWords) {
  minWords = minWords || 5;
  var t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length < 18) return false;
  if ((t.match(/\b\w+\b/g) || []).length < minWords) return false;
  return /[.!?]$/.test(t);
}

/** One flowing TTS line — softer punctuation, fewer dramatic pauses at periods. */
function prepareTtsLine(text) {
  return String(text || '')
    .replace(/ALICE:|CLAIRE:|JILL:/gi, '')
    .replace(/[*_#\[\]{}<>|~`^]/g, ' ')
    .replace(/\.{2,}/g, ',')
    .replace(/([.!?])\s+/g, ', ')
    .replace(/[.!?;:]+$/g, '')
    .replace(/[,;:/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Debounced TTS warm-up while LLM is still streaming. */
function scheduleTtsPrefetch(text, prefetchFn, state) {
  state = state || {};
  var minLen = state.minLen || 48;
  var ms = state.ms || 200;
  var line = prepareTtsLine(text);
  if (line.length < minLen) return;
  clearTimeout(state.timer);
  state.timer = setTimeout(function () {
    if (line === state.last) return;
    state.last = line;
    if (typeof prefetchFn === 'function') prefetchFn(line);
  }, ms);
}

/** Prefer one TTS request; split only when text is very long. */
function ttsSpeakLines(text, maxLen) {
  maxLen = maxLen || 900;
  var line = prepareTtsLine(text);
  if (!line) return [];
  if (line.length <= maxLen) return [line];
  return splitTtsChunks(line, maxLen);
}

function splitTtsChunks(text, maxLen) {
  maxLen = maxLen || 450;
  var sentences = splitTtsSentences(text);
  if (!sentences.length) return [];
  var chunks = [];
  var buf = '';
  sentences.forEach(function (sentence) {
    if (sentence.length > maxLen) {
      if (buf) { chunks.push(buf.trim()); buf = ''; }
      var rest = sentence;
      while (rest.length > maxLen) {
        var slice = rest.slice(0, maxLen);
        var breakAt = Math.max(slice.lastIndexOf(' '), Math.floor(maxLen * 0.6));
        if (breakAt < 20) breakAt = maxLen;
        chunks.push(rest.slice(0, breakAt).trim());
        rest = rest.slice(breakAt).trim();
      }
      if (rest) buf = rest + ' ';
      return;
    }
    if ((buf + sentence).trim().length > maxLen) {
      if (buf.trim()) chunks.push(buf.trim());
      buf = sentence + ' ';
    } else {
      buf += sentence + ' ';
    }
  });
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

function drainTtsPending(pending, onSentence, onPrefetch) {
  var rest = String(pending || '');
  var out = [];
  while (rest.length) {
    var m = rest.match(/^([\s\S]+?[.!?¿¡])(?:\s+|$)/);
    if (m && m[1].length > 8) {
      out.push(m[1].trim());
      if (typeof onSentence === 'function') onSentence(m[1].trim());
      rest = rest.slice(m[0].length);
      var next = rest.match(/^([\s\S]+?[.!?¿¡])(?:\s+|$)/);
      if (next && next[1].length > 8 && typeof onPrefetch === 'function') {
        onPrefetch(next[1].trim());
      }
      continue;
    }
    break;
  }
  return { pending: rest, spoken: out };
}

var _ttsAudioUnlocked = false;

/** Unlock browser audio after a user gesture (laptops often block autoplay after several plays). */
function unlockTtsAudio() {
  if (_ttsAudioUnlocked) return Promise.resolve();
  return new Promise(function (resolve) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        var ctx = new Ctx();
        var p = ctx.resume();
        var done = function () {
          _ttsAudioUnlocked = true;
          try { ctx.close(); } catch (e) {}
          resolve();
        };
        if (p && typeof p.then === 'function') p.then(done).catch(done);
        else done();
        return;
      }
    } catch (e) { /* fall through */ }
    try {
      var a = new Audio();
      a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      a.volume = 0.001;
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { _ttsAudioUnlocked = true; resolve(); })
          .catch(function () { _ttsAudioUnlocked = true; resolve(); });
      } else {
        _ttsAudioUnlocked = true;
        resolve();
      }
    } catch (e2) {
      _ttsAudioUnlocked = true;
      resolve();
    }
  });
}

/**
 * Play TTS blob reliably — retries autoplay, never skips queue silently.
 */
function playAudioBlob(blob, handlers) {
  handlers = handlers || {};
  if (!blob) {
    if (handlers.onError) handlers.onError();
    return null;
  }
  var url = URL.createObjectURL(blob);
  var audio = new Audio(url);
  var dead = false;
  var attempts = 0;

  function done(fn) {
    if (dead) return;
    dead = true;
    try { URL.revokeObjectURL(url); } catch (e) {}
    if (fn) fn();
  }

  audio.onended = function () { done(handlers.onEnded); };
  audio.onerror = function () { done(handlers.onError); };

  function tryPlay() {
    var p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(function () { _ttsAudioUnlocked = true; }).catch(function () {
        attempts++;
        if (attempts < 6) {
          unlockTtsAudio().finally(function () {
            setTimeout(tryPlay, 140 * attempts);
          });
        } else {
          done(handlers.onError);
        }
      });
    }
  }
  unlockTtsAudio().finally(tryPlay);
  return audio;
}

/** Unlock stuck send locks after network hang */
function voiceSendWatchdog(isStuck, unlock, ms) {
  ms = ms || 50000;
  var t0 = Date.now();
  var id = setInterval(function () {
    if (!isStuck()) { clearInterval(id); return; }
    if (Date.now() - t0 > ms) {
      clearInterval(id);
      unlock();
    }
  }, 2000);
  return function () { clearInterval(id); };
}
