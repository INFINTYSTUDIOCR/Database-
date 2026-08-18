/**
 * Kamuk Holdings desk calls — scripts + mood that follow the CRM case.
 * Voices are the Nexora ElevenLabs catalog. Nexora Lab stays separate.
 */
const voices = require('../config/nexora-voices.json');

const PRACTICE_PACK = {
  gp1: 'KH-1042', gp2: 'KH-1051', gp3: 'KH-1064', gp4: 'KH-1064', gp5: 'KH-1042',
  gp6: 'KH-1102', gp7: 'KH-1064', gp8: 'KH-1201', gp9: 'KH-1120', gp10: 'KH-1202'
};

const FAMILY = {
  'KH-1042': 'freeze',
  'KH-1051': 'wire',
  'KH-1064': 'card',
  'KH-1084': 'internal-sar',
  'KH-1090': 'aml-hold',
  'KH-1102': 'lending',
  'KH-1110': 'internal-credit',
  'KH-1120': 'vip-travel'
};

const MOODS = ['furious', 'indignant', 'distressed', 'impatient', 'guarded', 'cautious', 'neutral', 'expectant', 'calming', 'pleasant', 'relieved'];

const FEMALE_FIRST = /^(marta|sofia|helena|andrea|patricia|valeria|camila|natalia|silvia|michelle|laura|elena|isabel|jimena|amanda|maria|ana|lucia|carolina|daniela|gabriela|paola|alejandra|monica|veronica|claudia|adriana|ines|irene|rosa|carmen)/i;

const SCRIPTS = {
  freeze: {
    opening: (c) => `${first(c)}, this is the third time I call. My operating account is frozen and two supplier payments declined. Payroll cannot wait.`,
    good: (c) => `Alright ${agent()}. I hear you own this. I will stay on the line while you look into Statements — just do not leave me hanging.`,
    better: () => 'That is the first useful update I have heard. Confirm Operations and call me back today before 4:30 p.m.',
    poor: () => 'You are repeating questions I already answered. Who is the owner and when do I get a real update?',
    worse: () => 'This is unacceptable. Escalate now. I will not sit through another empty hold.',
    pin: () => 'I am not giving you a PIN on this call. Fix the freeze.',
    close: () => 'Thank you. I will wait for that timed callback. Do not miss it.'
  },
  wire: {
    opening: (c) => `${first(c)}, forty-five people are waiting on payroll. The wire is still held. I need a trace reference and a real ETA.`,
    good: () => 'Good. Do not promise a release you cannot make. Give me the trace and when you will call me back.',
    better: () => 'I can work with a Level 3 escalation if you own the next call today.',
    poor: () => '“Soon” is not an answer. My plant will stop. Escalate or get me someone who can.',
    worse: () => 'If this wire sits another hour I escalate outside the bank.',
    pin: () => 'This is a wire, not a card. Stop asking for a PIN.',
    close: () => 'I will wait for the trace update at the time you just gave me.'
  },
  card: {
    opening: (c) => `${first(c)}, the Obsidian card declined and I am at the desk. I need this restored without reading numbers out loud in a lobby.`,
    good: () => 'Yes — identity first, last 6 only. Then tell me which control fired: travel notice or MCC.',
    better: () => 'If you set the travel notice and confirm last 6 after identity, I can finish check-in.',
    poor: () => 'Do not read my full card number. Verify me properly and fix the decline.',
    worse: () => 'I was embarrassed in front of clients. Get a director on this now.',
    pin: () => 'I will never give a PIN. Last 6 after identity only.',
    close: () => 'Confirmed. I will wait for the timed follow-up you just owned.'
  },
  'aml-hold': {
    opening: (c) => `${first(c)}, release those wires today. My counterparties are waiting and this hold is ridiculous.`,
    good: () => 'Fine. Routine verification. Just tell me what you still need and when you call me back — do not lecture me.',
    better: () => 'I will send the invoices if that is what you need. Give me a clock time.',
    poor: () => 'Stop stalling. Either the money moves or I want a supervisor.',
    worse: () => 'Tell me why you are really holding this. I want it in writing.',
    pin: () => 'This is not a card case. Stop asking for a PIN.',
    close: () => 'I will wait for the verification callback. Do not miss the time.'
  },
  lending: {
    opening: (c) => `${first(c)}, I need a facility that actually matches the expansion — not a product dump.`,
    good: () => 'Good questions. Walk me through Services on file and a proposal path with a date.',
    better: () => 'That is a fit I can take to the board if you send it in writing.',
    poor: () => 'Do not sell me the wrong product. Match the need first.',
    worse: () => 'If you cannot do discovery, transfer me to someone who can.',
    pin: () => 'I did not call about a PIN.',
    close: () => 'Send the proposal path by the time you just promised.'
  },
  'vip-travel': {
    opening: (c) => `${first(c)}, I need a confirmed itinerary tonight — aviation, ground, lounge. Not three vague options.`,
    good: () => 'Own the failure and confirm each piece. I will stay on the line.',
    better: () => 'Put the confirmations in writing and call me back with the times.',
    poor: () => 'Vague is not concierge. Confirm or escalate to the director desk.',
    worse: () => 'If this is not rebuilt tonight I move the relationship.',
    pin: () => 'I am not giving a PIN for travel recovery.',
    close: () => 'I will wait for the written confirmations at the time you named.'
  }
};

