"use strict";

import { describe, expect, it, beforeEach } from "vitest";
import { createGame, KINDS, HERO_CLASSES, VEIN } from "../src/gameCore.js";

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
    G.tryDig(G.ENTRANCE_COL, 3);
    expect(G.grid[3][G.ENTRANCE_COL].t).toBe("tunnel");
    expect(G.monsters).toHaveLength(1);
    expect(G.monsters[0].kind).toBe("slime");
    expect(G.nutrients).toBe(G.START_NUT - G.DIG_COST);
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

  it("卵は勇者の攻撃対象にならない", () => {
    carveAll();
    expect(G.spawnEgg("spitter", 5, 5)).toBe(true);
    G.heroes.push(hero("warrior", 5, 6, { atkCd: 0 }));
    G.update(500);
    expect(G.eggs).toHaveLength(1);
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

  it("回復役は絶対HPより負傷割合が大きい仲間を優先する", () => {
    carveAll();
    const priest = hero("priest", 5, 5, { hp: 100, maxHp: 100, healCd: 0 });
    const badlyWounded = hero("warrior", 6, 5, { hp: 25, maxHp: 100 });
    const lowTotalHp = hero("mage", 5, 6, { hp: 20, maxHp: 30 });
    G.heroes.push(priest, badlyWounded, lowTotalHp);
    G.update(100);
    expect(badlyWounded.hp).toBeGreaterThan(25);
    expect(lowTotalHp.hp).toBe(20);
    expect(priest.faceDir).toBe("e");
  });

  it("勇者の近接攻撃は本体を突進させず武器だけを振る", () => {
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

  it("飛び道具を受けても勇者の移動待ちは増えない", () => {
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

  it("ドラゴンの炎は3マス直線上の勇者全員へ当たる", () => {
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

  it("勇者はコアに入らず隣接マスから攻撃する", () => {
    carveAll();
    const h = hero("warrior", G.CORE_COL, 1, { actCd: 0, atk: 7, coreCd: 0 });
    G.heroes.push(h);
    const before = G.coreHP;
    for (let i = 0; i < 80 && G.coreHP === before; i++) G.update(250);
    expect(G.isCoreAttackCell(h.col, h.row)).toBe(true);
    expect(h.col === G.CORE_COL && h.row === G.CORE_ROW).toBe(false);
    expect(G.coreHP).toBeLessThan(before);
  });

  it("魔物は占有中の勇者マスへ移動しない", () => {
    carveAll();
    G.spawnMonster("slime", 5, 5);
    const h = hero("warrior", 5, 6, { actCd: 999999, atkCd: 999999 });
    G.heroes.push(h);
    G.monsters[0].moveCd = 0;
    G.update(100);
    expect(G.monsters[0].col === h.col && G.monsters[0].row === h.row).toBe(false);
  });

  it("魔物は勇者入場地帯とコアマスへ侵入・繁殖できない", () => {
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

  it("勇者の壁掘りは一撃で壊れない", () => {
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

  it("勇者職業の解禁と人数上限を守る", () => {
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
    expect(seen.size).toBeGreaterThanOrEqual(3);

    G.heroes.length = 0;
    for (let i = 0; i < G.MAX_HEROES; i++) G.heroes.push(hero("warrior", 1 + (i % 9), 1 + Math.floor(i / 9)));
    G.startWave();
    for (let i = 0; i < 20; i++) G.update(G.HERO_STAGGER);
    expect(G.heroes).toHaveLength(G.MAX_HEROES);

    G.resetGame(1);
    G.wave = 30;
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

  it("後半ウェーブほど上位勇者が優先され普通勇者は候補から外れる", () => {
    G.wave = 30;
    expect(G.heroClassWeightForWave("warrior", 30)).toBe(0);
    expect(G.heroClassWeightForWave("tank", 30)).toBe(0);
    expect(G.heroClassWeightForWave("captain", 30)).toBeGreaterThan(0);
    for (let i = 0; i < 80; i++) {
      G.heroes.length = 0;
      G.spawnQueue.length = 0;
      G.spawnHero();
      expect(["warrior", "tank", "mage", "priest"]).not.toContain(G.heroes[0].cls);
    }
  });

  it("勇者が全滅するまで次ウェーブのカウントを止める", () => {
    carveAll();
    G.wave = 1;
    G.waveCountdown = 1000;
    G.heroes.push(hero("warrior", 5, 5));
    G.update(2000);
    expect(G.wave).toBe(1);
    expect(G.waveCountdown).toBe(1000);

    G.heroes.length = 0;
    G.update(999);
    expect(G.wave).toBe(1);
    expect(G.waveCountdown).toBe(1);
    G.update(1);
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

  it("出現待ちが残る間は勇者と魔物がお互い攻撃しない", () => {
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

  it("後半役職は指定ウェーブまで出現せず、騎士団長は1ウェーブ最大1体", () => {
    const late = new Set(["crossknight", "captain", "saint", "sage"]);
    G.wave = 13;
    for (let i = 0; i < 120; i++) {
      G.heroes.length = 0;
      G.spawnHero();
      expect(late.has(G.heroes[0].cls)).toBe(false);
    }
    expect(HERO_CLASSES.crossknight.unlock).toBeGreaterThan(13);
    expect(HERO_CLASSES.saint.unlock).toBeGreaterThan(13);
    expect(HERO_CLASSES.sage.unlock).toBeGreaterThan(13);
    expect(HERO_CLASSES.captain.unlock).toBeGreaterThan(13);

    G.resetGame(1);
    G.setRandom(() => 0.999);
    G.wave = HERO_CLASSES.captain.unlock - 1;
    G.startWave();
    expect(G.wave).toBe(HERO_CLASSES.captain.unlock);
    while (G.spawnQueue.length) G.update(G.HERO_STAGGER);
    expect(G.heroes.filter((h) => h.cls === "captain")).toHaveLength(1);
  });

  it("同系統の下位勇者は同ウェーブの上位役職を主要数値で越えない", () => {
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

  it("第二進化種は上位種より主戦闘値が高い", () => {
    for (const [elite, final] of [["superslime", "crownslime"], ["evolved", "direfang"], ["tarantula", "goldweaver"], ["titan", "goldcore"], ["infernal", "whiteflame"]]) {
      expect(KINDS[final].hp, final).toBeGreaterThan(KINDS[elite].hp);
      expect(KINDS[final].atk, final).toBeGreaterThan(KINDS[elite].atk);
      expect(KINDS[final].rank, final).toBeGreaterThan(KINDS[elite].rank);
    }
  });

  it("防御は勇者への被ダメージを軽減し、低防御職は重く受ける", () => {
    const raw = 20;
    const w = hero("warrior", 5, 5);
    const t = hero("tank", 5, 5);
    const m = hero("mage", 5, 5);
    expect(G.heroDamageTaken(raw, t)).toBeLessThan(G.heroDamageTaken(raw, w));
    expect(G.heroDamageTaken(raw, m)).toBeGreaterThan(G.heroDamageTaken(raw, w));
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

  it("撃破報酬と長時間上限を守る", () => {
    const h = hero("warrior", 5, 5, { hp: 1, maxHp: 1, wave: 5 });
    G.heroes.push(h);
    const before = G.nutrients;
    G.killHero(h);
    expect(G.nutrients).toBe(before + 9);

    G.resetGame(1);
    G.gameState = "playing";
    for (let i = 0; i < 360; i++) G.update(1000);
    expect(G.monsters.length + G.eggs.length).toBeLessThanOrEqual(G.MONSTER_CAP);
    expect(G.heroes.length).toBeLessThanOrEqual(G.MAX_HEROES);
  });

  it("公開定数は既存バランスを維持する", () => {
    expect(G.TILE).toBe(48);
    expect(G.COLS).toBe(11);
    expect(G.ROWS).toBe(16);
    expect(G.DIG_COST).toBe(1);
    expect(G.START_NUT).toBe(25);
    expect(G.FIRST_GRACE).toBe(27000);
    expect(G.WAVE_INTERVAL).toBe(10000);
    expect(G.HEROES_PER_WAVE_CAP).toBe(5);
    expect(G.VEIN_SPAWN_TICK).toBe(1000);
    expect(G.VEIN_SPAWN_BASE_CHANCE).toBeCloseTo(0.0006);
    expect(G.VEIN_SPAWN_SOIL_WEIGHT).toBeCloseTo(0.45);
    expect(G.VEIN_SPAWN_SOIL_CHANCES[0]).toBeCloseTo(G.VEIN_SPAWN_BASE_CHANCE);
    expect(G.VEIN_SPAWN_BURST_CAP).toBe(3);
    expect(G.VEIN_FADE_START).toBe(120000);
    expect(G.VEIN_DECAY_TIME).toBe(240000);
    expect(G.SOIL_CHARGE_MOVES).toBe(10);
    expect(KINDS.slime.breedEvery).toBe(14000);
    expect(G.monsterIncomeRate()).toBeCloseTo(0.045);
  });
});
