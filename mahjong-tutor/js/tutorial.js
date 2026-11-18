import { meldType, ROUND_INITIAL, ROUND_DRAWS, ROUND_DISCARDS } from './rules.js';
export function sameSet(a,b){return a.length===b.length&&[...a].sort((x,y)=>x-y).every((v,i)=>v===[...b].sort((x,y)=>x-y)[i]);}
export function checkAnswer(question,selection){
  if(!selection.length||selection.some(i=>!Number.isInteger(i)||i<0||i>=question.options.length))return false;
  if(question.kind==='build')return selection.length===question.size&&meldType(selection.map(i=>question.options[i]))===question.target;
  if(['choice','group'].includes(question.kind))return selection.length===1&&selection[0]===question.answer;
  return sameSet(selection.map(i=>question.options[i]),question.answers);
}
export function guidedState(phase){
  const hand=[...ROUND_INITIAL],river=[];
  if(phase>=1)hand.push(ROUND_DRAWS[0]);
  if(phase>=2){hand.splice(hand.indexOf(ROUND_DISCARDS[0]),1);river.push(ROUND_DISCARDS[0]);}
  if(phase>=3)hand.push(ROUND_DRAWS[1]);
  if(phase>=4){hand.splice(hand.indexOf(ROUND_DISCARDS[1]),1);river.push(ROUND_DISCARDS[1]);}
  if(phase>=6)hand.push(ROUND_DRAWS[2]);
  const drawn=[1,3,6].includes(phase)?hand.pop():null;
  hand.sort((a,b)=>a-b);if(drawn!==null)hand.push(drawn);
  return {phase,hand,river,drawn};
}
