"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const heroNames = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "priest", "saint", "mage", "supermage", "sage"];
const dirVec = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };
const eliteBase = { superslime: "slime", evolved: "carniv", tarantula: "spitter", titan: "golem", infernal: "flame" };

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
};

const eggPalette = {
  egg_superslime: ["#f7d4d7", "#e84a4a", "#fff5f5", "#8f2631"],
  egg_evolved: ["#e0b4c4", "#9b2f4f", "#fff0f7", "#5a182c"],
  egg_tarantula: ["#ffd1c8", "#ff6b5a", "#fff7ef", "#873226"],
  egg_titan: ["#efe0bf", "#d9b27a", "#fff9dc", "#6c5430"],
  egg_infernal: ["#cae8ff", "#5ab0ff", "#f1fbff", "#185179"],
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
  rect(img, 0, 0, CELL, CELL, "#1b1425");
  rect(img, 0, 0, CELL, 17, "#34203a");
  rect(img, 0, 16, CELL, 8, "#5a342e");
  rect(img, 0, 24, CELL, 24, "#2c1b24");
  for (let x = 5; x < CELL; x += 8) tri(img, x - 3, 16, x + 3, 16, x, 7, "#6fcf6f", 190);
  noise(img, 13, ["#7a4b3a", "#221520", "#4b2e33"], 45, 130);
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

function drawVeinMotif(img, base, evo) {
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
  if (evo) {
    line(img, 5, 7, 42, 7, pal.spark, 2, 155);
    line(img, 42, 7, 42, 40, pal.spark, 2, 140);
    line(img, 42, 40, 5, 40, pal.spark, 2, 125);
    line(img, 5, 40, 5, 7, pal.spark, 2, 140);
    line(img, 8, 10, 39, 10, pal.light, 1, 120);
    line(img, 39, 10, 39, 37, pal.light, 1, 105);
    line(img, 39, 37, 8, 37, pal.light, 1, 90);
    line(img, 8, 37, 8, 10, pal.light, 1, 105);
  }
}

function drawTile(name) {
  const evo = name.endsWith("_evo");
  const base = name.replace("_evo", "");
  if (base === "earth") return drawEarthBase();
  if (base === "tunnel") return drawTunnel();
  if (base === "bedrock") return drawBedrock();
  if (base === "surface") return drawSurface();
  if (base === "core") return drawCoreTile();
  const img = drawEarthBase();
  drawVeinMotif(img, base, evo);
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
  const headX = dx === 0 ? cx : cx + faceX * 4;
  const headY = dx === 0 ? cy + (dy >= 0 ? 8 : -4) : cy + 1;
  oval(img, cx, cy + 5, 14, 9, pal.dark, 245);
  oval(img, headX, headY, dx === 0 ? 9 : 10, 8, pal.mid, 245);
  if (dy < 0 && dx === 0) {
    line(img, cx - 8, cy + 4, cx + 8, cy + 2, pal.light, 2, 135);
    diamond(img, cx, cy + 6, 4, pal.dark, 180);
  }
  for (const side of [-1, 1]) {
    for (const [sx, reach] of [[-9, 15], [-4, 13], [3, 13], [8, 15]]) {
      const rootX = cx + sx;
      const rootY = cy + 4 + side;
      const kneeX = rootX + Math.sign(sx || side) * 7;
      const kneeY = rootY + side * (4 + (Math.abs(sx) % 3));
      const footX = cx + Math.sign(sx || side) * reach;
      const footY = cy + 8 + side * (7 + (Math.abs(sx) % 2));
      line(img, rootX, rootY, kneeX, kneeY, pal.dark, 2, 225);
      line(img, kneeX, kneeY, footX, footY, pal.dark, 2, 215);
    }
  }
  if (dy >= 0 || dx !== 0) {
    drawEye(img, headX + (dx === 0 ? -4 : faceX * 4), headY - 3 + Math.max(0, dy), pal);
    drawEye(img, headX + (dx === 0 ? 4 : 0), headY - 3 + Math.max(0, dy), pal);
  }
  if (action === "cast") {
    const wx = dx === 0 ? cx : cx + faceX * (12 + frame * 2);
    const wy = dx === 0 ? cy + dy * (12 + frame * 2) : cy - 4 + dy * 8;
    diamond(img, wx, wy, 3 + frame, pal.eye, 150);
    line(img, headX, headY, wx, wy, pal.light, 1, 120);
  } else if (cast) {
    diamond(img, dx === 0 ? cx : cx + faceX * (10 + cast), dx === 0 ? cy + dy * (10 + cast) : cy - 2 + dy * 6, 3, pal.light, 150);
  }
}

function drawGolem(img, pal, cx, cy, dx, dy, action, frame) {
  const slam = action === "attack" || action === "dig" ? [0, 1, 4, 1][frame] : 0;
  rect(img, cx - 12, cy - 7, 24, 22, pal.dark, 245);
  rect(img, cx - 9, cy - 10, 18, 17, pal.mid, 245);
  rect(img, cx - 7, cy - 18, 14, 10, pal.dark, 245);
  rect(img, cx - 5, cy - 17, 10, 8, pal.mid, 245);
  rect(img, cx - 17 - dx * slam, cy - 5 + slam, 7, 17, pal.dark, 245);
  rect(img, cx + 10 + dx * slam, cy - 5 + slam, 7, 17, pal.dark, 245);
  rect(img, cx - 10, cy + 14, 8, 8, pal.dark, 245);
  rect(img, cx + 2, cy + 14, 8, 8, pal.dark, 245);
  if (dx !== 0) {
    rect(img, cx + dx * 4, cy - 5, 8, 15, pal.light, 135);
    rect(img, cx - dx * 11, cy - 3, 6, 13, "#151827", 160);
  }
  if (dy >= 0 || dx !== 0) {
    diamond(img, cx + dx * 3, cy + 1 + dy, 5, pal.light, 115);
    drawEye(img, cx - 4 + dx * 2, cy - 14 + dy, pal);
    drawEye(img, cx + 4 + dx * 2, cy - 14 + dy, pal);
  } else {
    rect(img, cx - 9, cy - 15, 18, 7, "#151827", 170);
    line(img, cx - 7, cy - 15, cx + 7, cy - 15, pal.light, 2, 160);
  }
  line(img, cx - 9, cy - 1, cx + 8, cy + 1, pal.light, 1, 105);
}

function drawDragon(img, pal, cx, cy, dx, dy, action, frame) {
  const flare = action === "attack" || action === "cast" ? frame * 2 : 0;
  if (dx === 0 && dy > 0) {
    oval(img, cx, cy + 14, 13, 5, "#0c0812", 80);
    oval(img, cx, cy + 6, 14, 9, pal.dark, 245);
    oval(img, cx, cy + 2, 11, 8, pal.mid, 245);
    tri(img, cx - 5, cy + 3, cx - 18, cy - 10 - flare, cx - 10, cy + 10, pal.dark, 220);
    tri(img, cx - 4, cy + 3, cx - 14, cy - 5 - flare, cx - 8, cy + 8, pal.mid, 205);
    tri(img, cx + 5, cy + 3, cx + 18, cy - 10 - flare, cx + 10, cy + 10, pal.dark, 220);
    tri(img, cx + 4, cy + 3, cx + 14, cy - 5 - flare, cx + 8, cy + 8, pal.mid, 205);
    oval(img, cx, cy - 6, 10, 8, pal.dark, 245);
    oval(img, cx, cy - 2, 8, 6, pal.mid, 245);
    oval(img, cx, cy + 2, 6, 4, pal.light, 210);
    tri(img, cx - 6, cy - 10, cx - 4, cy - 20, cx - 1, cy - 10, pal.light, 220);
    tri(img, cx + 6, cy - 10, cx + 4, cy - 20, cx + 1, cy - 10, pal.light, 220);
    drawEye(img, cx - 4, cy - 6, pal);
    drawEye(img, cx + 4, cy - 6, pal);
    line(img, cx - 4, cy + 3, cx + 4, cy + 3, pal.eye, 2, 190);
    line(img, cx - 7, cy + 10, cx - 8, cy + 16, pal.dark, 3, 230);
    line(img, cx + 7, cy + 10, cx + 8, cy + 16, pal.dark, 3, 230);
    if (action === "cast" || action === "attack") {
      tri(img, cx - 4, cy + 5, cx, cy + 16 + flare, cx + 4, cy + 5, pal.light, 180);
      tri(img, cx - 2, cy + 6, cx, cy + 13 + flare, cx + 2, cy + 6, pal.mid, 205);
    }
    return;
  }
  if (dx === 0 && dy < 0) {
    oval(img, cx, cy + 14, 13, 5, "#0c0812", 80);
    oval(img, cx, cy + 6, 15, 9, pal.dark, 245);
    oval(img, cx, cy + 2, 12, 7, pal.mid, 245);
    tri(img, cx - 4, cy + 3, cx - 17, cy - 12 - flare, cx - 9, cy + 10, pal.dark, 225);
    tri(img, cx - 3, cy + 4, cx - 13, cy - 7 - flare, cx - 7, cy + 8, pal.mid, 205);
    tri(img, cx + 4, cy + 3, cx + 17, cy - 12 - flare, cx + 9, cy + 10, pal.dark, 225);
    tri(img, cx + 3, cy + 4, cx + 13, cy - 7 - flare, cx + 7, cy + 8, pal.mid, 205);
    oval(img, cx, cy - 7, 8, 7, pal.dark, 245);
    oval(img, cx, cy - 8, 6, 5, pal.mid, 230);
    tri(img, cx - 6, cy - 10, cx - 4, cy - 20, cx - 1, cy - 10, pal.light, 205);
    tri(img, cx + 6, cy - 10, cx + 4, cy - 20, cx + 1, cy - 10, pal.light, 205);
    line(img, cx - 8, cy + 2, cx + 8, cy, pal.light, 2, 110);
    line(img, cx - 1, cy + 8, cx - 13, cy + 1, pal.dark, 4, 230);
    diamond(img, cx - 14, cy + 1, 3, pal.light, 165);
    for (const sx of [-6, 5]) line(img, cx + sx, cy + 10, cx + sx, cy + 16, pal.dark, 3, 230);
    return;
  }
  const faceX = dx || 1;
  oval(img, cx, cy + 13, 13, 5, "#0c0812", 80);
  oval(img, cx - faceX * 2, cy + 5, 15, 8, pal.dark, 245);
  oval(img, cx - faceX, cy + 2, 12, 7, pal.mid, 245);
  const hx = cx + faceX * (11 + Math.min(2, flare));
  const hy = cy - 3 + dy * 4;
  oval(img, hx, hy, 7, 6, pal.dark, 245);
  oval(img, hx + faceX * 5, hy + 1, 5, 4, pal.mid, 245);
  tri(img, cx - faceX * 4, cy + 2, cx - faceX * 15, cy - 13 - flare, cx - faceX * 7, cy + 10, pal.dark, 225);
  tri(img, cx - faceX * 3, cy + 3, cx - faceX * 12, cy - 8 - flare, cx - faceX * 6, cy + 8, pal.mid, 215);
  tri(img, cx + faceX * 2, cy + 2, cx + faceX * 10, cy - 12 - flare, cx + faceX * 7, cy + 9, pal.dark, 205);
  tri(img, cx + faceX * 3, cy + 3, cx + faceX * 8, cy - 7 - flare, cx + faceX * 7, cy + 8, pal.mid, 195);
  line(img, cx - faceX * 12, cy + 4, cx - faceX * 19, cy + 1 - dy * 3, pal.dark, 4, 235);
  diamond(img, cx - faceX * 20, cy + 1 - dy * 3, 3, pal.light, 170);
  for (const sx of [-6, 5]) line(img, cx + sx, cy + 10, cx + sx + faceX * 3, cy + 16, pal.dark, 3, 230);
  tri(img, hx - faceX * 4, hy - 4, hx - faceX * 2, hy - 13, hx + faceX, hy - 4, pal.light, 220);
  tri(img, hx + faceX * 2, hy - 4, hx + faceX * 4, hy - 12, hx + faceX * 8, hy - 4, pal.light, 205);
  line(img, hx + faceX * 4, hy + 3, hx + faceX * 9, hy + 2, pal.light, 2, 190);
  if (dy >= 0) drawEye(img, hx + faceX * 4, hy - 2, pal);
  if (action === "cast" || action === "attack") {
    tri(img, hx + faceX * 8, hy + 3, hx + faceX * (16 + flare), hy - 3, hx + faceX * (15 + flare), hy + 8, pal.light, 185);
    tri(img, hx + faceX * 10, hy + 3, hx + faceX * (14 + flare), hy + 1, hx + faceX * (14 + flare), hy + 6, pal.mid, 200);
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

function drawHero(img, name, action, dir, frame) {
  const pal = heroPalettes[name] || heroPalettes.warrior;
  const [dx, dy] = dirVec[dir];
  const weapon = pal.weapon || "sword";
  const caster = ["priest", "saint", "mage", "supermage", "sage"].includes(name);
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 2, 1][frame];
  const lunge = action === "dig" ? [0, 1, 3, 1][frame] : 0;
  const lift = (action === "cast" || action === "heal") ? [0, -1, -3, -1][frame] : 0;
  const cx = 24 + dx * lunge;
  const cy = 23 + bob + lift + dy * Math.min(2, lunge);
  drawArmoredBody(img, name, pal, cx, cy, dx, dy, action, frame, caster);
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

function drawEgg(img, name, frame) {
  const colors = eggPalette[name];
  const bob = [0, -1, 0, 1][frame];
  oval(img, 24, 29 + bob, 12, 16, colors[3], 235);
  oval(img, 24, 27 + bob, 10, 15, colors[0], 255);
  oval(img, 25, 31 + bob, 8, 9, colors[1], 90);
  oval(img, 20, 21 + bob, 3, 5, colors[2], 190);
  diamond(img, 17, 31 + bob, 2, colors[1], 210);
  diamond(img, 30, 25 + bob, 2, colors[1], 190);
  diamond(img, 26, 37 + bob, 2, colors[3], 150);
  line(img, 17, 33 + bob, 22, 39 + bob, colors[3], 1, 100);
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

function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) {
    for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) {
      writePng(spritePath("actors", name, f, dir, action), drawActor(name, f, dir, action));
    }
  }
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
  EFFECTS.forEach((name, row) => {
    for (let f = 0; f < FRAMES; f++) copyInto(effects, readPng(spritePath("effects", name, f)), f * CELL, row * CELL);
  });
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
console.log("自製48px 8方向・アクション別ピクセル素材を生成しました。");
