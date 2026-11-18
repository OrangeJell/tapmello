import { languageCodes, languages, localPath, pageAlternates } from './languages.mjs';
import { renderStandardDetail } from './standard-detail.mjs';
import { catalogueFor, discoveryIcon, gameCount, gamesLabel, gamesPath, genrePath, genres, playedGamesLabel, playedGamesPath, renderCategoryLinks, renderDiscoveryNav, renderMobileDiscovery, tagName, tagPath, tagsLabel, tagsPath } from './discovery.mjs';
import { renderGameDetail } from './game-stage.mjs';
import { renderGameTile } from './game-tile.mjs';
import { levels, origin, screenshot, updated } from './game.mjs';
import { locales } from './locales.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const hindiInfoLabels = { about: 'परिचय', contact: 'संपर्क', privacy: 'गोपनीयता', terms: 'शर्तें' };
const infoLinks = [['about', 'About'], ['contact', 'Contact'], ['privacy', 'Privacy'], ['terms', 'Terms']];

function figure(name, caption, lang) {
  return `<figure class="guide-figure">
            <img src="${screenshot(name, lang)}" width="390" height="844" alt="${escape(caption)}" loading="lazy" decoding="async">
            <figcaption>${escape(caption)}</figcaption>
          </figure>`;
}

function sections(items) {
  return items.map(([title, body]) => `<section><h3>${escape(title)}</h3><p>${escape(body)}</p></section>`).join('\n');
}

export function renderHome(lang) {
  const hi = lang === 'hi';
  const { games } = catalogueFor(lang);
  const initialCount = 36;
  const batchSize = 18;
  const batches = [];
  for (let i = initialCount; i < games.length; i += batchSize) batches.push(games.slice(i, i + batchSize));

  return `<main id="main" class="shell collection-main" tabindex="-1">
    <h1 class="collection-heading">${gamesLabel(lang)}</h1>
    <section class="continue-playing" aria-labelledby="continue-playing-title" hidden>
      <h2 id="continue-playing-title"><a href="${playedGamesPath(lang)}">${hi ? 'खेलना जारी रखें' : 'Continue playing'}${discoveryIcon('next')}</a></h2>
      <div class="game-collection" data-played-games></div>
    </section>
    <div id="games" class="game-collection" tabindex="-1">
${games.slice(0, initialCount).map(game => renderGameTile(game)).join('\n')}
    </div>
${batches.map(batch => `    <template data-game-batch>${batch.map(game => renderGameTile(game, { loading: 'eager' })).join('\n')}</template>`).join('\n')}
${batches.length ? `    <span class="collection-heading" data-game-status role="status" data-single="${hi ? 'नए खेल: ' : 'Games added: '}"></span>
    <noscript><div class="game-collection" aria-label="${hi ? 'और खेल' : 'More games'}">
${games.slice(initialCount).map(game => `<a href="${escape(game.href)}"><img src="${escape(game.cover)}" alt="${escape(game.title)}" width="${game.width}" height="${game.height}" loading="lazy"></a>`).join('\n')}
    </div></noscript>` : ''}
  </main>`;
}

