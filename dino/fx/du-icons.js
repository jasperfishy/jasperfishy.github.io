/* Dinosaur Universe — drawn interface icons (DUICONS).
 *
 * An interface control is not an object in the world, so it does not get a
 * photograph: a 20px speaker has to be a drawing. These are hand-built vectors
 * in the app's own ink — one stroke weight, round joins, `currentColor` — so a
 * sound toggle on the hub and a sound toggle inside a Phaser game look like
 * siblings rather than two different operating systems' font glyphs.
 *
 *   DUICONS.svg('sound')                 '<svg …>…</svg>' for a template
 *   DUICONS.mount(el)                    fill every [data-icon] under el
 *   DUICONS.set(el, 'lock', { muted })   put an icon into a live element
 *   DUICONS.hydrate(root)                swap leftover interface glyphs for drawings
 *
 * Games that need a thing from the world — an egg, a bone, an ammonite — use
 * DUFX.objects instead. This file is only for the controls around them, and it
 * stands down wherever the object layer already has a photograph.
 */
(function () {
  'use strict';
  if (window.DUICONS && window.DUICONS.svg) return;

  /* A five-point star is the one shape worth computing rather than typing: the
   * ten vertices come from two radii, and a hand-copied path always looks
   * lopsided at 16px. */
  function starPoints(cx, cy, outer, inner, n) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }
  const SPIKE = (function () {
    const d = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      d.push('M' + (12 + 4.6 * Math.cos(a)).toFixed(1) + ' ' + (12 + 4.6 * Math.sin(a)).toFixed(1) +
        'L' + (12 + 8.2 * Math.cos(a)).toFixed(1) + ' ' + (12 + 8.2 * Math.sin(a)).toFixed(1));
    }
    return d.join('');
  })();

  const PATHS = {
    /* --- controls --- */
    sound: '<path d="M4 9.5h2.6L11 6v12L6.6 14.5H4z"/>' + '<path d="M14.4 9.2a4 4 0 0 1 0 5.6M17 6.8a7.4 7.4 0 0 1 0 10.4"/>',
    'sound-off': '<path d="M4 9.5h2.6L11 6v12L6.6 14.5H4z"/><path d="M15 10l4.5 4.5M19.5 10L15 14.5"/>',
    music: '<path d="M9 17V6.2l8-2V14"/><ellipse cx="6.8" cy="17.2" rx="2.4" ry="2"/><ellipse cx="14.8" cy="14.2" rx="2.4" ry="2"/>',
    settings: '<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2.3"/><circle cx="8" cy="16" r="2.3"/>',
    lock: '<rect x="5" y="10.4" width="14" height="9.6" rx="2.6"/><path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4"/><path d="M12 14v2.6"/>',
    unlock: '<rect x="5" y="10.4" width="14" height="9.6" rx="2.6"/><path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.4-1.2"/><path d="M12 14v2.6"/>',
    search: '<circle cx="10.6" cy="10.6" r="5.6"/><path d="M14.8 14.8L20 20"/>',
    close: '<path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"/>',
    check: '<path d="M5 12.8l4.4 4.4L19 7.2"/>',
    cross: '<path d="M7 7l10 10M17 7L7 17"/>',
    refresh: '<path d="M19.4 12a7.4 7.4 0 1 1-2.2-5.3"/><path d="M19.6 3.6v3.9h-3.9"/>',
    replay: '<path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.3"/><path d="M4.4 3.6v3.9h3.9"/>',
    play: '<path d="M8 5.6l10 6.4-10 6.4z"/>',
    next: '<path d="M9 5.8L16.4 12 9 18.2"/>',
    back: '<path d="M15 5.8L7.6 12 15 18.2"/>',
    home: '<path d="M4 11.4L12 4.6l8 6.8"/><path d="M6.4 12.8v6.6h11.2v-6.6"/><path d="M10.4 19.4v-4.4h3.2v4.4"/>',
    mic: '<rect x="9.4" y="3.4" width="5.2" height="10" rx="2.6"/><path d="M5.8 11.6a6.2 6.2 0 0 0 12.4 0"/><path d="M12 17.8v2.8"/>',
    camera: '<path d="M3.6 8.6h3l1.6-2.2h6l1.6 2.2h3.6v10.8H3.6z"/><circle cx="12" cy="13.6" r="3.4"/>',
    film: '<rect x="3.4" y="6.6" width="17.2" height="11.8" rx="2"/><path d="M3.4 10.6h17.2M8 6.6l-2 4M13 6.6l-2 4M18 6.6l-2 4"/>',
    mail: '<rect x="3.4" y="6.4" width="17.2" height="12.2" rx="2"/><path d="M3.8 7.4L12 13.4l8.2-6"/>',
    book: '<path d="M12 6.6C9.8 4.8 6.6 4.6 4 5.4v12.2c2.6-.8 5.8-.6 8 1.2 2.2-1.8 5.4-2 8-1.2V5.4c-2.6-.8-5.8-.6-8 1.2z"/><path d="M12 6.6v12.2"/>',
    map: '<path d="M9 5.4L3.6 7.2v11.4L9 16.8l6 1.8 5.4-1.8V5.4L15 7.2z"/><path d="M9 5.4v11.4M15 7.2v11.4"/>',
    tools: '<path d="M14.6 4.4l4.8 4.8-2.4 2.4-4.8-4.8z"/><path d="M12.2 7 5 14.2V19h4.8L17 11.8"/><path d="M4.4 4.4l3.6 3.6"/>',
    dice: '<rect x="4.4" y="4.4" width="15.2" height="15.2" rx="3.4"/><circle cx="9" cy="9" r="1.25"/><circle cx="15" cy="15" r="1.25"/><circle cx="12" cy="12" r="1.25"/>',
    eye: '<path d="M2.8 12c2.6-4 5.8-6 9.2-6s6.6 2 9.2 6c-2.6 4-5.8 6-9.2 6s-6.6-2-9.2-6z"/><circle cx="12" cy="12" r="2.8"/>',
    sleep: '<path d="M4.6 6.4h5.2L4.6 11.6h5.2"/><path d="M12.6 13.4h6.8l-6.8 5.2h6.8"/>',
    trophy: '<path d="M7.6 4.6h8.8v4.2a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 5.8H4.8a2.8 2.8 0 0 0 2.9 3.4M16.4 5.8h2.8a2.8 2.8 0 0 1-2.9 3.4"/><path d="M12 13.2v3.4M8.6 19.6h6.8M9.8 16.6h4.4l.8 3H9z"/>',
    medal: '<circle cx="12" cy="14.6" r="5"/><path d="M9 10.2L6.4 4.4h11.2L15 10.2"/><path d="M12 12.4l.9 1.9 2 .3-1.5 1.5.4 2-1.8-1-1.8 1 .4-2-1.5-1.5 2-.3z"/>',
    star: '<path d="M12 4.2l2.4 5 5.4.7-3.9 3.8 1 5.4-4.9-2.7-4.9 2.7 1-5.4L4.1 9.9l5.4-.7z"/>',
    spark: '<path d="M12 3.6l1.9 5.5 5.5 1.9-5.5 1.9-1.9 5.5-1.9-5.5-5.5-1.9 5.5-1.9z"/><path d="M18.6 15.4l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="' + SPIKE + '"/>',
    moon: '<path d="M19 14.4A7.6 7.6 0 1 1 9.6 5a6 6 0 0 0 9.4 9.4z"/>',
    /* --- the world, when a control needs a picture of it --- */
    egg: '<path d="M12 3.8c3.3 2.6 5.2 5.9 5.2 8.9a5.2 5.2 0 0 1-10.4 0c0-3 1.9-6.3 5.2-8.9z"/>',
    bone: '<circle cx="5.6" cy="8.4" r="2.2"/><circle cx="5.6" cy="15.6" r="2.2"/><circle cx="18.4" cy="8.4" r="2.2"/><circle cx="18.4" cy="15.6" r="2.2"/><path d="M7.4 9.8h9.2M7.4 14.2h9.2"/>',
    shell: '<path d="M19 16.4A7 7 0 1 0 5 12a4.6 4.6 0 1 0 8.4-2.6A3 3 0 1 0 12 11"/><path d="M19 16.4H5"/>',
    leaf: '<path d="M5 19C4 12 8 5.6 19 5c.6 8.8-4.4 13.6-11 12.4"/><path d="M5.8 18.2 13 11"/>',
    feather: '<path d="M19 5c-7 0-11.4 3.6-12.4 9.4L5 19"/><path d="M8.4 12.6c3.4.6 6.4-.6 8-3.2M9.4 15.6c3 .4 5.6-.8 7-3.2"/>',
    footprints: '<ellipse cx="8" cy="9.4" rx="2.6" ry="3.6" transform="rotate(-12 8 9.4)"/><ellipse cx="16" cy="15" rx="2.6" ry="3.6" transform="rotate(-12 16 15)"/><circle cx="6" cy="15.4" r="1.1"/><circle cx="14.4" cy="20" r="1.1"/>',
    mountain: '<path d="M2.6 18.4l5.6-8.6 3.2 4.2 2.6-3.4 7.4 7.8z"/><path d="M8.2 9.8l1.8 2.6"/>',
    sunrise: '<path d="M3 18.4h18"/><path d="M7.4 15.4a4.6 4.6 0 0 1 9.2 0"/><path d="M12 4.6v2.8M5.4 8l1.8 1.8M18.6 8l-1.8 1.8M2.6 13.4h2.2M19.2 13.4h2.2"/>',
    puzzle: '<path d="M6.4 4.6h4.2a2.2 2.2 0 1 1 4.2 0h4.2v4.2a2.2 2.2 0 1 1 0 4.2v4.2H6.4z"/>',
    palette: '<path d="M12 3.8a8.2 8.2 0 0 0 0 16.4c1.5 0 2-1 1.6-2-.5-1.3.4-2.4 1.8-2.4h1.4a3.4 3.4 0 0 0 3.2-4.4A8.6 8.6 0 0 0 12 3.8z"/><circle cx="8.4" cy="9.4" r="1.1"/><circle cx="12.4" cy="7.2" r="1.1"/><circle cx="15.8" cy="9.6" r="1.1"/>',
    scope: '<path d="M2.4 12.6 16.6 4.6l1.8 3.6L4.2 16.2z"/><path d="M11 12.4 9 20.6M13.6 11 16.2 20.6M8.2 20.6h8.8"/>',
    rocket: '<path d="M12 3.6c3 2.4 4.6 5.6 4.6 9L12 17l-4.6-4.4c0-3.4 1.6-6.6 4.6-9z"/><circle cx="12" cy="10" r="1.8"/><path d="M7.4 12.6 5 15.4l2.8.6M16.6 12.6 19 15.4l-2.8.6M12 17v3.4"/>',
    tent: '<path d="M12 5.4L3.6 18.6h16.8z"/><path d="M12 5.4v13.2M8.6 18.6 12 12l3.4 6.6"/>',
    gift: '<rect x="4.6" y="9.4" width="14.8" height="9.6" rx="1.8"/><path d="M4.6 13h14.8M12 9.4v9.6"/><path d="M12 9.4C10.4 6 7.4 5.6 6.6 7s1.8 2.4 5.4 2.4c3.6 0 6.2-.4 5.4-2.4S13.6 6 12 9.4z"/>',
    clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3.4 2.2"/>',
    water: '<path d="M12 4.2c3.4 4 5.2 6.8 5.2 9.2a5.2 5.2 0 0 1-10.4 0c0-2.4 1.8-5.2 5.2-9.2z"/>',
    fire: '<path d="M12 20.2c3.4 0 5.8-2.2 5.8-5.2 0-4-3.4-5.6-3-9.6-2.6 1.2-4 3.4-4 5.6 0 1.2-1 1.8-1.8 1-.6-.6-.8-1.6-.8-2.4-1.4 1.6-2.2 3.6-2.2 5.4 0 3 2.6 5.2 6 5.2z"/>',
    wind: '<path d="M3.6 8.6h9.2a2.6 2.6 0 1 0-2.6-2.6M3.6 13h12a2.6 2.6 0 1 1-2.6 2.6M6 17.4h6.4a2.2 2.2 0 1 1 2.2 2.2"/>',
    person: '<circle cx="12" cy="6.4" r="2.8"/><path d="M5.6 19.6c.8-3.6 3.4-5.6 6.4-5.6s5.6 2 6.4 5.6"/>',
    people: '<circle cx="9" cy="7" r="2.6"/><circle cx="16.4" cy="8.4" r="2.1"/><path d="M3.6 19.4c.7-3.3 2.9-5.1 5.4-5.1s4.7 1.8 5.4 5.1"/><path d="M15.4 14.6c2.3.1 4 1.8 4.6 4.8"/>',
    point: '<path d="M4 2.4v17.2l5-4.4 3.2 6.4 2.8-1.4-3.2-6.4 7.2-.4z"/>',
    tag: '<path d="M11.4 3.6H20a1.8 1.8 0 0 1 1.8 1.8v8.6L12.6 21.4a1.8 1.8 0 0 1-2.6 0L3.6 15a1.8 1.8 0 0 1 0-2.6z"/><circle cx="16.4" cy="7.6" r="1.5"/>',
    gamepad: '<path d="M8 8.6h8c3 0 4.8 2.4 4.4 5.6l-.6 3.2c-.4 2-2.6 2.6-3.8 1L14.2 16H9.8l-1.8 2.4c-1.2 1.6-3.4 1-3.8-1l-.6-3.2C3.2 11 5 8.6 8 8.6z"/><path d="M7.6 11.6v2.4M6.4 12.8h2.4"/><circle cx="15.6" cy="12.2" r=".9"/><circle cx="17.4" cy="14.2" r=".9"/>',
    museum: '<path d="M3.6 9.4 12 4.2l8.4 5.2"/><path d="M5 9.6v8M9.6 9.6v8M14.4 9.6v8M19 9.6v8"/><path d="M3.2 20.2h17.6"/>',
    bulb: '<path d="M8.4 14.6a5.4 5.4 0 1 1 7.2 0c-1.1 1-1.6 1.9-1.8 3.1H10.2c-.2-1.2-.7-2.1-1.8-3.1z"/><path d="M9.9 20.2h4.2M10.7 17.7h2.6"/><path d="M12 2.6v1.6M4.4 5.4l1.2 1.2M19.6 5.4l-1.2 1.2"/>',
    info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 10.8v5.4"/><path d="M12 7.6h.01"/>',
    warn: '<path d="M12 4.4 21 19.6H3z"/><path d="M12 9.8v4M12 16.6h.01"/>',
    pause: '<path d="M9.2 5.8v12.4M14.8 5.8v12.4"/>',
    key: '<circle cx="7.8" cy="16.2" r="3.8"/><path d="M10.6 13.4 20 4"/><path d="M15.4 8.6l2.2 2.2M17.8 6.2l2.2 2.2"/>',
    frame: '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2"/><path d="M6.6 16.2l3.4-4.4 2.6 3 2.2-2.4 2.6 3.8"/><circle cx="9.2" cy="9" r="1.4"/>',
    pencil: '<path d="M5 19l3.4-.9L19.2 6.9a1.9 1.9 0 0 0 0-2.7l-.8-.8a1.9 1.9 0 0 0-2.7 0L4.9 15.6z"/><path d="M15.4 5.4l3.2 3.2"/>',
    brush: '<path d="M9.6 3.6h4.8v6.4H9.6z"/><path d="M7.4 10h9.2v3.2H7.4z"/><path d="M7.4 13.2h9.2c0 4-2.1 7-4.6 7s-4.6-3-4.6-7z"/>',
  };

  const names = new Set(Object.keys(PATHS));

  /* A [data-icon] element that also carries words gets the icon in front of the
   * words; one that holds nothing, or only the font glyph this file replaces,
   * gets the icon instead. Without this the convention would silently eat the
   * "Hint" in `<button data-icon="bulb">Hint</button>`. */
  const ONLY_SYMBOLS = /^[^\p{L}\p{N}]*$/u;

  /* A glyph that stands for a *control* is interface, so this table gives it a
   * drawing: an eye on a "Peek" button, a magnifier on a search, a house on the
   * way back to the hub. A glyph that stands for a creature, a fruit or a stone
   * is not here — that is the world, and fx/du-objects.js photographs it. Where
   * the two could disagree, the world wins: `iconFor` refuses anything the
   * object layer already claims, so 💡 stays an oil lamp and never becomes a
   * line drawing of one. */
  const GLYPH_ICON = {
    /* reading the screen */
    '🔍': 'search', '🔎': 'search', '🔭': 'scope', '👀': 'eye', '🆘': 'info', '❓': 'info', '❔': 'info',
    '⚠': 'warn', 'ℹ': 'info', '✅': 'check', '✔': 'check', '✓': 'check', '☑': 'check',
    '❌': 'close', '✖': 'close', '✕': 'close',
    /* navigating and driving the game */
    '🏠': 'home', '🏡': 'home', '⚙': 'settings', '🔒': 'lock', '🔓': 'unlock',
    '🔊': 'sound', '🔇': 'sound-off', '🎤': 'mic', '🎙': 'mic',
    // "Hear it again" is a speaker: no ear drawn in this stroke language reads at 14px.
    '👂': 'sound',
    '🔄': 'refresh', '🔃': 'refresh', '🔁': 'replay', '↩': 'back',
    '➡': 'next', '▶': 'play', '⏩': 'next', '⏭': 'next', '⏸': 'pause',
    '⬅': 'back', '◀': 'back', '⏪': 'back', '⏮': 'back',
    '🎨': 'palette', '🖌': 'brush', '✏': 'pencil', '📝': 'pencil', '🧩': 'puzzle',
    '🖼': 'frame', '📷': 'camera', '📸': 'camera', '🎬': 'film', '🎞': 'film',
    '🔧': 'tools', '🛠': 'tools', '🧰': 'tools', '🗝': 'key', '🔑': 'key',
    '🎮': 'gamepad', '🕹': 'gamepad', '🎵': 'music', '🎶': 'music',
    '♪': 'music', '♫': 'music',
    /* how a round went */
    '🏆': 'trophy', '🏅': 'medal', '🎖': 'medal', '🥇': 'medal', '🥈': 'medal', '🥉': 'medal',
    '🎉': 'spark', '🎊': 'spark', '💤': 'sleep', '😴': 'sleep', '🎁': 'gift', '🎲': 'dice',
    '⏰': 'clock', '⏱': 'clock', '⌛': 'clock', '⏳': 'clock', '📮': 'mail', '📬': 'mail', '🏷': 'tag',
    /* where in the universe you are, when the marker names a place rather than
     * showing one — the object layer photographs the real ones. */
    '⛰': 'mountain', '🏔': 'mountain', '🗻': 'mountain', '⛺': 'tent', '🏕': 'tent',
    '🚀': 'rocket', '🌅': 'sunrise', '🌄': 'sunrise', '🌇': 'sunrise', '🏛': 'museum',
    /* The grown-ups stay drawings rather than photographs, because other
     * children play this game too. */
    '🚶': 'person', '🏃': 'person', '🧑': 'person', '👧': 'person', '👦': 'person',
    '🧒': 'person', '👨': 'person', '👩': 'person', '🔈': 'sound', '👉': 'point'
  };

  /* A joined family is more than one of the same control, so it gets its own
   * drawing rather than two figures standing on each other. */
  const MORE = {
    person: 'people'
  };

  /* A variation selector, a joiner and a tone are typography, not meaning:
   * 🏃 and 🏃🏽 are the same runner, and both are a picture of the way you
   * leave a screen rather than of a particular person. */
  const strip = (s) => String(s).replace(/[️‍🏻-🏿]/gu, '');

  function iconFor(glyph) {
    const key = strip(glyph);
    const name = GLYPH_ICON[key];
    if (!name) return null;
    const o = window.DUFX && window.DUFX.objects;
    if (o && o.has && o.has(key)) return null;
    return name;
  }

  /* Built from the table rather than copied from the object layer, so a glyph
   * nobody claimed can never be quietly eaten by this file. A family is joined
   * with ZWJ and matched whole, so 🧑‍👧 becomes one drawing of two people
   * instead of a person with an orphaned child left behind it. */
  const ALT = Object.keys(GLYPH_ICON).map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const ONE = '(?:' + ALT + ')️?(?:[🏻-🏿])?';
  const ICON_RE = new RegExp(ONE + '(?:\\u200d' + ONE + ')*', 'gu');
  const HAS_ICON = new RegExp(ICON_RE.source, 'u');

  const DUICONS = window.DUICONS = {
    names: names,
    /** Markup for an icon. Unknown names return '' rather than a broken frame,
     * so a typo costs an icon and not a torn picture. */
    svg: function (name, o) {
      o = o || {};
      const d = PATHS[name];
      if (!d) return '';
      const px = o.size || 22;
      const cls = 'du-i' + (o.cls ? ' ' + o.cls : '');
      return '<svg class="' + cls + '" viewBox="0 0 24 24" width="' + px + '" height="' + px +
        '" aria-hidden="' + (o.label ? 'false' : 'true') + '"' +
        (o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : '') +
        ' focusable="false" style="vertical-align:-0.18em;flex:none" data-i="' + name + '"><g fill="' + (o.filled ? 'currentColor' : 'none') +
        '" stroke="currentColor" stroke-width="' + (o.filled ? 1.2 : 1.7) +
        '" stroke-linecap="round" stroke-linejoin="round">' + d + '</g></svg>';
    },
    /** A placeholder for a template string: `'<b>' + DUICONS.i('trophy') + ' Best</b>'`.
     * The watcher fills it once it lands, so templates never wait on a mount. */
    i: function (name, o) {
      const a = o || {};
      return '<span class="du-i-host' + (a.cls ? ' ' + a.cls : '') + '" data-icon="' + name + '"' +
        (a.size ? ' data-size="' + a.size + '"' : '') +
        (a.filled ? ' data-filled="1"' : '') +
        (a.label ? ' aria-label="' + esc(a.label) + '"' : '') + '></span>';
    },
    /** The same five-point star, drawn into a 2D canvas. A rating painted on a
     * game's own surface cannot be a DOM icon, and until now it was a font
     * glyph — the drive chapter's finish stars were `fillText("⭐")`. */
    starPath: function (ctx, cx, cy, r, filled) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 ? r * 0.42 : r;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = cx + rad * Math.cos(a);
        const y = cy + rad * Math.sin(a);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      if (filled) ctx.fill(); else ctx.stroke();
      return ctx;
    },
    /** Whatever a game's own table calls an icon. A name from this file becomes
     * a drawing; anything else is left alone, so the object layer can still put
     * a photograph of that creature or plant in its place. Registries full of
     * emoji could then be converted one entry at a time. */
    mark: function (value, size) {
      return PATHS[value] ? DUICONS.i(value, { size: size }) : value;
    },
    /** A reward meter: n filled stars out of max. Twenty screens drew these with
     * `"⭐".repeat(n)`, which made a child's score a picture of a specimen
     * rather than a mark on a board. */
    stars: function (n, o) {
      o = o || {};
      const max = Math.max(n, o.max || 3);
      let out = '';
      for (let i = 0; i < max; i++) out += DUICONS.i('star', { size: o.size || 18, filled: i < n });
      return out;
    },
    /** Put an icon into an element now, replacing the icon it already had. This
     * is the one controls use when their state flips — a sound button whose text
     * is rewritten to a glyph would otherwise lose its drawing forever. */
    set: function (el, name, o) {
      if (!el) return;
      o = o || {};
      el.dataset.icon = name;
      if (o.size) el.dataset.size = String(o.size);
      if (o.filled) el.dataset.filled = '1'; else delete el.dataset.filled;
      const label = o.label || el.getAttribute('aria-label') || el.getAttribute('title') || '';
      place(el, DUICONS.svg(name, { size: o.size, filled: o.filled, label: label }));
      if (label) el.setAttribute('aria-label', label);
    },
    /** Fill every [data-icon] in a subtree that does not have its icon yet. */
    mount: function (root) {
      if (!root) return 0;
      const scope = [];
      if (root.nodeType === 1 && root.hasAttribute('data-icon')) scope.push(root);
      if (root.querySelectorAll) scope.push.apply(scope, root.querySelectorAll('[data-icon]'));
      let n = 0;
      for (const el of scope) {
        const name = el.dataset.icon;
        if (!PATHS[name]) continue;
        if (el.querySelector('svg.du-i')) continue;
        place(el, DUICONS.svg(name, {
          size: parseFloat(el.dataset.size) || 0,
          filled: el.dataset.filled === '1',
          label: el.getAttribute('aria-label') || el.getAttribute('title') || ''
        }));
        n++;
      }
      return n;
    },
    /** Swap the interface glyphs left in a subtree's text for drawings, the way
     * fx/du-objects.js swaps world glyphs for photographs. This is why the last
     * few hundred `"👀 Peek"` strings did not each need their own edit. */
    hydrate: function (root) {
      const host = root && root.querySelectorAll ? root : document;
      const nodes = [];
      const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || !HAS_ICON.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
          const p = n.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          const t = p.tagName;
          if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'CANVAS' || t === 'TITLE') return NodeFilter.FILTER_REJECT;
          /* A slot this file already owns, or a picture the object layer already
           * drew, has nothing left for a glyph to do. */
          if (p.closest('.du-i-host, .du-i, .du-obj, [data-icon]')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      for (let n = tw.nextNode(); n; n = tw.nextNode()) nodes.push(n);
      let swapped = 0;
      const scratch = document.createElement('span');
      for (const node of nodes) {
        const text = node.nodeValue;
        const frag = document.createDocumentFragment();
        let last = 0;
        for (const m of text.matchAll(ICON_RE)) {
          /* A sequence only becomes a drawing when every part of it is interface
           * and they all mean the same thing; 🦖‍🔥 stays with the camera layer. */
          if (text.charCodeAt(m.index + m[0].length) === 0x200d) continue;
          const parts = m[0].split('\u200d');
          let name = null;
          for (const p of parts) {
            const n = iconFor(p);
            if (!n || (name && n !== name)) { name = null; break; }
            name = n;
          }
          if (!name) continue;
          if (parts.length > 1 && MORE[name]) name = MORE[name];
          const before = text.slice(last, m.index);
          if (before) frag.appendChild(document.createTextNode(before));
          scratch.innerHTML = DUICONS.svg(name, { size: pxOf(node) });
          while (scratch.firstChild) frag.appendChild(scratch.firstChild);
          last = m.index + m[0].length;
          swapped++;
        }
        if (last && node.parentNode) {
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          node.parentNode.replaceChild(frag, node);
        }
      }
      return swapped;
    },
    /** Which layer would draw this glyph? `null` means the object layer claims
     * it, or nobody does — tests use this to prove the two tables never fight. */
    iconFor: iconFor,
    glyphs: GLYPH_ICON,
    /** Screens rebuilt from templates land new [data-icon] nodes constantly, so
     * each inserted subtree is mounted as it arrives. */
    watch: function (el) {
      if (!el || !window.MutationObserver) return;
      let queue = null, raf = 0;
      const flush = function () {
        raf = 0;
        const nodes = queue;
        queue = null;
        for (const n of nodes) {
          if (n.nodeType === 1) { DUICONS.mount(n); DUICONS.hydrate(n); }
          else if (n.parentNode) DUICONS.hydrate(n.parentNode);
        }
      };
      const mo = new MutationObserver(function (records) {
        for (const r of records) {
          if (r.type === 'characterData') (queue || (queue = new Set())).add(r.target);
          else for (const node of r.addedNodes) (queue || (queue = new Set())).add(node);
        }
        if (queue && !raf) raf = requestAnimationFrame(flush);
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
      return mo;
    }
  };

  /* An inline drawing is sized in the page's own type, so a 15px caption and a
   * 32px hero button each get an icon that belongs to them. */
  function pxOf(node) {
    const p = node.parentElement;
    if (!p) return 20;
    try {
      const n = parseFloat(getComputedStyle(p).fontSize) || 20;
      return Math.max(13, Math.min(44, Math.round(n * 1.06)));
    } catch (e) { return 20; }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* The icon goes where the glyph used to be. An element that also says a word
   * keeps the word and gets the drawing in front of it; an element that held
   * nothing but a symbol loses the symbol. */
  function place(el, mark) {
    for (const old of el.querySelectorAll(':scope > svg.du-i')) old.remove();
    if (!mark) return;
    if (ONLY_SYMBOLS.test(el.textContent)) el.innerHTML = mark;
    else el.insertAdjacentHTML('afterbegin', mark);
  }

  function boot() {
    DUICONS.mount(document.body);
    DUICONS.hydrate(document.body);
    DUICONS.watch(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
