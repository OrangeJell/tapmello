import { hangingPose, intersectsAt } from './geometry.js';
import { simulatePlates } from './plate-physics.js';
export function swingFrames(board,pivot,from,to,obstacles) {
  const frames=[],dt=1/60,steps=144;
  let angle=from.angle,velocity=0;
  for(let i=0;i<=steps;i++) {
    const t=i/steps;
    if(i) {
      velocity+=((to.angle-angle)*26-velocity*4.1)*dt;
      const delta=velocity*dt,substeps=Math.max(1,Math.ceil(Math.abs(delta)/.8));
      for(let step=0;step<substeps;step++) {
        const next=angle+delta/substeps;
        if(intersectsAt(board,hangingPose(board,pivot,next),obstacles)){velocity*=-.16;break;}
        angle=next;
      }
    }
    if(t>.83){const settle=(t-.83)/.17;angle+=(to.angle-angle)*settle*settle;}
    frames.push({offset:t,pose:hangingPose(board,pivot,angle),opacity:1});
  }
  frames.at(-1).pose=to;
  return {frames,duration:2400};
}
// The fallback and gameplay use the same rigid-body collision model.
export function fallFrames(board,from,obstacles) {
  return simulatePlates([{board,pose:from,free:true},...obstacles.map(({polygon})=>({polygon,free:false}))]).get(board.id);
}
