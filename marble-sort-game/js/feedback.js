import {COLORS} from './engine.js';
import {BOX_X} from './view.js';
import {toy} from './toys.js';
import {t} from './i18n.js';

const FLIGHT_TIME = .88;
const COMBO_WINDOW = 4;

export class Feedback {
  constructor(canvas, view, board, progress) {
    Object.assign(this, {canvas, view, board, progress});
    this.context = canvas.getContext('2d');
    this.reset();
  }

  reset() {
    this.flights = [];
    this.lastDeparture = -Infinity;
    this.count = 0;
    this.clock = 0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.hidden = true;
  }

  depart(event) {
    this.count = this.clock - this.lastDeparture < COMBO_WINDOW ? this.count + 1 : 1;
    this.lastDeparture = this.clock;
    if (!this.view.reduced) {
      this.flights.push({lane: event.lane, color: event.color, start: this.clock});
      this.flights = this.flights.slice(-8);
    }
    return this.count;
  }

  get active() {
    return this.flights.length > 0 || (this.count >= 4 && this.clock - this.lastDeparture < COMBO_WINDOW);
  }

  draw(dt) {
    this.clock += dt;
    this.flights = this.flights.filter(flight => this.clock - flight.start < FLIGHT_TIME);
    this.canvas.hidden = !this.active;
    if (!this.active) return;
    const c = this.context;
    const bounds = this.canvas.getBoundingClientRect();
    const board = this.board.getBoundingClientRect();
    const progress = this.progress.getBoundingClientRect();
    const ratio = Math.min(2, devicePixelRatio || 1);
    const width = Math.round(bounds.width * ratio), height = Math.round(bounds.height * ratio);
    if (width !== this.canvas.width || height !== this.canvas.height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, bounds.width, bounds.height);
    const unit = board.width / 480;
    const endX = progress.right - bounds.left;
    const endY = progress.top - bounds.top + progress.height / 2;
    for (const flight of this.flights) {
      const age = (this.clock - flight.start) / FLIGHT_TIME;
      const startX = board.left - bounds.left + BOX_X[flight.lane] * unit;
      const startY = board.bottom - bounds.top - 188 * unit;
      const point = p => {
        const eased = 1 - (1 - p) ** 1.7;
        return [startX + (endX - startX) * eased + Math.sin(p * Math.PI) * (flight.lane < 2 ? -32 : 32),
          startY + (endY - startY) * eased - 22 * Math.sin(p * Math.PI)];
      };
      c.save();
      for (let i = 4; i > 0; i--) {
        if (age < i * .027) continue;
        c.globalAlpha = .48 - i * .075;
        star(c, ...point(age - i * .027), 8 - i, '#ffda78');
      }
      const morph = Math.min(1, Math.max(0, (age - .22) / .22));
      const [x, y] = point(age);
      if (morph < 1 && this.view.paintToy) {
        c.globalAlpha = 1 - morph;
        this.view.paintToy(c, toy.shuttle + flight.color, x - 28 * unit, y - 28 * unit, 56 * unit, 56 * unit);
      }
      c.globalAlpha = (this.view.paintToy ? morph : 1) * Math.min(1, (1 - age) / .08);
      star(c, x, y, (12 + Math.sin(age * Math.PI) * 9) * Math.min(1, (1 - age) * 9),
        COLORS[flight.color].light, true);
      c.restore();
    }
    const comboAge = this.clock - this.lastDeparture;
    if (this.count >= 4 && comboAge < COMBO_WINDOW) {
      const x = board.left - bounds.left + board.width * .65;
      const y = board.top - bounds.top + this.view.sceneY(347) * unit;
      const hop = this.view.reduced ? 0 : Math.abs(Math.sin(comboAge * 10)) * Math.exp(-comboAge * 4) * 12;
      c.save();
      c.globalAlpha = Math.min(1, (COMBO_WINDOW - comboAge) / .4);
      c.textAlign = 'center';
      c.lineJoin = 'round';
      c.lineWidth = 4;
      c.strokeStyle = '#fff8e8';
      c.fillStyle = this.count >= 12 ? '#744580' : '#9e4c30';
      for (const [label, size, offset] of [[t('departureCombo'), 14, -8], ['×' + this.count, 25, 16]]) {
        c.font = '900 ' + size + 'px system-ui, sans-serif';
        c.strokeText(label, x, y + offset - hop);
        c.fillText(label, x, y + offset - hop);
      }
      c.restore();
    }
  }
}

function star(c, x, y, size, fill, face = false) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    const radius = i % 2 ? size * .58 : size;
    c.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = '#fff9e8';
  c.lineWidth = 1.2;
  c.stroke();
  if (!face || size < 5) return;
  c.fillStyle = '#684d42';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.arc(x + side * size * .2, y - size * .08, size * .075, 0, 2 * Math.PI);
    c.fill();
  }
  c.beginPath();
  c.arc(x, y + size * .04, size * .17, 0, Math.PI);
  c.fill();
}
