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
  ensureDir,
  image,
  writePng,
  readPng,
  copyInto,
} = require("./pixel_asset_common");

const MANIFEST_FILE = path.join(SOURCE_DIR, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
const sourceCache = new Map();
const actorPoseCache = new Map();
const actorFrameCache = new Map();
const eggCache = new Map();

function assertList(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} の順序がゲーム定義と一致しません。`);
  }
}

function validateManifest() {
  if (manifest.version !== "imagegen-v1") throw new Error("素材マニフェストの版が不正です。");
  assertList("アクター方向", manifest.layouts.actors.directions, ACTOR_RENDER_DIRECTIONS);
  assertList("アクターアクション", manifest.layouts.actors.actions, ACTIONS);
  assertList("卵", manifest.layouts.eggs.ids, ACTOR_SHEETS.eggs);
  assertList("通常タイル", manifest.layouts.environmentTiles.ids, TILES.slice(0, 5));
  assertList("エフェクト", manifest.layouts.effects.ids, EFFECTS);
  assertList("デバフ", manifest.layouts.debuffs.ids, DEBUFF_ICONS);
  assertList("会話立ち絵", manifest.layouts.dialogue.ids, DIALOGUE_PORTRAITS);
  assertList("アイテム", manifest.itemSheets.flatMap((sheet) => sheet.ids), ITEM_ICONS);
  for (const name of ACTORS) {
    if (name.startsWith("egg_")) continue;
    if (!manifest.actorSources[name] && !manifest.paletteVariants[name]) {
      throw new Error(`アクター ${name} のimagegen生成元がありません。`);
    }
  }
}

function sourcePath(relativePath) {
  return path.join(SOURCE_DIR, ...relativePath.split("/"));
}

function sourceImage(relativePath) {
  if (!sourceCache.has(relativePath)) {
    const file = sourcePath(relativePath);
    if (!fs.existsSync(file)) throw new Error(`imagegen生成画像がありません: ${file}`);
    sourceCache.set(relativePath, readPng(file));
  }
  return sourceCache.get(relativePath);
}

function crop(src, x, y, width, height) {
  const out = image(width, height);
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

function alphaBounds(src, threshold = 12) {
  let minX = src.width;
  let minY = src.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      if (src.data[(y * src.width + x) * 4 + 3] <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

function resizeNearest(src, width, height) {
  const out = image(width, height);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(src.height - 1, Math.floor(((y + 0.5) * src.height) / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(src.width - 1, Math.floor(((x + 0.5) * src.width) / width));
      const si = (sy * src.width + sx) * 4;
      const di = (y * width + x) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3] <= 8 ? 0 : src.data[si + 3];
    }
  }
  return out;
}

function normalizeTransparent(src, maxWidth = 42, maxHeight = 42, align = "bottom") {
  const bounds = alphaBounds(src);
  if (!bounds) throw new Error("imagegen生成画像のセルが空です。");
  const cropped = crop(
    src,
    bounds.minX,
    bounds.minY,
    bounds.maxX - bounds.minX + 1,
    bounds.maxY - bounds.minY + 1,
  );
  const scale = Math.min(maxWidth / cropped.width, maxHeight / cropped.height);
  const width = Math.max(1, Math.round(cropped.width * scale));
  const height = Math.max(1, Math.round(cropped.height * scale));
  const resized = resizeNearest(cropped, width, height);
  const out = image();
  const x = Math.round((CELL - width) / 2);
  const y = align === "bottom" ? CELL - height - 2 : Math.round((CELL - height) / 2);
  copyInto(out, resized, x, y);
  return out;
}

function normalizeTile(src) {
  const size = Math.min(src.width, src.height);
  const x = Math.floor((src.width - size) / 2);
  const y = Math.floor((src.height - size) / 2);
  return resizeNearest(crop(src, x, y, size, size), CELL, CELL);
}

function shifted(src, dx, dy) {
  const out = image();
  for (let y = 0; y < src.height; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= out.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= out.width) continue;
      const si = (y * src.width + x) * 4;
      const di = (ty * out.width + tx) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
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

function actorPose(baseName, action, direction) {
  const key = `${baseName}:${action}:${direction}`;
  if (!actorPoseCache.has(key)) {
    const file = manifest.actorSources[baseName];
    if (!file) throw new Error(`${baseName} のimagegenアクター画像がありません。`);
    const src = sourceImage(file);
    const column = ACTOR_RENDER_DIRECTIONS.indexOf(direction);
    const row = ACTIONS.indexOf(action);
    const cell = gridCell(src, column, row, manifest.layouts.actors.columns, manifest.layouts.actors.rows);
    actorPoseCache.set(key, normalizeTransparent(cell, 42, 42, "bottom"));
  }
  return actorPoseCache.get(key);
}

function baseActorFrame(baseName, action, direction, frame) {
  const key = `${baseName}:${action}:${direction}:${frame}`;
  if (!actorFrameCache.has(key)) {
    const [dx, dy] = frameOffset(action, direction, frame);
    actorFrameCache.set(key, shifted(actorPose(baseName, action, direction), dx, dy));
  }
  return actorFrameCache.get(key);
}

function parseHex(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function tintImage(src, tint, strength) {
  const target = parseHex(tint);
  const out = image(src.width, src.height);
  for (let i = 0; i < src.data.length; i += 4) {
    const alpha = src.data[i + 3];
    if (alpha === 0) continue;
    const luminance = (src.data[i] * 0.2126 + src.data[i + 1] * 0.7152 + src.data[i + 2] * 0.0722) / 255;
    const shade = 0.32 + luminance * 1.2;
    const highlight = Math.max(0, luminance - 0.72) / 0.28;
    for (const [offset, channel] of [[0, "r"], [1, "g"], [2, "b"]]) {
      const colored = Math.min(255, target[channel] * shade + 255 * highlight * 0.32);
      out.data[i + offset] = Math.round(src.data[i + offset] * (1 - strength) + colored * strength);
    }
    out.data[i + 3] = alpha;
  }
  return out;
}

function eggCell(name) {
  if (!eggCache.has(name)) {
    const layout = manifest.layouts.eggs;
    const index = layout.ids.indexOf(name);
    const cell = gridCell(
      sourceImage(layout.file),
      index % layout.columns,
      Math.floor(index / layout.columns),
      layout.columns,
      layout.rows,
    );
    eggCache.set(name, normalizeTransparent(cell, 40, 42, "bottom"));
  }
  return eggCache.get(name);
}

function actorFrame(name, action, direction, frame) {
  if (name.startsWith("egg_")) {
    const [dx, dy] = frameOffset("idle", direction, frame);
    return shifted(eggCell(name), dx, dy);
  }
  const variant = manifest.paletteVariants[name];
  const base = variant ? variant.base : name;
  const rendered = baseActorFrame(base, action, direction, frame);
  return variant ? tintImage(rendered, variant.tint, variant.strength) : rendered;
}

function actorAtlasPosition(actorRow, actionIndex, directionIndex, frame) {
  const frameInActor =
    (actionIndex * ACTOR_RENDER_DIRECTIONS.length + directionIndex) * FRAMES + frame;
  const atlasFrame = actorRow * ACTOR_FRAMES_PER_ACTOR + frameInActor;
  return {
    x: (atlasFrame % ACTOR_ATLAS_COLUMNS) * CELL,
    y: Math.floor(atlasFrame / ACTOR_ATLAS_COLUMNS) * CELL,
  };
}

function writeActorAtlases() {
  for (const [sheet, names] of Object.entries(ACTOR_SHEETS)) {
    const atlas = image(
      CELL * ACTOR_ATLAS_COLUMNS,
      CELL * names.length * ACTOR_ATLAS_ROWS_PER_ACTOR,
    );
    names.forEach((name, row) => {
      ACTIONS.forEach((action, actionIndex) => {
        ACTOR_RENDER_DIRECTIONS.forEach((direction, directionIndex) => {
          for (let frame = 0; frame < FRAMES; frame++) {
            const position = actorAtlasPosition(row, actionIndex, directionIndex, frame);
            copyInto(
              atlas,
              actorFrame(name, action, direction, frame),
              position.x,
              position.y,
            );
          }
        });
      });
    });
    writePng(path.join(OUT_DIR, `actor_${sheet}.png`), atlas);
  }
}

function writeTileAtlas() {
  const atlas = image(CELL * TILES.length, CELL);
  const environment = manifest.layouts.environmentTiles;
  const environmentSource = sourceImage(environment.file);
  environment.ids.forEach((name, index) => {
    const tile = normalizeTile(gridCell(environmentSource, index, 0, environment.columns, environment.rows));
    copyInto(atlas, tile, TILES.indexOf(name) * CELL, 0);
  });

  const veins = manifest.layouts.veinTiles;
  const veinSource = sourceImage(veins.file);
  veins.kinds.forEach((kind, row) => {
    veins.levels.forEach((level, column) => {
      const name = level === "normal" ? kind : `${kind}_${level}`;
      const tile = normalizeTile(gridCell(veinSource, column, row, veins.columns, veins.rows));
      copyInto(atlas, tile, TILES.indexOf(name) * CELL, 0);
    });
  });
  writePng(path.join(OUT_DIR, "tiles.png"), atlas);
}

function writeEffectAtlas() {
  const layout = manifest.layouts.effects;
  const src = sourceImage(layout.file);
  const atlas = image(CELL * FRAMES, CELL * EFFECTS.length);
  EFFECTS.forEach((name, row) => {
    for (let frame = 0; frame < FRAMES; frame++) {
      const effect = normalizeTransparent(
        gridCell(src, frame, row, layout.columns, layout.rows),
        44,
        44,
        "center",
      );
      copyInto(atlas, effect, frame * CELL, row * CELL);
    }
  });
  writePng(path.join(OUT_DIR, "effects.png"), atlas);
}

function writeItemAtlas() {
  const cells = new Map();
  for (const layout of manifest.itemSheets) {
    const src = sourceImage(layout.file);
    layout.ids.forEach((name, index) => {
      const cell = gridCell(
        src,
        index % layout.columns,
        Math.floor(index / layout.columns),
        layout.columns,
        layout.rows,
      );
      cells.set(name, normalizeTransparent(cell, 42, 42, "center"));
    });
  }
  const atlas = image(CELL * ITEM_ICONS.length, CELL);
  ITEM_ICONS.forEach((name, column) => copyInto(atlas, cells.get(name), column * CELL, 0));
  writePng(path.join(OUT_DIR, "items.png"), atlas);
}

function writeSingleRowAtlas(layout, ids, filename, maxSize) {
  const src = sourceImage(layout.file);
  const atlas = image(CELL * ids.length, CELL);
  ids.forEach((name, column) => {
    const index = layout.ids.indexOf(name);
    const cell = gridCell(
      src,
      index % layout.columns,
      Math.floor(index / layout.columns),
      layout.columns,
      layout.rows,
    );
    copyInto(atlas, normalizeTransparent(cell, maxSize, maxSize, "center"), column * CELL, 0);
  });
  writePng(path.join(OUT_DIR, filename), atlas);
}

function writeMeta() {
  const meta = {
    sourceVersion: manifest.version,
    generator: manifest.generator.tool,
    cell: CELL,
    frames: FRAMES,
    directions: DIRECTIONS,
    renderDirections: ACTOR_RENDER_DIRECTIONS,
    actions: ACTIONS,
    actorFramesPerActor: ACTOR_FRAMES_PER_ACTOR,
    actorAtlasColumns: ACTOR_ATLAS_COLUMNS,
    actorAtlasRowsPerActor: ACTOR_ATLAS_ROWS_PER_ACTOR,
    actorSheets: ACTOR_SHEETS,
    actors: {},
    tiles: {},
    effects: {},
    items: {},
    debuffs: {},
    dialogue: {},
  };
  ACTORS.forEach((name) => {
    let sheet = "moss_slime";
    let row = 0;
    for (const [key, names] of Object.entries(ACTOR_SHEETS)) {
      const index = names.indexOf(name);
      if (index < 0) continue;
      sheet = key;
      row = index;
      break;
    }
    meta.actors[name] = {
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
  });
  TILES.forEach((name, column) => {
    meta.tiles[name] = { sheet: "tiles", x: column * CELL, y: 0, w: CELL, h: CELL };
  });
  EFFECTS.forEach((name, row) => {
    meta.effects[name] = {
      sheet: "effects",
      x: 0,
      y: row * CELL,
      w: CELL,
      h: CELL,
      frames: FRAMES,
      anchor: [CELL / 2, CELL / 2],
    };
  });
  ITEM_ICONS.forEach((name, column) => {
    meta.items[name] = {
      sheet: "items",
      x: column * CELL,
      y: 0,
      w: CELL,
      h: CELL,
      anchor: [CELL / 2, CELL / 2],
    };
  });
  DEBUFF_ICONS.forEach((name, column) => {
    meta.debuffs[name] = {
      sheet: "debuffs",
      x: column * CELL,
      y: 0,
      w: CELL,
      h: CELL,
      anchor: [CELL / 2, CELL / 2],
    };
  });
  DIALOGUE_PORTRAITS.forEach((name, column) => {
    meta.dialogue[name] = {
      sheet: "dialogue_portraits",
      x: column * CELL,
      y: 0,
      w: CELL,
      h: CELL,
      anchor: [CELL / 2, CELL / 2],
    };
  });
  fs.writeFileSync(path.join(OUT_DIR, "sprites.json"), JSON.stringify(meta, null, 2) + "\n");
}

function build() {
  validateManifest();
  ensureDir(OUT_DIR);
  writeActorAtlases();
  writeTileAtlas();
  writeEffectAtlas();
  writeItemAtlas();
  writeSingleRowAtlas(manifest.layouts.debuffs, DEBUFF_ICONS, "debuffs.png", 42);
  writeSingleRowAtlas(manifest.layouts.dialogue, DIALOGUE_PORTRAITS, "dialogue_portraits.png", 46);
  writeMeta();
  console.log("imagegen生成画像から48pxピクセル素材アトラスを構築しました。");
}

build();
