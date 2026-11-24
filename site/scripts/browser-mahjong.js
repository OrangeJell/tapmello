async page => {
  const base='http://127.0.0.1:4173', errors=[], results=[];
  const assert=(v,m)=>{if(!v)throw Error(m)};
  page.on('pageerror',e=>errors.push(e.message));
  const ids=['tiles','winning','calls','advanced','organize-hand','waiting-shapes','claim-choices'];
  for(const width of [320,375,768,1440]){
    await page.setViewportSize({width,height:900});
    for(const lang of ['en','hi']){
      const prefix=lang==='hi'?'/hi':'';
      for(const route of [prefix+'/',prefix+'/mahjong',...ids.map(id=>prefix+'/guides/mahjong/'+id+'/')]){
        await page.goto(base+route);
        await page.evaluate(()=>document.fonts.ready);
        if(route.endsWith('/mahjong')){
          await page.locator('.detail-play').click();
          await page.locator('[data-mahjong-embed][data-state="ready"]').waitFor();
          const frame=page.frameLocator('#mahjong-frame');
          assert(await frame.locator('.level-card').count()===3,'three levels');
          assert(await frame.locator('html').getAttribute('lang')===lang,'iframe language');
          assert(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'iframe overflow '+width+lang);
          assert(await page.locator('#guides .game-guide-link').count()===7,'seven guides');
        }
        if(route===prefix+'/')assert(await page.locator('.collection-game').count()===12,'twelve games');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+route+width);
        if(route.includes('/guides/mahjong/')){
          assert(await page.locator('.reading-section').count()>=5,'detailed article');
          assert(await page.locator('.mahjong-diagram .tile').count()>0,'tile examples');
          await page.locator('.reading-contents a').last().click();
          await page.waitForFunction(()=>{const el=[...document.querySelectorAll('.reading-section')].at(-1),y=el.getBoundingClientRect().top;return y>=-2&&y<900});
          const position=await page.locator('.reading-section').last().evaluate(el=>el.getBoundingClientRect().top);
          assert(position>=-2&&position<900,'article contents');
        }
        results.push(route+' @ '+width);
      }
    }
  }
  await page.goto(base+'/mahjong');
  await page.locator('.detail-play').click();
  await page.locator('[data-state="ready"]').waitFor();
  let frame=page.frameLocator('#mahjong-frame');
  await frame.locator('[data-action="open-level"][data-id="beginner"]').click();
  const question=await frame.locator('[data-question]').getAttribute('data-question');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mahjong-tutor.v2')).completed);
  await frame.locator('[data-action="settings"]').click();
  await frame.locator('[data-action="set-language"][data-id="hi"]').click();
  await page.waitForURL(base + '/hi/mahjong');
  await page.locator('[data-state="ready"]').waitFor();
  frame=page.frameLocator('#mahjong-frame');
  await frame.locator('[data-question="'+question+'"]').waitFor();
  assert(await frame.locator('html').getAttribute('lang')==='hi','language navigation');
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('mahjong-tutor.v2')).completed.join())===saved.join(),'progress preserved');
  await frame.locator('[data-action="patterns"]').click();
  await frame.locator('[data-action="related-article"]').click();
  await page.waitForURL('**/hi/guides/mahjong/**');
  await page.locator('.reading-end .outline-play').click();
  await page.locator('[data-question]').waitFor();
  assert(page.url().includes('/play/mahjong/?site=1&lang=hi&lesson='),'article to exercise');
  assert(await page.locator('.site-back').getAttribute('href')==='/hi/','direct game return');
  results.push('embedded language, progress, related article, exercise return');
  const ctx=await page.context().browser().newContext({javaScriptEnabled:false,viewport:{width:320,height:900}}), staticPage=await ctx.newPage();
  for(const lang of ['en','hi'])for(const id of ids){
    await staticPage.goto(base+(lang==='hi'?'/hi':'')+'/guides/mahjong/'+id+'/');
    assert(await staticPage.locator('.reading-section').count()>=5,'no-JS article');
    await staticPage.locator('.reading-contents a').last().click();
    assert(staticPage.url().includes('#section-'),'no-JS contents');
  }
  await ctx.close();results.push('14 articles without JavaScript');
  for(const [name,route,width] of [['home-desktop','/',1360],['home-mobile','/',375],['home-hi-mobile','/hi/',375],['mahjong-desktop','/mahjong',1440],['mahjong-mobile','/mahjong',375],['article-hi-mobile','/hi/guides/mahjong/tiles/',375]]){
    await page.setViewportSize({width,height:990});await page.goto(base+route);
    if(route.endsWith('/mahjong')) {
      await page.locator('.detail-play').click();
      await page.locator('[data-state="ready"]').waitFor();
    }
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    await page.screenshot({path:'output/playwright/tapmelo-'+name+'.png',animations:'disabled',fullPage:!route.includes('/guides/')});
  }
  assert(errors.length===0,errors.join(';'));
  return {layouts:72,results,errors};
}
