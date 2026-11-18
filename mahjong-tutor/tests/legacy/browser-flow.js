async (page) => {
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = 'http://127.0.0.1:4198/';
  await page.goto(base);
  await page.evaluate(() => localStorage.removeItem('mahjong-tutor.v1'));
  await page.reload();
  await page.setViewportSize({width: 390, height: 844});
  const lessons = await page.evaluate(async () => (await import('./js/lessons.js')).lessons);
  const answers = [
    [[1], [1], [2], [0, 2, 4], [1]],
    [[0, 2], [0, 2, 4], [0, 1, 3], [1]],
    [[1], [1], [1]],
    [[0], [1], [1], [2], [1]],
    [[1], [0, 1], [2]]
  ];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  for (let lesson = 0; lesson < 5; lesson++) {
    await page.goto(base + '#lesson/' + (lesson + 1));
    for (let q = 0; q < answers[lesson].length; q++) {
      await page.getByRole('heading', {name: lessons[lesson].questions[q].prompt.zh, exact: true}).waitFor();
      if (lesson === 0 && q === 0) {
        assert(await page.locator('[data-action="check"]').isDisabled(), 'empty answers must be disabled');
        await page.locator('[data-action="select"][data-index="0"]').click();
        await page.locator('[data-action="check"]').click();
        await page.locator('.feedback.incorrect').waitFor();
        await page.locator('[data-action="hint"]').click();
        assert(await page.locator('#hint-text').isVisible(), 'hint must open');
        await page.locator('[data-action="select"][data-index="1"]').click();
        await page.locator('[data-action="language"]').click();
        assert(await page.locator('html').getAttribute('lang') === 'en', 'language must switch');
        assert(await page.locator('[data-action="select"][data-index="1"]').getAttribute('aria-pressed') === 'true', 'language must preserve selection');
        await page.locator('[data-action="language"]').click();
        await page.locator('[data-action="labels"]').click();
        assert(await page.locator('.tile-options .tile-name').count() === 0, 'labels off');
        await page.locator('[data-action="labels"]').click();
        results.push('wrong answer, retry, hint, language switch and tile-label toggle');
      } else {
        if (lesson === 0 && q === 1) {
          await page.reload();
          await page.getByRole('heading', {name: lessons[lesson].questions[q].prompt.zh, exact: true}).waitFor();
          results.push('refresh resumes the current question');
        }
        for (const index of answers[lesson][q]) await page.locator(`[data-action="select"][data-index="${index}"]`).click();
      }
      await page.locator('[data-action="check"]').click();
      await page.locator('.feedback.success').waitFor();
      assert(await page.locator('.tile-options button:not(:disabled)').count() === 0, 'correct answers lock choices');
      await page.locator('[data-action="next"]').click();
    }
    await page.locator('.completion').waitFor();
    results.push('completed lesson ' + (lesson + 1));
  }
  await page.goto(base + '#lesson/6');
  await page.locator('[data-action="round-draw"]').click();
  await page.locator('.full-hand button[aria-label="东风"]').first().click();
  await page.locator('[data-action="round-discard"]').click();
  await page.locator('.feedback.incorrect').waitFor();
  await page.locator('.full-hand button[aria-label="西风"]').click();
  await page.locator('[data-action="round-discard"]').click();
  await page.locator('[data-action="round-draw"]').click();
  await page.reload();
  await page.locator('.full-hand button[aria-label="南风"]').click();
  await page.locator('[data-action="round-discard"]').click();
  for (const index of [0,1]) await page.locator(`.round-waits [data-index="${index}"]`).click();
  await page.locator('[data-action="round-check"]').click();
  await page.locator('.feedback.success').waitFor();
  await page.locator('[data-action="round-continue"]').click();
  await page.locator('[data-action="round-draw"]').click();
  await page.locator('[data-action="round-win"]').click();
  await page.locator('.completion-table').waitFor();
  assert(await page.locator('.completion-table .hand-group').count() === 5, 'winning breakdown has four sets and a pair');
  results.push('guided hand: illegal tutorial discard, retry, refresh, two-sided wait, self-draw and decomposition');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mahjong-tutor.v1')));
  assert(saved.done.length === 6, 'all six lessons saved');
  await page.locator('[data-action="reference"]').click();
  assert(await page.locator('dialog .reference-tiles button').count() === 34, 'all 34 tile types in guide');
  await page.locator('dialog [data-index="18"]').click();
  assert((await page.locator('.reference-selected').textContent()).includes('1 bamboo'), 'guide tile inspection');
  await page.keyboard.press('Escape');
  assert(!await page.locator('dialog').isVisible(), 'Escape closes dialog');
  results.push('tile guide, bilingual names and keyboard close');
  await page.locator('[data-action="practice"]').click();
  await page.locator('.tile-options').waitFor();
  const practiceAnswer = await page.evaluate(async () => {
    const {winningTiles} = await import('./js/rules.js');
    const {tileName} = await import('./js/tiles.js');
    const names = Array.from({length:34}, (_, i) => tileName(i, 'zh'));
    const hand = [...document.querySelectorAll('.full-hand .tile')].map(el => names.indexOf(el.getAttribute('aria-label')));
    return winningTiles(hand).map(id => names[id]);
  });
  for (const name of practiceAnswer) await page.locator('.tile-options').getByRole('button', {name, exact:true}).click();
  await page.locator('[data-action="check"]').click();
  await page.locator('.feedback.success').waitFor();
  await page.locator('[data-action="new-practice"]').click();
  assert(await page.locator('[data-action="check"]').isDisabled(), 'new practice resets selection');
  results.push('random practice: generated hand, all waits, check and new deal');
  await page.goto(base+'#home');
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="close-dialog"]').click();
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem('mahjong-tutor.v1')))).done.length === 6, 'cancel reset preserves progress');
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="confirm-reset"]').click();
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem('mahjong-tutor.v1')))).done.length === 0, 'confirm reset clears progress');
  assert(errors.length === 0, 'no uncaught browser errors: '+errors.join(';'));
  results.push('reset cancel and confirm; no uncaught browser errors');
  return {passed: results, errors};
}
