"use strict";

export const COLS = 11;
export const ROWS = 16;
export const TILE = 48;
export const W = COLS * TILE;
export const H = ROWS * TILE;
export const ENTRANCE_COL = 5;
export const CORE_COL = 5;
export const CORE_ROW = ROWS - 2;

export const DIG_COST = 1;
export const START_NUT = 25;
export const CORE_MAX = 150;
export const MONSTER_CAP = 48;
export const BREED_LIMIT = 3;
export const MAX_HEROES = 8;
export const WAVE_INTERVAL = 29000;
export const FIRST_GRACE = 27000;
export const HERO_STAGGER = 2200;
export const VEIN_CAP = 44;
export const EGG_HATCH = 40000;
export const EGG_CHECK = 10000;
export const EGG_CHANCE = 0.20;
export const EGG_KIND_CAP = 2;
export const EAT_CHECK = 2600;
export const EAT_CHANCE_STEP = 0.09;
export const EFFECT_CAP = 90;
export const ATK_ANIM = 190;
export const MOVE_ANIM = 220;
export const DIG_BREAK = 140;
export const DIG_CD = 780;
export const BORN_ANIM = 320;
export const EVO_TIME = 65000;
export const VEIN_FADE_START = 45000;
export const VEIN_DECAY_TIME = 90000;
export const OPEN = new Set(["tunnel", "core", "surface"]);

export const KINDS = {
  slime: { hp: 10, atk: 2, range: 1, moveCd: 560, atkCd: 720, aggro: 1, rank: 1, breedEvery: 14000, breedCap: 3, col: "#7fbaff" },
  carniv: { hp: 26, atk: 5, range: 1, moveCd: 590, atkCd: 680, aggro: 5, rank: 3, breedEvery: 36000, breedCap: 2, col: "#e06b3a", name: "牙獣" },
  spitter: { hp: 16, atk: 6, range: 2, moveCd: 590, atkCd: 980, aggro: 3, rank: 2, breedEvery: 43000, breedCap: 2, col: "#a64dff", name: "毒蜘蛛" },
  golem: { hp: 95, atk: 4, range: 1, moveCd: 1100, atkCd: 1050, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, col: "#6f86c4", name: "ゴーレム" },
  flame: { hp: 64, atk: 15, range: 1, moveCd: 590, atkCd: 780, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, col: "#ff8a3a", name: "火竜" },
  superslime: { hp: 52, atk: 7, range: 1, moveCd: 520, atkCd: 680, aggro: 1, rank: 2, breedEvery: 0, breedCap: 2, col: "#e84a4a", eliteOf: "slime", name: "スーパースライム" },
  evolved: { hp: 90, atk: 16, range: 1, moveCd: 620, atkCd: 660, aggro: 5, rank: 6, breedEvery: 0, breedCap: 1, col: "#9b2f4f", eliteOf: "carniv", name: "凶牙獣" },
  tarantula: { hp: 62, atk: 15, range: 2, moveCd: 560, atkCd: 880, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, col: "#ff6b5a", eliteOf: "spitter", name: "大毒蜘蛛" },
  titan: { hp: 220, atk: 13, range: 1, moveCd: 1080, atkCd: 1000, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, col: "#d9b27a", eliteOf: "golem", name: "巨像ゴーレム" },
  infernal: { hp: 150, atk: 28, range: 1, moveCd: 560, atkCd: 740, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, col: "#5ab0ff", eliteOf: "flame", name: "獄炎竜" },
};

export const VEIN = {
  moss: { kind: "slime", evoKind: "superslime", unlock: 1, color: "#6fcf6f", core: "#bdf7bd", legend: "苔脈→スライム", evoName: "上位苔脈", touchNeed: 4 },
  meat: { kind: "carniv", evoKind: "evolved", unlock: 1, color: "#e63a2c", core: "#ffb39e", legend: "牙脈→牙獣", evoName: "上位牙脈", touchNeed: 7 },
  venom: { kind: "spitter", evoKind: "tarantula", unlock: 3, color: "#a64dff", core: "#e0bcff", legend: "毒脈→毒蜘蛛", evoName: "上位毒脈", touchNeed: 10, unlockMsg: "新たな鉱脈『毒脈』 ─ 毒蜘蛛が眠る" },
  stone: { kind: "golem", evoKind: "titan", unlock: 6, color: "#6f86c4", core: "#bcd0ff", legend: "石脈→ゴーレム", evoName: "上位石脈", touchNeed: 13, unlockMsg: "新たな鉱脈『石脈』 ─ ゴーレムが眠る" },
  ember: { kind: "flame", evoKind: "infernal", unlock: 9, color: "#ffae26", core: "#ffe39a", legend: "火脈→火竜", evoName: "上位火脈", touchNeed: 16, unlockMsg: "新たな鉱脈『火脈』 ─ 火竜が眠る" },
};

