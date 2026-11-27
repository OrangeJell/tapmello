import assert from 'node:assert/strict';
import { parse, serialize } from 'parse5';
import { languages, localPath } from './languages.mjs';
import { origin } from './game.mjs';

const visibleAttributes = new Set([
  'alt', 'title', 'aria-label', 'placeholder', 'data-single', 'data-loading', 'data-empty',
  'data-error', 'data-timeout', 'data-light-label', 'data-dark-label', 'data-play-label',
  'data-pause-label', 'data-fullscreen-label', 'data-exit-fullscreen-label', 'data-show-label',
  'data-menu-label', 'data-failed', 'data-start', 'data-ready',
]);
const textMetadata = new Set(['description', 'og:title', 'og:description', 'og:image:alt']);
const jsonText = new Set(['name', 'headline', 'description', 'articleSection', 'genre', 'applicationCategory', 'operatingSystem', 'text']);
const placeholders = value => (value.match(/\{[a-z][a-z\d_]*\}/gi) ?? []).sort();
const translatableText = /[A-Za-z]/;

export function createLocalizer({ code, dictionary, source, routes, titles, editorialAliases = {}, gameNames = new Map() }) {
  function translate(value, location, bodyCopy) {
    const key = value.trim();
    if (gameNames.has(key)) return value.replace(key, () => gameNames.get(key));
    const override = bodyCopy?.[key];
    if ((!override && !translatableText.test(key)) || titles.has(key) || /^(?:https?:\/\/|mailto:)/.test(key)) return value;
    if (source) {
      source.add(key);
      return value;
    }
    // English editorial revisions can reuse the previous translation until that locale is edited.
    const translationKey = Object.hasOwn(dictionary, key) ? key : editorialAliases[key] ?? key;
    // Discovery totals vary with the catalogue. Reuse the locale's plural count wording.
    const total = /^([0-9]+) (games|tags)$/.exec(key);
    const pluralCount = total && dictionary[`2 ${total[2]}`];
    if (!Object.hasOwn(dictionary, translationKey) && pluralCount?.includes('2')) {
      return value.replace(key, () => pluralCount.replace('2', total[1]));
    }
    const translated = override ?? (Object.hasOwn(dictionary, translationKey) && dictionary[translationKey]);
    assert.ok(typeof translated === 'string' && translated.trim(), `Missing ${code} translation at ${location}: ${key}`);
    assert.deepEqual(placeholders(translated), placeholders(key), `Invalid ${code} placeholders at ${location}: ${key}`);
    return value.replace(key, () => translated);
  }

  function route(value) {
    const absolute = value.startsWith(origin + '/');
    const path = absolute ? value.slice(origin.length) : value;
    const match = path.match(/^(\/[^?#]*)(.*)$/);
    if (match && routes.has(match[1])) return (absolute ? origin : '') + localPath(code, match[1]) + match[2];
    return value;
  }

  function runtimeLanguage(value) {
    if (!/^\/play\/(?:mahjong|marble-sort|screw-sort)\/\?/.test(value)) return value;
    return value.replace(/([?&]lang=)en(?=&|#|$)/, (_, prefix) => prefix + code);
  }

  function translateJSON(value, location, translateText, key) {
    if (Array.isArray(value)) return key === 'inLanguage' ? value : value.map(item => translateJSON(item, location, translateText, key));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, translateJSON(item, location, translateText, field)]));
    }
    if (key === 'inLanguage' && ['en', 'en-IN'].includes(value)) return code;
    if (typeof value !== 'string') return value;
    if (jsonText.has(key)) return translateText(value, location);
    if (['url', '@id', 'item', 'mainEntityOfPage'].includes(key)) return route(value);
    return value;
  }

  function html(input, location, preserved = new Set()) {
    const document = parse(input, { scriptingEnabled: false });
    const infoPage = /^\/(?:about|contact|privacy|terms)\/$/.test(location);
    const textFor = bodyCopy => (value, context) => preserved.has(value.trim()) ? value : translate(value, context, bodyCopy);
    const translateMetadata = textFor();
    // Guide titles and leads can use different wording in the body and search metadata.
    const translateBody = dictionary?.body ? textFor(dictionary.body) : translateMetadata;
    function visit(node, translateText = translateMetadata) {
      if (node.tagName === 'body') translateText = translateBody;
      if (node.nodeName === '#text') {
        node.value = translateText(node.value, location);
        // The English spaces around inline links can split Japanese phrases and Korean particles.
        if (infoPage && node.parentNode.tagName === 'p') {
          if (code === 'ja' || code === 'zh-CN') node.value = node.value.trim();
          if (code === 'ko') node.value = node.value
            .replace(/^ +(?=[.,’]|(?:에서는|에서|로|도|의|입니다)(?:[ .]|$))/, '')
            .replace(/(?<=‘) +$/, '');
        }
        return;
      }
      const attr = name => node.attrs?.find(attribute => attribute.name === name)?.value;
      if (attr('translate') === 'no') return;
      const classes = (attr('class') ?? '').split(/\s+/);
      if (classes.includes('language-picker')) {
        // Native autonyms and routes come from the shared registry.
        const [summary, nav] = node.childNodes.filter(child => child.tagName);
        for (const element of [summary, nav]) {
          const label = element.attrs.find(attribute => attribute.name === 'aria-label');
          label.value = translate(label.value, location);
        }
        for (const link of nav.childNodes.filter(child => child.tagName === 'a')) {
          link.attrs = link.attrs.filter(attribute => attribute.name !== 'aria-current');
          if (link.attrs.some(attribute => attribute.name === 'hreflang' && attribute.value === code)) {
            link.attrs.push({ name: 'aria-current', value: 'page' });
          }
        }
        return;
      }
      const rel = attr('rel');
      const meta = attr('name') ?? attr('property');
      if (node.tagName === 'script') {
        if (attr('type') === 'application/ld+json') {
          const json = JSON.parse(node.childNodes[0].value);
          node.childNodes[0].value = JSON.stringify(translateJSON(json, location, translateMetadata)).replaceAll('<', '\\u003c');
        }
        return;
      }
      if (['style', 'svg', 'code', 'kbd'].includes(node.tagName)) return;
      if (node.tagName === 'meta' && meta === 'og:locale:alternate') {
        const content = node.attrs.find(attribute => attribute.name === 'content');
        if (content.value === languages[code].og) content.value = languages.en.og;
      }
      const tagLink = [node, node.parentNode].some(element =>
        element?.attrs?.some(attribute => attribute.name === 'href' && attribute.value.startsWith('/tags/')));
      const localizedGameName = classes.includes('game-tile-title') && gameNames.has(node.childNodes[0]?.value);
      for (const attribute of node.attrs ?? []) {
        const { name, value } = attribute;
        if (name === 'lang' && (node.tagName === 'html' || tagLink || localizedGameName)) {
          attribute.value = code;
        } else if (name === 'href' && rel !== 'alternate') {
          attribute.value = value === '/manifest.webmanifest' ? localPath(code, value) : runtimeLanguage(route(value));
        } else if (name === 'data-src') {
          attribute.value = runtimeLanguage(value);
        } else if (name === 'data-language' && attr('data-mahjong-embed') !== undefined) {
          attribute.value = code;
        } else if (name === 'data-catalogue') {
          attribute.value = value.replace(/-en\.json$/, `-${code.toLowerCase()}.json`);
        } else if (name === 'content' && meta === 'og:locale') {
          attribute.value = languages[code].og;
        } else if (name === 'content' && meta === 'og:url') {
          attribute.value = route(value);
        } else if (name === 'content' && textMetadata.has(meta)) {
          attribute.value = translateMetadata(value, `${location} @${name}`);
        } else if (visibleAttributes.has(name)) {
          attribute.value = translateText(value, `${location} @${name}`);
        }
      }
      for (const child of node.childNodes ?? []) visit(child, translateText);
      if (node.content) visit(node.content, translateText);
    }
    visit(document);
    return serialize(document);
  }

  function catalogue(entries) {
    return entries.map(entry => {
      const name = gameNames.get(entry.title);
      return {
        ...entry,
        href: route(entry.href),
        ...(name && { title: name, ...(entry.titleLang && { titleLang: code }) }),
        ...(entry.category && { category: translate(entry.category, `catalogue ${entry.id}`) }),
        ...(entry.keywords && {
          originalTitle: name ? entry.title : entry.originalTitle,
          keywords: [entry.keywords, name ? entry.title : '', ...entry.searchTerms.map(term => translate(term, `search ${entry.id}`))].filter(Boolean).join(' '),
          searchTerms: undefined,
        }),
      };
    });
  }

  return { html, catalogue, translate };
}

export const brandNames = new Set(['tap', 'melo', 'tapmelo', 'Jelly', 'Playgama', 'AZGames', 'AZGame', '1Games', '1Games.IO', '1games.io', 'ShapeRush.IO', 'X', 'Google Analytics', 'iOS', 'Android', 'Fazier', 'EN', 'HI', 'Chrome', 'Safari']);
