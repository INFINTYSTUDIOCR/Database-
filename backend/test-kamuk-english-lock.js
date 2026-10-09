const assert = require('assert');
const L = require('./kamuk-english-lock');

let pass = 0;
function check(name, fn) {
  fn();
  pass++;
  console.log('ok -', name);
}

check('drops Spanish ALICE tip line', () => {
  const out = L.enforceEnglishOnly('Good start, Ana! Every session counts.\nALICE: ¡Buen comienzo! Cada sesión te hace más fuerte.');
  assert.strictEqual(out, 'Good start, Ana! Every session counts.');
});

check('drops Spanish sentence inside mixed line', () => {
  const out = L.enforceEnglishOnly('Great job! Muy bien, seguí así. Now try one with "however".');
  assert.strictEqual(out, 'Great job! Now try one with "however".');
});

check('drops Spanish parenthetical', () => {
  const out = L.enforceEnglishOnly('Use "by" for deadlines (se usa para fechas límite). Try it now!');
  assert.strictEqual(out, 'Use "by" for deadlines. Try it now!');
});

check('keeps pure English untouched', () => {
  const s = 'I went to the store, however it was closed. Can you make one sentence with "however"?';
  assert.strictEqual(L.enforceEnglishOnly(s), s);
});

check('keeps English with Spanish names', () => {
  const s = 'Nice work, José! Tell me about your weekend in San José.';
  assert.strictEqual(L.enforceEnglishOnly(s), s);
});

check('keeps portal tags', () => {
  const s = 'Idea plus linker plus idea. Try one now!\n[[CTYPE:whiteboard]]\n[[BOARD:nexus_linkers]]';
  assert.strictEqual(L.enforceEnglishOnly(s), s);
});

check('all-Spanish reply becomes English fallback', () => {
  const out = L.enforceEnglishOnly('¡Hola! ¿Cómo estás hoy? Vamos a practicar un poco.');
  assert.strictEqual(out, L.KAMUK_ENGLISH_FALLBACK);
});

check('JSON passes through', () => {
  const s = '{"reply":"Hola, muy bien","contentType":"text"}';
  assert.strictEqual(L.enforceEnglishOnly(s), s);
});

check('payload: evaluation.alice_message filtered', () => {
  const body = { evaluation: { overall_score: 80, alice_message: 'Great work, Ana!\nALICE: ¡Muy bien! Seguí practicando.' } };
  L.enforceEnglishOnlyPayload(body);
  assert.strictEqual(body.evaluation.alice_message, 'Great work, Ana!');
  assert.strictEqual(body.evaluation.overall_score, 80);
});

check('payload: transcript fields untouched', () => {
  const body = { ok: true, text: 'no entiendo nada de esto' };
  L.enforceEnglishOnlyPayload(body);
  assert.strictEqual(body.text, 'no entiendo nada de esto');
});

check('stream filter drops Spanish sentence across deltas', () => {
  const f = L.createEnglishStreamFilter();
  let out = '';
  for (const d of ['Great', ' job! Muy ', 'bien, seguí así. Now ', 'try one with "however".', '\n[[CTYPE:te', 'xt]]']) out += f.push(d);
  out += f.flush();
  assert.strictEqual(out, 'Great job! Now try one with "however".\n[[CTYPE:text]]');
});

check('stream filter all-Spanish gives fallback', () => {
  const f = L.createEnglishStreamFilter();
  let out = '';
  for (const d of ['¡Hola! ', '¿Cómo estás? ', 'Vamos a practicar.']) out += f.push(d);
  out += f.flush();
  assert.strictEqual(out.trim(), L.KAMUK_ENGLISH_FALLBACK);
});

check('stream filter pure English unchanged', () => {
  const f = L.createEnglishStreamFilter();
  const parts = ['Hello there! ', 'What did you do ', 'this weekend? Tell me', ' everything.'];
  let out = '';
  for (const d of parts) out += f.push(d);
  out += f.flush();
  assert.strictEqual(out, parts.join(''));
});

check('rule mentions English-only override', () => {
  assert.ok(/100% in natural American English/.test(L.KAMUK_ENGLISH_ONLY_RULE));
});

console.log(`\n${pass} checks passed`);
