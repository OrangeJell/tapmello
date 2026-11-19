import { renderGameDetail } from './game-stage.mjs';
import {createLevel, LEVEL_COUNT} from '../../marble-sort-game/js/levels.js';
export const marbleUpdated='2026-11-17';
export { marblePath } from './game-catalog.mjs';
import { marblePath } from './game-catalog.mjs';
export const marbleGuidePath=(lang,id)=>`${lang==='hi'?'/hi':''}/guides/marble-sort/${id}/`;
const copy=(lang,en,hi)=>lang==='hi'?hi:en;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const marbleGuides = [
  {
    "id": "getting-started",
    "title": {
      "en": "How to Play Clock Out!",
      "hi": "पहली पारी"
    },
    "lead": {
      "en": "Release an office, read the four bus queues and find out when to wait for automatic boarding in Clock Out!",
      "hi": "दफ़्तर से कर्मचारियों को घर भेजना सीखें।"
    },
    "sections": [
      {
        "title": {
          "en": "Open a front office",
          "hi": "सामने का दफ़्तर खोलें"
        },
        "body": {
          "en": "Find a front-row office whose riders match a shuttle already at a stop. Tap the office to release all nine workers down the ramp. If two colours look alike, match the animal faces on the office and the shuttle. On a keyboard, 1–5 open offices from left to right.",
          "hi": "सामने की पाँच इमारतों में से एक चुनें। उसके नौ कर्मचारी रास्ते पर उतरते हैं। रंग और चेहरे से उनकी बस पहचानें।"
        }
      },
      {
        "title": {
          "en": "Read each stop separately",
          "hi": "हर कतार अलग पढ़ें"
        },
        "body": {
          "en": "The four large shuttles are the ones taking passengers. A shuttle leaves after three riders of its colour board. Then the first small bus behind it takes over that stop. Read each lane from top to bottom to see up to three upcoming buses. If there is blue ahead of red, fill the blue bus before red riders can use that stop.",
          "hi": "चार बड़ी बसें देखें। हर बस अपने रंग के तीन यात्री लेती है। भरने पर वह चल देती है और उसी कतार की अगली बस आगे आती है। हर कतार की अगली तीन बसें ऊपर से नीचे देखें। मिलते-जुलते रंगों में फ़र्क करने के लिए जानवर का चेहरा देखें।"
        }
      },
      {
        "title": {
          "en": "Let passengers reach their stop",
          "hi": "यात्रियों को स्टॉप तक पहुँचने दें"
        },
        "body": {
          "en": "A rider boards automatically when passing a matching stop. If several riders are already on the loop, wait to see who boards before opening another office. Waiting costs no move, and 2× speeds up the ride. Once the offices are empty and the last worker reaches the loop, 4× takes over until the final pickup.",
          "hi": "मिलते रंग के स्टॉप पर यात्री अपने आप चढ़ता है। बिना चाल खर्च किए रुकें या 2× से तेज़ चलाएँ। सभी दफ़्तर खाली होने और आखिरी गिरते यात्री के पथ पर आने के बाद पूरा खेल आखिरी सवारी तक अपने आप 4× चलता है। 1–5 से बाएँ से दाएँ दफ़्तर खोलें।"
        }
      }
    ]
  },
  {
    "id": "belt-space",
    "title": {
      "en": "Clock Out! Waiting Loop and Bus Jams",
      "hi": "अगली पारी के लिए जगह"
    },
    "lead": {
      "en": "See when a full 27-space loop can clear on its own, when to undo an office release and what Expand changes.",
      "hi": "27 जगहों की योजना बनाएँ और समझें कि भरा पथ कब खाली हो सकता है।"
    },
    "sections": [
      {
        "title": {
          "en": "Count who will stay",
          "hi": "बचे हुए यात्री गिनें"
        },
        "body": {
          "en": "Suppose blue is absent from all four stops and two blue offices have already sent riders. That is 18 of 27 spaces tied up. A third unmatched office would fill the loop. Check which front bus is nearly full and whether its replacement can take riders already waiting. A preview bus can board only after it reaches the stop.",
          "hi": "अगर सामने नीली बस नहीं है, दो नीले दफ़्तरों के कर्मचारी 18 जगह घेरेंगे। तीसरा दफ़्तर खोलने से पहले देखें कि कौन सी बस जगह खाली करेगी। पीछे की बस आगे आने पर ही यात्री लेती है।"
        }
      },
      {
        "title": {
          "en": "When 27/27 can still move",
          "hi": "27/27 पर कब इंतज़ार करें"
        },
        "body": {
          "en": "At 27/27, give a matching rider time to reach the stop or a full shuttle time to pull away. A jam requires a full loop, a rider still waiting to enter and no pickup or bus change that can free space. Before you open another office, see whether anyone already on the loop can board.",
          "hi": "पथ पर कोई यात्री बस ले सकता है या भरी बस निकल रही है तो इंतज़ार करें। जाम तब होता है जब सभी जगह भरी हों, बाहर यात्री हो और किसी बस से जगह न बन सके।"
        }
      },
      {
        "title": {
          "en": "Undo or expand",
          "hi": "चाल वापस लें या जगह बढ़ाएँ"
        },
        "body": {
          "en": "Undo restores the board and all four queues to the moment before you opened the last office. You get one undo per round. Expand adds nine places, taking the loop from 27 to 36, and clears the undo history. If your last release was the mistake, try Undo first. Use Expand when space is what you need.",
          "hi": "हर दौर में एक बार पिछली चाल वापस लेने पर बोर्ड और चारों बस कतारें पुरानी स्थिति में लौटती हैं। विस्तार नौ जगह जोड़ता है और पिछली चाल का रिकॉर्ड हटाता है। ज़रूरत हो तो जाम के लिए इसे बचाएँ।"
        }
      }
    ]
  },
  {
    "id": "mystery-packs",
    "title": {
      "en": "Clock Out! Mixed and Question-Mark Offices",
      "hi": "छिपे दफ़्तर और मिली-जुली पारी"
    },
    "lead": {
      "en": "Read question-mark offices before opening them, and count how much space a 6 + 3 release needs in Clock Out!",
      "hi": "देखें कि कौन सी इमारत पहले खोलना फ़ायदेमंद है।"
    },
    "sections": [
      {
        "title": {
          "en": "Uncover one office",
          "hi": "एक दफ़्तर का रंग जानें"
        },
        "body": {
          "en": "A question mark hides a rear office’s passengers until that office reaches the front. Open the office ahead of it, then pause and read the newly revealed faces. Even when the first office boards straight away, the one behind it may need a different lane.",
          "hi": "पीछे की इमारत पर सवाल का निशान उसके कर्मचारी छिपाता है। आगे वाली इमारत खोलें। नए चेहरे दिखने पर फिर दबाने से पहले चारों बसों से तुलना करें।"
        }
      },
      {
        "title": {
          "en": "Check both colours",
          "hi": "दोनों रंग जाँचें"
        },
        "body": {
          "en": "A mixed office releases both colours with one tap. If only the group of three has a bus, plan for the other six to keep circling. Also check the order they come down the ramp. When the loop is nearly full, the matching group needs time and space to get in and board before the second group backs up.",
          "hi": "6 + 3 वाली इमारत दो रंग साथ भेजती है। अगर केवल छोटे समूह की बस है तो तीन चढ़ेंगे और छह घूमते रह सकते हैं। उनके लिए जगह रखें।"
        }
      },
      {
        "title": {
          "en": "Look down the right lane",
          "hi": "सही कतार देखें"
        },
        "body": {
          "en": "If a green bus has two riders and a blue bus behind it, one more green rider opens blue. When several blue riders are circling, look for that last green rider before spending space on a release that leaves the blue bus where it is.",
          "hi": "लगभग भरी बस एक यात्री के बाद अगला रंग सामने लाएगी। अगर कई कर्मचारी उस रंग के हैं तो इसी बस को भरने से दूसरी कतार की तुलना में ज़्यादा जगह बन सकती है।"
        }
      }
    ]
  },
  {
    "id": "level-1-opening",
    "title": {
        "en": "Clock Out! Level 1 Walkthrough",
        "hi": "स्तर 1: पहली रवानगी की योजना"
    },
    "lead": {
        "en": "Follow a six-move opening for Clock Out! level 1. Learn which offices to tap, when to wait and how to board all 54 riders.",
        "hi": "छह चालों में 54 जानवरों को घर भेजें। पहले स्तर में तीन रंगों के साथ खेल सीखें।"
    },
    "sections": [
        {
            "title": {
                "en": "Start with a matching front office",
                "hi": "मिलते रंग के सामने वाले दफ़्तर से शुरू करें"
            },
            "body": {
                "en": "Level 1 has six single-colour offices and a shuttle available for each of its three colours. Follow the six moves above, counting columns from the left of the board. You can also start with another front-row office that has a matching shuttle ready.",
                "hi": "छह दफ़्तरों में तीन रंग हैं। हर रंग की बस तैयार है। दो रंग वाले या छिपे दफ़्तर नहीं हैं। ऊपर की छह चालें अपनाएँ या सामने का कोई और दफ़्तर चुनें।"
            }
        },
        {
            "title": {
                "en": "Let each office finish boarding",
                "hi": "हर दफ़्तर के यात्रियों को चढ़ने दें"
            },
            "body": {
                "en": "After each tap, watch the pickup counter rise by nine before you choose another office. At the halfway point it should read 27, with the waiting loop empty. Open the remaining three offices in order and let the last group board to finish at 54.",
                "hi": "मिलता दफ़्तर खोलें और अगला चुनने से पहले उसके नौ यात्रियों को चढ़ने दें। तीन चालों के बाद 27 यात्री बस में चढ़ चुके होंगे। स्तर पूरा करने के लिए छहों दफ़्तर खोलें और सभी 54 यात्रियों को चढ़ने दें।"
            }
        },
        {
            "title": {
                "en": "Prepare for the later shifts",
                "hi": "आगे की पारियों की तैयारी करें"
            },
            "body": {
                "en": "In later levels, an office can send more riders than the front buses can take. Look at the waiting loop after each release and count who is still there. From level 2, later mixed groups can leave you only three free places, so keep those spaces for the riders who can open the next bus you need.",
                "hi": "हर स्तर सामने उपलब्ध बस रंगों और आसान चरण से शुरू होता है। फिर कुछ यात्रियों का इंतज़ार और कतार बदलना आता है। रुके लक्ष्य और मिले रंग वाले दफ़्तर बाद के चरणों में आते हैं। स्तर 2 से बाद के तंग चरणों में केवल तीन जगह बच सकती हैं, इसलिए लक्ष्य रंग के लिए जगह रखें।"
            }
        }
    ],
    "opening": true
}
];
function guideList(lang,current){return `<div class="mahjong-guide-list">${marbleGuides.filter(a=>a.id!==current).map((a,i)=>`<a href="${marbleGuidePath(lang,a.id)}"><span class="guide-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(a.title[lang])}</h3><p>${esc(a.lead[lang])}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div>`;}
function openingDiagram(lang){return `<figure class="marble-route"><div>${createLevel(1).stages[0].route.map((column,i)=>`<span><small>${copy(lang,'MOVE','चाल')} ${i+1}</small><b>${column+1}</b></span>`).join('<i aria-hidden="true">→</i>')}</div><figcaption>${copy(lang,'Count columns from left to right. Let each group board before opening the next office.','कॉलम बाएँ से दाएँ गिनें। अगला दफ़्तर खोलने से पहले पिछले समूह को चढ़ने दें।')}</figcaption></figure>`;}
export function renderMarble(lang, sharedOnly){
 const embed = {
   host: `class="marble-embed" data-marble-embed data-language="${lang}"`,
   frame: 'marble-frame',
   title: copy(lang,'Clock Out! conveyor puzzle','छुट्टी हुई! कन्वेयर पहेली'),
   src: `/play/marble-sort/?embed=1&lang=${lang}`,
   loading: copy(lang,'Opening the offices…','दफ़्तर खुल रहे हैं…'),
 };
 const guideExtras = `<section id="levels" class="commute-levels"><div class="reading-heading"><h3>${copy(lang,'A trickier ride, one shift at a time','हर पारी के साथ कठिन सफ़र')}</h3><p>${copy(lang,'Start with a three-colour tutorial. From level 2, queues change and space gets tighter. Some levels from level 5 have two late decisions that can jam the loop.','तीन रंगों वाले पहले स्तर में खेल सीखें। दूसरे स्तर से कतारें बदलती हैं और जगह कम पड़ती है। पाँचवें स्तर से कुछ स्तरों में आखिर की दो गलत चालें पथ जाम कर सकती हैं।')}</p></div><ol>${[
 [1,1,'Learn to match riders','यात्रियों के रंग मिलाएँ','Six single-colour offices and matching buses teach the basics.','एक-एक रंग वाले छह दफ़्तरों और उनकी बसों से खेल सीखें।'],
 [2,5,'Match first, plan next','पहले रंग मिलाएँ, फिर योजना बनाएँ','Start with visible matching offices. Blocked targets arrive later; from level 2, mixed offices add a challenge near the end.','सामने के मिलते दफ़्तरों से शुरू करें। रुके लक्ष्य बाद में आते हैं। स्तर 2 से अंत के पास मिले रंग वाले दफ़्तर चुनौती बढ़ाते हैं।'],
 [6,12,'Read further down each queue','हर कतार में आगे देखें','More hidden offices and repeated mixed shifts make it harder to predict who can board next. Save space for the target colour.','अधिक छिपे दफ़्तर और बार-बार मिले रंग आने से अगली बस का अंदाज़ा कठिन होता है। लक्ष्य रंग के लिए जगह बचाएँ।'],
 [13,LEVEL_COUNT,'Protect the last three places','आखिरी तीन जगह बचाएँ','Repeated bottlenecks can leave 24 of 27 places occupied. Opening an unrelated office before the target can block the loop.','बार-बार तंग जगह पर 27 में से 24 जगह भर सकती हैं। लक्ष्य से पहले गलत दफ़्तर खोलने से पथ जाम हो सकता है।']
].map(([from,to,en,hi,bodyEn,bodyHi])=>`<li><p class="commute-level-range">${copy(lang,'Levels','स्तर')} ${from===to?from:`${from}–${to}`}<span>${createLevel(from).colorCount} ${copy(lang,'colours','रंग')}</span></p><h3>${copy(lang,en,hi)}</h3><p>${copy(lang,bodyEn,bodyHi)}</p></li>`).join('')}</ol></section>`;
 const faq = [
 ['Is the loop jammed when it says 27/27?','27/27 दिखे तो क्या पथ जाम है?','Give the loop time if a rider can still board or a full shuttle is pulling away. A jam needs all 27 spaces occupied (36 after Expand), someone waiting to enter and no pickup or bus change that can clear a space.','थोड़ी देर बसें देखें। कोई यात्री चढ़ सकता है या भरी बस निकल रही है तो जगह बन सकती है। जाम तब होता है जब बाहर यात्री रुका हो और चढ़ने या बस बदलने से भी जगह न बने।'],
 ['When do question-mark offices reveal their colours?','सवाल के निशान वाले दफ़्तर का रंग कब दिखता है?','They reveal the passengers when they reach the front row. You can read their colours before opening the office. A mixed office sends six riders of one colour and three of another.','सामने की पंक्ति में आते ही उनके यात्री दिखते हैं। दफ़्तर खोलने से पहले रंग पढ़ सकते हैं। मिले रंग के दफ़्तर से एक रंग के छह और दूसरे के तीन यात्री आते हैं।'],
 ['Why did the game switch to 4×?','खेल 4× पर क्यों चला?','Once all offices are empty and the last falling animal reaches the loop, the game automatically accelerates boarding and departures. Undo brings back the last office and restores your chosen speed. The next level also returns to your chosen 1× or 2×.','सभी दफ़्तर खाली होने और आखिरी जानवर के पथ पर आने पर चढ़ना और बसें अपने आप तेज़ होती हैं। चाल वापस लेने पर दफ़्तर और चुनी गति लौटते हैं। अगले स्तर में भी चुनी 1× या 2× गति लौटती है।'],
 ['What do Undo and Expand do?','चाल वापस लेने और जगह बढ़ाने से क्या होता है?','Undo takes back the last office you opened once per round. Expand adds nine slots once, including after a jam, and clears undo history. Both are available directly without an advert or payment.','हर बार खेल शुरू करने पर आखिरी दफ़्तर एक बार वापस ले सकते हैं। अतिरिक्त जगह एक बार नौ जगह जोड़ती है, जाम के बाद भी; इससे पिछली चाल का रिकॉर्ड हटता है। विज्ञापन या भुगतान ज़रूरी नहीं।'],
 ['Does progress follow me to another device?','क्या प्रगति दूसरे उपकरण पर मिलेगी?','No. The highest unlocked level and audio settings are saved locally. The live board is not saved, and clearing browser data removes progress.','नहीं। सबसे ऊँचा खुला स्तर और ध्वनि की सेटिंग्स इसी ब्राउज़र में रहती हैं। बीच का बोर्ड सहेजा नहीं जाता। ब्राउज़र का डेटा हटाने पर प्रगति मिटती है।']
 ].map(([q, qHi, a, aHi]) => [copy(lang, q, qHi), copy(lang, a, aHi)]);
 return renderGameDetail(lang, {
  sharedOnly,
   game: 'clock-out',
   embed,
   aboutTitle: copy(lang, 'Bus sorting with four queues and 27 waiting spaces', 'चार बस कतारें और इंतज़ार की 27 जगहें'),
   about: copy(lang, [
     'Clock Out! is a bus sorting puzzle about getting nine coworkers at a time home. Tap a front-row office to send them onto the loop. Riders board when they pass a matching shuttle at the front of one of the four queues. A shuttle leaves with three riders of its colour, then the next bus in that lane pulls up.',
     'Before opening another office, count how many of its nine riders would have to wait. If the red shuttle you need is behind a blue one with two riders aboard, look for a blue rider. Filling that last seat brings red to the stop for the next three red riders.',
     'Level 1 gives you six single-colour offices and shuttles ready for all three colours. Later, a mixed office sends six riders of one colour and three of another. Question-mark offices reveal their colours as soon as they reach the front row. With just three spaces left, a mixed office can still work if its first riders board in time to make room for the rest.',
   ], [
     'काम की पारी ख़त्म हुई और हर दफ़्तर से नौ साथी साथ बाहर आते हैं। एक बस अपने रंग के तीन यात्री लेती है। एक ही रंग का पूरा समूह तीन बसों से घर जा सकता है, बशर्ते उसके पहुँचने पर सही रंग आगे हो।',
     'दफ़्तर खोलने से पहले चारों कतारों की पहली बसें देखें। मान लें एक कतार में लाल बस नीली के पीछे है। लाल यात्री तब तक चक्कर लगाएँगे जब तक तीन नीले यात्री आगे वाली बस भरकर उसे रवाना न करें। अगला समूह भेजने से पहले देखें कि इंतज़ार की जगह बची है या नहीं।',
     'पहले स्तर में दफ़्तरों का एक-एक रंग है और उनकी बसें तैयार हैं। आगे दो रंग वाले और सवाल के निशान वाले दफ़्तर मिलते हैं। पथ पर सिर्फ़ तीन जगह हों, तब भी मिला-जुला दफ़्तर मदद कर सकता है अगर पहले जाने वाले यात्री चढ़कर बाकियों के लिए जगह बना दें।',
   ]),
   genres: copy(lang, ['Puzzle', 'Colour sorting'], ['पहेली', 'रंग छाँटना']),
   steps: [
     [copy(lang, 'Match the first riders to a front bus', 'पहले यात्रियों का रंग सामने की बस से मिलाएँ'),
       copy(lang, 'Find a front-row office that matches a shuttle already taking passengers. Tap the office or press 1–5 from left to right to send its nine riders down the ramp.',
         'सामने का ऐसा दफ़्तर चुनें जिसका रंग किसी कतार की पहली बस से मिले। नौ यात्री भेजने के लिए दफ़्तर टैप करें या कीबोर्ड पर 1–5 दबाएँ।')],
     [copy(lang, 'Let the buses board and rotate', 'बस भरने दें और अगला रंग देखें'),
       copy(lang, 'When a shuttle leaves, check its replacement for a colour already waiting on the loop. Give those riders time to reach it before sending another group.',
         'एक रंग के तीन यात्री बस भरें तो उसी कतार में आगे आए रंग को देखें। नया दफ़्तर खोलने से पहले देखें कि वह बस पथ पर घूम रहे किसी यात्री को ले सकती है या नहीं।')],
     [copy(lang, 'Watch the space counter', 'खाली जगह की गिनती देखें'),
       copy(lang, 'If space is tight, check the next office against the front buses. Open it when the first riders have a place to board or enough room to wait.',
         'पथ भर रहा हो तो बस में चढ़ना पूरा होने दें। जब पता हो कि अगले दफ़्तर के पहले यात्री कहाँ जाएँगे, तभी उसे खोलें।')],
   ],
   guides: marbleGuides.map(article => ({
     href: marbleGuidePath(lang, article.id),
     title: article.title[lang],
     description: article.lead[lang],
   })),
   guideExtras,
   faq,
   faqId: 'questions',
 });
}
export function renderMarbleGuide(a,lang){return `<main id="main" class="shell mahjong-reading marble-reading" tabindex="-1"><article><a class="back-link" href="${marblePath(lang)}#guides">← ${copy(lang,'Back to Clock Out!','छुट्टी हुई! पर लौटें')}</a><p class="eyebrow">${copy(lang,'CLOCK OUT! / FIELD NOTES','छुट्टी हुई! / खेल की बातें')}</p><h1>${esc(a.title[lang])}</h1><p class="reading-lead">${esc(a.lead[lang])}</p>${a.opening?openingDiagram(lang):''}<nav class="reading-contents" aria-label="${copy(lang,'On this page','इस पेज पर')}">${a.sections.map((s,i)=>`<a href="#step-${i+1}">${esc(s.title[lang])}</a>`).join('')}</nav>${a.sections.map((s,i)=>`<section id="step-${i+1}" class="reading-section"><h2>${esc(s.title[lang])}</h2><p>${esc(s.body[lang])}</p></section>`).join('')}<div class="reading-end"><a class="outline-play" href="${marblePath(lang)}#marble-frame">${copy(lang,'Try it on the belt','कन्वेयर पर आज़माएँ')} ↗</a><time datetime="${marbleUpdated}">${copy(lang,'Updated 17 November 2026','अपडेट: 17 नवंबर 2026')}</time></div><section class="mahjong-guides"><div class="reading-heading"><h2>${copy(lang,'Keep exploring','और जानें')}</h2></div>${guideList(lang,a.id)}</section></article></main>`;}
