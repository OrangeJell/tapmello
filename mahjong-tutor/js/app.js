import { L, languages, normalizeLanguage, translate } from './i18n.js';
import { tileMarkup, tileName, tileBack, escapeHTML } from './tiles.js';
import { levels, findQuestion, legacyTarget } from './curriculum.js';
import { patterns, articles } from './catalog.js';
import { loadProgress, saveProgress, cleanProgress, LEGACY_KEY } from './storage.js';
import { analyzePatterns, winningTilesFor, createPractice, ROUND_DISCARDS } from './rules.js';
import { checkAnswer, sameSet, guidedState } from './tutorial.js';

let storage;try{storage=window.localStorage;}catch{storage=null;}
const loaded=loadProgress(storage);
const params=new URLSearchParams(location.search),embedded=params.get('embed')==='1',onSite=params.get('site')==='1';
const pageLanguage=params.get('lang');if(Object.hasOwn(languages,pageLanguage)){loaded.data.lang=pageLanguage;saveProgress(storage,loaded.data);}
let progress=loaded.data,storageOK=loaded.available;
const app=document.querySelector('#app'),dialog=document.querySelector('#dialog');
let view='home',level=levels[0],q=level.questions[0],selected=[],feedback=null,practice=null,article=null;
let modalStack=[],lastTrigger=null,returnTo='#home';
const t=v=>typeof v==='string'?v:v?.[progress.lang]??v?.en??'';
const tr=(_legacy,en)=>translate(en,progress.lang);
const esc=escapeHTML;
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const gear='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 3-.7 2.4-2.2 1L3.7 6l-2 3.5 1.7 1.9v2.2l-1.7 1.9 2 3.5 2.4-.4 2.2 1L9 22h4l.7-2.4 2.2-1 2.4.4 2-3.5-1.7-1.9v-2.2l1.7-1.9-2-3.5-2.4.4-2.2-1L13 3Z"/><circle cx="11" cy="12.5" r="3"/></svg>';
const b=(action,label,cls='',attrs='')=>`<button type="button" data-action="${action}" class="btn ${cls}" ${attrs}>${label}</button>`;
const tile=(id,opts={})=>tileMarkup(id,{lang:progress.lang,labels:progress.labels,...opts});
const groupRows=(groups,cls='')=>`<div class="group-rows ${cls}">${groups.map(g=>`<div class="tile-group">${g.map(id=>tile(id,{labels:false})).join('')}</div>`).join('')}</div>`;
const short=text=>t(text).split(/(?<=[.!?।])\s/)[0];
const countDone=l=>l.questions.filter(x=>progress.completed.includes(x.id)).length;
function save(){storageOK=saveProgress(storage,progress);}
function newSelection(){selected=[];feedback=null;}
function markComplete(id){if(!progress.completed.includes(id))progress.completed.push(id);save();}
function currentPatterns(){return q.patterns||[];}
function needsIntro(){return view==='learn'&&q.kind!=='round'&&(q.patterns||[]).some(id=>!progress.seen.includes(id));}
function header(){
  const playing=['learn','practice'].includes(view);
  return `<header class="app-header ${playing?'compact':''}">${playing?`<a href="#home" class="back-link">← <span>${tr('返回','Back')}</span></a><span class="header-title">${view==='practice'?tr('听牌练习','Waiting hands'):t(level.title)}</span>`:`<a href="#home" class="brand"><img src="assets/icon.svg" width="32" height="32" alt="">${tr('麻将入门','Mahjong basics')}</a>`}${onSite&&!embedded?`<a class="back-link site-back" href="${sitePrefix()+'/'}">${tr('','Back to games')}</a>`:''}${b('settings',`${gear}<span>${tr('设置','Settings')}</span>`,'settings-button')}</header>`;
}
function home(){
  return `<main id="main" class="home" tabindex="-1"><div class="home-heading"><div><h1>${tr('从认牌，到会打。','Learn Mahjong')}</h1></div><a href="#articles" class="text-link">${tr('图文教程','Read the guides')} ↗</a></div><div class="level-grid">${levels.map((l,i)=>`<button type="button" class="level-card" data-action="open-level" data-id="${l.id}"><div class="level-meta"><span>0${i+1}</span><span>${countDone(l)} / ${l.questions.length}</span></div><div class="level-art">${l.art.map(id=>tile(id,{labels:false})).join('')}</div><h2>${t(l.title)}</h2><p>${t(l.summary)}</p><div class="level-bottom"><span>${countDone(l)===l.questions.length?tr('复习','Review'):countDone(l)>0?tr('继续学习','Continue'):tr('开始学习','Start learning')}</span>${arrow}</div></button>`).join('')}</div><div class="home-extras"><a href="#articles" class="practice-entry"><h2>${tr('不懂的地方，翻一翻','Read at your own pace')}</h2><p>${tr('七篇入门文章，配着牌慢慢看','Seven illustrated guides for beginners')}</p>${arrow}</a><a href="#practice" class="practice-entry"><h2>${tr('找出下一张','Practise waiting hands')}</h2><p>${tr('随机听牌练习','Find every tile that completes the hand.')}</p>${arrow}</a></div><div class="home-footer"><span>${storageOK?tr('进度保存在此浏览器','Progress saved in this browser'):tr('存储不可用，本次仍可玩','Storage unavailable; this session still works')}</span><span>${tr('不计番','No scoring')}</span></div></main>`;
}
function handMarkup(hand,action='',selectedIndices=selected,drawnIndex=-1){
  return `<div class="hand-grid">${hand.map((id,i)=>tile(id,{action,index:i,selected:!!action&&selectedIndices.includes(i),disabled:!!feedback?.ok,extra:drawnIndex===i?'drawn':''})).join('')}</div>`;
}
function patternBlock(id,{counter=true,articleMode=false}={}){
  const p=patterns[id];if(!p)return '';
  return `<section class="pattern-block" data-pattern="${id}"><h${articleMode?'2':'3'}>${t(p.title)}</h${articleMode?'2':'3'}><p>${t(p.rule)}</p>${groupRows(p.groups)}${counter?`<div class="counterexample"><span>${tr('容易混淆','Watch out')}</span><p>${t(p.counter)}</p>${groupRows(p.counterGroups,'counter-tiles')}</div>`:''}</section>`;
}
function boardFrame(title,meta,stage,controls,cls=''){
  return `<main id="main" class="play-main" tabindex="-1"><section class="board ${cls}" data-question="${['learn','practice'].includes(view)?q.id:''}"><div class="board-head"><div class="board-meta">${meta}</div><h1 tabindex="-1">${title}</h1></div><div class="board-stage">${stage}</div>${controls}</section></main>`;
}
function feedbackLine(){
  return feedback?`<div class="feedback ${feedback.ok?'correct':'wrong'}" role="status" aria-live="polite"><span aria-hidden="true">${feedback.ok?'✓':'↻'}</span><p>${short(feedback.message)}</p>${b('explain',tr('详解','Why?'),'text-button')}</div>`:'';
}
function controls(primary,extras=''){
  return `<div class="board-bottom">${feedbackLine()}<div class="board-controls"><div class="help-actions">${extras}</div>${primary}</div></div>`;
}
function intro(){
  const ids=q.patterns.filter(id=>!progress.seen.includes(id));
  const content=ids.map(id=>patternBlock(id,{counter:false})).join('');
  return boardFrame(tr('先看一个牌型','Meet this pattern'),`${tr('牌型小课','PATTERN NOTE')} · ${t(level.title)}`,`<div class="intro-content">${content}</div>`,controls(b('begin-question',`${tr('开始练习','Try it')} ${arrow}`,'primary'),b('patterns',tr('完整说明','Full explanation'),'text-button')),'intro-board');
}
function questionContent(question){
  let html='';
  if(question.groups)html+=groupRows(question.groups);
  if(question.display)html+=`<div class="scenario-tiles"><div><span class="table-caption">${tr('手中的牌','Tiles you hold')}</span><div class="tile-row">${question.display.map(id=>tile(id)).join('')}</div></div>${question.incoming!==undefined?`<div class="incoming"><span class="table-caption">${t(question.source)}</span>${tile(question.incoming)}</div>`:''}</div>`;
  if(question.hand)html+=`<div class="hand-section"><span class="table-caption">${tr('手牌','Your hand')} · ${question.hand.length}</span>${handMarkup(question.hand)}</div>`;
  if(question.kind==='group')html+=`<div class="group-options">${question.options.map((g,i)=>`<button class="group-option ${selected.includes(i)?'selected':''}" data-action="select" data-index="${i}" aria-pressed="${selected.includes(i)}" aria-label="${esc(g.map(id=>tileName(id,progress.lang)).join(', '))}" ${feedback?.ok?'disabled':''}>${groupRows([g])}<span>${String.fromCharCode(65+i)}${selected.includes(i)?' ✓':''}</span></button>`).join('')}</div>`;
  if(['tile','build','wait'].includes(question.kind))html+=`<div class="tile-options" aria-label="${tr('选择区','Choose tiles')}">${question.options.map((id,i)=>tile(id,{action:'select',index:i,selected:selected.includes(i),disabled:!!feedback?.ok})).join('')}</div>`;
  if(question.kind==='choice')html+=`<div class="text-options">${question.options.map((o,i)=>`<button class="text-option ${selected.includes(i)?'selected':''}" data-action="select" data-index="${i}" aria-pressed="${selected.includes(i)}" ${feedback?.ok?'disabled':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${t(o)}</span>${selected.includes(i)?'<span class="tick">✓</span>':''}</button>`).join('')}</div>`;
  if(question.kind==='wait'&&feedback?.ok)html+=`<div class="solutions">${question.answers.map(id=>{const result=analyzePatterns([...question.hand,id],[],question.profile||'basic');return `<details><summary>${tileName(id,progress.lang)} · ${tr('查看拆牌','See the sets')}</summary>${groupRows(result.structures[0].groups)}</details>`;}).join('')}</div>`;
  return html;
}
function exercise(){
  if(needsIntro())return intro();
  const multi=q.multi||['build','wait'].includes(q.kind),ready=selected.length>0&&(q.kind!=='build'||selected.length===q.size);
  const index=level.questions.findIndex(x=>x.id===q.id);
  const meta=view==='practice'?tr('随机手牌 · 基本规则','RANDOM HAND · BASIC RULES'):`${t(level.title)} <span>${index+1} / ${level.questions.length}</span>`;
  const primary=feedback?.ok?b(view==='practice'?'new-practice':'next',`${tr(view==='practice'?'换一手':'下一题',view==='practice'?'Another hand':'Next')} ${arrow}`,'primary'):b('check',`${tr('确认','Check')}${multi?` · ${selected.length}${q.size?'/'+q.size:''}`:''}`,'primary',ready?'':'disabled');
  return boardFrame(t(q.prompt),meta,questionContent(q),controls(primary,b('hint',tr('提示','Hint'),'text-button')+b('patterns',tr('牌型说明','Patterns'),'text-button')));
}
const roundPrompts=[L('轮到你了，摸一张。','Your turn. Draw a tile.'),L('三万来了，打出单张西风。','3 characters arrives. Discard West.'),L('手牌回到 13 张，再摸一张。','Back to 13 tiles. Draw again.'),L('三条来了，打出单张南风。','3 bamboo arrives. Discard South.'),L('听牌了，选出全部听口。','You are ready. Select every winning tile.'),L('等三万或六万，再摸一张。','Waiting for 3 or 6 characters. Draw once more.'),L('六万来了，可以自摸胡牌。','6 characters arrives. Declare a self-drawn win.')];
function round(){
  const s=guidedState(progress.roundStep),discard=[1,3].includes(s.phase);
  const action=s.phase===4?(feedback?.ok?'round-next':'round-check'):s.phase===6?'round-win':discard?'round-discard':'round-draw';
  const label=s.phase===4?tr(feedback?.ok?'继续':'确认',feedback?.ok?'Continue':'Check'):s.phase===6?tr('胡牌','Win'):discard?tr('出牌','Discard'):tr('摸牌','Draw');
  const content=`<div class="round-context"><div><span class="table-caption">${tr('弃牌','Discards')}</span><div class="tile-row small-tiles">${s.river.map(id=>tile(id,{labels:false})).join('')||'<span class="empty">—</span>'}</div></div><div><span class="table-caption">${s.drawn!==null?tr('刚摸到','Just drawn'):tr('教学牌墙','Practice wall')}</span>${s.drawn!==null?tile(s.drawn):tileBack()}</div></div><div class="hand-section"><span class="table-caption">${tr('你的手牌','Your hand')} · ${s.hand.length}</span>${handMarkup(s.hand,discard?'select':'',selected,s.drawn!==null?s.hand.length-1:-1)}</div>${s.phase===4?`<div class="tile-options round-waits">${[2,5,6,8].map((id,i)=>tile(id,{action:'select',index:i,selected:selected.includes(i),disabled:!!feedback?.ok})).join('')}</div>`:''}`;
  return boardFrame(t(roundPrompts[s.phase]),`${tr('高级 · 引导局','ADVANCED · GUIDED HAND')} <span>${s.phase+1} / 7</span>`,content,controls(b(action,`${label} ${arrow}`,'primary',((discard||(s.phase===4&&!feedback?.ok))&&!selected.length)?'disabled':''),b('hint',tr('提示','Hint'),'text-button')+b('patterns',tr('牌型说明','Patterns'),'text-button')),'round-board');
}
function completion(){
  const complete=countDone(level)===level.questions.length;
  const next=level.questions.find(x=>!progress.completed.includes(x.id));
  return `<main id="main" class="completion" tabindex="-1"><span class="completion-mark">✓</span><span class="eyebrow">${t(level.title)} · ${countDone(level)} / ${level.questions.length}</span><h1>${complete?tr('这一阶段，学会了。','Another level of confidence.'):tr('这道练习完成了。','Exercise complete.')}</h1><p>${tr('再练几手听牌，或打开文章看看刚才用到的规则。','Try more waiting hands, or read about the rules you just used.')}</p>${q.kind==='round'?groupRows(analyzePatterns(guidedState(6).hand,[],'basic').structures[0].groups):groupRows([level.art])}<div class="completion-actions">${next?b('open-question',tr('继续未完成的练习','Continue remaining exercises'),'primary',`data-id="${next.id}"`):b('home',tr('返回课程','Back to lessons'),'primary')}<a class="btn outline" href="#practice">${tr('练习找听口','Practise waiting hands')}</a></div></main>`;
}
function articleIndex(){return `<main id="main" class="reading" tabindex="-1"><a href="#home" class="back-link">← ${tr('返回','Back')}</a><h1>${tr('图文教程','Mahjong guides')}</h1><p class="reading-lead">${tr('从牌面到牌型，随时查阅。','From tiles to patterns, at your own pace.')}</p><div class="article-list">${articles.map((a,i)=>`<a href="#article/${a.id}"><span>0${i+1}</span><div><h2>${t(a.title)}</h2><p>${t(a.lead)}</p></div>${arrow}</a>`).join('')}</div></main>`;}
function articleSection(section,index){
  const paragraphs=section.paragraphs||[section.text];
  const shared=section.pattern?patterns[section.pattern]:null;
  return `<section class="reading-section" id="article-section-${index}"><h2 tabindex="-1">${t(section.title)}</h2>${paragraphs.filter(Boolean).map(p=>`<p>${t(p)}</p>`).join('')}${shared?`<div class="article-example" data-pattern="${shared.id}"><p class="pattern-rule">${t(shared.rule)}</p>${groupRows(shared.groups)}<div class="counterexample"><span>${tr('对照看看','Compare these')}</span><p>${t(shared.counter)}</p>${groupRows(shared.counterGroups,'counter-tiles')}</div></div>`:section.groups?`<div class="article-example">${groupRows(section.groups)}${section.note?`<p>${t(section.note)}</p>`:''}</div>`:''}</section>`;
}
function articleView(){
  const sections=article.sections||[];
  return `<main id="main" class="reading article" tabindex="-1"><a href="${esc(returnTo)}" class="back-link">← ${tr('返回','Back')}</a><span class="eyebrow">${tr('麻将图文教程','MAHJONG GUIDE')}</span><h1>${t(article.title)}</h1><p class="reading-lead">${t(article.lead)}</p>${article.paragraphs.map(p=>`<p>${t(p)}</p>`).join('')}${sections.length?`<nav class="article-contents" aria-label="${tr('本文目录','On this page')}"><span>${tr('想先看哪一段？','Jump to a section')}</span>${sections.map((s,i)=>`<button type="button" data-action="article-section" data-index="${i}">${t(s.title)}</button>`).join('')}</nav>`:''}${sections.map(articleSection).join('')}${article.patterns.map(id=>patternBlock(id,{articleMode:true})).join('')}<div class="article-bottom"><a href="#learn/${article.level}" class="btn primary">${tr('去练一练','Practise this')} ${arrow}</a><a href="#articles">${tr('全部文章','All guides')}</a></div></main>`;
}
function render(focus=false){
  const active=document.activeElement,action=active?.dataset?.action,index=active?.dataset?.index,id=active?.dataset?.id;
  const scroll=scrollY;
  document.documentElement.lang=progress.lang;
  document.body.classList.toggle('embedded',embedded);
  document.title=tr('麻将入门','Mahjong basics')+' · '+(view==='learn'?t(level.title):tr('学与玩','Learn & play'));
  app.innerHTML=`<div class="shell ${['learn','practice'].includes(view)?'playing':''}">${header()}${view==='home'?home():view==='learn'?(q.kind==='round'?round():exercise()):view==='practice'?exercise():view==='complete'?completion():view==='articles'?articleIndex():view==='article'?articleView():home()}</div>`;
  reportSize();
  if(focus){const target=app.querySelector('main h1')||app.querySelector('main');target.tabIndex=-1;target.focus({preventScroll:true});window.scrollTo(0,0);}
  else if(action){const target=[...app.querySelectorAll('[data-action]')].find(el=>el.dataset.action===action&&el.dataset.index===index&&el.dataset.id===id&&!el.disabled);(target||app.querySelector('.board-controls .primary:not(:disabled)'))?.focus({preventScroll:true});window.scrollTo(0,scroll);}
}
function goto(hash) {
  if (location.hash === hash) route();
  else if (embedded && onSite) location.replace(hash);
  else location.hash = hash;
}
function openLevel(id){const l=levels.find(x=>x.id===id);if(!l)return;const target=progress.positions[id]||l.questions.find(x=>!progress.completed.includes(x.id))?.id||l.questions[0].id;goto(`#learn/${id}/${target}`);}
function setPractice(){practice=createPractice();q={...practice,id:'practice',kind:'wait',profile:'basic',patterns:['standard'],article:'winning',prompt:L('选出所有能胡的牌。','Select every tile that completes this hand.'),hint:L('先找已有组合，再看未完成的牌。','Find completed groups, then inspect the unfinished tiles.'),explain:L('每张选中的牌，都能单独补齐基本胡牌。','Each selected tile independently completes the standard shape.'),wrong:L('有听口没选到，或多选了牌，再检查一下。','A winning tile is missing, or an extra tile is selected.')};}
function route(){
  newSelection();
  const hash=location.hash||'#home';let match;
  if(onSite&&hash==='#articles'){openSiteArticles();return;}
  if(onSite&&/^#article\/[a-z-]+$/.test(hash)){openSiteArticle(hash.slice(9));return;}
  if((match=hash.match(/^#lesson\/([1-6])$/))){
    let old;try{old=JSON.parse(storage.getItem(LEGACY_KEY)||'null');}catch{}
    const target=legacyTarget(Number(match[1])-1,old?.records?.[Number(match[1])-1]?.step||0);
    history.replaceState(null,'',`#learn/${target.level}/${target.question}`);route();return;
  }
  if((match=hash.match(/^#learn\/(beginner|intermediate|advanced)(?:\/([a-z0-9-]+))?$/))){
    level=levels.find(x=>x.id===match[1]);q=level.questions.find(x=>x.id===match[2])||level.questions.find(x=>x.id===progress.positions[level.id])||level.questions.find(x=>!progress.completed.includes(x.id))||level.questions[0];
    view='learn';progress.active=level.id;progress.positions[level.id]=q.id;save();history.replaceState(null,'',`#learn/${level.id}/${q.id}`);
  }else if(hash==='#practice'){view='practice';setPractice();}
  else if(hash==='#articles'){view='articles';returnTo='#articles';}
  else if((match=hash.match(/^#article\/([a-z-]+)$/))&&articles.some(a=>a.id===match[1])){view='article';article=articles.find(a=>a.id===match[1]);}
  else if(/^#battle(?:\/.*)?$/.test(hash)){view='home';history.replaceState(null,'','#home');}
  else view='home';
  render(true);
}
function nextQuestion(){
  const index=level.questions.findIndex(x=>x.id===q.id);
  if(index+1<level.questions.length)goto(`#learn/${level.id}/${level.questions[index+1].id}`);
  else{view='complete';newSelection();render(true);}
}
function handleSelect(index){
  if(feedback?.ok)return;
  let multi;
  if(q.kind==='round')multi=progress.roundStep===4;else multi=q.multi||['build','wait'].includes(q.kind);
  if(multi){if(selected.includes(index))selected=selected.filter(i=>i!==index);else{if(q.size&&selected.length===q.size)selected.shift();selected.push(index);}}
  else selected=selected[0]===index?[]:[index];
  feedback=null;render();
}
function handleRound(action){
  const s=guidedState(progress.roundStep),advance=()=>{progress.roundStep++;save();newSelection();render(true);};
  if(action==='round-draw'&&[0,2,5].includes(s.phase))advance();
  else if(action==='round-discard'&&[1,3].includes(s.phase)&&selected.length===1){
    if(s.hand[selected[0]]===ROUND_DISCARDS[s.phase===1?0:1])advance();
    else{feedback={ok:false,message:L('请按本练习指定的牌出牌，保留现有组合。','Discard the tile requested in this exercise; keep the existing groups.')};render();}
  }else if(action==='round-check'&&s.phase===4&&selected.length){
    const ok=sameSet(selected.map(i=>[2,5,6,8][i]),winningTilesFor(s.hand,[],'basic'));
    feedback={ok,message:ok?L('三万和六万都能胡。','Both 3 and 6 characters win.'):L('四五万两面等三万、六万，两张都要选。','4–5 characters waits for both 3 and 6. Select both.')};render();
  }else if(action==='round-next'&&s.phase===4&&feedback?.ok)advance();
  else if(action==='round-win'&&s.phase===6&&analyzePatterns(s.hand,[],'basic')){markComplete(q.id);progress.roundStep=0;save();view='complete';newSelection();render(true);}
}
function settingsBody(){return `<div class="settings-row"><span>${tr('语言','Language')}</span><div>${Object.entries(languages).map(([code,name])=>b('set-language',name,'setting-choice',`lang="${code}" data-id="${code}" aria-pressed="${progress.lang===code}"`)).join('')}</div></div><div class="settings-row"><span>${tr('显示牌名','Tile names')}</span>${b('toggle-labels',progress.labels?tr('开','On'):tr('关','Off'),'setting-choice',`aria-pressed="${progress.labels}"`)}</div>${b('reference',tr('查看牌谱','Tile reference'),'menu-row')}${b('rules',tr('本版规则','Rules used here'),'menu-row')}${b('articles',tr('图文教程','Read the guides'),'menu-row')}${b('reset',tr('重置学习记录','Reset learning progress'),'menu-row danger-text')}<p class="storage-note">${storageOK?tr('进度保存在此浏览器','Progress saved in this browser'):tr('存储不可用，离开页面后可能丢失进度','Storage is unavailable; progress may be lost on leaving the page')}</p>`;}
function referenceBody(){return [[0,9,L('万子','Characters')],[9,18,L('筒子','Dots')],[18,27,L('条子','Bamboo')],[27,34,L('字牌','Honors')]].map(([start,end,title])=>`<section class="reference-suit"><h3>${t(title)}</h3><div class="reference-grid">${Array.from({length:end-start},(_,i)=>tile(start+i,{action:'inspect',index:start+i,labels:true})).join('')}</div></section>`).join('')+`<p class="tile-inspection" role="status">${tr('点牌查看完整名称','Tap a tile for its full name')}</p>`;}
function rulesBody(){return `<div class="modal-prose"><p>${tr('34 种牌，每种四张，共 136 张；没有花牌，不计番。','34 tile types, four copies each: 136 tiles, no flowers or scoring.')}</p><p>${tr('初中级和随机听牌练习只按四面子一对将判定；高级增加七对、十三幺，并识别碰碰胡、清一色、混一色。','Beginner, intermediate and random waiting exercises use four sets plus a pair. Advanced exercises add seven pairs and thirteen orphans, with triplet and flush classifications.')}</p><p>${tr('七对需七种不同对子，不把四张相同牌算两对。七对与十三幺都必须门清。地方规则可能不同。','Seven pairs needs seven distinct pairs; four identical tiles are not two pairs. Seven pairs and thirteen orphans must be closed. Regional rules vary.')}</p><p>${tr('吃碰杠在课程题目中练习；引导局使用固定牌序，帮助熟悉摸牌、打牌和胡牌。','Claims are practised in lesson exercises. The guided hand uses a fixed sequence to teach drawing, discarding and winning.')}</p></div>`;}
function modalContent(entry){
  let title='',content='';
  if(entry.kind==='settings'){title=tr('设置','Settings');content=settingsBody();}
  if(entry.kind==='reference'){title=tr('麻将牌谱','Tile reference');content=referenceBody();}
  if(entry.kind==='rules'){title=tr('本版规则','Rules used here');content=rulesBody();}
  if(entry.kind==='reset'){title=tr('清除学习进度？','Reset learning progress?');content=`<p>${tr('语言与牌名设置会保留。','Language and tile-name preferences will stay.')}</p><div class="modal-actions">${b('close-modal',tr('取消','Cancel'),'outline')}${b('confirm-reset',tr('清除进度','Clear progress'),'danger')}</div>`;}
  if(entry.kind==='hint'){title=tr('一点提示','A little hint');content=`<p class="modal-prose">${q.kind==='round'?t(roundPrompts[progress.roundStep]):t(q.hint)}</p>`;}
  if(entry.kind==='explain'){title=tr('为什么？','Why?');content=`<p class="modal-prose">${t(feedback?.message)}</p>`+(q.patterns||[]).map(id=>patternBlock(id,{counter:false})).join('');}
  if(entry.kind==='patterns'){
    title=tr('牌型说明','Pattern guide');
    content=currentPatterns().length?currentPatterns().map(id=>patternBlock(id)).join(''):referenceBody();
    content+=b('related-article',tr('阅读相关文章','Read the related article'),'primary');
  }
  return `<div class="modal-head"><h2 id="dialog-title">${title}</h2>${b('close-modal',modalStack.length>1?tr('返回','Back'):tr('关闭','Close'),'text-button')}</div><div class="modal-body">${content}</div>`;
}
function refreshModal(){dialog.innerHTML=modalContent(modalStack.at(-1));}
function openModal(kind){
  if(!dialog.open)lastTrigger=document.activeElement;
  modalStack.push({kind});refreshModal();if(!dialog.open)dialog.showModal();reportSize();
  dialog.querySelector('[data-action="close-modal"]')?.focus();
}
function closeModal(all=false){
  if(!all&&modalStack.length>1){modalStack.pop();refreshModal();dialog.querySelector('[data-action="close-modal"]')?.focus();}
  else{modalStack=[];dialog.close();}
}
function handle(event){
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
  const action=el.dataset.action,index=Number(el.dataset.index),id=el.dataset.id;
  if(action==='article-section'){const heading=document.querySelector(`#article-section-${index} h2`);if(heading){heading.scrollIntoView({block:'start'});heading.focus({preventScroll:true});}}
  else if(action==='home')goto('#home');
  else if(action==='open-level')openLevel(id);
  else if(action==='open-question'){const found=findQuestion(id);if(found)goto(`#learn/${found.level.id}/${id}`);}
  else if(['settings','reference','rules','reset','hint','patterns','explain'].includes(action))openModal(action);
  else if(action==='close-modal')closeModal();
  else if(action==='set-language'){progress.lang=normalizeLanguage(id);save();if(embedded){parent.postMessage({type:'tapmelo-mahjong-language',language:progress.lang,route:location.hash},location.origin);}render();refreshModal();reportSize();}
  else if(action==='toggle-labels'){progress.labels=!progress.labels;save();render();refreshModal();}
  else if(action==='inspect'){dialog.querySelector('.tile-inspection').textContent=`${tileName(index,'en')} / ${tileName(index,'hi')}`;}
  else if(action==='confirm-reset'){const {lang,labels}=progress;progress={...cleanProgress(null),lang,labels};save();closeModal(true);goto('#home');}
  else if(action==='articles'){closeModal(true);if(onSite)openSiteArticles();else{returnTo='#articles';goto('#articles');}}
  else if(action==='related-article'){returnTo=location.hash;closeModal(true);if(onSite)openSiteArticle(q.article||'winning');else goto(`#article/${q.article||'winning'}`);}
  else if(action==='begin-question'){progress.seen=[...new Set([...progress.seen,...q.patterns])];save();render(true);}
  else if(action==='select')handleSelect(index);
  else if(action==='check'&&!feedback?.ok&&selected.length){const ok=checkAnswer(q,selected);feedback={ok,message:ok?q.explain:q.wrong};if(ok&&view==='learn')markComplete(q.id);render();}
  else if(action==='next'&&feedback?.ok)nextQuestion();
  else if(action==='new-practice'){setPractice();newSelection();render(true);}
  else if(action.startsWith('round-'))handleRound(action);
}

function sitePrefix(){return progress.lang==='en'?'':'/'+progress.lang.toLowerCase();}
function openSiteArticles() {
  if (embedded) parent.postMessage({type:'tapmelo-mahjong-guides'}, location.origin);
  else window.top.location.href = `${sitePrefix()}/mahjong#guides`;
}
function openSiteArticle(id){window.top.location.href=`${sitePrefix()}/guides/mahjong/${id}/`;}
function reportSize(){if(embedded)requestAnimationFrame(()=>parent.postMessage({type:'tapmelo-mahjong-ready',height:Math.ceil(Math.max(app.getBoundingClientRect().height+12,dialog.open?650:0)),route:location.hash},location.origin));}
if(embedded)new ResizeObserver(reportSize).observe(app);
window.addEventListener('resize',reportSize);
app.addEventListener('click',handle);dialog.addEventListener('click',handle);
if (embedded && onSite) app.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  goto(link.hash);
});
// Restore focus when the native dialog closes, including via Escape.
dialog.addEventListener('close',()=>{modalStack=[];reportSize();if(lastTrigger?.isConnected)lastTrigger.focus();else app.querySelector('[data-action="settings"]')?.focus({preventScroll:true});});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();document.querySelector('main')?.focus();});
window.addEventListener('hashchange',route);
const entryLesson=params.get('lesson');
if(!location.hash&&entryLesson==='practice')history.replaceState(null,'','#practice');
else if(!location.hash&&['beginner','intermediate','advanced'].includes(entryLesson))history.replaceState(null,'','#learn/'+entryLesson);
route();
