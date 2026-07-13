"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createGame, pixelActorX, pixelActorFrameInfo, pixelActorFrameIndex, PIXEL_ACTIONS, PIXEL_ACTOR_RENDER_DIRS, PIXEL_FRAMES, PIXEL_CELL, PIXEL_ACTOR_SHEETS, PIXEL_ACTOR_FRAMES_PER_ACTOR, PIXEL_ACTOR_ATLAS_COLUMNS } from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Phaserアプリ構成", () => {
  it("index.htmlはVite module入口とPhaser用マウントを持つ", () => {
    const html = fs.readFileSync(path.join(repoDir, "index.html"), "utf8");
    expect(html).toContain('<div id="game-root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.js"></script>');
    expect(html).toContain('data-home-tab="defense"');
    expect(html).toContain('data-home-tab="deck"');
    expect(html).toContain('data-home-tab="codex"');
    expect(html).toContain('data-home-tab="settings"');
    expect(html).not.toContain('data-home-tab="unlock"');
    expect(html).not.toContain('id="codexBtn"');
    expect(html).not.toContain('id="codexPanel"');
    expect(html).not.toContain('id="devPanel"');
    expect(html).not.toContain('id="soundPanel"');
    expect(html).toContain('id="itemPopup"');
    expect(html).toContain('id="itemChoiceOverlay"');
    expect(html).toContain('id="itemChoiceGrid"');
    expect(html).toContain('id="skipItemBtn"');
    expect(html).not.toContain('id="loopSelect"');
    expect(html).not.toContain('id="loopInfo"');
    expect(html).toContain('<div class="controls">');
    expect(html).not.toContain('<span>周回</span>');
    expect(html).not.toContain('id="loopNum"');
    expect(html).not.toContain("迷宮ホーム");
    expect(html).not.toContain("キャラクター紹介");
    expect(html).not.toContain("音量設定");
    expect(html).not.toContain("開発設定");
    expect(html).toContain('id="hudMessage"');
    expect(html).not.toContain('id="debuffBar"');
    expect(html).toContain('id="debuffNoticeOverlay"');
    expect(html).toContain('id="trapChoiceOverlay"');
    expect(html).toContain('id="startTitlePanel"');
    expect(html).toContain('id="dialogueOverlay"');
    expect(html).toContain('id="dialogueAdvanceBtn"');
    expect(html).toContain('id="dialogueSpeaker"');
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

  it("Phaserシーンは分割アトラスをspritesheetとして読む", () => {
    const src = fs.readFileSync(path.join(repoDir, "src/main.js"), "utf8");
    expect(src).toContain('import Phaser from "phaser"');
    expect(src).toContain("let gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);");
    expect(src).not.toContain("let gameApi = createGame({ seed: 1 });");
    expect(src).toContain("loadStoredRuleConfig");
    expect(src).toContain("saveStoredRuleConfig");
    expect(src).toContain("applyProgressEvents");
    expect(src).toContain("DEFAULT_RULE_CONFIG");
    expect(src).toContain('this.load.spritesheet("tiles"');
    expect(src).toContain("pixelActorTextureKey(sheet)");
    expect(src).toContain("actorSheetsForCurrentDeck");
    expect(src).not.toContain('this.load.spritesheet("actors"');
    expect(src).not.toContain('pixelAssetUrl("actors.png")');
    expect(src).toContain('this.load.spritesheet("effects"');
    expect(src).toContain('this.load.spritesheet("items"');
    expect(src).toContain('this.load.spritesheet("debuffs"');
    expect(src).toContain("this.load.audio(AUDIO_KEYS.bgm");
    expect(src).toContain("bgm_dungeon_loop.wav");
    expect(src).toContain("core_hit.wav");
    expect(src).toContain("hero_death_1.wav");
    expect(src).toContain("indexedDB.open(AUDIO_DB_NAME");
    expect(src).toContain("handleGameEvents");
    expect(src).toContain("playCoreHitSound");
    expect(src).toContain("playHeroDeathVoice");
    expect(src).not.toContain("local" + "Storage");
    expect(src).toContain("Phaser.Scale.FIT");
    expect(src).toContain("crackGraphics");
    expect(src).toContain("DIG_BREAK");
    expect(src).toContain("drawEntryZone");
    expect(src).toContain("showIntro: selectedLoop === 1 && (progress.highestWave || 0) < 3");
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
    expect(src).toContain('homeTab === "codex"');
    expect(src).toContain("silhouette");
    expect(src).toContain("discoveredMonsters");
    expect(src).toContain("discoveredItems");
    expect(src).toContain("itemCard");
    expect(src).toContain("renderItemOffer");
    expect(src).toContain("renderShopOffer");
    expect(src).toContain("renderTrapOffer");
    expect(src).toContain("renderDebuffNotice");
    expect(src).toContain("renderDialogue");
    expect(src).toContain("dialogueAdvanceBtn");
    expect(src).toContain("advanceDialogue");
    expect(src).toContain("dialogue_portraits.png");
    expect(src).toContain("pixelDialoguePortraitFrameIndex");
    expect(src).toContain("data-debuff-id");
    expect(src).toContain("hudMessage");
    expect(src).toContain('gameApi.gameState === "dialogue"');
    expect(src).toContain("renderLoopSelector");
    expect(src).toContain("homeSelect.disabled = !selectable");
    expect(src).not.toContain('getElementById("loopNum")');
    expect(src).not.toContain('getElementById("loopSelect")');
    expect(src).toContain("chooseItemOffer");
    expect(src).toContain("buyShopItem");
    expect(src).toContain("closeShopOffer");
    expect(src).toContain("chooseTrapDebuff");
    expect(src).toContain("acknowledgeDebuffNotice");
    expect(src).toContain("bindItemHud");
    expect(src).toContain("ITEM_LONG_PRESS_MS");
    expect(src).toContain("showItemPopup");
    expect(src).toContain("updateDevDefaultDiffs");
    expect(src).toContain("exportDevJson");
    expect(src).toContain("copyDevJson");
    expect(src).toContain("settingsTab");
    expect(src).toContain("applyAudioInput");
    expect(src).toContain('data-settings-tab="volume"');
    expect(src).toContain("codexMonsterFamilyCard");
    expect(src).toContain("codexItemCard");
    expect(src).not.toContain("codexOpen");
    expect(src).toContain("進化モンスター");
    expect(src).not.toContain("上位モンスター");
  });

  it("盤面上から縦スクロールできるCSSを持つ", () => {
    const css = fs.readFileSync(path.join(repoDir, "src/style.css"), "utf8");
    expect(css).toContain("touch-action: pan-y");
    expect(css).toContain("box-sizing: content-box");
    expect(css).toContain("width: calc(100% - 4px)");
    expect(css).toContain(".codex-card");
    expect(css).toContain(".codex-card.locked");
    expect(css).toContain(".codex-unlock-card");
    expect(css).toContain(".codex-sprite.silhouette");
    expect(css).toContain(".codex-item-icon");
    expect(css).toContain(".dev-panel");
    expect(css).toContain(".settings-tabs");
    expect(css).toContain(".sound-fields input[type=\"range\"]");
    expect(css).toContain(".core-line.core-alert");
    expect(css).not.toContain(".item-flash");
    expect(css).toContain(".item-used");
    expect(css).toContain(".item-popup");
    expect(css).toContain(".dev-default");
    expect(css).toContain(".dev-field .dev-default.dev-default-diff");
    expect(css).toContain("-webkit-user-select: none");
    expect(css).toContain("-webkit-touch-callout: none");
    expect(css).toContain(".item-choice-card");
    expect(css).toContain(".item-choice-icon");
    expect(css).toContain(".item-shop-card");
    expect(css).toContain(".item-rarity-gold");
    expect(css).not.toContain(".loop-select");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 116px");
    expect(css).toContain(".hud-message");
    expect(css).toContain(".item-debuff");
    expect(css).not.toContain(".debuffs");
    expect(css).toContain(".trap-choice-grid");
    expect(css).toContain(".debuff-notice-body");
    expect(css).toContain(".dialogue-overlay");
    expect(css).toContain(".dialogue-box");
    expect(css).toContain(".dialogue-portrait");
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
    expect(config).toContain('skipNames: new Set(["source"])');
  });

  it("公開名前空間から独立したゲームを生成できる", async () => {
    const core = await import("../src/gameCore.js");
    core.exposeGameNamespace();
    expect(globalThis.MakaiDefense).toBeTruthy();
    const a = globalThis.MakaiDefense.createGame({ seed: 1 });
    const b = globalThis.MakaiDefense.createGame({ seed: 2 });
    expect(a.monsters).not.toBe(b.monsters);
    expect(globalThis.MakaiDefense.Core.PIXEL_ASSET_VERSION).toBe("v30-imagegen");
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
    const expectedColumn = ((PIXEL_ACTIONS.indexOf(action) * PIXEL_ACTOR_RENDER_DIRS.length + PIXEL_ACTOR_RENDER_DIRS.indexOf(dir)) * PIXEL_FRAMES + frame);
    expect(pixelActorX(action, dir, frame)).toBe(expectedColumn * PIXEL_CELL);
    const west = pixelActorFrameInfo("warrior", action, "w", frame);
    const east = pixelActorFrameInfo("warrior", action, "e", frame);
    expect(west.frame).toBe(east.frame);
    expect(west.flipX).toBe(true);
    expect(east.flipX).toBe(false);

    for (const name of Object.values(PIXEL_ACTOR_SHEETS).flat()) {
      for (const actionName of PIXEL_ACTIONS) {
        for (let frameIndex = 0; frameIndex < PIXEL_FRAMES; frameIndex++) {
          const eastFrame = pixelActorFrameInfo(name, actionName, "e", frameIndex);
          const westFrame = pixelActorFrameInfo(name, actionName, "w", frameIndex);
          const southeastFrame = pixelActorFrameInfo(name, actionName, "se", frameIndex);
          const southwestFrame = pixelActorFrameInfo(name, actionName, "sw", frameIndex);
          const northeastFrame = pixelActorFrameInfo(name, actionName, "ne", frameIndex);
          const northwestFrame = pixelActorFrameInfo(name, actionName, "nw", frameIndex);
          expect(westFrame.frame, `${name}:${actionName}:w`).toBe(eastFrame.frame);
          expect(southwestFrame.frame, `${name}:${actionName}:sw`).toBe(southeastFrame.frame);
          expect(northwestFrame.frame, `${name}:${actionName}:nw`).toBe(northeastFrame.frame);
          expect(westFrame.flipX, `${name}:${actionName}:w`).toBe(true);
          expect(southwestFrame.flipX, `${name}:${actionName}:sw`).toBe(true);
          expect(northwestFrame.flipX, `${name}:${actionName}:nw`).toBe(true);
          expect(eastFrame.flipX, `${name}:${actionName}:e`).toBe(false);
          expect(southeastFrame.flipX, `${name}:${actionName}:se`).toBe(false);
          expect(northeastFrame.flipX, `${name}:${actionName}:ne`).toBe(false);
          expect(pixelActorFrameInfo(name, actionName, "s", frameIndex).flipX, `${name}:${actionName}:s`).toBe(false);
          expect(pixelActorFrameInfo(name, actionName, "n", frameIndex).flipX, `${name}:${actionName}:n`).toBe(false);
        }
      }
    }

    const healFrame = 1;
    const healFrameInActor =
      (PIXEL_ACTIONS.indexOf("heal") * PIXEL_ACTOR_RENDER_DIRS.length + PIXEL_ACTOR_RENDER_DIRS.indexOf("s")) *
        PIXEL_FRAMES +
      healFrame;
    const healed = pixelActorFrameInfo("superwarrior", "heal", "s", healFrame);
    expect(pixelActorX("heal", "s", healFrame)).toBe((healFrameInActor % PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL);
    expect(healed.frame).toBe(PIXEL_ACTOR_FRAMES_PER_ACTOR + healFrameInActor);
    expect(healed.x).toBe((healed.frame % PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL);
    expect(healed.y).toBe(Math.floor(healed.frame / PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL);
  });

  it("アクターのPhaserフレーム番号はアクション数変更後も正しい行を指す", () => {
    const framesPerActor = PIXEL_ACTOR_FRAMES_PER_ACTOR;
    const adventurer = pixelActorFrameInfo("warrior", "idle", "s", 1);
    const whiteflame = pixelActorFrameInfo("whiteflame", "idle", "s", 1);
    const adventurerFrame = pixelActorFrameIndex("warrior", "idle", "s", 1);
    const whiteflameFrame = pixelActorFrameIndex("whiteflame", "idle", "s", 1);
    expect(adventurerFrame).toBe(adventurer.frame);
    expect(whiteflameFrame).toBe(whiteflame.frame);
    expect(Math.floor(adventurerFrame / framesPerActor)).toBe(PIXEL_ACTOR_SHEETS.heroes.indexOf("warrior"));
    expect(Math.floor(whiteflameFrame / framesPerActor)).toBe(PIXEL_ACTOR_SHEETS.ember_dragon.indexOf("whiteflame"));
    expect(adventurer.sheet).toBe("heroes");
    expect(whiteflame.sheet).toBe("ember_dragon");
    expect(adventurerFrame).not.toBe(whiteflameFrame);

    const src = fs.readFileSync(path.join(repoDir, "src/main.js"), "utf8");
    expect(src).toContain("pixelActorFrameInfo");
    expect(src).not.toContain("PIXEL_FRAMES * 8 * 6");
  });
});
