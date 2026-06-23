(function(global){
  'use strict';

  var BLOCK = ['idiota','tonto','stupid','idiot','puto','puta','mierda','shit','fuck','asshole','pendejo','cabron','cabrón','imbecil','imbécil','moron','retard','bitch','perra','dog','slut','whore','marica','maricon'];

  function getAiProfile(student){
    var raw = (student && student.aiProfile) || {};
    return {
      preferredName: String(raw.preferredName || '').trim(),
      nameAsked: {
        alice: !!(raw.nameAsked && raw.nameAsked.alice),
        jill: !!(raw.nameAsked && raw.nameAsked.jill)
      },
      firstGreetingDone: {
        alice: !!(raw.firstGreetingDone && raw.firstGreetingDone.alice),
        jill: !!(raw.firstGreetingDone && raw.firstGreetingDone.jill)
      }
    };
  }

  function studentFirstName(student){
    var full = String((student && student.info && student.info.name) || (student && student.name) || '').trim();
    return full.split(/\s+/)[0] || 'estudiante';
  }

  function displayName(student){
    var p = getAiProfile(student);
    return p.preferredName || studentFirstName(student);
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
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  }

  function detectPreferredName(text){
    if(!text) return null;
    var t = String(text).trim();
    var patterns = [
      /(?:ll[aá]mame|llama me|pod[eé]s decirme|me dec[ií]s|prefiero que me digas|me gustar[ií]a que me digas|call me|please call me|you can call me|i prefer to be called|i'd like to be called|my preferred name is|i go by)\s+[""']?([A-Za-zÁÉÍÓÚáéíóúÑñüÜ]{2,20})/i,
      /(?:me llamo|my name is|i'm|i am)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,20})(?:\s|$|\.|,)/i,
      /(?:solo|just|only)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,20})/i
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

  function enrichStudentPayload(student){
    if(!student) return {};
    return Object.assign({}, student, {
      aiProfile: getAiProfile(student),
      name: (student.info && student.info.name) || student.name || 'Student'
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
      var clean = sanitizePreferredName(patch.preferredName);
      if(clean) profile.preferredName = clean;
    }
    if(patch.nameAskedAlice) profile.nameAsked.alice = true;
    if(patch.nameAskedJill) profile.nameAsked.jill = true;
    if(patch.firstGreetingAlice) profile.firstGreetingDone.alice = true;
    if(patch.firstGreetingJill) profile.firstGreetingDone.jill = true;
    s.aiProfile = profile;
    if(typeof dbSetFn === 'function') await dbSetFn('infinity_students', s.id, s);
    if(global.ALL_STUDENTS) global.ALL_STUDENTS[s.id] = s;
    global._currentStudent = s;
    global._portalStudent = s;
  }

  async function processUserNameReply(text, tutor, dbSetFn){
    var s = resolveStudent(null);
    if(!s) return;
    var profile = getAiProfile(s);
    var key = tutor === 'alice' ? 'alice' : 'jill';
    if(!profile.nameAsked[key]) return;
    if(profile.preferredName) return;
    var detected = detectPreferredName(text);
    if(!detected) return;
    await saveAiProfilePatch({ preferredName: detected }, dbSetFn, s);
  }

  global.AiProfile = {
    getAiProfile: getAiProfile,
    studentFirstName: studentFirstName,
    displayName: displayName,
    sanitizePreferredName: sanitizePreferredName,
    detectPreferredName: detectPreferredName,
    enrichStudentPayload: enrichStudentPayload,
    saveAiProfilePatch: saveAiProfilePatch,
    aliceSessionMode: aliceSessionMode,
    jillSessionMode: jillSessionMode,
    processUserNameReply: processUserNameReply
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
