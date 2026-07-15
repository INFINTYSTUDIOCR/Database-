import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'config/jill-canon-map.json'), 'utf8'));
fs.copyFileSync(
  path.join(root, 'config/jill-canon-map.json'),
  path.join(root, 'backend/config/jill-canon-map.json')
);

let fe = fs.readFileSync(path.join(root, 'js/jill-canon-router.js'), 'utf8');
const start = fe.indexOf('var EMBEDDED_MAP = ');
const end = fe.indexOf('var MAP = EMBEDDED_MAP;');
if (start < 0 || end < 0) throw new Error('embed markers missing');
fe = fe.slice(0, start) + 'var EMBEDDED_MAP = ' + JSON.stringify(map, null, 2) + ';\n\n  ' + fe.slice(end);
fe = fe.replace(/var CACHE_VER = '[^']+';/, "var CACHE_VER = '20260710drill';");
fs.writeFileSync(path.join(root, 'js/jill-canon-router.js'), fe);

const tts = fs.readFileSync(path.join(root, 'js/tts-chunks.js'), 'utf8');
const api = new Function(tts + '\nreturn { prepareTtsLine };')();
const samples = [
  'I do did done the homework',
  'go/went/gone',
  'I have has had gone',
  'do/did/done',
  'Before leaving, call me. (antes de irte)'
];
for (const s of samples) {
  console.log(JSON.stringify(s), '->', JSON.stringify(api.prepareTtsLine(s)));
}
