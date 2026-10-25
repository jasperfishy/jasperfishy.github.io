# Redesign verification — 25 October 2026

- `npm run build:pages` passed; generated root entry references the matching built assets.
- `npm run lint` passed. Generated `assets/` is excluded, as `dist/` already was.
- `git diff --check` passed.
- Browser review: full desktop layout (1440 px), phone layout (390 px), narrow phone (320 px), and tablet width (768 px).
- Capture demo: Enter adds a thought, dismiss removes it, reset restores examples, blank input does not add a card, empty state appears after dismissing all cards.
- Actual FocusDrop iframe loads. Close button and backdrop dismiss; Escape from the parent dialog controls dismisses; focus and document scrolling return to the opener.
- Cross-origin limitation: Escape while focus is inside FocusDrop's own iframe did not dismiss the parent dialog in the embedded test browser. The visible close button remains available. Changing the separate app to send a close message is outside this website redesign.
- FAQ expands with pointer and keyboard. Mobile app window remains within the viewport.
- No thoughts were entered into the real FocusDrop app. Its working tree was not modified.

Preview used port 4187 because an existing, unrelated service worker on port 4173 intercepted requests. No existing browser storage was cleared.
