/**
 * Capture hero → marquee → next-section background continuity screenshots.
 * Widths: 390, 768, 1024, 1440, 1920
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'reports', 'bg-continuity-20261004');
const WIDTHS = [390, 768, 1024, 1440, 1920];
const PORT = 5179;

function startStaticServer() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
  };
  const server = http.createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function sampleBg(page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const trust = document.querySelector('.trust-strip');
    const know = document.querySelector('.scene-know');
    const hero = document.querySelector('.hero, .hero-section, [data-hero]');
    const sample = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        backgroundImage: (cs.backgroundImage || '').slice(0, 220),
        backgroundAttachment: cs.backgroundAttachment,
      };
    };
    return {
      body: {
        backgroundColor: body.backgroundColor,
        backgroundImage: (body.backgroundImage || '').slice(0, 320),
        backgroundAttachment: body.backgroundAttachment,
      },
      trust: sample(trust),
      know: sample(know),
      hero: sample(hero),
    };
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const notes = [];

  try {
    for (const width of WIDTHS) {
      const height = width <= 768 ? 844 : 900;
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(800);

      const dir = path.join(OUT, String(width));
      fs.mkdirSync(dir, { recursive: true });

      // Hero start
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(dir, '01-hero-start.png'), fullPage: false });

      // Hero end / near marquee
      const trustY = await page.evaluate(() => {
        const el = document.querySelector('.trust-strip');
        if (!el) return Math.round(window.innerHeight * 0.85);
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.round(window.scrollY + r.top - window.innerHeight * 0.35));
      });
      await page.evaluate((y) => window.scrollTo(0, y), trustY);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, '02-hero-end.png'), fullPage: false });

      // Marquee brands strip centered
      const marqueeY = await page.evaluate(() => {
        const el = document.querySelector('.trust-strip');
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.round(window.scrollY + r.top - (window.innerHeight - r.height) / 2));
      });
      await page.evaluate((y) => window.scrollTo(0, y), marqueeY);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, '03-marquee.png'), fullPage: false });

      // Immediate next section (scene-know)
      const knowY = await page.evaluate(() => {
        const el = document.querySelector('.scene-know');
        if (!el) return Math.round(document.body.scrollHeight * 0.35);
        const r = el.getBoundingClientRect();
        return Math.max(0, Math.round(window.scrollY + r.top - 40));
      });
      await page.evaluate((y) => window.scrollTo(0, y), knowY);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, '04-next-section.png'), fullPage: false });

      // Mid-scroll continuity
      const midY = await page.evaluate(() => Math.round(document.body.scrollHeight * 0.42));
      await page.evaluate((y) => window.scrollTo(0, y), midY);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(dir, '05-mid-scroll.png'), fullPage: false });

      const styles = await sampleBg(page);
      notes.push({ width, styles });

      // Pixel luminance probe at post-hero band (center of viewport after marquee shot redo)
      await page.evaluate((y) => window.scrollTo(0, y), marqueeY);
      await page.waitForTimeout(150);
      const probe = await page.evaluate(async () => {
        // Approximate: sample body bg tokens rather than canvas pixels
        const body = getComputedStyle(document.body);
        const img = body.backgroundImage || '';
        const hasDeepRadials =
          img.includes('rgba(123, 77, 255, 0.28)') &&
          img.includes('rgba(255, 138, 0, 0.1)') &&
          img.includes('rgba(123, 77, 255, 0.08)');
        return {
          attachment: body.backgroundAttachment,
          hasDeepRadials,
          softWashOnly: img.includes('160% 120%') && !hasDeepRadials,
        };
      });
      notes[notes.length - 1].probe = probe;

      await context.close();
      console.log(`captured ${width}px`);
    }

    const report = {
      referenceCommit: '48e0833',
      restored: {
        file: 'prototype-cadamag/css/brand.css',
        properties: ['--grad-atmosphere', 'body.background-attachment'],
      },
      outDir: OUT,
      notes,
    };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log('OK', OUT);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
