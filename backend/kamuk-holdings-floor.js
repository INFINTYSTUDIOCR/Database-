/**
 * Kamuk Holdings weekly nesting floor helpers.
 */
const path = require('path');
const crypto = require('crypto');

const pack = require(path.join('..', 'kamuk', 'data', 'kamuk-holdings-crm-pack-v1.json'));
const templateMap = pack.templateMap || Object.fromEntries((pack.cases || []).map((item) => [item.id, item.templateId || item.id]));

const PRIZE_SCORE = 8;
const PRIZE_USD = 40;
const DELAY_GAP_MS = 30 * 60 * 1000;
const DELAY_STRIKE_LIMIT = 3;
const HOME_WORD_MIN = 100;
const HOME_WORD_MAX = 200;

const PROFESSIONAL_CONNECTORS = [
  'because', 'however', 'therefore', 'although', 'in addition', 'as a result',
  'even though', 'on the other hand', 'in order to', 'consequently', 'nevertheless'
];

const METHOD_PHRASES = [
  'even when', 'even though', 'what happens is that', 'when was that', 'when thinking',
  'in which', 'on which', 'which is used', 'despite that', 'in other words', 'which means',
  'not only', 'as well as', 'the thing is that', 'you know what i mean', 'it is said that',
  'it should be done', 'somehow', 'i realized', 'find a way', 'figure out', 'instead of',
  'about to', 'on the other hand', 'according to', 'such as', 'by now', 'for the moment',
  'so far', 'unless', 'without the', 'however'
];

const BANKING_TERMS = [
  'identity', 'verification', 'provisional credit', 'dispute', 'chargeback', 'travel notice',
  'virtual card', 'authorization', 'disposition', 'awaiting action', 'pending system',
  'replacement card', 'reporting window', 'merchant', 'statement', 'last 6', 'pin',
  'follow up', 'follow-up', 'case number', 'business day', 'handoff', 'escalate',
  'compliance', 'recorded line', 'operating account'
];

const AFFIX_FORMS = [
  'unauthorized', 'authorization', 'verification', 'unverified', 'cancellation', 'cancelled',
  'ineligible', 'eligibility', 'replacement', 'activation', 'inactive', 'unresolved',
  'non-compliant', 'compliance', 'confirmation', 'investigation'
];

const GPT_FILLER = [
  'as an ai', 'i hope this message finds you', 'i hope this email finds you',
  'in today\'s fast-paced', 'it is important to note', 'delve into',
  'rest assured that', 'leverage a robust', 'streamline your experience',
  'please do not hesitate', 'please don\'t hesitate', 'i am here to assist you',
  'in conclusion,', 'banking landscape', 'do not hesitate to reach out'
];

const TRANSLATOR_ESE = [
  'i remain attentive', 'for your knowledge', 'i comment you', 'i proceed to',
  'in attention to', 'make a dispute', 'make a refund', 'i put you in contact',
  'the same one of', 'i stay pending'
];

