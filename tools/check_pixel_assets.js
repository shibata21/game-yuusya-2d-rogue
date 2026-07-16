"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const {
  CELL,
  FRAMES,
  DIRECTIONS,
  ACTOR_RENDER_DIRECTIONS,
  ACTIONS,
  ACTOR_FRAMES_PER_ACTOR,
  ACTOR_ATLAS_COLUMNS,
  ACTOR_ATLAS_ROWS_PER_ACTOR,
  OUT_DIR,
  SOURCE_DIR,
  ACTORS,
  ACTOR_SHEETS,
  TILES,
  EFFECTS,
  ITEM_ICONS,
  DEBUFF_ICONS,
  DIALOGUE_PORTRAITS,
  readPng,
} = require("./pixel_asset_common");

const manifestFile = path.join(SOURCE_DIR, "manifest.json");
const EGG_SOIL_PATTERN_COLUMNS = ["venom", "stone", "ember"];
const EGG_SOIL_PATTERN_ROWS = ["normal", "evo", "evo2"];
let failed = false;

function fail(message) {
  failed = true;
  console.error("NG: " + message);
}

function ok(message) {
  console.log("OK: " + message);
}

function sameList(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function opaqueCount(img) {
  let count = 0;
  for (let i = 3; i < img.data.length; i += 4) {
    if (img.data[i] > 12) count++;
  }
  return count;
}

function alphaBounds(img) {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] <= 12) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < minX ? null : { minX, minY, maxX, maxY };
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

function uniqueColors(img) {
  const colors = new Set();
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] <= 12) continue;
    colors.add(`${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`);
  }
  return colors.size;
}

function crop(src, x, y, width = CELL, height = CELL) {
  const out = new PNG({ width, height });
  PNG.bitblt(src, out, x, y, width, height, 0, 0);
  return out;
}

function gridCell(src, column, row, columns, rows) {
  const x0 = Math.round((column * src.width) / columns);
  const x1 = Math.round(((column + 1) * src.width) / columns);
  const y0 = Math.round((row * src.height) / rows);
  const y1 = Math.round(((row + 1) * src.height) / rows);
  return crop(src, x0, y0, x1 - x0, y1 - y0);
}

function luminance(img, x, y) {
  const i = (y * img.width + x) * 4;
  return img.data[i] * 0.2126 + img.data[i + 1] * 0.7152 + img.data[i + 2] * 0.0722;
}

function tileEdgeRatio(tile, side) {
  let edge = 0;
  let inner = 0;
  for (let n = 0; n < CELL; n++) {
    if (side === "left") {
      edge += luminance(tile, 0, n);
      inner += luminance(tile, 2, n);
    } else if (side === "right") {
      edge += luminance(tile, CELL - 1, n);
      inner += luminance(tile, CELL - 3, n);
    } else if (side === "top") {
      edge += luminance(tile, n, 0);
      inner += luminance(tile, n, 2);
    } else {
      edge += luminance(tile, n, CELL - 1);
      inner += luminance(tile, n, CELL - 3);
    }
  }
  return edge / Math.max(1, inner);
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

function imageHash(img) {
  let hash = 2166136261;
  for (const value of img.data) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function validatePng(file, width, height) {
  if (!fs.existsSync(file)) {
    fail("ファイルがありません: " + file);
    return null;
  }
  const img = readPng(file);
  if (img.width !== width || img.height !== height) {
    fail(`${file} の寸法が不正です: ${img.width}x${img.height} expected ${width}x${height}`);
  }
  if (opaqueCount(img) === 0) fail("透明だけの画像です: " + file);
  return img;
}

function sourceFile(relativePath) {
  return path.join(SOURCE_DIR, ...relativePath.split("/"));
}

function validateSourceGrid(relativePath, columns, rows, label) {
  const file = sourceFile(relativePath);
  if (!fs.existsSync(file)) {
    fail(`imagegen生成元がありません: ${file}`);
    return;
  }
  const img = readPng(file);
  if (img.width < columns * CELL || img.height < rows * CELL) {
    fail(`${label} の生成元解像度が不足しています: ${img.width}x${img.height}`);
  }
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cell = gridCell(img, column, row, columns, rows);
      if (opaqueCount(cell) < 24) fail(`${label} のセルが空です: ${column},${row}`);
    }
  }
}

