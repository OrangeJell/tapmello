export const languages = Object.freeze({
  en: { name: 'English', og: 'en_IN' },
  hi: { name: 'हिन्दी', og: 'hi_IN' },
  'zh-CN': { name: '简体中文', og: 'zh_CN' },
  ja: { name: '日本語', og: 'ja_JP' },
  fr: { name: 'Français', og: 'fr_FR' },
  ko: { name: '한국어', og: 'ko_KR' },
});

export const languageCodes = Object.keys(languages);
export const translatedLanguages = languageCodes.filter(code => code !== 'en' && code !== 'hi');
export const languagePrefix = code => code === 'en' ? '' : '/' + code.toLowerCase();
export const localPath = (code, path) => languagePrefix(code) + path;
export const basePath = (code, path) => path.slice(languagePrefix(code).length);
export const pageLanguage = path => languageCodes.find(code => code !== 'en' && path.startsWith(languagePrefix(code) + '/')) ?? 'en';

export function pageAlternates(language, path, englishOnly = false) {
  const route = basePath(language, path);
  if (englishOnly) return { en: route, 'x-default': route };
  return { ...Object.fromEntries(languageCodes.map(code => [code, localPath(code, route)])), 'x-default': route };
}
