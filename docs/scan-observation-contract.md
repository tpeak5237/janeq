# JaneQ scan observation contract v1

This is a local, transport-independent interface for consumers of the existing JaneQ scanner. It implements the roadmap's initial JaneQ Engine interface slice. It does not establish a deployed integration with any PHASAN macro.

`lib/scan-observation.ts` exports `createScanObservation(payload, source)` for a successful decoder callback and `parseScanObservation(input)` for a JSON-shaped input. The envelope has exactly three fields:

| Field | Contract |
| --- | --- |
| `schemaVersion` | Literal `1`; unsupported versions fail. |
| `source` | `camera` or `image-upload`; describes the caller's local input mode. |
| `payload` | Nonempty decoded string, trimmed according to the existing scanner policy. Internal Unicode and reserved characters are preserved. |

The parser rejects unknown fields and returns a new frozen envelope. Consumers derive display classification from `classifyQrPayload(observation.payload)`; classification or an `openable` flag supplied by a caller is not accepted. HTTP(S) classification only enables an explicit user action; it does not establish that a destination is trustworthy.

```ts
import { createScanObservation, parseScanObservation } from "./lib/scan-observation";
import { classifyQrPayload } from "./lib/scanner";

const local = createScanObservation("https://example.com/synthetic", "camera");
const received = parseScanObservation(JSON.parse(JSON.stringify(local)));
const display = classifyQrPayload(received.payload);
```

The existing JaneQ UI now calls the factory only after the camera run or image request cancellation guards accept a result, then derives its display classification from the observation payload. Camera results use `camera`; uploaded-image results use `image-upload`. Hiding the document invalidates pending UI image requests as well as stopping the pipeline, so a cancelled decode's late rejection cannot replace the idle status.

There is no existing external consumer hook in this UI. No hook, event bus, transport, capture restart, account requirement, redirect, telemetry, persisted scan history, or automatic navigation is added. The existing Copy action remains an explicit local clipboard action for the decoded payload. A structured business-consumer handoff remains gated on the consuming product's approved contract.

## Consumer ownership and evidence limits

A decoded value and its source are untrusted observations. Copying or replaying an envelope is possible. A scan does not prove presence, uniqueness, authorization, payment, or completion. Kote owns record/scope and commercial decisions; Appoint owns scheduling and capacity decisions; Mori's source identity and integration remain gated. Their implementations are outside this increment.

Before binding an observation to a business record, a consuming product must obtain explicit user intent and enforce its own authenticated actor, tenant, record lookup, authorization, transition rules, and replay policy at its authoritative boundary. The envelope deliberately contains no actor, tenant, record ID, payment state, or verified timestamp. It grants no access. QR contents may contain contact details or Wi-Fi secrets; consumers must avoid logging or persisting them by default and obtain the appropriate consent before retention.

Creator commission/studio/event templates can reference this interface for an optional scan step, but no workflow transition, customer approval, check-in, paid cohort, or live integration is established here. Real provider transport, persistence, and physical-device behavior need separate product-owned evidence.

## Checks

Unit tests exercise a producer/consumer JSON round-trip, both input modes, existing normalization, Unicode, inert active schemes, malformed/unsupported envelopes, and rejected identity/business/derived claims. These are synthetic contract tests. They do not validate camera hardware, payment processing, or server authorization.

Pipeline consumer tests run the actual accepted-decode callback through the factory and serialized parser. They verify stopped/old runs, empty values and duplicate callbacks cannot reach the local test consumer, while a fresh accepted run delivers one valid observation. Browser tests exercise the actual scanner UI, including a pending uploaded image cancelled by page hide and a fresh explicit selection afterward. These tests establish local behavior, not a live integration.
