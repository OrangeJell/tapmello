const player = document.querySelector('.detail-player');
const screen = player.querySelector('.detail-screen');
const nativeRuntime = screen.querySelector('.detail-native-runtime');
const nativeFrame = nativeRuntime?.querySelector('iframe');
const nativeHost = nativeRuntime?.firstElementChild;
const preview = player.querySelector('video.detail-preview');
const previewToggle = player.querySelector('.detail-preview-toggle');
const fullscreen = player.querySelector('.detail-fullscreen');
const helpButton = player.querySelector('.detail-bar-help');
const barBack = player.querySelector('.detail-bar-back');
const barReload = player.querySelector('.detail-bar-reload');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle = screen.querySelector('.detail-menu-toggle');
const menu = screen.querySelector('.detail-game-menu');
const backToDetails = menu.querySelector('[data-game-details]');
const openSearch = menu.querySelector('[data-game-search]');
const drawer = player.querySelector('.detail-help-drawer');
const search = drawer.querySelector('input');
const helpContent = drawer.querySelector('.detail-help-content');
const helpEmpty = drawer.querySelector('.detail-help-empty');
let started = false;
let returnToDetails;
let helpTrigger;

const connection = navigator.connection;
const mediaPreviews = [preview, document.querySelector('.detail-media-preview video')].filter(Boolean);
const visiblePreviews = new Set();
const pausedByViewer = new WeakSet();
let automaticPreview;

function syncPreviewAutoplay() {
  const allowed = connection?.type === 'wifi' && !connection.saveData &&
    !started && !document.hidden && !reduceMotion.matches;
  const manualPlayback = mediaPreviews.some(video => video !== automaticPreview && !video.paused);
  const next = allowed && !manualPlayback && mediaPreviews.find(video =>
    visiblePreviews.has(video) && !pausedByViewer.has(video) && !video.ended);

  if (automaticPreview && automaticPreview !== next) {
    const previous = automaticPreview;
    automaticPreview = undefined;
    previous.pause();
  }
  if (!next || !next.paused || automaticPreview === next) return;
  automaticPreview = next;
  next.muted = true;
  next.play().catch(() => {
    if (automaticPreview === next) automaticPreview = undefined;
  });
}

if (mediaPreviews.length) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio >= 0.4) visiblePreviews.add(entry.target);
      else visiblePreviews.delete(entry.target);
    }
    syncPreviewAutoplay();
  }, { threshold: 0.4 });
  for (const video of mediaPreviews) {
    observer.observe(video);
    video.addEventListener('play', syncPreviewAutoplay);
    video.addEventListener('pause', () => {
      if (automaticPreview === video && video.paused) {
        automaticPreview = undefined;
        pausedByViewer.add(video);
      }
      syncPreviewAutoplay();
    });
  }
  connection?.addEventListener('change', syncPreviewAutoplay);
}

function updatePreviewLabel() {
  previewToggle.textContent = preview.paused ? previewToggle.dataset.playLabel : previewToggle.dataset.pauseLabel;
  previewToggle.setAttribute('aria-label', previewToggle.textContent);
}
if (preview) {
  preview.addEventListener('play', updatePreviewLabel);
  preview.addEventListener('pause', updatePreviewLabel);
  updatePreviewLabel();
  previewToggle.addEventListener('click', async () => {
    if (preview.paused) {
      try { await preview.play(); } catch { updatePreviewLabel(); }
    } else {
      pausedByViewer.add(preview);
      preview.pause();
    }
  });
}
const startGame = player.querySelector('.detail-play');
const cover = screen.querySelector('.detail-launch');
const partnerTemplate = screen.querySelector(':scope > template');
const partnerStatus = screen.querySelector('.detail-partner-status');
let partnerAttempt;

