async (page) => {
  const language=page.url().includes('?qa=en')?'en':'hi';
  const base='http://127.0.0.1:4173/play/mahjong/', errors=[], results=[];
  page.on('pageerror',e=>errors.push(e.message));
  const assert=(v,m)=>{if(!v)throw Error(m);};
  const click=async(a,i)=>page.locator(`[data-action="${a}"]${i===undefined?'':`[data-index="${i}"]`}`).first().click();
  await page.goto(base);await page.evaluate(()=>{localStorage.removeItem('mahjong-tutor.v1');localStorage.removeItem('mahjong-tutor.v2');});await page.evaluate(lang=>localStorage.setItem('mahjong-tutor.v2',JSON.stringify({version:2,lang})),language);await page.reload();
  await page.setViewportSize({width:375,height:812});
  const levels=await page.evaluate(async()=>(await import('./js/curriculum.js')).levels);
  const answers=[[[1],[1],[2],[0,2,4],[1],[0,2],[0,2,4],[0,1,3],[1],[1],[1],[1]],[[0],[1],[1],[2],[1],[1],[0,1],[2]],[[0],[1],[0],[1],[0],[1],[1],[0]]];
  for(let l=0;l<3;l++){
    await page.goto(base+'#learn/'+levels[l].id+'/'+levels[l].questions[0].id);
    for(let i=0;i<answers[l].length;i++){
      await page.locator(`[data-question="${levels[l].questions[i].id}"]`).waitFor();
      if(await page.locator('[data-action="begin-question"]').count())await click('begin-question');
      if(l===0&&i===0){
        assert(await page.locator('[data-action="check"]').isDisabled(),'empty answer disabled');
        await click('select',0);await click('check');await page.locator('.feedback.wrong').waitFor();
        await click('hint');await page.locator('dialog[open]').waitFor();await page.keyboard.press('Escape');
      }
      for(const a of answers[l][i])await click('select',a);
      if(l===0&&i===0){
        await click('settings');await page.locator('[data-action="set-language"][data-id="en"]').click();
        assert(await page.locator('html').getAttribute('lang')==='en','English');
        assert(await page.locator('[data-action="select"][data-index="1"]').getAttribute('aria-pressed')==='true','selection preserved');
        await click('toggle-labels');assert(await page.locator('.tile-options .tile-name').count()===0,'labels off');await click('toggle-labels');
        await page.locator(`[data-action="set-language"][data-id="${language}"]`).click();await page.keyboard.press('Escape');
      }
      await click('check');await page.locator('.feedback.correct').waitFor();
      assert(!await page.locator('dialog').isVisible(),'no second confirmation');
      await click('next');
    }
    results.push('completed '+levels[l].id+' exercises');
  }
  await click('round-draw');await page.locator(`.hand-grid button[aria-label="${language==='hi'?'पूर्व':'East'}"]`).first().click();await click('round-discard');await page.locator('.feedback.wrong').waitFor();
  await page.locator(`.hand-grid button[aria-label="${language==='hi'?'पश्चिम':'West'}"]`).click();await click('round-discard');await click('round-draw');await page.reload();
  await page.locator(`.hand-grid button[aria-label="${language==='hi'?'दक्षिण':'South'}"]`).click();await click('round-discard');
  await click('select',0);await click('select',1);await click('round-check');await page.locator('.feedback.correct').waitFor();await click('round-next');await click('round-draw');await click('round-win');await page.locator('.completion').waitFor();
  assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('mahjong-tutor.v2')).completed.length)===29,'all 29 entries saved');results.push('guided round and refresh');
  await page.goto(base+'#learn/advanced/seven-pairs-recognize');await click('patterns');
  const rule=await page.locator('dialog [data-pattern="seven-pairs"] > p').first().textContent();await click('related-article');await page.locator('.article').waitFor();
  assert(await page.locator('.article [data-pattern="seven-pairs"] > p').first().textContent()===rule,'shared article rule');results.push('shared pattern and article');
  assert(errors.length===0,errors.join(';'));return {language,results,errors};
}
