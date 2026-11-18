const smooth = t => t*t*t*(t*(6*t-15)+10);
const mix = (a,b,t) => a+(b-a)*t;

// Accelerate into a shallow arc, then brake briefly into the receiving head.
// The extracted rotation and scale carry through without snapping at takeoff.
export function flightFrames(dx,dy,startScale,endScale,{startY=0,startTurn=0,screwIn=false}={}) {
  const arc=Math.min(64,Math.max(24,Math.abs(dx)*.18+Math.abs(dy)*.08));
  const finalTurn=-360*(Math.ceil(Math.abs(startTurn)/360)+1);
  return Array.from({length:61},(_,i)=>{
    const t=i/60,u=smooth(t),v=1-u;
    const x=dx*u;
    const y=mix(startY,dy,u)-4*arc*u*v;
    const scale=mix(startScale,endScale,u)+Math.sin(Math.PI*u)*.065;
    const turn=mix(startTurn,finalTurn,screwIn?smooth(t):u);
    return {offset:t,x,y,scale,turn};
  });
}

// All phases, including delayed cues and target readiness, share pause/cancel.
// Game state never depends on wall-clock timers.
export class Motion {
  animations = new Set();
  ghosts = new Set();
  paused = false;
  epoch = 0;
  reduced = matchMedia('(prefers-reduced-motion: reduce)');
  track(animation) {
    this.animations.add(animation);
    if(this.paused) animation.pause();
    return animation.finished.then(()=>true,()=>false).finally(()=>this.animations.delete(animation));
  }
  play(node,frames,duration,easing='cubic-bezier(.22,.75,.25,1)') {
    if(!node) return Promise.resolve(false);
    if(this.reduced.matches) return Promise.resolve(true);
    return this.track(node.animate(frames,{duration,easing,fill:'none'}));
  }
  wait(duration) {
    if(!duration || this.reduced.matches) return Promise.resolve(true);
    const animation=new Animation(new KeyframeEffect(null,[],{duration}));
    animation.play();return this.track(animation);
  }
  async finish() {
    while(this.animations.size) await Promise.all([...this.animations].map(a=>a.finished.catch(()=>{})));
  }
  pause() {this.paused=true;this.animations.forEach(a=>a.pause());}
  resume() {this.paused=false;this.animations.forEach(a=>{if(a.playState==='paused')a.play();});}
  cancel() {
    this.epoch++;
    this.animations.forEach(a=>a.cancel());this.animations.clear();
    this.ghosts.forEach(n=>n.remove());this.ghosts.clear();this.paused=false;
  }
  capture(source,{scale=1}={}) {
    if(!source) return null;
    const rect=source.getBoundingClientRect(),style=getComputedStyle(source);
    let rotation=0;
    for(let node=source.querySelector('span');node;node=node.parentElement) {
      const matrix=new DOMMatrix(getComputedStyle(node).transform);
      rotation+=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
    }
    const head=source.cloneNode(true);
    head.className='screw-head';head.removeAttribute('data-buffer-id');head.removeAttribute('data-screw-id');
    head.style.cssText=source.style.cssText;
    Object.assign(head.style,{visibility:'visible',transform:'none',width:style.width,height:style.height,fontSize:style.fontSize});
    head.style.setProperty('--color',style.getPropertyValue('--color'));
    head.querySelector('span').style.transform=`rotate(${rotation}deg)`;
    return {head,rotation,id:source.dataset.screwId||source.closest('[data-screw]')?.dataset.screw,x:rect.x+rect.width/2,y:rect.y+rect.height/2,width:source.offsetWidth,height:source.offsetHeight,scale};
  }
  launch(source,target,{lift=true,screwIn=false,ready=Promise.resolve(),destination=null,delay=0}={}) {
    const snapshot=source?.head?source:this.capture(source),epoch=this.epoch;
    const valid=()=>this.epoch===epoch;
    const empty={arrived:Promise.resolve(ready).then(()=>valid()),release(){}};
    if(!snapshot || this.reduced.matches) return empty;
    const ghost=document.createElement('div');ghost.className='flying-screw';ghost.setAttribute('aria-hidden','true');
    if(snapshot.id)ghost.dataset.flightId=snapshot.id;
    Object.assign(ghost.style,{left:`${snapshot.x-snapshot.width/2}px`,top:`${snapshot.y-snapshot.height/2}px`,width:`${snapshot.width}px`,height:`${snapshot.height}px`});
    const head=snapshot.head;head.style.transform=`scale(${snapshot.scale})`;
    ghost.append(head);document.body.append(ghost);this.ghosts.add(ghost);
    let released=false;
    const release=()=>{
      if(released)return;released=true;
      ghost.getAnimations({subtree:true}).forEach(a=>{a.cancel();this.animations.delete(a);});
      ghost.remove();this.ghosts.delete(ghost);
    };
    const readiness=Promise.resolve(ready);
    const receiving=()=>typeof target==='function'?target():target;
    const measure=()=>{
      const node=receiving();
      if(!node?.isConnected)return null;
      return {rect:node.getBoundingClientRect(),fontSize:getComputedStyle(node).fontSize};
    };
    const arrived=(async()=>{
      if(delay && !await this.wait(delay))return false;
      // Box slots can be reserved before that batch enters. Start towards its
      // well immediately instead of unscrewing, stopping, and bobbing in place.
      let endpoint=destination?.();
      if(!endpoint){await readiness;if(!valid()||released)return false;endpoint=measure();}
      if(!endpoint || !valid() || released)return false;
      const to=endpoint.rect,dx=to.x+to.width/2-snapshot.x,dy=to.y+to.height/2-snapshot.y;
      const endScale=to.width/snapshot.width;
      const frames=flightFrames(dx,dy,snapshot.scale,endScale,{startTurn:snapshot.rotation,screwIn});
      const iconScale=parseFloat(endpoint.fontSize)/(parseFloat(head.style.fontSize)*endScale);
      const duration=lift?Math.max(300,Math.min(390,240+Math.hypot(dx,dy)*.23)):220;
      // Translation, extraction, rotation and sizing share one timeline. There
      // is no finished-promise boundary in the middle of a screw's movement.
      const travel=ghost.animate(frames.map(f=>({offset:f.offset,transform:`translate(${f.x}px,${f.y}px)`})),{duration,easing:'linear',fill:'forwards'});
      const turn=head.querySelector('span').animate(frames.map(f=>({offset:f.offset,transform:`rotate(${f.turn}deg) scale(${mix(1,iconScale,smooth(f.offset))})`})),{duration,easing:'linear',fill:'forwards'});
      const sizing=head.animate(frames.map(f=>({offset:f.offset,transform:`scale(${f.scale})`})),{duration,easing:'linear',fill:'forwards'});
      const [completed]=await Promise.all([Promise.all([travel,turn,sizing].map(a=>this.track(a))),readiness]);
      if(!completed.every(Boolean)||!valid()||released)return false;
      const final=measure();if(!final)return false;
      const finalX=final.rect.x+final.rect.width/2-snapshot.x,finalY=final.rect.y+final.rect.height/2-snapshot.y;
      const finalScale=final.rect.width/snapshot.width;
      // A resize or tray reflow during travel must not teleport the last frame.
      if(Math.hypot(finalX-dx,finalY-dy)>.5 || Math.abs(finalScale-endScale)>.005) {
        const correction=ghost.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${finalX}px,${finalY}px)`}],{duration:90,easing:'ease-out',fill:'forwards'});
        const resize=head.animate([{transform:`scale(${endScale})`},{transform:`scale(${finalScale})`}],{duration:90,easing:'ease-out',fill:'forwards'});
        if(!(await Promise.all([this.track(correction),this.track(resize)])).every(Boolean))return false;
      }
      return valid()&&!released;
    })();
    return {arrived,release};
  }
  land(node) {
    return this.play(node,[{transform:'scale(1)'},{transform:'scale(1.06,.94)',offset:.35},{transform:'scale(.99,1.01)',offset:.7},{transform:'scale(1)'}],75,'ease-in-out');
  }
  pack(node,{onPulse=()=>{},alive=()=>true}={}) {
    const epoch=this.epoch,valid=()=>this.epoch===epoch&&alive();
    if(!node || this.reduced.matches) {
      if(node&&valid())onPulse();
      return {vacated:Promise.resolve(),finished:Promise.resolve()};
    }
    const rect=node.getBoundingClientRect(),ghost=node.cloneNode(true);
    ghost.classList.add('packing-box');ghost.removeAttribute('data-box-batch');ghost.setAttribute('aria-hidden','true');
    Object.assign(ghost.style,{position:'fixed',left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:0,zIndex:65,visibility:'visible'});
    document.body.append(ghost);this.ghosts.add(ghost);node.classList.add('packing-source');
    const lid=document.createElement('div');lid.className='box-lid';lid.innerHTML='<span>✓</span>';ghost.append(lid);
    const body=ghost.animate([
      {transform:'translateY(0) scale(1)',opacity:1},
      {transform:'translateY(3px) scale(1.045,.94)',opacity:1,offset:50/340},
      {transform:'translateY(-5px) scale(1.07,1.04)',opacity:1,offset:120/340},
      {transform:'translateY(0) scale(1)',opacity:1,offset:170/340},
      {transform:'translateY(-12px) scale(1.02)',opacity:1,offset:235/340},
      {transform:'translateY(-66px) rotate(-6deg) scale(.78)',opacity:0},
    ],{duration:280,easing:'cubic-bezier(.3,0,.3,1)',fill:'forwards'});
    const closing=lid.animate([
      {transform:'perspective(400px) rotateX(-85deg)',opacity:0},
      {transform:'perspective(400px) rotateX(-85deg)',opacity:0,offset:80/340},
      {transform:'perspective(400px) rotateX(0)',opacity:1,offset:170/340},
      {transform:'perspective(400px) rotateX(0)',opacity:1},
    ],{duration:280,easing:'ease-in-out',fill:'forwards'});
    const contents=ghost.querySelector('.box-wells')?.animate([
      {opacity:1},{opacity:1,offset:120/340},{opacity:0,offset:165/340},{opacity:0},
    ],{duration:280,easing:'linear',fill:'forwards'});
    const cue=this.wait(110).then(async finished=>{
      if(!finished || !valid())return;
      onPulse();
      const glow=document.createElement('i');glow.className='pack-glow';ghost.append(glow);
      const effects=[this.play(glow,[{opacity:0,transform:'scale(.95)'},{opacity:.85,transform:'scale(1.04)',offset:.25},{opacity:0,transform:'scale(1.13)'}],210,'ease-out')];
      for(let i=0;i<6;i++) {
        const star=document.createElement('i');star.className='pack-star';star.textContent='✦';
        const angle=(i*60-30)*Math.PI/180,dx=Math.cos(angle)*(rect.width*.55+10),dy=Math.sin(angle)*(rect.height*.38+8);
        ghost.append(star);
        effects.push(this.play(star,[{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:1,transform:`translate(${dx*.45}px,${dy*.45}px) scale(1)`,offset:.25},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.3)`}],220,'ease-out'));
      }
      await Promise.all(effects);
    });
    const vacated=this.wait(210);
    const finished=Promise.all([this.track(body),this.track(closing),contents?this.track(contents):Promise.resolve(),cue]).finally(()=>{
      ghost.remove();this.ghosts.delete(ghost);body.cancel();closing.cancel();contents?.cancel();
    });
    return {vacated,finished};
  }
  enter(node) {
    return this.play(node,[{transform:'translateY(19px) scale(.93)',opacity:0},{transform:'translateY(-2px) scale(1.015)',opacity:1,offset:.75},{transform:'translateY(0) scale(1)',opacity:1}],110);
  }
  async compact(container,oldPositions) {
    const work=[];
    container.querySelectorAll('[data-buffer-id]').forEach(node=>{
      const old=oldPositions.get(node.dataset.bufferId);if(!old)return;
      node.getAnimations().forEach(a=>a.cancel());
      const box=node.getBoundingClientRect(),dx=old.x-box.x,dy=old.y-box.y;
      if(Math.abs(dx)+Math.abs(dy)>1)work.push(this.play(node,[{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],160));
    });
    await Promise.all(work);
  }
}
