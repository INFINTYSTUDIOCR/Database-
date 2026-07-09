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

var _ES_TTS_WORD = /^(el|la|los|las|un|una|unos|unas|que|de|del|al|con|por|para|en|y|o|u|es|son|soy|estás|estoy|está|están|hola|gracias|claro|ejemplo|verbo|oración|regla|practica|practicá|decime|seguimos|entiendo|más|qué|cómo|vos|podés|armá|querés|vamos|hoy|ahora|paso|frase|modelo|ranura|fórmula|tema|lección|mini|simple|parte|palabras|inglés|español|pedime|escucho|listo|perfecto|muy|bien|retomemos|arrancamos|confirmá|enseñá|corregí|charla|libre|futuro|pasado|presente|gerundio|modal|estructura|mecánica|pieza|chunk|complemento|pronombre|artículo|preposición|siguiente|turno|respuesta|pregunta|duda|ayuda|explic|enseñ|podés|armás|querés|decís|habl|practic|segu|vamos|ok|dale|bueno|genial|excelente|primero|después|luego|también|pero|porque|cuando|donde|dónde|cuál|este|esta|ese|esa|tu|mi|su|nuestro|vuestro|sin|sobre|entre|hacia|desde|hasta|solo|si|sí|no|ni|ya|aún|todavía|siempre|nunca|aquí|allí|así|me|te|se|nos|les|lo|la|le|unos|unas)$/i;

var _EN_TTS_WORD = /^(i|you|he|she|it|we|they|am|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|must|may|might|the|a|an|to|of|in|on|at|for|and|but|or|not|with|from|by|as|if|so|that|this|these|those|my|your|his|her|its|our|their|home|work|worked|study|studied|ready|tomorrow|today|yesterday|because|however|although|example|practice|sentence|verb|structure|hello|thanks|yes|please|let|me|rephrase|night|morning|tired|happy|here|there|next|month|week|day|travel|learn|speak|go|going|make|made|take|took|get|got|see|saw|know|knew|think|thought|want|need|say|said|tell|told|office|school|been|base|simple|past|present|future|progressive|perfect|continuous|modal|chunk|linker|however|top|that|what|how|when|where|who|why|which|some|any|every|each|both|all|one|two|three|first|second|third|time|year|life|world|people|thing|way|day|man|woman|child|children|good|great|new|old|long|short|high|low|big|small|other|same|different|right|left|early|late|hard|easy|fast|slow|warm|cool|hot|cold|open|close|start|stop|try|use|find|give|keep|leave|call|ask|help|show|move|live|believe|hold|turn|follow|begin|run|bring|write|provide|sit|stand|lose|pay|meet|include|continue|set|learn|change|lead|understand|watch|follow|create|read|allow|add|spend|grow|open|walk|win|offer|remember|love|consider|appear|buy|wait|serve|die|send|expect|build|stay|fall|cut|reach|kill|remain|suggest|raise|pass|sell|require|report|decide|pull)$/i;

function classifyTtsWord(word) {
  var w = String(word || '').trim();
  if (!w) return null;
  if (/[áéíóúñ¿¡]/i.test(w)) return 'es';
  var bare = w.toLowerCase().replace(/['']/g, "'");
  if (_ES_TTS_WORD.test(bare)) return 'es';
  if (_EN_TTS_WORD.test(bare)) return 'en';
  if (/^(don't|didn't|won't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|i'm|you're|we're|they're|he's|she's|it's|i've|you've|we've|they've|i'll|you'll|we'll|they'll|i'd|you'd|we'd|they'd)$/i.test(bare)) return 'en';
  if (/^[a-z]+ing$/i.test(bare) && bare.length > 4) return 'en';
  if (/^[a-z]+ed$/i.test(bare) && bare.length > 3 && !/^(red|fed|led|bed|wed)$/i.test(bare)) return 'en';
  if (/^[A-Z][a-z]+$/.test(w) && bare.length > 2) return 'en';
  return null;
}

/** Split mixed ES/EN tutor lines so each TTS chunk uses one language. */
function splitBilingualTtsSegments(text) {
  var src = String(text || '').replace(/\s+/g, ' ').trim();
  if (!src) return [];
  var tokens = src.match(/[\wáéíóúñüÁÉÍÓÚÑÜ]+(?:'[a-z]+)?|[^\w\s]/g) || [src];
  var segments = [];
  var buf = '';
  var lang = 'es';

  function flush() {
    var t = buf.replace(/\s+/g, ' ').trim();
    if (t.length > 0) segments.push({ text: t, lang: lang });
    buf = '';
  }

  tokens.forEach(function (tok) {
    if (!/\w/.test(tok)) {
      buf += tok;
      return;
    }
    var cls = classifyTtsWord(tok);
    var nextLang = cls || lang;
    if (cls && cls !== lang && buf.trim()) {
      flush();
      lang = cls;
    } else if (!cls && !buf.trim()) {
      lang = lang || 'es';
    } else if (cls) {
      lang = cls;
    }
    buf += (buf && /\w$/.test(buf) ? ' ' : '') + tok;
  });
  flush();

  if (!segments.length) return [{ text: src, lang: 'es' }];
  return segments.filter(function (s) { return s.text && s.text.length > 0; });
}

/** Jill / bilingual tutors: segment by language, then length-cap each segment. */
function jillTtsSegments(text, maxLen) {
  maxLen = maxLen || 480;
  var line = prepareTtsLine(text);
  if (!line) return [];
  var segments = splitBilingualTtsSegments(line);
  var out = [];
  segments.forEach(function (seg) {
    if (seg.text.length <= maxLen) {
      out.push(seg);
      return;
    }
    splitTtsChunks(seg.text, maxLen).forEach(function (chunk) {
      out.push({ text: chunk, lang: seg.lang });
    });
  });
  return out;
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

/** Watchdog ms so long audio is never cut mid-playback (~12 chars/sec + buffer). */
function ttsWatchdogMs(textLen) {
  var n = Math.max(40, Number(textLen) || 0);
  return Math.min(180000, Math.max(75000, Math.ceil(n / 10) * 1000 + 20000));
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
  if (typeof CelebrationSfx !== 'undefined') CelebrationSfx.unlock();
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
  audio.volume = 1;
  audio.muted = false;
  audio.preload = 'auto';
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
