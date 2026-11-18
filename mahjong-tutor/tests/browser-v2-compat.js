async (page) => {
  const base='http://127.0.0.1:4173/play/mahjong/',results=[],assert=(v,m)=>{if(!v)throw Error(m)};
  const browser=page.context().browser();
  const ctx=await browser.newContext({viewport:{width:375,height:812}}),tab=await ctx.newPage();
  await tab.goto(base);
  await tab.evaluate(()=>{localStorage.setItem('mahjong-tutor.v1',JSON.stringify({version:1,lang:'en',labels:false,done:[0,5],active:1,records:{1:{step:2}}}));});
  await tab.reload();
  assert(await tab.locator('html').getAttribute('lang')==='en','migrated language');
  let p=await tab.evaluate(()=>JSON.parse(localStorage.getItem('mahjong-tutor.v2')));assert(p.completed.length===8&&p.completed.includes('guided-round')&&!p.completed.includes('seven-pairs-recognize')&&!p.labels,'migrated progress');
  for(const [old,newHash] of [[1,'#learn/beginner/legacy-0-0'],[2,'#learn/beginner/legacy-1-2'],[3,'#learn/beginner/legacy-2-0'],[4,'#learn/intermediate/legacy-3-0'],[5,'#learn/intermediate/legacy-4-0'],[6,'#learn/advanced/guided-round']]){
    await tab.goto(base+'#lesson/'+old);await tab.waitForURL('**/'+newHash);assert(tab.url().endsWith(newHash),'old route '+old);
  }
  await tab.reload();assert(tab.url().endsWith('#learn/advanced/guided-round'),'refresh route');
  await tab.locator('.skip').focus();await tab.keyboard.press('Enter');assert(tab.url().endsWith('#learn/advanced/guided-round'),'skip retains route');
  await tab.locator('[data-action="settings"]').click();await tab.locator('[data-action="reset"]').click();await tab.locator('[data-action="close-modal"]').first().click();assert(await tab.locator('[data-action="reset"]').isVisible(),'reset cancellation');await tab.locator('[data-action="reset"]').click();await tab.locator('[data-action="confirm-reset"]').click();await tab.reload();
  p=await tab.evaluate(()=>JSON.parse(localStorage.getItem('mahjong-tutor.v2')));assert(p.completed.length===0&&p.lang==='en'&&!p.labels,'reset preserves settings, v1 stays retired');results.push('migration, all six legacy URLs, refresh, skip, reset');
  await tab.evaluate(()=>localStorage.setItem('mahjong-tutor.v2','{broken'));await tab.reload();assert(await tab.locator('.level-card').count()===3,'corrupt recovery');await tab.locator('[data-action="open-level"]').first().click();await tab.locator('[data-action="select"][data-index="1"]').click();await tab.locator('[data-action="check"]').click();await tab.locator('.feedback.correct').waitFor();results.push('corrupt storage playable');
  await ctx.close();
  const denied=await browser.newContext(),deniedTab=await denied.newPage();await deniedTab.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError')}}));await deniedTab.goto(base);assert((await deniedTab.locator('.home-footer').textContent()).includes('Storage unavailable'),'blocked notice');await deniedTab.locator('[data-action="open-level"]').first().click();await deniedTab.locator('[data-action="select"][data-index="1"]').click();await deniedTab.locator('[data-action="check"]').click();await deniedTab.locator('.feedback.correct').waitFor();await denied.close();results.push('blocked storage playable');
  await page.goto(base+'#practice');const names=await page.evaluate(async()=>{const {tileName}=await import('./js/tiles.js'),{winningTilesFor}=await import('./js/rules.js');const lang=document.documentElement.lang==='en'?'en':'hi';const names=Array.from({length:34},(_,i)=>tileName(i,lang));return winningTilesFor([...document.querySelectorAll('.hand-grid .tile')].map(e=>names.indexOf(e.getAttribute('aria-label')))).map(id=>names[id]);});
  for(const name of names)await page.locator('.tile-options').getByRole('button',{name,exact:true}).click();await page.locator('[data-action="check"]').click();await page.locator('.feedback.correct').waitFor();assert(await page.locator('.solutions summary').count()===names.length,'all waits');await page.locator('[data-action="new-practice"]').click();assert(await page.locator('[data-action="check"]').isDisabled(),'new practice');results.push('random practice and complete waits');
  return {results};
}
