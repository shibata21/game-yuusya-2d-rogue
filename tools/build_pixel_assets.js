"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const actorColors = {
  slime: ["#07140a", "#1e6b2d", "#42b85a", "#8ff39a"],
  carniv: ["#21070a", "#7f2419", "#d55531", "#ff9865"],
  evolved: ["#17050d", "#5b1430", "#9b2f4f", "#ff7fa0"],
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

const dirVec = {
  e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1],
  w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1],
};

function noise(img, seed, colors, count) {
  for (let i = 0; i < count; i++) {
    const x = (i * 19 + seed * 13) % CELL;
    const y = (i * 31 + seed * 5) % CELL;
    const c = colors[(i + seed) % colors.length];
    rect(img, x, y, 1 + (i % 3), 1 + ((i + 1) % 2), c);
  }
}
function crack(img, points, col, width = 2, alpha = 255) {
  for (let i = 1; i < points.length; i++) line(img, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], col, width, alpha);
}
function oreChip(img, x, y, r, dark, mid, light) {
  diamond(img, x, y, r + 2, dark);
  diamond(img, x, y, r, mid);
  diamond(img, x - Math.max(1, Math.floor(r / 3)), y - Math.max(1, Math.floor(r / 3)), Math.max(1, Math.floor(r / 2)), light);
}
function jaggedGlow(img, cx, cy, r, col, alpha) {
  const rays = [
    [[cx - 4, cy - r], [cx + 2, cy - r + 5], [cx + 7, cy - r + 1]],
    [[cx + r - 3, cy - 7], [cx + r - 9, cy - 1], [cx + r - 2, cy + 3]],
    [[cx + r - 5, cy + 9], [cx + r - 13, cy + 6], [cx + r - 9, cy + 15]],
    [[cx + 6, cy + r - 1], [cx, cy + r - 8], [cx - 6, cy + r - 2]],
    [[cx - r + 6, cy + 11], [cx - r + 13, cy + 6], [cx - r + 7, cy + 1]],
    [[cx - r + 3, cy - 6], [cx - r + 11, cy - 2], [cx - r + 8, cy - 12]],
  ];
  for (const pts of rays) {
    line(img, pts[0][0], pts[0][1], pts[1][0], pts[1][1], col, 2, alpha);
    line(img, pts[1][0], pts[1][1], pts[2][0], pts[2][1], col, 2, Math.max(0, alpha - 45));
  }
}

