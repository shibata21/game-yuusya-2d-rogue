"use strict";
/* ===================== 定数 ===================== */
const COLS=11, ROWS=16, TILE=48;
const W=COLS*TILE, H=ROWS*TILE;
const ENTRANCE_COL=5;
const CORE_COL=5, CORE_ROW=ROWS-2;

const DIG_COST=1, START_NUT=25, CORE_MAX=150;
const MONSTER_CAP=48;
const BREED_LIMIT=3;          // 1個体が産める子の最大数（指数関数的な激増を防ぐ。子も同じ上限で産める＝不妊にはしない）
const MAX_HEROES=8;           // 勇者の同時出現上限（負荷と難度の暴走を防ぐ）
const WAVE_INTERVAL=29000, FIRST_GRACE=27000, HERO_STAGGER=2200;
const VEIN_CAP=44;
const EGG_HATCH=40000, EGG_CHECK=10000, EGG_CHANCE=0.20, EGG_KIND_CAP=2;
const EAT_CHECK=2600, EAT_CHANCE_STEP=0.09;
const EFFECT_CAP=90;
const ATK_ANIM=190, LUNGE=5;                       // 攻撃アクションの長さ(ms)と踏み込み量(px)
const MOVE_ANIM=220;                               // 1マス移動の見た目補間時間(ms)
const DIG_BREAK=140, DIG_CD=780;                   // 勇者が土を壊す耐久と振り間隔
const heroDigDmg=(atk)=>Math.min(95, 30+atk*1.2);  // 攻撃力依存・一撃禁止（必ず2回以上要る）

/* 開いた空間 / 鉱脈タイプ */
const OPEN=new Set(['tunnel','core','surface']);
const BORN_ANIM=320;          // 出現・増殖時のスケールインの長さ(ms)
const EVO_TIME=65000;         // 鉱脈が熟し、上位種鉱脈へ変わる判定までの時間(ms)

/* 魔物（味方）の種別データ。breedEvery=下位種の直接増殖間隔(ms,0は増殖しない), breedCap=周囲(3x3)の同種上限 */
const KINDS={
  slime:  {hp:10,  atk:2,  range:1, moveCd:560,  atkCd:720,  aggro:1, rank:1, breedEvery:24000, breedCap:3, col:'#5fd16b'},
  carniv: {hp:26,  atk:5,  range:1, moveCd:590,  atkCd:680,  aggro:5, rank:3, breedEvery:36000, breedCap:2, col:'#e06b3a'},
  evolved:{hp:90,  atk:16, range:1, moveCd:620,  atkCd:660,  aggro:5, rank:6, breedEvery:0,     breedCap:1, col:'#9b2f4f'},   /* 上位種：直接増えず、卵で増える */
  spitter:{hp:16,  atk:6,  range:2, moveCd:590,  atkCd:980,  aggro:3, rank:2, breedEvery:43000, breedCap:2, col:'#a64dff'},   /* 遠距離 */
  golem:  {hp:95,  atk:4,  range:1, moveCd:1100, atkCd:1050, aggro:4, rank:4, breedEvery:0,     breedCap:1, col:'#6f86c4'},   /* 壁役：増えない */
  flame:  {hp:64,  atk:15, range:1, moveCd:590,  atkCd:780,  aggro:5, rank:5, breedEvery:0,     breedCap:1, col:'#ff8a3a'},   /* 大火力：増えない */
  /* 上位種。eliteOf=元スプライト, tint=色替えフィルタ（形は元のまま、色だけ変える） */
  superslime:{hp:52, atk:7,  range:1, moveCd:520, atkCd:680, aggro:1, rank:2, breedEvery:0, breedCap:2, col:'#7fbaff', eliteOf:'slime',   tint:'hue-rotate(150deg) saturate(1.35) brightness(1.05)', name:'スーパースライム'},
  tarantula: {hp:62, atk:15, range:2, moveCd:560, atkCd:880, aggro:4, rank:4, breedEvery:0, breedCap:1, col:'#ff6b5a', eliteOf:'spitter', tint:'hue-rotate(120deg) saturate(1.4)',                 name:'タランチュラ'},
  titan:     {hp:220,atk:13, range:1, moveCd:1080,atkCd:1000,aggro:4, rank:7, breedEvery:0, breedCap:1, col:'#d9b27a', eliteOf:'golem',   tint:'sepia(0.7) saturate(1.8) hue-rotate(-12deg) brightness(1.05)', name:'タイタン'},
  infernal:  {hp:150,atk:28, range:1, moveCd:560, atkCd:740, aggro:5, rank:7, breedEvery:0, breedCap:1, col:'#5ab0ff', eliteOf:'flame',   tint:'hue-rotate(180deg) saturate(1.4) brightness(1.05)', name:'インフェルノ'},
};

