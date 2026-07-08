/**
 * Rapid drill ù banco por categorùa (construcciùn, patrones, sin siglas).
 * Cada ùtem: { kpi, category, q, options, answer, explain }
 */
(function (global) {
  'use strict';

  var DRILL_CATEGORY_LABELS = {
    word_order: 'Orden de palabras',
    tense: 'Tiempos verbales',
    negation: 'Negaciones',
    affirmation: 'Afirmaciones / preguntas',
    preposition: 'Preposiciones',
    number: 'Nùmeros',
    possessive: 'Posesivos',
    demonstrative: 'Demostrativos',
    personal_pronoun: 'Pronombres personales',
    reflexive: 'Reflexivos',
    comparative: 'Comparativos',
    superlative: 'Superlativos',
    synonym: 'Sinùnimos',
    antonym: 'Antùnimos',
    phrase: 'Frases ùtiles',
    expression: 'Expresiones',
    compound: 'Palabras compuestas',
    coin: 'Pregunta / respuesta'
  };

  var BANK = [
    // ùù Orden de palabras ùù
    { kpi: 'k3', category: 'word_order', q: 'Orden correcto en inglùs:', options: ['Yesterday I went home', 'I yesterday went home', 'Went I yesterday home', 'Home went I yesterday'], answer: 0, explain: 'Sujeto + verbo + complemento. Yesterday al inicio o al final.' },
    { kpi: 'k3', category: 'word_order', q: 'ùCuùl pregunta estù bien armada?', options: ['Where do you live?', 'Where you live?', 'Do live where you?', 'You live where do?'], answer: 0, explain: 'WH + auxiliar + sujeto + verbo.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden con frecuencia:', options: ['I usually have coffee', 'I have usually coffee', 'Usually I coffee have', 'Have I usually coffee'], answer: 0, explain: 'Frecuencia antes del verbo principal: usually have.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden con adverbio de lugar:', options: ['She lives here', 'She here lives', 'Lives she here', 'Here she live'], answer: 0, explain: 'Sujeto + verbo + lugar: lives here.' },
    { kpi: 'k3', category: 'word_order', q: 'Pregunta con "how often":', options: ['How often do you exercise?', 'How often you exercise?', 'Do how often you exercise?', 'You exercise how often do?'], answer: 0, explain: 'How often + do/does + sujeto + verbo base.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden con "always" al final:', options: ['I will help you always', 'I always will help you', 'Always I will help you', 'Will always I help you'], answer: 0, explain: 'Tambiùn vùlido: I will always help you. Always puede ir antes del verbo auxiliar.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden en pregunta con "what":', options: ['What did you say?', 'What you said?', 'Did what you say?', 'You said what did?'], answer: 0, explain: 'What + did + sujeto + verbo base.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden con dos complementos:', options: ['I gave her the book', 'I gave the book her', 'Gave I her the book', 'Her gave I the book'], answer: 0, explain: 'give + persona + cosa: gave her the book.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden negativo correcto:', options: ["I don't usually eat meat", "I usually don't eat meat", "Don't I usually eat meat", "Usually I don't eat meat"], answer: 0, explain: 'Don\'t antes del verbo principal; usually entre auxiliar y verbo.' },
    { kpi: 'k3', category: 'word_order', q: 'Orden con "there is":', options: ['There is a problem', 'A problem there is', 'Is there a problem exists', 'There a problem is'], answer: 0, explain: 'There is/are + sustantivo.' },

    // ùù Tiempos verbales ùù
    { kpi: 'k3', category: 'tense', q: 'Para completar el presente perfecto continuo: I have been ___', options: ['going', 'gone', 'go', 'went'], answer: 0, explain: 'Have been + -ing.' },
    { kpi: 'k3', category: 'tense', q: 'Para completar el pasado simple: She ___ the report yesterday.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Pasado: finished.' },
    { kpi: 'k3', category: 'tense', q: 'Para completar el futuro: I ___ call you tomorrow.', options: ['will', 'would', 'am', 'was'], answer: 0, explain: 'Will + verbo base.' },
    { kpi: 'k2', category: 'tense', q: 'Presente continuo: They are ___ English now.', options: ['learning', 'learned', 'learn', 'learns'], answer: 0, explain: 'Are + -ing.' },
    { kpi: 'k3', category: 'tense', q: 'Presente simple: He ___ to the gym twice a week.', options: ['goes', 'go', 'going', 'went'], answer: 0, explain: 'He/She/It + verbo -s: goes.' },
    { kpi: 'k3', category: 'tense', q: 'Pasado continuo: I was ___ when you called.', options: ['sleeping', 'sleep', 'slept', 'sleeps'], answer: 0, explain: 'Was/were + -ing.' },
    { kpi: 'k3', category: 'tense', q: 'Presente perfecto: We have ___ here before.', options: ['been', 'be', 'being', 'was'], answer: 0, explain: 'Have + participio: have been.' },
    { kpi: 'k3', category: 'tense', q: 'Futuro con "going to": I am ___ visit my parents.', options: ['going to', 'go to', 'went to', 'goes to'], answer: 0, explain: 'Am/is/are + going to + verbo base.' },
    { kpi: 'k2', category: 'tense', q: 'Condicional: If I had time, I ___ help you.', options: ['would', 'will', 'can', 'am'], answer: 0, explain: 'Second conditional: would + verbo base.' },
    { kpi: 'k3', category: 'tense', q: 'Presente simple negativo: She ___ coffee in the morning.', options: ["doesn't drink", "don't drink", "isn't drink", "not drinks"], answer: 0, explain: 'Doesn\'t + verbo base para he/she/it.' },

    // ùù Negaciones ùù
    { kpi: 'k3', category: 'negation', q: 'Negaciùn correcta: I ___ like spicy food.', options: ["don't", "doesn't", "isn't", "aren't"], answer: 0, explain: 'I + do not (don\'t) + verbo base.' },
    { kpi: 'k3', category: 'negation', q: 'Negaciùn en pasado: She ___ go to the meeting.', options: ["didn't", "don't", "wasn't", "hasn't"], answer: 0, explain: 'Didn\'t + verbo base.' },
    { kpi: 'k3', category: 'negation', q: 'Completù: I have not ___ yet.', options: ['finished', 'finish', 'finishing', 'finishes'], answer: 0, explain: 'Have not + participio.' },
    { kpi: 'k3', category: 'negation', q: 'Negaciùn con to be: They ___ ready.', options: ["aren't", "don't", "doesn't", "haven't"], answer: 0, explain: 'To be negativo: aren\'t / isn\'t.' },
    { kpi: 'k3', category: 'negation', q: 'Nadie vino: ___ came to the party.', options: ['Nobody', 'Somebody', 'Everybody', 'Anybody'], answer: 0, explain: 'Nobody = nadie.' },
    { kpi: 'k3', category: 'negation', q: 'Negaciùn con "never": I have ___ been to London.', options: ['never', 'ever', 'always', 'often'], answer: 0, explain: 'Have never + participio.' },
    { kpi: 'k3', category: 'negation', q: 'Sin nada: There is ___ in the fridge.', options: ['nothing', 'something', 'anything', 'everything'], answer: 0, explain: 'Nothing = nada (afirmativa con sentido negativo).' },
    { kpi: 'k3', category: 'negation', q: 'Negaciùn de habilidad: I ___ swim when I was five.', options: ["couldn't", "can't", "don't", "wasn't"], answer: 0, explain: 'Pasado de can: couldn\'t.' },
    { kpi: 'k3', category: 'negation', q: 'Negaciùn corta: He is not here ? He ___ here.', options: ["isn't", "don't", "doesn't", "aren't"], answer: 0, explain: 'Is not = isn\'t.' },
    { kpi: 'k3', category: 'negation', q: 'Completù: We ___ agree with that idea.', options: ["don't", "doesn't", "isn't", "aren't"], answer: 0, explain: 'We + don\'t + verbo base.' },

    // ùù Afirmaciones / preguntas ùù
    { kpi: 'k3', category: 'affirmation', q: 'Completù la pregunta: ___ you ready?', options: ['Are', 'Is', 'Do', 'Does'], answer: 0, explain: 'Are youù?' },
    { kpi: 'k3', category: 'affirmation', q: 'Completù la respuesta: Yes, I ___ ready.', options: ['am', 'is', 'are', 'be'], answer: 0, explain: 'Yes, I am ready.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta en pasado: ___ she work yesterday?', options: ['Did', 'Does', 'Do', 'Was'], answer: 0, explain: 'Did + sujeto + verbo base.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta con "can": ___ you help me?', options: ['Can', 'Do', 'Are', 'Does'], answer: 0, explain: 'Can + sujeto + verbo base.' },
    { kpi: 'k3', category: 'affirmation', q: 'Respuesta corta positiva: Do you like coffee? ù Yes, I ___.', options: ['do', 'am', 'like', 'does'], answer: 0, explain: 'Respuesta con auxiliar: Yes, I do.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta con "have": ___ you finished yet?', options: ['Have', 'Has', 'Did', 'Do'], answer: 0, explain: 'Have you + participio.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta con "is": ___ this your bag?', options: ['Is', 'Are', 'Do', 'Does'], answer: 0, explain: 'Is + sujeto + complemento.' },
    { kpi: 'k3', category: 'affirmation', q: 'Respuesta: Is she at home? ù Yes, she ___.', options: ['is', 'does', 'has', 'do'], answer: 0, explain: 'Yes, she is.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta con "will": ___ you be there tonight?', options: ['Will', 'Do', 'Are', 'Did'], answer: 0, explain: 'Will + sujeto + verbo.' },
    { kpi: 'k3', category: 'affirmation', q: 'Pregunta con "does": ___ your brother play soccer?', options: ['Does', 'Do', 'Is', 'Did'], answer: 0, explain: 'Does + he/she/it + verbo base.' },

    // ùù Preposiciones ùù
    { kpi: 'k4', category: 'preposition', q: 'I live ___ San Josù.', options: ['in', 'on', 'at', 'by'], answer: 0, explain: 'in + ciudad.' },
    { kpi: 'k4', category: 'preposition', q: 'The keys are ___ the table.', options: ['on', 'in', 'at', 'by'], answer: 0, explain: 'on + superficie.' },
    { kpi: 'k4', category: 'preposition', q: 'We meet ___ 5 pm.', options: ['at', 'in', 'on', 'by'], answer: 0, explain: 'at + hora.' },
    { kpi: 'k4', category: 'preposition', q: 'My birthday is ___ Monday.', options: ['on', 'in', 'at', 'by'], answer: 0, explain: 'on + dùa de la semana.' },
    { kpi: 'k4', category: 'preposition', q: 'She was born ___ 1995.', options: ['in', 'on', 'at', 'by'], answer: 0, explain: 'in + aùo.' },
    { kpi: 'k4', category: 'preposition', q: 'He is good ___ math.', options: ['at', 'in', 'on', 'for'], answer: 0, explain: 'good at + habilidad.' },
    { kpi: 'k4', category: 'preposition', q: 'I am interested ___ learning English.', options: ['in', 'on', 'at', 'for'], answer: 0, explain: 'interested in + -ing.' },
    { kpi: 'k4', category: 'preposition', q: 'She arrived ___ the airport early.', options: ['at', 'in', 'on', 'to'], answer: 0, explain: 'arrive at + lugar puntual.' },
    { kpi: 'k4', category: 'preposition', q: 'This gift is ___ you.', options: ['for', 'to', 'at', 'with'], answer: 0, explain: 'for = para (destinatario).' },
    { kpi: 'k4', category: 'preposition', q: 'I go to work ___ bus.', options: ['by', 'in', 'on', 'with'], answer: 0, explain: 'by + transporte (sin artùculo).' },

    // ùù Nùmeros ùù
    { kpi: 'k4', category: 'number', q: 'How do you say 15th in English?', options: ['fifteenth', 'fifty', 'fifthteen', 'fiveteen'], answer: 0, explain: 'Ordinal: fifteenth.' },
    { kpi: 'k4', category: 'number', q: 'Completù: There are ___ students in the room. (12)', options: ['twelve', 'twelfth', 'twenty', 'two'], answer: 0, explain: 'Cardinal: twelve.' },
    { kpi: 'k4', category: 'number', q: 'She is the ___ child in her family. (3ù)', options: ['third', 'three', 'threeth', 'thirty'], answer: 0, explain: 'Ordinal: third.' },
    { kpi: 'k4', category: 'number', q: 'How do you write 21st?', options: ['twenty-first', 'twenty-one', 'twenty-oneth', 'two-first'], answer: 0, explain: 'Ordinal compuesto: twenty-first.' },
    { kpi: 'k4', category: 'number', q: 'Completù: I need ___ eggs. (media docena)', options: ['six', 'sixth', 'sixteen', 'sixty'], answer: 0, explain: 'Cardinal: six.' },
    { kpi: 'k4', category: 'number', q: 'What is 100 in words?', options: ['one hundred', 'one thousand', 'ten hundred', 'hundred'], answer: 0, explain: 'One hundred.' },
    { kpi: 'k4', category: 'number', q: 'He finished in ___ place. (1ù)', options: ['first', 'one', 'oneth', 'once'], answer: 0, explain: 'Ordinal: first.' },
    { kpi: 'k4', category: 'number', q: 'Completù: The meeting is on the ___ of March. (5)', options: ['fifth', 'five', 'fiveth', 'fifty'], answer: 0, explain: 'Ordinal con "the": the fifth of March.' },
    { kpi: 'k4', category: 'number', q: 'How do you say 0.5?', options: ['zero point five', 'zero five', 'half point', 'zero and half'], answer: 0, explain: 'Decimales: point + dùgito.' },
    { kpi: 'k4', category: 'number', q: 'Completù: ___ people attended. (aprox. 200)', options: ['Two hundred', 'Two hundreds', 'Second hundred', 'Two hundredth'], answer: 0, explain: 'Hundred no lleva -s en nùmeros exactos.' },

    // ùù Posesivos ùù
    { kpi: 'k4', category: 'possessive', q: 'This is ___ book. (yo)', options: ['my', 'mine', 'me', 'I'], answer: 0, explain: 'Antes del sustantivo: my book.' },
    { kpi: 'k4', category: 'possessive', q: 'That laptop is ___. (ùl)', options: ['his', 'he', 'him', "he's"], answer: 0, explain: 'his + sustantivo o solo his.' },
    { kpi: 'k4', category: 'possessive', q: 'The choice is ___. (nosotros)', options: ['ours', 'our', 'we', 'us'], answer: 0, explain: 'ours = de nosotros (sin sustantivo despuùs).' },
    { kpi: 'k4', category: 'possessive', q: 'Is this ___ pen? (ella)', options: ['her', 'she', 'hers', 'herself'], answer: 0, explain: 'her + sustantivo: her pen.' },
    { kpi: 'k4', category: 'possessive', q: 'That car is ___. (ellos)', options: ['theirs', 'their', 'they', 'them'], answer: 0, explain: 'theirs = de ellos.' },
    { kpi: 'k4', category: 'possessive', q: '___ name is Carlos. (yo)', options: ['My', 'Mine', 'Me', 'I'], answer: 0, explain: 'My + sustantivo.' },
    { kpi: 'k4', category: 'possessive', q: 'This isn\'t my phone; it\'s ___. (tù)', options: ['yours', 'your', 'you', 'yourself'], answer: 0, explain: 'yours = de ti.' },
    { kpi: 'k4', category: 'possessive', q: 'We love ___ dog. (nosotros)', options: ['our', 'ours', 'we', 'us'], answer: 0, explain: 'our + sustantivo.' },
    { kpi: 'k4', category: 'possessive', q: 'The office is on ___ floor. (ellos)', options: ['their', 'theirs', 'they', 'them'], answer: 0, explain: 'their + sustantivo.' },
    { kpi: 'k4', category: 'possessive', q: 'Whose bag is this? ù It\'s ___. (ella)', options: ['hers', 'her', 'she', 'herself'], answer: 0, explain: 'hers = de ella.' },

    // ùù Demostrativos ùù
    { kpi: 'k4', category: 'demonstrative', q: '___ is my desk. (cerca)', options: ['This', 'That', 'Those', 'Them'], answer: 0, explain: 'This = cerca, singular.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ cars are expensive. (lejos, plural)', options: ['Those', 'This', 'That', 'These'], answer: 0, explain: 'Those = lejos, plural.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ shoes fit me well. (cerca, plural)', options: ['These', 'This', 'That', 'Those'], answer: 0, explain: 'These = cerca, plural.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ building over there is new. (lejos)', options: ['That', 'This', 'These', 'Those'], answer: 0, explain: 'That = lejos, singular.' },
    { kpi: 'k4', category: 'demonstrative', q: 'I prefer ___ option. (cerca)', options: ['this', 'that', 'these', 'those'], answer: 0, explain: 'this + sustantivo singular.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ are my keys. (cerca, plural)', options: ['These', 'This', 'That', 'It'], answer: 0, explain: 'These areù plural.' },
    { kpi: 'k4', category: 'demonstrative', q: 'Look at ___ picture on the wall. (lejos)', options: ['that', 'this', 'these', 'those'], answer: 0, explain: 'that + sustantivo singular lejos.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ days are busy for me. (cerca, plural)', options: ['These', 'This', 'That', 'It'], answer: 0, explain: 'These + plural noun.' },
    { kpi: 'k4', category: 'demonstrative', q: 'Is ___ your seat? (cerca)', options: ['this', 'that', 'these', 'those'], answer: 0, explain: 'this = aquù, cerca.' },
    { kpi: 'k4', category: 'demonstrative', q: '___ was a great meeting. (pasado, singular)', options: ['That', 'This', 'These', 'Those'], answer: 0, explain: 'That wasù referencia a algo ya dicho.' },

    // ùù Pronombres personales ùù
    { kpi: 'k4', category: 'personal_pronoun', q: '___ study every night. (ellos)', options: ['They', 'Them', 'Their', 'Theirs'], answer: 0, explain: 'Sujeto: they.' },
    { kpi: 'k4', category: 'personal_pronoun', q: 'The teacher called ___. (yo)', options: ['me', 'I', 'my', 'mine'], answer: 0, explain: 'Objeto: called me.' },
    { kpi: 'k4', category: 'personal_pronoun', q: '___ is a doctor. (ella)', options: ['She', 'Her', 'Hers', 'Herself'], answer: 0, explain: 'Sujeto: she.' },
    { kpi: 'k4', category: 'personal_pronoun', q: 'Can you help ___? (nosotros)', options: ['us', 'we', 'our', 'ours'], answer: 0, explain: 'Objeto: help us.' },
    { kpi: 'k4', category: 'personal_pronoun', q: '___ work at Infinity Studio. (yo)', options: ['I', 'Me', 'My', 'Mine'], answer: 0, explain: 'Sujeto: I.' },
    { kpi: 'k4', category: 'personal_pronoun', q: 'Give ___ the report. (ùl)', options: ['him', 'he', 'his', 'himself'], answer: 0, explain: 'Objeto: give him.' },
    { kpi: 'k4', category: 'personal_pronoun', q: '___ are my colleagues. (ellos)', options: ['They', 'Them', 'Their', 'Theirs'], answer: 0, explain: 'Sujeto plural: they.' },
    { kpi: 'k4', category: 'personal_pronoun', q: 'Between you and ___, I disagree. (yo)', options: ['me', 'I', 'my', 'mine'], answer: 0, explain: 'Despuùs de preposiciùn: me.' },
    { kpi: 'k4', category: 'personal_pronoun', q: '___ doesn\'t like early meetings. (ùl)', options: ['He', 'Him', 'His', 'Himself'], answer: 0, explain: 'Sujeto: he.' },
    { kpi: 'k4', category: 'personal_pronoun', q: 'I saw ___ at the conference. (ella)', options: ['her', 'she', 'hers', 'herself'], answer: 0, explain: 'Objeto: saw her.' },

    // ùù Reflexivos ùù
    { kpi: 'k4', category: 'reflexive', q: 'She hurt ___ while cooking.', options: ['herself', 'her', 'she', 'hers'], answer: 0, explain: 'Reflexivo: herself.' },
    { kpi: 'k4', category: 'reflexive', q: 'We enjoyed ___ at the party.', options: ['ourselves', 'our', 'us', 'we'], answer: 0, explain: 'Enjoy ourselves.' },
    { kpi: 'k4', category: 'reflexive', q: 'He taught ___ to code.', options: ['himself', 'his', 'he', 'him'], answer: 0, explain: 'himself = ùl mismo.' },
    { kpi: 'k4', category: 'reflexive', q: 'I cut ___ shaving.', options: ['myself', 'me', 'my', 'I'], answer: 0, explain: 'myself = yo mismo/a.' },
    { kpi: 'k4', category: 'reflexive', q: 'They blamed ___ for the delay.', options: ['themselves', 'their', 'them', 'they'], answer: 0, explain: 'themselves = ellos mismos.' },
    { kpi: 'k4', category: 'reflexive', q: 'Be careful! You might hurt ___.', options: ['yourself', 'you', 'your', 'yours'], answer: 0, explain: 'yourself = tù mismo/a.' },
    { kpi: 'k4', category: 'reflexive', q: 'The children dressed ___ quickly.', options: ['themselves', 'them', 'their', 'they'], answer: 0, explain: 'dress oneself.' },
    { kpi: 'k4', category: 'reflexive', q: 'She looked at ___ in the mirror.', options: ['herself', 'her', 'she', 'hers'], answer: 0, explain: 'look at oneself.' },
    { kpi: 'k4', category: 'reflexive', q: 'I need to remind ___ to call.', options: ['myself', 'me', 'my', 'I'], answer: 0, explain: 'remind myself.' },
    { kpi: 'k4', category: 'reflexive', q: 'He fixed the bike ___.', options: ['himself', 'his', 'he', 'him'], answer: 0, explain: 'ùl solo, sin ayuda: by himself / himself.' },

    // ùù Comparativos ùù
    { kpi: 'k4', category: 'comparative', q: 'This phone is ___ than mine.', options: ['cheaper', 'cheap', 'cheapest', 'more cheap'], answer: 0, explain: 'Adj corto + -er: cheaper.' },
    { kpi: 'k4', category: 'comparative', q: 'She is ___ intelligent ___ her sister.', options: ['more / than', 'most / that', 'much / as', 'very / than'], answer: 0, explain: 'More + adj + than.' },
    { kpi: 'k4', category: 'comparative', q: 'Today is ___ than yesterday.', options: ['warmer', 'warm', 'warmest', 'more warm'], answer: 0, explain: 'warm ? warmer.' },
    { kpi: 'k4', category: 'comparative', q: 'He runs ___ than I do.', options: ['faster', 'fast', 'fastest', 'more fast'], answer: 0, explain: 'fast ? faster (irregular en forma).' },
    { kpi: 'k4', category: 'comparative', q: 'This task is ___ difficult ___ I thought.', options: ['more / than', 'most / that', 'much / as', 'very / than'], answer: 0, explain: 'more difficult than.' },
    { kpi: 'k4', category: 'comparative', q: 'Your idea is ___ than mine.', options: ['better', 'good', 'best', 'more good'], answer: 0, explain: 'good ? better (irregular).' },
    { kpi: 'k4', category: 'comparative', q: 'She is as tall ___ her brother.', options: ['as', 'than', 'like', 'so'], answer: 0, explain: 'as + adj + as (igualdad).' },
    { kpi: 'k4', category: 'comparative', q: 'The second option is ___ expensive.', options: ['less', 'least', 'fewer', 'little'], answer: 0, explain: 'less + adj (no contable / adjetivo).' },
    { kpi: 'k4', category: 'comparative', q: 'I feel ___ today than last week.', options: ['healthier', 'healthy', 'healthiest', 'more healthy'], answer: 0, explain: 'healthy ? healthier.' },
    { kpi: 'k4', category: 'comparative', q: 'There are ___ students this year.', options: ['fewer', 'less', 'fewest', 'little'], answer: 0, explain: 'fewer + sustantivo contable plural.' },

    // ùù Superlativos ùù
    { kpi: 'k4', category: 'superlative', q: 'He is the ___ player on the team.', options: ['best', 'better', 'good', 'most good'], answer: 0, explain: 'Superlativo irregular: the best.' },
    { kpi: 'k4', category: 'superlative', q: 'It was the ___ day of the year.', options: ['hottest', 'hotter', 'hot', 'most hot'], answer: 0, explain: 'The + -est: hottest.' },
    { kpi: 'k4', category: 'superlative', q: 'She is the ___ person in the office.', options: ['kindest', 'kinder', 'kind', 'most kind'], answer: 0, explain: 'Adj corto: the kindest.' },
    { kpi: 'k4', category: 'superlative', q: 'This is the ___ movie I\'ve ever seen.', options: ['worst', 'worse', 'bad', 'most bad'], answer: 0, explain: 'bad ? worst.' },
    { kpi: 'k4', category: 'superlative', q: 'He is the ___ student in the class.', options: ['most talented', 'more talented', 'talenteder', 'talentedest'], answer: 0, explain: 'Adj largo: the most talented.' },
    { kpi: 'k4', category: 'superlative', q: 'It\'s the ___ building in the city.', options: ['tallest', 'taller', 'tall', 'most tall'], answer: 0, explain: 'tall ? tallest.' },
    { kpi: 'k4', category: 'superlative', q: 'That was the ___ news of the week.', options: ['worst', 'worse', 'badly', 'most worse'], answer: 0, explain: 'the worst.' },
    { kpi: 'k4', category: 'superlative', q: 'She speaks the ___ of all.', options: ['fastest', 'faster', 'fast', 'most fast'], answer: 0, explain: 'fast ? fastest.' },
    { kpi: 'k4', category: 'superlative', q: 'This is the ___ important rule.', options: ['most', 'more', 'much', 'very'], answer: 0, explain: 'the most + adj largo.' },
    { kpi: 'k4', category: 'superlative', q: 'He arrived the ___ of everyone.', options: ['latest', 'later', 'late', 'most late'], answer: 0, explain: 'late ? latest (ùltimo en llegar).' },

    // ùù Sinùnimos ùù
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "big":', options: ['large', 'small', 'late', 'weak'], answer: 0, explain: 'Big ? large.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "start":', options: ['begin', 'finish', 'stop', 'close'], answer: 0, explain: 'Start ? begin.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "happy":', options: ['glad', 'sad', 'angry', 'tired'], answer: 0, explain: 'Happy ? glad.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "quick":', options: ['fast', 'slow', 'heavy', 'late'], answer: 0, explain: 'Quick ? fast.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "difficult":', options: ['hard', 'easy', 'simple', 'light'], answer: 0, explain: 'Difficult ? hard.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "purchase":', options: ['buy', 'sell', 'return', 'borrow'], answer: 0, explain: 'Purchase ? buy (formal).' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "assist":', options: ['help', 'ignore', 'block', 'delay'], answer: 0, explain: 'Assist ? help.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "reply":', options: ['answer', 'ask', 'ignore', 'delete'], answer: 0, explain: 'Reply ? answer.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "improve":', options: ['enhance', 'worsen', 'break', 'stop'], answer: 0, explain: 'Improve ? enhance.' },
    { kpi: 'k10', category: 'synonym', q: 'Sinùnimo de "job":', options: ['work', 'play', 'rest', 'trip'], answer: 0, explain: 'Job ? work (empleo).' },

    // ùù Antùnimos ùù
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "easy":', options: ['difficult', 'simple', 'fast', 'early'], answer: 0, explain: 'Easy ? difficult.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "always":', options: ['never', 'often', 'sometimes', 'usually'], answer: 0, explain: 'Always ? never.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "open":', options: ['closed', 'wide', 'free', 'clear'], answer: 0, explain: 'Open ? closed.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "increase":', options: ['decrease', 'grow', 'rise', 'expand'], answer: 0, explain: 'Increase ? decrease.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "accept":', options: ['reject', 'take', 'allow', 'receive'], answer: 0, explain: 'Accept ? reject.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "borrow":', options: ['lend', 'keep', 'take', 'steal'], answer: 0, explain: 'Borrow ? lend.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "arrive":', options: ['leave', 'enter', 'reach', 'come'], answer: 0, explain: 'Arrive ? leave.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "generous":', options: ['selfish', 'kind', 'fair', 'polite'], answer: 0, explain: 'Generous ? selfish.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "success":', options: ['failure', 'win', 'gain', 'progress'], answer: 0, explain: 'Success ? failure.' },
    { kpi: 'k10', category: 'antonym', q: 'Antùnimo de "ancient":', options: ['modern', 'old', 'historic', 'classic'], answer: 0, explain: 'Ancient ? modern.' },

    // ùù Frases ùtiles ùù
    { kpi: 'k9', category: 'phrase', q: 'Completù la frase ùtil: Let me ___ that.', options: ['rephrase', 'repeat', 'replace', 'remove'], answer: 0, explain: 'Let me rephrase that ù recovery en llamada.' },
    { kpi: 'k9', category: 'phrase', q: 'Para pedir aclaraciùn:', options: ['Could you clarify that?', 'You are wrong.', 'Speak Spanish.', 'I quit.'], answer: 0, explain: 'Could you clarifyù' },
    { kpi: 'k9', category: 'phrase', q: 'Para confirmar que entendiste:', options: ['So, if I understand correctlyù', 'I don\'t care.', 'Whatever.', 'No idea.'], answer: 0, explain: 'Parafrasear y confirmar.' },
    { kpi: 'k9', category: 'phrase', q: 'Para pedir repetir:', options: ['Could you repeat that, please?', 'Stop talking.', 'I\'m busy.', 'Not now.'], answer: 0, explain: 'Could you repeatù' },
    { kpi: 'k9', category: 'phrase', q: 'Para ofrecer ayuda:', options: ['How can I help you?', 'Help yourself.', 'I can\'t help.', 'Go away.'], answer: 0, explain: 'Servicio al cliente / profesional.' },
    { kpi: 'k9', category: 'phrase', q: 'Para cerrar una reuniùn:', options: ['Thanks everyone for your time.', 'I hate meetings.', 'Leave now.', 'No questions.'], answer: 0, explain: 'Cierre profesional.' },
    { kpi: 'k9', category: 'phrase', q: 'Para expresar acuerdo:', options: ['I completely agree.', 'You\'re wrong.', 'I don\'t care.', 'Maybe not.'], answer: 0, explain: 'I agree / I completely agree.' },
    { kpi: 'k9', category: 'phrase', q: 'Para disculparse:', options: ['I apologize for the delay.', 'It\'s your fault.', 'Not my problem.', 'Too bad.'], answer: 0, explain: 'I apologize forù' },
    { kpi: 'k9', category: 'phrase', q: 'Para proponer otra opciùn:', options: ['How about we try another approach?', 'Do it my way.', 'No options.', 'Forget it.'], answer: 0, explain: 'How aboutù' },
    { kpi: 'k9', category: 'phrase', q: 'Para verificar disponibilidad:', options: ['Are you available tomorrow?', 'You must come.', 'I don\'t need you.', 'Cancel everything.'], answer: 0, explain: 'Are you availableù' },

    // ùù Expresiones ùù
    { kpi: 'k9', category: 'expression', q: 'ùQuù significa "on top of that"?', options: ['Ademùs / encima de eso', 'Sin embargo', 'Al contrario', 'Por ùltimo'], answer: 0, explain: 'Agrega otra idea.' },
    { kpi: 'k8', category: 'expression', q: 'Expresiùn de contraste:', options: ['however', 'on top of that', 'first of all', 'as well as'], answer: 0, explain: 'However = sin embargo.' },
    { kpi: 'k8', category: 'expression', q: 'ùQuù significa "by the way"?', options: ['Por cierto', 'De todos modos', 'Al final', 'De inmediato'], answer: 0, explain: 'By the way = por cierto.' },
    { kpi: 'k8', category: 'expression', q: 'Expresiùn para "aproximadamente":', options: ['more or less', 'right away', 'at once', 'in charge'], answer: 0, explain: 'More or less ? mùs o menos.' },
    { kpi: 'k8', category: 'expression', q: 'ùQuù significa "as soon as"?', options: ['Tan pronto como', 'Mientras tanto', 'Desde hace', 'Hasta que'], answer: 0, explain: 'As soon as = en cuanto.' },
    { kpi: 'k8', category: 'expression', q: 'Expresiùn para empezar una lista:', options: ['first of all', 'however', 'instead', 'although'], answer: 0, explain: 'First of all = primero que todo.' },
    { kpi: 'k8', category: 'expression', q: 'ùQuù significa "in the meantime"?', options: ['Mientras tanto', 'Al mismo tiempo', 'De repente', 'Por fin'], answer: 0, explain: 'In the meantime.' },
    { kpi: 'k8', category: 'expression', q: 'Expresiùn para "de todos modos":', options: ['anyway', 'therefore', 'moreover', 'otherwise'], answer: 0, explain: 'Anyway = de todos modos.' },
    { kpi: 'k8', category: 'expression', q: 'ùQuù significa "due to"?', options: ['Debido a', 'A pesar de', 'En lugar de', 'Segùn'], answer: 0, explain: 'Due to = debido a.' },
    { kpi: 'k8', category: 'expression', q: 'Expresiùn para "en realidad":', options: ['actually', 'finally', 'suddenly', 'rarely'], answer: 0, explain: 'Actually = en realidad / de hecho.' },

    // ùù Palabras compuestas ùù
    { kpi: 'k10', category: 'compound', q: 'Palabra compuesta: ___ + break = descanso para cafù', options: ['coffee', 'tea', 'water', 'lunch'], answer: 0, explain: 'Coffee break.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: full + ___ = empleado de tiempo completo', options: ['time', 'day', 'work', 'hour'], answer: 0, explain: 'Full-time employee.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + room = sala de juntas', options: ['meeting', 'living', 'class', 'break'], answer: 0, explain: 'Meeting room.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + mail = correo electrùnico', options: ['e', 'i', 'web', 'net'], answer: 0, explain: 'E-mail / email.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: part + ___ = tiempo parcial', options: ['time', 'day', 'work', 'job'], answer: 0, explain: 'Part-time.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + date = informaciùn actualizada', options: ['up', 'out', 'off', 'down'], answer: 0, explain: 'Up-to-date.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + load = carga de trabajo', options: ['work', 'home', 'road', 'case'], answer: 0, explain: 'Workload.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + keeper = portero / encargado', options: ['gate', 'book', 'shop', 'house'], answer: 0, explain: 'Gatekeeper.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: hand + ___ = manual / de mano', options: ['book', 'bag', 'work', 'made'], answer: 0, explain: 'Handbook = manual.' },
    { kpi: 'k10', category: 'compound', q: 'Compound: ___ + line = fuera de lùnea / desconectado', options: ['off', 'on', 'in', 'up'], answer: 0, explain: 'Offline.' },

    // ùù Pregunta / respuesta (coin) ùù
    { kpi: 'k3', category: 'coin', q: 'Completù la pregunta: ___ you like pizza?', options: ['Do', 'Does', 'Are', 'Is'], answer: 0, explain: 'Do you + verbo base.' },
    { kpi: 'k3', category: 'coin', q: 'Completù la respuesta: No, I ___.', options: ["don't", "doesn't", "am not", "isn't"], answer: 0, explain: 'No, I don\'t.' },
    { kpi: 'k3', category: 'coin', q: 'Pregunta: ___ she your manager?', options: ['Is', 'Are', 'Do', 'Does'], answer: 0, explain: 'Is sheù?' },
    { kpi: 'k3', category: 'coin', q: 'Respuesta: Yes, she ___.', options: ['is', 'does', 'has', 'do'], answer: 0, explain: 'Yes, she is.' },
    { kpi: 'k3', category: 'coin', q: 'Pregunta: ___ they coming today?', options: ['Are', 'Is', 'Do', 'Does'], answer: 0, explain: 'Are they + -ing.' },
    { kpi: 'k3', category: 'coin', q: 'Respuesta: No, we ___.', options: ["aren't", "don't", "doesn't", "isn't"], answer: 0, explain: 'No, we aren\'t.' },
    { kpi: 'k3', category: 'coin', q: 'Pregunta: ___ you been there before?', options: ['Have', 'Has', 'Did', 'Do'], answer: 0, explain: 'Have you + participio.' },
    { kpi: 'k3', category: 'coin', q: 'Respuesta corta: Did he call? ù Yes, he ___.', options: ['did', 'does', 'was', 'has'], answer: 0, explain: 'Yes, he did.' },
    { kpi: 'k3', category: 'coin', q: 'Pregunta: ___ it raining?', options: ['Is', 'Are', 'Does', 'Do'], answer: 0, explain: 'Is it + -ing.' },
    { kpi: 'k3', category: 'coin', q: 'Respuesta: Can we start? ù Yes, we ___.', options: ['can', 'do', 'are', 'will'], answer: 0, explain: 'Yes, we can.' }
  ];

  function categoryLabel(cat) {
    return DRILL_CATEGORY_LABELS[cat] || cat;
  }

  function byCategory(cat) {
    return BANK.filter(function (q) { return q.category === cat; });
  }

  function allCategories() {
    return Object.keys(DRILL_CATEGORY_LABELS);
  }

  function countByCategory() {
    var counts = {};
    BANK.forEach(function (q) {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }

  global.JillDrillBank = {
    BANK: BANK,
    DRILL_CATEGORY_LABELS: DRILL_CATEGORY_LABELS,
    categoryLabel: categoryLabel,
    byCategory: byCategory,
    allCategories: allCategories,
    countByCategory: countByCategory
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.JillDrillBank;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));
