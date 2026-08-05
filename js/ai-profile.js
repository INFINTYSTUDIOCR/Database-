(function(global){
  'use strict';

  var BLOCK = ['idiota','tonto','stupid','idiot','puto','puta','mierda','shit','fuck','asshole','pendejo','cabron','cabrón','imbecil','imbécil','moron','retard','bitch','perra','dog','slut','whore','marica','maricon'];

  /** Role / bot labels only — not real student first names (e.g. Johnny Ramirez). */
  var STAFF_NAMES = {
    trainer:1, admin:1, guest:1, student:1, teacher:1, infinity:1, alice:1, jill:1, nexora:1, claire:1, adam:1
  };

  var NON_NAME = {
    planning:1, planing:1, planned:1, going:1, doing:1, trying:1, thinking:1, learning:1, studying:1,
    practicing:1, working:1, looking:1, speaking:1, talking:1, writing:1, reading:1, watching:1,
    listening:1, feeling:1, having:1, being:1, getting:1, waiting:1, calling:1, helping:1,
    starting:1, finishing:1, meeting:1, running:1, walking:1, busy:1, ready:1, fine:1, good:1,
    great:1, here:1, back:1, sorry:1, happy:1, tired:1, well:1, okay:1, ok:1, yes:1, no:1,
    just:1, only:1, really:1, very:1, also:1, still:1, about:1, today:1, tomorrow:1,
    practice:1, english:1, lesson:1, homework:1, exercise:1, student:1, teacher:1, trainer:1
  };

  function isNonNameWord(word){
    return !!(word && NON_NAME[String(word).toLowerCase()]);
  }

  function studentFirstName(student){
    var full = String((student && student.info && student.info.name) || (student && student.name) || '').trim();
    return full.split(/\s+/)[0] || 'estudiante';
  }

  function sanitizePreferredName(name){
    if(!name || typeof name !== 'string') return null;
    var clean = name.trim().replace(/\s+/g, ' ');
    if(clean.length < 2 || clean.length > 24) return null;
    if(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/.test(clean)) return null;
    var token = clean.split(/\s+/)[0];
    var lower = token.toLowerCase();
    for(var i=0;i<BLOCK.length;i++){
      if(lower.indexOf(BLOCK[i]) !== -1) return null;
    }
    if(isNonNameWord(token)) return null;
    if(STAFF_NAMES[lower]) return null;
    if(/ing$/i.test(token) && token.length > 4) return null;
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }

  function isValidPreferredName(name, student){
    var clean = sanitizePreferredName(name);
    if(!clean) return null;
    if(isNonNameWord(clean)) return null;
    return clean;
  }

  function getAiProfile(student){
    var raw = (student && student.aiProfile) || {};
    var preferred = String(raw.preferredName || '').trim();
    var validPreferred = preferred ? isValidPreferredName(preferred, student) : null;
    var lp = raw.learningPrefs || {};
    return {
      preferredName: validPreferred || '',
      nameAsked: {
        alice: !!(raw.nameAsked && raw.nameAsked.alice),
        jill: !!(raw.nameAsked && raw.nameAsked.jill)
      },
      firstGreetingDone: {
        alice: !!(raw.firstGreetingDone && raw.firstGreetingDone.alice),
        jill: !!(raw.firstGreetingDone && raw.firstGreetingDone.jill)
      },
      learningPrefs: {
        confusionCount: lp.confusionCount || 0,
        prefersShort: !!lp.prefersShort,
        prefersExamples: !!lp.prefersExamples,
        prefersSlow: !!lp.prefersSlow,
        prefersSpanish: !!lp.prefersSpanish,
        prefersVisual: !!lp.prefersVisual,
        lastSignalAt: lp.lastSignalAt || null
      }
    };
  }

  function displayName(student){
    return studentFirstName(student);
  }

  /** Only explicit name introductions — NEVER "I'm planning…" */
  function detectPreferredName(text){
    if(!text) return null;
    var t = String(text).trim();
    var patterns = [
      /(?:ll[aá]mame|llama me|pod[eé]s decirme|me dec[ií]s|prefiero que me digas|me gustar[ií]a que me digas|call me|please call me|you can call me|i prefer to be called|i'd like to be called|my preferred name is|i go by)\s+[""']?([A-Za-zÁÉÍÓÚáéíóúÑñüÜ]{2,20})/i,
      /(?:me llamo|my name is)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,20})(?:\s|$|\.|,)/i
    ];
    for(var i=0;i<patterns.length;i++){
      var m = t.match(patterns[i]);
      if(m && m[1]){
        var clean = sanitizePreferredName(m[1]);
        if(clean) return clean;
      }
    }
    return null;
  }

  function purgeBadPreferredName(student){
    if(!student || !student.aiProfile) return false;
    var raw = String(student.aiProfile.preferredName || '').trim();
    if(!raw) return false;
    var registered = studentFirstName(student).toLowerCase();
    var token = raw.split(/\s+/)[0].toLowerCase();
    if(isValidPreferredName(raw, student) && token === registered) return false;
    student.aiProfile.preferredName = '';
    return true;
  }

  /** Login repair — wipe poisoned preferred names (Planning, Going, wrong nicknames). */
  async function repairPoisonedProfile(dbSetFn, studentRef){
    var s = resolveStudent(studentRef);
    if(!s || !s.id) return false;
    var dirty = purgeBadPreferredName(s);
    if(!dirty) return false;
    if(typeof dbSetFn === 'function') await dbSetFn('infinity_students', s.id, s);
    if(global.ALL_STUDENTS) global.ALL_STUDENTS[s.id] = s;
    return true;
  }

  function enrichStudentPayload(student){
    if(!student) return {};
    purgeBadPreferredName(student);
    return Object.assign({}, student, {
      id: student.id,
      aiProfile: getAiProfile(student),
      kpiFile: student.kpiFile || null,
      name: (student.info && student.info.name) || student.name || 'Student',
      displayName: displayName(student)
    });
  }

  function aliceSessionMode(student){
    return getAiProfile(student).firstGreetingDone.alice ? 'return_session' : 'start_session';
  }

  function jillSessionMode(student){
    return getAiProfile(student).firstGreetingDone.jill ? 'return_session' : 'start_session';
  }

  function resolveStudent(ref){
    if(ref) return ref;
    if(global._currentStudent) return global._currentStudent;
    if(global._portalStudent) return global._portalStudent;
    return null;
  }

  async function saveAiProfilePatch(patch, dbSetFn, studentRef){
    var s = resolveStudent(studentRef);
    if(!s || !s.id) return;
    var profile = getAiProfile(s);
    if(patch.preferredName !== undefined){
      var clean = isValidPreferredName(patch.preferredName, s);
      if(clean) profile.preferredName = clean;
      else if(patch.preferredName === '' || patch.preferredName === null) profile.preferredName = '';
    }
    if(patch.nameAskedAlice) profile.nameAsked.alice = true;
    if(patch.nameAskedJill) profile.nameAsked.jill = true;
    if(patch.firstGreetingAlice) profile.firstGreetingDone.alice = true;
    if(patch.firstGreetingJill) profile.firstGreetingDone.jill = true;
    s.aiProfile = profile;
    purgeBadPreferredName(s);
    if(typeof dbSetFn === 'function') await dbSetFn('infinity_students', s.id, s);
    if(global.ALL_STUDENTS) global.ALL_STUDENTS[s.id] = s;
    global._currentStudent = s;
    global._portalStudent = s;
  }

  async function processUserNameReply(text, tutor, dbSetFn){
    /* Disabled — PTT mis-hears "I'm planning…" and staff names. Use registered name only. */
    return;
  }

  function detectStudySignals(text){
    if(!text) return {};
    var t = String(text).toLowerCase();
    var signals = {};
    if(/\b(no entiendo|no comprendo|confus|perdid|lost|don't understand|do not understand|confused|what do you mean)\b/.test(t)) signals.confused = true;
    if(/\b(más corto|más breve|shorter|resume|resumí|keep it short|too long)\b/.test(t)) signals.prefersShort = true;
    if(/\b(otro ejemplo|another example|dame un ejemplo|give me an example|más ejemplos)\b/.test(t)) signals.prefersExamples = true;
    if(/\b(más lento|slow down|despacio|muy rápido|too fast)\b/.test(t)) signals.prefersSlow = true;
    if(/\b(en español|in spanish|explicame en español|explain in spanish)\b/.test(t)) signals.prefersSpanish = true;
    if(/\b(visual|diagrama|dibujo|picture|see it)\b/.test(t)) signals.prefersVisual = true;
    return signals;
  }

  async function applyStudySignalsFromMessage(text, dbSetFn, studentRef){
    var s = resolveStudent(studentRef);
    if(!s || !s.id) return;
    var signals = detectStudySignals(text);
    var keys = Object.keys(signals);
    if(!keys.length) return;
    s.aiProfile = s.aiProfile || {};
    var lp = s.aiProfile.learningPrefs || {};
    if(signals.confused) lp.confusionCount = (lp.confusionCount || 0) + 1;
    if(signals.prefersShort) lp.prefersShort = true;
    if(signals.prefersExamples) lp.prefersExamples = true;
    if(signals.prefersSlow) lp.prefersSlow = true;
    if(signals.prefersSpanish) lp.prefersSpanish = true;
    if(signals.prefersVisual) lp.prefersVisual = true;
    lp.lastSignalAt = new Date().toISOString();
    s.aiProfile.learningPrefs = lp;
    if(typeof dbSetFn === 'function') await dbSetFn('infinity_students', s.id, s);
    if(global.ALL_STUDENTS) global.ALL_STUDENTS[s.id] = s;
    global._currentStudent = s;
    global._portalStudent = s;
  }

  global.AiProfile = {
    getAiProfile: getAiProfile,
    studentFirstName: studentFirstName,
    displayName: displayName,
    sanitizePreferredName: sanitizePreferredName,
    detectPreferredName: detectPreferredName,
    purgeBadPreferredName: purgeBadPreferredName,
    repairPoisonedProfile: repairPoisonedProfile,
    enrichStudentPayload: enrichStudentPayload,
    saveAiProfilePatch: saveAiProfilePatch,
    applyStudySignalsFromMessage: applyStudySignalsFromMessage,
    detectStudySignals: detectStudySignals,
    aliceSessionMode: aliceSessionMode,
    jillSessionMode: jillSessionMode,
    processUserNameReply: processUserNameReply
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
