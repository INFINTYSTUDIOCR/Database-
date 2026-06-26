/**
 * Q7 — PTT state-machine pressure test (no browser required).
 */
function simulatePttSession() {
  var holding = false;
  var active = false;
  var sent = false;
  var stopLock = false;
  var committed = [];
  var transcript = '';
  var sends = [];
  var restarts = 0;

  function sync() {
    transcript = committed.concat(['hello world']).join(' ').trim();
    return transcript;
  }

  function stop(send) {
    if (!holding && !active) return 'noop';
    if (send && stopLock) return 'dup-stop';
    holding = false;
    if (send) {
      stopLock = true;
      active = false;
      var text = sync();
      if (text && !sent) {
        sent = true;
        sends.push(text);
      }
      stopLock = false;
      return send ? 'sent' : 'cancel';
    }
    active = false;
    return 'cancel';
  }

  function start() {
    if (holding || active) return 'blocked';
    sent = false;
    stopLock = false;
    holding = true;
    active = true;
    committed = [];
    return 'started';
  }

  function autoStopWhileHolding() {
    if (!holding) return 'not-holding';
    active = false;
    restarts++;
    if (holding) active = true;
    return 'restarted';
  }

  return {
    start: start,
    stop: stop,
    autoStopWhileHolding: autoStopWhileHolding,
    sends: function () { return sends; },
    restarts: function () { return restarts; },
    isActive: function () { return active; },
    isHolding: function () { return holding; }
  };
}

var pass = 0;
var fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

for (var cycle = 1; cycle <= 14; cycle++) {
  var mic = simulatePttSession();
  assert(mic.start() === 'started', 'cycle ' + cycle + ' start');
  assert(mic.stop(true) === 'sent', 'cycle ' + cycle + ' first stop sends');
  assert(mic.sends().length === 1, 'cycle ' + cycle + ' one send');
  assert(mic.stop(true) === 'noop', 'cycle ' + cycle + ' second stop noop');
  assert(mic.start() === 'started', 'cycle ' + cycle + ' restart');
  assert(mic.stop(true) === 'sent', 'cycle ' + cycle + ' second turn sends');
  assert(mic.sends().length === 2, 'cycle ' + cycle + ' two sends total');
  assert(!mic.isActive(), 'cycle ' + cycle + ' not stuck active');
}

var longMic = simulatePttSession();
assert(longMic.start() === 'started', 'long session start');
assert(longMic.autoStopWhileHolding() === 'restarted', 'long session browser auto-stop restarts');
assert(longMic.autoStopWhileHolding() === 'restarted', 'long session second auto-stop restarts');
assert(longMic.isHolding(), 'long session still holding');
assert(longMic.stop(true) === 'sent', 'long session release sends');
assert(longMic.sends().length === 1, 'long session one full send after restarts');
assert(longMic.restarts() === 2, 'long session counted restarts');

console.log('PTT pressure: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
