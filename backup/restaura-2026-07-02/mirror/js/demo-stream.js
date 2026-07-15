/**
 * Demo streaming — SSE when Render has /demo/stream; falls back to /demo/message or local buffer.
 */
function demoStreamFromText(text, opts) {
  var full = String(text || '');
  if (typeof opts.onToken === 'function') opts.onToken(full, full);
  if (typeof opts.onSentence === 'function' && full.trim()) opts.onSentence(full);
  return full;
}

async function demoStreamSend(sessionId, message, opts) {
  opts = opts || {};

  if (String(sessionId).indexOf('local-') === 0) {
    var local = demoSendLocal(sessionId, message);
    var localReply = demoStreamFromText(local.reply, opts);
    return {
      reply: localReply,
      meta: { step: local.step, done: local.done, maxSteps: local.maxSteps },
      evaluation: local.evaluation
    };
  }

  var resp;
  try {
    resp = await fetch(DEMO_BACKEND + '/demo/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, message: message })
    });
  } catch (netErr) {
    resp = null;
  }

  if (!resp || !resp.ok) {
    var d = await demoSend(sessionId, message);
    var fbReply = demoStreamFromText(d.reply, opts);
    return {
      reply: fbReply,
      meta: { step: d.step, done: d.done, maxSteps: d.maxSteps },
      evaluation: d.evaluation
    };
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
        }
        if (evt.meta) meta = evt.meta;
        if (evt.evaluation) evaluation = evt.evaluation;
      } catch (e) {
        if (e && e.message && e.message !== 'Stream failed') throw e;
      }
    }
  }

  if (fullText.trim().length > 2 && typeof opts.onSentence === 'function') {
    var spoken = (typeof TutorReply !== 'undefined') ? TutorReply.extract(fullText) : fullText;
    ttsSpeakLines(spoken.split('\nALICE:')[0].split('\nJILL:')[0].trim(), 900).forEach(function (sentence) {
      opts.onSentence(sentence);
    });
  }

  if (!fullText.trim()) {
    var d2 = await demoSend(sessionId, message);
    fullText = demoStreamFromText(d2.reply, opts);
    return {
      reply: fullText,
      meta: { step: d2.step, done: d2.done, maxSteps: d2.maxSteps },
      evaluation: d2.evaluation
    };
  }

  return { reply: (typeof TutorReply !== 'undefined') ? TutorReply.extract(fullText) : fullText, meta: meta, evaluation: evaluation };
}
