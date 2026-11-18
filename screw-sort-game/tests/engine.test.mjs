import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../js/levels.js';
import { createState, transition, move, availableScrews, targetBox, validateLevel, totalScrews, COLORS, selectableBoards, poseOf } from '../js/engine.js';
import { solve } from '../js/solver.js';
const triple=c=>[c,c,c];
function fixture(){const colors=[...triple('coral'),...triple('blue'),...triple('gold'),...triple('gold')];return{id:99,version:'test',queue:['coral','blue','gold','gold'],boards:colors.map((color,i)=>({id:`p${i}`,shape:'ellipse',x:i*70,y:100,width:40,height:40,angle:0,z:i,layer:0,screws:[{id:`s${i}`,x:0,y:0,color}]}))};}
function play(level,state,ids){for(const id of ids){const result=move(level,state,id);assert.ok(result.accepted,id);state=result.state;}return state;}
function conserved(level,state){
 assert.equal(state.removed.length,new Set(state.removed).size);
 for(const color of COLORS){const all=level.boards.flatMap(b=>b.screws),total=all.filter(s=>s.color===color).length;
  const onBoard=all.filter(s=>s.color===color&&!state.removed.includes(s.id)).length;
  const waiting=state.buffer.filter(s=>s.color===color).length,boxes=state.boxes.filter(b=>b?.color===color);
  const packed=((state.queue||level.queue).slice(0,state.queueIndex).filter(c=>c===color).length-boxes.length)*3;
  assert.equal(onBoard+waiting+boxes.reduce((n,b)=>n+b.count,0)+packed,total,`Lost ${color} screws`);
 }
}
test('all ten levels keep a legal two-box, five-slot path without rewards',()=>{
 assert.equal(LEVELS.length,10);const counts=LEVELS.map(totalScrews);assert.deepEqual(counts,[15,75,90,105,120,150,150,165,165,180]);
 for(const level of LEVELS){validateLevel(level);let state=createState(level);
  for(const id of level.solution){state=play(level,state,[id]);conserved(level,state);assert.ok(state.buffer.length<5);}
  assert.equal(state.status,'won');assert.equal(state.packed,totalScrews(level));assert.equal(state.boxes.length,4);assert.equal(state.capacity,5);
 }
});
test('the introductory scattered designs independently solve without rewards',()=>{
 for(const level of LEVELS.slice(0,2)){
  const independent=solve(level);assert.ok(independent.solution);
  const state=play(level,createState(level),independent.solution);conserved(level,state);assert.equal(state.status,'won');
 }
});
test('level two exposes several colours, requires temporary storage, and can jam',()=>{
 const level=LEVELS[1];let state=createState(level),maximum=0;
 const exposed=availableScrews(level,state);assert.ok(exposed.length>=5);assert.ok(new Set(exposed.map(s=>s.color)).size>=4);
 for(const id of level.solution){state=play(level,state,[id]);maximum=Math.max(maximum,state.buffer.length);}assert.ok(maximum>=1&&maximum<=4);
 state=play(level,createState(level),level.jamPath);assert.equal(state.status,'jammed');
});
test('adding a box continues from failure, drains waiting screws and preserves all progress',()=>{
 const level=LEVELS[1],before=play(level,createState(level),level.jamPath);
 const result=transition(level,before,{type:'continue'}),state=result.state;
 assert.ok(result.accepted);assert.equal(state.status,'playing');assert.deepEqual(state.removed,before.removed);
 assert.equal(state.moves,before.moves);assert.equal(state.capacity,before.capacity);assert.deepEqual(state.poses,before.poses);
 assert.equal(state.unlocked.filter(Boolean).length,3);assert.ok(state.buffer.length<before.buffer.length);conserved(level,state);
 assert.equal(transition(level,state,{type:'continue'}).accepted,false);assert.ok(solve(level,state).solution);
});
test('four open boxes continue with slots up to seven, then require restart',()=>{
 const level=fixture();level.queue.push('gold');
 for(let i=12;i<15;i++)level.boards.push({id:`p${i}`,shape:'ellipse',x:i*70,y:100,width:40,height:40,angle:0,z:i,layer:0,screws:[{id:`s${i}`,x:0,y:0,color:'gold'}]});
 let state=createState(level);state.unlocked=[true,true,true,true];
 state=play(level,state,['s6','s7','s8','s9','s10']);
 for(const [capacity,id] of [[6,'s11'],[7,'s12']]){
  const result=transition(level,state,{type:'continue',reward:'extra'});assert.ok(result.accepted);state=result.state;
  assert.equal(state.boxes.length,4);assert.equal(state.capacity,capacity);assert.equal(state.status,'playing');conserved(level,state);
  state=play(level,state,[id]);assert.equal(state.status,'jammed');
 }
 assert.equal(transition(level,state,{type:'continue'}).accepted,false);conserved(level,state);
});
test('fifth unmatched screw jams immediately, even with an exposed direct match',()=>{
 const level=fixture(),state=play(level,createState(level),['s6','s7','s8','s9','s10']);
 assert.ok(availableScrews(level,state).some(s=>targetBox(state,s.color)>=0));assert.equal(state.status,'jammed');assert.equal(move(level,state,'s0').accepted,false);
});
test('transitions are immutable and duplicate taps cannot consume twice',()=>{
 const level=fixture(),before=createState(level),result=move(level,before,'s0');assert.deepEqual(before.removed,[]);assert.equal(result.state.boxes[0].count,1);assert.equal(move(level,result.state,'s0').accepted,false);
});
test('matching boxes prefer the fuller box',()=>{
 const state=createState(LEVELS[0]);state.boxes=[{color:'blue',count:0},{color:'blue',count:2},null,null];assert.equal(targetBox(state,'blue'),1);
});
test('unlock consumes the queue and settles tray screws without creating demand',()=>{
 const level=fixture();let state=play(level,createState(level),['s6','s7','s8']);state=transition(level,state,{type:'unlock',index:2}).state;
 assert.equal(state.buffer.length,0);assert.equal(state.packed,3);assert.equal(state.queueIndex,4);conserved(level,state);
 assert.equal(transition(level,state,{type:'unlock',index:2}).accepted,false);assert.equal(transition(level,state,{type:'unlock',index:3}).accepted,false);
});
test('removed clear-slot rewards cannot discard waiting screws',()=>{
 const level=fixture(),state=play(level,createState(level),['s6','s7','s8']);
 const result=transition(level,state,{type:'clear'});assert.equal(result.accepted,false);
 assert.deepEqual(result.state,state);assert.equal(state.buffer.length,3);conserved(level,state);
});
test('slots cap at seven and a new round resets rewards',()=>{
 const level=fixture();let state=createState(level);state=transition(level,state,{type:'extra'}).state;state=transition(level,state,{type:'extra'}).state;
 assert.equal(state.capacity,7);assert.equal(transition(level,state,{type:'extra'}).accepted,false);assert.equal(createState(level).capacity,5);assert.equal(createState(level,{openBoxes:3}).boxes.filter(Boolean).length,3);
});
test('melting preserves screws and leaves a solvable board; credit is consumed only on selection',()=>{
 const level=LEVELS[0];let state=createState(level);const target=selectableBoards(level,state).at(-1);
 assert.equal(transition(level,state,{type:'melt',id:target.id}).accepted,false);state=transition(level,state,{type:'grantMelt'}).state;assert.equal(state.meltCredits,1);
 assert.equal(transition(level,state,{type:'grantMelt'}).accepted,false);state=transition(level,state,{type:'melt',id:target.id}).state;
 assert.ok(state.melted.includes(target.id));assert.equal(state.removed.length,0);assert.equal(Object.keys(state.floating).length,target.screws.length);conserved(level,state);assert.ok(solve(level,state).solution);assert.equal(state.meltCredits,0);
});
test('covered screws cannot be removed through transparent glass',()=>{
 const level=LEVELS[1],state=createState(level),legal=new Set(availableScrews(level,state).map(s=>s.id));const blocked=level.boards.flatMap(b=>b.screws).find(s=>!legal.has(s.id));assert.ok(blocked);assert.equal(move(level,state,blocked.id).accepted,false);
});

