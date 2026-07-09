import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MSI = 'MSI\xAE';
const EM = '\x9D';

const NEW_SECTIONS = `
## F0 MATRIZ DE DOMINIO (GATE PR${EM}PS${EM}PC${EM}PRP${EM}PPC${EM}MOD)

**Proposito:** despues de modulos 001-008, el alumno **practica la matriz** hasta que armar tiempos sale **natural** ${EM} sin traducir. Es el puente entre teoria MSI y **hablar con base**.

**Matriz:** 7 pronombres x **16 verbos operativos** (be, have, do, work, study, go, make, take, get, see, know, think, want, need, say, tell) x **6 columnas**:

| Col | Sigla | Formula |
|-----|-------|---------|
| 1 | **PR** | P + V + C |
| 2 | **PS** | P + V en pasado + C |
| 3 | **PC** | P + to be + V+ing + C |
| 4 | **PRP** | P + have/has + participio + C |
| 5 | **PPC** | P + have/had + been + V+ing + C |
| 6 | **MOD** | P + M + V + C |

**Nota:** los 16 de **Modulo 001-C** (come, go, take, seem...) son los irregulares esenciales de cero total. La **matriz F0** usa los 16 **operativos** de arriba para el gate ${EM} misma mecanica MSI, distinto set de practica.

**Gate (no avanzar sin cumplir TODO):**
1. **100% celdas** ${EM} cada combinacion P x verbo x columna con **3 aciertos** seguidos.
2. **Tiempo de respuesta** ${EM} promedio bajo 15s (meta 12s).
3. **Pulse quiz** Foundations aprobado (estructura, tiempos, prep, moneda).
4. **Anecdota de cuaderno** 15 min escrita, leida, evaluada por Jill (ranuras + coherencia).
5. **22 dias escritos** completados (Metodo 15+10) ${EM} recien habilita **fase oral/conversacion**.
6. **Fase conversacion** con Jill ${EM} dialogo sostenido sin errores graves de tiempo/coordinacion.
7. **Graduacion a Alice** ${EM} Jill **solicita**; estudiante/trainer **confirma** (nunca automatico).

**Metodo moneda en matriz:** cada columna incluye afirmacion + pregunta (V|P vs P|V). Canon: \`assets/canon/moneda.svg\`.

---

## LINKERS ESCRITOS MINIMOS (FOUNDATIONS) VS ALICE

**Foundations (Jill) ${EM} escrito y oral basico:**
- **and, but, because, so** ${EM} conectar **dos ideas** con estructura MSI ya dominada.
- Desde **PC (Col 3)** en matriz: minimo **and/but** en coordinacion oral con Jill.
- **NO enseñar ni exigir** en Foundations: however, furthermore, on top of that, in addition, nevertheless ${EM} eso es **territorio Alice** (Idea+Linker+Idea avanzado).

**Ejemplo correcto Foundations (escrito 15+10):**
\`I worked yesterday because I had a meeting, and it did not go as expected.\`

**Ejemplo Alice (despues de graduar):**
\`I worked yesterday because I had a meeting; however, it did not go as expected.\`

**Regla Jill en chat:** corrijo coordinacion con and/but/because/so. Si el alumno usa however en F0 ${EM} no felicito el linker; redirijo: "Eso es Alice. Ahora conecta con and, but o because."

---

## VOCABULARIO FUNCIONAL (TECHO GRADUAL)

**Regla:** vocabulario **dentro de estructuras**, nunca listas sueltas. Techo = **palabras del drill activo** + **lista activa del alumno** (max ~24 palabras en rotacion).

**Fuentes permitidas:**
1. Palabras que salen en la **matriz F0** y drills de tiempo.
2. **Lista activa** del cuaderno/anecdota (Jill cosecha las usadas).
3. **Dominios funcionales** (Work, Family, Daily, Technology, CS, Travel, Health...) ${EM} solo palabras ya introducidas en practica, reutilizadas en chunks P+V+C.

**Prohibido en Foundations:** inventar vocabulario raro fuera del drill; traducir palabra por palabra; ampliar lexico antes de cerrar gate F0.

**Jill:** si el alumno pide palabra nueva ${EM} solo si encaja en estructura del drill actual; la ancla al complemento (C), no como traduccion aislada.

---

## FASE CONVERSACION CON JILL Y GRADUACION A ALICE

**Cuando se activa:** matriz F0 100% + Pulse + anecdota evaluada + 22 dias escritos + tiempo de respuesta OK.

**Que hace Jill en fase conversacion:**
- Dialogo sostenido (min ~16 turnos en sesion evaluable).
- Evalua: tiempo verbal correcto, coordinacion (and/but), logica, esfuerzo bajo, fluidez.
- Corrige on-the-go por **ranuras MSI** ${EM} no por gramatica nominal.
- **NO gradua automaticamente.** Al cerrar sesion (modo evaluate) puede marcar \`graduation_request: true\` solo si evidencia clara en todo el transcript.

**KPIs conversacionales (Johnny):** tiempo verbal, coordinacion de ideas, logica, poco esfuerzo evidente, fluidez sostenida.

**Graduacion:** Jill solicita ${EM} alumno/trainer confirma ${EM} pasa a **Alice** (linkers largos, Idea+Linker+Idea, STAR, expansion).

**Antes de conversacion:** cero presion oral durante modulos + matriz. **Despues de conversacion exitosa:** Alice continua el camino intermedio.

`;

