"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS, AMULET_ICONS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const heroNames = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "priest", "saint", "mage", "supermage", "sage"];
const dirVec = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };
const eliteBase = {
  superslime: "slime", crownslime: "slime",
  evolved: "carniv", direfang: "carniv",
  tarantula: "spitter", goldweaver: "spitter",
  titan: "golem", goldcore: "golem",
  infernal: "flame", whiteflame: "flame",
};

const monsterPalettes = {
  slime: { dark: "#24572b", mid: "#66bf68", light: "#c7f7c7", eye: "#101926" },
  superslime: { dark: "#7a1c28", mid: "#e84a4a", light: "#ffd0d0", eye: "#200a10" },
  carniv: { dark: "#5a2518", mid: "#c66a37", light: "#f2b078", eye: "#fff0c8" },
  evolved: { dark: "#391020", mid: "#9b2f4f", light: "#e392b0", eye: "#ffe4a8" },
  spitter: { dark: "#2b1a52", mid: "#7c45d6", light: "#caa6ff", eye: "#adff8e" },
  tarantula: { dark: "#592018", mid: "#d95345", light: "#ffb6a6", eye: "#fff0c8" },
  golem: { dark: "#27324f", mid: "#657dad", light: "#aec5ef", eye: "#d9ecff" },
  titan: { dark: "#5e4527", mid: "#c29b61", light: "#f0d8a6", eye: "#fff6d8" },
  flame: { dark: "#7a1e08", mid: "#ff7a24", light: "#ffe06a", eye: "#fff7c2" },
  infernal: { dark: "#16345d", mid: "#4aa6ff", light: "#c9efff", eye: "#fff7d2" },
  crownslime: { dark: "#6a4524", mid: "#d4a53d", light: "#fff0a6", eye: "#2a1608" },
  direfang: { dark: "#221313", mid: "#5f2020", light: "#e8a978", eye: "#ffe4a8" },
  goldweaver: { dark: "#3e2b18", mid: "#c6952c", light: "#ffe8a0", eye: "#c9ff9a" },
  goldcore: { dark: "#4e3d1b", mid: "#d0a248", light: "#fff2aa", eye: "#fff6d8" },
  whiteflame: { dark: "#154b56", mid: "#f3f7ff", light: "#fff6b7", eye: "#65f4ff" },
  reaper: { dark: "#121520", mid: "#3b4252", light: "#c9d8e8", eye: "#b7f5ff" },
  chimera: { dark: "#52251c", mid: "#b65a3b", light: "#ffd08a", eye: "#d8ff68" },
};

const heroPalettes = {
  warrior: { dark: "#27324f", mid: "#476fb8", light: "#b9d4ff", skin: "#e8b18a", metal: "#edf3ff", accent: "#ffcf4d", weapon: "sword" },
  superwarrior: { dark: "#293a31", mid: "#4f9a63", light: "#bdf0c7", skin: "#e8b18a", metal: "#edf3ff", accent: "#ffdf6b", weapon: "spear" },
  ultrawarrior: { dark: "#26314a", mid: "#4f78d0", light: "#d7e6ff", skin: "#e8b18a", metal: "#f3f7ff", accent: "#73d6ff", weapon: "sword_shield" },
  tank: { dark: "#30343d", mid: "#68717d", light: "#d0d8e2", skin: "#d9a37c", metal: "#f4f6fa", accent: "#7bd96b", weapon: "greatshield" },
  crossknight: { dark: "#2d3342", mid: "#6d768b", light: "#dce4ef", skin: "#e2aa82", metal: "#f7f7f0", accent: "#ff5d5d", weapon: "cross_shield" },
  captain: { dark: "#493414", mid: "#bc8d2b", light: "#ffe3a3", skin: "#e8b18a", metal: "#fff2bd", accent: "#ffd24a", weapon: "gold_sword_shield" },
  priest: { dark: "#4c3d23", mid: "#d9c68a", light: "#fff4c7", skin: "#e6b089", metal: "#ffffff", accent: "#9effa0", weapon: "rod" },
  saint: { dark: "#3d3157", mid: "#d9d0ef", light: "#fff8ff", skin: "#e8b18a", metal: "#ffffff", accent: "#9effc3", weapon: "saint_rod", robe: true },
  mage: { dark: "#40205f", mid: "#8a45c4", light: "#e3c0ff", skin: "#e9b58f", metal: "#f0dcff", accent: "#86d8ff", weapon: "staff" },
  supermage: { dark: "#203456", mid: "#4d74c8", light: "#c6dcff", skin: "#e9b58f", metal: "#d8ecff", accent: "#6ff0ff", weapon: "gem_staff" },
  sage: { dark: "#293047", mid: "#91b885", light: "#efffd0", skin: "#e9b58f", metal: "#fff7d0", accent: "#fff06a", weapon: "glow_staff" },
  max: { dark: "#07080c", mid: "#171b24", light: "#303849", skin: "#d39a73", metal: "#dbe4ef", accent: "#1f1f27", weapon: "fist" },
  shon: { dark: "#20242f", mid: "#5c6978", light: "#c4d1dd", skin: "#e0aa80", metal: "#e8edf2", accent: "#ffcf4d", weapon: "handgun" },
  hori: { dark: "#51332b", mid: "#b56f55", light: "#f3c092", skin: "#e3a679", metal: "#d8dde4", accent: "#8ed36f", weapon: "rocket" },
};

const eggPalette = {
  egg_spitter: ["#eadbff", "#a64dff", "#fff7ff", "#3a195f"],
  egg_golem: ["#d8e3ff", "#6f86c4", "#f8fbff", "#2b3854"],
  egg_flame: ["#ffd6a3", "#ff8a3a", "#fff4bc", "#702b0a"],
  egg_tarantula: ["#ffd1c8", "#ff6b5a", "#fff7ef", "#873226"],
  egg_titan: ["#efe0bf", "#d9b27a", "#fff9dc", "#6c5430"],
  egg_infernal: ["#cae8ff", "#5ab0ff", "#f1fbff", "#185179"],
  egg_goldweaver: ["#fff0c0", "#c6952c", "#fffaf0", "#5d3f12"],
  egg_goldcore: ["#ffe8a8", "#d0a248", "#fff7d4", "#644a18"],
  egg_whiteflame: ["#f2fbff", "#9ee8ff", "#fff9c8", "#1a5560"],
};

const eggMotif = {
  egg_spitter: { base: "venom", evo: false },
  egg_golem: { base: "stone", evo: false },
  egg_flame: { base: "ember", evo: false },
  egg_tarantula: { base: "venom", evo: true },
  egg_titan: { base: "stone", evo: true },
  egg_infernal: { base: "ember", evo: true },
  egg_goldweaver: { base: "venom", evo: true },
  egg_goldcore: { base: "stone", evo: true },
  egg_whiteflame: { base: "ember", evo: true },
};

const veinPalette = {
  moss: { dark: "#24572b", mid: "#66bf68", light: "#c7f7c7", spark: "#eaffd8", shape: "spots" },
  meat: { dark: "#6c1f16", mid: "#d65b38", light: "#ffb38a", spark: "#ffe0c6", shape: "fang" },
  venom: { dark: "#3a195f", mid: "#8c55e6", light: "#d8b7ff", spark: "#f5e7ff", shape: "drop" },
  stone: { dark: "#2b3854", mid: "#6f86c4", light: "#c5d8ff", spark: "#edf4ff", shape: "rock" },
  ember: { dark: "#702b0a", mid: "#ff9822", light: "#ffe38a", spark: "#fff5bc", shape: "ember" },
};

function oval(img, cx, cy, rx, ry, hex, alpha = 255) {
  const c = rgba(hex, alpha);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) setPx(img, x, y, c);
    }
  }
}

function clearCellEdge(img) {
  for (let x = 0; x < img.width; x++) {
    img.data[x * 4 + 3] = 0;
    img.data[((img.height - 1) * img.width + x) * 4 + 3] = 0;
  }
  for (let y = 0; y < img.height; y++) {
    img.data[(y * img.width) * 4 + 3] = 0;
    img.data[(y * img.width + img.width - 1) * 4 + 3] = 0;
  }
}

function noise(img, seed, colors, count, alpha = 255) {
  for (let i = 0; i < count; i++) {
    const x = 2 + ((i * 17 + seed * 13) % (CELL - 4));
    const y = 2 + ((i * 29 + seed * 7) % (CELL - 4));
    const w = 1 + ((i + seed) % 3);
    const h = 1 + ((i * 3 + seed) % 2);
    rect(img, x, y, w, h, colors[(i + seed) % colors.length], alpha);
  }
}

function drawEarthBase() {
  const img = image();
  rect(img, 0, 0, CELL, CELL, "#3d281e");
  rect(img, 0, 0, CELL, 11, "#553822");
  rect(img, 0, 11, CELL, 14, "#4a3021");
  rect(img, 0, 25, CELL, 12, "#43291e");
  rect(img, 0, 37, CELL, 11, "#342119");
  noise(img, 3, ["#6b4729", "#2b1b16", "#5a3822", "#7b5635"], 76, 150);
  for (let y = 10; y < CELL; y += 11) line(img, 2, y, 45, y + ((y / 11) % 2 ? -2 : 2), "#2a1a15", 1, 80);
  return img;
}

