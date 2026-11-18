import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/telemetry.js', import.meta.url), 'utf8')
  .replace('export const telemetry =', 'globalThis.telemetry =');

test('telemetry initializes and starts distinct rounds without randomUUID or crypto', () => {
  for (const cryptoAPI of [undefined, {}, { randomUUID() { throw new Error('API restricted'); } }]) {
    const messages = [];
    // Freeze time and randomness to prove fallback IDs remain distinct.
    const context = vm.createContext({ crypto: cryptoAPI, Date: { now: () => 1234 }, Math: { random: () => 0.5 },
      window: { screwSortEmbedSend: (type, message) => messages.push(message.telemetry) } });
    vm.runInContext(source, context);
    context.telemetry.ready(1, 'en');
    context.telemetry.start(1, 'en', 'initial');
    context.telemetry.move();
    context.telemetry.end('won', 'completed');
    context.telemetry.end('won', 'completed');
    context.telemetry.start(2, 'en', 'next_level');
    assert.deepEqual(messages.map(message => message.kind), ['ready', 'start', 'move', 'end', 'start']);
    const rounds = messages.filter(message => message.kind === 'start').map(message => message.round_id);
    assert.notEqual(rounds[0], rounds[1]);
    assert.equal(new Set(messages.map(message => message.instance_id)).size, 1);
    for (const message of messages) assert.match(message.instance_id, /^[\w-]{1,96}$/);
    assert.deepEqual(messages.map(message => message.sequence), [1, 2, 3, 4, 5]);
  }
});
