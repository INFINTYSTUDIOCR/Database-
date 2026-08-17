(function () {
  'use strict';

  var WEEK = {
    number: 1,
    industry: 'Banking',
    focus: 'Cards, disputes and chargebacks',
    meta: 'Monday 75 min · Tuesday 75 min · 10 cases at home',
    goal: 'By Tuesday you can take a card dispute in English, ask two useful questions, explain the timeline with real numbers, handle one objection without over-promising, and close with a timed next step.'
  };

  var LANGUAGE = {
    linkers: [
      ['because', 'Reason. Followed by a full clause.', '"The charge was blocked because the card was used in two countries within minutes."', 'Not "because of the card was used". Use "because of" only before a noun: "because of the hold".'],
      ['therefore', 'Consequence. Formal, used after a comma or full stop.', '"The merchant did not respond; therefore, we filed a chargeback."', 'Do not use it as "so" in the middle of a clause without punctuation.'],
      ['however', 'Contrast. Starts a new sentence, then a comma.', '"I cannot refund it today. However, I can file the dispute now."', 'Never "but however". One contrast marker per sentence.'],
      ['although', 'Contrast inside one sentence. Needs a full clause.', '"Although the charge is correct, I can waive the wire fee."', 'Not "Although..., but...". Drop the "but".'],
      ['in addition', 'Adding a second point. Formal.', '"In addition, your new card arrives within five business days."', 'Not "in addition of". Use "in addition to" before a noun.']
    ],
    phrasals: [
      ['look into', 'Investigate. Inseparable — always "look into it".', '"Let me look into that charge while we are on the call."'],
      ['follow up', 'Check again later. "Follow up with someone" / "on something".', '"I will follow up with you by 3 p.m. tomorrow."'],
      ['sort out', 'Resolve a problem. Separable — "sort it out".', '"We will sort this out before your trip on Friday."']
    ],
    family: {
      root: 'authorize',
      forms: [
        ['authorize', 'verb', '"Only compliance can authorize the release."'],
        ['authorization', 'noun', '"I need authorization from my supervisor for that amount."'],
        ['authorized', 'adjective — approved', '"The payment was authorized at 14:02."'],
        ['unauthorized', 'adjective — not approved', '"You are reporting an unauthorized charge of 4,200 dollars."']
      ],
      note: 'Same pattern this week: resolve → resolution → unresolved · comply → compliance → non-compliant.'
    },
    chunks: [
      '"Let me look into that for you right now."',
      '"Just to confirm, was the amount 4,200 dollars?"',
      '"What I can do today is file the dispute and block the card."',
      '"What I cannot do is promise the outcome. However, what I can promise is the timeline."',
      '"I will follow up with you by 3 p.m. tomorrow with the result."'
    ]
  };

  var MONDAY = [
    ['0–10', 'Diagnostic warm-up', 'Each student answers one client line out loud in English, cold. No preparation. You are only listening for who freezes and who over-apologizes. Note names — that is your baseline.'],
    ['10–25', 'Language toolkit', 'Five linkers, three phrasal verbs, the authorize family. Students build one sentence each with a linker applied to a card problem, not an abstract example.'],
    ['25–40', 'Playbook — cards and chargebacks', 'What a chargeback is, why it happens, the timeline, what the client can do, who calls whom, and whether the card still works. Students write the numbers down: 2 business days, 45 days, 90 days, 60-day reporting limit.'],
    ['40–60', 'Guided case', 'Trainer takes case 1 in front of the class and thinks out loud: impact, two questions, evidence, action, closing. Class dictates the wording. Trainer writes the weak version and the strong version side by side.'],
    ['60–72', 'Mini debate', 'Same case, two resolutions on the board. Half the room defends provisional credit now, half defends waiting for evidence. Each speaker must open with a linker.'],
    ['72–75', 'Home assignment', 'Assign the 10 cases. Minimum: all 10 before Tuesday of next week, at least 3 before tomorrow.']
  ];

  var TUESDAY = [
    ['0–10', 'Error clinic', 'Five real errors collected from Monday, written on the board without names. Students correct them out loud. At least two must be linker or phrasal verb errors.'],
    ['10–45', 'Case floor', 'Trios rotate every 10 minutes: client, executive, QA observer. The observer scores with the rubric and must justify one score using evidence from the conversation. Cases 2, 4 and 5.'],
    ['45–60', 'Pressure round', 'Same case, but the trainer injects a twist mid-conversation: "the client rejects your offer", "compliance will not release it", "he reported 90 days late". The executive must reformulate on the spot.'],
    ['60–72', 'Team defence', 'Two teams receive the same case with opposite instructions and defend their resolution. The class votes using the rubric, not opinion.'],
    ['72–75', 'KPI feedback', 'Name the two lowest KPIs of the session and the specific home cases that fix them.']
  ];

  var CASES = [
    {
      id: 'w1c1',
      title: 'Duplicate charge at a restaurant',
      mood: 'Annoyed but reasonable',
      brief: 'Two identical charges of 180 dollars, same restaurant, same night, four minutes apart. The client says he paid once.',
      line: '"I was charged twice for the same dinner. I want one of them removed today."',
      must: ['Own the impact in one sentence.', 'One open question, one closed question.', 'Say whether the card stays active and why.', 'Close with a timed next step.'],
      language: ['because', 'however', 'look into'],
      model: '"You were charged 180 dollars twice for the same dinner, and I can see both charges. Let me look into that now. What happened at the moment of payment — did the terminal fail on the first attempt? And just to confirm, was the second charge also 180 dollars? This is a merchant dispute, not fraud, so your card stays fully active. I am filing the dispute today; the merchant has up to 45 days to respond, however most duplicate cases close much sooner. I will follow up with you by Friday."',
      check: ['Did you say the amount out loud?', 'Did you explain why the card is NOT blocked?', 'Did you avoid promising a refund date?']
    },
    {
      id: 'w1c2',
      title: 'Card declined at a Miami hotel',
      mood: 'Humiliated and angry',
      brief: 'The card was declined at check-in. The client is standing at the front desk. The decline was a geographic fraud rule, no travel notice on file.',
      line: '"I am standing here like a beggar in front of the reception. Fix it now."',
      must: ['Acknowledge the humiliation, not just the decline.', 'Take one immediate action.', 'Explain the rule without blaming the client.', 'Confirm what he can use in the next five minutes.'],
      language: ['because', 'therefore', 'sort out'],
      model: '"Your card was declined at check-in and you are standing at the desk right now — that is the first thing I am going to sort out. The decline happened because there was no travel notice on your file and the system saw a foreign transaction. I am registering the travel notice now and raising the limit for your trip. Try the card again in two minutes; therefore you should be able to check in without calling the hotel manager. I will stay on the line until it goes through."',
      check: ['Did you stay on the line instead of ending the call?', 'Did you avoid saying "you should have told us"?', 'Did you give an action he can test immediately?']
    },
    {
      id: 'w1c3',
      title: 'Subscription still charging after cancellation',
      mood: 'Tired, has explained this before',
      brief: 'A 49-dollar monthly charge continued for four months after the client cancelled with the merchant. He has the cancellation email.',
      line: '"I cancelled in April. They keep charging me. Block them."',
      must: ['Separate what the bank can do from what only the merchant can do.', 'Request the evidence you need.', 'Set expectations for four charges, not one.'],
      language: ['although', 'in addition', 'follow up'],
      model: '"You cancelled in April and you have been charged four times since — 196 dollars in total. Although I can dispute all four charges, a chargeback does not cancel the subscription itself, so we also need to block future payments to that merchant. Send me the cancellation email today. In addition, I will place a merchant block so the fifth charge never arrives. I will follow up on Monday with the status of all four disputes."',
      check: ['Did you total the four charges instead of discussing one?', 'Did you explain that the chargeback does not cancel the service?', 'Did you ask for the evidence explicitly?']
    },
    {
      id: 'w1c4',
      title: 'Cloned card — six overnight withdrawals',
      mood: 'Frightened',
      brief: 'Six ATM withdrawals overnight totalling 3,000 dollars in a city where the client has never been. The card is in his wallet.',
      line: '"I have the card in my hand. How is this possible? Is my money gone?"',
      must: ['Calm without minimizing.', 'Block first, explain second.', 'Give the provisional credit number and the reissue time.', 'Do not speculate about how the card was cloned.'],
      language: ['because', 'however', 'look into'],
      model: '"Your card is in your hand and there are six withdrawals from another city, so this is unauthorized use and I am blocking the card right now. Your money is not gone. Because this is fraud and the total is under 25,000 dollars, you will see a provisional credit within two business days while we investigate. Your replacement card arrives in three to five business days, however I can issue a virtual card today so you are not left without a payment method. I will look into how the data was exposed, and I will not guess with you before I know."',
      check: ['Did you block before explaining?', 'Did you say "your money is not gone"?', 'Did you refuse to speculate about the cause?']
    },
    {
      id: 'w1c5',
      title: 'Hotel never provided the room',
      mood: 'Firm, well prepared',
      brief: 'The client paid 1,200 dollars for a hotel that had no record of the booking. The hotel refuses a refund and says he must claim with the bank.',
      line: '"The hotel says it is your problem now. So solve it."',
      must: ['Confirm the dispute reason correctly (service not rendered).', 'Ask for one specific piece of evidence.', 'Explain why there is no provisional credit here.', 'Keep ownership without accepting blame.'],
      language: ['although', 'therefore', 'sort out'],
      model: '"You paid 1,200 dollars for a room you never received, and the hotel is refusing to refund. Although this is not fraud, it is a valid dispute: service not rendered. Therefore the timeline is different — there is no provisional credit for this reason, and the merchant has up to 45 days to answer with evidence. Send me the booking confirmation and one written message where the hotel refuses. With those two documents I can sort this out with a strong file instead of a weak one."',
      check: ['Did you name the dispute reason?', 'Did you explain the absence of provisional credit instead of hiding it?', 'Did you ask for exactly two documents?']
    },
    {
      id: 'w1c6',
      title: 'The client demands the money today',
      mood: 'Pressuring, repeats the demand',
      brief: 'Valid fraud dispute already filed. The client insists on having the money back today and says another bank does it instantly.',
      line: '"Another bank refunds in 24 hours. Are you telling me you are worse than them?"',
      must: ['Hold the real timeline without arguing about the other bank.', 'Offer what you actually can.', 'Use one contrast structure to reframe.', 'Do not invent an exception.'],
      language: ['however', 'in addition', 'follow up'],
      model: '"I understand you want it today, and I am not going to invent a date to keep you calm. The provisional credit is two business days, not 24 hours. However, the dispute is already filed and your card is already blocked, so nothing else can be charged. In addition, I can send you the written confirmation with the case number in the next ten minutes so you have it in hand. I will follow up personally the moment the credit posts."',
      check: ['Did you refuse to over-promise?', 'Did you avoid criticizing the other bank?', 'Did you give him something concrete right now?']
    },
    {
      id: 'w1c7',
      title: 'Reported 90 days too late',
      mood: 'Embarrassed, then defensive',
      brief: 'The client reports an unauthorized charge from a statement 90 days old. The reporting window is 60 days.',
      line: '"So you are telling me you will do nothing? It is still theft."',
      must: ['Say no clearly, once.', 'Explain the rule without hiding behind policy language.', 'Offer the alternative that still exists.', 'Protect the relationship.'],
      language: ['because', 'although', 'however'],
      model: '"I cannot file a chargeback for that charge, because the network limit is 60 days from the statement date and this one is 90. I am not going to pretend otherwise. Although the dispute route is closed, there are two things I can still do: report the merchant internally, and review your last three statements with you now so nothing else is sitting there unnoticed. However, if any charge in the last 60 days is also unfamiliar, we file that one today."',
      check: ['Did you say no once, not four times?', 'Did you avoid "it is policy" as your whole answer?', 'Did you convert the dead end into an action?']
    },
    {
      id: 'w1c8',
      title: 'The client wants a guarantee you will win',
      mood: 'Testing you',
      brief: 'Dispute filed correctly. The client wants you to promise the chargeback will be decided in his favour before he hangs up.',
      line: '"Just tell me I am going to win. Promise me."',
      must: ['Refuse the guarantee without sounding cold.', 'Replace it with what is certain.', 'Name who decides.', 'Close with a next step.'],
      language: ['however', 'therefore', 'follow up'],
      model: '"I will not promise you the outcome, because the decision belongs to the card network, not to me — and a promise from me would be worthless to you. However, three things are certain: the dispute is filed within the deadline, your evidence is attached, and your provisional credit posts within two business days. Therefore your position is as strong as it can be at this stage. I will follow up the day the network responds, whichever way it goes."',
      check: ['Did you decline the promise directly?', 'Did you name who owns the decision?', 'Did you list what IS certain?']
    },
    {
      id: 'w1c9',
      title: 'Merchant already refunded — double refund risk',
      mood: 'Casual, unaware of the problem',
      brief: 'The merchant refunded 620 dollars yesterday. The client also wants the dispute to continue, which would credit him twice.',
      line: '"They paid me back, but keep the claim open anyway, just in case."',
      must: ['Explain the double credit problem honestly.', 'Verify the refund in the system before agreeing.', 'Withdraw the dispute correctly.', 'Leave the client protected if the refund reverses.'],
      language: ['because', 'although', 'in addition'],
      model: '"I can see the 620 dollar refund posted yesterday, so the money is back with you. I am going to withdraw the dispute, because if both the refund and the chargeback go through you receive the amount twice and the bank later reverses one of them — that becomes a new problem for you. Although the case is closing, I am noting the merchant history in your file. In addition, if that refund is reversed for any reason, call me and we reopen the dispute the same day."',
      check: ['Did you verify the refund before acting?', 'Did you explain why keeping it open hurts him?', 'Did you leave a reopening path?']
    },
    {
      id: 'w1c10',
      title: 'New card needed before a flight in 12 hours',
      mood: 'Rushed, sceptical',
      brief: 'The card was blocked for fraud. The client flies in 12 hours and needs a working payment method abroad.',
      line: '"My flight is at six in the morning. A card in five days is useless to me."',
      must: ['Solve the 12 hours, not the five days.', 'Give the concrete alternative and its limits.', 'Register what makes it work abroad.', 'Confirm the plan back to him in one closing sentence.'],
      language: ['therefore', 'however', 'sort out'],
      model: '"Your flight is in twelve hours, therefore a card in five days does not solve your problem — let us sort out today instead. I am issuing a virtual card now that works for hotels, airlines and any online payment. It will not work at an ATM, however I am raising your withdrawal limit on the secondary card so you have cash access. I am registering your travel notice for the full trip. To confirm: virtual card active in the next hour, travel notice registered, physical card waiting for you when you return."',
      check: ['Did you address the 12 hours first?', 'Did you state the limitation of the virtual card?', 'Did you close by repeating the whole plan?']
    }
  ];

  var RUBRIC = {
    rows: [
      ['English clarity', '20%', 'Freezes, translates from Spanish, client must ask again.', 'Understandable with effort; some restarts.', 'Fluent enough that the client never asks for a repeat.'],
      ['Discovery', '15%', 'No questions, or only yes/no questions.', 'Asks questions but not the one that mattered.', 'One open and one closed question that change the outcome.'],
      ['Diagnosis', '15%', 'Guesses; ignores the evidence on screen.', 'Uses some evidence, misses the key figure.', 'Names the cause using dates, amounts or geography.'],
      ['Negotiation and objections', '20%', 'Gives in immediately or becomes defensive.', 'Holds once, then concedes under pressure.', 'Holds the limit, offers a real alternative, keeps the relationship.'],
      ['Reasoning with evidence', '15%', 'Opinion only; no numbers.', 'Some justification, no timeline.', 'Every claim supported by a figure or a policy number.'],
      ['Language control', '15%', 'No linkers; repeats "and" and "but".', 'Uses linkers mechanically.', 'Linkers, phrasal verbs and word families used naturally in the flow.']
    ],
    note: 'Score each case 1 (Focus) / 3 (Developing) / 5 (Strong). The two lowest KPIs of the week decide which home cases the student repeats.'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function answerKey(product, id) {
    return 'simulationTraining:' + product + ':' + id;
  }

  function readAnswer(product, id) {
    try { return localStorage.getItem(answerKey(product, id)) || ''; } catch (error) { return ''; }
  }

  function writeAnswer(product, id, value) {
    try { localStorage.setItem(answerKey(product, id), value); } catch (error) { /* storage blocked */ }
  }

  function styles(accent) {
    var existing = document.getElementById('simulation-training-styles');
    if (existing) { existing.textContent = css(accent); return; }
    var style = document.createElement('style');
    style.id = 'simulation-training-styles';
    style.textContent = css(accent);
    document.head.appendChild(style);
  }

  function css(accent) {
    return [
      '.tr{max-width:760px;margin:0 auto 18px;}',
      '.tr-head{background:linear-gradient(135deg,' + accent + ',#0f172a);border-radius:16px;padding:20px 22px;color:#fff;margin-bottom:12px;box-shadow:0 10px 32px rgba(15,23,42,.16);}',
      '.tr-head small{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75;}',
      '.tr-head h2{margin:5px 0 6px;font-size:21px;}',
      '.tr-head p{margin:0;font-size:13px;line-height:1.6;opacity:.9;}',
      '.tr-head .tr-meta{margin-top:12px;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;opacity:.8;}',
      '.tr-sec{background:#fff;border:1px solid #dce3ea;border-radius:14px;margin-bottom:10px;overflow:hidden;}',
      '.tr-sec-top{display:flex;gap:12px;align-items:center;padding:14px 16px;cursor:pointer;}',
      '.tr-ico{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#f1f5f9;color:' + accent + ';font-size:19px;flex:0 0 auto;}',
      '.tr-sec-title{font-size:14px;font-weight:800;color:#102033;}',
      '.tr-sec-lead{font-size:12px;color:#64748b;margin-top:2px;line-height:1.45;}',
      '.tr-tag{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;flex:0 0 auto;}',
      '.tr-body{display:none;padding:0 16px 16px;}',
      '.tr-sec.open .tr-body{display:block;}',
      '.tr-sub{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:' + accent + ';margin:14px 0 6px;}',
      '.tr-sub:first-child{margin-top:0;}',
      '.tr-table{width:100%;border-collapse:collapse;font-size:12px;}',
      '.tr-table th,.tr-table td{text-align:left;padding:8px 9px;border-bottom:1px solid #eef2f7;vertical-align:top;line-height:1.5;}',
      '.tr-table th{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;}',
      '.tr-table td:first-child{font-weight:800;color:#102033;white-space:nowrap;}',
      '.tr-wrap{overflow-x:auto;}',
      '.tr-ex{color:#312e81;font-style:italic;}',
      '.tr-trap{color:#991b1b;}',
      '.tr-chunks{margin:0;padding-left:16px;font-size:13px;line-height:1.7;color:#312e81;font-style:italic;}',
      '.tr-plan{display:grid;gap:8px;}',
      '.tr-plan-row{display:grid;grid-template-columns:58px 1fr;gap:11px;align-items:start;}',
      '.tr-min{font:800 11px ui-monospace,monospace;color:' + accent + ';background:#f1f5f9;border-radius:7px;padding:6px 4px;text-align:center;}',
      '.tr-plan-row h6{margin:0 0 3px;font-size:13px;color:#102033;}',
      '.tr-plan-row p{margin:0;font-size:12.5px;line-height:1.6;color:#475569;}',
      '.tr-case{border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px;overflow:hidden;}',
      '.tr-case-top{display:flex;gap:10px;align-items:center;padding:11px 13px;cursor:pointer;background:#f8fafc;}',
      '.tr-num{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:' + accent + ';color:#fff;font:800 12px Inter,Arial,sans-serif;flex:0 0 auto;}',
      '.tr-case.answered .tr-num{background:#15803d;}',
      '.tr-case-title{font-size:13px;font-weight:800;color:#102033;}',
      '.tr-case-mood{font-size:11px;color:#64748b;margin-top:1px;}',
      '.tr-case-body{display:none;padding:12px 13px;}',
      '.tr-case.open .tr-case-body{display:block;}',
      '.tr-line{background:#f5f3ff;border-left:4px solid ' + accent + ';border-radius:0 9px 9px 0;padding:10px 12px;font-size:13px;font-style:italic;color:#312e81;line-height:1.6;margin-bottom:11px;}',
      '.tr-must{margin:0;padding-left:16px;font-size:12.5px;line-height:1.6;color:#334155;}',
      '.tr-chips{display:flex;flex-wrap:wrap;gap:6px;}',
      '.tr-chip{font:800 11px Inter,Arial,sans-serif;background:#eef2ff;color:#3730a3;border-radius:99px;padding:5px 10px;}',
      '.tr-answer{width:100%;box-sizing:border-box;min-height:92px;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:500 13px Inter,Arial,sans-serif;color:#0f172a;line-height:1.6;resize:vertical;}',
      '.tr-answer:focus{outline:2px solid rgba(91,33,182,.18);border-color:' + accent + ';}',
      '.tr-model-btn{margin-top:9px;border:1px solid ' + accent + ';background:#fff;color:' + accent + ';border-radius:9px;padding:8px 13px;font:800 12px Inter,Arial,sans-serif;cursor:pointer;}',
      '.tr-model{display:none;margin-top:10px;background:#f0fdf4;border-radius:10px;padding:12px 13px;}',
      '.tr-model.show{display:block;}',
      '.tr-model p{margin:0 0 9px;font-size:13px;line-height:1.65;color:#14532d;font-style:italic;}',
      '.tr-model ul{margin:0;padding-left:16px;font-size:12px;line-height:1.6;color:#166534;}',
      '.tr-note{margin-top:11px;font-size:12px;line-height:1.6;color:#475569;background:#f8fafc;border-radius:9px;padding:10px 12px;}',
      '@media(max-width:620px){.tr-table{min-width:520px}.tr-plan-row{grid-template-columns:50px 1fr}}'
    ].join('');
  }

  function secShell(id, icon, title, lead, tag, inner) {
    return '<div class="tr-sec" data-sec="' + id + '">'
      + '<div class="tr-sec-top"><div class="tr-ico"><i class="ti ti-' + icon + '"></i></div>'
      + '<div style="flex:1;min-width:0;"><div class="tr-sec-title">' + esc(title) + '</div>'
      + '<div class="tr-sec-lead">' + esc(lead) + '</div></div>'
      + '<div class="tr-tag">' + esc(tag) + '</div></div>'
      + '<div class="tr-body">' + inner + '</div></div>';
  }

  function languageSection() {
    var inner = '<div class="tr-sub">Linkers — use one in every answer</div>'
      + '<div class="tr-wrap"><table class="tr-table"><thead><tr><th>Word</th><th>Use</th><th>Example</th><th>Trap</th></tr></thead><tbody>'
      + LANGUAGE.linkers.map(function (row) {
        return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td>'
          + '<td class="tr-ex">' + esc(row[2]) + '</td><td class="tr-trap">' + esc(row[3]) + '</td></tr>';
      }).join('')
      + '</tbody></table></div>'
      + '<div class="tr-sub">Phrasal verbs</div>'
      + '<div class="tr-wrap"><table class="tr-table"><thead><tr><th>Verb</th><th>Meaning and grammar</th><th>Example</th></tr></thead><tbody>'
      + LANGUAGE.phrasals.map(function (row) {
        return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td class="tr-ex">' + esc(row[2]) + '</td></tr>';
      }).join('')
      + '</tbody></table></div>'
      + '<div class="tr-sub">Word family — ' + esc(LANGUAGE.family.root) + '</div>'
      + '<div class="tr-wrap"><table class="tr-table"><thead><tr><th>Form</th><th>Type</th><th>Example</th></tr></thead><tbody>'
      + LANGUAGE.family.forms.map(function (row) {
        return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td class="tr-ex">' + esc(row[2]) + '</td></tr>';
      }).join('')
      + '</tbody></table></div>'
      + '<div class="tr-note">' + esc(LANGUAGE.family.note) + '</div>'
      + '<div class="tr-sub">Functional chunks — memorize these five</div>'
      + '<ul class="tr-chunks"><li>' + LANGUAGE.chunks.map(esc).join('</li><li>') + '</li></ul>';
    return secShell('language', 'abc', 'Language toolkit', 'Five linkers, three phrasal verbs, one word family, five chunks.', '15 min', inner);
  }

  function planSection(id, icon, title, lead, rows) {
    var inner = '<div class="tr-plan">' + rows.map(function (row) {
      return '<div class="tr-plan-row"><div class="tr-min">' + esc(row[0]) + '</div>'
        + '<div><h6>' + esc(row[1]) + '</h6><p>' + esc(row[2]) + '</p></div></div>';
    }).join('') + '</div>';
    return secShell(id, icon, title, lead, '75 min', inner);
  }

  function casesSection(product) {
    var inner = '<div class="tr-note">Each case takes 6 to 8 minutes: read it, write your answer in English, then compare with the model. Minimum 10 per week. Your answers stay on this device.</div>'
      + CASES.map(function (kase, index) {
        var saved = readAnswer(product, kase.id);
        return '<div class="tr-case' + (saved ? ' answered' : '') + '" data-case="' + kase.id + '">'
          + '<div class="tr-case-top"><div class="tr-num">' + (index + 1) + '</div>'
          + '<div style="flex:1;min-width:0;"><div class="tr-case-title">' + esc(kase.title) + '</div>'
          + '<div class="tr-case-mood">' + esc(kase.mood) + '</div></div></div>'
          + '<div class="tr-case-body">'
          + '<div class="tr-sub">Situation</div><p style="margin:0;font-size:13px;line-height:1.62;color:#334155;">' + esc(kase.brief) + '</p>'
          + '<div class="tr-sub">The client says</div><div class="tr-line">' + esc(kase.line) + '</div>'
          + '<div class="tr-sub">You must</div><ul class="tr-must"><li>' + kase.must.map(esc).join('</li><li>') + '</li></ul>'
          + '<div class="tr-sub">Required language</div><div class="tr-chips">'
          + kase.language.map(function (item) { return '<span class="tr-chip">' + esc(item) + '</span>'; }).join('')
          + '</div>'
          + '<div class="tr-sub">Your answer in English</div>'
          + '<textarea class="tr-answer" data-answer="' + kase.id + '" placeholder="Write what you would actually say to this client.">' + esc(saved) + '</textarea>'
          + '<button class="tr-model-btn" type="button">Compare with the model</button>'
          + '<div class="tr-model"><p>' + esc(kase.model) + '</p>'
          + '<ul><li>' + kase.check.map(esc).join('</li><li>') + '</li></ul></div>'
          + '</div></div>';
      }).join('');
    return secShell('cases', 'clipboard-text', 'Home practice — 10 cases', 'Cards, disputes and chargebacks, escalating difficulty.', '10 cases', inner);
  }

  function rubricSection() {
    var inner = '<div class="tr-wrap"><table class="tr-table"><thead><tr>'
      + '<th>KPI</th><th>Weight</th><th>Focus (1)</th><th>Developing (3)</th><th>Strong (5)</th>'
      + '</tr></thead><tbody>'
      + RUBRIC.rows.map(function (row) {
        return '<tr>' + row.map(function (cell, index) {
          return '<td' + (index === 1 ? ' style="white-space:nowrap;"' : '') + '>' + esc(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('')
      + '</tbody></table></div><div class="tr-note">' + esc(RUBRIC.note) + '</div>';
    return secShell('rubric', 'chart-bar', 'Scoring rubric', 'The same six KPIs every week, in class and at home.', '6 KPIs', inner);
  }

  function mount(root, config) {
    if (!root) return;
    config = config || {};
    var product = config.product === 'kamuk' ? 'kamuk' : 'infinity';
    var accent = product === 'kamuk' ? '#2B7EC1' : '#5B21B6';
    styles(accent);

    root.innerHTML = '<div class="tr">'
      + '<div class="tr-head"><small>Week ' + WEEK.number + ' · ' + esc(WEEK.industry) + '</small>'
      + '<h2>' + esc(WEEK.focus) + '</h2>'
      + '<p>' + esc(WEEK.goal) + '</p>'
      + '<div class="tr-meta">' + esc(WEEK.meta) + '</div></div>'
      + languageSection()
      + planSection('monday', 'calendar-event', 'Monday — Learn and prepare', 'Language, playbook, guided case, mini debate.', MONDAY)
      + planSection('tuesday', 'users', 'Tuesday — Case floor', 'Rotating roles, pressure round, team defence.', TUESDAY)
      + casesSection(product)
      + rubricSection()
      + '</div>';

    root.addEventListener('click', function (event) {
      var modelBtn = event.target.closest('.tr-model-btn');
      if (modelBtn) {
        var panel = modelBtn.parentElement.querySelector('.tr-model');
        var open = panel.classList.toggle('show');
        modelBtn.textContent = open ? 'Hide the model' : 'Compare with the model';
        return;
      }
      var caseTop = event.target.closest('.tr-case-top');
      if (caseTop) { caseTop.parentElement.classList.toggle('open'); return; }
      var secTop = event.target.closest('.tr-sec-top');
      if (secTop) { secTop.parentElement.classList.toggle('open'); }
    });

    root.addEventListener('input', function (event) {
      var field = event.target.closest('.tr-answer');
      if (!field) return;
      writeAnswer(product, field.dataset.answer, field.value);
      field.closest('.tr-case').classList.toggle('answered', field.value.trim().length > 0);
    });
  }

  window.SimulationTraining = { mount: mount, week: WEEK, cases: CASES, rubric: RUBRIC };
})();
