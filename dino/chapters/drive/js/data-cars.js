// data/cars.js — Car catalog.
// Original app advertises 48 unique cars. We generate 48 from 6 body
// archetypes x 8 accent schemes so the catalog scales for later milestones.

export const PAINTS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
  "#1abc9c", "#3498db", "#9b59b6", "#ff6b9d",
  "#5c3a21", "#7f8c8d", "#16a085", "#c0392b",
  "#8e44ad", "#2980b9", "#d35400", "#27ae60"
];

export const STICKERS = ["⭐", "🌟", "💥", "🔥", "🦖", "🌈", "⚡", "🍕", "🎈", "👑"];

// Body archetypes: each is a function returning SVG inner markup.
// They draw into a 320x160 viewBox, body center around (160, 90).
export const BODIES = {
  sport: (c) => `
    <path d="M20 108 Q30 78 70 72 L150 66 Q190 40 232 66 L296 78 Q306 92 300 108 Z" fill="${c}"/>
    <path d="M78 74 L150 68 Q186 46 226 68 L252 74 L252 84 L78 84 Z" fill="#bfe6ff" opacity="0.9"/>
    <circle cx="78" cy="112" r="20" fill="#222"/><circle cx="78" cy="112" r="9" fill="#cfd8e3"/>
    <circle cx="242" cy="112" r="20" fill="#222"/><circle cx="242" cy="112" r="9" fill="#cfd8e3"/>`,
  truck: (c) => `
    <rect x="18" y="70" width="284" height="46" rx="10" fill="${c}"/>
    <rect x="18" y="56" width="120" height="60" rx="10" fill="${c}"/>
    <rect x="34" y="66" width="52" height="30" rx="6" fill="#bfe6ff"/>
    <circle cx="70" cy="118" r="22" fill="#222"/><circle cx="70" cy="118" r="10" fill="#cfd8e3"/>
    <circle cx="250" cy="118" r="22" fill="#222"/><circle cx="250" cy="118" r="10" fill="#cfd8e3"/>`,
  van: (c) => `
    <rect x="24" y="58" width="272" height="58" rx="18" fill="${c}"/>
    <rect x="44" y="68" width="58" height="34" rx="8" fill="#bfe6ff"/>
    <rect x="120" y="68" width="58" height="34" rx="8" fill="#bfe6ff"/>
    <rect x="196" y="68" width="58" height="34" rx="8" fill="#bfe6ff"/>
    <circle cx="84" cy="118" r="20" fill="#222"/><circle cx="84" cy="118" r="9" fill="#cfd8e3"/>
    <circle cx="236" cy="118" r="20" fill="#222"/><circle cx="236" cy="118" r="9" fill="#cfd8e3"/>`,
  pickup: (c) => `
    <path d="M20 108 L20 84 L96 84 L112 60 L210 60 L226 84 L300 84 L300 108 Z" fill="${c}"/>
    <rect x="120" y="68" width="80" height="24" rx="6" fill="#bfe6ff"/>
    <circle cx="80" cy="112" r="20" fill="#222"/><circle cx="80" cy="112" r="9" fill="#cfd8e3"/>
    <circle cx="240" cy="112" r="20" fill="#222"/><circle cx="240" cy="112" r="9" fill="#cfd8e3"/>`,
  race: (c) => `
    <path d="M14 104 Q24 82 60 78 L140 72 Q180 46 224 72 L290 80 Q302 92 296 104 Z" fill="${c}"/>
    <rect x="150" y="44" width="60" height="14" rx="7" fill="#222"/>
    <path d="M84 78 L140 74 Q176 52 216 74 L236 78 L236 86 L84 86 Z" fill="#bfe6ff" opacity="0.9"/>
    <circle cx="72" cy="110" r="18" fill="#222"/><circle cx="72" cy="110" r="8" fill="#cfd8e3"/>
    <circle cx="248" cy="110" r="18" fill="#222"/><circle cx="248" cy="110" r="8" fill="#cfd8e3"/>`,
  monster: (c) => `
    <rect x="22" y="76" width="276" height="40" rx="12" fill="${c}"/>
    <rect x="40" y="52" width="110" height="44" rx="10" fill="${c}"/>
    <rect x="54" y="62" width="50" height="26" rx="6" fill="#bfe6ff"/>
    <circle cx="74" cy="122" r="30" fill="#222"/><circle cx="74" cy="122" r="13" fill="#cfd8e3"/>
    <circle cx="246" cy="122" r="30" fill="#222"/><circle cx="246" cy="122" r="13" fill="#cfd8e3"/>`
};

const BODY_KEYS = Object.keys(BODIES);
const NAMES = [
  "Racer", "Thunder", "Bolt", "Rocket", "Blaze", "Storm", "Flash", "Titan",
  "Speedy", "Turbo", "Viper", "Comet", "Fury", "Nova", "Jolt", "Draco"
];

export const CARS = Array.from({ length: 48 }, (_, i) => {
  const body = BODY_KEYS[i % BODY_KEYS.length];
  const paint = PAINTS[(i * 5) % PAINTS.length];
  return {
    id: `car-${i + 1}`,
    name: `${NAMES[i % NAMES.length]} ${Math.floor(i / NAMES.length) + 1}`,
    body,
    paint
  };
});