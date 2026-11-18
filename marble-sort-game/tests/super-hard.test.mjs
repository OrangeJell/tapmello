import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,isPackHidden} from '../js/engine.js';
import {createLevel,LEVEL_COUNT,LEVEL_PROFILES,SUPER_HARD_LEVELS,isSuperHardLevel} from '../js/levels.js';
import {SUPER_HARD_PATTERNS} from '../js/shift-patterns.js';

function settle(game){
  for(let i=0;i<900&&game.status==='playing';i++){
    game.step(.05);game.drainEvents();
    if(i>40&&!game.pending.length&&!game.boxes.some(box=>box?.filled===3)&&!game.canBeltProgress)break;
  }
}
function fork(game){
  const branch=new Game(game.level.number);
  branch.level=game.level;
  Object.assign(branch,game.snapshot());
  return branch;
}
function checkTemptation(game,stage){
  const {decisionMove,temptationColumn}=stage.trap;
  const correct=stage.route[decisionMove],bait=game.columns[temptationColumn][0];
  assert.notEqual(correct,temptationColumn);
  assert.ok(bait.colors.some(color=>game.boxes.some(box=>box?.color===color&&box.filled<3)),
    'a front bus makes the wrong house look useful');
  assert.equal(isPackHidden(bait,0),false);
  assert.equal(isPackHidden(game.columns[correct][0],0),false);
  const wrong=fork(game),before=wrong.collected;
  assert.equal(wrong.release(temptationColumn),true);settle(wrong);
  assert.ok(wrong.collected>before,'the tempting choice really boards animals');
  assert.equal(wrong.status,'playing','the next release, not a surprise timer, causes failure');
  assert.equal(wrong.pending.length,0);
  assert.equal(wrong.occupied,27);
  assert.equal(wrong.canBeltProgress,false);
  // No hidden alternative or later-stage house can rescue the mistaken choice.
  for(let column=0;column<5;column++)if(wrong.columns[column].length){
    const next=fork(wrong);assert.equal(next.release(column),true);settle(next);
    assert.equal(next.status,'lost','any further release demonstrates the local mistake');
  }
  assert.equal(game.release(correct),true);settle(game);
  assert.equal(game.status,'playing');
  assert.ok(game.occupied<18,'the right order visibly releases the backlog');
}

test('super-hard peaks start at five with alternating two and three ordinary levels',()=>{
  assert.deepEqual(SUPER_HARD_LEVELS,[5,8,12,15,19,22,26,29,33,36,40,43,47,50,54,57]);
  for(let n=1;n<=LEVEL_COUNT;n++){
    const level=createLevel(n),traps=level.stages.flatMap((stage,index)=>stage.trap?[index]:[]);
    if(!isSuperHardLevel(n)){assert.deepEqual(traps,[]);continue;}
    assert.equal(level.stages.length,LEVEL_PROFILES[n-1].stages);
    assert.equal(level.capacity,27);assert.equal(level.colorCount,LEVEL_PROFILES[n-1].colorCount);
    assert.deepEqual(traps,[Math.min(level.stages.length-3,Math.floor(level.stages.length/2)),level.stages.length-2]);
    assert.equal(level.stages[0].phase,'opening');assert.equal(level.stages[1].phase,'build');
    assert.equal(level.stages.at(-1).phase,'resolution');assert.equal(level.stages.at(-1).pressure,false);
    let moves=0;
    for(const [index,stage] of level.stages.entries()){
      if(stage.trap){
        const fraction=(moves+stage.trap.decisionMove)/level.solution.length;
        assert.ok(fraction>=.4,`level ${n}: decision at ${fraction} must follow the early game`);
        if(index===traps[0])assert.ok(fraction<=.7,'the first decision is in the middle');
        if(index===traps[1]){
          assert.ok(fraction>=.65,'the second decision is late');
          assert.ok(level.solution.length-moves-stage.trap.decisionMove>=7,'leave the recovery and a full clean finishing stage');
        }
      }else assert.ok(!['doubleLock','switchyard'].includes(stage.kind),'avoid additional extreme peaks');
      moves+=stage.route.length;
    }
    assert.deepEqual(createLevel(n),level,'retry keeps the learned solution');
  }
});

for(const number of SUPER_HARD_LEVELS)test(`super-hard ${number}: two readable temptations fail locally, the correct route wins`,()=>{
  const game=new Game(number);
  for(const stage of game.level.stages){
    if(stage.trap){
      // All houses belonging to a decision stay readable, including next-house
      // previews. Hidden colours elsewhere keep the original mystery budget.
      const columns=game.columns.map(column=>[...column]);
      for(const column of stage.route){const pack=columns[column].shift();assert.equal(pack.hidden,false);}
    }
    for(const [move,column] of stage.route.entries()){
      if(stage.trap&&move===stage.trap.decisionMove)checkTemptation(game,stage);
      else{assert.equal(game.release(column),true);settle(game);}
      assert.notEqual(game.status,'lost');assert.equal(game.pending.length,0);
      if(stage.phase==='resolution')assert.equal(game.occupied,0,'the last stage is a clean finish');
    }
    assert.equal(game.occupied,0,'each stage ends without an invisible debt');
  }
  assert.equal(game.status,'won');assert.equal(game.collected,game.total);
  assert.equal(game.undoLeft,1);assert.equal(game.expanded,false);
});

const permutations=values=>values.length?values.flatMap((value,i)=>permutations(values.filter((_,j)=>i!==j)).map(rest=>[value,...rest])):[[]];
for(const pattern of SUPER_HARD_PATTERNS)test(`${pattern.kind}: safe and tempting branches survive all 24 station arrangements`,()=>{
  for(const order of permutations([0,1,2,3])){
    const game=new Game(1);
    game.level={...game.level,total:pattern.packs.length*9};
    game.columns=Array.from({length:5},()=>[]);
    pattern.packs.forEach((pack,i)=>game.columns[pattern.positions[i]].push({id:i+1,colors:pack.flatMap(color=>[color,color,color]),hidden:false}));
    game.busLanes=order.map(lane=>[...pattern.queues[lane]]);
    game.boxes=game.busLanes.map((_,lane)=>game.newBox(lane));
    const stage={route:pattern.positions,trap:{decisionMove:pattern.decisionMove,temptationColumn:pattern.temptationPosition}};
    for(const [move,column] of stage.route.entries()){
      if(move===stage.trap.decisionMove)checkTemptation(game,stage);
      else{assert.equal(game.release(column),true);settle(game);}
      assert.notEqual(game.status,'lost');
    }
    assert.equal(game.status,'won');
  }
});
