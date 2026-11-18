// Local Matter.js 0.20.0. Ball motion is simulated separately from the belt's
// deterministic inventory; a marble can enter the belt only at the real mouth.
const {Engine, Bodies, Body, Composite, Events} = window.Matter;
const SOURCE_X = [72,156,240,324,408];
const RADIUS = 10.1;
const SPAWN_GAP = RADIUS*2 + .8;
export const FUNNEL_LEFT = [[24,278],[80,299],[151,339],[208,386],[208,417]];
export const FUNNEL_RIGHT = FUNNEL_LEFT.map(([x,y])=>[480-x,y]);

export class Hopper {
  constructor(onImpact=()=>{}) {
    // Falling balls must keep responding to gravity even when momentarily
    // slow. Only balls physically resting on the feed gate are latched.
    this.engine=Engine.create({positionIterations:8,velocityIterations:8,enableSleeping:false});
    this.engine.gravity.y=1.3;
    this.balls=new Map();this.onImpact=onImpact;this.lastSound=0;
    this.makeWalls();
    Events.on(this.engine,'collisionStart',event=>{
      let strongest=null,energy=0;
      for(const pair of event.pairs){
        const a=pair.bodyA,b=pair.bodyB;
        if(a.isStatic&&b.isStatic)continue;
        const relative=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);
        if(relative>energy){energy=relative;strongest=a.isStatic?b:a;}
      }
      if(strongest&&energy>1.1&&this.engine.timing.timestamp-this.lastSound>55){
        this.lastSound=this.engine.timing.timestamp;
        this.onImpact({x:strongest.position.x,y:strongest.position.y,color:strongest.plugin.color,force:Math.min(energy/6,1)});
      }
    });
  }
  makeWalls() {
    const walls=[];
    for(const side of [FUNNEL_LEFT,FUNNEL_RIGHT]){
      for(let i=1;i<side.length;i++){
        const [ax,ay]=side[i-1],[bx,by]=side[i];
        walls.push(Bodies.rectangle((ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay)+9,12,{isStatic:true,angle:Math.atan2(by-ay,bx-ax),friction:.018,restitution:.02,chamfer:{radius:3}}));
      }
    }
    walls.push(Bodies.rectangle(15,245,14,90,{isStatic:true}),Bodies.rectangle(465,245,14,90,{isStatic:true}));
    // This feed gate supports the pile until an empty belt pocket arrives.
    this.feedGate=Bodies.rectangle(240,418,78,12,{isStatic:true,friction:.06,restitution:0});
    walls.push(this.feedGate);
    Composite.add(this.engine.world,walls);
  }
  spawnPosition(m) {
    return {x:SOURCE_X[m.column]+(m.index%3-1)*22,y:238};
  }
  canSpawn(m) {
    const p=this.spawnPosition(m);
    // Wait for physical clearance. Inserting a new ball inside the previous
    // row makes the collision solver push the pile apart with a visible jump.
    for(const b of this.balls.values())if(Math.hypot(b.position.x-p.x,b.position.y-p.y)<SPAWN_GAP)return false;
    return true;
  }
  limitMotion(body) {
    if(body.isStatic||body.isSleeping)return;
    const vx=Math.max(-4.8,Math.min(4.8,body.velocity.x));
    // Allow a short, natural rebound (a few logical pixels at this gravity),
    // while keeping the emergency cap for abnormal collision impulses.
    const vy=Math.max(-1.15,Math.min(7,body.velocity.y));
    if(vx!==body.velocity.x||vy!==body.velocity.y)Body.setVelocity(body,{x:vx,y:vy});
    if(Math.abs(body.angularVelocity)>.18)Body.setAngularVelocity(body,Math.sign(body.angularVelocity)*.18);
  }
  holdAtFeed(body,time) {
    // Called only for a ball in actual contact with the gate beneath it. Keep
    // its resting position, but stop solving it against the gate each frame.
    // This is a one-way latch until transfer, not a position threshold that
    // repeatedly switches the ball between falling and waiting.
    Body.setVelocity(body,{x:0,y:0});
    Body.setAngularVelocity(body,0);
    Body.setStatic(body,true);
    body.plugin.feedHeld=true;
    body.plugin.feedReadyAt=time;
  }
  spawn(m) {
    const saved=m.motion;
    const origin=this.spawnPosition(m);
    // A finely rounded collider avoids the coarse default circle polygon's
    // small edge-to-edge bumps as a ball rolls along a slope.
    const body=Bodies.polygon(saved?.x??origin.x,saved?.y??origin.y,32,RADIUS,{
      restitution:.12,friction:.018,frictionStatic:.025,frictionAir:.008,density:.002,slop:.04,
      plugin:{marbleId:m.id,color:m.color},
    });
    body.circleRadius=RADIUS;
    if(saved){Body.setVelocity(body,{x:saved.vx,y:saved.vy});Body.setAngle(body,saved.angle);Body.setAngularVelocity(body,saved.spin);}
    else{Body.setVelocity(body,{x:Math.max(-1.8,Math.min(1.8,(240-origin.x)*.015)),y:1.5});Body.setAngularVelocity(body,0);}
    this.limitMotion(body);
    // Restored balls re-establish contact in the next physics step. Never
    // restore a static/sleeping flag that may no longer have valid support.
    m.ready=Infinity;
    body.plugin.previous={x:body.position.x,y:body.position.y,angle:body.angle};
    this.balls.set(m.id,body);Composite.add(this.engine.world,body);
    return body;
  }
  step(game,dt) {
    if(game.status!=='playing'||!game.pending.length)return;
    for(const m of game.pending){
      if(this.balls.has(m.id)||m.spawnAt>game.time+dt||!this.canSpawn(m))continue;
      this.spawn(m);
      game.events.push({type:'drop',id:m.id,column:m.column});
    }
    // Latched riders are static. With no falling bodies, there's nothing
    // for the solver to update until a new rider spawns or the belt feeds.
    let hasFalling=false;
    for(const b of this.balls.values()){
      if(!b.plugin.feedHeld){hasFalling=true;break;}
    }
    if(!hasFalling)return;
    // Ease the last few centimetres into the feeder instead of repeatedly
    // colliding at full falling speed with the stopped balls beneath it.
    for(const b of this.balls.values()){
      b.plugin.previous={x:b.position.x,y:b.position.y,angle:b.angle};
      if(b.isStatic||b.isSleeping)continue;
      // A gentle inward guide through the shallow outer bends prevents the
      // last riders crawling along the rail. Forces preserve collision and
      // interpolation continuity; the central feeder keeps its normal queue.
      const side=b.position.x<170?1:b.position.x>310?-1:0;
      if(side&&b.position.y>260&&b.position.y<335){
        const drive=Math.max(0,1-side*b.velocity.x/3.8);
        Body.applyForce(b,b.position,{x:side*b.mass*.00115*drive,y:0});
      }
      if(b.position.y<369)continue;
      const approach=Math.min(1,(b.position.y-369)/22);
      const damping=Math.exp(-4*approach*dt);
      Body.setVelocity(b,{x:b.velocity.x*damping,y:b.velocity.y*damping});
      Body.setAngularVelocity(b,b.angularVelocity*damping);
    }
    Engine.update(this.engine,dt*1000);
    const gateContacts=new Set();
    for(const pair of this.engine.pairs.list){
      if(!pair.isActive)continue;
      if(pair.bodyA===this.feedGate)gateContacts.add(pair.bodyB.id);
      else if(pair.bodyB===this.feedGate)gateContacts.add(pair.bodyA.id);
    }
    for(const m of game.pending){
      const b=this.balls.get(m.id);if(!b)continue;
      this.limitMotion(b);
      if(!b.plugin.feedHeld&&gateContacts.has(b.id)&&b.position.y>=400&&b.position.y<412&&Math.abs(b.position.x-240)<27)this.holdAtFeed(b,game.time);
      m.motion={x:b.position.x,y:b.position.y,vx:b.velocity.x,vy:b.velocity.y,angle:b.angle,spin:b.angularVelocity,previous:b.plugin.previous,feedHeld:!!b.plugin.feedHeld,feedReadyAt:b.plugin.feedReadyAt??null};
      m.ready=b.plugin.feedHeld?b.plugin.feedReadyAt:Infinity;
    }
  }
  consume(events) {
    for(const e of events){
      if(e.type!=='land')continue;
      const b=this.balls.get(e.id);if(!b)continue;
      e.from={x:b.position.x,y:b.position.y,angle:b.angle};
      Composite.remove(this.engine.world,b);this.balls.delete(e.id);
      // All balls above remain dynamic, so losing this support immediately
      // lets gravity advance the pile without a separate wake-up heuristic.
    }
  }
  reset(game) {
    for(const b of this.balls.values())Composite.remove(this.engine.world,b);
    this.balls.clear();Engine.clear(this.engine);
    for(const m of game.pending)if(m.motion)this.spawn(m);
  }
}
