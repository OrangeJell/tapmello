import { gamesFor } from './game-catalog.mjs';
import { locales } from './locales.mjs';
import { playgamaGamesFor, playgamaPath } from './playgama.mjs';

export const escapeDiscovery = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const definitions = [
  ['christmas', 'Christmas Games', 'क्रिसमस गेम', '#dcefe3', '#246842', 'm12 2-5 7h3l-5 7h14l-5-7h3zm0 14v5m-3 0h6'],
  ['puzzle', 'Puzzle', 'पहेली', '#eadfff', '#572d9c', 'M4 7a2 2 0 0 1 2-2h3a3 3 0 0 1 6 0h3a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2h-3a3 3 0 0 0-6 0H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z'],
  ['arcade', 'Arcade', 'आर्केड', '#ffe0ed', '#9b2e5e', 'm13 2-8 12h6l-1 8 9-12h-6z'],
  ['action', 'Action', 'एक्शन', '#ffe3d9', '#a83c28', 'm5 3 15 15m-1-15L4 18m12-3 5-1m-7 7 1-5m-7-1-5-1m7 7-1-5'],
  ['adventure', 'Adventure', 'रोमांच', '#dbefdf', '#246842', 'm3 19 7-14 4 8 2-4 5 10H3Zm5-10 2 2 2-2'],
  ['board', 'Board', 'बोर्ड गेम', '#ffebc7', '#835115', '<rect x="4" y="4" width="16" height="16" rx="3"/><path fill="currentColor" fill-opacity=".22" stroke="none" d="M5 7a2 2 0 0 1 2-2h5v7H5zm7 5h7v5a2 2 0 0 1-2 2h-5z"/>|M12 4v16M4 12h16'],
  ['cards', 'Card', 'ताश', '#ffe6e3', '#a3334e', 'M9 3h10v15H9zM6 6H4v15h11v-1m-4-10 3-4 3 4-3 4z'],
  ['casual', 'Casual', 'कैज़ुअल', '#ffecd7', '#8c4d28', 'M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Zm13 1h2a2 2 0 0 1 0 4h-2M8 3v3m4-3v3M3 21h17'],
  ['clicker', 'Clicker', 'क्लिकर', '#e9e4ff', '#5837a1', '<path fill="currentColor" fill-opacity=".16" d="m8 8 12 5-5 2-2 5z"/>|M4 8h1m3-4v1m4 0 1-1m-8 8-1 1'],
  ['racing', 'Racing', 'रेसिंग', '#ffe9bf', '#80520b', 'M5 21V4c5-4 9 4 14 0v11c-5 4-9-4-14 0m4-11v5m5-3v5m-9-2c5-4 9 4 14 0'],
  ['shooting', 'Shooting', 'निशानेबाज़ी', '#ffdfe1', '#a3344a', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>|M12 2v3m0 14v3M2 12h3m14 0h3'],
  ['simulation', 'Simulation', 'सिमुलेशन', '#d8edff', '#2a5f98', 'm12 3 9 5v8l-9 5-9-5V8zm0 10 9-5m-9 5L3 8m9 5v8'],
  ['sports', 'Sports', 'खेलकूद', '#d9f1e9', '#216851', '<circle cx="12" cy="12" r="9"/>|M3 12h18m-9-9v18M5.5 5.5c6 3 6 10 0 13m13-13c-6 3-6 10 0 13'],
  ['strategy', 'Strategy', 'रणनीति', '#e3e6ff', '#4245a1', 'M4 4h5v4h6V4h5v7l-3 3 1 6H6l1-6-3-3zM7 14h10'],
  ['words', 'Word', 'शब्द', '#feedd0', '#845313', 'M3 18l5-12 5 12m-8-4h6m8-5v9m-3-5h6'],
  ['platform', 'Platformer', 'प्लैटफ़ॉर्मर', '#dcecff', '#285c9c', 'M3 19h5v-5h5V9h5V4h3m-18 6 5-5m-5 0h5v5'],
  ['fashion', 'Fashion', 'फ़ैशन', '#f9e1f6', '#8a327a', 'm5 5 4-2a3 3 0 0 0 6 0l4 2 3 4-4 3-2-2v11H8V10l-2 2-4-3z'],
  ['music', 'Music', 'संगीत', '#eadfff', '#623696', '<ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>|M9 18V6l11-3v12M9 10l11-3'],
  ['io', '.io', '.io', '#dff3d2', '#386625', '<circle cx="12" cy="12" r="9"/>|M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z'],
];

export const genres = Object.fromEntries(definitions.map(([id, en, hi, fill, ink, path]) => [id, { id, en, hi, fill, ink, path }]));
const icons = {
  home: '<path fill="currentColor" fill-opacity=".16" d="M4 11 10.7 5a2 2 0 0 1 2.6 0l6.7 6v7a2 2 0 0 1-2 2h-3.5v-4.5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1V20H6a2 2 0 0 1-2-2z"/>|m2.5 12.5 1.5-1.5m16 0 1.5 1.5',
  history: '<circle cx="12" cy="12" r="7.5" fill="currentColor" fill-opacity=".14" stroke="none"/>|M4 11a8 8 0 1 1 1.9 6.2M4 6v5h5m3-3v4l3 1.8',
  games: '<path fill="currentColor" fill-opacity=".17" d="M8 7h8a4.5 4.5 0 0 1 4.4 3.6l1 5a2.6 2.6 0 0 1-4.2 2.5l-2.4-2.1H9.2l-2.4 2.1a2.6 2.6 0 0 1-4.2-2.5l1-5A4.5 4.5 0 0 1 8 7Z"/>|M8.5 9.5v4m-2-2h4M15.5 10.5h.01M18 12.9h.01',
  tags: '<path fill="currentColor" fill-opacity=".16" d="M4 5h6.5a2 2 0 0 1 1.4.6l7.5 7.5a1.5 1.5 0 0 1 0 2.1l-4.2 4.2a1.5 1.5 0 0 1-2.1 0L5.6 12A2 2 0 0 1 5 10.6V6a1 1 0 0 0-1-1Z"/><circle cx="8.5" cy="8.5" r=".65"/>|M15.4 5.8l6 6',
  unfold: 'm5 6 5 6-5 6m8-12 5 6-5 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  next: 'm9 6 6 6-6 6',
};
export const discoveryIcon = name => {
  const [first, path] = (icons[name] ?? genres[name].path).split('|');
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path ? first : ''}<path d="${path ?? first}"/></svg>`;
};

const originals = {
  'clock-out': { genres: ['puzzle', 'casual'], tags: ['sorting', 'color-sorting', 'bus', 'logic'] },
  'glass-twist': { genres: ['puzzle', 'casual'], tags: ['sorting', 'color-sorting', 'screw-puzzle', 'logic'] },
  mahjong: { genres: ['board', 'strategy'], tags: ['mahjong', 'tiles-games', 'educational'] },
};
const priorities = ['christmas', 'shooting', 'racing', 'sports', 'cards', 'words', 'music', 'io', 'fashion', 'platform', 'board', 'strategy', 'simulation', 'clicker', 'puzzle', 'action', 'adventure', 'arcade', 'casual'];
export function taxonomyFor(game) {
  const original = originals[game.id];
  const source = original ?? game.metadata;
  const matched = priorities.filter(id => source.genres.includes(id));
  return { categories: original?.genres ?? (matched.length ? matched : ['casual']), tags: [...new Set(source.tags)] };
}

export const gamesPath = lang => `${lang === 'hi' ? '/hi' : ''}/games/`;
export const playedGamesPath = lang => `${gamesPath(lang)}played/`;
export const playedGamesLabel = lang => lang === 'hi' ? 'खेले गए गेम' : 'Played games';
export const genrePath = (lang, id) => `${gamesPath(lang)}category/${id}/`;
export const tagsPath = lang => `${lang === 'hi' ? '/hi' : ''}/tags/`;
export const tagPath = (lang, id) => `${tagsPath(lang)}${id}/`;
export const tagName = id => id.replaceAll('-', ' ');
export const gamesLabel = lang => lang === 'hi' ? 'सभी गेम' : 'All games';
export const tagsLabel = lang => lang === 'hi' ? 'टैग' : 'Tags';
export const gameCount = (lang, count) => lang === 'hi' ? `${count} गेम` : `${count} ${count === 1 ? 'game' : 'games'}`;

const catalogues = Object.fromEntries([['en', 'en'], ['hi', 'hi'], ['shared', 'en']].map(([key, lang]) => {
  const nativeLabels = {
    'clock-out': { en: 'Bus sorting game', hi: 'बसों के रंग मिलाएँ' },
    'glass-twist': { en: 'Screw puzzle', hi: 'पेंचों की पहेली' },
    mahjong: { en: 'Learn Mahjong', hi: 'माहजोंग सीखें' },
  };
  const hindiAliases = {
    'clock-out': 'क्लॉक आउट बस रंग छँटाई रंग छंटाई',
    'glass-twist': 'ग्लास ट्विस्ट काँच कांच पेंच पेच स्क्रू',
    mahjong: 'माहजोंग महजोंग महाजोंग Mahjong टाइल',
  };
  const games = [
    ...gamesFor(lang).map(game => ({
      ...game, category: nativeLabels[game.id][lang], preview: `/assets/previews/${game.id}.mp4`,
      searchAliases: [nativeLabels[game.id].en, lang === 'hi' ? hindiAliases[game.id] : ''],
    })),
    ...playgamaGamesFor(lang, key === 'shared').map(game => ({ ...game, titleLang: 'en', href: playgamaPath(lang, game), category: game.category[lang] })),
  ].map(game => ({ ...game, ...taxonomyFor(game) }));
  const group = field => {
    const groups = new Map();
    for (const game of games) for (const id of game[field]) {
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(game);
    }
    return groups;
  };
  const byTag = group('tags');
  return [key, { games, byGenre: group('categories'), byTag, tags: [...byTag.keys()].sort((left, right) => byTag.get(right).length - byTag.get(left).length || left.localeCompare(right, 'en')) }];
}));
export const catalogueFor = (lang, sharedOnly = false) => catalogues[lang === 'en' && sharedOnly ? 'shared' : lang];

export function renderMobileDiscovery(lang) {
  const hi = lang === 'hi';
  const categories = hi ? 'श्रेणियाँ' : 'Categories';
  return {
    toggle: `<button type="button" class="discovery-mobile-toggle" aria-label="${categories}" aria-haspopup="dialog" aria-controls="discovery-drawer" aria-expanded="false" hidden>${discoveryIcon('menu')}</button>`,
    drawer: `<dialog class="discovery-drawer" id="discovery-drawer" aria-labelledby="discovery-drawer-title" closedby="any">
      <header><h2 id="discovery-drawer-title">${categories}</h2>
        <form method="dialog"><button type="submit" aria-label="${hi ? 'श्रेणियाँ बंद करें' : 'Close categories'}" autofocus>${discoveryIcon('close')}</button></form>
      </header>
    </dialog>`,
  };
}

export function renderDiscoveryNav(lang, current, sharedOnly) {
  const hi = lang === 'hi';
  const { byGenre } = catalogueFor(lang, sharedOnly);
  const link = (href, name, icon, genre) => `<a href="${href}"${href === current ? ' aria-current="page"' : ''} aria-label="${name}"><span class="discovery-icon" data-nav-icon="${icon}"${genre ? ` style="--icon-fill:${genre.fill};--icon-ink:${genre.ink}"` : ''}>${discoveryIcon(icon)}</span><span class="discovery-nav-label">${name}</span></a>`;
  return `<nav class="discovery-nav" id="discovery-nav" aria-label="${hi ? 'गेम लाइब्रेरी' : 'Game library'}" tabindex="-1">
    <div class="discovery-nav-start"><button type="button" class="discovery-toggle" aria-label="${hi ? 'गेम नेविगेशन' : 'Game navigation'}" aria-controls="discovery-nav" aria-expanded="false" hidden>${discoveryIcon('unfold')}</button>${link(locales[lang].home, hi ? 'होम' : 'Home', 'home')}${link(playedGamesPath(lang), playedGamesLabel(lang), 'history')}${link(gamesPath(lang), gamesLabel(lang), 'games')}</div>
    <div class="discovery-nav-categories">
      <p class="discovery-nav-caption">${hi ? 'श्रेणियाँ' : 'Categories'}</p>
      ${Object.values(genres).filter(genre => byGenre.has(genre.id)).map(genre => link(genrePath(lang, genre.id), genre[lang], genre.id, genre)).join('')}
    </div>
    <div class="discovery-nav-end">${link(tagsPath(lang), tagsLabel(lang), 'tags')}</div>
  </nav>`;
}

export function renderCategoryLinks(lang, sharedOnly) {
  const { byGenre } = catalogueFor(lang, sharedOnly);
  return `<nav class="discovery-filters" aria-label="${lang === 'hi' ? 'गेम की श्रेणियाँ' : 'Game categories'}">${Object.values(genres).filter(genre => byGenre.has(genre.id)).map(genre => `<a href="${genrePath(lang, genre.id)}" style="--icon-fill:${genre.fill};--icon-ink:${genre.ink}"><span class="discovery-icon">${discoveryIcon(genre.id)}</span>${genre[lang]}</a>`).join('')}</nav>`;
}
