/**
 * Jill Foundations v2 — bundle progress, methodology UI, session evaluation.
 */
(function (global) {
  'use strict';

  var _bundles = [];
  var _sequence = [];
  var _loaded = null;
  var BUNDLE_ID_ALIASES = { 'F1-lego': 'F1-msi' };

  function resolveBundleId(id) {
    if (!id) return id;
    return BUNDLE_ID_ALIASES[id] || id;
  }

  function migrateProgressBundleIds(s) {
    if (!s || !s.jillProgress) return;
    if (s.jillProgress.activeBundle) s.jillProgress.activeBundle = resolveBundleId(s.jillProgress.activeBundle);
    s.jillProgress.completedBundles = (s.jillProgress.completedBundles || []).map(resolveBundleId);
  }

  var CTYPE_RE = /\[\[CTYPE:(text|exercise|example|whiteboard)\]\]\s*$/i;
  var CTYPE_LINE = /^\s*JILL_META:\s*\{[^}]*"contentType"\s*:\s*"(text|exercise|example|whiteboard)"/im;

  function loadBundles() {
    if (_loaded) return _loaded;
    _loaded = fetch('config/jill-bundles.json?v=20260707b')
      .then(function (r) { return r.ok ? r.json() : { bundles: [], sequence: [] }; })
      .then(function (data) {
        _bundles = data.bundles || [];
        _sequence = data.sequence || _bundles.map(function (b) { return b.id; });
        return data;
      })
      .catch(function () {
        _bundles = [];
        _sequence = [];
        return { bundles: [], sequence: [] };
      });
    return _loaded;
  }

  function sortedBundles() {
    return _bundles.slice().sort(function (a, b) {
      return (a.order != null ? a.order : 999) - (b.order != null ? b.order : 999);
    });
  }

  function bundleById(id) {
    return _bundles.find(function (b) { return b.id === resolveBundleId(id); }) || null;
  }

  function ensureProgress(s) {
    if (!s) return { activeBundle: null, completedBundles: [], sessionLog: [] };
    if (!s.jillProgress) s.jillProgress = { activeBundle: null, completedBundles: [], sessionLog: [] };
    migrateProgressBundleIds(s);
    if (!s.jillProgress.completedBundles) s.jillProgress.completedBundles = [];
    if (!s.jillProgress.sessionLog) s.jillProgress.sessionLog = [];
    return s.jillProgress;
  }

  function getActiveBundle(s) {
    ensureProgress(s);
    if (s.jillProgress.activeBundle) return bundleById(s.jillProgress.activeBundle);
    var done = s.jillProgress.completedBundles || [];
    var seq = _sequence.length ? _sequence : sortedBundles().map(function (b) { return b.id; });
    for (var i = 0; i < seq.length; i++) {
      if (done.indexOf(seq[i]) < 0) return bundleById(seq[i]);
    }
    return sortedBundles()[0] || null;
  }

  function autoAssignBundle(s) {
    var b = getActiveBundle(s);
    if (!b || !s) return null;
    ensureProgress(s);
    if (!s.jillProgress.activeBundle) s.jillProgress.activeBundle = b.id;
    return b;
  }

  function getContext(s) {
    ensureProgress(s);
    var bundle = getActiveBundle(s);
    var ctx = {
      jillBundle: bundle,
      weakKpis: (s && s.quizWeakKpis) || [],
      nemesisState: (s && s.nemesisState) || { domain: [], reinforcement: [] },
      track: s && s.track,
      reinforcement: (s && s.nemesisState && s.nemesisState.reinforcement) || []
    };
    if (typeof JillMatrix !== 'undefined' && bundle) {
      var mc = JillMatrix.getApiContext(s, bundle);
      if (mc) ctx.matrixContext = mc;
    }
    if (typeof JillVocab !== 'undefined') {
      ctx.vocabContext = JillVocab.getApiContext(s);
    }
    if (typeof JillCalibration !== 'undefined') {
      ctx.calibrationContext = JillCalibration.getApiContext(s);
      if (ctx.calibrationContext.route && ctx.calibrationContext.route.weakKpis && ctx.calibrationContext.route.weakKpis.length) {
        ctx.weakKpis = ctx.calibrationContext.route.weakKpis.slice();
      }
    }
    return ctx;
  }

  function parseReply(raw) {
    var text = String(raw || '').trim();
    var contentType = 'text';
    var m = text.match(CTYPE_RE);
    if (m) {
      contentType = m[1].toLowerCase();
      text = text.replace(CTYPE_RE, '').trim();
    } else {
      var ml = text.match(CTYPE_LINE);
      if (ml) {
        contentType = ml[1].toLowerCase();
        text = text.replace(CTYPE_LINE, '').replace(/\n?\s*JILL_META:\s*\{[\s\S]*$/i, '').trim();
      }
    }
    if (typeof TutorReply !== 'undefined') text = TutorReply.extract(text);
    text = text.replace(/▋/g, '').trim();
    if (!contentType || contentType === 'text') contentType = guessContentType(text);
    return { reply: text, contentType: contentType };
  }

  function guessContentType(text) {
    var t = String(text || '').toLowerCase();
    if (/\b(ejercicio|practic[aá]|complet[aá]|escrib[ií]|dec[ií] en ingl[eé]s|arm[aá] el chunk|tu turno)\b/.test(t)) return 'exercise';
    if (/\b(por ejemplo|ejemplo:|modelo:|as[ií]:|for example)\b/.test(t)) return 'example';
    if (/\|/.test(text) || /\b(infinity|mec[aá]nica estructural|regla \d|piezas?|estructura|whiteboard|pizarr[oó]n)\b/i.test(text)) return 'whiteboard';
    return 'text';
  }

  function bundleProgressPct(s) {
    ensureProgress(s);
    var total = _sequence.length || _bundles.length || 1;
    var done = (s.jillProgress.completedBundles || []).length;
    return Math.min(100, Math.round((done / total) * 100));
  }

  function renderBundleBar(s, bundle) {
    bundle = bundle || getActiveBundle(s);
    if (!bundle) {
      return '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-bottom:10px;">Foundations · Método Nexus</div>';
    }
    var pct = bundleProgressPct(s);
    var phase = bundle.phase ? '<span style="opacity:0.85;">' + bundle.phase + ' · </span>' : '';
    return '<div style="background:rgba(0,0,0,0.18);border:1px solid rgba(61,220,151,0.35);border-radius:12px;padding:10px 12px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'
      + '<div style="font-size:11px;font-weight:800;color:#bbf7d0;letter-spacing:0.06em;">BUNDLE ACTIVO</div>'
      + '<div style="font-size:10px;color:#86EFAC;font-weight:700;">' + pct + '% ruta</div>'
      + '</div>'
      + '<div style="font-size:13px;font-weight:800;color:white;margin-top:4px;">' + phase + esc(bundle.title) + '</div>'
      + '<div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3DDC97,#86EFAC);"></div>'
      + '</div>'
      + '</div>';
  }

  var CANON_BY_COLUMN = {
    present: { id: 'tiempos-pr', path: 'assets/canon/tiempos-pr.svg', title: 'Presente simple PR' },
    past: { id: 'tiempos-ps', path: 'assets/canon/tiempos-ps.svg', title: 'Pasado simple PS' },
    progressive: { id: 'gerundio-pc', path: 'assets/canon/anim/gerundio-pc.svg', title: 'Presente continuo PC' },
    perfect: { id: 'tiempos-prp', path: 'assets/canon/tiempos-prp.svg', title: 'Presente perfecto PRP' },
    combined: { id: 'tiempos', path: 'assets/canon/tiempos.svg', title: 'Tiempos / PPC' },
    future: { id: 'tiempos-fut', path: 'assets/canon/tiempos-fut.svg', title: 'Futuro will / going to' },
    modal: { id: 'moneda', path: 'assets/canon/moneda.svg', title: 'Metodo moneda (inversion)' },
    modales: { id: 'modales', path: 'assets/canon/modales.svg', title: 'Modales - P + MODAL + V base' },
    there: { id: 'there-existencial', path: 'assets/canon/there-existencial.svg', title: 'There is / There are' },
    prepositions: { id: 'preposiciones', path: 'assets/canon/preposiciones.svg', title: 'Preposiciones IN ON AT BY' },
    prepositions_time: { id: 'preposiciones-tiempo', path: 'assets/canon/preposiciones-tiempo.svg', title: 'Preposiciones de tiempo' },
    gerund_prep: { id: 'gerundio-prep', path: 'assets/canon/gerundio-prep.svg', title: 'Gerundio despues de preposicion' },
    negations: { id: 'negaciones', path: 'assets/canon/negaciones.svg', title: 'Negaciones - AUX + NOT' },
    comparatives: { id: 'comparativos', path: 'assets/canon/comparativos.svg', title: 'Comparativos' },
    articles: { id: 'articulos', path: 'assets/canon/articulos.svg', title: 'Articulos a/an/the' },
    have_had: { id: 'have-had', path: 'assets/canon/have-had.svg', title: 'Have / Has / Had + PP' }
  };

  function detectCanonColumn(text, bundle) {
    var t = String(text || '').toLowerCase();
    if (!t.trim()) {
      if (bundle && bundle.canonColumn && CANON_BY_COLUMN[bundle.canonColumn]) return bundle.canonColumn;
      return null;
    }

    // --- Mas especifico primero ---

    // Have / has / had como auxiliares de perfecto
    if (/\bhave\b/.test(t) && /\bhad\b/.test(t)) return 'have_had';
    if (/\bhave\s*\/\s*has\s*\/\s*had\b/.test(t) || /\bhave\s+has\s+had\b/.test(t)) return 'have_had';
    if (/\b(have\s+vs\s+had|has\s+vs\s+had|diferencia\s+entre\s+have\s+y\s+had)\b/.test(t)) return 'have_had';
    if (/\bhad\b/.test(t) && /\b(auxiliar|perfecto|perfect|participio|explic)\b/.test(t)
      && !/\b(pasado simple|past simple|yesterday)\b/.test(t)) {
      return 'have_had';
    }
    if (/\bhave\b/.test(t) && /\b(explic|ense[nñ]|auxiliar|perfecto|perfect)\b/.test(t)
      && !/\b(had|going to|will have)\b/.test(t)) {
      return 'perfect';
    }
    if (/\b(preposici[oó]n|before|after|without|instead of|good at|interested in|afraid of|antes de|despues de|después de|en vez de)\b/.test(t)
      && /\b(-ing|gerundio|leaving|going|working|coming|doing|saying)\b/.test(t)
      && !/\b(presente continuo|\bpc\b|to be\b|am\/is\/are)\b/.test(t)) {
      return 'gerund_prep';
    }

    // Negaciones
    if (/\b(negaci[oó]n(?:es)?|negations?|don'?t|doesn'?t|didn'?t|isn'?t|aren'?t|won'?t|haven'?t|aux\s*\+?\s*not|auxiliar\s*\+?\s*not)\b/.test(t)) {
      return 'negations';
    }

    // There is / are
    if (/\b(there is|there are|there was|there were|there will|is there|are there|existencial|there\s+be|\bhay\b)\b/.test(t)) {
      return 'there';
    }

    // Comparativos
    if (/\b(comparativ|superlativ|more than|less than|-er than|as .+ as|mejor que|peor que|m[aá]s .+ que|the most|the least)\b/.test(t)) {
      return 'comparatives';
    }

    // Articulos (no confundir con "the" suelto en ingles)
    if (/\b(art[ií]culo(?:s)?|articles?|a\/an|indefinido|definido|cuantificador(?:es)?|much\/many|a lot of)\b/.test(t)) {
      return 'articles';
    }

    // Preposiciones de TIEMPO (antes que lugar)
    if (/\b(preposici[oó]n(?:es)?\s+(?:de\s+)?tiempo|in on at.*(?:time|hora|d[ií]a)|at \d|in the morning|in the afternoon|on monday|on friday|in march|in 20\d{2}|preposiciones tiempo)\b/.test(t)) {
      return 'prepositions_time';
    }

    // Preposiciones lugar / IN ON AT BY (core image)
    if (/\b(preposici[oó]n(?:es)?|prep(?:ositions?)?\b|in\s*\/?\s*on\s*\/?\s*at(?:\s*\/?\s*by)?|in on at by|at in on|on at in|by car|by bus|in the box|on the table|at the office|at home|lugar)\b/.test(t)
      || /\b(in|on|at|by)\b/.test(t) && /\b(prep|ranura c|complemento|ciudad|mesa|oficina|carro|bus|transporte)\b/.test(t)) {
      return 'prepositions';
    }

    // Presente continuo / PC / gerundio con to be
    if (/\b(presente continuo|present continuous|\bpc\b|to be\s*\+?\s*v?\+?ing|am\/is\/are.*ing|est[aá]s?\s+\w+ando|p\s*\+\s*to be\s*\+\s*v|ahora mismo.*ing)\b/.test(t)) {
      return 'progressive';
    }
    if (/\b(gerundio|gerund|v\+ing|progressive)\b/.test(t) && /\b(to be|presente continuo|\bpc\b|progres|continuo|ahora)\b/.test(t)) {
      return 'progressive';
    }

    // Futuro perfecto / PPC
    if (/\b(futuro perfecto|future perfect|will have|pasado perfecto|past perfect|\bppc\b|perfecto continuo|have been \w+ing)\b/.test(t)) {
      return 'combined';
    }

    // Presente perfecto PRP (NO articulos)
    if (/\b(presente perfecto|present perfect|\bprp\b|have\/has|have been|has been|already|yet|ever|never.*been|participio)\b/.test(t)
      && !/\b(pasado simple|past simple|yesterday)\b/.test(t)) {
      return 'perfect';
    }

    // Pasado simple PS
    if (/\b(pasado simple|past simple|\bps\b|yesterday|last (week|night|year|monday)|el pasado|verbo en pasado|worked|went|did)\b/.test(t)
      && !/\b(perfecto|perfect|continuo|continuous)\b/.test(t)) {
      return 'past';
    }

    // Presente simple PR
    if (/\b(presente simple|present simple|\bpr\b|h[aá]bitos?|habits?|todos los d[ií]as|every day|he\/she\/it\s*\+?\s*-?s)\b/.test(t)
      && !/\b(perfecto|perfect|continuo|continuous|pasado|past)\b/.test(t)) {
      return 'present';
    }

    // Modales ≠ Moneda
    if (/\b(modales?|can\b|could\b|should\b|must\b|may\b|might\b)\b/.test(t)
      && !/\b(moneda|inversi[oó]n|m[eé]todo de la moneda)\b/.test(t)) {
      return 'modales';
    }

    // Metodo moneda / inversion
    if (/\b(moneda|inversi[oó]n|m[eé]todo de la moneda|are you\b|v\s*\+\s*p|pregunta\s*\/\s*respuesta)\b/.test(t)) {
      return 'modal';
    }

    // Futuro will / going to
    if (/\b(futuro|future|going to|will\b|would\b|ma[nñ]ana|tomorrow)\b/.test(t)
      && !/\b(modales?|can\b|could|should|must)\b/.test(t)) {
      return 'future';
    }

    // Overview tiempos
    if (/\b(tiempo(?:s)? verbal(?:es)?|tiempos|siglas\s+pr|matriz de tiempos)\b/.test(t)) {
      return 'combined';
    }

    if (/\b(p\s*\+\s*to be\s*\+\s*v\+?ing|p\s*\|\s*to be\s*\|\s*v)\b/.test(t)) return 'progressive';

    if (bundle && bundle.canonColumn && CANON_BY_COLUMN[bundle.canonColumn]) return bundle.canonColumn;
    return null;
  }

  function renderCanonForMessage(text, bundle) {
    if (typeof JillVisualStage !== 'undefined' && JillVisualStage.isActive()) return '';
    if (typeof JillCanonVisual === 'undefined') return '';
    var col = detectCanonColumn(text, bundle);
    if (!col) return '';
    return JillCanonVisual.render(col, CANON_BY_COLUMN[col]);
  }

  function formatWhiteboardLines(text, bundle) {
    var lines = String(text || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2 && bundle && bundle.whiteboard && bundle.whiteboard.length) {
      lines = bundle.whiteboard.slice(0, 4);
    }
    var body = lines.map(function (line) {
      return '<div style="font-family:ui-monospace,monospace;font-size:13px;padding:6px 0;border-bottom:1px solid #e2e8f0;">' + esc(line) + '</div>';
    }).join('');
    var canon = renderCanonForMessage(text, bundle);
    return body + canon;
  }

  function formatBody(text, contentType, bundle) {
    var body = esc(text).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (contentType === 'whiteboard') {
      body = formatWhiteboardLines(text, bundle) || body;
    }
    return body;
  }

  function formatMessageHtml(m, bundle) {
    if (!m || !m.content) return '';
    var isJill = m.role === 'assistant';
    if (!isJill) {
      return '<div style="display:flex;flex-direction:column;align-items:flex-end;">'
        + '<div style="max-width:88%;background:rgba(61,220,151,0.18);border:1px solid rgba(61,220,151,0.35);color:#ecfdf5;border-radius:12px 4px 12px 12px;padding:10px 14px;font-size:14px;line-height:1.7;">'
        + esc(m.content) + '</div></div>';
    }
    var ct = m.contentType || 'text';
    var bubbleStyle = 'background:rgba(255,255,255,0.96);border:1px solid rgba(61,220,151,0.25);color:#111827;';
    if (ct === 'whiteboard') bubbleStyle = 'background:#f8fafc;border:1px solid #cbd5e1;color:#0f172a;';
    return '<div style="display:flex;flex-direction:column;align-items:flex-start;">'
      + '<div style="max-width:92%;' + bubbleStyle + 'border-radius:14px;padding:12px 14px;font-size:14px;line-height:1.7;">'
      + formatBody(m.content, ct, bundle)
      + '</div></div>';
  }

  function renderEvaluationSummary(ev, bundle) {
    if (!ev) return '';
    var score = ev.overall_score != null ? ev.overall_score : '—';
    var col = score >= 75 ? '#86EFAC' : (score >= 55 ? '#FCD34D' : '#FCA5A5');
  return '<div style="background:rgba(0,0,0,0.22);border:1px solid rgba(61,220,151,0.4);border-radius:14px;padding:14px;margin-top:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
      + '<div style="font-size:12px;font-weight:800;color:#bbf7d0;">RESUMEN DE SESIÓN</div>'
      + '<div style="font-size:22px;font-weight:900;color:' + col + ';">' + score + '<span style="font-size:11px;opacity:0.6;">/100</span></div>'
      + '</div>'
      + (bundle ? '<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:8px;">Bundle: <strong>' + esc(bundle.title) + '</strong></div>' : '')
      + (ev.best_moment ? '<div style="font-size:12px;margin-bottom:6px;"><span style="color:#86EFAC;font-weight:700;">✓ </span>' + esc(ev.best_moment) + '</div>' : '')
      + (ev.main_improvement ? '<div style="font-size:12px;margin-bottom:8px;"><span style="color:#FCD34D;font-weight:700;">→ </span>' + esc(ev.main_improvement) + '</div>' : '')
      + (ev.jill_message ? '<div style="font-size:13px;line-height:1.6;padding:10px;background:rgba(255,255,255,0.08);border-radius:10px;color:#ecfdf5;">' + esc(ev.jill_message).replace(/\n/g, '<br>') + '</div>' : '')
      + (ev.bundle_ready && !ev.bundle_blocked ? '<div style="margin-top:10px;font-size:11px;color:#86EFAC;font-weight:700;">Listo para avanzar al siguiente bundle — pedile a tu trainer que confirme.</div>' : '')
      + (ev.bundle_blocked ? '<div style="margin-top:10px;font-size:11px;color:#FCD34D;font-weight:700;line-height:1.5;">⏳ Avance bloqueado: ' + esc(ev.bundle_block_reason || 'completá el gate F0') + '</div>' : '')
      + (ev.graduation_request ? '<div style="margin-top:12px;padding:12px;background:rgba(245,166,35,0.12);border:1px solid rgba(245,166,35,0.35);border-radius:10px;">'
        + '<div style="font-size:12px;font-weight:800;color:#FCD34D;margin-bottom:6px;">🎓 Jill solicita graduación a Alice</div>'
        + (ev.graduation_reason ? '<div style="font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:10px;line-height:1.5;">' + esc(ev.graduation_reason) + '</div>' : '')
        + '<button type="button" onclick="jillConfirmGraduation()" style="background:linear-gradient(135deg,#0a5c3c,#0e7a50);border:none;color:white;font-weight:800;font-size:13px;padding:10px 20px;border-radius:10px;cursor:pointer;">Confirmar graduación</button>'
        + '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:8px;">Solo si sentís que podés conversar como Jill evaluó.</div></div>' : '')
      + '</div>';
  }

  function canAdvanceBundle(s, bundleId) {
    bundleId = bundleId || (s && s.jillProgress && s.jillProgress.activeBundle);
    if (typeof JillF0Gate !== 'undefined') {
      return JillF0Gate.canAdvanceFromBundle(s, bundleId);
    }
    return { ok: true, reason: null, checklist: null };
  }

  function tryAdvanceBundle(s, bundleId) {
    ensureProgress(s);
    bundleId = bundleId || s.jillProgress.activeBundle;
    if (!bundleId) return { ok: false, reason: 'Sin bundle activo' };
    var gate = canAdvanceBundle(s, bundleId);
    if (!gate.ok) return gate;
    if (s.jillProgress.completedBundles.indexOf(bundleId) < 0) {
      s.jillProgress.completedBundles.push(bundleId);
    }
    var meta = bundleById(bundleId);
    var next = meta && meta.nextBundle;
    s.jillProgress.activeBundle = next || null;
    return { ok: true, nextBundle: next, completed: bundleId };
  }

  function recordSession(s, ev, bundle) {
    if (!s || !s.id) return;
    ensureProgress(s);
    s.jillProgress.sessionLog.push({
      date: new Date().toISOString(),
      bundleId: bundle && bundle.id,
      score: ev && ev.overall_score,
      turns: ev && ev.student_turns
    });
    if (s.jillProgress.sessionLog.length > 40) s.jillProgress.sessionLog = s.jillProgress.sessionLog.slice(-40);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  global.JillFoundations = {
    loadBundles: loadBundles,
    getActiveBundle: getActiveBundle,
    autoAssignBundle: autoAssignBundle,
    getContext: getContext,
    parseReply: parseReply,
    renderBundleBar: renderBundleBar,
    formatMessageHtml: formatMessageHtml,
    renderEvaluationSummary: renderEvaluationSummary,
    recordSession: recordSession,
    ensureProgress: ensureProgress,
    bundleById: bundleById,
    canAdvanceBundle: canAdvanceBundle,
    tryAdvanceBundle: tryAdvanceBundle,
    detectCanonColumn: detectCanonColumn,
    CANON_BY_COLUMN: CANON_BY_COLUMN
  };
})(typeof window !== 'undefined' ? window : this);
