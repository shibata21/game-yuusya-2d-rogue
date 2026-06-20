"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const heroNames = ["warrior", "tank", "mage", "priest"];
const dirVec = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };
const eliteBase = { superslime: "slime", evolved: "carniv", tarantula: "spitter", titan: "golem", infernal: "flame" };

const monsterPalettes = {
  slime: { dark: "#255d91", mid: "#5eb8ff", light: "#bfeaff", eye: "#101926" },
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
  warrior: { dark: "#27324f", mid: "#476fb8", light: "#b9d4ff", skin: "#e8b18a", metal: "#edf3ff", accent: "#ffcf4d" },
  tank: { dark: "#30343d", mid: "#68717d", light: "#d0d8e2", skin: "#d9a37c", metal: "#f4f6fa", accent: "#7bd96b" },
  mage: { dark: "#40205f", mid: "#8a45c4", light: "#e3c0ff", skin: "#e9b58f", metal: "#f0dcff", accent: "#86d8ff" },
  priest: { dark: "#4c3d23", mid: "#d9c68a", light: "#fff4c7", skin: "#e6b089", metal: "#ffffff", accent: "#9effa0" },
};

const eggPalette = {
  egg_superslime: ["#f7d4d7", "#e84a4a", "#fff5f5", "#8f2631"],
  egg_evolved: ["#e0b4c4", "#9b2f4f", "#fff0f7", "#5a182c"],
  egg_tarantula: ["#ffd1c8", "#ff6b5a", "#fff7ef", "#873226"],
  egg_titan: ["#efe0bf", "#d9b27a", "#fff9dc", "#6c5430"],
  egg_infernal: ["#cae8ff", "#5ab0ff", "#f1fbff", "#185179"],
};

