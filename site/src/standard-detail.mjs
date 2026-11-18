import { locales } from './locales.mjs';
import { catalogueFor, discoveryIcon, gamesLabel, gamesPath, genrePath, genres, tagName, tagPath, taxonomyFor } from './discovery.mjs';
import { renderGameTile } from './game-tile.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const expand = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const backArrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6-6 6 6 6m-6-6h16"/></svg>';
const helpIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.8 8.2a3.3 3.3 0 1 1 5.5 2.45c-1.46 1.27-2.3 1.6-2.3 3.35m0 3.25v.25"/></svg>';
const retryIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5m5-.5A8 8 0 1 0 19 17"/></svg>';

const renderRecommendation = (item, loading = 'lazy') => renderGameTile(item, { recommendation: true, loading });

const labels = {
  "en": {
    "player": "Game player",
    "preview": "Gameplay preview",
    "play": "Play now",
    "pausePreview": "Pause preview",
    "resumePreview": "Play preview",
    "showControls": "Show game controls",
    "menu": "Game menu",
    "back": "Back to details",
    "home": "Home",
    "search": "Search",
    "fullscreen": "Fullscreen",
    "exitFullscreen": "Exit fullscreen",
    "help": "Game help",
    "closeHelp": "Close game help",
    "loading": "Loading game…",
    "loadError": "The game couldn’t load. Try again or return to the details.",
    "loadTimeout": "The game is taking longer than expected.",
    "showPlayer": "Show player",
    "retry": "Retry",
    "reload": "Reload game",
    "helpSearch": "Search gameplay and FAQs",
    "empty": "No matching tips or questions.",
    "discover": "Discover more games",
    "media": "A look at the game",
    "about": "About the game",
    "how": "How to play",
    "controls": "Controls",
    "faq": "Frequently asked questions",
    "faqSingle": "A common question",
    "more": "More games",
    "loadMore": "Load more games",
    "guides": "Game guides"
  },
  "hi": {
    "player": "गेम प्लेयर",
    "preview": "खेल का वीडियो",
    "play": "खेलें",
    "pausePreview": "वीडियो रोकें",
    "resumePreview": "वीडियो चलाएँ",
    "showControls": "खेल के नियंत्रण दिखाएँ",
    "menu": "खेल मेन्यू",
    "back": "विवरण पर वापस जाएँ",
    "home": "होम",
    "search": "खोजें",
    "fullscreen": "फ़ुल स्क्रीन",
    "exitFullscreen": "फ़ुल स्क्रीन से बाहर जाएँ",
    "help": "खेल में मदद",
    "closeHelp": "मदद बंद करें",
    "loading": "गेम लोड हो रहा है…",
    "loadError": "गेम लोड नहीं हो सका। दोबारा कोशिश करें या विवरण पर लौटें।",
    "loadTimeout": "गेम लोड होने में ज़्यादा समय लग रहा है।",
    "showPlayer": "प्लेयर दिखाएँ",
    "retry": "दोबारा कोशिश करें",
    "reload": "गेम फिर से लोड करें",
    "helpSearch": "खेलने का तरीका और सवाल खोजें",
    "empty": "कोई नतीजा नहीं मिला।",
    "discover": "और खेल खोजें",
    "media": "खेल की झलक",
    "about": "खेल के बारे में",
    "how": "कैसे खेलें",
    "controls": "नियंत्रण",
    "faq": "अक्सर पूछे जाने वाले सवाल",
    "faqSingle": "एक आम सवाल",
    "more": "और खेल",
    "loadMore": "और गेम लोड करें",
    "guides": "खेल की गाइड"
  }
};

const metadataLabels = {
  en: { platforms: 'Platforms', languages: 'Game languages', purchases: 'In-game purchases', tags: 'Tags', genres: 'Categories', cover: 'Cover art', developer: 'Developer', browser: 'Web browser', Yes: 'Yes', No: 'No' },
  hi: { platforms: 'प्लैटफ़ॉर्म', languages: 'गेम की भाषाएँ', purchases: 'गेम के अंदर खरीदारी', tags: 'टैग', genres: 'श्रेणियाँ', cover: 'कवर चित्र', developer: 'डेवलपर', browser: 'वेब ब्राउज़र', Yes: 'हाँ', No: 'नहीं' },
};
const platformNames = {
  'For Android': ['Android', 'Android'],
  'For IOS': ['iOS', 'iOS'],
  'For Desktop': ['Desktop', 'कंप्यूटर'],
};

