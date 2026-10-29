/**
 * Jill Canon Drill — tap columns + oral score vs active track.
 * Visual-only feedback (glow / ring). No text exercise blocks.
 */
(function (global) {
  'use strict';

  /** zones: labels for aria only; challenges cycle by index */
  var TRACK_ZONES = {
    irregular_verbs: 3,
    prepositions: 4,
    prepositions_time: 3,
    there: 3,
    negations: 3,
    articles: 3,
    modales: 3,
    modal: 3,
    progressive: 3,
    past: 3,
    present: 3,
    perfect: 3,
    combined: 4,
    future: 3,
    modal_have_pp: 3,
    modal_have_been: 4,
    gerundio: 2,
    gerund_prep: 3,
    comparatives: 3,
    have_had: 3,
    if_was_were: 3,
    overview: 4,
    nexus_idea_chain: 3,
    nexus_linkers: 3,
    nexus_star: 4,
    nexus_recovery: 3
  };

  /** Oral cues that count as on-track production */
  var ORAL_CUES = {
    irregular_verbs: [/\b(go|went|gone|do|did|done|take|took|taken|come|came|make|made|see|saw|seen|get|got|gotten|give|gave|given)\b/i],
    prepositions: [/\b(in|on|at)\b/i, /\b(i am|i'm|she is|he is|we are).{0,20}\b(in|on|at)\b/i],
    prepositions_time: [/\b(in|on|at)\b/i, /\b(monday|morning|night|january|weekend)\b/i],
    there: [/\bthere\s+(is|are|was|were)\b/i],
    negations: [/\b(don'?t|doesn'?t|didn'?t|isn'?t|aren'?t|won'?t|haven'?t|not)\b/i],
    articles: [/\b(a|an|the)\s+[a-z]/i],
    modales: [/\b(can|could|should|must|may|might|would|will)\s+[a-z]+/i],
    modal: [/\b(are you|do you|can you|is he|is she)\b/i],
    progressive: [/\b(am|is|are)\s+\w+ing\b/i],
    past: [/\b(yesterday|last\s+\w+|ago)\b/i, /\b(went|saw|did|made|took|had|was|were)\b/i],
    present: [/\b(every day|usually|always|often)\b/i, /\b(i|he|she|we|they)\s+\w+/i],
    perfect: [/\b(have|has)\s+\w+(ed|en|ne|n)\b/i, /\b(have|has)\s+(been|done|gone|seen|made|taken)\b/i],
    combined: [/\b(have|has)\s+been\s+\w+ing\b/i],
    future: [/\b(will\s+\w+|going\s+to\s+\w+)/i],
    modal_have_pp: [/\b(should|would|could|must|might|may|will)\s+have\s+\w+/i],
    modal_have_been: [/\b(should|would|could|must|might|may)\s+have\s+been\s+\w+ing\b/i],
    gerundio: [/\b(like|love|enjoy|hate)\s+\w+ing\b/i, /\b\w+ing\s+(is|makes)\b/i],
    gerund_prep: [/\b(before|after|without|by|at)\s+\w+ing\b/i],
    comparatives: [/\b(\w+er|more\s+\w+)\s+than\b/i],
    have_had: [/\b(have|has|had)\b/i],
    if_was_were: [/\bif\s+i\s+(was|were)\b/i],
    overview: [/\b(present|past|future|perfect|continuous|will|going to)\b/i]
  };

  var state = {
    trackId: null,
    zones: 3,
    target: 0,
    tapsOk: 0,
    tapsTotal: 0,
    oralBest: 0,
    round: 0
  };

  function zoneCount(trackId) {
    return TRACK_ZONES[trackId] || 3;
  }

  function start(trackId) {
    state.trackId = trackId || null;
    state.zones = zoneCount(trackId);
    state.target = 0;
    state.tapsOk = 0;
    state.tapsTotal = 0;
    state.oralBest = 0;
    state.round = 0;
    return getChallenge();
  }

  function getChallenge() {
    return {
      trackId: state.trackId,
      target: state.target,
      zones: state.zones,
      round: state.round,
      oralBest: state.oralBest
    };
  }

  function nextTarget() {
    state.round += 1;
    state.target = (state.target + 1) % Math.max(1, state.zones);
    return getChallenge();
  }

  /** Tap feedback: { ok, target, tapped, scorePct } */
  function registerTap(zoneIndex) {
    var idx = parseInt(zoneIndex, 10);
    if (isNaN(idx) || idx < 0) return { ok: false, target: state.target, tapped: idx, scorePct: tapScore() };
    state.tapsTotal += 1;
    var ok = idx === state.target;
    if (ok) {
      state.tapsOk += 1;
      nextTarget();
    }
    return {
      ok: ok,
      target: state.target,
      tapped: idx,
      scorePct: tapScore(),
      challenge: getChallenge()
    };
  }

  function tapScore() {
    if (!state.tapsTotal) return 0;
    return Math.round((state.tapsOk / state.tapsTotal) * 100);
  }

  function scoreUtterance(text, trackId) {
    var id = trackId || state.trackId;
    var t = String(text || '').trim();
    if (!t || !id) return { score: 0, ok: false, hits: 0, trackId: id };
    var cues = ORAL_CUES[id] || [];
    var hits = 0;
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].test(t)) hits += 1;
    }
    var score = cues.length ? Math.round((hits / cues.length) * 100) : 0;
    // Bonus: any English production with 3+ words while on a track
    var words = (t.match(/\b[a-zA-Z']+\b/g) || []).length;
    if (hits === 0 && words >= 4 && /[a-z]/i.test(t)) score = Math.max(score, 35);
    if (hits > 0 && words >= 3) score = Math.min(100, score + 15);
    if (score > state.oralBest) state.oralBest = score;
    return { score: score, ok: score >= 55, hits: hits, trackId: id, oralBest: state.oralBest };
  }

  function combinedScore() {
    var tap = tapScore();
    var oral = state.oralBest || 0;
    if (!state.tapsTotal && !oral) return 0;
    if (!state.tapsTotal) return oral;
    if (!oral) return tap;
    return Math.round(tap * 0.45 + oral * 0.55);
  }

  function snapshot() {
    return {
      trackId: state.trackId,
      target: state.target,
      zones: state.zones,
      tapsOk: state.tapsOk,
      tapsTotal: state.tapsTotal,
      oralBest: state.oralBest,
      combined: combinedScore(),
      round: state.round
    };
  }

  global.JillCanonDrill = {
    start: start,
    getChallenge: getChallenge,
    nextTarget: nextTarget,
    registerTap: registerTap,
    scoreUtterance: scoreUtterance,
    combinedScore: combinedScore,
    snapshot: snapshot,
    zoneCount: zoneCount
  };
})(typeof window !== 'undefined' ? window : globalThis);
