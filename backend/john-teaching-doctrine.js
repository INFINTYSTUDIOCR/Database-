/**
 * Doctrina institucional John Ramírez — obligatoria para TODAS las IAs de Infinity.
 * Canon local + guion oral de clase (john-voice-scripts) + Super Brain.
 * Prohibido enseñar fuera de este estilo.
 */
const fs = require('fs');
const path = require('path');

const JOHN_STYLE_MANDATE = `DOCTRINA OBLIGATORIA — ESTILO DE CLASE JOHN (Infinity Studio CR) — SIN EXCEPCIONES:
ENSEÑÁ LO QUE PIDAN. La restricción NO es el tema — es HABLAR COMO EN TUS TRASCRICIONES DE CLASE.
PROHIBIDO TOTALMENTE: estilo chatbot/ESL de internet; leer el tablero como lista/manual; inventar otra pedagogía.
EN CADA EXPLICACIÓN — OBLIGATORIO EN VOZ:
1) GUION ORAL LOCAL (john-voice-scripts) — esa es la voz de clase. DECÍLO.
2) Fórmula / puente del guion (ando/endo, jaf/jas/jad, moneda, hay vs have, foto de ayer…).
3) 1 ejemplo en inglés + práctica oral + ¿Te quedó?
El TABLERO se VE en pantalla — NO lo leés fila por fila.
FUENTES DE VERDAD (orden):
1) GUION ORAL LOCAL (john-voice-scripts) — siempre-on; estilo de clase.
2) Super Brain (trascriciones publicadas) — amplía, NO reemplaza el guion.
3) Canon Foundations (fórmulas / bridges / MSI®).
Si hay conflicto: gana el GUION ORAL de clase. Nunca contradigas el Método Nexus.
FIDELIDAD: toda explicación = estilo de clase John. Punto.`;

let _canonDigest = null;
let _voicePack = null;

