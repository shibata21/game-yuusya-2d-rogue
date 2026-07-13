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

function resizeNearest(img, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    const sy = Math.min(img.height - 1, Math.floor(((y + 0.5) * img.height) / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(img.width - 1, Math.floor(((x + 0.5) * img.width) / width));
      const si = (sy * img.width + sx) * 4;
      const di = (y * width + x) * 4;
      out.data[di] = img.data[si];
      out.data[di + 1] = img.data[si + 1];
      out.data[di + 2] = img.data[si + 2];
      out.data[di + 3] = img.data[si + 3] <= 8 ? 0 : img.data[si + 3];
    }
  }
  return out;
}

function flipHorizontal(img) {
  const out = new PNG({ width: img.width, height: img.height });
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const si = (y * img.width + x) * 4;
      const di = (y * out.width + out.width - x - 1) * 4;
      out.data[di] = img.data[si];
      out.data[di + 1] = img.data[si + 1];
      out.data[di + 2] = img.data[si + 2];
      out.data[di + 3] = img.data[si + 3];
    }
  }
  return out;
}

function normalizeActorCell(img) {
  const bounds = alphaBounds(img);
  const cropped = crop(img, bounds.minX, bounds.minY, bounds.maxX - bounds.minX + 1, bounds.maxY - bounds.minY + 1);
  const scale = Math.min(42 / cropped.width, 42 / cropped.height);
  const width = Math.max(1, Math.round(cropped.width * scale));
  const height = Math.max(1, Math.round(cropped.height * scale));
  const resized = resizeNearest(cropped, width, height);
  const out = new PNG({ width: PIXEL_CELL, height: PIXEL_CELL });
  const x = Math.round((PIXEL_CELL - width) / 2);
  const y = PIXEL_CELL - height - 2;
  PNG.bitblt(resized, out, 0, 0, width, height, x, y);
  return out;
}

function shifted(img, dx, dy) {
  const out = new PNG({ width: img.width, height: img.height });
  for (let y = 0; y < img.height; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= out.height) continue;
    for (let x = 0; x < img.width; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= out.width) continue;
      const si = (y * img.width + x) * 4;
      const di = (ty * out.width + tx) * 4;
      out.data[di] = img.data[si];
      out.data[di + 1] = img.data[si + 1];
      out.data[di + 2] = img.data[si + 2];
      out.data[di + 3] = img.data[si + 3];
    }
  }
  return out;
}

function frameOffset(action, direction, frame) {
  const vectors = { e: [1, 0], se: [1, 1], s: [0, 1], ne: [1, -1], n: [0, -1] };
  const [vx, vy] = vectors[direction];
  const side = vx === 0 ? 1 : vx;
  const motions = {
    idle: [[0, 0], [0, -1], [0, 0], [0, 1]],
    attack: [[-vx, -vy], [0, 0], [vx * 2, vy * 2], [vx, vy]],
    cast: [[0, 1], [0, 0], [0, -2], [0, -1]],
    dig: [[0, -1], [side, 0], [side * 2, 2], [0, 1]],
    heal: [[0, 1], [0, 0], [0, -2], [0, -1]],
    eat: [[-side, 0], [0, 1], [side, 0], [0, 0]],
    dodge: [[0, 0], [-side * 2, 0], [side * 2, -1], [0, 0]],
  };
  return motions[action][frame];
}

