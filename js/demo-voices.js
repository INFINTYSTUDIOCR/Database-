/**
 * Demo voices — ONLY from your ElevenLabs account (config/voices.json + Render env).
 * Never hardcode premade Josh/Rachel IDs from the internet.
 */
window.DEMO_VOICES = {
  alice: {
    voiceId: 'r1KmysJdVYZjJCm4mL3b',
    label: 'Alice',
    gender: 'female',
    source: 'elevenlabs-account'
  },
  nexora_star: {
    voiceId: 'bfGb7JTLUnZebZRiFYyq',
    label: 'Interviewer (American English)',
    gender: 'male',
    source: 'voices.json',
    needsMaleVoice: false
  },
  nexora_cs: {
    voiceId: 'NoOVOzCQFLOvtsMoNcdT',
    label: 'Maria Santos',
    gender: 'female',
    source: 'jill-voices.json'
  }
};

async function syncDemoVoicesFromServer() {
  var base = typeof DEMO_BACKEND !== 'undefined' ? DEMO_BACKEND : 'https://alice-by-infinity.onrender.com';
  try {
    var r = await fetch(base + '/demo/voices');
    var parsed = await (typeof demoParseResponse === 'function'
      ? demoParseResponse(r)
      : r.json().then(function (d) { return { ok: r.ok, data: d }; }));
    if (parsed.ok && parsed.data) {
      window.DEMO_VOICES = parsed.data;
    } else if (parsed.data && !parsed.ok && parsed.data.alice) {
      window.DEMO_VOICES = parsed.data;
    }
  } catch (e) { /* keep local fallback */ }
}

function demoVoiceProfile(product, scenario) {
  var v = window.DEMO_VOICES || {};
  if (product === 'alice') return v.alice || window.DEMO_VOICES.alice;
  if (product === 'nexora') {
    return scenario === 'customer_service' ? v.nexora_cs : v.nexora_star;
  }
  return v.alice;
}
