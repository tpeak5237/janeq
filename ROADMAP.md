# Roadmap

JaneQ’s default behavior should remain direct and private. Future work must not quietly turn static codes into redirect codes.

## Possible next slices

- Offline Progressive Web App support with an installable local shell.
- Bulk generation for a list of direct payloads.
- Poster and menu templates that keep the QR payload visible and inspectable.
- Browser share integration where supported.
- Local-only generation history stored in browser storage with a clear reset control.
- Optional self-hosted dynamic QR mode, separated from the static default and documented with its own privacy model.
- Local API or CLI for batch generation without a hosted service.

## Guardrails for future dynamic mode

Dynamic QR behavior must be opt-in, clearly labeled, self-hostable, and impossible to confuse with JaneQ’s default direct static path. No redirect or scan event should be added to the static generator as a convenience feature.
