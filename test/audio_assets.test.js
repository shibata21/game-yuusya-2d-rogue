"use strict";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specs = {
  "bgm_vein_pulse.wav": [25.6, 25.8],
  "bgm_monster_march.wav": [22.4, 22.6],
  "bgm_deep_ritual.wav": [25.5, 25.7],
  "dig.wav": [0.32, 0.42],
  "button.wav": [0.09, 0.16],
  "core_hit.wav": [0.36, 0.48],
  "hero_death_1.wav": [0.65, 0.80],
  "hero_death_2.wav": [0.65, 0.80],
  "hero_death_3.wav": [0.65, 0.80],
};

function readWav(name) {
  const buffer = fs.readFileSync(path.join(repoDir, "assets/audio", name));
  expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
  expect(buffer.toString("ascii", 8, 12)).toBe("WAVE");
  expect(buffer.readUInt16LE(20)).toBe(1);
  expect(buffer.readUInt16LE(22)).toBe(1);
  expect(buffer.readUInt32LE(24)).toBe(22050);
  expect(buffer.readUInt16LE(34)).toBe(16);
  const dataSize = buffer.readUInt32LE(40);
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
  const samples = dataSize / 2;
  return {
    duration: samples / 22050,
    peak,
    average: sum / samples,
    dc: signedSum / samples,
    bytes: buffer.length,
    hash: crypto.createHash("sha256").update(buffer).digest("hex"),
  };
}

describe("音声素材", () => {
  it("自製WAV素材が読み込める形式と尺を持つ", () => {
    for (const [name, [min, max]] of Object.entries(specs)) {
      const stats = readWav(name);
      expect(stats.duration, name).toBeGreaterThanOrEqual(min);
      expect(stats.duration, name).toBeLessThanOrEqual(max);
      expect(stats.peak, name).toBeGreaterThan(1200);
      expect(stats.average, name).toBeGreaterThan(80);
      if (name.startsWith("bgm_")) {
        expect(stats.peak, name).toBeLessThanOrEqual(32100);
        expect(Math.abs(stats.dc), name).toBeLessThanOrEqual(100);
      }
      expect(stats.bytes, name).toBeLessThan(1200000);
    }
  });

  it("3曲のBGMはすべて別内容で、余分な旧BGMを残さない", () => {
    const expected = Object.keys(specs).filter((name) => name.startsWith("bgm_")).sort();
    const actual = fs.readdirSync(path.join(repoDir, "assets/audio")).filter((name) => /^bgm_.*\.wav$/.test(name)).sort();
    expect(actual).toEqual(expected);
    expect(new Set(actual.map((name) => readWav(name).hash)).size).toBe(3);
  });
});
