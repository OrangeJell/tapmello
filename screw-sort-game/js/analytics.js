// Shared collector: loaded by site pages and the standalone game. Iframes
// report state to their parent and never initialize a second Google tag.
(() => {
  if (window.parent !== window || window.tapmeloAnalytics) return;
  const measurementId = 'G-NYFN8XFXL3';
  const optOutKey = 'tapmelo.analytics.disabled';
  let disabled = false;
  try { disabled = localStorage.getItem(optOutKey) === '1'; } catch { /* Optional browser preference. */ }
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('analytics-toggle');
    if (!button) return;
    button.textContent = disabled ? 'Enable analytics on this browser' : 'Disable analytics on this browser';
    document.getElementById('analytics-preference').textContent = disabled ? 'Analytics is disabled on this browser.' : 'Analytics is enabled on this browser.';
    button.addEventListener('click', () => {
      try {
        localStorage.setItem(optOutKey, disabled ? '0' : '1');
        window[`ga-disable-${measurementId}`] = !disabled;
        location.reload();
      } catch {
        document.getElementById('analytics-preference').textContent = 'Your browser could not save this preference. You can use the Google Analytics opt-out browser add-on linked below.';
      }
    });
  });
  if (disabled) { window[`ga-disable-${measurementId}`] = true; return; }
  let fallbackId = 0;
  const uuid = () => {
    try {
      if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    } catch { /* Optional browser API; measurement must not block play. */ }
    return `${Date.now().toString(36)}-${++fallbackId}-${Math.random().toString(36).slice(2)}`;
  };
  const now = () => performance.now();
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const query = new URLSearchParams(location.search);
  const qa = local || query.get('utm_source') === 'qa';
  const standalone = document.currentScript?.src.includes('/js/analytics.js');
  const gamePage = standalone || /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?screw-sort\/?$/.test(location.pathname) || /^\/play\/screw-sort\//.test(location.pathname);

  function cleanUrl(value) {
    try {
      const url = new URL(value);
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) {
        if (!/^(utm_(source|medium|campaign|content|term|id)|gclid|gbraid|wbraid)$/.test(key)) url.searchParams.delete(key);
      }
      return url.href;
    } catch { return ''; }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const common = {
    measurement_session_id: uuid(), measurement_model: 'direct',
    analytics_version: 'direct-v1', site_version: '2026-10-06',
    page_type: gamePage ? (standalone ? 'standalone_game' : 'embedded_game') : 'site',
    traffic_category: qa ? 'qa' : 'live',
    ...(gamePage ? { game_id: 'screw_sort', game_version: 'glass-2026-10-08' } : {}),
    ...(qa ? { debug_mode: true } : {}),
  };
  function send(name, fields = {}) {
    window.gtag('event', name, { ...common, ...fields, event_id: uuid() });
  }
  const pageLocation = cleanUrl(location.href);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: pageLocation, page_referrer: cleanUrl(document.referrer),
  });
  send('page_view', { page_location: pageLocation, page_title: document.title });
  // Local QA exercises the same dataLayer without sending visits to Google.
  if (!local) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(tag);
  }

  let available = false, suspended = false, visible = !document.hidden, lastTick = now(), arrivalMs = 0;
  let arrivalSent = false, effectiveSent = false, shortWinner = null;
  let load = null, instance = null, lastSequence = 0, round = null;
  const retiredInstances = new Set();
  const foreground = () => visible && !suspended;
  const roundFields = value => ({
    round_id: value.id, level_number: value.level, game_language: value.language,
    action_count: value.actions, active_play_ms: Math.round(value.activeMs),
  });
  function maybeEffective() {
    if (!arrivalSent || effectiveSent) return;
    const candidate = shortWinner || (round?.activeMs >= 30000 && round.actions >= 2 ? round : null);
    if (!candidate) return;
    effectiveSent = true;
    send('effective_play', {
      ...roundFields(candidate), qualification: shortWinner ? 'short_win' : 'active_30s',
    });
  }
  function tick() {
    const time = now();
    if (foreground()) {
      if (available) arrivalMs += Math.max(0, time - lastTick);
      // Count play only within 15 seconds of an accepted move. Pause, ads,
      // background tabs, and idle time after that window contribute nothing.
      if (round?.phase === 'playing' && round.lastAction !== null && !round.ended) {
        round.activeMs += Math.max(0, Math.min(time, round.lastAction + 15000) - Math.max(lastTick, round.lastAction));
      }
    }
    lastTick = time;
    if (!arrivalSent && arrivalMs >= 10000) {
      arrivalSent = true;
      send('valid_arrival', { foreground_ready_ms: Math.round(arrivalMs) });
    }
    maybeEffective();
  }
  function loadStart() {
    tick();
    if (instance) retiredInstances.add(instance);
    instance = null; lastSequence = 0; available = false; round = null;
    load = { id: uuid(), start: now(), finished: false, ready: false };
    send('game_load_start', { load_id: load.id });
  }
  function loadError(reason = 'initialization_error') {
    tick();
    if (!load || load.finished) return;
    load.finished = true; available = false;
    const code = ['timeout', 'asset_error', 'runtime_error', 'initialization_error'].includes(reason) ? reason : 'initialization_error';
    send('game_load_error', { load_id: load.id, error_code: code });
  }
  function setAvailable(value) { tick(); available = !!value; }
  function game(data) {
    if (!gamePage || !data || typeof data !== 'object') return;
    const id = data.instance_id;
    if (typeof id !== 'string' || !/^[\w-]{1,96}$/.test(id) || retiredInstances.has(id) ||
        !Number.isSafeInteger(data.sequence) || data.sequence < 1) return;
    if (!['ready', 'start', 'move', 'phase', 'jam', 'end', 'restart'].includes(data.kind)) return;
    if (data.kind === 'ready') {
      if (instance && instance !== id) return;
      instance = id;
    }
    if (id !== instance || data.sequence <= lastSequence) return;
    if (['ready', 'start'].includes(data.kind) &&
        (!Number.isInteger(data.level_number) || data.level_number < 1 || data.level_number > 2 || !['zh', 'en', 'hi'].includes(data.game_language))) return;
    if (data.kind === 'start' && (typeof data.round_id !== 'string' || !/^[\w-]{1,96}$/.test(data.round_id) ||
        !['initial', 'restart', 'next_level', 'level_select'].includes(data.start_reason))) return;
    if (!['ready', 'start'].includes(data.kind) && (!round || round.id !== data.round_id)) return;
    if (data.kind === 'phase' && !['ready', 'playing', 'paused', 'ad', 'won', 'jammed'].includes(data.phase)) return;
    if (data.kind === 'end' && (!['won', 'abandoned'].includes(data.outcome) ||
        !['completed', 'restart', 'level_select'].includes(data.end_reason))) return;
    lastSequence = data.sequence;
    tick();
    if (data.kind === 'ready') {
      if (load && !load.finished) {
        load.finished = true;
        send('game_loaded', { load_id: load.id, load_time_ms: Math.round(now() - load.start),
          level_number: data.level_number, game_language: data.game_language });
      } else if (load && !load.ready) {
        send('game_ready_snapshot', { load_id: load.id, snapshot_reason: 'ready_after_error' });
      }
      if (load) load.ready = true;
      if (standalone) available = true;
    } else if (data.kind === 'start') {
      if (round?.id === data.round_id) return;
      round = { id: data.round_id, level: data.level_number, language: data.game_language,
        start: now(), phase: 'playing', actions: 0, lastAction: null, activeMs: 0, ended: false, jammed: false, restarted: false };
      send('game_start', { ...roundFields(round), start_reason: data.start_reason });
    } else if (data.kind === 'move' && !round.ended) {
      round.actions++; round.lastAction = now();
    } else if (data.kind === 'phase') {
      round.phase = data.phase;
      if (data.phase !== 'playing') round.lastAction = null;
    } else if (data.kind === 'jam' && !round.ended && !round.jammed) {
      round.jammed = true;
      send('game_jam', roundFields(round));
    } else if (data.kind === 'restart' && !round.restarted) {
      round.restarted = true;
      send('game_restart', roundFields(round));
    } else if (data.kind === 'end' && !round.ended) {
      round.ended = true;
      send('game_end', { ...roundFields(round), outcome: data.outcome, end_reason: data.end_reason,
        round_elapsed_ms: Math.round(now() - round.start) });
      if (data.outcome === 'won' && round.actions > 0) shortWinner ||= round;
      maybeEffective();
    }
  }
  function retention(name, fields = {}) {
    if (!['save_prompt_view', 'save_action', 'save_dismiss', 'save_confirmed', 'app_installed', 'app_launch'].includes(name)) return;
    if (!fields || typeof fields !== 'object') return;
    send(name, {
      source: ['site', 'pause', 'win'].includes(fields.source) ? fields.source : 'site',
      action: ['open', 'copy', 'install', 'close', 'skip', 'next', 'install_cancel', 'install_error', 'self_report'].includes(fields.action) ? fields.action : 'none',
      game_language: fields.language === 'hi' ? 'hi' : 'en',
    });
  }
  window.tapmeloAnalytics = { game, loadStart, loadError, setAvailable, retention };
  if (gamePage) {
    loadStart();
    let timer = setInterval(tick, 500);
    document.addEventListener('visibilitychange', () => {
      tick(); visible = !document.hidden; lastTick = now();
      if (!visible && round) round.lastAction = null;
    });
    window.addEventListener('pagehide', () => { tick(); suspended = true; clearInterval(timer); });
    window.addEventListener('pageshow', () => {
      suspended = false; visible = !document.hidden; lastTick = now(); clearInterval(timer); timer = setInterval(tick, 500);
    });
  }
})();
