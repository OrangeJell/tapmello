import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, LEVEL_COUNT, COLORS, STATIONS, BOARDING_DURATION, DEPARTURE_DURATION, BELT_SPEED, RUN_SPEED, UPPER_TRACK_START} from '../js/engine.js';
import {isSuperHardLevel} from '../js/levels.js';

function conservation(game){
  assert.equal(game.remaining+game.pending.length+game.occupied+game.collected,game.total,'every marble must have exactly one owner');
  assert.ok(game.boxes.every(b=>!b||b.filled<=3));
  const supply=Array(COLORS.length).fill(0),demand=Array(COLORS.length).fill(0);
  game.columns.forEach(c=>c.forEach(pack=>pack.colors.forEach(color=>supply[color]++)));
  game.pending.forEach(m=>supply[m.color]++);game.slots.filter(Boolean).forEach(m=>supply[m.color]++);
  game.busLanes.flat().forEach(color=>demand[color]+=3);game.boxes.filter(Boolean).forEach(b=>demand[b.color]+=3-b.filled);
  assert.deepEqual(supply,demand,'remaining supply and demand must balance for every color');
}
function advance(game,seconds){for(let i=0;i<seconds*20;i++){game.step(.05);game.drainEvents();}conservation(game);}
const challengeRhythm={moves:0,tripleHeads:0,wholeHousePickups:0};
for(let level=1;level<=LEVEL_COUNT;level++)test(`level ${level}: legal solution wins without boosters`,()=>{
  const game=new Game(level);
  for(const stage of game.level.stages){
    let peak=0;
    for(const column of stage.route){
      const firstId=game.nextId;
      if(level>1&&stage.hard){
        challengeRhythm.moves++;
        const heads=game.boxes.filter(Boolean).map(box=>box.color);
        if(heads.some(color=>heads.filter(head=>head===color).length>=3))challengeRhythm.tripleHeads++;
      }
      assert.equal(game.release(column),true);advance(game,game.level.solutionWait);assert.notEqual(game.status,'lost');
      peak=Math.max(peak,game.occupied);
      if(level>1&&stage.hard&&!game.pending.length&&!game.slots.some(rider=>rider&&rider.id>=firstId))challengeRhythm.wholeHousePickups++;
    }
    if(level>1&&stage.hard)assert.ok(peak>=18&&peak<=24,`${stage.kind}: maintain pressure while leaving a safe solution`);
  }
  advance(game,40);assert.equal(game.status,'won');assert.equal(game.collected,game.total);assert.equal(game.completed,game.total/3);
});
test('challenge routes vary pickup timing instead of repeatedly clearing one house',()=>{
  assert.ok(challengeRhythm.moves>0);
  assert.ok(challengeRhythm.tripleHeads/challengeRhythm.moves<.45,'three matching front shuttles must not dominate');
  assert.ok(challengeRhythm.wholeHousePickups/challengeRhythm.moves<.38,'most releases must leave animals for a later connection');
});
test('overflow loses; expansion preserves all colors and allows continuation',()=>{
  const game=new Game(20);
  for(let column=0;column<5;column++)while(game.columns[column].length)game.release(column);
  advance(game,60);assert.equal(game.status,'lost');
  const before=game.remaining+game.pending.length+game.occupied+game.collected;
  assert.equal(game.expand(),true);assert.equal(game.status,'playing');assert.equal(game.capacity,game.level.capacity+9);assert.equal(game.expand(),false);
  conservation(game);assert.equal(before,game.total);
});
test('undo restores pending drops, collection and supply as one transaction',()=>{
  const game=new Game();game.release(0);advance(game,2);const before=game.snapshot();game.release(1);advance(game,10);
  assert.equal(game.undo(),true);assert.deepEqual(game.snapshot(),before);assert.equal(game.undo(),false);conservation(game);
});
test('invalid clicks and a finished state cannot create extra marbles',()=>{
  const game=new Game();assert.equal(game.release(-1),false);assert.equal(game.release(99),false);
  const boxes=game.columns[0].length;
  for(let i=0;i<boxes;i++)assert.equal(game.release(0),true);assert.equal(game.release(0),false);conservation(game);
  game.status='lost';const before=game.snapshot();game.step(30);assert.equal(game.release(1),false);assert.deepEqual(game.snapshot(),before);
});
test('belt resizing retains color order and clears stale undo snapshots',()=>{
  const game=new Game();game.release(0);advance(game,3);game.expand();assert.equal(game.history.length,0);game.release(1);advance(game,1);game.undo();assert.equal(game.capacity,game.level.capacity+9);conservation(game);
});

