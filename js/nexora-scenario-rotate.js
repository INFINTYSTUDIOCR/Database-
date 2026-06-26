/**
 * Nexora scenario rotation — round-robin within role/type/industry pool; no immediate repeats.
 */
var NexoraScenarioRotate = (function () {
  'use strict';

  var RECENT_MAX = 12;

  function studentKey() {
    try {
      return localStorage.getItem('nexora_student_id') || 'anon';
    } catch (e) {
      return 'anon';
    }
  }

  function storageKey(nxConfig) {
    var type = (nxConfig && nxConfig.type) || 'customer_service';
    var industry = (nxConfig && nxConfig.industry) || 'general';
    return 'nexora_rotate_v3_' + studentKey() + '_' + type + '_' + industry;
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

  function loadSessionRecent() {
    try {
      var raw = localStorage.getItem('nexora_recent_scenarios');
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSessionRecent(id) {
    try {
      var recent = loadSessionRecent().filter(function (x) { return x !== id; });
      recent.unshift(id);
      localStorage.setItem('nexora_recent_scenarios', JSON.stringify(recent.slice(0, RECENT_MAX)));
    } catch (e) {}
  }

  function resolveTargetTypes(nxConfig, engineTypeMap) {
    if (!nxConfig || !nxConfig.type) return ['customer_service'];
    var t = nxConfig.type;
    if (t === 'mock_interview') return ['star_interview', 'interview'];
    if (t === 'problem_solving') return ['customer_service'];
    if (t === 'presentation') return ['corporate'];
    var mapped = (engineTypeMap && engineTypeMap[t]) || t;
    return [mapped];
  }

  function scenarioType(sc) {
    return sc.type || 'customer_service';
  }

  function matchesType(sc, targetTypes) {
    var st = scenarioType(sc);
    for (var i = 0; i < targetTypes.length; i++) {
      var tt = targetTypes[i];
      if (tt === 'customer_service') {
        if (!sc.type || st === 'customer_service') return true;
      } else if (st === tt) return true;
    }
    return false;
  }

  function normalizeIndustry(raw) {
    if (!raw) return '';
    var key = String(raw).toLowerCase().replace(/[^a-z]/g, '');
    var map = (typeof NEXORA_SCENARIO_LIBRARY !== 'undefined' && NEXORA_SCENARIO_LIBRARY.INDUSTRY_KEY_MAP) || {};
    return map[key] || raw;
  }

  function matchesIndustry(sc, nxConfig) {
    if (!nxConfig || !nxConfig.industry) return true;
    var target = normalizeIndustry(nxConfig.industryLabel || nxConfig.industry);
    if (!target) return true;
    var scIndustry = normalizeIndustry(sc.industry);
    if (!scIndustry) return true;
    return String(scIndustry).toLowerCase() === String(target).toLowerCase();
  }

  function filterPool(scenarios, nxConfig, engineTypeMap) {
    var targetTypes = resolveTargetTypes(nxConfig, engineTypeMap);
    var diff = parseInt(nxConfig && nxConfig.difficulty, 10) || 3;

    function byType(list) {
      return list.filter(function (sc) { return matchesType(sc, targetTypes); });
    }

    function byIndustry(list) {
      var industryMatched = list.filter(function (sc) { return matchesIndustry(sc, nxConfig); });
      return industryMatched.length ? industryMatched : list;
    }

    function byDiff(list) {
      return list.filter(function (sc) {
        var sd = sc.diff || sc.difficulty || 2;
        return Math.abs(sd - diff) <= 1;
      });
    }

    var typed = byType(scenarios);
    var industryPool = byIndustry(typed);
    var pool = byDiff(industryPool);
    if (pool.length <= 1) pool = byDiff(typed);
    if (pool.length <= 1) pool = industryPool;
    if (pool.length <= 1) pool = typed;
    return pool;
  }

  function pickFromPool(pool, prevId, state) {
    if (!pool.length) return null;

    var recent = {};
    (state.recent || []).forEach(function (id) { recent[id] = 1; });
    loadSessionRecent().forEach(function (id) { recent[id] = 1; });

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
    saveSessionRecent(pick.id);
    return Object.assign({}, pick);
  }

  function pickNext(scenarios, nxConfig, prevId, mergeFn, buildFallbackFn, engineTypeMap) {
    var key = storageKey(nxConfig);
    var state = loadState(key);
    var pool = filterPool(scenarios, nxConfig, engineTypeMap);
    var picked = pickFromPool(pool, prevId, state);
    saveState(key, state);

    if (picked) {
      return mergeFn ? mergeFn(picked, nxConfig) : picked;
    }
    if (typeof buildFallbackFn === 'function') {
      var fb = buildFallbackFn(nxConfig, state.index || 0);
      state.index = ((state.index || 0) + 1) % 20;
      saveState(key, state);
      saveSessionRecent(fb.id);
      return mergeFn ? mergeFn(fb, nxConfig) : fb;
    }
    return null;
  }

  return { pickNext: pickNext, filterPool: filterPool };
})();