const HOME_CASES = [
  {
    id: 'hc1',
    title: 'PIN request with a broken identity trail',
    line: '“Just text me the PIN. The last agent already said my ID was fine.”',
    facts: 'Client wants the PIN by SMS from a taxi. Mother’s maiden name matches. Date of birth on file is 12 Mar 1984; client said 12 Mar 1985. Previous note says “ID OK” with no data points. Card is Active. Policy: never send, read or email a PIN; last 6 only after full identity on a recorded line.',
    connectors: ['because', 'however'],
    family: ['verify', 'verification', 'unverified'],
    phrasal: 'look into',
    vocab: ['identity verification', 'PIN', 'last 6', 'recorded line'],
    disposition: ['awaiting action', 'aa'],
    resolution: ['never send', 'date of birth', 'recorded line', 'identity'],
    forbidden: ['text the pin', 'sms the pin', 'email the pin', 'here is your pin'],
    why: ['policy', 'mismatch', 'because']
  },
  {
    id: 'hc2',
    title: 'Hotel decline with two possible blocks',
    line: '“Everyone is watching me at check-in. Fix the card now.”',
    facts: 'Lisbon hotel decline. Available balance $8,400. No travel notice on file. Assistant filed a travel notice for Paris, not Lisbon. A $500 hotel MCC block remains from a prior dispute. Identity is not fully re-verified on this call. Policy: do not lift every control blindly; confirm which rule fired, then act.',
    connectors: ['because', 'therefore'],
    family: ['authorize', 'authorization', 'unauthorized'],
    phrasal: 'sort out',
    vocab: ['travel notice', 'decline', 'merchant category', 'available'],
    disposition: ['pending system', 'psa'],
    resolution: ['travel notice', 'lisbon', 'hotel', 'verify'],
    forbidden: ['lift every block', 'remove all restrictions', 'guarantee it will work'],
    why: ['because', 'two', 'policy']
  },
  {
    id: 'hc3',
    title: 'Deposit versus balance, not a duplicate',
    line: '“You charged me twice. File the dispute today.”',
    facts: 'Two postings of $2,150, one day apart, same merchant. Descriptors: DEPOSIT then BALANCE. Client did not attach the booking confirmation. Policy: a deposit plus remaining balance is not a duplicate. Chargeback needs evidence. Billing inquiry is allowed.',
    connectors: ['although', 'in addition'],
    family: ['cancel', 'cancellation', 'cancelled'],
    phrasal: 'follow up',
    vocab: ['duplicate charge', 'merchant', 'chargeback', 'evidence'],
    disposition: ['awaiting action', 'aa'],
    resolution: ['not a duplicate', 'deposit', 'booking confirmation', 'billing'],
    forbidden: ['open the chargeback now', 'file fraud', 'instant refund'],
    why: ['although', 'descriptor', 'policy']
  },
  {
    id: 'hc4',
    title: 'ATM withdrawals with PIN present',
    line: '“The card is in my hand. Is my money gone? Refund me now.”',
    facts: 'Six ATM withdrawals in another city, $3,000 total. Chip-and-PIN was used. Card is physically with the client. Spouse is an authorized user. No police report. Policy: PIN-present ATM is not automatic unauthorized fraud; block and replace; provisional credit needs investigation, not an instant refund.',
    connectors: ['because', 'however'],
    family: ['authorize', 'authorization', 'unauthorized'],
    phrasal: 'look into',
    vocab: ['provisional credit', 'replacement card', 'investigation', 'PIN'],
    disposition: ['awaiting action', 'aa'],
    resolution: ['block', 'replacement card', 'investigation', 'provisional credit'],
    forbidden: ['instant refund', 'accuse the spouse', 'the money is gone'],
    why: ['because', 'pin', 'policy']
  },
  {
    id: 'hc5',
    title: 'Hotel overbooked, merchant first',
    line: '“The hotel says the bank must solve it. Put the $1,200 back.”',
    facts: '$1,200 posting. Room not provided (overbooking). Client has a booking confirmation. Chat screenshot from a front-desk account: “we cannot help, call your bank.” Not an official refund-desk letter. Policy: service-not-rendered usually needs merchant contact first (10 business days) unless written refusal exists. Screenshot may be enough if documented.',
    connectors: ['although', 'therefore'],
    family: ['resolve', 'resolution', 'unresolved'],
    phrasal: 'sort out',
    vocab: ['service not rendered', 'booking confirmation', 'merchant response', 'evidence'],
    disposition: ['pending system', 'psa'],
    resolution: ['service not rendered', 'screenshot', 'document', 'merchant'],
    forbidden: ['pay from bank funds', 'close without evidence', 'instant refund'],
    why: ['although', 'policy', 'therefore']
  },
  {
    id: 'hc6',
    title: 'Broken same-day refund promise',
    line: '“Another bank refunds in 24 hours. Your colleague promised today.”',
    facts: 'Valid card-not-present fraud $890. Client is Standard, not VIP. Previous agent wrote “you will have it today.” Internal chat says VIP may get same-day goodwill — supervisor authority only. Policy: provisional credit in two business days after a case number; final decision 45–90 days. Do not match an invalid promise yourself.',
    connectors: ['however', 'in addition'],
    family: ['comply', 'compliance', 'non-compliant'],
    phrasal: 'follow up',
    vocab: ['provisional credit', 'case number', 'business day', 'goodwill'],
    disposition: ['awaiting action', 'aa'],
    resolution: ['provisional credit', 'case number', 'supervisor', 'two business days'],
    forbidden: ['instant refund', 'same-day refund', 'i will refund today'],
    why: ['however', 'policy', 'standard']
  },
  {
    id: 'hc7',
    title: 'Late dispute after the network window',
    line: '“It is still theft. Are you doing nothing because I was in hospital?”',
    facts: 'Charge 20 May. Statement date 31 May. Client reports 18 August — past the 60-day network window from the statement date. Client says hospital stay, no documents on file. Policy: network dispute is ineligible; hardship exception needs medical evidence and supervisor. Alternative: internal report and monitoring, not a chargeback.',
    connectors: ['because', 'although'],
    family: ['eligible', 'eligibility', 'ineligible'],
    phrasal: 'look into',
    vocab: ['reporting window', 'statement date', 'internal report', 'chargeback'],
    disposition: ['awaiting action', 'aa'],
    resolution: ['ineligible', 'reporting window', 'internal report', 'hospital'],
    forbidden: ['file the chargeback', 'network will reverse', 'ignore the window'],
    why: ['because', 'although', 'statement']
  },
  {
    id: 'hc8',
    title: 'Client wants a guaranteed win',
    line: '“Promise me I am going to win. Sales said we always win these.”',
    facts: 'Dispute filed correctly with evidence. Representment pending. Network decision in 12 business days. A sales manager emailed “we always win these.” Policy: never guarantee a network outcome. Explain the process, the deadline, and the follow-up without echoing sales.',
    connectors: ['however', 'therefore'],
    family: ['decide', 'decision', 'undecided'],
    phrasal: 'follow up',
    vocab: ['network', 'evidence', 'deadline', 'outcome'],
    disposition: ['pending system', 'psa'],
    resolution: ['cannot guarantee', 'network', 'deadline', 'follow up'],
    forbidden: ['you will win', 'i guarantee', 'we always win'],
    why: ['however', 'policy', 'network']
  },
  {
    id: 'hc9',
    title: 'Merchant refund already posted',
    line: '“Keep the claim open anyway, just in case.”',
    facts: '$620 merchant refund posted yesterday. An open dispute is still live. Keeping both can create a double credit. Policy: withdraw the dispute, confirm the refund, and explain that the claim can be reopened within 10 days if the refund reverses.',
    connectors: ['because', 'in addition'],
    family: ['resolve', 'resolution', 'unresolved'],
    phrasal: 'sort out',
    vocab: ['refund', 'double credit', 'withdraw', 'reopen'],
    disposition: ['resolved', 'resolved with client'],
    resolution: ['withdraw', 'double credit', 'reopen', 'refund'],
    forbidden: ['keep both open', 'leave the dispute open', 'just in case keep'],
    why: ['because', 'double', 'policy']
  },
  {
    id: 'hc10',
    title: 'Flight in 12 hours and a WhatsApp wire',
    line: '“A physical card in five days is useless. Wire $4,200 to this travel agency now.”',
    facts: 'Fraud block on the physical card. Flight at 6:00 a.m. Client wants a wire to a WhatsApp “travel agency” to pay the airline. Virtual card can be activated. Airport ATM cash is limited while the replacement is in transit. Policy: do not wire to an unverified third party; activate the virtual card; set a travel notice; explain the cash limitation.',
    connectors: ['therefore', 'however'],
    family: ['activate', 'activation', 'inactive'],
    phrasal: 'sort out',
    vocab: ['virtual card', 'travel notice', 'cash access', 'wire'],
    disposition: ['resolved', 'resolved with client'],
    resolution: ['virtual card', 'travel notice', 'do not wire', 'whatsapp'],
    forbidden: ['send the wire', 'wire the money', 'pay the whatsapp'],
    why: ['therefore', 'unverified', 'policy']
  }
];

