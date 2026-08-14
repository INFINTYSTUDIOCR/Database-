/**
 * Voice must feel human: never repeat a line, never cut one mid-playback,
 * never leave the student in silence when the audio blob does not arrive.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

var pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }

var __dir = path.dirname(fileURLToPath(import.meta.url));
var src = fs.readFileSync(path.join(__dir, '../js/tts-chunks.js'), 'utf8');
var api = new Function(
  src + '\nreturn { ttsRepeatKey, ttsMakeRepeatGuard, ttsIsRepeat, ttsMarkSpoken,'
      + ' ttsResetRepeatGuard, ttsStopAudio, armTtsPlaybackWatchdog, ttsWatchdogMs,'
      + ' TTS_FETCH_STALL_MS };'
)();

// ── 1. Repeat guard ──────────────────────────────────────────
var key = api.ttsRepeatKey;
assert(key('Hello, there!') === key('hello there'), 'punctuation and case must not defeat the guard');
assert(key('  Nice   work  ') === 'nice work', 'whitespace collapses');

var guard = api.ttsMakeRepeatGuard();
var reply = 'Great job, keep going!';
assert(api.ttsIsRepeat(guard, reply) === false, 'first time a reply is never a repeat');
api.ttsMarkSpoken(guard, reply);
assert(api.ttsIsRepeat(guard, reply) === true, 'same reply twice in a turn is blocked');
assert(api.ttsIsRepeat(guard, 'Different answer.') === false, 'a different reply still speaks');
api.ttsResetRepeatGuard(guard);
assert(api.ttsIsRepeat(guard, reply) === false, 'after an interrupt the same question speaks again');

guard = api.ttsMakeRepeatGuard();
api.ttsMarkSpoken(guard, reply);
guard.at = Date.now() - 60000;
assert(api.ttsIsRepeat(guard, reply) === false, 'a genuine repeat much later is allowed');

// ── 2. Stopping a line cannot leave it playing ───────────────
var stopped = { paused: false, currentTime: 4.2, onended: function () {}, onerror: function () {},
  pause: function () { this.paused = true; } };
api.ttsStopAudio(stopped);
assert(stopped.paused === true, 'replaced line is paused');
assert(stopped.onended === null, 'replaced line cannot fire onended and advance the new queue');

// ── 3. Watchdog behaviour ────────────────────────────────────
function fakeAudio(state) {
  return Object.assign({ ended: false, paused: false, currentTime: 1, duration: 30,
    play: function () { return { catch: function () {} }; },
    pause: function () { this.paused = true; } }, state || {});
}

function runWatchdog(opts, done) {
  var busy = true;
  var audio = opts.audioAt === 0 ? opts.audio : null;
  var events = [];
  if (opts.audioAt > 0) setTimeout(function () { audio = opts.audio; }, opts.audioAt);
  var timer = null;
  api.armTtsPlaybackWatchdog({
    textLen: opts.textLen || 60,
    fetchMs: opts.fetchMs,
    clearTimer: function () { clearTimeout(timer); },
    setTimer: function (fn, d) { clearTimeout(timer); timer = setTimeout(fn, d); },
    getBusy: function () { return busy; },
    setBusy: function (v) { busy = !!v; },
    getAudio: function () { return audio; },
    setAudio: function (a) { audio = a; },
    onFetchStall: function () { events.push('stall'); return opts.stallHandled !== false; },
    onAdvance: function () { events.push('advance'); }
  });
  setTimeout(function () { clearTimeout(timer); done(events); }, opts.observeMs);
}

var pending = 3;
function finish() {
  pending--;
  if (pending) return;
  console.log('TTS smooth battery: ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}

// Blob never arrives → fall back to another voice fast, not after the full budget.
runWatchdog({ audioAt: -1, audio: null, fetchMs: 4000, observeMs: 6500 }, function (events) {
  assert(events.indexOf('stall') !== -1, 'a hung fetch must trigger the fallback voice');
  assert(events.indexOf('advance') === -1, 'a handled stall must not also drop the line');
  assert(api.ttsWatchdogMs(60) >= 75000, 'playback budget stays long for real audio');
  assert(api.TTS_FETCH_STALL_MS < api.ttsWatchdogMs(60), 'fetch budget must be shorter than playback budget');
  finish();
});

// Audio is playing normally → must not be cut.
runWatchdog({ audioAt: 0, audio: fakeAudio({ currentTime: 2, duration: 40 }), fetchMs: 1000, observeMs: 6500 },
  function (events) {
    assert(events.length === 0, 'audio still playing is never cut or advanced');
    finish();
  });

// Audio finishes → advance exactly once.
var ending = fakeAudio({ currentTime: 5, duration: 5 });
// End before the watchdog's first 3s inspection. Ending just after that inspection
// makes it correctly schedule from the remaining duration, which is not a queue bug.
setTimeout(function () { ending.ended = true; ending.paused = true; }, 2500);
runWatchdog({ audioAt: 0, audio: ending, fetchMs: 2000, observeMs: 7000 }, function (events) {
  assert(events.filter(function (e) { return e === 'advance'; }).length === 1,
    'a finished line advances the queue exactly once');
  assert(events.indexOf('stall') === -1, 'a line that played must never hit the stall path');
  finish();
});
