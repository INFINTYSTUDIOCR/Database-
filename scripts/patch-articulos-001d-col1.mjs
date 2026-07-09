import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EM = '\x9D';

const BLOCK_001D = `
### 001-D ${EM} ARTICULOS (a/an/the) Y CUANTIFICADORES (ranura C ${EM} COL 1 PR)

**Cuando entra:** inmediatamente despues de **001-B pronombres** y **001-C verbos en presente (PR = P+V+C)**. **Antes de modales.** En la **matriz F0 Col 1 (PR)** ya se usan articulos y cuantificadores en C ${EM} no se espera al final del programa.

**Concepto central:** en espanol muchas veces no marcamos "un/una" vs "el/la"; en ingles la pieza va **en C**, delante del sustantivo. Canon: \`assets/canon/articulos.svg\`. \`P + V + [articulo/cuantificador] + sustantivo\`.

**001-D-A ${EM} a/an vs the**
- **a/an** = indefinido (un/una): primera vez, uno de varios. *Vi un gato* -> I see **a** cat.
- **the** = definido (el/la): ya sabemos cual, segunda mencion. **The** cat is black.
- **a vs an** por **sonido**: an hour, a book, a university.
- Pregunta Jill: "Primera vez o ya sabemos cual?"

**001-D-B ${EM} much/many, little/few, several, a lot of**
- Pregunta primero: **contable o no contable?**
- NO contable: much / little / a lot of + noun (much water, little time)
- Contable plural: many / few / several / a lot of + plural (many books, few students, several meetings)
- Errores: much people -> many; few water -> little; several money -> much/a lot of

**Frase ancla Col 1:** \`I see a cat\` ${EM} \`The cat is black\` ${EM} \`I have little time but many tasks\`.

**Ejercicios de dominio (001-D):**
1. PR + articulo: I + go + **a/the** + lugar/cosa (Col 1 matriz).
2. Mini-historia 2 oraciones: a cat -> the cat.
3. Clasificar contable/no contable antes de much/many.
4. Rapid Fire a/an trampas (an hour, a university).
5. Oracion Col 1 completa: "I have **a** meeting at **the** office with **several** clients."

**Dominio 001-D:** a/an/the sin traducir a ciegas ${EM} much/many y little/few segun contable ${EM} several solo plural ${EM} integrado en PR Col 1 sin saltar a modales.

**Errores frecuentes:** omitir articulo -> "Falta pieza en C: indefinido o definido?" ${EM} the en primera mencion -> "Ya sabemos cual?" ${EM} much people -> many.

---

`;

const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');

// Remove standalone module 009
const m009 = md.indexOf('## MODULO DE DOMINIO 009');
const registro = md.indexOf('## REGISTRO DE M');
if (m009 >= 0 && registro > m009) {
  md = md.slice(0, m009) + md.slice(registro);
}

// Rename old 001-D modales -> 001-E (headers and references in 001 block only)
md = md.replace(/### 001-D ${EM} PATRON WILL\/WOULD/g, `### 001-E ${EM} PATRON WILL/WOULD`);
md = md.replace(/Ejercicios de dominio \(001-D\):/g, 'Ejercicios de dominio (001-E):');
md = md.replace(/Dominio 001-D \/ modulo 001 completo:/g, 'Dominio 001-E / modulo 001 completo:');
md = md.replace(/4\. Patron will\/would \+ ESTRUCTURA MSI/g, '5. Patron will/would + ESTRUCTURA MSI');

// Insert 001-D articles after 001-C dominio block
if (!md.includes('### 001-D') || !md.includes('ARTICULOS (a/an/the)')) {
  const anchor = '**Dominio 001-C:**';
  const idx = md.indexOf(anchor);
  if (idx < 0) throw new Error('001-C dominio not found');
  const end = md.indexOf('\n\n---\n\n', idx);
  if (!md.slice(idx, end).includes('001-D') || !md.includes('001-D-A')) {
    md = md.slice(0, end) + BLOCK_001D + md.slice(end);
  }
}

// Update module 001 header sequence
md = md.replace(
  /1\. Abecedario \+ sonidos base\.\n2\. Pronombres[^\n]+\n3\. Los 16 verbos[^\n]+\n4\. Patron will/g,
  `1. Abecedario + sonidos base.\n2. Pronombres ${EM} los 4 tipos (ranura P).\n3. Los 16 verbos esenciales (presente) ${EM} PR = P+V+C (Col 1).\n4. Articulos y cuantificadores en C (a/an/the, much/many, little/few, several) ${EM} Col 1 completa.\n5. Patron will`
);

md = md.replace(
  /MODULO DE DOMINIO 001[^\n]+MODALES MSI[^\n]+\n\n\*\*Concepto central:\*\* para quien empieza de cero total, el orden es fijo: primero suena el idioma \(abecedario\), despues quien habla \(pronombres[^\)]+\), despues con que verbos puede decir cualquier cosa \(16 esenciales\), y recien despues las estructuras MSI[^\n]+ con modales\./,
  `MODULO DE DOMINIO 001 ${EM} DESDE CERO: ABECEDARIO, PRONOMBRES, VERBOS, ARTICULOS, MODALES\n\n**Concepto central:** orden fijo: abecedario ${EM} pronombres (P) ${EM} verbos presente (PR Col 1) ${EM} **articulos/cuantificadores en C** (inmediato, no tarde) ${EM} recien modales. Sin saltarse cimientos ${EM} Analogia de la Casa.`
);

