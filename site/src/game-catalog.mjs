import { locales } from './locales.mjs';

export const marblePath = lang => `${lang === 'hi' ? '/hi' : ''}/games/marble-sort/`;
export const mahjongPath = lang => `${lang === 'hi' ? '/hi' : ''}/games/mahjong/`;

export function gamesFor(lang) {
  return [
    { id: 'clock-out', title: 'Clock Out!', titleLang: 'en', href: marblePath(lang), media: { artworkAsPosterOnly: true } },
    { id: 'glass-twist', title: 'Glass Twist', titleLang: 'en', href: locales[lang].game, media: { artworkAsPosterOnly: true } },
    { id: 'mahjong', title: lang === 'hi' ? 'माहजोंग' : 'Mahjong', titleLang: lang, href: mahjongPath(lang), media: { artworkAsPosterOnly: true } },
  ].map(game => ({ ...game, cover: `/assets/logos/${game.id}.png`, width: 256, height: 256 }));
}
