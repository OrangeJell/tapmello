import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePatterns, analyzeHand, winningTilesFor, counts, ORPHANS } from '../js/rules.js';
import { patterns, articles } from '../js/catalog.js';
import { levels, allQuestions, legacyTarget } from '../js/curriculum.js';
import { cleanProgress, loadProgress, saveProgress, STORAGE_KEY, LEGACY_KEY } from '../js/storage.js';
import { checkAnswer } from '../js/tutorial.js';
import { hindi } from '../js/hi.js';
import { readFileSync } from 'node:fs';
const example=id=>patterns[id].groups.flat();
const has=(hand,id,exposed=[])=>analyzePatterns(hand,exposed)?.tags.includes(id)||false;

test('every published exercise, pattern, article and static interface phrase has Hindi copy',()=>{
  function walk(value){
    if(!value||typeof value!=='object')return;
    if(typeof value.en==='string'){
      assert.ok(hindi[value.en],value.en);
      assert.equal(value.hi,hindi[value.en]);
      assert.ok(!Object.hasOwn(value,'zh'));
    }
    Object.values(value).forEach(walk);
  }
  walk([patterns,articles,levels]);
  const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
  for(const match of app.matchAll(/tr\('[^']*','([^']*)'\)/g))assert.ok(hindi[match[1]],match[1]);
});
test('retired Chinese preference falls back to English without losing either save format',()=>{
  const v2=cleanProgress({version:2,lang:'zh',completed:['legacy-0-0'],labels:false,positions:{beginner:'legacy-0-1'}});
  assert.equal(v2.lang,'en');assert.deepEqual(v2.completed,['legacy-0-0']);assert.equal(v2.labels,false);assert.equal(v2.positions.beginner,'legacy-0-1');
  const v1=cleanProgress({version:1,lang:'zh',done:[0]});
  assert.equal(v1.lang,'en');assert.equal(v1.completed.length,5);
  assert.equal(cleanProgress({...v2,lang:'hi'}).lang,'hi');
});

test('every shared pattern example is valid, every counterexample fails its own rule',()=>{
  for(const p of Object.values(patterns)){
    assert.ok(counts(p.groups.flat()),p.id);assert.ok(counts(p.counterGroups.flat()),p.id+' counter');
    if(p.groups.flat().length>4){assert.ok(has(p.groups.flat(),p.id),p.id);assert.ok(!has(p.counterGroups.flat(),p.id),p.id+' counter');}
    for(const lang of ['en','hi'])for(const field of ['title','rule','counter'])assert.ok(p[field][lang]);
  }
  for(const a of articles)for(const id of a.patterns)assert.ok(patterns[id]);
});
test('seven pairs requires seven distinct pairs and no open sets',()=>{
  assert.ok(has(example('seven-pairs'),'seven-pairs'));
  assert.equal(analyzeHand(example('seven-pairs')),null);
  assert.equal(analyzePatterns(example('seven-pairs'),[],'basic'),null);
  assert.ok(!has(patterns['seven-pairs'].counterGroups.flat(),'seven-pairs'));
  assert.equal(analyzePatterns(example('seven-pairs'),[[31,31,31]]),null);
  const overlap=[0,1,2,3,4,5,6].flatMap(x=>[x,x]);
  assert.deepEqual(analyzePatterns(overlap).tags,['standard','seven-pairs','full-flush']);
  assert.equal(analyzePatterns(overlap).structures.filter(s=>s.type==='seven-pairs').length,1);
});
test('thirteen orphans validates all distinct terminals/honors and the pair',()=>{
  assert.ok(has(example('thirteen-orphans'),'thirteen-orphans'));
  assert.ok(!has(patterns['thirteen-orphans'].counterGroups.flat(),'thirteen-orphans'));
  assert.equal(analyzePatterns(ORPHANS),null);
  assert.equal(analyzePatterns(example('thirteen-orphans'),[[0,1,2]]),null);
  assert.deepEqual(winningTilesFor(ORPHANS,[],'extended'),ORPHANS);
  assert.deepEqual(winningTilesFor(ORPHANS,[],'basic'),[]);
});
test('all-triplet search is independent of the first standard decomposition',()=>{
  const ambiguous=[0,0,0,1,1,1,2,2,2,3,3,3,4,4];
  const result=analyzePatterns(ambiguous);
  assert.ok(result.tags.includes('all-pungs'));assert.ok(result.tags.includes('full-flush'));
  assert.ok(result.structures.find(s=>s.type==='all-pungs').groups.slice(0,-1).every(g=>g.every(t=>t===g[0])));
  assert.ok(has([0,0,0,12,12,12,22,22,22,27,27],'all-pungs',[[31,31,31,31]]));
  assert.equal(analyzePatterns([0,0,0,12,12,12,22,22,22,31,31],[[31,31,31,31]]),null);
});
test('flush labels require a winning shape and distinguish honors',()=>{
  assert.ok(has(example('full-flush'),'full-flush'));
  assert.ok(!has(example('full-flush'),'half-flush'));
  assert.ok(has(example('half-flush'),'half-flush'));
  assert.ok(!has(example('half-flush'),'full-flush'));
  assert.equal(analyzePatterns([0,0,0,1,2,4,4,5,6,7,7,8,8,8]),null);
  const allHonors=[27,27,28,28,29,29,30,30,31,31,32,32,33,33];
  assert.ok(has(allHonors,'seven-pairs'));assert.ok(!has(allHonors,'half-flush'));
  assert.equal(analyzePatterns([0,0,0,0,0,1,2,3,4,5,6,7,8,8]),null);
  assert.deepEqual(winningTilesFor([0,1,2,9,10,11,18,19,20,31,31,31,31],[],'extended'),[]);
});
test('levels have stable IDs and all 28 exercises have reachable solutions',()=>{
  assert.deepEqual(levels.map(l=>l.questions.length),[12,8,9]);
  assert.equal(new Set(allQuestions.map(q=>q.id)).size,29);
  for(const q of allQuestions){
    if(q.kind==='round')continue;
    for(const lang of ['en','hi'])for(const field of ['prompt','hint','explain','wrong'])assert.ok(q[field]?.[lang],q.id);
    let solution;
    for(let mask=1;mask<2**q.options.length;mask++){
      const selection=q.options.map((_,i)=>i).filter(i=>mask&(1<<i));
      if(checkAnswer(q,selection)){solution=selection;break;}
    }
    assert.ok(solution,q.id);assert.ok(!checkAnswer(q,[]));
    assert.ok(q.profile==='basic'||q.profile==='extended');
  }
});
test('migration preserves old completed and partial exercises without completing new advanced questions',()=>{
  const raw={version:1,lang:'en',labels:false,done:[0,2,5],active:3,records:{1:{step:2},3:{step:1},5:{step:0}}};
  const data=cleanProgress(raw);
  assert.equal(data.version,2);assert.equal(data.lang,'en');assert.equal(data.labels,false);
  assert.equal(data.completed.length,12);assert.ok(data.completed.includes('guided-round'));
  assert.ok(!data.completed.includes('seven-pairs-recognize'));
  assert.equal(data.active,'intermediate');assert.equal(data.positions.intermediate,'legacy-3-1');
  assert.equal(data.positions.beginner,'legacy-1-2');
  assert.deepEqual(legacyTarget(4,1),{level:'intermediate',question:'legacy-4-1'});
  assert.deepEqual(legacyTarget(5,4),{level:'advanced',question:'guided-round'});
  assert.equal(legacyTarget(1,'bad').question,'legacy-1-0');
});
test('v2 storage roundtrips, migrates only when needed and rejects invalid data',()=>{
  const store=new Map(),adapter={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  store.set(LEGACY_KEY,JSON.stringify({version:1,lang:'en',done:[0],records:{5:{step:3}}}));
  const migrated=loadProgress(adapter).data;assert.equal(migrated.completed.length,5);assert.equal(migrated.roundStep,3);assert.ok(store.has(STORAGE_KEY));
  const fresh=cleanProgress(null);saveProgress(adapter,fresh);assert.deepEqual(loadProgress(adapter).data,fresh,'v1 must not revive reset progress');
  const clean=cleanProgress({version:2,completed:['fake','legacy-0-0','legacy-0-0'],seen:['constructor','pair'],active:'fake',positions:{beginner:'orphans-missing'},roundStep:55});
  assert.deepEqual(clean.completed,['legacy-0-0']);assert.deepEqual(clean.seen,['pair']);assert.equal(clean.active,null);assert.equal(clean.positions.beginner,undefined);assert.equal(clean.roundStep,6);
  assert.equal(saveProgress(null,fresh),false);assert.deepEqual(loadProgress({getItem:()=>'{oops'}).data,fresh);
});
test('long-form guides retain shared patterns, physical examples and complete waits',()=>{
  assert.equal(articles.length,7);assert.equal(new Set(articles.map(a=>a.id)).size,7);
  const referenced=new Set();
  for(const a of articles){
    assert.ok(a.sections.length);
    for(const lang of ['en','hi']){
      assert.ok(a.title[lang]&&a.lead[lang]);
      for(const p of a.paragraphs)assert.ok(p[lang]);
      for(const section of a.sections){assert.ok(section.title[lang]);for(const p of section.paragraphs)assert.ok(p[lang]);if(section.note)assert.ok(section.note[lang]);}
    }
    for(const section of a.sections){
      if(section.pattern){assert.ok(patterns[section.pattern]);referenced.add(section.pattern);}
      if(section.groups)assert.ok(counts(section.groups.flat()),a.id);
    }
  }
  assert.equal(referenced.size,Object.keys(patterns).length);
  const waitExamples=articles.find(a=>a.id==='waiting-shapes').sections.filter(s=>s.groups);
  const expected=[[2,5],[4],[2],[27],[27,28]];
  assert.equal(waitExamples.length,expected.length);
  waitExamples.forEach((s,i)=>{assert.equal(s.groups.flat().length,13);assert.deepEqual(winningTilesFor(s.groups.flat()),expected[i]);});
});
