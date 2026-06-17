"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const EXTERNAL_ROOT = path.join("assets", "external", "cc0", "dcss");
const RELEASE = path.join("releases", "Nov-2015");
const heroNames = ["warrior", "tank", "mage", "priest"];
const dirVec = { e:[1,0], se:[1,1], s:[0,1], sw:[-1,1], w:[-1,0], nw:[-1,-1], n:[0,-1], ne:[1,-1] };

const actorSources = {
  slime: "mon/amorphous/jelly.png",
  superslime: "mon/amorphous/azure_jelly.png",
  carniv: "mon/animals/worm.png",
  evolved: "mon/demons/abomination_large3.png",
  spitter: "mon/animals/scorpion.png",
  tarantula: "mon/animals/wolf_spider.png",
  golem: "mon/nonliving/iron_golem.png",
  titan: "mon/statues/orange_crystal_statue.png",
  flame: "mon/nonliving/fire_elemental.png",
  infernal: "mon/demons/balrug.png",
  warrior: "player/base/human_m.png",
  tank: "player/base/human_m.png",
  mage: "player/base/human_f.png",
  priest: "mon/deep_elf_priest.png",
  egg_superslime: "item/food/lump_of_royal_jelly.png",
  egg_evolved: "gui/spells/summoning/summon_demon.png",
  egg_tarantula: "gui/spells/monster/fire_breath.png",
  egg_titan: "mon/statues/statue_base.png",
  egg_infernal: "gui/spells/fire/fireball.png",
};
const heroLayers = {
  warrior: ["player/body/dragonarm_blue.png", "player/hand1/long_sword_slant.png"],
  tank: ["player/body/dragonarm_shadow.png", "player/hand2/doll_only/shield_middle_gray.png"],
  mage: ["player/body/dragonarm_magenta.png", "player/head/wizard_purple.png", "player/hand1/staff_mage.png"],
  priest: ["player/body/dragonarm_white.png", "player/head/wizard_white.png", "player/hand1/staff_fancy.png"],
};
const overlays = {
  warrior: "player/hand1/heavy_sword.png",
  tank: "player/hand2/doll_only/shield_round_white.png",
  mage: "gui/spells/fire/flame_tongue.png",
  priest: "gui/spells/fire/fireball.png",
};

function noise(img, seed, colors, count) {
  for (let i = 0; i < count; i++) {
    const x = (i * 19 + seed * 13) % CELL, y = (i * 31 + seed * 5) % CELL;
    rect(img, x, y, 1 + (i % 3), 1 + ((i + 1) % 2), colors[(i + seed) % colors.length]);
  }
}
function shardGlow(img, cx, cy, r, col, alpha) {
  const pts = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  pts.forEach((p, i) => diamond(img, cx + p[0] * r, cy + p[1] * r, i % 2 ? 2 : 3, col, alpha));
}

