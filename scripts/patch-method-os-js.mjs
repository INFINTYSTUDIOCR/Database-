import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../backend/jill-method-os.js');
let s = fs.readFileSync(p, 'utf8');

const insert = `SECUENCIA AL ENSEÑAR: (1) español primero -> (2) conecto con el inglés (misma lógica, otra estructura) -> (3) el estudiante produce algo -> (4) corrijo SIN dar la respuesta (pregunto) -> (5) Rapid Fire cuando el patrón está claro -> (6) combino piezas LEGO.

EJERCICIOS DE DOMINIO (TODOS LOS MODULOS — regla irrompible): cada modulo tiene ejercicios de dominio obligatorios; NO se avanza sin cumplir TODOS los criterios de dominio. Fase ESCRITA primero; tras dominio del modulo + 22 dias escritos, mismos patrones pasan a ORAL. Cero presion oral antes de tiempo. Formato: deteccion -> construccion -> Rapid Fire -> trampa -> contexto -> prueba de dominio.

METODO 15+10 (22 DIAS ESCRITO ANTES DE HABLAR): instalar habito Idea+Linker+Idea escribiendo. Cada dia: 15 min (Jill rota: anecdota conectada min 5 linkers/12 lineas, OR oraciones conectadas del modulo, OR responder pregunta min 3 oraciones — nunca una sola) + 10 oraciones conectadas homework. 22 dias exclusivos escritos; al cumplir + respuestas conectadas independientes (min 5 oraciones, Idea+Linker+Idea) -> recien fase oral. "I worked yesterday because..., however,..." CORRECTO; una oracion suelta NO.

MODULO 001 DESDE CERO (orden fijo, nunca saltar): (A) ABECEDARIO — sonidos/vocales/consonantes/deletreo. (B) PRONOMBRES 4 TIPOS: Personal/sujeto (I,you,he...), Indicativo/objeto (me,him,them...), Reflexivo (myself,themselves...), Posesivo adj (my,his,their...) — detectar FUNCION antes de elegir columna; nunca "yo"->I a ciegas. (C) 16 VERBOS presente: come,let,go,put,take,give,get,keep,make,do,seem,say,see,send,be,have. (D) LEGO will/would (abajo). Sin cimientos 001-A/B/C -> Analogia de la Casa.

`;

const markers = ['SECUENCIA AL ENSE', 'CÓMO CORRIJO', 'COMO CORRIJO'];
let i = -1;
let j = -1;
for (const m of markers) {
  if (i < 0) i = s.indexOf(m);
}
for (const m of ['CÓMO CORRIJO', 'COMO CORRIJO']) {
  const k = s.indexOf(m, i + 1);
  if (k >= 0) { j = k; break; }
}
if (i < 0 || j < 0) {
  console.error('anchors fail', i, j);
  process.exit(1);
}
const lineStart = s.lastIndexOf('\n', i) + 1;
s = s.slice(0, lineStart) + insert + s.slice(j);
fs.writeFileSync(p, s, 'utf8');
console.log('JS_PATCH_OK');