function stopPartnerGame() {
  if (!partnerAttempt) return;
  clearTimeout(partnerAttempt.timer);
  partnerAttempt.controller.abort();
  partnerAttempt.frame.remove();
  partnerAttempt = undefined;
  partnerStatus.hidden = true;
  partnerStatus.querySelector('[data-partner-show]').onclick = null;
}

function loadPartnerGame() {
  stopPartnerGame();
  const frame = partnerTemplate.content.firstElementChild.cloneNode();
  const controller = new AbortController();
  const message = partnerStatus.querySelector('[role="status"]');
  const retry = partnerStatus.querySelector('[data-partner-retry]');
  const show = partnerStatus.querySelector('[data-partner-show]');
  const exit = partnerStatus.querySelector('[data-partner-back]');
  const attempt = { frame, controller, timer: 0 };
  partnerAttempt = attempt;
  let frameLoaded = false;
  let connectionAvailable = false;

  function showStatus(state) {
    message.textContent = partnerStatus.dataset[state];
    retry.hidden = state === 'loading';
    show.hidden = state === 'loading' || !frameLoaded;
  }

  function revealFrame() {
    clearTimeout(attempt.timer);
    const moveFocus = partnerStatus.contains(document.activeElement);
    frame.inert = false;
    partnerStatus.hidden = true;
    if (moveFocus) frame.focus({ preventScroll: true });
  }

  function reportFailure(state) {
    if (partnerAttempt === attempt && !partnerStatus.hidden) showStatus(state);
  }

  frame.inert = true;
  partnerStatus.hidden = false;
  showStatus('loading');
  exit.focus({ preventScroll: true });
  attempt.timer = setTimeout(() => reportFailure('timeout'), 15000);
  frame.addEventListener('load', () => {
    if (partnerAttempt !== attempt) return;
    frameLoaded = true;
    if (connectionAvailable) revealFrame();
    else if (!retry.hidden) show.hidden = false;
  }, { once: true });
  screen.append(frame);

  // Cross-origin iframe load can also fire on errors. A bodyless check can
  // catch connection failures without making a second gameplay request.
  fetch(frame.src, { method: 'HEAD', mode: 'no-cors', credentials: 'omit', signal: controller.signal })
    .then(() => {
      if (partnerAttempt !== attempt) return;
      connectionAvailable = true;
      if (frameLoaded) revealFrame();
    })
    .catch(() => {
      if (controller.signal.aborted) return;
      clearTimeout(attempt.timer);
      reportFailure('error');
    });
  show.onclick = revealFrame;
}

partnerStatus?.querySelector('[data-partner-retry]').addEventListener('click', loadPartnerGame);
partnerStatus?.querySelector('[data-partner-back]').addEventListener('click', () => returnToDetails?.());
barReload?.addEventListener('click', loadPartnerGame);
barBack.addEventListener('click', () => returnToDetails?.());
helpButton.hidden = false;

