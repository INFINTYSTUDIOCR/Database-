const path = require('path');

const pack = require(path.join('..', 'kamuk', 'data', 'kamuk-holdings-crm-pack-v1.json'));
const caseIndex = new Map((pack.cases || []).map(item => [item.id, item]));
const liveCache = new Map();
const privateRubrics = new Map(Object.entries({
  'KH-1042': {
    requiredActions: ['acknowledge', 'note', 'operational-risk', 'escalate-operations', 'next-step'],
    forbiddenActions: ['freeze', 'close-account', 'file-sar'],
    expectedResolution: 'Restore the account through Operations, document bank liability, waive resulting fees and confirm a callback before 4:45 PM.'
  },
  'KH-1051': {
    requiredActions: ['acknowledge', 'note', 'escalate-wire', 'next-step'],
    forbiddenActions: ['promise-instant-release', 'close-account', 'file-sar'],
    expectedResolution: 'Escalate at Level 3, provide the trace reference and commit to an update within ten minutes without promising release.'
  },
  'KH-1064': {
    requiredActions: ['acknowledge', 'note', 'escalate-vip', 'retention-offer', 'next-step'],
    forbiddenActions: ['blame-merchant', 'close-account', 'generic-policy'],
    expectedResolution: 'Own the failure, connect the VIP Director, restore or replace the card, arrange a payment alternative and personally follow up.'
  },
  'KH-1084': {
    requiredActions: ['note', 'fraud-risk', 'aml-placement', 'high-high', 'file-sar', 'escalate-compliance'],
    forbiddenActions: ['contact-client', 'close-account', 'disclose-review'],
    expectedResolution: 'Classify suspected structuring in placement, rate High × High, file a SAR and escalate without tipping off the client.'
  },
  'KH-1090': {
    requiredActions: ['note', 'fraud-risk', 'aml-layering', 'high-high', 'hold-buy-time', 'escalate-compliance', 'file-sar'],
    forbiddenActions: ['contact-client-about-aml', 'release-wire', 'disclose-review'],
    expectedResolution: 'Hold transfers under routine verification language, classify layering, file a SAR and escalate without tipping off the client.'
  },
  'KH-1102': {
    requiredActions: ['ask-open', 'ask-closed', 'note', 'credit-risk', 'recommend-expansion-loan', 'next-step'],
    forbiddenActions: ['promise-approval', 'recommend-working-capital', 'file-sar'],
    expectedResolution: 'Recommend the Business Expansion Loan subject to collateral and underwriting; document needs and schedule a proposal review.'
  },
  'KH-1110': {
    requiredActions: ['note', 'credit-risk', 'high-high', 'escalate-compliance', 'request-more-info'],
    forbiddenActions: ['approve-loan', 'ignore-footnote', 'promise-approval'],
    expectedResolution: 'Pause approval, document the cash-flow inconsistency and pressure, request enhanced due diligence and escalate independently.'
  },
  'KH-1120': {
    requiredActions: ['acknowledge', 'ask-open', 'ask-closed', 'note', 'activate-aviation', 'activate-car', 'next-step'],
    forbiddenActions: ['promise-unconfirmed-seat', 'generic-policy', 'transfer-without-brief'],
    expectedResolution: 'Confirm requirements, activate aviation and ground transport, and commit to a verified itinerary update within fifteen minutes.'
  }
}));

function privateCase(caseId) {
  const publicCase = caseIndex.get(caseId);
  const rubric = privateRubrics.get(caseId);
  return publicCase && rubric ? { ...publicCase, ...rubric } : null;
}

function currentTeamPoints(team) {
  let total = 0;
  liveCache.forEach(item => {
    if (item.team === team) total += Math.max(0, Number(item.metrics?.points) || 0);
  });
  return total;
}

function clean(value, max = 500) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function teamFor(studentId) {
  const score = String(studentId || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return score % 2 === 0 ? 'Apex' : 'Vanguard';
}

function metricsFrom(student) {
  const source = student?.infinitySimulation || student?.kamukHoldings || {};
  const started = Math.max(0, Number(source.started) || 0);
  const resolved = Math.max(0, Number(source.resolved) || 0);
  const qaTotal = Math.max(0, Number(source.qaTotal) || 0);
  return {
    started,
    resolved,
    resolutionRate: started ? Math.round(resolved / started * 100) : 0,
    qaAverage: resolved ? Math.round(qaTotal / resolved) : null,
    points: Math.max(0, Number(source.points) || 0),
    team: source.team || null
  };
}

function productForStudent(studentId) {
  return String(studentId || '').startsWith('KAM-') ? 'kamuk' : 'infinity';
}

function sessionsTableForStudent(studentId) {
  return productForStudent(studentId) === 'kamuk' ? 'kamuk_sessions' : 'infinity_sessions';
}

function supervisorProduct(req) {
  const requested = String(req.query?.product || '').toLowerCase();
  if (requested === 'kamuk' || requested === 'infinity') return requested;
  return String(req.path || '').startsWith('/kamuk-holdings/') ? 'kamuk' : 'infinity';
}

function requireSimulationStudent(req, res) {
  const studentId = clean(req.auth?.studentId, 40);
  if (req.auth?.role !== 'student' || !studentId || req.auth?.scope !== 'simulation') {
    res.status(403).json({ error: 'Infinity Simulation access required', code: 'SIMULATION_ACCESS_REQUIRED' });
    return null;
  }
  return studentId;
}

function safeActions(actions) {
  if (!Array.isArray(actions)) return [];
  return actions.slice(0, 80).map(action => ({
    key: clean(action?.key, 60),
    label: clean(action?.label, 120),
    detail: clean(action?.detail, 400),
    at: clean(action?.at, 40)
  })).filter(action => action.key);
}

function safeNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.slice(0, 30).map(note => ({
    channel: clean(note?.channel, 50),
    text: clean(note?.text, 1000),
    at: clean(note?.at, 40)
  })).filter(note => note.text);
}

