import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MSI = 'MSI\xAE';
const EM = '\x9D';

const MSI_SECTION = `## NOTACION ${MSI} ${EM} SOLO PARA APRENDER ESTRUCTURAS (TIEMPOS VERBALES)

**Alcance:** la notacion ${MSI} sirve para que el estudiante **aprenda a armar y cambiar tiempos verbales**. No es para vocabulario, comparativos, preposiciones ni otros temas ${EM} esos modulos ensenan su patron, pero **sin siglas MSI extra**.

**Regla:** explico P, V, C (y M cuando toque) la primera vez. Cada **tiempo verbal** se explica la primera vez con su formula en whiteboard. Despues corrijo por ranura: "Esto es ${MSI} ${EM} ùque ranura falta?"

### Ranuras (cimientos ${EM} explicar al inicio)

| Ranura | Significa | Ejemplo |
|--------|-----------|---------|
| **P** | **Pronombre** ${EM} quien hace | I, you, he, she |
| **V** | **Verbo** ${EM} la accion; la **forma** cambia segun el tiempo (presente, pasado, participio) | go / went / gone |
| **C** | **Complemento** ${EM} el resto de la idea | home, yesterday, the book |
| **M** | **Modal** ${EM} will, would, should, can... (solo cuando hay modal, entre P y V) | I **will** go |

### Tiempos verbales y sus siglas (explicar cada uno al introducirlo)

| Sigla | Tiempo | Formula | Whiteboard |
|-------|--------|---------|------------|
| **PR** | Presente simple | **P + V + C** | \`I | go | home\` |
| **PS** | Pasado simple | **P + V en pasado + C** | \`She | worked | yesterday\` |
| **PC** | Presente continuo | **P + to be + V+ing + C** | \`They | are | coming\` |
| **PRP** | Presente perfecto | **P + have/has + participio + C** | \`He | has | done | it\` |
| **PAP** | Pasado perfecto | **P + had + participio + C** | \`I | had | said | that\` |
| **PPC** | Perfecto continuo | **P + have/had + been + V+ing + C** | \`They | have been | going\` |

**Modales ${EM} no es otra categoria aparte:** modales **son** la estructura **P + M + V + C**.

| Caso | Formula | Whiteboard |
|------|---------|------------|
| Modal simple | **P + M + V + C** | \`I | will | go\` |
| Modal + perfecto | **P + M + have + participio + C** | \`I | would | have | gone\` |
| Modal + continuo perfecto | **P + M + have + been + V+ing + C** | \`We | should | have been | going\` |

### Orden de instalacion (solo tiempos)

1. **001-B** ${EM} ranura **P** (pronombres).
2. **001-C** ${EM} **PR** = P + V + C (primera oracion).
3. **001-D** ${EM} modales = **P + M + V + C** (+ variantes con have/participio).
4. **Modulos 002-004** ${EM} **PS**, **PRP**, **PAP**, **PPC** (pasado simple = verbo en pasado; ancla).
5. **Modulo 005** ${EM} **PC** (to be + V+ing).

**Puente:** *Yo voy a casa* = P + V + C. *Yo fui ayer* = P + V en pasado + C. *Yo ire* = P + M + V + C. Misma logica, distinta forma del verbo o ranura M.

### Como explico (primera vez por tiempo)

1. Espanol primero.
2. Nombre del tiempo + formula (cada letra de P, V, C o M).
3. Whiteboard con \`|\`.
4. El estudiante produce UNA oracion.
5. Ejercicios / Rapid Fire.

`;

const MSI_CORE = `NOTACION MSIù ù SOLO TIEMPOS VERBALES (aprender a armar estructuras; no comparativos/prep/vocab):
Ranuras: P=Pronombre, V=Verbo (forma segun tiempo), C=Complemento, M=Modal (entre P y V).
Tiempos: PR=P+V+C presente | PS=P+V(pasado)+C pasado simple ù verbo en pasado | PC=P+to be+V+ing+C | PRP=P+have/has+participio+C | PAP=P+had+participio+C | PPC=P+have/had+been+V+ing+C.
Modales SON P+M+V+C (no categoria aparte): I|will|go; modal+perfecto P+M+have+participio+C.
Explico P,V,C y cada tiempo la primera vez con whiteboard; luego corrijo por ranura. Otros modulos (prep, comparativos, estados) sin siglas MSI extra.`;

// --- MD ---
const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');
const mdStart = md.indexOf('## NOTACION MSI');
const mdEnd = md.indexOf('## C', mdStart + 5);
if (mdStart < 0 || mdEnd < 0) throw new Error('MSI section not found');
md = md.slice(0, mdStart) + MSI_SECTION.trim() + '\n\n' + md.slice(mdEnd);
fs.writeFileSync(mdPath, md, 'latin1');

// --- JS ---
const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v11-msi-solo-tiempos'");

const blockStart = js.indexOf('NOTACION MSI');
const blockEnd = js.indexOf('\n\nANTES DE RESPONDER', blockStart);
if (blockStart < 0 || blockEnd < 0) throw new Error('MSI core block not found');
js = js.slice(0, blockStart) + MSI_CORE + js.slice(blockEnd);

js = js.replace(
  /NUNCA: usar CUALQUIER sigla MSI[^;]+;/,
  'NUNCA: usar sigla de tiempo (PR|PS|PC|PRP|PAP|PPC) o ranura (P|M|V|C) sin haberla explicado la primera vez; usar siglas MSI en comparativos/prep/vocab (eso no es MSI de tiempos);'
);
js = js.replace(
  /SIEMPRE: explico TODAS las siglas[^;]+;/,
  'SIEMPRE: explico P,V,C y el tiempo verbal que toque (formula en whiteboard) antes de ejercicios; modales como P+M+V+C;'
);

fs.writeFileSync(jsPath, js, 'utf8');

// --- server ---
const serverPath = path.join(__dirname, '../backend/server.js');
let srv = fs.readFileSync(serverPath, 'utf8');
srv = srv.replace(/const JILL_BRAIN_VER = '[^']+'/, "const JILL_BRAIN_VER = 'v18-msi-solo-tiempos'");
srv = srv.replace(/const ALICE_BRAIN_VER = '[^']+'/, "const ALICE_BRAIN_VER = 'v17-msi-solo-tiempos'");
fs.writeFileSync(serverPath, srv, 'utf8');

const m = await import('../backend/jill-method-os.js');
const mdCheck = fs.readFileSync(mdPath, 'latin1');
console.log('VERSION', m.METHOD_OS_VERSION);
console.log('no COMP in section:', !mdCheck.slice(mdStart, mdStart + 2500).includes('COMP'));
console.log('has PS pasado:', mdCheck.includes('Pasado simple'));
console.log('has P+M+V+C:', mdCheck.includes('P + M + V + C'));
console.log('core solo tiempos:', m.METHOD_OS_CORE.includes('SOLO TIEMPOS'));
console.log('DONE');