/* 鉱脈。熟成後に低確率で上位種鉱脈になる */
const VEIN={
  moss:  {kind:'slime',   evoKind:'superslime', unlock:1, color:'#6fcf6f', core:'#bdf7bd', legend:'苔脈→スライム',    evoName:'上位苔脈', evoChance:0.22},
  meat:  {kind:'carniv',  evoKind:'evolved',    unlock:1, color:'#e63a2c', core:'#ffb39e', legend:'肉脈→肉食魔物',    evoName:'上位肉脈', evoChance:0.18},
  venom: {kind:'spitter', evoKind:'tarantula',  unlock:3, color:'#a64dff', core:'#e0bcff', legend:'毒脈→毒吐き',      evoName:'上位毒脈', evoChance:0.14, unlockMsg:'新たな鉱脈『毒脈』 ─ 毒吐きが眠る'},
  stone: {kind:'golem',   evoKind:'titan',      unlock:6, color:'#6f86c4', core:'#bcd0ff', legend:'石脈→岩兵',        evoName:'上位石脈', evoChance:0.12, unlockMsg:'新たな鉱脈『石脈』 ─ 岩兵が眠る'},
  ember: {kind:'flame',   evoKind:'infernal',   unlock:9, color:'#ffae26', core:'#ffe39a', legend:'火脈→炎魔',        evoName:'上位火脈', evoChance:0.10, unlockMsg:'新たな鉱脈『火脈』 ─ 炎魔が眠る'},
};

/* 勇者の職業。base(hp/atk)に倍率を掛ける。range=攻撃間合い, unlock=出現開始ウェーブ */
const HERO_CLASSES={
  warrior:{name:'戦士',    hpMul:1.0,  atkMul:1.0,  range:1, moveMul:1.0, atkCd:650,  weight:3,   unlock:1},
  tank:   {name:'盾兵',    hpMul:2.4,  atkMul:0.6,  range:1, moveMul:1.5, atkCd:800,  weight:1.4, unlock:3, msg:'重装の盾兵が現れた ─ 非常に硬い'},
  mage:   {name:'魔法使い', hpMul:0.55, atkMul:1.5,  range:3, moveMul:1.0, atkCd:900,  weight:1.3, unlock:5, msg:'魔法使いが現れた ─ 遠くから魔物を撃つ'},
  priest: {name:'僧侶',    hpMul:0.85, atkMul:0.35, range:1, moveMul:1.0, atkCd:1000, weight:1.0, unlock:7, heal:true, healCd:1500, healRange:2, msg:'僧侶が現れた ─ 仲間を癒やす'},
};

/* 画像素材。sprites.json と同じ並びを JS 側にも持ち、ローカルHTML直開きで fetch なしに使う */
const PIXEL_ASSET_PATH='assets/pixel/';
const PIXEL_ASSET_VERSION='v2-48-2';
const PIXEL_CELL=48, PIXEL_FRAMES=4;
const PIXEL_ACTORS=['slime','carniv','evolved','spitter','golem','flame','superslime','tarantula','titan','infernal','warrior','tank','mage','priest','egg_superslime','egg_evolved','egg_tarantula','egg_titan','egg_infernal'];
const PIXEL_TILES=['earth','tunnel','bedrock','surface','core','moss','meat','venom','stone','ember','moss_evo','meat_evo','venom_evo','stone_evo','ember_evo'];
const PIXEL_EFFECTS=['slash','shot','bite','birth','puff'];
function pixelAssetUrl(name){ return PIXEL_ASSET_PATH+name+'?v='+PIXEL_ASSET_VERSION; }

/* ===================== 状態 ===================== */
let grid=[], monsters=[], heroes=[], eggs=[], effects=[], spawnQueue=[];
let nutrients, coreHP, wave, score, kills, waveCountdown, idc=0;
let unlocked=new Set();
let gameState='title';

