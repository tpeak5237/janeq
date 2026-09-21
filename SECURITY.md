# Security review notes

Last reviewed: 2026-09-21

## Boundary

JaneQ is a client-only static web application. It has no API routes, server actions, database, authentication system, payment flow, secret key, redirect service, or upload endpoint.

## Data handling

- URL, text, contact, message, and Wi-Fi fields are kept in React state in the current browser tab.
- Uploaded logos are type-checked and limited to 2 MB before local decoding.
- Logo files are decoded from a browser object URL, downscaled into a new PNG data URL, and the object URL is revoked in a `finally` block.
- Generated download object URLs are revoked after the browser receives the download.
- No user-entered content is interpolated into HTML. SVG exports are generated from QR matrix booleans and escaped logo data attributes; previews use image data URLs.
- The print view is built with DOM nodes and the generated local SVG data URL, not user-controlled HTML.

## QR safety

JaneQ does not validate or guarantee the safety of encoded destinations. Users should inspect URLs and only publish codes they are authorized to share. Static QR files can be copied and redistributed like any other image.

## Scanner safety

- Camera frames and selected QR images are decoded locally in the browser with `qr-scanner`; there is no scanner endpoint or telemetry path. The optional development instrumentation logs timing, pipeline path, brightness class, and ROI usage only—never camera frames or QR contents.
- Camera permission is requested only from the explicit Start camera action. Camera tracks are stopped when scanning stops, the user switches modes, or the scanner unmounts.
- JaneQ never automatically opens a scanned URL: only explicitly clicked `http://` and `https://` results receive an Open link action, in a new tab with `noopener`/`noreferrer`. Other URI schemes, including `javascript:`, `data:`, `file:`, `vbscript:`, and `blob:`, are shown as text with no Open action.
- Image uploads are accepted only as browser image files up to 20 MB, are not persisted, and their temporary object URLs are revoked after decoding.

## Dependency and release checks

- Keep `package-lock.json` committed and use `npm ci` in CI.
- Run `npm audit` during release review and update dependencies when advisories affect the runtime or build chain.
- The app should be served over HTTPS in production so browser clipboard and file APIs receive their secure-context permissions.

The current runtime audit (`npm audit --omit=dev --audit-level=high`) still reports two high-severity findings for Next.js 16.2.12's nested PostCSS 8.4.31 dependency. The application uses static export, does not expose Next's server runtime or image optimizer, and has no user-controlled CSS/source-map input. The Sharp dependency is pinned through `package.json` overrides to the patched 0.35.3 release. Do not run `npm audit fix --force` blindly: npm currently proposes a destructive framework downgrade for the remaining advisory.

## Not implemented by design

Dynamic QR redirects, scan analytics, user accounts, cloud uploads, and server-side storage are intentionally absent. Any future dynamic mode must be a clearly separated, opt-in, self-hostable feature with its own threat model and privacy documentation.
