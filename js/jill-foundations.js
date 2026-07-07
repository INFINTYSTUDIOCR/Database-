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
    var wb = (bundle.whiteboard || []).slice(0, 3);
    var wbHtml = wb.length
      ? '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">'
        + wb.map(function (line) {
          return '<code style="font-size:10px;background:rgba(0,0,0,0.2);padding:4px 8px;border-radius:6px;color:#bbf7d0;">' + esc(line) + '</code>';
        }).join('')
        + '</div>'
      : '';
    return '<div style="background:rgba(0,0,0,0.18);border:1px solid rgba(61,220,151,0.35);border-radius:12px;padding:10px 12px;margin-bottom:12px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'
      + '<div style="font-size:11px;font-weight:800;color:#bbf7d0;letter-spacing:0.06em;">BUNDLE ACTIVO</div>'
      + '<div style="font-size:10px;color:#86EFAC;font-weight:700;">' + pct + '% ruta</div>'
      + '</div>'
      + '<div style="font-size:13px;font-weight:800;color:white;margin-top:4px;">' + phase + esc(bundle.title) + '</div>'
      + (bundle.doctrine ? '<div style="font-size:11px;color:rgba(255,255,255,0.78);margin-top:6px;line-height:1.5;">' + esc(bundle.doctrine) + '</div>' : '')
      + wbHtml
      + '<div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">'
      + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3DDC97,#86EFAC);"></div>'
      + '</div>'
      + '</div>';
  }

  function ctypeLabel(ct) {
    if (ct === 'exercise') return { icon: 'ti-dumbbell', label: 'EJERCICIO', color: '#0a5c3c', bg: 'rgba(61,220,151,0.15)' };
    if (ct === 'example') return { icon: 'ti-bulb', label: 'EJEMPLO', color: '#92400e', bg: 'rgba(251,191,36,0.2)' };
    if (ct === 'whiteboard') return { icon: 'ti-layout-board', label: 'PIZARRÓN NEXUS', color: '#1e40af', bg: 'rgba(96,165,250,0.15)' };
    return null;
  }

  function formatWhiteboardLines(text, bundle) {
    var lines = String(text || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2 && bundle && bundle.whiteboard && bundle.whiteboard.length) {
      lines = bundle.whiteboard.slice(0, 4);
    }
    return lines.map(function (line) {
      return '<div style="font-family:ui-monospace,monospace;font-size:12px;padding:6px 10px;background:rgba(30,64,175,0.12);border-left:3px solid #60a5fa;margin-bottom:4px;border-radius:0 6px 6px 0;">' + esc(line) + '</div>';
    }).join('');
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
        + '<div style="font-size:10px;color:rgba(255,255,255,0.45);font-weight:600;margin-bottom:4px;">VOS</div>'
        + '<div style="max-width:88%;background:rgba(61,220,151,0.18);border:1px solid rgba(61,220,151,0.35);color:#ecfdf5;border-radius:12px 4px 12px 12px;padding:10px 14px;font-size:14px;line-height:1.7;">'
        + esc(m.content) + '</div></div>';
    }
    var ct = m.contentType || 'text';
    var badge = ctypeLabel(ct);
    var bubbleStyle = 'background:rgba(255,255,255,0.96);border:1px solid rgba(61,220,151,0.35);border-left:4px solid #3DDC97;color:#111827;';
    if (ct === 'whiteboard') bubbleStyle = 'background:#f0f9ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;color:#0f172a;';
    if (ct === 'exercise') bubbleStyle = 'background:#ecfdf5;border:1px solid #6ee7b7;border-left:4px solid #059669;color:#064e3b;';
    if (ct === 'example') bubbleStyle = 'background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #d97706;color:#78350f;';
    return '<div style="display:flex;flex-direction:column;align-items:flex-start;">'
      + '<div style="font-size:10px;color:#86EFAC;font-weight:800;margin-bottom:4px;letter-spacing:0.1em;">JILL</div>'
      + '<div style="max-width:92%;' + bubbleStyle + 'border-radius:4px 14px 14px 14px;padding:10px 14px;font-size:14px;line-height:1.7;">'
      + (badge ? '<div style="font-size:10px;font-weight:800;color:' + badge.color + ';letter-spacing:0.08em;margin-bottom:8px;display:flex;align-items:center;gap:4px;"><i class="ti ' + badge.icon + '"></i> ' + badge.label + '</div>' : '')
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
      + (ev.bundle_ready ? '<div style="margin-top:10px;font-size:11px;color:#86EFAC;font-weight:700;">🎓 Listo para avanzar al siguiente bundle — pedile a tu trainer que confirme.</div>' : '')
      + '</div>';
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
    bundleById: bundleById
  };
})(typeof window !== 'undefined' ? window : this);
