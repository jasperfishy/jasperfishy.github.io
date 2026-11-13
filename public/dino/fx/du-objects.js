/* Dinosaur Universe — photoreal objects (DUFX.objects).
 *
 * The games were built drawing emoji: `ctx.fillText('🥚', x, y)` and
 * `el.innerHTML = '🦋'`. An emoji is a font glyph chosen by whoever shipped
 * the operating system, so the same screen looks different on every device and
 * never once looks like a photograph. This file replaces that layer with the
 * specimen photographs in assets/objects and keeps the emoji only as the thing
 * drawn while an image is still arriving.
 *
 *   DUFX.objects.url('ammonite')         the asset path for a specimen
 *   DUFX.objects.glyph('🦋')             the specimen an emoji stands for
 *   DUFX.objects.img('conch', 24)        '<img …>' for HTML builders
 *   DUFX.objects.draw(ctx, 'bone', x, y, size)   centred canvas blit
 *   DUFX.objects.hydrate(root)           swap leftover emoji text for images
 *   DUFX.objects.ready                   resolves once every queued image loaded
 *
 * The table is keyed by files that exist. It used to be keyed by a much older
 * vocabulary — balloon, cookie, shell, tree — and 53 of those slugs had no
 * photograph behind them, so every one of those emoji became an invisible hole
 * where a picture should have been. tests/objects-check.cjs now fails the
 * build if a name in this file, or a name any game asks for, has no webp.
 */
