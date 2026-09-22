# JaneQ

> Just Another Non-Existent QR Code.

JaneQ is a small open-source QR utility by [theerapat.org](https://theerapat.org). It creates direct, static QR codes and scans QR codes locally in the browser. There are no ads, tracking redirects, accounts, subscriptions, expiring links, or server-side QR content storage.

## What it supports

- Website URLs
- Plain text, including Unicode and Thai text
- English/Thai interface with a saved local language preference
- Email links with optional subject and message
- Phone numbers
- SMS messages
- Wi-Fi credentials using the common `WIFI:` format
- Contact cards using `MECARD:`
- Geographic locations using `geo:` links
- Thai PromptPay payment-request QR codes with optional amounts
- QR scanning from a webcam/camera or uploaded image
- English/Thai scanner controls and result actions

The generator supports PNG and true-vector SVG downloads, copy-to-clipboard where the browser allows it, printing, transparent backgrounds, correction levels, quiet-zone size, output size, square or rounded modules, and a local center mark or uploaded logo.

## Privacy model

QR matrices are generated in the browser with the open-source [`qrcode`](https://github.com/soldair/node-qrcode) library. PromptPay payloads are generated locally with [`promptpay-qr`](https://github.com/dtinth/promptpay-qr). Camera frames and selected images are decoded locally with [`qr-scanner`](https://github.com/nimiq/qr-scanner); they are not sent to JaneQ, stored in a database, or passed through a redirect URL. Scanned values are shown for the current browser session only, and there is no analytics SDK or application backend in this repository.

Camera scanning requires HTTPS or `localhost`. Camera permission is requested only after pressing Start camera. JaneQ never automatically opens a scanned URL: only explicitly clicked `http://` and `https://` results receive an Open link action, in a new tab with `noopener`/`noreferrer`.

The camera scanner checks the full frame. A small 10×10 logical grid prioritizes likely QR regions for expanded, quiet-zone-preserving ROI scans; it is not 100 independent decoders. Reduced-resolution full-frame scanning, native `BarcodeDetector` where available, a worker-backed fallback, low-light preprocessing, and periodic high-resolution full-frame passes are coordinated by an adaptive frame scheduler. The visible finder frame is guidance only.

This is a statement about the local utility. Review every encoded destination before publishing it: JaneQ cannot verify whether a URL or message is safe.

## Static-code limitation

JaneQ creates static QR codes. The destination is encoded inside the downloaded image, so the file works independently of JaneQ and does not expire. It also means the destination cannot be edited after download; to change it, create a new QR code. Scanning is a separate local browser action and does not turn static codes into tracking redirects.

## Local setup

Requirements: Node.js 24+ and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation commands

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

`npm run build` uses Next.js static export and writes the deployable site to `out/`.

## Deployment

JaneQ has no runtime secrets or persistent service. The static output can be deployed to:

- **Cloudflare Pages:** build command `npm run build`, output directory `out`, Node version 24.
- **Vercel:** import the repository; the `output: "export"` setting in `next.config.mjs` produces a static deployment.
- **GitHub Pages:** publish the contents of `out/` from a workflow or static-hosting action. Use a custom domain or configure `basePath`/`assetPrefix` if the project is served under a repository subpath.

The canonical URL in `app/layout.tsx`, `app/robots.ts`, and `app/sitemap.ts` is currently `https://janeq.theerapat.org`; update it before deploying to a different host.

## Architecture

```text
app/page.tsx                 utility shell, mode switcher, structured data
components/qr-studio.tsx     browser-only generator workspace and exports
components/qr-scanner.tsx    browser-only camera and image scanner
lib/qr.ts                    payloads, validation, matrix and render helpers
lib/scanner.ts               local scan result classification and URL safety
lib/qr-camera-pipeline.ts    adaptive full-frame, ROI, low-light and camera pipeline
lib/qr-detection.ts          lightweight grid scoring and ROI prioritization
lib/qr-image.ts              brightness, blur and local preprocessing helpers
app/globals.css              semantic tokens, responsive layout, dark mode
tests/qr.test.ts             payload and reliability unit tests
tests/e2e/janeq.spec.ts      Playwright interaction coverage
```

The initial version intentionally does not include Firebase, Supabase, authentication, payments, or a database.

## Design and documentation

- [Design brief](.design/janeq/DESIGN_BRIEF.md)
- [Information architecture](.design/janeq/INFORMATION_ARCHITECTURE.md)
- [Design tokens](.design/janeq/DESIGN_TOKENS.md)
- [Accessibility checklist](ACCESSIBILITY.md)
- [Security review notes](SECURITY.md)
- [Future roadmap](ROADMAP.md)

## Example screenshots

![JaneQ desktop utility](docs/screenshots/janeq-desktop.png)

![JaneQ mobile generator](docs/screenshots/janeq-mobile.png)

The repository also includes a dark-mode capture at [`docs/screenshots/janeq-dark.png`](docs/screenshots/janeq-dark.png).

## License

MIT. See [LICENSE](LICENSE) when the project is published.
