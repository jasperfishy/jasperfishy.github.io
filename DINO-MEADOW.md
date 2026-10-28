# Dino Meadow

Standalone original dinosaur PWA at https://jasperfish.com/dino/.

Edit public/dino/ and mirror to dino/ for branch-based GitHub Pages publication. Vite includes public/dino/ in dist; scripts/prepare-pages.mjs copies it back to the root on build:pages. The portfolio homepage does not need to change.

100 activities means 20 mechanics with five variations; 120 colouring compositions combine 12 dinosaur silhouettes and 10 scenes. This is independent code and art, not a clone of Dino Fun or a reconstruction of its undocumented game inventory.

Includes tap fill, freehand drawing, undo, automatic IndexedDB saving, gallery, local backup/restore, speech, audio, parent gate, two difficulty presets, favourites and completion stickers. No ads, accounts, analytics or purchases. System speech availability varies. Hosting access logs are outside the app.

All runtime assets must be deployed together. Bump the cache version in sw.js on runtime updates. Worker scope is /dino/. An initial online visit is required for offline use; iPadOS may evict data. Test Airplane Mode and periodically back up artwork. No Apple account or native build is needed.

Verified locally on 28 October 2026: seven data/structure tests; all 100 activity screens open; representative completion for 17 game types with accelerated transition timers; tracing with real pointer input; drawing saved and restored; fill undo; offline reload and colouring; no horizontal overflow at widths 390/768/1024. Actual iPad/Safari hardware validation remains outstanding.

Full research, development master, screenshots and test scripts: D:/DinoMeadow. No source-app IPA was provided and no binary REA analysis was performed. Research identified the public App Store entry (549750492, Avocado Mobile Inc) and its advertised subset of activities.
