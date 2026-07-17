"use strict";

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join("assets", "audio");
const RATE = 22050;
const TAU = Math.PI * 2;

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

function midiFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function triangle(phase) {
  return (2 / Math.PI) * Math.asin(Math.sin(phase));
}

function saw(phase) {
  return 2 * ((phase / TAU) - Math.floor(phase / TAU + 0.5));
}

function adsr(t, duration, attack, decay, sustain, release) {
  if (t < 0 || t >= duration) return 0;
  const attackGain = attack > 0 ? Math.min(1, t / attack) : 1;
  const decayGain = decay > 0 && t > attack
    ? sustain + (1 - sustain) * Math.max(0, 1 - (t - attack) / decay)
    : 1;
  const releaseStart = Math.max(0, duration - release);
  const releaseGain = release > 0 && t > releaseStart ? Math.max(0, (duration - t) / release) : 1;
  return attackGain * decayGain * releaseGain;
}

const VOICE_ENVELOPES = {
  drone: [0.7, 0.5, 0.92, 1.1],
  pad: [0.26, 0.42, 0.78, 0.58],
  choir: [0.18, 0.28, 0.84, 0.48],
  bass: [0.012, 0.11, 0.72, 0.12],
  pluck: [0.004, 0.13, 0.42, 0.12],
  string: [0.018, 0.08, 0.74, 0.12],
  horn: [0.035, 0.13, 0.8, 0.2],
  bell: [0.003, 0.16, 0.28, 0.34],
};

function voiceSample(voice, t, frequency) {
  const phase = TAU * frequency * t;
  if (voice === "drone") {
    return Math.sin(phase) * 0.66 + triangle(phase * 0.5) * 0.2 + Math.sin(phase * 2.01) * 0.08;
  }
  if (voice === "pad") {
    const sway = Math.sin(TAU * 0.17 * t) * 0.035;
    return Math.sin(phase * 0.997 + sway) * 0.38 + Math.sin(phase * 1.003 - sway) * 0.38 + triangle(phase * 0.5) * 0.18;
  }
  if (voice === "choir") {
    const vibrato = Math.sin(TAU * 4.6 * t) * 0.018;
    return Math.sin(phase + vibrato) * 0.5 + Math.sin(phase * 2.01) * 0.24 + Math.sin(phase * 3.02) * 0.12;
  }
  if (voice === "bass") {
    return triangle(phase) * 0.56 + Math.sin(phase) * 0.3 + square(phase * 0.5) * 0.08;
  }
  if (voice === "pluck") {
    const falloff = Math.exp(-t * 3.8);
    return (triangle(phase) * 0.5 + Math.sin(phase * 2) * 0.25 + Math.sin(phase * 3.01) * 0.11) * (0.45 + falloff * 0.55);
  }
  if (voice === "string") {
    return triangle(phase) * 0.5 + saw(phase) * 0.16 + Math.sin(phase * 2.01) * 0.13;
  }
  if (voice === "horn") {
    const vibrato = Math.sin(TAU * 5.1 * t) * 0.045;
    return triangle(phase + vibrato) * 0.48 + square(phase + vibrato) * 0.16 + Math.sin(phase * 0.5) * 0.16;
  }
  if (voice === "bell") {
    return Math.sin(phase) * 0.5 + Math.sin(phase * 2.01) * Math.exp(-t * 1.7) * 0.24 + Math.sin(phase * 3.91) * Math.exp(-t * 2.8) * 0.16;
  }
  return Math.sin(phase);
}

function addNote(samples, options) {
  const {
    start,
    duration,
    note,
    volume = 0.1,
    voice = "pluck",
    attack,
    decay,
    sustain,
    release,
  } = options;
  const envelope = VOICE_ENVELOPES[voice] || [0.01, 0.1, 0.75, 0.12];
  const a = attack ?? envelope[0];
  const d = decay ?? envelope[1];
  const s = sustain ?? envelope[2];
  const r = release ?? envelope[3];
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  const frequency = midiFreq(note);
  for (let i = first; i < last; i++) {
    const local = i / RATE - start;
    samples[i] += voiceSample(voice, local, frequency) * adsr(local, duration, a, d, s, r) * volume;
  }
}

