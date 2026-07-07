/**
 * Modelo de enseùanza Johnny / Infinity ù reglas duras para Jill y Alice.
 */
const fs = require('fs');
const path = require('path');

const PRONOUNS = ['i', 'you', 'he', 'she', 'it', 'we', 'they'];
const THIRD = { he: 1, she: 1, it: 1 };
const LINKER_RE = /\b(and|but|however|because|so|therefore|although|furthermore|also|plus|then|when|while|after|before|as well as|in addition|on top of that|as a result|which means|despite)\b/i;

const JILL_PRE_LINKER_BUNDLES = new Set([
  'F0-matrix', 'F1-msi', 'B2-verbs', 'F2-pronouns', 'B3-tenses', 'F3-modals', 'F4-components',
  'B5-basics', 'F5-vocab-functional', 'F6-oral-production', 'B6-recovery', 'F7-alice-ready'
]);

const VERB_FORMS = {
  be: { base: 'be', pr3: 'is', ps: 'was', pp: 'been', ing: 'being', prI: 'am', prYou: 'are', prWe: 'are' },
  have: { base: 'have', pr3: 'has', ps: 'had', pp: 'had', ing: 'having' },
  do: { base: 'do', pr3: 'does', ps: 'did', pp: 'done', ing: 'doing' },
  work: { base: 'work', pr3: 'works', ps: 'worked', pp: 'worked', ing: 'working' },
  study: { base: 'study', pr3: 'studies', ps: 'studied', pp: 'studied', ing: 'studying' },
  go: { base: 'go', pr3: 'goes', ps: 'went', pp: 'gone', ing: 'going' },
  make: { base: 'make', pr3: 'makes', ps: 'made', pp: 'made', ing: 'making' },
  take: { base: 'take', pr3: 'takes', ps: 'took', pp: 'taken', ing: 'taking' },
  get: { base: 'get', pr3: 'gets', ps: 'got', pp: 'gotten', ing: 'getting' },
  see: { base: 'see', pr3: 'sees', ps: 'saw', pp: 'seen', ing: 'seeing' },
  know: { base: 'know', pr3: 'knows', ps: 'knew', pp: 'known', ing: 'knowing' },
  think: { base: 'think', pr3: 'thinks', ps: 'thought', pp: 'thought', ing: 'thinking' },
  want: { base: 'want', pr3: 'wants', ps: 'wanted', pp: 'wanted', ing: 'wanting' },
  need: { base: 'need', pr3: 'needs', ps: 'needed', pp: 'needed', ing: 'needing' },
  say: { base: 'say', pr3: 'says', ps: 'said', pp: 'said', ing: 'saying' },
  tell: { base: 'tell', pr3: 'tells', ps: 'told', pp: 'told', ing: 'telling' }
};

let _drillsCache = null;

function loadTrainerDrills() {
  if (_drillsCache) return _drillsCache;
  const paths = [
    path.join(__dirname, 'config/trainer-drills.json'),
    path.join(__dirname, '../config/trainer-drills.json')
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        _drillsCache = JSON.parse(fs.readFileSync(p, 'utf8'));
        return _drillsCache;
      }
    } catch { /* next */ }
  }
  _drillsCache = { drills: {}, doctrine: '' };
  return _drillsCache;
}

function countEnglishSentences(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  const parts = t.split(/(?<=[.!?])\s+/).filter((s) => /[a-zA-Z]/.test(s));
  if (parts.length > 1) return parts.length;
  if (/[.!?]/.test(t)) return 1;
  return /[a-zA-Z]{3,}/.test(t) ? 1 : 0;
}

