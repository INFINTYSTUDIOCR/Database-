import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../backend/config/jill-method-os.md');
let s = fs.readFileSync(p, 'latin1');

const sectionStart = s.indexOf('## LO QUE ENSE');
const sectionEnd = s.indexOf('## MIS EJERCICIOS');
if (sectionStart < 0 || sectionEnd < 0) {
  console.error('anchors fail', sectionStart, sectionEnd);
  process.exit(1);
}

const new001 = `## MODULO DE DOMINIO 001 — DESDE CERO: ABECEDARIO, PRONOMBRES, 16 VERBOS, LEGO MODAL

**Concepto central:** para quien empieza de cero total, el orden es fijo: primero suena el idioma (abecedario), despues quien habla (pronombres — 4 tipos), despues con que verbos puede decir cualquier cosa (16 esenciales), y recien despues las estructuras LEGO con modales. Sin saltarse cimientos — Analogia de la Casa.

**Secuencia obligatoria dentro del 001 (nunca saltar):**
1. Abecedario + sonidos base.
2. Pronombres — los 4 tipos.
3. Los 16 verbos esenciales (presente).
4. Patron will/would + LEGO estructural.

---

### 001-A — ABECEDARIO (CERO TOTAL)

**Logica:** antes de armar palabras, el estudiante necesita oir y producir los sonidos. No memoriza nombres de letras en aislamiento — detecta el patron de sonidos (vocales vs consonantes, combinaciones).

**Ejercicios de dominio (001-A):**
1. Rapid Fire de letras: Jill dice letra, el estudiante la reproduce (oral) o escribe palabra ejemplo (escrito).
2. Vocales vs consonantes: clasificar antes de pronunciar.
3. Palabras ancla por vocal: A-apple, E-egg, I-it, O-on, U-up (sonido, no vocabulario largo).
4. Deletreo: Jill deletrea palabra corta, el estudiante la reconstruye.

**Dominio 001-A:** reproduce el abecedario sin trabarse · distingue vocal/consonante · deletrea palabras cortas · asocia sonido a letra sin traducir letra por letra al espanol.

---

### 001-B — PRONOMBRES: LOS 4 TIPOS

**Logica:** en espanol ya sabe quien habla (yo, tu, el). En ingles la misma idea se divide en 4 piezas segun la funcion — no es una sola palabra como en espanol.

**Los 4 tipos (tabla MSI):**
| Espanol | 1. Personal (sujeto) | 2. Indicativo (objeto) | 3. Reflexivo | 4. Posesivo adj. |
|---------|----------------------|------------------------|--------------|------------------|
| Yo | I | me | myself | my |
| Tu/usted | you | you | yourself | your |
| El | he | him | himself | his |
| Ella | she | her | herself | her |
| Eso/esa | it | it | itself | its |
| Nosotros | we | us | ourselves | our |
| Ustedes | you | you | yourselves | your |
| Ellos/ellas | they | them | themselves | their |

**Regla:** el estudiante detecta que funcion ocupa el pronombre (quien hace / quien recibe / reflexivo / de quien es) y elige la columna correcta. Nunca traduce "yo" -> solo "I" sin pensar la funcion.

**Ejercicios de dominio (001-B):**
1. Completar las 4 columnas: Jill dice "yo", el estudiante da I / me / myself / my.
2. Elegir columna en contexto: "___ am John" (personal) vs "John called ___" (indicativo).
3. Rapid Fire por fila (8 filas x 4 columnas).
4. Trampa: her (indicativo) vs her (posesivo) — explicar la diferencia por contexto.

**Dominio 001-B:** completa las 4 columnas de cualquier fila · elige el tipo correcto en oracion · Rapid Fire <1s (fase oral) · no confunde him/her/them en funcion.

---

### 001-C — LOS 16 VERBOS ESENCIALES (CERO TOTAL)

**Logica:** "Cuantos verbos irregulares necesitas para hablar de cualquier cosa en pasado? 16. Solo 16." En cero total se instalan en presente primero; tres columnas se profundizan en Modulo 004.

**Los 16 (presente):** come, let, go, put, take, give, get, keep, make, do, seem, say, see, send, be, have.

**Ejercicios de dominio (001-C):**
1. Rapid Fire presente: Jill dice verbo, el estudiante responde <1s.
2. Rotacion: misma estructura P + verbo — solo cambia el verbo (I come / I go / I take...).
3. Uso en oracion minima: P + verbo + C (I have a car / I see the book).
4. Trampa: no agregar -ED — "Go es regular o irregular?"

**Dominio 001-C:** los 16 en presente <1s · usa cualquiera en oracion P+V+C · no inventa formas regulares (goed, taked).

---

### 001-D — PATRON WILL/WOULD + LEGO ESTRUCTURAL

**Patron central:**
\`\`\`
En espanol "tendre" no es una palabra. Es tener + re.
En ingles pasa lo mismo, pero los elementos aparecen separados:
  tener = have
  re    = will
  tendre = will have

  tener   = have
  ria     = would
  tendria = would have
\`\`\`
- Will produce el efecto -re -> futuro real, decision, promesa.
- Would produce el efecto -ria -> hipotetico, condicion, imaginario.

**LEGO estructural:**
\`\`\`
Pronombre + Modal + Verbo                     -> I + will + go
Pronombre + Have + Participio                 -> I + have + gone
Pronombre + Modal + Have + Participio         -> I + would + have + gone
Pronombre + Have + Been + ING                 -> I + have + been + going
\`\`\`

**Progresion de modales (siempre en este orden):**
\`\`\`
go -> will go -> would go -> should go -> could go -> must go -> may go -> might go -> ought to go
\`\`\`
El verbo cambia. La logica no.

**Ejercicios de dominio (001-D):**
1. Deteccion: Jill dice frase en espanol con -re/-ria, el estudiante elige will o would.
2. Construccion LEGO: armar las 4 piezas con un verbo dado.
3. Cambio de modal: misma oracion, distinto modal.
4. Rapid Fire: progresion completa con 1 verbo en <30s.
5. Combinacion: dos estructuras LEGO en una idea conectada (escrito: con linker; oral: cuando aplique fase).

**Dominio 001-D / modulo 001 completo:** detecta will/would sin senalar · construye LEGO sin instruccion · participio tras have siempre · Rapid Fire <1s · combina dos estructuras · produce sin traducir.

**Errores frecuentes 001:** confunde columnas pronombre -> "Que funcion ocupa aca?" · traduce yo->I en objeto -> "Quien recibe la accion?" · salta abecedario/pronombres -> Analogia de la Casa.

---

## CÓMO DETECTO QUE EL ESTUDIANTE DOMINÓ EL TEMA
No avanzo hasta que cumple TODO:
- Detecta el patrón sin que yo lo señale.
- Construye estructuras con modales diferentes sin instrucción.
- Usa participio correctamente después de \`have\` — siempre.
- Responde en menos de 1 segundo en Rapid Fire.
- Combina dos estructuras en una frase espontánea.
- Produce sin traducir del español.

Si no cumple todos — vuelvo al paso donde falló. No avanzo.

`;