function drawTunnel() {
  const img = image();
  rect(img, 0, 0, CELL, CELL, "#211729");
  rect(img, 2, 2, 44, 44, "#2b2131");
  noise(img, 8, ["#403243", "#17101d", "#55404f"], 80, 155);
  line(img, 4, 35, 43, 31, "#15101c", 2, 130);
  return img;
}

function drawBedrock() {
  const img = image();
  rect(img, 0, 0, CELL, CELL, "#12101a");
  for (let y = 0; y < CELL; y += 12) {
    for (let x = (y / 12) % 2 ? -8 : 0; x < CELL; x += 18) {
      rect(img, x, y, 17, 11, "#252232", 230);
      line(img, x + 1, y + 1, x + 15, y + 1, "#40394e", 1, 120);
    }
  }
  noise(img, 11, ["#09070d", "#302a3b", "#18131f"], 50, 175);
  return img;
}

function drawSurface() {
  const img = image();
  rect(img, 0, 0, CELL, CELL, "#141018");
  rect(img, 0, 0, CELL, 11, "#1f1b24");
  rect(img, 0, 11, CELL, 37, "#25242b");
  rect(img, 3, 15, 42, 33, "#17141b");
  oval(img, 24, 30, 18, 18, "#07060b", 255);
  rect(img, 10, 27, 28, 20, "#07060b", 255);
  line(img, 9, 29, 15, 16, "#55515a", 3, 230);
  line(img, 39, 29, 33, 16, "#55515a", 3, 230);
  line(img, 15, 16, 33, 16, "#6b6670", 3, 225);
  line(img, 12, 27, 36, 27, "#201d25", 2, 210);
  line(img, 10, 45, 38, 45, "#3a3540", 2, 160);
  diamond(img, 18, 20, 1, "#8a838e", 130);
  diamond(img, 31, 21, 1, "#7a7480", 120);
  noise(img, 10, ["#302d35", "#1a171f", "#403b45"], 34, 105);
  return img;
}

function drawCoreTile() {
  const img = drawTunnel();
  diamond(img, 24, 25, 17, "#2b123e", 255);
  diamond(img, 24, 24, 13, "#6e2899", 245);
  diamond(img, 24, 23, 8, "#b026ff", 240);
  diamond(img, 21, 20, 3, "#f2d8ff", 245);
  line(img, 24, 7, 24, 40, "#f1d2ff", 1, 100);
  line(img, 9, 25, 39, 24, "#8d48c9", 1, 130);
  return img;
}

function drawVeinMotif(img, base, stage) {
  const pal = veinPalette[base];
  oval(img, 24, 25, 14, 11, pal.light, 18);
  if (pal.shape === "spots") {
    const dots = [[20,23,5],[29,25,4],[24,31,3],[31,18,2]];
    for (const [x, y, r] of dots) {
      oval(img, x, y, r + 1, r, pal.dark, 210);
      oval(img, x, y - 1, r, Math.max(2, r - 1), pal.mid, 235);
      diamond(img, x - 1, y - 2, 1, pal.spark, 185);
    }
  } else if (pal.shape === "fang") {
    const fang = (x, y, h, col) => {
      tri(img, x - 6, y, x + 6, y, x, y + h, pal.dark, 230);
      tri(img, x - 4, y + 1, x + 4, y + 1, x, y + h - 2, col, 238);
      line(img, x - 3, y + 2, x, y + h - 4, pal.spark, 1, 125);
    };
    fang(20, 17, 15, pal.light);
    fang(30, 18, 14, pal.mid);
  } else if (pal.shape === "drop") {
    const drop = (x, y, s, col) => {
      tri(img, x - s, y, x, y - s - 5, x + s, y, pal.dark, 210);
      oval(img, x, y + 3, s, s + 2, pal.dark, 220);
      tri(img, x - s + 2, y, x, y - s - 2, x + s - 2, y, col, 230);
      oval(img, x, y + 3, s - 2, s, col, 235);
      diamond(img, x - 2, y, 1, pal.spark, 175);
    };
    drop(24, 24, 7, pal.mid);
    drop(34, 29, 3, pal.light);
    oval(img, 15, 30, 3, 2, pal.mid, 190);
  } else if (pal.shape === "rock") {
    diamond(img, 24, 24, 9, pal.dark, 235);
    tri(img, 14, 24, 24, 13, 25, 24, pal.mid, 235);
    tri(img, 25, 24, 35, 20, 26, 35, pal.light, 205);
    tri(img, 15, 25, 24, 25, 22, 35, pal.mid, 190);
    line(img, 19, 22, 28, 26, "#172137", 1, 140);
    line(img, 26, 18, 24, 32, "#172137", 1, 115);
  } else if (pal.shape === "ember") {
    tri(img, 17, 34, 24, 14, 31, 34, pal.dark, 235);
    tri(img, 19, 33, 26, 18, 32, 34, pal.mid, 235);
    tri(img, 21, 32, 25, 22, 29, 34, pal.light, 215);
    diamond(img, 15, 24, 2, pal.mid, 180);
    diamond(img, 34, 22, 3, pal.light, 175);
  }
  diamond(img, 37, 14, 2, pal.spark, 115);
  diamond(img, 12, 34, 2, pal.spark, 100);
  if (stage >= 1) {
    line(img, 5, 7, 42, 7, pal.spark, 2, 155);
    line(img, 42, 7, 42, 40, pal.spark, 2, 140);
    line(img, 42, 40, 5, 40, pal.spark, 2, 125);
    line(img, 5, 40, 5, 7, pal.spark, 2, 140);
    line(img, 8, 10, 39, 10, pal.light, 1, 120);
    line(img, 39, 10, 39, 37, pal.light, 1, 105);
    line(img, 39, 37, 8, 37, pal.light, 1, 90);
    line(img, 8, 37, 8, 10, pal.light, 1, 105);
  }
  if (stage >= 2) {
    line(img, 4, 5, 43, 5, "#ffcf4d", 2, 205);
    line(img, 43, 5, 43, 42, "#ffcf4d", 2, 190);
    line(img, 43, 42, 4, 42, "#ffcf4d", 2, 175);
    line(img, 4, 42, 4, 5, "#ffcf4d", 2, 190);
    line(img, 7, 8, 40, 8, "#fff1a6", 1, 150);
    line(img, 40, 8, 40, 39, "#fff1a6", 1, 130);
    line(img, 40, 39, 7, 39, "#fff1a6", 1, 120);
    line(img, 7, 39, 7, 8, "#fff1a6", 1, 130);
    for (const [x, y, r] of [[10, 9, 2], [38, 12, 2], [36, 37, 3], [12, 35, 2]]) {
      diamond(img, x, y, r, "#ffcf4d", 185);
      diamond(img, x, y, 1, "#fff7c8", 160);
    }
  }
}

function drawTile(name) {
  let stage = 0;
  let base = name;
  if (name.endsWith("_evo2")) {
    stage = 2;
    base = name.replace("_evo2", "");
  } else if (name.endsWith("_evo")) {
    stage = 1;
    base = name.replace("_evo", "");
  }
  if (base === "earth") return drawEarthBase();
  if (base === "tunnel") return drawTunnel();
  if (base === "bedrock") return drawBedrock();
  if (base === "surface") return drawSurface();
  if (base === "core") return drawCoreTile();
  const img = drawEarthBase();
  drawVeinMotif(img, base, stage);
  return img;
}

function drawEye(img, x, y, pal, front = true) {
  rect(img, x - 1, y - 1, 3, 3, pal.eye, 245);
  if (front) setPx(img, x, y, rgba("#ffffff", 210));
}

function bodyPalette(name) {
  return monsterPalettes[name] || monsterPalettes[eliteBase[name]] || monsterPalettes.slime;
}

function drawSlime(img, pal, cx, cy, dx, dy, action, frame) {
  const squash = action === "attack" ? [0, 1, 2, 1][frame] : 0;
  oval(img, cx, cy + 8, 16, 5, "#0c0812", 90);
  oval(img, cx, cy + 2 + squash, 15, 12 - squash, pal.dark, 240);
  oval(img, cx, cy - 1 + squash, 12, 10 - squash, pal.mid, 245);
  oval(img, cx - 4, cy - 5 + squash, 5, 3, pal.light, 115);
  if (dx !== 0) {
    oval(img, cx + dx * 7, cy + 1 + squash, 4, 7, pal.light, 135);
    line(img, cx - dx * 5, cy + 5, cx - dx * 10, cy + 1, pal.dark, 3, 170);
  }
  if (dy >= 0) {
    oval(img, cx, cy + 4 + squash, 8, 4, pal.light, 115);
    drawEye(img, cx - 5 + dx * 2, cy - 2 + dy, pal);
    drawEye(img, cx + 5 + dx * 2, cy - 2 + dy, pal);
  } else {
    line(img, cx - 10, cy - 5, cx + 10, cy - 9, pal.dark, 4, 190);
    line(img, cx - 8, cy - 7, cx + 7, cy - 10, pal.light, 2, 145);
  }
}

