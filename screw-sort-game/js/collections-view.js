import { screwHead } from './glass-art.js';
import { SYMBOLS } from './engine.js';
const clone=value=>JSON.parse(JSON.stringify(value));

export class CollectionsView {
  constructor(boxes,tray,motion,t,onPack=()=>{}) {
    Object.assign(this,{boxes,tray,motion,t,onPack});this.serial=0;this.epoch=0;
  }
  head(color,id=null) {
    const template=document.createElement('template');template.innerHTML=screwHead(color);
    const node=template.content.firstElementChild;if(id)node.dataset.screwId=id;return node;
  }
  batch(index,box) {
    const node=document.createElement('div');node.className=`toolbox${box?'':' complete-box'}`;
    node.dataset.boxBatch=String(++this.serial);node.dataset.boxIndex=index;
    node.innerHTML=box?`<span class="handle"></span><span class="box-symbol">${SYMBOLS[box.color]}</span><div class="box-wells"><span class="box-well"></span><span class="box-well"></span><span class="box-well"></span></div>`:'<span class="handle"></span><span class="box-check">✓</span>';
    if(box){node.style.setProperty('--box-color',`var(--${box.color})`);node.setAttribute('role','img');}
    const batch={index,color:box?.color,node,slots:[],ready:Promise.resolve(),count:0};
    for(let i=0;i<(box?.count||0);i++) {
      const head=this.head(box.color);node.querySelectorAll('.box-well')[i].append(head);
      batch.slots[i]={node:head,arrived:Promise.resolve()};batch.count++;
    }
    return batch;
  }
  reset(state) {
    this.epoch++;this.model=clone(state);this.bufferItems=[];this.liveBuffer=[];this.trayTail=Promise.resolve();
    this.current=state.boxes.map((box,i)=>this.batch(i,box));this.shown=[...this.current];
    this.boxes.replaceChildren();this.tray.replaceChildren();
    state.unlocked.forEach((open,i)=>{
      if(open)this.boxes.append(this.shown[i].node);
      else {
        const locked=document.createElement('button');locked.className='toolbox locked-box';locked.dataset.unlock=i;
        locked.innerHTML='<span class="handle"></span><span class="lock-label"></span><span class="unlock-mark">＋</span>';this.boxes.append(locked);
      }
    });
    for(const screw of state.buffer) {
      const node=this.head(screw.color,screw.id);node.dataset.bufferId=screw.id;
      const item={...screw,node,arrived:Promise.resolve()};this.bufferItems.push(item);this.liveBuffer.push(item);
    }
    this.render();
  }
  render() {
    for(let i=0;i<this.boxes.children.length;i++) {
      const node=this.boxes.children[i],batch=this.shown[i];
      if(node.dataset.unlock) {
        node.setAttribute('aria-label',`${this.t('unlock')} ${i+1}`);node.querySelector('.lock-label').textContent=this.t('unlock');
      }else if(batch.color)node.setAttribute('aria-label',this.t('box',{color:this.t(`color_${batch.color}`),n:batch.count}));
    }
    while(this.tray.children.length<this.model.capacity) {
      const slot=document.createElement('span');slot.className=`tray-slot${this.tray.children.length>=5?' bonus':''}`;this.tray.append(slot);
    }
    const occupied=new Set();
    this.liveBuffer.forEach((item,i)=>{
      const slot=this.tray.children[i];if(!slot)return;
      if(item.node.parentElement!==slot)slot.append(item.node);
      occupied.add(item.node);slot.setAttribute('aria-label',this.t('slot',{color:this.t(`color_${item.color}`)}));
    });
    [...this.tray.children].forEach(slot=>{
      [...slot.children].forEach(node=>{if(!occupied.has(node))node.remove();});
      if(!slot.children.length)slot.setAttribute('aria-label',this.t('empty'));
    });
    this.tray.classList.toggle('danger',this.model.buffer.length>=this.model.capacity-1);
  }
  positions() {return new Map(this.liveBuffer.map(item=>[item.id,item.node.getBoundingClientRect()]));}
  destination(well,node) {
    // Future batches occupy the same wells. Measure the final layout without
    // waiting for the outgoing lid or the incoming box's entrance animation.
    if(!well)return null;
    const probe=node.cloneNode(true);
    Object.assign(probe.style,{visibility:'hidden',position:'absolute'});well.append(probe);
    const style=getComputedStyle(probe),width=parseFloat(style.width),height=parseFloat(style.height),fontSize=style.fontSize;
    const slot=well.getBoundingClientRect();probe.remove();
    return {rect:{x:slot.x+(slot.width-width)/2,y:slot.y+(slot.height-height)/2,width,height},fontSize};
  }
  dock(item,flight,alive) {
    return flight.arrived.then(async arrived=>{
      if(!arrived || !alive())return;
      item.node.style.visibility='visible';flight.release();await this.motion.land(item.node);
    }).finally(()=>flight.release());
  }
  // Register ordered engine events synchronously. Each receiving slot belongs
  // to a box generation; only that destination's prerequisites delay a flight.
  enqueue(events,snapshot,state,alive) {
    const epoch=this.epoch,valid=()=>this.epoch===epoch&&alive();this.model=clone(state);
    const jobs=[],stagger=new Map();
    for(const event of events) {
      if(event.type==='taken') {
        const node=this.head(event.color,event.screwId);node.style.visibility='hidden';
        const item={id:event.screwId,color:event.color,node};let ready,destination;
        if(event.target==='buffer') {
          node.dataset.bufferId=item.id;
          ready=this.trayTail.then(()=>{if(valid()){this.liveBuffer.push(item);this.render();}});this.bufferItems.push(item);
          destination=()=>this.destination(this.tray.children[event.slot],node);
        }else {
          const batch=this.current[event.index];batch.slots[event.slot]=item;
          batch.node.querySelectorAll('.box-well')[event.slot].append(node);ready=batch.ready;
          destination=()=>this.destination(this.shown[batch.index].node.querySelectorAll('.box-well')[event.slot],node);
        }
        const flight=this.motion.launch(snapshot,()=>node,{ready,destination,screwIn:event.target==='buffer'});
        const batch=event.target==='box'?this.current[event.index]:null;
        item.arrived=this.dock(item,flight,valid).then(()=>{if(valid()&&batch){batch.count++;this.render();}});jobs.push(item.arrived);
      }else if(event.type==='packed') {
        const batch=this.current[event.index],next=this.batch(event.index,event.nextBox);
        const packing=Promise.all([batch.ready,...batch.slots.map(item=>item.arrived)]).then(()=>{
          if(!valid())return null;
          return this.motion.pack(batch.node,{alive:valid,onPulse:()=>{if(valid())this.onPack();}});
        });
        next.ready=packing.then(async outgoing=>{
          if(!outgoing)return;
          await outgoing.vacated;if(!valid())return;
          this.boxes.children[event.index].replaceWith(next.node);this.shown[event.index]=next;this.render();await this.motion.enter(next.node);
        });
        this.current[event.index]=next;jobs.push(Promise.all([next.ready,packing.then(outgoing=>outgoing?.finished)]));
      }else if(event.type==='stored') {
        const batch=this.current[event.index],item=this.bufferItems.find(item=>item.id===event.screwId);
        if(!item)throw new Error(`Missing buffered screw ${event.screwId}`);
        const priorArrivals=this.bufferItems.map(item=>item.arrived);this.bufferItems.splice(this.bufferItems.indexOf(item),1);
        const receiving=this.head(event.color,event.screwId);receiving.style.visibility='hidden';
        const arrival={node:receiving};batch.slots[event.slot]=arrival;batch.node.querySelectorAll('.box-well')[event.slot].append(receiving);
        const delay=(stagger.get(batch)||0)*45;stagger.set(batch,(stagger.get(batch)||0)+1);
        let markStarted;const started=new Promise(resolve=>{markStarted=resolve;});
        arrival.arrived=(async()=>{
          try {
            await Promise.all([batch.ready,...priorArrivals]);if(!valid())return;
            if(delay && !await this.motion.wait(delay))return;
            if(!valid())return;
            const source=this.motion.capture(item.node),positions=this.positions();
            const flight=this.motion.launch(source,()=>receiving,{lift:false});
            item.node.style.visibility='hidden';this.liveBuffer.splice(this.liveBuffer.indexOf(item),1);this.render();
            const compact=this.motion.compact(this.tray,positions);compact.then(markStarted,markStarted);
            await Promise.all([this.dock(arrival,flight,valid),compact]);if(valid()){batch.count++;this.render();}
          }finally{markStarted();}
        })();
        this.trayTail=Promise.all([this.trayTail,started]);jobs.push(arrival.arrived);
      }else if(event.type==='unlocked') {
        const batch=this.batch(event.index,event.nextBox);this.current[event.index]=batch;
        batch.ready=Promise.resolve().then(async()=>{
          if(!valid())return;
          this.boxes.children[event.index].replaceWith(batch.node);this.shown[event.index]=batch;this.render();await this.motion.enter(batch.node);
        });jobs.push(batch.ready);
      }else if(event.type==='extra') {
        this.render();jobs.push(this.motion.land(this.tray.lastElementChild));
      }
    }
    return Promise.all(jobs);
  }
  snapshot() {
    return {boxes:this.shown.map(batch=>({color:batch.color||null,count:batch.count,batch:batch.node.dataset.boxBatch})),buffer:this.liveBuffer.filter(item=>item.node.style.visibility!=='hidden').map(item=>({id:item.id,color:item.color}))};
  }
}
