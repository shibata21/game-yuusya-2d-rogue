"use strict";

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import { fileURLToPath } from "node:url";
import {
  PIXEL_ACTIONS,
  PIXEL_ACTORS,
  PIXEL_CELL,
  PIXEL_DIRS,
  PIXEL_EFFECTS,
  PIXEL_FRAMES,
  PIXEL_TILES,
  PIXEL_ITEMS,
  PIXEL_DEBUFFS,
  PIXEL_ASSET_VERSION,
  pixelAssetUrl,
  pixelItemFrameIndex,
  pixelDebuffFrameIndex,
} from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(fs.readFileSync(path.join(repoDir, "assets/pixel/sprites.json"), "utf8"));
const pngCache = new Map();
const EXPECTED_EGG_ACTORS = ["egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"];

function png(file) {
  if (!pngCache.has(file)) pngCache.set(file, PNG.sync.read(fs.readFileSync(path.join(repoDir, file))));
  return pngCache.get(file);
}

function crop(img, x0, y0, w, h) {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(img, out, x0, y0, w, h, 0, 0);
  return out;
}

function alphaBounds(img) {
  let minX = img.width;
  let minY = img.height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (img.data[(y * img.width + x) * 4 + 3] > 0) {
      count++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY, count };
}

function actorCrop(name, action, dir, frame) {
  const img = png("assets/pixel/actors.png");
  const row = Object.keys(meta.actors).indexOf(name);
  const ai = meta.actions.indexOf(action);
  const di = meta.directions.indexOf(dir);
  return crop(img, ((ai * meta.directions.length + di) * meta.frames + frame) * meta.cell, row * meta.cell, meta.cell, meta.cell);
}

function tileCrop(name) {
  const img = png("assets/pixel/tiles.png");
  const col = Object.keys(meta.tiles).indexOf(name);
  return crop(img, col * meta.cell, 0, meta.cell, meta.cell);
}

function itemCrop(name) {
  const img = png("assets/pixel/items.png");
  const col = Object.keys(meta.items).indexOf(name);
  return crop(img, col * meta.cell, 0, meta.cell, meta.cell);
}

function debuffCrop(name) {
  const img = png("assets/pixel/debuffs.png");
  const col = Object.keys(meta.debuffs).indexOf(name);
  return crop(img, col * meta.cell, 0, meta.cell, meta.cell);
}

function diffRatio(a, b) {
  let union = 0;
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] > 0 || b.data[i + 3] > 0) union++;
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) + Math.abs(a.data[i + 3] - b.data[i + 3]);
    if (d > 32) diff++;
  }
  return union ? diff / union : 0;
}

function tileMotifStats(tile, earth) {
  let motif = 0;
  let outside = 0;
  for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++) {
    const i = (y * tile.width + x) * 4;
    const d = Math.abs(tile.data[i] - earth.data[i]) + Math.abs(tile.data[i + 1] - earth.data[i + 1]) + Math.abs(tile.data[i + 2] - earth.data[i + 2]) + Math.abs(tile.data[i + 3] - earth.data[i + 3]);
    if (d > 48) {
      motif++;
      if (x < 10 || x > 38 || y < 8 || y > 40) outside++;
    }
  }
  return { motif, outside };
}

function paletteStats(base, elite) {
  let union = 0;
  let alphaDiff = 0;
  let colorDiff = 0;
  let redDominant = 0;
  let opaque = 0;
  for (let i = 0; i < base.data.length; i += 4) {
    const ba = base.data[i + 3];
    const ea = elite.data[i + 3];
    if (ba > 0 || ea > 0) union++;
    if (ba !== ea) alphaDiff++;
    if (Math.abs(base.data[i] - elite.data[i]) + Math.abs(base.data[i + 1] - elite.data[i + 1]) + Math.abs(base.data[i + 2] - elite.data[i + 2]) > 32) colorDiff++;
    if (ea > 0) {
      opaque++;
      if (elite.data[i] > elite.data[i + 1] && elite.data[i] > elite.data[i + 2]) redDominant++;
    }
  }
  return { alphaDiff, colorRatio: union ? colorDiff / union : 0, redRatio: opaque ? redDominant / opaque : 0 };
}

function greenDominantRatio(img) {
  let opaque = 0;
  let green = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] <= 0) continue;
    opaque++;
    if (img.data[i + 1] > img.data[i] + 8 && img.data[i + 1] > img.data[i + 2] + 8) green++;
  }
  return opaque ? green / opaque : 0;
}

