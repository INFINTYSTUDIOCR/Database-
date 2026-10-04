const fs = require('fs');
require('child_process').execSync('node --check prototype-cadamag/js/motion.js', { stdio: 'inherit' });

const t = fs.readFileSync('index.html', 'utf8');
const motion = fs.readFileSync('prototype-cadamag/js/motion.js', 'utf8');
const css = fs.readFileSync('prototype-cadamag/css/prototype.css', 'utf8');

const checks = {
  heroKw: /data-holo-keyword="blanco"/.test(t),
  heroSpan: /holo-keyword[^>]*>blanco</.test(t),
  knowKw: /data-holo-keyword="creés"/.test(t),
  routesKw: /data-holo-keyword="lugar"/.test(t),
  ecoKw: /data-holo-keyword="entrena"/.test(t),
  resultsKw: /data-holo-keyword="presión"/.test(t),
  legacyLive: /data-holo-live/.test(t),
  cache: (t.match(/motion\.js\?v=([^"']+)/) || [])[1],
  sizerFn: /ensureKeywordLayers/.test(motion),
  sizerCss: /\.holo-keyword-sizer/.test(css),
  liveCss: /\.holo-keyword-live/.test(css),
  noMinWidthLock: !/el\.style\.minWidth = \(w \+ 2\)/.test(motion),
  singleRun: /ctrl\.ran/.test(motion) && !/while \(running\)/.test(motion)
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
