"use strict";

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join("assets", "audio");
const RATE = 22050;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clamp(v, min = -1, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function env(t, duration, attack = 0.01, release = 0.08) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function noteFreq(semitone, base = 55) {
  return base * Math.pow(2, semitone / 12);
}

function noise(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) / 4294967295) * 2 - 1;
  };
}

function square(phase) {
  return Math.sin(phase) >= 0 ? 1 : -1;
}

function pulseAt(t, start, length) {
  if (t < start || t > start + length) return 0;
  return 1 - (t - start) / length;
}

function writeWav(name, samples) {
  ensureDir(OUT_DIR);
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT_DIR, name), buffer);
}

function render(duration, fn) {
  const len = Math.floor(duration * RATE);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = fn(i / RATE, i);
  return out;
}

function buildBgm() {
  const duration = 24;
  const chordRoots = [0, -5, -2, -7, 3, -2, -8, -5, 0, -10, -7, -2];
  const melody = [
    0, null, 3, 5, 7, null, 10, 8, 7, 5, null, 3, 2, null, 0, -2, null, 3, 5, null, 7, 8, 7, null,
    5, 7, null, 10, 12, null, 10, 8, 7, null, 5, 3, null, 2, 3, 5, 7, null, 5, 2, 0, null, -2, null,
    0, 2, 3, null, 7, 8, 10, null, 12, 10, 8, 7, null, 5, 3, null, 2, 0, -2, null, -5, null, -2, 0,
    3, null, 5, 7, 10, null, 8, 7, 5, null, 3, 2, 0, null, -2, -5, null, -2, 0, 2, 3, null, 0, null,
  ];
  const counter = [
    null, 12, null, 10, 8, null, 7, null, 5, null, 3, null,
    7, null, 8, null, 10, null, 12, 10, null, 8, null, 7,
    null, 5, null, 7, 8, null, 10, null, 8, null, 7, 5,
    3, null, 2, null, 0, null, -2, null, 0, 3, null, 5,
  ];
  const chordTones = [0, 3, 7, 10, 12, 10, 7, 3];
  const hiss = noise(0x4d414b49);
  return render(duration, (t) => {
    const bar = Math.floor(t / 2) % chordRoots.length;
    const root = chordRoots[bar];
    const quarter = Math.floor(t * 4) % melody.length;
    const eighth = Math.floor(t * 2) % counter.length;
    const arpStep = Math.floor(t * 8) % chordTones.length;
    const qT = (t * 4) % 1;
    const eT = (t * 2) % 1;
    const beatT = (t * 2) % 1;
    const bassFreq = noteFreq(root - 12, 41.2);
    const bassGate = 0.82 + Math.sin(t * Math.PI * 2 / 2) * 0.18;
    const bass = Math.sin(Math.PI * 2 * bassFreq * t) * 0.16 * bassGate;
    const bassEdge = square(Math.PI * 2 * bassFreq * 2 * t) * 0.035 * bassGate;
    const m = melody[quarter];
    const melodyGate = env(qT, 1, 0.015, 0.22);
    const melodyTone = m === null ? 0 : (
      square(Math.PI * 2 * noteFreq(root + m + 24, 41.2) * t) * 0.075 +
      Math.sin(Math.PI * 2 * noteFreq(root + m + 36, 41.2) * t) * 0.025
    ) * melodyGate;
    const c = counter[eighth];
    const counterGate = env(eT, 1, 0.025, 0.28);
    const counterTone = c === null ? 0 : Math.sin(Math.PI * 2 * noteFreq(root + c + 19, 41.2) * t) * 0.045 * counterGate;
    const arpGate = env((t * 8) % 1, 1, 0.01, 0.16);
    const arp = square(Math.PI * 2 * noteFreq(root + chordTones[arpStep] + 31, 41.2) * t) * 0.032 * arpGate;
    const kick = Math.sin(Math.PI * 2 * (58 - beatT * 22) * t) * pulseAt(beatT, 0, 0.09) * 0.13;
    const metal = Math.sin(Math.PI * 2 * 1260 * t) * pulseAt((t * 4) % 1, 0, 0.035) * 0.035;
    const hat = hiss() * pulseAt((t * 8) % 1, 0, 0.045) * 0.038;
    const air = hiss() * 0.007;
    return (bass + bassEdge + melodyTone + counterTone + arp + kick + metal + hat + air) * env(t, duration, 0.02, 0.03);
  });
}

function buildDig() {
  const n = noise(0x444947);
  return render(0.36, (t) => {
    const first = pulseAt(t, 0, 0.18);
    const second = pulseAt(t, 0.105, 0.18);
    const strike = Math.sin(Math.PI * 2 * (1180 + t * 140) * t) * first * 0.34;
    const ring = Math.sin(Math.PI * 2 * 2380 * t) * first * 0.16;
    const chip = Math.sin(Math.PI * 2 * 1780 * t) * second * 0.20;
    const low = Math.sin(Math.PI * 2 * (165 - t * 90) * t) * pulseAt(t, 0.015, 0.24) * 0.22;
    const grit = n() * Math.max(0, 1 - t / 0.30) * 0.20;
    const sparkle = n() * second * 0.09;
    return strike + ring + chip + low + grit + sparkle;
  });
}

function buildButton() {
  return render(0.12, (t) => {
    const a = Math.sin(Math.PI * 2 * 520 * t) * env(t, 0.12, 0.002, 0.06) * 0.26;
    const b = Math.sin(Math.PI * 2 * 780 * t) * env(t, 0.12, 0.002, 0.08) * 0.12;
    return a + b;
  });
}

function buildHeroDeath(seed, baseFreq, bend) {
  const n = noise(seed);
  return render(0.72, (t) => {
    const f = Math.max(55, baseFreq - bend * t);
    const voice = Math.sin(Math.PI * 2 * f * t + Math.sin(t * 72) * 0.8) * 0.34;
    const buzz = square(Math.PI * 2 * f * 0.5 * t) * 0.11;
    const breath = n() * 0.10;
    return (voice + buzz + breath) * env(t, 0.72, 0.012, 0.34);
  });
}

function main() {
  writeWav("bgm_dungeon_loop.wav", buildBgm());
  writeWav("dig.wav", buildDig());
  writeWav("button.wav", buildButton());
  writeWav("hero_death_1.wav", buildHeroDeath(0xdead01, 310, 250));
  writeWav("hero_death_2.wav", buildHeroDeath(0xdead02, 260, 190));
  writeWav("hero_death_3.wav", buildHeroDeath(0xdead03, 360, 320));
}

main();