function renderMetadata(lang, game, taxonomy) {
  const { metadata } = game;
  const label = metadataLabels[lang];
  const languageNames = new Intl.DisplayNames([lang], { type: 'language' });
  const rows = [
    [label.developer, metadata ? [] : ['Jelly']],
    [label.platforms, [label.browser, ...(metadata?.mobileReady ?? []).map(platform => platformNames[platform]?.[lang === 'hi' ? 1 : 0] ?? platform)]],
    [label.languages, (metadata?.supportedLanguages ?? ['en', 'hi']).map(code => {
      try { return languageNames.of(code); } catch { return code; }
    })],
    [label.purchases, metadata ? [label[metadata.inGamePurchases]] : []],
  ];
  const { byTag } = catalogueFor(lang);
  return `<dl class="detail-metadata">
    ${rows.filter(([, values]) => values.length).map(([name, values]) => `<div><dt>${name}</dt><dd>${values.map(escape).join(' · ')}</dd></div>`).join('')}
    <div class="detail-metadata-tags"><dt>${label.genres}</dt><dd><ul>${taxonomy.categories.map(id => `<li><a href="${genrePath(lang, id)}">${genres[id][lang]}</a></li>`).join('')}</ul></dd></div>
    ${taxonomy.tags.length ? `<div class="detail-metadata-tags"><dt>${label.tags}</dt><dd><ul>${taxonomy.tags.map(id => `<li><a href="${tagPath(lang, id)}" lang="en">${escape(tagName(id))} <span class="detail-tag-count">${byTag.get(id).length}</span></a></li>`).join('')}</ul></dd></div>` : ''}
  </dl>`;
}

function recommendGames(lang, game) {
  const { categories } = taxonomyFor(game);
  return catalogueFor(lang).games
    .filter(item => item.id !== game.id)
    .map(item => ({
      item,
      weight: item.categories[0] === categories[0] ? 20 : item.categories.some(category => categories.includes(category)) ? 7 : 1,
    }))
    .sort((left, right) => right.weight - left.weight);
}

