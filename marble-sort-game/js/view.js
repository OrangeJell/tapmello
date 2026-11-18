import {createCanvas, reducedMotion} from './platform.js';
import {loadToys, toy} from './toys.js';
import {makeCommuter} from './commuters.js';
import {HouseArt} from './house-art.js';
import {sceneForLevel,drawSceneDecor,drawSceneTrim,drawWeather,leaf} from './scenes.js';
import {t} from './i18n.js';
import {COLORS, isPackHidden, BOARDING_DURATION, DEPARTURE_DURATION, beltPosition} from './engine.js';
import {FUNNEL_LEFT, FUNNEL_RIGHT} from './physics.js';

export const SOURCE_X=[72,156,240,324,408];
export const BOX_X=[78,186,294,402];
const LENGTH=712+Math.PI*68;
const ENTRY_DURATION=.1;
const clamp=t=>Math.max(0,Math.min(1,t));
const ease=t=>1-Math.pow(1-clamp(t),3);
const spring=t=>t>=1?1:1-Math.exp(-7*t)*Math.cos(10*t);
export function trackPoint(t){
  let d=((t%1)+1)%1*LENGTH;
  if(d<178)return{x:240+d,y:426,angle:0};d-=178;
  if(d<Math.PI*34){const a=-Math.PI/2+d/34;return{x:418+Math.cos(a)*34,y:460+Math.sin(a)*34,angle:a+Math.PI/2};}d-=Math.PI*34;
  if(d<356)return{x:418-d,y:494,angle:Math.PI};d-=356;
  if(d<Math.PI*34){const a=Math.PI/2+d/34;return{x:62+Math.cos(a)*34,y:460+Math.sin(a)*34,angle:a+Math.PI/2};}d-=Math.PI*34;
  return{x:62+d,y:426,angle:0};
}

