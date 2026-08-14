/**
 * Johnny class layers — split a teaching transcript into 3 fixed layers
 * for Super Brain (Jill / Alice / Nexora).
 *
 * Layers:
 *   pedagogy[]  — portable didactic DNA
 *   delivery[]  — segment pacing / kind
 *   structures[] — linguistic-operational kit
 */

'use strict';

const CATEGORIES = new Set([
  'metodologia',
  'jill-foundations',
  'conectores',
  'ejercicios',
  'errores'
]);

const DELIVERY_KINDS = new Set(['explain', 'exercise', 'improv', 'silence', 'transition']);

function emptyLayers(title) {
  return {
    title: String(title || 'Clase Johnny').slice(0, 120),
    category: 'metodologia',
    pedagogy: [],
    delivery: [],
    structures: [],
    doctrineMarkdown: ''
  };
}

function normalizeLayers(raw, fallbackTitle) {
  const base = emptyLayers(fallbackTitle);
  if (!raw || typeof raw !== 'object') return base;

  const title = String(raw.title || fallbackTitle || 'Clase Johnny').slice(0, 120);
  const category = CATEGORIES.has(String(raw.category || ''))
    ? String(raw.category)
    : 'metodologia';

  const pedagogy = (Array.isArray(raw.pedagogy) ? raw.pedagogy : [])
    .slice(0, 12)
    .map((p) => ({
      name: String(p?.name || '').slice(0, 120),
      evidence: String(p?.evidence || '').slice(0, 500),
      whyItWorks: String(p?.whyItWorks || '').slice(0, 500)
    }))
    .filter((p) => p.name || p.evidence);

  const delivery = (Array.isArray(raw.delivery) ? raw.delivery : [])
    .slice(0, 40)
    .map((d) => ({
      segment: String(d?.segment || '').slice(0, 400),
      approxSec: Math.max(0, Number(d?.approxSec) || 0),
      kind: DELIVERY_KINDS.has(String(d?.kind || '')) ? String(d.kind) : 'explain',
      note: String(d?.note || '').slice(0, 400)
    }))
    .filter((d) => d.segment || d.note);

  const structures = (Array.isArray(raw.structures) ? raw.structures : [])
    .slice(0, 20)
    .map((s) => ({
      pattern: String(s?.pattern || '').slice(0, 200),
      shortcut: String(s?.shortcut || '').slice(0, 120),
      exampleEN: String(s?.exampleEN || '').slice(0, 400),
      howToInstall: String(s?.howToInstall || '').slice(0, 500)
    }))
    .filter((s) => s.pattern || s.exampleEN);

  const layers = { title, category, pedagogy, delivery, structures, doctrineMarkdown: '' };
  layers.doctrineMarkdown = String(raw.doctrineMarkdown || '').trim() || formatLayersMarkdown(layers);
  return layers;
}

function heuristicSplit(transcript, titleHint) {
  const text = String(transcript || '').trim();
  const title = String(titleHint || '').trim() || `Clase Johnny · ${new Date().toISOString().slice(0, 10)}`;
  const chunks = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const pedagogy = [{
    name: 'Modelar → practicar → corregir con pregunta',
    evidence: chunks.slice(0, 2).join(' ').slice(0, 400) || text.slice(0, 400),
    whyItWorks: 'El alumno ve el patrón, lo usa y recibe corrección sin spoilear la respuesta.'
  }];

  const delivery = chunks.slice(0, 12).map((seg, i) => {
    const lower = seg.toLowerCase();
    let kind = 'explain';
    if (/\b(ejercicio|practica|practice|try|intent[ae]|repet[ií])\b/.test(lower)) kind = 'exercise';
    else if (/\b(improv|improvise|libre|free talk|role.?play)\b/.test(lower)) kind = 'improv';
    else if (/\b(ok|ahora|next|siguiente|pasamos)\b/.test(lower)) kind = 'transition';
    return {
      segment: seg.slice(0, 400),
      approxSec: Math.max(8, Math.round(seg.split(/\s+/).length * 0.45)),
      kind,
      note: i === 0 ? 'Apertura / framing' : ''
    };
  });

  const structures = [];
  const slotHit = text.match(/\b(P\s*[|·]\s*M\s*[|·]\s*V\s*[|·]\s*C|sujeto|verbo|complemento|because|although|however)\b/i);
  if (slotHit) {
    structures.push({
      pattern: slotHit[0],
      shortcut: 'MSI / linker',
      exampleEN: chunks.find((c) => /\b(I|you|we|they|he|she)\b/i.test(c))?.slice(0, 200) || '',
      howToInstall: 'Repetir el patrón en voz alta y pedir al alumno que complete la ranura vacía.'
    });
  } else if (chunks.length) {
    structures.push({
      pattern: 'Frase modelo de la clase',
      shortcut: 'echo → swap',
      exampleEN: chunks.find((c) => /[a-z]/i.test(c))?.slice(0, 200) || chunks[0].slice(0, 200),
      howToInstall: 'Eco del modelo + sustituir una pieza (sujeto/tiempo/linker).'
    });
  }

  return normalizeLayers({ title, category: 'metodologia', pedagogy, delivery, structures }, title);
}

