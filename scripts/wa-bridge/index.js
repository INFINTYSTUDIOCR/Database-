/**
 * Infinity WhatsApp Auto-Sender
 * Runs on your PC. Sends activation messages automatically (no copy/paste).
 */
require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const BACKEND_URL = (process.env.BACKEND_URL || 'https://alice-by-infinity.onrender.com').replace(/\/$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || process.env.ANALYZE_SECRET || '';
const POLL_MS = Math.max(3000, parseInt(process.env.POLL_MS || '5000', 10));

if (!BRIDGE_SECRET) {
  console.error('Falta BRIDGE_SECRET. Ejecutá CONFIGURAR.bat primero.');
  process.exit(1);
}

let ready = false;

async function fetchPending() {
  const r = await fetch(BACKEND_URL + '/billing/wa-outbox', {
    headers: { 'X-Bridge-Secret': BRIDGE_SECRET }
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('outbox ' + r.status + ' ' + t.slice(0, 80));
  }
  const data = await r.json();
  return Array.isArray(data.items) ? data.items : [];
}

async function ack(id, status) {
  await fetch(BACKEND_URL + '/billing/wa-outbox/ack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Bridge-Secret': BRIDGE_SECRET
    },
    body: JSON.stringify({ id, status })
  });
}

function chatIdFromPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits + '@c.us';
}

async function sendOne(client, item) {
  const chatId = chatIdFromPhone(item.phone);
  await client.sendMessage(chatId, item.message);
  await ack(item.id, 'sent');
  console.log('Enviado a', item.phone, item.email || '');
}

async function pollLoop(client) {
  if (!ready) return;
  try {
    const items = await fetchPending();
    for (const item of items) {
      try {
        await sendOne(client, item);
      } catch (e) {
        console.error('Error enviando a', item.phone, e.message);
        try { await ack(item.id, 'failed'); } catch (e2) { /* ignore */ }
      }
    }
  } catch (e) {
    console.error('Cola:', e.message);
  }
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('\n=== Escaneá este QR con tu teléfono ===');
  console.log('WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  ready = true;
  console.log('\nListo. WhatsApp automático ENCENDIDO.');
  console.log('Dejá esta ventana abierta.');
  console.log('Cuando actives un cliente en activar.html, el mensaje se manda solo.\n');
});

client.on('auth_failure', (m) => {
  console.error('No se pudo vincular WhatsApp:', m);
});

client.on('disconnected', (reason) => {
  ready = false;
  console.warn('WhatsApp desconectado:', reason);
});

setInterval(() => {
  if (ready) pollLoop(client);
}, POLL_MS);

console.log('Iniciando WhatsApp automático…');
client.initialize();
