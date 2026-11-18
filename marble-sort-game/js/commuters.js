// Paint each commuter once at sprite resolution. The belt only transforms bitmaps.
export function makeCommuter(palette, index) {
  const species = ['rabbit','penguin','shiba','frog','cat','fox','seal','owl','panda','koala','raccoon','bear'][index];
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 144;
  const pen = sprite.getContext('2d');
  pen.scale(1.44,1.44);
  const ink = '#353747';
  const cream = '#fff7e9';
  function oval(x,y,rx,ry,fill,angle=0,outline=false) {
    pen.beginPath();
    pen.ellipse(x,y,rx,ry,angle,0,Math.PI*2);
    pen.fillStyle=fill; pen.fill();
    if(outline){pen.lineWidth=1.8;pen.strokeStyle=palette.dark;pen.stroke();}
  }
  function shape(points,fill) {
    pen.beginPath();
    for(const [i,point] of points.entries()) i ? pen.lineTo(...point) : pen.moveTo(...point);
    pen.closePath();pen.fillStyle=fill;pen.fill();
  }
  const coat=pen.createLinearGradient(0,32,0,91);
  coat.addColorStop(0,palette.light); coat.addColorStop(.72,palette.main); coat.addColorStop(1,palette.main);
  if(species==='rabbit'){
    for(const side of [-1,1]){
      oval(50+side*17,25,9,22,cream,side*.18,true);
      oval(50+side*17,24,4,15,'#f5a9c0',side*.18);
    }
  }
  if(['shiba','cat','fox','owl','raccoon'].includes(species)){
    for(const side of [-1,1]){
      pen.save();pen.translate(50,0);pen.scale(side,1);
      shape([[12,36],[28,11],[33,42]],palette.dark);
      shape([[18,34],[27,20],[29,38]],palette.light);pen.restore();
    }
  }
  if(['bear','koala','panda','frog'].includes(species)){
    for(const side of [-1,1]){
      oval(50+side*25,35,12,13,coat,0,true);
      if(species!=='frog')oval(50+side*25,35,7,7,species==='panda'?ink:palette.light);
    }
  }
  oval(50,62,35,29,species==='rabbit'||species==='panda'?cream:coat,0,true);
  if(['penguin','owl','shiba','fox','raccoon'].includes(species)){
    oval(40,64,13,16,cream,-.27);oval(60,64,13,16,cream,.27);
    oval(50,72,22,12,cream);
  }
  if(['bear','seal','koala'].includes(species))oval(50,72,16,11,cream);
  if(species==='panda'||species==='raccoon'){
    oval(36,60,9,8,ink,-.4);oval(64,60,9,8,ink,.4);
  }
  for(const side of [-1,1]){
    const x=50+side*13,y=60;
    oval(x,y,4.6,5.3,ink);oval(x-1,y-2,1.35,1.45,'white');
    oval(50+side*23,70,6.4,3.5,'#f3a6ae');
  }
  if(species==='penguin'||species==='owl')shape([[44,66],[56,66],[50,74]],'#eeb24f');
  else{
    if(species!=='frog')oval(50,66,species==='koala'?5:3,species==='koala'?6:2.4,ink);
    pen.beginPath();pen.moveTo(45,71);pen.quadraticCurveTo(50,77,55,71);
    pen.lineWidth=2;pen.lineCap='round';pen.strokeStyle=ink;pen.stroke();
  }
  oval(50,88,16,5,palette.dark);
  shape([[38,84],[49,87],[45,92]],cream);shape([[62,84],[51,87],[55,92]],cream);
  shape([[48,87],[52,87],[53,93],[50,96],[47,93]],palette.main);
  return sprite;
}
