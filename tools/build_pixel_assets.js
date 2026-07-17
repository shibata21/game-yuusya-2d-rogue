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
  SOIL_ALGAE_STAGES,
  VEIN_EVO2_AURA_FRAMES,
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
const actorNormalizationCache = new Map();
const actorSourcePoseCache = new Map();
const actorSourceStats = new Map();
const eggCache = new Map();
const EGG_SOIL_PATTERN_COLUMNS = ["venom", "stone", "ember"];
const EGG_SOIL_PATTERN_ROWS = ["normal", "evo", "evo2"];
const ACTOR_BODY_TARGET = 36;
const ACTOR_BODY_LIMIT = 40;
const ACTOR_SAFE_MIN = 3;
const ACTOR_SAFE_MAX = 45;
const ACTOR_FOOT_Y = 45;
const ACTOR_ANCHOR_X = CELL / 2;
const ACTOR_ANCHOR_Y = Math.round(CELL * 0.75);

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
  assertList("卵の土壌種別", manifest.layouts.eggs.soilPatternColumns, EGG_SOIL_PATTERN_COLUMNS);
  assertList("卵の進化段階", manifest.layouts.eggs.soilPatternRows, EGG_SOIL_PATTERN_ROWS);
  assertList(
    "卵の土壌模様",
    manifest.layouts.eggs.soilPatternSources,
    EGG_SOIL_PATTERN_ROWS.flatMap((level) =>
      EGG_SOIL_PATTERN_COLUMNS.map((kind) => level === "normal" ? kind : `${kind}_${level}`),
    ),
  );
  assertList("通常タイル", manifest.layouts.environmentTiles.ids, TILES.slice(0, 5));
  assertList("エフェクト", manifest.layouts.effects.ids, EFFECTS);
  assertList("デバフ", manifest.layouts.debuffs.ids, DEBUFF_ICONS);
  assertList("会話立ち絵", manifest.layouts.dialogue.ids, DIALOGUE_PORTRAITS);
  assertList("アイテム", manifest.itemSheets.flatMap((sheet) => sheet.ids), ITEM_ICONS);
  assertList("土壌の藻", manifest.layouts.soilAlgae.stages, SOIL_ALGAE_STAGES);
  if (manifest.layouts.soilAlgae.files.length !== SOIL_ALGAE_STAGES.length) {
    throw new Error("土壌の藻原画数が不正です。");
  }
  if (manifest.layouts.veinEvo2Aura.frames !== VEIN_EVO2_AURA_FRAMES
    || manifest.layouts.veinEvo2Aura.files.length !== VEIN_EVO2_AURA_FRAMES
    || manifest.layouts.veinEvo2Aura.innerPadding !== 6) {
    throw new Error("第二進化鉱脈オーラの原画仕様が不正です。");
  }
  for (const [label, layout] of [["通常タイル", manifest.layouts.environmentTiles], ["鉱脈タイル", manifest.layouts.veinTiles]]) {
    if (!Number.isFinite(layout.trimRatio) || layout.trimRatio <= 0 || layout.trimRatio >= 0.25) {
      throw new Error(`${label} のトリム率が不正です。`);
    }
  }
  const transforms = manifest.actorSourceFlipX;
  assertList("アクター方向補正", Object.keys(transforms || {}), Object.keys(manifest.actorSources));
  for (const [name, directions] of Object.entries(transforms || {})) {
    if (!directions || Array.isArray(directions)) throw new Error(`${name} の方向補正が不正です。`);
    for (const [direction, actions] of Object.entries(directions)) {
      if (!ACTOR_RENDER_DIRECTIONS.includes(direction) || !Array.isArray(actions) || actions.length === 0) {
        throw new Error(`${name}:${direction} の方向補正が不正です。`);
      }
      if (actions.includes("*") && actions.length !== 1) throw new Error(`${name}:${direction} の全アクション指定が重複しています。`);
      if (!actions.includes("*") && actions.some((action) => !ACTIONS.includes(action))) {
        throw new Error(`${name}:${direction} のアクション補正が不正です。`);
      }
      if (new Set(actions).size !== actions.length) throw new Error(`${name}:${direction} のアクション補正が重複しています。`);
    }
  }
  const overrides = manifest.actorPoseOverrides || {};
  if (!overrides || Array.isArray(overrides)) throw new Error("アクター個別ポーズの形式が不正です。");
  for (const [name, directions] of Object.entries(overrides)) {
    if (!Object.prototype.hasOwnProperty.call(manifest.actorSources, name)) {
      throw new Error(`${name} の個別ポーズは直接生成元のアクターだけに指定できます。`);
    }
    if (!directions || Array.isArray(directions)) throw new Error(`${name} の個別ポーズ方向が不正です。`);
    for (const [direction, actions] of Object.entries(directions)) {
      if (!ACTOR_RENDER_DIRECTIONS.includes(direction) || !actions || Array.isArray(actions)) {
        throw new Error(`${name}:${direction} の個別ポーズが不正です。`);
      }
      for (const [action, file] of Object.entries(actions)) {
        if (!ACTIONS.includes(action) || typeof file !== "string" || file.length === 0) {
          throw new Error(`${name}:${direction}:${action} の個別ポーズ指定が不正です。`);
        }
        const src = sourceImage(file);
        const cornerPixels = [0, src.width - 1, (src.height - 1) * src.width, src.width * src.height - 1];
        if (src.width < CELL || src.height < CELL || !alphaBounds(src) || !cornerPixels.every((pixel) => src.data[pixel * 4 + 3] <= 12)) {
          throw new Error(`${name}:${direction}:${action} の個別ポーズ透過PNGが不正です。`);
        }
      }
    }
  }
  for (const name of ACTORS) {
    if (name.startsWith("egg_")) continue;
    if (!manifest.actorSources[name]) {
      throw new Error(`アクター ${name} のimagegen生成元がありません。`);
    }
  }
  const directActors = ACTORS.filter((name) => !name.startsWith("egg_"));
  const sourceNames = Object.keys(manifest.actorSources);
  if (sourceNames.length !== directActors.length || directActors.some((name) => !sourceNames.includes(name))) {
    throw new Error("全アクターを独立したimagegen原画へ対応させてください。");
  }
  if (Object.keys(manifest.paletteVariants || {}).length !== 0) {
    throw new Error("旧色違い進化定義は使用できません。");
  }
  if (Object.keys(manifest.actorPoseOverrides || {}).length !== 0) {
    throw new Error("旧アクター個別ポーズ差し替えは使用できません。");
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
  const y = align === "bottom" ? ACTOR_FOOT_Y - height : Math.round((CELL - height) / 2);
  copyInto(out, resized, x, y);
  return out;
}

