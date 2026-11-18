import {createLevel, LEVEL_COUNT} from './levels.js';
export {LEVEL_COUNT};

export const COLORS = [
  {name:'莓果粉', light:'#ffc5d9', main:'#fb508c', dark:'#ac1c57'},
  {name:'天空蓝', light:'#c6f4ff', main:'#25c6f6', dark:'#087baf'},
  {name:'柠檬黄', light:'#ffffb4', main:'#ffe12e', dark:'#bf8e08'},
  {name:'薄荷绿', light:'#c9ffd5', main:'#35ce75', dark:'#087d42'},
  {name:'葡萄紫', light:'#e9ccff', main:'#ac64fa', dark:'#662bbb'},
  {name:'蜜橘橙', light:'#ffe3b2', main:'#ff9a37', dark:'#b94c13'},
  {name:'珍珠白', light:'#ffffff', main:'#e4edf4', dark:'#8b9cae'},
  {name:'深海蓝', light:'#a3b9ff', main:'#3456ba', dark:'#15265f'},
  {name:'樱桃红', light:'#ffa995', main:'#dd352d', dark:'#821b24'},
  {name:'孔雀青', light:'#9aeee4', main:'#15968c', dark:'#07514e'},
  {name:'石墨灰', light:'#b5bbc7', main:'#5b6473', dark:'#242c39'},
  {name:'可可棕', light:'#e3bc91', main:'#95623b', dark:'#50311f'},
];
export const BATCH_SIZE = 9;
export const BOX_SIZE = 3;
export const BELT_SPEED=.21;
export const BOARDING_DURATION=.16;
export const DEPARTURE_DURATION=.44;
// A short platform keeps riders within reach while the next shuttle pulls up.
export const PICKUP_BEFORE=.025;
export const PICKUP_AFTER=.12;
export const RELEASE_DELAY=.025;
export const RELEASE_INTERVAL=.025;
export const RUN_SPEED=.66;
const RUN_ACCELERATION=(RUN_SPEED-BELT_SPEED)/.14;
const RUN_BRAKING=(RUN_SPEED-BELT_SPEED)/.12;
const FOLLOW_TIME=.16;
export const UPPER_TRACK_START=(534+Math.PI*68)/(712+Math.PI*68);
export const beltPosition=(game,marble,index)=>marble.beltP??(game.phase+index/game.capacity)%1;
export const STATIONS = [78,186,294,402].map(x => (178 + Math.PI*34 + 418-x) / (712 + Math.PI*68));

export const makeLevel=createLevel;
export function packGroups(pack){
  const counts=new Map();
  for(const color of pack.colors)counts.set(color,(counts.get(color)??0)+1);
  return [...counts].map(([color,count])=>({color,count}));
}
export function packLabel(pack){return packGroups(pack).map(({color,count})=>`${COLORS[color].name} ${count} 颗`).join('＋');}
export function isPackHidden(pack,depth){return !!pack.hidden&&depth>=1;}

