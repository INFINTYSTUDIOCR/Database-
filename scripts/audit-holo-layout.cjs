/**
 * Keyword holo layout-shift audit (Playwright).
 * Measures hero title / subtitle / CTAs before, during, and after scramble.
 * Viewports: 360, 375, 390, 768, 1024, 1280, 1440, 1920
 *
 * Usage: node scripts/audit-holo-layout.cjs [baseUrl]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.resolve('scripts/audit-holo-layout-report.json');
const VIEWPORTS = [360, 375, 390, 768, 1024, 1280, 1440, 1920];
const MAX_JUMP_PX = 1;
const SAMPLE_MS = 80;
const WATCH_AFTER_MS = 3200;

function pickMetrics(snapshot) {
  return {
    titleTop: snapshot.title?.top ?? null,
    titleHeight: snapshot.title?.height ?? null,
    titleBottom: snapshot.title?.bottom ?? null,
    subtitleTop: snapshot.subtitle?.top ?? null,
    leadTop: snapshot.lead?.top ?? null,
    actionsTop: snapshot.actions?.top ?? null,
    keywordWidth: snapshot.keyword?.width ?? null,
    keywordHeight: snapshot.keyword?.height ?? null,
    keywordOverflow: snapshot.keywordOverflow ?? false,
    pageOverflowX: snapshot.pageOverflowX ?? false,
    layered: snapshot.layered ?? false,
    ariaLabel: snapshot.ariaLabel ?? null,
    liveAriaHidden: snapshot.liveAriaHidden ?? null,
    decoding: snapshot.decoding ?? false
  };
}

async function sample(page) {
  return page.evaluate(() => {
    const title = document.getElementById('hero-title');
    const subtitle = document.querySelector('.hero-sub');
    const lead = document.querySelector('.hero-sub');
    const actions = document.querySelector('.hero-ctas');
    const keyword = title && title.querySelector('.holo-keyword');
    const live = keyword && keyword.querySelector('.holo-keyword-live');
    const sizer = keyword && keyword.querySelector('.holo-keyword-sizer');

    /* Layout geometry ignoring CSS transforms (hero entrance uses translateY) */
    const layoutTop = (el) => {
      if (!el) return null;
      let y = 0;
      let n = el;
      while (n) {
        y += n.offsetTop;
        n = n.offsetParent;
      }
      return +y.toFixed(2);
    };

    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const topLayout = layoutTop(el);
      return {
        top: topLayout,
        bottom: +(topLayout + el.offsetHeight).toFixed(2),
        left: +r.left.toFixed(2),
        right: +r.right.toFixed(2),
        width: +el.offsetWidth.toFixed(2),
        height: +el.offsetHeight.toFixed(2),
        visualTop: +r.top.toFixed(2)
      };
    };

    const kwBox = keyword ? keyword.getBoundingClientRect() : null;
    const liveBox = live ? live.getBoundingClientRect() : null;
    let keywordOverflow = false;
    if (kwBox && liveBox) {
      /* Horizontal overflow outside keyword is a failure; vertical sub-pixel ok */
      keywordOverflow =
        liveBox.left < kwBox.left - 1 || liveBox.right > kwBox.right + 1;
    }

    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    const beforeX = window.scrollX;
    window.scrollTo(Math.max(0, scrollW - docW), window.scrollY);
    const pageOverflowX = Math.abs(window.scrollX - beforeX) > 1;
    window.scrollTo(beforeX, window.scrollY);

    return {
      title: box(title),
      subtitle: box(subtitle),
      lead: box(lead),
      actions: box(actions),
      keyword: box(keyword),
      keywordOverflow,
      pageOverflowX,
      layered: !!(sizer && live),
      ariaLabel: keyword ? keyword.getAttribute('aria-label') : null,
      liveAriaHidden: live ? live.getAttribute('aria-hidden') : null,
      sizerAriaHidden: sizer ? sizer.getAttribute('aria-hidden') : null,
      decoding: !!(keyword && keyword.classList.contains('is-decoding')),
      holoStarted: title ? title.getAttribute('data-holo-started') : null
    };
  });
}

function maxDelta(samples, key) {
  const vals = samples.map((s) => s[key]).filter((v) => typeof v === 'number');
  if (vals.length < 2) return 0;
  return +(Math.max(...vals) - Math.min(...vals)).toFixed(2);
}

