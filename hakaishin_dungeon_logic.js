"use strict";
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
    tile.t='tunnel'; tile.sub=null; tile.evo=false; tile.age=0; tile.evoChecked=false; tile.evoTouch=0; tile.evoTouching={};
    spawnMonster(kind,col,row);
    const mo=monsters[monsters.length-1];
    if(mo && mo.col===col && mo.row===row){ mo.bornAnim=BORN_ANIM; effects.push({type:'birth', x:cx(col), y:cy(row), life:380, max:380, color:KINDS[mo.kind].col}); }
  } else {
    tile.t='tunnel';
  }
  tile.sub=null;
  effects.push({type:'dig', x:cx(col), y:cy(row), life:340, max:340});
}
/* ===================== エフェクト ===================== */
function toast(col,row,text,color){ effects.push({type:'float', x:cx(col), y:cy(row), text, color, life:900, max:900, vy:-0.018}); }
function popDmg(x,y,text,color){ effects.push({type:'float', x:x+rnd(-4,4), y:y-6, text, color, life:650, max:650, vy:-0.03}); }
function banner(text){ effects.push({type:'banner', text, life:2700, max:2700, slot:effects.filter(e=>e.type==='banner').length}); }
function slash(x,y,color){ effects.push({type:'slash', x, y, color, life:170, max:170, rot:rnd(0,6.28)}); }
function shoot(sx,sy,tx,ty,color){ effects.push({type:'shot', sx, sy, tx, ty, color, life:230, max:230}); }
function bite(sx,sy,tx,ty,color){ effects.push({type:'bite', sx, sy, tx, ty, color, life:260, max:260}); }
function dirFromDelta(dx,dy,fallback){
  const sx=Math.sign(dx), sy=Math.sign(dy);
  if(sx>0 && sy>0) return 'se';
  if(sx>0 && sy<0) return 'ne';
  if(sx<0 && sy>0) return 'sw';
  if(sx<0 && sy<0) return 'nw';
  if(sx>0) return 'e';
  if(sx<0) return 'w';
  if(sy>0) return 's';
  if(sy<0) return 'n';
  return fallback||'s';
}
function faceToward(e,tx,ty){
  e.faceDir=dirFromDelta(tx-(e.px===undefined?cx(e.col):e.px), ty-(e.py===undefined?cy(e.row):e.py), e.faceDir);
}
function spawnFaceDir(col,row){
  for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nc=col+d[0], nr=row+d[1];
    if(inBounds(nc,nr) && OPEN.has(grid[nr][nc].t)) return dirFromDelta(d[0],d[1],'s');
  }
  return 's';
}
function setAction(e,type,tx,ty,duration){
  const d=duration||ATK_ANIM;
  faceToward(e,tx,ty);
  e.actionType=type; e.actionTime=d; e.actionMax=d; e.actionTX=tx; e.actionTY=ty;
  e.atkAnim=d; e.atkTX=tx; e.atkTY=ty;
}

