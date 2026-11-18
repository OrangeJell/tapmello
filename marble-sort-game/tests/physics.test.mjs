import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Game, LEVEL_COUNT, makeLevel, packGroups, isPackHidden} from '../js/engine.js';

const context={console};
vm.runInNewContext(readFileSync(new URL('../vendor/matter.min.js',import.meta.url),'utf8'),context);
globalThis.window={Matter:context.Matter};
const {Hopper}=await import('../js/physics.js');
const STEP=1/120;
function conservation(game,hopper){
  assert.equal(game.remaining+game.pending.length+game.occupied+game.collected,game.total);
  assert.equal(hopper.balls.size,game.pending.filter(m=>m.motion).length);
  for(const m of game.pending){
    if(!m.motion)continue;
    const {x,y,feedHeld}=m.motion;
    assert.ok(Number.isFinite(x)&&Number.isFinite(y),'finite physical coordinates');
    assert.ok(x>=22&&x<=458&&y>=210&&y<=414,`ball escaped basin: ${x}, ${y}`);
    if(feedHeld)assert.ok(y>=400&&y<412,'held ball must touch the actual gate');
  }
}
function advance(game,hopper,seconds,{settle=false}={}){
  for(let i=0;i<seconds/STEP&&game.status==='playing';i++){
    hopper.step(game,STEP);game.step(STEP);hopper.consume(game.drainEvents());
    if(i%60===0)conservation(game,hopper);
    if(settle&&i>120&&!game.pending.length&&!game.boxes.some(b=>b?.filled===3)&&!game.slots.some(m=>m&&game.boxes.some(b=>b&&b.filled<3&&b.color===m.color)))break;
  }
  conservation(game,hopper);
}

