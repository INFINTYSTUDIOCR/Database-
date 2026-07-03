/**
 * Alice Premium billing QA
 * Ejecutar: node tests/alice-billing-qa.mjs
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);
const results = [];
function pass(n, d) { results.push({ ok: true, name: n, detail: d }); }
function fail(n, d) { results.push({ ok: false, name: n, detail: d }); }

const Billing = require(path.join(root, 'backend', 'stripe-billing.js'));
const cfg = Billing.publicConfig();
if (cfg.plan === 'alice_premium_30d' && cfg.days === 30) pass('publicConfig', cfg.priceLabel);
else fail('publicConfig', JSON.stringify(cfg));

const server = readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
if (server.includes('/billing/checkout') && server.includes('/billing/webhook')) pass('billing routes', 'ok');
else fail('billing routes', 'missing');

if (server.includes('premiumToken') && server.includes('Billing.isPremiumActive')) pass('premium demo bypass', 'ok');
else fail('premium demo bypass', 'missing');

const tryAlice = readFileSync(path.join(root, 'try-alice.html'), 'utf8');
if (tryAlice.includes('alice-billing.js') && tryAlice.includes('limit-paywall')) pass('try-alice paywall', 'ok');
else fail('try-alice paywall', 'missing');

if (readFileSync(path.join(root, 'js', 'demo-api.js'), 'utf8').includes('demoPremiumFields')) pass('demo-api premium', 'ok');
else fail('demo-api premium', 'missing');

if (existsSync(path.join(root, 'backend', 'stripe-billing.js'))) pass('stripe-billing.js', 'present');
else fail('stripe-billing.js', 'MISSING');

try {
  execSync('node --check "' + path.join(root, 'backend', 'server.js') + '"', { stdio: 'pipe' });
  pass('server syntax', 'OK');
} catch (e) {
  fail('server syntax', String(e.stderr || e.message));
}

const failed = results.filter((r) => !r.ok);
console.log('\n=== Alice Billing QA ===\n');
results.forEach((r) => console.log((r.ok ? '✓' : '✗') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')));
console.log('\n' + results.length + ' checks, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