/* ===================== 出現 ===================== */
function spawnMonster(kind,col,row){
  if(monsters.length>=MONSTER_CAP) return;
  const k=KINDS[kind];
  monsters.push({id:++idc, kind, col, row, px:cx(col), py:cy(row), bob:rnd(0,6.28), faceDir:spawnFaceDir(col,row),
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
function veinTouchNeed(type){
  return (VEIN[type]&&VEIN[type].touchNeed)||8;
}
function updateVeinTouchEvolution(){
  for(let r=1;r<ROWS-1;r++) for(let c=1;c<COLS-1;c++){
    const t=grid[r][c];
    if(t.t!=='earth' || !t.sub || t.evo) continue;
    const touching={};
    for(const m of monsters){
      if(cheb(m,{col:c,row:r})<=1){
        touching[m.id]=true;
        if(!t.evoTouching || !t.evoTouching[m.id]) t.evoTouch=(t.evoTouch||0)+1;
      }
    }
    t.evoTouching=touching;
    if((t.evoTouch||0)>=veinTouchNeed(t.sub)){
      t.evo=true;
      t.evoChecked=true;
      effects.push({type:'evolveVein', x:cx(c), y:cy(r), life:760, max:760, color:VEIN[t.sub].color});
      toast(c,r,VEIN[t.sub].evoName,'#ffe08a');
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
  const px0=prey.px, py0=prey.py;
  setAction(m,'eat',px0,py0,320);
  killMonster(prey);
  m.hp=Math.min(m.maxHp,m.hp+Math.max(3,Math.round(prey.maxHp*0.18)));
  bite(m.px,m.py,px0,py0,'#ffcf4d');
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
  heroes.push({id:++idc, cls, col:ENTRANCE_COL, row:0, px:cx(ENTRANCE_COL), py:cy(0), faceDir:'s',
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
  e.dirX=Math.sign(col-e.col); e.dirY=Math.sign(row-e.row);
  e.faceDir=dirFromDelta(col-e.col,row-e.row,e.faceDir);
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

  // 鉱脈の進化：時間ではなく、隣接した魔物の接触回数で上位種鉱脈になる
  updateVeinTouchEvolution();

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
      faceToward(m,heroTarget.px,heroTarget.py);
      if(m.atkCd<=0){
        const tgt=heroTarget;
        tgt.hp-=m.atk; popDmg(tgt.px, tgt.py, '-'+m.atk, m.kind==='spitter'?'#b6ff7a':'#ff8a8a');
        m.atkCd=K.atkCd; setAction(m,m.range>=2?'cast':'attack',tgt.px,tgt.py,ATK_ANIM);
        if(m.range>=2) shoot(m.px, m.py-4, tgt.px, tgt.py, '#9bff5a'); else slash(tgt.px, tgt.py, '#ffd0d0');
        if(tgt.hp<=0) killHero(tgt);
      }
      continue; // 交戦中は動かない
    }

    const aggroHero=nearestHeroWithin(m, K.aggro);
    if(aggroHero) faceToward(m,aggroHero.px,aggroHero.py);
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
      const amt=Math.round(6+h.wave*1.5); let did=false, healTarget=null;
      for(const o of heroes){ if(o!==h && o.hp<o.maxHp && cheb(o,h)<=C.healRange && !healTarget) healTarget=o; }
      if(!healTarget && h.hp<h.maxHp) healTarget=h;
      if(healTarget){ healTarget.hp=Math.min(healTarget.maxHp,healTarget.hp+amt); slash(healTarget.px,healTarget.py-2,'#9effa0'); popDmg(healTarget.px,healTarget.py-10,'+'+amt,'#9effa0'); did=true; }
      h.healCd = did ? C.healCd : 300;
      if(did) setAction(h,'heal',healTarget.px,healTarget.py,ATK_ANIM);
    }

    // 攻撃（間合い内の魔物を狙う。間合いは職業で異なる）
    const monsterTarget=lowestMonsterInRange(h);
    if(monsterTarget){
      faceToward(h,monsterTarget.px,monsterTarget.py);
    }
    if(monsterTarget && h.atkCd<=0){
      const tgt=monsterTarget;
      tgt.hp-=h.atk; popDmg(tgt.px,tgt.py,'-'+h.atk,'#fff');
      h.atkCd=C.atkCd; setAction(h,h.range>=2?'cast':'attack',tgt.px,tgt.py,ATK_ANIM);
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
        h.coreCd=1100; setAction(h,'attack',cx(CORE_COL),cy(CORE_ROW),ATK_ANIM); }
      continue;
    }

    // 移動 or 壁掘り（一撃禁止：攻撃力に応じて複数回叩く）
    if(h.actCd<=0){
      const step=heroStep(h);
      if(step){
        if(step.tile.t==='earth'){
          step.tile.dig=(step.tile.dig||0)+heroDigDmg(h.atk);
          effects.push({type:'dig', x:cx(step.col), y:cy(step.row), life:300, max:300, hero:true});
          h.actCd=DIG_CD; setAction(h,'dig',cx(step.col),cy(step.row),ATK_ANIM);
          if(step.tile.dig>=DIG_BREAK){
            step.tile.t='tunnel'; step.tile.sub=null; step.tile.dig=0;
          }
        } else { beginMove(h,step.col,step.row); h.actCd=h.moveCd; }
      } else h.actCd=400;
    }
  }

  // 描画位置の補間＋攻撃／出現アクションの進行
  for(const m of monsters){ updateVisualPosition(m,dt); if(m.atkAnim>0) m.atkAnim-=dt; if(m.actionTime>0) m.actionTime-=dt; if(m.bornAnim>0) m.bornAnim-=dt; }
  for(const h of heroes){ updateVisualPosition(h,dt); if(h.atkAnim>0) h.atkAnim-=dt; if(h.actionTime>0) h.actionTime-=dt; }

  // エフェクト寿命
  for(let i=effects.length-1;i>=0;i--){ const f=effects[i]; f.life-=dt; if(f.type==='float') f.y+=f.vy*dt; if(f.life<=0) effects.splice(i,1); }
  if(effects.length>EFFECT_CAP) effects.splice(0,effects.length-EFFECT_CAP);

  if(coreHP<=0){ coreHP=0; gameOver(); }
}
