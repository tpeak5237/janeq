# Design brief: JaneQ

## Project overview

JaneQ (Just Another Non-Existent QR Code) is a small open-source public utility by theerapat.org. Its single job is to make direct, static QR codes without ads, tracking redirects, expiration, accounts, subscriptions, or a server-side content store.

The intended audience is anyone who needs a QR code for a link, note, contact detail, message, or network and wants to understand exactly what will be encoded before downloading it.

## Problem statement

Many QR-code products make a simple encoding task feel like a funnel. Users can be sent through redirects, shown ads, asked to subscribe, or left uncertain whether their code will continue working. This creates distrust around a format that should be inspectable and portable.

JaneQ makes the directness visible: the destination is encoded in the image in the browser, and the downloaded static file works independently of JaneQ.

## Audience

- **Primary:** students, teachers, event organizers, small businesses, and everyday users making one-off QR codes.
- **Secondary:** developers and privacy-conscious people who want a lightweight, self-hostable reference implementation.
- **Context:** often mobile, time-constrained, and unfamiliar with QR error correction. Defaults must be reliable, labels plain, and warnings actionable.

## Goals and success criteria

- A first-time user can create and download a URL QR code in under one minute without signing in.
- The preview updates as fields change and shows the direct payload in readable text.
- URL, text, email, phone, SMS, Wi-Fi, contact, and location payloads are encoded locally with no network request.
- PNG and true-vector SVG exports match the preview; copy and print actions have clear support states.
- Reliability warnings identify poor contrast, small output, low quiet zone, and logo risk without blocking safe defaults.
- Keyboard focus, labels, validation, reduced motion, and dark mode are usable at WCAG 2.2 AA quality.

## Scope and constraints

### In scope

- A single responsive Next.js App Router page.
- Local QR matrix generation and rendering.
- Direct payload builders for eight common QR types.
- Custom colors, transparent backgrounds, correction level, quiet zone, output size, module shape, and local logo handling.
- SEO metadata, favicon, sitemap, robots, documentation, tests, and static deployment configuration.

### Out of scope

- Dynamic/editable QR codes, redirect URLs, accounts, analytics, payments, backend storage, bulk generation, and cloud image uploads.
- Guaranteeing the safety of a user-entered destination.

## Visual direction

**Visual thesis:** an editorial service instrument cut from cool blueprint paper and ink navy, with one signal-coral action color and a missing-module mark that makes the product’s critique literal.

- **Palette:** cool fog `#eef2f3`, clean paper `#fbfcfa`, ink navy `#101922`, signal coral `#e9674f`, indicator lime `#d7ee73`.
- **Type:** condensed sans display for a compact, poster-like voice; system sans for readable UI and body copy; mono for payloads and technical state.
- **Layout:** edge-to-edge hero, then a quiet two-column utility workspace with the preview treated as the primary instrument.
- **Signature:** the JaneQ mark is a Q-shaped loop with a missing QR module and a direct arrow. It appears in the logo, hero graphic, and empty preview state.
- **Motion:** the missing module settles into place on entry; a single coral signal line draws toward the hero CTA; preview state transitions use short fades and respect reduced motion.

## Content principles

- Say what the user controls and what the file does.
- Explain the static limitation beside export actions, not hidden in a footer.
- Distinguish “generated locally” from any future site-level analytics claim.
- Use “direct payload” and “downloaded file” instead of opaque product jargon.

## Deliverables

- Working source in this repository.
- Editable token system and design-flow artifacts.
- README, security review notes, accessibility checklist, roadmap, CI configuration, and browser screenshots.
