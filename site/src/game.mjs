import { LEVELS } from '../../screw-sort-game/js/levels.js';
import { RULES } from '../../screw-sort-game/js/config.js';
import { translate } from '../../screw-sort-game/js/i18n.js';

export const updated = '2026-10-09';
export const origin = 'https://tapmelo.com';
export const rules = RULES;
export const levels = LEVELS.map(level => ({
  id: level.id,
  name: lang => translate(lang, level.title),
  screws: level.boards.reduce((total, board) => total + board.screws.length, 0),
  layers: new Set(level.boards.map(board => board.layer)).size,
  colours: new Set(level.boards.flatMap(board => board.screws.map(screw => screw.color))).size,
}));

export function screenshot(name, lang) {
  return `/assets/guides/screw-sort-${name}${lang === 'hi' ? '-hi' : ''}.png`;
}
