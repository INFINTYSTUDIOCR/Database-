/**
 * Kaboom / Rapid drill — estructura real (no celdas PR + verbo).
 * Oraciones al derecho/reves, tiempos con variacion, transiciones.
 */
(function (global) {
  'use strict';

  var LABELS = {
    structure: 'Estructura',
    reverse: 'Derecho / reves',
    tense_var: 'Tiempos (variacion)',
    transition: 'Transiciones'
  };

  /** Correct answer is always options[0]; picker shuffles before serving. */
  var BANK = [
    // --- Estructura / orden ---
    { kpi: 'k3', category: 'structure', q: 'Arma la oracion: [yesterday / home / went / she]', options: ['She went home yesterday.', 'Yesterday she home went.', 'She yesterday went home.', 'Went she home yesterday.'], explain: 'Sujeto + verbo + complemento; yesterday al final o al inicio.' },
    { kpi: 'k3', category: 'structure', q: 'Arma la oracion: [every day / coffee / drinks / he]', options: ['He drinks coffee every day.', 'He drink coffee every day.', 'Drinks he coffee every day.', 'He every day drinks coffee.'], explain: 'He/She/It + verbo-s; frecuencia al final o antes del verbo.' },
    { kpi: 'k3', category: 'structure', q: 'Arma la pregunta: [live / where / you / do]', options: ['Where do you live?', 'Where you live?', 'Do where you live?', 'Where live you do?'], explain: 'WH + auxiliar + sujeto + verbo base.' },
    { kpi: 'k3', category: 'structure', q: 'Arma: [the report / finished / already / they / have]', options: ['They have already finished the report.', 'They have finished already the report.', 'They already have the report finished.', 'Have they finished already the report.'], explain: 'Have + (already) + participio + objeto.' },
    { kpi: 'k3', category: 'structure', q: 'Arma: [now / working / are / they]', options: ['They are working now.', 'They working are now.', 'Are they working now is.', 'They are now working are.'], explain: 'Sujeto + be + -ing + now.' },
    { kpi: 'k3', category: 'structure', q: 'Orden correcto con dos objetos:', options: ['I gave her the book.', 'I gave the book her.', 'I her gave the book.', 'Gave I her the book.'], explain: 'give + persona + cosa.' },
    { kpi: 'k3', category: 'structure', q: 'Orden con frecuencia (usually):', options: ['I usually arrive early.', 'I arrive usually early.', 'Usually arrive I early.', 'I early usually arrive.'], explain: 'Frecuencia antes del verbo principal.' },
    { kpi: 'k3', category: 'structure', q: 'Mejor oracion completa (idea + razon):', options: ['I like my job because I learn every day.', 'I like job.', 'Because I like.', 'Job good because learn.'], explain: 'Estructura: idea + because + desarrollo.' },
    { kpi: 'k3', category: 'structure', q: 'Arma: [to the office / go / I / by bus]', options: ['I go to the office by bus.', 'I go by bus to the office the.', 'Go I to the office by bus.', 'I to the office go by bus.'], explain: 'Sujeto + verbo + lugar + medio.' },
    { kpi: 'k3', category: 'structure', q: 'Cual oracion tiene estructura clara S+V+C?', options: ['She manages three accounts at work.', 'Manages she three accounts.', 'She three accounts manages.', 'Accounts she manages three.'], explain: 'Sujeto + verbo + complemento.' },
    { kpi: 'k3', category: 'structure', q: 'Arma negativo: [meat / eat / usually / I / don\'t]', options: ["I don't usually eat meat.", "I usually don't eat meat.", "Don't I usually eat meat.", "I don't eat usually meat."], explain: "don't + (usually) + verbo base." },
    { kpi: 'k3', category: 'structure', q: 'There is / There are — existencia:', options: ['There are two meetings today.', 'It has two meetings today.', 'There is two meetings today.', 'Have two meetings today.'], explain: 'Plural -> there are + sustantivo.' },

    // --- Derecho / reves (afirm <-> pregunta <-> neg) ---
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: She worked yesterday. -> Pregunta:', options: ['Did she work yesterday?', 'She did work yesterday?', 'Does she worked yesterday?', 'Worked she yesterday?'], explain: 'Pasado pregunta: Did + sujeto + verbo base.' },
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: They are working. -> Pregunta:', options: ['Are they working?', 'They are working?', 'Do they working?', 'Are working they?'], explain: 'Continuo: Are al frente.' },
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: He goes to the gym. -> Pregunta:', options: ['Does he go to the gym?', 'Does he goes to the gym?', 'Do he go to the gym?', 'Goes he to the gym?'], explain: 'Does + he + verbo base (go, no goes).' },
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: There is a meeting. -> Pregunta:', options: ['Is there a meeting?', 'There is a meeting?', 'Does there a meeting?', 'Is there are a meeting?'], explain: 'Inversion: Is + there + C.' },
    { kpi: 'k3', category: 'reverse', q: 'Pregunta: Did you finish? -> Afirmacion:', options: ['I finished.', 'I did finished.', 'I finish.', 'I finishing.'], explain: 'Did + base en pregunta; afirmacion = pasado (finished).' },
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: I like coffee. -> Negacion:', options: ["I don't like coffee.", "I doesn't like coffee.", "I am not like coffee.", "I not like coffee."], explain: "I/you/we/they + don't + base." },
    { kpi: 'k3', category: 'reverse', q: 'Afirmacion: She is ready. -> Negacion:', options: ["She isn't ready.", "She don't ready.", "She doesn't ready.", "She not is ready."], explain: 'To be: isn\'t / aren\'t (sin do).' },
    { kpi: 'k3', category: 'reverse', q: 'Negacion: They didn\'t call. -> Pregunta:', options: ['Did they call?', "Didn't they called?", 'Do they call?', 'Called they?'], explain: 'Misma moneda Did; verbo base call.' },
    { kpi: 'k3', category: 'reverse', q: 'ES -> EN: Ella no trabaja los lunes.', options: ["She doesn't work on Mondays.", "She don't work on Mondays.", "She isn't work on Mondays.", "She not works on Mondays."], explain: "She + doesn't + verbo base." },
    { kpi: 'k3', category: 'reverse', q: 'ES -> EN: ¿Estan trabajando ahora?', options: ['Are they working now?', 'Do they working now?', 'Are they work now?', 'They are working now?'], explain: 'PC pregunta: Are + sujeto + -ing.' },
    { kpi: 'k3', category: 'reverse', q: 'ES -> EN: Yo fui a la oficina ayer.', options: ['I went to the office yesterday.', 'I go to the office yesterday.', 'I have go to the office yesterday.', 'I was go to the office yesterday.'], explain: 'Pasado irregular: went.' },
    { kpi: 'k3', category: 'reverse', q: 'Pregunta: Have you been there? -> Afirmacion corta:', options: ['Yes, I have.', 'Yes, I been.', 'Yes, I do.', 'Yes, I am.'], explain: 'Respuesta corta con el mismo auxiliar: have.' },

    // --- Tiempos con variacion (misma idea, distinto tiempo) ---
    { kpi: 'k2', category: 'tense_var', q: 'Misma idea en PASADO: "I go to work every day."', options: ['I went to work yesterday.', 'I go to work yesterday.', 'I going to work yesterday.', 'I have go to work yesterday.'], explain: 'Habito presente -> evento pasado: went.' },
    { kpi: 'k2', category: 'tense_var', q: 'Misma idea en CONTINUO: "She writes emails."', options: ['She is writing emails now.', 'She writing emails now.', 'She writes emails now is.', 'She does writing emails.'], explain: 'be + -ing para ahora.' },
    { kpi: 'k2', category: 'tense_var', q: 'Misma idea en PERFECTO: "I finish the report."', options: ['I have finished the report.', 'I have finish the report.', 'I finished have the report.', 'I am finished the report.'], explain: 'have + participio.' },
    { kpi: 'k2', category: 'tense_var', q: 'Misma idea en FUTURO: "We meet the client."', options: ['We will meet the client tomorrow.', 'We will meeting the client tomorrow.', 'We meet will the client tomorrow.', 'We are meet the client tomorrow.'], explain: 'will + verbo base.' },
    { kpi: 'k2', category: 'tense_var', q: 'Cual marca HABITO (presente simple)?', options: ['He takes the bus every morning.', 'He is taking the bus right now.', 'He took the bus yesterday.', 'He has taken the bus already.'], explain: 'every morning = presente simple.' },
    { kpi: 'k2', category: 'tense_var', q: 'Cual marca AHORA (presente continuo)?', options: ['They are discussing the plan now.', 'They discuss the plan every week.', 'They discussed the plan yesterday.', 'They have discussed the plan.'], explain: 'now + be + -ing.' },
    { kpi: 'k2', category: 'tense_var', q: 'Cual marca EXPERIENCIA (presente perfecto)?', options: ['I have visited that office before.', 'I visit that office before.', 'I am visiting that office before.', 'I visit that office yesterday.'], explain: 'before / experience -> have + participio.' },
    { kpi: 'k2', category: 'tense_var', q: 'Pasado vs perfecto: "Ayer termine el informe."', options: ['I finished the report yesterday.', 'I have finished the report yesterday.', 'I finish the report yesterday.', 'I was finish the report yesterday.'], explain: 'yesterday = pasado simple (no perfecto).' },
    { kpi: 'k2', category: 'tense_var', q: 'Perfecto continuo: "He estado trabajando en esto toda la mañana."', options: ['I have been working on this all morning.', 'I have working on this all morning.', 'I am been working on this all morning.', 'I have worked on this all morning.'], explain: 'have + been + -ing. He estado trabajando = I have been working.' },
    { kpi: 'k2', category: 'tense_var', q: 'Going to (plan): "Voy a llamar al cliente."', options: ['I am going to call the client.', 'I going to call the client.', 'I will going to call the client.', 'I am go to call the client.'], explain: 'am/is/are + going to + base.' },
    { kpi: 'k2', category: 'tense_var', q: 'Condicional 2: "Si tuviera tiempo, te ayudaria."', options: ['If I had time, I would help you.', 'If I have time, I would help you.', 'If I had time, I will help you.', 'If I would have time, I help you.'], explain: 'If + pasado, would + base.' },
    { kpi: 'k2', category: 'tense_var', q: 'Elige la pareja coherente (tiempo + marcador):', options: ['She left — yesterday', 'She left — now', 'She left — every day', 'She left — usually'], explain: 'Pasado simple + yesterday.' },

    // --- Transiciones / conectores (Foundations) ---
    { kpi: 'k8', category: 'transition', q: 'Une con CAUSA: "I stayed home ___ it was raining."', options: ['because', 'however', 'despite', 'although'], explain: 'because = causa.' },
    { kpi: 'k8', category: 'transition', q: 'Une con RESULTADO: "It was late, ___ we left."', options: ['so', 'because', 'despite', 'although'], explain: 'so = resultado.' },
    { kpi: 'k8', category: 'transition', q: 'Une con CONTRASTE: "I wanted to go, ___ I was tired."', options: ['but', 'so', 'because', 'and'], explain: 'but = contraste simple.' },
    { kpi: 'k8', category: 'transition', q: 'Contraste formal: "The plan failed; ___, we learned a lot."', options: ['however', 'because', 'so', 'and'], explain: 'however = contraste entre oraciones.' },
    { kpi: 'k8', category: 'transition', q: 'Secuencia: "First we reviewed the brief. ___, we called the client."', options: ['Then', 'Because', 'Despite', 'Although'], explain: 'Then = siguiente paso.' },
    { kpi: 'k8', category: 'transition', q: 'Agregar idea: "The price is good. ___, the service is excellent."', options: ['On top of that', 'However', 'Because', 'So'], explain: 'On top of that = ademas.' },
    { kpi: 'k8', category: 'transition', q: 'Concesion: "___ it was difficult, we finished."', options: ['Although', 'Because', 'So', 'Therefore'], explain: 'Although + contraste (a pesar de que).' },
    { kpi: 'k8', category: 'transition', q: 'Causa -> resultado formal: "She prepared well; ___, she passed."', options: ['therefore', 'although', 'despite', 'but'], explain: 'therefore = por lo tanto.' },
    { kpi: 'k10', category: 'transition', q: 'Opinion + razon: "I think that ___."', options: ['the role fits me because I learn fast', 'because', 'fits me', 'I think'], explain: 'I think that + idea completa + because.' },
    { kpi: 'k8', category: 'transition', q: 'Cual une MEJOR dos ideas con contraste?', options: ['I enjoy the role. However, the commute is long.', 'I enjoy the role. Because, the commute is long.', 'I enjoy the role. So, the commute is long.', 'I enjoy the role. Then, the commute is long.'], explain: 'However marca oposicion.' },
    { kpi: 'k8', category: 'transition', q: 'Completa: "Even though it was late, ___."', options: ['we finished the report', 'we late the report', 'report finish we', 'finishing report'], explain: 'Even though + clausula completa despues.' },
    { kpi: 'k8', category: 'transition', q: 'Elige el conector de ADICION (no contraste):', options: ['as well as', 'however', 'although', 'despite'], explain: 'as well as = tambien / ademas.' }
  ];

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function withShuffledOptions(item) {
    var opts = (item.options || []).slice();
    var correctIdx = item.answer != null ? item.answer : 0;
    var correct = opts[correctIdx];
    var uniq = [];
    var seenOpt = {};
    opts.forEach(function (o) {
      var k = String(o || '');
      if (seenOpt[k]) return;
      seenOpt[k] = true;
      uniq.push(o);
    });
    if (uniq.indexOf(correct) < 0 && correct) uniq.unshift(correct);
    opts = shuffle(uniq);
    var answer = opts.indexOf(correct);
    if (answer < 0) answer = 0;
    return {
      kpi: item.kpi || 'k3',
      category: item.category || 'structure',
      topic: item.topic || ('structure-' + (item.category || 'structure')),
      q: item.q,
      options: opts,
      answer: answer,
      explain: item.explain || ''
    };
  }

  function byCategory(cat) {
    return BANK.filter(function (q) { return q.category === cat; });
  }

  /**
   * Mezcla equilibrada: estructura, derecho/reves, tiempos, transiciones.
   */
  function pickQuestions(count) {
    count = count || 5;
    var cats = ['structure', 'reverse', 'tense_var', 'transition'];
    var out = [];
    var seen = {};
    var i;

    function pushFrom(list) {
      shuffle(list).forEach(function (item) {
        if (out.length >= count) return;
        if (seen[item.q]) return;
        seen[item.q] = true;
        out.push(withShuffledOptions(item));
      });
    }

    // Al menos una de cada categoria mientras quepa
    for (i = 0; i < cats.length && out.length < count; i++) {
      var one = shuffle(byCategory(cats[i]));
      if (one[0] && !seen[one[0].q]) {
        seen[one[0].q] = true;
        out.push(withShuffledOptions(one[0]));
      }
    }

    pushFrom(BANK);
    return shuffle(out).slice(0, count);
  }

  global.JillStructureDrill = {
    BANK: BANK,
    LABELS: LABELS,
    pickQuestions: pickQuestions,
    byCategory: byCategory,
    withShuffledOptions: withShuffledOptions
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.JillStructureDrill;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : global));
