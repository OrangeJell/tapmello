async (page) => {
  const results=[],errors=[];
  const check=(value,message)=>{if(!value)throw new Error(message);results.push(message);};
  page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:4173';
  const gameFrame=()=>page.frames().find(frame=>frame.url().includes('/play/marble-sort/'));
  const state=()=>gameFrame().evaluate(()=>marbleDebug.snapshot());
  const start=async()=>{
    const frame=gameFrame();
    await frame.locator('#start').click();
    const skip=frame.locator('#guide-skip');
    if(await skip.isVisible())await skip.click();
  };
  const ready=async()=>{await page.locator('.detail-play').click();await page.locator('[data-marble-embed][data-state="ready"]').waitFor();};
  for(const width of [360,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/');
    check(await page.locator('.collection-game').count()===12,`${width}px: twelve game entries`);
    check(await page.locator('.collection-game').first().getAttribute('id')==='clock-out',`${width}px: Clock Out is the primary game`);
    if(width===390||width===1440)await page.screenshot({path:`output/playwright/shuttle-home-${width}.png`,fullPage:true});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: homepage fits`);
    await page.locator('#clock-out').click();await ready();
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: game page fits`);
    check(await page.locator('#levels li').count()===4,`${width}px: four difficulty bands`);
    const autoFinish = page.locator('#questions details').filter({ hasText: 'Why did the game switch to 4×?' });
    check((await autoFinish.textContent()).includes('automatically accelerates'),`${width}px: automatic finish explained`);
    check(await gameFrame().evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: embedded game fits`);
    const sizes=await gameFrame().evaluate(()=>({game:document.querySelector('.game').getBoundingClientRect().height,viewport:innerHeight}));
    check(Math.abs(sizes.viewport-sizes.game)<38,`${width}px: iframe height follows content`);
    if(width===390||width===1440)await page.screenshot({path:`output/playwright/marble-site-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/games/marble-sort/');await ready();
  await page.clock.install();
  try {
    const drain=async()=>{
      for(let i=0;i<90;i++){
        await page.clock.runFor(1000);const s=await state();
        if(s.status==='lost')throw new Error('documented opening jammed');
        if(!s.pending.length&&!s.boxes.some(b=>b?.filled===3)&&!s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color)))return s;
      }
      throw new Error('opening did not settle');
    };
    await gameFrame().evaluate(()=>{localStorage.removeItem('marble-sort.level');localStorage.setItem('marble-sort.tutorial-mystery-done','true');});
    await page.reload();await ready();await start();
    check((await state()).capacity===27,'new round has 27 slots');
    const opening=await gameFrame().evaluate(async()=>{
      const {createLevel}=await import(new URL('js/levels.js',location.href));return createLevel(1).stages[0].route;
    });
    const initial=await state(),front=new Set(initial.columns.flatMap(column=>column[0]?.colors??[]));
    check(initial.boxes.every(box=>front.has(box.color)),'all opening bus colours are available in front offices');
    for(const column of opening.slice(0,2)){await gameFrame().locator('#sources button').nth(column).click();await drain();}
    check((await state()).occupied===0&&(await state()).collected===18,'first two offices board 18 workers without a backlog');
    await page.screenshot({path:'output/playwright/marble-opening-18.png',fullPage:true});
    await gameFrame().locator('#sources button').nth(opening[2]).click();await drain();
    check((await state()).collected===27&&(await state()).occupied===0&&(await state()).status==='playing','three matching offices clear the first 27 workers');
    await gameFrame().locator('.game').screenshot({path:'output/playwright/marble-opening-game.png'});
    await gameFrame().locator('#sources button').nth(opening[3]).click();await drain();
    check((await state()).collected===36&&(await state()).occupied===0,'documented opening clears 36 workers without tools');
    await gameFrame().getByRole('button',{name:'Pause game',exact:true}).click();
    const time=(await state()).time;await page.clock.runFor(3000);
    check((await state()).paused&&(await state()).time===time,'pause freezes embedded physics');
    await gameFrame().getByRole('button',{name:'Keep playing',exact:true}).click();
    await gameFrame().getByRole('button',{name:'How to play',exact:true}).click();
    check(await gameFrame().getByRole('heading',{name:'Match riders to their shuttle'}).isVisible(),'English help is translated');
    await gameFrame().getByRole('button',{name:'Got it — let’s sort'}).click();
    await page.reload();await ready();await page.clock.runFor(1000);await start();
    await gameFrame().locator('#sources button').nth(1).click();await page.clock.runFor(2000);
    await gameFrame().locator('#undo').click();
    check((await state()).moves===0&&(await state()).undoLeft===0,'undo restores the previous release');
    await gameFrame().locator('#expand').click();
    check((await state()).capacity===36&&(await state()).expanded,'expansion adds nine slots');
    const height=await page.locator('#marble-frame').getAttribute('style');
    await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,data:{type:'tapmelo-marble-ready',height:400}})));
    check(await page.locator('#marble-frame').getAttribute('style')===height,'embed ignores a forged message source');
  } finally {await page.clock.resume();}
  await page.locator('.language-picker summary').click();
  await page.getByRole('link',{name:'हिन्दी',exact:true}).click();await ready();
  check(page.url().includes('/hi/games/marble-sort/'),'language switch stays on the game');
  check(await gameFrame().evaluate(()=>document.documentElement.lang)==='hi','iframe receives Hindi');
  await start();
  await gameFrame().getByRole('button',{name:'कैसे खेलें',exact:true}).click();
  check(await gameFrame().getByRole('heading',{name:'यात्रियों को उनकी बस में बिठाएँ'}).isVisible(),'Hindi help is translated');
  await gameFrame().getByRole('button',{name:'समझ गए — शुरू करें'}).click();
  await page.screenshot({path:'output/playwright/marble-site-hi-mobile.png',fullPage:true});
  await page.getByRole('link',{name:'अगली चाल समझें'}).click();
  await page.waitForTimeout(100);
  check((await state()).paused,'off-screen game pauses while reading guides');
  for(const prefix of ['','/hi']) {
    for(const id of ['getting-started','belt-space','mystery-packs','level-1-opening']) {
      await page.goto(base+prefix+'/guides/marble-sort/'+id+'/');
      check(await page.locator('.reading-section').count()===3,`${prefix||'/en'}/${id}: three guide sections`);
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${prefix||'/en'}/${id}: mobile article fits`);
      await page.locator('.reading-contents a').first().click();
      check(page.url().endsWith('#step-1'),`${prefix||'/en'}/${id}: contents link works`);
    }
  }
  const context=await page.context().browser().newContext({javaScriptEnabled:false});
  const reader=await context.newPage();
  for(const prefix of ['','/hi']) {
    await reader.goto(base+prefix+'/games/marble-sort/');
    check(await reader.locator('.game-guide-link').count()===4,`${prefix||'/en'}: four guides without JavaScript`);
    await reader.goto(base+prefix+'/guides/marble-sort/level-1-opening/');
    check(await reader.locator('.marble-route b').allTextContents().then(v=>v.join(',')==='3,1,5,2,4,3'),`${prefix||'/en'}: opening route readable without JavaScript`);
  }
  await context.close();
  // Exercise the genuine timeout and retry by blocking the iframe request once.
  await page.route('**/play/marble-sort/**',route=>route.abort());
  await page.goto(base+'/games/marble-sort/');
  try {
    await page.clock.runFor(16000);
    check(await page.locator('[data-marble-embed]').getAttribute('data-state')==='error','failed iframe shows an error');
    check(await page.getByRole('button',{name:'Try again',exact:true}).isVisible(),'failed iframe offers retry');
    await page.unroute('**/play/marble-sort/**');
    await page.getByRole('button',{name:'Try again',exact:true}).click();await ready();
    check(await gameFrame().locator('#start').isVisible(),'retry loads a playable game');
  }finally{await page.clock.resume();}
  check(errors.length===0,'no uncaught browser errors');
  return {checks:results.length,results,errors};
}
