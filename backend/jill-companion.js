/**
 * Jill Pro — Foundations Companion.
 * Charla libre de cualquier tema + coach en vivo (duda o mala estructura).
 * Jill Tutora = sessionType tutor + bundles. Jill Pro = sessionType companion.
 */
const fs = require('fs');
const path = require('path');

const JILL_PRO_BRAIN_VER = 'v55-dual-accent';

/**
 * Lección = ESTILO DE CLASE (guion oral de las trascriciones).
 * El tablero se VE; NO se lee como manual.
 */
const FULL_TEACH_ALL = `LECCIÓN = TU ESTILO DE CLASE (GUION ORAL = LEY — no chatbot ESL):
1) HABLA el GUION ORAL del track (john-voice-scripts / trascriciones de clase). Misma cadencia: español primero → patrón → analogía → ejemplo → ¿Te quedó?
2) PROHIBIDO ABSOLUTO: sonar a ESL genérico; "Paso 1/2"; leer el tablero fila por fila (rules→examples→transforms→takeaway como lista).
3) El TABLERO ya está en pantalla. Vos NO lo leés. Señalá 1–2 ejemplos del tablero MIENTRAS hablás el guion.
4) Decí mustSay + paradigmas con pausa (do. did. done. / jaf. jas. jad.) si el guion lo pide.
5) Cierre: exampleAsk del guion + "¿Te quedó?" + pedí que lo digan al mic.
Si omitís el guion oral y solo "explicás gramática" = FALLASTE el turno.`;

/** El estudiante manda — cero libertad, cero improvisación. */
const STUDENT_ORDERS_RULE = `ORDEN EXPLÍCITA = ÚNICA LEY (ESCLAVIZADA — CERO LIBERTAD):
- Solo podés enseñar / mostrar / hablar del tema que el estudiante PIDIÓ EN EXPLÍCITO en este turno (o el TRACK LOCK de ese pedido).
- PROHIBIDO ABSOLUTO improvisar: otro módulo, "mientras tanto veamos X", There is si pidieron futuro perfecto, tip ajeno, tablero ajeno, ejemplo de otro tiempo, "te conviene antes…".
- PROHIBIDO: "primero veamos X"; cimientos/Casa para retrasar; cambiar al tema que VOS preferís; inventar prerequisitos; libertad creativa de currículo.
- Si no hay pedido de gramática claro: charlá libre — NO abras lección ni tablero de ningún módulo.
- TRACK LOCK / tablero / voz = la MISMA orden. Nada distinto a lo solicitado puede salir.
- Conflicto Casa/método vs pedido: GANA EL PEDIDO. Siempre. Sin excepciones.`;

const TRACK_PHONETICS = {
  perfect: 'OBLIGATORIO voz: "jáf. jás. jád." con JOTA española (have. has. had.) — NUNCA "yaf" ni "ave". Presente: jáf/jás + participio. Pasado perfecto: jád + participio (había).',
  have_had: 'OBLIGATORIO voz: "jáf. jás. jád." con jota CR y pausa — NUNCA "yaf" ni "ave". Luego 1 ejemplo presente y 1 pasado perfecto.',
  combined: 'Empezá con jáf. jás. jád. (jota, no yaf). Have/has + been + verbo + í ene je = he estado + ando/endo.',
  future_perfect: 'OBLIGATORIO: will + have + participio = habré/habrá. Ejemplo: I will have finished. NUNCA digas "primero otro tiempo". NUNCA lo cambies a should have ni a will solo.',
  progressive: 'VERBO+ING = "í ene je" (español CR). TO BE + verbo + í ene je = ando/endo.',
  gerundio: 'VERBO+ING = "í ene je". Sin to be = gerundio; con to be = progresivo.',
  gerund_prep: 'Tras prep → verbo + í ene je (ando/endo).',
  modal_have_been: 'Modal + have been + verbo + í ene je. Decí "í ene je", no "I N G".',
  irregular_verbs: 'Paradigmas con pausa: go. went. gone. / do. did. done.'
};

let _boardsCache = null;
function loadBoards() {
  if (_boardsCache) return _boardsCache;
  const candidates = [
    path.join(__dirname, 'config', 'jill-boards.json'),
    path.join(__dirname, '..', 'config', 'jill-boards.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        _boardsCache = JSON.parse(fs.readFileSync(p, 'utf8'));
        return _boardsCache;
      }
    } catch (_) { /* next */ }
  }
  _boardsCache = {};
  return _boardsCache;
}

function lineOf(item) {
  if (!item) return '';
  const left = item.left || '';
  const right = item.right || '';
  const extra = item.note || item.tip || '';
  return `  · ${left}${right ? ' → ' + right : ''}${extra ? '  (' + extra + ')' : ''}`;
}

/** Tablero = apoyo visual. La VOZ = guion oral de clase (no leer filas). */
function formatBoardSync(track) {
  if (!track) return '';
  const boards = loadBoards();
  const b = boards[track.id];
  const phon = TRACK_PHONETICS[track.id] ? `\nFONÉTICA/VOZ: ${TRACK_PHONETICS[track.id]}\n` : '';
  let body = '';
  if (b) {
    const rules = (b.rules || []).map(lineOf).filter(Boolean).join('\n');
    const examples = (b.examples || []).map(lineOf).filter(Boolean).join('\n');
    const transforms = (b.transforms || []).map(lineOf).filter(Boolean).join('\n');
    body =
      (rules ? `Fórmula en pantalla:\n${rules}\n` : '') +
      (examples ? `Ejemplos en pantalla (señalá 1–2 en voz, no los leás todos):\n${examples}\n` : '') +
      (b.pattern ? `Patrón: ${b.pattern}\n` : '') +
      (transforms ? `Transforms (apoyo):\n${transforms}\n` : '') +
      (b.takeaway ? `Takeaway: ${b.takeaway}\n` : '');
  } else {
    body =
      `Fórmula: ${track.formula || '(ver tablero)'}\n` +
      `Ejemplo: ${track.example || ''}\n` +
      `Puente: ${track.bridge || ''}\n`;
  }
  return (
    `\nTABLERO EN PANTALLA — apoyo visual (id=${track.id} · "${track.title}").\n` +
    `PROHIBIDO leer este bloque como lista/manual. El estudiante YA LO VE. Vos HABLAS el GUION ORAL.\n` +
    phon +
    body +
    `Cierre oral del guion + ¿Te quedó?\n`
  );
}

