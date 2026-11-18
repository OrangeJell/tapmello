async(page)=>{
  const base='http://127.0.0.1:4173/play/mahjong/',errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const assert=(v,m)=>{if(!v)throw Error(m)};
  await page.goto(base+'#articles');
  const ids=await page.evaluate(async()=>(await import('./js/catalog.js')).articles.map(a=>a.id));
  let checked=0;
  for(const lang of ['en','hi']){
    await page.locator('[data-action="settings"]').click();await page.locator(`[data-action="set-language"][data-id="${lang}"]`).click();await page.keyboard.press('Escape');
    for(const width of [320,375,768,1440]){
      await page.setViewportSize({width,height:900});
      await page.goto(base+'#home');
      assert(await page.locator('.level-card').count()===3,'three levels');
      assert(await page.locator('a[href*="battle"]').count()===0,'no table entry');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow');
      for(const id of ids){
        await page.goto(base+'#articles');assert(await page.locator('.article-list>a').count()===7,'seven articles');
        await page.locator(`a[href="#article/${id}"]`).click();await page.locator('.reading-section').first().waitFor();
        const hash=await page.evaluate(()=>location.hash);
        const contents=page.locator('[data-action="article-section"]');
        assert(await contents.count()>=5,'contents entries');
        const last=(await contents.count())-1;
        await contents.last().click();
        assert(await page.evaluate(()=>location.hash)===hash,'contents preserve route');
        assert(await page.locator(`#article-section-${last} h2`).evaluate(el=>el===document.activeElement),'contents keyboard focus');
        assert(await page.locator(`#article-section-${last} h2`).evaluate(el=>el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().top<innerHeight),'heading visible');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'article overflow '+lang+width+id);
        assert(await page.locator('.article .tile').count()>0,'illustrations');
        assert(!/人机|对战原型|prototype table|opponent table/i.test(await page.locator('main').textContent()),'no removed feature copy');
        checked++;
      }
    }
  }
  for(const scene of ['draw','chow','pung','kong','win','exhausted']){await page.goto(base+'#battle/'+scene);await page.locator('.level-grid').waitFor();assert(page.url().endsWith('#home'),'old table route');}
  await page.locator('[data-action="settings"]').click();await page.locator('[data-action="set-language"][data-id="en"]').click();await page.keyboard.press('Escape');
  for(const [name,hash,width] of [['home-desktop','#home',1440],['article-desktop','#article/tiles',1440],['article-mobile','#article/tiles',375]]){
    await page.setViewportSize({width,height:900});await page.goto(base+hash);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));scrollTo(0,0);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    await page.screenshot({path:'/Users/chenliangyu/project_cly/gogoGame/mahjong-tutor/output/v3-'+name+'.png',fullPage:hash==='#home'});
  }
  await page.locator('[data-action="article-section"][data-index="0"]').click();await page.screenshot({path:'/Users/chenliangyu/project_cly/gogoGame/mahjong-tutor/output/v3-article-detail-mobile.png'});
  assert(errors.length===0,errors.join(';'));return {articles:7,checked,legacyRedirects:6,errors};
}
