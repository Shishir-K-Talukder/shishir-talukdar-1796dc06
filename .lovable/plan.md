# Plan: Professional Hero Profile Photo

## Goal
Make the profile picture in the hero bento card significantly larger, visually highlighted, and look polished on mobile, tablet, and desktop.

## Changes (single file: `src/pages/Index.tsx`)

Restructure the hero card so the profile photo becomes a true focal point instead of a 64x64 thumbnail tucked next to the name.

### New hero layout
- Two-column grid inside the hero card on `sm+`: text on the left, photo on the right.
- On mobile (<640px), photo stacks above the text and is centered.
- Profile image sizes:
  - Mobile: `h-40 w-40` (160px)
  - Tablet (`sm`): `h-48 w-48`
  - Desktop (`lg`): `h-56 w-56` to `h-64 w-64`
- Replace the small avatar that currently sits next to the name; the name/title block stays but without the inline mini avatar.

### Professional highlight effects
- Circular frame with layered ring: `ring-4 ring-primary/40 ring-offset-4 ring-offset-card`.
- Soft glow halo behind the image using a blurred radial gradient (`bg-primary/30 blur-3xl`) positioned absolutely behind the photo.
- Subtle conic/gradient border using a wrapper div with `bg-gradient-to-br from-primary via-accent to-primary p-[3px] rounded-full` — image sits inside on a `bg-card` inner ring.
- Hover: gentle `scale-105` + glow intensifies (`transition-all duration-500`).
- Floating animation reusing the existing `animate-floating-microbe` (slowed) or a new lightweight `float` keyframe — optional, very subtle.
- `object-cover object-center` to ensure face stays centered regardless of aspect.
- `loading="eager"` + `fetchpriority="high"` for LCP.

### Background image adjustment
- Slightly reduce lab background opacity (`opacity-10`) so the highlighted portrait stands out more.
- Keep the existing gradient overlay.

### Buttons & text
- Keep CTA buttons; ensure they wrap nicely under the text column on small screens.
- Name + title moves directly under the heading (no duplicate avatar).

## Responsive behavior
| Breakpoint | Layout | Photo size |
|---|---|---|
| <640px | Stacked, photo on top, centered | 160px |
| 640–1024px | Side-by-side, text left / photo right | 192px |
| ≥1024px | Side-by-side, larger | 224–256px |

## Out of scope
- No DB changes.
- No new dependencies.
- No changes to other pages.

## Files
- `src/pages/Index.tsx` — hero `BentoCard` markup only.
