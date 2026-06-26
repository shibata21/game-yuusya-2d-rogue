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
export const MAX_WAVE = 15;
export const WAVE_INTERVAL = 10000;
export const FIRST_GRACE = 27000;
export const HERO_STAGGER = 520;
export const HERO_ENTRY_HOLD = 500;
export const MOVEMENT_TICK = 100;
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
export const AMULET_WAVE_DROP_CHANCE = 0.35;
export const REAPER_SPAWN_CHANCE = 0.002;

export const RULE_CONSTANT_KEYS = [
  "DIG_COST",
  "START_NUT",
  "CORE_MAX",
  "MONSTER_CAP",
  "BREED_LIMIT",
  "MAX_HEROES",
  "HEROES_PER_WAVE_CAP",
  "MAX_WAVE",
  "WAVE_INTERVAL",
  "FIRST_GRACE",
  "HERO_STAGGER",
  "HERO_ENTRY_HOLD",
  "MOVEMENT_TICK",
  "VEIN_CAP",
  "VEIN_SPAWN_TICK",
  "VEIN_SPAWN_BASE_CHANCE",
  "VEIN_SPAWN_SOIL_WEIGHT",
  "VEIN_SPAWN_SOIL_CHANCES",
  "VEIN_SPAWN_BURST_CAP",
  "EGG_HATCH",
  "EGG_CHECK",
  "EGG_CHANCE",
  "EGG_KIND_CAP",
  "EAT_CHECK",
  "EAT_CHANCE_STEP",
  "SOIL_MANA_MAX_STAGE",
  "SOIL_CHARGE_MOVES",
  "SOIL_MANA_EVO_STEP",
  "SOIL_MANA_EVO_MAX",
  "EFFECT_CAP",
  "ATK_ANIM",
  "MOVE_ANIM",
  "DIG_BREAK",
  "DIG_CD",
  "BORN_ANIM",
  "EVO_TIME",
  "VEIN_FADE_START",
  "VEIN_DECAY_TIME",
  "AMULET_WAVE_DROP_CHANCE",
  "REAPER_SPAWN_CHANCE",
];

export const RULE_TABLE_NUMBER_KEYS = {
  kinds: ["hp", "atk", "range", "moveCd", "atkCd", "aggro", "rank", "breedEvery", "breedCap", "eggChance", "evoLevel"],
  veins: ["unlock", "touchNeed", "finalTouchNeed", "spawnWeight", "soilAffinity"],
  heroes: ["rank", "hpMul", "atkMul", "defense", "range", "moveMul", "atkCd", "weight", "unlock", "healCd", "healRange", "healMul", "areaScale", "areaMax", "maxPerWave", "dodgeChance", "critChance", "critMul"],
};

export const AMULETS = {
  family: { name: "家族写真", passive: true, icon: "写", profile: "同じ種族が多いほど、その種族全体の攻撃力が上がる。" },
  dogtag: { name: "ドッグタグ", passive: true, icon: "札", profile: "死んだ魔物がドッグタグを落とし、拾った魔物は体力が全快する。" },
  lastStick: { name: "最後の一本", passive: false, icon: "火", profile: "取得ウェーブに残った魔物の攻撃力が1.5倍になる。" },
  whiskey: { name: "ウイスキー", passive: false, icon: "酒", profile: "取得ウェーブに残った魔物の体力が2倍になる。" },
  letter: { name: "遺書", passive: true, icon: "遺", profile: "冒険者の攻撃力が0.9倍に下がる。" },
  cards: { name: "トランプ", passive: true, icon: "札", profile: "一定期間戦闘に参加していない魔物の体力が中回復する。" },
  coinPurse: { name: "小銭入れ", passive: true, icon: "銭", profile: "冒険者を倒したときに得る栄養が増える。" },
  stitchedBear: { name: "手縫いのくまちゃん", passive: true, icon: "縫", profile: "最後の魔物が倒れた時、倒れた魔物の力を縫い合わせて一度だけキメラを呼ぶ。" },
};

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
  reaper: { hp: 430, atk: 68, range: 1, moveCd: 520, atkCd: 620, aggro: 6, rank: 10, breedEvery: 0, breedCap: 1, col: "#b7c6d6", name: "死神", profile: "倒れた冒険者の影からまれに現れる。鎌の手入れだけは妙に几帳面。" },
  chimera: { hp: 1, atk: 1, range: 1, moveCd: 540, atkCd: 600, aggro: 8, rank: 11, breedEvery: 0, breedCap: 1, col: "#d7835a", name: "キメラ", profile: "手縫いのくまちゃんが倒れた魔物の力を縫い合わせて呼ぶ、一時の怪物。" },
};

export const VEIN = {
  moss: { kind: "slime", evoKind: "superslime", finalKind: "crownslime", unlock: 1, color: "#6fcf6f", core: "#bdf7bd", legend: "苔脈→スライム", evoName: "上位苔脈", finalEvoName: "王冠苔脈", touchNeed: 4, finalTouchNeed: 14, spawnWeight: 3.0, soilAffinity: 0 },
  meat: { kind: "carniv", evoKind: "evolved", finalKind: "direfang", unlock: 1, color: "#e63a2c", core: "#ffb39e", legend: "牙脈→牙獣", evoName: "上位牙脈", finalEvoName: "裂牙脈", touchNeed: 7, finalTouchNeed: 22, spawnWeight: 1.6, soilAffinity: 1 },
  venom: { kind: "spitter", evoKind: "tarantula", finalKind: "goldweaver", unlock: 3, color: "#a64dff", core: "#e0bcff", legend: "毒脈→毒蜘蛛", evoName: "上位毒脈", finalEvoName: "金糸毒脈", touchNeed: 10, finalTouchNeed: 34, spawnWeight: 1.1, soilAffinity: 3, unlockMsg: "新たな鉱脈『毒脈』 ─ 毒蜘蛛が眠る" },
  stone: { kind: "golem", evoKind: "titan", finalKind: "goldcore", unlock: 6, color: "#6f86c4", core: "#bcd0ff", legend: "石脈→ゴーレム", evoName: "上位石脈", finalEvoName: "金核石脈", touchNeed: 13, finalTouchNeed: 50, spawnWeight: 0.8, soilAffinity: 5, unlockMsg: "新たな鉱脈『石脈』 ─ ゴーレムが眠る" },
  ember: { kind: "flame", evoKind: "infernal", finalKind: "whiteflame", unlock: 9, color: "#ffae26", core: "#ffe39a", legend: "火脈→火竜", evoName: "上位火脈", finalEvoName: "白炎火脈", touchNeed: 16, finalTouchNeed: 70, spawnWeight: 0.7, soilAffinity: 6, unlockMsg: "新たな鉱脈『火脈』 ─ 火竜が眠る" },
};

