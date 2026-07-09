import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let s = fs.readFileSync(mdPath, 'latin1');

if (s.includes('006-C') && s.includes('THERE IS')) {
  console.log('MD_ALREADY_HAS_006C');
  process.exit(0);
}

const mod006c = `
---

## MODULO DE DOMINIO 006-C — THERE IS / THERE ARE (HAY ? EXISTE)

**Concepto central (firma John — despues de in/on/at):** en espanol decimos **hay** para decir que algo **existe** o **aparece** en un lugar (*hay un gato, hay problemas, habia gente, habra tiempo*). El hispanohablante traduce literal ? "it has a cat", "have cats", "there have" ? error. En ingles la existencia **no va con have** — va con **there + be**. Canon visual: \`assets/canon/there-existencial.svg\`.

**La formula (pieza aparte — NO es P+V+C del sujeto):**
\`\`\`
THERE + BE + C
\`\`\`
- **there** = marcador de existencia (= el "hay" espanol)
- **BE** = am / is / are / was / were / will be / would be / has been / have been … segun **tiempo** y **singular/plural**
- **C** = lo que existe (a cat / three cats / a problem / many people)

**Puente espanol (detectar HAY antes de producir):**

| Espanol | Ingles |
|---------|--------|
| hay un gato / hay una reunion | there **is** a cat / a meeting |
| hay gatos / hay problemas | there **are** cats / problems |
| habia gente / habia un error | there **were** people / there **was** an error |
| habra tiempo / habra cambios | there **will be** time / changes |
| habria un problema | there **would be** a problem |
| ha habido un error | there **has been** an error |
| ha habido retrasos | there **have been** delays |

**Regla de acuerdo (pregunta Jill):** mira el **sustantivo despues del be** — singular ? is/was/has been/will be · plural ? are/were/have been. *There is a book* pero *There are books*.

**Metodo moneda en preguntas (misma logica que afirmacion/pregunta):**
- Afirmacion: There **is** a meeting tomorrow.
- Pregunta: **Is** there a meeting tomorrow? (el **be** sube al frente — moneda)
- **Are** there any questions?
- **Was** there a problem?
- **Were** there many people?
- **Will** there be time?
- **Would** there be a problem?
- **Has** there been progress?
- **Have** there been delays?

**there is vs it is (trampa clasica):**
- *There is a cat on the table* = **existe** un gato (existencia + lugar en C con prep 006).
- *It is a cat* = **identificacion** (eso es un gato).
Pregunta Jill: "¿Estoy diciendo que **existe** algo, o **que es** algo?"

**Combinar con prep 006/006-B en C:** There is a book **on** the table **in** the room. There was a meeting **on** Monday **at** 5 pm.

**Frase ancla:** \`There is a book on the table, but there are no pens — is there a pencil anywhere?\`

**Ejercicios de dominio:**
1. Jill dice espanol con "hay" ? estudiante arma there + be ANTES de elegir is/are/was/were.
2. Acuerdo singular/plural Rapid Fire (12 items).
3. Preguntas moneda: Is/Are/Was/Were/Will/Would/Has/Have there…
4. Trampa there is vs it is / have.
5. Contexto escrito: describir una sala (there is/are + in/on/at del 006).

**Dominio:** detecta "hay" ? there+be sin have · acuerdo is/are/was/were · preguntas con moneda · distingue existencia vs identificacion · combina con prep en C.

**Errores frecuentes:** "have a cat" por hay ? "¿Existencia o posesion? -> there is" · "there is cats" ? "¿Singular o plural despues del be?" · "Is there are" ? "Moneda: solo un be al frente" · "there have people" ? "Hay = there + be, no have".

`;

const m7 = s.indexOf('DOMINIO 007');
const insertAt = s.lastIndexOf('---', m7);
if (insertAt < 0) throw new Error('007 anchor fail');
s = s.slice(0, insertAt) + mod006c + s.slice(insertAt);

const regLine = '- **Modulo de Dominio 006-B**';
const regIdx = s.indexOf(regLine);
if (regIdx < 0) throw new Error('registry 006-B fail');
const lineEnd = s.indexOf('\n', regIdx);
const regEntry = '- **Modulo de Dominio 006-C** (v1.0): there is/are (hay?existe); there+be+C; was/were/will be/would be/has been; preguntas moneda Is/Are/Was/Will there; vs it is; canon there-existencial.svg; despues prep 006/006-B.\n';
s = s.slice(0, lineEnd + 1) + regEntry + s.slice(lineEnd + 1);

fs.writeFileSync(mdPath, s, 'latin1');
console.log('MD_006C_OK');
