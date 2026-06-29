"use strict";

import { beforeEach, describe, expect, it } from "vitest";
import {
  applyProgressEvents,
  clearProgress,
  clearStoredRuleConfig,
  loadProgress,
  loadStoredRuleConfig,
  saveProgress,
  saveStoredRuleConfig,
} from "../src/storage.js";

const DEV_RULE_KEY = "makaiDefense.devRuleConfig.v1";
const PROGRESS_KEY = "makaiDefense.progress.v1";

function installLocalStorage() {
  const data = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

describe("ローカル保存", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("開発設定を保存して読み戻せる", () => {
    const config = { constants: { DIG_COST: 4 }, kinds: { slime: { hp: 99 } } };
    expect(saveStoredRuleConfig(config)).toBe(true);
    expect(loadStoredRuleConfig()).toEqual(config);
    expect(clearStoredRuleConfig()).toBe(true);
    expect(loadStoredRuleConfig()).toBe(null);
  });

  it("進行データは発見イベントと最高到達ウェーブを反映する", () => {
    const result = applyProgressEvents(loadProgress(), [
      { type: "waveReached", wave: 3 },
      { type: "waveReached", wave: 2 },
      { type: "discoverMonster", kind: "slime" },
      { type: "discoverMonster", kind: "slime" },
      { type: "discoverHero", cls: "warrior" },
      { type: "discoverItem", id: "rustyPickaxe" },
      { type: "discoverItem", id: "rustyPickaxe" },
    ]);
    expect(result.changed).toBe(true);
    expect(result.progress).toEqual({
      highestWave: 3,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
      discoveredItems: ["rustyPickaxe"],
    });
    expect(saveProgress(result.progress)).toBe(true);
    expect(loadProgress()).toEqual(result.progress);
    expect(clearProgress()).toBe(true);
  });

  it("壊れた保存値は既定値として扱う", () => {
    globalThis.localStorage.setItem(DEV_RULE_KEY, "{");
    globalThis.localStorage.setItem(PROGRESS_KEY, "{");
    expect(loadStoredRuleConfig()).toBe(null);
    expect(loadProgress()).toEqual({
      highestWave: 0,
      discoveredMonsters: [],
      discoveredHeroes: [],
      discoveredItems: [],
    });
  });

  it("旧形式の進行データはアイテム未発見として読み込む", () => {
    globalThis.localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      highestWave: 2,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
    }));
    expect(loadProgress()).toEqual({
      highestWave: 2,
      discoveredMonsters: ["slime"],
      discoveredHeroes: ["warrior"],
      discoveredItems: [],
    });
  });
});
