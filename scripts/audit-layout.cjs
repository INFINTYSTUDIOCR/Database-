/**
 * Layout audit — container axes, overflow, overlaps across public routes.
 * Viewports: 360, 375, 390, 768, 1024, 1280, 1440, 1920
 *
 * Usage: node scripts/audit-layout.mjs [baseUrl]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:57736';
const OUT = path.resolve('scripts/audit-layout-report.json');
const VIEWPORTS = [
  { w: 360, h: 740 },
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 }
];

const ROUTES = [
  '/',
  '/foundations.html',
  '/ort.html',
  '/pricing.html',
  '/alice.html',
  '/jill.html',
  '/claire.html',
  '/nexora.html',
  '/training-book.html',
  '/para-quien.html',
  '/hablemos.html',
  '/diagnostico.html',
  '/casos-de-exito.html',
  '/job-finder.html',
  '/portal-access.html'
];

async function measurePage(page) {
  return page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    /* Real overflow = user can pan horizontally (ignore clipped off-canvas UI) */
    const beforeX = window.scrollX;
    window.scrollTo(Math.max(0, scrollW - docW), window.scrollY);
    const scrolledX = Math.abs(window.scrollX - beforeX) > 1;
    window.scrollTo(beforeX, window.scrollY);
    const bodyClip =
      getComputedStyle(document.body).overflowX === 'hidden' ||
      getComputedStyle(document.documentElement).overflowX === 'hidden' ||
      getComputedStyle(document.documentElement).overflowX === 'clip';
    /* Prefer real pan capability; clipped pages are not user-facing overflow */
    const overflowX = scrolledX;

    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        sel,
        left: +r.left.toFixed(1),
        right: +r.right.toFixed(1),
        width: +r.width.toFixed(1),
        top: +r.top.toFixed(1),
        padL: cs.paddingLeft,
        padR: cs.paddingRight
      };
    };

    const header = pick('.header-inner');
    const hero = pick('.hero-shell');
    const pageShell = pick('.page-shell');
    const footer = pick('.site-footer-inner');
    const know = pick('.scene-know-shell');
    const routes = pick('.scene-routes-shell');
    const eco = pick('.scene-eco-shell');
    const results = pick('.scene-results-shell');

    const lefts = [header, hero, pageShell, footer, know, routes, eco, results]
      .filter(Boolean)
      .map((b) => Math.round(b.left));
    const uniqueLefts = [...new Set(lefts)];

    const woman = document.querySelector('.woman-wrapper, .hero-person');
    const dash = document.querySelector('.dash, .dashboard-wrapper');
    let heroGap = null;
    if (woman && dash && window.innerWidth > 768) {
      const w = woman.getBoundingClientRect();
      const d = dash.getBoundingClientRect();
      heroGap = +(d.left - w.right).toFixed(1);
    }

    /* Edge bleed ignores intentional motion/marquee/off-canvas nav */
    const offenders = [];
    document.querySelectorAll('main > *, .page-shell > *, .hero-shell > *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (r.right > docW + 2 || r.left < -2) {
        if (
          el.closest(
            '.woman-wrapper, .dash, .dashboard-wrapper, .hero-visual-stage, .alice-float, .kpi-chip, .marquee-track, .nav-center, .know-reveal, .routes-reveal, .results-reveal, .eco-reveal, [data-reveal], .enter-person'
          )
        ) {
          return;
        }
        const t = getComputedStyle(el).transform;
        if (t && t !== 'none') return; /* motion offset */
        if (offenders.length < 12) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && String(el.className).slice(0, 48)) || '',
            left: +r.left.toFixed(1),
            right: +r.right.toFixed(1)
          });
        }
      }
    });

    return {
      overflowX,
      scrollW,
      docW,
      layout: document.body.getAttribute('data-layout'),
      header,
      hero,
      pageShell,
      footer,
      know,
      routes,
      eco,
      results,
      uniqueLefts,
      leftSpread: uniqueLefts.length ? Math.max(...uniqueLefts) - Math.min(...uniqueLefts) : 0,
      heroGap,
      offenders
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = { base: BASE, at: new Date().toISOString(), viewports: {}, failures: [] };

  for (const vp of VIEWPORTS) {
    const key = `${vp.w}x${vp.h}`;
    report.viewports[key] = {};
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = BASE.replace(/\/$/, '') + route;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(400);
        const m = await measurePage(page);
        report.viewports[key][route] = m;

        if (m.overflowX) {
          report.failures.push({ vp: key, route, issue: 'overflow-x', scrollW: m.scrollW, docW: m.docW });
        }
        if (route === '/' && vp.w >= 1024 && m.header && m.hero) {
          const d = Math.abs(m.header.left - m.hero.left);
          if (d > 2) report.failures.push({ vp: key, route, issue: 'header-hero-axis', delta: d });
        }
        if (route === '/' && vp.w >= 1024 && m.header && m.footer) {
          const d = Math.abs(m.header.left - m.footer.left);
          if (d > 2) report.failures.push({ vp: key, route, issue: 'header-footer-axis', delta: d });
        }
        if (route !== '/' && vp.w >= 1024 && m.header && m.pageShell) {
          const d = Math.abs(m.header.left - m.pageShell.left);
          if (d > 2) report.failures.push({ vp: key, route, issue: 'header-page-axis', delta: d });
        }
        if (m.offenders.length) {
          report.failures.push({
            vp: key,
            route,
            issue: 'edge-bleed',
            count: m.offenders.length,
            sample: m.offenders[0]
          });
        }
      } catch (err) {
        report.failures.push({ vp: key, route, issue: 'nav-error', message: String(err.message || err) });
      }
    }
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('wrote', OUT);
  console.log('failures', report.failures.length);
  if (report.failures.length) {
    console.log(JSON.stringify(report.failures.slice(0, 50), null, 2));
    process.exitCode = 1;
  } else {
    console.log('ok — no overflow / axis failures');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
