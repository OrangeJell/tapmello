// 0–8 characters; 9–17 dots; 18–26 bamboo; 27–33 honors.
export const ALL_TILES = Array.from({ length: 34 }, (_, i) => i);
export const isTile = t => Number.isInteger(t) && t >= 0 && t < 34;
export function counts(tiles) {
  if (!Array.isArray(tiles) || tiles.some(t => !isTile(t))) return null;
  const result = Array(34).fill(0);
  for (const t of tiles) if (++result[t] > 4) return null;
  return result;
}
export function meldType(tiles) {
  if (!counts(tiles)) return null;
  const a = [...tiles].sort((a, b) => a - b);
  if (a.length === 2 && a[0] === a[1]) return 'pair';
  if (a.length === 4 && a.every(t => t === a[0])) return 'kong';
  if (a.length !== 3) return null;
  if (a.every(t => t === a[0])) return 'pung';
  if (a[0] < 27 && Math.floor(a[0] / 9) === Math.floor(a[2] / 9) && a[1] === a[0] + 1 && a[2] === a[0] + 2) return 'chow';
  return null;
}

// Standard four-meld-and-one-pair shape only. Scoring and special hands are excluded.
export function analyzeHand(hand, exposed = []) {
  if (!Array.isArray(exposed) || exposed.length > 4 || exposed.some(m => !['chow', 'pung', 'kong'].includes(meldType(m)))) return null;
  if (!counts(hand) || !counts([...hand, ...exposed.flat()]) || hand.length !== (4 - exposed.length) * 3 + 2) return null;
  const c = counts(hand);
  function takeSets(remaining) {
    const i = c.findIndex(n => n > 0);
    if (i < 0) return remaining === 0 ? [] : null;
    if (!remaining) return null;
    if (c[i] >= 3) {
      c[i] -= 3;
      const rest = takeSets(remaining - 1);
      c[i] += 3;
      if (rest) return [[i, i, i], ...rest];
    }
    if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) {
      c[i]--; c[i + 1]--; c[i + 2]--;
      const rest = takeSets(remaining - 1);
      c[i]++; c[i + 1]++; c[i + 2]++;
      if (rest) return [[i, i + 1, i + 2], ...rest];
    }
    return null;
  }
  for (let i = 0; i < 34; i++) if (c[i] >= 2) {
    c[i] -= 2;
    const sets = takeSets(4 - exposed.length);
    c[i] += 2;
    if (sets) return { sets: [...exposed.map(m => [...m]), ...sets], pair: [i, i] };
  }
  return null;
}
export function winningTiles(hand, exposed = []) {
  const c = counts([...hand, ...exposed.flat()]);
  if (!c || hand.length !== (4 - exposed.length) * 3 + 1) return [];
  return ALL_TILES.filter(t => c[t] < 4 && analyzeHand([...hand, t], exposed));
}
export function availableCalls(hand, discard, source) {
  if (!counts(hand) || !isTile(discard) || !['left', 'opposite', 'right'].includes(source) || !counts([...hand, discard])) return [];
  const c = counts(hand), result = [];
  if (c[discard] >= 2) result.push({ type: 'pung', tiles: [discard, discard, discard] });
  if (c[discard] >= 3) result.push({ type: 'kong', tiles: [discard, discard, discard, discard] });
  if (source === 'left' && discard < 27) {
    for (let start = discard - 2; start <= discard; start++) {
      if (start < 0 || start % 9 > 6 || Math.floor(start / 9) !== Math.floor(discard / 9)) continue;
      const group = [start, start + 1, start + 2];
      if (group.filter(t => t !== discard).every(t => c[t] > 0)) result.push({ type: 'chow', tiles: group });
    }
  }
  return result;
}
export function shuffled(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function createPractice(random = Math.random) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const sets = Array.from({ length: 4 }, () => {
      if (random() < .3) { const t = Math.floor(random() * 34); return [t, t, t]; }
      const start = Math.floor(random() * 3) * 9 + Math.floor(random() * 7);
      return [start, start + 1, start + 2];
    });
    const pair = Math.floor(random() * 34), complete = [...sets.flat(), pair, pair];
    if (!counts(complete)) continue;
    complete.splice(Math.floor(random() * complete.length), 1);
    const hand = complete.sort((a, b) => a - b), answers = winningTiles(hand);
    if (!answers.length) continue;
    const distractors = shuffled(ALL_TILES.filter(t => !answers.includes(t)), random).slice(0, Math.max(0, 6 - answers.length));
    return { hand, answers, options: shuffled([...answers, ...distractors], random) };
  }
  throw new Error('Could not generate a valid exercise');
}
export const ROUND_INITIAL = [0, 1, 3, 4, 9, 10, 11, 18, 19, 27, 27, 28, 29];
export const ROUND_DRAWS = [2, 20, 5];
export const ROUND_DISCARDS = [29, 28];