function validateActorPoseOverride(relativePath, label) {
  const file = sourceFile(relativePath);
  if (!fs.existsSync(file)) {
    fail(`個別ポーズ生成元がありません: ${file}`);
    return;
  }
  const img = readPng(file);
  const corners = [0, img.width - 1, (img.height - 1) * img.width, img.width * img.height - 1];
  if (img.width < CELL || img.height < CELL || opaqueCount(img) < 24) {
    fail(`${label} の個別ポーズ画像が不正です`);
  }
  if (!corners.every((pixel) => img.data[pixel * 4 + 3] <= 12)) {
    fail(`${label} の個別ポーズ背景が透過されていません`);
  }
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 12 && img.data[i] > 240 && img.data[i + 1] < 16 && img.data[i + 2] > 240) {
      fail(`${label} の個別ポーズにマゼンタ背景が残っています`);
      break;
    }
  }
}

function validateTransparentSource(relativePath, label) {
  const file = sourceFile(relativePath);
  if (!fs.existsSync(file)) return;
  const img = readPng(file);
  const corners = [0, img.width - 1, (img.height - 1) * img.width, img.width * img.height - 1];
  if (!corners.every((pixel) => img.data[pixel * 4 + 3] <= 12)) {
    fail(`${label} の背景が透過されていません`);
  }
  if (opaqueEdgeCount(img) > 0) fail(`${label} の不透明領域が外周へ接触しています`);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 12 && img.data[i] > 240 && img.data[i + 1] < 16 && img.data[i + 2] > 240) {
      fail(`${label} にマゼンタ背景が残っています`);
      break;
    }
  }
}

