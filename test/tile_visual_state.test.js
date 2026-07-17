"use strict";

import { describe, expect, it } from "vitest";
import {
  createGame,
  PIXEL_SOIL_ALGAE_STAGES,
  PIXEL_VEIN_EVO2_AURA_FRAMES,
  VEIN_EVO_MAX_STAGE,
  tileOverlayFrameState,
} from "../src/gameCore.js";

describe("土壌・鉱脈の表示状態", () => {
  it("通常土壌は養分0で藻なし、1〜7で対応フレームを使う", () => {
    const tile = { t: "earth", sub: null, soilMana: 0 };
    expect(tileOverlayFrameState(tile)).toEqual({ algaeFrame: null, auraFrame: null });

    for (const stage of PIXEL_SOIL_ALGAE_STAGES) {
      tile.soilMana = stage;
      expect(tileOverlayFrameState(tile).algaeFrame, `stage ${stage}`).toBe(stage - 1);
    }

    tile.soilMana = 999;
    expect(tileOverlayFrameState(tile).algaeFrame).toBe(PIXEL_SOIL_ALGAE_STAGES.length - 1);
  });

  it("鉱脈は藻を隠し、第二進化だけオーラを表示する", () => {
    const tile = { t: "earth", sub: "moss", soilMana: 7, evoStage: 0 };
    expect(tileOverlayFrameState(tile)).toEqual({ algaeFrame: null, auraFrame: null });
    tile.evoStage = 1;
    expect(tileOverlayFrameState(tile)).toEqual({ algaeFrame: null, auraFrame: null });
    tile.evoStage = VEIN_EVO_MAX_STAGE;
    expect(tileOverlayFrameState(tile, 0, 0, 0)).toEqual({ algaeFrame: null, auraFrame: 0 });

    const legacyFirstEvolution = { t: "earth", sub: "moss", soilMana: 7, evo: true };
    expect(tileOverlayFrameState(legacyFirstEvolution).auraFrame).toBe(null);
  });

  it("オーラは時間とセル座標で位相をずらして4フレーム循環する", () => {
    const tile = { t: "earth", sub: "moss", evoStage: VEIN_EVO_MAX_STAGE };
    expect(tileOverlayFrameState(tile, 0, 0, 0).auraFrame).toBe(0);
    expect(tileOverlayFrameState(tile, 0, 1, 0).auraFrame).toBe(3);
    expect(tileOverlayFrameState(tile, 0, 0, 1).auraFrame).toBe(1);
    expect(tileOverlayFrameState(tile, 180 * PIXEL_VEIN_EVO2_AURA_FRAMES, 0, 0).auraFrame).toBe(0);
  });

  it("土壌進化補助上限を変えても第二進化段階は2のまま保つ", () => {
    const tuned = createGame({ ruleConfig: { constants: { SOIL_MANA_EVO_MAX: 1 } } });
    expect(tuned.SOIL_MANA_EVO_MAX).toBe(1);
    expect(tuned.VEIN_EVO_MAX_STAGE).toBe(2);
    expect(tuned.evoStageOf({ evoStage: 99 })).toBe(2);
    expect(tileOverlayFrameState({ t: "earth", sub: "moss", evoStage: 2 }).auraFrame).toBe(0);
  });

  it("進化低下・鉱脈消滅・採掘後は非表示状態へ戻る", () => {
    const tile = { t: "earth", sub: "moss", soilMana: 7, evoStage: VEIN_EVO_MAX_STAGE };
    expect(tileOverlayFrameState(tile).auraFrame).toBe(0);

    tile.evoStage = 1;
    expect(tileOverlayFrameState(tile).auraFrame).toBe(null);
    tile.sub = null;
    expect(tileOverlayFrameState(tile)).toEqual({ algaeFrame: 6, auraFrame: null });
    tile.t = "tunnel";
    expect(tileOverlayFrameState(tile)).toEqual({ algaeFrame: null, auraFrame: null });
  });
});
