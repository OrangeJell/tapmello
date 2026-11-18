async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const results=[];
  await page.setViewportSize({width:390,height:844});
  for(const levelId of [1,2,10]) {
    await page.goto(`http://127.0.0.1:4186/?lang=en&qa=1&previewLevel=${levelId}`);
    await page.locator('#play').click();
    const solution=await page.evaluate(async()=>{
      const {BoardView}=await import('./js/board-view.js');
      window.perfSamples={refresh:[],update:[],click:[],frames:[],longTasks:[]};
      for(const name of ['refresh','update']) {
        const original=BoardView.prototype[name];
        BoardView.prototype[name]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{perfSamples[name].push(performance.now()-start);}};
      }
      let started=0,last=0;
      document.querySelector('#board').addEventListener('click',()=>{started=performance.now();},true);
      document.querySelector('#board').addEventListener('click',()=>perfSamples.click.push(performance.now()-started));
      window.perfObserver=new PerformanceObserver(list=>perfSamples.longTasks.push(...list.getEntries().map(e=>e.duration)));
      perfObserver.observe({entryTypes:['longtask']});
      const frame=time=>{if(last)perfSamples.frames.push(time-last);last=time;window.perfFrame=requestAnimationFrame(frame);};
      window.perfFrame=requestAnimationFrame(frame);
      const {LEVELS}=await import('./js/levels.js');
      return LEVELS.find(l=>l.id===glassDebug.snapshot().levelId).solution.slice(0,20);
    });
    for(const id of solution) {
      let accepted=false;
      for(let attempt=0;attempt<12&&!accepted;attempt++) {
        await page.waitForFunction(id=>!document.querySelector(`[data-screw="${id}"]`).disabled,id,{timeout:7000});
        const rect=await page.locator(`[data-screw="${id}"]`).boundingBox();
        await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);
        accepted=await page.evaluate(id=>glassDebug.snapshot().state.removed.includes(id),id);
      }
      if(!accepted)throw Error(`Missed ${levelId}/${id}`);
      await page.waitForFunction(()=>glassDebug.snapshot().pending===0);
    }
    await page.evaluate(()=>glassDebug.idle());
    results.push(await page.evaluate(()=>{
      cancelAnimationFrame(perfFrame);perfObserver.disconnect();
      const summarize=values=>{values.sort((a,b)=>a-b);return{count:values.length,mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2),p95:+values[Math.floor((values.length-1)*.95)].toFixed(2),max:+values.at(-1).toFixed(2)};};
      return{level:glassDebug.snapshot().levelId,moves:glassDebug.snapshot().state.moves,refresh:summarize(perfSamples.refresh),update:summarize(perfSamples.update),click:summarize(perfSamples.click),frames:summarize(perfSamples.frames),longTasks:perfSamples.longTasks.length};
    }));
  }
  if(errors.length)throw Error(errors.join('\n'));
  return{results,errors};
}
