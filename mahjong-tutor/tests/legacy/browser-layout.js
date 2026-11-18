async (page) => {
  const failures = [], checked = [];
  const base = 'http://127.0.0.1:4198/';
  const out = '/Users/chenliangyu/project_cly/gogoGame/mahjong-tutor/output/';
  await page.goto(base);
  await page.evaluate(() => localStorage.removeItem('mahjong-tutor.v1'));
  await page.reload();
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const lang of ['zh','en']) {
    if (lang === 'en') await page.locator('[data-action="language"]').click();
    for (const route of ['#home','#lesson/1','#lesson/2','#lesson/3','#lesson/4','#lesson/5','#lesson/6']) {
      await page.goto(base+route);
      await page.locator('main h1').waitFor();
      if (route === '#lesson/6') await page.locator('[data-action="round-draw"]').click();
      for (const width of [320,375,768,1024,1440]) {
        await page.setViewportSize({width,height:900});
        await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => {}))));
        const check = await page.evaluate(() => ({
          width:innerWidth, scroll:document.documentElement.scrollWidth,
          images:[...document.images].every(i => i.complete && i.naturalWidth > 0),
          badButtons:[...document.querySelectorAll('main button')].filter(el => {const r=el.getBoundingClientRect();return r.width < 24 || r.height < 24;}).map(el=>el.getAttribute('aria-label')||el.textContent.trim())
        }));
        if (check.scroll>check.width || !check.images || check.badButtons.length) failures.push({lang,route,...check});
        checked.push({lang,route,width});
        if (lang==='zh' && route==='#home' && width===375) await page.screenshot({path:out+'home-mobile.png',fullPage:true});
        if (lang==='zh' && route==='#lesson/1' && width===1440) await page.screenshot({path:out+'lesson-desktop.png',fullPage:true});
        if (lang==='zh' && route==='#lesson/6' && width===375) await page.screenshot({path:out+'round-mobile.png',fullPage:true});
        if (lang==='en' && route==='#lesson/4' && width===375) await page.screenshot({path:out+'calls-mobile-en.png',fullPage:true});
      }
    }
    // Reset only the scripted hand checkpoint for the other language's layout pass.
    await page.evaluate(() => {const s=JSON.parse(localStorage.getItem('mahjong-tutor.v1'));s.records[5]={step:0};localStorage.setItem('mahjong-tutor.v1',JSON.stringify(s));});
    await page.reload();
  }
  await page.locator('[data-action="reference"]').click();
  await page.setViewportSize({width:375,height:812});
  const dialogOverflow = await page.locator('dialog').evaluate(el=>el.scrollWidth>el.clientWidth);
  if(dialogOverflow) failures.push({dialogOverflow});
  await page.keyboard.press('Escape');
  await page.goto(base+'#lesson/5');
  const before=await page.url();
  await page.keyboard.press('Tab');
  await page.locator('.skip').focus();
  await page.keyboard.press('Enter');
  if(await page.url()!==before) failures.push({skip:'changed route'});
  await page.evaluate(() => {localStorage.removeItem('mahjong-tutor.v1');});
  await page.goto(base+'#home');
  await page.reload();
  await page.setViewportSize({width:1440,height:1050});
  return {layouts:checked.length, failures, reducedMotion:true};
}
