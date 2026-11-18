import { L } from './i18n.js';
import { winningTiles } from './rules.js';

const choice = (zh, en) => L(zh, en);
const wait = (hand, options, prompt, hint, explain) => ({ kind: 'wait', hand, options, answers: winningTiles(hand), prompt, hint, explain,
  wrong: L('选项还不完整，或多选了不能胡的牌。先把已完成的组合拿出来看。', 'A winning tile is missing, or an extra tile is selected. Separate the completed sets first.') });
export const lessons = [
  {
    title: L('认识麻将牌', 'Meet the tiles'), short: L('万、筒、条与字牌', 'Suits and honors'), minutes: 3, art: [0, 13, 19],
    summary: L('万、筒、条各有一至九；东南西北和中发白是字牌。', 'Characters, dots and bamboo run from 1 to 9. Winds and dragons are honors.'),
    questions: [
      { kind: 'tile', prompt: L('找一找：哪张是三万？', 'Find the 3 of characters.'), intro: L('看上面的数字，再看下面的「萬」。', 'Read the numeral above the 萬 character.'), options: [11, 2, 20, 27], answers: [2],
        hint: L('「三」表示 3，「萬」表示万子花色。', '三 means 3; 萬 marks the characters suit.'), explain: L('三万。数字一样，花色不同，仍然是不同的牌。', '3 characters. The same number in a different suit is a different tile.'), wrong: L('再看看牌上的「三」和「萬」。圆圈是筒子，竹节是条子。', 'Look for 三 and 萬. Circles are dots; bamboo stalks are bamboo.') },
      { kind: 'tile', prompt: L('哪张是五筒？', 'Which tile is 5 dots?'), options: [4, 13, 22, 31], answers: [13],
        hint: L('数圆圈：四角各一个，正中间还有一个。', 'Count the circles: four corners and one in the centre.'), explain: L('五个圆圈，就是五筒。筒子也常叫饼子。', 'Five circles make 5 dots. This suit is also called circles.'), wrong: L('找有五个圆圈的牌，不是五个竹节。', 'Find five circles, not five bamboo stalks.') },
      { kind: 'tile', prompt: L('找出二条。', 'Find 2 bamboo.'), options: [10, 1, 19, 33], answers: [19],
        hint: L('条子用竹节来表示，这张有两个。', 'Look for two bamboo stalks.'), explain: L('二条，也叫二索。一条通常画成一只鸟，稍后可以在牌谱里查看。', '2 bamboo. Bamboo is also called bams; the 1 is usually a bird. See it in the tile guide.'), wrong: L('这次要找竹节图案，两根竹节。', 'Look for the bamboo pattern: two stalks.') },
      { kind: 'tile', prompt: L('这里哪些是字牌？全部选出。', 'Which are honors? Select all of them.'), multi: true, options: [27, 2, 31, 13, 33], answers: [27, 31, 33],
        hint: L('风牌和箭牌都是字牌。白板也属于字牌。', 'Winds and dragons are honors. The white dragon counts too.'), explain: L('东风、红中、白板都是字牌。字牌没有一至九的数值。', 'East, red dragon and white dragon are honors. They have no 1–9 rank.'), wrong: L('东风、红中和白板都要选；三万、五筒属于数牌。', 'Include East and both dragons. Characters and dots are suited tiles.') },
      { kind: 'choice', prompt: L('同一种牌，一副里有几张？', 'How many copies of each tile are in the set?'), display: [31, 31, 31, 31], options: [choice('2 张', '2 copies'), choice('4 张', '4 copies'), choice('不限张数', 'Unlimited')], answer: 1,
        hint: L('看看桌面上四张一模一样的红中。', 'Count the four identical red dragons on the table.'), explain: L('每种牌四张。我们使用 34 种牌，共 136 张，不含花牌。', 'Four of each. This game uses 34 types: 136 tiles, without flowers.'), wrong: L('每一种牌最多四张；这也是之后判断听牌时要考虑的限制。', 'There are four of each type. This limit matters when finding winning tiles.') }
    ]
  },
  {
    title: L('把牌组成一组', 'Build your first sets'), short: L('对子、刻子与顺子', 'Pairs, triplets and sequences'), minutes: 4, art: [1, 2, 3],
    summary: L('两张相同是对子，三张相同是刻子，同花色连续三张是顺子。', 'Two identical tiles are a pair; three are a triplet. Three consecutive tiles in one suit form a sequence.'),
    questions: [
      { kind: 'build', target: 'pair', size: 2, prompt: L('选出两张牌，组成一对。', 'Choose two tiles to make a pair.'), options: [27, 0, 27, 9],
        hint: L('对子需要两张完全相同的牌。', 'A pair needs two identical tiles.'), explain: L('两张东风是一对。胡牌时会用到一对「将」。', 'Two East winds form a pair. The standard winning shape includes one pair.'), wrong: L('数字相同但花色不同，不算一对。请找完全相同的两张。', 'Matching ranks across different suits are not a pair. Look for identical tiles.') },
      { kind: 'build', target: 'pung', size: 3, prompt: L('选三张牌，组成刻子。', 'Choose three tiles to make a triplet.'), options: [13, 4, 13, 22, 13],
        hint: L('这里有三张五筒。', 'There are three copies of 5 dots here.'), explain: L('三张五筒是一个刻子。字牌也能组成刻子。', 'Three copies of 5 dots form a triplet. Honors can form triplets too.'), wrong: L('刻子需要三张完全相同的牌，不能混用万、筒、条。', 'A triplet needs three identical tiles, not ranks from different suits.') },
      { kind: 'build', target: 'chow', size: 3, prompt: L('选三张牌，组成顺子。', 'Choose three tiles to make a sequence.'), options: [1, 2, 12, 3, 27],
        hint: L('二万、三万、四万，数字连续，而且都是万子。', '2, 3 and 4 characters are consecutive and share a suit.'), explain: L('二三四万是一组顺子。不能跨花色，也不能把九接到一。', '2–3–4 characters form a sequence. You cannot mix suits or wrap from 9 to 1.'), wrong: L('顺子必须是同一种花色的连续三张。', 'A sequence needs three consecutive ranks in the same suit.') },
      { kind: 'choice', prompt: L('东、南、西能组成顺子吗？', 'Can East, South and West form a sequence?'), display: [27, 28, 29], options: [choice('可以，按方向相连', 'Yes, the directions are in order'), choice('不可以，字牌没有顺子', 'No, honors cannot form sequences')], answer: 1,
        hint: L('只有万、筒、条这三种数牌才能组成顺子。', 'Only the three numbered suits can form sequences.'), explain: L('风牌的排列顺序不是数字连续关系。字牌只能组成对子、刻子或杠子。', 'Wind order does not create a sequence. Honors can form pairs, triplets or quads.'), wrong: L('方向有顺序，但麻将的顺子只适用于数牌。', 'Directions have an order, but Mahjong sequences apply only to numbered suits.') }
    ]
  },
  {
    title: L('看懂基本胡牌', 'Understand a winning hand'), short: L('四组面子，加一对将', 'Four sets and a pair'), minutes: 3, art: [31, 31, 31],
    summary: L('本版基本胡牌是四组顺子或刻子，加一对将；有杠时一杠仍算一组面子。', 'This version checks four sets plus a pair. A kong still counts as one set.'),
    questions: [
      { kind: 'choice', prompt: L('这手牌有几组面子？', 'How many sets does this hand contain?'), groups: [[0, 1, 2], [12, 13, 14], [19, 20, 21], [31, 31, 31], [27, 27]], options: [choice('3 组', '3 sets'), choice('4 组', '4 sets'), choice('5 组', '5 sets')], answer: 1,
        hint: L('前四组每组有三张，最后两张东风是一对将。', 'The first four groups have three tiles each. The two East winds are the pair.'), explain: L('四组面子，再加一对将，一共 14 张。对子不算面子。', 'Four sets plus a pair make 14 tiles. The pair is not one of the four sets.'), wrong: L('把两张东风单独算作「将」，再数剩下的四组。', 'Count the East pair separately, then count the four remaining groups.') },
      { kind: 'group', prompt: L('哪一组可以作为「将」？', 'Which group can be the pair?'), options: [[3, 4, 5], [9, 9], [27, 27, 27]], answer: 1,
        hint: L('将就是两张相同的牌。', 'The pair is exactly two identical tiles.'), explain: L('两张一筒可以作将。对子用什么牌，取决于所采用的规则；本版没有额外限制。', 'Two 1 dots can be the pair. This introductory ruleset has no extra restriction on the pair.'), wrong: L('三张是一组面子；将需要两张。', 'A three-tile set is not a pair. Look for two tiles.') },
      { kind: 'choice', prompt: L('有 14 张牌，就一定能胡吗？', 'Does any 14-tile hand win?'), options: [choice('是，张数够就可以', 'Yes, the tile count is enough'), choice('不是，还要满足牌型', 'No, the tiles must form a valid shape')], answer: 1,
        hint: L('张数正确只是第一步，还要能拆成四组面子和一对将。', 'The right count is only the start. You must form four sets and a pair.'), explain: L('本题只判断基本牌型，不计番。高级课程还会介绍七对、十三幺。', 'This exercise checks the basic shape without scoring. Advanced lessons introduce seven pairs and thirteen orphans.'), wrong: L('十四张散牌并不能胡；需要组成要求的结构。', 'Fourteen unrelated tiles do not win. They must form the required structure.') }
    ]
  },
  {
    title: L('吃、碰、杠怎么用', 'Chow, pung and kong'), short: L('接牌的条件与下一步', 'When to claim a discard'), minutes: 4, art: [13, 13, 13],
    summary: L('吃接上家，碰或明杠可接任意一家。吃碰后打牌；杠后先补摸。', 'Chow from the previous player; pung or exposed kong from any opponent. Discard after chow/pung; draw a replacement after kong.'),
    questions: [
      { kind: 'choice', prompt: L('上家打出三万，你有二万和四万。可以怎样接？', 'The previous player discards 3 characters. You hold 2 and 4 characters. What can you call?'), intro: L('这里仅展示有关的手牌，其他牌暂时省略。', 'Only relevant tiles are shown; the rest of the hand is omitted.'), display: [1, 3], incoming: 2, source: L('上家的弃牌', 'Previous player’s discard'), options: [choice('吃，组成二三四万', 'Chow: form 2–3–4 characters'), choice('碰，组成三张相同', 'Pung: form a triplet'), choice('杠，组成四张相同', 'Kong: form a quad')], answer: 0,
        hint: L('三万正好补在二万和四万中间。', '3 characters fits between 2 and 4.'), explain: L('可以吃。吃只接上家打出的牌，并组成同花色的顺子。', 'You may chow. Here, chow claims the previous player’s discard to complete a same-suit sequence.'), wrong: L('你没有两张或三张三万，不能碰或杠；但可以组成顺子。', 'You do not hold two or three copies of 3 characters. You can form a sequence instead.') },
      { kind: 'choice', prompt: L('换成对家打出三万，还能吃吗？', 'What if the opposite player discards that 3 characters?'), display: [1, 3], incoming: 2, source: L('对家的弃牌', 'Opposite player’s discard'), options: [choice('可以吃', 'Chow'), choice('不能吃，放过', 'Pass: cannot chow')], answer: 1,
        hint: L('这版规则只允许吃上家的牌。', 'In this ruleset, chow is only from the previous player.'), explain: L('不能吃对家或下家的牌。先放过，轮到自己时再摸牌。', 'You cannot chow from the opposite or next player. Pass and wait for your turn.'), wrong: L('能组成顺子还不够，也要满足弃牌来源的条件。', 'Completing a sequence is not enough; the discard must come from the right player.') },
      { kind: 'choice', prompt: L('你有两张红中，下家打出一张红中。可以？', 'You hold two red dragons. The next player discards another. What can you do?'), display: [31, 31], incoming: 31, source: L('下家的弃牌', 'Next player’s discard'), options: [choice('吃', 'Chow'), choice('碰', 'Pung'), choice('杠', 'Kong')], answer: 1,
        hint: L('接来以后有三张完全相同的牌。', 'Claiming it gives you three identical tiles.'), explain: L('可以碰。碰可接任意一家的弃牌；碰后直接打出一张手牌。', 'You may pung from any opponent. After exposing the triplet, discard without drawing.'), wrong: L('字牌不能吃；这里合计三张，还不是四张的杠。', 'Honors cannot form a chow. You would have three tiles, not the four needed for a kong.') },
      { kind: 'choice', prompt: L('你有三张五筒，对家打出第四张。要把四张都组成一组，应选？', 'You hold three 5 dots and an opponent discards the fourth. Which call uses all four?'), display: [13, 13, 13], incoming: 13, source: L('对家的弃牌', 'Opposite player’s discard'), options: [choice('吃', 'Chow'), choice('碰', 'Pung'), choice('明杠', 'Exposed kong')], answer: 2,
        hint: L('四张完全相同，叫杠子。', 'Four identical tiles form a quad.'), explain: L('明杠会亮出四张相同牌，但在胡牌结构中仍只算一组面子。这里选择杠是练习目标，并非每次都必须杠。', 'An exposed kong shows four identical tiles and counts as one set. Kong is the exercise goal, not a mandatory strategic choice.'), wrong: L('碰只用三张。本题要求把四张五筒全部组成一组。', 'Pung uses only three. This question asks you to use all four 5 dots.') },
      { kind: 'choice', prompt: L('宣布杠之后，下一步先做什么？', 'What comes immediately after declaring a kong?'), display: [13, 13, 13, 13], options: [choice('马上打牌', 'Discard immediately'), choice('补摸一张牌', 'Draw a replacement tile'), choice('直接结束一局', 'End the hand')], answer: 1,
        hint: L('杠比普通面子多用了一张，需要补摸。', 'A kong uses an extra tile, so a replacement is needed.'), explain: L('先补摸，再判断能否胡牌；不能胡再打牌。本版演示明杠，不模拟暗杠和加杠。', 'Draw a replacement, then check for a win or discard. This version demonstrates exposed kongs, not concealed or added kongs.'), wrong: L('不要跳过补摸。少了这一张，手牌数量就对不上。', 'Do not skip the replacement draw; it restores the hand’s tile count.') }
    ]
  },
  {
    title: L('找出能胡的牌', 'Find the winning tiles'), short: L('认识听牌与两面等待', 'Ready hands and two-sided waits'), minutes: 4, art: [3, 4, 5],
    summary: L('听牌是再来一张就能胡的状态。有时不止一个听口。', 'A ready hand needs one more tile to win. It can wait for more than one tile type.'),
    questions: [
      wait([0, 1, 2, 9, 10, 11, 18, 19, 20, 31, 31, 31, 27], [28, 27, 31, 0], L('只差一对将了。哪张能让这手牌胡？', 'The sets are complete. Which tile finishes the pair?'), L('四组面子已经齐了，剩下的是一张东风。', 'Four sets are complete, leaving one East wind.'), L('再来一张东风，组成一对将，就满足基本胡牌结构。', 'Another East wind makes the pair and completes the standard shape.')),
      wait([0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 3, 4], [2, 5, 3, 6], L('四万和五万在等什么？选出全部听口。', 'What do 4 and 5 characters wait for? Select every winning tile.'), L('四五可以接三，组成三四五；也可以接六，组成四五六。', '4–5 can take 3 to form 3–4–5, or 6 to form 4–5–6.'), L('三万和六万都能胡。这叫两面等待；同一手牌有时可以重新拆组。', 'Both 3 and 6 characters win. This is a two-sided wait; a hand may be regrouped.')),
      wait([0, 1, 2, 9, 10, 11, 18, 19, 20, 27, 27, 6, 8], [5, 6, 7, 8], L('七万和九万之间，缺哪张？', 'What fits between 7 and 9 characters?'), L('顺子不能跳号，七与九之间需要八。', 'A sequence cannot skip ranks. 7 and 9 need 8.'), L('只有八万补成七八九万。这种等待常叫嵌张。', 'Only 8 characters completes 7–8–9. This is a closed wait.'))
    ]
  },
  { title: L('完成第一手牌', 'Play your first hand'), short: L('摸牌 → 打牌 → 听牌 → 胡牌', 'Draw, discard, get ready, win'), minutes: 4, art: [27, 27, 5],
    summary: L('先摸再打，保持正确张数。等到需要的牌，检查四组面子和一对将。', 'Draw before discarding and keep the right tile count. Complete four sets and a pair to win.'), questions: [] }
];
