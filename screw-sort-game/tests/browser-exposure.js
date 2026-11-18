async hostPage=>{
  const context=await hostPage.context().browser().newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const assert=(ok,message)=>{if(!ok)throw Error(message);},layouts=[];
  const base='http://127.0.0.1:4173/play/screw-sort/';
  try {
    for(const [width,height] of [[320,667],[390,844],[430,932],[1280,800]]) {
      await page.setViewportSize({width,height});await page.goto(`${base}?lang=en&qa=1&previewLevel=2`);await page.locator('#play').click();
      const metrics=await page.evaluate(()=>{
        const frame=document.querySelector('#board-frame').getBoundingClientRect(),game=document.querySelector('#game').getBoundingClientRect();
        return {width:innerWidth,height:innerHeight,frameHeight:frame.height,frameWidth:frame.width,gameBottom:game.bottom,overflow:document.documentElement.scrollWidth>innerWidth,exposed:document.querySelectorAll('.screw-button:not(:disabled)').length,touchSize:Math.min(...[...document.querySelectorAll('.screw-button:not(:disabled)')].map(n=>n.getBoundingClientRect().width))};
      });
      assert(!metrics.overflow&&metrics.gameBottom<=height+1,'Clipped mobile layout');assert(metrics.touchSize>=43.8,'Small touch target');
      assert(metrics.exposed>=14&&metrics.exposed<=16,'Too few exposed opening screws');
      assert(metrics.frameHeight/height>.64,'Board did not gain enough mobile space');layouts.push(metrics);
      await page.screenshot({path:`screw-sort-game/output/playwright/reference-mobile-${width}.png`});
    }
    const openings=[];
    await page.setViewportSize({width:390,height:844});
    for(let levelId=1;levelId<=10;levelId++) {
      await page.goto(`${base}?lang=en&qa=1&previewLevel=${levelId}`);await page.locator('#play').click();
      const opening=await page.evaluate(()=>{
        const heads=[...document.querySelectorAll('.screw-button:not(:disabled)')];
        const top=document.querySelector('.plate:last-child .glass-fill'),rim=document.querySelector('.plate:last-child .glass-rim');
        return{level:glassDebug.snapshot().levelId,exposed:heads.length,clear:heads.every(n=>!n.classList.contains('covered')&&!n.classList.contains('buried')),faceOpacity:Number(getComputedStyle(top).fillOpacity),rimWidth:Number.parseFloat(getComputedStyle(rim).strokeWidth)};
      });
      assert(opening.exposed===15&&opening.clear,'Opening heads are not fully exposed');
      assert(opening.faceOpacity>=.9&&opening.rimWidth>=4,'Reference material lost its solid colour or white edge');openings.push(opening);
      if([1,4,10].includes(levelId))await page.screenshot({path:`screw-sort-game/output/playwright/reference-level-${levelId}.png`});
    }
    await page.setViewportSize({width:390,height:844});await page.goto(`${base}?qa=1&previewLevel=2`);
    await page.evaluate(async()=>{
      const [{BoardView},{Motion},{createState,transition},{swingFrames}]=await Promise.all([import('./js/board-view.js'),import('./js/motion.js'),import('./js/engine.js'),import('./js/plate-motion.js')]);
      const frame=document.createElement('div'),root=document.createElement('div');frame.id='exposure-frame';frame.style.cssText='position:fixed;left:15px;top:180px;width:360px;height:500px;z-index:95;background:#b4ddee';root.className='board';frame.append(root);document.body.append(frame);
      const lower={id:'lower',shape:'rounded',x:50,y:260,width:50,height:50,angle:0,z:0,layer:0,paint:'aqua',screws:[{id:'lower-screw',x:0,y:0,color:'blue'}]};
      const upper={id:'upper',shape:'bar',x:100,y:180,width:150,height:50,angle:0,z:1,layer:1,paint:'rose',screws:[{id:'upper-screw',x:-50,y:0,color:'blue'}]};
      const level={id:99,version:'exposure-fixture',queue:['blue','blue','blue','blue'],boards:[lower,upper]};
      const state=createState(level);state.poses.upper={x:50,y:230,angle:90};
      const motion=new Motion(),view=new BoardView(root,frame,motion,key=>key);view.build(level,state);view.setMode(true);
      const started=performance.now();window.exposureQA={view,motion,state,level,started,accepted:false};
      root.addEventListener('click',event=>{
        view.refresh();const target=view.pick(event.clientX,event.clientY);if(!target)return;
        const result=transition(level,state,{type:'screw',id:target.dataset.screw,scenePoses:view.captureScenePoses()});exposureQA.accepted=result.accepted;
      });
      const transform=p=>`translate(${p.x}px,${p.y}px) translate(-50%,-50%) rotate(${p.angle}deg)`;
      const movement=swingFrames(upper,upper.screws[0],state.poses.upper,upper,[]);view.animate(upper,movement.frames.map(f=>({offset:f.offset,transform:transform(f.pose)})),movement.duration,movement);
    });
    await page.waitForFunction(()=>!document.querySelector('#exposure-frame [data-screw="lower-screw"]').disabled,null,{timeout:900});
    const exposed=await page.evaluate(()=>({delay:performance.now()-exposureQA.started,moving:exposureQA.view.animations.size>0,depth:document.querySelector('#exposure-frame [data-screw="lower-screw"]').dataset.depth}));
    assert(exposed.moving&&exposed.delay<900&&exposed.depth==='0','Exposure waited for the animation to settle');
    const target=await page.locator('#exposure-frame [data-screw="lower-screw"]').boundingBox();await page.mouse.click(target.x+target.width/2,target.y+target.height/2);
    assert(await page.evaluate(()=>exposureQA.accepted),'Engine rejected the exposed moving-scene screw');
    await page.evaluate(()=>{exposureQA.motion.cancel();document.querySelector('#exposure-frame').remove();});
    const packing=await page.evaluate(async()=>{
      const [{Motion},{screwHead}]=await Promise.all([import('./js/motion.js'),import('./js/glass-art.js')]);
      const node=document.createElement('div');node.className='toolbox';node.style.cssText='position:fixed;left:20px;top:80px;width:85px;--box-color:var(--blue);z-index:90';
      node.innerHTML=`<div class="box-wells">${Array.from({length:3},()=>`<span class="box-well">${screwHead('blue')}</span>`).join('')}</div>`;node.querySelectorAll('.screw-head').forEach(head=>head.style.visibility='visible');document.body.append(node);
      const motion=new Motion(),outgoing=motion.pack(node);const sourceOpacity=getComputedStyle(node).opacity;
      await motion.wait(190);const ghost=document.querySelector('.packing-box'),contentsOpacity=getComputedStyle(ghost.querySelector('.box-wells')).opacity;
      await outgoing.finished;node.remove();return {sourceOpacity,contentsOpacity,ghosts:motion.ghosts.size};
    });
    assert(packing.sourceOpacity==='0'&&Number(packing.contentsOpacity)<.01&&packing.ghosts===0,'Packing left visible screws');
    assert(!errors.length,errors.join('\n'));return {layouts,openings,exposed,packing,errors};
  }finally{await context.close();}
}
