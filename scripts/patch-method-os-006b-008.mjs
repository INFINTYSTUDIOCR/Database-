import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.join(__dirname, '../backend/config/jill-method-os.md');
let s = fs.readFileSync(mdPath, 'latin1');

// Remove stale "not yet ingested" note from 006
s = s.replace(
  /> Prepositions #2[^\n]*\n/,
  ''
);

const mod006b = `
---

## MODULO DE DOMINIO 006-B — PREPOSICIONES #2: TIEMPO (IN / ON / AT) · MESES · DIAS · FECHAS · EVENTOS

**Concepto central (continuacion del 006 — mismo trio in/on/at, ahora en TIEMPO):** en espanol otra vez mezclamos todo con "en" (*en marzo, en lunes, en Navidad, a las 5*). El ingles reparte las mismas tres piezas segun **que tan especifico** es el tiempo. Canon visual: \`assets/canon/preposiciones-tiempo.svg\`. Machote MSI: la prep va en la **ranura C** (P + V + C).

**Mapa de decision (pregunta Jill antes de producir):** "¿Es un periodo largo, un dia/fecha concreta, o un punto exacto (hora/evento)?"

| Pieza | Cuando (logica) | Ejemplos |
|-------|-----------------|----------|
| **in** | periodo largo / contenedor de tiempo | in March, in 2024, in summer, in the morning, in the afternoon |
| **on** | dia concreto / fecha en calendario | on Monday, on March 5th, on my birthday, on Christmas Day, on weekends |
| **at** | punto exacto: hora, noche, evento como momento | at 5 pm, at noon, at night, at Christmas (temporada/fiesta), at Easter |

**Puente espanol (no traducir "en" a ciegas):**
- *en marzo / en verano / en 2024* -> **in** (periodo)
- *el lunes / el 5 de marzo / en Navidad (el dia)* -> **on** (dia/fecha)
- *a las 5 / de noche / en Navidad (la epoca)* -> **at** (punto/hora/evento)

**Fechas y numeros (patron canon — ordinales en C):**
- on March **5th** / on the **5th** of March
- in **2024** (ano)
- ordinales: 1st first · 2nd second · 3rd third · 4th fourth · 21st twenty-first (cardinal + th)

**Dias y meses (dentro de oracion, no listas sueltas):**
- Days: on Monday / on Tuesday … (siempre **on** + dia)
- Months: in January … in December (siempre **in** + mes)

**Eventos (firma John — Navidad y "coming at you"):**
- **at Christmas** = la temporada/epoca festiva (punto en el calendario social)
- **on Christmas Day** = el dia 25 concreto
- **coming at you** = direccion/objetivo hacia alguien (**at** = hacia/punto de encuentro): "The ball is coming at you."

**Frase ancla:** \`We meet on Monday in March at 5 pm.\` (on=dia · in=mes como periodo · at=hora)

**Ejercicios de dominio:**
1. Clasificar tiempo: Jill da espanol ("en julio / el viernes / a las 3 / en Navidad") -> estudiante elige in/on/at y explica periodo vs dia vs punto.
2. Fechas: construir on + mes + ordinal (on September 10th).
3. Eventos: at Christmas vs on Christmas Day — explicar diferencia antes de producir.
4. Rapid Fire: 12 items mezclados (mes, dia, hora, ano).
5. En contexto (Idea+Linker+Idea escrito): "I was born in 1990, on a Monday in May, at 6 am."

**Dominio:** elige in/on/at temporal sin traducir "en" a ciegas · fechas con ordinal · distingue at vs on en eventos · usa patron dias/meses en oracion · frase ancla sin error.

**Errores frecuentes:** in Monday -> "¿Periodo o dia concreto?" · at March -> "¿Punto exacto o mes entero?" · on 5 pm -> "¿Dia o hora?" · in Christmas Day -> "¿Periodo o dia especifico?"

`;

