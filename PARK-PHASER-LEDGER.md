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
After the fix, a headless `--headless=new --dump-dom --enable-logging` boot check shows: Phaser v3.80.1
(WebGL | Web Audio), canvas present, no uncaught errors, no setInteractive warning.

## Stage status
- **Stage 1** (committed `f18db0e`, pushed, live): vendored Phaser 3.80.1; installed 4 polished single-game
  *-phaser worlds; hub cards open the Phaser editions with "Classic world" buttons; service worker du-v15.
  - NOTE: the engine-path bug above meant the four single-game worlds did not actually boot until `66f4c30`.
- **Stage 2** (Park multi-game app, committed `3ef95af`, synced to `public/dino` source tree):
  Multi-scene Phaser shell = **MenuScene + PuzzleScene + DigScene**.
  - Games implemented: **Dino Puzzle** (swap-tile rebuild) and **Dig a Dino** (tap-twice dig, find all bones,
    fossil fills in). Animated menu with star ratings; title cards, end panels, sparkles, sound via DUKit.
  - `node --check` passes on root + public copies (byte-identical).
  - Headless console/DOM boot check: **clean boot** (Phaser v3.80.1 WebGL+Web Audio, canvas present, no errors).
  - **VISUAL play-through (menu -> game -> win -> restart) = STILL UNVERIFIED.** The local screenshot route
    returns the live-site image instead of the local headless-Chrome canvas, so the rendered menu/board/win
    could not be seen. A clean boot is a **partial** check only; it does NOT prove the gameplay flow renders.
  - **Egg Catch** (the former Stage 1 single "catch the eggs" Phaser game) was **superseded** by this
    multi-game shell and is currently NOT in the Park menu; it should be re-added as menu game 12/12 later.

## Coverage ledger — Park (12 classic games)
| Game | Classic location | Phaser state | Visual check | Commit | Issue |
|---|---|---|---|---|---|
| Puzzle | park/js/games1.js | implemented (menu + game) | UNVERIFIED (boot only) | 3ef95af | local canvas capture not readable |
| Dig | park/js/games1.js | implemented (menu + game) | UNVERIFIED (boot only) | 3ef95af | local canvas capture not readable |
| Footprint Match | park/js/games1.js | not started | - | - | - |
| Dino Mixer | park/js/games1.js | not started | - | - | - |
| Memory | park/js/games2.js | not started | - | - | - |
| Size Parade | park/js/games2.js | not started | - | - | - |
| Counting | park/js/games2.js | not started | - | - | - |
| Dot-to-Dot | park/js/games2.js | not started | - | - | - |
| Colouring | park/js/games3.js | not started | - | - | - |
| Dino Cafe | park/js/games3.js | not started | - | - | - |
| Dino Dash | park/js/games3.js | not started | - | - | - |
| Egg Catch | park/js/games3.js | superseded by shell; re-add to menu | UNVERIFIED | - | re-add as menu game 12/12 |

## Coverage ledger — other worlds
| World | Classic location | Phaser state | Notes |
|---|---|---|---|
| Meadow | chapters/meadow | single memory-match (engine-path fixed) | boots clean now; ~20 game types remain |
| Car Studio | chapters/drive | single endless-runner (engine-path fixed) | boots clean now; build + 6 worlds + race remain |
| Adventures | chapters/adventures | single balloon-flight (engine-path fixed) | boots clean now; 21 activities remain |

## Open / next (independent, no browser needed)
1. Resume Park multi-game: add the remaining 10 games (Footprint Match, Dino Mixer, Memory, Size Parade,
   Counting, Dot-to-Dot, Colouring, Dino Cafe, Dino Dash, Egg Catch) as scenes, one bounded commit each,
   synced to `public/dino`. `node --check` + headless boot check per stage; keep visual play-through marked
   UNVERIFIED until a working local screenshot route exists.
2. Then repeat the same pattern for Meadow, Car Studio, Adventures (their remaining games).
Commit per stage; **no push/deploy unless explicitly asked.**
