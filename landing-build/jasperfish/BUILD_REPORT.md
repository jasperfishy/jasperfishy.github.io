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
- Social preview: a project-owned 1200x630 PNG was rendered from the verified hero, visually reviewed, and wired to Open Graph and Twitter metadata.
- Targeted landing lint: `src/components/AppDashboard.jsx`, `src/main.jsx`, and `vite.config.js` pass ESLint. The repository-wide lint remains blocked by 1,664 existing errors in legacy/generated Dinosaur and bundled files; this pass did not modify or suppress them.
- Source hygiene: `git diff --check` and a final clean production build are required immediately before commit and are recorded separately in the final handoff.

Structured results: `verification/results.json`.

## Accessibility and performance continuation

- A scoped WCAG 2.1 AA and local synthetic performance audit was completed after the initial visual gate.
- Four observed issues were repaired: supporting-copy contrast, 44 px targets, immediate input focus visibility, and the cross-origin iframe dialog's unreliable keyboard containment.
- Eight responsive/zoom fixtures passed the post-fix browser matrix with no overflow, undersized targets, unnamed controls, duplicate IDs or runtime errors.
- Local cold-cache Chromium measured FCP 88 ms, LCP 116 ms, CLS 0 and a 0 ms Total Blocking Time approximation. These are local synthetic measurements, not Lighthouse or production field scores.
- Full findings, evidence and unavailable-tool limitations are recorded in `ACCESSIBILITY_PERFORMANCE_AUDIT.md`.

## Deployment

Not requested and not performed.
