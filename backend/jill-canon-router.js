/**
 * Jill DJ — pickTrack (Node). Misma lógica que js/jill-canon-router.js
 */
const fs = require('fs');
const path = require('path');

let MAP = null;

function loadMap() {
  if (MAP) return MAP;
  const candidates = [
    path.join(__dirname, 'config', 'jill-canon-map.json'),
    path.join(__dirname, '..', 'config', 'jill-canon-map.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        MAP = JSON.parse(fs.readFileSync(p, 'utf8'));
        return MAP;
      }
    } catch (_) { /* next */ }
  }
  MAP = { tracks: [] };
  return MAP;
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/|,;]+/g, ' ')
    .replace(/\by\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tracks() {
  return (loadMap().tracks) || [];
}

function pickTrack(text) {
  const n = normalize(text);
  if (!n || n.length < 2) return null;
  let best = null;
  let bestLen = 0;
  const list = tracks();
  for (let i = 0; i < list.length; i++) {
    const tr = list[i];
    const aliases = tr.aliases || [];
    for (let j = 0; j < aliases.length; j++) {
      const a = normalize(aliases[j]);
      if (!a || a.length < 2) continue;
      if (!n.includes(a)) continue;
      if (a.length <= 3) {
        const re = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (!re.test(n)) continue;
      }
      if (a.length > bestLen) {
        bestLen = a.length;
        best = tr;
      }
    }
  }
  return best;
}

function pickTrackId(text) {
  const t = pickTrack(text);
  return t ? t.id : null;
}

function formatLock(track) {
  if (!track) return '';
  const never = (track.never || []).join('; ');
  return [
    'JILL DJ — TRACK LOCK (pedido del estudiante)',
    `Track: ${track.title}`,
    `Fórmula oficial: ${track.formula}`,
    `Ejemplo: ${track.example}`,
    never ? `PROHIBIDO mezclar: ${never}` : '',
    'Explicá SOLO este track. No cambies de módulo. [[CTYPE:whiteboard]]'
  ].filter(Boolean).join('\n');
}

function byColumn() {
  const out = {};
  tracks().forEach((tr) => {
    out[tr.id] = {
      id: String(tr.svg || '').split('/').pop().replace(/\.svg$/, ''),
      path: tr.svg,
      title: tr.title,
      formula: tr.formula,
      example: tr.example
    };
  });
  return out;
}

module.exports = {
  loadMap,
  normalize,
  pickTrack,
  pickTrackId,
  formatLock,
  byColumn
};
