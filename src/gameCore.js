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
export const WAVE_SETTLE_DELAY = 900;
export const MOVEMENT_TICK = 100;
export const VEIN_CAP = 44;
export const VEIN_SPAWN_TICK = 1000;
export const VEIN_SPAWN_BASE_CHANCE = 0.0005;
export const VEIN_SPAWN_SOIL_WEIGHT = 0.45;
export const VEIN_SPAWN_SOIL_CHANCES = [0.0005, 0.0022, 0.0036, 0.0058, 0.0102, 0.018, 0.034, 0.060];
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
export const ITEM_OFFER_CHOICES = 3;
export const ITEM_CAP = 10;
export const SHOP_STOCK_COUNT = 5;
export const MAX_LOOP = 20;
export const LOOP_HP_STEP = 0.08;
export const LOOP_ATK_STEP = 0.05;
export const LOOP_SCORE_STEP = 0.15;
export const LOOP_ATK_SURGE = 1.35;
export const LOOP_ATK_SURGE_START = 5;
export const TRAP_EVENT_START_LOOP = 5;
export const DEBUFF_START_LOOP = 10;
export const TERMINATOR_LOOP = 20;
export const REAPER_SPAWN_CHANCE = 0.002;
export const POST_WAVE_EVENT_CHANCE = 0.30;

export const POST_WAVE_EVENT_WEIGHTS = {
  item: 60,
  shop: 35,
  trap: 5,
};

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
  "WAVE_SETTLE_DELAY",
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
  "ITEM_CAP",
  "REAPER_SPAWN_CHANCE",
];

export const RULE_TABLE_NUMBER_KEYS = {
  kinds: ["hp", "atk", "range", "moveCd", "atkCd", "aggro", "rank", "breedEvery", "breedCap", "eggChance", "evoLevel"],
  veins: ["unlock", "touchNeed", "finalTouchNeed", "spawnWeight", "soilAffinity"],
  heroes: ["rank", "hpMul", "atkMul", "defense", "range", "moveMul", "atkCd", "weight", "unlock", "healCd", "healRange", "healMul", "areaScale", "areaMax", "maxPerWave", "dodgeChance", "critChance", "critMul"],
};

export const ITEM_RARITIES = {
  normal: { name: "ノーマル", priceBase: 12, priceWave: 1, shopWeight: 6 },
  rare: { name: "レア", priceBase: 24, priceWave: 2, shopWeight: 3 },
  gold: { name: "ゴールド", priceBase: 42, priceWave: 3, shopWeight: 1 },
};

export const DEBUFF_ITEMS = {
  rottenRations: { name: "腐った配給", profile: "開始栄養が減り、時間経過で得る栄養も減る。" },
  crackedCore: { name: "ひび割れコア", profile: "迷宮コアの最大HPと現在HPが減る。" },
  informantMap: { name: "密告地図", profile: "冒険者の移動と採掘が速くなる。" },
  sharpenedBlade: { name: "研がれた刃", profile: "冒険者の攻撃力が上がる。" },
  dullFeed: { name: "くすんだ飼料", profile: "新しく出る魔物の最大HPが下がる。" },
};

export const ITEMS = {
  rustyPickaxe: { name: "錆びたつるはし", passive: true, profile: "採掘成功時、低確率で消費した栄養が戻る。" },
  blackSoilBag: { name: "黒土の袋", passive: true, profile: "採掘した周囲の土壌養分が増え、鉱脈が育ちやすくなる。" },
  undergroundLantern: { name: "地底ランタン", passive: true, profile: "鉱脈を含む未掘削マスが淡く光る。" },
  crackedMap: { name: "ひび割れ地図", passive: true, profile: "冒険者がいない間、魔物の移動が少し速くなる。" },
  masonGloves: { name: "石工の手袋", passive: true, profile: "冒険者が土を掘る力を少し下げる。" },
  deepCompass: { name: "深層コンパス", passive: true, profile: "魔物の索敵範囲が少し広がる。" },
  oldIncense: { name: "古い香炉", passive: true, profile: "鉱脈の接触進化に必要な回数が少し減る。" },
  herdFlute: { name: "群れ笛", passive: true, profile: "直接増殖する魔物の繁殖が少し早くなる。" },
  warmNest: { name: "温かな巣材", passive: true, profile: "卵が孵化するまでの時間が短くなる。" },
  eggGuardBell: { name: "卵守りの鈴", passive: true, profile: "新しく産まれた卵が最初の危機に一度だけ耐える。" },
  boneMeal: { name: "骨粉", passive: true, profile: "卵から孵った魔物の最大HPが増える。" },
  redCollar: { name: "赤い首輪", passive: true, profile: "魔物が発生地点へ戻りやすくなる。" },
  warPaint: { name: "戦化粧", passive: true, profile: "ウェーブ開始直後、魔物の攻撃力が上がる。" },
  sleepSand: { name: "眠り砂", passive: true, profile: "ウェーブ開始直後、冒険者の移動が少し遅くなる。" },
  curseNail: { name: "呪い釘", passive: true, profile: "冒険者の攻撃力を常時少し下げる。" },
  blackBell: { name: "黒い鐘", passive: true, profile: "同じウェーブ内の冒険者出現間隔が長くなる。" },
  stickyMud: { name: "こびりつく泥", passive: true, profile: "冒険者が通路で時々足を取られる。" },
  coreShard: { name: "迷宮コア片", passive: false, profile: "取得時、現存魔物の最大HPが増え、以後に出る魔物も少し頑丈になる。" },
  coreBandage: { name: "コア包帯", passive: true, profile: "ウェーブ撃退後、傷ついた魔物を数体回復する。" },
  redSealingWax: { name: "赤い封蝋", passive: true, profile: "最初のコア被弾を一度だけ無効化する。" },
  quakeStone: { name: "地鳴り石", passive: true, profile: "冒険者が土を掘るたび、地鳴りで小ダメージを与える。" },
  leftoverMeat: { name: "食べかけ肉", passive: true, profile: "捕食した魔物の回復量が増える。" },
  silverMuzzle: { name: "銀の口輪", passive: true, profile: "味方同士の捕食が起きにくくなる。" },
  bloodyPlate: { name: "血染めの皿", passive: true, profile: "捕食した魔物の攻撃力がしばらく上がる。" },
  trainingStick: { name: "しつけ棒", passive: true, profile: "低ランク魔物が捕食されにくくなる。" },
  victoryBoneFlute: { name: "勝利の骨笛", passive: true, profile: "冒険者撃破時、近くの魔物が回復する。" },
  crybabyBell: { name: "泣き虫の鈴", passive: true, profile: "魔物死亡時、近くの魔物の攻撃力がしばらく上がる。" },
  shadowThread: { name: "影縫い糸", passive: true, profile: "魔物死亡地点に短時間の減速床を残す。" },
  spareHeart: { name: "予備の心臓", passive: true, profile: "最初に倒れる魔物を一度だけ復帰させる。" },
  ledger: { name: "帳簿", passive: true, profile: "時間経過で得る栄養が増える。" },
  tornWallet: { name: "穴あき財布", passive: true, profile: "栄養が少ない時、冒険者撃破報酬が増える。" },
  demonCoin: { name: "魔王印の硬貨", passive: true, profile: "アイテム選択肢が一つ増える。" },
  fakeGold: { name: "偽金貨", passive: true, profile: "未所持アイテムを選択肢へ優先して並べる。" },
  wildCard: { name: "見切り札", passive: true, profile: "アイテム選択肢を一度だけ引き直せる。" },
  thiefBag: { name: "盗賊の袋", passive: true, profile: "アイテムを取らずに見送ると栄養を得る。" },
  dryBread: { name: "乾いたパン", passive: false, profile: "取得時、栄養をすぐ得る。" },
  blackSeed: { name: "黒い種", passive: false, profile: "取得時、ランダムな土マスに鉱脈を生やす。" },
  reversedHourglass: { name: "逆巻き砂時計", passive: true, profile: "次の襲来までの待ち時間が長くなる。" },
  earlyDrum: { name: "早鳴り太鼓", passive: true, profile: "襲来は早まるが、冒険者撃破報酬が増える。" },
  breathingFlute: { name: "深呼吸の笛", passive: true, profile: "しばらく戦っていない魔物の攻撃間隔が短くなる。" },
  gapStake: { name: "狭間の杭", passive: true, profile: "通路上の冒険者の移動が少し遅くなる。" },
  moleClaw: { name: "土竜の爪", passive: true, profile: "採掘時、隣接する土にもひびを入れる。" },
  obsidianLid: { name: "黒曜の蓋", passive: true, profile: "掘った直後の通路で生まれた魔物の被ダメージが短時間下がる。" },
  wanderingPowder: { name: "迷い粉", passive: true, profile: "冒険者が時々遠回りを選ぶ。" },
  trailMark: { name: "獣道の印", passive: true, profile: "魔物がホーム周辺を巡回しやすくなる。" },
  charmRope: { name: "まじない縄", passive: true, profile: "低HPの魔物が敵から離れやすくなる。" },
  angerMask: { name: "怒りの面", passive: true, profile: "HPに余裕のある魔物が前へ出やすくなる。" },
  nestFlag: { name: "巣穴の旗", passive: true, profile: "ホーム付近では直接繁殖の周辺上限が少し増える。" },
  oldEggshell: { name: "古卵の殻", passive: true, profile: "上位種の産卵率が上がる。" },
  crackedEgg: { name: "ひび割れ卵", passive: true, profile: "卵の孵化は早くなるが、孵化直後のHPが下がる。" },
  royalEggshell: { name: "王の卵殻", passive: true, profile: "卵から孵る魔物が低確率で強化される。" },
  rottenCrown: { name: "朽ちた冠", passive: true, profile: "第二進化魔物の出現時HPが増える。" },
  rebelCharm: { name: "反骨の札", passive: true, profile: "魔物が少ないほど魔物の攻撃力が上がる。" },
  crowdMark: { name: "大所帯の印", passive: true, profile: "魔物が多い時、魔物の最大HPが上がる。" },
  lowestCandle: { name: "最下層の蝋燭", passive: true, profile: "ウェーブ後半、魔物の攻撃力が上がる。" },
  blackRaindrop: { name: "黒い雨粒", passive: true, profile: "ウェーブ中、敵味方全員の移動が遅くなる。" },
  redMoonShard: { name: "赤月の破片", passive: true, profile: "ウェーブ後半ほど魔物の攻撃力が上がる。" },
  boneContract: { name: "白骨の契約書", passive: false, profile: "取得時にコアHPを消費し、現存魔物を強化する。" },
  undergroundStore: { name: "地下倉庫", passive: true, profile: "アイテムを持てる数が増える。" },
  veinBrush: { name: "鉱脈刷毛", passive: true, profile: "自然に生まれる鉱脈が少し増えやすくなる。" },
  denLedger: { name: "巣番台帳", passive: true, profile: "新しく出る魔物の最大HPが少し増える。" },
  homeChime: { name: "帰巣チャイム", passive: true, profile: "魔物が発生地点へ戻りやすくなる。" },
  shopStamp: { name: "商店スタンプ", passive: true, profile: "アイテム商店の価格が少し下がる。" },
  corePiggyBank: { name: "コア貯金箱", passive: true, profile: "ウェーブ撃退時、迷宮コアが無傷なら栄養を得る。" },
};

const ITEM_RARITY_BY_ID = {
  rustyPickaxe: "normal",
  blackSoilBag: "rare",
  undergroundLantern: "normal",
  crackedMap: "normal",
  masonGloves: "normal",
  deepCompass: "rare",
  oldIncense: "gold",
  herdFlute: "gold",
  warmNest: "rare",
  eggGuardBell: "rare",
  boneMeal: "rare",
  redCollar: "normal",
  warPaint: "normal",
  sleepSand: "normal",
  curseNail: "rare",
  blackBell: "normal",
  stickyMud: "normal",
  coreShard: "gold",
  coreBandage: "rare",
  redSealingWax: "rare",
  quakeStone: "rare",
  leftoverMeat: "normal",
  silverMuzzle: "normal",
  bloodyPlate: "rare",
  trainingStick: "normal",
  victoryBoneFlute: "rare",
  crybabyBell: "normal",
  shadowThread: "normal",
  spareHeart: "rare",
  ledger: "rare",
  tornWallet: "normal",
  demonCoin: "gold",
  fakeGold: "rare",
  wildCard: "rare",
  thiefBag: "normal",
  dryBread: "normal",
  blackSeed: "rare",
  reversedHourglass: "normal",
  earlyDrum: "normal",
  breathingFlute: "normal",
  gapStake: "normal",
  moleClaw: "rare",
  obsidianLid: "rare",
  wanderingPowder: "rare",
  trailMark: "normal",
  charmRope: "normal",
  angerMask: "normal",
  nestFlag: "normal",
  oldEggshell: "normal",
  crackedEgg: "normal",
  royalEggshell: "rare",
  rottenCrown: "gold",
  rebelCharm: "rare",
  crowdMark: "rare",
  lowestCandle: "rare",
  blackRaindrop: "rare",
  redMoonShard: "gold",
  boneContract: "gold",
  undergroundStore: "rare",
  veinBrush: "normal",
  denLedger: "rare",
  homeChime: "normal",
  shopStamp: "rare",
  corePiggyBank: "gold",
};

for (const id of Object.keys(ITEMS)) ITEMS[id].rarity = ITEM_RARITY_BY_ID[id] || "normal";

export const ITEM_UNLOCKS = {
  undergroundStore: { price: 80, unlockClears: 0 },
  veinBrush: { price: 110, unlockClears: 1 },
  denLedger: { price: 150, unlockClears: 2 },
  homeChime: { price: 220, unlockClears: 3 },
  shopStamp: { price: 300, unlockClears: 5 },
  corePiggyBank: { price: 420, unlockClears: 8 },
};

