// Scenery is cosmetic: level generation, animal colours and collision paths
// remain independent of the season. A retry always returns to the same map.
export const SCENES = [
  {id:'garden',name:'晴日小镇',weather:null,
    page:'#fff1da',check:'#efcda72b',panel:['#fffaed','#fff1dc','#f8e5c9'],
    rack:['#ffe8cf','#f4d0b0'],rackEdge:'#d7b09b',inset:['#dfc3a9','#efddc2'],slot:'#e4cfb4',cell:'#eddbc4',line:'#d6b798',rim:'#fff8e9',
    ground:['#f2f3d9','#dfebca','#cddfbc'],path:['#e8cfad','#faeace','#ffeccf'],mark:'#dfbe9d',rail:'#fff1d7',railShadow:'#cbaa8e',
    island:['#9fb88b','#d9e8ba','#bacf9e'],track:['#cba88a','#ffefd2','#e6bba4'],road:['#f1cdb5','#fae2cf','#f8d9c0'],meter:['#76926d','#62805b'],bay:['#e3c7b2','#fae9d4','#ecd3ba']},
  {id:'snow',name:'雪松小站',weather:'snow',
    page:'#dceaf2',check:'#aac7dc25',panel:['#f5fbff','#e8f2f6','#d5e5ef'],
    rack:['#eff8fc','#c9dfeb'],rackEdge:'#9dbbce',inset:['#b3cbd9','#dceaf0'],slot:'#c4d9e5',cell:'#e1edf3',line:'#aac5d6',rim:'#ffffff',
    ground:['#edf6fb','#deedf2','#bdd6e1'],path:['#d5e3e8','#edf5f6','#f8fbf7'],mark:'#b4cbd5',rail:'#ffffff',railShadow:'#9ab8ca',
    island:['#96bec7','#d8ebee','#afced9'],track:['#9ab5c9','#f9fdff','#bdd3e1'],road:['#d6e6ed','#f4fafc','#dceaf3'],meter:['#648798','#4d7083'],bay:['#b9cfdd','#eef6f8','#ccdee8']},
  {id:'rain',name:'雨巷花园',weather:'rain',
    page:'#d9e7e5',check:'#8daeb52a',panel:['#f0f7f3','#e0eeea','#c9dddc'],
    rack:['#dfefeb','#b8d1cf'],rackEdge:'#8facad',inset:['#a7c3c0','#d0e2d9'],slot:'#b9d2c9',cell:'#dce9de',line:'#98b5b2',rim:'#f4fcf5',
    ground:['#dbe9d9','#bcd5c5','#97bbaf'],path:['#c4d4d4','#e2ebe6','#d5e3de'],mark:'#9bb9b9',rail:'#ecf6ed',railShadow:'#88aaa7',
    island:['#87b3a7','#c2dbcd','#9fc5b8'],track:['#829fa4','#e9f5ef','#9fbfc3'],road:['#b6d0d1','#d8e8e5','#bfd9d7'],meter:['#587e7b','#3e6566'],bay:['#a7c4c3','#e1eee5','#bdd7ce']},
  {id:'autumn',name:'枫叶黄昏',weather:'leaves',
    page:'#f4dfca',check:'#dcac9d2b',panel:['#fff5e4','#f6e5cc','#edcdb9'],
    rack:['#ffe7c8','#eac09f'],rackEdge:'#c18f79',inset:['#d5b392','#efdbb9'],slot:'#e2c4a0',cell:'#f3dfbd',line:'#cba98b',rim:'#fff5de',
    ground:['#f7e7bf','#e8c993','#d5ad7a'],path:['#e5c6a2','#f6e4c9','#f7e7d5'],mark:'#cca17e',rail:'#fff1d8',railShadow:'#c1987a',
    island:['#c5a479','#ead3a4','#d4b384'],track:['#bb917c','#fff0d5','#d8ad94'],road:['#edc6ad','#f9e2cb','#f1cdb7'],meter:['#967451','#795a42'],bay:['#dbb99d','#f9e8cf','#e8c6a8']},
];

export function sceneForLevel(number){
  return SCENES[(Math.max(1,Math.floor(Number(number)||1))-1)%SCENES.length];
}

function oval(v,x,y,rx,ry,fill){
  const c=v.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();
}

