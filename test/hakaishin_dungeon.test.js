"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const { PNG } = require("pngjs");

const repoDir = path.resolve(__dirname, "..");
const htmlPath = path.join(repoDir, "hakaishin_dungeon.html");
const pixelMeta = JSON.parse(fs.readFileSync(path.join(repoDir, "assets/pixel/sprites.json"), "utf8"));
const thirdPartyMeta = JSON.parse(fs.readFileSync(path.join(repoDir, "assets/pixel/third_party_assets.json"), "utf8"));

function png(file) {
  return PNG.sync.read(fs.readFileSync(path.join(repoDir, file)));
}
function crop(img, x0, y0, w, h) {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(img, out, x0, y0, w, h, 0, 0);
  return out;
}
function actorCrop(name, action, dir, frame) {
  const img = png("assets/pixel/actors.png");
  const row = Object.keys(pixelMeta.actors).indexOf(name);
  const ai = pixelMeta.actions.indexOf(action);
  const di = pixelMeta.directions.indexOf(dir);
  return crop(img, ((ai * pixelMeta.directions.length + di) * pixelMeta.frames + frame) * pixelMeta.cell, row * pixelMeta.cell, pixelMeta.cell, pixelMeta.cell);
}
function tileCrop(name) {
  const img = png("assets/pixel/tiles.png");
  const col = Object.keys(pixelMeta.tiles).indexOf(name);
  return crop(img, col * pixelMeta.cell, 0, pixelMeta.cell, pixelMeta.cell);
}
function diffStats(a, b) {
  let union = 0, colorDiff = 0, alphaDiff = 0, redDominant = 0, opaque = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const aa = a.data[i + 3], ba = b.data[i + 3];
    if (aa > 0 || ba > 0) union++;
    if (aa !== ba) alphaDiff++;
    if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 32) colorDiff++;
    if (ba > 0) {
      opaque++;
      if (b.data[i] > b.data[i + 1] && b.data[i] > b.data[i + 2]) redDominant++;
    }
  }
  return { union, colorRatio: union ? colorDiff / union : 0, alphaDiff, redRatio: opaque ? redDominant / opaque : 0 };
}
function diffRatio(a, b) {
  let union = 0, diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] > 0 || b.data[i + 3] > 0) union++;
    if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) + Math.abs(a.data[i + 3] - b.data[i + 3]) > 32) diff++;
  }
  return union ? diff / union : 0;
}
function loadGameScripts() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const bodies = [];
  const re = /<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      if (/^vendor\//.test(m[1])) continue;
      bodies.push(fs.readFileSync(path.join(repoDir, m[1]), "utf8"));
    } else if (m[2] && m[2].trim()) {
      bodies.push(m[2]);
    }
  }
  return bodies.join("\n");
}
function createSandbox() {
  const noop = () => {};
  const grad = { addColorStop: noop };
  const ctxStub = new Proxy({}, {
    get(t, p) {
      if (p === "createRadialGradient" || p === "createLinearGradient") return () => grad;
      if (p === "ellipse") return noop;
      if (p === "measureText") return () => ({ width: 24 });
      if (p in t) return t[p];
      return noop;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
  const canvasStub = {
    getContext: () => ctxStub,
    width: 528,
    height: 768,
    parentElement: { appendChild: noop },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 528, height: 768 }),
    addEventListener: noop,
    style: {},
  };
  const genEl = new Proxy({ style: {}, classList: { add: noop, remove: noop }, addEventListener: noop },
    { get(t, p) { return (p in t) ? t[p] : ""; }, set(t, p, v) { t[p] = v; return true; } });
  const sandbox = {
    console,
    Math,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    document: { getElementById: (id) => id === "game" ? canvasStub : genEl },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(loadGameScripts(), sandbox);
  return sandbox;
}

describe("破壊神ダンジョン Vitest", () => {
  it("既存のゲーム仕様テストが全通過する", () => {
    const out = execFileSync(process.execPath, ["test_hakaishin_dungeon.js", "hakaishin_dungeon.html"], {
      cwd: repoDir,
      encoding: "utf8",
    });
    expect(out).toMatch(/結果: \d+ passed, 0 failed/);
  }, 30000);

  it("ゲーム本体は公開名前空間から生成・検査できる", () => {
    const a = createSandbox();
    const b = createSandbox();
    expect(a.HakaishinDungeon).toBeTruthy();
    expect(typeof a.HakaishinDungeon.createGame).toBe("function");
    expect(a.HakaishinDungeon.Core.PIXEL_ASSET_VERSION).toBe("v7-external-tiles-los-1");
    expect(a.HakaishinDungeon.createGame().monsters).not.toBe(b.HakaishinDungeon.createGame().monsters);
  });

  it("スライムの分裂間隔は14秒に短縮される", () => {
    const a = createSandbox();
    expect(a.HakaishinDungeon.Core.KINDS.slime.breedEvery).toBe(14000);
  });

  it("進化モンスターは通常種と同じ形の色違いだけになる", () => {
    const pairs = [["slime", "superslime"], ["carniv", "evolved"], ["spitter", "tarantula"], ["golem", "titan"], ["flame", "infernal"]];
    for (const [base, elite] of pairs) {
      const stats = diffStats(actorCrop(base, "idle", "s", 1), actorCrop(elite, "idle", "s", 1));
      expect(stats.alphaDiff, `${base}/${elite} alpha`).toBe(0);
      expect(stats.colorRatio, `${base}/${elite} color`).toBeGreaterThan(0.08);
    }
  });

  it("スライム初期は旧進化スライム形状で、進化スライムは赤優勢になる", () => {
    const slime = actorCrop("slime", "idle", "s", 1);
    const superSlime = actorCrop("superslime", "idle", "s", 1);
    const stats = diffStats(slime, superSlime);
    expect(stats.alphaDiff).toBe(0);
    expect(stats.redRatio).toBeGreaterThan(0.65);
  });

  it("斜め射線は壁角を抜けない", () => {
    const a = createSandbox();
    const G = a.HakaishinDungeon.createGame();
    G.resetGame();
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "tunnel", sub: null };
    expect(G.hasLOS(2, 2, 5, 5)).toBe(true);
    G.grid[3][2].t = "earth";
    expect(G.hasLOS(2, 2, 5, 5)).toBe(false);
    G.grid[3][2].t = "tunnel";
    G.grid[2][3].t = "earth";
    expect(G.hasLOS(2, 2, 5, 5)).toBe(false);
    G.grid[2][3].t = "tunnel";
    G.grid[3][3].t = "earth";
    expect(G.hasLOS(2, 2, 5, 5)).toBe(false);
  });

  it("遠距離攻撃は遮断された斜め射線では当たらない", () => {
    const a = createSandbox();
    const G = a.HakaishinDungeon.createGame();
    G.resetGame();
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "tunnel", sub: null };
    G.grid[3][2].t = "earth";
    G.spawnMonster("spitter", 2, 2);
    G.heroes.push({ id: 999, cls: "mage", col: 4, row: 4, px: G.cx(4), py: G.cy(4), hp: 20, maxHp: 20, atk: 1, range: 3, atkCd: 0, actCd: 999999, coreCd: 999999, healCd: 999999, blockedMs: 0, moveCd: 999999, wave: 1, faceDir: "s" });
    const heroHp = G.heroes[0].hp;
    G.update(500);
    expect(G.heroes[0].hp).toBe(heroHp);

    G.monsters.length = 0;
    G.heroes.length = 0;
    G.spawnMonster("slime", 5, 5);
    G.heroes.push({ id: 1000, cls: "mage", col: 2, row: 2, px: G.cx(2), py: G.cy(2), hp: 20, maxHp: 20, atk: 20, range: 3, atkCd: 0, actCd: 999999, coreCd: 999999, healCd: 999999, blockedMs: 0, moveCd: 999999, wave: 1, faceDir: "s" });
    const slimeHp = G.monsters[0].hp;
    G.update(500);
    expect(G.monsters[0].hp).toBe(slimeHp);
  });

  it("タイルもDCSS CC0外部素材を元に生成される", () => {
    expect(thirdPartyMeta.tiles).toBeTruthy();
    for (const name of ["earth", "tunnel", "bedrock", "surface", "core"]) {
      const refs = thirdPartyMeta.tiles[name];
      expect(Array.isArray(refs), name).toBe(true);
      expect(refs[0].startsWith("dcss:releases/Nov-2015/dngn/"), name).toBe(true);
      const file = path.join(repoDir, thirdPartyMeta.sources.dcss.localRoot, refs[0].replace(/^dcss:/, ""));
      expect(fs.existsSync(file), file).toBe(true);
    }
    expect(diffRatio(tileCrop("earth"), tileCrop("tunnel"))).toBeGreaterThan(0.22);
    expect(diffRatio(tileCrop("earth"), tileCrop("bedrock"))).toBeGreaterThan(0.22);
  });
});
