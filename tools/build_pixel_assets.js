"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const actorColors = {
  slime: ["#07140a", "#1e6b2d", "#42b85a", "#8ff39a"],
  carniv: ["#21070a", "#7f2419", "#d55531", "#ff9865"],
  evolved: ["#17050d", "#5b1430", "#b92f5c", "#ff8ab0"],
  spitter: ["#140b20", "#4a216c", "#8d45c7", "#d4a0ff"],
  golem: ["#101722", "#2f3d5d", "#7188c7", "#c5d8ff"],
  flame: ["#1c0508", "#932214", "#ff6a22", "#ffd15a"],
  superslime: ["#061323", "#1c5a86", "#59baff", "#d4f2ff"],
  tarantula: ["#16070a", "#61211d", "#d14b3d", "#ffc0a8"],
  titan: ["#17110b", "#5c4630", "#c69a64", "#ffe3ac"],
  infernal: ["#06111d", "#124d7a", "#41b9ff", "#c9f4ff"],
  warrior: ["#10131b", "#485161", "#c8d2df", "#fff5cf"],
  tank: ["#10131b", "#303743", "#7a8290", "#dce4ef"],
  mage: ["#130e2a", "#362a83", "#7567df", "#d7ccff"],
  priest: ["#2a241a", "#8e8060", "#efe6cf", "#fff0a8"],
};
const dirVec = { e:[1,0], se:[1,1], s:[0,1], sw:[-1,1], w:[-1,0], nw:[-1,-1], n:[0,-1], ne:[1,-1] };
const heroNames = ["warrior", "tank", "mage", "priest"];

