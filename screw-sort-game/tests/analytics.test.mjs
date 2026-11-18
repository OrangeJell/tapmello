import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const source = readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8');
function harness({ embedded = false, hostname = '127.0.0.1', disabled = false, pathname = '/play/screw-sort/', search = '', scriptSrc = 'https://tapmelo.com/js/analytics.js', cryptoAPI = { randomUUID } } = {}) {
  let time = 0, sequence = 0;
  const timers = new Map(), listeners = new Map(), tags = [];
  const listen = (type, callback) => {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(callback);
  };
  const window = { addEventListener: listen };
  window.parent = embedded ? {} : window;
  const document = { hidden: false, title: 'Screw Sort', referrer: '',
    currentScript: { src: scriptSrc },
    head: { append: tag => tags.push(tag) }, createElement: () => ({}),
    addEventListener: listen, getElementById: () => null };
  const location = { hostname, pathname, search, href: `https://${hostname}${pathname}${search}` };
  const storage = new Map(disabled ? [['tapmelo.analytics.disabled', '1']] : []);
  vm.runInNewContext(source, { window, document, location,
    crypto: cryptoAPI, URL, URLSearchParams, Date, Math,
    localStorage: { getItem: key => storage.get(key) || null },
    performance: { now: () => time },
    setInterval: callback => { const id = randomUUID(); timers.set(id, callback); return id; },
    clearInterval: id => timers.delete(id),
  });
  const api = window.tapmeloAnalytics;
  const instance = randomUUID(), round = randomUUID();
  const data = (kind, fields = {}) => ({ instance_id: instance, sequence: ++sequence, kind,
    round_id: round, level_number: 1, game_language: 'en', ...fields });
  const game = (kind, fields) => api.game(data(kind, fields));
  return { window, tags, api, game, data, document,
    events: name => (window.dataLayer || []).filter(args => args[0] === 'event' && (!name || args[1] === name)).map(args => ({ name: args[1], fields: args[2] })),
    advance(ms) { time += ms; [...timers.values()].forEach(callback => callback()); },
    dispatch(type) { (listeners.get(type) || []).forEach(callback => callback()); },
    ready() { game('ready'); api.setAvailable(true); },
    start() { game('start', { start_reason: 'initial' }); },
  };
}

