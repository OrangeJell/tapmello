import assert from 'node:assert/strict';
import { languageCodes, translatedLanguages, localPath } from '../src/languages.mjs';
import { createLocalizer, brandNames } from '../src/site-localization.mjs';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { appendFile, copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gameDetailTitle } from '../src/game-catalog.mjs';
import { origin, updated } from '../src/game.mjs';
import { catalogueFor, discoveryUpdated, gamesPath, genrePath, genres, retiredGenres, tagLabel, tagName, taxonomyFor } from '../src/discovery.mjs';
import { locales } from '../src/locales.mjs';
import { partnerGamesFor, partnerGameName, partnerGamePath, partnerLocales } from '../src/partner-games.mjs';
const extractLocales = process.argv.includes('--extract-locales');
const extractHindiInfo = process.argv.includes('--extract-hi-info');
const extracting = extractLocales || extractHindiInfo;
if (!extracting) await import('../../mahjong-tutor/scripts/prepare-locales.mjs');
const { discoveryPages, renderGame, renderHome, renderPage, renderPartnerGame } = await import('../src/render.mjs');
const { articles, coverSVG, mahjongPath, mahjongGuidePath, renderMahjong, renderMahjongArticle, mahjongUpdated } = await import('../src/mahjong.mjs');
import { marbleGuides, marblePath, marbleGuidePath, renderMarble, renderMarbleGuide, marbleUpdated } from '../src/marble.mjs';
import { level2Guides, renderLevel2Guide } from '../src/level-2-guide.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
// Keep game code and shared collectors in sync before rendering the static pages.
if (!extracting) {
  const assetTreeOptions = { recursive: true, filter: file => path.basename(file) !== '.DS_Store' };
  await rm(path.join(root, 'dist'), { recursive: true, force: true });
  await cp(path.join(root, 'public'), path.join(root, 'dist'), assetTreeOptions);
  await import('./sync-game.mjs');
  await import('./sync-mahjong.mjs');
  await import('./sync-marble.mjs');

  await mkdir(path.join(root, 'dist', 'assets', 'fonts'), { recursive: true });
  await copyFile(path.join(root, 'ads.txt'), path.join(root, 'dist', 'ads.txt'));
  for (const file of ['outfit-latin.woff2', 'OFL.txt']) {
    await copyFile(path.join(root, 'src', 'assets', 'fonts', file), path.join(root, 'dist', 'assets', 'fonts', file));
  }
  await copyFile(path.join(root, 'src', 'assets', 'styles.css'), path.join(root, 'dist', 'assets', 'styles.css'));
  await copyFile(path.join(root, 'src', 'assets', 'home.css'), path.join(root, 'dist', 'assets', 'home.css'));
  await copyFile(path.join(root, 'src', 'assets', 'arcade.css'), path.join(root, 'dist', 'assets', 'arcade.css'));
  for (const file of ['standard-detail.css', 'standard-detail.js', 'site-search.css', 'site-search.js', 'site-theme.js', 'discovery.css', 'discovery-nav.js', 'played-games.js', 'game-embed.js', 'x-logo.svg']) {
    await copyFile(path.join(root, 'src', 'assets', file), path.join(root, 'dist', 'assets', file));
  }
  await cp(path.join(root, 'src', 'assets', 'logos'), path.join(root, 'dist', 'assets', 'logos'), assetTreeOptions);
  await copyFile(path.join(root, 'src', 'assets', 'game-previews.js'), path.join(root, 'dist', 'assets', 'game-previews.js'));
  await cp(path.join(root, 'src', 'assets', 'previews'), path.join(root, 'dist', 'assets', 'previews'), assetTreeOptions);
  await copyFile(path.join(root, 'src', 'assets', 'language-picker.js'), path.join(root, 'dist', 'assets', 'language-picker.js'));
  await copyFile(path.join(root,'src/assets/mahjong-embed.js'),path.join(root,'dist/assets/mahjong-embed.js'));
  await writeFile(path.join(root,'dist/assets/mahjong-cover.svg'),coverSVG());
  await copyFile(path.join(root,'src/assets/marble-embed.js'),path.join(root,'dist/assets/marble-embed.js'));
  await copyFile(path.join(root,'src/assets/shuttle-cover.png'),path.join(root,'dist/assets/shuttle-cover.png'));
}
const publishedPages = [];
const sharedEnglishPages = [];
const catalogues = [];
let englishSearch;
let sharedEnglishCatalogue;
const detailUpdated = '2026-11-18';
const localizationUpdated = '2026-11-21';
for (const edition of ['shared', 'en', 'hi']) {
  const sharedOnly = edition === 'shared';
  const language = sharedOnly ? 'en' : edition;
  const pages = sharedOnly ? sharedEnglishPages : publishedPages;
  pages.push(...discoveryPages(language, sharedOnly));
  const { games } = catalogueFor(language, sharedOnly);
  const searchEntries = games.map(game => ({
    title: game.title, href: game.href, cover: game.cover,
    originalTitle: game.originalTitle,
    keywords: [game.id, game.category, game.originalTitle, ...(game.searchAliases ?? []), ...game.categories.map(id => genres[id][language]), ...(game.metadata?.genres ?? []), ...game.tags, ...(language === 'hi' ? game.tags.map(id => tagLabel(id, language)) : [])].filter(Boolean).join(' '),
  }));
  const searchTerms = language === 'en' && games.map(game => [game.category, ...(game.searchAliases ?? []), ...game.categories.map(id => genres[id]?.en ?? id), ...game.tags.map(tagName)].filter(Boolean));
  if (!extracting && !sharedOnly) await writeFile(path.join(root, 'dist', 'assets', `game-search-${language}.json`), JSON.stringify(searchEntries));
  if (sharedOnly) englishSearch = searchEntries.map(({ keywords, ...entry }, index) => ({
    ...entry, id: games[index].id, keywords, searchTerms: searchTerms[index],
  }));
  const catalogue = games.map(({ id, title, titleLang, href, cover, width, height, category, categories, preview }) =>
    ({ id, title, titleLang, href, cover, width, height, category, categories, preview }));
  if (sharedOnly) sharedEnglishCatalogue = catalogue;
  else catalogues.push([language, catalogue]);
  const c = locales[language];
  const gameTitleFields = gameName => ({ gameName, title: gameDetailTitle(language, gameName) });
  const gameNameFor = id => games.find(game => game.id === id).title;
  pages.push({ language, kind: 'home', cover:'/assets/shuttle-cover.png', coverHeight:732, coverAlt:language==='hi'?'जानवर और उनकी चार बस कतारें':'Animal coworkers and their four shuttle queues', updated: discoveryUpdated, path: c.home, title: c.homeTitle, description: c.description, main: renderHome(language, sharedOnly) });
  pages.push({ language, kind: 'game', path: c.game, ...gameTitleFields(gameNameFor('glass-twist')), description: c.gameDescription, updated: localizationUpdated, main: renderGame(language, sharedOnly) });
  const hi=language==='hi';
  for (const game of partnerGamesFor(language, sharedOnly)) {
    const gamePath = partnerGamePath(language, game);
    const url = origin + gamePath;
    const detail = game.details[language];
    const existingLocalization = !game.localizedOn && Object.hasOwn(partnerLocales.hi.games, game.id);
    const originalDate = existingLocalization ? localizationUpdated : detailUpdated;
    const dateModified = game.addedOn ?? (hi ? game.localizedOn : undefined) ?? originalDate;
    const name = partnerGameName(language, game);
    pages.push({
      language, kind: 'partner-play', path: gamePath, updated: dateModified, game,
      ...gameTitleFields(name),
      description: detail.summary,
      cover: game.artwork, coverWidth: game.media.artworkWidth, coverHeight: game.media.artworkHeight, coverAlt: name,
      structured: {
        '@context': 'https://schema.org', '@type': 'WebPage', url,
        name, description: detail.summary, inLanguage: language, dateModified,
        mainEntity: {
          '@type': 'VideoGame', name, image: origin + game.artwork, genre: taxonomyFor(game).categories.map(id => genres[id][language]),
          ...(game.metadata.developer && { author: { '@type': 'Organization', name: game.metadata.developer } }),
          ...(game.metadata.releaseDate && { datePublished: game.metadata.releaseDate }),
        },
      },
      main: renderPartnerGame(language, game, sharedOnly),
    });
  }
  const mahjongDescription=hi?'माहजोंग के मुफ़्त अभ्यास में टाइलें पहचानें, ची और पोंग का फ़र्क समझें और हाथ पूरा करने वाली टाइल ढूँढें।':'Learn Mahjong online with free beginner exercises. Identify the tiles, build a winning hand, practise calling discards and find every tile that completes a wait.';
  const common={language,cover:'/assets/mahjong-cover.svg',coverHeight:732,coverAlt:hi?'हरी सतह पर माहजोंग टाइलें':'Mahjong tiles on a green playing surface',updated:mahjongUpdated};
  pages.push({...common,updated:localizationUpdated,kind:'mahjong',path:mahjongPath(language),...gameTitleFields(gameNameFor('mahjong')),description:mahjongDescription,alternates:{en:mahjongPath('en'),hi:mahjongPath('hi')},main:renderMahjong(language, sharedOnly),structured:{'@context':'https://schema.org','@type':'WebApplication',name:'Mahjong basics',url:origin+mahjongPath(language),description:mahjongDescription,inLanguage:languageCodes,applicationCategory:'EducationalApplication',operatingSystem:'Web browser',isAccessibleForFree:true}});
  for(const a of articles){const articlePath=mahjongGuidePath(language,a.id);pages.push({...common,kind:'mahjong-guide',path:articlePath,title:a.title[language]+' | tapmelo',description:a.lead[language],alternates:{en:mahjongGuidePath('en',a.id),hi:mahjongGuidePath('hi',a.id)},main:renderMahjongArticle(a,language),structured:{'@context':'https://schema.org','@type':'Article',headline:a.title[language],description:a.lead[language],inLanguage:language,dateModified:mahjongUpdated,mainEntityOfPage:origin+articlePath,image:origin+'/assets/mahjong-cover.svg',author:{'@type':'Person',name:'Jelly'}}});}
  const marbleDescription=hi?'Clock Out! में एक रंग के यात्रियों को उनकी बस में बिठाएँ। चार कतारें पढ़ें और जानें कि इंतज़ार की 27 जगहें भरने पर जाम कैसे खोलें।':'Play Clock Out!, a free bus sorting puzzle with 60 levels. Match nine riders at a time to four shuttle queues and keep the 27-space waiting loop moving.';
  const marbleCommon={language,cover:'/assets/shuttle-cover.png',coverHeight:732,coverAlt:hi?'कर्मचारी और उनकी बसें':'Animal commuters and their shuttles',updated:marbleUpdated};
  pages.push({...marbleCommon,updated:localizationUpdated,kind:'marble',path:marblePath(language),...gameTitleFields(gameNameFor('clock-out')),description:marbleDescription,alternates:{en:marblePath('en'),hi:marblePath('hi')},main:renderMarble(language, sharedOnly),structured:{'@context':'https://schema.org','@type':['VideoGame','WebApplication'],name:'Clock Out!',url:origin+marblePath(language),description:marbleDescription,inLanguage:languageCodes,applicationCategory:'GameApplication',operatingSystem:'Web browser',isAccessibleForFree:true}});
  for(const a of marbleGuides) pages.push({...marbleCommon,kind:'marble-guide',path:marbleGuidePath(language,a.id),title:a.title[language]+' | tapmelo',description:a.lead[language],alternates:{en:marbleGuidePath('en',a.id),hi:marbleGuidePath('hi',a.id)},main:renderMarbleGuide(a,language),structured:{'@context':'https://schema.org','@type':'Article',headline:a.title[language],description:a.lead[language],inLanguage:language,datePublished:marbleUpdated,dateModified:marbleUpdated,mainEntityOfPage:origin+marbleGuidePath(language,a.id),image:origin+'/assets/shuttle-cover.png',author:{'@type':'Person',name:'Jelly'}}});
  const guide = level2Guides[language];
  pages.push({ language, kind: 'guide', path: c.guide, title: guide.title, headline: guide.heading, description: guide.description, main: renderLevel2Guide(language) });
}

