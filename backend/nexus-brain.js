/**
 * Nexus Brain — caché persistente LLM + TTS en Supabase (infinity_sessions).
 * Consulta obligatoria antes de Claude / ElevenLabs.
 * Desactivar: NEXUS_BRAIN=0 en env Render.
 */
const crypto = require('crypto');

const BRAIN_TABLE = 'infinity_sessions';
const BRAIN_ENABLED = process.env.NEXUS_BRAIN !== '0';
const BRAIN_TTS_MAX_B64 = 950000;

let _sbGetOne = null;
let _sbSet = null;

function initNexusBrain({ sbGetOne, sbSet }) {
  _sbGetOne = sbGetOne;
  _sbSet = sbSet;
}

function isBrainEnabled() {
  return BRAIN_ENABLED && !!(_sbGetOne && _sbSet);
}

function brainHash(parts) {
  return crypto.createHash('sha256').update(parts.filter(Boolean).join('|')).digest('hex').slice(0, 40);
}

function normalizeBrainText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 480);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function brainRecordStat(kind, hit) {
  if (!isBrainEnabled()) return;
  const id = `BRAIN-STAT-${todayKey()}`;
  try {
    const row = await _sbGetOne(BRAIN_TABLE, id);
    const d = row?.data || { llmHits: 0, llmMiss: 0, ttsHits: 0, ttsMiss: 0 };
    if (kind === 'llm') {
      if (hit) d.llmHits = (d.llmHits || 0) + 1;
      else d.llmMiss = (d.llmMiss || 0) + 1;
    } else if (kind === 'tts') {
      if (hit) d.ttsHits = (d.ttsHits || 0) + 1;
      else d.ttsMiss = (d.ttsMiss || 0) + 1;
    }
    d.updatedAt = new Date().toISOString();
    await _sbSet(BRAIN_TABLE, id, d);
  } catch (e) {
    console.warn('brainRecordStat:', e.message);
  }
}

async function brainGetRow(prefix, hash) {
  if (!isBrainEnabled()) return null;
  const id = `${prefix}-${hash}`;
  try {
    const row = await _sbGetOne(BRAIN_TABLE, id);
    return row?.data || null;
  } catch (e) {
    console.warn('brainGetRow:', e.message);
    return null;
  }
}

async function brainSetRow(prefix, hash, payload) {
  if (!isBrainEnabled()) return;
  const id = `${prefix}-${hash}`;
  try {
    await _sbSet(BRAIN_TABLE, id, {
      ...payload,
      hash,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('brainSetRow:', e.message);
  }
}

function llmCacheKey(tutor, intent, userMessage, extra) {
  const norm = normalizeBrainText(userMessage);
  if (!norm || norm.length < 4) return null;
  return brainHash([tutor, intent, extra || '', norm]);
}

async function brainGetLLM(tutor, intent, userMessage, extra) {
  const hash = llmCacheKey(tutor, intent, userMessage, extra);
  if (!hash) return { hit: false, hash: null };
  const row = await brainGetRow('BRAIN-LLM', hash);
  if (row?.reply && String(row.reply).length > 8) {
    await brainRecordStat('llm', true);
    const hits = (row.hits || 0) + 1;
    brainSetRow('BRAIN-LLM', hash, { ...row, hits }).catch(() => {});
    return { hit: true, hash, reply: row.reply, hits };
  }
  await brainRecordStat('llm', false);
  return { hit: false, hash };
}

async function brainSetLLM(hash, tutor, intent, userMessage, reply, extra) {
  if (!hash || !reply || String(reply).length < 8) return;
  await brainSetRow('BRAIN-LLM', hash, {
    tutor,
    intent,
    extra: extra || '',
    messagePreview: normalizeBrainText(userMessage).slice(0, 120),
    reply: String(reply).trim(),
    hits: 0,
    createdAt: new Date().toISOString()
  });
}

async function brainGetTTS(cleanText, voiceId, languageCode) {
  if (!cleanText || !voiceId) return { hit: false, hash: null };
  const hash = brainHash(['tts', voiceId, languageCode || 'auto', cleanText]);
  const row = await brainGetRow('BRAIN-TTS', hash);
  if (row?.audioB64) {
    try {
      const buf = Buffer.from(row.audioB64, 'base64');
      if (buf.length > 100) {
        await brainRecordStat('tts', true);
        const hits = (row.hits || 0) + 1;
        brainSetRow('BRAIN-TTS', hash, { ...row, hits }).catch(() => {});
        return { hit: true, hash, buffer: buf, hits };
      }
    } catch (e) { /* fall through */ }
  }
  await brainRecordStat('tts', false);
  return { hit: false, hash };
}

async function brainSetTTS(hash, cleanText, voiceId, buffer, languageCode) {
  if (!hash || !buffer || !Buffer.isBuffer(buffer)) return;
  const b64 = buffer.toString('base64');
  if (b64.length > BRAIN_TTS_MAX_B64) {
    console.warn('brainSetTTS: skip oversized audio', b64.length);
    return;
  }
  await brainSetRow('BRAIN-TTS', hash, {
    voiceId,
    languageCode: languageCode || 'auto',
    textPreview: String(cleanText).slice(0, 160),
    audioB64: b64,
    hits: 0,
    createdAt: new Date().toISOString()
  });
}

async function brainGetStats() {
  const id = `BRAIN-STAT-${todayKey()}`;
  const row = await _sbGetOne(BRAIN_TABLE, id);
  const d = row?.data || {};
  const llmHits = d.llmHits || 0;
  const llmMiss = d.llmMiss || 0;
  const ttsHits = d.ttsHits || 0;
  const ttsMiss = d.ttsMiss || 0;
  const llmTotal = llmHits + llmMiss;
  const ttsTotal = ttsHits + ttsMiss;
  return {
    enabled: isBrainEnabled(),
    day: todayKey(),
    llm: { hits: llmHits, misses: llmMiss, hitRate: llmTotal ? Math.round((llmHits / llmTotal) * 100) : 0 },
    tts: { hits: ttsHits, misses: ttsMiss, hitRate: ttsTotal ? Math.round((ttsHits / ttsTotal) * 100) : 0 }
  };
}

function writeBrainSSE(res, text, headers = {}) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'X-Brain-LLM': 'HIT',
    ...headers
  });
  res.write(`data: ${JSON.stringify({ t: text })}\n\n`);
  res.write('data: [DONE]\n\n');
  res.end();
}

module.exports = {
  initNexusBrain,
  isBrainEnabled,
  normalizeBrainText,
  brainGetLLM,
  brainSetLLM,
  brainGetTTS,
  brainSetTTS,
  brainGetStats,
  writeBrainSSE,
  llmCacheKey
};
