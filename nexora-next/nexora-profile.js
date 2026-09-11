// Nexora — random multicultural names + accent-locked ElevenLabs voice per call
(function (global) {
  var NEXORA_ETHNICITIES = ['american', 'british', 'indian', 'german', 'russian', 'chinese', 'latino', 'filipino'];

  var NEXORA_FIRST_NAMES = {
    american: {
      male: ['James', 'Michael', 'William', 'David', 'Robert', 'John', 'Brian', 'Kevin', 'Mark', 'Steven'],
      female: ['Sarah', 'Jennifer', 'Elizabeth', 'Margaret', 'Emily', 'Ashley', 'Karen', 'Lisa', 'Amanda', 'Patricia']
    },
    british: {
      male: ['Oliver', 'Harry', 'George', 'Jack', 'Thomas', 'William', 'James', 'Edward', 'Henry', 'Daniel'],
      female: ['Emily', 'Olivia', 'Charlotte', 'Amelia', 'Sophie', 'Grace', 'Lucy', 'Hannah', 'Kate', 'Victoria']
    },
    indian: {
      male: ['Raj', 'Arjun', 'Vikram', 'Rahul', 'Amit', 'Sanjay', 'Rohan', 'Dev', 'Kiran', 'Arun'],
      female: ['Priya', 'Ananya', 'Kavya', 'Neha', 'Divya', 'Meera', 'Pooja', 'Shreya', 'Nisha', 'Deepa']
    },
    german: {
      male: ['Hans', 'Klaus', 'Stefan', 'Markus', 'Felix', 'Jonas', 'Lukas', 'Tobias', 'Henrik', 'Sven'],
      female: ['Anna', 'Greta', 'Lena', 'Sabine', 'Heike', 'Katrin', 'Ingrid', 'Petra', 'Monika', 'Claudia']
    },
    russian: {
      male: ['Dmitri', 'Ivan', 'Alexei', 'Nikolai', 'Sergei', 'Pavel', 'Mikhail', 'Andrei', 'Viktor', 'Yuri'],
      female: ['Natasha', 'Olga', 'Svetlana', 'Irina', 'Katya', 'Anya', 'Elena', 'Tatiana', 'Marina', 'Daria']
    },
    chinese: {
      male: ['Wei', 'Jun', 'Ming', 'Hao', 'Chen', 'Lei', 'Bo', 'Jian', 'Tao', 'Yong'],
      female: ['Mei', 'Li', 'Yan', 'Xiu', 'Lin', 'Fang', 'Jing', 'Hui', 'Lan', 'Xia']
    },
    latino: {
      male: ['Carlos', 'Miguel', 'Diego', 'Luis', 'Marco', 'Rafael', 'Jorge', 'Andres', 'Pablo', 'Mateo'],
      female: ['Sofia', 'Maria', 'Elena', 'Camila', 'Lucia', 'Valentina', 'Isabella', 'Gabriela', 'Daniela', 'Carmen']
    }
  };

  var NEXORA_LAST_NAMES = [
    'Thompson', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Clark',
    'Clarke', 'Davies', 'Wright', 'Morgan', 'Evans', 'Patel', 'Sharma', 'Singh', 'Nair', 'Gupta', 'Reddy',
    'Mueller', 'Schmidt', 'Weber', 'Fischer', 'Becker', 'Hoffmann', 'Petrov', 'Ivanov', 'Smirnov', 'Kuznetsov',
    'Volkov', 'Chen', 'Wang', 'Liu', 'Zhang', 'Huang', 'Li', 'Torres', 'Rodriguez', 'Martinez', 'Hernandez',
    'Garcia', 'Lopez', 'Mendoza', 'Silva', 'Ramirez', 'Castillo', 'Okafor', 'Mitchell', 'Foster', 'Mejia',
    'Santos', 'Reyes', 'Cruz', 'Ramos', 'Bautista', 'Aquino'
  ];

  var NEXORA_LAST_NAMES_BY_ETH = {
    american: ['Thompson', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Clark', 'Mitchell', 'Foster', 'Okafor'],
    british: ['Clarke', 'Davies', 'Wright', 'Morgan', 'Evans'],
    indian: ['Patel', 'Sharma', 'Singh', 'Nair', 'Gupta', 'Reddy'],
    german: ['Mueller', 'Schmidt', 'Weber', 'Fischer', 'Becker', 'Hoffmann'],
    russian: ['Petrov', 'Ivanov', 'Smirnov', 'Kuznetsov', 'Volkov'],
    chinese: ['Chen', 'Wang', 'Liu', 'Zhang', 'Huang', 'Li'],
    latino: ['Torres', 'Rodriguez', 'Martinez', 'Hernandez', 'Garcia', 'Lopez', 'Mendoza', 'Silva', 'Ramirez', 'Castillo', 'Mejia'],
    filipino: ['Santos', 'Reyes', 'Cruz', 'Ramos', 'Bautista', 'Aquino', 'Garcia', 'Torres']
  };

  var NEXORA_LAST_NAME_ETHNICITY = {
    Torres: 'latino', Rodriguez: 'latino', Martinez: 'latino', Hernandez: 'latino', Garcia: 'latino',
    Lopez: 'latino', Mendoza: 'latino', Silva: 'latino', Ramirez: 'latino', Castillo: 'latino', Mejia: 'latino',
    Santos: 'filipino', Reyes: 'filipino', Cruz: 'filipino', Ramos: 'filipino', Bautista: 'filipino', Aquino: 'filipino',
    Patel: 'indian', Sharma: 'indian', Singh: 'indian', Nair: 'indian', Gupta: 'indian', Reddy: 'indian',
    Mueller: 'german', Schmidt: 'german', Weber: 'german', Fischer: 'german', Becker: 'german', Hoffmann: 'german',
    Petrov: 'russian', Ivanov: 'russian', Smirnov: 'russian', Kuznetsov: 'russian', Volkov: 'russian',
    Chen: 'chinese', Wang: 'chinese', Liu: 'chinese', Zhang: 'chinese', Huang: 'chinese', Li: 'chinese',
    Clarke: 'british', Davies: 'british', Wright: 'british', Morgan: 'british', Evans: 'british',
    Thompson: 'american', Johnson: 'american', Williams: 'american', Brown: 'american', Davis: 'american',
    Wilson: 'american', Anderson: 'american', Taylor: 'american', Moore: 'american', Clark: 'american',
    Mitchell: 'american', Foster: 'american', Okafor: 'american'
  };

  var NEXORA_ETHNICITY_ACCENT = {
    american: { male: 'American Male', female: 'American Female' },
    british: { male: 'British Male', female: 'British Female' },
    indian: { male: 'Indian Male', female: 'Indian Female' },
    german: { male: 'German Male', female: 'German Female' },
    russian: { male: 'Russian Male', female: 'Russian Female' },
    chinese: { male: 'Chinese Male', female: 'Chinese Female' },
    latino: { male: 'Latino Male', female: 'Latina Female' }
  };

  var NEXORA_VOICES_MALE = [
    { id: 'bfGb7JTLUnZebZRiFYyq', accent: 'American Male' },
    { id: 'eVKQybPTL0poBPxBa8L6', accent: 'British Male' },
    { id: '8WqHCYyrnUqoK70Px5EJ', accent: 'Indian Male' },
    { id: 'b4XCIIupgo5eH7TxhBNk', accent: 'German Male' },
    { id: 'Xh5OictnmgRO4dff7pLm', accent: 'Russian Male' },
    { id: 'NIkIuJZ8oQMuKZqwKtnm', accent: 'Chinese Male' },
    { id: 'IP2syKL31S2JthzSSfZH', accent: 'Latino Male' }
  ];

  var NEXORA_VOICES_FEMALE = [
    { id: 'r1KmysJdVYZjJCm4mL3b', accent: 'American Female' },
    { id: 'NoOVOzCQFLOvtsMoNcdT', accent: 'American Female' },
    { id: 'KeMlo4IJd6GMKdqA5lLY', accent: 'British Female' },
    { id: 'NyZqLdjqUb8SpOUKIlWT', accent: 'Indian Female' },
    { id: 'ztyYYqlYMny7nllhThgo', accent: 'German Female' },
    { id: 'J60xcCIM7ET7HMi7hMZu', accent: 'Russian Female' },
    { id: '1a0nAYA3FcNQcMMfbddY', accent: 'Chinese Female' },
    { id: 'k6aNMn2EN3T8vpJSBhQw', accent: 'Latina Female' }
  ];

  var NEXORA_TTS_FALLBACKS = ['bfGb7JTLUnZebZRiFYyq', 'r1KmysJdVYZjJCm4mL3b', 'NoOVOzCQFLOvtsMoNcdT'];

  var NEXORA_NAME_ETHNICITY = {
    Linda: 'latino', Carlos: 'latino', Miguel: 'latino', Diego: 'latino', Luis: 'latino', Marco: 'latino',
    Rafael: 'latino', Jorge: 'latino', Andres: 'latino', Pablo: 'latino', Mateo: 'latino',
    Sofia: 'latino', Maria: 'latino', Elena: 'latino', Camila: 'latino', Lucia: 'latino',
    Valentina: 'latino', Gabriela: 'latino', Carmen: 'latino', Daniela: 'latino', Isabella: 'latino',
    Jose: 'latino', Juan: 'latino', Pedro: 'latino', Rosa: 'latino', Ana: 'latino',
    Raj: 'indian', Arjun: 'indian', Vikram: 'indian', Priya: 'indian', Ananya: 'indian', Patel: 'indian',
    Dmitri: 'russian', Ivan: 'russian', Natasha: 'russian', Olga: 'russian', Irina: 'russian',
    Wei: 'chinese', Mei: 'chinese', Chen: 'chinese', Wang: 'chinese', Liu: 'chinese',
    Hiro: 'chinese', Ken: 'chinese', Yuki: 'chinese', Min: 'chinese', Soo: 'chinese', Jin: 'chinese',
    Hans: 'german', Klaus: 'german', Anna: 'german', Greta: 'german', Mueller: 'german',
    Oliver: 'british', Harry: 'british', Emily: 'british', Charlotte: 'british',
    James: 'american', Michael: 'american', Sarah: 'american', Jennifer: 'american'
  };

  // Scenario-bank first names (scripts/build-nexora-scenario-bank.mjs FIRST / FEMALE_FIRST)
  var NEXORA_BANK_FEMALE = {
    Margaret: 1, Sarah: 1, Elizabeth: 1, Jennifer: 1, Linda: 1, Patricia: 1, Sofia: 1, Lisa: 1,
    Amanda: 1, Karen: 1, Priya: 1, Ananya: 1, Emily: 1, Jessica: 1, Ashley: 1, Nicole: 1, Stephanie: 1,
    Rebecca: 1, Laura: 1, Angela: 1, Michelle: 1, Melissa: 1, Deborah: 1, Rachel: 1, Nancy: 1, Susan: 1,
    Maria: 1, Diana: 1, Victoria: 1, Elena: 1, Hannah: 1, Olivia: 1, Emma: 1, Ava: 1, Mia: 1, Chloe: 1,
    Grace: 1, Natalie: 1, Brooke: 1, Charlotte: 1, Sophie: 1, Natasha: 1, Olga: 1, Irina: 1, Mei: 1, Li: 1,
    Yan: 1, Greta: 1, Lena: 1, Camila: 1, Lucia: 1, Valentina: 1, Neha: 1, Deepa: 1, Katya: 1, Anya: 1,
    Anna: 1, Sabine: 1, Heike: 1, Katrin: 1, Ingrid: 1, Petra: 1, Monika: 1, Claudia: 1, Svetlana: 1,
    Tatiana: 1, Marina: 1, Daria: 1, Fang: 1, Jing: 1, Hui: 1, Lan: 1, Xia: 1, Gabriela: 1, Daniela: 1,
    Carmen: 1, Isabella: 1, Pooja: 1, Shreya: 1, Nisha: 1, Divya: 1, Meera: 1, Kavya: 1, Amelia: 1,
    Kate: 1, Lucy: 1
  };

  function nexoraHashSeed(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function nexoraAccentKey(accent) {
    var s = String(accent || '').toLowerCase();
    if (s.indexOf('latina') >= 0 || s.indexOf('latino') >= 0) return 'latino';
    var m = String(accent || '').match(/^(American|British|Chinese|German|Indian|Russian)/i);
    return m ? m[1].toLowerCase() : 'american';
  }

  function nexoraVoicesForAccent(pool, accent) {
    var key = nexoraAccentKey(accent);
    var filtered = (pool || []).filter(function (v) { return nexoraAccentKey(v.accent) === key; });
    return filtered.length ? filtered : (pool || []);
  }

  function pickNexoraVoiceForProfile(profile, femaleOverride) {
    var female;
    if (typeof femaleOverride === 'boolean') {
      female = femaleOverride;
    } else if (profile && profile.firstName) {
      female = isFemaleFirstName(profile.firstName);
    } else {
      female = profile && profile.gender === 'female';
    }
    var fullPool = female ? NEXORA_VOICES_FEMALE : NEXORA_VOICES_MALE;
    var pool = nexoraVoicesForAccent(fullPool, (profile && profile.voiceAccent) || 'American');
    if (profile && profile.voiceId) {
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].id === profile.voiceId) return pool[i];
      }
    }
    var seed = String((profile && profile.firstName) || '') + '|' + String((profile && profile.lastName) || '') + '|' + String((profile && profile.voiceAccent) || '');
    var idx = nexoraHashSeed(seed) % pool.length;
    return pool[idx] || pool[0];
  }

  function nexoraVoiceGenderMatchesProfile(profile, female) {
    if (!profile || !profile.voiceAccent) return false;
    var va = String(profile.voiceAccent);
    var voiceFemale = va.indexOf('Female') >= 0 || va.indexOf('Latina') >= 0;
    var voiceMale = va.indexOf('Male') >= 0 && !voiceFemale;
    return female ? voiceFemale : voiceMale;
  }

  function nexoraEthnicityForFirstName(first) {
    return NEXORA_NAME_ETHNICITY[first] || 'american';
  }

  function parseNexoraFullName(name) {
    var clean = String(name || '').replace(/—.*/, '').trim();
    var parts = clean.split(/\s+/).filter(Boolean);
    var firstName = parts[0] || 'Alex';
    var lastName = parts.slice(1).join(' ');
    return {
      firstName: firstName,
      lastName: lastName,
      name: lastName ? firstName + ' ' + lastName : firstName
    };
  }

  function nexoraEthnicityForLastName(last) {
    if (!last) return null;
    var token = String(last).trim().split(/\s+/).pop();
    return NEXORA_LAST_NAME_ETHNICITY[token] || null;
  }

  function nexoraEthnicityForName(fullName) {
    var p = parseNexoraFullName(fullName);
    var lastEth = nexoraEthnicityForLastName(p.lastName);
    var firstEth = nexoraEthnicityForFirstName(p.firstName);
    if (lastEth === 'filipino' || lastEth === 'latino') return lastEth;
    if (firstEth === 'filipino' || firstEth === 'latino') return firstEth;
    if (lastEth) return lastEth;
    if (firstEth) return firstEth;
    return 'american';
  }

  function nexoraVoiceEthnicity(ethnicity) {
    return ethnicity === 'filipino' ? 'latino' : ethnicity;
  }

  function isFemaleFirstName(first) {
    if (!first) return false;
    var fn = String(first).trim();
    if (NEXORA_BANK_FEMALE[fn]) return true;
    for (var eth in NEXORA_FIRST_NAMES) {
      if (!NEXORA_FIRST_NAMES[eth]) continue;
      if (NEXORA_FIRST_NAMES[eth].female.indexOf(fn) >= 0) return true;
      if (NEXORA_FIRST_NAMES[eth].male.indexOf(fn) >= 0) return false;
    }
    if (global.isFemaleByName) return global.isFemaleByName(fn);
    return false;
  }

  function isFemaleFullName(fullName) {
    var p = parseNexoraFullName(fullName);
    return isFemaleFirstName(p.firstName);
  }

  function syncNexoraVoiceWithName(profile) {
    if (!profile || !profile.firstName) return profile;
    var fullName = profile.name || (profile.firstName + ' ' + (profile.lastName || '')).trim();
    var female = isFemaleFullName(fullName);
    var expectedGender = female ? 'female' : 'male';
    if (profile.gender === expectedGender && profile.voiceId && nexoraVoiceGenderMatchesProfile(profile, female)) {
      if (!profile.ethnicity) profile.ethnicity = nexoraEthnicityForName(fullName);
      return profile;
    }
    var id = buildNexoraIdentityFromName(fullName);
    profile.gender = id.gender;
    profile.voiceId = id.voiceId;
    profile.voiceAccent = id.voiceAccent;
    profile.ethnicity = id.ethnicity;
    return profile;
  }

  function ensureNexoraClientVoice(profile) {
    return assignNexoraProfile(profile);
  }

  /** Assign / fix profile identity: name → gender → voice (always congruent). */
  function assignNexoraProfile(profile) {
    if (!profile) return profile;
    if (!profile.firstName && profile.name) {
      var parsed = parseNexoraFullName(profile.name);
      profile.firstName = parsed.firstName;
      profile.lastName = parsed.lastName;
      profile.name = parsed.name;
    }
    if (typeof global.ensureProfileVoiceCongruency === 'function') {
      global.ensureProfileVoiceCongruency(profile);
    } else {
      syncNexoraVoiceWithName(profile);
    }
    return profile;
  }

  function buildNexoraIdentityFromName(fullName) {
    var p = parseNexoraFullName(fullName);
    var female = isFemaleFullName(fullName);
    var gender = female ? 'female' : 'male';
    var ethnicity = nexoraEthnicityForName(fullName);
    var voiceEth = nexoraVoiceEthnicity(ethnicity);
    var accentLabel = NEXORA_ETHNICITY_ACCENT[voiceEth][gender];
    var voice = pickNexoraVoiceForProfile({ gender: gender, voiceAccent: accentLabel });
    return {
      firstName: p.firstName,
      lastName: p.lastName,
      name: p.name,
      gender: gender,
      ethnicity: ethnicity,
      voiceId: voice.id,
      voiceAccent: voice.accent
    };
  }

  function applyNexoraIdentityFromName(profile, fullName) {
    var id = buildNexoraIdentityFromName(fullName);
    profile = profile || {};
    profile.firstName = id.firstName;
    profile.lastName = id.lastName;
    profile.name = id.name;
    profile.gender = id.gender;
    profile.ethnicity = id.ethnicity;
    profile.voiceId = id.voiceId;
    profile.voiceAccent = id.voiceAccent;
    return profile;
  }

  function pickRandomNexoraIdentity() {
    var eth = NEXORA_ETHNICITIES[Math.floor(Math.random() * NEXORA_ETHNICITIES.length)];
    var isFemale = Math.random() > 0.5;
    var gender = isFemale ? 'female' : 'male';
    var nameEth = eth === 'filipino' ? 'latino' : eth;
    var firstPool = NEXORA_FIRST_NAMES[nameEth][gender];
    var fn = firstPool[Math.floor(Math.random() * firstPool.length)];
    var lnPool = NEXORA_LAST_NAMES_BY_ETH[eth] || NEXORA_LAST_NAMES_BY_ETH.latino;
    var ln = lnPool[Math.floor(Math.random() * lnPool.length)];
    var accentLabel = NEXORA_ETHNICITY_ACCENT[nexoraVoiceEthnicity(eth)][gender];
    var voice = pickNexoraVoiceForProfile({ gender: gender, voiceAccent: accentLabel });
    return {
      firstName: fn,
      lastName: ln,
      name: fn + ' ' + ln,
      gender: gender,
      ethnicity: eth,
      voiceId: voice.id,
      voiceAccent: voice.accent
    };
  }

  function getNexoraVoiceCatalog() {
    return {
      maleAccents: NEXORA_VOICES_MALE.map(function (v) { return v.accent; }),
      femaleAccents: NEXORA_VOICES_FEMALE.map(function (v) { return v.accent; }),
      ethnicities: NEXORA_ETHNICITIES.slice(),
      filipinoVoiceAccent: 'Latino/Latina (shared with latino)',
      totalVoices: NEXORA_VOICES_MALE.length + NEXORA_VOICES_FEMALE.length
    };
  }

  function getVoiceForPersonName(name) {
    var id = buildNexoraIdentityFromName(name);
    return { id: id.voiceId, accent: id.voiceAccent };
  }

  function applyNexoraVoicesPayload(data) {
    if (!data) return;
    if (data.male && data.male.length) NEXORA_VOICES_MALE = data.male;
    if (data.female && data.female.length) NEXORA_VOICES_FEMALE = data.female;
    if (data.fallbackIds && data.fallbackIds.length) NEXORA_TTS_FALLBACKS = data.fallbackIds;
  }

  global.NEXORA_VOICES_MALE = NEXORA_VOICES_MALE;
  global.NEXORA_VOICES_FEMALE = NEXORA_VOICES_FEMALE;
  global.NEXORA_TTS_FALLBACKS = NEXORA_TTS_FALLBACKS;
  global.nexoraAccentKey = nexoraAccentKey;
  global.nexoraVoicesForAccent = nexoraVoicesForAccent;
  global.pickNexoraVoiceForProfile = pickNexoraVoiceForProfile;
  global.pickRandomNexoraIdentity = pickRandomNexoraIdentity;
  global.getVoiceForPersonName = getVoiceForPersonName;
  global.nexoraEthnicityForFirstName = nexoraEthnicityForFirstName;
  global.nexoraEthnicityForName = nexoraEthnicityForName;
  global.buildNexoraIdentityFromName = buildNexoraIdentityFromName;
  global.applyNexoraIdentityFromName = applyNexoraIdentityFromName;
  global.syncNexoraVoiceWithName = syncNexoraVoiceWithName;
  global.ensureNexoraClientVoice = ensureNexoraClientVoice;
  global.assignNexoraProfile = assignNexoraProfile;
  global.isFemaleFirstName = isFemaleFirstName;
  global.getNexoraVoiceCatalog = getNexoraVoiceCatalog;
  global.applyNexoraVoicesPayload = applyNexoraVoicesPayload;
})(typeof window !== 'undefined' ? window : globalThis);