(function () {
  'use strict';
  const DUFX = window.DUFX = window.DUFX || {};
  if (DUFX.objects && DUFX.objects.file) return;

  const BASE = new URL('../assets/objects/', document.currentScript ? document.currentScript.src : location.href).href;

  /* One line per photograph: the name is the file, the string lists the emoji
   * that mean it. Several glyphs sharing one picture is deliberate — a game
   * that wants "a crystal" and one that wants "a gem" should both get the same
   * quartz rather than three near-identical files.
   *
   * What is NOT here matters as much as what is. Balloons, hearts, bells and
   * cartoon fruit have no photograph because this universe has no such things:
   * it has amber with a midge still inside it, a bone flute, a dinosaur
   * footprint in wet sand. Those are the objects the games are being rewritten
   * to ask for by name, and an emoji with no line here is left alone rather
   * than swapped for a hole.
   */
  const FAMILIES = [
    ['egg', '🥚🐣'], ['hatchling', '🦕🦖🦎🐊'], ['fern', '🌿🍃'], ['sprout', '🌱'],
    ['leaf', '🍂🍁🍀'], ['flower', '🌼🌸🌻🌷🌺🌹💐🪷🏵️'],
    ['grass', '🌾'], ['reeds', '🎋'], ['moss', '☘️'], ['mushroom', '🍄'],
    ['seedpod', '🌰'], ['pine', '🌲🌳🎄'], ['palm', '🌴'], ['cycad', '🌵'],
    ['ginkgo', '🪻'], ['ivy', '🪴'], ['driftwood', '🪵'],
    ['berry', '🍓🫐🍒🍇'], ['conch', '🐚'], ['ammonite', '🌀'], ['snail', '🐌'], ['dragonfly', '🦋'],
    ['fish', '🐟🐠🐡'], ['turtle', '🐢'], ['sharktooth', '🦈'], ['claw', '🦅'],
    ['quartz', '💎🔷🔶'], ['amethyst', '🟣'], ['citrine', '🟡'], ['garnet', '🔴'],
    ['jade', '🟢'], ['pyrite', '🪙'], ['moonstone', '🔮'], ['opal', '🌗'], ['obsidian', '⬛'],
    ['obsidianblade', '🗡️'], ['flint', '🪓'], ['meteorite', '☄️'],
    ['stone', '🪨'], ['sandstone', '🟧'], ['slate', '🟦'], ['coal', '⚫'],
    ['carnelian', '🧡'], ['goldquartz', '🟨'], ['agate', '🥍'], ['mica', '🪩'],
    ['bone', '🦴🦷'], ['skull', '💀☠️👻'], ['footprint', '👣🐾🦶'], ['feather', '🪶🪽'],
    ['scroll', '📖📚📔📒📕📗📰📜'], ['cart', '🛒🚗🚙🚛🚌🚜🏎️'],
    ['satchel', '🎒🧳📦'], ['basket', '🧺🪣'], ['signpost', '🗺️🧭🚩🏁'],
    ['claypot', '🏺🍶'], ['rope', '🪢🧶'], ['membrane', '🥁'], ['logdrum', '🪘'],
    ['boneflute', '🎺🪈'], ['lithophone', '🎹'], ['rainstick', '🎼'],
    ['bullroarer', '🎏'], ['lamp', '💡🔦🕯️'], ['torch', '🪔'], ['flame', '🔥'], ['ember', '💥'], ['firepit', '🌋'],
    ['smoke', '💨'], ['cloud', '☁️🌤️🌥️🌦️🌧️⛈️'], ['mist', '🌫️🌁'],
    ['raindrop', '💧'], ['splash', '🌊💦🫧'], ['snowflake', '❄️⛄🧊'],
    ['lightning', '⚡🌩️'], ['sun', '☀️🌞🔆'], ['moon', '🌙🌛🌝🌑🌕'],
    ['nightstar', '🌌'], ['star', '⭐🌟✨✦✧★☆'], ['halo', '😇'], ['rainbow', '🌈'],
    ['aurora', '🌠'], ['earth', '🟤'], ['dust', '🌪️'], ['concretion', '🥌'],
    ['amber', '🍯🐝'], ['amberpendant', '🟠'], ['nest', '🪹🛖'],
    ['empty-nest', '🪺'], ['egg-clutch', '🍳'], ['egg-cracked', '🐔'],
    ['petwood', '🎍'], ['bonebeads', '📿'], ['riverstone', '⚪']
  ];

  // A variation selector is typography, not meaning: ☀ and ☀️ are the same sun.
  function strip(s) { return String(s).replace(/[️‍]/g, ''); }

  const GLYPH = new Map();
  const NAMED = new Set();
  for (const fam of FAMILIES) {
    NAMED.add(fam[0]);
    for (const g of fam[1]) {
      const key = strip(g);
      if (key && !GLYPH.has(key)) GLYPH.set(key, fam[0]);
    }
  }

  /* The word a child hears when the game speaks or captions a thing. Most
   * specimen names already are the word, so only the odd ones are listed —
   * without this, `play.say("Like the " + emoji)` reads the glyph out loud. */
  const WORD = {
    hatchling: 'baby dinosaur', seedpod: 'seed pod', pine: 'pine tree', palm: 'palm tree',
    ginkgo: 'ginkgo leaf', ivy: 'ivy leaf', conch: 'conch shell', sharktooth: 'shark tooth',
    pyrite: "fool's gold", obsidian: 'volcanic glass', obsidianblade: 'obsidian blade',
    concretion: 'round stone', membrane: 'hide drum', logdrum: 'log drum', boneflute: 'bone flute',
    lithophone: 'stone xylophone', rainstick: 'rain stick', lamp: 'oil lamp', firepit: 'fire pit',
    nightstar: 'night sky', amberpendant: 'amber pendant', 'egg-clutch': 'clutch of eggs',
    'egg-cracked': 'cracked egg', petwood: 'bamboo', bonebeads: 'bone beads',
    riverstone: 'river stone', claypot: 'clay pot', goldquartz: 'gold quartz'
  };

  const cache = new Map(), pending = [];
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { img.__ok = true; };
    img.onerror = () => { cache.delete(name); };
    img.src = BASE + name + '.webp';
    cache.set(name, img);
    pending.push(img);
    return img;
  }

  /* One pass over the text nodes, so a game is not edited one file at a time to
   * lose its emoji. A trailing variation selector has to be swallowed by the
   * match or `☀️` looks up as `☀` and is never found. */
  const EMOJI_RE = /[🀀-🫿☀-➿⬀-⯿]️?(?:‍[🀀-🫿☀-➿⬀-⯿]️?|[🏻-🏿])?/gu;
  /* `test()` on a /g regex leaves lastIndex past the match, and matchAll() starts
   * from wherever lastIndex was — so testing and then matching with one regex
   * finds the glyph, reports it, and then replaces nothing. The guard gets its
   * own stateless copy. */
  const HAS_EMOJI = new RegExp(EMOJI_RE.source, 'u');

  const objects = DUFX.objects = {
    base: BASE,
    known: NAMED,
    /** A specimen name is accepted as soon as its photograph is in the library. */
    slug: (nameOrGlyph) => {
      const g = GLYPH.get(strip(nameOrGlyph));
      if (g) return g;
      return NAMED.has(nameOrGlyph) ? nameOrGlyph : null;
    },
    glyph: (g) => GLYPH.get(strip(g)) || null,
    /** Say "a conch shell", never "🐚" — the word behind a glyph or a name. */
    word: (nameOrGlyph) => {
      const s = objects.slug(nameOrGlyph);
      if (!s) return String(nameOrGlyph);
      return WORD[s] || s.replace(/-/g, ' ');
    },
    /* Speech must never read a glyph. Each emoji in a sentence becomes the
     * word for its specimen; anything this universe has no photograph — and so
     * no word — for is dropped, because "heavy white heart" is not something a
     * child should hear out of a dinosaur. */
    spoken: (text) => String(text).replace(EMOJI_RE, (m) => {
      const s = GLYPH.get(strip(m));
      return s ? (WORD[s] || s.replace(/-/g, ' ')) : '';
    }).replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim(),
    /** The honest answer to "does this object exist" — tests and games both need it. */
    has: (name) => !!objects.slug(name),
    file: (name) => BASE + name + '.webp',
    url: (name) => BASE + (objects.slug(name) || name) + '.webp',
    image: (name) => {
      const s = objects.slug(name);
      if (!s) return null;
      const img = load(s);
      return img && img.__ok && img.width ? img : null;
    },
    /* HTML builders call this inside a template string. An unknown name yields
     * an empty span rather than a torn picture frame: a missing object must
     * never read as a hole in the middle of a screen a child is looking at. */
    img: (name, size, cls) => {
      const s = objects.slug(name);
      if (!s) return '<span class="du-obj-missing" aria-hidden="true"></span>';
      const px = size || 28;
      return '<img class="du-obj' + (cls ? ' ' + cls : '') + '" src="' + BASE + s + '.webp" width="' + px +
        '" height="' + px + '" alt="" loading="eager" decoding="async" style="width:' + px + 'px;height:' + px +
        'px;object-fit:contain;vertical-align:middle">';
    },
    /* Canvas games: draw the photograph, and until it has decoded draw the
     * emoji, so a slow first load shows a picture instead of a blank hole. */
    draw: (ctx, name, x, y, size, fallback) => {
      const s = objects.slug(name);
      const img = s && load(s);
      if (img && img.__ok && img.width) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        return true;
      }
      // Is `name` a glyph (draw it while the photograph arrives) or already a
      // specimen name (draw nothing until it loads)?
      if (fallback !== false && s && HAS_EMOJI.test(String(name))) {
        ctx.save();
        ctx.font = Math.round(size) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, x, y);
        ctx.restore();
      }
      return false;
    },
    hydrate: (root) => {
      const host = root && root.querySelectorAll ? root : document;
      const nodes = [];
      const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue || !HAS_EMOJI.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
          const t = n.parentElement && n.parentElement.tagName;
          if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
          if (n.parentElement && n.parentElement.closest && n.parentElement.closest('.du-obj')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      for (let n = tw.nextNode(); n; n = tw.nextNode()) nodes.push(n);
      let swapped = 0;
      for (const node of nodes) {
        const text = node.nodeValue;
        if (!HAS_EMOJI.test(text)) continue;
        const frag = document.createDocumentFragment();
        let last = 0;
        for (const m of text.matchAll(EMOJI_RE)) {
          const name = GLYPH.get(strip(m[0]));
          if (!name) continue;
          const before = text.slice(last, m.index);
          if (before) frag.appendChild(document.createTextNode(before));
          const size = pxOf(node);
          const el = document.createElement('img');
          el.className = 'du-obj';
          el.src = BASE + name + '.webp';
          el.alt = '';
          el.decoding = 'async';
          el.style.width = el.style.height = size + 'px';
          el.style.objectFit = 'contain';
          /* Without this a photograph sits on the text baseline and hangs below
           * the words it belongs to. */
          el.style.verticalAlign = 'middle';
          /* Insurance against a photograph that is not where the table says it
           * is: the glyph goes back rather than leaving the gap. */
          el.onerror = () => {
            if (el.parentNode) el.parentNode.replaceChild(document.createTextNode(m[0]), el);
          };
          frag.appendChild(el);
          last = m.index + m[0].length;
          swapped++;
        }
        if (last !== 0) {
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          node.parentNode.replaceChild(frag, node);
        }
      }
      return swapped;
    },
    /* A run is not verified until the pixels are on screen, so tests wait on
     * this rather than on a timer. */
    ready: () => Promise.all(pending.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))),
    watch: (el) => {
      if (!el || !window.MutationObserver) return;
      /* Only the nodes that just landed get walked. Re-hydrating the whole body
       * on every mutation is a full TreeWalker per frame on the Phaser screens,
       * and those are the ones that mutate fastest. */
      let queue = null, raf = 0;
      const flush = () => {
        raf = 0;
        const nodes = queue;
        queue = null;
        nodes.forEach((n) => {
          if (n.nodeType === 1) objects.hydrate(n);
          else if (n.parentNode) objects.hydrate(n.parentNode);
        });
      };
      const mo = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'characterData') {
            (queue || (queue = new Set())).add(r.target.parentNode || r.target);
          } else {
            for (const n of r.addedNodes) {
              if (n.nodeType !== 1 && n.nodeType !== 3) continue;
              (queue || (queue = new Set())).add(n);
            }
          }
        }
        if (queue && !raf) raf = requestAnimationFrame(flush);
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
      return mo;
    }
  };

  function pxOf(node) {
    const p = node.parentElement;
    if (!p) return 24;
    try {
      const cs = getComputedStyle(p);
      const n = parseFloat(cs.fontSize) || 24;
      return Math.max(16, Math.min(56, Math.round(n * 1.05)));
    } catch (e) { return 24; }
  }

  // Every screen the app builds from HTML gets hydrated as it lands, which is
  // why games are not edited one by one to lose their emoji.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  function boot() {
    objects.hydrate(document.body);
    objects.watch(document.body);
  }
  DUFX.objects = objects;
})();
