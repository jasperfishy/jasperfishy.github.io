# Jasperfish cinematic landing build

Status: local implementation complete; deployment not requested.

## Source and direction

- Source: `https://jasperfish.com/`, captured 4 November 2026.
- Existing project and product marks are reused; no third-party or generated imagery was added.
- Direction: deep-space product constellation, restrained GSAP motion, established navy/blue/mint palette.
- Supported products: FocusDrop and Dinosaur Universe. Existing catalogue data remains canonical.

## Preflight

- Existing React/Vite project selected explicitly.
- Node `v26.11.1`, npm `11.19.0`.
- GSAP was absent and added as an application dependency.
- Sharp and Wrangler were not installed and are not required for this local-only pass.
- The deployed homepage attempted to register `/sw.js`, which returned 404. Root-level Dinosaur PWA markup was removed; the Dinosaur app retains its own manifest and service worker.

## Verification

- Production build: passed with Vite 8.3.3 (21 modules transformed).
- Responsive gate: passed at 320x568, 375x812, 430x932, 768x1024, 1280x800, 1440x900 and 1920x1080.
- Every viewport had one visible H1, main/navigation/footer landmarks, a visible primary CTA, valid internal anchors, no horizontal overflow and no browser console or page errors.
- Reduced motion: passed. Hero content remains fully visible; orbital and product-card transforms are disabled.
- Interactions: primary CTA resolves to `#app-catalogue`; the FocusDrop demo accepts and clears an entry while announcing status; FAQ disclosure opens.
- Keyboard: the first in-document Tab target is the visible `Skip to content` link with a browser focus outline.
- Visual review: desktop and mobile full-page captures were inspected after repairing below-fold component sizing. Final captures are in `screenshots/`.
- Source hygiene: `git diff --check` and a final clean production build are required immediately before commit and are recorded separately in the final handoff.

Structured results: `verification/results.json`.

## Deployment

Not requested and not performed.
