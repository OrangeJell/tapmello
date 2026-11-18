async (page) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  const base='http://127.0.0.1:4173/play/screw-sort/';
  const snapshot=()=>page.evaluate(()=>window.glassDebug.snapshot());
  const idle=()=>page.waitForFunction(()=>window.glassDebug.snapshot().pending===0,null,{timeout:7000});
  const assert=(value,label)=>{if(!value)throw Error(label);};
  const open=async(level=2)=>{await page.goto(`${base}?lang=en&qa=1&previewLevel=${level}`);await page.locator('#play').click();};
  const clickScrew=async(id)=>{
    const before=(await snapshot()).state.moves,node=page.locator(`[data-screw="${id}"]`);await node.waitFor();
    let accepted=false;
    for(let attempt=0;attempt<12&&!accepted;attempt++){
      await page.waitForFunction(id=>!document.querySelector(`[data-screw="${id}"]`).disabled,id);
      const b=await node.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
      accepted=await page.evaluate(id=>window.glassDebug.snapshot().state.removed.includes(id),id);
    }
    assert(accepted,`Missed screw ${id}`);await idle();
  };
  const claim=async()=>{await page.getByRole('button',{name:'Claim reward',exact:true}).click();await idle();};
  const layouts=[];
  for(const [width,height,lang] of [[320,667,'en'],[390,844,'en'],[390,844,'hi'],[430,932,'en'],[1280,800,'en']]){
    await page.setViewportSize({width,height});await page.goto(`${base}?lang=${lang}&qa=1&previewLevel=2`);await page.locator('#play').click();
    const metrics=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,game:document.querySelector('#game').getBoundingClientRect().toJSON(),targets:[...document.querySelectorAll('.screw-button:not(:disabled)')].map(n=>n.getBoundingClientRect().width)}));
    assert(metrics.width<=width,`Overflow ${width}/${lang}`);assert(Math.min(...metrics.targets)>=43.8,`Small touch target ${width}`);assert(metrics.game.bottom<=height+1,`Clipped props ${height}`);
    layouts.push({width,height,lang,exposed:metrics.targets.length});
    await page.screenshot({path:`screw-sort-game/output/playwright/glass-${lang}-${width}.png`});
  }
  await page.setViewportSize({width:390,height:844});await open(1);
  await page.locator('#extra').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert((await snapshot()).state.capacity===5,'Cancel granted reward');
  for(let i=0;i<2;i++){await page.locator('#extra').click();await claim();}assert((await snapshot()).state.capacity===7,'Slot reward failed');assert(await page.locator('#extra').isDisabled(),'Slot cap not disabled');
  for(const i of [2,3]){await page.locator(`[data-unlock="${i}"]`).click();await claim();}assert((await snapshot()).state.unlocked.every(Boolean),'Four boxes not open');
  await open(2);
  const first=await page.evaluate(async()=> {const {LEVELS}=await import('./js/levels.js');const {availableScrews,createState}=await import('./js/engine.js');const l=LEVELS[1];return availableScrews(l,createState(l)).find(s=>s.color===l.queue[2]).id;});await clickScrew(first);assert((await snapshot()).state.buffer.length===1,'Expected waiting screw');
  await page.locator('[data-unlock="2"]').click();await claim();assert((await snapshot()).state.buffer.length===0,'Unlock did not settle tray');
  await page.locator('#melt').click();await claim();assert((await snapshot()).selecting,'Melt did not enter selection');
  await page.locator('#cancel-selection').click();assert((await snapshot()).state.meltCredits===1,'Cancel consumed melt');
  const before=await snapshot();await page.goto(`${base}?lang=en&qa=1`);await page.locator('#play').click();const restored=await snapshot();assert(JSON.stringify(before.state)===JSON.stringify(restored.state),'Session restore mismatch');
  await page.locator('#melt').click();
  const target=await page.evaluate(async()=>{const {LEVELS}=await import('./js/levels.js');const {selectableBoards}=await import('./js/engine.js');const {state}=window.glassDebug.snapshot();const board=selectableBoards(LEVELS[1],state).at(-1);return{board:board.id,screw:board.screws.find(s=>!state.removed.includes(s.id)).id};});
  const rect=await page.locator(`[data-screw="${target.screw}"]`).boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await idle();assert((await snapshot()).state.melted.includes(target.board),'Melt failed');assert((await snapshot()).state.removed.length===1,'Melt deleted screws');
  await page.screenshot({path:'screw-sort-game/output/playwright/glass-melted.png'});
  await page.locator('#pause').click();assert(await page.locator('#extra').isDisabled(),'Pause did not block input');await page.getByRole('button',{name:'Continue game',exact:true}).click();
  await open(2);
  const jamPath=await page.evaluate(async()=> (await import('./js/levels.js')).LEVELS[1].jamPath);
  for(const id of jamPath)await clickScrew(id);
  const failed=await snapshot();assert(failed.state.status==='jammed','No jam');await page.screenshot({path:'screw-sort-game/output/playwright/glass-physics-jammed.png'});
  assert(await page.locator('#dialog .primary-button').count()===1,'More than one highlighted action');
  assert(await page.locator('#dialog .ad-badge').count()===0,'Unexpected ad badge');
  assert(await page.getByRole('button',{name:'Choose a level',exact:true}).count()===0,'Jam suggests choosing level');
  await page.locator('.continue-button').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert((await snapshot()).state.status==='jammed','Cancelling continued');
  await page.locator('.continue-button').click();await claim();const retry=await snapshot();
  assert(retry.state.status==='playing'&&retry.state.unlocked.filter(Boolean).length===3,'Continuation did not open box');
  assert(JSON.stringify(retry.state.removed)===JSON.stringify(failed.state.removed)&&retry.state.moves===failed.state.moves&&retry.state.capacity===failed.state.capacity,'Continuation reset progress');
  await page.goto(`${base}?lang=en&qa=1`);await page.locator('#play').click();assert(JSON.stringify((await snapshot()).state)===JSON.stringify(retry.state),'Continued session restore mismatch');
  const context=await page.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const touch=await context.newPage();await touch.goto(`${base}?lang=en&qa=1&previewLevel=1`);await touch.locator('#play').tap();
  const targetTouch=await touch.locator('.screw-button:not(:disabled)').first().boundingBox();await touch.touchscreen.tap(targetTouch.x+targetTouch.width/2,targetTouch.y+targetTouch.height/2);await touch.waitForFunction(()=>window.glassDebug.snapshot().state.moves===1);await context.close();
  if(errors.length)throw Error(errors.join('\n'));
  return {layouts,rewards:'cancel, slots, boxes, melt and in-place continuation passed',storage:'restored',touch:'passed',errors};
}
