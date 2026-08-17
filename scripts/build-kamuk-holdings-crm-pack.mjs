/**
 * Builds an authoritative Kamuk Holdings CRM pack from the lean source cases.
 * Run: node scripts/build-kamuk-holdings-crm-pack.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('kamuk/data');
const sourcePath = path.join(root, 'kamuk-holdings-crm-pack-v1.json');
const pack = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const VOICES = {
  female: 'NoOVOzCQFLOvtsMoNcdT',
  male: 'bfGb7JTLUnZebZRiFYyq'
};

const CITY = {
  CR: { city: 'San José', lat: 9.9281, lng: -84.0907 },
  US: { city: 'Miami', lat: 25.7617, lng: -80.1918 },
  PA: { city: 'Panama City', lat: 8.9824, lng: -79.5199 },
  MX: { city: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  KY: { city: 'George Town', lat: 19.2869, lng: -81.3674 },
  CH: { city: 'Zurich', lat: 47.3769, lng: 8.5417 },
  SG: { city: 'Singapore', lat: 1.3521, lng: 103.8198 }
};

const PERSONALITY = {
  'KH-1042': { traits: ['direct', 'time-pressured', 'fair'], baselineMood: 'distressed', negotiationStyle: 'demands ownership and a timed fix', goals: ['unfreeze account before 5 PM', 'document bank liability', 'waive decline fees'], moodTriggers: { escalate: 'furious', acknowledge: 'cautious', delay: 'impatient' }, voiceGender: 'female' },
  'KH-1051': { traits: ['formal', 'urgent', 'protective of staff'], baselineMood: 'furious', negotiationStyle: 'needs Level 3 escalation and a realistic ETA', goals: ['release payroll wire', 'protect 45 employees', 'get trace reference'], moodTriggers: { escalate: 'relieved', promise: 'skeptical', delay: 'furious' }, voiceGender: 'male' },
  'KH-1064': { traits: ['VIP', 'prestige-sensitive', 'decisive'], baselineMood: 'indignant', negotiationStyle: 'expects director-level recovery', goals: ['restore card', 'retain relationship', 'personal apology'], moodTriggers: { retention: 'calming', blame: 'furious', policy: 'cold' }, voiceGender: 'male' },
  'KH-1084': { traits: ['internal-only', 'compliance'], baselineMood: 'review mode', negotiationStyle: 'no client contact — SAR protocol', goals: ['classify placement', 'file SAR', 'escalate Compliance'], moodTriggers: {}, voiceGender: 'male' },
  'KH-1090': { traits: ['persuasive', 'impatient', 'evasive'], baselineMood: 'impatient', negotiationStyle: 'pushes for immediate release without tipping off', goals: ['release wires', 'appear legitimate'], moodTriggers: { hold: 'cold', tipoff: 'suspicious', escalate: 'worried' }, voiceGender: 'female' },
  'KH-1102': { traits: ['collaborative', 'growth-oriented'], baselineMood: 'expectant', negotiationStyle: 'open to product fit with clear next step', goals: ['receive expansion loan proposal', 'compare facilities'], moodTriggers: { discovery: 'pleasant', promise: 'skeptical' }, voiceGender: 'male' },
  'KH-1110': { traits: ['internal-credit', 'ethical'], baselineMood: 'review mode', negotiationStyle: 'document independently against pressure', goals: ['pause approval', 'request EDD', 'escalate'], moodTriggers: {}, voiceGender: 'male' },
  'KH-1120': { traits: ['VIP', 'precise', 'demanding excellence'], baselineMood: 'demanding', negotiationStyle: 'expects confirmed itinerary tonight', goals: ['aviation + ground transport', 'lounge access', 'confirmed plan'], moodTriggers: { confirm: 'pleasant', vague: 'impatient' }, voiceGender: 'female' }
};

function seed(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  return () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
}

function enrichTx(tx, client, caseId, index) {
  const rand = seed(`${caseId}-${tx.description}-${index}`);
  const geo = CITY[tx.country] || CITY.CR;
  const abs = Math.abs(tx.amount);
  const isCredit = tx.amount >= 0;
  const isCard = /hotel|setai|dining|travel|card|amazon|marriott|hilton|aviation/i.test(tx.description);
  const card = client.cards?.[index % Math.max(1, client.cards?.length || 1)];
  const taxRate = tx.country === 'US' ? 0.07 : tx.country === 'MX' ? 0.16 : 0.13;
  const tax = isCredit || tx.status === 'Declined' ? 0 : Math.round(abs * (isCard ? taxRate : 0) * 100) / 100;
  const fee = tx.status === 'Declined' ? 0 : (/wire/i.test(tx.description) ? 45 : isCard ? 0 : 0);
  const subtotal = isCredit ? abs : Math.max(0, abs - tax - fee);
  const lines = [];
  if (isCredit) {
    lines.push({ label: 'Gross amount received', amount: abs });
    lines.push({ label: 'Incoming fee', amount: 0 });
    lines.push({ label: 'Tax', amount: 0 });
  } else {
    lines.push({ label: 'Subtotal', amount: subtotal });
    if (tax) lines.push({ label: `Tax / IVA (${Math.round(taxRate * 100)}%)`, amount: tax });
    if (fee) lines.push({ label: 'Processing / wire fee', amount: fee });
    if (tx.status === 'Declined') lines.push({ label: 'Bank charge', amount: 0 });
  }
  return {
    id: `TXN-${caseId}-${1000 + index}`,
    date: tx.date,
    datetime: `${tx.date}, 2026 · ${10 + Math.floor(rand() * 8)}:${String(Math.floor(rand() * 60)).padStart(2, '0')} ${rand() > 0.5 ? 'AM' : 'PM'}`,
    description: tx.description,
    merchant: tx.description.replace(/^(Supplier|Wire|Client|Cash deposit|Incoming|Payroll|Debt|Materials|Restaurant|Office|Cloud|Lease|Portfolio|Capital|Private|Corporate|Executive|Food|Receivables)[ —-]*/i, '').trim() || tx.description,
    category: isCredit ? 'Incoming payment' : isCard ? 'Card purchase' : /wire|transfer/i.test(tx.description) ? 'Wire transfer' : /payroll/i.test(tx.description) ? 'Payroll' : 'Operating payment',
    country: tx.country,
    city: geo.city,
    lat: geo.lat + (rand() - 0.5) * 0.04,
    lng: geo.lng + (rand() - 0.5) * 0.04,
    channel: isCard ? 'POS · Card present' : /wire/i.test(tx.description) ? 'SWIFT / wire desk' : /cash/i.test(tx.description) ? 'Branch cash window' : 'Corporate account rail',
    terminal: isCard ? `POS-${Math.floor(100000 + rand() * 899999)}` : null,
    amount: tx.amount,
    currency: 'USD',
    status: tx.status,
    authorization: tx.status === 'Declined' ? 'DECLINED' : tx.status === 'Held' || tx.status === 'Flagged' || tx.status === 'Review' ? 'PENDING REVIEW' : 'APPROVED',
    reference: `REF-${caseId.slice(-4)}-${8800 + index}`,
    account: `Corporate account ${client.id}`,
    card: card ? `${card.name} *${card.last4}` : null,
    taxLines: lines,
    totalLabel: tx.status === 'Declined' ? '$0.00 charged' : `${tx.amount >= 0 ? '+' : '-'}$${abs.toLocaleString('en-US')} ${tx.status.toLowerCase()}`,
    note: tx.status === 'Declined'
      ? `Transaction declined while the account is under ${client.status.toLowerCase()}. No funds moved. Document bank or client liability in the case resolution.`
      : tx.status === 'Held' || tx.status === 'Flagged' || tx.status === 'Review'
        ? 'Held for compliance or operational review. Do not tip off the client if this is an AML case.'
        : 'Settled through Kamuk Holdings rails. Counterparty on file.',
    flags: tx.status === 'Declined' ? ['DECLINED', 'Review liability'] : tx.status === 'Held' ? ['HELD', 'Awaiting desk'] : []
  };
}

