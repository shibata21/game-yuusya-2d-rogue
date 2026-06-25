"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const OUT_DIR = path.join("assets", "ui");
const W = 528;
const H = 768;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function image(w = W, h = H) {
  return new PNG({ width: w, height: h });
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
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  const a = color.a === undefined ? 255 : color.a;
  if (a >= 255) {
    img.data[i] = color.r;
    img.data[i + 1] = color.g;
    img.data[i + 2] = color.b;
    img.data[i + 3] = 255;
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

function line(img, x0, y0, x1, y1, hex, width = 1, alpha = 255) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rect(img, x0 + (x1 - x0) * t - width / 2, y0 + (y1 - y0) * t - width / 2, width, width, hex, alpha);
  }
}

function noise(img, seed, colors, count, alpha = 255) {
  for (let i = 0; i < count; i++) {
    const x = (i * 37 + seed * 19) % W;
    const y = (i * 53 + seed * 31) % H;
    const w = 2 + ((i + seed) % 9);
    const h = 2 + ((i * 3 + seed) % 8);
    rect(img, x, y, w, h, colors[(i + seed) % colors.length], alpha);
  }
}

function drawTorch(img, x, y) {
  rect(img, x - 7, y + 28, 14, 98, "#2a1722", 255);
  rect(img, x - 11, y + 20, 22, 14, "#5a3320", 255);
  for (let i = 0; i < 5; i++) {
    const yy = y + i * 5;
    tri(img, x - 24 + i * 2, yy + 33, x + 24 - i * 2, yy + 33, x + ((i % 2) ? 8 : -6), yy - 28, i % 2 ? "#ffcf4d" : "#d6543f", 230);
  }
  oval(img, x, y + 18, 28, 36, "#ff8a24", 92);
}

function drawCrown(img, x, y) {
  rect(img, x - 54, y + 26, 108, 26, "#d19328", 255);
  rect(img, x - 48, y + 32, 96, 12, "#ffcf4d", 255);
  tri(img, x - 54, y + 28, x - 26, y + 28, x - 42, y - 30, "#ffcf4d", 255);
  tri(img, x - 24, y + 28, x + 24, y + 28, x, y - 44, "#ffcf4d", 255);
  tri(img, x + 26, y + 28, x + 54, y + 28, x + 42, y - 30, "#ffcf4d", 255);
  oval(img, x, y - 9, 8, 8, "#b026ff", 255);
  oval(img, x - 41, y - 1, 6, 6, "#e0556b", 255);
  oval(img, x + 41, y - 1, 6, 6, "#9fe8ff", 255);
  line(img, x - 50, y + 51, x + 50, y + 51, "#7a4b14", 4, 255);
}

function drawSquirrelKing(img) {
  const x = W / 2;
  const y = 352;
  oval(img, x + 145, y + 58, 78, 190, "#3a1e18", 255);
  oval(img, x + 154, y + 20, 48, 128, "#7a3f25", 255);
  oval(img, x + 168, y - 20, 30, 74, "#b56f3b", 255);
  oval(img, x - 132, y + 74, 50, 132, "#3a1e18", 255);
  oval(img, x - 124, y + 50, 30, 86, "#7a3f25", 255);

  oval(img, x, y + 112, 116, 144, "#52251c", 255);
  oval(img, x, y + 126, 82, 100, "#8f4c2d", 255);
  oval(img, x, y - 2, 104, 94, "#b86b3f", 255);
  oval(img, x, y + 18, 70, 52, "#d39a62", 255);
  oval(img, x - 70, y - 74, 30, 38, "#7a3f25", 255);
  oval(img, x + 70, y - 74, 30, 38, "#7a3f25", 255);
  oval(img, x - 70, y - 72, 15, 20, "#d39a62", 255);
  oval(img, x + 70, y - 72, 15, 20, "#d39a62", 255);

  rect(img, x - 40, y - 8, 22, 18, "#12080c", 255);
  rect(img, x + 18, y - 8, 22, 18, "#12080c", 255);
  rect(img, x - 34, y - 5, 7, 5, "#ffcf4d", 255);
  rect(img, x + 24, y - 5, 7, 5, "#ffcf4d", 255);
  oval(img, x, y + 18, 13, 9, "#2a100d", 255);
  rect(img, x - 4, y + 26, 8, 14, "#2a100d", 255);
  rect(img, x - 28, y + 48, 56, 8, "#2a100d", 255);
  rect(img, x - 22, y + 55, 44, 5, "#f1dfc3", 255);
  line(img, x - 42, y + 27, x - 94, y + 14, "#2a100d", 3, 210);
  line(img, x - 40, y + 36, x - 95, y + 40, "#2a100d", 3, 210);
  line(img, x + 42, y + 27, x + 94, y + 14, "#2a100d", 3, 210);
  line(img, x + 40, y + 36, x + 95, y + 40, "#2a100d", 3, 210);

  rect(img, x - 92, y + 78, 184, 50, "#281224", 255);
  rect(img, x - 98, y + 84, 196, 18, "#5a203f", 255);
  line(img, x - 92, y + 78, x + 92, y + 78, "#c46bff", 4, 180);

  drawCrown(img, x, y - 112);
}

function drawBackground() {
  const img = image();
  rect(img, 0, 0, W, H, "#120b18", 255);
  for (let y = 0; y < H; y += 24) {
    const col = y % 48 === 0 ? "#1d1426" : "#171020";
    rect(img, 0, y, W, 24, col, 255);
  }
  noise(img, 7, ["#2a1f3d", "#0c0814", "#3a2444", "#23152e"], 420, 120);
  rect(img, 70, 96, 388, 520, "#1b1024", 235);
  rect(img, 90, 122, 348, 476, "#261331", 255);
  tri(img, 90, 122, 438, 122, W / 2, 24, "#3a1f48", 255);
  rect(img, 126, 176, 276, 392, "#120a16", 255);
  rect(img, 146, 198, 236, 350, "#211024", 255);
  for (let i = 0; i < 6; i++) {
    const x = 154 + i * 42;
    rect(img, x, 208, 18, 328, i % 2 ? "#2e1734" : "#34193e", 255);
    line(img, x + 2, 209, x + 2, 535, "#5a2c63", 1, 130);
  }
  drawTorch(img, 84, 242);
  drawTorch(img, W - 84, 242);
  oval(img, W / 2, 640, 210, 70, "#09060d", 210);
  rect(img, 108, 610, 312, 62, "#1b1024", 255);
  rect(img, 126, 580, 276, 58, "#2a1433", 255);
  line(img, 128, 581, 400, 581, "#7a3f25", 5, 255);
  drawSquirrelKing(img);
  rect(img, 0, 0, W, 96, "#07040a", 80);
  rect(img, 0, H - 132, W, 132, "#07040a", 105);
  return img;
}

ensureDir(OUT_DIR);
fs.writeFileSync(path.join(OUT_DIR, "demon-squirrel-king.png"), PNG.sync.write(drawBackground()));
console.log("UI背景素材を生成しました: " + path.join(OUT_DIR, "demon-squirrel-king.png"));
