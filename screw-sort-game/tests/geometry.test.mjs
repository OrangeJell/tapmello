import test from 'node:test';
import assert from 'node:assert/strict';
import { contour, centroid, boardPose, hangingPose, positionOf, covers, polygonCovers, SHAPES, worldContour, fitsInside, headExposure, stackDepths } from '../js/geometry.js';
import { LEVELS } from '../js/levels.js';
import { createState, availableScrews } from '../js/engine.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const piece=(shape='bar')=>({shape,x:180,y:180,width:120,height:100,angle:17,screws:[{id:'a',x:-40,y:-24},{id:'b',x:40,y:-24},{id:'c',x:0,y:30}]});
test('concave outlines do not act as rectangular blockers',()=>{
 const b={...piece(),x:0,y:0,angle:0};assert.equal(covers({...b,shape:'l'},{x:25,y:-25},5),false);assert.equal(covers({...b,shape:'l'},{x:-40,y:-25},5),true);assert.equal(covers({...b,shape:'heart'},{x:0,y:-48},0),false);assert.equal(covers({...b,shape:'heart'},{x:0,y:0},0),true);
});
test('single-pin swings keep the anchor fixed and settle with mass beneath it',()=>{
 for(const shape of SHAPES){const b=piece(shape),pin=b.screws[2],rest=boardPose(b,new Set(['a','b'])),anchor=positionOf(b,pin),mass=positionOf(b,centroid(b),rest);close(anchor.x,mass.x);assert.ok(mass.y>anchor.y);
 for(let t=0;t<=1;t+=.1){const p=positionOf(b,pin,hangingPose(b,pin,b.angle+(rest.angle-b.angle)*t));close(p.x,anchor.x);close(p.y,anchor.y);}}
});
test('authored screw heads fit inside glass with safe spacing and visible starting positions',()=>{
 for(const level of LEVELS)for(const b of level.boards){for(const s of b.screws){assert.ok(fitsInside(b,s,16),`${level.id}/${s.id}`);const p=positionOf(b,s);assert.ok(p.x>=16&&p.x<=344&&p.y>=16&&p.y<=484);}
 for(let i=0;i<b.screws.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(b.screws[i].x-b.screws[j].x,b.screws[i].y-b.screws[j].y)>=59);}
});
test('authored openings expose meaningful choices without a fixed fifteen-head target',()=>{
 for(const level of LEVELS){const exposed=availableScrews(level,createState(level));
 assert.ok(exposed.length>=5&&exposed.length<=22,`Level ${level.id}: ${exposed.length} exposed`);
 assert.ok(new Set(exposed.map(s=>s.color)).size>=(level.id===1?2:4));}
});
test('drawing, mass and occlusion share one contour',()=>{
 for(const shape of SHAPES){const b=piece(shape),world=worldContour(b);assert.ok(Number.isFinite(centroid(b).x));contour(b).forEach((point,i)=>{const p=positionOf(b,point);close(p.x,world[i].x);close(p.y,world[i].y);});}
});

test('only a partially exposed screw head has an edge to rebound from',()=>{
 const box=(left,right)=>[{x:left,y:-40},{x:right,y:-40},{x:right,y:40},{x:left,y:40}];
 const point={x:0,y:0};assert.equal(headExposure(point,[box(-40,40)]),0);
 assert.equal(headExposure(point,[]),1);const edge=headExposure(point,[box(0,40)]);assert.ok(edge>0&&edge<1);
 assert.equal(headExposure(point,[box(-40,1),box(-1,40)]),0);
});

test('each glass depth follows real overlap, while an isolated plate is always first',()=>{
 const b=(id,z,x=0)=>({...piece(),id,z,x,y:0,angle:0,width:100,height:100});
 const plates=[b('bottom',0),b('middle',1),b('top',2),b('isolated',3,300)];
 const entries=plates.map(board=>({board,polygon:worldContour(board)})),depths=stackDepths(entries);
 assert.equal(depths.get('top'),0);assert.equal(depths.get('isolated'),0);assert.equal(depths.get('middle'),1);assert.equal(depths.get('bottom'),2);
 const exposed=stackDepths(entries.filter(e=>e.board.id!=='top'));assert.equal(exposed.get('middle'),0);assert.equal(exposed.get('bottom'),1);
});

