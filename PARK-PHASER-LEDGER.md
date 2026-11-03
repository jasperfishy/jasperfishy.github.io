# Dinosaur Universe — Phaser Migration Coverage Ledger

Live site: jasperfish.com/dino (Cloudflare Pages).
Phaser engine: `dino/lib/phaser.min.js` (3.80.1, vendored).
Shared polish kit: `dino/chapters/phaser-kit.js` (DUKit: sparkles, parallax, sound, stars, title/end panels).
Hub FX: `dino/fx/du-fx.js` (DUFX) + `dino/fx/du-dino.js` (dinoSVG/dinoHTML art).

## Stage status
- **Stage 1** (committed `f18db0e`, pushed, live): vendored Phaser 3.80.1; installed 4 polished single-game *-phaser worlds; hub cards open the Phaser editions with "Classic world" buttons back to the full classic chapters; service worker du-v15.
- **Stage 2** (Park multi-game: Phaser shell + animated menu + first game "Dino Puzzle"): code written in working tree; passes `node --check`; local server serves it (HTTP 200).
  - **VISUAL VERIFICATION = BLOCKED / UNVERIFIED.** Two concrete blockers:
    1. The local capture route returns the **live-site** image instead of the local headless-Chrome canvas, so the menu/board/win/restart flow could **not** be visually confirmed.
    2. A `--dump-dom` boot check failed because `Start-Process` was given both `-NoNewWindow` and `-WindowStyle` (mutually exclusive), so no clean console/DOM boot was captured.
  - A clean console/boot would only be a **partial** check; it does **not** prove the Phaser migration or the menu-to-puzzle gameplay.
  - **Stage 2 code is preserved (uncommitted) in the working tree. Do NOT treat it as visually verified. Do not commit it as verified.**

## Coverage ledger — Park (12 classic games)
| Game | Classic location | Phaser state | Visual check | Commit | Issue |
|---|---|---|---|---|---|
| Puzzle | park/js/games1.js | code written (menu + game) | UNVERIFIED (blocked) | none | local canvas capture not readable |
| Dig | park/js/games1.js | not started | - | - | - |
| Footprint Match | park/js/games1.js | not started | - | - | - |
| Dino Mixer | park/js/games1.js | not started | - | - | - |
| Memory | park/js/games2.js | not started | - | - | - |
| Size Parade | park/js/games2.js | not started | - | - | - |
| Counting | park/js/games2.js | not started | - | - | - |
| Dot-to-Dot | park/js/games2.js | not started | - | - | - |
| Colouring | park/js/games3.js | not started | - | - | - |
| Dino Cafe | park/js/games3.js | not started | - | - | - |
| Dino Dash | park/js/games3.js | not started | - | - | - |
| Egg Catch | park/js/games3.js | single "catch" variant live | live (Stage 1) | f18db0e | catch variant only; full Park not yet multi-game |

## Coverage ledger — other worlds
| World | Classic location | Phaser state | Notes |
|---|---|---|---|
| Meadow | chapters/meadow | single memory-match Phaser live (f18db0e) | ~20 game types remain to convert |
| Car Studio | chapters/drive | single endless-runner Phaser live (f18db0e) | build + 6 worlds + race remain |
| Adventures | chapters/adventures | single balloon-flight Phaser live (f18db0e) | 21 activities remain |

## Open / next (independent, no browser needed)
1. **Placement:** confirm the Phaser games live in the repo's **source `public/dino`** tree (user has repeatedly instructed the games belong in the public folder) so a Vite/Cloudflare rebuild won't drop the Stage 1 additions currently only in the committed root `dino/`.
2. Then resume Park multi-game (remaining 11 games) once a working local verification route is available.
Commit per stage; **no push/deploy unless explicitly asked.**
