"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const { PNG } = require("pngjs");

const repoDir = path.resolve(__dirname, "..");
const htmlPath = path.join(repoDir, "hakaishin_dungeon.html");
const pixelMeta = JSON.parse(fs.readFileSync(path.join(repoDir, "assets/pixel/sprites.json"), "utf8"));

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
    expect(out).toContain("結果: 61 passed, 0 failed");
  }, 30000);

  it("ゲーム本体は公開名前空間から生成・検査できる", () => {
    const a = createSandbox();
    const b = createSandbox();
    expect(a.HakaishinDungeon).toBeTruthy();
    expect(typeof a.HakaishinDungeon.createGame).toBe("function");
    expect(a.HakaishinDungeon.Core.PIXEL_ASSET_VERSION).toBe("v6-tdd-elite-palette-1");
    expect(a.HakaishinDungeon.createGame().monsters).not.toBe(b.HakaishinDungeon.createGame().monsters);
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
});
