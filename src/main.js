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
} from "./gameCore.js";
import "./style.css";

let gameApi = createGame({ seed: 1 });
exposeGameNamespace(gameApi);

function tileKey(tile) {
  if (tile.t === "earth" && tile.sub) return `${tile.sub}${tile.evo ? "_evo" : ""}`;
  if (["earth", "tunnel", "bedrock", "surface", "core"].includes(tile.t)) return tile.t;
  return "tunnel";
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

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.tileSprites = [];
    this.actorSprites = [];
    this.effectSprites = [];
  }

  preload() {
    this.load.spritesheet("tiles", pixelAssetUrl("tiles.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("actors", pixelAssetUrl("actors.png"), { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet("effects", pixelAssetUrl("effects.png"), { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
    this.cameras.main.setBackgroundColor("#120c1a");
    this.input.on("pointerdown", (pointer) => {
      if (gameApi.gameState !== "playing") return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      gameApi.tryDig(col, row);
      updateHud();
    });
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sprite = this.add.image(c * TILE + TILE / 2, r * TILE + TILE / 2, "tiles", 0);
        sprite.setOrigin(0.5, 0.5);
        this.tileSprites.push(sprite);
      }
    }
  }

  update(_time, delta) {
    gameApi.update(Math.min(delta, 60));
    this.syncTiles();
    this.syncActors();
    this.syncEffects();
    updateHud();
  }

  syncTiles() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const sprite = this.tileSprites[r * COLS + c];
        const idx = PIXEL_TILES.indexOf(tileKey(gameApi.grid[r][c]));
        sprite.setFrame(idx >= 0 ? idx : 1);
      }
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
      sprite.setDepth(500 + i);
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
  html += `<span><i style="background:var(--magic)"></i>魔王コア</span>`;
  return html;
}

function updateHud() {
  const ratio = Math.max(0, Math.min(1, gameApi.coreHP / CORE_MAX));
  document.getElementById("coreFill").style.width = `${ratio * 100}%`;
  document.getElementById("coreNum").textContent = `${Math.ceil(gameApi.coreHP)} / ${CORE_MAX}`;
  document.getElementById("nutNum").textContent = Math.floor(gameApi.nutrients);
  document.getElementById("waveNum").textContent = gameApi.wave;
  document.getElementById("monNum").textContent = gameApi.monsters.length + gameApi.eggs.length;
  document.getElementById("scoreNum").textContent = gameApi.score;
  document.getElementById("legend").innerHTML = legendHtml();
  const queue = gameApi.spawnQueue;
  const seconds = queue.length ? Math.ceil(Math.max(0, Math.min(...queue.map((s) => s.delay))) / 1000) : Math.ceil(Math.max(0, gameApi.waveCountdown) / 1000);
  document.getElementById("waveLabel").textContent = queue.length ? "次の勇者まで" : "次の襲来まで";
  document.getElementById("waveTimer").textContent = `${seconds} 秒`;
  document.getElementById("startOverlay").classList.toggle("hidden", gameApi.gameState !== "title");
  document.getElementById("deadOverlay").classList.toggle("hidden", gameApi.gameState !== "dead");
  document.getElementById("deadWave").textContent = gameApi.wave;
  document.getElementById("deadKills").textContent = gameApi.kills;
  document.getElementById("deadScore").textContent = gameApi.score;
  document.getElementById("tauntBtn").disabled = gameApi.gameState !== "playing" || queue.length > 0 || gameApi.waveCountdown <= 3000;
}

function startGame() {
  gameApi.resetGame();
  gameApi.gameState = "playing";
  updateHud();
}

function boot() {
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("restartBtn").addEventListener("click", startGame);
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
