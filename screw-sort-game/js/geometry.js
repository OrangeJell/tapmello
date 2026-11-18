// Local contours are the source of truth for paint, mass and occlusion.
// Sample rounded corners once. The same polygon drives SVG, mass and hit tests.
function rounded(points, inset = .16, steps = 4) {
  return points.flatMap((p, i) => {
    const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
    const a = p.map((v, axis) => v + (prev[axis] - v) * inset);
    const b = p.map((v, axis) => v + (next[axis] - v) * inset);
    return Array.from({ length: steps + 1 }, (_, j) => {
      const t = j / steps;
      return p.map((v, axis) => (1-t)**2*a[axis] + 2*(1-t)*t*v + t*t*b[axis]);
    });
  });
}
const ellipse = Array.from({ length: 32 }, (_, i) => [Math.cos(i*Math.PI/16)*.5, Math.sin(i*Math.PI/16)*.5]);
const heart = Array.from({ length: 64 }, (_, i) => {
  const t = i * Math.PI / 32;
  return [16 * Math.sin(t) ** 3 / 32, -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t) + 2.5) / 29];
});
const star = Array.from({length:10},(_,i)=>{
  const a=i*Math.PI/5-Math.PI/2,r=i%2?.24:.5;
  return [Math.cos(a)*r,Math.sin(a)*r];
});
const crescent = [
  ...Array.from({length:25},(_,i)=>{const a=(50+i*260/24)*Math.PI/180;return [Math.cos(a)*.5,Math.sin(a)*.5];}),
  ...Array.from({length:19},(_,i)=>{const a=(-78-i*204/18)*Math.PI/180;return [.25+Math.cos(a)*.35,Math.sin(a)*.39];}),
];
// Solid, rounded silhouettes: one contour is shared by SVG, occlusion and physics.
const flower = Array.from({length:60},(_,i)=>{
  const a=i*Math.PI/30,r=.40+.10*Math.cos(5*a);
  return [Math.cos(a)*r,Math.sin(a)*r];
});
const shapes = {
  flower,
  petal: rounded([[0,-.5],[.35,-.3],[.5,.08],[.26,.4],[0,.5],[-.26,.4],[-.5,.08],[-.35,-.3]],.25),
  drop: rounded([[0,-.5],[.36,-.03],[.48,.23],[.3,.45],[0,.5],[-.3,.45],[-.48,.23],[-.36,-.03]],.2),
  digit1: rounded([[-.38,-.27],[.02,-.5],[.29,-.5],[.29,.22],[.5,.22],[.5,.5],[-.44,.5],[-.44,.22],[-.04,.22],[-.04,-.14],[-.38,.01]],.06,2),
  digit2: rounded([[-.5,-.5],[.5,-.5],[.5,-.06],[-.12,.2],[.5,.2],[.5,.5],[-.5,.5],[-.5,.04],[.15,-.22],[-.5,-.22]],.07,2),
  digit3: rounded([[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5],[-.5,.2],[.12,.2],[.12,.13],[-.3,.13],[-.3,-.13],[.12,-.13],[.12,-.2],[-.5,-.2]],.05,2),
  digit5: rounded([[-.5,-.5],[.5,-.5],[.5,-.2],[-.12,-.2],[-.12,-.13],[.5,-.13],[.5,.5],[-.5,.5],[-.5,.2],[.12,.2],[.12,.13],[-.5,.13]],.05,2),
  digit7: rounded([[-.5,-.5],[.5,-.5],[.5,-.22],[.04,.5],[-.36,.5],[.10,-.2],[-.5,-.2]],.06,2),

  bar: [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],
  heart,
  ellipse,
  rounded: rounded([[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]], .28),
  leaf: rounded([[-.5,0],[-.24,-.42],[.12,-.5],[.4,-.25],[.5,0],[.24,.42],[-.12,.5],[-.4,.25]], .28),
  l: [[-.5,-.5],[-.16,-.5],[-.16,.16],[.5,.16],[.5,.5],[-.5,.5]],
  triangle: rounded([[0,-.5],[.5,.5],[-.5,.5]], .16),
  hexagon: rounded([[-.5,0],[-.25,-.5],[.25,-.5],[.5,0],[.25,.5],[-.25,.5]], .12),
  c: rounded([[-.5,-.5],[.5,-.5],[.5,-.18],[-.15,-.18],[-.15,.18],[.5,.18],[.5,.5],[-.5,.5]],.08,2),
  u: rounded([[-.5,-.5],[-.17,-.5],[-.17,.16],[.17,.16],[.17,-.5],[.5,-.5],[.5,.5],[-.5,.5]],.08,2),
  t: rounded([[-.5,-.5],[.5,-.5],[.5,-.16],[.18,-.16],[.18,.5],[-.18,.5],[-.18,-.16],[-.5,-.16]],.08,2),
  e: [[-.5,-.5],[.5,-.5],[.5,-.23],[-.14,-.23],[-.14,-.13],[.32,-.13],[.32,.13],[-.14,.13],[-.14,.23],[.5,.23],[.5,.5],[-.5,.5]],
  f: [[-.5,-.5],[.5,-.5],[.5,-.18],[-.12,-.18],[-.12,-.04],[.3,-.04],[.3,.25],[-.12,.25],[-.12,.5],[-.5,.5]],
  h: [[-.5,-.5],[-.17,-.5],[-.17,-.16],[.17,-.16],[.17,-.5],[.5,-.5],[.5,.5],[.17,.5],[.17,.16],[-.17,.16],[-.17,.5],[-.5,.5]],
  s: [[-.5,-.5],[.5,-.5],[.5,-.18],[-.16,-.18],[-.16,-.08],[.5,-.08],[.5,.5],[-.5,.5],[-.5,.18],[.16,.18],[.16,.08],[-.5,.08]],
  z: [[-.5,-.5],[.5,-.5],[.5,-.2],[-.02,.18],[.5,.18],[.5,.5],[-.5,.5],[-.5,.2],[.02,-.18],[-.5,-.18]],
  cross: rounded([[-.17,-.5],[.17,-.5],[.17,-.17],[.5,-.17],[.5,.17],[.17,.17],[.17,.5],[-.17,.5],[-.17,.17],[-.5,.17],[-.5,-.17],[-.17,-.17]],.06,2),
  chevron: [[-.5,-.5],[-.06,-.5],[.5,0],[-.06,.5],[-.5,.5],[.04,0]],
  bolt: [[-.12,-.5],[.5,-.5],[.08,-.06],[.42,-.06],[-.18,.5],[-.5,.5],[-.18,.09],[-.5,.09]],
  diamond: rounded([[0,-.5],[.5,0],[0,.5],[-.5,0]],.1,2),
  trapezoid: rounded([[-.3,-.5],[.3,-.5],[.5,.5],[-.5,.5]],.1,2),
  pentagon: rounded(Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5-Math.PI/2;return [Math.cos(a)*.5,Math.sin(a)*.5];}),.1,2),
  star: rounded(star,.08,2),
  crescent,
  wave: rounded([[-.5,-.34],[-.17,-.5],[.18,-.16],[.5,-.32],[.5,.34],[.17,.5],[-.18,.16],[-.5,.32]],.12,2),
};
export const SHAPES = Object.keys(shapes);
export const HEAD_RADIUS = 14;
const contours = new WeakMap();
export function contour(board) {
  const key = `${board.shape}:${board.width}:${board.height}:${!!board.flipX}`;
  let cached = contours.get(board);
  if (cached?.key !== key) {
    cached = { key, points: (shapes[board.shape] || shapes.bar).map(([x,y]) => ({ x:x*board.width*(board.flipX?-1:1), y:y*board.height })) };
    contours.set(board, cached);
  }
  return cached.points;
}
export function centroid(board) {
  const points = contour(board);
  let area = 0, x = 0, y = 0;
  points.forEach((p,i) => {
    const q = points[(i+1)%points.length], cross = p.x*q.y-q.x*p.y;
    area += cross; x += (p.x+q.x)*cross; y += (p.y+q.y)*cross;
  });
  return { x:x/(3*area), y:y/(3*area) };
}
export function areaOf(board) {
  const points=contour(board);
  return Math.abs(points.reduce((sum,p,i)=>{
    const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;
  },0))/2;
}
// Unlike overlap tests, a screw must fit entirely inside its own glass.
export function fitsInside(board, point, radius=HEAD_RADIUS+2) {
  const points=contour(board);
  if(!polygonCovers(points,point,0)) return false;
  return points.every((a,i)=>{
    const b=points[(i+1)%points.length], dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy)>=radius-.001;
  });
}
export function positionOf(board, point, pose = board) {
  const a = pose.angle*Math.PI/180, y = point.y || 0;
  return { x:pose.x + point.x*Math.cos(a)-y*Math.sin(a), y:pose.y + point.x*Math.sin(a)+y*Math.cos(a) };
}
export function hangingPose(board, pivot, angle) {
  const anchor = positionOf(board, pivot);
  const offset = positionOf(board, pivot, { x:0,y:0,angle });
  return { x:anchor.x-offset.x, y:anchor.y-offset.y, angle };
}
export function boardPose(board, removed) {
  const remaining = board.screws.filter(s => !removed.has(s.id));
  if (remaining.length !== 1) return { x:board.x, y:board.y, angle:board.angle };
  const pivot = remaining[0], mass = centroid(board);
  const dx = mass.x-pivot.x, dy = mass.y-(pivot.y || 0);
  if (Math.hypot(dx,dy) < .001) return { x:board.x, y:board.y, angle:board.angle };
  const target = 90-Math.atan2(dy,dx)*180/Math.PI;
  const delta = ((target-board.angle+540)%360)-180;
  return hangingPose(board, pivot, board.angle+delta);
}
export function worldContour(board, pose = board) {
  const angle=pose.angle*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  return contour(board).map(point=>({x:pose.x+point.x*cos-point.y*sin,y:pose.y+point.x*sin+point.y*cos}));
}
export function bounds(points) {
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const p of points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  return {minX,maxX,minY,maxY};
}
export function polygonCovers(points, point, radius = HEAD_RADIUS) {
  let inside = false;
  const reach=radius+.0001,reachSquared=reach*reach;
  for (let i=0,j=points.length-1; i<points.length; j=i++) {
    const a=points[i], b=points[j];
    if ((a.y>point.y)!==(b.y>point.y) && point.x < (b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
    if(reach>0&&point.x>Math.min(a.x,b.x)-reach&&point.x<Math.max(a.x,b.x)+reach&&point.y>Math.min(a.y,b.y)-reach&&point.y<Math.max(a.y,b.y)+reach) {
      const dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));
      const x=point.x-a.x-t*dx,y=point.y-a.y-t*dy;
      if(x*x+y*y<reachSquared)return true;
    }
  }
  return inside;
}
export function covers(board, point, radius = HEAD_RADIUS, pose = board) {
  return polygonCovers(worldContour(board,pose),point,radius);
}
export function shapePath(board) {
  return contour(board).map((p,i) => `${i?'L':'M'}${p.x+board.width/2},${p.y+board.height/2}`).join(' ')+'Z';
}