function englishWordCount(text) {
  return (String(text || '').match(/\b[a-zA-Z']+\b/g) || []).length;
}

function detectPronoun(text) {
  const m = String(text || '').toLowerCase().match(/\b(i|you|he|she|it|we|they)\b/);
  return m ? m[1] : null;
}

function validateMatrixSentence(text, matrixContext) {
  if (!matrixContext || matrixContext.bundleId !== 'F0-matrix') return { ok: null, issues: [] };
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();
  const issues = [];
  const col = String(matrixContext.activeColumn || matrixContext.sigla || 'present').toLowerCase();
  const sigla = String(matrixContext.sigla || '').toUpperCase();
  const expectedP = String(matrixContext.drillPrompt || '').split('+')[0].trim().toLowerCase();
  const verb = matrixContext.drillVerb
    ? String(matrixContext.drillVerb).toLowerCase()
    : ((matrixContext.drillPrompt || '').match(/\+\s*([a-z]+)/i) || [])[1]?.toLowerCase() || null;
  const forms = verb && VERB_FORMS[verb] ? VERB_FORMS[verb] : null;

  const pronoun = detectPronoun(lower);
  if (!pronoun) issues.push('Falta pronombre (P).');
  else if (expectedP && pronoun !== expectedP) issues.push(`Usù el pronombre del drill: ${expectedP}.`);

  if (sigla === 'PR' || col === 'present') {
    if (forms && pronoun) {
      const need3s = THIRD[pronoun] && forms.pr3;
      const hasForm = lower.includes(forms.base) || lower.includes(forms.pr3) || lower.includes(forms.pr3.replace('ies', 'y'));
      if (!hasForm) issues.push(`Falta verbo (V): ${verb}.`);
      if (need3s && forms.pr3 && !new RegExp(`\\b${forms.pr3}\\b`).test(lower) && !new RegExp(`\\b${forms.base}s\\b`).test(lower)) {
        issues.push(`3ù persona: ${pronoun} + ${forms.pr3} (+s).`);
      }
    }
  } else if (sigla === 'PS' || col === 'past') {
    if (forms && !lower.includes(forms.ps)) issues.push(`Pasado (PS): ${forms.ps}.`);
  } else if (sigla === 'PC' || col === 'progressive') {
    if (!/\b(am|is|are|was|were)\b/.test(lower)) issues.push('Falta To Be (PC).');
    if (forms && !lower.includes(forms.ing)) issues.push(`Falta V+ing: ${forms.ing}.`);
  } else if (sigla === 'PRP' || col === 'perfect') {
    if (!/\b(have|has|had)\b/.test(lower)) issues.push('Falta Have/Has/Had (PRP).');
    if (forms && !lower.includes(forms.pp)) issues.push(`Falta participio: ${forms.pp}.`);
  } else if (sigla === 'PPC' || col === 'combined') {
    if (!/\b(have|has|had)\b/.test(lower) || !/\bbeen\b/.test(lower)) issues.push('Falta have/had + been (PPC).');
    if (forms && !lower.includes(forms.ing)) issues.push(`Falta V+ing: ${forms.ing}.`);
  } else if (sigla === 'MOD' || col === 'modal') {
    const modal = matrixContext.drillModal || (matrixContext.drillPrompt || '').match(/\b(will|would|can|could|should|must|may|might)\b/i);
    const modalWord = modal && (modal[1] || modal[0] || modal);
    if (!/\b(will|would|can|could|should|must|may|might)\b/.test(lower)) issues.push('Falta modal (M): will/would/can/could/should.');
    if (modalWord && !new RegExp(`\\b${String(modalWord).toLowerCase()}\\b`).test(lower)) {
      issues.push(`Usù el modal del drill: ${modalWord}.`);
    }
    if (forms && !new RegExp(`\\b${forms.base}\\b`).test(lower)) issues.push(`Verbo base despuùs del modal: ${verb || forms.base}.`);
  }

  if (raw.split(/\s+/).length < 3) issues.push('Complemento (C) muy corto ù una idea concreta.');
  return { ok: issues.length === 0, issues, slot: 'P|M|V|C' };
}

function pickActiveDrill(student, tutor, bundle, matrixContext) {
  const cfg = loadTrainerDrills();
  const drills = cfg.drills || {};
  const tb = (student?.trainingBook || [])[0];
  if (tb?.kpi) {
    const key = Object.keys(drills).find((k) => drills[k].kpi === tb.kpi || k.startsWith(tb.kpi));
    if (key && (drills[key].tutor || []).includes(tutor)) return { id: key, ...drills[key] };
  }
  const weak = [...(student?.quizWeakKpis || []), ...(student?.nemesisState?.reinforcement || [])];
  const kf = student?.kpiFile?.weakMacro || student?.kpiFile?.weakMicro || [];
  const priorities = [...weak, ...kf].map(String);

  if (bundle?.id === 'F0-matrix' || bundle?.gateMode === 'matrix-only') {
    if (matrixContext?.conversationPhase) {
      return { id: 'CONV_polish', title: 'Conversaciùn Foundations', script: 'Jill escucha; estudiante habla.' };
    }
    return { id: 'MSI_matrix', ...drills.MSI_matrix };
  }
  if (priorities.some((p) => /k9|IG|idea/i.test(p)) && tutor !== 'jill') return { id: 'IG_critical', ...drills.IG_critical };
  if (priorities.some((p) => /k8|ST|linker|structure/i.test(p)) && tutor !== 'jill') return { id: 'ST_critical', ...drills.ST_critical };
  if (tutor === 'alice' && priorities.some((p) => /k13|RA|freeze/i.test(p))) return { id: 'RA_critical', ...drills.RA_critical };

  if (tutor === 'jill') return { id: 'MSI_matrix', ...drills.MSI_matrix };
  return { id: 'ST_critical', ...drills.ST_critical };
}

function evaluateStudentTurn(text, opts = {}) {
  const { student, tutor = 'jill', bundle, matrixContext, responseMs } = opts;
  const drill = pickActiveDrill(student, tutor, bundle, matrixContext);
  const result = {
    drillId: drill?.id || null,
    drillTitle: drill?.title || null,
    forcedReply: null,
    structureOk: null,
    issues: [],
    coachNote: ''
  };

  if (!text || !String(text).trim()) {
    result.forcedReply = drill?.forcedReply || 'Say something in English.';
    return result;
  }

  if (matrixContext?.conversationPhase && !matrixContext.anecdoteMode) {
    const sentences = countEnglishSentences(text);
    const words = englishWordCount(text);
    if (words < 2) {
      result.forcedReply = 'Keep going ù say more in English.';
      return result;
    }
    result.coachNote = 'Fase conversaciùn ù Jill evalùa tiempo verbal, coordinaciùn, lùgica y fluidez en diùlogo.';
    result.structureOk = null;
    return result;
  }

  if (drill?.id === 'MSI_matrix' || (matrixContext && matrixContext.bundleId === 'F0-matrix' && !matrixContext.anecdoteMode && !matrixContext.conversationPhase)) {
    const v = validateMatrixSentence(text, matrixContext);
    result.structureOk = v.ok;
    result.issues = v.issues;
    if (v.ok === false) {
      result.coachNote = `Ranuras: ${v.issues.join(' ')}`;
      result.forcedReply = null;
    } else if (v.ok === true) {
      result.coachNote = 'Estructura MSIù vùlida ù reforzù pronunciaciùn si hace falta.';
    }
    return result;
  }

  const sentences = countEnglishSentences(text);
  const words = englishWordCount(text);

  if (drill?.id === 'IG_critical' && sentences < (drill.minSentences || 3)) {
    result.forcedReply = drill.forcedReply;
    result.issues.push(`Solo ${sentences} oraciùn(es) ù mùnimo ${drill.minSentences}.`);
    return result;
  }

  if (drill?.id === 'ST_critical' && tutor === 'alice' && sentences >= (drill.minSentences || 2) && drill.requireLinker && !LINKER_RE.test(text)) {
    result.forcedReply = drill.forcedReply;
    result.issues.push('Falta linker entre ideas.');
    return result;
  }

  if (drill?.id === 'R_critical' && responseMs && responseMs > (drill.maxResponseMs || 12000)) {
    result.issues.push('Tiempo de respuesta alto.');
    result.coachNote = 'Meta <12s con oraciùn estructurada.';
  }

  if (drill?.id === 'RA_critical' && words < (drill.minWords || 1)) {
    result.forcedReply = drill.forcedReply;
    return result;
  }

  result.structureOk = sentences >= 1 && words >= 2;
  return result;
}

const JOHNNY_TRAINER_RULE = `MODELO TRAINER INFINITY (Johnny Ramirez ù OBLIGATORIO):
- Enseùùs como en sala: regla corta ? ejemplo en pizarra (ranuras P|M|V|C) ? UNA prùctica.
- NUNCA traducciùn palabra por palabra. Estructurar, no memorizar oraciones ajenas.
- Si el sistema marca forcedReply del drill: decù EXACTAMENTE esa frase y nada mùs (ej. "Keep going.").
- Si hay issues de ranura: nombrù la ranura (P, M, V, C), mostrù la fùrmula MSIù, pedù UNA oraciùn nueva.
- Jill (Foundations): solo MSI ranuras P|M|V|C ó sin curriculum Idea+Linker+Idea (eso es Alice).ùn suelta sin conector = pedir linker y continuar.
- Correcciùn con afecto firme ù como trainer, no como chatbot motivacional.
- Foundations = Jill (MSIù, matriz, moneda). Intermediate+ = Alice (linkers, expansiùn, STAR cuando aplica).
- FASE CONVERSACIùN (estructura dominada): Jill fuerza diùlogo sostenido, escucha, compara contra canon y corrige. NO graduar automùticamente ù solo solicitar graduaciùn cuando KPIs conversacionales Johnny estùn satisfechos en sesiùn evaluate.`;

function formatTrainerEvalNote(evalResult) {
  if (!evalResult) return '';
  const parts = [];
  if (evalResult.drillTitle) parts.push(`DRILL ACTIVO: ${evalResult.drillTitle} (${evalResult.drillId || ''})`);
  if (evalResult.forcedReply) parts.push(`FORCED REPLY (decù solo esto): "${evalResult.forcedReply}"`);
  if (evalResult.issues?.length) parts.push(`ISSUES: ${evalResult.issues.join('; ')}`);
  if (evalResult.coachNote) parts.push(`COACH: ${evalResult.coachNote}`);
  if (evalResult.structureOk === true) parts.push('STRUCTURE OK: validù brevemente y siguiente drill.');
  if (evalResult.structureOk === false) parts.push('STRUCTURE FAIL: corregir ranuras antes de avanzar.');
  return parts.length ? `\n${parts.join('\n')}` : '';
}

function formatTrainerDrillNote(student, tutor, bundle, matrixContext) {
  const drill = pickActiveDrill(student, tutor, bundle, matrixContext);
  if (!drill) return '';
  return `\nDRILL TRAINER: ${drill.title || drill.id}\nScript: ${drill.script || ''}`;
}

module.exports = {
  loadTrainerDrills,
  pickActiveDrill,
  evaluateStudentTurn,
  validateMatrixSentence,
  countEnglishSentences,
  JOHNNY_TRAINER_RULE,
  formatTrainerEvalNote,
  formatTrainerDrillNote
};