export class Game {
  constructor(level = 1, {physics = false} = {}) {
    this.level = makeLevel(level);
    this.columns = this.level.columns.map(c => [...c]);
    this.busLanes = this.level.busLanes.map(lane => [...lane]);
    this.boxes = Array.from({length:4}, (_, i) => this.newBox(i));
    this.capacity = this.level.capacity;
    this.slots = Array.from({length:this.capacity}, () => null);
    this.pending = [];
    this.phase = 0;
    this.time = 0;
    this.collected = 0;
    this.completed = 0;
    this.moves = 0;
    this.nextId = 1;
    this.status = 'playing';
    this.jamSince = null;
    this.events = [];
    this.history = [];
    this.undoLeft = 1;
    this.expanded = false;
    this.physical = physics;
  }
  newBox(lane) { return this.busLanes[lane].length ? {color:this.busLanes[lane].shift(), filled:0, timer:0, lane} : null; }
  get occupied() { return this.slots.reduce((n, m) => n + !!m, 0); }
  get canBeltProgress() {
    // A matching ball may still be travelling toward its exit. Completed
    // boxes also need time to leave and reveal the next request.
    if(this.boxes.some(box=>box?.filled===BOX_SIZE))return true;
    return this.slots.some(marble=>marble&&this.boxes.some(box=>box?.color===marble.color));
  }
  get remaining() { return this.columns.reduce((n,c) => n+c.length*9,0); }
  get total() { return this.level.total; }
  get finishing() { return this.status==='playing' && this.remaining===0 && this.pending.length===0; }
  snapshot() {
    return structuredClone({columns:this.columns, busLanes:this.busLanes, boxes:this.boxes, slots:this.slots, pending:this.pending, phase:this.phase, time:this.time, collected:this.collected, completed:this.completed, moves:this.moves, nextId:this.nextId, status:this.status, capacity:this.capacity, jamSince:this.jamSince});
  }
  release(column) {
    if(this.status !== 'playing' || !this.columns[column]?.length) return false;
    this.history.push(this.snapshot());
    if(this.history.length > 8) this.history.shift();
    const pack = this.columns[column].shift();
    for(let i=0; i<9; i++) this.pending.push({id:this.nextId++, color:pack.colors[i], column, born:this.time, ready:this.physical?Infinity:this.time+.65+i*.055, spawnAt:this.time+RELEASE_DELAY+i*RELEASE_INTERVAL, index:i});
    this.moves++;
    this.events.push({type:'release', pack, column, firstId:this.nextId-9});
    return true;
  }
  undo() {
    if(!this.undoLeft || !this.history.length || this.status === 'won') return false;
    Object.assign(this, this.history.pop());
    this.undoLeft--;
    this.events = [{type:'undo'}];
    return true;
  }
  expand() {
    if(this.expanded || this.status === 'won') return false;
    // Preserve every marble and its order when creating the larger belt.
    const marbles = this.slots.map((marble, i) => ({marble, p:marble?beltPosition(this,marble,i):0})).filter(x=>x.marble).sort((a,b)=>a.p-b.p);
    this.capacity += 9;
    this.slots = Array(this.capacity).fill(null);
    this.phase = 0;
    let previous = -1;
    marbles.forEach(({marble,p},i) => {
      const index = Math.min(this.capacity-(marbles.length-i), Math.max(previous+1, Math.floor(p*this.capacity)));
      marble.beltP=p;marble.beltPrevious=p;marble.beltTravel=0;this.slots[index] = marble; previous = index;
    });
    this.expanded = true;
    this.status = 'playing';
    this.jamSince = null;
    this.history = []; // Undo cannot remove capacity that has already been granted.
    this.events.push({type:'expand'});
    return true;
  }
  hint() {
    if(this.status !== 'playing') return -1;
    const need=Array(COLORS.length).fill(0),incoming=Array(COLORS.length).fill(0),preview=Array(COLORS.length).fill(0);
    this.boxes.forEach(b=>{if(b)need[b.color]+=3-b.filled;});
    this.slots.filter(Boolean).concat(this.pending).forEach(m=>incoming[m.color]++);
    this.busLanes.forEach(queue => queue.slice(0,2).forEach(color => preview[color] += 3));
    if(need.some((count,color)=>count>0&&incoming[color]>0))return -2;
    let best = -1, score = -Infinity;
    this.columns.forEach((column,i)=>{
      if(!column.length) return;
      let value=0;
      for(const {color,count} of packGroups(column[0])){
        const immediate=Math.min(count,Math.max(0,need[color]-incoming[color]));
        const soon=Math.min(count-immediate,Math.max(0,preview[color]-Math.max(0,incoming[color]-need[color])));
        value+=immediate*4+soon*.5-(count-immediate-soon)*1.5;
      }
      if(value>score) {score=value; best=i;}
    });
    return best;
  }
  step(dt) {
    if(this.status !== 'playing') return;
    if(!Number.isFinite(dt) || dt<=0) return;
    // Small steps keep pickup and injection deterministic at any render frame rate.
    for(let left=Math.min(dt,1); left>0 && this.status==='playing'; left-=1/120) this.tick(Math.min(left,1/120));
  }
  tick(dt) {
    this.time += dt;
    this.boxes.forEach((box,lane)=>{
      if(box?.filled===3) {
        box.timer -= dt;
        if(box.timer<=0) {this.completed++; this.events.push({type:'box', lane, color:box.color}); this.boxes[lane] = this.newBox(lane);}
      }
    });
    const distance = dt*BELT_SPEED;
    const riders=this.slots.map((marble,i)=>marble?{marble,i,p:beltPosition(this,marble,i)}:null).filter(Boolean).sort((a,b)=>a.p-b.p);
    const pitch=1/this.capacity;
    const spacing=.98*pitch;
    const full=riders.length===this.capacity;
    // At capacity, spread the remaining slack around the loop instead of
    // leaving an apparent free place. Keep the same circular rider order.
    const fullOffset=full?riders.reduce((sum,rider,i)=>sum+rider.p-i*pitch,0)/this.capacity:0;
    const settle=Math.min(1,dt/.1);
    let readyIndex=this.pending.findIndex(m=>m.ready<=this.time);
    const feeding=!full&&readyIndex>=0;
    const travels=[];
    const gaps=[];
    this.phase=(this.phase+distance)%1;
    for(let n=0;n<riders.length;n++){
      const {marble,p:before}=riders[n];
      // Eligibility lasts through the first fast section, even if a queue
      // temporarily slows this rider. Visual running follows actual speed.
      marble.runEligible??=!!marble.running;
      if(before>=UPPER_TRACK_START)marble.runEligible=false;
      if(full){
        travels[n]=Math.max(0,distance+(fullOffset+n*pitch-before)*settle);
        continue;
      }
      const next=riders[(n+1)%riders.length];
      const gap=riders.length>1?(next.p-before+1)%1:1;
      gaps[n]=gap;
      const speed=marble.speed??(marble.running?RUN_SPEED:BELT_SPEED);
      // Match a moving leader instead of braking simply because it is close.
      // A growing gap automatically restores speed. Brake before the end of
      // the fast section so crossing its boundary does not change speed abruptly.
      let target=BELT_SPEED;
      if(marble.runEligible){
        const brakingStep=RUN_BRAKING*dt;
        const endSpeed=Math.max(BELT_SPEED,Math.sqrt(brakingStep*brakingStep+BELT_SPEED*BELT_SPEED+2*RUN_BRAKING*Math.max(0,UPPER_TRACK_START-before))-brakingStep);
        const leaderSpeed=next.marble.speed??(next.marble.running?RUN_SPEED:BELT_SPEED);
        target=Math.min(RUN_SPEED,endSpeed,riders.length>1?leaderSpeed+Math.max(0,gap-spacing)/FOLLOW_TIME:RUN_SPEED);
      }
      const change=Math.max(-RUN_BRAKING*dt,Math.min(RUN_ACCELERATION*dt,target-speed));
      let travel=Math.max(0,(speed+change)*dt);
      // Give the feeder a merge gap instead of letting almost-full loops
      // circulate forever with many individually unusable slivers of space.
      if(feeding&&before<=1-spacing+1e-8&&before>1-spacing-distance)travel=Math.max(0,Math.min(travel,1-spacing-before));
      travels[n]=travel;
    }
    // Propagate any merge stop backwards through the queue without overlap.
    for(let pass=0;!full&&pass<riders.length;pass++){
      let changed=false;
      for(let n=riders.length-1;n>=0;n--){
        const next=(n+1)%riders.length;
        const travel=Math.max(0,Math.min(travels[n],gaps[n]-spacing+travels[next]));
        if(travel<travels[n]){travels[n]=travel;changed=true;}
      }
      if(!changed)break;
    }
    for(let n=0;n<riders.length;n++){
      const {marble,i,p:before}=riders[n],travel=travels[n];
      marble.beltPrevious=before;marble.beltTravel=travel;
      marble.beltP=(before+travel)%1;
      marble.speed=travel/dt;
      if(before+travel>=UPPER_TRACK_START)marble.runEligible=false;
      marble.running=marble.speed>BELT_SPEED+.02;
      const runBlend=Math.max(0,Math.min(1,(marble.speed-BELT_SPEED)/(RUN_SPEED-BELT_SPEED)));
      marble.walkPhase=(marble.walkPhase??marble.id*1.73)+dt*(4.7+10.3*runBlend);
      for(let lane=0;lane<4;lane++){
        const box=this.boxes[lane];
        if(!box||box.color!==marble.color||box.filled>=BOX_SIZE)continue;
        const ahead=(STATIONS[lane]-before+1)%1,behind=(before-STATIONS[lane]+1)%1;
        if(ahead>travel+PICKUP_BEFORE&&behind>PICKUP_AFTER)continue;
        this.slots[i]=null;this.collected++;
        this.events.push({type:'collect',lane,color:marble.color,hole:box.filled,at:before,id:marble.id});
        box.filled++;
        if(box.filled===3)box.timer=DEPARTURE_DURATION;
        break;
      }
    }
    // The mouth is continuously available, independent of decorative belt
    // pockets. Admit a grounded rider as soon as there is physical clearance.
    if(readyIndex>=0){
      const free=this.slots.findIndex(m=>!m);
      if(free>=0&&this.slots.every((m,i)=>!m||Math.min(beltPosition(this,m,i),1-beltPosition(this,m,i))>=spacing-1e-8)){
        const [incoming]=this.pending.splice(readyIndex,1);
        incoming.beltP=0;incoming.beltPrevious=0;incoming.beltTravel=0;
        incoming.speed=BELT_SPEED;incoming.runEligible=true;incoming.running=false;this.slots[free]=incoming;
        this.events.push({type:'land',color:incoming.color,id:incoming.id});
        readyIndex=this.pending.findIndex(m=>m.ready<=this.time);
      }
    }
    if(readyIndex>=0&&this.occupied===this.capacity&&!this.canBeltProgress){
      // A slot can be refilled while its previous rider is still visibly
      // boarding. Confirm the jam only after that handoff has had time to end.
      this.jamSince??=this.time;
      if(this.time-this.jamSince>=BOARDING_DURATION){
        this.status='lost';this.events.push({type:'lost'});
      }
    }else{
      this.jamSince=null;
    }
    if(this.collected===this.total && this.boxes.every(b=>!b)) {
      this.status='won'; this.events.push({type:'won'});
    }
  }
  drainEvents() { const e=this.events; this.events=[]; return e; }
}
