(function(){
"use strict";

/* ===================== 定数 ===================== */
const COLS=11, ROWS=16, TILE=32;
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

/* ===================== 入力（タップで掘る） ===================== */
function tryDig(col,row){
  if(gameState!=='playing' || !inBounds(col,row)) return;
  const tile=grid[row][col];
  if(tile.t==='bedrock') return;
  if(tile.t!=='earth') return;
  let touch=false;
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){ const nc=col+d[0], nr=row+d[1];
    if(inBounds(nc,nr) && OPEN.has(grid[nr][nc].t)){ touch=true; break; } }
  if(!touch) return;
  const cost=digCost(row);
  if(nutrients<cost){ toast(col,row,'不足','#ffb84d'); return; }

  nutrients-=cost;
  if(tile.sub){
    const vein=tile.sub, rich=tile.evo, kind=rich?VEIN[vein].evoKind:VEIN[vein].kind;
    tile.t='tunnel'; tile.sub=null; tile.evo=false; tile.age=0; tile.evoChecked=false;
    spawnMonster(kind,col,row);
    const mo=monsters[monsters.length-1];
    if(mo && mo.col===col && mo.row===row){ mo.bornAnim=BORN_ANIM; effects.push({type:'birth', x:cx(col), y:cy(row), life:380, max:380, color:KINDS[mo.kind].col}); }
  } else {
    tile.t='tunnel';
  }
  tile.sub=null;
  effects.push({type:'dig', x:cx(col), y:cy(row), life:340, max:340});
}
canvas.addEventListener('pointerdown', e=>{
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const px=(e.clientX-rect.left)*(canvas.width/rect.width);
  const py=(e.clientY-rect.top)*(canvas.height/rect.height);
  tryDig(Math.floor(px/TILE), Math.floor(py/TILE));
}, {passive:false});

/* ===================== エフェクト ===================== */
function toast(col,row,text,color){ effects.push({type:'float', x:cx(col), y:cy(row), text, color, life:900, max:900, vy:-0.018}); }
function popDmg(x,y,text,color){ effects.push({type:'float', x:x+rnd(-4,4), y:y-6, text, color, life:650, max:650, vy:-0.03}); }
function banner(text){ effects.push({type:'banner', text, life:2700, max:2700, slot:effects.filter(e=>e.type==='banner').length}); }
function slash(x,y,color){ effects.push({type:'slash', x, y, color, life:170, max:170, rot:rnd(0,6.28)}); }
function shoot(sx,sy,tx,ty,color){ effects.push({type:'shot', sx, sy, tx, ty, color, life:230, max:230}); }

/* ===================== 出現 ===================== */
function spawnMonster(kind,col,row){
  if(monsters.length>=MONSTER_CAP) return;
  const k=KINDS[kind];
  monsters.push({id:++idc, kind, col, row, px:cx(col), py:cy(row), bob:rnd(0,6.28),
    homeCol:col, homeRow:row,
    hp:k.hp, maxHp:k.hp, atk:k.atk, range:k.range, moveCd:rnd(0,k.moveCd), atkCd:0, eggCd:EGG_CHECK*rnd(0.7,1.3),
    eatCd:EAT_CHECK*rnd(0.6,1.2),
    breedCd:(k.breedEvery?k.breedEvery*rnd(0.6,1.2):0), breedLeft:(k.breedEvery?BREED_LIMIT:0), bornAnim:0,
    atkAnim:0, atkTX:0, atkTY:0});
}
function spawnEgg(kind,col,row){
  if(monsters.length+eggs.length>=MONSTER_CAP) return false;
  if(!isElite(kind) || !inBounds(col,row) || !OPEN.has(grid[row][col].t) || occupied(col,row)) return false;
  eggs.push({kind, col, row, hatchCd:EGG_HATCH, bornAnim:BORN_ANIM});
  effects.push({type:'birth', x:cx(col), y:cy(row), life:380, max:380, color:KINDS[kind].col});
  return true;
}
function eggCount(kind){
  let n=0;
  for(const e of eggs) if(e.kind===kind) n++;
  return n;
}
function eggSpot(a,b){
  const cand=[];
  for(const base of [a,b]){
    for(const n of openNeighbors(base.col,base.row)){
      if(!occupied(n.col,n.row)) cand.push(n);
    }
  }
  return cand.length ? cand[ri(0,cand.length-1)] : null;
}
function updateEggs(dt){
  for(let i=eggs.length-1;i>=0;i--){
    const e=eggs[i];
    e.hatchCd-=dt; if(e.bornAnim>0) e.bornAnim-=dt;
    if(e.hatchCd>0) continue;
    if(monsters.length<MONSTER_CAP && !monsters.some(m=>m.col===e.col&&m.row===e.row) && !heroes.some(h=>h.col===e.col&&h.row===e.row)){
      spawnMonster(e.kind,e.col,e.row);
      const mo=monsters[monsters.length-1];
      if(mo) mo.bornAnim=BORN_ANIM;
    }
    eggs.splice(i,1);
  }
}
function updateEliteEggBreeding(dt){
  for(const m of monsters) if(isElite(m.kind)) m.eggCd=(m.eggCd===undefined?EGG_CHECK:m.eggCd)-dt;
  for(let i=0;i<monsters.length;i++){
    const a=monsters[i];
    if(!isElite(a.kind) || a.eggCd>0 || eggCount(a.kind)>=EGG_KIND_CAP) continue;
    for(let j=i+1;j<monsters.length;j++){
      const b=monsters[j];
      if(b.kind!==a.kind || cheb(a,b)>1) continue;
      a.eggCd=EGG_CHECK*rnd(0.9,1.25);
      b.eggCd=EGG_CHECK*rnd(0.9,1.25);
      if(Math.random()>=EGG_CHANCE) break;
      const spot=eggSpot(a,b);
      if(spot) spawnEgg(a.kind,spot.col,spot.row);
      break;
    }
  }
}
function lowerPreyNear(m){
  let best=null, bestGap=0;
  const r=rankOf(m.kind);
  for(const p of monsters){
    if(p===m || cheb(p,m)>1) continue;
    const gap=r-rankOf(p.kind);
    if(gap<=0) continue;
    if(!best || gap>bestGap || (gap===bestGap && p.hp<best.hp)){ best=p; bestGap=gap; }
  }
  return best ? {prey:best, gap:bestGap} : null;
}
function tryEatLower(m){
  const found=lowerPreyNear(m);
  if(!found) return false;
  const chance=clamp(EAT_CHANCE_STEP*found.gap,0.08,0.55);
  if(Math.random()>=chance) return false;
  const prey=found.prey;
  killMonster(prey);
  m.hp=Math.min(m.maxHp,m.hp+Math.max(3,Math.round(prey.maxHp*0.18)));
  popDmg(m.px,m.py,'喰','#ffcf4d');
  return true;
}
function pickHeroClass(){
  const pool=[];
  for(const key in HERO_CLASSES){ const c=HERO_CLASSES[key]; if(wave>=c.unlock){ const w=Math.round(c.weight*10); for(let i=0;i<w;i++) pool.push(key); } }
  return pool.length ? pool[ri(0,pool.length-1)] : 'warrior';
}
function spawnHero(){
  const cls=pickHeroClass(), C=HERO_CLASSES[cls];
  const hp=Math.max(12, Math.round((26+wave*8)*C.hpMul));
  const atk=Math.max(1, Math.round((4+wave*1.2)*C.atkMul));
  heroes.push({id:++idc, cls, col:ENTRANCE_COL, row:0, px:cx(ENTRANCE_COL), py:cy(0),
    hp, maxHp:hp, atk, range:C.range, wave,
    moveCd:Math.round(720*C.moveMul), atkCd:0, coreCd:0, actCd:300, healCd:800, blockedMs:0,
    atkAnim:0, atkTX:0, atkTY:0, bob:rnd(0,6.28)});
}

/* ===================== ウェーブ ===================== */
function startWave(){
  wave++;
  for(const key in VEIN){
    const v=VEIN[key];
    if(v.unlock===wave && !unlocked.has(key)){
      unlocked.add(key);
      if(v.unlock>1) banner(v.unlockMsg);
      renderLegend();
    }
  }
  seedVeins(wave);
  for(const key in HERO_CLASSES){ const c=HERO_CLASSES[key]; if(c.unlock===wave && c.unlock>1 && c.msg) banner(c.msg); }
  let count=Math.min(1+Math.floor(wave/2), 5);
  // 場の勇者＋待機列が上限を超えないように調整（無限蓄積の防止）
  const room=(MAX_HEROES+4)-heroes.length-spawnQueue.length;
  count=Math.max(0, Math.min(count, room));
  for(let i=0;i<count;i++) spawnQueue.push({delay:i*HERO_STAGGER});
  waveCountdown=WAVE_INTERVAL;
}
function tauntEarly(){
  if(gameState!=='playing' || spawnQueue.length>0 || waveCountdown<=3000) return;
  waveCountdown=250; toast(ENTRANCE_COL,0,'襲来','#ffcf4d');
}

/* ===================== 経路探索（勇者：ダイクストラ） ===================== */
const _N=COLS*ROWS;
const _dist=new Float64Array(_N), _prev=new Int32Array(_N), _done=new Uint8Array(_N); // 使い回し
function heroStep(h){
  _dist.fill(Infinity); _prev.fill(-1); _done.fill(0);
  const idx=(c,r)=>r*COLS+c, s=idx(h.col,h.row), goal=idx(CORE_COL,CORE_ROW);
  _dist[s]=0;
  while(true){
    let u=-1,best=Infinity;
    for(let i=0;i<_N;i++) if(!_done[i]&&_dist[i]<best){best=_dist[i];u=i;}
    if(u<0||u===goal) break;
    _done[u]=1;
    const c=u%COLS, r=(u-c)/COLS;
    for(const d of [[0,1],[1,0],[-1,0],[0,-1]]){
      const nc=c+d[0], nr=r+d[1];
      if(!inBounds(nc,nr)) continue;
      const t=grid[nr][nc].t;
      if(t==='bedrock') continue;
      const nd=_dist[u]+(t==='earth'?10:1), ni=idx(nc,nr);
      if(nd<_dist[ni]){ _dist[ni]=nd; _prev[ni]=u; }
    }
  }
  if(_dist[goal]===Infinity) return null;
  let cur=goal, step=goal;
  while(_prev[cur]!==-1){ step=cur; cur=_prev[cur]; }
  if(cur!==s) return null;
  const c=step%COLS, r=(step-c)/COLS;
  return {col:c, row:r, tile:grid[r][c]};
}

/* ===================== 索敵・移動・撃破 ===================== */
function nearestHeroWithin(m, range){ let b=null,bd=999; for(const h of heroes){ const d=cheb(h,m); if(d<bd){bd=d;b=h;} } return (b&&bd<=range)?b:null; }
function lowestHeroInRange(m){
  let b=null;
  for(const h of heroes){
    if(cheb(h,m)>m.range) continue;
    if(m.range>1 && !hasLOS(m.col,m.row,h.col,h.row)) continue;
    if(!b || h.hp<b.hp) b=h;
  }
  return b;
}
function lowestMonsterInRange(h){
  let b=null;
  for(const m of monsters){
    if(cheb(m,h)>h.range) continue;
    if(h.range>1 && !hasLOS(h.col,h.row,m.col,m.row)) continue;
    if(!b || m.hp<b.hp) b=m;
  }
  return b;
}
function hasAdjacentMonster(h){
  for(const m of monsters) if(cheb(m,h)<=1) return true;
  return false;
}
function beginMove(e,col,row,duration){
  if(e.col===col && e.row===row) return;
  e.moveFromX=e.px===undefined?cx(e.col):e.px; e.moveFromY=e.py===undefined?cy(e.row):e.py;
  e.moveToX=cx(col); e.moveToY=cy(row); e.moveAnim=duration||MOVE_ANIM; e.moveMax=e.moveAnim;
  e.col=col; e.row=row;
}
function updateVisualPosition(e,dt){
  if(e.moveAnim>0){
    e.moveAnim=Math.max(0,e.moveAnim-dt);
    const p=clamp(1-e.moveAnim/(e.moveMax||MOVE_ANIM),0,1);
    const q=p<0.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
    e.px=e.moveFromX+(e.moveToX-e.moveFromX)*q; e.py=e.moveFromY+(e.moveToY-e.moveFromY)*q;
  } else {
    e.px=cx(e.col); e.py=cy(e.row);
  }
}
function moveToward(m,t){ const nb=openNeighbors(m.col,m.row); if(!nb.length)return; let b=nb[0],bd=cheb(b,t); for(const n of nb){const d=cheb(n,t); if(d<bd){bd=d;b=n;}} beginMove(m,b.col,b.row); }
// 視線判定：2マス間に壁（土・岩盤）があれば遮られる＝遠距離攻撃は壁を貫通しない
function hasLOS(c0,r0,c1,r1){
  let dx=Math.abs(c1-c0), dy=Math.abs(r1-r0), sx=c0<c1?1:-1, sy=r0<r1?1:-1, err=dx-dy, c=c0, r=r0;
  while(true){
    if(!(c===c0&&r===r0) && !(c===c1&&r===r1)){ if(!OPEN.has(grid[r][c].t)) return false; }
    if(c===c1 && r===r1) break;
    const e2=2*err;
    if(e2>-dy){ err-=dy; c+=sx; }
    if(e2<dx){ err+=dx; r+=sy; }
  }
  return true;
}
function wanderHome(m){
  if(m.homeCol!==undefined && cheb(m,{col:m.homeCol,row:m.homeRow})>3){
    moveToward(m,{col:m.homeCol,row:m.homeRow});
    return;
  }
  const nb=openNeighbors(m.col,m.row).filter(n=>m.homeCol===undefined || cheb(n,{col:m.homeCol,row:m.homeRow})<=3);
  if(nb.length && Math.random()<0.82){ const n=nb[ri(0,nb.length-1)]; beginMove(m,n.col,n.row); }
}
function wander(m){ wanderHome(m); }
function killMonster(m){
  const i=monsters.indexOf(m); if(i>=0) monsters.splice(i,1);
  effects.push({type:'puff', x:m.px, y:m.py, life:300, max:300, color:'#5fd16b'});
}
function killHero(h){
  const i=heroes.indexOf(h); if(i>=0) heroes.splice(i,1);
  const reward=Math.round(4+h.wave);
  nutrients+=reward; score+=80*h.wave+20; kills++;
  popDmg(h.px, h.py, '+'+reward, '#ffcf4d');
  effects.push({type:'puff', x:h.px, y:h.py, life:340, max:340, color:'#cfd8e3'});
}

/* ===================== 出現補助 ===================== */
// 開いた通路のどこかに、指定種の魔物を1体出す（新種解禁の演出などに使用）
function spawnInTunnel(kind){
  const cand=[];
  for(let r=1;r<ROWS-1;r++) for(let c=1;c<COLS-1;c++) if(grid[r][c].t==='tunnel') cand.push([c,r]);
  if(!cand.length) return false;
  const p=cand[ri(0,cand.length-1)];
  spawnMonster(kind, p[0], p[1]);
  const mo=monsters[monsters.length-1];
  if(mo){ mo.bornAnim=BORN_ANIM; effects.push({type:'birth', x:cx(p[0]), y:cy(p[1]), life:380, max:380, color:KINDS[kind].col}); }
  return true;
}

/* ===================== 更新 ===================== */
function update(dt){
  // ウェーブ管理
  waveCountdown-=dt;
  if(spawnQueue.length===0 && waveCountdown<=0) startWave();
  for(let i=spawnQueue.length-1;i>=0;i--){
    spawnQueue[i].delay-=dt;
    if(spawnQueue[i].delay<=0){
      if(heroes.length<MAX_HEROES){ spawnHero(); spawnQueue.splice(i,1); }
      else spawnQueue[i].delay=800;   // 満員なら少し待って再挑戦
    }
  }

  // 鉱脈の熟成：放っておくと低確率で上位種鉱脈になる
  for(let r=1;r<ROWS-1;r++) for(let c=1;c<COLS-1;c++){
    const t=grid[r][c];
    if(t.t!=='earth' || !t.sub || t.evoChecked) continue;
    t.age=(t.age||0)+dt;
    if(t.age>=EVO_TIME){
      t.evoChecked=true;
      if(Math.random()<VEIN[t.sub].evoChance){
        t.evo=true;
        effects.push({type:'evolveVein', x:cx(c), y:cy(r), life:760, max:760, color:VEIN[t.sub].color});
        toast(c,r,VEIN[t.sub].evoName,'#ffe08a');
      }
    }
  }

  updateEggs(dt);
  updateEliteEggBreeding(dt);

  // 魔物の自然増殖（種類ごとの間隔。弱い魔物ほど速く、強い魔物は増えない）
  for(const m of monsters){
    const K=KINDS[m.kind];
    if(!K.breedEvery || m.breedLeft<=0) continue;   // 増えない種・繁殖回数を使い切った個体は飛ばす
    m.breedCd-=dt;
    if(m.breedCd>0) continue;
    if(monsters.length+eggs.length>=MONSTER_CAP){ m.breedCd=K.breedEvery*0.5; continue; }
    let local=0; for(const o of monsters) if(o.kind===m.kind && cheb(o,m)<=1) local++;
    if(local>=(K.breedCap||2)){ m.breedCd=K.breedEvery*0.6; continue; }   // 混みすぎなら待つ
    const nb=openNeighbors(m.col,m.row);
    if(!nb.length){ m.breedCd=K.breedEvery*0.5; continue; }
    const d=nb[ri(0,nb.length-1)];
    spawnMonster(m.kind, d.col, d.row);             // 子も同じ上限で増やせる（不妊にはしない）
    const child=monsters[monsters.length-1];
    if(child) child.bornAnim=BORN_ANIM;
    effects.push({type:'birth', x:cx(d.col), y:cy(d.row), life:380, max:380, color:K.col});
    m.breedLeft--;                                  // 親の繁殖回数を1消費（1個体あたり最大 BREED_LIMIT 体）
    m.breedCd=K.breedEvery*rnd(0.9,1.3);
  }

  // 栄養生産：常時わずかに湧く分＋収入持ち魔物の逓減生産（掘削が枯渇で止まらないように）
  nutrients+=monsterIncomeRate()*(dt/1000);

  // 魔物（味方）
  for(const m of monsters){
    const K=KINDS[m.kind];
    m.atkCd-=dt; m.moveCd-=dt; m.eatCd-=dt;

    const heroTarget=lowestHeroInRange(m);
    if(heroTarget){
      if(m.atkCd<=0){
        const tgt=heroTarget;
        tgt.hp-=m.atk; popDmg(tgt.px, tgt.py, '-'+m.atk, m.kind==='spitter'?'#b6ff7a':'#ff8a8a');
        m.atkCd=K.atkCd; m.atkAnim=ATK_ANIM; m.atkTX=tgt.px; m.atkTY=tgt.py;
        if(m.range>=2) shoot(m.px, m.py-4, tgt.px, tgt.py, '#9bff5a'); else slash(tgt.px, tgt.py, '#ffd0d0');
        if(tgt.hp<=0) killHero(tgt);
      }
      continue; // 交戦中は動かない
    }

    const aggroHero=nearestHeroWithin(m, K.aggro);
    if(!aggroHero && m.eatCd<=0){
      m.eatCd=EAT_CHECK*rnd(0.85,1.25);
      if(tryEatLower(m)) continue;
    }

    if(m.moveCd<=0){
      if(aggroHero) moveToward(m, aggroHero);
      else wanderHome(m);
      m.moveCd=K.moveCd+rnd(-80,120);
    }
  }

  // 勇者
  for(const h of heroes){
    const C=HERO_CLASSES[h.cls];
    h.atkCd-=dt; h.actCd-=dt; h.coreCd-=dt; h.healCd-=dt;

    // 僧侶：周囲の勇者を回復（移動や交戦に関係なく発動）
    if(C.heal && h.healCd<=0){
      const amt=Math.round(6+h.wave*1.5); let did=false;
      for(const o of heroes){ if(o.hp<o.maxHp && cheb(o,h)<=C.healRange){ o.hp=Math.min(o.maxHp,o.hp+amt); slash(o.px,o.py-2,'#9effa0'); popDmg(o.px,o.py-10,'+'+amt,'#9effa0'); did=true; } }
      h.healCd = did ? C.healCd : 300;
      if(did) h.atkAnim=ATK_ANIM;
    }

    // 攻撃（間合い内の魔物を狙う。間合いは職業で異なる）
    const monsterTarget=lowestMonsterInRange(h);
    if(monsterTarget && h.atkCd<=0){
      const tgt=monsterTarget;
      tgt.hp-=h.atk; popDmg(tgt.px,tgt.py,'-'+h.atk,'#fff');
      h.atkCd=C.atkCd; h.atkAnim=ATK_ANIM; h.atkTX=tgt.px; h.atkTY=tgt.py;
      if(h.range>=2) shoot(h.px, h.py-6, tgt.px, tgt.py, '#b6a6ff'); else slash(tgt.px, tgt.py, '#ffffff');
      if(tgt.hp<=0) killMonster(tgt);
    }

    // 物理ブロック：隣接(1)に魔物がいる限り前進不可（近接の魔物は壁になる）
    if(hasAdjacentMonster(h)){
      h.blockedMs+=dt;
      if(h.blockedMs>4500){
        const step=heroStep(h);
        if(step && step.tile.t!=='earth'){ beginMove(h,step.col,step.row); h.actCd=h.moveCd; }
        h.blockedMs=0;
      }
      continue;
    }
    h.blockedMs=0;

    // コア攻撃（コアマス到達時のみ）
    if(h.col===CORE_COL && h.row===CORE_ROW){
      if(h.coreCd<=0){ coreHP-=h.atk; popDmg(cx(CORE_COL),cy(CORE_ROW)-10,'-'+h.atk,'#e0556b');
        effects.push({type:'corehit', x:cx(CORE_COL), y:cy(CORE_ROW), life:260, max:260});
        h.coreCd=1100; h.atkAnim=ATK_ANIM; h.atkTX=cx(CORE_COL); h.atkTY=cy(CORE_ROW); }
      continue;
    }

    // 移動 or 壁掘り（一撃禁止：攻撃力に応じて複数回叩く）
    if(h.actCd<=0){
      const step=heroStep(h);
      if(step){
        if(step.tile.t==='earth'){
          step.tile.dig=(step.tile.dig||0)+heroDigDmg(h.atk);
          effects.push({type:'dig', x:cx(step.col), y:cy(step.row), life:300, max:300, hero:true});
          h.actCd=DIG_CD; h.atkAnim=ATK_ANIM; h.atkTX=cx(step.col); h.atkTY=cy(step.row);
          if(step.tile.dig>=DIG_BREAK){
            step.tile.t='tunnel'; step.tile.sub=null; step.tile.dig=0;
          }
        } else { beginMove(h,step.col,step.row); h.actCd=h.moveCd; }
      } else h.actCd=400;
    }
  }

  // 描画位置の補間＋攻撃／出現アクションの進行
  for(const m of monsters){ updateVisualPosition(m,dt); if(m.atkAnim>0) m.atkAnim-=dt; if(m.bornAnim>0) m.bornAnim-=dt; }
  for(const h of heroes){ updateVisualPosition(h,dt); if(h.atkAnim>0) h.atkAnim-=dt; }

  // エフェクト寿命
  for(let i=effects.length-1;i>=0;i--){ const f=effects[i]; f.life-=dt; if(f.type==='float') f.y+=f.vy*dt; if(f.life<=0) effects.splice(i,1); }
  if(effects.length>EFFECT_CAP) effects.splice(0,effects.length-EFFECT_CAP);

  if(coreHP<=0){ coreHP=0; gameOver(); }
}

/* ===================== 描画 ===================== */
function px(x,y,w,h,col){ ctx.fillStyle=col; ctx.fillRect(x,y,w,h); }
function bob(e,time){ return Math.sin(time*4+e.bob)*1.3; }
function lunge(e){
  if(!e.atkAnim || e.atkAnim<=0) return {x:0,y:0};
  const p=e.atkAnim/ATK_ANIM, j=Math.sin(p*Math.PI)*LUNGE;       // 0→踏み込み→0
  const dx=(e.atkTX-e.px), dy=(e.atkTY-e.py), d=Math.hypot(dx,dy)||1;
  return {x:dx/d*j, y:dy/d*j};
}

function draw(){
  const time=performance.now()/1000;
  ctx.clearRect(0,0,W,H);
  px(0,0,W,H,'#120c1a');

  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const t=grid[r][c], x=c*TILE, y=r*TILE;
    if(t.t==='bedrock') drawBedrock(x,y,c,r);
    else if(t.t==='earth') drawEarth(x,y,t,c,r,time);
    else if(t.t==='surface') drawSurface(x,y);
    else { drawTunnel(x,y,t,c,r,time); }
  }

  drawCore(cx(CORE_COL), cy(CORE_ROW), time);
  for(const e of eggs) drawEgg(e,time);

  const ents=[];
  for(const m of monsters) ents.push({z:m.row, k:'m', e:m});
  for(const h of heroes) ents.push({z:h.row+0.5, k:'h', e:h});
  ents.sort((a,b)=>a.z-b.z);
  for(const o of ents){ if(o.k==='m') drawMonster(o.e,time); else drawHero(o.e,time); }

  for(const f of effects) drawEffect(f);
  drawWaveTimer(time);
}

