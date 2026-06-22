"use strict";

export const COLS = 11;
export const ROWS = 16;
export const TILE = 48;
export const W = COLS * TILE;
export const H = ROWS * TILE;
export const ENTRANCE_COL = 5;
export const ENTRY_ZONE_COLS = [4, 5, 6];
export const ENTRY_ZONE_ROWS = [1, 2];
export const CORE_COL = 5;
export const CORE_ROW = ROWS - 2;

export const DIG_COST = 1;
export const START_NUT = 25;
export const CORE_MAX = 150;
export const MONSTER_CAP = 48;
export const BREED_LIMIT = 3;
export const MAX_HEROES = 8;
export const HEROES_PER_WAVE_CAP = 5;
export const WAVE_INTERVAL = 10000;
export const FIRST_GRACE = 27000;
export const HERO_STAGGER = 520;
export const VEIN_CAP = 44;
export const VEIN_SPAWN_TICK = 1000;
export const VEIN_SPAWN_BASE_CHANCE = 0.0006;
export const VEIN_SPAWN_SOIL_WEIGHT = 0.45;
export const VEIN_SPAWN_SOIL_CHANCES = [0.0006, 0.0010, 0.0018, 0.0032, 0.007, 0.014, 0.026, 0.045];
export const VEIN_SPAWN_BURST_CAP = 3;
export const EGG_HATCH = 40000;
export const EGG_CHECK = 10000;
export const EGG_CHANCE = 0.20;
export const EGG_KIND_CAP = 2;
export const EAT_CHECK = 2600;
export const EAT_CHANCE_STEP = 0.09;
export const SOIL_MANA_MAX_STAGE = 7;
export const SOIL_CHARGE_MOVES = 10;
export const SOIL_MANA_EVO_STEP = 3;
export const SOIL_MANA_EVO_MAX = 2;
export const EFFECT_CAP = 90;
export const ATK_ANIM = 190;
export const MOVE_ANIM = 220;
export const DIG_BREAK = 140;
export const DIG_CD = 780;
export const BORN_ANIM = 320;
export const EVO_TIME = 65000;
export const VEIN_FADE_START = 120000;
export const VEIN_DECAY_TIME = 240000;
export const OPEN = new Set(["tunnel", "core", "surface"]);

export const KINDS = {
  slime: { hp: 10, atk: 2, range: 1, moveCd: 560, atkCd: 720, aggro: 1, rank: 1, breedEvery: 14000, breedCap: 3, col: "#66bf68", name: "スライム", profile: "迷宮の湿気が集まると出てくる。本人たちは採用面接に受かったと思っている。" },
  carniv: { hp: 26, atk: 5, range: 1, moveCd: 590, atkCd: 680, aggro: 5, rank: 3, breedEvery: 36000, breedCap: 2, col: "#e06b3a", name: "牙獣", profile: "首輪はないが飼われている顔をしている。褒められると通路を余計に走る。" },
  spitter: { hp: 34, atk: 8, range: 2, moveCd: 590, atkCd: 920, aggro: 3, rank: 2, breedEvery: 43000, breedCap: 2, eggChance: 0.22, col: "#a64dff", name: "毒蜘蛛", profile: "巣の片づけが異様にうまい。獲物を招く前に照明の位置を直すタイプ。" },
  golem: { hp: 125, atk: 5, range: 1, moveCd: 1100, atkCd: 1050, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, eggChance: 0.08, col: "#6f86c4", name: "ゴーレム", profile: "動き出すまでが長い。動き出してからも長い。本人は慎重派と言っている。" },
  flame: { hp: 84, atk: 18, range: 3, moveCd: 590, atkCd: 780, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, eggChance: 0.055, lineFire: true, col: "#ff8a3a", name: "火竜", profile: "炎で焼いた石をつまみにする。辛口評論家ぶるが、だいたい何でも食べる。" },
  superslime: { hp: 52, atk: 7, range: 1, moveCd: 520, atkCd: 680, aggro: 1, rank: 2, breedEvery: 0, breedCap: 2, col: "#e84a4a", eliteOf: "slime", name: "スーパースライム", profile: "ぷるぷる界の御曹司。怒ると少し赤くなるが、照れても同じ色になる。" },
  evolved: { hp: 90, atk: 16, range: 1, moveCd: 620, atkCd: 660, aggro: 5, rank: 6, breedEvery: 0, breedCap: 1, col: "#9b2f4f", eliteOf: "carniv", name: "凶牙獣", profile: "牙の手入れにうるさい。鏡がないので、水たまりの前でよく止まる。" },
  tarantula: { hp: 108, atk: 19, range: 2, moveCd: 560, atkCd: 840, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, eggChance: 0.13, col: "#ff6b5a", eliteOf: "spitter", name: "大毒蜘蛛", profile: "糸の張り方に美学がある。褒めると無言で巣を一部増築する。" },
  titan: { hp: 285, atk: 16, range: 1, moveCd: 1080, atkCd: 1000, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.035, col: "#d9b27a", eliteOf: "golem", name: "巨像ゴーレム", profile: "昔は山だったと言い張る。否定すると返事が翌朝まで返ってこない。" },
  infernal: { hp: 195, atk: 34, range: 3, moveCd: 560, atkCd: 740, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.025, lineFire: true, col: "#5ab0ff", eliteOf: "flame", name: "獄炎竜", profile: "青い炎を上品だと思っている。寝起きだけ火力が弱く、本人も少し気まずい。" },
  crownslime: { hp: 112, atk: 14, range: 1, moveCd: 500, atkCd: 650, aggro: 2, rank: 4, breedEvery: 0, breedCap: 1, col: "#d4a53d", eliteOf: "superslime", evoLevel: 2, name: "冠スライム", profile: "ぷるぷるした王冠をかぶる。威厳を出そうとして、まず姿勢から練習している。" },
  direfang: { hp: 178, atk: 30, range: 1, moveCd: 610, atkCd: 640, aggro: 5, rank: 8, breedEvery: 0, breedCap: 1, col: "#5f2020", eliteOf: "evolved", evoLevel: 2, name: "裂牙獣", profile: "走るたびに地面へ爪痕を残す。本人は道しるべのつもりらしい。" },
  goldweaver: { hp: 205, atk: 36, range: 2, moveCd: 540, atkCd: 820, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.06, col: "#c6952c", eliteOf: "tarantula", evoLevel: 2, name: "金糸毒蜘蛛", profile: "金色の糸を張る。採算を聞かれると急に巣の奥へ戻る。" },
  goldcore: { hp: 540, atk: 31, range: 1, moveCd: 1060, atkCd: 980, aggro: 4, rank: 9, breedEvery: 0, breedCap: 1, eggChance: 0.012, col: "#d0a248", eliteOf: "titan", evoLevel: 2, name: "金核ゴーレム", profile: "胸の核がやたら光る。本人は節電の概念をまだ知らない。" },
  whiteflame: { hp: 390, atk: 62, range: 3, moveCd: 550, atkCd: 720, aggro: 5, rank: 9, breedEvery: 0, breedCap: 1, eggChance: 0.01, lineFire: true, col: "#f3f7ff", eliteOf: "infernal", evoLevel: 2, name: "白炎竜", profile: "白い炎を吐く。熱すぎて焼き加減の感想がだいたい同じになる。" },
};

