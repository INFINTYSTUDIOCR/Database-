/**
 * Formato E Trainer — interactive email writing with live scoring + certification.
 * Uses KamukDeskEnglish.gradeFormatoE when available (same gate as the live desk).
 */
(function (global) {
  'use strict';

  var PARTS = [
    { id: 'encabezado', code: 'E1', title: 'Encabezado', tip: 'Dear / Hello / Hi + first name (Hello Marta,). Never “Dear Client”.' },
    { id: 'empatia', code: 'E2', title: 'Empatía', tip: 'understand / hear / sorry / apologize / thank you for writing|calling|waiting.' },
    { id: 'explicacion', code: 'E3', title: 'Explicación', tip: '2 professional connectors (because, however…) + 1 método linker (in other words, even though…).' },
    { id: 'ejecucion', code: 'E4', title: 'Ejecución', tip: 'What you ALREADY did in the CRM: I reviewed / I escalated / I verified…' },
    { id: 'encierro', code: 'E5', title: 'Encierro', tip: 'I will + timed next step (today / 4:30 p.m.) + Kind regards / Best regards.' }
  ];

  var SPOT = [
    {
      id: 's1',
      bad: 'Dear Client, I will fix your payroll. Best regards.',
      q: 'What is the biggest Formato E failure?',
      options: [
        { t: 'No client name, no empathy, no explanation, no CRM action, no timed next step — and under 55 words.', ok: true },
        { t: 'It uses Best regards, so it already passes.', ok: false },
        { t: 'Only the word count is wrong.', ok: false }
      ]
    },
    {
      id: 's2',
      bad: 'Hello Marta, thank you for writing. I understand payroll is blocked. I will call you. Kind regards.',
      q: 'This email is warm but still fails. Why?',
      options: [
        { t: 'Missing E3 (2 connectors + método), E4 (CRM action already done), timed hour, and 55 words.', ok: true },
        { t: 'Hello Marta is not allowed.', ok: false },
        { t: 'Kind regards is the wrong closing.', ok: false }
      ]
    },
    {
      id: 's3',
      bad: 'Hi Daniel, I understand the hotel decline. I reviewed the card because there was no travel notice. However the MCC is still blocked. In other words Operations owns the restore. I escalated to Operations. I will call you today before 4:30 p.m. Kind regards.',
      q: 'Almost desk-ready. What is still missing for a pass?',
      options: [
        { t: 'Word count under 55 — expand with one more clear fact or next-step detail.', ok: true },
        { t: 'It needs three método linkers.', ok: false },
        { t: 'Hi is never allowed; only Dear.', ok: false }
      ]
    }
  ];

  var DRILLS = [
    {
      id: 'd1',
      client: 'Marta',
      title: 'Operating account restricted — payroll',
      brief: 'Rivera Logistics. Two supplier ACH declined. Operating Account Restricted. Obsidian card still Active. You reviewed Statements and Previous contacts; you escalated to Operations (they own the restore). Callback today before 4:30 p.m.',
      hint: 'Name Marta. Empathy on payroll. because / however / in other words. I reviewed + I escalated. I will + 4:30 p.m. Kind regards.'
    },
    {
      id: 'd2',
      client: 'Daniel',
      title: 'VIP hotel decline abroad',
      brief: 'Daniel Torres, Obsidian VIP. Hotel in Miami declined the card. No travel notice on file. You verified identity, checked Card transactions, and set a travel notice. Card stays usable for other merchants. You will confirm by call today before 5:00 p.m.',
      hint: 'Hello Daniel. thank you / understand. because + however + in other words. I verified / I set. I will + 5:00 p.m.'
    }
  ];

  var CERT = [
    {
      id: 'c1',
      client: 'Sofia',
      title: 'Wire on hold — payroll batch',
      brief: 'Sofia Méndez. $180,000 payroll wire on compliance hold (not lost). You reviewed Statements, documented Previous contacts, and routed the case to Compliance. Standard review: within 24 business hours. You will call her tomorrow before noon with the outcome.',
      hint: 'Do not tip off AML language. Funds intact. I reviewed / I routed. I will + tomorrow before noon.'
    },
    {
      id: 'c2',
      client: 'Carlos',
      title: 'Duplicate card charge dispute',
      brief: 'Carlos Núñez. Duplicate merchant charge $4,200. Unauthorized pattern. You reviewed Card transactions, opened the dispute, and blocked the card for reissue. Provisional credit within two business days. You will email the case number today before 4:45 p.m.',
      hint: 'Hello Carlos. Empathy. because / therefore / in other words. I reviewed / I opened / I blocked. I will + timed close.'
    }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function grade(text) {
    if (global.KamukDeskEnglish && typeof global.KamukDeskEnglish.gradeFormatoE === 'function') {
      return global.KamukDeskEnglish.gradeFormatoE(text);
    }
    // Minimal fallback aligned with desk rules
    var t = String(text || '').trim();
    var lower = t.toLowerCase();
    var words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    var connectors = ['because', 'however', 'therefore', 'although', 'in addition', 'as a result', 'even though', 'on the other hand', 'consequently', 'nevertheless']
      .filter(function (w) { return lower.indexOf(w) >= 0; });
    var method = ['in other words', 'even though', 'even when', 'as well as', 'which means', 'on the other hand', 'the thing is that']
      .filter(function (w) { return lower.indexOf(w) >= 0; });
    var parts = {
      encabezado: /^(dear|hello|hi)\s+[a-z]/i.test(t),
      empatia: /\b(understand|hear|sorry|apologize)\b|thank you for (writing|calling|waiting)/i.test(t),
      explicacion: connectors.length >= 2 && method.length >= 1,
      ejecucion: /\b(i have|i blocked|i opened|i verified|i reviewed|i filed|i set|i activated|i escalated|i looked into|i sorted out)\b/i.test(t),
      encierro: /\b(i will|i am going to)\b/i.test(t) && /\b(today|tomorrow|within|business day|a\.m\.|p\.m\.|\d{1,2}:\d{2})\b/i.test(t) && /\b(best regards|kind regards)\b/i.test(t)
    };
    var missing = [];
    if (!parts.encabezado) missing.push('E1 Encabezado');
    if (!parts.empatia) missing.push('E2 Empatía');
    if (connectors.length < 2) missing.push('E3: 2 conectores');
    if (method.length < 1) missing.push('E3: 1 método linker');
    if (!parts.ejecucion) missing.push('E4 Ejecución');
    if (!parts.encierro) missing.push('E5 Encierro');
    if (words < 55) missing.push('Mínimo 55 palabras (van ' + words + ')');
    return { ok: missing.length === 0, missing: missing, words: words, parts: parts, connectors: connectors, method: method };
  }

  function stateKey(product, studentId) {
    return 'sim-formato-e:' + (product || 'infinity') + ':' + (studentId || 'anon');
  }

  function readState(product, studentId) {
    try {
      var raw = localStorage.getItem(stateKey(product, studentId));
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {
      phase: 'learn',
      learnAck: false,
      spot: {},
      drills: {},
      cert: {},
      certifiedAt: null,
      attempts: 0
    };
  }

  function writeState(product, studentId, state) {
    try { localStorage.setItem(stateKey(product, studentId), JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function isCertified(product, studentId) {
    var s = readState(product, studentId);
    return !!s.certifiedAt;
  }

  function styles(accent) {
    if (document.getElementById('fe-styles')) return;
    var el = document.createElement('style');
    el.id = 'fe-styles';
    el.textContent = [
      '.fe{font-family:Inter,Arial,sans-serif;color:#102033}',
      '.fe-lead{font-size:13px;line-height:1.55;color:#475569;margin:0 0 14px}',
      '.fe-phases{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}',
      '.fe-ph{border-radius:999px;padding:5px 10px;font:800 10px Inter,Arial,sans-serif;background:#f1f5f9;color:#64748b}',
      '.fe-ph.on{background:' + accent + ';color:#fff}.fe-ph.done{background:#dcfce7;color:#166534}',
      '.fe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:0 0 14px}',
      '.fe-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px}',
      '.fe-card b{display:block;font-size:12px;color:' + accent + ';margin-bottom:4px}',
      '.fe-card span{font-size:11px;line-height:1.45;color:#475569}',
      '.fe-meter{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}',
      '.fe-pill{border-radius:8px;padding:5px 8px;font:800 10px Inter,Arial,sans-serif;background:#fee2e2;color:#991b1b}',
      '.fe-pill.ok{background:#dcfce7;color:#166534}',
      '.fe-case{border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin:0 0 14px;background:#fff}',
      '.fe-case h4{margin:0 0 6px;font-size:14px}.fe-case .brief{font-size:12px;line-height:1.55;color:#475569;margin:0 0 8px}',
      '.fe-case .hint{font-size:11px;color:#9a3412;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:8px;margin:0 0 10px}',
      '.fe-ta{width:100%;box-sizing:border-box;min-height:150px;border:1px solid #cbd5e1;border-radius:9px;padding:11px;font:12px/1.6 Inter,Arial,sans-serif;resize:vertical}',
      '.fe-ta.ok{border-color:#86efac}.fe-ta.bad{border-color:#fca5a5}',
      '.fe-foot{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}',
      '.fe-btn{border:0;border-radius:9px;padding:11px 16px;background:' + accent + ';color:#fff;font:800 13px Inter,Arial,sans-serif;cursor:pointer}',
      '.fe-btn:disabled{opacity:.45}.fe-btn.ghost{background:#fff;color:#334155;border:1px solid #d8e0e8}',
      '.fe-msg{font-size:12px;font-weight:700;color:#64748b}.fe-msg.ok{color:#15803d}.fe-msg.err{color:#b42318}',
      '.fe-choice{display:block;width:100%;text-align:left;border:1px solid #e2e8f0;border-radius:9px;padding:10px 12px;margin:6px 0;background:#fff;font:12px/1.45 Inter,Arial,sans-serif;cursor:pointer}',
      '.fe-choice.right{border-color:#86efac;background:#f0fdf4}.fe-choice.wrong{border-color:#fca5a5;background:#fff1f2}',
      '.fe-bad{font-size:12px;line-height:1.5;background:#f8fafc;border-left:3px solid #e11d48;padding:10px;margin:8px 0;color:#334155}',
      '.fe-cert{display:flex;gap:10px;align-items:center;background:#f0fdf4;border-radius:10px;padding:12px;color:#14532d;margin-bottom:13px}',
      '.fe-cert i{font-size:24px}.fe-cert b{font-size:13px}.fe-cert span{display:block;font-size:11px}',
      '.fe-no-paste{font-size:10px;color:#b45309;margin-top:5px}'
    ].join('');
    document.head.appendChild(el);
  }

  function meterHtml(g) {
    var parts = (g && g.parts) || {};
    return '<div class="fe-meter">'
      + PARTS.map(function (p) {
        return '<span class="fe-pill' + (parts[p.id] ? ' ok' : '') + '">' + p.code + ' ' + p.title + '</span>';
      }).join('')
      + '<span class="fe-pill' + ((g && g.words >= 55) ? ' ok' : '') + '">' + (g ? g.words : 0) + '/55 words</span>'
      + '</div>';
  }

  function phaseList(state) {
    var order = [
      { id: 'learn', label: '1 · Learn' },
      { id: 'spot', label: '2 · Spot errors' },
      { id: 'drill', label: '3 · Write drills' },
      { id: 'cert', label: '4 · Certification' }
    ];
    var idx = order.map(function (x) { return x.id; }).indexOf(state.phase);
    return '<div class="fe-phases">' + order.map(function (p, i) {
      var done = state.certifiedAt || i < idx || (p.id === 'learn' && state.learnAck) || (p.id === 'spot' && spotPassed(state)) || (p.id === 'drill' && drillsPassed(state));
      var on = state.phase === p.id;
      return '<span class="fe-ph' + (on ? ' on' : '') + (done && !on ? ' done' : '') + '">' + p.label + '</span>';
    }).join('') + '</div>';
  }

  function spotPassed(state) {
    return SPOT.every(function (s) { return state.spot[s.id] === true; });
  }

  function drillsPassed(state) {
    return DRILLS.every(function (d) { return state.drills[d.id] === true; });
  }

  function certPassed(state) {
    return CERT.every(function (c) { return state.cert[c.id] === true; });
  }

  function mount(root, opts) {
    if (!root) return;
    opts = opts || {};
    var product = opts.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = opts.accent || (product === 'kamuk' ? '#2B7EC1' : '#5B21B6');
    var studentId = String(opts.studentId || '').trim();
    var state = readState(product, studentId);
    if (opts.done && !state.certifiedAt) {
      state.certifiedAt = new Date().toISOString();
      writeState(product, studentId, state);
    }
    styles(accent);

    function save() { writeState(product, studentId, state); }

    function finishIfReady() {
      if (!certPassed(state)) return;
      if (!state.certifiedAt) state.certifiedAt = new Date().toISOString();
      save();
      if (typeof opts.onReady === 'function') opts.onReady({ certifiedAt: state.certifiedAt, attempts: state.attempts });
    }

    function blockPaste(ta) {
      if (!ta) return;
      ['paste', 'drop'].forEach(function (ev) {
        ta.addEventListener(ev, function (e) { e.preventDefault(); });
      });
    }

    function renderLearn() {
      return '<p class="fe-lead">Formato E is the client email standard on the Holdings desk. Soft Skills teach tone; this module teaches the five blocks the Send button actually grades.</p>'
        + '<div class="fe-grid">' + PARTS.map(function (p) {
          return '<div class="fe-card"><b>' + p.code + ' · ' + esc(p.title) + '</b><span>' + esc(p.tip) + '</span></div>';
        }).join('') + '</div>'
        + '<div class="fe-case"><h4>Gold example (study — do not paste on drills)</h4>'
        + '<div class="brief">Hello Marta, thank you for writing. I understand the payroll freeze is blocking supplier ACH. I reviewed the Operating Account restriction because two payments declined. However I will not lift every control. In other words, I escalated to Operations and I have documented Previous contacts. I will call you today before 4:30 p.m. Kind regards.</div>'
        + meterHtml(grade('Hello Marta, thank you for writing. I understand the payroll freeze is blocking supplier ACH. I reviewed the Operating Account restriction because two payments declined. However I will not lift every control. In other words, I escalated to Operations and I have documented Previous contacts. I will call you today before 4:30 p.m. Kind regards.'))
        + '</div>'
        + '<div class="fe-foot"><button type="button" class="fe-btn" id="fe-learn-ack">' + (state.learnAck ? 'Continue to Spot errors' : 'I understand E1–E5 — continue') + '</button></div>';
    }

    function renderSpot() {
      return '<p class="fe-lead">Find what fails Formato E. You need all three correct to unlock writing drills.</p>'
        + SPOT.map(function (s) {
          var pick = state.spot['_' + s.id];
          var locked = state.spot[s.id] === true;
          return '<div class="fe-case" data-spot="' + s.id + '"><h4>' + esc(s.q) + '</h4>'
            + '<div class="fe-bad">' + esc(s.bad) + '</div>'
            + s.options.map(function (opt, i) {
              var cls = '';
              if (locked && opt.ok) cls = ' right';
              if (pick === i && !opt.ok) cls = ' wrong';
              return '<button type="button" class="fe-choice' + cls + '" data-spot-pick="' + s.id + '" data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' + esc(opt.t) + '</button>';
            }).join('')
            + '</div>';
        }).join('')
        + '<div class="fe-foot"><span class="fe-msg' + (spotPassed(state) ? ' ok' : '') + '">' + (spotPassed(state) ? 'Spot errors passed.' : 'Answer all three.') + '</span>'
        + (spotPassed(state) ? '<button type="button" class="fe-btn" id="fe-to-drill">Continue to write drills</button>' : '') + '</div>';
    }

    function writeBlock(item, bag, bagKey, submitId) {
      var draft = state[bagKey + 'Draft'] && state[bagKey + 'Draft'][item.id] || '';
      var passed = bag[item.id] === true;
      var g = grade(draft);
      return '<div class="fe-case" data-write="' + item.id + '"><h4>' + esc(item.title) + '</h4>'
        + '<div class="brief"><strong>Client:</strong> ' + esc(item.client) + '. ' + esc(item.brief) + '</div>'
        + '<div class="hint">' + esc(item.hint) + '</div>'
        + '<textarea class="fe-ta' + (passed ? ' ok' : (draft && !g.ok ? ' bad' : '')) + '" data-fe-draft="' + bagKey + '" data-id="' + item.id + '" placeholder="Type in English. Paste disabled. Start with Hello ' + esc(item.client) + '…">' + esc(draft) + '</textarea>'
        + '<div class="fe-no-paste">Type only — paste and drop are disabled (same rule as the desk).</div>'
        + meterHtml(g)
        + '<div class="fe-foot"><button type="button" class="fe-btn" data-fe-grade="' + bagKey + '" data-id="' + item.id + '"' + (passed ? ' disabled' : '') + '>' + (passed ? 'Passed' : 'Check Formato E') + '</button>'
        + '<span class="fe-msg' + (passed ? ' ok' : (draft && !g.ok ? ' err' : '')) + '" data-fe-msg="' + item.id + '">'
        + (passed ? 'Pass · ' + g.words + ' words' : (draft ? (g.ok ? 'Ready — press Check.' : g.missing.join(' · ')) : 'Write the full email, then Check.'))
        + '</span></div></div>';
    }

    function renderDrill() {
      if (!state.drillsDraft) state.drillsDraft = {};
      return '<p class="fe-lead">Write two full client emails. The live meter uses the same Formato E grader as Send on the desk. Both must pass.</p>'
        + DRILLS.map(function (d) { return writeBlock(d, state.drills, 'drills', 'fe-drill'); }).join('')
        + '<div class="fe-foot"><span class="fe-msg' + (drillsPassed(state) ? ' ok' : '') + '">' + (drillsPassed(state) ? 'Drills complete.' : 'Pass both drills.') + '</span>'
        + (drillsPassed(state) ? '<button type="button" class="fe-btn" id="fe-to-cert">Start certification</button>' : '') + '</div>';
    }

    function renderCert() {
      if (!state.certDraft) state.certDraft = {};
      var done = certPassed(state);
      return (done
        ? '<div class="fe-cert"><i class="ti ti-rosette-discount-check"></i><div><b>Formato E certified</b><span>You passed both certification emails · attempt ' + (state.attempts || 1) + '</span></div></div>'
        : '<p class="fe-lead">Certification: write two new emails without copying the gold sample. Both must pass Formato E (E1–E5 + 55 words). Retries allowed — coaching shows what is missing.</p>')
        + CERT.map(function (c) { return writeBlock(c, state.cert, 'cert', 'fe-cert'); }).join('')
        + '<div class="fe-foot">'
        + (done
          ? '<button type="button" class="fe-btn" id="fe-done">Continue foundation path</button><span class="fe-msg ok">Certified — unlocked.</span>'
          : '<span class="fe-msg">Pass both certification emails to earn the badge.</span>')
        + '</div>';
    }

    function paint() {
      if (state.certifiedAt && state.phase !== 'cert') state.phase = 'cert';
      root.innerHTML = '<div class="fe">' + phaseList(state)
        + (state.phase === 'learn' ? renderLearn()
          : state.phase === 'spot' ? renderSpot()
            : state.phase === 'drill' ? renderDrill()
              : renderCert())
        + '</div>';

      root.querySelectorAll('.fe-ta').forEach(blockPaste);

      var learnBtn = root.querySelector('#fe-learn-ack');
      if (learnBtn) {
        learnBtn.addEventListener('click', function () {
          state.learnAck = true;
          state.phase = 'spot';
          save();
          paint();
        });
      }

      root.querySelectorAll('[data-spot-pick]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-spot-pick');
          var i = Number(btn.getAttribute('data-i'));
          var item = SPOT.find(function (s) { return s.id === id; });
          if (!item || state.spot[id] === true) return;
          state.spot['_' + id] = i;
          if (item.options[i] && item.options[i].ok) state.spot[id] = true;
          save();
          paint();
        });
      });

      var toDrill = root.querySelector('#fe-to-drill');
      if (toDrill) toDrill.addEventListener('click', function () { state.phase = 'drill'; save(); paint(); });

      var toCert = root.querySelector('#fe-to-cert');
      if (toCert) toCert.addEventListener('click', function () { state.phase = 'cert'; save(); paint(); });

      root.querySelectorAll('[data-fe-draft]').forEach(function (ta) {
        ta.addEventListener('input', function () {
          var bagKey = ta.getAttribute('data-fe-draft');
          var id = ta.getAttribute('data-id');
          if (!state[bagKey + 'Draft']) state[bagKey + 'Draft'] = {};
          state[bagKey + 'Draft'][id] = ta.value;
          save();
          var g = grade(ta.value);
          var caseEl = ta.closest('.fe-case');
          if (!caseEl) return;
          var meterHost = caseEl.querySelector('.fe-meter');
          if (meterHost) meterHost.outerHTML = meterHtml(g);
          ta.classList.toggle('ok', g.ok);
          ta.classList.toggle('bad', !!ta.value && !g.ok);
          var msg = caseEl.querySelector('[data-fe-msg="' + id + '"]');
          if (msg && !(bagKey === 'drills' ? state.drills[id] : state.cert[id])) {
            msg.className = 'fe-msg' + (g.ok ? ' ok' : (ta.value ? ' err' : ''));
            msg.textContent = !ta.value ? 'Write the full email, then Check.' : (g.ok ? 'Ready — press Check.' : g.missing.join(' · '));
          }
        });
      });

      root.querySelectorAll('[data-fe-grade]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var bagKey = btn.getAttribute('data-fe-grade');
          var id = btn.getAttribute('data-id');
          var draft = (state[bagKey + 'Draft'] || {})[id] || '';
          var g = grade(draft);
          state.attempts = (state.attempts || 0) + 1;
          if (g.ok) {
            if (bagKey === 'drills') state.drills[id] = true;
            else state.cert[id] = true;
          }
          save();
          if (bagKey === 'cert' && certPassed(state)) finishIfReady();
          paint();
        });
      });

      var doneBtn = root.querySelector('#fe-done');
      if (doneBtn) {
        doneBtn.addEventListener('click', function () {
          finishIfReady();
          if (typeof opts.onContinue === 'function') opts.onContinue();
        });
      }
    }

    if (opts.done || state.certifiedAt) {
      state.phase = 'cert';
      if (!state.certifiedAt) state.certifiedAt = new Date().toISOString();
      CERT.forEach(function (c) { state.cert[c.id] = true; });
      save();
    }
    paint();
  }

  global.SimulationFormatoE = {
    PARTS: PARTS,
    grade: grade,
    mount: mount,
    isCertified: isCertified,
    readState: readState
  };
})(typeof window !== 'undefined' ? window : globalThis);