/* ===================== DOM ===================== */
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const el={
  coreFill:document.getElementById('coreFill'), coreNum:document.getElementById('coreNum'),
  nutNum:document.getElementById('nutNum'), waveNum:document.getElementById('waveNum'),
  monNum:document.getElementById('monNum'), scoreNum:document.getElementById('scoreNum'),
  waveLabel:document.getElementById('waveLabel'), waveTimer:document.getElementById('waveTimer'),
  tauntBtn:document.getElementById('tauntBtn'), legend:document.getElementById('legend'),
  startOverlay:document.getElementById('startOverlay'), deadOverlay:document.getElementById('deadOverlay'),
  deadWave:document.getElementById('deadWave'), deadKills:document.getElementById('deadKills'), deadScore:document.getElementById('deadScore'),
};

/* ===================== 補助 ===================== */
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const cx=c=>c*TILE+TILE/2;
const cy=r=>r*TILE+TILE/2;
const inBounds=(c,r)=>c>=0&&r>=0&&c<COLS&&r<ROWS;
const cheb=(a,b)=>Math.max(Math.abs(a.col-b.col),Math.abs(a.row-b.row));
const lowestHp=arr=>{let b=arr[0]; for(const x of arr) if(x.hp<b.hp) b=x; return b;};
const digCost=row=>DIG_COST;
function lerpHex(h1,h2,t){
  const a=parseInt(h1.slice(1),16), b=parseInt(h2.slice(1),16);
  const ar=a>>16,ag=(a>>8)&255,ab=a&255, br=b>>16,bg=(b>>8)&255,bb=b&255;
  return 'rgb('+Math.round(ar+(br-ar)*t)+','+Math.round(ag+(bg-ag)*t)+','+Math.round(ab+(bb-ab)*t)+')';
}
function openNeighbors(c,r){
  const out=[];
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){ const nc=c+d[0], nr=r+d[1];
    if(inBounds(nc,nr) && OPEN.has(grid[nr][nc].t)) out.push({col:nc,row:nr}); }
  return out;
}
function monsterIncomeRate(){
  return 0.045;
}
function occupied(col,row){
  return monsters.some(m=>m.col===col&&m.row===row) || heroes.some(h=>h.col===col&&h.row===row) || eggs.some(e=>e.col===col&&e.row===row);
}
function countKindNear(kind,col,row,range){
  let n=0;
  for(const m of monsters) if(m.kind===kind && cheb(m,{col,row})<=range) n++;
  return n;
}
function rankOf(kind){ return (KINDS[kind]&&KINDS[kind].rank)||1; }
function isElite(kind){
  for(const key in VEIN) if(VEIN[key].evoKind===kind) return true;
  return false;
}

/* ===================== 盤面生成 ===================== */
function buildGrid(){
  grid=[];
  for(let r=0;r<ROWS;r++){
    const row=[];
    for(let c=0;c<COLS;c++){
      let t='earth';
      if(c===0||c===COLS-1||r===ROWS-1) t='bedrock';
      else if(r===0) t=(c===ENTRANCE_COL)?'surface':'bedrock';
      row.push({t, sub:null, shade:Math.random()});
    }
    grid.push(row);
  }
  // 初期鉱脈（控えめ）。残りはウェーブごとに地中へ増える
  seedType('moss', 8, 2, 9);
  seedType('meat', 3, 8, ROWS-3);
  // 開始トンネル
  grid[1][ENTRANCE_COL]={t:'tunnel', sub:null, shade:0};
  grid[2][ENTRANCE_COL]={t:'tunnel', sub:null, shade:0};
  // 魔王コア
  grid[CORE_ROW][CORE_COL]={t:'core', sub:null, shade:0};
}
function veinCount(){ let n=0; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) if(grid[r][c].sub) n++; return n; }
function seedType(type, n, rMin, rMax){
  let tries=0;
  while(n>0 && tries<400 && veinCount()<VEIN_CAP){
    tries++;
    const c=ri(1,COLS-2), r=ri(rMin,rMax);
    if(!inBounds(c,r)) continue;
    const t=grid[r][c];
    if(t.t!=='earth' || t.sub) continue;
    if(c===CORE_COL && r===CORE_ROW) continue;
    if(c===ENTRANCE_COL && r<=2) continue;
    t.sub=type; t.age=0; t.evo=false; t.evoChecked=false; n--;
  }
}
// ウェーブ進行に応じて新しい鉱脈を地中に増やす
function seedVeins(wv){
  seedType('moss', 3, 2, ROWS-3);
  seedType('meat', 1 + (wv>=5?1:0), 4, ROWS-3);
  if(wv>=3) seedType('venom', 1 + (wv>=7?1:0), 3, ROWS-3);
  if(wv>=6) seedType('stone', 1, 7, ROWS-3);
  if(wv>=9) seedType('ember', 1, 8, ROWS-3);
}
