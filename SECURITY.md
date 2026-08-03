# Security review notes

Last reviewed: 2026-08-03

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

## Dependency and release checks

- Keep `package-lock.json` committed and use `npm ci` in CI.
- Run `npm audit` during release review and update dependencies when advisories affect the runtime or build chain.
- The app should be served over HTTPS in production so browser clipboard and file APIs receive their secure-context permissions.

The current runtime audit (`npm audit --omit=dev --audit-level=high`) still reports two high-severity findings for Next.js 16.2.12's nested PostCSS 8.4.31 dependency. The application uses static export, does not expose Next's server runtime or image optimizer, and has no user-controlled CSS/source-map input. The Sharp dependency is pinned through `package.json` overrides to the patched 0.35.3 release. Do not run `npm audit fix --force` blindly: npm currently proposes a destructive framework downgrade for the remaining advisory.

## Not implemented by design

Dynamic QR redirects, scan analytics, user accounts, cloud uploads, and server-side storage are intentionally absent. Any future dynamic mode must be a clearly separated, opt-in, self-hostable feature with its own threat model and privacy documentation.
