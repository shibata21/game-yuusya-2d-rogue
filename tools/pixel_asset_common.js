"use strict";

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const CELL = 48;
const FRAMES = 4;
const DIRECTIONS = ["e", "se", "s", "sw", "w", "nw", "n", "ne"];
const ACTOR_RENDER_DIRECTIONS = ["e", "se", "s", "ne", "n"];
const ACTIONS = ["idle", "attack", "cast", "dig", "heal", "eat", "dodge"];
const ACTOR_FRAMES_PER_ACTOR = FRAMES * ACTOR_RENDER_DIRECTIONS.length * ACTIONS.length;
const ACTOR_ATLAS_COLUMNS = ACTOR_FRAMES_PER_ACTOR / 2;
const ACTOR_ATLAS_ROWS_PER_ACTOR = ACTOR_FRAMES_PER_ACTOR / ACTOR_ATLAS_COLUMNS;
const OUT_DIR = path.join("assets", "pixel");
const SOURCE_DIR = path.join(OUT_DIR, "source", "imagegen-v1");

const ACTORS = [
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
const ACTOR_SHEETS = {
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
const TILES = [
  "earth", "tunnel", "bedrock", "surface", "core",
  "moss", "meat", "venom", "stone", "ember",
  "moss_evo", "meat_evo", "venom_evo", "stone_evo", "ember_evo",
  "moss_evo2", "meat_evo2", "venom_evo2", "stone_evo2", "ember_evo2",
];
const EFFECTS = ["slash", "shot", "bite", "birth", "puff"];
const ITEM_ICONS = [
  "rustyPickaxe", "blackSoilBag", "undergroundLantern", "crackedMap", "masonGloves", "deepCompass", "oldIncense",
  "herdFlute", "warmNest", "eggGuardBell", "boneMeal", "redCollar", "warPaint", "sleepSand", "curseNail", "blackBell", "stickyMud",
  "coreShard", "coreBandage", "redSealingWax", "quakeStone", "leftoverMeat", "silverMuzzle", "bloodyPlate", "trainingStick",
  "victoryBoneFlute", "crybabyBell", "shadowThread", "spareHeart", "ledger", "tornWallet", "demonCoin", "fakeGold", "wildCard",
  "thiefBag", "dryBread", "blackSeed", "reversedHourglass", "earlyDrum", "breathingFlute", "gapStake", "moleClaw", "obsidianLid",
  "wanderingPowder", "trailMark", "charmRope", "angerMask", "nestFlag", "oldEggshell", "crackedEgg", "royalEggshell", "rottenCrown",
  "rebelCharm", "crowdMark", "lowestCandle", "blackRaindrop", "redMoonShard", "boneContract",
  "undergroundStore", "veinBrush", "denLedger", "homeChime", "shopStamp", "corePiggyBank",
];
const DEBUFF_ICONS = ["rottenRations", "crackedCore", "informantMap", "sharpenedBlade", "dullFeed"];
const DIALOGUE_PORTRAITS = ["executive", "gorilla"];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function image(w = CELL, h = CELL) {
  return new PNG({ width: w, height: h });
}

function writePng(file, img) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, PNG.sync.write(img));
}

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function copyInto(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      const di = ((dy + y) * dst.width + dx + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
}

module.exports = {
  CELL, FRAMES, DIRECTIONS, ACTOR_RENDER_DIRECTIONS, ACTIONS, ACTOR_FRAMES_PER_ACTOR, ACTOR_ATLAS_COLUMNS, ACTOR_ATLAS_ROWS_PER_ACTOR, OUT_DIR, SOURCE_DIR, ACTORS, ACTOR_SHEETS, TILES, EFFECTS, ITEM_ICONS, DEBUFF_ICONS, DIALOGUE_PORTRAITS,
  ensureDir, image, writePng, readPng, copyInto,
};