function flipHorizontal(src) {
  const out = image(src.width, src.height);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = (y * out.width + (out.width - x - 1)) * 4;
      out.data[di] = src.data[si];
      out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2];
      out.data[di + 3] = src.data[si + 3];
    }
  }
  if (src.actorBodyReference) {
    out.actorBodyReference = {
      cx: 1 - src.actorBodyReference.cx,
      cy: src.actorBodyReference.cy,
    };
  }
  if (src.actorJoinDistance) out.actorJoinDistance = src.actorJoinDistance;
  return out;
}

function componentBounds(component) {
  return {
    minX: component.minX,
    minY: component.minY,
    maxX: component.maxX,
    maxY: component.maxY,
  };
}

function mergeBounds(a, b) {
  if (!a) return { ...b };
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function boundsGap(a, b) {
  const dx = Math.max(0, a.minX - b.maxX - 1, b.minX - a.maxX - 1);
  const dy = Math.max(0, a.minY - b.maxY - 1, b.minY - a.maxY - 1);
  return Math.hypot(dx, dy);
}

function segmentOpaque(src) {
  const labels = new Int32Array(src.width * src.height);
  const queue = new Int32Array(src.width * src.height);
  const components = [];
  let nextId = 1;
  for (let start = 0; start < labels.length; start++) {
    if (labels[start] || src.data[start * 4 + 3] <= 12) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = nextId;
    const component = {
      id: nextId,
      count: 0,
      minX: src.width,
      minY: src.height,
      maxX: -1,
      maxY: -1,
    };
    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % src.width;
      const y = Math.floor(pixel / src.width);
      component.count++;
      component.minX = Math.min(component.minX, x);
      component.minY = Math.min(component.minY, y);
      component.maxX = Math.max(component.maxX, x);
      component.maxY = Math.max(component.maxY, y);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= src.width || ny >= src.height) continue;
          const neighbor = ny * src.width + nx;
          if (labels[neighbor] || src.data[neighbor * 4 + 3] <= 12) continue;
          labels[neighbor] = nextId;
          queue[tail++] = neighbor;
        }
      }
    }
    components.push(component);
    nextId++;
  }
  if (!components.length) throw new Error("imagegen生成画像のセルが空です。");
  return { labels, components };
}