function drawDogBeast(img, pal, cx, cy, dx, dy, action, frame) {
  const bite = action === "attack" || action === "eat" ? [0, 1, 3, 1][frame] : 0;
  if (dx === 0 && dy > 0) {
    oval(img, cx, cy + 12, 13, 4, "#0c0812", 80);
    oval(img, cx, cy + 5, 14, 9, pal.dark, 245);
    oval(img, cx, cy + 2, 11, 8, pal.mid, 245);
    oval(img, cx, cy - 7 + bite, 10, 8, pal.dark, 245);
    oval(img, cx, cy - 4 + bite, 8, 6, pal.mid, 245);
    oval(img, cx, cy + 1 + bite, 6, 4, pal.light, 220);
    tri(img, cx - 8, cy - 10 + bite, cx - 5, cy - 18 + bite, cx - 1, cy - 10 + bite, pal.dark, 235);
    tri(img, cx + 8, cy - 10 + bite, cx + 5, cy - 18 + bite, cx + 1, cy - 10 + bite, pal.dark, 235);
    drawEye(img, cx - 4, cy - 7 + bite, pal);
    drawEye(img, cx + 4, cy - 7 + bite, pal);
    diamond(img, cx, cy - 1 + bite, 2, pal.eye, 240);
    tri(img, cx - 3, cy + 4 + bite, cx, cy + 8 + bite, cx + 1, cy + 4 + bite, pal.light, 220);
    tri(img, cx + 3, cy + 4 + bite, cx + 1, cy + 8 + bite, cx, cy + 4 + bite, pal.light, 220);
    for (const sx of [-6, 6]) {
      line(img, cx + sx, cy + 8, cx + sx, cy + 16, pal.dark, 3, 235);
      diamond(img, cx + sx, cy + 16, 2, pal.light, 210);
    }
    return;
  }
  if (dx === 0 && dy < 0) {
    oval(img, cx, cy + 11, 13, 4, "#0c0812", 80);
    oval(img, cx, cy + 5, 15, 9, pal.dark, 245);
    oval(img, cx, cy + 1, 12, 8, pal.mid, 245);
    oval(img, cx, cy - 7, 9, 7, pal.dark, 245);
    oval(img, cx, cy - 8, 6, 5, pal.mid, 230);
    tri(img, cx - 7, cy - 8, cx - 5, cy - 16, cx - 1, cy - 8, pal.dark, 230);
    tri(img, cx + 7, cy - 8, cx + 5, cy - 16, cx + 1, cy - 8, pal.dark, 230);
    line(img, cx - 9, cy + 2, cx + 8, cy, pal.light, 2, 115);
    line(img, cx, cy + 2, cx, cy + 9, pal.dark, 2, 145);
    line(img, cx - 2, cy + 1, cx - 15, cy - 4, pal.dark, 4, 235);
    line(img, cx - 15, cy - 4, cx - 18, cy - 10, pal.light, 2, 185);
    for (const sx of [-6, 6]) {
      line(img, cx + sx, cy + 8, cx + sx, cy + 16, pal.dark, 3, 235);
      diamond(img, cx + sx, cy + 16, 2, pal.light, 175);
    }
    return;
  }
  const faceX = dx || 1;
  const hx = cx + faceX * (10 + bite);
  const hy = cy - 4 + dy * (4 + bite);
  oval(img, cx - faceX * 3, cy + 5, 16, 8, pal.dark, 245);
  oval(img, cx - faceX * 2, cy + 2, 14, 8, pal.mid, 245);
  oval(img, hx, hy, 7, 6, pal.dark, 245);
  oval(img, hx + faceX * 4, hy + 1, 5, 4, pal.mid, 245);
  tri(img, hx - faceX * 4, hy - 5, hx - faceX, hy - 13, hx + faceX * 2, hy - 5, pal.dark, 235);
  tri(img, hx + faceX * 1, hy - 5, hx + faceX * 4, hy - 12, hx + faceX * 7, hy - 5, pal.dark, 220);
  const tailX = cx - faceX * 17;
  const tailY = cy - 3 - dy * 3;
  line(img, cx - faceX * 12, cy + 1, tailX, tailY, pal.dark, 4, 235);
  line(img, tailX, tailY, tailX - faceX * 4, tailY - 4, pal.light, 2, 185);
  for (const sx of [-7, 4]) {
    const lx = cx + sx - faceX * 2;
    line(img, lx, cy + 9, lx + faceX * 3, cy + 16, pal.dark, 3, 235);
    diamond(img, lx + faceX * 3, cy + 16, 2, pal.light, 210);
  }
  if (dy >= 0) drawEye(img, hx + faceX * 3, hy - 3, pal);
  tri(img, hx + faceX * 5, hy + 3, hx + faceX * 8, hy + 3, hx + faceX * 7, hy + 7, pal.light, 225);
  tri(img, hx + faceX * 1, hy + 3, hx + faceX * 4, hy + 3, hx + faceX * 3, hy + 7, pal.light, 205);
  if (dy < 0) line(img, cx - 8, cy - 5, cx + 8, cy - 7, pal.light, 2, 130);
}

function drawSpider(img, pal, cx, cy, dx, dy, action, frame) {
  const cast = action === "cast" || action === "attack" ? frame : 0;
  const faceX = dx || 1;
  const headX = dx === 0 ? cx : cx + faceX * 8;
  const headY = dx === 0 ? cy + (dy >= 0 ? 7 : -5) : cy + 1;
  oval(img, cx, cy + 12, 18, 4, "#0c0812", 80);
  oval(img, cx, cy + 4, 13, 11, pal.dark, 245);
  oval(img, cx, cy + 4, 9, 8, pal.mid, 220);
  oval(img, headX, headY, dx === 0 ? 9 : 8, 8, pal.mid, 250);
  oval(img, headX, headY + 1, dx === 0 ? 6 : 5, 5, pal.light, 90);
  if (dy < 0 && dx === 0) {
    line(img, cx - 8, cy + 2, cx + 8, cy, pal.light, 2, 130);
    diamond(img, cx, cy + 5, 4, pal.dark, 180);
  }
  const legs = [
    [-10, -3, -20, -8, -22, -15],
    [-8, 1, -20, 0, -23, -5],
    [-6, 5, -18, 9, -20, 15],
    [-3, 8, -13, 16, -11, 21],
    [10, -3, 20, -8, 22, -15],
    [8, 1, 20, 0, 23, -5],
    [6, 5, 18, 9, 20, 15],
    [3, 8, 13, 16, 11, 21],
  ];
  for (const [rx, ry, kx, ky, fx, fy] of legs) {
    const lift = cast ? (rx < 0 ? -1 : 1) * (frame % 2) : 0;
    line(img, cx + rx, cy + ry, cx + kx, cy + ky + lift, pal.dark, 3, 230);
    line(img, cx + kx, cy + ky + lift, cx + fx, cy + fy, pal.dark, 2, 220);
    diamond(img, cx + fx, cy + fy, 1, pal.light, 170);
  }
  if (dy >= 0 || dx !== 0) {
    drawEye(img, headX + (dx === 0 ? -4 : faceX * 3), headY - 3 + Math.max(0, dy), pal);
    drawEye(img, headX + (dx === 0 ? 4 : -faceX), headY - 3 + Math.max(0, dy), pal);
    rect(img, headX - 4, headY + 4, 2, 4, pal.light, 210);
    rect(img, headX + 2, headY + 4, 2, 4, pal.light, 210);
  }
  if (action === "cast") {
    const wx = dx === 0 ? cx : cx + faceX * (12 + frame * 2);
    const wy = dx === 0 ? cy + dy * (12 + frame * 2) : cy - 4 + dy * 8;
    diamond(img, wx, wy, 3 + frame, pal.eye, 150);
    line(img, headX, headY, wx, wy, pal.light, 1, 120);
    line(img, headX - 4, headY + 2, wx - 5, wy + 2, pal.light, 1, 90);
    line(img, headX + 4, headY + 2, wx + 5, wy + 2, pal.light, 1, 90);
  } else if (cast) {
    diamond(img, dx === 0 ? cx : cx + faceX * (10 + cast), dx === 0 ? cy + dy * (10 + cast) : cy - 2 + dy * 6, 3, pal.light, 150);
  }
}

function drawGolem(img, pal, cx, cy, dx, dy, action, frame) {
  const slam = action === "attack" || action === "dig" ? [0, 1, 4, 1][frame] : 0;
  rect(img, cx - 15, cy - 5, 30, 23, pal.dark, 250);
  rect(img, cx - 12, cy - 8, 24, 21, pal.mid, 245);
  rect(img, cx - 8, cy - 19, 16, 13, pal.dark, 250);
  rect(img, cx - 6, cy - 18, 12, 10, pal.mid, 245);
  rect(img, cx - 20 - dx * slam, cy - 4 + slam, 8, 19, pal.dark, 245);
  rect(img, cx - 19 - dx * slam, cy - 2 + slam, 6, 13, pal.mid, 225);
  rect(img, cx + 12 + dx * slam, cy - 4 + slam, 8, 19, pal.dark, 245);
  rect(img, cx + 13 + dx * slam, cy - 2 + slam, 6, 13, pal.mid, 225);
  rect(img, cx - 12, cy + 15, 9, 8, pal.dark, 245);
  rect(img, cx + 3, cy + 15, 9, 8, pal.dark, 245);
  rect(img, cx - 10, cy + 15, 6, 5, pal.mid, 185);
  rect(img, cx + 5, cy + 15, 6, 5, pal.mid, 185);
  if (dx !== 0) {
    rect(img, cx + dx * 4, cy - 6, 9, 16, pal.light, 125);
    rect(img, cx - dx * 12, cy - 3, 7, 14, "#151827", 155);
  }
  if (dy >= 0 || dx !== 0) {
    diamond(img, cx + dx * 3, cy + 2 + dy, 5, pal.light, 105);
    rect(img, cx - 7 + dx * 2, cy - 15 + dy, 5, 3, pal.eye, 245);
    rect(img, cx + 2 + dx * 2, cy - 15 + dy, 5, 3, pal.eye, 245);
    line(img, cx - 6 + dx * 2, cy - 14 + dy, cx - 3 + dx * 2, cy - 14 + dy, "#ffffff", 2, 215);
    line(img, cx + 3 + dx * 2, cy - 14 + dy, cx + 6 + dx * 2, cy - 14 + dy, "#ffffff", 2, 215);
  } else {
    rect(img, cx - 9, cy - 15, 18, 7, "#151827", 170);
    line(img, cx - 7, cy - 15, cx + 7, cy - 15, pal.light, 2, 160);
  }
  line(img, cx - 11, cy - 2, cx - 3, cy + 5, "#151827", 2, 140);
  line(img, cx + 4, cy - 6, cx + 10, cy + 3, "#151827", 2, 130);
  line(img, cx - 4, cy + 8, cx + 6, cy + 10, pal.light, 1, 120);
  diamond(img, cx + 12, cy - 3, 2, pal.light, 110);
}

