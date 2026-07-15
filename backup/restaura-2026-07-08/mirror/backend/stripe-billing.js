/**
 * Alice Companion Premium — Stripe Checkout + 30-day pass (Supabase-backed).
 * Foolproof flow: pay → auto-activate token → unlimited Companion.
 * Restore: same email used at checkout.
 */
const crypto = require('crypto');

const PREMIUM_DAYS = parseInt(process.env.ALICE_PREMIUM_DAYS || '30', 10);
/** Default $49 ≈ ₡24.500 Companion monthly. */
const PREMIUM_USD_CENTS = parseInt(process.env.ALICE_PREMIUM_USD_CENTS || '4900', 10);
const PREMIUM_TABLE = 'infinity_sessions';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line global-require
  return require('stripe')(key);
}

function isConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

function premiumRecordId(token) {
  return 'ALICE-PREMIUM-' + String(token || '').trim();
}

function checkoutRecordId(sessionId) {
  return 'ALICE-CHECKOUT-' + String(sessionId || '').trim();
}

function emailRecordId(email) {
  return 'ALICE-EMAIL-' + String(email || '').trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function publicConfig() {
  const usd = PREMIUM_USD_CENTS / 100;
  return {
    enabled: isConfigured(),
    /** Card checkout optional; primary path is WhatsApp + manual/bridge grant. */
    checkoutEnabled: isConfigured(),
    activation: 'whatsapp',
    plan: 'alice_premium_30d',
    product: 'alice_companion',
    days: PREMIUM_DAYS,
    priceUsd: usd,
    priceLabel: 'USD ' + usd.toFixed(usd % 1 ? 2 : 0),
    crcHint: '₡24.500 · Alice Companion 30 días',
    features: [
      'Alice Companion ilimitada (30 días)',
      'Activación por WhatsApp (mismo día)',
      'Voz + micrófono',
      'Recuperá acceso con tu email'
    ],
    whatsapp: 'https://wa.me/50660060981?text=' + encodeURIComponent(
      'Hola! Quiero Alice Companion Premium (₡24.500 / 30 días).\nMi email para activar: '
    )
  };
}

async function readPremium(sbGetOne, token) {
  if (!token) return null;
  try {
    const row = await sbGetOne(PREMIUM_TABLE, premiumRecordId(token));
    return row?.data || null;
  } catch (e) {
    return null;
  }
}

async function isPremiumActive(token, sbGetOne) {
  const rec = await readPremium(sbGetOne, token);
  if (!rec || !rec.expiresAt) return false;
  return Date.now() < new Date(rec.expiresAt).getTime();
}

async function existingGrantForCheckout(sbGetOne, checkoutSessionId) {
  if (!checkoutSessionId || !sbGetOne) return null;
  try {
    const link = await sbGetOne(PREMIUM_TABLE, checkoutRecordId(checkoutSessionId));
    const token = link?.data?.token;
    if (!token) return null;
    const rec = await readPremium(sbGetOne, token);
    if (!rec?.expiresAt) return null;
    if (Date.now() >= new Date(rec.expiresAt).getTime()) return null;
    return rec;
  } catch (e) {
    return null;
  }
}

async function grantPremium(sbSet, { email, stripeSessionId, checkoutSessionId }, sbGetOne) {
  const existing = await existingGrantForCheckout(sbGetOne, checkoutSessionId);
  if (existing) return existing;

  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + PREMIUM_DAYS * 86400000);
  const payload = {
    token,
    email: email ? String(email).trim().toLowerCase() : null,
    plan: 'alice_premium_30d',
    product: 'alice_companion',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    stripeSessionId: stripeSessionId || null
  };
  await sbSet(PREMIUM_TABLE, premiumRecordId(token), payload);
  if (checkoutSessionId) {
    await sbSet(PREMIUM_TABLE, checkoutRecordId(checkoutSessionId), {
      token,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      email: payload.email
    });
  }
  if (payload.email) {
    await sbSet(PREMIUM_TABLE, emailRecordId(payload.email), {
      token,
      expiresAt: expires.toISOString(),
      updatedAt: now.toISOString()
    });
  }
  return payload;
}

