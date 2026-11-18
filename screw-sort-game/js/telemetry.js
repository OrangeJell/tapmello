// The bridge contains only ephemeral game state; no Google tag or persistent ID.
let fallbackId = 0;
function uuid() {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch { /* Optional browser API; measurement must not block play. */ }
  // These IDs only deduplicate this page's events; they are not security tokens.
  return `${Date.now().toString(36)}-${++fallbackId}-${Math.random().toString(36).slice(2)}`;
}
const instance = uuid();
let sequence = 0, current = null, readyDetails = null;
function report(kind, fields = {}) {
  const message = { kind, instance_id: instance, sequence: ++sequence, ...fields };
  if (window.screwSortEmbedSend) window.screwSortEmbedSend('analytics', { telemetry: message });
  else window.tapmeloAnalytics?.game(message);
}
export const telemetry = {
  ready(level, language) {
    readyDetails = { level_number: level, game_language: language };
    report('ready', readyDetails);
  },
  snapshot() { if (readyDetails) report('ready', readyDetails); },
  start(level, language, reason) {
    current = { round_id: uuid(), ended: false };
    report('start', { round_id: current.round_id, level_number: level, game_language: language, start_reason: reason });
  },
  phase(phase) { if (current) report('phase', { round_id: current.round_id, phase }); },
  move() { if (current && !current.ended) report('move', { round_id: current.round_id }); },
  jam() { if (current && !current.ended) report('jam', { round_id: current.round_id }); },
  restart() { if (current) report('restart', { round_id: current.round_id }); },
  end(outcome, reason) {
    if (!current || current.ended) return;
    current.ended = true;
    report('end', { round_id: current.round_id, outcome, end_reason: reason });
  },
};