const information = {
  about: ['About tapmelo | Free Browser Games', 'tapmelo is an independent browser game site run by Jelly. Browse puzzles, arcade games and more, or try Clock Out!, Glass Twist and Mahjong.'],
  contact: ['Contact tapmelo | Feedback and Bug Reports', 'Email Jelly about a game, report a problem or ask a privacy question. You can also find tapmelo on X.'],
  privacy: ['Privacy Notice | tapmelo', 'See what tapmelo saves in your browser, how Playgama games load and how to turn Google Analytics on or off.'],
  terms: ['Terms of Use | tapmelo', 'Terms for playing on tapmelo, including saved progress and optional rewards in Glass Twist.'],
};
for (const [slug, [title, description]] of Object.entries(information)) {
  const page = { kind: 'info', updated: '2026-11-18', path: `/${slug}/`, title, description, main: await readFile(path.join(root, 'src', 'info', `${slug}.html`), 'utf8') };
  publishedPages.push(page);
  sharedEnglishPages.push(page);
}
const routes = new Set(sharedEnglishPages.map(page => page.path));
const pages = publishedPages.map(page => ({ ...page, englishOnly: (page.language ?? 'en') === 'en' && !routes.has(page.path) }));
// Content hashes keep a returning visitor's HTML, styles and screenshots in sync.
const assetVersions = new Map();
async function versionAssets(html) {
  const paths = new Set(html.match(/\/assets\/[^"<>?\s]+\.(?:css|json|js|png|jpg|svg|mp4)/g) || []);
  for (const asset of paths) {
    if (!assetVersions.has(asset)) {
      const bytes = await readFile(path.join(root, 'dist', asset));
      assetVersions.set(asset, createHash('sha256').update(bytes).digest('hex').slice(0, 12));
    }
    html = html.replaceAll(asset, `${asset}?v=${assetVersions.get(asset)}`);
  }
  return html;
}
for (const [language, catalogue] of extracting ? [] : catalogues) {
  await writeFile(path.join(root, 'dist', 'assets', `game-recommendations-${language}.json`),
    await versionAssets(JSON.stringify(catalogue)));
}
const pageFilename = route => route + (route.endsWith('/') ? 'index.html' : '.html');
async function writePage(route, html) {
  const file = path.join(root, 'dist', pageFilename(route));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, await versionAssets(html));
}

const titles = new Set([...brandNames, ...sharedEnglishCatalogue.map(game => game.title)]);
const manifest = JSON.parse(await readFile(path.join(root, 'public', 'manifest.webmanifest'), 'utf8'));
const runtimeCopy = JSON.parse(await readFile(path.join(root, 'src', 'locale-runtime.json'), 'utf8'));
const renderedEnglish = sharedEnglishPages.map(page => [page, renderPage(page, page.main, true)]);
const editorialAliases = JSON.parse(await readFile(path.join(root, 'src', 'translations', 'editorial-aliases.json'), 'utf8'));

for (const code of extracting ? ['hi'] : ['hi', ...translatedLanguages]) {
  const source = extracting ? new Set() : undefined;
  const dictionary = source ? null : JSON.parse(await readFile(path.join(root, 'src', 'translations', code + '.json'), 'utf8'));
  const gameNames = new Map();
  if (dictionary) {
    for (const game of partnerGamesFor('en', true)) {
      const locale = partnerLocales[code];
      if (!locale.games[game.id]) continue;
      const name = partnerGameName(code, game);
      if (name !== game.title) gameNames.set(game.title, name);
      dictionary[game.category.en] = game.category[code];
      dictionary[name + ' · Game player'] = locale.player.replace('{title}', () => name);
    }
  }
  const localizer = createLocalizer({ code, dictionary, source, routes, titles, editorialAliases, gameNames });
  const fullLocale = code !== 'hi' || extractLocales;
  const startUrl = localPath(code, manifest.start_url);
  let clientCopy = dictionary?.runtime;
  if (fullLocale) {
    const messages = Object.fromEntries(Object.entries(runtimeCopy).map(([key, value]) => [key, localizer.translate(value, 'runtime ' + key)]));
    clientCopy = { ...messages, ...clientCopy };
    const localManifest = { ...manifest, lang: code, start_url: startUrl,
      description: localizer.translate(manifest.description, 'manifest description') };
    const search = localizer.catalogue(englishSearch);
    const recommendations = localizer.catalogue(sharedEnglishCatalogue);
    if (!source) {
      await mkdir(path.join(root, 'dist', localPath(code, '/')), { recursive: true });
      const slug = code.toLowerCase();
      await writeFile(path.join(root, 'dist', localPath(code, '/manifest.webmanifest')), JSON.stringify(localManifest, null, 2) + '\n');
      await writeFile(path.join(root, 'dist', 'assets', `game-search-${slug}.json`), JSON.stringify(search));
      await writeFile(path.join(root, 'dist', 'assets', `game-recommendations-${slug}.json`), await versionAssets(JSON.stringify(recommendations)));
    }
  }
  const runtimeJSON = clientCopy && JSON.stringify(clientCopy).replaceAll('<', '\\u003c');
  for (const [page, html] of renderedEnglish) {
    if (!fullLocale && page.kind !== 'info') continue;
    const copy = page.game && Object.hasOwn(partnerLocales[code].games, page.game.id) ? page.game.details[code] : undefined;
    let translated;
    if (page.gameName) {
      const name = copy ? partnerGameName(code, page.game) : page.gameName;
      const title = gameDetailTitle(code, name);
      const localizedPage = { ...page, title };
      const preserved = new Set([title]);
      let main = page.main;
      if (copy) {
        localizedPage.description = copy.summary;
        localizedPage.structured = { ...page.structured, description: copy.summary, dateModified: page.game.localizedOn ?? page.updated };
        main = renderPartnerGame('en', page.game, true, code);
        if (copy.localizedName) preserved.add(copy.localizedName);
        for (const text of [copy.summary, copy.category, copy.aboutTitle, copy.controls, ...copy.about, ...copy.steps.flat(), ...copy.faq.flat()]) preserved.add(text);
      }
      translated = localizer.html(renderPage(localizedPage, main, true), page.path, preserved);
    } else {
      translated = localizer.html(html, page.path);
    }
    if (source) continue;
    const route = localPath(code, page.path);
    pages.push({ ...page, path: route, language: code, localized: true, updated: page.game?.localizedOn ?? page.updated });
    const addRuntime = runtimeJSON && (fullLocale || page.path === '/privacy/');
    await writePage(route, !addRuntime ? translated : translated.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  <script id="site-localized-copy" type="application/json" data-language="${code}" data-game-path="${startUrl}">${runtimeJSON}</script>`));
  }
  if (source) {
    writeFileSync(1, JSON.stringify([...source].sort()) + '\n');
    process.exit(0);
  }
}
const normalizedRoutes = new Set();
const htmlFiles = new Set();
for (const page of pages) {
  const route = page.path.replace(/\/$/, '');
  assert.ok(!normalizedRoutes.has(route), `Conflicting page route: ${page.path}`);
  normalizedRoutes.add(route);
  const filename = pageFilename(page.path);
  assert.ok(!htmlFiles.has(filename), `Conflicting HTML file: ${filename}`);
  htmlFiles.add(filename);
}

for (const page of pages.filter(page => !page.localized)) {
  await writePage(page.path, renderPage(page, page.main));
}
const publishedRoutes = new Set(pages.map(page => page.path));
const retiredCategoryRedirects = languageCodes.flatMap(code => Object.entries(retiredGenres).flatMap(([oldId, newId]) => {
  const from = localPath(code, genrePath('en', oldId));
  if (publishedRoutes.has(from)) return [];
  const category = newId && localPath(code, genrePath('en', newId));
  const to = publishedRoutes.has(category) ? category : localPath(code, gamesPath('en'));
  return [`${from.slice(0, -1)} ${to} 301`, `${from} ${to} 301`];
}));
await appendFile(path.join(root, 'dist', '_redirects'), retiredCategoryRedirects.join('\n') + '\n');

const legacyGameRedirects = Object.fromEntries([
  ['/games/coming-soon', locales.en.game],
  ...languageCodes.flatMap(code => [
    ...[locales.en.game, mahjongPath('en'), marblePath('en')].map(route => [
      localPath(code, '/games' + route), localPath(code, route),
    ]),
    ...partnerGamesFor(code).map(game => [
      localPath(code, `/play/${game.provider}/${game.id}`), partnerGamePath(code, game),
    ]),
  ]),
]);
for (const [from, to] of Object.entries(legacyGameRedirects)) {
  assert.ok(!normalizedRoutes.has(from), `Legacy redirect shadows a page: ${from}`);
  assert.ok(publishedRoutes.has(to), `Missing legacy redirect destination: ${from} -> ${to}`);
}
await writeFile(path.join(root, 'dist', 'legacy-game-redirects.json'), JSON.stringify(legacyGameRedirects));

await writeFile(path.join(root, 'dist', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter(page => !page.noindex).map(page => `  <url><loc>${origin + page.path}</loc><lastmod>${page.updated || updated}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`Built ${pages.length} static pages from site/src; game counts come from the current level catalogue.`);