startGame.addEventListener('click', () => {
  if (started) return;
  started = true;
  player.dispatchEvent(new Event('game-played'));
  syncPreviewAutoplay();
  preview?.pause();
  cover.hidden = true;
  if (nativeFrame) {
    nativeRuntime.hidden = false;
    document.dispatchEvent(new Event('game-launch'));
    nativeFrame.contentWindow.location.replace(nativeFrame.dataset.src);
  } else {
    loadPartnerGame();
  }
  player.classList.add('detail-is-playing');
  menuToggle.hidden = false;
  if (barReload) barReload.hidden = false;

  function restorePreview() {
    tuckToggle();
    if (drawer.open) drawer.close();
    menuToggle.hidden = true;
    barBack.hidden = true;
    fullscreen.hidden = false;
    if (barReload) barReload.hidden = true;
    player.classList.remove('detail-is-playing');
    if (nativeFrame) {
      nativeRuntime.hidden = true;
      nativeFrame.contentWindow.location.replace('about:blank');
    } else {
      stopPartnerGame();
    }
    cover.hidden = false;
    started = false;
    returnToDetails = undefined;
    syncPreviewAutoplay();
    startGame.focus({ preventScroll: true });
  }
  returnToDetails = openDetailMobilePlayer(player, restorePreview);
  if (!returnToDetails) {
    returnToDetails = () => {
      if (document.fullscreenElement === player) document.exitFullscreen().catch(() => {});
      fallbackFullscreen(false);
      restorePreview();
    };
    nativeFrame?.focus({ preventScroll: true });
  }
  const mobilePlayer = document.documentElement.classList.contains('detail-mobile-playing');
  barBack.hidden = Boolean(nativeFrame) && !mobilePlayer;
  fullscreen.hidden = mobilePlayer && document.fullscreenEnabled === false;
});
if (nativeFrame && nativeRuntime.dataset.layout === 'board') {
  function fitBoard() {
    if (nativeRuntime.hidden) return;
    const width = screen.clientWidth;
    const height = screen.clientHeight;
    const narrow = matchMedia('(any-pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 600;
    const maxWidth = narrow && innerWidth > innerHeight ? 900 : 480;
    const boardWidth = Math.min(width, maxWidth);
    const frameHeight = parseFloat(nativeFrame.style.height);
    const ready = nativeHost.dataset.state === 'ready' && frameHeight > 0;
    const scale = ready ? Math.min(1.4, width / boardWidth, height / frameHeight) : 1;
    nativeRuntime.style.setProperty('--board-width', boardWidth + 'px');
    nativeRuntime.style.setProperty('--board-scale', scale);
    nativeRuntime.style.setProperty('--board-box-width', (ready ? boardWidth * scale : width) + 'px');
    nativeRuntime.style.setProperty('--board-box-height', (ready ? frameHeight * scale : height) + 'px');
  }
  new ResizeObserver(fitBoard).observe(screen);
  const observer = new MutationObserver(fitBoard);
  observer.observe(nativeRuntime, { attributes: true, attributeFilter: ['hidden'] });
  observer.observe(nativeHost, { attributes: true, attributeFilter: ['data-state'] });
  observer.observe(nativeFrame, { attributes: true, attributeFilter: ['style'] });
}
function updateFullscreen() {
  const expanded = document.fullscreenElement === player || player.classList.contains('is-expanded');
  fullscreen.setAttribute('aria-pressed', String(expanded));
  fullscreen.setAttribute('aria-label', expanded ? player.dataset.exitFullscreenLabel : player.dataset.fullscreenLabel);
}
function fallbackFullscreen(enabled) {
  player.classList.toggle('is-expanded', enabled);
  document.documentElement.classList.toggle('detail-expanded', enabled);
  updateFullscreen();
}
fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement === player) {
    await document.exitFullscreen();
  } else if (player.classList.contains('is-expanded')) {
    fallbackFullscreen(false);
  } else {
    try { await player.requestFullscreen(); } catch {
      if (!document.documentElement.classList.contains('detail-mobile-playing')) fallbackFullscreen(true);
    }
  }
});
document.addEventListener('fullscreenchange', updateFullscreen);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || drawer.open) return;
  if (!menuToggle.hidden && !menuToggle.classList.contains('is-tucked')) {
    tuckToggle();
    menuToggle.focus({ preventScroll: true });
    event.preventDefault();
  } else fallbackFullscreen(false);
});
const rail = document.querySelector('.detail-rail');
const loadMore = rail.querySelector('.detail-rail-more');
const shownGames = new Set([...document.querySelectorAll('.detail-discovery [data-game], .detail-rail [data-game]')]
  .map(tile => tile.dataset.game));
const currentCategories = rail.dataset.categories.split(' ');
const recommendationLimit = 36;
let catalogue;
let loadingRecommendations = false;

