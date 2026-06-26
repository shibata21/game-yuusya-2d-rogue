"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS, AMULET_ICONS,
  readPng, spritePath,
} = require("./pixel_asset_common");

const EXPECTED_EGG_ACTORS = ["egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"];
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
function uniqueOpaqueColors(img) {
  const colors = new Set();
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 0) colors.add(img.data[i] + "," + img.data[i + 1] + "," + img.data[i + 2] + "," + img.data[i + 3]);
  }
  return colors.size;
}
function pixelsIn(img, pred) {
  let count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] > 0 && pred(x, y, img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3])) count++;
  }
  return count;
}
function eggMotifPixels(img) {
  return pixelsIn(img, (x, y, r, g, b, a) => {
    if (a <= 0 || x < 15 || x > 34 || y < 20 || y > 39) return false;
    return Math.max(r, g, b) - Math.min(r, g, b) > 35 && Math.min(r, g, b) < 150;
  });
}
function eggGlowPixels(img) {
  return pixelsIn(img, (x, y, r, g, b, a) => {
    if (a <= 0 || !(x <= 7 || x >= 41 || y <= 6 || y >= 46)) return false;
    return r + g + b > 610;
  });
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
  for (const name of AMULET_ICONS) validatePng(spritePath("amulets", name), CELL, CELL, false);
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
  if (JSON.stringify(Object.keys(meta.amulets)) !== JSON.stringify(AMULET_ICONS)) fail("amulets の順序が不正です");
  ok("sprites.json を検査しました");
}

function validateAtlas() {
  const actors = validatePng(path.join(OUT_DIR, "actors.png"), CELL * FRAMES * DIRECTIONS.length * ACTIONS.length, CELL * ACTORS.length, false);
  const tiles = validatePng(path.join(OUT_DIR, "tiles.png"), CELL * TILES.length, CELL, false);
  const effects = validatePng(path.join(OUT_DIR, "effects.png"), CELL * FRAMES, CELL * EFFECTS.length, true);
  const amulets = validatePng(path.join(OUT_DIR, "amulets.png"), CELL * AMULET_ICONS.length, CELL, false);
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
  for (let col = 0; col < AMULET_ICONS.length; col++) {
    const icon = new PNG({ width: CELL, height: CELL });
    PNG.bitblt(amulets, icon, col * CELL, 0, CELL, CELL, 0, 0);
    nonEmpty(icon, "amulets.png:" + AMULET_ICONS[col]);
    const edge = whiteEdgeCount(icon);
    if (edge > 0) fail("amulets.png:" + AMULET_ICONS[col] + " のセル外周に白系ピクセルがあります: " + edge);
  }
  ok("アトラスPNGを検査しました");
}

async function validateGeneratedDiff() {
  const pixelmatch = (await import("pixelmatch")).default;
  const files = ["actors.png", "tiles.png", "effects.png", "amulets.png"];
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
    } else if (file === "effects.png") {
      EFFECTS.forEach((name, row) => {
        for (let f = 0; f < FRAMES; f++) PNG.bitblt(readPng(spritePath("effects", name, f)), source, 0, 0, CELL, CELL, f * CELL, row * CELL);
      });
    } else {
      AMULET_ICONS.forEach((name, col) => PNG.bitblt(readPng(spritePath("amulets", name)), source, 0, 0, CELL, CELL, col * CELL, 0));
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
  const heroActions = {
    warrior: "attack",
    superwarrior: "attack",
    ultrawarrior: "attack",
    tank: "attack",
    crossknight: "attack",
    captain: "attack",
    max: "attack",
    shon: "attack",
    hori: "cast",
    priest: "heal",
    saint: "heal",
    mage: "cast",
    supermage: "cast",
    sage: "cast",
  };
  for (const name of Object.keys(heroActions)) {
    const action = heroActions[name];
    const d = diffRatio(actorFrame(name, "idle", "e", 1), actorFrame(name, action, "e", 2));
    if (d < 0.18) fail(name + " の " + action + " アクション差分が小さすぎます: " + d.toFixed(3));
  }
  ok("冒険者の職業別アクション差分を検査しました");
}

