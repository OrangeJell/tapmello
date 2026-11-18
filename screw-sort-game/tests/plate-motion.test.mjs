import test from 'node:test';
import assert from 'node:assert/strict';
import { constrainedHang, worldContour, polygonsOverlap, positionOf, boardPose, intersectsAt, SHAPES } from '../js/geometry.js';
import { swingFrames, fallFrames } from '../js/plate-motion.js';
import { simulatePlates } from '../js/plate-physics.js';
import { LEVELS } from '../js/levels.js';
import { createState,move,activeBoards,poseOf } from '../js/engine.js';
const board={id:'test',shape:'rounded',width:130,height:50,x:100,y:100,angle:0,screws:[{id:'a',x:-42,y:0},{id:'b',x:42,y:0}]};
const obstacle={shape:'rounded',width:90,height:60,x:180,y:175,angle:0};
test('same-layer contact limits hanging motion, then releases when the support disappears',()=>{
 const pivot=board.screws[0],from={x:board.x,y:board.y,angle:board.angle},obstacles=[{polygon:worldContour(obstacle)}];
 const rest=constrainedHang(board,pivot,from,obstacles),free=boardPose(board,new Set(['b']));
 assert.ok(rest.angle<free.angle-5);assert.equal(intersectsAt(board,rest,obstacles),false);
 const released=constrainedHang(board,pivot,rest,[]);assert.equal(released.angle,free.angle);
});
test('pendulum sways past vertical, damps, and holds its remaining screw fixed',()=>{
 const pivot=board.screws[0],from={x:board.x,y:board.y,angle:board.angle},to=boardPose(board,new Set(['b']));
 const {frames,duration}=swingFrames(board,pivot,from,to,[]),anchor=positionOf(board,pivot);
 assert.ok(duration>1000);assert.ok(frames.some(f=>f.pose.angle>to.angle+2));assert.deepEqual(frames.at(-1).pose,to);
 for(const frame of frames){const p=positionOf(board,pivot,frame.pose);assert.ok(Math.hypot(p.x-anchor.x,p.y-anchor.y)<1e-6);}
 const contact=constrainedHang(board,pivot,from,[{polygon:worldContour(obstacle)}]);
 for(const frame of swingFrames(board,pivot,from,contact,[{polygon:worldContour(obstacle)}]).frames)assert.equal(intersectsAt(board,frame.pose,[{polygon:worldContour(obstacle)}]),false);
});
test('crescent glass swings back around every screw instead of making full revolutions',()=>{
 const crescents=LEVELS.find(level=>level.id===4).boards.filter(b=>b.shape==='crescent');
 for(const piece of crescents)for(const pivot of piece.screws) {
  const {frames}=simulatePlates([{board:piece,pose:piece,pivot,free:false}]).get(piece.id);
  const anchor=positionOf(piece,pivot),angles=frames.map(f=>f.pose.angle);
  assert.ok(Math.max(...angles)-Math.min(...angles)<360,`${piece.id}/${pivot.id}: full revolution`);
  const deltas=angles.slice(1).map((angle,i)=>angle-angles[i]);
  assert.ok(deltas.some(delta=>delta>.0001)&&deltas.some(delta=>delta<-.0001),`${piece.id}/${pivot.id}: no natural return swing`);
  for(const {pose}of frames) {
   assert.ok([pose.x,pose.y,pose.angle].every(Number.isFinite));
   const p=positionOf(piece,pivot,pose);
   assert.ok(Math.hypot(p.x-anchor.x,p.y-anchor.y)<1e-6,'Remaining screw moved');
  }
 }
});
test('a crescent hanging from its side retains enough momentum to sway past vertical',()=>{
 const piece=LEVELS.find(level=>level.id===4).boards.find(b=>b.shape==='crescent'),pivot=piece.screws[1];
 const target=boardPose(piece,new Set(piece.screws.filter(s=>s!==pivot).map(s=>s.id))).angle;
 const {frames}=simulatePlates([{board:piece,pose:piece,pivot,free:false}]).get(piece.id);
 const direction=Math.sign(target-piece.angle);
 assert.ok(frames.some(f=>(f.pose.angle-target)*direction>5),'Swing lost its momentum before passing vertical');
 assert.ok(Math.max(...frames.map(f=>(f.pose.angle-target)*direction))<20,'Return swing is too wide');
 assert.ok(Math.abs(frames.at(-1).pose.angle-target)<10,'Return swing takes too long to settle');
});
test('hanging glass keeps progressively smaller return swings through a faint final sway',()=>{
 const piece=LEVELS.find(level=>level.id===4).boards.find(b=>b.shape==='crescent'),pivot=piece.screws[1];
 const target=boardPose(piece,new Set(piece.screws.filter(s=>s!==pivot).map(s=>s.id))).angle;
 const movement=simulatePlates([{board:piece,pose:piece,pivot,free:false}]).get(piece.id),peaks=[];
 for(let i=1;i<movement.frames.length-1;i++) {
  const before=movement.frames[i-1],frame=movement.frames[i],after=movement.frames[i+1];
  if((frame.pose.angle-before.pose.angle)*(after.pose.angle-frame.pose.angle)<0)peaks.push(frame.pose.angle-target);
 }
 assert.ok(peaks.length>=3,'Small return swings were cut off');
 for(let i=1;i<peaks.length;i++) {
  assert.ok(peaks[i]*peaks[i-1]<0,'Return swing did not alternate sides');
  assert.ok(Math.abs(peaks[i])<Math.abs(peaks[i-1])*.5,'Return swing did not decay');
 }
 assert.ok(Math.abs(peaks.at(-1))>.08&&Math.abs(peaks.at(-1))<1,'Missing faint final sway');
 assert.equal(movement.resting,true);
 assert.ok(Math.abs(movement.pose.angle-target)<.06,'Stopped before reaching equilibrium');
 const last=movement.frames.filter(frame=>frame.time>=movement.duration/1000-.35);
 assert.ok(Math.max(...last.map(f=>f.pose.angle))-Math.min(...last.map(f=>f.pose.angle))<.05,'Motion stopped abruptly');
});
test('small initial swings settle sooner than large swings',()=>{
 const piece=LEVELS.find(level=>level.id===4).boards.find(b=>b.shape==='crescent'),pivot=piece.screws[1];
 const target=boardPose(piece,new Set(piece.screws.filter(s=>s!==pivot).map(s=>s.id)));
 const small=simulatePlates([{board:piece,pose:{...target,angle:target.angle+2},pivot,free:false}]).get(piece.id);
 const large=simulatePlates([{board:piece,pose:piece,pivot,free:false}]).get(piece.id);
 assert.ok(small.duration<large.duration,'Every swing uses the same fixed duration');
 assert.equal(small.resting,true);
});
test('a falling plate stays on its support and resumes falling when that support disappears',()=>{
 const obstacles=[{polygon:worldContour({...obstacle,x:100})}],fall=fallFrames(board,{x:100,y:100,angle:0},obstacles);
 assert.ok(fall.duration>0);assert.equal(fall.resting,true);assert.equal(fall.offscreen,false);assert.equal(fall.frames.at(-1).opacity,1);
 for(const f of fall.frames)assert.equal(intersectsAt(board,f.pose,obstacles),false);
 const released=fallFrames(board,fall.pose,[]);assert.equal(released.offscreen,true);assert.equal(released.frames.at(-1).opacity,0);
});
test('a rim impact briefly rebounds and an off-centre impact keeps falling with momentum',()=>{
 const support={polygon:worldContour({...obstacle,x:100})},fall=fallFrames(board,board,[support]);
 const impact=fall.impacts.find(hit=>hit.rebound>8);assert.ok(impact,'No impact rebound');
 assert.ok(fall.frames.some(frame=>frame.time>impact.time&&frame.time<impact.time+.2&&frame.pose.y<impact.pose.y-.3),'Impact did not lift the plate');
 assert.ok(fall.duration<1800,'Contact settled too slowly');
 const edge={polygon:worldContour({...obstacle,x:150})},released=fallFrames(board,board,[edge]);
 assert.ok(released.impacts.length);assert.equal(released.offscreen,true);assert.ok(released.duration<2500);
 for(const frame of released.frames)assert.equal(intersectsAt(board,frame.pose,[edge]),false);
});

