import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MSI = 'MSI\xAE';
const EM = '\x9D';

const MODULE = `
## MODULO DE DOMINIO 009 ${EM} ARTICULOS (a/an/the) Y CUANTIFICADORES (ranura C)

**Concepto central:** en espanol muchas veces **no marcamos** si algo es "uno cualquiera" o "ese mismo"; en ingles la pieza va **en C**, delante del sustantivo. Canon / machote: \`assets/canon/articulos.svg\`. Estructura MSI: \`P + V + [articulo/cuantificador] + sustantivo (+ resto de C)\`.

### 009-A ${EM} ARTICULO INDEFINIDO (a / an) vs DEFINIDO (the)

**Logica (puente espanol):**
- **a / an** = indefinido: **un / una** ${EM} primera vez, uno de varios, el oyente no sabe cual exactamente. *Vi un gato* -> I saw **a** cat.
- **the** = definido: **el / la / los / las** ${EM} ya lo conocemos, es especifico, unico o segunda mencion. *El gato (ese)* -> **The** cat.

**Regla a vs an (sonido, no letra):**
- **an** + sonido vocal: an hour, an umbrella, an MBA (suena vocal).
- **a** + sonido consonante: a book, a university (suena /y/), a one-way street (suena /w/).

**Frase ancla (canon):** \`I see a cat\` (primera vez) ${EM} \`The cat is black\` (ya sabemos cual).

**Pregunta Jill:** "¿Primera vez / uno de varios, o ya sabemos cual?" ${EM} a/an vs the.

### 009-B ${EM} CUANTIFICADORES: much/many · little/few · several · a lot of

**Logica (detectar ANTES de elegir pieza):** en espanol usamos **mucho / poco / varios** para casi todo. En ingles la pieza depende de **¿el sustantivo es contable o no contable?**

| Pregunta | NO contable (agua, tiempo, dinero, informacion) | SI contable plural (libros, estudiantes, reuniones) |
|----------|--------------------------------------------------|-----------------------------------------------------|
| mucho | **much** + sustantivo | **many** + plural |
| poco | **little** + sustantivo | **few** + plural |
| varios | (no aplica) | **several** + plural |
| mucho/monton (informal) | **a lot of** + sustantivo | **a lot of** + plural |

**Ejemplos whiteboard:**
- much water / many books
- little time / few students
- several meetings
- a lot of money / a lot of people

**Puente errores hispanohablante:**
- ~~much people~~ -> "¿Personas se cuentan? -> **many** people"
- ~~few water~~ -> "¿Agua se cuenta en vasos? -> **little** water"
- ~~several money~~ -> "¿Dinero contable plural? -> **much** money o **a lot of** money"

**several vs a lot of:** **several** = varios (numero moderado, contable). **a lot of** = mucho/muchos (cantidad grande, contable o no).

**Nota a few / a little (opcional cuando el alumno domina base):** **a few** = algunos (positivo); **few** = casi ninguno. **a little** = un poco (positivo); **little** = casi nada.

**Ejercicios de dominio (009):**
1. Clasificar sustantivo: Jill dice palabra (water, books, money, students) ${EM} contable o no contable **antes** de armar la frase.
2. Articulos: primera vs segunda mencion ${EM} a/an vs the en mini-historia (2 oraciones).
3. a vs an: Rapid Fire con trampas (an hour, a university, an honor).
4. Cuantificadores: Jill da espanol "poca agua / pocos alumnos / mucha gente / varias veces" ${EM} estudiante elige pieza.
5. En contexto P+V+C: "I have **a** meeting at **the** office with **several** clients and **little** time."

**Dominio:** elige a/an/the sin traducir "un/el" a ciegas ${EM} distingue contable vs no contable ${EM} much/many y little/few correctos ${EM} several solo con plural contable ${EM} a lot of cuando encaja ${EM} frase ancla gato + oficina sin error.

**Errores frecuentes:** the cat primera vez sin contexto -> "¿Ya sabemos cual gato?" ${EM} much time -> "¿Contable? -> **much** OK" vs much people -> "**many**" ${EM} few informations -> "**much** information (no plural)" ${EM} olvida articulo -> "¿Indefinido o definido? Falta a/an o the."

`;

const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');

if (!md.includes('MODULO DE DOMINIO 009')) {
  const anchor = '## REGISTRO DE M';
  const idx = md.indexOf(anchor);
  if (idx < 0) throw new Error('REGISTRO anchor not found');
  md = md.slice(0, idx) + MODULE.trim() + '\n\n---\n\n' + md.slice(idx);
}

if (!md.includes('Modulo de Dominio 009')) {
  md = md.replace(
    /- \*\*Modulo de Dominio 008\*\*[^\n]+\n/,
    (m) => m + '- **Modulo de Dominio 009** (v1.0): articulos a/an/the (indefinido vs definido); cuantificadores much/many, little/few, several, a lot of; contable vs no contable en ranura C; canon articulos.svg.\n'
  );
}

fs.writeFileSync(mdPath, md, 'latin1');

const CORE = `
MODULO 009 ARTICULOS/CUANTIFICADORES (ranura C; canon articulos.svg):
a/an=indefinido (1 de muchos, primera vez); the=definido (ya sabemos cual). a vs an por SONIDO (an hour, a university).
Cuantificadores: preguntar contable vs no contable. NO contable: much/little/a lot of + noun. Contable plural: many/few/several/a lot of + plural.
Errores: much people->many; few water->little; several money->much/a lot of. Frase ancla: I see a cat / The cat is black.
several=varios (plural); a lot of=mucho/muchos (flexible). Correccion: ¿contable o no? ¿primera vez o ya sabemos cual?
`;

const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v13-modulo009-articulos'");

if (!js.includes('MODULO 009 ARTICULOS')) {
  const anchor = 'ESTADOS: TENER';
  const idx = js.indexOf(anchor);
  if (idx < 0) throw new Error('ESTADOS anchor not found in js');
  js = js.slice(0, idx) + CORE.trim() + '\n\n' + js.slice(idx);
}

fs.writeFileSync(jsPath, js, 'utf8');

console.log('md 009:', md.includes('MODULO DE DOMINIO 009'));
console.log('js 009:', js.includes('MODULO 009 ARTICULOS'));
console.log('DONE');
