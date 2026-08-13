/**
 * Shadow Thief SFX — stealth / heist / noir (16-bit mono WAV, no deps).
 * Soft cloth whooshes, blade metal, vault clicks, alert pulses — not fantasy combat.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'assets', 'sfx');
const SR = 44100;
fs.mkdirSync(OUT, { recursive: true });

function clamp(v) {
  return Math.max(-1, Math.min(1, v));
}
function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE((clamp(samples[i]) * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name + '.wav'), buf);
  console.log(name, (n / SR).toFixed(2) + 's');
}

function env(t, a, h, r, total) {
  if (t < a) return t / a;
  if (t < a + h) return 1;
  if (t < total) return Math.max(0, 1 - (t - a - h) / r);
  return 0;
}
function noise() {
  return Math.random() * 2 - 1;
}
function sin(f, t) {
  return Math.sin(2 * Math.PI * f * t);
}
function saw(f, t) {
  return 2 * ((t * f) % 1) - 1;
}
function square(f, t) {
  return sin(f, t) > 0 ? 1 : -1;
}
function render(sec, fn) {
  const n = Math.floor(SR * sec);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i, n);
  let peak = 0.001;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = 0.88 / peak;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

// Cloth / air whoosh (dagger swing, roll)
writeWav(
  'whoosh',
  render(0.32, (t) => {
    const e = env(t, 0.01, 0.05, 0.24, 0.32);
    const air = noise() * Math.exp(-t * 14) * 0.85;
    const soft = sin(180 * Math.exp(-t * 6), t) * Math.exp(-t * 10) * 0.25;
    return (air + soft) * e;
  })
);

// Quiet blade kiss / body hit
writeWav(
  'hit',
  render(0.2, (t) => {
    const e = env(t, 0.001, 0.015, 0.16, 0.2);
    const thud = sin(110 * Math.exp(-t * 10), t) * Math.exp(-t * 16) * 0.7;
    const cloth = noise() * Math.exp(-t * 35) * 0.4;
    const tip = sin(2400 - t * 1800, t) * Math.exp(-t * 28) * 0.2;
    return (thud + cloth + tip) * e;
  })
);

// Lockpick / UI click
writeWav(
  'click',
  render(0.05, (t) => {
    const e = env(t, 0.001, 0.006, 0.035, 0.05);
    return (sin(1450, t) * 0.45 + square(980, t) * 0.15 + noise() * Math.exp(-t * 80) * 0.25) * e;
  })
);

// Metal dagger / bolt
writeWav(
  'metal',
  render(0.18, (t) => {
    const e = env(t, 0.001, 0.02, 0.14, 0.18);
    const ring = sin(2100 * Math.exp(-t * 4), t) * Math.exp(-t * 12) * 0.55;
    const edge = saw(900, t) * Math.exp(-t * 20) * 0.2;
    const tick = noise() * Math.exp(-t * 50) * 0.35;
    return (ring + edge + tick) * e;
  })
);

// Ghost perfect — soft chime vanishing into dark
writeWav(
  'ghost',
  render(0.5, (t) => {
    const notes = [523.25, 783.99, 1046.5];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.07;
      if (t >= st) {
        s += sin(f, t - st) * env(t - st, 0.015, 0.06, 0.22, 0.35) * 0.28;
        s += sin(f * 2.01, t - st) * env(t - st, 0.02, 0.04, 0.2, 0.32) * 0.08;
      }
    });
    s += noise() * Math.exp(-t * 18) * 0.06;
    return s;
  })
);

// Clean take — short vault confirm
writeWav(
  'clean',
  render(0.28, (t) => {
    const e1 = env(t, 0.01, 0.05, 0.1, 0.16);
    const e2 = t > 0.07 ? env(t - 0.07, 0.01, 0.05, 0.12, 0.2) : 0;
    return sin(415, t) * e1 * 0.4 + sin(622, t) * e2 * 0.35 + noise() * Math.exp(-t * 30) * 0.05;
  })
);

// Spotted — short tension sting
writeWav(
  'spotted',
  render(0.35, (t) => {
    const e = env(t, 0.005, 0.06, 0.26, 0.35);
    const drop = saw(220 * Math.exp(-t * 3), t) * 0.45;
    const grit = noise() * Math.exp(-t * 9) * 0.4;
    const warn = sin(160, t) * Math.exp(-t * 5) * 0.35;
    return (drop + grit + warn) * e;
  })
);

// Building alarm pulse
writeWav(
  'alarm',
  render(0.55, (t) => {
    const pulse = (Math.sin(2 * Math.PI * 6 * t) > 0 ? 1 : 0.15);
    const siren = sin(620 + sin(8, t) * 80, t) * 0.4 * pulse;
    const low = square(155, t) * 0.12 * pulse;
    const e = env(t, 0.01, 0.35, 0.18, 0.55);
    return (siren + low) * e;
  })
);

// Shadow veil engage — air + deep pad
writeWav(
  'veil',
  render(0.7, (t) => {
    const e = env(t, 0.04, 0.25, 0.35, 0.7);
    const pad = sin(98, t) * 0.35 + sin(147, t) * 0.2 + sin(196, t) * 0.12;
    const swirl = noise() * (0.15 + 0.1 * sin(2.5, t)) * Math.exp(-t * 2);
    const lift = sin(320 + t * 180, t) * env(t, 0.05, 0.15, 0.35, 0.55) * 0.2;
    return (pad * Math.exp(-t * 1.4) + swirl + lift) * e;
  })
);

writeWav(
  'win',
  render(1.0, (t) => {
    // Minor → resolve: heist success, cool not triumphant brass
    const notes = [311.13, 369.99, 466.16, 622.25, 932.33];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.1;
      if (t >= st) s += sin(f, t - st) * env(t - st, 0.02, 0.1, 0.28, 0.42) * 0.26;
    });
    s += noise() * Math.exp(-t * 8) * 0.05;
    return s;
  })
);

writeWav(
  'lose',
  render(0.9, (t) => {
    const notes = [349.23, 277.18, 220, 164.81];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.15;
      if (t >= st) {
        s += saw(f, t - st) * env(t - st, 0.02, 0.1, 0.3, 0.45) * 0.22;
        s += sin(f * 0.5, t - st) * env(t - st, 0.03, 0.08, 0.28, 0.4) * 0.15;
      }
    });
    return s;
  })
);

writeWav(
  'tick',
  render(0.055, (t) => {
    const e = env(t, 0.001, 0.008, 0.04, 0.055);
    // soft watch tick
    return (sin(980, t) * 0.35 + noise() * Math.exp(-t * 70) * 0.4) * e;
  })
);

writeWav(
  'tickUrgent',
  render(0.07, (t) => {
    const e = env(t, 0.001, 0.01, 0.05, 0.07);
    return (sin(1400, t) * 0.4 + sin(1900, t) * 0.2 + square(700, t) * 0.08) * e;
  })
);

writeWav(
  'start',
  render(0.55, (t) => {
    // Quiet infiltrate cue
    const notes = [155.56, 233.08, 311.13, 466.16];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.08;
      if (t >= st) s += sin(f, t - st) * env(t - st, 0.02, 0.08, 0.2, 0.32) * 0.24;
    });
    s += noise() * Math.exp(-t * 10) * 0.08;
    return s;
  })
);

// Night rooftop ambient loop (~5s)
writeWav(
  'ambient',
  render(5.0, (t) => {
    const wind = ((noise() + noise()) * 0.5) * 0.07 * (0.55 + 0.45 * sin(0.18, t));
    const drone = sin(42, t) * 0.1 + sin(63, t) * 0.06 + sin(84, t) * 0.035;
    const neon = sin(220 + sin(0.22, t) * 30, t) * 0.025 * (0.4 + 0.6 * sin(0.09, t));
    const distant = sin(110, t) * 0.02 * Math.max(0, Math.sin(t * 0.7));
    // rare soft drip / vent
    const drip = Math.sin(t * 5.7) > 0.998 ? noise() * 0.28 * Math.exp(-((t * 17) % 1) * 35) : 0;
    const edge = Math.min(1, t * 1.5, (5 - t) * 1.5);
    return (wind + drone + neon + distant + drip) * edge * 0.9;
  })
);

console.log('Shadow Thief SFX →', OUT);
