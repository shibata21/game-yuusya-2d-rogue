"use strict";

import Phaser from "phaser";
import {
  createGame,
  exposeGameNamespace,
  pixelAssetUrl,
  pixelActorX,
  COLS,
  ROWS,
  TILE,
  W,
  H,
  CORE_MAX,
  CORE_COL,
  CORE_ROW,
  ENTRANCE_COL,
  KINDS,
  VEIN,
  HERO_CLASSES,
  PIXEL_ACTORS,
  PIXEL_TILES,
  PIXEL_EFFECTS,
  PIXEL_FRAMES,
  EGG_HATCH,
  BORN_ANIM,
  ATK_ANIM,
  DIG_BREAK,
  VEIN_FADE_START,
  VEIN_DECAY_TIME,
} from "./gameCore.js";
import "./style.css";

let gameApi = createGame();
exposeGameNamespace(gameApi);
let codexOpen = false;
let codexTab = "monster";

const MONSTER_CODEX_ORDER = ["slime", "superslime", "crownslime", "carniv", "evolved", "direfang", "spitter", "tarantula", "goldweaver", "golem", "titan", "goldcore", "flame", "infernal", "whiteflame"];
const HERO_CODEX_ORDER = ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "priest", "saint", "mage", "supermage", "sage"];
const SOIL_TINTS = [0x315a4d, 0x376a5d, 0x3f7a70, 0x4a8a82, 0x5a9b94, 0x70ada8, 0x91c4be];

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
  if (e.actionTime > 0) return Math.floor((1 - e.actionTime / (e.actionMax || ATK_ANIM)) * PIXEL_FRAMES) % PIXEL_FRAMES;
  if (e.moveAnim > 0) return Math.floor(scene.time.now / 100 + e.id) % PIXEL_FRAMES;
  return Math.floor(scene.time.now / 260 + e.id) % PIXEL_FRAMES;
}

