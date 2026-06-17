/*
 * 破壊神ダンジョン テストスイート
 * 使い方:  node test_hakaishin_dungeon.js [path/to/hakaishin_dungeon.html]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const htmlPath = process.argv[2] || path.join(__dirname, 'hakaishin_dungeon.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const repoDir = path.dirname(htmlPath);
const css = fs.readFileSync(path.join(repoDir, 'hakaishin_dungeon.css'), 'utf8');
const pixiLayerJs = fs.readFileSync(path.join(repoDir, 'hakaishin_dungeon_pixi.js'), 'utf8');
const canvasLayerJs = fs.readFileSync(path.join(repoDir, 'hakaishin_dungeon_canvas.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(repoDir, 'hakaishin_dungeon_core.js'), 'utf8');
const pixelMeta = JSON.parse(fs.readFileSync(path.join(repoDir, 'assets/pixel/sprites.json'), 'utf8'));
function pngSize(file) {
  const b = fs.readFileSync(path.join(repoDir, file));
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
function png(file) { return PNG.sync.read(fs.readFileSync(path.join(repoDir, file))); }
function crop(img, x0, y0, w, h) {
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(img, out, x0, y0, w, h, 0, 0);
  return out;
}
function imageDiffRatio(a, b) {
  let union = 0, diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] > 0 || b.data[i + 3] > 0) union++;
    if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) + Math.abs(a.data[i + 3] - b.data[i + 3]) > 32) diff++;
  }
  return union ? diff / union : 0;
}
function actorCrop(name, action, dir, frame) {
  const img = png('assets/pixel/actors.png');
  const row = Object.keys(pixelMeta.actors).indexOf(name);
  const ai = pixelMeta.actions.indexOf(action), di = pixelMeta.directions.indexOf(dir);
  return crop(img, ((ai * pixelMeta.directions.length + di) * pixelMeta.frames + frame) * pixelMeta.cell, row * pixelMeta.cell, pixelMeta.cell, pixelMeta.cell);
}

function loadGameScripts(htmlText, sourcePath) {
  const dir = path.dirname(sourcePath);
  const bodies = [];
  const re = /<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(htmlText))) {
    if (m[1]) {
      if (/^vendor\//.test(m[1])) continue;
      bodies.push(fs.readFileSync(path.resolve(dir, m[1]), 'utf8'));
    } else if (m[2] && m[2].trim()) {
      bodies.push(m[2]);
    }
  }
  if (!bodies.length) { console.error('No game <script> found in ' + sourcePath); process.exit(1); }
  return bodies.join('\n');
}

let body = loadGameScripts(html, htmlPath);
const hook = `
;if(typeof globalThis!=='undefined'){ globalThis.__GAME__={
  get monsters(){return monsters}, get heroes(){return heroes}, get eggs(){return eggs}, get grid(){return grid}, get effects(){return effects}, get spawnQueue(){return spawnQueue},
  get wave(){return wave}, set wave(v){wave=v},
  get coreHP(){return coreHP}, set coreHP(v){coreHP=v},
  get nutrients(){return nutrients}, set nutrients(v){nutrients=v},
  get waveCountdown(){return waveCountdown}, set waveCountdown(v){waveCountdown=v},
  get gameState(){return gameState}, set gameState(v){gameState=v},
  get pixelPixiReady(){return pixelPixiReady}, set pixelPixiReady(v){pixelPixiReady=v},
  get pixiReady(){return pixiReady}, set pixiReady(v){pixiReady=v},
  get pixiRoot(){return pixiRoot}, set pixiRoot(v){pixiRoot=v},
  update, draw, updateHUD, resetGame, tryDig, startWave, tauntEarly,
  beginMove, updateVisualPosition, setAction, actorPose, dirFromDelta, faceToward,
  drawPixiLayer, pixelActorX, pixelActorSourceX, actorAction, canvasActorAction,
  spawnMonster, spawnHero, spawnInTunnel, spawnEgg, pickHeroClass, heroStep, openNeighbors, hasLOS,
  countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, rankOf,
  VEIN, KINDS, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER,
  EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, heroDigDmg, BORN_ANIM, EVO_TIME,
  MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H, PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS, PIXEL_ASSET_VERSION, pixelAssetUrl,
  cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD
}; }
`;
body += hook;

const noop = () => {};
const grad = { addColorStop: noop };
const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p === 'createRadialGradient' || p === 'createLinearGradient') return () => grad;
    if (p === 'ellipse') return noop;
    if (p === 'measureText') return () => ({ width: 24 });
    if (p in t) return t[p];
    return noop;
  },
  set(t, p, v) { t[p] = v; return true; }
});
const canvasStub = {
  getContext: () => ctxStub, width: 528, height: 768,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 528, height: 768 }),
  addEventListener: noop, style: {}
};
const genEl = new Proxy({ style: {}, classList: { add: noop, remove: noop }, addEventListener: noop },
  { get(t, p) { return (p in t) ? t[p] : ''; }, set(t, p, v) { t[p] = v; return true; } });
global.document = { getElementById: (id) => id === 'game' ? canvasStub : genEl };
global.requestAnimationFrame = () => 0;
try { global.performance = { now: () => 0 }; } catch (e) {}

eval(body);
const G = globalThis.__GAME__;
if (!G) { console.error('Hook failed: __GAME__ not set'); process.exit(1); }
const scriptSrcs = Array.from(html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)).map(m => m[1]);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; console.log('  \u2717 ' + name + (detail ? '  -> ' + detail : '')); }
}
function section(t) { console.log('\n[' + t + ']'); }

function carveAll() {
  for (let r = 1; r < G.ROWS - 1; r++) for (let c = 1; c < G.COLS - 1; c++) {
    if (c === G.CORE_COL && r === G.CORE_ROW) continue;
    const t = G.grid[r][c]; t.t = 'tunnel'; t.sub = null; t.evo = false; t.evoChecked = false; t.dig = 0;
  }
}
function freshPlay() {
  G.resetGame(); G.gameState = 'playing'; G.monsters.length = 0; G.heroes.length = 0; G.eggs.length = 0; G.wave = 0; G.waveCountdown = 999999;
}
function mkHero(cls, col, row, extra) {
  const C = G.HERO_CLASSES[cls];
  return Object.assign({
    id: Math.random(), cls, col, row, px: G.cx(col), py: G.cy(row),
    hp: 60, maxHp: 100, atk: 10, range: C.range, wave: 12, faceDir: 's',
    moveCd: 720, atkCd: 0, coreCd: 0, actCd: 999999, healCd: 0, blockedMs: 0,
    atkAnim: G.ATK_ANIM, atkTX: G.cx(col + 1), atkTY: G.cy(row), bob: 0
  }, extra || {});
}
function run(ms, step) { for (let t = 0; t < ms; t += step) G.update(step); }

section('T1 描画と基本データ');
ok('PixiJSはゲーム本体より前に読み込まれる', scriptSrcs[0] === 'vendor/pixi.min.js' && scriptSrcs.indexOf('hakaishin_dungeon_core.js') > 0 && scriptSrcs.indexOf('hakaishin_dungeon.js') > scriptSrcs.indexOf('hakaishin_dungeon_pixi.js'), scriptSrcs.join(','));
ok('ゲーム用JSは複数ファイルに分割されている', ['hakaishin_dungeon_core.js','hakaishin_dungeon_logic.js','hakaishin_dungeon_canvas.js','hakaishin_dungeon_pixi.js','hakaishin_dungeon.js'].every(s => scriptSrcs.includes(s)), scriptSrcs.join(','));
ok('Pixiレイヤーは透明な前面キャンバスとして定義される', /\.pixi-layer/.test(css) && /background:transparent/.test(css) && /pointer-events:none/.test(css), 'pixi-layer css missing');
ok('Pixiキャンバスに専用クラスを付ける', /className='pixi-layer'/.test(pixiLayerJs) && /background='transparent'/.test(pixiLayerJs), 'pixi class missing');
ok('内部Canvasは48pxタイル用の解像度を持つ', G.TILE === 48 && G.PIXEL_CELL === 48 && G.W === 528 && G.H === 768 && /width="528" height="768"/.test(html), 'tile=' + G.TILE + ' pixel=' + G.PIXEL_CELL);
ok('素材URLはバージョン文字列付きで読む', G.PIXEL_ASSET_VERSION === 'v4-48-8dir-action-1' && G.pixelAssetUrl('tiles.png').endsWith('tiles.png?v=v4-48-8dir-action-1') && /pixelAssetUrl\('tiles\.png'\)/.test(canvasLayerJs) && /pixelAssetUrl\(name\)/.test(pixiLayerJs), G.pixelAssetUrl('tiles.png'));
ok('ピクセル素材PNGが配置されている', ['assets/pixel/actors.png','assets/pixel/tiles.png','assets/pixel/effects.png'].every(f => fs.existsSync(path.join(repoDir, f))));
ok('スプライト定義は全魔物と全勇者を含む', Object.keys(G.KINDS).every(k => pixelMeta.actors[k]) && Object.keys(G.HERO_CLASSES).every(k => pixelMeta.actors[k]));
ok('スプライト定義は主要タイルとエフェクトを含む', ['earth','tunnel','bedrock','surface','core','moss_evo','ember_evo'].every(k => pixelMeta.tiles[k]) && ['slash','shot','bite','birth','puff'].every(k => pixelMeta.effects[k]));
{
  const a = pngSize('assets/pixel/actors.png'), t = pngSize('assets/pixel/tiles.png'), e = pngSize('assets/pixel/effects.png');
  ok('PNGサイズは48px・8方向・アクション別スプライト定義と一致する', pixelMeta.cell === 48 && JSON.stringify(pixelMeta.directions) === JSON.stringify(G.PIXEL_DIRS) && JSON.stringify(pixelMeta.actions) === JSON.stringify(G.PIXEL_ACTIONS) && a.width === pixelMeta.cell * pixelMeta.frames * pixelMeta.directions.length * pixelMeta.actions.length && a.height === Object.keys(pixelMeta.actors).length * pixelMeta.cell && t.width === Object.keys(pixelMeta.tiles).length * pixelMeta.cell && t.height === pixelMeta.cell && e.width === pixelMeta.cell * pixelMeta.frames && e.height === Object.keys(pixelMeta.effects).length * pixelMeta.cell, JSON.stringify({ a, t, e, cell: pixelMeta.cell, dirs: pixelMeta.directions, actions: pixelMeta.actions }));
}
ok('JS側のスプライト順序はsprites.jsonと一致する', JSON.stringify(G.PIXEL_DIRS) === JSON.stringify(pixelMeta.directions) && JSON.stringify(G.PIXEL_ACTIONS) === JSON.stringify(pixelMeta.actions) && JSON.stringify(G.PIXEL_ACTORS) === JSON.stringify(Object.keys(pixelMeta.actors)) && JSON.stringify(G.PIXEL_TILES) === JSON.stringify(Object.keys(pixelMeta.tiles)) && JSON.stringify(G.PIXEL_EFFECTS) === JSON.stringify(Object.keys(pixelMeta.effects)));
ok('Pixiはロード完了後に全アクション・8方向フレームを検証する', /PIXEL_ACTIONS\.length/.test(pixiLayerJs) && /for\(let a=0; a<PIXEL_ACTIONS\.length; a\+\+\)/.test(pixiLayerJs) && /validatePixelPixiBase/.test(pixiLayerJs) && /scaleMode='nearest'/.test(pixiLayerJs), 'pixi strict validation missing');
ok('ステージは48px内部Canvasを等倍表示できる幅を持つ', /max-width:532px/.test(css) && /TILE\+0\.5/.test(canvasLayerJs));
ok('素材パイプラインのnpmスクリプトがある', /"assets:build": "node tools\/build_pixel_assets\.js"/.test(fs.readFileSync(path.join(repoDir, 'package.json'), 'utf8')) && /"assets:check": "node tools\/check_pixel_assets\.js"/.test(fs.readFileSync(path.join(repoDir, 'package.json'), 'utf8')));
ok('素材パイプラインは円囲みを生成しない', !/\bring\s*\(/.test(fs.readFileSync(path.join(repoDir, 'tools/build_pixel_assets.js'), 'utf8')) && !/function\s+ring\b/.test(fs.readFileSync(path.join(repoDir, 'tools/pixel_asset_common.js'), 'utf8')) && /validateNoCircleSyntax/.test(fs.readFileSync(path.join(repoDir, 'tools/check_pixel_assets.js'), 'utf8')));
ok('素材検査は方向差分と勇者アクション差分を見る', /validateActorDirectionDiff/.test(fs.readFileSync(path.join(repoDir, 'tools/check_pixel_assets.js'), 'utf8')) && /validateHeroActionDiff/.test(fs.readFileSync(path.join(repoDir, 'tools/check_pixel_assets.js'), 'utf8')) && /validateSimpleVeins/.test(fs.readFileSync(path.join(repoDir, 'tools/check_pixel_assets.js'), 'utf8')));
{
  const monsterOk = ['slime','carniv','spitter','golem','flame','infernal'].every(n => imageDiffRatio(actorCrop(n, 'idle', 's', 1), actorCrop(n, 'idle', 'n', 1)) > 0.13);
  const heroOk = imageDiffRatio(actorCrop('warrior', 'idle', 'e', 1), actorCrop('warrior', 'attack', 'e', 2)) > 0.18 &&
    imageDiffRatio(actorCrop('mage', 'idle', 'e', 1), actorCrop('mage', 'cast', 'e', 2)) > 0.18 &&
    imageDiffRatio(actorCrop('priest', 'idle', 'e', 1), actorCrop('priest', 'heal', 'e', 2)) > 0.18;
  ok('生成済み素材は方向と職業別アクションが実際に違う', monsterOk && heroOk);
}
{
  const oldPixiReady = G.pixiReady, oldPixel = G.pixelPixiReady, oldRoot = G.pixiRoot;
  G.pixiReady = true; G.pixelPixiReady = false; G.pixiRoot = { removeChildren: () => { throw new Error('呼ばれない想定'); } };
  ok('Pixi画像が未準備なら旧ベクター描画へ進まずCanvasへ戻す', G.drawPixiLayer(0) === false);
  G.pixiReady = oldPixiReady; G.pixelPixiReady = oldPixel; G.pixiRoot = oldRoot;
}
try {
  freshPlay();
  ['slime','carniv','evolved','spitter','golem','flame','superslime','tarantula','titan','infernal'].forEach((k, i) => G.spawnMonster(k, 2 + (i % 8), 3 + Math.floor(i / 8)));
  G.spawnEgg('superslime', 5, 5);
  ['warrior','tank','mage','priest'].forEach((cls, i) => G.heroes.push(mkHero(cls, 3, 6 + i)));
  G.grid[4][2].t = 'earth'; G.grid[4][2].sub = 'moss'; G.grid[4][2].evo = true;
  G.effects.push(
    { type: 'slash', x: 100, y: 100, color: '#fff', life: 170, max: 170, rot: 1 },
    { type: 'shot', sx: 40, sy: 40, tx: 120, ty: 140, color: '#9bff5a', life: 230, max: 230 },
    { type: 'birth', x: 80, y: 80, life: 380, max: 380, color: '#5fd16b' },
    { type: 'evolveVein', x: 96, y: 96, life: 760, max: 760, color: '#6fcf6f' },
    { type: 'banner', text: 'A', life: 2700, max: 2700, slot: 0 },
    { type: 'dig', x: 60, y: 60, life: 300, max: 300, hero: true },
    { type: 'puff', x: 90, y: 90, life: 300, max: 300, color: '#fff' },
    { type: 'corehit', x: G.cx(G.CORE_COL), y: G.cy(G.CORE_ROW), life: 260, max: 260 },
    { type: 'float', x: 70, y: 70, text: '-9', color: '#fff', life: 650, max: 650, vy: -0.03 }
  );
  G.draw(); G.updateHUD();
  ok('全スプライト・鉱脈・卵・全エフェクト描画で例外が出ない', true);
} catch (e) { ok('描画で例外が出ない', false, e && (e.stack || e.message || e)); }
ok('鉱脈テーブルは5種類ある', ['moss','meat','venom','stone','ember'].every(k => !!G.VEIN[k]));
ok('襲来待ち時間が短縮されている', G.FIRST_GRACE === 27000 && G.WAVE_INTERVAL === 29000 && G.HERO_STAGGER === 2200 && G.DIG_CD === 780);
ok('栄養経済は1マス1消費向けの値', G.DIG_COST === 1 && G.START_NUT === 25 && Math.abs(G.monsterIncomeRate() - 0.045) < 0.0001);
ok('スライムは以前より少し強い', G.KINDS.slime.hp === 10 && G.KINDS.slime.atk === 2);
ok('上位種は卵で増える種として定義される', ['superslime','evolved','tarantula','titan','infernal'].every(k => G.isElite(k) && G.KINDS[k].breedEvery === 0));
(function () {
  const e = { col: 1, row: 1, px: G.cx(1), py: G.cy(1) };
  const startX = e.px, goalX = G.cx(2);
  G.beginMove(e, 2, 1, 200);
  G.updateVisualPosition(e, 100);
  ok('移動中の描画座標はマス間を補間し、進行方向へ向ける', e.col === 2 && e.row === 1 && e.px > startX && e.px < goalX && e.faceDir === 'e', 'px=' + e.px + ' face=' + e.faceDir);
  G.updateVisualPosition(e, 100);
  ok('移動補間は終了時に目的マスへ到達する', e.px === goalX && e.py === G.cy(1) && e.moveAnim === 0, 'px=' + e.px + ' py=' + e.py);
  G.beginMove(e, 1, 1, 200);
  ok('左へ移動すると西向きになる', e.faceDir === 'w', 'face=' + e.faceDir);
  G.beginMove(e, 2, 2, 200);
  ok('斜め移動では斜め方向を向く', e.faceDir === 'se', 'face=' + e.faceDir);
  ok('方向判定は8方向を返す', G.dirFromDelta(3, -2) === 'ne' && G.dirFromDelta(-1, 4) === 'sw' && G.dirFromDelta(0, 0, 'n') === 'n');
})();
(function () {
  const e = { col: 1, row: 1, px: G.cx(1), py: G.cy(1) };
  G.setAction(e, 'attack', G.cx(2), G.cy(1), 200);
  const p = G.actorPose(e);
  ok('攻撃アクションは対象座標と時間と向きを保持する', e.actionType === 'attack' && e.actionTX === G.cx(2) && e.actionTime === 200 && e.faceDir === 'e' && p.x === 0 && G.actorAction(e) === 'attack', 'type=' + e.actionType + ' face=' + e.faceDir);
  ok('描画用アトラス座標はアクションと向きを反映する', G.pixelActorX('attack', 'e', 2) === ((G.PIXEL_ACTIONS.indexOf('attack') * G.PIXEL_DIRS.length + G.PIXEL_DIRS.indexOf('e')) * G.PIXEL_FRAMES + 2) * G.PIXEL_CELL);
})();

section('T2 鉱脈採掘と熟成');
(function () {
  freshPlay(); G.nutrients = 100;
  const c = 3, r = 3;
  G.grid[r][c].t = 'earth'; G.grid[r][c].sub = 'moss'; G.grid[r][c].evo = false; G.grid[r][c].evoChecked = false;
  G.grid[r][c + 1].t = 'tunnel';
  G.tryDig(c, r);
  ok('通常鉱脈を掘ると対応する下位種が即出現する', G.monsters.length === 1 && G.monsters[0].kind === 'slime', G.monsters.map(m => m.kind).join(','));
  ok('掘った後は単なる通路になる', G.grid[r][c].t === 'tunnel' && !G.grid[r][c].sub && !G.grid[r][c].soil && !G.grid[r][c].nutrient);
  ok('採掘で固定コストを消費する', Math.abs(G.nutrients - (100 - G.DIG_COST)) < 0.001, 'nutrients=' + G.nutrients);
})();
(function () {
  freshPlay();
  ok('初期栄養は25', G.nutrients === G.START_NUT, 'nutrients=' + G.nutrients);
})();
(function () {
  freshPlay(); G.nutrients = 100;
  const c = 4, r = 3;
  G.grid[r][c].t = 'earth'; G.grid[r][c].sub = 'moss'; G.grid[r][c].evo = false; G.grid[r][c].evoChecked = false; G.grid[r][c].age = G.EVO_TIME;
  G.grid[r][c + 1].t = 'tunnel';
  const oldRandom = Math.random; Math.random = () => 0;
  G.update(100);
  Math.random = oldRandom;
  ok('熟成した鉱脈は低確率で上位鉱脈になる', G.grid[r][c].evo === true);
  G.tryDig(c, r);
  ok('上位鉱脈を掘ると上位種が出る', G.monsters.some(m => m.kind === 'superslime'), G.monsters.map(m => m.kind).join(','));
})();
(function () {
  freshPlay();
  run(70000, 500);
  ok('掘らなければ魔物は自然発生しない', G.monsters.length === 0, 'monsters=' + G.monsters.length);
})();

section('T3 増殖と卵');
(function () {
  freshPlay(); carveAll();
  G.spawnMonster('slime', 5, 5);
  const s = G.monsters[0]; s.breedCd = 0;
  G.update(100);
  ok('下位種は遅い直接増殖を持つ', G.monsters.length === 2 && G.monsters.every(m => m.kind === 'slime'), 'monsters=' + G.monsters.length);
})();
(function () {
  freshPlay(); carveAll();
  G.spawnMonster('superslime', 5, 5);
  const s = G.monsters[0]; s.breedCd = 0;
  G.update(1000);
  ok('上位種は直接増殖しない', G.monsters.length === 1 && G.eggs.length === 0);
})();
(function () {
  freshPlay(); carveAll();
  G.spawnMonster('superslime', 5, 5); G.spawnMonster('superslime', 6, 5);
  G.monsters[0].eggCd = 0; G.monsters[1].eggCd = 0;
  const oldRandom = Math.random; Math.random = () => 0;
  G.update(100);
  Math.random = oldRandom;
  ok('同種上位2体が接触すると低確率で卵を作る', G.eggs.length === 1 && G.eggs[0].kind === 'superslime', 'eggs=' + G.eggs.length);
})();
(function () {
  freshPlay(); carveAll();
  G.spawnEgg('superslime', 5, 5);
  G.update(G.EGG_HATCH);
  ok('卵は時間経過で同じ上位種に孵化する', G.eggs.length === 0 && G.monsters.some(m => m.kind === 'superslime'));
})();
(function () {
  freshPlay(); carveAll();
  G.spawnEgg('superslime', 5, 5);
  G.heroes.push(mkHero('warrior', 5, 6, { atkCd: 0, actCd: 999999 }));
  G.update(500);
  ok('卵は勇者の攻撃対象にならない', G.eggs.length === 1, 'eggs=' + G.eggs.length);
})();
(function () {
  freshPlay(); carveAll();
  const priest = mkHero('priest', 5, 5, { healCd: 0 });
  const warrior = mkHero('warrior', 6, 5, { hp: 20, maxHp: 80 });
  G.heroes.push(priest, warrior);
  G.update(100);
  ok('僧侶の回復は専用アクションで対象方向を向く', priest.actionType === 'heal' && priest.faceDir === 'e' && warrior.hp > 20, 'action=' + priest.actionType + ' face=' + priest.faceDir + ' hp=' + warrior.hp);
})();
(function () {
  freshPlay(); carveAll();
  G.spawnMonster('carniv', 5, 5);
  const eater = G.monsters[0]; eater.hp = 10; eater.eatCd = 0;
  G.spawnMonster('slime', 5, 6);
  const oldRandom = Math.random; Math.random = () => 0;
  G.update(100);
  Math.random = oldRandom;
  ok('序列上位の魔物は下位を捕食してHPを回復する', G.monsters.length === 1 && eater.hp > 10, 'len=' + G.monsters.length + ' hp=' + eater.hp);
  ok('捕食成功時に捕食アクションと噛み付きエフェクトが出る', eater.actionType === 'eat' && G.effects.some(e => e.type === 'bite'), 'action=' + eater.actionType);
})();

section('T4 戦闘・ウェーブ・長時間');
(function () {
  freshPlay(); carveAll();
  G.spawnMonster('golem', 5, 5);
  const g = G.monsters[0]; g.col = 9; g.row = 5; g.moveCd = 0;
  G.update(100);
  ok('魔物は生まれた場所の近くへ戻ろうとする', g.col < 9, 'col=' + g.col + ' home=' + g.homeCol);
})();
(function () {
  freshPlay(); carveAll();
  ok('開けた通路では視線が通る', G.hasLOS(2, 5, 8, 5) === true);
  G.grid[5][5].t = 'earth'; G.grid[5][5].sub = null;
  ok('壁があると遠距離の視線は通らない', G.hasLOS(2, 5, 8, 5) === false);
})();
(function () {
  const atks = [1, 6, 12, 20, 60, 300];
  ok('勇者の壁掘りは一撃禁止', atks.every(a => G.heroDigDmg(a) < G.DIG_BREAK));
})();
(function () {
  G.resetGame(); G.wave = 10;
  const seen = {};
  for (let i = 0; i < 60; i++) { G.heroes.length = 0; G.spawnHero(); seen[G.heroes[0].cls] = true; }
  const kinds = Object.keys(seen);
  ok('複数職業が出現する', kinds.length >= 3, kinds.join(','));
  ok('未解禁の職業は出ない', kinds.every(k => G.HERO_CLASSES[k].unlock <= 10), kinds.join(','));
})();
(function () {
  freshPlay();
  const beforeNut = G.nutrients;
  G.tauntEarly();
  ok('すぐ襲来は栄養を変えない', Math.abs(G.nutrients - beforeNut) < 0.001);
  G.startWave();
  ok('すぐ襲来は勇者数を増やさない', G.spawnQueue.length === 1, 'queue=' + G.spawnQueue.length);
})();
(function () {
  freshPlay(); carveAll();
  const h = mkHero('warrior', 5, 5, { hp: 1, maxHp: 1, wave: 5 });
  G.heroes.push(h);
  const before = G.nutrients;
  G.killHero(h);
  ok('勇者撃破報酬は4+wave', G.nutrients === before + 9, 'before=' + before + ' after=' + G.nutrients);
})();
(function () {
  try {
    G.resetGame(); G.gameState = 'playing';
    for (let step = 0; step < 900; step++) { G.update(100); if (step % 10 === 0) G.draw(); }
    G.draw(); G.updateHUD();
    ok('長時間シミュレーションで例外が出ない', true);
    ok('魔物と卵の合計が上限を超えない', G.monsters.length + G.eggs.length <= G.MONSTER_CAP, (G.monsters.length + G.eggs.length) + '/' + G.MONSTER_CAP);
    ok('勇者数が上限を超えない', G.heroes.length <= G.MAX_HEROES, G.heroes.length + '/' + G.MAX_HEROES);
  } catch (e) { ok('長時間シミュレーションで例外が出ない', false, e && (e.stack || e.message || e)); }
})();

console.log('\n========================================');
console.log('結果: ' + pass + ' passed, ' + fail + ' failed');
console.log('========================================');
process.exit(fail ? 1 : 0);
