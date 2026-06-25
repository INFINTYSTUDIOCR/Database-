/**
 * Manual KPI Calibration — modal wizard (macro 5 + micro 26, scale 1–10)
 * Weekly Pulse · counts as full pulse · feeds kpiFile + kpiTracker + AI
 */
(function (global) {
  'use strict';

  var MACRO_KEYS = ['IG', 'ST', 'RA', 'PS', 'R'];

  var MACRO_QUESTIONS = {
    IG: [
      { id: 'IG-q1', text: '¿Genera ideas sin quedarse en blanco más de 5 segundos?' },
      { id: 'IG-q2', text: '¿Desarrolla la idea más allá de una sola oración?' }
    ],
    ST: [
      { id: 'ST-q1', text: '¿Usa estructura clara (apertura → desarrollo → cierre o STAR)?' },
      { id: 'ST-q2', text: '¿Conecta ideas con linkers del método (however, therefore, on top of that)?' }
    ],
    RA: [
      { id: 'RA-q1', text: '¿Se recupera solo tras un error (let me rephrase / what I mean is)?' },
      { id: 'RA-q2', text: '¿Sigue hablando en vez de congelarse?' }
    ],
    PS: [
      { id: 'PS-q1', text: '¿Propone solución cuando hay un problema simulado?' },
      { id: 'PS-q2', text: '¿Comunica el razonamiento, no solo la respuesta?' }
    ],
    R: [
      { id: 'R-q1', text: '¿Responde dentro del tiempo natural de conversación?' },
      { id: 'R-q2', text: '¿Mantiene el turno sin monólogos ni silencios largos?' }
    ]
  };

  var state = {
    sid: null,
    step: 1,
    context: { type: 'session', evidence: {}, note: '' },
    questionnaire: {},
    macro: {},
    micro: {},
    observations: {},
    chart: null
  };

  function kpiNames() {
    return global.KPI_NAMES || { IG: 'Idea Generation', ST: 'Structural Thinking', RA: 'Recovery Ability', PS: 'Problem Solving', R: 'Responsiveness' };
  }

  function areas() {
    return global.KPI_TRACKER_AREAS || [];
  }

  function weekId() {
    if (global.NexusUnified && NexusUnified.weekIdFromDate) return NexusUnified.weekIdFromDate();
    var d = new Date();
    var jan1 = new Date(d.getFullYear(), 0, 1);
    var w = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return d.getFullYear() + '-W' + String(w).padStart(2, '0');
  }

  function clamp10(n) {
    return Math.max(1, Math.min(10, Math.round(Number(n) || 5)));
  }

  function scaleLabel(v) {
    if (v <= 3) return 'Critical';
    if (v <= 6) return 'Developing';
    if (v <= 8) return 'Functional';
    return 'Strong';
  }

  function microQuestion(k) {
    var ev = (k.evaluates || []).slice(0, 4).join(', ');
    return '¿Demostró ' + k.name + ' en sesión' + (ev ? ' (' + ev + ')' : '') + '?';
  }

  function allMicroMeta() {
    var list = [];
    areas().forEach(function (area) {
      area.kpis.forEach(function (k) {
        list.push({ id: k.id, name: k.name, areaId: area.id, areaName: area.name, note: k.note || '' });
      });
    });
    return list;
  }

  function prefillFromStudent(s) {
    var names = kpiNames();
    var macro = {};
    var kpis = (s.kpis && s.kpis.phase1) || {};
    var scale10 = global.isScale10Student ? global.isScale10Student(s) : false;
    MACRO_KEYS.forEach(function (k) {
      var v = parseInt(kpis[k], 10) || 5;
      macro[k] = scale10 ? clamp10(v) : clamp10(v * 2);
    });
    var micro = {};
    var last = (s.kpiTracker || []).slice(-1)[0];
    var lastScores = (last && last.scores) || {};
    allMicroMeta().forEach(function (m) {
      if (lastScores[m.id] !== undefined) {
        var lv = lastScores[m.id];
        micro[m.id] = (last && last.scale === 10) ? clamp10(lv) : clamp10(lv <= 5 ? lv * 2 : lv);
      } else {
        micro[m.id] = 5;
      }
    });
    return { macro: macro, micro: micro };
  }

  function avgMacroFromQuestions(key) {
    var qs = MACRO_QUESTIONS[key] || [];
    var sum = 0;
    var n = 0;
    qs.forEach(function (q) {
      if (state.questionnaire[q.id] !== undefined) {
        sum += state.questionnaire[q.id];
        n++;
      }
    });
    return n ? clamp10(sum / n) : (state.macro[key] || 5);
  }

  function syncScoresFromQuestionnaire() {
    MACRO_KEYS.forEach(function (k) {
      state.macro[k] = avgMacroFromQuestions(k);
    });
    allMicroMeta().forEach(function (m) {
      var qk = 'micro-' + m.id;
      if (state.questionnaire[qk] !== undefined) state.micro[m.id] = clamp10(state.questionnaire[qk]);
    });
  }

  function ensureModal() {
    if (document.getElementById('modal-manual-cal')) return;
    var el = document.createElement('div');
    el.className = 'modal-bg';
    el.id = 'modal-manual-cal';
    el.innerHTML = '<div class="card" style="max-width:920px;width:100%;max-height:92vh;display:flex;flex-direction:column;margin:auto;">'
      + '<div id="mcal-head" style="padding:1rem 1.25rem 0;flex-shrink:0;"></div>'
      + '<div id="mcal-body" style="overflow-y:auto;flex:1;padding:0 1.25rem;"></div>'
      + '<div id="mcal-foot" class="modal-footer" style="flex-shrink:0;"></div>'
      + '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el && typeof global.closeModal === 'function') closeModal('modal-manual-cal');
    });
  }

  function open(sid) {
    var s = global.DB && global.DB[sid];
    if (!s) {
      if (typeof global.showToast === 'function') showToast('Estudiante no encontrado', 'err');
      return;
    }
    ensureModal();
    var pre = prefillFromStudent(s);
    state = {
      sid: sid,
      step: 1,
      context: { type: 'session', evidence: { session: true }, note: '', weekId: weekId() },
      questionnaire: {},
      macro: pre.macro,
      micro: pre.micro,
      observations: {},
      chart: null
    };
    render();
    if (typeof global.showModal === 'function') showModal('modal-manual-cal');
  }

  function setStep(n) {
    if (n === 3) syncScoresFromQuestionnaire();
    state.step = n;
    render();
  }

  function stepPills() {
    var labels = ['1 Contexto', '2 Cuestionario', '3 Sliders', '4 Resumen'];
    return labels.map(function (lb, i) {
      var n = i + 1;
      var on = state.step === n;
      return '<button type="button" class="btn btn-sm ' + (on ? 'btn-navy' : 'btn-outline') + '" onclick="NexusManualCal.setStep(' + n + ')">' + lb + '</button>';
    }).join('');
  }

  function renderContext() {
    var ev = state.context.evidence || {};
    return '<div class="ib ib-navy">Calibración manual trainer · escala <strong>1–10</strong> · macro + 26 micro · cuenta como Weekly Pulse.</div>'
      + '<div class="form-row" style="margin-top:10px;">'
      + '<div class="form-group"><label class="form-label">Tipo</label>'
      + '<select class="inp" id="mcal-type" onchange="NexusManualCal.patchContext()">'
      + '<option value="session"' + (state.context.type === 'session' ? ' selected' : '') + '>Sesión presencial/virtual</option>'
      + '<option value="evidence"' + (state.context.type === 'evidence' ? ' selected' : '') + '>Solo evidencia (quiz, grabación)</option>'
      + '<option value="mixed"' + (state.context.type === 'mixed' ? ' selected' : '') + '>Mixto</option>'
      + '</select></div>'
      + '<div class="form-group"><label class="form-label">Semana</label><input class="inp" id="mcal-week" value="' + (state.context.weekId || weekId()) + '"></div>'
      + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;font-size:12px;">'
      + ['session', 'jillAlice', 'quiz', 'nemesis', 'nexora', 'typing'].map(function (k, i) {
        var labels = { session: 'Sesión trainer', jillAlice: 'Jill/Alice', quiz: 'Quiz', nemesis: 'Nemesis', nexora: 'Nexora', typing: 'Typing' };
        var checked = ev[k] ? ' checked' : '';
        return '<label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" id="mcal-ev-' + k + '"' + checked + ' onchange="NexusManualCal.patchContext()"> ' + labels[k] + '</label>';
      }).join('')
      + '</div>'
      + '<textarea class="inp" id="mcal-note" placeholder="¿Qué observaste hoy? (1–3 líneas)" style="min-height:60px;" onchange="NexusManualCal.patchContext()">' + (state.context.note || '') + '</textarea>';
  }

  function renderQuestionnaire() {
    var names = kpiNames();
    var html = '<div class="ib ib-amber">Respondé con evidencia observada — escala 1–10 por pregunta.</div>';
    html += '<div class="card" style="margin-top:10px;"><div class="card-title">Macro KPIs (5 dimensiones)</div>';
    MACRO_KEYS.forEach(function (k) {
      html += '<div style="font-weight:700;font-size:12px;color:var(--navy);margin:12px 0 6px;">' + k + ' — ' + names[k] + '</div>';
      (MACRO_QUESTIONS[k] || []).forEach(function (q) {
        var val = state.questionnaire[q.id] !== undefined ? state.questionnaire[q.id] : (state.macro[k] || 5);
        html += qRow(q.id, q.text, val, 'NexusManualCal.setQ');
      });
    });
    html += '</div><div class="card"><div class="card-title">Micro KPIs (26 operacionales)</div>';
    areas().forEach(function (area) {
      html += '<div style="font-weight:700;font-size:11px;color:var(--t3);margin:14px 0 6px;letter-spacing:0.06em;">' + area.id + ' — ' + area.name + '</div>';
      area.kpis.forEach(function (k) {
        var qid = 'micro-' + k.id;
        var val = state.questionnaire[qid] !== undefined ? state.questionnaire[qid] : (state.micro[k.id] || 5);
        html += qRow(qid, microQuestion(k), val, 'NexusManualCal.setQ');
      });
    });
    html += '</div>';
    return html + liveChartsHtml();
  }

  function qRow(id, text, val, handler) {
    return '<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">'
      + '<div style="font-size:12px;line-height:1.5;margin-bottom:6px;">' + text + '</div>'
      + '<div style="display:flex;align-items:center;gap:10px;">'
      + '<input type="range" min="1" max="10" value="' + val + '" id="mcal-q-' + id + '" style="flex:1;" oninput="' + handler + '(\'' + id + '\',this.value)">'
      + '<span id="mcal-qv-' + id + '" style="min-width:72px;font-size:12px;font-weight:700;color:var(--nm);">' + val + '/10 · ' + scaleLabel(val) + '</span>'
      + '</div></div>';
  }

  function renderSliders() {
    var names = kpiNames();
    var html = '<div class="ib ib-navy">Revisá y ajustá. Los valores vienen del cuestionario — podés override manual.</div>';
    html += '<div class="card" style="margin-top:10px;"><div class="card-title">Macro (1–10)</div>';
    MACRO_KEYS.forEach(function (k) {
      html += sliderRow('macro-' + k, names[k] + ' (' + k + ')', state.macro[k] || 5, 'NexusManualCal.setMacro');
    });
    html += '</div>';
    areas().forEach(function (area) {
      html += '<div class="card"><div class="card-title">' + area.id + ' — ' + area.name + '</div>';
      area.kpis.forEach(function (k) {
        html += sliderRow(k.id, k.name, state.micro[k.id] || 5, 'NexusManualCal.setMicro');
        html += '<textarea class="inp" id="mcal-obs-' + k.id + '" placeholder="Observación ' + k.id + ' (opcional)" style="min-height:36px;margin:-4px 0 10px;font-size:11px;" onchange="NexusManualCal.setObs(\'' + k.id + '\',this.value)">' + (state.observations[k.id] || '') + '</textarea>';
      });
      html += '</div>';
    });
    return html + liveChartsHtml();
  }

  function sliderRow(id, label, val, handler) {
    var fn = handler === 'NexusManualCal.setMacro' ? 'setMacro' : 'setMicro';
    var key = handler === 'NexusManualCal.setMacro' ? id.replace('macro-', '') : id;
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
      + '<span style="font-size:12px;font-weight:600;width:42%;">' + label + '</span>'
      + '<input type="range" min="1" max="10" value="' + val + '" style="flex:1;" oninput="NexusManualCal.' + fn + '(\'' + key + '\',this.value)">'
      + '<span id="mcal-sv-' + id + '" style="min-width:56px;font-size:12px;font-weight:700;color:var(--nm);">' + val + '/10</span></div>';
  }

  function buildAreaAverages(microScores) {
    return areas().map(function (area) {
      var sum = 0;
      var n = 0;
      area.kpis.forEach(function (k) {
        if (microScores[k.id] !== undefined) {
          sum += microScores[k.id];
          n++;
        }
      });
      return { id: area.id, name: area.name, pct: n ? Math.round((sum / (n * 10)) * 100) : 0 };
    });
  }

  function microAreaAverages() {
    return areas().map(function (area) {
      var sum = 0;
      var n = 0;
      area.kpis.forEach(function (k) {
        if (state.micro[k.id] !== undefined) {
          sum += state.micro[k.id];
          n++;
        }
      });
      return { id: area.id, name: area.name, pct: n ? Math.round((sum / (n * 10)) * 100) : 0 };
    });
  }

  function refreshMcalCharts() {
    if (typeof global.LiveKpiCharts === 'undefined') return;
    global.LiveKpiCharts.updateMacro('mcal', 'mcal-live-radar', 'mcal-live-bar', state.macro, 10);
    global.LiveKpiCharts.updateAreas('mcal-micro', 'mcal-live-area-radar', 'mcal-live-area-bar', microAreaAverages());
  }

  function liveChartsHtml() {
    return '<div class="card" style="margin-top:10px;"><div class="card-title"><i class="ti ti-chart-radar"></i>Perfil KPI — radar y barras</div>'
      + '<div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:4px;">Macro (5 KPIs)</div>'
      + '<div class="grid2" style="gap:8px;margin-bottom:12px;"><div class="chart-wrap" style="height:160px;"><canvas id="mcal-live-radar"></canvas></div>'
      + '<div class="chart-wrap" style="height:160px;"><canvas id="mcal-live-bar"></canvas></div></div>'
      + '<div style="font-size:11px;font-weight:700;color:var(--t3);margin-bottom:4px;">Micro por área (26 KPIs)</div>'
      + '<div class="grid2" style="gap:8px;"><div class="chart-wrap" style="height:160px;"><canvas id="mcal-live-area-radar"></canvas></div>'
      + '<div class="chart-wrap" style="height:160px;"><canvas id="mcal-live-area-bar"></canvas></div></div></div>';
  }

  function macroTotal() {
    var t = 0;
    MACRO_KEYS.forEach(function (k) { t += state.macro[k] || 0; });
    return t;
  }

  function microOverall(microScores) {
    var sum = 0;
    var n = 0;
    allMicroMeta().forEach(function (m) {
      if (microScores[m.id] !== undefined) {
        sum += microScores[m.id];
        n++;
      }
    });
    return n ? Math.round((sum / (n * 10)) * 100) : 0;
  }

  function historyHtml(s) {
    var cals = (s.calibrations || []).filter(function (c) {
      return c.source === 'manual-calibration-v1' || c.scale === 10;
    }).slice(-3).reverse();
    if (!cals.length) return '<div class="ib ib-amber">Primera calibración manual 1–10.</div>';
    return cals.map(function (c) {
      return '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--border);">'
        + fmtDate(c.date) + ' · macro <strong>' + (c.score || '—') + '/50</strong> · micro ' + (c.microOverall || '—') + '/100'
        + (c.trainer ? ' · ' + c.trainer : '') + '</div>';
    }).join('');
  }

  function fmtDate(d) {
    if (typeof global.fmtDate === 'function') return global.fmtDate(d);
    return d ? new Date(d).toLocaleDateString('es-CR') : '—';
  }

  function renderSummary() {
    var s = global.DB[state.sid];
    syncScoresFromQuestionnaire();
    var total = macroTotal();
    var level = global.getLevelForStudent ? global.getLevelForStudent(total, s) : (total >= 42 ? 'Advanced' : total >= 32 ? 'Functional' : total >= 22 ? 'Emerging' : 'Survival');
    var microPct = microOverall(state.micro);
    var weakMacro = MACRO_KEYS.filter(function (k) { return (state.macro[k] || 0) <= 4; });
    var weakMicro = allMicroMeta().filter(function (m) { return (state.micro[m.id] || 0) <= 4; }).slice(0, 5);

    return '<div class="grid2" style="gap:12px;">'
      + '<div class="card"><div class="card-title">Macro · ' + total + '/50</div>'
      + '<div style="font-size:22px;font-weight:800;color:var(--navy);">' + (typeof global.getLevelBadge === 'function' ? getLevelBadge(level) : level) + '</div>'
      + '</div>'
      + '<div class="card"><div class="card-title">Micro · ' + microPct + '/100</div>'
      + '<div style="font-size:12px;line-height:1.7;">'
      + (weakMacro.length ? '<div><strong>Macro débil:</strong> ' + weakMacro.join(', ') + '</div>' : '')
      + (weakMicro.length ? '<div style="margin-top:6px;"><strong>Prioridad micro:</strong> ' + weakMicro.map(function (w) { return w.id + ' ' + w.name; }).join(' · ') + '</div>' : '')
      + '</div>'
      + '<div class="card-title" style="margin-top:12px;">Historial manual</div>' + historyHtml(s)
      + '</div></div>'
      + liveChartsHtml()
      + '<div class="ib ib-green" style="margin-top:10px;">Al guardar: Weekly Pulse completo · kpiFile IA · kpiTracker · Training Book rotado (top 5 débiles).</div>';
  }

  function render() {
    var head = document.getElementById('mcal-head');
    var body = document.getElementById('mcal-body');
    var foot = document.getElementById('mcal-foot');
    if (!head || !body || !foot) return;
    var s = global.DB[state.sid];
    var name = (s && s.info && s.info.name) || state.sid;
    head.innerHTML = '<div class="modal-title"><i class="ti ti-adjustments"></i> Calibración manual — ' + name + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">' + stepPills() + '</div>';
    if (state.step === 1) body.innerHTML = renderContext();
    else if (state.step === 2) body.innerHTML = renderQuestionnaire();
    else if (state.step === 3) body.innerHTML = renderSliders();
    else body.innerHTML = renderSummary();

    foot.innerHTML = (state.step > 1 ? '<button type="button" class="btn btn-outline" onclick="NexusManualCal.setStep(' + (state.step - 1) + ')">Atrás</button>' : '<button type="button" class="btn btn-outline" onclick="closeModal(\'modal-manual-cal\')">Cancelar</button>')
      + (state.step < 4 ? '<button type="button" class="btn btn-navy" onclick="NexusManualCal.setStep(' + (state.step + 1) + ')">Siguiente</button>' : '')
      + (state.step === 4 ? '<button type="button" class="btn btn-outline" onclick="NexusManualCal.exportPdf()"><i class="ti ti-file-type-pdf"></i> PDF</button>'
        + '<button type="button" class="btn btn-navy" onclick="NexusManualCal.save()"><i class="ti ti-device-floppy"></i> Guardar calibración</button>' : '');

    if (state.step >= 2) {
      setTimeout(function () {
        if (typeof global.LiveKpiCharts !== 'undefined') global.LiveKpiCharts.destroyPrefix('mcal');
        refreshMcalCharts();
      }, 80);
    }
  }

  function patchContext() {
    var t = document.getElementById('mcal-type');
    var w = document.getElementById('mcal-week');
    var n = document.getElementById('mcal-note');
    state.context.type = t ? t.value : 'session';
    state.context.weekId = w ? w.value.trim() : weekId();
    state.context.note = n ? n.value.trim() : '';
    state.context.evidence = {
      session: !!(document.getElementById('mcal-ev-session') && document.getElementById('mcal-ev-session').checked),
      jillAlice: !!(document.getElementById('mcal-ev-jillAlice') && document.getElementById('mcal-ev-jillAlice').checked),
      quiz: !!(document.getElementById('mcal-ev-quiz') && document.getElementById('mcal-ev-quiz').checked),
      nemesis: !!(document.getElementById('mcal-ev-nemesis') && document.getElementById('mcal-ev-nemesis').checked),
      nexora: !!(document.getElementById('mcal-ev-nexora') && document.getElementById('mcal-ev-nexora').checked),
      typing: !!(document.getElementById('mcal-ev-typing') && document.getElementById('mcal-ev-typing').checked)
    };
  }

  function setQ(id, val) {
    state.questionnaire[id] = clamp10(val);
    var el = document.getElementById('mcal-qv-' + id);
    if (el) el.textContent = state.questionnaire[id] + '/10 · ' + scaleLabel(state.questionnaire[id]);
    if (state.step === 2) {
      syncScoresFromQuestionnaire();
      refreshMcalCharts();
    }
  }

  function setMacro(k, val) {
    if (k.indexOf('macro-') === 0) k = k.slice(6);
    state.macro[k] = clamp10(val);
    var el = document.getElementById('mcal-sv-macro-' + k);
    if (el) el.textContent = state.macro[k] + '/10';
    refreshMcalCharts();
  }

  function setMicro(k, val) {
    state.micro[k] = clamp10(val);
    var el = document.getElementById('mcal-sv-' + k);
    if (el) el.textContent = state.micro[k] + '/10';
    refreshMcalCharts();
  }

  function setObs(k, val) {
    state.observations[k] = String(val || '').trim();
  }

  function weakestMicro(n) {
    return allMicroMeta().map(function (m) {
      return { id: m.id, name: m.name, score: state.micro[m.id] || 0, obs: state.observations[m.id] || '' };
    }).sort(function (a, b) { return a.score - b.score; }).slice(0, n || 5);
  }

  function buildKpiFile(s, macro, micro, total, level, microPct, wk, pulseId) {
    return {
      updatedAt: new Date().toISOString(),
      scale: 10,
      weekId: wk,
      pulseSessionId: pulseId,
      macro: Object.assign({}, macro),
      micro: Object.assign({}, micro),
      score: total,
      scoreMax: 50,
      microOverall: microPct,
      level: level,
      weakMacro: MACRO_KEYS.filter(function (k) { return (macro[k] || 0) <= 4; }),
      weakMicro: weakestMicro(8).map(function (w) { return w.id; }),
      trainerNotes: state.context.note || '',
      context: state.context,
      source: 'manual-calibration-v1'
    };
  }

  async function save() {
    patchContext();
    syncScoresFromQuestionnaire();
    var sid = state.sid;
    var s = global.DB[sid];
    if (!s) return;

    var macro = {};
    MACRO_KEYS.forEach(function (k) { macro[k] = state.macro[k] || 5; });
    var micro = Object.assign({}, state.micro);
    var obs = Object.assign({}, state.observations);
    var total = macroTotal();
    var level = global.getLevelForStudent ? global.getLevelForStudent(total, s) : 'Functional';
    var wk = state.context.weekId || weekId();
    var pulseId = 'PULSE-MCAL-' + wk + '-' + Date.now();
    var areaAverages = buildAreaAverages(micro);
    var microPct = microOverall(micro);
    var trainer = (global.SESSION && global.SESSION.name) || 'trainer';

    if (!s.kpis) s.kpis = {};
    if (!s.kpis.phase1) s.kpis.phase1 = {};
    MACRO_KEYS.forEach(function (k) { s.kpis.phase1[k] = String(macro[k]); });
    s.kpiScale = 10;
    if (s.info) {
      s.info.current_score = total;
      s.info.score = total;
      s.info.level = level;
    }

    if (!s.calibrations) s.calibrations = [];
    s.calibrations.push({
      date: new Date().toISOString(),
      trainer: trainer,
      kpis: macro,
      score: total,
      scale: 10,
      hw: 'yes',
      notes: 'Calibración manual 1–10 · ' + total + '/50 · ' + (state.context.note || ''),
      pulseSessionId: pulseId,
      weekId: wk,
      source: 'manual-calibration-v1',
      context: state.context,
      questionnaire: Object.assign({}, state.questionnaire),
      microScores: micro,
      microOverall: microPct,
      observations: obs
    });

    if (!s.kpiTracker) s.kpiTracker = [];
    s.kpiTracker.push({
      date: new Date().toISOString(),
      trainer: trainer,
      scores: micro,
      observations: obs,
      areaAverages: areaAverages,
      overall: microPct,
      scale: 10,
      notes: state.context.note || 'Calibración manual macro+micro',
      source: 'manual-calibration-v1',
      weekId: wk,
      pulseSessionId: pulseId
    });

    s.kpiFile = buildKpiFile(s, macro, micro, total, level, microPct, wk, pulseId);

    var weakKpis = weakestMicro(5).map(function (w) { return w.id; });
    s.quizWeakKpis = weakKpis;

    if (!s.weeklyPulse) s.weeklyPulse = [];
    s.weeklyPulse.push({
      weekId: wk,
      date: new Date().toISOString(),
      pulseSessionId: pulseId,
      assessmentDone: true,
      trackerDone: true,
      complete: true,
      manual: true,
      scale: 10,
      source: 'manual-calibration-v1'
    });

    if (!s.trainingBook) s.trainingBook = [];
    s.trainingBook = s.trainingBook.filter(function (e) { return e.source !== 'manual-cal-rotation'; });
    weakestMicro(5).forEach(function (w) {
      var ex = global.KPI26_EXERCISES && KPI26_EXERCISES[w.id];
      if (!ex) return;
      s.trainingBook.push({
        id: 'TB-MCAL-' + Date.now() + '-' + w.id,
        title: ex.title,
        kpi: w.id + ' — ' + w.name,
        objective: ex.objective,
        script: ex.script,
        note: 'Calibración manual · ' + w.score + '/10',
        studentTask: ex.studentTask || ex.title,
        freq: '2x por semana',
        week: (s.kpiTracker || []).length,
        assignedBy: trainer + ' (calibración manual)',
        date: new Date().toISOString(),
        source: 'manual-cal-rotation'
      });
    });

    if (!s.notes) s.notes = [];
    s.notes.push({
      date: new Date().toISOString(),
      trainer: trainer,
      text: 'Calibración manual 1–10 · ' + total + '/50 · micro ' + microPct + '/100 · Weekly Pulse registrado.',
      phase: parseInt((s.info && s.info.phase), 10) || 1
    });

    if (s.compliance) s.compliance.attended = (s.compliance.attended || 0) + 1;

    await global.dbSet('infinity_students', sid, s);
    global.DB[sid] = s;
    if (typeof global.logAction === 'function') await logAction('Calibración manual KPI', (s.info && s.info.name) + ' · ' + total + '/50');
    if (typeof global.showToast === 'function') showToast('Calibración guardada · Pulse + kpiFile IA actualizados');
    if (typeof global.closeModal === 'function') closeModal('modal-manual-cal');
    if (global._pulseSid === sid && typeof global.NexusMockup !== 'undefined' && NexusMockup.pulseTab) {
      NexusMockup.pulseTab(4);
    }
  }

  function exportPdf() {
    patchContext();
    syncScoresFromQuestionnaire();
    var s = global.DB[state.sid];
    var name = (s && s.info && s.info.name) || state.sid;
    var names = kpiNames();
    var total = macroTotal();
    var microPct = microOverall(state.micro);
    var rows = MACRO_KEYS.map(function (k) {
      return '<tr><td>' + k + ' ' + names[k] + '</td><td><strong>' + state.macro[k] + '/10</strong></td><td>' + scaleLabel(state.macro[k]) + '</td></tr>';
    }).join('');
    var microRows = allMicroMeta().map(function (m) {
      return '<tr><td>' + m.id + '</td><td>' + m.name + '</td><td>' + (state.micro[m.id] || '—') + '/10</td></tr>';
    }).join('');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Calibración ' + name + '</title>'
      + '<style>body{font-family:Inter,sans-serif;padding:24px;color:#111;}h1{font-size:18px;}table{width:100%;border-collapse:collapse;font-size:12px;margin:12px 0;}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background:#f3f4f6;}</style></head><body>'
      + '<h1>Infinity Studio CR — Calibración manual KPI</h1>'
      + '<p><strong>Estudiante:</strong> ' + name + ' · <strong>Fecha:</strong> ' + new Date().toLocaleString('es-CR') + '</p>'
      + '<p><strong>Semana:</strong> ' + (state.context.weekId || '') + ' · <strong>Macro:</strong> ' + total + '/50 · <strong>Micro:</strong> ' + microPct + '/100</p>'
      + '<p>' + (state.context.note || '') + '</p>'
      + '<h2>Macro KPIs</h2><table><tr><th>KPI</th><th>Score</th><th>Nivel</th></tr>' + rows + '</table>'
      + '<h2>Micro KPIs (26)</h2><table><tr><th>ID</th><th>Nombre</th><th>Score</th></tr>' + microRows + '</table>'
      + '<p style="font-size:10px;color:#666;margin-top:24px;">Método Nexus · escala 1–10 · manual-calibration-v1</p>'
      + '<script>window.onload=function(){window.print();}<' + '/script></body></html>';
    var w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else if (typeof global.showToast === 'function') {
      showToast('Permití ventanas emergentes para exportar PDF', 'err');
    }
  }

  global.NexusManualCal = {
    open: open,
    setStep: setStep,
    setQ: setQ,
    setMacro: setMacro,
    setMicro: setMicro,
    setObs: setObs,
    patchContext: patchContext,
    save: save,
    exportPdf: exportPdf
  };
})(typeof window !== 'undefined' ? window : this);
