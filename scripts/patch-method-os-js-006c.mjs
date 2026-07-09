import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../backend/jill-method-os.js');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(/const METHOD_OS_VERSION = '[^']+';/, "const METHOD_OS_VERSION = 'os-v15-there-existencial';");

const block = `
THERE IS / THERE ARE (Modulo 006-C) — hay espanol -> THERE + BE + C (canon: there-existencial.svg; despues prep 006/006-B):
- Existencia NO es have: hay un gato -> there IS a cat; hay gatos -> there ARE cats.
- Acuerdo: mira sustantivo despues del be (is/was/has been vs are/were/have been).
- Tiempos: there was/were · there will be · there would be · there has/have been.
- Preguntas (moneda): Is there...? Are there...? Was/Were there...? Will/Would there be...? Has/Have there been...?
- there IS (existe) vs it IS (identificacion): ¿existe algo o que es algo?
Frase ancla: "There is a book on the table, but there are no pens — is there a pencil anywhere?"
Errores: have a cat por hay; there is cats; Is there are.

`;

const anchor = 'GET IT STRAIGHT COMPARATIVOS';
const i = s.indexOf(anchor);
if (i < 0) throw new Error('anchor fail');
if (!s.includes('THERE IS / THERE ARE')) {
  s = s.slice(0, i) + block + s.slice(i);
}

fs.writeFileSync(p, s, 'utf8');
console.log('JS_006C_OK');
