# JaneQ contributor instructions

Prefer codebase-memory-mcp graph tools for code discovery when available. Fall back to direct source inspection when the graph is missing or stale.

Before UI work, read `.design/janeq/DESIGN_BRIEF.md`, `.design/janeq/DESIGN_TOKENS.md`, and `docs/ui/MOTION_SYSTEM.md`. Existing utility hierarchy, colors, typography, dark mode and Thai/English layouts are intentional.

CSS in `app/globals.css` is the token authority. Use semantic motion tokens; document purposeful exceptions. No transition: all, animation-delayed actions, animated QR pixels, full scanner-panel fades, layout animation or decorative loops. Honor reduced motion. Preserve scanner privacy, URL safety, duplicate guards and static export.

Use Node >=24 and the lockfile. Run typecheck, lint, Vitest, production build and Playwright before PR. Visual tests use static export and artifact output; inspect differences before changing QR goldens or documentation screenshots. Do not commit `.agents/`, `.impeccable/`, `.ui-evidence/` or test caches.

For sensitive/commercial work, use applicable TCSS commercial-grade/security-gate/production-readiness/database-safety/liveproof guidance. Distinguish implementation, local tests, CI, deployment and live/device proof. No merge/deploy without explicit authorization.
