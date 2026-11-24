async page => {
  const base = 'http://127.0.0.1:4173';
  const errors = [], results = [];
  const assert = (value, message) => { if (!value) throw Error(message); };
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/', '/hi/', '/screw-sort', '/hi/screw-sort', '/guides/glass-twist-level-2/', '/hi/guides/glass-twist-level-2/', '/about/', '/contact/', '/privacy/', '/terms/']) {
      await page.goto(base + route);
      if (route.includes('/games/')) {
        await page.locator('.detail-play').click();
        await page.waitForFunction(() => document.querySelector('#game-embed').dataset.state === 'ready');
      }
      await page.locator('img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        headings: document.querySelectorAll('h1').length,
        chinese: /[\u4e00-\u9fff]/u.test(document.body.innerText),
        images: [...document.querySelectorAll('img')].every(image => image.naturalWidth > 0),
        card: document.querySelector('.card-visual')?.getBoundingClientRect().width,
      }));
      assert(!layout.overflow && layout.headings === 1 && !layout.chinese && layout.images, `${route}/${width}: ${JSON.stringify(layout)}`);
      if (layout.card) assert(layout.card <= width, `Clipped screenshot card: ${route}/${width}`);
      if (route.includes('/games/')) {
        const frame = page.frameLocator('#game-frame');
        const lang = await frame.locator('html').getAttribute('lang');
        assert(lang === (route.startsWith('/hi/') ? 'hi' : 'en'), `Wrong iframe language: ${route}`);
        await page.locator('#faq summary').first().focus();
        await page.keyboard.press('Enter');
        assert(await page.locator('#faq details').first().getAttribute('open') !== null, 'Keyboard FAQ did not open');
        await page.locator('#faq summary').first().click();
        assert(await page.locator('#faq details').first().getAttribute('open') === null, 'Pointer FAQ did not close');
      }
      results.push({ route, width, status: 'passed' });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/screw-sort');
  await page.locator('.detail-play').click();
  await page.waitForFunction(() => document.querySelector('#game-embed').dataset.state === 'ready');
  const frame = page.frameLocator('#game-frame');
  await frame.locator('#play').click();
  await frame.locator('.screw-button:not(:disabled)').first().click();
  await frame.locator('#pause').click();
  assert(await frame.locator('.language-options button').allTextContents().then(names => names.join(',') === 'English,हिन्दी'), 'Unexpected game languages');
  await frame.getByRole('button', { name: 'हिन्दी', exact: true }).click();
  assert(await frame.locator('html').getAttribute('lang') === 'hi', 'Game language did not switch');
  await frame.getByRole('button', { name: 'खेल जारी रखें', exact: true }).click();
  await page.screenshot({ path: 'screw-sort-game/output/playwright/site-game-390.png', fullPage: true });
  await page.locator('#how-to-play').screenshot({ path: 'screw-sort-game/output/playwright/site-guide-390.png' });
  await page.locator('#levels').screenshot({ path: 'screw-sort-game/output/playwright/site-levels-390.png' });
  await page.goto(base + '/hi/screw-sort');
  await page.locator('.detail-play').click();
  await page.waitForFunction(() => document.querySelector('#game-embed').dataset.state === 'ready');
  await page.locator('#how-to-play').screenshot({ path: 'screw-sort-game/output/playwright/site-guide-hi-390.png' });
  await page.goto(base + '/hi/');
  await page.screenshot({ path: 'screw-sort-game/output/playwright/site-home-hi-390.png', fullPage: true });
  await page.goto(base + '/play/screw-sort/?lang=en&qa=1&previewLevel=1');
  await page.evaluate(() => {
    localStorage.removeItem('screw-sort.glass.v1.round');
    localStorage.setItem('screw-sort.glass.v1', JSON.stringify({ unlocked: 3, completed: [1, 2], lang: 'zh', sound: false }));
  });
  await page.goto(base + '/play/screw-sort/?lang=zh&qa=1');
  assert(await page.locator('html').getAttribute('lang') === 'en', 'Old Chinese preference did not fall back');
  assert(await page.locator('#level-label').innerText() === 'LEVEL 3', 'Language fallback lost completed progress');
  const context = await page.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const staticPage = await context.newPage();
  const expectedLevels = await page.evaluate(async () => (await import('./js/levels.js')).LEVELS.length);
  for (const route of ['/screw-sort', '/hi/screw-sort']) {
    await staticPage.goto(base + route);
    assert(await staticPage.locator('#how-to-play li').count() === 4, 'No-JS steps missing');
    assert(await staticPage.locator('#levels tbody tr').count() === expectedLevels, 'No-JS catalogue missing');
    await staticPage.locator('#faq summary').first().click();
    assert(await staticPage.locator('#faq details').first().getAttribute('open') !== null, 'No-JS FAQ failed');
  }
  for (const route of ['/guides/glass-twist-level-2/', '/hi/guides/glass-twist-level-2/']) {
    await staticPage.goto(base + route);
    assert(await staticPage.locator('#opening li').count() === 3, 'No-JS opening guide missing');
    assert(await staticPage.locator('article img').count() === 3, 'No-JS walkthrough screenshots missing');
    assert(await staticPage.locator(`a[href$="/screw-sort#game-embed"]`).count() === 2, 'Walkthrough return links missing');
  }
  await context.close();
  assert(errors.length === 0, errors.join('\n'));
  return { results, gameLanguages: 'English/Hindi', legacyLanguage: 'English with progress preserved', noJavaScript: 'guides and FAQ passed', errors };
}