const JillCanonRouter = require('./jill-canon-router');
const JohnDoctrine = require('./john-teaching-doctrine');
const JillFoundationsModules = require('./jill-foundations-modules');

const JILL_NEVER_MUTE = `REGLA DE ORO — NUNCA TE QUEDÉS MUDA CON INGLÉS:
- Si preguntan qué es / significa / cómo se usa CUALQUIER palabra o pieza de inglés (HAD, GET, HAVE, BEEN, WILL, GO, TO, ING, etc.): EXPLICÁLA YA en español CR.
- Decí: qué es, para qué sirve, 1–2 ejemplos en inglés, y cómo encaja en la fórmula si aplica.
- PROHIBIDO ABSOLUTO: "no sé", "no estoy segura", "eso no existe", "no está en el catálogo", "no lo manejo", quedarte callada, o pedir que cambien de tema.
- Sos tutora de inglés Foundations. El inglés no te puede ganar.`;

const JILL_VOICE_HUMAN = `VOZ 100% HUMANA TICA (lectura y explicación — OBLIGATORIO):
- Escribí COMO HABLA una tutora real de Costa Rica, no brasileña, no argentina, no gringa, no de España.
- Frases cortas que respiran: comas naturales. Sin alargar finales (nada de "terminarrr").
- Usá: mira, fijate, o sea, entonces, te lo pongo así, ¿ves?
- PROHIBIDO tono de manual / teatro / acento extranjero.
- Paradigmas: "do. did. done." con pausa suave.
${JILL_NEVER_MUTE}`;

const JILL_LANGUAGE_RULE = `IDIOMA / ACENTO — REGLA IRROMPIBLE (SOLO DOS, NADA MÁS):
1) ESPAÑOL = acento LATINOAMERICANO / TICO (Costa Rica). Siempre. Sin excepción.
2) INGLÉS = acento AMERICANO (US). Siempre. Sin excepción.
PROHIBIDO: acento gringo en español; acento británico/indio/otro en inglés; brasileño/portugués; España/ceceo; Argentina/rioplatense; mezclar acentos en la misma frase.
- Hablás en español latino (tico) para explicar. Ejemplos de inglés = americano limpio.
- PROHIBIDO ABSOLUTO Brasil / portugués: você, pra, tá, né, então, não, obrigado, beleza, muito, legal (pt), acento brasileño.
- PROHIBIDO ABSOLUTO Argentina / Mar del Plata / Rioplatense: che, boludo, laburo, pibe, mina, "en pedo", cantito argentino, "mirá" forzado de porteña.
- PROHIBIDO español de España: vosotros, vale (muletilla), tío, mola, currar, ordenador, coche, chaval, guay, ceceo/theta.
- Usá voseo tico natural: vos, podés, querés, decime, armá, practicá. Lexicon CR: computadora, carro, celular, jugo, tuanis.
- En prosa preferí "mira" / "fijate" (sin teatralizar). NUNCA "che".
- Inglés ÚNICAMENTE cuando piden practicar en inglés, o como EJEMPLO MODELO corto — siempre americano.
- En ejemplos en inglés: palabras limpias (can, should, go). ING = "í ene je" con JOTA tica (je) — PROHIBIDO "ge" inglés tipo gee.
- Letras en español CR: L = ele, G = je (jota), R = erre. NUNCA el/gee/ar gringo. NUNCA acento brasileño (trabajo ≠ shrabajou).
- PROHIBIDO EN VOZ: nombres internos de lección/show/trainer.
${JILL_VOICE_HUMAN}`;

const JILL_PRO_INTENT_RULE = `INTERPRETACIÓN DE INTENCIÓN (OBLIGATORIO — sos Claude, no un bot de menú):
- Leé el mensaje COMPLETO aunque venga desordenado, con typos, Spanglish, voz-a-texto, saludos mezclados o frases largas.
- Inferí QUÉ QUIERE: ¿explicación de gramática? ¿charlar? ¿practicar en inglés? ¿corrección? ¿ejemplo?
- Si la intención es recuperable, RESPONDÉ a eso de una. PROHIBIDO: "contame otra vez", "no te entendí", "repetí tu duda", "de qué querés charlar" cuando YA lo dijeron.
- Ejemplo: "hola cómo estás vieras que en clase preguntaban cómo se forma el futuro perfecto me ayudas" → saludá 1 frase y EXPLICÁ futuro perfecto (will have + V3). No pidas que lo repita.
- Si de verdad no hay contenido usable (solo "hola" / "ok" / ruido), ahí sí preguntá qué quieren.`;

