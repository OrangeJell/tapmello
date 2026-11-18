import { escapeDiscovery as escape } from './discovery.mjs';

export function renderGameTile({ id, title, titleLang, href, cover, width, height, category, preview }, { recommendation = false, loading = 'lazy' } = {}) {
  return `<a class="${recommendation ? 'detail-tile' : 'collection-game'}"${recommendation ? '' : ` id="${id}"`} href="${escape(href)}" data-game-tile data-game="${id}">
    <span class="game-tile-art">
      <img class="game-cover" src="${escape(cover)}" width="${width}" height="${height}" alt="" loading="${loading}" decoding="async">
      ${preview ? `<video class="game-tile-video" data-src="${escape(preview)}" preload="none" muted playsinline loop aria-hidden="true"></video>` : ''}
      <span class="game-tile-label"><span class="game-tile-title" lang="${titleLang}">${escape(title)}</span><span class="game-tile-category">${escape(category)}</span></span>
    </span>
  </a>`;
}
