/**
 * Jill Foundations modules catalog (M001–M012) + Mini Kaboom banks.
 */
(function (global) {
  'use strict';

  var CACHE_VER = '20260711m05';
  var MAP = null;
  var LOAD = null;

  var EMBEDDED = null; // filled after first fetch or setMap

  function setMap(data) {
    MAP = data && data.modules ? data : { modules: [] };
    return MAP;
  }

  function modules() {
    return (MAP && MAP.modules) || [];
  }

  function byId(id) {
    var list = modules();
    var want = String(id || '').toUpperCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id).toUpperCase() === want) return list[i];
    }
    return null;
  }

  function trackToModuleId(trackId) {
    var tid = String(trackId || '');
    if (!tid) return null;
    var list = modules();
    for (var i = 0; i < list.length; i++) {
      var ids = list[i].canonTrackIds || [];
      for (var j = 0; j < ids.length; j++) {
        if (ids[j] === tid) return list[i].id;
      }
    }
    return null;
  }

  function load() {
    if (MAP) return Promise.resolve(MAP);
    if (LOAD) return LOAD;
    LOAD = fetch('config/jill-foundations-modules.json?v=' + CACHE_VER)
      .then(function (r) { return r.ok ? r.json() : { modules: [] }; })
      .then(function (data) {
        setMap(data);
        return MAP;
      })
      .catch(function () {
        setMap({ modules: [] });
        return MAP;
      });
    return LOAD;
  }

  function buildKaboomQuestions(moduleId, count) {
    var mod = byId(moduleId);
    if (!mod || !mod.kaboomBank || !mod.kaboomBank.length) return [];
    var bank = mod.kaboomBank.slice();
    for (var i = bank.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = bank[i]; bank[i] = bank[j]; bank[j] = t;
    }
    var n = Math.min(count || (mod.mini && mod.mini.questions) || 5, bank.length);
    return bank.slice(0, n).map(function (q) {
      return {
        kpi: 'k3',
        topic: 'module-' + mod.id,
        moduleId: mod.id,
        q: q.q,
        options: q.options,
        answer: q.answer,
        explain: q.explain || ''
      };
    });
  }

  global.JillFoundationsModules = {
    load: load,
    setMap: setMap,
    modules: modules,
    byId: byId,
    trackToModuleId: trackToModuleId,
    buildKaboomQuestions: buildKaboomQuestions,
    CACHE_VER: CACHE_VER
  };

  // Eager load
  try { load(); } catch (e) { /* ignore */ }
})(typeof window !== 'undefined' ? window : globalThis);
