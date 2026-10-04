# Build tasks: JaneQ

Generated from: `.design/janeq/DESIGN_BRIEF.md`
Date: 2026-08-03

## Foundation

- [x] **Tokenized shell**: Establish the JaneQ typography, cool-paper/ink palette, dark mode, spacing, responsive container, and signature mark. _Creates `app/globals.css`, `tailwind.config.ts`, and shared mark/icon components._
- [x] **Static deployment spine**: Configure strict TypeScript, Next static export, lint, Vitest, Playwright, and CI. _Creates project configuration; no existing components to reuse._

## Core UI

- [x] **Utility toolbar**: Preserve the compact Create/Scan toolbar and direct utility workflow. _Creates `app/page.tsx` and shared icon primitives._
- [x] **Direct payload engine**: Add reusable QR types, validation, URL normalization, Wi-Fi escaping, QR matrix rendering, SVG/PNG generation, and local logo processing. _Creates `lib/qr.ts`._
- [x] **Generator workspace**: Build type selection, fields, customization controls, live preview, validation status, and export actions. _Creates `components/qr-studio.tsx`; depends on Direct payload engine._

## Interactions and states

- [x] **Trust and failure states**: Add empty, invalid, generating, reliability warning, copied, unsupported clipboard, and print states with screen-reader announcements. _Modifies the generator workspace._
- [x] **Utility guidance**: Keep privacy/ownership and static-code limitation guidance within the working utility. _Modifies `app/page.tsx`._

## Responsive and polish

- [x] **Responsive instrument layout**: Tune desktop two-column workspace, mobile stacking, touch targets, focus rings, dark mode, reduced motion, and no-horizontal-scroll behavior. _Modifies `app/globals.css` and generator markup._
- [x] **Accessibility pass**: Verify semantic headings, labels, keyboard navigation, contrast, live validation, and meaningful alternatives. _Modifies shared UI as needed._
- [x] **Metadata and assets**: Add title, description, Open Graph/Twitter metadata, canonical, JSON-LD, robots, sitemap, manifest, icon, OG art, README, security notes, checklist, roadmap, and screenshots. _Creates metadata/assets/docs._

## Review

- [x] **Design review**: Capture desktop/mobile artifacts and review the build against the current utility brief. _Produces Playwright artifacts without replacing historical docs screenshots._

## Utility motion follow-up (2026-10-04)

- [x] Centralize 140/240/420ms durations and shared easing in executable CSS.
- [x] Replace full scanner-panel entrance with a small indicator; reserve result/notice space.
- [x] Disable all motion under reduced motion without delaying actions.
- [x] Reconcile utility-first layout and current-artifact behavior in design documents.
- [x] Motion, accessibility and visual verification: see docs/ui/MOTION_QA.md for actual results.
