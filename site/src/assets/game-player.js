(() => {
  const stage = document.querySelector('.game-stage');
  if (!stage) return;
  const screen = stage.querySelector('.game-stage-screen');
  const preview = stage.querySelector('.game-launch-preview');
  const video = preview.querySelector('video');
  const start = preview.querySelector('.game-start');
  const toggle = preview.querySelector('.game-launch-preview-toggle');
  const runtime = stage.querySelector('.game-runtime');
  const host = runtime.firstElementChild;
  const frame = runtime.querySelector('iframe');
  const menu = stage.querySelector('.game-exit-menu');
  const menuButton = menu.querySelector('.game-menu-toggle');
  const panel = menu.querySelector('#game-menu-panel');
  const fullscreen = stage.querySelector('[data-fullscreen]');
  const drawer = stage.querySelector('.game-drawer');
  const drawerTitle = drawer.querySelector('h2');
  const searchField = drawer.querySelector('.game-search-field');
  const search = searchField.querySelector('input');
  const faq = drawer.querySelector('[data-drawer-faq]');
  const guides = drawer.querySelector('[data-drawer-guides]');
  const empty = drawer.querySelector('[data-search-empty]');
  const items = [...drawer.querySelectorAll('[data-search-item]')];
  const root = document.documentElement;
  const hi = root.lang === 'hi';
  const phone = matchMedia('(any-pointer: coarse)').matches && Math.min(innerWidth, innerHeight) <= 600;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sameSiteReferrer = document.referrer.startsWith(location.origin + '/') ? document.referrer : '';
  let playing = false, fallbackFullscreen = false, savedScroll = 0, scheduled = 0;
  let observer, drawerTrigger, previewRequested = true;
  const inertElements = new Map();

  function setVideoLabel() {
    toggle.textContent = video.paused ? (hi ? 'वीडियो चलाएँ' : 'Play preview') : (hi ? 'वीडियो रोकें' : 'Pause preview');
  }
  function playPreview() {
    if (preview.hidden || document.hidden || !previewRequested || reduced.matches) return;
    video.play().catch(setVideoLabel);
  }
  video.addEventListener('play', setVideoLabel);
  video.addEventListener('pause', setVideoLabel);
  video.addEventListener('error', () => { toggle.hidden = true; });
  toggle.addEventListener('click', () => {
    previewRequested = video.paused;
    if (previewRequested) video.play().catch(setVideoLabel);
    else video.pause();
  });

  function fit() {
    scheduled = 0;
    if (!playing) return;
    const style = getComputedStyle(screen);
    const width = screen.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = screen.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (width <= 0 || height <= 0) return;
    const wide = phone && innerWidth > innerHeight && height < 540;
    const baseWidth = Math.min(width, stage.dataset.game === 'mahjong' ? 1000 : wide ? 900 : 480);
    if (frame.style.width !== baseWidth + 'px') frame.style.width = baseWidth + 'px';
    const doc = frame.contentDocument;
    const naturalHeight = Math.max(parseFloat(frame.style.height) || 0, doc?.body?.scrollHeight || 0);
    const ready = host.dataset.state === 'ready' && naturalHeight > 0;
    const scale = ready ? Math.min(1.4, width / baseWidth, height / naturalHeight) : 1;
    const transform = 'scale(' + scale + ')';
    if (frame.style.transform !== transform) frame.style.transform = transform;
    runtime.style.width = (ready ? baseWidth * scale : width) + 'px';
    runtime.style.height = (ready ? naturalHeight * scale : height) + 'px';
  }
  function queueFit() { if (!scheduled) scheduled = requestAnimationFrame(fit); }

  frame.addEventListener('load', () => {
    observer?.disconnect();
    const doc = frame.contentDocument;
    if (playing && doc?.body) {
      observer = new ResizeObserver(queueFit);
      observer.observe(doc.body);
      doc.documentElement.style.overflow = 'hidden';
      doc.body.style.overflow = 'hidden';
      doc.addEventListener('keydown', onKey);
    }
    queueFit();
  });
  const fitObserver = new MutationObserver(queueFit);
  fitObserver.observe(frame, { attributes: true, attributeFilter: ['style'] });
  fitObserver.observe(host, { attributes: true, attributeFilter: ['data-state'] });
  new ResizeObserver(queueFit).observe(screen);

  function viewport() {
    const view = window.visualViewport;
    stage.style.setProperty('--play-height', ((view?.scale === 1 ? view.height : innerHeight) || innerHeight) + 'px');
    queueFit();
  }
  function syncLayout() {
    const native = document.fullscreenElement === stage;
    const locked = phone || fallbackFullscreen || native;
    if (locked && !root.classList.contains('game-panel-fixed')) {
      savedScroll = scrollY;
      document.body.style.top = -savedScroll + 'px';
      for (const node of document.querySelectorAll('.game-recommendations, .game-detail-content, .site-footer')) {
        inertElements.set(node, node.inert);
        node.inert = true;
      }
      root.classList.add('game-panel-fixed');
    } else if (!locked && root.classList.contains('game-panel-fixed')) {
      root.classList.remove('game-panel-fixed');
      document.body.style.removeProperty('top');
      for (const [node, wasInert] of inertElements) node.inert = wasInert;
      inertElements.clear();
      window.scrollTo(0, savedScroll);
    }
    const expanded = native || fallbackFullscreen;
    fullscreen.setAttribute('aria-pressed', String(expanded));
    const label = expanded ? (hi ? 'फ़ुल स्क्रीन से बाहर जाएँ' : 'Exit fullscreen') : (hi ? 'फ़ुल स्क्रीन' : 'Fullscreen');
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label;
    viewport();
  }

  fullscreen.addEventListener('click', async () => {
    if (document.fullscreenElement === stage) {
      await document.exitFullscreen().catch(() => {});
    } else if (fallbackFullscreen) {
      fallbackFullscreen = false;
    } else {
      try {
        if (!stage.requestFullscreen) throw new Error('Fullscreen unavailable');
        await stage.requestFullscreen();
      } catch {
        fallbackFullscreen = true;
      }
    }
    syncLayout();
  });
  document.addEventListener('fullscreenchange', syncLayout);
  window.addEventListener('resize', viewport);
  window.visualViewport?.addEventListener('resize', viewport);

  function launch() {
    if (playing) return;
    playing = true;
    video.pause();
    preview.hidden = true;
    runtime.hidden = false;
    fullscreen.hidden = false;
    root.classList.add('game-is-playing');
    syncLayout();
    document.dispatchEvent(new Event('game-launch'));
    frame.contentWindow.location.replace(frame.dataset.src);
  }
  function showPreview() {
    playing = false;
    fallbackFullscreen = false;
    if (document.fullscreenElement === stage) document.exitFullscreen().catch(() => {});
    observer?.disconnect();
    frame.contentWindow.location.replace('about:blank');
    frame.removeAttribute('style');
    runtime.hidden = true;
    fullscreen.hidden = true;
    root.classList.remove('game-is-playing');
    preview.hidden = false;
    syncLayout();
    setVideoLabel();
    playPreview();
  }
  start.addEventListener('click', () => {
    history.pushState({ ...history.state, tapmeloPlaying: true }, '');
    closeMenu();
    launch();
    frame.focus({ preventScroll: true });
  });

  function closeMenu() {
    panel.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', () => {
    if (!panel.hidden) return closeMenu();
    panel.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
  });
  stage.querySelector('.game-exit').addEventListener('click', () => {
    if (phone && playing) {
      closeMenu();
      showPreview();
      start.focus({ preventScroll: true });
      if (history.state?.tapmeloPlaying) history.back();
    } else if (sameSiteReferrer) {
      if (history.length > 1 && history.length === initialHistoryLength) history.back();
      else location.assign(sameSiteReferrer);
    } else {
      location.assign(stage.querySelector('.game-home').href);
    }
  });
  window.addEventListener('popstate', () => {
    if (!phone) return;
    if (history.state?.tapmeloPlaying && !playing) launch();
    else if (!history.state?.tapmeloPlaying && playing) {
      closeMenu();
      showPreview();
      start.focus({ preventScroll: true });
    }
  });

  function filter() {
    const terms = search.value.trim().toLocaleLowerCase(root.lang).split(/\s+/u).filter(Boolean);
    const searching = !searchField.hidden;
    let matches = 0;
    for (const item of items) {
      const text = item.textContent.toLocaleLowerCase(root.lang);
      item.hidden = searching && !terms.every(term => text.includes(term));
      if (!item.hidden) matches++;
    }
    faq.hidden = !searching || !faq.querySelector('details:not([hidden])');
    empty.hidden = !searching || matches > 0;
  }
  search.addEventListener('input', filter);
  for (const button of stage.querySelectorAll('[data-open-drawer]')) {
    button.addEventListener('click', () => {
      const searching = button.dataset.openDrawer === 'search';
      drawerTrigger = button;
      drawerTitle.textContent = searching ? drawerTitle.dataset.searchTitle : drawerTitle.dataset.helpTitle;
      searchField.hidden = !searching;
      guides.hidden = searching;
      search.value = '';
      filter();
      drawer.showModal();
      drawer.querySelector('.game-drawer-body').scrollTop = 0;
      drawer.querySelector('[data-close-drawer]').focus({ preventScroll: true });
    });
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow ||
        event.data?.type !== 'tapmelo-mahjong-guides' || !playing || drawer.open) return;
    stage.querySelector('[data-open-drawer="help"]').click();
    drawerTrigger = frame;
  });
  drawer.querySelector('[data-close-drawer]').addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', event => {
    if (event.target === drawer && (event.clientX > drawer.getBoundingClientRect().right)) drawer.close();
  });
  drawer.addEventListener('close', () => drawerTrigger?.focus({ preventScroll: true }));

  function onKey(event) {
    if (event.key !== 'Escape' || drawer.open) return;
    if (!panel.hidden) {
      closeMenu();
      menuButton.focus();
    } else if (fallbackFullscreen) {
      fallbackFullscreen = false;
      syncLayout();
      fullscreen.focus();
    }
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else playPreview();
  });

  const initialHistoryLength = history.length;
  root.classList.add('game-player-enabled');
  menu.hidden = false;
  if (phone) {
    root.classList.add('game-player-phone');
    video.src = video.dataset.src;
    if (history.state?.tapmeloPlaying) launch();
    else {
      fullscreen.hidden = true;
      preview.hidden = false;
      syncLayout();
      setVideoLabel();
      playPreview();
    }
  } else {
    launch();
  }
})();
