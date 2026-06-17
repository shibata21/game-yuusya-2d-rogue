"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const CELL = 48;
const FRAMES = 4;
const DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
const ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat"];
const OUT_DIR = path.join("assets", "pixel");
const SOURCE_DIR = path.join(OUT_DIR, "source", "v4");

const ACTORS = [
  "slime", "carniv", "evolved", "spitter", "golem", "flame",
  "superslime", "tarantula", "titan", "infernal",
  "warrior", "tank", "mage", "priest",
  "egg_superslime", "egg_evolved", "egg_tarantula", "egg_titan", "egg_infernal",
];
const TILES = [
  "earth", "tunnel", "bedrock", "surface", "core",
  "moss", "meat", "venom", "stone", "ember",
  "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo",
];
const EFFECTS = ["slash", "shot", "bite", "birth", "puff"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function image(w = CELL, h = CELL) {
  return new PNG({ width: w, height: h });
}

function writePng(file, img) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, PNG.sync.write(img));
}

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function rgba(hex, alpha = 255) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: alpha,
  };
}

function setPx(img, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  const a = color.a === undefined ? 255 : color.a;
  if (a >= 255) {
    img.data[i] = color.r; img.data[i + 1] = color.g; img.data[i + 2] = color.b; img.data[i + 3] = 255;
    return;
  }
  const oa = img.data[i + 3] / 255;
  const na = a / 255;
  const out = na + oa * (1 - na);
  if (out <= 0) return;
  img.data[i] = Math.round((color.r * na + img.data[i] * oa * (1 - na)) / out);
  img.data[i + 1] = Math.round((color.g * na + img.data[i + 1] * oa * (1 - na)) / out);
  img.data[i + 2] = Math.round((color.b * na + img.data[i + 2] * oa * (1 - na)) / out);
  img.data[i + 3] = Math.round(out * 255);
}

function rect(img, x, y, w, h, hex, alpha = 255) {
  const c = rgba(hex, alpha);
  for (let yy = Math.floor(y); yy < Math.ceil(y + h); yy++) {
    for (let xx = Math.floor(x); xx < Math.ceil(x + w); xx++) setPx(img, xx, yy, c);
  }
}

function diamond(img, cx, cy, r, hex, alpha = 255) {
  const c = rgba(hex, alpha);
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - cy) <= r) setPx(img, x, y, c);
    }
  }
}

function line(img, x0, y0, x1, y1, hex, width = 1, alpha = 255) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rect(img, x0 + (x1 - x0) * t - width / 2, y0 + (y1 - y0) * t - width / 2, width, width, hex, alpha);
  }
}

function tri(img, ax, ay, bx, by, cx, cy, hex, alpha = 255) {
  const c = rgba(hex, alpha);
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / area;
      const w1 = ((cx - bx) * (y - by) - (cy - by) * (x - bx)) / area;
      const w2 = ((ax - cx) * (y - cy) - (ay - cy) * (x - cx)) / area;
      if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) setPx(img, x, y, c);
    }
  }
}

function copyInto(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = ((dy + y) * dst.width + dx + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

function spritePath(group, name, frame = null, dir = null, action = null) {
  const actionPart = action === null ? "" : "_" + action;
  const dirPart = dir === null ? "" : "_" + dir;
  const suffix = frame === null ? ".png" : actionPart + dirPart + "_" + frame + ".png";
  return path.join(SOURCE_DIR, group, name + suffix);
}

module.exports = {
  CELL, FRAMES, DIRECTIONS, ACTIONS, OUT_DIR, SOURCE_DIR, ACTORS, TILES, EFFECTS,
  ensureDir, image, writePng, readPng, rgba, setPx, rect, diamond, line, tri, copyInto, spritePath,
};
