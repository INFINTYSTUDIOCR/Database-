/**
 * Foundations modules catalog (Node) — Mini Kaboom gate helper.
 */
const fs = require('fs');
const path = require('path');

let MAP = null;

function loadMap() {
  if (MAP) return MAP;
  const candidates = [
    path.join(__dirname, 'config', 'jill-foundations-modules.json'),
    path.join(__dirname, '..', 'config', 'jill-foundations-modules.json')
  ];
  for (let i = 0; i < candidates.length; i++) {
    try {
      if (fs.existsSync(candidates[i])) {
        MAP = JSON.parse(fs.readFileSync(candidates[i], 'utf8'));
        return MAP;
      }
    } catch (_) { /* next */ }
  }
  MAP = { modules: [] };
  return MAP;
}

function byId(id) {
  const want = String(id || '').toUpperCase();
  const list = (loadMap().modules || []);
  for (let i = 0; i < list.length; i++) {
    if (String(list[i].id).toUpperCase() === want) return list[i];
  }
  return null;
}

function trackToModuleId(trackId) {
  const tid = String(trackId || '');
  if (!tid) return null;
  const list = loadMap().modules || [];
  for (let i = 0; i < list.length; i++) {
    const ids = list[i].canonTrackIds || [];
    if (ids.indexOf(tid) >= 0) return list[i].id;
  }
  return null;
}

function moduleTeachBlock(trackId) {
  const mid = trackToModuleId(trackId);
  if (!mid) return '';
  const mod = byId(mid);
  if (!mod) return '';
  return [
    `MODULO FOUNDATIONS ${mid}: ${mod.title}`,
    mod.say ? `GUION: ${mod.say}` : '',
    mod.bridge ? `PUENTE: ${mod.bridge}` : '',
    'GATE MINI KABOOM: cuando terminés la explicación + el estudiante diga que entendió (sí/ok/claro) O cierres el checklist, agregá SOLO como última línea de máquina:',
    `[[CTYPE:mini_kaboom:${mid}]]`,
    'PROHIBIDO: abrir Rapid drill standalone; el portal lanza el Mini Kaboom embebido.',
    'Si fallan el mini: reforzá el patrón fallado (estilo John) y podés volver a pedir el gate.'
  ].filter(Boolean).join('\n');
}

module.exports = {
  loadMap,
  byId,
  trackToModuleId,
  moduleTeachBlock
};