function drawTile(name) {
  const img = image();
  const evo = name.endsWith("_evo");
  const base = name.replace("_evo", "");
  if (base === "earth") {
    rect(img, 0, 0, CELL, CELL, "#5a3822");
    rect(img, 0, 0, CELL, 4, "#7a5131"); rect(img, 0, CELL - 5, CELL, 5, "#2c1a12");
    noise(img, 3, ["#6d4729", "#432615", "#8a6039"], 72);
  } else if (base === "tunnel") {
    rect(img, 0, 0, CELL, CELL, "#24192d");
    rect(img, 0, 0, CELL, 6, "#140d1e"); rect(img, 0, CELL - 6, CELL, 6, "#130d1b");
    rect(img, 0, 0, 4, CELL, "#161020"); rect(img, CELL - 4, 0, 4, CELL, "#161020");
    noise(img, 9, ["#2e2038", "#1b1224", "#3a2b46"], 38);
  } else if (base === "bedrock") {
    rect(img, 0, 0, CELL, CELL, "#120d18");
    for (let i = 0; i < 7; i++) diamond(img, 8 + i * 7, 9 + ((i * 13) % 28), 4 + (i % 3), i % 2 ? "#221a2e" : "#0a0710");
    rect(img, 0, 0, CELL, 2, "#050409");
  } else if (base === "surface") {
    rect(img, 0, 0, CELL, CELL, "#17101f");
    rect(img, 5, 0, CELL - 10, CELL, "#281c32");
    rect(img, 7, 0, CELL - 14, 8, "#443356");
    rect(img, CELL / 2 - 2, 8, 4, CELL - 8, "#0b0711");
  } else if (base === "core") {
    rect(img, 0, 0, CELL, CELL, "#24192d");
    diamond(img, 24, 25, 19, "#160a22"); diamond(img, 24, 23, 14, "#3b1d50"); diamond(img, 24, 23, 9, "#b026ff");
    diamond(img, 24, 23, 4, "#f5e6ff");
    jaggedGlow(img, 24, 23, 22, "#b026ff", 120);
  } else {
    rect(img, 0, 0, CELL, CELL, "#5b3922");
    rect(img, 0, 0, CELL, 4, "#7b5434"); rect(img, 0, CELL - 5, CELL, 5, "#2a1810");
    noise(img, 13, ["#6d4529", "#402413", "#80583b"], 46);
    const vein = {
      moss: ["#2e7d35", "#6fcf6f", "#bdf7bd"],
      meat: ["#7b1515", "#e63a2c", "#ffb39e"],
      venom: ["#4e1d7d", "#a64dff", "#e0bcff"],
      stone: ["#33466b", "#6f86c4", "#bcd0ff"],
      ember: ["#8c3b0c", "#ffae26", "#ffe39a"],
    }[base];
    jaggedGlow(img, 24, 24, evo ? 21 : 17, vein[1], evo ? 120 : 65);
    if (base === "moss") {
      crack(img, [[7,31],[15,28],[21,22],[29,24],[39,18]], "#233418", 3);
      for (const p of [[12,29],[18,24],[24,20],[31,24],[36,18],[24,31]]) diamond(img, p[0], p[1], evo ? 5 : 4, vein[1]);
      for (const p of [[17,21],[28,23],[35,17]]) diamond(img, p[0], p[1], 2, vein[2]);
    } else if (base === "meat") {
      crack(img, [[8,17],[17,22],[24,19],[33,27],[40,24]], "#3b0b0c", 4);
      for (const x of [14, 23, 32]) {
        line(img, x - 4, 16, x + 3, 32, vein[1], evo ? 5 : 4);
        line(img, x + 2, 15, x + 8, 30, vein[2], 2);
        tri(img, x - 3, 31, x + 1, 38, x + 4, 31, "#fff1dc", 230);
      }
    } else if (base === "venom") {
      crack(img, [[9,34],[18,27],[21,18],[30,20],[39,13]], "#28113a", 3);
      for (const p of [[18,22,6],[30,27,7],[25,35,4]]) diamond(img, p[0], p[1], p[2], vein[1]);
      for (const p of [[14,31],[35,17],[25,16],[37,29]]) diamond(img, p[0], p[1], 2, vein[2]);
    } else if (base === "stone") {
      crack(img, [[8,15],[17,22],[27,17],[39,28]], "#202d46", 3);
      oreChip(img, 17, 24, 7, "#172238", vein[1], vein[2]);
      oreChip(img, 30, 27, 6, "#172238", vein[1], vein[2]);
      oreChip(img, 25, 16, 5, "#172238", vein[1], vein[2]);
    } else if (base === "ember") {
      crack(img, [[8,32],[16,24],[22,29],[31,18],[40,25]], "#4a1906", 3);
      tri(img, 13, 33, 20, 12, 28, 33, vein[1]); tri(img, 24, 35, 33, 14, 40, 35, vein[1]);
      tri(img, 20, 33, 25, 20, 31, 33, vein[2]); line(img, 15, 31, 35, 30, "#4a1906", 3, 170);
    }
    if (evo) {
      diamond(img, 12, 12, 3, vein[2]); diamond(img, 36, 12, 3, vein[2]); diamond(img, 24, 38, 3, vein[2]);
      crack(img, [[9,9],[16,14],[24,10],[33,14],[41,10]], vein[2], 2, 180);
    }
  }
  return img;
}

function shadow(img, x, y, w, a = 150) {
  rect(img, x - w, y - 2, w * 2, 4, "#050309", a);
  rect(img, x - Math.floor(w * 0.7), y - 3, Math.floor(w * 1.4), 2, "#050309", Math.max(0, a - 40));
}
function eye(img, x, y, col = "#fff7c7") { rect(img, x, y, 4, 4, "#09060a"); rect(img, x + 1, y, 1, 1, col); }
function bodyBox(img, x, y, w, h, dark, mid, light) {
  rect(img, x - 2, y - 2, w + 4, h + 4, dark);
  rect(img, x, y, w, h, mid);
  rect(img, x + 2, y, Math.max(2, w - 4), 3, light);
}
function dirInfo(dir) {
  const [dx, dy] = dirVec[dir];
  return { dx, dy, side: dx !== 0, back: dy < 0, front: dy > 0, diag: dx !== 0 && dy !== 0 };
}

