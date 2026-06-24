/**
 * Split long tutor/voice text into TTS-safe chunks without cutting mid-sentence.
 */
function splitTtsSentences(text) {
  var src = String(text || '').replace(/\s+/g, ' ').trim();
  if (!src) return [];
  var parts = [];
  var re = /[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g;
  var m;
  while ((m = re.exec(src)) !== null) {
    var s = m[0].trim();
    if (s.length > 1) parts.push(s);
  }
  return parts.length ? parts : [src];
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
      p.catch(function () {
        attempts++;
        if (attempts < 5) {
          setTimeout(tryPlay, 120 * attempts);
        } else {
          done(handlers.onError);
        }
      });
    }
  }
  tryPlay();
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
