(() => {
  const host = document.querySelector('[data-marble-embed]');
  const frame = document.querySelector('#marble-frame');
  if (!host || !frame) return;
  const status = host.querySelector('[data-marble-status]');
  const retry = host.querySelector('[data-marble-retry]');
  const hi = host.dataset.language === 'hi';
  const localized = document.getElementById('site-localized-copy');
  const messages = localized ? JSON.parse(localized.textContent) : {};
  const source = frame.getAttribute('data-src');
  let timeout, visible = true, ready = false;
  const syncVisibility = () => {
    if (ready) frame.contentWindow.postMessage({
      type: visible ? 'tapmelo-marble-visible' : 'tapmelo-marble-pause',
      mobilePlayer: document.documentElement.classList.contains('detail-mobile-playing'),
    }, location.origin);
  };
  const start = () => {
    clearTimeout(timeout);
    ready = false;
    host.dataset.state = 'loading'; retry.hidden = true;
    status.textContent = hi ? 'दफ़्तर खुल रहे हैं…' : (messages['marble.loading'] ?? 'Opening the offices…');
    timeout = setTimeout(() => {
      host.dataset.state = 'error'; retry.hidden = false;
      status.textContent = hi ? 'खेल लोड नहीं हुआ। फिर कोशिश करें या अलग पेज पर खोलें।' : (messages['game.error'] ?? 'The game could not load. Try again or open it on its own.');
    }, 15000);
  };
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'tapmelo-marble-ready') return;
    clearTimeout(timeout); host.dataset.state = 'ready';
    if (!ready) { ready = true; syncVisibility(); }
  });
  retry.addEventListener('click', () => { start(); frame.contentWindow.location.replace(source + '&retry=' + Date.now()); });
  // Freeze an off-screen game rather than letting an unseen belt continue.
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncVisibility();
  }).observe(frame);
  document.addEventListener('game-launch', start);
})();
