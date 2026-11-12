// Hand-drawn emblems for the arcade menu. Line art only — no emoji, no images.

const open = '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">';
const close = '</svg>';

export const EMBLEMS = {
  claw: `${open}
    <path d="M9 45c9-4 14-11 17-21M16 52c8-5 12-13 13-24M25 55c6-6 8-14 7-24" />
    <path d="M33 38c6-2 9-6 10-11M35 47c6-2 9-6 10-11" opacity=".55" />
    <path d="M6 18h10M3 26h9" opacity=".4" />${close}`,
  horn: `${open}
    <path d="M14 30c0-9 7-15 16-15 3 0 5 .4 7 1.2M21 19c-4 5-6 10-6 16" />
    <path d="M36 16c4 0 8 .8 11 2.6L40 27l-4-4 3-2-6-1z" />
    <path d="M45 19c2 5 2 10 0 15-3 7-10 11-17 11-6 0-11-3-14-8" />
    <path d="M23 36c4 2 9 2 13 0" opacity=".6" />
    <path d="M20 40c-2 3-3 6-2 9M31 42c1 3 0 6-1 8" opacity=".45" />${close}`,
  wave: `${open}
    <path d="M7 25c7-8 15-12 24-12 8 0 15 3 20 8-6-2-12-2-17 0 4 2 7 5 9 9-7-4-14-4-20-1" />
    <path d="M6 41c6-3 12-3 18 0s12 3 18 0 10-3 16 0M6 50c6-3 12-3 18 0s12 3 18 0 10-3 16 0" opacity=".6" />
    <path d="M23 30c5 1 9 4 12 8" opacity=".5" />${close}`,
  spike: `${open}
    <path d="M6 43c5-6 11-11 19-14" />
    <path d="M20 33l6-12 7 9M33 29l7-13 7 10M45 27l6-10 5 9" />
    <path d="M9 44c8-1 14-4 18-9M49 43c4-2 7-5 9-9" />
    <path d="M18 47l-5 8M27 47l-3 9M36 47l1 9M45 46l5 8" opacity=".55" />${close}`,
  meteor: `${open}
    <circle cx="40" cy="23" r="10" />
    <path d="M30 17l-12-8M28 24l-16-3M31 31l-13 6M35 13l-6-10" opacity=".6" />
    <path d="M10 54l4-7 4 7M26 55l5-9 5 9M44 54l3-6 3 6" opacity=".7" />${close}`,
  volcano: `${open}
    <path d="M6 54L24 20h16l18 34z" />
    <path d="M24 20c4 3 11 3 16 0" />
    <path d="M28 24c-2 8-5 15-9 22M36 24c2 8 5 15 9 22" opacity=".7" />
    <path d="M18 12c3-3 6-4 10-4M38 8c4 0 7 2 9 5" opacity=".5" />${close}`,
  rope: `${open}
    <path d="M12 10c14 2 24 10 28 22 2 8-1 15-7 18" />
    <path d="M33 50c-4 4-10 4-14 0-3-4-2-9 2-11 4-2 8 0 9 4" />
    <path d="M14 34c4 2 7 5 9 9M22 27l4 4M19 37l6 1" opacity=".65" />
    <path d="M46 54c4-2 7-5 9-9" opacity=".45" />${close}`,
  trail: `${open}
    <path d="M10 50c6-16 14-26 26-32 6-3 11-3 16-1" stroke-dasharray="2 5" />
    <path d="M14 44c2-1 3 0 3 2s-2 3-4 2-1-4 1-4zM26 31c2-1 3 0 3 2s-2 3-4 2-1-4 1-4z" />
    <path d="M18 50c2-1 3 0 3 2s-2 3-4 2-1-4 1-4zM31 37c2-1 3 0 3 2s-2 3-4 2-1-4 1-4z" opacity=".6" />
    <path d="M43 20c2-1 3 0 3 2s-2 3-4 2-1-4 1-4z" opacity=".5" />${close}`,
  vine: `${open}
    <path d="M18 4c4 10 3 19-3 27-5 7-5 14 1 19M18 4c0 9 4 15 11 18 8 4 12 10 11 17" />
    <path d="M33 39c2-4 6-6 10-5M43 34l4 1-2 4" />
    <path d="M27 51c0-5 4-9 9-9s9 4 9 9" opacity=".7" />
    <path d="M36 51v6M30 57h12" opacity=".7" />${close}`,
  amber: `${open}
    <path d="M32 6c8 10 14 18 14 27 0 9-6 16-14 16s-14-7-14-16c0-9 6-17 14-27z" />
    <path d="M27 31c0-4 3-7 7-7M38 37c-1 3-3 5-6 5" opacity=".55" />
    <circle cx="32" cy="33" r="3" />
    <path d="M28 29l-3-4M36 29l3-4M27 38l-4 3M37 38l4 3" opacity=".6" />${close}`,
  trowel: `${open}
    <path d="M24 38L43 9l12 9-19 29z" />
    <path d="M24 38c-5 2-9 7-10 13 6-1 11-3 15-7" />
    <path d="M8 56h14M30 56h10M46 56h10" opacity=".55" />
    <path d="M38 17l7 5" opacity=".6" />${close}`,
  rapids: `${open}
    <path d="M8 34c8-4 15-4 23 0s15 4 25 0M6 43c8-4 16-4 24 0s16 4 26 0M8 52c8-4 15-4 23 0s15 4 25 0" opacity=".7" />
    <path d="M17 30c0-6 5-10 12-10h10c7 0 11 4 11 10" />
    <path d="M26 20l-6-8M42 20l7-7" opacity=".6" />
    <circle cx="24" cy="29" r="3" /><circle cx="40" cy="29" r="3" />${close}`,
  moon: `${open}
    <path d="M38 8c-10 2-17 11-17 21 0 12 10 21 22 21 3 0 6-.5 8-1-5-3-9-9-9-16 0-8 4-14 9-17-4-4-8-7-13-8z" />
    <path d="M10 50c2-1 3 0 3 2s-2 3-4 2-1-4 1-4zM22 44c2-1 3 0 3 2s-2 3-4 2-1-4 1-4z" opacity=".6" />${close}`,
  bridge: `${open}
    <path d="M6 44c8-18 44-18 52 0" />
    <path d="M12 38c2 4 3 8 3 12M22 29c2 6 3 12 3 19M32 26c1 7 1 14 1 21M42 29c0 6-1 12-2 19M52 38c-1 4-2 8-3 12" opacity=".65" />
    <path d="M6 52h52" opacity=".8" />
    <circle cx="32" cy="24" r="3" opacity=".8" />${close}`,
  drum: `${open}
    <path d="M12 33c0-6 9-10 20-10s20 4 20 10v12c0 6-9 10-20 10s-20-4-20-10z" />
    <path d="M12 33c0 6 9 10 20 10s20-4 20-10" />
    <path d="M8 19l12 10M56 19L44 29" opacity=".7" />
    <path d="M6 56c4-2 8-2 12 0M46 56c4-2 8-2 12 0" opacity=".4" />${close}`,
  causeway: `${open}
    <path d="M6 52c7-4 14-4 21 0s14 4 22 0 9-3 13-1" opacity=".7" />
    <path d="M9 42c2-3 7-3 9 0M23 35c2-3 7-3 9 0M37 28c2-3 7-3 9 0M49 21c2-3 7-3 9 0" />
    <path d="M13 42v3M27 35v4M41 28v4" opacity=".45" />
    <path d="M52 10c-5 1-8 5-8 9" opacity=".5" />${close}`,
  spear: `${open}
    <path d="M50 8l6 4-3 7-6-4z" />
    <path d="M47 19L16 50M20 46l-6 8 8-6" />
    <path d="M8 30c5-3 10-3 15 0s10 3 15 0" opacity=".55" />
    <path d="M28 38c4-2 8-1 11 2-3 3-7 4-11 2z" opacity=".7" />${close}`,
  thermal: `${open}
    <path d="M20 52c0-10 8-12 8-22 0-7-6-9-6-15" />
    <path d="M22 18l-4-3 4-4M22 30l4-3-4-4" opacity=".7" />
    <path d="M38 52V36h10v16" />
    <path d="M40 34c2-6 8-8 12-5" opacity=".6" />
    <path d="M6 52h52" opacity=".5" />${close}`,
  lantern: `${open}
    <path d="M26 14h12l3 8v20c0 3-4 5-9 5s-9-2-9-5V22z" />
    <path d="M29 26h6v10h-6z" opacity=".6" />
    <path d="M32 8v6M24 10l2 4M40 10l-2 4" opacity=".5" />
    <path d="M46 26l12-6M46 34l14 2M46 42l11 8" opacity=".45" />${close}`,
  geyser: `${open}
    <path d="M32 50c-8 0-14-2-14-4s6-3 14-3 14 1 14 3-6 4-14 4z" />
    <path d="M26 42c-3-9-2-16 2-22 3 6 6 13 4 22" />
    <path d="M32 40c0-10 2-16 5-20M38 42c3-7 3-12 1-16" opacity=".6" />
    <path d="M20 20c-3-4-3-8 0-11M46 22c3-3 4-7 2-11" opacity=".45" />${close}`,
  nest: `${open}
    <path d="M10 40c2-8 10-13 22-13s20 5 22 13c-4 8-12 12-22 12s-18-4-22-12z" />
    <path d="M14 34c6 3 12 4 18 4s12-1 18-4" opacity=".6" />
    <ellipse cx="32" cy="34" rx="7" ry="8" />
    <path d="M20 44l8-6M44 44l-8-6M26 48l10-4" opacity=".45" />${close}`,
  burrow: `${open}
    <path d="M4 22c8-6 16-6 24 0s16 6 24 0" opacity=".5" />
    <path d="M14 54c0-12 4-18 12-20 6-2 10-6 10-12" />
    <path d="M22 46c4-2 8-2 12 1" opacity=".6" />
    <circle cx="30" cy="40" r="3" opacity=".7" />
    <path d="M44 44h8M46 50h8M50 38h6" opacity=".4" />${close}`,
  egg: `${open}
    <path d="M32 8c8 10 13 20 13 28 0 9-6 16-13 16s-13-7-13-16c0-8 5-18 13-28z" />
    <path d="M25 36c0-6 3-11 7-14" opacity=".55" />
    <path d="M8 54h48" opacity=".5" />
    <path d="M18 50l-4 4M46 50l4 4" opacity=".4" />${close}`,
  charcoal: `${open}
    <path d="M10 40c4-12 14-18 24-16 8 2 12 8 12 14 0 5-3 9-8 10" />
    <path d="M26 26c3-3 7-4 10-2M22 44c6 2 12 2 18-1" opacity=".6" />
    <path d="M52 46l6 8-8-2z" />
    <path d="M54 42l4-6" opacity=".6" />${close}`,
  chorus: `${open}
    <path d="M14 54c0-9 5-15 12-17" />
    <circle cx="26" cy="33" r="3" />
    <path d="M30 26c4-2 8-1 11 2M34 18c8 2 13 8 14 16" opacity=".6" />
    <path d="M40 10c10 3 16 12 16 22" opacity=".4" />
    <path d="M6 44c3-2 6-2 9 0M6 50c3-2 6-2 9 0" opacity=".45" />${close}`,
  frost: `${open}
    <path d="M4 46h56" opacity=".55" />
    <path d="M20 40V18M14 26l6-6 6 6M14 34l6-6 6 6" />
    <path d="M42 42V24M37 30l5-5 5 5" opacity=".7" />
    <path d="M28 12c2-3 5-4 8-3" opacity=".45" />${close}`,
  starpath: `${open}
    <path d="M10 52c8-10 18-16 30-18 6-1 10-3 14-7" stroke-dasharray="2 5" />
    <path d="M44 12l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" />
    <path d="M16 16l2 4 4 .6-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.6z" opacity=".6" />
    <path d="M8 56c4-2 8-2 12 0" opacity=".45" />${close}`,
  mirror: `${open}
    <ellipse cx="26" cy="30" rx="14" ry="12" transform="rotate(-18 26 30)" />
    <path d="M20 26c3-3 8-4 12-2" opacity=".6" />
    <path d="M40 20l16-8M42 30l18 2M40 40l14 10" opacity=".5" />
    <path d="M26 42l-4 12M22 54h10" opacity=".6" />${close}`,
  brush: `${open}
    <path d="M8 14l18 12 6-8L14 6z" />
    <path d="M26 26l10 7-4 6-10-7z" opacity=".8" />
    <path d="M32 40l4 8M37 42l3 9M42 44l2 8" opacity=".6" />
    <path d="M44 20c5 2 8 6 9 11M52 16c3 4 4 9 3 13" opacity=".45" />${close}`
};

export function emblemFor(game) {
  return EMBLEMS[game.emblem] || EMBLEMS.claw;
}