export function renderStandardDetail(lang, game, {
  title = [game.title], category = game.category[lang], aboutTitle, about, steps, controls, faq,
  faqId = 'faq', runtime, guides = [], introLinks = [], guideExtras = '',
}) {
  const label = labels[lang];
  const taxonomy = taxonomyFor(game);
  const primary = taxonomy.categories[0];
  const cover = game.artwork || game.cover;
  const width = game.media?.artworkWidth ?? game.width;
  const height = game.media?.artworkHeight ?? game.height;
  const coverDimensions = ` width="${width}" height="${height}"`;
  const showArtwork = !game.preview || !game.media?.artworkAsPosterOnly;
  const recommendations = recommendGames(lang, game).slice(0, 18).map(({ item }) => item);

  return `<main id="main" class="detail-layout" tabindex="-1">
    <div class="detail-main">
      <section id="play" class="detail-player" aria-label="${escape(game.title)} · ${label.player}" data-game="${escape(game.id)}" data-fullscreen-label="${label.fullscreen}" data-exit-fullscreen-label="${label.exitFullscreen}">
        <div class="detail-screen">
          <div class="detail-launch">
            ${game.preview ? `<video class="detail-preview" src="${escape(game.preview)}" poster="${escape(cover)}" muted playsinline loop preload="none" aria-label="${label.preview}"></video>` : `<img class="detail-preview" src="${escape(cover)}"${coverDimensions} alt="" fetchpriority="high">`}
            <div class="detail-launch-content">
              <img src="${escape(game.cover)}" width="${game.width}" height="${game.height}" alt="">
              <h1${runtime ? '' : ' translate="no" lang="en"'}>${escape(title[0])}${title[1] ? ` <span>${escape(title[1])}</span>` : ''}</h1>
              <button class="detail-play" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>${label.play}</button>
            </div>
            ${game.preview ? `<button class="detail-preview-toggle" type="button" data-pause-label="${label.pausePreview}" data-play-label="${label.resumePreview}">${label.resumePreview}</button>` : ''}
          </div>
          ${runtime ? `<div class="detail-native-runtime" data-layout="${runtime.layout}" hidden>${runtime.html}</div>` : `
            <template><iframe title="${escape(game.title)}" src="${escape(game.url)}" allow="autoplay; fullscreen"></iframe></template>
            <div class="detail-partner-status" data-loading="${label.loading}" data-error="${label.loadError}" data-timeout="${label.loadTimeout}" hidden>
              <p role="status" tabindex="-1"></p>
              <div hidden>
                <button type="button" data-partner-retry>${label.retry}</button>
                <button type="button" data-partner-show hidden>${label.showPlayer}</button>
                <button type="button" data-partner-back>${label.back}</button>
              </div>
            </div>`}
          <button class="detail-menu-toggle is-tucked" data-edge="left" type="button" aria-label="${label.showControls}" data-show-label="${label.showControls}" data-menu-label="${label.menu}" aria-controls="detail-game-menu" aria-expanded="false" hidden><img src="/favicon-fox.png" width="96" height="96" alt=""></button>
          <div id="detail-game-menu" class="detail-game-menu" inert>
            <button type="button" data-game-details aria-label="${label.back}" title="${label.back}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6M9 12h11"/></svg></button>
            <a href="${locales[lang].home}" aria-label="${label.home}" title="${label.home}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10"/></svg></a>
            <button type="button" data-game-search aria-label="${label.search}" title="${label.search}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/></svg></button>
          </div>
        </div>
        <div class="detail-player-bar">
          <div class="detail-bar-title">
            <button class="detail-bar-back" type="button" aria-label="${label.back}" title="${label.back}" hidden>${backArrow}</button>
            <img src="${escape(game.cover)}" width="${game.width}" height="${game.height}" alt=""><strong>${escape(game.title)}</strong>
          </div>
          <div class="detail-bar-controls">
            ${runtime ? '' : `<button class="detail-bar-reload" type="button" aria-label="${label.reload}" title="${label.reload}" hidden>${retryIcon}</button>`}
            <button class="detail-bar-help" type="button" aria-label="${label.help}" title="${label.help}" aria-haspopup="dialog" aria-controls="detail-help" hidden>${helpIcon}</button>
            <button class="detail-fullscreen" type="button" aria-label="${label.fullscreen}" aria-pressed="false">${expand}</button>
          </div>
        </div>
        <dialog class="detail-help-drawer" id="detail-help" aria-labelledby="detail-help-title">
          <header>
            <h2 id="detail-help-title">${label.help}</h2>
            <form method="dialog"><button type="submit" aria-label="${label.closeHelp}">×</button></form>
          </header>
          <label class="detail-help-search">${label.helpSearch}<input type="search" autocomplete="off"></label>
          <p class="detail-help-empty" role="status" hidden>${label.empty}</p>
          <div class="detail-help-content"></div>
        </dialog>
      </section>
      <nav class="detail-discovery" aria-label="${label.discover}">
        ${recommendations.slice(0, 6).map(item => renderRecommendation(item)).join('')}
      </nav>
      <div class="detail-blocks">
        <section class="detail-block detail-title-block">
          <nav class="discovery-breadcrumb" aria-label="${lang === 'hi' ? 'गेम का पथ' : 'Game breadcrumb'}"><a href="${gamesPath(lang)}">${gamesLabel(lang)}</a>${discoveryIcon('next')}<a href="${genrePath(lang, primary)}">${genres[primary][lang]}</a></nav>
          <div class="detail-info-title">
            <img src="${escape(game.cover)}" width="${game.width}" height="${game.height}" alt="" loading="lazy">
            <div><h2>${escape(game.title)}</h2><p class="detail-category">${escape(category)}</p></div>
          </div>
          ${renderMetadata(lang, game, taxonomy)}
        </section>
        <section class="detail-block detail-media">
          <h2>${label.media}</h2>
          <div class="detail-media-grid">
            ${showArtwork ? `<figure class="detail-artwork">
              <img src="${escape(cover)}"${coverDimensions} alt="${escape(game.title)}" loading="lazy" decoding="async">
              <figcaption>${metadataLabels[lang].cover}</figcaption>
            </figure>` : ''}
            ${game.preview ? `<figure class="detail-media-preview">
              <video src="${escape(game.preview)}" poster="${escape(cover)}" controls playsinline preload="none" aria-label="${label.preview}"></video>
              <figcaption>${label.preview}</figcaption>
            </figure>` : ''}
          </div>
        </section>
        <section class="detail-block detail-about">
          <h2>${escape(aboutTitle || label.about)}</h2>
          ${about.map(paragraph => `<p>${escape(paragraph)}</p>`).join('')}
        </section>
        <section id="how-to-play" class="detail-block detail-how">
          <h2>${label.how}</h2>
          ${steps.map(([heading, body]) => `<div class="detail-instruction"><h3>${escape(heading)}</h3><p>${escape(body)}</p></div>`).join('')}
          ${controls ? `<div class="detail-controls"><strong>${label.controls}</strong><span>${escape(controls)}</span></div>` : ''}
        </section>
        <section id="${faqId}" class="detail-block detail-faq">
          <h2>${faq.length === 1 ? label.faqSingle : label.faq}</h2>
          ${faq.map(([question, answer]) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join('')}
        </section>
        ${guides.length || introLinks.length || guideExtras ? `<section class="detail-block detail-guides" id="guides">
          <h2>${label.guides}</h2>
          <ul class="game-guide-links">
            ${guides.map(({ href, title, description }) => `<li><a class="game-guide-link" href="${escape(href)}"><span><strong>${escape(title)}</strong><span>${escape(description)}</span></span></a></li>`).join('')}
            ${introLinks.map(({ href, label }) => `<li><a class="detail-extra-link" href="${escape(href)}">${escape(label)}</a></li>`).join('')}
          </ul>
          ${guideExtras}
        </section>` : ''}
      </div>
    </div>
    <aside class="detail-rail" aria-label="${label.more}" data-catalogue="/assets/game-recommendations-${lang}.json"
      data-game="${escape(game.id)}" data-categories="${taxonomy.categories.join(' ')}">
      ${recommendations.slice(6).map(item => renderRecommendation(item)).join('')}
      <button class="detail-rail-more" type="button" hidden>${label.loadMore}</button>
      <noscript><a class="detail-rail-more" href="${genrePath(lang, primary)}">${label.more}</a></noscript>
    </aside>
  </main>`;
}