function first(caseData) {
  return String(caseData?.client?.name || 'Hello').split(/\s+/)[0];
}

function agent() {
  return 'agent';
}

function familyOf(caseData) {
  const id = String(caseData?.templateId || caseData?.id || '');
  if (FAMILY[id]) return FAMILY[id];
  const prefix = id.replace(/-\d+$/, '');
  const mapped = Object.keys(FAMILY).find((key) => id === key || id.startsWith(key.slice(0, 6)));
  if (id.startsWith('KH-12')) {
    const n = Number(id.slice(3));
    if (n >= 1201 && n <= 1204) return 'freeze';
    if (n >= 1211 && n <= 1214) return 'wire';
    if (n >= 1221 && n <= 1224) return 'card';
    if (n >= 1231 && n <= 1234) return 'internal-sar';
    if (n >= 1241 && n <= 1244) return 'aml-hold';
    if (n >= 1251 && n <= 1254) return 'lending';
    if (n >= 1261 && n <= 1264) return 'internal-credit';
    if (n >= 1271 && n <= 1274) return 'vip-travel';
  }
  return FAMILY[mapped] || 'freeze';
}

function isInternalOnly(caseData) {
  const family = familyOf(caseData);
  return family === 'internal-sar' || family === 'internal-credit';
}

function hashName(name) {
  const raw = String(name || 'client');
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return h;
}

function voiceForClient(client) {
  const existing = String(client?.personality?.voiceId || '').trim();
  if (existing) return { voiceId: existing, voiceAccent: client?.personality?.voiceAccent || '', voiceGender: client?.personality?.voiceGender || '' };
  const firstName = String(client?.name || '').split(/\s+/)[0] || '';
  const female = FEMALE_FIRST.test(firstName) || client?.personality?.voiceGender === 'female';
  const pool = female ? (voices.female || []) : (voices.male || []);
  const pick = pool[hashName(client?.name) % Math.max(1, pool.length)] || { id: female ? 'NoOVOzCQFLOvtsMoNcdT' : 'bfGb7JTLUnZebZRiFYyq', accent: female ? 'American Female' : 'American Male' };
  return { voiceId: pick.id, voiceAccent: pick.accent, voiceGender: female ? 'female' : 'male' };
}

function moodIndex(mood) {
  const i = MOODS.indexOf(String(mood || '').toLowerCase());
  return i < 0 ? MOODS.indexOf('neutral') : i;
}

function shiftMood(mood, delta) {
  const next = Math.max(0, Math.min(MOODS.length - 1, moodIndex(mood) + delta));
  return MOODS[next];
}