function validateImagegenSource(manifest) {
  if (manifest.version !== "imagegen-v1") fail("素材マニフェストの版が不正です");
  if (!String(manifest.generator?.tool || "").toLowerCase().includes("imagegen")) {
    fail("素材生成ツールがimagegenとして記録されていません");
  }
  const policy = String(manifest.generator?.policy || "");
  if (!policy.includes("代替せず") || !policy.includes("報告")) {
    fail("imagegen利用不能時の代替禁止・報告方針が記録されていません");
  }
  if (!fs.existsSync(sourceFile(manifest.generator.styleReference))) {
    fail("imagegen画風参照画像がありません");
  }

  const actorLayout = manifest.layouts.actors;
  if (!sameList(actorLayout.directions, ACTOR_RENDER_DIRECTIONS)) fail("生成元の方向順が不正です");
  if (!sameList(actorLayout.actions, ACTIONS)) fail("生成元のアクション順が不正です");
  for (const [label, layout, expectedTrim] of [
    ["通常タイル", manifest.layouts.environmentTiles, 0.03],
    ["鉱脈タイル", manifest.layouts.veinTiles, 0.05],
  ]) {
    if (!Number.isFinite(layout.trimRatio) || layout.trimRatio !== expectedTrim) {
      fail(`${label} のセル境界トリム率が不正です`);
    }
  }
  for (const [name, file] of Object.entries(manifest.actorSources)) {
    validateSourceGrid(file, actorLayout.columns, actorLayout.rows, `アクター ${name}`);
  }
  const transforms = manifest.actorSourceFlipX;
  const sourceNames = Object.keys(manifest.actorSources);
  if (!transforms || !sameList(Object.keys(transforms), sourceNames)) {
    fail("アクター方向補正が全生成元を網羅していません");
  } else {
    for (const [name, directions] of Object.entries(transforms)) {
      if (!directions || Array.isArray(directions)) {
        fail(`${name} の方向補正形式が不正です`);
        continue;
      }
      for (const [direction, actions] of Object.entries(directions)) {
        if (!ACTOR_RENDER_DIRECTIONS.includes(direction) || !Array.isArray(actions) || actions.length === 0) {
          fail(`${name}:${direction} の方向補正が不正です`);
          continue;
        }
        if (actions.includes("*") && actions.length !== 1) fail(`${name}:${direction} の全アクション指定が重複しています`);
        if (!actions.includes("*") && actions.some((action) => !ACTIONS.includes(action))) {
          fail(`${name}:${direction} のアクション補正が不正です`);
        }
        if (new Set(actions).size !== actions.length) fail(`${name}:${direction} のアクション補正が重複しています`);
      }
    }
  }
  const overrides = manifest.actorPoseOverrides || {};
  if (!overrides || Array.isArray(overrides)) {
    fail("アクター個別ポーズの形式が不正です");
  } else {
    for (const [name, directions] of Object.entries(overrides)) {
      if (!Object.prototype.hasOwnProperty.call(manifest.actorSources, name)) {
        fail(`${name} の個別ポーズは直接生成元のアクターだけに指定できます`);
        continue;
      }
      if (!directions || Array.isArray(directions)) {
        fail(`${name} の個別ポーズ方向が不正です`);
        continue;
      }
      for (const [direction, actions] of Object.entries(directions)) {
        if (!ACTOR_RENDER_DIRECTIONS.includes(direction) || !actions || Array.isArray(actions)) {
          fail(`${name}:${direction} の個別ポーズが不正です`);
          continue;
        }
        for (const [action, file] of Object.entries(actions)) {
          if (!ACTIONS.includes(action) || typeof file !== "string" || file.length === 0) {
            fail(`${name}:${direction}:${action} の個別ポーズ指定が不正です`);
            continue;
          }
          validateActorPoseOverride(file, `${name}:${direction}:${action}`);
        }
      }
    }
  }

  const gridLayouts = [
    ["卵", manifest.layouts.eggs],
    ["通常タイル", manifest.layouts.environmentTiles],
    ["鉱脈タイル", manifest.layouts.veinTiles],
    ["エフェクト", manifest.layouts.effects],
    ["デバフ", manifest.layouts.debuffs],
    ["会話立ち絵", manifest.layouts.dialogue],
  ];
  for (const [label, layout] of gridLayouts) {
    validateSourceGrid(layout.file, layout.columns, layout.rows, label);
  }
  for (const [index, layout] of manifest.itemSheets.entries()) {
    validateSourceGrid(layout.file, layout.columns, layout.rows, `アイテムシート${index + 1}`);
    validateTransparentSource(layout.file, `アイテムシート${index + 1}`);
    if (layout.columns !== 1 || layout.rows !== 1 || layout.ids.length !== 1) {
      fail(`アイテムシート${index + 1} は1画像1装備である必要があります`);
    }
  }

  if (!sameList(manifest.layouts.eggs.ids, ACTOR_SHEETS.eggs)) fail("卵の順序が不正です");
  if (!sameList(manifest.layouts.eggs.soilPatternColumns, EGG_SOIL_PATTERN_COLUMNS)) {
    fail("卵の土壌種別順が不正です");
  }
  if (!sameList(manifest.layouts.eggs.soilPatternRows, EGG_SOIL_PATTERN_ROWS)) {
    fail("卵の進化段階順が不正です");
  }
  const eggSoilPatterns = EGG_SOIL_PATTERN_ROWS.flatMap((level) =>
    EGG_SOIL_PATTERN_COLUMNS.map((kind) => level === "normal" ? kind : `${kind}_${level}`),
  );
  if (!sameList(manifest.layouts.eggs.soilPatternSources, eggSoilPatterns)) {
    fail("卵の土壌模様対応が不正です");
  }
  if (!sameList(manifest.layouts.environmentTiles.ids, TILES.slice(0, 5))) fail("通常タイルの順序が不正です");
  if (!sameList(manifest.layouts.effects.ids, EFFECTS)) fail("エフェクトの順序が不正です");
  if (!sameList(manifest.layouts.debuffs.ids, DEBUFF_ICONS)) fail("デバフの順序が不正です");
  if (!sameList(manifest.layouts.dialogue.ids, DIALOGUE_PORTRAITS)) fail("会話立ち絵の順序が不正です");
  if (!sameList(manifest.itemSheets.flatMap((sheet) => sheet.ids), ITEM_ICONS)) fail("アイテムの順序が不正です");

  for (const actor of ACTORS) {
    if (actor.startsWith("egg_")) continue;
    if (!manifest.actorSources[actor]) {
      fail(`${actor} のimagegen生成元対応がありません`);
    }
  }
  const directActors = ACTORS.filter((actor) => !actor.startsWith("egg_"));
  const directSourceNames = Object.keys(manifest.actorSources);
  if (directSourceNames.length !== directActors.length || directActors.some((actor) => !directSourceNames.includes(actor))) {
    fail("全アクターが独立したimagegen原画へ対応していません");
  }
  if (Object.keys(manifest.paletteVariants || {}).length !== 0) {
    fail("旧色違い進化定義が残っています");
  }
  if (Object.keys(manifest.actorPoseOverrides || {}).length !== 0) {
    fail("旧アクター個別ポーズ差し替えが残っています");
  }
  ok("imagegen生成元とマニフェストを検査しました");
}

