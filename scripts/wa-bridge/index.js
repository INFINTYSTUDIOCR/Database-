/**
 * Infinity WhatsApp Auto-Sender
 * Runs on your PC. Sends activation messages automatically (no copy/paste).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const BACKEND_URL = (process.env.BACKEND_URL || 'https://alice-by-infinity.onrender.com').replace(/\/$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || process.env.ANALYZE_SECRET || '';
const POLL_MS = Math.max(3000, parseInt(process.env.POLL_MS || '5000', 10));

if (!BRIDGE_SECRET) {
  console.error('Falta BRIDGE_SECRET. Ejecutá WHATSAPP-1-CONFIGURAR.bat primero.');
  process.exit(1);
}

function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error('No se encontró Chrome ni Edge. Instalá Google Chrome y volvé a intentar.');
  process.exit(1);
}
console.log('Usando navegador:', browserPath);

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
    // Ventana visible: el QR de WhatsApp Web se ve grande y fácil de escanear
    headless: false,
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('qr', (qr) => {
  console.log('\n========================================');
  console.log('  ESCANEA ESTE QR CON TU TELEFONO');
  console.log('  WhatsApp → Dispositivos vinculados');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nSi no ves bien el QR, agranda la ventana.\n');
});

client.on('ready', () => {
  ready = true;
  console.log('\nListo. WhatsApp automatico ENCENDIDO.');
  console.log('Deja esta ventana abierta.');
  console.log('Cuando actives un cliente en activar.html, el mensaje se manda solo.\n');
});

client.on('authenticated', () => {
  console.log('WhatsApp autenticado…');
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

console.log('Iniciando WhatsApp automatico…');
client.initialize().catch((err) => {
  console.error('Error al iniciar:', err.message);
  process.exit(1);
});
