# Motion QA — local evidence

Baseline: clean main 485900b4, Node24.18.0, macOS, Chromium supplied by Playwright1.62.1. Static export served at 127.0.0.1:3000. Baseline typecheck/lint, 20 unit tests and production build passed before UI changes. No PASS is inferred from the earlier planning checkout's interrupted test process.

## Coverage

- 16 visual combinations: desktop1280×900/mobile375×812 × EN/TH × light/dark system preference × normal/reduced motion. Each captures create, scanner-empty and scanner-unsafe after fonts/QR readiness with animations disabled. QR golden assertions cover stable rendered pixels; full-page artifacts support manual visual review.
- Computed token/easing checks, immediate active1px and reduced-motion0px; disclosure via Enter, selected control via Space and real Tab focus.
- Rapid generator edits, invalid input clears stale QR and disables export, recovery; QR full-opacity/no animation; copy success/failure and stable export notice layout.
- PNG download decoded through the real image decoder to the original value; SVG download verified. Existing URL/Wi-Fi/PromptPay generation tests retained.
- Real safe/unsafe image decoding, no-result image, permission denial, safe link explicit-action boundary. Native camera/BarcodeDetector double drives duplicate callbacks only; real uploaded-image decoding remains in the suite. Duplicate/theme/language changes do not replay acknowledgment; reset remains immediate.
- Mobile empty/safe/unsafe/reset panel geometry. Mobile touch actions, 320px Thai/long-payload checks and initial system-theme preference checks supplement the matrix. Enlargement doubles root rem geometry and explicitly doubles px-sized payload/warning/notice/action text, asserting 24px warnings, 22px actions, long synthetic notice expansion and no clipping. This is text-resize emulation, not physical-device or actual browser-zoom certification.
- Eight axe test cases (16 state scans): Create and unsafe Scan in EN/TH × light/dark across both viewport projects under reduced motion, WCAG2 A/AA,2.1AA,2.2AA tags. No automated scan substitutes for assistive-technology testing.

## Results

`npm run validate` passed: typecheck, ESLint, Vitest20/20 and production static build. Focused interaction/motion/axe run passed30/30 before supplementary touch/enlargement cases. Initial visual golden establishment passed16/16 after reviewing baseline/after renders and actual QR images. Final `npm run test:e2e` without snapshot updates passed75 tests, skipped1 desktop-only touch case (76 discovered, 1.2m). This includes16 visual cases and8 axe cases/16 state scans. Final typecheck/lint were rerun after supplementary test edits and passed. The PR records the pushed commit identity.

Before implementation the new motion regression checks failed on main for legacy160ms control transitions, full result-panel animation, collapsed mobile result height and notice-induced layout shift. These behaviors turned green after the CSS/markup changes. Initial helper issues (missing navigation, viewport-scroll-sensitive coordinates, unordered rel tokens and scanner/generator copy-label mismatch) were corrected and are not classified as product regressions.

Independent rendered after review checked focus, mobile/desktop overflow, static unsafe text/actions and actual reduced-motion computed behavior. Reviewed 48 after screenshots as a contact sheet plus representative full-size images. Normal/reduced pairs were identical for scanner empty/unsafe captures; one create pair differed only in the transient customization scrollbar strip, not QR pixels or content geometry.

Local logs/captures/traces live under ignored `.ui-evidence/`; the browser report contains attached artifacts under `playwright-report/` and `test-results/`. CI uploads these even on failure. No tracked `docs/screenshots` were replaced.

## Evidence limits and follow-up

Implementation and local tests are verified here. CI must be read from the PR checks for the exact pushed commit. No merge/deployment occurred; no deployed identity, field INP, physical camera capture, iOS audio autoplay, vibration or device-success evidence is claimed. Harness timings are automation wall time, not a benchmark.

Pre-existing limitations retained: tablists use native keyboard tab order without arrow/roving/tabpanel behavior; system theme initializes from OS preference when no override is stored, but does not subscribe to a live OS change after mounting. Root-size emulation does not guarantee all browser zoom/assistive-technology combinations. Nine dependency advisories remain for a separate security/toolchain review.
