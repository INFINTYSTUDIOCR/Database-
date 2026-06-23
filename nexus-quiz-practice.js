/**
 * Quiz de práctica — rotación suave por falencias (no impacta KPI oficial)
 */
(function (global) {
  'use strict';

  var REFRAME = {
    k1: [
      { q: 'When someone asks about your day, what helps you sound natural fastest?', options: ['Translate silently for 10 seconds','Start speaking right away, even with a short answer','Wait until you have the perfect sentence','Ask them to repeat in Spanish'], answer: 1, explain: 'Starting quickly builds response speed — perfection comes later.' },
      { q: '"What did you do yesterday?" — best first move?', options: ['Long pause','A short true answer immediately','Say you forgot English','Change the subject'], answer: 1, explain: 'Short and immediate beats long and perfect.' }
    ],
    k8: [
      { q: 'Which word signals contrast between two ideas?', options: ['on top of that','however','as well as','first of all'], answer: 1, explain: '"However" marks contrast — core Nexus linking.' },
      { q: 'Pick the linker that shows opposition:', options: ['therefore','however','also','then'], answer: 1, explain: 'Contrast linkers connect ideas that disagree.' }
    ],
    k9: [
      { q: '"Do you enjoy your work?" — "Yes" alone is missing what?', options: ['Nothing','Because + extra detail','A different language','Silence'], answer: 1, explain: 'Expand: Yes, because… on top of that…' },
      { q: 'Short answers should become…', options: ['Shorter','Chains: idea + linker + idea','Questions only','Repeats'], answer: 1, explain: 'Idea expansion is the Nexus habit.' }
    ],
    k13: [
      { q: 'You freeze mid-sentence. Best recovery?', options: ['Stop talking','"Let me rephrase that" and continue','Switch to Spanish only','End the call'], answer: 1, explain: 'Repair and continue — recovery ability.' },
      { q: 'After a mistake, professionals usually…', options: ['Apologize and quit','Rephrase and keep going','Pretend it did not happen','Speak louder only'], answer: 1, explain: 'Rephrase keeps the conversation alive.' }
    ]
  };

  function pickVariant(kpi, base, usedTexts) {
    var pool = [base];
    if (REFRAME[kpi]) pool = pool.concat(REFRAME[kpi]);
    var tries = 0;
    while (tries < 20) {
      var pick = pool[Math.floor(Math.random() * pool.length)];
      var key = (pick.q || '').substring(0, 40);
      if (usedTexts.indexOf(key) < 0) return pick;
      tries++;
    }
    return base;
  }

  function softGenerateQuiz(s, allowRepeat) {
    if (typeof generateQuizForStudent !== 'function') return [];
    var base = generateQuizForStudent(s, allowRepeat);
    var used = global._quizUsedTexts || [];
    var out = base.map(function (item) {
      var bank = typeof QUIZ_BANK !== 'undefined' ? QUIZ_BANK : {};
      var variant = pickVariant(item.kpi, item, used);
      used.push((variant.q || '').substring(0, 40));
      return Object.assign({ kpi: item.kpi }, variant);
    });
    global._quizUsedTexts = used.slice(-24);
    return out;
  }

  function patchPracticeQuiz() {
    if (typeof generateQuizForStudent !== 'function') return;
    var origGen = generateQuizForStudent;
    generateQuizForStudent = function (s, allowRepeat) {
      return softGenerateQuiz(s, allowRepeat);
    };
    if (typeof _buildQuizHTML === 'function' && !_buildQuizHTML._softMsg) {
      var ob = _buildQuizHTML;
      _buildQuizHTML = function (quiz, containerId) {
        return '<div class="ib ib-navy" style="margin-bottom:8px;">Práctica según tus áreas de mejora — rotación suave. <strong>No afecta KPI oficial.</strong></div>'
          + ob(quiz, containerId).replace(/No afecta tus KPIs[^<]*/, 'No afecta KPI oficial');
      };
      _buildQuizHTML._softMsg = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patchPracticeQuiz);
  else patchPracticeQuiz();

  global.NexusQuizPractice = { softGenerateQuiz: softGenerateQuiz };
})(typeof window !== 'undefined' ? window : this);
