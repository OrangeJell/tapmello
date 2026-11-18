import test from 'node:test';
import assert from 'node:assert/strict';
import { TapGate } from '../js/gestures.js';

test('only a short, uncancelled touch can remove a screw', () => {
  const gate = new TapGate();
  gate.begin(1, 100, 200);
  assert.equal(gate.end(1, 104, 205), true);

  gate.begin(2, 100, 200);
  gate.move(2, 100, 170);
  assert.equal(gate.end(2, 101, 200), false);

  gate.begin(3, 100, 200);
  assert.equal(gate.end(3, 125, 200), false);

  gate.begin(4, 100, 200);
  gate.cancel();
  assert.equal(gate.end(4, 100, 200), false);
});
