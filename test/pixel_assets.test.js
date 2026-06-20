"use strict";

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import { fileURLToPath } from "node:url";
import {
  PIXEL_ACTIONS,
  PIXEL_ACTORS,
  PIXEL_CELL,
  PIXEL_DIRS,
  PIXEL_EFFECTS,
  PIXEL_FRAMES,
  PIXEL_TILES,
  PIXEL_ASSET_VERSION,
  pixelAssetUrl,
} from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(fs.readFileSync(path.join(repoDir, "assets/pixel/sprites.json"), "utf8"));
const pngCache = new Map();

function png(file) {
  if (!pngCache.has(file)) pngCache.set(file, PNG.sync.read(fs.readFileSync(path.join(repoDir, file))));
  return pngCache.get(file);
}

function crop(img, x0, y0, w, h) {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(img, out, x0, y0, w, h, 0, 0);
  return out;
}

function alphaBounds(img) {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 0) {
      count++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY, count };
}

function actorCrop(name, action, dir, frame) {
  const img = png("assets/pixel/actors.png");
  const row = Object.keys(meta.actors).indexOf(name);
  const ai = meta.actions.indexOf(action);
  const di = meta.directions.indexOf(dir);
  return crop(img, ((ai * meta.directions.length + di) * meta.frames + frame) * meta.cell, row * meta.cell, meta.cell, meta.cell);
}

function tileCrop(name) {
  const img = png("assets/pixel/tiles.png");
  const col = Object.keys(meta.tiles).indexOf(name);
  return crop(img, col * meta.cell, 0, meta.cell, meta.cell);
}

function diffRatio(a, b) {
  let union = 0;
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] > 0 || b.data[i + 3] > 0) union++;
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) + Math.abs(a.data[i + 3] - b.data[i + 3]);
    if (d > 32) diff++;
  }
  return union ? diff / union : 0;
}

function tileMotifStats(tile, earth) {
  let motif = 0;
  let outside = 0;
  for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
    const i = (y * tile.width + x) * 4;
    const d = Math.abs(tile.data[i] - earth.data[i]) + Math.abs(tile.data[i + 1] - earth.data[i + 1]) + Math.abs(tile.data[i + 2] - earth.data[i + 2]) + Math.abs(tile.data[i + 3] - earth.data[i + 3]);
    if (d > 48) {
      motif++;
      if (x < 10 || x > 38 || y < 8 || y > 40) outside++;
    }
  }
  return { motif, outside };
}

function paletteStats(base, elite) {
  let union = 0;
  let alphaDiff = 0;
  let colorDiff = 0;
  let redDominant = 0;
  let opaque = 0;
  for (let i = 0; i < base.data.length; i += 4) {
    const ba = base.data[i + 3];
    const ea = elite.data[i + 3];
    if (ba > 0 || ea > 0) union++;
    if (ba !== ea) alphaDiff++;
    if (Math.abs(base.data[i] - elite.data[i]) + Math.abs(base.data[i + 1] - elite.data[i + 1]) + Math.abs(base.data[i + 2] - elite.data[i + 2]) > 32) colorDiff++;
    if (ea > 0) {
      opaque++;
      if (elite.data[i] > elite.data[i + 1] && elite.data[i] > elite.data[i + 2]) redDominant++;
    }
  }
  return { alphaDiff, colorRatio: union ? colorDiff / union : 0, redRatio: opaque ? redDominant / opaque : 0 };
}

