/**
 * Nexora Next desk skin — Holdings-like case chrome + Overview tab.
 * Does not change scenario engine; upgrades presentation to feel operational.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function initials(name) {
    return String(name || 'CL').trim().split(/\s+/).slice(0, 2).map(function (w) {
      return (w[0] || '').toUpperCase();
    }).join('') || 'CL';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function ensureCaseChrome() {
    var content = document.querySelector('#crm-main .content');
    if (!content || $('nxn-case-hdr')) return;

    var hdr = document.createElement('div');
    hdr.className = 'nxn-case-hdr';
    hdr.id = 'nxn-case-hdr';
    hdr.innerHTML = ''
      + '<div class="nxn-case-avatar" id="nxn-case-avatar">CL</div>'
      + '<div><div class="nxn-case-name" id="nxn-case-name">—</div>'
      + '<div class="nxn-case-sub" id="nxn-case-sub">Select account</div></div>'
      + '<div class="nxn-case-status" id="nxn-case-status"></div>';

    var actions = document.createElement('div');
    actions.className = 'nxn-actions';
    actions.id = 'nxn-actions';
    actions.innerHTML = ''
      + '<button type="button" class="nxn-act accent" onclick="showToast(\'Identity check started\')"><i class="ti ti-id"></i> Verify ID</button>'
      + '<button type="button" class="nxn-act" onclick="(function(){var t=document.querySelector(\'.tab[data-tab=billing]\'); if(t&&typeof switchTab===\'function\') switchTab(\'billing\', t);})()"><i class="ti ti-receipt"></i> Billing</button>'
      + '<button type="button" class="nxn-act warn" onclick="showToast(\'Case flagged for supervisor\')"><i class="ti ti-flag"></i> Escalate</button>'
      + '<button type="button" class="nxn-act danger" onclick="showToast(\'Account freeze requested — pending verification\')"><i class="ti ti-lock"></i> Freeze</button>'
      + '<button type="button" class="nxn-act" onclick="showAddNote()"><i class="ti ti-notes"></i> Note</button>';

    var tabs = content.querySelector('.tabs');
    if (tabs) {
      content.insertBefore(hdr, tabs);
      content.insertBefore(actions, tabs);
    } else {
      content.prepend(actions);
      content.prepend(hdr);
    }
  }

  function ensureOverviewTab() {
    var tabs = document.querySelector('#crm-main .tabs');
    var panes = document.querySelector('#crm-main .tab-content');
    if (!tabs || !panes || $('tab-overview')) return;

    var btn = document.createElement('div');
    btn.className = 'tab';
    btn.setAttribute('data-tab', 'overview');
    btn.innerHTML = '<i class="ti ti-layout-dashboard"></i> Overview';
    btn.onclick = function () { switchTab('overview', btn); };
    tabs.insertBefore(btn, tabs.firstChild);

    var pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.id = 'tab-overview';
    pane.innerHTML = '<div id="overview-content"></div>';
    panes.insertBefore(pane, panes.firstChild);

    // mark existing tabs for action buttons
    Array.prototype.forEach.call(tabs.querySelectorAll('.tab'), function (t) {
      if (t.getAttribute('data-tab')) return;
      var txt = (t.textContent || '').toLowerCase();
      if (txt.indexOf('billing') >= 0) t.setAttribute('data-tab', 'billing');
      else if (txt.indexOf('service') >= 0) t.setAttribute('data-tab', 'services');
      else if (txt.indexOf('payment') >= 0) t.setAttribute('data-tab', 'payments');
      else if (txt.indexOf('note') >= 0) t.setAttribute('data-tab', 'notes');
      else if (txt.indexOf('change') >= 0 || txt.indexOf('activity') >= 0) t.setAttribute('data-tab', 'changes');
    });
  }

  function softenOverlays() {
    var av = document.querySelector('.co-avatar');
    if (av) av.textContent = 'AG';
    var ring = document.querySelector('.incoming-ring');
    if (ring) ring.innerHTML = '<i class="ti ti-phone-incoming" style="font-size:28px;color:var(--accent);"></i>';
    var voice = document.querySelector('.co-voice-note');
    if (voice) voice.textContent = 'Hold mic to talk (push-to-talk)';
    var autoH = document.querySelector('.autoin-card h2');
    if (autoH) autoH.textContent = 'Support desk · live queue';
    var autoP = document.querySelector('.autoin-card p');
    if (autoP) {
      autoP.textContent = 'Inbound call arrives with a customer phone. Locate the account, use the tabs that match the case, verify identity, and close the issue in English — same workflow as a real desk.';
    }
  }

  function buildOverviewHtml(p, sc) {
    var st = (p && p.crmState) || {};
    var reason = (sc && (sc.issue || sc.desc || sc.title)) || (p && p.reason) || 'Inbound support case';
    var industry = (sc && (sc.industryLabel || sc.industry)) || 'General';
    var typeLabel = (sc && (sc.typeLabel || sc.type)) || 'customer_service';
    var alerts = (p && p.billingNotes) || [];
    var metrics = ''
      + '<div class="nxn-metrics">'
      + '<div class="nxn-met"><div class="nxn-met-lbl">Account</div><div class="nxn-met-val" style="font-size:13px;">' + esc(p.account || '—') + '</div></div>'
      + '<div class="nxn-met"><div class="nxn-met-lbl">Balance / cycle</div><div class="nxn-met-val">$' + Number(p.total || 0).toFixed(2) + '</div></div>'
      + '<div class="nxn-met"><div class="nxn-met-lbl">Status</div><div class="nxn-met-val" style="font-size:13px;">' + esc(st.sidebarStatus || 'Active') + '</div></div>'
      + '<div class="nxn-met"><div class="nxn-met-lbl">Open flags</div><div class="nxn-met-val">' + alerts.length + '</div></div>'
      + '</div>';

    var caseBox = '<div class="nxn-card"><div class="nxn-met-lbl">Case focus</div>'
      + '<div style="font-size:13.5px;font-weight:600;margin:4px 0 6px;">' + esc(String(reason).slice(0, 160)) + '</div>'
      + '<div style="font-size:12px;color:var(--text2);">' + esc(industry) + ' · ' + esc(typeLabel) + '</div></div>';

    var fields = ''
      + '<div class="nxn-field-r"><span class="lbl">Primary phone</span><span class="val">' + esc(p.phone) + '</span></div>'
      + '<div class="nxn-field-r"><span class="lbl">Email</span><span class="val">' + esc(p.email) + '</span></div>'
      + '<div class="nxn-field-r"><span class="lbl">Member since</span><span class="val">' + esc(p.memberSince) + '</span></div>'
      + '<div class="nxn-field-r"><span class="lbl">DOB on file</span><span class="val">' + esc(p.dob) + '</span></div>';

    var alertRows = alerts.length
      ? ('<table class="nxn-tbl"><thead><tr><th>Alert</th><th>When</th><th>Amount</th></tr></thead><tbody>'
        + alerts.slice(0, 6).map(function (n) {
          return '<tr><td>' + esc(n.label || n.note || 'Alert') + '</td><td>' + esc(n.date || '—') + '</td><td>' + esc(n.amount || '—') + '</td></tr>';
        }).join('')
        + '</tbody></table>')
      : '<div class="nxn-card" style="color:var(--text2);">No billing alerts on file for this cycle.</div>';

    return '<div class="section-title">Case overview</div>' + metrics + caseBox
      + '<div class="section-title" style="margin-top:14px;">Customer snapshot</div>' + fields
      + '<div class="section-title" style="margin-top:14px;">Flags & alerts</div>' + alertRows;
  }

  function fillCaseChrome(p, sc) {
    ensureCaseChrome();
    if (!$('nxn-case-name') || !p) return;
    $('nxn-case-avatar').textContent = initials(p.name);
    $('nxn-case-name').textContent = p.name || '—';
    $('nxn-case-sub').textContent = 'Acct ' + (p.account || '—') + ' · ' + ((sc && (sc.industryLabel || sc.industry)) || 'Desk');
    var st = p.crmState || {};
    var badges = [];
    badges.push('<span class="nxn-bdg">' + esc((sc && (sc.typeLabel || sc.type)) || 'Case') + '</span>');
    if (st.sidebarStatus) {
      var cls = /lock|fraud|suspend|risk/i.test(st.sidebarStatus) ? 'danger' : /warn|pending|review/i.test(st.sidebarStatus) ? 'warn' : 'ok';
      badges.push('<span class="nxn-bdg ' + cls + '">' + esc(st.sidebarStatus) + '</span>');
    }
    if ((p.billingNotes || []).length) badges.push('<span class="nxn-bdg warn">' + p.billingNotes.length + ' alerts</span>');
    $('nxn-case-status').innerHTML = badges.join('');
  }

  function upgradeSvcCards() {
    document.querySelectorAll('.svc-card .btn, .svc-card button').forEach(function (btn) {
      btn.style.borderRadius = '4px';
      btn.style.fontSize = '11px';
    });
  }

  function afterLoadCRM(p) {
    ensureOverviewTab();
    ensureCaseChrome();
    var sc = (typeof _nx !== 'undefined' && _nx.scenario) ? _nx.scenario : null;
    fillCaseChrome(p, sc);
    var ov = $('overview-content');
    if (ov && p) ov.innerHTML = buildOverviewHtml(p, sc);
    upgradeSvcCards();

    // Prefer Overview as first active pane when CRM opens
    var ovTab = document.querySelector('.tab[data-tab="overview"]');
    if (ovTab && typeof switchTab === 'function') {
      try { switchTab('overview', ovTab); } catch (e) {}
    }

    var coAv = document.querySelector('.co-avatar');
    if (coAv && p && p.name) coAv.textContent = initials(p.name);
  }

  function patchLoadCRM() {
    if (typeof window.loadCRM !== 'function' || window.loadCRM.__nxnDesk) return;
    var orig = window.loadCRM;
    window.loadCRM = function (p) {
      var r = orig.apply(this, arguments);
      try { afterLoadCRM(p); } catch (e) { console.warn('desk skin', e); }
      return r;
    };
    window.loadCRM.__nxnDesk = true;
  }

  function boot() {
    softenOverlays();
    ensureCaseChrome();
    ensureOverviewTab();
    patchLoadCRM();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', function () {
    softenOverlays();
    patchLoadCRM();
  });
})();
