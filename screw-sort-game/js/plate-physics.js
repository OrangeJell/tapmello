import { Matter } from './rigid-runtime.js';
import { contour, centroid, positionOf, hangingPose } from './geometry.js';
import { BOARD } from './config.js';
const { Engine, Bodies, Body, Composite, Events, Constraint, Sleeping }=Matter;
const dt=1000/90;
const MAX_SPIN=2.4; // radians/second; keep impacts readable instead of spinning wildly.
const SOFT_SPIN=1.2;
const SETTLING_DRAG=.028;
const clampSpin=spin=>Math.max(-MAX_SPIN,Math.min(MAX_SPIN,spin));

function settleHangingSwing(entry) {
  const {body,pivot,mass}=entry;
  if(!pivot||entry.settling)return;
  const dx=mass.x-pivot.x,dy=mass.y-(pivot.y||0),cos=Math.cos(body.angle),sin=Math.sin(body.angle);
  const horizontal=dx*cos-dy*sin,vertical=dx*sin+dy*cos;
  const spin=Body.getAngularVelocity(body);
  // Keep the first descent light. Once the centre is within 15 degrees of
  // hanging vertically, or an interrupted swing is climbing back up, damp
  // subsequent sways more firmly so the plate settles without wide rebounds.
  if(vertical>0&&(Math.abs(horizontal)<=vertical*Math.tan(Math.PI/12)||horizontal*spin<0)) {
    entry.settling=true;
    body.frictionAir=SETTLING_DRAG;
  }
}

function restHangingPlate(entry,contacts) {
  const {body,pivot,mass}=entry;
  if(!pivot||body.isSleeping)return;
  const dx=mass.x-pivot.x,dy=mass.y-(pivot.y||0),cos=Math.cos(body.angle),sin=Math.sin(body.angle);
  const horizontal=dx*cos-dy*sin,vertical=dx*sin+dy*cos;
  const error=Math.abs(Math.atan2(horizontal,vertical));
  const spin=Math.abs(Body.getAngularVelocity(body)*60),speed=Body.getSpeed(body)*60;
  // A turning point is briefly slow even during a large swing. Only sleep
  // near equilibrium, or when another plate is actually holding this one.
  const quiet=spin<.12*Math.PI/180&&speed<.3;
  const supported=contacts.has(body.id)&&spin<.3*Math.PI/180&&speed<1;
  entry.quietTime=(quiet&&error<.06*Math.PI/180||supported)?(entry.quietTime||0)+dt:0;
  if(entry.quietTime>=250)Sleeping.set(body,true);
}

function limitSpin({body,pivot},damp=false) {
  if(body.isStatic||body.isSleeping)return;
  // Matter reports angular velocity per base 60 Hz tick, not per solver step.
  let spin=clampSpin(Body.getAngularVelocity(body)*60);
  // Hanging plates retain their momentum; the speed and step caps catch spikes.
  if(damp&&!pivot&&Math.abs(spin)>SOFT_SPIN) {
    spin=Math.sign(spin)*(SOFT_SPIN+(Math.abs(spin)-SOFT_SPIN)*Math.exp(-3*dt/1000));
  }
  Body.setAngularVelocity(body,spin/60);
}

function limitHangingStep({body,pivot,constraint,previousAngle}) {
  if(!pivot)return;
  // The hinge solver also changes angle directly, bypassing velocity limits.
  const delta=body.angle-previousAngle,spin=clampSpin(delta/(dt/1000));
  const correction=spin*dt/1000-delta;
  if(Math.abs(correction)<1e-9)return;
  Body.rotate(body,correction,constraint.pointA);
  Matter.Vector.rotate(constraint.pointB,body.angle-constraint.angleB,constraint.pointB);
  constraint.angleB=body.angle;
  body.constraintImpulse.x=body.constraintImpulse.y=body.constraintImpulse.angle=0;
  // Keep the centre's velocity tangent to the corrected swing around the screw.
  const dx=body.position.x-constraint.pointA.x,dy=body.position.y-constraint.pointA.y;
  Body.setVelocity(body,{x:-dy*spin/60,y:dx*spin/60});
  Body.setAngularVelocity(body,spin/60);
}

