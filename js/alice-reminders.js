/**
 * Alice — recordatorios diarios (Notification API + localStorage).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'alice_reminder_prefs';
  var DEFAULT_HOUR = 18;

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { enabled: false, hour: DEFAULT_HOUR, asked: false, lastFiredDate: null };
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function canNotify() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  function requestPermission(cb) {
    if (typeof Notification === 'undefined') {
      if (cb) cb(false);
      return;
    }
    if (Notification.permission === 'granted') {
      if (cb) cb(true);
      return;
    }
    if (Notification.permission === 'denied') {
      if (cb) cb(false);
      return;
    }
    Notification.requestPermission().then(function (p) {
      if (cb) cb(p === 'granted');
    }).catch(function () { if (cb) cb(false); });
  }

  function todayKey() {
    return new Date().toISOString().split('T')[0];
  }

  function maybeFireReminder(student) {
    var prefs = loadPrefs();
    if (!prefs.enabled || !canNotify()) return;
    var h = new Date().getHours();
    if (h < (prefs.hour || DEFAULT_HOUR)) return;
    if (prefs.lastFiredDate === todayKey()) return;
    if (typeof AliceProgress !== 'undefined' && student && AliceProgress.dailyGoalMet(student)) return;

    try {
      var n = new Notification('Alice — práctica de hoy', {
        body: '2 minutos de inglés hablado. Charla libre con Alice cuando quieras.',
        icon: '/icon-192.png',
        tag: 'alice-daily-reminder',
        requireInteraction: false
      });
      n.onclick = function () {
        window.focus();
        if (typeof switchPortalTab === 'function') switchPortalTab('alice');
        if (typeof startAliceCompanionQuick === 'function') startAliceCompanionQuick();
      };
      prefs.lastFiredDate = todayKey();
      savePrefs(prefs);
    } catch (e) {}
  }

  function startReminderLoop(student) {
    maybeFireReminder(student);
    if (global._aliceReminderInterval) clearInterval(global._aliceReminderInterval);
    global._aliceReminderInterval = setInterval(function () {
      maybeFireReminder(student);
    }, 5 * 60 * 1000);
  }

  function enableReminders(hour, cb) {
    requestPermission(function (ok) {
      var prefs = loadPrefs();
      prefs.enabled = ok;
      prefs.hour = hour != null ? hour : DEFAULT_HOUR;
      prefs.asked = true;
      savePrefs(prefs);
      if (cb) cb(ok);
    });
  }

  function renderReminderPrompt() {
    var prefs = loadPrefs();
    if (prefs.asked && prefs.enabled) return '';
    return '<div id="alice-reminder-prompt" style="background:rgba(134,239,172,0.08);border:1px solid rgba(134,239,172,0.25);border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:12px;color:rgba(255,255,255,0.85);">'
      + '<div style="font-weight:700;margin-bottom:6px;"><i class="ti ti-bell"></i> Recordatorio diario</div>'
      + '<div style="margin-bottom:8px;opacity:0.85;">Te avisamos una vez al día para practicar 2 min con Alice (como Siri).</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button type="button" onclick="aliceEnableReminders(18)" style="padding:6px 12px;border-radius:8px;border:none;background:#059669;color:white;font-weight:700;font-size:11px;cursor:pointer;">Activar 6pm</button>'
      + '<button type="button" onclick="aliceDismissReminders()" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:rgba(255,255,255,0.6);font-size:11px;cursor:pointer;">Ahora no</button>'
      + '</div></div>';
  }

  function dismissReminders() {
    var prefs = loadPrefs();
    prefs.asked = true;
    prefs.enabled = false;
    savePrefs(prefs);
    var el = document.getElementById('alice-reminder-prompt');
    if (el) el.remove();
  }

  global.AliceReminders = {
    loadPrefs: loadPrefs,
    savePrefs: savePrefs,
    enableReminders: enableReminders,
    startReminderLoop: startReminderLoop,
    renderReminderPrompt: renderReminderPrompt,
    dismissReminders: dismissReminders,
    maybeFireReminder: maybeFireReminder
  };

  global.aliceEnableReminders = function (hour) {
    AliceReminders.enableReminders(hour, function (ok) {
      var el = document.getElementById('alice-reminder-prompt');
      if (el) el.remove();
      if (ok && typeof showPortalToast === 'function') showPortalToast('Recordatorio activado');
      else if (!ok && el) el.innerHTML = '<div style="font-size:12px;">Activá notificaciones en la configuración del navegador para recibir recordatorios.</div>';
    });
  };
  global.aliceDismissReminders = function () { AliceReminders.dismissReminders(); };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
