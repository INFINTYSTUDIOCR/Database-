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
    Hans: 'german', Klaus: 'german', Anna: 'german', Greta: 'german', Mueller: 'german',
    Oliver: 'british', Harry: 'british', Emily: 'british', Charlotte: 'british',
    James: 'american', Michael: 'american', Sarah: 'american', Jennifer: 'american'
  };

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
    var female = (typeof femaleOverride === 'boolean') ? femaleOverride : (profile && profile.gender === 'female');
    var fullPool = female ? NEXORA_VOICES_FEMALE : NEXORA_VOICES_MALE;
    var pool = nexoraVoicesForAccent(fullPool, (profile && profile.voiceAccent) || 'American');
    if (profile && profile.voiceId) {
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].id === profile.voiceId) return pool[i];
      }
    }
    return pool[Math.floor(Math.random() * pool.length)] || pool[0];
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

  function buildNexoraIdentityFromName(fullName) {
    var p = parseNexoraFullName(fullName);
    var female = global.isFemaleByName ? global.isFemaleByName(fullName) : false;
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
  global.getNexoraVoiceCatalog = getNexoraVoiceCatalog;
  global.applyNexoraVoicesPayload = applyNexoraVoicesPayload;
})(typeof window !== 'undefined' ? window : globalThis);
