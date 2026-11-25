import { localPath } from './languages.mjs';
import { locales } from './locales.mjs';

const playFreeLabels = {
  en: 'Play Free',
  hi: 'मुफ़्त खेलें',
  'zh-CN': '免费开玩',
  ja: '無料でプレイ',
  fr: 'Jouer gratuitement',
  ko: '무료 플레이',
};

export const gameDetailTitle = (lang, gameName) => `🎮 ${gameName} 🕹️ ${playFreeLabels[lang]} | tapmelo`;

export const marblePath = lang => localPath(lang, '/marble-sort');
export const mahjongPath = lang => localPath(lang, '/mahjong');

export function gamesFor(lang) {
  return [
    { id: 'clock-out', title: 'Clock Out!', titleLang: 'en', href: marblePath(lang), media: { artworkAsPosterOnly: true } },
    { id: 'glass-twist', title: 'Glass Twist', titleLang: 'en', href: locales[lang].game, media: { artworkAsPosterOnly: true } },
    { id: 'mahjong', title: lang === 'hi' ? 'माहजोंग' : 'Mahjong', titleLang: lang, href: mahjongPath(lang), media: { artworkAsPosterOnly: true } },
  ].map(game => ({ ...game, cover: `/assets/logos/${game.id}.png`, width: 256, height: 256 }));
}