export function discoveryPages(lang) {
  const hi = lang === 'hi';
  const { games, byGenre, byTag, tags } = catalogueFor(lang);
  const page = (route, heading, description, main) => ({
    language: lang, kind: 'browse', path: route(lang), title: `${heading} | tapmelo`, description,
    alternates: { en: route('en'), hi: route('hi') }, main,
  });
  const listing = (route, heading, description, items, style = '', back = null) => page(route, heading, description, `<main id="main" class="shell collection-main browse-main" tabindex="-1">
    ${back ? `<nav class="discovery-breadcrumb" aria-label="${hi ? 'पेज का पथ' : 'Breadcrumb'}"><a href="${back[0]}">${back[1]}</a>${discoveryIcon('next')}<span aria-current="page">${escape(heading)}</span></nav>` : ''}
    <header class="browse-heading"${style}><h1>${escape(heading)}</h1><span class="browse-count">${gameCount(lang, items.length)}</span></header>
    ${back ? '' : renderCategoryLinks(lang)}
    <div class="game-collection" id="games" tabindex="-1">${items.map(game => renderGameTile(game)).join('')}</div>
  </main>`);
  const tagDescription = hi ? 'सभी टैग देखें और अपनी पसंद के गेम खोजें।' : 'Browse every tag, from game mechanics to themes. Pick one to see matching games.';
  const tagHeading = tagsLabel(lang);
  const playedHeading = playedGamesLabel(lang);
  const playedDescription = hi ? 'इस ब्राउज़र में खेले गए गेम देखें।' : 'Find the games you’ve played in this browser.';
  return [
    listing(gamesPath, gamesLabel(lang), hi ? 'tapmelo की पूरी गेम लाइब्रेरी देखें।' : 'Explore the full tapmelo library and play any game right in your browser.', games),
    { ...page(playedGamesPath, playedHeading, playedDescription, `<main id="main" class="shell collection-main browse-main" tabindex="-1">
      <header class="browse-heading"><h1>${playedHeading}</h1></header>
      <div class="game-collection" data-played-games></div>
      <p class="played-games-empty" data-played-empty>${hi ? 'आपके खेले गए गेम यहाँ दिखेंगे।' : 'Games you play will appear here.'} <a href="${gamesPath(lang)}">${hi ? 'गेम देखें' : 'Browse games'}</a></p>
      <template data-played-catalogue>${games.map(game => renderGameTile(game)).join('')}</template>
    </main>`), noindex: true },
    ...Object.values(genres).filter(genre => byGenre.has(genre.id)).map(genre => listing(
      language => genrePath(language, genre.id), genre[lang], hi ? `${genre.hi} श्रेणी के गेम ब्राउज़र में खेलें।` : `Explore ${genre.en.toLowerCase()} games you can play right in your browser.`,
      byGenre.get(genre.id), ` style="--browse-tint:${genre.fill};--browse-accent:${genre.ink}"`, [gamesPath(lang), gamesLabel(lang)],
    )),
    page(tagsPath, tagHeading, tagDescription, `<main id="main" class="shell collection-main browse-main" tabindex="-1">
      <header class="browse-heading"><div><h1>${tagHeading}</h1><p>${tagDescription}</p></div><span class="browse-count">${tags.length} ${hi ? 'टैग' : 'tags'}</span></header>
      <ul class="discovery-tags">${tags.map(id => `<li><a href="${tagPath(lang, id)}"><span lang="en">${escape(tagName(id))}</span><span class="tag-count">${gameCount(lang, byTag.get(id).length)}</span></a></li>`).join('')}</ul>
    </main>`),
    ...tags.map(id => listing(language => tagPath(language, id), tagName(id), hi ? `“${tagName(id)}” टैग वाले गेम।` : `Games tagged “${tagName(id)}”.`, byTag.get(id), '', [tagsPath(lang), tagHeading])),
  ];
}

export function renderPlaygama(lang, game) {
  return renderStandardDetail(lang, game, game.details[lang]);
}