function fullBeltFixture({matching=false,closing=false,nextMatches=false}={}){
  const game=new Game(1);
  game.slots=Array.from({length:game.capacity},(_,i)=>({id:i+1,color:0}));
  game.pending=[{id:game.capacity+1,color:0,ready:0}];game.phase=0;
  game.boxes=[{lane:0,color:matching?0:1,filled:closing?3:0,timer:closing ? .5 : 0},null,null,null];
  game.busLanes=[[nextMatches?0:2],[],[],[]];
  return game;
}
test('a full belt immediately boards matching riders within platform reach',()=>{
  const game=fullBeltFixture({matching:true});game.step(.05);
  assert.equal(game.status,'playing');assert.ok(game.collected>0);assert.ok(game.occupied<27);
  for(let i=0;i<10&&game.collected===0;i++)game.step(.1);
  assert.ok(game.collected>0,'matching marble reaches its exit and creates space');assert.equal(game.status,'playing');
});
test('a full belt waits for a closing box and its matching replacement',()=>{
  const game=fullBeltFixture({closing:true,nextMatches:true});game.step(.25);
  assert.equal(game.status,'playing');assert.equal(game.boxes[0].filled,3);
  game.step(.3);assert.equal(game.status,'playing');assert.equal(game.boxes[0].color,0);
});
test('full belt fails only after replacement cannot accept any belt color',()=>{
  const game=fullBeltFixture({closing:true});game.step(.25);assert.equal(game.status,'playing');
  game.step(.3);assert.equal(game.status,'playing');
  game.step(BOARDING_DURATION);assert.equal(game.status,'lost');
});
test('a matching ball still in the hopper cannot rescue an unmatched full belt',()=>{
  const game=fullBeltFixture();game.pending[0].color=1;
  game.step(.05);assert.equal(game.status,'playing');
  game.step(BOARDING_DURATION);assert.equal(game.status,'lost');
});
test('a slot that refills during the final boarding animation cannot cause an instant loss',()=>{
  const game=fullBeltFixture();
  game.slots.forEach((rider,i)=>{rider.beltP=.04+i*.035;});
  game.slots[18].color=1;
  game.pending.push({id:game.capacity+2,color:0,ready:0});
  game.step(.05);
  assert.equal(game.boxes[0].filled,1);
  assert.equal(game.occupied,game.capacity);
  assert.equal(game.pending.length,1);
  assert.equal(game.status,'playing');
  game.step(BOARDING_DURATION);
  assert.equal(game.status,'lost');
});

test('later levels contain genuine space traps after the opening',()=>{
  for(let level=15;level<=LEVEL_COUNT;level++){
    const game=new Game(level);
    if(isSuperHardLevel(level))continue;
    const stageIndex=game.level.stages.findIndex(stage=>stage.kind==='doubleLock');
    assert.ok(stageIndex>0,'mixed bottlenecks follow the opening');
    for(const stage of game.level.stages.slice(0,stageIndex)){
      for(const column of stage.route){game.release(column);advance(game,45);}
    }
    const route=game.level.stages[stageIndex].route;
    for(const column of route.slice(0,3)){assert.equal(game.release(column),true);advance(game,45);}
    assert.equal(game.occupied,24,'late bottleneck reserves just three places');
    const accepting=new Set(game.boxes.filter(b=>b&&b.filled<3).map(b=>b.color));
    const wrong=game.columns.findIndex((column,i)=>i!==route[3]&&column[0]&&column[0].colors.every(color=>!accepting.has(color)));
    assert.ok(wrong>=0,'a premature unrelated office is a genuine risk');
    game.release(wrong);advance(game,45);assert.equal(game.status,'lost');
  }
});
test('every level opens with accessible bus colours and saves pressure for later',()=>{
  for(let number=2;number<=LEVEL_COUNT;number++){
    const game=new Game(number),stages=game.level.stages;
    const opening=stages.filter(stage=>stage.phase==='opening');
    assert.equal(opening.length,1,'a short opening leaves room for sustained planning');
    assert.equal(stages[opening.length].phase,'build','a gentle transition separates opening and challenge');
    assert.equal(stages.at(-1).phase,isSuperHardLevel(number)?'resolution':'challenge');
    for(const stage of opening){
      assert.equal(stage.hard,false);assert.equal(stage.pressure,false);
      const accessible=new Set(game.columns.flatMap(column=>column[0]?.colors??[]));
      assert.ok(game.boxes.every(box=>!box||accessible.has(box.color)),`level ${number}: all front bus colours are clickable`);
      for(const column of stage.route){
        game.release(column);advance(game,45);
        assert.equal(game.status,'playing');
        assert.ok(game.occupied<=9,'opening leaves at least 18 free spaces after each release');
      }
      assert.equal(game.occupied,0,'each opening shift clears before the next');
    }
    for(const [index,stage] of stages.entries())if(stage.pressure){
      assert.ok(index>opening.length,'mixed bottlenecks follow the opening and transition');
      assert.ok(index>=2,'mixed bottlenecks follow the transition');
    }
  }
});

