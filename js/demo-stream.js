/**
 * Demo streaming — same SSE pattern as Portal Alice/Jill/Nexora
 */
async function demoStreamSend(sessionId, message, opts) {
  opts = opts || {};
  var resp = await fetch(DEMO_BACKEND + '/demo/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: sessionId, message: message })
  });

  if (!resp.ok) {
    var errText = '';
    try { errText = await resp.text(); } catch (e) {}
    try {
      var errJson = JSON.parse(errText);
      if (errJson.error === 'limit') throw errJson;
      throw { message: errJson.message || errJson.error || 'Stream failed' };
    } catch (e) {
      if (e && e.error === 'limit') throw e;
      if (e && e.message) throw e;
      throw { message: 'Live demo stream unavailable.' };
    }
  }

  var reader = resp.body.getReader();
  var dec = new TextDecoder();
  var lineBuf = '';
  var fullText = '';
  var pending = '';
  var meta = null;
  var evaluation = null;

  while (true) {
    var chunk = await reader.read();
    if (chunk.done) break;
    lineBuf += dec.decode(chunk.value, { stream: true });
    var lines = lineBuf.split('\n');
    lineBuf = lines.pop() || '';
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line.startsWith('data: ')) continue;
      var raw = line.slice(6).trim();
      if (raw === '[DONE]') break;
      try {
        var evt = JSON.parse(raw);
        if (evt.error) throw { message: evt.error };
        if (evt.t) {
          fullText += evt.t;
          pending += evt.t;
          if (typeof opts.onToken === 'function') opts.onToken(fullText, evt.t);
          if (typeof opts.onSentence === 'function') {
            var m = pending.match(/^([\s\S]+?[.!?¿¡])\s+/);
            if (m && m[1].length > 3) {
              opts.onSentence(m[1]);
              pending = pending.slice(m[0].length);
            } else if (pending.length >= 28 && /[,;]/.test(pending)) {
              var cm = pending.match(/^([\s\S]{14,}?[,;])\s+/);
              if (cm) {
                opts.onSentence(cm[1]);
                pending = pending.slice(cm[0].length);
              }
            }
          }
        }
        if (evt.meta) meta = evt.meta;
        if (evt.evaluation) evaluation = evt.evaluation;
      } catch (e) {
        if (e && e.message && e.message !== 'Stream failed') throw e;
      }
    }
  }

  if (pending.trim().length > 2 && typeof opts.onSentence === 'function') {
    opts.onSentence(pending.split('\nALICE:')[0].split('\nJILL:')[0]);
  }

  return { reply: fullText, meta: meta, evaluation: evaluation };
}
