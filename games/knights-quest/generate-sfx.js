/**
 * Generate game SFX as 16-bit mono WAV files (no deps).
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
    const s = (clamp(samples[i]) * 32767) | 0;
    buf.writeInt16LE(s, 44 + i * 2);
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
  const x = (t * f) % 1;
  return 2 * x - 1;
}
function square(f, t) {
  return sin(f, t) > 0 ? 1 : -1;
}

function render(sec, fn) {
  const n = Math.floor(SR * sec);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i, n);
  // soft peak normalize
  let peak = 0.001;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = 0.9 / peak;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

// sword slash: noise whoosh + metallic ping
writeWav(
  'slash',
  render(0.28, (t) => {
    const e = env(t, 0.005, 0.04, 0.22, 0.28);
    const whoosh = noise() * Math.exp(-t * 18) * 0.7;
    const metal = (saw(1800 + t * 2200, t) * 0.25 + sin(3200, t) * 0.15) * Math.exp(-t * 22);
    return (whoosh + metal) * e;
  })
);

writeWav(
  'hit',
  render(0.22, (t) => {
    const e = env(t, 0.002, 0.02, 0.18, 0.22);
    const thud = sin(90 * Math.exp(-t * 8), t) * Math.exp(-t * 14) * 0.9;
    const crack = noise() * Math.exp(-t * 40) * 0.55;
    const clang = sin(640 - t * 400, t) * Math.exp(-t * 20) * 0.35;
    return (thud + crack + clang) * e;
  })
);

writeWav(
  'heavy',
  render(0.35, (t) => {
    const e = env(t, 0.004, 0.05, 0.28, 0.35);
    const boom = sin(55 * Math.exp(-t * 3), t) * Math.exp(-t * 6) * 1.1;
    const grit = noise() * Math.exp(-t * 10) * 0.45;
    const armor = saw(120, t) * Math.exp(-t * 12) * 0.25;
    return (boom + grit + armor) * e;
  })
);

writeWav(
  'fireball',
  render(0.45, (t) => {
    const e = env(t, 0.02, 0.12, 0.28, 0.45);
    const burn = noise() * (0.4 + 0.3 * sin(40, t));
    const roar = saw(70 + t * 40, t) * 0.35;
    const hiss = noise() * Math.exp(-Math.abs(t - 0.15) * 8) * 0.5;
    return (burn * Math.exp(-t * 3) + roar * Math.exp(-t * 4) + hiss) * e * 0.7;
  })
);

writeWav(
  'explode',
  render(0.55, (t) => {
    const e = env(t, 0.001, 0.05, 0.45, 0.55);
    const low = sin(48 * Math.exp(-t * 2.5), t) * Math.exp(-t * 4);
    const mid = noise() * Math.exp(-t * 7);
    const debris = (noise() * 0.5 + square(180, t) * 0.1) * Math.exp(-t * 5) * (t > 0.05 ? 1 : 0);
    return (low * 0.9 + mid * 0.7 + debris * 0.4) * e;
  })
);

writeWav(
  'ok',
  render(0.22, (t) => {
    const f1 = 523.25;
    const f2 = 783.99;
    const e1 = env(t, 0.01, 0.05, 0.08, 0.14);
    const e2 = t > 0.06 ? env(t - 0.06, 0.01, 0.06, 0.1, 0.18) : 0;
    return sin(f1, t) * e1 * 0.45 + sin(f2, t) * e2 * 0.4;
  })
);

writeWav(
  'perfect',
  render(0.45, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.055;
      if (t >= st) s += sin(f, t - st) * env(t - st, 0.01, 0.05, 0.12, 0.2) * 0.32;
    });
    s += noise() * Math.exp(-t * 25) * 0.08;
    return s;
  })
);

writeWav(
  'bad',
  render(0.32, (t) => {
    const e = env(t, 0.005, 0.08, 0.22, 0.32);
    return (saw(160 * Math.exp(-t * 2), t) * 0.5 + noise() * 0.25 * Math.exp(-t * 8) + sin(70, t) * 0.3) * e;
  })
);

writeWav(
  'fever',
  render(0.7, (t) => {
    const notes = [392, 523.25, 659.25, 783.99, 987.77];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.07;
      if (t >= st) s += square(f, t - st) * env(t - st, 0.01, 0.06, 0.14, 0.25) * 0.22;
    });
    s += noise() * Math.exp(-t * 6) * 0.12;
    return s;
  })
);

writeWav(
  'boss',
  render(0.85, (t) => {
    const e = env(t, 0.02, 0.2, 0.55, 0.85);
    const drone = sin(55, t) * 0.5 + sin(82.5, t) * 0.25;
    const growl = saw(40 + sin(3, t) * 5, t) * 0.35;
    const hit = t < 0.15 ? noise() * Math.exp(-t * 20) * 0.8 : 0;
    const sting = t > 0.2 ? sin(110, t) * env(t - 0.2, 0.01, 0.1, 0.3, 0.5) * 0.35 : 0;
    return (drone * Math.exp(-t * 1.2) + growl * Math.exp(-t * 1.5) + hit + sting) * e;
  })
);

writeWav(
  'win',
  render(0.9, (t) => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.09;
      if (t >= st) s += sin(f, t - st) * env(t - st, 0.015, 0.08, 0.2, 0.35) * 0.28;
    });
    return s;
  })
);

writeWav(
  'lose',
  render(0.85, (t) => {
    const notes = [392, 311.13, 246.94, 196];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.14;
      if (t >= st) s += saw(f, t - st) * env(t - st, 0.02, 0.1, 0.25, 0.4) * 0.28;
    });
    return s;
  })
);

writeWav(
  'tick',
  render(0.06, (t) => {
    const e = env(t, 0.001, 0.01, 0.04, 0.06);
    return (sin(1200, t) * 0.5 + square(900, t) * 0.2) * e;
  })
);

writeWav(
  'tickUrgent',
  render(0.07, (t) => {
    const e = env(t, 0.001, 0.01, 0.05, 0.07);
    return (sin(1600, t) * 0.55 + sin(2100, t) * 0.25) * e;
  })
);

writeWav(
  'hoof',
  render(0.12, (t) => {
    const e = env(t, 0.002, 0.02, 0.09, 0.12);
    return (sin(70 * Math.exp(-t * 10), t) * 0.7 + noise() * Math.exp(-t * 30) * 0.45) * e;
  })
);

writeWav(
  'click',
  render(0.05, (t) => {
    const e = env(t, 0.001, 0.008, 0.035, 0.05);
    return (square(880, t) * 0.4 + sin(1320, t) * 0.25) * e;
  })
);

writeWav(
  'start',
  render(0.45, (t) => {
    const notes = [196, 293.66, 392];
    let s = 0;
    notes.forEach((f, i) => {
      const st = i * 0.09;
      if (t >= st) s += square(f, t - st) * env(t - st, 0.01, 0.06, 0.15, 0.28) * 0.25;
    });
    return s;
  })
);

// spooky ambient loop (~4s seamless-ish)
writeWav(
  'ambient',
  render(4.0, (t) => {
    const wind = (noise() + noise()) * 0.08 * (0.6 + 0.4 * sin(0.25, t));
    const drone = sin(49, t) * 0.12 + sin(73.5, t) * 0.07 + sin(98, t) * 0.04;
    const howl = sin(180 + sin(0.15, t) * 40, t) * 0.04 * (0.5 + 0.5 * sin(0.1, t));
    const drip = Math.sin(t * 7.3) > 0.997 ? noise() * 0.35 * Math.exp(-(t % 0.2) * 40) : 0;
    // fade edges for loop friendliness
    const edge = Math.min(1, t * 2, (4 - t) * 2);
    return (wind + drone + howl + drip) * edge * 0.85;
  })
);

console.log('SFX written to', OUT);
