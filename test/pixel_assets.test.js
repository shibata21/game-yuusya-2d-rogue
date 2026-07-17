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
  PIXEL_SOIL_ALGAE_STAGES,
  PIXEL_VEIN_EVO2_AURA_FRAMES,
  PIXEL_DEBUFFS,
  PIXEL_DIALOGUE_PORTRAITS,
  PIXEL_ASSET_VERSION,
  pixelAssetUrl,
  pixelActorFileName,
  pixelActorFrameInfo,
  pixelActorSheetName,
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

function hasOpaqueMagenta(img) {
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 12 && img.data[i] > 240 && img.data[i + 1] < 16 && img.data[i + 2] > 240) return true;
  }
  return false;
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

function gridCell(img, column, row, columns, rows) {
  const x0 = Math.round((column * img.width) / columns);
  const x1 = Math.round(((column + 1) * img.width) / columns);
  const y0 = Math.round((row * img.height) / rows);
  const y1 = Math.round(((row + 1) * img.height) / rows);
  return crop(img, x0, y0, x1 - x0, y1 - y0);
}

function alphaBounds(img, threshold = 12) {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("imagegen生成画像のセルが空です");
  return { minX, minY, maxX, maxY };
}

function opaqueEdgeCount(img) {
  let count = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (x > 0 && y > 0 && x < img.width - 1 && y < img.height - 1) continue;
      if (img.data[(y * img.width + x) * 4 + 3] > 12) count++;
    }
  }
  return count;
}

function opaqueOuterBandCount(img, padding) {
  let count = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (x >= padding && y >= padding && x < img.width - padding && y < img.height - padding) continue;
      if (img.data[(y * img.width + x) * 4 + 3] > 12) count++;
    }
  }
  return count;
}

function opaqueComponentCount(img) {
  const seen = new Uint8Array(img.width * img.height);
  let components = 0;
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || img.data[start * 4 + 3] <= 12) continue;
    components++;
    const queue = [start];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const pixel = queue[head];
      const x = pixel % img.width;
      const y = Math.floor(pixel / img.width);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
          const neighbor = ny * img.width + nx;
          if (seen[neighbor] || img.data[neighbor * 4 + 3] <= 12) continue;
          seen[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }
  }
  return components;
}

function alphaJaccardDiff(a, b) {
  let intersection = 0;
  let union = 0;
  for (let i = 3; i < a.data.length; i += 4) {
    const aa = a.data[i] > 12;
    const ba = b.data[i] > 12;
    if (aa && ba) intersection++;
    if (aa || ba) union++;
  }
  return union ? 1 - intersection / union : 0;
}

function luminance(img, x, y) {
  const i = (y * img.width + x) * 4;
  return img.data[i] * 0.2126 + img.data[i + 1] * 0.7152 + img.data[i + 2] * 0.0722;
}

