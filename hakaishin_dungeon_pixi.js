"use strict";

let pixiApp=null, pixiRoot=null, pixiReady=false, pixiStarting=false;
let pixelPixiReady=false, pixelPixiBase={}, pixelPixiCache={};

async function initPixiLayer(){
  if(pixiReady || pixiStarting || typeof PIXI==='undefined') return false;
  pixiStarting=true;
  try{
    pixiApp=new PIXI.Application();
    await pixiApp.init({width:W, height:H, backgroundAlpha:0, antialias:false, resolution:1, autoDensity:false});
    pixiRoot=new PIXI.Container();
    pixiApp.stage.addChild(pixiRoot);
    await initPixelPixiAssets();
    const view=pixiApp.canvas;
    view.className='pixi-layer';
    view.style.position='absolute'; view.style.inset='0'; view.style.width='100%'; view.style.height='100%';
    view.style.pointerEvents='none'; view.style.imageRendering='pixelated'; view.style.background='transparent';
    view.style.border='0'; view.style.borderRadius='0'; view.style.boxShadow='none'; view.style.zIndex='2';
    canvas.parentElement.appendChild(view);
    pixiReady=true;
    return true;
  }catch(e){
    console.warn('Pixi初期化失敗:', e);
    pixiReady=false;
    return false;
  }
}
function pixiEffect(f){ return f.type==='slash' || f.type==='shot' || f.type==='bite' || f.type==='birth' || f.type==='puff'; }
function drawPixiLayer(time){
  if(!pixiReady || !pixiRoot || !pixelPixiReady) return false;
  pixiRoot.removeChildren();
  for(const e of eggs) drawPixiEgg(e,time);
  const ents=[];
  for(const m of monsters) ents.push({z:m.row, hero:false, e:m});
  for(const h of heroes) ents.push({z:h.row+0.5, hero:true, e:h});
  ents.sort((a,b)=>a.z-b.z);
  for(const o of ents) drawPixiActor(o.e,o.hero,time);
  for(const f of effects) if(pixiEffect(f)) drawPixiEffect(f);
  return true;
}
function pc(col){
  if(typeof col==='number') return col;
  if(!col || col[0]!=='#') return 0xffffff;
  if(col.length===4) return parseInt(col[1]+col[1]+col[2]+col[2]+col[3]+col[3],16);
  return parseInt(col.slice(1),16);
}
function pg(){ return new PIXI.Graphics(); }
function addRect(g,x,y,w,h,c){ g.rect(x,y,w,h).fill(pc(c)); }
function addCircle(g,x,y,r,c,a){ g.circle(x,y,r).fill({color:pc(c), alpha:a===undefined?1:a}); }
function addEllipse(g,x,y,w,h,c,a){ g.ellipse(x,y,w,h).fill({color:pc(c), alpha:a===undefined?1:a}); }
async function initPixelPixiAssets(){
  try{
    pixelPixiCache={};
    pixelPixiBase.actors=await loadPixelPixiTexture('actors.png');
    pixelPixiBase.effects=await loadPixelPixiTexture('effects.png');
    validatePixelPixiBase('actors', pixelPixiBase.actors, PIXEL_CELL*PIXEL_FRAMES*PIXEL_DIRS.length*PIXEL_ACTIONS.length, PIXEL_CELL*PIXEL_ACTORS.length);
    validatePixelPixiBase('effects', pixelPixiBase.effects, PIXEL_CELL*PIXEL_FRAMES, PIXEL_CELL*PIXEL_EFFECTS.length);
    pixelPixiReady=true;
    validatePixelPixiFrames();
  }catch(e){
    console.warn('画像スプライト初期化失敗:', e);
    pixelPixiBase={}; pixelPixiCache={};
    pixelPixiReady=false;
  }
}
async function loadPixelPixiTexture(name){
  const url=pixelAssetUrl(name);
  const tex=PIXI.Assets && PIXI.Assets.load ? await PIXI.Assets.load(url) : PIXI.Texture.from(url);
  applyNearestTexture(tex);
  return tex;
}
function applyNearestTexture(tex){
  if(!tex) return;
  if(tex.source){
    if(tex.source.style) tex.source.style.scaleMode='nearest';
    if('scaleMode' in tex.source) tex.source.scaleMode='nearest';
  }
  if(tex.baseTexture && 'scaleMode' in tex.baseTexture) tex.baseTexture.scaleMode=PIXI.SCALE_MODES ? PIXI.SCALE_MODES.NEAREST : 'nearest';
}
function textureSize(tex){
  const src=tex && tex.source;
  return {w:(src&&src.width)||tex.width||0, h:(src&&src.height)||tex.height||0};
}
function validatePixelPixiBase(sheet, tex, w, h){
  const s=textureSize(tex);
  if(s.w!==w || s.h!==h) throw new Error(sheet+'画像の寸法が不正です: '+s.w+'x'+s.h+' expected '+w+'x'+h);
}
function validatePixelPixiFrames(){
  for(let row=0; row<PIXEL_ACTORS.length; row++) for(let a=0; a<PIXEL_ACTIONS.length; a++) for(let d=0; d<PIXEL_DIRS.length; d++) for(let f=0; f<PIXEL_FRAMES; f++){
    const tex=pixelTexture('actors', ((a*PIXEL_DIRS.length+d)*PIXEL_FRAMES+f)*PIXEL_CELL, row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL);
    if(!tex) throw new Error('actorsフレーム作成失敗: '+PIXEL_ACTORS[row]+' '+PIXEL_ACTIONS[a]+' '+PIXEL_DIRS[d]+' '+f);
  }
  for(let row=0; row<PIXEL_EFFECTS.length; row++) for(let f=0; f<PIXEL_FRAMES; f++){
    const tex=pixelTexture('effects', f*PIXEL_CELL, row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL);
    if(!tex) throw new Error('effectsフレーム作成失敗: '+PIXEL_EFFECTS[row]+' '+f);
  }
}
function pixelTexture(sheet,x,y,w,h){
  if(!pixelPixiReady || !pixelPixiBase[sheet] || !PIXI.Rectangle) return null;
  const key=sheet+':'+x+':'+y+':'+w+':'+h;
  if(pixelPixiCache[key]) return pixelPixiCache[key];
  try{
    const base=pixelPixiBase[sheet];
    const size=textureSize(base);
    if(x<0 || y<0 || x+w>size.w || y+h>size.h) return null;
    const tex=new PIXI.Texture({source:base.source, frame:new PIXI.Rectangle(x,y,w,h)});
    applyNearestTexture(tex);
    pixelPixiCache[key]=tex;
    return tex;
  }catch(e){ return null; }
}
function actorSpriteName(e,isHero){
  if(isHero) return e.cls;
  return e.kind;
}
function actorFrame(e,time){
  if(e.actionTime>0) return Math.floor((1-e.actionTime/(e.actionMax||ATK_ANIM))*PIXEL_FRAMES)%PIXEL_FRAMES;
  if(e.moveAnim>0) return Math.floor(time*10+e.id)%PIXEL_FRAMES;
  return Math.floor(time*3+e.id)%PIXEL_FRAMES;
}
function actorAction(e){
  const a=e.actionTime>0 ? (e.actionType||'idle') : 'idle';
  return PIXEL_ACTIONS.indexOf(a)>=0 ? a : 'idle';
}
function pixelActorX(action, dir, frame){
  const ai=PIXEL_ACTIONS.indexOf(action), di=PIXEL_DIRS.indexOf(dir);
  const actionIndex=ai<0 ? 0 : ai, dirIndex=di<0 ? PIXEL_DIRS.indexOf('s') : di;
  return ((actionIndex*PIXEL_DIRS.length+dirIndex)*PIXEL_FRAMES+frame)*PIXEL_CELL;
}
function drawPixelPixiActor(c,e,isHero,time){
  const name=actorSpriteName(e,isHero), row=PIXEL_ACTORS.indexOf(name);
  if(row<0) return false;
  const tex=pixelTexture('actors', pixelActorX(actorAction(e), e.faceDir||'s', actorFrame(e,time)), row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL);
  if(!tex) return false;
  const s=new PIXI.Sprite(tex);
  s.anchor.set(0.5,0.75);
  c.addChild(s);
  return true;
}
function drawPixelPixiEgg(e,time){
  const key='egg_'+e.kind, row=PIXEL_ACTORS.indexOf(key);
  if(row<0) return false;
  const frame=Math.floor(time*4+e.col)%PIXEL_FRAMES;
  const tex=pixelTexture('actors', pixelActorX('idle', 's', frame), row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL);
  if(!tex) return false;
  const s=new PIXI.Sprite(tex);
  s.anchor.set(0.5,0.75); s.x=cx(e.col); s.y=cy(e.row)+8;
  pixiRoot.addChild(s);
  return true;
}
function drawPixelPixiEffect(f){
  const row=PIXEL_EFFECTS.indexOf(f.type);
  if(row<0) return false;
  const frame=clamp(Math.floor((1-f.life/f.max)*PIXEL_FRAMES),0,PIXEL_FRAMES-1);
  const tex=pixelTexture('effects', frame*PIXEL_CELL, row*PIXEL_CELL, PIXEL_CELL, PIXEL_CELL);
  if(!tex) return false;
  const s=new PIXI.Sprite(tex);
  s.anchor.set(0.5,0.5);
  if(f.type==='shot' || f.type==='bite'){
    const p=1-f.life/f.max; s.x=f.sx+(f.tx-f.sx)*p; s.y=f.sy+(f.ty-f.sy)*p;
    s.rotation=Math.atan2(f.ty-f.sy,f.tx-f.sx);
  }else{
    s.x=f.x; s.y=f.y; if(f.rot) s.rotation=f.rot;
  }
  s.alpha=clamp(f.life/f.max*1.4,0,1);
  pixiRoot.addChild(s);
  return true;
}