test('uncovered glass is exposed regardless of its authored layer number',()=>{
 const level=fixture();level.boards.forEach((b,i)=>{b.layer=i%4;});const state=createState(level);
 assert.equal(availableScrews(level,state).length,12);
});
test('empty glass remains a physical blocker until its supporting glass drops',()=>{
 const level=fixture();level.boards.forEach((b,i)=>{b.x=400+i*70;});
 Object.assign(level.boards[0],{x:100,y:100,width:80,height:40,shape:'rounded'});
 Object.assign(level.boards[1],{x:100,y:190,width:100,height:40,shape:'rounded'});
 let state=play(level,createState(level),['s0']);assert.ok(state.loose.p0);assert.ok(!state.fallen.includes('p0'));
 assert.ok(state.loose.p0.y>100&&state.loose.p0.y<190);
 state=play(level,state,['s1']);assert.ok(state.fallen.includes('p0'));assert.ok(state.fallen.includes('p1'));assert.deepEqual(state.loose,{});
 conserved(level,state);
});

test('releasing a support in place wakes every loose plate it holds',()=>{
 const level=fixture();level.boards.forEach((b,i)=>{b.x=400+i*70;});
 for(const [index,y] of [100,170,260].entries())Object.assign(level.boards[index],{x:100,y,width:index===2?180:130,height:50,shape:'rounded'});
 let state=play(level,createState(level),['s0','s1']);
 assert.ok(state.loose.p0&&state.loose.p1);assert.ok(state.resting.p0&&state.resting.p1);
 const result=transition(level,state,{type:'screw',id:'s2'},{captureMotion:true});
 assert.equal(result.accepted,true);
 for(const id of ['p0','p1','p2']){assert.ok(result.state.fallen.includes(id),id);assert.ok(result.motions.has(id));}
 assert.deepEqual(result.state.loose,{});
});