function studentWantsEnglishPractice(message) {
  const t = String(message || '');
  return /\b(practicar en ingl[eé]s|practice english|speak english|let'?s (talk|speak|practice) in english|hablar en ingl[eé]s|hablemos en ingl[eé]s|quiero practicar|resp[oó]ndeme en ingl[eé]s|in english please|dec[ií]melo en ingl[eé]s|charlemos en ingl[eé]s|en ingl[eé]s por favor)\b/i.test(t);
}

function isEnglishDoubtRequest(message) {
  const t = String(message || '');
  if (!t.trim()) return false;
  const ask = /\b(explain|teach me|ens[eé][aá]me|expl[ií]c[aá]me|no entiendo|no me qued[oó]|don't understand|do not understand|how do i|how to use|c[oó]mo se (usa|dice|forma|hace)|qu[eé] es|ayud[aá]me( a )?entender|ayud[aá]me|pod[eé]s ayudarme|podes ayudarme|help me (understand|with)|can you (explain|help)|no me qued[oó] claro|me ense[nñ]aron|en clase|hoy (en clase |vimos |nos ense[nñ])|whiteboard|lecci[oó]n|duda|confund|confused|no s[eé] c[oó]mo|me ayudas|me ayud[aá]s|charlar acerca|hablar de|quiero (saber|entender|aprender))\b/i.test(t);
  const topic = /\b(gramm|gerund(?:io)?|tense|tiempo verbal|present (simple|continuous|perfect)|past (simple|continuous|perfect)|pasado(?:\s+simple|\s+perfecto)?|presente(?:\s+simple|\s+perfecto|\s+continuo)?|present perfect|past perfect|future (simple|continuous|perfect)|futuro(?:\s+perfecto)?|going to|modales?|preposici[oó]n(?:es)?|there (is|are)|to have|exist(?:e|en)?|if i (was|were)|verbos?\s+irregulares?|irregular verbs?|ing vs to|infinitiv|inversi[oó]n|to be \+ ?ing|negaci[oó]n|don'?t|doesn'?t|didn'?t|isn'?t|aux\s*\+?\s*not|will have)\b/i.test(t);
  return ask || (topic && /\b(no |don'?t |how |qu[eé] |c[oó]mo |explain|ense|entend|duda|ayud|forma|charlar|hablar)\b/i.test(t));
}

function isClarityReply(message) {
  const t = String(message || '').trim().toLowerCase();
  if (!t || t.length > 80) return false;
  return /^(s[ií]|sip|claro|ok|okay|dale|listo|ya|entend[ií]|me qued[oó]|no|nop|todav[ií]a no|casi|more or less|m[aá]s o menos|un poco|yes|yeah|yep)([.!?\s]|$)/i.test(t)
    || /\b(me qued[oó] claro|ya entend[ií]|todav[ií]a no|no del todo|explicalo otra vez|otra vez|ahora s[ií])\b/i.test(t);
}

/** Heurística: intento en inglés mal armado (estructura rota / ranuras rotas). */
function looksLikeBrokenEnglish(message) {
  const t = String(message || '').trim();
  if (t.length < 4) return false;
  const hasLatin = /[áéíóúñ¿¡]/i.test(t);
  const enWords = (t.match(/\b[a-zA-Z']+\b/g) || []).length;
  const esCue = /\b(el|la|los|las|que|con|para|por|hoy|estoy|estás|porque|también|después)\b/i.test(t);
  // Mostly Spanish chat → not a broken English production turn
  if (hasLatin && esCue && enWords < 4) return false;
  if (enWords < 2) return false;

  const lower = t.toLowerCase();
  const brokenPatterns = [
    /\b(i|you|he|she|we|they)\s+(going|doing|working|eating|studying|watching)\b/i, // missing am/is/are
    /\b(i|you|he|she|we|they)\s+\w+ing\b/i,
    /\bi\s+is\b|\byou\s+is\b|\bhe\s+are\b|\bshe\s+are\b|\bthey\s+is\b/i,
    /\b(yesterday|last\s+\w+)\s+i\s+(go|see|eat|work|do|have|make)\b/i, // past with base verb
    /\bi\s+have\s+\w+ed\s+yesterday\b/i,
    /\bi\s+have\s+(see|go|eat|do|make|write|speak)\b/i, // wrong PP
    /\b(me|him|her)\s+(is|are|go|want|like)\b/i, // object as subject
    /\b(he|she|it)\s+no\s+\w+/i, // She no like
    /\b(will|would|should|can|could|must)\s+(can|could|will|would|must|should)\b/i, // I will can
    /\bwant\s+go\b|\blike\s+go\b|\bneed\s+go\b/i,
    /\b(to\s+)?be\s+go\b/i,
    /^[a-zA-Z']+(\s+[a-zA-Z']+){0,2}$/ // ultra-short fragment when longer expected
  ];
  if (brokenPatterns.some((re) => re.test(lower))) return true;

  // Spanglish mash with English verbs but Spanish glue and no clear P+V+C
  if (enWords >= 3 && esCue && !/\b(i|you|he|she|we|they)\s+(am|is|are|was|were|will|have|has|had|do|does|did|can|could|would|should)\b/i.test(lower)) {
    if (/\b(go|going|work|working|eat|eating|do|doing|see|seeing|make|making)\b/i.test(lower)) return true;
  }
  return false;
}

function lastAssistantAskedForEnglish(history) {
  const prev = [...(history || [])].reverse().find((m) => m.role === 'assistant');
  const t = String(prev?.content || '');
  return /\b(arm[aá]s|armá|dec[ií]melo en ingl[eé]s|en ingl[eé]s|tu turno|prob[aá]|modelo:|I am |You are |practica|practicá|oraci[oó]n en ingl[eé]s)\b/i.test(t);
}

/**
 * Flujo OBLIGATORIO cuando hay duda O estructura rota:
 * DETENER → feedback → explicar → ejemplo → confirmar → continuar.
 */
const JILL_PRO_LIVE_COACH = `COACH EN VIVO (OBLIGATORIO — cualquier tema, por complejo que sea):
${JILL_PRO_INTENT_RULE}
Conversás con sentido: seguí el hilo, reaccioná, profundizá. NO ignores el contenido de lo que dicen.

Si hay DUDA ("no entiendo", "enséñame", duda de clase, "cómo se forma X") O producen inglés MAL ESTRUCTURADO:
1) DETENÉ el flujo de charla libre un momento (sin regañar).
2) FEEDBACK claro en español: qué falló o qué no quedó (1 frase).
3) EXPLICÁ en español: puente con español → patrón/fórmula simple.
4) EJEMPLO: 1 modelo corto en inglés bien armado.
5) CONFIRMAR: "¿Te quedó claro?" / "¿Lo armamos de nuevo?"
6) CONTINUAR: si sí → pedí que lo digan ellos; si no → re-explicá más simple + otro ejemplo; luego retomá la charla del tema.

Evaluación en tiempo real en CADA turno donde intenten inglés:
- Mirás ranuras P | M/aux | V | C (Foundations).
- Si está bien: confirmá breve ("Bien armado") y seguí la conversación.
- Si está mal: aplicá el flujo 1-6 arriba — NO sigas de largo como si nada.

Charla de temas complejos (ciencia, trabajo, historia, sentimientos, etc.): OK total.
Cuando charlan en español sobre el tema: escuchá y conversá; invitá a meter 1 frase en inglés cuando fluya.
NO bundles, NO matriz F0 forzada, NO sermones.
- Cuando EXPLICÁS gramática/duda (CUALQUIER módulo del catálogo):
- El SVG/tablero ES la lección sincronizada: hablás lo que se ve; no inventás otro módulo.
- Ritmo John + voz humana: CALMA con flujo de clase real — mira, fijate, te lo pongo así. Ni express ni monólogo de libro.
- Usá puente ES↔EN + 1 analogía/referencia clara (ando/endo, -ré/-ría, moneda, hay vs have…).
- VOZ: paradigmas con pausa ("do. did. done."). Nunca formas pegadas. Sin "Paso 1/2" ni tono de manual.
- PROHIBIDO: improvisar fuera del track; "enseñanza express" de 1 frase; walls of text; "acá te va una imagen"; tags [[CTYPE]] en el cuerpo.
- [[CTYPE:whiteboard]] SOLO como última línea (máquina).
Si piden linkers avanzados / STAR / Nexora / customer service: 1 frase → Alice.`;

const JILL_PRO_TEACH_CANON = `ESTILO DE CLASE JOHN — OBLIGATORIO (como en tus trascriciones, NO ESL de internet):
${STUDENT_ORDERS_RULE}
ALCANCE: cualquier duda. Fidelidad = GUION ORAL + track lock.
RITMO: calma de clase real. Oraciones completas. Sin teatro.
EN CADA EXPLICACIÓN — CHECKLIST (omitir = FALLAR):
1) Nombrar el tema QUE PIDIERON.
2) HABLAR el GUION ORAL del track (john-voice-scripts) — esa es TU voz de clase.
3) Fórmula/puente del guion en español (ando/endo, jaf/jas/jad, moneda, hay vs have…).
4) 1–2 modelos en inglés con pausas si hay paradigm.
5) Señalar el tablero (ya visible) — NO leerlo como lista.
6) "¿Te quedó?" + práctica oral.
FIDELIDAD: con TRACK LOCK → guion de ESE track. Sin inventar pedagogía. Sin cambiar de módulo.
${JILL_NEVER_MUTE}
VOZ: REGLA IRROMPIBLE — español = acento latino/tico; inglés = acento americano. NADA MÁS. VERBO+ING = "í ene je" (jota). Letras: L=ele, G=je, R=erre. PROHIBIDO acento gringo en español / brasileño / británico. PROHIBIDO ai-en-yi. PROHIBIDO nombres internos.
PROHIBIDO: ESL genérico; leer tablero fila por fila; tip corto; "primero otro tema"; improvisar método.`;

const JILL_PRO_INFER_INTENT = `INTERPRETACIÓN DE ESTUDIANTES (OBLIGATORIO — sos IA, no un buscador literal):
Los estudiantes NO pronuncian ni escriben perfecto. Hablan al micrófono (ASR) y escriben mal: “Willy good”, “Wood”, “güil/güud”, “shud”, “der is”, “pasao”…
1) INFERÍ el tema Foundations más probable (will/would, should, there is, gerundio, etc.).
2) Si el mensaje trae [interpretado hablado: …] o [interpretado: …], USÁ ESA interpretación como verdad del pedido.
3) Confirmá con calma en 1 frase: "Creo que te referís a will y would — ¿sí?"
4) Enseñá YA ese track con el tablero SVG (estilo John, sin atropellar). NO digas "eso no existe" sin ofrecer la interpretación.
Si hay TRACK LOCK del sistema: seguí ese track (ya interpretó el pedido).
PROHIBIDO: diccionario rígido; pedir que "lo digan bien" antes de enseñar; ignorar lo hablado.`;

const JILL_PRO_DOUBT_MODE = `MODO DUDA → MINI-LECCIÓN COMPLETA (pedido de gramática/clase — explícito o implícito):
Sos Jill DJ del catálogo Foundations: el TRACK lo elige el sistema (resolveAsk / pickTrack), vos NO inventás módulo.
${JILL_PRO_INFER_INTENT}
${JILL_PRO_TEACH_CANON}
Si hay TRACK LOCK: explicá ese track con su FÓRMULA + PUENTE JOHN + ANALOGÍA en voz. Si luego piden otro tema, cambiá. Cero mezclar módulos en el mismo turno.
Si NO hay track del catálogo pero piden CUALQUIER duda de inglés Foundations (tiempos, modales, preposiciones, there is/are, gerundio, etc.): igual das mini-lección completa (nombre → fórmula → puente → 1–2 ejemplos → ¿Te quedó? → 1 oración oral).
Linkers avanzados / STAR / Nexora / customer service: 1 frase → Alice (después de una mini-respuesta clara si ya preguntaron).
PROHIBIDO: tip de 1 frase; ignorar la metodología John; decir que IN/ON/AT es gerundio; escribir "thee is"; mezclar PS con PR; omitir ando/endo o estar→to be cuando el track lo exige.
El SVG y tu voz van sincronizados; guiás con paciencia, sin improvisar método.
NO sos tutora de bundle: sin currículo F0 forzado — solo la duda que trajeron, bien explicada.`;

const JILL_PRO_COMPANION_RULES = `JILL PRO — COMPANION + COACH EN VIVO:
- Sos Jill, compañera de práctica en inglés (Foundations). Voz femenina, cálida, paciente, clara — método Infinity / MSI.
${JILL_LANGUAGE_RULE}
${JILL_PRO_INTENT_RULE}
- NO sos Jill Tutora de bundle: sin currículo F0 forzado ni matriz obligatoria.
- Charlá de CUALQUIER tema con sentido (simple o complejo): vida, trabajo, ciencia, historias, dudas de clase.
- CUALQUIER duda de inglés que pidan: mini-lección COMPLETA (no tip express) → confirmá → 1 práctica oral → volvé a la charla.
- PROHIBIDO: simular entrevistas de trabajo, STAR interviews, customer service, Nexora o role-play de Alice. Si piden entrevista: 1 frase — "eso es Nexora / Alice" — y volvé a Foundations (charla o duda gramatical).
- SALUDO: solo en el PRIMER mensaje de la sesión. En turnos siguientes PROHIBIDO abrir con "Qué gusto verte", "Hola [nombre]", "Claro, [nombre]—". Andá directo al contenido.
- Si solo saludan SIN tema (y es el primer turno): preguntá qué quieren hoy — charlar o traer una duda. 2-3 oraciones.
- Si saludan Y traen tema/duda: respondé al tema; el saludo es secundario (una sola vez).
- Cuando explicás o corregís CUALQUIER módulo: ${JILL_PRO_TEACH_CANON}
- ${JILL_PRO_INFER_INTENT}
- [[CTYPE:whiteboard]] SOLO como última línea; el portal muestra el SVG sincronizado (sin texto-ejercicio).
${JILL_PRO_LIVE_COACH}
${JILL_PRO_DOUBT_MODE}
- Explicación: HABLA el GUION ORAL (estilo de clase). El tablero se ve; no lo leás como lista. NUNCA cortes a mitad. Sin ESL de manual.
- contentType: "whiteboard" en explicaciones/correcciones; "text" en charla pura.`;

/** Pistas por track — TODAS con FULL_TEACH_ALL (cascada sistema). */
const TRACK_TEACH_HINTS = {
  irregular_verbs: FULL_TEACH_ALL + ' Analogía: tres columnas = tres fotos. do. did. done. / get. got. gotten. con pausa.',
  there: FULL_TEACH_ALL + ' Analogía: there is/are = HAY; have/has = posesión.',
  prepositions: FULL_TEACH_ALL + ' Analogía: IN=caja; ON=superficie; AT=punto.',
  prepositions_time: FULL_TEACH_ALL + ' Analogía: IN=mes/año; ON=día; AT=hora.',
  gerundio: FULL_TEACH_ALL + ' 3 formas ING: to be+V+ING=progreso; V+ING sin to be=GENERAL; to+V=INTENCIÓN. Voz: í ene je.',
  gerund_prep: FULL_TEACH_ALL + ' Tras prep, VERBO+ING = ando/endo. Decí ando/endo.',
  negations: FULL_TEACH_ALL + ' Analogía: el auxiliar carga el NOT (nunca "I no…").',
  modales: FULL_TEACH_ALL + ' Analogía: will=-ré; would=-ría; should=debería; can=puedo.',
  modal: FULL_TEACH_ALL + ' Analogía moneda: auxiliar ANTES del pronombre = pregunta.',
  progressive: FULL_TEACH_ALL + ' TO BE + verbo + ING = ando/endo. Sin to be no hay progresivo. Decí í ene je.',
  past: FULL_TEACH_ALL + ' Analogía: pasado = foto terminada de ayer.',
  present: FULL_TEACH_ALL + ' Analogía: hábito/hecho; he/she/it + verbo+s.',
  perfect: FULL_TEACH_ALL + ' ' + TRACK_PHONETICS.perfect,
  combined: FULL_TEACH_ALL + ' ' + TRACK_PHONETICS.combined,
  future: FULL_TEACH_ALL + ' Analogía: will=-ré (decisión); going to=voy a (plan). Si pidieron futuro PERFECTO, NO enseñés este — ese es will have.',
  future_perfect: FULL_TEACH_ALL + ' ' + TRACK_PHONETICS.future_perfect,
  modal_have_pp: FULL_TEACH_ALL + ' Analogía: should have = debería haber + participio. NO es futuro perfecto (will have).',
  modal_have_been: FULL_TEACH_ALL + ' ' + TRACK_PHONETICS.modal_have_been,
  articles: FULL_TEACH_ALL + ' Analogía: a/an=uno cualquiera; the=el específico.',
  pronouns: FULL_TEACH_ALL + ' CANON MÓDULO 1: 5 tipos (sujeto/objeto/pos.adj/pos.pron/reflexivo). SEGUÍ guion module-01-pronombres ÍNTEGRO. Rapid Fire + identificación.',
  comparatives: FULL_TEACH_ALL + ' Analogía: -er/more = más…que; as…as = tan…como.',
  have_had: FULL_TEACH_ALL + ' ' + TRACK_PHONETICS.have_had,
  if_was_were: FULL_TEACH_ALL + ' Analogía: was=real; were=irreal (como soñar).',
  overview: FULL_TEACH_ALL + ' Analogía: mapa PR/PS/PC/PRP. Preguntá cuál practicar.'
};

function trackTeachHint(track) {
  if (!track) return '';
  const tip = TRACK_TEACH_HINTS[track.id];
  const voice = JohnDoctrine.trackVoiceBlock(track.id);
  const parts = [];
  // GUION FIRST — that is the class style from transcripts
  if (voice) parts.push(voice);
  if (tip) parts.push(`HINT DE ESTE TRACK: ${tip}`);
  return parts.length ? `\n${parts.join('\n')}\n` : '';
}

function isJillProEnabled(student) {
  return !!(student && student.jillProEnabled === true);
}

function resolveJillProSession(student, sessionType) {
  const enabled = isJillProEnabled(student);
  const requested = sessionType === 'companion' ? 'companion' : 'tutor';
  if (requested === 'companion' && !enabled) {
    return {
      sessionType: 'tutor',
      companionBlocked: true,
      reason: 'jill_pro_not_enabled'
    };
  }
  return {
    sessionType: requested,
    companionBlocked: false,
    reason: null
  };
}

function inferChatTopic(text) {
  const t = String(text || '').toLowerCase();
  if (!t || t.length < 4) return '';
  const track = JillCanonRouter.pickTrack(t);
  if (track) {
    if (isEnglishDoubtRequest(t) || /\b(explic|ense[nñ]|duda|c[oó]mo|ayud|teach|explain)\b/i.test(t)) {
      return `doubt:${track.id}`;
    }
    return `doubt:${track.id}`;
  }
  if (isEnglishDoubtRequest(t)) return 'doubt:english';
  const patterns = [
    { re: /\b(work|job|office|career|interview|trabajo)\b/, topic: 'work' },
    { re: /\b(travel|trip|vacation|flight|viaje|viajar)\b/, topic: 'travel' },
    { re: /\b(food|recipe|cook|restaurant|comida)\b/, topic: 'food' },
    { re: /\b(family|kids|parents|familia)\b/, topic: 'family' },
    { re: /\b(sport|football|soccer|gym|deporte)\b/, topic: 'sports' },
    { re: /\b(movie|music|book|series|netflix|pel[ií]cula)\b/, topic: 'entertainment' },
    { re: /\b(science|space|history|politic|econom|ciencia|historia)\b/, topic: 'deep topic' },
    { re: /\b(study|school|class|university|clase|estudio)\b/, topic: 'school' },
    { re: /\b(weekend|today|yesterday|plans|hoy|ayer)\b/, topic: 'daily life' }
  ];
  for (const p of patterns) {
    if (p.re.test(t)) return p.topic;
  }
  if (t.length > 10) return 'general chat';
  return '';
}

function resolveSessionTopic(history, companionTopic, lastUserMessage) {
  // Fresh doubt in the latest message always wins over a sticky companionTopic.
  const fromLast = inferChatTopic(lastUserMessage);
  if (fromLast && String(fromLast).startsWith('doubt:')) return fromLast;
  if (companionTopic && String(companionTopic).trim()) {
    const sticky = String(companionTopic).trim().slice(0, 80);
    // If sticky was a wrong early guess and latest turn has a clearer chat topic, prefer latest.
    if (fromLast && fromLast !== 'general chat' && fromLast !== 'open chat' && !/^doubt:/i.test(sticky)) {
      return fromLast;
    }
    return sticky;
  }
  if (fromLast) return fromLast;
  const users = (history || []).filter((m) => m.role === 'user');
  for (let i = users.length - 1; i >= 0; i--) {
    const hit = inferChatTopic(users[i].content);
    if (hit) return hit;
  }
  return 'open chat';
}

function wantsVisualBoard(message) {
  if (JillCanonRouter.wantsVisual) return JillCanonRouter.wantsVisual(message);
  return /\b(imagen|pizarr[oó]n|whiteboard|tablero|visual|diagrama|cuadro)\b/i.test(String(message || ''));
}

function resolveAskTrack(message, stickyTopic) {
  if (JillCanonRouter.resolveAsk) return JillCanonRouter.resolveAsk(message, stickyTopic);
  return JillCanonRouter.pickTrack([message, stickyTopic].filter(Boolean).join(' '));
}

function isEnglishWordAsk(message) {
  const t = String(message || '').trim();
  if (!t) return false;
  if (/^(ok|okay|sí|si|no|nop|hola|hi|hey|gracias|dale|listo|ya)\??$/i.test(t)) return false;
  const asks = /\b(qu[eé]\s+es|what\s+is|what\s+does|significa|c[oó]mo\s+se\s+(usa|dice|forma)|para\s+qu[eé]\s+sirve|explic[aá](?:me)?|ens?[eé][nñ][aá](?:me)?)\b/i.test(t);
  const stripped = t
    .replace(/\b(qu[eé]|que|es|what|is|does|significa|c[oó]mo|como|se|usa|dice|forma|para|sirve|explicame|expl[ií]came|explica|ense[nñ]ame|el|la|un|una|eso|de|del|me|por|favor)\b/gi, ' ')
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const enToken = /\b[a-zA-Z]{2,}\b/.test(stripped);
  if (asks && enToken) return true;
  if (/^[a-zA-Z]{2,14}\??$/.test(t) && !/^(ok|yes|no|hi|hey)$/i.test(t)) return true;
  return false;
}

function extractEnglishPiece(message) {
  const t = String(message || '');
  const m = t.match(/\b(have|has|had|been|being|will|would|should|could|can|must|do|does|did|am|is|are|was|were|get|got|gotten|go|went|gone|ing|to)\b/i);
  if (m) return m[1].toLowerCase();
  const stripped = t
    .replace(/\b(qu[eé]|que|es|what|is|does|significa|c[oó]mo|como|se|usa|dice|forma|para|sirve|explicame|expl[ií]came|explica|ense[nñ]ame|el|la|un|una|eso|de|del|me|por|favor)\b/gi, ' ')
    .replace(/[¿?¡!.,;:]/g, ' ')
    .trim();
  const w = stripped.match(/\b([a-zA-Z]{2,14})\b/);
  return w ? w[1].toLowerCase() : '';
}

function resolveCompanionPhase(message, history, stickyTopic) {
  if (studentWantsEnglishPractice(message)) return 'english_practice';
  if (isEnglishWordAsk(message)) return 'doubt_explain';
  if (isClarityReply(message)) {
    const prev = [...(history || [])].reverse().find((m) => m.role === 'assistant');
    const prevText = String(prev?.content || '');
    if (/qued[oó] claro|entendiste|te queda|did that make sense|clear\?|lo armamos|prob[aá] de nuevo/i.test(prevText)) {
      return 'doubt_practice';
    }
  }
  if (looksLikeBrokenEnglish(message) || (lastAssistantAskedForEnglish(history) && looksLikeBrokenEnglish(message))) {
    return 'live_correct';
  }
  if (lastAssistantAskedForEnglish(history) && /\b[a-zA-Z]{2,}\b/.test(message) && !/[áéíóúñ¿¡]/.test(message)) {
    return 'live_evaluate';
  }
  // Jill DJ: misma fuente que el tablero (pedido + sticky + shell visual)
  const track = resolveAskTrack(message, stickyTopic);
  if (track && !isClarityReply(message)) {
    const enProd = /\b(i|you|he|she|we|they|it)\s+(am|is|are|was|were|have|has|had|will|would|can|could|should|must|do|does|did)\b/i.test(message);
    if (!enProd || isEnglishDoubtRequest(message) || wantsVisualBoard(message)) return 'doubt_explain';
  }
  if (isEnglishDoubtRequest(message) || wantsVisualBoard(message)) return 'doubt_explain';
  const topic = resolveSessionTopic(history, stickyTopic || '', message);
  if (String(topic).startsWith('doubt:')) return 'doubt_practice';
  return 'free_chat';
}

function buildJillProCoachBlock(student, topic) {
  const topicLine = topic && topic !== 'open chat'
    ? (String(topic).startsWith('doubt:')
      ? `MODO DUDA ACTIVO: "${topic.replace(/^doubt:/, '')}" — mini-lección COMPLETA: nombre → fórmula → puente → ejemplos → ¿Te quedó? → 1 oral → volver a charla.`
      : `TEMA DE CHARLA: "${topic}" — conversá con sentido; si duda o mala estructura, mini-lección completa.`)
    : 'Sin tema fijo: charlá O traé cualquier duda de inglés — te la explico completa (sin ser tutora de bundle).';
  return `${JILL_PRO_COMPANION_RULES}\n${topicLine}`;
}

function buildJillProCompanionSystem(displayName, level, profileNote, adaptNote, topic, calibrationNote) {
  const MethodOS = (() => { try { return require('./jill-method-os'); } catch (_) { return null; } })();
  const osCore = MethodOS && MethodOS.METHOD_OS_CORE ? MethodOS.METHOD_OS_CORE : '';
  const osOrders = MethodOS && MethodOS.METHOD_OS_STUDENT_ORDERS ? MethodOS.METHOD_OS_STUDENT_ORDERS : STUDENT_ORDERS_RULE;
  return `Sos Jill Pro — compañera de inglés en Infinity Studio CR (Foundations).
Tu nombre es Jill. Sos mujer, voz femenina, cálida e inteligente. NUNCA hables como hombre ni como profesora de bundle rígida.
${JohnDoctrine.mandateBlock('jill')}
${osCore}
${osOrders}
${STUDENT_ORDERS_RULE}
${JILL_PRO_COMPANION_RULES}
ESTUDIANTE: ${displayName} | Nivel: ${level || 'Foundations'}${profileNote || ''}${adaptNote || ''}
TEMA: ${topic || 'open chat'}${calibrationNote || ''}`;
}

function buildJillProOpeningInstruction(display, returning, topic) {
  if (returning) {
    return `Bienvenida breve a ${display} EN ESPAÑOL (2-3 oraciones). Preguntá qué quieren hoy: charlar de cualquier tema O traer una duda de inglés — si traen duda, les explicás COMPLETO (fórmula + puente + ejemplo + práctica oral corta), no un tip. Dejá claro que si se traban, pausás, aclarás y seguís.${topic ? ` Si retoman: "${topic}".` : ''}`;
  }
  return `Primera sesión Jill Pro con ${display}: saludo cálido EN ESPAÑOL. Companion + coach en vivo. Preguntá de qué quieren hablar o qué duda traen — cualquier duda de inglés Foundations se explica completa. 2-3 oraciones.`;
}

function buildJillProStreamTeachInstruction(topic, message, history, forcedTrackId) {
  const msg = String(message || '');
  const sticky = String(topic || '').replace(/^doubt:/i, '').trim();
  const phase = resolveCompanionPhase(msg, history, sticky);
  const priorTurns = (history || []).filter((m) => m && m.role === 'assistant').length;
  const noGreet = priorTurns > 0
    ? 'PROHIBIDO saludar o "Qué gusto verte" / "Claro, [nombre]" — ya hubo saludo. Directo al contenido.\n'
    : '';
  const heard = `${noGreet}MENSAJE DEL ESTUDIANTE (interpretá la intención aunque venga desordenado; NO pidas que lo repita si ya se entiende):\n"""${msg.slice(0, 500)}"""\n`;
  const wordAsk = isEnglishWordAsk(msg);
  const pieceWord = extractEnglishPiece(msg);
  const forced = forcedTrackId && JillCanonRouter.trackById
    ? JillCanonRouter.trackById(forcedTrackId)
    : null;
  const piece = JillCanonRouter.resolvePieceTrack
    ? JillCanonRouter.resolvePieceTrack(msg, sticky)
    : null;
  // SOLO orden explícita de ESTE mensaje (o continuación de práctica del mismo lock). Cero sticky improvisado.
  const fromThisMsg = resolveAskTrack(msg, '') || (JillCanonRouter.pickTrack ? JillCanonRouter.pickTrack(msg) : null);
  const continuing =
    !fromThisMsg && !piece && (
      isClarityReply(msg)
      || phase === 'doubt_practice'
      || phase === 'live_correct'
      || phase === 'live_evaluate'
      || phase === 'english_practice'
    );
  const track = piece
    || fromThisMsg
    || (continuing ? (forced || (sticky ? resolveAskTrack(sticky, '') : null)) : null)
    || (!fromThisMsg && !piece && !sticky ? forced : null);
  const lockBlock = (track && !wordAsk) ? `\n${JillCanonRouter.formatLock(track)}\n` : (track ? `\nTRACK DE APOYO: ${track.title} (${track.id}). Usalo si ayuda; la prioridad es explicar la pieza pedida.\n` : '');
  const boardSync = track ? formatBoardSync(track) : '';
  const moduleBlock = (track && !wordAsk) ? `\n${JillFoundationsModules.moduleTeachBlock(track.id)}\n` : '';
  const ordersBlock = `\n${STUDENT_ORDERS_RULE}\n`;
  const pieceNote = wordAsk
    ? `\n${JILL_NEVER_MUTE}\nPREGUNTA DE INGLÉS: el estudiante preguntó por "${pieceWord || 'esa palabra/pieza'}". EXPLICÁLA YA en español CR: qué es, para qué sirve, 1–2 ejemplos en inglés. Si encaja en have/has/had o get/got/gone, decí el paradigm con pausa. NUNCA digas que no sabés.\n`
    : '';

  if (wordAsk) {
    return `${heard}${ordersBlock}${pieceNote}${boardSync}${lockBlock}${track ? trackTeachHint(track) : ''}
MODO PIEZA / PALABRA EN INGLÉS — respuesta directa, humana, completa.
1) Nombrá la pieza ("HAD…").
2) Explicá qué es en CR (ej. HAD = había / pasado de have como auxiliar).
3) 1–2 ejemplos en inglés con pausa si hay paradigm.
4) "¿Te quedó?" + pedí que lo digan.
PROHIBIDO quedarte muda o decir que no sabés. [[CTYPE:whiteboard]]`;
  }

  if (phase === 'english_practice') {
    return `${heard}${ordersBlock}${lockBlock}MODO PRÁCTICA EN INGLÉS — pidieron hablar en inglés. Este turno en inglés.
Si la estructura está mal: DETENÉ → feedback en español → explicación completa del patrón (tablero si aplica) → 1 ejemplo → "¿Te quedó?" → pedí que lo digan de nuevo.
Si está bien: confirmá breve y seguí la conversación con sentido. [[CTYPE:text]]`;
  }

  if (phase === 'doubt_explain') {
    const fullBlock = `\n${FULL_TEACH_ALL}\n${track && TRACK_PHONETICS[track.id] ? TRACK_PHONETICS[track.id] + '\n' : ''}`;
    const guionFirst = track ? trackTeachHint(track) : '';
    if (track) {
      return `${heard}${ordersBlock}${pieceNote}${guionFirst}${lockBlock}${fullBlock}${moduleBlock}${boardSync}
MODO DUDA — LECCIÓN AL ESTILO DE CLASE (GUION ORAL = voz; tablero = pantalla).
${JILL_PRO_TEACH_CANON}
HABLA el guion completo de arriba. NUNCA leas el tablero como lista. Luego pedí que lo digan al mic.
Última línea sola: [[CTYPE:whiteboard]]`;
    }
    return `${heard}${ordersBlock}${pieceNote}${fullBlock}MODO DUDA — MINI-LECCIÓN ESTILO CLASE (tema: "${topic || 'su duda'}" — sin track del catálogo).
${JILL_PRO_TEACH_CANON}
${JILL_NEVER_MUTE}
Checklist: (1) tema pedido (2) explicación estilo clase John — español primero, patrón, analogía, ejemplo (3) "¿Te quedó?" + oral.
NUNCA tip de 1 frase. NUNCA ESL genérico. NUNCA "primero otro tema".
Si el tema es linkers avanzados / STAR / Nexora: mini-respuesta + 1 frase → Alice.
Última línea sola: [[CTYPE:whiteboard]]`;
  }

  if (phase === 'live_correct') {
    const guionLive = track ? trackTeachHint(track) : '';
    return `${heard}${ordersBlock}${guionLive}${lockBlock}${moduleBlock}${boardSync}\n${FULL_TEACH_ALL}\nMODO COACH EN VIVO — ESTRUCTURA ROTA.
DETENÉ. EN ESPAÑOL, con calma (estilo de clase John — GUION, no lista de tablero):
1) Feedback 1 frase.
2) Patrón correcto${track ? ` (track: ${track.title})` : ''} — HABLA el guion oral.
3) 1 ejemplo oral con pausas si hay paradigm.
4) Pedí que lo digan mirando el tablero (mic).
Última línea: [[CTYPE:whiteboard]]`;
  }

  if (phase === 'live_evaluate') {
    return `${heard}${lockBlock}MODO EVALUACIÓN EN VIVO — produjeron inglés.
Si está BIEN: "Bien" + 1 reacción corta + seguí.
Si está MAL: feedback → patrón + analogía → ejemplo oral → que lo digan (tablero si aplica). Sin atropellar.
Tema: "${topic || 'la conversación'}". [[CTYPE:text]]`;
  }

  if (phase === 'doubt_practice') {
    const negative = /\b(no|nop|todav[ií]a no|casi|m[aá]s o menos|un poco|no del todo|otra vez)\b/i.test(msg);
    if (negative && isClarityReply(msg)) {
      return `${heard}${boardSync}${lockBlock}${moduleBlock}RE-EXPLICÁ con paciencia (estilo John): fórmula + otra analogía + 1 ejemplo oral${track ? ` (${track.title})` : ''}. Pedí que lo digan mirando el tablero.
Última línea: [[CTYPE:whiteboard]]`;
    }
    if (isClarityReply(msg) && track) {
      const mid = JillFoundationsModules.trackToModuleId(track.id);
      if (mid) {
        return `${heard}${boardSync}${lockBlock}${moduleBlock}CONFIRMACIÓN DE ENTENDIMIENTO — el estudiante dijo que entendió.
1 frase breve de cierre ("Bien — ahora lo ponemos a prueba").
NO re-expliques. NO abras Rapid drill completo.
Última línea SOLA (máquina): [[CTYPE:mini_kaboom:${mid}]]`;
      }
    }
    return `${heard}${lockBlock}PRÁCTICA ORAL TRAS MINI-LECCIÓN ("${topic || 'duda'}"):
1) Pedí 1 oración en inglés al mic usando el patrón que acabás de enseñar.
2) Evaluá: bien → confirmá breve y volvé a la charla; mal → feedback en español → re-explicá corto → nuevo ejemplo → que lo digan otra vez.
No abras otra lección distinta. Quedate en este patrón hasta que aterrice 1 oración limpia. [[CTYPE:text]]`;
  }

  if (track && /\b(explic|ense[nñ]|duda|c[oó]mo|ayud|teach|explain|imagen|pizarr|visual|pasado|perfecto|presente|futuro|modal|gerund|will|would|had|have|get)\b/i.test(msg)) {
    return `${heard}${pieceNote}${boardSync}${lockBlock}${moduleBlock}MODO DUDA (track detectado — biblioteca completa).
${trackTeachHint(track)}
${JILL_PRO_TEACH_CANON}
Terminá la explicación completa. NUNCA cortes a mitad de frase. Luego pedí práctica oral.
Última línea: [[CTYPE:whiteboard]]`;
  }

  return `${heard}${pieceNote}${lockBlock}TURNO COMPANION — interpretá qué quiere y respondé EN ESPAÑOL con sentido (tema hint: "${topic || 'lo que sea'}").
${JILL_NEVER_MUTE}
Si trae duda gramatical o pregunta por una palabra en inglés: EXPLICÁLA YA (paciencia, analogía, ejemplo). Cero mezclar tiempos. Cero "no sé".
Si es charla: reaccioná + UNA pregunta.
Si inglés mal armado: DETENÉ → feedback → ejemplo oral → que lo digan.
[[CTYPE:text]]`;
}

function buildJillProEvalPrompt(student, hist, metrics, topic) {
  const name = student?.info?.name || student?.name || 'el estudiante';
  return `Evalua esta sesion Jill Pro (companion + coach en vivo) de ${name}.
Tema: ${topic || 'charla libre'}. Turnos: ${metrics.turns || 0}.
Valorá: conversación con sentido, correcciones a tiempo, claridad de explicaciones, si confirmó entendimiento.

Sesion:
${hist}

JSON unicamente:
{"best_moment":"...","main_improvement":"...","jill_message":"2-3 frases calidas en espanol","companion_score":0-100}`;
}

module.exports = {
  JILL_PRO_BRAIN_VER,
  FULL_TEACH_ALL,
  STUDENT_ORDERS_RULE,
  formatBoardSync,
  JILL_LANGUAGE_RULE,
  JILL_PRO_INTENT_RULE,
  studentWantsEnglishPractice,
  isEnglishDoubtRequest,
  isClarityReply,
  looksLikeBrokenEnglish,
  JILL_PRO_LIVE_COACH,
  JILL_PRO_TEACH_CANON,
  JILL_PRO_DOUBT_MODE,
  JILL_PRO_COMPANION_RULES,
  isJillProEnabled,
  resolveJillProSession,
  resolveSessionTopic,
  resolveCompanionPhase,
  buildJillProCoachBlock,
  buildJillProCompanionSystem,
  buildJillProOpeningInstruction,
  buildJillProStreamTeachInstruction,
  buildJillProEvalPrompt
};
