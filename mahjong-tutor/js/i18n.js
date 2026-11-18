import { hindi } from './hi.js';
// The first argument is retained for old authored content; only English and Hindi are offered.
export const L = (_legacy, en) => ({ en, hi: hindi[en] || en });