function gradeCallTurn(agentText) {
  const text = String(agentText || '').trim();
  const lower = text.toLowerCase();
  const missing = [];
  let delta = 0;
  const ack = /\b(understand|hear|sorry|apologize)\b/i.test(text) || /thank you for (waiting|calling)/i.test(text);
  const mirror = /\b(you said|you mentioned|so you|just to make sure|what happened was)\b/i.test(text);
  const timed = /\b(today|tomorrow|within|business day|a\.m\.|p\.m\.|\d{1,2}:\d{2})\b/i.test(text);
  const respond = /\b(i will|i am going to)\b/i.test(text) && timed;
  const recorded = /\brecorded line\b/i.test(text);
  const hold = /\b(stay with me|brief hold|i will be right back)\b/i.test(text);
  const identity = /\b(identity|date of birth|verify|verification|last 6)\b/i.test(text);
  const connector = /\b(because|however|therefore|although|even though|in other words|the thing is that)\b/i.test(text);
  const pinAsk = /\b(give me (your )?pin|what('?s| is) your pin|tell me (your )?pin|send (me )?(the )?pin)\b/i.test(lower);
  const panAsk = /\b(full (card )?number|sixteen digit|16-digit|read (me )?your card)\b/i.test(lower);
  const rude = /\b(calm down|not my problem|whatever|i don't know|someone will)\b/i.test(lower);
  const delay = /\b(whenever|as soon as possible|asap|later|soon)\b/i.test(lower) && !timed;

  if (ack) delta += 1; else missing.push('AMR Acknowledge');
  if (mirror) delta += 1; else missing.push('AMR Mirror');
  if (respond) delta += 2; else missing.push('AMR Respond: I will + hora');
  if (recorded) delta += 1;
  if (hold) delta += 1;
  if (identity) delta += 1;
  if (connector) delta += 1;
  if (pinAsk) { delta -= 3; missing.push('Never ask for a PIN'); }
  if (panAsk) { delta -= 3; missing.push('Never ask for the full card number'); }
  if (rude) { delta -= 2; missing.push('Stay professional — own the next step'); }
  if (delay) { delta -= 2; missing.push('Give a clock time, not “soon”'); }
  if (!text) { delta = -2; missing.push('Speak or type a real turn'); }

  return {
    delta,
    missing,
    pinAsk,
    quality: delta >= 3 ? 'good' : (delta <= -1 ? 'poor' : 'ok'),
    amr: ack && mirror && respond
  };
}

function pickLine(family, grade, mood, caseData) {
  const pack = SCRIPTS[family] || SCRIPTS.freeze;
  if (grade.pinAsk) return pack.pin(caseData);
  if (grade.quality === 'good' && moodIndex(mood) >= moodIndex('cautious')) return pack.close(caseData);
  if (grade.quality === 'good') return pack.better(caseData);
  if (grade.quality === 'poor' && moodIndex(mood) <= moodIndex('impatient')) return pack.worse(caseData);
  if (grade.quality === 'poor') return pack.poor(caseData);
  return pack.good(caseData);
}

function openingLine(caseData) {
  const family = familyOf(caseData);
  const pack = SCRIPTS[family];
  if (!pack) return String(caseData?.clientStatement || 'I need this resolved today.');
  return pack.opening(caseData);
}

function buildCallSession(caseData, auth) {
  const client = caseData?.client || {};
  const voice = voiceForClient(client);
  const mood = client.personality?.baselineMood || caseData?.mood || 'distressed';
  const family = familyOf(caseData);
  return {
    family,
    internal: isInternalOnly(caseData),
    mood,
    score: 40,
    opening: openingLine(caseData),
    voiceId: voice.voiceId,
    voiceAccent: voice.voiceAccent,
    voiceGender: voice.voiceGender,
    dynamicVariables: {
      case_id: String(caseData?.id || ''),
      case_title: String(caseData?.title || ''),
      case_brief: String(caseData?.brief || ''),
      client_statement: String(caseData?.clientStatement || ''),
      client_name: String(client.name || ''),
      client_company: String(client.company || ''),
      baseline_mood: String(mood),
      family,
      recorded_line: 'always',
      amr: 'Acknowledge, Mirror, Respond with a timed next step',
      no_pin: 'never ask for or read a PIN',
      last_6_only_after_identity: 'true',
      student_id: String(auth?.studentId || ''),
      student_name: String(auth?.name || auth?.studentId || '')
    }
  };
}

function nextCallTurn({ caseData, agentText, mood, score }) {
  const family = familyOf(caseData);
  const grade = gradeCallTurn(agentText);
  const currentMood = mood || caseData?.mood || 'distressed';
  const nextMood = shiftMood(currentMood, grade.delta);
  const nextScore = Math.max(0, Math.min(100, (Number(score) || 40) + grade.delta * 8));
  const reply = pickLine(family, grade, nextMood, caseData);
  return {
    ok: true,
    reply,
    mood: nextMood,
    score: nextScore,
    quality: grade.quality,
    amr: grade.amr,
    coaching: grade.missing,
    done: nextScore >= 78 && grade.amr && moodIndex(nextMood) >= moodIndex('calming')
  };
}

function practiceTemplateId(caseId) {
  const id = String(caseId || '');
  const gp = /^KH-PRAC-GP(\d+)$/i.exec(id) || /^PRACTICE-gp(\d+)$/i.exec(id);
  if (!gp) return null;
  return PRACTICE_PACK['gp' + gp[1]] || null;
}

module.exports = {
  FAMILY,
  PRACTICE_PACK,
  MOODS,
  familyOf,
  isInternalOnly,
  voiceForClient,
  gradeCallTurn,
  openingLine,
  buildCallSession,
  nextCallTurn,
  practiceTemplateId
};
