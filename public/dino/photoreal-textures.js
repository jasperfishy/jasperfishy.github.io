// Shared asynchronous loading for transparent prehistoric character artwork.
// Callers draw their procedural art first, so missing files and decode errors
// naturally leave the existing illustration in place.
//
// `library` names the folder the file lives in, because the prop photographs in
// assets/props and the environment materials in assets/environments are the same
// kind of thing — a surface to blit into a scene — and pass `library` explicitly
// rather than spelling a path into the species name, which a reader of the call
// cannot tell apart from a specimen.
const imageCache = new Map();
const readyImages = new Map();

function keyFor(species, library) { return library + '/' + species; }

function imageFor(species, library = 'prehistoric') {
  const key = keyFor(species, library);
  if (!imageCache.has(key)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { readyImages.set(key, image); resolve(image); };
      image.onerror = () => reject(new Error(`Could not load photoreal art: ${key}`));
      const extension='webp';
      image.src = new URL(`./assets/${library}/${species}.${extension}`, import.meta.url).href;
    });
    imageCache.set(key, promise);
  }
  return imageCache.get(key);
}

// Immediate-mode canvases call this each frame; decoding never blocks play.
export function drawPhotoreal(context, species, x, y, width, height, options = {}) {
  const library = options.library || 'prehistoric';
  const image = readyImages.get(keyFor(species, library));
  if (!image) { imageFor(species, library).catch(() => {}); return false; }
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  context.drawImage(image, x + (width - image.naturalWidth * scale) / 2,
    y + height - image.naturalHeight * scale, image.naturalWidth * scale, image.naturalHeight * scale);
  return true;
}

/* A prop, by the name it has in assets/props. Same call, one less thing the
   caller has to know about. */
export function drawProp(context, name, x, y, width, height) {
  return drawPhotoreal(context, name, x, y, width, height, { library: 'props' });
}

// Preserve the live excavation/painting alpha mask rather than filling removed soil.
export function overlayPhotorealMaterial(context, species, alpha=.7, blend='source-atop', library='prehistoric') {
  const image=readyImages.get(keyFor(species, library));
  if(!image){imageFor(species, library).catch(()=>{});return false;}
  context.save();context.globalCompositeOperation=blend;context.globalAlpha=alpha;
  context.drawImage(image,0,0,context.canvas.width,context.canvas.height);
  context.restore();return true;
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
  const library = options.library || 'prehistoric';
  const canvas = sourceCanvas(target);
  if (!canvas || typeof Image === 'undefined') return Promise.resolve(false);
  return imageFor(species, library).then((image) => {
    const context = canvas.getContext('2d');
    if (!context) return false;
    const width = canvas.width, height = canvas.height;
    const inset = options.inset === undefined ? 0.04 : options.inset;
    const maxW = width * (1 - inset * 2), maxH = height * (1 - inset * 2);
    const scale = (options.cover ? Math.max : Math.min)(maxW / image.naturalWidth, maxH / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const x = (width - drawW) / 2 + (options.offsetX || 0) * width;
    const y = (height - drawH) / 2 + (options.offsetY || 0) * height;
    // `keep` paints over whatever the game already drew, so a card can keep its
    // shape and border and gain a real fossil pressed into the middle of it.
    if (!options.material && !options.keep) context.clearRect(0, 0, width, height);
    context.save();
    if(options.material){context.globalCompositeOperation='source-atop';context.globalAlpha=.88;}
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
    if (options.darken || options.wash) {
      // source-atop paints only where the photograph already is, so a speckled
      // egg can be made golden without its glow leaking into the empty corners.
      context.globalCompositeOperation = 'source-atop';
      context.fillStyle = options.wash || `rgba(8, 18, 28, ${options.darken})`;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';
    }
    context.restore();
    if (target && typeof target.refresh === 'function') target.refresh();
    return true;
  }).catch(() => false);
}

/** The prop form of the above: a cut-out photograph from assets/props. */
export function applyPropTexture(target, name, options = {}) {
  return applyPhotorealTexture(target, name, Object.assign({ library: 'props' }, options));
}
