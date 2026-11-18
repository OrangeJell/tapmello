import { centroid, fitsInside, positionOf, polygonsOverlap, worldContour, bounds, polygonCovers } from '../js/geometry.js';
import { BOARD } from '../js/config.js';

// Each motif names the region order, silhouette vocabulary and crossing angles.
// Coordinates are authored anchors, not a random full-screen pile.
export const DESIGNS = [
  {count:15,title:'firstTwist',theme:['leaf','ellipse','rounded'],anchors:[[90,112],[266,137],[184,259],[89,386],[273,391]],route:[0,1,2,3,4,2],angles:[-12,14,0,-20,18],pressure:3},
  {count:75,title:'glassGarden',theme:['leaf','flower','petal'],anchors:[[91,106],[265,126],[167,242],[93,377],[274,388]],route:[0,3,2,1,4,2],angles:[-28,24,-12,32,-18],pressure:4},
  {count:90,title:'glassNumbers',theme:['digit1','digit2','digit3','digit5','digit7'],anchors:[[99,115],[260,154],[105,305],[255,383],[180,242]],route:[0,2,4,1,3,4],angles:[-8,12,-12,8,0],pressure:4},
  {count:105,title:'glassTides',theme:['wave','crescent','drop'],anchors:[[100,100],[259,170],[91,269],[255,360],[134,406]],route:[0,1,2,3,4,2],angles:[-22,18,-30,24,-12],pressure:4},
  {count:120,title:'glassBridges',theme:['bar','u','trapezoid'],anchors:[[83,121],[271,121],[86,354],[272,365],[180,245]],route:[0,2,4,1,3,4],angles:[12,-14,25,-24,0],pressure:4},
  {count:150,title:'glassOrbits',theme:['star','diamond','crescent'],anchors:[[180,113],[82,225],[277,231],[111,390],[270,379]],route:[0,1,3,2,4,0],angles:[0,-24,24,14,-16],pressure:4},
  {count:150,title:'glassLabyrinth',theme:['l','t','u'],anchors:[[93,111],[267,115],[93,281],[265,294],[177,400]],route:[0,2,4,3,1,2],angles:[0,90,180,-90,0],pressure:4},
  {count:165,title:'glassWeave',theme:['leaf','wave','bar'],anchors:[[93,107],[266,177],[90,290],[270,397],[170,240]],route:[0,3,4,1,2,4],angles:[-36,34,-28,32,-16],pressure:4},
  {count:165,title:'glassPrism',theme:['diamond','triangle','hexagon'],anchors:[[175,99],[81,214],[277,215],[95,384],[270,388]],route:[0,1,4,2,3,0],angles:[0,22,-24,14,-14],pressure:4},
  {count:180,title:'glassSummit',theme:['flower','digit2','hexagon','leaf','digit5','diamond'],anchors:[[91,116],[267,120],[176,247],[90,386],[272,383]],route:[0,1,2,4,3,2],angles:[-16,12,0,24,-20],pressure:4},
  {count:183,title:'glassAurora',theme:['leaf','wave','diamond'],anchors:[[96,108],[259,162],[170,249],[99,382],[265,391]],route:[0,3,1,4,2,0],angles:[-24,20,-12,28,-18],pressure:4,challenge:{warmup:6,future:4,reliefEvery:48,reliefMoves:5,preloadEvery:2}},
  {count:186,title:'glassEclipse',theme:['crescent','star','hexagon'],anchors:[[176,108],[91,219],[266,211],[109,379],[263,388]],route:[0,4,1,3,2,0],angles:[-18,26,-24,12,-10],pressure:4,difficulty:'extreme',challenge:{warmup:5,future:5,reliefEvery:72,reliefMoves:2,preloadEvery:1}},
  {count:189,title:'glassSwitchbacks',theme:['l','t','u','trapezoid'],anchors:[[94,113],[264,133],[174,244],[91,376],[269,378]],route:[0,4,2,1,3,4],angles:[0,90,180,-90,12],pressure:4,challenge:{warmup:5,future:5,reliefEvery:54,reliefMoves:4,preloadEvery:2}},
  {count:192,title:'glassSupernova',theme:['star','diamond','flower','crescent'],anchors:[[174,101],[89,214],[268,225],[109,384],[261,378]],route:[0,3,2,4,1,3],angles:[-12,30,-28,18,-20],pressure:4,difficulty:'extreme',challenge:{warmup:5,future:6,reliefEvery:90,reliefMoves:1,preloadEvery:1}},
  {count:195,title:'glassCrown',theme:['triangle','hexagon','leaf','digit2','diamond'],anchors:[[95,117],[263,141],[176,246],[98,379],[268,387]],route:[0,4,1,3,2,4],angles:[-20,16,-8,26,-24],pressure:4,challenge:{warmup:4,future:6,reliefEvery:60,reliefMoves:3,preloadEvery:2}},
];
// Targets use the reference route's tray occupancy and four greedy strategies,
// not player win rates. Odd levels rise steadily; even levels are pressure peaks.
export const CALIBRATION = {
  11:{highPressure:.63,greedyProgress:.23},
  12:{highPressure:.74,greedyProgress:.21},
  13:{highPressure:.71,greedyProgress:.24},
  14:{highPressure:.80,greedyProgress:.19},
  15:{highPressure:.76,greedyProgress:.22},
};
const paints=['aqua','yellow','rose','lime'];
const round=n=>Math.round(n*100)/100;
const sizeCycle=['large','medium','small','medium','small','large','medium','small','medium','small','large','medium','small','medium','medium','large','medium','small','medium','small'];
const simple=['rounded','ellipse','bar','hexagon'];

