"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const {
  CELL, FRAMES, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  readPng, spritePath,
} = require("./pixel_asset_common");

let failed = false;
function fail(msg) {
  failed = true;
  console.error("NG: " + msg);
}
function ok(msg) {
  console.log("OK: " + msg);
}

function exists(file) {
  if (!fs.existsSync(file)) fail("ファイルがありません: " + file);
}

function nonEmpty(img, file) {
  let count = 0;
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 0) count++;
  if (count === 0) fail("透明だけの画像です: " + file);
  return count;
}

function whiteEdgeCount(img) {
  let count = 0;
  const sample = (x, y) => {
    const i = (y * img.width + x) * 4;
    const a = img.data[i + 3];
    return a > 0 && img.data[i] >= 235 && img.data[i + 1] >= 235 && img.data[i + 2] >= 235;
  };
  for (let x = 0; x < img.width; x++) {
    if (sample(x, 0)) count++;
    if (sample(x, img.height - 1)) count++;
  }
  for (let y = 0; y < img.height; y++) {
    if (sample(0, y)) count++;
    if (sample(img.width - 1, y)) count++;
  }
  return count;
}

function validatePng(file, w, h, allowWhiteEdge) {
  exists(file);
  const img = readPng(file);
  if (img.width !== w || img.height !== h) fail(file + " の寸法が不正です: " + img.width + "x" + img.height + " expected " + w + "x" + h);
  nonEmpty(img, file);
  const edge = whiteEdgeCount(img);
  if (!allowWhiteEdge && edge > 0) fail(file + " の外周に白系ピクセルがあります: " + edge);
  return img;
}

function validateSource() {
  for (const name of TILES) validatePng(spritePath("tiles", name), CELL, CELL, false);
  for (const name of ACTORS) for (let f = 0; f < FRAMES; f++) validatePng(spritePath("actors", name, f), CELL, CELL, false);
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) validatePng(spritePath("effects", name, f), CELL, CELL, true);
  ok("個別PNGフレームを検査しました");
}

function validateMeta() {
  const file = path.join(OUT_DIR, "sprites.json");
  exists(file);
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  if (meta.cell !== CELL || meta.frames !== FRAMES) fail("sprites.json のセル仕様が不正です");
  if (JSON.stringify(Object.keys(meta.actors)) !== JSON.stringify(ACTORS)) fail("actors の順序が不正です");
  if (JSON.stringify(Object.keys(meta.tiles)) !== JSON.stringify(TILES)) fail("tiles の順序が不正です");
  if (JSON.stringify(Object.keys(meta.effects)) !== JSON.stringify(EFFECTS)) fail("effects の順序が不正です");
  ok("sprites.json を検査しました");
}

function validateAtlas() {
  const actors = validatePng(path.join(OUT_DIR, "actors.png"), CELL * FRAMES, CELL * ACTORS.length, false);
  const tiles = validatePng(path.join(OUT_DIR, "tiles.png"), CELL * TILES.length, CELL, false);
  const effects = validatePng(path.join(OUT_DIR, "effects.png"), CELL * FRAMES, CELL * EFFECTS.length, true);
  for (let row = 0; row < ACTORS.length; row++) {
    for (let f = 0; f < FRAMES; f++) {
      const frame = new PNG({ width: CELL, height: CELL });
      PNG.bitblt(actors, frame, f * CELL, row * CELL, CELL, CELL, 0, 0);
      nonEmpty(frame, "actors.png:" + ACTORS[row] + ":" + f);
    }
  }
  for (let col = 0; col < TILES.length; col++) {
    const tile = new PNG({ width: CELL, height: CELL });
    PNG.bitblt(tiles, tile, col * CELL, 0, CELL, CELL, 0, 0);
    nonEmpty(tile, "tiles.png:" + TILES[col]);
    const edge = whiteEdgeCount(tile);
    if (edge > 0) fail("tiles.png:" + TILES[col] + " のセル外周に白系ピクセルがあります: " + edge);
  }
  for (let row = 0; row < EFFECTS.length; row++) {
    for (let f = 0; f < FRAMES; f++) {
      const frame = new PNG({ width: CELL, height: CELL });
      PNG.bitblt(effects, frame, f * CELL, row * CELL, CELL, CELL, 0, 0);
      nonEmpty(frame, "effects.png:" + EFFECTS[row] + ":" + f);
    }
  }
  ok("アトラスPNGを検査しました");
}

async function validateGeneratedDiff() {
  const pixelmatch = (await import("pixelmatch")).default;
  const files = ["actors.png", "tiles.png", "effects.png"];
  for (const file of files) {
    const img = readPng(path.join(OUT_DIR, file));
    const source = new PNG({ width: img.width, height: img.height });
    if (file === "actors.png") {
      ACTORS.forEach((name, row) => {
        for (let f = 0; f < FRAMES; f++) PNG.bitblt(readPng(spritePath("actors", name, f)), source, 0, 0, CELL, CELL, f * CELL, row * CELL);
      });
    } else if (file === "tiles.png") {
      TILES.forEach((name, col) => PNG.bitblt(readPng(spritePath("tiles", name)), source, 0, 0, CELL, CELL, col * CELL, 0));
    } else {
      EFFECTS.forEach((name, row) => {
        for (let f = 0; f < FRAMES; f++) PNG.bitblt(readPng(spritePath("effects", name, f)), source, 0, 0, CELL, CELL, f * CELL, row * CELL);
      });
    }
    const diff = new PNG({ width: img.width, height: img.height });
    const mismatches = pixelmatch(img.data, source.data, diff.data, img.width, img.height, { threshold: 0 });
    if (mismatches !== 0) fail(file + " は個別PNGからの再生成結果と一致しません: " + mismatches);
  }
  ok("アトラスの再生成一致を検査しました");
}

(async () => {
  validateSource();
  validateMeta();
  validateAtlas();
  await validateGeneratedDiff();
  if (failed) process.exit(1);
  console.log("ピクセル素材検査が完了しました。");
})().catch((err) => {
  console.error(err && (err.stack || err.message || err));
  process.exit(1);
});
