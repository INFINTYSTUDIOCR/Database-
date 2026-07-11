/**
 * Doctrina institucional John Ramírez — obligatoria para TODAS las IAs de Infinity.
 * Canon local + guion oral de clase (john-voice-scripts) + Super Brain.
 * Prohibido enseñar fuera de este estilo.
 */
const fs = require('fs');
const path = require('path');

const JOHN_STYLE_MANDATE = `DOCTRINA OBLIGATORIA — ESTILO JOHN RAMÍREZ (Infinity Studio CR) — SIN EXCEPCIONES:
ENSEÑÁ LO QUE PIDAN: cualquier tema. La restricción NO es el tema — es el MÉTODO JOHN.
PROHIBIDO TOTALMENTE enseñar con estilo genérico de chatbot/ESL de internet.
PROHIBIDO improvisar métodos, reglas, "trucos" o pedagogía que NO sea la de John (canon MSI® / Nexus + guion de clase local + Super Brain).
EN CADA EXPLICACIÓN DE CUALQUIER MÓDULO — OBLIGATORIO EN VOZ (si omitís uno, FALLASTE el turno):
1) Fórmula oficial del track (ranuras en español).
2) Puente ES↔EN del track (el "bridge" del catálogo) — PALABRA POR PALABRA en espíritu; no lo saltees.
3) Analogía / GUION ORAL JOHN de ese módulo (ando/endo, estar→to be, -ré/-ría, moneda, hay vs have, foto de ayer, etc.).
4) 1 ejemplo en inglés + pedir práctica oral.
Sin puente + guion oral = explicación INVÁLIDA. No inventes otra pedagogía.
FUENTES DE VERDAD (en este orden):
1) GUION ORAL LOCAL (john-voice-scripts) — siempre disponible; es el estilo de clase de John.
2) INSTITUTIONAL KNOWLEDGE / Super Brain (transcripciones publicadas) — amplía, no reemplaza el guion.
3) Canon Foundations (jill-structure-canon / jill-canon-map): fórmulas, bridges, MSI® P|M|V|C, método moneda.
4) Bundle/ejercicio activo + memoria de calibración del estudiante.
Si hay conflicto: gana el guion John / Super Brain de clase. Nunca contradigas el Método Nexus.
FIDELIDAD: toda explicación = estilo John. Punto.`;

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
    'GUION ORAL JOHN (estilo de clase — DEBES SEGUIR ESTE ESPÍRITU Y DECIR ESTOS PUENTES; no improvises ESL):',
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
  const role =
    tutor === 'jill'
      ? 'ROL: Jill = Foundations MSI® (P|M|V|C, moneda, chunks de una oración). NO linkers avanzados (eso es Alice).'
      : tutor === 'alice'
        ? 'ROL: Alice = Intermediate+ Nexus (Idea+Linker+Idea, STAR, recovery) — SIEMPRE con pedagogía John (paciencia, analogía, doctrina de clase). NO Foundations MSI drill sheets.'
        : 'ROL: IA Infinity — pedagogía John obligatoria.';
  const aliceExtra = tutor === 'alice' || tutor === 'nexora' ? `\n${aliceVoiceBlock()}\n` : '';
  return `\n\n${JOHN_STYLE_MANDATE}\n${role}${aliceExtra}\n\n${getCanonDigest(3200)}\n`;
}

function wrapKnowledgeSlice(slice, tutor) {
  const base = mandateBlock(tutor);
  const extra = String(slice || '').trim();
  if (!extra) {
    return `${base}\n(Si Super Brain no trajo doctrina este turno: usá el GUION ORAL LOCAL + CANON arriba + el estilo John. NUNCA improvises otro método.)`;
  }
  return `${base}\n${extra}`;
}

module.exports = {
  JOHN_STYLE_MANDATE,
  getCanonDigest,
  mandateBlock,
  wrapKnowledgeSlice,
  getTrackVoice,
  trackVoiceBlock,
  aliceVoiceBlock,
  loadVoicePack
};