const MERCHANTS = [
  { name: 'Grand Marriott Escazú', descriptor: 'MARRIOTT ESCAZU 4432', category: 'Travel & lodging', mcc: '7011 · Lodging', country: 'CR', channel: 'POS · Card present', phone: '+506 2298-0000', site: 'marriott-escazu.cr', address: 'Escazú, San José', min: 240, max: 1450 },
  { name: 'Copa Airlines', descriptor: 'CM AIRLINE 2308871', category: 'Travel & lodging', mcc: '3063 · Airline', country: 'PA', channel: 'Ecommerce · Card not present', phone: '+507 217-2672', site: 'copaair.com', address: 'Panama City, PA', min: 420, max: 2600 },
  { name: 'Hertz Rent A Car', descriptor: 'HERTZ 8841 MIA', category: 'Travel & lodging', mcc: '7512 · Car rental', country: 'US', channel: 'POS · Card present', phone: '+1 800 654-3131', site: 'hertz.com', address: 'Miami International, US', min: 180, max: 940 },
  { name: 'Uber Trip', descriptor: 'UBER *TRIP HELP.UBER.COM', category: 'Transport', mcc: '4121 · Ride hailing', country: 'CR', channel: 'Ecommerce · Recurring token', phone: '—', site: 'help.uber.com', address: 'San José, CR', min: 8, max: 62 },
  { name: 'Restaurante Casa Luna', descriptor: 'REST CASA LUNA SJO', category: 'Dining & entertainment', mcc: '5812 · Restaurant', country: 'CR', channel: 'POS · Card present', phone: '+506 2280-4411', site: 'casaluna.cr', address: 'Barrio Escalante, San José', min: 45, max: 380 },
  { name: 'Café Britt Corporate', descriptor: 'CAFE BRITT 118', category: 'Dining & entertainment', mcc: '5814 · Coffee shop', country: 'CR', channel: 'POS · Contactless', phone: '+506 2277-1500', site: 'cafebritt.com', address: 'Heredia, CR', min: 9, max: 74 },
  { name: 'AWS Cloud Services', descriptor: 'AMAZON WEB SERVICES AWS.AMAZON.CO', category: 'Software & cloud', mcc: '7372 · Software', country: 'US', channel: 'Ecommerce · Recurring subscription', phone: '+1 206 266-4064', site: 'aws.amazon.com', address: 'Seattle, US', min: 310, max: 2400 },
  { name: 'Microsoft 365 Business', descriptor: 'MSFT * E0400ABCD', category: 'Software & cloud', mcc: '5734 · Software', country: 'US', channel: 'Ecommerce · Recurring subscription', phone: '+1 800 642-7676', site: 'microsoft.com', address: 'Redmond, US', min: 120, max: 780 },
  { name: 'Meta Ads', descriptor: 'FACEBK *ADS 7YH2K', category: 'Advertising', mcc: '7311 · Advertising', country: 'US', channel: 'Ecommerce · Card not present', phone: '—', site: 'business.facebook.com', address: 'Menlo Park, US', min: 150, max: 1900 },
  { name: 'Office Depot Corporate', descriptor: 'OFFICE DEPOT 0142 CR', category: 'Office & supplies', mcc: '5943 · Office supplies', country: 'CR', channel: 'POS · Card present', phone: '+506 2519-2000', site: 'officedepot.co.cr', address: 'La Uruca, San José', min: 35, max: 620 },
  { name: 'Auto Mercado', descriptor: 'AUTOMERCADO 22 SJO', category: 'Groceries & catering', mcc: '5411 · Grocery', country: 'CR', channel: 'POS · Contactless', phone: '+506 2519-6000', site: 'automercado.cr', address: 'Sabana, San José', min: 60, max: 540 },
  { name: 'Servicentro La Uruca', descriptor: 'SERVICENTRO LA URUCA', category: 'Fuel & fleet', mcc: '5541 · Service station', country: 'CR', channel: 'POS · Card present', phone: '+506 2256-7788', site: '—', address: 'La Uruca, San José', min: 40, max: 210 },
  { name: 'Kölbi Business Telecom', descriptor: 'ICE KOLBI EMPRESAS', category: 'Telecom & utilities', mcc: '4814 · Telecom', country: 'CR', channel: 'Recurring · Direct debit', phone: '+506 1193', site: 'kolbi.cr', address: 'San José, CR', min: 85, max: 460 },
  { name: 'DHL Express', descriptor: 'DHL EXPRESS 991244', category: 'Logistics & freight', mcc: '4215 · Courier', country: 'CR', channel: 'Ecommerce · Card not present', phone: '+506 2209-0000', site: 'dhl.com', address: 'Alajuela, CR', min: 55, max: 890 },
  { name: 'EPA Ferretería', descriptor: 'EPA CURRIDABAT 07', category: 'Maintenance & hardware', mcc: '5200 · Hardware', country: 'CR', channel: 'POS · Card present', phone: '+506 2588-1000', site: 'epa.cr', address: 'Curridabat, San José', min: 48, max: 720 },
  { name: 'Clínica Bíblica', descriptor: 'HOSP CLINICA BIBLICA', category: 'Health & insurance', mcc: '8062 · Hospital', country: 'CR', channel: 'POS · Card present', phone: '+506 2522-1000', site: 'clinicabiblica.com', address: 'San José, CR', min: 90, max: 1100 },
  { name: 'Amazon Business', descriptor: 'AMZN Mktp US*2K84L', category: 'E-commerce', mcc: '5942 · Online retail', country: 'US', channel: 'Ecommerce · Card not present', phone: '+1 888 280-4331', site: 'amazon.com', address: 'Seattle, US', min: 25, max: 1250 },
  { name: 'Zurich Advisory Group', descriptor: 'ZURICH ADVISORY GMBH', category: 'Professional services', mcc: '8931 · Consulting', country: 'CH', channel: 'Ecommerce · Card not present', phone: '+41 44 628-8800', site: 'zurichadvisory.ch', address: 'Zurich, CH', min: 600, max: 3400 }
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LEDGER_TODAY = new Date(2026, 7, 16);

function ledgerDate(daysAgo) {
  const d = new Date(LEDGER_TODAY.getTime() - daysAgo * 86400000);
  return { label: `${MONTHS[d.getMonth()]} ${d.getDate()}`, iso: d.toISOString().slice(0, 10), day: d.getDate(), month: d.getMonth() };
}

function buildCardLedger(c, kase) {
  const rand = seed(`${c.id}-ledger`);
  const cards = c.cards && c.cards.length ? c.cards : [{ name: 'Corporate card', last4: '0000' }];
  const frozen = /freeze|hold|flag/i.test(c.status || '');
  const rows = [];
  let counter = 0;

  const push = (merchant, daysAgo, amount, status, extra = {}) => {
    const date = ledgerDate(daysAgo);
    const card = cards[counter % cards.length];
    const geo = CITY[merchant.country] || CITY.CR;
    const abs = Math.abs(amount);
    const isCredit = amount > 0;
    const taxRate = merchant.country === 'US' ? 0.07 : merchant.country === 'CH' ? 0.077 : 0.13;
    const tax = isCredit || status === 'Declined' ? 0 : Math.round(abs * taxRate * 100) / 100;
    const foreign = merchant.country !== 'CR' && !isCredit && status !== 'Declined' ? Math.round(abs * 0.03 * 100) / 100 : 0;
    const lines = isCredit
      ? [{ label: 'Refunded amount', amount: abs }, { label: 'Tax reversed', amount: Math.round(abs * taxRate * 100) / 100 }]
      : [{ label: 'Subtotal', amount: Math.max(0, Math.round((abs - tax - foreign) * 100) / 100) },
         { label: `Tax / VAT (${Math.round(taxRate * 100)}%)`, amount: tax },
         ...(foreign ? [{ label: 'Foreign transaction fee (3%)', amount: foreign }] : [])];
    counter += 1;
    rows.push({
      id: `CTX-${kase.id}-${3000 + counter}`,
      date: date.label,
      isoDate: date.iso,
      datetime: `${date.label}, 2026 · ${String(7 + Math.floor(rand() * 14)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`,
      description: isCredit ? `Refund — ${merchant.name}` : merchant.name,
      merchant: merchant.name,
      descriptor: merchant.descriptor,
      merchantCategory: merchant.mcc,
      merchantPhone: merchant.phone,
      merchantSite: merchant.site,
      merchantAddress: merchant.address,
      category: merchant.category,
      country: merchant.country,
      city: geo.city,
      lat: geo.lat + (rand() - 0.5) * 0.05,
      lng: geo.lng + (rand() - 0.5) * 0.05,
      channel: merchant.channel,
      terminal: /POS/.test(merchant.channel) ? `POS-${Math.floor(100000 + rand() * 899999)}` : `ECOM-${Math.floor(10000 + rand() * 89999)}`,
      amount: isCredit ? abs : -abs,
      currency: 'USD',
      status,
      authorization: status === 'Declined' ? 'DECLINED' : status === 'Pending' ? 'AUTHORISED — NOT SETTLED' : status === 'Disputed' ? 'UNDER DISPUTE' : 'APPROVED',
      reference: `REF-${String(kase.id).slice(-4)}-${5000 + counter}`,
      account: `Corporate account ${c.id}`,
      card: `${card.name} *${card.last4}`,
      taxLines: lines,
      totalLabel: status === 'Declined' ? '$0.00 charged' : `${isCredit ? '+' : '-'}$${abs.toLocaleString('en-US')} ${status.toLowerCase()}`,
      disputeWindow: daysAgo <= 120 ? `Within the 120-day dispute window (day ${daysAgo})` : 'Outside the dispute window',
      note: extra.note || (status === 'Declined'
        ? `Declined at the terminal while the account is under ${String(c.status || 'review').toLowerCase()}. No funds moved.`
        : status === 'Pending'
          ? 'Authorised but not settled. The final amount can still change until the merchant captures it.'
          : isCredit
            ? 'Merchant refund credited to the card. Refunds settle in 3 to 5 business days.'
            : 'Settled card purchase. Ask the client to check the statement descriptor before opening a dispute.'),
      flags: extra.flags || (status === 'Declined' ? ['DECLINED'] : status === 'Disputed' ? ['DISPUTED', 'Provisional credit pending'] : []),
      ...extra.fields
    });
  };

  const pick = (i) => MERCHANTS[Math.floor(rand() * MERCHANTS.length + i) % MERCHANTS.length];
  const amountFor = (m) => Math.round(m.min + rand() * (m.max - m.min));

  for (let i = 0; i < 30; i++) {
    const merchant = pick(i);
    const daysAgo = Math.min(59, Math.max(0, Math.round(i * 1.9 + rand() * 1.4)));
    let status = 'Cleared';
    if (i % 11 === 4) status = 'Pending';
    if (frozen && i % 13 === 6) status = 'Declined';
    push(merchant, daysAgo, -amountFor(merchant), status);
  }

  // duplicate charge — the classic dispute drill
  const dup = MERCHANTS[3];
  const dupAmount = amountFor(dup);
  push(dup, 9, -dupAmount, 'Cleared', { note: 'First of two identical authorisations from the same merchant on the same day.' });
  push(dup, 9, -dupAmount, 'Disputed', { note: 'Duplicate charge reported by the client. Same merchant, same amount, same day. Provisional credit applied while the merchant responds.', flags: ['DUPLICATE', 'Provisional credit applied'] });

  // merchant refunds
  const refundA = MERCHANTS[16];
  push(refundA, 22, -amountFor(refundA), 'Cleared', { note: 'Original purchase later returned by the client.' });
  const purchase = rows[rows.length - 1];
  push(refundA, 15, Math.abs(purchase.amount), 'Refunded', { note: `Merchant refund for reference ${purchase.reference}. Credited to the same card.`, fields: { originalRef: purchase.reference } });
  const refundB = MERCHANTS[1];
  push(refundB, 34, amountFor(refundB), 'Refunded', { note: 'Airline cancellation refund credited back to the card within the ticket rules.' });

  // unrecognised charge — descriptor training
  const ghost = MERCHANTS[8];
  push(ghost, 5, -amountFor(ghost), 'Disputed', { note: 'Client does not recognise the descriptor. Check the descriptor against the merchant trading name before raising a chargeback.', flags: ['NOT RECOGNISED', 'Descriptor check'] });

  return rows.sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0));
}