function tileEdgeRatio(tile, side) {
  let edge = 0;
  let inner = 0;
  for (let n = 0; n < PIXEL_CELL; n++) {
    if (side === "left") {
      edge += luminance(tile, 0, n);
      inner += luminance(tile, 2, n);
    } else if (side === "right") {
      edge += luminance(tile, PIXEL_CELL - 1, n);
      inner += luminance(tile, PIXEL_CELL - 3, n);
    } else if (side === "top") {
      edge += luminance(tile, n, 0);
      inner += luminance(tile, n, 2);
    } else {
      edge += luminance(tile, n, PIXEL_CELL - 1);
      inner += luminance(tile, n, PIXEL_CELL - 3);
    }
  }
  return edge / Math.max(1, inner);
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
    expect(Object.keys(meta.soilAlgae).map(Number)).toEqual(PIXEL_SOIL_ALGAE_STAGES);
    expect(Object.keys(meta.veinEvo2Aura).map(Number)).toEqual(
      Array.from({ length: PIXEL_VEIN_EVO2_AURA_FRAMES }, (_, frame) => frame),
    );
    expect(Object.keys(meta.debuffs)).toEqual(PIXEL_DEBUFFS);
    expect(Object.keys(meta.dialogue)).toEqual(PIXEL_DIALOGUE_PORTRAITS);
    for (const name of PIXEL_ACTORS) {
      const sheet = pixelActorSheetName(name);
      const actorIndex = PIXEL_ACTOR_SHEETS[sheet].indexOf(name);
      const row = meta.actors[name];
      expect(row, name).toEqual({
        sheet: `actor_${sheet}`,
        x: 0,
        y: actorIndex * PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR * PIXEL_CELL,
        w: PIXEL_CELL,
        h: PIXEL_CELL,
        frames: PIXEL_FRAMES,
        directions: PIXEL_ACTOR_RENDER_DIRS.length,
        actions: PIXEL_ACTIONS.length,
        anchor: [24, 36],
      });
      const frame = pixelActorFrameInfo(name, "idle", "s", 0);
      expect([frame.anchorX, frame.anchorY], `${name}:frame-anchor`).toEqual(row.anchor);
      expect([frame.originX, frame.originY], `${name}:frame-origin`).toEqual([0.5, 0.75]);
    }
    const directActors = PIXEL_ACTORS.filter((name) => !name.startsWith("egg_"));
    expect(Object.keys(meta.actorNormalization)).toEqual(directActors);
    for (const name of directActors) {
      expect(meta.actorNormalization[name]).toMatchObject({
        targetCenterX: PIXEL_CELL / 2,
        targetFootY: 45,
      });
      expect(meta.actorNormalization[name].scale, name).toBeGreaterThan(0);
      expect(meta.actorNormalization[name].minEffectScale, name).toBeGreaterThan(0);
      expect(meta.actorNormalization[name].minEffectScale, name).toBeLessThanOrEqual(1);
      expect(meta.actorNormalization[name].assignedComponents, name).toBe(
        meta.actorNormalization[name].sourceComponents,
      );
    }
    expect(meta.sourceVersion).toBe("imagegen-v1");
    expect(meta.generator.toLowerCase()).toContain("imagegen");
    expect(manifest.layouts.environmentTiles.trimRatio).toBe(0.03);
    expect(manifest.layouts.veinTiles.trimRatio).toBe(0.05);
  });

  it("公開アセットURLとフレーム参照が新しい版を使う", () => {
    expect(PIXEL_ASSET_VERSION).toBe("v34-soil-resources");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=v34-soil-resources");
    expect(pixelAssetUrl("items.png")).toBe("assets/pixel/items.png?v=v34-soil-resources");
    expect(pixelAssetUrl("soil_algae.png")).toBe("assets/pixel/soil_algae.png?v=v34-soil-resources");
    expect(pixelAssetUrl("vein_evo2_aura.png")).toBe("assets/pixel/vein_evo2_aura.png?v=v34-soil-resources");
    expect(pixelAssetUrl("debuffs.png")).toBe("assets/pixel/debuffs.png?v=v34-soil-resources");
    expect(pixelAssetUrl("dialogue_portraits.png")).toBe("assets/pixel/dialogue_portraits.png?v=v34-soil-resources");
    expect(pixelAssetUrl(pixelActorFileName("venom_spider"))).toBe(
      "assets/pixel/actor_venom_spider.png?v=v34-soil-resources",
    );

    const east = pixelActorFrameInfo("slime", "idle", "e", 0);
    const west = pixelActorFrameInfo("slime", "idle", "w", 0);
    expect(west.sheet).toBe(east.sheet);
    expect(west.frame).toBe(east.frame);
    expect(west.flipX).toBe(true);
    expect(east.flipX).toBe(false);
    expect(PIXEL_ITEMS).toEqual(["sand", "water", "fungus", "mineral", "air"]);
    expect(pixelItemFrameIndex("air")).toBe(4);
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
    expect(png("assets/pixel/soil_algae.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_SOIL_ALGAE_STAGES.length,
      height: PIXEL_CELL,
    });
    expect(png("assets/pixel/vein_evo2_aura.png")).toMatchObject({
      width: PIXEL_CELL * PIXEL_VEIN_EVO2_AURA_FRAMES,
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
          expect(Math.max(...frames.map(opaqueEdgeCount)), `${name}:${action}:${direction}`).toBe(0);
          expect(new Set(frames.map(imageHash)).size, `${name}:${action}:${direction}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("全アクターの待機本体が共通中心・足元・占有サイズを保つ", () => {
    for (const name of PIXEL_ACTORS.filter((actor) => !actor.startsWith("egg_"))) {
      const bounds = PIXEL_ACTOR_RENDER_DIRS.map((direction) => alphaBounds(actorCrop(name, "idle", direction, 0)));
      const sizes = bounds.map((row) => Math.max(row.maxX - row.minX + 1, row.maxY - row.minY + 1));
      const centers = bounds.map((row) => (row.minX + row.maxX) / 2);
      const feet = bounds.map((row) => row.maxY);
      expect(Math.min(...sizes), name).toBeGreaterThanOrEqual(20);
      expect(Math.max(...sizes), name).toBeLessThanOrEqual(40);
      expect(Math.max(...sizes) / Math.min(...sizes), name).toBeLessThanOrEqual(1.75);
      expect(Math.min(...centers), name).toBeGreaterThanOrEqual(22);
      expect(Math.max(...centers), name).toBeLessThanOrEqual(26);
      expect(Math.max(...centers) - Math.min(...centers), name).toBeLessThanOrEqual(3);
      expect(Math.min(...feet), name).toBeGreaterThanOrEqual(42);
      expect(Math.max(...feet), name).toBeLessThanOrEqual(45);
      expect(Math.max(...feet) - Math.min(...feet), name).toBeLessThanOrEqual(2);
    }
  });

  it("卵を含む全アクターが共通の足元安全境界を越えない", () => {
    for (const name of PIXEL_ACTORS) {
      for (const direction of PIXEL_ACTOR_RENDER_DIRS) {
        const bounds = alphaBounds(actorCrop(name, "idle", direction, 0));
        expect(bounds.maxY, `${name}:${direction}`).toBe(44);
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

  it("原画ごとの左右補正は監査結果を保持する", () => {
    const expected = Object.fromEntries(Object.keys(manifest.actorSources).map((name) => [name, {}]));
    const set = (names, directions) => names.forEach((name) => { expected[name] = directions; });
    set(["slime", "superslime", "crownslime"], { se: ["*"], ne: ["cast", "heal", "eat", "dodge"] });
    set(["carniv", "evolved", "direfang"], { e: ["*"], se: ["*"] });
    set(["moss_shroom", "moss_mycelia", "moss_myceliaKing"], { ne: ["*"] });
    set(["moss_virus", "moss_crystalVirus", "moss_crownVirus"], { e: ["*"], se: ["*"], ne: ["eat"] });
    set(["moss_root", "moss_tangleRoot", "moss_ancientRoot"], { e: ["*"], se: ["*"] });
    set(["meat_wolf", "meat_shadowWolf", "meat_nightfangKing"], { e: ["*"], se: ["*"], ne: ["*"] });
    set([
      "meat_boar", "meat_fangBoar", "meat_ironBoar",
      "meat_hedgehog", "meat_steelHedgehog", "meat_spineKing",
      "spitter", "tarantula", "goldweaver",
      "bug_centipede", "bug_steelCentipede", "bug_goldCentipede",
      "bug_beetle", "bug_shieldBeetle", "bug_fortressBeetle",
      "bug_needler", "bug_flyingNeedler", "bug_bowNeedler",
      "golem", "titan", "goldcore",
      "stone_turtle", "stone_ironTurtle", "stone_goldTurtle",
      "stone_magnetCrab", "stone_ironCrab", "stone_blackCrab",
      "flame", "infernal", "whiteflame",
    ], { e: ["*"], se: ["*"] });
    set(["stone_crystalEye", "stone_quartzEye", "stone_rainbowEye"], { ne: ["cast", "eat", "dodge"] });
    set(["dragon_serpent", "dragon_flameSerpent", "dragon_whiteSerpent"], { se: ["*"], ne: ["*"] });
    set(["dragon_salamander", "dragon_lavaSalamander", "dragon_mirageSalamander"], { se: ["*"] });
    set(["dragon_wyvern", "dragon_stormWyvern", "dragon_skyWyvern"], { se: ["*"], ne: ["*"] });
    set(["reaper"], { e: ["*"], se: ["*"] });
    set(["chimera"], { se: ["*"], ne: ["*"] });
    set(["warrior", "tank", "ultrawarrior", "captain", "priest", "mage", "max", "shon"], { e: ["*"], se: ["*"] });
    set(["superwarrior", "crossknight", "supermage", "sage", "xTerminator"], { e: ["*"], se: ["*"], ne: ["*"] });
    set(["hori"], { ne: ["*"] });
    expect(manifest.actorSourceFlipX).toEqual(expected);
    expect(Object.entries(expected).filter(([, directions]) => Object.keys(directions).length === 0)).toEqual([["saint", {}]]);
  });

  it("旧個別ポーズを使わずNEとNWを新しい本体シートから描画する", () => {
    expect(manifest.actorPoseOverrides).toEqual({});
    expect(manifest.actorSourceFlipX.moss_virus.ne).toEqual(["eat"]);
    for (const action of PIXEL_ACTIONS) {
      const northeast = pixelActorFrameInfo("moss_virus", action, "ne", 0);
      const northwest = pixelActorFrameInfo("moss_virus", action, "nw", 0);
      expect(northwest.frame, action).toBe(northeast.frame);
      expect(northeast.flipX, action).toBe(false);
      expect(northwest.flipX, action).toBe(true);
      expect(opaqueCount(actorCrop("moss_virus", action, "ne", 0)), action).toBeGreaterThan(20);
    }
  });

  it("全進化種が独立原画と異なる形状を使う", () => {
    expect(manifest.paletteVariants).toEqual({});
    const directActors = PIXEL_ACTORS.filter((name) => !name.startsWith("egg_"));
    expect(Object.keys(manifest.actorSources).sort()).toEqual([...directActors].sort());
    for (const name of directActors) expect(manifest.actorSources[name]).toBe(`actors/${name}.png`);
    for (const [sheet, names] of Object.entries(PIXEL_ACTOR_SHEETS)) {
      if (names.length !== 3 || sheet === "eggs") continue;
      for (const [leftIndex, rightIndex] of [[0, 1], [0, 2], [1, 2]]) {
        const differences = PIXEL_ACTOR_RENDER_DIRS.map((direction) => alphaJaccardDiff(
          actorCrop(names[leftIndex], "idle", direction, 1),
          actorCrop(names[rightIndex], "idle", direction, 1),
        ));
        const average = differences.reduce((sum, value) => sum + value, 0) / differences.length;
        expect(average, `${names[leftIndex]}/${names[rightIndex]}`).toBeGreaterThan(0.04);
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

    expect(manifest.itemSheets).toHaveLength(PIXEL_ITEMS.length);
    manifest.itemSheets.forEach((sheet, index) => {
      expect(sheet).toMatchObject({ columns: 1, rows: 1, ids: [PIXEL_ITEMS[index]] });
      const source = png(`assets/pixel/source/imagegen-v1/${sheet.file}`);
      const corners = [0, source.width - 1, (source.height - 1) * source.width, source.width * source.height - 1];
      expect(corners.map((pixel) => source.data[pixel * 4 + 3]), sheet.file).toEqual([0, 0, 0, 0]);
      expect(hasOpaqueMagenta(source), sheet.file).toBe(false);
      expect(opaqueEdgeCount(source), sheet.file).toBe(0);
    });
    PIXEL_DEBUFFS.forEach((_, index) => {
      expect(opaqueCount(atlasCell("debuffs.png", index))).toBeGreaterThan(60);
    });
    const executive = atlasCell("dialogue_portraits.png", 0);
    const gorilla = atlasCell("dialogue_portraits.png", 1);
    expect(opaqueCount(executive)).toBeGreaterThan(180);
    expect(opaqueCount(gorilla)).toBeGreaterThan(180);
    expect(diffStats(executive, gorilla).colorRatio).toBeGreaterThan(0.3);
  });

  it("土壌の藻はstage 0を持たず1〜7で被覆量が増える", () => {
    expect(PIXEL_SOIL_ALGAE_STAGES).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(manifest.layouts.soilAlgae.stages).toEqual(PIXEL_SOIL_ALGAE_STAGES);
    expect(manifest.layouts.soilAlgae.files).toHaveLength(PIXEL_SOIL_ALGAE_STAGES.length);
    const atlas = png("assets/pixel/soil_algae.png");
    let previousCoverage = 0;
    PIXEL_SOIL_ALGAE_STAGES.forEach((stage, index) => {
      const overlay = crop(atlas, index * PIXEL_CELL, 0);
      const coverage = opaqueCount(overlay);
      expect(coverage, `stage ${stage}`).toBeGreaterThan(previousCoverage);
      expect(opaqueEdgeCount(overlay), `stage ${stage}`).toBe(0);
      previousCoverage = coverage;
      const source = png(`assets/pixel/source/imagegen-v1/${manifest.layouts.soilAlgae.files[index]}`);
      expect(hasOpaqueMagenta(source), `stage ${stage}`).toBe(false);
      expect(opaqueEdgeCount(source), `stage ${stage}`).toBe(0);
    });
  });

  it("第二進化鉱脈オーラは内側6pxだけで4フレームが漂う", () => {
    expect(PIXEL_VEIN_EVO2_AURA_FRAMES).toBe(4);
    expect(manifest.layouts.veinEvo2Aura).toMatchObject({ frames: 4, innerPadding: 6 });
    const atlas = png("assets/pixel/vein_evo2_aura.png");
    const hashes = [];
    for (let frame = 0; frame < PIXEL_VEIN_EVO2_AURA_FRAMES; frame++) {
      const aura = crop(atlas, frame * PIXEL_CELL, 0);
      expect(opaqueCount(aura), `frame ${frame}`).toBeGreaterThan(8);
      expect(opaqueOuterBandCount(aura, 6), `frame ${frame}`).toBe(0);
      hashes.push(imageHash(aura));
      const source = png(`assets/pixel/source/imagegen-v1/${manifest.layouts.veinEvo2Aura.files[frame]}`);
      expect(hasOpaqueMagenta(source), `source ${frame}`).toBe(false);
      expect(opaqueEdgeCount(source), `source ${frame}`).toBe(0);
    }
    expect(new Set(hashes).size).toBe(PIXEL_VEIN_EVO2_AURA_FRAMES);
  });

  it("近接化した苔ウイルスの攻撃セルに分離した飛び道具がない", () => {
    for (const name of ["moss_virus", "moss_crystalVirus", "moss_crownVirus"]) {
      for (const direction of PIXEL_ACTOR_RENDER_DIRS) {
        for (let frame = 0; frame < PIXEL_FRAMES; frame++) {
          const attack = actorCrop(name, "attack", direction, frame);
          expect(opaqueComponentCount(attack), `${name}:${direction}:${frame}`).toBe(1);
        }
      }
    }
  });

  it("全進化段階の鉱脈に原画セル境界や発光外周を焼き込まない", () => {
    const seamSensitiveTiles = [
      "earth", "tunnel", "bedrock",
      "moss", "meat", "venom", "stone", "ember",
      "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo",
      "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2",
    ];
    for (const name of seamSensitiveTiles) {
      const tile = atlasCell("tiles.png", PIXEL_TILES.indexOf(name));
      for (const side of ["left", "right", "top", "bottom"]) {
        const ratio = tileEdgeRatio(tile, side);
        expect(ratio, `${name}:${side}`).toBeGreaterThanOrEqual(0.55);
        expect(ratio, `${name}:${side}`).toBeLessThanOrEqual(1.8);
      }
    }
  });

  it("第二進化鉱脈は外周発光ではなく内部模様で第一進化と区別する", () => {
    for (const kind of manifest.layouts.veinTiles.kinds) {
      const evolved = atlasCell("tiles.png", PIXEL_TILES.indexOf(`${kind}_evo`));
      const secondEvolved = atlasCell("tiles.png", PIXEL_TILES.indexOf(`${kind}_evo2`));
      expect(diffStats(evolved, secondEvolved).colorRatio, kind).toBeGreaterThan(0.24);
    }
  });

  it("卵はモンスター固有意匠ではなく土壌種別と進化段階の模様を使う", () => {
    expect(manifest.layouts.eggs.soilPatternColumns).toEqual(["venom", "stone", "ember"]);
    expect(manifest.layouts.eggs.soilPatternRows).toEqual(["normal", "evo", "evo2"]);
    expect(manifest.layouts.eggs.soilPatternSources).toEqual([
      "venom", "stone", "ember",
      "venom_evo", "stone_evo", "ember_evo",
      "venom_evo2", "stone_evo2", "ember_evo2",
    ]);

    const eggSource = png("assets/pixel/source/imagegen-v1/eggs/eggs.png");
    const bounds = [];
    for (let row = 0; row < manifest.layouts.eggs.rows; row++) {
      for (let column = 0; column < manifest.layouts.eggs.columns; column++) {
        const cell = gridCell(
          eggSource,
          column,
          row,
          manifest.layouts.eggs.columns,
          manifest.layouts.eggs.rows,
        );
        expect(hasOpaqueMagenta(cell), `${column},${row}`).toBe(false);
        bounds.push(alphaBounds(cell));
      }
    }
    const widths = bounds.map(({ minX, maxX }) => maxX - minX + 1);
    const heights = bounds.map(({ minY, maxY }) => maxY - minY + 1);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(eggSource.width * 0.03);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(eggSource.height * 0.03);
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
      ...Object.values(manifest.actorPoseOverrides).flatMap((directions) =>
        Object.values(directions).flatMap((actions) => Object.values(actions)),
      ),
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
