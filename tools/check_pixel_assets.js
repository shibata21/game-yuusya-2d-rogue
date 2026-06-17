"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, ACTORS, TILES, EFFECTS,
  readPng, spritePath,
} = require("./pixel_asset_common");
const THIRD_PARTY_FILE = path.join(OUT_DIR, "third_party_assets.json");

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
function alphaBounds(img) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 0) {
      count++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY, count };
}
function colorDiff(a, ai, b, bi) {
  return Math.abs(a[ai] - b[bi]) + Math.abs(a[ai + 1] - b[bi + 1]) + Math.abs(a[ai + 2] - b[bi + 2]) + Math.abs(a[ai + 3] - b[bi + 3]);
}
function diffRatio(a, b) {
  let union = 0, diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] > 0 || b.data[i + 3] > 0) union++;
    if (colorDiff(a.data, i, b.data, i) > 32) diff++;
  }
  return union ? diff / union : 0;
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
  for (const name of ACTORS) for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) validatePng(spritePath("actors", name, f, dir, action), CELL, CELL, false);
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) validatePng(spritePath("effects", name, f), CELL, CELL, true);
  ok("個別PNGフレームを検査しました");
}

function validateMeta() {
  const file = path.join(OUT_DIR, "sprites.json");
  exists(file);
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  if (meta.cell !== CELL || meta.frames !== FRAMES) fail("sprites.json のセル仕様が不正です");
  if (JSON.stringify(meta.directions) !== JSON.stringify(DIRECTIONS)) fail("directions の順序が不正です");
  if (JSON.stringify(meta.actions) !== JSON.stringify(ACTIONS)) fail("actions の順序が不正です");
  if (JSON.stringify(Object.keys(meta.actors)) !== JSON.stringify(ACTORS)) fail("actors の順序が不正です");
  if (JSON.stringify(Object.keys(meta.tiles)) !== JSON.stringify(TILES)) fail("tiles の順序が不正です");
  if (JSON.stringify(Object.keys(meta.effects)) !== JSON.stringify(EFFECTS)) fail("effects の順序が不正です");
  ok("sprites.json を検査しました");
}