export const KINDS = {
  slime: { hp: 10, atk: 2, range: 1, moveCd: 560, atkCd: 720, aggro: 3, rank: 1, breedEvery: 14000, breedCap: 3, col: "#66bf68", name: "スライム", profile: "迷宮の湿気が集まると出てくる。本人たちは採用面接に受かったと思っている。" },
  carniv: { hp: 26, atk: 5, range: 1, moveCd: 590, atkCd: 680, aggro: 5, rank: 3, breedEvery: 36000, breedCap: 2, col: "#e06b3a", name: "牙獣", profile: "首輪はないが飼われている顔をしている。褒められると通路を余計に走る。" },
  spitter: { hp: 34, atk: 8, range: 2, moveCd: 590, atkCd: 920, aggro: 3, rank: 2, breedEvery: 43000, breedCap: 2, eggChance: 0.22, col: "#a64dff", name: "蜘蛛", profile: "巣の片づけが異様にうまい。獲物を招く前に照明の位置を直すタイプ。" },
  golem: { hp: 125, atk: 5, range: 1, moveCd: 1100, atkCd: 1050, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, eggChance: 0.08, col: "#6f86c4", name: "ゴーレム", profile: "動き出すまでが長い。動き出してからも長い。本人は慎重派と言っている。" },
  flame: { hp: 84, atk: 18, range: 3, moveCd: 590, atkCd: 780, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, eggChance: 0.055, lineFire: true, col: "#ff8a3a", name: "火竜", profile: "炎で焼いた石をつまみにする。辛口評論家ぶるが、だいたい何でも食べる。" },
  moss_shroom: { hp: 9, atk: 1, range: 1, moveCd: 570, atkCd: 760, aggro: 3, rank: 1, breedEvery: 13000, breedCap: 4, family: "moss_shroom", soilGrow: 1, col: "#8fcf6a", name: "胞子茸", profile: "歩くたび胞子を落とす小さな茸。本人は掃除をしているつもりで土を肥やす。" },
  moss_mycelia: { hp: 48, atk: 6, range: 1, moveCd: 540, atkCd: 720, aggro: 3, rank: 2, breedEvery: 0, breedCap: 2, family: "moss_shroom", soilGrow: 2, col: "#b7df7a", eliteOf: "moss_shroom", name: "菌糸茸", profile: "足元から白い菌糸を伸ばす。通ったあとの土はやけに目覚めがいい。" },
  moss_myceliaKing: { hp: 104, atk: 12, range: 1, moveCd: 520, atkCd: 690, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "moss_shroom", soilGrow: 3, col: "#e0ef9a", eliteOf: "moss_mycelia", evoLevel: 2, name: "菌糸王", profile: "地中に王国を広げる茸。本人が座ると周囲の土が勝手に家臣になる。" },
  moss_virus: { hp: 8, atk: 1, range: 2, moveCd: 620, atkCd: 900, aggro: 3, rank: 1, breedEvery: 15000, breedCap: 3, family: "moss_virus", weakenMs: 3200, weakenMul: 0.92, col: "#6fe0a8", name: "多脚ウイルス", profile: "立体結晶に細い足が生えたような魔物。近づく冒険者の握力を少し怪しくする。" },
  moss_crystalVirus: { hp: 42, atk: 5, range: 2, moveCd: 600, atkCd: 860, aggro: 3, rank: 2, breedEvery: 0, breedCap: 2, family: "moss_virus", weakenMs: 4200, weakenMul: 0.88, col: "#7cf0d0", eliteOf: "moss_virus", name: "結晶ウイルス", profile: "結晶面をかちかち鳴らして増える。音を聞いた冒険者は武器の振りが鈍る。" },
  moss_crownVirus: { hp: 94, atk: 11, range: 2, moveCd: 570, atkCd: 830, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "moss_virus", weakenMs: 5600, weakenMul: 0.84, col: "#b4fff0", eliteOf: "moss_crystalVirus", evoLevel: 2, name: "王冠ウイルス", profile: "王冠のような突起を持つ結晶体。威厳はないが、冒険者の腕力は確実に落とす。" },
  moss_root: { hp: 14, atk: 2, range: 1, moveCd: 690, atkCd: 780, aggro: 3, rank: 1, breedEvery: 16500, breedCap: 2, family: "moss_root", hitSlowMs: 360, col: "#7aa65a", name: "歩き根", profile: "根っこだけで歩く。足を取るのが仕事なので、自分の足取りはあまり気にしない。" },
  moss_tangleRoot: { hp: 60, atk: 7, range: 1, moveCd: 660, atkCd: 740, aggro: 3, rank: 2, breedEvery: 0, breedCap: 2, family: "moss_root", hitSlowMs: 560, col: "#9fbd63", eliteOf: "moss_root", name: "絡み根", profile: "通路の端から蔓のように絡む根。ほどける頃には次の根が待っている。" },
  moss_ancientRoot: { hp: 130, atk: 15, range: 1, moveCd: 640, atkCd: 700, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "moss_root", hitSlowMs: 760, col: "#c5c96a", eliteOf: "moss_tangleRoot", evoLevel: 2, name: "古根主", profile: "古い根が主になったもの。動きは遅いが、捕まると通路そのものが足首を握る。" },
  meat_wolf: { hp: 22, atk: 4, range: 1, moveCd: 500, atkCd: 620, aggro: 5, rank: 3, breedEvery: 32000, breedCap: 2, family: "meat_wolf", packBoost: 0.08, col: "#343a4a", name: "黒狼", profile: "群れの気配だけで走る黒い狼。一匹でも二匹分の顔をしている。" },
  meat_shadowWolf: { hp: 78, atk: 14, range: 1, moveCd: 480, atkCd: 590, aggro: 5, rank: 6, breedEvery: 0, breedCap: 1, family: "meat_wolf", packBoost: 0.11, col: "#25283a", eliteOf: "meat_wolf", name: "影牙狼", profile: "影に牙があるのか、牙に影があるのか分からない。群れるほど迷宮の影が濃くなる。" },
  meat_nightfangKing: { hp: 158, atk: 27, range: 1, moveCd: 460, atkCd: 560, aggro: 5, rank: 8, breedEvery: 0, breedCap: 1, family: "meat_wolf", packBoost: 0.14, col: "#1a1d2b", eliteOf: "meat_shadowWolf", evoLevel: 2, name: "夜牙王", profile: "夜の牙を束ねる王。吠えないのに周囲の狼が勝手に速度を合わせる。" },
  meat_boar: { hp: 30, atk: 5, range: 1, moveCd: 650, atkCd: 730, aggro: 5, rank: 3, breedEvery: 36000, breedCap: 2, family: "meat_boar", chargeMs: 1400, chargeMul: 1.35, col: "#8a4a32", name: "穴猪", profile: "穴から穴へ突っ込む猪。曲がることは苦手だが、止まることはもっと苦手。" },
  meat_fangBoar: { hp: 102, atk: 18, range: 1, moveCd: 630, atkCd: 700, aggro: 5, rank: 6, breedEvery: 0, breedCap: 1, family: "meat_boar", chargeMs: 1500, chargeMul: 1.45, col: "#ad5b37", eliteOf: "meat_boar", name: "牙穴猪", profile: "牙で通路の空気ごと押す。走った直後の一撃だけ妙に重い。" },
  meat_ironBoar: { hp: 190, atk: 32, range: 1, moveCd: 610, atkCd: 660, aggro: 5, rank: 8, breedEvery: 0, breedCap: 1, family: "meat_boar", chargeMs: 1700, chargeMul: 1.55, col: "#c06d43", eliteOf: "meat_fangBoar", evoLevel: 2, name: "鉄牙猪", profile: "鉄の牙を持つ猪。突進の勢いが残っている間、壁も敵もだいたい同じ扱いになる。" },
  meat_hedgehog: { hp: 28, atk: 4, range: 1, moveCd: 620, atkCd: 720, aggro: 4, rank: 3, breedEvery: 34000, breedCap: 2, family: "meat_hedgehog", thorns: 2, col: "#7d6750", name: "針獣", profile: "丸まると針しか見えない獣。殴った側が先に顔をしかめる。" },
  meat_steelHedgehog: { hp: 94, atk: 15, range: 1, moveCd: 600, atkCd: 690, aggro: 4, rank: 6, breedEvery: 0, breedCap: 1, family: "meat_hedgehog", thorns: 4, col: "#9a8a74", eliteOf: "meat_hedgehog", name: "鋼針獣", profile: "針の芯が硬い。防具に当たっても、嫌な音だけは確実に残す。" },
  meat_spineKing: { hp: 178, atk: 28, range: 1, moveCd: 580, atkCd: 650, aggro: 5, rank: 8, breedEvery: 0, breedCap: 1, family: "meat_hedgehog", thorns: 7, col: "#c3b180", eliteOf: "meat_steelHedgehog", evoLevel: 2, name: "針山王", profile: "背中が小さな山になった針獣。王座に座る者はだいたい自分の針で少し痛い。" },
  bug_centipede: { hp: 28, atk: 7, range: 1, moveCd: 420, atkCd: 760, aggro: 4, rank: 2, breedEvery: 42000, breedCap: 2, family: "bug_centipede", skitter: 0.88, col: "#844bd6", name: "ムカデ", profile: "足の数で通路を覚える虫。数え間違えても速さだけは落ちない。" },
  bug_steelCentipede: { hp: 96, atk: 16, range: 1, moveCd: 400, atkCd: 720, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "bug_centipede", skitter: 0.82, col: "#b064e8", eliteOf: "bug_centipede", name: "鋼ムカデ", profile: "節の一つ一つが鋼のように硬い。足音が増えるほど前線が近づく。" },
  bug_goldCentipede: { hp: 188, atk: 31, range: 1, moveCd: 380, atkCd: 690, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "bug_centipede", skitter: 0.76, col: "#d2a744", eliteOf: "bug_steelCentipede", evoLevel: 2, name: "金殻ムカデ", profile: "金色の節が曲がるたびに光る。見とれる前にだいたい噛まれている。" },
  bug_beetle: { hp: 42, atk: 5, range: 1, moveCd: 780, atkCd: 920, aggro: 4, rank: 2, breedEvery: 46000, breedCap: 2, family: "bug_beetle", frontGuard: 0.18, col: "#52664a", name: "甲虫", profile: "正面だけ妙に立派な甲虫。自信のある面を敵に向けるのが得意。" },
  bug_shieldBeetle: { hp: 124, atk: 16, range: 1, moveCd: 760, atkCd: 880, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "bug_beetle", frontGuard: 0.25, col: "#71865c", eliteOf: "bug_beetle", name: "盾甲虫", profile: "甲殻が盾のように広がった虫。横から見られると少し落ち着かない。" },
  bug_fortressBeetle: { hp: 240, atk: 28, range: 1, moveCd: 740, atkCd: 850, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "bug_beetle", frontGuard: 0.32, col: "#9da45f", eliteOf: "bug_shieldBeetle", evoLevel: 2, name: "城塞甲虫", profile: "通路に置くと城門のようになる甲虫。本人はただ正面を向いているだけ。" },
  bug_needler: { hp: 26, atk: 6, range: 2, moveCd: 600, atkCd: 900, aggro: 3, rank: 2, breedEvery: 43000, breedCap: 2, family: "bug_needler", col: "#7c45d6", name: "針虫", profile: "細い針を飛ばす虫。壁越しには撃てないので、律儀に角を曲がってから刺す。" },
  bug_flyingNeedler: { hp: 92, atk: 17, range: 3, moveCd: 580, atkCd: 850, aggro: 3, rank: 4, breedEvery: 0, breedCap: 1, family: "bug_needler", col: "#b85fcf", eliteOf: "bug_needler", name: "飛針虫", profile: "翅で浮いて針を構える。命中率より、針を構える姿勢の美しさにこだわる。" },
  bug_bowNeedler: { hp: 176, atk: 32, range: 3, moveCd: 560, atkCd: 810, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "bug_needler", col: "#cf8a3f", eliteOf: "bug_flyingNeedler", evoLevel: 2, name: "弩針虫", profile: "背中が弩のようにしなる針虫。狭い通路ほど照準が落ち着くらしい。" },
  stone_turtle: { hp: 140, atk: 4, range: 1, moveCd: 1200, atkCd: 1100, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "stone_turtle", idleRegen: 0.018, col: "#647a96", name: "鉱亀", profile: "鉱石の甲羅を背負った亀。動かない時間を修理時間だと思っている。" },
  stone_ironTurtle: { hp: 310, atk: 14, range: 1, moveCd: 1180, atkCd: 1060, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "stone_turtle", idleRegen: 0.024, col: "#8d9aa5", eliteOf: "stone_turtle", name: "鉄甲鉱亀", profile: "鉄混じりの甲羅を持つ。止まっていると傷口が鉱石でふさがっていく。" },
  stone_goldTurtle: { hp: 575, atk: 28, range: 1, moveCd: 1160, atkCd: 1020, aggro: 4, rank: 9, breedEvery: 0, breedCap: 1, family: "stone_turtle", idleRegen: 0.030, col: "#d1b45f", eliteOf: "stone_ironTurtle", evoLevel: 2, name: "金晶鉱亀", profile: "金晶の甲羅が欠けてもすぐ光を取り戻す。本人は昼寝の成果だと言う。" },
  stone_magnetCrab: { hp: 115, atk: 5, range: 1, moveCd: 980, atkCd: 980, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "stone_magnetCrab", guardAura: 0.08, col: "#516f86", name: "磁石蟹", profile: "小さな磁力で仲間の鎧や甲殻を引き締める蟹。鉄粉が好物。" },
  stone_ironCrab: { hp: 275, atk: 15, range: 1, moveCd: 960, atkCd: 940, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "stone_magnetCrab", guardAura: 0.12, col: "#6b8ca2", eliteOf: "stone_magnetCrab", name: "磁鉄蟹", profile: "磁力が強くなり、近くの味方が少し硬くなる。本人は方角をよく間違える。" },
  stone_blackCrab: { hp: 520, atk: 29, range: 1, moveCd: 940, atkCd: 900, aggro: 4, rank: 9, breedEvery: 0, breedCap: 1, family: "stone_magnetCrab", guardAura: 0.16, col: "#334a5a", eliteOf: "stone_ironCrab", evoLevel: 2, name: "黒磁鉄蟹", profile: "黒い磁鉄を抱えた蟹。近くにいるだけで刃先が少し逸れる。" },
  stone_crystalEye: { hp: 82, atk: 9, range: 3, moveCd: 1000, atkCd: 980, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, family: "stone_crystalEye", col: "#8bc7e6", name: "水晶眼", profile: "水晶の目玉だけが浮く石の魔物。見つめた先に光弾を置く。" },
  stone_quartzEye: { hp: 210, atk: 24, range: 3, moveCd: 980, atkCd: 940, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, family: "stone_crystalEye", col: "#c8e2f0", eliteOf: "stone_crystalEye", name: "石英眼", profile: "石英の濁った光を撃つ。視線が合うと、なぜかこちらが謝りたくなる。" },
  stone_rainbowEye: { hp: 390, atk: 44, range: 4, moveCd: 960, atkCd: 900, aggro: 4, rank: 9, breedEvery: 0, breedCap: 1, family: "stone_crystalEye", col: "#f0d8ff", eliteOf: "stone_quartzEye", evoLevel: 2, name: "虹晶眼", profile: "虹色の光をたたえた巨大な眼。壁のない通路を見つけるとすぐ撃つ。" },
  dragon_serpent: { hp: 92, atk: 17, range: 1, moveCd: 560, atkCd: 700, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, family: "dragon_serpent", hitSlowMs: 500, col: "#5fa36d", name: "大蛇", profile: "太い胴で冒険者を締める。噛むより先に足を遅くするのが礼儀らしい。" },
  dragon_flameSerpent: { hp: 205, atk: 32, range: 1, moveCd: 540, atkCd: 660, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, family: "dragon_serpent", hitSlowMs: 700, col: "#d06a3a", eliteOf: "dragon_serpent", name: "炎大蛇", profile: "鱗の隙間から熱が漏れる大蛇。締め付けられると足が熱で重くなる。" },
  dragon_whiteSerpent: { hp: 405, atk: 58, range: 1, moveCd: 520, atkCd: 620, aggro: 5, rank: 9, breedEvery: 0, breedCap: 1, family: "dragon_serpent", hitSlowMs: 900, col: "#f4f1cf", eliteOf: "dragon_flameSerpent", evoLevel: 2, name: "白鱗大蛇", profile: "白い鱗を持つ大蛇。締めた相手の歩幅まで静かに支配する。" },
  dragon_salamander: { hp: 76, atk: 13, range: 1, moveCd: 520, atkCd: 740, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, family: "dragon_salamander", heatTrailDmg: 2, col: "#e6502f", name: "火蜥蜴", profile: "尻尾の火で通路を焦がす蜥蜴。急いでいる時ほど足跡が熱い。" },
  dragon_lavaSalamander: { hp: 185, atk: 28, range: 1, moveCd: 500, atkCd: 700, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, family: "dragon_salamander", heatTrailDmg: 3, col: "#ff7a24", eliteOf: "dragon_salamander", name: "溶岩蜥蜴", profile: "足跡に溶岩の粒を残す。本人は通路を温めているだけのつもり。" },
  dragon_mirageSalamander: { hp: 360, atk: 52, range: 1, moveCd: 480, atkCd: 660, aggro: 5, rank: 9, breedEvery: 0, breedCap: 1, family: "dragon_salamander", heatTrailDmg: 5, col: "#ffd06a", eliteOf: "dragon_lavaSalamander", evoLevel: 2, name: "陽炎蜥蜴", profile: "歩いたあとに陽炎が立つ。踏んだ冒険者は痛みより先に景色を疑う。" },
  dragon_wyvern: { hp: 66, atk: 12, range: 3, moveCd: 500, atkCd: 820, aggro: 5, rank: 5, breedEvery: 0, breedCap: 1, family: "dragon_wyvern", hitSlowMs: 300, col: "#7eb8d8", name: "小飛竜", profile: "小さな翼で突風を撃つ竜。壁越しに撃てないので、風向きには正直。" },
  dragon_stormWyvern: { hp: 170, atk: 28, range: 3, moveCd: 480, atkCd: 780, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, family: "dragon_wyvern", hitSlowMs: 450, col: "#6ca0f0", eliteOf: "dragon_wyvern", name: "嵐飛竜", profile: "羽ばたきで短い嵐を作る。撃たれた冒険者は前へ出る足が少し遅れる。" },
  dragon_skyWyvern: { hp: 330, atk: 54, range: 4, moveCd: 460, atkCd: 740, aggro: 5, rank: 9, breedEvery: 0, breedCap: 1, family: "dragon_wyvern", hitSlowMs: 600, col: "#d9f2ff", eliteOf: "dragon_stormWyvern", evoLevel: 2, name: "天翼竜", profile: "天井近くを滑るように飛ぶ竜。突風の着弾だけは地面に律儀。" },
  superslime: { hp: 52, atk: 7, range: 1, moveCd: 520, atkCd: 680, aggro: 3, rank: 2, breedEvery: 0, breedCap: 2, col: "#e84a4a", eliteOf: "slime", name: "スーパースライム", profile: "ぷるぷる界の御曹司。怒ると少し赤くなるが、照れても同じ色になる。" },
  evolved: { hp: 90, atk: 16, range: 1, moveCd: 620, atkCd: 660, aggro: 5, rank: 6, breedEvery: 0, breedCap: 1, col: "#9b2f4f", eliteOf: "carniv", name: "凶牙獣", profile: "牙の手入れにうるさい。鏡がないので、水たまりの前でよく止まる。" },
  tarantula: { hp: 108, atk: 19, range: 2, moveCd: 560, atkCd: 840, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, eggChance: 0.13, col: "#ff6b5a", eliteOf: "spitter", name: "大蜘蛛", profile: "糸の張り方に美学がある。褒めると無言で巣を一部増築する。" },
  titan: { hp: 285, atk: 16, range: 1, moveCd: 1080, atkCd: 1000, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.035, col: "#d9b27a", eliteOf: "golem", name: "巨像ゴーレム", profile: "昔は山だったと言い張る。否定すると返事が翌朝まで返ってこない。" },
  infernal: { hp: 195, atk: 34, range: 3, moveCd: 560, atkCd: 740, aggro: 5, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.025, lineFire: true, col: "#5ab0ff", eliteOf: "flame", name: "獄炎竜", profile: "青い炎を上品だと思っている。寝起きだけ火力が弱く、本人も少し気まずい。" },
  crownslime: { hp: 112, atk: 14, range: 1, moveCd: 500, atkCd: 650, aggro: 4, rank: 4, breedEvery: 0, breedCap: 1, col: "#d4a53d", eliteOf: "superslime", evoLevel: 2, name: "冠スライム", profile: "ぷるぷるした王冠をかぶる。威厳を出そうとして、まず姿勢から練習している。" },
  direfang: { hp: 178, atk: 30, range: 1, moveCd: 610, atkCd: 640, aggro: 5, rank: 8, breedEvery: 0, breedCap: 1, col: "#5f2020", eliteOf: "evolved", evoLevel: 2, name: "裂牙獣", profile: "走るたびに地面へ爪痕を残す。本人は道しるべのつもりらしい。" },
  goldweaver: { hp: 205, atk: 36, range: 2, moveCd: 540, atkCd: 820, aggro: 4, rank: 7, breedEvery: 0, breedCap: 1, eggChance: 0.06, col: "#c6952c", eliteOf: "tarantula", evoLevel: 2, name: "金糸蜘蛛", profile: "金色の糸を張る。採算を聞かれると急に巣の奥へ戻る。" },
  goldcore: { hp: 540, atk: 31, range: 1, moveCd: 1060, atkCd: 980, aggro: 4, rank: 9, breedEvery: 0, breedCap: 1, eggChance: 0.012, col: "#d0a248", eliteOf: "titan", evoLevel: 2, name: "金核ゴーレム", profile: "胸の核がやたら光る。本人は節電の概念をまだ知らない。" },
  whiteflame: { hp: 390, atk: 62, range: 3, moveCd: 550, atkCd: 720, aggro: 5, rank: 9, breedEvery: 0, breedCap: 1, eggChance: 0.01, lineFire: true, col: "#f3f7ff", eliteOf: "infernal", evoLevel: 2, name: "白炎竜", profile: "白い炎を吐く。熱すぎて焼き加減の感想がだいたい同じになる。" },
  reaper: { hp: 430, atk: 68, range: 1, moveCd: 520, atkCd: 620, aggro: 6, rank: 10, breedEvery: 0, breedCap: 1, col: "#b7c6d6", name: "死神", profile: "倒れた冒険者の影からまれに現れる。鎌の手入れだけは妙に几帳面。" },
  chimera: { hp: 1, atk: 1, range: 1, moveCd: 540, atkCd: 600, aggro: 8, rank: 11, breedEvery: 0, breedCap: 1, col: "#d7835a", name: "キメラ", profile: "手縫いのくまちゃんが倒れた魔物の力を縫い合わせて呼ぶ、一時の怪物。" },
};

