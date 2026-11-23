const reduceTileMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activePreview;

function stopPreview(tile = activePreview?.tile) {
  if (!activePreview || activePreview.tile !== tile) return;

  const { video, delay } = activePreview;
  activePreview = undefined;
  window.clearTimeout(delay);
  tile.classList.remove('is-previewing');
  video.pause();
  if (video.readyState > 0) video.currentTime = 0;
}

function schedulePreview(tile, video) {
  if (reduceTileMotion.matches || document.hidden || activePreview?.tile === tile) return;

  stopPreview();
  const preview = { tile, video, delay: 0 };
  activePreview = preview;
  preview.delay = window.setTimeout(async () => {
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    try {
      await video.play();
      if (activePreview === preview) tile.classList.add('is-previewing');
    } catch {
      if (activePreview === preview) stopPreview(tile);
    }
  }, 120);
}

const visibilityObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) stopPreview(entry.target);
  }
});

function attachPreview(tile) {
  const video = tile.querySelector('.game-tile-video');
  if (!video) return;
  visibilityObserver.observe(tile);

  tile.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') schedulePreview(tile, video);
  });
  tile.addEventListener('pointerleave', () => {
    if (!tile.matches(':focus-visible')) stopPreview(tile);
  });
  tile.addEventListener('focus', () => {
    if (tile.matches(':focus-visible')) schedulePreview(tile, video);
  });
  tile.addEventListener('blur', () => stopPreview(tile));
}

document.querySelectorAll('[data-game-tile]').forEach(attachPreview);
document.addEventListener('game-tiles-added', event => {
  event.detail.forEach(attachPreview);
});

const status = document.querySelector('[data-game-status]');
if (status) {
  const grid = document.querySelector('#games');
  const batches = [...document.querySelectorAll('template[data-game-batch]')];
  const allGamesLink = document.querySelector('[data-all-games-link]');
  if (allGamesLink) allGamesLink.hidden = true;
  let previousScrollY = window.scrollY;
  let pendingBatch;

  function appendGames() {
    const batch = batches.shift();
    if (!batch) return;
    const fragment = pendingBatch?.template === batch ? pendingBatch.fragment : batch.content;
    const tiles = [...fragment.querySelectorAll('.collection-game')];
    grid.append(fragment);
    batch.remove();
    tiles.forEach(attachPreview);
    status.textContent = status.dataset.single + tiles.length;
    if (!batches.length) {
      if (allGamesLink) allGamesLink.hidden = false;
      window.removeEventListener('scroll', loadWhileScrolling);
      window.removeEventListener('wheel', loadWhenPageFits);
      grid.removeEventListener('focusin', loadForKeyboard);
    }
  }

  async function loadNextBatch() {
    const template = batches[0];
    if (!template || pendingBatch) return;
    const fragment = document.importNode(template.content, true);
    pendingBatch = { template, fragment };
    // Decode covers offscreen so a batch can appear with its artwork ready.
    await Promise.allSettled([...fragment.querySelectorAll('.game-cover')].map(cover => cover.decode()));
    if (batches[0] === template) appendGames();
    pendingBatch = undefined;
  }

  function loadWhileScrolling() {
    const scrollY = window.scrollY;
    const movingDown = scrollY > previousScrollY;
    previousScrollY = scrollY;
    const viewportHeight = document.documentElement.clientHeight;
    if (movingDown && grid.getBoundingClientRect().bottom < viewportHeight * 2.5) loadNextBatch();
  }

  async function fillInitialScrollBuffer() {
    // Wide layouts can fit all 36 initial games within the first screen.
    const minimumBottom = document.documentElement.clientHeight * 1.5;
    while (batches.length && !pendingBatch && window.scrollY === 0 &&
      grid.getBoundingClientRect().bottom < minimumBottom) {
      await loadNextBatch();
    }
  }

  // On a tall desktop viewport the first batch may fit without a scrollbar.
  function loadWhenPageFits(event) {
    const page = document.documentElement;
    if (event.deltaY > 0 && !event.ctrlKey && page.scrollHeight <= page.clientHeight) loadNextBatch();
  }

  function loadForKeyboard(event) {
    if (event.target === grid.lastElementChild && event.target.matches(':focus-visible')) appendGames();
  }

  window.addEventListener('scroll', loadWhileScrolling, { passive: true });
  window.addEventListener('wheel', loadWhenPageFits, { passive: true });
  window.addEventListener('load', fillInitialScrollBuffer, { once: true });
  grid.addEventListener('focusin', loadForKeyboard);

  // An incoming #game-id may point outside the first batch.
  function revealLinkedGame() {
    const id = location.hash.slice(1);
    const pendingIndex = batches.findIndex(batch => batch.content.getElementById(id));
    if (pendingIndex === -1) {
      if (allGamesLink && document.querySelector('template[data-played-catalogue]')?.content.getElementById(id)) {
        location.replace(allGamesLink.href + location.hash);
      }
      return;
    }
    for (let i = 0; i <= pendingIndex; i++) appendGames();
    document.getElementById(id)?.scrollIntoView();
  }
  revealLinkedGame();
  window.addEventListener('hashchange', revealLinkedGame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPreview();
});
window.addEventListener('pagehide', () => stopPreview());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') stopPreview();
});
reduceTileMotion.addEventListener('change', () => {
  if (reduceTileMotion.matches) stopPreview();
});
