import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { authoredLevels, DESIGNS, CALIBRATION } from './level-layouts.mjs';
import { createState, availableScrews, move, settlePlates, totalScrews, validateLevel, targetBox } from '../js/engine.js';
import { fitsInside, positionOf, polygonsOverlap, worldContour } from '../js/geometry.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function exposureRoute(level) {
  const state=createState({...level,queue:Array(totalScrews(level)/3).fill('blue')}),path=[],steps=[];
  const owner=new Map(level.boards.flatMap(b=>b.screws.map(s=>[s.id,b])));
  let last=null;
  while(path.length<totalScrews(level)) {
    const exposed=availableScrews(level,state),highest=Math.max(...exposed.map(s=>owner.get(s.id).z));
    const preference=DESIGNS[level.id-1].route[Math.floor(path.length/9)%6];
    const rank=s=>{
      const b=owner.get(s.id),remaining=b.screws.filter(s=>!state.removed.includes(s.id)).length;
      return b.z+(b.role==='pendulum'?7:b.role==='support'?-5:0)+(b.region===preference?5:0)+(b.id===last?3:0)+(remaining===1?2:0);
    };
    const choices=exposed.filter(s=>owner.get(s.id).z>=highest-14).sort((a,b)=>rank(b)-rank(a)||a.id.localeCompare(b.id));
    if(!choices.length)throw Error(`Dead geometry ${level.id}`);
    const screw=choices[0],board=owner.get(screw.id);last=board.id;
    state.removed.push(screw.id);settlePlates(level,state);path.push(screw.id);
    const newly=availableScrews(level,state).filter(s=>!exposed.some(e=>e.id===s.id)).length;
    steps.push({region:board.region,role:board.role,unlocks:newly,clears:board.screws.every(s=>state.removed.includes(s.id))});
  }
  return {path,steps};
}
// Schedule three-screw box batches against local gate releases. Future colours
// occupy the tray, current colours release it. No repeated fixed colour window.
function colourRoute(level,route,variant=0) {
  const allColours=['blue','coral','gold','mint','violet','cyan','orange','pink','pearl','copper'];
  const colourCount=[3,6,8,9,8,10,9,10,10,10][level.id-1]??10;
  const challenge=DESIGNS[level.id-1].challenge;
  const warmupBatches=challenge?.warmup??6;
  const palette=allColours.slice(0,colourCount);
  const count=route.path.length/3;
  level.queue=Array.from({length:count},(_,i)=>level.id>1&&i<warmupBatches?['blue','coral'][i%2]:palette[(i+level.id-1)%palette.length]);
  const remaining=Array(count).fill(3),received=Array(count).fill(0),waiting=Array(count).fill(0),boxes=[0,1];
  let next=2,buffer=0;
  const assignments=[];
  function settle() {
    let changed=true;
    while(changed){
      changed=false;
      for(let i=0;i<2;i++) {
        const batch=boxes[i];if(batch===null)continue;
        if(waiting[batch]){received[batch]+=waiting[batch];buffer-=waiting[batch];waiting[batch]=0;}
        if(received[batch]===3){boxes[i]=next<count?next++:null;changed=true;}
      }
    }
  }
  for(let i=0;i<route.path.length;i++) {
    const step=route.steps[i],actives=boxes.filter(b=>b!==null&&remaining[b]);
    const future=Array.from({length:Math.min(challenge?.future??4,count-next)},(_,j)=>next+j).filter(b=>remaining[b]);
    const hard=level.id>=4&&level.id%2===0;
    const relief=challenge?i%challenge.reliefEvery>=challenge.reliefEvery-challenge.reliefMoves:level.id<=2?i%27>21:hard?i%60>56:i%42>35;
    const pressure=relief?2:level.pressure;
    const gate=step.unlocks>0||step.clears||step.role==='cap';
    // Early levels allow more direct collection; later gates often cost a slot.
    // Opening boxes provide a warm-up, shortened in the later chapters. Later windows
    // demand off-box colours before their gated matches can be reached.
    const warmup=next<=warmupBatches||received.slice(0,warmupBatches).some(n=>n<3);
    const preload=!warmup&&buffer<pressure&&future.length&&(gate||hard||(i+variant+step.region)%(challenge?.preloadEvery??3)===0);
    let batch;
    if(preload) {
      future.sort((a,b)=>waiting[a]-waiting[b]||((a+step.region+variant)%4)-((b+step.region+variant)%4));
      batch=future[0];
    } else {
      actives.sort((a,b)=>(received[b]+waiting[b])-(received[a]+waiting[a])||((a+step.region+variant)%2)-((b+step.region+variant)%2));
      batch=actives[0];
      if(batch===undefined)batch=future[0];
    }
    if(batch===undefined)throw Error(`No colour batch ${level.id}/${i}`);
    remaining[batch]--;assignments.push(batch);
    if(boxes.includes(batch))received[batch]++;else {waiting[batch]++;buffer++;}
    settle();if(buffer>4)throw Error(`Colour scheduling overflow ${level.id}/${i}`);
  }
  const screws=new Map(level.boards.flatMap(b=>b.screws.map(s=>[s.id,s])));
  route.path.forEach((id,i)=>screws.get(id).color=level.queue[assignments[i]]);
}
function replay(level,path,{keepStates=false}={}) {
  let state=createState(level),peak=0;const states=keepStates?[clone(state)]:[];
  for(const id of path) {
    const result=move(level,state,id);if(!result.accepted)return null;
    state=result.state;peak=Math.max(peak,state.buffer.length);if(keepStates)states.push(state);
  }
  return {state,peak,states};
}
function difficultyMetrics(level,trials,replayed) {
  const states=replayed.states.slice(1),count=totalScrews(level);
  return {
    averageTray:states.reduce((sum,state)=>sum+state.buffer.length,0)/states.length,
    highPressureRatio:states.filter(state=>state.buffer.length>=3).length/states.length,
    criticalRatio:states.filter(state=>state.buffer.length===4).length/states.length,
    greedyMeanProgress:trials.reduce((sum,trial)=>sum+trial.packed,0)/trials.length/count,
    greedyMaxProgress:Math.max(...trials.map(trial=>trial.packed))/count,
  };
}
function removalOrder(level,path) {
  const positions=new Map(path.map((id,i)=>[id,i]));
  return [...level.boards].sort((a,b)=>Math.max(...a.screws.map(s=>positions.get(s.id)))-Math.max(...b.screws.map(s=>positions.get(s.id)))).map(b=>b.id);
}
// An alternative must reorder complete plates in different regions. Replaying
// the entire continuation catches hanging/support changes, not only colours.
function alternative(level,base,states,startAt,usedOrders,minBuffer=0) {
  const owner=new Map(level.boards.flatMap(b=>b.screws.map(s=>[s.id,b])));
  const baseOrder=removalOrder(level,base);
  for(let at=startAt;at<base.length-8;at+=2) {
    const state=states[at],original=owner.get(base[at]);
    if(state.buffer.length<minBuffer)continue;
    const candidates=availableScrews(level,state).filter(s=>owner.get(s.id).region!==original.region)
      .sort((a,b)=>owner.get(b.id).z-owner.get(a.id).z);
    for(const screw of candidates.slice(0,5)) {
      const board=owner.get(screw.id),remaining=board.screws.filter(s=>!state.removed.includes(s.id)).map(s=>s.id);
      const prefix=[...base.slice(0,at)],priority=[...remaining,...base.slice(at).filter(id=>!remaining.includes(id))];
      let next=clone(state),suffix=[];
      for(let j=0;j<priority.length;j++) {
        const id=priority[j],result=move(level,next,id);
        if(!result.accepted)break;
        next=result.state;suffix.push(id);
      }
      if(next.status!=='won')continue;
      const path=[...prefix,...suffix],order=removalOrder(level,path),signature=order.join(',');
      if(signature===baseOrder.join(',')||usedOrders.has(signature))continue;
      // Require a reversed pair belonging to different regions.
      const basePos=new Map(baseOrder.map((id,i)=>[id,i]));
      if(!order.some((id,i)=>order.slice(i+1).some(other=>basePos.get(id)>basePos.get(other)&&level.boards.find(b=>b.id===id).region!==level.boards.find(b=>b.id===other).region)))continue;
      usedOrders.add(signature);return {path,at,plate:board.id,buffer:state.buffer.length};
    }
  }
  return null;
}
function greedyRoute(level,variant) {
  let state=createState(level),path=[];
  const owner=new Map(level.boards.flatMap(b=>b.screws.map(s=>[s.id,b])));
  while(state.status==='playing') {
    const rank=s=>{
      const b=owner.get(s.id),box=targetBox(state,s.color);
      const finish=b.screws.filter(s=>!state.removed.includes(s.id)).length===1;
      return (box>=0?100+state.boxes[box].count*10:0)+(finish?6:0)+(variant===0?b.z*.1:variant===1?-b.z*.1:variant===2?b.x*.03:b.y*.03);
    };
    const choices=availableScrews(level,state).sort((a,b)=>rank(b)-rank(a));
    if(!choices.length)break;
    path.push(choices[0].id);state=move(level,state,choices[0].id).state;
  }
  return {status:state.status,packed:state.packed,path};
}
function badRoute(level) {
  let state=createState(level),path=[];
  while(state.status==='playing') {
    const choices=availableScrews(level,state).sort((a,b)=>(targetBox(state,a.color)>=0)-(targetBox(state,b.color)>=0)||a.id.localeCompare(b.id));
    if(!choices.length)break;
    const result=move(level,state,choices[0].id);if(!result.accepted)break;
    path.push(choices[0].id);state=result.state;
  }
  return {path,status:state.status};
}
function validateGeometry(level) {
  if(totalScrews(level)!==DESIGNS[level.id-1].count)throw Error('Wrong count');
  for(const b of level.boards) {
    for(const s of b.screws) {
      const p=positionOf(b,s);
      if(!fitsInside(b,s,16)||p.x<16||p.x>344||p.y<16||p.y>484)throw Error(`Unsafe pin ${level.id}/${s.id}`);
      for(const t of b.screws)if(t!==s&&Math.hypot(s.x-t.x,s.y-t.y)<60)throw Error('Pin spacing');
    }
    for(const a of level.boards)if(a.z<b.z&&a.layer===b.layer&&polygonsOverlap(worldContour(a),worldContour(b)))throw Error('Same-layer overlap');
  }
}
// Append a chapter without regenerating earlier puzzles or running calibration.
const from=Number(process.argv.find(arg=>arg.startsWith('--from='))?.split('=')[1]??1);
const skipValidation=process.argv.includes('--skip-validation');
const inspectVariants=process.argv.includes('--inspect-variants');
if(!Number.isInteger(from)||from<1||from>DESIGNS.length)throw Error('Invalid starting level');
const levels=from>1?(await import('../js/level-data.js')).LEVELS.filter(level=>level.id<from):[];
const reports=from>1?JSON.parse(await readFile(new URL('../output/design/level-routes.json',import.meta.url),'utf8')).filter(report=>report.id<from):[];
for(const level of authoredLevels({from})) {
  if(skipValidation) {
    const route=exposureRoute(level);
    colourRoute(level,route);
    level.solution=route.path;
    levels.push(level);
    reports.push({id:level.id,count:totalScrews(level),plates:level.boards.length,validated:false,solutions:[route.path]});
    console.log(`Level ${level.id}: generated ${totalScrews(level)} screws; validation skipped`);
    continue;
  }
  validateGeometry(level);
  const route=exposureRoute(level);
  if(inspectVariants) {
    for(let variant=0;variant<(DESIGNS[level.id-1].challenge?4:12);variant++) {
      colourRoute(level,route,variant);
      const trials=[0,1,2,3].map(mode=>greedyRoute(level,mode));
      const replayed=replay(level,route.path,{keepStates:true});
      console.log(JSON.stringify({id:level.id,variant,legal:replayed?.state.status==='won',greedy:trials.map(t=>t.status==='jammed'?t.packed:t.status),...difficultyMetrics(level,trials,replayed)}));
    }
    continue;
  }
  const target=CALIBRATION[level.id];
  let greedy,chosen=0,best=Infinity;
  for(let variant=0;variant<(target?4:level.id>=3?12:1);variant++) {
    colourRoute(level,route,variant);
    const trials=[0,1,2,3].map(mode=>greedyRoute(level,mode));
    let score;
    if(target) {
      if(trials.some(t=>t.status!=='jammed'||t.packed<18))continue;
      const replayed=replay(level,route.path,{keepStates:true});
      if(replayed?.state.status!=='won')continue;
      const metrics=difficultyMetrics(level,trials,replayed);
      if(metrics.greedyMaxProgress>.45||Math.abs(metrics.highPressureRatio-target.highPressure)>.04||Math.abs(metrics.greedyMeanProgress-target.greedyProgress)>.07)continue;
      score=2*Math.abs(metrics.highPressureRatio-target.highPressure)+Math.abs(metrics.greedyMeanProgress-target.greedyProgress);
    } else {
      score=trials.filter(t=>t.status==='won').length*10000+trials.filter(t=>t.packed<18&&level.id>1).length*100000+trials.reduce((n,t)=>n+t.packed,0);
    }
    if(score<best){best=score;chosen=variant;greedy=trials;}
    if(!target&&(level.id<3||trials.every(t=>t.status==='jammed'&&t.packed>=18)))break;
  }
  if(!greedy)throw Error(`No colour variant meets calibration targets ${level.id}`);
  colourRoute(level,route,chosen);validateLevel(level);
  if(level.id>=3&&greedy.some(t=>t.status!=='jammed'||t.packed<18))throw Error(`Difficulty calibration failed ${level.id}`);
  const replayed=replay(level,route.path,{keepStates:true});
  if(replayed?.state.status!=='won')throw Error(`Witness failed ${level.id}`);
  const used=new Set([removalOrder(level,route.path).join(',')]);
  const a=alternative(level,route.path,replayed.states,0,used);
  const b=alternative(level,route.path,replayed.states,Math.max(0,Math.floor(route.path.length*.35)),used,level.id>=3?3:0);
  if(!a||!b)throw Error(`Missing structural alternate ${level.id}`);
  const bad=badRoute(level);if(level.id>1&&bad.status!=='jammed')throw Error(`No wrong-order pressure ${level.id}`);
  level.solution=route.path;level.jamPath=level.id>=3?greedy[0].path:bad.path;
  const sizes=Object.fromEntries(['small','medium','large'].map(size=>[size,level.boards.filter(b=>b.size===size).length]));
  const report={id:level.id,version:level.version,validated:true,count:totalScrews(level),plates:level.boards.length,sizes,opening:availableScrews(level,createState(level)).length,peak:replayed.peak,colourVariant:chosen,metrics:difficultyMetrics(level,greedy,replayed),calibrationTarget:target,greedy:greedy.map(t=>({status:t.status,packed:t.packed,moves:t.path.length})),alternatives:[a,b],solutions:[route.path,a.path,b.path],jamPath:level.jamPath};
  reports.push(report);levels.push(level);
  console.log(`Level ${level.id}: ${report.count} screws, ${report.plates} plates, ${report.opening} exposed, tray ${report.peak}/5; 3 routes, alternatives at ${a.at}/${b.at}, ${bad.status}, bad-order length ${level.jamPath.length}`);
}
if(!inspectVariants) {
if(!skipValidation) {
  const chapter=reports.filter(report=>CALIBRATION[report.id]&&report.validated);
  const pressure=id=>chapter.find(report=>report.id===id)?.metrics.highPressureRatio;
  for(const [easier,harder] of [[11,13],[13,15],[12,14],[11,12],[13,12],[13,14],[15,14]]) {
    if(pressure(easier)!==undefined&&pressure(harder)!==undefined&&pressure(easier)>=pressure(harder))throw Error(`Difficulty progression failed ${easier}/${harder}`);
  }
}
await mkdir(new URL('../output/design/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/design/level-routes.json',import.meta.url),JSON.stringify(reports,null,2));
// Authoring metadata is not needed on the player's device.
for(const level of levels){delete level.pressure;for(const b of level.boards)for(const key of ['region','size','role','stage','blocks','pinSpacing','contactGroup'])delete b[key];}
await writeFile(new URL('../js/level-data.js',import.meta.url),`// Generated from scripts/level-layouts.mjs; npm run generate:levels.\nexport const LEVELS = ${JSON.stringify(levels,null,2)};\n`);
}
