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
  const duration = 16;
  const seq = [0, -5, -2, -7, 3, -2, -5, -10];
  const low = [0, 0, -7, -5];
  const hiss = noise(0x4d414b49);
  return render(duration, (t) => {
    const beat = Math.floor(t * 2) % seq.length;
    const stepT = (t * 2) % 1;
    const gate = env(stepT, 1, 0.02, 0.18);
    const arpFreq = noteFreq(seq[beat] + 12, 41.2);
    const bassFreq = noteFreq(low[Math.floor(t / 4) % low.length], 41.2);
    const pulse = square(Math.PI * 2 * arpFreq * t) * 0.08 * gate;
    const bass = Math.sin(Math.PI * 2 * bassFreq * t) * 0.20;
    const fifth = Math.sin(Math.PI * 2 * bassFreq * 1.5 * t) * 0.08;
    const tick = stepT < 0.035 ? Math.sin(Math.PI * 2 * 720 * t) * (1 - stepT / 0.035) * 0.08 : 0;
    const air = hiss() * 0.012;
    return (bass + fifth + pulse + tick + air) * env(t, duration, 0.18, 0.18);
  });
}

function buildDig() {
  const n = noise(0x444947);
  return render(0.22, (t) => {
    const hit = Math.sin(Math.PI * 2 * (130 - t * 180) * t) * env(t, 0.22, 0.002, 0.13) * 0.34;
    const grit = n() * Math.max(0, 1 - t / 0.18) * 0.32;
    return hit + grit;
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
