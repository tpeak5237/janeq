# UI and motion audit — 2026-10-04

Scope: independent CSS-first polish branch from `origin/main` 485900b480272cbfaea636c63cf1687ee6c4d10b. Main uses Next 16.3.5, React 18.3.1, Vitest 5.0.1 and Node >=24. PRs #9/#10 are outside this branch. Original checkout's `.serena/` and `app/globals 2.css` were preserved untouched.

Independent visual assessment A preceded detector assessment B. A found the existing utility hierarchy coherent (31/40 heuristic score); its score is reviewer judgment, not user research. No redesign/hero motion was warranted. B inspected separate production browser tabs and raw detector findings. Local baseline and after each contain 48 screenshots and 16 traces covering desktop/mobile × EN/TH × system light/dark preference × normal/reduced motion. Full-page contact-sheet and representative detailed reviews retained the utility hierarchy, crisp QR, warning/action visibility and expected mobile reservation changes.

| Finding | Change / decision |
| --- | --- |
| Raw 160/180/220ms recipes drifted from design docs | Canonical 140/240/420ms CSS tokens and easing; design brief/tokens/tasks reconciled |
| Entire scanner result faded/transformed, including unsafe warning | Move acknowledgment to small indicator; payload/actions/warning remain immediate |
| Empty mobile result panel collapsed to ~53px | Shared 28rem minimum with 6lh payload, 3lh warning and 2lh notice slots |
| Conditional copy/export notice shifted controls | Always render reserved notice slots; long text expands |
| Reduced motion still ran 0.01ms animations | Disable animation/transition/movement/smooth-scroll |
| Actual axe contrast failures on coral text/white coral actions | Separate accessible coral text and invariant ink action labels; preserve coral fills |
| Detector `side-tab` in PromptPay summary | Intentional contextual payment emphasis; retained, unchanged before/after |
| Existing tablist semantics lack arrow navigation/roving focus/tabpanel mapping | Follow-up outside motion scope; native Tab/Enter/Space coverage remains explicit |

Impeccable source detector ran once before and once after on globals/studio/scanner. Both returned exit 2 with exactly one `side-tab` warning (same PromptPay rule, lines 669→677). No new source finding. Baseline live overlay heuristics flagged small metadata/contrast and style-intent warnings; actual contrast was adjudicated with axe. A second injected overlay scanned itself and was excluded. No user-visible overlay claim is made. Independent after browser review confirmed tokens, focus, zero QR animation, 448px mobile reservation, safe/unsafe actions and reduced motion using real uploaded-image decoding.

Production changes are limited to CSS and two feedback-markup adjustments. Generator keys/cancellation/export guards, public APIs/types and scanner pipeline/lifecycle/cooldown/audio/vibration are unchanged. Tooling adds dev-only axe, production-static Playwright checks, portable QR screenshot assertions and failure artifacts. No Motion/GSAP/Rive/Storybook/hosted visual service or application backend was added.

| Aggregate production asset bytes | Main raw | After raw | Raw delta | Main gzip | After gzip | Gzip delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| JS (16 files) | 810824 | 810964 | +140 | 249428 | 249468 | +40 |
| CSS (1 file) | 37440 | 38867 | +1427 | 8030 | 8242 | +212 |

Same Node 24.18.0/macOS build environment and `scripts/ui-bundle.mjs` gzip settings. Totals aggregate exported static chunks; not route-transfer or runtime-memory claims. Harness fill→preview wall times: baseline median44ms (35–89), after53.5ms (50–105). Browser load was not controlled enough for performance conclusions; timings include Playwright overhead. No latency improvement, field INP or physical-device success is claimed.

See [QA](MOTION_QA.md) for commands/results and [toolchain](UI_TOOLCHAIN.md) for reproducibility. Implementation/local tests are evidence layers; CI status belongs to the PR. Deployment and physical camera/audio/vibration validation were not performed. Existing dependency advisories and tablist/system-theme behavior are follow-up risks, not closed by this polish.