export const HERO_CLASSES = {
  warrior: { name: "冒険者", role: "fighter", rank: 1, hpMul: 1.0, atkMul: 1.0, defense: 0, range: 1, moveMul: 1.0, atkCd: 650, weight: 3.0, unlock: 1, weapon: "sword", profile: "村で一番まじめな若者。出発前に全員へ『行ってきます』を二回言った。" },
  tank: { name: "タンク冒険者", role: "tank", rank: 1, hpMul: 2.4, atkMul: 0.55, defense: 55, range: 1, moveMul: 1.55, atkCd: 850, weight: 1.25, unlock: 3, weapon: "greatshield", msg: "タンク冒険者が現れた ─ 大楯で迷宮へ迫る", profile: "大楯の裏に予定表を書いている。雨の日は全部にじむ。" },
  mage: { name: "魔法使い", role: "caster", rank: 1, hpMul: 0.55, atkMul: 1.45, defense: -10, range: 3, moveMul: 1.0, atkCd: 900, weight: 1.15, unlock: 4, weapon: "staff", msg: "魔法使いが現れた ─ 遠くから魔物を撃つ", profile: "杖をなくす夢をよく見る。起きてから毎回、杖に謝る。" },
  superwarrior: { name: "スーパー冒険者", role: "fighter", rank: 2, hpMul: 1.05, atkMul: 1.25, defense: 4, range: 1, moveMul: 0.96, atkCd: 620, weight: 1.45, unlock: 5, weapon: "spear", msg: "スーパー冒険者が現れた ─ 槍の突きが鋭い", profile: "槍を磨く時間が長い。集合に遅れる理由もだいたい槍。" },
  priest: { name: "僧侶", role: "healer", rank: 1, hpMul: 1.15, atkMul: 0.35, defense: 8, range: 1, moveMul: 1.0, atkCd: 1000, weight: 0.95, unlock: 6, weapon: "rod", heal: true, areaHeal: true, healCd: 950, healRange: 2, healMul: 1.8, msg: "僧侶が現れた ─ 仲間を癒やす", profile: "祈りは丁寧だが、会計の割り勘だけ妙に早い。" },
  ultrawarrior: { name: "ウルトラ冒険者", role: "fighter", rank: 3, hpMul: 1.25, atkMul: 1.38, defense: 18, range: 1, moveMul: 1.08, atkCd: 680, weight: 1.15, unlock: 7, weapon: "sword_shield", msg: "ウルトラ冒険者が現れた ─ 剣と盾で押し込む", profile: "育ちのいいエリート。宿の枕が低いと翌日の正義感が少し落ちる。" },
  supermage: { name: "スーパー魔法使い", role: "caster", rank: 2, hpMul: 0.62, atkMul: 1.75, defense: -10, range: 3, moveMul: 1.0, atkCd: 880, weight: 0.75, unlock: 8, weapon: "gem_staff", msg: "スーパー魔法使いが現れた ─ 魔石の飛び道具が強い", profile: "魔石の産地を聞かれると急に早口になる。" },
  crossknight: { name: "十字騎士団", role: "fighter", rank: 4, hpMul: 1.55, atkMul: 1.55, defense: 28, range: 1, moveMul: 1.12, atkCd: 660, weight: 0.85, unlock: 10, weapon: "cross_shield", msg: "十字騎士団が現れた ─ 終盤の重装部隊", profile: "規律が厳しい。号令が長すぎて、突撃前に一度休憩が入る。" },
  saint: { name: "聖女", role: "healer", rank: 2, hpMul: 1.45, atkMul: 0.45, defense: 14, range: 1, moveMul: 1.08, atkCd: 1050, weight: 0.55, unlock: 11, weapon: "saint_rod", heal: true, areaHeal: true, healCd: 720, healRange: 3, healMul: 3.3, msg: "聖女が現れた ─ 仲間を大きく癒やす", profile: "微笑むと寄付箱が重くなる。本人は偶然だと言い張っている。" },
  sage: { name: "賢者", role: "caster", rank: 3, hpMul: 0.72, atkMul: 1.95, defense: -8, range: 4, moveMul: 1.05, atkCd: 1050, weight: 0.45, unlock: 11, weapon: "glow_staff", areaAttack: true, areaScale: 0.65, areaMax: 3, msg: "賢者が現れた ─ 光る杖で列を薙ぐ", profile: "知らないことも知っている顔で聞く。沈黙が長いほど怪しい。" },
  captain: { name: "騎士団長", role: "fighter", rank: 5, hpMul: 1.85, atkMul: 1.75, defense: 42, range: 1, moveMul: 1.0, atkCd: 600, weight: 0.35, unlock: 12, weapon: "gold_sword_shield", maxPerWave: 1, msg: "騎士団長が現れた ─ 金色の剣と盾を持つ強敵", profile: "金色装備は自腹らしい。部下には節約をすすめるので微妙な空気になる。" },
  max: { name: "マックス", role: "fighter", rank: 6, hpMul: 2.05, atkMul: 2.05, defense: 30, range: 1, moveMul: 0.85, atkCd: 520, weight: 0.36, unlock: 13, weapon: "fist", dodgeChance: 0.20, critChance: 0.20, critMul: 5, maxPerWave: 1, msg: "マックスが現れた ─ 黒いロングコートの格闘冒険者", profile: "黒いロングコートとサングラスで迷宮に入る。拳が当たると冗談では済まない。" },
  shon: { name: "ション", role: "caster", rank: 7, hpMul: 1.95, atkMul: 2.20, defense: 18, range: 4, moveMul: 0.9, atkCd: 620, weight: 0.32, unlock: 14, weapon: "handgun", dodgeChance: 0.38, maxPerWave: 1, msg: "ションが現れた ─ ハンドガンを構える冒険者", profile: "ジャケット姿で銃口だけが迷いなく動く。回避の一歩がやけに小さい。" },
  hori: { name: "ホリ", role: "fighter", rank: 8, hpMul: 2.75, atkMul: 2.35, defense: 34, range: 3, moveMul: 1.25, atkCd: 780, weight: 0.28, unlock: 15, weapon: "rocket", dodgeChance: 0.08, maxPerWave: 1, msg: "ホリが現れた ─ ロケットと拳と野菜で押し込む", profile: "ベッカムヘアの太った男。攻撃手段が多すぎて本人も順番を忘れる。" },
};

const RULE_CONSTANT_DEFAULTS = {
  DIG_COST,
  START_NUT,
  CORE_MAX,
  MONSTER_CAP,
  BREED_LIMIT,
  MAX_HEROES,
  HEROES_PER_WAVE_CAP,
  MAX_WAVE,
  WAVE_INTERVAL,
  FIRST_GRACE,
  HERO_STAGGER,
  HERO_ENTRY_HOLD,
  MOVEMENT_TICK,
  VEIN_CAP,
  VEIN_SPAWN_TICK,
  VEIN_SPAWN_BASE_CHANCE,
  VEIN_SPAWN_SOIL_WEIGHT,
  VEIN_SPAWN_SOIL_CHANCES,
  VEIN_SPAWN_BURST_CAP,
  EGG_HATCH,
  EGG_CHECK,
  EGG_CHANCE,
  EGG_KIND_CAP,
  EAT_CHECK,
  EAT_CHANCE_STEP,
  SOIL_MANA_MAX_STAGE,
  SOIL_CHARGE_MOVES,
  SOIL_MANA_EVO_STEP,
  SOIL_MANA_EVO_MAX,
  EFFECT_CAP,
  ATK_ANIM,
  MOVE_ANIM,
  DIG_BREAK,
  DIG_CD,
  BORN_ANIM,
  EVO_TIME,
  VEIN_FADE_START,
  VEIN_DECAY_TIME,
  AMULET_WAVE_DROP_CHANCE,
  REAPER_SPAWN_CHANCE,
};

function clonePlain(value) {
  if (Array.isArray(value)) return value.map(clonePlain);
  if (value && typeof value === "object") {
    const out = {};
    for (const key in value) out[key] = clonePlain(value[key]);
    return out;
  }
  return value;
}

