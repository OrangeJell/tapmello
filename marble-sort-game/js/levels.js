import {SHIFT_PATTERNS, SUPER_HARD_PATTERNS} from './shift-patterns.js';

export const LEVEL_PROFILES = [
  {name:'快乐初搭车',capacity:27,stages:1,mysteryRate:0,colorCount:3},
  {name:'先看后车',capacity:27,stages:4,mysteryRate:0.09,colorCount:8},
  {name:'留好空位',capacity:27,stages:5,mysteryRate:0.09,colorCount:8},
  {name:'双色换乘',capacity:27,stages:5,mysteryRate:0.1,colorCount:8},
  {name:'小心拥堵',capacity:27,stages:5,mysteryRate:0.11,colorCount:8},
  {name:'两层等候',capacity:27,stages:6,mysteryRate:0.11,colorCount:10},
  {name:'混色下班',capacity:27,stages:6,mysteryRate:0.12,colorCount:10},
  {name:'错峰接人',capacity:27,stages:6,mysteryRate:0.13,colorCount:10},
  {name:'空间博弈',capacity:27,stages:7,mysteryRate:0.13,colorCount:10},
  {name:'半程挑战',capacity:27,stages:7,mysteryRate:0.14,colorCount:10},
  {name:'新同事来啦',capacity:27,stages:8,mysteryRate:0.15,colorCount:10},
  {name:'双色连锁',capacity:27,stages:8,mysteryRate:0.16,colorCount:10},
  {name:'错位回环',capacity:27,stages:8,mysteryRate:0.16,colorCount:12},
  {name:'耐心周转',capacity:27,stages:9,mysteryRate:0.17,colorCount:12},
  {name:'隐色迷局',capacity:27,stages:9,mysteryRate:0.18,colorCount:12},
  {name:'重重关卡',capacity:27,stages:10,mysteryRate:0.18,colorCount:12},
  {name:'极限取舍',capacity:27,stages:10,mysteryRate:0.19,colorCount:12},
  {name:'最后三步',capacity:27,stages:10,mysteryRate:0.2,colorCount:12},
  {name:'终局前奏',capacity:27,stages:11,mysteryRate:0.2,colorCount:12},
  {name:'终极整理',capacity:27,stages:11,mysteryRate:0.2,colorCount:12},
  {name:'晚班启程',capacity:27,stages:12,mysteryRate:0.2,colorCount:12},
  {name:'交叉换班',capacity:27,stages:12,mysteryRate:0.2,colorCount:12},
  {name:'隔街相望',capacity:27,stages:12,mysteryRate:0.2,colorCount:12},
  {name:'双色接力',capacity:27,stages:12,mysteryRate:0.2,colorCount:12},
  {name:'雨夜归途',capacity:27,stages:13,mysteryRate:0.2,colorCount:12},
  {name:'轮流放行',capacity:27,stages:13,mysteryRate:0.2,colorCount:12},
  {name:'街角会合',capacity:27,stages:13,mysteryRate:0.2,colorCount:12},
  {name:'双路周转',capacity:27,stages:13,mysteryRate:0.2,colorCount:12},
  {name:'夜色回环',capacity:27,stages:14,mysteryRate:0.2,colorCount:12},
  {name:'深夜加班',capacity:27,stages:14,mysteryRate:0.2,colorCount:12},
  {name:'长街灯火',capacity:27,stages:14,mysteryRate:0.2,colorCount:12},
  {name:'错位接驳',capacity:27,stages:14,mysteryRate:0.2,colorCount:12},
  {name:'彩色街区',capacity:27,stages:15,mysteryRate:0.2,colorCount:12},
  {name:'隐色换乘',capacity:27,stages:15,mysteryRate:0.2,colorCount:12},
  {name:'末班倒计时',capacity:27,stages:15,mysteryRate:0.2,colorCount:12},
  {name:'双线归家',capacity:27,stages:15,mysteryRate:0.2,colorCount:12},
  {name:'连环路口',capacity:27,stages:16,mysteryRate:0.2,colorCount:12},
  {name:'最后一班',capacity:27,stages:16,mysteryRate:0.2,colorCount:12},
  {name:'全城接送',capacity:27,stages:16,mysteryRate:0.2,colorCount:12},
  {name:'全员到家',capacity:27,stages:16,mysteryRate:0.2,colorCount:12},
];
// Twenty more routes alternate shorter journeys with full challenge shifts.
for(let i=0;i<20;i++)LEVEL_PROFILES.push({name:'第 '+(41+i)+' 关',capacity:27,
  stages:[14,15,14,16,15][i%5],mysteryRate:[.16,.18,.16,.20,.18][i%5],colorCount:12});
