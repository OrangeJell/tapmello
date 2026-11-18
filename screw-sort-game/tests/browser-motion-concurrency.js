async (hostPage) => {
  const context=await hostPage.context().browser().newContext({viewport:{width:390,height:844}});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173/play/screw-sort/?qa=1&previewLevel=1');
    const result=await page.evaluate(async()=>{
      const [{Motion},{CollectionsView},{createState},{LEVELS},{screwHead}]=await Promise.all([
        import('./js/motion.js'),import('./js/collections-view.js'),import('./js/engine.js'),import('./js/levels.js'),import('./js/glass-art.js'),
      ]);
      const fixture=document.createElement('div');fixture.style.cssText='position:fixed;left:16px;top:100px;width:358px;z-index:80';
      const boxes=document.createElement('div'),tray=document.createElement('div');boxes.className='boxes';tray.className='tray';fixture.append(boxes,tray);document.body.append(fixture);
      const motion=new Motion(),pulses=[],state=createState(LEVELS[0]);let alive=true;
      const view=new CollectionsView(boxes,tray,motion,key=>key,()=>pulses.push(performance.now()));view.reset(state);
      const jobs=[],sources=[];
      const take=(index,slot,color,packed=false)=>{
        const holder=document.createElement('div');holder.innerHTML=screwHead(color);
        const source=holder.firstElementChild;source.style.cssText+=`;position:fixed;left:${50+index*80}px;top:400px`;
        source.dataset.screwId=`fixture-${index}-${slot}-${color}`;document.body.append(source);sources.push(source);
        const events=[{type:'taken',screwId:source.dataset.screwId,color,target:'box',index,slot}];
        if(packed)events.push({type:'packed',index,nextBox:{color:index?'mint':'gold',count:0},queueIndex:3+index});
        jobs.push(view.enqueue(events,motion.capture(source),state,()=>alive));source.style.visibility='hidden';
      };
      try {
        for(let slot=0;slot<3;slot++){take(0,slot,'blue',slot===2);take(1,slot,'coral',slot===2);}
        take(0,0,'gold');
        await Promise.all(jobs);await motion.finish();
        const finished=view.snapshot(),pulseGap=Math.abs(pulses[1]-pulses[0]);
        if(pulses.length!==2||pulseGap>100)throw Error(`Two boxes did not finish together: ${JSON.stringify(pulses)}`);
        if(finished.boxes[0].color!=='gold'||finished.boxes[0].count!==1||finished.boxes[1].color!=='mint'||finished.boxes[1].count!==0)throw Error('Future generation received the wrong screw');
        if(motion.ghosts.size)throw Error('Completed batches left ghosts');
        // Reset both presentation and motion while a new generation is queued.
        view.reset(state);pulses.length=0;jobs.length=0;
        for(let slot=0;slot<3;slot++)take(0,slot,'blue',slot===2);
        take(0,0,'gold');await motion.wait(110);alive=false;motion.cancel();view.reset(state);
        await Promise.all(jobs);
        if(pulses.length||motion.ghosts.size||view.snapshot().boxes[0].count)throw Error('Cancelled generation mutated its replacement');
        return {simultaneousBoxes:true,pulseGapMs:pulseGap,queuedGeneration:true,cancelQueuedGeneration:true};
      }finally{motion.cancel();fixture.remove();sources.forEach(node=>node.remove());}
    });
    if(errors.length)throw Error(errors.join('\n'));return {result,errors};
  }finally{await context.close();}
}