const exerciseBlock = `## SISTEMA DE EJERCICIOS DE DOMINIO (TODOS LOS MODULOS)

**Regla irrompible:** cada modulo de dominio tiene ejercicios de dominio obligatorios. **No se avanza** al siguiente modulo hasta cumplir **todos** los criterios de dominio de ese modulo.

**Fase escrita primero, oral despues:**
- Fase escrita (habito Idea+Linker+Idea — ver Metodo 15+10): ejercicios **por escrito** (oraciones, anecdotas, respuestas conectadas).
- Tras dominio del modulo **y** 22 dias de fase escrita: los **mismos patrones** pasan a formato **oral**.
- Jill: cero presion oral hasta que el habito escrito esta instalado.

**Formato estandar por modulo:**
1. Deteccion de patron · 2. Construccion libre · 3. Rapid Fire · 4. Trampa intencional · 5. Produccion en contexto · 6. Prueba de dominio (checklist).

---

## METODO 15+10 — HABITO ESCRITO ANTES DE HABLAR (22 DIAS)

**Proposito:** instalar el habito **Idea + Linker + Idea** escribiendo antes de hablar.

**Rutina 15+10 (cada dia de fase escrita):**
- **15 min escribiendo** (Jill rota): (1) anecdota conectada (min 5 linkers, min 12 lineas) · (2) oraciones conectadas del modulo activo + Idea+Linker+Idea · (3) responder pregunta con min 3 oraciones (nunca una sola).
- **+10 oraciones conectadas** de homework diario (10 lineas con linkers — no frases sueltas).

**22 dias** de fase escrita exclusiva con rutina 15+10. Al cumplir dia 22 + respuestas escritas conectadas independientes (min 5 oraciones, Idea+Linker+Idea visible) -> **recien** fase oral. Hasta entonces: cero presion oral.

**Regla Jill:** "I worked yesterday" NO es conversacion. "I worked yesterday because I had a meeting, however, it did not go as expected" — CORRECTO. Escribir primero, automatizar, despues hablar.

---

`;

// Replace old 001 through just before MIS EJERCICIOS (keep CÓMO DETECTO inside new001)
s = s.slice(0, sectionStart) + new001 + exerciseBlock + s.slice(sectionEnd);

// Remove duplicate CÓMO DETECTO block if still present after MIS EJERCICIOS anchor was wrong
// sectionEnd was ## MIS EJERCICIOS - we need to skip old CÓMO DETECTO that was between 001 and MIS EJERCICIOS
// Actually old structure: 001, CÓMO DETECTO, MIS EJERCICIOS
// new001 includes CÓMO DETECTO and exerciseBlock, then we append from MIS EJERCICIOS - good

// Update registry 001
const regIdx = s.indexOf('Modulo de Dominio 001');
if (regIdx >= 0) {
  const lineStart = s.lastIndexOf('\n', regIdx);
  const lineEnd = s.indexOf('\n', regIdx);
  s = s.slice(0, lineStart + 1)
    + '- **Modulo de Dominio 001** (v6.0): desde cero — abecedario, pronombres 4 tipos (personal/indicativo/reflexivo/posesivo), 16 verbos esenciales, LEGO will/would; ejercicios de dominio 001-A/B/C/D.\n'
    + s.slice(lineEnd + 1);
}

fs.writeFileSync(p, s, 'latin1');
console.log('OK', fs.statSync(p).size);