function drawMonster(img, name, frame, dir) {
  const p = actorColors[name] || actorColors.slime;
  const { dx, dy, back, front } = dirInfo(dir);
  const step = [0, 1, 0, -1][frame];
  const bounce = [0, -1, 0, 1][frame];
  const sx = dx * (front ? 2 : back ? 1 : 4);
  shadow(img, 24, 40, name === "golem" || name === "titan" ? 17 : 14);
  if (name === "slime" || name === "superslime") {
    bodyBox(img, 11, 22 + bounce, 25, 15, p[0], p[1], p[2]);
    diamond(img, 26 + sx, 21 + dy * 3 + bounce, 10, p[2]);
    if (!back) { eye(img, 25 + sx + step, 25 + bounce); eye(img, 33 + sx + step, 25 + bounce); }
    else { rect(img, 18, 22 + bounce, 20, 4, p[3]); }
    if (name === "superslime") { jaggedGlow(img, 25, 25 + bounce, 20, p[2], 130); diamond(img, 30 + sx, 12 + bounce, 3, p[3]); }
  } else if (name === "carniv" || name === "evolved") {
    bodyBox(img, 8, 19 + bounce, 27, 15, p[0], p[1], p[2]);
    tri(img, 30 + sx, 18 + dy * 2 + bounce, 44 + sx, 24 + dy * 3 + bounce, 30 + sx, 31 + bounce, p[1]);
    tri(img, 35 + sx, 21 + bounce, 45 + sx, 24 + bounce, 35 + sx, 28 + bounce, p[0]);
    for (const x of [16, 24, 35]) tri(img, x - 3, 31 + bounce, x, 40 + bounce, x + 3, 31 + bounce, "#fff7ee");
    if (!back) { eye(img, 26 + sx + step, 22 + bounce, "#ffcf4d"); eye(img, 35 + sx + step, 24 + bounce, "#ffcf4d"); }
    if (name === "evolved") { jaggedGlow(img, 25, 23 + bounce, 22, p[2], 125); rect(img, 22 + sx, 11 + bounce, 10, 3, p[3]); }
  } else if (name === "spitter" || name === "tarantula") {
    bodyBox(img, 11, 21 + bounce, 23, 15, p[0], p[1], p[2]);
    rect(img, 29 + sx, 22 + dy * 2 + bounce, 10, 6, p[2]); diamond(img, 40 + sx, 25 + dy * 2 + bounce, 4, p[3], 220);
    for (const y of [27, 31, 35]) { line(img, 13, y + bounce, 6, y + 3 + bounce, p[0], 2); line(img, 31, y + bounce, 39, y + 3 + bounce, p[0], 2); }
    if (!back) { eye(img, 19 + sx + step, 23 + bounce, "#dfffe0"); eye(img, 26 + sx + step, 23 + bounce, "#dfffe0"); }
    if (name === "tarantula") { diamond(img, 22 + sx, 14 + bounce, 4, p[3]); jaggedGlow(img, 22, 26 + bounce, 19, p[2], 125); }
  } else if (name === "golem" || name === "titan") {
    bodyBox(img, 10, 18 + bounce, 26, 20, p[0], p[1], p[2]);
    rect(img, 5, 23 + bounce, 7, 14, p[1]); rect(img, 34, 21 + bounce, 8, 15, p[1]);
    tri(img, 34 + sx, 20 + dy * 2 + bounce, 43 + sx, 24 + dy * 3 + bounce, 34 + sx, 29 + bounce, p[2]);
    if (!back) { eye(img, 27 + sx + step, 23 + bounce, p[3]); eye(img, 35 + sx + step, 24 + bounce, p[3]); }
    else { rect(img, 18, 18 + bounce, 14, 4, p[2]); }
    if (name === "titan") { diamond(img, 27 + sx, 10 + bounce, 5, p[3]); jaggedGlow(img, 25, 25 + bounce, 22, p[2], 115); }
  } else if (name === "flame" || name === "infernal") {
    tri(img, 13, 38 + bounce, 22, 8 + bounce, 30, 38 + bounce, p[2], 105);
    bodyBox(img, 13, 25 + bounce, 21, 13, p[0], p[1], p[2]);
    tri(img, 18 + sx, 22 + bounce, 25 + sx, 6 + bounce, 32 + sx, 22 + bounce, p[3]);
    tri(img, 32 + sx, 24 + bounce, 43 + sx, 28 + dy * 2 + bounce, 32 + sx, 33 + bounce, p[2]);
    if (!back) { eye(img, 25 + sx + step, 27 + bounce, p[3]); eye(img, 34 + sx + step, 28 + bounce, p[3]); }
    if (name === "infernal") { jaggedGlow(img, 25, 24 + bounce, 22, p[2], 125); diamond(img, 29 + sx, 12 + bounce, 3, p[3]); }
  }
}

