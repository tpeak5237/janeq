# Contributing to JaneQ

Use Node.js 24+ and the committed npm lockfile. Install with `npm ci`; no environment file, account, or service credentials are needed for local work.

Before changing UI, read [AGENTS.md](AGENTS.md), the [.design/janeq](.design/janeq/DESIGN_BRIEF.md) brief/tokens, and [motion contracts](docs/ui/MOTION_SYSTEM.md). Keep the established Thai/English, dark-mode and responsive utility design.

## Verify a change

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev --audit-level=high
npm audit
```

Build before browser testing: Playwright serves the production static export in `out/`. Inspect visual failures before considering snapshot updates; do not regenerate QR goldens to conceal a regression. Browser/permission stubs are not proof of physical camera behavior.

CI enforces both runtime and full dependency audits. See [dependency review](docs/DEPENDENCY_REVIEW.md) for the reviewed Tailwind migration and narrowly scoped Next lint dependency alias. Changes to that alias must preserve the actual directory-discovery API tests. A dated zero-advisory count does not guarantee future safety.

## Privacy and review

Use synthetic QR contents, logos and images in fixtures or screenshots. Never attach real Wi-Fi passwords, contact details, account/payment identifiers, scanned images or camera frames to an issue or pull request. Preserve local processing, safe URL actions, delayed permission requests, track cleanup and static export. Do not add telemetry, cloud uploads or a dynamic redirect service without a separate reviewed design.

Describe the concrete behavior, checks actually run and remaining limits in the pull request. Keep changes scoped and preserve unrelated work. Do not commit local evidence directories, browser reports, caches, credentials, or generated `out/` and `.next/` output. Maintainers handle merge and deployment separately.