function addChord(samples, start, duration, root, intervals, volume, voice = "pad") {
  const voiceGain = volume / Math.sqrt(intervals.length);
  for (const interval of intervals) addNote(samples, { start, duration, note: root + interval, volume: voiceGain, voice });
}

function eventNoise(seed, index) {
  let x = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) / 4294967295) * 2 - 1;
}

function addKick(samples, start, volume = 0.22) {
  const duration = 0.38;
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  for (let i = first; i < last; i++) {
    const t = i / RATE - start;
    const phase = TAU * (43 * t + (65 / 15) * (1 - Math.exp(-15 * t)));
    const body = Math.sin(phase) * Math.exp(-t * 8.5);
    const click = eventNoise(0x4b49434b, i - first) * Math.exp(-t * 85) * 0.24;
    samples[i] += (body + click) * volume;
  }
}

function addLowDrum(samples, start, note = 38, volume = 0.16) {
  const duration = 0.52;
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  const frequency = midiFreq(note);
  for (let i = first; i < last; i++) {
    const t = i / RATE - start;
    const tone = Math.sin(TAU * frequency * t + Math.exp(-t * 18) * 1.2) * Math.exp(-t * 5.6);
    const skin = eventNoise(0x544f4d00 + note, i - first) * Math.exp(-t * 19) * 0.2;
    samples[i] += (tone + skin) * volume;
  }
}

function addSnare(samples, start, volume = 0.12) {
  const duration = 0.24;
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  for (let i = first; i < last; i++) {
    const t = i / RATE - start;
    const grit = eventNoise(0x534e4152, i - first) * Math.exp(-t * 16);
    const body = Math.sin(TAU * 174 * t) * Math.exp(-t * 13) * 0.45;
    samples[i] += (grit * 0.68 + body) * volume;
  }
}

function addHat(samples, start, volume = 0.04, open = false) {
  const duration = open ? 0.2 : 0.075;
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  let previous = 0;
  for (let i = first; i < last; i++) {
    const t = i / RATE - start;
    const current = eventNoise(0x48415400 + Math.floor(start * 100), i - first);
    const bright = current - previous * 0.78;
    previous = current;
    samples[i] += bright * Math.exp(-t * (open ? 18 : 48)) * volume;
  }
}

function addMetal(samples, start, note = 79, volume = 0.07) {
  const duration = 0.62;
  const first = Math.max(0, Math.floor(start * RATE));
  const last = Math.min(samples.length, Math.ceil((start + duration) * RATE));
  const frequency = midiFreq(note);
  for (let i = first; i < last; i++) {
    const t = i / RATE - start;
    const ring = Math.sin(TAU * frequency * t) * 0.5 + Math.sin(TAU * frequency * 1.417 * t) * 0.3 + Math.sin(TAU * frequency * 2.13 * t) * 0.18;
    samples[i] += ring * Math.exp(-t * 4.2) * volume;
  }
}

function addCaveNoise(samples, seed, volume) {
  let low = 0;
  let air = 0;
  for (let i = 0; i < samples.length; i++) {
    const raw = eventNoise(seed, i);
    low += (raw - low) * 0.004;
    air += (raw - air) * 0.18;
    samples[i] += (low * 0.8 + (raw - air) * 0.08) * volume;
  }
}

function addCaveSpace(samples, wet = 0.14) {
  const dry = samples.slice();
  const taps = [[0.09, 0.42], [0.18, 0.28], [0.31, 0.18]];
  for (const [seconds, gain] of taps) {
    const delay = Math.floor(seconds * RATE);
    let filtered = 0;
    for (let i = delay; i < samples.length; i++) {
      filtered += (dry[i - delay] - filtered) * 0.24;
      samples[i] += filtered * gain * wet;
    }
  }
}

function finishBgm(samples, duration, wet = 0.14) {
  addCaveSpace(samples, wet);
  let previousIn = 0;
  let previousOut = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const filtered = samples[i] - previousIn + previousOut * 0.996;
    previousIn = samples[i];
    previousOut = filtered;
    const t = i / RATE;
    const fadeIn = Math.min(1, t / 0.09);
    const fadeOut = Math.min(1, Math.max(0, (duration - t) / 0.18));
    samples[i] = filtered * fadeIn * fadeOut;
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  const gain = peak > 0 ? 0.82 / peak : 1;
  const drive = 1.3;
  const scale = Math.tanh(drive);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.tanh(samples[i] * gain * drive) / scale;
  return samples;
}

