async page=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  await page.goto(`http://127.0.0.1:4173/play/screw-sort/?lang=en&qa=1&previewLevel=6&check=${Date.now()}`);
  await page.getByRole('button',{name:'Start twisting',exact:true}).click();
  const ids=await page.evaluate(async()=>{
    const {LEVELS}=await import('./js/levels.js');
    const level=LEVELS.find(l=>l.id===6),moon=level.boards.find(b=>b.id==='p49');
    if(moon.shape!=='crescent')throw Error('Expected a crescent in this scenario');
    const steps=moon.screws.map(s=>level.solution.indexOf(s.id)).sort((a,b)=>a-b);
    return level.solution.slice(0,steps.at(-2)+1);
  });
  for(let i=0;i<ids.length;i++){
    const id=ids[i];
    await page.locator(`[data-screw="${id}"]`).click();
    if(!await page.evaluate(id=>glassDebug.snapshot().state.removed.includes(id),id))throw Error(`Screw ${id} was not removed`);
    if(i<ids.length-1)await page.evaluate(()=>glassDebug.idle());
  }
  const samples=[];
  const tail=await page.evaluate(()=>{
    const animation=document.querySelector('[data-plate="p49"]').getAnimations()[0];
    const frames=animation.effect.getKeyframes();
    const angles=frames.map(frame=>Number(frame.transform.match(/rotate\(([-\d.]+)deg\)/)[1]));
    const target=angles.at(-1),peaks=[];
    // CSS serialisation rounds tiny angles, producing flat turning points.
    let direction=0;
    for(let i=1;i<angles.length;i++) {
      const delta=angles[i]-angles[i-1];
      if(Math.abs(delta)<1e-6)continue;
      const next=Math.sign(delta);
      if(direction&&next!==direction)peaks.push(angles[i-1]-target);
      direction=next;
    }
    return {duration:animation.effect.getTiming().duration,peaks,target,loadedPhysics:JSON.parse(document.querySelector('#game-importmap').textContent).imports['./js/plate-physics.js']};
  });
  if(tail.peaks.length<3)throw Error('Small return swings were cut off');
  if(Math.abs(tail.peaks.at(-1))>=1)throw Error(`Final sway is too large: ${JSON.stringify(tail)}`);
  for(let i=0;i<13;i++){
    samples.push(await page.evaluate(()=>{
      const plate=document.querySelector('[data-plate="p49"]');
      const matrix=new DOMMatrix(getComputedStyle(plate).transform);
      const pin=plate.querySelector('.screw-button:not(.removed) .screw-head').getBoundingClientRect();
      return {time:performance.now(),angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI,x:pin.x+pin.width/2,y:pin.y+pin.height/2};
    }));
    if(i===4)await page.screenshot({path:'screw-sort-game/output/playwright/hanging-crescent-390.png'});
    await page.waitForTimeout(180);
  }
  let angle=samples[0].angle,min=angle,max=angle,peak=0;
  for(let i=1;i<samples.length;i++){
    const delta=((samples[i].angle-samples[i-1].angle+540)%360)-180;
    angle+=delta;min=Math.min(min,angle);max=Math.max(max,angle);
    peak=Math.max(peak,Math.abs(delta)/(samples[i].time-samples[i-1].time)*1000);
  }
  const anchor=samples[0],drift=Math.max(...samples.map(p=>Math.hypot(p.x-anchor.x,p.y-anchor.y)));
  if(max-min<10)throw Error('Crescent did not swing freely');
  if(peak>150)throw Error(`Crescent spun too quickly: ${peak}`);
  if(drift>.5)throw Error(`Remaining screw moved: ${drift}`);
  const loadedPhysics=await page.evaluate(()=>JSON.parse(document.querySelector('#game-importmap').textContent).imports['./js/plate-physics.js']);
  const wait=await page.evaluate(duration=>{
    const animation=document.querySelector('[data-plate="p49"]').getAnimations()[0];
    return Math.max(0,duration*.75-Number(animation.currentTime));
  },tail.duration);
  await page.waitForTimeout(wait);
  const moving=await page.evaluate(()=>document.querySelector('[data-plate="p49"]').getAnimations().some(animation=>animation.playState==='running'));
  if(!moving)throw Error('Tail animation ended before the interaction check');
  await page.screenshot({path:'screw-sort-game/output/playwright/hanging-tail-390.png'});
  const remaining=page.locator('[data-plate="p49"] .screw-button:not(.removed)');
  const screwId=await remaining.getAttribute('data-screw');
  await remaining.click();
  const tailClickAccepted=await page.evaluate(id=>glassDebug.snapshot().state.removed.includes(id),screwId);
  if(!tailClickAccepted)throw Error('A screw could not be removed during the faint sway');
  await page.evaluate(()=>glassDebug.idle());
  if(errors.length)throw Error(errors.join('\n'));
  return {level:6,moves:ids.length,rangeDegrees:+(max-min).toFixed(1),peakDegreesPerSecond:+peak.toFixed(1),anchorDriftPixels:+drift.toFixed(3),tailPeaksDegrees:tail.peaks.map(p=>+p.toFixed(3)),tailClickAccepted,loadedPhysics,errors};
}
