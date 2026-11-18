async page => {
  const initial = new URL(page.url());
  const base = initial.origin;
  const codes = initial.searchParams.get('locales')?.split(',') ?? [];
  const english = codes.length === 1 && codes[0] === 'en';
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(url => /^https?:$/.test(url.protocol) && url.origin !== base, route => route.abort());
  const games = [
    { slug: 'screw-sort', frame: 'game-frame', host: '#game-embed' },
    { slug: 'mahjong', frame: 'mahjong-frame', host: '[data-mahjong-embed]' },
    { slug: 'marble-sort', frame: 'marble-frame', host: '[data-marble-embed]' },
  ];
  const results = [];

  async function visit(path) {
    const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    assert(response?.ok(), `${path} returned ${response?.status()}`);
  }

  async function fits(message) {
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), message);
  }

  async function startGame(game, code) {
    await page.locator('.detail-play').click();
    try {
      await page.locator(`${game.host}[data-state="ready"]`).waitFor({ timeout: 15000 });
    } catch (error) {
      const state = await page.locator(game.host).getAttribute('data-state');
      throw new Error(`${page.url()} player stayed ${state}. ${errors.join(' ')}`, { cause: error });
    }
    const frame = page.frameLocator('#' + game.frame);
    assert(await frame.locator('html').getAttribute('lang') === code, `Wrong iframe language: ${game.slug}/${code}`);
    return frame;
  }

  async function search(query, expected) {
    await page.locator('.site-game-search input').fill(query);
    await page.locator(`#site-search-options a[href="${expected}"]`).waitFor({ timeout: 8000 });
    await page.keyboard.press('Escape');
    assert(await page.locator('.site-search-popup').isHidden(), 'Escape closes the search');
  }

  const partner = '/play/playgama/nuts-puzzle-sort-by-color/';
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(partner);
  const baseline = await page.locator('.detail-about p').first().textContent();
  if (codes.includes('all')) codes.splice(0, codes.length, ...await page.locator('.language-picker a:not([hreflang="en"])').evaluateAll(links => links.map(link => link.hreflang)));
  assert(codes.length > 0, 'Provide a locale, en or all');

  for (const code of codes) {
    const prefix = code === 'en' ? '' : '/' + code.toLowerCase();
    await visit(partner);
    const picker = page.locator('.language-picker');
    await picker.locator('summary').focus();
    await page.keyboard.press('Enter');
    const link = picker.locator(`a[hreflang="${code}"]`);
    assert(await link.getAttribute('href') === prefix + partner, `Wrong switch target for ${code}`);
    assert(await picker.locator('nav').evaluate(nav => nav.scrollHeight > nav.clientHeight), 'The language menu should scroll at 390px');
    await link.click();
    await page.waitForURL(base + prefix + partner);
    assert(await page.locator('html').getAttribute('lang') === (code === 'en' ? 'en-IN' : code), `Wrong page language: ${code}`);
    assert(code === 'en' || await page.locator('.detail-about p').first().textContent() !== baseline, `Untranslated partner details: ${code}`);
    await fits(`Partner detail overflows: ${code}`);

    await visit(prefix + '/');
    await fits(`Home overflows: ${code}`);
    await search(code === 'zh-CN' ? '麻将' : 'Mahjong', prefix + '/games/mahjong/');
    await visit(prefix + '/guides/mahjong/tiles/');
    assert(await page.locator('article .reading-section').count() >= 5, `Missing article: ${code}`);
    await fits(`Guide overflows: ${code}`);
    await visit(prefix + '/privacy/');
    assert(await page.locator('main h1').count() === 1, `Missing policy page: ${code}`);
    for (const game of games) {
      await visit(`${prefix}/games/${game.slug}/`);
      await startGame(game, code === 'hi' ? 'hi' : 'en');
    }
    results.push(code);
  }

  if (english) {
    await visit(partner);
    async function initialRecommendations() {
      await page.locator('.detail-rail-more').waitFor({ state: 'visible' });
      const gameIds = selector => page.locator(`${selector} [data-game-tile]`)
        .evaluateAll(tiles => tiles.map(tile => tile.dataset.game));
      const discovery = await gameIds('.detail-discovery');
      const rail = (await gameIds('.detail-rail')).slice(0, 12);
      const ids = [...discovery, ...rail];
      const current = await page.locator('.detail-player').getAttribute('data-game');
      assert(discovery.length === 6 && rail.length === 12 && new Set(ids).size === ids.length && !ids.includes(current),
        'Initial recommendations should be unique and exclude the current game');
      return { discovery: discovery.join(','), rail: rail.join(',') };
    }

    const firstRecommendations = await initialRecommendations();
    await Promise.all([
      page.waitForURL(url => url.pathname !== partner),
      page.locator('.detail-discovery [data-game-tile]').first().click(),
    ]);
    const nextRecommendations = await initialRecommendations();
    assert(firstRecommendations.discovery !== nextRecommendations.discovery && firstRecommendations.rail !== nextRecommendations.rail,
      'Opening another game should refresh both recommendation sections');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const reloadedRecommendations = await initialRecommendations();
    assert(nextRecommendations.discovery !== reloadedRecommendations.discovery && nextRecommendations.rail !== reloadedRecommendations.rail,
      'Reloading should refresh both recommendation sections');

    await visit(partner);
    const partnerUrl = await page.locator('.detail-screen > template')
      .evaluate(template => template.content.querySelector('iframe').src);
    await page.route(partnerUrl, route => route.fulfill({
      contentType: 'text/html',
      body: route.request().method() === 'HEAD' ? '' : '<p id="fixture-loaded">Partner player fixture</p>',
    }));
    await page.locator('.detail-play').click();
    await page.frameLocator('.detail-screen > iframe').locator('#fixture-loaded').waitFor();
    await page.locator('.detail-partner-status').waitFor({ state: 'hidden' });
    await page.unroute(partnerUrl);

    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ['/', '/games/', '/games/category/puzzle/', '/tags/', partner,
        ...games.map(game => `/games/${game.slug}/`), '/guides/glass-twist-level-2/',
        '/guides/mahjong/winning/', '/guides/marble-sort/getting-started/', '/about/', '/privacy/']) {
        await visit(path);
        await fits(`English page overflows at ${width}px: ${path}`);
      }
    }

    await visit('/games/');
    await search('Clock Out!', '/games/marble-sort/');
    await page.locator('a#clock-out').click();
    let frame = await startGame(games[2], 'en');
    await frame.locator('#start').click();
    if (await frame.locator('#guide-skip').isVisible()) await frame.locator('#guide-skip').click();
    await frame.locator('#sources button:not(:disabled)').first().click();
    assert(await frame.locator('body').evaluate(() => marbleDebug.snapshot().moves) > 0, 'Clock Out move did not register');
    await frame.getByRole('button', { name: 'Pause game', exact: true }).click();
    await frame.getByRole('button', { name: 'Keep playing', exact: true }).click();

    await visit('/games/mahjong/');
    frame = await startGame(games[1], 'en');
    await frame.locator('[data-action="open-level"][data-id="beginner"]').click();
    await frame.locator('[data-question]').waitFor();
    await frame.locator('[data-action="settings"]').click();
    await frame.locator('[data-action="set-language"][data-id="en"]').waitFor();

    await visit('/play/screw-sort/?lang=en');
    await page.locator('#level-label').waitFor();
    await page.evaluate(() => {
      localStorage.removeItem('screw-sort.glass.v1.round');
      localStorage.setItem('screw-sort.glass.v1', JSON.stringify({ unlocked: 3, completed: [1, 2], lang: 'zh', sound: false }));
    });
    await visit('/play/screw-sort/?lang=unsupported');
    assert(await page.locator('html').getAttribute('lang') === 'en', 'Unsupported game locale falls back to English');
    assert((await page.locator('#level-label').innerText()).toUpperCase() === 'LEVEL 3', 'Existing save was not restored');

    await visit('/games/screw-sort/');
    frame = await startGame(games[0], 'en');
    await frame.locator('#play').click();
    await frame.locator('.screw-button:not(:disabled)').first().click();
    await frame.locator('#pause').click();
    await frame.locator('.language-options').waitFor();
    assert((await frame.locator('.language-options button').allTextContents()).length === 2, 'Unexpected change to game language options');

    const context = await page.context().browser().newContext({ javaScriptEnabled: false });
    try {
      const reader = await context.newPage();
      await reader.goto(base + '/guides/mahjong/tiles/');
      await reader.locator('.reading-contents a').last().click();
      assert(reader.url().includes('#section-'), 'Guide contents require JavaScript');
    } finally {
      await context.close();
    }
  }
  assert(errors.length === 0, errors.join('\n'));
  return { profile: english ? 'English regression' : 'Locale smoke', locales: results };
}
