import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { ReturnVisitTracker, ACTIVE_TIME_KEY } from '../js/return-visit-tracker.js';

function clockTracker(saved, broken = false) {
  let time = 0;
  const values = new Map(saved === undefined ? [] : [[ACTIVE_TIME_KEY, saved]]);
  const storage = {
    getItem(key) { if (broken) throw Error('blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (broken) throw Error('blocked'); values.set(key, value); },
  };
  const tracker = new ReturnVisitTracker({ storage, now: () => time });
  return { tracker, storage, values, advance(ms) { time += ms; tracker.tick(); } };
}

test('reminder requires two minutes of accepted-move activity across rounds, not elapsed time', () => {
  const h = clockTracker(); h.tracker.phase('playing');
  h.advance(120000); assert.equal(h.tracker.totalMs, 0);
  h.tracker.move(); h.advance(60000); assert.equal(h.tracker.totalMs, 15000);
  for (let round = 0; round < 7; round++) {
    h.tracker.phase('won'); h.advance(20000); h.tracker.phase('playing');
    h.tracker.move(); h.advance(round === 6 ? 14999 : 15000);
  }
  assert.equal(h.tracker.eligible(), false);
  h.advance(1); assert.equal(h.tracker.eligible(), true);
  assert.equal(Number(h.values.get(ACTIVE_TIME_KEY)), 120000);
});

test('pause, ads, background, bfcache suspension and stale input windows contribute no time', () => {
  const h = clockTracker(); h.tracker.phase('playing'); h.tracker.move(); h.advance(5000);
  for (const phase of ['paused', 'ad', 'won', 'ready']) {
    h.tracker.phase(phase); h.advance(60000); h.tracker.move();
  }
  h.tracker.phase('playing'); h.advance(60000);
  h.tracker.move(); h.advance(3000); h.tracker.visibility(false); h.advance(60000);
  h.tracker.visibility(true); h.advance(60000);
  h.tracker.move(); h.advance(2000); h.tracker.suspend(true); h.advance(60000);
  h.tracker.suspend(false); h.advance(60000);
  assert.equal(h.tracker.totalMs, 10000);
});

test('refresh restores progress; corrupt or unavailable session storage never blocks play', () => {
  const h = clockTracker(); h.tracker.phase('playing'); h.tracker.move(); h.advance(9000);
  const restored = new ReturnVisitTracker({ storage: h.storage, now: () => 0 });
  assert.equal(restored.totalMs, 9000);
  for (const saved of ['garbage', '-1', 'Infinity']) assert.equal(clockTracker(saved).tracker.totalMs, 0);
  const broken = clockTracker(undefined, true);
  broken.tracker.phase('playing'); broken.tracker.move(); broken.advance(60000);
  assert.equal(broken.tracker.totalMs, 15000);
});

const source = readFileSync(new URL('../js/return-visit.js', import.meta.url), 'utf8');
function controller({ saved, broken = false, embedded = false, standalone = false, analytics = true } = {}) {
  let time = 1000000;
  const listeners = new Map(), events = [], messages = [];
  const on = (type, fn) => { const callbacks = listeners.get(type) || []; callbacks.push(fn); listeners.set(type, callbacks); };
  const values = new Map(saved ? [['tapmelo.returnVisit.v1', JSON.stringify(saved)]] : []);
  const parent = { postMessage: data => messages.push(data) };
  const window = { addEventListener: on, matchMedia: () => ({ matches: standalone, addEventListener() {} }) };
  window.parent = embedded ? parent : window;
  if (analytics) window.tapmeloAnalytics = { retention: (name, fields) => events.push({ name, fields }) };
  const document = { documentElement: { lang: 'en' }, addEventListener: on, getElementById: () => null, querySelectorAll: () => [] };
  vm.runInNewContext(source, { window, document, navigator: { userAgent: '', standalone: false }, URL, URLSearchParams,
    location: { origin: 'https://tapmelo.com', pathname: '/screw-sort' },
    Date: class extends Date { static now() { return time; } },
    localStorage: {
      getItem(key) { if (broken) throw Error('blocked'); return values.get(key) ?? null; },
      setItem(key, value) { if (broken) throw Error('blocked'); values.set(key, value); },
    },
  });
  return { api: window.tapmeloReturnVisit, window, parent, values, events, messages,
    advance(ms) { time += ms; }, dispatch(type, event = {}) { (listeners.get(type) || []).forEach(fn => fn(event)); } };
}

test('cooldown lasts ten minutes, survives refresh, and works with unavailable analytics or storage', () => {
  for (const options of [{}, { analytics: false }, { broken: true }]) {
    const h = controller(options); assert.equal(h.api.canRemind(), true);
    h.api.snooze('next', { source: 'win', language: 'hi' });
    assert.equal(h.api.canRemind(), false);
    h.advance(599999); assert.equal(h.api.canRemind(), false);
    h.advance(1); assert.equal(h.api.canRemind(), true);
    if (!options.broken) {
      const saved = JSON.parse(h.values.get('tapmelo.returnVisit.v1'));
      assert.equal(controller({ saved }).api.canRemind(), false);
    }
    if (options.analytics !== false) assert.equal(h.events[0].fields.language, 'hi');
  }
});

test('self report, installation and standalone launch suppress reminders independently of cooldown', () => {
  for (const options of [{ saved: { confirmed: true } }, { saved: { installed: true } }, { standalone: true }]) {
    const h = controller(options); h.advance(6000000); assert.equal(h.api.canRemind(), false);
  }
  const h = controller(); h.dispatch('appinstalled');
  assert.equal(h.api.canRemind(), false);
  assert.equal(h.events.filter(e => e.name === 'app_installed').length, 1);
  const started = controller({ standalone: true }); started.dispatch('DOMContentLoaded');
  assert.equal(started.events.filter(e => e.name === 'app_launch').length, 1);
});

test('cross-tab preference updates and clearing storage update the current policy', () => {
  const h = controller();
  h.values.set('tapmelo.returnVisit.v1', JSON.stringify({ confirmed: true }));
  h.dispatch('storage', { key: 'tapmelo.returnVisit.v1', newValue: h.values.get('tapmelo.returnVisit.v1') });
  assert.equal(h.api.canRemind(), false);
  h.values.clear(); h.dispatch('storage', { key: null, newValue: null });
  assert.equal(h.api.canRemind(), true);
});

test('embedded proxy fails closed until a valid same-origin parent state arrives', () => {
  const h = controller({ embedded: true });
  assert.equal(h.api.canRemind(), false); assert.equal(h.messages[0].action, 'hello');
  const event = { origin: 'https://tapmelo.com', source: h.parent, data: {
    scope: 'tapmelo:screw-sort', type: 'return_visit_state',
    state: { cooldownUntil: 0, confirmed: false, installed: false }, open: false,
  } };
  h.dispatch('message', { ...event, origin: 'https://other.example' });
  h.dispatch('message', { ...event, source: {} });
  assert.equal(h.api.canRemind(), false);
  h.dispatch('message', event); assert.equal(h.api.canRemind(), true);
  h.api.open({ source: 'win', language: 'hi' }); assert.equal(h.messages.at(-1).language, 'hi');
  h.api.snooze('skip'); assert.equal(h.api.canRemind(), false);
});
