/**
 * Nexora scenario library — distinct issues per type, industry, and difficulty.
 * Each scenario MUST have a unique issueType so CRM + voice openings stay different.
 */
var NEXORA_SCENARIO_LIBRARY = (function () {
  'use strict';

  function cs(id, industry, title, desc, issueType, mood, diff) {
    return { id: id, industry: industry, title: title, desc: desc, issueType: issueType, mood: mood || 'frustrated', diff: diff || 3 };
  }

  var general = [
    cs('cs1', 'Banking', 'Billing Dispute', 'Client received an unexpected charge and wants it reversed immediately.', 'billing_dispute', 'frustrated', 2),
    cs('cs2', 'Telecom', 'Service Cancellation', 'Client wants to cancel their account. You must retain them.', 'cancellation', 'cold', 3),
    cs('cs3', 'Technology', 'Technical Issue', 'Client cannot access their online account and is frustrated.', 'technical', 'impatient', 2),
    cs('cs4', 'Retail', 'Refund Request', 'Client demanding a refund for a service they claim did not work.', 'refund', 'angry', 3),
    cs('cs5', 'Banking', 'Complaint Escalation', 'Client had a terrible experience and threatens to leave publicly.', 'complaint_escalation', 'furious', 4),
    cs('cs6', 'Banking', 'Account Security', 'Client suspects unauthorized access to their account.', 'security', 'worried', 3),
    cs('cs7', 'Telecom', 'Late Fee Dispute', 'Client received a late fee and claims they paid on time.', 'late_fee', 'indignant', 3),
    cs('cs8', 'Telecom', 'Service Upgrade', 'Client wants to upgrade their plan and needs guidance.', 'upgrade', 'pleasant', 1),
    cs('cs9', 'Retail', 'VIP Complaint', 'High-value client threatening to move all accounts elsewhere.', 'vip_complaint', 'very_angry', 5),
    cs('cs10', 'Healthcare', 'Wrong Information', 'Client was given wrong information by another agent and feels misled.', 'wrong_information', 'disappointed', 3),
    cs('cs11', 'Finance', 'Overdraft Fee Dispute', 'Client was charged an overdraft fee after a deposit should have cleared.', 'late_fee', 'indignant', 3),
    cs('cs12', 'Retail', 'Damaged Delivery', 'Client received a damaged product and wants a replacement shipped today.', 'refund', 'angry', 3),
    cs('cs13', 'Technology', 'Subscription Auto-Renewal', 'Client was auto-renewed for a yearly plan they thought they cancelled.', 'cancellation', 'frustrated', 3),
    cs('cs14', 'Telecom', 'Roaming Charges Surprise', 'Client returned from travel with unexpected international roaming charges.', 'billing_dispute', 'furious', 4),
    cs('cs15', 'Banking', 'Wire Transfer Delay', 'Client sent a wire transfer that has not arrived after three business days.', 'technical', 'worried', 4)
  ];

  var healthcare = [
    cs('hc1', 'Healthcare', 'Insurance Claim Denied', 'Patient\'s claim for a recent procedure was denied and they need it reprocessed.', 'insurance_claim', 'worried', 3),
    cs('hc2', 'Healthcare', 'Prior Authorization Required', 'Specialist visit blocked because prior authorization was never submitted.', 'prior_auth', 'impatient', 4),
    cs('hc3', 'Healthcare', 'Prescription Not Covered', 'Pharmacy rejected a refill because the medication is not on the formulary.', 'prescription', 'frustrated', 3),
    cs('hc4', 'Healthcare', 'Wrong Copay Charged', 'Patient paid a higher copay at the clinic than their plan shows on file.', 'copay_dispute', 'indignant', 2),
    cs('hc5', 'Healthcare', 'Appointment Cancellation Fee', 'Patient was billed a no-show fee but says they called to cancel.', 'late_fee', 'angry', 3),
    cs('hc6', 'Healthcare', 'Lab Results Delay', 'Patient has been waiting ten days for blood test results with no callback.', 'lab_results', 'anxious', 3),
    cs('hc7', 'Healthcare', 'Referral Not Processed', 'PCP referral to a specialist expired before the patient could book.', 'referral', 'disappointed', 2),
    cs('hc8', 'Healthcare', 'Duplicate Medical Bill', 'Patient received two identical statements for the same office visit.', 'billing_dispute', 'furious', 4),
    cs('hc9', 'Healthcare', 'Out-of-Network Surprise Bill', 'Patient thought the provider was in-network and received a large balance bill.', 'medical_billing', 'very_angry', 5),
    cs('hc10', 'Healthcare', 'Medication Interaction Concern', 'Patient wants to confirm two prescriptions are safe to take together.', 'prescription', 'worried', 2),
    cs('hc11', 'Healthcare', 'Telehealth Login Failure', 'Patient cannot join a scheduled video visit and the appointment starts in minutes.', 'technical', 'impatient', 3),
    cs('hc12', 'Healthcare', 'Medical Records Request', 'Patient needs records sent to a new specialist before Friday.', 'records_request', 'neutral', 2),
    cs('hc13', 'Healthcare', 'Coverage Termination Notice', 'Patient received a letter saying coverage ended but they paid premiums.', 'insurance_claim', 'panicked', 5),
    cs('hc14', 'Healthcare', 'Equipment Rental Return', 'Patient was charged for a CPAP machine they already returned.', 'refund', 'indignant', 3),
    cs('hc15', 'Healthcare', 'Vaccination Record Update', 'Employer needs proof of vaccination updated in the patient portal.', 'records_request', 'pleasant', 1)
  ];

  var finance = [
    cs('fn1', 'Finance', 'Mortgage Payment Misapplied', 'Payment posted to the wrong loan account number.', 'billing_dispute', 'worried', 4),
    cs('fn2', 'Finance', 'Credit Score Dispute', 'Client disputes a late mark reported to the credit bureau.', 'complaint_escalation', 'indignant', 4),
    cs('fn3', 'Finance', 'Investment Withdrawal Hold', 'Client cannot withdraw funds and needs them for a closing tomorrow.', 'technical', 'panicked', 5),
    cs('fn4', 'Finance', 'Loan Payoff Quote Wrong', 'Payoff amount changed between quote and payment attempt.', 'wrong_information', 'frustrated', 3),
    cs('fn5', 'Finance', 'Fraud Alert on Card', 'Legitimate large purchase was blocked and client is traveling.', 'security', 'impatient', 3)
  ];

  var tourism = [
    cs('tr1', 'Tourism', 'Flight Cancellation Refund', 'Airline cancelled the flight and client wants full cash refund not voucher.', 'refund', 'angry', 4),
    cs('tr2', 'Tourism', 'Hotel Overbooking', 'Client arrived and hotel has no room despite confirmed reservation.', 'complaint_escalation', 'furious', 5),
    cs('tr3', 'Tourism', 'Lost Baggage Claim', 'Baggage missing for 48 hours with medication inside.', 'booking_issue', 'panicked', 4),
    cs('tr4', 'Tourism', 'Tour Date Change', 'Client needs to move a prepaid excursion due to illness.', 'booking_change', 'worried', 2),
    cs('tr5', 'Tourism', 'Loyalty Points Missing', 'Points from last trip never posted to rewards account.', 'wrong_information', 'indignant', 3)
  ];

  var retail = [
    cs('rt1', 'Retail', 'Price Match Request', 'Competitor has lower price and client wants match plus shipping refund.', 'refund', 'firm', 2),
    cs('rt2', 'Retail', 'Gift Card Balance Zero', 'Gift card shows zero balance despite never being used.', 'billing_dispute', 'angry', 3),
    cs('rt3', 'Retail', 'Subscription Box Skip', 'Client charged for a box they paused in the app.', 'cancellation', 'frustrated', 2),
    cs('rt4', 'Retail', 'Warranty Denial', 'Extended warranty claim rejected for a defective appliance.', 'complaint_escalation', 'furious', 4)
  ];

  var tech = [
    cs('tk1', 'Technology', 'License Seat Limit', 'Team locked out because license count is wrong after renewal.', 'technical', 'impatient', 3),
    cs('tk2', 'Technology', 'Data Export Failed', 'Client cannot export customer data before contract ends.', 'technical', 'worried', 4),
    cs('tk3', 'Technology', 'API Downtime SLA Claim', 'Client wants credit for SLA breach during outage.', 'complaint_escalation', 'firm', 4),
    cs('tk4', 'Technology', 'Wrong Plan Downgrade', 'Account downgraded accidentally and features were removed.', 'wrong_information', 'angry', 3)
  ];

  var star = [
    { id: 'st1', type: 'star_interview', industry: 'Corporate', title: 'STAR — Leadership Under Pressure', desc: 'Behavioral interview focused on leadership, decision-making and conflict resolution.', mood: 'professional', diff: 3, role: 'Senior HR Manager', company: 'Global Corp', interviewer: 'Diana Foster', starFocus: ['Tell me about a time you led a difficult team through a deadline crisis.', 'Describe a situation where you had to make a decision with incomplete information.', 'Give an example of a conflict you resolved professionally without escalating.'] },
    { id: 'st2', type: 'star_interview', industry: 'BPO', title: 'STAR — Customer Service Excellence', desc: 'STAR interview for a customer-facing role. Focus on empathy, problem-solving and communication.', mood: 'neutral', diff: 2, role: 'Talent Acquisition', company: 'ServiceFirst BPO', interviewer: 'Carlos Mejia', starFocus: ['Describe a time you turned an angry customer into a satisfied one.', 'Tell me about a situation where you had to handle multiple priorities at once.', 'Give an example of how you adapted your communication style for a difficult caller.'] },
    { id: 'st3', type: 'star_interview', industry: 'Corporate', title: 'STAR — Teamwork & Collaboration', desc: 'Assess how you collaborate across departments under tight timelines.', mood: 'professional', diff: 2, role: 'HR Business Partner', company: 'Northline Inc', interviewer: 'Priya Shah', starFocus: ['Tell me about a time you worked with a team that disagreed on the approach.', 'Describe when you had to depend on others to deliver a critical result.', 'Share an example of giving constructive feedback to a peer.'] },
    { id: 'st4', type: 'star_interview', industry: 'Technology', title: 'STAR — Problem Solving & Innovation', desc: 'Evaluate analytical thinking and creative solutions.', mood: 'curious', diff: 3, role: 'Engineering Manager', company: 'BrightStack', interviewer: 'Marcus Lee', starFocus: ['Describe a complex problem you solved with limited resources.', 'Tell me about a time you improved a process that saved time or money.', 'Give an example of a mistake you made and how you recovered.'] },
    { id: 'st5', type: 'star_interview', industry: 'Finance', title: 'STAR — Integrity & Compliance', desc: 'Focus on ethical judgment and handling sensitive information.', mood: 'serious', diff: 4, role: 'Compliance Director', company: 'Meridian Bank', interviewer: 'Eleanor Webb', starFocus: ['Tell me about a time you faced an ethical dilemma at work.', 'Describe when you had to enforce a policy others disagreed with.', 'Share an example of protecting confidential information under pressure.'] },
    { id: 'st6', type: 'star_interview', industry: 'Healthcare', title: 'STAR — Patient-Centered Communication', desc: 'Assess empathy, clarity and professionalism with sensitive situations.', mood: 'warm', diff: 3, role: 'Patient Experience Lead', company: 'CareBridge Health', interviewer: 'Sarah Mitchell', starFocus: ['Describe a time you explained something complex to someone who was upset.', 'Tell me about a situation where you had to stay calm under emotional pressure.', 'Give an example of going above and beyond for someone in need.'] },
    { id: 'st7', type: 'star_interview', industry: 'Retail', title: 'STAR — Sales & Persuasion', desc: 'Evaluate influence, objection handling and closing skills.', mood: 'energetic', diff: 3, role: 'Regional Sales Manager', company: 'Urban Retail Group', interviewer: 'James Okafor', starFocus: ['Tell me about a time you overcame a strong objection to close a deal.', 'Describe when you upsold without being pushy.', 'Share an example of rebuilding trust after a service failure.'] },
    { id: 'st8', type: 'star_interview', industry: 'BPO', title: 'STAR — Handling Difficult Calls', desc: 'Call-center behavioral questions on de-escalation and policy adherence.', mood: 'neutral', diff: 3, role: 'Operations Supervisor', company: 'GlobalLink BPO', interviewer: 'Linda Torres', starFocus: ['Describe your toughest call and how you handled it.', 'Tell me about a time you followed policy when the customer wanted an exception.', 'Give an example of documenting an issue clearly for the next agent.'] },
    { id: 'st9', type: 'star_interview', industry: 'Corporate', title: 'STAR — Adaptability & Change', desc: 'Assess flexibility when priorities or leadership change suddenly.', mood: 'professional', diff: 3, role: 'VP People', company: 'Apex Solutions', interviewer: 'Victoria Hale', starFocus: ['Tell me about a major change at work and how you adapted.', 'Describe a time your project scope changed mid-stream.', 'Share when you learned a new skill quickly to meet a deadline.'] },
    { id: 'st10', type: 'star_interview', industry: 'Technology', title: 'STAR — Ownership & Accountability', desc: 'Focus on taking responsibility and driving outcomes end-to-end.', mood: 'direct', diff: 4, role: 'Product Director', company: 'NovaTech', interviewer: 'Robert Chen', starFocus: ['Describe a project you owned from start to finish.', 'Tell me about a time you missed a target and what you did next.', 'Give an example of pushing back on unrealistic expectations professionally.'] },
    { id: 'st11', type: 'star_interview', industry: 'Finance', title: 'STAR — Attention to Detail', desc: 'Precision, accuracy and error prevention under volume.', mood: 'focused', diff: 3, role: 'Audit Manager', company: 'Summit Financial', interviewer: 'Tom Walsh', starFocus: ['Tell me about catching an error others missed.', 'Describe a time details mattered for a high-stakes outcome.', 'Share how you stay accurate when work is repetitive.'] },
    { id: 'st12', type: 'star_interview', industry: 'Healthcare', title: 'STAR — Working with Regulations', desc: 'HIPAA-aware scenarios and process compliance.', mood: 'formal', diff: 4, role: 'Quality Manager', company: 'Regional Medical Center', interviewer: 'Dr. Ana Ruiz', starFocus: ['Describe following a strict protocol when a shortcut was tempting.', 'Tell me about protecting patient privacy in a busy environment.', 'Give an example of escalating a compliance concern appropriately.'] },
    { id: 'st13', type: 'star_interview', industry: 'BPO', title: 'STAR — Multitasking & Metrics', desc: 'Speed, quality and KPI awareness in high-volume environments.', mood: 'fast', diff: 3, role: 'Workforce Manager', company: 'ConnectFirst', interviewer: 'Kevin Park', starFocus: ['Describe managing multiple chats or tickets without dropping quality.', 'Tell me about hitting a tough metric target.', 'Share when you balanced speed with accuracy on a bad day.'] },
    { id: 'st14', type: 'star_interview', industry: 'Corporate', title: 'STAR — Cross-Cultural Communication', desc: 'Global teams, language barriers and inclusive communication.', mood: 'open', diff: 3, role: 'Global HR Lead', company: 'WorldBridge', interviewer: 'Amira Hassan', starFocus: ['Tell me about working effectively with people from different cultures.', 'Describe miscommunication you fixed before it became a problem.', 'Give an example of adjusting your style for an international audience.'] },
    { id: 'st15', type: 'star_interview', industry: 'Retail', title: 'STAR — Inventory & Operations', desc: 'Operational discipline, stock issues and customer impact.', mood: 'practical', diff: 2, role: 'Store Operations Manager', company: 'Metro Stores', interviewer: 'Daniel Foster', starFocus: ['Describe resolving a stockout that affected a key customer.', 'Tell me about coordinating with other teams during a busy period.', 'Share an example of improving a daily routine at work.'] },
    { id: 'st16', type: 'star_interview', industry: 'Technology', title: 'STAR — Client-Facing Technical Support', desc: 'Explain technical issues clearly to non-technical stakeholders.', mood: 'patient', diff: 3, role: 'Customer Success Lead', company: 'CloudServe', interviewer: 'Rachel Kim', starFocus: ['Describe explaining a technical issue to a frustrated client.', 'Tell me about a time you set expectations when a fix would take time.', 'Give an example of turning a support ticket into a loyal relationship.'] },
    { id: 'st17', type: 'star_interview', industry: 'Finance', title: 'STAR — Risk & Escalation', desc: 'Knowing when to escalate fraud, credit or compliance risks.', mood: 'alert', diff: 4, role: 'Risk Officer', company: 'Union Trust', interviewer: 'Patricia Moore', starFocus: ['Tell me about escalating an issue before it became a major loss.', 'Describe assessing risk when a client pushed for an exception.', 'Share when you said no to a request and explained why professionally.'] },
    { id: 'st18', type: 'star_interview', industry: 'Healthcare', title: 'STAR — Empathy in Crisis', desc: 'High-emotion situations requiring calm and clarity.', mood: 'compassionate', diff: 4, role: 'Nurse Manager', company: 'Valley Health', interviewer: 'Michelle Grant', starFocus: ['Describe supporting someone who received bad news.', 'Tell me about staying professional when a caller was verbally aggressive.', 'Give an example of coordinating help when time was critical.'] },
    { id: 'st19', type: 'star_interview', industry: 'BPO', title: 'STAR — First 90 Days Success', desc: 'Onboarding, learning curve and early impact.', mood: 'encouraging', diff: 2, role: 'Training Lead', company: 'VoicePath BPO', interviewer: 'Sandra Lopez', starFocus: ['Tell me how you learned a new role quickly.', 'Describe feedback you applied to improve in your first months.', 'Share an early win that showed you were the right hire.'] },
    { id: 'st20', type: 'star_interview', industry: 'Corporate', title: 'STAR — Strategic Thinking', desc: 'Big-picture judgment for senior individual contributor roles.', mood: 'thoughtful', diff: 5, role: 'Chief of Staff', company: 'Horizon Group', interviewer: 'Michael Torres', starFocus: ['Describe aligning daily work with a long-term company goal.', 'Tell me about recommending a change that improved results.', 'Give an example of prioritizing when everything seemed urgent.'] }
  ];

  var interviews = [
    { id: 'iv1', type: 'interview', title: 'Job Interview — Customer Service Rep', desc: 'Behavioral interview for a customer-facing role. Interviewer will ask STAR questions.', mood: 'professional', diff: 2, interviewer: 'Sarah Mitchell', role: 'HR Manager', company: 'NovaCorp' },
    { id: 'iv2', type: 'interview', title: 'Job Interview — Team Lead', desc: 'Senior leadership interview. Expect strategic and behavioral questions.', mood: 'demanding', diff: 4, interviewer: 'James Okafor', role: 'Director of Operations', company: 'Apex Solutions' },
    { id: 'iv3', type: 'interview', title: 'Job Interview — BPO Agent', desc: 'Fast-paced BPO interview testing English fluency, speed and professionalism.', mood: 'neutral', diff: 2, interviewer: 'Linda Torres', role: 'Talent Acquisition', company: 'GlobalLink BPO' },
    { id: 'iv4', type: 'interview', title: 'Panel Interview — Account Manager', desc: 'Three interviewers. Answer to all of them professionally.', mood: 'intense', diff: 5, interviewer: 'Panel', role: 'Multiple Interviewers', company: 'Meridian Group', panelists: ['Carlos Vega — VP Sales', 'Rachel Kim — HR Director', 'Tom Walsh — Operations'] },
    { id: 'iv5', type: 'interview', title: 'Job Interview — Healthcare Call Center', desc: 'Interview for patient support role with HIPAA and empathy focus.', mood: 'warm', diff: 3, interviewer: 'Dr. Ana Ruiz', role: 'Patient Services Director', company: 'CareBridge Health' },
    { id: 'iv6', type: 'interview', title: 'Job Interview — Technical Account Manager', desc: 'Blend of technical depth and client communication skills.', mood: 'analytical', diff: 4, interviewer: 'Marcus Lee', role: 'VP Customer Success', company: 'BrightStack' }
  ];

  var meetings = [
    { id: 'mt1', type: 'meeting', title: 'Weekly Team Standup', desc: 'Present your weekly progress and blockers. Be concise and professional.', mood: 'casual', diff: 1, participants: ['Alex — Team Lead', 'Maria — Dev', 'Sam — QA', 'You'] },
    { id: 'mt2', type: 'meeting', title: 'Project Kickoff Meeting', desc: 'Lead the kickoff for a new project. Align stakeholders on goals and timeline.', mood: 'formal', diff: 3, participants: ['You', 'Diana — PM', 'Robert — Client', 'Linda — Design', 'Kevin — Dev'] },
    { id: 'mt3', type: 'meeting', title: 'Client Presentation', desc: 'Present quarterly results to an important client. Handle tough questions.', mood: 'demanding', diff: 4, participants: ['You', 'Mr. Chen — Client CEO', 'Sarah — Client CFO', 'Your Manager'] },
    { id: 'mt4', type: 'meeting', title: 'Conflict Resolution Meeting', desc: 'Mediate a disagreement between team members. Stay neutral and professional.', mood: 'tense', diff: 4, participants: ['You — Mediator', 'Jake', 'Priya', 'Team Lead — Observer'] }
  ];

  var negotiations = [
    { id: 'ng1', type: 'negotiation', title: 'Salary Negotiation', desc: 'Negotiate a salary increase with your direct manager. Be confident but professional.', mood: 'neutral', diff: 3, counterpart: 'Your Manager' },
    { id: 'ng2', type: 'negotiation', title: 'Vendor Contract Negotiation', desc: 'Negotiate pricing and terms with an external vendor.', mood: 'firm', diff: 4, counterpart: 'Vendor Representative' },
    { id: 'ng3', type: 'negotiation', industry: 'Business', title: 'Contract Renewal Negotiation', desc: 'Renew a major contract with a client who wants significant price reductions.', mood: 'firm', diff: 4, role: 'Client Representative', participants: ['You — Sales Director', 'Alice — Client Procurement Lead'], display: 'call' },
    { id: 'ng4', type: 'negotiation', industry: 'Business', title: 'Partnership Deal Negotiation', desc: 'Negotiate the terms of a new business partnership.', mood: 'professional', diff: 3, role: 'Business Partner', participants: ['You', 'Alice — Potential Partner CEO'], display: 'call' }
  ];

  var corporate = [
    { id: 'cp1', type: 'corporate', industry: 'Corporate', title: 'Board Presentation', desc: 'Present your proposal to the board. A skeptical board director evaluates ROI and strategic fit.', mood: 'demanding', diff: 5, role: 'Board Director', company: 'Meridian Holdings', participants: ['You', 'Sarah Chen — CFO', 'Robert Walsh — CEO', 'Eleanor Webb — Board Director'], allowPDF: true, pdfPrompt: 'Review the uploaded presentation and challenge the presenter on weak points, ROI assumptions, and strategic alignment.' },
    { id: 'cp2', type: 'corporate', industry: 'Corporate', title: 'Executive Strategy Meeting', desc: 'Align on quarterly strategy with C-suite. The COO pushes back on execution plans.', mood: 'firm', diff: 4, role: 'COO', company: 'Apex Group', participants: ['You', 'Victoria Hale — COO', 'Marcus Lee — CMO', 'Diana Ross — CTO'], allowPDF: false },
    { id: 'cp3', type: 'corporate', industry: 'Corporate', title: 'Investor Pitch', desc: 'Pitch your business to a VC firm. A sharp investor asks hard questions about traction and financials.', mood: 'skeptical', diff: 5, role: 'Lead Investor', company: 'Venture Capital Partners', participants: ['You', 'Robert Chen — Lead Investor', 'James Park — Associate'], allowPDF: true, pdfPrompt: 'You are a VC investor reviewing this pitch deck. Ask tough questions about unit economics, market size, and competitive moat.' }
  ];

  var stakeholder = [
    { id: 'sh1', type: 'stakeholder', industry: 'Corporate', title: 'Multi-Stakeholder Alignment', desc: 'Align multiple departments on a new process change. Each stakeholder has different priorities.', mood: 'mixed', diff: 4, role: 'Department Head', participants: ['You — Project Lead', 'Patricia Kim — IT Director (resistant)', 'Mark — Finance (budget-focused)', 'Sandra — HR (people-first)'], stakes: ['IT: concerned about implementation timeline', 'Finance: focused on cost reduction', 'HR: worried about team impact'] },
    { id: 'sh2', type: 'stakeholder', industry: 'Corporate', title: 'Client Escalation — Stakeholder Call', desc: 'A major client is unhappy. You must manage the relationship with multiple client stakeholders on the call.', mood: 'tense', diff: 5, role: 'Account Director', participants: ['You — Account Manager', 'Alice — Client CEO (angry)', 'Tom — Client IT Lead', 'Your Manager — Observer'], stakes: ['Client threatens to leave', 'SLA breach occurred', 'Compensation expected'] }
  ];

  var medical = [
    { id: 'md1', type: 'medical', industry: 'Healthcare', title: 'Patient Consultation', desc: 'Handle a concerned patient asking about their diagnosis and treatment plan. Be empathetic and clear.', mood: 'worried', diff: 2, role: 'Patient', participants: ['You — Healthcare Provider', 'Alice — Patient'], display: 'call' },
    { id: 'md2', type: 'medical', industry: 'Healthcare', title: 'Difficult Patient — Refusing Treatment', desc: 'Patient is refusing recommended treatment. De-escalate and guide them professionally.', mood: 'resistant', diff: 4, role: 'Patient', participants: ['You — Healthcare Provider', 'Alice — Patient'], display: 'call' }
  ];

  var all = general.concat(healthcare, finance, tourism, retail, tech, star, interviews, meetings, negotiations, corporate, stakeholder, medical);

  var INDUSTRY_KEY_MAP = {
    corporate: 'Corporate', tech: 'Technology', technology: 'Technology',
    healthcare: 'Healthcare', health: 'Healthcare', medical: 'Healthcare',
    education: 'Banking', finance: 'Finance', banking: 'Banking',
    hospitality: 'Tourism', tourism: 'Tourism',
    retail: 'Retail', telecom: 'Telecom', bpo: 'BPO'
  };

  function normalizeIndustryKey(raw) {
    if (!raw) return '';
    return String(raw).toLowerCase().replace(/[^a-z]/g, '');
  }

  function resolveIndustryLabel(nxConfig) {
    if (!nxConfig) return '';
    if (nxConfig.industryLabel) return nxConfig.industryLabel;
    var key = normalizeIndustryKey(nxConfig.industry);
    return INDUSTRY_KEY_MAP[key] || nxConfig.industry || '';
  }

  function resolveIndustryPool(industryLabel) {
    var key = normalizeIndustryKey(industryLabel);
    if (key === 'healthcare' || key === 'health' || key === 'medical') return healthcare;
    if (key === 'finance' || key === 'banking') return finance.concat(general.filter(function (s) { return s.industry === 'Banking' || s.industry === 'Finance'; }));
    if (key === 'tourism' || key === 'hospitality') return tourism;
    if (key === 'retail') return retail.concat(general.filter(function (s) { return s.industry === 'Retail'; }));
    if (key === 'tech' || key === 'technology') return tech.concat(general.filter(function (s) { return s.industry === 'Technology'; }));
    if (key === 'telecom') return general.filter(function (s) { return s.industry === 'Telecom'; });
    return general;
  }

  var FALLBACK_BY_INDUSTRY = {
    Healthcare: [
      { title: 'Insurance Claim Denied', desc: 'Claim for a recent visit was denied; patient needs help reprocessing.', issueType: 'insurance_claim', mood: 'worried' },
      { title: 'Prior Authorization Delay', desc: 'Specialist appointment blocked pending authorization from insurer.', issueType: 'prior_auth', mood: 'impatient' },
      { title: 'Prescription Refill Problem', desc: 'Pharmacy cannot fill prescription; patient needs alternative covered.', issueType: 'prescription', mood: 'frustrated' },
      { title: 'Wrong Copay on Statement', desc: 'Patient paid more at checkout than plan copay shows.', issueType: 'copay_dispute', mood: 'indignant' },
      { title: 'Lab Results Overdue', desc: 'Blood work results overdue with no callback from clinic.', issueType: 'lab_results', mood: 'anxious' },
      { title: 'Referral Expired', desc: 'Referral to specialist expired before booking.', issueType: 'referral', mood: 'disappointed' },
      { title: 'Duplicate Hospital Bill', desc: 'Two identical charges for same procedure on statement.', issueType: 'billing_dispute', mood: 'furious' },
      { title: 'Out-of-Network Charge', desc: 'Unexpected balance bill from provider thought in-network.', issueType: 'medical_billing', mood: 'very_angry' },
      { title: 'Telehealth Access Issue', desc: 'Cannot join video visit starting in ten minutes.', issueType: 'technical', mood: 'panicked' },
      { title: 'Medical Records Transfer', desc: 'Records needed at new specialist before end of week.', issueType: 'records_request', mood: 'neutral' },
      { title: 'Coverage Lapse Letter', desc: 'Received termination notice despite paying premiums.', issueType: 'insurance_claim', mood: 'panicked' },
      { title: 'Equipment Return Charge', desc: 'Charged for medical device already returned.', issueType: 'refund', mood: 'indignant' },
      { title: 'Medication Interaction Question', desc: 'Wants pharmacist confirmation two drugs are safe together.', issueType: 'prescription', mood: 'worried' },
      { title: 'Appointment No-Show Fee', desc: 'Billed no-show fee but patient says they cancelled.', issueType: 'late_fee', mood: 'angry' },
      { title: 'Vaccination Record Missing', desc: 'Employer portal shows outdated vaccination status.', issueType: 'records_request', mood: 'pleasant' },
      { title: 'Ambulance Claim Rejected', desc: 'Emergency transport claim rejected as not medically necessary.', issueType: 'insurance_claim', mood: 'furious' },
      { title: 'Dental Coverage Confusion', desc: 'Dental procedure partially denied; wants explanation of benefits.', issueType: 'copay_dispute', mood: 'confused' },
      { title: 'Home Health Scheduling', desc: 'Missed home nurse visit; needs reschedule today.', issueType: 'appointment', mood: 'impatient' },
      { title: 'Prior MRI Authorization', desc: 'Imaging center requires auth number before scan tomorrow.', issueType: 'prior_auth', mood: 'worried' },
      { title: 'Medicare Part D Gap', desc: 'Hit coverage gap and cannot afford next prescription fill.', issueType: 'prescription', mood: 'desperate' }
    ],
    Banking: [
      { title: 'Unauthorized Wire Transfer', desc: 'Wire sent without authorization; client demands reversal.', issueType: 'security', mood: 'panicked' },
      { title: 'Overdraft Fee Dispute', desc: 'Overdraft fee after deposit should have cleared.', issueType: 'late_fee', mood: 'indignant' },
      { title: 'Check Hold Release', desc: 'Large check on hold longer than promised.', issueType: 'technical', mood: 'impatient' },
      { title: 'Credit Card APR Increase', desc: 'APR raised without clear notice; wants explanation.', issueType: 'complaint_escalation', mood: 'angry' },
      { title: 'Account Closure Blocked', desc: 'Cannot close account due to pending dispute.', issueType: 'cancellation', mood: 'frustrated' },
      { title: 'Fraud Alert False Positive', desc: 'Card blocked during travel; needs immediate unlock.', issueType: 'security', mood: 'impatient' },
      { title: 'Mortgage Escrow Shortage', desc: 'Monthly payment jumped due to escrow adjustment.', issueType: 'billing_dispute', mood: 'worried' },
      { title: 'Duplicate ATM Withdrawal', desc: 'ATM debited twice for one withdrawal.', issueType: 'billing_dispute', mood: 'furious' },
      { title: 'Beneficiary Update Delay', desc: 'Beneficiary change not reflected after two weeks.', issueType: 'wrong_information', mood: 'disappointed' },
      { title: 'Safe Deposit Access Issue', desc: 'Cannot access safe deposit box before important trip.', issueType: 'technical', mood: 'urgent' }
    ],
    Telecom: [
      { title: 'Roaming Bill Shock', desc: 'Unexpected international charges after travel.', issueType: 'billing_dispute', mood: 'furious' },
      { title: 'Internet Outage Credit', desc: 'Outage lasted 12 hours; wants bill credit.', issueType: 'complaint_escalation', mood: 'angry' },
      { title: 'Number Port Failed', desc: 'Number port to new carrier failed mid-process.', issueType: 'technical', mood: 'impatient' },
      { title: 'Equipment Return Fee', desc: 'Charged for modem already returned via mail.', issueType: 'refund', mood: 'indignant' },
      { title: 'Plan Downgrade Blocked', desc: 'Cannot downgrade plan online; needs agent help.', issueType: 'cancellation', mood: 'frustrated' },
      { title: '5G Coverage Complaint', desc: 'Paid for 5G plan but speeds are unusable at home.', issueType: 'complaint_escalation', mood: 'angry' },
      { title: 'Family Plan Line Removal', desc: 'Wants to remove ex-partner line without penalty.', issueType: 'cancellation', mood: 'tense' },
      { title: 'Autopay Double Charge', desc: 'Autopay ran twice this month.', issueType: 'billing_dispute', mood: 'furious' },
      { title: 'Business Line Outage', desc: 'Business phone down during peak hours.', issueType: 'technical', mood: 'panicked' },
      { title: 'Loyalty Discount Missing', desc: 'Ten-year customer discount not applied.', issueType: 'wrong_information', mood: 'disappointed' }
    ],
    Retail: [
      { title: 'Damaged Shipment', desc: 'Package arrived crushed; wants replacement not refund.', issueType: 'refund', mood: 'angry' },
      { title: 'Gift Card Empty', desc: 'Unused gift card shows zero balance.', issueType: 'billing_dispute', mood: 'furious' },
      { title: 'Wrong Item Shipped', desc: 'Received wrong size; event is this weekend.', issueType: 'booking_issue', mood: 'impatient' },
      { title: 'Price Match Denied', desc: 'Competitor price lower; wants match honored.', issueType: 'refund', mood: 'firm' },
      { title: 'Subscription Charged After Pause', desc: 'Box subscription charged despite pause in app.', issueType: 'cancellation', mood: 'frustrated' },
      { title: 'Warranty Claim Rejected', desc: 'Appliance warranty denied for defect.', issueType: 'complaint_escalation', mood: 'very_angry' },
      { title: 'Loyalty Points Expired', desc: 'Points expired without notice email.', issueType: 'wrong_information', mood: 'indignant' },
      { title: 'Store Pickup Missing', desc: 'Order marked picked up but never received.', issueType: 'technical', mood: 'angry' },
      { title: 'Return Window Exception', desc: 'Return one day past policy; item unused with tags.', issueType: 'refund', mood: 'pleading' },
      { title: 'Bulk Order Short Shipped', desc: 'Corporate order missing ten units.', issueType: 'complaint_escalation', mood: 'firm' }
    ],
    Technology: [
      { title: 'License Lockout', desc: 'Team locked out after license renewal miscount.', issueType: 'technical', mood: 'impatient' },
      { title: 'Data Export Blocked', desc: 'Cannot export data before contract ends Friday.', issueType: 'technical', mood: 'worried' },
      { title: 'SLA Breach Credit', desc: 'Demands credit for 6-hour API outage.', issueType: 'complaint_escalation', mood: 'firm' },
      { title: 'Wrong Plan Downgrade', desc: 'Features removed after accidental downgrade.', issueType: 'wrong_information', mood: 'angry' },
      { title: 'SSO Login Failure', desc: 'Entire team cannot SSO after IdP change.', issueType: 'technical', mood: 'panicked' },
      { title: 'Invoice Overcharge', desc: 'Billed for seats not in use.', issueType: 'billing_dispute', mood: 'indignant' },
      { title: 'Sandbox Deleted', desc: 'Production-like sandbox deleted without warning.', issueType: 'complaint_escalation', mood: 'furious' },
      { title: 'Integration Timeout', desc: 'Webhook integration failing intermittently.', issueType: 'technical', mood: 'frustrated' },
      { title: 'Security Audit Access', desc: 'Needs audit logs for compliance deadline.', issueType: 'security', mood: 'urgent' },
      { title: 'Trial Extension Request', desc: 'Trial ends tomorrow; migration not finished.', issueType: 'upgrade', mood: 'worried' }
    ],
    Tourism: [
      { title: 'Flight Cancelled — Cash Refund', desc: 'Wants cash refund not travel voucher.', issueType: 'refund', mood: 'angry' },
      { title: 'Hotel Overbooking', desc: 'No room despite confirmed reservation.', issueType: 'complaint_escalation', mood: 'furious' },
      { title: 'Lost Baggage with Meds', desc: 'Bag missing 48 hours with medication inside.', issueType: 'booking_issue', mood: 'panicked' },
      { title: 'Tour Reschedule', desc: 'Must move prepaid tour due to illness.', issueType: 'booking_change', mood: 'worried' },
      { title: 'Missing Loyalty Points', desc: 'Last trip points never posted.', issueType: 'wrong_information', mood: 'indignant' },
      { title: 'Resort Fee Surprise', desc: 'Resort fees not disclosed at booking.', issueType: 'billing_dispute', mood: 'angry' },
      { title: 'Car Rental Damage Claim', desc: 'Charged for damage they did not cause.', issueType: 'refund', mood: 'furious' },
      { title: 'Cruise Cabin Downgrade', desc: 'Assigned inferior cabin without compensation.', issueType: 'vip_complaint', mood: 'very_angry' },
      { title: 'Travel Insurance Denial', desc: 'Claim denied for cancelled trip.', issueType: 'insurance_claim', mood: 'disappointed' },
      { title: 'Visa Document Error', desc: 'Booking documents show wrong passport name.', issueType: 'wrong_information', mood: 'impatient' }
    ],
    Finance: [
      { title: 'Mortgage Misapplied Payment', desc: 'Payment posted to wrong loan account.', issueType: 'billing_dispute', mood: 'worried' },
      { title: 'Credit Report Dispute', desc: 'Disputes incorrect late payment on credit report.', issueType: 'complaint_escalation', mood: 'indignant' },
      { title: 'Withdrawal Hold', desc: 'Funds frozen before real estate closing.', issueType: 'technical', mood: 'panicked' },
      { title: 'Payoff Quote Changed', desc: 'Payoff amount changed between quote and payment.', issueType: 'wrong_information', mood: 'frustrated' },
      { title: 'Investment Trade Error', desc: 'Wrong fund purchased in retirement account.', issueType: 'billing_dispute', mood: 'angry' },
      { title: 'Tax Document Missing', desc: '1099 not available; filing deadline near.', issueType: 'records_request', mood: 'urgent' },
      { title: 'Loan Modification Delay', desc: 'Modification paperwork stuck in review.', issueType: 'complaint_escalation', mood: 'worried' },
      { title: 'Debit Card Fraud Block', desc: 'Legitimate purchase blocked abroad.', issueType: 'security', mood: 'impatient' },
      { title: 'Trust Account Access', desc: 'Beneficiary cannot access trust disbursement.', issueType: 'technical', mood: 'confused' },
      { title: 'Advisory Fee Dispute', desc: 'Fee higher than agreement shows.', issueType: 'billing_dispute', mood: 'firm' }
    ],
    Corporate: [
      { title: 'Billing Dispute', desc: 'Unexpected charge on corporate account.', issueType: 'billing_dispute', mood: 'frustrated' },
      { title: 'Service Cancellation', desc: 'Wants to cancel vendor contract.', issueType: 'cancellation', mood: 'cold' },
      { title: 'Technical Issue', desc: 'Cannot access corporate portal.', issueType: 'technical', mood: 'impatient' },
      { title: 'Refund Request', desc: 'Demands refund for failed deployment.', issueType: 'refund', mood: 'angry' },
      { title: 'Complaint Escalation', desc: 'Executive escalation after repeated failures.', issueType: 'complaint_escalation', mood: 'furious' },
      { title: 'Account Security', desc: 'Suspected breach on admin account.', issueType: 'security', mood: 'worried' },
      { title: 'Late Fee Dispute', desc: 'Invoice late fee despite PO delay.', issueType: 'late_fee', mood: 'indignant' },
      { title: 'Service Upgrade', desc: 'Needs enterprise tier before quarter end.', issueType: 'upgrade', mood: 'pleasant' },
      { title: 'VIP Complaint', desc: 'Key account threatening churn.', issueType: 'vip_complaint', mood: 'very_angry' },
      { title: 'Wrong Information', desc: 'Account manager gave incorrect renewal terms.', issueType: 'wrong_information', mood: 'disappointed' }
    ]
  };

  function buildFallback(nxConfig, variantIndex) {
    variantIndex = variantIndex || 0;
    var industryLabel = resolveIndustryLabel(nxConfig);
    var pool = FALLBACK_BY_INDUSTRY[industryLabel] || FALLBACK_BY_INDUSTRY.Corporate || FALLBACK_BY_INDUSTRY.Banking;
    var v = pool[variantIndex % pool.length];
    var targetType = nxConfig.type || 'customer_service';
    var id = 'engine-' + targetType + '-' + normalizeIndustryKey(nxConfig.industry || 'general') + '-v' + variantIndex;
    return {
      id: id,
      title: v.title,
      desc: v.desc,
      issueType: v.issueType,
      mood: v.mood || 'professional',
      industry: industryLabel || 'Corporate',
      diff: parseInt(nxConfig.difficulty, 10) || 3
    };
  }

  return {
    all: all,
    resolveIndustryLabel: resolveIndustryLabel,
    resolveIndustryPool: resolveIndustryPool,
    buildFallback: buildFallback,
    INDUSTRY_KEY_MAP: INDUSTRY_KEY_MAP
  };
})();
