const path = require('path');
const {
  pack, templateMap, clean, productForStudent, sessionsTable, studentsTable, holdingsKey,
  weekKeyCR, workItemId, claimLockId, validateTrainingProgress, floorState,
  isNestingComplete, metricsFromFloor, dispositionKind, listWorkItems, listTouches,
  deterministicErrors, buildFloorAlicePrompt, normalizeFloorEvaluation,
  pendingEvaluationResult, leaderboardFromTouches, hasTouchEvidence
} = require('./kamuk-holdings-floor');

const caseIndex = new Map((pack.cases || []).map((item) => [item.id, item]));
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
  const rubric = privateRubrics.get(templateMap[caseId] || caseId);
  return publicCase && rubric ? { ...publicCase, ...rubric } : null;
}

function routeProduct(req) {
  return String(req.originalUrl || req.path || '').includes('/kamuk-holdings/') ? 'kamuk' : 'infinity';
}

function supervisorProduct(req) {
  const requested = clean(req.query?.product, 20).toLowerCase();
  return requested === 'kamuk' || requested === 'infinity' ? requested : routeProduct(req);
}

function teamFor(studentId) {
  const score = String(studentId || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return score % 2 === 0 ? 'Apex' : 'Vanguard';
}

function safeAction(value) {
  const action = {
    key: clean(value?.key, 60),
    label: clean(value?.label, 120),
    detail: clean(value?.detail, 800),
    at: new Date().toISOString()
  };
  return action.key ? action : null;
}

function safeEvent(type, payload) {
  const kind = clean(type, 40);
  const base = { type: kind, at: new Date().toISOString() };
  if (kind === 'note') {
    const text = clean(payload?.text, 1000);
    return text ? { ...base, channel: clean(payload?.channel, 50), text, status: clean(payload?.status, 40) } : null;
  }
  if (kind === 'email' || kind === 'email-client') {
    const body = clean(payload?.body || payload?.detail || payload?.text, 4000);
    return body ? {
      ...base, type: 'email', subject: clean(payload?.subject || payload?.label, 160),
      body, to: clean(payload?.to, 120), from: clean(payload?.from, 120)
    } : null;
  }
  if (kind.startsWith('call')) {
    return {
      ...base, type: kind === 'call' ? 'call-event' : kind,
      conversationId: clean(payload?.conversationId, 80),
      outcome: clean(payload?.outcome, 80), mood: clean(payload?.mood, 40),
      moodTrajectory: Array.isArray(payload?.moodTrajectory) ? payload.moodTrajectory.slice(0, 40).map((item) => clean(item, 40)) : [],
      durationSec: Math.max(0, Math.min(7200, Number(payload?.durationSec) || 0)),
      transcript: Array.isArray(payload?.transcript) ? payload.transcript.slice(0, 200).map((turn) => ({
        role: clean(turn?.role, 20), text: clean(turn?.text, 2000), at: clean(turn?.at, 40)
      })) : [],
      summary: clean(payload?.summary, 1000)
    };
  }
  const action = safeAction(payload);
  return action ? { ...base, type: 'action', ...action, at: base.at } : null;
}

function publicWorkItem(item) {
  const caseData = caseIndex.get(item.caseId) || {};
  return {
    id: item.id, workItemId: item.id, caseId: item.caseId, touchNumber: item.touchNumber,
    kind: item.touchNumber > 1 ? 'follow-up' : 'fresh', status: item.status,
    title: caseData.title, type: caseData.type, priority: caseData.priority,
    slaMinutes: caseData.slaMinutes, brief: caseData.brief, clientStatement: caseData.clientStatement,
    focus: caseData.focus, client: caseData.client, mood: caseData.mood,
    history: item.touchNumber > 1 ? (item.history || []) : []
  };
}

function eventsFromLive(live) {
  return Array.isArray(live?.events) ? live.events.slice(-200) : [];
}

function actionsFromEvents(events) {
  return events.filter((event) => event.type === 'action' && event.key).map((event) => ({
    key: event.key, label: event.label, detail: event.detail, at: event.at
  }));
}

function notesFromEvents(events) {
  return events.filter((event) => event.type === 'note' && event.text).map((event) => ({
    channel: event.channel, text: event.text, at: event.at
  }));
}

function registerKamukHoldingsCrm(app, deps) {
  const {
    requireProductAuth, requireTeacherAccess, sbGetStudentRow, sbSetStudent,
    sbGet, sbSet, sbGetOne, sbInsertOnly, claudeCall
  } = deps;
  const crmPaths = (suffix) => [`/infinity-holdings/crm${suffix}`, `/kamuk-holdings/crm${suffix}`];

  async function loadStudent(studentId) {
    const row = await sbGetStudentRow(studentId);
    return row?.data ? { ...row.data, id: studentId } : null;
  }

  function requirePortalStudent(req, res) {
    const studentId = clean(req.auth?.studentId, 40);
    if (req.auth?.role !== 'student' || !studentId) {
      res.status(403).json({ error: 'Student portal access required', code: 'STUDENT_ACCESS_REQUIRED' });
      return null;
    }
    if (productForStudent(studentId) !== routeProduct(req)) {
      res.status(403).json({ error: 'This desk belongs to a different product', code: 'PRODUCT_MISMATCH' });
      return null;
    }
    return studentId;
  }

  async function requireNesting(req, res, next) {
    try {
      const studentId = requirePortalStudent(req, res);
      if (!studentId) return;
      const student = await loadStudent(studentId);
      if (!student || !isNestingComplete(student, productForStudent(studentId))) {
        return res.status(403).json({ error: 'Complete nesting training before entering the case floor', code: 'NESTING_REQUIRED' });
      }
      req.floorStudent = student;
      next();
    } catch (error) {
      return res.status(503).json({ error: 'Nesting access could not be verified' });
    }
  }

  const studentAuth = [requireProductAuth];
  const deskAuth = [requireProductAuth, requireNesting];

  async function loadLive(studentId) {
    if (liveCache.has(studentId)) return liveCache.get(studentId);
    const row = await sbGetOne(sessionsTable(productForStudent(studentId)), `KHCRM-LIVE-${studentId}`);
    const live = row?.data || null;
    if (live) liveCache.set(studentId, live);
    return live;
  }

  async function saveLive(studentId, patch) {
    const product = productForStudent(studentId);
    const current = await loadLive(studentId) || {};
    const data = {
      ...current, ...patch, id: `KHCRM-LIVE-${studentId}`, studentId, product,
      updatedAt: new Date().toISOString()
    };
    liveCache.set(studentId, data);
    await sbSet(sessionsTable(product), data.id, data);
    return data;
  }

  async function seedWeeklyPool(product, weekKey) {
    const table = sessionsTable(product);
    await Promise.all((pack.cases || []).map((caseData) => {
      const id = workItemId(product, weekKey, `${caseData.id}-T1`);
      return sbInsertOnly(table, id, {
        kind: 'work-item', product, weekKey, caseId: caseData.id, touchNumber: 1,
        status: 'unassigned', createdAt: new Date().toISOString(), lastAgentId: null, history: []
      });
    }));
  }

  async function floorRows(product, weekKey) {
    await seedWeeklyPool(product, weekKey);
    const rows = await sbGet(sessionsTable(product));
    return {
      rows,
      workItems: listWorkItems(rows, product, weekKey),
      touches: listTouches(rows, product, weekKey)
    };
  }

  app.get(crmPaths('/training/progress'), studentAuth, async (req, res) => {
    try {
      const studentId = requirePortalStudent(req, res);
      if (!studentId) return;
      const student = await loadStudent(studentId);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      const state = floorState(student, productForStudent(studentId));
      const validated = validateTrainingProgress({ done: state.trainingDone, homeAnswers: state.homeAnswers });
      return res.json({
        ok: true, done: validated.done, homeStatus: validated.homeStatus,
        nestingCompletedAt: state.nestingCompletedAt || null,
        complete: Boolean(state.nestingCompletedAt) || validated.complete
      });
    } catch (error) {
      return res.status(500).json({ error: 'Training progress unavailable' });
    }
  });

  app.post(crmPaths('/training/progress'), studentAuth, async (req, res) => {
    try {
      const studentId = requirePortalStudent(req, res);
      if (!studentId) return;
      const student = await loadStudent(studentId);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      const product = productForStudent(studentId);
      const key = holdingsKey(product);
      const validated = validateTrainingProgress(req.body || {});
      const previous = student[key] || {};
      const nestingCompletedAt = validated.complete
        ? (previous.nestingCompletedAt || new Date().toISOString())
        : (previous.nestingCompletedAt || null);
      student[key] = {
        ...previous, trainingDone: validated.done, homeAnswers: validated.homeAnswers,
        nestingCompletedAt, trainingUpdatedAt: new Date().toISOString()
      };
      await sbSetStudent(studentId, student);
      return res.json({
        ok: true, done: validated.done, homeStatus: validated.homeStatus,
        nestingCompletedAt, complete: Boolean(nestingCompletedAt) || validated.complete
      });
    } catch (error) {
      return res.status(500).json({ error: 'Training progress could not be saved' });
    }
  });

  app.post(crmPaths('/presence'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const student = req.floorStudent;
      const product = productForStudent(studentId);
      const state = floorState(student, product);
      const team = state.team || teamFor(studentId);
      const employee = { id: studentId, name: clean(student.info?.name || student.name || req.auth.name || studentId, 100), team };
      const live = await loadLive(studentId);
      await saveLive(studentId, {
        employee, team, status: clean(req.body?.status || (live?.activeCaseId ? 'working' : 'online'), 20),
        metrics: metricsFromFloor(state)
      });
      return res.json({ ok: true, employee, metrics: metricsFromFloor(state) });
    } catch (error) {
      return res.status(500).json({ error: 'Could not open the corporate desk' });
    }
  });

  app.get(crmPaths('/pool'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const product = productForStudent(studentId);
      const weekKey = weekKeyCR();
      const { workItems } = await floorRows(product, weekKey);
      const items = workItems
        .filter((item) => item.status === 'unassigned' && (item.touchNumber === 1 || item.lastAgentId !== studentId))
        .map(publicWorkItem);
      return res.json({
        ok: true, weekKey, fresh: items.filter((item) => item.touchNumber === 1),
        followUps: items.filter((item) => item.touchNumber > 1), items
      });
    } catch (error) {
      return res.status(500).json({ error: 'Case pool unavailable' });
    }
  });

  async function freshRoundOpen(product, studentId, touches, workItems) {
    const myFresh = touches.some((touch) => touch.studentId === studentId && Number(touch.touchNumber) === 1)
      || workItems.some((item) => item.studentId === studentId && Number(item.touchNumber) === 1 && item.status === 'completed');
    if (!myFresh) return true;
    const studentRows = await sbGet(studentsTable(product));
    const certified = studentRows.filter((row) => isNestingComplete(row.data, product)).map((row) => row.id);
    return certified.every((id) =>
      touches.some((touch) => touch.studentId === id)
      || workItems.some((item) => item.studentId === id && item.status === 'completed')
    );
  }

  async function claimCase(req, res, requestedCaseId) {
    const studentId = req.auth.studentId;
    const product = productForStudent(studentId);
    const weekKey = weekKeyCR();
    const table = sessionsTable(product);
    const active = await loadLive(studentId);
    if (active?.activeCaseId && active?.status !== 'resolved') {
      return res.status(409).json({ error: 'Finish the active assignment before claiming another', code: 'ACTIVE_ASSIGNMENT' });
    }
    const { workItems, touches } = await floorRows(product, weekKey);
    const requestedWorkItemId = clean(req.body?.workItemId, 140);
    const candidates = workItems.filter((item) => {
      if (item.status !== 'unassigned') return false;
      if (requestedWorkItemId && item.id !== requestedWorkItemId) return false;
      if (requestedCaseId && item.caseId !== requestedCaseId) return false;
      return item.touchNumber === 1 || item.lastAgentId !== studentId;
    });
    if (!candidates.length) return res.status(409).json({ error: 'Requested case is no longer available', code: 'CASE_UNAVAILABLE' });
    const roundOpen = await freshRoundOpen(product, studentId, touches, workItems);
    const eligible = candidates.filter((item) => item.touchNumber > 1 || roundOpen);
    if (!eligible.length) {
      return res.status(409).json({ error: 'Fresh-case round is waiting for every certified student', code: 'ROUND_FAIRNESS' });
    }
    for (const item of eligible) {
      const token = `${item.caseId}-T${item.touchNumber}`;
      const lockId = claimLockId(product, weekKey, token);
      const lock = await sbInsertOnly(table, lockId, {
        kind: 'claim-lock', product, weekKey, caseId: item.caseId, touchNumber: item.touchNumber,
        workItemId: item.id, studentId, claimedAt: new Date().toISOString()
      });
      if (!lock.created) continue;
      const acceptedAt = new Date().toISOString();
      const assigned = { ...item, status: 'assigned', studentId, assignedAt: acceptedAt, acceptedAt, claimLockId: lockId };
      await sbSet(table, item.id, assigned);
      const student = await loadStudent(studentId);
      const key = holdingsKey(product);
      const previous = student[key] || {};
      const team = previous.team || teamFor(studentId);
      student[key] = {
        ...previous, team, started: (Number(previous.started) || 0) + 1,
        lastStartedAt: acceptedAt, activeWeekKey: weekKey
      };
      await sbSetStudent(studentId, student);
      const caseData = caseIndex.get(item.caseId);
      await saveLive(studentId, {
        employee: { id: studentId, name: clean(student.info?.name || student.name || req.auth.name || studentId, 100), team },
        team, status: 'working', activeCaseId: item.caseId, workItemId: item.id,
        touchNumber: item.touchNumber, caseTitle: caseData?.title, caseType: caseData?.type,
        priority: caseData?.priority, acceptedAt, events: [], recentActions: [], call: null,
        resolution: null, evaluation: null, metrics: metricsFromFloor(student[key])
      });
      return res.json({
        ok: true, acceptedAt, assignment: publicWorkItem(assigned),
        metrics: metricsFromFloor(student[key])
      });
    }
    return res.status(409).json({ error: 'Cases were claimed by another student; refresh the pool', code: 'CLAIM_CONFLICT' });
  }

  app.post(crmPaths('/case/claim'), deskAuth, (req, res) => claimCase(req, res, null).catch((error) => {
    console.error('Kamuk Holdings claim:', error.message);
    res.status(500).json({ error: 'Could not claim case' });
  }));

  app.post(crmPaths('/case/start'), deskAuth, (req, res) => {
    const caseId = clean(req.body?.caseId, 30);
    if (!caseIndex.has(caseId)) return res.status(404).json({ error: 'Case not found' });
    return claimCase(req, res, caseId).catch((error) => {
      console.error('Kamuk Holdings start:', error.message);
      res.status(500).json({ error: 'Could not accept case' });
    });
  });

  async function recordEvent(req, res, forcedAction) {
    const studentId = req.auth.studentId;
    const caseId = clean(req.body?.caseId, 30);
    const live = await loadLive(studentId);
    if (!live?.activeCaseId || live.activeCaseId !== caseId) {
      return res.status(409).json({ error: 'Event case does not match the active assignment' });
    }
    const payload = forcedAction ? req.body?.action : { ...(req.body?.payload || {}), ...(req.body?.action || {}) };
    const event = safeEvent(forcedAction ? 'action' : (req.body?.type || payload?.type || 'action'), payload);
    if (!event) return res.status(400).json({ error: 'Valid event payload required' });
    const events = eventsFromLive(live);
    events.push(event);
    const patch = {
      status: event.type.startsWith('call') ? 'on-call' : 'working',
      events: events.slice(-200), actionCount: (Number(live.actionCount) || 0) + 1
    };
    if (event.type === 'action') {
      patch.recentActions = [...(live.recentActions || []).slice(-19), event];
    }
    if (event.type === 'call-start' || event.type === 'call-event') {
      patch.call = { ...(live.call || {}), status: 'connected', conversationId: event.conversationId || null, startedAt: live.call?.startedAt || event.at };
    }
    if (event.type === 'call-end' || event.type === 'call-transcript') {
      patch.status = 'working';
      patch.call = {
        ...(live.call || {}), status: 'ended', conversationId: event.conversationId || null,
        transcript: event.transcript, summary: event.summary, durationSec: event.durationSec, endedAt: event.at
      };
    }
    await saveLive(studentId, patch);
    return res.json({ ok: true, event, eventCount: events.length });
  }

  app.post(crmPaths('/case/action'), deskAuth, (req, res) => recordEvent(req, res, true).catch((error) => {
    console.error('Kamuk Holdings action:', error.message);
    res.status(500).json({ error: 'Action could not be recorded' });
  }));
  app.post(crmPaths('/case/event'), deskAuth, (req, res) => recordEvent(req, res, false).catch((error) => {
    console.error('Kamuk Holdings event:', error.message);
    res.status(500).json({ error: 'Event could not be recorded' });
  }));

  app.get(crmPaths('/case/state'), deskAuth, async (req, res) => {
    try {
      const live = await loadLive(req.auth.studentId);
      if (!live) return res.json({ ok: true, active: null, events: [], metrics: null });
      return res.json({
        ok: true,
        active: live.activeCaseId ? {
          caseId: live.activeCaseId, workItemId: live.workItemId, touchNumber: live.touchNumber,
          caseTitle: live.caseTitle, caseType: live.caseType, priority: live.priority,
          acceptedAt: live.acceptedAt, status: live.status, call: live.call || null
        } : null,
        events: eventsFromLive(live), metrics: live.metrics || null
      });
    } catch (error) {
      return res.status(500).json({ error: 'Could not resume desk state' });
    }
  });

  app.get(crmPaths('/history'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const product = productForStudent(studentId);
      const rows = await sbGet(sessionsTable(product));
      const history = rows.filter((row) =>
        String(row.id || '').startsWith(`KHCRM-TOUCH-${product}-`) && row.data?.studentId === studentId
      ).map((row) => ({
        id: row.id, caseId: row.data.caseId, caseTitle: row.data.caseTitle,
        touchNumber: row.data.touchNumber, completedAt: row.data.completedAt,
        status: row.data.status, kind: row.data.kind, disposition: row.data.disposition,
        casePoints: row.data.evaluation?.casePoints, pointsAwarded: row.data.evaluation?.pointsAwarded
      })).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 60);
      return res.json({ ok: true, history });
    } catch (error) {
      return res.status(500).json({ error: 'History unavailable' });
    }
  });

  app.post(crmPaths('/case/resolve'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const product = productForStudent(studentId);
      const weekKey = weekKeyCR();
      const table = sessionsTable(product);
      const caseId = clean(req.body?.caseId, 30);
      const caseData = privateCase(caseId);
      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      const live = await loadLive(studentId);
      if (!live?.activeCaseId || live.activeCaseId !== caseId || !live.workItemId) {
        return res.status(409).json({ error: 'This case is not your active assignment' });
      }
      const serverEvents = eventsFromLive(live);
      if (!hasTouchEvidence(serverEvents, live.acceptedAt, 'email') || !hasTouchEvidence(serverEvents, live.acceptedAt, 'note')) {
        return res.status(400).json({ error: 'A server-recorded client email and brief note are required after accepting the case', code: 'TOUCH_EVIDENCE_REQUIRED' });
      }
      const submission = {
        actions: actionsFromEvents(serverEvents), notes: notesFromEvents(serverEvents),
        events: serverEvents, call: live.call || null,
        risk: {
          type: clean(req.body?.risk?.type, 30), probability: clean(req.body?.risk?.probability, 20),
          impact: clean(req.body?.risk?.impact, 20), amlStage: clean(req.body?.risk?.amlStage, 30)
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
      if (!submission.actions.some((action) => action.key === 'next-step')) {
        submission.actions.push({ key: 'next-step', label: 'Confirmed next step', detail: submission.resolution.nextStep, at: new Date().toISOString() });
      }
      const controlPrecheck = deterministicErrors(caseData, submission);
      const kind = dispositionKind(submission.resolution.disposition);
      let evaluation = pendingEvaluationResult(controlPrecheck);
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const response = await claudeCall({
            model: 'claude-sonnet-4-6', max_tokens: 900,
            system: 'You are Alice, a rigorous corporate banking QA director. Return valid JSON only.',
            messages: [{ role: 'user', content: buildFloorAlicePrompt(caseData, submission, controlPrecheck, kind) }]
          });
          const text = (response.content || []).filter((block) => block.type === 'text').map((block) => block.text).join('').replace(/```json|```/g, '').trim();
          evaluation = normalizeFloorEvaluation(JSON.parse(text), controlPrecheck);
        } catch (error) {
          console.warn('Kamuk Holdings Alice pending evaluation:', error.message);
        }
      }
      const completedAt = new Date().toISOString();
      const student = await loadStudent(studentId);
      const key = holdingsKey(product);
      const previous = student[key] || {};
      const sameWeek = previous.weeklyPointsWeek === weekKey;
      const pointsAwarded = Number(evaluation.pointsAwarded) || 0;
      student[key] = {
        ...previous,
        handled: (Number(previous.handled) || 0) + 1,
        resolved: (Number(previous.resolved) || 0) + (kind === 'resolved' ? 1 : 0),
        qaTotal: (Number(previous.qaTotal) || 0) + (evaluation.pendingEvaluation ? 0 : Number(evaluation.casePoints) || 0),
        points: (Number(previous.points) || 0) + pointsAwarded,
        weeklyPoints: (sameWeek ? Number(previous.weeklyPoints) || 0 : 0) + pointsAwarded,
        weeklyPointsWeek: weekKey, lastHandledAt: completedAt, lastCaseId: caseId,
        lastCasePoints: evaluation.pendingEvaluation ? null : evaluation.casePoints
      };
      const studentName = clean(student.info?.name || student.name || req.auth.name || studentId, 100);
      const touchRecord = {
        kind, status: evaluation.pendingEvaluation ? 'pending-evaluation' : 'evaluated',
        pendingEvaluation: Boolean(evaluation.pendingEvaluation),
        product, weekKey, studentId, studentName, team: student[key].team || teamFor(studentId),
        caseId, caseTitle: caseData.title, caseType: caseData.type, priority: caseData.priority,
        workItemId: live.workItemId, touchNumber: Number(live.touchNumber) || 1,
        acceptedAt: live.acceptedAt, completedAt, disposition: submission.resolution.disposition,
        durationSec: submission.durationSec, submission, controlPrecheck, evaluation
      };
      const touchId = `KHCRM-TOUCH-${product}-${weekKey}-${studentId}-${Date.now()}`;
      const inserted = await sbInsertOnly(table, touchId, touchRecord);
      if (!inserted.created) return res.status(409).json({ error: 'Touch record already exists', code: 'TOUCH_CONFLICT' });
      const workRow = await sbGetOne(table, live.workItemId);
      const completedWork = {
        ...(workRow?.data || {}), status: 'completed', studentId, completedAt,
        disposition: submission.resolution.disposition, touchId
      };
      await Promise.all([sbSetStudent(studentId, student), sbSet(table, live.workItemId, completedWork)]);
      let nextWorkItem = null;
      if (kind !== 'resolved') {
        const nextTouch = (Number(live.touchNumber) || 1) + 1;
        const nextId = workItemId(product, weekKey, `${caseId}-T${nextTouch}`);
        const history = [
          ...((workRow?.data?.history || []).slice(-9)),
          {
            touchId, touchNumber: Number(live.touchNumber) || 1, studentId, studentName,
            completedAt, disposition: submission.resolution.disposition,
            notes: submission.notes, emails: submission.events.filter((event) => event.type === 'email'),
            actions: submission.actions, systemContext: { risk: submission.risk, resolution: submission.resolution }
          }
        ];
        const nextPayload = {
          kind: 'work-item', product, weekKey, caseId, touchNumber: nextTouch,
          status: 'unassigned', createdAt: completedAt, lastAgentId: studentId, priorTouchId: touchId, history
        };
        const created = await sbInsertOnly(table, nextId, nextPayload);
        const nextData = created.row?.data || (created.created ? nextPayload : null);
        nextWorkItem = nextData ? publicWorkItem({ id: nextId, ...nextData }) : null;
      }
      await saveLive(studentId, {
        status: 'resolved', activeCaseId: null, workItemId: null, resolvedCaseId: caseId,
        resolvedAt: completedAt, resolution: submission.resolution, evaluation,
        metrics: metricsFromFloor(student[key])
      });
      return res.json({ ok: true, evaluation, controlPrecheck, metrics: metricsFromFloor(student[key]), touchId, nextWorkItem });
    } catch (error) {
      console.error('Kamuk Holdings resolve:', error.message);
      return res.status(500).json({ error: 'Case touch could not be completed' });
    }
  });

  function weeklyBoard(touches, workItems, studentsById) {
    const scored = new Map(leaderboardFromTouches(touches, studentsById).map((row) => [row.studentId, row]));
    const ids = new Set([
      ...scored.keys(),
      ...workItems.filter((item) => item.studentId && ['assigned', 'completed'].includes(item.status)).map((item) => item.studentId)
    ]);
    return [...ids].map((studentId) => {
      const base = scored.get(studentId) || {};
      const accepted = workItems.filter((item) => item.studentId === studentId && ['assigned', 'completed'].includes(item.status)).length;
      const handled = touches.filter((touch) => touch.studentId === studentId).length;
      const resolved = touches.filter((touch) => touch.studentId === studentId && touch.kind === 'resolved').length;
      const student = studentsById.get(studentId) || {};
      return {
        studentId,
        name: base.name || student.info?.name || student.name || studentId,
        weeklyPoints: Number(base.weeklyPoints) || 0,
        averageScore: Number(base.averageScore) || 0,
        started: accepted,
        handled,
        resolved,
        resolutionRate: accepted ? Math.round((resolved / accepted) * 100) : 0
      };
    }).sort((a, b) =>
      b.weeklyPoints - a.weeklyPoints || b.resolved - a.resolved
      || b.averageScore - a.averageScore || String(a.name).localeCompare(String(b.name))
    ).map((row, index) => ({ ...row, rank: index + 1 }));
  }

  app.get(crmPaths('/leaderboard'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const product = productForStudent(studentId);
      const weekKey = weekKeyCR();
      const [rows, studentRows] = await Promise.all([sbGet(sessionsTable(product)), sbGet(studentsTable(product))]);
      const studentsById = new Map(studentRows.map((row) => [row.id, row.data || {}]));
      const board = weeklyBoard(
        listTouches(rows, product, weekKey),
        listWorkItems(rows, product, weekKey),
        studentsById
      );
      return res.json({ ok: true, weekKey, board, me: board.find((row) => row.studentId === studentId) || { studentId, rank: null, weeklyPoints: 0, resolutionRate: 0 } });
    } catch (error) {
      return res.status(500).json({ error: 'Leaderboard unavailable' });
    }
  });

  function requireSupervisor(req, res) {
    if (!['trainer', 'superadmin', 'master'].includes(req.auth?.role)) {
      res.status(403).json({ error: 'Supervisor access required' });
      return false;
    }
    return true;
  }

  app.get(crmPaths('/supervisor'), requireTeacherAccess, async (req, res) => {
    try {
      if (!requireSupervisor(req, res)) return;
      const product = supervisorProduct(req);
      const weekKey = weekKeyCR();
      const [rows, studentRows] = await Promise.all([sbGet(sessionsTable(product)), sbGet(studentsTable(product))]);
      const workItems = listWorkItems(rows, product, weekKey);
      const touches = listTouches(rows, product, weekKey);
      const board = weeklyBoard(touches, workItems, new Map(studentRows.map((row) => [row.id, row.data || {}])));
      const now = Date.now();
      const live = rows.filter((row) => String(row.id).startsWith('KHCRM-LIVE-') && row.data?.product === product)
        .map((row) => {
          const data = row.data;
          const ageMs = now - new Date(data.updatedAt || 0).getTime();
          return { ...data, connected: ageMs < 70000, heartbeatAgeSec: Math.max(0, Math.round(ageMs / 1000)) };
        });
      const recentTouches = touches.sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 100);
      return res.json({
        ok: true, product, weekKey, generatedAt: new Date().toISOString(),
        summary: {
          connected: live.filter((item) => item.connected).length,
          working: live.filter((item) => item.connected && item.activeCaseId).length,
          unassigned: workItems.filter((item) => item.status === 'unassigned').length,
          freshPool: workItems.filter((item) => item.status === 'unassigned' && item.touchNumber === 1).length,
          followUpPool: workItems.filter((item) => item.status === 'unassigned' && item.touchNumber > 1).length,
          pendingEvaluations: touches.filter((item) => item.pendingEvaluation || item.evaluation?.pendingEvaluation).length
        },
        live, leaderboard: board, winner: board[0] || null,
        resolveRates: board.map(({ studentId, name, started, resolved, resolutionRate }) => ({ studentId, name, started, resolved, resolutionRate })),
        recentTouches
      });
    } catch (error) {
      return res.status(500).json({ error: 'Supervisor feed unavailable' });
    }
  });

  app.get(crmPaths('/supervisor/resolution/:id'), requireTeacherAccess, async (req, res) => {
    try {
      if (!requireSupervisor(req, res)) return;
      const product = supervisorProduct(req);
      const id = clean(req.params.id, 180);
      const row = await sbGetOne(sessionsTable(product), id);
      if (!row || row.data?.product !== product) return res.status(404).json({ error: 'Record not found' });
      return res.json({ ok: true, record: { id: row.id, ...row.data } });
    } catch (error) {
      return res.status(500).json({ error: 'Supervisor detail unavailable' });
    }
  });

  app.post(crmPaths('/supervisor/coaching'), requireTeacherAccess, async (req, res) => {
    try {
      if (!requireSupervisor(req, res)) return;
      const product = supervisorProduct(req);
      const note = clean(req.body?.note, 1600);
      const studentId = clean(req.body?.studentId, 40);
      const touchId = clean(req.body?.touchId, 180);
      if (!note || !studentId) return res.status(400).json({ error: 'Student and coaching note are required' });
      if (productForStudent(studentId) !== product) return res.status(403).json({ error: 'Student belongs to another product' });
      if (touchId) {
        const touch = await sbGetOne(sessionsTable(product), touchId);
        if (!touch || touch.data?.studentId !== studentId || touch.data?.product !== product) {
          return res.status(404).json({ error: 'Touch not found' });
        }
      }
      const createdAt = new Date().toISOString();
      const id = `KHCRM-COACH-${product}-${studentId}-${Date.now()}`;
      const record = {
        kind: 'coaching', product, studentId, touchId: touchId || null, note, createdAt,
        coachId: clean(req.auth?.sub || req.auth?.id, 80), coachName: clean(req.auth?.name, 100)
      };
      const inserted = await sbInsertOnly(sessionsTable(product), id, record);
      if (!inserted.created) return res.status(409).json({ error: 'Coaching note could not be created' });
      return res.json({ ok: true, coaching: { id, ...record } });
    } catch (error) {
      return res.status(500).json({ error: 'Coaching note could not be saved' });
    }
  });

  app.post(crmPaths('/call/token'), deskAuth, async (req, res) => {
    try {
      const studentId = req.auth.studentId;
      const caseId = clean(req.body?.caseId, 30);
      const caseData = caseIndex.get(caseId);
      const live = await loadLive(studentId);
      if (!caseData) return res.status(404).json({ error: 'Case not found' });
      if (live?.activeCaseId !== caseId) return res.status(409).json({ error: 'Claim this case before starting a call' });
      const agentId = clean(process.env.INFINITY_HOLDINGS_AGENT_ID || process.env.KAMUK_HOLDINGS_AGENT_ID, 80);
      const apiKey = process.env.ELEVENLABS_KEY || '';
      if (!agentId || !apiKey) return res.status(503).json({ error: 'Voice is not configured for this desk', code: 'VOICE_NOT_CONFIGURED', voiceAvailable: false });
      const client = caseData.client || {};
      const personality = client.personality || {};
      const dynamicVariables = {
        case_id: caseId, case_title: clean(caseData.title, 160), case_brief: clean(caseData.brief, 500),
        client_statement: clean(caseData.clientStatement, 500), client_name: clean(client.name, 100),
        client_company: clean(client.company, 120), client_segment: clean(client.segment, 80),
        personality: clean((personality.traits || []).join(', '), 200),
        baseline_mood: clean(personality.baselineMood || caseData.mood || 'neutral', 40),
        negotiation_style: clean(personality.negotiationStyle, 300),
        negotiation_goals: clean((personality.goals || []).join('; '), 400),
        protected_facts: clean(caseData.focus, 300), student_id: studentId,
        student_name: clean(req.auth?.name || studentId, 100)
      };
      const tokenResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, {
        headers: { 'xi-api-key': apiKey }
      });
      if (!tokenResponse.ok) return res.status(502).json({ error: 'Could not open the simulated call channel', code: 'VOICE_TOKEN_FAILED' });
      const body = await tokenResponse.json();
      const signedUrl = body.signed_url || body.signedUrl;
      if (!signedUrl) return res.status(502).json({ error: 'Voice provider returned an empty session', code: 'VOICE_TOKEN_EMPTY' });
      await saveLive(studentId, {
        status: 'on-call',
        call: { status: 'connecting', mood: personality.baselineMood || caseData.mood || 'neutral', voiceId: personality.voiceId || null, startedAt: new Date().toISOString() }
      });
      return res.json({
        ok: true, voiceAvailable: true, signedUrl, agentId, voiceId: personality.voiceId || null,
        dynamicVariables, firstMessage: clean(caseData.clientStatement, 400),
        client: { name: client.name, phone: client.phone, company: client.company, mood: personality.baselineMood || caseData.mood || 'neutral' }
      });
    } catch (error) {
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
      const dynamic = data.conversation_initiation_client_data?.dynamic_variables || data.dynamic_variables || {};
      const studentId = clean(dynamic.student_id || data.user_id, 40);
      const caseId = clean(dynamic.case_id, 30);
      if (!studentId || !caseId) return res.status(202).json({ ok: true, ignored: true });
      const live = await loadLive(studentId);
      const transcript = Array.isArray(data.transcript) ? data.transcript.map((turn) => ({
        role: clean(turn.role || turn.speaker, 20), text: clean(turn.message || turn.text, 2000),
        at: clean(turn.time_in_call_secs != null ? String(turn.time_in_call_secs) : turn.at, 40)
      })) : [];
      const event = safeEvent('call-transcript', {
        conversationId: clean(data.conversation_id || data.conversationId, 80),
        durationSec: Number(data.metadata?.call_duration_secs || data.durationSec) || 0,
        summary: clean(data.analysis?.transcript_summary || data.analysis?.summary, 1000),
        outcome: clean(data.analysis?.call_successful ? 'completed' : 'ended', 40), transcript
      });
      const events = eventsFromLive(live || {});
      events.push(event);
      await saveLive(studentId, {
        status: 'working',
        activeCaseId: caseId || live?.activeCaseId || null,
        events: events.slice(-200),
        call: {
          ...(live?.call || {}), status: 'ended', conversationId: event.conversationId,
          transcript: event.transcript, summary: event.summary, durationSec: event.durationSec, endedAt: event.at
        }
      });
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

module.exports = { registerKamukHoldingsCrm };