function brightPixelsIn(img, pred) {
  let count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] > 0 && img.data[i] >= 220 && img.data[i + 1] >= 220 && img.data[i + 2] >= 220 && pred(x, y)) count++;
  }
  return count;
}

function eggMotifPixels(img) {
  return pixelsIn(img, (x, y, r, g, b, a) => {
    if (a <= 0 || x < 15 || x > 34 || y < 20 || y > 39) return false;
    return Math.max(r, g, b) - Math.min(r, g, b) > 35 && Math.min(r, g, b) < 150;
  });
}

function eggGlowPixels(img) {
  return pixelsIn(img, (x, y, r, g, b, a) => {
    if (a <= 0 || !(x <= 7 || x >= 41 || y <= 6 || y >= 46)) return false;
    return r + g + b > 610;
  });
}

function pixelsIn(img, pred) {
  let count = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] > 0 && pred(x, y, img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3])) count++;
  }
  return count;
}

function brightFacePixels(img) {
  let count = 0;
  for (let y = 4; y < 23; y++) for (let x = 13; x < 35; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i + 3] > 0 && img.data[i] >= 220 && img.data[i + 1] >= 185 && img.data[i + 2] >= 120) count++;
  }
  return count;
}

describe("ピクセル素材", () => {
  it("素材定義と公開定数の順序が一致する", () => {
    expect(meta.cell).toBe(PIXEL_CELL);
    expect(meta.frames).toBe(PIXEL_FRAMES);
    expect(meta.directions).toEqual(PIXEL_DIRS);
    expect(meta.actions).toEqual(PIXEL_ACTIONS);
    expect(Object.keys(meta.actors)).toEqual(PIXEL_ACTORS);
    expect(Object.keys(meta.tiles)).toEqual(PIXEL_TILES);
    expect(Object.keys(meta.effects)).toEqual(PIXEL_EFFECTS);
    expect(Object.keys(meta.items)).toEqual(PIXEL_ITEMS);
    expect(Object.keys(meta.debuffs)).toEqual(PIXEL_DEBUFFS);
  });

  it("アトラスPNGの寸法が正しい", () => {
    const actors = png("assets/pixel/actors.png");
    const tiles = png("assets/pixel/tiles.png");
    const effects = png("assets/pixel/effects.png");
    const items = png("assets/pixel/items.png");
    const debuffs = png("assets/pixel/debuffs.png");
    expect(actors.width).toBe(PIXEL_CELL * PIXEL_FRAMES * PIXEL_DIRS.length * PIXEL_ACTIONS.length);
    expect(actors.height).toBe(PIXEL_CELL * PIXEL_ACTORS.length);
    expect(tiles.width).toBe(PIXEL_CELL * PIXEL_TILES.length);
    expect(tiles.height).toBe(PIXEL_CELL);
    expect(effects.width).toBe(PIXEL_CELL * PIXEL_FRAMES);
    expect(effects.height).toBe(PIXEL_CELL * PIXEL_EFFECTS.length);
    expect(items.width).toBe(PIXEL_CELL * PIXEL_ITEMS.length);
    expect(items.height).toBe(PIXEL_CELL);
    expect(debuffs.width).toBe(PIXEL_CELL * PIXEL_DEBUFFS.length);
    expect(debuffs.height).toBe(PIXEL_CELL);
  });

  it("素材URLにはバージョン文字列が付く", () => {
    expect(PIXEL_ASSET_VERSION).toBe("v23-loop");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=v23-loop");
    expect(pixelAssetUrl("items.png")).toBe("assets/pixel/items.png?v=v23-loop");
    expect(pixelAssetUrl("debuffs.png")).toBe("assets/pixel/debuffs.png?v=v23-loop");
    expect(pixelItemFrameIndex("rustyPickaxe")).toBe(PIXEL_ITEMS.indexOf("rustyPickaxe"));
    expect(pixelDebuffFrameIndex("crackedCore")).toBe(PIXEL_DEBUFFS.indexOf("crackedCore"));
  });

  it("進化モンスターは通常種と同じ形の色違いになる", () => {
    for (const [base, elite] of [["slime", "superslime"], ["slime", "crownslime"], ["carniv", "evolved"], ["carniv", "direfang"], ["spitter", "tarantula"], ["spitter", "goldweaver"], ["golem", "titan"], ["golem", "goldcore"], ["flame", "infernal"], ["flame", "whiteflame"]]) {
      const stats = paletteStats(actorCrop(base, "idle", "s", 1), actorCrop(elite, "idle", "s", 1));
      expect(stats.alphaDiff, `${base}/${elite}`).toBe(0);
      expect(stats.colorRatio, `${base}/${elite}`).toBeGreaterThan(0.08);
    }
  });

  it("スーパースライムは赤優勢になる", () => {
    const stats = paletteStats(actorCrop("slime", "idle", "s", 1), actorCrop("superslime", "idle", "s", 1));
    expect(stats.alphaDiff).toBe(0);
    expect(stats.redRatio).toBeGreaterThan(0.65);
  });

  it("スライムは苔脈に近い緑優勢になる", () => {
    expect(greenDominantRatio(actorCrop("slime", "idle", "s", 1))).toBeGreaterThan(0.68);
  });

  it("方向と職業アクションの差分がある", () => {
    for (const name of ["slime", "carniv", "spitter", "golem", "flame", "infernal"]) {
      expect(diffRatio(actorCrop(name, "idle", "s", 1), actorCrop(name, "idle", "n", 1)), name).toBeGreaterThan(0.13);
    }
    expect(diffRatio(actorCrop("warrior", "idle", "e", 1), actorCrop("warrior", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("superwarrior", "idle", "e", 1), actorCrop("superwarrior", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("ultrawarrior", "idle", "e", 1), actorCrop("ultrawarrior", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("tank", "idle", "e", 1), actorCrop("tank", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("crossknight", "idle", "e", 1), actorCrop("crossknight", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("captain", "idle", "e", 1), actorCrop("captain", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("mage", "idle", "e", 1), actorCrop("mage", "cast", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("supermage", "idle", "e", 1), actorCrop("supermage", "cast", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("sage", "idle", "e", 1), actorCrop("sage", "cast", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("priest", "idle", "e", 1), actorCrop("priest", "heal", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("saint", "idle", "e", 1), actorCrop("saint", "heal", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("warrior", "attack", "e", 2), actorCrop("superwarrior", "attack", "e", 2))).toBeGreaterThan(0.16);
    expect(diffRatio(actorCrop("tank", "attack", "e", 2), actorCrop("crossknight", "attack", "e", 2))).toBeGreaterThan(0.16);
    expect(diffRatio(actorCrop("mage", "cast", "e", 2), actorCrop("supermage", "cast", "e", 2))).toBeGreaterThan(0.16);
    expect(diffRatio(actorCrop("max", "idle", "e", 1), actorCrop("max", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("shon", "idle", "e", 1), actorCrop("shon", "attack", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("hori", "idle", "e", 1), actorCrop("hori", "cast", "e", 2))).toBeGreaterThan(0.18);
    expect(diffRatio(actorCrop("shon", "idle", "e", 1), actorCrop("shon", "dodge", "e", 2))).toBeGreaterThan(0.12);
  });

  it("マックスはロングコートとサングラスが読める", () => {
    const max = actorCrop("max", "idle", "s", 1);
    const coat = pixelsIn(max, (x, y, r, g, b) => x >= 10 && x <= 38 && y >= 18 && y <= 43 && r < 35 && g < 38 && b < 48);
    const glasses = pixelsIn(max, (x, y, r, g, b) => x >= 16 && x <= 32 && y >= 8 && y <= 15 && r < 30 && g < 32 && b < 40);
    const foreheadBand = pixelsIn(max, (x, y, r, g, b) => x >= 15 && x <= 33 && y >= 5 && y <= 9 && r < 30 && g < 32 && b < 40);
    expect(coat).toBeGreaterThan(180);
    expect(glasses).toBeGreaterThan(12);
    expect(foreheadBand).toBeLessThan(10);
  });

  it("ホリはバズーカを持たず野菜投げが読める", () => {
    const cast = actorCrop("hori", "cast", "e", 2);
    const vegetable = pixelsIn(cast, (x, y, r, g, b) => x >= 26 && x <= 46 && y >= 8 && y <= 25 && g > r + 20 && g > b + 20);
    const longMetal = pixelsIn(cast, (x, y, r, g, b) => x >= 25 && x <= 46 && y >= 10 && y <= 22 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 55 && r < 225);
    expect(vegetable).toBeGreaterThan(20);
    expect(longMetal).toBeLessThan(18);
  });

  it("ションはロン毛と大きいハンドガンが読める", () => {
    const idle = actorCrop("shon", "idle", "s", 1);
    const attack = actorCrop("shon", "attack", "e", 2);
    const longHair = pixelsIn(idle, (x, y, r, g, b) => x >= 14 && x <= 34 && y >= 5 && y <= 26 && r < 35 && g < 40 && b < 50);
    const gunMetal = pixelsIn(attack, (x, y, r, g, b) => x >= 30 && x <= 47 && y >= 10 && y <= 23 && r >= 180 && g >= 180 && b >= 180);
    expect(longHair).toBeGreaterThan(80);
    expect(gunMetal).toBeGreaterThan(12);
  });

  it("Xターミネーターは黒装甲と赤いXバイザーが読める", () => {
    const idle = actorCrop("xTerminator", "idle", "s", 1);
    const attack = actorCrop("xTerminator", "attack", "e", 2);
    const armor = pixelsIn(idle, (x, y, r, g, b) => x >= 9 && x <= 39 && y >= 15 && y <= 43 && r < 50 && g < 60 && b < 75);
    const visor = pixelsIn(idle, (x, y, r, g, b) => x >= 14 && x <= 34 && y >= 8 && y <= 18 && r > 210 && g < 95 && b < 120);
    const gun = pixelsIn(attack, (x, y, r, g, b) => x >= 30 && x <= 47 && y >= 10 && y <= 23 && r >= 170 && g >= 170 && b >= 170);
    expect(armor).toBeGreaterThan(160);
    expect(visor).toBeGreaterThan(8);
    expect(gun).toBeGreaterThan(12);
    expect(diffRatio(actorCrop("shon", "idle", "s", 1), idle)).toBeGreaterThan(0.18);
  });

  it("下向き冒険者の剣は下へ突き出さず体の前で振る", () => {
    const attack = actorCrop("warrior", "attack", "s", 2);
    expect(brightPixelsIn(attack, (x, y) => x >= 29 && y >= 12 && y <= 32)).toBeGreaterThan(8);
    expect(brightPixelsIn(attack, (x, y) => y >= 36)).toBeLessThan(18);
  });

  it("獣とドラゴンは下向きで顔、上向きで背中が読める", () => {
    for (const name of ["carniv", "evolved", "flame", "infernal"]) {
      const front = actorCrop(name, "idle", "s", 1);
      const back = actorCrop(name, "idle", "n", 1);
      expect(brightFacePixels(front), name).toBeGreaterThan(brightFacePixels(back) + 8);
      expect(diffRatio(front, back), name).toBeGreaterThan(0.2);
    }
  });

  it("入口タイルはシンプルな石造りの暗い開口部を持つ", () => {
    const surface = tileCrop("surface");
    const darkOpening = pixelsIn(surface, (x, y, r, g, b) => x >= 10 && x <= 38 && y >= 24 && y <= 45 && r < 25 && g < 25 && b < 32);
    const stoneRim = pixelsIn(surface, (x, y, r, g, b) => x >= 8 && x <= 40 && y >= 14 && y <= 31 && r >= 70 && r <= 130 && Math.abs(r - g) < 16 && Math.abs(g - b) < 20);
    const greenDecor = pixelsIn(surface, (_x, _y, r, g, b) => g > 145 && g > r + 35 && g > b + 20);
    expect(darkOpening).toBeGreaterThan(360);
    expect(stoneRim).toBeGreaterThan(36);
    expect(greenDecor).toBeLessThan(8);
  });

  it("蜘蛛とゴーレムは判別しやすいシルエットを持つ", () => {
    const spider = actorCrop("spitter", "idle", "s", 1);
    const spiderBounds = alphaBounds(spider);
    expect(spiderBounds.maxX - spiderBounds.minX + 1).toBeGreaterThanOrEqual(42);
    expect(pixelsIn(spider, (x, y) => (x <= 6 || x >= 41) && y >= 8 && y <= 40)).toBeGreaterThan(8);

    const golem = actorCrop("golem", "idle", "s", 1);
    const golemBounds = alphaBounds(golem);
    expect(golemBounds.count).toBeGreaterThan(520);
    expect(brightPixelsIn(golem, (x, y) => x >= 14 && x <= 34 && y >= 4 && y <= 23)).toBeGreaterThan(4);
    expect(pixelsIn(golem, (x, y, r, g, b) => x >= 10 && x <= 38 && y >= 16 && y <= 40 && b > r && b > g)).toBeGreaterThan(160);
  });

  it("卵は種別色のよくある卵シルエットになる", () => {
    const eggs = PIXEL_ACTORS.filter((name) => name.startsWith("egg_"));
    expect(eggs).toEqual(EXPECTED_EGG_ACTORS);
    for (const name of eggs) {
      const img = actorCrop(name, "idle", "s", 1);
      const b = alphaBounds(img);
      const w = b.maxX - b.minX + 1;
      const h = b.maxY - b.minY + 1;
      expect(b.count, name).toBeGreaterThan(360);
      expect(w, name).toBeGreaterThanOrEqual(29);
      expect(w, name).toBeLessThanOrEqual(35);
      expect(h, name).toBeGreaterThanOrEqual(36);
      expect(h, name).toBeLessThanOrEqual(42);
      expect(h, name).toBeGreaterThan(w + 2);
      expect(eggMotifPixels(img), name).toBeGreaterThan(20);
      if (["egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"].includes(name)) {
        expect(eggGlowPixels(img), name).toBeGreaterThan(8);
      } else {
        expect(eggGlowPixels(img), name).toBe(0);
      }
    }
    for (let i = 1; i < eggs.length; i++) {
      expect(diffRatio(actorCrop(eggs[i - 1], "idle", "s", 1), actorCrop(eggs[i], "idle", "s", 1)), `${eggs[i - 1]}/${eggs[i]}`).toBeGreaterThan(0.08);
    }
  });

  it("アイテムは個別に読めるピクセルアイコンを持つ", () => {
    for (const name of PIXEL_ITEMS) {
      const img = itemCrop(name);
      const b = alphaBounds(img);
      const w = b.maxX - b.minX + 1;
      const h = b.maxY - b.minY + 1;
      expect(b.count, name).toBeGreaterThan(160);
      expect(w, name).toBeGreaterThanOrEqual(20);
      expect(h, name).toBeGreaterThanOrEqual(20);
    }
    for (let i = 0; i < PIXEL_ITEMS.length; i++) {
      for (let j = i + 1; j < PIXEL_ITEMS.length; j++) {
        expect(diffRatio(itemCrop(PIXEL_ITEMS[i]), itemCrop(PIXEL_ITEMS[j])), `${PIXEL_ITEMS[i]}/${PIXEL_ITEMS[j]}`).toBeGreaterThan(0.08);
      }
    }
  });

  it("デバフは個別に読める警告アイコンを持つ", () => {
    expect(PIXEL_DEBUFFS).toEqual(["rottenRations", "crackedCore", "informantMap", "sharpenedBlade", "dullFeed"]);
    for (const name of PIXEL_DEBUFFS) {
      const img = debuffCrop(name);
      const b = alphaBounds(img);
      const w = b.maxX - b.minX + 1;
      const h = b.maxY - b.minY + 1;
      expect(b.count, name).toBeGreaterThan(130);
      expect(w, name).toBeGreaterThanOrEqual(20);
      expect(h, name).toBeGreaterThanOrEqual(20);
    }
    for (let i = 0; i < PIXEL_DEBUFFS.length; i++) {
      for (let j = i + 1; j < PIXEL_DEBUFFS.length; j++) {
        expect(diffRatio(debuffCrop(PIXEL_DEBUFFS[i]), debuffCrop(PIXEL_DEBUFFS[j])), `${PIXEL_DEBUFFS[i]}/${PIXEL_DEBUFFS[j]}`).toBeGreaterThan(0.08);
      }
    }
  });

  it("鉱脈タイルは種別マークを持ち、進化後は枠が光る", () => {
    const earth = tileCrop("earth");
    for (const name of ["moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo", "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2"]) {
      const stats = tileMotifStats(tileCrop(name), earth);
      const evo2 = name.endsWith("_evo2");
      const evo = name.endsWith("_evo") || evo2;
      expect(stats.motif, name).toBeGreaterThan(evo ? 420 : 95);
      expect(stats.motif, name).toBeLessThan(evo2 ? 1320 : (evo ? 1160 : 620));
      expect(stats.outside, name).toBeLessThanOrEqual(evo2 ? 700 : (evo ? 360 : 145));
    }
  });

  it("素材生成は外部素材に依存しない", () => {
    expect(fs.existsSync(path.join(repoDir, "assets/pixel/third_party_assets.json"))).toBe(false);
    expect(fs.existsSync(path.join(repoDir, "assets/pixel/THIRD_PARTY_ASSETS.md"))).toBe(false);
    expect(fs.existsSync(path.join(repoDir, "assets/external"))).toBe(false);
    const build = fs.readFileSync(path.join(repoDir, "tools/build_pixel_assets.js"), "utf8");
    for (const term of ["readExternal", "actorSources", "tileSources", "third_party", "THIRD_PARTY", "assets/external", "dcss", "DCSS"]) {
      expect(build).not.toContain(term);
    }
    expect(diffRatio(tileCrop("earth"), tileCrop("tunnel"))).toBeGreaterThan(0.22);
    expect(diffRatio(tileCrop("earth"), tileCrop("bedrock"))).toBeGreaterThan(0.22);
  });
});
