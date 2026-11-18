// Pure transitions shared by gameplay, session replay and the independent solver.
import { boardPose, positionOf, worldContour, polygonCovers, bounds, HEAD_RADIUS } from './geometry.js';
import { RULES } from './config.js';
import { simulatePlates } from './plate-physics.js';
export { positionOf, covers } from './geometry.js';
export const COLORS = ['coral', 'blue', 'gold', 'mint', 'violet', 'cyan', 'orange', 'pink', 'pearl', 'copper'];
export const SYMBOLS = { coral: '✕', blue: '✚', gold: '★', mint: '▲', violet: '◆', cyan: '≋', orange: '●', pink: '♥', pearl: '✧', copper: '⬟' };
export const totalScrews = level => level.boards.reduce((sum, board) => sum + board.screws.length, 0);
const clone = value => JSON.parse(JSON.stringify(value));

export function createState(level, { openBoxes = 2 } = {}) {
  openBoxes = Number.isInteger(openBoxes) ? Math.max(2, Math.min(RULES.maxBoxes, openBoxes)) : 2;
  return {
    levelId: level.id, version: level.version, initialBoxes: openBoxes,
    removed: [], melted: [], floating: {}, poses: {}, loose: {}, resting: {}, fallen: [], buffer: [], queue: [...level.queue],
    capacity: RULES.initialSlots, moves: 0, packed: 0, status: 'playing',
    boxes: Array.from({ length: RULES.maxBoxes }, (_, i) => i < openBoxes ? { color: level.queue[i], count: 0 } : null),
    unlocked: Array.from({ length: RULES.maxBoxes }, (_, i) => i < openBoxes), queueIndex: openBoxes,
    used: { extra: 0, melt: 0 }, meltCredits: 0,
  };
}
export function poseOf(board, state) {
  return state.loose?.[board.id] || state.poses?.[board.id] || boardPose(board, new Set(state.removed));
}
export function settlePlates(level, state, motions=null, initialMotion={}) {
  state.resting ||= {};
  const removed=new Set(state.removed);
  for(const board of level.boards) {
    if(!state.melted.includes(board.id)&&!state.fallen.includes(board.id)&&!state.loose[board.id]&&board.screws.every(s=>removed.has(s.id)))state.loose[board.id]=poseOf(board,state);
  }
  const groups=new Map();
  for(const board of activeBoards(level,state)) {
    if(!groups.has(board.layer))groups.set(board.layer,[]);
    groups.get(board.layer).push(board);
  }
  const signature=plane=>plane.map(b=>{
    const p=poseOf(b,state),pins=b.screws.filter(s=>!removed.has(s.id));
    return `${b.id}:${pins.map(s=>s.id).join('.')}:${p.x.toFixed(3)}:${p.y.toFixed(3)}:${p.angle.toFixed(3)}`;
  }).join('|');
  for(const plane of groups.values()) {
    const dynamic=plane.filter(b=>b.screws.filter(s=>!removed.has(s.id)).length<=1);
    if(!dynamic.length)continue;
    const before=signature(plane);
    if(dynamic.every(b=>state.resting[b.id]===before&&!initialMotion[b.id]))continue;
    const movement=simulatePlates(plane.map(board=>{
      const pins=board.screws.filter(s=>!removed.has(s.id));
      return {board,pose:state.loose[board.id]||state.poses[board.id]||{x:board.x,y:board.y,angle:board.angle},free:!pins.length,pivot:pins.length===1?pins[0]:null,velocity:initialMotion[board.id]};
    }));
    for(const board of dynamic) {
      const motion=movement.get(board.id);if(!motion)continue;
      if(motion.offscreen){delete state.loose[board.id];state.fallen.push(board.id);}
      else if(state.loose[board.id])state.loose[board.id]=motion.pose;
      else state.poses[board.id]=motion.pose;
      if(motions)motions.set(board.id,motion);
    }
    const after=signature(plane.filter(b=>!state.fallen.includes(b.id)));
    // Cache the whole contact group, including pinned bodies. Removing a
    // support or continuing an in-flight pose wakes the group together.
    for(const board of dynamic)state.resting[board.id]=after;
  }
}
export function activeBoards(level, state) {
  const removed = new Set(state.removed), melted = new Set(state.melted);
  return level.boards.filter(b => !melted.has(b.id) && (state.loose?.[b.id] || b.screws.some(s => !removed.has(s.id))));
}
export function screwPosition(board, screw, state, pose) {
  return state.floating[screw.id] || positionOf(board, screw, pose || poseOf(board,state));
}
// Detached glass still collides and blocks clicks, but adds no display layer.
export function displayPlates(level, state, poses=null) {
  const removed=new Set(state.removed),melted=new Set(state.melted);
  return level.boards.filter(board=>!melted.has(board.id)&&board.screws.some(s=>!removed.has(s.id)))
    .map(board=>({board,polygon:worldContour(board,poses?.get(board.id)||poseOf(board,state))}));
}
export function availableScrews(level, state, poses = null) {
  const removed = new Set(state.removed);
  const reach=HEAD_RADIUS+.0001;
  const active=new Set(activeBoards(level,state).map(b=>b.id));
  const plates = level.boards.filter(b=>!state.melted.includes(b.id)&&(active.has(b.id)||poses?.has(b.id))).map(board => {
    const polygon=worldContour(board,poses?.get(board.id)||poseOf(board,state));
    return {board,polygon,bounds:bounds(polygon)};
  });
  return level.boards.flatMap(board => board.screws.filter(screw => {
    if (removed.has(screw.id)) return false;
    const point = screwPosition(board, screw, state, poses?.get(board.id));
    return !plates.some(other => (other.board.layer??other.board.z) > (board.layer??board.z) && point.x>=other.bounds.minX-reach&&point.x<=other.bounds.maxX+reach&&point.y>=other.bounds.minY-reach&&point.y<=other.bounds.maxY+reach&&polygonCovers(other.polygon, point, HEAD_RADIUS));
  }));
}
export function targetBox(state, color) {
  return state.boxes.map((box, index) => ({ box, index }))
    .filter(({ box }) => box?.color === color && box.count < 3)
    .sort((a, b) => b.box.count - a.box.count || a.index - b.index)[0]?.index ?? -1;
}
export function selectableBoards(level, state,poses=null) {
  const ids = new Set(availableScrews(level, state,poses).map(s => s.id));
  return activeBoards(level, state).filter(b => b.screws.some(s => ids.has(s.id)));
}
export function settle(level, state, events = []) {
  let changed;
  do {
    changed = false;
    state.boxes.forEach((box, index) => {
      if (box?.count !== 3) return;
      state.packed += 3;
      state.boxes[index] = state.queueIndex < state.queue.length ? { color: state.queue[state.queueIndex++], count: 0 } : null;
      events.push({ type: 'packed', index, nextBox: clone(state.boxes[index]), queueIndex: state.queueIndex });
      changed = true;
    });
    const index = state.buffer.findIndex(s => targetBox(state, s.color) >= 0);
    if (index >= 0) {
      const [screw] = state.buffer.splice(index, 1), boxIndex = targetBox(state, screw.color);
      const slot = state.boxes[boxIndex].count++;
      events.push({ type: 'stored', source: 'buffer', sourceIndex: index, screwId: screw.id, color: screw.color, index: boxIndex, slot });
      changed = true;
    }
  } while (changed);
  if (state.packed === totalScrews(level)) state.status = 'won';
  // User's rule: filling the last temporary slot ends the round immediately.
  else if (state.buffer.length >= state.capacity) state.status = 'jammed';
  else state.status = 'playing';
  return state;
}
export function canUse(state, type) {
  if (state.status !== 'playing') return false;
  if (type === 'extra') return state.capacity < RULES.maxSlots;
  if (type === 'melt') return state.meltCredits > 0 || state.used.melt < RULES.meltUses;
  return false;
}
function continuationBatch(state) {
  const colors = [...new Set(state.buffer.map(s => s.color))].sort((a, b) =>
    state.buffer.filter(s => s.color === b).length - state.buffer.filter(s => s.color === a).length);
  return colors.map(color => state.queue.indexOf(color, state.queueIndex)).find(index => index >= state.queueIndex);
}
export function continuation(state) {
  if (state.status !== 'jammed') return null;
  if (state.unlocked.filter(Boolean).length < RULES.maxBoxes) return continuationBatch(state) === undefined ? null : 'box';
  return state.capacity < RULES.maxSlots ? 'extra' : null;
}
export function transition(level, previous, action, {captureMotion=false}={}) {
  const reject = () => ({ accepted: false, state: previous, events: [] });
  if (!action || (previous.status !== 'playing' && !(previous.status==='jammed' && action.type==='continue'))) return reject();
  const state = clone(previous), events = [];
  const changedBoard=action.type==='screw'?level.boards.find(b=>b.screws.some(s=>s.id===action.id)):action.type==='melt'?level.boards.find(b=>b.id===action.id):null;
  const affectedLayers=new Set(changedBoard?[changedBoard.layer]:[]);
  for(const id of Object.keys(action.looseMotion||{})) {
    const moving=level.boards.find(b=>b.id===id);if(moving)affectedLayers.add(moving.layer);
  }
  let scenePoses=null;
  if(action.scenePoses) {
    if(typeof action.scenePoses!=='object'||Array.isArray(action.scenePoses))return reject();
    scenePoses=new Map();
    for(const [id,p] of Object.entries(action.scenePoses)) {
      const board=level.boards.find(b=>b.id===id);
      if(!board||previous.melted.includes(id)||!p||![p.x,p.y,p.angle].every(Number.isFinite)||Math.abs(p.x)>2000||Math.abs(p.y)>2000||Math.abs(p.angle)>10000)return reject();
      const pins=board.screws.filter(s=>!previous.removed.includes(s.id)),expected=poseOf(board,previous);
      if(pins.length>=2&&Math.abs(p.x-expected.x)+Math.abs(p.y-expected.y)+Math.abs(p.angle-expected.angle)>.05)return reject();
      if(pins.length===1) {
        const anchor=positionOf(board,pins[0],expected),actual=positionOf(board,pins[0],p);
        if(Math.hypot(anchor.x-actual.x,anchor.y-actual.y)>.5)return reject();
        if(affectedLayers.has(board.layer))state.poses[id]=clone(p);
      }else if(!pins.length&&(previous.loose[id]||previous.fallen.includes(id))) {
        if(affectedLayers.has(board.layer)){state.loose[id]=clone(p);state.fallen=state.fallen.filter(fallen=>fallen!==id);delete state.resting[id];}
      }
      scenePoses.set(id,p);
    }
  }
  if (action.type === 'screw') {
    const screw = availableScrews(level, previous,scenePoses).find(s => s.id === action.id);
    if (!screw) return reject();
    const index = targetBox(state, screw.color);
    const owner=level.boards.find(b=>b.screws.some(s=>s.id===screw.id));
    const last=owner.screws.filter(s=>!state.removed.includes(s.id)).length===1;
    if(last&&action.releasePose&&!state.melted.includes(owner.id)) {
      const p=action.releasePose,anchor=positionOf(owner,screw),actual=positionOf(owner,screw,p);
      if(![p.x,p.y,p.angle].every(Number.isFinite)||Math.hypot(anchor.x-actual.x,anchor.y-actual.y)>.5)return reject();
      state.poses[owner.id]=clone(p);
    }
    state.removed.push(screw.id); state.moves++;
    if (index >= 0) {
      const slot = state.boxes[index].count++;
      events.push({ type: 'taken', screwId: screw.id, color: screw.color, target: 'box', index, slot });
    } else {
      const slot = state.buffer.length;
      if (slot >= state.capacity) return reject();
      state.buffer.push({ id: screw.id, color: screw.color });
      events.push({ type: 'taken', screwId: screw.id, color: screw.color, target: 'buffer', slot });
    }
  } else if (action.type === 'continue') {
    const reward = continuation(previous);
    if (!reward || (action.reward && action.reward !== reward)) return reject();
    if (reward === 'box') {
      // Choose a pending batch that frees space without adding a fifth box.
      const next = continuationBatch(state), index = state.unlocked.findIndex(open => !open);
      if (index < 0 || index >= RULES.maxBoxes) return reject();
      [state.queue[next], state.queue[state.queueIndex]] = [state.queue[state.queueIndex], state.queue[next]];
      state.unlocked[index] = true; state.boxes[index] = { color: state.queue[state.queueIndex++], count: 0 };
      events.push({ type: 'unlocked', index, nextBox: clone(state.boxes[index]), queueIndex: state.queueIndex });
    } else {
      state.capacity++; state.used.extra++;
      events.push({ type: 'extra', capacity: state.capacity });
    }
  } else if (action.type === 'unlock') {
    const index = action.index;
    if (!Number.isInteger(index) || index < 2 || index >= RULES.maxBoxes || state.unlocked[index] || state.queueIndex >= level.queue.length) return reject();
    state.unlocked[index] = true;
    state.boxes[index] = { color: state.queue[state.queueIndex++], count: 0 };
    events.push({ type: 'unlocked', index, nextBox: clone(state.boxes[index]), queueIndex: state.queueIndex });
  } else if (action.type === 'extra') {
    if (!canUse(state, 'extra')) return reject();
    state.capacity++; state.used.extra++; events.push({ type: 'extra', capacity: state.capacity });
  } else if (action.type === 'grantMelt') {
    if (state.used.melt >= RULES.meltUses || state.meltCredits > 0) return reject();
    state.meltCredits++; events.push({ type: 'credit' });
  } else if (action.type === 'melt') {
    if (!state.meltCredits) return reject();
    const board = selectableBoards(level, previous,scenePoses).find(b => b.id === action.id);
    if (!board) return reject();
    const pose = poseOf(board,state);
    for (const screw of board.screws) if (!state.removed.includes(screw.id)) state.floating[screw.id] = positionOf(board, screw, pose);
    state.melted.push(board.id); state.meltCredits--; state.used.melt++;
    events.push({ type: 'melted', id: board.id });
  } else return reject();
  const motions=captureMotion?new Map():null;
  const velocities={};
  for(const [id,snapshot] of Object.entries(action.looseMotion||{})) {
    const moving=level.boards.find(b=>b.id===id);
    if(!moving||state.melted.includes(id)||moving.screws.filter(s=>!state.removed.includes(s.id)).length>1)continue;
    const p=snapshot?.pose,v=snapshot?.velocity;
    if(!p||![p.x,p.y,p.angle].every(Number.isFinite)||Math.abs(p.x)>2000||Math.abs(p.y)>2000||Math.abs(p.angle)>10000)continue;
    if(state.loose[id])state.loose[id]=clone(p);else state.poses[id]=clone(p);delete state.resting[id];
    if(v&&[v.x,v.y,v.spin].every(Number.isFinite)&&Math.abs(v.x)<3000&&Math.abs(v.y)<3000&&Math.abs(v.spin)<40)velocities[id]=clone(v);
  }
  settlePlates(level,state,motions,velocities);
  settle(level, state, events);
  return { accepted: true, state, events, motions };
}
export const move = (level, state, id) => transition(level, state, { type: 'screw', id });
export function validateLevel(level) {
  const screws = level.boards.flatMap(b => b.screws);
  if (new Set(screws.map(s => s.id)).size !== screws.length) throw Error('Duplicate screw ID');
  if (new Set(level.boards.map(b => b.id)).size !== level.boards.length) throw Error('Duplicate board ID');
  for (const color of COLORS) if (screws.filter(s => s.color === color).length !== 3 * level.queue.filter(c => c === color).length) throw Error(`Inventory mismatch: ${color}`);
  if (screws.some(s => !COLORS.includes(s.color))) throw Error('Unknown color');
  if (level.queue.length < 4) throw Error('At least four box batches required');
}
