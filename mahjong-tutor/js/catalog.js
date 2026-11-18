import { L } from './i18n.js';
import { ORPHANS } from './rules.js';

const p = (id, title, rule, groups, counter, counterGroups) => ({ id, title, rule, groups, counter, counterGroups });
export const patterns = {
  pair: p('pair', L('对子与将', 'Pairs'), L('两张完全相同的牌。基本胡牌需要一对将。', 'Two identical tiles. The standard winning shape needs one pair.'), [[27,27]], L('同样的数字、不同花色，不是一对。', 'The same rank in different suits is not a pair.'), [[0,9]]),
  chow: p('chow', L('顺子', 'Sequences'), L('同一种数牌花色，连续三张；不能从九接到一。', 'Three consecutive ranks in one numbered suit; 9 cannot wrap to 1.'), [[1,2,3]], L('字牌不能组成顺子，东南西也不行。', 'Honors cannot form a sequence, including East–South–West.'), [[27,28,29]]),
  pung: p('pung', L('刻子', 'Triplets'), L('三张完全相同的牌，数牌或字牌都可以。', 'Three identical tiles, either suited tiles or honors.'), [[31,31,31]], L('同一个数字的万、筒、条不能拼成刻子。', 'A rank shared across three suits does not make a triplet.'), [[4,13,22]]),
  kong: p('kong', L('杠子', 'Quads'), L('四张完全相同的牌，仍算一组面子。杠后补摸一张。', 'Four identical tiles, counted as one set. Draw a replacement after a kong.'), [[13,13,13,13]], L('三张只是一组刻子，还不能宣布四张的杠。', 'Three identical tiles make a triplet, not a quad.'), [[13,13,13]]),
  standard: p('standard', L('基本胡牌', 'Standard hand'), L('四组顺子、刻子或杠子，加一对将；无杠时共 14 张。', 'Four sequences, triplets or quads, plus a pair. Fourteen tiles without kongs.'), [[0,1,2],[9,10,11],[18,19,20],[31,31,31],[27,27]], L('张数够不代表能胡；下面的东南西不是面子。', 'The right count is not enough: East–South–West below is not a set.'), [[0,1,2],[9,10,11],[18,19,20],[27,28,29],[31,31]]),
  'seven-pairs': p('seven-pairs', L('七对', 'Seven pairs'), L('门清，七种不同牌各两张，共 14 张。本版四张相同牌不算两对。', 'A closed hand with seven distinct pairs, 14 tiles. Four identical tiles do not count as two pairs here.'), [[0,0],[2,2],[4,4],[9,9],[11,11],[18,18],[27,27]], L('四张一万不能算两对，所以这手牌不是本版七对。', 'Four 1 characters cannot count as two pairs, so this is not seven pairs here.'), [[0,0,0,0],[2,2],[9,9],[11,11],[18,18],[27,27]]),
  'thirteen-orphans': p('thirteen-orphans', L('十三幺', 'Thirteen orphans'), L('门清，三种花色的一和九、七种字牌各一张，再加其中任意一张作对。', 'Closed: 1 and 9 of each suit, all seven honors, and one duplicate of any of those tiles.'), ORPHANS.map(id => id === 27 ? [27,27] : [id]), L('不能用数牌的二至八替代任何一种幺九字牌。下面用二万替掉了九万。', 'Ranks 2–8 cannot replace a terminal or honor. Here 2 characters replaces 9 characters.'), ORPHANS.map(id => id === 27 ? [27,27] : [id === 8 ? 1 : id])),
  'all-pungs': p('all-pungs', L('碰碰胡', 'All triplets'), L('四组刻子或杠子，加一对将；不能有顺子。', 'Four triplets or quads and a pair, with no sequences.'), [[0,0,0],[12,12,12],[22,22,22],[31,31,31],[27,27]], L('有顺子仍可能是基本胡牌，但不能称为碰碰胡。', 'A hand with a sequence may still win, but is not all triplets.'), [[0,1,2],[12,12,12],[22,22,22],[31,31,31],[27,27]]),
  'full-flush': p('full-flush', L('清一色', 'Full flush'), L('先满足胡牌结构，再要求所有牌都来自同一种数牌花色，不能有字牌。', 'A valid winning hand using only one numbered suit, with no honors.'), [[0,1,2],[3,4,5],[6,7,8],[1,2,3],[4,4]], L('加入字牌后就不再是清一色；仍可能构成混一色。', 'Adding honors prevents a full flush; the hand may be a half flush.'), [[0,1,2],[3,4,5],[6,7,8],[31,31,31],[27,27]]),
  'half-flush': p('half-flush', L('混一色', 'Half flush'), L('有效胡牌只用一种数牌花色和字牌，而且两类都要有。', 'A valid winning hand with exactly one numbered suit plus honors; both must be present.'), [[0,1,2],[3,4,5],[6,7,8],[31,31,31],[27,27]], L('万子和筒子同时出现，就不是混一色。', 'A hand containing both characters and dots is not a half flush.'), [[0,1,2],[9,10,11],[6,7,8],[31,31,31],[27,27]])
};

export { articles } from './articles.js';
