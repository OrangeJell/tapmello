import { LEVELS } from './levels.js';
import { createState, transition, canUse, continuation, totalScrews } from './engine.js';
import { RULES } from './config.js';
import { LANGUAGES, translate } from './i18n.js';
import { loadProgress, saveProgress, recordCompletion, loadSession, saveSession, clearSession } from './storage.js';
import { Motion } from './motion.js';
import { BoardView } from './board-view.js';
import { CollectionsView } from './collections-view.js';
import { ICONS } from './glass-art.js';
import { Sound } from './sound.js';
import { TapGate } from './gestures.js';
import { telemetry } from './telemetry.js';

const $ = id => document.getElementById(id), params = new URLSearchParams(location.search);
const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const embedded = params.get('embed')==='1' && window.parent!==window;
if (embedded) {
  document.documentElement.dataset.embedded='true';
  window.screwSortEmbedSend = (type, details={}) => window.parent.postMessage({scope:'tapmelo:screw-sort',type,...details},location.origin);
}
let storage;
try { storage=window.localStorage; } catch { /* Optional local storage. */ }
let preferences=loadProgress(storage), storageOK=true;
const requestedLanguage=params.get('lang');
if (Object.keys(LANGUAGES).includes(requestedLanguage)) preferences.lang=requestedLanguage;
const t=(key,vars)=>translate(preferences.lang,key,vars);
const preview=local && LEVELS.find(l=>l.id===Number(params.get('previewLevel')));
const restored=preview?null:loadSession(storage);
let level=preview || restored?.level || LEVELS[preferences.unlocked-1];
let state=restored?.state || createState(level), actions=restored?.actions || [];
let phase='ready', round=0, pending=0, collectionTail=Promise.resolve(), selecting=false;
let modalKind=null, modalOrigin='ready', toastTimer, resultShown=false;
const motion=new Motion(), sound=new Sound(), tapGate=new TapGate(), touches=new Set();
const board=new BoardView($('board'),$('board-frame'),motion,t);
const collections=new CollectionsView($('boxes'),$('tray'),motion,t,()=>{
  sound.play('pack');if(preferences.vibration)navigator.vibrate?.(12);
});