function pine(v,x,y,s){
  const c=v.ctx;c.save();c.translate(x,y);c.scale(s,s);
  v.shadow(0,6,23,6,.18);v.round(-4,-8,8,16,3,'#a08372');
  for(const [top,w,h] of [[-37,24,36],[-51,20,32],[-62,14,28]]){
    c.beginPath();c.moveTo(0,top);c.quadraticCurveTo(-w*.5,top+h*.5,-w,top+h);
    c.quadraticCurveTo(0,top+h+8,w,top+h);c.quadraticCurveTo(w*.5,top+h*.5,0,top);
    c.fillStyle=v.gradient(top,h,'#86b8ac','#4f8b80');c.fill();
    c.beginPath();c.moveTo(0,top-2);c.quadraticCurveTo(-w*.4,top+h*.24,-w*.66,top+h*.6);
    c.quadraticCurveTo(-w*.3,top+h*.72,0,top+h*.58);c.quadraticCurveTo(w*.4,top+h*.75,w*.66,top+h*.6);
    c.quadraticCurveTo(w*.4,top+h*.25,0,top-2);c.fillStyle='#f4fbff';c.fill();
  }
  oval(v,0,9,16,4,'#f7fcff');c.restore();
}

function snowman(v,x,y,s){
  const c=v.ctx;c.save();c.translate(x,y);c.scale(s,s);v.shadow(0,9,18,5,.16);
  oval(v,0,-1,13,15,v.gradient(-17,30,'#ffffff','#d3e6f0'));
  oval(v,0,-21,10,10,'#fbfdff');v.round(-11,-15,22,5,2,'#cb7f74');v.round(5,-12,5,11,2,'#cb7f74');
  v.round(-9,-35,18,8,4,'#62899b');v.round(-12,-29,24,4,2,'#4e7186');
  oval(v,-3,-23,1.2,1.2,'#526779');oval(v,4,-23,1.2,1.2,'#526779');
  c.beginPath();c.moveTo(0,-20);c.lineTo(10,-18);c.lineTo(0,-17);c.fillStyle='#e8a063';c.fill();
  oval(v,0,-5,1.4,1.4,'#708d9e');oval(v,0,2,1.4,1.4,'#708d9e');c.restore();
}

function puddle(v,x,y,s){
  oval(v,x,y,23*s,7*s,'#88b4bd');oval(v,x,y-1,20*s,5*s,'#b7d8dc');
  const c=v.ctx;c.beginPath();c.ellipse(x-2*s,y-1,13*s,3*s,0,Math.PI,Math.PI*1.8);c.strokeStyle='#edf9f5';c.lineWidth=1.4;c.stroke();
}

function umbrella(v,x,y,s){
  const c=v.ctx;c.save();c.translate(x,y);c.scale(s,s);v.shadow(0,13,23,5,.15);
  c.beginPath();c.moveTo(0,-15);c.lineTo(0,10);c.quadraticCurveTo(0,19,7,13);c.strokeStyle='#657d7a';c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(-25,-14);c.quadraticCurveTo(-22,-36,0,-38);c.quadraticCurveTo(23,-36,25,-14);
  c.quadraticCurveTo(13,-20,8,-13);c.quadraticCurveTo(0,-19,-8,-13);c.quadraticCurveTo(-17,-20,-25,-14);c.fillStyle=v.gradient(-38,25,'#f7d990','#dfb66b');c.fill();
  c.beginPath();c.moveTo(-8,-14);c.quadraticCurveTo(-10,-29,0,-38);c.quadraticCurveTo(10,-29,8,-14);c.strokeStyle='#fff1bf';c.lineWidth=1.5;c.stroke();c.restore();
}

function maple(v,x,y,s){
  const c=v.ctx;c.save();c.translate(x,y);c.scale(s,s);v.shadow(0,9,24,6,.2);
  v.round(-4,-31,8,42,3,'#a77b59');
  for(const [dx,dy,r,col] of [[-13,-29,14,'#d88b58'],[12,-32,16,'#d07753'],[-9,-46,15,'#efb56a'],[8,-49,15,'#eaa365'],[0,-35,18,'#e59a5e']]){
    oval(v,dx,dy,r,r,v.gradient(dy-r,r*2,'#f4c484',col));
  }
  oval(v,-13,-49,5,3,'#ffdc9c');oval(v,0,11,16,4,'#e9c38f');c.restore();
}

function lamp(v,x,y,s){
  const c=v.ctx;c.save();c.translate(x,y);c.scale(s,s);v.shadow(0,7,11,4,.18);
  const glow=c.createRadialGradient(0,-29,1,0,-29,30);glow.addColorStop(0,'#fff4bf99');glow.addColorStop(1,'#fff4bf00');
  oval(v,0,-29,30,30,glow);v.round(-2,-26,4,33,2,'#887764');v.round(-7,4,14,4,2,'#887764');
  v.round(-8,-40,16,20,5,'#947d65');v.round(-5,-37,10,14,3,v.gradient(-37,14,'#fff8cf','#f7d78e'));
  v.round(-10,-42,20,4,2,'#88715d');c.restore();
}