export const VEIN = {
  moss: { kind: "slime", evoKind: "superslime", finalKind: "crownslime", unlock: 1, color: "#6fcf6f", core: "#bdf7bd", legend: "苔脈→スライム", evoName: "上位苔脈", finalEvoName: "王冠苔脈", touchNeed: 4, finalTouchNeed: 14, spawnWeight: 3.0, soilAffinity: 0 },
  meat: { kind: "carniv", evoKind: "evolved", finalKind: "direfang", unlock: 1, color: "#e63a2c", core: "#ffb39e", legend: "牙脈→牙獣", evoName: "上位牙脈", finalEvoName: "裂牙脈", touchNeed: 7, finalTouchNeed: 22, spawnWeight: 1.6, soilAffinity: 1 },
  venom: { kind: "spitter", evoKind: "tarantula", finalKind: "goldweaver", unlock: 3, color: "#a64dff", core: "#e0bcff", legend: "虫脈→蜘蛛", evoName: "上位虫脈", finalEvoName: "金糸虫脈", touchNeed: 10, finalTouchNeed: 34, spawnWeight: 1.1, soilAffinity: 3, unlockMsg: "新たな鉱脈『虫脈』 ─ 蜘蛛が眠る" },
  stone: { kind: "golem", evoKind: "titan", finalKind: "goldcore", unlock: 6, color: "#6f86c4", core: "#bcd0ff", legend: "石脈→ゴーレム", evoName: "上位石脈", finalEvoName: "金核石脈", touchNeed: 13, finalTouchNeed: 50, spawnWeight: 0.8, soilAffinity: 5, unlockMsg: "新たな鉱脈『石脈』 ─ ゴーレムが眠る" },
  ember: { kind: "flame", evoKind: "infernal", finalKind: "whiteflame", unlock: 9, color: "#ffae26", core: "#ffe39a", legend: "竜脈→火竜", evoName: "上位竜脈", finalEvoName: "白炎竜脈", touchNeed: 16, finalTouchNeed: 70, spawnWeight: 0.7, soilAffinity: 6, unlockMsg: "新たな鉱脈『竜脈』 ─ 火竜が眠る" },
};

export const DEFAULT_MONSTER_DECK = {
  moss: "moss_slime",
  meat: "meat_carniv",
  venom: "venom_spider",
  stone: "stone_golem",
  ember: "ember_dragon",
};