function buildVeinPulseBgm() {
  const bpm = 112;
  const beat = 60 / bpm;
  const barLength = beat * 4;
  const duration = barLength * 12;
  const samples = new Float32Array(Math.floor(duration * RATE));
  const chords = [
    [52, [0, 3, 7, 14]], [53, [0, 4, 7, 11]], [52, [0, 3, 7, 10]], [50, [0, 3, 7, 10]],
    [48, [0, 4, 7, 11]], [53, [0, 4, 7, 11]], [52, [0, 3, 7, 14]], [47, [0, 3, 6, 9]],
    [45, [0, 3, 7, 10]], [48, [0, 4, 7, 11]], [53, [0, 4, 7, 11]], [47, [0, 4, 7, 10, 13]],
  ];
  const arpeggio = [0, 7, 12, 3, 10, 14, 7, 3];
  const melody = [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, 7, null, 5, null],
    [0, null, 3, 5, null, 3, 1, null],
    [0, null, -2, null, 0, 3, null, null],
    [3, null, 5, 7, null, 5, 3, null],
    [1, 3, null, 7, 8, null, 7, null],
    [0, null, 3, 7, 10, null, 7, 5],
    [3, null, 0, null, -1, null, -5, null],
    [0, 3, 5, null, 7, 8, 10, null],
    [7, null, 5, 3, 0, null, 3, null],
    [1, 5, 8, null, 7, 5, 3, 1],
    [-5, null, -1, 2, 5, null, 1, -1],
  ];

  addNote(samples, { start: 0, duration, note: 28, volume: 0.105, voice: "drone", release: 1.4 });
  addNote(samples, { start: 0, duration, note: 35, volume: 0.055, voice: "drone", release: 1.4 });
  addCaveNoise(samples, 0x5645494e, 0.022);

  chords.forEach(([root, intervals], bar) => {
    const start = bar * barLength;
    const section = bar < 2 ? 0.68 : bar < 8 ? 0.9 : 1;
    addChord(samples, start, barLength + 0.12, root, intervals, 0.115 * section, "pad");
    for (let step = 0; step < 8; step++) {
      const interval = arpeggio[(step + bar * 3) % arpeggio.length];
      addNote(samples, {
        start: start + step * beat / 2,
        duration: beat * 0.72,
        note: root + interval + 12,
        volume: 0.034 * section,
        voice: "pluck",
      });
      if (bar >= 3) addHat(samples, start + step * beat / 2, 0.018 + (step % 2 ? 0 : 0.008), step === 7);
    }
    for (let b = 0; b < 4; b++) {
      const bassNote = b === 2 ? root - 24 : 28;
      addNote(samples, { start: start + b * beat, duration: beat * 0.82, note: bassNote, volume: 0.105 * section, voice: "bass" });
    }
    addKick(samples, start, 0.2 * section);
    addLowDrum(samples, start + beat * 2, 35, 0.16 * section);
    if (bar >= 6) addLowDrum(samples, start + beat * 3.5, 38, 0.08);
    melody[bar].forEach((offset, step) => {
      if (offset === null) return;
      addNote(samples, {
        start: start + step * beat / 2,
        duration: beat * (step % 2 ? 0.86 : 1.25),
        note: 64 + offset,
        volume: 0.058 * section,
        voice: bar < 5 ? "bell" : "horn",
      });
    });
    if ([0, 4, 8, 11].includes(bar)) addMetal(samples, start, 76 + (bar % 3) * 2, 0.055);
  });
  return finishBgm(samples, duration, 0.18);
}

