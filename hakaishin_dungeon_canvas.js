"use strict";
/* ===================== 描画 ===================== */
function px(x,y,w,h,col){ ctx.fillStyle=col; ctx.fillRect(x,y,w,h); }
let pixelTilesImg=null, pixelTilesReady=false, pixelActorsImg=null, pixelActorsReady=false;
if(typeof Image!=='undefined'){
  pixelTilesImg=new Image();
  pixelTilesImg.onload=()=>{
    pixelTilesReady = pixelTilesImg.naturalWidth===PIXEL_CELL*PIXEL_TILES.length && pixelTilesImg.naturalHeight===PIXEL_CELL;
    if(!pixelTilesReady) console.warn('タイル画像の寸法が不正です:', pixelTilesImg.naturalWidth, pixelTilesImg.naturalHeight);
  };
  pixelTilesImg.onerror=()=>{ pixelTilesReady=false; console.warn('タイル画像の読み込みに失敗しました'); };
  pixelTilesImg.src=pixelAssetUrl('tiles.png');
  pixelActorsImg=new Image();
  pixelActorsImg.onload=()=>{
    pixelActorsReady = pixelActorsImg.naturalWidth===PIXEL_CELL*PIXEL_FRAMES*PIXEL_DIRS.length*PIXEL_ACTIONS.length && pixelActorsImg.naturalHeight===PIXEL_CELL*PIXEL_ACTORS.length;
    if(!pixelActorsReady) console.warn('アクター画像の寸法が不正です:', pixelActorsImg.naturalWidth, pixelActorsImg.naturalHeight);
  };
  pixelActorsImg.onerror=()=>{ pixelActorsReady=false; console.warn('アクター画像の読み込みに失敗しました'); };
  pixelActorsImg.src=pixelAssetUrl('actors.png');
}
function bob(e,time){ return Math.sin(time*4+e.bob)*1.3; }
function lunge(e){
  if(e.actionTime>0) return actorPose(e);
  if(!e.atkAnim || e.atkAnim<=0) return {x:0,y:0,scale:1,rot:0};
  const p=e.atkAnim/ATK_ANIM, j=Math.sin(p*Math.PI)*LUNGE;
  const dx=(e.atkTX-e.px), dy=(e.atkTY-e.py), d=Math.hypot(dx,dy)||1;
  return {x:dx/d*j, y:dy/d*j, scale:1, rot:0};
}
function actorPose(e){
  if(!e.actionTime || e.actionTime<=0) return {x:0,y:0,scale:1,rot:0};
  const max=e.actionMax||ATK_ANIM, p=clamp(1-e.actionTime/max,0,1), wave=Math.sin(p*Math.PI);
  const dx=(e.actionTX-e.px), dy=(e.actionTY-e.py), d=Math.hypot(dx,dy)||1;
  let power=LUNGE, scale=1, rot=0;
  if(e.actionType==='eat'){ power=12; scale=1+0.18*wave; rot=0.12*wave*Math.sign(dx||1); }
  else if(e.actionType==='cast'){ power=-3; scale=1+0.08*wave; rot=-0.08*wave*Math.sign(dx||1); }
  else if(e.actionType==='dig'){ power=6; scale=1; rot=0.16*wave*Math.sign(dx||1); }
  return {x:dx/d*power*wave, y:dy/d*power*wave, scale, rot};
}

