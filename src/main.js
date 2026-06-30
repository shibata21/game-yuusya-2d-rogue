"use strict";

import Phaser from "phaser";
import {
  createGame,
  createRuleConfig,
  DEFAULT_RULE_CONFIG,
  DEFAULT_MONSTER_DECK,
  exposeGameNamespace,
  ITEM_UNLOCKS,
  MONSTER_FAMILIES,
  resolveMonsterDeck,
  pixelAssetUrl,
  pixelActorX,
  pixelActorFrameIndex,
  pixelItemFrameIndex,
  pixelDebuffFrameIndex,
  pixelDialoguePortraitFrameIndex,
  COLS,
  ROWS,
  TILE,
  W,
  H,
  MAX_LOOP,
  CORE_COL,
  CORE_ROW,
  ENTRANCE_COL,
  PIXEL_ACTORS,
  PIXEL_TILES,
  PIXEL_EFFECTS,
  PIXEL_ITEMS,
  PIXEL_DEBUFFS,
  PIXEL_DIALOGUE_PORTRAITS,
  PIXEL_FRAMES,
} from "./gameCore.js";
import { DEV_GROUPS } from "./devTuning.js";
import {
  applyProgressEvents,
  awardRunCoins,
  clearProgress,
  clearStoredRuleConfig,
  initStorage,
  loadProgress,
  loadStoredRuleConfig,
  saveProgress,
  saveStoredRuleConfig,
} from "./storage.js";
import "./style.css";

function createConfiguredGame(loop = 1, resetPenaltyActive = false) {
  const sourceProgress = typeof progress === "undefined" ? null : progress;
  const next = createGame({
    ruleConfig: loadStoredRuleConfig(),
    loop,
    resetPenaltyActive,
    unlockedItems: sourceProgress ? sourceProgress.unlockedItems : [],
    monsterDeck: sourceProgress ? sourceProgress.monsterDeck : DEFAULT_MONSTER_DECK,
  });
  exposeGameNamespace(next);
  return next;
}

let progress = loadProgress();
let selectedLoop = defaultLoop();
let gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
let codexTab = "monster";
let homeTab = "defense";
let settingsTab = "volume";
let homeMessage = "";
let homeRenderCacheKey = "";
let lastItemOfferKey = "";
let lastShopOfferKey = "";
let lastItemBarKey = "";
let itemPress = null;
let activeItemPopupId = null;
let activeScene = null;
let bgmSound = null;
let audioSaveTimer = null;
let lastCoreHitSoundAt = 0;

const MONSTER_CODEX_ORDER = Object.keys(gameApi.KINDS);
const HERO_CODEX_ORDER = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "xTerminator", "priest", "saint", "mage", "supermage", "sage"];
const ITEM_CODEX_ORDER = PIXEL_ITEMS;
const SOIL_TINTS = [0x315a4d, 0x376a5d, 0x3f7a70, 0x4a8a82, 0x5a9b94, 0x70ada8, 0x91c4be];
const TAP_MOVE_CANCEL = 10;
const TAP_MAX_MS = 450;
const ITEM_LONG_PRESS_MS = 520;
const AUDIO_ASSET_VERSION = "v2-core-hit";
const AUDIO_DB_NAME = "makaiDefense.audio.v1";
const AUDIO_STORE_NAME = "settings";
const AUDIO_SETTINGS_KEY = "volume";
const AUDIO_DEFAULTS = Object.freeze({ master: 0.8, bgm: 0.45, se: 0.75, voice: 0.85 });
const AUDIO_KEYS = {
  bgm: "bgmDungeon",
  dig: "digSe",
  button: "buttonSe",
  coreHit: "coreHitSe",
  heroDeaths: ["heroDeath1", "heroDeath2", "heroDeath3"],
};
let audioSettings = { ...AUDIO_DEFAULTS };

function selectableMaxLoop() {
  return Math.max(1, Math.min(MAX_LOOP, (progress.highestClearedLoop || 0) + 1));
}

function defaultLoop() {
  return selectableMaxLoop();
}

function resolveInterruptedRunOnBoot(raw) {
  if (!raw.activeRun) return raw;
  const next = { ...raw, activeRun: null };
  if ((raw.activeRun.loop || 0) >= 10) next.resetPenaltyActive = true;
  saveProgress(next);
  return next;
}

function audioAssetUrl(name) {
  return `assets/audio/${name}?v=${AUDIO_ASSET_VERSION}`;
}

function tileKey(tile) {
  if (tile.t === "earth" && tile.sub) {
    const stage = evoStage(tile);
    return `${tile.sub}${stage >= 2 ? "_evo2" : (stage >= 1 ? "_evo" : "")}`;
  }
  if (["earth", "tunnel", "bedrock", "surface", "core"].includes(tile.t)) return tile.t;
  return "tunnel";
}

function evoStage(tile) {
  const raw = tile.evoStage === undefined ? (tile.evo ? 1 : 0) : tile.evoStage;
  return Math.max(0, Math.min(2, Math.floor(raw || 0)));
}

function soilStage(tile) {
  return Math.max(0, Math.min(7, Math.floor((tile && tile.soilMana) || 0)));
}

function actorFrame(e, scene) {
  if (e.actionTime > 0) return Math.floor((1 - e.actionTime / (e.actionMax || gameApi.ATK_ANIM)) * PIXEL_FRAMES) % PIXEL_FRAMES;
  if (e.moveAnim > 0) return Math.floor(scene.time.now / 100 + e.id) % PIXEL_FRAMES;
  return Math.floor(scene.time.now / 260 + e.id) % PIXEL_FRAMES;
}

function effectFrameIndex(type, life, max) {
  const row = PIXEL_EFFECTS.indexOf(type);
  if (row < 0) return 0;
  const frame = Math.max(0, Math.min(PIXEL_FRAMES - 1, Math.floor((1 - life / max) * PIXEL_FRAMES)));
  return row * PIXEL_FRAMES + frame;
}

function tintFromColor(color) {
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) return null;
  return Number.parseInt(color.slice(1), 16);
}

function effectLevel(type) {
  let level = 0;
  for (const f of gameApi.effects) {
    if (f.type !== type || !f.max) continue;
    level = Math.max(level, Math.max(0, Math.min(1, f.life / f.max)));
  }
  return level;
}

function clampVolume(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeAudioSettings(value) {
  const out = { ...AUDIO_DEFAULTS };
  if (value && typeof value === "object") {
    for (const key of Object.keys(out)) out[key] = clampVolume(value[key] ?? out[key]);
  }
  return out;
}

function effectiveVolume(channel) {
  return clampVolume(audioSettings.master) * clampVolume(audioSettings[channel]);
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) db.createObjectStore(AUDIO_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadAudioSettings() {
  try {
    const db = await openAudioDb();
    if (!db) return { ...AUDIO_DEFAULTS };
    return await new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE_NAME, "readonly");
      const request = tx.objectStore(AUDIO_STORE_NAME).get(AUDIO_SETTINGS_KEY);
      request.onsuccess = () => resolve(normalizeAudioSettings(request.result));
      request.onerror = () => resolve({ ...AUDIO_DEFAULTS });
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    });
  } catch {
    return { ...AUDIO_DEFAULTS };
  }
}

