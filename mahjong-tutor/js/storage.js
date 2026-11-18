import { levels, questionIds, legacyQuestions, legacyTarget } from './curriculum.js';
import { patterns } from './catalog.js';
export const STORAGE_KEY = 'mahjong-tutor.v2';
export const LEGACY_KEY = 'mahjong-tutor.v1';
const levelIds = new Set(levels.map(l=>l.id));
const fresh = () => ({version:2,lang:'en',labels:true,completed:[],positions:{},active:null,roundStep:0,seen:[]});
export function migrateLegacy(raw) {
  const data=fresh();
  data.lang=raw?.lang==='hi'?'hi':'en'; data.labels=raw?.labels!==false;
  if(raw?.version!==1)return data;
  const done=Array.isArray(raw.done)?raw.done.filter(Number.isInteger):[];
  for(let chapter=0;chapter<5;chapter++) {
    const qs=legacyQuestions[chapter],record=raw.records?.[chapter];
    const before=done.includes(chapter)?qs.length:Number.isInteger(record?.step)?Math.max(0,Math.min(record.step,qs.length)):0;
    data.completed.push(...qs.slice(0,before).map(q=>q.id));
  }
  if(done.includes(5))data.completed.push('guided-round');
  else if(Number.isInteger(raw.records?.[5]?.step))data.roundStep=Math.max(0,Math.min(6,raw.records[5].step));
  for(const l of levels)data.positions[l.id]=(l.questions.find(q=>!data.completed.includes(q.id))||l.questions[0]).id;
  if(Number.isInteger(raw.active)&&raw.active>=0&&raw.active<6) {
    const target=legacyTarget(raw.active,raw.records?.[raw.active]?.step||0);
    data.active=target.level;
    if(!done.includes(raw.active))data.positions[target.level]=target.question;
  }
  return data;
}
export function cleanProgress(raw) {
  if(raw?.version===1)return migrateLegacy(raw);
  const data=fresh();
  if(raw?.version!==2)return data;
  data.lang=raw.lang==='hi'?'hi':'en';data.labels=raw.labels!==false;
  data.completed=[...new Set(Array.isArray(raw.completed)?raw.completed.filter(id=>questionIds.has(id)):[])];
  data.seen=[...new Set(Array.isArray(raw.seen)?raw.seen.filter(id=>Object.hasOwn(patterns,id)):[])];
  data.active=levelIds.has(raw.active)?raw.active:null;
  data.roundStep=Number.isInteger(raw.roundStep)?Math.max(0,Math.min(6,raw.roundStep)):0;
  for(const l of levels)if(l.questions.some(q=>q.id===raw.positions?.[l.id]))data.positions[l.id]=raw.positions[l.id];
  return data;
}
export function loadProgress(storage) {
  try {
    const current=storage.getItem(STORAGE_KEY);
    if(current!==null&&current!==undefined)return {data:cleanProgress(JSON.parse(current)),available:true};
    const legacy=storage.getItem(LEGACY_KEY);
    const data=cleanProgress(legacy?JSON.parse(legacy):null);
    if(legacy)storage.setItem(STORAGE_KEY,JSON.stringify(data));
    return {data,available:true};
  } catch {return {data:fresh(),available:false};}
}
export function saveProgress(storage,data) {
  try{storage.setItem(STORAGE_KEY,JSON.stringify(cleanProgress(data)));return true;}catch{return false;}
}
