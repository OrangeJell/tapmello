async(page)=>{
  const startRound=async()=>{
    await page.clock.runFor(800);
    await page.locator('#start').click({force:true});
    if(await page.locator('#guide-skip').isVisible())await page.locator('#guide-skip').click({force:true});
  };
  await page.evaluate(()=>localStorage.setItem('marble-sort.tutorial-mystery-done','true'));
  await page.clock.install({time:new Date('2026-11-04T04:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-04T04:00:01Z'));
  const checks=[],check=(value,name)=>{if(!value)throw Error(name);checks.push(name);};
  try{
    await page.evaluate(()=>{localStorage.setItem('marble-sort.level','20');localStorage.setItem('marble-sort.sound','false');});
    await page.reload();await startRound();
    const state=()=>page.evaluate(()=>marbleDebug.snapshot());
    const overload=async()=>{
      for(let round=0;round<16;round++){
        for(let column=0;column<5;column++){
          if((await state()).status!=='playing')break;
          const button=page.locator('#sources button').nth(column);if(await button.isEnabled())await button.click({force:true});
        }
        await page.clock.runFor(10000);
        if((await state()).status==='lost'){await page.clock.runFor(800);return;}
      }
      throw Error('overload never reached loss');
    };
    await overload();
    await page.screenshot({path:'output/playwright/marble-sort/loss-mobile.png',animations:'disabled'});
    await page.getByRole('button',{name:'Try again',exact:true}).click({force:true});
    let s=await state();check(s.status==='playing'&&s.capacity===27&&s.moves===0&&!s.expanded,'retry resets level and tools');
    await overload();
    await page.getByRole('button',{name:'Expand +9 and continue',exact:true}).click({force:true});
    s=await state();check(s.status==='playing'&&s.capacity===36&&s.expanded,'failure expansion continues same board');
    await overload();
    check((await page.locator('#dialog-actions button').allTextContents()).join('|')==='Try again','second failure offers retry after expansion is spent');
    await page.getByRole('button',{name:'Try again',exact:true}).click({force:true});
    check((await state()).capacity===27&&!(await state()).expanded,'retry restores expansion after second failure');
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await startRound();await overload();
    check(await page.locator('#dialog').evaluate(e=>getComputedStyle(e).animationName==='none'),'reduced motion removes result animation');
    check(await page.locator('#effects-setting').isHidden(),'failure screen has no extra sound button');
    return{checks};
  }finally{await page.clock.resume();}
}
