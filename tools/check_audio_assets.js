"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUDIO_DIR = path.join("assets", "audio");
const SPECS = {
  "bgm_vein_pulse.wav": { min: 25.6, max: 25.8 },
  "bgm_monster_march.wav": { min: 22.4, max: 22.6 },
  "bgm_deep_ritual.wav": { min: 25.5, max: 25.7 },
  "dig.wav": { min: 0.32, max: 0.42 },
  "button.wav": { min: 0.09, max: 0.16 },
  "core_hit.wav": { min: 0.36, max: 0.48 },
  "hero_death_1.wav": { min: 0.65, max: 0.80 },
  "hero_death_2.wav": { min: 0.65, max: 0.80 },
  "hero_death_3.wav": { min: 0.65, max: 0.80 },
};

function fail(message) {
  console.error("NG:", message);
  process.exitCode = 1;
}

function ok(message) {
  console.log("OK:", message);
}

function readWav(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("ascii", 0, 4) !== "RIFF") throw new Error("RIFFではありません");
  if (buffer.toString("ascii", 8, 12) !== "WAVE") throw new Error("WAVEではありません");
  if (buffer.toString("ascii", 12, 16) !== "fmt ") throw new Error("fmt chunkがありません");
  if (buffer.readUInt16LE(20) !== 1) throw new Error("PCMではありません");
  const channels = buffer.readUInt16LE(22);
  const rate = buffer.readUInt32LE(24);
  const bits = buffer.readUInt16LE(34);
  if (channels !== 1 || rate !== 22050 || bits !== 16) throw new Error(`形式が不正です: ${channels}ch ${rate}Hz ${bits}bit`);
  if (buffer.toString("ascii", 36, 40) !== "data") throw new Error("data chunkがありません");
  const dataSize = buffer.readUInt32LE(40);
  const samples = dataSize / 2;
  let peak = 0;
  let sum = 0;
  let signedSum = 0;
  for (let i = 44; i < 44 + dataSize; i += 2) {
    const signed = buffer.readInt16LE(i);
    const absolute = Math.abs(signed);
    peak = Math.max(peak, absolute);
    sum += absolute;
    signedSum += signed;
  }
  return { duration: samples / rate, peak, average: sum / samples, dc: signedSum / samples, bytes: buffer.length, hash: crypto.createHash("sha256").update(buffer).digest("hex") };
}

const bgmHashes = new Set();
for (const [name, spec] of Object.entries(SPECS)) {
  const file = path.join(AUDIO_DIR, name);
  try {
    if (!fs.existsSync(file)) throw new Error("ファイルがありません");
    const stats = readWav(file);
    if (stats.duration < spec.min || stats.duration > spec.max) throw new Error(`尺が不正です: ${stats.duration.toFixed(2)}秒`);
    if (stats.peak < 1200 || stats.average < 80) throw new Error(`音量が小さすぎます: peak=${stats.peak} avg=${stats.average.toFixed(1)}`);
    if (name.startsWith("bgm_") && stats.peak > 32100) throw new Error(`BGMがクリップしています: peak=${stats.peak}`);
    if (name.startsWith("bgm_") && Math.abs(stats.dc) > 100) throw new Error(`BGMの直流成分が大きすぎます: dc=${stats.dc.toFixed(1)}`);
    if (stats.bytes > 1200000) throw new Error(`ファイルサイズが大きすぎます: ${stats.bytes}`);
    if (name.startsWith("bgm_")) bgmHashes.add(stats.hash);
  } catch (error) {
    fail(`${name}: ${error.message}`);
  }
}

const expectedBgm = Object.keys(SPECS).filter((name) => name.startsWith("bgm_")).sort();
const actualBgm = fs.readdirSync(AUDIO_DIR).filter((name) => /^bgm_.*\.wav$/.test(name)).sort();
if (JSON.stringify(actualBgm) !== JSON.stringify(expectedBgm)) fail(`BGMファイル構成が不正です: ${actualBgm.join(", ")}`);
if (bgmHashes.size !== expectedBgm.length) fail("BGMに同一内容のファイルがあります");

if (!process.exitCode) ok("自製WAV素材を検査しました");
