async (page) => {
  const base='http://127.0.0.1:4198/',out='/Users/chenliangyu/project_cly/gogoGame/mahjong-tutor/output/';
  const assert=(v,m)=>{if(!v)throw Error(m)}, checked=[];
  await page.emulateMedia({reducedMotion:'reduce'});
  const routes=['#home','#learn/beginner/legacy-0-0','#learn/beginner/legacy-1-2','#learn/intermediate/legacy-3-0','#learn/intermediate/legacy-4-1','#learn/advanced/thirteen-orphans','#learn/advanced/patterns-combine','#learn/advanced/guided-round','#articles','#article/advanced','#battle/draw','#battle/chow','#battle/pung','#battle/kong','#battle/win','#battle/exhausted'];
  routes[5]='#learn/advanced/orphans-recognize';
  for(const lang of ['zh','en']){
    await page.goto(base);await page.evaluate(lang=>{const p=JSON.parse(localStorage.getItem('mahjong-tutor.v2'));p.lang=lang;p.labels=true;localStorage.setItem('mahjong-tutor.v2',JSON.stringify(p));},lang);await page.reload();
    for(const width of [320,375,768,1440]){
      await page.setViewportSize({width,height:width>768?1000:812});
      for(const route of routes){
        await page.goto(base+route);await page.locator('main').waitFor();
        if(await page.locator('[data-action="begin-question"]').count())await page.locator('[data-action="begin-question"]').click();
        await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
        const result=await page.evaluate(()=>{
          const visible=[...document.querySelectorAll('main button')].filter(e=>e.getBoundingClientRect().width>0);
          const buttons=visible.map(e=>({rect:e.getBoundingClientRect().toJSON(),label:e.textContent.trim()}));
          const hand=document.querySelector('.hand-grid');const tiles=hand?[...hand.children]:[];
          return {overflow:document.documentElement.scrollWidth>innerWidth,small:buttons.filter(x=>x.rect.width<24||x.rect.height<24),clipped:buttons.filter(x=>x.rect.left<0||x.rect.right>innerWidth),rows:new Set(tiles.map(e=>Math.round(e.getBoundingClientRect().top))).size,overlap:!!hand&&!!document.querySelector('.board-bottom')&&hand.getBoundingClientRect().bottom>document.querySelector('.board-bottom').getBoundingClientRect().top};
        });
        assert(!result.overflow&&!result.small.length&&!result.clipped.length&&!result.overlap,JSON.stringify({lang,width,route,result}));
        if(route==='#battle/draw')assert(result.rows<=(width===320?3:2),'hand rows '+width);
        checked.push({lang,width,route});
      }
      await page.locator('[data-action="settings"]').click();await page.locator('[data-action="reference"]').click();assert(await page.locator('dialog .reference-grid button').count()===34,'34 reference tiles');
      assert(await page.evaluate(()=>document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth),'dialog overflow');await page.keyboard.press('Escape');
    }
  }
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('mahjong-tutor.v2'));p.lang='zh';localStorage.setItem('mahjong-tutor.v2',JSON.stringify(p));});await page.reload();
  for(const [name,route,width] of [['home-desktop','#home',1440],['table-desktop','#battle/chow',1440],['table-mobile','#battle/chow',375],['lesson-mobile','#learn/advanced/patterns-combine',375],['article-mobile','#article/advanced',375]]){
    await page.setViewportSize({width,height:width===1440?1000:812});await page.goto(base+route);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await page.screenshot({path:out+'v2-'+name+'.png',fullPage:true});
  }
  return {checked:checked.length,widths:[320,375,768,1440],languages:['zh','en'],screenshots:5};
}