test('any initially matching office is a safe first move',()=>{
  for(let number=1;number<=LEVEL_COUNT;number++){
    const start=new Game(number),wanted=new Set(start.boxes.map(box=>box.color));
    const choices=start.columns.map((column,index)=>wanted.has(column[0].colors[0])?index:-1).filter(index=>index>=0);
    assert.ok(choices.length>=3,'offer several useful opening choices');
    for(const column of choices){
      const game=new Game(number);game.release(column);advance(game,45);
      assert.equal(game.status,'playing');assert.ok(game.collected>=3,'every matching first move boards passengers');
      assert.ok(game.occupied<=6);
    }
  }
});
test('difficulty adds blockers, hidden offices and colours progressively',()=>{
  for(let number=1;number<=LEVEL_COUNT;number++){
    const level=new Game(number).level,colors=new Set(level.columns.flat().flatMap(p=>p.colors));
    assert.equal(colors.size,number===1?3:number<=5?8:number<=12?10:12);
    assert.equal(level.colorCount,colors.size);
    for(const color of colors)assert.ok(COLORS[color]?.main);
    if(number===1){
      assert.equal(level.total,54);
      assert.equal(level.mixedCount,0);
      assert.equal(level.mysteryCount,0);
      assert.equal(level.stages.length,1);
    }else{
      assert.ok(level.mysteryCount>0);
      assert.ok(level.stages.some(stage=>stage.pressure));
    }
  }
});

test('openings vary their dependencies, bus demand and collection rhythm',()=>{
  const structures=new Set(),rhythms=new Set(),busVariety=new Set();
  let previous;
  for(let number=2;number<=LEVEL_COUNT;number++){
    const game=new Game(number),opening=game.level.stages[0],lanes=new Map(),colors=new Map();
    // Ignore lane positions and colour swaps: those alone are not new puzzles.
    const normalize=(value,map)=>{if(!map.has(value))map.set(value,map.size);return map.get(value);};
    const columns=game.columns.map(column=>[...column]);
    const supply=opening.route.map(column=>({
      lane:normalize(column,lanes),
      colors:columns[column].shift().colors.map(color=>normalize(color,colors)),
    }));
    // Include each opening bus queue, ignoring physical station permutations.
    const queues=game.level.busLanes.map(queue=>queue.slice(0,queue.findIndex(color=>!colors.has(color))).map(color=>colors.get(color))).sort();
    const structure=JSON.stringify({supply,queues});
    assert.notEqual(structure,previous,`adjacent level ${number} must change the opening structure`);
    previous=structure;structures.add(structure);
    busVariety.add(new Set(game.boxes.map(box=>box.color)).size);
    const rhythm=[];
    for(const column of opening.route){
      assert.equal(game.release(column),true);advance(game,45);
      assert.equal(game.status,'playing');rhythm.push([game.collected,game.occupied]);
    }
    assert.equal(game.pending.length,0);assert.equal(game.occupied,0,'each opening has a recoverable end');
    rhythms.add(JSON.stringify(rhythm));
    assert.ok(new Set(game.level.stages.map(stage=>stage.kind)).size>=3,'each level changes rhythm internally');
  }
  assert.ok(structures.size>=6,'at least six opening structures beyond simple recolours');
  assert.ok(rhythms.size>=5,'different structures must create different pickup rhythms');
  assert.deepEqual([...busVariety].sort(),[2,3,4],'front buses vary between two, three and four requested colours');
});

test('restarts preserve the puzzle and every column previews its next office',()=>{
  for(let number=1;number<=LEVEL_COUNT;number++){
    const level=new Game(number).level;
    assert.deepEqual(new Game(number).level,level,'seeded layouts remain learnable on retry');
    for(const column of level.columns){
      assert.ok(column.length>0,'all five source columns are populated');
      assert.ok(column.slice(0,2).every(pack=>!pack.hidden),'front and next offices stay readable');
    }
  }
});