const veinPalette = {
  moss: { dark: "#24572b", mid: "#66bf68", light: "#c7f7c7", spark: "#eaffd8", shape: "leaf" },
  meat: { dark: "#6c1f16", mid: "#d65b38", light: "#ffb38a", spark: "#ffe0c6", shape: "fang" },
  venom: { dark: "#3a195f", mid: "#8c55e6", light: "#d8b7ff", spark: "#f5e7ff", shape: "needle" },
  stone: { dark: "#2b3854", mid: "#6f86c4", light: "#c5d8ff", spark: "#edf4ff", shape: "gem" },
  ember: { dark: "#702b0a", mid: "#ff9822", light: "#ffe38a", spark: "#fff5bc", shape: "flame" },
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
  line(img, 13, 30, 24, 23, pal.dark, evo ? 4 : 3, 145);
  line(img, 24, 23, 36, 17, pal.dark, evo ? 4 : 3, 135);
  line(img, 16, 31, 27, 24, pal.mid, 2, 185);
  line(img, 25, 23, 36, 18, pal.light, 1, 165);
  const size = evo ? 8 : 6;
  if (pal.shape === "fang") {
    tri(img, 20 - size, 18, 20 + size, 19, 21, 19 + size * 2, pal.mid, 235);
    tri(img, 30 - size + 1, 25, 30 + size - 1, 25, 30, 25 + size * 2, pal.light, 220);
  } else if (pal.shape === "flame") {
    tri(img, 23 - size, 30, 24, 13, 24 + size, 30, pal.mid, 235);
    tri(img, 21, 29, 26, 18, 30, 31, pal.light, 210);
  } else if (pal.shape === "needle") {
    tri(img, 17, 31, 24, 14, 31, 31, pal.mid, 230);
    diamond(img, 24, 25, evo ? 4 : 3, pal.light, 205);
  } else if (pal.shape === "leaf") {
    oval(img, 21, 23, size, Math.max(4, size - 1), pal.mid, 225);
    oval(img, 30, 25, Math.max(4, size - 1), size, pal.light, 185);
    line(img, 16, 28, 35, 20, pal.dark, 1, 150);
  } else {
    diamond(img, 24, 23, size, pal.mid, 235);
    diamond(img, 23, 21, Math.max(3, size - 3), pal.light, 205);
  }
  diamond(img, 34, 17, evo ? 3 : 2, pal.spark, 190);
  diamond(img, 16, 32, evo ? 3 : 2, pal.spark, 160);
  if (evo) {
    diamond(img, 24, 23, 12, pal.light, 70);
    line(img, 12, 16, 24, 23, pal.spark, 1, 105);
    line(img, 24, 23, 39, 33, pal.spark, 1, 95);
    diamond(img, 39, 33, 3, pal.spark, 170);
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

function drawFangBeast(img, pal, cx, cy, dx, dy, action, frame) {
  const bite = action === "attack" || action === "eat" ? [0, 1, 3, 1][frame] : 0;
  const hx = cx + dx * (10 + bite);
  const hy = cy - 3 + dy * (5 + bite);
  oval(img, cx - dx * 3, cy + 5, 16, 8, pal.dark, 245);
  oval(img, cx - dx * 2, cy + 2, 14, 8, pal.mid, 245);
  oval(img, hx, hy, 8, 7, pal.dark, 245);
  oval(img, hx, hy - 2, 6, 5, pal.mid, 245);
  const tailX = cx - dx * 15;
  const tailY = cy + 1 - dy * 4;
  line(img, cx - dx * 11, cy + 2, tailX, tailY, pal.dark, 4, 235);
  for (const sx of [-7, 4]) {
    const lx = cx + sx - dx * 2;
    line(img, lx, cy + 9, lx + dx * 3, cy + 16, pal.dark, 3, 235);
    diamond(img, lx + dx * 3, cy + 16, 2, pal.light, 210);
  }
  if (dy >= 0 || dx !== 0) drawEye(img, hx + Math.max(-2, dx * 2), hy - 3, pal);
  tri(img, hx + dx * 4 - 1, hy + 2, hx + dx * 4 + 3, hy + 3, hx + dx * 7, hy + 7, pal.light, 230);
  tri(img, hx - dx * 2 - 1, hy + 2, hx - dx * 2 + 3, hy + 3, hx - dx * 1, hy + 7, pal.light, 210);
  if (dy < 0) line(img, cx - 8, cy - 4, cx + 8, cy - 6, pal.light, 2, 130);
}

function drawSpitter(img, pal, cx, cy, dx, dy, action, frame) {
  const cast = action === "cast" || action === "attack" ? frame : 0;
  oval(img, cx, cy + 4, 13, 9, pal.dark, 245);
  oval(img, cx + dx * 3, cy + 1, 10, 8, pal.mid, 245);
  for (const side of [-1, 1]) {
    line(img, cx - 5, cy + 4, cx - 14, cy + side * 6 + 4, pal.dark, 2, 220);
    line(img, cx + 5, cy + 4, cx + 14, cy + side * 6 + 4, pal.dark, 2, 220);
  }
  const tx = cx - dx * (11 + cast);
  const ty = cy - 7 - dy * 5;
  line(img, cx - dx * 6, cy, tx, ty, pal.dark, 3, 235);
  diamond(img, tx, ty, 4, pal.light, 220);
  if (dy >= 0 || dx !== 0) drawEye(img, cx + dx * 6 - 2, cy - 2 + dy * 2, pal);
  if (action === "cast") diamond(img, cx + dx * (12 + frame * 2), cy - 3 + dy * 8, 3 + frame, pal.eye, 180);
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

function drawFlame(img, pal, cx, cy, dx, dy, action, frame) {
  const flare = action === "attack" || action === "cast" ? frame * 2 : 0;
  oval(img, cx, cy + 13, 12, 5, "#0c0812", 80);
  tri(img, cx - 13, cy + 17, cx + dx * (3 + flare), cy - 18 - flare, cx + 13, cy + 17, pal.dark, 245);
  tri(img, cx - 9, cy + 15, cx + dx * (5 + flare), cy - 12 - flare, cx + 9, cy + 15, pal.mid, 245);
  tri(img, cx - 5, cy + 12, cx + dx * (4 + flare), cy - 5 - flare, cx + 6, cy + 13, pal.light, 225);
  diamond(img, cx - dx * 9, cy + 2 - dy * 5, 3, pal.mid, 175);
  if (dy >= 0 || dx !== 0) {
    drawEye(img, cx - 4 + dx * 2, cy + 1 + dy, pal);
    drawEye(img, cx + 4 + dx * 2, cy + 1 + dy, pal);
  } else {
    line(img, cx - 8, cy - 3, cx + 7, cy - 6, pal.light, 2, 125);
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
  else if (base === "carniv") drawFangBeast(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "spitter") drawSpitter(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "golem") drawGolem(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "flame") drawFlame(img, pal, cx, cy, dx, dy, action, frame);
}

function drawSword(img, cx, cy, dx, dy, frame, pal) {
  const reach = 11 + frame * 4;
  line(img, cx + dx * 4, cy - 3 + dy * 4, cx + dx * reach, cy - 8 + dy * reach, pal.metal, 4, 235);
  line(img, cx + dx * 3, cy + dy * 3, cx + dx * 9, cy + 6 + dy * 7, pal.accent, 2, 220);
}

function drawStaff(img, cx, cy, dx, dy, frame, pal, heal) {
  line(img, cx - dx * 5, cy + 10, cx + dx * 10, cy - 13 + dy * 5, "#5b3922", 3, 235);
  diamond(img, cx + dx * (12 + frame), cy - 15 + dy * 5, 4 + frame, heal ? "#9effa0" : pal.accent, 210);
}

function drawHero(img, name, action, dir, frame) {
  const pal = heroPalettes[name];
  const [dx, dy] = dirVec[dir];
  const bob = action === "idle" ? [0, -1, 0, 1][frame] : [0, 1, 3, 1][frame];
  const lunge = action === "idle" ? 0 : [0, 1, 4, 1][frame];
  const cx = 24 + dx * lunge;
  const cy = 23 + bob + dy * Math.min(2, lunge);
  oval(img, cx, cy + 17, 11, 4, "#0c0812", 80);
  rect(img, cx - 5, cy + 10, 4, 10, pal.dark, 245);
  rect(img, cx + 1, cy + 10, 4, 10, pal.dark, 245);
  oval(img, cx, cy + 4, 9, 12, pal.dark, 245);
  oval(img, cx + dx * 3, cy + 1, 7, 10, pal.mid, 245);
  oval(img, cx + dx * 3, cy - 11 + dy * 2, 7, 7, pal.skin, 245);
  rect(img, cx - 8 - dx * 2, cy + 1, 5, 12, pal.mid, 235);
  rect(img, cx + 3 + dx * 2, cy + 1, 5, 12, pal.mid, 235);
  if (name === "tank") {
    oval(img, cx - dx * 9, cy + 2, 7, 11, pal.metal, 235);
    line(img, cx - dx * 13, cy - 4, cx - dx * 6, cy + 9, pal.dark, 2, 190);
  }
  if (name === "mage" || name === "priest") {
    tri(img, cx + dx * 3 - 7, cy - 14, cx + dx * 3, cy - 25, cx + dx * 3 + 7, cy - 14, pal.dark, 245);
  } else {
    rect(img, cx + dx * 3 - 6, cy - 17, 12, 5, pal.metal, 230);
  }
  if (dy >= 0 || dx !== 0) {
    rect(img, cx + dx * 3 - 3, cy - 11 + dy, 2, 2, "#24140f", 240);
    rect(img, cx + dx * 3 + 2, cy - 11 + dy, 2, 2, "#24140f", 240);
  } else {
    line(img, cx - 5, cy - 13, cx + 5, cy - 15, pal.light, 2, 140);
  }
  if (action === "attack" || (name === "warrior" && action !== "idle")) drawSword(img, cx, cy, dx || 1, dy, frame, pal);
  if (action === "dig" || (name === "tank" && action !== "idle")) {
    line(img, cx - 8, cy - 8, cx + 10, cy + 12, "#6a4428", 3, 235);
    line(img, cx + 6 - frame, cy - 12, cx + 17 + frame, cy - 5, pal.metal, 3, 230);
  }
  if (action === "cast" || (name === "mage" && action !== "idle")) drawStaff(img, cx, cy, dx || 1, dy, frame, pal, false);
  if (action === "heal" || (name === "priest" && action !== "idle")) drawStaff(img, cx, cy, dx || 1, dy, frame, pal, true);
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