test('all levels use 27 pockets and a minority of mixed boxes',()=>{
  for(let number=1;number<=LEVEL_COUNT;number++){
    const level=makeLevel(number),packs=level.columns.flat(),mixed=packs.filter(p=>packGroups(p).length>1);
    assert.equal(level.capacity,27);assert.equal(mixed.length,level.mixedCount);
    assert.ok(mixed.length/packs.length<=.4);
    mixed.forEach(p=>assert.deepEqual(packGroups(p).map(g=>g.count).sort(),[3,6]));
    const hidden=packs.filter(p=>p.hidden);assert.equal(hidden.length,level.mysteryCount);
    hidden.forEach(p=>{assert.equal(isPackHidden(p,2),true);assert.equal(isPackHidden(p,1),true);assert.equal(isPackHidden(p,0),false);});
  }
});
for(let level=1;level<=LEVEL_COUNT;level++)test(`physical level ${level}: every drop drains and route wins`,()=>{
  const game=new Game(level,{physics:true}),hopper=new Hopper();
  for(const [move,column] of game.level.solution.entries()){
    assert.equal(game.release(column),true,`release move ${move}`);
    advance(game,hopper,45,{settle:true});
    assert.notEqual(game.status,'lost',`overflow at move ${move}`);
    assert.equal(game.pending.length,0,`stranded at move ${move}: ${JSON.stringify(game.pending.map(m=>({id:m.id,motion:m.motion})))}`);
  }
  advance(game,hopper,20);
  assert.equal(game.status,'won');assert.equal(game.collected,game.total);assert.equal(hopper.balls.size,0);
});
test('undo with falling balls restores physical supply and drains again',()=>{
  const game=new Game(3,{physics:true}),hopper=new Hopper();
  const first=game.level.solution[0];game.release(first);advance(game,hopper,.3);
  const other=(first+1)%5;assert.equal(game.release(other),true);advance(game,hopper,.5);
  assert.equal(game.undo(),true);hopper.reset(game);game.drainEvents();advance(game,hopper,45,{settle:true});
  assert.equal(game.status,'playing');assert.equal(game.pending.length,0);
});
test('drops from all five columns move continuously with low rebounds',()=>{
  for(let column=0;column<5;column++){
    const game=new Game(1,{physics:true}),hopper=new Hopper(),last=new Map(),rise=new Map();
    game.release(column);
    for(let step=0;step<120*20&&game.pending.length;step++){
      hopper.step(game,STEP);game.step(STEP);hopper.consume(game.drainEvents());
      for(const m of game.pending){
        if(!m.motion)continue;const p=m.motion,previous=last.get(m.id);
        if(previous){
          assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<6,'no abrupt position jumps');
          const climbing=p.y<previous.y-.015?(rise.get(m.id)??0)+previous.y-p.y:0;rise.set(m.id,climbing);
          assert.ok(climbing<8,'rebound height stays below one marble radius');
        }
        last.set(m.id,{x:p.x,y:p.y});
      }
    }
    assert.equal(game.pending.length,0,'each column drains completely');
  }
});
test('simultaneous releases fail safely, expansion does not duplicate bodies',()=>{
  const game=new Game(8,{physics:true}),hopper=new Hopper();
  const pressure=game.level.stages.findIndex(stage=>stage.pressure);
  for(const stage of game.level.stages.slice(0,pressure)){
    for(const column of stage.route){game.release(column);advance(game,hopper,45,{settle:true});}
  }
  for(let col=0;col<5;col++)game.release(col);
  advance(game,hopper,60);assert.equal(game.status,'lost');
  assert.equal(game.expand(),true);advance(game,hopper,10);conservation(game,hopper);
});
test('the 24-ball bottleneck still admits its target without a premature loss',()=>{
  // Station positions change the exact pickup time; retain a real full-belt
  // sample without requiring every pressure stage to fill all 27 slots.
  let observed=false;
  for(const number of [6,13,20,30,40]){
    const game=new Game(number,{physics:true}),hopper=new Hopper();
    const stageIndex=game.level.stages.findIndex(stage=>stage.kind==='doubleLock');
    for(const stage of game.level.stages.slice(0,stageIndex)){
      for(const column of stage.route){game.release(column);advance(game,hopper,45,{settle:true});}
    }
    const route=game.level.stages[stageIndex].route;
    for(const column of route.slice(0,3)){assert.equal(game.release(column),true);advance(game,hopper,45,{settle:true});}
    assert.equal(game.occupied,24);assert.equal(game.pending.length,0);
    assert.equal(game.release(route[3]),true);
    let fullAt=null,drained=false;
    for(let i=0;i<120*30&&game.status==='playing';i++){
      hopper.step(game,STEP);game.step(STEP);hopper.consume(game.drainEvents());
      const matching=game.slots.some(m=>m&&game.boxes.some(b=>b&&b.filled<3&&b.color===m.color));
      if(game.occupied===27&&game.pending.some(m=>m.ready<=game.time)&&matching){assert.equal(game.status,'playing');fullAt??=game.collected;}
      if(fullAt!==null&&game.collected>fullAt){drained=true;break;}
    }
    assert.notEqual(game.status,'lost');
    if(fullAt!==null){assert.equal(drained,true,'target collection frees space at full capacity');observed=true;break;}
  }
  assert.equal(observed,true,'at least one target reaches and drains the full belt');
});

test('three rapid clicks in one column release all three offices and drain without stranded bodies',()=>{
  const game=new Game(2,{physics:true}),hopper=new Hopper();
  const column=game.columns.findIndex(c=>c.length>=3),before=game.columns[column].length;
  for(let i=0;i<3;i++){assert.equal(game.release(column),true);advance(game,hopper,.08);}
  assert.equal(game.moves,3);assert.equal(game.columns[column].length,before-3);
  advance(game,hopper,12);
  assert.equal(game.pending.length,0);assert.equal(hopper.balls.size,0);
});
test('each single office reaches the moving belt promptly',()=>{
  for(let column=0;column<5;column++){
    const game=new Game(1,{physics:true}),hopper=new Hopper();game.release(column);
    advance(game,hopper,3.5);assert.equal(game.pending.length,0,`column ${column} should drain within 3.5s`);
  }
});
