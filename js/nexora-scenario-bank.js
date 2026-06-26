/**
 * Nexora scenario bank — strict pool per type+industry. Zero cross-industry fallback.
 */
var NEXORA_SCENARIO_BANK = (function () {
  'use strict';

  var data = typeof NEXORA_SCENARIO_BANK_DATA !== 'undefined' ? NEXORA_SCENARIO_BANK_DATA : { pools: {}, POOL_SIZE: 100 };
  var POOL_SIZE = data.POOL_SIZE || 100;

  function poolKey(nxConfig) {
    return NEXORA_INDUSTRY.scenarioPoolKey(nxConfig);
  }

  function resolveIndustryLabel(nxConfig) {
    return NEXORA_INDUSTRY.industryLabel(nxConfig);
  }

  function resolveCrmIndustry(nxConfig) {
    return NEXORA_INDUSTRY.crmIndustry(nxConfig);
  }

  function getPool(nxConfig) {
    if (!nxConfig) return [];
    var key = poolKey(nxConfig);
    var pool = data.pools[key];
    return pool && pool.length ? pool : [];
  }

  function getFromPool(nxConfig, index) {
    var pool = getPool(nxConfig);
    if (!pool.length) return null;
    return Object.assign({}, pool[index % pool.length]);
  }

  return {
    POOL_SIZE: POOL_SIZE,
    poolKey: poolKey,
    getPool: getPool,
    getFromPool: getFromPool,
    resolveIndustryLabel: resolveIndustryLabel,
    resolveCrmIndustry: resolveCrmIndustry
  };
})();