function drawRecommendations(entries, count) {
  const candidates = entries.filter(item => item.id !== rail.dataset.game && !shownGames.has(item.id))
    .map(item => ({
      item,
      weight: item.categories[0] === currentCategories[0] ? 20
        : item.categories.some(category => currentCategories.includes(category)) ? 7 : 1,
    }));
  const drawn = [];
  let totalWeight = candidates.reduce((total, entry) => total + entry.weight, 0);
  while (drawn.length < count && candidates.length) {
    let ticket = Math.random() * totalWeight;
    const index = candidates.findIndex(entry => (ticket -= entry.weight) < 0);
    const [winner] = candidates.splice(index, 1);
    totalWeight -= winner.weight;
    drawn.push(winner.item);
  }
  return drawn;
}

function createRecommendation(game) {
  const tile = document.createElement('a');
  tile.className = 'detail-tile';
  tile.href = game.href;
  tile.dataset.gameTile = '';
  tile.dataset.game = game.id;
  const art = document.createElement('span');
  art.className = 'game-tile-art';
  const cover = document.createElement('img');
  cover.className = 'game-cover';
  cover.src = game.cover;
  cover.alt = '';
  cover.width = game.width;
  cover.height = game.height;
  cover.loading = 'lazy';
  cover.decoding = 'async';
  art.append(cover);
  if (game.preview) {
    const video = document.createElement('video');
    video.className = 'game-tile-video';
    video.dataset.src = game.preview;
    video.preload = 'none';
    video.muted = video.playsInline = video.loop = true;
    video.setAttribute('aria-hidden', 'true');
    art.append(video);
  }
  const label = document.createElement('span');
  label.className = 'game-tile-label';
  const title = document.createElement('span');
  title.lang = game.titleLang;
  title.textContent = game.title;
  const category = document.createElement('span');
  category.className = 'game-tile-category';
  category.textContent = game.category;
  label.append(title, category);
  art.append(label);
  tile.append(art);
  return tile;
}

async function loadRecommendations() {
  if (started || loadingRecommendations || loadMore.hidden) return;
  loadingRecommendations = true;
  recommendationObserver.unobserve(loadMore);
  loadMore.setAttribute('aria-busy', 'true');
  try {
    if (!catalogue) {
      const response = await fetch(rail.dataset.catalogue);
      if (!response.ok) throw Error('Recommendations unavailable');
      catalogue = await response.json();
    }
    const remaining = recommendationLimit - rail.querySelectorAll('[data-game-tile]').length;
    const next = drawRecommendations(catalogue, Math.min(6, remaining));
    next.forEach(game => shownGames.add(game.id));
    const tiles = next.map(createRecommendation);
    loadMore.before(...tiles);
    document.dispatchEvent(new CustomEvent('game-tiles-added', { detail: tiles }));
    if (document.activeElement === loadMore && tiles.length) tiles[0].focus();
    loadMore.hidden = next.length < 6 || next.length >= remaining || shownGames.size + 1 >= catalogue.length;
    if (!loadMore.hidden) recommendationObserver.observe(loadMore);
  } catch {
    // Leave the button available for a manual retry.
  } finally {
    loadMore.removeAttribute('aria-busy');
    loadingRecommendations = false;
  }
}

const recommendationObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) loadRecommendations();
}, { rootMargin: '240px' });
loadMore.hidden = false;
loadMore.addEventListener('click', loadRecommendations);
recommendationObserver.observe(loadMore);

document.addEventListener('visibilitychange', syncPreviewAutoplay);
reduceMotion.addEventListener('change', syncPreviewAutoplay);