// 入口の上に「次の勇者／次の襲来まで」を常時表示
function drawWaveTimer(time){
  let secs;
  if(spawnQueue.length>0){ let nx=Infinity; for(const s of spawnQueue) if(s.delay<nx) nx=s.delay; secs=Math.max(0,Math.ceil(nx/1000)); }
  else { secs=Math.max(0,Math.ceil(waveCountdown/1000)); }
  const urgent = secs<=3;
  const bg = urgent ? 'rgba(150,28,40,0.92)' : 'rgba(18,10,24,0.85)';
  const accent = urgent ? '#ff6b7e' : '#ffb84d';
  const fg = urgent ? '#ffd0d6' : '#ffd98a';
  const bx=cx(ENTRANCE_COL), by=13, txt='▼ '+secs+'s';
  ctx.font='bold 11px DotGothic16, monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=Math.ceil(ctx.measureText(txt).width)+12;
  ctx.globalAlpha=0.9; px(bx-w/2, by-8, w, 16, bg);
  px(bx-w/2, by-8, w, 2, accent); ctx.globalAlpha=1;
  ctx.fillStyle=fg; ctx.fillText(txt, bx, by);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}

function drawBedrock(x,y,c,r){
  px(x,y,TILE,TILE,'#15101c');
  const s=(c*7+r*13)%5;
  px(x+4+s,y+6,3,3,'#221a2e'); px(x+TILE-9-s,y+TILE-10,3,3,'#221a2e'); px(x,y,TILE,1,'#0c0814');
}
function drawDiamond(cx0,cy0,s){ ctx.beginPath(); ctx.moveTo(cx0,cy0-s); ctx.lineTo(cx0+s,cy0); ctx.lineTo(cx0,cy0+s); ctx.lineTo(cx0-s,cy0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
function drawStar(cx0,cy0,rOut,rot){ const rIn=rOut*0.45; ctx.beginPath(); for(let i=0;i<10;i++){ const ang=rot+i*Math.PI/5-Math.PI/2, rr=(i%2===0)?rOut:rIn; const px0=cx0+Math.cos(ang)*rr, py0=cy0+Math.sin(ang)*rr; i?ctx.lineTo(px0,py0):ctx.moveTo(px0,py0); } ctx.closePath(); ctx.fill(); }
// 鉱脈の種類ごとに違う模様を描く（色だけでなく形でも見分けられるように）
function veinMotif(x,y,type,time){
  const v=VEIN[type], col=v.color, lc=v.core, cx0=x+TILE/2, cy0=y+TILE/2;
  if(type==='moss'){               // 苔粒（丸の集まり）
    ctx.fillStyle=col; for(const p of [[-6,-4],[3,-6],[-2,4],[7,2],[-8,3]]){ ctx.beginPath(); ctx.arc(cx0+p[0],cy0+p[1],2.4,0,6.28); ctx.fill(); }
    ctx.fillStyle=lc; ctx.beginPath(); ctx.arc(cx0,cy0,2,0,6.28); ctx.fill();
  } else if(type==='meat'){        // 牙・鉤爪（鋭い V）
    ctx.strokeStyle=col; ctx.lineWidth=2;
    for(const o of [-7,0,7]){ ctx.beginPath(); ctx.moveTo(cx0+o-3,cy0-6); ctx.lineTo(cx0+o,cy0+6); ctx.lineTo(cx0+o+3,cy0-6); ctx.stroke(); }
  } else if(type==='venom'){       // 毒の雫＋泡（大小の丸）
    ctx.fillStyle=col; for(const p of [[-5,-3],[4,-5],[0,4]]){ ctx.beginPath(); ctx.arc(cx0+p[0],cy0+p[1],3,0,6.28); ctx.fill(); }
    ctx.fillStyle=lc; for(const p of [[7,1],[-7,4],[2,-7]]){ ctx.beginPath(); ctx.arc(cx0+p[0],cy0+p[1],1.4,0,6.28); ctx.fill(); }
  } else if(type==='stone'){       // 結晶・立方（幾何形）
    ctx.fillStyle=col; ctx.strokeStyle=lc; ctx.lineWidth=1;
    drawDiamond(cx0-4,cy0-1,5); drawDiamond(cx0+5,cy0+2,4); drawDiamond(cx0+1,cy0-6,3);
  } else if(type==='ember'){       // 炎・上向きの三角（尖り）
    const fl=Math.sin(time*8)*1.2; ctx.fillStyle=col;
    for(const o of [-6,1,7]){ ctx.beginPath(); ctx.moveTo(cx0+o-3,cy0+5); ctx.lineTo(cx0+o+fl,cy0-6); ctx.lineTo(cx0+o+3,cy0+5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle=lc; ctx.beginPath(); ctx.moveTo(cx0-2,cy0+4); ctx.lineTo(cx0,cy0-3); ctx.lineTo(cx0+2,cy0+4); ctx.closePath(); ctx.fill();
  }
}
function drawEarth(x,y,t,c,r,time){
  px(x,y,TILE,TILE,lerpHex('#5c3d24','#75512f',t.shade));
  px(x,y,TILE,2,'rgba(255,255,255,0.05)'); px(x,y+TILE-2,TILE,2,'rgba(0,0,0,0.28)');
  const s=(c*13+r*7);
  px(x+4+(s%6), y+8+(s%5), 3,3,'rgba(0,0,0,0.18)');
  px(x+TILE-10-(s%5), y+TILE-12+(s%3), 4,4,'rgba(0,0,0,0.14)');
  if(t.sub){
    if(t.evo){
      // 上位鉱脈：同じ模様を明るく鮮やかに光らせて「熟した」と分かるように（色だけで表現）
      const pulse=0.5+0.5*Math.sin(time*5+(c+r));
      ctx.filter='brightness(1.65) saturate(1.5)';
      ctx.globalAlpha=0.72+0.24*pulse; veinMotif(x,y,t.sub,time);
      ctx.globalAlpha=1; ctx.filter='none';
    } else {
      const a=0.55+0.25*Math.sin(time*3+(c+r));
      ctx.globalAlpha=a; veinMotif(x,y,t.sub,time); ctx.globalAlpha=1;
    }
  }
  if(t.dig){                       // 勇者が掘りかけの土はヒビが入る
    const f=clamp(t.dig/DIG_BREAK,0,1);
    ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x+6,y+4); ctx.lineTo(x+12,y+14); ctx.lineTo(x+9,y+24); ctx.stroke();
    if(f>0.5){ ctx.beginPath(); ctx.moveTo(x+TILE-6,y+6); ctx.lineTo(x+TILE-14,y+16); ctx.lineTo(x+TILE-10,y+26); ctx.stroke(); }
  }
}
function drawSurface(x,y){
  px(x,y,TILE,TILE,'#15101c'); px(x+2,y,TILE-4,TILE,'#241a2b');
  px(x+4,y,TILE-8,6,'#3a2c52'); px(x+TILE/2-1,y+6,2,TILE-6,'#0c0814');
}
function drawTunnel(x,y,t,c,r,time){
  // 毎フレームのグラデーション生成は重いので、矩形だけで陰影を表現
  px(x,y,TILE,TILE,'#241a2b');
  px(x,y,TILE,3,'#1a1226');                                  // 上の影
  px(x,y+TILE-3,TILE,3,'#1a1226');                           // 床
  px(x,y,2,TILE,'rgba(0,0,0,0.22)'); px(x+TILE-2,y,2,TILE,'rgba(0,0,0,0.22)'); // 左右の暗がり
  px(x+4,y+4,TILE-8,2,'rgba(60,44,82,0.22)');                // ほのかな反射
}
function drawCore(cx0,cy0,time){
  const hp=coreHP/CORE_MAX, pulse=0.5+0.5*Math.sin(time*3);
  px(cx0-12,cy0+8,24,4,'#1a1226');
  ctx.save(); ctx.translate(cx0,cy0); ctx.rotate(Math.PI/4); const sz=11;
  px(-sz,-sz,sz*2,sz*2,'#2a1538'); px(-sz,-sz,sz*2,3,'#3d1d54'); px(-sz,sz-3,sz*2,3,'#160a22'); ctx.restore();
  const glow=ctx.createRadialGradient(cx0,cy0,1,cx0,cy0,12+4*pulse);
  glow.addColorStop(0, hp>0.3?'#b026ff':'#ff3b6b'); glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=0.55+0.25*pulse; ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(cx0,cy0,14,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  px(cx0-4,cy0-2,8,5,'#f3e6ff'); px(cx0-1,cy0-1,3,3, hp>0.3?'#b026ff':'#ff3b6b');
}

/* ── 魔物スプライト ── */
function drawBaseSprite(kind,x,y,time){
  switch(kind){
    case 'slime':   drawSlime(x,y); break;
    case 'carniv':  drawCarniv(x,y); break;
    case 'evolved': drawEvolved(x,y); break;
    case 'spitter': drawSpitter(x,y,time); break;
    case 'golem':   drawGolem(x,y); break;
    case 'flame':   drawFlame(x,y,time); break;
    default:        drawSlime(x,y);
  }
}
function drawMonster(m,time){
  const K=KINDS[m.kind];
  const L=lunge(m); const x=m.px+L.x, y=m.py+bob(m,time)+L.y;
  let bw=16, by=y-12;
  const s = (m.bornAnim>0) ? (0.4+0.6*clamp(1-m.bornAnim/BORN_ANIM,0,1)) : 1;  // 出現・増殖のスケールイン
  const scaled = s!==1;
  if(scaled){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.translate(-x,-y); }
  if(K.eliteOf){
    // 進化種：元スプライトを「色だけ変えて」描く（形・大きさは元のまま）
    ctx.filter=K.tint||'none'; drawBaseSprite(K.eliteOf,x,y,time); ctx.filter='none';
    if(K.eliteOf==='golem'){ bw=22; by=y-13; } else if(K.eliteOf==='flame'){ bw=20; by=y-18; } else if(K.eliteOf==='spitter'){ by=y-11; }
  } else {
    switch(m.kind){
      case 'slime':   drawSlime(x,y); break;
      case 'carniv':  drawCarniv(x,y); break;
      case 'evolved': drawEvolved(x,y); bw=20; by=y-13; break;
      case 'spitter': drawSpitter(x,y,time); by=y-11; break;
      case 'golem':   drawGolem(x,y); bw=22; by=y-13; break;
      case 'flame':   drawFlame(x,y,time); bw=20; by=y-18; break;
    }
  }
  if(scaled){ ctx.restore(); }
  drawHpBar(x, by, bw, m.hp, m.maxHp, '#7bd96b');
}
function drawEgg(e,time){
  const K=KINDS[e.kind], x=cx(e.col), y=cy(e.row), pulse=0.5+0.5*Math.sin(time*5+e.col);
  const s=(e.bornAnim>0)?(0.55+0.45*clamp(1-e.bornAnim/BORN_ANIM,0,1)):1;
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.translate(-x,-y);
  px(x-7,y+5,14,3,'#1a1226');
  ctx.globalAlpha=0.92; ctx.fillStyle=K.col; ctx.beginPath(); ctx.ellipse(x,y,6,8,0,0,6.28); ctx.fill();
  ctx.globalAlpha=0.35+0.25*pulse; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(x-2,y-3,2,3,0,0,6.28); ctx.fill();
  ctx.globalAlpha=1; ctx.strokeStyle='#120c1a'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y,6,8,0,0,6.28); ctx.stroke();
  ctx.restore();
  const p=clamp(1-e.hatchCd/EGG_HATCH,0,1);
  px(x-7,y-12,14,2,'#2a1538'); px(x-7,y-12,Math.round(14*p),2,K.col);
}
function drawSlime(x,y){
  px(x-8,y+3,16,5,'#3fae4b'); px(x-7,y-2,14,6,'#5fd16b'); px(x-5,y-6,10,5,'#5fd16b'); px(x-4,y-5,8,3,'#8be88f');
  px(x-4,y-1,3,3,'#10240f'); px(x+1,y-1,3,3,'#10240f'); px(x-3,y-1,1,1,'#fff'); px(x+2,y-1,1,1,'#fff');
}
function drawCarniv(x,y){
  px(x-9,y+4,18,4,'#7a3318'); px(x-9,y-3,18,8,'#e06b3a'); px(x-9,y-3,18,3,'#b34a22');
  px(x-9,y+5,4,4,'#7a3318'); px(x+5,y+5,4,4,'#7a3318');
  px(x-6,y+4,2,3,'#fff'); px(x-1,y+4,2,3,'#fff'); px(x+4,y+4,2,3,'#fff');
  px(x-6,y-1,3,3,'#3a0d0d'); px(x+3,y-1,3,3,'#3a0d0d'); px(x-6,y-1,1,1,'#ff5b5b'); px(x+3,y-1,1,1,'#ff5b5b');
}
function drawEvolved(x,y){
  px(x-11,y+5,22,4,'#3a1020'); px(x-11,y-4,22,10,'#9b2f4f'); px(x-11,y-4,22,3,'#6e1f38');
  px(x-11,y-9,3,6,'#2a0f1c'); px(x+8,y-9,3,6,'#2a0f1c'); px(x-11,y+6,5,5,'#3a1020'); px(x+6,y+6,5,5,'#3a1020');
  px(x-7,y+5,3,4,'#fff'); px(x+4,y+5,3,4,'#fff'); px(x-1,y+6,2,3,'#fff');
  px(x-7,y-1,3,3,'#ffcf4d'); px(x+4,y-1,3,3,'#ffcf4d');
}
function drawSpitter(x,y,time){
  const drip=Math.sin(time*8+x)>0;
  px(x-7,y+3,14,5,'#5a2f7a'); px(x-7,y-2,13,6,'#7a3aa6'); px(x-5,y-1,10,3,'#a64dff');
  px(x+5,y-1,5,3,'#a64dff');                 // 口先
  px(x-5,y+5,3,3,'#3a1f52'); px(x+2,y+5,3,3,'#3a1f52');
  px(x-3,y-1,2,2,'#dfffe0'); px(x+1,y-1,2,2,'#dfffe0');
  if(drip) px(x+9,y+1,2,2,'#9bff9b');         // 毒
}
function drawGolem(x,y){
  px(x-10,y-6,20,14,'#4f5e85'); px(x-10,y-6,20,3,'#6f86c4'); px(x-10,y+5,20,3,'#2e3a59');
  px(x-13,y-2,4,8,'#4f5e85'); px(x+9,y-2,4,8,'#4f5e85');     // 腕
  px(x-1,y-4,2,9,'#2e3a59'); px(x-6,y,5,2,'#2e3a59'); px(x+2,y+1,4,2,'#2e3a59'); // 亀裂
  px(x-4,y-2,3,3,'#9bd0ff'); px(x+1,y-2,3,3,'#9bd0ff'); // 眼
}
function drawFlame(x,y,time){
  const fj=Math.round(Math.sin(time*12)*1.5);
  px(x-7,y-2,14,9,'#3a1020'); px(x-7,y+5,14,3,'#1a0810');
  px(x-7,y-7,3,5,'#2a0f1c'); px(x+4,y-7,3,5,'#2a0f1c');     // 角
  px(x-5+fj,y-11,3,5,'#ff8a3a'); px(x-1,y-13,3,6,'#ffcf4d'); px(x+3-fj,y-11,3,5,'#ff8a3a'); // 炎冠
  px(x-4,y-1,3,3,'#ffcf4d'); px(x+1,y-1,3,3,'#ffcf4d'); px(x-3,y+3,6,2,'#ff5b2a'); // 眼・口
}

function drawHero(h,time){
  const L=lunge(h); const x=h.px+L.x, y=h.py+bob(h,time)+L.y;
  // ウェーブで装備の格が上がる色味（戦士・盾兵向け）
  let steel='#c3cdd9';
  if(h.wave>=8) steel=lerpHex('#ffd34d','#e0556b', clamp((h.wave-8)/6,0,1));
  else if(h.wave>=4) steel=lerpHex('#c3cdd9','#ffd34d', clamp((h.wave-4)/4,0,1));
  switch(h.cls){
    case 'tank':   drawTank(x,y); break;
    case 'mage':   drawMage(x,y,time); break;
    case 'priest': drawPriest(x,y,time); break;
    default:       drawWarrior(x,y,steel);
  }
  drawHpBar(x, y-19, h.cls==='tank'?20:16, h.hp, h.maxHp, '#ffd34d');
}
function drawWarrior(x,y,armor){
  const dark='#5a6475';
  px(x+8,y-7,2,12,'#dfe6ef'); px(x+7,y+5,4,2,'#8a5e16');     // 剣
  px(x-11,y-3,4,9,'#8a5e16'); px(x-10,y-2,2,7,armor);        // 盾
  px(x-4,y+5,3,5,dark); px(x+1,y+5,3,5,dark);                // 脚
  px(x-5,y-4,10,9,armor); px(x-5,y-4,10,2,'#fff7'); px(x-5,y+3,10,2,'rgba(0,0,0,.25)'); // 胴
  px(x-4,y-11,8,7,armor); px(x-4,y-11,8,2,'#fff7'); px(x-3,y-8,6,2,'#1a2230');          // 兜
  px(x-1,y-15,2,4,'#e0556b');                                 // 前立て
}
function drawTank(x,y){
  const iron='#7a8290', dk='#3f4651';
  px(x-6,y+5,4,5,dk); px(x+2,y+5,4,5,dk);                     // 太い脚
  px(x-8,y-5,16,11,iron); px(x-8,y-5,16,2,'#aab2bd'); px(x-8,y+4,16,2,'rgba(0,0,0,.3)'); // 厚い胴
  px(x-6,y-12,12,8,iron); px(x-6,y-12,12,2,'#aab2bd'); px(x-4,y-8,8,2,'#11161d');        // 大兜
  px(x-14,y-7,6,16,'#566070'); px(x-14,y-7,6,2,'#8a93a0'); px(x-12,y-2,2,6,'#cfd6df');   // 大盾
  px(x+8,y-1,3,8,'#3f4651');                                  // 鈍器
}
function drawMage(x,y,time){
  const robe='#6a5acd', robe2='#4b3fa0', glow=0.5+0.5*Math.sin(time*5);
  px(x-5,y+1,10,9,robe); px(x-5,y+8,10,2,robe2); px(x-5,y+1,10,2,'#8979e0'); // ローブ
  px(x-3,y-6,6,7,robe);                                       // 上半身
  px(x-5,y-9,10,3,robe2); px(x-3,y-13,6,4,robe2); px(x-1,y-16,2,3,robe2);    // とんがり帽子
  px(x-1,y-2,2,2,'#cfc6ff');                                  // 顔の覗き
  px(x+7,y-8,2,16,'#6b4a2f');                                 // 杖
  ctx.globalAlpha=0.6*glow+0.35; ctx.fillStyle='#b6a6ff';
  ctx.beginPath(); ctx.arc(x+8,y-9,3.6,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  px(x+7,y-10,2,2,'#fff');                                    // 宝珠の芯
}
function drawPriest(x,y,time){
  const robe='#ede6d0', gold='#e8c860', halo=0.5+0.5*Math.sin(time*4);
  px(x-5,y+1,10,9,robe); px(x-5,y+8,10,2,'#c9c0a6'); px(x-5,y+1,10,2,gold);  // ローブ＋金縁
  px(x-3,y-6,6,7,robe);                                       // 上半身
  px(x-4,y-12,8,7,robe); px(x-3,y-8,6,2,'#9a917a');            // 頭巾
  ctx.globalAlpha=0.4+0.4*halo; ctx.strokeStyle='#fff0a8'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y-13,5,Math.PI,0); ctx.stroke(); ctx.globalAlpha=1; // 光輪
  px(x+7,y-8,2,16,'#cbb78a'); px(x+5,y-8,6,2,gold); px(x+7,y-11,2,6,gold);    // 杖＋十字
}

function drawHpBar(cx0, topY, w, hp, maxHp, col){
  if(hp>=maxHp) return;
  const ratio=clamp(hp/maxHp,0,1);
  px(cx0-w/2-1, topY-1, w+2, 4, '#000'); px(cx0-w/2, topY, w, 2, '#3a1020');
  px(cx0-w/2, topY, Math.round(w*ratio), 2, ratio>0.3?col:'#e0556b');
}

function drawEffect(f){
  const k=f.life/f.max;
  if(f.type==='dig'){
    ctx.globalAlpha=k; ctx.strokeStyle=f.hero?'#ff8a8a':'#ffe1a8'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(f.x,f.y,(1-k)*16+2,0,6.28); ctx.stroke(); ctx.globalAlpha=1;
  } else if(f.type==='float'){
    ctx.globalAlpha=clamp(k*1.4,0,1); ctx.fillStyle=f.color; ctx.font='11px DotGothic16, monospace';
    ctx.textAlign='center'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha=1; ctx.textAlign='left';
  } else if(f.type==='puff'){
    ctx.globalAlpha=k*0.8; ctx.fillStyle=f.color; ctx.beginPath(); ctx.arc(f.x,f.y,(1-k)*10+2,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  } else if(f.type==='corehit'){
    ctx.globalAlpha=k*0.7; ctx.strokeStyle='#ff3b6b'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(f.x,f.y,(1-k)*20+6,0,6.28); ctx.stroke(); ctx.globalAlpha=1;
  } else if(f.type==='grow' || f.type==='birth'){
    // 出現・増殖：色付きの輪が広がり、粒が弾ける
    const a=clamp(k*1.2,0,1);
    ctx.globalAlpha=a; ctx.strokeStyle=f.color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(f.x,f.y,(1-k)*12+3,0,6.28); ctx.stroke();
    ctx.globalAlpha=a*0.85; ctx.fillStyle=f.color; const s=(1-k)*5;
    ctx.fillRect(f.x-1,f.y-1-s,2,2); ctx.fillRect(f.x-1+s,f.y-1,2,2); ctx.fillRect(f.x-1-s,f.y-1,2,2); ctx.fillRect(f.x-1,f.y-1+s,2,2);
    ctx.globalAlpha=1;
  } else if(f.type==='evolveVein'){
    // 鉱脈熟成：色付きの輪＋回転する星のきらめき
    const a=clamp(k*1.3,0,1);
    ctx.globalAlpha=a; ctx.strokeStyle=f.color; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(f.x,f.y,(1-k)*18+4,0,6.28); ctx.stroke();
    ctx.globalAlpha=a; ctx.fillStyle=f.color;
    drawStar(f.x, f.y, 4+(1-k)*4, (1-k)*4);
    ctx.globalAlpha=1;
  } else if(f.type==='slash'){
    const a=clamp(k*1.3,0,1), len=10*(1.2-k);
    ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot);
    ctx.globalAlpha=a; ctx.strokeStyle=f.color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-len,-len*0.4); ctx.lineTo(len,len*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-len,len*0.4); ctx.lineTo(len,-len*0.4); ctx.stroke();
    ctx.restore(); ctx.globalAlpha=1;
  } else if(f.type==='shot'){
    const p=1-k, X=f.sx+(f.tx-f.sx)*p, Y=f.sy+(f.ty-f.sy)*p;
    ctx.globalAlpha=clamp(k*1.4,0,1); ctx.fillStyle=f.color;
    ctx.beginPath(); ctx.arc(X,Y,3,0,6.28); ctx.fill();
    const q=Math.max(0,p-0.14);
    ctx.globalAlpha=0.4*k; ctx.beginPath(); ctx.arc(f.sx+(f.tx-f.sx)*q, f.sy+(f.ty-f.sy)*q, 2, 0, 6.28); ctx.fill();
    ctx.globalAlpha=1;
  } else if(f.type==='banner'){
    let a=1; if(k>0.85) a=(1-k)/0.15; else if(k<0.18) a=k/0.18; a=clamp(a,0,1);
    const yy=Math.round(H*0.30)+(f.slot||0)*34;
    ctx.globalAlpha=a*0.82; px(0,yy-15,W,30,'#140a1c');
    ctx.globalAlpha=a; px(0,yy-15,W,2,'#ffb84d'); px(0,yy+13,W,2,'#ffb84d');
    ctx.fillStyle='#ffd98a'; ctx.font='12px DotGothic16, monospace'; ctx.textAlign='center';
    ctx.fillText(f.text, W/2, yy+4); ctx.globalAlpha=1; ctx.textAlign='left';
  }
}

/* ===================== 凡例 ===================== */
function renderLegend(){
  let html='';
  for(const key of ['moss','meat','venom','stone','ember']){
    const v=VEIN[key], open=unlocked.has(key);
    html+='<span style="'+(open?'':'opacity:.4')+'"><i class="sw" style="background:'+v.color+'"></i>'+v.legend+(open?'':' <em>W'+v.unlock+'</em>')+'</span>';
  }
  html+='<span><i class="sw" style="background:var(--magic)"></i>魔王コア</span>';
  el.legend.innerHTML=html;
}

/* ===================== HUD ===================== */
function updateHUD(){
  const ratio=clamp(coreHP/CORE_MAX,0,1);
  el.coreFill.style.width=(ratio*100)+'%';
  el.coreFill.style.background = ratio>0.5 ? 'linear-gradient(90deg,#7bd96b,#4fae3b)'
    : ratio>0.25 ? 'linear-gradient(90deg,#ffcf4d,#e0a52f)' : 'linear-gradient(90deg,#ff6b6b,#c0303a)';
  el.coreNum.textContent=Math.ceil(coreHP)+' / '+CORE_MAX;
  el.nutNum.textContent=Math.floor(nutrients);
  el.waveNum.textContent=wave; el.monNum.textContent=monsters.length; el.scoreNum.textContent=score;
  if(spawnQueue.length>0){
    let nx=Infinity; for(const s of spawnQueue) if(s.delay<nx) nx=s.delay;
    el.waveLabel.textContent='次の勇者まで'; el.waveTimer.textContent=Math.max(0,Math.ceil(nx/1000))+' 秒'; el.tauntBtn.disabled=true;
  }
  else { el.waveLabel.textContent='次の襲来まで'; el.waveTimer.textContent=Math.max(0,Math.ceil(waveCountdown/1000))+' 秒'; el.tauntBtn.disabled=(waveCountdown<=3000); }
}

/* ===================== ループ ===================== */
let last=performance.now();
function frame(now){
  let dt=now-last; last=now; if(dt>60) dt=60;
  try{
    if(gameState==='playing') update(dt);
    draw(); updateHUD();
  }catch(err){
    console.error('frame error:', err);  // 1フレームの不具合でループ全体を止めない
  }
  requestAnimationFrame(frame);
}

/* ===================== ゲーム制御 ===================== */
function resetGame(){
  buildGrid();
  monsters=[]; heroes=[]; eggs=[]; effects=[]; spawnQueue=[];
  nutrients=START_NUT; coreHP=CORE_MAX; wave=0; score=0; kills=0; waveCountdown=FIRST_GRACE; idc=0;
  unlocked=new Set();
  for(const key in VEIN) if(VEIN[key].unlock<=1) unlocked.add(key);
  renderLegend();
}
function startGame(){ resetGame(); gameState='playing'; el.startOverlay.classList.add('hidden'); el.deadOverlay.classList.add('hidden'); }
function gameOver(){ gameState='dead'; el.deadWave.textContent=wave; el.deadKills.textContent=kills; el.deadScore.textContent=score; el.deadOverlay.classList.remove('hidden'); }

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
el.tauntBtn.addEventListener('click', tauntEarly);

resetGame();
requestAnimationFrame(frame);

})();
