async (hostPage) => {
  const context=await hostPage.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[],results=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:4173/play/screw-sort/';
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await context.addInitScript(()=>{
    window.motionQA={arrivals:[],starts:[],packs:[],earlySwaps:[]};
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(frames,options) {
      const animation=animate.call(this,frames,options);
      if(this.classList.contains('packing-box')) {
        const index=Number(this.dataset.boxIndex),color=this.style.getPropertyValue('--box-color'),begin=performance.now();
        const check=()=>{
          const elapsed=performance.now()-begin;
          if(elapsed<235) {
            if(document.querySelector('#boxes').children[index].style.getPropertyValue('--box-color')!==color)motionQA.earlySwaps.push({index,elapsed});
            requestAnimationFrame(check);
          }
        };requestAnimationFrame(check);
      }
      if(this.classList.contains('flying-screw')&&Array.isArray(frames)&&frames.at(-1)?.transform?.startsWith('translate(')) {
        const id=this.dataset.flightId;
        const source=document.querySelector(`#tray [data-buffer-id="${id}"]`);
        motionQA.starts.push({id,t:performance.now(),sourceVisible:!!source&&getComputedStyle(source).visibility!=='hidden'});
        animation.finished.then(()=>{
          const target=document.querySelector(`#boxes [data-screw-id="${id}"],#tray [data-screw-id="${id}"]`);
          if(!target)return;
          const a=this.firstElementChild.getBoundingClientRect(),b=target.getBoundingClientRect();
          const box=target.closest('.toolbox');
          motionQA.arrivals.push({id,error:Math.hypot(a.x+a.width/2-b.x-b.width/2,a.y+a.height/2-b.y-b.height/2),sizeError:Math.abs(a.width-b.width),color:this.firstElementChild.style.getPropertyValue('--color'),boxColor:box?.style.getPropertyValue('--box-color')||null});
        }).catch(()=>{});
      }
      return animation;
    };
  });
  const snapshot=()=>page.evaluate(()=>glassDebug.snapshot());
  const idle=()=>page.waitForFunction(()=>glassDebug.snapshot().pending===0,null,{timeout:10000});
  const open=async(level=1)=>{
    await page.goto(`${base}?lang=en&qa=1&previewLevel=${level}`);await page.locator('#play').click();
    await page.evaluate(async()=>{
      const {Sound}=await import('./js/sound.js'),play=Sound.prototype.play;
      Sound.prototype.play=function(kind){if(kind==='pack')motionQA.packs.push(performance.now());return play.call(this,kind);};
    });
  };
  const click=async(id,wait=true)=>{
    const node=page.locator(`[data-screw="${id}"]`);
    for(let tries=0;tries<12;tries++) {
      await page.waitForFunction(id=>{const n=document.querySelector(`[data-screw="${id}"]`);return n&&!n.disabled;},id,{timeout:7000});
      const r=await node.boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);
      if((await snapshot()).state.removed.includes(id)){if(wait)await idle();return;}
    }
    throw Error(`Missed ${id}`);
  };
  const verify=async(label)=>{
    await idle();
    const s=await snapshot(),data=await page.evaluate(()=>({qa:motionQA,ghosts:document.querySelectorAll('.flying-screw,.packing-box').length}));
    assert(data.ghosts===0,`${label}: residual ghost`);
    assert(JSON.stringify(s.collections.buffer)===JSON.stringify(s.state.buffer),`${label}: tray differs from engine`);
    s.state.boxes.forEach((box,i)=>{
      if(!s.state.unlocked[i])return;
      assert(s.collections.boxes[i].color===(box?.color||null)&&s.collections.boxes[i].count===(box?.count||0),`${label}: box ${i} differs from engine`);
    });
    assert(data.qa.arrivals.every(a=>a.error<=1&&a.sizeError<=1),`${label}: landing mismatch ${JSON.stringify(data.qa.arrivals)}`);
    const palette=await page.evaluate(()=>Object.fromEntries(['coral','blue','gold','mint','violet','cyan','orange','pink'].map(color=>[`var(--${color})`,getComputedStyle(document.documentElement).getPropertyValue(`--${color}`).trim()])));
    assert(data.qa.arrivals.every(a=>!a.boxColor||a.color===palette[a.boxColor]),`${label}: wrong box colour`);
    assert(data.qa.starts.every(a=>!a.sourceVisible),`${label}: tray source remained visible during flight`);
    assert(data.qa.earlySwaps.length===0,`${label}: new box appeared before outgoing batch vacated`);
    assert(data.qa.packs.length===s.state.packed/3,`${label}: completion cue count differs`);
    results.push({label,moves:s.state.moves,packed:s.state.packed,arrivals:data.qa.arrivals.length,maxLandingError:Math.max(0,...data.qa.arrivals.map(a=>a.error))});

  };
  try {
    await open();const solution=await page.evaluate(async()=>(await import('./js/levels.js')).LEVELS[0].solution);
    for(const id of solution.slice(0,6))await click(id);
    const pendingTransferIds=await page.evaluate(()=>{const {state}=glassDebug.snapshot();return state.buffer.filter(s=>s.color===state.queue[state.queueIndex]).map(s=>s.id);});
    const started=Date.now();await click(solution[6],false);
    await page.waitForSelector('.packing-box');
    await page.waitForFunction(()=>document.querySelectorAll('.pack-star').length===6);
    await page.screenshot({path:'screw-sort-game/output/playwright/motion-pack-390.png'});
    await verify('first pack and overlapping tray transfers');
    results.at(-1).chainMs=Date.now()-started;
    const transfers=(await page.evaluate(()=>motionQA.starts)).filter(a=>pendingTransferIds.includes(a.id)).slice(-2);
    assert(transfers.length===2&&Math.abs(transfers[1].t-transfers[0].t)<140,`automatic transfers ran serially: ${JSON.stringify(transfers)}`);
    for(const id of solution.slice(7,12))await click(id,false);
    await verify('rapid taps across box generations');
    for(const id of solution.slice(12))await click(id);
    await verify('level one win');assert((await snapshot()).state.status==='won','win did not finish');

    await open();await click(solution[0],false);
    await page.locator('#pause').click();
    const paused=await page.evaluate(async()=>{
      await Promise.all(document.getAnimations().filter(a=>a.effect?.target?.closest?.('.flying-screw')).map(a=>a.ready));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      return document.getAnimations().filter(a=>a.effect?.target?.closest?.('.flying-screw')).map(a=>a.currentTime);
    });
    await page.waitForTimeout(220);
    const held=await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.target?.closest?.('.flying-screw')).map(a=>a.currentTime));
    assert(JSON.stringify(paused)===JSON.stringify(held),`flight advanced while paused: ${JSON.stringify({paused,held})}`);
    await page.getByRole('button',{name:'Continue game',exact:true}).click();await verify('flight pause and resume');

    await open();for(const id of solution.slice(0,6))await click(id);
    await click(solution[6],false);await page.waitForSelector('.packing-box');
    await page.locator('#pause').click();const cueCount=await page.evaluate(()=>motionQA.packs.length);
    await page.waitForTimeout(220);assert(await page.evaluate(()=>motionQA.packs.length)===cueCount,'cue fired while paused');
    await page.getByRole('button',{name:'Continue game',exact:true}).click();await verify('packing pause and resume');

    await open();for(const id of solution.slice(0,6))await click(id);
    await click(solution[6],false);await page.waitForSelector('.packing-box');await page.locator('#pause').click();
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    const restarted=await page.evaluate(()=>({cues:motionQA.packs.length,moves:glassDebug.snapshot().state.moves}));
    await page.waitForTimeout(550);
    assert((await snapshot()).state.moves===0&&await page.locator('.flying-screw,.packing-box').count()===0,'restart left old work');
    assert(await page.evaluate(()=>motionQA.packs.length)===restarted.cues,'cancelled box played a late cue');
    results.push({label:'cancel during packing',passed:true});

    await page.emulateMedia({reducedMotion:'reduce'});await open();
    for(const id of solution.slice(0,12))await click(id);
    await verify('reduced motion');await page.emulateMedia({reducedMotion:'no-preference'});

    for(const [width,height] of [[320,667],[430,932]]) {
      await page.setViewportSize({width,height});await open();
      for(const id of solution.slice(0,7))await click(id);
      await verify(`viewport ${width}`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
    }
    assert(errors.length===0,errors.join('\n'));return {results,errors};
  }finally{await context.close();}
}
