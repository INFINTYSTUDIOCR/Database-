'use strict';

const assert = require('assert');
const P = require('./nexora-procurement');

let pass = 0;
function check(name, fn) {
  fn();
  pass += 1;
  console.log('ok -', name);
}

check('allowlist: only Maria Rebeca among students', () => {
  assert.strictEqual(P.isProcurementAllowed({ auth: { role: 'student', studentId: 'IS-MAQU-1787761910345' } }), true);
  assert.strictEqual(P.isProcurementAllowed({ auth: { role: 'student', studentId: 'IS-OTHER-1' } }), false);
  assert.strictEqual(P.isProcurementAllowed({ auth: { role: 'student', studentId: 'KAM-123' } }), false);
  assert.strictEqual(P.isProcurementAllowed({ auth: { role: 'trainer' } }), true);
  assert.strictEqual(P.isProcurementAllowed({}), false);
});

check('catalog: 14 scenarios, all participants are cast members, all modes covered', () => {
  const cat = P.publicCatalog();
  assert.strictEqual(cat.scenarios.length, 14);
  const modes = new Set(cat.scenarios.map((s) => s.mode));
  for (const m of ['team_meeting', 'client_report', 'stakeholder_review', 'supplier_call', 'star_interview']) assert.ok(modes.has(m), m);
  for (const s of cat.scenarios) {
    assert.strictEqual(s.pack, 'procurement');
    assert.ok(s.participants.includes(s.host), s.id);
    for (const n of s.participants) assert.ok(P.CAST[n], `${s.id}: ${n}`);
    for (const k of s.kpiFocus) assert.ok(P.KPIS.find((x) => x.key === k), k);
  }
});

check('cast: every character has a unique voice', () => {
  const ids = Object.values(P.CAST).map((c) => c.voiceId);
  assert.strictEqual(new Set(ids).size, ids.length);
});

check('isProcurementScenario', () => {
  assert.strictEqual(P.isProcurementScenario({ id: 'proc-po-weekly' }), true);
  assert.strictEqual(P.isProcurementScenario({ pack: 'procurement' }), true);
  assert.strictEqual(P.isProcurementScenario({ id: 'cs-123', type: 'customer_service' }), false);
  assert.strictEqual(P.isProcurementScenario(null), false);
});

check('system prompt: uses server catalog, JD included, ignores client-forged facts', () => {
  const sp = P.buildProcurementSystemPrompt({
    scenario: { id: 'proc-quote-compare', facts: ['FORGED FACT'] },
    accountContext: { jobDescription: 'Uses SAP Ariba for RFQs. Manages 30 suppliers.', turn: 2 },
    agentName: 'Maria'
  });
  assert.ok(sp.includes('RFQ-114'));
  assert.ok(sp.includes('SAP Ariba'));
  assert.ok(!sp.includes('FORGED FACT'));
  assert.ok(sp.includes('Michael Thompson: ...'));
  assert.ok(!sp.includes('TIME CHECK'));
  const late = P.buildProcurementSystemPrompt({ scenario: { id: 'proc-quote-compare' }, accountContext: { turn: 10 }, agentName: 'Maria' });
  assert.ok(late.includes('TIME CHECK'));
});

check('reply parsing: speakers, first-name prefixes, continuation lines, max 2 speakers', () => {
  const sc = { id: 'proc-po-weekly' };
  const r = P.finishProcurementReply('Michael Thompson: Morning Maria. *nods*\nLet\'s start.\nSarah: I need the PO-2611 invoice.\nOliver Clarke: And dates.', sc);
  assert.strictEqual(r, 'Michael Thompson: Morning Maria. Let\'s start.\nSarah Johnson: I need the PO-2611 invoice.');
  const noPrefix = P.finishProcurementReply('Good morning everyone.', sc);
  assert.strictEqual(noPrefix, 'Michael Thompson: Good morning everyone.');
  const outsider = P.finishProcurementReply('Wei Chen: Hello', sc);
  assert.strictEqual(outsider, 'Michael Thompson: Hello');
});

check('evaluation normalization: 8 KPIs, nulls kept, scores clamped', () => {
  const ev = P.normalizeProcurementEvaluation({
    overall_score: 140,
    client_satisfaction: '7',
    procurement_kpis: [{ key: 'quotes', score: 12, evidence: 'x' }, { key: 'po_co', score: null }],
    star: { situation: 8, task: 7, action: 9, result: 4, score: 70 },
    english: { clarity: 8 },
    wins: ['a', '', 'b']
  });
  assert.strictEqual(ev.overall_score, 100);
  assert.strictEqual(ev.client_satisfaction, 7);
  assert.strictEqual(ev.procurement_kpis.length, 8);
  assert.strictEqual(ev.procurement_kpis[0].score, 10);
  assert.strictEqual(ev.procurement_kpis[1].score, null);
  assert.strictEqual(ev.procurement_kpis[2].evidence, 'Not observed');
  assert.deepStrictEqual(ev.wins, ['a', 'b']);
  const rec = P.buildProcurementSessionRecord(ev, { id: 'proc-docs-audit' }, 300);
  assert.strictEqual(rec.mode, 'stakeholder_review');
  assert.strictEqual(rec.kpis.quotes, 10);
});

check('evaluation prompt includes transcript, JD and all KPI keys', () => {
  const ep = P.buildProcurementEvaluationPrompt({ transcript: 'Maria: PO-2611 is 40% delivered.', scenario: { id: 'proc-po-weekly' }, agentName: 'Maria', talkTime: 420, jobDescription: 'Coupa user' });
  assert.ok(ep.includes('PO-2611 is 40%'));
  assert.ok(ep.includes('Coupa user'));
  for (const k of P.KPIS) assert.ok(ep.includes(`"${k.key}"`), k.key);
  assert.ok(ep.includes('"practice_minutes": 7'));
});

console.log(`\n${pass} checks passed`);