function openDetailMobilePlayer(stage, restorePreview) {
  if (!matchMedia('(any-pointer: coarse)').matches || Math.min(innerWidth, innerHeight) > 600) return;

  const root = document.documentElement;
  const hidden = [];
  const savedScroll = scrollY;
  let closed = false;

  for (let node = stage; node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && !sibling.inert) {
        sibling.inert = true;
        hidden.push(sibling);
      }
    }
  }
  root.classList.add('detail-mobile-playing');

  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
    root.classList.remove('detail-mobile-playing');
    for (const sibling of hidden) sibling.inert = false;
    restorePreview();
    window.scrollTo({ top: savedScroll, behavior: 'instant' });
  }

  function onKey(event) {
    if (event.key === 'Escape' && !event.defaultPrevented && !drawer.open) close();
  }

  document.addEventListener('keydown', onKey);

  // Keep the fixed player when the browser cannot hide its own controls.
  stage.requestFullscreen?.().catch(() => {});
  if (nativeFrame) helpButton.focus({ preventScroll: true });
  return close;
}

const actions = [...menu.children];
let drag;
let moved = false;
let buttonPosition = { x: 0, y: 0 };

function positionMenu() {
  const radius = 62;
  const { x, y } = buttonPosition;
  const centerX = x + menuToggle.offsetWidth / 2;
  const centerY = y + menuToggle.offsetHeight / 2;
  const direction = menuToggle.dataset.edge === 'right' ? -1 : 1;
  const room = radius + 22;
  const angles = centerY < room ? [0, 45, 90]
    : screen.clientHeight - centerY < room ? [-90, -45, 0] : [-50, 0, 50];

  actions.forEach((action, index) => {
    const angle = angles[index] * Math.PI / 180;
    const dx = Math.cos(angle) * radius * direction;
    const dy = Math.sin(angle) * radius;
    action.style.left = (centerX + dx) + 'px';
    action.style.top = (centerY + dy) + 'px';
    action.style.setProperty('--return-x', -dx + 'px');
    action.style.setProperty('--return-y', -dy + 'px');
  });
}

function setMenu(open) {
  if (open) positionMenu();
  menu.inert = !open;
  menu.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}

function setTucked(tucked) {
  menuToggle.classList.toggle('is-tucked', tucked);
  menuToggle.setAttribute('aria-label', tucked ? menuToggle.dataset.showLabel : menuToggle.dataset.menuLabel);
}

function tuckToggle() {
  setMenu(false);
  setTucked(true);
}

function placeToggle(x, y) {
  buttonPosition = {
    x: Math.max(0, Math.min(x, screen.clientWidth - menuToggle.offsetWidth)),
    y: Math.max(0, Math.min(y, screen.clientHeight - menuToggle.offsetHeight)),
  };
  menuToggle.style.left = buttonPosition.x + 'px';
  menuToggle.style.top = buttonPosition.y + 'px';
}

function dockToggle(y) {
  const x = menuToggle.dataset.edge === 'right' ? screen.clientWidth - menuToggle.offsetWidth : 0;
  placeToggle(x, y);
}