export const VEIN = {
  moss: { kind: "slime", evoKind: "superslime", finalKind: "crownslime", unlock: 1, color: "#6fcf6f", core: "#bdf7bd", legend: "苔脈→スライム", evoName: "上位苔脈", finalEvoName: "王冠苔脈", touchNeed: 4, finalTouchNeed: 14, spawnWeight: 3.0, soilAffinity: 0 },
  meat: { kind: "carniv", evoKind: "evolved", finalKind: "direfang", unlock: 1, color: "#e63a2c", core: "#ffb39e", legend: "牙脈→牙獣", evoName: "上位牙脈", finalEvoName: "裂牙脈", touchNeed: 7, finalTouchNeed: 22, spawnWeight: 1.6, soilAffinity: 1 },
  venom: { kind: "spitter", evoKind: "tarantula", finalKind: "goldweaver", unlock: 3, color: "#a64dff", core: "#e0bcff", legend: "毒脈→毒蜘蛛", evoName: "上位毒脈", finalEvoName: "金糸毒脈", touchNeed: 10, finalTouchNeed: 34, spawnWeight: 1.1, soilAffinity: 3, unlockMsg: "新たな鉱脈『毒脈』 ─ 毒蜘蛛が眠る" },
  stone: { kind: "golem", evoKind: "titan", finalKind: "goldcore", unlock: 6, color: "#6f86c4", core: "#bcd0ff", legend: "石脈→ゴーレム", evoName: "上位石脈", finalEvoName: "金核石脈", touchNeed: 13, finalTouchNeed: 50, spawnWeight: 0.8, soilAffinity: 5, unlockMsg: "新たな鉱脈『石脈』 ─ ゴーレムが眠る" },
  ember: { kind: "flame", evoKind: "infernal", finalKind: "whiteflame", unlock: 9, color: "#ffae26", core: "#ffe39a", legend: "火脈→火竜", evoName: "上位火脈", finalEvoName: "白炎火脈", touchNeed: 16, finalTouchNeed: 70, spawnWeight: 0.7, soilAffinity: 6, unlockMsg: "新たな鉱脈『火脈』 ─ 火竜が眠る" },
};

export const HERO_CLASSES = {
  warrior: { name: "勇者", role: "fighter", rank: 1, hpMul: 1.0, atkMul: 1.0, defense: 0, range: 1, moveMul: 1.0, atkCd: 650, weight: 3.0, unlock: 1, weapon: "sword", profile: "村で一番まじめな若者。出発前に全員へ『行ってきます』を二回言った。" },
  tank: { name: "タンク勇者", role: "tank", rank: 1, hpMul: 2.4, atkMul: 0.55, defense: 55, range: 1, moveMul: 1.55, atkCd: 850, weight: 1.35, unlock: 4, weapon: "greatshield", msg: "タンク勇者が現れた ─ 大楯で迷宮へ迫る", profile: "大楯の裏に予定表を書いている。雨の日は全部にじむ。" },
  mage: { name: "魔法使い", role: "caster", rank: 1, hpMul: 0.55, atkMul: 1.45, defense: -10, range: 3, moveMul: 1.0, atkCd: 900, weight: 1.3, unlock: 5, weapon: "staff", msg: "魔法使いが現れた ─ 遠くから魔物を撃つ", profile: "杖をなくす夢をよく見る。起きてから毎回、杖に謝る。" },
  superwarrior: { name: "スーパー勇者", role: "fighter", rank: 2, hpMul: 1.05, atkMul: 1.25, defense: 4, range: 1, moveMul: 0.96, atkCd: 620, weight: 1.55, unlock: 6, weapon: "spear", msg: "スーパー勇者が現れた ─ 槍の突きが鋭い", profile: "槍を磨く時間が長い。集合に遅れる理由もだいたい槍。" },
  priest: { name: "僧侶", role: "healer", rank: 1, hpMul: 0.85, atkMul: 0.35, defense: 0, range: 1, moveMul: 1.0, atkCd: 1000, weight: 1.0, unlock: 7, weapon: "rod", heal: true, healCd: 1500, healRange: 2, healMul: 1.0, msg: "僧侶が現れた ─ 仲間を癒やす", profile: "祈りは丁寧だが、会計の割り勘だけ妙に早い。" },
  ultrawarrior: { name: "ウルトラ勇者", role: "fighter", rank: 3, hpMul: 1.25, atkMul: 1.38, defense: 18, range: 1, moveMul: 1.08, atkCd: 680, weight: 1.25, unlock: 8, weapon: "sword_shield", msg: "ウルトラ勇者が現れた ─ 剣と盾で押し込む", profile: "育ちのいいエリート。宿の枕が低いと翌日の正義感が少し落ちる。" },
  supermage: { name: "スーパー魔法使い", role: "caster", rank: 2, hpMul: 0.62, atkMul: 1.75, defense: -10, range: 3, moveMul: 1.0, atkCd: 880, weight: 0.75, unlock: 11, weapon: "gem_staff", msg: "スーパー魔法使いが現れた ─ 魔石の飛び道具が強い", profile: "魔石の産地を聞かれると急に早口になる。" },
  crossknight: { name: "十字騎士団", role: "fighter", rank: 4, hpMul: 1.55, atkMul: 1.55, defense: 28, range: 1, moveMul: 1.12, atkCd: 660, weight: 0.85, unlock: 14, weapon: "cross_shield", msg: "十字騎士団が現れた ─ 後半の重装部隊", profile: "規律が厳しい。号令が長すぎて、突撃前に一度休憩が入る。" },
  saint: { name: "聖女", role: "healer", rank: 2, hpMul: 1.1, atkMul: 0.45, defense: 8, range: 1, moveMul: 1.08, atkCd: 1050, weight: 0.55, unlock: 16, weapon: "saint_rod", heal: true, healCd: 1100, healRange: 3, healMul: 2.25, msg: "聖女が現れた ─ 仲間を大きく癒やす", profile: "微笑むと寄付箱が重くなる。本人は偶然だと言い張っている。" },
  sage: { name: "賢者", role: "caster", rank: 3, hpMul: 0.72, atkMul: 1.95, defense: -8, range: 4, moveMul: 1.05, atkCd: 1050, weight: 0.45, unlock: 18, weapon: "glow_staff", areaAttack: true, areaScale: 0.65, areaMax: 3, msg: "賢者が現れた ─ 光る杖で列を薙ぐ", profile: "知らないことも知っている顔で聞く。沈黙が長いほど怪しい。" },
  captain: { name: "騎士団長", role: "fighter", rank: 5, hpMul: 1.85, atkMul: 1.75, defense: 42, range: 1, moveMul: 1.0, atkCd: 600, weight: 0.35, unlock: 20, weapon: "gold_sword_shield", maxPerWave: 1, msg: "騎士団長が現れた ─ 金色の剣と盾を持つ強敵", profile: "金色装備は自腹らしい。部下には節約をすすめるので微妙な空気になる。" },
};

