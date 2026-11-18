import { gamesFor } from './game-catalog.mjs';
import { renderStandardDetail } from './standard-detail.mjs';

export function renderGameDetail(lang, {
  game, embed, aboutTitle, about, introLinks = [], genres, steps, guides, guideExtras = '', faq, faqId = 'faq', playerLayout = 'board', sharedOnly,
}) {
  const entry = gamesFor(lang).find(item => item.id === game);
  const playable = { ...entry, preview: '/assets/previews/' + entry.id + '.mp4' };
  return renderStandardDetail(lang, playable, {
    category: genres.join(' · '),
    aboutTitle, about,
    steps, faq, faqId, guides, introLinks, guideExtras, sharedOnly,
    runtime: { html: embed.replace(' src=', ' data-src='), layout: playerLayout },
  });
}
