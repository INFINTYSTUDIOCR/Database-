/**
 * Alice Premium billing QA + pricing + WA bridge
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
if (cfg.plan === 'alice_premium_30d' && cfg.days === 30) pass('publicConfig', cfg.priceLabel + ' · ' + (cfg.activation || 'n/a'));
else fail('publicConfig', JSON.stringify(cfg));

if (cfg.activation === 'whatsapp' && cfg.whatsapp && cfg.whatsapp.includes('wa.me')) pass('whatsapp primary', 'ok');
else fail('whatsapp primary', JSON.stringify({ activation: cfg.activation, wa: cfg.whatsapp }));

if (cfg.crcHint && cfg.crcHint.includes('24.500')) pass('companion price hint', cfg.crcHint);
else fail('companion price hint', cfg.crcHint || 'missing');

if (typeof Billing.manualGrant === 'function' && typeof Billing.restoreByEmail === 'function') pass('manualGrant + restore exports', 'ok');
else fail('manualGrant + restore exports', 'missing');

// In-memory grant/restore
const store = new Map();
async function sbSet(table, id, data) { store.set(table + ':' + id, { id, data }); }
async function sbGetOne(table, id) { return store.get(table + ':' + id) || null; }

const grant = await Billing.manualGrant(sbSet, sbGetOne, { email: 'qa@test.com', source: 'qa' });
if (grant.premiumToken && grant.email === 'qa@test.com' && grant.expiresAt) pass('manualGrant', grant.plan);
else fail('manualGrant', JSON.stringify(grant));

const restored = await Billing.restoreByEmail('qa@test.com', sbGetOne);
if (restored.premiumToken === grant.premiumToken) pass('restoreByEmail', 'token match');
else fail('restoreByEmail', JSON.stringify(restored));

const bad = await Billing.manualGrant(sbSet, sbGetOne, { email: 'not-an-email' });
if (bad.error === 'invalid_email') pass('manualGrant validates email', 'ok');
else fail('manualGrant validates email', JSON.stringify(bad));

const missing = await Billing.restoreByEmail('nobody@test.com', sbGetOne);
if (missing.error === 'not_found') pass('restore not_found', 'ok');
else fail('restore not_found', JSON.stringify(missing));

const active = await Billing.isPremiumActive(grant.premiumToken, sbGetOne);
if (active === true) pass('isPremiumActive', 'true');
else fail('isPremiumActive', String(active));

const server = readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
if (server.includes('/billing/checkout') && server.includes('/billing/webhook')) pass('billing routes', 'ok');
else fail('billing routes', 'missing');

if (server.includes('/billing/manual-grant') && server.includes('/billing/restore')) pass('manual-grant + restore routes', 'ok');
else fail('manual-grant + restore routes', 'missing');

if (server.includes('/billing/wa-outbox') && server.includes('enqueueWhatsApp')) pass('wa-outbox auto-send routes', 'ok');
else fail('wa-outbox auto-send routes', 'missing');

const queued = await Billing.enqueueWhatsApp(sbSet, sbGetOne, {
  phone: '50688887777',
  message: 'hola qa',
  email: 'qa@test.com'
});
if (queued.id && queued.status === 'pending') pass('enqueueWhatsApp', queued.id);
else fail('enqueueWhatsApp', JSON.stringify(queued));

const pendingList = await Billing.listPendingWhatsApp(null, null, sbGetOne);
if (pendingList.some((p) => p.id === queued.id)) pass('listPendingWhatsApp', 'ok');
else fail('listPendingWhatsApp', JSON.stringify(pendingList));

const acked = await Billing.ackWhatsApp(sbSet, sbGetOne, queued.id, 'sent');
if (acked.status === 'sent') pass('ackWhatsApp', 'sent');
else fail('ackWhatsApp', JSON.stringify(acked));

const pendingAfter = await Billing.listPendingWhatsApp(null, null, sbGetOne);
if (!pendingAfter.some((p) => p.id === queued.id)) pass('ack removes pending', 'ok');
else fail('ack removes pending', 'still pending');

if (server.includes('premiumToken') && server.includes('Billing.isPremiumActive')) pass('premium demo bypass', 'ok');
else fail('premium demo bypass', 'missing');

const tryAlice = readFileSync(path.join(root, 'try-alice.html'), 'utf8');
if (tryAlice.includes('alice-billing.js') && tryAlice.includes('limit-paywall')) pass('try-alice paywall', 'ok');
else fail('try-alice paywall', 'missing');

const billingJs = readFileSync(path.join(root, 'js', 'alice-billing.js'), 'utf8');
if (billingJs.includes('restoreAccess') && billingJs.includes('Activar por WhatsApp') || billingJs.includes('waLabel')) {
  pass('alice-billing WhatsApp UI', 'ok');
} else fail('alice-billing WhatsApp UI', 'missing restore/wa');

if (billingJs.includes('/billing/restore')) pass('alice-billing restore endpoint', 'ok');
else fail('alice-billing restore endpoint', 'missing');

if (readFileSync(path.join(root, 'js', 'demo-api.js'), 'utf8').includes('demoPremiumFields')) pass('demo-api premium', 'ok');
else fail('demo-api premium', 'missing');

// Pricing page structure
const pricing = readFileSync(path.join(root, 'pricing.html'), 'utf8');
const priceChecks = [
  ['Foundations', '₡67.500'],
  ['ORT', '₡67.500'],
  ['Jill', '₡12.500'],
  ['Alice tutora', '₡18.500'],
  ['Alice Companion', '₡24.500'],
  ['Nexora Pro', '₡28.500'],
  ['Alice+', '₡49.500'],
  ['TC + 8%', 'TC + 8%'],
  ['Alice tutora ≠ Alice Companion', 'Alice tutora ≠ Alice Companion']
];
let pricingOk = true;
for (const [label, needle] of priceChecks) {
  if (!pricing.includes(needle)) {
    fail('pricing ' + label, 'missing ' + needle);
    pricingOk = false;
  }
}
if (pricingOk) pass('pricing scheme', 'all tiers present');

// Must not advertise fixed USD 175 anymore
if (pricing.includes('USD 175')) fail('pricing no fixed USD 175', 'still present');
else pass('pricing no fixed USD 175', 'ok');

// WA bridge
const bridgeDir = path.join(root, 'scripts', 'wa-bridge');
if (existsSync(path.join(bridgeDir, 'index.js')) && existsSync(path.join(bridgeDir, 'package.json'))) {
  pass('wa-bridge files', 'present');
} else fail('wa-bridge files', 'MISSING');

const bridge = readFileSync(path.join(bridgeDir, 'index.js'), 'utf8');
if (bridge.includes('/billing/wa-outbox') && bridge.includes('sendMessage')) {
  pass('wa-bridge auto-send', 'ok');
} else fail('wa-bridge auto-send', 'incomplete');

if (existsSync(path.join(root, 'WHATSAPP-1-CONFIGURAR.bat')) && existsSync(path.join(root, 'WHATSAPP-2-INICIAR.bat'))) {
  pass('whatsapp bat launchers', 'ok');
} else fail('whatsapp bat launchers', 'missing');

const gitignore = readFileSync(path.join(root, '.gitignore'), 'utf8');
if (gitignore.includes('wa-bridge/.env') && gitignore.includes('.wwebjs_auth')) pass('gitignore wa-bridge secrets', 'ok');
else fail('gitignore wa-bridge secrets', 'incomplete');

try {
  execSync('node --check "' + path.join(root, 'backend', 'server.js') + '"', { stdio: 'pipe' });
  pass('server syntax', 'OK');
} catch (e) {
  fail('server syntax', String(e.stderr || e.message));
}

try {
  execSync('node --check "' + path.join(bridgeDir, 'index.js') + '"', { stdio: 'pipe' });
  pass('wa-bridge syntax', 'OK');
} catch (e) {
  fail('wa-bridge syntax', String(e.stderr || e.message));
}

const failed = results.filter((r) => !r.ok);
console.log('\n=== Alice Billing + Pricing QA ===\n');
results.forEach((r) => console.log((r.ok ? '✓' : '✗') + ' ' + r.name + (r.detail ? ' — ' + r.detail : '')));
console.log('\n' + results.length + ' checks, ' + failed.length + ' failed\n');
process.exit(failed.length ? 1 : 0);
