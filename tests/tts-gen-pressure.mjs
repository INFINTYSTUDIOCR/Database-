/** TTS generation must not invalidate earlier chunks in the same speak() batch. */
var pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }

function runCycle(done) {
  var gen = 0;
  var queue = [];
  var played = [];
  function flush() {
    if (!queue.length) { done(played); return; }
    var myGen = gen;
    var chunk = queue.shift();
    setTimeout(function () {
      if (myGen === gen) played.push(chunk);
      flush();
    }, 2);
  }
  function speak(chunks) {
    gen++;
    queue = chunks.slice();
    flush();
  }
  speak(['a', 'b', 'c']);
}

var pending = 14;
for (var i = 0; i < 14; i++) {
  (function (n) {
    runCycle(function (played) {
      assert(played.join('') === 'abc', 'cycle ' + n);
      pending--;
      if (pending === 0) {
        console.log('TTS gen pressure: ' + pass + ' passed, ' + fail + ' failed');
        process.exit(fail ? 1 : 0);
      }
    });
  })(i + 1);
}
