import {language, t, colorName, levelName, localizeDocument} from './i18n.js';
import {Game, packGroups, isPackHidden, LEVEL_COUNT} from './engine.js';
import {View, SOURCE_X} from './view.js';
import {Hopper} from './physics.js';
import {image, storage} from './platform.js';
import {Sound} from './audio.js';
import {Feedback} from './feedback.js';
import {toy} from './toys.js';

const $=id=>document.getElementById(id);
localizeDocument();
let unlocked=Math.max(1,Math.min(LEVEL_COUNT,Number(storage.get('level',1))||1));
let game = new Game(unlocked, {physics:true}), speed = 1, paused = true;
let screen = 'loading', guideStep = 0;
let mysterySeen = storage.get('tutorial-mystery-done', false);
const canVibrate = typeof navigator.vibrate === 'function';
let vibration = storage.get('vibration', true), lastVibration = -Infinity;
let paradeAge = null, offscreen = false;
const sound = new Sound();
let tipTimer,frameId=null,frameTime=null,lastHud='',pendingDialog=null,simulationDebt=0;
const PHYSICS_STEP=1/120;
const FINISH_SPEED=4;
const view=new View($('canvas'));
const feedback = new Feedback($('feedback'), view, $('board'), $('progress'));
const hopper = new Hopper(impact => { view.impact(impact); sound.impact(impact.force); });
const playfield = $('playfield'), progressTrack = $('progress').parentElement;
const canPlay = () => screen === 'game' && !paused && !$('settings').open && !$('guide').open && paradeAge === null;
function vibrate(duration = 14) {
  const now = performance.now();
  if (!canVibrate || !vibration || now - lastVibration < 180) return;
  lastVibration = now;
  try { navigator.vibrate(duration); } catch { /* Some embedded browsers block vibration. */ }
}
const buttons=SOURCE_X.map((x,index)=>{
  const button=document.createElement('button');button.className='source';button.style.left=`${(x-38)/480*100}%`;
  button.addEventListener('click',()=>release(index));
  button.addEventListener('pointerenter',()=>{view.hover=index;requestFrame();});
  button.addEventListener('pointerleave',()=>{view.hover=-1;requestFrame();});
  $('sources').append(button);return button;
});
// WebAudio starts from a user gesture. A background or offscreen game stays quiet.
document.addEventListener('pointerdown', () => sound.unlock(), {passive:true});
document.addEventListener('keydown', () => sound.unlock());

