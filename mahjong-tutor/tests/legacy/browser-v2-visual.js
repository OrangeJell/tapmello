async(page)=>{
  const base='http://127.0.0.1:4198/',out='/Users/chenliangyu/project_cly/gogoGame/mahjong-tutor/output/';
  const assert=(v,m)=>{if(!v)throw Error(m)};
  let checks=0;
  for(const lang of ['zh','en'])for(const width of [320,375,768,1440]){
    await page.setViewportSize({width,height:1000});await page.goto(base);await page.evaluate(lang=>{const p=JSON.parse(localStorage.getItem('mahjong-tutor.v2'));p.lang=lang;localStorage.setItem('mahjong-tutor.v2',JSON.stringify(p));},lang);await page.reload();
    for(const route of ['#battle/chow','#battle/kong','#learn/advanced/patterns-combine']){
      await page.goto(base+route);
      if(route==='#battle/chow')await page.locator('[data-action="proto-chow"]').click();
      if(route==='#battle/kong')await page.locator('[data-action="proto-kong"]').click();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+lang+width+route);
      const covered=await page.evaluate(()=>{const hand=document.querySelector('.hand-grid');return hand&&hand.getBoundingClientRect().bottom>document.querySelector('.board-bottom').getBoundingClientRect().top});assert(!covered,'hand covered');checks++;
    }
  }
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('mahjong-tutor.v2'));p.lang='zh';localStorage.setItem('mahjong-tutor.v2',JSON.stringify(p));});await page.reload();
  for(const [name,route,width] of [['home-desktop','#home',1440],['table-desktop','#battle/chow',1440],['table-mobile','#battle/chow',375],['lesson-mobile','#learn/advanced/patterns-combine',375],['article-mobile','#article/advanced',375]]){
    await page.setViewportSize({width,height:width===1440?1000:812});await page.goto(base+route);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});await page.screenshot({path:out+'v2-'+name+'.png',fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'#home');return {checks,screenshots:5};
}