async function activateFromCheckout(checkoutSessionId, sbGetOne, sbSet) {
  if (!checkoutSessionId) return { error: 'missing_checkout' };

  const existing = await existingGrantForCheckout(sbGetOne, checkoutSessionId);
  if (existing) {
    return {
      premiumToken: existing.token,
      expiresAt: existing.expiresAt,
      plan: existing.plan || 'alice_premium_30d'
    };
  }

  const stripe = getStripe();
  if (!stripe) return { error: 'billing_unconfigured' };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  } catch (e) {
    return { error: 'invalid_checkout' };
  }
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { error: 'payment_pending' };
  }

  const granted = await grantPremium(sbSet, {
    email: session.customer_details?.email || session.customer_email,
    stripeSessionId: session.id,
    checkoutSessionId: session.id
  }, sbGetOne);

  return {
    premiumToken: granted.token,
    expiresAt: granted.expiresAt,
    plan: granted.plan
  };
}

async function restoreByEmail(email, sbGetOne) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return { error: 'invalid_email' };
  try {
    const row = await sbGetOne(PREMIUM_TABLE, emailRecordId(normalized));
    const token = row?.data?.token;
    if (!token) return { error: 'not_found' };
    const active = await isPremiumActive(token, sbGetOne);
    if (!active) return { error: 'expired' };
    const rec = await readPremium(sbGetOne, token);
    return {
      premiumToken: token,
      expiresAt: rec?.expiresAt || row.data.expiresAt,
      plan: 'alice_premium_30d'
    };
  } catch (e) {
    return { error: 'restore_failed' };
  }
}

/**
 * Manual / WhatsApp bridge activation (no Stripe).
 * Always issues a fresh 30-day pass for the email (restore works with that email).
 */
async function manualGrant(sbSet, sbGetOne, { email, days, source } = {}) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return { error: 'invalid_email' };

  const token = generateToken();
  const now = new Date();
  const grantDays = Math.min(365, Math.max(1, parseInt(days, 10) || PREMIUM_DAYS));
  const expires = new Date(now.getTime() + grantDays * 86400000);
  const payload = {
    token,
    email: normalized,
    plan: 'alice_premium_30d',
    product: 'alice_companion',
    source: source || 'whatsapp_manual',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    stripeSessionId: null
  };
  await sbSet(PREMIUM_TABLE, premiumRecordId(token), payload);
  await sbSet(PREMIUM_TABLE, emailRecordId(normalized), {
    token,
    expiresAt: expires.toISOString(),
    updatedAt: now.toISOString(),
    source: payload.source
  });
  return {
    premiumToken: token,
    expiresAt: payload.expiresAt,
    plan: payload.plan,
    email: normalized,
    days: grantDays,
    product: 'alice_companion'
  };
}

const WA_OUTBOX_ID = 'ALICE-WA-OUTBOX';

function waMsgId() {
  return 'ALICE-WA-MSG-' + crypto.randomBytes(8).toString('hex');
}

function clientActivationMessage(email, expiresAt, clientUrl) {
  const url = clientUrl || 'https://studioinfinitycr.com/try-alice.html';
  const hasta = expiresAt ? new Date(expiresAt).toLocaleDateString('es-CR') : '30 días';
  return (
    'Listo! Alice Companion ya esta activa.\n\n' +
    '1. Entra aqui: ' + url + '\n' +
    '2. Toca: Ya me activaron — entrar con mi email\n' +
    '3. Escribe este email: ' + email + '\n\n' +
    'Valido hasta: ' + hasta + '\n' +
    'Cualquier duda, escribime aqui.'
  );
}