function buildExtras(c, kase, persona) {
  const rand = seed(c.id);
  const digits = String(c.id).replace(/\D/g, '').slice(-6);
  const outflow = (c.spending || []).reduce((s, x) => s + x.value, 0) || 50000;
  const onTime = Math.max(62, Math.min(99, 100 - Math.round((c.risk?.credit || 20) / 2)));

  const services = (c.products || []).map((product, i) => {
    const isCard = /card|obsidian|platinum|visa|reserve|executive/i.test(product);
    const isLoan = /loan|capital|facility|finance|equipment/i.test(product);
    return {
      group: isCard ? 'Cards' : isLoan ? 'Loans' : 'Accounts & services',
      name: product,
      status: i === 0 && !/Active|Opportunity|Service/i.test(c.status) ? c.status : 'Active',
      detail: isCard
        ? `**** ${c.cards?.[i % (c.cards?.length || 1)]?.last4 || '0000'} · ${c.cards?.[0]?.limit || 'Facility limit'}`
        : isLoan
          ? `Remaining exposure linked to ${c.creditLimit.toLocaleString('en-US')} facility`
          : `Account ${c.id} · Balance $${c.balance.toLocaleString('en-US')}`
    };
  });
  services.push({ group: 'Insurance & other', name: 'Business continuity insurance', status: 'Active', detail: `Coverage $${c.creditLimit.toLocaleString('en-US')} · Premium $420/mo` });
  services.push({ group: 'Insurance & other', name: 'International wire access', status: /freeze|hold/i.test(c.status) ? 'Suspended' : 'Active', detail: 'SWIFT · 14 countries' });

  const invoices = [
    { id: `INV-2026-${digits.slice(-3)}-1`, description: 'Monthly service fee', due: 'Aug 30', amount: 425, status: 'Pending', taxLines: [{ label: 'Base fee', amount: 350 }, { label: 'Modules', amount: 50 }, { label: 'IVA 13%', amount: 25 }], note: 'Corporate plan invoice. Auto-debit scheduled.' },
    { id: `INV-2026-${digits.slice(-3)}-2`, description: 'Facility / programme fee', due: 'Aug 10', amount: Math.round(c.creditLimit * 0.012), status: 'Paid', taxLines: [{ label: 'Programme', amount: Math.round(c.creditLimit * 0.012) }], note: 'Paid on schedule.' },
    { id: `INV-2026-INS`, description: 'Insurance premium', due: 'Aug 1', amount: 420, status: 'Paid', taxLines: [{ label: 'Base premium', amount: 372 }, { label: 'Broker fee', amount: 28 }, { label: 'IVA', amount: 52 }, { label: 'Discount', amount: -32 }], note: 'Policy renewal January 2027.' }
  ];

  const fees = (c.transactions || []).filter(t => ['Declined', 'Held', 'Flagged', 'Review'].includes(t.status)).map((t, i) => ({
    id: `FEE-${i + 1}`,
    type: t.status === 'Declined' ? 'Rejected payment — operational review' : `${t.status} transaction fee`,
    detail: `${t.date} · ${t.description}`,
    amount: t.status === 'Declined' ? 0 : 45,
    liability: t.status === 'Declined' ? 'Bank' : 'Under review',
    status: t.status === 'Declined' ? 'Bank liable' : 'Open'
  }));
  fees.push({ id: 'FEE-WIRE', type: 'International wire transfer fee', detail: 'Aug 12 · SWIFT correspondent', amount: 45, liability: 'Client', status: 'Charged' });
  fees.push({ id: 'FEE-MAINT', type: 'Monthly maintenance fee', detail: 'Recurring · corporate standard', amount: 25, liability: 'Client', status: 'Recurring' });
  fees.push({ id: 'FEE-LATE-JUL', type: 'Late payment fee — July statement', detail: 'Jul 28 · payment received 6 days after the due date', amount: 39, liability: 'Client', status: 'Charged' });
  fees.push({ id: 'FEE-LATE-JUN', type: 'Late payment fee — June statement', detail: 'Jun 29 · payment received 2 days after the due date', amount: 39, liability: 'Client', status: 'Waived' });
  fees.push({ id: 'FEE-INT', type: 'Interest charge — revolving balance', detail: `Aug 1 · ${onTime}% on-time payment history`, amount: Math.max(48, Math.round(c.creditLimit * 0.0009)), liability: 'Client', status: 'Charged' });
  fees.push({ id: 'FEE-FX', type: 'Foreign transaction fees (3%)', detail: 'Aug cycle · card purchases outside Costa Rica', amount: 96, liability: 'Client', status: 'Charged' });
  if ((c.creditLimit - c.available) / Math.max(1, c.creditLimit) > 0.9) {
    fees.push({ id: 'FEE-OVER', type: 'Over-limit fee', detail: 'Aug 9 · facility utilisation above 90%', amount: 55, liability: 'Client', status: 'Charged' });
  }
  fees.push({ id: 'FEE-CARD', type: 'Card replacement fee', detail: 'Jul 12 · replacement issued after damage', amount: 15, liability: 'Client', status: 'Waived' });

  const emails = [
    { id: 'EM-1', direction: 'inbound', from: c.email, to: 'relationship.desk@kamukholdings.com', date: 'Today, 9:02 AM', subject: `URGENT: ${kase.title}`, body: `${kase.clientStatement}\n\nPlease treat this as priority ${kase.priority}.\n\n— ${c.name}`, preview: kase.clientStatement, urgent: true },
    { id: 'EM-2', direction: 'outbound', from: 'relationship.desk@kamukholdings.com', to: c.email, date: 'Today, 9:05 AM', subject: `We have registered your case ${kase.id}`, body: `Dear ${c.name.split(' ')[0]},\n\nYour case has been assigned to the Corporate Banking Desk. A dedicated executive will follow up with a timed next step.\n\nRegards,\nKamuk Holdings`, preview: 'Your case has been assigned to the Corporate Banking Desk.' },
    { id: 'EM-3', direction: 'inbound', from: c.email, to: 'relationship.desk@kamukholdings.com', date: 'Aug 8, 11:20 AM', subject: 'Re: Facility review', body: 'Thank you for the information. I would prefer the fixed-rate option and would also like to discuss increasing the limit.', preview: 'I would prefer the fixed-rate option…' },
    { id: 'EM-4', direction: 'outbound', from: 'compliance@kamukholdings.com', to: c.email, date: 'Jul 25, 9:00 AM', subject: 'Annual KYC verification', body: 'As part of our annual compliance review under SUGEF regulations, we require updated documentation.', preview: 'Annual compliance review documentation required.' }
  ];

  const contacts = [
    { id: 'CT-1', channel: 'Inbound call', when: 'Today · 9:14 AM · 8 min', agent: 'Kamuk Holdings front desk', body: `${kase.clientStatement} Case logged as ${kase.id}. Client mood: ${persona.baselineMood}.`, status: 'Open' },
    { id: 'CT-2', channel: 'Email', when: 'Today · 9:02 AM', agent: c.email, body: 'Urgent inbound email with the same complaint. Auto-ack sent within 2 minutes.', status: 'Pending reply' },
    { id: 'CT-3', channel: 'In-person', when: 'Jul 15 · 45 min', agent: 'Relationship desk · HQ', body: `Portfolio review. Utilization discussed. Grade ${c.relationshipGrade}.`, status: 'Completed' },
    { id: 'CT-4', channel: 'Outbound call', when: 'Jun 28 · 12 min', agent: 'Card services', body: 'Follow-up on a prior dispute. Client requested clarity on provisional credit.', status: 'Completed' }
  ];

  const log = [
    { id: 'LG-1', who: 'Account opened', detail: `${c.company} · corporate onboarding complete`, time: `Mar ${2026 - Math.max(1, Math.round(c.relationshipYears))}`, icon: 'ti-check', tone: 'success' },
    { id: 'LG-2', who: 'KYC verified', detail: 'Documents reviewed by Compliance', time: 'Jan 2026', icon: 'ti-file', tone: 'accent' },
    { id: 'LG-3', who: `Facility approved — $${c.creditLimit.toLocaleString('en-US')}`, detail: `Grade ${c.relationshipGrade} · tier ${c.riskTier}`, time: 'Aug 2024', icon: 'ti-building-bank', tone: 'accent' },
    { id: 'LG-4', who: `${kase.type} registered — ${kase.id}`, detail: kase.brief, time: 'Today', icon: 'ti-alert-triangle', tone: 'danger' }
  ];

  const recommendations = [
    { level: 'critical', title: `Resolve ${kase.title.toLowerCase()}`, detail: `${kase.priority} · ${kase.slaMinutes}-minute SLA. Focus: ${kase.focus}.` },
    { level: c.risk.overall >= 70 ? 'critical' : 'watch', title: c.risk.overall >= 70 ? 'Escalate compliance review' : 'Maintain monitoring cadence', detail: `Composite exposure ${c.risk.overall}/100 · tier ${c.riskTier}.` },
    { level: 'growth', title: 'Relationship opportunity', detail: `${c.relationshipYears} years · balance $${c.balance.toLocaleString('en-US')} · grade ${c.relationshipGrade}.` }
  ];

  const cashflow = [];
  let bal = Math.round(c.balance * 0.55);
  const months = ['March', 'April', 'May', 'June', 'July', 'August'];
  months.forEach((month, i) => {
    const inflow = Math.round(outflow * (0.95 + rand() * 0.45));
    const out = Math.round(outflow * (0.82 + rand() * 0.28));
    bal += inflow - out;
    cashflow.push({ month, inflow, outflow: out, net: inflow - out, balance: i === 5 ? c.balance : bal });
  });

  const info = {
    personal: [
      { label: 'Full legal name', value: c.name, editable: true },
      { label: 'ID / Cédula', value: `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(2, 6)}`, editable: false },
      { label: 'Position', value: c.title, editable: true },
      { label: 'Client since', value: `${Math.max(1, Math.round(c.relationshipYears))} years on file`, editable: false }
    ],
    contact: [
      { label: 'Phone primary', value: c.phone, editable: true },
      { label: 'Email primary', value: c.email, editable: true },
      { label: 'Preferred channel', value: /VIP|Private|HNWI/i.test(c.segment) ? 'Direct relationship line' : 'Email + phone', editable: false },
      { label: 'Language', value: 'English / Spanish', editable: false }
    ],
    address: [
      { label: 'Street', value: `Av. Central ${100 + Math.floor(rand() * 800)}, San José`, editable: true },
      { label: 'Province', value: 'San José', editable: false },
      { label: 'Postal code', value: '10101', editable: true },
      { label: 'Country', value: 'Costa Rica', editable: false }
    ],
    business: [
      { label: 'Company', value: c.company, editable: false },
      { label: 'Cédula jurídica', value: `3-101-${digits}`, editable: false },
      { label: 'Industry', value: /logistic/i.test(c.company) ? 'Logistics' : /capital|asociados|legal/i.test(c.company) ? 'Professional services' : /hospitality|restaurant/i.test(c.company) ? 'Hospitality' : /trading/i.test(c.company) ? 'Trading' : 'Corporate services', editable: false },
      { label: 'Employees', value: String(Math.max(4, Math.round(c.balance / 3500))), editable: false }
    ]
  };

  const credit = {
    score: c.creditScore,
    band: c.creditScore >= 800 ? 'Excellent' : c.creditScore >= 700 ? 'Very good' : c.creditScore >= 600 ? 'Good' : 'Fair',
    description: `Tier ${c.riskTier} · grade ${c.relationshipGrade}. Composite exposure ${c.risk.overall}/100.`,
    factors: [
      { label: 'Payment history (35%)', pct: onTime, text: `${onTime}% on-time`, good: onTime >= 90 },
      { label: 'Credit utilization (30%)', pct: Math.min(99, Math.round(((c.creditLimit - c.available) / Math.max(1, c.creditLimit)) * 100)), text: 'Facility use', good: true },
      { label: 'Credit history (15%)', pct: Math.min(100, Math.round(c.relationshipYears * 10)), text: `${c.relationshipYears} years`, good: c.relationshipYears >= 3 },
      { label: 'Fraud exposure', pct: c.risk.fraud, text: `${c.risk.fraud}/100`, good: c.risk.fraud < 45 },
      { label: 'Operational exposure', pct: c.risk.operational, text: `${c.risk.operational}/100`, good: c.risk.operational < 45 },
      { label: 'Market exposure', pct: c.risk.market, text: `${c.risk.market}/100`, good: c.risk.market < 50 }
    ],
    aml: [
      { label: 'AML status', value: c.risk.overall >= 60 ? 'Under review' : 'Clear', good: c.risk.overall < 60 },
      { label: 'PEP flag', value: 'No', good: true },
      { label: 'Sanctions screening', value: c.risk.overall >= 60 ? 'Manual review' : 'Passed', good: c.risk.overall < 60 },
      { label: 'KYC status', value: c.risk.overall >= 60 ? 'Enhanced due diligence' : 'Verified', good: c.risk.overall < 60 }
    ],
    incidents: [
      { date: 'Aug 16', type: kase.type, status: 'Open' },
      { date: 'Mar 2025', type: 'Late payment', status: 'Resolved' },
      { date: 'Nov 2024', type: 'Card dispute', status: 'Resolved' }
    ]
  };

  const caseCardTx = (c.transactions || []).filter(t => /hotel|setai|dining|travel|card|aviation|amazon/i.test(t.description) || t.country === 'US').map((t, i) => {
    const enriched = enrichTx(t, c, kase.id, 200 + i);
    enriched.category = 'Card purchase';
    enriched.descriptor = String(enriched.merchant || enriched.description).toUpperCase().slice(0, 22);
    enriched.merchantCategory = '—';
    enriched.note = `${enriched.note} This is the transaction the case was raised for.`;
    return enriched;
  });
  const cardTx = [...caseCardTx, ...buildCardLedger(c, kase)];

  return { services, invoices, fees, emails, contacts, log, recommendations, cashflow, info, credit, onTime, cardTx, outflow };
}