function safeEvent(type, payload) {
  const kind = clean(type, 40);
  const base = {
    type: kind,
    at: clean(payload?.at, 40) || new Date().toISOString()
  };
  if (kind === 'note') {
    return { ...base, channel: clean(payload?.channel, 50), text: clean(payload?.text, 1000), status: clean(payload?.status, 40) };
  }
  if (kind === 'email' || kind === 'email-client') {
    return {
      ...base,
      type: 'email',
      subject: clean(payload?.subject || payload?.label, 160),
      body: clean(payload?.body || payload?.detail || payload?.text, 4000),
      to: clean(payload?.to, 120),
      from: clean(payload?.from, 120)
    };
  }
  if (kind === 'call' || kind === 'call-start' || kind === 'call-end' || kind === 'call-transcript' || kind === 'call-event') {
    return {
      ...base,
      type: kind === 'call' ? 'call-event' : kind,
      conversationId: clean(payload?.conversationId, 80),
      outcome: clean(payload?.outcome, 80),
      mood: clean(payload?.mood, 40),
      moodTrajectory: Array.isArray(payload?.moodTrajectory)
        ? payload.moodTrajectory.slice(0, 40).map(item => clean(item, 40)).filter(Boolean)
        : [],
      durationSec: Math.max(0, Math.min(7200, Number(payload?.durationSec) || 0)),
      transcript: Array.isArray(payload?.transcript)
        ? payload.transcript.slice(0, 200).map(turn => ({
          role: clean(turn?.role, 20),
          text: clean(turn?.text, 2000),
          at: clean(turn?.at, 40)
        }))
        : [],
      summary: clean(payload?.summary, 1000)
    };
  }
  return {
    ...base,
    type: 'action',
    key: clean(payload?.key, 60),
    label: clean(payload?.label, 120),
    detail: clean(payload?.detail, 800)
  };
}

function eventsFromLive(live) {
  return Array.isArray(live?.events) ? live.events.slice(-200) : [];
}

function actionsFromEvents(events) {
  return events
    .filter(event => event.type === 'action' || event.key)
    .map(event => ({
      key: clean(event.key || event.type, 60),
      label: clean(event.label || event.key || event.type, 120),
      detail: clean(event.detail || event.text || event.body || event.summary, 800),
      at: clean(event.at, 40)
    }))
    .filter(action => action.key);
}

function notesFromEvents(events) {
  return events
    .filter(event => event.type === 'note' && event.text)
    .map(event => ({ channel: clean(event.channel, 50), text: clean(event.text, 1000), at: clean(event.at, 40) }));
}

function requireSimulationTeacher(req, res) {
  if (!['trainer', 'superadmin', 'master'].includes(req.auth?.role)) {
    res.status(403).json({ error: 'Simulation supervisor access required', code: 'SIMULATION_TEACHER_REQUIRED' });
    return false;
  }
  return true;
}

