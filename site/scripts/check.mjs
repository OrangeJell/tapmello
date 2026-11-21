import { languageCodes, languagePrefix, localPath, pageAlternates, pageLanguage } from '../src/languages.mjs';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marbleGuides } from '../src/marble.mjs';
import { levels, origin } from '../src/game.mjs';
import { partnerGames, partnerGamesFor, partnerGamePath, partnerLocales } from '../src/partner-games.mjs';
import { catalogueFor, gameCount, gamesPath, genrePath, playedGamesPath, tagPath, tagsPath, taxonomyFor } from '../src/discovery.mjs';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = await walk(dist), htmlFiles = files.filter(file => file.endsWith('.html'));
const runtimePaths = new Set(['/play/mahjong/', '/play/marble-sort/', '/play/screw-sort/']);
const historyPaths = new Set(languageCodes.map(code => localPath(code, playedGamesPath('en'))));
const partnerPages = new Map(languageCodes.flatMap(code => partnerGamesFor(code).map(game => [localPath(code, partnerGamePath('en', game)), game])));
const sharedTags = catalogueFor('en', true).byTag;
const sharedGenres = catalogueFor('en', true).byGenre;
const englishOnlyRoutes = new Set([
  ...partnerGames.filter(game => !game.details.hi).map(game => partnerGamePath('en', game)),
  ...[...catalogueFor('en').byTag.keys()].filter(id => !sharedTags.has(id)).map(id => tagPath('en', id)),
  ...[...catalogueFor('en').byGenre.keys()].filter(id => !sharedGenres.has(id)).map(id => genrePath('en', id)),
]);
const indexable = new Set();
let checkedLinks = 0;
const checkedTargets = new Set();
const imageDimensions = new Map();
async function localTarget(value, page) {
  const url = new URL(value.replace(/&amp;/g, '&'), origin + page);
  if (url.origin !== origin) return;
  checkedLinks++;
  const key = url.pathname + url.hash;
  if (checkedTargets.has(key)) return;
  let target = path.join(dist, decodeURIComponent(url.pathname));
  try { if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html'); }
  catch { assert.fail(`Missing file: ${value} on ${page}`); }
  await stat(target);
  if (url.hash && target.endsWith('.html')) {
    const content = await readFile(target, 'utf8');
    assert.ok(content.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor: ${value} on ${page}`);
  }
  checkedTargets.add(key);
}

async function pngDimensions(imagePath) {
  if (!imageDimensions.has(imagePath)) {
    const png = await readFile(path.join(dist, imagePath));
    imageDimensions.set(imagePath, [png.readUInt32BE(16), png.readUInt32BE(20)]);
  }
  return imageDimensions.get(imagePath);
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const page = '/' + path.relative(dist, file).replace(/index\.html$/, '');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate ID: ${page}`);
  for (const [, value] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) await localTarget(value, page);
  for (const [, body] of html.matchAll(/<script type="(?:application\/ld\+json|importmap)"[^>]*>([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(body);
    if (data.imports) for (const value of Object.values(data.imports)) await localTarget(value, page);
  }
  for (const [, attributes] of html.matchAll(/<img\b([^>]+)>/g)) {
    const value = attributes.match(/src="([^"]+)"/)?.[1];
    const imagePath = value && new URL(value.replace(/&amp;/g, '&'), origin + page).pathname;
    if (!imagePath?.endsWith('.png')) continue;
    const [width, height] = await pngDimensions(imagePath);
    assert.equal(Number(attributes.match(/\bwidth="(\d+)"/)?.[1]), width, `Image width: ${page}/${value}`);
    assert.equal(Number(attributes.match(/\bheight="(\d+)"/)?.[1]), height, `Image height: ${page}/${value}`);
  }
  if (runtimePaths.has(page)) {
    assert.match(html, /name="robots" content="noindex, follow"/);
    continue;
  }
  if (page.includes('coming-soon')) continue;
  assert.match(html, /class="discovery-nav"/, `Shared navigation: ${page}`);
  assert.match(html, /<details class="language-picker">/, `Language picker: ${page}`);
  if (historyPaths.has(page)) {
    assert.match(html, /name="robots" content="noindex, follow"/, `Search indexing disabled: ${page}`);
  } else {
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*\bnoindex\b/, `Search indexing enabled: ${page}`);
    indexable.add(origin + page);
  }
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `Single H1: ${page}`);
  assert.ok(html.includes(`<link rel="canonical" href="${origin + page}">`), `Canonical: ${page}`);
  const partnerGame = partnerPages.get(page);
  const code = pageLanguage(page);
  assert.ok(html.includes(`<html lang="${code === 'en' ? 'en-IN' : code}">`), `HTML language: ${page}`);
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map(([, language, url]) => [language, url]);
  assert.deepEqual(Object.fromEntries(alternates), Object.fromEntries(Object.entries(pageAlternates(code, page, englishOnlyRoutes.has(page))).map(([language, route]) => [language, origin + route])), `Language alternates: ${page}`);
  if (page.endsWith('/games/screw-sort/')) {
    assert.equal([...html.matchAll(/<details>/g)].length, 9, `FAQ count: ${page}`);
    const rows = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
    assert.equal([...rows.matchAll(/<tr>/g)].length, levels.length, `Level count: ${page}`);
    for (const level of levels) assert.ok(rows.includes(`<td>${level.screws}</td><td>${level.layers}</td><td>${level.colours}</td>`), `Catalogue mismatch: ${page}/${level.id}`);
  }
  const coverPath=html.match(/property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(coverPath,`Share image: ${page}`);
  const coverUrl = new URL(coverPath);
  let width;
  let height;
  if (partnerGame) {
    assert.equal(coverUrl.origin + coverUrl.pathname, origin + partnerGame.artwork, `Share image source: ${page}`);
    ({ artworkWidth: width, artworkHeight: height } = partnerGame.media);
    await localTarget(coverPath, page);
  } else {
    const cover=await readFile(path.join(dist,coverUrl.pathname));
    const isSvg=coverUrl.pathname.endsWith('.svg');
    width=isSvg?Number(cover.toString().match(/width="(\d+)"/)[1]):cover.readUInt32BE(16);
    height=isSvg?Number(cover.toString().match(/height="(\d+)"/)[1]):cover.readUInt32BE(20);
  }
  assert.ok(html.includes(`property="og:image:width" content="${width}"`),`Share image width: ${page}`);
  assert.ok(html.includes(`property="og:image:height" content="${height}"`),`Share image height: ${page}`);
}
for (const language of languageCodes) {
  const manifestPath = localPath(language, '/manifest.webmanifest');
  const manifest = JSON.parse(await readFile(path.join(dist, manifestPath), 'utf8'));
  assert.equal(manifest.id, '/', `Installation identity: ${language}`);
  assert.equal(manifest.start_url, localPath(language, '/games/screw-sort/'), `Installation URL: ${language}`);
  assert.equal(manifest.lang, language === 'en' ? 'en-IN' : language, `Installation language: ${language}`);
  await localTarget(manifest.start_url, manifestPath);
  const slug = language.toLowerCase();
  for (const family of ['search', 'recommendations']) {
    const catalogue = JSON.parse(await readFile(path.join(dist, 'assets', `game-${family}-${slug}.json`), 'utf8'));
    assert.deepEqual(catalogue.map(entry => entry.href), catalogueFor(language === 'hi' ? 'hi' : 'en', language !== 'en').games.map(game => language === 'hi' ? game.href : localPath(language, game.href)), `Catalogue routes: ${family}/${language}`);
    for (const entry of catalogue) {
      assert.equal(pageLanguage(entry.href), language, `Catalogue route: ${family}/${language}/${entry.href}`);
      await localTarget(entry.href, '/');
    }
  }
}
for (const route of englishOnlyRoutes) {
  for (const code of languageCodes.filter(code => code !== 'en')) {
    await assert.rejects(stat(path.join(dist, localPath(code, route))), { code: 'ENOENT' }, `English-only route: ${code}/${route}`);
  }
}
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
assert.equal(sitemapUrls.length, indexable.size, 'Sitemap URL count');
assert.deepEqual(new Set(sitemapUrls), indexable, 'Sitemap contains only indexable pages');
for (const url of sitemapUrls) await localTarget(url, '/');
function pageCopy(html) {
  const copy = new Set();
  function visit(node) {
    if (node.nodeName === '#text' && !['script', 'style'].includes(node.parentNode?.tagName)) {
      copy.add(node.value.trim());
    }
    if (node.tagName === 'meta' && node.attrs.some(attr => attr.name === 'name' && attr.value === 'description')) {
      copy.add(node.attrs.find(attr => attr.name === 'content')?.value);
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(html));
  return copy;
}

const sitemapSet = new Set(sitemapUrls);
for (const [code, locale] of Object.entries(partnerLocales)) {
  const catalogPath = path.join(dist, 'assets', `game-search-${code.toLowerCase()}.json`);
  const search = JSON.parse(await readFile(catalogPath, 'utf8'));
  for (const game of partnerGamesFor(code).filter(game => Object.hasOwn(locale.games, game.id))) {
    const route = localPath(code, partnerGamePath('en', game));
    const html = await readFile(path.join(dist, route, 'index.html'), 'utf8');
    const copy = game.details[code];
    assert.ok(sitemapSet.has(origin + route), `Localized game in sitemap: ${route}`);
    assert.ok(search.some(entry => entry.href === route && entry.keywords.includes(game.category[code])), `Localized game in search: ${route}`);
    const renderedCopy = pageCopy(html);
    for (const text of [copy.searchTitle + ' | tapmelo', copy.summary, ...copy.about, ...copy.steps.flat(), ...copy.faq.flat()]) {
      assert.ok(renderedCopy.has(text), `Authored localized game copy: ${route} / ${text}`);
    }
  }
}

function checkDetailLayout(html, page, hasMedia = true) {
  const sections = ['detail-player', 'detail-discovery', 'detail-title-block', 'detail-media', 'detail-about', 'detail-how', 'detail-faq', 'detail-rail'];
  const positions = sections.filter(section => hasMedia || section !== 'detail-media').map(section => html.indexOf('class="' + (['detail-title-block', 'detail-media', 'detail-about', 'detail-how', 'detail-faq'].includes(section) ? 'detail-block ' : '') + section + '"'));
  assert.ok(positions.every((position, index) => position >= 0 && (!index || position > positions[index - 1])), 'Standard detail layout: ' + page);
  assert.match(html, /class="detail-instruction"/, 'Game has instructions: ' + page);
  assert.match(html, /class="detail-block detail-faq"[\s\S]*?<details><summary>/, 'Game has FAQs: ' + page);
}

for (const lang of ['en']) {
  const prefix = '';
  const { games, byGenre, byTag } = catalogueFor(lang);
  const readPage = route => readFile(path.join(dist, route, 'index.html'), 'utf8');
  const tileIds = html => [...html.matchAll(/class="collection-game" id="([^"]+)"/g)].map(match => match[1]);
  const tagIndex = await readPage(tagsPath(lang));
  assert.deepEqual(tileIds(await readPage(gamesPath(lang))), games.map(game => game.id));
  for (const [id, matches] of byGenre) {
    assert.deepEqual(tileIds(await readPage(genrePath(lang, id))), matches.map(game => game.id), `Category membership: ${id}/${lang}`);
  }
  for (const [id, matches] of byTag) {
    assert.deepEqual(tileIds(await readPage(tagPath(lang, id))), matches.map(game => game.id), `Tag membership: ${id}/${lang}`);
    const tagLink = tagIndex.split(`href="${tagPath(lang, id)}"`)[1]?.split('</a>')[0];
    assert.ok(tagLink?.includes(`>${gameCount(lang, matches.length)}</span>`), `Tag count: ${id}/${lang}`);
  }
  const home = await readFile(path.join(dist, prefix, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /discovery-hero|discovery-filters|home-questions/, 'Homepage only shows the game grid');
  const tiles = [...home.matchAll(/class="collection-game" id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(tiles, ['clock-out', 'glass-twist', 'mahjong', ...partnerGames.map(game => game.id)]);
  for (const game of partnerGames) {
    const gamePath = partnerGamePath(lang, game);
    assert.ok(home.includes(`href="${gamePath}"`), `Partner game card link: ${gamePath}`);
    const player = await readFile(path.join(dist, gamePath, 'index.html'), 'utf8');
    const screenshots = game.media.screenshots ?? [];
    const hasMedia = game.provider !== '1games' || Boolean(game.preview) || screenshots.length > 0;
    checkDetailLayout(player, gamePath, hasMedia);
    if (game.provider === '1games') {
      const media = player.match(/<section class="detail-block detail-media">[\s\S]*?<\/section>/)?.[0];
      assert.equal(Boolean(media), hasMedia, `1Games media section presence: ${gamePath}`);
      assert.equal(Boolean(media?.match(/<video\b[^>]*\bcontrols\b/)), Boolean(game.preview), `1Games playable video: ${gamePath}`);
      const imageSources = [...(media ?? '').matchAll(/<img\s+src="([^"]+)"/g)].map(([, src]) => src);
      assert.deepEqual(imageSources, screenshots.map(({ src }) => src), `1Games media shows only registered screenshots as images: ${gamePath}`);
    }
    assert.match(player, /class="detail-tile"[^>]+data-game-tile[^>]*>\s*<span class="game-tile-art">\s*<img[^>]*>\s*(?:<video[^>]*><\/video>\s*)?<span class="game-tile-label">/, 'Recommendation labels are inside the artwork');
    const { categories, tags } = taxonomyFor(game);
    const breadcrumb = player.match(/class="discovery-breadcrumb"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(breadcrumb?.includes(`href="${gamesPath(lang)}"`) && breadcrumb.includes(`href="${genrePath(lang, categories[0])}"`), `Game breadcrumb: ${gamePath}`);
    for (const id of tags) assert.ok(player.includes(`href="${tagPath(lang, id)}"`), `Game tag: ${id}/${gamePath}`);
    const frameUrl = player.match(/<iframe\b[^>]*\bsrc="([^"]+)"/)?.[1];
    assert.equal(frameUrl?.replaceAll('&amp;', '&'), game.url, `Exact partner link: ${gamePath}`);
  }
  const mahjong = await readFile(path.join(dist, prefix, 'games/mahjong/index.html'), 'utf8');
  assert.equal((mahjong.match(/class="game-guide-link"/g) || []).length, 7, 'seven guides');
}
for (const code of languageCodes) {
  const prefix = languagePrefix(code).slice(1);
  const home = await readFile(path.join(dist, prefix, 'index.html'), 'utf8');
  assert.doesNotMatch(home, /<iframe\b/, `Homepage does not start embedded games: ${code}`);
  for (const slug of ['marble-sort', 'screw-sort', 'mahjong']) {
    const detail = await readFile(path.join(dist, prefix, 'games', slug, 'index.html'), 'utf8');
    checkDetailLayout(detail, prefix + '/' + slug);
    assert.match(detail, new RegExp(`data-src="/play/${slug}/\\?[^"]*lang=${code}(?:&amp;|")`), `Supported iframe language: ${code}/${slug}`);
    assert.match(detail, /class="detail-native-runtime"/, 'Original game retains its local loader: ' + slug);
  }
  const marble=await readFile(path.join(dist,prefix,'games/marble-sort/index.html'),'utf8');
  assert.equal((marble.match(/class="game-guide-link"/g)||[]).length,marbleGuides.length,'four Marble Sort guides');
  assert.ok(marble.includes('/assets/marble-embed.js?v='),'Marble Sort embed controller');
  assert.ok(marble.includes('/play/marble-sort/?embed=1&amp;lang='),'same-origin Marble Sort iframe');
  for(const a of marbleGuides) {
    const article=await readFile(path.join(dist,prefix,'guides/marble-sort',a.id,'index.html'),'utf8');
    assert.match(article, /<article\b/, 'Static guide content');
    if (code === 'en') for (const title of a.sections.map(s => s.title.en)) assert.ok(article.includes(title), 'English guide headings');
  }
}
for(const file of ['tests','README.md','package.json']) {
  await assert.rejects(stat(path.join(dist,'play/marble-sort',file)),{code:'ENOENT'},'development files excluded');
}
console.log(`Checked ${htmlFiles.length} HTML files, ${checkedLinks} local links, image dimensions, JSON-LD, level counts, sitemap and locale declarations.`);
