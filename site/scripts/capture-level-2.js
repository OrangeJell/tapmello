async page => {
  const base = 'http://127.0.0.1:4173/play/screw-sort/';
  const results = [];
  await page.setViewportSize({ width: 390, height: 844 });
  async function ready(lang) {
    await page.goto(`${base}?lang=${lang}&qa=1&previewLevel=2`);
    await page.locator('#play').click();
    await page.evaluate(() => glassDebug.idle());
  }
  async function take(id) {
    const before = await page.evaluate(() => glassDebug.snapshot().state.moves);
    await page.locator(`[data-screw="${id}"]`).click();
    await page.waitForFunction(n => glassDebug.snapshot().state.moves === n + 1, before);
    await page.waitForFunction(() => glassDebug.snapshot().pending === 0);
    await page.evaluate(() => glassDebug.idle());
  }
  async function capture(name, suffix) {
    await page.locator('#game').screenshot({ path: `site/dist/assets/guides/screw-sort-${name}${suffix}.png` });
    return await page.evaluate(() => glassDebug.snapshot().state);
  }
  for (const lang of ['en', 'hi']) {
    const suffix = lang === 'hi' ? '-hi' : '';
    await ready(lang);
    const start = await capture('level-2', suffix);
    for (const id of ['p30s0', 'p28s0', 'p28s1', 'p24s0', 'p24s1', 'p24s2']) await take(id);
    const opening = await capture('level-2-opening', suffix);
    if (opening.packed !== 6 || opening.buffer.length || opening.boxes.slice(0, 2).some(b => b.color !== 'coral')) throw Error('Opening no longer matches the guide');
    for (const id of ['p27s0', 'p25s0', 'p29s0']) await take(id);
    const next = await page.evaluate(() => glassDebug.snapshot().state);
    if (next.packed !== 9 || next.buffer.length || next.boxes[0].color !== 'blue') throw Error('Next red box no longer matches the guide');
    await ready(lang);
    const path = [];
    while (path.length < 75) {
      const next = await page.evaluate(async () => {
        const [{ LEVELS }, { availableScrews, targetBox }] = await Promise.all([import('./js/levels.js'), import('./js/engine.js')]);
        const { state, levelId } = glassDebug.snapshot();
        if (state.status !== 'playing' || state.buffer.length >= 3) return null;
        const choices = availableScrews(LEVELS.find(l => l.id === levelId), state);
        return (choices.find(s => targetBox(state, s.color) >= 0) || choices[0])?.id;
      });
      if (!next) break;
      await take(next); path.push(next);
    }
    const tray = await capture('level-2-tray', suffix);
    if (tray.buffer.length !== 3 || tray.status !== 'playing') throw Error('Tray example no longer matches the guide');
    results.push({ lang, start: start.boxes, opening: { packed: opening.packed, boxes: opening.boxes }, tray: { packed: tray.packed, boxes: tray.boxes, buffer: tray.buffer }, path });
  }
  return results;
}
