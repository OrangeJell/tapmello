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
  return 'Captured six real gameplay screens.';
}