let persistTimer;
function schedulePersist() { clearTimeout(persistTimer);persistTimer=setTimeout(persist,120); }
function persist() {
  clearTimeout(persistTimer);
  const a=saveProgress(storage,preferences);
  const b=state.status==='won' ? (clearSession(storage),true) : saveSession(storage,level,state.initialBoxes,actions);
  storageOK=a&&b;
}
function setPhase(value) {
  phase=value; $('game').dataset.phase=value; telemetry.phase(value);
  if (value==='paused' || value==='ready') { motion.pause(); sound.pause(); }
  else if (value==='playing') { motion.resume(); if (preferences.sound) void sound.unlock(); }
  $('launch').hidden=value!=='ready'; render();
}
function localize() {
  document.documentElement.lang=preferences.lang;
  document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n);});
  $('pause').innerHTML=ICONS.pause; $('pause').setAttribute('aria-label',t('pause'));
  $('progress-art').innerHTML=ICONS.chest;
  for (const type of ['extra','melt']) $(type).querySelector('.prop-icon').innerHTML=ICONS[type];
  $('play').textContent=t(actions.length?'continue':'play');
  sound.enabled=preferences.sound;
  if (board.level) board.update(state,false);
  if (collections.model) collections.render();
  render();
}
function render() {
  $('level-label').textContent=t('level',{n:level.id});
  $('level-picker').setAttribute('aria-label',`${t('level',{n:level.id})} · ${t('chooseLevel')}`);
  $('level-picker').setAttribute('aria-expanded',String(modalKind==='levels'));
  $('capacity-label').textContent=`${state.buffer.length} / ${state.capacity}`;
  const percentage=Math.floor(state.packed/totalScrews(level)*100);
  $('progress-label').textContent=`${percentage}%`;
  $('progress').setAttribute('aria-valuenow',percentage); $('progress').setAttribute('aria-label',t('progress'));
  $('pause').disabled=phase==='ready';
  $('game').dataset.busy=String(pending>0); $('game').dataset.remaining=String(totalScrews(level)-state.removed.length);
  $('selection').hidden=!selecting;
  for (const type of ['extra','melt']) {
    const node=$(type), used=type==='extra'?state.capacity>=RULES.maxSlots:state.used[type]>=1;
    const unavailable=phase!=='playing'||selecting||!canUse(state,type);
    node.disabled=unavailable||pending>0;
    node.dataset.unavailable=String(unavailable);
    node.dataset.used=String(used); node.dataset.ready=String(type==='melt'&&state.meltCredits>0);
    node.querySelector('.prop-badge').textContent=used?'✓':type==='melt'&&state.meltCredits?'✓':'＋';
    node.setAttribute('aria-label',t(type)+(used?` · ${t('used')}`:''));
  }
  for (const node of $('boxes').querySelectorAll('[data-unlock]')) node.disabled=phase!=='playing'||pending>0||selecting||state.queueIndex>=level.queue.length;
  board.setMode(phase==='playing'&&!modalKind&&state.status==='playing',selecting);
}
function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').classList.add('visible');
  toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2200);
}
function resetVisuals() {
  round++; motion.cancel(); sound.cancel(); pending=0; collectionTail=Promise.resolve(); selecting=false; resultShown=false;
  clearTimeout(toastTimer); $('toast').classList.remove('visible'); $('celebration').replaceChildren();
  modalKind=null; if ($('dialog').open) $('dialog').close();
}
function startLevel(id, openBoxes=2, source='restart') {
  telemetry.end('abandoned','restart'); resetVisuals();
  level=LEVELS.find(l=>l.id===id); state=createState(level,{openBoxes}); actions=[];
  collections.reset(state); board.build(level,state); persist();
  telemetry.start(level.id,preferences.lang,source); setPhase('playing');
}
function begin() {
  if (phase!=='ready') return;
  telemetry.start(level.id,preferences.lang,actions.length?'continue':'initial');
  setPhase('playing'); persist(); finishRound();
}
async function commit(action, source=null) {
  if (phase!=='playing'||modalKind||(state.status!=='playing'&&action.type!=='continue')) return false;
  // Capture the visible head before the synchronous physics transition so
  // its start position agrees with the scene used to validate this tap.
  const snapshot=motion.capture(source?.querySelector('.screw-head'),{scale:board.scale});
  if(action.type==='screw'||action.type==='melt') {
    const scenePoses=board.captureScenePoses();
    if(Object.keys(scenePoses).length)action={...action,scenePoses};
  }
  if(action.type==='screw') {
    const owner=level.boards.find(b=>b.screws.some(s=>s.id===action.id));
    if(owner&&!state.melted.includes(owner.id)&&owner.screws.filter(s=>!state.removed.includes(s.id)).length===1)action={...action,releasePose:board.currentPose(owner)};
  }
  const movingOwner=action.type==='screw'?level.boards.find(b=>b.screws.some(s=>s.id===action.id)):action.type==='melt'?level.boards.find(b=>b.id===action.id):null;
  const looseMotion=movingOwner?board.captureLooseMotion(movingOwner.layer):{};
  if(Object.keys(looseMotion).length)action={...action,looseMotion};
  const result=transition(level,state,action,{captureMotion:true});
  if (!result.accepted) return false;
  const token=round, alive=()=>round===token;
  pending++; state=result.state; actions.push(action);
  if(state.status==='won')preferences=recordCompletion(preferences,level.id);
  schedulePersist();
  if (action.type==='screw') { telemetry.move(); sound.play(); if(preferences.vibration) navigator.vibrate?.(8); }
  const job=collections.enqueue(result.events,snapshot,state,alive);
  collectionTail=Promise.all([collectionTail,job]).catch(error=>console.error('Collection animation failed',error));
  board.update(state,true,result.motions); render();
  await job;
  if (!alive()) return true;
  pending--; render();
  if (!pending) { collections.render(); render(); finishRound(); }
  return true;
}
function finishRound() {
  if (pending || modalKind || phase==='ready' || resultShown) return;
  if (state.status==='won') {
    resultShown=true; preferences=recordCompletion(preferences,level.id); persist();
    telemetry.end('won','completed'); phase='won'; showModal('win'); sound.play('win'); celebrate();
  } else if (state.status==='jammed') {
    resultShown=true; telemetry.jam(); phase='jammed'; showModal('jam');
    void motion.play($('tray'),[{transform:'translateX(0)'},{transform:'translateX(-5px)',offset:.2},{transform:'translateX(4px)',offset:.45},{transform:'translateX(-2px)',offset:.7},{transform:'translateX(0)'}],420,'linear');
  }
}
function button(label, callback, className='primary-button', icon=null) {
  const node=document.createElement('button'); node.type='button'; node.className=className; node.textContent=label;
  if (icon) {
    const mark=document.createElement('span'); mark.className='action-icon'; mark.setAttribute('aria-hidden','true'); mark.innerHTML=icon;
    node.prepend(mark);
  }
  node.addEventListener('click',callback); return node;
}
function modal(title, body, mark='✦') {
  const root=$('dialog-content'); root.replaceChildren();
  const icon=document.createElement('div'); icon.className='modal-mark'; icon.textContent=mark; icon.setAttribute('aria-hidden','true');
  const heading=document.createElement('h2'); heading.id='dialog-title'; heading.textContent=title;
  const copy=document.createElement('p'); copy.textContent=body;
  const list=document.createElement('div'); list.className='modal-actions';
  root.append(icon,heading); if (body) root.append(copy); root.append(list); return list;
}
function openDialog(kind) {
  if (!modalKind) modalOrigin=phase;
  modalKind=kind; $('dialog').dataset.kind=kind; setPhase(kind==='win'?'won':kind==='jam'?'jammed':'paused');
  if (!$('dialog').open) $('dialog').showModal();
}
function resume() {
  modalKind=null; $('dialog').close();
  if (modalOrigin==='ready') { setPhase('ready'); return; }
  if (state.status!=='playing') { resultShown=false; phase='playing'; finishRound(); return; }
  setPhase('playing');
}
function showModal(kind) {
  openDialog(kind);
  let list;
  if (kind==='pause') {
    list=modal(t('paused'),'','');
    $('dialog-content').querySelector('.modal-mark').innerHTML=ICONS.pause;
    list.append(button(t('resume'),resume,'primary-button pause-resume',ICONS.play),button(t('restart'),()=>showModal('restart'),'secondary-button pause-retry',ICONS.retry));
    const settings=document.createElement('div'); settings.className='pause-settings';
    for (const [key,label] of [['sound','sound'],['vibration','vibration']]) {
      const row=document.createElement('div'); row.className='settings-row';
      const text=document.createElement('span'); text.textContent=t(label);
      row.append(text,button(t(preferences[key]?'on':'off'),()=>{preferences[key]=!preferences[key];saveProgress(storage,preferences);localize();showModal('pause');},'setting-toggle')); settings.append(row);
    }
    const languages=document.createElement('div'); languages.className='language-options';
    for (const [lang,label] of Object.entries(LANGUAGES)) languages.append(button(label,()=>{preferences.lang=lang;saveProgress(storage,preferences);localize();showModal('pause');},preferences.lang===lang?'active':''));
    list.append(settings,languages,button(t('help'),()=>showModal('help'),'text-button'));
    if (!storageOK) { const note=document.createElement('p');note.className='save-note';note.textContent=t('storageError');list.append(note); }
  } else if (kind==='levels') {
    list=modal(t('chooseLevel'),'','');
    const grid=document.createElement('div');grid.className='level-grid';
    for(const candidate of LEVELS) {
      const item=button(String(candidate.id),()=>{
        if(candidate.id===level.id&&state.status==='playing') {
          resume();if(phase==='ready')begin();
        } else startLevel(candidate.id,2,'level_select');
      },'level-choice');
      const completed=preferences.completed.includes(candidate.id);
      item.setAttribute('aria-label',t('level',{n:candidate.id})+(completed?` · ${t('completed')}`:''));
      item.dataset.level=String(candidate.id);
      if(candidate.id===level.id)item.setAttribute('aria-current','true');
      if(completed) {
        const check=document.createElement('span');check.className='level-check';check.textContent='✓';check.setAttribute('aria-hidden','true');item.append(check);
      }
      grid.append(item);
    }
    list.append(grid,button(t('back'),resume,'text-button'));
  } else if (kind==='restart') {
    list=modal(t('restartTitle'),t('restartBody'),'↻');
    list.append(button(t('restart'),()=>{telemetry.restart();startLevel(level.id);}),button(t('cancel'),resume,'text-button'));
  } else if (kind==='help') {
    list=modal(t('help'),t('guide'),'✚'); list.append(button(t('back'),resume));
  } else if (kind==='jam') {
    const retry=continuation(state);
    list=modal(t('jam'),t(retry==='box'?'jamBody':retry==='extra'?'jamExtraBody':'jamRestartBody'),'');
    const mark=$('dialog-content').querySelector('.modal-mark');
    mark.innerHTML='<span class="almost-screw">✚</span><span class="almost-ring"></span><i>✧</i>';
    if (retry) {
      const continueButton=button(t(retry==='box'?'retryBox':'retryExtra'),()=>reward('retry'),'primary-button continue-button');
      list.append(continueButton);
    }
    list.append(button(t('restart'),()=>{telemetry.restart();startLevel(level.id);},retry?'text-button jam-restart':'primary-button'));
  } else if (kind==='win') {
    const last=level.id===LEVELS.length;
    list=modal(t(last?'done':'win',{n:LEVELS.length}),t(last?'doneBody':'winBody'),'✦');
    list.append(button(t(last?'playAgain':'next'),()=>startLevel(last?1:level.id+1,2,last?'restart':'next_level')),button(t('restart'),()=>startLevel(level.id),'text-button'));
  }
  (list?.querySelector('[aria-current="true"]')||list?.querySelector('button'))?.focus({preventScroll:true});
}
function reward(type, index) {
  if (pending || (type!=='retry' && (phase!=='playing'||state.status!=='playing'))) return;
  const retry=type==='retry'?continuation(state):null;
  if (type==='retry' && !retry) return;
  if (type==='melt'&&state.meltCredits) { selecting=true;render();return; }
  if (['extra','melt'].includes(type) && !canUse(state,type)) return;
  if (type==='unlock' && (state.unlocked[index] || state.queueIndex>=level.queue.length)) return;
  openDialog('reward');
  const title=t(type==='retry'?(retry==='extra'?'retryExtraTitle':'retryTitle'):type);
  const body=t(type==='retry'&&retry==='extra'?'retryExtraBody':`${type}Body`);
  const list=modal(title,body,type==='melt'?'◈':'+');
  list.append(button(t('confirm'),async()=>{
    if (modalKind!=='reward') return;
    modalKind=null; $('dialog').close();
    if (type==='retry') {
      resultShown=false;setPhase('playing');
      await commit({type:'continue',reward:retry});
      return;
    }
    setPhase('playing');
    const token=round;
    const action=type==='melt'?{type:'grantMelt'}:type==='unlock'?{type,index}:{type};
    const accepted=await commit(action);
    if (!accepted || token!==round) return;
    if (type==='melt' && state.status==='playing' && !modalKind) selecting=true;
    render(); toast(t('received'));
  }),button(t('cancel'),resume,'text-button'));
}
function celebrate() {
  if (motion.reduced.matches) return;
  const colours=['#ffcf51','#f97898','#75d5e3','#a2df72','#ba8af4'];
  $('celebration').innerHTML=Array.from({length:32},(_,i)=>`<i style="--confetti:${colours[i%5]};--delay:${i%4*40}ms;--dx:${Math.sin(i*2.4)*260}px;--dy:${100+Math.cos(i*1.6)*280}px;--turn:${i*49}deg"></i>`).join('');
}
function tap(x,y,pressed=null) {
  if (phase!=='playing'||modalKind) return;
  board.refresh();
  if (selecting) {
    const target=board.pickGlass(x,y);
    if (target) { selecting=false;void commit({type:'melt',id:target.id}); }
  } else {
    // Keep the identity selected at pointer-down even if its plate moves
    // before pointer-up. Never redirect a repeated tap to the screw beneath.
    if(pressed) {
      if(pressed.classList.contains('removed'))return;
      if(!pressed.disabled)void commit({type:'screw',id:pressed.dataset.screw},pressed);
      else if(pressed.dataset.blocked==='true'){void board.bump(pressed);toast(t('blocked'));}
      return;
    }
    const target=board.pick(x,y);
    const blocked=board.pick(x,y,true);
    // A partial rim overlap must not turn into a click on an adjacent exposed head.
    if(blocked){const r=blocked.getBoundingClientRect();const d=Math.hypot(x-r.x-r.width/2,y-r.y-r.height/2);const tr=target?.getBoundingClientRect();const td=tr?Math.hypot(x-tr.x-tr.width/2,y-tr.y-tr.height/2):Infinity;if(td>15*board.scale&&d<td){void board.bump(blocked);toast(t('blocked'));return;}}
    if (target) void commit({type:'screw',id:target.dataset.screw},target);
  }
}
$('play').addEventListener('click',begin);
$('level-picker').addEventListener('click',()=>showModal('levels'));
$('pause').addEventListener('click',()=>showModal('pause'));
$('boxes').addEventListener('click',event=>{const target=event.target.closest('[data-unlock]');if(target&&!target.disabled)reward('unlock',Number(target.dataset.unlock));});
for (const type of ['extra','melt']) $(type).addEventListener('click',()=>reward(type));
$('cancel-selection').addEventListener('click',()=>{selecting=false;render();});
let suppressClickUntil=0,pressedScrew=null;
document.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touches.add(event.pointerId);if(touches.size>1)tapGate.cancel();}},true);
for(const type of ['pointerup','pointercancel']) document.addEventListener(type,event=>touches.delete(event.pointerId),true);
$('board').addEventListener('pointerdown',event=>{
  pressedScrew=null;
  if(touches.size>1||phase!=='playing'||modalKind)return;
  board.refresh();
  // Actual head hits take priority; enlarged touch targets remain handled by
  // tap so partially covered heads cannot steal an adjacent valid selection.
  const candidate=board.pick(event.clientX,event.clientY);
  if(candidate){const head=candidate.querySelector('.screw-head').getBoundingClientRect();if(Math.hypot(event.clientX-head.x-head.width/2,event.clientY-head.y-head.height/2)<=15*board.scale)pressedScrew=candidate;}
  if(event.pointerType!=='touch'||touches.size>1||phase!=='playing')return;
  tapGate.begin(event.pointerId,event.screenX,event.screenY);
});
$('board').addEventListener('pointermove',event=>{
  tapGate.move(event.pointerId,event.screenX,event.screenY);
});
$('board').addEventListener('pointerup',event=>{
  if(event.pointerType!=='touch')return;
  suppressClickUntil=performance.now()+700;
  const pressed=pressedScrew;pressedScrew=null;
  if(tapGate.end(event.pointerId,event.screenX,event.screenY))tap(event.clientX,event.clientY,pressed);
});
$('board').addEventListener('pointercancel',()=>{pressedScrew=null;tapGate.cancel();suppressClickUntil=performance.now()+700;});
$('board').addEventListener('click',event=>{
  if(phase!=='playing'||modalKind)return;
  if(event.detail===0){const target=event.target.closest('[data-screw]');if(target&&!target.disabled)void commit({type:'screw',id:target.dataset.screw},target);return;}
  if(performance.now()<suppressClickUntil||event.pointerType==='touch')return;
  const pressed=pressedScrew;pressedScrew=null;
  tap(event.clientX,event.clientY,pressed);
});
$('dialog').addEventListener('cancel',event=>{event.preventDefault();if(!['win','jam'].includes(modalKind))resume();});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){tapGate.cancel();touches.clear();sound.pause();if(phase==='playing')showModal('pause');}
});
window.addEventListener('pagehide',()=>{if(phase!=='ready')persist();sound.pause();motion.pause();});
window.addEventListener('pageshow',event=>{if(event.persisted&&phase==='playing')showModal('pause');});