function componentCenter(component) {
  return {
    x: (component.minX + component.maxX + 1) / 2,
    y: (component.minY + component.maxY + 1) / 2,
  };
}

function extractActorSourcePoses(baseName) {
  if (!actorSourcePoseCache.has(baseName)) {
    actorSourcePoseCache.clear();
    const file = manifest.actorSources[baseName];
    if (!file) throw new Error(`${baseName} のimagegenアクター画像がありません。`);
    const src = sourceImage(file);
    const columns = manifest.layouts.actors.columns;
    const rows = manifest.layouts.actors.rows;
    const cellWidth = src.width / columns;
    const cellHeight = src.height / rows;
    const segmented = segmentOpaque(src);
    const slots = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        slots.push({
          index: row * columns + column,
          row,
          column,
          centerX: (column + 0.5) * cellWidth,
          centerY: (row + 0.5) * cellHeight,
        });
      }
    }

    const candidates = segmented.components.filter((component) => component.count >= 24);
    const assignments = [];
    for (const slot of slots) {
      for (const component of candidates) {
        const center = componentCenter(component);
        const distance = Math.hypot(
          (center.x - slot.centerX) / cellWidth,
          (center.y - slot.centerY) / cellHeight,
        );
        if (distance > 0.8) continue;
        assignments.push({
          slot: slot.index,
          component,
          score: Math.log1p(component.count) - distance * 2.5,
        });
      }
    }
    assignments.sort((a, b) => b.score - a.score);
    const seedBySlot = new Map();
    const seededComponents = new Set();
    for (const assignment of assignments) {
      if (seedBySlot.has(assignment.slot) || seededComponents.has(assignment.component.id)) continue;
      seedBySlot.set(assignment.slot, assignment.component);
      seededComponents.add(assignment.component.id);
    }
    for (const slot of slots) {
      if (seedBySlot.has(slot.index)) continue;
      let fallback = null;
      let bestScore = -Infinity;
      for (const component of candidates) {
        if (seededComponents.has(component.id)) continue;
        const center = componentCenter(component);
        const distance = Math.hypot(
          (center.x - slot.centerX) / cellWidth,
          (center.y - slot.centerY) / cellHeight,
        );
        const score = Math.log1p(component.count) - distance * 2.5;
        if (score <= bestScore) continue;
        fallback = component;
        bestScore = score;
      }
      if (!fallback) throw new Error(`${baseName}:${slot.column},${slot.row} の本体を特定できません。`);
      seedBySlot.set(slot.index, fallback);
      seededComponents.add(fallback.id);
    }

    const ownerById = new Int32Array(segmented.components.length + 1);
    for (const slot of slots) ownerById[seedBySlot.get(slot.index).id] = slot.index + 1;
    for (const component of segmented.components) {
      if (ownerById[component.id]) continue;
      const center = componentCenter(component);
      let owner = slots[0];
      let bestMetric = Infinity;
      for (const slot of slots) {
        const seed = seedBySlot.get(slot.index);
        const gap = boundsGap(component, seed) / Math.min(cellWidth, cellHeight);
        const nominalDistance = Math.hypot(
          (center.x - slot.centerX) / cellWidth,
          (center.y - slot.centerY) / cellHeight,
        ) / Math.SQRT2;
        const metric = gap + nominalDistance * 0.35;
        if (metric >= bestMetric) continue;
        owner = slot;
        bestMetric = metric;
      }
      ownerById[component.id] = owner.index + 1;
    }
    actorSourceStats.set(baseName, {
      width: src.width,
      height: src.height,
      sourceComponents: segmented.components.length,
      assignedComponents: segmented.components.filter((component) => ownerById[component.id] > 0).length,
    });

    const poses = new Map();
    for (const slot of slots) {
      const owned = segmented.components.filter((component) => ownerById[component.id] === slot.index + 1);
      let ownedBounds = null;
      for (const component of owned) ownedBounds = mergeBounds(ownedBounds, component);
      if (!ownedBounds) throw new Error(`${baseName}:${slot.column},${slot.row} の生成画像が空です。`);
      const pose = image(
        ownedBounds.maxX - ownedBounds.minX + 1,
        ownedBounds.maxY - ownedBounds.minY + 1,
      );
      for (let y = ownedBounds.minY; y <= ownedBounds.maxY; y++) {
        for (let x = ownedBounds.minX; x <= ownedBounds.maxX; x++) {
          const sourcePixel = y * src.width + x;
          if (ownerById[segmented.labels[sourcePixel]] !== slot.index + 1) continue;
          const targetPixel = (y - ownedBounds.minY) * pose.width + x - ownedBounds.minX;
          const si = sourcePixel * 4;
          const di = targetPixel * 4;
          pose.data[di] = src.data[si];
          pose.data[di + 1] = src.data[si + 1];
          pose.data[di + 2] = src.data[si + 2];
          pose.data[di + 3] = src.data[si + 3];
        }
      }
      const seed = seedBySlot.get(slot.index);
      pose.actorBodyReference = {
        cx: ((seed.minX + seed.maxX + 1) / 2 - ownedBounds.minX) / pose.width,
        cy: ((seed.minY + seed.maxY + 1) / 2 - ownedBounds.minY) / pose.height,
      };
      pose.actorJoinDistance = Math.max(2, Math.round(Math.min(cellWidth, cellHeight) * 0.03));
      const direction = ACTOR_RENDER_DIRECTIONS[slot.column];
      const action = ACTIONS[slot.row];
      poses.set(`${action}:${direction}`, pose);
    }
    actorSourcePoseCache.set(baseName, poses);
    sourceCache.delete(file);
  }
  return actorSourcePoseCache.get(baseName);
}

