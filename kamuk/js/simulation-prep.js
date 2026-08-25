(function () {
  'use strict';

  var MODULES = [
    {
      id: 'desk',
      icon: 'headset',
      time: '10 min',
      title: 'The desk and your role',
      lead: 'Who you are on the floor and what the supervisor sees.',
      body: 'You work as a client service executive at Infinity Holdings, a private bank. Your queue shows cases, not people: one client can have three cases open, and each case is closed on its own. When you open a case you get the client 360 view — accounts, cards, transfers, fees, service history. Everything you write stays in the file, so another executive can take over without calling the client again. English is the language of the desk: notes, emails and calls are in English, even when the client is nervous or angry. Your supervisor does not listen to every call. They review what you left behind: the note, the email, the resolution and the next step. If it is not written, for the bank it did not happen.',
      dos: ['Read the 360 before you speak.', 'Work one case at a time to the end.', 'Write in English, short and factual.'],
      donts: ['Do not resolve a case you did not document.', 'Do not mix two cases in one note.', 'Do not promise what you cannot see in the system.'],
      drill: {
        q: 'A client calls about a frozen card. You see two open cases for her: the card and a wire hold. What do you do?',
        options: [
          { t: 'Handle the card case, document it, then open the wire case separately.', ok: true },
          { t: 'Close both cases with the same note to save time.', ok: false },
          { t: 'Ask her to call again later for the wire.', ok: false }
        ],
        why: 'One case, one trail. The supervisor must be able to audit each case on its own.'
      }
    },
    {
      id: 'protocol',
      icon: 'list-check',
      time: '15 min',
      title: 'Case protocol — five steps',
      lead: 'The same sequence for every case, from a fee complaint to suspected fraud.',
      body: '1) Own the impact. Name what happened to the client before you explain anything: "Your card was declined at the airport." 2) Ask one open question and one closed question. Open gives you the story, closed gives you the fact you need: "What happened when you tried again?" / "Was the amount 4,200 dollars?" 3) Check the evidence in the 360 — dates, amounts, geography, previous cases. Never argue from memory. 4) Take one safe action or escalate. Safe means reversible and inside your authority. 5) Document: internal note, resolution, and a timed next step ("compliance review within 24 hours"). A case without a next step is an abandoned client.',
      dos: ['Say the impact first, in one sentence.', 'Confirm one hard fact before acting.', 'Close with a next step that has a time.'],
      donts: ['Do not start with policy or apologies in a loop.', 'Do not act on a story you did not verify.', 'Do not leave the case with "we will contact you".'],
      drill: {
        q: 'Which opening is correct for a client whose transfer was held?',
        options: [
          { t: '"Your transfer of 18,000 dollars is on hold and has not reached the beneficiary. Let me tell you what I see."', ok: true },
          { t: '"Our policy requires compliance review for international transfers."', ok: false },
          { t: '"I am very sorry, I really apologize for the inconvenience, sorry again."', ok: false }
        ],
        why: 'Own the impact in client terms first. Policy and apology come after the client knows where the money is.'
      }
    },
    {
      id: 'channels',
      icon: 'messages',
      time: '15 min',
      title: 'Note, email or call',
      lead: 'Three channels, three purposes. Choosing wrong costs you the case.',
      body: 'The internal note is for the bank: facts, what you verified, what you did and why. Nobody outside reads it, so it must be honest and complete. The email is a written commitment to the client: only what is already true or already approved, with the next step and the timeframe. Never write "approved", "refunded" or "cleared" in an email if the system does not show it yet. The call is where tone and discovery happen: you hear doubt, pressure or inconsistency that no screen shows. In sensitive cases — money laundering flags, suspected fraud, internal review — you keep the internal reason internal. You confirm the account status and the next step, and you do not tell the client what the bank is investigating or how.',
      dos: ['Note = facts and reasoning.', 'Email = commitment plus timeframe.', 'Call = discovery under pressure.'],
      donts: ['Do not tip a client about an AML or fraud review.', 'Do not put a promise in an email before the system shows it.', 'Do not use the note to vent about the client.'],
      drill: {
        q: 'Compliance flagged a client for possible structuring. He asks on the call why his deposits are under review.',
        options: [
          { t: 'Confirm the account is under standard review, give the timeframe, and log the real reason in the internal note.', ok: true },
          { t: 'Explain that his deposit pattern triggered a structuring alert.', ok: false },
          { t: 'Tell him you have no idea and transfer the call.', ok: false }
        ],
        why: 'Transparency toward the bank, discretion toward the client. Tipping off is a regulatory breach.'
      }
    },
    {
      id: 'limits',
      icon: 'shield-check',
      time: '15 min',
      title: 'Judgment and limits',
      lead: 'What you can decide alone, what needs justification, what you never touch.',
      body: 'Green — always safe: write the note, escalate to the right team, set a timed next step, explain status, request documents. Amber — allowed with written justification: freeze a card, hold a transfer, suspend a service, waive a fee inside your limit. You must say in the note what evidence justified it, because a freeze also hurts a legitimate client. Red — never on your own: close a client account, release funds flagged by compliance, confirm an approval that was not granted, contact a client about an active investigation, share another client\'s data. Doing nothing is also a decision, and it is usually the worst one: an unattended fraud case costs more than an escalation that turns out unnecessary.',
      dos: ['Escalate early when the risk is not yours to carry.', 'Justify every amber action in the note.', 'Prefer a reversible action over a perfect one.'],
      donts: ['Do not release compliance-held funds.', 'Do not confirm approvals you did not see.', 'Do not wait for the client to insist before acting.'],
      drill: {
        q: 'Card transactions appear in two countries within eleven minutes. The client is not reachable.',
        options: [
          { t: 'Freeze the card, note the geographic evidence, escalate to fraud with a 24-hour next step.', ok: true },
          { t: 'Wait until the client answers before touching the card.', ok: false },
          { t: 'Close the account to stop the loss.', ok: false }
        ],
        why: 'Freeze is amber and reversible; closing the account is red. Waiting lets the loss grow.'
      }
    }
  ];

  var TOPICS = [
    {
      id: 'chargeback',
      icon: 'credit-card-off',
      title: 'Card dispute and chargeback',
      lead: 'The five questions every disputing client asks, with our numbers.',
      what: 'A dispute is the client telling us a charge is wrong. A chargeback is the formal reversal we file with the card network (Visa / Mastercard) to pull the money back from the merchant. The client never files it — we do, on their behalf. A dispute becomes a chargeback only when the merchant refuses or fails to answer.',
      why: [
        'Unauthorized use: card data stolen, card cloned, card lost.',
        'Duplicate or wrong amount: charged twice, tip altered, currency converted at the wrong rate.',
        'Service or goods never delivered: hotel never provided, flight cancelled, order never shipped.',
        'Cancelled subscription still charging.',
        'Merchant agreed to refund and never processed it.'
      ],
      timeline: [
        'Day 0: we log the dispute and give the client a case number, same call.',
        'Within 2 business days: provisional credit if the reason is fraud or unauthorized use, and the amount is under 25,000 USD.',
        'Day 2 to 45: the merchant has up to 45 days to respond with evidence.',
        'Up to 90 days total: final network decision. Most cases close in 30 to 45 days.',
        'Reporting limit: the client must report within 60 days of the statement date, or we lose the right to file.'
      ],
      client: [
        'Send the receipt, the order confirmation, or the cancellation email.',
        'Show one written attempt to solve it with the merchant, for non-fraud disputes.',
        'Cancel the subscription directly with the merchant — a chargeback does not cancel it.',
        'Keep the case number for any follow-up.'
      ],
      contact: 'We call the client only if documents are missing or the decision arrives — we commit to that call within 2 business days of any change. For routine status the client calls us or checks the app. Never say "wait for our call" without a date.',
      usable: 'Fraud or unauthorized: the card is blocked immediately and reissued in 3 to 5 business days, with a virtual card the same day for Obsidian and VIP clients. Merchant dispute (service not delivered, duplicate charge): the card stays fully active, because the card was not compromised.',
      script: '"I am filing a dispute for the 4,200 dollar charge. Your case number is CD-4471. Because this is unauthorized use, you will see a provisional credit within two business days, and the merchant has up to 45 days to respond. Your card is blocked now and the new one arrives in three to five business days."',
      drill: {
        q: 'The client asks: "How long until I get my money back?" The charge is unauthorized, 4,200 USD.',
        options: [
          { t: '"Provisional credit within two business days; the final decision can take up to 90 days while the merchant responds."', ok: true },
          { t: '"The refund will be in your account tomorrow."', ok: false },
          { t: '"There is no way to know, it depends on the merchant."', ok: false }
        ],
        why: 'Two numbers, both true: the provisional credit is fast, the final decision is not. Promising tomorrow creates a broken promise the supervisor will see.'
      }
    },
    {
      id: 'wire',
      icon: 'arrows-transfer-up',
      title: 'Held or delayed transfer',
      lead: 'The money is not lost. Say where it is and when it moves.',
      what: 'A hold means the payment left the client\'s balance but is parked in review before it reaches the beneficiary bank. Nothing is lost and nothing is spent. A delay is different: the wire was sent and is moving through correspondent banks.',
      why: [
        'Sanctions or name screening hit — a name resembles a listed party.',
        'Missing beneficiary detail: incomplete IBAN, no address, no payment purpose.',
        'First payment to a new beneficiary above 50,000 USD.',
        'Amount far outside the client\'s normal pattern.',
        'Sent after the 15:00 cut-off, or into a beneficiary-country holiday.'
      ],
      timeline: [
        'Standard review: released within 24 business hours.',
        'Sanctions name match: up to 3 business days for enhanced review.',
        'If we request a document, the clock restarts when the document arrives — tell the client that.',
        'Cut-off: instructions after 15:00 are valued the next business day.',
        'Correspondent delay after release: 1 to 3 business days depending on the country.'
      ],
      client: [
        'Send the invoice or contract behind the payment.',
        'Confirm the beneficiary name exactly as the beneficiary bank holds it.',
        'For urgent payroll or supplier deadlines, ask us about a partial release or an alternate authorized account.',
        'Warn the beneficiary that the payment is in review — but not why.'
      ],
      contact: 'We own the callback on holds: the desk calls the client with the outcome, or with a status update every 24 hours while it stays open. The client should not call the beneficiary bank; they cannot see our review.',
      usable: 'The rest of the account works normally — cards, incoming credits, other payments. Only this transfer is stopped. If several payments hit the same rule, say so plainly instead of releasing them one by one.',
      script: '"Your 180,000 dollar payroll transfer is on hold in compliance review, not lost — it is still your money. Standard review clears within 24 business hours. I am sending you the document request now, and I will call you tomorrow before noon with the outcome."',
      drill: {
        q: 'Payroll for 45 employees is held. The client asks if he should resend the payment from another bank.',
        options: [
          { t: 'Explain the funds are intact and in review, give the 24-business-hour window, and offer the document route or a partial release.', ok: true },
          { t: 'Tell him to resend it elsewhere so his staff gets paid.', ok: false },
          { t: 'Release the hold yourself since payroll is urgent.', ok: false }
        ],
        why: 'A duplicate payment creates a second problem. Releasing a compliance hold is red — never yours.'
      }
    },
    {
      id: 'frozen',
      icon: 'lock',
      title: 'Frozen or blocked account',
      lead: 'What a freeze actually stops, and what still works.',
      what: 'A freeze is a temporary block on movement. The balance stays untouched and keeps earning: it is not a confiscation and not a closure. Most freezes are protective, not punitive.',
      why: [
        'Fraud pattern detected on the account or a linked card.',
        'Compliance review of unusual activity.',
        'Expired or missing KYC documents — ID, proof of address, company registry.',
        'Legal order or court instruction.',
        'Sustained negative balance or unpaid facility.'
      ],
      timeline: [
        'Expired documents: released within 24 hours of receiving valid documents.',
        'Fraud review: 2 business days.',
        'Compliance review: 5 business days, and compliance owns the extension.',
        'Legal order: stays until the order is lifted — no bank timeframe exists, do not invent one.'
      ],
      client: [
        'Send the requested documents in one batch — partial batches restart nothing.',
        'Nominate a secondary authorized account for urgent payroll where policy allows it.',
        'Confirm which recent transactions were genuinely theirs.'
      ],
      contact: 'The desk calls with a status update every 24 hours until the freeze is resolved. For legal orders, the client is directed to their own counsel — we do not explain the order.',
      usable: 'Incoming credits usually still arrive; outgoing payments, cards and standing orders are stopped. Say that split out loud, because clients assume the money is gone. A frozen account still shows in the app, which is why clients panic.',
      script: '"Your account is frozen, which means the balance is safe but payments out are stopped. Incoming transfers still arrive. This is a document review: send your updated company registry today and I will have it released within 24 hours of receiving it."',
      drill: {
        q: 'A business owner with a frozen account asks whether his incoming client payments will bounce.',
        options: [
          { t: '"Incoming credits still arrive normally. What is stopped is payments out, cards and standing orders."', ok: true },
          { t: '"Everything is blocked until the review ends."', ok: false },
          { t: '"I am not sure how a freeze works, let me check with someone."', ok: false }
        ],
        why: 'Knowing exactly what a control stops is core product knowledge. Vagueness here reads as incompetence.'
      }
    },
    {
      id: 'aml',
      icon: 'file-search',
      title: 'Compliance review and AML',
      lead: 'The one case where being helpful means saying less.',
      what: 'An AML review examines whether money movement matches the client\'s declared activity. Two patterns matter to you: structuring — many deposits kept just under the reporting threshold — and layering, money moved fast through several jurisdictions. A SAR, suspicious activity report, is filed by compliance, never by you, and is never mentioned to the client.',
      why: [
        'Deposits repeatedly just below the 10,000 USD reporting threshold.',
        'Volume that does not match the declared business.',
        'Fast in-and-out movement across several countries.',
        'Unexplained third parties funding the account.',
        'Periodic scheduled review — the safe wording for any of the above.'
      ],
      timeline: [
        'Compliance responds internally within 5 business days.',
        'Source-of-funds documentation, when formally requested, is due from the client in 10 business days.',
        'You give the client the review window only — never the trigger, never the alert type.',
        'No promise of an outcome date: compliance owns the decision, not the desk.'
      ],
      client: [
        'Provide source-of-funds documents when compliance formally requests them.',
        'Keep operating normally within any limits set on the account.',
        'Update declared business activity if it genuinely changed.'
      ],
      contact: 'Compliance contacts the client directly when it needs documents. The desk does not chase, does not explain, and does not confirm that an investigation exists. You confirm status and the next step, nothing more.',
      usable: 'Depends on what compliance instructed: full access, reduced limits, or a freeze. Read the case instruction before you answer — guessing here is a regulatory problem, not a service problem.',
      script: '"Your account is under a standard periodic review. I cannot go into the internal detail, and I will not guess with you. What I can tell you: the review window is five business days, your balance is intact, and if any document is needed you will be contacted directly."',
      drill: {
        q: 'The client pushes: "Just tell me honestly, am I being investigated for money laundering?"',
        options: [
          { t: '"I cannot discuss internal review detail. What I can confirm is the review window and that your balance is intact."', ok: true },
          { t: '"Off the record, yes, your deposits triggered an alert."', ok: false },
          { t: '"No, nothing at all, do not worry."', ok: false }
        ],
        why: 'Confirming is tipping off; denying is a lie in the file. Hold the line with what you can confirm.'
      }
    },
    {
      id: 'fees',
      icon: 'receipt',
      title: 'Fees, charges and waivers',
      lead: 'Where you actually have authority, and how much.',
      what: 'Most fee complaints are not billing errors, they are surprises: the client saw a number they did not expect. Your job is to break the amount down first, then decide whether a waiver is justified.',
      why: [
        'Wire fee plus correspondent bank deduction — the beneficiary received less than the amount sent.',
        'FX spread on conversion, which is not shown as a separate line.',
        'Monthly maintenance charged because the minimum balance was missed.',
        'Late payment or over-limit charge on a card.',
        'Tier change: the client dropped out of the fee-free tier.'
      ],
      timeline: [
        'Breakdown of any charge: same call, from the fees tab.',
        'Waiver inside your limit — up to 500 USD: decided by you, same day.',
        'Above 500 USD: supervisor approval within 1 business day.',
        'Credit visible in the account: 2 business days after approval.'
      ],
      client: [
        'Ask for the itemized breakdown before disputing.',
        'Move to a tier or plan that fits the real transaction volume.',
        'Set a balance alert to avoid the maintenance charge.'
      ],
      contact: 'Always email the written confirmation: the exact amount, the reason, and the date it will appear. This is the case type where a vague email creates a second complaint.',
      usable: 'No impact on the account or cards. A disputed fee does not freeze anything.',
      script: '"The 340 dollars is two items: a 45 dollar wire fee and 295 in currency conversion. The conversion is correct, the wire fee I can waive today, and you will see the credit within two business days. I am emailing you the breakdown now."',
      drill: {
        q: 'The client demands a 1,800 USD fee reversal on the call.',
        options: [
          { t: 'Break down the charge, state that above 500 USD needs supervisor approval within 1 business day, and commit to the callback.', ok: true },
          { t: 'Approve it to close the case fast.', ok: false },
          { t: 'Refuse, since fees are never reversible.', ok: false }
        ],
        why: 'Know your limit and say it as a process, not as a refusal. Approving above your limit is red.'
      }
    },
    {
      id: 'credit',
      icon: 'building-bank',
      title: 'Credit, financing and VIP requests',
      lead: 'Requests you route, not requests you approve.',
      what: 'Financing and premium service requests both end the same way: you take a complete request, set a realistic expectation, and route it. The difference is the timeframe — credit is slow and formal, concierge is fast and operational.',
      why: [
        'Expansion, working capital, equipment, or refinancing at a better rate.',
        'Pressure from an internal manager to fast-track an approval.',
        'VIP travel, urgent board trips, priority service abroad.',
        'A card limit that will not survive the trip the client is about to take.'
      ],
      timeline: [
        'Credit: document list issued the same day; pre-assessment in 2 business days; formal decision in 10 business days.',
        'Concierge and travel: request confirmed within 4 hours; under 12 hours to departure it goes to the concierge desk immediately.',
        'Travel notice and temporary limit increase: applied same day so cards work abroad.'
      ],
      client: [
        'Credit: financial statements, tax returns, and 6 months of bank statements.',
        'Travel: exact dates, times, passport details, and written cost approval.',
        'Name one decision-maker we can reach — this is what actually saves days.'
      ],
      contact: 'The relationship manager calls with a credit decision; the desk never does. Concierge calls with the travel confirmation, and you send the written confirmation afterwards.',
      usable: 'Existing accounts, cards and lines keep working while a request is in process. A pending application changes nothing about today\'s access.',
      script: '"I am registering the financing request for three locations and sending the document list today. Pre-assessment takes two business days, the formal decision up to ten. I will not tell you it is approved, because that decision is not mine — what I will do is make sure nothing is missing from your file."',
      drill: {
        q: 'A senior manager pressures you to tell a client his 1.2M facility is "basically approved".',
        options: [
          { t: 'Decline to confirm, register the request, state the 10-business-day decision window, and note the pressure in the case.', ok: true },
          { t: 'Say it is basically approved, since the manager outranks you.', ok: false },
          { t: 'Say nothing to the client and hope the decision arrives.', ok: false }
        ],
        why: 'Confirming an approval you did not see is red, no matter who asked. The note protects you.'
      }
    }
  ];

  var SHEET = {
    id: 'tools',
    icon: 'tools',
    title: 'External tools cheat sheet',
    rows: [
      ['Credit report', 'Verify the client profile and exposure', 'Read it as evidence', 'It does not approve anything'],
      ['Invoice / reminder', 'Check status and resend', 'Use the real figures on screen', 'Do not create charges'],
      ['Transaction detail and geography', 'Prove or disprove fraud patterns', 'Quote dates, amounts, locations', 'Do not guess intent'],
      ['Export', 'Leave evidence for the supervisor', 'Attach to the case', 'Do not export another client\'s data'],
      ['Voice call', 'Live conversation with the client', 'Mute and hang up when needed', 'If voice fails, the desk still works by note and email']
    ]
  };

  var TOTAL = MODULES.length + TOPICS.length;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function storeKey(product) {
    return 'simulationPrep:' + product;
  }

  function readDone(product) {
    try {
      var raw = localStorage.getItem(storeKey(product));
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function writeDone(product, list) {
    try {
      localStorage.setItem(storeKey(product), JSON.stringify(list));
    } catch (error) { /* storage blocked — progress stays in memory only */ }
  }

  function styles(accent) {
    var existing = document.getElementById('simulation-prep-styles');
    if (existing) { existing.textContent = css(accent); return; }
    var style = document.createElement('style');
    style.id = 'simulation-prep-styles';
    style.textContent = css(accent);
    document.head.appendChild(style);
  }

  function css(accent) {
    return [
      '.sim-prep{max-width:760px;margin:0 auto 18px;}',
      '.sim-prep-head{background:#fff;border:1px solid #dce3ea;border-radius:16px;padding:18px 20px;box-shadow:0 8px 28px rgba(15,23,42,.07);margin-bottom:12px;}',
      '.sim-prep-head h2{margin:0 0 5px;font-size:19px;color:#102033;}',
      '.sim-prep-head p{margin:0;font-size:13px;color:#64748b;line-height:1.55;}',
      '.sim-prep-bar{height:7px;border-radius:99px;background:#eef2f7;margin-top:13px;overflow:hidden;}',
      '.sim-prep-bar span{display:block;height:100%;border-radius:99px;background:' + accent + ';transition:width .3s;}',
      '.sim-prep-count{margin-top:7px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:' + accent + ';}',
      '.sim-prep-group{margin:16px 0 8px;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#94a3b8;}',
      '.sim-mod{background:#fff;border:1px solid #dce3ea;border-radius:14px;margin-bottom:10px;overflow:hidden;}',
      '.sim-mod.done{border-color:' + accent + ';}',
      '.sim-mod-top{display:flex;gap:12px;align-items:center;padding:14px 16px;cursor:pointer;}',
      '.sim-mod-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#f1f5f9;color:' + accent + ';font-size:19px;flex:0 0 auto;}',
      '.sim-mod.done .sim-mod-ico{background:' + accent + ';color:#fff;}',
      '.sim-mod-title{font-size:14px;font-weight:800;color:#102033;}',
      '.sim-mod-lead{font-size:12px;color:#64748b;margin-top:2px;line-height:1.45;}',
      '.sim-mod-time{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;flex:0 0 auto;}',
      '.sim-mod-body{display:none;padding:0 16px 16px;}',
      '.sim-mod.open .sim-mod-body{display:block;}',
      '.sim-read{font-size:13px;line-height:1.68;color:#334155;border-left:3px solid #e2e8f0;padding-left:12px;margin-bottom:14px;}',
      '.sim-dd{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}',
      '.sim-dd div{border-radius:10px;padding:11px 12px;font-size:12px;line-height:1.55;}',
      '.sim-dd .yes{background:#f0fdf4;color:#166534;}',
      '.sim-dd .no{background:#fef2f2;color:#991b1b;}',
      '.sim-dd b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}',
      '.sim-dd ul{margin:0;padding-left:15px;}',
      '.sim-block{margin-bottom:13px;}',
      '.sim-block h5{margin:0 0 5px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:' + accent + ';}',
      '.sim-block p{margin:0;font-size:13px;line-height:1.62;color:#334155;}',
      '.sim-block ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.62;color:#334155;}',
      '.sim-block ul li{margin-bottom:3px;}',
      '.sim-block.time ul li{font-variant-numeric:tabular-nums;}',
      '.sim-script{background:#f5f3ff;border-left:4px solid ' + accent + ';border-radius:0 10px 10px 0;padding:12px 14px;margin-bottom:13px;}',
      '.sim-script h5{margin:0 0 5px;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:' + accent + ';}',
      '.sim-script p{margin:0;font-size:13px;line-height:1.65;color:#312e81;font-style:italic;}',
      '.sim-drill{background:#f8fafc;border-radius:12px;padding:13px 14px;}',
      '.sim-drill h4{margin:0 0 9px;font-size:13px;color:#102033;}',
      '.sim-opt{display:block;width:100%;text-align:left;border:1px solid #d8e0e8;background:#fff;border-radius:9px;padding:10px 12px;font:600 12.5px Inter,Arial,sans-serif;color:#334155;margin-bottom:7px;cursor:pointer;line-height:1.5;}',
      '.sim-opt:hover{border-color:' + accent + ';}',
      '.sim-opt.right{border-color:#15803d;background:#f0fdf4;color:#14532d;}',
      '.sim-opt.wrong{border-color:#b42318;background:#fef2f2;color:#7f1d1d;}',
      '.sim-why{font-size:12px;color:#475569;line-height:1.55;margin-top:6px;display:none;}',
      '.sim-why.show{display:block;}',
      '.sim-sheet table{width:100%;border-collapse:collapse;font-size:12px;}',
      '.sim-sheet th,.sim-sheet td{text-align:left;padding:8px 9px;border-bottom:1px solid #eef2f7;vertical-align:top;line-height:1.45;}',
      '.sim-sheet th{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;}',
      '.sim-sheet td:first-child{font-weight:800;color:#102033;}',
      '.sim-sheet-wrap{overflow-x:auto;}',
      '@media(max-width:620px){.sim-dd{grid-template-columns:1fr}.sim-sheet table{min-width:520px}}'
    ].join('');
  }

  function list(items) {
    return '<ul><li>' + items.map(esc).join('</li><li>') + '</li></ul>';
  }

  function drillHtml(drill) {
    return '<div class="sim-drill"><h4>' + esc(drill.q) + '</h4>'
      + drill.options.map(function (opt, index) {
        return '<button class="sim-opt" data-ok="' + (opt.ok ? '1' : '0') + '" data-index="' + index + '">' + esc(opt.t) + '</button>';
      }).join('')
      + '<div class="sim-why"><strong>Why:</strong> ' + esc(drill.why) + '</div></div>';
  }

  function cardShell(id, icon, title, lead, tag, done, inner) {
    return '<div class="sim-mod' + (done ? ' done' : '') + '" data-mod="' + id + '">'
      + '<div class="sim-mod-top" data-toggle="1">'
      + '<div class="sim-mod-ico"><i class="ti ti-' + (done ? 'check' : icon) + '"></i></div>'
      + '<div style="flex:1;min-width:0;"><div class="sim-mod-title">' + esc(title) + '</div>'
      + '<div class="sim-mod-lead">' + esc(lead) + '</div></div>'
      + '<div class="sim-mod-time">' + esc(tag) + '</div></div>'
      + '<div class="sim-mod-body">' + inner + '</div></div>';
  }

  function modHtml(mod, done) {
    var inner = '<div class="sim-read">' + esc(mod.body) + '</div>'
      + '<div class="sim-dd"><div class="yes"><b>Do</b>' + list(mod.dos) + '</div>'
      + '<div class="no"><b>Don\'t</b>' + list(mod.donts) + '</div></div>'
      + drillHtml(mod.drill);
    return cardShell(mod.id, mod.icon, mod.title, mod.lead, mod.time, done, inner);
  }

  function topicHtml(topic, done) {
    var inner = '<div class="sim-block"><h5>What it is</h5><p>' + esc(topic.what) + '</p></div>'
      + '<div class="sim-block"><h5>Why it happens</h5>' + list(topic.why) + '</div>'
      + '<div class="sim-block time"><h5>How long it takes</h5>' + list(topic.timeline) + '</div>'
      + '<div class="sim-block"><h5>What the client can do</h5>' + list(topic.client) + '</div>'
      + '<div class="sim-block"><h5>Who calls whom</h5><p>' + esc(topic.contact) + '</p></div>'
      + '<div class="sim-block"><h5>Can they keep using it</h5><p>' + esc(topic.usable) + '</p></div>'
      + '<div class="sim-script"><h5>Say it like this</h5><p>' + esc(topic.script) + '</p></div>'
      + drillHtml(topic.drill);
    return cardShell(topic.id, topic.icon, topic.title, topic.lead, '6 answers', done, inner);
  }

  function sheetHtml(sheet) {
    var inner = '<div class="sim-sheet-wrap"><table><thead><tr>'
      + '<th>Item</th><th>What the client sees</th><th>What you can do</th><th>Never</th>'
      + '</tr></thead><tbody>'
      + sheet.rows.map(function (row) {
        return '<tr>' + row.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
      }).join('')
      + '</tbody></table></div>';
    return '<div class="sim-mod sim-sheet" data-sheet="' + sheet.id + '">'
      + '<div class="sim-mod-top" data-toggle="1">'
      + '<div class="sim-mod-ico"><i class="ti ti-' + sheet.icon + '"></i></div>'
      + '<div style="flex:1;min-width:0;"><div class="sim-mod-title">' + esc(sheet.title) + '</div>'
      + '<div class="sim-mod-lead">Reference — keep it open while you work a case.</div></div>'
      + '<div class="sim-mod-time">Ref</div></div>'
      + '<div class="sim-mod-body">' + inner + '</div></div>';
  }

  function mount(root, config) {
    if (!root) return;
    config = config || {};
    var product = config.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = product === 'kamuk' ? '#2B7EC1' : '#5B21B6';
    styles(accent);

    var valid = MODULES.concat(TOPICS).map(function (item) { return item.id; });
    var done = readDone(product).filter(function (id) { return valid.indexOf(id) >= 0; });

    root.innerHTML = '<div class="sim-prep">'
      + '<div class="sim-prep-head"><h2>Before you take cases</h2>'
      + '<p>How the desk works, then the six case types with the answers clients actually demand: what it is, why it happened, how long it takes, what they can do, who calls whom, and whether they can keep using the product. Every timeframe here is Infinity Holdings policy — use these numbers, never invent your own.</p>'
      + '<div class="sim-prep-bar"><span style="width:' + Math.round(done.length / TOTAL * 100) + '%"></span></div>'
      + '<div class="sim-prep-count">Prep ' + done.length + '/' + TOTAL + '</div></div>'
      + '<div class="sim-prep-group">How the desk works</div>'
      + MODULES.map(function (mod) { return modHtml(mod, done.indexOf(mod.id) >= 0); }).join('')
      + '<div class="sim-prep-group">Case knowledge — answer without hesitating</div>'
      + TOPICS.map(function (topic) { return topicHtml(topic, done.indexOf(topic.id) >= 0); }).join('')
      + '<div class="sim-prep-group">Reference</div>'
      + sheetHtml(SHEET)
      + '</div>';

    function refresh() {
      root.querySelector('.sim-prep-bar span').style.width = Math.round(done.length / TOTAL * 100) + '%';
      root.querySelector('.sim-prep-count').textContent = 'Prep ' + done.length + '/' + TOTAL;
    }

    root.addEventListener('click', function (event) {
      var toggle = event.target.closest('.sim-mod-top');
      if (toggle) {
        toggle.parentElement.classList.toggle('open');
        return;
      }
      var option = event.target.closest('.sim-opt');
      if (!option) return;
      var card = option.closest('.sim-mod');
      var drill = option.closest('.sim-drill');
      drill.querySelectorAll('.sim-opt').forEach(function (btn) { btn.classList.remove('right', 'wrong'); });
      option.classList.add(option.dataset.ok === '1' ? 'right' : 'wrong');
      drill.querySelector('.sim-why').classList.add('show');
      if (option.dataset.ok !== '1') return;
      var id = card.dataset.mod;
      if (id && done.indexOf(id) < 0) {
        done.push(id);
        writeDone(product, done);
        card.classList.add('done');
        card.querySelector('.sim-mod-ico i').className = 'ti ti-check';
        refresh();
      }
    });
  }

  window.SimulationPrep = { mount: mount, modules: MODULES, topics: TOPICS };
})();
