# JaneQ architecture

JaneQ is a statically exported Next.js application. The framework builds HTML, scripts and assets into `out/`; the application has no runtime API routes, server actions, authentication or database. Next.js and Sharp still execute during development/build, so their dependency advisories matter even though the deployed artifact is static.

## Browser workflows

`app/page.tsx` composes the generator/scanner utility and language/theme controls. `components/qr-studio.tsx` owns generator fields, customization, local logo processing and explicit PNG/SVG/clipboard/print actions. `lib/qr.ts` validates payloads, builds matrices and renders output. Downloaded QR content is static and works independently of JaneQ.

`components/qr-scanner.tsx` owns camera/image interaction. `lib/qr-camera-pipeline.ts`, `lib/qr-detection.ts` and `lib/qr-image.ts` coordinate local frames, candidate regions and preprocessing. `lib/scanner.ts` classifies decoded values and allows explicit link actions only for HTTP(S). Camera access requires the user's start action, and active tracks are stopped on stop/mode change/unmount. The camera library's worker is bundled locally.

User fields, decoded values and frames belong to the current browser session. Theme/language preferences can be stored locally; browser storage is not an authority or a suitable secret store. A PromptPay payload requests payment but does not confirm a transaction.

## Boundaries and evidence

The browser is responsible for local computation; camera/clipboard capabilities are governed by the browser and secure-context permissions. This utility does not verify encoded destinations, identity, payment outcomes or whether a downloaded image will scan on every physical device.

Pure helper tests cover payload/validation/scanner behavior. Browser tests serve `out/` and exercise interaction, accessibility, motion, generated QR images and permission states. Synthetic camera mocks and local screenshots do not establish hardware, hosted-deployment or live-payment proof. CI separately checks clean installation, typechecking, lint, units, build and browser workflows.

See [security boundaries](../SECURITY.md), [dependency review](DEPENDENCY_REVIEW.md), and [architecture decisions](DECISIONS.md).
