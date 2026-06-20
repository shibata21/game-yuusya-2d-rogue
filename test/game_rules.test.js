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
    expect(G.grid[G.CORE_ROW][G.CORE_COL].t).toBe("core");
    expect(G.nutrients).toBe(G.START_NUT);
    expect(G.grid.flat().filter((t) => t.sub === "moss")).toHaveLength(8);
    expect(G.grid.flat().filter((t) => t.sub === "meat")).toHaveLength(3);
  });

  it("初期鉱脈は上下固定ではなくスライム多めでランダム配置される", () => {
    const mossRows = [];
    const meatRows = [];
    for (let seed = 1; seed <= 16; seed++) {
      const game = createGame({ seed });
      const moss = [];
      const meat = [];
      for (let r = 0; r < game.ROWS; r++) for (let c = 0; c < game.COLS; c++) {
        if (game.grid[r][c].sub === "moss") moss.push(r);
        if (game.grid[r][c].sub === "meat") meat.push(r);
      }
      expect(moss).toHaveLength(8);
      expect(meat).toHaveLength(3);
      mossRows.push(...moss);
      meatRows.push(...meat);
    }
    expect(Math.max(...mossRows)).toBeGreaterThan(9);
    expect(Math.min(...meatRows)).toBeLessThan(8);
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

  it("上位モンスター1体は単独で卵を作り、卵は同じ上位種に孵化する", () => {
    carveAll();
    G.setRandom(() => 0);
    G.spawnMonster("superslime", 5, 5);
    G.monsters[0].eggCd = 0;
    G.update(G.EGG_CHECK);
    expect(G.eggs).toHaveLength(1);
    expect(G.eggs[0].kind).toBe("superslime");
    expect(Math.abs(G.eggs[0].col - 5) + Math.abs(G.eggs[0].row - 5)).toBe(1);
    G.waveCountdown = 999999;
    G.monsters.forEach((m) => { m.eggCd = 999999; });
    G.setRandom(() => 0.99);
    G.update(G.EGG_HATCH);
    expect(G.eggs).toHaveLength(0);
    expect(G.monsters.some((m) => m.kind === "superslime")).toBe(true);
  });

  it("卵は勇者の攻撃対象にならない", () => {
    carveAll();
    expect(G.spawnEgg("superslime", 5, 5)).toBe(true);
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

  it("近接攻撃は非隣接対象に当たらない", () => {
    carveAll();
    G.spawnMonster("slime", 2, 5);
    G.heroes.push(hero("warrior", 4, 5, { hp: 60, atkCd: 999999 }));
    G.monsters[0].atkCd = 0;
    G.update(100);
    expect(G.heroes[0].hp).toBe(60);
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

  it("勇者は開いた経路を進みコア上でだけ攻撃する", () => {
    carveAll();
    const h = hero("warrior", G.CORE_COL, 1, { actCd: 0, atk: 7, coreCd: 0 });
    G.heroes.push(h);
    const before = G.coreHP;
    for (let i = 0; i < 80 && G.coreHP === before; i++) G.update(250);
    expect(h.col).toBe(G.CORE_COL);
    expect(h.row).toBe(G.CORE_ROW);
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

  it("勇者の壁掘りは一撃で壊れない", () => {
    for (let r = 0; r < G.ROWS; r++) for (let c = 0; c < G.COLS; c++) G.grid[r][c] = { t: "bedrock", sub: null, shade: 0 };
    G.grid[0][G.ENTRANCE_COL] = { t: "surface", sub: null, shade: 0 };
    G.grid[1][G.ENTRANCE_COL] = { t: "earth", sub: null, shade: 0 };
    for (let r = 2; r <= G.CORE_ROW; r++) G.grid[r][G.ENTRANCE_COL] = { t: "tunnel", sub: null, shade: 0 };
    G.grid[G.CORE_ROW][G.CORE_COL] = { t: "core", sub: null, shade: 0 };
    G.spawnHero();
    G.heroes[0].actCd = 0;
    G.update(10);
    expect(G.grid[1][G.ENTRANCE_COL].t).toBe("earth");
    expect(G.grid[1][G.ENTRANCE_COL].dig).toBeGreaterThan(0);
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
    expect(G.WAVE_INTERVAL).toBe(29000);
    expect(KINDS.slime.breedEvery).toBe(14000);
    expect(G.monsterIncomeRate()).toBeCloseTo(0.045);
  });
});
