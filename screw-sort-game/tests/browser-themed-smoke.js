async page=>{
  const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844});
  for(const level of [1,2,4,10]) {
    await page.goto(`http://127.0.0.1:4186/?previewLevel=${level}&qa=1&lang=en`);
    await page.locator('#play').click();
    await page.evaluate(()=>{
      window.clickTimes=[];let started;
      document.querySelector('#board').addEventListener('click',()=>{started=performance.now();},true);
      document.querySelector('#board').addEventListener('click',()=>clickTimes.push(performance.now()-started));
    });
    let peak=0;
    for(let i=0;i<90;i++) {
      const pick=await page.evaluate(async()=>{
        const snap=glassDebug.snapshot(),{LEVELS}=await import('./js/levels.js'),{targetBox}=await import('./js/engine.js');
        if(snap.state.status!=='playing'||snap.state.moves>=(snap.levelId===1?15:24))return {done:true};
        const screws=LEVELS.find(l=>l.id===snap.levelId).boards.flatMap(b=>b.screws);
        const nodes=[...document.querySelectorAll('[data-screw]:not(:disabled)')].sort((a,b)=>(targetBox(snap.state,screws.find(s=>s.id===b.dataset.screw).color)>=0)-(targetBox(snap.state,screws.find(s=>s.id===a.dataset.screw).color)>=0));
        const node=nodes[0];if(!node)return {wait:true};
        const r=node.querySelector('.screw-head').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,pending:snap.pending};
      });
      if(pick.done)break;
      if(!pick.wait){await page.mouse.click(pick.x,pick.y);peak=Math.max(peak,pick.pending);}
      await page.waitForTimeout(90);
    }
    await page.evaluate(()=>glassDebug.idle());
    await page.screenshot({path:`screw-sort-game/output/playwright/contact-play-${level}.png`});
    results.push(await page.evaluate(peak=>{
      const snap=glassDebug.snapshot(),sorted=clickTimes.sort((a,b)=>a-b);
      return {level:snap.levelId,moves:snap.state.moves,status:snap.state.status,packed:snap.state.packed,peakConcurrent:peak,clickP95:sorted[Math.floor((sorted.length-1)*.95)],ghosts:document.querySelectorAll('.flying-screw').length,overflow:document.documentElement.scrollWidth>innerWidth};
    },peak));
  }
  if(errors.length)throw Error(errors.join('\n'));
  if(results[0].status!=='won'||results.some(r=>r.ghosts||r.overflow))throw Error(JSON.stringify(results));
  return {results,errors};
}
