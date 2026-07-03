/**
 * Alice Premium — Stripe Checkout + 30-day pass (Supabase-backed).
 */
const crypto = require('crypto');

const PREMIUM_DAYS = parseInt(process.env.ALICE_PREMIUM_DAYS || '30', 10);
const PREMIUM_USD_CENTS = parseInt(process.env.ALICE_PREMIUM_USD_CENTS || '1999', 10);
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

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function publicConfig() {
  const usd = PREMIUM_USD_CENTS / 100;
  return {
    enabled: isConfigured(),
    plan: 'alice_premium_30d',
    days: PREMIUM_DAYS,
    priceUsd: usd,
    priceLabel: '$' + usd.toFixed(2),
    crcHint: '≈ ₡67.500 valor programa',
    features: [
      'Unlimited Alice Companion chat (30 days)',
      'No daily demo session cap',
      'Voice + mic practice',
      'Progress saved on this device'
    ],
    whatsapp: 'https://wa.me/50660060981?text=' + encodeURIComponent('Hola! Quiero Alice Premium')
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

async function grantPremium(sbSet, { email, stripeSessionId, checkoutSessionId }) {
  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + PREMIUM_DAYS * 86400000);
  const payload = {
    token,
    email: email || null,
    plan: 'alice_premium_30d',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    stripeSessionId: stripeSessionId || null
  };
  await sbSet(PREMIUM_TABLE, premiumRecordId(token), payload);
  if (checkoutSessionId) {
    await sbSet(PREMIUM_TABLE, checkoutRecordId(checkoutSessionId), {
      token,
      activatedAt: now.toISOString(),
      expiresAt: expires.toISOString()
    });
  }
  return payload;
}

async function activateFromCheckout(checkoutSessionId, sbGetOne, sbSet) {
  if (!checkoutSessionId) return { error: 'missing_checkout' };
  const link = await sbGetOne(PREMIUM_TABLE, checkoutRecordId(checkoutSessionId));
  if (link?.data?.token) {
    const active = await isPremiumActive(link.data.token, sbGetOne);
    if (active) {
      return {
        premiumToken: link.data.token,
        expiresAt: link.data.expiresAt,
        plan: 'alice_premium_30d'
      };
    }
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
  });
  return {
    premiumToken: granted.token,
    expiresAt: granted.expiresAt,
    plan: granted.plan
  };
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
          name: 'Alice Companion Premium — 30 days unlimited',
          description: 'Unlimited free-flow English conversation with voice. Infinity Studio CR.',
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

async function handleWebhook(rawBody, signature, sbSet) {
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
      });
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
  handleWebhook,
  grantPremium,
  PREMIUM_DAYS,
  PREMIUM_USD_CENTS
};