test('direct initialization has one manual page view; local QA sends no Google request', () => {
  const h = harness({ search: '?utm_source=qa&email=secret@example.com&previewLevel=1' });
  assert.equal(h.tags.length, 0);
  assert.equal(h.events('page_view').length, 1);
  assert.equal(h.events('page_view')[0].fields.traffic_category, 'qa');
  assert.equal(h.events('page_view')[0].fields.page_location, 'https://127.0.0.1/play/screw-sort/?utm_source=qa');
  const config = h.window.dataLayer.find(args => args[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(h.events('game_load_start').length, 1);
  const prod = harness({ hostname: 'tapmelo.com' });
  assert.equal(prod.tags.length, 1);
  assert.equal(prod.events('page_view')[0].fields.traffic_category, 'live');
});

test('Hindi landing page measures game loading and effective play; Hindi home stays a site page', () => {
  const scriptSrc = 'https://tapmelo.com/assets/analytics.js';
  const home = harness({ pathname: '/hi/', scriptSrc });
  assert.equal(home.events('page_view')[0].fields.page_type, 'site');
  assert.equal(home.events('game_load_start').length, 0);
  const h = harness({ pathname: '/hi/games/screw-sort/', scriptSrc });
  assert.equal(h.events('page_view')[0].fields.page_type, 'embedded_game');
  assert.equal(h.events('game_load_start').length, 1);
  h.game('ready', { game_language: 'hi' }); h.api.setAvailable(true);
  h.game('start', { start_reason: 'initial', game_language: 'hi' });
  h.game('move'); h.game('end', { outcome: 'won', end_reason: 'completed' });
  h.advance(10000);
  assert.equal(h.events('game_loaded').length, 1);
  assert.equal(h.events('game_start')[0].fields.game_language, 'hi');
  assert.equal(h.events('valid_arrival').length, 1);
  assert.equal(h.events('effective_play').length, 1);
});

test('return-visit metrics distinguish self-report from installation and sanitize event fields', () => {
  const h = harness();
  h.api.retention('save_confirmed', { source: 'win', action: 'self_report', language: 'hi', email: 'secret' });
  assert.equal(h.events('save_confirmed').length, 1);
  assert.equal(h.events('app_installed').length, 0);
  assert.equal(h.events('save_confirmed')[0].fields.game_language, 'hi');
  assert.equal(h.events('save_confirmed')[0].fields.email, undefined);
  h.api.retention('app_installed', { source: 'unsafe', language: 'invalid' });
  assert.equal(h.events('app_installed')[0].fields.source, 'site');
  h.api.retention('unknown_event', {});
  assert.equal(h.events('unknown_event').length, 0);
});

test('missing or restricted crypto APIs preserve measurement and distinct event IDs', () => {
  for (const cryptoAPI of [null, {}, { randomUUID() { throw new Error('API restricted'); } }]) {
    const h = harness({ cryptoAPI });
    h.ready(); h.start(); h.game('move'); h.game('end', { outcome: 'won', end_reason: 'completed' });
    assert.equal(h.events('page_view').length, 1);
    assert.equal(h.events('game_loaded').length, 1);
    assert.equal(h.events('game_end').length, 1);
    const ids = h.events().map(event => event.fields.event_id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[\w-]{1,96}$/);
  }
});

test('embedded iframe and browser opt-out initialize no analytics tag or event queue', () => {
  for (const options of [{ embedded: true }, { hostname: 'tapmelo.com', disabled: true }]) {
    const h = harness(options);
    assert.equal(h.tags.length, 0);
    assert.equal(h.events().length, 0);
    assert.equal(h.api, undefined);
  }
});

test('short win waits for 10 seconds of visible availability; emits once per page', () => {
  const h = harness(); h.ready(); h.start();
  h.game('move'); h.advance(1000); h.game('end', { outcome: 'won', end_reason: 'completed' });
  assert.equal(h.events('effective_play').length, 0);
  h.advance(9000);
  assert.equal(h.events('valid_arrival').length, 1);
  assert.equal(h.events('effective_play').length, 1);
  assert.equal(h.events('effective_play')[0].fields.qualification, 'short_win');
  h.advance(10000); h.game('end', { outcome: 'won', end_reason: 'completed' });
  assert.equal(h.events('effective_play').length, 1);
  assert.equal(h.events('game_end').length, 1);
});

test('active play excludes idle, paused and hidden time and requires two accepted moves', () => {
  const h = harness(); h.ready(); h.start(); h.game('move');
  h.advance(60000); // Only the first 15 seconds following input count.
  assert.equal(h.events('effective_play').length, 0);
  h.game('phase', { phase: 'paused' }); h.advance(60000);
  h.game('phase', { phase: 'playing' }); h.game('move');
  h.advance(5000); h.document.hidden = true; h.dispatch('visibilitychange');
  h.advance(60000); h.document.hidden = false; h.dispatch('visibilitychange');
  assert.equal(h.events('effective_play').length, 0);
  h.game('move'); h.advance(10000);
  assert.equal(h.events('effective_play').length, 1);
  assert.equal(h.events('effective_play')[0].fields.active_play_ms, 30000);
  assert.equal(h.events('effective_play')[0].fields.action_count, 3);
});

test('arrival excludes background and bfcache suspension; bfcache restores do not add page views', () => {
  const h = harness(); h.ready(); h.advance(4000);
  h.document.hidden = true; h.dispatch('visibilitychange'); h.advance(60000);
  h.document.hidden = false; h.dispatch('visibilitychange'); h.advance(2000);
  h.dispatch('pagehide'); h.advance(60000); h.dispatch('pageshow'); h.advance(4000);
  assert.equal(h.events('valid_arrival').length, 1);
  assert.equal(h.events('valid_arrival')[0].fields.foreground_ready_ms, 10000);
  assert.equal(h.events('page_view').length, 1);
});

test('duplicate messages, invalid payloads and repeated jams do not inflate event counts', () => {
  const h = harness(); h.ready();
  const start = h.data('start', { start_reason: 'initial' });
  h.api.game(start); h.api.game(start);
  h.game('start', { start_reason: 'invalid', round_id: randomUUID() });
  h.game('jam'); h.game('jam'); h.game('restart'); h.game('restart');
  h.game('end', { outcome: 'abandoned', end_reason: 'restart' });
  h.game('end', { outcome: 'abandoned', end_reason: 'restart' });
  assert.equal(h.events('game_start').length, 1);
  assert.equal(h.events('game_jam').length, 1);
  assert.equal(h.events('game_restart').length, 1);
  assert.equal(h.events('game_end').length, 1);
  assert.equal(h.events('game_end')[0].fields.outcome, 'abandoned');
});

test('load errors are sanitized; retry ignores stale iframe messages and recovers', () => {
  const h = harness();
  h.api.loadError('https://example.com/?email=secret'); h.api.loadError('timeout');
  assert.equal(h.events('game_load_error').length, 1);
  assert.equal(h.events('game_load_error')[0].fields.error_code, 'initialization_error');
  h.ready();
  assert.equal(h.events('game_loaded').length, 0);
  assert.equal(h.events('game_ready_snapshot').length, 1);
  h.api.loadStart(); h.game('ready'); // Old instance must not qualify a new load.
  assert.equal(h.events('game_loaded').length, 0);
  h.api.game({ instance_id: randomUUID(), sequence: 1, kind: 'ready', level_number: 1, game_language: 'en' });
  assert.equal(h.events('game_loaded').length, 1);
  assert.equal(h.events('game_load_start').length, 2);
});

test('final level loading and rounds accept one event each; levels beyond the catalogue are rejected',()=>{
 const h=harness();h.game('ready',{level_number:2});h.game('ready',{level_number:2});assert.equal(h.events('game_loaded').length,1);assert.equal(h.events('game_loaded')[0].fields.level_number,2);
 h.game('start',{level_number:2,start_reason:'initial'});h.game('start',{level_number:2,start_reason:'initial'});assert.equal(h.events('game_start').length,1);
 for (const level_number of [3, 4]) { const invalid=harness();invalid.game('ready',{level_number});assert.equal(invalid.events('game_loaded').length,0); }
});