export function renderGame(lang) {
  const c = locales[lang];
  const embed = `<div id="game-embed" class="embedded-game" data-state="loading">
      <iframe id="game-frame" title="${c.frameTitle}" src="/play/screw-sort/?embed=1&amp;lang=${lang}"></iframe>
      <div class="embed-message" role="status" aria-live="polite">
        <p id="embed-status">${c.loading}</p>
        <div id="embed-progress" class="embed-progress" role="progressbar" aria-label="${c.loadingLabel}"><span></span></div>
        <button id="embed-retry" class="embed-retry" type="button">${c.retry}</button>
      </div>
    </div>`;
  const guideExtras = `<div class="play-guide">
      <section id="strategy" class="guide-section">
        <div class="guide-section-heading"><h3>${c.strategyTitle}</h3></div>
        <div class="guide-split guide-split-reverse">
          <div class="strategy-list">${sections(c.tips)}</div>
          ${figure('tray-example', c.trayCaption, lang)}
        </div>
        <aside class="guide-callout"><h4>${c.jamTitle}</h4><p>${c.jam}</p></aside>
      </section>
      <section id="levels" class="guide-section">
        <div class="guide-section-heading"><h3>${c.levelsTitle}</h3></div>
        <div class="guide-split">
          ${figure('level-2', c.levelCaption, lang)}
          <div><p>${c.levelsIntro}</p>
            <div class="level-table-wrap"><table class="level-table">
              <caption>${c.tableCaption}</caption>
              <thead><tr>${c.columns.map(column => `<th scope="col">${column}</th>`).join('')}</tr></thead>
              <tbody>${levels.map(level => `<tr><th scope="row"><span>${String(level.id).padStart(2, '0')}</span> ${escape(level.name(lang))}</th><td>${level.screws}</td><td>${level.layers}</td><td>${level.colours}</td></tr>`).join('\n')}</tbody>
            </table></div>
          </div>
        </div>
      </section>
      <section id="rewards" class="guide-section">
        <div class="guide-section-heading"><h3>${c.rewardsTitle}</h3></div>
        <p>${c.rewardsIntro}</p>
        <div class="reward-grid">${sections(c.rewards)}</div>
        <p>${c.rewardReset}</p>
      </section>
    </div>`;
  return renderGameDetail(lang, {
    game: 'glass-twist', embed,
    aboutTitle: c.aboutTitle, about: c.about,
    genres: lang === 'hi' ? ['पहेली', 'रंग छाँटना'] : ['Puzzle', 'Colour sorting'],
    steps: c.steps,
    guides: [{ href: c.guide, title: c.walkthroughLabel, description: c.walkthroughIntro }],
    guideExtras,
    faq: c.faqs,
  });
}

function structuredData(page, c) {
  const url = origin + page.path;
  if (page.kind === 'home') return {
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'tapmelo', url,
    description: page.description, inLanguage: c.lang, publisher: { '@type': 'Person', name: 'Jelly' },
  };
  if (page.kind === 'guide') return {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', '@id': `${url}#article`, headline: page.headline,
        description: page.description, inLanguage: c.lang, datePublished: updated, dateModified: updated,
        mainEntityOfPage: url, author: { '@type': 'Person', name: 'Jelly' },
        image: ['level-2', 'level-2-opening', 'level-2-tray'].map(name => origin + screenshot(name, page.language)),
        about: { '@type': 'VideoGame', name: 'Glass Twist: Screw Puzzle', url: origin + c.game } },
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'tapmelo', item: origin + c.home },
        { '@type': 'ListItem', position: 2, name: 'Glass Twist: Screw Puzzle', item: origin + c.game },
        { '@type': 'ListItem', position: 3, name: c.walkthroughLabel, item: url },
      ] },
    ],
  };
  if (page.kind !== 'game') return null;
  return {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title,
        description: page.description, inLanguage: c.lang, dateModified: page.updated || updated,
        mainEntity: { '@id': `${url}#game` }, breadcrumb: { '@id': `${url}#breadcrumb` } },
      { '@type': ['VideoGame', 'WebApplication'], '@id': `${url}#game`, name: 'Glass Twist: Screw Puzzle', url,
        image: `${origin}${page.cover || '/assets/screw-sort-cover.png'}`,
        screenshot: ['first-level', 'tray-example', 'level-2'].map(name => origin + screenshot(name, page.language)),
        description: page.description, genre: ['Puzzle', 'Colour sorting'],
        applicationCategory: 'GameApplication', operatingSystem: 'Web browser',
        inLanguage: ['en', 'hi'], isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        publisher: { '@type': 'Person', name: 'Jelly' } },
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'tapmelo', item: origin + c.home },
        { '@type': 'ListItem', position: 2, name: 'Glass Twist: Screw Puzzle', item: url },
      ] },
    ],
  };
}