function drawDragon(img, pal, cx, cy, dx, dy, action, frame) {
  const flare = action === "attack" || action === "cast" ? frame * 2 : 0;
  const wingLift = action === "idle" ? [0, -2, 0, 2][frame] : [-1, -3, -5, -2][frame];
  const fire = action === "attack" || action === "cast";
  if (dx === 0 && dy > 0) {
    oval(img, cx, cy + 15, 15, 5, "#0c0812", 80);
    tri(img, cx - 4, cy + 4, cx - 22, cy - 13 + wingLift, cx - 16, cy + 14, pal.dark, 235);
    tri(img, cx + 4, cy + 4, cx + 22, cy - 13 + wingLift, cx + 16, cy + 14, pal.dark, 235);
    tri(img, cx - 7, cy + 4, cx - 17, cy - 6 + wingLift, cx - 11, cy + 12, pal.mid, 205);
    tri(img, cx + 7, cy + 4, cx + 17, cy - 6 + wingLift, cx + 11, cy + 12, pal.mid, 205);
    oval(img, cx, cy + 7, 13, 11, pal.dark, 250);
    oval(img, cx, cy + 4, 10, 9, pal.mid, 245);
    line(img, cx - 2, cy - 2, cx - 2, cy - 10, pal.dark, 6, 240);
    line(img, cx + 2, cy - 2, cx + 2, cy - 10, pal.dark, 6, 240);
    oval(img, cx, cy - 10, 10, 8, pal.dark, 250);
    oval(img, cx, cy - 7, 8, 6, pal.mid, 245);
    tri(img, cx - 8, cy - 14, cx - 6, cy - 25, cx - 2, cy - 14, pal.light, 230);
    tri(img, cx + 8, cy - 14, cx + 6, cy - 25, cx + 2, cy - 14, pal.light, 230);
    tri(img, cx - 10, cy - 9, cx - 16, cy - 13, cx - 9, cy - 4, pal.dark, 210);
    tri(img, cx + 10, cy - 9, cx + 16, cy - 13, cx + 9, cy - 4, pal.dark, 210);
    drawEye(img, cx - 4, cy - 10, pal);
    drawEye(img, cx + 4, cy - 10, pal);
    for (const sx of [-6, 6]) {
      line(img, cx + sx, cy + 12, cx + sx - Math.sign(sx) * 2, cy + 20, pal.dark, 3, 235);
      diamond(img, cx + sx - Math.sign(sx) * 2, cy + 20, 2, pal.light, 210);
    }
    line(img, cx, cy + 13, cx, cy + 23, pal.dark, 4, 235);
    diamond(img, cx, cy + 24, 2, pal.light, 180);
    if (fire) {
      tri(img, cx - 6, cy - 4, cx, cy + 15 + flare, cx + 6, cy - 4, pal.light, 170);
      tri(img, cx - 3, cy - 3, cx, cy + 11 + flare, cx + 3, cy - 3, pal.mid, 205);
    }
    return;
  }
  if (dx === 0 && dy < 0) {
    oval(img, cx, cy + 15, 15, 5, "#0c0812", 80);
    tri(img, cx - 4, cy + 6, cx - 23, cy - 14 + wingLift, cx - 15, cy + 16, pal.dark, 238);
    tri(img, cx + 4, cy + 6, cx + 23, cy - 14 + wingLift, cx + 15, cy + 16, pal.dark, 238);
    tri(img, cx - 6, cy + 6, cx - 17, cy - 7 + wingLift, cx - 10, cy + 13, pal.mid, 205);
    tri(img, cx + 6, cy + 6, cx + 17, cy - 7 + wingLift, cx + 10, cy + 13, pal.mid, 205);
    oval(img, cx, cy + 7, 14, 10, pal.dark, 250);
    oval(img, cx, cy + 3, 10, 8, pal.mid, 235);
    line(img, cx, cy + 3, cx, cy - 11, pal.dark, 7, 240);
    oval(img, cx, cy - 12, 8, 6, pal.dark, 248);
    line(img, cx - 9, cy - 1, cx + 9, cy - 3, pal.light, 2, 130);
    for (const sx of [-7, 7]) line(img, cx + sx, cy + 13, cx + sx, cy + 20, pal.dark, 3, 230);
    line(img, cx, cy + 12, cx - 13, cy + 7, pal.dark, 4, 235);
    diamond(img, cx - 15, cy + 6, 3, pal.light, 170);
    return;
  }
  const faceX = dx || 1;
  oval(img, cx, cy + 15, 15, 5, "#0c0812", 80);
  tri(img, cx - faceX * 4, cy + 3, cx - faceX * 8, cy - 16 + wingLift, cx + faceX * 8, cy + 9, pal.dark, 238);
  tri(img, cx - faceX * 2, cy + 4, cx - faceX * 6, cy - 9 + wingLift, cx + faceX * 6, cy + 8, pal.mid, 205);
  tri(img, cx + faceX * 2, cy + 4, cx + faceX * 13, cy - 13 + wingLift, cx + faceX * 10, cy + 10, pal.dark, 215);
  tri(img, cx + faceX * 3, cy + 5, cx + faceX * 10, cy - 7 + wingLift, cx + faceX * 8, cy + 8, pal.mid, 195);
  oval(img, cx - faceX * 3, cy + 7, 15, 9, pal.dark, 250);
  oval(img, cx - faceX * 2, cy + 4, 12, 7, pal.mid, 240);
  line(img, cx + faceX * 5, cy + 1, cx + faceX * 14, cy - 5 + dy * 3, pal.dark, 6, 240);
  line(img, cx + faceX * 7, cy + 1, cx + faceX * 15, cy - 4 + dy * 3, pal.mid, 3, 220);
  const hx = cx + faceX * (17 + Math.min(2, flare));
  const hy = cy - 5 + dy * 4;
  oval(img, hx, hy, 8, 6, pal.dark, 250);
  oval(img, hx + faceX * 6, hy + 1, 6, 4, pal.mid, 245);
  tri(img, hx - faceX * 4, hy - 5, hx - faceX * 2, hy - 15, hx + faceX, hy - 5, pal.light, 225);
  tri(img, hx + faceX * 2, hy - 5, hx + faceX * 5, hy - 14, hx + faceX * 9, hy - 5, pal.light, 210);
  line(img, hx + faceX * 4, hy + 3, hx + faceX * 11, hy + 2, pal.light, 2, 200);
  line(img, cx - faceX * 14, cy + 6, cx - faceX * 22, cy + 2 - dy * 3, pal.dark, 5, 240);
  diamond(img, cx - faceX * 23, cy + 2 - dy * 3, 3, pal.light, 180);
  for (const sx of [-7, 5]) {
    const lx = cx + sx - faceX * 2;
    line(img, lx, cy + 12, lx + faceX * 3, cy + 20, pal.dark, 3, 235);
    diamond(img, lx + faceX * 3, cy + 20, 2, pal.light, 205);
  }
  if (dy >= 0) drawEye(img, hx + faceX * 5, hy - 2, pal);
  if (fire) {
    tri(img, hx + faceX * 10, hy + 3, hx + faceX * (23 + flare), hy - 5, hx + faceX * (21 + flare), hy + 9, pal.light, 175);
    tri(img, hx + faceX * 12, hy + 3, hx + faceX * (19 + flare), hy, hx + faceX * (19 + flare), hy + 6, pal.mid, 205);
  }
}