test('each stop dispatches only its own next bus', () => {
  const game = new Game(1);
  game.busLanes = [[2,3],[4],[5],[6]];
  game.boxes[0] = {lane:0, color:1, filled:3, timer:0.01};
  const others = structuredClone(game.boxes.slice(1));
  game.step(.02);
  assert.equal(game.boxes[0].color,2);
  assert.deepEqual(game.boxes.slice(1),others);
  assert.deepEqual(game.busLanes,[[3],[4],[5],[6]]);
});

test('automatic finishing waits for the last drop and resets after undo or a new round',()=>{
  const game=new Game(1);
  assert.equal(game.finishing,false);
  const route=game.level.solution;
  for(const column of route.slice(0,-1)){game.release(column);advance(game,45);}
  game.release(route.at(-1));
  assert.equal(game.remaining,0);
  assert.equal(game.pending.length,9);
  assert.equal(game.finishing,false,'empty offices still wait for falling passengers');
  while(game.pending.length&&game.status==='playing')game.step(.05);
  assert.equal(game.finishing,true,'accelerate once the last passenger reaches the loop');
  assert.ok(game.occupied>0);
  assert.equal(game.undo(),true);
  assert.equal(game.finishing,false,'undo brings the last office back');
  game.release(route.at(-1));
  while(game.pending.length&&game.status==='playing')game.step(.05);
  assert.equal(game.finishing,true);
  advance(game,45);
  assert.equal(game.status,'won');
  assert.equal(game.finishing,false);
  assert.equal(new Game(2).finishing,false);
});

test('three consecutive same-colour shuttles collect a nine-rider train without another lap',()=>{
  const game=new Game();
  game.boxes=[{lane:0,color:0,filled:0,timer:0},null,null,null];
  game.busLanes=[[0,0],[],[],[]];game.pending=[];
  game.phase=(STATIONS[0]-.02+1)%1;
  game.slots=Array(27).fill(null);
  for(let i=0;i<9;i++)game.slots[(27-i)%27]={id:i+1,color:0};
  for(let t=0;t<2.5;t+=.01)game.step(.01);
  assert.equal(game.collected,9);assert.equal(game.completed,3);
});
test('replacement cannot pick up remote or wrong-colour riders',()=>{
  const game=new Game();game.phase=0;game.pending=[];
  game.boxes=[{lane:0,color:0,filled:3,timer:DEPARTURE_DURATION},null,null,null];
  game.busLanes=[[1],[],[],[]];
  game.slots=Array(27).fill(null);game.slots[0]={id:1,color:1};
  game.step(DEPARTURE_DURATION+.01);
  assert.equal(game.collected,0);assert.equal(game.occupied,1);
});
test('mystery offices stay below one fifth of eligible offices in every level',()=>{
  for(let level=1;level<=LEVEL_COUNT;level++){
    const game=new Game(level),eligible=game.level.columns.flatMap(c=>c.slice(2));
    assert.ok(game.level.mysteryCount<=Math.round(eligible.length*.2));
    assert.ok(game.level.columns.every(c=>c.slice(0,2).every(p=>!p.hidden)));
  }
});