function validateMeta(manifest) {
  const file = path.join(OUT_DIR, "sprites.json");
  if (!fs.existsSync(file)) {
    fail("sprites.json がありません");
    return;
  }
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  if (meta.sourceVersion !== manifest.version) fail("sprites.json の生成元版が不正です");
  if (!String(meta.generator || "").toLowerCase().includes("imagegen")) fail("sprites.json の生成ツールが不正です");
  if (meta.cell !== CELL || meta.frames !== FRAMES) fail("sprites.json のセル仕様が不正です");
  if (!sameList(meta.directions, DIRECTIONS)) fail("sprites.json の方向順が不正です");
  if (!sameList(meta.renderDirections, ACTOR_RENDER_DIRECTIONS)) fail("sprites.json の描画方向順が不正です");
  if (!sameList(meta.actions, ACTIONS)) fail("sprites.json のアクション順が不正です");
  if (meta.actorFramesPerActor !== ACTOR_FRAMES_PER_ACTOR) fail("sprites.json のアクター総フレーム数が不正です");
  if (meta.actorAtlasColumns !== ACTOR_ATLAS_COLUMNS) fail("sprites.json のアクターアトラス列数が不正です");
  if (meta.actorAtlasRowsPerActor !== ACTOR_ATLAS_ROWS_PER_ACTOR) fail("sprites.json のアクター段数が不正です");
  if (!sameList(meta.actorSheets, ACTOR_SHEETS)) fail("sprites.json のアクターシート定義が不正です");
  if (!sameList(Object.keys(meta.actors), ACTORS)) fail("sprites.json のアクター順が不正です");
  if (!sameList(Object.keys(meta.tiles), TILES)) fail("sprites.json のタイル順が不正です");
  if (!sameList(Object.keys(meta.effects), EFFECTS)) fail("sprites.json のエフェクト順が不正です");
  if (!sameList(Object.keys(meta.items), ITEM_ICONS)) fail("sprites.json のアイテム順が不正です");
  if (!sameList(Object.keys(meta.debuffs), DEBUFF_ICONS)) fail("sprites.json のデバフ順が不正です");
  if (!sameList(Object.keys(meta.dialogue), DIALOGUE_PORTRAITS)) fail("sprites.json の会話立ち絵順が不正です");
  for (const actor of ACTORS) {
    const { sheet, row } = actorLocation(actor);
    const expected = {
      sheet: `actor_${sheet}`,
      x: 0,
      y: row * ACTOR_ATLAS_ROWS_PER_ACTOR * CELL,
      w: CELL,
      h: CELL,
      frames: FRAMES,
      directions: ACTOR_RENDER_DIRECTIONS.length,
      actions: ACTIONS.length,
      anchor: [CELL / 2, Math.round(CELL * 0.75)],
    };
    if (!sameList(meta.actors[actor], expected)) fail(`${actor} のアクターメタデータが不正です`);
  }
  const directActors = ACTORS.filter((actor) => !actor.startsWith("egg_"));
  const normalizationNames = Object.keys(meta.actorNormalization || {});
  if (normalizationNames.length !== directActors.length || directActors.some((actor) => !normalizationNames.includes(actor))) {
    fail("sprites.json のアクター共通正規化情報が不足しています");
  }
  for (const actor of directActors) {
    const row = meta.actorNormalization?.[actor];
    if (!row) continue;
    if (!Number.isFinite(row.scale) || row.scale <= 0) fail(`${actor} の共通倍率が不正です`);
    if (row.targetCenterX !== CELL / 2 || row.targetFootY !== 45) fail(`${actor} の中心・足元基準が不正です`);
    if (!Number.isFinite(row.minEffectScale) || row.minEffectScale <= 0 || row.minEffectScale > 1) {
      fail(`${actor} のエフェクト倍率が不正です`);
    }
    if (row.sourceComponents <= 0 || row.assignedComponents !== row.sourceComponents) {
      fail(`${actor} の原画成分に未割当があります`);
    }
  }
  ok("sprites.json を検査しました");
}