export const MONSTER_FAMILIES = {
  moss_slime: { vein: "moss", name: "スライム", kinds: ["slime", "superslime", "crownslime"], price: 0, unlockClears: 0, default: true, trait: "直接分裂し、扱いやすい。" },
  moss_shroom: { vein: "moss", name: "菌糸", kinds: ["moss_shroom", "moss_mycelia", "moss_myceliaKing"], price: 120, unlockClears: 0, trait: "移動で土壌養分を育てる。" },
  moss_virus: { vein: "moss", name: "ウイルス", kinds: ["moss_virus", "moss_crystalVirus", "moss_crownVirus"], price: 160, unlockClears: 0, trait: "命中した冒険者の攻撃力を下げる。" },
  moss_root: { vein: "moss", name: "根", kinds: ["moss_root", "moss_tangleRoot", "moss_ancientRoot"], price: 200, unlockClears: 0, trait: "命中した冒険者を鈍らせる。" },
  meat_carniv: { vein: "meat", name: "牙獣", kinds: ["carniv", "evolved", "direfang"], price: 0, unlockClears: 0, default: true, trait: "近接火力が高い。" },
  meat_wolf: { vein: "meat", name: "黒狼", kinds: ["meat_wolf", "meat_shadowWolf", "meat_nightfangKing"], price: 180, unlockClears: 0, trait: "同族が近いほど速く強い。" },
  meat_boar: { vein: "meat", name: "穴猪", kinds: ["meat_boar", "meat_fangBoar", "meat_ironBoar"], price: 240, unlockClears: 0, trait: "移動直後の初撃が重い。" },
  meat_hedgehog: { vein: "meat", name: "針獣", kinds: ["meat_hedgehog", "meat_steelHedgehog", "meat_spineKing"], price: 300, unlockClears: 0, trait: "近接攻撃を受けると反撃する。" },
  venom_spider: { vein: "venom", name: "蜘蛛", kinds: ["spitter", "tarantula", "goldweaver"], price: 0, unlockClears: 0, default: true, trait: "壁を貫通しない飛び道具を撃つ。" },
  bug_centipede: { vein: "venom", name: "ムカデ", kinds: ["bug_centipede", "bug_steelCentipede", "bug_goldCentipede"], price: 260, unlockClears: 2, trait: "移動が速い。" },
  bug_beetle: { vein: "venom", name: "甲虫", kinds: ["bug_beetle", "bug_shieldBeetle", "bug_fortressBeetle"], price: 340, unlockClears: 2, trait: "正面からの被ダメージを軽減する。" },
  bug_needler: { vein: "venom", name: "針虫", kinds: ["bug_needler", "bug_flyingNeedler", "bug_bowNeedler"], price: 420, unlockClears: 2, trait: "壁を貫通しない針を撃つ。" },
  stone_golem: { vein: "stone", name: "ゴーレム", kinds: ["golem", "titan", "goldcore"], price: 0, unlockClears: 0, default: true, trait: "高耐久で前線を止める。" },
  stone_turtle: { vein: "stone", name: "鉱亀", kinds: ["stone_turtle", "stone_ironTurtle", "stone_goldTurtle"], price: 380, unlockClears: 4, trait: "動かずにいると自動回復する。" },
  stone_magnetCrab: { vein: "stone", name: "磁鉄蟹", kinds: ["stone_magnetCrab", "stone_ironCrab", "stone_blackCrab"], price: 480, unlockClears: 4, trait: "近くの味方の被ダメージを下げる。" },
  stone_crystalEye: { vein: "stone", name: "水晶眼", kinds: ["stone_crystalEye", "stone_quartzEye", "stone_rainbowEye"], price: 600, unlockClears: 4, trait: "壁を貫通しない光弾を撃つ。" },
  ember_dragon: { vein: "ember", name: "火竜", kinds: ["flame", "infernal", "whiteflame"], price: 0, unlockClears: 0, default: true, trait: "直線炎で複数の敵を焼く。" },
  dragon_serpent: { vein: "ember", name: "大蛇", kinds: ["dragon_serpent", "dragon_flameSerpent", "dragon_whiteSerpent"], price: 520, unlockClears: 7, trait: "命中した冒険者を締め付けて鈍らせる。" },
  dragon_salamander: { vein: "ember", name: "火蜥蜴", kinds: ["dragon_salamander", "dragon_lavaSalamander", "dragon_mirageSalamander"], price: 660, unlockClears: 7, trait: "移動跡に熱床を残す。" },
  dragon_wyvern: { vein: "ember", name: "飛竜", kinds: ["dragon_wyvern", "dragon_stormWyvern", "dragon_skyWyvern"], price: 800, unlockClears: 7, trait: "突風弾で攻撃し、命中時に少し鈍らせる。" },
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
  hori: { name: "ホリ", role: "fighter", rank: 8, hpMul: 2.75, atkMul: 2.35, defense: 34, range: 3, moveMul: 1.25, atkCd: 780, weight: 0.28, unlock: 15, weapon: "vegetable", dodgeChance: 0.08, maxPerWave: 1, msg: "ホリが現れた ─ 拳と野菜で押し込む", profile: "ベッカムヘアの太った男。手元の野菜を投げるか食べるか、本人も直前まで迷っている。" },
  xTerminator: { name: "Xターミネーター", role: "caster", rank: 20, hpMul: 3.0, atkMul: 2.6, defense: 45, range: 3, moveMul: 0.9, atkCd: 560, weight: 1.0, unlock: 20, weapon: "handgun", dodgeChance: 0.25, critChance: 0.18, critMul: 3, msg: "Xターミネーターが現れた ─ 最終周回の量産殲滅機", profile: "黒い装甲と赤いXバイザーを持つ量産冒険者。迷宮の出口ではなく、終端だけを見ている。" },
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
  WAVE_SETTLE_DELAY,
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
  ITEM_CAP,
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

export function resolveMonsterDeck(deck = {}) {
  const out = clonePlain(DEFAULT_MONSTER_DECK);
  if (!deck || typeof deck !== "object") return out;
  for (const vein in out) {
    const id = deck[vein];
    if (MONSTER_FAMILIES[id] && MONSTER_FAMILIES[id].vein === vein) out[vein] = id;
  }
  return out;
}

function applyMonsterDeckToVeins(veinTable, deck) {
  const resolved = resolveMonsterDeck(deck);
  for (const vein in resolved) {
    const family = MONSTER_FAMILIES[resolved[vein]];
    const row = veinTable[vein];
    if (!family || !row) continue;
    row.kind = family.kinds[0];
    row.evoKind = family.kinds[1];
    row.finalKind = family.kinds[2];
    const baseName = KINDS[row.kind] ? KINDS[row.kind].name : family.name;
    row.legend = `${row.legend.split("→")[0]}→${baseName}`;
  }
}

function normalizeUnlockedItems(value) {
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((id) => typeof id === "string" && ITEM_UNLOCKS[id]));
}

export const PIXEL_ASSET_PATH = "assets/pixel/";
export const PIXEL_ASSET_VERSION = "v29-imagegen";
export const PIXEL_CELL = 48;
export const PIXEL_FRAMES = 4;
export const PIXEL_DIRS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
export const PIXEL_ACTOR_RENDER_DIRS = ["e", "se", "s", "ne", "n"];
export const PIXEL_ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat", "dodge"];
export const PIXEL_ACTOR_FRAMES_PER_ACTOR = PIXEL_FRAMES * PIXEL_ACTOR_RENDER_DIRS.length * PIXEL_ACTIONS.length;
export const PIXEL_ACTOR_ATLAS_COLUMNS = PIXEL_ACTOR_FRAMES_PER_ACTOR / 2;
export const PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR = PIXEL_ACTOR_FRAMES_PER_ACTOR / PIXEL_ACTOR_ATLAS_COLUMNS;
export const PIXEL_ACTORS = [
  "slime", "carniv", "evolved", "spitter", "golem", "flame",
  "moss_shroom", "moss_mycelia", "moss_myceliaKing", "moss_virus", "moss_crystalVirus", "moss_crownVirus", "moss_root", "moss_tangleRoot", "moss_ancientRoot",
  "meat_wolf", "meat_shadowWolf", "meat_nightfangKing", "meat_boar", "meat_fangBoar", "meat_ironBoar", "meat_hedgehog", "meat_steelHedgehog", "meat_spineKing",
  "bug_centipede", "bug_steelCentipede", "bug_goldCentipede", "bug_beetle", "bug_shieldBeetle", "bug_fortressBeetle", "bug_needler", "bug_flyingNeedler", "bug_bowNeedler",
  "stone_turtle", "stone_ironTurtle", "stone_goldTurtle", "stone_magnetCrab", "stone_ironCrab", "stone_blackCrab", "stone_crystalEye", "stone_quartzEye", "stone_rainbowEye",
  "dragon_serpent", "dragon_flameSerpent", "dragon_whiteSerpent", "dragon_salamander", "dragon_lavaSalamander", "dragon_mirageSalamander", "dragon_wyvern", "dragon_stormWyvern", "dragon_skyWyvern",
  "superslime", "tarantula", "titan", "infernal",
  "crownslime", "direfang", "goldweaver", "goldcore", "whiteflame",
  "reaper", "chimera",
  "warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain",
  "max", "shon", "hori", "xTerminator", "priest", "saint", "mage", "supermage", "sage",
  "egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal",
  "egg_goldweaver", "egg_goldcore", "egg_whiteflame",
];
export const PIXEL_ACTOR_SHEETS = {
  moss_slime: ["slime", "superslime", "crownslime"],
  moss_shroom: ["moss_shroom", "moss_mycelia", "moss_myceliaKing"],
  moss_virus: ["moss_virus", "moss_crystalVirus", "moss_crownVirus"],
  moss_root: ["moss_root", "moss_tangleRoot", "moss_ancientRoot"],
  meat_carniv: ["carniv", "evolved", "direfang"],
  meat_wolf: ["meat_wolf", "meat_shadowWolf", "meat_nightfangKing"],
  meat_boar: ["meat_boar", "meat_fangBoar", "meat_ironBoar"],
  meat_hedgehog: ["meat_hedgehog", "meat_steelHedgehog", "meat_spineKing"],
  venom_spider: ["spitter", "tarantula", "goldweaver"],
  bug_centipede: ["bug_centipede", "bug_steelCentipede", "bug_goldCentipede"],
  bug_beetle: ["bug_beetle", "bug_shieldBeetle", "bug_fortressBeetle"],
  bug_needler: ["bug_needler", "bug_flyingNeedler", "bug_bowNeedler"],
  stone_golem: ["golem", "titan", "goldcore"],
  stone_turtle: ["stone_turtle", "stone_ironTurtle", "stone_goldTurtle"],
  stone_magnetCrab: ["stone_magnetCrab", "stone_ironCrab", "stone_blackCrab"],
  stone_crystalEye: ["stone_crystalEye", "stone_quartzEye", "stone_rainbowEye"],
  ember_dragon: ["flame", "infernal", "whiteflame"],
  dragon_serpent: ["dragon_serpent", "dragon_flameSerpent", "dragon_whiteSerpent"],
  dragon_salamander: ["dragon_salamander", "dragon_lavaSalamander", "dragon_mirageSalamander"],
  dragon_wyvern: ["dragon_wyvern", "dragon_stormWyvern", "dragon_skyWyvern"],
  special: ["reaper", "chimera"],
  heroes: ["warrior", "superwarrior", "ultrawarrior", "tank", "crossknight", "captain", "max", "shon", "hori", "xTerminator", "priest", "saint", "mage", "supermage", "sage"],
  eggs: ["egg_spitter", "egg_golem", "egg_flame", "egg_tarantula", "egg_titan", "egg_infernal", "egg_goldweaver", "egg_goldcore", "egg_whiteflame"],
};
export const PIXEL_TILES = ["earth", "tunnel", "bedrock", "surface", "core", "moss", "meat", "venom", "stone", "ember", "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo", "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2"];
export const PIXEL_EFFECTS = ["slash", "shot", "bite", "birth", "puff"];
export const PIXEL_ITEMS = Object.keys(ITEMS);
export const PIXEL_DEBUFFS = Object.keys(DEBUFF_ITEMS);
export const PIXEL_DIALOGUE_PORTRAITS = ["executive", "gorilla"];
const DIR_VECTORS = { e: [1, 0], se: [1, 1], s: [0, 1], sw: [-1, 1], w: [-1, 0], nw: [-1, -1], n: [0, -1], ne: [1, -1] };

const DIALOGUES = {
  intro: {
    speaker: "迷宮王直属幹部",
    portrait: "executive",
    topic: "防衛開始",
    lines: [
      "起きたな。迷宮王直属幹部として、これより最下層コアの防衛を任せる。",
      "土を掘れば通路になる。色のついた鉱脈を掘れば、そこから魔物が出る。",
      "鉱脈は近くの魔物が触れ続けると育つ。育ててから掘れば、強い魔物が出る。",
      "栄養は採掘に使う。冒険者を倒せば戻るが、足りない時は無理に掘るな。",
      "では始めろ。コアを落とされるな。",
    ],
  },
  itemChoice: {
    speaker: "ゴリラおばさん",
    portrait: "gorilla",
    topic: "アイテム選択",
    lines: [
      "あら、ここで品を選ぶのね。ゴリラおばさんが見ててあげる。",
      "選べるものは一つだけよ。すぐ効くものも、あとで効くものもあるわ。",
      "見送るのも手だけど、迷宮は遠慮だけでは守れないわよ。",
    ],
  },
  shop: {
    speaker: "コンビニ店員のスライム",
    portrait: "slime",
    topic: "アイテム商店",
    lines: [
      "いらっしゃいませ。コンビニ店員のスライムです。お支払いは栄養でお願いします。",
      "買える商品は明るく、栄養が足りない商品は暗くしてあります。",
      "何個買っても大丈夫です。閉じたら次の襲来準備に戻ります。",
    ],
  },
};

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

export function clampLoop(value) {
  return Math.max(1, Math.min(MAX_LOOP, Math.floor(Number(value) || 1)));
}

export function loopHpMultiplier(loop = 1) {
  return 1 + (clampLoop(loop) - 1) * LOOP_HP_STEP;
}

export function loopAtkMultiplier(loop = 1) {
  const l = clampLoop(loop);
  return (1 + (l - 1) * LOOP_ATK_STEP) * (l >= LOOP_ATK_SURGE_START ? LOOP_ATK_SURGE : 1);
}

export function loopScoreMultiplier(loop = 1) {
  return 1 + (clampLoop(loop) - 1) * LOOP_SCORE_STEP;
}

export function resolveHeroStats(cls, wave, loop = 1) {
  const c = HERO_CLASSES[cls] || HERO_CLASSES.warrior;
  const w = Math.max(0, wave || 0);
  const hpMul = loopHpMultiplier(loop);
  const atkMul = loopAtkMultiplier(loop);
  const hp = Math.max(12, Math.round((26 + w * 8) * c.hpMul * hpMul));
  const atk = Math.max(1, Math.round((4 + w * 1.2) * c.atkMul * atkMul));
  const heal = c.heal ? Math.max(1, Math.round((6 + w * 1.5) * (c.healMul || 1) * hpMul)) : 0;
  return { hp, atk, defense: c.defense || 0, range: c.range, heal };
}

export function pixelActorTextureKey(sheet) {
  return `actor_${sheet || "moss_slime"}`;
}

export function pixelActorFileName(sheet) {
  return `${pixelActorTextureKey(sheet)}.png`;
}

export function pixelActorSheetName(name) {
  for (const sheet in PIXEL_ACTOR_SHEETS) {
    if (PIXEL_ACTOR_SHEETS[sheet].includes(name)) return sheet;
  }
  return "moss_slime";
}

export function pixelActorRenderDir(dir) {
  if (dir === "w") return { dir: "e", flipX: true };
  if (dir === "sw") return { dir: "se", flipX: true };
  if (dir === "nw") return { dir: "ne", flipX: true };
  return { dir: PIXEL_ACTOR_RENDER_DIRS.includes(dir) ? dir : "s", flipX: false };
}