const REQUIRED_DONE = ['welcome', 'service', 'comms', 'products', 'compliance', 'resolution', 'quiz', 'mock'];
const QUIZ_PASS_RATE = 0.8;
const QUIZ_MIN_QUESTIONS = 10;
const FOLLOW_DISPOSITIONS = /awaiting action|pending system|returned to queue|\baa\b|\bpsa\b|queue|flagged aa|flagged psa/i;

const COURSE_CHECKS = {
  'welcome-mcq': 0,
  'service-scenario': 1,
  'service-match': { empathy: 'impact', sympathy: 'emotion', rapport: 'trust' },
  'comms-seq': ['acknowledge', 'investigate', 'act', 'next'],
  'products-match': { payroll: 'operating', hotel: 'obsidian', expansion: 'loan' },
  'compliance-tf': false,
  'compliance-multi': ['last6', 'never-pin'],
  'resolution-email': 0
};

const CERT_BANK = [
  { id: 'q1', answer: 0 },
  { id: 'q2', answer: 0 },
  { id: 'q3', answer: 0 },
  { id: 'q4', answer: 0 },
  { id: 'q5', answer: 0 },
  { id: 'q6', answer: 0 },
  { id: 'q7', answer: 1 },
  { id: 'q8', answer: 0 },
  { id: 'q9', answer: 2 },
  { id: 'q10', answer: 0 },
  { id: 'q11', answer: 1 },
  { id: 'q12', answer: 0 }
];

function sameAnswer(expected, actual) {
  if (Array.isArray(expected)) {
    const left = expected.map((item) => String(item));
    const right = Array.isArray(actual) ? actual.map((item) => String(item)) : [];
    return left.length === right.length && left.every((item, index) => item === right[index]);
  }
  if (expected && typeof expected === 'object') {
    const keys = Object.keys(expected);
    const value = actual && typeof actual === 'object' ? actual : {};
    return keys.length === Object.keys(value).length && keys.every((key) => String(expected[key]) === String(value[key]));
  }
  return expected === actual || String(expected) === String(actual);
}

function gradeCourseChecks(checks) {
  const source = checks && typeof checks === 'object' ? checks : {};
  const results = {};
  let passed = 0;
  Object.keys(COURSE_CHECKS).forEach((id) => {
    const ok = sameAnswer(COURSE_CHECKS[id], source[id]);
    results[id] = ok;
    if (ok) passed += 1;
  });
  return { results, passed, total: Object.keys(COURSE_CHECKS).length, complete: passed === Object.keys(COURSE_CHECKS).length };
}

function gradeCertification(quizAnswers) {
  const source = quizAnswers && typeof quizAnswers === 'object' ? quizAnswers : {};
  const submitted = CERT_BANK.filter((item) => Object.prototype.hasOwnProperty.call(source, item.id));
  const correct = submitted.filter((item) => Number(source[item.id]) === item.answer).length;
  const asked = Math.max(submitted.length, 0);
  const passed = asked >= QUIZ_MIN_QUESTIONS && asked ? (correct / asked) >= QUIZ_PASS_RATE : false;
  return { asked, correct, score: asked ? Math.round((correct / asked) * 100) : 0, passed };
}

function passingCoursePayload() {
  const checks = {};
  Object.keys(COURSE_CHECKS).forEach((id) => {
    checks[id] = Array.isArray(COURSE_CHECKS[id]) ? COURSE_CHECKS[id].slice() : (
      COURSE_CHECKS[id] && typeof COURSE_CHECKS[id] === 'object' ? { ...COURSE_CHECKS[id] } : COURSE_CHECKS[id]
    );
  });
  const quizAnswers = {};
  CERT_BANK.forEach((item) => { quizAnswers[item.id] = item.answer; });
  return { checks, quizAnswers, mockIndex: 12, done: REQUIRED_DONE.slice() };
}

function clean(value, max = 500) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function productForStudent(studentId) {
  return String(studentId || '').startsWith('KAM-') ? 'kamuk' : 'infinity';
}

function sessionsTable(product) {
  return product === 'kamuk' ? 'kamuk_sessions' : 'infinity_sessions';
}

function studentsTable(product) {
  return product === 'kamuk' ? 'kamuk_students' : 'infinity_students';
}

function holdingsKey(product) {
  return product === 'kamuk' ? 'kamukHoldings' : 'infinitySimulation';
}

