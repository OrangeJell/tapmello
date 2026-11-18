const zhDigits = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const honorEn = ['East', 'South', 'West', 'North', 'Red dragon', 'Green dragon', 'White dragon'];
const honorHi = ['पूर्व', 'दक्षिण', 'पश्चिम', 'उत्तर', 'लाल ड्रैगन', 'हरा ड्रैगन', 'सफेद ड्रैगन'];
export function tileName(id, lang = 'en') {
  if (id >= 27) return (lang === 'hi' ? honorHi : honorEn)[id - 27];
  return `${id % 9 + 1} ${(lang==='hi'?['वान','बिंदु','बाँस']:['characters','dots','bamboo'])[Math.floor(id / 9)]}`;
}
function shortTileName(id, lang) {
  if (lang === 'hi') return id<27?tileName(id,lang):['पूर्व','दक्षिण','पश्चिम','उत्तर','लाल','हरा','सफेद'][id-27];
  if (id < 27) return `${id % 9 + 1} ${['char.', 'dots', 'bam.'][Math.floor(id / 9)]}`;
  return ['East', 'South', 'West', 'North', 'Red dr.', 'Green dr.', 'White dr.'][id - 27];
}
export const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dotPositions = {
  1: [[36, 47]], 2: [[36, 28], [36, 66]], 3: [[23, 26], [36, 47], [49, 68]],
  4: [[23, 29], [49, 29], [23, 65], [49, 65]],
  5: [[23, 24], [49, 24], [36, 47], [23, 70], [49, 70]],
  6: [[23, 24], [49, 24], [23, 47], [49, 47], [23, 70], [49, 70]],
  7: [[23, 20], [36, 32], [49, 20], [23, 50], [49, 50], [23, 73], [49, 73]],
  8: [[23, 19], [49, 19], [23, 37], [49, 37], [23, 57], [49, 57], [23, 76], [49, 76]],
  9: [[19, 23], [36, 23], [53, 23], [19, 47], [36, 47], [53, 47], [19, 71], [36, 71], [53, 71]]
};
let svgSequence = 0;
export function tileSVG(id) {
  const n = id % 9 + 1, suit = Math.floor(id / 9);
  let face = '';
  if (suit === 0) face = `<text x="36" y="39" text-anchor="middle" font-size="28" fill="#242d28">${zhDigits[n - 1]}</text><text x="36" y="74" text-anchor="middle" font-size="33" fill="#a6362d">萬</text>`;
  else if (suit === 1) face = dotPositions[n].map(([x, y], i) => {
    const color = n === 1 || (n === 5 && i === 2) ? '#a6362d' : '#245544';
    const r = n === 1 ? 17 : n === 9 ? 6.5 : 7;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="2.4"/><circle cx="${x}" cy="${y}" r="${r * .38}" fill="${color}"/>`;
  }).join('');
  else if (suit === 2) {
    if (n === 1) face = '<path d="M28 53c-15-8-14-24 0-28 7-2 14 4 13 11 7-7 12-3 10 3l-9 6c1 10-5 20-15 22l-8 8 3-19" fill="#285f48"/><path d="M35 29l12-6-5 11" fill="#a6362d"/><circle cx="33" cy="31" r="2" fill="#faf7ea"/><path d="M27 46l-7-7m9 17-6-5m13 13-1 9" fill="none" stroke="#b99b45" stroke-width="3" stroke-linecap="round"/>';
    else face = dotPositions[n].map(([x, y]) => `<path d="M${x} ${y - 7}v14" stroke="#255d42" stroke-width="5" stroke-linecap="round"/><path d="M${x - 3} ${y}h6" stroke="#f7f2dd" stroke-width="1.4"/>`).join('');
  } else {
    const h = id - 27;
    if (h === 6) face = '<rect x="18" y="22" width="36" height="49" rx="2" fill="none" stroke="#486c8a" stroke-width="3"/><rect x="23" y="27" width="26" height="39" rx="1" fill="none" stroke="#486c8a" stroke-width="1"/>';
    else face = `<text x="36" y="62" text-anchor="middle" font-size="43" fill="${h === 4 ? '#ae302b' : h === 5 ? '#285e43' : '#263a45'}">${['東', '南', '西', '北', '中', '發'][h]}</text>`;
  }
  const gradient = `ivory-${++svgSequence}`;
  return `<svg viewBox="0 0 72 100" aria-hidden="true" focusable="false"><defs><linearGradient id="${gradient}" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fffef5"/><stop offset=".65" stop-color="#f6f0de"/><stop offset="1" stop-color="#e5ddc4"/></linearGradient></defs><rect x="1" y="7" width="70" height="92" rx="7" fill="#173f34"/><path d="M3 89v3q0 5 6 5h54q6 0 6-5v-3" fill="none" stroke="#4e7860" stroke-width="2"/><rect x="1.5" y="1" width="69" height="92" rx="6" fill="url(#${gradient})" stroke="#d7cfb5"/><path d="M8 3h56q4 0 4 5v75" stroke="#ffffff" fill="none" stroke-width="1.4" opacity=".85"/><g font-family="Kaiti SC,STKaiti,KaiTi,serif">${face}</g></svg>`;
}
export function tileBack(){return '<span class="tile-back" aria-hidden="true"><i></i></span>';}
export function tileMarkup(id, { lang = 'en', labels = true, action = '', index = id, selected = false, disabled = false, extra = '' } = {}) {
  const tag = action ? 'button' : 'span';
  const name = tileName(id, lang);
  return `<${tag} class="tile ${selected ? 'selected' : ''} ${extra}" ${action ? `type="button" data-action="${action}" data-index="${index}" aria-pressed="${selected}" ${disabled ? 'disabled' : ''}` : 'role="img"'} aria-label="${escapeHTML(name)}">${tileSVG(id)}${selected ? '<span class="selection-mark" aria-hidden="true">✓</span>' : ''}${labels ? `<span class="tile-name" aria-hidden="true">${shortTileName(id, lang)}</span>` : ''}</${tag}>`;
}
