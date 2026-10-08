# Architecture and maintenance decisions

## Preserve static, local processing

The existing static export and local generation/scanning are retained. A server, account or redirect service would change the privacy model and is outside this maintenance change. A scanned HTTP(S) link requires a separate user action; decoding must never navigate automatically.

## Preserve the approved visual system

This maintenance change does not replace JaneQ's UI, tokens, Thai/English copy or QR rendering. Existing visual/interaction tests remain the regression boundary. Snapshot differences require inspection, not automatic acceptance.

## Patch dependencies within the existing framework line

The October 8, 2026 review updates Next.js and its lint configuration to 16.3.8, Sharp to 0.35.5 and Vitest to 5.0.3. The local `serve` tool keeps its existing version with a targeted Compression 1.8.2 override to address that middleware advisory. Its static-serving behavior is covered by the production browser suite. Compatible transitive lockfile updates address available patched versions.

The affected development chain is removed through an explicitly reviewed Tailwind 4 PostCSS migration that keeps the existing authored CSS/theme tokens, plus a tinyglobby alias scoped to the Next lint plugin's sole globSync consumer. Actual API/options tests and before/after visual checks supplement the existing production browser suite. Both runtime and full dependency audits are blocking; no findings are suppressed. The original Playwright 1.62.1 browser line is retained with a matching explicit core pin for axe's peer types; see the verification note for browser compatibility limits.

## Resolve test aliases as filesystem paths

The test alias used a URL pathname, which preserves `%20` for spaces in a checkout path. `fileURLToPath` produces the actual filesystem path, allowing the existing twenty tests to run from directories whose names contain spaces. This changes test configuration only.

## Keep evidence layers distinct

Local commands, GitHub CI, publication and deployment are separate. This branch changes source/dependencies/documentation/CI only; it does not deploy JaneQ or claim new physical-device coverage. Earlier dated verification notes remain historical records.
