import {COLORS, packGroups} from './engine.js';

const WIDTH = 70;
const HEIGHT = 68;
const RESOLUTION = 3;
const NEUTRAL = [177, 155, 174];

function shade(rgb, amount) {
  const target = amount > 0 ? 255 : 0;
  return `rgb(${rgb.map(value => Math.round(value + (target - value) * Math.abs(amount))).join(',')})`;
}

// Cache the clay facade at sprite resolution, so animated play only draws bitmaps.
export class HouseArt {
  constructor() {
    this.cache = new Map();
    this.colors = COLORS.map(color => color.main.slice(1).match(/../g).map(part => parseInt(part, 16)));
  }

  setColors(colors) {
    this.colors = colors;
    this.cache.clear();
  }

  draw(context, pack, hidden, visibleWindows) {
    const key = hidden ? 'mystery' : pack.colors.join(',');
    let sprite = this.cache.get(key);
    if (visibleWindows !== null) {
      sprite = this.createSprite(pack, hidden, new Set(visibleWindows));
    } else if (!sprite) {
      sprite = this.createSprite(pack, hidden);
      this.cache.set(key, sprite);
    }
    context.drawImage(sprite, 0, 0, WIDTH, HEIGHT);
  }

  createSprite(pack, hidden, visibleWindows = null) {
    const sprite = document.createElement('canvas');
    sprite.width = WIDTH * RESOLUTION;
    sprite.height = HEIGHT * RESOLUTION;
    const pen = sprite.getContext('2d');
    pen.scale(RESOLUTION, RESOLUTION);

    function gradient(y, height, stops) {
      const fill = pen.createLinearGradient(0, y, 0, y + height);
      stops.forEach(([position, color]) => fill.addColorStop(position, color));
      return fill;
    }
    function round(x, y, width, height, radius, fill) {
      pen.beginPath();
      pen.roundRect(x, y, width, height, radius);
      pen.fillStyle = fill;
      pen.fill();
    }
    function pane(x, y, width, height, color) {
      round(x, y + .6, width, height, 3.6, '#b68f6d');
      round(x, y, width, height - .3, 3.6,
        gradient(y, height, [[0, '#fff9e7'], [.55, '#ffe4bc'], [1, '#d8ac7d']]));
      round(x + 1, y + 1, width - 2, height - 2, 2.9, shade(color, -.25));
      round(x + 1.5, y + 1.7, width - 3, height - 3, 2.4,
        gradient(y, height, [[0, shade(color, -.13)], [.25, shade(color, .04)], [.75, shade(color, .09)], [1, shade(color, -.08)]]));
    }

    // Thin cream walls and foundation leave nearly all the facade for windows.
    round(2, 12, 66, 53, 5, '#bd936d');
    round(2.5, 12, 65, 52, 5,
      gradient(12, 52, [[0, '#fff0d2'], [.45, '#ffe7c5'], [1, '#e6bc8e']]));
    round(1, 63, 68, 3, 1.5,
      gradient(63, 3, [[0, '#ffedcb'], [.6, '#e9c298'], [1, '#b48860']]));

    if (hidden) {
      pane(4.5, 15, 61, 47, NEUTRAL);
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.font = '900 41px "Arial Rounded MT Bold", system-ui, sans-serif';
      pen.fillStyle = '#816b78';
      pen.fillText('?', 35.6, 40.8);
      pen.fillStyle = '#fff0cf';
      pen.fillText('?', 35, 39.5);
    } else {
      // Row-major order preserves the exact colour and release index of each worker.
      pack.colors.forEach((color, index) => {
        const x = 4 + (index % 3) * 20.8;
        const y = 15 + Math.floor(index / 3) * 15.7;
        const pigment = visibleWindows && !visibleWindows.has(index) ? [144, 131, 115] : this.colors[color];
        pane(x, y, 20.4, 15.3, pigment);
      });
    }

    // One continuous rounded roof, with solid colour segments in supply proportions.
    const groups = hidden ? [{color: -1, count: pack.colors.length}] : packGroups(pack);
    pen.save();
    pen.beginPath();
    pen.moveTo(1, 14);
    pen.bezierCurveTo(-1, 10, 3, 4, 10, 4);
    pen.lineTo(60, 4);
    pen.bezierCurveTo(67, 4, 71, 10, 69, 14);
    pen.quadraticCurveTo(68, 16, 65, 15);
    pen.quadraticCurveTo(35, 12.8, 5, 15);
    pen.quadraticCurveTo(2, 16, 1, 14);
    pen.closePath();
    pen.clip();
    let left = 0;
    for (const group of groups) {
      const pigment = hidden ? NEUTRAL : this.colors[group.color];
      const width = WIDTH * group.count / pack.colors.length;
      pen.fillStyle = gradient(4, 12, [[0, shade(pigment, .28)], [.35, shade(pigment, .08)], [.7, shade(pigment, -.02)], [1, shade(pigment, -.3)]]);
      pen.fillRect(left, 3, width + .05, 14);
      left += width;
    }
    pen.restore();

    const chimneyColor = hidden ? NEUTRAL : this.colors[groups.at(-1).color];
    round(49, 2, 12, 7, 1.2, gradient(2, 7, [[0, '#fff0d5'], [1, '#deb78e']]));
    round(48, .5, 14, 3.2, 1.6, gradient(.5, 3.2, [[0, shade(chimneyColor, .3)], [1, shade(chimneyColor, -.1)]]));
    round(52, 4.4, 6, .8, .4, '#bc936f');
    round(52, 6.3, 6, .8, .4, '#bc936f');
    return sprite;
  }
}