async function saveAudioSettingsNow() {
  try {
    const db = await openAudioDb();
    if (!db) return false;
    return await new Promise((resolve) => {
      const tx = db.transaction(AUDIO_STORE_NAME, "readwrite");
      tx.objectStore(AUDIO_STORE_NAME).put(normalizeAudioSettings(audioSettings), AUDIO_SETTINGS_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

function scheduleAudioSettingsSave() {
  clearTimeout(audioSaveTimer);
  audioSaveTimer = setTimeout(saveAudioSettingsNow, 180);
}

function unlockAudio() {
  const context = activeScene && activeScene.sound && activeScene.sound.context;
  if (context && context.state === "suspended" && typeof context.resume === "function") {
    context.resume().catch(() => {});
  }
}

function playAudio(key, channel, extra = {}) {
  if (!activeScene || !activeScene.sound || !key) return;
  unlockAudio();
  try {
    activeScene.sound.play(key, { volume: effectiveVolume(channel), ...extra });
  } catch {
    // 音声再生はブラウザの自動再生制限に左右されるため、失敗してもゲームは止めない。
  }
}

function playButtonSound() {
  playAudio(AUDIO_KEYS.button, "se");
}

function playDigSound() {
  playAudio(AUDIO_KEYS.dig, "se");
}

function playCoreHitSound() {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastCoreHitSoundAt < 120) return;
  lastCoreHitSoundAt = now;
  playAudio(AUDIO_KEYS.coreHit, "se");
}

function playHeroDeathVoice() {
  const keys = AUDIO_KEYS.heroDeaths;
  const key = keys[Math.floor(Math.random() * keys.length) % keys.length];
  playAudio(key, "voice");
}

function syncAudioState(forceStart = false) {
  if (!activeScene || !activeScene.sound) return;
  const shouldPlay = gameApi.gameState === "playing" || gameApi.gameState === "dialogue" || gameApi.gameState === "itemChoice" || gameApi.gameState === "shop" || gameApi.gameState === "trap" || gameApi.gameState === "debuffNotice";
  if (!shouldPlay) {
    if (bgmSound && bgmSound.isPlaying) bgmSound.stop();
    return;
  }
  try {
    if (!bgmSound) bgmSound = activeScene.sound.add(AUDIO_KEYS.bgm, { loop: true, volume: effectiveVolume("bgm") });
    if (typeof bgmSound.setVolume === "function") bgmSound.setVolume(effectiveVolume("bgm"));
    if ((forceStart || !bgmSound.isPlaying) && !bgmSound.isPaused) {
      unlockAudio();
      bgmSound.play();
    }
  } catch {
    bgmSound = null;
  }
}

function renderAudioControls() {
  for (const key of Object.keys(AUDIO_DEFAULTS)) {
    const input = document.querySelector(`[data-audio-volume="${key}"]`);
    const label = document.getElementById(`${key}VolumeValue`);
    const value = Math.round(clampVolume(audioSettings[key]) * 100);
    if (input && Number(input.value) !== value) input.value = String(value);
    if (label) label.textContent = `${value}%`;
  }
}

function applyAudioInput(input) {
  if (!input) return;
  audioSettings = normalizeAudioSettings({ ...audioSettings, [input.dataset.audioVolume]: Number(input.value) / 100 });
  renderAudioControls();
  syncAudioState();
  scheduleAudioSettingsSave();
}

function bindAudioPanel() {
  renderAudioControls();
  loadAudioSettings().then((settings) => {
    audioSettings = settings;
    renderAudioControls();
    syncAudioState();
  });
}

function handleGameEvents(events) {
  for (const event of events) {
    if (event.type === "coreHit") playCoreHitSound();
    if (event.type === "heroKilled") playHeroDeathVoice();
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.tileSprites = [];
    this.veinSprites = [];
    this.actorSprites = [];
    this.effectSprites = [];
    this.soilGraphics = null;
    this.crackGraphics = null;
    this.flameGraphics = null;
    this.pressStart = null;
  }

  preload() {
    this.load.spritesheet("tiles", pixelAssetUrl("tiles.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("actors", pixelAssetUrl("actors.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("effects", pixelAssetUrl("effects.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("items", pixelAssetUrl("items.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("debuffs", pixelAssetUrl("debuffs.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.audio(AUDIO_KEYS.bgm, audioAssetUrl("bgm_dungeon_loop.wav"));
    this.load.audio(AUDIO_KEYS.dig, audioAssetUrl("dig.wav"));
    this.load.audio(AUDIO_KEYS.button, audioAssetUrl("button.wav"));
    this.load.audio(AUDIO_KEYS.coreHit, audioAssetUrl("core_hit.wav"));
    this.load.audio(AUDIO_KEYS.heroDeaths[0], audioAssetUrl("hero_death_1.wav"));
    this.load.audio(AUDIO_KEYS.heroDeaths[1], audioAssetUrl("hero_death_2.wav"));
    this.load.audio(AUDIO_KEYS.heroDeaths[2], audioAssetUrl("hero_death_3.wav"));
  }

  create() {
    activeScene = this;
    this.cameras.main.setBackgroundColor("#120c1a");
    this.input.on("pointerdown", (pointer) => {
      this.pressStart = {
        x: pointer.x,
        y: pointer.y,
        time: this.time.now,
        moved: false,
      };
    });
    this.input.on("pointermove", (pointer) => {
      if (!this.pressStart) return;
      if (Math.hypot(pointer.x - this.pressStart.x, pointer.y - this.pressStart.y) > TAP_MOVE_CANCEL) this.pressStart.moved = true;
    });
    this.input.on("pointerup", (pointer) => {
      if (!this.pressStart) return;
      const start = this.pressStart;
      this.pressStart = null;
      const elapsed = this.time.now - start.time;
      const moved = start.moved || Math.hypot(pointer.x - start.x, pointer.y - start.y) > TAP_MOVE_CANCEL;
      if (gameApi.gameState !== "playing" || moved || elapsed > TAP_MAX_MS) return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      if (gameApi.tryDig(col, row)) playDigSound();
      syncProgressEvents();
      updateHud();
    });
    this.input.on("pointercancel", () => {
      this.pressStart = null;
    });
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sprite = this.add.image(c * TILE + TILE / 2, r * TILE + TILE / 2, "tiles", 0);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(0);
        this.tileSprites.push(sprite);
        const vein = this.add.image(c * TILE + TILE / 2, r * TILE + TILE / 2, "tiles", 0);
        vein.setOrigin(0.5, 0.5);
        vein.setDepth(10);
        vein.setVisible(false);
        this.veinSprites.push(vein);
      }
    }
    this.soilGraphics = this.add.graphics();
    this.soilGraphics.setDepth(15);
    this.crackGraphics = this.add.graphics();
    this.crackGraphics.setDepth(80);
    this.flameGraphics = this.add.graphics();
    this.flameGraphics.setDepth(490);
    syncAudioState();
  }

  update(_time, delta) {
    gameApi.update(Math.min(delta, 60));
    syncProgressEvents();
    this.syncTiles();
    this.syncCracks();
    this.syncActors();
    this.syncEffects();
    updateHud();
  }

  syncTiles() {
    if (this.soilGraphics) this.soilGraphics.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = gameApi.grid[r][c];
        const sprite = this.tileSprites[r * COLS + c];
        const overlay = this.veinSprites[r * COLS + c];
        const baseKey = tile.t === "earth" && tile.sub ? "earth" : tileKey(tile);
        const idx = PIXEL_TILES.indexOf(baseKey);
        sprite.setFrame(idx >= 0 ? idx : 1);
        sprite.setAlpha(1);
        sprite.clearTint();
        if (tile.t === "core" && gameApi.coreHP > 0 && gameApi.gameState === "playing") {
          const hit = Math.max(effectLevel("corehit"), effectLevel("coreShock"));
          if (hit > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 40);
            sprite.setTint(pulse > 0.35 ? 0xff4a5f : 0xffcf4d);
            sprite.setAlpha(0.72 + hit * 0.28);
          }
        }
        if (tile.t === "earth" && tile.sub) {
          const veinIdx = PIXEL_TILES.indexOf(tileKey(tile));
          const fade = Math.max(0, Math.min(1, ((tile.age || 0) - gameApi.VEIN_FADE_START) / (gameApi.VEIN_DECAY_TIME - gameApi.VEIN_FADE_START)));
          overlay.setVisible(true);
          overlay.setFrame(veinIdx >= 0 ? veinIdx : idx);
          overlay.setAlpha(1 - fade * 0.72);
          if (fade > 0) overlay.setTint(0xf1d9c4);
          else overlay.clearTint();
        } else {
          overlay.setVisible(false);
          overlay.setAlpha(1);
          overlay.clearTint();
        }
        this.drawSoilMana(c, r, tile);
        this.drawEntryZone(c, r);
        this.drawInitialDigHint(c, r);
      }
    }
  }

  drawInitialDigHint(col, row) {
    if (!this.soilGraphics || gameApi.playerDigCount > 0 || gameApi.gameState !== "playing" || !gameApi.isDiggable(col, row)) return;
    const x = col * TILE;
    const y = row * TILE;
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 360 + col * 0.7 + row * 0.35);
    this.soilGraphics.fillStyle(0x9fe8d8, 0.055 + pulse * 0.035);
    this.soilGraphics.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    this.soilGraphics.lineStyle(1, 0xbff7ea, 0.30 + pulse * 0.16);
    this.soilGraphics.strokeRect(x + 8, y + 8, TILE - 16, TILE - 16);
    this.soilGraphics.fillStyle(0xffcf4d, 0.32 + pulse * 0.18);
    for (const [sx, sy] of [[10, 10], [TILE - 10, 10], [10, TILE - 10], [TILE - 10, TILE - 10]]) {
      this.soilGraphics.fillRect(x + sx - 2, y + sy, 5, 1);
      this.soilGraphics.fillRect(x + sx, y + sy - 2, 1, 5);
    }
    this.soilGraphics.lineStyle(2, 0xeafcf5, 0.45 + pulse * 0.22);
    this.soilGraphics.lineBetween(x + TILE - 17, y + TILE - 12, x + TILE - 9, y + TILE - 20);
    this.soilGraphics.lineStyle(2, 0xffcf4d, 0.42 + pulse * 0.18);
    this.soilGraphics.lineBetween(x + TILE - 22, y + TILE - 23, x + TILE - 12, y + TILE - 13);
  }

  drawEntryZone(col, row) {
    if (!this.soilGraphics || !gameApi.isHeroEntryZone(col, row)) return;
    const x = col * TILE;
    const y = row * TILE;
    this.soilGraphics.fillStyle(0x3f7a70, 0.18);
    this.soilGraphics.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    this.soilGraphics.lineStyle(1, 0xffcf4d, 0.30);
    this.soilGraphics.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
    this.soilGraphics.fillStyle(0xbff7ea, 0.20);
    this.soilGraphics.fillRect(x + 12, y + 10, TILE - 24, 2);
    this.soilGraphics.fillRect(x + 12, y + TILE - 12, TILE - 24, 2);
  }

  drawSoilMana(col, row, tile) {
    if (!this.soilGraphics || tile.t !== "earth") return;
    const stage = soilStage(tile);
    const x = col * TILE;
    const y = row * TILE;
    const hint = gameApi.itemHighlights && gameApi.itemHighlights().find((cell) => cell.col === col && cell.row === row);
    if (hint) {
      const tint = tintFromColor(gameApi.VEIN[hint.type] && gameApi.VEIN[hint.type].color) || 0xffcf4d;
      const pulse = 0.45 + 0.55 * Math.sin(this.time.now / 280 + col + row);
      this.soilGraphics.lineStyle(2, tint, 0.22 + pulse * 0.18);
      this.soilGraphics.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
      this.soilGraphics.fillStyle(tint, 0.05 + pulse * 0.04);
      this.soilGraphics.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
    }
    if (stage > 0) {
      const tint = SOIL_TINTS[stage - 1] || SOIL_TINTS[SOIL_TINTS.length - 1];
      this.soilGraphics.fillStyle(tint, 0.03 + stage * 0.016);
      this.soilGraphics.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      const sparkCount = Math.min(4, Math.ceil(stage / 2));
      for (let i = 0; i < sparkCount; i++) {
        const sx = x + 9 + ((col * 17 + row * 7 + i * 13) % 30);
        const sy = y + 9 + ((col * 5 + row * 19 + i * 11) % 28);
        const size = stage >= 6 && i === 0 ? 2 : 1;
        this.soilGraphics.fillStyle(0xbffff0, 0.12 + stage * 0.025);
        this.soilGraphics.fillRect(sx - size, sy, size * 2 + 1, 1);
        this.soilGraphics.fillRect(sx, sy - size, 1, size * 2 + 1);
      }
    }
    if (tile.sub && evoStage(tile) >= 2) {
      this.soilGraphics.lineStyle(2, 0xffcf4d, 0.38);
      this.soilGraphics.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
      this.soilGraphics.lineStyle(1, 0xfff1a6, 0.24);
      this.soilGraphics.strokeRect(x + 7, y + 7, TILE - 14, TILE - 14);
      for (const [sx, sy] of [[10, 8], [38, 12], [36, 38], [12, 36]]) {
        this.soilGraphics.fillStyle(0xffcf4d, 0.44);
        this.soilGraphics.fillRect(x + sx - 1, y + sy, 3, 1);
        this.soilGraphics.fillRect(x + sx, y + sy - 1, 1, 3);
      }
    }
  }

  syncCracks() {
    if (!this.crackGraphics) return;
    this.crackGraphics.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = gameApi.grid[r][c];
        if (tile.t !== "earth" || !tile.dig) continue;
        this.drawDigCracks(c, r, Math.max(0, Math.min(1, tile.dig / gameApi.DIG_BREAK)), !!tile.sub);
      }
    }
  }

  drawDigCracks(col, row, progress, isVein) {
    const g = this.crackGraphics;
    const x = col * TILE;
    const y = row * TILE;
    const dark = isVein ? 0x07040a : 0x120911;
    const glow = isVein ? 0xffd36f : 0x6e5b49;
    const alpha = 0.4 + progress * 0.55;
    const segments = [
      { t: 0.05, p: [[15, 11], [23, 21], [32, 18]] },
      { t: 0.28, p: [[24, 21], [21, 31], [13, 38]] },
      { t: 0.46, p: [[25, 22], [35, 31], [39, 40]] },
      { t: 0.64, p: [[18, 26], [10, 25], [6, 31]] },
      { t: 0.82, p: [[29, 15], [36, 10], [43, 12]] },
    ];
    for (const seg of segments) {
      if (progress < seg.t) continue;
      const width = progress > 0.75 ? 3 : 2;
      g.lineStyle(width, dark, alpha);
      g.beginPath();
      g.moveTo(x + seg.p[0][0], y + seg.p[0][1]);
      for (let i = 1; i < seg.p.length; i++) g.lineTo(x + seg.p[i][0], y + seg.p[i][1]);
      g.strokePath();
      g.lineStyle(1, glow, isVein ? 0.25 + progress * 0.35 : 0.18);
      g.beginPath();
      g.moveTo(x + seg.p[0][0] + 1, y + seg.p[0][1]);
      for (let i = 1; i < seg.p.length; i++) g.lineTo(x + seg.p[i][0] + 1, y + seg.p[i][1]);
      g.strokePath();
    }
  }

  syncActors() {
    const entries = [];
    for (const e of gameApi.eggs) entries.push({ z: e.row - 0.2, egg: true, e });
    for (const e of gameApi.monsters) entries.push({ z: e.row, hero: false, e });
    for (const e of gameApi.heroes) entries.push({ z: e.row + 0.5, hero: true, e });
    entries.sort((a, b) => a.z - b.z);

    while (this.actorSprites.length < entries.length) {
      const sprite = this.add.image(0, 0, "actors", 0);
      sprite.setOrigin(0.5, 0.75);
      this.actorSprites.push(sprite);
    }
    for (let i = 0; i < this.actorSprites.length; i++) {
      const sprite = this.actorSprites[i];
      const entry = entries[i];
      if (!entry) {
        sprite.setVisible(false);
        continue;
      }
      const e = entry.e;
      const name = entry.egg ? `egg_${e.kind}` : (entry.hero ? e.cls : e.kind);
      const action = entry.egg ? "idle" : gameApi.actorAction(e);
      const dir = entry.egg ? "s" : (e.faceDir || "s");
      const frame = entry.egg ? Math.floor(this.time.now / 220 + e.col) % PIXEL_FRAMES : actorFrame(e, this);
      const pose = entry.egg ? { x: 0, y: 0, scale: 1, rot: 0 } : gameApi.actorPose(e);
      const bornScale = e.bornAnim > 0 ? 0.4 + 0.6 * Math.max(0, Math.min(1, 1 - e.bornAnim / gameApi.BORN_ANIM)) : 1;
      sprite.setVisible(true);
      sprite.setFrame(pixelActorFrameIndex(name, action, dir, frame));
      sprite.setPosition((e.px ?? gameApi.cx(e.col)) + pose.x, (e.py ?? gameApi.cy(e.row)) + pose.y + (entry.egg ? 8 : 0));
      sprite.setScale(bornScale * pose.scale);
      sprite.setRotation(pose.rot || 0);
      sprite.setOrigin(0.5, entry.hero || entry.egg ? 0.75 : 0.5);
      sprite.setDepth(100 + i);
    }
  }

  syncEffects() {
    this.drawFlameLines();
    const drawable = gameApi.effects.filter((f) => PIXEL_EFFECTS.includes(f.type));
    while (this.effectSprites.length < drawable.length) {
      const sprite = this.add.image(0, 0, "effects", 0);
      sprite.setOrigin(0.5, 0.5);
      this.effectSprites.push(sprite);
    }
    for (let i = 0; i < this.effectSprites.length; i++) {
      const sprite = this.effectSprites[i];
      const f = drawable[i];
      if (!f) {
        sprite.setVisible(false);
        continue;
      }
      let x = f.x;
      let y = f.y;
      if (f.type === "shot" || f.type === "bite") {
        const p = 1 - f.life / f.max;
        x = f.sx + (f.tx - f.sx) * p;
        y = f.sy + (f.ty - f.sy) * p;
        sprite.setRotation(Math.atan2(f.ty - f.sy, f.tx - f.sx));
      } else {
        sprite.setRotation(f.rot || 0);
      }
      sprite.setVisible(true);
      sprite.setFrame(effectFrameIndex(f.type, f.life, f.max));
      sprite.setPosition(x, y);
      sprite.setAlpha(Math.max(0, Math.min(1, f.life / f.max * 1.4)));
      const tint = tintFromColor(f.color);
      if (tint === null) sprite.clearTint();
      else sprite.setTint(tint);
      sprite.setDepth(500 + i);
    }
  }

  drawFlameLines() {
    if (!this.flameGraphics) return;
    this.flameGraphics.clear();
    for (const f of gameApi.slowFields || []) {
      const alpha = Math.max(0, Math.min(1, f.life / f.max));
      const x = gameApi.cx(f.col);
      const y = gameApi.cy(f.row);
      const color = tintFromColor(f.color) || 0x5a6dff;
      this.flameGraphics.fillStyle(color, 0.08 + alpha * 0.10);
      this.flameGraphics.fillRect(x - TILE / 2 + 6, y - TILE / 2 + 6, TILE - 12, TILE - 12);
      this.flameGraphics.lineStyle(1, color, 0.20 + alpha * 0.20);
      this.flameGraphics.strokeRect(x - TILE / 2 + 9, y - TILE / 2 + 9, TILE - 18, TILE - 18);
    }
    for (const p of gameApi.pickups) {
      const alpha = Math.max(0, Math.min(1, p.life / p.max));
      const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 120);
      this.flameGraphics.fillStyle(0x9effa0, 0.18 + pulse * 0.12);
      this.flameGraphics.fillCircle(p.x, p.y - 8, 10 + pulse * 3);
      this.flameGraphics.lineStyle(2, 0xeaffd8, 0.45 * alpha);
      this.flameGraphics.strokeRect(p.x - 5, p.y - 14, 10, 8);
    }
    for (const f of gameApi.effects) {
      const alpha = Math.max(0, Math.min(1, f.life / f.max));
      const color = tintFromColor(f.color) || 0xff8a3a;
      if (f.type === "healArea") {
        const p = 1 - alpha;
        this.flameGraphics.lineStyle(2, color, 0.34 * alpha);
        this.flameGraphics.strokeCircle(f.x, f.y, (f.radius || TILE * 2) * (0.72 + p * 0.28));
        this.flameGraphics.lineStyle(1, 0xffffff, 0.18 * alpha);
        this.flameGraphics.strokeCircle(f.x, f.y, (f.radius || TILE * 2) * (0.42 + p * 0.18));
        continue;
      }
      if (f.type === "coreShock") {
        const p = 1 - alpha;
        this.flameGraphics.lineStyle(5, color, 0.42 * alpha);
        this.flameGraphics.strokeCircle(f.x, f.y, 12 + p * 74);
        this.flameGraphics.fillStyle(color, 0.10 * alpha);
        this.flameGraphics.fillCircle(f.x, f.y, 10 + p * 34);
        continue;
      }
      if (f.type !== "flameLine") continue;
      const p = 1 - alpha;
      for (let i = 0; i < (f.cells || []).length; i++) {
        const cell = f.cells[i];
        const x = gameApi.cx(cell.col) + Math.sin(this.time.now / 80 + i * 1.7) * 3;
        const y = gameApi.cy(cell.row) + Math.cos(this.time.now / 95 + i) * 2;
        const r = 18 - p * 5 + (i % 2) * 2;
        this.flameGraphics.fillStyle(color, 0.22 * alpha);
        this.flameGraphics.fillCircle(x, y + 6, r);
        this.flameGraphics.fillStyle(0xfff1a6, 0.46 * alpha);
        this.flameGraphics.fillTriangle(x - 11, y + 10, x + 11, y + 9, x + Math.sin(this.time.now / 70 + i) * 4, y - 17 - p * 6);
        this.flameGraphics.fillStyle(0xff5a28, 0.30 * alpha);
        this.flameGraphics.fillTriangle(x - 15, y + 12, x + 4, y + 13, x - 2, y - 12);
        this.flameGraphics.fillStyle(0xffcf4d, 0.18 * alpha);
        this.flameGraphics.fillCircle(x + 9, y - 3, 5 + Math.sin(this.time.now / 60 + i) * 2);
      }
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function progressSets() {
  return {
    monsters: new Set(progress.discoveredMonsters),
    heroes: new Set(progress.discoveredHeroes),
    items: new Set(progress.discoveredItems),
  };
}

function unlockedFamilySet() {
  const ids = new Set(progress.unlockedMonsterFamilies || []);
  for (const id in MONSTER_FAMILIES) if (MONSTER_FAMILIES[id].default) ids.add(id);
  return ids;
}

function normalizeProgressDeck() {
  progress = { ...progress, monsterDeck: resolveMonsterDeck(progress.monsterDeck) };
}

function saveProgressAndRefresh(message = "") {
  normalizeProgressDeck();
  saveProgress(progress);
  homeMessage = message;
  homeRenderCacheKey = "";
  updateProgressStatus();
  renderHome();
}

function canAffordUnlock(row) {
  return progress.coins >= (row.price || 0);
}

function clearGateMet(row) {
  return (progress.highestClearedLoop || 0) >= (row.unlockClears || 0);
}

function buyMonsterFamily(id) {
  const row = MONSTER_FAMILIES[id];
  if (!row || row.default || unlockedFamilySet().has(id)) return false;
  if (!clearGateMet(row)) {
    homeMessage = `${row.name}は${row.unlockClears}周クリアで解放候補になる`;
    renderHome();
    return false;
  }
  if (!canAffordUnlock(row)) {
    homeMessage = "コインが足りない";
    renderHome();
    return false;
  }
  progress = {
    ...progress,
    coins: progress.coins - row.price,
    unlockedMonsterFamilies: [...new Set([...(progress.unlockedMonsterFamilies || []), id])],
  };
  saveProgressAndRefresh(`${row.name}を解放した`);
  return true;
}

function buyUnlockItem(id) {
  const row = ITEM_UNLOCKS[id];
  const item = gameApi.ITEMS[id];
  if (!row || !item || (progress.unlockedItems || []).includes(id)) return false;
  if (!clearGateMet(row)) {
    homeMessage = `${item.name}は${row.unlockClears}周クリアで解放候補になる`;
    renderHome();
    return false;
  }
  if (!canAffordUnlock(row)) {
    homeMessage = "コインが足りない";
    renderHome();
    return false;
  }
  progress = {
    ...progress,
    coins: progress.coins - row.price,
    unlockedItems: [...new Set([...(progress.unlockedItems || []), id])],
  };
  saveProgressAndRefresh(`${item.name}を解放した`);
  return true;
}

function selectMonsterFamily(id) {
  const row = MONSTER_FAMILIES[id];
  if (!row || !unlockedFamilySet().has(id)) return false;
  const deck = resolveMonsterDeck(progress.monsterDeck);
  deck[row.vein] = id;
  progress = { ...progress, monsterDeck: deck };
  saveProgressAndRefresh(`${row.name}をデッキに入れた`);
  gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
  gameApi.gameState = "title";
  return true;
}

function loopOptionsHtml() {
  const max = selectableMaxLoop();
  return Array.from({ length: max }, (_, i) => {
    const loop = i + 1;
    return `<option value="${loop}"${loop === selectedLoop ? " selected" : ""}>${loop}周目</option>`;
  }).join("");
}

function familySpriteHtml(id) {
  const row = MONSTER_FAMILIES[id];
  const kind = row && row.kinds[0];
  return kind ? `<span class="home-monster-sprite" style='${codexSpriteStyle(kind)}'></span>` : "";
}

function familyStagesText(id) {
  const row = MONSTER_FAMILIES[id];
  if (!row) return "";
  return row.kinds.map((kind) => (gameApi.KINDS[kind] && gameApi.KINDS[kind].name) || kind).join(" / ");
}

function familyCard(id, mode = "deck") {
  const row = MONSTER_FAMILIES[id];
  if (!row) return "";
  const deck = resolveMonsterDeck(progress.monsterDeck);
  const unlocked = unlockedFamilySet().has(id);
  const selected = deck[row.vein] === id;
  const locked = !unlocked;
  const canBuy = !row.default && !unlocked && clearGateMet(row) && canAffordUnlock(row);
  const gate = row.unlockClears ? `${row.unlockClears}周クリア` : "初期候補";
  const action = mode === "unlock"
    ? (unlocked || row.default ? "解放済み" : `解放 ${row.price}`)
    : (selected ? "選択中" : "入れる");
  const attr = mode === "unlock" ? `data-buy-family="${escapeHtml(id)}"` : `data-select-family="${escapeHtml(id)}"`;
  const disabled = mode === "unlock" ? (!canBuy) : (locked || selected);
  const classes = ["home-card", selected ? "selected" : "", locked ? "locked" : ""].filter(Boolean).join(" ");
  return `
    <article class="${classes}">
      ${familySpriteHtml(id)}
      <span class="home-card-body">
        <b>${escapeHtml(row.name)}</b>
        <em>${escapeHtml(familyStagesText(id))}</em>
        <small>${escapeHtml(mode === "unlock" ? `${row.trait} / ${gate}` : row.trait)}</small>
      </span>
      <button type="button" ${attr}${disabled ? " disabled" : ""}>${escapeHtml(action)}</button>
    </article>`;
}

function renderDeckHome() {
  const veins = ["moss", "meat", "venom", "stone", "ember"];
  const unlocked = unlockedFamilySet();
  return veins.map((vein) => {
    const veinName = (gameApi.VEIN[vein] && gameApi.VEIN[vein].legend.split("→")[0]) || vein;
    const cards = Object.keys(MONSTER_FAMILIES)
      .filter((id) => MONSTER_FAMILIES[id].vein === vein)
      .filter((id) => unlocked.has(id))
      .map((id) => familyCard(id, "deck"))
      .join("");
    return `<section class="home-group"><h3>${escapeHtml(veinName)}</h3><div class="home-card-list">${cards}</div></section>`;
  }).join("");
}

function unlockStatus(row, unlocked) {
  if (unlocked) return "解放済み";
  if (!clearGateMet(row)) return row.unlockClears ? `${row.unlockClears}周` : "未解放";
  if (!canAffordUnlock(row)) return "コイン不足";
  return "未解放";
}

function codexMonsterFamilyCard(id) {
  const row = MONSTER_FAMILIES[id];
  if (!row) return "";
  const deck = resolveMonsterDeck(progress.monsterDeck);
  const unlocked = unlockedFamilySet().has(id);
  const selected = deck[row.vein] === id;
  const canBuy = !row.default && !unlocked && clearGateMet(row) && canAffordUnlock(row);
  const status = row.default ? "初期" : unlockStatus(row, unlocked);
  const classes = ["codex-card", "codex-unlock-card", unlocked ? "" : "locked", selected ? "selected" : ""].filter(Boolean).join(" ");
  return `
    <article class="${classes}">
      <div class="codex-sprite-wrap">${familySpriteHtml(id)}</div>
      <div class="codex-body">
        <div class="codex-title"><strong>${escapeHtml(row.name)}</strong><em>${escapeHtml(status)}</em></div>
        <div class="codex-stats">
          ${statPill("系統", familyStagesText(id))}${statPill("価格", row.default ? "初期" : row.price)}
        </div>
        <p>${escapeHtml(row.trait)}</p>
      </div>
      <button type="button" data-buy-family="${escapeHtml(id)}"${canBuy ? "" : " disabled"}>${escapeHtml(unlocked || row.default ? "解放済み" : `解放 ${row.price}`)}</button>
    </article>`;
}

function codexItemCard(id) {
  const item = gameApi.ITEMS[id];
  const row = ITEM_UNLOCKS[id];
  const found = progressSets().items.has(id);
  const unlocked = !row || (progress.unlockedItems || []).includes(id);
  if (!row) return itemCard(id);
  const canBuy = !unlocked && clearGateMet(row) && canAffordUnlock(row);
  const status = unlockStatus(row, unlocked);
  return `
    <article class="codex-card codex-unlock-card ${unlocked ? "" : "locked"}">
      <div class="codex-sprite-wrap">${itemIconHtml(id, found || unlocked ? "codex-item-icon" : "codex-item-icon silhouette", 48)}</div>
      <div class="codex-body">
        <div class="codex-title"><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(status)}</em></div>
        <div class="codex-stats">
          ${statPill("格", itemRarityName(id))}${statPill("価格", row.price)}
        </div>
        <p>${escapeHtml(item.profile)}</p>
      </div>
      <button type="button" data-buy-item="${escapeHtml(id)}"${canBuy ? "" : " disabled"}>${escapeHtml(unlocked ? "解放済み" : `解放 ${row.price}`)}</button>
    </article>`;
}

function renderDefenseHome() {
  const max = selectableMaxLoop();
  const loop = max > 1
    ? `<label class="home-loop"><span>挑戦する周回</span><select id="homeLoopSelect" aria-label="挑戦する周回">${loopOptionsHtml()}</select></label>`
    : "";
  return `
    ${loop}
    <div class="home-defense-stats">
      <span>最高到達 W${escapeHtml(progress.highestWave)}</span>
    </div>`;
}

function renderCodexHome() {
  return `
    <section class="codex home-codex" aria-label="図鑑">
      <div class="codex-tabs" role="tablist" aria-label="図鑑切替">
        <button class="codex-tab active" data-codex-tab="monster" role="tab" aria-selected="true">モンスター</button>
        <button class="codex-tab" data-codex-tab="hero" role="tab" aria-selected="false">冒険者</button>
        <button class="codex-tab" data-codex-tab="item" role="tab" aria-selected="false">アイテム</button>
      </div>
      <div class="codex-grid" id="codexGrid"></div>
    </section>`;
}

function renderVolumeSettingsHome() {
  return `
    <section class="home-settings-panel">
      <div class="sound-fields" id="soundFields">
        <label><span><b>マスター</b><em id="masterVolumeValue">80%</em></span><input id="masterVolume" data-audio-volume="master" type="range" min="0" max="100" value="80" aria-label="マスター音量"></label>
        <label><span><b>BGM</b><em id="bgmVolumeValue">45%</em></span><input id="bgmVolume" data-audio-volume="bgm" type="range" min="0" max="100" value="45" aria-label="BGM音量"></label>
        <label><span><b>効果音</b><em id="seVolumeValue">75%</em></span><input id="seVolume" data-audio-volume="se" type="range" min="0" max="100" value="75" aria-label="効果音量"></label>
        <label><span><b>音声</b><em id="voiceVolumeValue">85%</em></span><input id="voiceVolume" data-audio-volume="voice" type="range" min="0" max="100" value="85" aria-label="音声音量"></label>
      </div>
    </section>`;
}

function renderDevSettingsHome() {
  return `
    <section class="home-settings-panel dev-panel">
      <div class="dev-actions">
        <span id="devStatus">変更は次回開始時に反映</span>
        <button type="button" id="exportDevJsonBtn">JSON出力</button>
        <button type="button" id="copyDevJsonBtn">コピー</button>
        <button type="button" id="resetDevBtn">初期化</button>
        <button type="button" id="resetProgressBtn">図鑑初期化</button>
      </div>
      <div class="progress-status" id="progressStatus">最高到達 W0 / 魔物 0 / 冒険者 0 / アイテム 0</div>
      <textarea id="devJsonOutput" class="dev-json-output" readonly spellcheck="false" aria-label="開発JSON"></textarea>
      <div class="dev-fields" id="devFields"></div>
    </section>`;
}

function renderSettingsHome() {
  return `
    <div class="settings-tabs" role="tablist" aria-label="設定切替">
      <button type="button" data-settings-tab="volume" class="${settingsTab === "volume" ? "active" : ""}">音量</button>
      <button type="button" data-settings-tab="dev" class="${settingsTab === "dev" ? "active" : ""}">開発</button>
    </div>
    ${settingsTab === "dev" ? renderDevSettingsHome() : renderVolumeSettingsHome()}`;
}

function homeRenderKey() {
  return JSON.stringify({
    state: gameApi.gameState,
    homeTab,
    settingsTab,
    codexTab,
    selectedLoop,
    maxLoop: selectableMaxLoop(),
    message: homeMessage,
    coins: progress.coins || 0,
    highestWave: progress.highestWave || 0,
    highestClearedLoop: progress.highestClearedLoop || 0,
    resetPenaltyActive: !!progress.resetPenaltyActive,
    deck: resolveMonsterDeck(progress.monsterDeck),
    families: [...(progress.unlockedMonsterFamilies || [])].sort(),
    items: [...(progress.unlockedItems || [])].sort(),
    monsters: [...(progress.discoveredMonsters || [])].sort(),
    heroes: [...(progress.discoveredHeroes || [])].sort(),
    discoveredItems: [...(progress.discoveredItems || [])].sort(),
  });
}

function renderHome(force = false) {
  const body = document.getElementById("homeBody");
  const coin = document.getElementById("homeCoinNum");
  const message = document.getElementById("homeMessage");
  const start = document.getElementById("startBtn");
  if (!body) return;
  if (coin) coin.textContent = String(progress.coins || 0);
  if (message) message.textContent = homeMessage || "";
  for (const btn of document.querySelectorAll("[data-home-tab]")) btn.classList.toggle("active", btn.dataset.homeTab === homeTab);
  if (start) start.classList.toggle("hidden", homeTab !== "defense");
  const key = homeRenderKey();
  if (!force && key === homeRenderCacheKey) return;
  homeRenderCacheKey = key;
  if (homeTab === "deck") {
    body.innerHTML = renderDeckHome();
  } else if (homeTab === "codex") {
    body.innerHTML = renderCodexHome();
    renderCodex();
  } else if (homeTab === "settings") {
    body.innerHTML = renderSettingsHome();
    if (settingsTab === "dev") {
      renderDevPanel();
      updateProgressStatus();
    } else {
      renderAudioControls();
    }
  } else {
    body.innerHTML = renderDefenseHome();
    renderLoopSelector();
  }
}

function renderLoopSelector() {
  const homeSelect = document.getElementById("homeLoopSelect");
  const max = selectableMaxLoop();
  const selectable = ["title", "dead", "clear"].includes(gameApi.gameState);
  if (selectable) selectedLoop = Math.max(1, Math.min(max, selectedLoop || defaultLoop()));
  else selectedLoop = gameApi.loop;
  if (!homeSelect) return;
  const current = String(selectedLoop);
  const options = loopOptionsHtml();
  homeSelect.innerHTML = options;
  homeSelect.value = current;
  homeSelect.disabled = !selectable;
}

function markRunInterrupted() {
  if (!progress.activeRun) return;
  const next = { ...progress, activeRun: null };
  if ((progress.activeRun.loop || 0) >= 10) next.resetPenaltyActive = true;
  progress = next;
  saveProgress(progress);
}

function markRunStarted(loop) {
  markRunInterrupted();
  progress = { ...progress, activeRun: { loop, startedAt: Date.now() } };
  saveProgress(progress);
}

function markRunEnded(kind, result = {}) {
  if (!progress.activeRun) return;
  const awarded = awardRunCoins(progress, { score: result.score || 0, loop: result.loop || gameApi.loop, cleared: !!result.cleared });
  const next = { ...awarded.progress, activeRun: null };
  if (kind === "earlyDead" && gameApi.loop >= 10) next.resetPenaltyActive = true;
  progress = next;
  saveProgress(progress);
  homeMessage = awarded.reward ? `コイン +${awarded.reward}` : "";
  renderLoopSelector();
}

function syncRunOutcome() {
  if (!progress.activeRun) return;
  if (gameApi.gameState === "dead") {
    markRunEnded(gameApi.wave <= 3 ? "earlyDead" : "dead", { score: gameApi.score, loop: gameApi.loop, cleared: false });
    updateProgressStatus();
  } else if (gameApi.gameState === "clear") {
    const result = applyProgressEvents(progress, [{ type: "loopCleared", loop: gameApi.loop, wave: gameApi.wave, score: gameApi.score }]);
    progress = result.progress;
    if (progress.lastCoinReward) homeMessage = `コイン +${progress.lastCoinReward}`;
    saveProgress(progress);
    renderLoopSelector();
    updateProgressStatus();
  }
}

function syncProgressEvents() {
  if (!gameApi.drainEvents) return;
  const events = gameApi.drainEvents();
  handleGameEvents(events);
  const result = applyProgressEvents(progress, events);
  if (!result.changed) return;
  progress = result.progress;
  if (events.some((event) => event.type === "loopCleared") && progress.lastCoinReward) homeMessage = `コイン +${progress.lastCoinReward}`;
  saveProgress(progress);
  updateProgressStatus();
  renderLoopSelector();
  if (homeTab === "codex") renderHome(true);
}

function legendHtml() {
  let html = "";
  for (const key of ["moss", "meat", "venom", "stone", "ember"]) {
    const v = gameApi.VEIN[key];
    const open = gameApi.unlocked.has(key);
    html += `<span class="${open ? "" : "locked"}"><i style="background:${v.color}"></i>${v.legend}${open ? "" : ` <em>W${v.unlock}</em>`}</span>`;
  }
  html += `<span><i style="background:var(--magic)"></i>迷宮コア</span>`;
  return html;
}

function roleLabel(role) {
  if (role === "fighter") return "前衛";
  if (role === "tank") return "盾役";
  if (role === "caster") return "遠距離";
  if (role === "healer") return "回復";
  return "特殊";
}

function monsterUnlockLabel(kind) {
  for (const key in gameApi.VEIN) {
    const v = gameApi.VEIN[key];
    if (v.kind === kind) return `W${v.unlock}`;
    if (v.evoKind === kind) return `進化W${v.unlock}`;
    if (v.finalKind === kind) return `二段進化W${v.unlock}`;
  }
  return "-";
}

function codexSpriteStyle(name) {
  const row = PIXEL_ACTORS.indexOf(name);
  const x = pixelActorX("idle", "s", 1);
  const y = Math.max(0, row) * TILE;
  return `background-image:url("${pixelAssetUrl("actors.png")}");background-position:-${x}px -${y}px;`;
}

function statPill(label, value) {
  return `<span><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function itemIconStyle(id, size = 24) {
  const frame = pixelItemFrameIndex(id);
  return [
    `background-image:url("${pixelAssetUrl("items.png")}")`,
    `background-size:${PIXEL_ITEMS.length * size}px ${size}px`,
    `background-position:-${frame * size}px 0`,
    `width:${size}px`,
    `height:${size}px`,
  ].join(";");
}

function itemIconHtml(id, className = "item-icon", size = 24) {
  return `<span class="${escapeHtml(className)}" aria-hidden="true" style='${itemIconStyle(id, size)}'></span>`;
}

function debuffIconStyle(id, size = 24) {
  const frame = pixelDebuffFrameIndex(id);
  return [
    `background-image:url("${pixelAssetUrl("debuffs.png")}")`,
    `background-size:${PIXEL_DEBUFFS.length * size}px ${size}px`,
    `background-position:-${frame * size}px 0`,
    `width:${size}px`,
    `height:${size}px`,
  ].join(";");
}

function debuffIconHtml(id, className = "debuff-icon", size = 24) {
  return `<span class="${escapeHtml(className)}" aria-hidden="true" style='${debuffIconStyle(id, size)}'></span>`;
}

function dialoguePortraitStyle(id, size = 48) {
  const frame = pixelDialoguePortraitFrameIndex(id);
  return [
    `background-image:url("${pixelAssetUrl("dialogue_portraits.png")}")`,
    `background-size:${PIXEL_DIALOGUE_PORTRAITS.length * size}px ${size}px`,
    `background-position:-${frame * size}px 0`,
  ].join(";");
}

function itemLabel(id) {
  const a = gameApi.ITEMS[id];
  if (!a) return id;
  return `${a.name}: ${a.profile}`;
}

function debuffLabel(id) {
  const d = gameApi.DEBUFF_ITEMS[id];
  if (!d) return id;
  return `${d.name}: ${d.profile}`;
}

function itemRarity(id) {
  const rarity = gameApi.itemRarity ? gameApi.itemRarity(id) : (gameApi.ITEMS[id] && gameApi.ITEMS[id].rarity) || "normal";
  return gameApi.ITEM_RARITIES[rarity] ? rarity : "normal";
}

function itemRarityName(id) {
  return gameApi.ITEM_RARITIES[itemRarity(id)].name;
}

function itemRarityBadgeHtml(id) {
  const rarity = itemRarity(id);
  return `<i class="item-rarity item-rarity-${escapeHtml(rarity)}">${escapeHtml(itemRarityName(id))}</i>`;
}

function monsterCard(kind) {
  const k = gameApi.KINDS[kind];
  const found = progressSets().monsters.has(kind);
  if (!found) {
    return `
      <article class="codex-card locked">
        <div class="codex-sprite-wrap"><div class="codex-sprite silhouette" style='${codexSpriteStyle(kind)}'></div></div>
        <div class="codex-body">
          <div class="codex-title"><strong>???</strong><em>未発見</em></div>
          <div class="codex-stats">
            ${statPill("HP", "???")}${statPill("攻", "???")}${statPill("射", "???")}${statPill("解禁", "???")}
          </div>
          <p>まだ記録がない。</p>
        </div>
      </article>`;
  }
  const name = k.name || kind;
  const type = ["reaper", "chimera"].includes(kind) ? "特殊モンスター" : (k.evoLevel >= 2 ? "第二進化モンスター" : (k.eliteOf ? "進化モンスター" : "通常モンスター"));
  return `
    <article class="codex-card">
      <div class="codex-sprite-wrap"><div class="codex-sprite" style='${codexSpriteStyle(kind)}'></div></div>
      <div class="codex-body">
        <div class="codex-title"><strong>${escapeHtml(name)}</strong><em>${escapeHtml(type)}</em></div>
        <div class="codex-stats">
          ${statPill("HP", k.hp)}${statPill("攻", k.atk)}${statPill("射", k.range)}${statPill("解禁", monsterUnlockLabel(kind))}
        </div>
        <p>${escapeHtml(k.profile)}</p>
      </div>
    </article>`;
}

function heroCard(cls) {
  const c = gameApi.HERO_CLASSES[cls];
  const found = progressSets().heroes.has(cls);
  if (!found) {
    return `
      <article class="codex-card locked">
        <div class="codex-sprite-wrap"><div class="codex-sprite silhouette" style='${codexSpriteStyle(cls)}'></div></div>
        <div class="codex-body">
          <div class="codex-title"><strong>???</strong><em>未発見</em></div>
          <div class="codex-stats">
            ${statPill("HP", "???")}${statPill("攻", "???")}${statPill("射", "???")}${statPill("解禁", "???")}
          </div>
          <p>まだ記録がない。</p>
        </div>
      </article>`;
  }
  const stats = gameApi.resolveHeroStats(cls, Math.max(c.unlock, 1));
  return `
    <article class="codex-card">
      <div class="codex-sprite-wrap"><div class="codex-sprite" style='${codexSpriteStyle(cls)}'></div></div>
      <div class="codex-body">
        <div class="codex-title"><strong>${escapeHtml(c.name)}</strong><em>${escapeHtml(roleLabel(c.role))}</em></div>
        <div class="codex-stats">
          ${statPill("HP", stats.hp)}${statPill("攻", stats.atk)}${statPill("射", c.range)}${statPill("解禁", `W${c.unlock}`)}
        </div>
        <p>${escapeHtml(c.profile)}</p>
      </div>
    </article>`;
}

function itemCard(id) {
  const a = gameApi.ITEMS[id];
  const found = progressSets().items.has(id);
  if (!found) {
    return `
      <article class="codex-card locked">
        <div class="codex-sprite-wrap">${itemIconHtml(id, "codex-item-icon silhouette", 48)}</div>
        <div class="codex-body">
          <div class="codex-title"><strong>???</strong><em>未発見</em></div>
          <div class="codex-stats">
            ${statPill("種別", "???")}${statPill("効果", "???")}
          </div>
          <p>まだ記録がない。</p>
        </div>
      </article>`;
  }
  return `
    <article class="codex-card">
      <div class="codex-sprite-wrap">${itemIconHtml(id, "codex-item-icon", 48)}</div>
      <div class="codex-body">
        <div class="codex-title"><strong>${escapeHtml(a.name)}</strong><em>${escapeHtml(itemRarityName(id))}</em></div>
        <div class="codex-stats">
          ${statPill("種別", a.passive ? "常時" : "取得時")}${statPill("格", itemRarityName(id))}
        </div>
        <p>${escapeHtml(a.profile)}</p>
      </div>
    </article>`;
}

function renderCodex() {
  const grid = document.getElementById("codexGrid");
  if (!grid) return;
  const htmlByTab = {
    monster: Object.keys(MONSTER_FAMILIES).map(codexMonsterFamilyCard).join(""),
    hero: HERO_CODEX_ORDER.map(heroCard).join(""),
    item: ITEM_CODEX_ORDER.map(codexItemCard).join(""),
  };
  grid.innerHTML = htmlByTab[codexTab] || htmlByTab.monster;
  for (const btn of document.querySelectorAll("[data-codex-tab]")) {
    const active = btn.dataset.codexTab === codexTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

function devFieldInfo(labels, key) {
  const found = labels[key] || [key, "調整用の数値。"];
  return { label: found[0], help: found[1] };
}

function devValueText(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function parseDevInputValue(input) {
  if (input.dataset.devArray === "1") {
    return input.value.split(",").map((part) => Number(part.trim())).filter((n) => Number.isFinite(n));
  }
  const value = Number(input.value);
  return Number.isFinite(value) ? value : null;
}

function devValuesEqual(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, i) => Number(value) === Number(b[i]));
  }
  return Number(a) === Number(b);
}

function defaultValueForPath(path) {
  const parts = path.split(".");
  if (parts.length === 2 && parts[0] === "constants") return DEFAULT_RULE_CONFIG.constants[parts[1]];
  if (parts.length === 3 && DEFAULT_RULE_CONFIG[parts[0]] && DEFAULT_RULE_CONFIG[parts[0]][parts[1]]) {
    return DEFAULT_RULE_CONFIG[parts[0]][parts[1]][parts[2]];
  }
  return null;
}

function updateDevDefaultDiffs(root = document) {
  for (const input of root.querySelectorAll("[data-dev-path]")) {
    const badge = input.closest(".dev-input-wrap")?.querySelector(".dev-default");
    if (!badge) continue;
    let defaultValue = null;
    try {
      defaultValue = JSON.parse(input.dataset.devDefault || "null");
    } catch {
      defaultValue = null;
    }
    const current = parseDevInputValue(input);
    badge.classList.toggle("dev-default-diff", !devValuesEqual(current, defaultValue));
  }
}

function devInputHtml(path, key, value, labels) {
  const info = devFieldInfo(labels, key);
  const isArray = Array.isArray(value);
  const textValue = isArray ? value.join(", ") : value;
  const type = isArray ? "text" : "number";
  const step = isArray ? "" : ' step="any"';
  const defaultValue = defaultValueForPath(path);
  const defaultText = devValueText(defaultValue);
  const differs = !devValuesEqual(value, defaultValue);
  return `
    <label class="dev-field">
      <span><b>${escapeHtml(info.label)}</b><em>${escapeHtml(info.help)}</em></span>
      <span class="dev-input-wrap">
        <input type="${type}"${step} data-dev-path="${escapeHtml(path)}" data-dev-array="${isArray ? "1" : "0"}" data-dev-default="${escapeHtml(JSON.stringify(defaultValue))}" value="${escapeHtml(textValue)}">
        <em class="dev-default${differs ? " dev-default-diff" : ""}">初期 ${escapeHtml(defaultText)}</em>
      </span>
    </label>`;
}

function entityTitle(groupKey, id) {
  if (groupKey === "kinds") return (gameApi.KINDS[id] && gameApi.KINDS[id].name) || id;
  if (groupKey === "veins") return (gameApi.VEIN[id] && gameApi.VEIN[id].legend) || id;
  if (groupKey === "heroes") return (gameApi.HERO_CLASSES[id] && gameApi.HERO_CLASSES[id].name) || id;
  return id;
}

function renderDevPanel() {
  const root = document.getElementById("devFields");
  if (!root) return;
  const config = createRuleConfig(loadStoredRuleConfig());
  let html = "";
  for (const group of DEV_GROUPS) {
    if (group.key === "constants") {
      html += `<details class="dev-group" open><summary>${escapeHtml(group.title)}</summary>`;
      for (const key of group.keys) html += devInputHtml(`constants.${key}`, key, config.constants[key], group.labels);
      html += "</details>";
      continue;
    }
    html += `<details class="dev-group"><summary>${escapeHtml(group.title)}</summary>`;
    for (const id in config[group.key]) {
      html += `<details class="dev-entity"><summary>${escapeHtml(entityTitle(group.key, id))}</summary>`;
      for (const key of group.keys) {
        if (!(key in config[group.key][id])) continue;
        html += devInputHtml(`${group.key}.${id}.${key}`, key, config[group.key][id][key], group.labels);
      }
      html += "</details>";
    }
    html += "</details>";
  }
  root.innerHTML = html;
  updateDevDefaultDiffs(root);
}

function setDevValue(config, path, value) {
  const parts = path.split(".");
  if (parts.length === 2 && parts[0] === "constants") {
    config.constants[parts[1]] = value;
    return;
  }
  if (parts.length === 3 && config[parts[0]] && config[parts[0]][parts[1]]) {
    config[parts[0]][parts[1]][parts[2]] = value;
  }
}

function readDevPanelConfig() {
  const config = createRuleConfig();
  for (const input of document.querySelectorAll("[data-dev-path]")) {
    const value = input.dataset.devArray === "1"
      ? input.value.split(",").map((part) => Number(part.trim())).filter((n) => Number.isFinite(n))
      : Number(input.value);
    setDevValue(config, input.dataset.devPath, value);
  }
  return createRuleConfig(config);
}

function updateDevStatus(text = "変更は次回開始時に反映") {
  const status = document.getElementById("devStatus");
  if (status) status.textContent = text;
}

function updateProgressStatus() {
  const status = document.getElementById("progressStatus");
  if (!status) return;
  const penalty = progress.resetPenaltyActive ? " / リセット罰あり" : "";
  status.textContent = `コイン ${progress.coins || 0} / 最高到達 W${progress.highestWave} / 魔物 ${progress.discoveredMonsters.length}/${MONSTER_CODEX_ORDER.length} / 冒険者 ${progress.discoveredHeroes.length}/${HERO_CODEX_ORDER.length} / アイテム ${progress.discoveredItems.length}/${ITEM_CODEX_ORDER.length}${penalty}`;
}

function saveDevPanel() {
  updateDevDefaultDiffs();
  saveStoredRuleConfig(readDevPanelConfig());
  updateDevStatus("保存済み。次回開始時に反映");
}

function exportDevJson() {
  const output = document.getElementById("devJsonOutput");
  if (!output) return "";
  const json = JSON.stringify(readDevPanelConfig(), null, 2);
  output.value = json;
  updateDevStatus("JSONを出力しました");
  return json;
}

async function copyDevJson() {
  const output = document.getElementById("devJsonOutput");
  const json = exportDevJson();
  if (!json || !output) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(json);
      updateDevStatus("JSONをコピーしました");
      return;
    } catch {
      // ブラウザ権限がない場合は下の選択状態へ落とす。
    }
  }
  output.focus();
  output.select();
  updateDevStatus("コピーできない環境です。JSONを選択しました");
}

function bindDevPanel() {
  updateProgressStatus();
}

function hideItemPopup() {
  const popup = document.getElementById("itemPopup");
  if (!popup) return;
  popup.classList.add("hidden");
  popup.style.visibility = "";
  activeItemPopupId = null;
}

function showItemPopup(id, target) {
  const popup = document.getElementById("itemPopup");
  const a = gameApi.ITEMS[id];
  const d = gameApi.DEBUFF_ITEMS[id];
  if (!popup || (!a && !d) || !target) return;
  popup.innerHTML = a
    ? `${itemIconHtml(id, "item-popup-icon", 30)}
    <span><b>${escapeHtml(a.name)} ${itemRarityBadgeHtml(id)}</b><em>${escapeHtml(a.profile)}</em></span>`
    : `${debuffIconHtml(id, "item-popup-icon debuff-icon", 30)}
    <span><b>${escapeHtml(d.name)} <i class="item-rarity item-rarity-debuff">デバフ</i></b><em>${escapeHtml(d.profile)}</em></span>`;
  popup.classList.remove("hidden");
  popup.style.visibility = "hidden";
  popup.style.left = "0px";
  popup.style.top = "0px";
  const targetRect = target.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const left = clampNumber(targetRect.left + targetRect.width / 2 - popupRect.width / 2, 8, window.innerWidth - popupRect.width - 8);
  let top = targetRect.bottom + 8;
  if (top + popupRect.height > window.innerHeight - 8) top = targetRect.top - popupRect.height - 8;
  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(clampNumber(top, 8, window.innerHeight - popupRect.height - 8))}px`;
  popup.style.visibility = "";
  activeItemPopupId = id;
}

function clearItemPress() {
  if (!itemPress) return;
  clearTimeout(itemPress.timer);
  itemPress = null;
}

function startItemPress(event, button) {
  clearItemPress();
  const id = button.dataset.itemId || button.dataset.debuffId;
  if (!id) return;
  event.preventDefault();
  try {
    button.setPointerCapture(event.pointerId);
  } catch {
    // ブラウザによっては捕捉できない。
  }
  const startX = event.clientX;
  const startY = event.clientY;
  itemPress = {
    id,
    button,
    startX,
    startY,
    timer: setTimeout(() => {
      if (!itemPress || itemPress.id !== id) return;
      showItemPopup(id, button);
    }, ITEM_LONG_PRESS_MS),
  };
}

function moveItemPress(event) {
  if (!itemPress) return;
  if (Math.hypot(event.clientX - itemPress.startX, event.clientY - itemPress.startY) > TAP_MOVE_CANCEL) clearItemPress();
}

function bindItemHud() {
  const bar = document.getElementById("itemBar");
  if (!bar) return;
  bar.addEventListener("pointerdown", (event) => {
    const button = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-item-id], [data-debuff-id]") : null;
    if (!button) return;
    startItemPress(event, button);
  });
  bar.addEventListener("pointermove", moveItemPress);
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) bar.addEventListener(type, clearItemPress);
  bar.addEventListener("contextmenu", (event) => {
    if (event.target && typeof event.target.closest === "function" && event.target.closest("[data-item-id], [data-debuff-id]")) event.preventDefault();
  });
  bar.addEventListener("selectstart", (event) => {
    if (event.target && typeof event.target.closest === "function" && event.target.closest("[data-item-id], [data-debuff-id]")) event.preventDefault();
  });
  document.addEventListener("pointerdown", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    if (target && (target.closest("#itemBar [data-item-id], #itemBar [data-debuff-id]") || target.closest("#itemPopup"))) return;
    hideItemPopup();
  });
  window.addEventListener("scroll", hideItemPopup, { passive: true });
  window.addEventListener("resize", hideItemPopup);
}

function renderItems() {
  const bar = document.getElementById("itemBar");
  if (!bar) return;
  const held = gameApi.items;
  const debuffs = gameApi.debuffItems || [];
  const used = new Set(gameApi.usedItems);
  const key = held.join(",") + "|d:" + debuffs.join(",") + "|" + [...used].sort().join(",");
  if (key === lastItemBarKey) return;
  lastItemBarKey = key;
  if (activeItemPopupId && !held.includes(activeItemPopupId) && !debuffs.includes(activeItemPopupId)) hideItemPopup();
  if (!held.length && !debuffs.length) {
    bar.innerHTML = `<span class="item-empty">アイテムなし</span>`;
    return;
  }
  const itemHtml = held.map((id) => {
    const a = gameApi.ITEMS[id];
    if (!a) return "";
    const classes = ["item"];
    if (used.has(id)) classes.push("item-used");
    const badge = used.has(id) ? `<i class="item-badge">済</i>` : "";
    const label = itemLabel(id);
    return `<button type="button" class="${classes.join(" ")}" data-item-id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${itemIconHtml(id, "item-icon", 24)}${badge}</button>`;
  }).join("");
  const debuffHtml = debuffs.map((id) => {
    const d = gameApi.DEBUFF_ITEMS[id];
    if (!d) return "";
    const label = debuffLabel(id);
    return `<button type="button" class="item item-debuff" data-debuff-id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${debuffIconHtml(id, "item-icon debuff-icon", 24)}<i class="item-badge debuff-badge">罠</i></button>`;
  }).join("");
  bar.innerHTML = itemHtml + debuffHtml;
}

function renderHudMessage() {
  const box = document.getElementById("hudMessage");
  if (!box) return;
  const banners = gameApi.effects.filter((e) => e.type === "banner" && e.text);
  const latest = banners[banners.length - 1];
  box.classList.toggle("hidden", !latest);
  box.textContent = latest ? latest.text : "";
}

function renderItemOffer() {
  const overlay = document.getElementById("itemChoiceOverlay");
  const grid = document.getElementById("itemChoiceGrid");
  const reroll = document.getElementById("rerollItemBtn");
  if (!overlay || !grid) return;
  const offer = gameApi.itemOffer;
  const visible = !!offer && gameApi.gameState === "itemChoice";
  overlay.classList.toggle("hidden", !visible);
  if (reroll) reroll.classList.toggle("hidden", !visible || !gameApi.canRerollItemOffer);
  if (!offer) {
    lastItemOfferKey = "";
    grid.innerHTML = "";
    return;
  }
  if (!visible) return;
  const key = `${offer.wave}:${offer.choices.join(",")}`;
  if (key === lastItemOfferKey) return;
  lastItemOfferKey = key;
  grid.innerHTML = offer.choices.map((id) => {
    const a = gameApi.ITEMS[id];
    if (!a) return "";
    return `
      <button type="button" class="item-choice-card" data-item-choice="${escapeHtml(id)}">
        ${itemIconHtml(id, "item-choice-icon", 38)}
        <span><b>${escapeHtml(a.name)} ${itemRarityBadgeHtml(id)}</b><em>${escapeHtml(a.profile)}</em></span>
      </button>`;
  }).join("");
}

function renderTrapOffer() {
  const overlay = document.getElementById("trapChoiceOverlay");
  const grid = document.getElementById("trapChoiceGrid");
  if (!overlay || !grid) return;
  const offer = gameApi.trapOffer;
  const visible = !!offer && gameApi.gameState === "trap";
  overlay.classList.toggle("hidden", !visible);
  if (!offer) {
    grid.innerHTML = "";
    return;
  }
  if (!visible) return;
  grid.innerHTML = offer.choices.map((id) => {
    const d = gameApi.DEBUFF_ITEMS[id];
    if (!d) return "";
    return `
      <button type="button" class="item-choice-card debuff-choice-card" data-trap-debuff="${escapeHtml(id)}">
        ${debuffIconHtml(id, "item-choice-icon debuff-choice-icon", 38)}
        <span><b>${escapeHtml(d.name)}</b><em>${escapeHtml(d.profile)}</em></span>
      </button>`;
  }).join("");
}

function renderDebuffNotice() {
  const overlay = document.getElementById("debuffNoticeOverlay");
  const body = document.getElementById("debuffNoticeBody");
  if (!overlay || !body) return;
  const notice = gameApi.debuffNotice;
  const visible = !!notice && gameApi.gameState === "debuffNotice";
  overlay.classList.toggle("hidden", !visible);
  if (!notice) {
    body.innerHTML = "";
    return;
  }
  if (!visible) return;
  const reason = notice.penalty ? "リセット検知により、今回はデバフが2個になった。" : "10周目以降の初期罠として、デバフを背負わされた。";
  body.innerHTML = `
    <p>${escapeHtml(reason)}</p>
    <div class="debuff-notice-list">
      ${notice.ids.map((id) => {
        const d = gameApi.DEBUFF_ITEMS[id];
        if (!d) return "";
        return `<span>${debuffIconHtml(id, "debuff-icon", 28)}<b>${escapeHtml(d.name)}</b><em>${escapeHtml(d.profile)}</em></span>`;
      }).join("")}
    </div>`;
}

function renderShopOffer() {
  const overlay = document.getElementById("itemShopOverlay");
  const grid = document.getElementById("itemShopGrid");
  if (!overlay || !grid) return;
  const offer = gameApi.shopOffer;
  const visible = !!offer && gameApi.gameState === "shop";
  overlay.classList.toggle("hidden", !visible);
  if (!offer) {
    lastShopOfferKey = "";
    grid.innerHTML = "";
    return;
  }
  if (!visible) return;
  const key = `${offer.wave}:${Math.floor(gameApi.nutrients)}:${offer.goods.map((g) => `${g.id}:${g.price}:${g.sold ? 1 : 0}`).join(",")}`;
  if (key === lastShopOfferKey) return;
  lastShopOfferKey = key;
  grid.innerHTML = offer.goods.map((good) => {
    const a = gameApi.ITEMS[good.id];
    if (!a) return "";
    const owned = gameApi.items.includes(good.id);
    const sold = good.sold || owned;
    const affordable = gameApi.nutrients >= good.price;
    const disabled = sold || !affordable;
    const priceLabel = sold ? "購入済み" : `栄養 ${good.price}`;
    const classes = ["item-choice-card", "item-shop-card", `item-shop-${itemRarity(good.id)}`];
    if (sold) classes.push("item-shop-sold");
    if (!sold && !affordable) classes.push("item-shop-short");
    return `
      <button type="button" class="${classes.join(" ")}" data-shop-item="${escapeHtml(good.id)}"${disabled ? " disabled" : ""}>
        ${itemIconHtml(good.id, "item-choice-icon", 38)}
        <span><b>${escapeHtml(a.name)} ${itemRarityBadgeHtml(good.id)}</b><em>${escapeHtml(a.profile)}</em><strong class="shop-price">${escapeHtml(priceLabel)}</strong></span>
      </button>`;
  }).join("");
}

function renderDialogue() {
  const overlay = document.getElementById("dialogueOverlay");
  const portrait = document.getElementById("dialoguePortrait");
  const topic = document.getElementById("dialogueTopic");
  const speaker = document.getElementById("dialogueSpeaker");
  const text = document.getElementById("dialogueText");
  const progressText = document.getElementById("dialogueProgress");
  const next = document.getElementById("dialogueNext");
  if (!overlay || !portrait || !topic || !speaker || !text || !progressText || !next) return;
  const dialogue = gameApi.dialogue;
  const visible = !!dialogue && gameApi.gameState === "dialogue";
  overlay.classList.toggle("hidden", !visible);
  if (!visible) return;
  portrait.className = `dialogue-portrait dialogue-${dialogue.portrait || "mark"}`;
  portrait.removeAttribute("style");
  portrait.innerHTML = "";
  if (dialogue.portrait === "slime") {
    portrait.classList.add("dialogue-sprite");
    portrait.innerHTML = `<span class="dialogue-sprite-crop" style='${codexSpriteStyle("slime")}'></span>`;
  } else if (PIXEL_DIALOGUE_PORTRAITS.includes(dialogue.portrait)) {
    portrait.classList.add("dialogue-sprite");
    portrait.innerHTML = `<span class="dialogue-sprite-crop" style='${dialoguePortraitStyle(dialogue.portrait)}'></span>`;
  }
  topic.textContent = dialogue.topic || "会話";
  speaker.textContent = dialogue.speaker || "";
  text.textContent = dialogue.text || "";
  progressText.textContent = `${dialogue.index + 1} / ${dialogue.total}`;
  next.textContent = dialogue.index + 1 >= dialogue.total ? "進む" : "次へ";
}

function updateHud() {
  syncRunOutcome();
  const ratio = Math.max(0, Math.min(1, gameApi.coreHP / gameApi.CORE_MAX));
  document.getElementById("coreFill").style.width = `${ratio * 100}%`;
  document.getElementById("coreNum").textContent = `${Math.ceil(gameApi.coreHP)} / ${gameApi.CORE_MAX}`;
  const coreLine = document.querySelector(".core-line");
  if (coreLine) coreLine.classList.toggle("core-alert", gameApi.coreHP > 0 && gameApi.gameState === "playing" && (effectLevel("corehit") > 0 || effectLevel("coreShock") > 0));
  document.getElementById("nutNum").textContent = Math.floor(gameApi.nutrients);
  document.getElementById("waveNum").textContent = `${gameApi.wave}/${gameApi.MAX_WAVE}`;
  document.getElementById("monNum").textContent = gameApi.monsters.length + gameApi.eggs.length;
  document.getElementById("scoreNum").textContent = gameApi.score;
  renderLoopSelector();
  renderItems();
  renderItemOffer();
  renderShopOffer();
  renderTrapOffer();
  renderDebuffNotice();
  renderDialogue();
  const queue = gameApi.spawnQueue;
  const activeHeroes = gameApi.heroes.length + queue.length;
  let waveLabel = "次の襲来まで";
  let waveTimer = `${Math.ceil(Math.max(0, gameApi.waveCountdown) / 1000)} 秒`;
  if (gameApi.gameState === "dialogue") {
    waveLabel = "会話中";
    waveTimer = "時間停止中";
  } else if (gameApi.gameState === "itemChoice") {
    waveLabel = "アイテム選択";
    waveTimer = "時間停止中";
  } else if (gameApi.gameState === "shop") {
    waveLabel = "ショップ";
    waveTimer = "時間停止中";
  } else if (gameApi.gameState === "trap") {
    waveLabel = "罠選択";
    waveTimer = "時間停止中";
  } else if (gameApi.gameState === "debuffNotice") {
    waveLabel = "デバフ確認";
    waveTimer = "時間停止中";
  } else if (gameApi.waveSettleDelay > 0) {
    waveLabel = "撃退確認中";
    waveTimer = `${Math.ceil(gameApi.waveSettleDelay / 1000)} 秒`;
  } else if (gameApi.heroes.length > 0) {
    waveLabel = "冒険者殲滅まで";
    waveTimer = `あと ${activeHeroes} 体`;
  } else if (queue.length > 0) {
    const seconds = Math.ceil(Math.max(0, Math.min(...queue.map((s) => s.delay))) / 1000);
    waveLabel = "次の冒険者まで";
    waveTimer = `${seconds} 秒`;
  } else if (gameApi.gameState === "clear") {
    waveLabel = "防衛完了";
    waveTimer = `${gameApi.MAX_WAVE}ウェーブ突破`;
  }
  document.getElementById("waveLabel").textContent = waveLabel;
  document.getElementById("waveTimer").textContent = waveTimer;
  document.getElementById("startOverlay").classList.toggle("hidden", gameApi.gameState !== "title");
  document.getElementById("deadOverlay").classList.toggle("hidden", gameApi.gameState !== "dead");
  document.getElementById("clearOverlay").classList.toggle("hidden", gameApi.gameState !== "clear");
  document.getElementById("deadWave").textContent = gameApi.wave;
  document.getElementById("deadKills").textContent = gameApi.kills;
  document.getElementById("deadScore").textContent = gameApi.score;
  document.getElementById("clearWaveLabel").textContent = `${gameApi.loop}周目 ${gameApi.MAX_WAVE}ウェーブ突破`;
  document.getElementById("clearKills").textContent = gameApi.kills;
  document.getElementById("clearScore").textContent = gameApi.score;
  document.getElementById("tauntBtn").disabled = gameApi.gameState !== "playing" || activeHeroes > 0 || gameApi.waveSettleDelay > 0 || gameApi.waveCountdown <= 3000;
  updateProgressStatus();
  renderHome();
  renderHudMessage();
  syncAudioState();
}

function startGame() {
  hideItemPopup();
  lastItemBarKey = "";
  lastShopOfferKey = "";
  const select = document.getElementById("homeLoopSelect");
  selectedLoop = Math.max(1, Math.min(selectableMaxLoop(), Math.floor(Number(select && select.value) || defaultLoop())));
  markRunStarted(selectedLoop);
  gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
  gameApi.startGame(selectedLoop, { resetPenaltyActive: progress.resetPenaltyActive });
  syncAudioState(true);
  syncProgressEvents();
  updateHud();
}

function openStartFlow() {
  hideItemPopup();
  lastItemBarKey = "";
  lastShopOfferKey = "";
  homeTab = "defense";
  selectedLoop = defaultLoop();
  gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
  gameApi.gameState = "title";
  syncAudioState();
  syncProgressEvents();
  renderLoopSelector();
  updateHud();
}

function bindButtonSounds() {
  document.addEventListener("pointerdown", unlockAudio, { passive: true });
  document.addEventListener("click", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    const button = target ? target.closest("button") : null;
    if (!button || button.disabled) return;
    playButtonSound();
  });
}

