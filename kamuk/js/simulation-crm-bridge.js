/**
 * CRM Bridge — case family → screens → actions → close.
 * Soft Skills / Product teach the topic; this module teaches the desk.
 */
(function (global) {
  'use strict';

  var DESK = [
    { id: 'queue', label: 'Case queue', do: 'Select the case, read title / quote / CASE BRIEF, then Accept.' },
    { id: 'overview', label: 'Overview', do: 'Flags, metrics, client snapshot. Orient before promising.' },
    { id: 'stmt', label: 'Statements', do: 'Confirm if money moved: wires, ACH, fees, holds.' },
    { id: 'svc', label: 'Services', do: 'Products on file — operating account, card, loan, concierge.' },
    { id: 'wallet', label: 'Cards & PIN', do: 'Identity first. Last 6 only. Never read full PAN or PIN.' },
    { id: 'cards', label: 'Card transactions', do: 'Merchant, amount, decline / auth trail.' },
    { id: 'emails', label: 'Emails', do: 'Compose Formato E to the client (evidence they see).' },
    { id: 'contacts', label: 'Previous contacts', do: 'Internal AMR note + AA / PSA / close dispositions.' },
    { id: 'resolve', label: 'Resolve → Submit', do: 'Disposition + summary + timed next step to Alice QA.' }
  ];

  var CLOSE = [
    'Emails → Compose → Formato E (greeting, empathy, explanation, execution, timed close).',
    'Previous contacts → Add note → AMR (Acknowledge · Mirror · Respond with time).',
    'Resolve case → disposition (Resolved / AA / PSA) → summary ≥35 chars → next step with time → Submit.'
  ];

  var FAMILIES = [
    {
      type: 'Operational Complaint',
      icon: 'alert-triangle',
      oneLiner: 'Something failed in day-to-day banking — find the evidence before you explain.',
      tabs: ['Overview', 'Statements', 'Services', 'Previous contacts', 'Emails'],
      actions: [
        'Accept → read CASE BRIEF and prior trail.',
        'Statements: locate the declined / rejected payment or fee.',
        'Services: confirm which product is restricted or active.',
        'Do not lift controls you do not own — escalate with owner + time.'
      ],
      closeHint: 'Often AA (awaiting Ops) or Resolved if you already completed the client-facing step.',
      never: ['Never invent a refund timeline.', 'Never promise to unfreeze without Ops ownership.']
    },
    {
      type: 'Wire Escalation',
      icon: 'arrows-transfer-up',
      oneLiner: 'Money is not lost — say where it is and when the clock runs.',
      tabs: ['Overview', 'Statements', 'Previous contacts', 'Emails'],
      actions: [
        'Statements: confirm amount, beneficiary, hold / pending status.',
        'Name the review window (e.g. 24 business hours) — do not invent a same-day release.',
        'Document who owns compliance / Ops if the hold stays.',
        'Call or email with owner + timed callback.'
      ],
      closeHint: 'AA while in review; Resolved only after release or a clear handoff with timed next step.',
      never: ['Never tell the client to resend from another bank while funds are intact.', 'Never release a compliance hold yourself.']
    },
    {
      type: 'VIP Retention',
      icon: 'diamond',
      oneLiner: 'Protect the relationship — verify, restore usable access, own the callback.',
      tabs: ['Overview', 'Cards & PIN', 'Card transactions', 'Services', 'Emails'],
      actions: [
        'Verify identity before any card disclosure.',
        'Cards & PIN / Card transactions: find decline or travel mismatch.',
        'Apply safe card actions you own (travel notice, limit check) — not silent full unmask.',
        'Acknowledge repeat effort; use Previous contacts if they called before.'
      ],
      closeHint: 'Resolved if usable path is live; AA if reissue / Ops still pending.',
      never: ['Never read full PAN or PIN on the call.', 'Never skip identity because they sound VIP.']
    },
    {
      type: 'AML Alert',
      icon: 'shield-lock',
      oneLiner: 'Protect the bank — investigate discreetly; never tip off.',
      tabs: ['Overview', 'Statements', 'Services', 'Previous contacts'],
      actions: [
        'Review flags and unusual movement in Statements.',
        'Document facts only — no speculation in the client email.',
        'Escalate to Compliance with owner; do not coach the client on how to avoid screening.',
        'Keep client language neutral: review / additional information.'
      ],
      closeHint: 'Almost always AA or PSA to Compliance — Resolved only if Compliance already cleared and you closed the loop.',
      never: ['Never tip off (“we are investigating you for money laundering”).', 'Never clear an AML flag yourself.']
    },
    {
      type: 'Loan Request',
      icon: 'building-bank',
      oneLiner: 'Capture need and route underwriting — never promise approval.',
      tabs: ['Overview', 'Services', 'Previous contacts', 'Emails'],
      actions: [
        'Services: confirm existing facilities and products on file.',
        'Capture amount, purpose, timeline in the note.',
        'Route to Credit / Relationship with owner + time.',
        'Email: acknowledge request; no approval language.'
      ],
      closeHint: 'AA to Credit / RM. Resolved only if the request was declined per policy and communicated.',
      never: ['Never promise approval or a rate.', 'Never invent underwriting timelines.']
    },
    {
      type: 'Credit Risk',
      icon: 'scale',
      oneLiner: 'Explain status factually; Credit owns the decision.',
      tabs: ['Overview', 'Services', 'Statements', 'Previous contacts', 'Emails'],
      actions: [
        'Services / Statements: confirm exposure and recent activity relevant to the flag.',
        'Mirror what Credit already decided — do not renegotiate limits on the desk.',
        'Document client impact and the Credit owner.',
        'Timed next step belongs to Credit or RM.'
      ],
      closeHint: 'AA / PSA to Credit. Resolved only after Credit confirmed and you informed the client.',
      never: ['Never override a Credit decision.', 'Never soften a decline into a soft yes.']
    },
    {
      type: 'Concierge Request',
      icon: 'plane',
      oneLiner: 'Activate verified itineraries — do not invent seats or cars.',
      tabs: ['Overview', 'Services', 'Previous contacts', 'Emails'],
      actions: [
        'Services: confirm Concierge / VIP entitlement.',
        'Capture itinerary details exactly (dates, city, passengers).',
        'Route to Concierge ops with owner; confirm only what is verified.',
        'Email: what you logged + when they hear back.'
      ],
      closeHint: 'AA while Concierge confirms; Resolved when booking is confirmed or declined with alternative.',
      never: ['Never promise unconfirmed seats or ground transport.', 'Never share another client’s itinerary.']
    }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function forType(type) {
    var key = String(type || '').trim().toLowerCase();
    return FAMILIES.find(function (f) { return f.type.toLowerCase() === key; }) || null;
  }

  function familyCard(f, open) {
    return '<details class="crmb-fam"' + (open ? ' open' : '') + ' data-type="' + esc(f.type) + '">'
      + '<summary><i class="ti ti-' + esc(f.icon) + '"></i><b>' + esc(f.type) + '</b><span>' + esc(f.oneLiner) + '</span></summary>'
      + '<div class="crmb-body">'
      + '<div class="crmb-row"><b>Tabs</b><div class="crmb-chips">' + f.tabs.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div>'
      + '<div class="crmb-row"><b>Actions</b><ol>' + f.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></div>'
      + '<div class="crmb-row"><b>Close</b><p>' + esc(f.closeHint) + '</p><ol class="crmb-close">' + CLOSE.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ol></div>'
      + '<div class="crmb-never"><b>Never</b><ul>' + f.never.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>'
      + '</div></details>';
  }

  function styles(accent) {
    if (document.getElementById('crmb-styles')) return;
    var el = document.createElement('style');
    el.id = 'crmb-styles';
    el.textContent = [
      '.crmb{font-family:Inter,Arial,sans-serif;color:#102033}',
      '.crmb-lead{font-size:13px;line-height:1.55;color:#475569;margin:0 0 14px}',
      '.crmb-desk{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:0 0 16px}',
      '.crmb-desk div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px}',
      '.crmb-desk b{display:block;font-size:11px;margin-bottom:4px;color:' + accent + '}',
      '.crmb-desk span{font-size:11px;line-height:1.45;color:#475569}',
      '.crmb-fam{border:1px solid #e2e8f0;border-radius:11px;margin:8px 0;overflow:hidden;background:#fff}',
      '.crmb-fam summary{list-style:none;cursor:pointer;display:flex;gap:10px;align-items:flex-start;padding:12px 14px;background:#f8fafc}',
      '.crmb-fam summary::-webkit-details-marker{display:none}',
      '.crmb-fam summary i{color:' + accent + ';font-size:18px;margin-top:2px}',
      '.crmb-fam summary b{display:block;font-size:13px}',
      '.crmb-fam summary span{display:block;font-size:11px;color:#64748b;line-height:1.45;margin-top:2px;flex:1}',
      '.crmb-body{padding:12px 14px 14px;border-top:1px solid #e2e8f0}',
      '.crmb-row{margin:0 0 12px}.crmb-row b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;margin-bottom:6px}',
      '.crmb-row p,.crmb-row li{font-size:12px;line-height:1.5;color:#334155}',
      '.crmb-row ol{margin:0;padding-left:18px}',
      '.crmb-chips{display:flex;flex-wrap:wrap;gap:5px}',
      '.crmb-chips span{background:#eef2ff;color:#3730a3;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800}',
      '.crmb-never{background:#fff1f2;border:1px solid #fecdd3;border-radius:9px;padding:10px}',
      '.crmb-never b{color:#9f1239;font-size:11px;display:block;margin-bottom:4px}',
      '.crmb-never ul{margin:0;padding-left:18px}.crmb-never li{font-size:12px;color:#9f1239;line-height:1.45}',
      '.crmb-foot{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:14px}',
      '.crmb-btn{border:0;border-radius:9px;padding:11px 16px;background:' + accent + ';color:#fff;font:800 13px Inter,Arial,sans-serif;cursor:pointer}',
      '.crmb-btn:disabled{opacity:.45}.crmb-msg{font-size:12px;font-weight:700;color:#64748b}.crmb-msg.ok{color:#15803d}',
      '.crmb-hint{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74;font-size:12px;line-height:1.5;color:#9a3412}',
      '.crmb-hint b{display:block;margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:.04em}',
      '.crmb-hint .crmb-chips{margin:6px 0}.crmb-hint ol{margin:6px 0 0;padding-left:18px}'
    ].join('');
    document.head.appendChild(el);
  }

  /** Full Training Book / Simulation panel */
  function mount(root, opts) {
    if (!root) return;
    opts = opts || {};
    var accent = opts.accent || (opts.product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var done = !!opts.done;
    styles(accent);
    root.innerHTML = '<div class="crmb">'
      + '<p class="crmb-lead">Soft Skills and Product tell you <em>what</em> to say. This map tells you <em>where to click</em> on the live Holdings desk for each case family — then how to close with email + note + disposition.</p>'
      + '<div class="crmb-desk">' + DESK.map(function (d) {
        return '<div><b>' + esc(d.label) + '</b><span>' + esc(d.do) + '</span></div>';
      }).join('') + '</div>'
      + '<h4 style="margin:0 0 6px;font-size:14px;color:#102033">Playbook by case type</h4>'
      + '<p class="crmb-lead" style="margin-bottom:8px">Open each family. Mark ready when you know tabs → actions → close.</p>'
      + FAMILIES.map(function (f, i) { return familyCard(f, i === 0); }).join('')
      + '<div class="crmb-foot">'
      + '<button type="button" class="crmb-btn" id="crmb-ready"' + (done ? ' disabled' : '') + '>' + (done ? 'Playbook ready' : 'Mark playbook ready') + '</button>'
      + '<span class="crmb-msg' + (done ? ' ok' : '') + '" id="crmb-msg">' + (done ? 'Unlocked — continue to nesting / desk.' : 'Read the families, then mark ready.') + '</span>'
      + '</div></div>';

    var btn = root.querySelector('#crmb-ready');
    if (btn && !done) {
      btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.textContent = 'Playbook ready';
        var msg = root.querySelector('#crmb-msg');
        if (msg) { msg.textContent = 'Unlocked — continue to nesting / desk.'; msg.className = 'crmb-msg ok'; }
        if (typeof opts.onReady === 'function') opts.onReady();
      });
    }
  }

  /** Compact strip for the live desk (case brief column) */
  function renderHint(root, type) {
    if (!root) return;
    styles('#b42318');
    var f = forType(type);
    if (!f) {
      root.innerHTML = '';
      root.style.display = 'none';
      return;
    }
    root.style.display = 'block';
    root.innerHTML = '<div class="crmb-hint"><b>Desk playbook · ' + esc(f.type) + '</b>'
      + esc(f.oneLiner)
      + '<div class="crmb-chips">' + f.tabs.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>'
      + '<ol>' + f.actions.slice(0, 3).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol>'
      + '<div style="margin-top:6px;font-size:11px"><strong>Close:</strong> ' + esc(f.closeHint) + '</div></div>';
  }

  global.SimulationCrmBridge = {
    DESK: DESK,
    FAMILIES: FAMILIES,
    CLOSE: CLOSE,
    forType: forType,
    mount: mount,
    renderHint: renderHint
  };
})(typeof window !== 'undefined' ? window : globalThis);
