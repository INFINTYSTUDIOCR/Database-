import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
for (const p of ['js/simulation-corporate-learn.js', 'kamuk/js/simulation-corporate-learn.js']) {
  const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
  console.log(p, 'check', r.status === 0 ? 'ok' : r.stderr);
  const s = readFileSync(p, 'utf8');
  for (const id of ['linkers', 'affixes', 'phrasals']) {
    console.log(' ', id, s.includes("id: '" + id + "'"));
  }
  const m = s.match(/MODULE_ORDER = (\[[^\]]+\])/);
  console.log(' order', m && m[1]);
  console.log(' f23', s.includes("id: 'f23'"));
}