const actorAtlases = new Map();

function actorLocation(name) {
  for (const [sheet, names] of Object.entries(ACTOR_SHEETS)) {
    const row = names.indexOf(name);
    if (row >= 0) return { sheet, row };
  }
  throw new Error(`アクター ${name} のシートがありません`);
}

function actorFrame(name, action, direction, frame) {
  const { sheet, row } = actorLocation(name);
  const atlas = actorAtlases.get(sheet);
  const actionIndex = ACTIONS.indexOf(action);
  const directionIndex = ACTOR_RENDER_DIRECTIONS.indexOf(direction);
  const frameInActor = (actionIndex * ACTOR_RENDER_DIRECTIONS.length + directionIndex) * FRAMES + frame;
  const atlasFrame = row * ACTOR_FRAMES_PER_ACTOR + frameInActor;
  const x = (atlasFrame % ACTOR_ATLAS_COLUMNS) * CELL;
  const y = Math.floor(atlasFrame / ACTOR_ATLAS_COLUMNS) * CELL;
  return crop(atlas, x, y);
}

function validateAtlases() {
  if (fs.existsSync(path.join(OUT_DIR, "actors.png"))) fail("旧単一アクターシートが残っています");
  for (const [sheet, names] of Object.entries(ACTOR_SHEETS)) {
    const atlas = validatePng(
      path.join(OUT_DIR, `actor_${sheet}.png`),
      CELL * ACTOR_ATLAS_COLUMNS,
      CELL * names.length * ACTOR_ATLAS_ROWS_PER_ACTOR,
    );
    if (atlas && (atlas.width > 4096 || atlas.height > 4096)) {
      fail(`actor_${sheet}.png がモバイル向け上限4096pxを超えています: ${atlas.width}x${atlas.height}`);
    }
    if (atlas) actorAtlases.set(sheet, atlas);
  }
  const tiles = validatePng(path.join(OUT_DIR, "tiles.png"), CELL * TILES.length, CELL);
  const effects = validatePng(path.join(OUT_DIR, "effects.png"), CELL * FRAMES, CELL * EFFECTS.length);
  const items = validatePng(path.join(OUT_DIR, "items.png"), CELL * ITEM_ICONS.length, CELL);
  const debuffs = validatePng(path.join(OUT_DIR, "debuffs.png"), CELL * DEBUFF_ICONS.length, CELL);
  const dialogue = validatePng(path.join(OUT_DIR, "dialogue_portraits.png"), CELL * DIALOGUE_PORTRAITS.length, CELL);

  for (const name of ACTORS) {
    for (const action of ACTIONS) {
      for (const direction of ACTOR_RENDER_DIRECTIONS) {
        const hashes = new Set();
        for (let frame = 0; frame < FRAMES; frame++) {
          const sprite = actorFrame(name, action, direction, frame);
          if (opaqueCount(sprite) < 20) fail(`${name}:${action}:${direction}:${frame} が空です`);
          if (opaqueEdgeCount(sprite) !== 0) fail(`${name}:${action}:${direction}:${frame} がセル外周へ接触しています`);
          hashes.add(imageHash(sprite));
        }
        if (hashes.size < 3) fail(`${name}:${action}:${direction} の4フレーム差分が不足しています`);
      }
    }
  }

  for (const name of ACTORS.filter((actor) => !actor.startsWith("egg_"))) {
    const idleBounds = ACTOR_RENDER_DIRECTIONS.map((direction) => alphaBounds(actorFrame(name, "idle", direction, 0)));
    const sizes = idleBounds.map((bounds) => Math.max(bounds.maxX - bounds.minX + 1, bounds.maxY - bounds.minY + 1));
    const centers = idleBounds.map((bounds) => (bounds.minX + bounds.maxX) / 2);
    const feet = idleBounds.map((bounds) => bounds.maxY);
    if (Math.min(...sizes) < 20 || Math.max(...sizes) > 40 || Math.max(...sizes) / Math.min(...sizes) > 1.75) {
      fail(`${name} の待機本体占有サイズが不安定です: ${Math.min(...sizes)}-${Math.max(...sizes)}`);
    }
    if (Math.min(...centers) < 22 || Math.max(...centers) > 26 || Math.max(...centers) - Math.min(...centers) > 3) {
      fail(`${name} の待機本体中心が不安定です: ${Math.min(...centers)}-${Math.max(...centers)}`);
    }
    if (Math.min(...feet) < 42 || Math.max(...feet) > 45 || Math.max(...feet) - Math.min(...feet) > 2) {
      fail(`${name} の待機本体足元が不安定です: ${Math.min(...feet)}-${Math.max(...feet)}`);
    }
  }
  for (const name of ACTORS) {
    const feet = ACTOR_RENDER_DIRECTIONS.map((direction) => alphaBounds(actorFrame(name, "idle", direction, 0)).maxY);
    if (Math.min(...feet) !== 44 || Math.max(...feet) !== 44) {
      fail(`${name} の共通足元安全境界が不正です: ${Math.min(...feet)}-${Math.max(...feet)}`);
    }
  }

  TILES.forEach((name, column) => {
    const tile = crop(tiles, column * CELL, 0);
    if (opaqueCount(tile) < CELL * CELL * 0.95) fail(`タイル ${name} に透明部が多すぎます`);
    if (uniqueColors(tile) < 8) fail(`タイル ${name} の色数が不足しています`);
  });
  const seamSensitiveTiles = [
    "earth", "tunnel", "bedrock",
    "moss", "meat", "venom", "stone", "ember",
    "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo",
    "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2",
  ];
  for (const name of seamSensitiveTiles) {
    const tile = crop(tiles, TILES.indexOf(name) * CELL, 0);
    for (const side of ["left", "right", "top", "bottom"]) {
      const ratio = tileEdgeRatio(tile, side);
      if (ratio < 0.55 || ratio > 1.8) {
        fail(`タイル ${name}:${side} に原画セル境界が混入しています: ${ratio.toFixed(2)}`);
      }
    }
  }
  EFFECTS.forEach((name, row) => {
    for (let frame = 0; frame < FRAMES; frame++) {
      if (opaqueCount(crop(effects, frame * CELL, row * CELL)) < 8) fail(`エフェクト ${name}:${frame} が空です`);
    }
  });
  ITEM_ICONS.forEach((name, column) => {
    const icon = crop(items, column * CELL, 0);
    if (opaqueCount(icon) < 60 || uniqueColors(icon) < 8) fail(`アイテム ${name} の情報量が不足しています`);
  });
  DEBUFF_ICONS.forEach((name, column) => {
    if (opaqueCount(crop(debuffs, column * CELL, 0)) < 60) fail(`デバフ ${name} が空です`);
  });
  DIALOGUE_PORTRAITS.forEach((name, column) => {
    if (opaqueCount(crop(dialogue, column * CELL, 0)) < 180) fail(`会話立ち絵 ${name} が小さすぎます`);
  });
  ok("アトラス寸法・セル内容・4フレームを検査しました");
  return { tiles, items, dialogue };
}