collections.reset(state); board.build(level,state); localize(); setPhase('ready');
telemetry.ready(level.id,preferences.lang);
if(!embedded)window.tapmeloAnalytics?.setAvailable(true);
function reportSize(){window.screwSortEmbedSend?.('resize',{height:Math.ceil($('game').getBoundingClientRect().height)});}
if(embedded){
  function fitEmbeddedGame() {
    const frame = window.frameElement;
    if (!frame) return;
    const parent = window.parent;
    const frameTop = frame.getBoundingClientRect().top + parent.scrollY;
    const viewportHeight = parent.visualViewport?.height || parent.innerHeight;
    const screen = frame.closest('.game-stage-screen');
    const reservedHeight = screen && Number.parseFloat(parent.getComputedStyle(screen).minHeight);
    const availableHeight = parent.document.documentElement.classList.contains('game-is-playing') ? screen.clientHeight : Math.min(reservedHeight || Infinity, viewportHeight - frameTop);
    const wide = parent.matchMedia('(orientation: landscape) and (max-height: 540px) and (min-width: 620px) and (hover: none)').matches;
    document.documentElement.toggleAttribute('data-wide-embed', wide);
    // Leave two pixels for the host's iframe-height adjustment.
    $('game').style.height = `${Math.max(wide ? 280 : 420, Math.min(980, Math.floor(availableHeight - 2)))}px`;
  }
  if (window.frameElement) {
    const parent = window.parent;
    fitEmbeddedGame();
    parent.addEventListener('resize', fitEmbeddedGame);
    parent.visualViewport?.addEventListener('resize', fitEmbeddedGame);
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      parent.removeEventListener('resize', fitEmbeddedGame);
      parent.visualViewport?.removeEventListener('resize', fitEmbeddedGame);
    });
  }
  new ResizeObserver(reportSize).observe($('game'));
  window.addEventListener('message',event=>{if(event.source===window.parent&&event.origin===location.origin&&event.data?.scope==='tapmelo:screw-sort'&&event.data.type==='hello'){window.screwSortEmbedSend('ready');reportSize();telemetry.snapshot();}});
  window.screwSortEmbedSend('ready');reportSize();
}
window.addEventListener('error',()=>window.screwSortEmbedSend?.('load_error',{reason:'runtime_error'}));
if(local&&params.get('qa')==='1')window.glassDebug={snapshot:()=>JSON.parse(JSON.stringify({state,actions,phase,pending,selecting,levelId:level.id,collections:collections.snapshot()})),idle:()=>collectionTail.then(()=>motion.finish())};