export const LEVEL_COUNT=LEVEL_PROFILES.length;
// Leave two, then three ordinary levels between repeatable challenge peaks.
export const SUPER_HARD_LEVELS=Object.freeze(Array.from({length:LEVEL_COUNT},(_,i)=>i+1)
  .filter(number=>number>=5&&[0,3].includes((number-5)%7)));
export const isSuperHardLevel=number=>SUPER_HARD_LEVELS.includes(number);
const OPENINGS=['direct','paired','follow','relay','welcome','return'];

function random(seed){
  return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};
}
function shuffle(items,rng){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

// A handcrafted introduction: six houses, three animal colours, no buried keys.
// Each colour always has its own bus queue, so every front house is a useful move.
function createIntroLevel(){
  const route=[2,0,4,1,3,2],colors=[0,1,2,0,1,2];
  const columns=Array.from({length:5},()=>[]);
  route.forEach((column,i)=>columns[column].push({id:i+1,colors:Array(9).fill(colors[i]),hidden:false}));
  return {number:1,name:LEVEL_PROFILES[0].name,version:13,columns,
    busLanes:[[0,0,0],[1,1,1,1,1,1],[2,2,2,2,2,2],[0,0,0]],
    solution:route,solutionWait:45,
    stages:[{kind:'welcome',phase:'opening',hard:false,pressure:false,route,colors:[0,1,2]}],
    capacity:27,colorCount:3,total:54,mixedCount:0,mysteryCount:0};
}

export function createLevel(number){
  number=Math.max(1,Math.min(LEVEL_COUNT,Math.floor(Number(number)||1)));
  if(number===1)return createIntroLevel();
  const profile=LEVEL_PROFILES[number-1],rng=random(number*733+20261104);
  const superHard=isSuperHardLevel(number);
  const trapStages=[Math.min(profile.stages-3,Math.floor(profile.stages/2)),profile.stages-2];
  const palette=shuffle(Array.from({length:profile.colorCount},(_,i)=>i),rng),lanes=shuffle([0,1,2,3,4],rng);
  // Adjacent stages use disjoint color families. Early replacement boxes cannot
  // consume the previous stage's supply and strand one of its outstanding boxes.
  const half=profile.colorCount/2,families=[palette.slice(0,half),palette.slice(half)];
  // One opening and one transition, then every remaining shift needs planning.
  const warmupStages = 1;
  const pressureStart = 2;
  const patternOrder = shuffle(SHIFT_PATTERNS, random(number * 977 + 20261107));
  const regularPatterns=patternOrder.filter(pattern=>!['doubleLock','switchyard'].includes(pattern.kind));
  const columns=Array.from({length:5},()=>[]),busLanes=Array.from({length:4},()=>[]),solution=[],stages=[];
  const readablePacks=new Set();
  let nextId=1;
  for(let stage=0;stage<profile.stages;stage++){
    const stageLanes=Array.from({length:5},(_,i)=>lanes[(stage+i)%5]);
    const family=families[stage%2],offset=Math.floor(stage/2)%family.length;
    const [a,b,c,d]=[...family.slice(offset),...family.slice(0,offset)];
    const resolution=superHard&&stage===profile.stages-1;
    const trapIndex=superHard?trapStages.indexOf(stage):-1;
    const phase = stage < warmupStages ? 'opening' : stage < pressureStart ? 'build' : resolution ? 'resolution' : 'challenge';
    let pattern = patternOrder[(stage - pressureStart + patternOrder.length) % patternOrder.length];
    // Later chapters revisit the tightest shift between other distinct patterns.
    if (number >= 13 && stage >= pressureStart && (stage - pressureStart) % 3 === 2) {
      pattern = SHIFT_PATTERNS.find(item => item.kind === 'doubleLock');
    }
    if (number >= 6 && stage === profile.stages - 1) {
      pattern = SHIFT_PATTERNS.find(item => item.kind === (number % 2 ? 'switchyard' : 'doubleLock'));
    }
    if (stage > pressureStart && pattern.kind === stages[stages.length-1]?.kind) {
      const alternative = pattern.kind === 'doubleLock' ? 'switchyard' : 'doubleLock';
      pattern = SHIFT_PATTERNS.find(item => item.kind === alternative);
    }
    if(superHard){
      // The first half has ordinary 18-place bottlenecks. Only the two late
      // decisions use the tighter traps; repeating the level teaches a rule.
      pattern=trapIndex>=0?SUPER_HARD_PATTERNS[trapIndex]
        :regularPatterns[(stage+regularPatterns.length-pressureStart)%regularPatterns.length];
    }
    const kind = phase === 'opening' ? OPENINGS[(number - 1) % OPENINGS.length]
      : phase === 'build' ? 'switchback' : resolution ? 'homebound' : pattern.kind;
    const hard = phase === 'challenge';
    const pressure = hard && number > 1;
    let packs,positions,queues;
    if (pressure) {
      const colors = [a,b,c,d];
      packs = pattern.packs.map(pack => pack.map(color => colors[color]));
      positions = pattern.positions;
      queues = pattern.queues.map(queue => queue.map(color => colors[color]));
    } else if(kind==='homebound'){
      // After the second decision, every remaining house has its own queue.
      packs=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
      positions=[0,1,2,3];
      queues=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
    } else if(kind==='direct'){
      packs=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
      positions=[0,1,2,3];
      queues=number===1?[[a,a,a],[b,b,b],[c,c,c],[d,d,d]]:[[a,b,c],[b,d,a],[c,a,d],[d,c,b]];
    }else if(kind==='paired'){
      packs=[[a,a,a],[b,b,b],[a,a,a],[b,b,b]];
      positions=[0,2,1,3];
      queues=[[a,b,a],[b,a,b],[a,b,a],[b,a,b]];
    }else if(kind==='welcome'){
      packs=[[a,a,a],[b,b,b],[c,c,c]];
      positions=[0,1,2];
      queues=[[a,a,b],[a,b,c],[b,c],[c]];
    }else if(kind==='follow'){
      // The only covered opening supply repeats an already accessible colour.
      packs=[[a,a,a],[b,b,b],[a,a,a],[c,c,c]];
      positions=[0,1,0,2];
      queues=[[a,a,c],[a,b,c],[b,a,a],[c,b,a]];
    }else if(kind==='return'){
      packs=[[a,a,a],[b,b,b],[c,c,c],[b,b,b]];
      positions=[0,1,2,1];
      queues=[[a,b,b],[b,c,b],[c,b,a],[a,c,b]];
    }else if(kind==='fork'){
      // Two buried keys in different columns; clearing one branch helps the other.
      packs=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
      positions=[0,1,0,1];
      queues=[[c,a,b],[c,a,b],[d,a,b],[d,c,d]];
    }else if(kind==='relay'){
      // Several front offices can board immediately; bus previews determine
      // which follow-up clears the loop instead of accumulating a backlog.
      packs=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
      positions=[0,1,2,3];
      queues=[[a,b,c],[b,c,d],[c,a,d],[d,a,b]];
    }else if(kind==='switchback'){
      // A partial pickup leaves six waiting; the next column releases the key.
      packs=[[a,a,a],[b,b,b],[c,c,c],[d,d,d]];
      positions=[0,1,1,2];
      queues=[[b,a,c],[b,a,d],[c,b,d],[a,c,d]];
    }else{
      packs=[[a,a,a],[a,a,a],[b,b,b],[c,c,c]];
      positions=kind==='split'?[0,1,0,2]:[0,0,0,2];
      queues=[[b,a,a],[b,a,a],[b,a,a],[c,c,c]];
    }
    const route=positions.map(position=>stageLanes[position]);
    packs.forEach((units,i)=>{
      const pack={id:nextId++,colors:units.flatMap(color=>[color,color,color]),hidden:false};
      if(trapIndex>=0)readablePacks.add(pack.id);
      columns[route[i]].push(pack);
    });
    const stops=shuffle([0,1,2,3],rng);
    queues.forEach((queue,i)=>busLanes[stops[i]].push(...queue));
    solution.push(...route);stages.push({kind,phase,hard,pressure,route,colors:[...new Set(packs.flat())]});
    if(trapIndex>=0)stages[stages.length-1].trap={decisionMove:pattern.decisionMove,
      temptationColumn:stageLanes[pattern.temptationPosition]};
  }
  const eligible=[];
  // Always show the next office: later openings should remain readable rather
  // than turning into five indistinguishable walls of question marks.
  for(const column of columns)column.forEach((pack,depth)=>{if(depth>=2)eligible.push(pack);});
  const hideable=eligible.filter(pack=>!readablePacks.has(pack.id));
  const mysteryCount=Math.min(hideable.length,Math.round(eligible.length*Math.min(.75,profile.mysteryRate)));
  shuffle(hideable,rng).slice(0,mysteryCount).forEach(pack=>{pack.hidden=true;});
  const mixedCount=columns.flat().filter(pack=>new Set(pack.colors).size>1).length;
  return{number,name:profile.name,version:superHard?14:12,columns,busLanes,solution,solutionWait:45,stages,capacity:profile.capacity,colorCount:profile.colorCount,total:columns.flat().length*9,mixedCount,mysteryCount};
}
