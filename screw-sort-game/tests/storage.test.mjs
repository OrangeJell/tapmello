import test from 'node:test';
import assert from 'node:assert/strict';
import { TEXT } from '../js/i18n.js';
import { LEVELS } from '../js/levels.js';
import { transition,createState,move,selectableBoards,availableScrews } from '../js/engine.js';
import { STORAGE_KEY,loadProgress,saveProgress,recordCompletion,saveSession,loadSession } from '../js/storage.js';
const memory=()=>{const data=new Map();return{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
let supportedScenario;
function supportedOpening(){
 if(supportedScenario)return supportedScenario;
 for(const level of LEVELS){let state=createState(level);const actions=[];
  for(const id of level.solution){const action={type:'screw',id},result=transition(level,state,action,{captureMotion:true});state=result.state;actions.push(action);
   const entry=[...result.motions].find(([boardId,movement])=>state.loose[boardId]&&movement.frames.length>10);
   if(entry&&actions.length<level.solution.length){const [boardId,movement]=entry;
    return supportedScenario={level,state,actions:[...actions],boardId,movement,nextId:level.solution[actions.length]};}
  }
 }
 throw Error('No supported empty plate in the level catalogue');
}
test('English and Hindi have matching keys and interpolation variables',()=>{
 assert.deepEqual(Object.keys(TEXT).sort(),['en','hi']);
 assert.deepEqual(Object.keys(TEXT.en).sort(),Object.keys(TEXT.hi).sort());
 for(const key of Object.keys(TEXT.en))assert.deepEqual(TEXT.en[key].match(/\{\w+\}/g),TEXT.hi[key].match(/\{\w+\}/g),key);
});
test('blocked storage does not prevent play',()=>{
 for(const storage of [null,{getItem(){throw Error('blocked');}}]){assert.equal(loadProgress(storage).unlocked,1);assert.equal(loadSession(storage),null);assert.equal(saveProgress(storage,{}),false);}
});
test('legacy progress resets but language and sound survive',()=>{
 const storage=memory();storage.setItem('screw-sort.v1',JSON.stringify({unlocked:20,completed:[1,20],lang:'hi',sound:false}));assert.deepEqual(loadProgress(storage),{unlocked:1,completed:[],lang:'hi',sound:false,vibration:false});
});
test('completion stays within ten levels and advances old two-level saves',()=>{
 const storage=memory();saveProgress(storage,{unlocked:20,completed:[1,2,3,10,11],lang:'hi',sound:true});
 const value=loadProgress(storage);assert.deepEqual(value.completed,[1,2,3,10]);assert.equal(value.unlocked,10);
 assert.deepEqual(recordCompletion(value,10),value);assert.deepEqual(recordCompletion(value,11),value);
 saveProgress(storage,{unlocked:2,completed:[1,2],lang:'en',sound:true});assert.equal(loadProgress(storage).unlocked,3);
});
test('removed Chinese preference falls back to English without losing glass progress',()=>{
 const storage=memory();saveProgress(storage,{unlocked:3,completed:[1,2],lang:'zh',sound:false,vibration:true});
 assert.deepEqual(loadProgress(storage),{unlocked:3,completed:[1,2],lang:'en',sound:false,vibration:true});
});
test('action replay restores rewards and floating screws, rejects corruption',()=>{
 const storage=memory(),level=LEVELS[0],actions=[{type:'extra'},{type:'grantMelt'},{type:'melt',id:selectableBoards(level,createState(level)).at(-1).id}];let state=createState(level);for(const action of actions){const result=transition(level,state,action);assert.ok(result.accepted);state=result.state;}
 saveSession(storage,level,2,actions);assert.deepEqual(loadSession(storage).state,state);saveSession(storage,level,2,[...actions,{type:'screw',id:'missing'}]);assert.equal(loadSession(storage),null);storage.setItem(`${STORAGE_KEY}.round`,'{broken');assert.equal(loadSession(storage),null);
});

test('failed-round continuation survives replay and a full long-level action log',()=>{
 const storage=memory(),level=LEVELS[1],actions=level.jamPath.map(id=>({type:'screw',id}));actions.push({type:'continue'});
 let state=createState(level);for(const action of actions)state=transition(level,state,action).state;
 saveSession(storage,level,2,actions);assert.deepEqual(loadSession(storage).state,state);
 const long=level.solution.slice(0,-1).map(id=>({type:'screw',id}));saveSession(storage,level,2,long);
 assert.equal(loadSession(storage).actions.length,level.solution.length-1);
});

test('a supported empty plate survives action-log restoration',()=>{
 const storage=memory(),{level,actions,state,boardId}=supportedOpening();assert.ok(state.loose[boardId]);
 saveSession(storage,level,2,actions);assert.deepEqual(loadSession(storage).state,state);
});

test('an interrupted falling plate retains its visible pose and momentum in replay',()=>{
 const storage=memory(),{level,actions,state,boardId,movement,nextId}=supportedOpening();
 const before=movement.frames[9],after=movement.frames[10],seconds=(after.offset-before.offset)*movement.duration/1000;
 const action={type:'screw',id:nextId,looseMotion:{[boardId]:{pose:before.pose,velocity:{x:(after.pose.x-before.pose.x)/seconds,y:(after.pose.y-before.pose.y)/seconds,spin:(after.pose.angle-before.pose.angle)*Math.PI/180/seconds}}}};
 const result=transition(level,state,action,{captureMotion:true});assert.ok(result.accepted);assert.deepEqual(result.motions.get(boardId).frames[0].pose,before.pose);
 saveSession(storage,level,2,[...actions,action]);assert.deepEqual(loadSession(storage).state,result.state);
});


test('clicking an exposed head during a swing survives saved action replay',()=>{
 const storage=memory();let checked=false;
 for(const level of LEVELS.slice(0,3)) {
  let state=createState(level);const actions=[];
  for(const id of level.solution) {
   const action={type:'screw',id};state=transition(level,state,action).state;actions.push(action);
   const stable=new Set(availableScrews(level,state).map(s=>s.id));
   for(const board of level.boards.filter(b=>b.screws.filter(s=>!state.removed.includes(s.id)).length===1)) {
    const pose={x:board.x,y:board.y,angle:board.angle},scenePoses={[board.id]:pose};
    const exposed=availableScrews(level,state,new Map([[board.id,pose]])).find(s=>!stable.has(s.id));
    if(!exposed)continue;
    const click={type:'screw',id:exposed.id,scenePoses},result=transition(level,state,click);
    if(!result.accepted||result.state.status==='won')continue;
    saveSession(storage,level,2,[...actions,click]);assert.deepEqual(loadSession(storage).state,result.state);checked=true;break;
   }
   if(checked)break;
  }
  if(checked)break;
 }
 assert.ok(checked,'No moving-scene exposure was exercised');
});
