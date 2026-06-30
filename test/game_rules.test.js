"use strict";

import { describe, expect, it, beforeEach } from "vitest";
import {
  createGame,
  createRuleConfig,
  KINDS,
  HERO_CLASSES,
  ITEM_UNLOCKS,
  VEIN,
  PIXEL_ITEMS,
  PIXEL_DEBUFFS,
  POST_WAVE_EVENT_CHANCE,
  loopHpMultiplier,
  loopAtkMultiplier,
  loopScoreMultiplier,
} from "../src/gameCore.js";

let G;

function carveAll() {
  for (let r = 0; r < G.ROWS; r++) {
    for (let c = 0; c < G.COLS; c++) {
      G.grid[r][c] = { t: "tunnel", sub: null, shade: 0 };
    }
  }
  G.grid[0][G.ENTRANCE_COL].t = "surface";
  G.grid[G.CORE_ROW][G.CORE_COL].t = "core";
}

function hero(cls, col, row, extra = {}) {
  const c = HERO_CLASSES[cls];
  return {
    id: 1000 + G.heroes.length,
    cls,
    col,
    row,
    px: G.cx(col),
    py: G.cy(row),
    faceDir: "s",
    hp: 60,
    maxHp: 100,
    atk: 10,
    defense: c.defense || 0,
    range: c.range,
    wave: 5,
    moveCd: Math.round(720 * c.moveMul),
    atkCd: 0,
    coreCd: 0,
    actCd: 999999,
    healCd: 999999,
    blockedMs: 0,
    actionType: "idle",
    actionTime: 0,
    moveAnim: 0,
    ...extra,
  };
}

beforeEach(() => {
  G = createGame({ seed: 1 });
  G.resetGame(1);
});

function advanceDialogueAll(game = G) {
  for (let i = 0; i < 20 && game.gameState === "dialogue"; i++) game.advanceDialogue();
}

