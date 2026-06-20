/** Stable ElevenLabs voice IDs for public demos (must match backend allowlist) */
window.DEMO_VOICES = {
  alice: {
    voiceId: 'r1KmysJdVYZjJCm4mL3b',
    gender: 'female',
    accent: 'american',
    browserHints: ['microsoft zira', 'google us english', 'samantha', 'aria', 'jenny']
  },
  nexora_star: {
    /* Josh — ElevenLabs premade, neutral American male */
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    gender: 'male',
    accent: 'american',
    label: 'American Interviewer',
    browserHints: ['microsoft david', 'google us english', 'mark', 'guy', 'david']
  },
  nexora_cs: {
    /* Rachel — ElevenLabs premade, clear American female */
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    gender: 'female',
    accent: 'american',
    label: 'Maria Santos',
    browserHints: ['microsoft zira', 'google us english', 'samantha', 'aria', 'jenny']
  }
};

window.DEMO_VOICE_ALLOWLIST = [
  'r1KmysJdVYZjJCm4mL3b',
  'TxGEqnHWrfWFTfGW9XjX',
  '21m00Tcm4TlvDq8ikWAM',
  'pNInz6obpgDQGcFmaJgB',
  '8WqHCYyrnUqoK70Px5EJ',
  'NyZqLdjqUb8SpOUKIlWT'
];

function demoVoiceProfile(product, scenario) {
  if (product === 'alice') return window.DEMO_VOICES.alice;
  if (product === 'nexora') {
    return scenario === 'customer_service' ? window.DEMO_VOICES.nexora_cs : window.DEMO_VOICES.nexora_star;
  }
  return window.DEMO_VOICES.alice;
}
