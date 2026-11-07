# Jasperfish design

The homepage introduces small apps, with FocusDrop as the current featured project. It should feel spacious and calm, explain capture and resurfacing, and preserve the app-window launch and install route.

- Palette: midnight water #0c1729, slate panel #132139, mist text #edf3ff, muted blue #a6b5cd, periwinkle #b5cdff, peach #e9bea7.
- Type: self-hosted Manrope regular, semibold and extra bold. No third-party font request at runtime.
- Layout: left-aligned large type opposite a custom droplet and ripple illustration; a split product story and disposable capture demo; benefits, maker statement, practical FAQ.
- Principles: connect the water identity to FocusDrop's capture metaphor. Replace generic statistics and technology badges with real product information. Do not claim unverified reminder support.

Review: refined the generic gallery idea into one focused product story. The demo is visibly labelled and never writes to storage or the real app. Reduced motion is respected.

Scope: website repository only. FocusDrop's separate repository and local changes are preserved. Publishing the root build to main updates GitHub Pages; deployment is a separate step.

## Homepage film

Footage courtesy of NOAA Ocean Exploration, 2016 Deepwater Exploration of the Marianas. [Original dive footage](https://oceanexplorer.noaa.gov/multimedia/video-playlist-best-jellyfish/). The homepage uses a silent, reframed excerpt with a short dissolve across the loop. Mobile devices receive a smaller encode.

## Premium layer (2026-11-07)

`src/premium.css` sits on top of `index.css` and `tidal.css` and keeps the tidal palette.

- A glass header that stays at the top on scroll, a scroll cue and the NOAA film credit in the hero, and sections that ease in on scroll (skipped with reduced motion or without JavaScript).
- App cards with artwork (a FocusDrop drop with floating thoughts, and a real Dinosaur Universe screenshot), quick facts, and a hover lift.
- A Dinosaur Universe showcase after FocusDrop: the home screen in a tablet frame, the four worlds with real in-game screenshots (`src/assets/dino-*.jpg`, captured from the game), and three notes for grown-ups. Every claim is checked against the game: free, no ads, no accounts, nothing to buy, works offline, a parents panel.
- The game and the landing page use generic Mummy and Daddy; no family names appear anywhere. Screenshots are taken with no player name set.
- A fuller footer with app links and the film credit.