export const HERO_CLASSES = {
  warrior: { name: "戦士", hpMul: 1.0, atkMul: 1.0, range: 1, moveMul: 1.0, atkCd: 650, weight: 3, unlock: 1 },
  tank: { name: "盾兵", hpMul: 2.4, atkMul: 0.6, range: 1, moveMul: 1.5, atkCd: 800, weight: 1.4, unlock: 3, msg: "重装の盾兵が現れた ─ 非常に硬い" },
  mage: { name: "魔法使い", hpMul: 0.55, atkMul: 1.5, range: 3, moveMul: 1.0, atkCd: 900, weight: 1.3, unlock: 5, msg: "魔法使いが現れた ─ 遠くから魔物を撃つ" },
  priest: { name: "僧侶", hpMul: 0.85, atkMul: 0.35, range: 1, moveMul: 1.0, atkCd: 1000, weight: 1.0, unlock: 7, heal: true, healCd: 1500, healRange: 2, msg: "僧侶が現れた ─ 仲間を癒やす" },
};

export const PIXEL_ASSET_PATH = "assets/pixel/";
export const PIXEL_ASSET_VERSION = "v9-self-made-makai-veins";
export const PIXEL_CELL = 48;
export const PIXEL_FRAMES = 4;
export const PIXEL_DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
export const PIXEL_ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat"];
export const PIXEL_ACTORS = ["slime", "carniv", "evolved", "spitter", "golem", "flame", "superslime", "tarantula", "titan", "infernal", "warrior", "tank", "mage", "priest", "egg_superslime", "egg_evolved", "egg_tarantula", "egg_titan", "egg_infernal"];
export const PIXEL_TILES = ["earth", "tunnel", "bedrock", "surface", "core", "moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo"];
export const PIXEL_EFFECTS = ["slash", "shot", "bite", "birth", "puff"];

export function pixelAssetUrl(name) {
  return `${PIXEL_ASSET_PATH}${name}?v=${PIXEL_ASSET_VERSION}`;
}

export function cx(col) {
  return col * TILE + TILE / 2;
}

export function cy(row) {
  return row * TILE + TILE / 2;
}

export function heroDigDmg(atk) {
  return Math.min(95, 30 + atk * 1.2);
}