function buildMonsterMarchBgm() {
  const bpm = 128;
  const beat = 60 / bpm;
  const barLength = beat * 4;
  const duration = barLength * 12;
  const samples = new Float32Array(Math.floor(duration * RATE));
  const chords = [
    [52, [0, 3, 7, 11]], [48, [0, 4, 7, 11]], [45, [0, 3, 7, 10]], [47, [0, 4, 7, 10]],
    [52, [0, 3, 7, 14]], [50, [0, 3, 7, 10]], [48, [0, 4, 7, 11]], [47, [0, 4, 7, 10, 13]],
    [45, [0, 3, 7, 10]], [43, [0, 4, 9, 12]], [42, [0, 3, 6, 9]], [47, [0, 4, 7, 10, 13]],
  ];
  const ostinato = [0, 7, 12, 7, 3, 7, 15, 7, 0, 7, 12, 7, 10, 7, 15, 7];
  const melody = [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [0, null, 3, null, 7, null, 8, 7],
    [5, null, 4, null, 2, null, -1, null],
    [0, 3, 7, null, 8, 7, 3, null],
    [5, null, 7, 10, 8, null, 7, 5],
    [3, 5, 7, null, 12, null, 10, 7],
    [5, null, 4, 2, -1, null, 2, 4],
    [0, null, 3, 7, 12, 10, 8, 7],
    [7, 8, 10, null, 12, 10, 8, null],
    [6, null, 9, 12, 15, 12, 9, 6],
    [7, null, 11, 14, 17, 14, 13, 11],
  ];

  addNote(samples, { start: 0, duration, note: 28, volume: 0.052, voice: "drone", release: 1 });
  addCaveNoise(samples, 0x4d415243, 0.012);

  chords.forEach(([root, intervals], bar) => {
    const start = bar * barLength;
    const section = bar < 2 ? 0.66 : bar < 8 ? 0.9 : 1.06;
    addChord(samples, start, barLength + 0.08, root, intervals, 0.075 * section, "pad");
    for (let step = 0; step < 16; step++) {
      addNote(samples, {
        start: start + step * beat / 4,
        duration: beat * 0.31,
        note: root + ostinato[(step + bar * 5) % ostinato.length] + 12,
        volume: 0.031 * section,
        voice: "string",
      });
    }
    for (let b = 0; b < 4; b++) {
      addNote(samples, {
        start: start + b * beat,
        duration: beat * 0.75,
        note: root - 24 + (b === 3 ? 7 : 0),
        volume: 0.105 * section,
        voice: "bass",
      });
      addHat(samples, start + b * beat, 0.024 * section);
      addHat(samples, start + (b + 0.5) * beat, 0.016 * section);
    }
    addKick(samples, start, 0.2 * section);
    addKick(samples, start + beat * 2, 0.17 * section);
    addSnare(samples, start + beat, 0.105 * section);
    addSnare(samples, start + beat * 3, 0.12 * section);
    if (bar >= 6) addLowDrum(samples, start + beat * 3.5, 40, 0.08);
    melody[bar].forEach((offset, step) => {
      if (offset === null) return;
      addNote(samples, {
        start: start + step * beat / 2,
        duration: beat * (step % 3 === 0 ? 1.18 : 0.68),
        note: 64 + offset,
        volume: 0.065 * section,
        voice: "horn",
      });
      if (bar >= 8 && step % 2 === 0) {
        addNote(samples, {
          start: start + (step + 0.5) * beat / 2,
          duration: beat * 0.5,
          note: 76 + offset - 5,
          volume: 0.024,
          voice: "bell",
        });
      }
    });
    if ([3, 7, 11].includes(bar)) addMetal(samples, start + beat * 3, 83, 0.065);
  });
  return finishBgm(samples, duration, 0.13);
}

