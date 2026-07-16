/**
 * Claire TOEIC board — solo plantillas toeic_* (nunca Foundations ni Nexus).
 * Hard-lock: el part activo no cambia hasta pedido explícito del estudiante.
 */
(function (global) {
  'use strict';

  var activeId = null;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function detectPartId(text, fallback) {
    var t = String(text || '');
    if (/\b(listening\s*part\s*2|part\s*2|pregunta\s*de\s*escucha|escucha)\b/i.test(t)) return 'toeic_l2';
    if (/\b(part\s*7|reading\s*part\s*7|pasaje|passage|mini\s*part\s*7)\b/i.test(t)) return 'toeic_r7';
    if (/\b(vocabulario|vocabulary|word\s*in\s*context)\b/i.test(t)) return 'toeic_vocab';
    if (/\b(part\s*5|reading\s*part\s*5|incomplete\s*sentence|___)\b/i.test(t)) return 'toeic_r5';
    return fallback || null;
  }

  function studentSwitchPart(userText) {
    return detectPartId(userText, null);
  }

  function parseMcq(reply) {
    var text = String(reply || '');
    var options = [];
    var re = /^[ \t]*([A-D])\)\s*(.+)$/gim;
    var m;
    while ((m = re.exec(text))) {
      options.push({ key: m[1].toUpperCase(), text: m[2].trim() });
    }
    var stem = '';
    var blank = text.match(/([^\n]{12,220}?_{2,}[^\n]{0,80})/);
    if (blank) stem = blank[1].replace(/\s+/g, ' ').trim();
    if (!stem) {
      var lines = text.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      for (var i = 0; i < lines.length; i++) {
        if (/^[A-D]\)/i.test(lines[i])) break;
        if (/claire|correcto|incorrecto|trampa|siguiente|respond[ae]/i.test(lines[i])) continue;
        if (lines[i].length > 20) stem = lines[i];
      }
    }
    var passage = '';
    var passM = text.match(/(?:Pasaje|Passage|Texto)\s*[:\-–]\s*([\s\S]{40,500}?)(?=\n\s*[A-D]\)|$)/i);
    if (passM) passage = passM[1].replace(/\s+/g, ' ').trim();
    return { stem: stem, options: options, passage: passage };
  }

  function partLabel(id) {
    if (id === 'toeic_l2') return 'Listening Part 2';
    if (id === 'toeic_r7') return 'Reading Part 7';
    if (id === 'toeic_vocab') return 'Vocabulario TOEIC';
    return 'Reading Part 5';
  }

  function normalizeBoard(board, reply, lockId) {
    var b = board && typeof board === 'object' ? board : {};
    var id = String(b.id || lockId || detectPartId(reply, 'toeic_r5') || 'toeic_r5');
    if (!/^toeic_/i.test(id)) id = lockId && /^toeic_/i.test(lockId) ? lockId : 'toeic_r5';
    var parsed = parseMcq(reply || b.stem || '');
    var options = Array.isArray(b.options) && b.options.length ? b.options : parsed.options;
    var stem = b.stem || parsed.stem || '';
    var passage = b.passage || parsed.passage || '';
    return {
      id: id,
      part: b.part || partLabel(id),
      stem: stem,
      options: options,
      passage: passage,
      prompt: b.prompt || ''
    };
  }

  function renderHtml(board) {
    var b = normalizeBoard(board, '', board && board.id);
    var optsHtml = (b.options || []).map(function (o) {
      var key = o.key || o.label || '';
      var txt = o.text || o.value || '';
      return '<div class="claire-toeic-opt"><span class="claire-toeic-key">' + esc(key) + '</span><span>' + esc(txt) + '</span></div>';
    }).join('');
    return '<div class="claire-toeic-board" data-toeic-id="' + esc(b.id) + '">'
      + '<div class="claire-toeic-part">' + esc(b.part) + '</div>'
      + (b.passage ? '<div class="claire-toeic-passage">' + esc(b.passage) + '</div>' : '')
      + (b.prompt ? '<div class="claire-toeic-prompt">' + esc(b.prompt) + '</div>' : '')
      + (b.stem ? '<div class="claire-toeic-stem">' + esc(b.stem) + '</div>' : '')
      + (optsHtml ? '<div class="claire-toeic-opts">' + optsHtml + '</div>' : '<div class="claire-toeic-stem">Respondé según el enunciado de Claire.</div>')
      + '</div>';
  }

  function shell() {
    return document.getElementById('claire-lesson-shell');
  }

  function stageEl() {
    return document.getElementById('claire-visual-stage');
  }

  function mediaEl() {
    return document.getElementById('claire-stage-media');
  }

  function show(board, reply, lockId) {
    var sh = shell();
    var stage = stageEl();
    var media = mediaEl();
    if (!sh || !stage || !media) return false;
    var normalized = normalizeBoard(board, reply, lockId);
    if (!/^toeic_/i.test(normalized.id)) return false;
    // Hard-lock: if lock set and board tries another part without switch, keep lock id
    if (lockId && /^toeic_/i.test(lockId) && normalized.id !== lockId) {
      normalized.id = lockId;
      normalized.part = partLabel(lockId);
    }
    media.innerHTML = renderHtml(normalized);
    sh.classList.add('claire-stage-active');
    stage.hidden = false;
    activeId = normalized.id;
    return true;
  }

  function hide() {
    var sh = shell();
    var stage = stageEl();
    var media = mediaEl();
    if (sh) sh.classList.remove('claire-stage-active');
    if (stage) stage.hidden = true;
    if (media) media.innerHTML = '';
    activeId = null;
  }

  function isActive() {
    return !!activeId;
  }

  function getId() {
    return activeId;
  }

  global.ClaireToeicBoard = {
    show: show,
    hide: hide,
    isActive: isActive,
    getId: getId,
    detectPartId: detectPartId,
    studentSwitchPart: studentSwitchPart,
    normalizeBoard: normalizeBoard,
    parseMcq: parseMcq
  };
})(typeof window !== 'undefined' ? window : global);
