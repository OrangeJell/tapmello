import test from 'node:test';
import assert from 'node:assert/strict';
import { RewardAds, isLocalTest } from '../js/ads.js';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function handlers() {
  const counts = { start: 0, end: 0, reward: 0, current: true };
  return { counts, isCurrent: () => counts.current,
    onStart: () => counts.start++, onEnd: () => counts.end++, onReward: () => counts.reward++ };
}
test('default provider is unavailable and grants no reward', async () => {
  const ads = new RewardAds(), h = handlers();
  assert.equal(await ads.available('extra'), false);
  assert.equal(await ads.request('extra', 1, h), 'unavailable');
  assert.equal(h.counts.reward, 0);
});
for (const outcome of ['completed', 'dismissed', 'unavailable', 'error']) {
  test(`provider ${outcome}: correct reward, pause and resume`, async () => {
    const ads = new RewardAds({ isAvailable: async () => true, show: async c => {
      c.onStart(); c.onStart(); c.onEnd(); c.onEnd(); return outcome;
    } });
    const h = handlers();
    assert.equal(await ads.request('extra', 12, h), outcome);
    assert.equal(h.counts.reward, outcome === 'completed' ? 1 : 0);
    assert.equal(h.counts.start, 1); assert.equal(h.counts.end, 1);
  });
}
test('double clicks do not request a second ad; stale rounds receive no reward', async () => {
  let resolveAd, context, calls = 0;
  const ads = new RewardAds({ isAvailable: async () => true, show: c => {
    calls++; context = c; c.onStart(); return new Promise(resolve => { resolveAd = resolve; });
  } });
  const h = handlers();
  const first = ads.request('revive', 4, h);
  await sleep(0);
  assert.equal(await ads.request('revive', 4, h), 'error');
  h.counts.current = false;
  context.onEnd(); resolveAd('completed');
  assert.equal(await first, 'error');
  assert.equal(calls, 1); assert.equal(h.counts.reward, 0); assert.equal(h.counts.end, 0);
});
test('a result received before close cannot reward or resume underneath a visible ad', async () => {
  let context;
  const ads = new RewardAds({ isAvailable: async () => true, show: async c => {
    context = c; c.onStart(); return 'completed';
  } }, 10);
  const h = handlers(), pending = ads.request('extra', 1, h);
  await sleep(25);
  assert.equal(h.counts.reward, 0); assert.equal(h.counts.end, 0);
  context.onEnd();
  assert.equal(await pending, 'completed'); assert.equal(h.counts.reward, 1);
});
test('availability errors, hangs and pre-display timeouts restore control', async () => {
  for (const provider of [
    { isAvailable: async () => { throw Error('network'); } },
    { isAvailable: () => new Promise(() => {}) },
    { isAvailable: async () => true, show: () => new Promise(() => {}) },
  ]) {
    const ads = new RewardAds(provider, 10), h = handlers();
    assert.equal(await ads.request('extra', 1, h), 'error');
    assert.equal(h.counts.end, 1); assert.equal(h.counts.reward, 0);
    assert.equal(ads.pending, null);
  }
});
test('late provider callbacks after loading timeout cannot start an ad or grant', async () => {
  let ctx;
  const ads = new RewardAds({ isAvailable: async () => true, show: c => {
    ctx = c; return new Promise(() => {});
  } }, 10);
  const h = handlers();
  assert.equal(await ads.request('extra', 1, h), 'error');
  assert.equal(ctx.signal.aborted, true); assert.equal(ctx.onStart(), false);
  assert.equal(h.counts.reward, 0);
});
test('fabricated completion without an actual start/end pair is rejected', async () => {
  const ads = new RewardAds({ isAvailable: async () => true, show: async () => 'completed' });
  const h = handlers(); assert.equal(await ads.request('extra', 1, h), 'error');
  assert.equal(h.counts.reward, 0);
});
test('simulator requires both localhost and an explicit query flag', () => {
  assert.equal(isLocalTest({ hostname: 'localhost', search: '?adTest=1' }), true);
  assert.equal(isLocalTest({ hostname: '127.0.0.1', search: '' }), false);
  assert.equal(isLocalTest({ hostname: 'game.example', search: '?adTest=1' }), false);
});
