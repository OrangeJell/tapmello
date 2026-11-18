async page => {
  const base = 'http://127.0.0.1:4173', output = 'screw-sort-game/output/playwright/';
  const results = [];
  for (const [width, route, name] of [
    [390, '/guides/glass-twist-level-2/', 'glass-twist-guide-390'],
    [320, '/hi/guides/glass-twist-level-2/', 'glass-twist-guide-hi-320'],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + route);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => {
      image.loading = 'eager';
      return image.decode();
    })));
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      imageFirst: document.querySelector('#opening img').getBoundingClientRect().top < document.querySelector('#opening ol').getBoundingClientRect().top,
    }));
    if (layout.overflow || !layout.imageFirst) throw Error(JSON.stringify(layout));
    await page.screenshot({ path: output + name + '.png', fullPage: true });
    for (const [section, suffix] of [['#opening', 'opening'], ['#temporary-slots', 'tray']]) {
      await page.locator(section).screenshot({ path: output + name + '-' + suffix + '.png' });
    }
    results.push({ route, width, ...layout });
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base + '/games/screw-sort/');
  await page.waitForFunction(() => document.querySelector('#game-embed').dataset.state === 'ready');
  await page.screenshot({ path: output + 'glass-twist-game-390-top.png' });
  await page.goto(base + '/play/screw-sort/?lang=en&qa=1&previewLevel=1');
  await page.screenshot({ path: output + 'glass-twist-launch-390.png' });
  await page.goto(base + '/guides/glass-twist-level-2/');
  return results;
}
