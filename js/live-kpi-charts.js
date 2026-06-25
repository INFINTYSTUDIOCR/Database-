/**
 * Live KPI charts — Chart.js tied to slider/input state (not static SVG/kbar).
 */
(function (global) {
  'use strict';

  var pool = {};

  function destroy(key) {
    if (pool[key]) {
      pool[key].destroy();
      delete pool[key];
    }
  }

  function destroyPrefix(prefix) {
    Object.keys(pool).forEach(function (k) {
      if (k.indexOf(prefix) === 0) destroy(k);
    });
  }

  function getCanvas(id) {
    var el = document.getElementById(id);
    return el && el.getContext ? el : null;
  }

  function macroKeys() {
    if (global.KPI_NAMES) return Object.keys(global.KPI_NAMES);
    return ['IG', 'ST', 'RA', 'PS', 'R'];
  }

  function macroLabels() {
    var names = global.KPI_NAMES || {};
    return macroKeys().map(function (k) {
      var n = names[k] || k;
      return k + ' ' + n.split(' ')[0];
    });
  }

  function upsert(key, canvasId, config) {
    var ctx = getCanvas(canvasId);
    if (!ctx || !global.Chart) return null;
    if (pool[key]) {
      pool[key].data = config.data;
      pool[key].update('none');
      return pool[key];
    }
    pool[key] = new Chart(ctx, config);
    return pool[key];
  }

  function updateMacro(key, radarId, barId, values, maxScale) {
    maxScale = maxScale || 5;
    var keys = macroKeys();
    var data = keys.map(function (k) { return Number(values[k]) || 0; });
    var labels = macroLabels();
    var step = maxScale <= 5 ? 1 : 2;

    upsert(key + '-radar', radarId, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Macro KPI',
          data: data,
          borderColor: '#5B21B6',
          backgroundColor: 'rgba(91,33,182,0.18)',
          pointBackgroundColor: '#5B21B6',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: maxScale, ticks: { stepSize: step } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.r + '/' + maxScale; }
            }
          }
        }
      }
    });

    var barColors = data.map(function (v) {
      var pct = v / maxScale;
      if (pct >= 0.8) return '#0F6E56';
      if (pct >= 0.6) return '#D97706';
      return '#A32D2D';
    });

    upsert(key + '-bar', barId, {
      type: 'bar',
      data: {
        labels: keys,
        datasets: [{ data: data, backgroundColor: barColors, borderRadius: 6 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + '/' + maxScale; }
            }
          }
        },
        scales: {
          y: { min: 0, max: maxScale, ticks: { stepSize: step } },
          x: { ticks: { font: { size: 11, weight: '700' } } }
        }
      }
    });
  }

  function updateAreas(key, radarId, barId, areaAverages) {
    if (!areaAverages || !areaAverages.length) return;
    var labels = areaAverages.map(function (a) { return a.id; });
    var data = areaAverages.map(function (a) { return a.pct; });

    upsert(key + '-area-radar', radarId, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Área %',
          data: data,
          borderColor: '#0F6E56',
          backgroundColor: 'rgba(15,110,86,0.15)',
          pointBackgroundColor: '#0F6E56',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.r + '%'; }
            }
          }
        }
      }
    });

    var barColors = data.map(function (p) {
      if (p >= 80) return '#0F6E56';
      if (p >= 60) return '#D97706';
      return '#A32D2D';
    });

    upsert(key + '-area-bar', barId, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: barColors, borderRadius: 6 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + '%'; }
            }
          }
        },
        scales: {
          y: { min: 0, max: 100, ticks: { stepSize: 25 } },
          x: { ticks: { font: { size: 10, weight: '700' } } }
        }
      }
    });
  }

  function readMacroSliders(prefix) {
    var out = {};
    macroKeys().forEach(function (k) {
      var el = document.getElementById(prefix + k);
      out[k] = el ? parseInt(el.value, 10) || 0 : 0;
    });
    return out;
  }

  function computeKTAreaAverages() {
    if (!global.KPI_TRACKER_AREAS) return [];
    return global.KPI_TRACKER_AREAS.map(function (area) {
      var sum = 0;
      var max = 0;
      area.kpis.forEach(function (k) {
        var na = document.getElementById('kt-' + k.id + '-na');
        if (na && na.checked) return;
        var el = document.getElementById('kt-' + k.id);
        if (el) {
          sum += parseInt(el.value, 10) || 0;
          max += k.max;
        }
      });
      return { id: area.id, name: area.name, pct: max ? Math.round(sum / max * 100) : 0 };
    });
  }

  function liveChartCard(title, radarId, barId, hint) {
    return '<div class="card"><div class="card-title"><i class="ti ti-chart-radar"></i>' + title + '</div>'
      + (hint ? '<div class="ib ib-navy" style="margin-bottom:8px;">' + hint + '</div>' : '')
      + '<div class="grid2" style="gap:12px;"><div class="chart-wrap"><canvas id="' + radarId + '"></canvas></div>'
      + '<div class="chart-wrap"><canvas id="' + barId + '"></canvas></div></div></div>';
  }

  function updateLine(key, canvasId, labels, datasets, yMax) {
    yMax = yMax || 5;
    var step = yMax <= 5 ? 1 : 2;
    upsert(key, canvasId, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: yMax, ticks: { stepSize: step } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  global.LiveKpiCharts = {
    destroy: destroy,
    destroyPrefix: destroyPrefix,
    updateMacro: updateMacro,
    updateAreas: updateAreas,
    updateLine: updateLine,
    readMacroSliders: readMacroSliders,
    computeKTAreaAverages: computeKTAreaAverages,
    liveChartCard: liveChartCard,
    macroKeys: macroKeys
  };
})(typeof window !== 'undefined' ? window : this);