menuToggle.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  const area = screen.getBoundingClientRect();
  const button = menuToggle.getBoundingClientRect();
  moved = false;
  screen.classList.add('detail-dragging-menu');
  menuToggle.setPointerCapture(event.pointerId);
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: button.left - area.left, top: button.top - area.top };
});
menuToggle.addEventListener('pointermove', event => {
  if (drag?.id !== event.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!moved && Math.hypot(dx, dy) < 6) return;
  if (!moved) {
    moved = true;
    setTucked(false);
    setMenu(false);
  }
  placeToggle(drag.left + dx, drag.top + dy);
});
menuToggle.addEventListener('pointerup', event => {
  if (drag?.id === event.pointerId && moved) {
    placeToggle(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
  }
  finishDrag();
});
function finishDrag() {
  if (drag && moved) {
    menuToggle.dataset.edge = buttonPosition.x + menuToggle.offsetWidth / 2 < screen.clientWidth / 2 ? 'left' : 'right';
    dockToggle(buttonPosition.y);
    tuckToggle();
  }
  drag = undefined;
  screen.classList.remove('detail-dragging-menu');
}
menuToggle.addEventListener('pointercancel', finishDrag);
menuToggle.addEventListener('lostpointercapture', finishDrag);
menuToggle.addEventListener('click', event => {
  if (moved && event.detail > 0) return;
  if (menuToggle.classList.contains('is-tucked')) {
    setTucked(false);
  } else if (menu.inert) {
    setMenu(true);
    if (event.detail === 0) backToDetails.focus();
  } else {
    tuckToggle();
  }
});
new ResizeObserver(() => {
  if (!started || drag) return;
  dockToggle(buttonPosition.y);
  if (!menu.inert) positionMenu();
}).observe(screen);
document.addEventListener('pointerdown', event => {
  if (started && !menu.contains(event.target) && !menuToggle.contains(event.target) && !drawer.contains(event.target)) tuckToggle();
});

backToDetails.addEventListener('click', () => returnToDetails?.());

for (const selector of ['.detail-how', '.detail-faq']) {
  const section = document.querySelector(selector).cloneNode(true);
  section.classList.remove('detail-block');
  section.removeAttribute('id');
  helpContent.append(section);
}
const guideBlock = document.querySelector('.detail-guides');
const drawerGuides = guideBlock ? document.createElement('section') : null;
if (drawerGuides) {
  drawerGuides.append(
    guideBlock.querySelector('h2').cloneNode(true),
    guideBlock.querySelector('.game-guide-links').cloneNode(true),
  );
  helpContent.append(drawerGuides);
}
const helpItems = [...helpContent.querySelectorAll('.detail-instruction, .detail-controls, details')];

function filterHelp() {
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  for (const item of helpItems) {
    item.hidden = !terms.every(term => item.textContent.toLowerCase().includes(term));
    if (item.matches('details')) item.open = terms.length > 0 && !item.hidden;
  }
  for (const section of helpContent.children) {
    section.hidden = section === drawerGuides
      ? terms.length > 0
      : !helpItems.some(item => section.contains(item) && !item.hidden);
  }
  helpEmpty.hidden = helpItems.some(item => !item.hidden);
}

function showHelp(event) {
  helpTrigger = event?.currentTarget === helpButton || !started ? helpButton : menuToggle;
  tuckToggle();
  search.value = '';
  filterHelp();
  drawer.showModal();
  drawer.querySelector('form button').focus();
}
openSearch.addEventListener('click', showHelp);
helpButton.addEventListener('click', showHelp);
if (nativeFrame?.id === 'mahjong-frame') {
  window.addEventListener('message', event => {
    if (!started || drawer.open || event.origin !== location.origin ||
        event.source !== nativeFrame.contentWindow || event.data?.type !== 'tapmelo-mahjong-guides') return;
    showHelp();
    drawerGuides?.scrollIntoView({ block: 'start' });
  });
  const resume = new URLSearchParams(location.search).get('resume');
  if (resume && /^#(?:home|practice|learn\/[a-z0-9/-]+)$/.test(resume)) {
    document.addEventListener('DOMContentLoaded', () => startGame.click(), { once: true });
  }
}
async function closeHelp() {
  if (!drawer.open || drawer.classList.contains('is-closing')) return;
  drawer.classList.add('is-closing');
  await Promise.allSettled(drawer.getAnimations().map(animation => animation.finished));
  if (drawer.open) drawer.close();
}

function hitsBackdrop(event) {
  if (event.target !== drawer) return false;
  const bounds = drawer.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

let pressedBackdrop = false;
drawer.addEventListener('pointerdown', event => { pressedBackdrop = hitsBackdrop(event); });
drawer.addEventListener('click', event => {
  if (pressedBackdrop && hitsBackdrop(event)) closeHelp();
  pressedBackdrop = false;
});
drawer.addEventListener('cancel', event => {
  event.preventDefault();
  closeHelp();
});
drawer.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  closeHelp();
});
search.addEventListener('input', filterHelp);
drawer.addEventListener('close', () => {
  drawer.classList.remove('is-closing');
  if (helpTrigger?.getClientRects().length) helpTrigger.focus({ preventScroll: true });
});
