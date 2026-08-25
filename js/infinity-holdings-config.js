/**
 * Infinity Holdings Inc — single CRM skeleton config.
 * Same tabs/navigation; industry packs swap data/actions.
 * Modes: production (scored) | nexora (same desk, unscored) | guided mock (e-learning).
 */
(function (global) {
  'use strict';

  var BRAND = {
    name: 'Infinity Holdings Inc',
    short: 'Holdings',
    deskTitle: 'Infinity Holdings Inc — Support Desk',
    seal: 'IH',
    emailDomain: 'infinityholdings.com',
    siteHost: 'infinityholdings.com'
  };

  var INDUSTRIES = {
    banking: {
      id: 'banking',
      label: 'Banking & Financial Services',
      packUrl: 'data/kamuk-holdings-crm-pack-v1.json',
      deskSubtitle: 'Corporate Banking Desk',
      skillsDefault: ['email', 'phone', 'chat']
    },
    legal: {
      id: 'legal',
      label: 'Legal Services',
      packUrl: 'data/infinity-holdings-pack-legal-v1.json',
      deskSubtitle: 'Legal Support Desk',
      skillsDefault: ['email', 'phone', 'chat']
    },
    medical: {
      id: 'medical',
      label: 'Healthcare & Medical',
      packUrl: 'data/infinity-holdings-pack-medical-v1.json',
      deskSubtitle: 'Patient Support Desk',
      skillsDefault: ['email', 'phone', 'chat']
    }
  };

  var SKILLS = ['email', 'phone', 'chat'];

  function normalizeIndustry(raw) {
    var key = String(raw || 'banking').toLowerCase().trim();
    if (key === 'finance' || key === 'bank' || key === 'financial') return 'banking';
    if (key === 'law' || key === 'legal services') return 'legal';
    if (key === 'health' || key === 'healthcare' || key === 'medico' || key === 'médico') return 'medical';
    return INDUSTRIES[key] ? key : 'banking';
  }

  function industryMeta(raw) {
    return INDUSTRIES[normalizeIndustry(raw)] || INDUSTRIES.banking;
  }

  function packUrl(raw) {
    return industryMeta(raw).packUrl;
  }

  function parseDeskMode(search) {
    var params = search instanceof URLSearchParams ? search : new URLSearchParams(String(search || ''));
    var nexora = params.get('nexora') === '1' || params.get('mode') === 'nexora';
    var preview = params.get('preview') === '1';
    var industry = normalizeIndustry(params.get('industry') || params.get('pack') || 'banking');
    var skillsRaw = String(params.get('skills') || '').toLowerCase();
    var skills = SKILLS.filter(function (s) { return skillsRaw.indexOf(s) >= 0; });
    if (!skills.length) skills = industryMeta(industry).skillsDefault.slice();
    return {
      industry: industry,
      nexoraPractice: nexora,
      preview: preview,
      unscored: nexora || preview,
      skills: skills,
      brand: BRAND,
      meta: industryMeta(industry)
    };
  }

  function applyBrandDom(doc) {
    doc = doc || document;
    try {
      if (doc.title) doc.title = BRAND.deskTitle;
      var h1 = doc.querySelector('#gate h1, .gate h1');
      if (h1) h1.textContent = BRAND.deskTitle;
      var logo = doc.querySelector('.topbar-logo');
      if (logo) logo.textContent = BRAND.name;
      var site = doc.querySelector('.site-logo');
      if (site) site.textContent = BRAND.name;
    } catch (e) { /* ignore */ }
  }

  function holdingsCrmHref(opts) {
    opts = opts || {};
    var base = opts.base || 'kamuk-holdings-crm.html';
    var q = [];
    if (opts.product) q.push('product=' + encodeURIComponent(opts.product));
    if (opts.nexora) q.push('nexora=1');
    if (opts.industry) q.push('industry=' + encodeURIComponent(normalizeIndustry(opts.industry)));
    if (opts.skills && opts.skills.length) q.push('skills=' + encodeURIComponent(opts.skills.join(',')));
    if (opts.preview) q.push('preview=1');
    return base + (q.length ? '?' + q.join('&') : '');
  }

  global.InfinityHoldings = {
    BRAND: BRAND,
    INDUSTRIES: INDUSTRIES,
    SKILLS: SKILLS,
    normalizeIndustry: normalizeIndustry,
    industryMeta: industryMeta,
    packUrl: packUrl,
    parseDeskMode: parseDeskMode,
    applyBrandDom: applyBrandDom,
    holdingsCrmHref: holdingsCrmHref
  };
})(typeof window !== 'undefined' ? window : globalThis);
