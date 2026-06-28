"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specs = {
  "bgm_dungeon_loop.wav": [23.5, 24.5],
  "dig.wav": [0.32, 0.42],
  "button.wav": [0.09, 0.16],
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
  for (let i = 44; i < 44 + dataSize; i += 2) {
    const v = Math.abs(buffer.readInt16LE(i));
    peak = Math.max(peak, v);
    sum += v;
  }
  return { duration: dataSize / 2 / 22050, peak, average: sum / (dataSize / 2), bytes: buffer.length };
}

describe("音声素材", () => {
  it("自製WAV素材が読み込める形式と尺を持つ", () => {
    for (const [name, [min, max]] of Object.entries(specs)) {
      const stats = readWav(name);
      expect(stats.duration, name).toBeGreaterThanOrEqual(min);
      expect(stats.duration, name).toBeLessThanOrEqual(max);
      expect(stats.peak, name).toBeGreaterThan(1200);
      expect(stats.average, name).toBeGreaterThan(80);
      expect(stats.bytes, name).toBeLessThan(1200000);
    }
  });
});
