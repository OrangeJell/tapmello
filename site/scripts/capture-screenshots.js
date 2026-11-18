async page => {
  const base = 'http://127.0.0.1:4173';
  await page.setViewportSize({ width: 390, height: 844 });
  const capture = name => page.locator('#game').screenshot({ path: `site/dist/assets/guides/screw-sort-${name}.png` });
  for (const lang of ['en', 'hi']) {
    const suffix = lang === 'hi' ? '-hi' : '';
    await page.goto(`${base}/play/screw-sort/?lang=${lang}&qa=1&previewLevel=1`);
    await page.locator('#play').click();
    await capture(`first-level${suffix}`);
    const id=await page.evaluate(async()=>{
      const [{LEVELS},{availableScrews}]=await Promise.all([import('./js/levels.js'),import('./js/engine.js')]);
      const {state,levelId}=glassDebug.snapshot();
      return availableScrews(LEVELS.find(level=>level.id===levelId),state).find(s=>s.color==='gold').id;
    });
    const box=await page.locator(`[data-screw="${id}"]`).boundingBox();
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.waitForFunction(()=>glassDebug.snapshot().pending===0);
    await page.evaluate(()=>glassDebug.idle());
    const tray = await page.evaluate(() => glassDebug.snapshot().state.buffer);
    if (tray.length !== 1 || tray[0].color !== 'gold') throw Error('Tray screenshot does not match the guide');
    await capture(`tray-example${suffix}`);
    await page.goto(`${base}/play/screw-sort/?lang=${lang}&qa=1&previewLevel=2`);
    await page.locator('#play').click();
    await capture(`level-2${suffix}`);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto(base + '/?capture=current');
  await page.locator('.game-preview').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.evaluate(() => {
    const visual = document.querySelector('.card-visual');
    Object.assign(visual.style, { position: 'fixed', top: '0', left: '0', zIndex: '1000', width: '1200px', height: '800px', minHeight: '800px', aspectRatio: 'auto' });
    Object.assign(visual.querySelector('.game-preview').style, { height: '660px' });
    Object.assign(visual.querySelector('.visual-heading').style, { fontSize: '20px' });
    Object.assign(visual.querySelector('figcaption').style, { fontSize: '18px' });
  });
  await page.locator('.card-visual').screenshot({ path: 'site/dist/assets/screw-sort-cover.png' });
  await page.goto(base + '/?capture=current');
  return 'Captured six real gameplay screens and the 1200×800 sharing image.';
}