function actorFrameIndex(name, action, dir, frame) {
  const row = PIXEL_ACTORS.indexOf(name);
  if (row < 0) return 0;
  return row * (PIXEL_FRAMES * 8 * 6) + Math.floor(pixelActorX(action, dir, frame) / TILE);
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
    this.tapStart = null;
  }

  preload() {
    this.load.spritesheet("tiles", pixelAssetUrl("tiles.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("actors", pixelAssetUrl("actors.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("effects", pixelAssetUrl("effects.png"), { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
    this.cameras.main.setBackgroundColor("#120c1a");
    this.input.on("pointerdown", (pointer) => {
      this.tapStart = { x: pointer.x, y: pointer.y, time: pointer.event && pointer.event.timeStamp ? pointer.event.timeStamp : this.time.now, moved: false };
    });
    this.input.on("pointermove", (pointer) => {
      if (!this.tapStart) return;
      if (Math.hypot(pointer.x - this.tapStart.x, pointer.y - this.tapStart.y) > 10) this.tapStart.moved = true;
    });
    this.input.on("pointerup", (pointer) => {
      if (!this.tapStart) return;
      const start = this.tapStart;
      this.tapStart = null;
      const elapsed = (pointer.event && pointer.event.timeStamp ? pointer.event.timeStamp : this.time.now) - start.time;
      if (codexOpen || gameApi.gameState !== "playing" || start.moved || elapsed > 450) return;
      if (Math.hypot(pointer.x - start.x, pointer.y - start.y) > 10) return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      gameApi.tryDig(col, row);
      updateHud();
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
        if (tile.t === "core") {
          const hit = Math.max(effectLevel("corehit"), effectLevel("coreShock"));
          if (hit > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 40);
            sprite.setTint(pulse > 0.35 ? 0xff4a5f : 0xffcf4d);
            sprite.setAlpha(0.72 + hit * 0.28);
          }
        }
        if (tile.t === "earth" && tile.sub) {
          const veinIdx = PIXEL_TILES.indexOf(tileKey(tile));
          const fade = Math.max(0, Math.min(1, ((tile.age || 0) - VEIN_FADE_START) / (VEIN_DECAY_TIME - VEIN_FADE_START)));
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
        this.drawDigCracks(c, r, Math.max(0, Math.min(1, tile.dig / DIG_BREAK)), !!tile.sub);
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
      const bornScale = e.bornAnim > 0 ? 0.4 + 0.6 * Math.max(0, Math.min(1, 1 - e.bornAnim / BORN_ANIM)) : 1;
      sprite.setVisible(true);
      sprite.setFrame(actorFrameIndex(name, action, dir, frame));
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
      this.flameGraphics.lineStyle(14, color, 0.16 * alpha);
      this.flameGraphics.lineBetween(f.sx, f.sy, f.tx, f.ty);
      this.flameGraphics.lineStyle(8, color, 0.32 * alpha);
      this.flameGraphics.lineBetween(f.sx, f.sy, f.tx, f.ty);
      this.flameGraphics.lineStyle(3, 0xfff1a6, 0.64 * alpha);
      this.flameGraphics.lineBetween(f.sx, f.sy, f.tx, f.ty);
      for (const cell of f.cells || []) {
        this.flameGraphics.fillStyle(color, 0.18 * alpha);
        this.flameGraphics.fillCircle(gameApi.cx(cell.col), gameApi.cy(cell.row), 15);
      }
    }
  }
}

function legendHtml() {
  let html = "";
  for (const key of ["moss", "meat", "venom", "stone", "ember"]) {
    const v = VEIN[key];
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
  for (const key in VEIN) {
    const v = VEIN[key];
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
  return `<span><b>${label}</b>${value}</span>`;
}

function monsterCard(kind) {
  const k = KINDS[kind];
  const name = k.name || kind;
  const type = k.evoLevel >= 2 ? "第二進化モンスター" : (k.eliteOf ? "進化モンスター" : "通常モンスター");
  return `
    <article class="codex-card">
      <div class="codex-sprite-wrap"><div class="codex-sprite" style='${codexSpriteStyle(kind)}'></div></div>
      <div class="codex-body">
        <div class="codex-title"><strong>${name}</strong><em>${type}</em></div>
        <div class="codex-stats">
          ${statPill("HP", k.hp)}${statPill("攻", k.atk)}${statPill("射", k.range)}${statPill("解禁", monsterUnlockLabel(kind))}
        </div>
        <p>${k.profile}</p>
      </div>
    </article>`;
}

function heroCard(cls) {
  const c = HERO_CLASSES[cls];
  const stats = gameApi.resolveHeroStats(cls, Math.max(c.unlock, 1));
  return `
    <article class="codex-card">
      <div class="codex-sprite-wrap"><div class="codex-sprite" style='${codexSpriteStyle(cls)}'></div></div>
      <div class="codex-body">
        <div class="codex-title"><strong>${c.name}</strong><em>${roleLabel(c.role)}</em></div>
        <div class="codex-stats">
          ${statPill("HP", stats.hp)}${statPill("攻", stats.atk)}${statPill("射", c.range)}${statPill("解禁", `W${c.unlock}`)}
        </div>
        <p>${c.profile}</p>
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

function updateHud() {
  const ratio = Math.max(0, Math.min(1, gameApi.coreHP / CORE_MAX));
  document.getElementById("coreFill").style.width = `${ratio * 100}%`;
  document.getElementById("coreNum").textContent = `${Math.ceil(gameApi.coreHP)} / ${CORE_MAX}`;
  const coreLine = document.querySelector(".core-line");
  if (coreLine) coreLine.classList.toggle("core-alert", effectLevel("corehit") > 0 || effectLevel("coreShock") > 0);
  document.getElementById("nutNum").textContent = Math.floor(gameApi.nutrients);
  document.getElementById("waveNum").textContent = gameApi.wave;
  document.getElementById("monNum").textContent = gameApi.monsters.length + gameApi.eggs.length;
  document.getElementById("scoreNum").textContent = gameApi.score;
  document.getElementById("legend").innerHTML = legendHtml();
  const queue = gameApi.spawnQueue;
  const activeHeroes = gameApi.heroes.length + queue.length;
  let waveLabel = "次の襲来まで";
  let waveTimer = `${Math.ceil(Math.max(0, gameApi.waveCountdown) / 1000)} 秒`;
  if (gameApi.heroes.length > 0) {
    waveLabel = "勇者殲滅まで";
    waveTimer = `あと ${activeHeroes} 体`;
  } else if (queue.length > 0) {
    const seconds = Math.ceil(Math.max(0, Math.min(...queue.map((s) => s.delay))) / 1000);
    waveLabel = "次の勇者まで";
    waveTimer = `${seconds} 秒`;
  }
  document.getElementById("waveLabel").textContent = waveLabel;
  document.getElementById("waveTimer").textContent = waveTimer;
  document.getElementById("startOverlay").classList.toggle("hidden", gameApi.gameState !== "title");
  document.getElementById("deadOverlay").classList.toggle("hidden", gameApi.gameState !== "dead");
  document.getElementById("deadWave").textContent = gameApi.wave;
  document.getElementById("deadKills").textContent = gameApi.kills;
  document.getElementById("deadScore").textContent = gameApi.score;
  document.getElementById("tauntBtn").disabled = gameApi.gameState !== "playing" || activeHeroes > 0 || gameApi.waveCountdown <= 3000;
}

function startGame() {
  gameApi.resetGame();
  gameApi.gameState = "playing";
  updateHud();
}

function boot() {
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", startGame);
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

export { MainScene, boot, gameApi, tileKey, actorFrameIndex, effectFrameIndex };

if (typeof document !== "undefined") {
  boot();
}