function pinsFor(board,count,spacing) {
  const center=centroid(board);
  if(count===1&&fitsInside(board,center,18))return [{x:round(center.x),y:round(center.y)}];
  const candidates=[];
  for(let y=-board.height/2+20;y<=board.height/2-20;y+=8)for(let x=-board.width/2+20;x<=board.width/2-20;x+=8) {
    const p={x:round(x),y:round(y)};if(fitsInside(board,p,18))candidates.push(p);
  }
  // Try several seeds so narrow themed silhouettes can keep the same spacing.
  const seeds=[...candidates].sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y));
  for(const seed of [seeds[0],candidates[0],candidates.at(-1),...seeds.filter((_,i)=>i%19===0)].filter(Boolean)) {
    const chosen=[seed];
    while(chosen.length<count) {
      const ranked=candidates.map(p=>({p,d:Math.min(...chosen.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))})).filter(v=>v.d>=spacing);
      // Prefer normal screw spacing over filling opposite corners of large plates.
      ranked.sort((a,b)=>Math.abs(a.d-spacing-3)-Math.abs(b.d-spacing-3)||a.p.y-b.p.y);
      if(!ranked.length)break;chosen.push(ranked[0].p);
    }
    if(chosen.length===count)return chosen;
  }
  return null;
}
function inventory(total) {
  const n=Math.round(total/2.65),remaining={small:Math.round(n*.35),large:Math.round(n*.2)};
  remaining.medium=n-remaining.small-remaining.large;
  const items=[];
  for(let i=0;items.length<n;i++) {
    const size=sizeCycle[i%sizeCycle.length];if(!remaining[size])continue;
    remaining[size]--;items.push({size,count:size==='small'?1:size==='medium'?3:5});
  }
  let delta=total-items.reduce((n,b)=>n+b.count,0);
  while(delta)for(const item of items) {
    const min=item.size==='small'?1:item.size==='medium'?2:4,max=item.size==='small'?2:item.size==='medium'?4:7;
    if(delta>0&&item.count<max){item.count++;delta--;}
    else if(delta<0&&item.count>min){item.count--;delta++;}
    if(!delta)break;
  }
  return items;
}
export function authoredLevels({from=1}={}) {
  return DESIGNS.slice(from-1).map((design,index)=>{
    const id=index+from,boards=[];
    const contactGroups=id===1?1:3;
    const ordinary=inventory(design.count-contactGroups*6),items=[];
    // Three authored contact islands, one per stage. A narrow lower bridge
    // supports the upper gate; its screws remain accessible at the contact rim.
    for(let stage=0;stage<contactGroups;stage++) {
      const from=Math.floor(stage*ordinary.length/contactGroups),to=Math.floor((stage+1)*ordinary.length/contactGroups);
      items.push(...ordinary.slice(from,to));
      items.push({size:'medium',count:2,contact:stage,part:'pendulum'}, {size:'large',count:3,contact:stage,part:'support'}, {size:'small',count:1,contact:stage,part:'stopper'});
    }
    const contactLayers=new Map();
    for(const [i,item] of items.entries()) {
      const region=design.route[i%design.route.length],wave=Math.floor(i/design.route.length);
      const themed=i%2===1||(i>=items.length-6&&item.size!=='small');
      let shape=themed?design.theme[(Math.floor(i/2)+wave)%design.theme.length]:simple[(i+wave)%simple.length];
      if(item.size==='small') {
        const smallThemes=design.theme.filter(s=>['leaf','flower','petal','drop','star','diamond','hexagon','triangle'].includes(s));
        shape=themed?(id===3?'digit1':smallThemes[wave%smallThemes.length]||'ellipse'):'ellipse';
      }
      if(id===3&&i===31)shape='digit7';
      if(item.part==='support')shape='bar';
      if(item.part==='pendulum')shape=id===2?'leaf':id===3?'digit1':id===4?'drop':id===6?'diamond':'rounded';
      if(item.part==='stopper')shape=id===2?'flower':'ellipse';
      const spacing=62+(i*3+id)%9;
      const base=item.size==='small'?[78,82]:item.size==='medium'?[148,154]:[218,202];
      if(['bar','wave'].includes(shape)){base[0]*=1.24;base[1]*=.62;}
      if(shape==='leaf'){base[0]*=1.22;base[1]*=.78;}
      if(shape.startsWith('digit')){base[0]*=.94;base[1]*=1.18;}
      let board,pins;
      for(let attempt=0;attempt<12;attempt++) {
        const factor=1+attempt*.08;
        board={id:`p${i}`,shape,width:round(base[0]*factor),height:round(base[1]*factor),x:0,y:0,angle:design.angles[(region+wave)%design.angles.length],flipX:false,paint:paints[(region+wave+id)%4],z:i,region,size:item.size,role:item.size==='small'?'cap':item.size==='large'?'bridge':'gate',stage:Math.min(2,Math.floor(i/items.length*3)),pinSpacing:spacing};
        const box=bounds(worldContour(board));
        if(box.maxX-box.minX>BOARD.width-20||box.maxY-box.minY>BOARD.height-20)break;
        pins=pinsFor(board,item.count,spacing);if(pins)break;
      }
      if(!pins)throw Error(`Cannot fit ${id}/${i}/${shape}/${item.count}`);
      if(item.contact!==undefined) {
        const mirror=item.contact%2===1;
        Object.assign(board,item.part==='support'?{width:244,height:54,x:180,y:292,angle:0}:item.part==='pendulum'?{width:156,height:110,x:mirror?232:128,y:185,angle:mirror?-8:8}:{width:70,height:70,x:mirror?80:280,y:211,angle:0});
        pins=pinsFor(board,item.count,62);
        if(!pins){board.shape='rounded';pins=pinsFor(board,item.count,62);}
        const layer=contactLayers.get(item.contact)??Math.max(-1,...boards.map(b=>b.layer))+1;
        contactLayers.set(item.contact,layer);board.layer=layer;
        board.contactGroup=item.contact;board.role=item.part;
        board.screws=pins.map((p,j)=>({...p,id:`p${i}s${j}`,color:'blue'}));
        boards.push(board);continue;
      }
      const box=bounds(worldContour(board)),anchor=design.anchors[region];
      const driftX=[-14,12,0,18,-8][wave%5],driftY=[0,16,-12,8,-18][wave%5];
      board.x=round(Math.max(10-box.minX,Math.min(BOARD.width-10-box.maxX,anchor[0]+driftX)));
      board.y=round(Math.max(10-box.minY,Math.min(BOARD.height-10-box.maxY,anchor[1]+driftY)));
      board.screws=pins.map((p,j)=>({...p,id:`p${i}s${j}`,color:'blue'}));
      const overlaps=boards.filter(other=>polygonsOverlap(worldContour(board),worldContour(other)));
      // Non-overlapping pieces share a physical plane, including vertical
      // neighbours: falling/swinging glass must meet and rest on those pieces.
      board.layer=overlaps.length?Math.max(...overlaps.map(b=>b.layer))+1:0;
      // Explicit dependency records stay in the authoring output for validation.
      board.blocks=overlaps.filter(b=>b.screws.some(s=>{
        return polygonCovers(worldContour(board),positionOf(b,s),14);
      })).map(b=>b.id);
      boards.push(board);
    }
    return {id,version:`glass-contact-${id}-v${id>=11?7:6}`,title:design.title,boards,pressure:design.pressure,...(design.difficulty?{difficulty:design.difficulty}:{})};
  });
}