function renderSiteSearch(lang) {
  const hi = lang === 'hi';
  const name = hi ? 'खेल खोजें' : 'Search games';
  return `<div class="site-game-search" role="search" aria-label="${name}" data-catalogue="/assets/game-search-${lang}.json"
        data-loading="${hi ? 'खोज रहे हैं…' : 'Searching…'}"
        data-empty="${hi ? 'कोई खेल नहीं मिला।' : 'No matching games.'}"
        data-error="${hi ? 'खोज लोड नहीं हुई। दोबारा कोशिश करें।' : 'Search could not load. Try again.'}">
        <svg class="site-search-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
        <input type="search" role="combobox" aria-label="${name}" aria-autocomplete="list" aria-controls="site-search-options" aria-expanded="false" placeholder="${name}" autocomplete="off" spellcheck="false">
        <div class="site-search-popup" hidden>
          <div id="site-search-options" role="listbox" aria-label="${name}"></div>
          <p role="status" hidden></p>
        </div>
      </div>`;
}

export function renderPage(page, main) {
  const standardDetail = ['game', 'mahjong', 'marble', 'partner-play'].includes(page.kind);
  const c = locales[page.language || 'en'];
  const collection = ['home', 'browse'].includes(page.kind);
  const arcade = standardDetail || collection;
  const url = origin + page.path, json = page.structured || structuredData(page, c);
  const lang = page.language || 'en';
  const current = slug => page.path === localPath(lang, `/${slug}/`) ? ' aria-current="page"' : '';
  const alternates = pageAlternates(lang, page.path);
  const mobileDiscovery = renderMobileDiscovery(lang);
  const languageLabel = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
  const languageOptions = languageCodes.map(code => ({ code, label: languages[code].name, href: alternates[code] }));
  const languageNav = `<details class="language-picker">
          <summary aria-label="${c.chooseLanguage}">${languageLabel}</summary>
          <nav aria-label="${c.chooseLanguage}">${languageOptions.map(({ code, label, href }) =>
            `<a href="${href}" lang="${code}" hreflang="${code}"${code === lang ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        </details>`;
  const themeToggle = `<button type="button" class="theme-toggle" data-light-label="${c.lightMode}" data-dark-label="${c.darkMode}" hidden>
          <svg data-theme-icon="dark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 14.5A9.25 9.25 0 0 1 9.5 3.1a9.25 9.25 0 1 0 11.4 11.4Z"/></svg>
          <svg data-theme-icon="light" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" hidden><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>
        </button>`;
  return `<!doctype html>
<html lang="${c.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f8f7f2">
  <script src="/assets/site-theme.js"></script>
  <meta name="description" content="${escape(page.description)}">
${page.noindex ? '  <meta name="robots" content="noindex, follow">\n' : ''}  <title>${escape(page.title)}</title>
  <link rel="canonical" href="${url}">
${Object.entries(alternates).map(([code, href]) => `  <link rel="alternate" hreflang="${code}" href="${origin + href}">\n`).join('')}  <meta property="og:type" content="${['guide','mahjong-guide','marble-guide'].includes(page.kind) ? 'article' : 'website'}">
  <meta property="og:site_name" content="tapmelo">
  <meta property="og:locale" content="${languages[lang].og}">
${languageCodes.filter(code => code !== lang).map(code => `  <meta property="og:locale:alternate" content="${languages[code].og}">\n`).join('')}  <meta property="og:title" content="${escape(page.title)}">
  <meta property="og:description" content="${escape(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${origin}${page.cover || '/assets/screw-sort-cover.png'}">
  <meta property="og:image:width" content="${page.coverWidth || 1200}">
  <meta property="og:image:height" content="${page.coverHeight || 800}">
  <meta property="og:image:alt" content="${escape(page.coverAlt || c.coverAlt)}">
  <meta name="twitter:card" content="summary_large_image">
${json ? `  <script type="application/ld+json">${JSON.stringify(json).replace(/</g, '\\u003c')}</script>\n` : ''}  <link rel="icon" type="image/png" href="/favicon-fox.png" sizes="96x96">
  <link rel="apple-touch-icon" href="/assets/tapmelo-fox-180.png" sizes="180x180">
  <link rel="manifest" href="${page.language === 'hi' ? '/hi' : ''}/manifest.webmanifest">
  <link rel="preload" href="/assets/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/return-visit.css">
  <link rel="stylesheet" href="/assets/styles.css">
${arcade ? '  <link rel="stylesheet" href="/assets/arcade.css">\n  <link rel="stylesheet" href="/assets/home.css">\n  <script src="/assets/game-previews.js" defer></script>\n' : ''}${standardDetail ? '  <link rel="stylesheet" href="/assets/standard-detail.css">\n  <script src="/assets/standard-detail.js" defer></script>\n' : ''}  <script src="/assets/language-picker.js" defer></script>
${standardDetail || page.kind === 'home' || page.path === playedGamesPath(lang) ? '  <script src="/assets/played-games.js" defer></script>\n' : ''}  <link rel="stylesheet" href="/assets/site-search.css">
  <link rel="stylesheet" href="/assets/discovery.css">
  <script src="/assets/site-search.js" defer></script>
  <script src="/assets/discovery-nav.js" defer></script>
  <script src="/assets/analytics.js"></script>
  <script src="/assets/return-visit.js"></script>
</head>
<body class="discovery-shell ${standardDetail ? 'detail-page ' : ''}${page.kind}-page${arcade ? ' arcade-page' : ''}${standardDetail ? ' game-detail-page' : ''}">
  <a class="skip-link" href="#main">${c.skip}</a>
  <header class="site-header">
    <div class="header-inner has-compact-nav">
      ${mobileDiscovery.toggle}
      <a class="brand" href="${c.home}" aria-label="${c.homeLabel}"><span class="brand-mark"><img src="/favicon-fox.png" alt="" width="96" height="96"></span><span lang="en">tap<span class="brand-light">melo</span></span></a>
      ${renderSiteSearch(lang)}
      <div class="header-actions">
        ${page.kind === 'guide' ? `<button type="button" class="save-tapmelo" data-save-tapmelo>${c.save}</button>` : ''}
        <div class="header-preferences">${languageNav}${themeToggle}</div>
      </div>
    </div>
  </header>
${renderDiscoveryNav(lang, page.path)}
${mobileDiscovery.drawer}
${main}
  <footer class="site-footer">
    <div class="shell footer-inner">
      <p class="footer-note">${page.language==='hi'?'© 2026 tapmelo · Jelly की स्वतंत्र गेम साइट।':'© 2026 tapmelo · An independent game site by Jelly.'}</p>
      <nav class="footer-nav" aria-label="${c.footerLabel}">${infoLinks.map(([slug, label]) => `<a href="${localPath(lang, `/${slug}/`)}"${current(slug)}>${lang === 'hi' ? hindiInfoLabels[slug] : label}</a>`).join('')}</nav>
${c.footerLanguage ? `      <p class="footer-language-note">${c.footerLanguage}</p>\n` : ''}${page.kind === 'home' ? `      <div class="footer-links">
        <a class="footer-badge" href="https://fazier.com/launches/tapmelo.com" target="_blank" rel="noopener">
          <img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&amp;theme=neutral" width="160" height="38" alt="Fazier badge" loading="lazy">
        </a>
        <a class="footer-x" href="https://x.com/tapmelocom" target="_blank" rel="noopener noreferrer" aria-label="${c.footerXLabel}">
          <img src="/assets/x-logo.svg" width="22" height="22" alt="">
        </a>
      </div>
` : ''}    </div>
  </footer>
${page.kind === 'game' ? '  <script src="/assets/game-embed.js" defer></script>\n' : page.kind==='mahjong'?'  <script src="/assets/mahjong-embed.js" defer></script>\n':page.kind==='marble'?'  <script src="/assets/marble-embed.js" defer></script>\n':''}</body>
</html>
`;
}
