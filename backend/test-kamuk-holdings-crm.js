const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'kamuk-holdings-local-test-secret';
delete process.env.ANTHROPIC_API_KEY;

const express = require('express');
const { signToken, requireAuth } = require('./auth');
const { registerKamukHoldingsCrm } = require('./kamuk-holdings-crm');
const { registerSimulationAccess } = require('./simulation-access');

async function run() {
  const students = new Map([
    ['KAM-TEST-01', { id: 'KAM-TEST-01', name: 'QA Student', portalUser: 'q.student' }],
    ['INF-TEST-01', { id: 'INF-TEST-01', name: 'Infinity Student', portalUser: 'i.student' }]
  ]);
  const sessions = new Map();
  const infinitySessions = new Map();
  const app = express();
  app.use(express.json());

  const requireProductAuth = requireAuth(['student', 'trainer', 'superadmin', 'master']);
  const requireTeacherAccess = requireAuth(['trainer', 'superadmin', 'master']);
  const deps = {
    requireProductAuth,
    requireTeacherAccess,
    sbGetStudentRow: async id => ({ id, data: students.get(id) }),
    sbSetStudent: async (id, data) => { students.set(id, data); return true; },
    sbGet: async table => {
      if (table === 'kamuk_sessions') return [...sessions].map(([id, data]) => ({ id, data }));
      if (table === 'infinity_sessions') return [...infinitySessions].map(([id, data]) => ({ id, data }));
      if (table === 'kamuk_students') return [...students].filter(([id]) => id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      if (table === 'infinity_students') return [...students].filter(([id]) => !id.startsWith('KAM-')).map(([id, data]) => ({ id, data }));
      return [];
    },
    sbSet: async (table, id, data) => {
      if (table === 'kamuk_sessions') sessions.set(id, data);
      else if (table === 'infinity_sessions') infinitySessions.set(id, data);
      else assert.fail(`unexpected table ${table}`);
      return true;
    },
    claudeCall: async () => { throw new Error('AI must not run in deterministic test'); }
  };
  registerSimulationAccess(app, deps);
  registerKamukHoldingsCrm(app, deps);

  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const portalToken = signToken({ role: 'student', studentId: 'KAM-TEST-01', name: 'QA Student', sub: 'KAM-TEST-01' }, 300);
  const trainerToken = signToken({ role: 'trainer', name: 'QA Supervisor', sub: 'qa-supervisor' }, 300);

  async function request(path, token, body) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();
    assert.equal(response.ok, true, `${path}: ${JSON.stringify(data)}`);
    return data;
  }

  const setup = await request('/simulation/access/setup', portalToken, { username: 'q.student', pin: '124680' });
  assert.equal(setup.access.configured, true);
  const simLogin = await request('/simulation/access/login', '', { username: 'q.student', pin: '124680', product: 'kamuk' });
  const studentToken = simLogin.token;
  assert.equal(simLogin.product, 'kamuk');

  const presence = await request('/kamuk-holdings/crm/presence', studentToken, { status: 'online' });
  assert.equal(presence.employee.id, 'KAM-TEST-01');

  const started = await request('/kamuk-holdings/crm/case/start', studentToken, { caseId: 'KH-1084' });
  assert.equal(started.metrics.started, 1);

  await request('/kamuk-holdings/crm/case/event', studentToken, {
    caseId: 'KH-1084',
    type: 'note',
    payload: { channel: 'Internal note', text: 'Pattern reviewed and documented without contacting the client.', at: new Date().toISOString() }
  });
  await request('/kamuk-holdings/crm/case/event', studentToken, {
    caseId: 'KH-1084',
    type: 'email',
    payload: { subject: 'Internal escalation notice', body: 'Escalating the structuring pattern to Compliance without tipping off the client.', to: 'compliance@kamukholdings.com' }
  });

  const state = await request('/kamuk-holdings/crm/case/state', studentToken);
  assert.equal(state.active.caseId, 'KH-1084');
  assert.ok(state.events.length >= 2);

  const actions = ['note', 'fraud-risk', 'aml-placement', 'high-high', 'file-sar', 'escalate-compliance'];
  for (const key of actions) {
    await request('/kamuk-holdings/crm/case/action', studentToken, {
      caseId: 'KH-1084',
      action: { key, label: key.replace(/-/g, ' '), at: new Date().toISOString() }
    });
  }

  const callToken = await fetch(base + '/kamuk-holdings/crm/call/token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseId: 'KH-1084' })
  });
  assert.equal(callToken.status, 503);
  const callBody = await callToken.json();
  assert.equal(callBody.code, 'VOICE_NOT_CONFIGURED');

  await request('/kamuk-holdings/crm/case/event', studentToken, {
    caseId: 'KH-1084',
    type: 'call-end',
    payload: {
      status: 'ended',
      durationSec: 42,
      mood: 'guarded',
      moodTrajectory: ['distressed', 'guarded'],
      transcript: [
        { role: 'agent', text: 'I need clarity on these deposits.' },
        { role: 'user', text: 'I am reviewing the pattern internally before we discuss next steps.' }
      ],
      summary: 'Simulated call completed for supervisor evidence.'
    }
  });

  const stateAfterCall = await request('/kamuk-holdings/crm/case/state', studentToken);
  assert.ok(stateAfterCall.events.some(event => event.type === 'call-end'));
  assert.equal(stateAfterCall.active.call?.status, 'ended');
  assert.ok((stateAfterCall.active.call?.transcript || []).length >= 2);

  const infinityToken = signToken({ role: 'student', studentId: 'IS-TEST-01', name: 'Infinity Student', sub: 'IS-TEST-01' }, 300);
  const infinityBlocked = await fetch(base + '/kamuk-holdings/crm/presence', {
    method: 'POST',
    headers: { Authorization: `Bearer ${infinityToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'online' })
  });
  assert.equal(infinityBlocked.status, 403);

  const result = await request('/kamuk-holdings/crm/case/resolve', studentToken, {
    caseId: 'KH-1084',
    actions: actions.map(key => ({ key, label: key.replace(/-/g, ' '), at: new Date().toISOString() })),
    notes: [{ channel: 'Internal note', text: 'Pattern reviewed and documented without contacting the client.', at: new Date().toISOString() }],
    risk: { type: 'Fraud', probability: 'High', impact: 'High', amlStage: 'Placement' },
    resolution: {
      disposition: 'Compliance review opened',
      summary: 'Classified the repeated sub-threshold deposits as suspected structuring and opened a protected compliance review.',
      nextStep: 'Compliance Officer reviews the SAR within 15 minutes.'
    },
    durationSec: 180
  });
  assert.ok(result.evaluation.qaScore >= 70);
  assert.equal(result.metrics.resolved, 1);
  assert.equal(result.metrics.resolutionRate, 100);

  // Ownership and questioning are credited from real conversation, not from UI buttons.
  await request('/kamuk-holdings/crm/case/start', studentToken, { caseId: 'KH-1120' });
  await request('/kamuk-holdings/crm/case/event', studentToken, {
    caseId: 'KH-1120',
    type: 'email',
    payload: {
      subject: 'Your itinerary — ownership and confirmation',
      body: 'I am sorry this booking failed so close to your departure, and I take full ownership of fixing it. What time do you need to be airborne?',
      to: 'vip@kamukholdings.com'
    }
  });
  await request('/kamuk-holdings/crm/case/event', studentToken, {
    caseId: 'KH-1120',
    type: 'call-end',
    payload: {
      durationSec: 95,
      mood: 'calmer',
      transcript: [
        { role: 'agent', text: 'I cannot miss this flight.' },
        { role: 'user', text: 'Can you confirm the same ground transport address as last month?' }
      ]
    }
  });

  const conversational = await request('/kamuk-holdings/crm/case/resolve', studentToken, {
    caseId: 'KH-1120',
    actions: ['note', 'activate-aviation', 'activate-car'].map(key => ({ key, label: key.replace(/-/g, ' '), at: new Date().toISOString() })),
    notes: [{ channel: 'Internal note', text: 'Aviation and ground transport activated after confirming the client requirements directly.', at: new Date().toISOString() }],
    risk: { type: 'Service', probability: 'Low', impact: 'High', amlStage: 'None' },
    resolution: {
      disposition: 'Concierge services activated',
      summary: 'Confirmed the travel requirements with the client, activated the aviation desk and ground transport, and locked a verified itinerary.',
      nextStep: 'I send the verified itinerary within fifteen minutes and confirm receipt by phone.'
    },
    durationSec: 240
  });
  const hits = conversational.evaluation.requiredHits;
  assert.ok(hits.includes('acknowledge'), 'ownership must be credited from the sent email');
  assert.ok(hits.includes('ask-open'), 'open question must be credited from the sent email');
  assert.ok(hits.includes('ask-closed'), 'closed question must be credited from the call transcript');
  assert.ok(!conversational.evaluation.requiredMisses.includes('acknowledge'));

  const history = await request('/kamuk-holdings/crm/history', studentToken);
  assert.ok(history.history.length >= 1);

  const supervisor = await request('/kamuk-holdings/crm/supervisor', trainerToken);
  assert.equal(supervisor.live.length, 1);
  assert.equal(supervisor.resolutions.length, 2);
  assert.ok(supervisor.resolutions.every(record => record.studentId === 'KAM-TEST-01'));
  assert.ok(supervisor.resolutions.every(record => Array.isArray(record.submission.events)));

  const detail = await request(`/kamuk-holdings/crm/supervisor/resolution/${result.resolutionId}`, trainerToken);
  assert.equal(detail.record.caseId, 'KH-1084');
  assert.ok(detail.record.submission.events.some(event => event.type === 'call-end' || event.type === 'note'));
  assert.ok(detail.record.submission.call || detail.record.call);

  const infinityPortalToken = signToken({
    role: 'student',
    studentId: 'INF-TEST-01',
    name: 'Infinity Student',
    sub: 'INF-TEST-01'
  }, 300);
  await request('/simulation/access/setup', infinityPortalToken, {
    username: 'i.student',
    pin: '680124'
  });
  const infinityLogin = await request('/simulation/access/login', '', {
    username: 'i.student',
    pin: '680124',
    product: 'infinity'
  });
  assert.equal(infinityLogin.product, 'infinity');
  await request('/infinity-holdings/crm/presence', infinityLogin.token, { status: 'online' });
  await request('/infinity-holdings/crm/case/start', infinityLogin.token, { caseId: 'KH-1051' });
  await request('/infinity-holdings/crm/case/event', infinityLogin.token, {
    caseId: 'KH-1051',
    type: 'note',
    payload: { channel: 'Internal note', text: 'Infinity tenant evidence stays in Infinity storage.', at: new Date().toISOString() }
  });
  const infinityState = await request('/infinity-holdings/crm/case/state', infinityLogin.token);
  assert.equal(infinityState.active.caseId, 'KH-1051');
  assert.ok([...infinitySessions.keys()].some(id => id === 'KHCRM-LIVE-INF-TEST-01'));
  assert.ok(![...sessions.keys()].some(id => id.includes('INF-TEST-01')));
  const infinitySupervisor = await request('/infinity-holdings/crm/supervisor?product=infinity', trainerToken);
  assert.ok(infinitySupervisor.live.some(record => record.studentId === 'INF-TEST-01'));

  const reset = await request('/simulation/access/reset', trainerToken, {
    studentId: 'KAM-TEST-01',
    product: 'kamuk'
  });
  assert.match(reset.temporaryPin, /^\d{6}$/);
  const revokedSession = await fetch(base + '/infinity-holdings/crm/case/state', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(revokedSession.status, 401);
  const oldPin = await fetch(base + '/simulation/access/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'q.student', pin: '124680', product: 'kamuk' })
  });
  assert.equal(oldPin.status, 401);
  const resetLogin = await request('/simulation/access/login', '', {
    username: 'q.student',
    pin: reset.temporaryPin,
    product: 'kamuk'
  });
  assert.equal(resetLogin.studentId, 'KAM-TEST-01');

  await new Promise(resolve => server.close(resolve));
  console.log('Kamuk Holdings CRM integration test passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
