import { DEFAULT_SKIN_TONE, skinTone } from './skin-tones.js';

const imageCache = new Map();
// Normalized bounds around the uncovered forearms in each body sprite.
// Garments without exposed skin are intentionally absent.
const skinRegions = Object.freeze({
  'labcoat-pair.png': [[.30,.08,.34,.14],[.13,.26,.22,.36],[.41,.34,.50,.48],[.80,.08,.84,.14],[.63,.26,.73,.36],[.89,.34,.98,.48]],
  'starter-masculine.png': [[.19,.26,.37,.39],[.70,.36,.87,.50]],
  'starter-feminine.png': [[.19,.26,.37,.39],[.70,.36,.87,.50]],
  'scout-masculine.png': [[.19,.25,.37,.38],[.70,.34,.87,.49]],
  'scout-feminine.png': [[.19,.25,.37,.38],[.70,.34,.87,.49]],
  'armored-masculine.png': [[.19,.27,.38,.40],[.70,.35,.87,.50]],
  'armored-feminine.png': [[.19,.27,.38,.40],[.70,.35,.87,.50]],
  'project-manager-pair.png': [[.13,.25,.24,.38],[.42,.34,.50,.49],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'project-manager-suit-pair.png': [[.13,.25,.24,.38],[.42,.34,.50,.49],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'roi-pirates-pair.png': [[.30,.08,.35,.18],[.13,.25,.24,.38],[.42,.34,.50,.49],[.79,.08,.85,.18],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'mage-noir-pair.png': [[.13,.25,.24,.38],[.42,.34,.50,.49],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'verrier-pair.png': [[.13,.25,.24,.38],[.42,.34,.50,.49],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'directeur-adjoint-pair.png': [[.31,.16,.36,.23],[.13,.25,.24,.38],[.42,.34,.50,.49],[.80,.16,.85,.23],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'antistatique-pair.png': [[.29,.08,.35,.14],[.13,.25,.24,.38],[.42,.34,.50,.49],[.79,.08,.85,.14],[.63,.25,.74,.38],[.90,.34,.99,.49]],
  'research-engineer-pair.png': [[.90,.34,.99,.49]]
});

export function inSkinRegion(file, x, y) {
  return (skinRegions[file] || []).some(([left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom);
}

function rgb(hex) {
  return [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
}

export function recolorSkinPixel(pixel, toneId) {
  const tone = skinTone(toneId);
  if (!tone || toneId === DEFAULT_SKIN_TONE) return pixel;
  const [r, g, b, alpha] = pixel;
  const lightness = .2126 * r + .7152 * g + .0722 * b;
  if (alpha < 80 || lightness < 145 || r < 155 || g < 90 || b < 60
    || r / g < 1.19 || r / g > 1.85 || g / b < 1.18 || g / b > 1.75) return pixel;
  const target = rgb(tone.color);
  const shade = Math.min(1.24, Math.max(.68, lightness / 196));
  return [...target.map(channel => Math.min(255, Math.round(channel * shade))), alpha];
}

export function recoloredOutfitUrl(source, toneId) {
  if (!skinTone(toneId) || toneId === DEFAULT_SKIN_TONE) return Promise.resolve(source);
  const file = source.split('/').pop();
  const regions = skinRegions[file];
  if (!regions) return Promise.resolve(source);
  const key = `${source}|${toneId}`;
  if (!imageCache.has(key)) imageCache.set(key, (async () => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const regionMask = new Uint8Array(canvas.width * canvas.height);
    for (const [left, top, right, bottom] of regions) {
      const x1 = Math.floor(left * canvas.width), x2 = Math.ceil(right * canvas.width);
      const y1 = Math.floor(top * canvas.height), y2 = Math.ceil(bottom * canvas.height);
      for (let y = y1; y < y2; y++) regionMask.fill(1, y * canvas.width + x1, y * canvas.width + x2);
    }
    for (let index = 0; index < frame.data.length; index += 4) {
      if (!regionMask[index / 4]) continue;
      const next = recolorSkinPixel(frame.data.subarray(index, index + 4), toneId);
      frame.data.set(next, index);
    }
    context.putImageData(frame, 0, 0);
    return canvas.toDataURL('image/png');
  })().catch(error => { imageCache.delete(key); throw error; }));
  return imageCache.get(key);
}

export function applyOutfitSkin(root, toneId) {
  for (const image of root.querySelectorAll('img[data-skin-source]')) {
    image.dataset.skinTone = toneId;
    const source = image.dataset.skinSource;
    recoloredOutfitUrl(source, toneId).then(url => {
      if (image.isConnected && image.dataset.skinTone === toneId) image.src = url;
    }).catch(() => { image.src = source; });
  }
}