function noise(img, seed, colors, count) {
  for (let i = 0; i < count; i++) {
    const x = (i * 19 + seed * 13) % CELL, y = (i * 31 + seed * 5) % CELL;
    rect(img, x, y, 1 + (i % 3), 1 + ((i + 1) % 2), colors[(i + seed) % colors.length]);
  }
}
function shadow(img, x, y, w, a = 145) {
  rect(img, x - w, y - 2, w * 2, 4, "#050309", a);
  rect(img, x - Math.floor(w * 0.65), y - 3, Math.floor(w * 1.3), 2, "#050309", Math.max(0, a - 40));
}
function eye(img, x, y, col = "#fff7c7") { rect(img, x, y, 4, 4, "#08060a"); rect(img, x + 1, y, 1, 1, col); }
function bodyBox(img, x, y, w, h, dark, mid, light) {
  rect(img, x - 2, y - 2, w + 4, h + 4, dark);
  rect(img, x, y, w, h, mid);
  rect(img, x + 2, y, Math.max(2, w - 4), 3, light);
}
function dirInfo(dir) {
  const [dx, dy] = dirVec[dir];
  return { dx, dy, back: dy < 0, front: dy > 0, side: dx !== 0 };
}
function aimPoint(x, y, dir, len) {
  const [dx, dy] = dirVec[dir];
  return [x + dx * len, y + dy * len];
}
function actionPhase(action, frame) {
  if (action === "idle") return [0, 1, 0, -1][frame];
  return [0, 1, 3, 1][frame];
}
function shardGlow(img, cx, cy, r, col, alpha) {
  const pts = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
  pts.forEach((p, i) => {
    const x = cx + p[0] * r, y = cy + p[1] * r;
    diamond(img, x, y, i % 2 ? 2 : 3, col, alpha);
  });
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
    const vein = {
      moss: ["#2e7d35", "#6fcf6f", "#bdf7bd", "diamond"],
      meat: ["#7b1515", "#e63a2c", "#ffb39e", "meat"],
      venom: ["#4e1d7d", "#a64dff", "#e0bcff", "venom"],
      stone: ["#33466b", "#6f86c4", "#bcd0ff", "stone"],
      ember: ["#8c3b0c", "#ffae26", "#ffe39a", "ember"],
    }[base];
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

function drawMonster(img, name, frame, dir, action) {
  const p = actorColors[name] || actorColors.slime;
  const { dx, dy, back, front } = dirInfo(dir);
  const bob = actionPhase(action, frame), act = action === "attack" || action === "cast" || action === "eat" ? [0, 2, 6, 2][frame] : 0;
  const sx = dx * (front ? 4 : back ? 2 : 7) + dx * act;
  const yy = bob;
  shadow(img, 24, 40, name === "golem" || name === "titan" ? 17 : 14);
  const elite = ["superslime", "evolved", "tarantula", "titan", "infernal"].includes(name);
  if (name === "slime" || name === "superslime") {
    bodyBox(img, 10, 24 + yy, 25, 13, p[0], p[1], p[2]);
    diamond(img, 25 + sx, 19 + dy * 4 + yy, elite ? 13 : 10, p[2]);
    if (back) { rect(img, 13, 18 + yy, 22, 5, p[3]); rect(img, 22 + dx * 3, 13 + yy, 5, 5, p[3]); }
    else { eye(img, 22 + sx, 22 + yy); eye(img, 31 + sx, 22 + yy); if (action === "eat") tri(img, 25 + sx, 27 + yy, 33 + sx, 27 + yy, 29 + sx, 34 + yy, "#fff7ee"); }
    if (elite) { diamond(img, 19 - dx * 5, 15 + yy, 4, p[3]); diamond(img, 30 + dx * 5, 14 + yy, 4, p[3]); }
  } else if (name === "carniv" || name === "evolved") {
    bodyBox(img, 8, 20 + yy, 27, 14, p[0], p[1], p[2]);
    tri(img, 28 + sx, 17 + dy * 3 + yy, 45 + sx, 24 + dy * 3 + yy, 28 + sx, 32 + yy, p[1]);
    if (back) rect(img, 10, 16 + yy, 24, 5, p[3]);
    else { eye(img, 24 + sx, 22 + yy, "#ffcf4d"); eye(img, 34 + sx, 24 + yy, "#ffcf4d"); for (const x of [18, 27, 36]) tri(img, x + sx / 3, 31 + yy, x + 3 + sx / 3, 39 + yy, x + 6 + sx / 3, 31 + yy, "#fff7ee"); }
    if (name === "evolved") { diamond(img, 18 - dx * 4, 12 + yy, 4, p[3]); diamond(img, 31 + dx * 4, 12 + yy, 4, p[3]); }
  } else if (name === "spitter" || name === "tarantula") {
    bodyBox(img, 11, 21 + yy, 23, 15, p[0], p[1], p[2]);
    rect(img, 29 + sx, 22 + dy * 2 + yy, 12 + act, 6, p[2]); diamond(img, 41 + sx + act, 25 + dy * 2 + yy, 4, p[3], 220);
    for (const y of [25, 30, 35]) { line(img, 13, y + yy, 5 - act, y + 3 + yy, p[0], 2); line(img, 31, y + yy, 41 + act, y + 3 + yy, p[0], 2); }
    if (!back) { eye(img, 19 + sx, 23 + yy, "#dfffe0"); eye(img, 27 + sx, 23 + yy, "#dfffe0"); } else rect(img, 16, 17 + yy, 18, 4, p[3]);
    if (name === "tarantula") { diamond(img, 22 - dx * 4, 14 + yy, 4, p[3]); diamond(img, 30 + dx * 4, 14 + yy, 4, p[3]); }
  } else if (name === "golem" || name === "titan") {
    bodyBox(img, 10, 17 + yy, 27, 21, p[0], p[1], p[2]);
    rect(img, 4 - act, 23 + yy, 8, 14, p[1]); rect(img, 35 + act, 21 + yy, 8, 15, p[1]);
    tri(img, 34 + sx, 20 + dy * 2 + yy, 44 + sx + act, 24 + dy * 3 + yy, 34 + sx, 30 + yy, p[2]);
    if (!back) { eye(img, 27 + sx, 23 + yy, p[3]); eye(img, 36 + sx, 24 + yy, p[3]); } else { rect(img, 17, 17 + yy, 17, 5, p[2]); rect(img, 14, 22 + yy, 19, 11, p[0]); rect(img, 18, 25 + yy, 11, 4, p[3]); }
    if (name === "titan") { diamond(img, 19 - dx * 4, 11 + yy, 5, p[3]); diamond(img, 31 + dx * 4, 10 + yy, 5, p[3]); }
  } else {
    tri(img, 13, 39 + yy, 22, 8 + yy, 30, 39 + yy, p[2], 120);
    bodyBox(img, 13, 25 + yy, 21, 13, p[0], p[1], p[2]);
    tri(img, 18 + sx, 22 + yy, 25 + sx + act, 5 + yy, 32 + sx, 22 + yy, p[3]);
    tri(img, 31 + sx, 24 + yy, 44 + sx + act, 28 + dy * 2 + yy, 31 + sx, 34 + yy, p[2]);
    if (!back) { eye(img, 24 + sx, 27 + yy, p[3]); eye(img, 34 + sx, 28 + yy, p[3]); } else rect(img, 17, 21 + yy, 15, 4, p[3]);
    if (name === "infernal") { diamond(img, 18 - dx * 5, 13 + yy, 4, p[3]); diamond(img, 32 + dx * 5, 13 + yy, 4, p[3]); }
  }
}

function drawHero(img, name, frame, dir, action) {
  const p = actorColors[name];
  const { dx, dy, back } = dirInfo(dir);
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 2, 0][frame];
  const sx = dx * (back ? 2 : 6);
  const thrust = ["attack", "dig"].includes(action) ? [0, 4, 10, 4][frame] : 0;
  shadow(img, 24, 40, name === "tank" ? 16 : 13);
  if (name === "warrior") {
    const [tipX, tipY] = aimPoint(24 + sx * 0.7, 19 + bob, dir, 7 + thrust);
    line(img, 24 + sx / 2, 18 + bob, tipX, tipY, "#f8fafc", 3); line(img, tipX - 2, tipY, tipX + 2, tipY, "#fff5cf", 2);
    rect(img, 8 - sx / 3, 22 + bob, 7, 16, "#4a2f10"); rect(img, 10 - sx / 3, 23 + bob, 4, 13, p[2]);
    bodyBox(img, 16, 19 + bob, 17, 16, p[0], p[2], p[3]);
    rect(img, 17 + sx / 3, 10 + bob, 15, 11, p[0]); rect(img, 19 + sx / 3, 11 + bob, 11, 9, p[2]);
    if (!back) rect(img, 24 + sx, 14 + bob, 7, 2, "#101722"); else { rect(img, 16, 10 + bob, 18, 10, "#151a23"); rect(img, 19, 10 + bob, 11, 3, "#fff5cf"); rect(img, 14, 20 + bob, 20, 7, "#384150"); }
    rect(img, 18, 31 + bob, 5, 9, p[1]); rect(img, 28, 31 - bob, 5, 9, p[1]);
  } else if (name === "tank") {
    bodyBox(img, 14, 18 + bob, 22, 18, p[0], p[2], p[3]);
    rect(img, 17 + sx / 3, 8 + bob, 17, 12, p[0]); rect(img, 19 + sx / 3, 9 + bob, 13, 10, p[2]);
    rect(img, 4 + dx * thrust - sx / 3, 14 + bob, 12, 27, "#2f3949"); rect(img, 7 + dx * thrust - sx / 3, 17 + bob, 7, 21, p[2]);
    rect(img, 36 + sx / 3, 22 + bob, 6 + (action === "attack" ? thrust / 2 : 0), 16, "#566070");
    if (!back) rect(img, 23 + sx, 14 + bob, 9, 2, "#0b1018"); else { rect(img, 15, 8 + bob, 20, 14, "#151a23"); rect(img, 18, 12 + bob, 14, 5, "#dce4ef"); rect(img, 12, 20 + bob, 22, 12, "#303743"); }
    rect(img, 16, 31 + bob, 6, 8, p[1]); rect(img, 29, 31 - bob, 6, 8, p[1]);
  } else if (name === "mage") {
    bodyBox(img, 17, 25 + bob, 15, 15, p[0], p[2], p[3]);
    rect(img, 18 + sx / 3, 14 + bob, 12, 11, p[0]); rect(img, 20 + sx / 3, 16 + bob, 8, 9, p[2]);
    tri(img, 14 + sx / 3, 15 + bob, 24 + sx / 3, 5 + bob, 35 + sx / 3, 15 + bob, p[1]);
    const [orbX, orbY] = aimPoint(31 + sx * 0.35, 14 + bob, dir, action === "cast" ? 2 + frame * 2 : 0);
    line(img, 36 + sx, 13 + bob, 35 + sx, 39 + bob, "#6b4a2f", 2);
    diamond(img, orbX, orbY, action === "cast" ? 4 + frame : 5, p[3], 190); diamond(img, orbX, orbY, 2, "#fff7ff");
    if (back) { rect(img, 15, 15 + bob, 20, 21, "#261d57"); rect(img, 18, 9 + bob, 14, 8, p[1]); diamond(img, 24, 8 + bob, 4, p[3]); }
  } else {
    bodyBox(img, 17, 25 + bob, 15, 15, p[1], p[2], p[3]);
    rect(img, 18 + sx / 3, 14 + bob, 12, 11, p[1]); rect(img, 20 + sx / 3, 16 + bob, 8, 9, p[2]);
    rect(img, 23, 22 + bob, 3, 15, "#e8c860"); rect(img, 19, 28 + bob, 11, 3, "#e8c860");
    const halo = action === "heal" ? 9 + frame * 2 : 5;
    diamond(img, 24 + sx / 3, 11 + bob, halo, p[3], action === "heal" ? 190 : 120);
    const [staffX, staffY] = aimPoint(36 + sx, 14 + bob, dir, action === "heal" ? 5 + frame * 2 : 0);
    line(img, staffX, staffY, 35 + sx, 39 + bob, "#cbb78a", 2); rect(img, staffX - 4, staffY, 8, 3, "#e8c860");
    if (back) { rect(img, 15, 15 + bob, 20, 22, "#ede6d0"); rect(img, 20, 10 + bob, 9, 7, "#fff0a8"); rect(img, 18, 24 + bob, 13, 3, "#e8c860"); }
  }
}

function drawEgg(img, name, frame) {
  const kind = name.replace("egg_", ""), p = actorColors[kind] || actorColors.superslime;
  const pulse = [0, -1, 0, 1][frame];
  shadow(img, 24, 38, 10); diamond(img, 24, 26 + pulse, 15, p[0]); diamond(img, 24, 25 + pulse, 12, p[2]); diamond(img, 21, 19 + pulse, 4, p[3], 180); diamond(img, 28, 28 + pulse, 3, p[1]);
}
function drawActor(name, frame, dir, action) {
  const img = image();
  if (name.startsWith("egg_")) drawEgg(img, name, frame);
  else if (heroNames.includes(name)) drawHero(img, name, frame, dir, action);
  else drawMonster(img, name, frame, dir, action);
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
  for (const name of ACTORS) for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("actors", name, f, dir, action), drawActor(name, f, dir, action));
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
console.log("48px 8方向・アクション別ピクセル素材を生成しました。");
