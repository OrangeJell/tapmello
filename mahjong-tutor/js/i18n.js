import { hindi } from './hi.js';
import { extraCopy, extraLanguageNames } from './locale-copy.js';

export const languages = Object.freeze({ hi: 'हिन्दी', en: 'English', ...extraLanguageNames });

export const normalizeLanguage = code => Object.hasOwn(languages, code) ? code : 'en';

export function translate(en, lang) {
  return (lang === 'hi' ? hindi[en] : extraCopy[lang]?.[en]) ?? en;
}

// The first argument is retained for legacy authoring calls.
export function L(_legacy, en) {
  return Object.fromEntries(Object.keys(languages).map(code => [code, translate(en, code)]));
}
