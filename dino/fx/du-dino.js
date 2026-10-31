/* Dinosaur Universe — animated dinosaur characters.
 * Vector dinosaurs that breathe, blink, sway their tails, walk, roar, eat, sleep and cheer.
 * All motion is CSS (see du-fx.css), so a dinosaur keeps moving even when it is inserted
 * with innerHTML. Usage:
 *     el.innerHTML = DUFX.dinoHTML('trex', { state: 'walk' });
 *     const d = DUFX.dino('stego', { color: 'purple' });  // returns an element
 *     d.setState('happy', 1400);                          // temporary state, then back to idle
 */
(function () {
  'use strict';
  if (window.DUFX && window.DUFX.dinoHTML) return;
  const DUFX = window.DUFX = window.DUFX || {};

  const OUT = '#236455';
  const PALETTES = {
    green:  { c1: '#91d09c', c2: '#d8f2c8', c3: '#6fb67f', c4: '#f2a46e' },
    teal:   { c1: '#7fd1c7', c2: '#d4f5ef', c3: '#58b3a8', c4: '#ffd36d' },
    purple: { c1: '#b9a1e6', c2: '#ecdffa', c3: '#9a82d1', c4: '#ff9fc2' },
    orange: { c1: '#f6b273', c2: '#ffe6c4', c3: '#dd9650', c4: '#7cc28a' },
    pink:   { c1: '#f5a9c4', c2: '#ffe3ee', c3: '#dd8bab', c4: '#ffd36d' },
    blue:   { c1: '#8cc3ee', c2: '#dff0fd', c3: '#6aa6d6', c4: '#ffd36d' },
    yellow: { c1: '#f3d56b', c2: '#fff3c4', c3: '#d9b84a', c4: '#e9806b' },
    red:    { c1: '#ee8a7c', c2: '#ffd9d2', c3: '#d06b5d', c4: '#ffd36d' },
  };
  const SPECIES = ['trex', 'tricera', 'stego', 'bronto', 'raptor', 'ptero'];
  const DEFAULT_COLOR = { trex: 'green', tricera: 'teal', stego: 'purple', bronto: 'orange', raptor: 'red', ptero: 'blue' };
  DUFX.dinoSpecies = SPECIES.slice();
  DUFX.dinoColors = Object.keys(PALETTES);

  let uidN = 0;
  const st = (extra) => `stroke="${OUT}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"${extra ? ' ' + extra : ''}`;
  const eye = (x, y, r) => `
    <g class="d-eye" style="transform-origin:${x}px ${y}px">
      <circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="3"/>
      <circle class="d-pupil" cx="${x + r * .25}" cy="${y + r * .1}" r="${r * .52}" fill="#163f42"/>
      <circle cx="${x + r * .5}" cy="${y - r * .28}" r="${r * .2}" fill="#fff"/>
    </g>
    <path class="d-eye-happy" opacity="0" d="M${x - r} ${y + 2} Q${x} ${y - r * 1.5} ${x + r} ${y + 2}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path class="d-eye-sleep" opacity="0" d="M${x - r} ${y} Q${x} ${y + r * .9} ${x + r} ${y}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`;
  const cheek = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.5" fill="#ff8fa3" opacity=".45"/>`;
  const smile = (x, y, w) => `<path class="d-smile" d="M${x} ${y} q${w / 2} ${w * .38} ${w} 0" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>`;
  /* One tapered, rounded leg with a toe bump. (x = left edge at the hip, w = hip width, fy = foot level) */
  const leg = (x, top, w, fy, fill, cls, px) => `<g class="d-leg ${cls}" style="transform-origin:${px}px ${top + 4}px"><path d="M${x} ${top} L${x + w} ${top} C${x + w + 1} ${top + 26} ${x + w - 5} ${fy - 20} ${x + w - 5} ${fy - 11} C${x + w - 5} ${fy - 5} ${x + w + 9} ${fy - 8} ${x + w + 13} ${fy - 3} Q${x + w + 14} ${fy} ${x + w + 9} ${fy} L${x - 6} ${fy} Q${x - 12} ${fy} ${x - 10} ${fy - 6} C${x - 6} ${fy - 12} ${x + 6} ${fy - 14} ${x + 6} ${fy - 24} C${x + 6} ${top + 30} ${x - 1} ${top + 18} ${x} ${top} Z" fill="${fill}" ${st()}/></g>`;

  /* ---------- species artwork (facing right, viewBox 0 0 240 180) ---------- */
  const ART = {
    trex(p, id) {
      return `
      <g class="d-tail" style="transform-origin:78px 104px"><path d="M84 86 C54 86 24 104 6 140 C32 130 58 128 90 132 Z" fill="${p.c1}" ${st()}/></g>
      ${leg(98, 108, 30, 168, p.c3, 'd-leg-b', 112)}
      ${leg(126, 108, 32, 168, p.c1, 'd-leg-f', 140)}
      <g class="d-spikes">
        <path d="M84 72 l9 -16 l9 17 M106 64 l9 -18 l9 19 M128 66 l9 -16 l9 17" fill="${p.c4}" ${st('stroke-width="4"')}/>
      </g>
      <g class="d-body">
        <clipPath id="cp${id}"><ellipse cx="122" cy="98" rx="56" ry="38"/></clipPath>
        <ellipse cx="122" cy="98" rx="56" ry="38" fill="${p.c1}"/>
        <ellipse cx="136" cy="128" rx="52" ry="26" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <ellipse cx="122" cy="98" rx="56" ry="38" fill="none" ${st()}/>
      </g>
      <g class="d-arm" style="transform-origin:160px 106px"><path d="M158 104 q16 2 20 16" fill="none" stroke="${OUT}" stroke-width="12" stroke-linecap="round"/><path d="M158 104 q16 2 20 16" fill="none" stroke="${p.c1}" stroke-width="5" stroke-linecap="round"/></g>
      <g class="d-head" style="transform-origin:152px 78px">
        <path d="M146 92 C146 70 154 58 168 52 L192 74 C178 86 166 98 150 104 Z" fill="${p.c1}" ${st()}/>
        <g class="d-jaw" style="transform-origin:176px 70px"><path d="M174 68 L230 68 C228 82 214 90 198 90 C184 90 176 80 174 68Z" fill="${p.c2}" ${st()}/><path d="M188 68 l4 7 l4 -7 M204 68 l4 7 l4 -7" fill="#fff" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/></g>
        <path d="M156 54 C156 36 178 24 206 28 C226 32 240 42 242 54 C243 64 236 70 226 70 L174 72 C162 72 156 64 156 54 Z" fill="${p.c1}" ${st()}/>
        <path d="M184 70 l4 -8 l4 8 M200 70 l4 -8 l4 8 M216 69 l4 -7 l4 7" fill="#fff" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
        ${eye(190, 46, 8)}${cheek(204, 58)}
        <circle cx="234" cy="46" r="2.8" fill="${OUT}"/>
        ${smile(206, 62, 16)}
      </g>`;
    },

    tricera(p, id) {
      return `
      <g class="d-tail" style="transform-origin:58px 108px"><path d="M64 94 C40 96 20 108 8 130 C30 124 48 122 70 126 Z" fill="${p.c1}" ${st()}/></g>
      ${leg(66, 114, 28, 168, p.c3, 'd-leg-b', 80)}
      ${leg(132, 114, 28, 168, p.c3, 'd-leg-b2', 146)}
      ${leg(86, 116, 30, 168, p.c1, 'd-leg-f', 100)}
      ${leg(152, 116, 30, 168, p.c1, 'd-leg-f2', 166)}
      <g class="d-body">
        <clipPath id="cp${id}"><ellipse cx="112" cy="102" rx="64" ry="40"/></clipPath>
        <ellipse cx="112" cy="102" rx="64" ry="40" fill="${p.c1}"/>
        <ellipse cx="120" cy="134" rx="56" ry="26" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <circle cx="86" cy="88" r="7" fill="${p.c3}"/><circle cx="108" cy="76" r="6" fill="${p.c3}"/><circle cx="132" cy="86" r="8" fill="${p.c3}"/>
        <ellipse cx="112" cy="102" rx="64" ry="40" fill="none" ${st()}/>
      </g>
      <g class="d-head" style="transform-origin:166px 106px">
        <path d="M168 78 C158 40 186 18 214 34 C236 48 234 86 218 104 L178 108 Z" fill="${p.c4}" ${st()}/>
        <circle cx="190" cy="52" r="6" fill="#fff" opacity=".75"/><circle cx="206" cy="46" r="5" fill="#fff" opacity=".75"/><circle cx="216" cy="62" r="6" fill="#fff" opacity=".75"/><circle cx="198" cy="72" r="5" fill="#fff" opacity=".75"/>
        <path d="M172 88 C178 74 202 70 220 78 C238 86 244 102 234 112 C224 120 192 120 178 112 C172 106 170 96 172 88Z" fill="${p.c1}" ${st()}/>
        <path d="M232 100 l14 7 l-14 10 Z" fill="${p.c4}" ${st('stroke-width="4"')}/>
        <path d="M200 78 l8 -28 l9 28 Z" fill="#fff4d6" ${st('stroke-width="4"')}/>
        <path d="M216 84 l17 -22 l4 28 Z" fill="#fff4d6" ${st('stroke-width="4"')}/>
        <path d="M234 94 l12 -14 l1 22 Z" fill="#fff4d6" ${st('stroke-width="4"')}/>
        ${eye(204, 92, 8)}${cheek(214, 106)}${smile(206, 106, 16)}
      </g>`;
    },

    stego(p, id) {
      const plate = (x, y, s, d) => `<path class="d-plate" style="transform-origin:${x}px ${y + 14 * s}px;animation-delay:${d}s" d="M${x} ${y} l${-12 * s} ${-20 * s} l${12 * s} ${-24 * s} l${12 * s} ${24 * s} z" fill="${p.c4}" ${st('stroke-width="4"')}/>`;
      return `
      <g class="d-tail" style="transform-origin:62px 112px">
        <path d="M74 92 C50 92 26 104 8 124 C2 130 8 138 16 136 C40 134 60 136 82 132 Z" fill="${p.c1}" ${st()}/>
        <path d="M30 116 l-10 -26 l20 20 M14 122 l-20 -14 l26 4" fill="${p.c4}" ${st('stroke-width="4"')}/>
        <path d="M30 132 l-8 18 l20 -14 M14 130 l-18 12 l26 2" fill="${p.c4}" ${st('stroke-width="4"')}/>
      </g>
      ${leg(70, 116, 28, 168, p.c3, 'd-leg-b', 84)}
      ${leg(140, 116, 28, 168, p.c3, 'd-leg-b2', 154)}
      ${leg(92, 118, 28, 168, p.c1, 'd-leg-f', 106)}
      ${leg(164, 118, 28, 168, p.c1, 'd-leg-f2', 178)}
      ${plate(84, 70, .8, 0)}${plate(110, 58, 1.05, .2)}${plate(138, 58, 1.05, .4)}${plate(162, 68, .85, .6)}
      <g class="d-body">
        <clipPath id="cp${id}"><path d="M60 116 C60 80 100 62 140 66 C176 70 196 92 194 116 C192 136 150 142 120 142 C86 142 60 134 60 116Z"/></clipPath>
        <path d="M60 116 C60 80 100 62 140 66 C176 70 196 92 194 116 C192 136 150 142 120 142 C86 142 60 134 60 116Z" fill="${p.c1}"/>
        <ellipse cx="128" cy="140" rx="64" ry="20" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <path d="M60 116 C60 80 100 62 140 66 C176 70 196 92 194 116 C192 136 150 142 120 142 C86 142 60 134 60 116Z" fill="none" ${st()}/>
      </g>
      <g class="d-head" style="transform-origin:186px 112px">
        <path d="M184 112 C188 94 210 90 222 98 C236 106 238 124 224 130 C208 136 190 130 184 120Z" fill="${p.c1}" ${st()}/>
        ${eye(212, 108, 7)}${cheek(222, 122)}${smile(210, 122, 16)}
      </g>`;
    },

    bronto(p, id) {
      return `
      <g class="d-tail" style="transform-origin:66px 118px"><path d="M72 102 C44 100 20 114 4 144 C30 136 56 134 80 138 Z" fill="${p.c1}" ${st()}/></g>
      ${leg(70, 120, 30, 168, p.c3, 'd-leg-b', 84)}
      ${leg(130, 120, 30, 168, p.c3, 'd-leg-b2', 144)}
      ${leg(90, 122, 32, 168, p.c1, 'd-leg-f', 104)}
      ${leg(148, 122, 32, 168, p.c1, 'd-leg-f2', 162)}
      <g class="d-body">
        <clipPath id="cp${id}"><ellipse cx="116" cy="108" rx="60" ry="36"/></clipPath>
        <ellipse cx="116" cy="108" rx="60" ry="36" fill="${p.c1}"/>
        <ellipse cx="124" cy="138" rx="52" ry="24" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <circle cx="92" cy="96" r="6" fill="${p.c3}"/><circle cx="116" cy="88" r="7" fill="${p.c3}"/><circle cx="140" cy="98" r="6" fill="${p.c3}"/>
        <ellipse cx="116" cy="108" rx="60" ry="36" fill="none" ${st()}/>
      </g>
      <g class="d-head" style="transform-origin:160px 98px">
        <path d="M152 100 C152 70 158 42 170 28 L194 32 C190 52 184 76 180 104 C172 112 158 110 152 100Z" fill="${p.c1}" ${st()}/>
        <path d="M168 26 C166 12 180 4 196 8 C214 12 224 22 222 34 C220 42 210 46 200 44 L182 40 C174 38 168 34 168 26Z" fill="${p.c1}" ${st()}/>
        ${eye(196, 22, 7)}${cheek(206, 34)}${smile(194, 35, 14)}
        <circle cx="216" cy="20" r="2.4" fill="${OUT}"/>
      </g>`;
    },

    raptor(p, id) {
      return `
      <g class="d-tail" style="transform-origin:84px 94px"><path d="M90 84 C60 80 30 82 4 100 C32 102 60 106 94 108 Z" fill="${p.c1}" ${st()}/><path d="M30 88 l4 12 M48 86 l4 14 M66 86 l4 14" stroke="${p.c3}" stroke-width="6" stroke-linecap="round" fill="none"/></g>
      ${leg(96, 104, 26, 168, p.c3, 'd-leg-b', 110)}
      ${leg(122, 104, 28, 168, p.c1, 'd-leg-f', 136)}
      <g class="d-body">
        <clipPath id="cp${id}"><ellipse cx="124" cy="92" rx="46" ry="30" transform="rotate(-8 124 92)"/></clipPath>
        <ellipse cx="124" cy="92" rx="46" ry="30" transform="rotate(-8 124 92)" fill="${p.c1}"/>
        <ellipse cx="136" cy="114" rx="44" ry="20" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <path d="M100 74 l6 18 M120 70 l6 20 M140 72 l5 18" stroke="${p.c3}" stroke-width="6" stroke-linecap="round" fill="none"/>
        <ellipse cx="124" cy="92" rx="46" ry="30" transform="rotate(-8 124 92)" fill="none" ${st()}/>
      </g>
      <g class="d-arm" style="transform-origin:158px 92px"><path d="M156 90 q16 0 22 12" fill="none" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="M156 90 q16 0 22 12" fill="none" stroke="${p.c1}" stroke-width="4" stroke-linecap="round"/></g>
      <g class="d-head" style="transform-origin:150px 76px">
        <path d="M148 82 C148 62 158 46 170 40 L190 62 C178 76 168 90 154 96 Z" fill="${p.c1}" ${st()}/>
        <g class="d-jaw" style="transform-origin:176px 58px"><path d="M174 58 L228 62 C226 72 212 76 198 74 C184 72 176 68 174 58Z" fill="${p.c2}" ${st()}/></g>
        <path d="M158 44 C158 28 176 20 196 24 C214 28 232 42 234 54 C234 60 228 62 222 62 L176 60 C164 60 158 54 158 44Z" fill="${p.c1}" ${st()}/>
        <path d="M168 24 l-6 -16 l14 12 M180 20 l0 -16 l10 14" fill="${p.c4}" ${st('stroke-width="3.5"')}/>
        <path d="M196 61 l3 -6 l3 6 M210 61 l3 -6 l3 6" fill="#fff" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>
        ${eye(190, 40, 7)}${cheek(202, 52)}${smile(200, 54, 14)}
        <circle cx="226" cy="44" r="2.4" fill="${OUT}"/>
      </g>`;
    },

    ptero(p, id) {
      return `
      <g class="d-wing d-wing-b" style="transform-origin:132px 90px"><path d="M132 92 C142 58 176 30 222 26 C206 40 200 52 198 66 C210 62 220 64 230 70 C206 74 186 86 170 108 Z" fill="${p.c3}" ${st()}/></g>
      <g class="d-tail" style="transform-origin:90px 108px"><path d="M94 100 C72 102 54 114 44 132 C64 124 82 122 100 124 Z" fill="${p.c1}" ${st()}/><path d="M44 132 l-12 8 l22 2z" fill="${p.c4}" ${st('stroke-width="3.5"')}/></g>
      <g class="d-leg d-leg-f" style="transform-origin:118px 120px"><path d="M112 120 q-8 16 -2 30 M132 120 q2 16 10 28" fill="none" stroke="${OUT}" stroke-width="11" stroke-linecap="round"/><path d="M112 120 q-8 16 -2 30 M132 120 q2 16 10 28" fill="none" stroke="${p.c1}" stroke-width="5" stroke-linecap="round"/></g>
      <g class="d-body">
        <clipPath id="cp${id}"><ellipse cx="118" cy="104" rx="38" ry="26"/></clipPath>
        <ellipse cx="118" cy="104" rx="38" ry="26" fill="${p.c1}"/>
        <ellipse cx="126" cy="124" rx="36" ry="16" fill="${p.c2}" clip-path="url(#cp${id})"/>
        <ellipse cx="118" cy="104" rx="38" ry="26" fill="none" ${st()}/>
      </g>
      <g class="d-head" style="transform-origin:146px 92px">
        <path d="M142 100 C142 82 152 70 166 66 L186 82 C176 92 164 104 150 110 Z" fill="${p.c1}" ${st()}/>
        <path d="M148 70 C148 54 162 44 178 48 L238 66 C241 70 237 75 230 75 L180 82 C162 84 148 82 148 70Z" fill="${p.c1}" ${st()}/>
        <path d="M152 56 C140 40 124 38 106 46 C126 46 136 54 146 66Z" fill="${p.c4}" ${st('stroke-width="4"')}/>
        ${eye(168, 62, 7.5)}${cheek(180, 74)}${smile(186, 74, 14)}
      </g>
      <g class="d-wing d-wing-f" style="transform-origin:112px 90px"><path d="M112 92 C102 54 66 22 16 16 C36 32 46 48 48 64 C36 60 24 62 12 70 C38 74 58 88 74 110 Z" fill="${p.c1}" ${st()}/><path d="M112 94 C96 66 68 44 38 34 M108 100 C90 84 66 72 40 68" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round" opacity=".45"/></g>`;
    },
  };

  /* ---------- builders ---------- */
  function resolve(species, opts) {
    species = ART[species] ? species : 'trex';
    const color = opts && opts.color && PALETTES[opts.color] ? opts.color : DEFAULT_COLOR[species];
    return { species, color, p: PALETTES[color] };
  }
  /* Head swapping: any species' head can sit on any body (the dino mixer). */
  const ANCHOR = { trex: [152, 78], tricera: [166, 106], stego: [186, 112], bronto: [160, 98], raptor: [150, 76], ptero: [146, 92] };
  function splitHead(s) {
    const a = s.indexOf('<g class="d-head"');
    if (a < 0) return null;
    // Walk forward counting <g ...> opens against </g> closes until the head group is balanced.
    let i = a, depth = 0;
    while (i < s.length) {
      const open = s.indexOf('<g', i), close = s.indexOf('</g>', i);
      if (close < 0) return null;
      if (open >= 0 && open < close) { if (s[open + 2] === ' ' || s[open + 2] === '>') depth++; i = open + 2; continue; }
      depth--; i = close + 4;
      if (depth === 0) return { pre: s.slice(0, a), head: s.slice(a, i), post: s.slice(i) };
    }
    return null;
  }
  DUFX.dinoSVG = function (species, opts) {
    const r = resolve(species, opts);
    const id = 'd' + (++uidN);
    let art = ART[r.species](r.p, id);
    if (opts && opts.head && opts.head !== r.species && ART[opts.head]) {
      const hp = PALETTES[opts.headColor] || r.p, sb = splitHead(art), sh = splitHead(ART[opts.head](hp, id + 'h'));
      if (sb && sh) {
        const [bx, by] = ANCHOR[r.species], [hx, hy] = ANCHOR[opts.head];
        art = sb.pre + '<g transform="translate(' + (bx - hx) + ' ' + (by - hy) + ')">' + sh.head + '</g>' + sb.post;
      }
    }
    return `<svg class="du-dino-svg" viewBox="0 0 240 180" role="img" aria-label="A friendly ${r.species === 'trex' ? 'tyrannosaurus' : r.species}" focusable="false">
      <ellipse class="d-shadow" cx="120" cy="170" rx="74" ry="7" fill="#143c3a" opacity=".16"/>
      <g class="d-all">${art}</g>
      <g class="d-zzz" opacity="0" fill="#5b7fa8" font-weight="900" font-family="system-ui,sans-serif"><text x="180" y="40" font-size="20">z</text><text x="196" y="24" font-size="15">z</text><text x="208" y="12" font-size="11">z</text></g>
    </svg>`;
  };
  DUFX.dinoHTML = function (species, opts) {
    opts = opts || {};
    const r = resolve(species, opts);
    const state = opts.state || 'idle';
    const delay = (-Math.random() * 6).toFixed(2);
    const size = opts.size ? `width:${typeof opts.size === 'number' ? opts.size + 'px' : opts.size};` : '';
    return `<span class="du-dino" data-species="${r.species}" data-state="${state}" style="${size}--d-delay:${delay}s;--d-blink:${(2.6 + Math.random() * 3).toFixed(2)}s">${DUFX.dinoSVG(r.species, opts)}</span>`;
  };
  DUFX.dino = function (species, opts) {
    const t = document.createElement('div');
    t.innerHTML = DUFX.dinoHTML(species, opts);
    const el = t.firstElementChild;
    el.setState = (state, ms) => DUFX.dinoState(el, state, ms);
    if (opts && opts.track) DUFX.dinoTrack(el);
    return el;
  };
  const stateTimers = new WeakMap();
  DUFX.dinoState = function (el, state, ms) {
    if (!el) return;
    if (el.classList && !el.classList.contains('du-dino')) el = el.querySelector('.du-dino');
    if (!el) return;
    const base = el.getAttribute('data-base') || 'idle';
    clearTimeout(stateTimers.get(el));
    el.setAttribute('data-state', state);
    if (ms) stateTimers.set(el, setTimeout(() => el.setAttribute('data-state', base), ms));
  };
  /* A dinosaur's pupils follow the pointer, a tiny touch that makes it feel aware of the child. */
  DUFX.dinoTrack = function (el) {
    if (el._tracking) return;
    el._tracking = true;
    const move = (e) => {
      const svg = el.querySelector('svg');
      if (!svg || !document.contains(el)) return window.removeEventListener('pointermove', move);
      const r = svg.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width * .75)) / 400));
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * .3)) / 400));
      svg.querySelectorAll('.d-pupil').forEach((p) => { p.style.transform = `translate(${dx * 2.5}px,${dy * 2}px)`; });
    };
    window.addEventListener('pointermove', move, { passive: true });
  };
  /* Make every dinosaur found in a container react to taps (roar + hop). */
  DUFX.dinoPets = function (root) {
    (root || document).addEventListener('pointerdown', (e) => {
      const d = e.target.closest && e.target.closest('.du-dino[data-pet]');
      if (!d) return;
      DUFX.dinoState(d, d.dataset.species === 'trex' ? 'roar' : 'happy', 1100);
      if (DUFX.sfx) DUFX.sfx[d.dataset.species === 'trex' ? 'roar' : 'chirp']();
      if (DUFX.burst) { const r = d.getBoundingClientRect(); DUFX.burst(r.left + r.width * .6, r.top + r.height * .3, { kind: 'hearts', n: 7 }); }
    });
  };
})();
