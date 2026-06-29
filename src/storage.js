"use strict";

const DEV_RULE_KEY = "makaiDefense.devRuleConfig.v1";
const PROGRESS_KEY = "makaiDefense.progress.v1";

export const EMPTY_PROGRESS = {
  highestWave: 0,
  discoveredMonsters: [],
  discoveredHeroes: [],
  discoveredItems: [],
};

function browserStorageAdapter() {
  const store = typeof globalThis !== "undefined" ? globalThis.localStorage : null;
  return {
    read(key) {
      if (!store) return null;
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    write(key, value) {
      if (!store) return false;
      try {
        store.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      if (!store) return false;
      try {
        store.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}

function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && item.length > 0))];
}

export function loadStoredRuleConfig() {
  return parseJson(browserStorageAdapter().read(DEV_RULE_KEY), null);
}

export function saveStoredRuleConfig(ruleConfig) {
  return browserStorageAdapter().write(DEV_RULE_KEY, JSON.stringify(ruleConfig || {}));
}

export function clearStoredRuleConfig() {
  return browserStorageAdapter().remove(DEV_RULE_KEY);
}

export function loadProgress() {
  const raw = parseJson(browserStorageAdapter().read(PROGRESS_KEY), EMPTY_PROGRESS);
  return {
    highestWave: Math.max(0, Math.floor(Number(raw.highestWave) || 0)),
    discoveredMonsters: uniqueStrings(raw.discoveredMonsters),
    discoveredHeroes: uniqueStrings(raw.discoveredHeroes),
    discoveredItems: uniqueStrings(raw.discoveredItems),
  };
}

export function saveProgress(progress) {
  const clean = {
    highestWave: Math.max(0, Math.floor(Number(progress && progress.highestWave) || 0)),
    discoveredMonsters: uniqueStrings(progress && progress.discoveredMonsters),
    discoveredHeroes: uniqueStrings(progress && progress.discoveredHeroes),
    discoveredItems: uniqueStrings(progress && progress.discoveredItems),
  };
  return browserStorageAdapter().write(PROGRESS_KEY, JSON.stringify(clean));
}

export function clearProgress() {
  return browserStorageAdapter().remove(PROGRESS_KEY);
}

export function applyProgressEvents(progress, events) {
  const next = {
    highestWave: Math.max(0, Math.floor(Number(progress && progress.highestWave) || 0)),
    discoveredMonsters: uniqueStrings(progress && progress.discoveredMonsters),
    discoveredHeroes: uniqueStrings(progress && progress.discoveredHeroes),
    discoveredItems: uniqueStrings(progress && progress.discoveredItems),
  };
  let changed = false;
  const monsters = new Set(next.discoveredMonsters);
  const heroes = new Set(next.discoveredHeroes);
  const items = new Set(next.discoveredItems);
  for (const event of Array.isArray(events) ? events : []) {
    if (event.type === "waveReached") {
      const wave = Math.max(0, Math.floor(Number(event.wave) || 0));
      if (wave > next.highestWave) {
        next.highestWave = wave;
        changed = true;
      }
    }
    if (event.type === "discoverMonster" && typeof event.kind === "string" && !monsters.has(event.kind)) {
      monsters.add(event.kind);
      changed = true;
    }
    if (event.type === "discoverHero" && typeof event.cls === "string" && !heroes.has(event.cls)) {
      heroes.add(event.cls);
      changed = true;
    }
    if (event.type === "discoverItem" && typeof event.id === "string" && !items.has(event.id)) {
      items.add(event.id);
      changed = true;
    }
  }
  next.discoveredMonsters = [...monsters];
  next.discoveredHeroes = [...heroes];
  next.discoveredItems = [...items];
  return { progress: next, changed };
}
