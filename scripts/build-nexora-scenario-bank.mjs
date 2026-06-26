/**
 * Builds js/nexora-scenario-bank-data.js — 100 scenarios per type+industry pool.
 * Run: node scripts/build-nexora-scenario-bank.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../js/nexora-scenario-bank-data.js');
const POOL = 100;

const FIRST = ['James','Michael','William','David','Robert','Daniel','Christopher','Carlos','Brian','Kevin','Mark','Steven','Raj','Arjun','Vikram','Margaret','Sarah','Elizabeth','Jennifer','Linda','Patricia','Sofia','Lisa','Amanda','Karen','Priya','Ananya','Emily','Jessica','Ashley','Nicole','Stephanie','Rebecca','Laura','Angela','Michelle','Melissa','Deborah','Rachel','Nancy','Susan','Maria','Diana','Victoria','Elena','Hannah','Olivia','Emma','Ava','Mia','Chloe','Grace','Natalie','Brooke','Taylor','Jordan','Alex','Casey','Morgan','Riley','Quinn','Harper','Aiden','Ethan','Noah','Liam','Mason','Logan','Jacob','Nathan','Tyler','Brandon','Justin','Ryan','Eric','Adam','Jason','Andrew','Joshua','Benjamin','Samuel','Gabriel','Lucas','Henry','Jack','Oliver','Leo','Max','Oscar','Felix','Victor','Adrian','Marco','Diego','Luis','Pablo','Andres','Sergio','Ricardo','Fernando','Alejandro','Hiro','Ken','Yuki','Min','Soo','Jin'];
const LAST = ['Thompson','Martinez','Johnson','Williams','Brown','Davis','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Garcia','Rodriguez','Lee','Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson','Hughes','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole','West','Jordan','Owens','Reynolds','Fisher','Ellis','Harrison','Gibson','McDonald','Cruz','Marshall','Ortiz','Gomez','Murray','Freeman','Wells','Webb','Simpson','Stevens','Tucker','Porter','Hunter','Hicks','Crawford','Henry','Boyd','Mason','Morales','Kennedy','Warren','Dixon','Ramos','Reyes','Burns','Gordon','Shaw','Holmes','Rice','Robertson','Hunt','Black','Daniels','Palmer','Mills','Nichols','Grant','Knight','Ferguson','Rose','Stone','Hawkins','Dunn','Perkins','Hudson','Spencer','Gardner','Stephens','Payne','Pierce','Berry','Matthews','Arnold','Wagner','Willis','Ray','Watkins','Olson','Carroll','Duncan','Snyder','Hart','Cunningham','Bradley','Lane','Andrews','Ruiz','Harper','Fox','Riley','Armstrong','Carpenter','Weaver','Greene','Lawrence','Elliott','Chavez','Sims','Austin','Peters','Kelley','Franklin','Lawson'];

const VOICES_M = [
  { id: 'bfGb7JTLUnZebZRiFYyq', accent: 'American Male', gender: 'male' },
  { id: 'NIkIuJZ8oQMuKZqwKtnm', accent: 'Chinese Male', gender: 'male' },
  { id: 'b4XCIIupgo5eH7TxhBNk', accent: 'German Male', gender: 'male' },
  { id: '8WqHCYyrnUqoK70Px5EJ', accent: 'Indian Male', gender: 'male' }
];
const VOICES_F = [
  { id: 'r1KmysJdVYZjJCm4mL3b', accent: 'American Female', gender: 'female' },
  { id: 'NoOVOzCQFLOvtsMoNcdT', accent: 'American Female', gender: 'female' },
  { id: '1a0nAYA3FcNQcMMfbddY', accent: 'Chinese Female', gender: 'female' },
  { id: 'ztyYYqlYMny7nllhThgo', accent: 'German Female', gender: 'female' },
  { id: 'NyZqLdjqUb8SpOUKIlWT', accent: 'Indian Female', gender: 'female' }
];

const STREETS = ['Oak St','Maple Ave','Cedar Ln','Pine Rd','Elm Blvd','Washington St','Lake Dr','Hill Ct','Park Way','River Rd'];
const CITIES = ['Portland OR','Seattle WA','Austin TX','Miami FL','Denver CO','Phoenix AZ','Atlanta GA','Boston MA','Chicago IL','Dallas TX'];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pad(n, w) { return String(n).padStart(w, '0'); }

function detPhone(id) {
  const h = hash(id);
  return `(${200 + (h % 800)}) ${100 + ((h >> 4) % 900)}-${1000 + ((h >> 8) % 9000)}`;
}

function detAccount(id, prefix) {
  return `${prefix}${100000 + (hash(id) % 900000)}`;
}

function detSsn4(id) { return pad(1000 + (hash(id + 'ssn') % 9000), 4); }

function detDate(id, offsetDays) {
  const d = new Date(Date.now() - (offsetDays || 3) * 86400000);
  return d.toLocaleDateString('en-US');
}

function moodAt(i) {
  return ['worried','frustrated','angry','impatient','anxious','disappointed','panicked','indignant','neutral','firm','pleasant','cold','furious','very_angry','professional'][i % 15];
}

function diffAt(i) { return 1 + (i % 5); }

function nameAt(i) {
  return { firstName: FIRST[i % FIRST.length], lastName: LAST[(i * 7 + 13) % LAST.length] };
}

function voiceAt(i) {
  const female = i % 2 === 1;
  const pool = female ? VOICES_F : VOICES_M;
  const v = pool[(i >> 1) % pool.length];
  return { gender: v.gender, voiceId: v.id, voiceAccent: v.accent };
}

function servicesFor(industry, i) {
  const catalogs = {
    Healthcare: [
      [{ name: 'Primary Care Plan', price: '$125.00/mo', desc: 'PCP visits and preventive care', icon: 'ti-heart-rate-monitor' }],
      [{ name: 'Specialist Rider', price: '$38.00/mo', desc: 'Specialist visit coverage', icon: 'ti-stethoscope' }, { name: 'Prescription Plus', price: '$22.00/mo', desc: 'Formulary benefit', icon: 'ti-pill' }],
      [{ name: 'Telehealth Access', price: '$9.99/mo', desc: '24/7 virtual visits', icon: 'ti-video' }],
      [{ name: 'Dental Vision Bundle', price: '$18.00/mo', desc: 'Dental and vision add-on', icon: 'ti-dental' }],
      [{ name: 'Family Plan', price: '$289.00/mo', desc: 'Household coverage', icon: 'ti-users' }]
    ],
    Finance: [
      [{ name: 'Checking Plus', price: '$12.00/mo', desc: 'Premium checking', icon: 'ti-building-bank' }],
      [{ name: 'Personal Loan', price: '$189.50/mo', desc: 'Fixed-rate loan', icon: 'ti-coin' }],
      [{ name: 'Investment IRA', price: '$15.00/mo', desc: 'Managed IRA', icon: 'ti-chart-line' }],
      [{ name: 'Credit Line', price: '$29.99/mo', desc: 'Revolving credit', icon: 'ti-credit-card' }]
    ],
    Banking: [
      [{ name: 'Premium Account', price: '$45.00/mo', desc: 'Full-service banking', icon: 'ti-building-bank' }],
      [{ name: 'Credit Card Plus', price: '$29.99/mo', desc: 'Rewards card', icon: 'ti-credit-card' }],
      [{ name: 'Fraud Shield Pro', price: '$4.99/mo', desc: 'Fraud monitoring', icon: 'ti-shield-check' }]
    ],
    Technology: [
      [{ name: 'Pro Suite License', price: '$49.00/mo', desc: 'Team subscription', icon: 'ti-device-laptop' }],
      [{ name: 'Cloud Storage 500GB', price: '$19.00/mo', desc: 'Secure backup', icon: 'ti-cloud' }],
      [{ name: 'API Business Tier', price: '$199.00/mo', desc: 'Production API access', icon: 'ti-api' }]
    ],
    Retail: [
      [{ name: 'Rewards Membership', price: '$12.99/mo', desc: 'Member pricing', icon: 'ti-award' }],
      [{ name: 'Protection Plan', price: '$8.99/mo', desc: 'Extended protection', icon: 'ti-shield-check' }]
    ],
    Tourism: [
      [{ name: 'Travel Protection', price: '$18.00/mo', desc: 'Trip cancellation cover', icon: 'ti-plane' }],
      [{ name: 'Loyalty Gold', price: '$0/mo', desc: 'Gold member perks', icon: 'ti-star' }]
    ],
    Corporate: [
      [{ name: 'Enterprise Support', price: '$299.00/mo', desc: 'Dedicated account team', icon: 'ti-building' }],
      [{ name: 'SaaS Platform', price: '$89.00/mo', desc: 'Business platform license', icon: 'ti-cloud' }]
    ],
    Education: [
      [{ name: 'Student Services Plan', price: '$35.00/mo', desc: 'Campus services bundle', icon: 'ti-school' }],
      [{ name: 'Online Portal Access', price: '$0/mo', desc: 'Learning portal', icon: 'ti-device-laptop' }],
      [{ name: 'Meal Plan Standard', price: '$420.00/sem', desc: 'Campus dining plan', icon: 'ti-tools-kitchen-2' }],
    ],
    Telecom: [
      [{ name: 'Unlimited Mobile', price: '$79.99/mo', desc: 'Unlimited talk, text and data', icon: 'ti-device-mobile' }],
      [{ name: 'Fiber Internet', price: '$59.99/mo', desc: '300 Mbps home internet', icon: 'ti-wifi' }],
      [{ name: 'TV Essentials', price: '$34.99/mo', desc: '120-channel cable package', icon: 'ti-tv' }],
    ],
  };
  const cat = catalogs[industry] || catalogs.Corporate;
  return cat[i % cat.length].map(s => ({ ...s }));
}

function crmExtras(industry, issueType, i, title) {
  const ref = `REF-${10000 + (i % 90000)}`;
  const base = { referenceId: ref, caseNumber: `CASE-${pad(i + 1, 4)}`, lastAgent: ['Maria G.', 'Tom K.', 'Sarah L.', 'James P.'][i % 4] };
  if (industry === 'Healthcare') {
    return { ...base, policyId: `BC-${pad(1000 + i, 4)}`, memberId: `M-${pad(500000 + i, 6)}`, providerName: ['Dr. Martinez', 'Dr. Chen', 'Dr. Patel', 'Dr. Wilson'][i % 4], claimId: `CLM-${ref}` };
  }
  if (industry === 'Finance') {
    return { ...base, accountType: ['Checking', 'Savings', 'Loan', 'Credit'][i % 4], branchCode: `BR-${pad(i % 99, 2)}` };
  }
  if (industry === 'Telecom') {
    return { ...base, lineId: `LN-${pad(1000 + i, 4)}`, accountPin: pad(1000 + (i % 9000), 4), deviceImei: `IMEI-${ref}` };
  }
  if (industry === 'Education') {
    return { ...base, studentId: `STU-${pad(500000 + i, 6)}`, termCode: 'FA2025', advisorName: ['Dr. Lee', 'Prof. Kim', 'Dr. Santos', 'Prof. Nguyen'][i % 4] };
  }
  if (industry === 'Technology') {
    return { ...base, ticketId: `TKT-${7700 + i}`, licenseKey: `LIC-${hash(title).toString(36).slice(0, 8).toUpperCase()}` };
  }
  if (industry === 'Retail') {
    return { ...base, orderId: `ORD-${88400 + i}`, sku: `SKU-${1000 + i}` };
  }
  if (industry === 'Tourism') {
    return { ...base, bookingRef: `BK-${ref}`, itineraryId: `IT-${2000 + i}` };
  }
  return base;
}

function billingFor(issueType, i, title, desc) {
  const amt = (base, spread) => `$${(base + (i % spread)).toFixed(2)}`;
  const notes = [];
  let disputeAmount = null, lateFee = null, refundAmount = null;
  const push = (type, label, amount, note, days) => notes.push({ type, label, amount: amount || '', note, date: detDate(title, days || 3) });

  switch (issueType) {
    case 'billing_dispute': disputeAmount = amt(45, 120); push('charge', 'Disputed charge', disputeAmount, desc, 3); break;
    case 'late_fee': lateFee = amt(25, 40); push('fee', 'Late fee', lateFee, desc, 7); break;
    case 'refund': refundAmount = (29 + (i % 70)).toFixed(2); push('refund', 'Refund pending', `$${refundAmount}`, desc, 5); break;
    case 'cancellation': push('cancel', 'Cancellation request', '', desc, 0); break;
    case 'security': push('alert', 'Security alert', '', desc, 1); break;
    case 'technical': push('ticket', 'Technical ticket', '', desc, 2); break;
    case 'upgrade': push('request', 'Upgrade inquiry', '', desc, 0); break;
    case 'complaint_escalation': case 'vip_complaint': push('escalation', title, '', desc, 1); break;
    case 'wrong_information': push('correction', 'Incorrect info on file', '', desc, 4); break;
    case 'insurance_claim': push('claim', 'Claim issue', amt(120, 800), desc, 5); break;
    case 'prior_auth': push('auth', 'Prior auth required', '', desc, 2); break;
    case 'prescription': push('rx', 'Prescription issue', amt(15, 65), desc, 1); break;
    case 'copay_dispute': disputeAmount = amt(10, 40); push('copay', 'Copay mismatch', disputeAmount, desc, 3); break;
    case 'lab_results': push('lab', 'Lab results pending', '', desc, 10); break;
    case 'referral': push('referral', 'Referral issue', '', desc, 6); break;
    case 'medical_billing': disputeAmount = amt(250, 1500); push('claim', 'Medical balance', disputeAmount, desc, 8); break;
    case 'records_request': push('records', 'Records request', '', desc, 2); break;
    case 'appointment': push('appointment', 'Appointment dispute', '', desc, 1); break;
    case 'booking_issue': case 'booking_change': push('booking', title, '', desc, 2); break;
    default: push('issue', title, '', desc, 2);
  }
  return { billingNotes: notes, disputeAmount, lateFee, refundAmount, issueType };
}

function buildProfileSeed(id, industry, i, issueType, title, desc) {
  const nm = nameAt(i);
  const voice = voiceAt(i);
  const acctPrefix = industry === 'Healthcare' ? '#P' : industry === 'Tourism' ? '#T' : '#N';
  const bill = billingFor(issueType, i, title, desc);
  const h = hash(id);
  const yr = 1965 + (h % 30);
  const mo = pad(1 + (h % 12), 2);
  const dy = pad(1 + ((h >> 3) % 28), 2);
  const myr = 2017 + (h % 7);
  return {
    firstName: nm.firstName,
    lastName: nm.lastName,
    phone: detPhone(id),
    account: detAccount(id, acctPrefix),
    ssn4: detSsn4(id),
    email: `${nm.firstName.toLowerCase()}.${nm.lastName.toLowerCase()}${i}@email.com`,
    address: `${100 + (h % 9900)} ${STREETS[i % STREETS.length]}, ${CITIES[(i * 3) % CITIES.length]}`,
    dob: `${yr}-${mo}-${dy}`,
    memberSince: `${myr}-${mo}-01`,
    services: servicesFor(industry, i),
    gender: voice.gender,
    voiceId: voice.voiceId,
    voiceAccent: voice.voiceAccent,
    billingNotes: bill.billingNotes,
    disputeAmount: bill.disputeAmount,
    lateFee: bill.lateFee,
    refundAmount: bill.refundAmount,
    issueType: bill.issueType,
    crmExtras: crmExtras(industry, issueType, i, title)
  };
}

function expandCsIssues(specs) {
  const perCat = Math.ceil(POOL / specs.length);
  const out = [];
  for (const [issueType, titlePrefix, descTpl, details] of specs) {
    for (let j = 0; j < perCat && out.length < POOL; j++) {
      const detail = details[j % details.length];
      const title = `${titlePrefix} — ${detail}`;
      const desc = descTpl.replace('{detail}', detail);
      out.push({ title, desc, issueType, mood: moodAt(out.length), diff: diffAt(out.length) });
    }
  }
  return out.slice(0, POOL);
}

const CS_SPECS = {
  Healthcare: [
    ['insurance_claim', 'Claim Denied', 'Insurance denied the claim for {detail}. Patient needs reprocessing.', ['MRI lumbar scan','ER chest pain visit','knee arthroscopy','wellness labs panel','sleep study','PT session block','dermatology biopsy','urgent care visit','ambulance transport','outpatient surgery','colonoscopy screening','cardiac stress test','allergy testing','X-ray shoulder','ultrasound abdomen','mammogram screening','CT head scan','infusion therapy','home health visit','DME wheelchair']],
    ['prior_auth', 'Prior Auth Missing', 'Prior authorization missing for {detail}. Appointment blocked.', ['cardiology consult','PET scan order','specialist MRI','pain management procedure','bariatric consultation','genetic testing','infusion therapy','outpatient mental health','DME CPAP device','physical therapy plan','orthopedic surgery','endoscopy procedure','radiation planning','chemotherapy cycle','hearing aid fitting','occupational therapy','speech therapy','nutrition counseling','wound care visits','sleep apnea study']],
    ['prescription', 'Prescription Blocked', 'Pharmacy cannot fill prescription for {detail}.', ['blood pressure medication','insulin refill','antibiotic course','asthma inhaler','antidepressant refill','pain medication','thyroid medication','cholesterol statin','birth control refill','epilepsy medication','arthritis biologic','anticoagulant refill','allergy nasal spray','ADHD medication','migraine treatment','diabetes test strips','topical steroid','eye drops refill','sleep aid prescription','vitamin D supplement']],
    ['copay_dispute', 'Copay Mismatch', 'Patient paid wrong copay at visit for {detail}.', ['primary care visit','specialist consult','urgent care visit','ER copay','physical therapy session','lab draw copay','imaging copay','vaccination visit','telehealth visit','mental health session','dermatology visit','OB-GYN visit','pediatric visit','vision exam','dental cleaning','chiropractic visit','acupuncture session','nutrition visit','audiology test','allergy shot']],
    ['lab_results', 'Lab Results Delay', 'Patient waiting on results for {detail} with no callback.', ['CBC blood panel','metabolic panel','lipid panel','HbA1c test','thyroid panel','vitamin D level','STD screening','urinalysis','COVID PCR test','strep culture','allergy blood test','PSA screening','pregnancy test','iron panel','liver function test','kidney function test','hormone panel','celiac panel','Lyme test','biopsy pathology']],
    ['referral', 'Referral Problem', 'Referral issue for {detail} — expired or not processed.', ['cardiologist referral','orthopedic referral','neurologist referral','dermatologist referral','GI specialist referral','endocrinologist referral','psychiatrist referral','physical therapist referral','pain specialist referral','oncologist referral','urologist referral','ENT specialist referral','rheumatologist referral','pulmonologist referral','nephrologist referral','ophthalmologist referral','podiatrist referral','allergist referral','surgeon referral','genetic counselor referral']],
    ['medical_billing', 'Surprise Medical Bill', 'Unexpected balance bill related to {detail}.', ['out-of-network ER','anesthesiologist fee','pathology lab fee','radiology reading fee','facility fee','assistant surgeon fee','after-hours clinic fee','ambulatory surgery center','out-of-network specialist','air ambulance charge','outpatient MRI facility','emergency room facility','observation stay charge','NICU daily rate','ICU daily rate','surgical supply charge','implant device charge','recovery room fee','post-op visit bundle','telehealth platform fee']],
    ['records_request', 'Records Request', 'Patient needs medical records for {detail} before deadline.', ['new specialist transfer','disability application','employer FMLA form','insurance appeal packet','second opinion consult','school vaccination form','travel medical clearance','workers comp case','legal proceeding','disability review','college health form','sports physical clearance','immigration medical file','clinical trial enrollment','home health start of care','hospice transfer packet','nursing home admission','rehab facility intake','court subpoena response','family history study']],
    ['appointment', 'Appointment Dispute', 'Scheduling dispute regarding {detail}.', ['no-show fee charged','double-booked slot','cancelled without notice','wrong provider assigned','telehealth link broken','interpreter not arranged','wheelchair access missing','pediatric slot lost','same-day request denied','follow-up overdue','specialist waitlist error','procedure prep instructions wrong','fasting instructions conflict','medication hold not noted','insurance verification failed','copay estimate wrong','referral not linked','prior auth not attached','time zone error','reminder never sent']],
    ['technical', 'Portal Problem', 'Patient cannot complete {detail} in the patient portal.', ['video visit login','bill payment online','message doctor feature','refill request submit','appointment reschedule','records download','insurance card upload','proxy access setup','payment plan setup','test results view','immunization record view','referral status check','prior auth tracker','coverage verification tool','profile update save','two-factor authentication','password reset flow','mobile app login','family account link','notification preferences']]
  ],
  Finance: [
    ['billing_dispute', 'Fee Dispute', 'Client disputes fee on {detail}.', ['overdraft fee','maintenance fee','wire transfer fee','late payment fee','annual card fee','advisory fee','brokerage commission','loan origination fee','prepayment penalty','returned check fee','foreign transaction fee','balance inquiry fee','paper statement fee','escrow shortage fee','PMI charge','trust administration fee','custodial fee','margin interest charge','ACH rejection fee','stop payment fee']],
    ['security', 'Fraud Alert', 'Security concern regarding {detail}.', ['unauthorized wire','card not present charge','account takeover attempt','check fraud report','identity theft alert','new device login','password reset unknown','beneficiary change unknown','address change unknown','SIM swap suspicion','phishing email reported','Zelle scam report','crypto transfer block','foreign ATM withdrawal','duplicate card charge','merchant duplicate charge','account lockout','SSN change attempt','PIN brute force','mobile deposit fraud']],
    ['technical', 'Platform Issue', 'Cannot complete {detail} in online banking.', ['fund transfer','mobile deposit','statement download','bill pay setup','Zelle send','wire request submit','card activation','credit limit request','dispute form submit','check order','direct deposit update','tax document download','beneficiary update','alert preferences','account linking','loan payment schedule','investment trade','CD renewal online','profile photo upload','two-factor setup']],
    ['wrong_information', 'Incorrect Information', 'Wrong information provided about {detail}.', ['loan payoff amount','interest rate quoted','fee schedule explained','maturity date stated','credit limit quoted','payment due date','escrow analysis','insurance requirement','minimum balance rule','overdraft protection terms','wire cutoff time','hold release timing','CD penalty amount','APR on card','rewards balance','tax form availability','branch hours stated','promotional rate terms','refinance timeline','account closure steps']],
    ['complaint_escalation', 'Escalated Complaint', 'Repeated failures with {detail} — client escalating.', ['loan modification','fee reversal request','fraud claim follow-up','credit dispute','branch service incident','phone hold times','manager callback missing','document processing delay','account reconciliation','trust disbursement delay','investment error correction','card replacement delay','check hold excessive','merchant dispute ignored','escrow analysis dispute','rate match promise broken','promotional bonus missing','account freeze unexplained','ACH recall ignored','privacy breach concern']],
    ['refund', 'Refund Request', 'Client wants refund for {detail}.', ['duplicate payment','service not rendered','erroneous transfer','annual fee waiver denied wrongly','closed account charge','insurance product cancel','safe deposit overcharge','wire fee after bank error','late fee after on-time pay','maintenance fee on zero balance','card annual fee after cancel','loan fee after denial','investment subscription overlap','check order not delivered','credit monitoring duplicate','paper statement charge','expedited card fee','foreign exchange markup','merchant refund not posted','promotional credit missing']],
    ['cancellation', 'Closure Request', 'Client wants to cancel or close {detail}.', ['credit card account','checking account','auto loan','personal loan','investment account','safe deposit box','bill pay service','overdraft protection','direct deposit link','mobile banking access','joint account share','trust relationship','brokerage margin','CD before maturity','HELOC line','business account','student loan refi','credit monitoring add-on','rewards program','paperless opt-out reversal']],
    ['upgrade', 'Product Upgrade', 'Client needs help upgrading {detail}.', ['checking tier','credit card tier','investment plan','business banking package','loan product switch','insurance bundle','wealth management tier','online banking features','mobile deposit limits','wire transfer limits','credit limit increase','rewards tier','CD rate promotion','mortgage product switch','HELOC increase','trust service level','brokerage platform tier','card metal upgrade','savings rate tier','priority support add-on']],
    ['late_fee', 'Late Mark Dispute', 'Client disputes late mark or fee on {detail}.', ['mortgage payment','auto loan payment','credit card payment','personal loan payment','HELOC payment','student loan payment','business line payment','store card payment','insurance premium','HOA assessment','tax installment','utility autopay linked','medical payment plan','installment loan','lease payment','margin loan','CD loan collateral','equipment finance','SBA loan payment','credit builder loan']],
    ['records_request', 'Document Request', 'Client needs documents for {detail} urgently.', ['tax filing 1099','mortgage interest statement','loan payoff letter','account verification letter','wire confirmation','credit reference letter','trust statement','investment cost basis','escrow analysis annual','direct deposit proof','bankruptcy discharge proof','court order compliance','visa financial proof','audit request response','estate settlement docs','charitable donation receipt','business account resolution','FHA case number docs','SBA loan package','refinance underwriting packet']]
  ],
  Banking: [
    ['billing_dispute', 'Charge Dispute', 'Customer disputes charge for {detail}.', ['monthly maintenance','unexpected debit','merchant duplicate','subscription renewal','ATM surcharge','foreign ATM fee','check printing fee','rush card fee','stop payment fee','overdraft transfer fee','paper statement fee','inactive account fee','low balance fee','card replacement fee','wire incoming fee','cashier check fee','notary service fee','coin counting fee','safety deposit fee','account research fee']],
    ['security', 'Security Incident', 'Security issue involving {detail}.', ['debit card skim','online login attempt','mobile app breach alert','check fraud','ACH unauthorized debit','Zelle fraud','phone banking PIN tries','new payee added unknown','address change fraud','email change fraud','card not received','lost checkbook report','SIM swap report','phishing SMS','account takeover','beneficiary fraud change','wire fraud attempt','mobile deposit duplicate','identity theft affidavit','employer direct deposit fraud']],
    ['technical', 'Digital Banking Issue', 'Cannot use digital banking for {detail}.', ['mobile check deposit','internal transfer','external transfer','bill payment','card lock unlock','travel notice set','statement PDF download','account alert setup','payee add edit','Zelle enrollment','wire template save','check order online','card PIN change','account nickname edit','budget tool access','credit score view','e-statement enroll','quick balance widget','face ID login','password reset email']],
    ['cancellation', 'Account Cancellation', 'Customer wants to cancel {detail}.', ['checking account','savings account','debit card','credit card','overdraft service','bill pay','mobile banking','paper statements','joint account access','teen account link','CD account early','auto transfer rule','direct deposit routing','linked external account','rewards enrollment','safe deposit rental','credit monitoring add-on','identity protection','account alerts package','business debit card']],
    ['upgrade', 'Product Upgrade', 'Customer exploring upgrade for {detail}.', ['checking to premium','savings to money market','debit to rewards card','basic to plus account','single to joint account','youth to adult account','local to national perks','online to priority banker','standard to platinum card','basic bill pay to premium','mobile limits increase','wire limit increase','cashier check waiver','free notary perk','ATM fee rebate tier','interest rate tier bump','overdraft protection upgrade','credit card limit review','business to commercial tier','HSA contribution tier']],
    ['refund', 'Refund Needed', 'Customer expects refund for {detail}.', ['closed account fee','erroneous charge','duplicate ATM withdrawal','merchant return not posted','fee after bank error','promotional credit missing','card annual fee after close','check order not received','wire returned fee kept','overdraft fee after deposit','late fee after autopay','foreign fee on declined txn','card rush fee on delay','research fee on bank error','safe deposit partial month','notary fee on cancelled visit','coin fee on miscount','maintenance on closed account','paper fee after e-statement','inactive fee while active']],
    ['wrong_information', 'Misinformation', 'Previous agent gave wrong info about {detail}.', ['hold release timing','overdraft coverage rules','wire cutoff time','CD penalty amount','card delivery timeline','dispute resolution window','fraud claim timeline','address change effect','travel notice duration','direct deposit posting','check hold policy','mobile deposit limits','Zelle limits daily','account closure steps','beneficiary update rules','joint account rights','minor account rules','power of attorney acceptance','estate account process','escheat timeline']],
    ['complaint_escalation', 'Service Failure', 'Poor experience with {detail} — escalation requested.', ['branch visit wait','phone queue abandonment','manager callback missed','fraud claim delay','dispute investigation delay','card replacement delay','check hold excessive','wire delay critical','account lock without notice','fee waiver denied unfairly','promotion not honored','account opened wrong type','direct deposit misrouted','statement error repeated','online outage impact','mobile app crash loop','chat support disconnect','notary appointment missed','safe deposit access denied','privacy complaint ignored']],
    ['late_fee', 'Fee Dispute', 'Customer disputes fee tied to {detail}.', ['overdraft fee','returned item fee','late loan payment fee','credit card late fee','mortgage late fee','HELOC late fee','line of credit late fee','installment late fee','lease late fee linked','autopay failure fee','check returned fee','ACH reject fee','stop payment unused fee','maintenance after waiver expired','paper statement after enroll','foreign txn after travel notice fail','ATM fee after network promise','rush fee after delay','research fee dispute','card replacement fee after fraud']],
    ['vip_complaint', 'Priority Client Issue', 'High-value client upset about {detail}.', ['relationship manager change','private banking wait time','wealth fee increase','credit line reduction','wire limit too low','concierge callback delay','investment trade error','trust officer unavailable','estate service delay','art lending delay','safe deposit size unavailable','international wire block','FX rate dissatisfaction','portfolio review overdue','tax document delay','charitable fund error','family office routing','board member service miss','IPO allocation issue','credit facility covenant dispute']]
  ],
  Technology: [
    ['technical', 'System Failure', 'Cannot use platform for {detail}.', ['SSO login','API production calls','admin dashboard','user provisioning','data export job','webhook delivery','sandbox refresh','license assignment','billing portal','support ticket portal','status page subscription','2FA enrollment','password policy reset','SCIM sync','audit log export','backup restore test','CDN configuration','DNS verification','SSL cert renewal','mobile SDK integration']],
    ['billing_dispute', 'Invoice Dispute', 'Disputing invoice line for {detail}.', ['unused license seats','duplicate annual charge','overage calculation error','support tier mismatch','storage overage wrong','API call metering error','prorated cancel wrong','tax jurisdiction wrong','currency conversion error','discount code not applied','partner margin wrong','true-up count wrong','add-on never activated','trial conversion early','renewal price increase','enterprise tier mismatch','multi-year credit missing','professional services hour dispute','training seat unused','hardware maintenance fee']],
    ['complaint_escalation', 'SLA Breach', 'SLA missed for {detail} — demanding credit.', ['P1 outage 6 hours','API latency spike day','data loss incident','security patch delay','support response 48h','onboarding delay 2 weeks','migration window overrun','backup failure event','regional outage APAC','integration partner outage','status comms failure','rollback failure incident','performance regression release','QA escape production','pen test finding overdue','compliance audit gap','DR test failure','capacity planning miss','monitoring blind spot','on-call escalation miss']],
    ['security', 'Security Concern', 'Security issue with {detail}.', ['suspicious admin login','API key leak report','SOC2 report request','pen test finding','data residency question','GDPR deletion request','vendor subprocessors list','encryption at rest proof','incident notification delay','vulnerability disclosure','SSO misconfiguration','MFA bypass report','role privilege too broad','audit log tamper concern','IP allowlist failure','DDoS attack impact','supply chain CVE','customer data exposure scare','phishing impersonation','session fixation report']],
    ['wrong_information', 'Incorrect Guidance', 'Support gave wrong info about {detail}.', ['API rate limits','data retention policy','backup frequency','SLA response time','upgrade migration steps','downgrade data loss risk','contract auto-renewal date','sandbox prod parity','IP whitelisting steps','SSO attribute mapping','webhook retry policy','export format options','GDPR DPA availability','HIPAA BAA scope','PCI scope statement','uptime calculation method','maintenance window notice','feature flag rollout date','deprecation timeline','pricing tier entitlements']],
    ['cancellation', 'Subscription Cancel', 'Client canceling due to {detail}.', ['failed migration','pricing increase','missing feature','support quality','competitor switch','merger shutdown','project cancelled','budget cut','security concern unresolved','performance issues','integration broken','executive mandate','vendor consolidation','compliance block','data export blocked','contract dispute','PO process failure','renewal terms unacceptable','trial insufficient','onboarding failure']],
    ['upgrade', 'Expansion Request', 'Client upgrading for {detail}.', ['more API throughput','additional admin seats','enterprise SSO','dedicated support tier','multi-region deployment','advanced analytics module','HIPAA environment','custom SLA tier','private cloud option','increased storage cap','premium onboarding','training package','professional services block','partner portal access','audit log retention extend','sandbox unlimited','dev staging prod trio','HA failover add-on','WAF add-on','SIEM integration pack']],
    ['refund', 'Credit Request', 'Client wants credit for {detail}.', ['outage downtime','failed deployment support','wrong tier charged','duplicate invoice','unused onboarding fee','SLA credit owed','early renewal mistake','migration rollback cost','training cancelled','PO overbill adjustment','tax charged incorrectly','partner discount missing','promotional credit expired early','hardware return','marketplace fee error','support package unused','data export service fee wrong','penalty fee after bank error equiv','license true-down not applied','annual prepay partial unused']],
    ['vip_complaint', 'Enterprise Escalation', 'Enterprise client upset about {detail}.', ['TAM unresponsive','exec sponsor missing','roadmap commitment miss','custom feature delay','regression in LTS branch','change management failure','quarterly review skipped','escalation path broken','on-site engineer no-show','security review delay','legal redline delay','procurement block ignored','multi-tenant noisy neighbor','EU data residency gap','FedRAMP timeline slip','SOC report delay','pen test remediation slip','incident RCA overdue','status comms tone deaf','renewal negotiation stall']],
    ['records_request', 'Compliance Docs', 'Needs documentation for {detail}.', ['SOC2 Type II','ISO27001 cert','DPA signature','BAA signature','PCI AOC','pen test summary','subprocessor list','data flow diagram','encryption whitepaper','incident history summary','uptime report 12mo','SLA performance report','change log export','API changelog signed','architecture review doc','disaster recovery plan','business continuity plan','insurance cert coverage','financial stability letter','reference architecture PDF']]
  ],
  Retail: [
    ['refund', 'Return Refund', 'Customer wants refund for {detail}.', ['damaged shipment','wrong size item','defective electronics','missing accessory','late delivery gift','duplicate charge item','subscription box unwanted','warranty return denied','final sale dispute','partial order missing','color mismatch listing','expired product received','used item sold as new','counterfeit suspicion refund','price drop adjustment','promo not applied refund','gift return no receipt','bundle component missing','assembly kit incomplete','digital code invalid']],
    ['billing_dispute', 'Billing Error', 'Billing problem with {detail}.', ['gift card zero balance','double subscription charge','loyalty points not applied','coupon not honored post-purchase','tax calculated wrong','shipping charged twice','membership fee unexpected','restocking fee dispute','price match denied billing','currency charge wrong','installment plan error','store credit not issued','refund to wrong card','partial refund amount wrong','warranty fee wrong','assembly fee unwarranted','recycling fee surprise','donation round-up doubled','tip added without consent','BNPL schedule wrong']],
    ['complaint_escalation', 'Service Escalation', 'Escalation over {detail}.', ['manager never came','return denied unfairly','delivery driver incident','in-store discrimination claim','online chat disconnect','phone support rude','warehouse pick error repeat','marketplace seller fraud','gift registry error wedding','corporate order short ship','BOPIS item missing','locker pickup failure','same-day delivery miss','installation service no-show','appliance delivery damage repeat','furniture assembly damage','price guarantee broken','loyalty tier wrongly downgraded','data breach concern marketing','spam after opt-out']],
    ['cancellation', 'Cancel Service', 'Customer canceling {detail}.', ['subscription box','membership program','protection plan','installment plan','credit card store card','auto-ship coffee','meal kit plan','streaming bundle add-on','text alerts marketing','email marketing','curbside premium fee','same-day delivery pass','styling service fee','warehouse club renewal','VIP early access','trade-in program','device upgrade plan','warranty extension','rent-to-own contract','layaway plan']],
    ['wrong_information', 'Wrong Product Info', 'Listing or agent wrong about {detail}.', ['size chart inaccurate','compatibility claim false','stock availability wrong','delivery date promised wrong','warranty coverage misstated','return window misstated','price match rules wrong','coupon eligibility wrong','assembly requirement omitted','material composition wrong','country of origin wrong','energy rating wrong','allergen info wrong','age rating wrong','fit recommendation wrong','color name mismatch','bundle contents wrong','refurb grade wrong','open box condition wrong','marketplace seller location wrong']],
    ['technical', 'Website Issue', 'Cannot complete {detail} on website/app.', ['checkout payment','apply coupon','track order','start return label','update address','redeem gift card','join loyalty program','schedule delivery','BOPIS reservation','wishlist share','product review submit','size swap request','subscription skip','store inventory check','chat support launch','account password reset','order history view','tax exempt upload','corporate account login','pickup QR code']],
    ['vip_complaint', 'VIP Member Issue', 'Loyalty VIP upset about {detail}.', ['concierge line wait','exclusive sale access denied','birthday reward missing','tier downgrade error','free shipping lost','early access code invalid','personal shopper no-show','complimentary gift missing','event invitation lost','points expiration unfair','status match denied','partner perk broken','luxury packaging missing','white glove delivery miss','installation priority missed','extended return denied VIP','price protection denied','allocation product sold out','partner lounge pass invalid','annual gift unfulfilled']],
    ['upgrade', 'Upgrade Purchase', 'Customer upgrading {detail}.', ['membership tier','protection plan tier','delivery speed tier','appliance package tier','furniture collection bundle','electronics bundle','phone trade-in upgrade','TV mount service add','smart home bundle','mattress foundation upgrade','appliance warranty plus','tool set professional tier','outdoor power bundle','grill accessory bundle','fitness equipment package','baby registry premium','wedding registry concierge','business bulk tier','corporate gifting tier','subscription frequency upgrade']],
    ['security', 'Account Security', 'Security concern on {detail}.', ['order placed not me','address changed fraud','payment method added fraud','loyalty points stolen','gift card drained','store credit stolen','account email changed','password reset unknown','subscription opened fraud','return fraud accusation dispute','marketplace account hijack','credit application fraud','buy now pay later fraud','pickup fraud someone else','locker code shared leak','referral bonus fraud flag','employee discount abuse claim','corporate account breach','vendor portal breach worry','phishing fake order email']],
    ['booking_issue', 'Order Fulfillment', 'Fulfillment problem with {detail}.', ['split shipment lost','carrier marked delivered not received','warehouse delay no update','preorder date slipped','backorder indefinite','pick wrong item shipped','gift message omitted','fragile item broken in box','temperature sensitive spoil',' hazmat shipping block','international customs hold','signature required missed','freight appointment missed','white glove reschedule','installation parts missing','appliance hookup kit missing','mattress old removal skipped','furniture room of choice failed','assembly manual missing','warranty card not included']]
  ],
  Tourism: [
    ['refund', 'Refund Demand', 'Traveler wants refund for {detail}.', ['cancelled flight cash','hotel cancellation','tour cancellation','cruise cancellation','car rental cancel','excursion cancel','travel insurance claim','resort fee refund','airline baggage fee','seat selection fee','priority boarding fee','lounge pass unused','visa service fee','excursion no-show weather','group tour drop','multi-city segment unused','rail pass unused days','theme park tickets unused','parking prepay unused','airport transfer no-show']],
    ['complaint_escalation', 'Travel Nightmare', 'Major complaint about {detail}.', ['hotel overbooking','flight strand overnight','lost baggage wedding','missed connection cruise','wrong hotel star rating','accessible room not honored','honeymoon suite given away','group seating split infants','diamond status ignored','all-inclusive food poisoning scare','excursion unsafe equipment','driver no-show airport','guide no English promised','snorkel gear broken injury','scuba certification invalid','timeshare pressure incident','hidden resort construction','noise construction undisclosed','beach closure undisclosed','pool closed undisclosed']],
    ['booking_issue', 'Booking Error', 'Booking problem with {detail}.', ['wrong passenger name','wrong travel dates','double booking same night','missing hotel confirmation','missing flight ticket number','wrong room type booked','wrong car class booked','infant lap not ticketed','pet fee not disclosed','wheelchair assistance not booked','meal preference not booked','connecting gate too tight booked','visa requirement not flagged','passport expiry not flagged','vaccination req not flagged','travel advisory ignored booking','loyalty number not attached','corporate rate not applied','group block not linked','honeymoon package missing perks']],
    ['booking_change', 'Change Request', 'Traveler must change {detail} due to emergency.', ['flight date change','hotel dates change','tour date move','cruise cabin change','car pickup time change','rail departure change','excursion time change','airport transfer time','resort room upgrade request','add passenger name correction','remove passenger refund segment','add infant seat flight','change destination city','extend hotel stay','shorten hotel stay','move to accessible room','change to connecting room family','switch to refundable fare','move to earlier flight','delay return flight medical']],
    ['wrong_information', 'Misbooked Info', 'Agent gave wrong info about {detail}.', ['cancellation policy','refundability rules','baggage allowance','visa requirements','COVID rules outdated','resort fee amount','transfer time estimate','excursion difficulty level','weather season advice','currency advice wrong','tipping customs wrong','insurance coverage scope','credit card hold amount','hotel deposit policy','car rental insurance need','fuel policy full-full wrong','tour pickup time wrong','flight terminal wrong','loyalty benefits wrong','promo blackout dates wrong']],
    ['billing_dispute', 'Travel Charge Dispute', 'Disputing charge for {detail}.', ['resort fee surprise','city tax surprise',' tourism tax surprise','minibar restock error','room service wrong charge','damage charge unfair','smoking fee wrongful','extra guest fee unfair','pet fee not disclosed','parking valet surprise','WiFi fee surprise','pool towel deposit','golf cart damage claim','ski equipment damage claim','late checkout fee unfair','early departure fee unfair','no-show fee wrongful','currency DCC bad rate','dynamic pricing jump','loyalty free night not applied']],
    ['insurance_claim', 'Insurance Claim', 'Travel insurance claim for {detail}.', ['trip cancellation illness','trip interruption flight','lost baggage delay essentials','medical emergency abroad','evacuation coverage','missed connection coverage','supplier bankruptcy coverage','job loss cancellation','home uninhabitable cancel','jury duty cancel','military deploy cancel','terrorism cancel coverage','natural disaster cancel','pandemic related dispute','CFAR claim dispute','rental car damage claim','adventure sports injury claim','cruise missed port claim','airline bankruptcy claim','tour operator insolvency claim']],
    ['vip_complaint', 'Elite Traveler Issue', 'Elite member issue with {detail}.', ['status recognition denied','suite upgrade promised missing','lounge denied access','priority boarding skipped','dedicated line ignored','concierge booking error','limo transfer no-show','yacht excursion downgrade','private tour guide swap','Michelin reservation lost','spa appointment lost','golf tee time lost','helicopter tour weather no reschedule','butler service missing','champagne welcome missing','anniversary amenity missing','points post missing trip','partner airline status not honored','overwater bungalow downgraded','villa pool private became shared']],
    ['technical', 'Booking Portal Issue', 'Cannot manage {detail} online.', ['online check-in','mobile boarding pass','hotel mobile key','car rental modify','excursion voucher download','itinerary PDF download','seat map select','baggage prepay','travel insurance add post book','loyalty attach post book','special meal request','wheelchair request portal','visa invitation letter download','payment plan view','refund status track','chat support app','price drop alert set','share itinerary family','passport scan upload','travel waiver sign digital']],
    ['cancellation', 'Cancel Trip Component', 'Canceling {detail} within policy dispute.', ['non-refundable hotel fight','basic economy flight cancel','group tour seat release','cruise penalty phase','non-refundable excursion','car rental prepaid','rail non-flex ticket','insurance after cooling off','airbnb strict policy fight','package holiday component','charter flight block','safari deposit forfeiture','wedding room block release','conference hotel block','ski lift pass unused','theme park non-refundable','ferry non-refundable','helicopter tour weather policy','private jet deposit','yacht charter weather clause']]
  ],
  Corporate: [
    ['billing_dispute', 'Vendor Invoice Dispute', 'Disputing invoice for {detail}.', ['SaaS overage','consulting hours disputed','license true-up wrong','maintenance renew unwanted','implementation milestone wrong','change order unauthorized','PO mismatch invoice','tax nexus wrong','currency invoice wrong','early terminate fee wrong','credit memo missing','duplicate PO invoice','retainer unused hours','support tier wrong billed','hardware lease buyout wrong','cloud reserved instance wrong','API metering dispute','storage tier wrong','user seat recount wrong','professional services travel expense']],
    ['cancellation', 'Contract Termination', 'Terminating contract for {detail}.', ['SaaS subscription','maintenance agreement','consulting SOW','outsourced helpdesk','cloud reserved capacity','office lease break','equipment lease','marketing agency retainer','staffing contract','cleaning contract','security monitoring','backup service','domain portfolio','SSL cert bundle','UCaaS seats','ERP module','CRM seats','HRIS module','payroll provider','benefits broker']],
    ['technical', 'Platform Outage Impact', 'Business impact from {detail} failure.', ['ERP downtime','CRM sync failure','email gateway outage','VPN corporate outage','identity provider outage','payroll run blocked','inventory system down','POS nationwide outage','call center telephony down','warehouse WMS down','shipping label API down','BI dashboard stale','data warehouse pipeline fail','MDM device lockout','file share ransomware scare','video conf platform down','e-sign platform down','ticketing system down','monitoring blind outage','backup job failed month end']],
    ['complaint_escalation', 'Executive Escalation', 'Executive escalation on {detail}.', ['project milestone miss','SLA breach repeated','data breach scare','audit finding critical','regulatory deadline miss','M&A integration delay','product recall support load','major client churn risk','board report error','investor demo failure','IPO readiness gap','SOC audit fail','GDPR complaint filed','class action rumor','union negotiation spillover','PR crisis call volume','supply chain stop ship','factory safety incident','environmental permit delay','CEO social media storm']],
    ['security', 'Corporate Security', 'Security incident related to {detail}.', ['phishing CEO fraud','vendor breach notification','employee laptop stolen','privileged access misuse','data exfiltration scare','ransomware email opened','physical badge clone','visitor escort failure','clean desk audit fail','VPN credential share','SSO token theft scare','API key in github','shadow IT SaaS discovery','terminated employee access','third party VPN tunnel','MFA fatigue push approve','SIM swap executive','deepfake wire attempt','insider threat report','compliance whistleblower']],
    ['wrong_information', 'Miscommunication', 'Wrong info given about {detail}.', ['renewal auto date','termination notice period','SLA credit process','escalation phone tree','data retention period','support hours holiday','maintenance window impact','feature GA date','pricing tier migration','contract assignability','subcontractor use','insurance cert validity','pen test scope result','DR RTO/RPO promise','onboarding timeline','training inclusion scope','API deprecation date','region failover capability','audit log retention sale','custom dev IP ownership']],
    ['upgrade', 'Enterprise Upgrade', 'Upgrading enterprise {detail}.', ['support tier platinum','user seat expansion','region expansion EU','HIPAA environment add','dedicated instance','custom integration pack','TAM assigned',' quarterly business review','training credits bundle','sandbox unlimited','SSO advanced','audit log 7yr','IP allowlist dedicated','rate limit increase','white label portal','multi-org management','advanced RBAC','data residency UK','FedRAMP moderate path','24x7 phone support']],
    ['refund', 'Credit Owed', 'Credit requested for {detail}.', ['SLA credits unpaid','duplicate renewal charge','unused implementation days','wrong tier annual charge','outage credit policy','training cancelled vendor','conference sponsorship cancel','PO overbill correction','tax VAT wrong refund','partner MDF unused return','early renewal rollback','license downgrade credit','hardware RMA credit','shipping damage credit','professional services overbill','change order rejected credit','retainer rollover denied wrongly','support case SLA credit','data export fee wrongful','migration failure credit']],
    ['vip_complaint', 'Strategic Account Risk', 'Strategic account churn risk on {detail}.', ['QBR skipped quarter','roadmap item removed','support VP unreachable','regression in enterprise feature','custom SLA miss','professional services quality','executive sponsor left vendor','competitor POC winning','pricing renewal 40% hike','contract redline stalemate','data portability delay','audit finding unresolved','security questionnaire delay','reference call refused','beta program dropped','M&A product uncertainty','bankruptcy rumor client worry','support offshore backlash','AI feature ethics concern','ESG report gap concern']],
    ['late_fee', 'Payment Terms Dispute', 'Disputing late fee on {detail}.', ['net-30 invoice','net-45 PO','milestone invoice','retainer invoice','annual renew invoice','true-up invoice','change order invoice','pass-through expense invoice','FX invoice','consolidated parent bill','intercompany transfer bill','credit memo netting delay','ACH return fee unfair','wire fee after PO approved','card fee after policy allows','dunning letter after payment sent','collections threat after dispute open','interest on disputed invoice','late fee after portal outage','penalty after force majeure delay']]
  ],
  Education: [
    ['technical', 'Portal Access Issue', 'Student cannot access {detail} in campus portal.', ['course registration','financial aid status','transcript download','housing application','meal plan select','tuition payment plan','advisor appointment book','library database login','LMS assignment submit','exam proctoring app','student email setup','parking permit buy','ID card digital','vaccination upload','international SEVIS form','scholarship application','work study portal','club registration','graduation application','alumni transcript order']],
    ['billing_dispute', 'Tuition Charge Dispute', 'Disputing charge for {detail}.', ['lab fee unexpected','technology fee duplicate','activity fee wrong program','health fee waived not applied','parking fee after online term','meal plan charge after cancel','housing deposit wrong amount','late registration fee unfair','graduation fee duplicate','transcript rush fee wrong','parking ticket on account','library fine aggregated wrong','damage deposit dorm unfair','study abroad fee change','course repeat fee surprise','out-of-state tuition wrong res classification','international student fee wrong','payment plan setup fee','credit card convenience fee undisclosed','refund hold financial aid clash']],
    ['wrong_information', 'Wrong Advising Info', 'Advisor gave wrong info about {detail}.', ['graduation requirements','transfer credit rules','prerequisite waiver process','financial aid deadline','scholarship eligibility','internship credit rules','study abroad credit transfer','pass fail election deadline','grade appeal window','withdraw deadline refund tier','major change impact aid','residency reclass process','veteran benefit certification','work study hour cap','honors program requirements','thesis submission format','capstone registration timing','dual degree sequencing','NCAA eligibility courses','teacher licensure pathway']],
    ['refund', 'Refund Request', 'Student wants refund for {detail}.', ['dropped course after deadline appeal','housing cancel mid-term','meal plan prorate denied','parking permit unused semester','activity fee after withdraw','tech fee after online switch','application fee duplicate','deposit forfeiture appeal','study abroad cancel vendor','continuing ed cancel','non-credit workshop cancel','testing fee duplicate','graduation regalia return','bookstore charge wrong course','lab material unused return','PE equipment fee','music lesson fee cancel','studio art material fee','field trip cancel refund','conference registration cancel']],
    ['complaint_escalation', 'Campus Service Escalation', 'Escalation about {detail}.', ['financial aid office wait','registrar error repeated','housing assignment error','meal plan allergy ignored','disability accommodation delay','Title IX response delay','international office visa letter delay','bursar rude interaction','faculty grade dispute ignored','IT helpdesk repeat ticket','library fine appeal ignored','parking appeal denied unfair','campus safety incident report ignored','health center billing error','counseling waitlist ignored crisis','career center appointment miss','alumni office transcript delay','bookstore price match denied','athletics eligibility error','dean meeting no-show']],
    ['records_request', 'Records Needed', 'Needs official records for {detail}.', ['employer background check','graduate school application','professional licensure board','scholarship renewal','visa reinstatement','NCAA eligibility cert','teacher certification','nursing clinical placement','internship employer verify','honor society application','transcript apostille study abroad','enrollment verification parent insurance','degree verification employer','course description syllabus employer','FERPA release to parent dispute','name change on transcript','gender marker update record','veteran cert enrollment','dual enrollment high school','National Student Clearinghouse error fix']],
    ['cancellation', 'Withdrawal Request', 'Student withdrawing due to {detail}.', ['medical withdrawal','mental health withdrawal','financial hardship','military deployment','family emergency','visa denial','program quality dissatisfaction','online format unsuitable','housing unsafe complaint','discrimination unresolved','scholarship lost unexpectedly','job relocation','pregnancy accommodation fail','disability support inadequate','course unavailable required','advisor misguided program','transfer accepted elsewhere','COVID policy dispute legacy','strike campus closure','natural disaster displacement']],
    ['appointment', 'Scheduling Conflict', 'Appointment issue for {detail}.', ['advisor double booked','registrar appointment missed','health appointment no show fee unfair','counseling cancel fee unfair','campus tour no show','orientation session missed','exam accommodation scheduling','disability intake delay','international check-in missed','housing inspection schedule clash','financial aid appeal hearing missed','conduct hearing schedule clash','thesis defense reschedule','graduation rehearsal missed','career fair appointment miss','employer recruit session miss','study abroad advising miss','tutoring session cancel policy','peer mentor match delay','accessibility transport schedule']],
    ['security', 'Account Security', 'Security issue with {detail}.', ['student email hacked','registration tampered','financial aid bank changed fraud','FERPA data exposed worry','LMS impersonation','ID card cloned report','dorm access unauthorized','parking account fraud','meal swipe stolen report','library account fines fraud','work study timesheet fraud','grade change unauthorized scare','scholarship redirect fraud','tuition payment redirect fraud','parent portal unauthorized access','alumni account takeover','research data access scare','lab equipment checkout fraud','club funds embezzlement report','exam proctor identity concern']],
    ['upgrade', 'Program Change', 'Student upgrading or changing {detail}.', ['major change business to engineering','add minor data science','honors college admission','graduate early application','dual degree add','online to hybrid switch','study abroad term add','co-op program enrollment','research credit add','thesis track switch','athletic team walk-on paperwork','scholarship tier upgrade appeal','meal plan upgrade','housing upgrade single room','parking permit upgrade','technology bundle upgrade laptop','gym membership upgrade','health insurance upgrade plan','language immersion add','certificate program stack']]
  ],
  Telecom: [
    ['billing_dispute', 'Bill Dispute', 'Customer disputes charge for {detail}.', ['TV package fee','premium channel add-on','HD DVR rental','sports package charge','international calling plan','roaming data charge','equipment rental fee','early termination fee','activation fee duplicate','promotional credit missing','bundle discount not applied','tax surcharge unexpected','regulatory fee line item','paper bill fee','late payment fee','reconnection fee','number port fee','device installment charge','insurance on device fee','overage data charge']],
    ['technical', 'Service Issue', 'Cannot use {detail} properly.', ['home internet outage','WiFi dead zones','cable box not booting','DVR not recording','on-demand not loading','mobile data slow','voicemail not working','caller ID wrong','HDMI handshake failure','app login failure','parental controls locked out','email on domain down','static on phone line','dropped calls at home','5G not connecting','fiber modem red light','mesh node offline','smart home hub disconnect','streaming app buffering','SMS not sending']],
    ['cancellation', 'Cancel Service', 'Customer wants to cancel {detail}.', ['TV package only','internet plan','mobile line','family plan line','home phone service','streaming add-on','equipment protection plan','whole account','business line','tablet line','wearable line','international plan','landline bundle','senior discount plan','student plan','prepaid plan','contract plan early','bundle after promo ends','second home line','temporary travel suspend']],
    ['complaint_escalation', 'Service Escalation', 'Escalation about {detail}.', ['technician no-show','repeat outage week','billing error third month','retention offer broken promise','store wait excessive','chat support loop','supervisor callback missed','misconfigured install','speed test below guarantee','false outage status page','rude technician report','damaged property install','missed appointment window','port delay critical','business line down peak','911 test failure worry','SLA credit denied unfair','loyalty tenure ignored','net neutrality concern','data cap policy change']],
    ['wrong_information', 'Wrong Plan Info', 'Agent gave wrong info about {detail}.', ['promo end date','contract length','early term fee amount','speed tier actual','data cap policy','international roaming rates','bundle savings math','equipment return process','port timeline estimate','credit check requirement','deposit refundable rule','unlimited fine print','price lock duration','autopay discount rules','paperless requirement','business vs consumer plan','5G coverage map claim','install self-setup option','outage credit eligibility','transfer PIN steps']],
    ['upgrade', 'Plan Upgrade', 'Customer upgrading {detail}.', ['internet speed tier','TV channel tier','mobile data tier','family plan lines','business fiber tier','mesh WiFi add-on','international roaming pack','sports premium pack','HBO add-on','4K box upgrade','unlimited data mobile','home phone unlimited','static IP business','cloud DVR storage','whole-home DVR','second receiver free promo','tablet data share','smartwatch line add','5G upgrade phone','symmetric upload tier']],
    ['refund', 'Credit Request', 'Customer wants credit for {detail}.', ['outage hours last week','technician late fee unfair','equipment return charge after return','activation fee after cancel same day','promo not applied first bill','double autopay charge','port fee after carrier error','insurance charge after device return','roaming charge travel notice filed','wrong plan charged difference','deposit not refunded','gift card promo missing','loyalty bill credit missing','SLA business credit','pro-rated cancel math wrong','tax overcharge correction','paper fee after paperless enroll','reconnect fee after paid bill','DVR fee after downgrade lag','install fee after self-install promised']],
    ['security', 'Account Security', 'Security concern on {detail}.', ['SIM swap report','port-out PIN fraud','account password changed unknown','new line added fraud','device upgrade fraud','autopay bank changed','email on account changed','billing address changed','store account access unknown','phishing SMS clicked','compromised router worry','open WiFi neighbor use','stolen phone line active','smartwatch cloned eSIM','business trunk toll fraud','international toll fraud spike','premium SMS spam charges','account takeover attempt','CPE admin password default','VPN credential leak worry']],
    ['late_fee', 'Fee Dispute', 'Disputing fee on {detail}.', ['late fee after autopay fail bank','reconnect fee after outage credit promised','equipment non-return fee after UPS scan','restocking fee on BYOD return','payment arrangement fee unfair','collection fee while disputing','NSF fee after bank error','paper bill fee after enroll','regulatory fee dispute','installment late fee device','business late fee NET terms','deposit forfeit dispute','early upgrade fee surprise','insurance deductible dispute','third-party app charge dispute','regulatory recovery fee spike','franchise fee line dispute','state telecom tax dispute','county 911 fee dispute','federal USF fee dispute']],
    ['vip_complaint', 'Long-Tenure Customer', 'Long-time customer upset about {detail}.', ['loyalty discount removed','price hike without notice','retention offer worse than new customer','technician quality decline','executive escalation ignored','business account manager gone','contract renewal worse terms','bundle forced unwanted TV','data cap reintroduced','cap on unlimited plan','deprioritization suspicion','rural speed neglect','fiber build false promise','copper sunset no option','IPv6 broken business need','static IP removed silently','SLA miss no credit','after-hours support removed','store closure nearest city','call center offshore frustration']]
  ]
};

const STAR_TOPICS = [
  'Leadership under pressure','Conflict with a colleague','Difficult customer de-escalation','Multitasking during peak volume','Adaptability to sudden change','Ethical dilemma at work','Mistake recovery and accountability','Cross-team collaboration failure turned success','Meeting a tight impossible deadline','Handling ambiguous instructions','Persuading without authority','Receiving harsh feedback professionally','Training a struggling teammate','Process improvement initiative','Budget cut impact response','Remote communication challenge','Cultural misunderstanding repair','Safety or compliance near-miss','Innovation rejected then adopted','Client escalation saved relationship','Vendor negotiation setback','Data error caught in time','Presentation gone wrong recovery','Stakeholder misalignment fixed','Volunteering for unpopular task','Mentoring junior staff success','Union or policy disagreement navigated','Product launch fire drill','Service outage customer comms','Quality vs speed tradeoff decision','Burnout signs managed responsibly','Delegation that failed then fixed','Win-back of churning client','Cross-sell done ethically','Knowledge silo broken','Handoff failure between shifts','Documentation saved the day','Language barrier on a call','Accessibility accommodation delivered','Security protocol enforced under pressure','Fraud suspicion handled correctly','Empathy with grieving customer','Policy exception denied professionally','Escalation to supervisor done right','Team morale drop addressed','Recognition given to peer','Interviewing a candidate fairly','Onboarding overload managed','KPI miss turnaround plan','Executive visibility moment','Board or leadership question handled','Crisis communication internal','Union of personal life conflict managed','Learning new software under deadline','AI tool adoption resistance eased','Sustainability initiative pushed','Community complaint response','Regulatory audit surprise prep','Whistleblower concern channel used','Harassment report support process','Inventory shrink investigation tact','Supply delay customer mitigation','Price increase communication','Merger uncertainty team support','Office relocation change mgmt','Shift schedule fairness dispute','Overtime refusal handled','Call monitoring feedback accepted','Scorecard disagreement resolved','Coaching plan resisted then worked','Interdepartmental blame stopped','Customer data privacy scare handled','Social media complaint public fix','VIP client white glove save','Lost documentation reconstructed','Interpreter coordination success','Night shift incident ownership','Holiday surge staffing plan','New manager relationship built','Old manager bad reference avoided','Peer recognition program started','Volunteer event led','Fundraiser target exceeded ethically','Scholarship recommendation integrity','Academic integrity case navigated','Clinical empathy under time pressure','Patient safety near-miss reported','Informed consent confusion clarified','Team huddle improved outcomes','Sprint retrospective honesty','Agile scope creep pushback','Waterfall to agile transition help','Legacy system migration patience','Technical debt prioritization argued','Code review conflict resolved','Production incident postmortem lead','Customer beta feedback incorporated','NPS detractor converted','CSAT root cause fixed','First call resolution improved','Average handle time vs quality balance','Knowledge base gap filled','Self-service deflection improved','Chat to voice escalation smooth','Social care response on brand','Proactive outreach retained account','Renewal risk identified early','Upsell timing read correctly','Downsell saved relationship','Competitor poach attempt blocked','Reference call won deal','RFP deadline heroic submit','Demo environment failure backup plan','Trade show lead follow-through','Partnership conflict de-escalated','Franchisee dispute mediated','Field tech no-show backup coordinated','Warranty goodwill exception approved','Recall communication calm leadership','Weather closure staffing rebalanced','Pandemic protocol enforcement empathy','Return to office tension eased','Hybrid meeting inclusion ensured','Neurodiversity accommodation success','Generational communication gap bridged'
];

const STAR_COMPANIES = {
  Corporate: ['Meridian Holdings', 'Apex Group', 'Horizon Partners', 'Summit Corp', 'Nova Industries'],
  Healthcare: ['CareBridge Health', 'Valley Medical', 'Regional Health System', 'BluePeak Clinics', 'Unity Care'],
  Finance: ['Summit Financial', 'Meridian Bank', 'Union Trust', 'Capital Ridge', 'Northstar Finance'],
  Technology: ['BrightStack', 'CloudServe', 'NovaTech', 'DataPulse', 'SecureLayer'],
  Retail: ['Metro Stores', 'Urban Retail Group', 'Prime Marketplace', 'StyleHouse', 'HomeNest'],
  Tourism: ['GlobalVoyage', 'Skyline Travel', 'Coastal Resorts', 'Peak Adventures', 'Heritage Tours'],
  Education: ['Northbridge University', 'Coastal College', 'Metro Community College', 'Summit Academy', 'Global Campus Online'],
  Telecom: ['ConnectTel', 'FiberWave', 'StreamMobile', 'BroadBand Plus', 'UniCom']
};

const INTERVIEWERS = ['Diana Foster', 'Carlos Mejia', 'Sarah Mitchell', 'James Okafor', 'Priya Shah', 'Marcus Lee', 'Eleanor Webb', 'Linda Torres', 'Victoria Hale', 'Robert Chen', 'Tom Walsh', 'Rachel Kim', 'Kevin Park', 'Amira Hassan', 'Daniel Foster', 'Michelle Grant', 'Sandra Lopez', 'Michael Torres', 'Patricia Moore', 'Dr. Ana Ruiz'];

function buildCsPool(poolKey, industry) {
  const specs = CS_SPECS[industry] || CS_SPECS.Corporate;
  const issues = expandCsIssues(specs);
  return issues.map((issue, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    return {
      id,
      poolKey,
      industry,
      title: issue.title,
      desc: issue.desc,
      issueType: issue.issueType,
      mood: issue.mood,
      diff: issue.diff,
      profileSeed: buildProfileSeed(id, industry, i, issue.issueType, issue.title, issue.desc)
    };
  });
}

function buildStarPool(poolKey, industry) {
  const companies = STAR_COMPANIES[industry] || STAR_COMPANIES.Corporate;
  return STAR_TOPICS.slice(0, POOL).map((topic, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    const company = companies[i % companies.length];
    const interviewer = INTERVIEWERS[i % INTERVIEWERS.length];
    const title = `STAR — ${topic}`;
    const desc = `Behavioral interview focused on: ${topic.toLowerCase()}.`;
    return {
      id,
      poolKey,
      type: 'star_interview',
      industry,
      title,
      desc,
      mood: moodAt(i),
      diff: diffAt(i),
      role: ['Senior HR Manager', 'Talent Acquisition', 'HR Business Partner', 'Operations Manager', 'People Director'][i % 5],
      company,
      interviewer,
      starFocus: [
        `Tell me about a time you demonstrated ${topic.toLowerCase()}.`,
        `Describe a specific situation related to ${topic.toLowerCase()} — what was the result?`,
        `Give an example when ${topic.toLowerCase()} was tested. What actions did you take?`
      ],
      profileSeed: buildProfileSeed(id, industry, i, 'general', title, desc)
    };
  });
}

function buildMeetingPool(poolKey) {
  const topics = STAR_TOPICS.slice(0, POOL);
  return topics.map((topic, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    const title = `Team Meeting — ${topic}`;
    const desc = `Team discussion centered on ${topic.toLowerCase()}. Contribute clearly and professionally.`;
    return {
      id, poolKey, type: 'meeting', industry: 'Corporate', title, desc, mood: moodAt(i), diff: diffAt(i),
      participants: ['You', `${INTERVIEWERS[i % INTERVIEWERS.length]} — Lead`, `${LAST[i % LAST.length]} — Colleague`, `${LAST[(i + 5) % LAST.length]} — Partner`],
      profileSeed: buildProfileSeed(id, 'Corporate', i, 'general', title, desc)
    };
  });
}

function buildNegotiationPool(poolKey) {
  const topics = STAR_TOPICS.slice(0, POOL);
  return topics.map((topic, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    const title = `Negotiation — ${topic}`;
    const desc = `Negotiate professionally regarding ${topic.toLowerCase()}.`;
    return {
      id, poolKey, type: 'negotiation', industry: 'Business', title, desc, mood: moodAt(i), diff: diffAt(i),
      counterpart: `${INTERVIEWERS[i % INTERVIEWERS.length]} — Counterpart`,
      profileSeed: buildProfileSeed(id, 'Corporate', i, 'general', title, desc)
    };
  });
}

function buildStakeholderPool(poolKey) {
  const topics = STAR_TOPICS.slice(0, POOL);
  return topics.map((topic, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    const title = `Stakeholder Alignment — ${topic}`;
    const desc = `Align stakeholders on ${topic.toLowerCase()} with competing priorities.`;
    return {
      id, poolKey, type: 'stakeholder', industry: 'Corporate', title, desc, mood: moodAt(i), diff: diffAt(i),
      role: 'Department Head',
      participants: ['You — Project Lead', `${INTERVIEWERS[i % INTERVIEWERS.length]} — IT`, `${INTERVIEWERS[(i + 3) % INTERVIEWERS.length]} — Finance`, `${INTERVIEWERS[(i + 7) % INTERVIEWERS.length]} — HR`],
      stakes: [`Priority A: ${topic}`, 'Budget pressure this quarter', 'Team capacity constrained'],
      profileSeed: buildProfileSeed(id, 'Corporate', i, 'general', title, desc)
    };
  });
}

function buildCorporatePool(poolKey) {
  const topics = STAR_TOPICS.slice(0, POOL);
  return topics.map((topic, i) => {
    const id = `${poolKey}-${pad(i + 1, 3)}`;
    const title = `Corporate Presentation — ${topic}`;
    const desc = `Present and defend proposals on ${topic.toLowerCase()} to executive audience.`;
    return {
      id, poolKey, type: 'corporate', industry: 'Corporate', title, desc, mood: moodAt(i), diff: diffAt(i),
      role: 'Board Director', company: STAR_COMPANIES.Corporate[i % STAR_COMPANIES.Corporate.length],
      participants: ['You', 'Sarah Chen — CFO', 'Robert Walsh — CEO', `${INTERVIEWERS[i % INTERVIEWERS.length]} — Director`],
      profileSeed: buildProfileSeed(id, 'Corporate', i, 'general', title, desc)
    };
  });
}

const INDUSTRY_MAP = {
  corporate: 'Corporate',
  tech: 'Technology',
  technology: 'Technology',
  healthcare: 'Healthcare',
  education: 'Education',
  finance: 'Finance',
  hospitality: 'Tourism',
  tourism: 'Tourism',
  retail: 'Retail',
  telecom: 'Telecom'
};

const CS_INDUSTRIES = ['Healthcare', 'Finance', 'Corporate', 'Technology', 'Tourism', 'Retail', 'Education', 'Telecom'];

const pools = {};

for (const ind of CS_INDUSTRIES) {
  const key = `customer_service:${ind.toLowerCase()}`;
  pools[key] = buildCsPool(key, ind);
  pools[`problem_solving:${ind.toLowerCase()}`] = pools[key];
}

for (const [raw, label] of Object.entries(INDUSTRY_MAP)) {
  const sk = `mock_interview:${raw}`;
  pools[sk] = buildStarPool(sk, label);
}

pools['team_meeting:all'] = buildMeetingPool('team_meeting:all');
pools['negotiation:all'] = buildNegotiationPool('negotiation:all');
pools['stakeholder:all'] = buildStakeholderPool('stakeholder:all');
pools['presentation:all'] = buildCorporatePool('presentation:all');

const outJs = `/** Auto-generated — 100 scenarios per pool. Run: node scripts/build-nexora-scenario-bank.mjs */\nvar NEXORA_SCENARIO_BANK_DATA = ${JSON.stringify({ pools, POOL_SIZE: POOL })};
`;

fs.writeFileSync(OUT, outJs, 'utf8');
console.log('Wrote', OUT);
console.log('Pools:', Object.keys(pools).length, '×', POOL, '=', Object.keys(pools).length * POOL, 'scenarios');
