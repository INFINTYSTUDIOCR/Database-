/**
 * Nexora — profile voice congruency: firstName + lastName → gender + accent + voiceId.
 * Applies to every profile (characters, scenario bank seeds, generated profiles).
 */
(function (global) {
  var NEXORA_MALE_VOICE_IDS = {
    bfGb7JTLUnZebZRiFYyq: 1, eVKQybPTL0poBPxBa8L6: 1, '8WqHCYyrnUqoK70Px5EJ': 1,
    b4XCIIupgo5eH7TxhBNk: 1, Xh5OictnmgRO4dff7pLm: 1, NIkIuJZ8oQMuKZqwKtnm: 1, IP2syKL31S2JthzSSfZH: 1
  };
  var NEXORA_FEMALE_VOICE_IDS = {
    r1KmysJdVYZjJCm4mL3b: 1, NoOVOzCQFLOvtsMoNcdT: 1, KeMlo4IJd6GMKdqA5lLY: 1,
    NyZqLdjqUb8SpOUKIlWT: 1, ztyYYqlYMny7nllhThgo: 1, J60xcCIM7ET7HMi7hMZu: 1,
    '1a0nAYA3FcNQcMMfbddY': 1, k6aNMn2EN3T8vpJSBhQw: 1
  };

  function clientFirstName(profile) {
    if (!profile) return '';
    if (profile.firstName) return String(profile.firstName).trim();
    var name = String(profile.name || '').replace(/—.*/, '').trim();
    return name.split(/\s+/)[0] || '';
  }

  function isMaleVoiceId(id) { return !!NEXORA_MALE_VOICE_IDS[String(id || '')]; }
  function isFemaleVoiceId(id) { return !!NEXORA_FEMALE_VOICE_IDS[String(id || '')]; }

  function isFemaleClientName(first) {
    if (typeof isFemaleFirstName === 'function') return isFemaleFirstName(first);
    if (global.isFemaleByName) return global.isFemaleByName(first);
    return false;
  }

  /** Single rule: identity comes from the person's name (gender + ethnicity + voice). */
  function ensureProfileVoiceCongruency(profile) {
    if (!profile) return profile;
    var first = clientFirstName(profile);
    if (!first) return profile;

    if (typeof syncNexoraVoiceWithName === 'function') {
      syncNexoraVoiceWithName(profile);
    } else if (typeof buildNexoraIdentityFromName === 'function') {
      var full = profile.name || (first + ' ' + (profile.lastName || '')).trim();
      var id = buildNexoraIdentityFromName(full);
      profile.firstName = id.firstName;
      profile.lastName = id.lastName || profile.lastName;
      profile.name = id.name;
      profile.gender = id.gender;
      profile.voiceId = id.voiceId;
      profile.voiceAccent = id.voiceAccent;
      profile.ethnicity = id.ethnicity;
    }

    var female = isFemaleClientName(first);
    profile.gender = female ? 'female' : 'male';
    if (female && isMaleVoiceId(profile.voiceId) && typeof pickNexoraVoiceForProfile === 'function') {
      var fv = pickNexoraVoiceForProfile({ gender: 'female', voiceAccent: profile.voiceAccent || 'American Female' }, true);
      if (fv && fv.id) { profile.voiceId = fv.id; profile.voiceAccent = fv.accent; }
    }
    if (!female && isFemaleVoiceId(profile.voiceId) && typeof pickNexoraVoiceForProfile === 'function') {
      var mv = pickNexoraVoiceForProfile({ gender: 'male', voiceAccent: profile.voiceAccent || 'American Male' }, false);
      if (mv && mv.id) { profile.voiceId = mv.id; profile.voiceAccent = mv.accent; }
    }

    return profile;
  }

  function resolveNexoraTtsVoiceId(profile) {
    ensureProfileVoiceCongruency(profile);
    if (typeof pickNexoraVoiceForProfile === 'function') {
      var female = profile && profile.gender === 'female';
      var picked = pickNexoraVoiceForProfile(profile, female);
      if (picked && picked.id) {
        if (female && isMaleVoiceId(picked.id)) return 'r1KmysJdVYZjJCm4mL3b';
        if (!female && isFemaleVoiceId(picked.id)) return 'bfGb7JTLUnZebZRiFYyq';
        return picked.id;
      }
    }
    return (profile && profile.voiceId) || (profile && profile.gender === 'female' ? 'r1KmysJdVYZjJCm4mL3b' : 'bfGb7JTLUnZebZRiFYyq');
  }

  function nexoraVoiceIdsForProfileLocked(profile) {
    ensureProfileVoiceCongruency(profile);
    var primary = resolveNexoraTtsVoiceId(profile);
    var female = profile && profile.gender === 'female';
    var ids = [primary];
    if (female) {
      ['r1KmysJdVYZjJCm4mL3b', 'NoOVOzCQFLOvtsMoNcdT', '1a0nAYA3FcNQcMMfbddY', 'NyZqLdjqUb8SpOUKIlWT', 'ztyYYqlYMny7nllhThgo'].forEach(function (id) {
        if (ids.indexOf(id) < 0) ids.push(id);
      });
    } else {
      ['bfGb7JTLUnZebZRiFYyq', 'NIkIuJZ8oQMuKZqwKtnm', '8WqHCYyrnUqoK70Px5EJ', 'b4XCIIupgo5eH7TxhBNk'].forEach(function (id) {
        if (ids.indexOf(id) < 0) ids.push(id);
      });
    }
    return ids;
  }

  global.ensureProfileVoiceCongruency = ensureProfileVoiceCongruency;
  global.lockVoiceForProfile = ensureProfileVoiceCongruency;
  global.ensureNexoraClientVoice = ensureProfileVoiceCongruency;
  global.resolveNexoraTtsVoiceId = resolveNexoraTtsVoiceId;
  global.nexoraVoiceIdsForProfileLocked = nexoraVoiceIdsForProfileLocked;
  global.isFemaleClientName = isFemaleClientName;
})(typeof window !== 'undefined' ? window : globalThis);
