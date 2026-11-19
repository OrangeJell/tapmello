import { renderGameDetail } from './game-stage.mjs';
import { articles, patterns } from '../../mahjong-tutor/js/catalog.js';
import { tileSVG, tileMarkup, escapeHTML } from '../../mahjong-tutor/js/tiles.js';
export const mahjongUpdated='2026-10-30';
export { mahjongPath } from './game-catalog.mjs';
import { mahjongPath } from './game-catalog.mjs';
export const mahjongGuidePath=(lang,id)=>`${lang==='hi'?'/hi':''}/guides/mahjong/${id}/`;
export { articles };
const copy=(lang,en,hi)=>lang==='hi'?hi:en;
const text=(value,lang)=>value[lang];
const groups=(items,lang)=>`<div class="mahjong-diagram">${items.map(g=>`<span class="mahjong-tile-group">${g.map(id=>tileMarkup(id,{lang,labels:false})).join('')}</span>`).join('')}</div>`;
export function coverSVG(){
  const tile=(id,x,y,w,h,rotation=0)=>`<g transform="translate(${x} ${y}) rotate(${rotation})">${tileSVG(id).replace('<svg ',`<svg width="${w}" height="${h}" `)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="732" viewBox="0 0 544 332"><rect width="544" height="332" fill="#b6a8e6"/><rect x="36" y="36" width="472" height="258" fill="none" stroke="#ded5ff" stroke-width=".7"/>${tile(13,232,87,38,53,9)}${tile(14,277,95,38,53,9)}<g transform="translate(66 219) rotate(-8)">${[0,1,2,10,11,12,31].map((id,i)=>tile(id,i*59,0,53,74)).join('')}</g></svg>`;
}
export function renderMahjong(lang, sharedOnly){
 const embed = {
   host: `class="mahjong-embed" data-mahjong-embed data-language="${lang}"`,
   frame: 'mahjong-frame',
   title: copy(lang,'Mahjong learning game','माहजोंग सीखने का खेल'),
   src: `/play/mahjong/?embed=1&site=1&lang=${lang}`,
   loading: copy(lang,'Loading the tiles…','टाइलें लोड हो रही हैं…'),
 };
 return renderGameDetail(lang, {
  sharedOnly,
   game: 'mahjong',
   playerLayout: 'flow',
   embed,
   aboutTitle: copy(lang, 'Mahjong rules and practice for beginners', 'माहजोंग की जोड़ियों से हाथ पूरा करने वाली टाइल तक'),
   about: copy(lang, [
     'Learn to read a Mahjong hand one group at a time. Start with the three numbered suits (dots, bamboo and characters) and the winds and dragons. Then look for identical pairs, triplets and sequences of three consecutive numbers in the same suit.',
     'The usual winning hand has four sets and one pair. Set aside the finished groups and see what is missing. If you already have three sets and a pair, and your last two tiles are bamboo 4 and 5, either bamboo 3 or bamboo 6 completes the hand.',
     'Start in Beginner if you are learning tile names or building your first winning hand. Intermediate covers claims (chi, pong and kong) and hands one tile short of winning. Advanced adds patterns such as Seven Pairs and Thirteen Orphans, then takes you through a guided hand. Open an illustrated guide whenever you want to see another example.',
   ], [
     'पहले माहजोंग की टाइलें पहचानें। बिंदु, बाँस और अक्षर वाले सूट हैं, साथ में दिशाएँ और ड्रैगन हैं। एक जैसी दो टाइलों की जोड़ी, एक सूट के लगातार तीन अंक और एक जैसी टाइलों के समूह पहचानकर अभ्यास करें।',
     'सामान्य जीत वाले हाथ में चार समूह और एक जोड़ी होती है। कौन-सी टाइल रखें, इससे पहले बने हुए समूह अलग करें। अगर सिर्फ़ बाँस की 4 और 5 अधूरी हैं और बाकी हाथ तैयार है, तो बाँस की 3 या 6 उस क्रम को पूरा कर सकती है।',
     'शुरुआती अभ्यास में टाइलें और जीत का हाथ पहचानते हैं। मध्यम स्तर में ची, पोंग और कॉन्ग सीखते हैं और हाथ पूरा करने वाली टाइलें खोजते हैं। आगे खास पैटर्न और निर्देशों वाला हाथ है। जिस नियम का अभ्यास चाहिए, उसे चुनें और उदाहरण के लिए उसकी चित्र वाली गाइड पढ़ें।',
   ]),
   introLinks: [
     { href: `/play/mahjong/?site=1&lang=${lang}&lesson=beginner`, label: copy(lang, 'Start beginner practice', 'शुरुआती अभ्यास खोलें') },
     { href: `/play/mahjong/?site=1&lang=${lang}&lesson=practice`, label: copy(lang, 'Practise finding the winning tile', 'जीत की टाइल ढूँढने का अभ्यास करें') },
   ],
   genres: copy(lang, ['Learning game', 'Tile puzzle'], ['सीखने का खेल', 'टाइलों की पहेली']),
   steps: [
     [copy(lang, 'Find pairs and sets first', 'पहले जोड़ियाँ और समूह पहचानें'),
       copy(lang, 'Open Beginner and identify tiles by their marks. Compare a three-tile run like bamboo 3, 4, 5 with three identical tiles.',
         'शुरुआती स्तर खोलें और निशान से टाइलें पहचानें। बाँस की 3, 4, 5 जैसे क्रम को तीन एक जैसी टाइलों से मिलाकर देखें।')],
     [copy(lang, 'Check why a move works', 'देखें चाल सही क्यों है'),
       copy(lang, 'Tap the tiles or answer and choose Check. Use the explanation to see which group or claim made the difference before moving on.',
         'टाइलें या जवाब चुनें और जाँचें दबाएँ। आगे बढ़ने से पहले समझें किस समूह या चाल की वजह से जवाब बना।')],
     [copy(lang, 'Find every tile that completes the hand', 'हाथ पूरा करने वाली सभी टाइलें ढूँढें'),
       copy(lang, 'In waiting-hand practice, try one candidate at a time. Check whether every tile fits into a set or the pair, then test the other end of a partial sequence before you Check.',
         'हाथ पूरा करने का अभ्यास खोलें। देखें क्या कमी है, फिर हर विकल्प को पूरे हाथ से मिलाएँ। एक से ज़्यादा टाइलें हाथ पूरा कर सकती हैं।')],
   ],
   guides: articles.map(article => ({
     href: mahjongGuidePath(lang, article.id),
     title: text(article.title, lang),
     description: text(article.lead, lang),
   })),
   faq: [
     [copy(lang, 'Can I play against other people?', 'क्या मैं दूसरे खिलाड़ियों के साथ खेल सकता हूँ?'),
       copy(lang, 'This is a Mahjong learning game with exercises and a guided hand. It does not have opponent matches or scoring.',
         'यह माहजोंग सीखने का खेल है। इसमें अभ्यास और निर्देशों वाला हाथ है। दूसरे खिलाड़ियों से मुकाबला या स्कोरिंग नहीं है।')],
     [copy(lang, 'Do I have to begin with the first level?', 'क्या पहले स्तर से शुरू करना ज़रूरी है?'),
       copy(lang, 'No. You can open any level and return to it later.', 'नहीं। आप कोई भी स्तर खोल सकते हैं और बाद में वापस आ सकते हैं।')],
     [copy(lang, 'Where is my lesson progress saved?', 'अभ्यास की प्रगति कहाँ सहेजी जाती है?'),
       copy(lang, 'Progress stays in this browser when storage is available.', 'स्टोरेज उपलब्ध होने पर प्रगति इसी ब्राउज़र में रहती है।')],
     [copy(lang, 'Is this the same as Mahjong solitaire?', 'क्या यह माहजोंग सॉलिटेयर जैसा है?'),
       copy(lang, 'Here you practise building a Mahjong hand from sets and a pair. In solitaire you clear a board by matching exposed tiles.',
         'यहाँ टाइलों के समूह और जोड़ी से माहजोंग का हाथ बनाते हैं। सॉलिटेयर में खुली टाइलों की जोड़ियाँ हटाकर बोर्ड खाली करते हैं।')],
   ],
 });
}
const relatedGuideIds = {
 tiles: 'winning',
 winning: 'waiting-shapes',
 calls: 'claim-choices',
 advanced: 'winning',
 'organize-hand': 'waiting-shapes',
 'waiting-shapes': 'organize-hand',
 'claim-choices': 'calls',
};