function trimPngBuffer(buf) {
  const sig = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68]);
  const i = buf.indexOf(sig);
  return i >= 0 ? buf.subarray(0, i + 12) : buf;
}
function externalPath(rel) {
  return path.join(EXTERNAL_ROOT, RELEASE, rel);
}
function readExternal(rel) {
  const file = externalPath(rel);
  if (!fs.existsSync(file)) throw new Error("外部素材がありません: " + file);
  return PNG.sync.read(trimPngBuffer(fs.readFileSync(file)));
}
function alphaBounds(img) {
  let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 0) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) return { minX: 0, minY: 0, maxX: img.width - 1, maxY: img.height - 1 };
  return { minX, minY, maxX, maxY };
}
function cropOpaque(img, pad = 1) {
  const b = alphaBounds(img);
  const minX = Math.max(0, b.minX - pad), minY = Math.max(0, b.minY - pad);
  const maxX = Math.min(img.width - 1, b.maxX + pad), maxY = Math.min(img.height - 1, b.maxY + pad);
  const out = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(img, out, minX, minY, out.width, out.height, 0, 0);
  return out;
}
function scaleNearest(src, w, h) {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(src.width - 1, Math.floor(x * src.width / w));
    const sy = Math.min(src.height - 1, Math.floor(y * src.height / h));
    const si = (sy * src.width + sx) * 4, di = (y * w + x) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3];
  }
  return out;
}
function normalize(src, w = 33, h = 33) {
  return scaleNearest(cropOpaque(src), w, h);
}
function blitAlpha(dst, src, dx, dy, opts = {}) {
  const opacity = opts.opacity === undefined ? 1 : opts.opacity;
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const tx = Math.round(dx + x), ty = Math.round(dy + y);
    if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
    const si = (y * src.width + x) * 4, a = Math.round(src.data[si + 3] * opacity);
    if (a <= 0) continue;
    setPx(dst, tx, ty, { r: src.data[si], g: src.data[si + 1], b: src.data[si + 2], a });
  }
}
function mirrorX(src) {
  const out = new PNG({ width: src.width, height: src.height });
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const si = (y * src.width + x) * 4, di = (y * src.width + (src.width - 1 - x)) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3];
  }
  return out;
}
function shade(src, mul, add = 0) {
  const out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.data.length; i += 4) {
    out.data[i] = Math.max(0, Math.min(255, Math.round(src.data[i] * mul + add)));
    out.data[i + 1] = Math.max(0, Math.min(255, Math.round(src.data[i + 1] * mul + add)));
    out.data[i + 2] = Math.max(0, Math.min(255, Math.round(src.data[i + 2] * mul + add)));
    out.data[i + 3] = src.data[i + 3];
  }
  return out;
}
function rotate(src, angle) {
  const out = new PNG({ width: src.width, height: src.height });
  const cx = (src.width - 1) / 2, cy = (src.height - 1) / 2, c = Math.cos(-angle), s = Math.sin(-angle);
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const rx = x - cx, ry = y - cy, sx = Math.round(rx * c - ry * s + cx), sy = Math.round(rx * s + ry * c + cy);
    if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) continue;
    const si = (sy * src.width + sx) * 4, di = (y * src.width + x) * 4;
    out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3];
  }
  return out;
}
function tint(src, color, amount) {
  const c = rgba(color);
  const out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < src.data.length; i += 4) {
    out.data[i] = Math.round(src.data[i] * (1 - amount) + c.r * amount);
    out.data[i + 1] = Math.round(src.data[i + 1] * (1 - amount) + c.g * amount);
    out.data[i + 2] = Math.round(src.data[i + 2] * (1 - amount) + c.b * amount);
    out.data[i + 3] = src.data[i + 3];
  }
  return out;
}
function clearCellEdge(img) {
  for (let x = 0; x < img.width; x++) {
    img.data[(x) * 4 + 3] = 0;
    img.data[((img.height - 1) * img.width + x) * 4 + 3] = 0;
  }
  for (let y = 0; y < img.height; y++) {
    img.data[(y * img.width) * 4 + 3] = 0;
    img.data[(y * img.width + img.width - 1) * 4 + 3] = 0;
  }
}
function actorBase(name) {
  let base = normalize(readExternal(actorSources[name]), name === "titan" || name === "golem" ? 38 : 34, name === "titan" || name === "golem" ? 38 : 34);
  if (name === "evolved") base = tint(base, "#d85a7a", 0.18);
  if (name === "infernal") base = tint(base, "#4ab7ff", 0.18);
  return base;
}
function heroBase(name) {
  const out = image();
  const base = normalize(readExternal(actorSources[name]), 30, 30);
  blitAlpha(out, base, 9, 12);
  for (const rel of heroLayers[name]) {
    const layer = normalize(readExternal(rel), rel.includes("hand") ? 31 : 30, rel.includes("hand") ? 31 : 30);
    blitAlpha(out, layer, 9, rel.includes("head") ? 5 : 12);
  }
  return cropOpaque(out, 1);
}
function eggBase(name) {
  return normalize(readExternal(actorSources[name]), 27, 27);
}
function directionalSprite(src, dir, action, frame, isHero) {
  const [dx, dy] = dirVec[dir];
  let out = src;
  if (dx < 0) out = mirrorX(out);
  if (dy < 0) out = shade(out, 0.62, isHero ? 12 : 0);
  if (dy > 0) out = shade(out, 1.04);
  const angle = dx * 0.10 + dy * 0.04;
  if (angle) out = rotate(out, angle);
  if (action !== "idle") {
    const power = [0, 1, 3, 1][frame];
    out = rotate(out, dx * 0.06 * power);
    if (action === "cast" || action === "heal") out = shade(out, 1.05, 8 + frame * 4);
  }
  return out;
}
function drawExternalActor(name, frame, dir, action) {
  const img = image();
  const [dx, dy] = dirVec[dir];
  const isHero = heroNames.includes(name);
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 3, 1][frame];
  let base = name.startsWith("egg_") ? eggBase(name) : (isHero ? heroBase(name) : actorBase(name));
  base = directionalSprite(base, dir, action, frame, isHero);
  const lunge = action !== "idle" ? [0, 2, 5, 2][frame] : 0;
  const x = Math.round((CELL - base.width) / 2 + dx * lunge);
  const y = Math.round(CELL - base.height - 7 + bob + dy * Math.min(2, lunge));
  blitAlpha(img, base, x, y);
  if (isHero && (action === "attack" || action === "dig" || action === "cast" || action === "heal")) {
    const rel = overlays[name];
    let ov = normalize(readExternal(rel), action === "cast" || action === "heal" ? 20 + frame * 2 : 28, action === "cast" || action === "heal" ? 20 + frame * 2 : 28);
    if (dx < 0) ov = mirrorX(ov);
    ov = rotate(ov, dx * [0, 0.25, 0.55, 0.25][frame]);
    blitAlpha(img, ov, 21 + dx * (5 + frame * 2) - ov.width / 2, 15 + dy * 5 - ov.height / 2);
  }
  clearCellEdge(img);
  return img;
}

