"use strict";

import { beforeEach, describe, expect, it } from "vitest";
import {
  __storageTestHooks,
  applyProgressEvents,
  awardRunCoins,
  clearProgress,
  clearStoredRuleConfig,
  coinRewardForRun,
  loadProgress,
  loadStoredRuleConfig,
  saveProgress,
  saveStoredRuleConfig,
} from "../src/storage.js";

const { DEV_RULE_KEY, LEGACY_DEV_RULE_KEY, PROGRESS_KEY } = __storageTestHooks.keys;

describe("ローカル保存", () => {
  beforeEach(() => {
    __storageTestHooks.reset();
  });

  it("開発設定を保存して読み戻せる", () => {
    const config = { constants: { DIG_COST: 4 }, kinds: { slime: { hp: 99 } } };
    expect(saveStoredRuleConfig(config)).toBe(true);
    expect(loadStoredRuleConfig()).toEqual(config);
    expect(clearStoredRuleConfig()).toBe(true);
    expect(loadStoredRuleConfig()).toBe(null);
  });

  it("旧v1開発設定は新しい既定バランスを巻き戻さないよう破棄する", () => {
    const oldSnapshot = { kinds: { moss_virus: { hp: 8, range: 2, weakenMs: 3200 } } };
    __storageTestHooks.setRaw(LEGACY_DEV_RULE_KEY, JSON.stringify(oldSnapshot));
    expect(loadStoredRuleConfig()).toBe(null);
    expect(__storageTestHooks.getRaw(LEGACY_DEV_RULE_KEY)).toBe(null);

    const current = { kinds: { moss_virus: { hp: 6 } } };
    expect(saveStoredRuleConfig(current)).toBe(true);
    expect(loadStoredRuleConfig()).toEqual(current);
    expect(JSON.parse(__storageTestHooks.getRaw(DEV_RULE_KEY))).toEqual(current);
  });

  it("進行データは発見イベントと最高到達ウェーブを反映する", () => {
    const result = applyProgressEvents(loadProgress(), [
      { type: "waveReached", wave: 3 },
      { type: "waveReached", wave: 2 },
      { type: "discoverMonster", kind: "slime" },
      { type: "discoverMonster", kind: "slime" },
      { type: "discoverHero", cls: "warrior" },
      { type: "loopCleared", loop: 2 },
    ]);
    expect(result.changed).toBe(true);
    expect(result.progress).toEqual({
      highestWave: 3,
      highestClearedLoop: 2,
      coins: 0,
      totalCoinsEarned: 0,
      lastCoinReward: 0,
      resetPenaltyActive: false,
      activeRun: null,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
      unlockedMonsterFamilies: [],
      monsterDeck: {},
    });
    expect(saveProgress(result.progress)).toBe(true);
    expect(loadProgress()).toEqual(result.progress);
    expect(clearProgress()).toBe(true);
  });

  it("壊れた保存値は既定値として扱う", () => {
    __storageTestHooks.setRaw(DEV_RULE_KEY, "{");
    __storageTestHooks.setRaw(PROGRESS_KEY, "{");
    expect(loadStoredRuleConfig()).toBe(null);
    expect(loadProgress()).toEqual({
      highestWave: 0,
      highestClearedLoop: 0,
      coins: 0,
      totalCoinsEarned: 0,
      lastCoinReward: 0,
      resetPenaltyActive: false,
      activeRun: null,
      discoveredMonsters: [],
      discoveredHeroes: [],
      unlockedMonsterFamilies: [],
      monsterDeck: {},
    });
  });

  it("旧形式の進行データはアイテム未発見として読み込む", () => {
    __storageTestHooks.setRaw(PROGRESS_KEY, JSON.stringify({
      highestWave: 2,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
    }));
    expect(loadProgress()).toEqual({
      highestWave: 2,
      highestClearedLoop: 0,
      coins: 0,
      totalCoinsEarned: 0,
      lastCoinReward: 0,
      resetPenaltyActive: false,
      activeRun: null,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
      unlockedMonsterFamilies: [],
      monsterDeck: {},
    });
  });

  it("旧アイテム進行を読み込み時に破棄し、次回保存から除去する", () => {
    __storageTestHooks.setRaw(PROGRESS_KEY, JSON.stringify({
      highestWave: 4,
      coins: 12,
      discoveredItems: ["rustyPickaxe"],
      unlockedItems: ["blackSoilBag"],
      unlockedMonsterFamilies: ["moss_shroom"],
    }));

    const progress = loadProgress();
    expect(progress).not.toHaveProperty("discoveredItems");
    expect(progress).not.toHaveProperty("unlockedItems");
    expect(progress.unlockedMonsterFamilies).toEqual(["moss_shroom"]);
    expect(saveProgress(progress)).toBe(true);
    expect(JSON.parse(__storageTestHooks.getRaw(PROGRESS_KEY))).not.toHaveProperty("discoveredItems");
    expect(JSON.parse(__storageTestHooks.getRaw(PROGRESS_KEY))).not.toHaveProperty("unlockedItems");
  });

  it("ラン終了コインをスコアとクリアボーナスから付与する", () => {
    expect(coinRewardForRun(1234, 3, false)).toBe(12);
    expect(coinRewardForRun(1234, 3, true)).toBe(237);
    const result = awardRunCoins(loadProgress(), { score: 1234, loop: 3, cleared: true });
    expect(result.reward).toBe(237);
    expect(result.progress.coins).toBe(237);
    expect(result.progress.totalCoinsEarned).toBe(237);
    expect(result.progress.lastCoinReward).toBe(237);
  });
});