export const ORPHANS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
// The original basic solver stays unchanged. Callers explicitly opt into extended shapes.
export function analyzePatterns(hand, exposed = [], profile = 'extended') {
  if (!['basic', 'extended'].includes(profile) || !Array.isArray(hand) || !Array.isArray(exposed) || exposed.length > 4 || exposed.some(g => !['chow', 'pung', 'kong'].includes(meldType(g)))) return null;
  const c = counts(hand), all = counts([...hand, ...exposed.flat()]);
  if (!c || !all) return null;
  const structures = [], tags = [];
  const basic = analyzeHand(hand, exposed);
  if (basic) { structures.push({ type: 'standard', groups: [...basic.sets, basic.pair] }); tags.push('standard'); }
  if (profile === 'basic') return basic ? { structures, tags } : null;
  if (!exposed.length && hand.length === 14) {
    if (c.filter(n => n === 2).length === 7) {
      structures.push({ type: 'seven-pairs', groups: c.flatMap((n, i) => n === 2 ? [[i, i]] : []) });
      tags.push('seven-pairs');
    }
    if (ORPHANS.every(i => c[i] > 0) && c.every((n, i) => !n || ORPHANS.includes(i))) {
      structures.push({ type: 'thirteen-orphans', groups: ORPHANS.map(i => Array(c[i]).fill(i)) });
      tags.push('thirteen-orphans');
    }
  }
  if (!structures.length) return null;
  // Search the triplet decomposition independently: the first basic decomposition may contain sequences.
  if (basic && exposed.every(g => ['pung', 'kong'].includes(meldType(g)))) {
    for (let pair = 0; pair < 34; pair++) {
      if (c[pair] < 2) continue;
      const rest = [...c]; rest[pair] -= 2;
      if (rest.every(n => n % 3 === 0)) {
        const groups = [...exposed.map(g => [...g]), ...rest.flatMap((n, i) => n ? [[i, i, i]] : []), [pair, pair]];
        structures.push({ type: 'all-pungs', groups }); tags.push('all-pungs'); break;
      }
    }
  }
  const suitSet = new Set([...hand, ...exposed.flat()].filter(i => i < 27).map(i => Math.floor(i / 9)));
  const honors = [...hand, ...exposed.flat()].some(i => i >= 27);
  if (suitSet.size === 1) tags.push(honors ? 'half-flush' : 'full-flush');
  return { structures, tags: [...new Set(tags)] };
}
export function winningTilesFor(hand, exposed = [], profile = 'basic') {
  if (!Array.isArray(hand) || !Array.isArray(exposed) || exposed.some(g => !Array.isArray(g))) return [];
  const c = counts([...hand, ...exposed.flat()]);
  if (!c || hand.length !== (4 - exposed.length) * 3 + 1) return [];
  return ALL_TILES.filter(id => c[id] < 4 && analyzePatterns([...hand, id], exposed, profile));
}
