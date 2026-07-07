/**
 * Cliente — aplica insights Jill a KPIs/gráficos y render para Engine/Portal.
 */
(function (global) {
  'use strict';

  function applyFromServer(student, payload) {
    if (!student || !payload) return student;
    if (payload.kpis && payload.kpis.phase1) {
      if (!student.kpis) student.kpis = {};
      student.kpis.phase1 = Object.assign({}, student.kpis.phase1 || {}, payload.kpis.phase1);
    }
    if (payload.trainerInsight) {
      student.jillTrainerInsight = payload.trainerInsight;
    }
    return student;
  }

  function refreshCharts(student) {
    if (!student) return;
    if (typeof initPortalLiveCharts === 'function') initPortalLiveCharts(student);
    if (typeof LiveKpiCharts !== 'undefined' && global.KPI_NAMES) {
      var kpis = (student.kpis || {}).phase1 || {};
      var macroVals = {};
      Object.keys(global.KPI_NAMES).forEach(function (k) {
        macroVals[k] = parseInt(kpis[k], 10) || 0;
      });
      var kMax = typeof portalKpiMax === 'function' ? portalKpiMax(student) : 100;
      if (document.getElementById('portal-macro-radar')) {
        LiveKpiCharts.updateMacro('portal-macro', 'portal-macro-radar', 'portal-macro-bar', macroVals, kMax);
      }
      if (document.getElementById('profile-macro-radar') && typeof kpiMax === 'function') {
        LiveKpiCharts.updateMacro('profile-macro', 'profile-macro-radar', 'profile-macro-bar', macroVals, kpiMax(student));
      }
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderEngineCard(student, isMaster, sessionName) {
    var ins = student && student.jillTrainerInsight;
    if (!ins) return '';
    var mySummary = '';
    if (!isMaster && sessionName && ins.trainerSummaries) {
      var mine = ins.trainerSummaries.find(function (r) {
        return String(r.trainer || '').trim().toLowerCase() === String(sessionName || '').trim().toLowerCase();
      });
      if (mine) mySummary = mine.summary;
    }
    var deltas = (ins.chartUpdates && ins.chartUpdates.deltas) || {};
    var deltaHtml = Object.keys(deltas).filter(function (k) { return deltas[k]; }).map(function (k) {
      var d = deltas[k];
      var col = d > 0 ? '#0F6E56' : '#A32D2D';
      return '<span style="display:inline-block;margin:2px 4px;font-size:11px;font-weight:700;color:' + col + ';">' + k + ' ' + (d > 0 ? '+' : '') + d + '</span>';
    }).join('');
    var rat = (ins.chartUpdates && ins.chartUpdates.rationale) || {};
    var ratHtml = Object.keys(rat).map(function (k) {
      return '<div style="font-size:11px;color:var(--t2);margin-top:4px;"><strong>' + esc(k) + ':</strong> ' + esc(rat[k]) + '</div>';
    }).join('');

    return '<div class="card"><div class="card-title"><i class="ti ti-chart-arcs"></i>Jill · KPIs y criterio — ' + esc((ins.date || '').slice(0, 10)) + '</div>'
      + (deltaHtml ? '<div style="margin-bottom:8px;">Ajuste gráficos: ' + deltaHtml + '</div>' : '')
      + ratHtml
      + (isMaster && ins.masterJustification
        ? '<div style="margin-top:12px;padding:12px;background:var(--nl);border-radius:var(--r);border-left:3px solid var(--nm);">'
          + '<div style="font-size:10px;font-weight:800;color:var(--nd);letter-spacing:0.08em;margin-bottom:6px;">JUSTIFICACIÓN MASTER TRAINER</div>'
          + '<div style="font-size:13px;line-height:1.65;color:var(--text);white-space:pre-wrap;">' + esc(ins.masterJustification) + '</div></div>'
        : '')
      + (mySummary
        ? '<div style="margin-top:12px;padding:12px;background:var(--gb);border-radius:var(--r);">'
          + '<div style="font-size:10px;font-weight:800;color:var(--gm);margin-bottom:6px;">RESUMEN PARA VOS</div>'
          + '<div style="font-size:13px;line-height:1.65;">' + esc(mySummary) + '</div></div>'
        : '')
      + (isMaster && ins.trainerSummaries && ins.trainerSummaries.length
        ? '<details style="margin-top:10px;"><summary style="cursor:pointer;font-size:12px;color:var(--t3);">Resúmenes por trainer (' + ins.trainerSummaries.length + ')</summary>'
          + ins.trainerSummaries.map(function (r) {
            return '<div style="margin-top:8px;padding:8px;background:var(--gray);border-radius:8px;"><div style="font-size:11px;font-weight:700;">' + esc(r.trainer) + '</div>'
              + '<div style="font-size:12px;line-height:1.55;">' + esc(r.summary) + '</div></div>';
          }).join('') + '</details>'
        : '')
      + (ins.graduationRequest ? '<div style="margin-top:10px;font-size:11px;color:#D97706;font-weight:700;">?? Jill solicitó graduación en esta sesión.</div>' : '')
      + '</div>';
  }

  global.JillTrainerInsights = {
    applyFromServer: applyFromServer,
    refreshCharts: refreshCharts,
    renderEngineCard: renderEngineCard
  };
})(typeof window !== 'undefined' ? window : globalThis);