const mod008 = `
---

## MODULO DE DOMINIO 008 — GET IT STRAIGHT: COMPARATIVOS Y SUPERLATIVOS

**Concepto central:** en espanol comparas con **mas … que** y el extremo con **el mas …**. El ingles usa **piezas distintas** segun como termina el adjetivo — no una sola regla. Canon / machote MSI: \`P + V + ADJ(comparativo/superlativo) + C\` (+ **than** / **the** segun caso). Imagen: \`assets/canon/comparativos.svg\`.

**Pregunta Jill antes de producir:** "¿Comparo dos cosas, digo el #1 del grupo, o digo que son iguales?"

**Las 3 intenciones (puente espanol):**
| Intencion | Espanol | Ingles — piezas |
|-----------|---------|-----------------|
| Comparar dos | mas … **que** | **-er + than** O **more … + than** |
| El extremo (#1) | **el/la mas** … | **the -est** O **the most** … |
| Igualdad | tan … **como** | **as … as** |

**Regla 1 — adjetivo CORTO (1-2 silabas): la palabra crece**
\`\`\`
tall -> taller -> the tallest     (Juan is taller than Pedro / the tallest in the class)
fast -> faster -> the fastest
\`\`\`
LEGO: \`P + V + adj-er + THAN + C\` · \`P + V + THE + adj-est + C\`

**Regla 2 — adjetivo LARGO (3+ silabas): pieza delante**
\`\`\`
important -> more important -> the most important
\`\`\`
LEGO: \`P + V + MORE + adj + THAN + C\` · \`P + V + THE MOST + adj + C\`

**Regla 3 — irregulares (grupo pequeno, muy usados — como los 16 verbos):**
\`\`\`
good -> better -> the best
bad -> worse -> the worst
far -> farther/further -> the farthest/furthest
little -> less -> the least (cantidad/cualidad)
many/much -> more -> the most
\`\`\`

**Less / fewer (menos):** less + adj (*less expensive*) · fewer + plural contable (*fewer students*).

**Quick recap:** -er/-est + than/the (corto) · more/the most (largo) · as…as (igualdad) · irregulares (good/bad/far…).

**Correccion firma:**
- "more good" / "gooder" -> "¿Regular o irregular? -> **better**"
- "the most bad" -> "¿Extremo de bad? -> **the worst**"
- olvida **than** -> "¿Falta la pieza que conecta con el otro?"

**Ejercicios de dominio:**
1. Clasificar adjetivo (corto/largo/irregular) ANTES de armar la frase.
2. Contraste comparativo vs superlativo: misma idea, dos piezas distintas.
3. Rapid Fire: 12 items (<1s fase oral).
4. Trampas: more cheap, more taller, as…than.
5. Contexto Idea+Linker+Idea: "This phone is cheaper than mine; however, that one is the most reliable in the store."

**Dominio:** elige -er/more/the -est/the most sin que Jill nombre gramatica · than en comparativo · the en superlativo · good/bad/worst · as…as · no more good/gooder.

**Errores frecuentes:** more taller -> "¿Corta o larga?" · as…than -> "¿Igualdad o comparacion?" · the better (sin contexto de grupo) -> "¿Comparas dos o buscas el #1?"

`;

// Insert 006-B after module 006 block (before module 007)
const m7 = s.indexOf('## M');
const m7idx = s.indexOf('DOMINIO 007', m7);
const insert006b = s.lastIndexOf('---', m7idx);
if (insert006b < 0) throw new Error('007 anchor fail');
s = s.slice(0, insert006b) + mod006b + s.slice(insert006b);

// Insert 008 before REGISTRO
const reg = s.indexOf('## REGISTRO DE M');
if (reg < 0) throw new Error('registro fail');
s = s.slice(0, reg) + mod008 + '\n' + s.slice(reg);

// Registry entries
if (!s.includes('Modulo de Dominio 006-B')) {
  s = s.replace(
    /- \*\*M[^\n]*006\*\*[^\n]*\n/,
    (line) => line
      + '- **Modulo de Dominio 006-B** (v4.1): preposiciones #2 tiempo in/on/at; meses, anos, dias, fechas ordinales, eventos (at Christmas vs on Christmas Day), coming at you; frase ancla on Monday in March at 5 pm.\n'
  );
}
if (!s.includes('Modulo de Dominio 008')) {
  s = s.replace(
    /- \*\*M[^\n]*007\*\*[^\n]*\n/,
    (line) => line
      + '- **Modulo de Dominio 008** (v7.0): comparativos y superlativos; -er/more + than, the -est/the most, as…as, irregulares good/better/best; less/fewer; LEGO P+V+ADJ en C.\n'
  );
}

fs.writeFileSync(mdPath, s, 'latin1');
console.log('MD_PATCH_OK', fs.statSync(mdPath).size);
