/**
 * Infinity WhatsApp Auto-Sender
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const BACKEND_URL = (process.env.BACKEND_URL || 'https://alice-by-infinity.onrender.com').replace(/\/$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || process.env.ANALYZE_SECRET || '';
const POLL_MS = Math.max(3000, parseInt(process.env.POLL_MS || '4000', 10));
const LOG_FILE = path.join(__dirname, 'wa-bridge.log');

function log(...args) {
  const line = args.map(String).join(' ');
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, new Date().toISOString() + ' ' + line + '\n');
  } catch (e) { /* ignore */ }
}

if (!BRIDGE_SECRET) {
  log('Falta BRIDGE_SECRET. Ejecutá WHATSAPP-1-CONFIGURAR.bat primero.');
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
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  log('No se encontró Chrome. Instalá Google Chrome.');
  process.exit(1);
}

let ready = false;
let clientRef = null;
let polling = false;

async function fetchPending() {
  const r = await fetch(BACKEND_URL + '/billing/wa-outbox', {
    headers: { 'X-Bridge-Secret': BRIDGE_SECRET }
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('outbox ' + r.status + ' ' + t.slice(0, 120));
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

async function resolveChatId(client, phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) throw new Error('telefono vacio');

  try {
    const numberId = await client.getNumberId(digits);
    if (numberId) {
      if (numberId._serialized) return numberId._serialized;
      if (numberId.user) return String(numberId.user) + '@c.us';
    }
  } catch (e) {
    log('getNumberId aviso:', e.message);
  }

  // Costa Rica and others: full international digits
  return digits + '@c.us';
}

async function sendOne(client, item) {
  const chatId = await resolveChatId(client, item.phone);
  log('Enviando a', item.phone, 'chatId=', chatId);
  const result = await client.sendMessage(chatId, item.message);
  log('sendMessage ok', result && result.id ? result.id._serialized || result.id : '');
  await ack(item.id, 'sent');
  log('OK enviado a', item.phone, item.email || '');
}

async function pollLoop() {
  if (!ready || !clientRef || polling) return;
  polling = true;
  try {
    const items = await fetchPending();
    log('Revisando cola…', items.length, 'pendiente(s)');
    for (const item of items) {
      try {
        await sendOne(clientRef, item);
      } catch (e) {
        log('ERROR enviando a', item.phone + ':', e.message);
        try {
          await ack(item.id, 'failed');
          log('Marcado fallido:', item.id);
        } catch (e2) {
          log('ack failed error:', e2.message);
        }
      }
    }
  } catch (e) {
    log('Cola error:', e.message);
    if (String(e.message).includes('401')) {
      log('La clave no coincide con Render. Corre WHATSAPP-1-CONFIGURAR.bat de nuevo.');
    }
  } finally {
    polling = false;
  }
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: false,
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('qr', (qr) => {
  log('ESCANEA EL QR CON EL TELEFONO (Dispositivos vinculados)');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  ready = true;
  clientRef = client;
  log('Listo. WhatsApp automatico ENCENDIDO.');
  setTimeout(pollLoop, 1500);
});

client.on('authenticated', () => log('WhatsApp autenticado…'));
client.on('auth_failure', (m) => log('auth_failure', m));
client.on('disconnected', (reason) => {
  ready = false;
  clientRef = null;
  log('Desconectado:', reason);
});

setInterval(pollLoop, POLL_MS);

log('Usando navegador:', browserPath);
log('Servidor:', BACKEND_URL);
log('Iniciando…');
client.initialize().catch((err) => {
  log('Error al iniciar:', err.message);
  process.exit(1);
});