function actorBodyAnalysis(src, reference = null) {
  const segmented = segmentOpaque(src);
  let primary = segmented.components[0];
  let bestScore = -Infinity;
  for (const component of segmented.components) {
    const cx = (component.minX + component.maxX + 1) / 2 / src.width;
    const cy = (component.minY + component.maxY + 1) / 2 / src.height;
    const distancePenalty = reference
      ? 1 + (cx - reference.cx) ** 2 * 80 + (cy - reference.cy) ** 2 * 60
      : 1;
    const score = component.count / distancePenalty;
    if (score > bestScore) {
      primary = component;
      bestScore = score;
    }
  }
  const bodyIds = new Set([primary.id]);
  let bodyBounds = componentBounds(primary);
  const joinDistance = src.actorJoinDistance
    || Math.max(2, Math.round(Math.min(src.width, src.height) * 0.03));
  let joined = true;
  while (joined) {
    joined = false;
    for (const component of segmented.components) {
      if (bodyIds.has(component.id)) continue;
      if (boundsGap(bodyBounds, component) > joinDistance) continue;
      bodyIds.add(component.id);
      bodyBounds = mergeBounds(bodyBounds, component);
      joined = true;
    }
  }
  return {
    ...segmented,
    bodyIds,
    bodyBounds,
    reference: {
      cx: (bodyBounds.minX + bodyBounds.maxX + 1) / 2 / src.width,
      cy: (bodyBounds.minY + bodyBounds.maxY + 1) / 2 / src.height,
    },
  };
}