function drawHero(img, name, frame, dir) {
  const p = actorColors[name];
  const { dx, dy, back } = dirInfo(dir);
  const step = [0, 1, 0, -1][frame];
  const bounce = [0, -1, 0, 1][frame];
  const sx = dx * (back ? 1 : 4);
  shadow(img, 24, 40, name === "tank" ? 16 : 13);
  if (name === "warrior") {
    line(img, 34 + sx, 12 + bounce, 39 + sx, 35 + bounce, "#f1f5f9", 3);
    rect(img, 8 - sx / 2, 22 + bounce, 7, 16, "#4a2f10"); rect(img, 10 - sx / 2, 23 + bounce, 4, 13, p[2]);
    rect(img, 18, 30 + bounce, 5, 9, p[1]); rect(img, 27, 30 - bounce, 5, 9, p[1]);
    bodyBox(img, 16, 19 + bounce, 17, 16, p[0], p[2], p[3]);
    rect(img, 17 + sx / 2, 10 + bounce, 15, 11, p[0]); rect(img, 19 + sx / 2, 11 + bounce, 11, 9, p[2]);
    if (!back) rect(img, 24 + sx + step, 14 + bounce, 6, 2, "#101722");
    rect(img, 23 + sx / 2, 6 + bounce, 3, 6, "#e0556b");
  } else if (name === "tank") {
    rect(img, 16, 31 + bounce, 6, 8, p[1]); rect(img, 28, 31 - bounce, 6, 8, p[1]);
    bodyBox(img, 14, 18 + bounce, 22, 18, p[0], p[2], p[3]);
    rect(img, 17 + sx / 2, 8 + bounce, 17, 12, p[0]); rect(img, 19 + sx / 2, 9 + bounce, 13, 10, p[2]);
    tri(img, 17 + sx / 2, 9 + bounce, 13 + sx / 2, 5 + bounce, 21 + sx / 2, 9 + bounce, "#dce4ef");
    rect(img, 5 - sx / 2, 15 + bounce, 10, 25, "#2f3949"); rect(img, 7 - sx / 2, 17 + bounce, 6, 20, p[2]);
    rect(img, 36 + sx / 2, 23 + bounce, 5, 15, "#566070");
    if (!back) rect(img, 23 + sx + step, 14 + bounce, 9, 2, "#0b1018");
  } else if (name === "mage") {
    bodyBox(img, 17, 25 + bounce, 15, 15, p[0], p[2], p[3]);
    rect(img, 18 + sx / 2, 14 + bounce, 12, 11, p[0]); rect(img, 20 + sx / 2, 16 + bounce, 8, 9, p[2]);
    tri(img, 14 + sx / 2, 15 + bounce, 24 + sx / 2, 5 + bounce, 35 + sx / 2, 15 + bounce, p[1]);
    line(img, 36 + sx, 13 + bounce, 35 + sx, 38 + bounce, "#6b4a2f", 2);
    diamond(img, 36 + sx, 13 + bounce, 7, p[3], 180); diamond(img, 36 + sx, 13 + bounce, 3, "#fff7ff");
  } else if (name === "priest") {
    diamond(img, 24 + sx / 2, 12 + bounce, 7, p[3], 180);
    bodyBox(img, 17, 25 + bounce, 15, 15, p[1], p[2], p[3]);
    rect(img, 18 + sx / 2, 14 + bounce, 12, 11, p[1]); rect(img, 20 + sx / 2, 16 + bounce, 8, 9, p[2]);
    rect(img, 23, 22 + bounce, 3, 15, "#e8c860"); rect(img, 19, 28 + bounce, 11, 3, "#e8c860");
    line(img, 36 + sx, 13 + bounce, 35 + sx, 38 + bounce, "#cbb78a", 2); rect(img, 32 + sx, 13 + bounce, 8, 3, "#e8c860");
  }
}

function drawEgg(img, name, frame) {
  const kind = name.replace("egg_", "");
  const p = actorColors[kind] || actorColors.superslime;
  const pulse = [0, -1, 0, 1][frame];
  shadow(img, 24, 38, 10);
  diamond(img, 24, 26 + pulse, 15, p[0]);
  diamond(img, 24, 25 + pulse, 12, p[2]);
  diamond(img, 21, 19 + pulse, 4, p[3], 180);
  diamond(img, 28, 28 + pulse, 3, p[1]);
}

