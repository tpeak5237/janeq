# Agent toolchain

Impeccable is project-scoped agent-only tooling. It is ignored via `.agents/` and `.impeccable/`; neither its source nor caches are shipped. Official guide: https://github.com/pbakaus/impeccable/blob/main/README.md.

```sh
npx --yes impeccable@4.1.0 install -y --providers=codex --scope=project --no-hooks
.agents/skills/impeccable/scripts/impeccable detect --json app/globals.css components/qr-studio.tsx components/qr-scanner.tsx
```

Observed installed skill version 4.5.0, engine 0.1.11. Install uses no hooks; scans are explicit commands and do not require a hook approval workflow. Audit → independent critique → animate → harden → polish references were read/applied within the existing utility design. Treat detector/style warnings as candidates requiring product intent and rendered evidence; do not rewrite established styling solely to obtain detector zero.

`@axe-core/playwright` 4.13.0 is the only added npm dependency and is dev-only. Runtime dependencies remain unchanged. Playwright/QR scanner/QR generation libraries are existing dependencies. Use Node >=24, `npm ci`, and the Chromium browser matching installed Playwright.

```sh
npm run validate
npx playwright install --with-deps chromium
npm run test:e2e
# For separate before/after evidence, run the production static server:
npm run start -- --listen tcp://127.0.0.1:3000
node scripts/ui-evidence.mjs after
node scripts/ui-bundle.mjs > .ui-evidence/after-bundle.json
```

Build before browser tests. Playwright's webServer serves `out`; comparisons never use the development server. Local runs may reuse the static listener, so ensure it serves the current build. CI starts its own server, uses two workers, uploads reports/screenshots/traces (including failures) for seven days. No deploy/merge job was added.

`test-results/` and `playwright-report/` are generated artifacts. Full-page create/empty/unsafe screenshots use `testInfo.outputPath`, attach to reports and never overwrite `docs/screenshots`. Portable QR-only golden PNGs are tracked under `tests/e2e/visual.spec.ts-snapshots`. Review actual baseline/diff before deliberately updating them. Full UI evidence is reviewed manually rather than pretending QR crops assert every visual element. Capture disables animations and awaits fonts/current QR.

`.ui-evidence/` is ignored local audit material (synthetic payload screenshots, timing/traces, bundle JSON, detector JSON and logs). It is not persistent product storage. Do not capture real credentials/payments/personal scanned payloads in test traces. Baseline evidence was captured from clean main before changes with the same script/environment as after.

`npm ci` reported nine existing dependency advisories (eight high, one critical). No broad dependency upgrade or npm-audit-fix was included; this is not a clean security audit or production-readiness certification.