function drawReaper(img, pal, cx, cy, dx, dy, action, frame) {
  const swing = action === "attack" || action === "cast" ? [-4, 0, 5, 1][frame] : 0;
  const faceX = dx || 1;
  oval(img, cx, cy + 17, 13, 4, "#0c0812", 80);
  tri(img, cx - 13, cy + 19, cx, cy - 13, cx + 13, cy + 19, "#07080c", 250);
  tri(img, cx - 9, cy + 17, cx + dx * 2, cy - 9, cx + 9, cy + 17, pal.mid, 170);
  oval(img, cx + dx * 2, cy - 10 + dy * 2, 8, 8, pal.light, 245);
  rect(img, cx - 6 + dx * 2, cy - 10 + dy * 2, 12, 5, "#f2f7ff", 235);
  rect(img, cx - 5 + dx * 2, cy - 8 + dy * 2, 10, 5, "#141822", 230);
  rect(img, cx - 4 + dx * 2, cy - 8 + dy * 2, 3, 2, pal.eye, 245);
  rect(img, cx + 1 + dx * 2, cy - 8 + dy * 2, 3, 2, pal.eye, 245);
  line(img, cx + faceX * 8, cy + 8, cx + faceX * (13 + swing), cy - 18, "#6f7682", 3, 245);
  line(img, cx + faceX * (13 + swing), cy - 18, cx + faceX * (25 + swing), cy - 16, "#e8f1ff", 3, 230);
  line(img, cx + faceX * (23 + swing), cy - 16, cx + faceX * (17 + swing), cy - 8, "#e8f1ff", 2, 220);
  if (action === "cast") {
    diamond(img, cx - faceX * 8, cy - 4, 5 + frame, pal.eye, 150);
    line(img, cx - faceX * 6, cy - 3, cx - faceX * 15, cy - 12, pal.eye, 1, 150);
  }
}

function drawChimera(img, pal, cx, cy, dx, dy, action, frame) {
  const bite = action === "attack" || action === "eat" ? [0, 2, 4, 1][frame] : 0;
  const faceX = dx || 1;
  oval(img, cx, cy + 16, 18, 5, "#0c0812", 85);
  oval(img, cx - faceX * 2, cy + 7, 17, 10, pal.dark, 250);
  oval(img, cx - faceX * 1, cy + 4, 14, 8, pal.mid, 240);
  tri(img, cx - faceX * 4, cy + 2, cx - faceX * 15, cy - 11, cx - faceX * 10, cy + 11, "#4b2c58", 230);
  tri(img, cx + faceX * 3, cy + 2, cx + faceX * 13, cy - 9, cx + faceX * 10, cy + 10, "#6d3a42", 220);
  const hx = cx + faceX * (14 + bite);
  const hy = cy - 3 + dy * 3;
  oval(img, hx, hy, 8, 7, "#5f2020", 250);
  oval(img, hx + faceX * 6, hy + 1, 6, 4, "#e06b3a", 245);
  tri(img, hx - faceX * 4, hy - 5, hx - faceX, hy - 14, hx + faceX * 2, hy - 5, pal.light, 220);
  drawEye(img, hx + faceX * 4, hy - 2, { eye: pal.eye });
  const sx = cx - faceX * 8;
  oval(img, sx, cy - 6, 7, 6, "#4a286d", 235);
  rect(img, sx - 3, cy - 8, 2, 2, "#adff8e", 245);
  rect(img, sx + 2, cy - 8, 2, 2, "#adff8e", 245);
  line(img, cx - faceX * 14, cy + 7, cx - faceX * 23, cy + 3 - dy * 3, pal.dark, 5, 240);
  diamond(img, cx - faceX * 24, cy + 3 - dy * 3, 3, pal.light, 180);
  for (const lx of [-8, 5]) {
    line(img, cx + lx, cy + 13, cx + lx + faceX * 3, cy + 21, pal.dark, 3, 235);
    diamond(img, cx + lx + faceX * 3, cy + 21, 2, pal.light, 200);
  }
}

function drawMonster(img, name, action, dir, frame) {
  const base = eliteBase[name] || name;
  const pal = bodyPalette(name);
  const [dx, dy] = dirVec[dir];
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 3, 1][frame];
  const lunge = action === "idle" ? 0 : [0, 1, 4, 1][frame];
  const cx = 24 + dx * lunge;
  const cy = 23 + bob + dy * Math.min(2, lunge);
  if (base === "slime") drawSlime(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "carniv") drawDogBeast(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "spitter") drawSpider(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "golem") drawGolem(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "flame") drawDragon(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "reaper") drawReaper(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "chimera") drawChimera(img, pal, cx, cy, dx, dy, action, frame);
}

function drawSword(img, cx, cy, dx, dy, frame, pal) {
  const side = dx < 0 ? -1 : 1;
  const swing = [-6, -2, 6, 2][frame];
  const hiltX = cx + side * 5;
  const hiltY = cy + 6;
  const tipX = cx + side * (16 - Math.abs(swing) * 0.35);
  const tipY = cy - 4 + swing;
  const guardLift = swing > 0 ? 2 : -1;
  line(img, hiltX, hiltY, tipX, tipY, pal.dark, 5, 225);
  line(img, hiltX, hiltY, tipX, tipY, pal.metal, 3, 245);
  line(img, hiltX - side, hiltY - 1, tipX - side, tipY - 1, "#ffffff", 1, 165);
  line(img, hiltX - side * 4, hiltY + guardLift, hiltX + side * 4, hiltY - guardLift, pal.dark, 4, 225);
  line(img, hiltX - side * 3, hiltY + guardLift, hiltX + side * 3, hiltY - guardLift, pal.accent, 2, 230);
  line(img, hiltX - side * 6, hiltY + 3, hiltX, hiltY, "#6a4428", 3, 235);
  diamond(img, tipX, tipY, 2, pal.light, 210);
}

function drawSpear(img, cx, cy, dx, dy, frame, pal) {
  const side = dx < 0 ? -1 : 1;
  const swing = [-5, -1, 5, 1][frame];
  const baseX = cx - side * 9;
  const baseY = cy + 10;
  const tipX = cx + side * 17;
  const tipY = cy - 8 + swing;
  const vx = tipX - baseX;
  const vy = tipY - baseY;
  const len = Math.hypot(vx, vy) || 1;
  const fx = vx / len;
  const fy = vy / len;
  const px = -fy;
  const py = fx;
  line(img, baseX, baseY, tipX, tipY, pal.dark, 4, 220);
  line(img, baseX, baseY, tipX, tipY, "#6a4428", 2, 245);
  tri(img,
    tipX + fx * 5, tipY + fy * 5,
    tipX - fx * 2 + px * 5, tipY - fy * 2 + py * 5,
    tipX - fx * 2 - px * 5, tipY - fy * 2 - py * 5,
    pal.dark, 220);
  tri(img,
    tipX + fx * 4, tipY + fy * 4,
    tipX - fx * 2 + px * 3, tipY - fy * 2 + py * 3,
    tipX - fx * 2 - px * 3, tipY - fy * 2 - py * 3,
    pal.metal, 245);
  diamond(img, cx + side * 7, cy - 2 + swing * 0.35, 2, pal.accent, 180);
}

function drawShield(img, cx, cy, dx, dy, pal, kind, frame) {
  const sx = dx ? -dx * 9 : -8;
  const sy = dy > 0 ? 4 : (dy < 0 ? -3 : 2);
  const push = kind === "great" ? frame : Math.floor(frame / 2);
  const scx = cx + sx + (dx || 1) * push;
  const scy = cy + sy + dy * push;
  const big = kind === "great";
  oval(img, scx, scy + 2, big ? 10 : 8, big ? 14 : 11, pal.dark, 245);
  oval(img, scx, scy, big ? 9 : 7, big ? 13 : 10, pal.metal, 240);
  oval(img, scx, scy - 2, big ? 6 : 5, big ? 9 : 7, pal.mid, 210);
  if (kind === "cross") {
    line(img, scx, scy - 8, scx, scy + 7, pal.accent, 2, 245);
    line(img, scx - 5, scy - 1, scx + 5, scy - 1, pal.accent, 2, 245);
  } else if (kind === "gold") {
    diamond(img, scx, scy - 2, 5, pal.accent, 225);
    line(img, scx - 5, scy + 5, scx + 5, scy + 5, "#fff1a8", 1, 200);
  } else if (big) {
    line(img, scx - 6, scy - 7, scx + 6, scy + 8, pal.light, 2, 170);
  }
}

function drawPickaxe(img, cx, cy, dx, dy, frame, pal) {
  const fx = dx || 1;
  const fy = dy || 0;
  const swing = [0, 1, 2, 1][frame];
  const lift = [-1, -3, 1, -2][frame];
  const gripX = cx + fx * 4;
  const gripY = cy + 4 + fy * 2;
  const headX = cx + fx * (11 + swing);
  const headY = cy - 9 + fy * 4 + lift;
  line(img, gripX, gripY, headX, headY, pal.dark, 4, 215);
  line(img, gripX, gripY, headX, headY, "#6a4428", 2, 245);
  line(img, headX - fx * 6, headY - 1, headX + fx * 6, headY + 1, pal.dark, 5, 210);
  line(img, headX - fx * 5, headY - 1, headX + fx * 5, headY + 1, pal.metal, 3, 240);
  line(img, headX + fx * 5, headY + 1, headX + fx * 7, headY + 4, pal.metal, 2, 235);
}

function drawFist(img, cx, cy, dx, dy, frame, pal) {
  const fx = dx || 1;
  const jab = [0, 2, 6, 2][frame];
  line(img, cx + fx * 5, cy + 1, cx + fx * (13 + jab), cy - 2 + dy * 3, pal.skin, 4, 245);
  oval(img, cx + fx * (16 + jab), cy - 2 + dy * 3, 5, 4, pal.skin, 245);
  line(img, cx - fx * 5, cy + 2, cx - fx * 11, cy + 8, pal.skin, 4, 230);
  if (frame >= 2) {
    diamond(img, cx + fx * (23 + jab), cy - 2 + dy * 3, 3, "#fff4d0", 180);
    line(img, cx + fx * (19 + jab), cy - 6 + dy * 3, cx + fx * (25 + jab), cy - 9 + dy * 3, "#ffcf4d", 1, 150);
  }
}

