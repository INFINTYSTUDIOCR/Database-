import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../backend/jill-method-os.js');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(/const METHOD_OS_VERSION = '[^']+';/, "const METHOD_OS_VERSION = 'os-v16-conjugar-invertir-domino';");

const block = `
REGLA IMPERATIVA METODO (sin excepcion Foundations):
1) CONJUGAR: rotar pronombres (I/you/he/she/we/they) y tiempos MSI (PR/PS/PC/PRP/PPC/MOD) — nunca solo I+presente.
2) INVERTIR (moneda): cada afirmacion lleva par pregunta — aux/be/modal al frente (Are you...? Is there...? Did she...?).
3) COMBINAR: MSI + articulos + prep in/on/at + there is en misma oracion cuando el modulo lo permite.
4) DEMOSTRAR en conversacion Jill: dominio = tiempos correctos + preguntas invertidas + combinacion natural en dialogo — no recitar teoria.
Jill: "Ahora otro pronombre. Ahora pregunta. Ahora combinalo."

`;

if (!s.includes('REGLA IMPERATIVA METODO')) {
  const i = s.indexOf('Matriz: 7P');
  if (i < 0) throw new Error('anchor fail');
  s = s.slice(0, i) + block + s.slice(i);
}

const thereExtra = `
Practica 006-C obligatoria: afirmacion+pregunta mismo C; rotar is/are/was/were/will/would/has-have been; combinar there+prep; conversacion 4+ oraciones con una en pasado y una pregunta.

`;
if (!s.includes('Practica 006-C obligatoria')) {
  const j = s.indexOf('GET IT STRAIGHT COMPARATIVOS');
  s = s.slice(0, j) + thereExtra + s.slice(j);
}

fs.writeFileSync(p, s, 'utf8');
console.log('JS_CONJUGAR_OK');