function validateActorVariety(manifest) {
  const directActors = Object.keys(manifest.actorSources);
  for (const name of directActors) {
    const directions = new Set(
      ACTOR_RENDER_DIRECTIONS.map((direction) => imageHash(actorFrame(name, "idle", direction, 1))),
    );
    if (directions.size < 4) fail(`${name} の方向差分が不足しています`);
    const actions = new Set(ACTIONS.map((action) => imageHash(actorFrame(name, action, "s", 1))));
    if (actions.size < 6) fail(`${name} のアクション差分が不足しています`);
  }

  const heroHashes = new Set(ACTOR_SHEETS.heroes.map((name) => imageHash(actorFrame(name, "idle", "s", 1))));
  if (heroHashes.size !== ACTOR_SHEETS.heroes.length) fail("勇者の職業別画像が重複しています");
  ok("アクターの方向・アクション・職業差分を検査しました");
}

function validateIndependentEvolutions(manifest) {
  if (Object.keys(manifest.paletteVariants || {}).length !== 0) return;
  for (const [sheet, names] of Object.entries(ACTOR_SHEETS)) {
    if (names.length !== 3 || sheet === "eggs") continue;
    for (const [leftIndex, rightIndex] of [[0, 1], [0, 2], [1, 2]]) {
      const left = names[leftIndex];
      const right = names[rightIndex];
      const differences = ACTOR_RENDER_DIRECTIONS.map((direction) => alphaJaccardDiff(
        actorFrame(left, "idle", direction, 1),
        actorFrame(right, "idle", direction, 1),
      ));
      const average = differences.reduce((sum, value) => sum + value, 0) / differences.length;
      if (average <= 0.04) fail(`${left}/${right} の独立形状差が不足しています: ${average.toFixed(3)}`);
    }
  }
  ok("第一・第二進化の独立原画と形状差を検査しました");
}

