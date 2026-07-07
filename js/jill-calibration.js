/**
 * Jill - calibracion inicial (verbos, conectores, articulos, preposiciones, MSI).
 */
(function (global) {
  'use strict';

  var VERSION = 1;

  var DIM_LABELS = {
    verbs: 'verbos',
    transitions: 'conectores basicos',
    articles: 'articulos',
    prepositions: 'preposiciones',
    msi: 'estructura MSI'
  };

  var DIM_KPIS = {
    verbs: ['k2', 'k3'],
    transitions: ['k8', 'k9'],
    articles: ['k4'],
    prepositions: ['k4'],
    msi: ['k3', 'k10']
  };

  var BUNDLE_HINTS = {
    verbs: 'B2-verbs',
    transitions: 'B1-chunking',
    articles: 'F2-pronouns',
    prepositions: 'F2-pronouns',
    msi: 'F0-matrix'
  };

  var PROBES = [
    { id: 'v1', dim: 'verbs', ask: 'Completa en ingles: Yesterday I ___ (work) at the office.', hint: 'Pasado simple', expect: /\bworked\b/i, partial: /\bwork/i, kpi: 'k2' },
    { id: 'v2', dim: 'verbs', ask: 'Completa: I have ___ (be) there before.', hint: 'Have + participio', expect: /\bbeen\b/i, partial: /\b(be|was|were)\b/i, kpi: 'k2' },
    { id: 't1', dim: 'transitions', ask: 'Une con un conector basico (and / but / because / so): I was tired ___ I went home.', hint: 'Una palabra en ingles', expect: /\b(so|and|but|because)\b/i, partial: /\b(y|pero|porque)\b/i, kpi: 'k8' },
    { id: 't2', dim: 'transitions', ask: 'Agrega una idea: "I like coffee. ___, I like tea." (and / also)', hint: 'Conector de suma', expect: /\b(and|also)\b/i, partial: /\b(y|too)\b/i, kpi: 'k9' },
    { id: 'a1', dim: 'articles', ask: 'She is ___ engineer.', hint: 'a o an', expect: /\ban\b/i, partial: /\ba\b/i, kpi: 'k4' },
    { id: 'a2', dim: 'articles', ask: '___ sun is very bright today.', hint: 'Articulo definido', expect: /\bthe\b/i, partial: /sol|sun/i, kpi: 'k4' },
    { id: 'p1', dim: 'prepositions', ask: 'I live ___ San Jose.', hint: 'Ciudad', expect: /\bin\b/i, partial: /\b(at|on)\b/i, kpi: 'k4' },
    { id: 'p2', dim: 'prepositions', ask: 'We meet ___ 5 pm.', hint: 'Hora', expect: /\bat\b/i, partial: /\b(in|on)\b/i, kpi: 'k4' },
    { id: 'm1', dim: 'msi', ask: 'Que sigla MSI corresponde a P + V + C (presente simple)?', hint: 'Dos letras', expect: /\bPR\b/i, partial: /present|simple/i, kpi: 'k3' },
    { id: 'm2', dim: 'msi', ask: 'Despues de HAVE en la cadena, el verbo principal va en... (participio / -ing / infinitivo)', hint: 'Forma verbal', expect: /(participio|participle|past participle|tercera forma|third form|pp)/i, partial: /\b(ed|en|ing)\b/i, kpi: 'k3' }
  ];

  var PROBE_COUNT = PROBES.length;

  function ensure(s) {
    if (!s) return null;
    if (!s.jillCalibration) {
      s.jillCalibration = {
        version: VERSION,
        initialDone: false,
        probeIndex: 0,
        probeScores: {},
        dimensions: {},
        route: null,
        completedAt: null,
        lessonMemory: []
      };
    }
    if (!s.jillCalibration.probeScores) s.jillCalibration.probeScores = {};
    if (!s.jillCalibration.lessonMemory) s.jillCalibration.lessonMemory = [];
    return s.jillCalibration;
  }

  function needsCalibration(s) {
    var c = ensure(s);
    if (c.initialDone) return false;
    var greeted = s && s.aiProfile && s.aiProfile.firstGreetingDone && s.aiProfile.firstGreetingDone.jill;
    if (greeted && !c.completedAt && (c.probeIndex || 0) === 0) {
      c.initialDone = true;
      c.legacySkip = true;
      return false;
    }
    return true;
  }

  function isCalibrating(s) {
    var c = ensure(s);
    return !c.initialDone && (c.probeIndex || 0) < PROBE_COUNT;
  }

  function scoreAnswer(probe, text) {
    var t = String(text || '').trim();
    if (!t) return 0;
    if (probe.expect && probe.expect.test(t)) return 100;
    if (probe.partial && probe.partial.test(t)) return 58;
    if (/\b(no se|no entiendo|no idea|paso|skip)\b/i.test(t)) return 15;
    return 28;
  }

  function currentProbe(s) {
    var idx = ensure(s).probeIndex || 0;
    return idx >= PROBE_COUNT ? null : PROBES[idx];
  }

  function scoreLastTurn(s, userText) {
    var c = ensure(s);
    var idx = c.probeIndex || 0;
    if (idx >= PROBE_COUNT) return null;
    var probe = PROBES[idx];
    var score = scoreAnswer(probe, userText);
    c.probeScores[probe.id] = score;
    c.probeIndex = idx + 1;
    if (c.probeIndex >= PROBE_COUNT) finalize(s);
    return { probe: probe, score: score, done: c.initialDone };
  }

  function bandFromScore(avg) {
    if (avg >= 75) return 'maintain';
    if (avg >= 50) return 'test';
    return 'reinforce';
  }

  function finalize(s) {
    var c = ensure(s);
    var dims = {};
    PROBES.forEach(function (p) {
      var sc = c.probeScores[p.id];
      if (sc == null) sc = 0;
      if (!dims[p.dim]) dims[p.dim] = { scores: [], total: 0, count: 0 };
      dims[p.dim].scores.push(sc);
      dims[p.dim].total += sc;
      dims[p.dim].count += 1;
    });
    Object.keys(dims).forEach(function (dim) {
      var d = dims[dim];
      d.score = Math.round(d.total / Math.max(1, d.count));
      d.band = bandFromScore(d.score);
      d.label = DIM_LABELS[dim] || dim;
    });
    c.dimensions = dims;
    c.route = buildRoute(dims);
    c.initialDone = true;
    c.completedAt = new Date().toISOString();
    applyRoute(s);
    rememberLesson(s, 'calibration', 'Calibracion inicial - ' + (c.route.summary || ''));
    return c;
  }

  function buildRoute(dims) {
    var reinforce = [];
    var test = [];
    var maintain = [];
    var kpis = [];
    var bundles = [];
    Object.keys(dims).forEach(function (dim) {
      var d = dims[dim];
      if (d.band === 'reinforce') reinforce.push(d.label);
      else if (d.band === 'test') test.push(d.label);
      else maintain.push(d.label);
      if (d.band === 'reinforce' || d.band === 'test') {
        (DIM_KPIS[dim] || []).forEach(function (k) {
          if (kpis.indexOf(k) < 0) kpis.push(k);
        });
        var bh = BUNDLE_HINTS[dim];
        if (bh && bundles.indexOf(bh) < 0) bundles.push(bh);
      }
    });
    var summary = 'Reforzar: ' + (reinforce.length ? reinforce.join(', ') : '-')
      + ' | Probar: ' + (test.length ? test.join(', ') : '-')
      + ' | Mantener: ' + (maintain.length ? maintain.join(', ') : '-');
    return {
      reinforce: reinforce,
      test: test,
      maintain: maintain,
      weakKpis: kpis,
      bundleHints: bundles,
      summary: summary,
      createdAt: new Date().toISOString()
    };
  }

  function applyRoute(s) {
    if (!s) return;
    var c = ensure(s);
    if (!c.route) return;
    if (c.route.weakKpis && c.route.weakKpis.length) s.quizWeakKpis = c.route.weakKpis.slice();
    if (c.route.bundleHints && c.route.bundleHints.length && s.jillProgress) {
      var hint = c.route.bundleHints[0];
      if (!s.jillProgress.activeBundle && hint) s.jillProgress.activeBundle = hint;
    }
  }

  function rememberLesson(s, kind, note) {
    var c = ensure(s);
    c.lessonMemory.push({ at: new Date().toISOString(), kind: kind || 'session', note: String(note || '').slice(0, 400) });
    if (c.lessonMemory.length > 24) c.lessonMemory = c.lessonMemory.slice(-24);
  }

  function getApiContext(s) {
    var c = ensure(s);
    var probe = currentProbe(s);
    return {
      version: VERSION,
      active: isCalibrating(s),
      initialDone: !!c.initialDone,
      probeIndex: c.probeIndex || 0,
      probeTotal: PROBE_COUNT,
      currentProbe: probe ? {
        id: probe.id,
        dim: probe.dim,
        label: DIM_LABELS[probe.dim],
        ask: probe.ask,
        hint: probe.hint || ''
      } : null,
      dimensions: c.dimensions || {},
      route: c.route || null,
      lessonMemory: (c.lessonMemory || []).slice(-5)
    };
  }

  function renderPanel(s) {
    if (isCalibrating(s)) {
      var c = ensure(s);
      var probe = currentProbe(s);
      var dimLabel = probe ? (DIM_LABELS[probe.dim] || probe.dim) : '';
      return '<div style="background:rgba(14,116,144,0.18);border:1px solid rgba(27,155,209,0.45);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:11px;color:#e0f2fe;line-height:1.55;">'
        + '<strong>Calibracion</strong> ' + (c.probeIndex || 0) + '/' + PROBE_COUNT
        + (dimLabel ? ' &middot; midiendo <em>' + escapeHtml(dimLabel) + '</em>' : '')
        + '<div style="margin-top:4px;opacity:0.85;">Jill mide tu base antes del bundle, sin presion.</div></div>';
    }
    if (s && s.jillCalibration && s.jillCalibration.route) {
      return '<div style="background:rgba(14,116,144,0.12);border:1px solid rgba(27,155,209,0.35);border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:11px;color:#cffafe;line-height:1.5;">'
        + '<strong>Ruta Jill</strong> &middot; ' + escapeHtml(s.jillCalibration.route.summary || '') + '</div>';
    }
    return '';
  }

  function escapeHtml(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function instantOpening(student) {
    var name = (typeof AiProfile !== 'undefined') ? AiProfile.displayName(student) : 'estudiante';
    return 'Hola ' + name + ', soy Jill. Antes del bundle calibramos tu base, rapido y sin presion. '
      + 'Asi se que reforzar, que probar y que mantener. Primera prueba: ' + PROBES[0].ask;
  }

  global.JillCalibration = {
    PROBES: PROBES,
    needsCalibration: needsCalibration,
    isCalibrating: isCalibrating,
    currentProbe: currentProbe,
    scoreLastTurn: scoreLastTurn,
    finalize: finalize,
    applyRoute: applyRoute,
    rememberLesson: rememberLesson,
    getApiContext: getApiContext,
    renderPanel: renderPanel,
    instantOpening: instantOpening,
    ensure: ensure
  };
})(typeof window !== 'undefined' ? window : global);
