/**
 * Nexora Lab — Procurement & Project Administration pack (Infinity only).
 * Scenario selector, multi-character room (one voice per character), job-description
 * upload, STAR + KPI evaluation. Shown only to the allowlisted student(s); the backend
 * enforces the same allowlist.
 */
(function (global) {
  var STUDENT_IDS = ['IS-MAQU-1787761910345'];
  var PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var MAMMOTH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
  var JD_MAX = 6000;
  var OPENING_MSG = 'START_PROCUREMENT';

  var state = {
    catalog: null,
    filter: 'all',
    speakerByLine: {},
    currentSpeaker: null,
    sending: false,
    turn: 0,
    lastScenarioId: null,
    satLabel: null
  };

  function studentId() {
    try { return String(localStorage.getItem('nexora_student_id') || '').trim(); } catch (e) { return ''; }
  }
  function isEnabledForStudent() { return STUDENT_IDS.indexOf(studentId()) >= 0; }
  function isActive() { return !!(global._nx && _nx.scenario && _nx.scenario.pack === 'procurement'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function toast(msg) { if (typeof showToast === 'function') showToast(msg); }

  function castOf(name) {
    var list = (state.catalog && state.catalog.cast) || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }
  function scenarioById(id) {
    var list = (state.catalog && state.catalog.scenarios) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function initials(name) {
    return String(name || '?').split(/\s+/).map(function (p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
  }
  var TILE_COLORS = ['#7C3AED', '#0EA5E9', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#4F46E5'];
  function colorFor(name) {
    var h = 0, s = String(name || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TILE_COLORS[h % TILE_COLORS.length];
  }
  function agentFirstName() {
    var n = '';
    try { n = localStorage.getItem('nexora_agent') || ''; } catch (e) {}
    n = String(n || (global._nx && _nx.agent) || '').trim().split(/\s+/)[0];
    return n || 'You';
  }

  // ── Job description storage ─────────────────────────────────
  function jdKey() { return 'nexora_proc_jd_' + (studentId() || 'anon'); }
  function loadJD() {
    try { return JSON.parse(localStorage.getItem(jdKey()) || 'null'); } catch (e) { return null; }
  }
  function jdText() { var j = loadJD(); return j && j.text ? String(j.text) : ''; }
  function saveJD(text, source) {
    var t = String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, JD_MAX);
    try {
      if (!t) localStorage.removeItem(jdKey());
      else localStorage.setItem(jdKey(), JSON.stringify({ text: t, source: source || 'texto', at: new Date().toISOString() }));
    } catch (e) {}
    refreshJDBadges();
    return t;
  }
  function jdStatusLabel() {
    var j = loadJD();
    if (!j || !j.text) return 'Sin descripción cargada — preguntas generales del puesto';
    return 'Descripción cargada (' + esc(j.source || 'texto') + ' · ' + j.text.length + ' caracteres) — preguntas adaptadas a tu puesto';
  }
  function refreshJDBadges() {
    var on = !!jdText();
    ['proc-sel-jd-status', 'proc-room-jd-status'].forEach(function (id) {
      var el = $(id);
      if (el) { el.innerHTML = jdStatusLabel(); el.classList.toggle('on', on); }
    });
    var btn = $('proc-room-jd-btn');
    if (btn) btn.classList.toggle('on', on);
  }

  function loadScript(url, globalName) {
    return new Promise(function (resolve, reject) {
      if (global[globalName]) return resolve(global[globalName]);
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = function () { global[globalName] ? resolve(global[globalName]) : reject(new Error('load_failed')); };
      s.onerror = function () { reject(new Error('load_failed')); };
      document.head.appendChild(s);
    });
  }

  function readAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error || new Error('read_failed')); };
      r.readAsArrayBuffer(file);
    });
  }
  function readAsText(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result || '')); };
      r.onerror = function () { reject(r.error || new Error('read_failed')); };
      r.readAsText(file);
    });
  }

  async function extractFileText(file) {
    var name = String(file.name || '').toLowerCase();
    if (/\.(txt|md|csv|rtf)$/.test(name) || /^text\//.test(file.type || '')) return await readAsText(file);
    if (/\.pdf$/.test(name) || file.type === 'application/pdf') {
      var pdfjs = await loadScript(PDFJS_URL, 'pdfjsLib');
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      var doc = await pdfjs.getDocument({ data: await readAsArrayBuffer(file) }).promise;
      var out = [];
      for (var p = 1; p <= Math.min(doc.numPages, 20); p++) {
        var page = await doc.getPage(p);
        var tc = await page.getTextContent();
        out.push(tc.items.map(function (it) { return it.str; }).join(' '));
        if (out.join('\n').length > JD_MAX) break;
      }
      return out.join('\n');
    }
    if (/\.docx$/.test(name)) {
      var mammoth = await loadScript(MAMMOTH_URL, 'mammoth');
      var res = await mammoth.extractRawText({ arrayBuffer: await readAsArrayBuffer(file) });
      return res && res.value ? res.value : '';
    }
    throw new Error('unsupported');
  }

  function openJDModal() {
    var m = $('proc-jd-modal');
    if (!m) return;
    $('proc-jd-text').value = jdText();
    updateJDCount();
    $('proc-jd-msg').textContent = '';
    m.style.display = 'flex';
  }
  function closeJDModal() { var m = $('proc-jd-modal'); if (m) m.style.display = 'none'; }
  function updateJDCount() {
    var t = $('proc-jd-text');
    if (t) $('proc-jd-count').textContent = t.value.length + ' / ' + JD_MAX;
  }
  async function onJDFile(ev) {
    var file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    var msg = $('proc-jd-msg');
    msg.textContent = 'Leyendo ' + file.name + '…';
    try {
      var text = String(await extractFileText(file) || '').trim();
      if (!text) throw new Error('empty');
      $('proc-jd-text').value = text.slice(0, JD_MAX);
      $('proc-jd-text').dataset.source = file.name;
      updateJDCount();
      msg.textContent = 'Listo: se extrajo el texto de ' + file.name + '. Revisalo y tocá Guardar.';
    } catch (e) {
      msg.textContent = e && e.message === 'unsupported'
        ? 'Formato no soportado. Usá PDF, Word (.docx) o TXT — o pegá el texto.'
        : 'No se pudo leer el archivo. Probá pegando el texto directamente.';
    }
  }
  function onJDSave() {
    var ta = $('proc-jd-text');
    var saved = saveJD(ta.value, ta.dataset.source || 'texto pegado');
    closeJDModal();
    if (saved) toast(isActive() && _nx.active ? 'Descripción cargada — las próximas preguntas se adaptan a tu puesto' : 'Descripción del puesto guardada');
    else toast('Descripción eliminada');
  }
  function onJDClear() {
    $('proc-jd-text').value = '';
    $('proc-jd-text').dataset.source = '';
    updateJDCount();
  }

  // ── DOM ────────────────────────────────────────────────────
  function injectStyles() {
    if ($('proc-styles')) return;
    var css = ''
      + '.proc-entry{width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,#5B21B6,#7C3AED);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}'
      + '.proc-entry small{display:block;font-weight:600;opacity:.8;font-size:11px;}'
      + '#proc-selector{display:none;position:fixed;inset:0;z-index:60;background:var(--off);overflow-y:auto;}'
      + '.proc-sel-wrap{max-width:1080px;margin:0 auto;padding:24px 18px 48px;}'
      + '.proc-sel-head{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px;}'
      + '.proc-sel-head h2{font-size:22px;font-weight:900;color:var(--navy);}'
      + '.proc-sel-head p{font-size:13px;color:var(--t2);margin-top:4px;line-height:1.5;max-width:640px;}'
      + '.proc-sel-head .btn{margin-left:auto;}'
      + '.proc-jd-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1.5px dashed var(--gl);border-radius:12px;padding:12px 14px;margin-bottom:14px;}'
      + '.proc-jd-bar .st{font-size:12px;color:var(--t2);flex:1;min-width:200px;}'
      + '.proc-jd-bar .st.on,.proc-room-jd .st.on{color:#15803D;font-weight:700;}'
      + '.proc-filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}'
      + '.proc-filter{border:1.5px solid var(--gl);background:#fff;color:var(--t2);border-radius:20px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;}'
      + '.proc-filter.on{background:var(--navy);border-color:var(--navy);color:#fff;}'
      + '.proc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}'
      + '.proc-card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 14px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:8px;border:1.5px solid transparent;}'
      + '.proc-card:hover{border-color:var(--nm);}'
      + '.proc-badge{display:inline-block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--navy);background:var(--nl);padding:3px 8px;border-radius:6px;}'
      + '.proc-card h3{font-size:15px;font-weight:800;color:var(--text);line-height:1.3;}'
      + '.proc-card .en{font-size:12px;color:var(--t3);font-style:italic;}'
      + '.proc-card .area{font-size:12px;color:var(--t2);line-height:1.4;}'
      + '.proc-people{display:flex;flex-wrap:wrap;gap:6px;}'
      + '.proc-person{display:flex;align-items:center;gap:6px;background:var(--off);border-radius:20px;padding:3px 9px 3px 3px;font-size:11px;color:var(--t2);}'
      + '.proc-av{width:22px;height:22px;border-radius:50%;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '.proc-card .btn{align-self:flex-start;margin-top:auto;}'
      + '#proc-screen{display:none;position:fixed;inset:0;z-index:50;background:#17151f;flex-direction:column;color:#fff;}'
      + '.proc-top{background:#24212f;padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}'
      + '.proc-top .ttl{font-size:13px;font-weight:700;}'
      + '.proc-top .mode{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;background:rgba(167,139,250,.2);color:#C4B5FD;padding:3px 8px;border-radius:6px;}'
      + '.proc-top .rec{background:#EA4335;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:800;}'
      + '.proc-top .tm{margin-left:auto;font-family:monospace;font-size:13px;opacity:.75;}'
      + '.proc-tbtn{border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}'
      + '.proc-tbtn.jd{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);}'
      + '.proc-tbtn.jd.on{border-color:#22C55E;color:#86EFAC;}'
      + '.proc-tbtn.end{background:#EF4444;color:#fff;}'
      + '.proc-body{flex:1;display:flex;min-height:0;}'
      + '.proc-stage{flex:1;display:flex;flex-direction:column;min-width:0;}'
      + '.proc-tiles{flex:1;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:14px;padding:18px;overflow-y:auto;}'
      + '.proc-tile{width:190px;height:140px;border-radius:14px;background:#2d2a3a;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;border:3px solid transparent;transition:border-color .2s,box-shadow .2s;}'
      + '.proc-tile.speaking{border-color:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.25);}'
      + '.proc-tile .av{width:56px;height:56px;border-radius:50%;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;color:#fff;}'
      + '.proc-tile .nm{position:absolute;left:6px;right:6px;bottom:6px;background:rgba(0,0,0,.55);border-radius:6px;padding:3px 6px;text-align:center;}'
      + '.proc-tile .nm b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
      + '.proc-tile .nm span{display:block;font-size:9px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
      + '.proc-tile.you{background:#3c4043;}'
      + '.proc-caption{margin:0 18px 12px;min-height:46px;background:rgba(0,0,0,.35);border-radius:10px;padding:10px 14px;font-size:14px;line-height:1.5;}'
      + '.proc-caption b{color:#C4B5FD;margin-right:6px;}'
      + '.proc-side{width:320px;background:#1f1c29;border-left:1px solid rgba(255,255,255,.08);overflow-y:auto;padding:14px;font-size:12px;line-height:1.5;}'
      + '.proc-side h4{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.5);margin:12px 0 6px;}'
      + '.proc-side h4:first-child{margin-top:0;}'
      + '.proc-side li{margin:0 0 5px 16px;color:rgba(255,255,255,.85);}'
      + '.proc-room-jd{background:rgba(255,255,255,.05);border:1px dashed rgba(255,255,255,.2);border-radius:10px;padding:10px;}'
      + '.proc-room-jd .st{color:rgba(255,255,255,.7);margin-bottom:8px;}'
      + '.proc-bottom{background:#24212f;padding:10px 16px;display:flex;align-items:center;gap:10px;}'
      + '.proc-bottom .st{font-size:12px;color:rgba(255,255,255,.6);}'
      + '.proc-bottom .ctr{margin-left:auto;display:flex;gap:8px;}'
      + '#proc-jd-modal{display:none;position:fixed;inset:0;z-index:420;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:1rem;}'
      + '.proc-jd-card{background:#fff;color:var(--text);border-radius:16px;max-width:640px;width:100%;padding:20px;max-height:92vh;overflow-y:auto;}'
      + '.proc-jd-card h3{font-size:17px;font-weight:900;color:var(--navy);margin-bottom:6px;}'
      + '.proc-jd-card p{font-size:13px;color:var(--t2);line-height:1.5;margin-bottom:12px;}'
      + '.proc-jd-card textarea{width:100%;min-height:220px;border:1.5px solid var(--gl);border-radius:10px;padding:10px;font:13px/1.5 Inter,system-ui,sans-serif;resize:vertical;}'
      + '.proc-jd-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;}'
      + '.proc-jd-row .sp{margin-left:auto;}'
      + '#proc-jd-msg{font-size:12px;color:var(--navy);margin-top:8px;min-height:16px;}'
      + '#proc-jd-count{font-size:11px;color:var(--t3);}'
      + '.proc-kpi-row{display:grid;grid-template-columns:minmax(150px,220px) 1fr 40px;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--gl);}'
      + '.proc-kpi-row:last-child{border-bottom:none;}'
      + '.proc-kpi-row .lb{font-size:12px;font-weight:600;color:var(--t2);}'
      + '.proc-kpi-row .lb i{color:var(--gold);font-style:normal;}'
      + '.proc-kpi-note{font-size:11px;color:var(--t3);padding:0 0 6px;}'
      + '.proc-na{font-size:11px;color:var(--t3);text-align:right;}'
      + '.proc-outcome{display:inline-block;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;margin-right:8px;}'
      + '.proc-outcome.MET{background:#DCFCE7;color:#15803D;}.proc-outcome.PARTIAL{background:#FEF3C7;color:#B45309;}.proc-outcome.NOT_MET{background:#FEE2E2;color:#B91C1C;}'
      + '@media (max-width:860px){.proc-side{display:none;}.proc-tile{width:150px;height:118px;}.proc-top .ttl{flex-basis:100%;order:-1;}}';
    var st = document.createElement('style');
    st.id = 'proc-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function injectDom() {
    if ($('proc-screen')) return;
    var sel = document.createElement('div');
    sel.id = 'proc-selector';
    sel.innerHTML = '<div class="proc-sel-wrap">'
      + '<div class="proc-sel-head"><div><h2>Compras y Administración de Proyectos</h2>'
      + '<p>Simulaciones en inglés de tu trabajo real: reuniones de equipo, presentación de informes a clientes y stakeholders, llamadas con proveedores y entrevista STAR. Cada personaje tiene su propia voz. Al final recibís evaluación STAR, inglés y KPIs del puesto.</p></div>'
      + '<button class="btn btn-outline" id="proc-sel-close"><i class="ti ti-arrow-left"></i>Volver</button></div>'
      + '<div class="proc-jd-bar"><i class="ti ti-file-description" style="font-size:20px;color:var(--navy);"></i>'
      + '<div class="st" id="proc-sel-jd-status"></div>'
      + '<button class="btn btn-navy" id="proc-sel-jd-btn"><i class="ti ti-upload"></i>Subir descripción del puesto / servicio</button></div>'
      + '<div class="proc-filters" id="proc-filters"></div>'
      + '<div class="proc-grid" id="proc-grid"></div>'
      + '</div>';
    document.body.appendChild(sel);

    var room = document.createElement('div');
    room.id = 'proc-screen';
    room.innerHTML = '<div class="proc-top">'
      + '<div class="ttl" id="proc-title">—</div><div class="mode" id="proc-mode">—</div><div class="rec">● REC</div>'
      + '<div class="tm" id="proc-timer">0:00</div>'
      + '<button class="proc-tbtn jd" id="proc-room-jd-btn"><i class="ti ti-upload"></i>Subir descripción del puesto</button>'
      + '<button class="proc-tbtn end" id="proc-end-top"><i class="ti ti-phone-off"></i>End</button>'
      + '</div>'
      + '<div class="proc-body"><div class="proc-stage"><div class="proc-tiles" id="proc-tiles"></div>'
      + '<div class="proc-caption" id="proc-caption"></div></div>'
      + '<aside class="proc-side" id="proc-side"></aside></div>'
      + '<div class="proc-bottom"><div class="st" id="proc-status">Connecting...</div>'
      + '<div class="ctr"><button class="co-mic-btn" id="proc-mic-btn" data-ptt-mic="1" title="Hold to talk"><i class="ti ti-microphone"></i></button>'
      + '<button class="proc-tbtn end" id="proc-end-bottom"><i class="ti ti-phone-off"></i>End</button></div></div>';
    document.body.appendChild(room);

    var modal = document.createElement('div');
    modal.id = 'proc-jd-modal';
    modal.innerHTML = '<div class="proc-jd-card">'
      + '<h3><i class="ti ti-file-description"></i> Descripción del puesto o del servicio que brindás</h3>'
      + '<p>Subí tu descripción de puesto (PDF, Word .docx o TXT) o pegá el texto. La simulación hará preguntas sobre tus tareas, procesos y herramientas reales, y la evaluación la toma en cuenta.</p>'
      + '<div class="proc-jd-row"><label class="btn btn-navy" style="cursor:pointer;"><i class="ti ti-upload"></i>Elegir archivo'
      + '<input type="file" id="proc-jd-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" style="display:none;"></label>'
      + '<span id="proc-jd-count" class="sp"></span></div>'
      + '<div id="proc-jd-msg"></div>'
      + '<textarea id="proc-jd-text" placeholder="Pegá aquí la descripción del puesto o del servicio…"></textarea>'
      + '<div class="proc-jd-row"><button class="btn btn-outline" id="proc-jd-clear"><i class="ti ti-trash"></i>Borrar</button>'
      + '<button class="btn btn-outline sp" id="proc-jd-cancel">Cancelar</button>'
      + '<button class="btn btn-green" id="proc-jd-save"><i class="ti ti-check"></i>Guardar</button></div>'
      + '</div>';
    document.body.appendChild(modal);

    $('proc-sel-close').onclick = closeSelector;
    $('proc-sel-jd-btn').onclick = openJDModal;
    $('proc-room-jd-btn').onclick = openJDModal;
    $('proc-end-top').onclick = endSession;
    $('proc-end-bottom').onclick = endSession;
    $('proc-jd-file').onchange = onJDFile;
    $('proc-jd-text').oninput = updateJDCount;
    $('proc-jd-save').onclick = onJDSave;
    $('proc-jd-clear').onclick = onJDClear;
    $('proc-jd-cancel').onclick = closeJDModal;
    if (typeof bindAllNexoraPttMics === 'function') bindAllNexoraPttMics();
  }

  function injectEntryButton() {
    var card = document.querySelector('#autoin-screen .autoin-card');
    if (!card || $('proc-entry')) return;
    var b = document.createElement('button');
    b.id = 'proc-entry';
    b.className = 'proc-entry';
    b.innerHTML = '<i class="ti ti-briefcase" style="font-size:20px;"></i><span>Compras y Administración de Proyectos<small>Reuniones · Informes a clientes · Proveedores · STAR</small></span>';
    b.onclick = openSelector;
    card.appendChild(b);
  }

  // ── Selector ────────────────────────────────────────────────
  function renderFilters() {
    var modes = (state.catalog && state.catalog.modes) || {};
    var html = '<button class="proc-filter' + (state.filter === 'all' ? ' on' : '') + '" data-f="all">Todos</button>';
    Object.keys(modes).forEach(function (k) {
      html += '<button class="proc-filter' + (state.filter === k ? ' on' : '') + '" data-f="' + esc(k) + '">' + esc(modes[k].labelEs) + '</button>';
    });
    var box = $('proc-filters');
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('.proc-filter'), function (btn) {
      btn.onclick = function () { state.filter = btn.getAttribute('data-f'); renderFilters(); renderGrid(); };
    });
  }

  function personChip(name) {
    var c = castOf(name) || { role: '' };
    return '<span class="proc-person" title="' + esc(c.role + (c.org ? ' · ' + c.org : '')) + '"><span class="proc-av" style="background:' + colorFor(name) + ';">' + esc(initials(name)) + '</span>' + esc(name) + '</span>';
  }

  function renderGrid() {
    var list = ((state.catalog && state.catalog.scenarios) || []).filter(function (s) {
      return state.filter === 'all' || s.mode === state.filter;
    });
    var grid = $('proc-grid');
    grid.innerHTML = list.map(function (s) {
      return '<div class="proc-card"><div><span class="proc-badge">' + esc(s.modeLabelEs) + '</span></div>'
        + '<h3>' + esc(s.titleEs) + '</h3><div class="en">' + esc(s.title) + '</div>'
        + '<div class="area"><b>Área:</b> ' + esc(s.area) + '</div>'
        + '<div class="proc-people">' + s.participants.map(personChip).join('') + '</div>'
        + '<button class="btn btn-navy" data-sid="' + esc(s.id) + '"><i class="ti ti-player-play"></i>Iniciar simulación</button></div>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('button[data-sid]'), function (btn) {
      btn.onclick = function () { start(btn.getAttribute('data-sid')); };
    });
  }

  function openSelector() {
    if (!state.catalog) { toast('Cargando escenarios…'); return; }
    $('autoin-screen').style.display = 'none';
    $('proc-selector').style.display = 'block';
    renderFilters();
    renderGrid();
    refreshJDBadges();
  }
  function closeSelector() {
    $('proc-selector').style.display = 'none';
    $('autoin-screen').style.display = 'flex';
  }

  // ── Room ────────────────────────────────────────────────────
  function renderRoom(sc) {
    $('proc-title').textContent = sc.title;
    $('proc-mode').textContent = sc.modeLabel;
    $('proc-timer').textContent = '0:00';
    $('proc-caption').innerHTML = '';
    var tiles = sc.participants.map(function (name) {
      var c = castOf(name) || {};
      return '<div class="proc-tile" data-speaker="' + esc(name) + '"><div class="av" style="background:' + colorFor(name) + ';">' + esc(initials(name)) + '</div>'
        + '<div class="nm"><b>' + esc(name) + '</b><span>' + esc((c.role || '') + (c.org ? ' · ' + c.org : '')) + '</span></div></div>';
    });
    tiles.push('<div class="proc-tile you"><div class="av" style="background:#5f6368;">' + esc(initials(agentFirstName())) + '</div>'
      + '<div class="nm"><b>' + esc(agentFirstName()) + ' (You)</b><span>' + esc((state.catalog && state.catalog.learnerRole) || '') + '</span></div></div>');
    $('proc-tiles').innerHTML = tiles.join('');
    var li = function (arr) { return '<ul>' + (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    $('proc-side').innerHTML = '<h4>Situation</h4><div style="color:rgba(255,255,255,.85);">' + esc(sc.desc) + '</div>'
      + '<h4>Agenda</h4>' + li(sc.agenda)
      + '<h4>On the table</h4>' + li(sc.facts)
      + '<h4>Your objectives</h4>' + li(sc.objectives)
      + '<h4>Tu descripción del puesto</h4><div class="proc-room-jd"><div class="st" id="proc-room-jd-status"></div>'
      + '<button class="proc-tbtn jd" id="proc-side-jd-btn"><i class="ti ti-upload"></i>Subir / editar</button></div>';
    $('proc-side-jd-btn').onclick = openJDModal;
    refreshJDBadges();
  }

  function setStatus(t) { var el = $('proc-status'); if (el) el.textContent = t || ''; }

  function highlight(name) {
    state.currentSpeaker = name;
    Array.prototype.forEach.call(document.querySelectorAll('#proc-tiles .proc-tile[data-speaker]'), function (t) {
      t.classList.toggle('speaking', t.getAttribute('data-speaker') === name);
    });
  }
  function caption(name, text) {
    var el = $('proc-caption');
    if (el) el.innerHTML = '<b>' + esc(name) + ':</b>' + esc(text);
  }

  function speakerProfile(name) {
    var c = castOf(name) || {};
    var parts = String(name || '').split(' ');
    return {
      name: name, firstName: parts[0] || name, lastName: parts.slice(1).join(' '),
      gender: c.gender || 'male', voiceId: c.voiceId, voiceAccent: (c.accent || 'American') + (c.gender === 'female' ? ' Female' : ' Male'),
      account: 'N/A', services: [], billingNotes: []
    };
  }

  function parseSegments(reply, sc) {
    var allowed = sc.participants || [];
    var map = {};
    allowed.forEach(function (n) { map[n.toLowerCase()] = n; map[n.split(' ')[0].toLowerCase()] = n; });
    var segs = [], cur = null;
    String(reply || '').split(/\n+/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;
      var m = line.match(/^\**([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,2})\**\s*:\s*(.*)$/);
      var who = m && map[m[1].trim().toLowerCase()];
      if (who) { cur = { speaker: who, text: m[2].trim() }; segs.push(cur); }
      else if (cur) cur.text = (cur.text + ' ' + line).trim();
      else { cur = { speaker: sc.host, text: line }; segs.push(cur); }
    });
    return segs.filter(function (s) {
      s.text = typeof stripStageDirections === 'function' ? String(stripStageDirections(s.text) || '').trim() : s.text;
      return !!s.text;
    });
  }

  function speakSegments(segs) {
    if (typeof nexoraHardCancelSpeech === 'function') nexoraHardCancelSpeech();
    state.speakerByLine = {};
    if (typeof NexoraStreamVoice !== 'undefined' && NexoraStreamVoice.beginTurn) NexoraStreamVoice.beginTurn();
    segs.forEach(function (seg) {
      var lines = typeof ttsSpeakLines === 'function' ? ttsSpeakLines(seg.text, 900) : [seg.text];
      lines.forEach(function (line) {
        var key = typeof prepareTtsLine === 'function' ? prepareTtsLine(line) : line;
        state.speakerByLine[key] = { speaker: seg.speaker, text: seg.text };
        state.speakerByLine[line] = state.speakerByLine[key];
        if (typeof queueSpeak === 'function') queueSpeak(line);
      });
    });
    if (typeof NexoraStreamVoice !== 'undefined' && NexoraStreamVoice.endTurn) NexoraStreamVoice.endTurn();
    if (segs.length) {
      highlight(segs[0].speaker);
      caption(segs[0].speaker, segs[0].text);
    }
  }

  /** Called by nexoraTtsPayload: voice of the character who owns this line. */
  function ttsPayloadFor(text) {
    if (!isActive()) return null;
    var clean = String(text || '');
    var hit = state.speakerByLine[clean];
    if (!hit) {
      var keys = Object.keys(state.speakerByLine);
      for (var i = 0; i < keys.length && !hit; i++) {
        if (keys[i] && clean.indexOf(keys[i]) === 0) hit = state.speakerByLine[keys[i]];
      }
    }
    var name = hit ? hit.speaker : state.currentSpeaker;
    if (!name) return null;
    var c = castOf(name);
    if (!c || !c.voiceId) return null;
    if (hit) { highlight(name); caption(name, hit.text); }
    _nx.profile = speakerProfile(name);
    return { text: clean, voiceId: c.voiceId, firstName: c.firstName || name.split(' ')[0] };
  }

  function buildPayload(message) {
    var sc = _nx.scenario;
    var payload = {
      message: message,
      history: _nx.history.slice(-24),
      profile: speakerProfile(sc.host),
      scenario: { id: sc.id, pack: 'procurement', type: 'procurement', mode: sc.mode, title: sc.title },
      agentName: agentFirstName(),
      accountContext: { jobDescription: jdText(), turn: state.turn }
    };
    var student = typeof nexoraLabStudentPayload === 'function' ? nexoraLabStudentPayload() : null;
    if (student) payload.student = student;
    return payload;
  }

  async function requestTurn(message) {
    var sc = _nx.scenario;
    var who = state.currentSpeaker || sc.host;
    setStatus(who.split(' ')[0] + ' is responding...');
    var reply = '';
    try {
      reply = await nexoraPostReply(buildPayload(message));
    } catch (e) {
      setStatus('');
      var txt = String((e && e.message) || '');
      if (/PROCUREMENT_PACK_DISABLED|NEXORA_DISABLED/.test(txt)) toast('Este escenario no está habilitado para tu cuenta.');
      else toast('AI did not respond — check login and try again.');
      return false;
    }
    setStatus('');
    var segs = parseSegments(reply, sc);
    if (!segs.length) { toast('No response — try again.'); return false; }
    var normalized = segs.map(function (s) { return s.speaker + ': ' + s.text; }).join('\n');
    _nx.history.push({ role: 'assistant', content: normalized });
    segs.forEach(function (s) { _nx.transcript.push(s.speaker + ' (' + ((castOf(s.speaker) || {}).role || '') + '): ' + s.text); });
    state.turn++;
    speakSegments(segs);
    return true;
  }

  async function send(text) {
    if (!text || !_nx.active || !isActive()) return;
    if (state.sending) return;
    state.sending = true;
    _nxSending = true;
    try {
      if (typeof nexoraHardCancelSpeech === 'function') nexoraHardCancelSpeech();
      _nx.history.push({ role: 'user', content: text });
      _nx.transcript.push(agentFirstName().toUpperCase() + ' (learner): ' + text);
      await requestTurn(text);
    } finally {
      state.sending = false;
      _nxSending = false;
    }
  }

  async function start(id) {
    var base = scenarioById(id);
    if (!base) return;
    if (typeof unlockTtsAudio === 'function') { try { unlockTtsAudio(); } catch (e) {} }
    state.lastScenarioId = id;
    state.turn = 0;
    state.speakerByLine = {};
    state.currentSpeaker = base.host;
    _nx.scenario = Object.assign({}, base, { pack: 'procurement', type: 'procurement' });
    _nx.profile = speakerProfile(base.host);
    _nx.history = [{ role: 'user', content: OPENING_MSG }];
    _nx.transcript = [];
    _nx.holdEvents = [];
    _nx.talkSecs = 0;
    _nx.onHold = false;
    _nx.active = true;
    $('proc-selector').style.display = 'none';
    $('autoin-screen').style.display = 'none';
    $('qa-screen').style.display = 'none';
    renderRoom(_nx.scenario);
    $('proc-screen').style.display = 'flex';
    if (_nx.callTimer) clearInterval(_nx.callTimer);
    _nx.callStart = Date.now();
    _nx.callTimer = setInterval(function () { if (!_nx.onHold) _nx.talkSecs++; }, 1000);
    if (state.displayTimer) clearInterval(state.displayTimer);
    state.displayTimer = setInterval(function () {
      var t = _nx.talkSecs;
      var el = $('proc-timer');
      if (el) el.textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    }, 500);
    state.sending = true;
    _nxSending = true;
    try {
      var ok = await requestTurn(OPENING_MSG);
      if (!ok) setStatus('Could not connect — tap End and try again.');
    } finally {
      state.sending = false;
      _nxSending = false;
    }
  }

  function stopRoom() {
    if (_nx.callTimer) { clearInterval(_nx.callTimer); _nx.callTimer = null; }
    if (state.displayTimer) { clearInterval(state.displayTimer); state.displayTimer = null; }
    _nx.active = false;
    if (typeof nexoraHardCancelSpeech === 'function') nexoraHardCancelSpeech();
    if (typeof stopMic === 'function') stopMic();
    $('proc-screen').style.display = 'none';
    try { sessionStorage.removeItem('nexora_lab_runtime'); } catch (e) {}
  }

  function endSession() {
    var learnerTurns = _nx.history.filter(function (m) { return m.role === 'user' && m.content !== OPENING_MSG; }).length;
    stopRoom();
    if (!learnerTurns) { openSelector(); return; }
    evaluate();
  }

  // ── Evaluation ──────────────────────────────────────────────
  function setSatLabel(text) {
    var el = $('qa-satisfaction');
    var lab = el && el.nextElementSibling;
    if (!lab) return;
    if (state.satLabel == null) state.satLabel = lab.textContent;
    lab.textContent = text == null ? state.satLabel : text;
  }

  async function evaluate() {
    var sc = _nx.scenario;
    var talkTime = _nx.talkSecs;
    var min = Math.floor(talkTime / 60), sec = String(talkTime % 60).padStart(2, '0');
    $('qa-screen').style.display = 'flex';
    $('qa-title').textContent = 'PROCUREMENT SIMULATION EVALUATION · ' + String(sc.title || '').toUpperCase();
    $('qa-score').textContent = '—';
    $('qa-satisfaction').textContent = '—';
    setSatLabel('Stakeholder confidence /10');
    $('qa-time').textContent = min + ':' + sec;
    $('qa-practice').textContent = '+0 min';
    $('qa-body').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--t3);">Preparing your STAR + KPI evaluation...</div>';
    var body = {
      transcript: _nx.transcript.join('\n'),
      scenario: { id: sc.id, pack: 'procurement', type: 'procurement', mode: sc.mode, title: sc.title },
      agentName: agentFirstName(),
      talkTime: talkTime,
      jobDescription: jdText()
    };
    var student = typeof nexoraLabStudentPayload === 'function' ? nexoraLabStudentPayload() : null;
    if (student) body.student = student;
    try {
      var r = await infinityFetch('/nexora-eval', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      var ev = await r.json();
      if (!r.ok || ev.error) throw new Error(ev.error || ('eval_' + r.status));
      renderEvaluation(ev, talkTime);
    } catch (e) {
      $('qa-body').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--t2);">The evaluation could not be generated.<br><br>'
        + '<button class="btn btn-navy" id="proc-eval-retry"><i class="ti ti-refresh"></i>Try again</button> '
        + '<button class="btn btn-outline" id="proc-eval-exit"><i class="ti ti-x"></i>Exit</button></div>';
      $('proc-eval-retry').onclick = evaluate;
      $('proc-eval-exit').onclick = exitToSelector;
    }
  }

  function bar(label, score, max, note) {
    max = max || 10;
    if (score == null) {
      return '<div class="proc-kpi-row"><span class="lb">' + label + '</span><div class="metric-bar-bg"></div><span class="proc-na">n/a</span></div>'
        + (note ? '<div class="proc-kpi-note">' + note + '</div>' : '');
    }
    var pct = Math.max(0, Math.min(100, (Number(score) / max) * 100));
    return '<div class="proc-kpi-row"><span class="lb">' + label + '</span><div class="metric-bar-bg"><div class="metric-bar-fill" style="width:' + pct + '%;"></div></div>'
      + '<span class="metric-score">' + esc(score) + '</span></div>'
      + (note ? '<div class="proc-kpi-note">' + note + '</div>' : '');
  }
  function list(items, icon, color) {
    return (items || []).map(function (w) {
      return '<div class="qa-item"><span style="color:' + color + ';flex-shrink:0;">' + icon + '</span>' + esc(w) + '</div>';
    }).join('');
  }
  function section(icon, color, title, inner) {
    return '<div class="qa-section"><div class="qa-section-title"><i class="ti ' + icon + '" style="color:' + color + ';"></i>' + title + '</div>' + inner + '</div>';
  }

  function renderEvaluation(ev, talkTime) {
    var sc = _nx.scenario || {};
    var focus = sc.kpiFocus || [];
    $('qa-score').textContent = Math.round(ev.overall_score || 0);
    $('qa-satisfaction').textContent = Number(ev.client_satisfaction || 0).toFixed(1);
    var mins = ev.practice_minutes || Math.max(1, Math.ceil(talkTime / 60));
    $('qa-practice').textContent = '+' + mins + ' min';

    var html = '';
    if (ev.outcome || ev.outcome_note) {
      var oc = String(ev.outcome || '').toUpperCase();
      var ocLabel = { MET: 'Objectives met', PARTIAL: 'Partially met', NOT_MET: 'Not met' }[oc] || oc;
      html += section('ti-flag', 'var(--navy)', 'Outcome', '<div style="font-size:13px;color:var(--t2);line-height:1.6;">'
        + (oc ? '<span class="proc-outcome ' + esc(oc) + '">' + esc(ocLabel) + '</span>' : '') + esc(ev.outcome_note || '') + '</div>');
    }
    if (ev.wins && ev.wins.length) html += section('ti-trophy', 'var(--green)', 'What you did well', list(ev.wins, '✓', 'var(--green)'));

    if (ev.procurement_kpis && ev.procurement_kpis.length) {
      html += section('ti-chart-bar', 'var(--purple)', 'Role KPIs <span style="text-transform:none;letter-spacing:0;font-weight:600;">(★ = focus of this scenario)</span>',
        ev.procurement_kpis.map(function (k) {
          var lb = esc(k.label) + (focus.indexOf(k.key) >= 0 ? ' <i>★</i>' : '');
          var note = k.score == null ? 'Not observed in this session' : esc(k.comment || '') + (k.evidence && k.evidence !== 'Not observed' ? ' <em>“' + esc(k.evidence) + '”</em>' : '');
          return bar(lb, k.score, 10, note);
        }).join(''));
    }
    if (ev.star) {
      var s = ev.star;
      html += section('ti-star', 'var(--gold)', 'STAR answers' + (s.score != null ? ' · ' + esc(s.score) + '/100' : ''),
        bar('Situation', s.situation) + bar('Task', s.task) + bar('Action', s.action) + bar('Result', s.result)
        + (s.summary ? '<div class="proc-kpi-note" style="padding-top:6px;">' + esc(s.summary) + '</div>' : '')
        + (s.best_answer ? '<div class="proc-kpi-note"><b>Best answer:</b> “' + esc(s.best_answer) + '”</div>' : ''));
    }
    if (ev.english) {
      var en = ev.english;
      html += section('ti-language', 'var(--navy)', 'Professional English' + (en.score != null ? ' · ' + esc(en.score) + '/100' : ''),
        bar('Clarity', en.clarity) + bar('Vocabulary', en.vocabulary) + bar('Grammar', en.grammar) + bar('Fluency', en.fluency) + bar('Professional tone', en.professional_tone)
        + (en.summary ? '<div class="proc-kpi-note" style="padding-top:6px;">' + esc(en.summary) + '</div>' : ''));
    }
    if (ev.improvements && ev.improvements.length) html += section('ti-target', 'var(--orange)', 'Areas to improve', list(ev.improvements, '→', 'var(--orange)'));
    if (ev.model_phrases && ev.model_phrases.length) html += section('ti-message-2', 'var(--purple)', 'Say it like this', list(ev.model_phrases, '💬', 'var(--purple)'));
    if (ev.practice_fixes && ev.practice_fixes.length) html += section('ti-barbell', 'var(--navy)', 'Practice for next time', list(ev.practice_fixes, '•', 'var(--navy)'));
    html += section('ti-robot', 'var(--purple)', 'Alice feedback', '<div class="verdict-box">' + esc(ev.verdict || 'Good effort!') + '</div>');
    html += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding-top:8px;">'
      + '<button class="btn btn-green" id="proc-qa-repeat"><i class="ti ti-repeat"></i>Repetir escenario</button>'
      + '<button class="btn btn-navy" id="proc-qa-other"><i class="ti ti-layout-grid"></i>Otro escenario</button>'
      + '<button class="btn btn-outline" id="proc-qa-exit"><i class="ti ti-x"></i>Salir</button></div>';
    $('qa-body').innerHTML = html;
    $('proc-qa-repeat').onclick = function () { closeQA(); start(state.lastScenarioId); };
    $('proc-qa-other').onclick = exitToSelector;
    $('proc-qa-exit').onclick = exitToLab;
    if (typeof savePracticeMinutes === 'function') savePracticeMinutes(mins);
  }

  function closeQA() {
    $('qa-screen').style.display = 'none';
    setSatLabel(null);
  }
  function resetLabScenario() {
    if (global._nx && _nx.scenario && _nx.scenario.pack === 'procurement') {
      _nx.scenario = null;
      _nx.profile = null;
      if (typeof refreshNexoraScenario === 'function') { try { refreshNexoraScenario(null); } catch (e) {} }
    }
  }
  function exitToSelector() { closeQA(); resetLabScenario(); openSelector(); }
  function exitToLab() { closeQA(); resetLabScenario(); $('autoin-screen').style.display = 'flex'; }

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    if (!isEnabledForStudent()) return;
    if (typeof infinityFetch !== 'function') return;
    try {
      var r = await infinityFetch('/nexora/procurement/catalog', { method: 'GET' });
      if (!r.ok) return;
      var cat = await r.json();
      if (!cat || !cat.scenarios || !cat.scenarios.length) return;
      state.catalog = cat;
    } catch (e) { return; }
    injectStyles();
    injectDom();
    injectEntryButton();
  }

  global.NexoraProcurement = {
    init: init,
    isActive: isActive,
    send: send,
    ttsPayloadFor: ttsPayloadFor,
    openSelector: openSelector,
    _parseSegments: parseSegments,
    _state: state
  };

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', function () { init(); });
})(typeof window !== 'undefined' ? window : globalThis);
