export const ACTIVE_TIME_KEY = 'tapmelo.returnVisit.activeMs';
export const REMINDER_THRESHOLD_MS = 120000;

// Independent of analytics: only successful moves extend the active window.
export class ReturnVisitTracker {
  constructor({ storage, now = () => performance.now() } = {}) {
    this.storage = storage;
    this.now = now;
    this.totalMs = 0;
    try {
      const saved = Number(storage?.getItem(ACTIVE_TIME_KEY));
      if (Number.isFinite(saved) && saved >= 0) this.totalMs = Math.min(saved, REMINDER_THRESHOLD_MS);
    } catch { /* Storage is optional. */ }
    this.lastTick = now();
    this.lastMove = null;
    this.playing = false;
    this.visible = true;
    this.suspended = false;
  }

  tick() {
    const time = this.now();
    if (this.playing && this.visible && !this.suspended && this.lastMove !== null) {
      this.totalMs = Math.min(REMINDER_THRESHOLD_MS, this.totalMs + Math.max(0,
        Math.min(time, this.lastMove + 15000) - Math.max(this.lastTick, this.lastMove)));
    }
    this.lastTick = time;
    try { this.storage?.setItem(ACTIVE_TIME_KEY, String(this.totalMs)); } catch { /* Keep counting in memory. */ }
    return this.totalMs;
  }

  phase(value) {
    this.tick();
    this.playing = value === 'playing';
    if (!this.playing) this.lastMove = null;
  }

  move() {
    this.tick();
    if (this.playing && this.visible && !this.suspended) this.lastMove = this.now();
  }

  visibility(visible) {
    this.tick();
    this.visible = visible;
    this.lastMove = null;
  }

  suspend(value) {
    this.tick();
    this.suspended = value;
    this.lastMove = null;
  }

  eligible() { return this.tick() >= REMINDER_THRESHOLD_MS; }
}