function validateAtlasVariety(tiles, items, dialogue) {
  const tileHashes = new Set(TILES.map((_, column) => imageHash(crop(tiles, column * CELL, 0))));
  if (tileHashes.size !== TILES.length) fail("タイル画像が重複しています");

  const itemHashes = new Set(ITEM_ICONS.map((_, column) => imageHash(crop(items, column * CELL, 0))));
  if (itemHashes.size !== ITEM_ICONS.length) fail("アイテム画像が重複しています");

  const portraitDiff = diffStats(crop(dialogue, 0, 0), crop(dialogue, CELL, 0));
  if (portraitDiff.colorRatio < 0.3) fail("会話立ち絵の差分が不足しています");
  ok("タイル・アイテム・会話立ち絵の固有性を検査しました");
}

function validatePipelinePolicy() {
  const build = fs.readFileSync(path.join("tools", "build_pixel_assets.js"), "utf8");
  const common = fs.readFileSync(path.join("tools", "pixel_asset_common.js"), "utf8");
  const drawingPatterns = [
    /function\s+(rect|line|tri|diamond|oval|ring)\b/,
    /function\s+draw[A-Z]/,
    /setPx\s*\(/,
  ];
  for (const pattern of drawingPatterns) {
    if (pattern.test(build) || pattern.test(common)) fail("JSによる手続き描画処理が残っています: " + pattern);
  }
  if (!build.includes("manifest.json") || !build.includes("readPng")) {
    fail("生成済みimagegen画像を読むアトラス構築処理になっていません");
  }
  const blocked = [
    path.join(OUT_DIR, "third_party_assets.json"),
    path.join(OUT_DIR, "THIRD_PARTY_ASSETS.md"),
    path.join("assets", "external"),
  ];
  for (const file of blocked) {
    if (fs.existsSync(file)) fail("外部素材用ファイルが残っています: " + file);
  }
  ok("imagegen画像専用のアトラス構築処理を検査しました");
}

function validateSourceRoots() {
  const root = path.join(OUT_DIR, "source");
  const allowedDirectories = new Set(["imagegen-v1", "legacy-v6-self-made"]);
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && !allowedDirectories.has(entry.name)) {
      fail("不明な素材ソースディレクトリがあります: " + entry.name);
    }
    if (entry.isFile()) fail("素材ソース直下に旧ファイルが残っています: " + entry.name);
  }
  ok("現行imagegen素材と旧素材の退避先を検査しました");
}

function main() {
  if (!fs.existsSync(manifestFile)) {
    fail("imagegen素材マニフェストがありません");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  validateImagegenSource(manifest);
  validateMeta(manifest);
  const atlases = validateAtlases();
  validateActorVariety(manifest);
  validateIndependentEvolutions(manifest);
  validateAtlasVariety(atlases.tiles, atlases.items, atlases.dialogue);
  validatePipelinePolicy();
  validateSourceRoots();
  if (failed) process.exit(1);
  console.log("imagegenピクセル素材検査が完了しました。");
}

main();
