// Each unit represents three animals or one shuttle. These six queue patterns
// retain an 18–24 animal bottleneck across all four-station permutations.
export const SHIFT_PATTERNS = [
  {
    kind: 'crossroads',
    packs: [[0,0,0],[0,0,0],[2,2,1],[3,3,3],[1,1,2],[1,1,1]],
    positions: [0,1,0,2,1,2],
    queues: [[1,1,2,2,0],[1,3,1,2,0],[0,1,1,0],[0,3,3,0]],
  },
  {
    kind: 'returnLoop',
    packs: [[0,0,0],[1,1,1],[0,0,2],[3,3,3],[2,2,2],[1,1,3]],
    positions: [0,1,2,1,0,2],
    queues: [[3,1,1,0,0],[1,1,3,0,2],[2,2,0,0],[3,1,2,3]],
  },
  {
    kind: 'doubleLock',
    packs: [[0,0,0],[0,0,0],[3,3,2],[1,1,1],[2,2,3]],
    positions: [0,1,0,1,2],
    queues: [[1,0,3,0],[1,0,3,0],[2,1,0,3],[2,2,0]],
  },
  {
    kind: 'sideStreet',
    packs: [[0,0,0],[1,1,1],[2,2,2],[0,0,3],[3,3,3],[1,1,2]],
    positions: [0,0,1,2,1,2],
    queues: [[3,2,2,0,0],[3,1,0,0,1],[2,1,3,0],[2,1,1,3]],
  },
  {
    kind: 'switchyard',
    packs: [[0,0,1],[2,2,2],[0,0,0],[3,3,1],[1,1,1],[3,3,3]],
    positions: [0,1,0,2,1,2],
    queues: [[1,1,3,0,0],[3,0,2,3,1],[3,0,1,1],[2,3,0,2]],
  },
  {
    kind: 'braid',
    packs: [[0,0,0],[1,1,2],[3,3,3],[0,0,2],[1,1,1],[2,2,2]],
    positions: [0,1,2,1,0,2],
    queues: [[1,2,2,0,0],[2,1,1,0,3],[2,2,3,0],[1,0,3,1]],
  },
];

// Both decisions reward looking beyond an immediately matching colour. After
// three safe releases, the tempting house boards a few animals but leaves 27
// stranded; the other house opens the queues and drains the bottleneck. Keep
// these separate from SHIFT_PATTERNS so ordinary levels retain their seeds.
export const SUPER_HARD_PATTERNS = [
  {
    ...SHIFT_PATTERNS.find(pattern => pattern.kind === 'doubleLock'),
    kind: 'temptingLock',
    queues: [[1,0,3,0],[1,0,0,0],[1,2,3,3],[2,2,0]],
    decisionMove: 3,
    temptationPosition: 2,
  },
  {
    ...SHIFT_PATTERNS.find(pattern => pattern.kind === 'switchyard'),
    kind: 'temptingSwitchyard',
    decisionMove: 3,
    temptationPosition: 1,
  },
];
