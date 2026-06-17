"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rect, ellipse, ring, diamond, line, tri, copyInto, spritePath,
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

function noise(img, seed, colors, count) {
  for (let i = 0; i < count; i++) {
    const x = (i * 19 + seed * 13) % CELL;
    const y = (i * 31 + seed * 5) % CELL;
    const c = colors[(i + seed) % colors.length];
    rect(img, x, y, 1 + (i % 3), 1 + ((i + 1) % 2), c);
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
    diamond(img, 24, 25, 18, "#160a22"); diamond(img, 24, 23, 14, "#3b1d50"); diamond(img, 24, 23, 9, "#b026ff");
    diamond(img, 24, 23, 4, "#f5e6ff"); ring(img, 24, 23, 20, 20, 3, "#b026ff", 95);
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
    const glow = evo ? 150 : 80;
    ring(img, 24, 24, 18, 13, 2, vein[1], glow);
    if (base === "moss") {
      for (const p of [[14,18],[23,14],[31,20],[18,29],[29,31],[24,24]]) ellipse(img, p[0], p[1], evo ? 5 : 4, evo ? 4 : 3, vein[1]);
      ellipse(img, 24, 24, 3, 3, vein[2]);
    } else if (base === "meat") {
      for (const x of [15, 24, 33]) { line(img, x - 5, 16, x, 32, vein[1], evo ? 4 : 3); line(img, x + 5, 16, x, 32, vein[2], 2); }
    } else if (base === "venom") {
      ellipse(img, 19, 20, 5, 7, vein[1]); ellipse(img, 30, 25, 6, 8, vein[1]); ellipse(img, 24, 32, 3, 3, vein[2]);
      for (const p of [[15,31],[34,17],[25,17]]) ellipse(img, p[0], p[1], 2, 2, vein[2]);
    } else if (base === "stone") {
      diamond(img, 18, 23, 8, vein[1]); diamond(img, 30, 26, 7, vein[1]); diamond(img, 25, 16, 5, vein[2]);
    } else if (base === "ember") {
      tri(img, 15, 32, 21, 13, 27, 32, vein[1]); tri(img, 25, 34, 33, 15, 38, 34, vein[1]); tri(img, 21, 32, 25, 20, 30, 32, vein[2]);
    }
    if (evo) {
      ring(img, 24, 24, 21, 16, 2, vein[2], 170);
      diamond(img, 12, 12, 3, vein[2]); diamond(img, 36, 12, 3, vein[2]); diamond(img, 24, 38, 3, vein[2]);
    }
  }
  return img;
}

function shadow(img, x, y, w, a = 150) { ellipse(img, x, y, w, 4, "#050309", a); }
function eye(img, x, y, c = "#fff7c7") { rect(img, x, y, 4, 4, "#09060a"); rect(img, x + 1, y, 1, 1, c); }
function outlineEllipse(img, x, y, rx, ry, dark) { ellipse(img, x, y, rx + 2, ry + 2, dark); }