export function pixelActorX(action, dir, frame) {
  const ai = PIXEL_ACTIONS.indexOf(action);
  const di = PIXEL_DIRS.indexOf(dir);
  const actionIndex = ai < 0 ? 0 : ai;
  const dirIndex = di < 0 ? PIXEL_DIRS.indexOf("s") : di;
  return ((actionIndex * PIXEL_DIRS.length + dirIndex) * PIXEL_FRAMES + frame) * PIXEL_CELL;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(options = {}) {
  let random = typeof options.random === "function" ? options.random : mulberry32(options.seed ?? 1);
  let grid = [];
  let monsters = [];
  let heroes = [];
  let eggs = [];
  let effects = [];
  let spawnQueue = [];
  let unlocked = new Set();
  let nutrients = START_NUT;
  let coreHP = CORE_MAX;
  let wave = 0;
  let score = 0;
  let kills = 0;
  let waveCountdown = FIRST_GRACE;
  let idc = 0;
  let gameState = "title";

  const rnd = (a, b) => a + random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const inBounds = (col, row) => col >= 0 && row >= 0 && col < COLS && row < ROWS;
  const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
  const cardinalDist = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  const isMoving = (e) => (e.moveAnim || 0) > 0;

  function digCost() {
    return DIG_COST;
  }

  function monsterIncomeRate() {
    return 0.045;
  }

  function clearVein(tile) {
    tile.sub = null;
    tile.evo = false;
    tile.age = 0;
    tile.evoChecked = false;
    tile.evoTouch = 0;
    tile.evoTouching = {};
  }

  function buildGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let t = "earth";
        if (c === 0 || c === COLS - 1 || r === ROWS - 1) t = "bedrock";
        else if (r === 0) t = c === ENTRANCE_COL ? "surface" : "bedrock";
        row.push({ t, sub: null, shade: random() });
      }
      grid.push(row);
    }
    seedType("moss", 8, 1, CORE_ROW);
    seedType("meat", 3, 1, CORE_ROW);
    grid[1][ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    grid[2][ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    grid[CORE_ROW][CORE_COL] = { t: "core", sub: null, shade: 0 };
  }

  function veinCount() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].sub) n++;
    return n;
  }

  function seedType(type, n, rMin, rMax) {
    let tries = 0;
    while (n > 0 && tries < 400 && veinCount() < VEIN_CAP) {
      tries++;
      const c = ri(1, COLS - 2);
      const r = ri(rMin, rMax);
      if (!inBounds(c, r)) continue;
      const tile = grid[r][c];
      if (tile.t !== "earth" || tile.sub) continue;
      if (c === CORE_COL && r === CORE_ROW) continue;
      if (c === ENTRANCE_COL && r <= 2) continue;
      tile.sub = type;
      tile.age = 0;
      tile.evo = false;
      tile.evoChecked = false;
      tile.evoTouch = 0;
      tile.evoTouching = {};
      n--;
    }
  }

  function seedVeins(wv) {
    seedType("moss", 3, 1, CORE_ROW);
    seedType("meat", 1 + (wv >= 5 ? 1 : 0), 1, CORE_ROW);
    if (wv >= 3) seedType("venom", 1 + (wv >= 7 ? 1 : 0), 1, CORE_ROW);
    if (wv >= 6) seedType("stone", 1, 1, CORE_ROW);
    if (wv >= 9) seedType("ember", 1, 1, CORE_ROW);
  }

  function openNeighbors(col, row) {
    const out = [];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr) && OPEN.has(grid[nr][nc].t)) out.push({ col: nc, row: nr });
    }
    return out;
  }

  function occupied(col, row) {
    return monsters.some((m) => m.col === col && m.row === row) ||
      heroes.some((h) => h.col === col && h.row === row) ||
      eggs.some((e) => e.col === col && e.row === row);
  }

  function actorOccupied(col, row) {
    return monsters.some((m) => m.col === col && m.row === row) ||
      heroes.some((h) => h.col === col && h.row === row);
  }

  function openFreeNeighbors(col, row) {
    return openNeighbors(col, row).filter((n) => !occupied(n.col, n.row));
  }

  function countKindNear(kind, col, row, range) {
    let n = 0;
    for (const m of monsters) if (m.kind === kind && cheb(m, { col, row }) <= range) n++;
    return n;
  }

  function rankOf(kind) {
    return (KINDS[kind] && KINDS[kind].rank) || 1;
  }

  function isElite(kind) {
    return !!(KINDS[kind] && KINDS[kind].eliteOf);
  }

  function dirFromDelta(dx, dy, fallback = "s") {
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    if (sx > 0 && sy > 0) return "se";
    if (sx > 0 && sy < 0) return "ne";
    if (sx < 0 && sy > 0) return "sw";
    if (sx < 0 && sy < 0) return "nw";
    if (sx > 0) return "e";
    if (sx < 0) return "w";
    if (sy > 0) return "s";
    if (sy < 0) return "n";
    return fallback;
  }

  function faceToward(e, tx, ty) {
    e.faceDir = dirFromDelta(tx - (e.px === undefined ? cx(e.col) : e.px), ty - (e.py === undefined ? cy(e.row) : e.py), e.faceDir);
  }

  function spawnFaceDir(col, row) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr) && OPEN.has(grid[nr][nc].t)) return dirFromDelta(dc, dr, "s");
    }
    return "s";
  }

  function setAction(e, type, tx, ty, duration = ATK_ANIM) {
    faceToward(e, tx, ty);
    e.actionType = type;
    e.actionTime = duration;
    e.actionMax = duration;
    e.actionTX = tx;
    e.actionTY = ty;
    e.atkAnim = duration;
    e.atkTX = tx;
    e.atkTY = ty;
  }

  function toast(col, row, text, color) {
    effects.push({ type: "float", x: cx(col), y: cy(row), text, color, life: 900, max: 900, vy: -0.018 });
  }

  function popDmg(x, y, text, color) {
    effects.push({ type: "float", x: x + rnd(-4, 4), y: y - 6, text, color, life: 650, max: 650, vy: -0.03 });
  }

  function banner(text) {
    effects.push({ type: "banner", text, life: 2700, max: 2700, slot: effects.filter((e) => e.type === "banner").length });
  }

  function slash(x, y, color) {
    effects.push({ type: "slash", x, y, color, life: 170, max: 170, rot: rnd(0, 6.28) });
  }

  function shoot(sx, sy, tx, ty, color) {
    effects.push({ type: "shot", sx, sy, tx, ty, x: tx, y: ty, color, life: 230, max: 230 });
  }

  function bite(sx, sy, tx, ty, color) {
    effects.push({ type: "bite", sx, sy, tx, ty, x: tx, y: ty, color, life: 260, max: 260 });
  }

  function tryDig(col, row) {
    if (gameState !== "playing" || !inBounds(col, row)) return;
    const tile = grid[row][col];
    if (tile.t === "bedrock" || tile.t !== "earth") return;
    let touch = false;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr) && OPEN.has(grid[nr][nc].t)) {
        touch = true;
        break;
      }
    }
    if (!touch) return;
    const cost = digCost(row);
    if (nutrients < cost) {
      toast(col, row, "不足", "#ffb84d");
      return;
    }
    nutrients -= cost;
    if (tile.sub) {
      const vein = tile.sub;
      const kind = tile.evo ? VEIN[vein].evoKind : VEIN[vein].kind;
      tile.t = "tunnel";
      clearVein(tile);
      spawnMonster(kind, col, row);
      const mo = monsters[monsters.length - 1];
      if (mo && mo.col === col && mo.row === row) {
        mo.bornAnim = BORN_ANIM;
        effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[mo.kind].col });
      }
    } else {
      tile.t = "tunnel";
    }
    clearVein(tile);
    effects.push({ type: "dig", x: cx(col), y: cy(row), life: 340, max: 340 });
  }

  function spawnMonster(kind, col, row) {
    if (monsters.length >= MONSTER_CAP || !KINDS[kind]) return;
    const k = KINDS[kind];
    monsters.push({
      id: ++idc, kind, col, row, px: cx(col), py: cy(row), bob: rnd(0, 6.28), faceDir: spawnFaceDir(col, row),
      homeCol: col, homeRow: row, hp: k.hp, maxHp: k.hp, atk: k.atk, range: k.range,
      moveCd: rnd(0, k.moveCd), atkCd: 0, eggCd: EGG_CHECK * rnd(0.7, 1.3), eatCd: EAT_CHECK * rnd(0.6, 1.2),
      breedCd: k.breedEvery ? k.breedEvery * rnd(0.6, 1.2) : 0, breedLeft: k.breedEvery ? BREED_LIMIT : 0,
      bornAnim: BORN_ANIM, atkAnim: 0, atkTX: 0, atkTY: 0, actionType: "idle", actionTime: 0, moveAnim: 0,
    });
  }

  function spawnEgg(kind, col, row) {
    if (monsters.length + eggs.length >= MONSTER_CAP) return false;
    if (!isElite(kind) || !inBounds(col, row) || !OPEN.has(grid[row][col].t) || occupied(col, row)) return false;
    eggs.push({ kind, col, row, hatchCd: EGG_HATCH, bornAnim: BORN_ANIM });
    effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[kind].col });
    return true;
  }

  function eggCount(kind) {
    return eggs.filter((e) => e.kind === kind).length;
  }

  function eggSpot(m) {
    const cand = [];
    for (const n of openNeighbors(m.col, m.row)) if (!occupied(n.col, n.row)) cand.push(n);
    return cand.length ? cand[ri(0, cand.length - 1)] : null;
  }

  function updateEggs(dt) {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i];
      e.hatchCd -= dt;
      e.bornAnim = Math.max(0, (e.bornAnim || 0) - dt);
      if (e.hatchCd > 0) continue;
      if (monsters.length < MONSTER_CAP && !actorOccupied(e.col, e.row)) {
        spawnMonster(e.kind, e.col, e.row);
        const mo = monsters[monsters.length - 1];
        if (mo) mo.bornAnim = BORN_ANIM;
      }
      eggs.splice(i, 1);
    }
  }

  function updateEliteEggBreeding(dt) {
    for (const m of monsters) if (isElite(m.kind)) m.eggCd = (m.eggCd === undefined ? EGG_CHECK : m.eggCd) - dt;
    for (const m of monsters) {
      if (!isElite(m.kind) || m.eggCd > 0) continue;
      m.eggCd = EGG_CHECK * rnd(0.9, 1.25);
      if (eggCount(m.kind) >= EGG_KIND_CAP) continue;
      if (random() < EGG_CHANCE) {
        const spot = eggSpot(m);
        if (spot) spawnEgg(m.kind, spot.col, spot.row);
      }
    }
  }

  function veinTouchNeed(type) {
    return (VEIN[type] && VEIN[type].touchNeed) || 8;
  }

  function updateVeinTouchEvolution() {
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
      const t = grid[r][c];
      if (t.t !== "earth" || !t.sub || t.evo) continue;
      const touching = {};
      for (const m of monsters) {
        if (cardinalDist(m, { col: c, row: r }) === 1) {
          touching[m.id] = true;
          if (!t.evoTouching || !t.evoTouching[m.id]) t.evoTouch = (t.evoTouch || 0) + 1;
        }
      }
      t.evoTouching = touching;
      if ((t.evoTouch || 0) >= veinTouchNeed(t.sub)) {
        t.evo = true;
        t.age = 0;
        t.evoChecked = true;
        effects.push({ type: "evolveVein", x: cx(c), y: cy(r), life: 760, max: 760, color: VEIN[t.sub].color });
        toast(c, r, VEIN[t.sub].evoName, "#ffe08a");
      }
    }
  }

  function updateVeinAging(dt) {
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
      const t = grid[r][c];
      if (t.t !== "earth" || !t.sub) continue;
      t.age = (t.age || 0) + dt;
      if (t.age < VEIN_DECAY_TIME) continue;
      const color = VEIN[t.sub] ? VEIN[t.sub].color : "#cfd8e3";
      clearVein(t);
      t.dig = 0;
      effects.push({ type: "puff", x: cx(c), y: cy(r), life: 320, max: 320, color });
    }
  }

  function lowerPreyNear(m) {
    let best = null;
    let bestGap = 0;
    const r = rankOf(m.kind);
    for (const p of monsters) {
      if (p === m || cheb(p, m) > 1) continue;
      const gap = r - rankOf(p.kind);
      if (gap <= 0) continue;
      if (!best || gap > bestGap || (gap === bestGap && p.hp < best.hp)) {
        best = p;
        bestGap = gap;
      }
    }
    return best ? { prey: best, gap: bestGap } : null;
  }

  function tryEatLower(m) {
    const found = lowerPreyNear(m);
    if (!found) return false;
    const chance = clamp(EAT_CHANCE_STEP * found.gap, 0.08, 0.55);
    if (random() >= chance) return false;
    const prey = found.prey;
    const px0 = prey.px;
    const py0 = prey.py;
    setAction(m, "eat", px0, py0, 320);
    killMonster(prey);
    m.hp = Math.min(m.maxHp, m.hp + Math.max(3, Math.round(prey.maxHp * 0.18)));
    bite(m.px, m.py, px0, py0, "#ffcf4d");
    popDmg(m.px, m.py, "喰", "#ffcf4d");
    return true;
  }

  function pickHeroClass() {
    const pool = [];
    for (const key in HERO_CLASSES) {
      const c = HERO_CLASSES[key];
      if (wave >= c.unlock) for (let i = 0; i < Math.round(c.weight * 10); i++) pool.push(key);
    }
    return pool.length ? pool[ri(0, pool.length - 1)] : "warrior";
  }

  function spawnHero() {
    const cls = pickHeroClass();
    const c = HERO_CLASSES[cls];
    const hp = Math.max(12, Math.round((26 + wave * 8) * c.hpMul));
    const atk = Math.max(1, Math.round((4 + wave * 1.2) * c.atkMul));
    heroes.push({
      id: ++idc, cls, col: ENTRANCE_COL, row: 0, px: cx(ENTRANCE_COL), py: cy(0), faceDir: "s",
      hp, maxHp: hp, atk, range: c.range, wave, moveCd: Math.round(720 * c.moveMul), atkCd: 0,
      coreCd: 0, actCd: 300, healCd: 800, blockedMs: 0, atkAnim: 0, atkTX: 0, atkTY: 0,
      bob: rnd(0, 6.28), actionType: "idle", actionTime: 0, moveAnim: 0,
    });
  }

  function startWave() {
    wave++;
    for (const key in VEIN) {
      const v = VEIN[key];
      if (v.unlock === wave && !unlocked.has(key)) {
        unlocked.add(key);
        if (v.unlock > 1) banner(v.unlockMsg);
      }
    }
    seedVeins(wave);
    for (const key in HERO_CLASSES) {
      const c = HERO_CLASSES[key];
      if (c.unlock === wave && c.unlock > 1 && c.msg) banner(c.msg);
    }
    let count = Math.min(1 + Math.floor(wave / 2), 5);
    const room = (MAX_HEROES + 4) - heroes.length - spawnQueue.length;
    count = Math.max(0, Math.min(count, room));
    for (let i = 0; i < count; i++) spawnQueue.push({ delay: i * HERO_STAGGER });
    waveCountdown = WAVE_INTERVAL;
  }

  function tauntEarly() {
    if (gameState !== "playing" || spawnQueue.length > 0 || waveCountdown <= 3000) return;
    waveCountdown = 250;
    toast(ENTRANCE_COL, 0, "襲来", "#ffcf4d");
  }

  function beginMove(e, col, row, duration = MOVE_ANIM) {
    if (e.col === col && e.row === row) return;
    e.dirX = Math.sign(col - e.col);
    e.dirY = Math.sign(row - e.row);
    e.faceDir = dirFromDelta(col - e.col, row - e.row, e.faceDir);
    e.moveFromX = e.px === undefined ? cx(e.col) : e.px;
    e.moveFromY = e.py === undefined ? cy(e.row) : e.py;
    e.moveToX = cx(col);
    e.moveToY = cy(row);
    e.moveAnim = duration;
    e.moveMax = duration;
    e.col = col;
    e.row = row;
  }

  function updateVisualPosition(e, dt) {
    if ((e.moveAnim || 0) > 0) {
      e.moveAnim = Math.max(0, e.moveAnim - dt);
      const p = clamp(1 - e.moveAnim / (e.moveMax || MOVE_ANIM), 0, 1);
      const q = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      e.px = e.moveFromX + (e.moveToX - e.moveFromX) * q;
      e.py = e.moveFromY + (e.moveToY - e.moveFromY) * q;
    } else {
      e.px = cx(e.col);
      e.py = cy(e.row);
    }
  }

  function moveToward(e, t) {
    const nb = openFreeNeighbors(e.col, e.row);
    if (!nb.length) return;
    let best = nb[0];
    let bestD = cheb(best, t);
    for (const n of nb) {
      const d = cheb(n, t);
      if (d < bestD) {
        best = n;
        bestD = d;
      }
    }
    beginMove(e, best.col, best.row);
  }

  function wanderHome(m) {
    if (m.homeCol !== undefined && cheb(m, { col: m.homeCol, row: m.homeRow }) > 3) {
      moveToward(m, { col: m.homeCol, row: m.homeRow });
      return;
    }
    const nb = openFreeNeighbors(m.col, m.row).filter((n) => m.homeCol === undefined || cheb(n, { col: m.homeCol, row: m.homeRow }) <= 3);
    if (nb.length && random() < 0.82) {
      const n = nb[ri(0, nb.length - 1)];
      beginMove(m, n.col, n.row);
    }
  }

  function hasLOS(c0, r0, c1, r1) {
    let dx = Math.abs(c1 - c0);
    let dy = Math.abs(r1 - r0);
    const sx = c0 < c1 ? 1 : -1;
    const sy = r0 < r1 ? 1 : -1;
    let err = dx - dy;
    let c = c0;
    let r = r0;
    while (true) {
      if (!(c === c0 && r === r0) && !(c === c1 && r === r1) && !OPEN.has(grid[r][c].t)) return false;
      if (c === c1 && r === r1) break;
      const e2 = 2 * err;
      const pc = c;
      const pr = r;
      if (e2 > -dy) {
        err -= dy;
        c += sx;
      }
      if (e2 < dx) {
        err += dx;
        r += sy;
      }
      if (c !== pc && r !== pr) {
        if (!inBounds(c, pr) || !inBounds(pc, r)) return false;
        if (!OPEN.has(grid[pr][c].t) || !OPEN.has(grid[r][pc].t)) return false;
      }
    }
    return true;
  }

  function nearestHeroWithin(m, range) {
    let best = null;
    let bestD = 999;
    for (const h of heroes) {
      if (isMoving(h)) continue;
      const d = cheb(h, m);
      if (d < bestD) {
        best = h;
        bestD = d;
      }
    }
    return best && bestD <= range ? best : null;
  }

  function lowestHeroInRange(m) {
    let best = null;
    for (const h of heroes) {
      if (isMoving(h)) continue;
      if (cheb(h, m) > m.range) continue;
      if (m.range > 1 && !hasLOS(m.col, m.row, h.col, h.row)) continue;
      if (!best || h.hp < best.hp) best = h;
    }
    return best;
  }

  function lowestMonsterInRange(h) {
    let best = null;
    for (const m of monsters) {
      if (isMoving(m)) continue;
      if (cheb(m, h) > h.range) continue;
      if (h.range > 1 && !hasLOS(h.col, h.row, m.col, m.row)) continue;
      if (!best || m.hp < best.hp) best = m;
    }
    return best;
  }

  function heroHealTarget(h, c) {
    let best = null;
    for (const o of heroes) {
      if (o === h || o.hp >= o.maxHp || cheb(o, h) > c.healRange) continue;
      if (!best || o.hp < best.hp) best = o;
    }
    return best || (h.hp < h.maxHp ? h : null);
  }

  function hasAdjacentMonster(h) {
    return monsters.some((m) => !isMoving(m) && cheb(m, h) <= 1);
  }

  function killMonster(m) {
    const i = monsters.indexOf(m);
    if (i >= 0) monsters.splice(i, 1);
    effects.push({ type: "puff", x: m.px, y: m.py, life: 300, max: 300, color: "#5fd16b" });
  }

  function killHero(h) {
    const i = heroes.indexOf(h);
    if (i >= 0) heroes.splice(i, 1);
    const reward = Math.round(4 + h.wave);
    nutrients += reward;
    score += 80 * h.wave + 20;
    kills++;
    popDmg(h.px, h.py, `+${reward}`, "#ffcf4d");
    effects.push({ type: "puff", x: h.px, y: h.py, life: 340, max: 340, color: "#cfd8e3" });
  }

  function spawnInTunnel(kind) {
    const cand = [];
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) if (grid[r][c].t === "tunnel") cand.push([c, r]);
    if (!cand.length) return false;
    const p = cand[ri(0, cand.length - 1)];
    spawnMonster(kind, p[0], p[1]);
    const mo = monsters[monsters.length - 1];
    if (mo) {
      mo.bornAnim = BORN_ANIM;
      effects.push({ type: "birth", x: cx(p[0]), y: cy(p[1]), life: 380, max: 380, color: KINDS[kind].col });
    }
    return true;
  }

  function heroStep(h) {
    const n = COLS * ROWS;
    const dist = new Float64Array(n);
    const prev = new Int32Array(n);
    const done = new Uint8Array(n);
    dist.fill(Infinity);
    prev.fill(-1);
    const idx = (c, r) => r * COLS + c;
    const s = idx(h.col, h.row);
    const goal = idx(CORE_COL, CORE_ROW);
    dist[s] = 0;
    while (true) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
      if (u < 0 || u === goal) break;
      done[u] = 1;
      const c = u % COLS;
      const r = (u - c) / COLS;
      for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!inBounds(nc, nr)) continue;
        const t = grid[nr][nc].t;
        if (t === "bedrock") continue;
        if (OPEN.has(t) && !(nc === CORE_COL && nr === CORE_ROW) && occupied(nc, nr)) continue;
        const ni = idx(nc, nr);
        const nd = dist[u] + (t === "earth" ? 10 : 1);
        if (nd < dist[ni]) {
          dist[ni] = nd;
          prev[ni] = u;
        }
      }
    }
    if (dist[goal] === Infinity) return null;
    let cur = goal;
    let step = goal;
    while (prev[cur] !== -1) {
      step = cur;
      cur = prev[cur];
    }
    if (cur !== s) return null;
    const col = step % COLS;
    const row = (step - col) / COLS;
    return { col, row, tile: grid[row][col] };
  }

  function updateLowerBreeding(dt) {
    for (const m of [...monsters]) {
      if (!monsters.includes(m) || isMoving(m)) continue;
      const k = KINDS[m.kind];
      if (!k.breedEvery || m.breedLeft <= 0) continue;
      m.breedCd -= dt;
      if (m.breedCd > 0) continue;
      if (monsters.length + eggs.length >= MONSTER_CAP) {
        m.breedCd = k.breedEvery * 0.5;
        continue;
      }
      let local = 0;
      for (const o of monsters) if (o.kind === m.kind && cheb(o, m) <= 1) local++;
      if (local >= (k.breedCap || 2)) {
        m.breedCd = k.breedEvery * 0.6;
        continue;
      }
      const nb = openFreeNeighbors(m.col, m.row);
      if (!nb.length) {
        m.breedCd = k.breedEvery * 0.5;
        continue;
      }
      const d = nb[ri(0, nb.length - 1)];
      spawnMonster(m.kind, d.col, d.row);
      const child = monsters[monsters.length - 1];
      if (child) child.bornAnim = BORN_ANIM;
      effects.push({ type: "birth", x: cx(d.col), y: cy(d.row), life: 380, max: 380, color: k.col });
      m.breedLeft--;
      m.breedCd = k.breedEvery * rnd(0.9, 1.3);
    }
  }

  function updateMonsters(dt) {
    for (const m of [...monsters]) {
      if (!monsters.includes(m)) continue;
      const k = KINDS[m.kind];
      m.atkCd -= dt;
      m.moveCd -= dt;
      m.eatCd -= dt;
      updateVisualPosition(m, dt);
      m.atkAnim = Math.max(0, (m.atkAnim || 0) - dt);
      m.actionTime = Math.max(0, (m.actionTime || 0) - dt);
      m.bornAnim = Math.max(0, (m.bornAnim || 0) - dt);
      if (isMoving(m)) continue;
      const heroTarget = lowestHeroInRange(m);
      if (heroTarget) {
        faceToward(m, heroTarget.px, heroTarget.py);
        if (m.atkCd <= 0) {
          heroTarget.hp -= m.atk;
          popDmg(heroTarget.px, heroTarget.py, `-${m.atk}`, m.kind === "spitter" ? "#b6ff7a" : "#ff8a8a");
          m.atkCd = k.atkCd;
          setAction(m, m.range >= 2 ? "cast" : "attack", heroTarget.px, heroTarget.py, ATK_ANIM);
          if (m.range >= 2) shoot(m.px, m.py - 4, heroTarget.px, heroTarget.py, "#9bff5a");
          else slash(heroTarget.px, heroTarget.py, "#ffd0d0");
          if (heroTarget.hp <= 0) killHero(heroTarget);
        }
        continue;
      }
      const aggroHero = nearestHeroWithin(m, k.aggro);
      if (aggroHero) faceToward(m, aggroHero.px, aggroHero.py);
      if (!aggroHero && m.eatCd <= 0) {
        m.eatCd = EAT_CHECK * rnd(0.85, 1.25);
        if (tryEatLower(m)) continue;
      }
      if (m.moveCd <= 0) {
        if (aggroHero) moveToward(m, aggroHero);
        else wanderHome(m);
        m.moveCd = k.moveCd + rnd(-80, 120);
      }
    }
  }

  function updateHeroes(dt) {
    for (const h of [...heroes]) {
      if (!heroes.includes(h)) continue;
      const c = HERO_CLASSES[h.cls];
      h.atkCd -= dt;
      h.actCd -= dt;
      h.coreCd -= dt;
      h.healCd -= dt;
      updateVisualPosition(h, dt);
      h.atkAnim = Math.max(0, (h.atkAnim || 0) - dt);
      h.actionTime = Math.max(0, (h.actionTime || 0) - dt);
      if (isMoving(h)) continue;
      if (c.heal && h.healCd <= 0) {
        const target = heroHealTarget(h, c);
        if (target) {
          const amount = Math.round(6 + h.wave * 1.5);
          target.hp = Math.min(target.maxHp, target.hp + amount);
          slash(target.px, target.py - 2, "#9effa0");
          popDmg(target.px, target.py - 10, `+${amount}`, "#9effa0");
          h.healCd = c.healCd;
          setAction(h, "heal", target.px, target.py, ATK_ANIM);
        } else {
          h.healCd = 300;
        }
      }
      const monsterTarget = lowestMonsterInRange(h);
      if (monsterTarget) faceToward(h, monsterTarget.px, monsterTarget.py);
      if (monsterTarget && h.atkCd <= 0) {
        monsterTarget.hp -= h.atk;
        popDmg(monsterTarget.px, monsterTarget.py, `-${h.atk}`, "#fff");
        h.atkCd = c.atkCd;
        setAction(h, h.range >= 2 ? "cast" : "attack", monsterTarget.px, monsterTarget.py, ATK_ANIM);
        if (h.range >= 2) shoot(h.px, h.py - 6, monsterTarget.px, monsterTarget.py, "#b6a6ff");
        else slash(monsterTarget.px, monsterTarget.py, "#ffffff");
        if (monsterTarget.hp <= 0) killMonster(monsterTarget);
        continue;
      }
      if (hasAdjacentMonster(h)) {
        h.blockedMs += dt;
        if (h.blockedMs > 4500) {
          const step = heroStep(h);
          if (step && step.tile.t !== "earth") {
            beginMove(h, step.col, step.row);
            h.actCd = h.moveCd;
          }
          h.blockedMs = 0;
        }
        continue;
      }
      h.blockedMs = 0;
      if (h.col === CORE_COL && h.row === CORE_ROW) {
        if (h.coreCd <= 0) {
          coreHP -= h.atk;
          popDmg(cx(CORE_COL), cy(CORE_ROW) - 10, `-${h.atk}`, "#e0556b");
          effects.push({ type: "corehit", x: cx(CORE_COL), y: cy(CORE_ROW), life: 260, max: 260 });
          h.coreCd = 1100;
          setAction(h, "attack", cx(CORE_COL), cy(CORE_ROW), ATK_ANIM);
        }
        continue;
      }
      if (h.actCd <= 0) {
        const step = heroStep(h);
        if (step) {
          if (step.tile.t === "earth") {
            step.tile.dig = (step.tile.dig || 0) + heroDigDmg(h.atk);
            effects.push({ type: "dig", x: cx(step.col), y: cy(step.row), life: 300, max: 300, hero: true });
            h.actCd = DIG_CD;
            setAction(h, "dig", cx(step.col), cy(step.row), ATK_ANIM);
            if (step.tile.dig >= DIG_BREAK) {
              step.tile.t = "tunnel";
              clearVein(step.tile);
              step.tile.dig = 0;
            }
          } else {
            beginMove(h, step.col, step.row);
            h.actCd = h.moveCd;
          }
        } else {
          h.actCd = 400;
        }
      }
    }
  }

  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const f = effects[i];
      f.life -= dt;
      if (f.type === "float") f.y += f.vy * dt;
      if (f.life <= 0) effects.splice(i, 1);
    }
    if (effects.length > EFFECT_CAP) effects.splice(0, effects.length - EFFECT_CAP);
  }

  function update(dt) {
    if (gameState !== "playing") return;
    waveCountdown -= dt;
    if (spawnQueue.length === 0 && waveCountdown <= 0) startWave();
    for (let i = spawnQueue.length - 1; i >= 0; i--) {
      spawnQueue[i].delay -= dt;
      if (spawnQueue[i].delay <= 0) {
        if (heroes.length < MAX_HEROES) {
          spawnHero();
          spawnQueue.splice(i, 1);
        } else {
          spawnQueue[i].delay = 800;
        }
      }
    }
    updateVeinTouchEvolution();
    updateVeinAging(dt);
    updateEggs(dt);
    updateEliteEggBreeding(dt);
    updateLowerBreeding(dt);
    nutrients += monsterIncomeRate() * (dt / 1000);
    updateMonsters(dt);
    updateHeroes(dt);
    updateEffects(dt);
    if (coreHP <= 0) {
      coreHP = 0;
      gameState = "dead";
    }
  }

  function resetGame(seed = options.seed ?? 1) {
    random = typeof options.random === "function" ? options.random : mulberry32(seed);
    monsters = [];
    heroes = [];
    eggs = [];
    effects = [];
    spawnQueue = [];
    nutrients = START_NUT;
    coreHP = CORE_MAX;
    wave = 0;
    score = 0;
    kills = 0;
    waveCountdown = FIRST_GRACE;
    idc = 0;
    unlocked = new Set(Object.keys(VEIN).filter((key) => VEIN[key].unlock <= 1));
    gameState = "playing";
    buildGrid();
  }

  function startGame() {
    resetGame();
    gameState = "playing";
  }

  function gameOver() {
    gameState = "dead";
  }

  function actorPose(e) {
    if (!e.actionTime || e.actionTime <= 0) return { x: 0, y: 0, scale: 1, rot: 0 };
    const max = e.actionMax || ATK_ANIM;
    const p = clamp(1 - e.actionTime / max, 0, 1);
    const waveSin = Math.sin(p * Math.PI);
    const dx = e.actionTX - e.px;
    const dy = e.actionTY - e.py;
    const d = Math.hypot(dx, dy) || 1;
    let power = 5;
    let scale = 1;
    let rot = 0;
    if (e.actionType === "eat") {
      power = 12;
      scale = 1 + 0.18 * waveSin;
      rot = 0.12 * waveSin * Math.sign(dx || 1);
    } else if (e.actionType === "cast") {
      power = -3;
      scale = 1 + 0.08 * waveSin;
      rot = -0.08 * waveSin * Math.sign(dx || 1);
    } else if (e.actionType === "dig") {
      power = 6;
      rot = 0.16 * waveSin * Math.sign(dx || 1);
    }
    return { x: dx / d * power * waveSin, y: dy / d * power * waveSin, scale, rot };
  }

  function actorAction(e) {
    const a = e.actionTime > 0 ? (e.actionType || "idle") : "idle";
    return PIXEL_ACTIONS.includes(a) ? a : "idle";
  }

  resetGame();
  gameState = "title";

  return {
    get monsters() { return monsters; },
    get heroes() { return heroes; },
    get eggs() { return eggs; },
    get grid() { return grid; },
    get effects() { return effects; },
    get spawnQueue() { return spawnQueue; },
    get unlocked() { return unlocked; },
    get wave() { return wave; },
    set wave(v) { wave = v; },
    get coreHP() { return coreHP; },
    set coreHP(v) { coreHP = v; },
    get nutrients() { return nutrients; },
    set nutrients(v) { nutrients = v; },
    get score() { return score; },
    get kills() { return kills; },
    get waveCountdown() { return waveCountdown; },
    set waveCountdown(v) { waveCountdown = v; },
    get gameState() { return gameState; },
    set gameState(v) { gameState = v; },
    setRandom(fn) { random = fn; },
    update, resetGame, startGame, gameOver, tryDig, startWave, tauntEarly,
    updateVeinTouchEvolution, updateVeinAging, veinTouchNeed, beginMove, updateVisualPosition, setAction, actorPose,
    dirFromDelta, faceToward, actorAction, spawnMonster, spawnHero, spawnInTunnel, spawnEgg,
    pickHeroClass, heroStep, openNeighbors, openFreeNeighbors, hasLOS, occupied, actorOccupied,
    countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, rankOf,
    KINDS, VEIN, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, heroDigDmg, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
    MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
    PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD,
  };
}

export const Core = {
  VEIN, KINDS, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER,
  EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
  MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
  PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
  PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, heroDigDmg, cx, cy,
};

export function exposeGameNamespace(currentGame = null) {
  if (typeof globalThis === "undefined") return;
  globalThis.MakaiDefense = {
    Core,
    createGame,
    get current() {
      return currentGame || createGame();
    },
  };
}