function formatLayersMarkdown(layers) {
  const L = layers || emptyLayers();
  const lines = [];
  lines.push(`# ${L.title || 'Clase Johnny'}`);
  lines.push('');
  lines.push(`Categoría: ${L.category || 'metodologia'}`);
  lines.push('');
  lines.push('## Pedagogía (ADN didáctico)');
  if (!(L.pedagogy || []).length) {
    lines.push('- (sin entradas)');
  } else {
    L.pedagogy.forEach((p, i) => {
      lines.push(`${i + 1}. **${p.name || 'Técnica'}**`);
      if (p.evidence) lines.push(`   - Evidencia: ${p.evidence}`);
      if (p.whyItWorks) lines.push(`   - Por qué funciona: ${p.whyItWorks}`);
    });
  }
  lines.push('');
  lines.push('## Entrega (ritmo de clase)');
  if (!(L.delivery || []).length) {
    lines.push('- (sin segmentos)');
  } else {
    L.delivery.forEach((d, i) => {
      const sec = d.approxSec ? ` ~${d.approxSec}s` : '';
      lines.push(`${i + 1}. [${d.kind || 'explain'}${sec}] ${d.segment || ''}`);
      if (d.note) lines.push(`   - Nota: ${d.note}`);
    });
  }
  lines.push('');
  lines.push('## Estructuras (kit lingüístico)');
  if (!(L.structures || []).length) {
    lines.push('- (sin estructuras)');
  } else {
    L.structures.forEach((s, i) => {
      lines.push(`${i + 1}. **${s.pattern || 'Patrón'}**${s.shortcut ? ` (${s.shortcut})` : ''}`);
      if (s.exampleEN) lines.push(`   - Ejemplo EN: ${s.exampleEN}`);
      if (s.howToInstall) lines.push(`   - Cómo instalar: ${s.howToInstall}`);
    });
  }
  lines.push('');
  lines.push('---');
  lines.push('Fuente: grabación de clase Johnny → 3 capas → Super Brain (Jill / Alice / Nexora).');
  return lines.join('\n').slice(0, 11000);
}

function parseClaudeJson(text) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in Claude reply');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * @param {string} transcript
 * @param {{ title?: string, claudeCall?: Function }} [opts]
 */
async function splitTeachingLayers(transcript, opts = {}) {
  const text = String(transcript || '').trim().slice(0, 14000);
  if (text.length < 20) throw new Error('La transcripción necesita al menos 20 caracteres.');

  const titleHint = opts.title || '';
  const claudeCall = opts.claudeCall;
  if (!claudeCall || !process.env.ANTHROPIC_API_KEY) {
    return heuristicSplit(text, titleHint);
  }

  try {
    const resp = await claudeCall({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2200,
      system: `Sos el editor pedagógico de Infinity Studio CR (John Ramírez · Nexus · Mecánica Estructural Infinity®).
Separás una TRANSCRIPCIÓN de clase del fundador en EXACTAMENTE 3 capas institucionales para Jill, Alice y Nexora.
Respondé SOLO JSON válido, sin markdown ni prosa fuera del JSON.`,
      messages: [{
        role: 'user',
        content: `Transcripción de clase Johnny:
"""
${text}
"""

Título sugerido (opcional): ${titleHint || '(inventá uno corto)'}

Devolvé JSON exacto con este schema:
{
  "title": "título corto máx 100 chars",
  "category": "metodologia|jill-foundations|conectores|ejercicios|errores",
  "pedagogy": [{"name":"técnica didáctica","evidence":"cita o parafraseo de la clase","whyItWorks":"por qué es portable"}],
  "delivery": [{"segment":"qué ocurre","approxSec":30,"kind":"explain|exercise|improv|silence|transition","note":"opcional"}],
  "structures": [{"pattern":"ranura/patrón","shortcut":"atajo verbal","exampleEN":"ejemplo en inglés","howToInstall":"cómo Jill/Alice lo instalan"}],
  "doctrineMarkdown": "opcional; si vacío el servidor lo genera"
}

Reglas:
- pedagogy: 2–6 ítems (ADN didáctico, no resumen libre).
- delivery: 4–15 segmentos en orden aproximado de la clase.
- structures: 1–8 patrones lingüísticos/operacionales instalables.
- Español claro en name/evidence/note/howToInstall; exampleEN en inglés.`
      }]
    });
    const reply = (resp.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    const parsed = parseClaudeJson(reply);
    return normalizeLayers(parsed, titleHint || undefined);
  } catch (e) {
    console.warn('splitTeachingLayers Claude fallback:', e.message);
    return heuristicSplit(text, titleHint);
  }
}

module.exports = {
  splitTeachingLayers,
  formatLayersMarkdown,
  normalizeLayers,
  heuristicSplit,
  CATEGORIES,
  DELIVERY_KINDS
};