function drawMonster(img, name, frame) {
  const p = actorColors[name] || actorColors.slime;
  const sway = [0, 1, 0, -1][frame];
  const bounce = [0, -1, 0, 1][frame];
  shadow(img, 24, 39, name === "golem" || name === "titan" ? 17 : 14);
  if (name === "slime" || name === "superslime") {
    outlineEllipse(img, 24, 28 + bounce, 15, 11, p[0]);
    ellipse(img, 24, 29 + bounce, 14, 10, p[1]); ellipse(img, 24, 24 + bounce, 11, 9, p[2]);
    rect(img, 15, 21 + bounce, 18, 3, p[3]); eye(img, 18 + sway, 25 + bounce); eye(img, 27 + sway, 25 + bounce);
    if (name === "superslime") { ring(img, 24, 25 + bounce, 18, 15, 2, p[2], 130); diamond(img, 24, 13 + bounce, 3, p[3]); }
  } else if (name === "carniv" || name === "evolved") {
    rect(img, 9, 29 + bounce, 30, 7, p[0]); rect(img, 10, 18 + bounce, 28, 15, p[1]); rect(img, 13, 14 + bounce, 22, 6, p[2]);
    rect(img, 7, 16 + bounce, 5, 10, p[0]); rect(img, 36, 16 + bounce, 5, 10, p[0]);
    for (const x of [16, 23, 31]) tri(img, x - 3, 31 + bounce, x, 39 + bounce, x + 3, 31 + bounce, "#fff7ee");
    eye(img, 16 + sway, 23 + bounce, "#ffcf4d"); eye(img, 29 + sway, 23 + bounce, "#ffcf4d");
    if (name === "evolved") { ring(img, 24, 23 + bounce, 21, 16, 2, p[2], 120); rect(img, 20, 12 + bounce, 8, 3, p[3]); }
  } else if (name === "spitter" || name === "tarantula") {
    outlineEllipse(img, 22, 27 + bounce, 13, 11, p[0]); ellipse(img, 22, 28 + bounce, 12, 10, p[1]); ellipse(img, 22, 22 + bounce, 10, 8, p[2]);
    rect(img, 31, 23 + bounce, 9, 5, p[2]); ellipse(img, 41, 26 + bounce, 3, 3, p[3], 220);
    for (const y of [27, 31, 35]) { line(img, 13, y + bounce, 6, y + 3 + bounce, p[0], 2); line(img, 31, y + bounce, 39, y + 3 + bounce, p[0], 2); }
    eye(img, 18 + sway, 23 + bounce, "#dfffe0"); eye(img, 25 + sway, 23 + bounce, "#dfffe0");
    if (name === "tarantula") { diamond(img, 22, 14 + bounce, 4, p[3]); ring(img, 22, 26 + bounce, 18, 14, 2, p[2], 120); }
  } else if (name === "golem" || name === "titan") {
    rect(img, 10, 16 + bounce, 28, 22, p[0]); rect(img, 13, 13 + bounce, 22, 6, p[2]); rect(img, 12, 18 + bounce, 24, 17, p[1]);
    rect(img, 5, 22 + bounce, 7, 14, p[1]); rect(img, 36, 22 + bounce, 7, 14, p[1]); rect(img, 21, 18 + bounce, 6, 18, p[0]);
    eye(img, 17 + sway, 23 + bounce, p[3]); eye(img, 29 + sway, 23 + bounce, p[3]);
    if (name === "titan") { diamond(img, 24, 10 + bounce, 5, p[3]); ring(img, 24, 25 + bounce, 20, 18, 2, p[2], 110); }
  } else if (name === "flame" || name === "infernal") {
    ellipse(img, 24, 25 + bounce, 18, 18, p[2], 75);
    rect(img, 14, 25 + bounce, 20, 13, p[0]); rect(img, 16, 21 + bounce, 16, 10, p[1]);
    tri(img, 17 + sway, 22 + bounce, 22, 8 + bounce, 27, 22 + bounce, p[2]); tri(img, 23, 20 + bounce, 28, 5 + bounce, 34, 22 + bounce, p[3]);
    eye(img, 18 + sway, 27 + bounce, p[3]); eye(img, 28 + sway, 27 + bounce, p[3]);
    if (name === "infernal") { ring(img, 24, 24 + bounce, 20, 20, 2, p[2], 120); diamond(img, 24, 12 + bounce, 3, p[3]); }
  }
}

function drawHero(img, name, frame) {
  const p = actorColors[name];
  const step = [0, 1, 0, -1][frame];
  const bounce = [0, -1, 0, 1][frame];
  shadow(img, 24, 40, name === "tank" ? 16 : 13);
  if (name === "warrior") {
    line(img, 35, 14 + bounce, 37, 35 + bounce, "#f1f5f9", 3); rect(img, 8, 22 + bounce, 7, 16, "#4a2f10"); rect(img, 10, 23 + bounce, 4, 13, p[2]);
    rect(img, 18, 30 + bounce, 5, 9, p[1]); rect(img, 27, 30 - bounce, 5, 9, p[1]);
    rect(img, 16, 19 + bounce, 17, 16, p[0]); rect(img, 18, 20 + bounce, 13, 13, p[2]); rect(img, 17, 10 + bounce, 15, 11, p[0]); rect(img, 19, 11 + bounce, 11, 9, p[2]);
    rect(img, 21 + step, 14 + bounce, 6, 2, "#101722"); rect(img, 23, 6 + bounce, 3, 6, "#e0556b");
  } else if (name === "tank") {
    rect(img, 16, 31 + bounce, 6, 8, p[1]); rect(img, 28, 31 - bounce, 6, 8, p[1]);
    rect(img, 14, 18 + bounce, 22, 18, p[0]); rect(img, 16, 19 + bounce, 18, 15, p[2]); rect(img, 17, 8 + bounce, 16, 12, p[0]); rect(img, 19, 9 + bounce, 12, 10, p[2]);
    rect(img, 5, 15 + bounce, 10, 25, "#2f3949"); rect(img, 7, 17 + bounce, 6, 20, p[2]); rect(img, 36, 23 + bounce, 5, 15, "#566070");
    rect(img, 20, 14 + bounce, 9, 2, "#0b1018");
  } else if (name === "mage") {
    rect(img, 17, 25 + bounce, 15, 15, p[0]); rect(img, 19, 25 + bounce, 11, 13, p[2]);
    rect(img, 18, 14 + bounce, 12, 11, p[0]); rect(img, 20, 16 + bounce, 8, 9, p[2]); tri(img, 14, 15 + bounce, 24, 5 + bounce, 35, 15 + bounce, p[1]);
    line(img, 36, 13 + bounce, 35, 38 + bounce, "#6b4a2f", 2); ellipse(img, 36, 13 + bounce, 6, 6, p[3], 180); diamond(img, 36, 13 + bounce, 2, "#fff7ff");
  } else if (name === "priest") {
    ring(img, 24, 12 + bounce, 7, 3, 2, p[3], 190); ellipse(img, 24, 25 + bounce, 18, 18, p[3], 45);
    rect(img, 17, 25 + bounce, 15, 15, p[1]); rect(img, 19, 25 + bounce, 11, 13, p[2]);
    rect(img, 18, 14 + bounce, 12, 11, p[1]); rect(img, 20, 16 + bounce, 8, 9, p[2]); rect(img, 23, 22 + bounce, 3, 15, "#e8c860"); rect(img, 19, 28 + bounce, 11, 3, "#e8c860");
    line(img, 36, 13 + bounce, 35, 38 + bounce, "#cbb78a", 2); rect(img, 32, 13 + bounce, 8, 3, "#e8c860");
  }
}

