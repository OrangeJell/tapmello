import test from 'node:test';
import assert from 'node:assert/strict';
import { simulatePlates } from '../js/plate-physics.js';
import { worldContour, polygonsOverlap, positionOf } from '../js/geometry.js';
const upper={id:'upper',shape:'rounded',width:156,height:110,x:128,y:185,angle:8,screws:[{id:'left',x:-34,y:-16},{id:'right',x:34,y:-16}]};
const support={id:'support',shape:'bar',width:244,height:54,x:180,y:292,angle:0,screws:[{id:'base',x:0,y:0}]};

test('a released plate collides, settles on its bridge, and falls after bridge release',()=>{
 const result=simulatePlates([{board:upper,pose:upper,free:true},{board:support,pose:support,free:false}]);
 const fall=result.get(upper.id);
 assert.ok(fall.impacts.length);assert.equal(fall.offscreen,false);assert.equal(fall.resting,true);
 assert.ok(fall.frames.every(f=>!polygonsOverlap(worldContour(upper,f.pose),worldContour(support))));
 const released=simulatePlates([{board:upper,pose:fall.pose,free:true},{board:support,pose:support,free:true}]);
 assert.equal(released.get('upper').offscreen,true);assert.equal(released.get('support').offscreen,true);
});
test('pinned glass keeps its anchor and is constrained by the bridge during the whole swing',()=>{
 const pivot=upper.screws[1],anchor=positionOf(upper,pivot);
 const result=simulatePlates([{board:upper,pose:upper,pivot},{board:support,pose:support,free:false}]).get('upper');
 assert.ok(Math.abs(result.pose.angle-upper.angle)>5);
 for(const frame of result.frames){const p=positionOf(upper,pivot,frame.pose);assert.ok(Math.hypot(p.x-anchor.x,p.y-anchor.y)<1e-6);assert.equal(polygonsOverlap(worldContour(upper,frame.pose),worldContour(support)),false);}
});
test('free fall accelerates and does not stretch a short physical movement to one second',()=>{
 const piece={...upper,y:420};const fall=simulatePlates([{board:piece,pose:piece,free:true}]).get('upper');
 assert.equal(fall.offscreen,true);assert.ok(fall.duration<1000);
 const frames=fall.frames.filter(f=>f.opacity),first=frames[1].pose.y-frames[0].pose.y,last=frames.at(-1).pose.y-frames.at(-2).pose.y;
 assert.ok(last>first*2);
});

test('occlusion follows physical depth even when a back plate has a later drawing ID',async()=>{
 const {createState,availableScrews}=await import('../js/engine.js');
 const piece={shape:'rounded',width:80,height:80,x:180,y:150,angle:0};
 const level={id:99,version:'contact-test',queue:['blue','coral','gold','mint'],boards:[
  {...piece,id:'back',z:20,layer:0,screws:[{id:'back-screw',x:0,y:0,color:'coral'}]},
  {...piece,id:'front',z:1,layer:1,screws:[{id:'front-screw',x:0,y:0,color:'blue'}]},
 ]};
 assert.deepEqual(availableScrews(level,createState(level)).map(s=>s.id),['front-screw']);
});
