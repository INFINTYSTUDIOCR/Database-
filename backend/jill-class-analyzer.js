/**
 * Jill Class Analyzer — el cerebro analiza AUDIO de clases grabadas.
 *
 * Flujo:
 *   1. TRANSCRIBIR el audio (OpenAI Whisper si hay OPENAI_API_KEY, si no
 *      ElevenLabs Scribe con ELEVENLABS_KEY — reutiliza llaves existentes).
 *   2. ANALIZAR estructura de toda la clase con el mismo Jill DJ (tiempos,
 *      preposiciones, expresiones, vocabulario, orden de palabras).
 *   3. AGREGAR los fallos por categoría ? patrones de la clase.
 *   4. CASCADA al Super Brain para que Jill/Alice refuercen lo que la clase falla.
 *
 * No mide acento: en la metodología Infinity el acento se contagia del TTS.
 */

'use strict';

const JillDrillBank = require('../js/jill-drill-bank.js');
const JillStructureCoach = require('./jill-structure-coach');

const CLASS_BRAIN_ID = 'JILL-CLASS-BRAIN';

let _superBrain = null;
let _sbSet = null;
let _sbGetOne = null;

function initClassAnalyzer({ superBrain, sbSet, sbGetOne } = {}) {
  _superBrain = superBrain || null;
  _sbSet = sbSet || null;
  _sbGetOne = sbGetOne || null;
}

/* ----------------------------- Transcripción ----------------------------- */

async function transcribeWhisper(buffer, mimeType, filename, key) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'audio/mpeg' }), filename || 'class.mp3');
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form
  });
  if (!r.ok) throw new Error(`whisper ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { text: j.text || '', provider: 'openai-whisper' };
}

async function transcribeScribe(buffer, mimeType, filename, key) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'audio/mpeg' }), filename || 'class.mp3');
  form.append('model_id', 'scribe_v1');
  const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': key },
    body: form
  });
  if (!r.ok) throw new Error(`scribe ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { text: j.text || '', provider: 'elevenlabs-scribe' };
}

async function transcribeAudio(buffer, mimeType, filename) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_KEY;
  if (openaiKey) return transcribeWhisper(buffer, mimeType, filename, openaiKey);
  if (elevenKey) return transcribeScribe(buffer, mimeType, filename, elevenKey);
  throw new Error('No hay llave de transcripción (configurá OPENAI_API_KEY o ELEVENLABS_KEY).');
}

/* ------------------------------- Análisis -------------------------------- */

function splitSegments(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function analyzeTranscript(text) {
  const segments = splitSegments(text);
  const byCat = {};
  let totalFaults = 0;
  let englishSegments = 0;

  segments.forEach((seg) => {
    const r = JillStructureCoach.analyzeTurn(seg);
    if (r.mostlyEnglish) englishSegments++;
    r.findings.forEach((f) => {
      totalFaults++;
      if (!byCat[f.category]) {
        byCat[f.category] = {
          category: f.category,
          label: JillDrillBank.categoryLabel(f.category),
          kpi: f.kpi,
          count: 0,
          samples: []
        };
      }
      byCat[f.category].count++;
      if (byCat[f.category].samples.length < 4) {
        byCat[f.category].samples.push({ text: seg.slice(0, 140), issue: f.issue });
      }
    });
  });

  const byCategory = Object.values(byCat).sort((a, b) => b.count - a.count);
  return {
    segmentCount: segments.length,
    englishSegments,
    totalFaults,
    byCategory,
    topCategories: byCategory.slice(0, 5)
  };
}

/* ------------------------------- Cascada --------------------------------- */

async function cascadeClassToBrain(report, meta = {}) {
  const top = (report.byCategory || []).filter((c) => c.count >= 2).slice(0, 5);
  if (top.length && _superBrain?.ingestFromDrillFailure) {
    for (const c of top) {
      await _superBrain.ingestFromDrillFailure({
        studentName: meta.className || meta.group || 'clase grabada',
        category: c.category,
        categoryLabel: c.label,
        kpi: c.kpi
      }).catch(() => {});
    }
  }
  if (_sbSet) {
    const rowId = `${CLASS_BRAIN_ID}-${meta.classId || Date.now()}`;
    await _sbSet('infinity_sessions', rowId, {
      ...report,
      meta,
      at: new Date().toISOString()
    }).catch(() => {});
  }
  return top;
}

/* ------------------------------ Orquestador ------------------------------ */

async function analyzeClassTranscript(transcript, opts = {}) {
  const report = analyzeTranscript(transcript);
  const cascaded = await cascadeClassToBrain(report, opts.meta || {});
  return { transcript, report, cascaded };
}

async function analyzeClassAudio(buffer, opts = {}) {
  const { text, provider } = await transcribeAudio(buffer, opts.mimeType, opts.filename);
  const result = await analyzeClassTranscript(text, opts);
  return { ...result, provider };
}

module.exports = {
  initClassAnalyzer,
  transcribeAudio,
  splitSegments,
  analyzeTranscript,
  cascadeClassToBrain,
  analyzeClassTranscript,
  analyzeClassAudio,
  CLASS_BRAIN_ID
};
