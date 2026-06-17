"use strict";
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

function createGameApi(){
  return {
    get monsters(){return monsters}, get heroes(){return heroes}, get eggs(){return eggs}, get grid(){return grid}, get effects(){return effects}, get spawnQueue(){return spawnQueue},
    get wave(){return wave}, set wave(v){wave=v},
    get coreHP(){return coreHP}, set coreHP(v){coreHP=v},
    get nutrients(){return nutrients}, set nutrients(v){nutrients=v},
    get waveCountdown(){return waveCountdown}, set waveCountdown(v){waveCountdown=v},
    get gameState(){return gameState}, set gameState(v){gameState=v},
    update, draw, updateHUD, resetGame, tryDig, startWave, tauntEarly,
    beginMove, updateVisualPosition, setAction, actorPose, dirFromDelta, faceToward,
    drawPixiLayer, pixelActorX, pixelActorSourceX, actorAction, canvasActorAction,
    spawnMonster, spawnHero, spawnInTunnel, spawnEgg, pickHeroClass, heroStep, openNeighbors, hasLOS,
    countKindNear, digCost, monsterIncomeRate, killMonster, killHero, isElite, rankOf,
    VEIN, KINDS, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, heroDigDmg, BORN_ANIM, EVO_TIME,
    MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
    PIXEL_ASSET_VERSION, pixelAssetUrl, cx, cy, ATK_ANIM, MOVE_ANIM, DIG_CD
  };
}
function exposeGameNamespace(){
  if(typeof globalThis==='undefined') return;
  const core={
    VEIN, KINDS, HERO_CLASSES, DIG_BREAK, DIG_COST, START_NUT, FIRST_GRACE, WAVE_INTERVAL, HERO_STAGGER,
    EGG_HATCH, EGG_CHECK, EGG_CHANCE, EGG_KIND_CAP, BORN_ANIM, EVO_TIME,
    MONSTER_CAP, MAX_HEROES, BREED_LIMIT, ENTRANCE_COL, CORE_COL, CORE_ROW, ROWS, COLS, TILE, W, H,
    PIXEL_CELL, PIXEL_FRAMES, PIXEL_DIRS, PIXEL_ACTIONS, PIXEL_ACTORS, PIXEL_TILES, PIXEL_EFFECTS,
    PIXEL_ASSET_VERSION, pixelAssetUrl
  };
  globalThis.HakaishinDungeon={
    Core:core,
    createGame:createGameApi,
    get current(){ return createGameApi(); }
  };
}

canvas.addEventListener('pointerdown', e=>{
  e.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const px=(e.clientX-rect.left)*(canvas.width/rect.width);
  const py=(e.clientY-rect.top)*(canvas.height/rect.height);
  tryDig(Math.floor(px/TILE), Math.floor(py/TILE));
}, {passive:false});
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
el.tauntBtn.addEventListener('click', tauntEarly);

if(typeof initPixiLayer==='function') initPixiLayer();
resetGame();
exposeGameNamespace();
requestAnimationFrame(frame);
