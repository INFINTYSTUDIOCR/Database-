const fs = require('fs');
require('child_process').execSync('node --check prototype-cadamag/js/motion.js', { stdio: 'inherit' });

const t = fs.readFileSync('index.html', 'utf8');
const checks = {
  heroKw: /data-holo-keyword="blanco"/.test(t),
  heroSpan: /holo-keyword[^>]*>blanco</.test(t),
  knowKw: /data-holo-keyword="creés"/.test(t),
  routesKw: /data-holo-keyword="lugar"/.test(t),
  ecoKw: /data-holo-keyword="entrena"/.test(t),
  resultsKw: /data-holo-keyword="presión"/.test(t),
  legacyLive: /data-holo-live/.test(t),
  cache: (t.match(/motion\.js\?v=([^"']+)/) || [])[1]
};

const fail = Object.entries(checks).filter(([k, v]) => {
  if (k === 'cache') return !v;
  if (k === 'legacyLive') return v === true;
  return !v;
});

console.log(checks);
if (fail.length) {
  console.error('FAIL', fail.map(([k]) => k));
  process.exit(1);
}
console.log('ok keyword-holo');
