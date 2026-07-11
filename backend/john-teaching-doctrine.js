/**
 * Doctrina institucional John Ramírez — obligatoria para TODAS las IAs de Infinity.
 * Canon local + Super Brain (transcripciones de clase). Prohibido enseñar fuera de este estilo.
 */
const fs = require('fs');
const path = require('path');

const JOHN_STYLE_MANDATE = `DOCTRINA OBLIGATORIA — ESTILO JOHN RAMÍREZ (Infinity Studio CR) — SIN EXCEPCIONES:
ENSEÑÁ LO QUE PIDAN: cualquier tema. La restricción NO es el tema — es el MÉTODO JOHN.
PROHIBIDO TOTALMENTE enseñar con estilo genérico de chatbot/ESL de internet.
PROHIBIDO improvisar métodos, reglas, "trucos" o pedagogía que NO sea la de John (canon MSI® / Nexus + doctrina de clases en Super Brain).
EN CADA EXPLICACIÓN DE CUALQUIER MÓDULO — OBLIGATORIO EN VOZ (si omitís uno, FALLASTE el turno):
1) Fórmula oficial del track (ranuras en español).
2) Puente ES↔EN del track (el "bridge" del catálogo) — PALABRA POR PALABRA en espíritu; no lo saltees.
3) Analogía John de ese módulo (ando/endo, -ré/-ría, moneda, hay vs have, foto de ayer, etc.).
4) 1 ejemplo en inglés + pedir práctica oral.
Sin puente + analogía = explicación INVÁLIDA. No inventes otra pedagogía.
FUENTES DE VERDAD (en este orden):
1) INSTITUTIONAL KNOWLEDGE / Super Brain (transcripciones y doctrina de clase publicadas).
2) Canon Foundations (jill-structure-canon / jill-canon-map): fórmulas, bridges, MSI® P|M|V|C, método moneda.
3) Bundle/ejercicio activo + memoria de calibración del estudiante.
Si hay conflicto: gana la doctrina John / Super Brain. Nunca contradigas el Método Nexus.
FIDELIDAD: toda explicación = estilo John. Punto.`;

let _canonDigest = null;

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

function getCanonDigest(maxLen) {
  if (_canonDigest) return _canonDigest.slice(0, maxLen || 1800);
  const struct = loadJsonSafe('config', 'jill-structure-canon.json') || loadJsonSafe('..', 'config', 'jill-structure-canon.json');
  const map = loadJsonSafe('config', 'jill-canon-map.json') || loadJsonSafe('..', 'config', 'jill-canon-map.json');
  const lines = ['CANON LOCAL (Foundations — siempre disponible aunque Super Brain falle):'];
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
    map.tracks.slice(0, 12).forEach((tr) => {
      if (tr.bridge) lines.push(`- ${tr.id}: ${tr.bridge}`);
      else if (tr.formula) lines.push(`- ${tr.id}: ${tr.formula}`);
    });
  }
  _canonDigest = lines.join('\n');
  return _canonDigest.slice(0, maxLen || 1800);
}

function mandateBlock(tutor) {
  const role =
    tutor === 'jill'
      ? 'ROL: Jill = Foundations MSI® (P|M|V|C, moneda, chunks de una oración). NO linkers avanzados (eso es Alice).'
      : tutor === 'alice'
        ? 'ROL: Alice = Intermediate+ Nexus (Idea+Linker+Idea, STAR, recovery) — SIEMPRE con pedagogía John (paciencia, analogía, doctrina de clase). NO Foundations MSI drill sheets.'
        : 'ROL: IA Infinity — pedagogía John obligatoria.';
  return `\n\n${JOHN_STYLE_MANDATE}\n${role}\n\n${getCanonDigest(1400)}\n`;
}

function wrapKnowledgeSlice(slice, tutor) {
  const base = mandateBlock(tutor);
  const extra = String(slice || '').trim();
  if (!extra) {
    return `${base}\n(Si Super Brain no trajo doctrina este turno: usá el CANON LOCAL arriba + el estilo John. NUNCA improvises otro método.)`;
  }
  return `${base}\n${extra}`;
}

module.exports = {
  JOHN_STYLE_MANDATE,
  getCanonDigest,
  mandateBlock,
  wrapKnowledgeSlice
};
