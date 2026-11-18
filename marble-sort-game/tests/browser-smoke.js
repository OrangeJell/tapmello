async (page) => {
  await page.addInitScript(()=>{
    window.__audioNotes=[];window.__audioContexts=[];
    const original=AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator=function(){
      if(!window.__audioContexts.includes(this))window.__audioContexts.push(this);
      const oscillator=original.call(this),set=oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime=(value,time)=>{window.__audioNotes.push(value);return set(value,time);};
      return oscillator;
    };
  });
  const startRound=async()=>{
    await page.clock.runFor(800);
    await page.locator('#start').click({force:true});
    if(await page.locator('#guide-skip').isVisible())await page.locator('#guide-skip').click({force:true});
  };
  await page.evaluate(()=>localStorage.setItem('marble-sort.tutorial-mystery-done','true'));
  await page.clock.install({time:new Date('2026-11-04T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-04T00:00:01Z'));
  try{
  const results=[];
  const check=(ok,message)=>{if(!ok)throw new Error(message);results.push(message);};
  const state=()=>page.evaluate(()=>marbleDebug.snapshot());
  const click=selector=>page.locator(selector).click({force:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.evaluate(()=>{localStorage.removeItem('marble-sort.level');localStorage.setItem('marble-sort.sound','false');});
  await page.reload();await startRound();
  check((await state()).capacity===27,'initial capacity is 27');
  const widths=await page.locator('#sources button').evaluateAll(items=>items.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
  check(widths.every(r=>r.w>=44&&r.h>=44),'mobile source targets are at least 44px');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no mobile horizontal overflow');
  check(await page.locator('#hint').count()===0,'hint button removed');
  const solution=await page.evaluate(()=>marbleDebug.solution());
  await page.locator('#sources button').nth(solution[0]).click({force:true});await page.clock.runFor(300);
  check((await state()).moves===1,'source click releases one box');
  await click('#pause');const frozen=await state();await page.clock.runFor(3000);
  check((await state()).time===frozen.time,'pause freezes simulation');
  await page.getByRole('button',{name:'Keep playing',exact:true}).click({force:true});await page.clock.runFor(1800);
  await click('#undo');const undone=await state();
  check(undone.moves===0&&undone.pending.length===0&&undone.occupied===0,'undo restores falling and belt marbles');
  await click('#expand');check((await state()).capacity===36&&await page.locator('#expand').isDisabled(),'expansion adds 9 once');
  await click('#pause');await page.getByRole('button',{name:'Restart this level',exact:true}).click({force:true});await page.clock.runFor(500);
  check((await state()).capacity===27&&(await state()).undoLeft===1,'restart restores base capacity and tools');
  await page.locator('#sources button').nth(solution[0]).click({force:true});
  await click('#speed');const beforeSpeed=(await state()).time;await page.clock.runFor(1000);
  const accelerated=(await state()).time-beforeSpeed;check(accelerated>1.9&&accelerated<2.1,'2x speed advances simulation twice as fast');await click('#speed');
  await click('#undo');
  await click('#pause');await page.getByRole('button',{name:'Restart this level',exact:true}).click({force:true});
  await click('#help');check((await page.locator('#dialog-copy').textContent()).includes('two-colour office'),'help explains mixed boxes');
  await page.getByRole('button',{name:'Got it — let’s sort',exact:true}).click({force:true});
  await click('#ingame-settings');
  await page.locator('#effects-setting').check({force:true});
  check(await page.evaluate(()=>localStorage.getItem('marble-sort.sound')==='true'),'sound setting toggles and persists');
  await click('#settings form button');
  for(let move=0;move<solution.length;move++){
    await page.locator('#sources button').nth(solution[move]).click({force:true});
    let settled=false;
    for(let elapsed=0;elapsed<90;elapsed++){
      await page.clock.runFor(1000);const s=await state();
      if(s.status==='lost')throw new Error('unexpected loss at move '+move);
      if(s.remaining+s.pending.length+s.occupied+s.collected!==s.total)throw new Error('marble conservation failed in browser');
      if(s.status==='won'){settled=true;break;}
      if(!s.pending.length&&!s.boxes.some(b=>b?.filled===3)&&!s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color))){settled=true;break;}
    }
    if(!settled)throw new Error('drop failed to settle at move '+move);
  }
  await page.clock.runFor(3400);
  check((await state()).status==='won'&&(await state()).collected===(await state()).total,'full first level wins through real UI clicks');
  check(await page.evaluate(()=>window.__audioNotes.join(',').includes('523.25,659.25,783.99')&&window.__audioContexts.some(c=>c.state==='running')),'victory melody scheduled on active audio context');
  check(await page.locator('#dialog-actions button').count()===1,'win offers only next level');
  check(await page.locator('#dialog').getAttribute('data-result')==='won'&&await page.locator('#dialog-symbol img').isVisible(),'parade leads to the win card');
  await page.screenshot({path:'output/playwright/marble-sort/victory-mobile.png'});
  await page.getByRole('button',{name:'Next level',exact:true}).click({force:true});await page.clock.runFor(800);
  check(await page.locator('#level').textContent()==='02'&&(await state()).capacity===27,'next level keeps capacity 27');
  await page.reload();await startRound();check(await page.locator('#level').textContent()==='02','unlocked progress survives reload');
  await page.evaluate(()=>localStorage.setItem('marble-sort.level','60'));await page.reload();await startRound();
  for(let i=0;i<5;i++)await page.locator('#sources button').nth(i).click({force:true});
  let drainableFullSamples=0;
  for(let i=0;i<1600&&(await state()).status==='playing';i++){
    // The easy opening can absorb the first wave. Keep overloading later rows.
    if(i>0&&i%100===0){
      for(let column=0;column<5;column++){
        const button=page.locator('#sources button').nth(column);
        if(await button.isEnabled())await button.click({force:true});
      }
    }
    await page.clock.runFor(100);const s=await state();
    const canDrain=s.boxes.some(b=>b?.filled===3)||s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color));
    if(s.occupied===s.capacity&&canDrain){check(s.status==='playing','full belt stays alive while collection remains possible');drainableFullSamples++;}
    if(s.status==='lost')check(!canDrain,'loss has no remaining collection path');
  }
  await page.clock.runFor(800);check((await state()).status==='lost'&&await page.locator('#dialog').isVisible(),'overflow shows recovery dialog');
  check(await page.evaluate(()=>window.__audioNotes.join(',').includes('587.33,493.88,392')),'failure melody scheduled');
  check(await page.locator('#dialog-actions button').allTextContents().then(t=>t.join('|')==='Expand +9 and continue|Try again'),'loss offers continue and retry');
  check(await page.locator('#dialog-actions .primary').evaluate(e=>e.offsetHeight>=70),'continue action is enlarged');
  await page.screenshot({path:'output/playwright/marble-sort/loss-mobile.png',animations:'disabled'});
  await page.keyboard.press('Escape');check(await page.locator('#dialog').isVisible(),'loss cannot be dismissed into broken play');
  await page.getByRole('button',{name:'Expand +9 and continue',exact:true}).click({force:true});
  check((await state()).capacity===36&&(await state()).status==='playing','recovery expansion resumes play');
  await page.reload();await startRound();
  const finalSolution=await page.evaluate(()=>marbleDebug.solution());
  for(const column of finalSolution){
    await page.locator('#sources button').nth(column).click({force:true});
    for(let elapsed=0;elapsed<90;elapsed++){
      await page.clock.runFor(1000);const s=await state();
      if(s.status==='lost')throw new Error('final level unexpectedly lost');
      if(s.status==='won'||(!s.pending.length&&!s.boxes.some(b=>b?.filled===3)&&!s.slots.some(m=>m&&s.boxes.some(b=>b&&b.filled<3&&b.color===m.color))))break;
    }
  }
  await page.clock.runFor(3400);
  check((await state()).status==='won'&&(await state()).collected===(await state()).total,'full sixtieth level wins through real UI clicks');
  check(await page.locator('#dialog-title').textContent()==='All levels complete'&&await page.getByRole('button',{name:'Play again',exact:true}).isVisible(),'last level shows completion and replay');
  await page.screenshot({path:'output/playwright/marble-sort/all-complete.png',animations:'disabled'});
  await page.evaluate(()=>localStorage.setItem('marble-sort.level','1'));await page.reload();await startRound();
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await startRound();
  check((await state()).capacity===27,'reduced-motion mode initializes');
  await page.clock.resume();
  await page.setViewportSize({width:375,height:667});await page.waitForTimeout(200);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'375px layout has no horizontal overflow');
  check(await page.locator('#canvas').evaluate(c=>c.getContext('2d').getImageData(Math.floor(c.width*.2),Math.floor(c.height*.2),1,1).data[3]>0),'resized canvas keeps its painted board');
  await page.screenshot({path:'output/playwright/marble-sort/mobile-375.png'});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'landscape layout has no horizontal overflow');
  await page.setViewportSize({width:1280,height:960});await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.waitForTimeout(800);
  await page.screenshot({path:'output/playwright/marble-sort/final-desktop.png'});
  check(errors.length===0,'no uncaught browser errors');
  await page.evaluate(report=>{window.__qaReport=report;},{checks:results,errors,drainableFullSamples});
  return {checks:results,errors,drainableFullSamples};
  }finally{await page.clock.resume();}
}
