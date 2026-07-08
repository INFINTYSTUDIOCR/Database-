/**
 * Smoke checks for public funnel: contact form, Hablemos demos, redirects.
 * node tests/verify-site-funnel.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const pass = (n, d) => checks.push({ ok: true, n, d });
const fail = (n, d) => checks.push({ ok: false, n, d });

function read(f) {
  return fs.readFileSync(path.join(root, f), 'utf8');
}

function main() {
  const index = read('index.html');
  const hablemos = read('hablemos.html');
  const enroll = read('js/enroll.js');
  const i18n = read('js/i18n.js');

  if (index.includes('hero-portal-lock') && index.includes('portal-access.html') && index.includes('ti-lock'))
    pass('index hero portal lock', 'present');
  else fail('index hero portal lock', 'missing');

  if (!index.includes('contactar%20Off%20The%20Clock'))
    pass('index no Off The Clock WA', 'ok');
  else fail('index no Off The Clock WA', 'still has old link');

  if (index.includes('agendar%20mi%20sesi') || index.includes('agendar mi sesión'))
    pass('index contact WA diagnostic', 'ok');
  else fail('index contact WA diagnostic', 'missing');

  const optCount = (index.match(/id="cf-program"[\s\S]*?<\/select>/)[0].match(/<option/g) || []).length;
  if (optCount >= 5) pass('index cf-program options', String(optCount));
  else fail('index cf-program options', 'expected 5, got ' + optCount);

  if (index.includes('data-i18n-es=') && index.includes('id="cf-program"'))
    pass('index cf-program i18n attrs', 'ok');
  else fail('index cf-program i18n attrs', 'missing');

  if (index.includes('claire-role') && index.includes('contact-claire-hint'))
    pass('index Claire copy', 'ok');
  else fail('index Claire copy', 'missing');

  if (index.includes('₡67.500/mes') && !index.match(/hero-tagline[\s\S]{0,200}12\.500/))
    pass('index hero price anchor', '67.500 not 12.500 in tagline');
  else fail('index hero price anchor', 'check hero-tagline');

  if (i18n.includes(':has(#cf-name)') && i18n.includes('getAttribute(\'data-i18n-es\')'))
    pass('i18n contact + program select', 'ok');
  else fail('i18n contact + program select', 'check selectors');

  if (hablemos.includes('id="en-submit"') && hablemos.includes('programLabel') && hablemos.includes('submitEnroll(programLabel)'))
    pass('hablemos demo WA label', 'wired');
  else fail('hablemos demo WA label', 'missing');

  const tryJill = read('try-jill.html');
  if (tryJill.includes('JillQuiz.mount') && tryJill.includes('demoMode'))
    pass('try-jill.html demo', 'public Rapid drill demo (brain)');
  else fail('try-jill.html demo', 'broken');

  const tryNexora = read('try-nexora.html');
  if (tryNexora.includes('solicitar=nexora') && tryNexora.includes('hablemos.html'))
    pass('try-nexora.html redirect', 'to hablemos ?solicitar=nexora');
  else fail('try-nexora.html redirect', 'broken');

  if (enroll.includes('Infinity Studio CR') && enroll.includes('document.documentElement.lang'))
    pass('enroll.js Spanish WA', 'ok');
  else fail('enroll.js Spanish WA', 'missing');

  const fails = checks.filter((c) => !c.ok);
  for (const c of checks) console.log((c.ok ? 'PASS' : 'FAIL') + '  ' + c.n + (c.d ? ' — ' + c.d : ''));
  console.log('\n' + (checks.length - fails.length) + '/' + checks.length + ' passed');
  if (fails.length) process.exit(1);
}

main();
