# Maintenance verification · October 8, 2026

This scoped maintenance branch starts from public commit `a8da219462dca75d8f1ca1e1e225dae76d7f8c29` and preserves its history. No deployment or physical-device outcome is claimed.

## Environment and dependency boundary

Local verification uses macOS ARM64, Node 24.18.0 and npm 11.16.0. The retained Playwright 1.62.1/core 1.62.1 line uses Chromium 151.0.7922.34. CI installs its Linux browser separately and must establish that platform's result.

A clean install and full/runtime dependency audit are required. See [dependency review](DEPENDENCY_REVIEW.md) for the original advisory chains, patched dependencies, reviewed Tailwind 4 migration and Next lint alias. Both audits block CI; no findings are suppressed.

## Observed final checks

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 24 passed, including four new Next-consumer checks |
| `npm run build` | Passed; static export generated |
| `npm run test:e2e` | 75 passed, 1 existing skip, 54.3 seconds |
| Full `npm audit --audit-level=high` | 0 vulnerabilities |
| Runtime `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `git diff --check` | Passed |

The single browser skip is the desktop project of a touch-context test that runs in the mobile project. No test assertion, timeout or golden was relaxed to obtain these results.

## Compatibility checks

`tests/lint-root-dirs.test.ts` calls the actual Next lint plugin root-discovery function. It verifies the unconfigured root, directory-only glob expansion, array roots and normalized backslashes in paths containing spaces. Discovered paths are compared as effective resolved filesystem locations; no full fast-glob equivalence is asserted. A real Next `no-html-link-for-pages` rule check proves a prohibited link under a discovered pages directory is still reported.

The original 20 helper tests remain unchanged. The Vitest filesystem alias is corrected with `fileURLToPath`, so paths containing spaces no longer become encoded `%20` paths.

## Render evidence

The comparison captures the generator with synthetic `https://example.com/fixture` data and the scanner's empty state in English/Thai, light/dark, and 1280/375-pixel widths: 16 full-page captures. The authored CSS/token authority, semantic Tailwind config, copy, QR output and layout are retained; no existing golden is regenerated.

Final captures use the retained Chromium 151 line on both sides. Fourteen of sixteen are byte-identical. The 375-pixel English/light generator differs at 34 edge pixels, and Thai/dark generator at 87 edge pixels; maximum RGB-channel difference is 2/255. Their dimensions are unchanged (375×1653 and 375×1643), and the inspected differences are antialiasing at rounded edges rather than content, layout or QR changes. All scanner states and desktop captures are byte-identical. Temporary local evidence is kept outside the Git tree; no screenshot golden was changed.

## Evidence limits

Browser tests include real local QR image decoding, production static serving, permission-denied behavior, keyboard/focus, responsive layout, accessibility and motion. Camera behavior involving synthetic browser streams is not physical-camera evidence. No hosted deployment, live payment, identity, destination safety or production security claim follows from these checks.

An exploratory Playwright 1.64/Chromium 156 parallel run had image-decoder assertion timeouts; isolated safe/export/unsafe payloads decoded successfully on both Chromium 151 and 156. The cause of that exploratory run is not established. The final change retains the existing 1.62.1 browser line and pins its core explicitly rather than widening browser/tool scope. Keep a future browser upgrade separate and rerun the full suite.

Nonfatal tooling notices remain for Vitest's future native config loader, Tailwind's TypeScript module detection and npm install-script review. The project module mode is not changed merely to hide notices.
