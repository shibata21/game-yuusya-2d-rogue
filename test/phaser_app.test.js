"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGame, pixelActorX, PIXEL_ACTIONS, PIXEL_DIRS, PIXEL_FRAMES, PIXEL_CELL } from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Phaserアプリ構成", () => {
  it("index.htmlはVite module入口とPhaser用マウントを持つ", () => {
    const html = fs.readFileSync(path.join(repoDir, "index.html"), "utf8");
    expect(html).toContain('<div id="game-root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.js"></script>');
    expect(html).not.toContain("vendor/pixi");
    expect(html).not.toContain("hakaishin_dungeon");
  });

  it("Phaserシーンは3枚のアトラスをspritesheetとして読む", () => {
    const src = fs.readFileSync(path.join(repoDir, "src/main.js"), "utf8");
    expect(src).toContain('import Phaser from "phaser"');
    expect(src).toContain('this.load.spritesheet("tiles"');
    expect(src).toContain('this.load.spritesheet("actors"');
    expect(src).toContain('this.load.spritesheet("effects"');
    expect(src).toContain("Phaser.Scale.FIT");
  });

  it("ViteビルドはPages配下で読める相対baseを使う", () => {
    const config = fs.readFileSync(path.join(repoDir, "vite.config.mjs"), "utf8");
    expect(config).toContain('base: "./"');
  });

  it("公開名前空間から独立したゲームを生成できる", async () => {
    const core = await import("../src/gameCore.js");
    core.exposeGameNamespace();
    expect(globalThis.HakaishinDungeon).toBeTruthy();
    const a = globalThis.HakaishinDungeon.createGame({ seed: 1 });
    const b = globalThis.HakaishinDungeon.createGame({ seed: 2 });
    expect(a.monsters).not.toBe(b.monsters);
    expect(globalThis.HakaishinDungeon.Core.PIXEL_ASSET_VERSION).toBe("v7-external-tiles-los-1");
  });

  it("採掘入力先のルールAPIはPhaser非依存で動く", () => {
    const G = createGame({ seed: 1 });
    G.resetGame(1);
    G.gameState = "playing";
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: "moss", shade: 0, evo: false };
    G.grid[2][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.monsters[0].kind).toBe("slime");
    expect(G.grid[3][G.ENTRANCE_COL].t).toBe("tunnel");
  });

  it("アクターのPhaserフレーム番号は既存アトラス座標から導ける", () => {
    const action = "attack";
    const dir = "e";
    const frame = 2;
    const expectedColumn = ((PIXEL_ACTIONS.indexOf(action) * PIXEL_DIRS.length + PIXEL_DIRS.indexOf(dir)) * PIXEL_FRAMES + frame);
    expect(pixelActorX(action, dir, frame)).toBe(expectedColumn * PIXEL_CELL);
  });
});
