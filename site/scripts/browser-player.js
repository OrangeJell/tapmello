async (page) => {
  const results = [];
  const check = (value, message) => { if (!value) throw new Error(message); results.push(message); };
  // Cover the viewport fallback used by mobile browsers without native fullscreen.
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = undefined;
    // This script runs in an existing browser context without touch emulation.
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(any-pointer: coarse)' ? { matches: true } : matchMedia(query);
    Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { type: 'cellular', saveData: true }) });
  });
  for (const game of ['marble-sort', 'screw-sort', 'mahjong']) {
    await page.setViewportSize({ width: 390, height: 667 });
    await page.goto(`http://127.0.0.1:4173/games/${game}/`);
    check(!page.frames().some(frame => frame.url().includes('/play/')), `${game}: gameplay loads on demand`);
    const start = await page.locator('.detail-play').boundingBox();
    check(start.y + start.height < 667, `${game}: start is visible above the fold`);
    const preview = page.locator('video.detail-preview');
    await page.waitForFunction(() => {
      const video = document.querySelector('video.detail-preview');
      return video.muted && video.playsInline && video.currentTime > 0 && !video.paused;
    });
    check(await page.locator('.detail-preview-toggle').count() === 0, `${game}: preview autoplays on cellular without a play button`);
    await page.locator('.detail-play').click();
    await page.locator('.detail-native-runtime > [data-state="ready"]').waitFor();
    check(await preview.evaluate(video => video.paused), `${game}: starting the game pauses the background video`);
    const frame = page.frames().find(item => item.url().includes('/play/'));
    if (game === 'marble-sort') {
      await frame.locator('#start').click();
      if (await frame.locator('#guide-skip').isVisible()) await frame.locator('#guide-skip').click();
    }
    if (game === 'mahjong') await frame.locator('[data-action="open-level"]').first().click();
    for (const viewport of [{ width: 390, height: 667 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      const fit = await page.evaluate(() => {
        const host = document.querySelector('.detail-native-runtime');
        if (host.dataset.layout === 'flow') return getComputedStyle(host.firstElementChild).overflowY === 'auto';
        const frame = document.querySelector('iframe').getBoundingClientRect();
        const screen = document.querySelector('.detail-screen').getBoundingClientRect();
        return frame.top >= screen.top - 1 && frame.bottom <= screen.bottom + 1 && frame.left >= 0 && frame.right <= innerWidth + 1;
      });
      check(fit, `${game} ${viewport.width}: board fits or lesson can scroll`);
      if (game === 'marble-sort') {
        const controlsFit = await frame.evaluate(() => ['.masthead', '.hud', '#board', '.tools'].every(selector => {
          const { top, bottom, left, right } = document.querySelector(selector).getBoundingClientRect();
          return top >= 0 && bottom <= innerHeight && left >= 0 && right <= innerWidth;
        }));
        check(controlsFit, `${game} ${viewport.width}: board and both rows of controls are visible`);
        check(await frame.locator('#help').isHidden(), `${game} ${viewport.width}: footer help button is hidden`);
        const minimumWidth = { 320: 320 * 0.82, 390: 390 * 0.88, 844: 310 * 480 / 700 * 1.1 };
        const board = await frame.locator('#board').boundingBox();
        check(board.width >= minimumWidth[viewport.width], `${game} ${viewport.width}: board reaches the target width`);
      }
      const scroll = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 600);
      check(await page.evaluate(() => scrollY) === scroll, `${game} ${viewport.width}: page scrolling stays locked`);
    }
    await page.locator('.detail-menu-toggle').click();
    await page.locator('.detail-menu-toggle').click();
    await page.locator('[data-game-details]').click();
    await page.waitForTimeout(200);
    check(await page.locator('.detail-play').isVisible(), `${game}: exit restores preview after internal navigation`);
    check(await preview.evaluate(video => !video.paused), `${game}: returning to details resumes the preview`);
    check(!await page.locator('html').evaluate(element => element.classList.contains('detail-mobile-playing')), `${game}: exit leaves gameplay mode`);
  }
  const desktopContext = await page.context().browser().newContext({
    viewport: { width: 1245, height: 731 },
    deviceScaleFactor: 2,
  });
  try {
    await desktopContext.addInitScript(() => localStorage.setItem('marble-sort.level', '11'));
    const desktop = await desktopContext.newPage();
    await desktop.goto('http://127.0.0.1:4173/marble-sort');
    await desktop.locator('.detail-play').click();
    await desktop.locator('[data-marble-embed][data-state="ready"]').waitFor();
    const frame = desktop.frameLocator('#marble-frame');

    async function checkDesktopFit(content, wide, label) {
      await desktop.waitForFunction(({ selector, wide }) => {
        const screen = document.querySelector('.detail-screen').getBoundingClientRect();
        const iframe = document.querySelector('#marble-frame');
        const rect = iframe.getBoundingClientRect();
        const game = iframe.contentDocument;
        const content = game.querySelector(selector).getBoundingClientRect();
        const board = game.querySelector('#board').getBoundingClientRect();
        const inColumns = !wide || (
          game.querySelector('.wordmark').getBoundingClientRect().right < board.left &&
          game.querySelector('.progress-wrap').getBoundingClientRect().right < board.left &&
          game.querySelector('.tools').getBoundingClientRect().left > board.right
        );
        return iframe.clientWidth === (wide ? Math.min(900, Math.round(screen.width)) : 480) &&
          inColumns && content.height > 0 && content.bottom <= iframe.clientHeight + 1 &&
          rect.top >= screen.top - 1 && rect.bottom <= screen.bottom + 1 &&
          Math.abs(rect.left + rect.width / 2 - (screen.left + screen.width / 2)) <= 1;
      }, { selector: content, wide });
      check(true, label);
    }

    await checkDesktopFit('#lobby', false, 'marble-sort desktop: lobby fits and is centered');
    await frame.locator('#start').click();
    check(await frame.locator('#level').textContent() === '11', 'marble-sort desktop: starts level 11');
    await checkDesktopFit('footer', true, 'marble-sort desktop: title and progress sit left of the board and tools to its right');
    const gameScroll = await desktop.locator('[data-marble-embed]').evaluate(host => {
      host.scrollTop = host.scrollHeight;
      return host.scrollTop;
    });
    check(gameScroll === 0, 'marble-sort desktop: the fitted game cannot scroll out of view');
    await desktop.setViewportSize({ width: 1280, height: 720 });
    await checkDesktopFit('footer', true, 'marble-sort desktop: wide game stays centered and fitted after resizing');
    await desktop.setViewportSize({ width: 900, height: 720 });
    await checkDesktopFit('footer', false, 'marble-sort desktop: narrow window returns to the compact layout');
    await frame.locator('#pause').click();
    check(await frame.locator('#dialog').isVisible(), 'marble-sort desktop: pause works on the fitted board');
  } finally {
    await desktopContext.close();
  }
  return results;
}
