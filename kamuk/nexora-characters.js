// Nexora — 24 fixed client characters, rotated each simulation
var NEXORA_CHARACTERS = [{"id":"c01","firstName":"James","lastName":"Thompson","gender":"male","voiceId":"bfGb7JTLUnZebZRiFYyq","voiceAccent":"American Male","phone":"(503) 555-0142","account":"#N482193","ssn4":"3847","email":"james.thompson@email.com","address":"742 Oak St, Portland OR","dob":"1978-03-15","memberSince":"2019-06-01","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c02","firstName":"Michael","lastName":"Davis","gender":"male","voiceId":"bfGb7JTLUnZebZRiFYyq","voiceAccent":"American Male","phone":"(206) 555-0287","account":"#N591024","ssn4":"5621","email":"michael.davis@email.com","address":"118 Maple Ave, Seattle WA","dob":"1982-07-22","memberSince":"2020-01-15","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c03","firstName":"William","lastName":"Brown","gender":"male","voiceId":"bfGb7JTLUnZebZRiFYyq","voiceAccent":"American Male","phone":"(512) 555-0391","account":"#N673845","ssn4":"9014","email":"william.brown@email.com","address":"905 Cedar Ln, Austin TX","dob":"1975-11-08","memberSince":"2018-09-01","services":[{"name":"Personal Loan","price":"$189.50/mo","desc":"Fixed-rate personal financing"}]},{"id":"c04","firstName":"David","lastName":"Chen","gender":"male","voiceId":"NIkIuJZ8oQMuKZqwKtnm","voiceAccent":"Chinese Male","phone":"(415) 555-0416","account":"#N284756","ssn4":"2238","email":"david.chen@email.com","address":"220 Pine Rd, San Francisco CA","dob":"1980-05-19","memberSince":"2021-03-10","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c05","firstName":"Kevin","lastName":"Wang","gender":"male","voiceId":"NIkIuJZ8oQMuKZqwKtnm","voiceAccent":"Chinese Male","phone":"(213) 555-0523","account":"#N395871","ssn4":"7745","email":"kevin.wang@email.com","address":"441 Elm Blvd, Los Angeles CA","dob":"1988-01-30","memberSince":"2022-07-01","services":[{"name":"Fraud Shield Pro","price":"$4.99/mo","desc":"24/7 fraud monitoring"},{"name":"Savings Account","price":"$0/mo","desc":"High-yield savings"}]},{"id":"c06","firstName":"Brian","lastName":"Liu","gender":"male","voiceId":"NIkIuJZ8oQMuKZqwKtnm","voiceAccent":"Chinese Male","phone":"(303) 555-0634","account":"#N418293","ssn4":"6612","email":"brian.liu@email.com","address":"67 Oak St, Denver CO","dob":"1977-09-12","memberSince":"2019-11-20","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c07","firstName":"Robert","lastName":"Mueller","gender":"male","voiceId":"b4XCIIupgo5eH7TxhBNk","voiceAccent":"German Male","phone":"(312) 555-0745","account":"#N529384","ssn4":"4489","email":"robert.mueller@email.com","address":"330 Maple Ave, Chicago IL","dob":"1973-04-25","memberSince":"2017-05-01","services":[{"name":"Personal Loan","price":"$189.50/mo","desc":"Fixed-rate personal financing"}]},{"id":"c08","firstName":"Daniel","lastName":"Schmidt","gender":"male","voiceId":"b4XCIIupgo5eH7TxhBNk","voiceAccent":"German Male","phone":"(617) 555-0856","account":"#N637492","ssn4":"3356","email":"daniel.schmidt@email.com","address":"512 Cedar Ln, Boston MA","dob":"1985-12-03","memberSince":"2020-08-15","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c09","firstName":"Christopher","lastName":"Weber","gender":"male","voiceId":"b4XCIIupgo5eH7TxhBNk","voiceAccent":"German Male","phone":"(305) 555-0967","account":"#N748561","ssn4":"8820","email":"christopher.weber@email.com","address":"891 Pine Rd, Miami FL","dob":"1979-08-17","memberSince":"2021-02-28","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c10","firstName":"Raj","lastName":"Patel","gender":"male","voiceId":"8WqHCYyrnUqoK70Px5EJ","voiceAccent":"Indian Male","phone":"(713) 555-1078","account":"#N859672","ssn4":"1193","email":"raj.patel@email.com","address":"156 Elm Blvd, Houston TX","dob":"1981-06-09","memberSince":"2018-12-01","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"},{"name":"Fraud Shield Pro","price":"$4.99/mo","desc":"24/7 fraud monitoring"}]},{"id":"c11","firstName":"Arjun","lastName":"Sharma","gender":"male","voiceId":"8WqHCYyrnUqoK70Px5EJ","voiceAccent":"Indian Male","phone":"(214) 555-1189","account":"#N960783","ssn4":"5574","email":"arjun.sharma@email.com","address":"423 Oak St, Dallas TX","dob":"1990-02-14","memberSince":"2023-01-10","services":[{"name":"Savings Account","price":"$0/mo","desc":"High-yield savings"}]},{"id":"c12","firstName":"Vikram","lastName":"Singh","gender":"male","voiceId":"8WqHCYyrnUqoK70Px5EJ","voiceAccent":"Indian Male","phone":"(602) 555-1290","account":"#N071894","ssn4":"9931","email":"vikram.singh@email.com","address":"778 Maple Ave, Phoenix AZ","dob":"1976-10-28","memberSince":"2019-04-22","services":[{"name":"Personal Loan","price":"$189.50/mo","desc":"Fixed-rate personal financing"}]},{"id":"c13","firstName":"Margaret","lastName":"Johnson","gender":"female","voiceId":"r1KmysJdVYZjJCm4mL3b","voiceAccent":"American Female","phone":"(503) 555-2301","account":"#N182905","ssn4":"2468","email":"margaret.johnson@email.com","address":"615 Cedar Ln, Portland OR","dob":"1983-03-07","memberSince":"2020-05-18","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c14","firstName":"Sarah","lastName":"Williams","gender":"female","voiceId":"r1KmysJdVYZjJCm4mL3b","voiceAccent":"American Female","phone":"(206) 555-2412","account":"#N293016","ssn4":"1357","email":"sarah.williams@email.com","address":"902 Pine Rd, Seattle WA","dob":"1987-07-31","memberSince":"2021-09-01","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c15","firstName":"Elizabeth","lastName":"Taylor","gender":"female","voiceId":"r1KmysJdVYZjJCm4mL3b","voiceAccent":"American Female","phone":"(512) 555-2523","account":"#N304127","ssn4":"8024","email":"elizabeth.taylor@email.com","address":"144 Elm Blvd, Austin TX","dob":"1974-11-21","memberSince":"2018-06-12","services":[{"name":"Personal Loan","price":"$189.50/mo","desc":"Fixed-rate personal financing"}]},{"id":"c16","firstName":"Jennifer","lastName":"Anderson","gender":"female","voiceId":"NoOVOzCQFLOvtsMoNcdT","voiceAccent":"American Female","phone":"(303) 555-2634","account":"#N415238","ssn4":"4680","email":"jennifer.anderson@email.com","address":"267 Oak St, Denver CO","dob":"1989-04-16","memberSince":"2022-03-05","services":[{"name":"Fraud Shield Pro","price":"$4.99/mo","desc":"24/7 fraud monitoring"}]},{"id":"c17","firstName":"Linda","lastName":"Moore","gender":"female","voiceId":"NoOVOzCQFLOvtsMoNcdT","voiceAccent":"American Female","phone":"(305) 555-2745","account":"#N526349","ssn4":"7192","email":"linda.moore@email.com","address":"533 Maple Ave, Miami FL","dob":"1980-08-02","memberSince":"2019-10-30","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c18","firstName":"Patricia","lastName":"Wilson","gender":"female","voiceId":"NoOVOzCQFLOvtsMoNcdT","voiceAccent":"American Female","phone":"(617) 555-2856","account":"#N637450","ssn4":"3546","email":"patricia.wilson@email.com","address":"811 Cedar Ln, Boston MA","dob":"1972-12-19","memberSince":"2017-08-01","services":[{"name":"Savings Account","price":"$0/mo","desc":"High-yield savings"},{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c19","firstName":"Sofia","lastName":"Zhang","gender":"female","voiceId":"1a0nAYA3FcNQcMMfbddY","voiceAccent":"Chinese Female","phone":"(213) 555-2967","account":"#N748561","ssn4":"6283","email":"sofia.zhang@email.com","address":"990 Pine Rd, Los Angeles CA","dob":"1991-05-28","memberSince":"2023-06-15","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]},{"id":"c20","firstName":"Lisa","lastName":"Huang","gender":"female","voiceId":"1a0nAYA3FcNQcMMfbddY","voiceAccent":"Chinese Female","phone":"(415) 555-3078","account":"#N859672","ssn4":"9417","email":"lisa.huang@email.com","address":"125 Elm Blvd, San Francisco CA","dob":"1986-01-11","memberSince":"2021-04-20","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c21","firstName":"Amanda","lastName":"Fischer","gender":"female","voiceId":"ztyYYqlYMny7nllhThgo","voiceAccent":"German Female","phone":"(312) 555-3189","account":"#N960783","ssn4":"5078","email":"amanda.fischer@email.com","address":"404 Oak St, Chicago IL","dob":"1984-09-05","memberSince":"2020-11-08","services":[{"name":"Personal Loan","price":"$189.50/mo","desc":"Fixed-rate personal financing"}]},{"id":"c22","firstName":"Karen","lastName":"Becker","gender":"female","voiceId":"ztyYYqlYMny7nllhThgo","voiceAccent":"German Female","phone":"(713) 555-3290","account":"#N071894","ssn4":"2864","email":"karen.becker@email.com","address":"678 Maple Ave, Houston TX","dob":"1978-06-23","memberSince":"2019-02-14","services":[{"name":"Premium Account","price":"$45.00/mo","desc":"Full-service banking"}]},{"id":"c23","firstName":"Priya","lastName":"Nair","gender":"female","voiceId":"NyZqLdjqUb8SpOUKIlWT","voiceAccent":"Indian Female","phone":"(214) 555-3401","account":"#N182905","ssn4":"6735","email":"priya.nair@email.com","address":"321 Cedar Ln, Dallas TX","dob":"1992-03-18","memberSince":"2023-08-01","services":[{"name":"Fraud Shield Pro","price":"$4.99/mo","desc":"24/7 fraud monitoring"}]},{"id":"c24","firstName":"Ananya","lastName":"Reddy","gender":"female","voiceId":"NyZqLdjqUb8SpOUKIlWT","voiceAccent":"Indian Female","phone":"(602) 555-3512","account":"#N293016","ssn4":"4189","email":"ananya.reddy@email.com","address":"556 Pine Rd, Phoenix AZ","dob":"1988-10-07","memberSince":"2022-01-25","services":[{"name":"Credit Card Plus","price":"$29.99/mo","desc":"Rewards credit card"}]}];
var _nxCharRotateIdx = 0;

(function initNexoraCharacterRotation(){
  try {
    if(localStorage.getItem('nexora_char_rotate_v') !== '2'){
      _nxCharRotateIdx = 0;
      localStorage.setItem('nexora_char_rotate_v', '2');
      localStorage.setItem('nexora_char_rotate_idx', '0');
    } else {
      _nxCharRotateIdx = parseInt(localStorage.getItem('nexora_char_rotate_idx')||'0',10)||0;
    }
  } catch(e){}
})();

function applyNexoraCharactersPayload(data){
  if(data && data.characters && data.characters.length) NEXORA_CHARACTERS = data.characters;
}

function pickNextNexoraCharacter(){
  if(!NEXORA_CHARACTERS.length) return null;
  var ch = NEXORA_CHARACTERS[_nxCharRotateIdx % NEXORA_CHARACTERS.length];
  _nxCharRotateIdx = (_nxCharRotateIdx + 1) % NEXORA_CHARACTERS.length;
  try { localStorage.setItem('nexora_char_rotate_idx', String(_nxCharRotateIdx)); } catch(e){}
  return JSON.parse(JSON.stringify(ch));
}

function resolveNexoraIssueType(scenario, profile) {
  if (profile && profile.issueType) return profile.issueType;
  if (scenario && scenario.issueType) return scenario.issueType;
  return inferNexoraIssueType(scenario || {});
}

function nexoraScenarioBlob(scenario, profile) {
  return (String((scenario && scenario.title) || '') + ' ' + String((scenario && scenario.desc) || '') + ' ' + String((profile && profile.issueSummary) || '')).toLowerCase();
}

function isAccessLockoutIssue(issue, scenario, profile) {
  if (issue === 'technical') return true;
  var blob = nexoraScenarioBlob(scenario, profile);
  return issue === 'security' && /lockout|locked out|cannot access|portal access|login attempt|password reset/.test(blob);
}

function buildCrmScenarioState(scenario, profile) {
  var issue = resolveNexoraIssueType(scenario, profile);
  var blob = nexoraScenarioBlob(scenario, profile);
  var locked = isAccessLockoutIssue(issue, scenario, profile);
  var cardBlocked = issue === 'security' && /card|fraud|block|purchase|travel|debit|atm/.test(blob);
  var state = {
    issueType: issue,
    sidebarStatus: 'Active',
    sidebarIcon: 'ti-check',
    sidebarBadgeClass: 'badge-active',
    onlineAccess: {
      label: 'Online banking',
      status: locked ? 'Locked' : 'Active',
      detail: locked ? 'Locked after failed login attempts · 2 days ago' : 'Last login: 3 days ago',
      badgeClass: locked ? 'badge-locked' : 'badge-active'
    },
    showAccessTab: locked || cardBlocked || issue === 'security',
    cardAccess: cardBlocked ? {
      label: 'Debit card',
      status: 'Blocked',
      detail: 'Fraud hold — legitimate purchase flagged',
      badgeClass: 'badge-locked'
    } : null,
    complianceNote: 'Verify identity and account ownership before changes.',
    extraChanges: []
  };

  if (locked) {
    state.sidebarStatus = 'Access locked';
    state.sidebarIcon = 'ti-lock';
    state.sidebarBadgeClass = 'badge-locked';
    state.complianceNote = 'Verify identity before password reset or account unlock.';
    state.extraChanges.push({ when: '2 days ago', what: 'Online access locked — failed login threshold', by: 'Security system' });
  } else if (issue === 'security') {
    state.sidebarStatus = 'Security alert';
    state.sidebarIcon = 'ti-shield-exclamation';
    state.sidebarBadgeClass = 'badge-warn';
    state.complianceNote = 'Review security alerts and verify identity before account changes.';
    state.extraChanges.push({ when: '1 day ago', what: 'Security alert triggered — review required', by: 'Fraud monitoring' });
  } else if (issue === 'late_fee' || issue === 'billing_dispute') {
    state.complianceNote = 'Verify identity and account ownership before fee reversals or disputes.';
  } else if (issue === 'cancellation') {
    state.sidebarStatus = 'Pending cancellation';
    state.sidebarIcon = 'ti-clock';
    state.sidebarBadgeClass = 'badge-warn';
  }

  return state;
}

function syncProfileWithScenario(p, scenario) {
  if (!p) return p;
  if (scenario) {
    p.issueType = resolveNexoraIssueType(scenario, p);
    p.scenario = scenario;
  }
  p.crmState = buildCrmScenarioState(scenario, p);
  if (scenario) {
    p.issueSummary = (scenario.title || 'Customer issue') + (scenario.desc ? ' — ' + scenario.desc : '');
    p.crmIssueSummary = p.issueSummary;
  }
  return p;
}

function applyScenarioBillingToProfile(p, scenario) {
  if (!p) return p;
  if (p.billingNotes && p.billingNotes.length && p.issueType) {
    syncProfileWithScenario(p, scenario);
    return p;
  }
  p.billingNotes = [];
  p.disputeAmount = null;
  p.lateFee = null;
  p.refundAmount = null;
  p.issueType = null;
  p.issueSummary = null;
  if (!scenario) return p;

  var issue = scenario.issueType || inferNexoraIssueType(scenario);

  function addNote(type, label, amount, note, daysAgo) {
    p.billingNotes.push({
      type: type,
      label: label,
      amount: amount || '',
      date: new Date(Date.now() - (daysAgo || 3) * 86400000).toLocaleDateString('en-US'),
      note: note
    });
  }

  p.issueType = issue;

  switch (issue) {
    case 'billing_dispute':
      p.disputeAmount = '$' + (15 + Math.floor(Math.random() * 85)) + '.00';
      addNote('charge', 'Unexpected charge', p.disputeAmount, scenario.desc || 'Not authorized by client — disputing on this call', 3);
      break;
    case 'late_fee':
      p.lateFee = '$' + (25 + Math.floor(Math.random() * 15)) + '.00';
      addNote('fee', 'Late payment fee', p.lateFee, scenario.desc || 'Client disputes — claims payment was on time', 7);
      break;
    case 'refund':
      p.refundAmount = (p.services && p.services[0]
        ? parseFloat(String(p.services[0].price).replace(/[^0-9.]/g, ''))
        : 29).toFixed(2);
      addNote('refund', 'Refund requested', '$' + p.refundAmount, scenario.desc || 'Client says service did not work as expected', 5);
      break;
    case 'cancellation':
      addNote('cancel', 'Cancellation requested', '', scenario.desc || 'Client initiated cancellation — retention opportunity', 0);
      break;
    case 'security':
      addNote('alert', 'Security alert', '', scenario.desc || 'Failed login attempts from unknown device — review required', 2);
      addNote('alert', 'Account access review', '', 'Client reports possible unauthorized access', 1);
      break;
    case 'technical':
      addNote('ticket', 'Portal access failure', '', scenario.desc || 'Online account locked after failed login attempts — reset pending', 1);
      addNote('ticket', 'Support ticket #TKT-' + (7700 + Math.floor(Math.random() * 200)), '', scenario.desc || 'Client cannot access online account', 2);
      break;
    case 'upgrade':
      addNote('request', 'Plan upgrade inquiry', '', scenario.desc || 'Client comparing plan options — quote requested', 0);
      break;
    case 'complaint_escalation':
    case 'vip_complaint':
      addNote('escalation', scenario.title || 'Escalated complaint', '', scenario.desc || 'Prior poor experience — client demanding resolution', 1);
      break;
    case 'wrong_information':
      addNote('correction', 'Incorrect information provided', '', scenario.desc || 'Previous agent gave wrong guidance — client wants correction', 4);
      break;
    case 'insurance_claim':
      addNote('claim', 'Insurance claim issue', '$' + (120 + Math.floor(Math.random() * 880)), scenario.desc || 'Claim denied or pending — client needs status', 5);
      break;
    case 'prior_auth':
      addNote('auth', 'Prior authorization required', '', scenario.desc || 'Authorization not on file — specialist visit blocked', 2);
      break;
    case 'prescription':
      addNote('rx', 'Prescription issue', '$' + (15 + Math.floor(Math.random() * 65)), scenario.desc || 'Pharmacy cannot fill prescription as written', 1);
      break;
    case 'copay_dispute':
      p.disputeAmount = '$' + (10 + Math.floor(Math.random() * 40)) + '.00';
      addNote('copay', 'Copay mismatch', p.disputeAmount, scenario.desc || 'Paid copay differs from plan on file', 3);
      break;
    case 'lab_results':
      addNote('lab', 'Lab results pending', '', scenario.desc || 'Results overdue — patient waiting for callback', 10);
      break;
    case 'referral':
      addNote('referral', 'Referral issue', '', scenario.desc || 'Referral expired or not processed', 6);
      break;
    case 'medical_billing':
      p.disputeAmount = '$' + (250 + Math.floor(Math.random() * 1750)) + '.00';
      addNote('claim', 'Out-of-network balance', p.disputeAmount, scenario.desc || 'Unexpected medical balance bill', 8);
      break;
    case 'records_request':
      addNote('records', 'Medical records request', '', scenario.desc || 'Records needed by another provider', 2);
      break;
    case 'appointment':
      addNote('appointment', 'Appointment issue', '', scenario.desc || 'Scheduling or no-show dispute on file', 1);
      break;
    case 'booking_issue':
    case 'booking_change':
      addNote('booking', scenario.title || 'Booking issue', '', scenario.desc || 'Reservation or travel booking problem', 2);
      break;
    default:
      if (!scenario.type || scenario.type === 'customer_service') {
        addNote('issue', scenario.title || 'Account issue', '', scenario.desc || 'Issue logged on account before inbound call', 2);
      }
      break;
  }

  p.issueSummary = (scenario.title || 'Customer issue') + (scenario.desc ? ' — ' + scenario.desc : '');
  p.crmIssueSummary = p.issueSummary;
  syncProfileWithScenario(p, scenario);
  return p;
}

function inferNexoraIssueType(scenario) {
  var id = String(scenario.id || '');
  var blob = (String(scenario.title || '') + ' ' + String(scenario.desc || '')).toLowerCase();
  if (id === 'cs1' || /billing dispute|unexpected charge/.test(blob)) return 'billing_dispute';
  if (id === 'cs7' || /late fee|overdraft/.test(blob)) return 'late_fee';
  if (id === 'cs4' || /refund/.test(blob)) return 'refund';
  if (id === 'cs2' || /cancellation|cancel/.test(blob)) return 'cancellation';
  if (id === 'cs6' || /security|unauthorized|fraud/.test(blob)) return 'security';
  if (id === 'cs3' || /lockout|locked out|cannot access|login|portal|access failure/.test(blob)) return 'technical';
  if (id === 'cs8' || /upgrade/.test(blob)) return 'upgrade';
  if (id === 'cs5' || /complaint escalation|escalat/.test(blob)) return 'complaint_escalation';
  if (id === 'cs9' || /vip/.test(blob)) return 'vip_complaint';
  if (id === 'cs10' || /wrong information|misled|incorrect/.test(blob)) return 'wrong_information';
  if (/insurance|claim denied|coverage/.test(blob)) return 'insurance_claim';
  if (/prior auth/.test(blob)) return 'prior_auth';
  if (/prescription|medication|pharmacy|formulary/.test(blob)) return 'prescription';
  if (/copay/.test(blob)) return 'copay_dispute';
  if (/lab result/.test(blob)) return 'lab_results';
  if (/referral/.test(blob)) return 'referral';
  if (/out-of-network|medical bill/.test(blob)) return 'medical_billing';
  if (/record/.test(blob)) return 'records_request';
  if (/appointment|no-show/.test(blob)) return 'appointment';
  if (/booking|reservation|flight|hotel/.test(blob)) return 'booking_issue';
  return 'general';
}

function buildNexoraProfileFromCharacter(base, scenario){
  var p = JSON.parse(JSON.stringify(base));
  p.name = p.firstName + ' ' + p.lastName;
  p.status = 'Active';
  if (typeof assignNexoraProfile === 'function') assignNexoraProfile(p);
  else if (typeof ensureProfileVoiceCongruency === 'function') ensureProfileVoiceCongruency(p);
  else if (typeof syncNexoraVoiceWithName === 'function') syncNexoraVoiceWithName(p);
  applyScenarioBillingToProfile(p, scenario);
  syncProfileWithScenario(p, scenario);
  p.scenario = scenario;
  p.generatedAt = new Date().toISOString();
  p.total = (p.services || []).reduce(function(s, x) {
    return s + parseFloat(String(x.price || '').replace(/[^0-9.]/g, '') || 0);
  }, 0);
  return p;
}
