/**
 * WhatsApp sales FAQ — load, match, prompts, handoff.
 * Seed: config/wa-faq.json · live mirror: infinity_sessions WA-FAQ-V1
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FAQ_SESSION_ID = 'WA-FAQ-V1';
const MATCH_THRESHOLD = 4;

let _fileCache = null;
let _fileMtime = 0;

function faqPaths() {
  return [
    path.join(__dirname, '../config/wa-faq.json'),
    path.join(__dirname, 'config/wa-faq.json')
  ];
}

function readFileFaq() {
  for (const p of faqPaths()) {
    try {
      if (!fs.existsSync(p)) continue;
      const st = fs.statSync(p);
      if (!_fileCache || st.mtimeMs !== _fileMtime) {
        _fileCache = JSON.parse(fs.readFileSync(p, 'utf8'));
        _fileMtime = st.mtimeMs;
      }
      return _fileCache;
    } catch (err) {
      console.warn('wa-faq read', p, err.message);
    }
  }
  return { version: 'empty', meta: {}, entries: [] };
}

function normalizeFaq(doc) {
  if (!doc || typeof doc !== 'object') return { version: 'empty', meta: {}, entries: [] };
  const entries = Array.isArray(doc.entries) ? doc.entries.filter((e) => e && e.a && e.id) : [];
  return {
    version: doc.version || '1',
    id: doc.id || FAQ_SESSION_ID,
    meta: doc.meta && typeof doc.meta === 'object' ? doc.meta : {},
    entries,
    updatedAt: doc.updatedAt || doc.meta?.updatedAt || null
  };
}

async function loadFaq(sbGetOne) {
  if (typeof sbGetOne === 'function') {
    try {
      const row = await sbGetOne('infinity_sessions', FAQ_SESSION_ID);
      if (row && row.data && Array.isArray(row.data.entries) && row.data.entries.length) {
        return normalizeFaq(row.data);
      }
    } catch (err) {
      console.warn('wa-faq supabase:', err.message);
    }
  }
  return normalizeFaq(readFileFaq());
}

function seedFromFile() {
  return normalizeFaq(readFileFaq());
}

function normText(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreEntry(entry, textNorm) {
  if (!textNorm) return 0;
  const intents = Array.isArray(entry.intents) ? entry.intents : [];
  let score = 0;
  for (let i = 0; i < intents.length; i++) {
    const intent = normText(intents[i]);
    if (!intent) continue;
    if (textNorm === intent) score += 12;
    else if (textNorm.includes(intent)) {
      score += intent.length >= 8 ? 8 : intent.length >= 4 ? 6 : 3;
    }
  }
  const qNorm = normText(entry.q);
  if (qNorm && textNorm.length >= 6) {
    const qWords = qNorm.split(' ').filter((w) => w.length > 3);
    let hits = 0;
    qWords.forEach((w) => { if (textNorm.includes(w)) hits++; });
    if (qWords.length && hits / qWords.length >= 0.5) score += 3;
  }
  const pri = Number(entry.priority) || 0;
  if (score > 0) score += Math.min(4, Math.floor(pri / 20));
  return score;
}

function matchFaq(text, faqDoc) {
  const doc = normalizeFaq(faqDoc);
  const textNorm = normText(text);
  if (!textNorm || textNorm.length < 2) return null;

  let best = null;
  let bestScore = 0;
  doc.entries.forEach((entry) => {
    const s = scoreEntry(entry, textNorm);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  });

  if (!best || bestScore < MATCH_THRESHOLD) {
    return { hit: false, score: bestScore, entry: null };
  }
  return { hit: true, score: bestScore, entry: best };
}

const HANDOFF_RE = /\b(humano|asesor|armando|persona|agente|hablar con alguien|quiero hablar|pasame con|pásame con|llamar|call me|speak to (a |an )?(human|person|agent)|real person)\b/i;

function shouldHandoff(text, matchedEntry) {
  if (matchedEntry && matchedEntry.id === 'handoff') return true;
  return HANDOFF_RE.test(String(text || ''));
}

function compactKb(faqDoc, maxEntries) {
  const doc = normalizeFaq(faqDoc);
  const limit = maxEntries || 28;
  const sorted = doc.entries.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return sorted.slice(0, limit).map((e) => `Q: ${e.q}\nA: ${e.a}`).join('\n\n');
}

function buildSystemPrompt(faqDoc) {
  const doc = normalizeFaq(faqDoc);
  const m = doc.meta || {};
  const brand = m.brand || 'Infinity Studio CR';
  const voice = m.persona || 'Recepción cercana y directa. Mensajes cortos.';
  const cta = m.ctaDiagnostico || 'Ofrecé el diagnóstico gratis de 90 min.';
  const site = m.site || 'https://studioinfinitycr.com';
  const sinpe = m.sinpe || '6006-0981';
  const kb = compactKb(doc);

  return `Sos la recepción de WhatsApp de ${brand}.
${voice}
Reglas:
- Respondé SOLO con información de la base Q&A abajo. No inventés precios, cupos ni plazos.
- Máximo 4 líneas. Sin markdown pesado. Podés usar • para listas cortas.
- Si preguntan precio, incluí colones y SINPE ${sinpe} cuando hable de pago.
- Si no sabés: pedí 1 dato (nombre/meta) y ofrecé diagnóstico o handoff humano.
- CTA preferido: ${cta}
- Links útiles: ${site} · ${m.pricingUrl || site + '/pricing.html'} · ${m.tryAliceUrl || site + '/try-alice.html'}
- No te hagas pasar por Claire/Alice/Jill entrenando inglés acá: esto es recepción comercial.
- Si piden humano/Armando/asesor: confirmá handoff en 1 línea.

BASE Q&A:
${kb}`;
}

function handoffMessage(faqDoc) {
  const doc = normalizeFaq(faqDoc);
  return (doc.meta && doc.meta.handoffMessage)
    || 'Perfecto — en un momento te atiende el equipo de Infinity.';
}

function validateFaqPayload(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid_body' };
  const entries = Array.isArray(body.entries) ? body.entries : null;
  if (!entries) return { ok: false, error: 'entries_required' };
  if (entries.length > 200) return { ok: false, error: 'too_many_entries' };
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e || !e.id || !e.a) return { ok: false, error: 'entry_missing_id_or_a', index: i };
    if (String(e.a).length > 1200) return { ok: false, error: 'answer_too_long', index: i };
  }
  return { ok: true };
}

module.exports = {
  FAQ_SESSION_ID,
  MATCH_THRESHOLD,
  loadFaq,
  seedFromFile,
  matchFaq,
  shouldHandoff,
  buildSystemPrompt,
  handoffMessage,
  compactKb,
  normalizeFaq,
  validateFaqPayload,
  normText
};
