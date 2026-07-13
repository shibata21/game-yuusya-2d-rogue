"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import {
  PIXEL_ACTIONS,
  PIXEL_ACTORS,
  PIXEL_ACTOR_RENDER_DIRS,
  PIXEL_ACTOR_SHEETS,
  PIXEL_ACTOR_FRAMES_PER_ACTOR,
  PIXEL_ACTOR_ATLAS_COLUMNS,
  PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR,
  PIXEL_CELL,
  PIXEL_DIRS,
  PIXEL_EFFECTS,
  PIXEL_FRAMES,
  PIXEL_TILES,
  PIXEL_ITEMS,
  PIXEL_DEBUFFS,
  PIXEL_DIALOGUE_PORTRAITS,
  PIXEL_ASSET_VERSION,
  pixelAssetUrl,
  pixelActorFileName,
  pixelActorFrameInfo,
  pixelItemFrameIndex,
  pixelDebuffFrameIndex,
  pixelDialoguePortraitFrameIndex,
} from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pixelDir = path.join(repoDir, "assets", "pixel");
const sourceDir = path.join(pixelDir, "source", "imagegen-v1");
const meta = JSON.parse(fs.readFileSync(path.join(pixelDir, "sprites.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, "manifest.json"), "utf8"));
const pngCache = new Map();

function png(relativePath) {
  const file = path.join(repoDir, relativePath);
  if (!pngCache.has(file)) pngCache.set(file, PNG.sync.read(fs.readFileSync(file)));
  return pngCache.get(file);
}

function crop(img, x, y, width = PIXEL_CELL, height = PIXEL_CELL) {
  const out = new PNG({ width, height });
  PNG.bitblt(img, out, x, y, width, height, 0, 0);
  return out;
}

function opaqueCount(img) {
  let count = 0;
  for (let i = 3; i < img.data.length; i += 4) {
    if (img.data[i] > 12) count++;
  }
  return count;
}

function imageHash(img) {
  let hash = 2166136261;
  for (const value of img.data) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function diffStats(a, b) {
  let union = 0;
  let alphaDiff = 0;
  let colorDiff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const aa = a.data[i + 3];
    const ba = b.data[i + 3];
    if (aa > 12 || ba > 12) union++;
    if (aa !== ba) alphaDiff++;
    const rgb =
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (rgb > 36 || Math.abs(aa - ba) > 12) colorDiff++;
  }
  return { alphaDiff, colorRatio: union ? colorDiff / union : 0 };
}

function actorLocation(name) {
  for (const [sheet, names] of Object.entries(PIXEL_ACTOR_SHEETS)) {
    const row = names.indexOf(name);
    if (row >= 0) return { sheet, row };
  }
  throw new Error(`アクター ${name} が見つかりません`);
}

function actorCrop(name, action, direction, frame) {
  const { sheet, row } = actorLocation(name);
  const atlas = png(`assets/pixel/${pixelActorFileName(sheet)}`);
  const actionIndex = PIXEL_ACTIONS.indexOf(action);
  const directionIndex = PIXEL_ACTOR_RENDER_DIRS.indexOf(direction);
  const frameInActor =
    (actionIndex * PIXEL_ACTOR_RENDER_DIRS.length + directionIndex) * PIXEL_FRAMES + frame;
  const atlasFrame = row * PIXEL_ACTOR_FRAMES_PER_ACTOR + frameInActor;
  const x = (atlasFrame % PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL;
  const y = Math.floor(atlasFrame / PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL;
  return crop(atlas, x, y);
}

function atlasCell(file, index, row = 0) {
  return crop(png(`assets/pixel/${file}`), index * PIXEL_CELL, row * PIXEL_CELL);
}

function sourcePath(relativePath) {
  return path.join(sourceDir, ...relativePath.split("/"));
}

describe("imagegenピクセル素材", () => {
  it("公開仕様とメタデータの順序が一致する", () => {
    expect(PIXEL_CELL).toBe(48);
    expect(PIXEL_FRAMES).toBe(4);
    expect(PIXEL_DIRS).toEqual(["e", "se", "s", "sw", "w", "nw", "n", "ne"]);
    expect(PIXEL_ACTOR_RENDER_DIRS).toEqual(["e", "se", "s", "ne", "n"]);
    expect(PIXEL_ACTIONS).toEqual(["idle", "attack", "cast", "dig", "heal", "eat", "dodge"]);
    expect(meta.cell).toBe(PIXEL_CELL);
    expect(meta.frames).toBe(PIXEL_FRAMES);
    expect(meta.directions).toEqual(PIXEL_DIRS);
    expect(meta.renderDirections).toEqual(PIXEL_ACTOR_RENDER_DIRS);
    expect(meta.actions).toEqual(PIXEL_ACTIONS);
    expect(meta.actorFramesPerActor).toBe(PIXEL_ACTOR_FRAMES_PER_ACTOR);
    expect(meta.actorAtlasColumns).toBe(PIXEL_ACTOR_ATLAS_COLUMNS);
    expect(meta.actorAtlasRowsPerActor).toBe(PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR);
    expect(meta.actorSheets).toEqual(PIXEL_ACTOR_SHEETS);
    expect(Object.keys(meta.actors)).toEqual(PIXEL_ACTORS);
    expect(Object.keys(meta.tiles)).toEqual(PIXEL_TILES);
    expect(Object.keys(meta.effects)).toEqual(PIXEL_EFFECTS);
    expect(Object.keys(meta.items)).toEqual(PIXEL_ITEMS);
    expect(Object.keys(meta.debuffs)).toEqual(PIXEL_DEBUFFS);
    expect(Object.keys(meta.dialogue)).toEqual(PIXEL_DIALOGUE_PORTRAITS);
    expect(meta.sourceVersion).toBe("imagegen-v1");
    expect(meta.generator.toLowerCase()).toContain("imagegen");
  });

  it("公開アセットURLとフレーム参照が新しい版を使う", () => {
    expect(PIXEL_ASSET_VERSION).toBe("v27-imagegen");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=v27-imagegen");
    expect(pixelAssetUrl("items.png")).toBe("assets/pixel/items.png?v=v27-imagegen");
    expect(pixelAssetUrl("debuffs.png")).toBe("assets/pixel/debuffs.png?v=v27-imagegen");
    expect(pixelAssetUrl("dialogue_portraits.png")).toBe("assets/pixel/dialogue_portraits.png?v=v27-imagegen");
    expect(pixelAssetUrl(pixelActorFileName("venom_spider"))).toBe(
      "assets/pixel/actor_venom_spider.png?v=v27-imagegen",
    );

    const east = pixelActorFrameInfo("slime", "idle", "e", 0);
    const west = pixelActorFrameInfo("slime", "idle", "w", 0);
    expect(west.sheet).toBe(east.sheet);
    expect(west.frame).toBe(east.frame);
    expect(west.flipX).toBe(true);
    expect(east.flipX).toBe(false);
    expect(pixelItemFrameIndex(PIXEL_ITEMS[7])).toBe(7);
    expect(pixelDebuffFrameIndex("sharpenedBlade")).toBe(3);
    expect(pixelDialoguePortraitFrameIndex("gorilla")).toBe(1);
  });

  it("全アトラスが既存の48px契約を満たす", () => {
    for (const [sheet, names] of Object.entries(PIXEL_ACTOR_SHEETS)) {
      const atlas = png(`assets/pixel/actor_${sheet}.png`);
      expect(atlas.width).toBe(PIXEL_CELL * PIXEL_ACTOR_ATLAS_COLUMNS);
      expect(atlas.height).toBe(PIXEL_CELL * names.length * PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR);
      expect(Math.max(atlas.width, atlas.height), sheet).toBeLessThanOrEqual(4096);
    }
    expect(png("assets/pixel/tiles.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_TILES.length,
      height: PIXEL_CELL,
    });
    expect(png("assets/pixel/effects.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_FRAMES,
      height: PIXEL_CELL * PIXEL_EFFECTS.length,
    });
    expect(png("assets/pixel/items.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_ITEMS.length,
      height: PIXEL_CELL,
    });
    expect(png("assets/pixel/debuffs.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_DEBUFFS.length,
      height: PIXEL_CELL,
    });
    expect(png("assets/pixel/dialogue_portraits.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_DIALOGUE_PORTRAITS.length,
      height: PIXEL_CELL,
    });
  });

  it("全アクターセルが非空で4フレームが動く", () => {
    for (const name of PIXEL_ACTORS) {
      for (const action of PIXEL_ACTIONS) {
        for (const direction of PIXEL_ACTOR_RENDER_DIRS) {
          const frames = Array.from(
            { length: PIXEL_FRAMES },
            (_, frame) => actorCrop(name, action, direction, frame),
          );
          expect(Math.min(...frames.map(opaqueCount)), `${name}:${action}:${direction}`).toBeGreaterThan(20);
          expect(new Set(frames.map(imageHash)).size, `${name}:${action}:${direction}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("各imagegenアクターに方向差分とアクション差分がある", () => {
    for (const name of Object.keys(manifest.actorSources)) {
      const directions = new Set(
        PIXEL_ACTOR_RENDER_DIRS.map((direction) => imageHash(actorCrop(name, "idle", direction, 1))),
      );
      const actions = new Set(
        PIXEL_ACTIONS.map((action) => imageHash(actorCrop(name, action, "s", 1))),
      );
      expect(directions.size, name).toBeGreaterThanOrEqual(4);
      expect(actions.size, name).toBeGreaterThanOrEqual(6);
    }
    const heroes = PIXEL_ACTOR_SHEETS.heroes.map((name) => imageHash(actorCrop(name, "idle", "s", 1)));
    expect(new Set(heroes).size).toBe(heroes.length);
  });

  it("第一・第二進化は通常種と同じ形状の色違いである", () => {
    for (const [variant, spec] of Object.entries(manifest.paletteVariants)) {
      for (const action of ["idle", "attack", "cast"]) {
        for (const direction of PIXEL_ACTOR_RENDER_DIRS) {
          const stats = diffStats(
            actorCrop(spec.base, action, direction, 2),
            actorCrop(variant, action, direction, 2),
          );
          expect(stats.alphaDiff, `${spec.base}/${variant}:${action}:${direction}`).toBe(0);
          expect(stats.colorRatio, `${spec.base}/${variant}:${action}:${direction}`).toBeGreaterThan(0.18);
        }
      }
    }
  });

  it("タイル・エフェクト・アイテム・デバフ・会話立ち絵が揃っている", () => {
    const tileHashes = PIXEL_TILES.map((_, index) => {
      const tile = atlasCell("tiles.png", index);
      expect(opaqueCount(tile)).toBeGreaterThan(PIXEL_CELL * PIXEL_CELL * 0.95);
      return imageHash(tile);
    });
    expect(new Set(tileHashes).size).toBe(PIXEL_TILES.length);

    for (let row = 0; row < PIXEL_EFFECTS.length; row++) {
      for (let frame = 0; frame < PIXEL_FRAMES; frame++) {
        expect(opaqueCount(atlasCell("effects.png", frame, row))).toBeGreaterThan(8);
      }
    }

    const itemHashes = PIXEL_ITEMS.map((_, index) => {
      const item = atlasCell("items.png", index);
      expect(opaqueCount(item)).toBeGreaterThan(60);
      return imageHash(item);
    });
    expect(new Set(itemHashes).size).toBe(PIXEL_ITEMS.length);

    PIXEL_DEBUFFS.forEach((_, index) => {
      expect(opaqueCount(atlasCell("debuffs.png", index))).toBeGreaterThan(60);
    });
    const executive = atlasCell("dialogue_portraits.png", 0);
    const gorilla = atlasCell("dialogue_portraits.png", 1);
    expect(opaqueCount(executive)).toBeGreaterThan(180);
    expect(opaqueCount(gorilla)).toBeGreaterThan(180);
    expect(diffStats(executive, gorilla).colorRatio).toBeGreaterThan(0.3);
  });

  it("imagegen原画・プロンプト・代替禁止方針を記録している", () => {
    expect(manifest.version).toBe("imagegen-v1");
    expect(manifest.generator.tool.toLowerCase()).toContain("imagegen");
    expect(manifest.generator.policy).toContain("代替せず");
    expect(manifest.generator.policy).toContain("報告");
    expect(Object.keys(manifest.prompts)).toEqual([
      "style",
      "actors",
      "eggs",
      "tiles",
      "effects",
      "items",
      "debuffs",
      "dialogue",
    ]);

    const sourceFiles = [
      manifest.generator.styleReference,
      ...Object.values(manifest.actorSources),
      manifest.layouts.eggs.file,
      manifest.layouts.environmentTiles.file,
      manifest.layouts.veinTiles.file,
      manifest.layouts.effects.file,
      manifest.layouts.debuffs.file,
      manifest.layouts.dialogue.file,
      ...manifest.itemSheets.map((sheet) => sheet.file),
    ];
    sourceFiles.forEach((file) => expect(fs.existsSync(sourcePath(file)), file).toBe(true));

    const buildSource = fs.readFileSync(path.join(repoDir, "tools", "build_pixel_assets.js"), "utf8");
    expect(buildSource).toContain("manifest.json");
    expect(buildSource).toContain("readPng");
    expect(buildSource).not.toMatch(/function\s+(rect|line|tri|diamond|oval|ring)\b/);
    expect(buildSource).not.toMatch(/function\s+draw[A-Z]/);
    expect(fs.existsSync(path.join(pixelDir, "source", "legacy-v6-self-made"))).toBe(true);

    const agents = fs.readFileSync(path.join(repoDir, "AGENTS.md"), "utf8");
    const policy = fs.readFileSync(path.join(repoDir, "ASSET_CANDIDATES.md"), "utf8");
    for (const document of [agents, policy]) {
      expect(document).toContain("imagegen");
      expect(document).toContain("勝手に");
      expect(document).toContain("報告");
    }
  });
});
