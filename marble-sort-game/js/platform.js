export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const createCanvas = () => document.createElement('canvas');

export const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem('marble-sort.' + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('marble-sort.' + key, JSON.stringify(value));
    } catch {
      // The current session still works when storage is unavailable.
    }
  }
};

export function image(src) {
  return new Promise((resolve, reject) => {
    const asset = new Image();
    const timeout = setTimeout(() => reject(new Error('Asset loading timed out')), 3500);
    asset.onload = () => { clearTimeout(timeout); resolve(asset); };
    asset.onerror = () => { clearTimeout(timeout); reject(new Error('Asset unavailable')); };
    asset.src = src;
  });
}