function makeBody({board,pose,free,polygon,velocity,pivot}) {
  if(polygon) {
    const center=Matter.Vertices.centre(polygon);
    const body=Bodies.fromVertices(center.x,center.y,[polygon],{friction:.035,frictionStatic:.08,slop:0},true,.001,0,.001);
    Body.setStatic(body,true);
    return {body};
  }
  const mass=centroid(board),center=positionOf(board,mass,pose);
  // Include the painted rim in contact so the glass contours cannot intersect
  // when the contact solver allows a small penetration under load.
  const scale=1+4.2/Math.min(board.width,board.height);
  const vertices=contour(board).map(p=>({x:mass.x+(p.x-mass.x)*scale,y:mass.y+(p.y-mass.y)*scale}));
  const body=Bodies.fromVertices(center.x,center.y,[vertices],{
    restitution:.18,friction:.13,frictionStatic:.32,
    frictionAir:.002,slop:.015,sleepThreshold:pivot?0:22,
  },true,.001,0,.001);
  // Matter sums each concave part's inertia about its own centre. Include
  // the parallel-axis terms so thin pieces such as crescents resist torque
  // according to their whole outline, rather than spinning like tiny shards.
  if(pivot&&body.parts.length>1) {
    const inertia=body.parts.slice(1).reduce((sum,part)=>{
      const dx=part.position.x-body.position.x,dy=part.position.y-body.position.y;
      return sum+part.inertia+Body._inertiaScale*part.mass*(dx*dx+dy*dy);
    },0);
    Body.setInertia(body,inertia);
  }
  Body.setAngle(body,pose.angle*Math.PI/180);
  // Decompose with finite masses first: static concave parts otherwise get
  // equally weighted centres and their collision outline shifts off the SVG.
  if(!free&&!pivot)Body.setStatic(body,true);
  if((free||pivot)&&velocity) {
    Body.setVelocity(body,{x:velocity.x/60,y:velocity.y/60});
    Body.setAngularVelocity(body,clampSpin(velocity.spin)/60);
  }
  let constraint;
  if(pivot) {
    const anchor=positionOf(board,pivot,pose);
    constraint=Constraint.create({bodyB:body,pointB:{x:anchor.x-body.position.x,y:anchor.y-body.position.y},pointA:anchor,length:0,stiffness:1,damping:.01});
  }
  return {board,body,mass,pivot,constraint,frames:[{pose:{...pose},opacity:1,time:0}],impacts:[],offscreen:false};
}
function poseOfBody(entry) {
  const angle=entry.body.angle*180/Math.PI,offset=positionOf(entry.board,entry.mass,{x:0,y:0,angle});
  if(entry.pivot)return hangingPose(entry.board,entry.pivot,angle);
  return {x:entry.body.position.x-offset.x,y:entry.body.position.y-offset.y,angle};
}
// All detached pieces of one physical plane move together. No detached piece
// is turned into a static wall that can hold another one in mid-air.
export function simulatePlates(plates) {
  const engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8,constraintIterations:4});
  engine.gravity.y=1;engine.gravity.scale=.00115;
  const entries=plates.map(makeBody),free=entries.filter((_,i)=>plates[i].free||plates[i].pivot),byBody=new Map();
  for(const entry of entries)for(const part of entry.body.parts)byBody.set(part.id,entry);
  Composite.add(engine.world,entries.flatMap(entry=>entry.constraint?[entry.body,entry.constraint]:[entry.body]));
  let elapsed=0,pending=[];
  Events.on(engine,'collisionStart',event=>{
    for(const pair of event.pairs)for(const body of [pair.bodyA,pair.bodyB]) {
      const entry=byBody.get(body.id);
      if(!entry||entry.body.isStatic||pending.some(hit=>hit.entry===entry))continue;
      const velocity=Body.getVelocity(entry.body),incoming=Math.hypot(velocity.x,velocity.y)*60;
      if(incoming>32)pending.push({entry,incoming});
    }
  });
  // Let small return swings decay instead of cutting every motion at 3 s.
  // Free falls keep their existing budget; hanging pieces finish when quiet.
  const maxSteps=free.some(entry=>entry.pivot)?1080:270;
  for(let step=0;step<maxSteps;step++) {
    for(const entry of free)if(!entry.offscreen) {
      entry.previousAngle=entry.body.angle;
      settleHangingSwing(entry);
      limitSpin(entry,true);
    }
    elapsed+=dt;pending=[];Engine.update(engine,dt);
    // Contact and hinge impulses can inject a large angular velocity. Limit
    // it immediately, before it is integrated into the next frame or resumed.
    for(const entry of free)if(!entry.offscreen) {
      limitHangingStep(entry);
      limitSpin(entry);
    }
    const contacts=new Set();
    for(const pair of engine.pairs.list)if(pair.isActive) {
      const a=pair.collision.bodyA.parent,b=pair.collision.bodyB.parent;
      if(b.isStatic||b.isSleeping)contacts.add(a.id);
      if(a.isStatic||a.isSleeping)contacts.add(b.id);
    }
    for(const entry of free)if(!entry.offscreen)restHangingPlate(entry,contacts);
    for(const {entry,incoming} of pending)entry.impacts.push({time:elapsed/1000,pose:poseOfBody(entry),incoming,rebound:Math.max(0,-Body.getVelocity(entry.body).y*60)});
    for(const entry of free) {
      if(entry.offscreen)continue;
      const pose=poseOfBody(entry),bounds=entry.body.bounds;
      entry.offscreen=!entry.pivot&&(bounds.min.y>BOARD.height+8||bounds.max.x<-8||bounds.min.x>BOARD.width+8);
      if(step%2===1||entry.offscreen)entry.frames.push({pose,opacity:entry.offscreen?0:1,time:elapsed/1000});
      if(entry.offscreen)Composite.remove(engine.world,entry.body);
    }
    if(free.every(entry=>entry.offscreen||entry.body.isSleeping))break;
  }
  const seconds=elapsed/1000,duration=elapsed,result=new Map();
  for(const entry of free) {
    const pose=poseOfBody(entry);
    entry.frames.push({pose,opacity:entry.offscreen?0:1,time:seconds});
    entry.frames.forEach(frame=>{frame.offset=frame.time/seconds;});
    result.set(entry.board.id,{frames:entry.frames,duration,pose,resting:entry.body.isSleeping,offscreen:entry.offscreen,impacts:entry.impacts});
  }
  Composite.clear(engine.world,false);Engine.clear(engine);
  return result;
}