function actorSourceCell(baseName, action, direction) {
  const override = manifest.actorPoseOverrides?.[baseName]?.[direction]?.[action];
  let cell;
  if (override) {
    cell = sourceImage(override);
  } else {
    cell = extractActorSourcePoses(baseName).get(`${action}:${direction}`);
  }
  return shouldFlipActorSource(baseName, action, direction) ? flipHorizontal(cell) : cell;
}

function actorNormalization(baseName) {
  if (!actorNormalizationCache.has(baseName)) {
    const references = {};
    const analyses = [];
    for (const direction of ACTOR_RENDER_DIRECTIONS) {
      const cell = actorSourceCell(baseName, "idle", direction);
      const analysis = actorBodyAnalysis(cell, cell.actorBodyReference);
      references[direction] = analysis.reference;
      analyses.push({ action: "idle", direction, analysis });
    }
    for (const action of ACTIONS.slice(1)) {
      for (const direction of ACTOR_RENDER_DIRECTIONS) {
        const cell = actorSourceCell(baseName, action, direction);
        analyses.push({
          action,
          direction,
          analysis: actorBodyAnalysis(cell, references[direction]),
        });
      }
    }
    const idleAnalyses = analyses.filter(({ action }) => action === "idle");
    const width = ({ analysis }) => analysis.bodyBounds.maxX - analysis.bodyBounds.minX + 1;
    const height = ({ analysis }) => analysis.bodyBounds.maxY - analysis.bodyBounds.minY + 1;
    const idleMaxWidth = Math.max(...idleAnalyses.map(width));
    const idleMaxHeight = Math.max(...idleAnalyses.map(height));
    const poseMaxWidth = Math.max(...analyses.map(width));
    const poseMaxHeight = Math.max(...analyses.map(height));
    const scale = Math.min(
      ACTOR_BODY_TARGET / idleMaxWidth,
      ACTOR_BODY_TARGET / idleMaxHeight,
      ACTOR_BODY_LIMIT / poseMaxWidth,
      ACTOR_BODY_LIMIT / poseMaxHeight,
    );
    actorNormalizationCache.set(baseName, { references, scale, minEffectScale: 1 });
  }
  return actorNormalizationCache.get(baseName);
}

function componentLayer(src, labels, ids) {
  const out = image(src.width, src.height);
  for (let pixel = 0; pixel < labels.length; pixel++) {
    if (!ids.has(labels[pixel])) continue;
    const offset = pixel * 4;
    out.data[offset] = src.data[offset];
    out.data[offset + 1] = src.data[offset + 1];
    out.data[offset + 2] = src.data[offset + 2];
    out.data[offset + 3] = src.data[offset + 3];
  }
  return out;
}

