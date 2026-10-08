# Dependency review · October 8, 2026

This review concerns the existing public JaneQ repository. It does not deploy a site or establish that every dependency is free of future advisories.

## Baseline and scoped fixes

The initial full `npm audit` reported **15 findings: 1 critical, 12 high and 2 moderate**. The reviewed lockfile now reports **0 vulnerabilities** in both the full tree and `--omit=dev` runtime audit. These dated local results must be rechecked as advisory data changes.

- Next.js and `eslint-config-next`: 16.3.5 → 16.3.8, retaining the existing framework line and static export; this addresses the affected Next.js releases.
- Next's Sharp override: 0.35.4 → 0.35.5, addressing the bundled librsvg advisory.
- Vitest: 5.0.1 → 5.0.3; compatible transitive lockfile updates resolve patched brace-expansion/source-map releases.
- The existing `serve` development tool uses targeted Compression 1.8.2 within the same middleware major version. Production browser tests exercise its static-serving role.
- Playwright remains 1.62.1. An explicit matching `playwright-core` pin prevents the axe adapter peer from resolving a different core version after a clean lockfile refresh.

## Remove the affected development glob chain

The remaining chains after framework patches were Tailwind → chokidar/micromatch → braces, and Next lint plugin → fast-glob → micromatch → braces ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); Tailwind's postcss-nested → postcss-selector-parser also remained affected ([GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), fixed in parser 7.1.6). The registry's current `braces` release remains 3.0.3 and affected. Blind audit fixes suggested a Next lint-config downgrade and a Tailwind major update. The maintenance change instead explicitly reviews each actual consumer:

1. **Tailwind 4.3.3 + its PostCSS adapter** replace Tailwind 3's affected watch/glob/PostCSS chain. `app/globals.css` remains the authored token/style authority, and the existing semantic theme configuration is loaded with `@config`. No component, QR algorithm or camera behavior is replaced.
2. **Next lint root discovery** uses only `globSync(pattern, { onlyDirectories: true })` from its pinned `fast-glob`. A package alias scoped exclusively to `@next/eslint-plugin-next` supplies `tinyglobby` 0.2.17, which provides that interface without the braces chain. This is not a claim of full fast-glob API equivalence. `tests/lint-root-dirs.test.ts` invokes Next's actual consumer and verifies default roots, directory-only expansion, array roots and backslash normalization in paths containing spaces. The rule enforcement test also verifies that a prohibited HTML link under a discovered pages root is still reported. Recheck this consumer whenever updating the Next lint plugin.

These changes receive unit, lint, build and production-browser checks plus EN/TH, light/dark and desktop/mobile screenshot comparison. See [maintenance verification](MAINTENANCE_VERIFICATION.md) for observed results rather than assuming audit output proves compatibility.

## CI policy and limits

Both runtime and full audit checks are blocking. No advisories are allowlisted and no audit step uses `continue-on-error`. Typecheck, lint, units, build and production-browser checks also remain blocking.

Development dependencies can affect a maintainer or CI job. Keep development servers local, review untrusted source/config/glob inputs, and re-run audits during releases. A zero advisory count is one dependency check; it does not prove application security, deployment identity or physical-device behavior.
