# Information architecture: JaneQ

## Sitemap

```text
JaneQ /
├── Header
│   ├── JaneQ home link
│   ├── Why JaneQ anchor
│   ├── theerapat.org external link
│   ├── GitHub external link
│   └── Theme toggle
├── Hero
│   ├── Product promise
│   ├── Trust indicators
│   └── Create a QR code anchor
├── Generator workspace
│   ├── QR type selector
│   ├── Content fields
│   ├── Customization controls
│   ├── Validation and reliability notes
│   ├── Live QR preview
│   ├── Export actions
│   └── Static-code limitation note
├── Why JaneQ
│   ├── Social critique
│   └── Direct-code approach
├── Privacy and ownership
│   ├── Browser-only generation
│   ├── No storage / no redirects
│   └── Downloaded-file independence
├── Acceptable use
└── Footer
    ├── Open-source link
    └── theerapat.org link
```

## Navigation model

- **Global:** the compact header remains the only global navigation. It exposes the home link, the “Why JaneQ” explanation, external attribution, and theme utility.
- **Local:** the generator’s type selector is the task navigation. It stays in the workspace and changes only the content fields; it never changes the URL or loses unrelated customization.
- **Contextual:** validation messages sit beside the input or preview they describe. The privacy note sits next to Wi-Fi fields because that is when credentials are top-of-mind.
- **Utility:** export controls are grouped below the preview, ordered by common use: PNG, SVG, copy image, copy content, print.

## User flows

### Create a direct URL QR code

```text
Hero CTA → Generator → Choose Website → Enter URL →
Review normalized direct payload → Check preview/status → Download PNG/SVG
```

### Create a Wi-Fi QR code

```text
Generator → Choose Wi-Fi → Enter SSID/password/security →
Review local-generation note → Preview → Download or copy
```

### Recover from a reliability warning

```text
Preview warning → Read plain-language reason →
Adjust color/margin/size/logo → Status returns to reliable or acceptable
```

## Content model

| Entity | Attributes | Relationships |
| --- | --- | --- |
| QR request | type, fields, direct payload | rendered as one QR artifact |
| QR customization | colors, transparency, correction, margin, size, shape, logo | applied to a QR artifact |
| QR artifact | matrix, SVG, PNG, filename | generated locally from the request |
| Reliability message | kind, severity, action | attached to current customization or payload |

## State inventory

- Empty preview: no valid payload yet; explains where to start.
- Valid payload: live preview and direct payload summary.
- Invalid payload: inline error plus no downloadable artifact.
- Generating: preview keeps its last stable state while the new matrix is computed.
- Export unsupported: copy-image control is disabled with an explanatory tooltip/label.
- Reliability warning: export remains available, but the warning is visible and actionable.
- Dark mode: manual toggle persists locally; system preference is used before a preference exists.
- Reduced motion: all decorative transitions collapse to opacity or no animation.