describe("ゲームルール", () => {
  it("初期盤面と資源が正しい", () => {
    expect(G.grid).toHaveLength(G.ROWS);
    expect(G.grid[0]).toHaveLength(G.COLS);
    expect(G.grid[0][G.ENTRANCE_COL].t).toBe("surface");
    expect(G.grid[0][G.ENTRANCE_COL - 1].t).toBe("bedrock");
    expect(G.grid[0][G.ENTRANCE_COL + 1].t).toBe("bedrock");
    expect(G.isHeroEntryZone(G.ENTRANCE_COL, 0)).toBe(false);
    expect(G.isMonsterForbiddenCell(G.ENTRANCE_COL, 0)).toBe(true);
    for (const c of G.ENTRY_ZONE_COLS) {
      for (const r of G.ENTRY_ZONE_ROWS) {
        expect(G.grid[r][c].t).toBe("tunnel");
        expect(G.isHeroEntryZone(c, r)).toBe(true);
        expect(G.isMonsterForbiddenCell(c, r)).toBe(true);
      }
    }
    expect(G.grid[G.CORE_ROW][G.CORE_COL].t).toBe("core");
    expect(G.isMonsterForbiddenCell(G.CORE_COL, G.CORE_ROW)).toBe(true);
    expect(G.nutrients).toBe(G.START_NUT);
    expect(G.playerDigCount).toBe(0);
    expect(G.isDiggable(G.ENTRANCE_COL, 3)).toBe(true);
    expect(G.grid.flat().filter((t) => t.sub === "moss")).toHaveLength(8);
    expect(G.grid.flat().filter((t) => t.sub === "meat")).toHaveLength(3);
  });

  it("初期鉱脈は上下固定ではなくスライム多めでランダム配置される", () => {
    const mossRows = [];
    const meatRows = [];
    let seenTopEdge = false;
    let seenBottomEdge = false;
    for (let seed = 1; seed <= 64; seed++) {
      const game = createGame({ seed });
      const moss = [];
      const meat = [];
      for (let r = 0; r < game.ROWS; r++) for (let c = 0; c < game.COLS; c++) {
        if (game.grid[r][c].sub === "moss") moss.push(r);
        if (game.grid[r][c].sub === "meat") meat.push(r);
        if (game.grid[r][c].sub && r === 1) seenTopEdge = true;
        if (game.grid[r][c].sub && r === game.CORE_ROW) seenBottomEdge = true;
      }
      expect(moss).toHaveLength(8);
      expect(meat).toHaveLength(3);
      mossRows.push(...moss);
      meatRows.push(...meat);
    }
    expect(Math.max(...mossRows)).toBeGreaterThan(9);
    expect(Math.min(...meatRows)).toBeLessThan(8);
    expect(seenTopEdge).toBe(true);
    expect(seenBottomEdge).toBe(true);
  });

  it("鉱脈を掘ると魔物が出て固定コストを消費する", () => {
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: "moss", shade: 0, evo: false };
    G.grid[2][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    expect(G.isDiggable(G.ENTRANCE_COL, 3)).toBe(true);
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.grid[3][G.ENTRANCE_COL].t).toBe("tunnel");
    expect(G.monsters).toHaveLength(1);
    expect(G.monsters[0].kind).toBe("slime");
    expect(G.nutrients).toBe(G.START_NUT - G.DIG_COST);
    expect(G.playerDigCount).toBe(1);
    expect(G.isDiggable(G.ENTRANCE_COL, 3)).toBe(false);
  });

  it("上位鉱脈から上位種が出る", () => {
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: "moss", shade: 0, evo: true };
    G.grid[2][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.monsters[0].kind).toBe("superslime");
  });

  it("第二進化鉱脈から第二進化種が出る", () => {
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: "moss", shade: 0, evoStage: 2, evo: true };
    G.grid[2][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.monsters[0].kind).toBe("crownslime");
  });

  it("モンスターデッキは通常・進化・第二進化をファミリー単位で差し替える", () => {
    for (const [stage, expected] of [[0, "moss_shroom"], [1, "moss_mycelia"], [2, "moss_myceliaKing"]]) {
      const decked = createGame({ seed: 8, monsterDeck: { moss: "moss_shroom" } });
      decked.resetGame(1);
      decked.grid[2][decked.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
      decked.grid[3][decked.ENTRANCE_COL] = { t: "earth", sub: "moss", shade: 0, evoStage: stage, evo: stage > 0 };
      decked.tryDig(decked.ENTRANCE_COL, 3);
      expect(decked.monsters[0].kind).toBe(expected);
    }
  });

  it("追加モンスターの代表特性が発火する", () => {
    carveAll();
    G.grid[5][7] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.spawnMonster("moss_shroom", 5, 5);
    G.beginMove(G.monsters[0], 6, 5);
    expect(G.grid[5][7].soilMana).toBeGreaterThan(0);

    G.monsters.length = 0;
    G.heroes.length = 0;
    G.spawnMonster("moss_virus", 5, 5);
    G.spawnHero("warrior", 6, 5);
    const h = G.heroes[0];
    h.atk = 20;
    const beforeAtk = G.heroAttackPower(h);
    G.damageHero(h, 1, G.monsters[0]);
    expect(h.weakenMs).toBeGreaterThan(0);
    expect(G.heroAttackPower(h)).toBeLessThan(beforeAtk);

    G.monsters.length = 0;
    G.heroes.length = 0;
    G.spawnMonster("meat_hedgehog", 5, 5);
    G.spawnHero("warrior", 6, 5);
    const heroHp = G.heroes[0].hp;
    G.damageMonster(G.monsters[0], 1, "#fff", G.heroes[0]);
    expect(G.heroes[0].hp).toBeLessThan(heroHp);
  });

  it("鉱脈は時間ではなく魔物接触で進化する", () => {
    carveAll();
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, evo: false, evoTouch: 0, evoTouching: {} };
    G.update(100);
    expect(G.grid[r][c].evo).toBe(false);
    for (const [col, row] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]) G.spawnMonster("slime", col, row);
    G.update(100);
    expect(G.grid[r][c].evo).toBe(true);
    expect(G.grid[r][c].evoTouch).toBeGreaterThanOrEqual(VEIN.moss.touchNeed);
  });

  it("鉱脈は上位から第二進化へ進む", () => {
    carveAll();
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, evo: false, evoStage: 1, evoTouch: 4, evoStageTouch: VEIN.moss.finalTouchNeed - 1, evoTouching: {} };
    G.spawnMonster("slime", c + 1, r);
    G.update(100);
    expect(G.grid[r][c].evoStage).toBe(2);
    expect(G.grid[r][c].evo).toBe(true);

    G.monsters.length = 0;
    G.tryDig(c, r);
    expect(G.monsters[0].kind).toBe("crownslime");
  });

  it("鉱脈進化は斜め接触を数えない", () => {
    carveAll();
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, evo: false, evoTouch: 0, evoTouching: {} };
    for (const [col, row] of [[c + 1, r + 1], [c - 1, r + 1], [c + 1, r - 1], [c - 1, r - 1]]) G.spawnMonster("slime", col, row);
    G.update(100);
    expect(G.grid[r][c].evo).toBe(false);
    expect(G.grid[r][c].evoTouch || 0).toBe(0);
  });

  it("後半鉱脈ほど進化に必要な接触数が多い", () => {
    expect(VEIN.moss.touchNeed).toBeLessThan(VEIN.meat.touchNeed);
    expect(VEIN.meat.touchNeed).toBeLessThan(VEIN.venom.touchNeed);
    expect(VEIN.venom.touchNeed).toBeLessThan(VEIN.stone.touchNeed);
    expect(VEIN.stone.touchNeed).toBeLessThan(VEIN.ember.touchNeed);
  });

  it("第二進化は専用の重い接触数を要求する", () => {
    expect(VEIN.moss.finalTouchNeed).toBe(14);
    expect(VEIN.meat.finalTouchNeed).toBe(22);
    expect(VEIN.venom.finalTouchNeed).toBe(34);
    expect(VEIN.stone.finalTouchNeed).toBe(50);
    expect(VEIN.ember.finalTouchNeed).toBe(70);

    carveAll();
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, evo: true, evoStage: 1, evoTouch: 0, evoStageTouch: VEIN.moss.finalTouchNeed - 2, evoTouching: {} };
    expect(G.veinNextTouchNeed("moss", G.grid[r][c])).toBe(VEIN.moss.finalTouchNeed);
    G.spawnMonster("slime", c + 1, r);
    G.update(100);
    expect(G.grid[r][c].evoStage).toBe(1);

    G.monsters.length = 0;
    G.grid[r][c].evoStageTouch = VEIN.moss.finalTouchNeed - 1;
    G.grid[r][c].evoTouching = {};
    G.spawnMonster("slime", c - 1, r);
    G.update(100);
    expect(G.grid[r][c].evoStage).toBe(2);
  });

  it("魔物が通った周囲の土壁は7段階まで魔素を帯びる", () => {
    carveAll();
    G.grid[4][5] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.spawnMonster("slime", 5, 5);
    const m = G.monsters[0];
    for (let i = 0; i < G.SOIL_CHARGE_MOVES; i++) {
      G.beginMove(m, i % 2 === 0 ? 6 : 5, 5);
      m.moveAnim = 0;
    }
    expect(G.grid[4][5].soilMana).toBe(1);

    G.monsters.length = 0;
    G.grid[4][5].soilMana = 5;
    G.spawnMonster("titan", 5, 5);
    const titan = G.monsters[0];
    for (let i = 0; i < G.SOIL_CHARGE_MOVES; i++) {
      G.beginMove(titan, i % 2 === 0 ? 6 : 5, 5);
      titan.moveAnim = 0;
    }
    expect(G.grid[4][5].soilMana).toBe(6);

    G.monsters.length = 0;
    G.grid[4][5].soilMana = 6;
    G.spawnMonster("slime", 5, 5);
    const capper = G.monsters[0];
    for (let i = 0; i < G.SOIL_CHARGE_MOVES; i++) {
      G.beginMove(capper, i % 2 === 0 ? 6 : 5, 5);
      capper.moveAnim = 0;
    }
    expect(G.grid[4][5].soilMana).toBe(G.SOIL_MANA_MAX_STAGE);
  });

  it("掘った土壁は魔素を失い、魔素の高い鉱脈は早く進化する", () => {
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: null, shade: 0, soilMana: 5 };
    G.grid[2][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.grid[3][G.ENTRANCE_COL].t).toBe("tunnel");
    expect(G.grid[3][G.ENTRANCE_COL].soilMana).toBe(0);

    G.resetGame(1);
    carveAll();
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, soilMana: 6, evo: false, evoStage: 0, evoTouch: 0, evoStageTouch: 0, evoTouching: {} };
    for (const [col, row] of [[c + 1, r], [c - 1, r], [c, r + 1]]) G.spawnMonster("slime", col, row);
    G.update(100);
    expect(G.grid[r][c].evoStage).toBe(1);
  });

  it("ウェーブ開始では鉱脈を補充せず、時間経過で自然発生する", () => {
    const before = G.grid.flat().filter((t) => t.sub).length;
    G.startWave();
    expect(G.grid.flat().filter((t) => t.sub)).toHaveLength(before);

    carveAll();
    G.grid[5][5] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.setRandom(() => 0);
    expect(G.updateVeinSpawning(G.VEIN_SPAWN_TICK)).toBe(1);
    expect(G.grid[5][5].sub).toBe("moss");
  });

  it("魔素の高い土壌ほど鉱脈が自然発生しやすい", () => {
    expect(G.VEIN_SPAWN_SOIL_CHANCES).toHaveLength(G.SOIL_MANA_MAX_STAGE + 1);
    expect(G.veinSpawnChance({ t: "earth", sub: null, soilMana: 1 })).toBeGreaterThan(G.veinSpawnChance({ t: "earth", sub: null, soilMana: 0 }) * 4);
    expect(G.veinSpawnChance({ t: "earth", sub: null, soilMana: 7 })).toBeGreaterThan(G.veinSpawnChance({ t: "earth", sub: null, soilMana: 0 }));
    expect(G.veinSpawnChance({ t: "tunnel", sub: null, soilMana: 7 })).toBe(0);
    expect(G.veinSpawnChance({ t: "earth", sub: "moss", soilMana: 7 })).toBe(0);

    carveAll();
    G.grid[5][5] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.setRandom(() => 0.01);
    expect(G.updateVeinSpawning(G.VEIN_SPAWN_TICK)).toBe(0);

    G.resetGame(1);
    carveAll();
    G.grid[5][5] = { t: "earth", sub: null, shade: 0, soilMana: 5 };
    G.setRandom(() => 0.01);
    expect(G.updateVeinSpawning(G.VEIN_SPAWN_TICK)).toBe(1);
    expect(G.grid[5][5].sub).not.toBe(null);
  });

  it("魔素の高い土壌ほど強い鉱脈が選ばれやすい", () => {
    const low = { t: "earth", sub: null, soilMana: 0 };
    const high = { t: "earth", sub: null, soilMana: 7 };
    expect(G.veinTypeSpawnWeight("moss", low)).toBeGreaterThan(G.veinTypeSpawnWeight("ember", low));
    expect(G.veinTypeSpawnWeight("ember", high)).toBeGreaterThan(G.veinTypeSpawnWeight("moss", high));
    expect(G.veinTypeSpawnWeight("stone", high)).toBeGreaterThan(G.veinTypeSpawnWeight("stone", low));
  });

  it("自然発生候補は魔素の高い土から優先して鉱脈化する", () => {
    carveAll();
    G.grid[5][2] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.grid[5][3] = { t: "earth", sub: null, shade: 0, soilMana: 0 };
    G.grid[5][4] = { t: "earth", sub: null, shade: 0, soilMana: 6 };
    G.grid[5][5] = { t: "earth", sub: null, shade: 0, soilMana: 7 };
    G.setRandom(() => 0);
    expect(G.updateVeinSpawning(G.VEIN_SPAWN_TICK)).toBe(G.VEIN_SPAWN_BURST_CAP);
    expect(G.grid[5][4].sub).not.toBe(null);
    expect(G.grid[5][5].sub).not.toBe(null);
    const lowSpawns = [G.grid[5][2], G.grid[5][3]].filter((t) => t.sub).length;
    expect(lowSpawns).toBe(1);
  });

  it("自然発生する鉱脈は解禁と上限を守る", () => {
    carveAll();
    G.wave = 2;
    G.grid[5][5] = { t: "earth", sub: null, shade: 0, soilMana: 7 };
    G.setRandom(() => 0);
    G.updateVeinSpawning(G.VEIN_SPAWN_TICK);
    expect(["moss", "meat"]).toContain(G.grid[5][5].sub);

    G.resetGame(1);
    carveAll();
    let placed = 0;
    for (let r = 1; r < G.ROWS - 1; r++) for (let c = 1; c < G.COLS - 1; c++) {
      if (placed >= G.VEIN_CAP) continue;
      G.grid[r][c] = { t: "earth", sub: "moss", shade: 0 };
      placed++;
    }
    G.grid[14][9] = { t: "earth", sub: null, shade: 0, soilMana: 7 };
    G.setRandom(() => 0);
    expect(G.updateVeinSpawning(G.VEIN_SPAWN_TICK)).toBe(0);
    expect(G.grid[14][9].sub).toBe(null);
  });

  it("掘られない鉱脈は薄くなる時間を経て消滅し、土に戻る", () => {
    carveAll();
    G.waveCountdown = 999999;
    G.grid[5][5] = { t: "earth", sub: "moss", shade: 0, evo: false, age: 0, evoTouch: 0, evoTouching: {} };
    G.update(G.VEIN_FADE_START - 1);
    expect(G.grid[5][5].sub).toBe("moss");
    expect(G.grid[5][5].age).toBeLessThan(G.VEIN_FADE_START);
    G.update(2);
    expect(G.grid[5][5].sub).toBe("moss");
    expect(G.grid[5][5].age).toBeGreaterThan(G.VEIN_FADE_START);
    G.update(G.VEIN_DECAY_TIME - G.VEIN_FADE_START - 3);
    expect(G.grid[5][5].sub).toBe("moss");
    G.update(2);
    expect(G.grid[5][5].t).toBe("earth");
    expect(G.grid[5][5].sub).toBe(null);
    expect(G.grid[5][5].evo).toBe(false);
    expect(G.effects.some((e) => e.type === "puff")).toBe(true);
  });

  it("上位化した鉱脈は消滅タイマーをリセットする", () => {
    carveAll();
    G.waveCountdown = 999999;
    const c = 5;
    const r = 5;
    G.grid[r][c] = { t: "earth", sub: "moss", shade: 0, evo: false, age: G.VEIN_DECAY_TIME - 1, evoTouch: 0, evoTouching: {} };
    for (const [col, row] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]) G.spawnMonster("slime", col, row);
    G.update(100);
    expect(G.grid[r][c].sub).toBe("moss");
    expect(G.grid[r][c].evo).toBe(true);
    expect(G.grid[r][c].age).toBeLessThan(G.VEIN_DECAY_TIME);
  });

  it("掘らなければ魔物は自然発生しない", () => {
    for (let i = 0; i < 70; i++) G.update(1000);
    expect(G.monsters).toHaveLength(0);
  });

  it("下位種は直接増殖し、上位種は直接増殖しない", () => {
    carveAll();
    G.spawnMonster("slime", 5, 5);
    G.monsters[0].breedCd = 0;
    G.update(100);
    expect(G.monsters).toHaveLength(2);
    expect(G.monsters.every((m) => m.kind === "slime")).toBe(true);

    G.resetGame(1);
    carveAll();
    G.spawnMonster("superslime", 5, 5);
    G.monsters[0].breedCd = 0;
    G.update(1000);
    expect(G.monsters).toHaveLength(1);
    expect(G.eggs).toHaveLength(0);
  });

  it("卵を産むのは毒蜘蛛以上で、スーパースライムと凶牙獣は産卵しない", () => {
    carveAll();
    for (const kind of ["superslime", "evolved", "crownslime", "direfang"]) {
      expect(G.canLayEgg(kind), kind).toBe(false);
      expect(G.spawnEgg(kind, 1, 1), kind).toBe(false);
    }
    for (const [i, kind] of ["spitter", "golem", "flame", "tarantula", "titan", "infernal", "goldweaver", "goldcore", "whiteflame"].entries()) {
      expect(G.canLayEgg(kind), kind).toBe(true);
      expect(G.spawnEgg(kind, 1 + (i % 9), 4 + Math.floor(i / 9)), kind).toBe(true);
    }
  });

  it("毒蜘蛛系は中盤の攻撃で瞬殺されない耐久を持つ", () => {
    const mageAtk = G.resolveHeroStats("mage", 5).atk;
    const warriorAtk = G.resolveHeroStats("warrior", 5).atk;
    expect(KINDS.spitter.hp).toBeGreaterThan(mageAtk * 2);
    expect(KINDS.tarantula.hp).toBeGreaterThan(warriorAtk * 4);
  });

  it("蜘蛛以降のモンスターは中強化したステータスを持つ", () => {
    expect(KINDS.slime).toMatchObject({ aggro: 3 });
    expect(KINDS.superslime).toMatchObject({ aggro: 3 });
    expect(KINDS.crownslime).toMatchObject({ aggro: 4 });
    expect(KINDS.spitter).toMatchObject({ hp: 34, atk: 8 });
    expect(KINDS.golem).toMatchObject({ hp: 125, atk: 5 });
    expect(KINDS.flame).toMatchObject({ hp: 84, atk: 18, range: 3 });
    expect(KINDS.tarantula).toMatchObject({ hp: 108, atk: 19 });
    expect(KINDS.titan).toMatchObject({ hp: 285, atk: 16 });
    expect(KINDS.infernal).toMatchObject({ hp: 195, atk: 34, range: 3 });
    expect(KINDS.goldweaver).toMatchObject({ hp: 205, atk: 36 });
    expect(KINDS.goldcore).toMatchObject({ hp: 540, atk: 31 });
    expect(KINDS.whiteflame).toMatchObject({ hp: 390, atk: 62, range: 3 });
  });

  it("産卵確率は種別ごとに変わり、強いモンスターほど低い", () => {
    expect(KINDS.spitter.eggChance).toBeGreaterThan(KINDS.titan.eggChance);
    expect(KINDS.golem.eggChance).toBeCloseTo(0.08);
    expect(KINDS.titan.eggChance).toBeCloseTo(0.035);
    expect(KINDS.goldcore.eggChance).toBeCloseTo(0.012);
    expect(KINDS.flame.eggChance).toBeCloseTo(0.055);
    expect(KINDS.infernal.eggChance).toBeCloseTo(0.025);
    expect(KINDS.whiteflame.eggChance).toBeCloseTo(0.01);
    carveAll();
    G.setRandom(() => 0.19);
    G.spawnMonster("spitter", 5, 5);
    G.monsters[0].eggCd = 0;
    G.update(100);
    expect(G.eggs).toHaveLength(1);
    expect(G.eggs[0].kind).toBe("spitter");

    G.resetGame(1);
    carveAll();
    G.setRandom(() => 0.04);
    G.spawnMonster("titan", 5, 5);
    G.monsters[0].eggCd = 0;
    G.update(100);
    expect(G.eggs).toHaveLength(0);

    G.resetGame(1);
    carveAll();
    G.setRandom(() => 0.034);
    G.spawnMonster("titan", 5, 5);
    G.monsters[0].eggCd = 0;
    G.update(100);
    expect(G.eggs).toHaveLength(1);
    expect(G.eggs[0].kind).toBe("titan");
  });

  it("卵は同じ種に孵化する", () => {
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    G.waveCountdown = 999999;
    G.monsters.forEach((m) => { m.eggCd = 999999; });
    G.setRandom(() => 0.99);
    G.update(G.EGG_HATCH);
    expect(G.eggs).toHaveLength(0);
    expect(G.monsters.some((m) => m.kind === "spitter")).toBe(true);
  });

  it("卵は冒険者の攻撃対象にならない", () => {
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    G.heroes.push(hero("warrior", 5, 6, { atkCd: 0 }));
    G.update(500);
    expect(G.eggs).toHaveLength(1);
  });

  it("卵は冒険者と魔物が通過できる床上オブジェクトになる", () => {
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    expect(G.occupied(5, 5)).toBe(false);
    expect(G.eggOccupied(5, 5)).toBe(true);
    const adventurer = hero("warrior", 5, 4, { actCd: 0, atkCd: 999999, moveCharge: 1 });
    G.heroes.push(adventurer);
    G.update(100);
    expect(adventurer.col).toBe(5);
    expect(adventurer.row).toBe(5);
    expect(G.eggs).toHaveLength(1);
    expect(G.occupied(5, 5)).toBe(true);

    G.heroes.length = 0;
    G.spawnMonster("carniv", 5, 4);
    const beast = G.monsters[0];
    G.heroes.push(hero("warrior", 5, 6, { actCd: 999999, atkCd: 999999 }));
    beast.moveCd = 0;
    beast.eatCd = 999999;
    G.update(100);
    expect(beast.col).toBe(5);
    expect(beast.row).toBe(5);
  });

  it("卵は孵化時に埋まっていれば近くの空き通路へずれ、空きがなければ待つ", () => {
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    G.spawnMonster("slime", 5, 5);
    G.update(G.EGG_HATCH);
    expect(G.eggs).toHaveLength(0);
    expect(G.monsters.some((m) => m.kind === "spitter" && !(m.col === 5 && m.row === 5))).toBe(true);

    G.resetGame(1);
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    for (let r = 3; r <= 7; r++) for (let c = 3; c <= 7; c++) {
      if (Math.abs(c - 5) + Math.abs(r - 5) <= 2) G.spawnMonster("slime", c, r);
    }
    G.update(G.EGG_HATCH);
    expect(G.eggs).toHaveLength(1);
    expect(G.monsters.some((m) => m.kind === "spitter")).toBe(false);
  });

  it("僧侶は回復アクションで対象方向を向く", () => {
    carveAll();
    const priest = hero("priest", 5, 5, { healCd: 0 });
    const warrior = hero("warrior", 6, 5, { hp: 20, maxHp: 80 });
    G.heroes.push(priest, warrior);
    G.update(100);
    expect(priest.actionType).toBe("heal");
    expect(priest.faceDir).toBe("e");
    expect(warrior.hp).toBeGreaterThan(20);
  });

  it("回復役は負傷割合が大きい仲間を向き、範囲内の複数冒険者を回復する", () => {
    carveAll();
    const priest = hero("priest", 5, 5, { hp: 100, maxHp: 100, healCd: 0 });
    const badlyWounded = hero("warrior", 6, 5, { hp: 25, maxHp: 100 });
    const lowTotalHp = hero("mage", 5, 6, { hp: 20, maxHp: 30 });
    G.heroes.push(priest, badlyWounded, lowTotalHp);
    G.update(100);
    expect(badlyWounded.hp).toBeGreaterThan(25);
    expect(lowTotalHp.hp).toBeGreaterThan(20);
    expect(priest.faceDir).toBe("e");
    expect(G.effects.some((e) => e.type === "healArea")).toBe(true);
  });

  it("冒険者の近接攻撃は本体を突進させず武器だけを振る", () => {
    const h = hero("warrior", 5, 5);
    G.setAction(h, "attack", G.cx(6), G.cy(5), G.ATK_ANIM);
    h.actionTime = G.ATK_ANIM / 2;
    expect(G.actorPose(h).x).toBe(0);
    expect(G.actorPose(h).y).toBe(0);
  });

  it("序列上位の魔物は下位を捕食して回復する", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("carniv", 5, 5);
    const eater = G.monsters[0];
    eater.hp = 10;
    eater.eatCd = 0;
    G.spawnMonster("slime", 5, 6);
    G.update(100);
    expect(G.monsters).toHaveLength(1);
    expect(eater.hp).toBeGreaterThan(10);
    expect(eater.actionType).toBe("eat");
    expect(G.effects.some((e) => e.type === "bite")).toBe(true);
  });

  it("HP満タンの魔物は下位魔物を捕食しない", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("carniv", 5, 5);
    const eater = G.monsters[0];
    eater.eatCd = 0;
    G.spawnMonster("slime", 5, 6);
    G.update(100);
    expect(G.monsters.map((m) => m.kind).sort()).toEqual(["carniv", "slime"]);
    expect(eater.actionType).not.toBe("eat");
  });

  it("通常モンスターは上位モンスターを捕食できない", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("flame", 5, 5);
    const eater = G.monsters[0];
    eater.eatCd = 0;
    G.spawnMonster("superslime", 5, 6);
    G.update(100);
    expect(G.monsters.map((m) => m.kind).sort()).toEqual(["flame", "superslime"]);
    expect(eater.actionType).not.toBe("eat");
    expect(G.effects.some((e) => e.type === "bite")).toBe(false);
  });

  it("第二進化モンスターは捕食されない", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("evolved", 5, 5);
    const eater = G.monsters[0];
    eater.eatCd = 0;
    G.spawnMonster("crownslime", 5, 6);
    G.update(100);
    expect(G.monsters.map((m) => m.kind).sort()).toEqual(["crownslime", "evolved"]);
    expect(eater.actionType).not.toBe("eat");
    expect(G.canBeEatenBy(eater, G.monsters.find((m) => m.kind === "crownslime"))).toBe(false);
  });

  it("遠距離LOSは壁と斜め壁角で遮断される", () => {
    carveAll();
    expect(G.hasLOS(2, 5, 8, 5)).toBe(true);
    G.grid[5][5].t = "earth";
    expect(G.hasLOS(2, 5, 8, 5)).toBe(false);
    carveAll();
    expect(G.hasLOS(2, 2, 5, 5)).toBe(true);
    G.grid[3][2].t = "earth";
    expect(G.hasLOS(2, 2, 5, 5)).toBe(false);
    G.grid[3][2].t = "tunnel";
    G.grid[2][3].t = "earth";
    expect(G.hasLOS(2, 2, 5, 5)).toBe(false);
  });

  it("遠距離攻撃は遮断されたLOSでは当たらない", () => {
    carveAll();
    G.spawnMonster("spitter", 2, 5);
    G.heroes.push(hero("warrior", 4, 5, { hp: 60, atkCd: 999999 }));
    G.grid[5][3].t = "earth";
    G.monsters[0].atkCd = 0;
    G.update(100);
    expect(G.heroes[0].hp).toBe(60);
  });

  it("飛び道具を受けても冒険者の移動待ちは増えない", () => {
    carveAll();
    G.spawnMonster("spitter", 2, 5);
    const h = hero("warrior", 4, 5, { hp: 60, actCd: 1200, atkCd: 999999, moveAnim: 0 });
    G.heroes.push(h);
    G.monsters[0].atkCd = 0;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(h.hp).toBeLessThan(60);
    expect(h.actCd).toBe(1100);
    expect(h.moveAnim).toBe(0);
  });

  it("ドラゴンの炎は3マス直線上の冒険者全員へ当たる", () => {
    carveAll();
    G.spawnMonster("flame", 2, 5);
    const near = hero("warrior", 4, 5, { hp: 60, atkCd: 999999 });
    const far = hero("mage", 5, 5, { hp: 60, atkCd: 999999 });
    const outOfRange = hero("warrior", 6, 5, { hp: 60, atkCd: 999999 });
    const offLine = hero("warrior", 4, 6, { hp: 60, atkCd: 999999 });
    G.heroes.push(near, far, outOfRange, offLine);
    G.monsters[0].atkCd = 0;
    G.update(100);
    expect(near.hp).toBeLessThan(60);
    expect(far.hp).toBeLessThan(60);
    expect(outOfRange.hp).toBe(60);
    expect(offLine.hp).toBe(60);
    expect(G.effects.some((e) => e.type === "flameLine")).toBe(true);
    expect(G.dragonFireCells(G.monsters[0], "e")).toHaveLength(3);
  });

  it("ドラゴンの炎は縦横斜め以外へ通常遠距離攻撃しない", () => {
    carveAll();
    G.spawnMonster("flame", 2, 5);
    const offLine = hero("warrior", 3, 3, { hp: 60, atkCd: 999999 });
    G.heroes.push(offLine);
    G.monsters[0].atkCd = 0;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(offLine.hp).toBe(60);
    expect(G.effects.some((e) => e.type === "flameLine" || e.type === "shot")).toBe(false);
  });

  it("ドラゴンの炎は壁で止まり、壁の先へ届かない", () => {
    carveAll();
    G.spawnMonster("flame", 2, 5);
    G.grid[5][4].t = "earth";
    const blocked = hero("warrior", 5, 5, { hp: 60, atkCd: 999999 });
    G.heroes.push(blocked);
    G.monsters[0].atkCd = 0;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(blocked.hp).toBe(60);
    expect(G.dragonFireCells(G.monsters[0], "e")).toEqual([{ col: 3, row: 5 }]);
  });

  it("近接攻撃は非隣接対象に当たらない", () => {
    carveAll();
    G.spawnMonster("slime", 2, 5);
    G.heroes.push(hero("warrior", 4, 5, { hp: 60, atkCd: 999999 }));
    G.monsters[0].atkCd = 0;
    G.update(100);
    expect(G.heroes[0].hp).toBe(60);
  });

  it("角の壁を挟んだ斜め近接では互いに認識して戦闘しない", () => {
    carveAll();
    G.grid[5][5].t = "earth";
    G.grid[6][6].t = "earth";
    G.spawnMonster("slime", 5, 6);
    const monster = G.monsters[0];
    monster.atkCd = 0;
    monster.moveCd = 999999;
    monster.eatCd = 999999;
    const adventurer = hero("warrior", 6, 5, { hp: 60, atkCd: 0, actCd: 999999 });
    G.heroes.push(adventurer);

    G.update(100);

    expect(adventurer.hp).toBe(60);
    expect(monster.hp).toBe(monster.maxHp);
    expect(monster.actionType).not.toBe("attack");
    expect(adventurer.actionType).not.toBe("attack");
    expect(adventurer.blockedMs).toBe(0);
  });

  it("片側が開いた斜め近接では遮蔽物なしとして戦闘する", () => {
    carveAll();
    G.grid[5][5].t = "earth";
    G.grid[6][6].t = "tunnel";
    G.spawnMonster("slime", 5, 6);
    const monster = G.monsters[0];
    monster.atkCd = 0;
    monster.moveCd = 999999;
    monster.eatCd = 999999;
    const adventurer = hero("warrior", 6, 5, { hp: 60, atkCd: 999999, actCd: 999999 });
    G.heroes.push(adventurer);

    G.update(100);

    expect(adventurer.hp).toBeLessThan(60);
    expect(monster.actionType).toBe("attack");
  });

  it("攻撃可能な魔物と戦闘中の勇者はクールダウン中に後退しない", () => {
    carveAll();
    G.grid[7][4].t = "earth";
    G.grid[7][6].t = "earth";
    G.spawnMonster("slime", 5, 8);
    const monster = G.monsters[0];
    monster.atkCd = 999999;
    monster.moveCd = 999999;
    monster.eatCd = 999999;
    const adventurer = hero("warrior", 5, 7, {
      atkCd: 999999,
      actCd: 999999,
      blockedMs: 4490,
      moveCharge: 1,
    });
    G.heroes.push(adventurer);

    G.update(120);

    expect(adventurer.col).toBe(5);
    expect(adventurer.row).toBe(7);
    expect(adventurer.moveIntent).toBeNull();
    expect(adventurer.blockedMs).toBe(0);
  });

  it("移動中の対象は攻撃されない", () => {
    carveAll();
    G.spawnMonster("slime", 5, 5);
    const h = hero("warrior", 5, 6, {
      hp: 60,
      moveAnim: G.MOVE_ANIM,
      moveMax: G.MOVE_ANIM,
      moveFromX: G.cx(5),
      moveFromY: G.cy(7),
      moveToX: G.cx(5),
      moveToY: G.cy(6),
    });
    G.heroes.push(h);
    G.monsters[0].atkCd = 0;
    G.update(100);
    expect(h.hp).toBe(60);
  });

  it("冒険者はコアに入らず隣接マスから攻撃する", () => {
    carveAll();
    const h = hero("warrior", G.CORE_COL, 1, { actCd: 0, atk: 7, coreCd: 0 });
    G.heroes.push(h);
    const before = G.coreHP;
    G.drainEvents();
    for (let i = 0; i < 80 && G.coreHP === before; i++) G.update(250);
    expect(G.isCoreAttackCell(h.col, h.row)).toBe(true);
    expect(h.col === G.CORE_COL && h.row === G.CORE_ROW).toBe(false);
    expect(G.coreHP).toBeLessThan(before);
    expect(G.effects.some((e) => e.type === "corehit")).toBe(true);
    expect(G.effects.some((e) => e.type === "coreShock")).toBe(true);
    expect(G.drainEvents().some((e) => e.type === "coreHit" && e.cls === "warrior" && e.damage === 7)).toBe(true);
  });

  it("コアHPが0になったらコア揺れエフェクトを残さない", () => {
    carveAll();
    G.coreHP = 1;
    const h = hero("warrior", G.CORE_COL, G.CORE_ROW - 1, { actCd: 999999, atk: 50, coreCd: 0 });
    G.heroes.push(h);
    G.update(100);
    expect(G.coreHP).toBe(0);
    expect(G.gameState).toBe("dead");
    expect(G.effects.some((e) => e.type === "corehit" || e.type === "coreShock")).toBe(false);
  });

  it("冒険者は横の通路が開いていない斜め位置からコアを攻撃しない", () => {
    carveAll();
    const h = hero("warrior", G.CORE_COL - 1, G.CORE_ROW - 1, { actCd: 999999, atk: 7, coreCd: 0 });
    G.grid[G.CORE_ROW][G.CORE_COL - 1] = { t: "earth", sub: null, shade: 0 };
    G.grid[G.CORE_ROW - 1][G.CORE_COL] = { t: "earth", sub: null, shade: 0 };
    G.heroes.push(h);
    const before = G.coreHP;
    G.update(100);
    expect(G.isCoreAttackCell(h.col, h.row)).toBe(true);
    expect(G.canCoreAttackFrom(h.col, h.row)).toBe(false);
    expect(G.coreHP).toBe(before);

    G.grid[G.CORE_ROW][G.CORE_COL - 1] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[G.CORE_ROW - 1][G.CORE_COL] = { t: "tunnel", sub: null, shade: 0 };
    expect(G.canCoreAttackFrom(h.col, h.row)).toBe(true);
    G.update(100);
    expect(G.coreHP).toBeLessThan(before);
  });

  it("コア隣接だけの土はプレイヤー採掘可能にならない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[G.CORE_ROW][G.CORE_COL] = { t: "core", sub: null, shade: 0 };
    G.grid[G.CORE_ROW][G.CORE_COL - 1] = { t: "earth", sub: null, shade: 0 };
    expect(G.isDiggable(G.CORE_COL - 1, G.CORE_ROW)).toBe(false);
    G.grid[G.CORE_ROW - 1][G.CORE_COL - 1] = { t: "tunnel", sub: null, shade: 0 };
    expect(G.isDiggable(G.CORE_COL - 1, G.CORE_ROW)).toBe(true);
  });

  it("魔物は占有中の冒険者マスへ移動しない", () => {
    carveAll();
    G.spawnMonster("slime", 5, 5);
    const h = hero("warrior", 5, 6, { actCd: 999999, atkCd: 999999 });
    G.heroes.push(h);
    G.monsters[0].moveCd = 0;
    G.update(100);
    expect(G.monsters[0].col === h.col && G.monsters[0].row === h.row).toBe(false);
  });

  it("魔物は分岐がある徘徊で直前マスへの即戻りを避ける", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("slime", 5, 5);
    const m = G.monsters[0];
    m.prevCol = 5;
    m.prevRow = 4;
    m.moveCd = 0;
    m.eatCd = 999999;
    G.update(100);
    expect(`${m.col},${m.row}`).not.toBe("5,4");
  });

  it("魔物は直前マスしかない狭所で毎回往復せず待機できる", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[5][5] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[4][5] = { t: "tunnel", sub: null, shade: 0 };
    G.setRandom(() => 0);
    G.spawnMonster("slime", 5, 5);
    const m = G.monsters[0];
    m.prevCol = 5;
    m.prevRow = 4;
    m.moveCd = 0;
    m.eatCd = 999999;
    G.update(100);
    expect(m.col).toBe(5);
    expect(m.row).toBe(5);
    expect(m.moveAnim).toBe(0);
  });

  it("魔物はホームから3マスより遠い接続通路にも通常徘徊で到達できる", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    for (let c = 1; c <= 8; c++) G.grid[5][c] = { t: "tunnel", sub: null, shade: 0 };
    G.setRandom(() => 0.99);
    G.spawnMonster("slime", 1, 5);
    const m = G.monsters[0];
    m.eatCd = 999999;
    for (let i = 0; i < 24; i++) {
      m.moveCd = 0;
      G.update(260);
      m.moveAnim = 0;
      m.px = G.cx(m.col);
      m.py = G.cy(m.row);
      if (Math.abs(m.col - m.homeCol) > 3) break;
    }
    expect(Math.abs(m.col - m.homeCol)).toBeGreaterThan(3);
    expect(G.reachableMonsterCells(1, 5).some((cell) => cell.col === 8 && cell.row === 5)).toBe(true);
  });

  it("スライムは見えている勇者を追い、壁越しでは追わない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    for (const c of [5, 6, 7, 8]) G.grid[5][c] = { t: "tunnel", sub: null, shade: 0 };
    G.heroes.push(hero("warrior", 5, 5, { actCd: 999999, atkCd: 999999, moveCd: 999999 }));
    G.spawnMonster("slime", 8, 5);
    const hunter = G.monsters[0];
    hunter.moveCd = 0;
    hunter.moveCharge = 1;
    hunter.eatCd = 999999;
    hunter.atkCd = 999999;

    G.update(100);

    expect(hunter.moveIntent.kind).toBe("chase");
    expect(hunter.col).toBe(7);
    expect(hunter.row).toBe(5);

    G.resetGame(1);
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[5][5] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[5][8] = { t: "tunnel", sub: null, shade: 0 };
    G.heroes.push(hero("warrior", 5, 5, { actCd: 999999, atkCd: 999999, moveCd: 999999 }));
    G.spawnMonster("slime", 8, 5);
    const hidden = G.monsters[0];
    hidden.moveCd = 999999;
    hidden.eatCd = 999999;

    G.update(20);

    expect(hidden.moveIntent.kind).toBe("wander");
  });

  it("予約制移動では空く予定のマスへ隊列移動できる", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    for (const c of [5, 6, 7]) G.grid[5][c] = { t: "tunnel", sub: null, shade: 0 };
    G.spawnMonster("carniv", 5, 5);
    G.spawnMonster("slime", 6, 5);
    const hunter = G.monsters[0];
    const blocker = G.monsters[1];
    hunter.wanderTarget = { col: 7, row: 5 };
    blocker.wanderTarget = { col: 7, row: 5 };
    hunter.moveCharge = 1;
    blocker.moveCharge = 1;
    hunter.eatCd = 999999;
    blocker.eatCd = 999999;
    G.update(100);
    expect(hunter.col).toBe(6);
    expect(hunter.row).toBe(5);
    expect(blocker.col).toBe(7);
    expect(blocker.row).toBe(5);
    expect(new Set(G.monsters.map((m) => `${m.col},${m.row}`)).size).toBe(G.monsters.length);
    expect(hunter.moveAnim).toBeGreaterThan(0);
    expect(blocker.moveAnim).toBeGreaterThan(0);
  });

  it("予約制移動では直接の位置交換を採用しない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    for (const c of [5, 6]) G.grid[5][c] = { t: "tunnel", sub: null, shade: 0 };
    G.spawnMonster("flame", 5, 5);
    G.spawnMonster("flame", 6, 5);
    const left = G.monsters[0];
    const right = G.monsters[1];
    left.wanderTarget = { col: 6, row: 5 };
    right.wanderTarget = { col: 5, row: 5 };
    left.moveCharge = 1;
    right.moveCharge = 1;
    left.eatCd = 999999;
    right.eatCd = 999999;
    G.update(100);
    expect(left.col).toBe(5);
    expect(right.col).toBe(6);
    expect(left.moveWait).toBeGreaterThan(0);
    expect(right.moveWait).toBeGreaterThan(0);
  });

  it("攻撃射程内の魔物は予約制移動でも攻撃位置を譲らない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    for (const c of [5, 6, 7]) G.grid[5][c] = { t: "tunnel", sub: null, shade: 0 };
    G.spawnMonster("carniv", 5, 5);
    G.spawnMonster("slime", 6, 5);
    const hunter = G.monsters[0];
    const blocker = G.monsters[1];
    G.heroes.push(hero("warrior", 7, 5, { actCd: 999999, atkCd: 999999 }));
    hunter.moveCd = 0;
    hunter.eatCd = 999999;
    blocker.moveCd = 999999;
    blocker.eatCd = 999999;
    blocker.atkCd = 999999;
    G.update(100);
    expect(hunter.col).toBe(5);
    expect(blocker.col).toBe(6);
    expect(blocker.actionType).not.toBe("attack");
  });

  it("魔物は冒険者入場地帯とコアマスへ侵入・繁殖できない", () => {
    carveAll();
    G.spawnMonster("slime", G.ENTRANCE_COL, 0);
    G.spawnMonster("slime", G.ENTRANCE_COL, 1);
    G.spawnMonster("slime", G.ENTRANCE_COL, 2);
    G.spawnMonster("slime", G.CORE_COL, G.CORE_ROW);
    expect(G.monsters).toHaveLength(0);

    G.spawnMonster("slime", G.ENTRANCE_COL, 3);
    const m = G.monsters[0];
    G.beginMove(m, G.ENTRANCE_COL, 2);
    expect(m.col).toBe(G.ENTRANCE_COL);
    expect(m.row).toBe(3);

    for (const [c, r] of [[4, 3], [6, 3], [5, 4]]) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    m.breedCd = 0;
    G.update(100);
    expect(G.monsters).toHaveLength(1);

    expect(G.spawnEgg("spitter", G.ENTRANCE_COL, 1)).toBe(false);
    expect(G.spawnEgg("spitter", G.ENTRANCE_COL, 2)).toBe(false);
    expect(G.spawnEgg("spitter", G.CORE_COL, G.CORE_ROW)).toBe(false);
    G.eggs.push({ kind: "spitter", col: G.CORE_COL, row: G.CORE_ROW, hatchCd: 0, bornAnim: 0 });
    G.update(100);
    expect(G.monsters).toHaveLength(1);
  });

  it("冒険者の壁掘りは一撃で壊れない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[0][G.ENTRANCE_COL] = { t: "surface", sub: null, shade: 0 };
    for (const r of G.ENTRY_ZONE_ROWS) for (const c of G.ENTRY_ZONE_COLS) G.grid[r][c] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[3][G.ENTRANCE_COL] = { t: "earth", sub: null, shade: 0 };
    for (let r = 4; r <= G.CORE_ROW; r++) G.grid[r][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[G.CORE_ROW][G.CORE_COL] = { t: "core", sub: null, shade: 0 };
    G.spawnHero("warrior", G.ENTRANCE_COL, 2);
    G.heroes[0].actCd = 0;
    G.update(10);
    expect(G.grid[3][G.ENTRANCE_COL].t).toBe("earth");
    expect(G.grid[3][G.ENTRANCE_COL].dig).toBeGreaterThan(0);
  });

  it("冒険者職業の解禁と人数上限を守る", () => {
    G.wave = 1;
    for (let i = 0; i < 20; i++) {
      G.heroes.length = 0;
      G.spawnHero();
      expect(G.heroes[0].cls).toBe("warrior");
    }
    G.wave = 10;
    const seen = new Set();
    for (let i = 0; i < 80; i++) {
      G.heroes.length = 0;
      G.spawnHero();
      seen.add(G.heroes[0].cls);
    }
    expect([...seen].every((cls) => HERO_CLASSES[cls].unlock <= 10)).toBe(true);
    expect(seen.size).toBeGreaterThanOrEqual(2);

    G.heroes.length = 0;
    for (let i = 0; i < G.MAX_HEROES; i++) G.heroes.push(hero("warrior", 1 + (i % 9), 1 + Math.floor(i / 9)));
    G.startWave();
    for (let i = 0; i < 20; i++) G.update(G.HERO_STAGGER);
    expect(G.heroes).toHaveLength(G.MAX_HEROES);

    G.resetGame(1);
    G.wave = G.MAX_WAVE - 1;
    G.startWave();
    expect(G.spawnQueue).toHaveLength(G.HEROES_PER_WAVE_CAP);
    expect(G.heroes).toHaveLength(0);
    G.update(1);
    expect(G.heroes).toHaveLength(1);
    expect(G.spawnQueue).toHaveLength(G.HEROES_PER_WAVE_CAP - 1);
    for (let i = 1; i < G.HEROES_PER_WAVE_CAP; i++) G.update(G.HERO_STAGGER);
    expect(G.spawnQueue).toHaveLength(0);
    expect(G.heroes).toHaveLength(G.HEROES_PER_WAVE_CAP);
    expect(new Set(G.heroes.map((h) => `${h.col},${h.row}`)).size).toBe(G.heroes.length);
    expect(G.heroes.every((h) => G.isHeroEntryZone(h.col, h.row))).toBe(true);
    expect(G.HEROES_PER_WAVE_CAP).toBe(5);
  });

  it("終盤ウェーブほど上位冒険者が優先され普通冒険者は候補から外れる", () => {
    G.wave = G.MAX_WAVE;
    expect(G.heroClassWeightForWave("warrior", G.MAX_WAVE)).toBe(0);
    expect(G.heroClassWeightForWave("tank", G.MAX_WAVE)).toBe(0);
    expect(G.heroClassWeightForWave("max", G.MAX_WAVE)).toBeGreaterThan(0);
    expect(G.heroClassWeightForWave("shon", G.MAX_WAVE)).toBeGreaterThan(0);
    expect(G.heroClassWeightForWave("hori", G.MAX_WAVE)).toBeGreaterThan(0);
    for (let i = 0; i < 80; i++) {
      G.heroes.length = 0;
      G.spawnQueue.length = 0;
      G.spawnHero();
      expect(["warrior", "tank", "mage", "priest"]).not.toContain(G.heroes[0].cls);
    }
  });

  it("冒険者が全滅するまで次ウェーブのカウントを止める", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 1;
    G.waveCountdown = 1000;
    G.heroes.push(hero("warrior", 5, 5));
    G.update(2000);
    expect(G.wave).toBe(1);
    expect(G.waveCountdown).toBe(1000);

    G.heroes.length = 0;
    G.update(G.WAVE_SETTLE_DELAY);
    expect(G.wave).toBe(1);
    expect(G.gameState).toBe("dialogue");
    expect(G.dialogue).toMatchObject({ id: "itemChoice", returnState: "itemChoice" });
    expect(G.chooseItemOffer(null)).toBe(false);
    advanceDialogueAll();
    expect(G.gameState).toBe("itemChoice");
    expect(G.chooseItemOffer(null)).toBe(true);
    expect(G.gameState).toBe("playing");
    expect(G.waveCountdown).toBe(G.WAVE_INTERVAL);
    G.update(G.WAVE_INTERVAL);
    expect(G.wave).toBe(2);
    expect(G.spawnQueue.length + G.heroes.length).toBeGreaterThan(0);
  });

  it("出現待ちが残る間も次の襲来カウントを止める", () => {
    G.wave = 1;
    G.waveCountdown = 500;
    G.spawnQueue.push({ delay: 10000, cls: "warrior" });
    G.update(1000);
    expect(G.wave).toBe(1);
    expect(G.waveCountdown).toBe(500);
    expect(G.spawnQueue[0].delay).toBe(9000);
  });

  it("15ウェーブ撃退でクリアになり、次ウェーブは発生しない", () => {
    G.wave = G.MAX_WAVE;
    G.waveCountdown = 0;
    G.heroes.length = 0;
    G.spawnQueue.length = 0;
    G.update(1);
    expect(G.gameState).toBe("playing");
    G.update(G.WAVE_SETTLE_DELAY - 1);
    expect(G.gameState).toBe("clear");
    expect(G.wave).toBe(G.MAX_WAVE);
    G.startWave();
    expect(G.wave).toBe(G.MAX_WAVE);
    expect(G.spawnQueue).toHaveLength(0);
  });

  it("出現待ちが残る間は冒険者と魔物がお互い攻撃しない", () => {
    carveAll();
    G.spawnQueue.push({ delay: 10000, cls: "warrior" });
    G.spawnMonster("spitter", 2, 5);
    const m = G.monsters[0];
    const h = hero("warrior", 4, 5, { hp: 60, atkCd: 0, actCd: 0 });
    G.heroes.push(h);
    m.atkCd = 0;
    G.update(100);
    expect(h.hp).toBe(60);
    expect(h.col).toBe(4);
    expect(h.row).toBe(5);
    expect(m.hp).toBe(m.maxHp);
  });

  it("全冒険者出現後0.5秒は冒険者と魔物が移動・攻撃しない", () => {
    carveAll();
    G.spawnQueue.push({ delay: 0, cls: "warrior" });
    G.update(1);
    expect(G.spawnQueue).toHaveLength(0);
    expect(G.heroEntryHold).toBe(G.HERO_ENTRY_HOLD);
    const h = G.heroes[0];
    Object.assign(h, { col: 5, row: 6, px: G.cx(5), py: G.cy(6), actCd: 0, atkCd: 0, hp: 60, maxHp: 60 });
    G.spawnMonster("slime", 5, 5);
    const m = G.monsters[0];
    m.atkCd = 0;
    m.moveCd = 0;
    m.eatCd = 999999;
    G.update(100);
    expect(h.hp).toBe(60);
    expect(m.hp).toBe(m.maxHp);
    expect(h.col).toBe(5);
    expect(h.row).toBe(6);
    expect(m.col).toBe(5);
    expect(m.row).toBe(5);
    G.update(G.HERO_ENTRY_HOLD);
    expect(G.heroEntryHold).toBe(0);
    G.update(100);
    expect(h.hp < 60 || m.hp < m.maxHp).toBe(true);
  });

  it("魔法使いは入場地帯から攻撃せずコア方面へ離脱する", () => {
    carveAll();
    const h = hero("mage", 5, 2, { actCd: 0, atkCd: 0 });
    G.heroes.push(h);
    G.spawnMonster("slime", 5, 4);
    const m = G.monsters[0];
    m.atkCd = 999999;
    m.moveCd = 999999;
    m.eatCd = 999999;

    G.update(100);

    expect(m.hp).toBe(m.maxHp);
    expect(h.actionType).not.toBe("cast");
    expect(h.moveIntent).toEqual({ kind: "core" });
  });

  it("出口を魔物に塞がれた入場地帯の魔法使いは戦闘で詰まりを解消する", () => {
    carveAll();
    const h = hero("mage", 5, 2, { actCd: 0, atkCd: 0 });
    G.heroes.push(h);
    G.spawnMonster("slime", 5, 3);
    const m = G.monsters[0];
    m.atkCd = 999999;
    m.moveCd = 999999;
    m.eatCd = 999999;

    G.update(100);

    expect(m.hp).toBeLessThan(m.maxHp);
    expect(h.actionType).toBe("cast");
    expect(h.moveIntent).toBeNull();
  });

  it("遠距離職は入場地帯から攻撃せず離脱を優先する", () => {
    carveAll();
    const h = hero("shon", 5, 2, { actCd: 0, atkCd: 0 });
    G.heroes.push(h);
    G.spawnMonster("golem", 5, 5);
    const m = G.monsters[0];
    m.atkCd = 999999;
    m.moveCd = 999999;
    m.eatCd = 999999;

    G.update(100);

    expect(m.hp).toBe(m.maxHp);
    expect(h.actionType).not.toBe("attack");
    expect(h.moveIntent).toEqual({ kind: "core" });
  });

  it("入口が混雑して卵があっても冒険者は入口付近からコア方面へ離脱する", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[0][G.ENTRANCE_COL] = { t: "surface", sub: null, shade: 0 };
    for (const r of G.ENTRY_ZONE_ROWS) for (const c of G.ENTRY_ZONE_COLS) G.grid[r][c] = { t: "tunnel", sub: null, shade: 0 };
    for (let r = 3; r <= G.CORE_ROW; r++) G.grid[r][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[G.CORE_ROW][G.CORE_COL] = { t: "core", sub: null, shade: 0 };
    expect(G.spawnEgg("spitter", G.ENTRANCE_COL, 3)).toBe(true);
    for (const [col, row] of [[5, 2], [4, 2], [6, 2], [5, 1], [4, 1], [6, 1]]) {
      G.heroes.push(hero("warrior", col, row, { actCd: 0, atkCd: 999999 }));
    }
    for (let i = 0; i < 12; i++) {
      for (const h of G.heroes) {
        h.actCd = 0;
        h.moveCharge = 1;
      }
      G.update(120);
      for (const h of G.heroes) {
        h.moveAnim = 0;
        h.px = G.cx(h.col);
        h.py = G.cy(h.row);
      }
    }
    expect(G.heroes.some((h) => h.row >= 4)).toBe(true);
    expect(G.eggs).toHaveLength(1);
  });

  it("終盤役職は指定ウェーブまで出現せず、騎士団長は1ウェーブ最大1体", () => {
    const late = new Set(["crossknight", "captain", "saint", "sage", "max", "shon", "hori"]);
    G.wave = 9;
    for (let i = 0; i < 120; i++) {
      G.heroes.length = 0;
      G.spawnHero();
      expect(late.has(G.heroes[0].cls)).toBe(false);
    }
    expect(HERO_CLASSES.crossknight.unlock).toBeGreaterThan(9);
    expect(HERO_CLASSES.saint.unlock).toBeGreaterThan(9);
    expect(HERO_CLASSES.sage.unlock).toBeGreaterThan(9);
    expect(HERO_CLASSES.captain.unlock).toBeGreaterThan(9);

    G.resetGame(1);
    G.setRandom(() => 0.999);
    G.wave = HERO_CLASSES.captain.unlock - 1;
    G.startWave();
    expect(G.wave).toBe(HERO_CLASSES.captain.unlock);
    while (G.spawnQueue.length) G.update(G.HERO_STAGGER);
    expect(G.heroes.filter((h) => h.cls === "captain")).toHaveLength(1);
  });

  it("同系統の下位冒険者は同ウェーブの上位役職を主要数値で越えない", () => {
    const w = 24;
    const s = (cls) => G.resolveHeroStats(cls, w);
    expect(s("warrior").atk).toBeLessThan(s("superwarrior").atk);
    expect(s("superwarrior").atk).toBeLessThan(s("ultrawarrior").atk);
    expect(s("ultrawarrior").atk).toBeLessThan(s("crossknight").atk);
    expect(s("crossknight").atk).toBeLessThan(s("captain").atk);
    expect(s("mage").atk).toBeLessThan(s("supermage").atk);
    expect(s("supermage").atk).toBeLessThan(s("sage").atk);
    expect(s("priest").heal).toBeLessThan(s("saint").heal);
    expect(s("warrior").hp).toBeLessThan(s("ultrawarrior").hp);
    expect(s("crossknight").defense).toBeLessThan(s("captain").defense);
  });

  it("新たな冒険者は騎士団長より上位として扱われる", () => {
    const w = G.MAX_WAVE;
    const captain = G.resolveHeroStats("captain", w);
    for (const cls of ["max", "shon", "hori"]) {
      const stats = G.resolveHeroStats(cls, w);
      expect(HERO_CLASSES[cls].rank).toBeGreaterThan(HERO_CLASSES.captain.rank);
      expect(stats.atk).toBeGreaterThan(captain.atk);
      expect(HERO_CLASSES[cls].unlock).toBeLessThanOrEqual(G.MAX_WAVE);
    }
  });

  it("第二進化種は上位種より主戦闘値が高い", () => {
    for (const [elite, final] of [["superslime", "crownslime"], ["evolved", "direfang"], ["tarantula", "goldweaver"], ["titan", "goldcore"], ["infernal", "whiteflame"]]) {
      expect(KINDS[final].hp, final).toBeGreaterThan(KINDS[elite].hp);
      expect(KINDS[final].atk, final).toBeGreaterThan(KINDS[elite].atk);
      expect(KINDS[final].rank, final).toBeGreaterThan(KINDS[elite].rank);
    }
  });

  it("防御は冒険者への被ダメージを軽減し、低防御職は重く受ける", () => {
    const raw = 20;
    const w = hero("warrior", 5, 5);
    const t = hero("tank", 5, 5);
    const m = hero("mage", 5, 5);
    expect(G.heroDamageTaken(raw, t)).toBeLessThan(G.heroDamageTaken(raw, w));
    expect(G.heroDamageTaken(raw, m)).toBeGreaterThan(G.heroDamageTaken(raw, w));
  });

  it("回避持ち冒険者は魔物の攻撃をかわすことがある", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("slime", 5, 5);
    const m = G.monsters[0];
    const h = hero("shon", 5, 6, { hp: 60, atkCd: 999999, actCd: 999999 });
    G.heroes.push(h);
    m.atkCd = 0;
    m.moveCd = 999999;
    m.eatCd = 999999;
    G.update(100);
    expect(h.hp).toBe(60);
    expect(h.actionType).toBe("dodge");
  });

  it("マックスはランダムで5倍クリティカルを出す", () => {
    carveAll();
    G.setRandom(() => 0);
    const h = hero("max", 5, 5, { atk: 10, atkCd: 0, actCd: 999999 });
    G.heroes.push(h);
    G.spawnMonster("golem", 6, 5);
    const m = G.monsters[0];
    m.atkCd = 999999;
    m.moveCd = 999999;
    G.update(100);
    expect(m.hp).toBe(m.maxHp - 50);
  });

  it("ションは遠距離から射撃し、ホリは野菜投げと野菜食べを使う", () => {
    carveAll();
    const shon = hero("shon", 5, 5, { atk: 10, atkCd: 0, actCd: 999999 });
    G.heroes.push(shon);
    G.spawnMonster("golem", 8, 5);
    G.monsters[0].atkCd = 999999;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(G.monsters[0].hp).toBeLessThan(G.monsters[0].maxHp);
    expect(shon.actionType).toBe("attack");
    expect(G.effects.some((e) => e.type === "shot")).toBe(true);

    G.resetGame(1);
    carveAll();
    G.setRandom(() => 0.3);
    const horiThrow = hero("hori", 5, 5, { atk: 10, atkCd: 0, actCd: 999999 });
    G.heroes.push(horiThrow);
    G.spawnMonster("golem", 7, 5);
    G.monsters[0].atkCd = 999999;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(horiThrow.actionType).toBe("cast");
    expect(G.monsters[0].hp).toBe(G.monsters[0].maxHp - 14);

    G.resetGame(1);
    carveAll();
    G.setRandom(() => 0.1);
    const horiEat = hero("hori", 5, 5, { hp: 20, maxHp: 100, atkCd: 0, actCd: 999999 });
    G.heroes.push(horiEat);
    G.spawnMonster("golem", 6, 5);
    G.monsters[0].atkCd = 999999;
    G.monsters[0].moveCd = 999999;
    G.update(100);
    expect(horiEat.hp).toBe(65);
    expect(horiEat.actionType).toBe("eat");
  });

  it("聖女は僧侶より大きく回復する", () => {
    carveAll();
    const priest = hero("priest", 5, 5, { wave: 18, healCd: 0 });
    const saint = hero("saint", 5, 5, { wave: 18, healCd: 0 });
    const targetA = hero("warrior", 6, 5, { hp: 20, maxHp: 100 });
    const targetB = hero("warrior", 6, 5, { hp: 20, maxHp: 100 });

    G.heroes.push(priest, targetA);
    G.update(100);
    const priestHeal = targetA.hp - 20;

    G.heroes.length = 0;
    G.heroes.push(saint, targetB);
    G.update(100);
    const saintHeal = targetB.hp - 20;

    expect(saintHeal).toBeGreaterThan(priestHeal);
    expect(saint.actionType).toBe("heal");
  });

  it("賢者は攻撃方向の範囲だけを壁越しなしで攻撃する", () => {
    carveAll();
    const sage = hero("sage", 5, 5, { wave: 20, atk: 20, range: HERO_CLASSES.sage.range, atkCd: 0 });
    G.heroes.push(sage);
    G.spawnMonster("slime", 6, 5);
    G.spawnMonster("slime", 8, 5);
    G.spawnMonster("slime", 6, 6);
    for (const m of G.monsters) {
      m.atkCd = 999999;
      m.moveCd = 999999;
    }
    G.grid[5][7].t = "earth";
    G.update(100);

    expect(G.monsters.some((m) => m.col === 6 && m.row === 5)).toBe(false);
    const blocked = G.monsters.find((m) => m.col === 8 && m.row === 5);
    const offLane = G.monsters.find((m) => m.col === 6 && m.row === 6);
    expect(blocked.hp).toBe(blocked.maxHp);
    expect(offLane.hp).toBe(offLane.maxHp);
    expect(sage.actionType).toBe("cast");
  });

  it("冒険者死亡時にはアイテムを直接拾わない", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 5;
    const h = hero("warrior", 5, 5, { hp: 1, maxHp: 1, wave: 5 });
    G.heroes.push(h);
    G.killHero(h);
    expect(G.itemOffer).toBe(null);
    expect(G.items).toHaveLength(0);
  });

  it("ウェーブ終了時にアイテムイベントを引くと無料アイテム3択を表示し、選ぶと再開する", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 5;
    G.gameState = "playing";
    G.settleWave();
    expect(G.gameState).toBe("dialogue");
    expect(G.dialogue).toMatchObject({ id: "itemChoice", speaker: "ゴリラおばさん", returnState: "itemChoice" });
    expect(G.itemOffer).toEqual({ wave: 5, choices: ["rustyPickaxe", "blackSoilBag", "undergroundLantern"] });
    expect(G.chooseItemOffer("blackSoilBag")).toBe(false);
    advanceDialogueAll();
    expect(G.gameState).toBe("itemChoice");

    expect(G.chooseItemOffer("blackSoilBag")).toBe(true);
    expect(G.gameState).toBe("playing");
    expect(G.itemOffer).toBe(null);
    expect(G.items).toEqual(["blackSoilBag"]);
    expect(G.itemEvents.some((e) => e.id === "blackSoilBag")).toBe(true);
    expect(G.shopOffer).toBe(null);
  });

  it("撃退後イベントは30%で発生し、外れた場合はそのまま再開する", () => {
    carveAll();
    expect(POST_WAVE_EVENT_CHANCE).toBe(0.30);
    G.setRandom(() => 0.99);
    G.wave = 5;
    G.waveCountdown = 5000;
    G.gameState = "playing";
    G.settleWave();
    expect(G.gameState).toBe("playing");
    expect(G.postWaveEvent).toBe(null);
    expect(G.itemOffer).toBe(null);
    expect(G.shopOffer).toBe(null);
    expect(G.trapOffer).toBe(null);
    expect(G.waveCountdown).toBe(G.WAVE_INTERVAL);
  });

  it("アイテム欄が満杯なら無料アイテムは取れず、選択画面に残る", () => {
    carveAll();
    for (const id of PIXEL_ITEMS.slice(0, G.ITEM_CAP)) expect(G.applyItem(id, { ignoreCap: true }), id).toBe(true);
    expect(G.items).toHaveLength(G.ITEM_CAP);
    G.setRandom(() => 0);
    G.wave = 5;
    G.gameState = "playing";
    G.settleWave();
    advanceDialogueAll();
    expect(G.gameState).toBe("itemChoice");
    const choice = G.itemOffer.choices[0];

    expect(G.chooseItemOffer(choice)).toBe(true);
    expect(G.gameState).toBe("itemChoice");
    expect(G.items).toHaveLength(G.ITEM_CAP);
    expect(G.items).not.toContain(choice);
    expect(G.itemOffer.choices).toContain(choice);
    expect(G.effects.some((e) => e.type === "banner" && e.text === "もう取れません")).toBe(true);
  });

  it("update経由のウェーブ終了は最後の冒険者死亡後に余韻を挟む", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 5;
    G.gameState = "playing";
    G.spawnQueue.length = 0;
    G.heroes.length = 0;
    G.update(G.WAVE_SETTLE_DELAY - 1);
    expect(G.gameState).toBe("playing");
    expect(G.waveSettled).toBe(0);
    expect(G.waveSettleDelay).toBe(1);
    expect(G.itemOffer).toBe(null);

    G.update(1);
    expect(G.gameState).toBe("dialogue");
    expect(G.waveSettled).toBe(5);
    expect(G.dialogue.id).toBe("itemChoice");
    expect(G.itemOffer).toEqual({ wave: 5, choices: ["rustyPickaxe", "blackSoilBag", "undergroundLantern"] });
    advanceDialogueAll();
    expect(G.gameState).toBe("itemChoice");
  });

  it("アイテム3択は取らない選択もできる", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 4;
    G.gameState = "playing";
    G.settleWave();
    advanceDialogueAll();
    expect(G.gameState).toBe("itemChoice");
    G.drainEvents();
    expect(G.chooseItemOffer(null)).toBe(true);
    expect(G.gameState).toBe("playing");
    expect(G.items).toHaveLength(0);
    expect(G.itemOffer).toBe(null);
    expect(G.drainEvents().some((e) => e.type === "discoverItem")).toBe(false);
    expect(G.shopOffer).toBe(null);
  });

  it("アイテム選択中はupdateでゲーム時間が進まない", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = 4;
    G.waveCountdown = 5000;
    G.nutrients = 30;
    G.gameState = "playing";
    G.settleWave();
    advanceDialogueAll();
    G.effects.push({ type: "float", x: 0, y: 0, text: "停止", life: 1000, max: 1000, vy: -0.1 });
    const effect = G.effects[G.effects.length - 1];

    G.update(1000);

    expect(G.gameState).toBe("itemChoice");
    expect(G.waveCountdown).toBe(G.WAVE_INTERVAL);
    expect(G.nutrients).toBe(30);
    expect(effect.life).toBe(1000);
  });

  it("アイテムはレアリティを持ち、強い格ほどショップ価格が高い", () => {
    for (const id of PIXEL_ITEMS) {
      expect(["normal", "rare", "gold"]).toContain(G.ITEMS[id].rarity);
    }
    expect(G.ITEM_RARITIES.normal.name).toBe("ノーマル");
    expect(G.ITEM_RARITIES.rare.name).toBe("レア");
    expect(G.ITEM_RARITIES.gold.name).toBe("ゴールド");
    expect(G.ITEM_RARITIES.normal.shopWeight).toBeGreaterThan(G.ITEM_RARITIES.rare.shopWeight);
    expect(G.ITEM_RARITIES.rare.shopWeight).toBeGreaterThan(G.ITEM_RARITIES.gold.shopWeight);
    expect(G.itemShopPrice("rustyPickaxe", 0)).toBeLessThan(G.itemShopPrice("blackSoilBag", 0));
    expect(G.itemShopPrice("blackSoilBag", 0)).toBeLessThan(G.itemShopPrice("oldIncense", 0));
    expect(G.itemShopPrice("rustyPickaxe", 5)).toBe(17);
    expect(G.itemShopPrice("blackSoilBag", 5)).toBe(34);
    expect(G.itemShopPrice("oldIncense", 5)).toBe(57);
    expect(G.ITEMS.coreShard.rarity).toBe("gold");
    expect(G.ITEMS.coreBandage.rarity).toBe("rare");
    expect(G.ITEMS.quakeStone.rarity).toBe("rare");
    expect(G.ITEMS.lowestCandle.rarity).toBe("rare");
  });

  it("ショップでは栄養を払って複数アイテムを購入でき、足りない商品は買えない", () => {
    carveAll();
    const rolls = [0, 0.7, 0, 0, 0, 0, 0];
    G.setRandom(() => rolls.length ? rolls.shift() : 0);
    G.wave = 5;
    G.nutrients = 100;
    G.gameState = "playing";
    G.settleWave();
    expect(G.gameState).toBe("dialogue");
    expect(G.dialogue).toMatchObject({ id: "shop", speaker: "コンビニ店員のスライム", returnState: "shop" });
    expect(G.shopOffer.goods).toEqual([
      { id: "rustyPickaxe", price: 17, sold: false },
      { id: "blackSoilBag", price: 34, sold: false },
      { id: "undergroundLantern", price: 17, sold: false },
      { id: "crackedMap", price: 17, sold: false },
      { id: "masonGloves", price: 17, sold: false },
    ]);
    expect(G.buyShopItem("rustyPickaxe")).toBe(false);
    advanceDialogueAll();
    expect(G.gameState).toBe("shop");

    expect(G.buyShopItem("rustyPickaxe")).toBe(true);
    expect(G.nutrients).toBe(83);
    expect(G.items).toEqual(["rustyPickaxe"]);
    expect(G.shopOffer.goods.find((g) => g.id === "rustyPickaxe").sold).toBe(true);

    expect(G.buyShopItem("blackSoilBag")).toBe(true);
    expect(G.nutrients).toBe(49);
    expect(G.items).toEqual(["rustyPickaxe", "blackSoilBag"]);

    G.nutrients = 10;
    expect(G.buyShopItem("undergroundLantern")).toBe(false);
    expect(G.nutrients).toBe(10);
    expect(G.items).not.toContain("undergroundLantern");

    expect(G.closeShopOffer()).toBe(true);
    expect(G.gameState).toBe("playing");
  });

  it("アイテム欄が満杯ならショップ購入はできず、栄養と商品状態を変えない", () => {
    carveAll();
    for (const id of PIXEL_ITEMS.slice(0, G.ITEM_CAP)) expect(G.applyItem(id, { ignoreCap: true }), id).toBe(true);
    const rolls = [0, 0.7, 0, 0, 0, 0, 0];
    G.setRandom(() => rolls.length ? rolls.shift() : 0);
    G.wave = 5;
    G.nutrients = 100;
    G.gameState = "playing";
    G.settleWave();
    advanceDialogueAll();
    expect(G.gameState).toBe("shop");
    const good = G.shopOffer.goods[0];
    const beforeNut = G.nutrients;

    expect(G.buyShopItem(good.id)).toBe(true);
    expect(G.gameState).toBe("shop");
    expect(G.nutrients).toBe(beforeNut);
    expect(G.items).toHaveLength(G.ITEM_CAP);
    expect(G.shopOffer.goods.find((g) => g.id === good.id).sold).toBe(false);
    expect(G.effects.some((e) => e.type === "banner" && e.text === "もう取れません")).toBe(true);
  });

  it("ショップ中はupdateでゲーム時間が進まない", () => {
    carveAll();
    const rolls = [0, 0.7, 0, 0, 0, 0, 0];
    G.setRandom(() => rolls.length ? rolls.shift() : 0);
    G.wave = 4;
    G.waveCountdown = 5000;
    G.nutrients = 30;
    G.gameState = "playing";
    G.settleWave();
    advanceDialogueAll();
    G.effects.push({ type: "float", x: 0, y: 0, text: "商店", life: 1000, max: 1000, vy: -0.1 });
    const effect = G.effects[G.effects.length - 1];

    G.update(1000);

    expect(G.gameState).toBe("shop");
    expect(G.waveCountdown).toBe(G.WAVE_INTERVAL);
    expect(G.nutrients).toBe(30);
    expect(effect.life).toBe(1000);
  });

  it("5周目以降は撃退後に罠イベントが出ることがあり、デバフを1つ選ぶ", () => {
    const trapGame = createGame({ seed: 1 });
    trapGame.startGame(5);
    for (let r = 0; r < trapGame.ROWS; r++) {
      for (let c = 0; c < trapGame.COLS; c++) trapGame.grid[r][c] = { t: "tunnel", sub: null, shade: 0 };
    }
    trapGame.grid[0][trapGame.ENTRANCE_COL].t = "surface";
    trapGame.grid[trapGame.CORE_ROW][trapGame.CORE_COL].t = "core";
    trapGame.wave = 5;
    trapGame.gameState = "playing";
    const rolls = [0, 0.99, 0, 0, 0];
    trapGame.setRandom(() => rolls.length ? rolls.shift() : 0);
    trapGame.settleWave();

    expect(trapGame.gameState).toBe("trap");
    expect(trapGame.postWaveEvent).toBe("trap");
    expect(trapGame.trapOffer.choices).toHaveLength(3);
    expect(trapGame.trapOffer.choices.every((id) => PIXEL_DEBUFFS.includes(id))).toBe(true);
    const choice = trapGame.trapOffer.choices[0];
    expect(trapGame.chooseTrapDebuff(choice)).toBe(true);
    expect(trapGame.debuffItems).toEqual([choice]);
    expect(trapGame.gameState).toBe("playing");
  });

  it("10周目以降は初期デバフを表示し、リセット罰中は2個背負う", () => {
    const normal = createGame({ random: () => 0 });
    normal.startGame(10);
    expect(normal.gameState).toBe("dialogue");
    expect(normal.dialogue.returnState).toBe("debuffNotice");
    advanceDialogueAll(normal);
    expect(normal.gameState).toBe("debuffNotice");
    expect(normal.debuffNotice).toEqual({ ids: ["rottenRations"], penalty: false });
    expect(normal.debuffItems).toEqual(["rottenRations"]);
    expect(normal.nutrients).toBe(normal.START_NUT - 5);
    expect(normal.acknowledgeDebuffNotice()).toBe(true);
    expect(normal.gameState).toBe("playing");

    const penalty = createGame({ random: () => 0 });
    penalty.startGame(10, { resetPenaltyActive: true });
    expect(penalty.gameState).toBe("dialogue");
    expect(penalty.dialogue.returnState).toBe("debuffNotice");
    advanceDialogueAll(penalty);
    expect(penalty.gameState).toBe("debuffNotice");
    expect(penalty.debuffNotice).toEqual({ ids: ["rottenRations", "crackedCore"], penalty: true });
    expect(penalty.debuffItems).toEqual(["rottenRations", "crackedCore"]);
    expect(penalty.nutrients).toBe(penalty.START_NUT - 5);
    expect(penalty.CORE_MAX).toBe(125);
    expect(penalty.coreHP).toBe(125);
  });

  it("周回が高いほど敵能力とスコアが上がり、20周目は全員Xターミネーターになる", () => {
    expect(loopHpMultiplier(1)).toBe(1);
    expect(loopHpMultiplier(20)).toBeCloseTo(2.52);
    expect(loopAtkMultiplier(1)).toBe(1);
    expect(loopAtkMultiplier(5)).toBeCloseTo(1.62);
    expect(loopScoreMultiplier(20)).toBeCloseTo(3.85);

    const base = G.resolveHeroStats("warrior", 5, 1);
    const high = G.resolveHeroStats("warrior", 5, 10);
    expect(high.hp).toBeGreaterThan(base.hp);
    expect(high.atk).toBeGreaterThan(base.atk);

    G.resetGame(1, 20, { skipInitialDebuffs: true });
    carveAll();
    G.wave = 5;
    expect(G.pickHeroClass()).toBe("xTerminator");
    expect(G.spawnHero("warrior", 4, 1)).toBe(true);
    expect(G.heroes[0].cls).toBe("xTerminator");

    const scored = createGame({ seed: 1 });
    scored.resetGame(1, 10, { skipInitialDebuffs: true });
    const h = hero("warrior", 5, 5, { hp: 1, maxHp: 1, wave: 5 });
    scored.heroes.push(h);
    scored.killHero(h);
    expect(scored.score).toBe(Math.round((80 * 5 + 20) * loopScoreMultiplier(10)));
  });

  it("最終ウェーブ終了時はアイテムよりクリアを優先する", () => {
    carveAll();
    G.setRandom(() => 0);
    G.wave = G.MAX_WAVE;
    G.gameState = "playing";
    G.settleWave();
    expect(G.gameState).toBe("clear");
    expect(G.itemOffer).toBe(null);
    expect(G.shopOffer).toBe(null);
    expect(G.items).toHaveLength(0);
  });

  it("既存アイテムは初期取得でき、新規アイテムは解放後に取得できる", () => {
    carveAll();
    const unlockIds = Object.keys(ITEM_UNLOCKS);
    const baseIds = PIXEL_ITEMS.filter((id) => !unlockIds.includes(id));
    for (const id of baseIds) {
      expect(G.applyItem(id, { ignoreCap: true }), id).toBe(true);
    }
    for (const id of unlockIds) expect(G.applyItem(id, { ignoreCap: true }), id).toBe(false);
    expect(G.items).toEqual(baseIds);
    const events = G.drainEvents().filter((e) => e.type === "discoverItem").map((e) => e.id);
    expect(events).toEqual(baseIds);

    const unlocked = createGame({ seed: 2, unlockedItems: unlockIds });
    for (let r = 0; r < unlocked.ROWS; r++) {
      for (let c = 0; c < unlocked.COLS; c++) unlocked.grid[r][c] = { t: "tunnel", sub: null, shade: 0 };
    }
    for (const id of unlockIds) expect(unlocked.applyItem(id, { ignoreCap: true }), id).toBe(true);
    expect(unlocked.items).toEqual(unlockIds);
  });

  it("刷新したアイテム効果は索敵、魔物強化、魔物回復、採掘反撃へ反映される", () => {
    carveAll();
    G.spawnMonster("slime", 5, 5);
    G.heroes.push(hero("warrior", 9, 5, { actCd: 999999, atkCd: 999999 }));
    const scout = G.monsters[0];
    scout.moveCd = 999999;
    scout.moveCharge = 0;
    expect(G.applyItem("deepCompass")).toBe(true);
    G.update(100);
    expect(scout.moveIntent?.kind).toBe("chase");
    expect(G.itemEvents.some((e) => e.id === "deepCompass")).toBe(true);

    const beforeMax = G.CORE_MAX;
    const beforeCore = G.coreHP;
    const beforeMonsterMax = scout.maxHp;
    expect(G.applyItem("coreShard")).toBe(true);
    expect(G.CORE_MAX).toBe(beforeMax);
    expect(G.coreHP).toBe(beforeCore);
    expect(scout.maxHp).toBeGreaterThan(beforeMonsterMax);
    G.spawnMonster("slime", 6, 5);
    expect(G.monsters[G.monsters.length - 1].maxHp).toBe(11);

    expect(G.applyItem("coreBandage")).toBe(true);
    scout.hp = 1;
    G.wave = 4;
    G.gameState = "playing";
    G.setRandom(() => 0.99);
    G.settleWave();
    expect(scout.hp).toBeGreaterThan(1);

    G.heroes.length = 0;
    G.monsters.length = 0;
    expect(G.applyItem("quakeStone")).toBe(true);
    const digger = hero("warrior", 5, 5, { actCd: 0, atkCd: 999999, hp: 20, maxHp: 20 });
    G.heroes.push(digger);
    G.grid[6][5] = { t: "earth", sub: null, shade: 0, dig: 0 };
    G.wave = 0;
    G.gameState = "playing";
    G.update(100);
    expect(digger.hp).toBeLessThan(20);

    const breadBefore = G.nutrients;
    expect(G.applyItem("dryBread")).toBe(true);
    expect(G.nutrients).toBeCloseTo(breadBefore + 12);

    expect(G.applyItem("tornWallet")).toBe(true);
    G.nutrients = 4;
    const beforeNut = G.nutrients;
    const h = hero("warrior", 7, 5, { hp: 1, maxHp: 1, wave: 4 });
    G.heroes.push(h);
    G.killHero(h);
    expect(G.nutrients - beforeNut).toBe(Math.round((4 + 4) * 1.5));

    expect(G.applyItem("spareHeart")).toBe(true);
    G.spawnMonster("slime", 6, 5);
    const b = G.monsters[G.monsters.length - 1];
    b.hp = 1;
    G.killMonster(b);
    expect(G.monsters).toContain(b);
    expect(G.usedItems).toContain("spareHeart");

    expect(G.applyItem("shadowThread")).toBe(true);
    G.killMonster(b);
    expect(G.slowFields).toHaveLength(1);
  });

  it("呪い釘は冒険者攻撃力を常時下げ、死神は死亡冒険者からまれに出る", () => {
    carveAll();
    expect(G.applyItem("curseNail")).toBe(true);
    const h = hero("warrior", 2, 2, { atk: 10 });
    expect(G.heroAttackPower(h)).toBe(9);

    G.setRandom(() => 0);
    const dead = hero("warrior", 5, 6, { hp: 1, maxHp: 1, wave: 3 });
    G.heroes.push(dead);
    G.killHero(dead);
    expect(G.monsters.some((m) => m.kind === "reaper")).toBe(true);
  });

  it("見切り札はアイテム選択肢を一度だけ引き直せる", () => {
    carveAll();
    expect(G.applyItem("wildCard")).toBe(true);
    G.wave = 4;
    G.gameState = "playing";
    G.setRandom(() => 0);
    G.settleWave();
    advanceDialogueAll();
    const before = G.itemOffer.choices;
    expect(G.canRerollItemOffer).toBe(true);
    expect(G.rerollItemOffer()).toBe(true);
    expect(G.itemOffer.choices).not.toEqual(before);
    expect(G.usedItems).toContain("wildCard");
    expect(G.rerollItemOffer()).toBe(false);
  });

  it("撃破報酬と長時間上限を守る", () => {
    const h = hero("warrior", 5, 5, { hp: 1, maxHp: 1, wave: 5 });
    G.heroes.push(h);
    const before = G.nutrients;
    G.drainEvents();
    G.killHero(h);
    expect(G.nutrients).toBe(before + 9);
    expect(G.drainEvents()).toContainEqual({ type: "heroKilled", cls: "warrior", wave: 5, x: G.cx(5), y: G.cy(5) });

    G.resetGame(1);
    for (const seed of [1, 2, 3]) {
      G.resetGame(seed);
      for (let i = 0; i < 360; i++) G.update(1000);
      expect(G.monsters.length + G.eggs.length).toBeLessThanOrEqual(G.MONSTER_CAP);
      expect(G.heroes.length).toBeLessThanOrEqual(G.MAX_HEROES);
    }
  });

  it("ruleConfigでゲーム単位のバランス値を上書きできる", () => {
    const tuned = createGame({
      seed: 1,
      ruleConfig: {
        constants: {
          START_NUT: 40,
          DIG_COST: 3,
          CORE_MAX: 280,
          MAX_WAVE: 3,
          VEIN_SPAWN_SOIL_CHANCES: [0.01, 0.02],
        },
        kinds: {
          slime: { hp: 24, atk: 6, breedEvery: 5000 },
        },
        veins: {
          moss: { touchNeed: 9, finalTouchNeed: 18 },
        },
        heroes: {
          warrior: { hpMul: 2, atkMul: 3, unlock: 1 },
        },
      },
    });
    tuned.resetGame(1);
    expect(tuned.START_NUT).toBe(40);
    expect(tuned.nutrients).toBe(40);
    expect(tuned.DIG_COST).toBe(3);
    expect(tuned.CORE_MAX).toBe(280);
    expect(tuned.coreHP).toBe(280);
    expect(tuned.MAX_WAVE).toBe(3);
    expect(tuned.VEIN_SPAWN_SOIL_CHANCES).toEqual([0.01, 0.02]);
    expect(tuned.KINDS.slime.hp).toBe(24);
    expect(tuned.KINDS.slime.atk).toBe(6);
    expect(tuned.KINDS.slime.breedEvery).toBe(5000);
    expect(tuned.veinTouchNeed("moss")).toBe(9);
    expect(tuned.veinNextTouchNeed("moss", { evoStage: 1, soilMana: 0 })).toBe(18);
    expect(tuned.resolveHeroStats("warrior", 1)).toMatchObject({ hp: 68, atk: 16 });
    expect(KINDS.slime.hp).toBe(10);

    const chanceOnly = createGame({ seed: 1, ruleConfig: { constants: { VEIN_SPAWN_BASE_CHANCE: 0.02 } } });
    expect(chanceOnly.VEIN_SPAWN_SOIL_CHANCES[0]).toBeCloseTo(0.02);
  });

  it("保存設定が空の初回起動でもruleConfigを既定値に戻せる", () => {
    expect(createRuleConfig(null).constants.START_NUT).toBe(25);
    expect(createRuleConfig(false).constants.DIG_COST).toBe(1);
    const firstBoot = createGame({ seed: 1, ruleConfig: null });
    expect(firstBoot.START_NUT).toBe(25);
    expect(firstBoot.gameState).toBe("title");
  });

  it("開始時は迷宮王直属幹部のチュートリアル会話を挟んでから遊べる", () => {
    const game = createGame({ seed: 1 });
    game.startGame(1);
    expect(game.gameState).toBe("dialogue");
    expect(game.dialogue).toMatchObject({ id: "intro", speaker: "迷宮王直属幹部", index: 0, returnState: "playing" });
    const introLines = [];
    while (game.gameState === "dialogue") {
      introLines.push(game.dialogue.text);
      game.advanceDialogue();
    }
    expect(introLines.some((line) => line.includes("触れ続けると育つ"))).toBe(true);
    expect(introLines.some((line) => line.includes("ホーム"))).toBe(false);
    expect(introLines.some((line) => line.includes("ウェーブ後の出来事"))).toBe(false);
    game.startGame(1);
    const beforeNut = game.nutrients;
    const beforeCountdown = game.waveCountdown;
    game.update(1000);
    expect(game.nutrients).toBe(beforeNut);
    expect(game.waveCountdown).toBe(beforeCountdown);
    advanceDialogueAll(game);
    expect(game.dialogue).toBe(null);
    expect(game.gameState).toBe("playing");

    const forced = createGame({ seed: 1 });
    forced.startGame(1);
    forced.gameState = "playing";
    expect(forced.dialogue).toBe(null);
  });

  it("出現した魔物と冒険者と到達ウェーブをイベントで取り出せる", () => {
    carveAll();
    G.drainEvents();
    G.spawnMonster("slime", 5, 5);
    G.spawnHero("warrior", 4, 1);
    G.applyItem("rustyPickaxe");
    G.startWave();
    const events = G.drainEvents();
    expect(events).toContainEqual({ type: "discoverMonster", kind: "slime" });
    expect(events).toContainEqual({ type: "discoverHero", cls: "warrior" });
    expect(events).toContainEqual({ type: "discoverItem", id: "rustyPickaxe" });
    expect(events).toContainEqual({ type: "waveReached", wave: 1 });
    expect(G.drainEvents()).toEqual([]);
  });

  it("公開定数は既存バランスを維持する", () => {
    expect(G.TILE).toBe(48);
    expect(G.COLS).toBe(11);
    expect(G.ROWS).toBe(16);
    expect(G.DIG_COST).toBe(1);
    expect(G.START_NUT).toBe(25);
    expect(G.FIRST_GRACE).toBe(27000);
    expect(G.WAVE_INTERVAL).toBe(10000);
    expect(G.HERO_ENTRY_HOLD).toBe(500);
    expect(G.WAVE_SETTLE_DELAY).toBe(900);
    expect(G.MOVEMENT_TICK).toBe(100);
    expect(G.HEROES_PER_WAVE_CAP).toBe(5);
    expect(G.MAX_WAVE).toBe(15);
    expect(G.VEIN_SPAWN_TICK).toBe(1000);
    expect(G.VEIN_SPAWN_BASE_CHANCE).toBeCloseTo(0.0005);
    expect(G.VEIN_SPAWN_SOIL_WEIGHT).toBeCloseTo(0.45);
    expect(G.VEIN_SPAWN_SOIL_CHANCES[0]).toBeCloseTo(G.VEIN_SPAWN_BASE_CHANCE);
    expect(G.VEIN_SPAWN_SOIL_CHANCES).toEqual([0.0005, 0.0022, 0.0036, 0.0058, 0.0102, 0.018, 0.034, 0.060]);
    expect(G.VEIN_SPAWN_BURST_CAP).toBe(3);
    expect(G.VEIN_FADE_START).toBe(120000);
    expect(G.VEIN_DECAY_TIME).toBe(240000);
    expect(G.ITEM_CAP).toBe(10);
    expect(G.SOIL_CHARGE_MOVES).toBe(10);
    expect(KINDS.slime.breedEvery).toBe(14000);
    expect(G.monsterIncomeRate()).toBeCloseTo(0.045);
  });
});