async function auditViewport(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 812 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  const url = BASE.replace(/\/$/, '') + '/';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#hero-title .holo-keyword', { timeout: 10000 });

  /* Wait for webfonts + layered keyword structure */
  await page.waitForFunction(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const kw = document.querySelector('#hero-title .holo-keyword');
    return !!(
      kw &&
      kw.querySelector('.holo-keyword-sizer') &&
      kw.querySelector('.holo-keyword-live') &&
      kw.getAttribute('data-holo-locked') === '1'
    );
  }, { timeout: 10000 });

  /* Prefer sampling while decode is active, then through settle */
  try {
    await page.waitForFunction(() => {
      const kw = document.querySelector('#hero-title .holo-keyword');
      return kw && (kw.classList.contains('is-decoding') || kw.classList.contains('is-sharp'));
    }, { timeout: 4000 });
  } catch (e) { /* continue anyway */ }

  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < WATCH_AFTER_MS) {
    samples.push(pickMetrics(await sample(page)));
    await page.waitForTimeout(SAMPLE_MS);
  }

  /* Extra wait + samples to catch accidental restarts */
  await page.waitForTimeout(1500);
  const afterRestartCheck = [];
  for (let i = 0; i < 8; i++) {
    afterRestartCheck.push(pickMetrics(await sample(page)));
    await page.waitForTimeout(120);
  }

  const restartDecoding = afterRestartCheck.some((s) => s.decoding);

  const deltas = {
    titleHeight: maxDelta(samples, 'titleHeight'),
    titleTop: maxDelta(samples, 'titleTop'),
    titleBottom: maxDelta(samples, 'titleBottom'),
    subtitleTop: maxDelta(samples, 'subtitleTop'),
    leadTop: maxDelta(samples, 'leadTop'),
    actionsTop: maxDelta(samples, 'actionsTop'),
    keywordWidth: maxDelta(samples, 'keywordWidth'),
    keywordHeight: maxDelta(samples, 'keywordHeight')
  };

  const first = samples[0] || {};
  const failures = [];
  if (deltas.titleHeight > MAX_JUMP_PX) {
    failures.push({ issue: 'title-height-change', delta: deltas.titleHeight });
  }
  ['subtitleTop', 'leadTop', 'actionsTop', 'titleTop', 'titleBottom'].forEach((k) => {
    if (deltas[k] > MAX_JUMP_PX) failures.push({ issue: `${k}-jump`, delta: deltas[k] });
  });
  if (deltas.keywordWidth > MAX_JUMP_PX) {
    failures.push({ issue: 'keyword-width-change', delta: deltas.keywordWidth });
  }
  if (samples.some((s) => s.pageOverflowX)) failures.push({ issue: 'page-overflow-x' });
  if (samples.some((s) => s.keywordOverflow)) failures.push({ issue: 'glyph-overflow-keyword' });
  if (!first.layered) failures.push({ issue: 'missing-sizer-overlay' });
  if (first.liveAriaHidden !== 'true') failures.push({ issue: 'live-aria-hidden', got: first.liveAriaHidden });
  if (first.sizerAriaHidden === 'true') failures.push({ issue: 'sizer-aria-hidden' });
  if (restartDecoding) failures.push({ issue: 'animation-restart' });

  const sizerWord = await page.evaluate(() => {
    const s = document.querySelector('#hero-title .holo-keyword-sizer');
    return s ? (s.textContent || '').trim() : '';
  });
  if (sizerWord !== 'blanco') failures.push({ issue: 'sizer-word', got: sizerWord });

  await context.close();
  return {
    viewport: width,
    deltas,
    sampleCount: samples.length,
    first,
    last: samples[samples.length - 1],
    restartDecoding,
    failures
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = {
    base: BASE,
    at: new Date().toISOString(),
    maxJumpPx: MAX_JUMP_PX,
    viewports: {},
    failures: []
  };

  for (const w of VIEWPORTS) {
    const result = await auditViewport(browser, w);
    report.viewports[String(w)] = result;
    result.failures.forEach((f) => {
      report.failures.push(Object.assign({ viewport: w }, f));
    });
    const status = result.failures.length ? 'FAIL' : 'PASS';
    console.log(
      `${status} ${w}px | ΔtitleH=${result.deltas.titleHeight} ΔactionsY=${result.deltas.actionsTop} ΔkwW=${result.deltas.keywordWidth}`
    );
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log('wrote', OUT);
  console.log('failures', report.failures.length);
  if (report.failures.length) {
    console.log(JSON.stringify(report.failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log('ok — zero geometry jump across viewports');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