function expectedActorFrame(name, action, direction, frame) {
  const override = manifest.actorPoseOverrides?.[name]?.[direction]?.[action];
  const src = png(`assets/pixel/source/imagegen-v1/${override || manifest.actorSources[name]}`);
  const cell = override
    ? src
    : gridCell(
      src,
      PIXEL_ACTOR_RENDER_DIRS.indexOf(direction),
      PIXEL_ACTIONS.indexOf(action),
      manifest.layouts.actors.columns,
      manifest.layouts.actors.rows,
    );
  const transforms = manifest.actorSourceFlipX[name]?.[direction] || [];
  const corrected = transforms.includes("*") || transforms.includes(action) ? flipHorizontal(cell) : cell;
  const [dx, dy] = frameOffset(action, direction, frame);
  return shifted(normalizeActorCell(corrected), dx, dy);
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
    expect(Object.keys(meta.debuffs)).toEqual(PIXEL_DEBUFFS);
    expect(Object.keys(meta.dialogue)).toEqual(PIXEL_DIALOGUE_PORTRAITS);
    expect(meta.sourceVersion).toBe("imagegen-v1");
    expect(meta.generator.toLowerCase()).toContain("imagegen");
    expect(manifest.layouts.environmentTiles.trimRatio).toBe(0.03);
    expect(manifest.layouts.veinTiles.trimRatio).toBe(0.05);
  });

  it("公開アセットURLとフレーム参照が新しい版を使う", () => {
    expect(PIXEL_ASSET_VERSION).toBe("v30-imagegen");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=v30-imagegen");
    expect(pixelAssetUrl("items.png")).toBe("assets/pixel/items.png?v=v30-imagegen");
    expect(pixelAssetUrl("debuffs.png")).toBe("assets/pixel/debuffs.png?v=v30-imagegen");
    expect(pixelAssetUrl("dialogue_portraits.png")).toBe("assets/pixel/dialogue_portraits.png?v=v30-imagegen");
    expect(pixelAssetUrl(pixelActorFileName("venom_spider"))).toBe(
      "assets/pixel/actor_venom_spider.png?v=v30-imagegen",
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

  it("原画ごとの左右補正は監査結果を保持する", () => {
    expect(manifest.actorSourceFlipX).toEqual({
      slime: { se: ["*"], ne: ["cast", "heal", "eat", "dodge"] },
      carniv: { e: ["*"], se: ["*"] },
      moss_shroom: { ne: ["*"] },
      moss_virus: { e: ["*"], se: ["*"] },
      moss_root: { e: ["*"], se: ["*"] },
      meat_wolf: { e: ["*"], se: ["*"] },
      meat_boar: { e: ["*"], se: ["*"] },
      meat_hedgehog: { e: ["*"], se: ["*"] },
      spitter: { e: ["*"], se: ["*"] },
      bug_centipede: { e: ["*"], se: ["*"] },
      bug_beetle: { e: ["*"], se: ["*"] },
      bug_needler: { e: ["*"], se: ["*"] },
      golem: { e: ["*"], se: ["*"] },
      stone_turtle: { e: ["*"], se: ["*"] },
      stone_magnetCrab: { e: ["*"], se: ["*"] },
      stone_crystalEye: { ne: ["cast", "eat", "dodge"] },
      flame: { e: ["*"], se: ["*"] },
      dragon_serpent: { se: ["*"], ne: ["*"] },
      dragon_salamander: { se: ["*"] },
      dragon_wyvern: { se: ["*"], ne: ["*"] },
      reaper: { e: ["*"], se: ["*"] },
      chimera: { se: ["*"], ne: ["*"] },
      warrior: { e: ["*"], se: ["*"] },
      tank: { e: ["*"], se: ["*"] },
      superwarrior: { e: ["*"], se: ["*"], ne: ["*"] },
      ultrawarrior: { e: ["*"], se: ["*"] },
      crossknight: { e: ["*"], se: ["*"], ne: ["*"] },
      captain: { e: ["*"], se: ["*"] },
      priest: { e: ["*"], se: ["*"] },
      saint: {},
      mage: { e: ["*"], se: ["*"] },
      supermage: { e: ["*"], se: ["*"], ne: ["*"] },
      sage: { e: ["*"], se: ["*"], ne: ["*"] },
      max: { e: ["*"], se: ["*"] },
      shon: { ne: ["*"] },
      hori: { ne: ["*"] },
      xTerminator: { e: ["*"], se: ["*"], ne: ["*"] },
    });
    expect(manifest.actorSourceFlipX.moss_virus.ne).toBeUndefined();
  });

  it("方向補正済み原画セルがアトラスへ反映される", () => {
    for (const [name, directions] of Object.entries(manifest.actorSourceFlipX)) {
      for (const [direction, actions] of Object.entries(directions)) {
        const targets = actions.includes("*") ? PIXEL_ACTIONS : actions;
        for (const action of targets) {
          const expected = expectedActorFrame(name, action, direction, 0);
          const actual = actorCrop(name, action, direction, 0);
          expect(imageHash(actual), `${name}:${action}:${direction}`).toBe(imageHash(expected));
        }
      }
    }
  });

  it("北東向きの個別ポーズ原画が透過化されアトラスへ反映される", () => {
    const poses = manifest.actorPoseOverrides;
    expect(poses).toEqual({
      moss_virus: {
        ne: Object.fromEntries(
          PIXEL_ACTIONS.map((action) => [action, `actors/moss_virus_ne/${action}.png`]),
        ),
      },
    });
    for (const action of PIXEL_ACTIONS) {
      const source = png(`assets/pixel/source/imagegen-v1/${poses.moss_virus.ne[action]}`);
      const corners = [0, source.width - 1, (source.height - 1) * source.width, source.width * source.height - 1];
      expect(corners.map((pixel) => source.data[pixel * 4 + 3])).toEqual([0, 0, 0, 0]);
      expect(hasOpaqueMagenta(source), action).toBe(false);
      const expected = expectedActorFrame("moss_virus", action, "ne", 0);
      expect(imageHash(actorCrop("moss_virus", action, "ne", 0)), action).toBe(imageHash(expected));
    }
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