function validateAtlas() {
  const actors = validatePng(path.join(OUT_DIR, "actors.png"), CELL * FRAMES * DIRECTIONS.length * ACTIONS.length, CELL * ACTORS.length, false);
  const tiles = validatePng(path.join(OUT_DIR, "tiles.png"), CELL * TILES.length, CELL, false);
  const effects = validatePng(path.join(OUT_DIR, "effects.png"), CELL * FRAMES, CELL * EFFECTS.length, true);
  for (let row = 0; row < ACTORS.length; row++) {
    for (let ai = 0; ai < ACTIONS.length; ai++) for (let di = 0; di < DIRECTIONS.length; di++) {
      for (let f = 0; f < FRAMES; f++) {
        const frame = new PNG({ width: CELL, height: CELL });
        PNG.bitblt(actors, frame, ((ai * DIRECTIONS.length + di) * FRAMES + f) * CELL, row * CELL, CELL, CELL, 0, 0);
        nonEmpty(frame, "actors.png:" + ACTORS[row] + ":" + ACTIONS[ai] + ":" + DIRECTIONS[di] + ":" + f);
      }
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
        ACTIONS.forEach((action, ai) => {
          DIRECTIONS.forEach((dir, di) => {
          for (let f = 0; f < FRAMES; f++) PNG.bitblt(readPng(spritePath("actors", name, f, dir, action)), source, 0, 0, CELL, CELL, ((ai * DIRECTIONS.length + di) * FRAMES + f) * CELL, row * CELL);
          });
        });
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

function actorFrame(name, action, dir, frame = 2) {
  return readPng(spritePath("actors", name, frame, dir, action));
}
function validateActorDirectionDiff() {
  const names = ACTORS.filter((n) => !n.startsWith("egg_"));
  for (const name of names) {
    const pairs = [["e", "w"], ["s", "n"], ["se", "nw"]];
    for (const pair of pairs) {
      const d = diffRatio(actorFrame(name, "idle", pair[0], 1), actorFrame(name, "idle", pair[1], 1));
      if (d < 0.13) fail(name + " の方向差分が小さすぎます: " + pair.join("/") + " " + d.toFixed(3));
    }
  }
  ok("アクターの8方向差分を検査しました");
}
function validateHeroActionDiff() {
  const heroActions = { warrior: "attack", tank: "dig", mage: "cast", priest: "heal" };
  for (const name of Object.keys(heroActions)) {
    const action = heroActions[name];
    const d = diffRatio(actorFrame(name, "idle", "e", 1), actorFrame(name, action, "e", 2));
    if (d < 0.18) fail(name + " の " + action + " アクション差分が小さすぎます: " + d.toFixed(3));
  }
  ok("勇者の職業別アクション差分を検査しました");
}
function paletteStats(base, elite) {
  let union = 0, alphaDiff = 0, colorDiff = 0, redDominant = 0, opaque = 0;
  for (let i = 0; i < base.data.length; i += 4) {
    const ba = base.data[i + 3], ea = elite.data[i + 3];
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
function validateElitePaletteVariants() {
  const pairs = [["slime", "superslime"], ["carniv", "evolved"], ["spitter", "tarantula"], ["golem", "titan"], ["flame", "infernal"]];
  for (const pair of pairs) {
    for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) {
      const stats = paletteStats(actorFrame(pair[0], action, dir, f), actorFrame(pair[1], action, dir, f));
      if (stats.alphaDiff !== 0) fail(pair.join("/") + " は形状が一致しません: " + action + "/" + dir + "/" + f + " alphaDiff=" + stats.alphaDiff);
      if (stats.colorRatio < 0.08) fail(pair.join("/") + " の色差分が小さすぎます: " + action + "/" + dir + "/" + f + " " + stats.colorRatio.toFixed(3));
      if (pair[1] === "superslime" && stats.redRatio < 0.65) fail("superslime が赤優勢ではありません: " + action + "/" + dir + "/" + f + " " + stats.redRatio.toFixed(3));
    }
  }
  ok("進化モンスターの色違い化を検査しました");
}
function validateSimpleVeins() {
  const veins = ["moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo"];
  const earth = readPng(spritePath("tiles", "earth"));
  for (const name of veins) {
    const img = readPng(spritePath("tiles", name));
    let motif = 0, outside = 0;
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (colorDiff(img.data, i, earth.data, i) > 48) {
        motif++;
        if (x < 10 || x > 38 || y < 8 || y > 40) outside++;
      }
    }
    if (motif > (name.endsWith("_evo") ? 360 : 290)) fail(name + " の鉱脈模様が複雑すぎます: " + motif);
    if (outside > 45) fail(name + " の鉱脈模様が広がりすぎています: " + outside);
  }
  ok("鉱脈のシンプルな中央モチーフを検査しました");
}

function validateNoCircleSyntax() {
  const build = fs.readFileSync(path.join("tools", "build_pixel_assets.js"), "utf8");
  const common = fs.readFileSync(path.join("tools", "pixel_asset_common.js"), "utf8");
  if (/\bring\s*\(/.test(build) || /function\s+ring\b/.test(common)) fail("円形囲み用の ring が残っています");
  ok("円形囲みヘルパーが残っていないことを検査しました");
}
function validateExternalActorSources() {
  exists(THIRD_PARTY_FILE);
  const meta = JSON.parse(fs.readFileSync(THIRD_PARTY_FILE, "utf8"));
  const source = meta.sources && meta.sources.dcss;
  if (!source || source.license !== "CC0-1.0") fail("DCSS素材ソースのCC0ライセンス記録がありません");
  if (!source.licenseFile) fail("DCSS素材ソースのライセンス本文パスがありません");
  else exists(source.licenseFile);
  for (const name of ACTORS) {
    const refs = meta.actors && meta.actors[name];
    if (!Array.isArray(refs) || refs.length === 0) fail(name + " の外部素材参照がありません");
    for (const ref of refs || []) {
      if (!ref.startsWith("dcss:")) fail(name + " の外部素材参照が不正です: " + ref);
      const file = path.join(source.localRoot, ref.replace(/^dcss:/, ""));
      exists(file);
    }
  }
  const build = fs.readFileSync(path.join("tools", "build_pixel_assets.js"), "utf8");
  if (/function\s+drawMonster\b/.test(build) || /function\s+drawHero\b/.test(build) || /function\s+bodyBox\b/.test(build) || /function\s+eye\b/.test(build)) {
    fail("旧式の図形キャラクター生成関数が残っています");
  }
  ok("キャラクター外部CC0素材の参照を検査しました");
}
function validateNoLegacyActorSources() {
  for (const version of ["v2", "v3", "v4"]) {
    const dir = path.join(OUT_DIR, "source", version, "actors");
    if (fs.existsSync(dir)) fail("旧世代の生成キャラクターソースが残っています: " + dir);
  }
  if (fs.existsSync(path.join(OUT_DIR, "source", "actors-source.png"))) fail("旧生成キャラクターシートが残っています");
  ok("旧世代の生成キャラクターソースがないことを検査しました");
}

(async () => {
  validateSource();
  validateMeta();
  validateAtlas();
  validateNoCircleSyntax();
  validateExternalActorSources();
  validateNoLegacyActorSources();
  validateActorDirectionDiff();
  validateHeroActionDiff();
  validateElitePaletteVariants();
  validateSimpleVeins();
  await validateGeneratedDiff();
  if (failed) process.exit(1);
  console.log("ピクセル素材検査が完了しました。");
})().catch((err) => {
  console.error(err && (err.stack || err.message || err));
  process.exit(1);
});