/** Single-row outbox so the PC bridge always finds pending messages. */
async function readOutbox(sbGetOne) {
  const row = await sbGetOne(PREMIUM_TABLE, WA_OUTBOX_ID);
  const items = Array.isArray(row?.data?.items) ? row.data.items : [];
  return items;
}

async function writeOutbox(sbSet, items) {
  await sbSet(PREMIUM_TABLE, WA_OUTBOX_ID, {
    items: (items || []).slice(-80),
    updatedAt: new Date().toISOString()
  });
}

/** Queue WhatsApp text for the PC bridge to send automatically. */
async function enqueueWhatsApp(sbSet, sbGetOne, { phone, message, email }) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return { error: 'invalid_phone' };
  if (!message || !String(message).trim()) return { error: 'invalid_message' };
  const id = waMsgId();
  const now = new Date().toISOString();
  const item = {
    id,
    phone: digits,
    message: String(message).trim(),
    email: email ? String(email).trim().toLowerCase() : null,
    status: 'pending',
    createdAt: now
  };
  const items = await readOutbox(sbGetOne);
  items.push(item);
  await writeOutbox(sbSet, items);
  return { id, phone: digits, status: 'pending' };
}

async function listPendingWhatsApp(_sbGet, _sbQuery, sbGetOne) {
  const items = await readOutbox(sbGetOne);
  return items
    .filter((i) => i && i.status === 'pending' && i.phone && i.message)
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
}

async function ackWhatsApp(sbSet, sbGetOne, id, status) {
  const key = String(id || '').trim();
  if (!key.startsWith('ALICE-WA-MSG-')) return { error: 'invalid_id' };
  const items = await readOutbox(sbGetOne);
  let found = false;
  const nextStatus = status === 'failed' ? 'failed' : 'sent';
  const next = items.map((i) => {
    if (i.id !== key) return i;
    found = true;
    return { ...i, status: nextStatus, finishedAt: new Date().toISOString() };
  });
  if (!found) return { error: 'not_found' };
  await writeOutbox(sbSet, next);
  return { id: key, status: nextStatus };
}

async function createCheckoutSession({ email, successUrl, cancelUrl }) {
  const stripe = getStripe();
  if (!stripe) return { error: 'billing_unconfigured' };

  const priceId = process.env.STRIPE_PRICE_ALICE_PREMIUM;
  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [{
      price_data: {
        currency: (process.env.ALICE_PREMIUM_CURRENCY || 'usd').toLowerCase(),
        unit_amount: PREMIUM_USD_CENTS,
        product_data: {
          name: 'Alice Companion Premium — 30 días',
          description: 'Práctica de inglés ilimitada por voz. Infinity Studio CR.',
          images: process.env.ALICE_PREMIUM_IMAGE ? [process.env.ALICE_PREMIUM_IMAGE] : undefined
        }
      },
      quantity: 1
    }];

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email: email || undefined,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { product: 'alice_premium_30d' }
  });

  return { url: session.url, checkoutSessionId: session.id };
}

async function handleWebhook(rawBody, signature, sbSet, sbGetOne) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return { error: 'webhook_unconfigured', status: 503 };

  const stripe = getStripe();
  if (!stripe) return { error: 'billing_unconfigured', status: 503 };

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    return { error: 'invalid_signature', status: 400 };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.metadata?.product === 'alice_premium_30d' || session.mode === 'payment') {
      await grantPremium(sbSet, {
        email: session.customer_details?.email || session.customer_email,
        stripeSessionId: session.id,
        checkoutSessionId: session.id
      }, sbGetOne);
    }
  }

  return { received: true, status: 200 };
}

module.exports = {
  publicConfig,
  isConfigured,
  isPremiumActive,
  createCheckoutSession,
  activateFromCheckout,
  restoreByEmail,
  manualGrant,
  enqueueWhatsApp,
  listPendingWhatsApp,
  ackWhatsApp,
  clientActivationMessage,
  handleWebhook,
  grantPremium,
  PREMIUM_DAYS,
  PREMIUM_USD_CENTS
};
