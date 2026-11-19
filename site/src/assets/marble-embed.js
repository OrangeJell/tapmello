(() => {
  const host = document.querySelector('[data-marble-embed]');
  const frame = document.querySelector('#marble-frame');
  if (!host || !frame) return;
  let visible = true;
  let connected = false;
  const loader = createNativeLoader({ onStart: () => {
    connected = false;
    host.removeAttribute('data-playfield');
  } });
  const isMobilePlayer = () => document.documentElement.classList.contains('detail-mobile-playing');
  const syncVisibility = () => {
    if (connected) frame.contentWindow.postMessage({
      type: visible ? 'tapmelo-marble-visible' : 'tapmelo-marble-pause',
      mobilePlayer: isMobilePlayer(),
    }, location.origin);
  };
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'tapmelo-marble-ready') {
      connected = true;
      syncVisibility();
      if (!isMobilePlayer()) return;
    } else if (event.data?.type === 'tapmelo-marble-resize' && connected && !isMobilePlayer()) {
      const height = event.data.height;
      if (!Number.isFinite(height) || height < 180 || height > 2500) return;
      host.toggleAttribute('data-playfield', event.data.playing === true);
      frame.style.height = Math.ceil(height) + 'px';
    } else return;
    loader.ready();
  });
  // Freeze an off-screen game rather than letting an unseen belt continue.
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncVisibility();
  }).observe(frame);
})();