function copyOpaqueInto(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const si = (y * src.width + x) * 4;
      if (src.data[si + 3] <= 8) continue;
      const di = (ty * dst.width + tx) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

function resizedLayer(src, bounds, scale) {
  const cropped = crop(
    src,
    bounds.minX,
    bounds.minY,
    bounds.maxX - bounds.minX + 1,
    bounds.maxY - bounds.minY + 1,
  );
  const width = Math.max(1, Math.round(cropped.width * scale));
  const height = Math.max(1, Math.round(cropped.height * scale));
  return resizeNearest(cropped, width, height);
}

function touchesSourceCorner(component, src) {
  const horizontal = component.minX === 0 || component.maxX === src.width - 1;
  const vertical = component.minY === 0 || component.maxY === src.height - 1;
  return horizontal && vertical;
}

function normalizeActorPose(baseName, action, direction, src) {
  const normalization = actorNormalization(baseName);
  const analysis = actorBodyAnalysis(src, normalization.references[direction]);
  const bodyAnchorX = (analysis.bodyBounds.minX + analysis.bodyBounds.maxX + 1) / 2;
  const bodyAnchorY = analysis.bodyBounds.maxY + 1;
  const out = image();
  const bodyLayer = componentLayer(src, analysis.labels, analysis.bodyIds);
  const body = resizedLayer(bodyLayer, analysis.bodyBounds, normalization.scale);
  const bodyX = Math.round((CELL - body.width) / 2);
  const bodyY = ACTOR_FOOT_Y - body.height;
  copyOpaqueInto(out, body, bodyX, bodyY);

  const effectIds = new Set();
  let effectBounds = null;
  for (const component of analysis.components) {
    if (analysis.bodyIds.has(component.id) || touchesSourceCorner(component, src)) continue;
    effectIds.add(component.id);
    effectBounds = mergeBounds(effectBounds, component);
  }
  if (effectBounds) {
    const effectLayer = componentLayer(src, analysis.labels, effectIds);
    const effectWidth = effectBounds.maxX - effectBounds.minX + 1;
    const effectHeight = effectBounds.maxY - effectBounds.minY + 1;
    const effectScale = Math.min(
      normalization.scale,
      (ACTOR_SAFE_MAX - ACTOR_SAFE_MIN) / effectWidth,
      (ACTOR_SAFE_MAX - ACTOR_SAFE_MIN) / effectHeight,
    );
    normalization.minEffectScale = Math.min(
      normalization.minEffectScale,
      effectScale / normalization.scale,
    );
    const effect = resizedLayer(effectLayer, effectBounds, effectScale);
    const sourceCenterX = (effectBounds.minX + effectBounds.maxX + 1) / 2;
    const sourceCenterY = (effectBounds.minY + effectBounds.maxY + 1) / 2;
    const desiredCenterX = CELL / 2 + (sourceCenterX - bodyAnchorX) * normalization.scale;
    const desiredCenterY = ACTOR_FOOT_Y + (sourceCenterY - bodyAnchorY) * normalization.scale;
    const effectX = Math.max(
      ACTOR_SAFE_MIN,
      Math.min(ACTOR_SAFE_MAX - effect.width, Math.round(desiredCenterX - effect.width / 2)),
    );
    const effectY = Math.max(
      ACTOR_SAFE_MIN,
      Math.min(ACTOR_SAFE_MAX - effect.height, Math.round(desiredCenterY - effect.height / 2)),
    );
    copyOpaqueInto(out, effect, effectX, effectY);
  }
  return out;
}

function normalizeTile(src, trimRatio) {
  const size = Math.min(src.width, src.height);
  const x = Math.floor((src.width - size) / 2);
  const y = Math.floor((src.height - size) / 2);
  const trim = Math.round(size * trimRatio);
  if (trim < 1 || trim * 2 >= size) throw new Error("タイル原画のトリム量が不正です。");
  return resizeNearest(crop(src, x + trim, y + trim, size - trim * 2, size - trim * 2), CELL, CELL);
}

function normalizeFullFrame(src) {
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

function shouldFlipActorSource(baseName, action, direction) {
  const actions = manifest.actorSourceFlipX?.[baseName]?.[direction];
  return Array.isArray(actions) && (actions.includes("*") || actions.includes(action));
}

function actorPose(baseName, action, direction) {
  const key = `${baseName}:${action}:${direction}`;
  if (!actorPoseCache.has(key)) {
    const corrected = actorSourceCell(baseName, action, direction);
    actorPoseCache.set(key, normalizeActorPose(baseName, action, direction, corrected));
  }
  return actorPoseCache.get(key);
}

function baseActorFrame(baseName, action, direction, frame) {
  const [dx, dy] = frameOffset(action, direction, frame);
  return shifted(actorPose(baseName, action, direction), dx, dy);
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
  return baseActorFrame(name, action, direction, frame);
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
    const tile = normalizeTile(
      gridCell(environmentSource, index, 0, environment.columns, environment.rows),
      environment.trimRatio,
    );
    copyInto(atlas, tile, TILES.indexOf(name) * CELL, 0);
  });

  const veins = manifest.layouts.veinTiles;
  const veinSource = sourceImage(veins.file);
  veins.kinds.forEach((kind, row) => {
    veins.levels.forEach((level, column) => {
      const name = level === "normal" ? kind : `${kind}_${level}`;
      const tile = normalizeTile(
        gridCell(veinSource, column, row, veins.columns, veins.rows),
        veins.trimRatio,
      );
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

function writeSoilAlgaeAtlas() {
  const layout = manifest.layouts.soilAlgae;
  const atlas = image(CELL * SOIL_ALGAE_STAGES.length, CELL);
  layout.files.forEach((file, column) => {
    copyInto(atlas, normalizeFullFrame(sourceImage(file)), column * CELL, 0);
  });
  writePng(path.join(OUT_DIR, "soil_algae.png"), atlas);
}

function writeVeinEvo2AuraAtlas() {
  const layout = manifest.layouts.veinEvo2Aura;
  const atlas = image(CELL * VEIN_EVO2_AURA_FRAMES, CELL);
  layout.files.forEach((file, frame) => {
    copyInto(atlas, normalizeFullFrame(sourceImage(file)), frame * CELL, 0);
  });
  writePng(path.join(OUT_DIR, "vein_evo2_aura.png"), atlas);
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
    actorNormalization: {},
    actors: {},
    tiles: {},
    effects: {},
    items: {},
    soilAlgae: {},
    veinEvo2Aura: {},
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
      anchor: [ACTOR_ANCHOR_X, ACTOR_ANCHOR_Y],
    };
    if (!name.startsWith("egg_")) {
      const normalization = actorNormalizationCache.get(name);
      const sourceStats = actorSourceStats.get(name);
      meta.actorNormalization[name] = {
        scale: Number(normalization.scale.toFixed(6)),
        targetCenterX: ACTOR_ANCHOR_X,
        targetFootY: ACTOR_FOOT_Y,
        minEffectScale: Number(normalization.minEffectScale.toFixed(6)),
        sourceWidth: sourceStats.width,
        sourceHeight: sourceStats.height,
        sourceComponents: sourceStats.sourceComponents,
        assignedComponents: sourceStats.assignedComponents,
      };
    }
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
  SOIL_ALGAE_STAGES.forEach((stage, column) => {
    meta.soilAlgae[stage] = {
      sheet: "soil_algae",
      x: column * CELL,
      y: 0,
      w: CELL,
      h: CELL,
      stage,
    };
  });
  for (let frame = 0; frame < VEIN_EVO2_AURA_FRAMES; frame++) {
    meta.veinEvo2Aura[frame] = {
      sheet: "vein_evo2_aura",
      x: frame * CELL,
      y: 0,
      w: CELL,
      h: CELL,
      frame,
      anchor: [CELL / 2, CELL / 2],
    };
  }
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
  writeSoilAlgaeAtlas();
  writeVeinEvo2AuraAtlas();
  writeSingleRowAtlas(manifest.layouts.debuffs, DEBUFF_ICONS, "debuffs.png", 42);
  writeSingleRowAtlas(manifest.layouts.dialogue, DIALOGUE_PORTRAITS, "dialogue_portraits.png", 46);
  writeMeta();
  console.log("imagegen生成画像から48pxピクセル素材アトラスを構築しました。");
}

build();