function validateDodgeActionDiff() {
  for (const name of ["max", "shon", "hori"]) {
    const d = diffRatio(actorFrame(name, "idle", "e", 1), actorFrame(name, "dodge", "e", 2));
    if (d < 0.12) fail(name + " の dodge アクション差分が小さすぎます: " + d.toFixed(3));
  }
  ok("回避アクション差分を検査しました");
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
  const pairs = [
    ["slime", "superslime"], ["slime", "crownslime"],
    ["carniv", "evolved"], ["carniv", "direfang"],
    ["spitter", "tarantula"], ["spitter", "goldweaver"],
    ["golem", "titan"], ["golem", "goldcore"],
    ["flame", "infernal"], ["flame", "whiteflame"],
  ];
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
function validateEggShapes() {
  const eggs = ACTORS.filter((n) => n.startsWith("egg_"));
  if (JSON.stringify(eggs) !== JSON.stringify(EXPECTED_EGG_ACTORS)) fail("卵アクターの種類が不正です: " + eggs.join(","));
  for (const name of eggs) {
    const img = actorFrame(name, "idle", "s", 1);
    const b = alphaBounds(img);
    const w = b.maxX - b.minX + 1;
    const h = b.maxY - b.minY + 1;
    if (b.count < 360) fail(name + " の卵が小さすぎます: " + b.count);
    if (w < 29 || w > 35 || h < 36 || h > 42 || h <= w + 2) fail(name + " の卵シルエットが不正です: " + w + "x" + h);
    if (eggMotifPixels(img) <= 20) fail(name + " の鉱脈マークが読みにくすぎます");
    if (["egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"].includes(name)) {
      if (eggGlowPixels(img) <= 8) fail(name + " の進化卵発光が弱すぎます");
    } else if (eggGlowPixels(img) !== 0) {
      fail(name + " は通常卵なのに外周発光があります");
    }
  }
  for (let i = 1; i < eggs.length; i++) {
    const d = diffRatio(actorFrame(eggs[i - 1], "idle", "s", 1), actorFrame(eggs[i], "idle", "s", 1));
    if (d < 0.08) fail(eggs[i - 1] + "/" + eggs[i] + " の卵色差分が小さすぎます: " + d.toFixed(3));
  }
  ok("モンスター別の卵シルエットと色差を検査しました");
}
function validateRichVeins() {
  const veins = ["moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo", "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2"];
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
    const evo2 = name.endsWith("_evo2");
    const evo = name.endsWith("_evo") || evo2;
    if (motif < (evo ? 420 : 95)) fail(name + " の鉱脈マークが単純すぎます: " + motif);
    if (motif > (evo2 ? 1320 : (evo ? 1160 : 620))) fail(name + " の鉱脈マークが複雑すぎます: " + motif);
    if (outside > (evo2 ? 700 : (evo ? 360 : 145))) fail(name + " の鉱脈マークが広がりすぎています: " + outside);
  }
  ok("鉱脈の種別マークと進化枠発光を検査しました");
}

function validateAmuletIcons() {
  const icons = AMULET_ICONS.map((name) => [name, readPng(spritePath("amulets", name))]);
  for (const [name, img] of icons) {
    const b = alphaBounds(img);
    const w = b.maxX - b.minX + 1;
    const h = b.maxY - b.minY + 1;
    if (b.count < 160) fail(name + " のお守りアイコンが小さすぎます: " + b.count);
    if (w < 20 || h < 20) fail(name + " のお守りアイコンのシルエットが小さすぎます: " + w + "x" + h);
    if (uniqueOpaqueColors(img) < 6) fail(name + " のお守りアイコン色数が少なすぎます");
  }
  for (let i = 0; i < icons.length; i++) {
    for (let j = i + 1; j < icons.length; j++) {
      const d = diffRatio(icons[i][1], icons[j][1]);
      if (d < 0.08) fail(icons[i][0] + "/" + icons[j][0] + " のお守りアイコン差分が小さすぎます: " + d.toFixed(3));
    }
  }
  ok("お守りアイコンのシルエットと差分を検査しました");
}

function validateNoCircleSyntax() {
  const build = fs.readFileSync(path.join("tools", "build_pixel_assets.js"), "utf8");
  const common = fs.readFileSync(path.join("tools", "pixel_asset_common.js"), "utf8");
  if (/\bring\s*\(/.test(build) || /function\s+ring\b/.test(common)) fail("円形囲み用の ring が残っています");
  ok("円形囲みヘルパーが残っていないことを検査しました");
}

function validateSelfMadeAssetPipeline() {
  const blockedPaths = [
    path.join(OUT_DIR, "third_party_assets.json"),
    path.join(OUT_DIR, "THIRD_PARTY_ASSETS.md"),
    path.join("assets", "external"),
  ];
  for (const file of blockedPaths) if (fs.existsSync(file)) fail("外部素材用ファイルが残っています: " + file);
  const build = fs.readFileSync(path.join("tools", "build_pixel_assets.js"), "utf8");
  const blockedTerms = ["readExternal", "actorSources", "tileSources", "third_party", "THIRD_PARTY", "assets/external", "dcss", "DCSS"];
  for (const term of blockedTerms) if (build.includes(term)) fail("生成スクリプトに外部素材参照が残っています: " + term);
  for (const name of TILES) {
    const colors = uniqueOpaqueColors(readPng(spritePath("tiles", name)));
    if (colors < 8) fail(name + " の自製タイル色数が少なすぎます: " + colors);
  }
  ok("外部素材に依存しない自製生成パイプラインを検査しました");
}

function validateNoLegacyAssetSources() {
  const sourceRoot = path.join(OUT_DIR, "source");
  const allowed = path.basename(SOURCE_DIR);
  if (!fs.existsSync(sourceRoot)) {
    fail("素材ソースディレクトリがありません: " + sourceRoot);
    return;
  }
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== allowed) fail("旧世代の生成素材ソースが残っています: " + path.join(sourceRoot, entry.name));
  }
  if (fs.existsSync(path.join(sourceRoot, "actors-source.png"))) fail("旧生成キャラクターシートが残っています");
  ok("旧世代の生成素材ソースがないことを検査しました");
}

(async () => {
  validateSource();
  validateMeta();
  validateAtlas();
  validateNoCircleSyntax();
  validateSelfMadeAssetPipeline();
  validateNoLegacyAssetSources();
  validateActorDirectionDiff();
  validateHeroActionDiff();
  validateDodgeActionDiff();
  validateElitePaletteVariants();
  validateEggShapes();
  validateRichVeins();
  validateAmuletIcons();
  await validateGeneratedDiff();
  if (failed) process.exit(1);
  console.log("ピクセル素材検査が完了しました。");
})().catch((err) => {
  console.error(err && (err.stack || err.message || err));
  process.exit(1);
});
