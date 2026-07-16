"use strict";

const DEV_RULE_KEY = "makaiDefense.devRuleConfig.v1";
const PROGRESS_KEY = "makaiDefense.progress.v1";
const STORAGE_DB_NAME = "makaiDefense.storage.v1";
const STORAGE_STORE_NAME = "entries";

export const EMPTY_PROGRESS = {
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
};

export const COIN_SCORE_DIVISOR = 100;
export const CLEAR_COIN_BASE = 150;
export const CLEAR_COIN_PER_LOOP = 25;

export function coinRewardForRun(score = 0, loop = 1, cleared = false) {
  const scoreCoins = Math.max(0, Math.floor((Number(score) || 0) / COIN_SCORE_DIVISOR));
  if (!cleared) return scoreCoins;
  const clearBonus = CLEAR_COIN_BASE + Math.max(1, Math.floor(Number(loop) || 1)) * CLEAR_COIN_PER_LOOP;
  return scoreCoins + clearBonus;
}

const storageCache = new Map();
let storageWriteQueue = Promise.resolve(true);
let storageBroken = false;

function indexedDbAvailable() {
  return !storageBroken && typeof indexedDB !== "undefined";
}

function openStorageDb() {
  return new Promise((resolve, reject) => {
    if (!indexedDbAvailable()) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(STORAGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORAGE_STORE_NAME)) db.createObjectStore(STORAGE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readStoreValue(db, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORAGE_STORE_NAME, "readonly");
    const request = tx.objectStore(STORAGE_STORE_NAME).get(key);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
    request.onerror = () => resolve(null);
    tx.onerror = () => resolve(null);
  });
}

function persistStoreMutation(key, value, remove = false) {
  if (!indexedDbAvailable()) return true;
  storageWriteQueue = storageWriteQueue
    .catch(() => false)
    .then(async () => {
      const db = await openStorageDb();
      if (!db) return false;
      return await new Promise((resolve) => {
        const tx = db.transaction(STORAGE_STORE_NAME, "readwrite");
        const store = tx.objectStore(STORAGE_STORE_NAME);
        if (remove) store.delete(key);
        else store.put(value, key);
        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = () => {
          db.close();
          resolve(false);
        };
      });
    })
    .catch(() => {
      storageBroken = true;
      return false;
    });
  return true;
}

export async function initStorage() {
  try {
    const db = await openStorageDb();
    if (!db) return false;
    const entries = await Promise.all([DEV_RULE_KEY, PROGRESS_KEY].map(async (key) => [key, await readStoreValue(db, key)]));
    db.close();
    for (const [key, value] of entries) {
      if (typeof value === "string") storageCache.set(key, value);
      else storageCache.delete(key);
    }
    return true;
  } catch {
    storageBroken = true;
    return false;
  }
}

export async function flushStorage() {
  try {
    return await storageWriteQueue;
  } catch {
    return false;
  }
}

function readStoredText(key) {
  return storageCache.has(key) ? storageCache.get(key) : null;
}

function writeStoredText(key, value) {
  storageCache.set(key, value);
  return persistStoreMutation(key, value, false);
}

function removeStoredText(key) {
  storageCache.delete(key);
  return persistStoreMutation(key, "", true);
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

function cleanStringRecord(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const key in value) {
    if (typeof key !== "string" || !key.length) continue;
    const item = value[key];
    if (typeof item === "string" && item.length > 0) out[key] = item;
  }
  return out;
}

function cleanActiveRun(value) {
  if (!value || typeof value !== "object") return null;
  const loop = Math.max(1, Math.floor(Number(value.loop) || 1));
  const startedAt = Math.max(0, Math.floor(Number(value.startedAt) || 0));
  return { loop, startedAt };
}

function cleanProgress(progress) {
  const coins = Math.max(0, Math.floor(Number(progress && progress.coins) || 0));
  const totalCoinsEarned = Math.max(0, Math.floor(Number(progress && progress.totalCoinsEarned) || 0));
  return {
    highestWave: Math.max(0, Math.floor(Number(progress && progress.highestWave) || 0)),
    highestClearedLoop: Math.max(0, Math.floor(Number(progress && progress.highestClearedLoop) || 0)),
    coins,
    totalCoinsEarned,
    lastCoinReward: Math.max(0, Math.floor(Number(progress && progress.lastCoinReward) || 0)),
    resetPenaltyActive: !!(progress && progress.resetPenaltyActive),
    activeRun: cleanActiveRun(progress && progress.activeRun),
    discoveredMonsters: uniqueStrings(progress && progress.discoveredMonsters),
    discoveredHeroes: uniqueStrings(progress && progress.discoveredHeroes),
    unlockedMonsterFamilies: uniqueStrings(progress && progress.unlockedMonsterFamilies),
    monsterDeck: cleanStringRecord(progress && progress.monsterDeck),
  };
}

export function loadStoredRuleConfig() {
  return parseJson(readStoredText(DEV_RULE_KEY), null);
}

export function saveStoredRuleConfig(ruleConfig) {
  return writeStoredText(DEV_RULE_KEY, JSON.stringify(ruleConfig || {}));
}

export function clearStoredRuleConfig() {
  return removeStoredText(DEV_RULE_KEY);
}

export function loadProgress() {
  const raw = parseJson(readStoredText(PROGRESS_KEY), EMPTY_PROGRESS);
  return cleanProgress(raw);
}

export function saveProgress(progress) {
  return writeStoredText(PROGRESS_KEY, JSON.stringify(cleanProgress(progress)));
}

export function clearProgress() {
  return removeStoredText(PROGRESS_KEY);
}

export function applyProgressEvents(progress, events) {
  const next = cleanProgress(progress);
  let changed = false;
  const monsters = new Set(next.discoveredMonsters);
  const heroes = new Set(next.discoveredHeroes);
  for (const event of Array.isArray(events) ? events : []) {
    if (event.type === "waveReached") {
      const wave = Math.max(0, Math.floor(Number(event.wave) || 0));
      if (wave > next.highestWave) {
        next.highestWave = wave;
        changed = true;
      }
    }
    if (event.type === "loopCleared") {
      const loop = Math.max(1, Math.floor(Number(event.loop) || 1));
      if (next.activeRun) {
        const reward = coinRewardForRun(event.score, loop, true);
        next.coins += reward;
        next.totalCoinsEarned += reward;
        next.lastCoinReward = reward;
        changed = true;
      }
      if (loop > next.highestClearedLoop) {
        next.highestClearedLoop = loop;
        changed = true;
      }
      if (next.resetPenaltyActive || next.activeRun) {
        next.resetPenaltyActive = false;
        next.activeRun = null;
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
  }
  next.discoveredMonsters = [...monsters];
  next.discoveredHeroes = [...heroes];
  return { progress: next, changed };
}

export function awardRunCoins(progress, run = {}) {
  const next = cleanProgress(progress);
  const reward = coinRewardForRun(run.score, run.loop, !!run.cleared);
  next.coins += reward;
  next.totalCoinsEarned += reward;
  next.lastCoinReward = reward;
  return { progress: next, reward };
}

export const __storageTestHooks = {
  keys: { DEV_RULE_KEY, PROGRESS_KEY },
  reset() {
    storageCache.clear();
    storageBroken = false;
    storageWriteQueue = Promise.resolve(true);
  },
  setRaw(key, value) {
    if (typeof value === "string") storageCache.set(key, value);
    else storageCache.delete(key);
  },
  getRaw(key) {
    return readStoredText(key);
  },
};