test('transient exposed screws use the visible swing pose and still reject covered heads',()=>{
 const level=fixture();level.boards.forEach((b,i)=>{b.layer=i;b.x=500+i*70;});
 const lower=level.boards[0],upper=level.boards[1];
 Object.assign(lower,{x:50,y:260,width:50,height:50,z:0});
 Object.assign(upper,{shape:'bar',x:100,y:180,width:150,height:50,z:10,screws:[{...upper.screws[0],x:-50}]});
 const state=createState(level);state.poses[upper.id]={x:50,y:230,angle:90};
 assert.equal(move(level,state,'s0').accepted,false);
 const visible={x:50,y:230,angle:90};
 assert.equal(transition(level,state,{type:'screw',id:'s0',scenePoses:{p1:visible}}).accepted,false);
 const exposed={x:100,y:180,angle:0};
 const result=transition(level,state,{type:'screw',id:'s0',scenePoses:{p1:exposed}});
 assert.equal(result.accepted,true);assert.ok(result.state.removed.includes('s0'));
 assert.equal(transition(level,state,{type:'screw',id:'s0',scenePoses:{p1:{...exposed,x:400}}}).accepted,false);
});

test('an exposed head on a large deep plate stays playable at its uncovered edge',()=>{
 const level=fixture();level.boards.forEach((b,i)=>{b.layer=i;b.x=500+i*70;});
 Object.assign(level.boards[0],{x:100,y:100,width:200,height:70,z:0,shape:'bar',screws:[{id:'s0',x:-75,y:0,color:'coral'}]});
 for(let i=1;i<6;i++)Object.assign(level.boards[i],{x:150,y:100,width:70,height:70,z:i});
 assert.ok(availableScrews(level,createState(level)).some(s=>s.id==='s0'));
});
