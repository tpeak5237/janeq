# Design tokens: JaneQ

The token system is derived from the “public instrument panel” direction: cool paper, ink navy, signal coral, and a small lime indicator. The palette avoids a generic SaaS blue while keeping the QR itself neutral and high contrast by default.

The source of truth is [`app/globals.css`](../../app/globals.css). Tailwind maps the same semantic colors through [`tailwind.config.ts`](../../tailwind.config.ts).

## Core tokens

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#fbfcfa` | `#111920` | page and primary surfaces |
| Fog | `#eef2f3` | `#18232b` | secondary surfaces and inputs |
| Ink | `#101922` | `#f3f5f1` | primary text and controls |
| Muted | `#64727b` | `#aeb9bc` | supporting text |
| Coral | `#e9674f` | `#ff8f73` | primary action and signal |
| Lime | `#d7ee73` | `#d7ee73` | trust indicators and focus support |
| Success | `#2c8059` | `#7ddaa6` | reliable state |
| Warning | `#9a5a14` | `#f6c46e` | scan-risk state |

## Rhythm and type

- Base spacing: 4px, expanding through 8/12/16/24/32/48/64/96/128.
- Display: condensed system sans, bold and tight for the wordmark and hero; Thai mode uses bundled Noto Sans Thai with normal tracking and no faux italic.
- Body: system sans in English; Noto Sans Thai for Thai and mixed Thai/Latin UI, 16px default with 1.6–1.7 line height.
- Technical: system monospace for payloads, filenames, and state labels.
- Corner language: 10px for fields, 18px for the workspace shell, full pills only for status.

## Motion

- Fast: 140ms; normal: 240ms; slow: 420ms.
- Default easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Only three motion moments: hero signal draw, mark settling, and preview refresh. All are removed under `prefers-reduced-motion`.