// Strict polygon intersection: touching rims are allowed, penetrating glass is not.
export function polygonsOverlap(a, b, aa=bounds(a), bb=bounds(b)) {
  if (aa.maxX<=bb.minX+.02 || bb.maxX<=aa.minX+.02 || aa.maxY<=bb.minY+.02 || bb.maxY<=aa.minY+.02) return false;
  // Most stacked glass already contains a vertex of the other contour. Avoid
  // comparing every pair of edges before recognizing that common case.
  if(a.some(p=>polygonCovers(b,p,-.03))||b.some(p=>polygonCovers(a,p,-.03)))return true;
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  for(let i=0;i<a.length;i++) for(let j=0;j<b.length;j++) {
    const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
    if(cross(p,q,r)*cross(p,q,s)<-.001 && cross(r,s,p)*cross(r,s,q)<-.001) return true;
  }
  return false;
}
export function intersectsAt(board, pose, obstacles) {
  const polygon=worldContour(board,pose);
  return obstacles.some(other=>polygonsOverlap(polygon,other.polygon));
}
export function constrainedHang(board, pivot, from, obstacles) {
  const target=boardPose(board,new Set(board.screws.filter(s=>s.id!==pivot.id).map(s=>s.id)));
  const delta=target.angle-from.angle, steps=Math.max(1,Math.ceil(Math.abs(delta)/1.2));
  let pose=from;
  for(let i=1;i<=steps;i++) {
    const next=hangingPose(board,pivot,from.angle+delta*i/steps);
    if(intersectsAt(board,next,obstacles)) break;
    pose=next;
  }
  return pose;
}
export function headExposure(point, polygons, radius=HEAD_RADIUS) {
  const sample=(x,y)=>!polygons.some(p=>polygonCovers(p,{x,y},0));
  let visible=sample(point.x,point.y)?1:0, total=1;
  for(const ring of [.55,.98]) for(let i=0;i<24;i++) {
    const a=i*Math.PI/12;visible+=sample(point.x+Math.cos(a)*radius*ring,point.y+Math.sin(a)*radius*ring)?1:0;total++;
  }
  return visible/total;
}
// Removing a pin usually leaves the glass geometry unchanged. Share its exact
// depth result across engine checks and drawing, including the settled/live
// scenes used during a swing. Copies keep caller mutations out of the cache.
const depthScenes=[];
export function stackDepths(plates,limit=Infinity) {
  if(!plates.length)return new Map();
  const cached=depthScenes.find(scene=>scene.limit===limit&&scene.plates.length===plates.length&&scene.plates.every((saved,i)=>{
    const {board,polygon}=plates[i];
    return saved.id===board.id&&saved.z===board.z&&saved.polygon.length===polygon.length&&saved.polygon.every((p,j)=>p.x===polygon[j].x&&p.y===polygon[j].y);
  }));
  if(cached)return new Map(cached.depths);
  const depths=calculateStackDepths(plates,limit);
  depthScenes.unshift({limit,depths,plates:plates.map(({board,polygon})=>({id:board.id,z:board.z,polygon:polygon.map(p=>({...p}))}))});
  depthScenes.length=Math.min(depthScenes.length,2);
  return new Map(depths);
}
// Each plate gets its own depth from the glass actually overlapping it above.
function calculateStackDepths(plates,limit) {
  const depths=new Map();
  const entries=plates.map(plate=>({...plate,bounds:bounds(plate.polygon)}));
  const boxes=new Map(entries.map(plate=>[plate.polygon,plate.bounds]));
  for(const plate of entries) {
    const over=entries.filter(other=>(other.board.layer??other.board.z)>(plate.board.layer??plate.board.z)&&polygonsOverlap(plate.polygon,other.polygon,plate.bounds,other.bounds));
    let depth=0;
    const maximum=Math.min(limit,over.length),ownBounds=plate.bounds;
    const covers=over;
    const sample=point=>{
      if(point.x<ownBounds.minX||point.x>ownBounds.maxX||point.y<ownBounds.minY||point.y>ownBounds.maxY)return;
      // Probe the cells beside a rim; a shared edge itself adds no thickness.
      for(const [dx,dy] of [[-.015,-.015],[.015,-.015],[.015,.015],[-.015,.015],[-.02,0],[.02,0],[0,-.02],[0,.02]]) {
        const p={x:point.x+dx,y:point.y+dy};
        if(!polygonCovers(plate.polygon,p,0))continue;
        const count=covers.filter(other=>p.x>=other.bounds.minX&&p.x<=other.bounds.maxX&&p.y>=other.bounds.minY&&p.y<=other.bounds.maxY&&polygonCovers(other.polygon,p,0)).length;
        depth=Math.min(maximum,Math.max(depth,count));
        if(depth>=maximum)return;
      }
    };
    const polygons=[plate.polygon,...over.map(other=>other.polygon)];
    // Maximum local thickness occurs in a cell next to a contour vertex or an
    // intersection. Glass covering separate edges is not one combined stack.
    for(const polygon of polygons) {
      for(const p of polygon){sample(p);if(depth>=maximum)break;}
      if(depth>=maximum)break;
    }
    for(let a=0;a<polygons.length&&depth<maximum;a++)for(let b=a+1;b<polygons.length&&depth<maximum;b++) {
      const aa=boxes.get(polygons[a]),bb=boxes.get(polygons[b]);
      if(aa.maxX<bb.minX||bb.maxX<aa.minX||aa.maxY<bb.minY||bb.maxY<aa.minY)continue;
      for(let i=0;i<polygons[a].length&&depth<maximum;i++)for(let j=0;j<polygons[b].length&&depth<maximum;j++) {
        const p=polygons[a][i],q=polygons[a][(i+1)%polygons[a].length],r=polygons[b][j],s=polygons[b][(j+1)%polygons[b].length];
        const dx=q.x-p.x,dy=q.y-p.y,ex=s.x-r.x,ey=s.y-r.y,den=dx*ey-dy*ex;
        if(Math.abs(den)<1e-9)continue;
        const t=((r.x-p.x)*ey-(r.y-p.y)*ex)/den,u=((r.x-p.x)*dy-(r.y-p.y)*dx)/den;
        if(t>=0&&t<=1&&u>=0&&u<=1)sample({x:p.x+t*dx,y:p.y+t*dy});
      }
    }
    depths.set(plate.board.id,depth);
  }
  return depths;
}