const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let md = fs.readFileSync(mdPath, 'latin1');

if (!md.includes('F0 MATRIZ DE DOMINIO')) {
  const anchor = '**Regla Jill:** "I worked yesterday" NO es conversacion.';
  const idx = md.indexOf(anchor);
  if (idx < 0) throw new Error('15+10 anchor not found');
  const lineEnd = md.indexOf('\n\n', idx);
  const oldLine = md.slice(idx, lineEnd);
  const newLine = '**Regla Jill:** "I worked yesterday" NO es conversacion. "I worked yesterday because I had a meeting, and it did not go as expected" ' + EM + ' CORRECTO (linkers Foundations: and/but/because/so). Escribir primero, automatizar, despues hablar.';
  md = md.slice(0, idx) + newLine + md.slice(lineEnd) + NEW_SECTIONS;
}

if (!md.includes('Modulo F0 Matriz')) {
  md += '\n- **Modulo F0 Matriz** (v1.0): gate 6 columnas PR/PS/PC/PRP/PPC/MOD; 16 verbos operativos; moneda; vocab techo; linkers minimos; fase conversacion; graduacion Alice.\n';
}

fs.writeFileSync(mdPath, md, 'latin1');

const F0_CORE = `
F0 GATE (matriz + vocab + conversacion + linkers minimos):
Matriz: 7P x 16 verbos operativos x 6 cols PR|PS|PC|PRP|PPC|MOD; 3 aciertos/celda; 100%; respuesta <15s; Pulse; anecdota cuaderno; 22 dias escritos; luego fase conversacion.
16 operativos matriz: be,have,do,work,study,go,make,take,get,see,know,think,want,need,say,tell (001-C irregulares = otro set cero total).
Linkers Foundations: and,but,because,so (escrito+oral basico). NO however/furthermore/on top of that (Alice).
Vocab techo: drill activo + lista activa alumno (~24); dominios funcionales dentro de P+V+C; no listas sueltas.
Conversacion: dialogo sostenido; KPIs tiempo/coordinacion/logica/esfuerzo/fluidez; graduation_request solo con evidencia; confirmacion manual a Alice.
`;

const jsPath = path.join(__dirname, '../backend/jill-method-os.js');
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v12-f0-gate-conversacion'");

if (!js.includes('F0 GATE')) {
  const anchor = 'Correccion: "Esto es MSI';
  const idx = js.indexOf(anchor);
  const lineEnd = js.indexOf('\n\n', idx);
  js = js.slice(0, lineEnd) + '\n' + F0_CORE.trim() + js.slice(lineEnd);
}

js = js.replace(
  /"I worked yesterday because\.\.\., however,\.\.\." CORRECTO/,
  '"I worked yesterday because I had a meeting, and it did not go as expected" CORRECTO (linkers Foundations: and/but/because/so; however = Alice)'
);

fs.writeFileSync(jsPath, js, 'utf8');

console.log('md F0:', md.includes('F0 MATRIZ DE DOMINIO'));
console.log('js F0:', js.includes('F0 GATE'));
console.log('DONE');
