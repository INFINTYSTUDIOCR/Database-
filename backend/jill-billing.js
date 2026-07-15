/**
 * Jill Modo Libre Premium ù Stripe Checkout standby (clone Alice Modo Libre pattern).
 * Plug: STRIPE_SECRET_KEY + STRIPE_PRICE_JILL_PRO + STRIPE_WEBHOOK_SECRET (optional separate webhook route).
 * Until configured: WhatsApp + manual grant only.
 */
const crypto = require('crypto');

const PREMIUM_DAYS = parseInt(process.env.JILL_PRO_PREMIUM_DAYS || '30', 10);
/** Default $25 / 12.500 CRC Jill Modo Libre monthly. */
const PREMIUM_USD_CENTS = parseInt(process.env.JILL_PRO_PREMIUM_USD_CENTS || '2500', 10);
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
  return 'JILL-PRO-PREMIUM-' + String(token || '').trim();
}

function checkoutRecordId(sessionId) {
  return 'JILL-PRO-CHECKOUT-' + String(sessionId || '').trim();
}

function emailRecordId(email) {
  return 'JILL-PRO-EMAIL-' + String(email || '').trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function publicConfig() {
  const usd = PREMIUM_USD_CENTS / 100;
  const stripeReady = isConfigured();
  return {
    enabled: stripeReady,
    checkoutEnabled: stripeReady && !!(process.env.STRIPE_PRICE_JILL_PRO || PREMIUM_USD_CENTS),
    standby: !stripeReady,
    activation: 'whatsapp',
    plan: 'jill_pro_premium_30d',
    product: 'jill_pro',
    days: PREMIUM_DAYS,
    priceUsd: usd,
    priceLabel: 'USD ' + usd.toFixed(usd % 1 ? 2 : 0),
    crcHint: '?12.500 ù Jill Modo Libre 30 dùas',
    features: [
      'Jill Modo Libre ilimitada (30 dùas)',
      'Modo libre ? lecciùn MSI (regla + canon + prùctica)',
      'Activaciùn por WhatsApp (mismo dùa)',
      'Voz + micrùfono',
      'Recuperù acceso con tu email'
    ],
    whatsapp: 'https://wa.me/50660060981?text=' + encodeURIComponent(
      'Hola! Quiero Jill Modo Libre Premium (12.500 CRC / 30 dùas).\nMi email para activar: '
    ),
    plugEnv: [
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_JILL_PRO (optional)',
      'JILL_PRO_PREMIUM_USD_CENTS',
      'STRIPE_WEBHOOK_SECRET'
    ]
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
  if (!checkoutSessionId) return null;
  try {
    const row = await sbGetOne(PREMIUM_TABLE, checkoutRecordId(checkoutSessionId));
    if (!row?.data?.token) return null;
    const rec = await readPremium(sbGetOne, row.data.token);
    return rec || null;
  } catch (e) {
    return null;
  }
}

async function grantPremium(sbSet, payload, sbGetOne) {
  const token = payload.token || generateToken();
  const now = new Date();
  const grantDays = Math.min(365, Math.max(1, parseInt(payload.days, 10) || PREMIUM_DAYS));
  const expires = payload.expiresAt ? new Date(payload.expiresAt) : new Date(now.getTime() + grantDays * 86400000);
  const record = {
    token,
    email: payload.email ? String(payload.email).trim().toLowerCase() : null,
    plan: 'jill_pro_premium_30d',
    product: 'jill_pro',
    source: payload.source || 'stripe',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    stripeSessionId: payload.stripeSessionId || payload.checkoutSessionId || null
  };
  await sbSet(PREMIUM_TABLE, premiumRecordId(token), record);
  if (record.stripeSessionId) {
    await sbSet(PREMIUM_TABLE, checkoutRecordId(record.stripeSessionId), {
      token,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      email: record.email
    });
  }
  if (record.email) {
    await sbSet(PREMIUM_TABLE, emailRecordId(record.email), {
      token,
      expiresAt: expires.toISOString(),
      updatedAt: now.toISOString()
    });
  }
  return record;
}

async function activateFromCheckout(checkoutSessionId, sbGetOne, sbSet) {
  if (!checkoutSessionId) return { error: 'missing_checkout' };

  const existing = await existingGrantForCheckout(sbGetOne, checkoutSessionId);
  if (existing) {
    return {
      premiumToken: existing.token,
      expiresAt: existing.expiresAt,
      plan: existing.plan || 'jill_pro_premium_30d'
    };
  }

  const stripe = getStripe();
  if (!stripe) return { error: 'billing_unconfigured', standby: true };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  } catch (e) {
    return { error: 'invalid_checkout' };
  }
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { error: 'payment_pending' };
  }
  if (session.metadata?.product && session.metadata.product !== 'jill_pro_premium_30d') {
    return { error: 'wrong_product' };
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
      plan: 'jill_pro_premium_30d'
    };
  } catch (e) {
    return { error: 'restore_failed' };
  }
}

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
    plan: 'jill_pro_premium_30d',
    product: 'jill_pro',
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
    product: 'jill_pro'
  };
}

function clientActivationMessage(email, expiresAt, clientUrl) {
  const url = clientUrl || 'https://studioinfinitycr.com/Infinity_Student_Portal.html';
  const hasta = expiresAt ? new Date(expiresAt).toLocaleDateString('es-CR') : '30 dùas';
  return (
    'Listo! Jill Modo Libre ya esta activa.\n\n' +
    '1. Entra al portal: ' + url + '\n' +
    '2. Toca: Ya me activaron ù entrar con mi email\n' +
    '3. Escribe este email: ' + email + '\n\n' +
    'Valido hasta: ' + hasta + '\n' +
    'Cualquier duda, escribime aqui.'
  );
}

async function createCheckoutSession({ email, successUrl, cancelUrl }) {
  const stripe = getStripe();
  if (!stripe) {
    return {
      error: 'billing_unconfigured',
      standby: true,
      message: 'Card checkout not connected yet. Contact us on WhatsApp.',
      ...publicConfig()
    };
  }

  const priceId = process.env.STRIPE_PRICE_JILL_PRO;
  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [{
      price_data: {
        currency: (process.env.JILL_PRO_PREMIUM_CURRENCY || 'usd').toLowerCase(),
        unit_amount: PREMIUM_USD_CENTS,
        product_data: {
          name: 'Jill Modo Libre Premium ù 30 dùas',
          description: 'Foundations Companion: charla libre + lecciones MSI. Infinity Studio CR.',
          images: process.env.JILL_PRO_PREMIUM_IMAGE ? [process.env.JILL_PRO_PREMIUM_IMAGE] : undefined
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
    metadata: { product: 'jill_pro_premium_30d' }
  });

  return { url: session.url, checkoutSessionId: session.id };
}

module.exports = {
  publicConfig,
  isConfigured,
  isPremiumActive,
  readPremium,
  createCheckoutSession,
  activateFromCheckout,
  restoreByEmail,
  manualGrant,
  grantPremium,
  clientActivationMessage,
  premiumRecordId
};
