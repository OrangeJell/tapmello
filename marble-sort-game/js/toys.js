import {image} from './platform.js';
// Atlas order: twelve employees, then twelve colourways of each vehicle/building.
export const toy = {employee:0, office:12, shuttle:24, nextShuttle:36, mystery:48, tree:49};

export async function loadToys() {
  const atlas = await image(new URL('../assets/clay-toys.webp', import.meta.url).href);
  const cell = atlas.naturalWidth / 4;
  // Sample the unobstructed centre of each shuttle roof for matching house art.
  const sampler = document.createElement('canvas');
  sampler.width = atlas.naturalWidth;
  sampler.height = atlas.naturalHeight;
  const sampleContext = sampler.getContext('2d', {willReadFrequently:true});
  sampleContext.drawImage(atlas, 0, 0);
  const colors = Array.from({length:12}, (_, color) => {
    const index = toy.shuttle + color;
    const x = Math.floor((index % 4 + .5) * cell);
    const y = Math.floor((Math.floor(index / 4) + .13) * cell);
    return Array.from(sampleContext.getImageData(x, y, 1, 1).data).slice(0, 3);
  });
  function paint(context, index, x, y, width, height) {
    const left = (index % 4) * cell + 2;
    const top = Math.floor(index / 4) * cell + 2;
    context.drawImage(atlas, left, top, cell - 4, cell - 4, x, y, width, height);
  }
  return {paint, colors};
}
