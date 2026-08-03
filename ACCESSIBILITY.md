# Accessibility checklist

The initial JaneQ pass is designed against WCAG 2.2 AA fundamentals.

- [x] Semantic header, navigation, main, sections, and footer landmarks.
- [x] One page-level `h1` with a predictable heading hierarchy.
- [x] Visible labels for all generator fields; helper text uses `aria-describedby` where useful.
- [x] Keyboard-operable type buttons, toggles, segmented controls, links, and exports.
- [x] Visible `:focus-visible` treatment using a high-contrast lime/ink ring.
- [x] Inline validation is text-based, announced with `aria-live`, and never relies on color alone.
- [x] Preview image has meaningful alternative text describing the encoded target category.
- [x] Decorative QR art and icons are hidden from assistive technology.
- [x] Reduced-motion media query removes decorative transitions and smooth scrolling.
- [x] Dark mode preserves semantic contrast and can be toggled without changing content.
- [x] Touch targets are at least roughly 38–46 px for primary controls.
- [ ] Test with a screen reader and real keyboard-only flow on each supported browser before release.
- [ ] Test downloaded QR images with representative low-light, small-size, and print scenarios.

## Manual release checks

1. Tab from the header through the hero CTA and into the generator without a focus trap.
2. Select every QR type without using a pointer.
3. Trigger invalid URL and Wi-Fi states and confirm the message is announced.
4. Turn on reduced motion and confirm the page remains fully understandable.
5. Test at 375 px and 1280 px widths with browser zoom at 200%.
