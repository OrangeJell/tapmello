import { gamesFor } from './game-catalog.mjs';
import { locales } from './locales.mjs';
import { partnerGamesFor, partnerGamePath } from './partner-games.mjs';

export const escapeDiscovery = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const discoveryUpdated = '2026-11-20';

const definitions = [
  ['action', 'Action', 'एक्शन', '#ffe3d9', '#a83c28', 'm13 2-9 12h7l-1 8 10-12h-7l1-8z'],
  ['adventure', 'Adventure', 'रोमांच', '#dbefdf', '#246842', '<circle cx="12" cy="12" r="9"/>|m15.8 8.2-2 5.6-5.6 2 2-5.6z'],
  ['arcade', 'Arcade', 'आर्केड', '#e9e1ff', '#5c3eaa', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm-2 10h18m-14 4h4m-2-2v4m6-2h.01m3-1h.01'],
  ['board', 'Board', 'बोर्ड', '#e1edff', '#324e97', 'M5 20v-3h13v3zM7 17c0-4 4-4 4-7l-4 2-2-3 6-6v2c5 0 6 5 6 12'],
  ['card', 'Card', 'कार्ड', '#ffe3ec', '#892957', 'M6 7h9a2 2 0 0 1 2 2v11H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm2-3 12 2-1 10m-8.5-5-2 2.5 2 2.5 2-2.5z'],
  ['clicker', 'Clicker', 'क्लिकर', '#fff0cb', '#7a520b', 'm5 7 14 5-6 2-2 6zM4 3l1 1m4-2v2M2 8h1'],
  ['driving', 'Driving', 'ड्राइविंग', '#ffe9bf', '#80520b', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>|M3.5 10h6m5 0h6m-8.5 5v6'],
  ['io', '.io', '.io', '#dff1fc', '#275a88', '<circle cx="17.5" cy="11.8" r=".8"/><circle cx="9" cy="8" r=".65"/>|M15.4 6a8 8 0 1 0 0 12l-6-6zM21 8h.01'],
  ['puzzle', 'Puzzle', 'पहेली', '#eadfff', '#572d9c', 'M4 7a2 2 0 0 1 2-2h3a3 3 0 0 1 6 0h3a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2h-3a3 3 0 0 0-6 0H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z'],
  ['shooting', 'Shooting', 'निशानेबाज़ी', '#ffdfe1', '#a3344a', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>|M12 2v3m0 14v3M2 12h3m14 0h3'],
  ['simulation', 'Simulation', 'सिमुलेशन', '#d8edff', '#2a5f98', 'm12 3 9 5v8l-9 5-9-5V8zm0 10 9-5m-9 5L3 8m9 5v8'],
  ['sports', 'Sports', 'खेलकूद', '#d9f1e9', '#216851', '<circle cx="12" cy="12" r="9"/>|M3 12h18m-9-9v18M5.5 5.5c6 3 6 10 0 13m13-13c-6 3-6 10 0 13'],
  ['strategy', 'Strategy', 'रणनीति', '#e3e6ff', '#4245a1', '<circle cx="8" cy="9" r="2"/>|M4 3h16v18H4zM13 9h4m-3 4 3 4m0-4-3 4M8 12v5h3'],
  ['word', 'Word', 'शब्द', '#f4e5ff', '#654085', 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm1 5 2.5 8 2.5-6 2.5 6L17 8'],
];

export const genres = Object.fromEntries(definitions.map(([id, en, hi, fill, ink, path]) => [id, { id, en, hi, fill, ink, path }]));
export const retiredGenres = {
  casual: null,
  racing: 'driving',
  words: 'word',
  cards: 'card',
  clicker: null,
  fashion: 'simulation',
  music: 'simulation',
  platform: 'arcade',
  christmas: null,
};
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
  'clock-out': { categories: ['puzzle'], tags: ['sorting', 'color-sorting', 'bus', 'logic'] },
  'glass-twist': { categories: ['puzzle'], tags: ['sorting', 'color-sorting', 'screw-puzzle', 'logic'] },
  mahjong: { categories: ['board', 'strategy'], tags: ['mahjong', 'tiles-games', 'educational'] },
};

// Match the main mechanic before broader supplier labels and themes.
const genreRules = [
  ['word', ['word', 'words']],
  ['card', ['card', 'cards', 'solitaire']],
  ['board', ['board', 'checkers', 'chess', 'backgammon']],
  ['io', ['io']],
  ['strategy', ['strategy', 'tower-defense']],
  ['clicker', ['clicker']],
  ['driving', ['racing', 'car-racing', 'driving']],
  ['sports', ['sports', 'archery']],
  ['shooting', ['shooting']],
  ['puzzle', ['puzzle', 'matching', 'match-3', 'merge', 'blocks', 'bubble-shooter', 'hidden-object']],
  ['simulation', ['simulation', 'management', 'fashion', 'dress-up', 'make-over', 'make-up', 'color', 'drawing', 'music', 'idle']],
  ['action', ['action', 'fighting']],
  ['adventure', ['adventure', 'obby', 'escape', 'survival']],
  ['arcade', ['arcade', 'platform']],
];

// Overrides cover misleading labels and games with a distinct secondary mechanic.
const categoryOverrides = {
  'angry-pets-3d-boom': ['puzzle', 'shooting'],
  'archery-ragdoll': ['shooting', 'sports'],
  'backgammon-multiplayer': ['board', 'strategy'],
  'break-stick-completely': ['simulation'],
  'catch-a-fish-obby': ['adventure', 'sports'],
  'cheat-and-dont-get-caught': ['puzzle'],
  'chroma-trek': ['arcade'],
  'egg-thief': ['adventure'],
  'english-checkers-online-multiplayer': ['board', 'strategy'],
  'feeding-a-black-hole': ['clicker'],
  'geometry-vibes-2-online': ['arcade'],
  'grow-slime': ['simulation'],
  'hatch-or-steal-online': ['simulation'],
  'mahjong-classic': ['puzzle', 'board'],
  'mahjong-lines': ['puzzle'],
  'mahjong-tide': ['puzzle', 'board'],
  'master-chess': ['board', 'strategy'],
  'minni-family-home-play-house': ['simulation'],
  'my-arcade-center': ['simulation'],
  'no-im-not-a-plankton': ['puzzle'],
  'obby-1-power': ['adventure', 'clicker'],
  'obby-throw-food-for-pets': ['arcade', 'simulation'],
  'orbit-kick': ['sports', 'arcade'],
  'pet-riders': ['adventure', 'simulation'],
  'ragdoll-crashtest-throw-and-break': ['simulation'],
  'ragdoll-robots-sandbox': ['simulation'],
  'realistic-car-destruction-sandbox': ['driving', 'simulation'],
  'relax-box-asmr-mini-games': ['simulation'],
  'santa-holiday-adventure-game': ['adventure', 'driving'],
  'slope-rider': ['driving', 'arcade'],
  'snake-of-bullets-collect-and-shoot': ['shooting', 'arcade'],
  'snow-road-3d': ['driving', 'arcade'],
  'the-machinegg': ['clicker', 'simulation'],
  'wave-rider': ['sports', 'arcade'],
};

export function taxonomyFor(game) {
  const original = originals[game.id];
  if (original) return original;
  const { genres: sourceGenres, tags } = game.metadata;
  const match = genreRules.find(([, labels]) => labels.some(label => sourceGenres.includes(label)));
  const categories = categoryOverrides[game.id] ?? (match && [match[0]]);
  if (!categories) throw new Error(`Missing discovery category for ${game.id}`);
  return { categories, tags: [...new Set(tags)] };
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
    ...partnerGamesFor(lang, key === 'shared').map(game => ({ ...game, titleLang: 'en', href: partnerGamePath(lang, game), category: game.category[lang] })),
  ].map(game => ({ ...game, ...taxonomyFor(game) }));
  const group = field => {
    const groups = new Map();
    for (const game of games) for (const id of game[field]) {
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(game);
    }
    return groups;
  };
  const byGenre = group('categories');
  const byTag = group('tags');
  return [key, { games, byGenre, byTag, tags: [...byTag.keys()].sort((left, right) => byTag.get(right).length - byTag.get(left).length || left.localeCompare(right, 'en')) }];
}));
export const catalogueFor = (lang, sharedOnly = false) => catalogues[lang === 'en' && sharedOnly ? 'shared' : lang];

