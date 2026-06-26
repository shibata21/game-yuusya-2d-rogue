"use strict";

import Phaser from "phaser";
import {
  createGame,
  createRuleConfig,
  DEFAULT_RULE_CONFIG,
  exposeGameNamespace,
  pixelAssetUrl,
  pixelActorX,
  pixelActorFrameIndex,
  pixelAmuletFrameIndex,
  COLS,
  ROWS,
  TILE,
  W,
  H,
  CORE_COL,
  CORE_ROW,
  ENTRANCE_COL,
  PIXEL_ACTORS,
  PIXEL_TILES,
  PIXEL_EFFECTS,
  PIXEL_AMULETS,
  PIXEL_FRAMES,
} from "./gameCore.js";
import { DEV_GROUPS } from "./devTuning.js";
import {
  applyProgressEvents,
  clearProgress,
  clearStoredRuleConfig,
  loadProgress,
  loadStoredRuleConfig,
  saveProgress,
  saveStoredRuleConfig,
} from "./storage.js";
import "./style.css";

function createConfiguredGame() {
  const next = createGame({ ruleConfig: loadStoredRuleConfig() });
  exposeGameNamespace(next);
  return next;
}

let gameApi = createConfiguredGame();
let progress = loadProgress();
let codexOpen = false;
let codexTab = "monster";
let lastAmuletOfferKey = "";
let lastAmuletBarKey = "";
let amuletPress = null;
let activeAmuletPopupId = null;

const MONSTER_CODEX_ORDER = ["slime", "superslime", "crownslime", "carniv", "evolved", "direfang", "spitter", "tarantula", "goldweaver", "golem", "titan", "goldcore", "flame", "infernal", "whiteflame", "reaper", "chimera"];
const HERO_CODEX_ORDER = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "priest", "saint", "mage", "supermage", "sage"];
const SOIL_TINTS = [0x315a4d, 0x376a5d, 0x3f7a70, 0x4a8a82, 0x5a9b94, 0x70ada8, 0x91c4be];
const TAP_MOVE_CANCEL = 10;
const TAP_MAX_MS = 450;
const AMULET_LONG_PRESS_MS = 520;

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
    this.load.spritesheet("amulets", pixelAssetUrl("amulets.png"), { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
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
      if (codexOpen || gameApi.gameState !== "playing" || moved || elapsed > TAP_MAX_MS) return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      gameApi.tryDig(col, row);
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
  }

  update(_time, delta) {
    if (!codexOpen) gameApi.update(Math.min(delta, 60));
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
  };
}

