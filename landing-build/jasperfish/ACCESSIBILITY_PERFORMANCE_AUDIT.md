# Jasperfish accessibility and performance audit

**Date:** 4 November 2026

**Target:** local Vite production preview

**Accessibility standard:** WCAG 2.1 AA, with a project target of 44x44 CSS px for interactive controls

## Outcome

Four observed accessibility defects were repaired: low small-text contrast, undersized controls, a delayed input focus indicator, and unreliable focus containment caused by the cross-origin FocusDrop iframe dialog. The iframe dialog was replaced with a direct external FocusDrop link because a parent document cannot reliably contain or close keyboard focus once it enters a cross-origin frame.

The final browser matrix covered 320x568, 375x812, 430x932, 640x450, 768x1024, 1280x800, 1440x900 and 1920x1080. Every fixture had one visible H1, no horizontal overflow, no unnamed interactive controls, no duplicate IDs, no targets below 44x44 px and no captured console or page errors.

## Accessibility findings

| Finding | WCAG area | Before | Resolution | Final evidence |
| --- | --- | --- | --- | --- |
| Small account-status copy lacked contrast | 1.4.3 Contrast | 4.41:1 | Lightened the shared supporting-copy token | 5.25:1 |
| Navigation, reset and icon controls were undersized | 2.5.5 project target | Multiple controls below 44 px | Added minimum target sizes and prevented mobile flex shrink | Zero undersized controls in all eight fixtures |
| Input focus outline was suppressed during its transition | 2.4.7 Focus visible | Immediate computed outline was `none` | Added a specific 3 px high-contrast `:focus-visible` outline | Solid 3 px outline, keyboard verified |
| Cross-origin iframe dialog could release focus and ignore Escape | 2.1.1 / 2.4.3 / 4.1.2 | Focus left the dialog; Escape was unreliable inside the frame | Replaced the modal launcher with a named direct link using `noopener noreferrer` | Keyboard-accessible external link with predictable navigation |

Semantic checks found one H1, a consistent H1/H2/H3 hierarchy, one main/navigation/footer landmark, labelled form controls, no unnamed links or buttons, no duplicate IDs and decoded 192x192 product images. Empty image alternatives are intentional because adjacent visible product names carry the same information.

## Synthetic performance results

These values are a local cold-cache Chromium measurement, not Lighthouse scores, field Core Web Vitals or production-network results.

| Metric | Result |
| --- | ---: |
| TTFB | 2.2 ms |
| DOMContentLoaded | 24.7 ms |
| Load event | 25.0 ms |
| First Contentful Paint | 88 ms |
| Largest Contentful Paint | 116 ms |
| Cumulative Layout Shift | 0.0000 |
| Total Blocking Time approximation | 0 ms |
| Required page requests | 4 |
| Transferred resource bytes | 114,069 |
| Decoded resource bytes | 330,933 |

The largest required resource is the application JavaScript at 99,415 transferred bytes and 304,961 decoded bytes. Removing the unused modal path reduced the production CSS from 17,667 to 16,822 decoded bytes and JavaScript from 306,363 to 304,961 decoded bytes. The page does not request the Dinosaur game payload until a visitor follows its link.

## Limitations

- Lighthouse and Chrome DevTools trace tools were unavailable, so no Lighthouse score or trace-derived insight is claimed.
- axe-core was not installed, so this audit used browser semantics, DOM assertions, calculated contrast samples and keyboard testing rather than an axe report.
- NVDA, VoiceOver and other manual assistive-technology sessions were not run.
- Localhost timings do not predict real hosting latency or production field data.

Final visual captures: `screenshots/audit-1440x900.png` and `screenshots/audit-375x812.png`.
