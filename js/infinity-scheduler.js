/**
 * Studio Infinity CR — Scheduler
 * Week view Mon–Fri · mounts inside Engine Calendario.
 * Persist via host callbacks (CALENDAR_EVENTS / infinity_sessions).
 */
(function (global) {
  'use strict';

  var DAY_START_MIN = 480;
  var DAY_END_MIN = 1290;
  var TOTAL_MIN = DAY_END_MIN - DAY_START_MIN;
  var PX_PER_MIN = 1.3;
  var TOTAL_PX = TOTAL_MIN * PX_PER_MIN;
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  var TYPE_CLS = {
    Class: 'sc', Meeting: 'sm', Calibration: 'scal', '1-on-1': 's1',
    'Session inicio': 'sm', Other: 'sm', unavail: 'su'
  };
  var ENGINE_TO_UI = {
    session: 'Class', calibration: 'Calibration', evaluation: '1-on-1',
    internal: 'Meeting', Class: 'Class', Meeting: 'Meeting',
    Calibration: 'Calibration', '1-on-1': '1-on-1', unavail: 'unavail'
  };
  var UI_TO_ENGINE = {
    Class: 'session', Meeting: 'internal', Calibration: 'calibration',
    '1-on-1': 'evaluation', 'Session inicio': 'session', Other: 'internal', unavail: 'unavail'
  };
  var PALETTE = [
    { bg: '#e6f1fb', fg: '#185fa5' },
    { bg: '#eaf3de', fg: '#3b6d11' },
    { bg: '#eeedfe', fg: '#3c3489' },
    { bg: '#faeeda', fg: '#854f0b' },
    { bg: '#fcebeb', fg: '#a32d2d' }
  ];

  var state = {
    root: null,
    trainers: [],
    sessions: [],
    activeTr: null,
    viewFilter: 'all',
    weekOff: 0,
    hooks: {},
    toastTimer: null
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function minToDisplay(m) {
    var h = Math.floor(m / 60);
    var min = m % 60;
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return hh + ':' + String(min).padStart(2, '0') + ' ' + ampm;
  }

  function timeStrToMin(t) {
    var parts = String(t || '09:00').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function addMinToTime(timeStr, mins) {
    var total = timeStrToMin(timeStr) + mins;
    var h = Math.floor(total / 60) % 24;
    var m = total % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function durLabel(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    if (h > 0 && m > 0) return h + 'h ' + m + 'min';
    if (h > 0) return h + 'h';
    return m + 'min';
  }

  function mondayOf(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }

  function weekDates() {
    var mon = mondayOf(new Date());
    mon.setDate(mon.getDate() + state.weekOff * 7);
    var out = [];
    for (var i = 0; i < 5; i++) {
      var d = new Date(mon);
      d.setDate(mon.getDate() + i);
      out.push(d);
    }
    return out;
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function toast(msg) {
    var el = document.getElementById('inf-sched-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'inf-sched-toast';
      el.className = 'inf-sched-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3500);
    if (typeof state.hooks.onToast === 'function') state.hooks.onToast(msg);
  }

  /** Map Engine TRAINERS object → scheduler trainers */
  function adaptTrainers(trainersObj, studentsFn) {
    var list = Object.values(trainersObj || {}).filter(function (u) {
      return u && u.name && /trainer|master|admin|superadmin/i.test(String(u.role || 'trainer'));
    });
    if (!list.length) list = Object.values(trainersObj || {}).filter(Boolean);
    return list.map(function (u, i) {
      var pal = PALETTE[i % PALETTE.length];
      var id = String(u.id || u.email || ('t' + i));
      var students = [];
      if (typeof studentsFn === 'function') {
        try {
          students = (studentsFn(u) || []).map(function (s) {
            return { n: (s.info && s.info.name) || s.name || '—', s: (s.info && s.info.schedule) || 'Assigned' };
          });
        } catch (e) { students = []; }
      }
      return {
        id: id,
        name: u.name,
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'Trainer',
        initials: initials(u.name),
        bg: pal.bg,
        fg: pal.fg,
        meet: u.meet || u.meetLink || '',
        chips: [u.department || 'Infinity', u.role || 'Trainer'].filter(Boolean),
        avail: u.availability || 'Mon–Fri',
        students: students
      };
    });
  }

  /** Map CALENDAR_EVENTS → week session blocks relative to weekOff */
  function adaptSessions(eventsObj, trainers) {
    var dates = weekDates();
    var dateIndex = {};
    dates.forEach(function (d, i) { dateIndex[isoDate(d)] = i; });
    var byName = {};
    (trainers || []).forEach(function (t) { byName[String(t.name || '').toLowerCase()] = t.id; });

    var sessions = [];
    Object.keys(eventsObj || {}).forEach(function (id) {
      var e = eventsObj[id];
      if (!e || !e.date) return;
      var day = dateIndex[e.date];
      if (day == null) return;
      var startMin = timeStrToMin(e.time || '09:00');
      var durMin = Number(e.durationMinutes || e.durMin || 90);
      var tid = e.trainerId || byName[String(e.trainer || '').toLowerCase()] || (trainers[0] && trainers[0].id);
      var uiType = ENGINE_TO_UI[e.type] || (e.type === 'unavail' ? 'unavail' : 'Class');
      sessions.push({
        id: id,
        tid: tid,
        type: uiType,
        title: e.title || e.studentName || uiType,
        day: day,
        startMin: startMin,
        durMin: durMin,
        date: e.date,
        raw: e
      });
    });
    return sessions;
  }

  function shellHtml() {
    return ''
      + '<div class="is-topbar">'
      + '  <div class="is-logo"><span class="is-logo-sym">∞</span> Studio Infinity CR — Scheduler</div>'
      + '  <div class="is-view-tabs">'
      + '    <button type="button" class="is-vtab on" data-filter="all">All</button>'
      + '    <button type="button" class="is-vtab" data-filter="Class">Classes</button>'
      + '    <button type="button" class="is-vtab" data-filter="Meeting">Meetings</button>'
      + '    <button type="button" class="is-vtab" data-filter="Calibration">Calibrations</button>'
      + '    <button type="button" class="is-vtab" data-filter="1-on-1">1-on-1</button>'
      + '  </div>'
      + '  <div class="is-top-right">'
      + '    <button type="button" class="is-btn accent" data-act="new"><i class="ti ti-plus"></i> New session</button>'
      + '    <button type="button" class="is-btn danger" data-act="block"><i class="ti ti-ban"></i> Block time</button>'
      + '  </div>'
      + '</div>'
      + '<div class="is-body">'
      + '  <div class="is-sidebar">'
      + '    <div class="is-sb-hdr">Trainers</div>'
      + '    <div class="is-trainer-list" id="is-trainer-list"></div>'
      + '  </div>'
      + '  <div class="is-main">'
      + '    <div class="is-cal-nav">'
      + '      <div style="display:flex;gap:5px;align-items:center;">'
      + '        <button type="button" class="is-arrow" data-act="prev" aria-label="Previous week"><i class="ti ti-chevron-left"></i></button>'
      + '        <button type="button" class="is-arrow" data-act="next" aria-label="Next week"><i class="ti ti-chevron-right"></i></button>'
      + '        <button type="button" class="is-btn small" data-act="today" style="margin-left:4px;">Today</button>'
      + '      </div>'
      + '      <div class="is-cal-title" id="is-cal-title"></div>'
      + '      <div style="font-size:10px;color:var(--text3);">8:00 AM – 9:30 PM · 1.5 hr default</div>'
      + '    </div>'
      + '    <div class="is-week-wrap"><div class="is-week-grid" id="is-week-grid"></div></div>'
      + '    <div class="is-legend">'
      + '      <div class="is-leg"><div class="is-ld" style="background:var(--accent);"></div> Class</div>'
      + '      <div class="is-leg"><div class="is-ld" style="background:var(--success);"></div> Meeting</div>'
      + '      <div class="is-leg"><div class="is-ld" style="background:var(--pro);"></div> Calibration</div>'
      + '      <div class="is-leg"><div class="is-ld" style="background:var(--warning);"></div> 1-on-1</div>'
      + '      <div class="is-leg"><div class="is-ld" style="background:var(--danger);opacity:.6;"></div> Unavailable</div>'
      + '    </div>'
      + '    <div class="is-detail-panel" id="is-detail-panel"></div>'
      + '  </div>'
      + '</div>';
  }

  function ensureModals() {
    if (document.getElementById('inf-sched-new-modal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = ''
      + '<div class="inf-sched-overlay" id="inf-sched-new-modal">'
      + '  <div class="inf-sched-modal">'
      + '    <div class="is-mtitle">Schedule session <button type="button" class="is-mclose" data-close="inf-sched-new-modal">×</button></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Type</label>'
      + '      <select id="is-ns-type"><option>Class</option><option>Meeting</option><option>Calibration</option><option>1-on-1</option><option>Session inicio</option><option>Other</option></select></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Trainer</label><select id="is-ns-trainer"></select></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Student / title</label><input type="text" id="is-ns-title" placeholder="Student name or title"></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Date</label><input type="date" id="is-ns-date"></div>'
      + '    <div class="is-fr is-fr-2"><div><label class="is-fr-lbl">Start time</label><input type="time" id="is-ns-start" value="09:00">'
      + '      <div class="is-hint">Any time</div></div>'
      + '      <div><label class="is-fr-lbl">Duration</label><div class="is-dur-row">'
      + '        <input type="number" id="is-ns-dur-n" value="1.5" min="0.5" max="8" step="0.5">'
      + '        <select id="is-ns-dur-unit"><option value="60" selected>hour(s)</option><option value="30">half-hour(s)</option><option value="90">1.5 hr slot(s)</option></select>'
      + '      </div><div class="is-dur-preview" id="is-ns-preview"></div></div></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Notes</label><textarea id="is-ns-notes" rows="2"></textarea></div>'
      + '    <div class="is-err" id="is-ns-err">Date and start time are required.</div>'
      + '    <div class="is-mbtns"><button type="button" class="is-btn accent" id="is-ns-save">Save session</button>'
      + '      <button type="button" class="is-btn" data-close="inf-sched-new-modal">Cancel</button></div>'
      + '  </div></div>'
      + '<div class="inf-sched-overlay" id="inf-sched-block-modal">'
      + '  <div class="inf-sched-modal">'
      + '    <div class="is-mtitle">Block unavailable time <button type="button" class="is-mclose" data-close="inf-sched-block-modal">×</button></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Trainer</label><select id="is-bl-trainer"></select></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Date</label><input type="date" id="is-bl-date"></div>'
      + '    <div class="is-fr is-fr-2"><div><label class="is-fr-lbl">Start</label><input type="time" id="is-bl-start" value="14:00"></div>'
      + '      <div><label class="is-fr-lbl">Duration</label><div class="is-dur-row">'
      + '        <input type="number" id="is-bl-dur-n" value="2" min="0.5" max="12" step="0.5">'
      + '        <select id="is-bl-dur-unit"><option value="60" selected>hour(s)</option><option value="30">half-hour(s)</option><option value="90">1.5 hr slot(s)</option></select>'
      + '      </div><div class="is-dur-preview" id="is-bl-preview"></div></div></div>'
      + '    <div class="is-fr"><label class="is-fr-lbl">Reason</label><input type="text" id="is-bl-reason" placeholder="Personal, travel…"></div>'
      + '    <div class="is-mbtns"><button type="button" class="is-btn danger" id="is-bl-save">Block time</button>'
      + '      <button type="button" class="is-btn" data-close="inf-sched-block-modal">Cancel</button></div>'
      + '  </div></div>';
    document.body.appendChild(wrap);
  }

  function getDur(nId, unitId) {
    var n = parseFloat(document.getElementById(nId).value) || 1;
    var unit = parseInt(document.getElementById(unitId).value, 10) || 60;
    return Math.round(n * unit);
  }

  function updateNsPreview() {
    var start = document.getElementById('is-ns-start').value;
    var dur = getDur('is-ns-dur-n', 'is-ns-dur-unit');
    var el = document.getElementById('is-ns-preview');
    if (el) el.textContent = durLabel(dur) + ' — ends at ' + addMinToTime(start, dur);
  }

  function updateBlPreview() {
    var start = document.getElementById('is-bl-start').value;
    var dur = getDur('is-bl-dur-n', 'is-bl-dur-unit');
    var el = document.getElementById('is-bl-preview');
    if (el) el.textContent = durLabel(dur) + ' — ends at ' + addMinToTime(start, dur);
  }

  function renderTrainers() {
    var list = state.root.querySelector('#is-trainer-list');
    if (!list) return;
    if (!state.trainers.length) {
      list.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text3);">No trainers loaded.</div>';
      return;
    }
    list.innerHTML = state.trainers.map(function (t) {
      return '<div class="is-tc' + (state.activeTr === t.id ? ' active' : '') + '" data-tid="' + esc(t.id) + '">'
        + '<div class="is-tc-top"><div class="is-av" style="background:' + esc(t.bg) + ';color:' + esc(t.fg) + ';">' + esc(t.initials) + '</div>'
        + '<div><div class="is-tc-name">' + esc(t.name) + '</div><div class="is-tc-role">' + esc(t.role) + '</div></div></div>'
        + '<div class="is-tc-chips">' + (t.chips || []).slice(0, 3).map(function (c) {
          return '<span class="is-chip is-chip-b">' + esc(c) + '</span>';
        }).join('') + '<span class="is-chip is-chip-g">' + (t.students || []).length + ' students</span></div></div>';
    }).join('');
  }

  function renderDetail(id) {
    var t = state.trainers.find(function (x) { return x.id === id; });
    var panel = state.root.querySelector('#is-detail-panel');
    if (!t || !panel) return;
    panel.innerHTML = '<div class="is-dp-inner"><div class="is-dp-hdr"><div><div class="is-dp-name">' + esc(t.name) + '</div>'
      + '<div style="font-size:10px;color:var(--text2);">' + esc(t.role) + ' · ' + esc(t.avail) + '</div></div>'
      + '<button type="button" class="is-dp-close" data-act="close-detail">×</button></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;font-size:11px;">'
      + '<div><div style="color:var(--text2);font-size:10px;">Email</div><div style="font-weight:500;">' + esc(t.email || '—') + '</div></div>'
      + '<div><div style="color:var(--text2);font-size:10px;">Phone</div><div style="font-weight:500;">' + esc(t.phone || '—') + '</div></div></div>'
      + ((t.students || []).length
        ? '<div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Students</div>'
          + (t.students || []).slice(0, 8).map(function (s) {
            return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:0.5px solid var(--border);font-size:11px;"><span>' + esc(s.n) + '</span><span class="is-chip is-chip-b">' + esc(s.s) + '</span></div>';
          }).join('')
        : '')
      + '</div>';
    panel.classList.add('open');
  }

  function renderCal() {
    var grid = state.root.querySelector('#is-week-grid');
    var title = state.root.querySelector('#is-cal-title');
    if (!grid) return;
    var dates = weekDates();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (title) {
      title.textContent = months[dates[0].getMonth()] + ' ' + dates[0].getDate() + '–' + dates[4].getDate() + ', ' + dates[0].getFullYear();
    }

    var sessions = state.sessions.slice();
    if (state.activeTr) sessions = sessions.filter(function (s) { return s.tid === state.activeTr; });
    if (state.viewFilter !== 'all') sessions = sessions.filter(function (s) { return s.type === state.viewFilter; });

    var todayIso = isoDate(new Date());
    var marks = [];
    for (var m = DAY_START_MIN; m <= DAY_END_MIN; m += 30) marks.push(m);

    var html = '<div class="is-day-hdr" style="z-index:3;"></div>';
    dates.forEach(function (d, i) {
      var isToday = isoDate(d) === todayIso;
      html += '<div class="is-day-hdr"><div class="is-dhn">' + DAYS[i] + '</div>'
        + '<div class="' + (isToday ? 'is-dhd today' : 'is-dhd') + '">' + d.getDate() + '</div></div>';
    });

    html += '<div class="is-time-col" style="height:' + TOTAL_PX + 'px;position:relative;">';
    marks.filter(function (_, i) { return i % 2 === 0; }).forEach(function (mm) {
      var top = (mm - DAY_START_MIN) * PX_PER_MIN;
      html += '<div class="is-hour-mark" style="top:' + top + 'px;"><span class="is-time-lbl">' + minToDisplay(mm) + '</span></div>';
    });
    html += '</div>';

    for (var d = 0; d < 5; d++) {
      html += '<div class="is-day-col" style="height:' + TOTAL_PX + 'px;position:relative;">';
      marks.forEach(function (mm) {
        var top = (mm - DAY_START_MIN) * PX_PER_MIN;
        var style = mm % 60 === 0 ? 'border-top:0.5px solid var(--border);' : 'border-top:0.5px dashed rgba(0,0,0,.04);';
        html += '<div class="is-hour-mark" style="top:' + top + 'px;' + style + '"></div>';
      });
      sessions.filter(function (s) { return s.day === d; }).forEach(function (s) {
        var top = (s.startMin - DAY_START_MIN) * PX_PER_MIN;
        var h = Math.max(s.durMin * PX_PER_MIN - 2, 16);
        var cls = TYPE_CLS[s.type] || 'sc';
        var tr = state.trainers.find(function (t) { return t.id === s.tid; });
        var endM = s.startMin + s.durMin;
        html += '<div class="is-sblock ' + cls + '" style="top:' + top + 'px;height:' + h + 'px;" data-sid="' + esc(s.id || '') + '" title="' + esc(s.type + ': ' + s.title) + '">'
          + '<div class="is-sblock-title">' + esc(s.title) + '</div>'
          + (h > 24 ? '<div class="is-sblock-sub">' + minToDisplay(s.startMin) + '–' + minToDisplay(endM) + (tr ? ' · ' + esc(tr.initials) : '') + '</div>' : '')
          + '</div>';
      });
      html += '</div>';
    }
    grid.innerHTML = html;
  }

  function openNew() {
    ensureModals();
    var sel = document.getElementById('is-ns-trainer');
    sel.innerHTML = state.trainers.map(function (t) {
      return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
    }).join('');
    if (state.activeTr) sel.value = state.activeTr;
    var dates = weekDates();
    document.getElementById('is-ns-date').value = isoDate(dates[Math.min(2, dates.length - 1)]);
    document.getElementById('is-ns-err').classList.remove('show');
    updateNsPreview();
    document.getElementById('inf-sched-new-modal').classList.add('open');
  }

  function openBlock() {
    ensureModals();
    var sel = document.getElementById('is-bl-trainer');
    sel.innerHTML = state.trainers.map(function (t) {
      return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
    }).join('');
    if (state.activeTr) sel.value = state.activeTr;
    document.getElementById('is-bl-date').value = isoDate(new Date());
    updateBlPreview();
    document.getElementById('inf-sched-block-modal').classList.add('open');
  }

  async function saveNew() {
    var type = document.getElementById('is-ns-type').value;
    var tid = document.getElementById('is-ns-trainer').value;
    var tr = state.trainers.find(function (t) { return t.id === tid; });
    var date = document.getElementById('is-ns-date').value;
    var start = document.getElementById('is-ns-start').value;
    var dur = getDur('is-ns-dur-n', 'is-ns-dur-unit');
    var title = document.getElementById('is-ns-title').value.trim();
    var notes = document.getElementById('is-ns-notes').value;
    if (!date || !start) {
      document.getElementById('is-ns-err').classList.add('show');
      return;
    }
    var payload = {
      type: UI_TO_ENGINE[type] || 'session',
      uiType: type,
      trainerId: tid,
      trainer: tr ? tr.name : '',
      date: date,
      time: start,
      durationMinutes: dur,
      title: title || (type + (tr ? ' — ' + tr.name : '')),
      studentName: title || null,
      notes: notes,
      source: 'scheduler'
    };
    document.getElementById('inf-sched-new-modal').classList.remove('open');
    if (typeof state.hooks.onSave === 'function') {
      await state.hooks.onSave(payload);
    }
    toast('Saved: ' + type + ' · ' + start + ' (' + durLabel(dur) + ')');
  }

  async function saveBlock() {
    var tid = document.getElementById('is-bl-trainer').value;
    var tr = state.trainers.find(function (t) { return t.id === tid; });
    var date = document.getElementById('is-bl-date').value;
    var start = document.getElementById('is-bl-start').value;
    var dur = getDur('is-bl-dur-n', 'is-bl-dur-unit');
    var reason = document.getElementById('is-bl-reason').value;
    var payload = {
      type: 'unavail',
      uiType: 'unavail',
      trainerId: tid,
      trainer: tr ? tr.name : '',
      date: date,
      time: start,
      durationMinutes: dur,
      title: 'Blocked' + (reason ? ' — ' + reason : ''),
      notes: reason,
      source: 'scheduler'
    };
    document.getElementById('inf-sched-block-modal').classList.remove('open');
    if (typeof state.hooks.onBlock === 'function') await state.hooks.onBlock(payload);
    else if (typeof state.hooks.onSave === 'function') await state.hooks.onSave(payload);
    toast('Blocked: ' + (tr ? tr.name : '') + ' · ' + start);
  }

  function bind() {
    state.root.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-filter]');
      if (tab && state.root.contains(tab)) {
        state.root.querySelectorAll('.is-vtab').forEach(function (t) { t.classList.remove('on'); });
        tab.classList.add('on');
        state.viewFilter = tab.getAttribute('data-filter');
        renderCal();
        return;
      }
      var act = e.target.closest('[data-act]');
      if (act && state.root.contains(act)) {
        var a = act.getAttribute('data-act');
        if (a === 'new') openNew();
        if (a === 'block') openBlock();
        if (a === 'prev') { state.weekOff -= 1; refreshSessions(); }
        if (a === 'next') { state.weekOff += 1; refreshSessions(); }
        if (a === 'today') { state.weekOff = 0; refreshSessions(); }
        if (a === 'close-detail') {
          state.activeTr = null;
          state.root.querySelector('#is-detail-panel').classList.remove('open');
          renderTrainers();
          renderCal();
        }
        return;
      }
      var tc = e.target.closest('.is-tc');
      if (tc && state.root.contains(tc)) {
        var tid = tc.getAttribute('data-tid');
        state.activeTr = state.activeTr === tid ? null : tid;
        renderTrainers();
        renderCal();
        if (state.activeTr) renderDetail(state.activeTr);
        else state.root.querySelector('#is-detail-panel').classList.remove('open');
        return;
      }
      var block = e.target.closest('.is-sblock');
      if (block && state.root.contains(block)) {
        var sid = block.getAttribute('data-sid');
        if (sid && typeof state.hooks.onSelect === 'function') state.hooks.onSelect(sid);
        else if (sid && typeof state.hooks.onDelete === 'function') {
          if (confirm('Delete this session?')) state.hooks.onDelete(sid);
        } else toast(block.getAttribute('title') || 'Session');
      }
    });

    document.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-close]');
      if (closer) {
        var id = closer.getAttribute('data-close');
        var modal = document.getElementById(id);
        if (modal) modal.classList.remove('open');
      }
      if (e.target.id === 'is-ns-save') saveNew();
      if (e.target.id === 'is-bl-save') saveBlock();
    });
    document.addEventListener('input', function (e) {
      if (e.target && (e.target.id === 'is-ns-start' || e.target.id === 'is-ns-dur-n' || e.target.id === 'is-ns-dur-unit')) updateNsPreview();
      if (e.target && (e.target.id === 'is-bl-start' || e.target.id === 'is-bl-dur-n' || e.target.id === 'is-bl-dur-unit')) updateBlPreview();
    });
    document.addEventListener('change', function (e) {
      if (e.target && (e.target.id === 'is-ns-dur-unit' || e.target.id === 'is-ns-start')) updateNsPreview();
      if (e.target && (e.target.id === 'is-bl-dur-unit' || e.target.id === 'is-bl-start')) updateBlPreview();
    });
  }

  function refreshSessions() {
    if (typeof state.hooks.getEvents === 'function') {
      state.sessions = adaptSessions(state.hooks.getEvents(), state.trainers);
    }
    renderCal();
  }

  function mount(opts) {
    opts = opts || {};
    var root = typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root;
    if (!root) return null;
    state.root = root;
    state.hooks = opts;
    state.weekOff = 0;
    state.activeTr = null;
    state.viewFilter = 'all';
    state.trainers = opts.trainers || [];
    if (!state.trainers.length && opts.trainersObj) {
      state.trainers = adaptTrainers(opts.trainersObj, opts.studentsForTrainer);
    }
    state.sessions = opts.sessions || adaptSessions(opts.events || {}, state.trainers);
    root.className = (root.className + ' inf-sched').replace(/\s+/g, ' ').trim();
    root.innerHTML = shellHtml();
    ensureModals();
    if (!root.dataset.isBound) {
      root.dataset.isBound = '1';
      bind();
    }
    renderTrainers();
    renderCal();
    return {
      refresh: function (events) {
        if (events) state.sessions = adaptSessions(events, state.trainers);
        else refreshSessions();
        renderTrainers();
        renderCal();
      },
      setTrainers: function (list) {
        state.trainers = list;
        renderTrainers();
        renderCal();
      }
    };
  }

  global.InfinityScheduler = {
    mount: mount,
    adaptTrainers: adaptTrainers,
    adaptSessions: adaptSessions,
    ENGINE_TO_UI: ENGINE_TO_UI,
    UI_TO_ENGINE: UI_TO_ENGINE
  };
})(typeof window !== 'undefined' ? window : globalThis);
