import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHand, winningTiles, meldType, availableCalls, counts, createPractice, ROUND_INITIAL, ROUND_DRAWS, ROUND_DISCARDS } from '../js/rules.js';
import { lessons } from '../js/lessons.js';
import { cleanProgress, loadProgress, saveProgress } from '../js/storage.js';

test('sets respect suits, boundaries, honor rules, and exact size', () => {
  assert.equal(meldType([2, 0, 1]), 'chow');
  assert.equal(meldType([31, 31]), 'pair');
  assert.equal(meldType([31, 31, 31]), 'pung');
  assert.equal(meldType([31, 31, 31, 31]), 'kong');
  for (const bad of [[7, 8, 9], [0, 10, 20], [27, 28, 29], [8, 0, 1], [1, 1, 1, 1, 1]]) assert.equal(meldType(bad), null);
});
test('standard shape, ambiguous decomposition, and special-hand exclusion', () => {
  const hand = [0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 27, 27];
  const original = [...hand];
  assert.ok(analyzeHand(hand));
  assert.deepEqual(hand, original, 'solver must not mutate caller input');
  assert.ok(analyzeHand([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 4, 5, 6, 6]));
  assert.equal(analyzeHand(hand.slice(1)), null);
  assert.equal(analyzeHand([27, 27, 28, 28, 29, 29, 30, 30, 31, 31, 32, 32, 33, 33]), null);
  assert.equal(analyzeHand([0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 28, 29, 31, 31]), null);
  assert.equal(analyzeHand([0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 31, 31]), null);
  assert.equal(analyzeHand([0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 27, 99]), null);
});
test('exposed kongs add one physical tile but remain one set', () => {
  const hand = [0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27];
  assert.ok(analyzeHand(hand, [[31, 31, 31, 31]]));
  assert.equal(analyzeHand(hand, [[27, 27, 27]]), null, 'combined concealed and exposed copies cannot exceed four');
  assert.equal(analyzeHand(hand, [[27, 28, 29]]), null);
  assert.equal(analyzeHand(hand, [[31, 31]]), null);
});
test('winning-tile search finds all waits and rejects fifth copies', () => {
  assert.deepEqual(winningTiles([0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 27]), [27]);
  assert.deepEqual(winningTiles([0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 3, 4]), [2, 5]);
  assert.deepEqual(winningTiles([0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 6, 8]), [7]);
  const fourCopies = [0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 31];
  assert.deepEqual(winningTiles(fourCopies), []);
  assert.deepEqual(winningTiles([0, 1]), []);
  assert.deepEqual(winningTiles([0, 1, 2, 9, 10, 11, 18, 19, 20, 27], [[31, 31, 31, 31]]), [27]);
});
test('discard calls depend on source, tile count and suit', () => {
  assert.deepEqual(availableCalls([1, 3], 2, 'left').map(c => c.type), ['chow']);
  assert.deepEqual(availableCalls([1, 3], 2, 'opposite'), []);
  assert.deepEqual(availableCalls([31, 31], 31, 'right').map(c => c.type), ['pung']);
  assert.deepEqual(availableCalls([13, 13, 13], 13, 'opposite').map(c => c.type), ['pung', 'kong']);
  assert.deepEqual(availableCalls([27, 29], 28, 'left'), []);
  assert.deepEqual(availableCalls([7, 8], 9, 'left'), []);
  assert.deepEqual(availableCalls([31, 31, 31, 31], 31, 'left'), []);
});
test('scripted hand preserves tile counts and ends in a valid self-draw', () => {
  const hand = [...ROUND_INITIAL];
  assert.equal(hand.length, 13);
  for (let i = 0; i < 3; i++) {
    hand.push(ROUND_DRAWS[i]);
    assert.equal(hand.length, 14); assert.ok(counts(hand));
    if (i < 2) { hand.splice(hand.indexOf(ROUND_DISCARDS[i]), 1); assert.equal(hand.length, 13); }
  }
  assert.ok(analyzeHand(hand));
  assert.deepEqual(winningTiles(hand.slice(0, -1)), [2, 5]);
});
test('generated practice is physically valid and includes all correct answers', () => {
  let seed = 913;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const signatures = new Set();
  for (let i = 0; i < 400; i++) {
    const p = createPractice(random);
    assert.equal(p.hand.length, 13); assert.ok(counts(p.hand));
    assert.deepEqual(p.answers, winningTiles(p.hand)); assert.ok(p.answers.length);
    assert.equal(new Set(p.options).size, p.options.length);
    for (const answer of p.answers) { assert.ok(p.options.includes(answer)); assert.ok(analyzeHand([...p.hand, answer])); }
    signatures.add(p.hand.join(','));
  }
  assert.ok(signatures.size > 380);
});
test('lesson exercises have bilingual feedback and reachable answers', () => {
  let total = 0;
  for (const lesson of lessons) {
    for (const q of lesson.questions) {
      total++;
      for (const key of ['prompt', 'hint', 'explain', 'wrong']) for (const lang of ['en', 'hi']) assert.ok(q[key]?.[lang], `${key}/${lang}`);
      if (q.answers) for (const answer of q.answers) assert.ok(q.options.includes(answer));
      if (q.kind === 'wait') { assert.ok(counts(q.hand)); assert.deepEqual(q.answers, winningTiles(q.hand)); }
      if (q.kind === 'build') {
        let solutions = 0;
        for (let mask = 0; mask < 2 ** q.options.length; mask++) {
          const selected = q.options.filter((_, i) => mask & (1 << i));
          if (selected.length === q.size && meldType(selected) === q.target) solutions++;
        }
        assert.ok(solutions > 0);
      }
      if (['group', 'choice'].includes(q.kind)) assert.ok(q.answer >= 0 && q.answer < q.options.length);
    }
  }
  assert.equal(total, 20);
});
