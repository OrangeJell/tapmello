async (page) => {
  const errors=[],results=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  const startRound=async()=>{
    await page.clock.runFor(800);
    await page.locator('#start').click({force:true});
    if(await page.locator('#guide-skip').isVisible())await page.locator('#guide-skip').click({force:true});
  };
  await page.evaluate(()=>localStorage.setItem('marble-sort.tutorial-mystery-done','true'));
  await page.clock.install({time:new Date('2026-11-07T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-07T00:00:01Z'));
  const state=()=>page.evaluate(()=>marbleDebug.snapshot());
  try{
    for(const number of [1,6,20,40]){
      await page.evaluate(level=>{
        localStorage.setItem('marble-sort.level',String(level));
        localStorage.setItem('marble-sort.sound','false');
      },number);
      await page.reload();await startRound();
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('mobile overflow');
      const level=await page.evaluate(async number=>{
        const {createLevel}=await import('./js/levels.js');return createLevel(number);
      },number);
      const initial=await state();
      if(initial.capacity!==27||initial.columns.some(column=>column.slice(0,2).some(pack=>pack.hidden)))throw new Error('opening preview is not readable');
      await page.screenshot({path:`output/playwright/marble-sort/varied-level-${number}.png`});
      const front=new Set(initial.columns.flatMap(column=>column[0]?.colors??[]));
      if(initial.boxes.some(box=>!front.has(box.color)))throw new Error('opening bus colour is buried');
      const route=level.solution;
      for(const [move,column] of route.entries()){
        await page.locator('#sources button').nth(column).click({force:true});
        let settled=false;
        for(let second=0;second<90;second++){
          await page.clock.runFor(1000);const snapshot=await state();
          if(snapshot.status==='lost')throw new Error(`level ${number}, move ${move}: unexpected loss`);
          if(snapshot.remaining+snapshot.pending.length+snapshot.occupied+snapshot.collected!==snapshot.total)throw new Error('marble conservation failed');
          if(snapshot.status==='won'||(!snapshot.pending.length&&!snapshot.boxes.some(box=>box?.filled===3)&&!snapshot.slots.some(marble=>marble&&snapshot.boxes.some(box=>box&&box.filled<3&&box.color===marble.color)))){settled=true;break;}
        }
        if(!settled)throw new Error(`level ${number}, move ${move}: drop did not settle`);
        if(number===20&&move===10)await page.locator('.game').screenshot({path:'output/playwright/marble-sort/varied-midgame.png'});
      }
      const final=await state();
      if(final.status!=='won')throw new Error(`level ${number} did not win`);
      if(final.capacity!==27||final.expanded||final.undoLeft!==1)throw new Error('route used a booster');
      results.push({level:number,opening:level.stages[0].kind,moves:final.moves,status:final.status,collected:final.collected});
    }
    if(errors.length)throw new Error(errors.join('\n'));
    return {results,errors};
  }finally{await page.clock.resume();}
}