const ACKNOWLEDGE_RE = /\b(i(?:'m| am)? ?sorry|i apolog|apologize|i understand (?:how|why|that|the)|i take (?:full )?(?:ownership|responsibility)|i(?:'ll| will) (?:own|personally)|my responsibility|we take responsibility|i realize|i can see (?:how|why)|that (?:must be|is|'s) (?:frustrating|difficult|unacceptable))\b/i;
const OPEN_QUESTION_RE = /^(what|how|why|when|where|which|who|tell me|describe|walk me through|explain)\b/i;
const CLOSED_QUESTION_RE = /^(is|are|am|was|were|do|does|did|can|could|will|would|shall|should|have|has|had|may|might|must)\b/i;

/** Language the student actually produced: notes, sent emails and their call turns. */
function studentUtterances(submission) {
  const out = [];
  (submission.notes || []).forEach(note => { if (note?.text) out.push(note.text); });
  (submission.events || []).forEach(event => {
    if (event?.type === 'email') out.push(`${event.subject || ''} ${event.body || ''}`);
    if (String(event?.type || '').startsWith('call')) {
      (event.transcript || []).forEach(turn => { if (turn?.role === 'user' && turn.text) out.push(turn.text); });
    }
  });
  (submission.call?.transcript || []).forEach(turn => { if (turn?.role === 'user' && turn.text) out.push(turn.text); });
  return out;
}

/**
 * Derives conversational controls from real evidence instead of UI buttons.
 * Ownership and questioning are judged on what the student said to the client.
 */
function conversationalActions(submission) {
  const derived = new Set();
  const text = studentUtterances(submission).join('\n');
  if (!text.trim()) return derived;
  if (ACKNOWLEDGE_RE.test(text)) derived.add('acknowledge');
  (text.match(/[^.!?\n]*\?/g) || []).forEach(raw => {
    const question = raw.trim().replace(/^[^A-Za-z]+/, '');
    if (OPEN_QUESTION_RE.test(question)) derived.add('ask-open');
    else if (CLOSED_QUESTION_RE.test(question)) derived.add('ask-closed');
  });
  return derived;
}

function deterministicEvaluation(caseData, submission) {
  const rubric = caseData;
  const keys = new Set([
    ...submission.actions.map(action => action.key),
    ...conversationalActions(submission)
  ]);
  const hits = (rubric.requiredActions || []).filter(key => keys.has(key));
  const misses = (rubric.requiredActions || []).filter(key => !keys.has(key));
  const violations = (rubric.forbiddenActions || []).filter(key => keys.has(key));
  const noteWords = submission.notes.map(note => note.text).join(' ').split(/\s+/).filter(Boolean).length;
  const summaryWords = submission.resolution.summary.split(/\s+/).filter(Boolean).length;
  const documentation = Math.min(100, 45 + Math.min(30, noteWords) + Math.min(25, summaryWords));
  const judgment = Math.round(hits.length / Math.max(1, (rubric.requiredActions || []).length) * 100);
  const compliance = Math.max(0, Math.min(100, judgment - violations.length * 35));
  const english = Math.max(45, Math.min(94, 58 + Math.min(25, summaryWords)));
  const qaScore = Math.max(10, Math.min(98, Math.round(judgment * .34 + compliance * .31 + documentation * .2 + english * .15)));
  return {
    qaScore,
    verdict: qaScore >= 85 ? 'Corporate standard exceeded' : qaScore >= 70 ? 'Banking standard met' : 'Coaching required',
    summary: violations.length
      ? `The resolution contains a material control error: ${violations.join(', ')}. The decision requires supervisor review.`
      : `The resolution captured ${hits.length} of ${(rubric.requiredActions || []).length} required controls and was assessed against the Kamuk Holdings case standard.`,
    strengths: hits.slice(0, 3).map(key => `Correctly documented: ${key.replace(/-/g, ' ')}`).concat(documentation >= 75 ? ['Professional audit documentation'] : []).slice(0, 4),
    improvements: violations.map(key => `Do not: ${key.replace(/-/g, ' ')}`).concat(misses.slice(0, 3).map(key => `Evidence missing: ${key.replace(/-/g, ' ')}`)).slice(0, 4),
    dimensions: { English: english, Judgment: judgment, Compliance: compliance, Documentation: documentation },
    requiredHits: hits,
    requiredMisses: misses,
    violations,
    pointsAwarded: qaScore
  };
}

function buildAlicePrompt(caseData, submission, fallback) {
  return `You are Alice, Senior Quality Assurance Director for the Kamuk Holdings Corporate Banking Experience.
Evaluate a junior banking executive rigorously. This is not a call-center score: assess banking judgment, compliance, professional English, documentation, ownership and a concrete next step.

CASE:
${JSON.stringify({
  id: caseData.id,
  type: caseData.type,
  priority: caseData.priority,
  brief: caseData.brief,
  focus: caseData.focus,
  expectedResolution: caseData.expectedResolution,
  requiredActions: caseData.requiredActions,
  forbiddenActions: caseData.forbiddenActions
})}

STUDENT EVIDENCE:
${JSON.stringify(submission)}

CONTROL CHECK (deterministic pre-score):
${JSON.stringify({ requiredHits: fallback.requiredHits, requiredMisses: fallback.requiredMisses, violations: fallback.violations })}

Return ONLY valid JSON:
{"qaScore":0-100,"verdict":"Corporate standard exceeded|Banking standard met|Coaching required","summary":"2 concise sentences","strengths":["max 4"],"improvements":["max 4"],"dimensions":{"English":0-100,"Judgment":0-100,"Compliance":0-100,"Documentation":0-100},"pointsAwarded":0-100}

Rules:
- Ownership and questioning are judged only from what the student said to the client in the call transcript, sent emails and notes. There is no button for them.
- A forbidden action is a material control failure and must materially reduce Compliance and overall QA.
- Do not reward fluent English if the banking decision is unsafe.
- Be specific and concise. Never reveal hidden rubric labels verbatim unless discussing evidence missing from the student's work.`;
}

function normalizeAliceEvaluation(value, fallback) {
  const dimensions = value?.dimensions || {};
  const bounded = number => Math.max(0, Math.min(100, Math.round(Number(number) || 0)));
  return {
    qaScore: bounded(value?.qaScore ?? fallback.qaScore),
    verdict: ['Corporate standard exceeded', 'Banking standard met', 'Coaching required'].includes(value?.verdict) ? value.verdict : fallback.verdict,
    summary: clean(value?.summary || fallback.summary, 700),
    strengths: (Array.isArray(value?.strengths) ? value.strengths : fallback.strengths).slice(0, 4).map(item => clean(item, 180)),
    improvements: (Array.isArray(value?.improvements) ? value.improvements : fallback.improvements).slice(0, 4).map(item => clean(item, 180)),
    dimensions: {
      English: bounded(dimensions.English ?? fallback.dimensions.English),
      Judgment: bounded(dimensions.Judgment ?? fallback.dimensions.Judgment),
      Compliance: bounded(dimensions.Compliance ?? fallback.dimensions.Compliance),
      Documentation: bounded(dimensions.Documentation ?? fallback.dimensions.Documentation)
    },
    pointsAwarded: bounded(value?.pointsAwarded ?? value?.qaScore ?? fallback.pointsAwarded)
  };
}

function registerKamukHoldingsCrm(app, deps) {
  const {
    requireProductAuth, requireTeacherAccess, sbGetStudentRow, sbSetStudent,
    sbGet, sbSet, claudeCall
  } = deps;
  const crmPaths = suffix => [
    `/infinity-holdings/crm${suffix}`,
    `/kamuk-holdings/crm${suffix}`
  ];

  async function loadStudent(studentId) {
    const row = await sbGetStudentRow(studentId);
    return { ...(row?.data || {}), id: studentId };
  }

  async function requireCurrentSimulationAccess(req, res, next) {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const row = await sbGetStudentRow(studentId);
      const access = row?.data?.simulationAccess || {};
      const currentVersion = access.version || access.updatedAt || null;
      if (!access.pinHash || access.resetRequired || req.auth?.simulationVersion !== currentVersion) {
        return res.status(401).json({
          error: 'Simulation session expired. Sign in again from your Training Book.',
          code: 'SIMULATION_SESSION_EXPIRED'
        });
      }
      next();
    } catch (error) {
      return res.status(503).json({ error: 'Simulation access could not be verified' });
    }
  }

  const requireStudentSimulation = [requireProductAuth, requireCurrentSimulationAccess];

  async function saveLive(studentId, patch) {
    const id = `KHCRM-LIVE-${studentId}`;
    const current = liveCache.get(studentId) || {};
    const data = {
      ...current,
      ...patch,
      id,
      studentId,
      product: productForStudent(studentId),
      updatedAt: new Date().toISOString()
    };
    liveCache.set(studentId, data);
    await sbSet(sessionsTableForStudent(studentId), id, data);
    return data;
  }

  app.post(crmPaths('/presence'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const student = await loadStudent(studentId);
      const team = (student.infinitySimulation || student.kamukHoldings)?.team || teamFor(studentId);
      const employee = { id: studentId, name: clean(student.info?.name || student.name || req.auth.name || studentId, 100), team };
      const metrics = { ...metricsFrom(student), team };
      await saveLive(studentId, {
        employee,
        team,
        status: clean(req.body?.status || 'online', 20),
        activeCaseId: clean(req.body?.caseId, 30) || null,
        acceptedAt: clean(req.body?.acceptedAt, 40) || null,
        actionCount: Math.max(0, Number(req.body?.actionCount) || 0),
        metrics
      });
      return res.json({ ok: true, employee, metrics: { ...metrics, teamPoints: currentTeamPoints(team) } });
    } catch (error) {
      console.error('Kamuk Holdings presence:', error.message);
      return res.status(500).json({ error: 'Could not open the corporate desk' });
    }
  });

  app.post(crmPaths('/case/start'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const caseId = clean(req.body?.caseId, 30);
      const caseData = privateCase(caseId);
      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      const student = await loadStudent(studentId);
      const team = (student.infinitySimulation || student.kamukHoldings)?.team || teamFor(studentId);
      const current = student.infinitySimulation || student.kamukHoldings || {};
      student.infinitySimulation = { ...current, team, started: (Number(current.started) || 0) + 1, lastStartedAt: new Date().toISOString() };
      await sbSetStudent(studentId, student);
      const acceptedAt = new Date().toISOString();
      await saveLive(studentId, {
        employee: { id: studentId, name: clean(student.info?.name || student.name || req.auth.name || studentId, 100), team },
        team, status: 'working', activeCaseId: caseId, caseTitle: caseData.title,
        caseType: caseData.type, priority: caseData.priority, acceptedAt, actionCount: 0,
        events: [], recentActions: [], call: null, resolution: null, qaScore: null, metrics: metricsFrom(student)
      });
      return res.json({ ok: true, acceptedAt, metrics: { ...metricsFrom(student), teamPoints: currentTeamPoints(team) } });
    } catch (error) {
      console.error('Kamuk Holdings case start:', error.message);
      return res.status(500).json({ error: 'Could not accept case' });
    }
  });

  app.post(crmPaths('/case/action'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const caseId = clean(req.body?.caseId, 30);
      if (!caseIndex.has(caseId)) return res.status(404).json({ error: 'Case not found' });
      const action = safeActions([req.body?.action])[0];
      if (!action) return res.status(400).json({ error: 'Valid action required' });
      const current = liveCache.get(studentId) || {};
      const recentActions = Array.isArray(current.recentActions) ? current.recentActions.slice(-19) : [];
      recentActions.push(action);
      const events = eventsFromLive(current);
      events.push(safeEvent('action', action));
      await saveLive(studentId, {
        status: 'working',
        activeCaseId: caseId,
        actionCount: (Number(current.actionCount) || 0) + 1,
        recentActions,
        events: events.slice(-200)
      });
      return res.json({ ok: true, eventCount: events.length });
    } catch (error) {
      console.error('Kamuk Holdings case action:', error.message);
      return res.status(500).json({ error: 'Action could not be recorded' });
    }
  });

  app.post(crmPaths('/case/event'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const caseId = clean(req.body?.caseId, 30);
      if (!caseIndex.has(caseId)) return res.status(404).json({ error: 'Case not found' });
      const event = safeEvent(req.body?.type || req.body?.payload?.type || 'action', {
        ...(req.body?.payload || {}),
        ...(req.body?.action || {}),
        key: req.body?.payload?.key || req.body?.action?.key,
        label: req.body?.payload?.label || req.body?.action?.label,
        detail: req.body?.payload?.detail || req.body?.action?.detail
      });
      if (!event || (!event.key && !event.text && !event.body && !event.conversationId && event.type === 'action')) {
        return res.status(400).json({ error: 'Valid event payload required' });
      }
      const current = liveCache.get(studentId) || {};
      if (current.activeCaseId && current.activeCaseId !== caseId) {
        return res.status(409).json({ error: 'Event case does not match the active assignment' });
      }
      const events = eventsFromLive(current);
      events.push(event);
      const patch = {
        status: event.type?.startsWith('call') ? 'on-call' : 'working',
        activeCaseId: caseId,
        events: events.slice(-200),
        actionCount: (Number(current.actionCount) || 0) + 1
      };
      if (event.type === 'action' && event.key) {
        const recentActions = Array.isArray(current.recentActions) ? current.recentActions.slice(-19) : [];
        recentActions.push({ key: event.key, label: event.label, detail: event.detail, at: event.at });
        patch.recentActions = recentActions;
      }
      if (event.type === 'call-start' || event.type === 'call-event') {
        patch.call = {
          ...(current.call || {}),
          conversationId: event.conversationId || current.call?.conversationId || null,
          status: 'connected',
          mood: event.mood || current.call?.mood || null,
          startedAt: current.call?.startedAt || event.at
        };
      }
      if (event.type === 'call-end' || event.type === 'call-transcript') {
        patch.call = {
          ...(current.call || {}),
          conversationId: event.conversationId || current.call?.conversationId || null,
          status: 'ended',
          mood: event.mood || current.call?.mood || null,
          moodTrajectory: event.moodTrajectory?.length ? event.moodTrajectory : (current.call?.moodTrajectory || []),
          outcome: event.outcome || null,
          durationSec: event.durationSec || 0,
          transcript: event.transcript || current.call?.transcript || [],
          summary: event.summary || current.call?.summary || null,
          endedAt: event.at
        };
        patch.status = 'working';
      }
      await saveLive(studentId, patch);
      return res.json({ ok: true, event, eventCount: events.length });
    } catch (error) {
      console.error('Kamuk Holdings case event:', error.message);
      return res.status(500).json({ error: 'Event could not be recorded' });
    }
  });

  app.get(crmPaths('/case/state'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      let live = liveCache.get(studentId);
      if (!live) {
        const rows = await sbGet(sessionsTableForStudent(studentId));
        const row = rows.find(item => item.id === `KHCRM-LIVE-${studentId}`);
        live = row?.data || null;
        if (live) liveCache.set(studentId, live);
      }
      if (!live) return res.json({ ok: true, active: null, events: [], metrics: null });
      return res.json({
        ok: true,
        active: live.activeCaseId ? {
          caseId: live.activeCaseId,
          caseTitle: live.caseTitle,
          caseType: live.caseType,
          priority: live.priority,
          acceptedAt: live.acceptedAt,
          status: live.status,
          call: live.call || null
        } : null,
        events: eventsFromLive(live),
        metrics: live.metrics || null
      });
    } catch (error) {
      console.error('Kamuk Holdings case state:', error.message);
      return res.status(500).json({ error: 'Could not resume desk state' });
    }
  });

  app.get(crmPaths('/history'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const product = productForStudent(studentId);
      const rows = await sbGet(sessionsTableForStudent(studentId));
      const history = rows
        .filter(row => String(row.id || '').startsWith(`KHCRM-CASE-${studentId}-`) && row.data?.product === product)
        .map(row => ({
          id: row.id,
          caseId: row.data.caseId,
          caseTitle: row.data.caseTitle,
          resolvedAt: row.data.resolvedAt,
          qaScore: row.data.evaluation?.qaScore,
          disposition: row.data.submission?.resolution?.disposition,
          pointsAwarded: row.data.evaluation?.pointsAwarded
        }))
        .sort((a, b) => String(b.resolvedAt || '').localeCompare(String(a.resolvedAt || '')))
        .slice(0, 40);
      return res.json({ ok: true, history });
    } catch (error) {
      console.error('Kamuk Holdings history:', error.message);
      return res.status(500).json({ error: 'History unavailable' });
    }
  });

  app.post(crmPaths('/case/resolve'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const caseId = clean(req.body?.caseId, 30);
      const caseData = privateCase(caseId);
      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      const live = liveCache.get(studentId) || {};
      const serverEvents = eventsFromLive(live);
      const serverActions = actionsFromEvents(serverEvents);
      const serverNotes = notesFromEvents(serverEvents);
      const clientActions = safeActions(req.body?.actions);
      const mergedActions = [...serverActions];
      clientActions.forEach(action => {
        if (!mergedActions.some(existing => existing.key === action.key && existing.detail === action.detail)) {
          mergedActions.push(action);
        }
      });
      const clientNotes = safeNotes(req.body?.notes);
      const mergedNotes = [...serverNotes];
      clientNotes.forEach(note => {
        if (!mergedNotes.some(existing => existing.text === note.text && existing.at === note.at)) {
          mergedNotes.push(note);
        }
      });
      const submission = {
        actions: mergedActions.slice(0, 80),
        notes: mergedNotes.slice(0, 30),
        events: serverEvents.slice(-200),
        call: live.call || null,
        risk: {
          type: clean(req.body?.risk?.type, 30),
          probability: clean(req.body?.risk?.probability, 20),
          impact: clean(req.body?.risk?.impact, 20),
          amlStage: clean(req.body?.risk?.amlStage, 30)
        },
        resolution: {
          disposition: clean(req.body?.resolution?.disposition, 80),
          summary: clean(req.body?.resolution?.summary, 1600),
          nextStep: clean(req.body?.resolution?.nextStep, 500)
        },
        durationSec: Math.max(0, Math.min(14400, Number(req.body?.durationSec) || 0))
      };
      if (submission.resolution.summary.length < 35 || submission.resolution.nextStep.length < 12) {
        return res.status(400).json({ error: 'A professional resolution and concrete next step are required' });
      }
      if (!submission.actions.some(action => action.key === 'next-step')) {
        submission.actions.push({ key: 'next-step', label: 'Confirmed next step', detail: submission.resolution.nextStep, at: new Date().toISOString() });
      }

      const fallback = deterministicEvaluation(caseData, submission);
      let evaluation = fallback;
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const response = await claudeCall({
            model: 'claude-sonnet-4-6',
            max_tokens: 900,
            system: 'You are Alice, a rigorous corporate banking QA director. Return valid JSON only.',
            messages: [{ role: 'user', content: buildAlicePrompt(caseData, submission, fallback) }]
          });
          const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('').replace(/```json|```/g, '').trim();
          evaluation = normalizeAliceEvaluation(JSON.parse(text), fallback);
        } catch (error) {
          console.warn('Kamuk Holdings Alice fallback:', error.message);
        }
      }

      const student = await loadStudent(studentId);
      const previous = student.infinitySimulation || student.kamukHoldings || {};
      const team = previous.team || teamFor(studentId);
      student.infinitySimulation = {
        ...previous,
        team,
        resolved: (Number(previous.resolved) || 0) + 1,
        qaTotal: (Number(previous.qaTotal) || 0) + evaluation.qaScore,
        points: (Number(previous.points) || 0) + evaluation.pointsAwarded,
        lastResolvedAt: new Date().toISOString(),
        lastQaScore: evaluation.qaScore,
        lastCaseId: caseId,
        recentResolutions: [
          ...(Array.isArray(previous.recentResolutions) ? previous.recentResolutions : []).slice(-19),
          { caseId, at: new Date().toISOString(), qaScore: evaluation.qaScore, disposition: submission.resolution.disposition }
        ]
      };
      await sbSetStudent(studentId, student);
      const resolvedAt = new Date().toISOString();
      const resolutionRecord = {
        kind: 'infinity-simulation-resolution',
        product: productForStudent(studentId),
        studentId,
        studentName: clean(student.info?.name || student.name || req.auth.name || studentId, 100),
        team,
        caseId,
        caseTitle: caseData.title,
        caseType: caseData.type,
        priority: caseData.priority,
        acceptedAt: liveCache.get(studentId)?.acceptedAt || null,
        resolvedAt,
        durationSec: submission.durationSec,
        submission,
        evaluation
      };
      const recordId = `KHCRM-CASE-${studentId}-${Date.now()}`;
      await Promise.all([
        sbSet(sessionsTableForStudent(studentId), recordId, resolutionRecord),
        saveLive(studentId, {
          status: 'resolved', activeCaseId: null, resolvedCaseId: caseId, resolvedAt,
          resolution: submission.resolution, qaScore: evaluation.qaScore,
          metrics: metricsFrom(student)
        })
      ]);
      return res.json({ ok: true, evaluation, metrics: { ...metricsFrom(student), teamPoints: currentTeamPoints(team) }, resolutionId: recordId });
    } catch (error) {
      console.error('Kamuk Holdings case resolve:', error.message);
      return res.status(500).json({ error: 'Alice could not evaluate this resolution' });
    }
  });

  app.get(crmPaths('/supervisor'), requireTeacherAccess, async (req, res) => {
    try {
      if (!requireSimulationTeacher(req, res)) return;
      const product = supervisorProduct(req);
      const rows = await sbGet(product === 'kamuk' ? 'kamuk_sessions' : 'infinity_sessions');
      const now = Date.now();
      const live = rows
        .filter(row => String(row.id || '').startsWith('KHCRM-LIVE-') && row.data?.product === product)
        .map(row => {
          const data = row.data || {};
          const ageMs = now - new Date(data.updatedAt || 0).getTime();
          return {
            ...data,
            connected: ageMs < 70000,
            heartbeatAgeSec: Math.max(0, Math.round(ageMs / 1000)),
            elapsedSec: data.acceptedAt && data.activeCaseId ? Math.max(0, Math.round((now - new Date(data.acceptedAt).getTime()) / 1000)) : 0,
            onCall: data.status === 'on-call' || data.call?.status === 'connected',
            callDurationSec: data.call?.startedAt ? Math.max(0, Math.round((now - new Date(data.call.startedAt).getTime()) / 1000)) : 0
          };
        })
        .sort((a, b) => String(a.employee?.name || '').localeCompare(String(b.employee?.name || '')));
      const resolutions = rows
        .filter(row => String(row.id || '').startsWith('KHCRM-CASE-') && row.data?.product === product)
        .map(row => ({ id: row.id, ...row.data }))
        .sort((a, b) => String(b.resolvedAt || '').localeCompare(String(a.resolvedAt || '')))
        .slice(0, 100);
      const teamScores = { Apex: 0, Vanguard: 0 };
      live.forEach(item => { if (teamScores[item.team] != null) teamScores[item.team] += Number(item.metrics?.points) || 0; });
      return res.json({
        ok: true,
        generatedAt: new Date().toISOString(),
        summary: {
          connected: live.filter(item => item.connected).length,
          working: live.filter(item => item.connected && item.activeCaseId).length,
          onCall: live.filter(item => item.connected && item.onCall).length,
          resolved: resolutions.length,
          qaAverage: resolutions.length ? Math.round(resolutions.reduce((sum, item) => sum + (Number(item.evaluation?.qaScore) || 0), 0) / resolutions.length) : null
        },
        teamScores,
        live,
        resolutions
      });
    } catch (error) {
      console.error('Kamuk Holdings supervisor:', error.message);
      return res.status(500).json({ error: 'Supervisor feed unavailable' });
    }
  });

  app.get(crmPaths('/supervisor/resolution/:id'), requireTeacherAccess, async (req, res) => {
    try {
      if (!requireSimulationTeacher(req, res)) return;
      const id = clean(req.params.id, 120);
      if (!id.startsWith('KHCRM-CASE-') && !id.startsWith('KHCRM-LIVE-')) {
        return res.status(404).json({ error: 'Record not found' });
      }
      const product = supervisorProduct(req);
      const rows = await sbGet(product === 'kamuk' ? 'kamuk_sessions' : 'infinity_sessions');
      const row = rows.find(item => item.id === id && item.data?.product === product);
      if (!row) return res.status(404).json({ error: 'Record not found' });
      return res.json({ ok: true, record: { id: row.id, ...row.data } });
    } catch (error) {
      console.error('Kamuk Holdings supervisor detail:', error.message);
      return res.status(500).json({ error: 'Supervisor detail unavailable' });
    }
  });

  app.post(crmPaths('/call/token'), requireStudentSimulation, async (req, res) => {
    try {
      const studentId = requireSimulationStudent(req, res);
      if (!studentId) return;
      const caseId = clean(req.body?.caseId, 30);
      const caseData = caseIndex.get(caseId);
      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      const agentId = clean(process.env.INFINITY_HOLDINGS_AGENT_ID || process.env.KAMUK_HOLDINGS_AGENT_ID, 80);
      const apiKey = process.env.ELEVENLABS_KEY || '';
      if (!agentId || !apiKey) {
        return res.status(503).json({
          error: 'Voice is not configured for this desk',
          code: 'VOICE_NOT_CONFIGURED',
          voiceAvailable: false
        });
      }
      const client = caseData.client || {};
      const personality = client.personality || {};
      const dynamicVariables = {
        case_id: caseId,
        case_title: clean(caseData.title, 160),
        case_brief: clean(caseData.brief, 500),
        client_statement: clean(caseData.clientStatement, 500),
        client_name: clean(client.name, 100),
        client_company: clean(client.company, 120),
        client_segment: clean(client.segment, 80),
        personality: clean((personality.traits || []).join(', '), 200),
        baseline_mood: clean(personality.baselineMood || caseData.mood || 'neutral', 40),
        negotiation_style: clean(personality.negotiationStyle, 300),
        negotiation_goals: clean((personality.goals || []).join('; '), 400),
        protected_facts: clean(caseData.focus, 300),
        student_id: studentId,
        student_name: clean(req.auth?.name || studentId, 100)
      };
      const tokenResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
        { headers: { 'xi-api-key': apiKey } }
      );
      if (!tokenResponse.ok) {
        const text = await tokenResponse.text();
        console.error('Kamuk Holdings call token:', tokenResponse.status, text.slice(0, 200));
        return res.status(502).json({ error: 'Could not open the simulated call channel', code: 'VOICE_TOKEN_FAILED' });
      }
      const body = await tokenResponse.json();
      const signedUrl = body.signed_url || body.signedUrl;
      if (!signedUrl) return res.status(502).json({ error: 'Voice provider returned an empty session', code: 'VOICE_TOKEN_EMPTY' });
      const live = liveCache.get(studentId) || {};
      await saveLive(studentId, {
        status: 'on-call',
        activeCaseId: caseId,
        call: {
          status: 'connecting',
          mood: personality.baselineMood || caseData.mood || 'neutral',
          voiceId: personality.voiceId || null,
          startedAt: new Date().toISOString()
        }
      });
      return res.json({
        ok: true,
        voiceAvailable: true,
        signedUrl,
        agentId,
        voiceId: personality.voiceId || null,
        dynamicVariables,
        firstMessage: clean(caseData.clientStatement, 400),
        client: {
          name: client.name,
          phone: client.phone,
          company: client.company,
          mood: personality.baselineMood || caseData.mood || 'neutral'
        }
      });
    } catch (error) {
      console.error('Kamuk Holdings call token:', error.message);
      return res.status(500).json({ error: 'Could not start the simulated call' });
    }
  });

  app.post(crmPaths('/call/webhook'), async (req, res) => {
    try {
      const secret = clean(process.env.INFINITY_HOLDINGS_CALL_WEBHOOK_SECRET || process.env.KAMUK_HOLDINGS_CALL_WEBHOOK_SECRET, 120);
      const provided = clean(req.get('x-infinity-call-secret') || req.get('x-kamuk-call-secret') || req.body?.secret, 120);
      if (secret && provided !== secret) {
        return res.status(401).json({ error: 'Unauthorized webhook' });
      }
      const data = req.body?.data || req.body || {};
      const dynamic = data.conversation_initiation_client_data?.dynamic_variables
        || data.dynamic_variables
        || {};
      const studentId = clean(dynamic.student_id || data.user_id, 40);
      const caseId = clean(dynamic.case_id, 30);
      if (!studentId || !caseId) {
        return res.status(202).json({ ok: true, ignored: true });
      }
      const transcript = Array.isArray(data.transcript)
        ? data.transcript.map(turn => ({
          role: clean(turn.role || turn.speaker, 20),
          text: clean(turn.message || turn.text, 2000),
          at: clean(turn.time_in_call_secs != null ? String(turn.time_in_call_secs) : turn.at, 40)
        }))
        : [];
      const event = safeEvent('call-transcript', {
        conversationId: clean(data.conversation_id || data.conversationId, 80),
        durationSec: Number(data.metadata?.call_duration_secs || data.durationSec) || 0,
        summary: clean(data.analysis?.transcript_summary || data.analysis?.summary, 1000),
        outcome: clean(data.analysis?.call_successful ? 'completed' : 'ended', 40),
        transcript,
        at: new Date().toISOString()
      });
      const current = liveCache.get(studentId) || {};
      const events = eventsFromLive(current);
      events.push(event);
      await saveLive(studentId, {
        status: 'working',
        activeCaseId: caseId || current.activeCaseId || null,
        events: events.slice(-200),
        call: {
          ...(current.call || {}),
          status: 'ended',
          conversationId: event.conversationId,
          transcript: event.transcript,
          summary: event.summary,
          durationSec: event.durationSec,
          endedAt: event.at
        }
      });
      return res.json({ ok: true });
    } catch (error) {
      console.error('Kamuk Holdings call webhook:', error.message);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

module.exports = { registerKamukHoldingsCrm };