function syncProgressEvents() {
  if (!gameApi.drainEvents) return;
  const result = applyProgressEvents(progress, gameApi.drainEvents());
  if (!result.changed) return;
  progress = result.progress;
  saveProgress(progress);
  updateProgressStatus();
  if (codexOpen) renderCodex();
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

function amuletIconStyle(id, size = 24) {
  const frame = pixelAmuletFrameIndex(id);
  return [
    `background-image:url("${pixelAssetUrl("amulets.png")}")`,
    `background-size:${PIXEL_AMULETS.length * size}px ${size}px`,
    `background-position:-${frame * size}px 0`,
    `width:${size}px`,
    `height:${size}px`,
  ].join(";");
}

function amuletIconHtml(id, className = "amulet-icon", size = 24) {
  return `<span class="${escapeHtml(className)}" aria-hidden="true" style='${amuletIconStyle(id, size)}'></span>`;
}

function amuletLabel(id) {
  const a = gameApi.AMULETS[id];
  if (!a) return id;
  return `${a.name}: ${a.profile}`;
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

function renderCodex() {
  const grid = document.getElementById("codexGrid");
  if (!grid) return;
  grid.innerHTML = codexTab === "monster"
    ? MONSTER_CODEX_ORDER.map(monsterCard).join("")
    : HERO_CODEX_ORDER.map(heroCard).join("");
  for (const btn of document.querySelectorAll("[data-codex-tab]")) {
    const active = btn.dataset.codexTab === codexTab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

function showCodex() {
  codexOpen = true;
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("codexPanel").classList.remove("hidden");
  renderCodex();
}

function hideCodex() {
  codexOpen = false;
  document.getElementById("codexPanel").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  updateHud();
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
  status.textContent = `最高到達 W${progress.highestWave} / 魔物 ${progress.discoveredMonsters.length}/${MONSTER_CODEX_ORDER.length} / 冒険者 ${progress.discoveredHeroes.length}/${HERO_CODEX_ORDER.length}`;
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
  renderDevPanel();
  updateProgressStatus();
  const fields = document.getElementById("devFields");
  if (fields) {
    fields.addEventListener("input", () => updateDevDefaultDiffs(fields));
    fields.addEventListener("change", saveDevPanel);
  }
  const exportJson = document.getElementById("exportDevJsonBtn");
  if (exportJson) exportJson.addEventListener("click", exportDevJson);
  const copyJson = document.getElementById("copyDevJsonBtn");
  if (copyJson) copyJson.addEventListener("click", copyDevJson);
  const resetDev = document.getElementById("resetDevBtn");
  if (resetDev) resetDev.addEventListener("click", () => {
    clearStoredRuleConfig();
    renderDevPanel();
    const output = document.getElementById("devJsonOutput");
    if (output) output.value = "";
    updateDevStatus("開発設定を初期化");
  });
  const resetProgress = document.getElementById("resetProgressBtn");
  if (resetProgress) resetProgress.addEventListener("click", () => {
    clearProgress();
    progress = loadProgress();
    updateProgressStatus();
    if (codexOpen) renderCodex();
  });
}

function hideAmuletPopup() {
  const popup = document.getElementById("amuletPopup");
  if (!popup) return;
  popup.classList.add("hidden");
  popup.style.visibility = "";
  activeAmuletPopupId = null;
}

function showAmuletPopup(id, target) {
  const popup = document.getElementById("amuletPopup");
  const a = gameApi.AMULETS[id];
  if (!popup || !a || !target) return;
  popup.innerHTML = `
    ${amuletIconHtml(id, "amulet-popup-icon", 30)}
    <span><b>${escapeHtml(a.name)}</b><em>${escapeHtml(a.profile)}</em></span>`;
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
  activeAmuletPopupId = id;
}

function clearAmuletPress() {
  if (!amuletPress) return;
  clearTimeout(amuletPress.timer);
  amuletPress = null;
}

function startAmuletPress(event, button) {
  clearAmuletPress();
  const id = button.dataset.amuletId;
  if (!id) return;
  event.preventDefault();
  try {
    button.setPointerCapture(event.pointerId);
  } catch {
    // ブラウザによっては捕捉できない。
  }
  const startX = event.clientX;
  const startY = event.clientY;
  amuletPress = {
    id,
    button,
    startX,
    startY,
    timer: setTimeout(() => {
      if (!amuletPress || amuletPress.id !== id) return;
      showAmuletPopup(id, button);
    }, AMULET_LONG_PRESS_MS),
  };
}

function moveAmuletPress(event) {
  if (!amuletPress) return;
  if (Math.hypot(event.clientX - amuletPress.startX, event.clientY - amuletPress.startY) > TAP_MOVE_CANCEL) clearAmuletPress();
}

function bindAmuletHud() {
  const bar = document.getElementById("amuletBar");
  if (!bar) return;
  bar.addEventListener("pointerdown", (event) => {
    const button = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-amulet-id]") : null;
    if (!button) return;
    startAmuletPress(event, button);
  });
  bar.addEventListener("pointermove", moveAmuletPress);
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) bar.addEventListener(type, clearAmuletPress);
  bar.addEventListener("contextmenu", (event) => {
    if (event.target && typeof event.target.closest === "function" && event.target.closest("[data-amulet-id]")) event.preventDefault();
  });
  bar.addEventListener("selectstart", (event) => {
    if (event.target && typeof event.target.closest === "function" && event.target.closest("[data-amulet-id]")) event.preventDefault();
  });
  document.addEventListener("pointerdown", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    if (target && (target.closest("#amuletBar [data-amulet-id]") || target.closest("#amuletPopup"))) return;
    hideAmuletPopup();
  });
  window.addEventListener("scroll", hideAmuletPopup, { passive: true });
  window.addEventListener("resize", hideAmuletPopup);
}

function renderAmulets() {
  const bar = document.getElementById("amuletBar");
  if (!bar) return;
  const held = gameApi.amulets;
  const used = new Set(gameApi.usedAmulets);
  const key = held.join(",") + "|" + [...used].sort().join(",");
  if (key === lastAmuletBarKey) return;
  lastAmuletBarKey = key;
  if (activeAmuletPopupId && !held.includes(activeAmuletPopupId)) hideAmuletPopup();
  if (!held.length) {
    bar.innerHTML = `<span class="amulet-empty">お守りなし</span>`;
    return;
  }
  bar.innerHTML = held.map((id) => {
    const a = gameApi.AMULETS[id];
    if (!a) return "";
    const classes = ["amulet"];
    if (used.has(id)) classes.push("amulet-used");
    const badge = used.has(id) ? `<i class="amulet-badge">済</i>` : "";
    const label = amuletLabel(id);
    return `<button type="button" class="${classes.join(" ")}" data-amulet-id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${amuletIconHtml(id, "amulet-icon", 24)}${badge}</button>`;
  }).join("");
}

function renderAmuletOffer() {
  const overlay = document.getElementById("amuletChoiceOverlay");
  const grid = document.getElementById("amuletChoiceGrid");
  if (!overlay || !grid) return;
  const offer = gameApi.amuletOffer;
  overlay.classList.toggle("hidden", !offer);
  if (!offer) {
    lastAmuletOfferKey = "";
    grid.innerHTML = "";
    return;
  }
  const key = `${offer.wave}:${offer.choices.join(",")}`;
  if (key === lastAmuletOfferKey) return;
  lastAmuletOfferKey = key;
  grid.innerHTML = offer.choices.map((id) => {
    const a = gameApi.AMULETS[id];
    if (!a) return "";
    return `
      <button type="button" class="amulet-choice-card" data-amulet-choice="${escapeHtml(id)}">
        ${amuletIconHtml(id, "amulet-choice-icon", 38)}
        <span><b>${escapeHtml(a.name)}</b><em>${escapeHtml(a.profile)}</em></span>
      </button>`;
  }).join("");
}

function updateHud() {
  const ratio = Math.max(0, Math.min(1, gameApi.coreHP / gameApi.CORE_MAX));
  document.getElementById("coreFill").style.width = `${ratio * 100}%`;
  document.getElementById("coreNum").textContent = `${Math.ceil(gameApi.coreHP)} / ${gameApi.CORE_MAX}`;
  const coreLine = document.querySelector(".core-line");
  if (coreLine) coreLine.classList.toggle("core-alert", gameApi.coreHP > 0 && gameApi.gameState === "playing" && (effectLevel("corehit") > 0 || effectLevel("coreShock") > 0));
  document.getElementById("nutNum").textContent = Math.floor(gameApi.nutrients);
  document.getElementById("waveNum").textContent = `${gameApi.wave}/${gameApi.MAX_WAVE}`;
  document.getElementById("monNum").textContent = gameApi.monsters.length + gameApi.eggs.length;
  document.getElementById("scoreNum").textContent = gameApi.score;
  renderAmulets();
  renderAmuletOffer();
  document.getElementById("legend").innerHTML = legendHtml();
  const queue = gameApi.spawnQueue;
  const activeHeroes = gameApi.heroes.length + queue.length;
  let waveLabel = "次の襲来まで";
  let waveTimer = `${Math.ceil(Math.max(0, gameApi.waveCountdown) / 1000)} 秒`;
  if (gameApi.gameState === "amuletChoice") {
    waveLabel = "お守り選択";
    waveTimer = "時間停止中";
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
  document.getElementById("clearWaveLabel").textContent = `${gameApi.MAX_WAVE}ウェーブ突破`;
  document.getElementById("clearKills").textContent = gameApi.kills;
  document.getElementById("clearScore").textContent = gameApi.score;
  document.getElementById("tauntBtn").disabled = gameApi.gameState !== "playing" || activeHeroes > 0 || gameApi.waveCountdown <= 3000;
  updateProgressStatus();
}

function startGame() {
  hideAmuletPopup();
  lastAmuletBarKey = "";
  gameApi = createConfiguredGame();
  gameApi.startGame();
  syncProgressEvents();
  updateHud();
}

function openStartFlow() {
  hideAmuletPopup();
  lastAmuletBarKey = "";
  gameApi = createConfiguredGame();
  gameApi.gameState = "title";
  syncProgressEvents();
  updateHud();
}

function boot() {
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", openStartFlow);
  document.getElementById("clearRestartBtn").addEventListener("click", openStartFlow);
  document.getElementById("codexBtn").addEventListener("click", showCodex);
  document.getElementById("codexBackBtn").addEventListener("click", hideCodex);
  for (const btn of document.querySelectorAll("[data-codex-tab]")) {
    btn.addEventListener("click", () => {
      codexTab = btn.dataset.codexTab;
      renderCodex();
    });
  }
  document.getElementById("tauntBtn").addEventListener("click", () => {
    gameApi.tauntEarly();
    updateHud();
  });
  const amuletChoiceGrid = document.getElementById("amuletChoiceGrid");
  if (amuletChoiceGrid) amuletChoiceGrid.addEventListener("click", (event) => {
    const target = event.target && typeof event.target.closest === "function" ? event.target : null;
    const button = target ? target.closest("[data-amulet-choice]") : null;
    if (!button) return;
    if (gameApi.chooseAmuletOffer(button.dataset.amuletChoice)) updateHud();
  });
  const skipAmulet = document.getElementById("skipAmuletBtn");
  if (skipAmulet) skipAmulet.addEventListener("click", () => {
    if (gameApi.chooseAmuletOffer(null)) updateHud();
  });
  bindAmuletHud();
  bindDevPanel();

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
  boot();
}
