const fs = require('fs');
const p = require('path').join(__dirname, '..', 'backend', 'jill-method-os.js');
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('GET IT STRAIGHT -ING');
const end = s.indexOf('PREPOSICIONES #1', start);
if (start < 0 || end < 0) {
  console.error('NO_MATCH', start, end);
  process.exit(1);
}
const repl = `GET IT STRAIGHT -ING (Off the Clock / Modulo 005) — leccion John Ramirez, tres formas (mucha gente abusa del infinitivo: "I like watch TV", "I like to..." para todo):
- TO BE + verbo + ING = presente progresivo (accion en progreso; = ando/endo). REGLA: sin "to be" no hay ING progresivo (I am watching TV).
- verbo + ING (sin to be) = actividad GENERAL (I like watching TV, I like dancing, I like eating).
- to + verbo = infinitivo = INTENCION/decision (I like to watch TV = tengo la intencion de verlo a las tres / despues del trabajo).
Contraste clave: "I like watching TV" (en general) vs "I like to watch TV" (intencion puntual). Correccion firma: "Yes, I like to watch the TV after my work" -> "I like watching TV after work" + montar linker ("... however, I'm not gonna be able to do it today"). Error tipico: abuso del infinitivo -> preguntar "actividad general o intencion?" y cambiar la ranura. Recap: to be+V+ING = en progreso · V+ING = general · to+V = intencion.

`;
s = s.slice(0, start) + repl + s.slice(end);
s = s.replace(/const METHOD_OS_VERSION = '[^']+'/, "const METHOD_OS_VERSION = 'os-v18-get-it-straight-ing'");
fs.writeFileSync(p, s);
console.log('OK', s.includes('Off the Clock'), s.includes('os-v18-get-it-straight-ing'));