// MSI orden instalacion (early section)
md = md.replace(
  /2\. \*\*001-B\*\*[^\n]+\n3\. \*\*001-C\*\*[^\n]+\n4\. \*\*001-D\*\*[^\n]+modales/,
  `2. **001-B** ${EM} ranura **P** (pronombres).\n3. **001-C** ${EM} **PR** = P + V + C (Col 1, verbos presente).\n4. **001-D** ${EM} **articulos/cuantificadores en C** (a/an/the, much/many, little/few, several) ${EM} **antes de modales**.\n5. **001-E** ${EM} modales`
);

// F0 Col 1 note
md = md.replace(
  /\| 1 \| \*\*PR\*\* \| P \+ V \+ C \|/,
  `| 1 | **PR** | P + V + [a/an/the + cuantif.] + C (001-D) |`
);

// REGISTRO
md = md.replace(/\n- \*\*Modulo de Dominio 009\*\*[^\n]+\n/, '\n');
md = md.replace(
  /- \*\*Modulo de Dominio 001\*\* \(v6\.0\):[^\n]+\n/,
  '- **Modulo de Dominio 001** (v7.0): 001-A abecedario; 001-B pronombres; 001-C 16 verbos + PR; **001-D articulos/cuantificadores Col 1**; 001-E modales will/would.\n'
);

// F0 gate: articles with col 1 not after 008
md = md.replace(
  /1\. \*\*001-B\*\* ${EM} instalo \*\*P\*\* \(pronombres\)\.\n2\. \*\*001-C\*\* ${EM} \*\*PR\*\* = P \+ V \+ C \(primera oracion\)\.\n3\. \*\*001-D\*\* ${EM} modales/,
  `1. **001-B** ${EM} instalo **P** (pronombres).\n2. **001-C** ${EM} **PR** = P + V + C (verbos presente, Col 1).\n3. **001-D** ${EM} **articulos + cuantificadores en C** (Col 1 completa).\n4. **001-E** ${EM} modales`
);

fs.writeFileSync(mdPath, md, 'latin1');

// --- JS ---
const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v14-articulos-001d-col1'");

js = js.replace(
  /MODULO 009 ARTICULOS\/CUANTIFICADORES[\s\S]*?Correccion: ¿contable o no\? ¿primera vez o ya sabemos cual\?\n/,
  `001-D ARTICULOS/CUANTIFICADORES (inmediato tras PR Col 1; ANTES modales; canon articulos.svg):
Tras 001-B P y 001-C PR (P+V+C): instalar a/an/the + much/many/little/few/several/a lot of en ranura C.
a/an=indefinido; the=definido; a vs an por sonido. Contable vs no contable antes de much/many.
Col 1 matriz F0 usa articulos desde 001-D. Errores: much people->many; few water->little.
Frase ancla: I see a cat / The cat is black. Luego 001-E modales P+M+V+C.

`
);

js = js.replace(
  /\(D\) modales MSI[^\)]+\(abajo\)/,
  '(D) articulos/cuantificadores en C (001-D, Col 1 PR) (E) modales MSI (will/would) (abajo)'
);

js = js.replace(
  /Instalacion 001: 001-B=P, 001-C=PR \(explicar P\+V\+C antes\), 001-D=MOD/,
  'Instalacion 001: 001-B=P, 001-C=PR, 001-D=articulos/cuantificadores en C (Col 1), 001-E=MOD'
);

fs.writeFileSync(jsPath, js, 'utf8');

// --- bundles ---
const bundlesPath = path.join(__dirname, '../config/jill-bundles.json');
const bundles = JSON.parse(fs.readFileSync(bundlesPath, 'utf8'));
const f0 = bundles.bundles.find((b) => b.id === 'F0-matrix');
if (f0) {
  f0.structureRules[0] = 'Col 1: Pronombre + verbo (presente) + a/an/the + complemento + cuantificadores (much/many, little/few) — dominar antes de avanzar';
}
fs.writeFileSync(bundlesPath, JSON.stringify(bundles, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, '../backend/config/jill-bundles.json'), fs.readFileSync(bundlesPath), 'utf8');

// --- server versions ---
const srvPath = path.join(__dirname, '../backend/server.js');
let srv = fs.readFileSync(srvPath, 'utf8');
srv = srv.replace(/const JILL_BRAIN_VER = '[^']+'/, "const JILL_BRAIN_VER = 'v21-articulos-001d-col1'");
srv = srv.replace(/const ALICE_BRAIN_VER = '[^']+'/, "const ALICE_BRAIN_VER = 'v20-articulos-001d-col1'");
fs.writeFileSync(srvPath, srv, 'utf8');

console.log('md 001-D:', md.includes('001-D') && md.includes('COL 1 PR'));
console.log('md no 009:', !md.includes('MODULO DE DOMINIO 009'));
console.log('md 001-E modales:', md.includes('001-E'));
console.log('js:', js.includes('001-D ARTICULOS'));
console.log('DONE');
