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

- `npm run build:pages` completed successfully after correcting the Pages preparation script's `src/data/apps.json` path.
- Prepared Pages release: `du-1d7a3c7d7a268f5a`. The generated root copy matches all source files; only its two versioned service workers and `version.json` intentionally differ.
- `git diff --check` completed without whitespace errors.
- Browser gameplay checks were performed against the local source server; live deployment checks are still required after pushing this release to `main`.
- Safety backups for the rewritten Meadow, Adventures and Car files are under `Documents/Codex/backups/`; the pre-release Park/update/build snapshot is `Documents/Codex/backups/dino-phaser-release-20261103-prebuild/`.

The user explicitly authorized committing and publishing the prepared game changes. Remaining work: commit the finished source and Pages output, push/merge to `main`, then verify the deployed release and update panel at jasperfish.com.
