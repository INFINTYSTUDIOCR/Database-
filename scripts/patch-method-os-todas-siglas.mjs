import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MSI = 'MSI\xAE';
const EM = '\x9D'; // separador usado en el archivo (em dash del doc)

const FULL_MSI_SECTION = `## NOTACION ${MSI} ${EM} TODAS LAS SIGLAS (EXPLICAR ANTES DE USAR)

**Regla irrompible:** CADA sigla se explica LA PRIMERA VEZ que aparece ${EM} en espanol claro, letra por letra, con ejemplo en whiteboard. Nunca uso una sigla a ciegas. Despues de explicada, corrijo por ranura: "Esto es ${MSI} ${EM} ¿que ranura falta?".

**${MSI}** = Mecanica Estructural Infinity${MSI.slice(3)} ${EM} el ingles se arma en **ranuras**, no se traduce palabra por palabra.

### Ranuras base (correccion siempre P|M|V|C)

| Sigla | Significa | Ejemplo en whiteboard |
|-------|-----------|----------------------|
| **P** | **Pronombre** ${EM} quien hace o de quien hablamos | I, you, he, she, we, they |
| **V** | **Verbo** ${EM} accion en la forma correcta (base / pasado / participio) | go, went, gone |
| **C** | **Complemento** ${EM} todo lo que completa la idea (objeto, lugar, tiempo, adj, prep) | home, the book, at 5 pm |
| **M** | **Modal** ${EM} will, would, should, can, could, must, may, might (entre P y V) | I **will** go |

### Piezas auxiliares (dentro de las ranuras ${EM} explicar cuando entren)

| Sigla | Significa | Ejemplo |
|-------|-----------|---------|
| **TB** | **To Be** (am, is, are, was, were, been) ${EM} progresivo y estados | I **am** hungry / They **are** coming |
| **H** | **Have / Has / Had** ${EM} auxiliar de perfecto | He **has** done it |
| **ING** | Verbo + **-ing** ${EM} progresivo / gerundio | I am watch**ing** TV |
| **PP** | **Participio pasado** (3ra columna) ${EM} siempre tras H | have **gone** |

### Siglas de formula (tiempo y estructura ${EM} explicar cada una al introducirla)

| Sigla | Nombre | Formula | Ejemplo |
|-------|--------|---------|---------|
| **PR** | Presente simple | P + V + C | I go home |
| **PS** | Pasado simple | P + V(pasado) + C | She worked yesterday |
| **PC** | Presente continuo | P + TB + V+ing + C | They are coming |
| **PRP** | Presente perfecto | P + H + PP + C | He has done it |
| **PAP** | Pasado perfecto | P + Had + PP + C | I had said that |
| **PPC** | Perfecto continuo | P + H/Had + been + V+ing + C | They have been going |
| **MOD** | Modal | P + M + V + C | I will go |
| **MP** | Modal perfecto | P + M + H + PP + C | I could have done |
| **MC** | Modal combinado | P + M + H + been + V+ing + C | We should have been going |

### Siglas de patron (modulos ${EM} piezas en C cuando aplica)

| Sigla | Patron | Ejemplo |
|-------|--------|---------|
| **COMP** | Comparativo: P + V + adj-er/more + THAN + C | She is taller than me |
| **SUP** | Superlativo: P + V + THE + adj-est/most + C | He is the best |
| **EQ** | Igualdad: P + V + AS + adj + AS + C | Juan is as tall as Pedro |
| **PREP-T** | Prep de tiempo en C: in/on/at + tiempo | We meet on Monday at 5 pm |

### Orden de instalacion (cuando explico cada sigla por primera vez)

1. **001-B** ${EM} instalo **P** (pronombres = ranura P).
2. **001-C** ${EM} explico **PR** desglosando **P + V + C** antes de la primera oracion.
3. **001-D** ${EM} **MOD**, **H**, **PP**, **MP**, **MC** (modales y perfectos).
4. **Modulos 002-004** ${EM} **PS**, **PRP**, **PAP**, **PPC** (tiempos y ancla).
5. **Modulo 005** ${EM} **ING**, **PC** (tres formas -ING).
6. **Modulos 006 / 006-B** ${EM} **PREP-T** (in/on/at en C).
7. **Modulo 007** ${EM} **TB** en estados (tener=to be).
8. **Modulo 008** ${EM} **COMP**, **SUP**, **EQ**.

### Como explico cada sigla (ritual de primera vez)

1. Espanol primero (puente).
2. Nombre de la sigla + que significa CADA letra.
3. Whiteboard con ranuras separadas por \`|\`.
4. El estudiante produce UNA oracion minima.
5. Solo entonces ejercicios / Rapid Fire.

**Puente base:** *Yo voy a casa* = P (yo) + V (voy) + C (a casa) ${EM} misma logica en ingles: \`I | go | home\`.

`;

