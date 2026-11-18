async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/play/screw-sort/',assert=(v,m)=>{if(!v)throw Error(m);};
  await page.setViewportSize({width:390,height:844});
  const open=async()=>{await page.goto(`${base}?lang=en&qa=1&previewLevel=2`);await page.locator('#play').click();};
  const snapshot=()=>page.evaluate(()=>glassDebug.snapshot());
  const click=async id=>{
    for(let i=0;i<12;i++){
      await page.waitForFunction(id=>!document.querySelector(`[data-screw="${id}"]`).disabled,id,{timeout:7000});
      const r=await page.locator(`[data-screw="${id}"]`).boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);
      if(await page.evaluate(id=>glassDebug.snapshot().state.removed.includes(id),id))break;
      if(i===11)throw Error(`Missed ${id}`);
    }
    await page.waitForFunction(()=>glassDebug.snapshot().pending===0);await page.evaluate(()=>glassDebug.idle());
  };
  await open();
  const candidates=await page.evaluate(async()=>{
    const {LEVELS}=await import('./js/levels.js'),{activeBoards,poseOf,screwPosition}=await import('./js/engine.js');
    const {worldContour,headExposure}=await import('./js/geometry.js');const {state}=glassDebug.snapshot(),l=LEVELS[1];
    const plates=activeBoards(l,state),all=l.boards.flatMap(b=>b.screws.map(s=>({s,b,p:screwPosition(b,s,state)})));
    const candidates=all.map(({s,b,p})=>{const node=document.querySelector(`[data-screw="${s.id}"]`),higher=plates.filter(o=>o.z>b.z).map(o=>worldContour(o,poseOf(o,state))),exposure=headExposure(p,higher);
      const upper=all.filter(o=>o.b.z>b.z).some(o=>Math.hypot(o.p.x-p.x,o.p.y-p.y)<28);
      const direct=all.filter(o=>!document.querySelector(`[data-screw="${o.s.id}"]`).disabled).some(o=>Math.hypot(o.p.x-p.x,o.p.y-p.y)<15);
      return{id:s.id,exposure,upper,direct,rebound:node.dataset.rebound==='true',visible:!node.classList.contains('buried')};});
    return{edge:candidates.find(c=>c.rebound),full:candidates.find(c=>c.visible&&c.exposure===0&&!c.direct),pressed:candidates.filter(c=>c.visible&&c.upper&&c.exposure>0&&c.exposure<1)};
  });
  assert(candidates.edge,'No exposed-edge example');assert(candidates.full,'No fully covered example');
  for(const [kind,c] of [['full',candidates.full],['edge',candidates.edge]]){
    const r=await page.locator(`[data-screw="${c.id}"]`).boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);
    const check=await page.evaluate(id=>({moves:glassDebug.snapshot().state.moves,animations:document.querySelector(`[data-screw="${id}"] .screw-head`).getAnimations().length,toast:document.querySelector('#toast').classList.contains('visible')}),c.id);
    assert(check.moves===0,`${kind} consumed a screw`);assert(!check.toast,'Blocked click displayed text');
    assert(kind==='edge'?check.animations>0:check.animations===0,`${kind} rebound rule failed`);
    await page.evaluate(()=>glassDebug.idle());
  }
  assert(candidates.pressed.every(c=>!c.rebound),'An upper screw allowed lower-head rebound');
  await page.screenshot({path:'screw-sort-game/output/playwright/glass-reference-start.png'});
  const scenario=await page.evaluate(async()=>{
    const {LEVELS}=await import('./js/levels.js'),{createState,transition}=await import('./js/engine.js');
    for(const level of LEVELS){let state=createState(level);
      for(let index=0;index<level.solution.length;index++){
        state=transition(level,state,{type:'screw',id:level.solution[index]}).state;
        const ids=Object.keys(state.loose);if(!ids.length)continue;
        let after=state;
        for(let end=index+1;end<level.solution.length;end++){
          after=transition(level,after,{type:'screw',id:level.solution[end]}).state;
          const boardId=ids.find(id=>after.fallen.includes(id));
          if(boardId)return{levelId:level.id,boardId,opening:level.solution.slice(0,index+1),release:level.solution.slice(index+1,end+1)};
        }
      }
    }
    throw Error('No supported plate with a releasable support');
  });
  await page.goto(`${base}?lang=en&qa=1&previewLevel=${scenario.levelId}`);await page.locator('#play').click();
  for(const id of scenario.opening)await click(id);
  await page.evaluate(()=>glassDebug.idle());
  const resting=await snapshot();assert(resting.state.loose[scenario.boardId],'Supported empty plate vanished');
  assert(await page.locator(`[data-plate="${scenario.boardId}"]`).evaluate(n=>getComputedStyle(n).opacity)==='1','Resting plate is invisible');
  await page.screenshot({path:'screw-sort-game/output/playwright/glass-resting-plate.png'});
  await page.goto(`${base}?lang=en&qa=1`);await page.locator('#play').click();assert(JSON.stringify((await snapshot()).state)===JSON.stringify(resting.state),'Resting plate not restored');
  for(const id of scenario.release)await click(id);
  await page.evaluate(()=>glassDebug.idle());
  const released=await snapshot();assert(released.state.fallen.includes(scenario.boardId)&&!released.state.loose[scenario.boardId],'Supported glass did not resume falling');
  assert(errors.length===0,errors.join('\n'));
  return{edgeRebound:candidates.edge.id,fullyCovered:candidates.full.id,pressedExamples:candidates.pressed.length,resting:'retained, saved and released',errors};
}
