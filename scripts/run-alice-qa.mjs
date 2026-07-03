/**
 * Run all Alice App #1 QA suites.
 * Usage: node scripts/run-alice-qa.mjs
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  'tests/companion-qa.mjs',
  'tests/alice-growth-qa.mjs',
  'tests/alice-full-stack-qa.mjs',
];

let failed = 0;
for (const rel of suites) {
  console.log('\n--- ' + rel + ' ---\n');
  try {
    execSync('node "' + path.join(root, rel) + '"', { stdio: 'inherit', cwd: root });
  } catch {
    failed++;
  }
}

if (failed) {
  console.error('\n' + failed + ' suite(s) failed.\n');
  process.exit(1);
}
console.log('\nAll Alice App #1 QA suites passed.\n');
