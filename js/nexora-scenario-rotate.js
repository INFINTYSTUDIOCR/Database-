/**
 * Nexora scenario rotation — strict single pool; no cross-industry fallback.
 */
var NexoraScenarioRotate = (function () {
  'use strict';

  var RECENT_MAX = 15;

  function studentKey() {
    try {
      return localStorage.getItem('nexora_student_id') || 'anon';
    } catch (e) {
      return 'anon';
    }
  }

  function storageKey(nxConfig) {
    var pk = NEXORA_SCENARIO_BANK.poolKey(nxConfig);
    return 'nexora_rotate_v5_' + studentKey() + '_' + pk;
  }

  function loadState(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { index: 0, recent: [] };
  }

  function saveState(key, state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }

  function loadSessionRecent(poolKey) {
    try {
      var raw = localStorage.getItem('nexora_recent_' + poolKey);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSessionRecent(poolKey, id) {
    try {
      var recent = loadSessionRecent(poolKey).filter(function (x) { return x !== id; });
      recent.unshift(id);
      localStorage.setItem('nexora_recent_' + poolKey, JSON.stringify(recent.slice(0, RECENT_MAX)));
    } catch (e) {}
  }

  function filterPool(scenarios, nxConfig) {
    var pool = scenarios || NEXORA_SCENARIO_BANK.getPool(nxConfig);
    var diff = parseInt(nxConfig && nxConfig.difficulty, 10) || 3;
    var byDiff = pool.filter(function (sc) {
      var sd = sc.diff || sc.difficulty || 3;
      return Math.abs(sd - diff) <= 1;
    });
    return byDiff.length >= Math.min(20, pool.length) ? byDiff : pool;
  }

  function pickFromPool(pool, poolKeyStr, prevId, state) {
    if (!pool.length) return null;

    var recent = {};
    (state.recent || []).forEach(function (id) { recent[id] = 1; });
    loadSessionRecent(poolKeyStr).forEach(function (id) { recent[id] = 1; });

    var candidates = pool.filter(function (sc) { return sc.id !== prevId; });
    if (!candidates.length) candidates = pool.slice();

    var pick = null;
    var start = state.index || 0;
    var i;
    for (i = 0; i < candidates.length; i++) {
      var idx = (start + i) % candidates.length;
      var sc = candidates[idx];
      if (!recent[sc.id] || candidates.length === 1) {
        pick = sc;
        state.index = (idx + 1) % candidates.length;
        break;
      }
    }
    if (!pick) {
      pick = candidates[start % candidates.length];
      state.index = (start + 1) % candidates.length;
    }

    state.recent = [pick.id].concat((state.recent || []).filter(function (id) { return id !== pick.id; }));
    state.recent = state.recent.slice(0, Math.min(RECENT_MAX, pool.length));
    saveSessionRecent(poolKeyStr, pick.id);
    return Object.assign({}, pick);
  }

  function pickNext(scenarios, nxConfig, prevId, mergeFn) {
    var pk = NEXORA_SCENARIO_BANK.poolKey(nxConfig);
    var key = storageKey(nxConfig);
    var state = loadState(key);
    var pool = filterPool(scenarios, nxConfig);
    var picked = pickFromPool(pool, pk, prevId, state);
    saveState(key, state);

    if (picked) {
      return mergeFn ? mergeFn(picked, nxConfig) : picked;
    }
    return null;
  }

  return { pickNext: pickNext, filterPool: filterPool };
})();
