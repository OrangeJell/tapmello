import { createState, availableScrews, move, targetBox } from './engine.js';
// Bounded DFS, independent of the generated demonstration path.
export function solve(level, initial = createState(level), limit = 80000) {
  let visited = 0;
  const dead = new Set(), boardOf = new Map(level.boards.flatMap(b => b.screws.map(s => [s.id, b])));
  function visit(state) {
    if (state.status === 'won') return [];
    if (state.status !== 'playing' || ++visited > limit) return null;
    const key = JSON.stringify([state.removed.slice().sort(), state.boxes, state.queueIndex, state.buffer, state.capacity, state.melted, state.unlocked,state.poses,state.loose,state.fallen,state.queue]);
    if (dead.has(key)) return null;
    const choices = availableScrews(level, state).map(screw => {
      const box = targetBox(state, screw.color), board = boardOf.get(screw.id);
      const pins = board.screws.filter(s => !state.removed.includes(s.id)).length;
      return { screw, rank: (box >= 0 ? 100 + state.boxes[box].count * 12 : 0) + (pins === 1 ? 10 : 0) + board.z / 10 };
    }).sort((a, b) => b.rank - a.rank);
    for (const { screw } of choices) {
      const next = move(level, state, screw.id);
      if (!next.accepted) continue;
      const tail = visit(next.state);
      if (tail) return [screw.id, ...tail];
      if (visited >= limit) break;
    }
    dead.add(key); return null;
  }
  return { solution: visit(initial), visited };
}
