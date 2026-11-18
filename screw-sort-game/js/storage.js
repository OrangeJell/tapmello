import { LEVELS } from './levels.js';
import { createState, transition, continuation } from './engine.js';
import { LANGUAGES } from './i18n.js';
export const STORAGE_KEY = 'screw-sort.glass.v1';
const SESSION_KEY = `${STORAGE_KEY}.round`;
const languages = Object.keys(LANGUAGES);
export function loadProgress(storage) {
  const defaults = { unlocked: 1, completed: [], lang: 'en', sound: true, vibration: false };
  try {
    const raw = storage.getItem(STORAGE_KEY), value = JSON.parse(raw || storage.getItem('screw-sort.v1'));
    if (!value || typeof value !== 'object') return defaults;
    const completed = raw && Array.isArray(value.completed) ? [...new Set(value.completed.filter(id => LEVELS.some(l => l.id === id)))] : [];
    const savedUnlocked = raw && Number.isInteger(value.unlocked) ? Math.max(1, value.unlocked) : 1;
    return { ...defaults,
      completed,
      unlocked: Math.min(LEVELS.length, Math.max(savedUnlocked, ...completed.map(id => id + 1))),
      lang: languages.includes(value.lang) ? value.lang : defaults.lang,
      sound: value.sound !== false, vibration: value.vibration === true,
    };
  } catch { return defaults; }
}
export function saveProgress(storage, value) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
export function recordCompletion(progress, id) {
  if (!LEVELS.some(l => l.id === id)) return progress;
  return { ...progress, completed: [...new Set([...progress.completed, id])], unlocked: Math.min(LEVELS.length, Math.max(progress.unlocked, id + 1)) };
}
export function saveSession(storage, level, initialBoxes, actions) {
  try { storage.setItem(SESSION_KEY, JSON.stringify({ levelId: level.id, version: level.version, initialBoxes, actions })); return true; }
  catch { return false; }
}
export function clearSession(storage) { try { storage.removeItem(SESSION_KEY); } catch { /* Storage is optional. */ } }
export function loadSession(storage) {
  try {
    const saved = JSON.parse(storage.getItem(SESSION_KEY));
    const level = LEVELS.find(l => l.id === saved?.levelId && l.version === saved.version);
    if (!level || ![2, 3, 4].includes(saved.initialBoxes) || !Array.isArray(saved.actions) || saved.actions.length > level.boards.reduce((n,b)=>n+b.screws.length,0)+40) return null;
    let state = createState(level, { openBoxes: saved.initialBoxes });
    for (const action of saved.actions) {
      // An old fifth-box reward must not replay as a slot reward under the new rules.
      if (action?.type === 'continue' && !action.reward && continuation(state) === 'extra') return null;
      const result = transition(level, state, action);
      if (!result.accepted) return null;
      state = result.state;
    }
    if (state.status === 'won') return null;
    return { level, state, actions: saved.actions };
  } catch { return null; }
}