export function pixelActorX(action, dir, frame) {
  const ai = PIXEL_ACTIONS.indexOf(action);
  const render = pixelActorRenderDir(dir);
  const di = PIXEL_ACTOR_RENDER_DIRS.indexOf(render.dir);
  const actionIndex = ai < 0 ? 0 : ai;
  const dirIndex = di < 0 ? PIXEL_ACTOR_RENDER_DIRS.indexOf("s") : di;
  const frameInActor =
    (actionIndex * PIXEL_ACTOR_RENDER_DIRS.length + dirIndex) * PIXEL_FRAMES + frame;
  return (frameInActor % PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL;
}

export function pixelActorFrameInfo(name, action, dir, frame) {
  const sheet = pixelActorSheetName(name);
  const names = PIXEL_ACTOR_SHEETS[sheet] || PIXEL_ACTOR_SHEETS.moss_slime;
  const row = names.indexOf(name);
  const actorRow = row < 0 ? 0 : row;
  const render = pixelActorRenderDir(dir);
  const actionIndex = Math.max(0, PIXEL_ACTIONS.indexOf(action));
  const directionIndex = Math.max(0, PIXEL_ACTOR_RENDER_DIRS.indexOf(render.dir));
  const frameInActor =
    (actionIndex * PIXEL_ACTOR_RENDER_DIRS.length + directionIndex) * PIXEL_FRAMES + frame;
  const atlasFrame = actorRow * PIXEL_ACTOR_FRAMES_PER_ACTOR + frameInActor;
  return {
    sheet,
    key: pixelActorTextureKey(sheet),
    file: pixelActorFileName(sheet),
    frame: atlasFrame,
    x: (atlasFrame % PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL,
    y: Math.floor(atlasFrame / PIXEL_ACTOR_ATLAS_COLUMNS) * PIXEL_CELL,
    sheetWidth: PIXEL_ACTOR_ATLAS_COLUMNS * PIXEL_CELL,
    sheetHeight: names.length * PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR * PIXEL_CELL,
    flipX: render.flipX,
  };
}

export function pixelActorFrameIndex(name, action, dir, frame) {
  return pixelActorFrameInfo(name, action, dir, frame).frame;
}

export function pixelItemFrameIndex(id) {
  const col = PIXEL_ITEMS.indexOf(id);
  return col < 0 ? 0 : col;
}

export function pixelDebuffFrameIndex(id) {
  const col = PIXEL_DEBUFFS.indexOf(id);
  return col < 0 ? 0 : col;
}

export function pixelDialoguePortraitFrameIndex(id) {
  const col = PIXEL_DIALOGUE_PORTRAITS.indexOf(id);
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
  const monsterDeck = resolveMonsterDeck(options.monsterDeck);
  applyMonsterDeckToVeins(runtimeTables.VEIN, monsterDeck);
  const unlockedItemIds = normalizeUnlockedItems(options.unlockedItems);
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
    WAVE_SETTLE_DELAY,
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
    ITEM_CAP,
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
  let items = [];
  let debuffItems = [];
  let itemOffer = null;
  let shopOffer = null;
  let trapOffer = null;
  let debuffNotice = null;
  let itemEvents = [];
  let usedItems = new Set();
  let slowFields = [];
  let unlocked = new Set();
  let nutrients = START_NUT;
  let coreMax = CORE_MAX;
  let coreHP = CORE_MAX;
  let wave = 0;
  let waveElapsed = 0;
  let score = 0;
  let kills = 0;
  let playerDigCount = 0;
  let waveCountdown = FIRST_GRACE;
  let heroEntryHold = 0;
  let waveSettleDelay = 0;
  let waveSettled = 0;
  let movementTickTimer = 0;
  let veinSpawnTimer = 0;
  let events = [];
  let idc = 0;
  let gameState = "title";
  let activeDialogue = null;
  let dialogueReturnState = null;
  let loop = clampLoop(options.loop ?? 1);
  let resetPenaltyActive = !!options.resetPenaltyActive;

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

  function resolveHeroStats(cls, wave, loopOverride = loop) {
    const c = HERO_CLASSES[cls] || HERO_CLASSES.warrior;
    const w = Math.max(0, wave || 0);
    const hpMul = loopHpMultiplier(loopOverride);
    const atkMul = loopAtkMultiplier(loopOverride);
    const hp = Math.max(12, Math.round((26 + w * 8) * c.hpMul * hpMul));
    const atk = Math.max(1, Math.round((4 + w * 1.2) * c.atkMul * atkMul));
    const heal = c.heal ? Math.max(1, Math.round((6 + w * 1.5) * (c.healMul || 1) * hpMul)) : 0;
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

  function clearDialogue() {
    activeDialogue = null;
    dialogueReturnState = null;
  }

  function openDialogue(id, returnState = "playing") {
    const source = DIALOGUES[id];
    if (!source || !Array.isArray(source.lines) || source.lines.length <= 0) {
      clearDialogue();
      gameState = returnState;
      return false;
    }
    activeDialogue = {
      id,
      speaker: source.speaker,
      portrait: source.portrait,
      topic: source.topic,
      lines: source.lines.slice(),
      index: 0,
    };
    dialogueReturnState = returnState;
    gameState = "dialogue";
    return true;
  }

  function dialogueSnapshot() {
    if (gameState !== "dialogue" || !activeDialogue) return null;
    const index = Math.max(0, Math.min(activeDialogue.lines.length - 1, activeDialogue.index || 0));
    return {
      id: activeDialogue.id,
      speaker: activeDialogue.speaker,
      portrait: activeDialogue.portrait,
      topic: activeDialogue.topic,
      text: activeDialogue.lines[index],
      index,
      total: activeDialogue.lines.length,
      returnState: dialogueReturnState,
    };
  }

  function advanceDialogue() {
    if (gameState !== "dialogue" || !activeDialogue) return false;
    if (activeDialogue.index < activeDialogue.lines.length - 1) {
      activeDialogue.index++;
      return true;
    }
    const nextState = dialogueReturnState || "playing";
    clearDialogue();
    gameState = nextState;
    return true;
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
    return 0.045 * (hasItem("ledger") ? 1.25 : 1) * (hasDebuff("rottenRations") ? 0.85 : 1);
  }

  function hasItem(id) {
    return items.includes(id);
  }

  function itemUnlocked(id) {
    return !!ITEMS[id] && (!ITEM_UNLOCKS[id] || unlockedItemIds.has(id));
  }

  function availableItemIds() {
    return Object.keys(ITEMS).filter(itemUnlocked);
  }

  function effectiveItemCap() {
    return ITEM_CAP + (hasItem("undergroundStore") ? 2 : 0);
  }

  function itemCapacityReached() {
    return items.length >= effectiveItemCap();
  }

  function hasDebuff(id) {
    return debuffItems.includes(id);
  }

  function familyOf(kind) {
    return KINDS[kind] && KINDS[kind].family ? KINDS[kind].family : kind;
  }

  function sameFamilyNear(m, range = 2) {
    const family = familyOf(m.kind);
    let count = 0;
    for (const o of monsters) {
      if (o === m || familyOf(o.kind) !== family || cheb(o, m) > range) continue;
      count++;
    }
    return count;
  }

  function scoreMultiplier() {
    return loopScoreMultiplier(loop);
  }

  function distToCore(e) {
    return cheb(e, { col: CORE_COL, row: CORE_ROW });
  }

  function waveIsActive() {
    return wave > 0 && waveSettled < wave;
  }

  function waveOpeningActive() {
    return waveIsActive() && waveElapsed < 8000;
  }

  function monsterAttackPower(m) {
    if (!m) return 1;
    const k = KINDS[m.kind] || {};
    let power = m.atk || 1;
    if (hasItem("warPaint") && waveOpeningActive()) power *= 1.15;
    if (hasItem("rebelCharm") && monsters.length <= 3) power *= 1.2;
    if (hasItem("lowestCandle") && waveIsActive() && waveElapsed >= 30000) power *= 1.1;
    if (hasItem("redMoonShard") && waveIsActive()) power *= 1 + Math.min(0.3, Math.max(0, waveElapsed - 15000) / 45000 * 0.3);
    if ((m.bloodyPlateMs || 0) > 0) power *= 1.2;
    if ((m.crybabyBellMs || 0) > 0) power *= 1.15;
    if (k.packBoost) power *= 1 + Math.min(3, sameFamilyNear(m, 2)) * k.packBoost;
    if (k.chargeMul && (m.chargeMs || 0) > 0) power *= k.chargeMul;
    return Math.max(1, Math.round(power));
  }

  function heroAttackPower(h) {
    let power = h.atk || 1;
    if (hasItem("curseNail")) power *= 0.92;
    if (hasDebuff("sharpenedBlade")) power *= 1.12;
    if ((h.weakenMs || 0) > 0) power *= h.weakenMul || 0.9;
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

  function itemHighlights() {
    if (!hasItem("undergroundLantern")) return [];
    const cells = [];
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
      const tile = grid[r][c];
      if (tile.t === "earth" && tile.sub) cells.push({ col: c, row: r, stage: evoStageOf(tile), soil: soilManaOf(tile), type: tile.sub });
    }
    cells.sort((a, b) => b.stage - a.stage || b.soil - a.soil || a.row - b.row || a.col - b.col);
    return cells.slice(0, 5);
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
    const chance = VEIN_SPAWN_SOIL_CHANCES[stage] ?? VEIN_SPAWN_SOIL_CHANCES[VEIN_SPAWN_SOIL_CHANCES.length - 1];
    return chance * (hasItem("veinBrush") ? 1.15 : 1);
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

  function itemOfferChoiceCount() {
    return ITEM_OFFER_CHOICES + (hasItem("demonCoin") ? 1 : 0);
  }

  function chooseItemOfferChoices() {
    const pool = availableItemIds().filter((id) => !hasItem(id));
    if (hasItem("fakeGold")) pool.sort((a, b) => PIXEL_ITEMS.indexOf(a) - PIXEL_ITEMS.indexOf(b));
    const choices = [];
    while (pool.length && choices.length < itemOfferChoiceCount()) {
      const idx = ri(0, pool.length - 1);
      choices.push(pool.splice(idx, 1)[0]);
    }
    return choices;
  }

  function chooseDebuffChoices(count = ITEM_OFFER_CHOICES) {
    const pool = Object.keys(DEBUFF_ITEMS).filter((id) => !hasDebuff(id));
    const choices = [];
    while (pool.length && choices.length < count) {
      const idx = ri(0, pool.length - 1);
      choices.push(pool.splice(idx, 1)[0]);
    }
    return choices;
  }

  function itemRarity(id) {
    return (ITEMS[id] && ITEM_RARITIES[ITEMS[id].rarity]) ? ITEMS[id].rarity : "normal";
  }

  function itemShopPrice(id, shopWave = wave) {
    const rarity = ITEM_RARITIES[itemRarity(id)];
    const base = rarity.priceBase + Math.max(0, shopWave || 0) * rarity.priceWave;
    return Math.round(base * (hasItem("shopStamp") ? 0.9 : 1));
  }

  function chooseShopGoods(excludedIds = []) {
    const excluded = new Set(excludedIds);
    const pool = availableItemIds().filter((id) => !hasItem(id) && !excluded.has(id));
    const goods = [];
    while (pool.length && goods.length < SHOP_STOCK_COUNT) {
      let total = 0;
      for (const id of pool) total += ITEM_RARITIES[itemRarity(id)].shopWeight;
      let pick = random() * total;
      let idx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        pick -= ITEM_RARITIES[itemRarity(pool[i])].shopWeight;
        if (pick <= 0) {
          idx = i;
          break;
        }
      }
      const id = pool.splice(idx, 1)[0];
      goods.push({ id, price: itemShopPrice(id, wave), sold: false });
    }
    return goods;
  }

  function choosePostWaveEventKind() {
    const candidates = [];
    if (availableItemIds().some((id) => !hasItem(id))) candidates.push({ kind: "item", weight: POST_WAVE_EVENT_WEIGHTS.item });
    if (availableItemIds().some((id) => !hasItem(id))) candidates.push({ kind: "shop", weight: POST_WAVE_EVENT_WEIGHTS.shop });
    if (loop >= TRAP_EVENT_START_LOOP && Object.keys(DEBUFF_ITEMS).some((id) => !hasDebuff(id))) candidates.push({ kind: "trap", weight: POST_WAVE_EVENT_WEIGHTS.trap });
    let total = 0;
    for (const c of candidates) total += c.weight;
    if (total <= 0) return null;
    let pick = random() * total;
    for (const c of candidates) {
      pick -= c.weight;
      if (pick <= 0) return c.kind;
    }
    return candidates[candidates.length - 1].kind;
  }

  function triggerItem(id, life = 1200) {
    if (!ITEMS[id]) return;
    itemEvents.push({ id, life, max: life });
  }

  function nextWaveInterval() {
    let interval = WAVE_INTERVAL;
    if (hasItem("reversedHourglass")) interval += 5000;
    if (hasItem("earlyDrum")) interval *= 0.75;
    return Math.max(2500, Math.round(interval));
  }

  function strengthenMonsterHp(m, mul, healMul = mul) {
    const oldMax = Math.max(1, m.maxHp || m.hp || 1);
    m.maxHp = Math.max(1, Math.round(oldMax * mul));
    m.hp = Math.min(m.maxHp, Math.max(1, Math.round((m.hp || oldMax) * healMul)));
  }

  function spawnRandomVeins(count) {
    const candidates = [];
    for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
      const tile = grid[r][c];
      if (canHostVein(c, r, tile)) candidates.push({ c, r, tile });
    }
    let made = 0;
    while (candidates.length && made < count && veinCount() < VEIN_CAP) {
      const idx = ri(0, candidates.length - 1);
      const spot = candidates.splice(idx, 1)[0];
      const type = pickVeinTypeForSpawn(spot.tile);
      if (!type || !placeVein(spot.tile, type)) continue;
      made++;
      effects.push({ type: "puff", x: cx(spot.c), y: cy(spot.r), life: 320, max: 320, color: VEIN[type].color });
    }
    return made;
  }

  function applyItem(id, opts = {}) {
    if (!ITEMS[id] || !itemUnlocked(id) || hasItem(id)) return false;
    if (!opts.ignoreCap && itemCapacityReached()) {
      banner("もう取れません");
      return false;
    }
    items.push(id);
    emitEvent("discoverItem", { id });
    triggerItem(id);
    if (id === "coreShard") {
      for (const m of monsters) {
        strengthenMonsterHp(m, 1.1);
        popDmg(m.px, m.py, "体↑", "#ffcf4d");
      }
      triggerItem(id, 1500);
    } else if (id === "dryBread") {
      nutrients += 12;
      triggerItem(id, 1500);
    } else if (id === "blackSeed") {
      const made = spawnRandomVeins(3);
      if (made > 0) banner(`黒い種 ─ 鉱脈${made}個`);
    } else if (id === "boneContract") {
      if (coreHP > 20) coreHP = Math.max(1, coreHP - 20);
      for (const m of monsters) {
        strengthenMonsterHp(m, 1.2);
        m.atk = Math.max(1, Math.round((m.atk || 1) * 1.15));
        popDmg(m.px, m.py, "契", "#ffcf4d");
      }
    } else if (id === "crowdMark" && monsters.length >= 12) {
      for (const m of monsters) {
        strengthenMonsterHp(m, 1.15);
        popDmg(m.px, m.py, "体↑", "#ffcf4d");
      }
    }
    waveCountdown = nextWaveInterval();
    return true;
  }

  function applyDebuff(id) {
    if (!DEBUFF_ITEMS[id] || hasDebuff(id)) return false;
    debuffItems.push(id);
    if (id === "rottenRations") {
      nutrients = Math.max(0, nutrients - 5);
    } else if (id === "crackedCore") {
      coreMax = Math.max(25, coreMax - 25);
      coreHP = Math.min(coreHP, coreMax);
    }
    banner(`デバフ『${DEBUFF_ITEMS[id].name}』を背負った`);
    return true;
  }

  function applyInitialDebuffs() {
    if (loop < DEBUFF_START_LOOP) return;
    const count = resetPenaltyActive ? 2 : 1;
    const choices = chooseDebuffChoices(count);
    const gained = [];
    for (const id of choices) if (applyDebuff(id)) gained.push(id);
    if (gained.length) {
      debuffNotice = { ids: gained, penalty: resetPenaltyActive };
      gameState = "debuffNotice";
    }
  }

  function acknowledgeDebuffNotice() {
    if (!debuffNotice) return false;
    debuffNotice = null;
    if (gameState === "debuffNotice") gameState = "playing";
    return true;
  }

  function chooseTrapDebuff(id) {
    if (!trapOffer || !trapOffer.choices.includes(id) || hasDebuff(id)) return false;
    if (!applyDebuff(id)) return false;
    trapOffer = null;
    if (gameState === "trap") gameState = "playing";
    return true;
  }

  function openShopOffer(excludedIds = [], withDialogue = true) {
    const goods = chooseShopGoods(excludedIds);
    if (!goods.length) {
      shopOffer = null;
      return false;
    }
    shopOffer = { wave, goods };
    if (withDialogue) openDialogue("shop", "shop");
    else gameState = "shop";
    banner("アイテム商店が開いた");
    return true;
  }

  function buyShopItem(id) {
    if (gameState === "dialogue") return false;
    if (!shopOffer || !ITEMS[id]) return false;
    const good = shopOffer.goods.find((g) => g.id === id);
    if (!good || good.sold || hasItem(id)) return false;
    if (itemCapacityReached()) {
      banner("もう取れません");
      return true;
    }
    const price = Math.max(0, Math.floor(good.price || itemShopPrice(id, shopOffer.wave)));
    if (nutrients < price) return false;
    nutrients -= price;
    if (!applyItem(id)) {
      nutrients += price;
      return false;
    }
    good.sold = true;
    banner(`アイテム『${ITEMS[id].name}』を購入`);
    return true;
  }

  function closeShopOffer() {
    if (gameState === "dialogue") return false;
    if (!shopOffer) return false;
    shopOffer = null;
    waveCountdown = nextWaveInterval();
    if (gameState === "shop") gameState = "playing";
    banner("商店を閉じた");
    return true;
  }

  function settleWave() {
    if (wave <= 0 || waveSettled >= wave) return;
    waveSettleDelay = 0;
    waveSettled = wave;
    if (wave >= MAX_WAVE) {
      gameState = "clear";
      banner("迷宮を守り抜いた");
      emitEvent("loopCleared", { loop, score, wave });
      return;
    }
    if (hasItem("coreBandage")) {
      const wounded = monsters
        .filter((m) => m.hp < m.maxHp)
        .sort((a, b) => hpRatio(a) - hpRatio(b) || a.id - b.id)
        .slice(0, 3);
      for (const m of wounded) {
        const amount = Math.max(1, Math.round(m.maxHp * 0.18));
        m.hp = Math.min(m.maxHp, m.hp + amount);
        popDmg(m.px, m.py - 10, `+${amount}`, "#9effa0");
      }
      if (wounded.length) {
        banner(`コア包帯 ─ 魔物${wounded.length}体を回復`);
        triggerItem("coreBandage");
      }
    }
    if (hasItem("corePiggyBank") && coreHP >= coreMax) {
      nutrients += 6;
      triggerItem("corePiggyBank");
      banner("コア貯金箱 ─ 栄養+6");
    }
    waveCountdown = nextWaveInterval();
    if (random() >= POST_WAVE_EVENT_CHANCE) return;
    const eventKind = choosePostWaveEventKind();
    if (eventKind === "item") {
      const choices = chooseItemOfferChoices();
      if (!choices.length) return;
      itemOffer = { wave, choices };
      openDialogue("itemChoice", "itemChoice");
      banner("アイテムを見つけた");
    } else if (eventKind === "shop") {
      openShopOffer();
    } else if (eventKind === "trap") {
      const choices = chooseDebuffChoices();
      if (!choices.length) return;
      trapOffer = { wave, choices };
      gameState = "trap";
      banner("ギルド参謀の罠");
    }
  }

  function chooseItemOffer(id = null) {
    if (gameState === "dialogue") return false;
    if (!itemOffer) return false;
    if (id === null) {
      if (hasItem("thiefBag")) {
        nutrients += 8;
        triggerItem("thiefBag");
        banner("盗賊の袋 ─ 栄養+8");
      }
      itemOffer = null;
      banner("アイテムを見送った");
      if (gameState === "itemChoice") gameState = "playing";
      return true;
    }
    if (!itemOffer.choices.includes(id) || hasItem(id)) return false;
    if (itemCapacityReached()) {
      banner("もう取れません");
      return true;
    }
    if (!applyItem(id)) return false;
    banner(`アイテム『${ITEMS[id].name}』を入手`);
    itemOffer = null;
    if (gameState === "itemChoice") gameState = "playing";
    return true;
  }

  function rerollItemOffer() {
    if (gameState === "dialogue") return false;
    if (!itemOffer || !hasItem("wildCard") || usedItems.has("wildCard")) return false;
    const previous = new Set(itemOffer.choices);
    const pool = availableItemIds().filter((id) => !hasItem(id) && !previous.has(id));
    const choices = [];
    while (pool.length && choices.length < itemOfferChoiceCount()) {
      const idx = ri(0, pool.length - 1);
      choices.push(pool.splice(idx, 1)[0]);
    }
    if (!choices.length) return false;
    itemOffer = { wave: itemOffer.wave, choices };
    usedItems.add("wildCard");
    triggerItem("wildCard", 1500);
    banner("見切り札 ─ 選択肢を引き直した");
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

  function veinDigKindAt(col, row) {
    if (!inBounds(col, row)) return null;
    const tile = grid[row][col];
    if (!tile || !tile.sub) return null;
    return veinKindForTile(tile.sub, tile);
  }

  function monsterBoardFull() {
    return monsters.length + eggs.length >= MONSTER_CAP;
  }

  function isDiggable(col, row) {
    const kind = veinDigKindAt(col, row);
    return gameState === "playing" && isDigTarget(col, row) && nutrients >= digCost(row) && (!kind || !monsterBoardFull());
  }

  function tryDig(col, row) {
    if (gameState !== "playing" || !isDigTarget(col, row)) return false;
    const tile = grid[row][col];
    const kindToSpawn = tile.sub ? veinKindForTile(tile.sub, tile) : null;
    if (kindToSpawn && monsterBoardFull()) {
      toast(col, row, "満杯", "#ffcf4d");
      return false;
    }
    const cost = digCost(row);
    if (nutrients < cost) {
      toast(col, row, "不足", "#ffb84d");
      return false;
    }
    nutrients -= cost;
    if (hasItem("rustyPickaxe") && random() < 0.25) {
      nutrients += cost;
      triggerItem("rustyPickaxe");
      toast(col, row, "返還", "#ffcf4d");
    }
    if (tile.sub) {
      const vein = tile.sub;
      const kind = kindToSpawn;
      tile.t = "tunnel";
      clearVein(tile, true);
      if (kind) {
        spawnMonster(kind, col, row, { fromVein: true });
        const mo = monsters[monsters.length - 1];
        if (mo && mo.col === col && mo.row === row) {
          mo.bornAnim = BORN_ANIM;
          if (hasItem("obsidianLid")) mo.obsidianLidMs = 6000;
          effects.push({ type: "birth", x: cx(col), y: cy(row), life: 380, max: 380, color: KINDS[mo.kind].col });
        }
      }
    } else {
      tile.t = "tunnel";
      clearVein(tile, true);
    }
    if (hasItem("blackSoilBag")) {
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) chargeSoilAt(col + dc, row + dr, 2);
      triggerItem("blackSoilBag");
    }
    if (hasItem("moleClaw")) {
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = col + dc;
        const nr = row + dr;
        if (!inBounds(nc, nr)) continue;
        const n = grid[nr][nc];
        if (n.t === "earth") n.dig = Math.min(DIG_BREAK - 1, (n.dig || 0) + 55);
      }
      triggerItem("moleClaw");
    }
    playerDigCount++;
    effects.push({ type: "dig", x: cx(col), y: cy(row), life: 340, max: 340 });
    return true;
  }

  function spawnMonster(kind, col, row, opts = {}) {
    if (monsters.length >= MONSTER_CAP || !KINDS[kind]) return;
    if (!inBounds(col, row) || isMonsterForbiddenCell(col, row)) return;
    const k = KINDS[kind];
    const monster = {
      id: ++idc, kind, col, row, px: cx(col), py: cy(row), bob: rnd(0, 6.28), faceDir: spawnFaceDir(col, row),
      homeCol: col, homeRow: row, hp: k.hp, maxHp: k.hp, atk: k.atk, range: k.range,
      moveCd: k.moveCd, moveCharge: rnd(0, 0.35), moveWait: 0, moveIntent: null, atkCd: 0, eggCd: EGG_CHECK * rnd(0.7, 1.3), eatCd: EAT_CHECK * rnd(0.6, 1.2),
      breedCd: k.breedEvery ? k.breedEvery * rnd(0.6, 1.2) : 0, breedLeft: k.breedEvery ? BREED_LIMIT : 0,
      prevCol: null, prevRow: null, soilSteps: 0, bornAnim: BORN_ANIM, atkAnim: 0, atkTX: 0, atkTY: 0, actionType: "idle", actionTime: 0, moveAnim: 0,
      nonCombatMs: 0,
    };
    if (hasItem("coreShard")) strengthenMonsterHp(monster, 1.06);
    if (hasItem("denLedger")) strengthenMonsterHp(monster, 1.08);
    if (hasDebuff("dullFeed")) strengthenMonsterHp(monster, 0.92);
    if (opts.fromEgg) {
      if (hasItem("boneMeal")) strengthenMonsterHp(monster, 1.25);
      if (hasItem("crackedEgg")) {
        monster.hp = Math.max(1, Math.round(monster.hp * 0.75));
        monster.maxHp = Math.max(monster.hp, monster.maxHp);
      }
      if (hasItem("royalEggshell") && random() < 0.12) {
        strengthenMonsterHp(monster, 1.25);
        monster.atk = Math.max(1, Math.round(monster.atk * 1.25));
        monster.royalEggBorn = true;
        triggerItem("royalEggshell");
      }
    }
    if (hasItem("rottenCrown") && evoLevelOf(kind) >= 2) strengthenMonsterHp(monster, 1.2);
    if (hasItem("crowdMark") && monsters.length >= 12) strengthenMonsterHp(monster, 1.15);
    monsters.push(monster);
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
    let hatchCd = EGG_HATCH;
    if (hasItem("warmNest")) hatchCd *= 0.8;
    if (hasItem("crackedEgg")) hatchCd *= 0.65;
    eggs.push({ kind, col, row, hatchCd: Math.max(1000, Math.round(hatchCd)), bornAnim: BORN_ANIM, guarded: hasItem("eggGuardBell") });
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
      spawnMonster(e.kind, spot.col, spot.row, { fromEgg: true });
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
      const chance = Math.min(0.95, (KINDS[m.kind].eggChance || 0) + (hasItem("oldEggshell") ? 0.04 : 0));
      if (random() < chance) {
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
    let base = stage >= 1 ? (vein.finalTouchNeed || veinTouchNeed(type) + 4) : veinTouchNeed(type);
    if (hasItem("oldIncense")) base = Math.round(base * 0.85);
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
    let chance = clamp(EAT_CHANCE_STEP * found.gap, 0.08, 0.55);
    if (hasItem("silverMuzzle")) chance *= 0.6;
    if (hasItem("trainingStick") && rankOf(found.prey.kind) <= 2) chance *= 0.5;
    if (random() >= chance) return false;
    const prey = found.prey;
    const px0 = prey.px;
    const py0 = prey.py;
    setAction(m, "eat", px0, py0, 320);
    killMonster(prey);
    const healRate = hasItem("leftoverMeat") ? 0.28 : 0.18;
    m.hp = Math.min(m.maxHp, m.hp + Math.max(3, Math.round(prey.maxHp * healRate)));
    if (hasItem("bloodyPlate")) {
      m.bloodyPlateMs = 10000;
      triggerItem("bloodyPlate");
    }
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
    if (loop >= TERMINATOR_LOOP) return "xTerminator";
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
    if (loop >= TERMINATOR_LOOP) cls = "xTerminator";
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
    waveSettleDelay = 0;
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
    const stagger = Math.round(HERO_STAGGER * (hasItem("blackBell") ? 1.25 : 1));
    for (let i = 0; i < count; i++) spawnQueue.push({ delay: i * stagger, cls: pickHeroClass() });
    waveElapsed = 0;
    waveCountdown = nextWaveInterval();
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
    const k = KINDS[e.kind];
    if (k.soilGrow) {
      chargeSoilAround(toCol, toRow, k.soilGrow);
      if (k.soilGrow >= 2) chargeSoilAround(fromCol, fromRow, 1);
    }
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
      const k = KINDS[e.kind] || {};
      if (k.chargeMul) e.chargeMs = k.chargeMs || 1200;
      if (k.heatTrailDmg && OPEN.has(grid[fromRow][fromCol].t)) {
        slowFields.push({ col: fromCol, row: fromRow, life: 3200, max: 3200, damage: k.heatTrailDmg, color: k.col });
      }
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
    if (e.kind && e.homeCol !== undefined) {
      const homeDist = cheb(n, { col: e.homeCol, row: e.homeRow });
      if (hasItem("redCollar")) score += homeDist * 4;
      if (hasItem("homeChime")) score += homeDist * 3;
      if (hasItem("trailMark") && homeDist <= 4) score -= 8;
    }
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
    m.atkCd = monsterAttackInterval(m, k);
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

  function applyMonsterHitTrait(source, h) {
    const k = source && source.kind ? (KINDS[source.kind] || {}) : {};
    if (k.weakenMs) {
      h.weakenMs = Math.max(h.weakenMs || 0, k.weakenMs);
      h.weakenMul = Math.min(h.weakenMul || 1, k.weakenMul || 0.9);
      popDmg(h.px, h.py - 10, "攻↓", "#9effc3");
    }
    if (k.hitSlowMs) {
      h.itemMoveLag = Math.max(h.itemMoveLag || 0, k.hitSlowMs);
      popDmg(h.px, h.py - 4, "鈍", "#b6a6ff");
    }
  }

  function damageHero(h, raw, source = null, color = "#ff8a8a") {
    if (!heroes.includes(h)) return false;
    if (tryHeroDodge(h, source)) return false;
    const dmg = heroDamageTaken(raw, h);
    h.hp -= dmg;
    popDmg(h.px, h.py, `-${dmg}`, color);
    if (source && source.kind) applyMonsterHitTrait(source, h);
    if (h.hp <= 0) killHero(h);
    return true;
  }

  function frontGuardApplies(m, source) {
    if (!source || !source.cls) return false;
    const v = DIR_VECTORS[m.faceDir] || [0, 1];
    const dx = Math.sign(source.col - m.col);
    const dy = Math.sign(source.row - m.row);
    return dx === v[0] && dy === v[1];
  }

  function guardAuraReduction(m) {
    let reduction = 0;
    for (const o of monsters) {
      if (o === m || cheb(o, m) > 2) continue;
      const k = KINDS[o.kind] || {};
      reduction = Math.max(reduction, k.guardAura || 0);
    }
    return reduction;
  }

  function damageMonster(m, amount, color = "#fff", source = null) {
    if (!monsters.includes(m)) return false;
    m.nonCombatMs = 0;
    const k = KINDS[m.kind] || {};
    let dmg = amount;
    if ((m.obsidianLidMs || 0) > 0) dmg = Math.max(1, Math.round(dmg * 0.85));
    if (source && source.cls && k.frontGuard && frontGuardApplies(m, source)) dmg = Math.max(1, Math.round(dmg * (1 - k.frontGuard)));
    const aura = guardAuraReduction(m);
    if (aura > 0) dmg = Math.max(1, Math.round(dmg * (1 - aura)));
    m.hp -= dmg;
    popDmg(m.px, m.py, `-${dmg}`, color);
    if (source && source.cls && k.thorns && cheb(m, source) <= 1 && heroes.includes(source)) {
      damageHero(source, k.thorns, m, "#d0ff8a");
      effects.push({ type: "bite", sx: m.px, sy: m.py - 5, tx: source.px, ty: source.py, x: source.px, y: source.py, color: k.col, life: 220, max: 220 });
    }
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
    if (i >= 0 && hasItem("spareHeart") && !usedItems.has("spareHeart")) {
      m.hp = Math.max(1, Math.round((m.maxHp || 1) * 0.4));
      usedItems.add("spareHeart");
      triggerItem("spareHeart", 1500);
      popDmg(m.px, m.py - 10, "復帰", "#9effa0");
      effects.push({ type: "birth", x: m.px, y: m.py, life: 360, max: 360, color: "#9effa0" });
      return;
    }
    if (i >= 0) monsters.splice(i, 1);
    if (i >= 0 && hasItem("crybabyBell")) {
      for (const o of monsters) if (cheb(o, m) <= 2) o.crybabyBellMs = Math.max(o.crybabyBellMs || 0, 8000);
      triggerItem("crybabyBell");
    }
    if (i >= 0 && hasItem("shadowThread") && inBounds(m.col, m.row) && OPEN.has(grid[m.row][m.col].t)) {
      slowFields.push({ col: m.col, row: m.row, life: 6000, max: 6000 });
      triggerItem("shadowThread");
    }
    effects.push({ type: "puff", x: m.px, y: m.py, life: 300, max: 300, color: "#5fd16b" });
  }

  function killHero(h) {
    const i = heroes.indexOf(h);
    if (i >= 0) heroes.splice(i, 1);
    let rewardMul = 1;
    if (hasItem("tornWallet") && nutrients < 5) rewardMul *= 1.5;
    if (hasItem("earlyDrum")) rewardMul *= 1.2;
    const reward = Math.round((4 + h.wave) * rewardMul);
    nutrients += reward;
    score += Math.round((80 * h.wave + 20) * scoreMultiplier());
    kills++;
    emitEvent("heroKilled", { cls: h.cls, wave: h.wave, x: h.px, y: h.py });
    popDmg(h.px, h.py, `+${reward}`, "#ffcf4d");
    if (hasItem("victoryBoneFlute")) {
      for (const m of monsters) {
        if (cheb(m, h) > 2 || m.hp >= m.maxHp) continue;
        const amount = Math.max(1, Math.round(m.maxHp * 0.15));
        m.hp = Math.min(m.maxHp, m.hp + amount);
        popDmg(m.px, m.py - 10, `+${amount}`, "#9effa0");
      }
      triggerItem("victoryBoneFlute");
    }
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
    const k = e.kind ? (KINDS[e.kind] || {}) : {};
    let mul = 1;
    if (e.kind && hasItem("crackedMap") && heroes.length === 0 && spawnQueue.length === 0) mul *= 0.85;
    if (e.kind && hasItem("blackRaindrop") && waveIsActive()) mul *= 1.12;
    if (e.kind && k.skitter) mul *= k.skitter;
    if (e.kind && k.packBoost && sameFamilyNear(e, 2) > 0) mul *= Math.max(0.72, 1 - sameFamilyNear(e, 2) * k.packBoost);
    if (e.cls && hasItem("sleepSand") && waveOpeningActive()) mul *= 1.15;
    if (e.cls && hasItem("gapStake") && grid[e.row][e.col].t === "tunnel") mul *= 1.08;
    if (e.cls && hasItem("blackRaindrop") && waveIsActive()) mul *= 1.12;
    if (e.cls && hasDebuff("informantMap")) mul *= 0.9;
    return Math.max(MOVEMENT_TICK, Math.round(base * mul));
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

  function monsterFleeCandidates(m, target) {
    const out = [];
    const seen = new Set();
    for (const n of openNeighbors(m.col, m.row)) {
      if (!actorCanMoveTo(m, n.col, n.row)) continue;
      const score = -cheb(n, target) * 80 - cardinalDist(n, target) * 8 + rnd(0, 4);
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
    const out = heroPathCandidates(h, { allowEarth: false, includeOccupied: true })
      .filter((n) => actorCanMoveTo(h, n.col, n.row))
      .slice(0, 4);
    if (hasItem("wanderingPowder") && out.length > 1 && random() < 0.1) {
      const first = out[0];
      out[0] = out[1];
      out[1] = first;
      triggerItem("wanderingPowder");
    }
    return out;
  }

  function movementPriority(e, intent) {
    if (!intent) return 0;
    let base = 0;
    if (e.kind && intent.kind === "flee") base = 85;
    else if (e.kind && intent.kind === "chase") base = 80;
    else if (e.cls && intent.kind === "unblock") base = 75;
    else if (e.cls) base = 60;
    else if (e.kind) base = 20;
    return base + Math.min(30, Math.floor((e.moveWait || 0) / 300));
  }

  function buildMoveRequest(e) {
    if (!e.moveIntent || isMoving(e) || (e.moveCharge || 0) < 1) return null;
    const candidates = e.kind
      ? (e.moveIntent.kind === "chase" ? monsterChaseCandidates(e, e.moveIntent) : (e.moveIntent.kind === "flee" ? monsterFleeCandidates(e, e.moveIntent.target) : monsterWanderCandidates(e)))
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
      if ((e.itemMoveLag || 0) > 0) {
        e.itemMoveLag = Math.max(0, e.itemMoveLag - MOVEMENT_TICK);
        continue;
      }
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
      if (e.cls && hasItem("stickyMud") && grid[e.row][e.col].t === "tunnel" && random() < 0.12) {
        e.itemMoveLag = Math.max(e.itemMoveLag || 0, 350);
        triggerItem("stickyMud");
      }
      if (e.cls) {
        const field = slowFields.find((f) => f.col === e.col && f.row === e.row);
        if (field) {
          e.itemMoveLag = Math.max(e.itemMoveLag || 0, 450);
          if (field.damage) damageHero(e, field.damage, null, field.color || "#ff8a3a");
        }
      }
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
      m.breedCd -= dt * (hasItem("herdFlute") ? 1 / 0.85 : 1);
      if (m.breedCd > 0) continue;
      if (monsters.length + eggs.length >= MONSTER_CAP) {
        m.breedCd = k.breedEvery * 0.5;
        continue;
      }
      let local = 0;
      for (const o of monsters) if (o.kind === m.kind && cheb(o, m) <= 1) local++;
      const nearHome = cheb(m, { col: m.homeCol, row: m.homeRow }) <= 2;
      const localCap = (k.breedCap || 2) + (hasItem("nestFlag") && nearHome ? 1 : 0);
      if (local >= localCap) {
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
      m.breedCd = k.breedEvery * (hasItem("herdFlute") ? 0.85 : 1) * rnd(0.9, 1.3);
    }
  }

  function monsterAttackInterval(m, k) {
    let cd = k.atkCd;
    if (hasItem("breathingFlute") && (m.nonCombatMs || 0) >= 8000) cd *= 0.85;
    return Math.max(120, Math.round(cd));
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
            m.atkCd = monsterAttackInterval(m, k);
            setAction(m, m.range >= 2 ? "cast" : "attack", heroTarget.px, heroTarget.py, ATK_ANIM);
            if (m.range >= 2) shoot(m.px, m.py - 4, heroTarget.px, heroTarget.py, "#9bff5a");
            else slash(heroTarget.px, heroTarget.py, "#ffd0d0");
            damageHero(heroTarget, monsterAttackPower(m), m, m.kind === "spitter" ? "#b6ff7a" : "#ff8a8a");
          }
        }
        continue;
      }
      const aggroRange = k.aggro + (hasItem("angerMask") && hpRatio(m) >= 0.7 ? 2 : 0) + (hasItem("deepCompass") ? 1 : 0);
      const aggroHero = bestHeroWithin(m, aggroRange);
      if (aggroHero) faceToward(m, aggroHero.px, aggroHero.py);
      if (!aggroHero && m.eatCd <= 0) {
        m.eatCd = EAT_CHECK * rnd(0.85, 1.25);
        if (tryEatLower(m)) continue;
      }
      if (aggroHero && hasItem("charmRope") && hpRatio(m) <= 0.35) m.moveIntent = { kind: "flee", target: aggroHero };
      else if (aggroHero) m.moveIntent = { kind: "chase", target: aggroHero, opts: { attackRange: k.range, preferLos: k.range > 1, lineFire: !!k.lineFire } };
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
        shotColor = "#8ed36f";
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
    damageMonster(monsterTarget, damage, "#fff", h);
    if (c.areaAttack) {
      let extra = 0;
      const areaDmg = Math.max(1, Math.round(damage * (c.areaScale || 0.65)));
      for (const m of [...monsters]) {
        if (m === monsterTarget || isMoving(m) || cheb(m, h) > h.range) continue;
        if (!sameHeroAttackLane(h, monsterTarget, m)) continue;
        if (!hasLOS(h.col, h.row, m.col, m.row)) continue;
        shoot(h.px, h.py - 8, m.px, m.py, "#ffe680");
        damageMonster(m, areaDmg, "#fff0a6", h);
        extra++;
        if (extra >= (c.areaMax || 3)) break;
      }
    }
  }

  function performHeroPathStep(h, step) {
    if (!step) {
      h.actCd = 400;
      return;
    }
    if (step.tile.t === "earth") {
      const digDmg = Math.max(1, Math.round(heroDigDmg(h.atk) * (hasItem("masonGloves") ? 0.85 : 1) * (hasDebuff("informantMap") ? 1.1 : 1)));
      step.tile.dig = (step.tile.dig || 0) + digDmg;
      effects.push({ type: "dig", x: cx(step.col), y: cy(step.row), life: 300, max: 300, hero: true });
      h.actCd = DIG_CD;
      setAction(h, "dig", cx(step.col), cy(step.row), ATK_ANIM);
      if (hasItem("quakeStone")) {
        damageHero(h, 2, null, "#bff7ea");
        triggerItem("quakeStone");
        if (!heroes.includes(h)) return;
      }
      if (step.tile.dig >= DIG_BREAK) {
        step.tile.t = "tunnel";
        clearVein(step.tile, true);
        step.tile.dig = 0;
      }
    } else {
      h.moveIntent = { kind: "core" };
    }
  }

  function heroEntryEscapeStep(h) {
    if (!isHeroEntryZone(h.col, h.row)) return null;
    const step = heroPathCandidates(h, { allowEarth: true, includeOccupied: true })[0] || null;
    if (!step) return null;
    if (OPEN.has(step.tile.t) && monsterAt(step.col, step.row)) return null;
    return step;
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
      const entryStep = heroEntryEscapeStep(h);
      if (entryStep) {
        h.blockedMs = 0;
        if (h.actCd <= 0) performHeroPathStep(h, entryStep);
        continue;
      }
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
      if (monsterTarget) {
        h.blockedMs = 0;
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
          if (hasItem("redSealingWax") && !usedItems.has("redSealingWax")) {
            usedItems.add("redSealingWax");
            triggerItem("redSealingWax", 1500);
            popDmg(cx(CORE_COL), cy(CORE_ROW) - 10, "無効", "#ffcf4d");
          } else {
            coreHP -= dmg;
            emitEvent("coreHit", { cls: h.cls, wave: h.wave, damage: dmg, x: cx(CORE_COL), y: cy(CORE_ROW) });
            popDmg(cx(CORE_COL), cy(CORE_ROW) - 10, `-${dmg}`, "#e0556b");
          }
          effects.push({ type: "corehit", x: cx(CORE_COL), y: cy(CORE_ROW), color: "#e0556b", life: 420, max: 420 });
          effects.push({ type: "coreShock", x: cx(CORE_COL), y: cy(CORE_ROW), color: "#ff3355", life: 460, max: 460 });
          h.coreCd = 1100;
          setAction(h, "attack", cx(CORE_COL), cy(CORE_ROW), ATK_ANIM);
        }
        continue;
      }
      if (h.actCd <= 0) {
        const step = heroPathCandidates(h, { allowEarth: true, includeOccupied: true })[0] || null;
        performHeroPathStep(h, step);
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
        pickups.splice(i, 1);
      } else if (p.life <= 0) {
        pickups.splice(i, 1);
      }
    }
  }

  function updateItemPassives(dt) {
    for (const m of monsters) {
      const k = KINDS[m.kind] || {};
      m.nonCombatMs = (m.nonCombatMs || 0) + dt;
      m.bloodyPlateMs = Math.max(0, (m.bloodyPlateMs || 0) - dt);
      m.crybabyBellMs = Math.max(0, (m.crybabyBellMs || 0) - dt);
      m.obsidianLidMs = Math.max(0, (m.obsidianLidMs || 0) - dt);
      m.chargeMs = Math.max(0, (m.chargeMs || 0) - dt);
      if (k.idleRegen && !isMoving(m) && m.hp < m.maxHp && (m.nonCombatMs || 0) >= 1800) {
        m.regenTick = (m.regenTick || 0) + dt;
        while (m.regenTick >= 1000 && m.hp < m.maxHp) {
          m.regenTick -= 1000;
          const amount = Math.max(1, Math.round(m.maxHp * k.idleRegen));
          m.hp = Math.min(m.maxHp, m.hp + amount);
          popDmg(m.px, m.py - 8, `+${amount}`, "#9effa0");
        }
      } else {
        m.regenTick = 0;
      }
    }
    for (const h of heroes) {
      h.weakenMs = Math.max(0, (h.weakenMs || 0) - dt);
      if (h.weakenMs <= 0) h.weakenMul = 1;
    }
    for (let i = slowFields.length - 1; i >= 0; i--) {
      slowFields[i].life -= dt;
      if (slowFields[i].life <= 0) slowFields.splice(i, 1);
    }
  }

  function updateItemEvents(dt) {
    for (let i = itemEvents.length - 1; i >= 0; i--) {
      itemEvents[i].life -= dt;
      if (itemEvents[i].life <= 0) itemEvents.splice(i, 1);
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
    if (waveIsActive()) waveElapsed += dt;
    if (spawnQueue.length === 0 && heroes.length === 0) {
      if (wave > 0 && waveSettled < wave) {
        if (waveSettleDelay <= 0) waveSettleDelay = WAVE_SETTLE_DELAY;
        waveSettleDelay = Math.max(0, waveSettleDelay - dt);
        if (waveSettleDelay > 0) {
          updatePickups(dt);
          updateItemEvents(dt);
          updateEffects(dt);
          return;
        }
        settleWave();
        if (gameState !== "playing") return;
      } else {
        waveSettleDelay = 0;
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
    updateItemPassives(dt);
    updateMonsterTtl(dt);
    updateActorMovement(dt, entryPaused);
    if (heroEntryHold > 0 && !holdStarted) heroEntryHold = Math.max(0, heroEntryHold - dt);
    updateItemEvents(dt);
    updateEffects(dt);
    if (coreHP <= 0) {
      coreHP = 0;
      clearCoreHitEffects();
      gameState = "dead";
    }
  }

  function resetGame(seed = options.seed ?? autoSeed(), nextLoop = loop, resetOptions = {}) {
    random = typeof options.random === "function" ? options.random : mulberry32(seed);
    loop = clampLoop(nextLoop);
    if (Object.prototype.hasOwnProperty.call(resetOptions, "resetPenaltyActive")) resetPenaltyActive = !!resetOptions.resetPenaltyActive;
    monsters = [];
    heroes = [];
    eggs = [];
    effects = [];
    spawnQueue = [];
    pickups = [];
    items = [];
    debuffItems = [];
    itemOffer = null;
    shopOffer = null;
    trapOffer = null;
    debuffNotice = null;
    itemEvents = [];
    usedItems = new Set();
    slowFields = [];
    clearDialogue();
    nutrients = START_NUT;
    coreMax = CORE_MAX;
    coreHP = CORE_MAX;
    wave = 0;
    waveElapsed = 0;
    score = 0;
    kills = 0;
    playerDigCount = 0;
    waveCountdown = FIRST_GRACE;
    heroEntryHold = 0;
    waveSettleDelay = 0;
    waveSettled = 0;
    movementTickTimer = 0;
    veinSpawnTimer = 0;
    events = [];
    idc = 0;
    unlocked = new Set(Object.keys(VEIN).filter((key) => VEIN[key].unlock <= 1));
    gameState = "playing";
    buildGrid();
    if (!resetOptions.skipInitialDebuffs) {
      if (loop >= TERMINATOR_LOOP) banner("20周目 ─ 全冒険者がXターミネーター化");
      applyInitialDebuffs();
    }
  }

  function startGame(nextLoop = loop, resetOptions = {}) {
    resetGame(options.seed ?? autoSeed(), nextLoop, resetOptions);
    const showIntro = resetOptions.showIntro !== false;
    if (loop === 1 && showIntro) openDialogue("intro", gameState);
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

  resetGame(options.seed ?? autoSeed(), loop, { resetPenaltyActive, skipInitialDebuffs: true });
  gameState = "title";

  return {
    get monsters() { return monsters; },
    get heroes() { return heroes; },
    get eggs() { return eggs; },
    get grid() { return grid; },
    get effects() { return effects; },
    get spawnQueue() { return spawnQueue; },
    get pickups() { return pickups; },
    get slowFields() { return slowFields; },
    get items() { return items; },
    get debuffItems() { return debuffItems; },
    get itemOffer() { return itemOffer ? { wave: itemOffer.wave, choices: [...itemOffer.choices] } : null; },
    get shopOffer() { return shopOffer ? { wave: shopOffer.wave, goods: shopOffer.goods.map((g) => ({ ...g })) } : null; },
    get trapOffer() { return trapOffer ? { wave: trapOffer.wave, choices: [...trapOffer.choices] } : null; },
    get debuffNotice() { return debuffNotice ? { ids: [...debuffNotice.ids], penalty: !!debuffNotice.penalty } : null; },
    get dialogue() { return dialogueSnapshot(); },
    get postWaveEvent() { return itemOffer ? "item" : (shopOffer ? "shop" : (trapOffer ? "trap" : null)); },
    get itemEvents() { return itemEvents; },
    get usedItems() { return [...usedItems]; },
    get canRerollItemOffer() { return !!itemOffer && hasItem("wildCard") && !usedItems.has("wildCard"); },
    get unlocked() { return unlocked; },
    get monsterDeck() { return { ...monsterDeck }; },
    get wave() { return wave; },
    set wave(v) { wave = v; },
    get waveElapsed() { return waveElapsed; },
    set waveElapsed(v) { waveElapsed = v; },
    get coreMax() { return coreMax; },
    get CORE_MAX() { return coreMax; },
    get coreHP() { return coreHP; },
    set coreHP(v) { coreHP = v; },
    get nutrients() { return nutrients; },
    set nutrients(v) { nutrients = v; },
    get score() { return score; },
    get scoreMultiplier() { return scoreMultiplier(); },
    get kills() { return kills; },
    get loop() { return loop; },
    set loop(v) { loop = clampLoop(v); },
    get playerDigCount() { return playerDigCount; },
    get waveCountdown() { return waveCountdown; },
    set waveCountdown(v) { waveCountdown = v; },
    get heroEntryHold() { return heroEntryHold; },
    set heroEntryHold(v) { heroEntryHold = v; },
    get waveSettleDelay() { return waveSettleDelay; },
    get waveSettled() { return waveSettled; },
    get gameState() { return gameState; },
    set gameState(v) {
      gameState = v;
      if (v !== "dialogue") clearDialogue();
    },
    get ruleConfig() { return clonePlain(ruleConfig); },
    setRandom(fn) { random = fn; },
    update, resetGame, startGame, gameOver, tryDig, isDiggable, startWave, tauntEarly, settleWave, chooseItemOffer, rerollItemOffer, buyShopItem, closeShopOffer, chooseTrapDebuff, acknowledgeDebuffNotice, advanceDialogue, clearCoreHitEffects, drainEvents,
    hasItem, applyItem, hasDebuff, applyDebuff, itemUnlocked, availableItemIds,
    updateVeinTouchEvolution, updateVeinAging, updateVeinSpawning, veinSpawnChance, veinTypeSpawnWeight, veinTouchNeed, veinNextTouchNeed, evoStageOf, soilManaOf, beginMove, updateVisualPosition, setAction, actorPose,
    dirFromDelta, faceToward, actorAction, spawnMonster, spawnHero, spawnInTunnel, spawnEgg,
    pickHeroClass, heroClassWeightForWave, heroStep, openNeighbors, openFreeNeighbors, reachableMonsterCells, hasLOS, dragonFireCells, occupied, actorOccupied, eggOccupied, hatchSpot,
    isHeroEntryZone, isCoreCell, isCoreAttackCell, canCoreAttackFrom, isMonsterForbiddenCell, itemHighlights, itemRarity, itemShopPrice,
    countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, evoLevelOf, canBeEatenBy, canLayEgg, rankOf,
    resolveHeroStats, heroDamageTaken, heroAttackPower, monsterAttackPower, damageHero, damageMonster,
    KINDS, VEIN, HERO_CLASSES, ITEMS, ITEM_RARITIES, ITEM_UNLOCKS, MONSTER_FAMILIES, DEFAULT_MONSTER_DECK, DEBUFF_ITEMS, POST_WAVE_EVENT_CHANCE, POST_WAVE_EVENT_WEIGHTS, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HERO_ENTRY_HOLD, WAVE_SETTLE_DELAY, MOVEMENT_TICK, HEROES_PER_WAVE_CAP, MAX_WAVE, MAX_LOOP,
    VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, EAT_CHECK, EAT_CHANCE_STEP, heroDigDmg, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
    SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
    VEIN_CAP, EFFECT_CAP, MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ITEM_OFFER_CHOICES, get ITEM_CAP() { return effectiveItemCap(); }, SHOP_STOCK_COUNT, TRAP_EVENT_START_LOOP, DEBUFF_START_LOOP, TERMINATOR_LOOP, REAPER_SPAWN_CHANCE, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTOR_RENDER_DIRS, PIXEL_ACTIONS, PIXEL_ACTOR_FRAMES_PER_ACTOR, PIXEL_ACTOR_ATLAS_COLUMNS, PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR, PIXEL_ACTORS, PIXEL_ACTOR_SHEETS, PIXEL_TILES, PIXEL_EFFECTS, PIXEL_ITEMS, PIXEL_DEBUFFS, PIXEL_DIALOGUE_PORTRAITS,
    PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, pixelActorFrameInfo, pixelActorFrameIndex, pixelActorSheetName, pixelActorTextureKey, pixelActorFileName, pixelItemFrameIndex, pixelDebuffFrameIndex, pixelDialoguePortraitFrameIndex, cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD,
  };
}

export const Core = {
  DEFAULT_RULE_CONFIG, RULE_CONSTANT_KEYS, RULE_TABLE_NUMBER_KEYS, createRuleConfig, resolveMonsterDeck,
  VEIN, KINDS, HERO_CLASSES, ITEMS, ITEM_RARITIES, ITEM_UNLOCKS, MONSTER_FAMILIES, DEFAULT_MONSTER_DECK, DEBUFF_ITEMS, POST_WAVE_EVENT_CHANCE, POST_WAVE_EVENT_WEIGHTS, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER, HERO_ENTRY_HOLD, WAVE_SETTLE_DELAY, MOVEMENT_TICK, HEROES_PER_WAVE_CAP, MAX_WAVE, MAX_LOOP,
  VEIN_SPAWN_TICK, VEIN_SPAWN_BASE_CHANCE, VEIN_SPAWN_SOIL_WEIGHT, VEIN_SPAWN_SOIL_CHANCES, VEIN_SPAWN_BURST_CAP,
  EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, BORN_ANIM, EVO_TIME, VEIN_FADE_START, VEIN_DECAY_TIME,
  SOIL_MANA_MAX_STAGE, SOIL_CHARGE_MOVES, SOIL_MANA_EVO_STEP, SOIL_MANA_EVO_MAX,
  CORE_MAX, VEIN_CAP, EAT_CHECK, EAT_CHANCE_STEP, EFFECT_CAP, MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ITEM_OFFER_CHOICES, ITEM_CAP, SHOP_STOCK_COUNT, TRAP_EVENT_START_LOOP, DEBUFF_START_LOOP, TERMINATOR_LOOP, REAPER_SPAWN_CHANCE, ENTRANCE_COL, ENTRY_ZONE_COLS, ENTRY_ZONE_ROWS, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
  PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTOR_RENDER_DIRS, PIXEL_ACTIONS, PIXEL_ACTOR_FRAMES_PER_ACTOR, PIXEL_ACTOR_ATLAS_COLUMNS, PIXEL_ACTOR_ATLAS_ROWS_PER_ACTOR, PIXEL_ACTORS, PIXEL_ACTOR_SHEETS, PIXEL_TILES, PIXEL_EFFECTS, PIXEL_ITEMS, PIXEL_DEBUFFS, PIXEL_DIALOGUE_PORTRAITS,
  PIXEL_ASSET_VERSION, pixelAssetUrl, pixelActorX, pixelActorFrameInfo, pixelActorFrameIndex, pixelActorSheetName, pixelActorTextureKey, pixelActorFileName, pixelItemFrameIndex, pixelDebuffFrameIndex, pixelDialoguePortraitFrameIndex, heroDigDmg, resolveHeroStats, loopHpMultiplier, loopAtkMultiplier, loopScoreMultiplier, clampLoop, cx, cy,
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