test('a ready rider enters immediately without waiting for a fixed belt pocket',()=>{
  const game=new Game();game.phase=.37;game.pending=[{id:999,color:0,ready:0}];
  game.step(1/120);
  assert.equal(game.pending.length,0);assert.equal(game.occupied,1);
  assert.equal(game.slots.find(Boolean).beltP,0);
});
test('a new rider runs through the lower track and returns to belt speed on the upper track',()=>{
  const game=new Game();game.boxes=[null,null,null,null];
  game.pending=[{id:999,color:0,ready:0}];game.step(1/120);
  const rider=game.slots.find(Boolean);
  game.step(.6);assert.ok(rider.beltP>.35&&rider.running);
  game.step(.85);assert.ok(rider.beltP>=UPPER_TRACK_START&&!rider.running);
  const p=rider.beltP;game.step(.1);assert.ok(Math.abs(rider.beltP-p-.021)<1e-8);
});
test('running riders settle behind the animal ahead without overtaking',()=>{
  const game=new Game();game.boxes=[null,null,null,null];
  game.slots[0]={id:1,color:0,beltP:.15,running:false};
  game.slots[1]={id:2,color:0,beltP:0,running:true};
  for(let i=0;i<120;i++){
    game.step(1/120);
    assert.ok((game.slots[0].beltP-game.slots[1].beltP+1)%1>=.98/27-1e-8);
  }
  assert.equal(game.slots[1].running,false);
});
test('nine consecutive arrivals keep running on an empty belt',()=>{
  const game=new Game();game.boxes.fill(null);
  game.pending=Array.from({length:9},(_,i)=>({id:i+1,color:0,ready:0}));
  for(let i=0;i<120;i++){
    game.tick(1/120);
    const riders=game.slots.filter(Boolean).sort((a,b)=>a.beltP-b.beltP);
    for(let j=1;j<riders.length;j++)assert.ok(riders[j].beltP-riders[j-1].beltP>=.98/game.capacity-1e-8,'arrivals never overlap');
  }
  assert.equal(game.pending.length,0,'the entire group enters within one second');
  assert.ok(game.slots.filter(Boolean).every(m=>m.running&&Math.abs(m.speed-RUN_SPEED)<1e-8),'followers do not permanently lose fast movement at entry');
});
test('a follower smoothly accelerates again after its leader boards',()=>{
  const game=new Game();game.boxes.fill(null);
  game.slots[0]={id:1,color:0,beltP:.15,running:false};
  game.slots[1]={id:2,color:1,beltP:0,running:true};
  game.step(.6);
  const follower=game.slots[1];
  assert.ok(follower.speed<BELT_SPEED+.025,'follower settles to the leader speed');
  game.boxes[0]={lane:0,color:0,filled:0,timer:0};
  // Move the pair to the actual pickup window, preserving the existing gap.
  const offset=STATIONS[0]-game.slots[0].beltP;
  game.slots[0].beltP+=offset;follower.beltP+=offset;
  game.tick(1/120);assert.equal(game.slots[0],null,'leader boards');
  const before=follower.speed;
  game.tick(1/120);
  assert.ok(follower.speed>before&&follower.speed<RUN_SPEED,'acceleration starts without snapping to full speed');
  game.step(.18);
  assert.ok(Math.abs(follower.speed-RUN_SPEED)<1e-8,'clear track restores fast movement');
});
test('fast movement eases into the upper track and stays slow on subsequent laps',()=>{
  const game=new Game();game.boxes.fill(null);
  const rider={id:1,color:0,beltP:UPPER_TRACK_START-.09,running:true,speed:RUN_SPEED};game.slots[0]=rider;
  let previous=rider.speed,crossed=false;
  for(let i=0;i<120;i++){
    game.tick(1/120);
    assert.ok(previous-rider.speed<=.032,'deceleration is gradual');
    if(!crossed&&rider.beltP>=UPPER_TRACK_START){
      crossed=true;assert.ok(rider.speed<BELT_SPEED+.035,'slow down before reaching the boundary');
    }
    previous=rider.speed;
  }
  assert.ok(crossed);
  for(let i=0;i<600;i++){
    game.tick(1/120);
    assert.ok(Math.abs(rider.speed-BELT_SPEED)<1e-8,'a completed fast section does not restart on later laps');
  }
});
test('an almost-full loop makes a merge gap instead of stranding a ready rider',()=>{
  const game=new Game();game.boxes=[{lane:0,color:1,filled:0,timer:0},null,null,null];
  game.slots=Array.from({length:27},(_,i)=>i<26?{id:i,color:0,beltP:i/26,running:false}:null);
  game.pending=[{id:999,color:0,ready:0},{id:1000,color:0,ready:0}];
  for(let i=0;i<600&&game.status==='playing';i++)game.step(1/120);
  assert.equal(game.occupied,27);assert.equal(game.pending.length,1);assert.equal(game.status,'lost');
});

for(const expanded of [false,true])test(`full ${expanded?36:27}-place belt distributes riders evenly around the loop`,()=>{
  const game=new Game();
  if(expanded)assert.equal(game.expand(),true);
  game.boxes.fill(null);
  const pitch=1/game.capacity;
  game.slots=game.slots.map((_,i)=>({id:i,color:0,beltP:i*.98*pitch}));
  game.step(.45);
  for(let i=0;i<game.capacity;i++){
    const next=game.slots[(i+1)%game.capacity];
    const gap=(next.beltP-game.slots[i].beltP+1)%1;
    assert.ok(Math.abs(gap-pitch)<.02*pitch,`unexpected gap ${gap} at rider ${i}`);
  }
});