export class View{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.clock=0;this.renderAlpha=1;
    this.reduced=reducedMotion;this.theme=sceneForLevel(1);this.weatherClock=0;
    this.flights=[];this.entries=[];this.particles=[];this.rings=[];this.labels=[];
    this.releases=Array(5).fill(null);this.boxTimes=Array(4).fill(-10);this.holeTimes=Array.from({length:4},()=>Array(3).fill(-10));
    this.boxSprings=Array.from({length:4},()=>({y:0,velocity:0}));
    this.shake=0;this.intro=0;this.hover=-1;
    this.sprites=COLORS.map(makeCommuter);
    this.houseArt=new HouseArt();
    this.shadowSprite=createCanvas();
    this.shadowSprite.width=this.shadowSprite.height=64;
    const shadow=this.shadowSprite.getContext('2d');
    const falloff=shadow.createRadialGradient(32,32,3.2,32,32,32);
    falloff.addColorStop(0,'#664237');falloff.addColorStop(1,'#66423700');
    shadow.fillStyle=falloff;shadow.fillRect(0,0,64,64);
    this.scenery=new Map();
    // Loading can observe readiness; a failed atlas uses procedural artwork.
    this.paintToy=null;
    this.ready=loadToys().then(({paint, colors})=>{
      this.houseArt.setColors(colors);
      this.paintToy=paint;
      this.scenery.clear();
      this.art='clay';
      if(this.lastGame)this.draw(this.lastGame);
      this.onReady?.();
    }).catch(()=>{this.art='fallback'; this.onReady?.();});
  }
  resize(width,height,sceneH=700){
    if(this.canvas.width===width&&this.canvas.height===height&&this.sceneH===sceneH)return;
    this.sceneH=sceneH;
    this.canvas.width=width;this.canvas.height=height;this.scenery.clear();
    if(this.lastGame)this.draw(this.lastGame,0);
  }
  round(x,y,w,h,r,fill,stroke,line=1){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
  gradient(y,h,...colors){const g=this.ctx.createLinearGradient(0,y,0,y+h);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
  text(t,x,y,size,color,weight=800){const c=this.ctx;c.fillStyle=color;c.font=`${weight} ${size}px "Arial Rounded MT Bold", "PingFang SC", system-ui, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(t,x,y);}
  shadow(x,y,rx,ry,alpha=.2){const c=this.ctx,opacity=c.globalAlpha;c.globalAlpha=opacity*alpha;c.drawImage(this.shadowSprite,x-rx,y-ry,rx*2,ry*2);c.globalAlpha=opacity;}
  drawScenery(top,height,paint){
    let layer=this.scenery.get(top);
    if(!layer){
      const ctx=this.ctx,scaleY=this.canvas.height/(this.sceneH||700);
      layer=createCanvas();
      layer.width=this.canvas.width;layer.height=Math.ceil(height*scaleY);
      this.ctx=layer.getContext('2d');
      this.ctx.setTransform(layer.width/480,0,0,scaleY,0,-top*scaleY);
      try{paint.call(this);}finally{this.ctx=ctx;}
      this.scenery.set(top,layer);
    }
    this.ctx.drawImage(layer,0,top,480,layer.height*(this.sceneH||700)/this.canvas.height);
  }
  passenger(x,y,r,color,angle=0,squash=1,shadow=true){
    const c=this.ctx;
    if(shadow)this.shadow(x+1,y+r*.8,r*1.1,r*.35,.23);
    c.beginPath();c.ellipse(x,y+r*.25,r*.9,r*.8,0,0,Math.PI*2);c.fillStyle=COLORS[color].main;c.fill();c.lineWidth=1.5;c.strokeStyle=COLORS[color].dark;c.stroke();
    c.save();c.translate(x,y);c.rotate(this.reduced?0:angle);
    c.scale(1/Math.sqrt(squash),squash);
    if(this.paintToy)this.paintToy(c,toy.employee+color,-r*1.05,-r*1.22,r*2.1,r*2.17);
    else c.drawImage(this.sprites[color],-r*1.4,-r*1.55,r*2.8,r*2.8);
    c.restore();
  }
  flower(x,y,r,petals='#fff6dc'){
    const c=this.ctx;
    for(let i=0;i<5;i++){
      const angle=i*2*Math.PI/5;
      c.beginPath();c.arc(x+Math.cos(angle)*r*.6,y+Math.sin(angle)*r*.6,r*.48,0,Math.PI*2);
      c.fillStyle=petals;c.fill();
    }
    c.beginPath();c.arc(x,y,r*.35,0,Math.PI*2);c.fillStyle='#efb154';c.fill();
  }
  tree(x,y,size){
    const c=this.ctx;c.save();c.translate(x,y);c.scale(size,size);
    if(this.paintToy){
      this.shadow(1,8,19,5,.24);
      this.paintToy(c,toy.tree,-20,-41,39,50);c.restore();return;
    }
    this.round(-3,-10,6,18,2,'#b78260');
    for(const [dx,dy,r] of [[-7,-14,9],[7,-14,9],[0,-22,11]]){
      c.beginPath();c.arc(dx,dy,r,0,Math.PI*2);c.fillStyle='#9ec897';c.fill();
    }
    this.flower(-5,-18,3.4,'#ffe5b9');c.restore();
  }
  impact(e){if(this.reduced)return;this.rings.push({...e,start:this.clock});}
  events(events){for(const e of events){
    if(e.type==='release')this.releases[e.column]={pack:e.pack,start:this.clock,firstId:e.firstId,dropped:new Set(),finishedAt:null};
    if(e.type==='drop'){
      const release=this.releases[e.column],index=e.id-(release?.firstId??-100);
      if(release&&index>=0&&index<9){release.dropped.add(index);if(release.dropped.size===9)release.finishedAt=this.clock;}
    }
    if(e.type==='collect'){this.flights.push({...e,start:this.clock});this.holeTimes[e.lane][e.hole]=this.clock+BOARDING_DURATION;}
    if(e.type==='land')this.entries.push({...e,start:this.clock});
    if(e.type==='box'){this.boxTimes[e.lane]=this.clock;this.burst(BOX_X[e.lane],558,e.color,18);}
    if(e.type==='lost')this.shake=.5;
    if(e.type==='expand'){this.labels.push({x:240,y:388,text:t('extraSlots'),color:'#1b8567',start:this.clock});this.burst(240,430,3,25);}
  }}
  burst(x,y,color,count){if(this.reduced)return;for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*(count>30?450:180),vy:-90-Math.random()*200,life:0,max:.65+Math.random()*.7,color:color<0?i%COLORS.length:color,angle:Math.random()*6,spin:(Math.random()-.5)*12});}
  clear({entrance=false}={}){this.flights=[];this.entries=[];this.particles=[];this.rings=[];this.labels=[];this.releases.fill(null);this.boxTimes.fill(-10);this.holeTimes.forEach(row=>row.fill(-10));this.boxSprings.forEach(s=>{s.y=0;s.velocity=0;});this.shake=0;this.intro=entrance?0:1;this.renderAlpha=1;}
  setScene(number){
    const theme=sceneForLevel(number);
    if(this.theme===theme)return;
    this.theme=theme;this.weatherClock=0;this.scenery.clear();
  }
  get animating(){
    return this.entries.length||this.flights.length||this.particles.length||this.rings.length||this.labels.length||
      (!this.reduced&&(!!this.theme.weather||this.intro<.62||this.shake>0||
        this.releases.some(release=>release&&this.clock-release.start<.215)||
        this.boxSprings.some(s=>Math.abs(s.y)>.05||Math.abs(s.velocity)>.05)));
  }
  draw(game,dt=0,renderAlpha=null,weatherDt=dt){
    this.setScene(game.level.number);
    this.weatherClock+=weatherDt;
    this.lastGame=game;
    if(!this.canvas.width||!this.canvas.height)return;
    if(renderAlpha!==null)this.renderAlpha=clamp(renderAlpha);
    this.clock+=dt;this.intro+=dt;this.shake=Math.max(0,this.shake-dt);
    for(const flight of this.flights){if(!flight.arrived&&this.clock-flight.start>=BOARDING_DURATION){flight.arrived=true;this.boxSprings[flight.lane].velocity+=65;this.burst(BOX_X[flight.lane]+(flight.hole-1)*21,575,flight.color,5);}}
    for(let left=dt;left>0;left-=1/120){const h=Math.min(left,1/120);for(const s of this.boxSprings){s.velocity+=(-230*s.y-24*s.velocity)*h;s.y+=s.velocity*h;}}
    const c=this.ctx;c.setTransform(this.canvas.width/480,0,0,this.canvas.height/(this.sceneH||700),0,0);c.clearRect(0,0,480,this.sceneH||700);c.save();
    if(this.shake&&!this.reduced)c.translate(Math.sin(this.clock*70)*this.shake*7,Math.cos(this.clock*55)*this.shake*3);
    const beltRadius=LENGTH/(2*game.capacity);
    this.drawRack(game);this.drawHopper(game);
    c.save();c.translate(0,(this.sceneH||700)-700);
    this.drawBelt(game,beltRadius);this.drawBoxes(game);this.drawFlights(beltRadius);c.restore();
    this.drawEffects(dt);c.restore();
  }
  tile(x,y,pack,{open=false,scale=1,visibleBalls=null,hidden=false}={}){
    const context=this.ctx;
    context.save();
    context.translate(x+35,y+32);
    context.scale(scale,scale);
    context.translate(-35,-32);
    this.shadow(35,65,34,5,open?.28:.16);
    this.houseArt.draw(context,pack,hidden,visibleBalls);
    context.restore();
  }
  drawRack(game){
    const c=this.ctx,p=this.theme;this.shadow(240,273,221,24,.22);
    this.round(20,23,440,251,20,p.rackEdge);this.round(20,15,440,251,20,this.gradient(15,251,...p.rack),p.rim,2);
    this.round(28,25,424,229,14,this.gradient(25,229,...p.inset),p.line,2);
    c.save();c.beginPath();c.roundRect(31,28,418,224,12);c.clip();
    for(let col=0;col<5;col++){
      const q=game.columns[col],x=SOURCE_X[col]-35,release=this.releases[col],age=release?this.clock-release.start:10;
      const exitAge=Math.max(0,age-.035);
      const pouring=release&&exitAge<.18;
      this.round(x-3,29,76,217,12,p.slot);
      for(let row=2;row>=0;row--){
        const y=37+(2-row)*70;
        this.round(x+1,y+1,68,62,10,p.cell,p.rim,1);this.text('·',x+35,y+30,18,'#c3a98a');
        if(q[row]===undefined)continue;
        const slide=pouring&&!this.reduced?-70*(1-ease(exitAge/.18)):0;
        const entrance=!this.reduced?(1-ease((this.intro-col*.035)/.48))*-32:0;
        let scale=1;if(row===0&&this.hover===col&&!pouring)scale=1.035;
        this.tile(x,y+slide+entrance,q[row],{open:row===0,scale,hidden:isPackHidden(q[row],row)});
      }
      if(pouring&&!this.reduced){
        const tilt=ease(age/.18)*(1-ease(exitAge/.18));c.save();c.translate(x+35,238);c.rotate(tilt*.045);c.scale(1,1-tilt*.1);c.translate(-35,-59);c.globalAlpha=1-ease(exitAge/.18);
        const visibleBalls=Array.from({length:9},(_,i)=>i).filter(i=>!release.dropped.has(i));
        this.tile(0,0,release.pack,{open:true,visibleBalls});c.restore();
      }
    }
    c.restore();
    game.columns.forEach((q,i)=>{if(q.length>3){this.round(SOURCE_X[i]+13,21,27,17,6,'#9a7561');this.text('+'+(q.length-3),SOURCE_X[i]+26,29,9,'#fff9e7');}});
    if(p.id==='garden'){this.flower(30,25,5);this.flower(450,25,5);}
    drawSceneTrim(this);
  }
  linePath(points,offset=0){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y+offset):c.moveTo(x,y+offset));}
  drawGarden(){
    const c=this.ctx,p=this.theme,groundBottom=this.sceneY(425);
    // Map the path, but keep decorative sprites and passengers undistorted.
    this.round(13,268,454,groundBottom-268,22,this.gradient(268,groundBottom-268,...p.ground));
    if(p.id==='garden'&&(this.sceneH||700)>=670){
      this.tree(65,this.sceneY(355),.83);this.tree(416,this.sceneY(344),.95);
      this.tree(98,this.sceneY(389),.57);this.tree(378,this.sceneY(387),.60);
      for(const [x,y] of [[40,375],[80,382],[119,367],[359,377],[435,373],[403,399]])this.flower(x,this.sceneY(y),4,'#fff7e8');
    }
    drawSceneDecor(this);
    c.beginPath();c.moveTo(24,this.sceneY(269));c.lineTo(456,this.sceneY(269));
    FUNNEL_RIGHT.forEach(([x,y])=>c.lineTo(x,this.sceneY(y)));
    [...FUNNEL_LEFT].reverse().forEach(([x,y])=>c.lineTo(x,this.sceneY(y)));
    c.closePath();c.fillStyle=this.gradient(268,this.sceneY(413)-268,...p.path);c.fill();
    c.save();c.clip();
    for(let i=0;i<5;i++){
      c.beginPath();c.ellipse(240+Math.sin(i*1.4)*5,this.sceneY(288+i*23),6,3.3,i%2?.4:-.4,0,Math.PI*2);
      c.fillStyle=p.mark;c.fill();
    }
    c.restore();
  }
  sceneY(y){const delta=(this.sceneH||700)-700;return y<=268?y:y>=398?y+delta:268+(y-268)*(130+delta)/130;}
  drawHopper(game){
    const c=this.ctx;
    this.drawScenery(268,this.sceneY(425)-268,this.drawGarden);
    drawWeather(this);
    this.rings=this.rings.filter(e=>this.clock-e.start<.24);
    this.rings.forEach(e=>{const t=(this.clock-e.start)/.24;c.globalAlpha=(1-t)*.35*e.force;c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.ellipse(e.x,this.sceneY(e.y)+9,10+t*10,3+t*3,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;});
    game.pending.filter(m=>m.motion).map(m=>{
      const b=m.motion,p=b.feedHeld?b:b.previous??b,t=this.renderAlpha;
      return{color:m.color,id:m.id,x:p.x+(b.x-p.x)*t,y:p.y+(b.y-p.y)*t,angle:p.angle+(b.angle-p.angle)*t};
    }).sort((a,b)=>a.y-b.y||a.id-b.id).forEach(b=>this.passenger(b.x,this.sceneY(b.y),10.1,b.color,Math.sin(b.angle)*.17,1,true));
    for(const points of [FUNNEL_LEFT,FUNNEL_RIGHT]){
      this.linePath(points.map(([x,y])=>[x,this.sceneY(y)]),3);c.lineWidth=14;c.strokeStyle=this.theme.railShadow;c.lineJoin='round';c.lineCap='round';c.stroke();
      this.linePath(points.map(([x,y])=>[x,this.sceneY(y)]));c.lineWidth=13;c.strokeStyle=this.theme.rail;c.stroke();
    }
  }
  beltPath(){const c=this.ctx;c.beginPath();c.moveTo(62,426);c.lineTo(418,426);c.arc(418,460,34,-Math.PI/2,Math.PI/2);c.lineTo(62,494);c.arc(62,460,34,Math.PI/2,Math.PI*1.5);c.closePath();}
  drawBeltSurface(){
    const c=this.ctx,p=this.theme;
    this.shadow(240,511,222,21,.22);
    this.round(29,428,422,66,32,this.gradient(428,66,...p.island));
    for(const [width,colour] of [[54,p.track[0]],[50,p.track[1]],[40,p.track[2]],[33,this.gradient(410,100,...p.road)]]){
      this.beltPath();c.lineWidth=width;c.strokeStyle=colour;c.stroke();
    }
    this.round(96,450,288,25,12,p.track[0]);
    this.round(96,447,288,25,12,this.gradient(447,25,...p.meter));
    if(p.id==='autumn'){leaf(this,65,460,.8,.3);leaf(this,415,460,.8,-.3);}
    else{this.flower(65,460,8,p.id==='garden'?'#fff6dc':p.rim);this.flower(415,460,8,p.id==='garden'?'#ffe0dd':p.rim);}
    BOX_X.forEach(x=>{
      this.round(x-13,517,26,29,4,p.line);
      for(let i=0;i<3;i++)this.round(x-10,520+i*7,20,3,1,p.rim);
    });
  }
  drawBelt(game,beltRadius){
    this.drawScenery(398,149,this.drawBeltSurface);
    const position=(m,i)=>trackPoint(m.beltPrevious===undefined?beltPosition(game,m,i):m.beltPrevious+(m.beltTravel??0)*this.renderAlpha);
    game.slots.forEach((m,i)=>{
      if(!m)return;const entry=this.entries.find(e=>e.id===m.id&&this.clock-e.start<ENTRY_DURATION);if(entry)return;
      const p=position(m,i);
      const step=this.reduced?0:Math.sin(m.walkPhase??m.id*1.73);
      const lift=step*step;
      this.shadow(p.x+1,p.y+9,beltRadius*(1.05-.12*lift),3.6,.24-.06*lift);
      this.passenger(p.x,p.y-2-lift*2.8,beltRadius,m.color,step*.14,1+.032*lift,false);
    });
    this.entries=this.entries.filter(e=>this.clock-e.start<ENTRY_DURATION);
    this.entries.forEach(e=>{
      const i=game.slots.findIndex(m=>m?.id===e.id);if(i<0)return;
      const m=game.slots[i],end=position(m,i),origin=trackPoint(0),t=clamp((this.clock-e.start)/ENTRY_DURATION),from=e.from??{x:240,y:405,angle:0};
      const blend=t*t*(3-2*t),step=this.reduced?0:Math.sin(m.walkPhase??m.id*1.73),lift=step*step;
      // Move with the belt immediately; ease only the remaining landing offset.
      // The final pose matches normal riding, including its gait and shadow.
      const x=end.x+(from.x-origin.x)*(1-blend),y=end.y+(from.y-origin.y)*(1-blend)-(2+lift*2.8)*blend;
      this.shadow(x+1,end.y+9,beltRadius*(1.05-.12*lift),3.6,(.24-.06*lift)*blend);
      this.passenger(x,y,10.1+blend*(beltRadius-10.1),e.color,step*.14*blend,1+.032*lift*blend,false);
    });
  }
  drawBus(x,y,bus,fullAge){
    const c=this.ctx,p=COLORS[bus.color];
    const lit=bus.filled===3&&fullAge>.36;
    if(this.paintToy){
      this.shadow(x+47,y+74,47,8,.31);
      this.paintToy(c,toy.shuttle+bus.color,x-3,y-2,98,78);
      c.save();c.beginPath();c.roundRect(x+10,y+12,72,31,7);c.clip();
      for(let seat=0;seat<bus.filled;seat++){
        const age=this.clock-this.holeTimes[bus.lane][seat];
        if(age<0)continue;
        const settle=this.reduced?0:Math.sin(clamp(age/.25)*Math.PI*2)*Math.exp(-age*14);
        this.passenger(x+46+(seat-1)*21,y+31+settle*1.8,11.8,bus.color,0,1-settle*.13,false);
      }
      c.restore();
      this.round(x+9,y+49,74,19,6,p.main,p.dark,2);
      this.round(x+17,y+48,60,22,7,'#fffdf3');
      this.busPortrait(x+29,y+58,22,bus.color);
      this.text(bus.filled+' / 3',x+57,y+59,11,'#302e36');
      if(lit&&!this.reduced){
        const pulse=Math.sin(clamp((fullAge-.35)/.75)*Math.PI);
        c.save();c.globalAlpha*=pulse;c.shadowColor='#ffc664';c.shadowBlur=6;
        for(const dx of [13,79])this.round(x+dx-3,y+53,6,6,3,'#fff4b6');c.restore();
      }
      return;
    }
    for(const dx of [6,74])this.round(x+dx,y+56,13,19,5,'#785e57','#684f49');
    this.round(x+1,y+4,90,64,14,p.dark,p.dark);
    this.round(x,y,92,65,14,p.light,p.dark,1.6);
    this.round(x+5,y+6,82,37,10,this.gradient(y+6,37,'#b2c8b9','#ccdccc'),'#fff9e9',2);
    for(let seat=0;seat<3;seat++){
      const sx=x+46+(seat-1)*24;
      this.round(sx-9,y+19,18,20,5,'#e8e3cf','#acb79e');
      const boarding=this.flights.some(f=>f.lane===bus.lane&&f.hole===seat&&this.clock-f.start<BOARDING_DURATION);
      if(seat<bus.filled&&!boarding)this.passenger(sx,y+25,11,bus.color,0,1,false);
    }
    this.round(x-3,y+18,5,15,2,p.main);this.round(x+90,y+18,5,15,2,p.main);
    this.round(x+4,y+42,84,4,2,p.main);
    this.round(x+21,y+45,50,18,5,'#fff9e6');
    this.busPortrait(x+31,y+53,19,bus.color);this.text(bus.filled+' / 3',x+55,y+54,10,'#364755');
    for(const dx of [7,73]){
      if(lit&&!this.reduced){c.save();c.shadowColor='#ffef81';c.shadowBlur=9;}
      this.round(x+dx,y+49,12,7,3,lit?'#fff4a1':'#fff5da','#d9c590');
      if(lit&&!this.reduced)c.restore();
    }
    this.round(x+13,y+63,66,3,2,p.main);
  }
  busPortrait(x,y,size,color){
    // Reuse the passenger's exact portrait; one quiet badge, no extra animation.
    const c=this.ctx;c.save();
    c.beginPath();c.arc(x,y,size*.5,0,Math.PI*2);c.fillStyle='#fffdf3';c.fill();
    if(this.paintToy)this.paintToy(c,toy.employee+color,x-size/2,y-size/2,size,size);
    else c.drawImage(this.sprites[color],x-size*.57,y-size*.59,size*1.14,size*1.14);
    c.restore();
  }
  previewBus(x,y,color){
    if(this.paintToy){
      this.round(x+7,y+4,66,16,5,COLORS[color].main,COLORS[color].dark,2);
      this.shadow(x+40,y+18,31,4,.19);
      this.paintToy(this.ctx,toy.nextShuttle+color,x+8,y-2,65,24);
      this.busPortrait(x+40,y+9,16,color);
      return;
    }
    const p=COLORS[color];
    this.round(x+10,y+14,9,7,3,'#806359');this.round(x+61,y+14,9,7,3,'#806359');
    this.round(x,y,80,17,5,p.light,p.dark);
    for(let i=0;i<4;i++)this.round(x+9+i*16,y+3,12,7,2,'#e6efde','#b1bda4',.65);
    this.round(x+69,y+11,5,3,1,'#fff5bd');
    this.busPortrait(x+40,y+8,16,color);
  }
  drawBoxes(game){
    const c=this.ctx;
    for(let lane=0;lane<4;lane++){
      const x=BOX_X[lane]-46,bus=game.boxes[lane],age=this.clock-this.boxTimes[lane];
      this.round(x-2,549,96,150,15,this.gradient(549,150,...this.theme.bay),this.theme.line);
      const fullAge=bus?.filled===3?(1-bus.timer/DEPARTURE_DURATION)*1.15:0;
      // Keep the third preview within the existing playfield during arrival.
      const queueShift=this.reduced?0:age<.4?3*(1-ease(age/.4)):-12*ease((fullAge-.77)/.38);
      for(let row=2;row>=0;row--){
        const color=game.busLanes[lane][row];
        if(color!==undefined)this.previewBus(x+6,625+row*24+queueShift,color);
      }
      if(!bus){this.text('✓',x+46,580,23,'#7898a3');continue;}
      c.save();
      if(!this.reduced){
        c.translate(0,this.boxSprings[lane].y);
        if(fullAge>.36){
          const crouch=Math.sin(clamp((fullAge-.36)/.22)*Math.PI);
          const hop=Math.sin(clamp((fullAge-.56)/.39)*Math.PI);
          const launch=clamp((fullAge-.78)/.37)**2;
          const turn=lane%2 ? 1 : -1;
          c.translate(x+46+turn*(5*hop+13*launch),611+9*crouch-29*hop-68*launch);
          c.rotate(turn*(.11*hop+.16*launch));
          c.scale(1+.16*crouch-.09*hop,1-.22*crouch+.18*hop);
          c.translate(-x-46,-611);c.globalAlpha=1-launch;
        }else if(age<.4){
          const arrive=spring(age/.4);
          c.translate(x+46,610+40*(1-arrive));
          c.scale(.78+.22*arrive,.84+.16*arrive);c.translate(-x-46,-610);
          c.globalAlpha=clamp(age/.13);
        }
      }
      this.drawBus(x,544,bus,fullAge);c.restore();
      if(!this.reduced&&fullAge>.75){
        const boost=clamp((fullAge-.75)/.4);
        c.save();c.globalAlpha=Math.sin(boost*Math.PI)*.85;
        const ribbons=['#edada9','#edc575','#99c6af'];
        ribbons.forEach((colour,index)=>{
          const startX=x+34+index*11;
          c.beginPath();c.moveTo(startX,603-boost*33);
          c.bezierCurveTo(startX-7,613-boost*20,startX+9,621,startX+2,625+boost*10);
          c.lineWidth=6;c.lineCap='round';c.strokeStyle=colour;c.stroke();
        });
        this.flower(x+17-boost*6,604-boost*20,4+boost*2);
        this.flower(x+76+boost*6,591-boost*20,3+boost*2,'#ffe1d5');
        c.restore();
      }
    }
  }
  drawFlights(beltRadius){
    const seatRadius=this.paintToy?11.8:11;
    this.flights=this.flights.filter(f=>this.clock-f.start<BOARDING_DURATION);
    this.flights.forEach(f=>{
      const t=clamp((this.clock-f.start)/BOARDING_DURATION),p=trackPoint(f.at);
      const endX=BOX_X[f.lane]+(f.hole-1)*(this.paintToy?21:24),endY=this.paintToy?575:568;
      const drift=t*t*(3-2*t);
      const arc=this.reduced?0:Math.sin(t*Math.PI);
      const startY=p.y-2;
      const x=p.x+(endX-p.x)*drift, ground=startY+(endY-startY)*drift;
      this.shadow(x,ground+9,10-arc*3,3,.17-.08*arc);
      this.passenger(x,ground-arc*23,beltRadius+(seatRadius-beltRadius)*drift,f.color,arc*(f.hole-1)*.22,1+arc*.085,false);
    });
  }
  drawEffects(dt){
    const c=this.ctx;
    this.particles=this.particles.filter(p=>p.life<p.max);
    for(const p of this.particles){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=380*dt;p.angle+=p.spin*dt;c.save();c.globalAlpha=clamp((p.max-p.life)*2);c.translate(p.x,this.sceneY(p.y));c.rotate(p.angle);if(p.spin>0){
        c.fillStyle='#ffdc90';c.beginPath();
        c.moveTo(0,-5);c.quadraticCurveTo(.8,-.8,4,0);c.quadraticCurveTo(.8,.8,0,5);
        c.quadraticCurveTo(-.8,.8,-4,0);c.quadraticCurveTo(-.8,-.8,0,-5);c.fill();
      }else this.flower(0,0,3.5,COLORS[p.color].light);c.restore();}
    this.labels=this.labels.filter(l=>this.clock-l.start<(l.big?2:1));
    for(const l of this.labels){const t=this.clock-l.start,alpha=clamp((1-t)*3);c.save();c.globalAlpha=alpha;c.translate(l.x,this.sceneY(l.y)-ease(t)*28);const scale=this.reduced?1:spring(clamp(t/.28));c.scale(scale,scale);c.lineWidth=l.big?6:3;c.strokeStyle=l.big?'#365a77':'#ffffff';c.font=`900 ${l.big?36:12}px "Arial Rounded MT Bold", "PingFang SC", system-ui`;c.textAlign='center';c.textBaseline='middle';c.strokeText(l.text,0,0);c.fillStyle=l.color;c.fillText(l.text,0,0);c.restore();}
  }
}