function toFiniteNumber(value) {
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sanitizeNumberArray(base, value) {
  const raw = Array.isArray(value)
    ? value
    : (typeof value === "string" ? value.split(",") : null);
  if (!raw) return base.slice();
  const parsed = raw.map(toFiniteNumber).filter((n) => n !== null);
  return parsed.length ? parsed : base.slice();
}

function pickNumberTable(source, keys) {
  const out = {};
  for (const id in source) {
    out[id] = {};
    for (const key of keys) {
      if (typeof source[id][key] === "number") out[id][key] = source[id][key];
    }
  }
  return out;
}

function mergeNumberTable(baseTable, sourceTable) {
  if (!sourceTable || typeof sourceTable !== "object") return baseTable;
  for (const id in baseTable) {
    const sourceRow = sourceTable[id];
    if (!sourceRow || typeof sourceRow !== "object") continue;
    for (const key in baseTable[id]) {
      const parsed = toFiniteNumber(sourceRow[key]);
      if (parsed !== null) baseTable[id][key] = parsed;
    }
  }
  return baseTable;
}

function mergeRuntimeTable(baseRows, numberRows) {
  const out = clonePlain(baseRows);
  if (!numberRows || typeof numberRows !== "object") return out;
  for (const id in out) {
    const sourceRow = numberRows[id];
    if (!sourceRow || typeof sourceRow !== "object") continue;
    for (const key in sourceRow) {
      const parsed = toFiniteNumber(sourceRow[key]);
      if (parsed !== null && typeof out[id][key] === "number") out[id][key] = parsed;
    }
  }
  return out;
}

function buildDefaultRuleConfig() {
  const constants = {};
  for (const key of RULE_CONSTANT_KEYS) constants[key] = clonePlain(RULE_CONSTANT_DEFAULTS[key]);
  return {
    constants,
    kinds: pickNumberTable(KINDS, RULE_TABLE_NUMBER_KEYS.kinds),
    veins: pickNumberTable(VEIN, RULE_TABLE_NUMBER_KEYS.veins),
    heroes: pickNumberTable(HERO_CLASSES, RULE_TABLE_NUMBER_KEYS.heroes),
  };
}

export const DEFAULT_RULE_CONFIG = buildDefaultRuleConfig();

export function createRuleConfig(overrides = {}) {
  if (!overrides || typeof overrides !== "object") overrides = {};
  const base = clonePlain(DEFAULT_RULE_CONFIG);
  const sourceConstants = overrides.constants || {};
  for (const key of RULE_CONSTANT_KEYS) {
    if (!(key in sourceConstants)) continue;
    if (Array.isArray(base.constants[key])) base.constants[key] = sanitizeNumberArray(base.constants[key], sourceConstants[key]);
    else {
      const parsed = toFiniteNumber(sourceConstants[key]);
      if (parsed !== null) base.constants[key] = parsed;
    }
  }
  if ("VEIN_SPAWN_BASE_CHANCE" in sourceConstants && !("VEIN_SPAWN_SOIL_CHANCES" in sourceConstants)) {
    base.constants.VEIN_SPAWN_SOIL_CHANCES[0] = base.constants.VEIN_SPAWN_BASE_CHANCE;
  }
  mergeNumberTable(base.kinds, overrides.kinds || overrides.KINDS);
  mergeNumberTable(base.veins, overrides.veins || overrides.VEIN);
  mergeNumberTable(base.heroes, overrides.heroes || overrides.HERO_CLASSES);
  return base;
}

function createRuntimeTables(ruleConfig) {
  return {
    KINDS: mergeRuntimeTable(KINDS, ruleConfig.kinds),
    VEIN: mergeRuntimeTable(VEIN, ruleConfig.veins),
    HERO_CLASSES: mergeRuntimeTable(HERO_CLASSES, ruleConfig.heroes),
  };
}

export const PIXEL_ASSET_PATH = "assets/pixel/";
export const PIXEL_ASSET_VERSION = "v20-amulet-icons";
export const PIXEL_CELL = 48;
export const PIXEL_FRAMES = 4;
export const PIXEL_DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
export const PIXEL_ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat", "dodge"];
export const PIXEL_ACTORS = ["slime", "carniv", "evolved", "spitter", "golem", "flame", "superslime", "tarantula", "titan", "infernal", "crownslime", "direfang", "goldweaver", "goldcore", "whiteflame", "reaper", "chimera", "warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "priest", "saint", "mage", "supermage", "sage", "egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"];
export const PIXEL_TILES = ["earth", "tunnel", "bedrock", "surface", "core", "moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo", "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2"];
export const PIXEL_EFFECTS = ["slash", "shot", "bite", "birth", "puff"];
export const PIXEL_AMULETS = ["family", "dogtag", "lastStick", "whiskey", "letter", "cards", "coinPurse", "stitchedBear"];
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

export function pixelActorFrameIndex(name, action, dir, frame) {
  const row = PIXEL_ACTORS.indexOf(name);
  if (row < 0) return 0;
  const framesPerRow = PIXEL_FRAMES * PIXEL_DIRS.length * PIXEL_ACTIONS.length;
  return row * framesPerRow + Math.floor(pixelActorX(action, dir, frame) / PIXEL_CELL);
}

export function pixelAmuletFrameIndex(id) {
  const col = PIXEL_AMULETS.indexOf(id);
  return col < 0 ? 0 : col;
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
  const ruleConfig = createRuleConfig(options.ruleConfig);
  const runtimeTables = createRuntimeTables(ruleConfig);
  const {
    DIG_COST,
    START_NUT,
    CORE_MAX,
    MONSTER_CAP,
    BREED_LIMIT,
    MAX_HEROES,
    HEROES_PER_WAVE_CAP,
    MAX_WAVE,
    WAVE_INTERVAL,
    FIRST_GRACE,
    HERO_STAGGER,
    HERO_ENTRY_HOLD,
    MOVEMENT_TICK,
    VEIN_CAP,
    VEIN_SPAWN_TICK,
    VEIN_SPAWN_BASE_CHANCE,
    VEIN_SPAWN_SOIL_WEIGHT,
    VEIN_SPAWN_SOIL_CHANCES,
    VEIN_SPAWN_BURST_CAP,
    EGG_HATCH,
    EGG_CHECK,
    EGG_CHANCE,
    EGG_KIND_CAP,
    EAT_CHECK,
    EAT_CHANCE_STEP,
    SOIL_MANA_MAX_STAGE,
    SOIL_CHARGE_MOVES,
    SOIL_MANA_EVO_STEP,
    SOIL_MANA_EVO_MAX,
    EFFECT_CAP,
    ATK_ANIM,
    MOVE_ANIM,
    DIG_BREAK,
    DIG_CD,
    BORN_ANIM,
    EVO_TIME,
    VEIN_FADE_START,
    VEIN_DECAY_TIME,
    AMULET_WAVE_DROP_CHANCE,
    REAPER_SPAWN_CHANCE,
  } = ruleConfig.constants;
  const { KINDS, VEIN, HERO_CLASSES } = runtimeTables;
  let grid = [];
  let monsters = [];
  let heroes = [];
  let eggs = [];
  let effects = [];
  let spawnQueue = [];
  let pickups = [];
  let amulets = [];
  let pendingAmulets = [];
  let amuletOffer = null;
  let amuletEvents = [];
  let usedAmulets = new Set();
  let deadMonsterMemory = { count: 0, hp: 0, atk: 0 };
  let unlocked = new Set();
  let nutrients = START_NUT;
  let coreHP = CORE_MAX;
  let wave = 0;
  let score = 0;
  let kills = 0;
  let playerDigCount = 0;
  let waveCountdown = FIRST_GRACE;
  let heroEntryHold = 0;
  let waveSettled = 0;
  let movementTickTimer = 0;
  let veinSpawnTimer = 0;
  let events = [];
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
    .filter((p) => inBounds(p.col, p.row) && grid[p.row][p.col].t !== "bedrock" && canCoreAttackFrom(p.col, p.row, false));
  const isCoreAttackCell = (col, row) => cheb({ col, row }, { col: CORE_COL, row: CORE_ROW }) === 1;

  function resolveHeroStats(cls, wave) {
    const c = HERO_CLASSES[cls] || HERO_CLASSES.warrior;
    const w = Math.max(0, wave || 0);
    const hp = Math.max(12, Math.round((26 + w * 8) * c.hpMul));
    const atk = Math.max(1, Math.round((4 + w * 1.2) * c.atkMul));
    const heal = c.heal ? Math.max(1, Math.round((6 + w * 1.5) * (c.healMul || 1))) : 0;
    return { hp, atk, defense: c.defense || 0, range: c.range, heal };
  }

  function emitEvent(type, data = {}) {
    events.push({ type, ...data });
  }

  function drainEvents() {
    const out = events;
    events = [];
    return out;
  }

  function canCoreAttackFrom(col, row, checkOccupied = true) {
    if (!isCoreAttackCell(col, row)) return false;
    const dc = CORE_COL - col;
    const dr = CORE_ROW - row;
    if (Math.abs(dc) + Math.abs(dr) === 1) return true;
    const sideA = inBounds(CORE_COL, row) && OPEN.has(grid[row][CORE_COL].t) && (!checkOccupied || !actorOccupied(CORE_COL, row));
    const sideB = inBounds(col, CORE_ROW) && OPEN.has(grid[CORE_ROW][col].t) && (!checkOccupied || !actorOccupied(col, CORE_ROW));
    return sideA && sideB;
  }

  function digCost() {
    return DIG_COST;
  }

  function monsterIncomeRate() {
    return 0.045;
  }

  function hasAmulet(id) {
    return amulets.includes(id);
  }

  function monsterAttackPower(m) {
    if (!m) return 1;
    let power = m.atk || 1;
    if (hasAmulet("family")) {
      let same = 0;
      for (const o of monsters) if (o.kind === m.kind) same++;
      power *= 1 + Math.min(0.6, Math.max(0, same - 1) * 0.06);
    }
    return Math.max(1, Math.round(power));
  }

  function heroAttackPower(h) {
    let power = h.atk || 1;
    if (hasAmulet("letter")) power *= 0.9;
    return Math.max(1, Math.round(power));
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
    return actorOccupied(col, row);
  }

  function actorOccupied(col, row) {
    return monsters.some((m) => m.col === col && m.row === row) ||
      heroes.some((h) => h.col === col && h.row === row);
  }

  function actorAt(col, row, except = null) {
    return monsters.find((m) => m !== except && m.col === col && m.row === row) ||
      heroes.find((h) => h !== except && h.col === col && h.row === row) ||
      null;
  }

  function monsterAt(col, row, except = null) {
    return monsters.find((m) => m !== except && m.col === col && m.row === row) || null;
  }

  function heroOccupied(col, row) {
    return heroes.some((h) => h.col === col && h.row === row);
  }

  function eggOccupied(col, row, except = null) {
    return eggs.some((e) => e !== except && e.col === col && e.row === row);
  }

  function openFreeNeighbors(col, row) {
    return openNeighbors(col, row).filter((n) => !isMonsterForbiddenCell(n.col, n.row) && !actorOccupied(n.col, n.row));
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

  function chooseAmuletOfferChoices() {
    const pool = Object.keys(AMULETS).filter((id) => !hasAmulet(id));
    const choices = [];
    while (pool.length && choices.length < 3) {
      const idx = ri(0, pool.length - 1);
      choices.push(pool.splice(idx, 1)[0]);
    }
    return choices;
  }

  function triggerAmulet(id, life = 1200) {
    if (!AMULETS[id]) return;
    amuletEvents.push({ id, life, max: life });
  }

  function applyAmulet(id) {
    if (!AMULETS[id] || hasAmulet(id)) return false;
    amulets.push(id);
    triggerAmulet(id);
    if (id === "lastStick") {
      for (const m of monsters) {
        m.atk = Math.max(1, Math.round((m.atk || 1) * 1.5));
        popDmg(m.px, m.py, "攻↑", "#ffcf4d");
      }
    } else if (id === "whiskey") {
      for (const m of monsters) {
        m.maxHp = Math.max(1, Math.round((m.maxHp || 1) * 2));
        m.hp = Math.max(1, Math.round((m.hp || 1) * 2));
        popDmg(m.px, m.py, "体↑", "#ffcf4d");
      }
    }
    return true;
  }

  function settleWave() {
    if (wave <= 0 || waveSettled >= wave) return;
    waveSettled = wave;
    if (wave >= MAX_WAVE) {
      gameState = "clear";
      banner("迷宮を守り抜いた");
      return;
    }
    if (random() < AMULET_WAVE_DROP_CHANCE) {
      const choices = chooseAmuletOfferChoices();
      if (choices.length) {
        amuletOffer = { wave, choices };
        gameState = "amuletChoice";
        banner("お守りを見つけた");
      }
    }
  }

  function chooseAmuletOffer(id = null) {
    if (!amuletOffer) return false;
    if (id === null) {
      amuletOffer = null;
      if (gameState === "amuletChoice") gameState = "playing";
      banner("お守りを見送った");
      return true;
    }
    if (!amuletOffer.choices.includes(id) || hasAmulet(id)) return false;
    if (!applyAmulet(id)) return false;
    banner(`お守り『${AMULETS[id].name}』を入手`);
    amuletOffer = null;
    if (gameState === "amuletChoice") gameState = "playing";
    return true;
  }

  function bestChimeraTarget() {
    if (heroes.length) {
      const sorted = [...heroes].sort((a, b) => cardinalDist(a, { col: CORE_COL, row: CORE_ROW }) - cardinalDist(b, { col: CORE_COL, row: CORE_ROW }));
      return sorted[0];
    }
    return { col: ENTRANCE_COL, row: 2, px: cx(ENTRANCE_COL), py: cy(2) };
  }

  function recordDeadMonster(m) {
    if (!m || m.kind === "chimera") return;
    deadMonsterMemory.count++;
    deadMonsterMemory.hp += Math.max(1, Math.round(m.maxHp || m.hp || 1));
    deadMonsterMemory.atk += monsterAttackPower(m);
  }

  function tryStitchedBear() {
    if (!hasAmulet("stitchedBear") || usedAmulets.has("stitchedBear")) return false;
    if (monsters.length > 0 || heroes.length <= 0 || deadMonsterMemory.count < 2) return false;
    const target = bestChimeraTarget();
    const chimera = spawnMonsterNear("chimera", target.col, target.row, 3);
    if (!chimera) return false;
    chimera.maxHp = Math.max(1, Math.round(deadMonsterMemory.hp * 0.55));
    chimera.hp = chimera.maxHp;
    chimera.atk = Math.max(1, Math.round(deadMonsterMemory.atk * 0.35));
    chimera.ttl = 22000;
    chimera.stitchedBearBorn = true;
    setAction(chimera, "cast", target.px, target.py, 360);
    effects.push({ type: "birth", x: chimera.px, y: chimera.py, life: 520, max: 520, color: KINDS.chimera.col });
    triggerAmulet("stitchedBear", 1600);
    usedAmulets.add("stitchedBear");
    banner("手縫いのくまちゃん ─ キメラが出現");
    return true;
  }

  function isDigTarget(col, row) {
    if (!inBounds(col, row)) return false;
    const tile = grid[row][col];
    if (!tile || tile.t !== "earth") return false;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr) && !isCoreCell(nc, nr) && OPEN.has(grid[nr][nc].t)) return true;
    }
    return false;
  }

  function isDiggable(col, row) {
    return gameState === "playing" && isDigTarget(col, row) && nutrients >= digCost(row);
  }

  function tryDig(col, row) {
    if (gameState !== "playing" || !isDigTarget(col, row)) return;
    const tile = grid[row][col];
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
    playerDigCount++;
    effects.push({ type: "dig", x: cx(col), y: cy(row), life: 340, max: 340 });
  }

  function spawnMonster(kind, col, row) {
    if (monsters.length >= MONSTER_CAP || !KINDS[kind]) return;
    if (!inBounds(col, row) || isMonsterForbiddenCell(col, row)) return;
    const k = KINDS[kind];
    monsters.push({
      id: ++idc, kind, col, row, px: cx(col), py: cy(row), bob: rnd(0, 6.28), faceDir: spawnFaceDir(col, row),
      homeCol: col, homeRow: row, hp: k.hp, maxHp: k.hp, atk: k.atk, range: k.range,
      moveCd: k.moveCd, moveCharge: rnd(0, 0.35), moveWait: 0, moveIntent: null, atkCd: 0, eggCd: EGG_CHECK * rnd(0.7, 1.3), eatCd: EAT_CHECK * rnd(0.6, 1.2),
      breedCd: k.breedEvery ? k.breedEvery * rnd(0.6, 1.2) : 0, breedLeft: k.breedEvery ? BREED_LIMIT : 0,
      prevCol: null, prevRow: null, soilSteps: 0, bornAnim: BORN_ANIM, atkAnim: 0, atkTX: 0, atkTY: 0, actionType: "idle", actionTime: 0, moveAnim: 0,
      nonCombatMs: 0, cardsHealCd: 0,
    });
    emitEvent("discoverMonster", { kind });
  }

  function spawnMonsterNear(kind, col, row, radius = 2) {
    const cand = [];
    for (let r = row - radius; r <= row + radius; r++) for (let c = col - radius; c <= col + radius; c++) {
      if (!inBounds(c, r) || isMonsterForbiddenCell(c, r) || !OPEN.has(grid[r][c].t) || actorOccupied(c, r)) continue;
      cand.push({ col: c, row: r, d: cheb({ col: c, row: r }, { col, row }) });
    }
    cand.sort((a, b) => a.d - b.d || a.row - b.row || a.col - b.col);
    const spot = cand[0];
    if (spot) {
      const before = monsters.length;
      spawnMonster(kind, spot.col, spot.row);
      return monsters.length > before ? monsters[monsters.length - 1] : null;
    }
    return spawnInTunnel(kind) ? monsters[monsters.length - 1] : null;
  }

  function spawnEgg(kind, col, row) {
    if (monsters.length + eggs.length >= MONSTER_CAP) return false;
    if (!canLayEgg(kind) || !inBounds(col, row) || isMonsterForbiddenCell(col, row) || !OPEN.has(grid[row][col].t) || eggOccupied(col, row)) return false;
    eggs.push({ kind, col, row, hatchCd: EGG_HATCH, bornAnim: BORN_ANIM });
    effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[kind].col });
    return true;
  }

  function eggCount(kind) {
    return eggs.filter((e) => e.kind === kind).length;
  }

  function eggSpot(m) {
    const cand = [];
    for (const n of openNeighbors(m.col, m.row)) {
      if (!isMonsterForbiddenCell(n.col, n.row) && !actorOccupied(n.col, n.row) && !eggOccupied(n.col, n.row)) cand.push(n);
    }
    return cand.length ? cand[ri(0, cand.length - 1)] : null;
  }

  function hatchSpot(egg) {
    if (!inBounds(egg.col, egg.row) || isMonsterForbiddenCell(egg.col, egg.row) || !OPEN.has(grid[egg.row][egg.col].t)) return null;
    const canHatchAt = (col, row) => inBounds(col, row) &&
      !isMonsterForbiddenCell(col, row) &&
      OPEN.has(grid[row][col].t) &&
      !actorOccupied(col, row) &&
      !eggOccupied(col, row, egg);
    if (canHatchAt(egg.col, egg.row)) return { col: egg.col, row: egg.row };
    const seen = new Set([`${egg.col},${egg.row}`]);
    const q = [{ col: egg.col, row: egg.row, d: 0 }];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur.d >= 2) continue;
      for (const n of openNeighbors(cur.col, cur.row)) {
        const key = `${n.col},${n.row}`;
        if (seen.has(key) || isMonsterForbiddenCell(n.col, n.row)) continue;
        seen.add(key);
        if (canHatchAt(n.col, n.row)) return n;
        q.push({ col: n.col, row: n.row, d: cur.d + 1 });
      }
    }
    return null;
  }

  function updateEggs(dt) {
    for (let i = eggs.length - 1; i >= 0; i--) {
      const e = eggs[i];
      e.hatchCd -= dt;
      e.bornAnim = Math.max(0, (e.bornAnim || 0) - dt);
      if (e.hatchCd > 0) continue;
      if (monsters.length >= MONSTER_CAP) {
        e.hatchCd = 1000;
        continue;
      }
      const spot = hatchSpot(e);
      if (!spot) {
        e.hatchCd = 250;
        continue;
      }
      spawnMonster(e.kind, spot.col, spot.row);
      const mo = monsters[monsters.length - 1];
      if (mo) mo.bornAnim = BORN_ANIM;
      eggs.splice(i, 1);
    }
  }

  function updateEliteEggBreeding(dt) {
    for (const m of monsters) if (canLayEgg(m.kind)) m.eggCd = (m.eggCd === undefined ? EGG_CHECK : m.eggCd) - dt;
    for (const m of monsters) {
      if (!canLayEgg(m.kind) || m.eggCd > 0) continue;
      m.eggCd = EGG_CHECK * rnd(0.9, 1.25);
      if (eggCount(m.kind) >= EGG_KIND_CAP) continue;
      if (random() < Math.min(0.95, KINDS[m.kind].eggChance)) {
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
    if (m.hp >= m.maxHp) return false;
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
    const desiredRank = Math.min(8, 1 + Math.floor((Math.max(1, w) - 1) / 2));
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
      hp: stats.hp, maxHp: stats.hp, atk: stats.atk, defense: stats.defense, range: stats.range, wave, moveCd: Math.round(720 * c.moveMul), moveCharge: 0, moveWait: 0, moveIntent: null, atkCd: 0,
      coreCd: 0, actCd: 300, healCd: 800, blockedMs: 0, atkAnim: 0, atkTX: 0, atkTY: 0,
      bob: rnd(0, 6.28), actionType: "idle", actionTime: 0, moveAnim: 0,
    });
    emitEvent("discoverHero", { cls });
    return true;
  }

  function startWave() {
    if (wave >= MAX_WAVE) {
      settleWave();
      return;
    }
    wave++;
    emitEvent("waveReached", { wave });
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
    if (opts.homeLimit && e.homeCol !== undefined && cheb(n, { col: e.homeCol, row: e.homeRow }) > opts.homeLimit) score += 12;
    return score;
  }

  function monsterOpenCell(col, row) {
    return inBounds(col, row) && !isMonsterForbiddenCell(col, row) && OPEN.has(grid[row][col].t);
  }

  function reachableMonsterCells(col, row) {
    if (!monsterOpenCell(col, row)) return [];
    const out = [];
    const seen = new Set([`${col},${row}`]);
    const q = [{ col, row }];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      out.push(cur);
      for (const n of openNeighbors(cur.col, cur.row)) {
        const key = `${n.col},${n.row}`;
        if (seen.has(key) || !monsterOpenCell(n.col, n.row)) continue;
        seen.add(key);
        q.push(n);
      }
    }
    return out;
  }

  function validWanderTarget(m) {
    return m.wanderTarget &&
      monsterOpenCell(m.wanderTarget.col, m.wanderTarget.row) &&
      reachableMonsterCells(m.col, m.row).some((cell) => cell.col === m.wanderTarget.col && cell.row === m.wanderTarget.row);
  }

  function chooseWanderTarget(m) {
    const cells = reachableMonsterCells(m.col, m.row).filter((cell) => cell.col !== m.col || cell.row !== m.row);
    if (!cells.length) {
      m.wanderTarget = null;
      return null;
    }
    const target = cells[ri(0, cells.length - 1)];
    m.wanderTarget = { col: target.col, row: target.row };
    return m.wanderTarget;
  }

  function firstMonsterStepToward(m, target) {
    if (!target || (m.col === target.col && m.row === target.row)) return null;
    const seen = new Set([`${m.col},${m.row}`]);
    const prev = new Map();
    const q = [{ col: m.col, row: m.row }];
    let found = null;
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur.col === target.col && cur.row === target.row) {
        found = cur;
        break;
      }
      for (const n of openNeighbors(cur.col, cur.row)) {
        const key = `${n.col},${n.row}`;
        if (seen.has(key) || !monsterOpenCell(n.col, n.row)) continue;
        seen.add(key);
        prev.set(key, cur);
        q.push(n);
      }
    }
    if (!found) return null;
    let step = found;
    while (true) {
      const p = prev.get(`${step.col},${step.row}`);
      if (!p) return null;
      if (p.col === m.col && p.row === m.row) return step;
      step = p;
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

  function monsterHasAttackableHero(m) {
    if (!m || !monsters.includes(m) || isMoving(m)) return false;
    const k = KINDS[m.kind];
    if (!k) return false;
    return k.lineFire ? !!bestDragonFireAttack(m) : !!bestHeroInRange(m);
  }

  function breatheDragonFire(m, attack, k) {
    const end = attack.cells[attack.cells.length - 1];
    m.atkCd = k.atkCd;
    m.nonCombatMs = 0;
    setAction(m, "cast", cx(end.col), cy(end.row), ATK_ANIM);
    effects.push({ type: "flameLine", sx: m.px, sy: m.py - 4, tx: cx(end.col), ty: cy(end.row), x: cx(end.col), y: cy(end.row), color: k.col, life: 500, max: 500, cells: attack.cells });
    for (const h of [...attack.victims]) {
      if (!heroes.includes(h)) continue;
      damageHero(h, monsterAttackPower(m), m, "#ffcf4d");
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

  function heroHealTargets(h, c) {
    const targets = [];
    for (const o of heroes) {
      if (o.hp >= o.maxHp || cheb(o, h) > c.healRange) continue;
      if (!hasLOS(h.col, h.row, o.col, o.row)) continue;
      targets.push(o);
    }
    targets.sort((a, b) => hpRatio(a) - hpRatio(b) || (a === h ? 1 : 0) - (b === h ? 1 : 0));
    return targets;
  }

  function hasAdjacentMonster(h) {
    return monsters.some((m) => !isMoving(m) && canAttackFrom(h.col, h.row, 1, m));
  }

  function heroDamageTaken(raw, h) {
    const cls = HERO_CLASSES[h.cls] || HERO_CLASSES.warrior;
    const defense = h.defense === undefined ? (cls.defense || 0) : h.defense;
    return Math.max(1, Math.ceil(raw * 100 / Math.max(30, 100 + defense)));
  }

  function tryHeroDodge(h, source = null) {
    const cls = HERO_CLASSES[h.cls] || HERO_CLASSES.warrior;
    const chance = cls.dodgeChance || 0;
    if (chance <= 0 || random() >= chance) return false;
    const tx = source ? ((h.px ?? cx(h.col)) - ((source.px ?? cx(source.col)) - (h.px ?? cx(h.col)))) : (h.px ?? cx(h.col));
    const ty = source ? ((h.py ?? cy(h.row)) - ((source.py ?? cy(source.row)) - (h.py ?? cy(h.row)))) : (h.py ?? cy(h.row));
    setAction(h, "dodge", tx, ty, 220);
    popDmg(h.px, h.py, "回避", "#9fe8ff");
    return true;
  }

  function damageHero(h, raw, source = null, color = "#ff8a8a") {
    if (!heroes.includes(h)) return false;
    if (tryHeroDodge(h, source)) return false;
    const dmg = heroDamageTaken(raw, h);
    h.hp -= dmg;
    popDmg(h.px, h.py, `-${dmg}`, color);
    if (h.hp <= 0) killHero(h);
    return true;
  }

  function damageMonster(m, amount, color = "#fff") {
    if (!monsters.includes(m)) return false;
    m.nonCombatMs = 0;
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
    if (i >= 0) recordDeadMonster(m);
    if (i >= 0) monsters.splice(i, 1);
    if (hasAmulet("dogtag") && inBounds(m.col, m.row) && OPEN.has(grid[m.row][m.col].t)) {
      pickups.push({ type: "dogtag", col: m.col, row: m.row, x: m.px, y: m.py, life: 12000, max: 12000 });
    }
    tryStitchedBear();
    effects.push({ type: "puff", x: m.px, y: m.py, life: 300, max: 300, color: "#5fd16b" });
  }

  function killHero(h) {
    const i = heroes.indexOf(h);
    if (i >= 0) heroes.splice(i, 1);
    const hasCoinPurse = hasAmulet("coinPurse");
    const reward = Math.round((4 + h.wave) * (hasCoinPurse ? 1.5 : 1));
    nutrients += reward;
    score += 80 * h.wave + 20;
    kills++;
    popDmg(h.px, h.py, `+${reward}`, "#ffcf4d");
    if (hasCoinPurse) triggerAmulet("coinPurse");
    effects.push({ type: "puff", x: h.px, y: h.py, life: 340, max: 340, color: "#cfd8e3" });
    if (random() < REAPER_SPAWN_CHANCE) {
      const reaper = spawnMonsterNear("reaper", h.col, h.row, 1);
      if (reaper) {
        setAction(reaper, "cast", h.px, h.py, 360);
        effects.push({ type: "birth", x: reaper.px, y: reaper.py, life: 520, max: 520, color: KINDS.reaper.col });
        banner("死神が現れた");
      }
    }
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

  function heroPathCandidates(h, opts = {}) {
    const n = COLS * ROWS;
    const dist = new Float64Array(n);
    const done = new Uint8Array(n);
    dist.fill(Infinity);
    const idx = (c, r) => r * COLS + c;
    const canPath = (col, row) => inBounds(col, row) && !isCoreCell(col, row) && grid[row][col].t !== "bedrock";
    const goals = coreAttackCells().filter((p) => canPath(p.col, p.row));
    if (!goals.length) return [];
    for (const g of goals) dist[idx(g.col, g.row)] = 0;
    while (true) {
      let u = -1;
      let best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
      if (u < 0) break;
      done[u] = 1;
      const c = u % COLS;
      const r = (u - c) / COLS;
      for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const nc = c + dc;
        const nr = r + dr;
        if (!canPath(nc, nr)) continue;
        const ni = idx(nc, nr);
        const nd = dist[u] + (grid[r][c].t === "earth" ? 10 : 1);
        if (nd < dist[ni]) {
          dist[ni] = nd;
        }
      }
    }
    const out = [];
    for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const col = h.col + dc;
      const row = h.row + dr;
      if (!canPath(col, row)) continue;
      const tile = grid[row][col];
      if (tile.t === "earth" && opts.allowEarth === false) continue;
      if (OPEN.has(tile.t) && !opts.includeOccupied && actorOccupied(col, row)) continue;
      const score = dist[idx(col, row)] + (tile.t === "earth" ? 0.2 : 0);
      if (score < Infinity) out.push({ col, row, tile, score });
    }
    out.sort((a, b) => a.score - b.score || a.row - b.row || a.col - b.col);
    return out;
  }

  function heroStep(h) {
    return heroPathCandidates(h, { allowEarth: true, includeOccupied: false })[0] || null;
  }

  function cellKey(col, row) {
    return `${col},${row}`;
  }

  function actorMoveInterval(e) {
    const base = e.moveCd || (e.kind && KINDS[e.kind] && KINDS[e.kind].moveCd) || MOVEMENT_TICK;
    return Math.max(MOVEMENT_TICK, Math.round(base));
  }

  function actorCanMoveTo(e, col, row) {
    if (!inBounds(col, row)) return false;
    if (e.kind) return monsterOpenCell(col, row);
    if (e.cls) return OPEN.has(grid[row][col].t) && !isCoreCell(col, row);
    return false;
  }

  function addUniqueCandidate(out, seen, col, row, score) {
    const key = cellKey(col, row);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ col, row, tile: grid[row][col], score });
  }

  function monsterChaseCandidates(m, intent) {
    const target = intent && intent.target;
    if (!target) return [];
    const out = [];
    const seen = new Set();
    for (const n of openNeighbors(m.col, m.row)) {
      if (!actorCanMoveTo(m, n.col, n.row)) continue;
      const score = moveScore(m, n, target, intent.opts || {});
      addUniqueCandidate(out, seen, n.col, n.row, score);
    }
    out.sort((a, b) => a.score - b.score || a.row - b.row || a.col - b.col);
    return out.slice(0, 4);
  }

  function monsterWanderCandidates(m) {
    const neighbors = openNeighbors(m.col, m.row).filter((n) => actorCanMoveTo(m, n.col, n.row));
    if (neighbors.length && neighbors.every((n) => isPrevCell(m, n)) && random() < 0.58) return [];
    if (!validWanderTarget(m) || (m.wanderTarget.col === m.col && m.wanderTarget.row === m.row)) chooseWanderTarget(m);
    const out = [];
    const seen = new Set();
    const step = firstMonsterStepToward(m, m.wanderTarget);
    if (step && actorCanMoveTo(m, step.col, step.row)) addUniqueCandidate(out, seen, step.col, step.row, 0);
    for (const n of neighbors) {
      const backtrack = isPrevCell(m, n) ? 70 : 0;
      const targetCost = m.wanderTarget ? cardinalDist(n, m.wanderTarget) * 8 : 20;
      addUniqueCandidate(out, seen, n.col, n.row, 60 + backtrack + targetCost + rnd(0, 3));
    }
    out.sort((a, b) => a.score - b.score || a.row - b.row || a.col - b.col);
    return out.slice(0, 4);
  }

  function heroMoveCandidates(h) {
    return heroPathCandidates(h, { allowEarth: false, includeOccupied: true })
      .filter((n) => actorCanMoveTo(h, n.col, n.row))
      .slice(0, 4);
  }

  function movementPriority(e, intent) {
    if (!intent) return 0;
    let base = 0;
    if (e.kind && intent.kind === "chase") base = 80;
    else if (e.cls && intent.kind === "unblock") base = 75;
    else if (e.cls) base = 60;
    else if (e.kind) base = 20;
    return base + Math.min(30, Math.floor((e.moveWait || 0) / 300));
  }

  function buildMoveRequest(e) {
    if (!e.moveIntent || isMoving(e) || (e.moveCharge || 0) < 1) return null;
    const candidates = e.kind
      ? (e.moveIntent.kind === "chase" ? monsterChaseCandidates(e, e.moveIntent) : monsterWanderCandidates(e))
      : heroMoveCandidates(e);
    if (!candidates.length) return null;
    return {
      actor: e,
      intent: e.moveIntent,
      fromCol: e.col,
      fromRow: e.row,
      fromKey: cellKey(e.col, e.row),
      priority: movementPriority(e, e.moveIntent),
      candidates,
    };
  }

  function movementCreatesCycle(req, cand, accepted) {
    let occupant = actorAt(cand.col, cand.row, req.actor);
    const seen = new Set([req.actor.id]);
    while (occupant) {
      const move = accepted.get(occupant);
      if (!move) return false;
      const nextKey = cellKey(move.toCol, move.toRow);
      if (nextKey === req.fromKey) return true;
      if (seen.has(occupant.id)) return false;
      seen.add(occupant.id);
      occupant = actorAt(move.toCol, move.toRow, req.actor);
    }
    return false;
  }

  function canAcceptMove(req, cand, accepted, reserved) {
    const toKey = cellKey(cand.col, cand.row);
    if (reserved.has(toKey)) return false;
    const occupant = actorAt(cand.col, cand.row, req.actor);
    if (!occupant) return true;
    const occupantMove = accepted.get(occupant);
    if (!occupantMove) return false;
    if (cellKey(occupantMove.toCol, occupantMove.toRow) === toKey) return false;
    return !movementCreatesCycle(req, cand, accepted);
  }

  function acceptMove(req, cand, accepted, reserved) {
    accepted.set(req.actor, { req, toCol: cand.col, toRow: cand.row, score: cand.score });
    reserved.set(cellKey(cand.col, cand.row), req.actor);
  }

  function runMovementReservationTick() {
    const actors = monsters.concat(heroes);
    const ready = [];
    for (const e of actors) {
      if (isMoving(e)) continue;
      if ((e.moveCd || 0) <= 0) e.moveCharge = Math.max(e.moveCharge || 0, 1);
      else e.moveCharge = Math.min(3, (e.moveCharge || 0) + MOVEMENT_TICK / actorMoveInterval(e));
      if ((e.moveCharge || 0) >= 1 && e.moveIntent) ready.push(e);
    }
    const requests = ready.map(buildMoveRequest).filter(Boolean);
    requests.sort((a, b) => b.priority - a.priority || (b.actor.moveWait || 0) - (a.actor.moveWait || 0) || a.candidates[0].score - b.candidates[0].score || a.actor.id - b.actor.id);

    const pending = new Set(requests);
    const accepted = new Map();
    const reserved = new Map();
    let changed = true;
    while (changed) {
      changed = false;
      for (const req of requests) {
        if (!pending.has(req)) continue;
        for (const cand of req.candidates) {
          if (!canAcceptMove(req, cand, accepted, reserved)) continue;
          acceptMove(req, cand, accepted, reserved);
          pending.delete(req);
          changed = true;
          break;
        }
      }
    }

    for (const move of accepted.values()) {
      const e = move.req.actor;
      if (!monsters.includes(e) && !heroes.includes(e)) continue;
      beginMove(e, move.toCol, move.toRow);
      e.moveCharge = Math.max(0, (e.moveCharge || 0) - 1);
      e.moveWait = 0;
      if (e.kind && e.wanderTarget && e.col === e.wanderTarget.col && e.row === e.wanderTarget.row) e.wanderTarget = null;
      if (e.cls && move.req.intent.kind === "unblock") e.blockedMs = 0;
    }

    for (const e of ready) {
      if (accepted.has(e)) continue;
      e.moveWait = Math.min(9000, (e.moveWait || 0) + MOVEMENT_TICK);
    }
  }

  function updateActorMovement(dt, entryPaused = false) {
    if (entryPaused) {
      movementTickTimer = 0;
      return;
    }
    movementTickTimer += dt;
    while (movementTickTimer >= MOVEMENT_TICK) {
      movementTickTimer -= MOVEMENT_TICK;
      runMovementReservationTick();
    }
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

  function updateMonsters(dt, entryPaused = false) {
    for (const m of [...monsters]) {
      if (!monsters.includes(m)) continue;
      const k = KINDS[m.kind];
      m.moveIntent = null;
      m.atkCd -= dt;
      m.eatCd -= dt;
      updateVisualPosition(m, dt);
      m.atkAnim = Math.max(0, (m.atkAnim || 0) - dt);
      m.actionTime = Math.max(0, (m.actionTime || 0) - dt);
      m.bornAnim = Math.max(0, (m.bornAnim || 0) - dt);
      if (entryPaused) continue;
      if (isMoving(m)) continue;
      const fireAttack = k.lineFire ? bestDragonFireAttack(m) : null;
      const heroTarget = k.lineFire ? (fireAttack && fireAttack.target) : bestHeroInRange(m);
      if (heroTarget) {
        faceToward(m, heroTarget.px, heroTarget.py);
        if (m.atkCd <= 0) {
          if (fireAttack) {
            breatheDragonFire(m, fireAttack, k);
          } else {
            m.nonCombatMs = 0;
            m.atkCd = k.atkCd;
            setAction(m, m.range >= 2 ? "cast" : "attack", heroTarget.px, heroTarget.py, ATK_ANIM);
            if (m.range >= 2) shoot(m.px, m.py - 4, heroTarget.px, heroTarget.py, "#9bff5a");
            else slash(heroTarget.px, heroTarget.py, "#ffd0d0");
            damageHero(heroTarget, monsterAttackPower(m), m, m.kind === "spitter" ? "#b6ff7a" : "#ff8a8a");
          }
        }
        continue;
      }
      const aggroHero = bestHeroWithin(m, k.aggro);
      if (aggroHero) faceToward(m, aggroHero.px, aggroHero.py);
      if (!aggroHero && m.eatCd <= 0) {
        m.eatCd = EAT_CHECK * rnd(0.85, 1.25);
        if (tryEatLower(m)) continue;
      }
      if (aggroHero) m.moveIntent = { kind: "chase", target: aggroHero, opts: { attackRange: k.range, preferLos: k.range > 1, lineFire: !!k.lineFire } };
      else m.moveIntent = { kind: "wander" };
    }
  }

  function performHeroAttack(h, c, monsterTarget) {
    h.atkCd = c.atkCd;
    let damage = heroAttackPower(h);
    let action = h.range >= 2 || c.areaAttack ? "cast" : "attack";
    let ranged = h.range >= 2 || c.areaAttack;
    let shotColor = c.areaAttack ? "#fff0a6" : "#b6a6ff";
    let slashColor = "#ffffff";
    const dist = cheb(h, monsterTarget);
    if (h.cls === "hori") {
      const roll = random();
      if (roll < 0.22 && h.hp < h.maxHp) {
        const amount = Math.max(1, Math.round(h.maxHp * 0.45));
        h.hp = Math.min(h.maxHp, h.hp + amount);
        popDmg(h.px, h.py - 10, `+${amount}`, "#9effa0");
        setAction(h, "eat", h.px, h.py, ATK_ANIM);
        effects.push({ type: "healArea", x: h.px, y: h.py, radius: TILE * 0.9, color: "#9effa0", life: 260, max: 260 });
        return;
      }
      if (roll < 0.62 || dist > 1) {
        damage = Math.max(1, Math.round(damage * 1.35));
        action = "cast";
        ranged = true;
        shotColor = "#ff9f43";
      } else {
        action = "attack";
        ranged = false;
        slashColor = "#fff7dc";
      }
    } else if (h.cls === "shon") {
      action = "attack";
      ranged = true;
      shotColor = "#cfd8e3";
    }
    if (c.critChance && random() < c.critChance) {
      damage = Math.max(1, Math.round(damage * (c.critMul || 2)));
      popDmg(monsterTarget.px, monsterTarget.py - 12, "会心", "#ffcf4d");
    }
    setAction(h, action, monsterTarget.px, monsterTarget.py, ATK_ANIM);
    if (ranged) shoot(h.px, h.py - 6, monsterTarget.px, monsterTarget.py, shotColor);
    else slash(monsterTarget.px, monsterTarget.py, slashColor);
    damageMonster(monsterTarget, damage, "#fff");
    if (c.areaAttack) {
      let extra = 0;
      const areaDmg = Math.max(1, Math.round(damage * (c.areaScale || 0.65)));
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
  }

  function updateHeroes(dt, entryPaused = false) {
    for (const h of [...heroes]) {
      if (!heroes.includes(h)) continue;
      const c = HERO_CLASSES[h.cls];
      h.moveIntent = null;
      h.atkCd -= dt;
      h.actCd -= dt;
      h.coreCd -= dt;
      h.healCd -= dt;
      updateVisualPosition(h, dt);
      h.atkAnim = Math.max(0, (h.atkAnim || 0) - dt);
      h.actionTime = Math.max(0, (h.actionTime || 0) - dt);
      if (entryPaused) continue;
      if (isMoving(h)) continue;
      if (c.heal && h.healCd <= 0) {
        const targets = c.areaHeal ? heroHealTargets(h, c) : [];
        const target = c.areaHeal ? targets[0] : heroHealTarget(h, c);
        if (target) {
          const amount = resolveHeroStats(h.cls, h.wave).heal;
          const healed = c.areaHeal ? targets : [target];
          effects.push({ type: "healArea", x: h.px, y: h.py, radius: (c.healRange + 0.55) * TILE, color: h.cls === "saint" ? "#fff1a6" : "#9effa0", life: 360, max: 360 });
          for (const o of healed) {
            o.hp = Math.min(o.maxHp, o.hp + amount);
            slash(o.px, o.py - 2, h.cls === "saint" ? "#fff1a6" : "#9effa0");
            popDmg(o.px, o.py - 10, `+${amount}`, h.cls === "saint" ? "#fff1a6" : "#9effa0");
          }
          h.healCd = c.healCd;
          setAction(h, "heal", target.px, target.py, ATK_ANIM);
        } else {
          h.healCd = 300;
        }
      }
      const monsterTarget = bestMonsterInRange(h);
      if (monsterTarget) faceToward(h, monsterTarget.px, monsterTarget.py);
      if (monsterTarget && h.atkCd <= 0) {
        performHeroAttack(h, c, monsterTarget);
        continue;
      }
      if (hasAdjacentMonster(h)) {
        h.blockedMs += dt;
        if (h.blockedMs > 4500) {
          if (heroMoveCandidates(h).length) h.moveIntent = { kind: "unblock" };
        }
        continue;
      }
      h.blockedMs = 0;
      if (canCoreAttackFrom(h.col, h.row)) {
        if (h.coreCd <= 0) {
          const dmg = heroAttackPower(h);
          coreHP -= dmg;
          popDmg(cx(CORE_COL), cy(CORE_ROW) - 10, `-${dmg}`, "#e0556b");
          effects.push({ type: "corehit", x: cx(CORE_COL), y: cy(CORE_ROW), color: "#e0556b", life: 420, max: 420 });
          effects.push({ type: "coreShock", x: cx(CORE_COL), y: cy(CORE_ROW), color: "#ff3355", life: 460, max: 460 });
          h.coreCd = 1100;
          setAction(h, "attack", cx(CORE_COL), cy(CORE_ROW), ATK_ANIM);
        }
        continue;
      }
      if (h.actCd <= 0) {
        const step = heroPathCandidates(h, { allowEarth: true, includeOccupied: true })[0] || null;
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
            h.moveIntent = { kind: "core" };
          }
        } else {
          h.actCd = 400;
        }
      }
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.life -= dt;
      const taker = monsters.find((m) => !isMoving(m) && cheb(m, p) <= 1);
      if (taker) {
        taker.hp = taker.maxHp;
        taker.nonCombatMs = 0;
        popDmg(taker.px, taker.py - 8, "全快", "#9effa0");
        effects.push({ type: "birth", x: taker.px, y: taker.py, life: 260, max: 260, color: "#9effa0" });
        triggerAmulet("dogtag");
        pickups.splice(i, 1);
      } else if (p.life <= 0) {
        pickups.splice(i, 1);
      }
    }
  }

  function updateAmuletPassives(dt) {
    if (!hasAmulet("cards")) return;
    for (const m of monsters) {
      m.nonCombatMs = (m.nonCombatMs || 0) + dt;
      m.cardsHealCd = Math.max(0, (m.cardsHealCd || 0) - dt);
      if (m.nonCombatMs < 12000 || m.cardsHealCd > 0 || m.hp >= m.maxHp) continue;
      const amount = Math.max(1, Math.round(m.maxHp * 0.2));
      m.hp = Math.min(m.maxHp, m.hp + amount);
      m.cardsHealCd = 6000;
      triggerAmulet("cards");
      popDmg(m.px, m.py - 10, `+${amount}`, "#9effa0");
    }
  }

  function updateAmuletEvents(dt) {
    for (let i = amuletEvents.length - 1; i >= 0; i--) {
      amuletEvents[i].life -= dt;
      if (amuletEvents[i].life <= 0) amuletEvents.splice(i, 1);
    }
  }

  function updateMonsterTtl(dt) {
    for (const m of [...monsters]) {
      if (!monsters.includes(m) || !m.ttl) continue;
      m.ttl -= dt;
      if (m.ttl > 0) continue;
      const i = monsters.indexOf(m);
      if (i >= 0) monsters.splice(i, 1);
      effects.push({ type: "puff", x: m.px, y: m.py, life: 360, max: 360, color: KINDS[m.kind] ? KINDS[m.kind].col : "#cfd8e3" });
      popDmg(m.px, m.py, "消滅", "#cfd8e3");
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

  function clearCoreHitEffects() {
    effects = effects.filter((f) => f.type !== "corehit" && f.type !== "coreShock");
  }

  function update(dt) {
    if (gameState !== "playing") return;
    if (spawnQueue.length === 0 && heroes.length === 0) {
      settleWave();
      if (gameState !== "playing") {
        return;
      }
      waveCountdown -= dt;
      if (waveCountdown <= 0) startWave();
    }
    const hadSpawnQueue = spawnQueue.length > 0;
    let spawnedHero = false;
    for (let i = spawnQueue.length - 1; i >= 0; i--) {
      spawnQueue[i].delay -= dt;
      if (spawnQueue[i].delay <= 0) {
        if (heroes.length < MAX_HEROES && spawnHero(spawnQueue[i].cls)) {
          spawnQueue.splice(i, 1);
          spawnedHero = true;
        } else {
          spawnQueue[i].delay = 800;
        }
      }
    }
    const holdStarted = hadSpawnQueue && spawnedHero && spawnQueue.length === 0 && heroes.length > 0;
    if (holdStarted) heroEntryHold = HERO_ENTRY_HOLD;
    const entryPaused = spawnQueue.length > 0 || heroEntryHold > 0;
    updateVeinTouchEvolution();
    updateVeinSpawning(dt);
    updateVeinAging(dt);
    updateEggs(dt);
    if (!entryPaused) {
      updateEliteEggBreeding(dt);
      updateLowerBreeding(dt);
    }
    nutrients += monsterIncomeRate() * (dt / 1000);
    updateMonsters(dt, entryPaused);
    updateHeroes(dt, entryPaused);
    updatePickups(dt);
    updateAmuletPassives(dt);
    updateMonsterTtl(dt);
    updateActorMovement(dt, entryPaused);
    if (heroEntryHold > 0 && !holdStarted) heroEntryHold = Math.max(0, heroEntryHold - dt);
    updateAmuletEvents(dt);
    updateEffects(dt);
    if (coreHP <= 0) {
      coreHP = 0;
      clearCoreHitEffects();
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
    pickups = [];
    amulets = [];
    pendingAmulets = [];
    amuletOffer = null;
    amuletEvents = [];
    usedAmulets = new Set();
    deadMonsterMemory = { count: 0, hp: 0, atk: 0 };
    nutrients = START_NUT;
    coreHP = CORE_MAX;
    wave = 0;
    score = 0;
    kills = 0;
    playerDigCount = 0;
    waveCountdown = FIRST_GRACE;
    heroEntryHold = 0;
    waveSettled = 0;
    movementTickTimer = 0;
    veinSpawnTimer = 0;
    events = [];
    idc = 0;
    unlocked = new Set(Object.keys(VEIN).filter((key) => VEIN[key].unlock <= 1));
    gameState = "playing";
    buildGrid();
  }

  function startGame() {
    resetGame(options.seed ?? autoSeed());
    gameState = "playing";
  }

  function gameOver() {
    clearCoreHitEffects();
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
    } else if (e.actionType === "dodge") {
      power = -9;
      yLift = -3;
      scale = 0.94 + 0.06 * Math.cos(p * Math.PI);
      rot = -0.18 * waveSin * Math.sign(dx || 1);
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
    get pickups() { return pickups; },
    get amulets() { return amulets; },
    get pendingAmulets() { return pendingAmulets; },
    get amuletOffer() { return amuletOffer ? { wave: amuletOffer.wave, choices: [...amuletOffer.choices] } : null; },
    get amuletEvents() { return amuletEvents; },
    get usedAmulets() { return [...usedAmulets]; },
    get deadMonsterMemory() { return { ...deadMonsterMemory }; },
    get unlocked() { return unlocked; },
    get wave() { return wave; },
    set wave(v) { wave = v; },
    get coreHP() { return coreHP; },
    set coreHP(v) { coreHP = v; },
    get nutrients() { return nutrients; },
    set nutrients(v) { nutrients = v; },
    get score() { return score; },
    get kills() { return kills; },
    get playerDigCount() { return playerDigCount; },
    get waveCountdown() { return waveCountdown; },
    set waveCountdown(v) { waveCountdown = v; },
    get heroEntryHold() { return heroEntryHold; },
    set heroEntryHold(v) { heroEntryHold = v; },
    get waveSettled() { return waveSettled; },
    get gameState() { return gameState; },
    set gameState(v) { gameState = v; },
    get ruleConfig() { return clonePlain(ruleConfig); },
    setRandom(fn) { random = fn; },
    update, resetGame, startGame, gameOver, tryDig, isDiggable, startWave, tauntEarly, settleWave, chooseAmuletOffer, clearCoreHitEffects, drainEvents,
    hasAmulet, applyAmulet,
    updateVeinTouchEvolution, updateVeinAging, updateVeinSpawning, veinSpawnChance, veinTypeSpawnWeight, veinTouchNeed, veinNextTouchNeed, evoStageOf, soilManaOf, beginMove, updateVisualPosition, setAction, actorPose,
    dirFromDelta, faceToward, actorAction, spawnMonster, spawnHero, spawnInTunnel, spawnEgg,
    pickHeroClass, heroClassWeightForWave, heroStep, openNeighbors, openFreeNeighbors, reachableMonsterCells, hasLOS, dragonFireCells, occupied, actorOccupied, eggOccupied, hatchSpot,
    isHeroEntryZone, isCoreCell, isCoreAttackCell, canCoreAttackFrom, isMonsterForbiddenCell,
    countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, evoLevelOf, canBeEatenBy, canLayEgg, rankOf,
    resolveHeroStats, heroDamageTaken, heroAttackPower, monsterAttackPower, damageHero, damageMonster,
    KINDS, VEIN, HERO_CLASSES, AMULETS, DIG_BREAK, DIG_COST, START_NUT, CORE_MAX, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HERO_ENTRY_HOLD, MOVEMENT_TICK, HEROES_PER_WAVE_CAP, MAX_WAVE,
    VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, EAT_CHECK, EAT_CHANCE_STEP, heroDigDmg, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
    SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
    VEIN_CAP, EFFECT_CAP, MONSTER_CAP, MAX_HEROES, BREED_LIMIT, AMULET_WAVE_DROP_CHANCE, REAPER_SPAWN_CHANCE, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS, PIXEL_AMULETS,
    PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, pixelActorFrameIndex, pixelAmuletFrameIndex, cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD,
  };
}

export const Core = {
  DEFAULT_RULE_CONFIG, RULE_CONSTANT_KEYS, RULE_TABLE_NUMBER_KEYS, createRuleConfig,
  VEIN, KINDS, HERO_CLASSES, AMULETS, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HERO_ENTRY_HOLD, MOVEMENT_TICK, HEROES_PER_WAVE_CAP, MAX_WAVE,
  VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
  EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
  SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
  CORE_MAX, VEIN_CAP, EAT_CHECK, EAT_CHANCE_STEP, EFFECT_CAP, MONSTER_CAP, MAX_HEROES, BREED_LIMIT, AMULET_WAVE_DROP_CHANCE, REAPER_SPAWN_CHANCE, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
  PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS, PIXEL_AMULETS,
  PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, pixelActorFrameIndex, pixelAmuletFrameIndex, heroDigDmg, resolveHeroStats, cx, cy,
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