export function renderDiscoveryBrand() {
  return '<span class="brand-mark"><img src="/favicon-fox.png" alt="" width="96" height="96"></span><span lang="en">tap<span class="brand-light">melo</span></span>';
}

export function renderMobileDiscovery(lang) {
  const hi = lang === 'hi';
  const library = hi ? 'गेम लाइब्रेरी' : 'Game library';
  return {
    toggle: `<button type="button" class="discovery-mobile-toggle" aria-label="${library}" aria-haspopup="dialog" aria-controls="discovery-drawer" aria-expanded="false" hidden>${discoveryIcon('menu')}</button>`,
    drawer: `<dialog class="discovery-drawer" id="discovery-drawer" aria-labelledby="discovery-drawer-title" closedby="any">
      <header><h2 id="discovery-drawer-title" class="brand" aria-label="${library}">${renderDiscoveryBrand()}</h2>
        <form method="dialog"><button type="submit" aria-label="${hi ? 'श्रेणियाँ बंद करें' : 'Close categories'}" autofocus>${discoveryIcon('close')}</button></form>
      </header>
    </dialog>`,
  };
}

export function renderDiscoveryNav(lang, current, sharedOnly) {
  const hi = lang === 'hi';
  const { byGenre } = catalogueFor(lang, sharedOnly);
  const link = (href, name, icon) => `<a href="${href}"${href === current ? ' aria-current="page"' : ''} aria-label="${name}"><span class="discovery-icon">${discoveryIcon(icon)}</span><span class="discovery-nav-label">${name}</span></a>`;
  return `<nav class="discovery-nav" id="discovery-nav" aria-label="${hi ? 'गेम लाइब्रेरी' : 'Game library'}" tabindex="-1">
    <div class="discovery-nav-start"><button type="button" class="discovery-toggle" aria-label="${hi ? 'गेम नेविगेशन' : 'Game navigation'}" aria-controls="discovery-nav" aria-expanded="false" hidden>${discoveryIcon('unfold')}</button>${link(locales[lang].home, hi ? 'होम' : 'Home', 'home')}${link(playedGamesPath(lang), playedGamesLabel(lang), 'history')}${link(gamesPath(lang), gamesLabel(lang), 'games')}</div>
    <div class="discovery-nav-categories" role="group" aria-label="${hi ? 'श्रेणियाँ' : 'Categories'}">
      ${Object.keys(genres).filter(id => byGenre.has(id)).map(id => link(genrePath(lang, id), genres[id][lang], id)).join('')}
    </div>
    <div class="discovery-nav-end">${link(tagsPath(lang), tagsLabel(lang), 'tags')}</div>
  </nav>`;
}
