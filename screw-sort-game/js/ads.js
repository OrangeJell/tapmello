export const disabledProvider = {
  isAvailable: async () => false,
  show: async () => 'unavailable',
};

export function isLocalTest(location) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
    new URLSearchParams(location.search).get('adTest') === '1';
}

/** Providers resolve show() only when their ad has closed. onStart/onEnd are
 * lifecycle signals, not reward signals. Only a completed result grants a reward.
 * A provider must honor signal before showing and check onStart() !== false. */
export class RewardAds {
  constructor(provider = disabledProvider, loadingTimeout = 8000) {
    this.provider = provider;
    this.loadingTimeout = loadingTimeout;
    this.pending = null;
    this.sequence = 0;
    this.granted = new Set();
  }
  async available(placement) {
    let timer;
    try {
      return !!await Promise.race([
        this.provider.isAvailable(placement),
        new Promise(resolve => { timer = setTimeout(() => resolve(false), this.loadingTimeout); }),
      ]);
    } catch { return false; }
    finally { clearTimeout(timer); }
  }
  async request(placement, roundId, handlers) {
    if (this.pending) return 'error';
    const attempt = { id: `${roundId}:${++this.sequence}`, roundId, started: false, ended: false };
    this.pending = attempt;
    const controller = new AbortController();
    let timer, close;
    const closed = new Promise(resolve => { close = resolve; });
    try {
      const operation = (async () => {
        if (!await this.provider.isAvailable(placement) || controller.signal.aborted) return 'unavailable';
        return this.provider.show({ placement, requestId: attempt.id, signal: controller.signal,
          onStart: () => {
            if (controller.signal.aborted || this.pending !== attempt || !handlers.isCurrent(roundId)) return false;
            if (attempt.started) return true;
            attempt.started = true;
            clearTimeout(timer);
            handlers.onStart?.();
            return true;
          },
          onEnd: () => {
            if (!attempt.started || attempt.ended) return;
            attempt.ended = true;
            close();
          },
        });
      })();
      let result = await Promise.race([operation,
        new Promise(resolve => { timer = setTimeout(() => {
          controller.abort(); resolve('error');
        }, this.loadingTimeout); }),
      ]);
      // Once an ad is visible, only its close signal may resume the game.
      if (attempt.started && !attempt.ended) await closed;
      if (!['completed', 'dismissed', 'unavailable', 'error'].includes(result)) result = 'error';
      if (result === 'completed' && attempt.started && attempt.ended &&
          handlers.isCurrent(roundId) && !this.granted.has(attempt.id)) {
        this.granted.add(attempt.id);
        handlers.onReward(placement, attempt.id);
      } else if (result === 'completed') result = 'error';
      return result;
    } catch { return 'error'; }
    finally {
      clearTimeout(timer);
      controller.abort();
      if (attempt.started && !attempt.ended) await closed;
      if (this.pending === attempt) this.pending = null;
      if (handlers.isCurrent(roundId)) handlers.onEnd?.();
    }
  }
}

export function createTestProvider(renderTest) {
  return {
    isAvailable: async () => true,
    show: async context => {
      if (context.signal.aborted || context.onStart() === false) return 'error';
      try { return await renderTest(context); }
      finally { context.onEnd(); }
    },
  };
}