test('an overlap chain does not hide exposed glass at its far edge',()=>{
 const boards=Array.from({length:6},(_,i)=>({...piece(),id:`chain${i}`,z:i,x:i*80,y:0,angle:0,width:100,height:100}));
 const depths=stackDepths(boards.map(board=>({board,polygon:worldContour(board)})));
 assert.equal(depths.get('chain0'),1);assert.equal(depths.get('chain1'),1);assert.equal(depths.get('chain5'),0);
});

test('separate covers at opposite rims count as one layer of coverage',()=>{
 const board={...piece('bar'),id:'base',z:0,x:0,y:0,angle:0,width:150,height:100};
 const sides=[{...board,id:'left',z:1,x:-75,width:100},{...board,id:'right',z:2,x:75,width:100}];
 const depths=stackDepths([board,...sides].map(board=>({board,polygon:worldContour(board)})));
 assert.equal(depths.get('base'),1);
});

test('depth checks follow moved, reordered and removed glass after repeated reads',()=>{
 const boards=Array.from({length:4},(_,i)=>({...piece(),id:`depth${i}`,z:i,x:0,y:0,angle:0,width:100,height:100}));
 const entries=boards.map(board=>({board,polygon:worldContour(board)}));
 assert.equal(stackDepths(entries,1).get('depth0'),1);
 assert.equal(stackDepths(entries).get('depth0'),3);
 const result=stackDepths(entries);result.set('depth0',99);
 assert.equal(stackDepths(entries).get('depth0'),3);
 for(const p of entries[3].polygon)p.x+=300;
 assert.equal(stackDepths(entries).get('depth0'),2);
 boards[2].z=-1;
 assert.equal(stackDepths(entries).get('depth0'),1);
 assert.equal(stackDepths(entries.slice(0,2)).get('depth0'),1);
 assert.equal(stackDepths(entries.slice(0,1)).get('depth0'),0);
});

test('head and point coverage keep exact rim tolerance, including concave gaps',()=>{
 const polygon=worldContour({...piece('l'),x:0,y:0,angle:0,width:100,height:100});
 assert.equal(polygonCovers(polygon,{x:64.00005,y:30},14),true);
 assert.equal(polygonCovers(polygon,{x:64.001,y:30},14),false);
 assert.equal(polygonCovers(polygon,{x:50.00005,y:30},0),true);
 assert.equal(polygonCovers(polygon,{x:50.001,y:30},0),false);
 assert.equal(polygonCovers(polygon,{x:25,y:-25},0),false);
 assert.equal(polygonCovers(polygon,{x:50.00005,y:30},-.03),false);
});


test('themed layouts mix new silhouettes with small, medium and large basic glass',()=>{
 const boards=LEVELS.flatMap(l=>l.boards),shapes=new Set(boards.map(b=>b.shape));
 for(const shape of ['bar','ellipse','leaf','flower','petal','drop','digit1','digit2','digit3','digit5','digit7','l','u','t','star'])assert.ok(shapes.has(shape),shape);
 assert.ok(Math.max(...boards.map(b=>b.width*b.height))/Math.min(...boards.map(b=>b.width*b.height))>8);
 for(const level of LEVELS){assert.ok(level.boards.some(b=>b.screws.length===1));assert.ok(level.boards.some(b=>b.screws.length>=3));}
});

test('letter cutouts remain open for drawing and screw hit testing',()=>{
 const b={...piece(),x:0,y:0,angle:0,width:180,height:180};
 for(const shape of ['c','u','h']) {
  const gap=shape==='c'?{x:50,y:0}:{x:0,y:-55};
  assert.equal(covers({...b,shape},gap,14),false,shape);
 }
 assert.equal(covers({...b,shape:'c'},{x:-65,y:0},14),true);
});
