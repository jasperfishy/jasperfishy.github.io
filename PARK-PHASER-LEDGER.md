# Dinosaur Universe — Phaser coverage and release ledger

**Live target:** [jasperfish.com/dino](https://jasperfish.com/dino/). The repository README says GitHub Pages publishes the prepared repository root from `main`; `CNAME` names `jasperfish.com`.

**Sources:** `public/dino/`. `npm run build:pages` prepares root `dino/`, the site assets and `index.html` for GitHub Pages. The build derives a `du-…` release id from the Dinosaur Universe files and writes it into both service workers and `dino/version.json`.

## Park — 12 Phaser games

All twelve games were played through to completion with real browser mouse or keyboard input on the local build. The games also return cleanly to a single active scene.

| Game | Result |
|---|---|
| Dino Puzzle | Board solved; completion state shown |
| Dig a Dino | All five bones found; dinosaur restored |
| Footprint Match | All five matches completed after fixing drag capture across the canvas |
| Dino Mixer | Head/body puzzle completed through its controls |
| Dino Memory | All three pairs found in three guesses |
| Size Parade | All four sizes placed through canvas-wide mouse drags |
| Snack Time / Counting | Correct berry count completed |
| Dot-to-Dot | All fourteen points connected after fixing tap-area origin and sequence advance |
| Dino Colouring | Palette selection and all six parts completed after fixing tap-area origin |
| Dino Cafe | Four requested foods served |
| Dino Dash | Snow course completed with keyboard jumps |
| Egg Catch | Twelve eggs collected by steering with the mouse |

The menu and gameplay include parallax scenery, sun rays, sparkles, particle bursts, animated transitions, sound effects, progress stars and responsive scaling. The original Park world remains available from the Phaser game.

## Meadow

The Phaser edition has 20 activity types across five themes (100 combinations). Browser checks booted all 100 combinations and verified that each produced a prompt and usable choices. Full rounds were completed for Match, Trace, Maze, Cook, Order and Draw. The original 120-picture studio remains linked and its saved progress/settings keys are preserved.

## Adventures

The Phaser hub contains all 23 original Adventures plus Balloon Flight as a bonus game. All 23 activities were completed in browser checks; Balloon Flight start, flap and return-to-hub controls were exercised. Existing Adventures progress is merged and retained. The original Adventures app remains available.

## Car Studio

The Phaser studio retains the six worlds, 48 cars, paint/sticker choices, car names, garage, races and saved customization. Browser checks covered paint, stickers, naming, driving, pause/home, garage selection and racing. The driving car is shown upright from behind, fixing the sideways-car presentation. The original drive app remains available.

## Published-game update control

Every one of the eleven Dinosaur Universe app pages includes the shared update panel. It checks the service worker served from the current site origin once per day, so the live app checks jasperfish.com for the newest published release. The player can check or install manually; automatic installation is optional and starts off. Progress remains in the existing local browser storage. Layout bounds were checked at phone (390×844), iPad-sized (768×1024) and desktop (1280×800) viewports.

The update release id includes all Dinosaur Universe files, so a game-only publication changes the service-worker version even when the site shell does not change. Both the main app and nested Adventures workers wait for the player's choice, except for a one-time migration from their old `vN` caches so existing installs can load the new updater.

## Validation and release status

### Earlier migration checkpoint

- Earlier prepared release: `du-1d7a3c7d7a268f5a`; it is historical and superseded by the live-verified releases below.
- Safety backups for the rewritten Meadow, Adventures and Car files are under `Documents/Codex/backups/`; the pre-release Park/update/build snapshot is `Documents/Codex/backups/dino-phaser-release-20261103-prebuild/`.

### Latest live verification — 2026-11-03

- `npm run build:pages` completed successfully for `du-58eb19b6b425f48c`: 80 versioned HTML asset URLs and 49 versioned local JavaScript imports.
- `git diff --check` passed. PR #3 (release cache busting) and PR #4 (module import cache busting and compact homepage) are merged; latest merge commit is `82ca88bf0671aa31f4221051bbb5ab6245da2a35`.
- GitHub Pages deployment run `41687136597` completed successfully. The live `/dino/version.json` returns release `du-58eb19b6b425f48c`.
- Local Playwright checks opened the hub from the homepage and showed all four worlds. All 12 Park launch paths displayed their start screens, each with a canvas and return control; Puzzle and Dig were started.
- Meadow showed all 20 activities; a Matching round opened and accepted a correct selection. Adventures showed 23 activities; Great Dino Rescue opened and accepted a path choice.
- Car Studio's Phaser race showed the car upright from behind; steering and pause/resume controls worked. The classic drive race also showed upright cars.
- A stale live browser offered the published update; applying it loaded all four worlds, and a manual update check then reported up to date.
- The compact homepage keeps both app links visible in the desktop first viewport and collapses the FocusDrop-only tour. At 390×844 the page has no horizontal overflow.
- Known unrelated issue: the main homepage still attempts to register `/sw.js`, which returns 404. This was present on the pre-change live page and does not prevent page rendering.

### Next step

Continue the broader user-requested visual and gameplay audit across the remaining activities and screens, and decide separately whether to repair the root homepage service-worker registration.