function loadJsonSafe(...parts) {
  try {
    const p = path.join(__dirname, ...parts);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { /* ignore */ }
  try {
    const p2 = path.join(__dirname, '..', ...parts);
    if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf8'));
  } catch (_) { /* ignore */ }
  return null;
}

function loadVoicePack() {
  if (_voicePack) return _voicePack;
  _voicePack = loadJsonSafe('config', 'john-voice-scripts.json')
    || loadJsonSafe('..', 'config', 'john-voice-scripts.json')
    || { tracks: {}, alice: {} };
  return _voicePack;
}

function getTrackVoice(trackId) {
  const pack = loadVoicePack();
  const id = String(trackId || '').trim();
  if (!id || !pack.tracks || !pack.tracks[id]) return null;
  return pack.tracks[id];
}

/**
 * Bloque inyectable: guion oral completo del track (estilo clase John).
 */
function trackVoiceBlock(trackId) {
  const v = getTrackVoice(trackId);
  if (!v || !v.say) return '';
  const must = Array.isArray(v.mustSay) && v.mustSay.length
    ? `\nPALABRAS OBLIGATORIAS EN VOZ ESTE TURNO: ${v.mustSay.join(', ')}.`
    : '';
  const ask = v.exampleAsk ? `\nCIERRE ORAL: ${v.exampleAsk}` : '';
  return [
    'GUION ORAL DE CLASE (DEBES HABLAR ASÍ — este es el estilo de las trascriciones; no improvises ESL):',
    v.say,
    must,
    ask
  ].filter(Boolean).join('\n');
}

function aliceVoiceBlock() {
  const pack = loadVoicePack();
  const a = pack.alice || {};
  if (!a.say && !a.linkers) return '';
  return [
    'GUION ORAL JOHN — ALICE (misma pedagogía, alcance Intermediate+):',
    a.say || '',
    a.linkers ? `LINKERS/CHUNKING: ${a.linkers}` : ''
  ].filter(Boolean).join('\n');
}

function getCanonDigest(maxLen) {
  if (_canonDigest) return _canonDigest.slice(0, maxLen || 2800);
  const struct = loadJsonSafe('config', 'jill-structure-canon.json') || loadJsonSafe('..', 'config', 'jill-structure-canon.json');
  const map = loadJsonSafe('config', 'jill-canon-map.json') || loadJsonSafe('..', 'config', 'jill-canon-map.json');
  const pack = loadVoicePack();
  const lines = ['CANON LOCAL (Foundations — siempre disponible aunque Super Brain falle):'];
  if (pack.globalVoice) lines.push('VOZ GLOBAL: ' + pack.globalVoice);
  // Guiones orales primero (prioridad: no se cortan por maxLen)
  const critical = ['gerundio', 'progressive', 'gerund_prep', 'past', 'modales', 'there', 'negations', 'prepositions'];
  lines.push('GUIONES ORALES CLAVE (clase John — DEBES HABLAR ASÍ):');
  if (pack.lessons && pack.lessons.getItStraightIng && (pack.lessons.getItStraightIng.say || pack.lessons.getItStraightIng.full)) {
    lines.push('LECCION CANONICA ING (solo contenido del curso — sin nombres internos): ' + String(pack.lessons.getItStraightIng.full || pack.lessons.getItStraightIng.say).slice(0, 900));
  }
  critical.forEach((id) => {
    const v = pack.tracks && pack.tracks[id];
    if (v && v.say) lines.push(`- ${id}: ${String(v.say).slice(0, 320)}`);
  });
  if (struct && struct.symbols) {
    lines.push('Símbolos MSI®: ' + Object.keys(struct.symbols).map((k) => `${k}=${struct.symbols[k]}`).join(' · '));
  }
  if (struct && struct.modalBridge) {
    lines.push('Puente modales: ' + Object.keys(struct.modalBridge).map((k) => {
      const m = struct.modalBridge[k];
      return `${k}→${m.es || m.hint || ''}`;
    }).join('; '));
  }
  if (map && Array.isArray(map.tracks)) {
    lines.push('Tracks + puente (muestra):');
    map.tracks.slice(0, 8).forEach((tr) => {
      if (tr.bridge) lines.push(`- ${tr.id}: ${tr.bridge}`);
      else if (tr.formula) lines.push(`- ${tr.id}: ${tr.formula}`);
    });
  }
  _canonDigest = lines.join('\n');
  return _canonDigest.slice(0, maxLen || 2800);
}

function mandateBlock(tutor) {
  if (tutor === 'nexora') {
    return `\n\n${NEXORA_OPS_NOTE}\n${aliceVoiceBlock()}\n`;
  }
  const role =
    tutor === 'jill'
      ? 'ROL: Jill = Foundations MSI® (P|M|V|C, moneda, chunks de una oración). NO linkers avanzados (eso es Alice).'
      : tutor === 'alice'
        ? 'ROL: Alice = Intermediate+ Nexus (Idea+Linker+Idea, STAR, recovery) — SIEMPRE con pedagogía John (paciencia, analogía, doctrina de clase). NO Foundations MSI drill sheets.'
        : 'ROL: IA Infinity — pedagogía John obligatoria.';
  const aliceExtra = tutor === 'alice' ? `\n${aliceVoiceBlock()}\n` : '';
  return `\n\n${JOHN_STYLE_MANDATE}\n${role}${aliceExtra}\n\n${getCanonDigest(3200)}\n`;
}

const NEXORA_OPS_NOTE = `NEXORA — OPERACIÓN JOHN (sin romper personaje):
- En rolplay (cliente/entrevista): QUEDATE EN PERSONAJE. No des clase de gramática a mitad de la llamada.
- Inglés modelado = Nexus (chunks + linkers naturales). Nunca ESL genérico.
- Si el producto pide feedback/coaching post-turno: pedagogía John (patrón → puente → ejemplo → confirmá).`;

function wrapKnowledgeSlice(slice, tutor) {
  const base = mandateBlock(tutor);
  const extra = String(slice || '').trim();
  if (!extra) {
    return `${base}\n(Si Super Brain no trajo doctrina este turno: usá el GUION ORAL LOCAL + CANON arriba + el estilo John. NUNCA improvises otro método.)`;
  }
  return `${base}\n${extra}`;
}

/** Fallback rápido: mandato + guion del track (nunca perder la voz John por timeout de Super Brain). */
function fastFallbackBlock(tutor, trackId, learnerNote) {
  const who = tutor === 'jill' ? 'jill' : (tutor === 'nexora' ? 'nexora' : 'alice');
  const parts = [mandateBlock(who)];
  if (who === 'jill' && trackId) {
    const vb = trackVoiceBlock(trackId);
    if (vb) parts.push(vb);
  }
  if (learnerNote) parts.push(learnerNote);
  return parts.filter(Boolean).join('\n');
}

module.exports = {
  JOHN_STYLE_MANDATE,
  NEXORA_OPS_NOTE,
  getCanonDigest,
  mandateBlock,
  wrapKnowledgeSlice,
  getTrackVoice,
  trackVoiceBlock,
  aliceVoiceBlock,
  loadVoicePack,
  fastFallbackBlock
};