function drawEgg(img, name, frame) {
  const kind = name.replace("egg_", "");
  const p = actorColors[kind] || actorColors.superslime;
  const pulse = [0, -1, 0, 1][frame];
  shadow(img, 24, 38, 10);
  ellipse(img, 24, 26 + pulse, 11, 15, p[0]); ellipse(img, 24, 25 + pulse, 9, 13, p[2]);
  ellipse(img, 21, 19 + pulse, 3, 4, p[3], 180); diamond(img, 28, 28 + pulse, 3, p[1]);
  ring(img, 24, 25 + pulse, 12, 16, 2, p[3], 90);
}

function drawActor(name, frame) {
  const img = image();
  if (name.startsWith("egg_")) drawEgg(img, name, frame);
  else if (["warrior", "tank", "mage", "priest"].includes(name)) drawHero(img, name, frame);
  else drawMonster(img, name, frame);
  return img;
}

function drawEffect(name, frame) {
  const img = image();
  const t = frame / (FRAMES - 1);
  if (name === "slash") {
    line(img, 10, 31 - t * 10, 38, 17 + t * 8, "#fff4e8", 6, 230 - frame * 35);
    line(img, 12, 34 - t * 10, 36, 20 + t * 8, "#c8cbd4", 3, 210 - frame * 35);
  } else if (name === "shot") {
    ellipse(img, 14 + frame * 6, 24, 5 + frame, 3, "#b6a6ff", 190);
    ellipse(img, 18 + frame * 6, 24, 3, 2, "#fff7ff", 230);
    line(img, 5, 24, 15 + frame * 5, 24, "#6a5acd", 2, 120);
  } else if (name === "bite") {
    ring(img, 20 - frame, 24, 8 + frame, 8 + frame, 2, "#fff7ee", 220 - frame * 35);
    ring(img, 28 + frame, 24, 8 + frame, 8 + frame, 2, "#fff7ee", 220 - frame * 35);
    rect(img, 22, 22, 4, 4, "#e0556b", 160);
  } else if (name === "birth") {
    ring(img, 24, 24, 8 + frame * 5, 8 + frame * 5, 2, "#8ff39a", 230 - frame * 42);
    for (let i = 0; i < 7; i++) diamond(img, 24 + Math.cos(i) * (6 + frame * 5), 24 + Math.sin(i * 1.7) * (6 + frame * 5), 2, "#fff0a8", 200 - frame * 40);
  } else if (name === "puff") {
    for (let i = 0; i < 8; i++) ellipse(img, 24 + Math.cos(i) * (4 + frame * 4), 24 + Math.sin(i * 2) * (3 + frame * 4), 4 + frame, 3 + frame, "#cfd8e3", 180 - frame * 35);
  }
  return img;
}

function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("actors", name, f), drawActor(name, f));
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("effects", name, f), drawEffect(name, f));
}

function writeAtlas() {
  ensureDir(OUT_DIR);
  const actors = image(CELL * FRAMES, CELL * ACTORS.length);
  ACTORS.forEach((name, row) => {
    for (let f = 0; f < FRAMES; f++) copyInto(actors, readPng(spritePath("actors", name, f)), f * CELL, row * CELL);
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
  const meta = { cell: CELL, frames: FRAMES, actors: {}, tiles: {}, effects: {} };
  ACTORS.forEach((name, row) => {
    meta.actors[name] = { sheet: "actors", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, anchor: [CELL / 2, Math.round(CELL * 0.75)] };
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
console.log("48pxピクセル素材を生成しました。");