function draw(){
  const time=performance.now()/1000;
  const pixiActive=typeof drawPixiLayer==='function' && drawPixiLayer(time);
  ctx.clearRect(0,0,W,H);
  px(0,0,W,H,'#120c1a');

  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const t=grid[r][c], x=c*TILE, y=r*TILE;
    if(drawPixelTile(x,y,t,c,r)){
      drawDigCrack(x,y,t);
    } else if(t.t==='bedrock') drawBedrock(x,y,c,r);
    else if(t.t==='earth') drawEarth(x,y,t,c,r,time);
    else if(t.t==='surface') drawSurface(x,y);
    else { drawTunnel(x,y,t,c,r,time); }
  }

  drawCore(cx(CORE_COL), cy(CORE_ROW), time);
  if(!pixiActive){
    for(const e of eggs) if(!drawPixelCanvasEgg(e,time)) drawEgg(e,time);
    const ents=[];
    for(const m of monsters) ents.push({z:m.row, k:'m', e:m});
    for(const h of heroes) ents.push({z:h.row+0.5, k:'h', e:h});
    ents.sort((a,b)=>a.z-b.z);
    for(const o of ents){
      if(drawPixelCanvasActor(o.e,o.k==='h',time)) continue;
      if(o.k==='m') drawMonster(o.e,time); else drawHero(o.e,time);
    }
  }

  for(const f of effects) if(!pixiActive || !pixiEffect(f)) drawEffect(f);
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
function pixelTileKey(t){
  if(t.t==='earth' && t.sub) return t.sub+(t.evo?'_evo':'');
  if(t.t==='earth' || t.t==='tunnel' || t.t==='bedrock' || t.t==='surface' || t.t==='core') return t.t;
  return 'tunnel';
}
function drawPixelTile(x,y,t,c,r){
  if(!pixelTilesReady || !pixelTilesImg) return false;
  const key=pixelTileKey(t), idx=PIXEL_TILES.indexOf(key);
  if(idx<0) return false;
  ctx.drawImage(pixelTilesImg, idx*PIXEL_CELL, 0, PIXEL_CELL, PIXEL_CELL, x, y, TILE+0.5, TILE+0.5);
  return true;
}
function canvasActorFrame(e,time){
  if(e.actionTime>0) return Math.floor((1-e.actionTime/(e.actionMax||ATK_ANIM))*PIXEL_FRAMES)%PIXEL_FRAMES;
  if(e.moveAnim>0) return Math.floor(time*10+e.id)%PIXEL_FRAMES;
  return Math.floor(time*3+e.id)%PIXEL_FRAMES;
}
function canvasActorAction(e){
  const a=e.actionTime>0 ? (e.actionType||'idle') : 'idle';
  return PIXEL_ACTIONS.indexOf(a)>=0 ? a : 'idle';
}
function pixelActorSourceX(action,dir,frame){
  const ai=PIXEL_ACTIONS.indexOf(action), di=PIXEL_DIRS.indexOf(dir||'s');
  const actionIndex=ai<0 ? 0 : ai, dirIndex=di<0 ? PIXEL_DIRS.indexOf('s') : di;
  return ((actionIndex*PIXEL_DIRS.length+dirIndex)*PIXEL_FRAMES+frame)*PIXEL_CELL;
}
function drawPixelCanvasSprite(name,dir,frame,x,y,action,anchorY){
  if(!pixelActorsReady || !pixelActorsImg) return false;
  const row=PIXEL_ACTORS.indexOf(name);
  if(row<0) return false;
  const ay=anchorY===undefined ? 0.75 : anchorY;
  ctx.drawImage(pixelActorsImg, pixelActorSourceX(action||'idle',dir,frame), row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL, x-PIXEL_CELL/2, y-PIXEL_CELL*ay, PIXEL_CELL, PIXEL_CELL);
  return true;
}
function drawPixelCanvasActor(e,isHero,time){
  const L=lunge(e), x=e.px+L.x, y=e.py+bob(e,time)+L.y;
  const name=isHero?e.cls:e.kind;
  const s=(e.bornAnim>0)?(0.4+0.6*clamp(1-e.bornAnim/BORN_ANIM,0,1)):1;
  if(s!==1){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.translate(-x,-y); }
  const ok=drawPixelCanvasSprite(name,e.faceDir||'s',canvasActorFrame(e,time),x,y,canvasActorAction(e),isHero?0.75:0.5);
  if(s!==1) ctx.restore();
  if(ok) drawHpBar(x, isHero?y-25:y-23, isHero?(e.cls==='tank'?22:18):20, e.hp, e.maxHp, isHero?'#ffd34d':'#7bd96b');
  return ok;
}
function drawPixelCanvasEgg(e,time){
  const frame=Math.floor(time*4+e.col)%PIXEL_FRAMES;
  const ok=drawPixelCanvasSprite('egg_'+e.kind,'s',frame,cx(e.col),cy(e.row)+8,'idle',0.75);
  if(ok){
    const p=clamp(1-e.hatchCd/EGG_HATCH,0,1), x=cx(e.col), y=cy(e.row);
    px(x-7,y-12,14,2,'#2a1538'); px(x-7,y-12,Math.round(14*p),2,KINDS[e.kind].col);
  }
  return ok;
}
function drawDigCrack(x,y,t){
  if(!t.dig) return;
  const f=clamp(t.dig/DIG_BREAK,0,1);
  ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x+6,y+4); ctx.lineTo(x+12,y+14); ctx.lineTo(x+9,y+24); ctx.stroke();
  if(f>0.5){ ctx.beginPath(); ctx.moveTo(x+TILE-6,y+6); ctx.lineTo(x+TILE-14,y+16); ctx.lineTo(x+TILE-10,y+26); ctx.stroke(); }
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
function drawGroundShadow(x,y,w,a){
  ctx.globalAlpha=a||0.45; ctx.fillStyle='#09050d'; ctx.beginPath(); ctx.ellipse(x,y+9,w||11,3,0,0,6.28); ctx.fill(); ctx.globalAlpha=1;
}
function drawRuneGlow(x,y,r,col,a){
  ctx.globalAlpha=a; ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill(); ctx.globalAlpha=1;
}
function drawSlime(x,y){
  drawGroundShadow(x,y,10,0.42);
  px(x-9,y+3,18,5,'#1f6f2b'); px(x-8,y-2,16,7,'#3fae4b'); px(x-6,y-6,12,5,'#5fd16b');
  px(x-4,y-7,8,2,'#9bff9f'); px(x-7,y+2,14,2,'#2f8d3b'); px(x-9,y+5,18,2,'#154d1f');
  px(x-5,y-2,3,4,'#081a0a'); px(x+2,y-2,3,4,'#081a0a'); px(x-4,y-1,1,1,'#fff'); px(x+3,y-1,1,1,'#fff');
  px(x-1,y+3,2,1,'#bdf7bd'); px(x+5,y+1,2,2,'#7bf08a');
}
function drawCarniv(x,y){
  drawGroundShadow(x,y,12,0.48);
  px(x-11,y+4,22,4,'#4f1d13'); px(x-10,y-4,20,9,'#b84d27'); px(x-8,y-7,16,4,'#e06b3a');
  px(x-12,y-1,4,6,'#7a3318'); px(x+8,y-1,4,6,'#7a3318'); px(x-9,y+6,4,4,'#35110b'); px(x+5,y+6,4,4,'#35110b');
  px(x-11,y-6,3,5,'#2a0f1c'); px(x+8,y-6,3,5,'#2a0f1c'); px(x-7,y+3,3,5,'#fff'); px(x-1,y+4,2,4,'#fff'); px(x+5,y+3,3,5,'#fff');
  px(x-6,y-2,3,3,'#2b0606'); px(x+3,y-2,3,3,'#2b0606'); px(x-5,y-1,1,1,'#ffcf4d'); px(x+4,y-1,1,1,'#ffcf4d');
  px(x-2,y-5,4,2,'#ff9b5a');
}
function drawEvolved(x,y){
  drawGroundShadow(x,y,14,0.55);
  px(x-12,y+5,24,4,'#210812'); px(x-12,y-5,24,11,'#6e1f38'); px(x-10,y-8,20,4,'#9b2f4f');
  px(x-13,y-11,4,8,'#180711'); px(x+9,y-11,4,8,'#180711'); px(x-12,y+6,6,5,'#210812'); px(x+6,y+6,6,5,'#210812');
  px(x-10,y-2,3,9,'#3a1020'); px(x+7,y-2,3,9,'#3a1020'); px(x-6,y+4,3,5,'#fff'); px(x+3,y+4,3,5,'#fff'); px(x-1,y+5,2,4,'#fff');
  drawRuneGlow(x-6,y-2,2,'#ffcf4d',0.9); drawRuneGlow(x+5,y-2,2,'#ffcf4d',0.9);
  px(x-3,y-7,6,2,'#e06b8a');
}
function drawSpitter(x,y,time){
  const drip=Math.sin(time*8+x)>0;
  drawGroundShadow(x,y,11,0.46);
  px(x-8,y+4,16,4,'#321942'); px(x-8,y-3,15,8,'#6b3094'); px(x-6,y-6,12,5,'#7a3aa6');
  px(x+5,y-3,6,4,'#a64dff'); px(x+9,y-2,3,3,'#4e1f6d');                 // 口先
  px(x-9,y-1,3,5,'#3a1f52'); px(x+2,y+5,4,3,'#2b153d'); px(x-6,y+5,4,3,'#2b153d');
  drawRuneGlow(x-3,y-1,2,'#dfffe0',0.9); drawRuneGlow(x+2,y-1,2,'#dfffe0',0.9);
  ctx.globalAlpha=0.55; px(x-5,y-5,9,2,'#d08cff'); ctx.globalAlpha=1;
  if(drip){ drawRuneGlow(x+11,y+1,2,'#9bff9b',0.85); px(x+11,y+3,1,2,'#9bff9b'); }         // 毒
}
function drawGolem(x,y){
  drawGroundShadow(x,y,14,0.58);
  px(x-11,y-8,22,16,'#2e3a59'); px(x-9,y-10,18,4,'#6f86c4'); px(x-10,y+5,20,4,'#1c263d');
  px(x-14,y-4,5,10,'#3f4f73'); px(x+9,y-4,5,10,'#3f4f73'); px(x-15,y+4,5,4,'#222c45'); px(x+10,y+4,5,4,'#222c45');
  px(x-2,y-7,4,13,'#1d2840'); px(x-7,y-1,6,2,'#1d2840'); px(x+2,y+1,5,2,'#1d2840'); px(x-10,y-5,3,12,'#43547a');
  drawRuneGlow(x-4,y-3,2,'#9bd0ff',0.9); drawRuneGlow(x+3,y-3,2,'#9bd0ff',0.9); px(x-1,y+2,2,2,'#9bd0ff');
}
function drawFlame(x,y,time){
  const fj=Math.round(Math.sin(time*12)*1.5);
  drawGroundShadow(x,y,12,0.48);
  ctx.globalAlpha=0.28; ctx.fillStyle='#ff5b2a'; ctx.beginPath(); ctx.arc(x,y-5,14+fj,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  px(x-8,y-3,16,10,'#2b0710'); px(x-7,y+5,14,3,'#120408'); px(x-9,y-8,4,6,'#1a0610'); px(x+5,y-8,4,6,'#1a0610');
  px(x-6+fj,y-13,4,7,'#ff5b2a'); px(x-2,y-16,4,9,'#ffcf4d'); px(x+3-fj,y-13,4,7,'#ff8a3a');
  px(x-5,y-1,3,3,'#ffcf4d'); px(x+2,y-1,3,3,'#ffcf4d'); px(x-3,y+3,6,2,'#ff5b2a'); px(x-1,y+4,2,2,'#ffcf4d');
}

function drawHero(h,time){
  const L=lunge(h), walk=h.moveAnim>0?Math.sin(time*18+h.id)*1.2:0;
  const x=h.px+L.x+walk*(h.dirX||0)*0.5, y=h.py+bob(h,time)+L.y+Math.abs(walk)*0.25;
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
  const dark='#485161', edge='#151a23';
  drawGroundShadow(x,y,11,0.45);
  px(x+8,y-10,2,16,'#f1f5f9'); px(x+7,y+5,4,2,'#8a5e16'); px(x+9,y-10,1,10,'#7a8290');     // 剣
  px(x-13,y-5,5,12,'#4a2f10'); px(x-12,y-4,3,10,armor); px(x-11,y-2,1,6,'#fff7');        // 盾
  px(x-5,y+5,4,5,dark); px(x+1,y+5,4,5,dark); px(x-5,y+9,4,2,edge); px(x+1,y+9,4,2,edge);
  px(x-6,y-5,12,11,edge); px(x-5,y-4,10,9,armor); px(x-4,y-4,8,2,'#fff7'); px(x-5,y+3,10,2,'rgba(0,0,0,.3)');
  px(x-5,y-12,10,8,edge); px(x-4,y-11,8,7,armor); px(x-4,y-11,8,2,'#fff7'); px(x-3,y-8,6,2,'#101722');
  px(x-1,y-16,2,4,'#e0556b'); px(x-2,y-14,4,1,'#ff9aa8');                                 // 前立て
}
function drawTank(x,y){
  const iron='#7a8290', dk='#303743', edge='#151a23';
  drawGroundShadow(x,y,13,0.55);
  px(x-7,y+5,5,5,dk); px(x+2,y+5,5,5,dk); px(x-8,y+9,6,2,edge); px(x+2,y+9,6,2,edge);
  px(x-9,y-6,18,12,edge); px(x-8,y-5,16,11,iron); px(x-8,y-5,16,2,'#c4ccd6'); px(x-8,y+4,16,2,'rgba(0,0,0,.34)');
  px(x-7,y-13,14,9,edge); px(x-6,y-12,12,8,iron); px(x-6,y-12,12,2,'#c4ccd6'); px(x-4,y-8,8,2,'#0b1018');
  px(x-15,y-8,7,18,'#2f3949'); px(x-14,y-7,5,16,'#566070'); px(x-14,y-7,5,2,'#9aa4b2'); px(x-12,y-3,2,8,'#cfd6df');
  px(x+8,y-3,4,10,'#2f3540'); px(x+7,y+5,6,3,'#566070');                                  // 鈍器
}
function drawMage(x,y,time){
  const robe='#6a5acd', robe2='#4b3fa0', glow=0.5+0.5*Math.sin(time*5);
  drawGroundShadow(x,y,10,0.42);
  px(x-6,y+1,12,10,'#261d57'); px(x-5,y+1,10,9,robe); px(x-5,y+8,10,2,robe2); px(x-5,y+1,10,2,'#a296ff');
  px(x-4,y-7,8,8,'#261d57'); px(x-3,y-6,6,7,robe); px(x-1,y-2,2,2,'#cfc6ff');
  px(x-6,y-10,12,3,robe2); px(x-4,y-14,8,5,robe2); px(x-1,y-18,3,5,robe2); px(x-4,y-13,8,1,'#a296ff');
  px(x+8,y-9,2,17,'#6b4a2f'); px(x+7,y+5,4,2,'#3b2718');
  ctx.globalAlpha=0.5*glow+0.35; ctx.fillStyle='#b6a6ff';
  ctx.beginPath(); ctx.arc(x+9,y-10,5,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  drawRuneGlow(x+9,y-10,2,'#fff',0.95);
}
function drawPriest(x,y,time){
  const robe='#ede6d0', gold='#e8c860', halo=0.5+0.5*Math.sin(time*4);
  drawGroundShadow(x,y,10,0.4);
  ctx.globalAlpha=0.22+0.18*halo; ctx.fillStyle='#fff0a8'; ctx.beginPath(); ctx.arc(x,y-6,13,0,6.28); ctx.fill(); ctx.globalAlpha=1;
  px(x-6,y+1,12,10,'#6a604e'); px(x-5,y+1,10,9,robe); px(x-5,y+8,10,2,'#c9c0a6'); px(x-5,y+1,10,2,gold);
  px(x-4,y-7,8,8,'#c9c0a6'); px(x-3,y-6,6,7,robe); px(x-4,y-13,8,8,robe); px(x-3,y-9,6,2,'#8b846e');
  px(x-1,y-4,2,10,gold); px(x-4,y,8,2,gold);
  ctx.globalAlpha=0.45+0.45*halo; ctx.strokeStyle='#fff0a8'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y-14,6,Math.PI,0); ctx.stroke(); ctx.globalAlpha=1;
  px(x+8,y-9,2,17,'#cbb78a'); px(x+6,y-9,6,2,gold); px(x+8,y-12,2,6,gold);
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
  } else if(f.type==='bite'){
    const p=1-k, X=f.sx+(f.tx-f.sx)*p, Y=f.sy+(f.ty-f.sy)*p;
    ctx.globalAlpha=clamp(k*1.5,0,1); ctx.strokeStyle=f.color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(X-3,Y,5*(1.1-k),-0.9,0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(X+3,Y,5*(1.1-k),Math.PI-0.9,Math.PI+0.9); ctx.stroke();
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
