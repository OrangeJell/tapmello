import { lessons } from './lessons.js';
import { L } from './i18n.js';
import { patterns } from './catalog.js';
const patternRefs = [['pair','chow','pung'], ['pair','pung','chow','chow'], ['standard','pair','standard'], ['chow','chow','pung','kong','kong'], ['standard','standard','standard']];
export const legacyQuestions = lessons.slice(0,5).map((l, chapter) => l.questions.map((q,index) => ({ ...q, id:`legacy-${chapter}-${index}`, profile:'basic', patterns: chapter === 0 ? [] : [patternRefs[chapter][index] || 'standard'], article: chapter < 2 ? 'tiles' : chapter === 3 ? 'calls' : 'winning' })));
// A hand-type introduction is not the answer: it teaches the concept before the exercise.
const advanced = (id, pattern, prompt, options, answer, overrides = {}) => ({
  id, kind:'choice', profile:'extended', patterns:[pattern], article:'advanced', groups:patterns[pattern].groups,
  prompt, options, answer, hint:patterns[pattern].rule,
  explain:patterns[pattern].rule, wrong:L('再对照牌型条件看看。', 'Check the pattern conditions and try again.'), ...overrides
});
const yesNo = [L('符合', 'Yes'), L('不符合', 'No')];
export const advancedQuestions = [
  advanced('seven-pairs-recognize','seven-pairs',L('这手门清牌能组成七对吗？','Does this closed hand make seven pairs?'),yesNo,0),
  advanced('seven-pairs-quad','seven-pairs',L('四张一万算两对吗？这手能按七对胡吗？','Can four 1 characters count as two pairs here?'),yesNo,1,{groups:patterns['seven-pairs'].counterGroups,explain:patterns['seven-pairs'].counter}),
  advanced('orphans-recognize','thirteen-orphans',L('这手门清牌属于哪种胡牌结构？','Which winning structure does this closed hand form?'),[L('十三幺','Thirteen orphans'),L('七对','Seven pairs'),L('四组面子加一对将','Four sets and a pair')],0),
  advanced('orphans-missing','thirteen-orphans',L('用二万换掉九万，还能算十三幺吗？','Replace 9 characters with 2 characters. Still thirteen orphans?'),yesNo,1,{groups:patterns['thirteen-orphans'].counterGroups,explain:patterns['thirteen-orphans'].counter}),
  advanced('all-pungs-recognize','all-pungs',L('这手牌为什么是碰碰胡？','What makes this hand all triplets?'),[L('四组刻子加一对将','Four triplets and a pair'),L('所有牌是同一花色','Every tile is in one suit'),L('七组对子','Seven pairs')],0),
  advanced('full-flush-recognize','full-flush',L('这手基本胡牌还符合哪种牌型？','Which extra pattern does this standard hand have?'),[L('混一色','Half flush'),L('清一色','Full flush'),L('碰碰胡','All triplets')],1),
  advanced('half-flush-recognize','half-flush',L('万子加字牌，应该叫什么？','A winning hand of characters and honors is…'),[L('清一色','Full flush'),L('混一色','Half flush'),L('十三幺','Thirteen orphans')],1),
  advanced('patterns-combine','seven-pairs',L('全部是万子的七对，可同时成立哪两种牌型？','Seven distinct pairs, all characters. Which two patterns coexist?'),[L('七对＋清一色','Seven pairs + full flush'),L('七对＋混一色','Seven pairs + half flush'),L('七对＋十三幺','Seven pairs + thirteen orphans')],0,{patterns:['seven-pairs','full-flush'],groups:[0,1,2,3,4,5,6].map(i=>[i,i]),explain:L('七对描述组合结构，清一色描述花色，两者可以同时成立。','Seven pairs describes the structure; full flush describes the suit. Both can apply.')})
];
export const levels = [
  {id:'beginner',title:L('初级','Beginner'),summary:L('认牌 · 组合 · 基本胡牌','Tiles, sets and your first winning shape'),art:[0,13,19],questions:legacyQuestions.slice(0,3).flat()},
  {id:'intermediate',title:L('中级','Intermediate'),summary:L('吃碰杠 · 听牌','Claims and waiting hands'),art:[1,2,3],questions:legacyQuestions.slice(3,5).flat()},
  {id:'advanced',title:L('高级','Advanced'),summary:L('进阶牌型 · 引导练习局','Advanced patterns and a guided hand'),art:[27,27,31],questions:[...advancedQuestions,{id:'guided-round',kind:'round',profile:'basic',patterns:['standard'],article:'winning'}]}
];
export const allQuestions = levels.flatMap(l=>l.questions);
export const questionIds = new Set(allQuestions.map(q=>q.id));
export function findQuestion(id) { for(const level of levels){const index=level.questions.findIndex(q=>q.id===id);if(index>=0)return {level,index,question:level.questions[index]};} return null; }
export function legacyTarget(chapter, step=0) {
  if(chapter===5)return {level:'advanced',question:'guided-round'};
  const q=legacyQuestions[chapter]?.[Math.min(Math.max(0,Number.isInteger(step)?step:0),legacyQuestions[chapter].length-1)];
  return q?{level:chapter<3?'beginner':'intermediate',question:q.id}:null;
}
