/**
 * Q7 — 14-cycle PTT state-machine pressure test (no browser required).
 */
function simulatePttSession() {
  var active = false;
  var sent = false;
  var stopLock = false;
  var transcript = 'hello world';
  var sends = 0;

  function stop(send) {
    if (!active) return 'noop';
    if (send && stopLock) return 'dup-stop';
    if (send) stopLock = true;
    active = false;
    var text = transcript;
    if (send && text && !sent) {
      sent = true;
      sends++;
    }
    if (send) stopLock = false;
    return send ? 'sent' : 'cancel';
  }

  function start() {
    if (active) return 'blocked';
    sent = false;
    stopLock = false;
    active = true;
    return 'started';
  }

  return { start: start, stop: stop, sends: function () { return sends; }, isActive: function () { return active; } };
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
  assert(mic.sends() === 1, 'cycle ' + cycle + ' one send');
  assert(mic.stop(true) === 'noop', 'cycle ' + cycle + ' second stop noop');
  assert(mic.start() === 'started', 'cycle ' + cycle + ' restart');
  assert(mic.stop(true) === 'sent', 'cycle ' + cycle + ' second turn sends');
  assert(mic.sends() === 2, 'cycle ' + cycle + ' two sends total');
  assert(!mic.isActive(), 'cycle ' + cycle + ' not stuck active');
}

console.log('PTT pressure: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