export function renderMahjongArticle(a,lang){
 const t=v=>escapeHTML(text(v,lang));
 const related=articles.find(article=>article.id===relatedGuideIds[a.id]);
 const relatedLink=related ? `<a href="${mahjongGuidePath(lang,related.id)}">${t(related.title)}</a>` : '';
 return `<main id="main" class="shell mahjong-reading" tabindex="-1"><article><a class="back-link" href="${mahjongPath(lang)}${lang === 'hi' ? '#guides' : '#play'}">← ${copy(lang,'Back to online Mahjong practice','माहजोंग पर वापस जाएँ')}</a><p class="eyebrow">${copy(lang,'MAHJONG GUIDE','माहजोंग की जानकारी')}</p><h1>${t(a.title)}</h1><p class="reading-lead">${t(a.lead)}</p>${a.paragraphs.map(p=>`<p>${t(p)}</p>`).join('')}<nav class="reading-contents" aria-label="${copy(lang,'On this page','इस पेज पर')}">${a.sections.map((s,i)=>`<a href="#section-${i+1}">${t(s.title)}</a>`).join('')}</nav>${a.sections.map((s,i)=>{const p=s.pattern?patterns[s.pattern]:null;return `<section id="section-${i+1}" class="reading-section"><h2>${t(s.title)}</h2>${s.paragraphs.map(x=>`<p>${t(x)}</p>`).join('')}${p?`<figure class="mahjong-example" data-pattern="${p.id}"><figcaption>${t(p.rule)}</figcaption>${groups(p.groups,lang)}<div class="mahjong-counter"><p>${t(p.counter)}</p>${groups(p.counterGroups,lang)}</div></figure>`:s.groups?`<figure class="mahjong-example">${groups(s.groups,lang)}${s.note?`<figcaption>${t(s.note)}</figcaption>`:''}</figure>`:''}</section>`;}).join('')}<div class="reading-end"><a class="outline-play" href="/play/mahjong/?site=1&amp;lang=${lang}&amp;lesson=${a.level}">${copy(lang,'Try an exercise','अभ्यास करें')} ↗</a><a href="${mahjongPath(lang)}#guides">${copy(lang,'All guides','सभी लेख')}</a>${relatedLink}</div></article></main>`;
}