function drawHandgun(img, cx, cy, dx, dy, frame, pal) {
  const fx = dx || 1;
  const recoil = frame >= 2 ? -2 : 0;
  const gx = cx + fx * (12 + recoil);
  const gy = cy - 5 + dy * 4;
  line(img, cx + fx * 5, cy, gx, gy, pal.skin, 3, 235);
  rect(img, gx - (fx < 0 ? 9 : 0), gy - 3, 9, 5, "#171b22", 245);
  rect(img, gx + fx * 7 - (fx < 0 ? 5 : 0), gy - 2, 7, 3, pal.metal, 235);
  rect(img, gx - (fx < 0 ? 2 : 0), gy + 1, 3, 6, "#0b0d12", 245);
  if (frame >= 2) {
    diamond(img, gx + fx * 16, gy - 1, 3, "#fff1a6", 220);
    line(img, gx + fx * 10, gy - 1, gx + fx * 18, gy - 1, "#ffcf4d", 1, 150);
  }
}

function drawRocketLauncher(img, cx, cy, dx, dy, frame, pal) {
  const fx = dx || 1;
  const lift = frame >= 2 ? -2 : 0;
  const bx = cx + fx * 2;
  const by = cy - 6 + dy * 5 + lift;
  line(img, cx - fx * 7, cy + 4, bx, by, pal.skin, 3, 230);
  line(img, bx - fx * 12, by, bx + fx * 15, by - 3, "#29313c", 8, 245);
  line(img, bx - fx * 10, by, bx + fx * 13, by - 3, pal.metal, 4, 235);
  tri(img, bx + fx * 15, by - 3, bx + fx * 21, by - 8, bx + fx * 21, by + 2, "#cfd8e3", 230);
  if (frame >= 2) {
    tri(img, bx + fx * 23, by - 3, bx + fx * 31, by - 11, bx + fx * 31, by + 5, "#ffcf4d", 180);
    tri(img, bx + fx * 25, by - 3, bx + fx * 29, by - 7, bx + fx * 29, by + 1, "#ff5a28", 220);
  }
}

function drawStaff(img, cx, cy, dx, dy, frame, pal, variant) {
  const fx = dx || 1;
  const lift = variant === "heal" || variant === "saint" || variant === "glow" ? frame * 2 : frame;
  line(img, cx - fx * 5, cy + 11, cx + fx * 10, cy - 13 - lift + dy * 5, "#5b3922", 3, 235);
  const headX = cx + fx * (12 + frame);
  const headY = cy - 15 - lift + dy * 5;
  const gem = variant === "heal" || variant === "saint" ? "#9effa0" : (variant === "gem" ? "#6ff0ff" : (variant === "glow" ? "#fff06a" : pal.accent));
  diamond(img, headX, headY, variant === "glow" ? 6 + frame : 4 + frame, gem, variant === "glow" ? 185 : 215);
  if (variant === "gem" || variant === "glow") diamond(img, headX, headY, 2 + frame, "#ffffff", 220);
  if (variant === "glow") {
    line(img, headX - 8, headY, headX + 8, headY, gem, 1, 120);
    line(img, headX, headY - 8, headX, headY + 8, gem, 1, 120);
  }
}

function drawArmoredBody(img, name, pal, cx, cy, dx, dy, action, frame, caster) {
  const headX = cx + dx * 3;
  const headY = cy - 11 + dy * 2;
  const shine = name === "captain" ? "#fff3b8" : pal.light;
  const plate = name === "captain" ? pal.metal : "#dfe7f2";
  const trim = name === "captain" ? pal.accent : pal.mid;
  const robe = pal.robe || caster;

  oval(img, cx, cy + 17, 12, 4, "#0c0812", 80);
  rect(img, cx - 6, cy + 9, 5, 11, pal.dark, 245);
  rect(img, cx + 1, cy + 9, 5, 11, pal.dark, 245);
  rect(img, cx - 6, cy + 14, 5, 5, plate, 210);
  rect(img, cx + 1, cy + 14, 5, 5, plate, 210);

  if (robe) {
    tri(img, cx - 12, cy + 15, cx, cy - 6, cx + 12, cy + 15, pal.dark, 245);
    tri(img, cx - 9, cy + 14, cx + dx * 2, cy - 4, cx + 9, cy + 14, pal.mid, 235);
  } else {
    oval(img, cx, cy + 4, 10, 12, pal.dark, 245);
  }

  diamond(img, cx, cy + 2, 11, "#1d2431", 250);
  diamond(img, cx, cy + 1, 9, plate, 245);
  tri(img, cx - 8, cy + 2, cx, cy - 7, cx, cy + 11, shine, 120);
  line(img, cx - 7, cy + 4, cx + 7, cy + 4, trim, 2, 210);
  line(img, cx, cy - 6, cx, cy + 12, trim, 1, 180);
  diamond(img, cx, cy + 3, 3, pal.accent, name === "captain" || name === "sage" ? 220 : 130);

  oval(img, cx - 10, cy - 1, 5, 7, plate, 235);
  oval(img, cx + 10, cy - 1, 5, 7, plate, 235);
  line(img, cx - 13, cy - 3, cx - 8, cy + 4, pal.dark, 2, 170);
  line(img, cx + 8, cy + 4, cx + 13, cy - 3, pal.dark, 2, 170);
  rect(img, cx - 11 - dx * 2, cy + 1, 5, 11, pal.dark, 235);
  rect(img, cx + 6 + dx * 2, cy + 1, 5, 11, pal.dark, 235);
  rect(img, cx - 10 - dx * 2, cy + 4, 4, 5, plate, 190);
  rect(img, cx + 7 + dx * 2, cy + 4, 4, 5, plate, 190);

  oval(img, headX, headY, 8, 8, pal.dark, 245);
  oval(img, headX, headY - 1, 7, 7, plate, 245);
  rect(img, headX - 7, headY - 3, 14, 5, plate, 245);
  line(img, headX - 6, headY - 1, headX + 6, headY - 1, "#171b24", 2, 245);
  if (dy >= 0 || dx !== 0) {
    rect(img, headX - 4, headY - 1 + dy, 8, 2, "#07090e", 245);
    rect(img, headX + dx * 4 - 1, headY + 2 + dy, 2, 2, pal.accent, 200);
  } else {
    line(img, headX - 5, headY - 5, headX + 5, headY - 6, shine, 2, 150);
  }
  if (name === "saint") {
    oval(img, headX, headY - 2, 9, 9, pal.light, 95);
    line(img, headX - 7, headY - 10, headX + 7, headY - 10, pal.accent, 2, 180);
  } else if (caster) {
    tri(img, headX - 8, headY - 6, headX, headY - 17, headX + 8, headY - 6, pal.dark, 225);
    line(img, headX - 5, headY - 7, headX + 5, headY - 7, plate, 1, 170);
    if (name === "sage") diamond(img, headX, headY - 16, 3, pal.accent, 190);
  } else if (name === "captain") {
    diamond(img, headX, headY - 8, 3, pal.accent, 230);
  }
  if (action === "idle") diamond(img, cx + ((frame % 2) ? 8 : -8), cy - 4, 1, shine, 90);
}

function drawModernBody(img, name, pal, cx, cy, dx, dy, action, frame) {
  const headX = cx + dx * 3;
  const headY = cy - 12 + dy * 2;
  oval(img, cx, cy + 17, name === "hori" ? 15 : 12, 4, "#0c0812", 80);
  rect(img, cx - 5, cy + 9, 5, 11, name === "max" ? "#08090d" : pal.dark, 245);
  rect(img, cx + 1, cy + 9, 5, 11, name === "max" ? "#08090d" : pal.dark, 245);
  if (name === "hori") {
    oval(img, cx, cy + 4, 14, 13, pal.dark, 245);
    oval(img, cx, cy + 2, 12, 11, pal.mid, 235);
    rect(img, cx - 10, cy - 2, 20, 7, "#f0f4fa", 190);
  } else if (name === "max") {
    tri(img, cx - 11, cy + 15, cx, cy - 8, cx + 11, cy + 15, "#05060a", 250);
    tri(img, cx - 8, cy + 14, cx + dx * 2, cy - 5, cx + 8, cy + 14, pal.mid, 220);
    line(img, cx - 8, cy + 1, cx + 8, cy + 1, "#303849", 2, 190);
  } else {
    oval(img, cx, cy + 4, 11, 12, pal.dark, 245);
    rect(img, cx - 9, cy - 5, 18, 20, pal.mid, 235);
    line(img, cx - 8, cy - 3, cx + 8, cy + 4, pal.light, 2, 150);
  }
  oval(img, headX, headY, name === "hori" ? 9 : 8, 8, pal.skin, 245);
  if (name === "max") {
    rect(img, headX - 8, headY - 4, 16, 5, "#05060a", 245);
    rect(img, headX - 6, headY - 2 + dy, 5, 2, "#0a0b10", 255);
    rect(img, headX + 1, headY - 2 + dy, 5, 2, "#0a0b10", 255);
  } else if (name === "shon") {
    rect(img, headX - 7, headY - 8, 14, 5, "#2f3540", 230);
    rect(img, headX - 4, headY - 1 + dy, 3, 2, "#171b24", 230);
    rect(img, headX + 2, headY - 1 + dy, 3, 2, "#171b24", 230);
  } else {
    rect(img, headX - 8, headY - 11, 16, 5, "#d9c18a", 245);
    rect(img, headX - 7, headY - 8, 14, 3, "#d9c18a", 230);
    rect(img, headX - 4, headY - 1 + dy, 3, 2, "#171b24", 230);
    rect(img, headX + 2, headY - 1 + dy, 3, 2, "#171b24", 230);
  }
  rect(img, cx - 12 - dx * 2, cy + 1, 5, 11, pal.skin, 235);
  rect(img, cx + 7 + dx * 2, cy + 1, 5, 11, pal.skin, 235);
  if (action === "dodge") {
    line(img, cx - 13, cy + 16, cx - 20, cy + 18, "#9fe8ff", 1, 150);
    line(img, cx + 12, cy + 12, cx + 20, cy + 8, "#9fe8ff", 1, 145);
  }
}

