/**
 * Kamuk English immersion lock (server-only, testable).
 * Kamuk students (JWT role=student, id KAM-…) get tutors that speak ONLY English:
 * the rule is appended last to every LLM system prompt, and replies are filtered
 * sentence-by-sentence so no Spanish line reaches the student (text or voice).
 * Infinity students are never affected.
 */
const KAMUK_ENGLISH_LOCK_VER = 'kamuk-en1';

const KAMUK_ENGLISH_ONLY_RULE = `LANGUAGE — KAMUK ENGLISH IMMERSION (FINAL RULE — overrides every other language instruction above, including any "español", "bilingual", "Spanish bridge" or "explain in Spanish" rule):
- Reply 100% in natural American English. One language only.
- NEVER write Spanish words, phrases, translations, Spanish tip lines ("ALICE: ¡…!"), Spanish letter names or Spanish pronunciation guides. NEVER mix languages in the same reply.
- Even if the student writes in Spanish, mixes languages, says "explícame", "no entiendo", "en español" or asks for a translation: understand them and answer in simple, clear English with a short example.
- If the student seems lost, re-explain with easier English words, shorter sentences and one concrete example — never switch to Spanish.
- Instructions, feedback, corrections, encouragement, exercise prompts and session summaries: all in English.
- Keep any [[...]] portal tags and any required JSON format exactly as instructed; only the human-readable text must be English.`;

const KAMUK_ENGLISH_FALLBACK = "Let's keep practicing in English. Can you tell me a little more?";

const ES_WORDS = new Set((
  'de la que el en y los las del se por un una para con es lo como más mas pero sus le ya este esta está estás ' +
  'sí si porque muy también tambien cuando todo toda nos ese eso esto bien vos tu tú te mi qué cómo hay ' +
  'usted ustedes les así asi practicar hablemos intentemos repetí repite escuchá escucha entonces ahora aquí aqui puedes podés podes decí dime seguí sigue practicá practica ' +
  'practicando vamos hola gracias excelente buen buena bueno perfecto claro ejemplo inglés ingles español espanol ' +
  'oración oracion palabra palabras significa quiere decir descansá volvé volve energía energia sesión sesion ' +
  'comienzo cada hace fuerte más también tenés tenes estoy eres sos soy fue era hacer hablar escribir responde ' +
  'responda respondé intentá intenta otra vez muy bien genial listo empezamos dijiste dices decís mañana hoy'
).split(/\s+/).filter(Boolean));

const EN_WORDS = new Set((
  'the and to of you is it that in for on with are this be your can what how we i my do have was will at as so ' +
  'but not if about like just let\'s it\'s i\'m you\'re don\'t great good job nice try say tell me more next answer ' +
  'please there their they he she his her our an or from by when which would could should one all now here'
).split(/\s+/).filter(Boolean));

function wordStats(text) {
  const tokens = String(text || '').toLowerCase().match(/[a-záéíóúüñ']+/g) || [];
  let es = 0;
  let en = 0;
  for (const w of tokens) {
    if (ES_WORDS.has(w)) es++;
    if (EN_WORDS.has(w)) en++;
  }
  return { es, en, words: tokens.length };
}

/** True when a sentence/fragment is Spanish (or Spanish-dominant). Tags/JSON are never flagged. */
function isSpanishFragment(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/\[\[|\]\]|[{}]/.test(t)) return false;
  const { es, en, words } = wordStats(t);
  if (/[¿¡]/.test(t) && en <= 1) return true;
  if (es >= 2 && es > en * 1.5) return true;
  if (es >= 1 && en === 0 && words <= 4) return true;
  return false;
}

function stripSpanishParentheticals(line) {
  return line.replace(/\s*\(([^()]{1,160})\)/g, (m, inner) => (isSpanishFragment(inner) ? '' : m));
}

function filterLine(line) {
  const label = line.match(/^\s*(ALICE|JILL|CLAIRE)\s*:\s*/i);
  const body = label ? line.slice(label[0].length) : line;
  if (!body.trim()) return line;
  const cleaned = stripSpanishParentheticals(body);
  const parts = cleaned.split(/(?<=[.!?…])\s+/);
  const kept = parts.filter((p) => !isSpanishFragment(p));
  if (!kept.length) return null;
  const out = kept.join(' ');
  return label ? label[0] + out : out;
}

/**
 * Remove Spanish sentences/lines from a tutor reply. JSON payloads pass through untouched.
 * Returns an English fallback if nothing English is left.
 */
function enforceEnglishOnly(text) {
  if (typeof text !== 'string' || !text.trim()) return text;
  const trimmed = text.trim();
  if (/^[{[]/.test(trimmed) && /[}\]]$/.test(trimmed)) return text;
  const lines = text.split('\n');
  const out = [];
  let removed = false;
  let keptContent = false;
  for (const line of lines) {
    if (!line.trim()) { out.push(line); continue; }
    const f = filterLine(line);
    if (f === null) { removed = true; continue; }
    if (f !== line) removed = true;
    if (f.replace(/\[\[[^\]]*\]\]/g, '').trim()) keptContent = true;
    out.push(f);
  }
  if (!removed) return text;
  const joined = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!keptContent) return joined ? `${KAMUK_ENGLISH_FALLBACK}\n${joined}` : KAMUK_ENGLISH_FALLBACK;
  return joined;
}