const MSI_CORE = `NOTACION MSI® — TODAS LAS SIGLAS (explicar CADA una la primera vez; nunca a ciegas):
Ranuras base: P=Pronombre, V=Verbo, C=Complemento, M=Modal (entre P y V).
Auxiliares: TB=To Be, H=Have/Has/Had, ING=V+-ing, PP=participio (3ra columna, tras H).
Formulas tiempo: PR=P+V+C presente | PS=P+V(pasado)+C | PC=P+TB+V+ing+C | PRP=P+H+PP+C | PAP=P+Had+PP+C | PPC=P+H+been+V+ing+C | MOD=P+M+V+C | MP=P+M+H+PP+C | MC=P+M+H+been+V+ing+C.
Patrones: COMP comparativo en C | SUP superlativo | EQ as...as | PREP-T in/on/at tiempo en C.
Instalacion: 001-B=P, 001-C=PR (explicar P+V+C antes), 001-D=MOD/H/PP, mod 002-004=PS/PRP/PAP/PPC, 005=ING/PC, 006=PREP-T, 007=TB estados, 008=COMP/SUP/EQ.
Ritual 1ra vez: espanol -> nombre sigla + cada letra -> whiteboard I|go|home -> estudiante produce -> ejercicios.
Correccion: "Esto es MSI® — ¿que ranura falta?" NUNCA lanzo sigla sin explicarla antes.`;

// --- MD ---
const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');
const mdStart = md.indexOf('## QUE ES MSI');
const mdEnd = md.indexOf('## C', mdStart + 5);
if (mdStart < 0 || mdEnd < 0) throw new Error('MSI section bounds not found in md');
md = md.slice(0, mdStart) + FULL_MSI_SECTION.trim() + '\n\n' + md.slice(mdEnd);

md = md.replace(/qu[eé] pieza falta/gi, 'qué ranura falta');
md = md.replace(/Esto es MSI[^\s]* [^\s]* [^\s]* pieza/gi, 'Esto es MSI® — ¿qué ranura');

fs.writeFileSync(mdPath, md, 'latin1');

// --- JS core ---
const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v10-msi-todas-siglas'");

const coreStart = js.indexOf('MSI');
const coreEnd = js.indexOf('ANTES DE RESPONDER');
if (coreStart < 0 || coreEnd < 0) throw new Error('MSI core block not found in js');
// find line starting with MSI® or MSI DESDE
const lineStart = js.lastIndexOf('\n', coreStart) + 1;
const blockStart = js.indexOf('MSI', js.indexOf('nunca como objetivo'));
if (blockStart < 0) throw new Error('MSI block anchor not found');
const blockEnd = js.indexOf('\n\nANTES DE RESPONDER', blockStart);
js = js.slice(0, blockStart) + MSI_CORE + js.slice(blockEnd);

if (!js.includes('NUNCA lanzo sigla')) {
  js = js.replace(
    'NUNCA: usar siglas P|M|V|C sin haberlas explicado la primera vez;',
    'NUNCA: usar CUALQUIER sigla MSI (P|M|V|C|TB|H|ING|PP|PR|PS|PC|PRP|PAP|PPC|MOD|MP|MC|COMP|SUP|EQ|PREP-T) sin haberla explicado la primera vez;'
  );
  js = js.replace(
    'SIEMPRE: en primer contacto explico P, V, C (y M cuando toque) con un ejemplo en whiteboard;',
    'SIEMPRE: en primer contacto explico TODAS las siglas que voy a usar (ranuras, auxiliares, formulas, patrones) con whiteboard antes de ejercicios;'
  );
}

fs.writeFileSync(jsPath, js, 'utf8');

// --- server versions ---
const serverPath = path.join(__dirname, '../backend/server.js');
let srv = fs.readFileSync(serverPath, 'utf8');
srv = srv.replace(/const JILL_BRAIN_VER = '[^']+'/, "const JILL_BRAIN_VER = 'v17-msi-todas-siglas'");
srv = srv.replace(/const ALICE_BRAIN_VER = '[^']+'/, "const ALICE_BRAIN_VER = 'v16-msi-todas-siglas'");
fs.writeFileSync(serverPath, srv, 'utf8');

// --- verify ---
const m = await import('../backend/jill-method-os.js');
const mdCheck = fs.readFileSync(mdPath, 'latin1');
console.log('VERSION', m.METHOD_OS_VERSION);
console.log('md has PRP:', mdCheck.includes('PRP'));
console.log('md has COMP:', mdCheck.includes('COMP'));
console.log('md has PREP-T:', mdCheck.includes('PREP-T'));
console.log('core has MOD:', m.METHOD_OS_CORE.includes('MOD=P+M+V+C'));
console.log('core has todas siglas:', m.METHOD_OS_CORE.includes('TODAS LAS SIGLAS'));
console.log('DONE');