test('loose glass falls together instead of becoming mutual static supports',()=>{
 const upper={...board,id:'upper',y:100},lower={...board,id:'lower',y:160};
 const falls=simulatePlates([upper,lower].map(board=>({board,pose:board,free:true})));
 assert.equal(falls.get('upper').offscreen,true);assert.equal(falls.get('lower').offscreen,true);
});

test('a supported loose stack wakes when its bottom support becomes loose',()=>{
 const boards=[{...board,id:'upper',y:100},{...board,id:'middle',y:170},{...board,id:'base',y:260,width:180}];
 const supported=simulatePlates(boards.map((board,i)=>({board,pose:board,free:i<2})));
 for(const id of ['upper','middle']){assert.equal(supported.get(id).offscreen,false);assert.equal(supported.get(id).resting,true);}
 const released=simulatePlates(boards.map(board=>({board,pose:supported.get(board.id)?.pose||board,free:true})));
 for(const board of boards)assert.equal(released.get(board.id).offscreen,true);
});

test('new concave and letter contours fall with finite poses instead of sticking',()=>{
 for(const shape of SHAPES) {
  const piece={...board,shape,width:180,height:180,x:180,y:100};
  const fall=simulatePlates([{board:piece,pose:piece,free:true}]).get(piece.id);
  assert.equal(fall.offscreen,true,shape);
  assert.ok(fall.frames.every(f=>[f.pose.x,f.pose.y,f.pose.angle].every(Number.isFinite)),shape);
 }
});
test('generated layouts have varied areas and pin counts and keep stable same-layer glass separate',()=>{
 const all=LEVELS.flatMap(l=>l.boards),counts=new Set(all.map(b=>b.screws.length));
 assert.ok(counts.has(1));assert.ok(Math.max(...counts)>=5);assert.ok(counts.size>=4);
 assert.ok(Math.max(...all.map(b=>b.width*b.height))/Math.min(...all.map(b=>b.width*b.height))>4);
 for(const level of LEVELS){let state=createState(level);for(const id of level.solution){state=move(level,state,id).state;
 const active=activeBoards(level,state);for(const a of active)for(const b of active)if(a.z<b.z&&a.layer===b.layer)assert.equal(polygonsOverlap(worldContour(a,poseOf(a,state)),worldContour(b,poseOf(b,state))),false,`${level.id}/${a.id}/${b.id}`);}}
});