const PAYLOAD_TEXT_KEYS = ['reply', 'opening', 'alice_message', 'jill_message', 'claire_message', 'best_moment', 'main_improvement'];

/** Filter known human-readable fields of a JSON response (top level + `evaluation`). */
function enforceEnglishOnlyPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const fix = (obj) => {
    for (const k of PAYLOAD_TEXT_KEYS) {
      if (typeof obj[k] === 'string') obj[k] = enforceEnglishOnly(obj[k]);
    }
  };
  fix(body);
  if (body.evaluation && typeof body.evaluation === 'object' && !Array.isArray(body.evaluation)) fix(body.evaluation);
  return body;
}

/**
 * Streaming filter: buffers deltas to sentence boundaries and drops Spanish sentences.
 * Holds text while a [[tag]] is open so portal tags are never split.
 */
function createEnglishStreamFilter() {
  let pending = '';
  let emittedAny = false;
  let droppedAny = false;
  const take = (final) => {
    if (!pending) return '';
    if (!final && (pending.match(/\[\[/g) || []).length > (pending.match(/\]\]/g) || []).length) return '';
    let cut = -1;
    if (final) {
      cut = pending.length;
    } else {
      const re = /[.!?…](?=\s)|\n/g;
      let m;
      while ((m = re.exec(pending))) cut = m.index + 1;
      if (cut <= 0) return '';
      while (cut < pending.length && /\s/.test(pending[cut])) cut++;
    }
    const chunk = pending.slice(0, cut);
    pending = pending.slice(cut);
    const lead = chunk.match(/^\s*/)[0];
    const trail = chunk.match(/\s*$/)[0];
    const core = chunk.trim();
    if (!core) return chunk;
    const filtered = enforceEnglishOnly(core);
    if (filtered === KAMUK_ENGLISH_FALLBACK || filtered.startsWith(KAMUK_ENGLISH_FALLBACK + '\n')) {
      droppedAny = true;
      const tagsOnly = filtered.slice(KAMUK_ENGLISH_FALLBACK.length).trim();
      return tagsOnly ? lead + tagsOnly + trail : '';
    }
    emittedAny = true;
    return lead + filtered + trail;
  };
  return {
    push(delta) {
      pending += String(delta || '');
      return take(false);
    },
    flush() {
      let out = take(true);
      if (!emittedAny && droppedAny) {
        emittedAny = true;
        out = KAMUK_ENGLISH_FALLBACK + (out.trim() ? '\n' + out.trim() : '');
      }
      return out;
    }
  };
}

module.exports = {
  KAMUK_ENGLISH_LOCK_VER,
  KAMUK_ENGLISH_ONLY_RULE,
  KAMUK_ENGLISH_FALLBACK,
  isSpanishFragment,
  enforceEnglishOnly,
  enforceEnglishOnlyPayload,
  createEnglishStreamFilter
};
