/**
 * Summarize a Lighthouse JSON report (lab metrics).
 * Usage: node scripts/summarize-lighthouse.js path/to/report.json
 */
const fs = require('fs');
const path = process.argv[2];
if (!path || !fs.existsSync(path)) {
  console.error('Usage: node scripts/summarize-lighthouse.js <report.json>');
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(path, 'utf8'));
const cats = r.categories || {};
const a = r.audits || {};
const ms = (id) => (a[id] && a[id].numericValue != null ? Math.round(a[id].numericValue) : null);
const score = (id) => (cats[id] && cats[id].score != null ? Math.round(cats[id].score * 100) : null);

const opportunities = Object.values(a)
  .filter((x) => x.details && x.details.type === 'opportunity' && x.score != null && x.score < 1)
  .map((x) => ({
    id: x.id,
    title: x.title,
    savingsMs: x.numericValue != null ? Math.round(x.numericValue) : null,
    score: x.score
  }))
  .sort((x, y) => (y.savingsMs || 0) - (x.savingsMs || 0))
  .slice(0, 15);

const diagnostics = Object.values(a)
  .filter((x) => x.scoreDisplayMode === 'informative' || (x.score != null && x.score < 1 && x.details && x.details.type === 'table'))
  .filter((x) => ['render-blocking-resources', 'unused-javascript', 'unused-css-rules', 'uses-responsive-images', 'offscreen-images', 'unminified-javascript', 'unminified-css', 'uses-text-compression', 'uses-long-cache-ttl', 'dom-size', 'bootup-time', 'mainthread-work-breakdown', 'font-display', 'lcp-lazy-loaded', 'prioritize-lcp-image', 'cls-culprits-insight', 'layout-shifts', 'total-byte-weight', 'third-party-summary', 'bf-cache', 'color-contrast', 'button-name', 'link-name', 'image-alt', 'meta-description', 'document-title', 'hreflang', 'canonical', 'crawlable-anchors', 'is-crawlable', 'robots-txt', 'tap-targets', 'viewport'].includes(x.id) || (x.score != null && x.score < 1 && ['accessibility', 'best-practices', 'seo'].some(() => false)))
  .map((x) => ({ id: x.id, title: x.title, score: x.score }));

const failedA11y = Object.values(a)
  .filter((x) => x.scoreDisplayMode === 'binary' && x.score === 0)
  .map((x) => ({ id: x.id, title: x.title }));

const out = {
  source: 'Lighthouse LOCAL lab (NOT Google PageSpeed Insights field data)',
  fetchTime: r.fetchTime,
  finalUrl: r.finalUrl,
  lighthouseVersion: r.lighthouseVersion,
  formFactor: r.configSettings && r.configSettings.formFactor,
  categories: {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo')
  },
  metrics: {
    FCP_ms: ms('first-contentful-paint'),
    LCP_ms: ms('largest-contentful-paint'),
    SI_ms: ms('speed-index'),
    TBT_ms: ms('total-blocking-time'),
    CLS: a['cumulative-layout-shift'] ? a['cumulative-layout-shift'].numericValue : null,
    INP_ms: ms('interaction-to-next-paint'),
    TTI_ms: ms('interactive'),
    maxPotentialFID_ms: ms('max-potential-fid')
  },
  lcpElement: a['largest-contentful-paint-element'] && a['largest-contentful-paint-element'].details
    ? a['largest-contentful-paint-element'].details
    : null,
  opportunities,
  failedAudits: failedA11y.slice(0, 40)
};

console.log(JSON.stringify(out, null, 2));
fs.writeFileSync(path.replace(/\.report\.json$/, '.summary.json').replace(/\.json$/, '.summary.json'), JSON.stringify(out, null, 2));
