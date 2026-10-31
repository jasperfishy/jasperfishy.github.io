// Dinosaur Universe hub — animated artwork (all inline SVG/CSS; motion lives in hub.css).
const D = (species, opts) => window.DUFX.dinoHTML(species, opts);

/* The big welcome scene at the top of the hub. */
export function heroScene() {
  const stars = Array.from({ length: 30 }, (_, i) => {
    const x = (i * 37 + 11) % 97, y = (i * 53 + 7) % 52;
    return `<i class="hs-star" style="left:${x}%;top:${y}%;--d:${(i % 7) * .4}s;--s:${i % 3 ? 2 : 3}px"></i>`;
  }).join('');
  return `
  <div class="hs-sky hs-sky-bg"></div>
  <i class="hs-orb hs-sun" data-orb title="Tap me!"></i>
  <i class="hs-orb hs-moon" data-orb title="Tap me!"><b></b><b></b><b></b></i>
  <div class="hs-stars">${stars}</div>
  <div class="hs-layer" style="--k:.4">
    <span class="hs-cloud" style="top:10%;--w:150px;--t:78s;--o:-12s"></span>
    <span class="hs-cloud" style="top:26%;--w:100px;--t:56s;--o:-40s"></span>
    <span class="hs-cloud" style="top:6%;--w:120px;--t:96s;--o:-70s"></span>
  </div>
  <div class="hs-layer hs-fly" style="--k:.7">
    <span class="hs-flyer" style="top:16%;--t:34s;--o:-6s;width:96px">${D('ptero', { color: 'blue', state: 'idle' })}</span>
    <span class="hs-flyer hs-flyer-2" style="top:30%;--t:52s;--o:-30s;width:62px">${D('ptero', { color: 'pink', state: 'idle' })}</span>
  </div>
  <svg class="hs-svg hs-far" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path class="hs-mtn1" d="M0 250 L90 170 L160 225 L260 140 L360 230 L440 180 L540 250 L620 200 L720 245 L1000 190 L1000 340 L0 340Z"/>
    <path class="hs-mtn2" d="M0 280 L120 215 L230 270 L330 205 L450 275 L560 230 L690 280 L1000 240 L1000 340 L0 340Z"/>
  </svg>
  <div class="hs-layer" style="--k:1.1">
    <svg class="hs-svg hs-volcano" viewBox="0 0 220 200" aria-hidden="true">
      <path class="hs-vol" d="M10 200 L78 58 Q110 40 142 58 L210 200Z"/>
      <path d="M78 58 Q110 70 142 58 Q110 48 78 58Z" class="hs-crater"/>
      <path class="hs-lava" d="M104 66 q-6 40 -22 84 M118 66 q10 36 26 86"/>
    </svg>
    <i class="hs-smoke" style="--d:0s"></i><i class="hs-smoke" style="--d:1.6s"></i><i class="hs-smoke" style="--d:3.2s"></i>
  </div>
  <svg class="hs-svg hs-hills" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path class="hs-g1" d="M0 262 Q150 220 320 252 T640 246 T1000 236 L1000 340 L0 340Z"/>
    <path class="hs-g2" d="M0 296 Q200 262 420 290 T820 286 T1000 280 L1000 340 L0 340Z"/>
  </svg>
  <div class="hs-herd">
    <span class="hs-walker" style="--t:70s;--o:-8s;width:112px;--b:4%">${D('bronto', { state: 'walk', color: 'orange' })}</span>
    <span class="hs-walker" style="--t:58s;--o:-34s;width:96px;--b:2%">${D('tricera', { state: 'walk', color: 'teal' })}</span>
    <span class="hs-walker" style="--t:46s;--o:-20s;width:86px;--b:6%">${D('stego', { state: 'walk', color: 'purple' })}</span>
    <span class="hs-walker hs-run" style="--t:30s;--o:-50s;width:70px;--b:1%">${D('raptor', { state: 'run', color: 'red' })}</span>
  </div>
  <div class="hs-palms" aria-hidden="true">
    <svg viewBox="0 0 120 190" class="hs-palm" style="left:2%"><path d="M60 190 Q54 120 62 56" class="hs-trunk"/><g class="hs-fronds" style="transform-origin:62px 56px"><path d="M62 56 Q20 30 4 62 Q32 44 62 56Z"/><path d="M62 56 Q100 24 118 58 Q92 42 62 56Z"/><path d="M62 56 Q40 4 14 14 Q42 18 62 56Z"/><path d="M62 56 Q86 0 112 10 Q84 16 62 56Z"/><path d="M62 56 Q62 8 62 -4 Q70 24 62 56Z"/></g></svg>
    <svg viewBox="0 0 120 190" class="hs-palm hs-palm2" style="right:30%"><path d="M60 190 Q66 130 58 66" class="hs-trunk"/><g class="hs-fronds" style="transform-origin:58px 66px;animation-delay:-1.2s"><path d="M58 66 Q18 42 2 72 Q30 56 58 66Z"/><path d="M58 66 Q98 36 116 68 Q90 52 58 66Z"/><path d="M58 66 Q36 16 12 26 Q38 28 58 66Z"/><path d="M58 66 Q82 12 108 22 Q80 26 58 66Z"/></g></svg>
  </div>
  <div class="hs-rex" data-pet>${D('trex', { color: 'green', state: 'idle', size: '100%' })}</div>
  <div class="hs-bubble" aria-live="polite"><span id="hsSay"></span></div>
  <div class="hs-fore" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="left:${(i * 6.4 + (i % 3) * 1.3).toFixed(1)}%;--d:${(i % 5) * -.5}s;--h:${14 + (i % 4) * 6}px"></i>`).join('')}<em style="left:18%">🌼</em><em style="left:46%">🌷</em><em style="left:71%">🌸</em><em style="left:90%">🌼</em></div>`;
}

/* Animated tiles for the three big worlds. */
export function chapterArt(id) {
  if (id === 'park') return `
    <div class="ca ca-park">
      <i class="ca-sunrays"></i>
      <svg class="ca-volc" viewBox="0 0 160 120" aria-hidden="true"><path d="M6 120 L58 30 Q80 18 102 30 L154 120Z" fill="#8c5a3c"/><path d="M58 30 Q80 40 102 30 Q80 22 58 30Z" fill="#ff7a3d"/><path d="M76 36 q-4 30 -16 58 M88 36 q8 26 20 58" stroke="#ff9a52" stroke-width="5" fill="none" stroke-linecap="round" class="ca-lava"/></svg>
      <i class="ca-smoke" style="--d:0s"></i><i class="ca-smoke" style="--d:1.4s"></i><i class="ca-smoke" style="--d:2.8s"></i>
      <i class="ca-ember" style="--x:44%;--d:.2s"></i><i class="ca-ember" style="--x:52%;--d:1s"></i><i class="ca-ember" style="--x:58%;--d:1.8s"></i>
      <span class="ca-walker" style="--t:11s">${D('trex', { state: 'walk', color: 'green' })}</span>
      <i class="ca-ground"></i>
    </div>`;
  if (id === 'meadow') return `
    <div class="ca ca-meadow">
      <i class="ca-sun"></i>
      <i class="ca-cloud" style="top:12%;--w:60px;--t:26s"></i><i class="ca-cloud" style="top:30%;--w:40px;--t:38s;--o:-15s"></i>
      <span class="ca-stego">${D('stego', { color: 'purple' })}</span>
      <i class="ca-bf" style="--p:0">🦋</i><i class="ca-bf" style="--p:1">🦋</i>
      <span class="ca-flowers">${['🌼', '🌸', '🌷', '🌻', '🌼', '🌺'].map((f, i) => `<em style="--i:${i}">${f}</em>`).join('')}</span>
      <i class="ca-ground ca-ground-m"></i>
    </div>`;
  if (id === 'adventures') return `
    <div class="ca ca-adv">
      <i class="ca-sun"></i>
      <i class="ca-cloud" style="top:14%;--w:56px;--t:30s"></i>
      ${['#ff6b6b','#ffd23f','#4ecdc4','#a78bfa'].map((c,i)=>`<i class="ca-balloon" style="--c:${c};--x:${12+i*22}%;--d:${i*-1.3}s"></i>`).join('')}
      <span class="ca-walker" style="--t:14s">${D('raptor', { state: 'run', color: 'orange' })}</span>
      <i class="ca-ground ca-ground-m"></i>
    </div>`;
  return `
    <div class="ca ca-drive">
      <i class="ca-cloud" style="top:10%;--w:70px;--t:22s"></i><i class="ca-cloud" style="top:26%;--w:46px;--t:34s;--o:-12s"></i>
      <svg class="ca-hills" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 L0 30 Q40 6 80 28 T160 24 T200 30 L200 60Z" fill="#74c98b"/></svg>
      <i class="ca-road"><b></b></i>
      <span class="ca-car">
        <svg viewBox="0 0 150 70" aria-hidden="true"><rect x="6" y="28" width="138" height="26" rx="12" fill="#ff5d5d" stroke="#8c1f1f" stroke-width="3"/><path d="M40 28 Q52 6 76 6 L102 6 Q116 8 124 28Z" fill="#ffd0d0" stroke="#8c1f1f" stroke-width="3"/><circle cx="74" cy="22" r="11" fill="#91d09c" stroke="#236455" stroke-width="3"/><circle cx="78" cy="20" r="2.5" fill="#163f42"/><path d="M82 26 q4 2 8 0" stroke="#236455" stroke-width="2" fill="none"/>
          <g class="ca-wheel" style="transform-origin:36px 56px"><circle cx="36" cy="56" r="12" fill="#2b2f3a"/><circle cx="36" cy="56" r="5" fill="#cfd8e3"/><path d="M36 46 v20 M26 56 h20" stroke="#cfd8e3" stroke-width="2.5"/></g>
          <g class="ca-wheel" style="transform-origin:112px 56px"><circle cx="112" cy="56" r="12" fill="#2b2f3a"/><circle cx="112" cy="56" r="5" fill="#cfd8e3"/><path d="M112 46 v20 M102 56 h20" stroke="#cfd8e3" stroke-width="2.5"/></g></svg>
        <i class="ca-puff" style="--d:0s"></i><i class="ca-puff" style="--d:.3s"></i><i class="ca-puff" style="--d:.6s"></i>
      </span>
    </div>`;
}
