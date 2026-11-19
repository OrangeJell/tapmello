import { locales } from './locales.mjs';
import { gamesFor } from './game-catalog.mjs';
import { renderStandardDetail } from './standard-detail.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function renderEmbed(lang, game, { host, frame, title, src, loading }) {
  return `<div ${host} data-state="idle">
    <iframe id="${frame}" title="${escape(title)}" data-src="${escape(src)}" inert></iframe>
    <div class="game-loader">
      <img class="game-loader-art" src="${game.cover}" width="${game.width}" height="${game.height}" alt="">
      <p id="game-loader-status" class="game-loader-status" role="status" tabindex="-1">${escape(loading)}</p>
      <div class="game-loader-progress" role="progressbar" aria-labelledby="game-loader-status"><span></span></div>
      <button class="game-loader-retry" type="button" hidden>${locales[lang].retry}</button>
    </div>
  </div>`;
}

export function renderGameDetail(lang, {
  game, embed, aboutTitle, about, introLinks = [], genres, steps, guides, guideExtras = '', faq, faqId = 'faq', playerLayout = 'board', sharedOnly,
}) {
  const entry = gamesFor(lang).find(item => item.id === game);
  const playable = { ...entry, preview: '/assets/previews/' + entry.id + '.mp4' };
  return renderStandardDetail(lang, playable, {
    category: genres.join(' · '),
    aboutTitle, about,
    steps, faq, faqId, guides, introLinks, guideExtras, sharedOnly,
    runtime: { html: renderEmbed(lang, entry, embed), layout: playerLayout },
  });
}