describe("ピクセル素材", () => {
  it("素材定義と公開定数の順序が一致する", () => {
    expect(meta.cell).toBe(PIXEL_CELL);
    expect(meta.frames).toBe(PIXEL_FRAMES);
    expect(meta.directions).toEqual(PIXEL_DIRS);
    expect(meta.actions).toEqual(PIXEL_ACTIONS);
    expect(Object.keys(meta.actors)).toEqual(PIXEL_ACTORS);
    expect(Object.keys(meta.tiles)).toEqual(PIXEL_TILES);
    expect(Object.keys(meta.effects)).toEqual(PIXEL_EFFECTS);
  });

  it("アトラスPNGの寸法が正しい", () => {
    const actors = png("assets/pixel/actors.png");
    const tiles = png("assets/pixel/tiles.png");
    const effects = png("assets/pixel/effects.png");
    expect(actors.width).toBe(PIXEL_CELL * PIXEL_FRAMES * PIXEL_DIRS.length * PIXEL_ACTIONS.length);
    expect(actors.height).toBe(PIXEL_CELL * PIXEL_ACTORS.length);
    expect(tiles.width).toBe(PIXEL_CELL * PIXEL_TILES.length);
    expect(tiles.height).toBe(PIXEL_CELL);
    expect(effects.width).toBe(PIXEL_CELL * PIXEL_FRAMES);
    expect(effects.height).toBe(PIXEL_CELL * PIXEL_EFFECTS.length);
  });

  it("素材URLにはバージョン文字列が付く", () => {
    expect(PIXEL_ASSET_VERSION).toBe("v9-self-made-makai-veins");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=v9-self-made-makai-veins");
  });

  it("進化モンスターは通常種と同じ形の色違いになる", () => {
    for (const [base, elite] of [["slime", "superslime"], ["carniv", "evolved"], ["spitter", "tarantula"], ["golem", "titan"], ["flame", "infernal"]]) {
      const stats = paletteStats(actorCrop(base, "idle", "s", 1), actorCrop(elite, "idle", "s", 1));
      expect(stats.alphaDiff, `${base}/${elite}`).toBe(0);
      expect(stats.colorRatio, `${base}/${elite}`).toBeGreaterThan(0.08);
    }
  });

  it("スーパースライムは赤優勢になる", () => {
    const stats = paletteStats(actorCrop("slime", "idle", "s", 1), actorCrop("superslime", "idle", "s", 1));
    expect(stats.alphaDiff).toBe(0);
    expect(stats.redRatio).toBeGreaterThan(0.65);
  });

  it("方向と職業アクションの差分がある", () => {
    for (const name of ["slime", "carniv", "spitter", "golem", "flame", "infernal"]) {
      expect(diffRatio(actorCrop(name, "idle", "s", 1), actorCrop(name, "idle", "n", 1)), name).toBeGreaterThan(0.13);
    }
    expect(diffRatio(actorCrop("warrior", "idle", "e", 1), actorCrop("warrior", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("mage", "idle", "e", 1), actorCrop("mage", "cast", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("priest", "idle", "e", 1), actorCrop("priest", "heal", "e", 2))).toBeGreaterThan(0.18);
  });

  it("卵は種別色のよくある卵シルエットになる", () => {
    const eggs = PIXEL_ACTORS.filter((name) => name.startsWith("egg_"));
    for (const name of eggs) {
      const b = alphaBounds(actorCrop(name, "idle", "s", 1));
      const w = b.maxX - b.minX + 1;
      const h = b.maxY - b.minY + 1;
      expect(b.count, name).toBeGreaterThan(220);
      expect(w, name).toBeGreaterThanOrEqual(17);
      expect(w, name).toBeLessThanOrEqual(29);
      expect(h, name).toBeGreaterThanOrEqual(24);
      expect(h, name).toBeLessThanOrEqual(38);
      expect(h, name).toBeGreaterThan(w + 5);
    }
    for (let i = 1; i < eggs.length; i++) {
      expect(diffRatio(actorCrop(eggs[i - 1], "idle", "s", 1), actorCrop(eggs[i], "idle", "s", 1)), `${eggs[i - 1]}/${eggs[i]}`).toBeGreaterThan(0.08);
    }
  });

  it("鉱脈タイルは種別マークを持ち、進化後は枠が光る", () => {
    const earth = tileCrop("earth");
    for (const name of ["moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo"]) {
      const stats = tileMotifStats(tileCrop(name), earth);
      const evo = name.endsWith("_evo");
      expect(stats.motif, name).toBeGreaterThan(evo ? 420 : 95);
      expect(stats.motif, name).toBeLessThan(evo ? 1160 : 620);
      expect(stats.outside, name).toBeLessThanOrEqual(evo ? 360 : 145);
    }
  });

  it("素材生成は外部素材に依存しない", () => {
    expect(fs.existsSync(path.join(repoDir, "assets/pixel/third_party_assets.json"))).toBe(false);
    expect(fs.existsSync(path.join(repoDir, "assets/pixel/THIRD_PARTY_ASSETS.md"))).toBe(false);
    expect(fs.existsSync(path.join(repoDir, "assets/external"))).toBe(false);
    const build = fs.readFileSync(path.join(repoDir, "tools/build_pixel_assets.js"), "utf8");
    for (const term of ["readExternal", "actorSources", "tileSources", "third_party", "THIRD_PARTY", "assets/external", "dcss", "DCSS"]) {
      expect(build).not.toContain(term);
    }
    expect(diffRatio(tileCrop("earth"), tileCrop("tunnel"))).toBeGreaterThan(0.22);
    expect(diffRatio(tileCrop("earth"), tileCrop("bedrock"))).toBeGreaterThan(0.22);
  });
});
