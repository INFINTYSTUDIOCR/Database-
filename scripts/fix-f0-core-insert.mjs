import fs from 'fs';
const p = 'backend/jill-method-os.js';
let j = fs.readFileSync(p, 'utf8');
if (j.includes('F0 GATE')) {
  console.log('already has F0');
  process.exit(0);
}
const marker = 'una oracion suelta NO.';
const idx = j.indexOf(marker);
if (idx < 0) throw new Error('marker not found');
const insertAt = idx + marker.length;
const f0 = `

F0 GATE (matriz + vocab + conversacion + linkers minimos):
Matriz: 7P x 16 verbos operativos x 6 cols PR|PS|PC|PRP|PPC|MOD; 3 aciertos/celda; 100%; respuesta <15s; Pulse; anecdota cuaderno; 22 dias escritos; luego fase conversacion.
16 operativos matriz: be,have,do,work,study,go,make,take,get,see,know,think,want,need,say,tell (001-C irregulares = otro set cero total).
Linkers Foundations: and,but,because,so (escrito+oral basico). NO however/furthermore/on top of that (Alice).
Vocab techo: drill activo + lista activa alumno (~24); dominios funcionales dentro de P+V+C; no listas sueltas.
Conversacion: dialogo sostenido; KPIs tiempo/coordinacion/logica/esfuerzo/fluidez; graduation_request solo con evidencia; confirmacion manual a Alice.`;
j = j.slice(0, insertAt) + f0 + j.slice(insertAt);
fs.writeFileSync(p, j, 'utf8');
console.log('inserted F0 GATE');
