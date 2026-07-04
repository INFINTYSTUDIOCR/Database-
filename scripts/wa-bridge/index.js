/**
 * Infinity WhatsApp Bridge
 * Runs on your PC (WhatsApp always open). You type in any chat:
 *   /activar correo@cliente.com
 * Engine grants Alice Companion 30 days and replies with instructions.
 */
require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const BACKEND_URL = (process.env.BACKEND_URL || 'https://alice-by-infinity.onrender.com').replace(/\/$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || process.env.ANALYZE_SECRET || '';
const CLIENT_URL = process.env.CLIENT_URL || 'https://studioinfinitycr.com/try-alice.html';
const ALLOWED = String(process.env.ALLOWED_NUMBERS || '')
  .split(',')
  .map((n) => n.replace(/\D/g, ''))
  .filter(Boolean);

if (!BRIDGE_SECRET) {
  console.error('Falta BRIDGE_SECRET en scripts/wa-bridge/.env (mismo valor que ANALYZE_SECRET en Render).');
  process.exit(1);
}
if (!ALLOWED.length) {
  console.error('Falta ALLOWED_NUMBERS en .env (tu número, ej. 50660060981).');
  process.exit(1);
}

function senderDigits(msg) {
  const from = (msg.author || msg.from || '').split('@')[0] || '';
  return from.replace(/\D/g, '');
}

function isAllowed(msg) {
  const digits = senderDigits(msg);
  return ALLOWED.some((n) => digits === n || digits.endsWith(n) || n.endsWith(digits));
}

function parseCommand(body) {
  const text = String(body || '').trim();
  const help = /^(?:\/)?(?:ayuda|help|comandos)\s*$/i.test(text);
  if (help) return { cmd: 'help' };

  const m = text.match(/^(?:\/)?activar(?:\s+companion)?\s+(\S+)/i);
  if (m) return { cmd: 'activar', email: m[1].trim() };

  const estado = text.match(/^(?:\/)?estado\s+(\S+)/i);
  if (estado) return { cmd: 'estado', email: estado[1].trim() };

  return null;
}

async function manualGrant(email) {
  const r = await fetch(BACKEND_URL + '/billing/manual-grant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bridge-Secret': BRIDGE_SECRET
    },
    body: JSON.stringify({ email, source: 'whatsapp_bridge' })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || data.message || 'grant_failed');
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function restoreCheck(email) {
  const r = await fetch(BACKEND_URL + '/billing/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function clientInstructions(email, expiresAt) {
  const exp = expiresAt ? new Date(expiresAt).toLocaleDateString('es-CR') : '30 días';
  return (
    '✅ *Alice Companion activa*\n\n' +
    '1. Entrá a: ' + CLIENT_URL + '\n' +
    '2. Tocá *Ya pagué — recuperar acceso*\n' +
    '3. Escribí este email: *' + email + '*\n\n' +
    'Válido hasta: ' + exp + '\n' +
    '¡Listo para practicar sin límites!'
  );
}

function helpText() {
  return (
    '*Infinity WA Bridge*\n\n' +
    'En el chat del cliente (o aquí):\n' +
    '• `/activar correo@cliente.com` — activa Companion 30 días y responde con instrucciones\n' +
    '• `/estado correo@cliente.com` — ¿tiene acceso activo?\n' +
    '• `/ayuda` — este mensaje\n\n' +
    'Solo tu número puede usar comandos.'
  );
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('\nEscaneá este QR con WhatsApp (Dispositivos vinculados):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Infinity WA Bridge listo. WhatsApp conectado.');
  console.log('Comando: /activar correo@cliente.com');
});

client.on('auth_failure', (m) => {
  console.error('Auth falló:', m);
});

client.on('disconnected', (reason) => {
  console.warn('Desconectado:', reason);
});

client.on('message_create', async (msg) => {
  try {
    if (msg.fromMe === false && !isAllowed(msg)) return;
    // Commands: only from your number (or you sent them fromMe in a chat)
    const fromMe = !!msg.fromMe;
    const allowed = isAllowed(msg);
    if (!fromMe && !allowed) return;
    if (fromMe) {
      // When you send /activar in a customer chat, fromMe is true — allow
    } else if (!allowed) {
      return;
    }

    const parsed = parseCommand(msg.body);
    if (!parsed) return;

    // Only YOU can run commands (fromMe or allowlisted sender)
    if (!fromMe && !allowed) return;
    // If message is from customer (not fromMe), ignore even if they type /activar
    if (!fromMe) return;

    const chat = await msg.getChat();

    if (parsed.cmd === 'help') {
      await chat.sendMessage(helpText());
      return;
    }

    if (parsed.cmd === 'estado') {
      const email = parsed.email;
      if (!email.includes('@')) {
        await chat.sendMessage('Email inválido. Ej: /estado cliente@gmail.com');
        return;
      }
      const { ok, data } = await restoreCheck(email);
      if (ok && data.premiumToken) {
        await chat.sendMessage('✅ Activo hasta ' + (data.expiresAt || '?'));
      } else {
        await chat.sendMessage('❌ Sin acceso activo para ' + email);
      }
      return;
    }

    if (parsed.cmd === 'activar') {
      const email = parsed.email;
      if (!email.includes('@')) {
        await chat.sendMessage('Email inválido. Ej: `/activar cliente@gmail.com`');
        return;
      }
      await chat.sendMessage('Activando Alice Companion para ' + email + '…');
      try {
        const granted = await manualGrant(email);
        await chat.sendMessage(clientInstructions(granted.email || email, granted.expiresAt));
        console.log('Activado:', email, granted.expiresAt);
      } catch (e) {
        console.error('Grant error:', e.message, e.data);
        await chat.sendMessage(
          'Error al activar: ' + (e.data?.error || e.message) +
          '\nRevisá BRIDGE_SECRET y que el backend esté arriba.'
        );
      }
    }
  } catch (err) {
    console.error('message_create error:', err.message);
  }
});

console.log('Iniciando Infinity WA Bridge…');
client.initialize();
