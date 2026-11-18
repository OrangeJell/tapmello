async (page) => {
  const startRound=async()=>{
    await page.clock.runFor(800);
    await page.locator('#start').click({force:true});
    if(await page.locator('#guide-skip').isVisible())await page.locator('#guide-skip').click({force:true});
  };
  await page.evaluate(()=>localStorage.setItem('marble-sort.tutorial-mystery-done','true'));
  await page.clock.install({time:new Date('2026-11-04T02:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-04T02:00:01Z'));
  try{
    // Pickup timing varies by station; exercise real pressure openings until
    // one reaches full capacity with a matching passenger still travelling.
    for(const number of [6,13,20,30,40]){
      await page.evaluate(number=>localStorage.setItem('marble-sort.level',String(number)),number);
      await page.reload();await startRound();
      const read=()=>page.evaluate(()=>marbleDebug.snapshot());
      const stages=await page.evaluate(async number=>{
        const {createLevel}=await import(new URL('js/levels.js',location.href));
        return createLevel(number).stages;
      },number);
      const index=stages.findIndex(stage=>stage.kind==='doubleLock');
      const route=stages[index].route;
      const prefix=stages.slice(0,index).flatMap(stage=>stage.route);
      for(const column of [...prefix,...route.slice(0,3)]){
        await page.locator('#sources button').nth(column).click({force:true});
        for(let elapsed=0;elapsed<45;elapsed++){
          await page.clock.runFor(1000);const s=await read();
          if(s.status==='lost')throw Error('opening blockers unexpectedly lost');
          if(!s.pending.length&&!s.boxes.some(b=>b?.filled===3)&&!s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color)))break;
        }
      }
      if((await read()).occupied!==24)throw Error('bottleneck must leave only three free slots');
      await page.locator('#sources button').nth(route[3]).click({force:true});
      let full=null,drained=false;
      for(let frame=0;frame<600;frame++){
        await page.clock.runFor(50);const s=await read();
        const matching=s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color));
        if(s.status==='lost')throw new Error('unexpected loss before waiting case completed');
        if(!full&&s.occupied===27&&s.pending.length&&matching){
          full={time:s.time,collected:s.collected,occupied:s.occupied,pending:s.pending.length,status:s.status,tip:await page.locator('#tip').textContent()};
          if(await page.locator('#dialog').isVisible())throw new Error('failure dialog during valid collection');
          await page.screenshot({path:'output/playwright/marble-sort/full-belt-waiting.png'});
        }
        if(full&&s.collected>full.collected){drained=true;break;}
      }
      if(full&&drained)return {level:number,full,drained,status:(await read()).status};
    }
    throw new Error('failed to demonstrate full-belt collection');
  }finally{await page.clock.resume();}
}
