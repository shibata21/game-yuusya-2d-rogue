"use strict";

let pixiApp=null, pixiRoot=null, pixiReady=false, pixiStarting=false;

async function initPixiLayer(){
  if(pixiReady || pixiStarting || typeof PIXI==='undefined') return false;
  pixiStarting=true;
  try{
    pixiApp=new PIXI.Application();
    await pixiApp.init({width:W, height:H, backgroundAlpha:0, antialias:false, resolution:1, autoDensity:false});
    pixiRoot=new PIXI.Container();
    pixiApp.stage.addChild(pixiRoot);
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
  if(!pixiReady || !pixiRoot) return false;
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

function drawPixiActor(e,isHero,time){
  const pose=actorPose(e), c=new PIXI.Container();
  c.x=e.px+pose.x; c.y=e.py+pose.y; c.scale.set(pose.scale||1); c.rotation=pose.rot||0;
  pixiRoot.addChild(c);
  const shadow=pg(); addEllipse(shadow,0,9,isHero?11:12,3,'#09050d',0.45); c.addChild(shadow);
  if(isHero) drawPixiHero(c,e,time); else drawPixiMonster(c,e,time);
}
function drawPixiMonster(c,m,time){
  const k=KINDS[m.kind], g=pg(), col=k.col, elite=!!k.eliteOf, pulse=0.55+0.35*Math.sin(time*6+m.id);
  if(elite){ addCircle(g,0,-4,15,col,0.18+pulse*0.18); g.circle(0,-4,15+pulse*2).stroke({color:pc(col), alpha:0.55, width:1}); }
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
  const g=pg(), p=0.5+0.5*Math.sin(time*5+e.col), K=KINDS[e.kind];
  g.x=cx(e.col); g.y=cy(e.row); addEllipse(g,0,8,8,3,'#09050d',0.45); addEllipse(g,0,0,6,8,K.col,0.92);
  addEllipse(g,-2,-3,2,3,'#fff',0.35+0.25*p); g.ellipse(0,0,6,8).stroke({color:0x120c1a, width:1});
  pixiRoot.addChild(g);
}
function drawPixiEffect(f){
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
