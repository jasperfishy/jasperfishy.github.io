# Dinosaur Universe — Phaser Migration Coverage Ledger

Live site: jasperfish.com/dino (Cloudflare Pages).
Phaser engine: `dino/lib/phaser.min.js` (3.80.1, vendored). Pages reference it as `../../lib/phaser.min.js`.
Shared polish kit: `dino/chapters/phaser-kit.js` (DUKit: sparkles, parallax, sound, stars, title/end panels).
Hub FX: `dino/fx/du-fx.js` (DUFX) + `dino/fx/du-dino.js` (dinoSVG/dinoHTML art).

## CRITICAL FIX FOUND & APPLIED (Stage 2 run)
All four `-phaser` pages referenced the Phaser engine as `../lib/phaser.min.js`, which resolves to
`dino/chapters/lib/` — **that folder does not exist**. The engine actually lives at `dino/lib/`, so the
correct relative path from a page in `dino/chapters/<world>/` is `../../lib/phaser.min.js`.
Result: `Phaser is not defined` and **none of the four worlds actually booted** (Stage 1 was verified by
fetching the engine URL directly, not the in-page reference, so this slipped through). Fixed all 8 pages
(root `dino` + source `public/dino`): commit `66f4c30` (Meadow/Car/Adventures) and `3ef95af` (Park).
After the fix, a headless `--dump-dom` boot check shows: Phaser v3.80.1 (WebGL | Web Audio), canvas present,
no uncaught errors, no setInteractive warning.

## Stage status
- **Stage 1** (committed `f18db0e`, pushed, live): vendored Phaser 3.80.1; installed 4 polished single-game
  *-phaser worlds; hub cards open the Phaser editions with "Classic world" buttons; service worker du-v15.
  - NOTE: the engine-path bug above meant the four single-game worlds did not actually boot until `66f4c30`.
- **Stage 2** (Park multi-game app, `3ef95af` + one commit per game): 12-game Phaser shell
  = **MenuScene + 11 game scenes**. Root `dino/chapters/park-phaser/main.js` (~1879 lines) kept
  byte-identical to its `public/dino/...` copy at every commit (SHA-256 verified).

## Coverage ledger — Park (12 classic games) — ALL IMPLEMENTED
| Game | Classic source | Phaser scene | Visual check | Commit |
|---|---|---|---|---|
| 1. Dino Puzzle | park/js/games1.js | PuzzleScene | UNVERIFIED (boot only) | 3ef95af |
| 2. Dig a Dino | park/js/games1.js | DigScene | UNVERIFIED (boot only) | 3ef95af |
| 3. Footprint Match | park/js/games1.js | FootScene | UNVERIFIED (boot only) | 08ad8cf |
| 4. Dino Mixer | park/js/games1.js | MixerScene | UNVERIFIED (boot only) | 581ed94 |
| 5. Dino Memory | park/js/games2.js | MemoryScene | UNVERIFIED (boot only) | cc05d28 |
| 6. Size Parade | park/js/games2.js | SizeScene | UNVERIFIED (boot only) | f694a52 |
| 7. Snack Time / Counting | park/js/games2.js | CountingScene | UNVERIFIED (boot only) | a3a35c5 |
| 8. Dot-to-Dot | park/js/games2.js | DotScene | UNVERIFIED (boot only) | 403269e |
| 9. Dino Colouring | park/js/games3.js | ColourScene | UNVERIFIED (boot only) | 7970bad |
| 10. Dino Cafe | park/js/games3.js | CafeScene | UNVERIFIED (boot only) | a8a2974 |
| 11. Dino Dash | park/js/games3.js | DashScene | UNVERIFIED (boot only) | 87687b2 |
| 12. Egg Catch | park/js/games3.js | CatchScene | UNVERIFIED (boot only) | cf8eac4 |

All 12 scenes registered in `GAME_LIST`, `GAME_MAP` and the `scene:` array; `node --check` exit=0;
root+public hash-identical; headless `--dump-dom` boot check clean (canvas present, Phaser banner, exit 0,
no JS console errors). Per-scene polish via shared DUKit (sparkleField, sunRays, burst, sfx, shake,
title card, end panel + star rating). Continuous-motion games (11 Dash, 12 Egg Catch) use Phaser's
`update(time, delta)` loop; the rest are tap/click-driven with tweens + `time.delayedCall`.

## Coverage ledger — other worlds
| World | Classic location | Phaser state | Notes |
|---|---|---|---|
| Meadow | chapters/meadow | single memory-match (engine-path fixed) | boots clean now; ~20 game types remain |
| Car Studio | chapters/drive | single endless-runner (engine-path fixed) | boots clean now; build + 6 worlds + race remain |
| Adventures | chapters/adventures | single balloon-flight (engine-path fixed) | boots clean now; 21 activities remain |

## Open / next
1. **Visual play-through (menu -> game -> win -> restart) = UNVERIFIED for ALL 12 games.** The local
   headless screenshot route returns the live-site image, not the local canvas. A working local
   screenshot/vision route (or the Chief Playwright browser) is needed to confirm rendered gameplay flow.
   Until then every game is verified only to: `node --check` + clean headless boot + DUKit API consistency.
2. Repeat the same multi-game pattern for Meadow, Car Studio, Adventures (their remaining games).
Commit per stage; **no push/deploy unless explicitly asked.** (Stage 1 `f18db0e` is pushed + live;
games 3-12 are local-only.)
