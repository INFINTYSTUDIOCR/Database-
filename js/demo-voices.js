/** Stable ElevenLabs voice IDs for public demos (must match backend allowlist) */
window.DEMO_VOICES = {
  alice: {
    voiceId: 'r1KmysJdVYZjJCm4mL3b',
    gender: 'female',
    browserHints: ['samantha', 'zira', 'jenny', 'aria']
  },
  nexora_star: {
    voiceId: '8WqHCYyrnUqoK70Px5EJ',
    gender: 'male',
    label: 'Interviewer',
    browserHints: ['david', 'guy', 'mark', 'microsoft david', 'google uk english male']
  },
  nexora_cs: {
    voiceId: 'NyZqLdjqUb8SpOUKIlWT',
    gender: 'female',
    label: 'Maria Santos',
    browserHints: ['zira', 'samantha', 'jenny', 'aria', 'hazel']
  }
};

window.DEMO_VOICE_ALLOWLIST = [
  'r1KmysJdVYZjJCm4mL3b',
  '8WqHCYyrnUqoK70Px5EJ',
  'NIkIuJZ8oQMuKZqwKtnm',
  'b4XCIIupgo5eH7TxhBNk',
  '1a0nAYA3FcNQcMMfbddY',
  'ztyYYqlYMny7nllhThgo',
  'NyZqLdjqUb8SpOUKIlWT'
];

function demoVoiceProfile(product, scenario) {
  if (product === 'alice') return window.DEMO_VOICES.alice;
  if (product === 'nexora') {
    return scenario === 'customer_service' ? window.DEMO_VOICES.nexora_cs : window.DEMO_VOICES.nexora_star;
  }
  return window.DEMO_VOICES.alice;
}
