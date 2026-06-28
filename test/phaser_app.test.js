"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGame, pixelActorX, pixelActorFrameIndex, PIXEL_ACTIONS, PIXEL_DIRS, PIXEL_FRAMES, PIXEL_CELL, PIXEL_ACTORS } from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Phaserアプリ構成", () => {
  it("index.htmlはVite module入口とPhaser用マウントを持つ", () => {
    const html = fs.readFileSync(path.join(repoDir, "index.html"), "utf8");
    expect(html).toContain('<div id="game-root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.js"></script>');
    expect(html).toContain('id="codexBtn"');
    expect(html).toContain('id="codexPanel"');
    expect(html).toContain('data-codex-tab="amulet"');
    expect(html).toContain('id="devPanel"');
    expect(html).toContain('id="resetDevBtn"');
    expect(html).toContain('id="resetProgressBtn"');
    expect(html).toContain('id="exportDevJsonBtn"');
    expect(html).toContain('id="copyDevJsonBtn"');
    expect(html).toContain('id="devJsonOutput"');
    expect(html).toContain('id="soundPanel"');
    expect(html).toContain('data-audio-volume="master"');
    expect(html).toContain('data-audio-volume="voice"');
    expect(html).toContain('id="amuletPopup"');
    expect(html).toContain('id="amuletChoiceOverlay"');
    expect(html).toContain('id="amuletChoiceGrid"');
    expect(html).toContain('id="skipAmuletBtn"');
    expect(html).toContain('id="startTitlePanel"');
    expect(html).not.toContain('id="startDialoguePanel"');
    expect(html).not.toContain('id="startPowerPanel"');
    expect(html).not.toContain('id="powerConfirmBtn"');
    expect(html).not.toContain("ちからを選択");
    expect(html).not.toContain('id="powerStatus"');
    expect(html).not.toContain('id="powerBtn"');
    expect(html).not.toContain("迷宮防衛指令");
    expect(html).not.toContain("魔界");
    expect(html).not.toContain("敗 北");
    expect(html).not.toContain("vendor/pixi");
    expect(html).not.toContain("hakaishin_dungeon");
  });

  it("Phaserシーンは4枚のアトラスをspritesheetとして読む", () => {
    const src = fs.readFileSync(path.join(repoDir, "src/main.js"), "utf8");
    expect(src).toContain('import Phaser from "phaser"');
    expect(src).toContain("let gameApi = createConfiguredGame();");
    expect(src).not.toContain("let gameApi = createGame({ seed: 1 });");
    expect(src).toContain("loadStoredRuleConfig");
    expect(src).toContain("saveStoredRuleConfig");
    expect(src).toContain("applyProgressEvents");
    expect(src).toContain("DEFAULT_RULE_CONFIG");
    expect(src).toContain('this.load.spritesheet("tiles"');
    expect(src).toContain('this.load.spritesheet("actors"');
    expect(src).toContain('this.load.spritesheet("effects"');
    expect(src).toContain('this.load.spritesheet("amulets"');
    expect(src).toContain("this.load.audio(AUDIO_KEYS.bgm");
    expect(src).toContain("bgm_dungeon_loop.wav");
    expect(src).toContain("core_hit.wav");
    expect(src).toContain("hero_death_1.wav");
    expect(src).toContain("indexedDB.open(AUDIO_DB_NAME");
    expect(src).toContain("handleGameEvents");
    expect(src).toContain("playCoreHitSound");
    expect(src).toContain("playHeroDeathVoice");
    expect(src).not.toContain("localStorage.setItem(\"makaiDefense.audio");
    expect(src).toContain("Phaser.Scale.FIT");
    expect(src).toContain("crackGraphics");
    expect(src).toContain("DIG_BREAK");
    expect(src).toContain("drawEntryZone");
    expect(src).toContain("drawInitialDigHint");
    expect(src).toContain("coreShock");
    expect(src).toContain("healArea");
    expect(src).toContain("core-alert");
    expect(src).toContain("TAP_MAX_MS = 450");
    expect(src).not.toContain("activateHeldPower");
    expect(src).not.toContain("drawPowerGestureEffects");
    expect(src).not.toContain("POWER_DEFS");
    expect(src).toContain('this.input.on("pointerup"');
    expect(src).toContain('this.input.on("pointercancel"');
    expect(src).not.toContain('getElementById("powerBtn")');
    expect(src).toContain("touch: { capture: false }");
    expect(src).toContain("preventDefaultDown: false");
    expect(src).toContain("renderCodex");
    expect(src).toContain("codexOpen");
    expect(src).toContain("silhouette");
    expect(src).toContain("discoveredMonsters");
    expect(src).toContain("discoveredAmulets");
    expect(src).toContain("amuletCard");
    expect(src).toContain("renderAmuletOffer");
    expect(src).toContain("chooseAmuletOffer");
    expect(src).toContain("bindAmuletHud");
    expect(src).toContain("AMULET_LONG_PRESS_MS");
    expect(src).toContain("showAmuletPopup");
    expect(src).toContain("updateDevDefaultDiffs");
    expect(src).toContain("exportDevJson");
    expect(src).toContain("copyDevJson");
    expect(src).toContain("進化モンスター");
    expect(src).not.toContain("上位モンスター");
  });

  it("盤面上から縦スクロールできるCSSを持つ", () => {
    const css = fs.readFileSync(path.join(repoDir, "src/style.css"), "utf8");
    expect(css).toContain("touch-action: pan-y");
    expect(css).toContain(".codex-card");
    expect(css).toContain(".codex-card.locked");
    expect(css).toContain(".codex-sprite.silhouette");
    expect(css).toContain(".codex-amulet-icon");
    expect(css).toContain(".dev-panel");
    expect(css).toContain(".sound-panel");
    expect(css).toContain(".sound-fields input[type=\"range\"]");
    expect(css).toContain(".btn-codex");
    expect(css).toContain(".core-line.core-alert");
    expect(css).not.toContain(".amulet-flash");
    expect(css).toContain(".amulet-used");
    expect(css).toContain(".amulet-popup");
    expect(css).toContain(".dev-default");
    expect(css).toContain(".dev-field .dev-default.dev-default-diff");
    expect(css).toContain("-webkit-user-select: none");
    expect(css).toContain("-webkit-touch-callout: none");
    expect(css).toContain(".amulet-choice-card");
    expect(css).toContain(".amulet-choice-icon");
    expect(css).toContain(".dev-json-output");
    expect(css).not.toContain(".power-status");
    expect(css).not.toContain("demon-squirrel-king.png");
    expect(css).not.toContain(".btn-power");
    expect(fs.existsSync(path.join(repoDir, "assets/ui/demon-squirrel-king.png"))).toBe(false);
  });

  it("ViteビルドはPages配下で読める相対baseを使う", () => {
    const config = fs.readFileSync(path.join(repoDir, "vite.config.mjs"), "utf8");
    expect(config).toContain('base: "./"');
    expect(config).toContain('copyDir("assets/audio", "dist/assets/audio")');
  });

  it("公開名前空間から独立したゲームを生成できる", async () => {
    const core = await import("../src/gameCore.js");
    core.exposeGameNamespace();
    expect(globalThis.MakaiDefense).toBeTruthy();
    const a = globalThis.MakaiDefense.createGame({ seed: 1 });
    const b = globalThis.MakaiDefense.createGame({ seed: 2 });
    expect(a.monsters).not.toBe(b.monsters);
    expect(globalThis.MakaiDefense.Core.PIXEL_ASSET_VERSION).toBe("v21-max-coat");
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

  it("アクターのPhaserフレーム番号はアクション数変更後も正しい行を指す", () => {
    const framesPerRow = PIXEL_FRAMES * PIXEL_DIRS.length * PIXEL_ACTIONS.length;
    const adventurerFrame = pixelActorFrameIndex("warrior", "idle", "s", 1);
    const whiteflameFrame = pixelActorFrameIndex("whiteflame", "idle", "s", 1);
    expect(Math.floor(adventurerFrame / framesPerRow)).toBe(PIXEL_ACTORS.indexOf("warrior"));
    expect(Math.floor(whiteflameFrame / framesPerRow)).toBe(PIXEL_ACTORS.indexOf("whiteflame"));
    expect(adventurerFrame).not.toBe(whiteflameFrame);

    const src = fs.readFileSync(path.join(repoDir, "src/main.js"), "utf8");
    expect(src).toContain("pixelActorFrameIndex");
    expect(src).not.toContain("PIXEL_FRAMES * 8 * 6");
  });
});
