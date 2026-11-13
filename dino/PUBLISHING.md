# Publishing Dinosaur Universe

This folder (`D:/Games/dino-universe`) is the **single master copy** of
Dinosaur Universe. Make every game change here, never in the website repo.
It is one of the games under `D:/Games`; `D:/FlagshipUI` is a separate model
and inference-engine project and must never hold game files.

The live game is <https://jasperfish.com/dino/>, served by GitHub Pages from
the `jasperfishy/jasperfishy.github.io` repo (`main` branch). That repo keeps:

- `public/dino/`: an exact copy of this folder, minus `tests/`, plus its own
  legacy `games/` folder (old links that its root `public/sw.js` still serves).
- `dino/`: the published, release-stamped copy built from `public/dino/`.

## Release steps

1. Commit and push this repo, after `node tests/hub-integration.cjs` passes.
   Three sweeps are cheap and each has caught a real defect, so run them first:
   `node tests/surface-audit.cjs --strict` (a glyph drawn where no layer can
   swap it), `node tests/claim-audit.cjs --strict` (a typed glyph no layer
   claims) and `node tests/dom-text-audit.cjs --strict` (logic deciding from DOM
   text that the object layer has already turned into a photograph; it also
   re-proves the retired defects with `--selftest`).
2. In a clone of `jasperfishy/jasperfishy.github.io` (with `core.autocrlf false`):
   Build from `origin/main` in a fresh worktree
   (`git worktree add -f -B publish-live <path> origin/main`) — the clone's local
   `main` may have no merge base with the remote, so a pull there is not safe.
   - Replace `public/dino/` with this folder, except `tests/`, and keep
     `public/dino/games/`.
   - Convert text files to LF line endings (the website repo stores LF).
3. `npm ci && npm run build:pages`. This stamps every file with a
   `du-<hash>` release and writes `dino/`.
4. The build also rebuilds the landing page. Restore anything outside `dino/`
   and `public/dino/` (`git checkout -- assets fonts index.html src` and
   delete any new `assets/index-*.js`) so a game release does not touch it.
5. Test the built copy:
   `DINO_UNIVERSE_ROOT=<clone>/dino node tests/hub-integration.cjs`
6. Commit both `dino/` and `public/dino/`, then push `main`. Pages deploys in
   about a minute. Check `https://jasperfish.com/dino/version.json` shows the
   new revision.

## Rules the website build depends on

- `sw.js` must keep `const VERSION = "...";` with double quotes, and
  `chapters/adventures/sw.js` must keep `const CACHE_NAME = "...";`, so the
  build can stamp them.
- `update-manager.js` registers the service worker. New releases wait until
  the player applies them (`DU_SKIP_WAITING`), and `version.json` is always
  fetched fresh.
- Load assets with relative URLs, so the build can add `?v=<release>`.
- The scripts in `tests/` launch Chrome with `--mute-audio` so test runs are
  quiet. Muting isn't required, so remove the flag if you want to hear the game.
