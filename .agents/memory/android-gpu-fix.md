---
name: Android Chrome GPU rendering fix
description: Root cause and fix for the scan-line static glitch on Android Chrome in StakeKE
---

## Rule
Never use `transition-transform`, `backdrop-filter`, `blur-*`, `will-change`, or `animate-*` on any element in pages or layout components. These force GPU layer promotion and cause a severe scan-line static glitch on Android Chrome.

**Why:** Android Chrome's compositor creates separate GPU layers for elements that use CSS transforms/filters. When a `position:fixed` element (sidebar) has `transition-transform`, it corrupts the rendering of ALL sibling content on the page — producing a horizontal scan-line noise pattern across the entire screen. Even non-fixed elements with hover transform animations can trigger layer promotion on lower-end Android devices.

**How to apply:**
- Mobile sidebar: replace entirely with a `position:fixed` **bottom tab bar** — no sidebar, no overlay, no transform animation.
- Desktop sidebar: use `display: none` / `display: flex` (class toggle), never `translateX` transitions.
- Decorative blobs: use solid low-opacity backgrounds (`bg-green-900/8 rounded-full`) — never `blur-3xl`.
- Sticky navbars: use solid background color, never `backdrop-blur-*`.
- Loading skeletons: use static placeholder divs — never `animate-pulse`.
- Progress bars: use solid `bg-green-500` — never gradient animations.
- Hover effects: use `hover:bg-*` color changes only — never `hover:scale-*` or `hover:translate-*`.

## Banned CSS classes (enforce globally in staking-platform):
- `transition-transform`
- `backdrop-blur-*`
- `blur-2xl`, `blur-3xl`, `blur-xl`
- `will-change`
- `animate-pulse`, `animate-spin` (use sparingly, only on isolated small icons)
- `hover:scale-*`, `hover:translate-*`
- `group-hover:scale-*`, `group-hover:translate-*`

## index.css rules (confirmed fixes for Android Chrome glitches)

### 1. Remove CSS relative color syntax from border vars
The `hsl(from hsl(...) h s calc(l + ...) / alpha)` CSS relative color syntax is NOT supported
on older Android Chrome (pre-v119). Remove the duplicate override lines — keep only the plain
`hsl(var(--...))` fallback for each `--*-border` variable in both `:root` and `.dark`.

### 2. Disable elevation pseudo-elements on touch devices
The `hover-elevate` / `active-elevate` pseudo-elements use `z-index: 999` and `position: absolute`
with `content: ""`. On Android Chrome with fixed bars present, these create high-z composited
layers on EVERY interactive control, triggering a full repaint storm. Add a media query guard:

```css
@media (hover: none) and (pointer: coarse) {
  .hover-elevate:not(.no-default-hover-elevate),
  .active-elevate:not(.no-default-active-elevate),
  .hover-elevate-2:not(.no-default-hover-elevate),
  .active-elevate-2:not(.no-default-active-elevate) {
    z-index: auto;
  }
  .hover-elevate:not(.no-default-hover-elevate)::after,
  .active-elevate:not(.no-default-active-elevate)::after,
  .hover-elevate-2:not(.no-default-hover-elevate)::after,
  .active-elevate-2:not(.no-default-active-elevate)::after {
    content: none;
  }
}
```
