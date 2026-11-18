async (page) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  const output='screw-sort-game/output/playwright';
  const results=[];
  await page.setViewportSize({width:390,height:844});
  for(const levelId of [1,2]) {
    await page.goto(`http://127.0.0.1:4173/play/screw-sort/?lang=en&qa=1&previewLevel=${levelId}`);
    await page.locator('#play').click();
    const solution=await page.evaluate(async id=>(await import('./js/levels.js')).LEVELS.find(l=>l.id===id).solution,levelId);
    await page.screenshot({path:`${output}/glass-level-${levelId}-start.png`});
    for(const [index,id] of solution.entries()) {
      const selector=`[data-screw="${id}"]`;
      const lastPin=await page.evaluate(async id=>{const {LEVELS}=await import('./js/levels.js');const {state,levelId}=glassDebug.snapshot();const b=LEVELS.find(l=>l.id===levelId).boards.find(b=>b.screws.some(s=>s.id===id));return b.screws.filter(s=>!state.removed.includes(s.id)).length===1;},id);
      if(lastPin)await page.evaluate(()=>glassDebug.idle());
      let accepted=false;
      for(let attempt=0;attempt<12&&!accepted;attempt++) {
        await page.waitForFunction(sel=>{const node=document.querySelector(sel);return node&&!node.disabled;},selector,{timeout:5000});
        const box=await page.locator(selector).boundingBox();
        if(!box)throw Error(`No visible target ${levelId}/${id}`);
        await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
        accepted=await page.evaluate(id=>window.glassDebug.snapshot().state.removed.includes(id),id);
      }
      if(!accepted)throw Error(`Missed moving screw ${levelId}/${id}`);
      const count=await page.evaluate(()=>window.glassDebug.snapshot().state.moves);
      if(count!==index+1)throw Error(`Unexpected extra move ${levelId}/${id}: ${count} instead of ${index+1}`);
      await page.waitForFunction(()=>window.glassDebug.snapshot().pending===0,null,{timeout:6000});
      if(index===Math.floor(solution.length/2))await page.screenshot({path:`${output}/glass-level-${levelId}-middle.png`});
    }
    await page.waitForFunction(()=>window.glassDebug.snapshot().state.status==='won');
    await page.screenshot({path:`${output}/glass-level-${levelId}-won.png`});
    const snapshot=await page.evaluate(()=>window.glassDebug.snapshot());
    results.push({level:levelId,moves:snapshot.state.moves,status:snapshot.state.status});
  }
  if(errors.length)throw Error(errors.join('\n'));
  return {results,errors};
}
