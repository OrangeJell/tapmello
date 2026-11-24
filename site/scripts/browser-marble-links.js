async page => {
 const checks=[]; const check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const base='http://127.0.0.1:4173';
 for(const language of ['en','hi']) {
   const prefix=language==='hi'?'/hi':'';
   await page.setViewportSize({width:390,height:844});
   await page.goto(base+prefix+'/guides/marble-sort/level-1-opening/');
   check(await page.locator('.marble-route b').allTextContents().then(values=>values.join(',')==='3,1,5,2,4,3'),'six-move opening renders '+language);
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'opening guide fits '+language);
   if(language==='en')await page.screenshot({path:'output/playwright/marble-guide-final.png',fullPage:true});
   await page.goto(base+'/play/marble-sort/?lang='+language);
   await page.locator('#start').waitFor();
   check(await page.locator('#site-back').isVisible(),'standalone return link visible '+language);
   await page.locator('#site-back').click();await page.locator('.detail-play').click();await page.locator('[data-marble-embed][data-state=ready]').waitFor();
   check(page.url().includes(prefix+'/marble-sort'),'standalone returns to matching language '+language);
   const frame=page.frameLocator('#marble-frame');
   check(await frame.locator('#site-back').isHidden(),'embedded return link hidden '+language);
 }
 for(const prefix of ['','/hi']) {
   await page.goto(base+prefix+'/mahjong');await page.locator('.detail-play').click();await page.locator('[data-mahjong-embed][data-state=ready]').waitFor();
   check(await page.frameLocator('#mahjong-frame').locator('.level-card').count()===3,'Mahjong still loads '+prefix);
   await page.goto(base+prefix+'/screw-sort');
   check(await page.locator('#game-frame').count()===1,'Glass Twist iframe preserved '+prefix);
   await page.locator('.detail-play').click();
   await page.locator('#game-embed[data-state=ready]').waitFor();
   check(await page.locator('#faq details').count()===9,'Glass Twist guide preserved '+prefix);
 }
 return {passed:checks.length,checks};
}
