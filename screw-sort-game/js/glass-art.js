import { shapePath } from './geometry.js';
export const PAINTS = { rose: '#ff8089', aqua: '#7be4ec', yellow: '#ffe56b', lime: '#d5fa7d' };
export function screwHead(color) {
  const turn=['coral','violet'].includes(color)?45:color==='pink'?16:0;
  const slot='M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z';
  return `<span class="screw-head" data-color="${color}" style="--color:var(--${color})" aria-hidden="true"><span class="screw-slot" style="--slot-turn:${turn}deg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${slot}" fill="#ffffff55" transform="translate(0 1)"/><path d="${slot}" fill="currentColor" stroke="currentColor" stroke-width=".7" stroke-linejoin="round"/></svg></span></span>`;
}
export function plateSVG(board) {
  const path = shapePath(board), id = board.id, w = board.width, h = board.height;
  const holes = board.screws.map(s => `<circle cx="${w/2+s.x}" cy="${h/2+s.y}" r="7" fill="black"/>`).join('');
  return `<svg class="plate-art" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <defs>
      <mask id="holes-${id}" maskUnits="userSpaceOnUse" x="-8" y="-8" width="${w+16}" height="${h+16}"><path d="${path}" fill="white"/>${holes}</mask>
      <clipPath id="clip-${id}"><path d="${path}"/></clipPath>
      <linearGradient id="tint-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--glass-color)" stop-opacity=".91"/><stop offset=".44" stop-color="var(--glass-color)" stop-opacity=".85"/><stop offset="1" stop-color="var(--glass-color)" stop-opacity=".95"/></linearGradient>
      <linearGradient id="shine-${id}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="white" stop-opacity=".18"/><stop offset=".36" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="white" stop-opacity=".04"/></linearGradient>
      <linearGradient id="bevel-${id}" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="white"/><stop offset=".24" stop-color="white" stop-opacity=".8"/><stop offset=".48" stop-color="white" stop-opacity=".12"/><stop offset=".78" stop-color="white" stop-opacity=".03"/><stop offset="1" stop-color="white" stop-opacity=".45"/></linearGradient>
      <linearGradient id="reflection-${id}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="white" stop-opacity="0"/><stop offset=".45" stop-color="white" stop-opacity=".02"/><stop offset=".92" stop-color="white" stop-opacity=".22"/><stop offset="1" stop-color="white" stop-opacity=".02"/></linearGradient>
      <linearGradient id="hole-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#718f92" stop-opacity=".8"/><stop offset=".36" stop-color="white"/><stop offset="1" stop-color="white"/></linearGradient>
    </defs>
    <path class="depth-shadow" d="${path}"/>
    <g class="glass-detail">
    <path class="glass-shadow" d="${path}" transform="translate(0 3)"/>
    <path class="glass-thickness" d="${path}" transform="translate(0 2.4)"/>
    <g mask="url(#holes-${id})"><path class="glass-fill" d="${path}" fill="url(#tint-${id})"/><path class="glass-shine" d="${path}" fill="url(#shine-${id})"/>
      <g clip-path="url(#clip-${id})" fill="url(#reflection-${id})"><path d="M${w*.28} -20h${w*.32}l${-w*.36} ${h+40}h${-w*.32}Z"/></g>
      <path class="glass-bevel" d="${path}" stroke="url(#bevel-${id})"/>
    </g>
    <path class="glass-rim-outer" d="${path}"/><path class="glass-rim" d="${path}"/>
    ${board.screws.map(s => `<circle class="glass-hole" cx="${w/2+s.x}" cy="${h/2+s.y}" r="7" stroke="url(#hole-${id})"/>`).join('')}
    </g>
  </svg>`;
}
export const ICONS = {
  pause: '<svg viewBox="0 0 32 32"><rect x="7" y="6" width="6" height="20" rx="3"/><rect x="19" y="6" width="6" height="20" rx="3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.8c0-1 1.1-1.6 1.9-1.1l11 7.2a1.3 1.3 0 0 1 0 2.2l-11 7.2c-.8.5-1.9-.1-1.9-1.1Z"/></svg>',
  retry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10a8 8 0 1 1 1.8 7.3M4 4v6h6"/></svg>',
  extra: '<svg viewBox="0 0 64 64"><circle cx="32" cy="33" r="23" fill="#47738c" stroke="white" stroke-width="4"/><circle cx="32" cy="33" r="17" fill="#21475e"/><path d="M23 33h18M32 24v18" stroke="#b6f36e" stroke-width="6" stroke-linecap="round"/></svg>',
  melt: '<svg viewBox="0 0 64 64"><path d="M25 7h14v5h-3v13l15 24q3 6-4 7H17q-7-1-4-7l15-24V12h-3Z" fill="#e9faff" stroke="white" stroke-width="5" stroke-linejoin="round"/><path d="M22 35h20l10 17H12Z" fill="#7bd663"/><path d="M25 7h14v5h-3v13l15 24q3 6-4 7H17q-7-1-4-7l15-24V12h-3Z" fill="none" stroke="#36637e" stroke-width="2" stroke-linejoin="round"/><circle cx="26" cy="45" r="3" fill="#c6f49e"/><circle cx="37" cy="49" r="2" fill="#c6f49e"/></svg>',
  chest: '<svg viewBox="0 0 72 58"><path d="m9 22 27-9 27 9v26l-27 8L9 46Z" fill="#e3f4fd" stroke="#678b9b" stroke-width="2"/><path d="m36 31 27-9v26l-27 8Z" fill="#92c6df"/><path d="m9 22 27 9 27-9-27-9Z" fill="#517e91"/><path d="M9 22 1 11l26-7 9 9m27 9 8-11-26-7-9 9" fill="#fff" stroke="#8ab0c1" stroke-width="2"/><path d="M36 31v25" stroke="#678b9b" stroke-width="2"/></svg>',
};