function drawHero(img, name, action, dir, frame) {
  const pal = heroPalettes[name] || heroPalettes.warrior;
  const [dx, dy] = dirVec[dir];
  const weapon = pal.weapon || "sword";
  const caster = ["priest", "saint", "mage", "supermage", "sage"].includes(name);
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 2, 1][frame];
  const lunge = action === "dig" ? [0, 1, 3, 1][frame] : (action === "dodge" ? [0, -1, -3, -1][frame] : 0);
  const lift = (action === "cast" || action === "heal") ? [0, -1, -3, -1][frame] : 0;
  const cx = 24 + dx * lunge;
  const cy = 23 + bob + lift + dy * Math.min(2, lunge);
  const modern = ["max", "shon", "hori"].includes(name);
  if (modern) drawModernBody(img, name, pal, cx, cy, dx, dy, action, frame);
  else drawArmoredBody(img, name, pal, cx, cy, dx, dy, action, frame, caster);
  if (action === "dig") {
    drawPickaxe(img, cx, cy, dx, dy, frame, pal);
    if (weapon === "greatshield") drawShield(img, cx, cy, dx, dy, pal, "great", Math.max(1, frame - 1));
    return;
  }
  if (weapon === "spear") drawSpear(img, cx, cy, dx, dy, action === "attack" ? frame : 0, pal);
  else if (weapon === "greatshield") drawShield(img, cx, cy, dx, dy, pal, "great", action === "attack" ? frame : 0);
  else if (weapon === "sword_shield") {
    drawShield(img, cx, cy, dx, dy, pal, "normal", action === "attack" ? frame : 0);
    drawSword(img, cx, cy, dx, dy, action === "attack" ? frame : 0, pal);
  } else if (weapon === "cross_shield") {
    drawShield(img, cx, cy, dx, dy, pal, "cross", action === "attack" ? frame : 0);
    drawSword(img, cx, cy, dx, dy, action === "attack" ? frame : 0, pal);
  } else if (weapon === "gold_sword_shield") {
    drawShield(img, cx, cy, dx, dy, pal, "gold", action === "attack" ? frame : 0);
    drawSword(img, cx, cy, dx, dy, action === "attack" ? frame : 1, pal);
  } else if (weapon === "rod") {
    drawStaff(img, cx, cy, dx, dy, frame, pal, action === "heal" ? "heal" : "rod");
  } else if (weapon === "saint_rod") {
    drawStaff(img, cx, cy, dx, dy, frame, pal, action === "heal" ? "saint" : "heal");
  } else if (weapon === "staff") {
    drawStaff(img, cx, cy, dx, dy, action === "cast" ? frame : 0, pal, "staff");
  } else if (weapon === "gem_staff") {
    drawStaff(img, cx, cy, dx, dy, action === "cast" ? frame : 1, pal, "gem");
  } else if (weapon === "glow_staff") {
    drawStaff(img, cx, cy, dx, dy, action === "cast" ? frame : 1, pal, "glow");
  } else if (weapon === "fist") {
    drawFist(img, cx, cy, dx, dy, action === "attack" ? frame : 0, pal);
  } else if (weapon === "handgun") {
    drawHandgun(img, cx, cy, dx, dy, action === "attack" || action === "cast" ? frame : 0, pal);
  } else if (weapon === "rocket") {
    if (action === "attack") drawFist(img, cx, cy, dx, dy, frame, pal);
    else if (action === "eat") {
      oval(img, cx + (dx || 1) * 10, cy - 4 + dy * 4, 5, 7, "#8ed36f", 245);
      line(img, cx + (dx || 1) * 10, cy - 10 + dy * 4, cx + (dx || 1) * 14, cy - 14 + dy * 4, "#6fb85a", 2, 230);
    } else drawRocketLauncher(img, cx, cy, dx, dy, action === "cast" ? frame : 0, pal);
  } else {
    drawSword(img, cx, cy, dx, dy, action === "attack" ? frame : 0, pal);
  }
  if (action === "heal") {
    const fx = dx || 1;
    const hx = cx + fx * (14 + frame);
    const hy = cy - 18 - frame + dy * 5;
    oval(img, hx, hy, 8 + frame, 6 + frame, pal.accent, 95);
    line(img, hx, hy - 7, hx, hy + 7, "#ffffff", 2, 220);
    line(img, hx - 7, hy, hx + 7, hy, "#ffffff", 2, 220);
    diamond(img, cx - 10, cy - 7, 3, pal.accent, 180);
    diamond(img, cx + 9, cy - 4, 2, pal.light, 165);
  } else if (action === "cast") {
    const fx = dx || 1;
    const fy = dy;
    const sx = cx + fx * (17 + frame * 2);
    const sy = cy - 8 + fy * (11 + frame);
    oval(img, sx, sy, name === "sage" ? 9 + frame : 6 + frame, name === "sage" ? 7 + frame : 5 + frame, pal.accent, name === "sage" ? 125 : 110);
    diamond(img, sx, sy, name === "supermage" || name === "sage" ? 5 + frame : 4 + frame, "#ffffff", 215);
    line(img, cx + fx * 8, cy - 9 + fy * 5, sx, sy, pal.accent, name === "sage" ? 3 : 2, 160);
    if (name === "sage") {
      line(img, sx - 10, sy, sx + 10, sy, pal.light, 1, 160);
      line(img, sx, sy - 10, sx, sy + 10, pal.light, 1, 160);
    }
  }
}

function drawEggMotif(img, base, evo, bob) {
  const pal = veinPalette[base] || veinPalette.venom;
  if (base === "venom") {
    tri(img, 19, 29 + bob, 24, 19 + bob, 29, 29 + bob, pal.dark, 190);
    oval(img, 24, 31 + bob, 6, 7, pal.dark, 198);
    tri(img, 21, 29 + bob, 24, 22 + bob, 27, 29 + bob, pal.mid, 232);
    oval(img, 24, 31 + bob, 4, 5, pal.mid, 238);
    diamond(img, 22, 28 + bob, 1, pal.spark, 190);
    oval(img, 32, 34 + bob, 3, 2, pal.light, 174);
    oval(img, 17, 34 + bob, 2, 2, pal.mid, 165);
  } else if (base === "stone") {
    diamond(img, 24, 29 + bob, 8, pal.dark, 210);
    tri(img, 16, 29 + bob, 24, 20 + bob, 25, 29 + bob, pal.mid, 230);
    tri(img, 25, 29 + bob, 33, 26 + bob, 26, 38 + bob, pal.light, 205);
    tri(img, 17, 30 + bob, 24, 30 + bob, 22, 38 + bob, pal.mid, 190);
    line(img, 20, 27 + bob, 28, 31 + bob, "#172137", 1, 155);
    line(img, 26, 23 + bob, 24, 36 + bob, "#172137", 1, 130);
  } else if (base === "ember") {
    tri(img, 17, 38 + bob, 24, 19 + bob, 31, 38 + bob, pal.dark, 210);
    tri(img, 19, 37 + bob, 26, 22 + bob, 32, 38 + bob, pal.mid, 235);
    tri(img, 22, 36 + bob, 25, 27 + bob, 29, 38 + bob, pal.light, 222);
    diamond(img, 16, 27 + bob, 2, pal.mid, 175);
    diamond(img, 33, 25 + bob, 2, pal.light, 165);
  }
  if (evo) {
    diamond(img, 15, 20 + bob, 2, pal.spark, 145);
    diamond(img, 34, 36 + bob, 2, pal.spark, 140);
  }
}

function drawEgg(img, name, frame) {
  const colors = eggPalette[name];
  const meta = eggMotif[name] || { base: "venom", evo: false };
  const pal = veinPalette[meta.base];
  const bob = [0, -1, 0, 1][frame];
  if (meta.evo) {
    oval(img, 24, 29 + bob, 17, 21, pal.spark, 72);
    oval(img, 24, 29 + bob, 16, 20, pal.light, 58);
  }
  oval(img, 24, 31 + bob, 14, 4, "#0c0812", 72);
  oval(img, 24, 29 + bob, 15, 18, colors[3], 238);
  oval(img, 24, 26 + bob, 13, 17, colors[0], 255);
  oval(img, 25, 31 + bob, 11, 10, colors[1], 78);
  oval(img, 20, 18 + bob, 4, 6, colors[2], 192);
  oval(img, 19, 28 + bob, 4, 3, pal.light, 128);
  diamond(img, 30, 24 + bob, 2, colors[1], 185);
  diamond(img, 27, 39 + bob, 2, colors[3], 145);
  line(img, 16, 31 + bob, 21, 39 + bob, colors[3], 1, 105);
  drawEggMotif(img, meta.base, meta.evo, bob);
}

