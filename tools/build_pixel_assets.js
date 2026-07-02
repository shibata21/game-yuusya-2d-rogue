"use strict";

const fs = require("fs");
const path = require("path");
const {
  CELL, FRAMES, DIRECTIONS, ACTOR_RENDER_DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, ACTOR_SHEETS, TILES, EFFECTS, ITEM_ICONS, DEBUFF_ICONS, DIALOGUE_PORTRAITS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
} = require("./pixel_asset_common");

const heroNames = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "xTerminator", "priest", "saint", "mage", "supermage", "sage"];
const dirVec = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };
const eliteBase = {
  superslime: "slime", crownslime: "slime",
  evolved: "carniv", direfang: "carniv",
  tarantula: "spitter", goldweaver: "spitter",
  titan: "golem", goldcore: "golem",
  infernal: "flame", whiteflame: "flame",
  moss_shroom: "slime", moss_mycelia: "slime", moss_myceliaKing: "slime",
  moss_virus: "virus", moss_crystalVirus: "virus", moss_crownVirus: "virus",
  moss_root: "slime", moss_tangleRoot: "slime", moss_ancientRoot: "slime",
  meat_wolf: "carniv", meat_shadowWolf: "carniv", meat_nightfangKing: "carniv",
  meat_boar: "carniv", meat_fangBoar: "carniv", meat_ironBoar: "carniv",
  meat_hedgehog: "carniv", meat_steelHedgehog: "carniv", meat_spineKing: "carniv",
  bug_centipede: "spitter", bug_steelCentipede: "spitter", bug_goldCentipede: "spitter",
  bug_beetle: "spitter", bug_shieldBeetle: "spitter", bug_fortressBeetle: "spitter",
  bug_needler: "needler", bug_flyingNeedler: "needler", bug_bowNeedler: "needler",
  stone_turtle: "golem", stone_ironTurtle: "golem", stone_goldTurtle: "golem",
  stone_magnetCrab: "golem", stone_ironCrab: "golem", stone_blackCrab: "golem",
  stone_crystalEye: "virus", stone_quartzEye: "virus", stone_rainbowEye: "virus",
  dragon_serpent: "flame", dragon_flameSerpent: "flame", dragon_whiteSerpent: "flame",
  dragon_salamander: "salamander", dragon_lavaSalamander: "salamander", dragon_mirageSalamander: "salamander",
  dragon_wyvern: "flame", dragon_stormWyvern: "flame", dragon_skyWyvern: "flame",
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
  moss_shroom: { dark: "#315b2d", mid: "#8fcf6a", light: "#e5ffc0", eye: "#203018" },
  moss_mycelia: { dark: "#49682f", mid: "#b7df7a", light: "#fbffd0", eye: "#243018" },
  moss_myceliaKing: { dark: "#5c6330", mid: "#e0ef9a", light: "#fffbd0", eye: "#2a2e12" },
  moss_virus: { dark: "#164b3d", mid: "#6fe0a8", light: "#d8ffe8", eye: "#101926" },
  moss_crystalVirus: { dark: "#17605d", mid: "#7cf0d0", light: "#e8fff8", eye: "#101926" },
  moss_crownVirus: { dark: "#2d6c63", mid: "#b4fff0", light: "#fff6a6", eye: "#10202a" },
  moss_root: { dark: "#3c4a24", mid: "#7aa65a", light: "#d9e69a", eye: "#1a2410" },
  moss_tangleRoot: { dark: "#4b5528", mid: "#9fbd63", light: "#e5ed9a", eye: "#1a2410" },
  moss_ancientRoot: { dark: "#5d522c", mid: "#c5c96a", light: "#fff0a6", eye: "#23180c" },
  meat_wolf: { dark: "#131820", mid: "#343a4a", light: "#9fa8ba", eye: "#ffdf6b" },
  meat_shadowWolf: { dark: "#0d1018", mid: "#25283a", light: "#8290b8", eye: "#c6d8ff" },
  meat_nightfangKing: { dark: "#080b12", mid: "#1a1d2b", light: "#6f78a0", eye: "#ffe08a" },
  meat_boar: { dark: "#442518", mid: "#8a4a32", light: "#d49668", eye: "#fff0c8" },
  meat_fangBoar: { dark: "#562817", mid: "#ad5b37", light: "#edb07a", eye: "#fff0c8" },
  meat_ironBoar: { dark: "#67351e", mid: "#c06d43", light: "#f0c08a", eye: "#fff0c8" },
  meat_hedgehog: { dark: "#3c342b", mid: "#7d6750", light: "#d8c6a0", eye: "#fff0c8" },
  meat_steelHedgehog: { dark: "#4a463e", mid: "#9a8a74", light: "#e0d8c0", eye: "#fff0c8" },
  meat_spineKing: { dark: "#5f5638", mid: "#c3b180", light: "#fff0b0", eye: "#fff0c8" },
  bug_centipede: { dark: "#351f5f", mid: "#844bd6", light: "#d8b8ff", eye: "#adff8e" },
  bug_steelCentipede: { dark: "#4a2f6a", mid: "#b064e8", light: "#e7c8ff", eye: "#adff8e" },
  bug_goldCentipede: { dark: "#4f3618", mid: "#d2a744", light: "#ffe8a0", eye: "#c9ff9a" },
  bug_beetle: { dark: "#263524", mid: "#52664a", light: "#b8c8a0", eye: "#eaffd8" },
  bug_shieldBeetle: { dark: "#34422a", mid: "#71865c", light: "#d0d8a8", eye: "#eaffd8" },
  bug_fortressBeetle: { dark: "#4c4c2a", mid: "#9da45f", light: "#f0e8a6", eye: "#eaffd8" },
  bug_needler: { dark: "#2b1a52", mid: "#7c45d6", light: "#caa6ff", eye: "#adff8e" },
  bug_flyingNeedler: { dark: "#50255a", mid: "#b85fcf", light: "#f0b8ff", eye: "#c9ff9a" },
  bug_bowNeedler: { dark: "#5b371f", mid: "#cf8a3f", light: "#ffd08a", eye: "#fff0c8" },
  stone_turtle: { dark: "#2d3a4d", mid: "#647a96", light: "#c8d8ea", eye: "#d9ecff" },
  stone_ironTurtle: { dark: "#414a54", mid: "#8d9aa5", light: "#edf3ff", eye: "#d9ecff" },
  stone_goldTurtle: { dark: "#5f4f22", mid: "#d1b45f", light: "#fff0a6", eye: "#fff6d8" },
  stone_magnetCrab: { dark: "#243747", mid: "#516f86", light: "#b8d8e8", eye: "#d9ecff" },
  stone_ironCrab: { dark: "#314c60", mid: "#6b8ca2", light: "#d0e8f0", eye: "#d9ecff" },
  stone_blackCrab: { dark: "#142433", mid: "#334a5a", light: "#9fb0bd", eye: "#d9ecff" },
  stone_crystalEye: { dark: "#23506a", mid: "#8bc7e6", light: "#e8fbff", eye: "#fff6d8" },
  stone_quartzEye: { dark: "#566c78", mid: "#c8e2f0", light: "#ffffff", eye: "#fff6d8" },
  stone_rainbowEye: { dark: "#5a426a", mid: "#f0d8ff", light: "#fff8ff", eye: "#fff6d8" },
  dragon_serpent: { dark: "#244d32", mid: "#5fa36d", light: "#c0f0b0", eye: "#fff7c2" },
  dragon_flameSerpent: { dark: "#6a2818", mid: "#d06a3a", light: "#ffd090", eye: "#fff7c2" },
  dragon_whiteSerpent: { dark: "#6a6040", mid: "#f4f1cf", light: "#ffffff", eye: "#65f4ff" },
  dragon_salamander: { dark: "#6a1f18", mid: "#e6502f", light: "#ffd06a", eye: "#fff7c2" },
  dragon_lavaSalamander: { dark: "#7a1e08", mid: "#ff7a24", light: "#ffe06a", eye: "#fff7c2" },
  dragon_mirageSalamander: { dark: "#7a4a08", mid: "#ffd06a", light: "#fff6b7", eye: "#fff7c2" },
  dragon_wyvern: { dark: "#24465a", mid: "#7eb8d8", light: "#d8f5ff", eye: "#fff7c2" },
  dragon_stormWyvern: { dark: "#1d346a", mid: "#6ca0f0", light: "#c8e8ff", eye: "#fff7c2" },
  dragon_skyWyvern: { dark: "#42606a", mid: "#d9f2ff", light: "#ffffff", eye: "#65f4ff" },
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
  shon: { dark: "#171a22", mid: "#5c6978", light: "#c4d1dd", skin: "#e0aa80", metal: "#f0f4f8", accent: "#ffcf4d", weapon: "handgun" },
  hori: { dark: "#51332b", mid: "#b56f55", light: "#f3c092", skin: "#e3a679", metal: "#d8dde4", accent: "#8ed36f", weapon: "vegetable" },
  xTerminator: { dark: "#080b10", mid: "#1e2832", light: "#7a8794", skin: "#aeb7c0", metal: "#cfd8e3", accent: "#ff3355", weapon: "handgun" },
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

function drawNeedler(img, pal, cx, cy, dx, dy, action, frame) {
  const thrust = action === "attack" || action === "cast" ? [0, 2, 5, 2][frame] : 0;
  const faceX = dx || 1;
  oval(img, cx, cy + 14, 17, 4, "#0c0812", 76);
  if (dx === 0) {
    const lift = dy < 0 ? -3 : 2;
    for (let i = 0; i < 5; i++) {
      const y = cy - 9 + i * 7 + lift;
      const w = 8 + (i % 2) * 2;
      oval(img, cx, y, w, 5, i % 2 ? pal.mid : pal.dark, 245);
      tri(img, cx - w, y, cx - w - 6, y - 3, cx - w - 2, y + 4, pal.light, 190);
      tri(img, cx + w, y, cx + w + 6, y - 3, cx + w + 2, y + 4, pal.light, 190);
    }
    const headY = dy < 0 ? cy - 13 : cy - 6;
    oval(img, cx, headY, 10, 8, pal.mid, 250);
    line(img, cx, headY - 2, cx, headY + dy * (15 + thrust), pal.light, 3, 235);
    diamond(img, cx, headY + dy * (17 + thrust), 3, pal.eye, 220);
    if (dy >= 0) {
      drawEye(img, cx - 4, headY - 2, pal);
      drawEye(img, cx + 4, headY - 2, pal);
    } else {
      line(img, cx - 8, headY + 5, cx + 8, headY + 3, pal.light, 2, 150);
    }
    return;
  }
  const headX = cx + faceX * (12 + thrust);
  for (let i = 0; i < 5; i++) {
    const sx = cx - faceX * (13 - i * 6);
    const sy = cy + Math.sin((frame + i) * 1.2) * 2;
    oval(img, sx, sy + 3, 8, 6, i % 2 ? pal.mid : pal.dark, 245);
    tri(img, sx, sy - 3, sx - faceX * 3, sy - 12, sx + faceX * 4, sy - 4, pal.light, 180);
    tri(img, sx, sy + 8, sx - faceX * 2, sy + 16, sx + faceX * 5, sy + 9, pal.light, 160);
  }
  oval(img, headX - faceX * 5, cy + 1, 9, 7, pal.mid, 250);
  line(img, headX - faceX, cy, headX + faceX * 15, cy - 2 + dy * 4, pal.light, 3, 245);
  diamond(img, headX + faceX * 17, cy - 2 + dy * 4, 3, pal.eye, 225);
  drawEye(img, headX - faceX * 3, cy - 4 + Math.max(0, dy), pal);
}

function drawSalamander(img, pal, cx, cy, dx, dy, action, frame) {
  const flare = action === "attack" || action === "cast" ? [0, 1, 4, 1][frame] : 0;
  const faceX = dx || 1;
  oval(img, cx, cy + 15, 18, 4, "#0c0812", 82);
  if (dx === 0) {
    const headY = dy >= 0 ? cy - 8 + flare : cy + 4;
    const tailY = dy >= 0 ? cy + 18 : cy - 17 - flare;
    oval(img, cx, cy + 4, 12, 16, pal.dark, 245);
    oval(img, cx, cy + 1, 9, 13, pal.mid, 240);
    oval(img, cx, headY, 11, 8, pal.mid, 250);
    line(img, cx, cy + 14, cx, tailY, pal.dark, 5, 235);
    diamond(img, cx, tailY + (dy >= 0 ? 3 : -3), 3, pal.light, 180);
    for (const sx of [-11, 11]) {
      line(img, cx + sx * 0.45, cy + 1, cx + sx, cy + 8, pal.dark, 3, 230);
      line(img, cx + sx * 0.4, cy + 11, cx + sx, cy + 17, pal.dark, 3, 230);
      diamond(img, cx + sx, cy + 8, 2, pal.light, 190);
      diamond(img, cx + sx, cy + 17, 2, pal.light, 175);
    }
    tri(img, cx - 4, cy - 3, cx, cy - 16 - flare, cx + 4, cy - 3, pal.light, 165);
    if (dy >= 0) {
      drawEye(img, cx - 4, headY - 2, pal);
      drawEye(img, cx + 4, headY - 2, pal);
    } else {
      line(img, cx - 8, cy + 3, cx + 8, cy + 1, pal.light, 2, 145);
    }
    return;
  }
  const headX = cx + faceX * (12 + flare);
  oval(img, cx - faceX * 2, cy + 5, 17, 8, pal.dark, 245);
  oval(img, cx - faceX, cy + 2, 13, 7, pal.mid, 245);
  oval(img, headX - faceX * 4, cy - 2 + dy * 3, 8, 7, pal.mid, 250);
  line(img, cx - faceX * 14, cy + 7, cx - faceX * 24, cy + 1 - dy * 3, pal.dark, 5, 235);
  diamond(img, cx - faceX * 26, cy - dy * 3, 3, pal.light, 180);
  for (const sx of [-7, 5]) {
    const lx = cx + sx - faceX * 2;
    line(img, lx, cy + 9, lx + faceX * 5, cy + 17, pal.dark, 3, 230);
    diamond(img, lx + faceX * 5, cy + 17, 2, pal.light, 190);
  }
  tri(img, cx - faceX * 3, cy - 2, cx + faceX * 2, cy - 16, cx + faceX * 7, cy - 2, pal.light, 160);
  drawEye(img, headX - faceX, cy - 5 + Math.max(0, dy), pal);
  if (action === "attack" || action === "cast") {
    tri(img, headX + faceX * 4, cy - 2, headX + faceX * (14 + flare), cy - 8, headX + faceX * (12 + flare), cy + 5, pal.light, 190);
    diamond(img, headX + faceX * (16 + flare), cy - 2, 3, pal.eye, 180);
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

function drawVirus(img, pal, cx, cy, dx, dy, action, frame) {
  const faceX = dx === 0 ? 1 : Math.sign(dx);
  const aimX = dx === 0 ? 0 : Math.sign(dx);
  const aimY = dy === 0 ? 0 : Math.sign(dy);
  const pulse = action === "idle" ? [0, 1, 0, -1][frame] : [0, -1, 2, -1][frame];
  oval(img, cx, cy + 12, 13, 4, "#0c0812", 70);
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + (frame % 2) * 0.12;
    const x0 = cx + Math.cos(a) * 12;
    const y0 = cy + Math.sin(a) * 8 + 4;
    const x1 = cx + Math.cos(a) * 18;
    const y1 = cy + Math.sin(a) * 13 + 8 + Math.abs(Math.sin(a)) * 2;
    line(img, x0, y0, x1, y1, pal.dark, 2, 230);
    diamond(img, x1, y1, 2, pal.mid, 210);
  }
  diamond(img, cx, cy + pulse, 15, pal.dark, 230);
  tri(img, cx, cy - 15 + pulse, cx + 15, cy + pulse, cx, cy + 15 + pulse, pal.mid, 245);
  tri(img, cx, cy - 15 + pulse, cx - 15, cy + pulse, cx, cy + 15 + pulse, pal.light, 150);
  line(img, cx, cy + pulse, cx + aimX * 13, cy + aimY * 12 + pulse, pal.eye, 3, 210);
  diamond(img, cx + aimX * 14, cy + aimY * 13 + pulse, 3, pal.light, 220);
  diamond(img, cx - faceX * 4, cy - 3 + pulse, 2, pal.eye, 245);
  diamond(img, cx + faceX * 4, cy - 2 + pulse, 2, pal.eye, 230);
  if (dy < 0) line(img, cx - 10, cy + 7 + pulse, cx + 10, cy + 7 + pulse, pal.dark, 3, 220);
  if (dy > 0) line(img, cx - 11, cy - 8 + pulse, cx + 11, cy - 8 + pulse, pal.light, 2, 190);
  if (nameHasCrown(pal)) {
    rect(img, cx - 7, cy - 19 + pulse, 14, 3, "#ffcf4d", 220);
    for (let i = -1; i <= 1; i++) tri(img, cx + i * 5 - 3, cy - 17 + pulse, cx + i * 5, cy - 24 + pulse, cx + i * 5 + 3, cy - 17 + pulse, "#ffcf4d", 210);
  }
}

function nameHasCrown(pal) {
  return pal.mid === "#b4fff0";
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
  else if (base === "virus") drawVirus(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "carniv") drawDogBeast(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "spitter") drawSpider(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "needler") drawNeedler(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "golem") drawGolem(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "flame") drawDragon(img, pal, cx, cy, dx, dy, action, frame);
  else if (base === "salamander") drawSalamander(img, pal, cx, cy, dx, dy, action, frame);
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
  const recoil = frame >= 2 ? -3 : 0;
  const gx = cx + fx * (13 + recoil);
  const gy = cy - 6 + dy * 4;
  line(img, cx + fx * 5, cy, gx, gy, pal.skin, 4, 235);
  rect(img, gx - (fx < 0 ? 13 : 0), gy - 4, 13, 7, "#10131a", 250);
  rect(img, gx + fx * 7 - (fx < 0 ? 11 : 0), gy - 3, 13, 5, pal.metal, 245);
  rect(img, gx + fx * 2 - (fx < 0 ? 8 : 0), gy - 2, 8, 3, "#394454", 235);
  rect(img, gx - (fx < 0 ? 3 : 0), gy + 1, 4, 8, "#080a10", 250);
  if (frame >= 2) {
    diamond(img, gx + fx * 20, gy - 1, 4, "#fff1a6", 230);
    line(img, gx + fx * 12, gy - 1, gx + fx * 24, gy - 1, "#ffcf4d", 2, 155);
  }
}

function drawVegetable(img, cx, cy, rx = 5, ry = 7, alpha = 245) {
  oval(img, cx, cy, rx, ry, "#8ed36f", alpha);
  oval(img, cx - 1, cy + 1, Math.max(2, rx - 2), Math.max(3, ry - 2), "#5fb85d", Math.max(0, alpha - 20));
  line(img, cx - 1, cy - ry, cx + 4, cy - ry - 5, "#6fb85a", 2, alpha);
  diamond(img, cx + 3, cy - ry - 4, 2, "#b8f08a", Math.max(0, alpha - 10));
}

function drawVegetableThrow(img, cx, cy, dx, dy, frame, pal) {
  const fx = dx || 1;
  const wind = [0, 2, 8, 4][frame];
  const sx = cx + fx * 8;
  const sy = cy - 3 + dy * 4;
  line(img, cx + fx * 4, cy + 2, sx, sy, pal.skin, 4, 235);
  drawVegetable(img, sx + fx * (5 + wind), sy - 2, 5, 7, 245);
  if (frame >= 2) {
    line(img, sx - fx * 2, sy + 2, sx - fx * 10, sy + 5, "#b8f08a", 1, 120);
    diamond(img, sx + fx * (14 + wind), sy - 3, 2, "#fff1a6", 150);
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
    rect(img, cx - 10, cy - 5, 20, 24, "#05060a", 250);
    tri(img, cx - 14, cy + 19, cx - 8, cy - 1, cx - 2, cy + 19, "#030409", 245);
    tri(img, cx + 14, cy + 19, cx + 8, cy - 1, cx + 2, cy + 19, "#030409", 245);
    tri(img, cx - 9, cy - 5, cx - 2 + dx * 2, cy + 8, cx, cy - 5, pal.light, 180);
    tri(img, cx + 9, cy - 5, cx + 2 + dx * 2, cy + 8, cx, cy - 5, pal.mid, 210);
    line(img, cx, cy - 3, cx, cy + 18, "#0f1320", 2, 210);
    line(img, cx - 9, cy + 3, cx + 9, cy + 3, "#303849", 1, 150);
  } else {
    oval(img, cx, cy + 4, 11, 12, pal.dark, 245);
    rect(img, cx - 9, cy - 5, 18, 20, pal.mid, 235);
    line(img, cx - 8, cy - 3, cx + 8, cy + 4, pal.light, 2, 150);
  }
  if (name === "shon") {
    rect(img, headX - 8, headY - 8, 16, 18, "#131720", 235);
    tri(img, headX - 8, headY - 3, headX - 3, headY + 14, headX + 1, headY + 2, "#10131a", 230);
    tri(img, headX + 8, headY - 3, headX + 3, headY + 14, headX - 1, headY + 2, "#10131a", 230);
  } else if (name === "xTerminator") {
    oval(img, cx, cy + 4, 13, 13, "#0a0d13", 245);
    rect(img, cx - 9, cy - 7, 18, 23, "#18202b", 245);
    line(img, cx - 8, cy - 4, cx + 8, cy + 5, "#4f5968", 2, 155);
    diamond(img, cx, cy + 7, 3, "#ff3355", 210);
  }
  oval(img, headX, headY, name === "hori" ? 9 : 8, 8, name === "xTerminator" ? "#222c38" : pal.skin, 245);
  if (name === "max") {
    rect(img, headX - 4, headY + 5, 8, 3, "#05060a", 235);
    tri(img, headX - 7, headY + 4, headX - 2, headY + 10, headX + 1, headY + 4, "#05060a", 230);
    tri(img, headX + 7, headY + 4, headX + 2, headY + 10, headX - 1, headY + 4, "#05060a", 230);
    rect(img, headX - 7, headY - 2 + dy, 6, 3, "#05060a", 255);
    rect(img, headX + 1, headY - 2 + dy, 6, 3, "#05060a", 255);
    rect(img, headX - 1, headY - 1 + dy, 2, 1, "#05060a", 255);
    rect(img, headX - 5, headY - 1 + dy, 2, 1, "#3b4659", 170);
    rect(img, headX + 3, headY - 1 + dy, 2, 1, "#3b4659", 170);
  } else if (name === "shon") {
    rect(img, headX - 8, headY - 9, 16, 6, "#10131a", 245);
    rect(img, headX - 9, headY - 4, 4, 12, "#10131a", 230);
    rect(img, headX + 5, headY - 4, 4, 12, "#10131a", 230);
    line(img, headX - 7, headY - 7, headX + 7, headY - 5, "#343b48", 1, 160);
    rect(img, headX - 4, headY - 1 + dy, 3, 2, "#171b24", 230);
    rect(img, headX + 2, headY - 1 + dy, 3, 2, "#171b24", 230);
  } else if (name === "xTerminator") {
    rect(img, headX - 8, headY - 9, 16, 5, "#111722", 245);
    line(img, headX - 6, headY - 1 + dy, headX + 6, headY + 3 + dy, "#ff3355", 2, 250);
    line(img, headX + 6, headY - 1 + dy, headX - 6, headY + 3 + dy, "#ff3355", 2, 250);
    diamond(img, headX, headY + 1 + dy, 2, "#ff99aa", 220);
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
  const modern = ["max", "shon", "hori", "xTerminator"].includes(name);
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
  } else if (weapon === "vegetable") {
    if (action === "attack") drawFist(img, cx, cy, dx, dy, frame, pal);
    else if (action === "eat") {
      drawVegetable(img, cx + (dx || 1) * 10, cy - 4 + dy * 4, 5, 7, 245);
    } else drawVegetableThrow(img, cx, cy, dx, dy, action === "cast" ? frame : 0, pal);
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

const ITEM_ICON_SHAPES = {
  rustyPickaxe: "pickaxe", blackSoilBag: "bag", undergroundLantern: "lantern", crackedMap: "map", masonGloves: "glove", deepCompass: "compass", oldIncense: "incense",
  herdFlute: "flute", warmNest: "nest", eggGuardBell: "bellEgg", boneMeal: "powder", redCollar: "collar", warPaint: "paint", sleepSand: "sand", curseNail: "nail", blackBell: "bell", stickyMud: "mud",
  coreShard: "crystal", coreBandage: "bandage", redSealingWax: "wax", quakeStone: "crackedStone", leftoverMeat: "meat", silverMuzzle: "muzzle", bloodyPlate: "plate", trainingStick: "stick",
  victoryBoneFlute: "boneFlute", crybabyBell: "tearBell", shadowThread: "thread", spareHeart: "heart", ledger: "book", tornWallet: "wallet", demonCoin: "coin", fakeGold: "fakeCoin", wildCard: "card",
  thiefBag: "bagMask", dryBread: "bread", blackSeed: "seed", reversedHourglass: "hourglass", earlyDrum: "drum", breathingFlute: "fluteWind", gapStake: "stake", moleClaw: "claw", obsidianLid: "lid",
  wanderingPowder: "swirlPowder", trailMark: "trail", charmRope: "rope", angerMask: "mask", nestFlag: "flag", oldEggshell: "oldEgg", crackedEgg: "crackedEgg", royalEggshell: "royalEgg", rottenCrown: "crown",
  rebelCharm: "charm", crowdMark: "crowd", lowestCandle: "candle", blackRaindrop: "raindrop", redMoonShard: "moon", boneContract: "contract",
  undergroundStore: "bag", veinBrush: "paint", denLedger: "book", homeChime: "bell", shopStamp: "stamp", corePiggyBank: "piggyBank",
};

const ITEM_ICON_PALETTES = [
  ["#3a2a20", "#b77943", "#ffe08a"], ["#17251d", "#4f8a5a", "#bff7bd"], ["#20283a", "#5ab0ff", "#fff0a6"], ["#4a3422", "#d6b074", "#fff4c8"],
  ["#3a2d32", "#c9a08a", "#f2d2ba"], ["#172137", "#6f86c4", "#ffcf4d"], ["#33253a", "#8d6a9f", "#e7d4ff"], ["#20343c", "#6cb7b2", "#eaffd8"],
  ["#342417", "#8a5a3c", "#e7c88a"], ["#3d2630", "#d95b72", "#ffe8f0"], ["#2d2d32", "#cfd8e3", "#ffffff"], ["#3d2020", "#e0556b", "#ffd0d0"],
  ["#3a2238", "#a65cff", "#ffd76a"], ["#3d3322", "#d9b27a", "#fff1a6"], ["#251f26", "#6a6f86", "#d8dde4"], ["#15151b", "#3b4250", "#dfe7ef"],
];

function itemIconPalette(name) {
  const idx = Math.max(0, ITEM_ICONS.indexOf(name));
  const base = ITEM_ICON_PALETTES[idx % ITEM_ICON_PALETTES.length];
  return { dark: base[0], mid: base[1], light: base[2], idx };
}

function itemDots(img, idx, pal) {
  const pts = [[10, 11], [38, 11], [10, 38], [38, 38]];
  for (let i = 0; i < pts.length; i++) if ((idx + i) % 3 === 0) diamond(img, pts[i][0], pts[i][1], 2, pal.light, 180);
}

function drawItemIcon(name) {
  const img = image();
  const pal = itemIconPalette(name);
  const shape = ITEM_ICON_SHAPES[name] || "crystal";
  oval(img, 24, 36, 17, 5, "#0c0812", 82);
  diamond(img, 24, 24, 19, pal.dark, 42);

  if (shape === "pickaxe") {
    line(img, 14, 36, 32, 14, "#6a4428", 5, 245); line(img, 15, 36, 33, 14, "#d7a15d", 2, 245); line(img, 17, 15, 38, 19, pal.mid, 5, 250); line(img, 16, 15, 22, 11, pal.light, 3, 235);
  } else if (shape === "bag" || shape === "bagMask") {
    oval(img, 24, 27, 14, 12, pal.mid, 250); rect(img, 15, 17, 18, 8, pal.dark, 245); line(img, 16, 21, 32, 21, pal.light, 2, 230); if (shape === "bagMask") { rect(img, 19, 25, 10, 5, "#11131a", 230); rect(img, 20, 26, 2, 2, pal.light, 230); rect(img, 27, 26, 2, 2, pal.light, 230); }
  } else if (shape === "lantern") {
    line(img, 18, 15, 24, 9, pal.light, 2, 210); line(img, 24, 9, 30, 15, pal.light, 2, 210); rect(img, 16, 16, 16, 20, pal.dark, 250); rect(img, 19, 19, 10, 13, "#ffe08a", 235); oval(img, 24, 26, 12, 12, "#fff1a6", 70);
  } else if (shape === "map") {
    rect(img, 11, 14, 27, 20, "#d8c9a0", 250); line(img, 19, 15, 17, 34, pal.dark, 1, 180); line(img, 29, 14, 31, 34, pal.dark, 1, 180); line(img, 14, 24, 34, 19, pal.mid, 2, 210); diamond(img, 33, 29, 3, pal.light, 230);
  } else if (shape === "glove") {
    oval(img, 24, 29, 10, 9, pal.mid, 250); for (let i = 0; i < 4; i++) rect(img, 15 + i * 5, 13 + (i % 2), 4, 13, pal.light, 245); rect(img, 17, 34, 14, 5, pal.dark, 240);
  } else if (shape === "compass") {
    oval(img, 24, 24, 15, 15, pal.mid, 250); oval(img, 24, 24, 11, 11, "#182033", 250); tri(img, 24, 12, 28, 26, 21, 24, pal.light, 245); tri(img, 24, 36, 20, 23, 27, 25, "#e0556b", 235); diamond(img, 24, 24, 2, "#ffffff", 230);
  } else if (shape === "incense") {
    oval(img, 24, 32, 14, 5, pal.mid, 245); rect(img, 15, 29, 18, 5, pal.dark, 245); for (let i = 0; i < 3; i++) line(img, 18 + i * 5, 25, 16 + i * 6, 13, pal.light, 1, 135);
  } else if (shape === "flute" || shape === "fluteWind" || shape === "boneFlute") {
    const body = shape === "boneFlute" ? "#d9d0ba" : pal.mid; line(img, 12, 29, 36, 17, body, 6, 245); for (let i = 0; i < 4; i++) oval(img, 19 + i * 5, 25 - i * 2, 1, 1, pal.dark, 250); if (shape === "fluteWind") { line(img, 33, 16, 39, 13, pal.light, 1, 160); line(img, 34, 20, 41, 20, pal.light, 1, 150); }
  } else if (shape === "nest" || shape === "oldEgg" || shape === "crackedEgg" || shape === "royalEgg") {
    for (let i = 0; i < 5; i++) line(img, 12 + i * 5, 33, 19 + i * 4, 24, "#8a5a3c", 2, 210); oval(img, 24, 27, 9, 12, pal.light, 245); if (shape === "crackedEgg") line(img, 20, 21, 24, 26, pal.dark, 2, 245); if (shape === "royalEgg") { diamond(img, 24, 14, 5, "#ffcf4d", 235); rect(img, 18, 18, 12, 3, "#ffcf4d", 235); } if (shape === "oldEgg") oval(img, 21, 25, 2, 2, "#7a6f58", 200);
  } else if (shape === "bell" || shape === "bellEgg" || shape === "tearBell") {
    tri(img, 15, 32, 24, 13, 33, 32, pal.mid, 250); rect(img, 15, 31, 18, 4, pal.dark, 245); oval(img, 24, 36, 4, 3, pal.light, 240); if (shape === "bellEgg") oval(img, 24, 24, 5, 7, "#fff1c0", 235); if (shape === "tearBell") diamond(img, 34, 26, 3, "#75c7ff", 220);
  } else if (shape === "powder" || shape === "sand" || shape === "swirlPowder") {
    rect(img, 16, 14, 16, 19, pal.mid, 225); rect(img, 18, 11, 12, 5, pal.light, 235); for (let i = 0; i < 8; i++) diamond(img, 13 + (i * 7) % 24, 31 + (i % 3), 1 + (i % 2), pal.light, 210); if (shape === "swirlPowder") line(img, 13, 18, 35, 30, "#dfe7ff", 2, 170);
  } else if (shape === "collar" || shape === "muzzle" || shape === "rope") {
    oval(img, 24, 25, 14, 10, pal.mid, 245); oval(img, 24, 25, 9, 6, "#000000", 0); line(img, 14, 25, 34, 25, pal.light, 3, 235); if (shape === "muzzle") { rect(img, 16, 23, 16, 6, "#cfd8e3", 230); line(img, 17, 20, 31, 31, pal.dark, 2, 220); } if (shape === "rope") line(img, 13, 33, 36, 16, "#d9b27a", 3, 235);
  } else if (shape === "paint" || shape === "plate") {
    oval(img, 23, 29, 14, 7, pal.mid, 245); oval(img, 23, 29, 9, 4, shape === "plate" ? "#b51f33" : "#e0556b", 235); line(img, 30, 18, 38, 33, "#8a5a3c", 3, 240); diamond(img, 29, 18, 3, pal.light, 230);
  } else if (shape === "nail" || shape === "stake") {
    line(img, 16, 14, 32, 35, pal.mid, shape === "stake" ? 7 : 4, 245); tri(img, 13, 11, 22, 13, 16, 20, pal.light, 245); rect(img, 29, 34, 7, 4, pal.dark, 240);
  } else if (shape === "mud" || shape === "raindrop") {
    if (shape === "raindrop") {
      tri(img, 24, 9, 14, 30, 34, 30, pal.mid, 245);
      oval(img, 24, 30, 10, 8, pal.mid, 245);
    } else {
      oval(img, 22, 28, 13, 8, pal.mid, 245);
      oval(img, 33, 32, 5, 4, pal.dark, 220);
      oval(img, 14, 33, 4, 3, pal.light, 210);
    }
  } else if (shape === "crystal" || shape === "crackedStone" || shape === "moon") {
    diamond(img, 24, 24, 14, pal.mid, 245); tri(img, 24, 10, 36, 24, 24, 38, pal.light, 215); if (shape === "crackedStone") { line(img, 18, 15, 26, 25, "#11131a", 2, 230); line(img, 26, 25, 22, 35, "#11131a", 2, 230); } if (shape === "moon") oval(img, 27, 21, 12, 14, "#e0556b", 235);
  } else if (shape === "bandage" || shape === "wax" || shape === "charm" || shape === "contract") {
    rect(img, 12, 16, 24, 18, shape === "contract" ? "#d8c9a0" : pal.light, 245); line(img, 13, 18, 35, 32, pal.mid, 2, 190); line(img, 13, 32, 35, 18, pal.mid, 2, 190); if (shape === "wax") diamond(img, 24, 25, 6, "#d6543f", 245); if (shape === "charm") { rect(img, 18, 12, 12, 23, "#d9d0ba", 245); diamond(img, 24, 21, 3, "#e0556b", 230); } if (shape === "contract") { diamond(img, 30, 30, 4, "#7d1f2a", 235); line(img, 16, 21, 29, 21, pal.dark, 1, 180); }
  } else if (shape === "meat" || shape === "bread" || shape === "seed") {
    if (shape === "seed") { diamond(img, 24, 25, 12, "#101714", 245); tri(img, 24, 14, 34, 27, 22, 36, pal.mid, 220); diamond(img, 26, 24, 4, pal.light, 180); }
    else { oval(img, 24, 27, 13, 9, shape === "bread" ? "#d9a35f" : "#b7443f", 245); oval(img, 16, 25, 4, 4, shape === "bread" ? "#f0c27c" : "#ffe0c0", 235); line(img, 30, 22, 38, 16, "#e8d8c0", 4, 235); }
  } else if (shape === "stick" || shape === "claw") {
    if (shape === "claw") { for (let i = 0; i < 3; i++) tri(img, 16 + i * 7, 35, 20 + i * 6, 12, 25 + i * 6, 35, pal.light, 235); }
    else { line(img, 15, 34, 34, 15, "#8a5a3c", 5, 245); line(img, 17, 33, 36, 14, pal.light, 2, 220); }
  } else if (shape === "thread") {
    rect(img, 17, 15, 14, 20, pal.dark, 230); line(img, 15, 18, 33, 31, pal.mid, 2, 245); line(img, 16, 29, 34, 17, pal.light, 2, 235); line(img, 31, 31, 39, 36, pal.light, 1, 220);
  } else if (shape === "heart") {
    oval(img, 19, 21, 7, 7, "#e0556b", 245); oval(img, 29, 21, 7, 7, "#e0556b", 245); tri(img, 13, 24, 35, 24, 24, 38, "#b51f33", 245); diamond(img, 26, 20, 2, "#ffd0d0", 210);
  } else if (shape === "book" || shape === "wallet") {
    rect(img, 13, 13, 23, 25, shape === "book" ? pal.mid : "#6b3342", 245); rect(img, 17, 16, 15, 19, shape === "book" ? "#d8c9a0" : pal.dark, 235); line(img, 24, 14, 24, 37, pal.dark, 2, 210); if (shape === "wallet") diamond(img, 31, 25, 3, "#ffcf4d", 230);
  } else if (shape === "coin" || shape === "fakeCoin") {
    oval(img, 24, 24, 13, 13, "#ffcf4d", 245); oval(img, 24, 24, 8, 8, shape === "fakeCoin" ? "#8a8a7a" : "#d9a53d", 245); diamond(img, 24, 24, 4, pal.light, 210); if (shape === "fakeCoin") line(img, 16, 32, 33, 15, "#5c4d2b", 2, 220);
  } else if (shape === "card") {
    rect(img, 14, 12, 20, 26, "#ffffff", 245); diamond(img, 24, 25, 6, "#d6543f", 235); rect(img, 18, 16, 3, 3, pal.dark, 210); rect(img, 28, 32, 3, 3, pal.dark, 210);
  } else if (shape === "stamp") {
    rect(img, 17, 12, 14, 10, pal.dark, 245);
    rect(img, 14, 21, 20, 6, pal.mid, 245);
    rect(img, 12, 28, 24, 9, "#d8c9a0", 245);
    diamond(img, 24, 32, 4, "#d6543f", 230);
    line(img, 16, 36, 32, 36, pal.dark, 1, 190);
  } else if (shape === "piggyBank") {
    oval(img, 24, 27, 15, 10, "#d45f86", 245);
    oval(img, 36, 25, 4, 4, "#f09ab8", 240);
    tri(img, 14, 18, 19, 13, 21, 21, "#f09ab8", 235);
    rect(img, 18, 18, 12, 2, "#702040", 230);
    rect(img, 17, 35, 4, 5, "#8a3550", 230);
    rect(img, 29, 35, 4, 5, "#8a3550", 230);
    diamond(img, 30, 24, 2, pal.light, 210);
  } else if (shape === "hourglass") {
    line(img, 16, 12, 32, 12, pal.light, 2, 235); line(img, 16, 36, 32, 36, pal.light, 2, 235); tri(img, 18, 14, 30, 14, 24, 24, pal.mid, 180); tri(img, 18, 34, 30, 34, 24, 24, pal.mid, 230); line(img, 17, 13, 31, 35, pal.dark, 1, 190); line(img, 31, 13, 17, 35, pal.dark, 1, 190);
  } else if (shape === "drum") {
    oval(img, 24, 17, 13, 5, pal.light, 245); rect(img, 12, 17, 24, 18, pal.mid, 245); oval(img, 24, 35, 13, 5, pal.dark, 220); line(img, 14, 20, 34, 32, "#d9c38a", 2, 210); line(img, 34, 20, 14, 32, "#d9c38a", 2, 210);
  } else if (shape === "lid") {
    diamond(img, 24, 25, 15, "#101820", 245); diamond(img, 24, 23, 10, pal.mid, 230); line(img, 14, 32, 34, 18, pal.light, 2, 190);
  } else if (shape === "trail") {
    for (let i = 0; i < 4; i++) oval(img, 15 + i * 6, 32 - i * 5, 4, 3, pal.mid, 235); line(img, 10, 36, 36, 13, pal.light, 1, 140);
  } else if (shape === "mask") {
    oval(img, 24, 25, 14, 11, pal.mid, 245); rect(img, 17, 23, 5, 3, "#11131a", 245); rect(img, 27, 23, 5, 3, "#11131a", 245); tri(img, 19, 31, 29, 31, 24, 36, "#e0556b", 230);
  } else if (shape === "flag") {
    line(img, 18, 12, 18, 38, pal.light, 3, 240); rect(img, 19, 13, 17, 12, pal.mid, 245); tri(img, 19, 25, 35, 25, 19, 32, pal.dark, 220);
  } else if (shape === "crown") {
    tri(img, 13, 32, 18, 14, 23, 32, "#ffcf4d", 235); tri(img, 20, 32, 24, 10, 29, 32, "#d9a53d", 245); tri(img, 26, 32, 32, 15, 36, 32, "#ffcf4d", 225); rect(img, 14, 31, 21, 5, pal.dark, 235);
  } else if (shape === "crowd") {
    for (let i = 0; i < 5; i++) { oval(img, 12 + i * 6, 20 + (i % 2) * 3, 4, 4, pal.light, 240); rect(img, 9 + i * 6, 25 + (i % 2) * 3, 6, 9, pal.mid, 230); }
  } else if (shape === "candle") {
    rect(img, 20, 18, 9, 19, "#e8dcc0", 245); tri(img, 18, 18, 25, 7, 31, 18, "#ff8a3a", 235); tri(img, 21, 18, 25, 11, 28, 18, "#fff1a6", 245); rect(img, 18, 36, 13, 3, pal.dark, 230);
  }

  itemDots(img, pal.idx, pal);
  clearCellEdge(img);
  return img;
}

function drawDebuffIcon(name) {
  const img = image();
  oval(img, 24, 36, 17, 5, "#0c0812", 90);
  diamond(img, 24, 24, 19, "#3a121b", 70);
  if (name === "rottenRations") {
    oval(img, 24, 27, 12, 10, "#6c5a32", 245);
    rect(img, 15, 20, 18, 8, "#3b2b1a", 240);
    diamond(img, 18, 24, 2, "#91c46a", 230);
    diamond(img, 30, 30, 2, "#5f8a45", 220);
    line(img, 15, 35, 34, 16, "#ff6b6b", 2, 215);
  } else if (name === "crackedCore") {
    diamond(img, 24, 24, 15, "#e0556b", 245);
    diamond(img, 24, 23, 10, "#ff9aa8", 220);
    line(img, 23, 10, 20, 24, "#170912", 2, 230);
    line(img, 20, 24, 27, 28, "#170912", 2, 230);
    line(img, 27, 28, 23, 39, "#170912", 2, 230);
  } else if (name === "informantMap") {
    rect(img, 11, 14, 27, 20, "#d8c9a0", 245);
    line(img, 19, 15, 17, 34, "#4a2d22", 1, 190);
    line(img, 13, 29, 34, 17, "#ff3355", 2, 225);
    rect(img, 26, 23, 8, 5, "#17131a", 230);
    rect(img, 28, 24, 2, 2, "#ffcf4d", 235);
    rect(img, 32, 24, 2, 2, "#ffcf4d", 235);
  } else if (name === "sharpenedBlade") {
    line(img, 15, 36, 34, 12, "#cfd8e3", 6, 245);
    line(img, 18, 36, 37, 13, "#ffffff", 2, 230);
    rect(img, 12, 34, 11, 5, "#4a2c1c", 245);
    for (let i = 0; i < 3; i++) diamond(img, 31 + i * 3, 15 + i * 6, 2, "#ff3355", 210);
  } else if (name === "dullFeed") {
    oval(img, 24, 28, 13, 9, "#5b5142", 245);
    rect(img, 14, 20, 20, 7, "#847761", 230);
    for (let i = 0; i < 6; i++) diamond(img, 15 + i * 4, 30 + (i % 2), 1, "#2e3a24", 230);
    line(img, 13, 17, 35, 37, "#ff6b6b", 2, 210);
  }
  clearCellEdge(img);
  return img;
}

function drawDialoguePortrait(name) {
  const img = image();
  oval(img, 24, 42, 17, 4, "#0c0812", 110);
  diamond(img, 24, 25, 20, "#241a36", 55);
  if (name === "executive") {
    tri(img, 12, 42, 24, 9, 36, 42, "#211329", 245);
    tri(img, 15, 42, 24, 16, 33, 42, "#4b2b6f", 235);
    line(img, 15, 40, 24, 13, "#9a73d6", 2, 180);
    line(img, 33, 40, 24, 13, "#9a73d6", 2, 180);
    rect(img, 17, 34, 14, 7, "#3a234f", 245);
    oval(img, 24, 22, 9, 10, "#d0a17a", 245);
    rect(img, 17, 20, 14, 5, "#2a153c", 245);
    tri(img, 15, 20, 24, 6, 33, 20, "#30184a", 245);
    tri(img, 20, 13, 24, 4, 28, 13, "#ffcf4d", 235);
    line(img, 18, 27, 30, 27, "#2a1117", 1, 220);
    rect(img, 20, 22, 3, 2, "#101018", 245);
    rect(img, 27, 22, 3, 2, "#101018", 245);
    diamond(img, 24, 35, 4, "#ffcf4d", 235);
    line(img, 13, 42, 35, 42, "#5a3f7c", 2, 190);
  } else if (name === "gorilla") {
    rect(img, 15, 34, 18, 9, "#6a4430", 245);
    rect(img, 16, 34, 16, 8, "#f0d6b0", 235);
    oval(img, 24, 23, 14, 13, "#5a3828", 245);
    oval(img, 24, 29, 11, 8, "#b98a69", 245);
    oval(img, 14, 24, 4, 5, "#4b2d22", 235);
    oval(img, 34, 24, 4, 5, "#4b2d22", 235);
    oval(img, 20, 24, 2, 2, "#111018", 245);
    oval(img, 28, 24, 2, 2, "#111018", 245);
    rect(img, 21, 30, 6, 2, "#3a1d18", 230);
    line(img, 18, 35, 30, 35, "#8f4f5a", 2, 210);
    tri(img, 11, 42, 17, 31, 23, 42, "#7a4c36", 230);
    tri(img, 25, 42, 31, 31, 37, 42, "#7a4c36", 230);
    diamond(img, 24, 39, 3, "#ffcf4d", 220);
  }
  noise(img, name === "executive" ? 19 : 23, ["#ffffff", "#ffcf4d", "#5a3f7c"], 9, 55);
  clearCellEdge(img);
  return img;
}

function writeSourceFrames() {
  for (const dir of ["actors", "tiles", "effects", "items", "debuffs", "dialogue"]) ensureDir(path.join(SOURCE_DIR, dir));
  for (const name of TILES) writePng(spritePath("tiles", name), drawTile(name));
  for (const name of ACTORS) {
    for (const action of ACTIONS) for (const dir of DIRECTIONS) for (let f = 0; f < FRAMES; f++) {
      writePng(spritePath("actors", name, f, dir, action), drawActor(name, f, dir, action));
    }
  }
  for (const name of EFFECTS) for (let f = 0; f < FRAMES; f++) writePng(spritePath("effects", name, f), drawEffect(name, f));
  for (const name of ITEM_ICONS) writePng(spritePath("items", name), drawItemIcon(name));
  for (const name of DEBUFF_ICONS) writePng(spritePath("debuffs", name), drawDebuffIcon(name));
  for (const name of DIALOGUE_PORTRAITS) writePng(spritePath("dialogue", name), drawDialoguePortrait(name));
}

function actorFrameX(actionIndex, dirIndex, frame) {
  return ((actionIndex * ACTOR_RENDER_DIRECTIONS.length + dirIndex) * FRAMES + frame) * CELL;
}

function writeAtlas() {
  ensureDir(OUT_DIR);
  const oldActors = path.join(OUT_DIR, "actors.png");
  if (fs.existsSync(oldActors)) fs.rmSync(oldActors);
  for (const sheet in ACTOR_SHEETS) {
    const names = ACTOR_SHEETS[sheet];
    const actors = image(CELL * FRAMES * ACTOR_RENDER_DIRECTIONS.length * ACTIONS.length, CELL * names.length);
    names.forEach((name, row) => ACTIONS.forEach((action, ai) => ACTOR_RENDER_DIRECTIONS.forEach((dir, di) => {
      for (let f = 0; f < FRAMES; f++) copyInto(actors, readPng(spritePath("actors", name, f, dir, action)), actorFrameX(ai, di, f), row * CELL);
    })));
    writePng(path.join(OUT_DIR, `actor_${sheet}.png`), actors);
  }

  const tiles = image(CELL * TILES.length, CELL);
  TILES.forEach((name, col) => copyInto(tiles, readPng(spritePath("tiles", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "tiles.png"), tiles);

  const effects = image(CELL * FRAMES, CELL * EFFECTS.length);
  EFFECTS.forEach((name, row) => {
    for (let f = 0; f < FRAMES; f++) copyInto(effects, readPng(spritePath("effects", name, f)), f * CELL, row * CELL);
  });
  writePng(path.join(OUT_DIR, "effects.png"), effects);

  const items = image(CELL * ITEM_ICONS.length, CELL);
  ITEM_ICONS.forEach((name, col) => copyInto(items, readPng(spritePath("items", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "items.png"), items);

  const debuffs = image(CELL * DEBUFF_ICONS.length, CELL);
  DEBUFF_ICONS.forEach((name, col) => copyInto(debuffs, readPng(spritePath("debuffs", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "debuffs.png"), debuffs);

  const dialogue = image(CELL * DIALOGUE_PORTRAITS.length, CELL);
  DIALOGUE_PORTRAITS.forEach((name, col) => copyInto(dialogue, readPng(spritePath("dialogue", name)), col * CELL, 0));
  writePng(path.join(OUT_DIR, "dialogue_portraits.png"), dialogue);
}

function writeMeta() {
  const meta = { cell: CELL, frames: FRAMES, directions: DIRECTIONS, renderDirections: ACTOR_RENDER_DIRECTIONS, actions: ACTIONS, actorSheets: ACTOR_SHEETS, actors: {}, tiles: {}, effects: {}, items: {}, debuffs: {}, dialogue: {} };
  ACTORS.forEach((name) => {
    let sheet = "moss_slime";
    let row = 0;
    for (const key in ACTOR_SHEETS) {
      const idx = ACTOR_SHEETS[key].indexOf(name);
      if (idx >= 0) {
        sheet = key;
        row = idx;
        break;
      }
    }
    meta.actors[name] = { sheet: `actor_${sheet}`, x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, directions: ACTOR_RENDER_DIRECTIONS.length, actions: ACTIONS.length, anchor: [CELL / 2, Math.round(CELL * 0.75)] };
  });
  TILES.forEach((name, col) => { meta.tiles[name] = { sheet: "tiles", x: col * CELL, y: 0, w: CELL, h: CELL }; });
  EFFECTS.forEach((name, row) => { meta.effects[name] = { sheet: "effects", x: 0, y: row * CELL, w: CELL, h: CELL, frames: FRAMES, anchor: [CELL / 2, CELL / 2] }; });
  ITEM_ICONS.forEach((name, col) => { meta.items[name] = { sheet: "items", x: col * CELL, y: 0, w: CELL, h: CELL, anchor: [CELL / 2, CELL / 2] }; });
  DEBUFF_ICONS.forEach((name, col) => { meta.debuffs[name] = { sheet: "debuffs", x: col * CELL, y: 0, w: CELL, h: CELL, anchor: [CELL / 2, CELL / 2] }; });
  DIALOGUE_PORTRAITS.forEach((name, col) => { meta.dialogue[name] = { sheet: "dialogue_portraits", x: col * CELL, y: 0, w: CELL, h: CELL, anchor: [CELL / 2, CELL / 2] }; });
  fs.writeFileSync(path.join(OUT_DIR, "sprites.json"), JSON.stringify(meta, null, 2) + "\n");
}

writeSourceFrames();
writeAtlas();
writeMeta();
console.log("自製48px 8方向・アクション別ピクセル素材を生成しました。");