function drawTile(name) {
  const img = image();
  const evo = name.endsWith("_evo"), base = name.replace("_evo", "");
  if (base === "earth") {
    rect(img, 0, 0, CELL, CELL, "#5a3822"); rect(img, 0, 0, CELL, 4, "#7a5131"); rect(img, 0, CELL - 5, CELL, 5, "#2c1a12");
    noise(img, 3, ["#6d4729", "#432615", "#8a6039"], 72);
  } else if (base === "tunnel") {
    rect(img, 0, 0, CELL, CELL, "#24192d"); rect(img, 0, 0, CELL, 6, "#140d1e"); rect(img, 0, CELL - 6, CELL, 6, "#130d1b");
    rect(img, 0, 0, 4, CELL, "#161020"); rect(img, CELL - 4, 0, 4, CELL, "#161020");
    noise(img, 9, ["#2e2038", "#1b1224", "#3a2b46"], 38);
  } else if (base === "bedrock") {
    rect(img, 0, 0, CELL, CELL, "#120d18");
    for (let i = 0; i < 7; i++) diamond(img, 8 + i * 7, 9 + ((i * 13) % 28), 4 + (i % 3), i % 2 ? "#221a2e" : "#0a0710");
  } else if (base === "surface") {
    rect(img, 0, 0, CELL, CELL, "#17101f"); rect(img, 5, 0, CELL - 10, CELL, "#281c32"); rect(img, 7, 0, CELL - 14, 8, "#443356"); rect(img, 22, 8, 4, 40, "#0b0711");
  } else if (base === "core") {
    rect(img, 0, 0, CELL, CELL, "#24192d"); diamond(img, 24, 25, 19, "#160a22"); diamond(img, 24, 23, 14, "#3b1d50"); diamond(img, 24, 23, 8, "#b026ff"); diamond(img, 24, 23, 4, "#f5e6ff");
  } else {
    rect(img, 0, 0, CELL, CELL, "#5a3822"); rect(img, 0, 0, CELL, 4, "#7a5131"); rect(img, 0, CELL - 5, CELL, 5, "#2c1a12");
    noise(img, 3, ["#6d4729", "#432615", "#8a6039"], 72);
    const vein = { moss:["#2e7d35","#6fcf6f","#bdf7bd","diamond"], meat:["#7b1515","#e63a2c","#ffb39e","meat"], venom:["#4e1d7d","#a64dff","#e0bcff","venom"], stone:["#33466b","#6f86c4","#bcd0ff","stone"], ember:["#8c3b0c","#ffae26","#ffe39a","ember"] }[base];
    const cx = 24, cy = 24;
    if (vein[3] === "diamond") { diamond(img, cx, cy, 10, vein[0]); diamond(img, cx, cy, 7, vein[1]); diamond(img, cx - 2, cy - 3, 3, vein[2]); }
    else if (vein[3] === "meat") { rect(img, cx - 8, cy - 7, 16, 14, vein[0]); rect(img, cx - 6, cy - 5, 12, 10, vein[1]); line(img, cx - 4, cy - 5, cx + 4, cy + 5, vein[2], 2, 220); }
    else if (vein[3] === "venom") { tri(img, cx, cy - 10, cx + 10, cy + 6, cx - 10, cy + 6, vein[0]); tri(img, cx, cy - 7, cx + 7, cy + 5, cx - 7, cy + 5, vein[1]); diamond(img, cx, cy + 1, 3, vein[2]); }
    else if (vein[3] === "stone") { diamond(img, cx - 5, cy, 8, vein[0]); diamond(img, cx + 5, cy, 8, vein[1]); rect(img, cx - 2, cy - 4, 4, 3, vein[2]); }
    else { tri(img, cx - 9, cy + 8, cx, cy - 12, cx + 9, cy + 8, vein[1]); tri(img, cx - 4, cy + 7, cx + 2, cy - 4, cx + 7, cy + 7, vein[2]); }
    if (evo) { diamond(img, 13, 12, 3, vein[2]); diamond(img, 35, 12, 3, vein[2]); diamond(img, 24, 36, 3, vein[2]); }
  }
  return img;
}
function drawEffect(name, frame) {
  const img = image();
  const t = frame / (FRAMES - 1);
  if (name === "slash") { line(img, 10, 31 - t * 10, 38, 17 + t * 8, "#fff4e8", 6, 230 - frame * 35); line(img, 12, 34 - t * 10, 36, 20 + t * 8, "#c8cbd4", 3, 210 - frame * 35); }
  else if (name === "shot") { diamond(img, 14 + frame * 6, 24, 5 + frame, "#b6a6ff", 190); diamond(img, 18 + frame * 6, 24, 3, "#fff7ff", 230); line(img, 5, 24, 15 + frame * 5, 24, "#6a5acd", 2, 120); }
  else if (name === "bite") { tri(img, 14, 18 + frame, 24, 24, 14, 30 - frame, "#fff7ee", 220 - frame * 35); tri(img, 34, 18 + frame, 24, 24, 34, 30 - frame, "#fff7ee", 220 - frame * 35); rect(img, 22, 22, 4, 4, "#e0556b", 160); }
  else if (name === "birth") { const spread = 5 + frame * 5; [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[-1,0],[1,0]].forEach((s, i) => diamond(img, 24 + s[0] * spread + (i % 2), 24 + s[1] * spread + ((i + frame) % 3) - 1, 2, "#fff0a8", 200 - frame * 40)); shardGlow(img, 24, 24, 8 + frame * 5, "#8ff39a", 210 - frame * 42); }
  else if (name === "puff") { for (let i = 0; i < 8; i++) diamond(img, 24 + Math.cos(i) * (4 + frame * 4), 24 + Math.sin(i * 2) * (3 + frame * 4), 4 + frame, "#cfd8e3", 180 - frame * 35); }
  return img;
}
function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("actors", name, f, dir, action), drawExternalActor(name, f, dir, action));
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("effects", name, f), drawEffect(name, f));
}
function actorFrameX(actionIndex, dirIndex, frame) {
  return ((actionIndex * DIRECTIONS.length + dirIndex) * FRAMES + frame) * CELL;
}
function writeAtlas() {
  ensureDir(OUT_DIR);
  const actors = image(CELL * FRAMES * DIRECTIONS.length * ACTIONS.length, CELL * ACTORS.length);
  ACTORS.forEach((name, row) => ACTIONS.forEach((action, ai) => DIRECTIONS.forEach((dir, di) => {
    for (let f = 0; f < FRAMES; f++) copyInto(actors, readPng(spritePath("actors", name, f, dir, action)), actorFrameX(ai, di, f), row * CELL);
  })));
  writePng(path.join(OUT_DIR, "actors.png"), actors);
  const tiles = image(CELL * TILES.length, CELL);
  TILES.forEach((name, col) => copyInto(tiles, readPng(spritePath("tiles", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "tiles.png"), tiles);
  const effects = image(CELL * FRAMES, CELL * EFFECTS.length);
  EFFECTS.forEach((name, row) => { for (let f = 0; f < FRAMES; f++) copyInto(effects, readPng(spritePath("effects", name, f)), f * CELL, row * CELL); });
  writePng(path.join(OUT_DIR, "effects.png"), effects);
}
function writeMeta() {
  const meta = { cell: CELL, frames: FRAMES, directions: DIRECTIONS, actions: ACTIONS, actors: {}, tiles: {}, effects: {} };
  ACTORS.forEach((name, row) => {
    meta.actors[name] = { sheet: "actors", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, directions: DIRECTIONS.length, actions: ACTIONS.length, anchor: [CELL / 2, Math.round(CELL * 0.75)] };
  });
  TILES.forEach((name, col) => { meta.tiles[name] = { sheet: "tiles", x: col * CELL, y: 0, w: CELL, h: CELL }; });
  EFFECTS.forEach((name, row) => { meta.effects[name] = { sheet: "effects", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, anchor: [CELL / 2, CELL / 2] }; });
  fs.writeFileSync(path.join(OUT_DIR, "sprites.json"), JSON.stringify(meta, null, 2) + "\n");
}

writeSourceFrames();
writeAtlas();
writeMeta();
console.log("CC0外部素材から48px 8方向・アクション別ピクセル素材を生成しました。");
