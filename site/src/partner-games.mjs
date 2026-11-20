import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const providers = ['1games', 'playgama'];
const catalogue = providers.flatMap(provider =>
  JSON.parse(readFileSync(new URL(`./${provider}-games.json`, import.meta.url), 'utf8'))
    .map(game => ({ ...game, provider })));
const ids = new Set();
const isText = value => typeof value === 'string' && value.trim().length > 0;
const isPair = value => Array.isArray(value) && value.length === 2 && value.every(isText);
const asset = value => typeof value === 'string' && (
  /^\/assets\/[a-z0-9./_-]+\.(?:png|jpg|svg|mp4|webp)$/i.test(value) && !value.includes('..') ||
  URL.canParse(value) && new URL(value).protocol === 'https:'
);

export const partnerGames = catalogue.map(game => {
  const { id, media, metadata, provider } = game;
  assert.match(id, /^[a-z0-9]+(?:-+[a-z0-9]+)*-?$/);
  assert.ok(!ids.has(id), 'Duplicate partner game: ' + id);
  ids.add(id);
  assert.ok(isText(game.title) && URL.canParse(game.url) && new URL(game.url).protocol === 'https:', 'Game title and HTTPS embed: ' + id);
  assert.ok(asset(media.icon) && asset(media.artwork) && (!media.preview || asset(media.preview)), 'Playable media paths: ' + id);
  assert.ok([game.width, game.height, media.artworkWidth, media.artworkHeight].every(n => Number.isInteger(n) && n > 0), 'Image dimensions: ' + id);
  for (const field of ['genres', 'tags', 'mobileReady', 'supportedLanguages']) {
    assert.ok(Array.isArray(metadata[field]) && metadata[field].every(isText), 'Catalogue ' + field + ': ' + id);
  }
  if (provider === 'playgama') {
    assert.ok(Array.isArray(metadata.gender) && metadata.gender.every(isText), 'Catalogue gender: ' + id);
  }
  if (provider === 'playgama' || metadata.inGamePurchases !== undefined) {
    assert.ok(['Yes', 'No'].includes(metadata.inGamePurchases), 'Catalogue in-app purchases: ' + id);
  }
  for (const lang of game.details.hi ? ['en', 'hi'] : ['en']) {
    const copy = game.details[lang];
    assert.ok(isText(game.category[lang]) && isText(copy.summary), 'Localized title and summary: ' + id + '/' + lang);
    assert.ok(copy.about.length >= 2 && copy.about.every(isText) && copy.steps.length >= 2 && copy.steps.every(isPair) && copy.faq.length >= 1 && copy.faq.every(isPair), 'Complete localized details: ' + id + '/' + lang);
  }
  return { ...game, cover: media.icon, artwork: media.artwork, preview: media.preview ?? null };
});

export const partnerGamesFor = (lang, sharedOnly = false) =>
  lang === 'en' && !sharedOnly ? partnerGames : partnerGames.filter(game => game.details.hi);

export const partnerGamePath = (lang, game) => `${lang === 'hi' ? '/hi' : ''}/play/${game.provider}/${game.id}/`;
