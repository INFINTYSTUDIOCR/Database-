/**
 * Single source of truth: Engine industry → scenario pool + CRM.
 * NO cross-mapping (education≠banking, tourism≠telecom, etc.)
 */
var NEXORA_INDUSTRY = (function () {
  'use strict';

  var ENGINE = {
    finance:     { pool: 'finance',     crm: 'Finance',     label: 'Finance/Banking', holdings: 'banking' },
    banking:     { pool: 'finance',     crm: 'Finance',     label: 'Finance/Banking', holdings: 'banking' },
    healthcare:  { pool: 'healthcare',  crm: 'Healthcare',  label: 'Healthcare', holdings: 'medical' },
    health:      { pool: 'healthcare',  crm: 'Healthcare',  label: 'Healthcare', holdings: 'medical' },
    medical:     { pool: 'healthcare',  crm: 'Healthcare',  label: 'Healthcare', holdings: 'medical' },
    legal:       { pool: 'legal',       crm: 'Legal',       label: 'Legal Services', holdings: 'legal' },
    law:         { pool: 'legal',       crm: 'Legal',       label: 'Legal Services', holdings: 'legal' },
    hospitality: { pool: 'tourism',     crm: 'Tourism',     label: 'Hospitality/Tourism', holdings: 'banking' },
    tourism:     { pool: 'tourism',     crm: 'Tourism',     label: 'Hospitality/Tourism', holdings: 'banking' },
    retail:      { pool: 'retail',      crm: 'Retail',      label: 'Retail/Sales', holdings: 'banking' },
    telecom:     { pool: 'telecom',     crm: 'Telecom',     label: 'Telecom', holdings: 'banking' },
    bpo:         { pool: 'corporate',   crm: 'Corporate',   label: 'BPO/Corporate', holdings: 'banking' },
    corporate:   { pool: 'corporate',   crm: 'Corporate',   label: 'Corporate/Business', holdings: 'banking' },
    tech:        { pool: 'technology',  crm: 'Technology',  label: 'Technology', holdings: 'banking' },
    technology:  { pool: 'technology',  crm: 'Technology',  label: 'Technology', holdings: 'banking' },
    education:   { pool: 'education',   crm: 'Education',   label: 'Education', holdings: 'banking' }
  };

  function engineKey(nxConfig) {
    if (!nxConfig) return 'corporate';
    var raw = nxConfig.industry || nxConfig.industryLabel || 'corporate';
    return String(raw).toLowerCase().replace(/[^a-z]/g, '') || 'corporate';
  }

  function resolve(nxConfig) {
    var key = engineKey(nxConfig);
    return ENGINE[key] || ENGINE.corporate;
  }

  function crmIndustry(nxConfig) {
    return resolve(nxConfig).crm;
  }

  function industryLabel(nxConfig) {
    if (nxConfig && nxConfig.industryLabel) return nxConfig.industryLabel;
    return resolve(nxConfig).label;
  }

  function poolSuffix(nxConfig) {
    return resolve(nxConfig).pool;
  }

  function scenarioPoolKey(nxConfig) {
    if (!nxConfig || !nxConfig.type) return 'customer_service:corporate';
    var type = nxConfig.type;
    var suffix = poolSuffix(nxConfig);
    if (type === 'team_meeting') return 'team_meeting:all';
    if (type === 'negotiation') return 'negotiation:all';
    if (type === 'stakeholder') return 'stakeholder:all';
    if (type === 'presentation') return 'presentation:all';
    if (type === 'mock_interview') return 'mock_interview:' + suffix;
    if (type === 'customer_service' || type === 'problem_solving') {
      return 'customer_service:' + suffix;
    }
    return type + ':' + suffix;
  }

  /** Opciones del selector en Infinity Nexus Engine — debe coincidir con pools del banco. */
  var ENGINE_SELECTOR_OPTIONS = [
    { value: 'corporate',   label: 'Corporate / Business' },
    { value: 'tech',        label: 'Technology' },
    { value: 'healthcare',  label: 'Healthcare / Medical' },
    { value: 'legal',       label: 'Legal Services' },
    { value: 'education',   label: 'Education' },
    { value: 'finance',     label: 'Finance / Banking' },
    { value: 'hospitality', label: 'Hospitality / Tourism' },
    { value: 'retail',      label: 'Retail / Sales' },
    { value: 'telecom',     label: 'Telecom / Cable & Internet' }
  ];

  function holdingsPackFor(nxConfig) {
    if (nxConfig && nxConfig.holdingsPack) {
      var hp = String(nxConfig.holdingsPack).toLowerCase();
      if (hp === 'banking' || hp === 'legal' || hp === 'medical') return hp;
    }
    var resolved = resolve(nxConfig);
    return resolved.holdings || 'banking';
  }

  function normalizeSkills(raw) {
    var list = [];
    if (Array.isArray(raw)) list = raw;
    else if (typeof raw === 'string') list = raw.split(/[,|\s]+/);
    var out = [];
    ['email', 'phone', 'chat'].forEach(function (s) {
      if (list.some(function (x) { return String(x).toLowerCase().trim() === s; })) out.push(s);
    });
    return out.length ? out : ['email', 'phone', 'chat'];
  }

  function industryAffectsScenarioPool(type) {
    return type === 'customer_service' || type === 'problem_solving' || type === 'mock_interview';
  }

  function labelForEngineValue(value) {
    var key = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    for (var i = 0; i < ENGINE_SELECTOR_OPTIONS.length; i++) {
      if (ENGINE_SELECTOR_OPTIONS[i].value === key) return ENGINE_SELECTOR_OPTIONS[i].label;
    }
    return ENGINE[key] ? ENGINE[key].label : (value || 'Corporate');
  }

  function populateEngineIndustrySelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = ENGINE_SELECTOR_OPTIONS.map(function (o) {
      return '<option value="' + o.value + '">' + o.label + '</option>';
    }).join('');
  }

  function describeSelection(type, industry) {
    var cfg = { type: type || 'customer_service', industry: industry || 'corporate' };
    var pool = scenarioPoolKey(cfg);
    var crm = crmIndustry(cfg);
    if (type === 'mock_interview') {
      return 'STAR Mock Interview · Pool: ' + pool + ' · 100 preguntas conductuales · Contexto: ' + crm;
    }
    if (type === 'team_meeting') {
      return 'Team Meeting / Presentation · Pool: ' + pool + ' · 100 escenarios de reunión';
    }
    if (type === 'presentation') {
      return 'Executive Presentation · Pool: ' + pool + ' · 100 presentaciones a liderazgo';
    }
    if (type === 'stakeholder') {
      return 'Stakeholder Alignment · Pool: ' + pool + ' · 100 escenarios multi-stakeholder';
    }
    if (type === 'negotiation') {
      return 'Negotiation · Pool: ' + pool + ' · 100 escenarios de negociación';
    }
    if (!industryAffectsScenarioPool(cfg.type)) {
      return 'Pool: ' + pool + ' (mismo para todas las industrias) · CRM según industria: ' + crm;
    }
    return 'Pool: ' + pool + ' · 100 escenarios · CRM: ' + crm;
  }

  return {
    ENGINE: ENGINE,
    ENGINE_SELECTOR_OPTIONS: ENGINE_SELECTOR_OPTIONS,
    engineKey: engineKey,
    resolve: resolve,
    crmIndustry: crmIndustry,
    industryLabel: industryLabel,
    poolSuffix: poolSuffix,
    scenarioPoolKey: scenarioPoolKey,
    industryAffectsScenarioPool: industryAffectsScenarioPool,
    labelForEngineValue: labelForEngineValue,
    populateEngineIndustrySelect: populateEngineIndustrySelect,
    describeSelection: describeSelection,
    holdingsPackFor: holdingsPackFor,
    normalizeSkills: normalizeSkills
  };
})();
