# Design tokens: JaneQ

The token system is derived from the “public instrument panel” direction: cool paper, ink navy, signal coral, and a small lime indicator. The palette avoids a generic SaaS blue while keeping the QR itself neutral and high contrast by default.

The source of truth is [`app/globals.css`](../../app/globals.css). Tailwind maps the same semantic colors through [`tailwind.config.ts`](../../tailwind.config.ts).

## Core tokens

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#fbfcfa` | `#11181e` | page and primary surfaces |
| Fog | `#f0f3f2` | `#192127` | secondary surfaces and inputs |
| Ink | `#101922` | `#f3f5f1` | primary text and controls |
| Muted | `#606d74` | `#acb7ba` | supporting text |
| Coral | `#e9674f` | `#ff8f73` | primary action and signal |
| Lime | `#d7ee73` | `#d7ee73` | trust indicators and focus support |
| Success | `#2c8059` | `#7ddaa6` | reliable state |
| Warning | `#9a5a14` | `#f6c46e` | scan-risk state |

## Rhythm and type

- Base spacing: 4px, expanding through 8/12/16/24/32/48/64/96/128.
- Display: condensed system sans, bold and tight for the wordmark and utility headings; Thai mode uses bundled Noto Sans Thai with normal tracking and no faux italic.
- Body: system sans in English; Noto Sans Thai for Thai and mixed Thai/Latin UI, 16px browser/Tailwind default; Thai body line height 1.65, utility controls and metadata use their scoped CSS sizes.
- Technical: system monospace for payloads, filenames, and state labels.
- Corner language: radius tokens 8/12/16px; components consume their scoped radius, with full pills for status.

## Motion

Executable source of truth: `:root` in `app/globals.css`; recipes and exceptions live in [`MOTION_SYSTEM.md`](../../docs/ui/MOTION_SYSTEM.md).

- `--motion-fast`: 140ms; `--motion-normal`: 240ms; `--motion-slow`: 420ms.
- `--ease-standard`: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Fast applies to hover/release, disclosure chevrons, theme colors and small success indicators. Normal/slow are reserved, not used for routine operations.
- Press displacement is 1px with instant execution; selection/focus/validation are immediate. QR pixels and scanner payload/warnings/actions are never animated.
- Reduced motion disables transitions, keyframes, tactile displacement and smooth scrolling while preserving text feedback.
- Generator/scanner feedback notices reserve two lines. Mobile scanner empty/results share a 28rem minimum; payload viewport is 6lh, warning slot 3lh. Text can expand at zoom/long content.

## Accessible signal text

The coral fill remains `#e9674f` / `#ff8f73`. Small coral text uses `--color-coral-text` (`#b43f2c` light / `#ff8f73` dark); coral buttons use `--color-action-ink` (`#101922`) in both themes. These narrow contrast repairs follow axe evidence, without changing layout or the signal color.
