// A vector field plate. The shoreline and its reflection share the same horizon.
const ridges = [
  ["#b7b49a", "M-20 223 62 196 114 203 184 164 218 177 284 138 324 159 371 142 441 179 509 153 582 176 638 153 740 183"],
  ["#788d7d", "M-20 212 42 192 91 211 140 207 201 187 254 194 310 170 358 190 406 178 469 202 548 182 594 194 646 174 740 193"],
  ["#3d675f", "M-20 196 56 207 99 228 176 220 233 230 304 205 368 217 443 198 511 222 578 205 637 215 740 192"],
];
function ripple(row) {
  const y = 255 + row * 6.4;
  return Array.from({ length: 87 }, (_, i) => {
    const x = i * 9 - 28;
    const wave = Math.sin(x / 57 + row * .38) * (1 + row * .15) + Math.cos(x / 32 - row * .25) * 1.5;
    return (i ? "L" : "M") + x + " " + (y + wave).toFixed(1);
  }).join(" ");
}
export default function TidalPlate() {
  return <figure className="tidal-plate">
    <div className="plate-frame">
      <svg viewBox="0 0 720 470" role="img" aria-label="An engraved estuary at sunset, with distant mountains, birds and copper light on the water">
        <defs>
          <linearGradient id="sky" x2=".18" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#92aba2"/><stop offset=".62" stopColor="#e5c99d"/><stop offset="1" stopColor="#f5b68b"/></linearGradient>
          <linearGradient id="water" x2=".2" y2="1"><stop stopColor="#75998a"/><stop offset=".3" stopColor="#436f65"/><stop offset="1" stopColor="#123f40"/></linearGradient>
          <pattern id="etch" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h4" stroke="#2c4741" opacity=".11" strokeWidth=".7"/></pattern>
          <clipPath id="sun-track"><path d="M419 240h36l-5 19 17 8-10 12 24 12-16 9 29 15-28 10 30 20-22 9 34 19-46 11 23 14-98 31 28-28-22-9 29-19-34-6 28-20-15-11 18-15-18-11 13-15-11-8 14-13-9-10z"/></clipPath>
        </defs>
        <rect width="720" height="470" fill="url(#sky)"/>
        <circle className="setting-sun" cx="438" cy="151" r="79" fill="#f8aa73"/>
        <g stroke="#fff0cc" strokeWidth="1" opacity=".53">{[0,1,2,3,4,5,6,7].map(i=><path key={i} d={`M0 ${81+i*14} Q150 ${72+i*14} 284 ${83+i*14} T720 ${73+i*14}`} fill="none"/>)}</g>
        {ridges.map(([color,d])=><path key={color} d={d+" V254 H-20Z"} fill={color}/>)}
        <path d="M0 224q98 23 172 12t147-2q100 9 181-4t220-12v40H0z" fill="#315b53"/>
        <rect y="245" width="720" height="225" fill="url(#water)"/>
        <g className="tidal-lines" fill="none">{Array.from({length:35},(_,i)=><path key={i} d={ripple(i)} stroke={i%3===0?"#c2ceaa":"#99b5a1"} opacity={.62-i*.009} strokeWidth={i%3===0?1.5:.8}/>)}</g>
        <g clipPath="url(#sun-track)" fill="none" stroke="#f5c68e" opacity=".9">{Array.from({length:45},(_,i)=><path key={i} d={`M365 ${247+i*4} q50 ${i%5-2} 150 0`} strokeWidth={i%3===0?2.5:1.2}/>)}</g>
        <g fill="none" stroke="#284c46" strokeWidth="2.6" strokeLinecap="round" className="sea-birds">{[[153,97,1],[180,89,.65],[128,109,.58]].map(([x,y,s])=><path key={x} transform={`translate(${x} ${y}) scale(${s})`} d="M-10-3q7-1 10 4 4-7 12-8"/>)}</g>
        <path d="M0 354q56-9 90-4t79 14q-57 1-90 6t-79 4zM720 294q-56 0-97 6t-68 10q74-3 97-1t68-4z" fill="#27534d"/>
        <rect width="720" height="470" fill="url(#etch)"/>
      </svg>
    </div>
    <figcaption><span>Fig. 01</span><i/>The tidal pool</figcaption>
  </figure>;
}
