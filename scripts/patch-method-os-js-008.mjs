import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../backend/jill-method-os.js');
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  /const METHOD_OS_VERSION = '[^']+'/,
  "const METHOD_OS_VERSION = 'os-v7-modulo008'"
);

const oldNote = /\(Prepositions #2[^)]+\)/;
s = s.replace(oldNote, '');

const insert = `
PREPOSICIONES #2 TIEMPO in/on/at (Modulo 006-B) — mismo trio, ahora TIEMPO (canon: preposiciones-tiempo.svg; prep en ranura C):
- in = periodo largo: in March, in 2024, in summer, in the morning/afternoon.
- on = dia/fecha concreta: on Monday, on March 5th, on Christmas Day, on weekends.
- at = punto exacto: at 5 pm, at noon, at night, at Christmas (temporada/epoca), at Easter.
Fechas: ordinales on March 5th / the 5th of March; anos in 2024. Eventos: at Christmas (epoca) vs on Christmas Day (dia). "Coming at you" = at hacia objetivo. Frase ancla: "We meet on Monday in March at 5 pm". Pregunta: periodo largo, dia/fecha, o punto (hora/evento)? Errores: in Monday, at March, on 5 pm.

GET IT STRAIGHT COMPARATIVOS/SUPERLATIVOS (Modulo 008) — canon: comparativos.svg; LEGO P + V + ADJ en C:
- Comparar dos (mas…que): adj CORTO -> -er + THAN (taller than); adj LARGO -> MORE + adj + THAN; irregulares: good->better, bad->worse, far->farther.
- El #1 (el mas…): THE + -est (the tallest) o THE MOST + adj (the most important); the best/the worst.
- Igualdad (tan…como): AS + adj + AS (as tall as). Menos: less + adj; fewer + plural.
Pregunta: ¿comparo dos, el #1 del grupo, o igualdad? Errores: more good/gooder, more taller, as…than, olvida than/the.`;

const anchor = 'ESTADOS: TENER (espa';
const idx = s.indexOf(anchor);
if (idx < 0) throw new Error('anchor fail');
s = s.slice(0, idx) + insert + '\n\n' + s.slice(idx);

fs.writeFileSync(p, s, 'utf8');
console.log('JS_OK');