const cases = pack.cases.map((kase) => {
  const persona = PERSONALITY[kase.id] || { traits: ['professional'], baselineMood: 'neutral', negotiationStyle: 'standard', goals: [], moodTriggers: {}, voiceGender: 'female' };
  const client = { ...kase.client };
  const extras = buildExtras(client, kase, persona);
  client.transactions = (client.transactions || []).map((tx, i) => enrichTx(tx, client, kase.id, i));
  client.cardTransactions = extras.cardTx;
  client.services = extras.services;
  client.invoices = extras.invoices;
  client.fees = extras.fees;
  client.emails = extras.emails;
  client.contacts = extras.contacts;
  client.accountLog = extras.log;
  client.recommendations = extras.recommendations;
  client.cashflow = extras.cashflow;
  client.information = extras.info;
  client.credit = extras.credit;
  client.onTimeRate = extras.onTime;
  client.personality = {
    traits: persona.traits,
    baselineMood: persona.baselineMood,
    negotiationStyle: persona.negotiationStyle,
    goals: persona.goals,
    moodTriggers: persona.moodTriggers,
    voiceId: VOICES[persona.voiceGender] || VOICES.female,
    voiceGender: persona.voiceGender
  };
  return { ...kase, mood: persona.baselineMood, client };
});

const out = {
  version: '1.1.0',
  institution: 'Kamuk Holdings',
  program: 'Corporate Banking Experience',
  teams: pack.teams,
  cases
};

fs.writeFileSync(sourcePath, JSON.stringify(out, null, 2));
console.log(`Wrote ${cases.length} cases → ${sourcePath}`);
console.log('Sample tx keys:', Object.keys(cases[0].client.transactions[0]).join(', '));