function weekKeyCR(date = new Date()) {
  const crMs = date.getTime() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  const day = cr.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(cr.getUTCFullYear(), cr.getUTCMonth(), cr.getUTCDate() + diffToMonday));
  const yearStart = new Date(Date.UTC(monday.getUTCFullYear(), 0, 1));
  const week = Math.floor((monday - yearStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return monday.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

function crDateKey(date = new Date()) {
  const crMs = date.getTime() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  return cr.getUTCFullYear() + '-' + String(cr.getUTCMonth() + 1).padStart(2, '0') + '-' + String(cr.getUTCDate()).padStart(2, '0');
}

function workItemId(product, weekKey, caseId) {
  return 'KHCRM-WI-' + product + '-' + weekKey + '-' + caseId;
}

function claimLockId(product, weekKey, caseId) {
  return 'KHCRM-CLAIM-' + product + '-' + weekKey + '-' + caseId;
}

function wordCount(text) {
  const trimmed = String(text || '').trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

function hitCount(lower, list) {
  return (list || []).filter((word) => lower.includes(String(word).toLowerCase())).length;
}

function hasTimedNext(text) {
  return /\b(today|tomorrow|within|business day|a\.m\.|p\.m\.|\d{1,2}:\d{2})\b/i.test(String(text || ''));
}

function applyActivityHeartbeat(floor, at = new Date()) {
  const now = at instanceof Date ? at : new Date(at);
  const prev = floor && typeof floor === 'object' ? floor : {};
  const dayKey = crDateKey(now);
  const lastAt = prev.lastActivityAt ? new Date(prev.lastActivityAt).getTime() : 0;
  const gap = lastAt ? now.getTime() - lastAt : 0;
  const sameDay = prev.delayDayKey === dayKey;
  let strikes = sameDay ? Math.max(0, Number(prev.delayStrikes) || 0) : 0;
  const events = sameDay && Array.isArray(prev.delayEvents) ? prev.delayEvents.slice(-12) : [];
  if (sameDay && lastAt && gap > DELAY_GAP_MS) {
    strikes += 1;
    events.push({ at: now.toISOString(), gapMin: Math.round(gap / 60000) });
  }
  return Object.assign({}, prev, {
    lastActivityAt: now.toISOString(),
    delayDayKey: dayKey,
    delayStrikes: strikes,
    delayEvents: events.slice(-12),
    delayPenalty: strikes >= DELAY_STRIKE_LIMIT
  });
}

function detectAssistSignals(text, context) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const words = wordCount(raw);
  const prevWords = Math.max(0, Number(context && context.previousWords) || 0);
  const gptHits = GPT_FILLER.filter((item) => lower.includes(item)).length;
  const translatorHits = TRANSLATOR_ESE.filter((item) => lower.includes(item)).length;
  const connectors = PROFESSIONAL_CONNECTORS.filter((item) => lower.includes(item)).length;
  const hasVoice = /\b(i will|i'm|i am|i own|i'll)\b/i.test(raw);
  const hasContraction = /\b(i'll|don't|can't|won't|it's|we're)\b/i.test(raw);
  const pasteBurst = prevWords < 25 && words >= 90;
  const polishedBurst = pasteBurst && connectors >= 4 && !hasContraction && !hasVoice;
  const reasons = [];
  if (gptHits >= 2) reasons.push('chatgpt-filler');
  if (translatorHits >= 1) reasons.push('translator-ese');
  if (pasteBurst && (gptHits >= 1 || translatorHits >= 1 || polishedBurst)) reasons.push('sudden-polished-paste');
  if (polishedBurst) reasons.push('zero-voice-high-connectors');
  const blockPrize = reasons.length >= 1 && (gptHits >= 2 || (pasteBurst && gptHits + translatorHits >= 1) || polishedBurst);
  return {
    gptHits,
    translatorHits,
    pasteBurst,
    polishedBurst,
    reasons,
    blockPrize,
    evidence: reasons.join(', ')
  };
}

function gradeHomeAnswer(item, answer, context) {
  const text = String(answer || '').trim();
  const lower = text.toLowerCase();
  const words = wordCount(text);
  const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  const connectorCount = hitCount(lower, item.connectors);
  const methodHits = hitCount(lower, METHOD_PHRASES);
  const familyUsed = (item.family || []).some((word) => lower.includes(word.toLowerCase()));
  const phrasalUsed = lower.includes(String(item.phrasal || '').toLowerCase());
  const vocabCount = hitCount(lower, item.vocab);
  const resolutionHits = hitCount(lower, item.resolution);
  const forbiddenHit = (item.forbidden || []).some((word) => lower.includes(word.toLowerCase()));
  const whyHits = hitCount(lower, item.why);
  const dispositionHit = hitCount(lower, item.disposition) >= 1;
  const hasOpen = /\b(what|why|how|could you (explain|describe|walk)|can you (tell|explain|describe))\b/i.test(text);
  const hasClosed = /\b(did you|do you|have you|is this|are you|was the|can you confirm|could you confirm)\b/i.test(text);
  const timed = hasTimedNext(text);
  const owner = /\b(i will|i am|i own|owner|operations|supervisor|follow up|follow-up|next agent)\b/i.test(text);
  const ack = /\b(understand|i hear|you have had|impact)\b/i.test(text);
  const integrity = detectAssistSignals(text, context || {});
  const terse = words < HOME_WORD_MIN || sentences.length < 4;
  const resolution = !forbiddenHit && !terse && resolutionHits >= 2 && dispositionHit;
  const language = familyUsed && phrasalUsed && vocabCount >= 2;
  const explanation = whyHits >= 2 && /(because|therefore|as a result|although|since\b)/.test(lower);
  const execution = hasOpen && hasClosed && words >= HOME_WORD_MIN && words <= HOME_WORD_MAX;
  const transition = timed && owner;
  const connectorsOk = connectorCount >= 2 && methodHits >= 1;
  const documentation = ack && timed && owner;
  const clarity = sentences.length >= 4 && sentences.every((sentence) => wordCount(sentence) <= 40);
  const ready = resolution && language && explanation && execution && transition && connectorsOk && documentation && clarity && !integrity.blockPrize;
  const missing = [];
  if (terse) missing.push('substance (100–200 words, four clear sentences)');
  if (words > HOME_WORD_MAX) missing.push('shorten to 200 words');
  if (!connectorsOk) missing.push('required connectors plus a método linker');
  if (!familyUsed) missing.push('a prefix/suffix family form');
  if (!phrasalUsed) missing.push('the phrasal verb');
  if (vocabCount < 2) missing.push('two case terms');
  if (!resolution) missing.push('a correct disposition and safe resolution');
  if (!explanation) missing.push('a policy explanation');
  if (!hasOpen || !hasClosed) missing.push('one open and one closed question');
  if (!transition) missing.push('owner + timed next step');
  if (!documentation || !clarity) missing.push('clear structure');
  if (integrity.blockPrize) missing.push('write in your own voice (AI/translator pattern)');
  return {
    ready,
    words,
    integrity,
    dimensions: {
      resolution,
      language,
      explanation,
      execution,
      transition,
      connectors: connectorsOk,
      documentation,
      clarity
    },
    message: ready
      ? ('Rubric complete · ' + words + ' words.')
      : ('Still needed: ' + missing.join(' · '))
  };
}

function homeAnswerReady(item, answer, context) {
  return gradeHomeAnswer(item, answer, context).ready;
}

function validateTrainingProgress(payload) {
  const done = Array.isArray(payload && payload.done) ? payload.done.map((item) => clean(item, 40)).filter(Boolean) : [];
  const homeAnswers = payload && payload.homeAnswers && typeof payload.homeAnswers === 'object' ? payload.homeAnswers : {};
  const checks = payload && payload.checks && typeof payload.checks === 'object' ? payload.checks : {};
  const quizAnswers = payload && payload.quizAnswers && typeof payload.quizAnswers === 'object' ? payload.quizAnswers : {};
  const mockIndex = Math.max(0, Number(payload && payload.mockIndex) || 0);
  const quizAttempts = Math.max(0, Number(payload && payload.quizAttempts) || 0);
  const previousAnswers = payload && payload.previousHomeAnswers && typeof payload.previousHomeAnswers === 'object'
    ? payload.previousHomeAnswers
    : {};
  const checkGrade = gradeCourseChecks(checks);
  const quiz = gradeCertification(quizAnswers);
  const mockReady = mockIndex >= 11;
  const missingSteps = REQUIRED_DONE.filter((step) => {
    if (step === 'quiz') return !quiz.passed;
    if (step === 'mock') return !mockReady;
    return !done.includes(step);
  });
  if (!checkGrade.complete && !missingSteps.includes('welcome')) {
    const incomplete = Object.keys(COURSE_CHECKS).find((id) => !checkGrade.results[id]);
    if (incomplete) missingSteps.push('checks');
  }
  const courseComplete = missingSteps.length === 0 && checkGrade.complete && quiz.passed && mockReady;
  const homeStatus = HOME_CASES.map((item) => {
    const graded = gradeHomeAnswer(item, homeAnswers[item.id], {
      previousWords: wordCount(previousAnswers[item.id])
    });
    return { id: item.id, ready: graded.ready, words: graded.words, integrity: graded.integrity };
  });
  const homeReady = homeStatus.every((item) => item.ready);
  return {
    done,
    homeAnswers,
    checks,
    quizAnswers,
    mockIndex,
    quizAttempts,
    checkGrade,
    quiz,
    missingSteps,
    homeStatus,
    homeReady,
    courseComplete,
    complete: courseComplete && homeReady
  };
}

function floorState(student, product) {
  return (student && (student[holdingsKey(product)] || student.infinitySimulation || student.kamukHoldings)) || {};
}

function isNestingComplete(student, product) {
  return Boolean(floorState(student, product).nestingCompletedAt);
}

function rulesAcceptedThisWeek(state, weekKey) {
  const current = weekKey || weekKeyCR();
  return Boolean(state && state.casesRulesAcceptedAt && state.casesRulesWeekKey === current);
}

function deskGuideDoneList(state) {
  const raw = Array.isArray(state && state.deskGuideDone) ? state.deskGuideDone : [];
  const ids = [];
  raw.forEach((id) => {
    const key = String(id || '').trim();
    if (/^gp([1-9]|10)$/.test(key) && ids.indexOf(key) < 0) ids.push(key);
  });
  return ids;
}

function deskGuideAllComplete(state) {
  if (deskGuideDoneList(state).length >= 10) return true;
  return Boolean(state && state.deskGuideCompletedAt);
}

function deskGuideDoneThisWeek(state) {
  return deskGuideAllComplete(state);
}

function flagOn(value) {
  return value === true || value === 'true' || value === 1;
}

function isCrmEnabled(student, product) {
  if (isNestingComplete(student, product)) return true;
  const state = floorState(student, product);
  if (flagOn(state.enabled) || flagOn(state.crmEnabled)) return true;
  return product === 'kamuk' && flagOn(student && student.simulationEnabled);
}

function metricsFromFloor(state) {
  const started = Math.max(0, Number(state.started) || 0);
  const resolved = Math.max(0, Number(state.resolved) || 0);
  const handled = Math.max(0, Number(state.handled) || 0);
  const weeklyPoints = Math.max(0, Number(state.weeklyPoints) || 0);
  const qaTotal = Math.max(0, Number(state.qaTotal) || 0);
  return {
    started,
    resolved,
    handled,
    resolutionRate: started ? Math.round((resolved / started) * 100) : 0,
    qaAverage: handled ? Math.round(qaTotal / handled) : null,
    points: Math.max(0, Number(state.points) || 0),
    weeklyPoints,
    team: state.team || null,
    nestingCompletedAt: state.nestingCompletedAt || null,
    delayStrikes: Math.max(0, Number(state.delayStrikes) || 0),
    delayPenalty: Boolean(state.delayPenalty)
  };
}

function dispositionKind(disposition) {
  const text = clean(disposition, 120).toLowerCase();
  if (FOLLOW_DISPOSITIONS.test(text)) {
    if (/pending system|\bpsa\b/.test(text)) return 'psa';
    if (/awaiting action|\baa\b/.test(text)) return 'aa';
    return 'queue';
  }
  return 'resolved';
}

function listWorkItems(rows, product, weekKey) {
  return rows
    .filter((row) => String(row.id || '').startsWith('KHCRM-WI-' + product + '-' + weekKey + '-') && row.data && row.data.product === product)
    .map((row) => Object.assign({ id: row.id }, row.data));
}

function listTouches(rows, product, weekKey) {
  return rows
    .filter((row) => String(row.id || '').startsWith('KHCRM-TOUCH-' + product + '-' + weekKey + '-') && row.data && row.data.product === product)
    .map((row) => Object.assign({ id: row.id }, row.data));
}

function prizeFields(casePoints, integrityBlocked) {
  const eligible = casePoints >= PRIZE_SCORE && !integrityBlocked;
  return {
    competitionEligible: eligible,
    prizeEligible: eligible,
    prizeUsd: eligible ? PRIZE_USD : 0,
    qaScore: casePoints * 10,
    verdict: casePoints >= 9
      ? 'Corporate standard exceeded'
      : casePoints >= PRIZE_SCORE
        ? (eligible ? 'Prize standard met' : 'Quality high — prize blocked')
        : casePoints >= 5 ? 'Banking standard in range' : 'Coaching required'
  };
}

function scoreFromErrors(errors, extras) {
  const list = Array.isArray(errors) ? errors.slice(0, 10) : [];
  const casePoints = Math.max(0, 10 - list.length);
  const integrityBlocked = Boolean(extras && extras.integrityBlocked);
  return Object.assign({
    errors: list.map((item) => ({
      code: clean((item && item.code) || 'error', 40),
      label: clean((item && (item.label || item.code)) || 'Error', 120),
      evidence: clean((item && item.evidence) || '', 300)
    })),
    casePoints
  }, prizeFields(casePoints, integrityBlocked));
}

function mergeFloorErrors(primary, secondary) {
  const combined = [];
  const seen = new Set();
  [].concat(primary || [], secondary || []).forEach((item) => {
    const code = clean((item && item.code) || 'error', 40);
    if (seen.has(code)) return;
    seen.add(code);
    combined.push(item);
  });
  return combined.slice(0, 10);
}

function corpusFromSubmission(submission) {
  const email = (submission.events || []).find((event) => event.type === 'email' && event.body);
  const note = (submission.notes || [])[0];
  return {
    email,
    note,
    text: [
      email && email.body,
      typeof note === 'string' ? note : (note && (note.text || note.body)),
      submission.resolution && submission.resolution.summary,
      submission.resolution && submission.resolution.nextStep,
      submission.resolution && submission.resolution.disposition
    ].filter(Boolean).join(' ')
  };
}

function deterministicErrors(caseData, submission) {
  const errors = [];
  const keys = new Set((submission.actions || []).map((action) => action.key));
  (caseData.requiredActions || []).forEach((key) => {
    if (!keys.has(key)) errors.push({ code: 'missing-' + key, label: 'Missing control: ' + key.replace(/-/g, ' '), evidence: 'Required desk control was not evidenced in this touch.' });
  });
  (caseData.forbiddenActions || []).forEach((key) => {
    if (keys.has(key)) errors.push({ code: 'forbidden-' + key, label: 'Unsafe action: ' + key.replace(/-/g, ' '), evidence: 'A forbidden control appeared in the evidence trail.' });
  });
  const { email, note, text } = corpusFromSubmission(submission);
  const lower = text.toLowerCase();
  const emailBody = String((email && email.body) || '');
  const emailWords = wordCount(emailBody);
  const noteText = typeof note === 'string' ? note : String((note && (note.text || note.body)) || '');
  if (!email) errors.push({ code: 'missing-email', label: 'Missing client email', evidence: 'No outbound email was recorded for this touch.' });
  if (!noteText) errors.push({ code: 'missing-note', label: 'Missing interaction note', evidence: 'No brief internal note was recorded for this touch.' });
  if (email) {
    if (!/^(dear|hello|hi)\b/i.test(emailBody.trim())) {
      errors.push({ code: 'email-opening', label: 'Unnatural email opening', evidence: 'Client email should open with Dear, Hello or Hi.' });
    }
    const connectorHits = PROFESSIONAL_CONNECTORS.filter((word) => emailBody.toLowerCase().includes(word)).length;
    if (connectorHits < 2) {
      errors.push({ code: 'email-connector', label: 'Weak connector use', evidence: 'Use at least two professional connectors or linkers in the client email.' });
    }
    if (hitCount(emailBody.toLowerCase(), METHOD_PHRASES) < 1) {
      errors.push({ code: 'method-linker', label: 'Missing método linker', evidence: 'Use a linker from Linkers y expresiones — método in Recursos.' });
    }
    if (!hasTimedNext(emailBody)) {
      errors.push({ code: 'email-next-step', label: 'Missing timed next step in email', evidence: 'The email must include a timed next step.' });
    }
    if (emailWords < 45) {
      errors.push({ code: 'email-substance', label: 'Email too thin', evidence: 'Write a structured email with real substance (about 45+ words).' });
    }
  }
  if (noteText && wordCount(noteText) < 12) {
    errors.push({ code: 'note-substance', label: 'Thin documentation', evidence: 'The internal note needs facts, action and a next owner.' });
  }
  if (hitCount(lower, BANKING_TERMS) < 2) {
    errors.push({ code: 'language-terms', label: 'Thin professional language', evidence: 'Use banking terms from the Holdings glossary.' });
  }
  if (!AFFIX_FORMS.some((form) => lower.includes(form))) {
    errors.push({ code: 'language-affix', label: 'Missing prefix/suffix family', evidence: 'Use a prefix or suffix family form (verification, unauthorized, replacement…).' });
  }
  if (!/(because|therefore|as a result|although)/.test(lower) || !/(policy|procedure|evidence|timeline|because the)/.test(lower)) {
    errors.push({ code: 'explanation', label: 'Weak explanation', evidence: 'Explain why the chosen path is safe, using policy or evidence.' });
  }
  if (!/\b(i will|i own|follow up|operations|supervisor|next agent)\b/i.test(text) || !hasTimedNext(text)) {
    errors.push({ code: 'transition', label: 'Weak handoff', evidence: 'Name an owner and a timed next step so the next agent can continue.' });
  }
  if (/\b(i guarantee|you will win|instant refund|wire the money)\b/i.test(lower)) {
    errors.push({ code: 'overpromise', label: 'Unsafe over-promise', evidence: 'Do not guarantee outcomes or take forbidden shortcuts.' });
  }
  if (!errors.length && emailWords < 70) {
    errors.push({ code: 'exceptional-bar', label: 'Below exceptional standard', evidence: '10/10 needs extended professional writing; 8/10 still requires the full rubric.' });
  }
  return scoreFromErrors(errors.slice(0, 10));
}

function applyQualityGates(scored, gates) {
  const errors = (scored.errors || []).slice();
  if (gates && gates.delayPenalty) {
    errors.push({
      code: 'delay-strikes',
      label: 'Three idle pauses over 30 minutes today',
      evidence: 'Server recorded three gaps longer than 30 minutes on this Costa Rica calendar day.'
    });
  }
  if (gates && gates.integrity && gates.integrity.blockPrize) {
    errors.push({
      code: 'integrity-assist',
      label: 'AI/translator pattern',
      evidence: 'Server heuristics: ' + (gates.integrity.evidence || 'polished assist pattern')
    });
  }
  const next = scoreFromErrors(mergeFloorErrors(errors), {
    integrityBlocked: Boolean(gates && gates.integrity && gates.integrity.blockPrize)
  });
  return Object.assign({}, scored, next, {
    delayPenalty: Boolean(gates && gates.delayPenalty),
    integrity: (gates && gates.integrity) || { blockPrize: false, reasons: [] }
  });
}

function buildFloorAlicePrompt(caseData, submission, fallback, kind) {
  return 'You are Alice, Senior QA Director for Kamuk Holdings nesting floor.\n'
    + 'Score ONE agent touch from 10 points. Every distinct error deducts exactly 1 point.\n'
    + 'Be FAIR but strict. A student who writes professional English, uses the school método linkers (however, even though, in other words, as well as, which means, on the other hand…), phrasals and prefix/suffix forms, explains the policy, documents clearly and structures the email CAN reach 8/10. Generic complete work is 5–7. Terse empty writing fails. 10/10 is exceptional and rare. Prefer método language over random IELTS connector dumps.\n'
    + 'Also judge: resolution, language, explanation, simple execution, transitions, connectors, documentation, email structure, clarity.\n'
    + 'Return ONLY JSON: {"errors":[{"code":"short-code","label":"short label","evidence":"proof"}],"summary":"2 sentences","strengths":["max 4"],"improvements":["max 4"],"dimensions":{"Resolution":0-100,"Language":0-100,"Explanation":0-100,"Execution":0-100,"Transition":0-100,"Connectors":0-100,"Documentation":0-100,"Clarity":0-100}}\n'
    + 'Touch kind: ' + kind + '\n'
    + 'CASE:\n' + JSON.stringify({ id: caseData.id, type: caseData.type, brief: caseData.brief, expectedResolution: caseData.expectedResolution, requiredActions: caseData.requiredActions, forbiddenActions: caseData.forbiddenActions }) + '\n'
    + 'EVIDENCE:\n' + JSON.stringify(submission) + '\n'
    + 'CONTROL PRECHECK:\n' + JSON.stringify(fallback);
}

function normalizeFloorEvaluation(value, fallback, gates) {
  const merged = mergeFloorErrors(value && value.errors, fallback && fallback.errors);
  const scored = applyQualityGates(scoreFromErrors(merged.length ? merged : (fallback && fallback.errors) || []), gates || {});
  const dimensions = (value && value.dimensions) || {};
  const bounded = (number) => Math.max(0, Math.min(100, Math.round(Number(number) || 0)));
  const fallbackDim = scored.casePoints * 10;
  return Object.assign({}, scored, {
    summary: clean((value && value.summary) || (fallback && fallback.summary) || scored.verdict, 700),
    strengths: (Array.isArray(value && value.strengths) ? value.strengths : (fallback && fallback.strengths) || []).slice(0, 4).map((item) => clean(item, 180)),
    improvements: (Array.isArray(value && value.improvements) ? value.improvements : (fallback && fallback.improvements) || []).slice(0, 4).map((item) => clean(item, 180)),
    dimensions: {
      Resolution: bounded(dimensions.Resolution != null ? dimensions.Resolution : dimensions.Judgment != null ? dimensions.Judgment : fallbackDim),
      Language: bounded(dimensions.Language != null ? dimensions.Language : dimensions.English != null ? dimensions.English : 70),
      Explanation: bounded(dimensions.Explanation != null ? dimensions.Explanation : 70),
      Execution: bounded(dimensions.Execution != null ? dimensions.Execution : dimensions.Compliance != null ? dimensions.Compliance : fallbackDim),
      Transition: bounded(dimensions.Transition != null ? dimensions.Transition : 70),
      Connectors: bounded(dimensions.Connectors != null ? dimensions.Connectors : 70),
      Documentation: bounded(dimensions.Documentation != null ? dimensions.Documentation : 70),
      Clarity: bounded(dimensions.Clarity != null ? dimensions.Clarity : 70)
    },
    pointsAwarded: scored.competitionEligible ? scored.casePoints : 0,
    pendingEvaluation: false
  });
}

function pendingEvaluationResult(fallback) {
  return Object.assign({}, fallback, {
    pendingEvaluation: true,
    pointsAwarded: 0,
    competitionEligible: false,
    prizeEligible: false,
    prizeUsd: 0,
    summary: 'AI evaluation is pending. This touch is saved for Alice scoring and will not add competition points until evaluated.',
    verdict: 'Pending evaluation'
  });
}

function pickWeeklyWinner(board) {
  const row = (board || []).find((item) => (Number(item.weeklyPoints) || 0) > 0);
  return row ? Object.assign({}, row, { prizeUsd: PRIZE_USD, prizeScore: PRIZE_SCORE }) : null;
}

function leaderboardFromTouches(touches, studentsById) {
  const byStudent = new Map();
  touches.forEach((touch) => {
    if (touch.pendingEvaluation) return;
    const id = touch.studentId;
    if (!id) return;
    const current = byStudent.get(id) || {
      studentId: id,
      name: touch.studentName || (studentsById.get(id) && studentsById.get(id).info && studentsById.get(id).info.name) || id,
      weeklyPoints: 0,
      resolved: 0,
      handled: 0,
      started: 0,
      scoreTotal: 0
    };
    current.handled += 1;
    current.started += 1;
    if (touch.kind === 'resolved') current.resolved += 1;
    const pts = Number(touch.evaluation && touch.evaluation.casePoints) || 0;
    current.scoreTotal += pts;
    if (touch.evaluation && touch.evaluation.competitionEligible) current.weeklyPoints += pts;
    byStudent.set(id, current);
  });
  return [...byStudent.values()]
    .map((row) => Object.assign({}, row, {
      resolutionRate: row.started ? Math.round((row.resolved / row.started) * 100) : 0,
      averageScore: row.handled ? Math.round((row.scoreTotal / row.handled) * 10) / 10 : 0,
      prizeEligible: (Number(row.weeklyPoints) || 0) > 0
    }))
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints || b.resolved - a.resolved || b.averageScore - a.averageScore || String(a.name).localeCompare(String(b.name)))
    .map((row, index) => Object.assign({}, row, { rank: index + 1 }));
}

function hasTouchEvidence(events, acceptedAt, type) {
  const start = acceptedAt ? new Date(acceptedAt).getTime() : 0;
  return (events || []).some((event) => {
    if (event.type !== type) return false;
    const at = event.at ? new Date(event.at).getTime() : 0;
    return !start || at >= start - 1000;
  });
}

module.exports = {
  HOME_CASES,
  REQUIRED_DONE,
  COURSE_CHECKS,
  CERT_BANK,
  QUIZ_PASS_RATE,
  PRIZE_SCORE,
  PRIZE_USD,
  DELAY_GAP_MS,
  DELAY_STRIKE_LIMIT,
  HOME_WORD_MIN,
  HOME_WORD_MAX,
  passingCoursePayload,
  gradeCourseChecks,
  gradeCertification,
  gradeHomeAnswer,
  homeAnswerReady,
  detectAssistSignals,
  applyActivityHeartbeat,
  applyQualityGates,
  crDateKey,
  wordCount,
  pack,
  templateMap,
  clean,
  productForStudent,
  sessionsTable,
  studentsTable,
  holdingsKey,
  weekKeyCR,
  workItemId,
  claimLockId,
  validateTrainingProgress,
  floorState,
  isNestingComplete,
  rulesAcceptedThisWeek,
  deskGuideDoneThisWeek,
  deskGuideDoneList,
  deskGuideAllComplete,
  isCrmEnabled,
  metricsFromFloor,
  dispositionKind,
  listWorkItems,
  listTouches,
  scoreFromErrors,
  mergeFloorErrors,
  deterministicErrors,
  buildFloorAlicePrompt,
  normalizeFloorEvaluation,
  pendingEvaluationResult,
  pickWeeklyWinner,
  leaderboardFromTouches,
  hasTouchEvidence,
  crypto
};