function boot() {
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", openStartFlow);
  document.getElementById("clearRestartBtn").addEventListener("click", openStartFlow);
  const startOverlay = document.getElementById("startOverlay");
  if (startOverlay) {
    startOverlay.addEventListener("click", (event) => {
      const target = event.target && typeof event.target.closest === "function" ? event.target : null;
      const tab = target ? target.closest("[data-home-tab]") : null;
      if (tab) {
        homeTab = tab.dataset.homeTab || "defense";
        homeMessage = "";
        renderHome(true);
        return;
      }
      const settings = target ? target.closest("[data-settings-tab]") : null;
      if (settings) {
        settingsTab = settings.dataset.settingsTab || "volume";
        renderHome(true);
        return;
      }
      const codex = target ? target.closest("[data-codex-tab]") : null;
      if (codex) {
        codexTab = codex.dataset.codexTab || "monster";
        renderCodex();
        return;
      }
      const familyBuy = target ? target.closest("[data-buy-family]") : null;
      if (familyBuy) {
        buyMonsterFamily(familyBuy.dataset.buyFamily);
        return;
      }
      const itemBuy = target ? target.closest("[data-buy-item]") : null;
      if (itemBuy) {
        buyUnlockItem(itemBuy.dataset.buyItem);
        return;
      }
      const familySelect = target ? target.closest("[data-select-family]") : null;
      if (familySelect) {
        selectMonsterFamily(familySelect.dataset.selectFamily);
        updateHud();
        return;
      }
      if (target && target.closest("#exportDevJsonBtn")) {
        exportDevJson();
        return;
      }
      if (target && target.closest("#copyDevJsonBtn")) {
        copyDevJson();
        return;
      }
      if (target && target.closest("#resetDevBtn")) {
        clearStoredRuleConfig();
        renderDevPanel();
        const output = document.getElementById("devJsonOutput");
        if (output) output.value = "";
        updateDevStatus("開発を初期化");
        return;
      }
      if (target && target.closest("#resetProgressBtn")) {
        clearProgress();
        progress = loadProgress();
        normalizeProgressDeck();
        homeMessage = "";
        selectedLoop = defaultLoop();
        gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
        gameApi.gameState = "title";
        homeRenderCacheKey = "";
        renderLoopSelector();
        renderHome(true);
        updateProgressStatus();
      }
    });
    startOverlay.addEventListener("input", (event) => {
      const target = event.target;
      if (!target || typeof target.matches !== "function") return;
      if (target.matches("[data-audio-volume]")) {
        applyAudioInput(target);
        return;
      }
      if (target.matches("[data-dev-path]")) {
        const fields = document.getElementById("devFields");
        updateDevDefaultDiffs(fields || document);
      }
    });
    startOverlay.addEventListener("change", (event) => {
      const target = event.target;
      if (!target || typeof target.matches !== "function") return;
      if (target.id === "homeLoopSelect") {
        selectedLoop = Math.max(1, Math.min(selectableMaxLoop(), Math.floor(Number(target.value) || defaultLoop())));
        renderLoopSelector();
        renderHome(true);
        return;
      }
      if (target.matches("[data-audio-volume]")) {
        scheduleAudioSettingsSave();
        return;
      }
      if (target.matches("[data-dev-path]")) saveDevPanel();
    });
  }
  document.getElementById("tauntBtn").addEventListener("click", () => {
    gameApi.tauntEarly();
    updateHud();
  });
  const itemChoiceGrid = document.getElementById("itemChoiceGrid");
  if (itemChoiceGrid) itemChoiceGrid.addEventListener("click", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    const button = target ? target.closest("[data-item-choice]") : null;
    if (!button) return;
    if (gameApi.chooseItemOffer(button.dataset.itemChoice)) updateHud();
  });
  const skipItem = document.getElementById("skipItemBtn");
  if (skipItem) skipItem.addEventListener("click", () => {
    if (gameApi.chooseItemOffer(null)) updateHud();
  });
  const rerollItem = document.getElementById("rerollItemBtn");
  if (rerollItem) rerollItem.addEventListener("click", () => {
    if (gameApi.rerollItemOffer()) updateHud();
  });
  const itemShopGrid = document.getElementById("itemShopGrid");
  if (itemShopGrid) itemShopGrid.addEventListener("click", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    const button = target ? target.closest("[data-shop-item]") : null;
    if (!button) return;
    if (gameApi.buyShopItem(button.dataset.shopItem)) updateHud();
  });
  const closeShop = document.getElementById("closeShopBtn");
  if (closeShop) closeShop.addEventListener("click", () => {
    if (gameApi.closeShopOffer()) updateHud();
  });
  const trapChoiceGrid = document.getElementById("trapChoiceGrid");
  if (trapChoiceGrid) trapChoiceGrid.addEventListener("click", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    const button = target ? target.closest("[data-trap-debuff]") : null;
    if (!button) return;
    if (gameApi.chooseTrapDebuff(button.dataset.trapDebuff)) updateHud();
  });
  const ackDebuff = document.getElementById("ackDebuffBtn");
  if (ackDebuff) ackDebuff.addEventListener("click", () => {
    if (gameApi.acknowledgeDebuffNotice()) updateHud();
  });
  const dialogueAdvance = document.getElementById("dialogueAdvanceBtn");
  if (dialogueAdvance) dialogueAdvance.addEventListener("click", () => {
    if (gameApi.advanceDialogue()) updateHud();
  });
  document.addEventListener("keydown", (event) => {
    if (gameApi.gameState !== "dialogue" || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    if (gameApi.advanceDialogue()) updateHud();
  });
  bindItemHud();
  bindButtonSounds();
  bindAudioPanel();
  bindDevPanel();

  renderLoopSelector();
  updateHud();
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-root",
    width: W,
    height: H,
    backgroundColor: "#120c1a",
    pixelArt: true,
    roundPixels: true,
    input: {
      touch: { capture: false },
      mouse: {
        preventDefaultDown: false,
        preventDefaultUp: false,
        preventDefaultMove: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    },
    scene: MainScene,
  });
}

export { MainScene, boot, gameApi, tileKey, pixelActorFrameIndex, effectFrameIndex };

if (typeof document !== "undefined") {
  initStorage().then(() => {
    progress = resolveInterruptedRunOnBoot(loadProgress());
    normalizeProgressDeck();
    selectedLoop = defaultLoop();
    gameApi = createConfiguredGame(selectedLoop, progress.resetPenaltyActive);
    boot();
  });
}