function drawTown() {
  const canvas = $('town'), c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  for (const [y, color] of [[198, '#dce4ae'], [243, '#becf94']]) {
    c.beginPath();
    c.ellipse(360, 381, 460, 381 - y, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  c.beginPath();
  c.ellipse(360, 299, 292, 57, 0, 0, Math.PI * 2);
  c.fillStyle = '#e2bd8d';
  c.fill();
  if (view.paintToy) {
    view.paintToy(c, toy.office + 1, 100, 64, 133, 164);
    view.paintToy(c, toy.tree, 519, 90, 101, 131);
    view.paintToy(c, toy.shuttle + 2, 207, 44, 316, 272);
    view.paintToy(c, toy.employee, 154, 194, 111, 120);
    view.paintToy(c, toy.employee + 1, 464, 197, 104, 115);
    view.paintToy(c, toy.employee + 3, 390, 228, 94, 102);
  } else {
    c.fillStyle = '#d5a85e';
    c.beginPath();
    c.roundRect(247, 150, 226, 113, 24);
    c.fill();
    c.fillStyle = '#fff1d9';
    c.beginPath();
    c.roundRect(266, 166, 188, 55, 16);
    c.fill();
    for (const [x, color] of [[155, 0], [307, 2], [460, 1]]) c.drawImage(view.sprites[color], x, 193, 108, 108);
  }
}

function showHome() {
  screen = 'home';
  paused = true;
  stopFrames();
  clearTimeout(tipTimer);
  pendingDialog = null;
  paradeAge = null;
  $('parade').hidden = true;
  $('parade').replaceChildren();
  sound.resetRound();
  feedback.reset();
  playfield.hidden = playfield.inert = true;
  $('lobby').hidden = false;
  $('unlocked').textContent = t('unlocked', {n:unlocked, count:LEVEL_COUNT});
  $('start').textContent = t('start', {n:unlocked});
  $('start').hidden = false;
  $('loading').hidden = $('loading-label').hidden = true;
  $('help').hidden = true;
}

function prepareHome() {
  drawTown();
  let loaded = 0;
  function track(task, weight) {
    return task.catch(() => {}).finally(() => {
      loaded += weight;
      $('loading').value = Math.min(1, loaded);
    });
  }
  void Promise.all([
    track(view.ready.then(drawTown), .65),
    track(image('assets/fox-avatar-128.png'), .15),
    track(sound.ready, .2)
  ]).then(showHome);
}

function beginParade() {
  const layer = $('parade');
  const count = Math.min(54, Math.max(30, Math.round(innerWidth / 12)));
  for (let i = 0; i < count; i++) {
    const animal = document.createElement('canvas');
    animal.width = animal.height = 84;
    animal.style.setProperty('--lane', (i % 6) * 15 + 5 + i % 3 + '%');
    animal.style.setProperty('--delay', Math.floor(i / 6) * .09 + (i % 6) * .031 + 's');
    const context = animal.getContext('2d');
    const color = i % view.sprites.length;
    if (view.paintToy) view.paintToy(context, toy.employee + color, 4, 3, 76, 79);
    else context.drawImage(view.sprites[color], 0, 0, 84, 84);
    layer.append(animal);
  }
  playfield.inert = true;
  layer.hidden = false;
  paradeAge = 0;
  sound.result(true, 1.8);
}

function showTip(text,duration){
  clearTimeout(tipTimer);
  $('tip').textContent=text;
  if(duration)tipTimer=setTimeout(()=>$('tip').textContent=idleTip(),duration*1000);
}
function tip(text,duration=3){showTip(text,duration);$('announce').textContent=text;}
function idleTip(){
  if(game.finishing)return t('autoFinishing');
  if(game.occupied===game.capacity&&game.canBeltProgress)return t('wait');
  return game.occupied/game.capacity>.75?t('tight'):t('idle');
}
function release(column){
  if(!canPlay())return;
  buttons.forEach(b=>b.classList.remove('hinted'));
  if(game.release(column)){vibrate();tip(t('released'));handleEvents();updateHud();requestFrame();}
}
function updateHud(){
  const key=[game.level.number,game.collected,game.occupied,game.capacity,game.pending.length,game.moves,game.undoLeft,game.expanded,game.status,game.finishing,speed].join(':');
  if(key===lastHud)return;lastHud=key;
  $('speed').textContent=(game.finishing?FINISH_SPEED:speed)+'×';
  $('speed').disabled=game.finishing;
  $('speed').setAttribute('aria-label',game.finishing?t('autoFinishing'):t(speed===1?'speed2':'speed1'));
  $('speed').title=game.finishing?t('autoFinishing'):'';
  if(game.status==='won') showTip(t('allCollected'));
  else if(game.finishing)showTip(t('autoFinishing'));
  $('level').textContent=String(game.level.number).padStart(2,'0');$('level').title=levelName(game.level.number);
  $('collected').textContent=`${game.collected} / ${game.total}`;
  const percent=Math.round(game.collected/game.total*100);$('progress').style.setProperty('--fill',percent/100);document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',percent);
  $('capacity').textContent=`${game.occupied} / ${game.capacity}`;
  $('belt-fill').style.setProperty('--fill',game.occupied/game.capacity);$('belt-meter').classList.toggle('danger',game.occupied/game.capacity>.75);
  if(game.status==='playing'&&game.occupied===game.capacity&&game.canBeltProgress)showTip(t('wait'),.5);
  $('undo').disabled=!game.undoLeft||!game.history.length||game.status==='won';$('undo-count').textContent=game.undoLeft;
  $('expand').disabled=game.expanded||game.status==='won';$('expand-count').textContent=game.expanded?'0':'1';
  buttons.forEach((button,i)=>{const pack=game.columns[i][0];button.disabled=!pack||game.status!=='playing';button.setAttribute('aria-label',!pack?t('columnEmpty',{n:i+1}):t('column',{n:i+1,pack:packGroups(pack).map(({color,count})=>t('pack',{name:colorName(color),count})).join(' + '),count:game.columns[i].length}));});
}
function handleEvents(){
  if(!game.events.length)return false;
  const events=game.drainEvents();
  for (const event of events) {
    if (event.type === 'undo' || event.type === 'expand' || event.type === 'lost') feedback.reset();
    if (event.type === 'box') event.combo = feedback.depart(event);
  }
  hopper.consume(events);
  view.events(events);
  sound.events(events);
  for(const event of events){
    if (event.type === 'box') {
      vibrate();
      if (!view.reduced) {
        progressTrack.classList.remove('progress-pulse');
        void progressTrack.offsetWidth;
        progressTrack.classList.add('progress-pulse');
      }
    }
    if (event.type === 'lost') {
      vibrate(26);
      pendingDialog = {mode:'lost', remaining:.45};
    }
    if (event.type === 'won') {
      vibrate(26);
      unlocked = Math.max(unlocked, Math.min(LEVEL_COUNT, game.level.number + 1));
      storage.set('level', unlocked);
      pendingDialog = {mode:'won', remaining:view.reduced ? .25 : 1.02};
    }
  }
  return true;
}
function start(level) {
  screen = 'game';
  game = new Game(level, {physics:true});
  $('lobby').hidden = true;
  playfield.hidden = playfield.inert = false;
  $('help').hidden = false;
  pendingDialog = null;
  sound.resetRound();
  feedback.reset();
  hopper.reset(game);
  guideStep = level === 1 && !storage.get('tutorial-v2-done', false) ? 1 : 0;
  view.clear({entrance: !guideStep && !view.reduced});
  lastHud = '';
  closeDialog();
  resizeBoard();
  tip(t('levelTip', {name:levelName(game.level.number), colors:game.level.colorCount, capacity:game.capacity}), 5);
  updateHud();
  view.draw(game);
  document.querySelector('.game').dataset.scene = view.theme.id;
  if (guideStep) showGuide(guideStep);
  else $('pause').focus({preventScroll:true});
}

function closeDialog() {
  if ($('dialog').open) $('dialog').close();
  $('dialog').removeAttribute('data-result');
  paused = screen !== 'game';
  simulationDebt = 0;
  frameTime = null;
  requestFrame();
}

const guideCopy = {
  1: ['guideTap', 'guideRelease', 'guideTry'],
  2: ['guideMatch', 'guideBoard', 'guideWatch'],
  3: ['guideNext', 'guideRoom', 'guidePlay'],
  mystery: ['guideMystery', 'guideMysteryCopy', 'guideUnderstood']
};
let guideRegion = null;
function positionGuide() {
  if (!$('guide').open || !guideRegion) return;
  const board = $('board').getBoundingClientRect(), unit = board.width / 480;
  const [x, y, width, height] = guideRegion;
  const top = board.top + y * unit, bottom = top + height * unit;
  Object.assign($('guide-focus').style, {
    left: board.left + x * unit + 'px', top: top + 'px',
    width: width * unit + 'px', height: height * unit + 'px'
  });
  const focus = $('guide-focus');
  for (const [edge, value] of Object.entries({left:board.left + x * unit, right:board.left + (x + width) * unit, top, bottom})) {
    focus.style.setProperty('--focus-' + edge, value + 'px');
  }
  const guide = $('guide'), heightLimit = innerHeight - 12;
  const below = bottom + 14, above = top - guide.offsetHeight - 14;
  const sideLeft = board.left > guide.offsetWidth + 24 ? board.left - guide.offsetWidth - 16
    : innerWidth - board.right > guide.offsetWidth + 24 ? board.right + 16 : null;
  guide.style.left = sideLeft === null ? '50%' : sideLeft + 'px';
  guide.style.translate = sideLeft === null ? '-50% 0' : 'none';
  guide.style.top = (sideLeft !== null ? Math.max(12, (innerHeight - guide.offsetHeight) / 2)
    : Math.max(12, Math.min(heightLimit - guide.offsetHeight,
      below + guide.offsetHeight < heightLimit ? below : above))) + 'px';
}
function showGuide(step, region) {
  const [title, copy, next] = guideCopy[step];
  guideRegion = region ?? (step === 1 ? [34 + game.hint() * 84, 170, 76, 80]
    : step === 2 ? [40, view.sceneY(530), 400, 90] : [40, view.sceneY(615), 400, 81]);
  $('guide-title').textContent = t(title);
  $('guide-copy').textContent = t(copy);
  $('guide-next').textContent = t(next);
  $('guide-skip').hidden = step === 'mystery';
  if (!$('guide').open) $('guide').showModal();
  $('guide-focus').hidden = false;
  stopFrames();
  simulationDebt = 0;
  positionGuide();
  $('guide-next').focus({preventScroll:true});
}
function finishGuide(skip = false) {
  if (guideStep && guideStep < 3 && !skip) {
    showGuide(++guideStep);
    return;
  }
  if (guideStep) {
    guideStep = 0;
    storage.set('tutorial-v2-done', true);
  } else {
    mysterySeen = true;
    storage.set('tutorial-mystery-done', true);
  }
  $('guide').close();
  $('guide-focus').hidden = true;
  buttons.find(button => !button.disabled)?.focus({preventScroll:true});
  requestFrame();
}
function checkMystery() {
  if (mysterySeen || game.level.number === 1 || game.status !== 'playing' || view.intro < .62) return;
  for (const depth of [1, 2]) for (const [column, packs] of game.columns.entries()) {
    const pack = packs[depth], release = view.releases[column];
    if (pack && isPackHidden(pack, depth) && (!release || view.clock - release.start >= .215)) {
      showGuide('mystery', [32 + column * 84, 172 - depth * 70, 80, 82]);
      return;
    }
  }
}
function resizeBoard() {
  if (playfield.hidden) return;
  const width = $('board').clientWidth;
  if (!width) return;
  const short = !document.documentElement.dataset.embed && innerHeight < width * 700 / 480 + 202;
  const boardBudget = short ? innerHeight - 182 : 0;
  const sceneHeight = boardBudget ? Math.max(610, Math.min(700, boardBudget * 480 / width)) : 700;
  $('board').style.aspectRatio = '480 / ' + sceneHeight;
  $('sources').style.setProperty('--source-top', 171.5 / sceneHeight * 100 + '%');
  $('sources').style.setProperty('--source-height', 79.8 / sceneHeight * 100 + '%');
  $('belt-meter').style.top = (sceneHeight - 249) / sceneHeight * 100 + '%';
  const ratio = Math.min(1.5, devicePixelRatio || 1);
  view.resize(Math.round(width * ratio), Math.round(width * sceneHeight / 480 * ratio), sceneHeight);
  positionGuide();
  if (!$('feedback').hidden) feedback.draw(0);
}
new ResizeObserver(resizeBoard).observe(playfield);
window.addEventListener('resize', resizeBoard);
window.addEventListener('scroll', positionGuide, {passive:true});

function action(label,handler,primary=false){const button=document.createElement('button');button.type='button';button.textContent=label;if(primary)button.className='primary';button.addEventListener('click',handler);$('dialog-actions').append(button);}
function openDialog(mode){
  pendingDialog=null;paused=true;simulationDebt=0;stopFrames();$('dialog-actions').replaceChildren();
  let title,copy,eyebrow,icon;
  const finalLevel=mode==='won'&&game.level.number===LEVEL_COUNT;
  $('dialog').dataset.result=mode==='won'?(finalLevel?'complete':'won'):mode==='lost'?'lost':'';
  if(mode==='won'){
    title=finalLevel?t('complete'):t('won');copy=finalLevel?t('completeCopy',{count:LEVEL_COUNT}):t('wonCopy',{n:game.level.number});eyebrow=finalLevel?t('completeBrow'):t('wonBrow');icon='trophy';
    if(!finalLevel)action(t('next'),()=>start(game.level.number+1),true);
    else action(t('playAgain'),()=>start(1),true);
  }else if(mode==='lost'){
    title=t('lost');copy=game.expanded?t('lostExpanded'):t('lostCopy');eyebrow=t('lostBrow');icon='expand';
    if(!game.expanded)action(t('recover'),()=>{game.expand();closeDialog();handleEvents();updateHud();tip(t('expanded'));},true);
    action(t('retry'),()=>start(game.level.number),game.expanded);
  }else if(mode==='help'){
    title=t('helpTitle');copy=t('helpCopy');eyebrow=t('help');icon='hint';action(t('gotIt'),closeDialog,true);
  }else{
    title=t('pauseTitle');copy=t('pauseCopy');eyebrow=t('pauseBrow');icon='pause';action(t('resume'),closeDialog,true);action(t('restart'),()=>start(game.level.number));action(t('help'),()=>openDialog('help'));
    action(t('returnHome'),()=>{ closeDialog(); showHome(); $('start').focus(); });
  }
  $('dialog-title').textContent=title;$('dialog-copy').textContent=copy;$('dialog-eyebrow').textContent=eyebrow;$('dialog-symbol').innerHTML=`<svg><use href="#i-${icon}"/></svg>`;
  const result = mode === 'won' || mode === 'lost';
  $('dialog-symbol').replaceChildren();
  if (result) {
    const portrait = document.createElement('img');
    portrait.src = 'assets/fox-avatar-128.png';
    portrait.alt = '';
    $('dialog-symbol').append(portrait);
    if (mode === 'lost') sound.result(false, 0);
    else if (view.reduced) sound.result(true, 0);
  } else {
    $('dialog-symbol').innerHTML = '<svg aria-hidden="true"><use href="#i-' + icon + '"/></svg>';
    sound.stopEffects();
  }
  if (!$('dialog').open) $('dialog').showModal();
  ($('dialog-actions button') ?? $('dialog-title')).focus();
}
function openSettings() {
  if (screen === 'loading') return;
  $('effects-setting').checked = sound.enabled;
  $('music-setting').checked = sound.musicEnabled;
  $('vibration-row').hidden = !canVibrate;
  $('vibration-setting').checked = vibration;
  sound.stopEffects();
  stopFrames();
  simulationDebt = 0;
  $('settings').showModal();
}
$('home-settings').addEventListener('click', openSettings);
$('ingame-settings').addEventListener('click', openSettings);
$('effects-setting').addEventListener('change', () => sound.toggle());
$('music-setting').addEventListener('change', () => sound.toggleMusic());
$('vibration-setting').addEventListener('change', () => {
  vibration = $('vibration-setting').checked;
  storage.set('vibration', vibration);
  if (vibration) vibrate();
});
$('settings').addEventListener('close', requestFrame);
$('start').addEventListener('click', () => { sound.unlock(); start(unlocked); });
$('guide-next').addEventListener('click', () => finishGuide());
$('guide-skip').addEventListener('click', () => finishGuide(true));
$('guide').addEventListener('cancel', event => { event.preventDefault(); finishGuide(true); });
$('pause').addEventListener('click',()=>openDialog(game.status==='playing'?'pause':game.status));
$('help').addEventListener('click',()=>openDialog(game.status==='playing'?'help':game.status));
$('speed').addEventListener('click',()=>{if(game.finishing)return;speed=speed===1?2:1;updateHud();tip(speed===2?t('faster'):t('slower'));});
$('undo').addEventListener('click',()=>{if(game.undo()){pendingDialog=null;simulationDebt=0;hopper.reset(game);view.clear();handleEvents();updateHud();tip(t('undone'));requestFrame();}});
$('expand').addEventListener('click',()=>{if(game.expand()){pendingDialog=null;handleEvents();updateHud();tip(t('expanded'));requestFrame();}});
$('dialog').addEventListener('cancel',event=>{event.preventDefault();if(game.status==='playing')closeDialog();});
document.addEventListener('keydown',event=>{
  if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
  if(!canPlay()||game.status!=='playing')return;
  if(event.code==='Space'&&event.target===document.body){event.preventDefault();openDialog('pause');}
  if(/^[1-5]$/.test(event.key)){event.preventDefault();release(Number(event.key)-1);}
});
function pauseAway() {
  stopFrames();
  sound.suspend();
  if (canPlay() && game.status === 'playing') openDialog('pause');
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAway();
  else if (!offscreen) { sound.resume(); requestFrame(); }
});
function requestFrame() {
  if (frameId === null && !offscreen && screen === 'game' && !paused && !$('settings').open && !$('guide').open && !document.hidden) {
    frameId = requestAnimationFrame(frame);
  }
}
function stopFrames(){
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;frameTime=null;
}
function needsSimulation(){
  return game.status==='playing'&&(game.pending.length||game.occupied||game.boxes.some(box=>box?.filled===3));
}
function frame(now){
  frameId=null;
  if(paused||document.hidden||$('settings').open||$('guide').open)return;
  const elapsed=frameTime===null?0:now-frameTime;
  // Use the RAF clock so skipped paints do not slow simulation. The small
  // tolerance accommodates both display jitter and 16 ms animation clocks.
  if(frameTime!==null&&elapsed<1000/60-1.5){requestFrame();return;}
  const dt=Math.min(elapsed/1000,.05);frameTime=now;
  if (paradeAge !== null) {
    paradeAge += dt;
    if (paradeAge >= 1.8) {
      paradeAge = null;
      $('parade').hidden = true;
      $('parade').replaceChildren();
      playfield.inert = false;
      openDialog('won');
    } else requestFrame();
    return;
  }
  const playbackSpeed=Math.max(speed,game.finishing?FINISH_SPEED:1);
  if(needsSimulation()){
    // Carry fractional time into the next frame. Never feed the rigid-body
    // solver a tiny remainder step between normal 120 Hz updates.
    simulationDebt+=dt*playbackSpeed;
    let hudChanged=false;
    while(simulationDebt>=PHYSICS_STEP&&game.status==='playing'){
      hopper.step(game,PHYSICS_STEP);game.tick(PHYSICS_STEP);
      if(handleEvents())hudChanged=true;
      simulationDebt-=PHYSICS_STEP;
    }
    if(hudChanged)updateHud();
  }else simulationDebt=0;
  view.draw(game,dt*playbackSpeed,game.status==='playing'?simulationDebt/PHYSICS_STEP:1, game.status === 'playing' ? dt : 0);
  feedback.draw(dt);
  checkMystery();
  if(pendingDialog){
    pendingDialog.remaining-=dt;
    if(pendingDialog.remaining<=0) {
      const {mode} = pendingDialog;
      pendingDialog = null;
      if (mode === 'won' && !view.reduced) beginParade();
      else openDialog(mode);
    }
  }
  if(pendingDialog||paradeAge !== null||feedback.active||view.animating||needsSimulation())requestFrame();
  else frameTime=null;
}
// Read-only diagnostics are available only on a loopback preview.
if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)) Object.defineProperty(window,'marbleDebug',{value:Object.freeze({snapshot:()=>({...game.snapshot(),screen,guide:$('guide').open,combo:feedback.count,theme:view.theme.id,total:game.total,remaining:game.remaining,occupied:game.occupied,paused,speed:Math.max(speed,game.finishing?FINISH_SPEED:1),finishing:game.finishing,undoLeft:game.undoLeft,expanded:game.expanded}),solution:()=>[...game.level.solution]})});
prepareHome();

// Notify only the same-origin website; the parent checks source, origin and size.
if (new URLSearchParams(location.search).get('embed') === '1' && parent !== window) {
  parent.postMessage({type:'tapmelo-marble-ready'}, location.origin);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || !['tapmelo-marble-pause','tapmelo-marble-visible'].includes(event.data?.type)) return;
    offscreen = event.data.type === 'tapmelo-marble-pause';
    if (offscreen) pauseAway();
    else if (!document.hidden) { sound.resume(); requestFrame(); }
  });
}
