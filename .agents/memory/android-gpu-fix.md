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
