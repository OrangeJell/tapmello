import { extraCopy } from './locale-copy.js';

// The site passes the current page language through the player URL.
const requestedLanguage = typeof location === 'undefined' ? 'en' : new URLSearchParams(location.search).get('lang');
export const language = (requestedLanguage === 'hi' || Object.hasOwn(extraCopy, requestedLanguage)) ? requestedLanguage : 'en';
const localized = extraCopy[language];
const strings = {
  departureCombo: ['Bus combo','बस कॉम्बो'],
  guideTap: ["Let’s help our little friends", "नन्हे दोस्तों की मदद करें"],
  guideRelease: ["Tap a front house to release 9 animals. They’ll walk to the buses!", "सामने का घर दबाएँ। 9 जानवर बसों की ओर चल पड़ेंगे।"],
  guideMatch: ["Same colour, same bus", "एक रंग, एक बस"],
  guideBoard: ["Animals board the matching bus on their own. Three aboard and off it goes!", "जानवर अपने रंग की बस में खुद चढ़ेंगे। तीन सवारी होते ही बस चलेगी।"],
  guideNext: ["See which buses are coming next", "अगली आने वाली बसें देखें"],
  guideRoom: ["These little buses are next in line. Take your time choosing the next house.", "ये अगली बसें हैं। अब आराम से अगला घर चुनें।"],
  guideSkip: ["Skip", "छोड़ें"],
  guideBuddy: ["Fox’s little guide", "लोमड़ी की सीख"],
  guideTry: ["Got it, next", "समझ गए, आगे बढ़ें"],
  guideWatch: ["Got it, next", "समझ गए, आगे बढ़ें"],
  guideMystery: ["A mystery house!", "एक रहस्यमय घर!"],
  guideMysteryCopy: ["The question mark hides the animals inside. Move this house to the front row to reveal their colours and arrangement.", "प्रश्न चिह्न के पीछे के जानवर छिपे हैं। घर सामने की पंक्ति में आने पर उनके रंग और व्यवस्था दिखेंगे।"],
  guideUnderstood: ["Got it", "समझ गए"],
  guidePlay: ["Got it, let’s play", "समझ गए, चलो खेलें"],
  description: ['Take animal office workers home on matching shuttles in a free sixty-level browser puzzle.', 'इस मुफ़्त ब्राउज़र पहेली के 60 स्तरों में जानवरों को उनके रंग की बस से घर भेजें।'],
  levelNumber: ['Level {n}', 'स्तर {n}'],
  unlocked: ['{n} of {count} levels unlocked', '{count} में से {n} स्तर खुले'],
  start: ['Play level {n}', 'स्तर {n} खेलें'],
  loading: ['Getting the buses ready…', 'बसें तैयार हो रही हैं…'],
  settings: ['Settings', 'सेटिंग्स'],
  closeSettings: ['Done', 'हो गया'],
  music: ['Music', 'संगीत'],
  effects: ['Sound effects', 'ध्वनि प्रभाव'],
  vibration: ['Vibration', 'कंपन'],
  returnHome: ['End this round and return to the title screen', 'यह दौर खत्म करें और मुख्य स्क्रीन पर लौटें'],
  playAgain: ['Play again', 'फिर से खेलें'],

  autoFinishing: ['Everyone is on the loop. Shuttles are running at 4×.', 'सभी यात्री पथ पर हैं। बसें 4× गति से चल रही हैं।'],
  departed: ["Off we go!", "चल पड़ी!"],
  brand: ["Clock Out!", "छुट्टी हुई!"],
  lobbyTip: ['Match passengers to buses of the same colour.', 'यात्रियों को उनके रंग की बसों में बिठाएँ।'],
  back: ['Back to tapmelo', 'tapmelo पर लौटें'],
  game: ["Clock Out! shuttle puzzle", "छुट्टी हुई! बस पहेली"], pause: ['Pause game', 'खेल रोकें'], target: ["Picked up", "बस में सवार"], progress: ['Pickup progress', 'सवारियों की प्रगति'], level: ['LEVEL', 'स्तर'],
  speed2: ['Switch to double speed', 'दोगुनी गति करें'], speed1: ['Switch to normal speed', 'सामान्य गति करें'], board: ["Offices, a waiting loop and four shuttle lanes", "दफ़्तर, प्रतीक्षा पथ और बसों की चार कतारें"], sources: ["Release workers from a front office", "सामने के दफ़्तर से कर्मचारी भेजें"], belt: ["Waiting", "प्रतीक्षा"], tools: ['Extra moves', 'सहायक विकल्प'], undo: ['Undo', 'चाल वापस लें'], expand: ['Expand +9', 'जगह +9'], help: ['How to play', 'कैसे खेलें'],
  initial: ["Choose a front office", "सामने का दफ़्तर चुनें"], wait: ["Loop full. Give matching riders time to board.", "पथ भरा है। यात्रियों को चढ़ने दें।"], tight: ["Room is tight. Check the four front buses.", "जगह कम है। चारों आगे की बसें देखें।"], idle: ["Three matching riders send a shuttle home.", "एक रंग के तीन यात्री बैठते ही बस चलती है।"], released: ["Watch the bus colours before opening another office.", "अगला दफ़्तर खोलने से पहले बसों के रंग देखें।"],
  columnEmpty: ['Column {n} is empty', 'कॉलम {n} खाली है'], column: ["Office column {n}: {pack}. {count} offices left", "दफ़्तर कॉलम {n}: {pack}। {count} दफ़्तर बचे"], pack: ["{count} {name} riders", "{name}: {count} यात्री"], levelTip: ['{name} · {colors} colours · {capacity} belt slots', '{name} · {colors} रंग · कन्वेयर में {capacity} जगह'],
  complete: ['All levels complete', 'सभी स्तर पूरे हुए'], won: ['Nicely sorted!', 'बहुत खूब!'], completeCopy: ["{count} / {count} levels complete. Everyone is on the way home!", "{count} / {count} स्तर पूरे। सभी घर के लिए रवाना!"], wonCopy: ['Level {n} complete', 'स्तर {n} पूरा हुआ'], completeBrow: ['ALL LEVELS COMPLETE', 'सभी स्तर पूरे'], wonBrow: ['LEVEL COMPLETE', 'स्तर पूरा हुआ'], next: ['Next level', 'अगला स्तर'],
  lost: ['Almost there!', 'बस थोड़ा और!'], lostExpanded: ['The belt is blocked. Expansion has already been used this round.', 'कन्वेयर जाम है। इस बार अतिरिक्त जगह पहले ही ले चुके हैं।'], lostCopy: ['The belt is blocked. Add nine slots to keep sorting.', 'कन्वेयर जाम है। नौ जगह जोड़कर खेल जारी रखें।'], lostBrow: ['KEEP GOING', 'कोशिश जारी रखें'], recover: ['Expand +9 and continue', 'जगह +9 लेकर जारी रखें'], retry: ['Try again', 'फिर कोशिश करें'], expanded: ['Nine more belt slots are ready.', 'कन्वेयर में नौ जगह बढ़ गई हैं।'],
  helpTitle: ["Match riders to their shuttle", "यात्रियों को उनकी बस में बिठाएँ"], helpCopy: ["Tap a front office to send nine workers to the loop. A two-colour office sends six of one colour and three of another.\n\nEach bus takes three matching riders. Each lane has its own queue. Read up to three upcoming buses from top to bottom.\n\nMystery offices reveal their colours at the front. Keys 1–5 open offices.", "सामने के दफ़्तर को दबाकर नौ कर्मचारी भेजें। दो रंग वाले दफ़्तर में छह और तीन कर्मचारी होते हैं।\n\nएक रंग के तीन यात्री बैठते ही बस चलती है। हर कतार की अगली तीन बसें ऊपर से नीचे देखें।\n\nछिपे दफ़्तर सामने आने पर रंग दिखाते हैं। 1–5 से दफ़्तर खोलें।"], gotIt: ['Got it — let’s sort', 'समझ गए — शुरू करें'], pauseTitle: ['Take a breather', 'थोड़ा आराम करें'], pauseCopy: ["The shuttles will wait here for you.", "बसें यहीं आपका इंतज़ार करेंगी।"], pauseBrow: ['TAKE A BREATH', 'थोड़ा आराम'], resume: ['Keep playing', 'खेल जारी रखें'], restart: ['Restart this level', 'यह स्तर फिर शुरू करें'], soundOn: ['Sound: on', 'आवाज़: चालू'], soundOff: ['Sound: off', 'आवाज़: बंद'], faster: ['Double speed is on.', 'दोगुनी गति चालू है।'], slower: ['Back to normal speed.', 'सामान्य गति चालू है।'], undone: ['Last release undone.', 'पिछला पैक वापस लिया।'], allCollected: ["Everyone aboard!", "सब सवार!"], extraSlots: ['+9 slots', '+9 जगह'], canvasTip: ["Tap a front office to clock out", "सामने का दफ़्तर दबाएँ"]
};
export function t(key, values = {}) {
  let result = localized?.strings[key] ?? strings[key]?.[language === 'hi' ? 1 : 0] ?? key;
  for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, String(value));
  return result;
}
const colors = [
  ['Berry pink', 'गुलाबी'], ['Sky blue', 'आसमानी नीला'], ['Lemon yellow', 'पीला'], ['Mint green', 'हरा'], ['Grape purple', 'बैंगनी'], ['Orange', 'नारंगी'], ['Pearl white', 'सफ़ेद'], ['Deep blue', 'गहरा नीला'], ['Cherry red', 'लाल'], ['Teal', 'नीला हरा'], ['Graphite grey', 'स्लेटी'], ['Cocoa brown', 'भूरा']
];
export const colorName = index => localized?.colors[index] ?? colors[index]?.[language === 'hi' ? 1 : 0] ?? String(index);
const levels = [
  ['First ride', 'पहली सवारी'], ['Read the next bus', 'अगली बस देखें'], ['Reserve some room', 'जगह बचाएँ'], ['Mixed transfers', 'मिले रंग की अदला-बदली'], ['Watch the bottleneck', 'जाम पर नज़र रखें'], ['Two offices waiting', 'दो दफ़्तर प्रतीक्षा में'], ['Mixed shifts', 'मिली-जुली पारी'], ['Staggered departures', 'बारी-बारी प्रस्थान'], ['Room to think', 'जगह का खेल'], ['Halfway challenge', 'आधे सफ़र की चुनौती'], ['New colleagues', 'नए सहकर्मी'], ['Two-colour chain', 'दो रंगों की कड़ी'], ['Twisted loop', 'उलझा चक्कर'], ['Patient sorting', 'धैर्य से छाँटें'], ['Hidden-colour puzzle', 'छिपे रंगों की पहेली'], ['Layers of blockers', 'रुकावटों की परतें'], ['Tough choices', 'कठिन चुनाव'], ['The last three moves', 'आखिरी तीन चालें'], ['Before the finale', 'अंत से पहले'], ['The final sort', 'आखिरी चुनौती'],
  ["Evening departures", "शाम की रवानगी"], ["Crossing shifts", "बदलती पारियाँ"], ["Across the street", "सड़क के उस पार"], ["Mixed relay", "मिले रंगों की रिले"], ["Rainy ride home", "बारिश में घर वापसी"], ["Take turns", "बारी-बारी चलें"], ["Corner meetup", "नुक्कड़ पर मिलन"], ["Two-way transfers", "दोतरफ़ा अदला-बदली"], ["Night loop", "रात का चक्कर"], ["Late shift", "देर की पारी"], ["Street lights", "सड़क की रोशनी"], ["Staggered connections", "बारी-बारी मिलान"], ["Colourful blocks", "रंगीन मोहल्ले"], ["Mystery transfers", "रहस्यमय अदला-बदली"], ["Last-bus countdown", "आखिरी बस की उलटी गिनती"], ["Two routes home", "घर के दो रास्ते"], ["Linked crossings", "जुड़े चौराहे"], ["One last shuttle", "एक आखिरी बस"], ["Citywide pickup", "पूरे शहर की सवारी"], ["Everyone home", "सब घर पहुँचे"]
];
export const levelName = number => localized?.levels[number - 1] ?? levels[number - 1]?.[language === 'hi' ? 1 : 0] ?? t('levelNumber', {n:number});
export function localizeDocument() {
  document.documentElement.lang = language;
  document.title = t('brand');
  document.querySelector('meta[name=description]')?.setAttribute('content', t('description'));
  if (new URLSearchParams(location.search).get('embed') === '1') document.documentElement.dataset.embed = 'true';
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
  const back = document.querySelector('#site-back');
  if (back && location.pathname.startsWith('/play/marble-sort/')) {
    back.href = `${language === 'en' ? '' : '/' + language.toLowerCase()}/games/marble-sort/`;
    back.hidden = new URLSearchParams(location.search).get('embed') === '1';
  }
  for (const element of document.querySelectorAll('[data-i18n-label]')) element.setAttribute('aria-label', t(element.dataset.i18nLabel));
}
