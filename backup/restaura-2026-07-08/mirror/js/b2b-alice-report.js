/**
 * Informe B2B Alice Growth — export para trainers / empresas.
 */
(function (global) {
  'use strict';

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (e) { return String(iso).slice(0, 10); }
  }

  function buildAliceB2BReport(student) {
    if (!student) return '';
    var name = (student.info && student.info.name) || student.name || 'Estudiante';
    var g = (student.aliceGrowth) || {};
    var h = g.habit || {};
    var spoken = g.spokenScore || 0;
    var cefr = (typeof AliceBadgesCefr !== 'undefined') ? AliceBadgesCefr.spokenToCefr(spoken) : { level: '—', label: '' };
    var comp = student.companionSessions || [];
    var practice = student.aliceSessions || [];
    var badges = (g.badges || []).join(', ') || 'ninguno';

    var lines = [
      'INFINITY STUDIO CR — INFORME ALICE GROWTH',
      'Estudiante: ' + name,
      'Fecha: ' + fmtDate(new Date().toISOString()),
      '',
      '── RESUMEN ──',
      'Inglés hablado (score): ' + spoken + '/100',
      'Nivel CEFR estimado: ' + cefr.level + ' (' + cefr.label + ')',
      'Racha actual: ' + (h.streak || 0) + ' días (mejor: ' + (h.bestStreak || 0) + ')',
      'Minutos totales Alice: ' + (h.totalMinutes || 0),
      'Sesiones: ' + practice.length + ' práctica · ' + comp.length + ' companion',
      'Badges: ' + badges,
      ''
    ];

    if (comp.length) {
      lines.push('── ÚLTIMAS SESIONES COMPANION ──');
      comp.slice(-5).forEach(function (s) {
        lines.push('· ' + fmtDate(s.date) + ' | ' + (s.topic || 'libre') + ' | ' + (s.score || '—') + '/100');
      });
      lines.push('');
    }

    if (student.kpiFile && student.kpiFile.companionHints) {
      lines.push('── KPI HINTS (companion) ──');
      Object.keys(student.kpiFile.companionHints).forEach(function (k) {
        if (k.charAt(0) === '_') return;
        lines.push('· ' + k + ': ' + student.kpiFile.companionHints[k] + '/100');
      });
      lines.push('');
    }

    lines.push('Generado por Infinity Nexus Engine · Método Nexus');
    return lines.join('\n');
  }

  function downloadReport(student, sid) {
    var text = buildAliceB2BReport(student);
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alice-growth-' + (sid || 'student') + '-' + new Date().toISOString().slice(0, 10) + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  global.AliceB2BReport = {
    buildAliceB2BReport: buildAliceB2BReport,
    downloadReport: downloadReport
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
