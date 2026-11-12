// Shared asynchronous loading for transparent prehistoric character artwork.
// Callers draw their procedural art first, so missing files and decode errors
// naturally leave the existing illustration in place.
const imageCache = new Map();
const readyImages = new Map();

function imageFor(species) {
  if (!imageCache.has(species)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { readyImages.set(species, image); resolve(image); };
      image.onerror = () => reject(new Error(`Could not load prehistoric art: ${species}`));
      image.src = new URL(`./assets/prehistoric/${species}.png`, import.meta.url).href;
    });
    imageCache.set(species, promise);
  }
  return imageCache.get(species);
}

// Immediate-mode canvases call this each frame; decoding never blocks play.
export function drawPhotoreal(context, species, x, y, width, height) {
  const image = readyImages.get(species);
  if (!image) { imageFor(species).catch(() => {}); return false; }
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  context.drawImage(image, x + (width - image.naturalWidth * scale) / 2,
    y + height - image.naturalHeight * scale, image.naturalWidth * scale, image.naturalHeight * scale);
  return true;
}

function sourceCanvas(target) {
  if (target && typeof target.getContext === 'function') return target;
  if (target && typeof target.getSourceImage === 'function') {
    const image = target.getSourceImage();
    if (image && typeof image.getContext === 'function') return image;
  }
  return null;
}

/** Replace a canvas texture after image decode; returns false on unsupported or failed loads. */
export function applyPhotorealTexture(target, species, options = {}) {
  const canvas = sourceCanvas(target);
  if (!canvas || typeof Image === 'undefined') return Promise.resolve(false);
  return imageFor(species).then((image) => {
    const context = canvas.getContext('2d');
    if (!context) return false;
    const width = canvas.width, height = canvas.height;
    const inset = options.inset === undefined ? 0.04 : options.inset;
    const maxW = width * (1 - inset * 2), maxH = height * (1 - inset * 2);
    const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const x = (width - drawW) / 2 + (options.offsetX || 0) * width;
    const y = (height - drawH) / 2 + (options.offsetY || 0) * height;
    context.clearRect(0, 0, width, height);
    context.save();
    if (options.flipX) {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    if (options.alpha !== undefined) context.globalAlpha = options.alpha;
    if (options.scaleY && options.scaleY !== 1) {
      const centerY = y + drawH / 2;
      context.translate(0, centerY);
      context.scale(1, options.scaleY);
      context.translate(0, -centerY);
    }
    context.drawImage(image, x, y, drawW, drawH);
    if (options.darken) {
      context.globalCompositeOperation = 'source-atop';
      context.fillStyle = `rgba(8, 18, 28, ${options.darken})`;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';
    }
    context.restore();
    if (target && typeof target.refresh === 'function') target.refresh();
    return true;
  }).catch(() => false);
}
