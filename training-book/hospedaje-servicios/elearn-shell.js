(function (global) {
  function mountElearn(opts) {
    opts = opts || {};
    var storageKey = opts.storageKey || 'inf_hospedaje_elearn';
    var lessons = [].slice.call(document.querySelectorAll('.lesson'));
    var i = 0;
    var bar = document.getElementById('bar');
    var meta = document.getElementById('meta-step');
    var prev = document.getElementById('prev');
    var next = document.getElementById('next');

    function show() {
      if (i >= lessons.length) i = lessons.length - 1;
      if (i < 0) i = 0;
      lessons.forEach(function (el) { el.classList.remove('on'); });
      lessons[i].classList.add('on');
      if (meta) meta.textContent = 'Lección ' + (i + 1) + ' / ' + lessons.length;
      if (bar) bar.style.width = Math.round(((i + 1) / lessons.length) * 100) + '%';
      if (prev) prev.disabled = i === 0;
      if (next) next.textContent = i === lessons.length - 1 ? 'Fin' : 'Siguiente →';
      try { localStorage.setItem(storageKey + '_step', String(i)); } catch (e) {}
    }

    if (prev) prev.onclick = function () { i--; show(); };
    if (next) next.onclick = function () {
      if (i < lessons.length - 1) { i++; show(); }
      else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    var grade = document.getElementById('grade');
    if (grade) {
      grade.onclick = function () {
        var qs = document.querySelectorAll('#quiz .q');
        var score = 0, n = 0, need = qs.length;
        qs.forEach(function (q) {
          var p = q.querySelector('input:checked');
          if (!p) return;
          n++;
          if (String(p.value) === String(q.getAttribute('data-a'))) score++;
        });
        var out = document.getElementById('quiz-out');
        if (!out) return;
        if (n < need) {
          out.className = 'result bad';
          out.textContent = 'Completá las ' + need + ' preguntas.';
          return;
        }
        var min = Math.ceil(need * 0.8);
        var ok = score >= min;
        out.className = 'result ' + (ok ? 'ok' : 'bad');
        out.textContent = ok
          ? 'Certificado: ' + score + '/' + need + '. ' + (opts.passMsg || 'Listo para práctica oral.')
          : score + '/' + need + ' — repasá las lecciones (mínimo ' + min + '/' + need + ').';
        try {
          localStorage.setItem(storageKey + '_cert', JSON.stringify({
            score: score, ok: ok, at: new Date().toISOString()
          }));
        } catch (e) {}
      };
    }
    var reset = document.getElementById('reset-q');
    if (reset) {
      reset.onclick = function () {
        document.querySelectorAll('#quiz input').forEach(function (x) { x.checked = false; });
        var out = document.getElementById('quiz-out');
        if (out) { out.className = 'result'; out.textContent = ''; }
      };
    }

    try {
      var saved = parseInt(localStorage.getItem(storageKey + '_step') || '0', 10);
      if (!isNaN(saved) && saved > 0) i = saved;
    } catch (e) {}
    show();
  }

  global.HospedajeElearn = { mount: mountElearn };
})(window);
