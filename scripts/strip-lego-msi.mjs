import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function stripLego(text) {
  const rules = [
    [/LEGO ESTRUCTURAL/gi, 'ESTRUCTURA MSI®'],
    [/LEGO estructural/gi, 'estructura MSI®'],
    [/LEGO MODAL/gi, 'MODALES MSI®'],
    [/LEGO will\/would/gi, 'modales MSI® (will/would)'],
    [/LEGO P\+V\+ADJ/gi, 'MSI® P+V+ADJ (ranura C)'],
    [/LEGO P \+ V \+ ADJ/gi, 'MSI® P + V + ADJ (ranura C)'],
    [/LEGO P\+\s*V/gi, 'MSI® P+V'],
    [/LEGO:/gi, 'Estructura MSI®:'],
    [/piezas LEGO/gi, 'ranuras MSI®'],
    [/pieza de LEGO/gi, 'ranura MSI®'],
    [/estructuras LEGO/gi, 'estructuras MSI®'],
    [/Combinaci[oó]n LEGO/gi, 'Encadenamiento MSI®'],
    [/Construcci[oó]n LEGO/gi, 'Construcción MSI®'],
    [/construye LEGO/gi, 'arma estructura MSI®'],
    [/en LEGO/gi, 'con MSI®'],
    [/como LEGO/gi, 'con MSI® (ranuras P|M|V|C)'],
    [/un LEGO/gi, 'MSI®'],
    [/Esto es un LEGO/gi, 'Esto es MSI®'],
    [/\bLEGO\b/g, 'MSI®'],
    [/tratar cada estructura como MSI®/g, 'tratar cada estructura con MSI® (ranuras P|M|V|C)'],
    [/cada estructura es una pieza que se combina/gi, 'cada estructura es una fórmula MSI® (ranuras P|M|V|C)'],
    [/¿qué pieza falta/gi, '¿qué ranura falta'],
  ];
  let out = text;
  for (const [re, rep] of rules) out = out.replace(re, rep);
  return out;
}

const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');
md = stripLego(md);
fs.writeFileSync(mdPath, md, 'latin1');

const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v8-msi-only'");
js = stripLego(js);
// Fix ALICE note separately if LEGO slipped
js = js.replace(/, MSI®, ritual/g, ', MSI® (ranuras P|M|V|C), ritual');
fs.writeFileSync(jsPath, js, 'utf8');

const serverPath = path.join(__dirname, '../backend/server.js');
let srv = fs.readFileSync(serverPath, 'utf8');
srv = srv.replace(
  /REGLA\/ESTRUCTURA \(LEGO P\|M\|V\|C/g,
  'REGLA/ESTRUCTURA (MSI® P|M|V|C'
);
srv = srv.replace(
  /const JILL_BRAIN_VER = '[^']+'/,
  "const JILL_BRAIN_VER = 'v15-msi-only'"
);
srv = srv.replace(
  /const ALICE_BRAIN_VER = '[^']+'/,
  "const ALICE_BRAIN_VER = 'v14-msi-only'"
);
fs.writeFileSync(serverPath, srv, 'utf8');

const mdCheck = fs.readFileSync(mdPath, 'latin1');
const jsCheck = fs.readFileSync(jsPath, 'utf8');
const legoLeft = (mdCheck.match(/\bLEGO\b/gi) || []).length + (jsCheck.match(/\bLEGO\b/gi) || []).length;
console.log('LEGO_REMAINING', legoLeft);
console.log('MSI_IN_JS', jsCheck.includes('MSI'));
console.log('DONE');