function buildDeepRitualBgm() {
  const bpm = 150;
  const beat = 60 / bpm;
  const barLength = beat * 4;
  const duration = barLength * 16;
  const samples = new Float32Array(Math.floor(duration * RATE));
  const chords = [
    [52, [0, 7, 12]], [53, [-1, 4, 7, 11]], [55, [-3, 3, 7, 10]], [52, [0, 7, 12]],
    [48, [4, 7, 11, 14]], [53, [-1, 4, 7, 11]], [50, [2, 5, 9, 12]], [47, [5, 10, 13, 16]],
    [45, [7, 10, 14, 17]], [53, [-1, 4, 7, 11]], [55, [-3, 3, 7, 10]], [52, [0, 7, 12, 15]],
    [48, [4, 7, 11, 14]], [53, [-1, 4, 7, 11]], [47, [5, 10, 12, 17]], [47, [4, 7, 10, 13]],
  ];
  const ritualPattern = [0, 7, 12, 1, 7, 13, 3, 10];
  const chant = [
    null, null, null, null,
    [0, null, 1, 3, null, 1, 0, null],
    [3, null, 5, 7, null, 5, 3, 1],
    [0, 3, null, 7, 10, null, 8, 7],
    [5, null, 4, null, 1, null, -1, null],
    [0, null, 3, 5, 7, 8, 10, null],
    [8, null, 7, 5, 3, null, 1, 0],
    [3, 5, 7, 10, 12, null, 10, 7],
    [5, null, 3, 1, 0, null, -2, null],
    [0, 3, 7, null, 8, 10, 12, 10],
    [8, 7, 5, 3, 1, null, 0, null],
    [7, null, 10, 12, 14, 12, 10, 7],
    [5, 4, 2, -1, 1, 4, 7, 11],
  ];

  addNote(samples, { start: 0, duration, note: 28, volume: 0.09, voice: "drone", release: 1.2 });
  addNote(samples, { start: 0, duration, note: 35, volume: 0.042, voice: "drone", release: 1.2 });
  addCaveNoise(samples, 0x52495445, 0.016);

  chords.forEach(([root, intervals], bar) => {
    const start = bar * barLength;
    const section = bar < 4 ? 0.68 : bar < 12 ? 0.9 : 1.08;
    addChord(samples, start, barLength + 0.1, root, intervals, 0.098 * section, "choir");
    for (let step = 0; step < 8; step++) {
      const accent = step === 0 || step === 3 || step === 6;
      addNote(samples, {
        start: start + step * beat / 2,
        duration: beat * (accent ? 0.72 : 0.45),
        note: 52 + ritualPattern[(step + bar) % ritualPattern.length],
        volume: (accent ? 0.065 : 0.038) * section,
        voice: "string",
      });
      if (accent) addLowDrum(samples, start + step * beat / 2, 35 + (step === 3 ? 3 : 0), 0.12 * section);
      else if (bar >= 4) addHat(samples, start + step * beat / 2, 0.014 * section);
    }
    addKick(samples, start, 0.185 * section);
    addKick(samples, start + beat * 1.5, 0.115 * section);
    addSnare(samples, start + beat * 3, 0.07 * section);
    addNote(samples, { start, duration: beat * 0.92, note: root - 24, volume: 0.105 * section, voice: "bass" });
    addNote(samples, { start: start + beat * 2, duration: beat * 0.92, note: 28, volume: 0.09 * section, voice: "bass" });
    if (bar % 2 === 0) addMetal(samples, start, 81 + (bar % 4), 0.06 * section);
    const phrase = chant[bar];
    if (phrase) phrase.forEach((offset, step) => {
      if (offset === null) return;
      addNote(samples, {
        start: start + step * beat / 2,
        duration: beat * (step % 3 === 0 ? 1.3 : 0.72),
        note: 64 + offset,
        volume: 0.054 * section,
        voice: bar < 10 ? "bell" : "horn",
      });
    });
  });
  return finishBgm(samples, duration, 0.19);
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

function buildCoreHit() {
  const n = noise(0xc0ce0717);
  return render(0.42, (t) => {
    const impact = pulseAt(t, 0, 0.22);
    const after = pulseAt(t, 0.055, 0.34);
    const thud = Math.sin(Math.PI * 2 * (78 - t * 35) * t) * impact * 0.42;
    const crack = square(Math.PI * 2 * 92 * t + Math.sin(t * 38) * 1.6) * after * 0.16;
    const magic = Math.sin(Math.PI * 2 * (410 + Math.sin(t * 26) * 70) * t) * after * 0.15;
    const dust = n() * after * 0.13;
    return thud + crack + magic + dust;
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
  writeWav("bgm_vein_pulse.wav", buildVeinPulseBgm());
  writeWav("bgm_monster_march.wav", buildMonsterMarchBgm());
  writeWav("bgm_deep_ritual.wav", buildDeepRitualBgm());
  writeWav("dig.wav", buildDig());
  writeWav("button.wav", buildButton());
  writeWav("core_hit.wav", buildCoreHit());
  writeWav("hero_death_1.wav", buildHeroDeath(0xdead01, 310, 250));
  writeWav("hero_death_2.wav", buildHeroDeath(0xdead02, 260, 190));
  writeWav("hero_death_3.wav", buildHeroDeath(0xdead03, 360, 320));
}

main();