function drawActor(name, frame, dir) {
  const img = image();
  if (name.startsWith("egg_")) drawEgg(img, name, frame);
  else if (["warrior", "tank", "mage", "priest"].includes(name)) drawHero(img, name, frame, dir);
  else drawMonster(img, name, frame, dir);
  return img;
}

function drawEffect(name, frame) {
  const img = image();
  const t = frame / (FRAMES - 1);
  if (name === "slash") {
    line(img, 10, 31 - t * 10, 38, 17 + t * 8, "#fff4e8", 6, 230 - frame * 35);
    line(img, 12, 34 - t * 10, 36, 20 + t * 8, "#c8cbd4", 3, 210 - frame * 35);
  } else if (name === "shot") {
    diamond(img, 14 + frame * 6, 24, 5 + frame, "#b6a6ff", 190);
    diamond(img, 18 + frame * 6, 24, 3, "#fff7ff", 230);
    line(img, 5, 24, 15 + frame * 5, 24, "#6a5acd", 2, 120);
  } else if (name === "bite") {
    tri(img, 14, 18 + frame, 24, 24, 14, 30 - frame, "#fff7ee", 220 - frame * 35);
    tri(img, 34, 18 + frame, 24, 24, 34, 30 - frame, "#fff7ee", 220 - frame * 35);
    rect(img, 22, 22, 4, 4, "#e0556b", 160);
  } else if (name === "birth") {
    const spread = 5 + frame * 5;
    const shards = [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[-1,0],[1,0]];
    for (let i = 0; i < shards.length; i++) diamond(img, 24 + shards[i][0] * spread + (i % 2), 24 + shards[i][1] * spread + ((i + frame) % 3) - 1, 2, "#fff0a8", 200 - frame * 40);
    jaggedGlow(img, 24, 24, 8 + frame * 5, "#8ff39a", 220 - frame * 42);
  } else if (name === "puff") {
    for (let i = 0; i < 8; i++) diamond(img, 24 + Math.cos(i) * (4 + frame * 4), 24 + Math.sin(i * 2) * (3 + frame * 4), 4 + frame, "#cfd8e3", 180 - frame * 35);
  }
  return img;
}

function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("actors", name, f, dir), drawActor(name, f, dir));
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("effects", name, f), drawEffect(name, f));
}

function writeAtlas() {
  ensureDir(OUT_DIR);
  const actors = image(CELL * FRAMES * DIRECTIONS.length, CELL * ACTORS.length);
  ACTORS.forEach((name, row) => {
    DIRECTIONS.forEach((dir, di) => {
      for (let f = 0; f < FRAMES; f++) copyInto(actors, readPng(spritePath("actors", name, f, dir)), (di * FRAMES + f) * CELL, row * CELL);
    });
  });
  writePng(path.join(OUT_DIR, "actors.png"), actors);

  const tiles = image(CELL * TILES.length, CELL);
  TILES.forEach((name, col) => copyInto(tiles, readPng(spritePath("tiles", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "tiles.png"), tiles);

  const effects = image(CELL * FRAMES, CELL * EFFECTS.length);
  EFFECTS.forEach((name, row) => {
    for (let f = 0; f < FRAMES; f++) copyInto(effects, readPng(spritePath("effects", name, f)), f * CELL, row * CELL);
  });
  writePng(path.join(OUT_DIR, "effects.png"), effects);
}

function writeMeta() {
  const meta = { cell: CELL, frames: FRAMES, directions: DIRECTIONS, actors: {}, tiles: {}, effects: {} };
  ACTORS.forEach((name, row) => {
    meta.actors[name] = { sheet: "actors", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, directions: DIRECTIONS.length, anchor: [CELL / 2, Math.round(CELL * 0.75)] };
  });
  TILES.forEach((name, col) => {
    meta.tiles[name] = { sheet: "tiles", x: col * CELL, y: 0, w: CELL, h: CELL };
  });
  EFFECTS.forEach((name, row) => {
    meta.effects[name] = { sheet: "effects", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, anchor: [CELL / 2, CELL / 2] };
  });
  fs.writeFileSync(path.join(OUT_DIR, "sprites.json"), JSON.stringify(meta, null, 2) + "\n");
}

writeSourceFrames();
writeAtlas();
writeMeta();
console.log("48px 8方向ピクセル素材を生成しました。");
