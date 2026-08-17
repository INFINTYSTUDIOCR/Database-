const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'kamuk-holdings-local-test-secret';
delete process.env.ANTHROPIC_API_KEY;

const express = require('express');
const { signToken, requireAuth } = require('./auth');
const { registerKamukHoldingsCrm } = require('./kamuk-holdings-crm');
const { weekKeyCR, HOME_CASES } = require('./kamuk-holdings-floor');

function readyHomeAnswers() {
  const answers = {};
  HOME_CASES.forEach((item) => {
    const [c1, c2] = item.connectors;
    const body = [
      `I understand the impact ${c1} ${item.vocab[0]} creates real pressure for the client, ${c2} I will ${item.phrasal} the evidence before promising any outcome.`,
      `I reviewed the ${item.family[1]} trail and confirmed whether the activity looks ${item.family[0]} or not using the case facts provided.`,
      `I will explain the ${item.vocab[1]} finding in plain language, ask one open question and one closed question, then take or route a safe action.`,
      `I will leave a brief internal note with owner and timeline so the next agent can continue without making the client repeat information.`,
      `My timed next step is a callback within one business day after the ${item.vocab[2] || item.vocab[0]} check is complete.`
    ].join(' ');
    answers[item.id] = body;
  });
  return answers;
}

async function run() {
  const students = new Map([
    ['KAM-TEST-01', { id: 'KAM-TEST-01', name: 'QA Student A', portalUser: 'q.student' }],
    ['KAM-TEST-02', { id: 'KAM-TEST-02', name: 'QA Student B', portalUser: 'q.student.b' }],
    ['INF-TEST-01', { id: 'INF-TEST-01', name: 'Infinity Student', portalUser: 'i.student' }]
  ]);
  const sessions = new Map();
  const infinitySessions = new Map();
  let claudePayload = null;
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const requireProductAuth = requireAuth(['student', 'trainer', 'superadmin', 'master']);
  const requireTeacherAccess = requireAuth(['trainer', 'superadmin', 'master']);

  function storeFor(table) {
    if (table === 'kamuk_sessions') return sessions;
    if (table === 'infinity_sessions') return infinitySessions;
    return null;
  }

  const deps = {
    requireProductAuth,
    requireTeacherAccess,
    sbGetStudentRow: async (id) => (students.has(id) ? { id, data: students.get(id) } : null),
    sbSetStudent: async (id, data) => { students.set(id, data); return true; },
    sbGet: async (table) => {
      if (table === 'kamuk_students') return [...students].filter(([id]) => id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      if (table === 'infinity_students') return [...students].filter(([id]) => !id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      const store = storeFor(table);
      return store ? [...store].map(([id, data]) => ({ id, data })) : [];
    },
    sbSet: async (table, id, data) => {
      const store = storeFor(table);
      assert.ok(store, `unexpected table ${table}`);
      store.set(id, data);
      return true;
    },
    sbGetOne: async (table, id) => {
      if (table === 'kamuk_students' || table === 'infinity_students') {
        return students.has(id) ? { id, data: students.get(id) } : null;
      }
      const store = storeFor(table);
      if (!store || !store.has(id)) return null;
      return { id, data: store.get(id) };
    },
    sbInsertOnly: async (table, id, data) => {
      const store = storeFor(table);
      assert.ok(store, `unexpected table ${table}`);
      if (store.has(id)) return { ok: true, created: false, row: { id, data: store.get(id) } };
      store.set(id, data);
      return { ok: true, created: true, row: { id, data } };
    },
    claudeCall: async () => {
      if (!claudePayload) throw new Error('AI must not run unless mocked');
      return { content: [{ type: 'text', text: JSON.stringify(claudePayload) }] };
    }
  };
  registerKamukHoldingsCrm(app, deps);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const tokenA = signToken({ role: 'student', studentId: 'KAM-TEST-01', name: 'QA Student A', sub: 'KAM-TEST-01' }, 300);
  const tokenB = signToken({ role: 'student', studentId: 'KAM-TEST-02', name: 'QA Student B', sub: 'KAM-TEST-02' }, 300);
  const trainerToken = signToken({ role: 'trainer', name: 'QA Supervisor', sub: 'qa-supervisor' }, 300);
  const doneSteps = ['welcome', 'service', 'practice', 'products', 'quiz', 'mock'];

  async function request(path, token, body, expectOk = true) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (expectOk) assert.equal(response.ok, true, `${path}: ${JSON.stringify(data)}`);
    return { status: response.status, data };
  }

  // Nesting denial before certification.
  const denied = await request('/kamuk-holdings/crm/presence', tokenA, { status: 'online' }, false);
  assert.equal(denied.status, 403);
  assert.equal(denied.data.code, 'NESTING_REQUIRED');

  const progress = await request('/kamuk-holdings/crm/training/progress', tokenA, {
    done: doneSteps,
    homeAnswers: readyHomeAnswers()
  });
  assert.ok(progress.data.nestingCompletedAt);
  assert.equal(progress.data.complete, true);

  await request('/kamuk-holdings/crm/training/progress', tokenB, {
    done: doneSteps,
    homeAnswers: readyHomeAnswers()
  });

  const presence = await request('/kamuk-holdings/crm/presence', tokenA, { status: 'online' });
  assert.equal(presence.data.employee.id, 'KAM-TEST-01');

  const pool = await request('/kamuk-holdings/crm/pool', tokenA);
  assert.ok(pool.data.fresh.length >= 40);
  const firstCaseId = pool.data.fresh[0].caseId;
  const firstWorkItemId = pool.data.fresh[0].workItemId;

  // Atomic double-claim rejection.
  const claimA = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: firstWorkItemId });
  assert.equal(claimA.data.assignment.caseId, firstCaseId);
  const claimConflict = await request('/kamuk-holdings/crm/case/claim', tokenB, { workItemId: firstWorkItemId }, false);
  assert.equal(claimConflict.status, 409);

  // Mandatory email + note.
  const missingEvidence = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: firstCaseId,
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Documented the investigation and restored access with a timed callback before close of business today.',
      nextStep: 'Call the client before 4:45 PM with confirmation.'
    }
  }, false);
  assert.equal(missingEvidence.status, 400);
  assert.equal(missingEvidence.data.code, 'TOUCH_EVIDENCE_REQUIRED');

  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: firstCaseId,
    type: 'note',
    payload: { channel: 'Internal note', text: 'Reviewed evidence and documented the action path for this touch.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: firstCaseId,
    type: 'email',
    payload: {
      subject: 'Update on your case',
      body: 'Hello, I reviewed your case because the timeline matters. I own the next step and will call you today before 4:45 p.m.',
      to: 'client@example.com'
    }
  });
  for (const key of ['acknowledge', 'note', 'next-step']) {
    await request('/kamuk-holdings/crm/case/action', tokenA, {
      caseId: firstCaseId,
      action: { key, label: key, at: new Date().toISOString() }
    });
  }

  // AI pending when Anthropic is unavailable.
  const pending = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: firstCaseId,
    risk: { type: 'Operational', probability: 'Medium', impact: 'High', amlStage: 'None' },
    resolution: {
      disposition: 'Flagged AA — awaiting client action',
      summary: 'Asked the client for the missing authorization letter and parked the case as AA with a review date.',
      nextStep: 'Review the client upload tomorrow at 10:00 a.m.'
    },
    durationSec: 120
  });
  assert.equal(pending.data.evaluation.pendingEvaluation, true);
  assert.equal(pending.data.evaluation.pointsAwarded, 0);
  assert.ok(pending.data.nextWorkItem);
  assert.equal(pending.data.nextWorkItem.touchNumber, 2);

  // Prior agent cannot claim own follow-up.
  const selfFollow = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: pending.data.nextWorkItem.workItemId }, false);
  assert.equal(selfFollow.status, 409);

  // Student B takes follow-up and resolves with mocked Alice scoring.
  process.env.ANTHROPIC_API_KEY = 'test-key';
  claudePayload = {
    errors: [
      { code: 'tone', label: 'Tone drift', evidence: 'One sentence sounded defensive.' },
      { code: 'timeline', label: 'Soft timeline', evidence: 'Next step lacked an exact clock time.' }
    ],
    summary: 'Solid handoff with two deductions.',
    strengths: ['Clear ownership', 'Useful note'],
    improvements: ['Tighten the timed next step'],
    dimensions: { English: 82, Judgment: 80, Compliance: 78, Documentation: 84 }
  };
  const claimB = await request('/kamuk-holdings/crm/case/claim', tokenB, { workItemId: pending.data.nextWorkItem.workItemId });
  assert.equal(claimB.data.assignment.touchNumber, 2);
  assert.ok((claimB.data.assignment.history || []).length >= 1);

  await request('/kamuk-holdings/crm/case/event', tokenB, {
    caseId: firstCaseId,
    type: 'note',
    payload: { channel: 'Internal note', text: 'Continued prior AA trail and closed with evidence.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenB, {
    caseId: firstCaseId,
    type: 'email',
    payload: {
      subject: 'Case closed',
      body: 'Hello, I completed the follow-up because the document arrived. Therefore your account path is clear and I will confirm by 3:00 p.m. today.',
      to: 'client@example.com'
    }
  });
  for (const key of ['acknowledge', 'note', 'next-step']) {
    await request('/kamuk-holdings/crm/case/action', tokenB, {
      caseId: firstCaseId,
      action: { key, label: key, at: new Date().toISOString() }
    });
  }

  const scored = await request('/kamuk-holdings/crm/case/resolve', tokenB, {
    caseId: firstCaseId,
    risk: { type: 'Operational', probability: 'Low', impact: 'Medium', amlStage: 'None' },
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Validated the uploaded authorization, restored the operational path and confirmed the outcome with the client.',
      nextStep: 'Send written confirmation before 3:00 p.m. today.'
    },
    durationSec: 180
  });
  assert.equal(scored.data.evaluation.casePoints, 8);
  assert.equal(scored.data.evaluation.competitionEligible, true);
  assert.equal(scored.data.evaluation.pointsAwarded, 8);
  assert.equal(scored.data.evaluation.pendingEvaluation, false);

  // Quality gate: below 7 awards no competition points.
  claudePayload = {
    errors: Array.from({ length: 4 }, (_, i) => ({ code: `e${i}`, label: `Error ${i}`, evidence: 'Evidence' })),
    summary: 'Needs coaching.',
    strengths: [],
    improvements: ['Rebuild the email'],
    dimensions: { English: 50, Judgment: 55, Compliance: 40, Documentation: 45 }
  };
  const pool2 = await request('/kamuk-holdings/crm/pool', tokenA);
  const second = pool2.data.fresh.find((item) => item.caseId !== firstCaseId);
  assert.ok(second);
  await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: second.workItemId });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: second.caseId,
    type: 'note',
    payload: { channel: 'Internal note', text: 'Brief factual note for the second touch.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', tokenA, {
    caseId: second.caseId,
    type: 'email',
    payload: {
      subject: 'Update',
      body: 'Hello, I am writing because we need clarity. However I own the next check and will call tomorrow at 9:00 a.m.',
      to: 'client@example.com'
    }
  });
  const gated = await request('/kamuk-holdings/crm/case/resolve', tokenA, {
    caseId: second.caseId,
    resolution: {
      disposition: 'Resolved with client confirmation',
      summary: 'Closed after reviewing the available evidence and confirming the outcome with the client on the recorded channel.',
      nextStep: 'Call tomorrow at 9:00 a.m. with confirmation.'
    },
    durationSec: 90
  });
  assert.equal(gated.data.evaluation.casePoints, 6);
  assert.equal(gated.data.evaluation.competitionEligible, false);
  assert.equal(gated.data.evaluation.pointsAwarded, 0);

  const board = await request('/kamuk-holdings/crm/leaderboard', tokenB);
  assert.equal(board.data.weekKey, weekKeyCR());
  assert.ok(board.data.board.length >= 1);
  const rowB = board.data.board.find((row) => row.studentId === 'KAM-TEST-02');
  assert.ok(rowB.weeklyPoints >= 8);
  assert.ok(rowB.resolved >= 1);

  const supervisor = await request('/kamuk-holdings/crm/supervisor?product=kamuk', trainerToken);
  assert.ok(supervisor.data.leaderboard.length >= 1);
  assert.ok(supervisor.data.winner);
  assert.ok(supervisor.data.summary.freshPool >= 0);
  assert.ok(supervisor.data.recentTouches.length >= 2);

  const coach = await request('/kamuk-holdings/crm/supervisor/coaching', trainerToken, {
    studentId: 'KAM-TEST-02',
    touchId: scored.data.touchId,
    note: 'Strong handoff. Keep the timed next step explicit.'
  });
  assert.ok(coach.data.coaching.id);

  // Product isolation: Infinity student cannot use Kamuk routes.
  const infinityToken = signToken({ role: 'student', studentId: 'INF-TEST-01', name: 'Infinity Student', sub: 'INF-TEST-01' }, 300);
  await request('/infinity-holdings/crm/training/progress', infinityToken, {
    done: doneSteps,
    homeAnswers: readyHomeAnswers()
  });
  const cross = await request('/kamuk-holdings/crm/presence', infinityToken, { status: 'online' }, false);
  assert.equal(cross.status, 403);
  await request('/infinity-holdings/crm/presence', infinityToken, { status: 'online' });
  const infinityPool = await request('/infinity-holdings/crm/pool', infinityToken);
  assert.ok(infinityPool.data.fresh.length >= 40);
  assert.ok([...infinitySessions.keys()].some((id) => id.includes('infinity')));
  assert.ok(![...sessions.keys()].some((id) => id.includes('INF-TEST-01')));

  // Round fairness: after A and B each have a fresh touch, A may claim another fresh only if everyone certified has touched.
  // Both certified students already touched, so round should be open.
  const pool3 = await request('/kamuk-holdings/crm/pool', tokenA);
  const third = pool3.data.fresh[0];
  const claimThird = await request('/kamuk-holdings/crm/case/claim', tokenA, { workItemId: third.workItemId });
  assert.equal(claimThird.data.ok, true);

  await new Promise((resolve) => server.close(resolve));
  console.log('Kamuk Holdings nesting floor integration test passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
