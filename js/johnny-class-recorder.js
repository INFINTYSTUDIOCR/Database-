/**
 * Johnny class recorder — MediaRecorder + upload to Super Brain (3 layers).
 * Loaded only from Infinity_Nexus_Engine.html (A.D.A.M.).
 */
(function (global) {
  'use strict';

  var _rec = {
    media: null,
    stream: null,
    chunks: [],
    paused: false,
    startedAt: 0,
    elapsedMs: 0,
    tick: null,
    lastBlob: null,
    lastMime: 'audio/webm',
    result: null
  };

  function $(id) { return document.getElementById(id); }

  function setStatus(msg) {
    var st = $('sb-johnny-status') || $('sb-class-status');
    if (st) st.textContent = msg || '';
  }

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimer() {
    var el = $('sb-johnny-timer');
    if (!el) return;
    var extra = _rec.startedAt ? (Date.now() - _rec.startedAt) : 0;
    el.textContent = fmtTime(_rec.elapsedMs + (_rec.paused ? 0 : extra));
  }

  function setLevel(pct) {
    var bar = $('sb-johnny-level');
    if (bar) bar.style.width = Math.max(2, Math.min(100, pct || 2)) + '%';
  }

  function pickMime() {
    var candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg'
    ];
    if (!global.MediaRecorder || !MediaRecorder.isTypeSupported) return 'audio/webm';
    for (var i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
    }
    return '';
  }

  async function startRecord() {
    if (_rec.media && _rec.media.state === 'recording') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Este navegador no permite grabar micrófono');
    }
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    var mime = pickMime();
    var media = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    _rec.stream = stream;
    _rec.media = media;
    _rec.chunks = [];
    _rec.paused = false;
    _rec.elapsedMs = 0;
    _rec.startedAt = Date.now();
    _rec.lastMime = media.mimeType || mime || 'audio/webm';
    _rec.result = null;

    media.ondataavailable = function (ev) {
      if (ev.data && ev.data.size) _rec.chunks.push(ev.data);
    };
    media.onstop = function () {
      _rec.lastBlob = new Blob(_rec.chunks, { type: _rec.lastMime });
      stopTracks();
      clearInterval(_rec.tick);
      _rec.tick = null;
      updateTimer();
      setStatus('Audio listo · ' + Math.round(_rec.lastBlob.size / 1024) + ' KB — procesá o subí otro');
      renderResult(null);
    };

    media.start(1000);
    clearInterval(_rec.tick);
    _rec.tick = setInterval(updateTimer, 250);
    setStatus('Grabando…');
    setLevel(40);
    tryAttachAnalyser(stream);
  }

  function pauseRecord() {
    if (!_rec.media) return;
    if (_rec.media.state === 'recording') {
      _rec.media.pause();
      _rec.elapsedMs += Date.now() - _rec.startedAt;
      _rec.paused = true;
      _rec.startedAt = 0;
      setStatus('Pausado');
    } else if (_rec.media.state === 'paused') {
      _rec.media.resume();
      _rec.paused = false;
      _rec.startedAt = Date.now();
      setStatus('Grabando…');
    }
  }

  function stopRecord() {
    if (!_rec.media) return;
    if (_rec.media.state === 'recording' || _rec.media.state === 'paused') {
      if (!_rec.paused && _rec.startedAt) {
        _rec.elapsedMs += Date.now() - _rec.startedAt;
      }
      _rec.paused = true;
      _rec.startedAt = 0;
      _rec.media.stop();
    }
  }

  function stopTracks() {
    if (_rec.stream) {
      _rec.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      _rec.stream = null;
    }
    setLevel(2);
  }

  function tryAttachAnalyser(stream) {
    try {
      var Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var src = ctx.createMediaStreamSource(stream);
      var an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      var data = new Uint8Array(an.frequencyBinCount);
      var loop = function () {
        if (!_rec.media || (_rec.media.state !== 'recording' && _rec.media.state !== 'paused')) {
          try { ctx.close(); } catch (e) {}
          return;
        }
        an.getByteFrequencyData(data);
        var sum = 0;
        for (var i = 0; i < data.length; i++) sum += data[i];
        setLevel((sum / data.length / 255) * 100);
        requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { /* levels optional */ }
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function showTab(name) {
    ['pedagogy', 'delivery', 'structures', 'transcript'].forEach(function (t) {
      var panel = $('sb-johnny-tab-' + t);
      var btn = $('sb-johnny-btn-' + t);
      if (panel) panel.style.display = t === name ? 'block' : 'none';
      if (btn) {
        if (t === name) btn.classList.add('btn-navy');
        else btn.classList.remove('btn-navy');
      }
    });
  }

  function renderResult(data) {
    var wrap = $('sb-johnny-layers');
    if (!wrap) return;
    if (!data || !data.layers) {
      wrap.style.display = 'none';
      return;
    }
    _rec.result = data;
    wrap.style.display = 'block';

    var L = data.layers;
    var ped = (L.pedagogy || []).map(function (p, i) {
      return '<div style="margin-bottom:8px;"><strong>' + (i + 1) + '. ' + esc(p.name) + '</strong>'
        + (p.evidence ? '<div style="color:var(--t2);font-size:11px;">Evidencia: ' + esc(p.evidence) + '</div>' : '')
        + (p.whyItWorks ? '<div style="color:var(--t2);font-size:11px;">Por qué: ' + esc(p.whyItWorks) + '</div>' : '')
        + '</div>';
    }).join('') || '<em>Sin pedagogía</em>';

    var del = (L.delivery || []).map(function (d, i) {
      return '<div style="margin-bottom:6px;">' + (i + 1) + '. <code>[' + esc(d.kind) + (d.approxSec ? ' ~' + d.approxSec + 's' : '') + ']</code> '
        + esc(d.segment)
        + (d.note ? '<div style="color:var(--t2);font-size:11px;">' + esc(d.note) + '</div>' : '')
        + '</div>';
    }).join('') || '<em>Sin entrega</em>';

    var str = (L.structures || []).map(function (s, i) {
      return '<div style="margin-bottom:8px;"><strong>' + (i + 1) + '. ' + esc(s.pattern) + '</strong>'
        + (s.shortcut ? ' <span style="color:var(--t2);">(' + esc(s.shortcut) + ')</span>' : '')
        + (s.exampleEN ? '<div style="font-size:11px;">EN: ' + esc(s.exampleEN) + '</div>' : '')
        + (s.howToInstall ? '<div style="color:var(--t2);font-size:11px;">Instalar: ' + esc(s.howToInstall) + '</div>' : '')
        + '</div>';
    }).join('') || '<em>Sin estructuras</em>';

    var pedEl = $('sb-johnny-tab-pedagogy');
    var delEl = $('sb-johnny-tab-delivery');
    var strEl = $('sb-johnny-tab-structures');
    var trEl = $('sb-johnny-tab-transcript');
    if (pedEl) pedEl.innerHTML = ped;
    if (delEl) delEl.innerHTML = del;
    if (strEl) strEl.innerHTML = str;
    if (trEl) trEl.textContent = data.transcript || '';

    var titleEl = $('sb-johnny-title');
    if (titleEl && L.title) titleEl.value = L.title;

    showTab('pedagogy');
  }

  function apiBase() {
    return global.SUPER_BRAIN_API || '';
  }

  function apiSecret() {
    return global.SUPER_BRAIN_SECRET || '';
  }

  async function uploadBlob(blob, review) {
    if (!blob || !blob.size) throw new Error('No hay audio para subir');
    var title = (($('sb-johnny-title') || {}).value || '').trim();
    var fd = new FormData();
    var ext = (blob.type || '').indexOf('mp4') >= 0 ? 'm4a' : 'webm';
    fd.append('audio', blob, 'johnny-class.' + ext);
    fd.append('secret', apiSecret());
    fd.append('review', review ? 'true' : 'false');
    fd.append('author', (global.SESSION && SESSION.name) || 'John Ramírez');
    if (title) fd.append('title', title);

    setStatus(review ? 'Transcribiendo… (luego pendiente)' : 'Transcribiendo… / Separando capas… / Publicando…');
    var r = await fetch(apiBase() + '/super-brain/class-record', {
      method: 'POST',
      headers: { 'X-Analyze-Secret': apiSecret() },
      body: fd
    });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(data.error || data.detail || ('HTTP ' + r.status));
    setStatus((data.published ? 'Publicado e implementado: ' : 'Pendiente: ') + (data.title || '')
      + ' · capas P' + ((data.layers && data.layers.pedagogy) || []).length
      + '/E' + ((data.layers && data.layers.delivery) || []).length
      + '/S' + ((data.layers && data.layers.structures) || []).length);
    renderResult(data);
    var ta = $('sb-class-transcript');
    if (ta && data.transcript) ta.value = data.transcript;
    return data;
  }

  async function processLast(review) {
    if (_rec.media && (_rec.media.state === 'recording' || _rec.media.state === 'paused')) {
      await new Promise(function (resolve) {
        var m = _rec.media;
        var prev = m.onstop;
        m.onstop = function (ev) {
          if (typeof prev === 'function') prev.call(m, ev);
          resolve();
        };
        stopRecord();
      });
    }
    if (!_rec.lastBlob) throw new Error('Grabá o subí un audio primero');
    setStatus('Separando capas…');
    return uploadBlob(_rec.lastBlob, review);
  }

  async function processFile(file, review) {
    if (!file) throw new Error('Elegí un archivo de audio');
    _rec.lastBlob = file;
    _rec.lastMime = file.type || 'audio/webm';
    return uploadBlob(file, !!review);
  }

  async function reSplit(review, ingest) {
    var transcript = (($('sb-class-transcript') || {}).value || '').trim();
    if (transcript.length < 20) throw new Error('Pegá o generá una transcripción primero');
    var title = (($('sb-johnny-title') || {}).value || '').trim();
    setStatus('Separando capas…');
    var r = await fetch(apiBase() + '/super-brain/split-layers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Analyze-Secret': apiSecret()
      },
      body: JSON.stringify({
        transcript: transcript,
        title: title,
        secret: apiSecret(),
        ingest: !!ingest,
        review: review !== false,
        author: (global.SESSION && SESSION.name) || 'John Ramírez'
      })
    });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(data.error || data.detail || ('HTTP ' + r.status));
    setStatus(ingest
      ? ((data.published ? 'Publicado: ' : 'Pendiente: ') + (data.title || ''))
      : ('Capas listas · ' + (data.title || '')));
    renderResult(data);
    return data;
  }

  global.JohnnyClassRecorder = {
    startRecord: startRecord,
    pauseRecord: pauseRecord,
    stopRecord: stopRecord,
    processLast: processLast,
    processFile: processFile,
    reSplit: reSplit,
    showTab: showTab,
    renderResult: renderResult,
    setStatus: setStatus
  };
})(typeof window !== 'undefined' ? window : globalThis);
