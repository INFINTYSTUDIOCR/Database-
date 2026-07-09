import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let s = fs.readFileSync(mdPath, 'latin1');

const ruleBlock = `
## REGLA IMPERATIVA DEL METODO ù CONJUGAR ù INVERTIR ù COMBINAR ù DEMOSTRAR

**Sin excepcion en Foundations:** el alumno NO domina un modulo si solo repite una oracion modelo. Jill **obliga** practica activa en cuatro capas:

### 1. Conjugacion (pronombres x tiempos)
- **Rotar pronombres:** I, you, he, she, it, we, they ù nunca quedarse solo en *I*.
- **Rotar tiempos MSI:** PR, PS, PC, PRP, PPC, MOD (segun columna/modulo) ù el verbo (o **be** en there/to be) cambia de forma.
- **Matriz F0:** 7 pronombres x 16 verbos x 6 columnas = practica sistematica hasta naturalidad.
- **There / to be / modales:** conjugar la pieza verbal correcta (is/are/was/were/will be; am/is/are; will/would + base).

### 2. Metodo moneda ù invertir si es pregunta
- **Afirmacion:** pieza verbal a la **derecha** del sujeto (o bloque): *You **are** ready ù There **is** a cat ù She **worked** yesterday.*
- **Pregunta:** la misma pieza sube al **frente** (inversion): ***Are** you ready? ù **Is** there a cat? ù **Did** she work yesterday?*
- **Regla Jill:** cada drill de afirmacion lleva su **par pregunta** en el mismo turno o el siguiente. Nunca solo afirmaciones.
- WH-questions: la W va primero; moneda aplica al bloque auxiliar (*What **did** you say?*).

### 3. Combinar con todo lo aprendido
- Una oracion puede llevar **MSI + articulo + prep + there** en el mismo complemento: *There **is** a book **on** the table **in** the room.*
- Jill pide **combinar** modulos ya vistos (001-D, 006, 006-B, 006-C) en produccion escrita y oral ù no piezas sueltas para siempre.

### 4. Demostrar dominio al conversar con Jill
- **Fase conversacion** (post gate F0): el alumno **demuestra** en dialogo sostenido ù no recita teoria.
- Jill evalua: tiempo verbal correcto **sin nombrarlo**, preguntas con **inversion**, combinacion natural de estructuras, fluidez con poco esfuerzo evidente.
- Si falla conjugacion o pregunta sin inversion: Jill corrige con pregunta (*ùAfirmacion o pregunta? ùQue pronombre? ùQue tiempo?*) y pide **repetir en variante** (otro pronombre / otro tiempo / forma pregunta).
- **Graduacion Alice:** solo si en conversacion demuestra dominio consistente en el transcript ù no por completar modulos en papel.

**Frase operativa Jill:** *"No pienses. Ejecutalo. Ahora otro pronombre. Ahora pregunta. Ahora combinalo."*

`;

if (!s.includes('REGLA IMPERATIVA DEL METODO')) {
  const anchor = '## NOTACION MSI';
  const i = s.indexOf(anchor);
  if (i < 0) throw new Error('anchor NOTACION MSI fail');
  s = s.slice(0, i) + ruleBlock + '\n' + s.slice(i);
}

const conj006c = `
**Practica imperativa conjugacion + inversion (006-C):**
1. Jill da espanol con "hay" -> alumno produce **afirmacion** (there+be+C) **y pregunta** (be al frente) con el **mismo C**.
2. **Rotacion de tiempo:** presente (is/are) -> pasado (was/were) -> futuro (will be) -> condicional (would be) -> perfecto (has/have been) ù misma idea, distinto be.
3. **Combinar:** There are three meetings **on** Monday **at** 9 am **in** the office (006-B + 006 en C).
4. Rapid Fire: 7 items alternando afirmacion/pregunta sin pausa.
5. Conversacion: describir un lugar real ù minimo 4 oraciones there+prep; Jill pide **una en pasado y una pregunta**.

`;

if (s.includes('006-C') && !s.includes('Practica imperativa conjugacion + inversion (006-C)')) {
  const idx = s.indexOf('**Ejercicios de dominio:**', s.indexOf('006-C'));
  if (idx > 0) {
    s = s.slice(0, idx) + conj006c + s.slice(idx);
  }
}

const convUpdate = `**Que hace Jill en fase conversacion:**
- Dialogo sostenido (min ~16 turnos en sesion evaluable).
- **Obligatorio:** pedir variantes de conjugacion (otro pronombre, otro tiempo) y **preguntas con inversion** (metodo moneda) en el flujo ù no solo afirmaciones.
- **Combinar** en vivo: MSI + prep + there + articulos en el mismo turno cuando el tema lo permita.
- Evalua: tiempo verbal correcto, **preguntas invertidas**, coordinacion (and/but), logica, esfuerzo bajo, fluidez.
- Corrige on-the-go por **ranuras MSI** y por **afirmacion vs pregunta** ù no por gramatica nominal.
- **NO gradua automaticamente.** Al cerrar sesion (modo evaluate) puede marcar \`graduation_request: true\` solo si evidencia clara de **dominio demostrado** (conjugacion + inversion + combinacion) en todo el transcript.`;

if (s.includes('**Que hace Jill en fase conversacion:**')) {
  s = s.replace(
    /\*\*Que hace Jill en fase conversacion:\*\*[\s\S]*?\*\*KPIs conversacionales/,
    convUpdate + '\n\n**KPIs conversacionales'
  );
}

if (!s.includes('conjugar-invertir-combinar')) {
  s = s.replace(
    /- \*\*Modulo de Dominio 006-C\*\*[^\n]*\n/,
    (line) => line + '- **Regla imperativa metodo** (v1.0): conjugar pronombres x tiempos; moneda/inversion en preguntas; combinar modulos; demostrar dominio en conversacion Jill.\n'
  );
}

fs.writeFileSync(mdPath, s, 'latin1');
console.log('MD_CONJUGAR_OK');