export function leaf(v,x,y,s,angle=0){
  const c=v.ctx;c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
  c.beginPath();c.moveTo(0,-7);c.lineTo(3,-3);c.lineTo(6,-4);c.lineTo(5,0);c.lineTo(8,1);c.lineTo(2,5);c.lineTo(0,7);c.lineTo(-2,5);c.lineTo(-7,1);c.lineTo(-4,0);c.lineTo(-5,-4);c.lineTo(-2,-3);c.closePath();c.fillStyle='#c68150';c.fill();
  c.beginPath();c.moveTo(0,-3);c.lineTo(0,8);c.strokeStyle='#f6d5a0';c.lineWidth=.9;c.stroke();c.restore();
}

export function drawSceneDecor(v){
  const id=v.theme.id,sy=y=>v.sceneY(y),compact=(v.sceneH||700)<670;
  // Small screens retain a recognisable silhouette without squeezing sprites.
  const s=compact?.54:1.04;
  if(id==='snow'){
    for(const [x,y,r] of [[56,385,31],[409,373,35],[124,400,24],[356,402,28]])oval(v,x,sy(y),r,compact?4:7,'#f7fcff');
    pine(v,64,sy(373),s);pine(v,413,sy(365),s*1.12);
    if(!compact){pine(v,104,sy(389),.52);snowman(v,365,sy(382),.92);}
  }else if(id==='rain'){
    puddle(v,73,sy(391),.95);puddle(v,397,sy(385),.85);
    v.tree(420,sy(360),s);umbrella(v,64,sy(368),s);
    for(const [x,y] of [[104,391],[372,378]]){
      oval(v,x,sy(y)+4,14,4,'#719e87');
      v.flower(x-6,sy(y)-1,6,'#b9c5e8');v.flower(x+3,sy(y)-4,7,'#ced5ef');v.flower(x+9,sy(y)+1,5,'#a8b9dc');
    }
  }else if(id==='autumn'){
    maple(v,65,sy(372),s);maple(v,413,sy(364),s*1.08);
    if(!compact){lamp(v,367,sy(382),1);v.round(94,sy(386),35,5,2,'#ac7958');v.round(98,sy(386)+5,3,7,1,'#976c53');v.round(122,sy(386)+5,3,7,1,'#976c53');}
    for(const [x,y,a] of [[43,396,.3],[90,378,1.1],[139,400,2],[344,405,.6],[397,390,1.8],[439,386,2.5]])leaf(v,x,sy(y),.6,a);
  }
}

export function drawSceneTrim(v){
  if(v.theme.id!=='snow')return;
  v.round(29,15,422,6,3,'#f9fdff');
  for(const [x,h] of [[44,10],[102,8],[348,9],[428,12]])v.round(x,17,5,h,2,'#f9fdff');
}

export function drawWeather(v){
  if(!v.theme.weather||v.reduced)return;
  const c=v.ctx,time=v.weatherClock,top=274,bottom=v.sceneY(417),h=bottom-top;
  if(h<=0)return;
  c.save();c.beginPath();c.roundRect(16,top,448,h,15);c.clip();
  const rain=v.theme.weather==='rain',snow=v.theme.weather==='snow',count=rain?36:snow?26:9;
  for(let i=0;i<count;i++){
    const x=22+((i*97+Math.sin(time*.55+i)*12+(rain?-time*18:time*5))%436+436)%436;
    const y=top+((i*47+time*(rain?175:snow?18:12))%h+h)%h;
    // Weather sits behind the animals, with a quieter central route.
    c.globalAlpha=(x>150&&x<330)?.23:.66;
    if(rain){c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+9);c.strokeStyle='#6c9eac';c.lineWidth=1.2;c.stroke();}
    else if(snow)oval(v,x,y,1.3+i%3*.45,1.3+i%3*.45,'#ffffff');
    else leaf(v,x,y,.45+(i%3)*.08,time*.5+i);
  }
  if(rain){
    for(let i=0;i<4;i++){
      const p=(time*.7+i*.27)%1;c.globalAlpha=(1-p)*.4;c.beginPath();
      c.ellipse(i%2?397:73,v.sceneY(i%2?385:391),3+p*14,1+p*4,0,0,Math.PI*2);c.lineWidth=1;c.strokeStyle='#f1fbfa';c.stroke();
    }
  }
  c.restore();
}
