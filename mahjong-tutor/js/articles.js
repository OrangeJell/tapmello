import { L } from './i18n.js';

// Article IDs are permanent: related lessons and saved links depend on them.
export const articles = [
  {
    id: 'tiles', title: L('认识麻将牌与基本组合', 'Mahjong Tiles, Suits and Basic Sets'),
    lead: L('第一次看麻将，先分清牌上的图案。能认出万、筒、条和字牌，就可以开始做练习了。', 'Learn to recognise dots, bamboo, characters, winds and dragons, then use them to make pairs, sequences, triplets and quads.'),
    level: 'beginner', patterns: [],
    paragraphs: [L('一排麻将摆在面前，不用急着把所有术语都背下来。先看看哪些牌长得一样，哪些牌的数字连得上。后面学吃、碰、胡牌，都会用到这两件事。', 'Sort the tiles by suit and put identical tiles next to each other. Look for two copies of the same tile for a pair or three consecutive numbers within one suit for a sequence. A 4 of dots and a 4 of bamboo belong in different groups.')],
    sections: [
      { title: L('万、筒、条，分别看哪里', 'Recognising the three suits'), paragraphs: [
        L('万子最容易认，牌面上有“萬”字，上面是数字。一万到九万，各有四张。筒子看圆圈，圆圈的数量就是点数；有些圆圈会用不同颜色画出来，颜色只是图案的一部分。', 'Characters have the 萬 symbol with a number above it. They run from 1 to 9, with four copies of each. Dots use circles: count the circles to find the rank. The different ink colours are part of the design.'),
        L('条子画的是一节一节的竹条，也从一到九。不过一条常画成一只鸟，我们这里也是这样。看到鸟别把它当成另一种特殊牌，它就是一条。下面从左到右是一万、一筒、一条。', 'Bamboo tiles show bamboo sticks and also run from 1 to 9. The exception to the stick design is 1 bamboo, which often shows a bird, as it does here. The bird is simply the 1 of that suit. Below are 1 characters, 1 dots and 1 bamboo.')
      ], groups: [[0],[9],[18]], note: L('这三张数字都为一，但花色不同，是三种牌。', 'All three have rank 1, but they belong to different suits.') },
      { title: L('字牌不用数数字', 'Honors have names rather than ranks'), paragraphs: [
        L('东、南、西、北是四张风牌，中、发、白是三张箭牌，合起来叫字牌。白板有时只画一个框，看着像没写字，也是一种正常的麻将牌。', 'East, South, West and North are the four winds. Red, Green and White are the three dragons. Together they are called honors. White dragon may look almost blank, with only a border, but it is a normal tile.'),
        L('字牌之间没有一二三这样的数字关系。“东南西”虽然读起来顺口，也不能凑成顺子。你可以把相同的东风放在一起，却不能因为它们都是风牌，就把不同的风当成同一种牌。', 'Honors have no numbered order for making sequences. East–South–West cannot form a sequence. Identical Easts can be grouped together, but different winds are still different tile types.')
      ], groups: [[27],[28],[29],[30],[31],[32],[33]], note: L('三种数牌各九种，加七种字牌，一共 34 种；每种四张，就是 136 张。本教程不使用花牌。', 'Three suits of nine types, plus seven honors, give 34 types. Four copies of each make 136 tiles. Flower tiles are not used here.') },
      { title: L('两张一样的叫对子，做将时也用它', 'Two identical tiles make a pair'), paragraphs: [
        L('把两张东风并排放好，这就是一个对子。两张三万也可以，两张白板也可以。关键是完全相同，数字相同但花色不同不算。', 'Two Easts make a pair. So do two 3 characters or two White dragons. The tiles must match exactly; matching ranks in different suits are not enough.'),
        L('“将”不是一种新牌。等你检查基本胡牌时，会留出一对牌，专门放在四组面子旁边，那一对就叫将。手里可以暂时有好几对，最后哪一对做将，要看整手牌怎么组合。', 'The pair in a standard winning hand is not a special tile type. It is simply the pair left alongside the four sets. You may hold several pairs while playing; the rest of the hand determines which one will be the final pair.')
      ], pattern: 'pair' },
      { title: L('顺子要同花色，还得连着', 'A sequence stays within one suit'), paragraphs: [
        L('二万、三万、四万，数字连着，花色也相同，所以是一组顺子。一二三筒、七八九条也一样。不要只看数字：二万、三筒、四条虽然写着二三四，却拼不成顺子。', '2–3–4 characters is a sequence because the ranks are consecutive and the suit stays the same. So are 1–2–3 dots and 7–8–9 bamboo. Mixing 2 characters, 3 dots and 4 bamboo does not work.'),
        L('一组顺子恰好三张。四五六七万是四张相连的牌，可以从里面取出一组顺子，但不能把四张一起算成一组。九后面也不能接一。', 'A sequence contains exactly three tiles. From 4–5–6–7 characters you can choose a sequence, but all four tiles do not count as one set. The ranks also do not wrap from 9 back to 1.')
      ], pattern: 'chow' },
      { title: L('三张一样是刻子，四张一样是杠子', 'Triplets and quads use identical tiles'), paragraphs: [
        L('三张红中是一组刻子，三张五筒也是。字牌不能组成顺子，却能组成刻子，所以手里的风牌、箭牌也有用。', 'Three Red dragons form a triplet, as do three 5 dots. Honors cannot form sequences, but they can form triplets.'),
        L('看到“刻子”和“碰”时，先分清它们说的事：刻子是组合的名字，碰是接别人弃牌来组成刻子的动作。你自己摸齐三张相同牌，也有刻子，并不需要先碰一次。', 'A triplet is the name of a group. Pung is the action of claiming a discard to form that group. You can also draw all three identical tiles yourself; the group is still a triplet without a pung claim.')
      ], pattern: 'pung' },
      { title: L('先认得杠子，补摸以后再练', 'Recognise the quad before practising a kong'), paragraphs: [
        L('四张相同牌可以组成杠子。它虽然多了一张，计算胡牌的组数时仍只算一组面子。杠涉及补摸，初学时先记住“做成杠以后，要补一张牌”，到吃碰杠那篇再看具体张数。', 'Four identical tiles can form a quad. It has one more tile than a triplet but still counts as one set in a winning hand. Declaring a kong requires a replacement draw; the turn-sequence guide explains the counts step by step.'),
        L('认牌练习里可以先开着牌名。等万、筒、条看熟了，再在设置里关掉。遇到一条或白板拿不准，打开牌谱点一下，就能看到完整名字。', 'Keep tile names visible for the first exercises. Once the pictures are familiar, turn the names off in Settings. If you are unsure about the bird or White dragon, tap it in the tile reference to see its full name.')
      ], pattern: 'kong' }
    ]
  },
  {
    id: 'winning', title: L('基本胡牌与听牌', 'Winning Mahjong Hands: Four Sets and a Pair'),
    lead: L('拿到 14 张牌，还要能把它们分好组，才算胡牌。先从最常见的“四组加一对”看起。', 'See what makes a standard Mahjong hand win, how to check four sets and a pair, and which tile finishes a hand that is one short.'),
    level: 'intermediate', patterns: [],
    paragraphs: [L('听到别人说“我胡了”，可以先看他把牌分成了什么样。初级和中级练习只用一种结构：四组面子，再加一对将。七对、十三幺会在高级里单独讲，现在不用一起记。', 'In the beginner and intermediate exercises, test a win by setting out four groups and a pair. Use each tile once, including any sets already exposed. The advanced lessons introduce exceptions such as Seven Pairs and Thirteen Orphans.')],
    sections: [
      { title: L('面子和将，分别占多少张', 'Counting the sets and the pair'), paragraphs: [
        L('面子可以是顺子，也可以是刻子。没有杠时，每组都是三张，四组就是 12 张，再加两张相同的将，合起来 14 张。数牌和字牌都能做将，不要求一定留东风或红中。', 'A set may be a sequence or a triplet. Without kongs, four sets use 12 tiles, and the pair adds two more: 14 altogether. Either suited tiles or honors can be the pair; it does not have to be East or Red dragon.'),
        L('下面这手，一二三万、一二三筒、一二三条各是一组顺子，三个红中是一组刻子，两个东风做将。每张牌都用上了，也没有哪张牌被用两遍。', 'In the example, 1–2–3 characters, dots and bamboo make three sequences. Three Red dragons make the fourth set, and two Easts form the pair. Every tile is used exactly once.')
      ], pattern: 'standard' },
      { title: L('为什么凑够 14 张还可能不能胡', 'Why 14 tiles may still fail'), paragraphs: [
        L('张数只是第一步。比如把上面的三个红中换成东、南、西，虽然总数没变，但东南西不是顺子，也不是刻子，整手牌就少了一组面子。', 'The count is only the first check. If you replace the three Red dragons above with East, South and West, the total stays the same. But those winds are neither a sequence nor a triplet, so one set is missing.'),
        L('检查时可以先圈出明显的刻子、顺子，再找对子。如果剩下几张怎么都拼不上，试着换一对牌做将，或者把原来圈出的顺子拆开重排。有些牌能有不止一种拆法，第一次没拼出来，不一定是真的不能胡。', 'Start with obvious triplets and sequences, then look for the pair. If the remaining tiles do not fit, try a different pair or regroup a sequence. A hand may have more than one possible arrangement, so a failed first attempt does not settle it.')
      ] },
      { title: L('听牌，就是还差一张能胡', 'A waiting hand needs one more tile'), paragraphs: [
        L('假设你已经有三组面子、一对将，还剩四万和五万。现在是 13 张。来三万，就能组成三四五；来六万，就能组成四五六。无论哪一张来了，都能补齐第四组面子，这就叫听三万、六万。', 'Suppose you have three complete sets, a pair, and 4–5 characters: 13 tiles. Adding 3 makes 3–4–5; adding 6 makes 4–5–6. Either completes the fourth set, so the hand waits for 3 or 6 characters.'),
        L('“听口”说的是能让这手牌胡的牌。听牌本身还没胡，你仍需要等到合适的牌。做练习时要选齐所有听口，不要找到三万就停下，六万也要检查。', 'A winning tile is one that completes the hand. Being ready is not a win yet: you still need that tile. In the exercises, select every winning tile. Finding 3 characters is not a reason to stop checking 6.')
      ], groups: [[9,10,11],[18,19,20],[31,31,31],[27,27],[3,4]], note: L('这手的全部听口是三万、六万。每次只加其中一张来检查，不能把两张同时加进去。', 'This hand waits for 3 and 6 characters. Test each addition separately; do not add both tiles at once.') },
      { title: L('听顺子和等一对将，差在哪里', 'Waiting for a sequence or for the pair'), paragraphs: [
        L('刚才的四五万是在等一组顺子。如果四组面子都齐了，剩下单独一张东风，就该等第二张东风配成将。这叫单钓。别因为前面一直在凑三张，就把最后的将也当成三张来等。', 'The 4–5 characters example waits for a sequence. If all four sets are complete and only a single East remains, the hand needs a second East to make the pair. This is a single wait. The final pair needs two tiles, even though the sets need three.'),
        L('两面、嵌张、边张、单钓、双碰都是描述等待形状的名字。名字暂时记不住也没关系：把候选牌放进手里，能不能完整拆成四组加一对，才是这道练习的判断依据。', 'Two-sided, closed, edge, single and double-pair waits are names for different waiting shapes. If a name slips your mind, add the candidate tile and check whether the whole hand forms four sets and a pair.')
      ] },
      { title: L('能胡这张牌，不等于一定摸得到', 'A legal winning tile may be unavailable'), paragraphs: [
        L('每种牌只有四张。你手里已经有四张，就不可能再等第五张；练习会排除这种情况。牌局里还要看桌上已经出现了多少张。', 'There are only four copies of each tile. If you already hold all four, you cannot wait for a fifth; the exercises reject that case. In a game, you would also look at the copies already visible on the table.'),
        L('这套听牌练习主要练“哪张牌加进来能成立”，没有模拟别人的手牌和实际牌墙。答对后点开拆牌结果，把自己的想法和示例比一比，比只记答案更容易弄懂。', 'These waiting exercises focus on which additions make a valid hand. They do not simulate opponents or the remaining wall. After answering, open the breakdown and compare its groups with your own arrangement.')
      ] }
    ]
  },
  {
    id: 'calls', title: L('吃碰杠及回合流程', 'Mahjong Calls: Chow, Pung and Kong'),
    lead: L('先记住普通回合是“摸一张，打一张”。吃、碰、杠会改变中间的步骤，容易弄混的地方就在这里。', 'Learn whose discard you can claim for chow, pung or kong, and when you draw a replacement tile before discarding.'),
    level: 'intermediate', patterns: [],
    paragraphs: [L('“吃”不是看到顺子就能喊，“碰”也不是手里有对子就能喊。它们都要接上别人刚打出的那张牌，和自己手里的牌一起组成一组，再把这组牌亮出来。亮在外面的组合叫副露。', 'When you call chow or pung, combine the latest discard with two tiles from your hand and show the set. These calls are also written chi and pong. The three tiles count toward your hand even though they now sit face up.')],
    sections: [
      { title: L('没有接牌时，轮到你就先摸再打', 'A normal turn starts with a draw'), paragraphs: [
        L('先以没有杠、没有副露的情况来看：你在等轮次时有 13 张，轮到你摸进一张，暂时变成 14 张。如果不能胡，就从里面选一张打出去，又回到 13 张。', 'With no kongs or exposed sets, you have 13 tiles between turns. Your draw brings the hand to 14. If you do not win, choose one tile to discard, returning to 13.'),
        L('刚摸到的牌不用非得留下。你可以打别的牌，也可以把新摸到的那张打掉。教学引导局会指定要打哪张，目的是让你熟悉这个流程。', 'You do not have to keep the tile you just drew. You may discard it or a different tile. The guided exercise asks for particular discards so you can practise the sequence.')
      ] },
      { title: L('吃：用上家的弃牌接成顺子', 'Chow uses the previous player’s discard'), paragraphs: [
        L('上家就是按轮次在你前面出牌的人。按这里的规则，你只能吃上家的弃牌，不能吃对家、下家的牌。手里有二万、四万，上家打出三万，才能把三张凑成二三四。', 'The previous player is the one whose normal turn comes immediately before yours. Here, only that player’s discard can be used for chow. Holding 2 and 4 characters, you can claim their discarded 3 to make 2–3–4.'),
        L('吃成以后，把这三张亮出来，再从自己的手牌里打出一张。中间不要再摸牌，因为接进来的那张弃牌已经让你多拿了一张。', 'After claiming, expose the three-tile sequence and discard a tile from your hand. Do not draw in between: the claimed discard has already supplied the extra tile.')
      ], pattern: 'chow' },
      { title: L('碰：用两张相同牌接第三张', 'Pung adds a third matching tile'), paragraphs: [
        L('手里有两张红中，任意一家打出红中，你就有碰的条件。碰不要求对方是上家，但你手里必须有两张完全相同的牌，只有一张不够。', 'With two Red dragons in hand, you can pung a Red dragon discarded by any opponent. The discarder need not be the previous player, but you must already hold two matching tiles.'),
        L('碰成的三张同样要亮出来，然后打出一张，别再摸。别人打出的牌只拿来完成这次组合，不是先收进手里，再随便改成别的组合。', 'Expose the triplet and discard from your hand without drawing. The claimed tile completes that particular set; it is not a free tile to keep and rearrange later.')
      ], pattern: 'pung' },
      { title: L('明杠：接第四张，再补摸一张', 'Exposed kong takes the fourth copy'), paragraphs: [
        L('手里有三张五筒，别人打出第四张五筒，可以组成明杠。四张一起亮出来，接着补摸一张。补摸以后，先看能不能胡，不能胡再选牌打出。', 'With three 5 dots in hand, you can claim the fourth copy for an exposed kong. Show all four tiles, then take a replacement draw. Check for a win before discarding.'),
        L('为什么杠要补摸？因为它用四张牌占一组面子的位置，比顺子、刻子多用了一张。如果不补回来，剩下的手牌就少了一张，后面的组合凑不齐。这也是有杠的胡牌实际可能多于 14 张的原因。', 'A quad uses four tiles for one set, one more than a sequence or triplet. Without a replacement, the remaining hand would be a tile short. This is why a winning hand containing a kong has more than 14 physical tiles.')
      ], pattern: 'kong' },
      { title: L('拿一手 13 张的牌，数一遍变化', 'Follow the counts from a 13-tile hand'), paragraphs: [
        L('假设之前没有副露。吃或碰时，从手里拿出两张，再接一张弃牌，桌上亮出三张，手里剩 11 张。然后打掉一张，手里剩 10 张，桌上的三张仍然属于你的牌。', 'Starting with no exposed sets, chow or pung takes two tiles from your hand and adds the claimed discard. You expose three tiles and have 11 left concealed. Discard one, leaving ten concealed; the exposed three still belong to your hand.'),
        L('明杠则从手里拿出三张，接上第四张亮出，手里先剩 10 张。补摸后变成 11 张，再出牌后剩 10 张。对照这两段，会发现吃碰和杠最后手里的数量一样，但杠在外面多亮了一张。', 'For exposed kong, take three tiles from your hand and expose them with the fourth copy. Ten remain concealed. The replacement draw makes 11, and the discard returns that to ten. The concealed counts match, but the kong has one extra exposed tile.')
      ] },
      { title: L('能接也可以不接', 'You may decline a claim'), paragraphs: [
        L('看到能吃、能碰的牌，可以选择不接，让轮次继续。刚学时先把动作做对，再考虑要不要做。尤其要记得：亮出去的顺子、刻子不能拆回来重新排列。', 'An available chow or pung is optional. You can let the discard pass and allow play to continue. First learn the action itself, then consider whether you want it. Once exposed, a sequence or triplet cannot be taken back apart.'),
        L('这几节只练普通摸打、吃、碰、明杠。暗杠、加杠和多人同时要同一张牌的处理，先不混进来；换到具体地方规则时，再单独确认那些细节。', 'These lessons cover normal turns, chow, pung and exposed kong. Concealed kongs, added kongs and competing claims are left for a separate explanation under the particular rules being played.')
      ] }
    ]
  },
  {
    id: 'advanced', title: L('常见进阶牌型', 'Mahjong Hand Patterns: Seven Pairs and More'),
    lead: L('学会四组加一对以后，再来认七对、十三幺和几种常见牌型。先看它怎么组成，不急着背番数。', 'Compare Seven Pairs, Thirteen Orphans, All Triplets and the two flushes using tile diagrams from the advanced Mahjong lessons.'),
    level: 'advanced', patterns: [],
    paragraphs: [L('“七对”和“清一色”听起来都是牌型名，但检查的地方不一样。七对看牌能不能分成七个对子；清一色看胡牌里是不是只有一种数牌花色。所以，同一手牌有可能同时有两个名字。', 'Seven pairs and full flush both name patterns, but they check different things. Seven pairs describes the arrangement; full flush describes the suits in a winning hand. One hand can satisfy both.')],
    sections: [
      { title: L('先弄懂这里说的门清', 'What closed means in these examples'), paragraphs: [
        L('吃、碰、明杠会把一组牌亮在外面，叫副露。这里讲的七对和十三幺，都要求没有副露，整手牌按各自的结构检查。已经碰出去的一组刻子，不能再拆成对子拿回来算七对。', 'Chow, pung and exposed kong put a set face up outside the concealed hand. The seven-pairs and thirteen-orphans examples here require no exposed sets. A triplet already claimed by pung cannot be taken apart to supply a pair.'),
        L('各地对特殊牌型可能有不同规定。下面按本教程的约定讲，特别是七对：需要七种不同的对子，四张相同牌不能拆成两对来算。', 'Special-hand rules vary. This guide uses the tutorial’s conventions, including seven distinct pairs: four identical tiles do not count as two pairs.')
      ] },
      { title: L('七对：每两张配一对', 'Seven pairs: match the tiles in twos'), paragraphs: [
        L('把牌两张两张摆好，如果正好是七种不同的对子，总共 14 张，就有七对结构。这里不需要再找四组顺子或刻子，也不用另外挑一对出来做将。', 'Arrange the hand in twos. Seven different pairs use all 14 tiles and form the seven-pairs structure. You do not need four sets or an additional pair on top of those seven.'),
        L('容易看错的是四张相同牌。比如四张一万，加五种别的对子，虽然也有 14 张，按本教程仍不算七对。数一数种类，只有六种，不够七种。', 'The common trap is a four-of-a-kind. Four 1 characters plus five other pairs still totals 14 tiles, but it is not seven pairs here. It contains only six distinct tile types.')
      ], pattern: 'seven-pairs' },
      { title: L('十三幺：先凑齐十三种，再重复一种', 'Thirteen orphans: one of each, plus a duplicate'), paragraphs: [
        L('“幺九”在这里指一和九。万、筒、条各拿一张一和一张九，就是六种；再加东南西北、中发白七种字牌，一共十三种。每一种都得有，缺哪一种都不行。', 'The numbered tiles here are the terminals: 1 and 9 of characters, dots and bamboo, giving six types. Add the four winds and three dragons for thirteen types. Every one must be present.'),
        L('十三种各一张只有 13 张，还要再重复其中任意一种，才是 14 张。重复东风可以，重复九条也可以。二到八的数牌不在这十三种里，不能拿来顶替缺少的一万或白板。', 'One of each gives 13 tiles. Add one more copy of any of those types to reach 14. An extra East or 9 bamboo works; a suited rank from 2 through 8 cannot replace a missing terminal or honor.')
      ], pattern: 'thirteen-orphans' },
      { title: L('碰碰胡：四组都要是相同牌', 'All triplets: no sequences among the four sets'), paragraphs: [
        L('碰碰胡仍然是四组面子加一对将，只不过四组里不能有顺子，必须是刻子或杠子。将还是两张相同牌，不是把最后两张也凑成三张。', 'All triplets still uses four sets and a pair. The four sets must be triplets or quads, with no sequences. The final pair remains two identical tiles.'),
        L('名字里有“碰”，并不要求四组都从别人那里碰来。自己摸成的刻子也算。反过来，碰了两组以后，剩下的牌里有一组顺子，即使能胡，也不能叫碰碰胡。', 'The name does not mean every triplet must come from a pung claim. Triplets you drew yourself count too. Conversely, claiming two pungs does not make the whole hand all triplets if another set is a sequence.')
      ], pattern: 'all-pungs' },
      { title: L('清一色：能胡，而且只有一种数牌', 'Full flush: a win using one numbered suit'), paragraphs: [
        L('先确认这手牌确实能胡，再看花色。所有牌都是万子，可以是清一色；全筒或全条也可以。只要夹了一张字牌，就不符合这里的清一色条件。', 'First check that the hand wins, then check its suits. All characters, all dots or all bamboo can make a full flush. Any honor tile prevents this classification.'),
        L('全是万子却拼不成任何合法胡牌结构，仍然不能胡。“一色”不会把原本散乱的 14 张自动变成胡牌。', 'A hand made entirely of characters still fails if it cannot form a legal winning structure. The suit alone does not make fourteen ungroupable tiles a win.')
      ], pattern: 'full-flush' },
      { title: L('混一色：一种数牌，加上字牌', 'Half flush: one numbered suit together with honors'), paragraphs: [
        L('万子加东风、红中这类字牌，可以考虑混一色；筒子加字牌、条子加字牌也一样。要同时有数牌和字牌，而且数牌只能来自一种花色。', 'Characters together with honors such as East and Red dragon may form a half flush. Dots or bamboo with honors work the same way. Both suited tiles and honors must be present, and the suited tiles must all share one suit.'),
        L('只有万子没有字牌，应该看清一色；万子和筒子都有，即使还带着字牌，也不算混一色。这里的“混”不是让三种花色随便混在一起。', 'Characters without honors belong under full flush. Characters mixed with dots are not a half flush, even if honors are also present.')
      ], pattern: 'half-flush' },
      { title: L('一手牌可以同时是七对和清一色', 'Seven pairs and full flush can describe the same hand'), paragraphs: [
        L('下面每个数字都是一对，一共七种，而且全部是万子。检查组合时，它是七对；检查花色时，它又是清一色。这两个名字不冲突。', 'In the example, seven different ranks each appear twice, all in characters. The arrangement is seven pairs and the suit pattern is full flush. The two descriptions are compatible.'),
        L('高级练习会让你分别看结构、看花色，再做组合辨识。这一版不计算番数，所以不用猜哪个牌型“更大”；先把成立条件看明白。', 'Advanced exercises ask you to check structure and suits separately, then recognise compatible patterns. This version does not score fan, so focus on the conditions rather than which pattern pays more.')
      ], groups: [[0,0],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6]], note: L('七对与清一色都成立；这手也有基本胡牌的拆法，符合一种结构并不排斥其他有效拆法。', 'Seven pairs and full flush both apply. This particular hand also has a standard decomposition; one valid arrangement does not rule out another.') }
    ]
  },
  {
    id: 'organize-hand', title: L('如何整理手牌：从散牌看出组合', 'How to Organise a Mahjong Hand'),
    lead: L('牌太乱时，很难看出缺什么。把一手牌慢慢排开，再看哪些已经成组、哪些还差一张。', 'Sort a Mahjong hand by suit, mark the sets you already have and use the tiles left over to see where a draw could help.'),
    level: 'beginner', patterns: [],
    paragraphs: [L('刚拿到牌，可以先花一点时间整理。顺序不影响规则，怎么摆顺手就怎么摆；不过同花色放一起、数字从小到大，会让找对子和顺子省事很多。', 'Take a moment to organise a new hand. The order you display tiles in does not change the rules, but keeping suits together and ranks in order makes pairs and sequences easier to spot.')],
    sections: [
      { title: L('把三种花色分开，字牌放一起', 'Separate the suits and keep honors together'), paragraphs: [
        L('先把万、筒、条分开。每一堆从一排到九，相同数字靠在一起，最后再把东南西北、中发白放好。不需要追求某个固定左右顺序，只要你自己看得清。', 'Separate characters, dots and bamboo. Put each suit in rank order with identical tiles adjacent, then organise the honors. There is no required left-to-right order; choose one you can read easily.'),
        L('排好之后再数张数。没有副露、没有杠时，等轮次是 13 张，摸完还没打是 14 张。刚开始学，发现牌不对劲，可以先数一下，免得把少牌、多牌误当成不会组牌。', 'Count the tiles after sorting. With no exposed sets or kongs, there are 13 between turns and 14 after drawing but before discarding. A count check can reveal a missing or extra tile before you try to solve the groups.')
      ], groups: [[0,1,2],[3,4],[9,10,11],[18,20],[27,27],[29]], note: L('后面几段都用这手 13 张牌来看：万子五张、筒子三张、条子两张、字牌三张。', 'The following steps use this 13-tile hand: five characters, three dots, two bamboo and three honors.') },
      { title: L('先找已经完整的三张', 'Find the complete sets first'), paragraphs: [
        L('一二三万和一二三筒已经各是一组顺子，可以先在心里记下来。两个东风是一对。剩下四五万、一三条、西风，才是接下来需要多留意的部分。', '1–2–3 characters and 1–2–3 dots are already sequences. Note those, along with the pair of Easts. That leaves 4–5 characters, 1–3 bamboo and West to inspect.'),
        L('这里把牌隔开画，只是为了看清分组。它们都还是手牌，没有因为排成一组就变成副露，也没有被锁住不能再拆。', 'The spaces in the diagram help show possible groups. These tiles are all still concealed; arranging them does not expose them or prevent later regrouping.')
      ] },
      { title: L('再看差一张的两张牌', 'Look at the two-tile groups next'), paragraphs: [
        L('四五万可以接三万或六万，接上就有一组顺子。一三条中间缺二条，只有补上二条，这两张才连成一二三。它们都差一张，但能接的牌种不一样。', '4–5 characters can take either 3 or 6 to make a sequence. 1–3 bamboo needs 2 in the middle. Both groups lack one tile, but the possible additions differ.'),
        L('看见两张挨得近的牌，不要马上当作一组已经完成。四五只有两张，一三还隔着一张，都不能直接算进胡牌需要的四组面子里。', 'A promising two-tile group is not a completed set. 4–5 has only two tiles, and 1–3 has a gap. Neither counts as one of the four finished sets yet.')
      ], groups: [[3,4],[18,20]], note: L('四五万可接三万、六万；一三条可接二条。这里只讨论这两个局部组合，还没有说整手已经听牌。', '4–5 characters takes 3 or 6; 1–3 bamboo takes 2. These are local improvements, not a claim that the whole hand is already ready to win.') },
      { title: L('单张先记下来，别机械地全打掉', 'Notice isolated tiles without discarding automatically'), paragraphs: [
        L('这手里的西风暂时没有同伴。它不能和东风拼成顺子，也没有第二张西风做对子，所以目前是单张。把它找出来，是为了知道哪一部分还没搭上。', 'West has no partner in this hand. It cannot make a sequence with East, and there is no second West for a pair. It is isolated for now; identifying it tells you which part of the hand has no connection yet.'),
        L('“单张”不等于“任何时候都应该打”。后面可能摸到相同的牌，整手的目标也可能变。入门阶段先练会描述手牌：几组完整、几组未完成、几张单独，再慢慢学取舍。', 'Isolated does not mean it must always be discarded. A matching draw or a different hand plan may change its role. First learn to describe what you hold: complete sets, unfinished groups and isolated tiles.')
      ] },
      { title: L('摸到新牌，原来的分组可以改', 'A new draw can change the grouping'), paragraphs: [
        L('比如手里有四五六七万。拿四五六做顺子，就留下七万；拿五六七做顺子，就留下四万。两种都能排，但它们共用了五万和六万，不能同时算成两组。', 'With 4–5–6–7 characters, taking 4–5–6 leaves 7, while taking 5–6–7 leaves 4. Both arrangements are possible, but they share the same 5 and 6 and cannot count as two sets simultaneously.'),
        L('所以，理牌后不要只盯着自己最早分好的那几组。新牌进来时，连着旁边的牌一起看。最后检查胡牌，每张实体牌只能用一次，不能在两组里各算一次。', 'Do not look only at the groups you noticed first. When a tile arrives, check its neighbours too. In a winning decomposition, each physical tile can be used only once.')
      ], groups: [[3,4,5,6]], note: L('这是同一批四张牌的两种可能拆法，不是两组独立的顺子。', 'These four tiles permit two alternative choices, not two separate sequences.') },
      { title: L('用刚才那手牌检查自己有没有看懂', 'Check what you can identify in the example'), paragraphs: [
        L('回到开头那手牌：已经完整的是一二三万、一二三筒；东风是一对；四五万和一三条各差一张；西风暂时单独。现在还缺两组完整面子，所以它并不是“随便补一张就胡”。', 'Return to the first hand: 1–2–3 characters and dots are complete, East is a pair, 4–5 characters and 1–3 bamboo each need a tile, and West is isolated. Two complete sets are still missing, so the hand cannot win with just any one addition.'),
        L('如果你能不看说明，把这几部分自己找出来，就可以到初级做组合练习。暂时不需要猜哪张弃牌最厉害，先保证自己没有把两张当三张，也没有漏看一对相同牌。', 'If you can find those parts without the explanation, try the beginner grouping exercises. For now, focus on recognising the groups correctly rather than predicting the best strategic discard.')
      ] }
    ]
  },
  {
    id: 'waiting-shapes', title: L('五种常见听牌：找齐所有听口', 'Five Mahjong Waits and Their Winning Tiles'),
    lead: L('听牌最容易漏的是“其实还能胡另一张”。拿五手完整的牌练一遍，比只背两面、嵌张这些名字更直观。', 'Use five tile diagrams to recognise two-sided, closed, edge, single and double-pair waits. Test each candidate against the whole hand.'),
    level: 'intermediate', patterns: [],
    paragraphs: [L('下面每个例子都是 13 张，没有副露，按四组面子加一对将判断。先找到已经成组的部分，再把剩下的一两组拿出来看。每次试加一张牌，能把全手安排好才算一个听口。', 'Each example has 13 concealed tiles and uses four sets and a pair. Identify the complete groups first, then inspect what remains. Test one added tile at a time; it counts as a wait only if the entire hand fits.')],
    sections: [
      { title: L('两面：四五万，两头都能接', 'Two-sided wait: either end of 4–5'), paragraphs: [
        L('这手的一二三筒、一二三条、三个红中已经是三组面子，两个东风做将。现在只剩四万、五万，差的是第四组面子。', '1–2–3 dots, 1–2–3 bamboo and three Red dragons are complete sets. Two Easts supply the pair. Only 4–5 characters remains, waiting to become the fourth set.'),
        L('加三万，得到三四五；加六万，得到四五六。这就是两面。检查到三万以后，顺着数字再往另一头看一下，就不容易漏掉六万。加四万或五万虽然会多一个对子，却仍然没有第四组面子。', 'Add 3 for 3–4–5, or 6 for 4–5–6: a two-sided wait. After finding one end, check the other. Adding another 4 or 5 would create a pair locally, but would not supply the missing fourth set.')
      ], groups: [[9,10,11],[18,19,20],[31,31,31],[27,27],[3,4]], note: L('全部听口：三万、六万。', 'All winning tiles: 3 and 6 characters.') },
      { title: L('嵌张：四和六之间缺五', 'Closed wait: fill the gap between 4 and 6'), paragraphs: [
        L('把刚才的四五万换成四万、六万，其他部分不动。这次中间缺五万，补上后才是四五六。它不像两面那样两头都能接。', 'Replace 4–5 characters with 4 and 6, leaving the rest unchanged. The gap needs 5 to make 4–5–6. Unlike the previous example, neither outside end works.'),
        L('可以把三万放进去试试：三、四、六，中间还缺五。七万也一样，四、六、七并不连续。这样的中间等待叫嵌张。字不熟时，只记“缺中间那张”就能做题。', 'Try adding 3: 3–4–6 still has a gap. Adding 7 gives 4–6–7, which is not consecutive either. This is a closed wait; thinking “missing the middle” is enough to recognise it.')
      ], groups: [[9,10,11],[18,19,20],[31,31,31],[27,27],[3,5]], note: L('全部听口：五万。', 'All winning tiles: 5 characters.') },
      { title: L('边张：一二只能等三', 'Edge wait: 1–2 can only take 3'), paragraphs: [
        L('一万、二万虽然相邻，却不是两面。它们往右能接三万，往左没有零万可接，所以只有一个方向。这就叫边张。另一头的八九，等的是七。', '1–2 characters are adjacent, but do not make a two-sided wait. They can take 3 on one side, while rank 0 does not exist on the other. This is an edge wait. At the other edge, 8–9 needs 7.'),
        L('不要把九万接在一二前面。麻将里的顺子不会绕圈，九一二不连续。下面这手仍然保留原来的三组面子和一对将，只把最后两张换成了一二万。', '9 characters cannot join 1–2. Sequences do not wrap around, so 9–1–2 is invalid. The example keeps the same three complete sets and pair, with 1–2 characters at the end.')
      ], groups: [[9,10,11],[18,19,20],[31,31,31],[27,27],[0,1]], note: L('这手的全部听口：三万。八九等七是另一个边张例子，不是这手的听口。', 'This hand waits only for 3 characters. The 8–9 example explains the other edge; it is not an additional wait for this hand.') },
      { title: L('单钓：四组齐了，等另一张东风', 'Single wait: the four sets are done'), paragraphs: [
        L('这次一二三万也已经齐了，加上一二三筒、一二三条和三个红中，四组面子全部完成。剩下一个东风，还没找到自己的另一半。', 'Here, 1–2–3 characters is complete too. Along with the dots sequence, bamboo sequence and Red triplet, that makes four sets. A single East remains without a partner.'),
        L('再来一个东风，两张就做将，这叫单钓。不要去找第五组面子，也不能拿别的风牌和东风拼成一对。南风和东风都是字牌，但不是同一种牌。', 'Another East supplies the pair: a single wait. There is no need for a fifth set. A different wind cannot pair with East; East and South are both honors but are not identical tiles.')
      ], groups: [[0,1,2],[9,10,11],[18,19,20],[31,31,31],[27]], note: L('全部听口：东风。', 'All winning tiles: East.') },
      { title: L('双碰：两对里，一对变成刻子', 'Double-pair wait: one pair becomes a triplet'), paragraphs: [
        L('这手有三组完整面子，剩下两个东风、两个南风。两对都还只有两张，不能把它们一起当作第四组面子。', 'This hand has three complete sets, plus pairs of East and South. Each pair has only two tiles; they cannot together count as the fourth set.'),
        L('来东风时，三个东风做刻子，南风做将；来南风时，三个南风做刻子，东风做将。两种牌都能胡，所以两个都要选。“双碰”是在描述这个等待形状，不是让你连续碰两次。', 'An East makes an East triplet with South as the pair. A South makes a South triplet with East as the pair. Both win, so select both. Double-pair wait describes the shape; it is not an instruction to make two pung claims.')
      ], groups: [[9,10,11],[18,19,20],[31,31,31],[27,27],[28,28]], note: L('全部听口：东风、南风。', 'All winning tiles: East and South.') },
      { title: L('遇到没见过的牌形，逐张试进去', 'Test candidate tiles when the shape looks unfamiliar'), paragraphs: [
        L('这五手故意把已经完成的部分分得很清楚，方便你看出差在哪里。换一手牌以后，有些顺子会连在一起，还可能换一对牌做将，听口就不能只盯着最右边的两张来猜。', 'These examples separate the finished groups clearly. In another hand, sequences may overlap or a different pair may work. Do not assume that only the last two tiles determine the waits.'),
        L('练习时先自己选，再点确认。漏选了，就把没选的候选牌分别加进去看一次；答对了，打开每个听口的拆牌结果。这里算的是能不能组成胡牌，不保证这种牌在真实牌墙里还有剩余。', 'Make your selection before checking. If you missed a tile, add each unselected candidate separately and inspect the result. After a correct answer, open each winning breakdown. These are structural waits, not a guarantee that copies remain in a real wall.')
      ] }
    ]
  },
  {
    id: 'claim-choices', title: L('吃碰杠怎么选：先看组合，再看下一步', 'When to Call Chow, Pung or Kong in Mahjong'),
    lead: L('能吃、能碰的时候，先别急着动手。看看要拿出哪两张、接完以后还剩什么，动作就不容易做错。', 'A legal claim can still leave an awkward hand. Compare what stays concealed after each chow, and check whether pung or kong gives you the next move you want.'),
    level: 'intermediate', patterns: [],
    paragraphs: [L('这一篇接着“吃碰杠及回合流程”往下讲。前一篇解决动作怎么做，这里拿具体牌例来看：有几种选法，选择以后手牌会怎样变化。先把这些看清楚，再慢慢学实战中的取舍。', 'With 1, 2, 4 and 5 characters in hand, a discarded 3 can finish three different sequences. Try each one on paper and look at the two tiles it leaves. Those leftovers are where the choices start to differ.')],
    sections: [
      { title: L('同一张弃牌，可能有三种吃法', 'One discard may allow three different chows'), paragraphs: [
        L('假设你手里有一、二、四、五万，上家刚打出三万。用一万、二万去接，是一二三；用二万、四万去接，是二三四；用四万、五万去接，是三四五。', 'Suppose you hold 1, 2, 4 and 5 characters and the previous player discards 3. Using 1 and 2 makes 1–2–3; using 2 and 4 makes 2–3–4; using 4 and 5 makes 3–4–5.'),
        L('这三种都符合吃的条件，但一次只能选一组。别把五张全拿出去，也别选完一二三，又把同一张三万拿去算三四五。那是一张实体牌，只能属于一组。', 'All three choices are legal, but you can make only one of them. Do not expose all five tiles or use the same claimed 3 in two sequences. It is one physical tile and belongs to one set.')
      ], groups: [[0,1,3,4],[2]], note: L('前面四张是手里的相关牌，最后一张三万是上家的弃牌。这里只截取了手牌的一部分。', 'The first four tiles are the relevant tiles in your hand; the final 3 is the previous player’s discard. This diagram shows only part of the hand.') },
      { title: L('把剩下的牌也算进去', 'Compare what each choice leaves'), paragraphs: [
        L('吃一二三以后，手里这部分剩四五万；吃二三四，剩一五万；吃三四五，剩一二万。刚才三种都能吃，但留下来的牌并不一样。', 'Taking 1–2–3 leaves 4–5 characters. Taking 2–3–4 leaves 1 and 5. Taking 3–4–5 leaves 1–2. The claim is legal in every case, but the leftovers differ.'),
        L('四五可以再接三或六，一二只能接三，一五暂时连不上。这能帮你理解为什么吃牌还要选组合。不过完整手牌里可能还有别的万子，真正选择时要放回整手里看，不能只凭这四张下结论。', '4–5 can connect with 3 or 6; 1–2 can connect only with 3; 1 and 5 are not connected yet. That explains why the choice matters. Other character tiles elsewhere in the full hand may change the comparison, so this fragment alone does not determine the best move.')
      ] },
      { title: L('手里三张相同，碰和杠用掉的数量不同', 'Pung and kong use different numbers of your tiles'), paragraphs: [
        L('你有三张五筒，别人又打出一张五筒。选择碰，只从手里拿出两张，配上弃牌亮出三个五筒，手里还留着一张五筒。选择明杠，则把手里的三张全拿出来，连同弃牌亮出四张。', 'With three 5 dots in hand and another discarded, pung uses two of yours plus the discard, leaving one concealed 5 dots. Exposed kong uses all three of yours plus the discard, showing all four.'),
        L('碰以后直接打牌，明杠以后先补摸。杠并不因为多了一张就自动更合适：它用掉的是哪几张、补摸后怎么继续，都要看清。本教程不计番，不靠番数来替你做选择。', 'After pung, discard directly. After exposed kong, take a replacement draw first. Having an extra matching tile does not automatically make kong the right choice; understand the tile use and the next step. These lessons do not use scoring to choose for you.')
      ], groups: [[13,13,13],[13]], note: L('三张在手，一张为弃牌。碰会留下一张五筒；明杠会用掉手中的三张。', 'Three are in hand and one is the discard. Pung leaves one concealed 5 dots; exposed kong uses all three from your hand.') },
      { title: L('亮出去的组合，不能再拆回来', 'An exposed set stays together'), paragraphs: [
        L('如果已经吃出二三四万，后面又摸到一万，不能把亮出的二三万收回来，改成一二三。手里的牌可以重排，副露已经固定为那一组，后面算胡牌时仍要把它算进去。', 'If you have exposed 2–3–4 characters, drawing a 1 later does not let you reclaim the 2 and 3 to make 1–2–3. Concealed tiles can be rearranged, but the exposed set stays fixed and still counts toward the hand.'),
        L('这也会影响牌型。七对、十三幺要求没有副露，做出吃、碰或明杠后，就不能继续按这两种结构来凑。碰碰胡里不能有顺子，所以已经吃出去的一组顺子也会排除碰碰胡。', 'Claims also affect patterns. Seven pairs and thirteen orphans require no exposed sets here, so chow, pung or exposed kong rules them out. All triplets cannot contain a sequence, so an exposed chow rules that pattern out too.')
      ] },
      { title: L('放过一张牌，不会多拿一个回合', 'Passing does not give you an extra turn'), paragraphs: [
        L('不想接这张弃牌，可以让它过去。没有人接牌时，按原来的顺序继续；只有轮到自己，才正常摸一张、打一张。不要因为刚刚考虑过碰，就顺手摸牌。', 'If you do not want the discard, let it pass. When nobody claims it, the usual turn order continues. Draw and discard on your own turn; considering a pung does not grant an extra draw.'),
        L('拿不准的时候，可以先问自己两件具体的事：这次要从手里拿出哪几张？做完之后是直接打牌，还是先补摸？这两个答案想清楚，至少不会把一次合法接牌做成张数错误。中级的吃碰杠题目就可以用来反复练这个。', 'When unsure, identify the exact tiles the claim takes from your hand and whether the next action is a discard or a replacement draw. Getting those steps right prevents a legal claim from becoming a tile-count mistake. The intermediate exercises let you practise both checks.')
      ] }
    ]
  }
];