function drawPixiActor(e,isHero,time){
  const pose=actorPose(e), c=new PIXI.Container();
  const scale=pose.scale||1;
  c.x=e.px+pose.x; c.y=e.py+pose.y; c.scale.set(scale); c.rotation=pose.rot||0;
  pixiRoot.addChild(c);
  if(drawPixelPixiActor(c,e,isHero,time)) return;
  const shadow=pg(); addEllipse(shadow,0,9,isHero?11:12,3,'#09050d',0.45); c.addChild(shadow);
  if(isHero) drawPixiHero(c,e,time); else drawPixiMonster(c,e,time);
}
function drawPixiMonster(c,m,time){
  const k=KINDS[m.kind], g=pg(), col=k.col, pulse=0.55+0.35*Math.sin(time*6+m.id);
  const base=k.eliteOf||m.kind;
  if(base==='slime'){
    addEllipse(g,0,2,10,8,'#1f6f2b'); addEllipse(g,0,-2,8,7,col); addRect(g,-5,-7,10,3,'#9bff9f');
    addRect(g,-5,-2,3,4,'#081a0a'); addRect(g,2,-2,3,4,'#081a0a'); addRect(g,-4,-1,1,1,'#fff'); addRect(g,3,-1,1,1,'#fff');
  }else if(base==='carniv' || base==='evolved'){
    addRect(g,-12,4,24,5,'#210812'); addRect(g,-11,-6,22,12,base==='evolved'?'#6e1f38':'#b84d27');
    addRect(g,-10,-9,20,4,col); addRect(g,-13,-11,4,8,'#180711'); addRect(g,9,-11,4,8,'#180711');
    addRect(g,-7,3,3,6,'#fff'); addRect(g,4,3,3,6,'#fff'); addCircle(g,-5,-2,2,'#ffcf4d'); addCircle(g,5,-2,2,'#ffcf4d');
  }else if(base==='spitter'){
    addEllipse(g,-1,0,9,8,'#321942'); addEllipse(g,-1,-3,8,7,col); addRect(g,5,-4,7,4,col);
    addCircle(g,-3,-2,2,'#dfffe0'); addCircle(g,3,-2,2,'#dfffe0'); addCircle(g,11,0,2,'#9bff9b',pulse);
  }else if(base==='golem'){
    addRect(g,-12,-9,24,18,'#1d2840'); addRect(g,-10,-10,20,5,col); addRect(g,-15,-4,5,11,'#3f4f73'); addRect(g,10,-4,5,11,'#3f4f73');
    addRect(g,-2,-8,4,14,'#0f1728'); addCircle(g,-4,-3,2,'#9bd0ff'); addCircle(g,4,-3,2,'#9bd0ff');
  }else{
    addCircle(g,0,-5,15,'#ff5b2a',0.22); addRect(g,-9,-4,18,12,'#2b0710'); addRect(g,-10,-9,4,7,'#1a0610'); addRect(g,6,-9,4,7,'#1a0610');
    addRect(g,-6+Math.round(Math.sin(time*12)*1.5),-14,4,8,'#ff5b2a'); addRect(g,-2,-17,4,10,'#ffcf4d'); addCircle(g,-4,-1,2,'#ffcf4d'); addCircle(g,4,-1,2,'#ffcf4d');
  }
  c.addChild(g);
}
function drawPixiHero(c,h,time){
  const g=pg(), C=HERO_CLASSES[h.cls], glow=0.55+0.35*Math.sin(time*5+h.id);
  let steel='#c3cdd9';
  if(h.wave>=8) steel=lerpHex('#ffd34d','#e0556b', clamp((h.wave-8)/6,0,1));
  else if(h.wave>=4) steel=lerpHex('#c3cdd9','#ffd34d', clamp((h.wave-4)/4,0,1));
  if(h.cls==='tank'){
    addRect(g,-15,-8,7,18,'#2f3949'); addRect(g,-9,-6,18,13,'#151a23'); addRect(g,-8,-5,16,11,'#7a8290');
    addRect(g,-7,-13,14,9,'#151a23'); addRect(g,-6,-12,12,8,'#7a8290'); addRect(g,8,-3,4,10,'#303743');
  }else if(h.cls==='mage'){
    addCircle(g,9,-10,6,'#b6a6ff',glow); addRect(g,-6,1,12,10,'#261d57'); addRect(g,-5,1,10,9,'#6a5acd');
    addRect(g,-6,-10,12,3,'#4b3fa0'); addRect(g,-4,-14,8,5,'#4b3fa0'); addRect(g,8,-9,2,17,'#6b4a2f'); addCircle(g,9,-10,2,'#fff');
  }else if(h.cls==='priest'){
    addCircle(g,0,-6,14,'#fff0a8',0.18+glow*0.18); addRect(g,-6,1,12,10,'#6a604e'); addRect(g,-5,1,10,9,'#ede6d0');
    addRect(g,-4,-13,8,8,'#ede6d0'); addRect(g,-1,-4,2,10,'#e8c860'); addRect(g,-4,0,8,2,'#e8c860'); addRect(g,8,-9,2,17,'#cbb78a');
  }else{
    addRect(g,8,-10,2,16,'#f1f5f9'); addRect(g,-13,-5,5,12,'#4a2f10'); addRect(g,-12,-4,3,10,steel);
    addRect(g,-6,-5,12,11,'#151a23'); addRect(g,-5,-4,10,9,steel); addRect(g,-5,-12,10,8,'#151a23'); addRect(g,-4,-11,8,7,steel);
  }
  if(C.heal) addCircle(g,0,-14,6,'#fff0a8',0.25+glow*0.25);
  c.addChild(g);
}
function drawPixiEgg(e,time){
  if(drawPixelPixiEgg(e,time)) return;
  const g=pg(), p=0.5+0.5*Math.sin(time*5+e.col), K=KINDS[e.kind];
  g.x=cx(e.col); g.y=cy(e.row); addEllipse(g,0,8,8,3,'#09050d',0.45); addEllipse(g,0,0,6,8,K.col,0.92);
  addEllipse(g,-2,-3,2,3,'#fff',0.35+0.25*p); g.ellipse(0,0,6,8).stroke({color:0x120c1a, width:1});
  pixiRoot.addChild(g);
}
function drawPixiEffect(f){
  if(drawPixelPixiEffect(f)) return;
  const g=pg(), k=f.life/f.max;
  if(f.type==='shot'){
    const p=1-k, x=f.sx+(f.tx-f.sx)*p, y=f.sy+(f.ty-f.sy)*p; g.x=x; g.y=y; addCircle(g,0,0,4,f.color,clamp(k*1.4,0,1));
  }else if(f.type==='slash'){
    g.x=f.x; g.y=f.y; g.rotation=f.rot; g.moveTo(-8,-4).lineTo(8,4).stroke({color:pc(f.color), alpha:clamp(k*1.3,0,1), width:3});
  }else if(f.type==='bite'){
    const p=1-k, x=f.sx+(f.tx-f.sx)*p, y=f.sy+(f.ty-f.sy)*p; g.x=x; g.y=y;
    g.arc(-3,0,6*(1.1-k),-0.9,0.9).stroke({color:pc(f.color), alpha:clamp(k*1.5,0,1), width:2});
    g.arc(3,0,6*(1.1-k),Math.PI-0.9,Math.PI+0.9).stroke({color:pc(f.color), alpha:clamp(k*1.5,0,1), width:2});
  }else if(f.type==='birth' || f.type==='puff'){
    g.x=f.x; g.y=f.y; g.circle(0,0,(1-k)*13+2).stroke({color:pc(f.color), alpha:k, width:2});
  }
  pixiRoot.addChild(g);
}