function drawActor(name, frame, dir, action) {
  const img = image();
  if (name.startsWith("egg_")) drawEgg(img, name, frame);
  else if (heroNames.includes(name)) drawHero(img, name, action, dir, frame);
  else drawMonster(img, name, action, dir, frame);
  if ((action === "eat" || action === "attack") && !heroNames.includes(name) && !name.startsWith("egg_")) {
    const [dx, dy] = dirVec[dir];
    tri(img, 24 + dx * (13 + frame), 24 + dy * (13 + frame), 21 + dx * 8, 21 + dy * 8, 27 + dx * 8, 27 + dy * 8, "#fff0d0", 170);
  }
  clearCellEdge(img);
  return img;
}

function drawEffect(name, frame) {
  const img = image();
  const t = frame / (FRAMES - 1);
  if (name === "slash") {
    line(img, 9, 33 - t * 13, 39, 16 + t * 9, "#fff4e8", 6, 230 - frame * 35);
    line(img, 12, 35 - t * 11, 36, 20 + t * 8, "#c8cbd4", 3, 210 - frame * 35);
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
    for (let i = 0; i < 8; i++) diamond(img, 24 + Math.cos(i) * spread, 24 + Math.sin(i * 2) * spread, 2 + (i % 2), "#fff0a8", 200 - frame * 40);
    diamond(img, 24, 24, 8 + frame * 5, "#8ff39a", 90);
  } else if (name === "puff") {
    for (let i = 0; i < 8; i++) diamond(img, 24 + Math.cos(i) * (4 + frame * 4), 24 + Math.sin(i * 2) * (3 + frame * 4), 4 + frame, "#cfd8e3", 180 - frame * 35);
  }
  return img;
}

function drawAmuletIcon(name) {
  const img = image();
  oval(img, 24, 34, 17, 5, "#0c0812", 82);
  if (name === "family") {
    rect(img, 10, 11, 28, 24, "#4a2d1f", 250);
    rect(img, 13, 14, 22, 18, "#d9c38a", 245);
    rect(img, 15, 16, 18, 14, "#6b8fb8", 230);
    oval(img, 21, 22, 4, 5, "#e8b18a", 245);
    oval(img, 28, 22, 4, 5, "#d69a72", 245);
    rect(img, 17, 27, 15, 3, "#493414", 220);
    line(img, 10, 11, 38, 35, "#1b1010", 2, 180);
    diamond(img, 34, 15, 2, "#fff0a6", 170);
  } else if (name === "dogtag") {
    for (let i = 0; i < 7; i++) diamond(img, 12 + i * 4, 11 + (i % 2), 1, "#d8dde4", 210);
    rect(img, 17, 19, 20, 15, "#6f7682", 250);
    rect(img, 19, 21, 16, 11, "#b8c1cc", 245);
    rect(img, 31, 22, 3, 3, "#2b3038", 245);
    line(img, 21, 25, 30, 25, "#3a4250", 1, 220);
    line(img, 21, 29, 28, 29, "#3a4250", 1, 180);
    diamond(img, 19, 22, 1, "#fff7e8", 180);
  } else if (name === "lastStick") {
    line(img, 16, 35, 31, 17, "#6a4428", 5, 245);
    line(img, 17, 35, 32, 18, "#d7a15d", 2, 245);
    oval(img, 34, 14, 7, 10, "#7a1e08", 225);
    tri(img, 28, 20, 35, 5, 41, 20, "#ff6b2a", 235);
    tri(img, 31, 20, 36, 10, 39, 20, "#ffe06a", 245);
    diamond(img, 18, 34, 3, "#2a1608", 225);
    diamond(img, 25, 26, 2, "#fff0a6", 150);
  } else if (name === "whiskey") {
    rect(img, 20, 9, 9, 9, "#31415a", 245);
    rect(img, 18, 17, 13, 20, "#4a2b16", 250);
    rect(img, 20, 19, 9, 15, "#b66b28", 230);
    rect(img, 21, 22, 7, 7, "#e0b35b", 245);
    line(img, 29, 18, 32, 35, "#ffe0a0", 2, 120);
    rect(img, 21, 8, 7, 3, "#d8dde4", 230);
    diamond(img, 25, 25, 2, "#fff6c8", 185);
  } else if (name === "letter") {
    rect(img, 10, 16, 28, 20, "#d8c9a0", 250);
    tri(img, 11, 17, 24, 29, 37, 17, "#f0e0b8", 245);
    tri(img, 11, 35, 24, 24, 37, 35, "#b99868", 220);
    line(img, 11, 17, 24, 29, "#7a5132", 1, 170);
    line(img, 37, 17, 24, 29, "#7a5132", 1, 170);
    diamond(img, 24, 27, 4, "#7d1f2a", 235);
    diamond(img, 24, 27, 2, "#d6543f", 235);
  } else if (name === "cards") {
    rect(img, 13, 12, 15, 22, "#e8edf2", 250);
    rect(img, 15, 14, 11, 18, "#f7fbff", 245);
    rect(img, 23, 15, 15, 22, "#dfe7f2", 250);
    rect(img, 25, 17, 11, 18, "#ffffff", 245);
    diamond(img, 21, 23, 4, "#d6543f", 245);
    tri(img, 29, 27, 34, 18, 39, 27, "#171b24", 235);
    oval(img, 34, 28, 5, 4, "#171b24", 235);
    line(img, 34, 29, 34, 34, "#171b24", 2, 235);
  } else if (name === "coinPurse") {
    oval(img, 24, 27, 14, 12, "#6b3342", 250);
    rect(img, 15, 18, 18, 7, "#3d2430", 245);
    line(img, 16, 21, 32, 21, "#d9a53d", 2, 230);
    diamond(img, 20, 18, 2, "#ffcf4d", 240);
    diamond(img, 29, 18, 2, "#ffcf4d", 240);
    oval(img, 34, 34, 5, 3, "#d9a53d", 240);
    oval(img, 38, 31, 4, 3, "#ffcf4d", 235);
    line(img, 17, 29, 31, 29, "#9b5262", 2, 180);
  } else if (name === "stitchedBear") {
    oval(img, 17, 16, 5, 5, "#5a3828", 245);
    oval(img, 31, 16, 5, 5, "#5a3828", 245);
    oval(img, 24, 24, 13, 13, "#8a5a3c", 250);
    oval(img, 24, 31, 10, 8, "#6d4330", 245);
    rect(img, 19, 22, 3, 3, "#15101c", 245);
    rect(img, 28, 22, 3, 3, "#15101c", 245);
    diamond(img, 24, 27, 2, "#2a1608", 245);
    line(img, 18, 31, 30, 18, "#d9c38a", 1, 230);
    line(img, 17, 23, 21, 27, "#d9c38a", 1, 210);
    line(img, 27, 31, 31, 35, "#d9c38a", 1, 210);
  }
  clearCellEdge(img);
  return img;
}

function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects", "amulets"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) {
    for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) {
      writePng(spritePath("actors", name, f, dir, action), drawActor(name, f, dir, action));
    }
  }
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("effects", name, f), drawEffect(name, f));
  for (const name of AMULET_ICONS) writePng(spritePath("amulets", name), drawAmuletIcon(name));
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
  EFFECTS.forEach((name, row) => {
    for (let f = 0; f < FRAMES; f++) copyInto(effects, readPng(spritePath("effects", name, f)), f * CELL, row * CELL);
  });
  writePng(path.join(OUT_DIR, "effects.png"), effects);

  const amulets = image(CELL * AMULET_ICONS.length, CELL);
  AMULET_ICONS.forEach((name, col) => copyInto(amulets, readPng(spritePath("amulets", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "amulets.png"), amulets);
}

function writeMeta() {
  const meta = { cell: CELL, frames: FRAMES, directions: DIRECTIONS, actions: ACTIONS, actors: {}, tiles: {}, effects: {}, amulets: {} };
  ACTORS.forEach((name, row) => {
    meta.actors[name] = { sheet: "actors", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, directions: DIRECTIONS.length, actions: ACTIONS.length, anchor: [CELL / 2, Math.round(CELL * 0.75)] };
  });
  TILES.forEach((name, col) => { meta.tiles[name] = { sheet: "tiles", x: col * CELL, y: 0, w: CELL, h: CELL }; });
  EFFECTS.forEach((name, row) => { meta.effects[name] = { sheet: "effects", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, anchor: [CELL / 2, CELL / 2] }; });
  AMULET_ICONS.forEach((name, col) => { meta.amulets[name] = { sheet: "amulets", x: col * CELL, y: 0, w: CELL, h: CELL, anchor: [CELL / 2, CELL / 2] }; });
  fs.writeFileSync(path.join(OUT_DIR, "sprites.json"), JSON.stringify(meta, null, 2) + "\n");
}

writeSourceFrames();
writeAtlas();
writeMeta();
console.log("自製48px 8方向・アクション別ピクセル素材を生成しました。");
