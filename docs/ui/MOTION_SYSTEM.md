# JaneQ motion system

`app/globals.css` is the executable source of truth. Read this before changing UI. JaneQ remains a direct utility with Create/Scan modes, local payload processing and static export.

| Token | Value | Use |
| --- | --- | --- |
| `--motion-fast` | 140ms | Controls, chevrons, small acknowledgment indicators |
| `--motion-normal` | 240ms | Reserved; use only when a real transition requires it |
| `--motion-slow` | 420ms | Reserved; no routine-work use |
| `--ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Shared easing |

Enabled controls press down 1px immediately (zero-duration active transition), then return using fast easing. Disabled controls do not move. Focus rings and mode/type/segmented selected colors appear immediately. Theme colors use fast transitions; language text changes immediately. Disclosures reveal content immediately and rotate only their chevrons.

Generation, cancellation, current-artifact keys and export guards do not depend on animation. QR pixels replace immediately; do not fade, scale, remount or animate the QR image. Only the small ready indicator fades over 140ms when a new current artifact becomes ready. Main shows only an artifact matching current input; no stale QR is retained while calculating.

Scanner payload, warning and buttons have no animated ancestor. Only the small result indicator acknowledges accepted results with opacity and at most 1px movement over 140ms. It mounts once per accepted result. Duplicate callbacks, copying, language and theme changes do not replay it; Scan another resets immediately. Keep pipeline/cooldown/stop/start/sound/vibration contracts unchanged.

On mobile the empty/result panel shares a 28rem minimum. Payload viewport is 6lh with scrolling; warning slot reserves 3lh and copy notice 2lh. Generator notice reserves 2lh too. These are minimum reservations, not clipped fixed-height text boxes. Long warnings/notices can expand, including at enlarged text sizes. Keep unsafe content as plain text. Offer Open link only for http/https, on explicit click with `noopener noreferrer`.

Reduced motion disables keyframes, transitions, tactile transforms and smooth scrolling outright. Text, status, warnings and actions remain available. Do not use near-zero-duration animations as the reduced-motion substitute.

Do not introduce animation delays, transition-all, layout animation, decorative loops or runtime motion libraries. Color additions for axe contrast preserve coral fills: coral text is #b43f2c in light / #ff8f73 in dark; primary action labels use invariant #101922 ink.
