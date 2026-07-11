/**
 * Interpreta pedidos de estudiantes con mala ortografía / pronunciación / ASR.
 * Expande a formas canónicas para que pickTrack encuentre el módulo.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JillLearnerIntent = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Reescrituras fonéticas / ASR / español aproximado → inglés/canon Foundations */
  var REWRITES = [
    // will / would (muy frecuente)
    [/\bwilly\s*good\b/gi, 'will would'],
    [/\bwilly\s*(y|and|e)\s*(wood|would|wud|good)\b/gi, 'will would'],
    [/\b(wood|wud|woud|wold)\s*(y|and|e)\s*(willy|will|wil|huil)\b/gi, 'will would'],
    [/\bambas\s+(wood|wud|would|willy|will)\b/gi, 'will would'],
    [/\bwilly\b/gi, 'will'],
    [/\bwil+\b/gi, 'will'],
    [/\bhuil\b/gi, 'will'],
    [/\buil\b/gi, 'will'],
    [/\bweel\b/gi, 'will'],
    [/\bwood\b/gi, 'would'],
    [/\bwud\b/gi, 'would'],
    [/\bwoud\b/gi, 'would'],
    [/\bwold\b/gi, 'would'],
    // should / could / can / must
    [/\bshud\b/gi, 'should'],
    [/\bchud\b/gi, 'should'],
    [/\bshuld\b/gi, 'should'],
    [/\bshood\b/gi, 'should'],
    [/\bcud\b/gi, 'could'],
    [/\bculd\b/gi, 'could'],
    [/\bcood\b/gi, 'could'],
    [/\bken\b/gi, 'can'],
    [/\bmast\b/gi, 'must'],
    [/\bmust\s*haf\b/gi, 'must have'],
    [/\bshoulda\b/gi, 'should have'],
    [/\bcoulda\b/gi, 'could have'],
    [/\bwoulda\b/gi, 'would have'],
    [/\bmust\s*haf\s*bin\b/gi, 'must have been'],
    // going to / future
    [/\bgonna\b/gi, 'going to'],
    [/\bgoin\s*to\b/gi, 'going to'],
    [/\bgoing\s*tu\b/gi, 'going to'],
    // there is / are
    [/\bder\s*is\b/gi, 'there is'],
    [/\bder\s*are\b/gi, 'there are'],
    [/\bdere\s*is\b/gi, 'there is'],
    [/\bdere\s*are\b/gi, 'there are'],
    [/\btheris\b/gi, 'there is'],
    [/\btherare\b/gi, 'there are'],
    [/\bdey\s*are\b/gi, 'they are'],
    [/\bdey\s*is\b/gi, 'there is'],
    // been / have
    [/\bbin\b/gi, 'been'],
    [/\bhaf\b/gi, 'have'],
    [/\bjas\b/gi, 'has'],
    [/\bjad\b/gi, 'had'],
    // tenses / topics (español mal escrito)
    [/\bpasao\b/gi, 'pasado'],
    [/\bpasa[oó]\s*simple\b/gi, 'pasado simple'],
    [/\bpresente\s*kontinuo\b/gi, 'presente continuo'],
    [/\bkontinuo\b/gi, 'continuo'],
    [/\bcontinou\b/gi, 'continuo'],
    [/\bperfekt[oa]?\b/gi, 'perfecto'],
    [/\bpresent\s*perfekt\b/gi, 'presente perfecto'],
    [/\bjerundio\b/gi, 'gerundio'],
    [/\bgerund\b/gi, 'gerundio'],
    [/\bgerundio\s*prep\b/gi, 'gerundio despues de preposicion'],
    [/\bpreposi[sc]i[oó]n(es)?\b/gi, 'preposiciones'],
    [/\binonat\b/gi, 'in on at'],
    [/\bin\s*on\s*at\b/gi, 'in on at'],
    [/\bart[ií]cul[oa]s?\b/gi, 'articulos'],
    [/\bcomparati[vw][oa]s?\b/gi, 'comparativos'],
    [/\bnegaci[oó]n(es)?\b/gi, 'negaciones'],
    [/\birregular(es)?\b/gi, 'verbos irregulares'],
    [/\bmoned[ao]\b/gi, 'metodo moneda'],
    [/\binversi[oó]n\b/gi, 'inversion'],
    [/\bfuturo\s*perfekt[oa]?\b/gi, 'futuro perfecto'],
    [/\bwill\s*haf\b/gi, 'will have'],
    [/\bcomo\s+fun[cs]iona\b/gi, 'explicame'],
    [/\bc[oó]mo\s+fun[cs]iona\b/gi, 'explicame']
  ];

  /** Términos canónicos para fuzzy (distancia de edición) */
  var FUZZY_TERMS = [
    'will', 'would', 'should', 'could', 'can', 'must', 'may', 'might',
    'gerundio', 'gerund', 'modales', 'modal', 'futuro', 'future',
    'pasado', 'presente', 'continuo', 'perfecto', 'participio',
    'preposiciones', 'preposicion', 'articulos', 'comparativos',
    'negaciones', 'negacion', 'moneda', 'inversion',
    'there', 'been', 'have', 'going', 'irregular', 'irregulares'
  ];

  function normalizeBase(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.,;:]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function editDistance(a, b) {
    a = String(a || '');
    b = String(b || '');
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var i, j, prev, cur, tmp;
    var row = [];
    for (j = 0; j <= b.length; j++) row[j] = j;
    for (i = 1; i <= a.length; i++) {
      prev = i - 1;
      cur = i;
      for (j = 1; j <= b.length; j++) {
        tmp = row[j];
        row[j] = cur = a.charAt(i - 1) === b.charAt(j - 1)
          ? prev
          : Math.min(prev, cur, row[j]) + 1;
        prev = tmp;
      }
    }
    return row[b.length];
  }

  function fuzzyToken(tok) {
    if (!tok || tok.length < 4) return tok;
    // Ya es un término canónico — no lo mutes (would↛could, should↛would)
    if (FUZZY_TERMS.indexOf(tok) >= 0) return tok;
    var best = null;
    var bestD = 99;
    for (var i = 0; i < FUZZY_TERMS.length; i++) {
      var term = FUZZY_TERMS[i];
      var maxD = tok.length >= 6 ? 2 : 1;
      if (Math.abs(tok.length - term.length) > maxD) continue;
      var d = editDistance(tok, term);
      if (d > 0 && d <= maxD && d < bestD) {
        bestD = d;
        best = term;
      }
    }
    return best || tok;
  }

  function expand(text) {
    var t = String(text || '');
    if (!t.trim()) return t;
    for (var i = 0; i < REWRITES.length; i++) {
      t = t.replace(REWRITES[i][0], REWRITES[i][1]);
    }
    var parts = normalizeBase(t).split(/\s+/);
    var out = [];
    for (var p = 0; p < parts.length; p++) {
      out.push(fuzzyToken(parts[p]));
    }
    // Mantener original + expansión para que aliases largos sigan matcheando
    var expanded = out.join(' ');
    if (expanded && expanded !== normalizeBase(text)) {
      return String(text || '') + ' ' + expanded;
    }
    return String(text || '');
  }

  function explainGuess(original, expanded) {
    var o = normalizeBase(original);
    var e = normalizeBase(expanded);
    if (!e || e === o) return '';
    if (/\bwill\b/.test(e) && /\bwould\b/.test(e)) return 'will y would';
    if (/\bwill\b/.test(e)) return 'will';
    if (/\bwould\b/.test(e)) return 'would';
    if (/\bshould\b/.test(e)) return 'should';
    if (/\bcould\b/.test(e)) return 'could';
    if (/\bthere\s+is\b/.test(e)) return 'there is';
    if (/\bgoing\s+to\b/.test(e)) return 'going to';
    if (/\bgerundio\b/.test(e)) return 'gerundio';
    return '';
  }

  return {
    expand: expand,
    normalizeBase: normalizeBase,
    explainGuess: explainGuess,
    editDistance: editDistance
  };
});
