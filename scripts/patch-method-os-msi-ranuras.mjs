import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MSI = 'MSI\xAE'; // ® en latin1 / ISO-8859-1

const MSI_SECTION = `
## QUE ES ${MSI} — RANURAS P, V, C (DESDE EL PRIMER CONTACTO)

**Regla irrompible:** la primera vez que el estudiante ve P, V o C — Jill EXPLICA las siglas en espanol claro con un ejemplo. Despues, corregir SIEMPRE por ranura ("¿que ranura falta?"), nunca palabra por palabra.

**${MSI}** = Mecanica Estructural Infinity${MSI.slice(3)} — el ingles se arma en **ranuras**, no se traduce letra por letra.

| Ranura | Significa | Ejemplo |
|--------|-----------|---------|
| **P** | **Pronombre** — quien hace o de quien hablamos | I, you, he, she, we, they |
| **V** | **Verbo** — la accion en la forma correcta (base / pasado / participio) | go, went, gone |
| **C** | **Complemento** — todo lo que completa la idea (objeto, lugar, tiempo, adjetivo, prep…) | home, yesterday, the book, at 5 pm |
| **M** | **Modal** — cuando aplica, va entre P y V | will, would, should, can, could |

**Formula base (instalar primero):** \`P + V + C\` ? whiteboard: \`I | go | home\` (Yo voy a casa).
Puente espanol: *Yo* (P) + *voy* (V) + *a casa* (C) — misma logica, otras piezas.

**Orden de instalacion en Modulo 001:** 001-B instala **P** (pronombres) ? 001-C primera oracion **P+V+C** ? 001-D agrega **M** (modales) y formulas \`P+M+V\`, \`P+H+PP\`, etc.

**Siglas de tiempo (despues de dominar P+V+C):** PR = presente P+V+C · PS = pasado · PC = P + To Be + V+ing + C · modales = P+M+V+C. Preposiciones y adjetivos comparativos viven en **C**.

**Como enseno:** espanol primero ? muestro las tres ranuras en una frase ? el estudiante produce una P+V+C minima ? corrijo preguntando ranura, no traduccion.

`;

const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');

if (!md.includes('QUE ES MSI') && !md.includes('RANURAS P, V, C')) {
  const anchor = 'Lo que importa es el siguiente ejercicio.\n\n';
  if (!md.includes(anchor)) throw new Error('md anchor not found');
  md = md.replace(anchor, anchor + MSI_SECTION.trim() + '\n\n');
}

md = md.replace(/qu[eé] pieza falta/gi, 'qué ranura falta');
md = md.replace(/Qu[eé] pieza falta/gi, 'Qué ranura falta');

const logica001C = '**Logica:** "Cuantos verbos irregulares necesitas para hablar de cualquier cosa en pasado? 16. Solo 16."';
const instalacion001C = `${logica001C} En cero total se instalan en presente primero; tres columnas se profundizan en Modulo 004.

**Instalacion ${MSI} (obligatorio antes del primer P+V+C):** explicar que **P** = pronombre (001-B), **V** = verbo (los 16), **C** = complemento — ejemplo whiteboard \`I | have | a car\`. Si no lo explique antes, lo hago AHORA antes de continuar.`;
if (md.includes(logica001C) && !md.includes('Instalacion MSI')) {
  md = md.replace(
    `${logica001C} En cero total se instalan en presente primero; tres columnas se profundizan en Modulo 004.`,
    instalacion001C
  );
}

const logica001B = '**Logica:** en espanol ya sabe quien habla (yo, tu, el). En ingles la misma idea se divide en 4 piezas segun la funcion';
if (md.includes(logica001B) && !md.includes('ranura **P**')) {
  md = md.replace(
    logica001B,
    `${logica001B} — la ranura **P** del ${MSI}.`
  );
}

fs.writeFileSync(mdPath, md, 'latin1');

const MSI_CORE = `
MSI® DESDE EL INICIO (primera vez: explicar siglas P,V,C,M con ejemplo; despues: corregir por ranura):
MSI® = Mecanica Estructural Infinity — ingles en RANURAS, no traduccion palabra por palabra.
P = Pronombre (I, you, he... quien hace). V = Verbo (accion en forma correcta). C = Complemento (resto: lugar, tiempo, objeto, adj, prep). M = Modal (will, would...) entre P y V cuando aplica.
Formula base P+V+C = I go home (whiteboard I|go|home). Puente espanol: yo+voy+a casa = misma logica.
Instalacion 001: 001-B=P, 001-C=P+V+C (explicar ranuras ANTES de la primera oracion), 001-D=M+estructuras. Siglas tiempo: PR, PS, PC, PRP = extensiones P|M|V|C; prep y adj comparativo en C.
NUNCA uso P+V+C sin explicar que es cada letra la primera vez. Correccion: "Esto es MSI® — ¿que ranura falta?"

`;

const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v9-msi-ranuras-primero'");

if (!js.includes('MSI® DESDE EL INICIO')) {
  js = js.replace(
    'Enseño a DETECTAR PATRONES, no a memorizar reglas. La gramática aparece como consecuencia, nunca como objetivo.\n\nANTES DE RESPONDER',
    `Enseño a DETECTAR PATRONES, no a memorizar reglas. La gramática aparece como consecuencia, nunca como objetivo.\n${MSI_CORE.trim()}\n\nANTES DE RESPONDER`
  );
}

if (!js.includes('NUNCA: usar siglas P|M|V|C sin haberlas explicado')) {
  js = js.replace(
    'NUNCA: empezar con el nombre gramatical;',
    'NUNCA: usar siglas P|M|V|C sin haberlas explicado la primera vez; empezar con el nombre gramatical;'
  );
  js = js.replace(
    'SIEMPRE: español primero;',
    'SIEMPRE: en primer contacto explico P, V, C (y M cuando toque) con un ejemplo en whiteboard; español primero;'
  );
}

fs.writeFileSync(jsPath, js, 'utf8');

const serverPath = path.join(__dirname, '../backend/server.js');
let srv = fs.readFileSync(serverPath, 'utf8');
srv = srv.replace(/const JILL_BRAIN_VER = '[^']+'/, "const JILL_BRAIN_VER = 'v16-msi-ranuras-primero'");
srv = srv.replace(/const ALICE_BRAIN_VER = '[^']+'/, "const ALICE_BRAIN_VER = 'v15-msi-ranuras-primero'");
fs.writeFileSync(serverPath, srv, 'utf8');

console.log('md has MSI section:', md.includes('RANURAS P, V, C'));
console.log('js has MSI DESDE EL INICIO:', js.includes('MSI® DESDE EL INICIO'));
console.log('VERSION', js.match(/METHOD_OS_VERSION = '([^']+)'/)?.[1]);
console.log('DONE');
