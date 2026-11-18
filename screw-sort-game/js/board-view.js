import { BOARD, VISIBLE_GLASS_LAYERS } from './config.js';
import { activeBoards, poseOf, screwPosition } from './engine.js';
import { contour, positionOf, worldContour, polygonCovers, headExposure, bounds } from './geometry.js';
import { swingFrames, fallFrames } from './plate-motion.js';
import { plateSVG, screwHead, PAINTS } from './glass-art.js';
const transform=pose=>`translate(${pose.x}px,${pose.y}px) translate(-50%,-50%) rotate(${pose.angle}deg)`;
const samePose=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.angle-b.angle)<.05;
const overlaps=(a,b,pad=0)=>a.maxX+pad>=b.minX&&a.minX-pad<=b.maxX&&a.maxY+pad>=b.minY&&a.minY-pad<=b.maxY;
const contains=(box,p,pad=0)=>p.x>=box.minX-pad&&p.x<=box.maxX+pad&&p.y>=box.minY-pad&&p.y<=box.maxY+pad;
const REFRESH_INTERVAL=32;
const data=(node,key,value)=>{const text=String(value);if(node.dataset[key]!==text)node.dataset[key]=text;};
export class BoardView {
  constructor(root,frame,motion,translate) {
    Object.assign(this,{root,frame,motion,t:translate});
    this.plates=new Map();this.screws=new Map();this.animations=new Map();this.movementPaths=new Map();this.frameId=0;
    this.geometry=new Map();this.plateDepths=new Map();this.screwDepths=new Map();this.targetTransforms=new Map();
    this.depthProbes=new Map();this.lastRefresh=0;
    new ResizeObserver(()=>this.resize()).observe(frame);
  }
  resize() {
    this.scale=Math.min(this.frame.clientWidth/BOARD.width,this.frame.clientHeight/BOARD.height);
    Object.assign(this.root.style,{width:`${BOARD.width}px`,height:`${BOARD.height}px`,left:`${(this.frame.clientWidth-BOARD.width*this.scale)/2}px`,top:`${(this.frame.clientHeight-BOARD.height*this.scale)/2}px`,transform:`scale(${this.scale})`});
    this.root.style.setProperty('--touch-size',`${Math.max(44,44/this.scale)}px`);
  }
  build(level,state) {
    cancelAnimationFrame(this.frameId);this.animations.clear();this.movementPaths.clear();this.plates.clear();this.screws.clear();
    this.level=level;this.state=state;
    this.geometry.clear();this.plateDepths.clear();this.screwDepths.clear();this.targetTransforms.clear();this.refreshedState=null;
    this.depthProbes.clear();
    for(const b of level.boards) {
      const polygon=contour(b),points=[];
      for(const x of [-.36,-.12,.12,.36])for(const y of [-.36,-.12,.12,.36]) {
        const p={x:x*b.width,y:y*b.height};if(polygonCovers(polygon,p,0))points.push(p);
      }
      this.depthProbes.set(b.id,points);
    }
    this.root.innerHTML=level.boards.map(b=>`<div class="plate" data-plate="${b.id}" style="width:${b.width}px;height:${b.height}px;z-index:${(b.layer*(level.boards.length+1)+b.z)*2+1};--glass-color:${PAINTS[b.paint]}">${plateSVG(b)}${b.screws.map(s=>`<button class="screw-button" data-screw="${s.id}" style="left:${b.width/2+s.x}px;top:${b.height/2+s.y}px" type="button">${screwHead(s.color)}</button>`).join('')}</div>`).join('');
    for(const node of this.root.querySelectorAll('[data-plate]'))this.plates.set(node.dataset.plate,node);
    for(const node of this.root.querySelectorAll('[data-screw]'))this.screws.set(node.dataset.screw,node);
    this.resize();this.update(state,false);
  }
  currentPose(board) {
    const m=new DOMMatrix(getComputedStyle(this.plates.get(board.id)).transform);
    const raw=Math.atan2(m.b,m.a)*180/Math.PI;
    let expected=poseOf(board,this.state).angle;
    const movement=this.movementPaths.get(board.id),animation=this.animations.get(board.id);
    if(movement&&animation) {
      const fraction=Math.max(0,Math.min(1,(Number(animation.currentTime)||0)/movement.duration));
      const index=movement.frames.findIndex(frame=>frame.offset>=fraction);
      const after=movement.frames[index<0?movement.frames.length-1:index];
      const before=movement.frames[Math.max(0,(index<0?movement.frames.length-1:index)-1)];
      const span=after.offset-before.offset,t=span>0?Math.max(0,Math.min(1,(fraction-before.offset)/span)):1;
      // Unwrap against the visible frame, not the eventual resting angle.
      // Interrupting a swing must never introduce an extra full revolution.
      expected=before.pose.angle+(after.pose.angle-before.pose.angle)*t;
    }
    return {x:m.e+board.width/2,y:m.f+board.height/2,angle:raw+Math.round((expected-raw)/360)*360};
  }
  captureLooseMotion(layer) {
    const snapshots={};
    for(const [id,animation] of this.animations) {
      if(this.state.melted.includes(id))continue;
      const board=this.level.boards.find(b=>b.id===id),movement=this.movementPaths.get(id);
      if(layer!==undefined&&board.layer!==layer)continue;
      const pose=this.currentPose(board);
      if(!movement){snapshots[id]={pose};continue;}
      const fraction=Math.max(0,Math.min(1,(Number(animation.currentTime)||0)/movement.duration));
      const index=movement.frames.findIndex(frame=>frame.offset>=fraction);
      const after=movement.frames[Math.max(1,index)],before=movement.frames[Math.max(1,index)-1];
      const seconds=(after.offset-before.offset)*movement.duration/1000;
      const velocity=seconds>0?{x:(after.pose.x-before.pose.x)/seconds,y:(after.pose.y-before.pose.y)/seconds,spin:(after.pose.angle-before.pose.angle)*Math.PI/180/seconds}:{x:0,y:0,spin:0};
      snapshots[id]={pose,velocity};
    }
    return snapshots;
  }
  captureScenePoses() {
    return Object.fromEntries([...this.animations.keys()].filter(id=>!this.state.melted.includes(id)).map(id=>[id,this.currentPose(this.level.boards.find(b=>b.id===id))]));
  }
  animate(board,frames,duration,movement=null) {
    if(this.motion.reduced.matches)return;
    const animation=this.plates.get(board.id).animate(frames,{duration,easing:'linear'});
    this.animations.set(board.id,animation);this.motion.animations.add(animation);
    if(movement)this.movementPaths.set(board.id,movement);
    if(this.motion.paused)animation.pause();
    animation.finished.catch(()=>{}).finally(()=>{
      this.motion.animations.delete(animation);
      if(this.animations.get(board.id)===animation){this.animations.delete(board.id);this.movementPaths.delete(board.id);}
      this.refresh();
    });this.tick();
  }
  tick() {
    cancelAnimationFrame(this.frameId);
    if(!this.animations.size)return;
    this.frameId=requestAnimationFrame(time=>{if(time-this.lastRefresh>=REFRESH_INTERVAL)this.refresh();this.tick();});
  }
  update(state,animate=true,motions=null) {
    const previous=this.state;this.state=state;
    const removed=new Set(state.removed),oldRemoved=new Set(previous.removed);
    const active=activeBoards(this.level,state);
    // Read every moving transform before any style write can force layout.
    const livePoses=new Map(this.level.boards.filter(b=>this.animations.has(b.id)).map(b=>[b.id,this.currentPose(b)]));
    for(const b of this.level.boards) {
      const node=this.plates.get(b.id),remaining=b.screws.filter(s=>!removed.has(s.id));
      const oldPins=b.screws.filter(s=>!oldRemoved.has(s.id));
      const melted=state.melted.includes(b.id),newlyMelted=melted&&!previous.melted.includes(b.id);
      let from=livePoses.get(b.id)||poseOf(b,previous);
      if(oldPins.length===1&&!remaining.length&&!melted)from=state.poses[b.id]||from;
      const to=poseOf(b,state);
      const changed=oldPins.length!==remaining.length || !samePose(poseOf(b,previous),to) || !!previous.loose?.[b.id]!==!!state.loose?.[b.id] || !!motions?.has(b.id);
      if(changed||newlyMelted){this.animations.get(b.id)?.cancel();this.animations.delete(b.id);this.movementPaths.delete(b.id);}
      const target=transform(to);
      if(this.targetTransforms.get(b.id)!==target){this.targetTransforms.set(b.id,target);node.style.transform=target;node.style.setProperty('--pose-angle',`${to.angle}deg`);}
      const opacity=melted||(!remaining.length&&!state.loose[b.id])?'0':'1';
      if(node.style.opacity!==opacity)node.style.opacity=opacity;
      if(melted) for(const s of b.screws) {
        const button=this.screws.get(s.id),point=state.floating[s.id];if(!point)continue;
        this.root.append(button);button.classList.add('floating');
        Object.assign(button.style,{left:`${point.x}px`,top:`${point.y}px`,zIndex:String((b.layer*(this.level.boards.length+1)+b.z)*2+2)});
      }
      if(animate&&newlyMelted)this.animate(b,[{transform:transform(from),opacity:1,filter:'brightness(1)'},{transform:transform(from),opacity:0,filter:'brightness(2.4)'}],350);
      else if(animate&&changed&&!melted&&remaining.length<=1) {
        const obstacles=active.filter(other=>other.id!==b.id&&other.layer===b.layer).map(other=>({polygon:worldContour(other,poseOf(other,state))}));
        // Use the transition's actual path rather than recomputing against future
        // obstacle positions. An interrupted fall continues from its visible pose.
        const recorded=motions?.get(b.id);
        const movement=recorded||(remaining.length?swingFrames(b,remaining[0],from,to,obstacles):fallFrames(b,from,obstacles));
        if(!remaining.length&&state.loose[b.id])movement.frames[movement.frames.length-1]={...movement.frames.at(-1),pose:to,opacity:1};
        this.animate(b,movement.frames.map(f=>({offset:f.offset,transform:transform(f.pose),opacity:f.opacity})),movement.duration,movement);
      }
      for(const s of b.screws){
        const button=this.screws.get(s.id);button.classList.toggle('removed',removed.has(s.id));
        const label=this.t('screw',{color:this.t(`color_${s.color}`)});if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
      }
    }
    this.refresh();
  }
  setMode(interactive,selecting=false){if(this.interactive===interactive&&this.selecting===selecting)return;this.interactive=interactive;this.selecting=selecting;this.refresh();}
  refresh() {
    if(!this.level)return;
    this.lastRefresh=performance.now();
    const state=this.state,removed=new Set(state.removed),changed=new Map();
    const poses=new Map(this.level.boards.map(b=>[b.id,this.animations.has(b.id)?this.currentPose(b):poseOf(b,state)]));
    for(const b of this.level.boards) {
      const pose=poses.get(b.id),cached=this.geometry.get(b.id);
      if(!cached||!samePose(cached.pose,pose)) {
        const polygon=worldContour(b,pose),box=bounds(polygon);
        changed.set(b.id,cached?{minX:Math.min(box.minX,cached.bounds.minX),maxX:Math.max(box.maxX,cached.bounds.maxX),minY:Math.min(box.minY,cached.bounds.minY),maxY:Math.max(box.maxY,cached.bounds.maxY)}:box);
        this.geometry.set(b.id,{board:b,pose,polygon,bounds:box});
      }
    }
    const stateChanged=this.refreshedState!==state;
    const modeChanged=this.refreshedInteractive!==this.interactive||this.refreshedSelecting!==this.selecting;
    const animationChanged=this.refreshedAnimationCount!==this.animations.size;
    if(!changed.size&&!stateChanged&&!modeChanged&&!animationChanged)return;
    this.refreshedState=state;this.refreshedInteractive=this.interactive;this.refreshedSelecting=this.selecting;this.refreshedAnimationCount=this.animations.size;
    const active=this.level.boards.filter(b=>!state.melted.includes(b.id)&&(state.loose[b.id]||b.screws.some(s=>!removed.has(s.id))||this.animations.has(b.id))).map(b=>this.geometry.get(b.id));
    const mounted=active.filter(o=>o.board.screws.some(s=>!removed.has(s.id)));
    const heads=this.level.boards.flatMap(b=>b.screws.filter(s=>!removed.has(s.id)).map(s=>({layer:b.layer,point:screwPosition(b,s,state,poses.get(b.id))})));
    this.hitPositions=new Map(this.level.boards.flatMap(b=>b.screws.filter(s=>!removed.has(s.id)).map(s=>[s.id,screwPosition(b,s,state,poses.get(b.id))])));
    for(const b of this.level.boards) {
      const node=this.plates.get(b.id),pose=poses.get(b.id),box=this.geometry.get(b.id).bounds;
      // Only moving glass and glass beneath its swept bounds need new
      // coverage checks. Static regions retain their geometry and DOM state.
      const affected=stateChanged||animationChanged||changed.has(b.id)||this.level.boards.some(other=>other.layer>b.layer&&changed.has(other.id)&&overlaps(changed.get(other.id),box,14));
      let selectable=false;
      if(affected) {
        const higher=active.filter(o=>o.board.layer>b.layer&&overlaps(o.bounds,box,14));
        const display=higher.filter(o=>mounted.includes(o));
        const countAt=point=>display.reduce((n,o)=>n+(contains(o.bounds,point)&&polygonCovers(o.polygon,point,0)?1:0),0);
        // Small cached interior probes are sufficient for glass tone. Exact
        // head/rim checks below always decide interaction, independently.
        let plateDepth=0;
        for(const p of this.depthProbes.get(b.id)) {
          plateDepth=Math.max(plateDepth,countAt(positionOf(b,p,pose)));
          if(plateDepth>=VISIBLE_GLASS_LAYERS)break;
        }
        const pins=b.screws.filter(s=>!removed.has(s.id));
        if(pins.length)plateDepth=Math.min(plateDepth,...pins.map(s=>countAt(screwPosition(b,s,state,pose))));
        if(this.plateDepths.get(b.id)!==plateDepth) {
          this.plateDepths.set(b.id,plateDepth);data(node,'layer',plateDepth+1);node.classList.toggle('silhouette',plateDepth>=VISIBLE_GLASS_LAYERS);
          node.classList.toggle('deep-hidden',plateDepth>=8);
          const tone=Math.min(plateDepth,VISIBLE_GLASS_LAYERS-1);
          node.style.setProperty('--layer-opacity',String(1-tone*.035));
          node.style.setProperty('--layer-fill',String(.94-tone*.045));
          node.style.setProperty('--rim-opacity',String(1-tone*.13));
        }
        for(const s of b.screws) {
          const button=this.screws.get(s.id);
          if(removed.has(s.id)){if(!button.disabled)button.disabled=true;continue;}
          const point=screwPosition(b,s,state,pose),depth=countAt(point),buried=depth>=VISIBLE_GLASS_LAYERS;
          const blocking=higher.filter(o=>contains(o.bounds,point,14)&&polygonCovers(o.polygon,point,14));
          const legal=!blocking.length;
          let rebound=false;
          if(!buried&&!legal&&!heads.some(head=>head.layer>b.layer&&(head.point.x-point.x)**2+(head.point.y-point.y)**2<28**2)) {
            const exposure=headExposure(point,blocking.map(o=>o.polygon));rebound=exposure>0&&exposure<1;
          }
          data(button,'depth',depth);data(button,'blocked',!legal);data(button,'rebound',rebound);
          if(this.screwDepths.get(s.id)!==depth) {
            this.screwDepths.set(s.id,depth);button.classList.toggle('covered',depth>0);
            button.style.setProperty('--transmission',String(Math.max(.38,.84**depth)));
          }
          button.classList.toggle('buried',buried);
          if(button.getAttribute('aria-hidden')!==String(buried))button.setAttribute('aria-hidden',String(buried));
        }
      }
      for(const s of b.screws) {
        const button=this.screws.get(s.id),legal=!removed.has(s.id)&&button.dataset.blocked==='false';
        selectable||=legal;
        const disabled=!this.interactive||this.selecting||!legal||button.classList.contains('buried');
        if(button.disabled!==disabled)button.disabled=disabled;
      }
      node.classList.toggle('melt-target',!!this.selecting&&selectable);
    }
  }
  pick(x,y,blocked=false) {
    let nearest=null,distance=Infinity;
    const boardRect=this.root.getBoundingClientRect();
    for(const button of this.screws.values()) {
      if(button.classList.contains('removed')||button.classList.contains('buried'))continue;
      if(blocked?button.dataset.blocked!=='true':button.disabled)continue;
      const point=this.hitPositions.get(button.dataset.screw);
      if(!point)continue;
      const d=Math.hypot(x-boardRect.x-point.x*this.scale,y-boardRect.y-point.y*this.scale);
      // A covered screw only reacts on its actual head, never an enlarged invisible target.
      if(d<=(blocked?15*this.scale:Math.max(22,22*this.scale))&&d<distance){nearest=button;distance=d;}
    }
    return nearest;
  }
  bump(button) {
    const head=button?.querySelector('.screw-head');
    head?.getAnimations().forEach(animation=>animation.cancel());
    return this.motion.play(head,[{opacity:1},{opacity:.55,offset:.4},{opacity:1}],180,'ease-out');
  }
  pickGlass(x,y) {
    const rect=this.root.getBoundingClientRect(),point={x:(x-rect.x)/this.scale,y:(y-rect.y)/this.scale};
    return this.level.boards.filter(b=>this.plates.get(b.id).classList.contains('melt-target')).sort((a,b)=>b.z-a.z).find(b=>polygonCovers(this.geometry.get(b.id).polygon,point,0));
  }
}
