export const languages = Object.freeze({
  en: { name: 'English', og: 'en_IN' },
  hi: { name: 'हिन्दी', og: 'hi_IN' },
  ta: { name: 'தமிழ்', og: 'ta_IN' },
  te: { name: 'తెలుగు', og: 'te_IN' },
  bn: { name: 'বাংলা', og: 'bn_IN' },
  id: { name: 'Bahasa Indonesia', og: 'id_ID' },
  'zh-CN': { name: '简体中文', og: 'zh_CN' },
  ja: { name: '日本語', og: 'ja_JP' },
  fr: { name: 'Français', og: 'fr_FR' },
  ko: { name: '한국어', og: 'ko_KR' },
  es: { name: 'Español', og: 'es_ES' },
  de: { name: 'Deutsch', og: 'de_DE' },
  it: { name: 'Italiano', og: 'it_IT' },
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