export const PIXEL_ASSET_PATH = "assets/pixel/";
export const PIXEL_ASSET_VERSION = "v18-wave-evo2-entry";
export const PIXEL_CELL = 48;
export const PIXEL_FRAMES = 4;
export const PIXEL_DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
export const PIXEL_ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat"];
export const PIXEL_ACTORS = ["slime", "carniv", "evolved", "spitter", "golem", "flame", "superslime", "tarantula", "titan", "infernal", "crownslime", "direfang", "goldweaver", "goldcore", "whiteflame", "warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "priest", "saint", "mage", "supermage", "sage", "egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"];
export const PIXEL_TILES = ["earth", "tunnel", "bedrock", "surface", "core", "moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo", "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2"];
export const PIXEL_EFFECTS = ["slash", "shot", "bite", "birth", "puff"];
const DIR_VECTORS = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };

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

export function resolveHeroStats(cls, wave) {
  const c = HERO_CLASSES[cls] || HERO_CLASSES.warrior;
  const w = Math.max(0, wave || 0);
  const hp = Math.max(12, Math.round((26 + w * 8) * c.hpMul));
  const atk = Math.max(1, Math.round((4 + w * 1.2) * c.atkMul));
  const heal = c.heal ? Math.max(1, Math.round((6 + w * 1.5) * (c.healMul || 1))) : 0;
  return { hp, atk, defense: c.defense || 0, range: c.range, heal };
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

function autoSeed() {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
}

export function createGame(options = {}) {
  let random = typeof options.random === "function" ? options.random : mulberry32(options.seed ?? autoSeed());
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
  let veinSpawnTimer = 0;
  let idc = 0;
  let gameState = "title";

  const rnd = (a, b) => a + random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const inBounds = (col, row) => col >= 0 && row >= 0 && col < COLS && row < ROWS;
  const cheb = (a, b) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
  const cardinalDist = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  const isMoving = (e) => (e.moveAnim || 0) > 0;
  const isCoreCell = (col, row) => col === CORE_COL && row === CORE_ROW;
  const isEntranceCell = (col, row) => col === ENTRANCE_COL && row === 0;
  const isHeroEntryZone = (col, row) => ENTRY_ZONE_COLS.includes(col) && ENTRY_ZONE_ROWS.includes(row);
  const isMonsterForbiddenCell = (col, row) => isEntranceCell(col, row) || isHeroEntryZone(col, row) || isCoreCell(col, row);
  const coreAttackCells = () => [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    .map(([dc, dr]) => ({ col: CORE_COL + dc, row: CORE_ROW + dr }))
    .filter((p) => inBounds(p.col, p.row) && grid[p.row][p.col].t !== "bedrock");
  const isCoreAttackCell = (col, row) => cheb({ col, row }, { col: CORE_COL, row: CORE_ROW }) === 1;

  function digCost() {
    return DIG_COST;
  }

  function monsterIncomeRate() {
    return 0.045;
  }

  function evoStageOf(tile) {
    if (!tile) return 0;
    const raw = tile.evoStage === undefined ? (tile.evo ? 1 : 0) : tile.evoStage;
    return Math.max(0, Math.min(2, Math.floor(raw || 0)));
  }

  function setEvoStage(tile, stage) {
    const next = Math.max(0, Math.min(2, Math.floor(stage || 0)));
    tile.evoStage = next;
    tile.evo = next >= 1;
  }

  function soilManaOf(tile) {
    return Math.max(0, Math.min(SOIL_MANA_MAX_STAGE, Math.floor((tile && tile.soilMana) || 0)));
  }

  function soilManaEvoBonus(tile) {
    return Math.min(SOIL_MANA_EVO_MAX, Math.floor(soilManaOf(tile) / SOIL_MANA_EVO_STEP));
  }

  function clearVein(tile, clearSoil = false) {
    tile.sub = null;
    setEvoStage(tile, 0);
    tile.age = 0;
    tile.evoChecked = false;
    tile.evoTouch = 0;
    tile.evoStageTouch = 0;
    tile.evoTouching = {};
    if (clearSoil) tile.soilMana = 0;
  }

  function buildGrid() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let t = "earth";
        if (c === 0 || c === COLS - 1 || r === ROWS - 1) t = "bedrock";
        else if (r === 0) t = c === ENTRANCE_COL ? "surface" : "bedrock";
        else if (ENTRY_ZONE_ROWS.includes(r) && ENTRY_ZONE_COLS.includes(c)) t = "tunnel";
        row.push({ t, sub: null, shade: random() });
      }
      grid.push(row);
    }
    seedType("moss", 8, 1, CORE_ROW);
    seedType("meat", 3, 1, CORE_ROW);
    grid[2][ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    grid[CORE_ROW][CORE_COL] = { t: "core", sub: null, shade: 0 };
  }

  function veinCount() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c].sub) n++;
    return n;
  }

  function canHostVein(col, row, tile = grid[row] && grid[row][col]) {
    if (!tile || tile.t !== "earth" || tile.sub) return false;
    if (isMonsterForbiddenCell(col, row)) return false;
    if (col === ENTRANCE_COL && row <= 2) return false;
    return true;
  }

  function placeVein(tile, type) {
    if (!VEIN[type]) return false;
    tile.sub = type;
    tile.age = 0;
    setEvoStage(tile, 0);
    tile.evoChecked = false;
    tile.evoTouch = 0;
    tile.evoStageTouch = 0;
    tile.evoTouching = {};
    return true;
  }

  function seedType(type, n, rMin, rMax) {
    while (n > 0 && veinCount() < VEIN_CAP) {
      const cand = [];
      let totalWeight = 0;
      for (let r = rMin; r <= rMax; r++) for (let c = 1; c < COLS - 1; c++) {
        if (!inBounds(c, r)) continue;
        const tile = grid[r][c];
        if (!canHostVein(c, r, tile)) continue;
        const weight = 1 + soilManaOf(tile) * VEIN_SPAWN_SOIL_WEIGHT;
        cand.push({ c, r, tile, weight });
        totalWeight += weight;
      }
      if (!cand.length) break;
      let pick = rnd(0, totalWeight);
      let chosen = cand[cand.length - 1];
      for (const item of cand) {
        pick -= item.weight;
        if (pick <= 0) {
          chosen = item;
          break;
        }
      }
      const { tile } = chosen;
      placeVein(tile, type);
      n--;
    }
  }

  function availableVeinTypes() {
    return Object.keys(VEIN).filter((key) => unlocked.has(key) || wave >= VEIN[key].unlock);
  }

  function veinTypeSpawnWeight(type, tile) {
    const vein = VEIN[type];
    if (!vein) return 0;
    const stage = soilManaOf(tile);
    const affinity = Math.max(0, Math.min(SOIL_MANA_MAX_STAGE, vein.soilAffinity ?? 0));
    const distanceFit = Math.max(0.2, 1 - Math.abs(stage - affinity) * 0.12);
    const growthFit = stage >= affinity
      ? 1 + affinity * affinity * 0.28 + Math.min(2, stage - affinity) * 0.25
      : Math.max(0.18, 1 - (affinity - stage) * 0.28);
    return (vein.spawnWeight || 1) * distanceFit * growthFit;
  }

  function pickVeinTypeForSpawn(tile = null) {
    const types = availableVeinTypes();
    let total = 0;
    for (const type of types) total += veinTypeSpawnWeight(type, tile);
    if (total <= 0) return null;
    let pick = rnd(0, total);
    for (const type of types) {
      pick -= veinTypeSpawnWeight(type, tile);
      if (pick <= 0) return type;
    }
    return types[types.length - 1] || null;
  }

  function veinSpawnChance(tile) {
    if (!tile || tile.t !== "earth" || tile.sub) return 0;
    const stage = soilManaOf(tile);
    return VEIN_SPAWN_SOIL_CHANCES[stage] ?? VEIN_SPAWN_SOIL_CHANCES[VEIN_SPAWN_SOIL_CHANCES.length - 1];
  }

  function runVeinSpawnTick() {
    if (veinCount() >= VEIN_CAP || availableVeinTypes().length === 0) return 0;
    let spawned = 0;
    const candidates = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const tile = grid[r][c];
        if (!canHostVein(c, r, tile)) continue;
        if (random() >= veinSpawnChance(tile)) continue;
        candidates.push({ c, r, tile, soil: soilManaOf(tile) });
      }
    }
    candidates.sort((a, b) => b.soil - a.soil || a.r - b.r || a.c - b.c);
    for (const item of candidates) {
      if (spawned >= VEIN_SPAWN_BURST_CAP || veinCount() >= VEIN_CAP) return spawned;
      const type = pickVeinTypeForSpawn(item.tile);
      if (!type || !placeVein(item.tile, type)) continue;
      spawned++;
      effects.push({ type: "puff", x: cx(item.c), y: cy(item.r), life: 320, max: 320, color: VEIN[type].color });
    }
    return spawned;
  }

  function updateVeinSpawning(dt) {
    veinSpawnTimer += dt;
    let spawned = 0;
    while (veinSpawnTimer >= VEIN_SPAWN_TICK) {
      veinSpawnTimer -= VEIN_SPAWN_TICK;
      spawned += runVeinSpawnTick();
    }
    return spawned;
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

  function monsterAt(col, row, except = null) {
    return monsters.find((m) => m !== except && m.col === col && m.row === row) || null;
  }

  function heroOrEggOccupied(col, row) {
    return heroes.some((h) => h.col === col && h.row === row) ||
      eggs.some((e) => e.col === col && e.row === row);
  }

  function openFreeNeighbors(col, row) {
    return openNeighbors(col, row).filter((n) => !isMonsterForbiddenCell(n.col, n.row) && !occupied(n.col, n.row));
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

  function evoLevelOf(kind) {
    return (KINDS[kind] && KINDS[kind].evoLevel) || 0;
  }

  function canBeEatenBy(eater, prey) {
    if (!eater || !prey || !KINDS[eater.kind] || !KINDS[prey.kind]) return false;
    if (evoLevelOf(prey.kind) >= 2) return false;
    if (isElite(prey.kind) && !isElite(eater.kind)) return false;
    return rankOf(eater.kind) > rankOf(prey.kind);
  }

  function canLayEgg(kind) {
    return ((KINDS[kind] && KINDS[kind].eggChance) || 0) > 0;
  }

  function veinKindForTile(vein, tile) {
    const v = VEIN[vein];
    if (!v) return null;
    const stage = evoStageOf(tile);
    if (stage >= 2) return v.finalKind || v.evoKind || v.kind;
    if (stage >= 1) return v.evoKind || v.kind;
    return v.kind;
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
      const kind = veinKindForTile(vein, tile);
      tile.t = "tunnel";
      clearVein(tile, true);
      if (kind) {
        spawnMonster(kind, col, row);
        const mo = monsters[monsters.length - 1];
        if (mo && mo.col === col && mo.row === row) {
          mo.bornAnim = BORN_ANIM;
          effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[mo.kind].col });
        }
      }
    } else {
      tile.t = "tunnel";
      clearVein(tile, true);
    }
    effects.push({ type: "dig", x: cx(col), y: cy(row), life: 340, max: 340 });
  }

  function spawnMonster(kind, col, row) {
    if (monsters.length >= MONSTER_CAP || !KINDS[kind]) return;
    if (!inBounds(col, row) || isMonsterForbiddenCell(col, row)) return;
    const k = KINDS[kind];
    monsters.push({
      id: ++idc, kind, col, row, px: cx(col), py: cy(row), bob: rnd(0, 6.28), faceDir: spawnFaceDir(col, row),
      homeCol: col, homeRow: row, hp: k.hp, maxHp: k.hp, atk: k.atk, range: k.range,
      moveCd: rnd(0, k.moveCd), atkCd: 0, eggCd: EGG_CHECK * rnd(0.7, 1.3), eatCd: EAT_CHECK * rnd(0.6, 1.2),
      breedCd: k.breedEvery ? k.breedEvery * rnd(0.6, 1.2) : 0, breedLeft: k.breedEvery ? BREED_LIMIT : 0,
      prevCol: null, prevRow: null, soilSteps: 0, bornAnim: BORN_ANIM, atkAnim: 0, atkTX: 0, atkTY: 0, actionType: "idle", actionTime: 0, moveAnim: 0,
    });
  }

  function spawnEgg(kind, col, row) {
    if (monsters.length + eggs.length >= MONSTER_CAP) return false;
    if (!canLayEgg(kind) || !inBounds(col, row) || isMonsterForbiddenCell(col, row) || !OPEN.has(grid[row][col].t) || occupied(col, row)) return false;
    eggs.push({ kind, col, row, hatchCd: EGG_HATCH, bornAnim: BORN_ANIM });
    effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[kind].col });
    return true;
  }

  function eggCount(kind) {
    return eggs.filter((e) => e.kind === kind).length;
  }

  function eggSpot(m) {
    const cand = [];
    for (const n of openNeighbors(m.col, m.row)) if (!isMonsterForbiddenCell(n.col, n.row) && !occupied(n.col, n.row)) cand.push(n);
    return cand.length ? cand[ri(0, cand.length - 1)] : null;
  }

  function updateEggs(dt) {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i];
      e.hatchCd -= dt;
      e.bornAnim = Math.max(0, (e.bornAnim || 0) - dt);
      if (e.hatchCd > 0) continue;
      if (monsters.length < MONSTER_CAP && !isMonsterForbiddenCell(e.col, e.row) && !actorOccupied(e.col, e.row)) {
        spawnMonster(e.kind, e.col, e.row);
        const mo = monsters[monsters.length - 1];
        if (mo) mo.bornAnim = BORN_ANIM;
      }
      eggs.splice(i, 1);
    }
  }

  function updateEliteEggBreeding(dt) {
    for (const m of monsters) if (canLayEgg(m.kind)) m.eggCd = (m.eggCd === undefined ? EGG_CHECK : m.eggCd) - dt;
    for (const m of monsters) {
      if (!canLayEgg(m.kind) || m.eggCd > 0) continue;
      m.eggCd = EGG_CHECK * rnd(0.9, 1.25);
      if (eggCount(m.kind) >= EGG_KIND_CAP) continue;
      if (random() < KINDS[m.kind].eggChance) {
        const spot = eggSpot(m);
        if (spot) spawnEgg(m.kind, spot.col, spot.row);
      }
    }
  }

  function veinTouchNeed(type) {
    return (VEIN[type] && VEIN[type].touchNeed) || 8;
  }

  function veinNextTouchNeed(type, tile) {
    const stage = evoStageOf(tile);
    const vein = VEIN[type] || {};
    const base = stage >= 1 ? (vein.finalTouchNeed || veinTouchNeed(type) + 4) : veinTouchNeed(type);
    return Math.max(3, base - soilManaEvoBonus(tile));
  }

  function updateVeinTouchEvolution() {
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
      const t = grid[r][c];
      if (t.t !== "earth" || !t.sub || evoStageOf(t) >= 2) continue;
      const touching = {};
      for (const m of monsters) {
        if (cardinalDist(m, { col: c, row: r }) === 1) {
          touching[m.id] = true;
          if (!t.evoTouching || !t.evoTouching[m.id]) {
            t.evoTouch = (t.evoTouch || 0) + 1;
            t.evoStageTouch = (t.evoStageTouch || 0) + 1;
          }
        }
      }
      t.evoTouching = touching;
      if ((t.evoStageTouch || 0) >= veinNextTouchNeed(t.sub, t)) {
        const nextStage = evoStageOf(t) + 1;
        setEvoStage(t, nextStage);
        t.age = 0;
        t.evoChecked = true;
        t.evoStageTouch = 0;
        t.evoTouching = {};
        effects.push({ type: "evolveVein", x: cx(c), y: cy(r), life: 760, max: 760, color: nextStage >= 2 ? "#ffcf4d" : VEIN[t.sub].color });
        toast(c, r, nextStage >= 2 ? VEIN[t.sub].finalEvoName : VEIN[t.sub].evoName, nextStage >= 2 ? "#ffcf4d" : "#ffe08a");
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
      if (p === m || !canAttackFrom(m.col, m.row, 1, p)) continue;
      if (!canBeEatenBy(m, p)) continue;
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

  function heroClassWaveCount(cls) {
    let n = 0;
    for (const h of heroes) if (h.wave === wave && h.cls === cls) n++;
    for (const q of spawnQueue) if (q.cls === cls) n++;
    return n;
  }

  function heroClassWeightForWave(cls, w = wave) {
    const c = HERO_CLASSES[cls];
    if (!c || w < c.unlock) return 0;
    if (c.maxPerWave && heroClassWaveCount(cls) >= c.maxPerWave) return 0;
    const desiredRank = Math.min(5, 1 + Math.floor((Math.max(1, w) - 1) / 5));
    const gap = desiredRank - (c.rank || 1);
    if (gap >= 3) return 0;
    return (c.weight || 1) * (gap > 0 ? Math.pow(0.24, gap) : 1);
  }

  function pickHeroClass() {
    const weighted = [];
    let total = 0;
    for (const key in HERO_CLASSES) {
      const weight = heroClassWeightForWave(key, wave);
      if (weight <= 0) continue;
      total += weight;
      weighted.push({ key, weight });
    }
    if (total <= 0) return "warrior";
    let pick = rnd(0, total);
    for (const item of weighted) {
      pick -= item.weight;
      if (pick <= 0) return item.key;
    }
    return weighted[weighted.length - 1].key;
  }

  function heroEntryCells() {
    const cells = [];
    for (const row of ENTRY_ZONE_ROWS) for (const col of ENTRY_ZONE_COLS) {
      if (inBounds(col, row) && OPEN.has(grid[row][col].t) && !heroes.some((h) => h.col === col && h.row === row)) cells.push({ col, row });
    }
    return cells;
  }

  function spawnHero(cls = null, col = null, row = null) {
    cls = HERO_CLASSES[cls] ? cls : pickHeroClass();
    if (col === null || row === null) {
      const cells = heroEntryCells();
      if (!cells.length) return false;
      const spot = cells[0];
      col = spot.col;
      row = spot.row;
    }
    const c = HERO_CLASSES[cls];
    const stats = resolveHeroStats(cls, wave);
    heroes.push({
      id: ++idc, cls, col, row, px: cx(col), py: cy(row), faceDir: "s",
      hp: stats.hp, maxHp: stats.hp, atk: stats.atk, defense: stats.defense, range: stats.range, wave, moveCd: Math.round(720 * c.moveMul), atkCd: 0,
      coreCd: 0, actCd: 300, healCd: 800, blockedMs: 0, atkAnim: 0, atkTX: 0, atkTY: 0,
      bob: rnd(0, 6.28), actionType: "idle", actionTime: 0, moveAnim: 0,
    });
    return true;
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
    for (const key in HERO_CLASSES) {
      const c = HERO_CLASSES[key];
      if (c.unlock === wave && c.unlock > 1 && c.msg) banner(c.msg);
    }
    let count = Math.min(1 + Math.floor(wave / 2), HEROES_PER_WAVE_CAP);
    const room = Math.min(MAX_HEROES - heroes.length - spawnQueue.length, heroEntryCells().length - spawnQueue.length);
    count = Math.max(0, Math.min(count, room));
    for (let i = 0; i < count; i++) spawnQueue.push({ delay: i * HERO_STAGGER, cls: pickHeroClass() });
    waveCountdown = WAVE_INTERVAL;
  }

  function tauntEarly() {
    if (gameState !== "playing" || spawnQueue.length > 0 || heroes.length > 0 || waveCountdown <= 3000) return;
    waveCountdown = 250;
    toast(ENTRANCE_COL, 0, "襲来", "#ffcf4d");
  }

  function chargeSoilAt(col, row, amount) {
    if (!inBounds(col, row)) return;
    const tile = grid[row][col];
    if (tile.t !== "earth") return;
    tile.soilMana = Math.min(SOIL_MANA_MAX_STAGE, soilManaOf(tile) + amount);
  }

  function chargeSoilAround(col, row, amount) {
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) chargeSoilAt(col + dc, row + dr, amount);
  }

  function noteMonsterStep(e, fromCol, fromRow, toCol, toRow) {
    if (!e.kind || !KINDS[e.kind]) return;
    e.soilSteps = (e.soilSteps || 0) + 1;
    if (e.soilSteps < SOIL_CHARGE_MOVES) return;
    e.soilSteps = 0;
    chargeSoilAround(fromCol, fromRow, 1);
    chargeSoilAround(toCol, toRow, 1);
  }

  function beginMove(e, col, row, duration = MOVE_ANIM) {
    if (e.col === col && e.row === row) return;
    if (e.kind && isMonsterForbiddenCell(col, row)) return;
    const fromCol = e.col;
    const fromRow = e.row;
    if (e.kind) {
      e.prevCol = fromCol;
      e.prevRow = fromRow;
    }
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
    noteMonsterStep(e, fromCol, fromRow, col, row);
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

  function canAttackFrom(col, row, range, target) {
    const d = cheb({ col, row }, target);
    if (d > range) return false;
    if (range <= 1) return canMeleeFrom(col, row, target);
    return hasLOS(col, row, target.col, target.row);
  }

  function dragonFireCells(m, dir) {
    const vec = DIR_VECTORS[dir];
    if (!vec) return [];
    const [dc, dr] = vec;
    const range = Math.max(1, Math.floor(m.range || (KINDS[m.kind] && KINDS[m.kind].range) || 5));
    const cells = [];
    let prevCol = m.col;
    let prevRow = m.row;
    for (let step = 1; step <= range; step++) {
      const col = m.col + dc * step;
      const row = m.row + dr * step;
      if (!inBounds(col, row)) break;
      if (dc !== 0 && dr !== 0) {
        if (!inBounds(col, prevRow) || !inBounds(prevCol, row)) break;
        if (!OPEN.has(grid[prevRow][col].t) || !OPEN.has(grid[row][prevCol].t)) break;
      }
      if (!OPEN.has(grid[row][col].t)) break;
      cells.push({ col, row });
      prevCol = col;
      prevRow = row;
    }
    return cells;
  }

  function lineFireDirForTarget(col, row, target, range) {
    const dc = target.col - col;
    const dr = target.row - row;
    const dist = Math.max(Math.abs(dc), Math.abs(dr));
    if (dist <= 0 || dist > range) return null;
    if (!(dc === 0 || dr === 0 || Math.abs(dc) === Math.abs(dr))) return null;
    const dir = dirFromDelta(dc, dr, null);
    if (!dir) return null;
    const cells = dragonFireCells({ col, row, range }, dir);
    return cells.some((cell) => cell.col === target.col && cell.row === target.row) ? dir : null;
  }

  function canLineFireFrom(col, row, target, range = 3) {
    return !!lineFireDirForTarget(col, row, target, range);
  }

  function canMeleeFrom(col, row, target) {
    const dc = target.col - col;
    const dr = target.row - row;
    if (Math.max(Math.abs(dc), Math.abs(dr)) > 1) return false;
    if (dc === 0 && dr === 0) return true;
    if (dc === 0 || dr === 0) return hasLOS(col, row, target.col, target.row);
    const sideA = inBounds(target.col, row) && OPEN.has(grid[row][target.col].t);
    const sideB = inBounds(col, target.row) && OPEN.has(grid[target.row][col].t);
    return sideA || sideB;
  }

  function isPrevCell(e, cell) {
    return e.prevCol === cell.col && e.prevRow === cell.row;
  }

  function canSwapMonsters(a, b) {
    if (!a || !b || a === b || !a.kind || !b.kind) return false;
    if (isMoving(a) || isMoving(b)) return false;
    if (cardinalDist(a, b) !== 1) return false;
    if (isMonsterForbiddenCell(a.col, a.row) || isMonsterForbiddenCell(b.col, b.row)) return false;
    if (!OPEN.has(grid[a.row][a.col].t) || !OPEN.has(grid[b.row][b.col].t)) return false;
    if (heroOrEggOccupied(a.col, a.row) || heroOrEggOccupied(b.col, b.row)) return false;
    return true;
  }

  function swapMoveCooldown(e) {
    const k = KINDS[e.kind];
    if (!k) return;
    e.moveCd = Math.max(e.moveCd || 0, Math.round(k.moveCd * rnd(0.45, 0.75)));
  }

  function swapMonsters(a, b) {
    if (!canSwapMonsters(a, b)) return false;
    const aCol = a.col;
    const aRow = a.row;
    const bCol = b.col;
    const bRow = b.row;
    beginMove(a, bCol, bRow);
    beginMove(b, aCol, aRow);
    swapMoveCooldown(b);
    return true;
  }

  function swappableMonsterNeighbors(m) {
    const out = [];
    for (const n of openNeighbors(m.col, m.row)) {
      if (isMonsterForbiddenCell(n.col, n.row)) continue;
      const other = monsterAt(n.col, n.row, m);
      if (other && canSwapMonsters(m, other)) out.push({ col: n.col, row: n.row, swapWith: other });
    }
    return out;
  }

  function moveScore(e, n, t, opts = {}) {
    const d = cheb(n, t);
    const card = cardinalDist(n, t);
    const currentD = cheb(e, t);
    const currentCard = cardinalDist(e, t);
    let score = d * 24 + card * 4;
    const canAttack = opts.attackRange ? (opts.lineFire ? canLineFireFrom(n.col, n.row, t, opts.attackRange) : canAttackFrom(n.col, n.row, opts.attackRange, t)) : false;
    if (opts.attackRange && canAttack) score -= 80;
    if (opts.preferLos && opts.attackRange && d <= opts.attackRange && !canAttack) score += 40;
    if (e.dirX === Math.sign(n.col - e.col) && e.dirY === Math.sign(n.row - e.row)) score -= 1;
    if (isPrevCell(e, n) && d >= currentD && card >= currentCard) score += 44;
    if (n.swapWith) score += 18;
    if (opts.homeLimit && e.homeCol !== undefined && cheb(n, { col: e.homeCol, row: e.homeRow }) > opts.homeLimit) score += 12;
    return score;
  }

  function applyMoveCandidate(e, candidate) {
    if (!candidate) return false;
    if (candidate.swapWith) return swapMonsters(e, candidate.swapWith);
    beginMove(e, candidate.col, candidate.row);
    return true;
  }

  function moveToward(e, t, opts = {}) {
    const free = openFreeNeighbors(e.col, e.row);
    const swaps = e.kind ? swappableMonsterNeighbors(e) : [];
    const candidates = free.concat(swaps);
    if (!candidates.length) return false;
    let best = candidates[0];
    let bestScore = Infinity;
    for (const n of candidates) {
      const score = moveScore(e, n, t, opts);
      if (score < bestScore) {
        best = n;
        bestScore = score;
      }
    }
    return applyMoveCandidate(e, best);
  }

  function wanderHome(m) {
    if (m.homeCol !== undefined && cheb(m, { col: m.homeCol, row: m.homeRow }) > 3) {
      moveToward(m, { col: m.homeCol, row: m.homeRow });
      return;
    }
    const inHomeRange = (n) => m.homeCol === undefined || cheb(n, { col: m.homeCol, row: m.homeRow }) <= 3;
    const free = openFreeNeighbors(m.col, m.row).filter(inHomeRange);
    const fresh = free.filter((n) => !isPrevCell(m, n));
    if (fresh.length && random() < 0.82) {
      const n = fresh[ri(0, fresh.length - 1)];
      beginMove(m, n.col, n.row);
      return;
    }
    if (free.length) {
      if (free.every((n) => isPrevCell(m, n)) && random() < 0.58) return;
      if (random() < 0.82) {
        const n = free[ri(0, free.length - 1)];
        beginMove(m, n.col, n.row);
      }
      return;
    }
    const swaps = swappableMonsterNeighbors(m).filter(inHomeRange);
    if (swaps.length && random() < 0.55) {
      applyMoveCandidate(m, swaps[ri(0, swaps.length - 1)]);
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

  function hpRatio(e) {
    return e.maxHp ? e.hp / e.maxHp : 1;
  }

  function heroPriority(h) {
    const c = HERO_CLASSES[h.cls] || HERO_CLASSES.warrior;
    if (c.heal) return 10;
    if (c.areaAttack) return 8;
    if (c.range >= 2) return 6;
    if (c.role === "tank") return -3;
    return 0;
  }

  function heroTargetScoreForMonster(m, h) {
    return cheb(h, m) * 80 + hpRatio(h) * 24 - heroPriority(h);
  }

  function bestHeroWithin(m, range) {
    let best = null;
    let bestScore = Infinity;
    for (const h of heroes) {
      if (isMoving(h)) continue;
      const d = cheb(h, m);
      if (d > range) continue;
      if (!hasLOS(m.col, m.row, h.col, h.row)) continue;
      const score = heroTargetScoreForMonster(m, h);
      if (score < bestScore) {
        best = h;
        bestScore = score;
      }
    }
    return best;
  }

  function bestHeroInRange(m) {
    let best = null;
    let bestScore = Infinity;
    for (const h of heroes) {
      if (isMoving(h)) continue;
      if (!canAttackFrom(m.col, m.row, m.range, h)) continue;
      const score = heroTargetScoreForMonster(m, h);
      if (score < bestScore) {
        best = h;
        bestScore = score;
      }
    }
    return best;
  }

  function heroesInFireCells(cells) {
    const keys = new Set(cells.map((cell) => `${cell.col},${cell.row}`));
    return heroes.filter((h) => !isMoving(h) && keys.has(`${h.col},${h.row}`));
  }

  function bestDragonFireAttack(m) {
    let best = null;
    let bestScore = Infinity;
    for (const dir of PIXEL_DIRS) {
      const cells = dragonFireCells(m, dir);
      if (!cells.length) continue;
      const victims = heroesInFireCells(cells);
      if (!victims.length) continue;
      let primary = victims[0];
      let primaryScore = heroTargetScoreForMonster(m, primary);
      for (const h of victims.slice(1)) {
        const score = heroTargetScoreForMonster(m, h);
        if (score < primaryScore) {
          primary = h;
          primaryScore = score;
        }
      }
      const score = primaryScore - (victims.length - 1) * 70;
      if (score < bestScore) {
        best = { dir, cells, victims, target: primary };
        bestScore = score;
      }
    }
    return best;
  }

  function breatheDragonFire(m, attack, k) {
    const end = attack.cells[attack.cells.length - 1];
    m.atkCd = k.atkCd;
    setAction(m, "cast", cx(end.col), cy(end.row), ATK_ANIM);
    effects.push({ type: "flameLine", sx: m.px, sy: m.py - 4, tx: cx(end.col), ty: cy(end.row), x: cx(end.col), y: cy(end.row), color: k.col, life: 260, max: 260, cells: attack.cells });
    for (const h of [...attack.victims]) {
      if (!heroes.includes(h)) continue;
      const dmg = heroDamageTaken(m.atk, h);
      h.hp -= dmg;
      popDmg(h.px, h.py, `-${dmg}`, "#ffcf4d");
      if (h.hp <= 0) killHero(h);
    }
  }

  function monsterTargetScoreForHero(h, m) {
    const k = KINDS[m.kind] || KINDS.slime;
    return cheb(m, h) * 80 + hpRatio(m) * 26 - Math.min(12, k.rank * 2 + k.atk * 0.15);
  }

  function bestMonsterInRange(h) {
    let best = null;
    let bestScore = Infinity;
    for (const m of monsters) {
      if (isMoving(m)) continue;
      if (!canAttackFrom(h.col, h.row, h.range, m)) continue;
      const score = monsterTargetScoreForHero(h, m);
      if (score < bestScore) {
        best = m;
        bestScore = score;
      }
    }
    return best;
  }

  function heroHealTarget(h, c) {
    let best = null;
    let bestScore = Infinity;
    for (const o of heroes) {
      if (o.hp >= o.maxHp || cheb(o, h) > c.healRange) continue;
      if (!hasLOS(h.col, h.row, o.col, o.row)) continue;
      const score = hpRatio(o) * 100 + (o === h ? 3 : 0);
      if (score < bestScore) {
        best = o;
        bestScore = score;
      }
    }
    return best;
  }

  function hasAdjacentMonster(h) {
    return monsters.some((m) => !isMoving(m) && canAttackFrom(h.col, h.row, 1, m));
  }

  function heroDamageTaken(raw, h) {
    const cls = HERO_CLASSES[h.cls] || HERO_CLASSES.warrior;
    const defense = h.defense === undefined ? (cls.defense || 0) : h.defense;
    return Math.max(1, Math.ceil(raw * 100 / Math.max(30, 100 + defense)));
  }

  function damageMonster(m, amount, color = "#fff") {
    if (!monsters.includes(m)) return false;
    m.hp -= amount;
    popDmg(m.px, m.py, `-${amount}`, color);
    if (m.hp <= 0) killMonster(m);
    return true;
  }

  function sameHeroAttackLane(h, target, m) {
    const sx = Math.sign(target.col - h.col);
    const sy = Math.sign(target.row - h.row);
    const mx = m.col - h.col;
    const my = m.row - h.row;
    if (sx === 0 && sy === 0) return false;
    if (sx === 0) return mx === 0 && Math.sign(my) === sy;
    if (sy === 0) return my === 0 && Math.sign(mx) === sx;
    return Math.sign(mx) === sx && Math.sign(my) === sy && Math.abs(mx) === Math.abs(my);
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
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) if (grid[r][c].t === "tunnel" && !isMonsterForbiddenCell(c, r)) cand.push([c, r]);
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
    const goals = new Set(coreAttackCells().map((p) => idx(p.col, p.row)));
    if (!goals.size) return null;
    let goal = -1;
    dist[s] = 0;
    while (true) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
      if (u < 0) break;
      if (goals.has(u)) {
        goal = u;
        break;
      }
      done[u] = 1;
      const c = u % COLS;
      const r = (u - c) / COLS;
      for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!inBounds(nc, nr)) continue;
        if (isCoreCell(nc, nr)) continue;
        const t = grid[nr][nc].t;
        if (t === "bedrock") continue;
        if (OPEN.has(t) && occupied(nc, nr)) continue;
        const ni = idx(nc, nr);
        const nd = dist[u] + (t === "earth" ? 10 : 1);
        if (nd < dist[ni]) {
          dist[ni] = nd;
          prev[ni] = u;
        }
      }
    }
    if (goal < 0 || dist[goal] === Infinity) return null;
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
      const entryPending = spawnQueue.length > 0;
      m.atkCd -= dt;
      m.moveCd -= dt;
      m.eatCd -= dt;
      updateVisualPosition(m, dt);
      m.atkAnim = Math.max(0, (m.atkAnim || 0) - dt);
      m.actionTime = Math.max(0, (m.actionTime || 0) - dt);
      m.bornAnim = Math.max(0, (m.bornAnim || 0) - dt);
      if (isMoving(m)) continue;
      const fireAttack = !entryPending && k.lineFire ? bestDragonFireAttack(m) : null;
      const heroTarget = !entryPending ? (k.lineFire ? (fireAttack && fireAttack.target) : bestHeroInRange(m)) : null;
      if (heroTarget) {
        faceToward(m, heroTarget.px, heroTarget.py);
        if (m.atkCd <= 0) {
          if (fireAttack) {
            breatheDragonFire(m, fireAttack, k);
          } else {
            const dmg = heroDamageTaken(m.atk, heroTarget);
            heroTarget.hp -= dmg;
            popDmg(heroTarget.px, heroTarget.py, `-${dmg}`, m.kind === "spitter" ? "#b6ff7a" : "#ff8a8a");
            m.atkCd = k.atkCd;
            setAction(m, m.range >= 2 ? "cast" : "attack", heroTarget.px, heroTarget.py, ATK_ANIM);
            if (m.range >= 2) shoot(m.px, m.py - 4, heroTarget.px, heroTarget.py, "#9bff5a");
            else slash(heroTarget.px, heroTarget.py, "#ffd0d0");
            if (heroTarget.hp <= 0) killHero(heroTarget);
          }
        }
        continue;
      }
      const aggroHero = entryPending ? null : bestHeroWithin(m, k.aggro);
      if (aggroHero) faceToward(m, aggroHero.px, aggroHero.py);
      if (!aggroHero && m.eatCd <= 0) {
        m.eatCd = EAT_CHECK * rnd(0.85, 1.25);
        if (tryEatLower(m)) continue;
      }
      if (m.moveCd <= 0) {
        if (aggroHero) moveToward(m, aggroHero, { attackRange: k.range, preferLos: k.range > 1, lineFire: !!k.lineFire, homeLimit: 5 });
        else wanderHome(m);
        m.moveCd = k.moveCd + rnd(-80, 120);
      }
    }
  }

  function updateHeroes(dt) {
    for (const h of [...heroes]) {
      if (!heroes.includes(h)) continue;
      const c = HERO_CLASSES[h.cls];
      const entryPending = spawnQueue.length > 0;
      h.atkCd -= dt;
      h.actCd -= dt;
      h.coreCd -= dt;
      h.healCd -= dt;
      updateVisualPosition(h, dt);
      h.atkAnim = Math.max(0, (h.atkAnim || 0) - dt);
      h.actionTime = Math.max(0, (h.actionTime || 0) - dt);
      if (entryPending) continue;
      if (isMoving(h)) continue;
      if (c.heal && h.healCd <= 0) {
        const target = heroHealTarget(h, c);
        if (target) {
          const amount = resolveHeroStats(h.cls, h.wave).heal;
          target.hp = Math.min(target.maxHp, target.hp + amount);
          slash(target.px, target.py - 2, "#9effa0");
          popDmg(target.px, target.py - 10, `+${amount}`, "#9effa0");
          h.healCd = c.healCd;
          setAction(h, "heal", target.px, target.py, ATK_ANIM);
        } else {
          h.healCd = 300;
        }
      }
      const monsterTarget = bestMonsterInRange(h);
      if (monsterTarget) faceToward(h, monsterTarget.px, monsterTarget.py);
      if (monsterTarget && h.atkCd <= 0) {
        h.atkCd = c.atkCd;
        const ranged = h.range >= 2 || c.areaAttack;
        setAction(h, ranged ? "cast" : "attack", monsterTarget.px, monsterTarget.py, ATK_ANIM);
        if (ranged) shoot(h.px, h.py - 6, monsterTarget.px, monsterTarget.py, c.areaAttack ? "#fff0a6" : "#b6a6ff");
        else slash(monsterTarget.px, monsterTarget.py, "#ffffff");
        damageMonster(monsterTarget, h.atk, "#fff");
        if (c.areaAttack) {
          let extra = 0;
          const areaDmg = Math.max(1, Math.round(h.atk * (c.areaScale || 0.65)));
          for (const m of [...monsters]) {
            if (m === monsterTarget || isMoving(m) || cheb(m, h) > h.range) continue;
            if (!sameHeroAttackLane(h, monsterTarget, m)) continue;
            if (!hasLOS(h.col, h.row, m.col, m.row)) continue;
            shoot(h.px, h.py - 8, m.px, m.py, "#ffe680");
            damageMonster(m, areaDmg, "#fff0a6");
            extra++;
            if (extra >= (c.areaMax || 3)) break;
          }
        }
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
      if (isCoreAttackCell(h.col, h.row)) {
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
              clearVein(step.tile, true);
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
    if (spawnQueue.length === 0 && heroes.length === 0) {
      waveCountdown -= dt;
      if (waveCountdown <= 0) startWave();
    }
    for (let i = spawnQueue.length - 1; i >= 0; i--) {
      spawnQueue[i].delay -= dt;
      if (spawnQueue[i].delay <= 0) {
        if (heroes.length < MAX_HEROES && spawnHero(spawnQueue[i].cls)) {
          spawnQueue.splice(i, 1);
        } else {
          spawnQueue[i].delay = 800;
        }
      }
    }
    updateVeinTouchEvolution();
    updateVeinSpawning(dt);
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

  function resetGame(seed = options.seed ?? autoSeed()) {
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
    veinSpawnTimer = 0;
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
    let yLift = 0;
    let scale = 1;
    let rot = 0;
    const c = e.cls ? HERO_CLASSES[e.cls] : null;
    if (e.actionType === "eat") {
      power = 12;
      scale = 1 + 0.18 * waveSin;
      rot = 0.12 * waveSin * Math.sign(dx || 1);
    } else if (e.actionType === "cast") {
      power = c && c.areaAttack ? -1 : -3;
      yLift = c && c.areaAttack ? -4 : -2;
      scale = 1 + (c && c.areaAttack ? 0.12 : 0.08) * waveSin;
      rot = -0.08 * waveSin * Math.sign(dx || 1);
    } else if (e.actionType === "heal") {
      power = -1;
      yLift = -5;
      scale = 1 + 0.1 * waveSin;
      rot = -0.05 * waveSin * Math.sign(dx || 1);
    } else if (e.actionType === "attack") {
      if (c) {
        power = 0;
        scale = 1;
        rot = 0;
      } else {
        power = 7;
        scale = 1 + 0.05 * waveSin;
        rot = 0.1 * waveSin * Math.sign(dx || 1);
      }
    } else if (e.actionType === "dig") {
      power = 6;
      rot = 0.16 * waveSin * Math.sign(dx || 1);
    }
    return { x: dx / d * power * waveSin, y: dy / d * power * waveSin + yLift * waveSin, scale, rot };
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
    updateVeinTouchEvolution, updateVeinAging, updateVeinSpawning, veinSpawnChance, veinTypeSpawnWeight, veinTouchNeed, veinNextTouchNeed, evoStageOf, soilManaOf, beginMove, updateVisualPosition, setAction, actorPose,
    dirFromDelta, faceToward, actorAction, spawnMonster, spawnHero, spawnInTunnel, spawnEgg,
    pickHeroClass, heroClassWeightForWave, heroStep, openNeighbors, openFreeNeighbors, hasLOS, dragonFireCells, occupied, actorOccupied,
    isHeroEntryZone, isCoreCell, isCoreAttackCell, isMonsterForbiddenCell,
    countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, evoLevelOf, canBeEatenBy, canLayEgg, rankOf,
    resolveHeroStats, heroDamageTaken,
    KINDS, VEIN, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HEROES_PER_WAVE_CAP,
    VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, heroDigDmg, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
    SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
    MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
    PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD,
  };
}

export const Core = {
  VEIN, KINDS, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HEROES_PER_WAVE_CAP,
  VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
  EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
  SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
  MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
  PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
  PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, heroDigDmg, resolveHeroStats, cx, cy,
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
