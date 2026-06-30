# Auth Visual Foundation

Status: implementation-ready  
Owner: Designer agent  
Figma file: `1qmHdfnQiOqPB6CCO6OacI`  
Frames: Login `86:85`, Sign-up `95:270`  
Shared logo nodes: `95:238`, `95:308`

This specification defines the visual primitives shared by the login and
sign-up pages. Screen-specific form content, validation states, and submission
behavior remain owned by later sub-phases.

## Source And Precedence

1. The locked contract in `../01-scope-contract-freeze/contract-freeze.md`.
2. User-supplied screenshots for visible page integrity.
3. The live Figma frames and measurements recorded below.
4. `docs/DESIGN.md` for production accessibility and system-wide conventions.

When the mockup uses inaccessible text size, tracking, or contrast, the
production rule in this document overrides the literal Figma value.

## Design Intent

The auth shell is a dark, technical entry point into an academic repository.
It should feel direct and confident rather than promotional: a flat charcoal
canvas, a strongly branded left column, sparse controls, and three oversized
blue orbits clipped against the right edge.

Do not add cards behind the hero or form, background gradients, glow effects,
drop shadows, glass effects, or decorative elements beyond the three orbits.

## Token Contract

These tokens are the implementation contract for the shared auth shell.

| Token | Value | Use |
| --- | --- | --- |
| `--auth-bg` | `#14181C` | Default page background |
| `--auth-surface` | `#1E1E1E` | Dark toggle/control surface |
| `--auth-text` | `#FFFFFF` | Primary text and icons |
| `--auth-text-gradient-end` | `#C5C5C5` | Hero tagline gradient endpoint |
| `--auth-text-muted` | `#969696` | Supporting hero copy |
| `--auth-placeholder` | `#B3B3B3` | Production placeholder and secondary field text |
| `--auth-icon-muted` | `#B3B3B3` | Production inactive field icons |
| `--auth-control-muted-source` | `#565758` | Figma-only inactive control reference |
| `--auth-border` | `#368BFE` | Field, tab, and focus accent |
| `--auth-action` | `#368BFE` | Selected tab and primary action |
| `--auth-orbit-outer` | `#368BF3` | Largest orbit |
| `--auth-orbit-middle` | `#0571F5` | Middle orbit |
| `--auth-orbit-inner` | `#1752F0` | Smallest orbit |
| `--auth-pronunciation` | `#FFD900` | Pronunciation accent only |
| `--auth-control-outline` | `#EAEAEA` | Dark theme toggle outline |
| `--auth-radius-control` | `20px` | Tabs, fields, selected segment, CTA |
| `--auth-radius-toggle` | `999px` | Theme toggle |
| `--auth-focus-width` | `3px` | Keyboard focus ring |

Suggested theme variables:

```css
:root,
[data-theme="dark"] {
  --auth-bg: #14181c;
  --auth-surface: #1e1e1e;
  --auth-text: #ffffff;
  --auth-text-muted: #969696;
  --auth-placeholder: #b3b3b3;
  --auth-border: #368bfe;
  --auth-action: #368bfe;
  --auth-control-outline: #eaeaea;
}

[data-theme="light"] {
  --auth-bg: #f5f7fa;
  --auth-surface: #ffffff;
  --auth-text: #14181c;
  --auth-text-muted: #59616a;
  --auth-placeholder: #6d747c;
  --auth-border: #1752f0;
  --auth-action: #1752f0;
  --auth-control-outline: #14181c;
}
```

The dark theme is the default. Figma does not include a dedicated light auth
frame, so light mode is a conservative token adaptation, not a claim of
pixel-level Figma evidence. Keep the blue orbit hues unchanged in light mode
and reduce their opacity to `0.16`.

## Contrast Rules

Ratios below are against the dark canvas `#14181C`.

| Foreground | Ratio | Production decision |
| --- | ---: | --- |
| `#FFFFFF` | `17.84:1` | Primary text; passes AA and AAA |
| `#C5C5C5` | `10.34:1` | Tagline gradient endpoint; passes |
| `#969696` | `6.03:1` | Supporting copy; passes AA |
| `#368BFE` | `5.34:1` | Borders, focus, and large accents; passes |
| `#FFD900` | `12.89:1` | Pronunciation; passes |
| `#565758` | `2.46:1` | Fails for text; never use for production copy |

Use `#B3B3B3` instead of Figma's `#565758` for placeholders and inactive field
icons. Fields must have persistent visible labels; placeholder text cannot be
the only label.

For light mode, `#14181C` on `#F5F7FA` is `16.62:1`,
`#59616A` on `#F5F7FA` is `5.85:1`, and `#1752F0` on white
is `6.00:1`.

The middle and inner orbit colors are decorative. Do not place text or
interactive controls on top of them.

## Typography

Load both font families before rendering the auth shell:

```css
--font-display: "Khula", "Inter", system-ui, sans-serif;
--font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

| Role | Figma evidence | Production rule |
| --- | --- | --- |
| Hero wordmark | Khula ExtraBold, `100px` | Khula 800, `clamp(4rem, 6.95vw, 6.25rem)`, line-height `0.95` |
| Hero tagline | Inter Black, `35px` | Inter 900, `clamp(1.75rem, 2.45vw, 2.1875rem)`, line-height `1.15` |
| Pronunciation | Inter Light, `15px` | Inter 400, `15px`, line-height `1.4` |
| Supporting copy | Inter Semi Bold, `20px` | Inter 600, `clamp(1rem, 1.4vw, 1.25rem)`, line-height `1.4` |
| Header wordmark | Inter Black, `25px` | Inter 900, `25px`, line-height `1` |
| Field label | Not visibly represented | Inter 600, `14px`, line-height `1.4` |
| Input value | Khula SemiBold, `20px` | Inter 500, `16px`, line-height `1.4` |
| Placeholder | Khula SemiBold, `20px` | Inter 400, `16px`, line-height `1.4` |
| Auth tabs | Khula SemiBold, `20px` | Inter 600, `16px`, line-height `1` |
| Primary CTA | Khula SemiBold, `20px` | Khula 600, `18px`, line-height `1` |

Figma uses negative tracking on the hero. Use `letter-spacing: 0` in production
to avoid clipping and inconsistent font rendering. Keep Khula limited to the
large brand wordmark and primary auth action; functional UI uses Inter.

## Desktop Shell

Figma reference viewport: `1440x1024`.

The page is a single full-viewport frame with `overflow: hidden`. The content
layer sits above the orbit layer. Use a minimum height of `100svh`, then allow
the page to scroll when content is taller than the viewport.

### Shared Header

| Element | Figma position | Figma size | Production rule |
| --- | --- | --- | --- |
| Header logo group | `x 69, y 47` | `274x56` | Left `69px`, top `47px` at reference width |
| Logo mark | `x 69, y 47` | `56x56` | Render at `56px`; decorative alt when wordmark is present |
| Header wordmark | `x 125, y 64` | `218x36` | `25px` Inter 900, white |
| Theme toggle | `x 1255, y 54` | `75x43` | Render `75x44`; do not resize when icons change |
| GitHub control | `x 1345, y 51` | `49x48` | Render `48x48`, centered `25px` icon |

Desktop horizontal padding is `clamp(24px, 4.8vw, 69px)`. Header controls use
an `8px` gap and remain aligned to the right edge.

The GitHub control is an icon-only link with an accessible name of
`"Alexandria on GitHub"`. Use the project's installed icon library rather than
an embedded Figma image. The visible icon may be `25px`, but its target remains
at least `44x44`.

The theme control is a true button with an accessible pressed/state label. Its
dark appearance is `#1E1E1E`, a `1px #EAEAEA` border, and a pill radius. It
must not animate the page before the initial theme has been resolved.

### Hero Block

| Element | Figma position | Figma size |
| --- | --- | --- |
| Hero group | `x 69, y 127` | `854x245` |
| Main wordmark | `x 69, y 127` | `685x141` |
| Tagline | `x 69, y 232` | `960x71` |
| Pronunciation | `x 645, y 214` | `178x26` |
| Supporting copy | `x 69, y 286` | `546x24` |

Apply the wordmark gradient from `#368BFE` to `#1752F0`. Apply the tagline
gradient from `#FFFFFF` to `#C5C5C5`, with the lighter-to-gray transition
complete near `37.5%`.

The pronunciation is positioned beside the wordmark only while enough width
remains. Below `1024px`, move it into normal flow beneath the wordmark.

### Form Anchor

The form begins at approximately `x 69, y 396` and has a `420px` visual width.
Use:

```css
.auth-form {
  width: min(420px, 100%);
}
```

Do not place the form in a floating card. It sits directly on the page canvas.

## Orbit Geometry

The three orbit shapes are decorative, non-interactive, and hidden from the
accessibility tree. Their source aspect ratio is approximately `1000 / 1809`.
Use absolutely positioned ellipses or equivalent CSS shapes behind all content.

### Reference Geometry At 1440x1024

| Orbit | Position | Size | Fill |
| --- | --- | --- | --- |
| Outer | `x 856, y -404` | `1000x1809` | `#368BF3` |
| Middle | `x 956, y -223` | `800x1447.2` | `#0571F5` |
| Inner | `x 1056, y -42` | `600x1085.4` | `#1752F0` |

Desktop proportional implementation:

```css
.auth-orbit {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  aspect-ratio: 1000 / 1809;
  pointer-events: none;
}

.auth-orbit--outer {
  left: 59.444%;
  top: -39.453%;
  width: 69.444%;
  background: #368bf3;
}

.auth-orbit--middle {
  left: 66.389%;
  top: -21.777%;
  width: 55.556%;
  background: #0571f5;
}

.auth-orbit--inner {
  left: 73.333%;
  top: -4.102%;
  width: 41.667%;
  background: #1752f0;
}
```

Do not apply blur, gradients, or shadows to the orbits.

### Tablet Adaptation: 768px To 1023px

- Use page padding `32px`.
- Keep the form at `420px` maximum.
- Move the orbits behind the rightmost portion of the page:
  - Outer: `left: 68%`, `top: -8%`, `width: 110vw`.
  - Middle: `left: 76%`, `top: 4%`, `width: 88vw`.
  - Inner: `left: 84%`, `top: 16%`, `width: 66vw`.
- Use `opacity: 0.55`.
- Keep the content layer opaque and above the orbit layer.

### Mobile Adaptation: Below 768px

- Use page padding `24px 20px 48px`.
- Place the header in normal flow and use `24px` space below it.
- Keep a visible hint of the orbit system without allowing it behind controls:
  - Outer: `left: 58%`, `top: -6%`, `width: 150vw`.
  - Middle: `left: 70%`, `top: 8%`, `width: 120vw`.
  - Inner: `left: 82%`, `top: 20%`, `width: 90vw`.
- Use `opacity: 0.20`.
- Set the form to `width: 100%`.
- Hide the small header wordmark below `480px`; keep the `56px` mark.
- Stack the pronunciation under the main wordmark.

These tablet and mobile values are implementation decisions derived from the
desktop composition because the Figma file contains only the desktop frames.

## Shared Component Anatomy

### Auth Tabs

- Container: `420x57px` reference size, `1px solid #368BFE`, `20px` radius.
- Two equal-width tab buttons.
- Selected segment: approximately `207x46px`, `#368BFE`, `20px` radius.
- Maintain at least a `44px` interactive height.
- Use semantic links when switching routes (`/login`, `/sign-up`), with
  `aria-current="page"` on the current route.
- Do not animate the selected segment with spring or bounce motion.

### Field Shell

- Reference size: `420x60px`.
- Border: `1px solid #368BFE`.
- Radius: `20px`.
- Horizontal inset: `18px`.
- Icon-to-text gap: `12px`.
- Visible icon: `24px`; interactive trailing icon target: at least `44x44`.
- Text input font size: at least `16px` to avoid mobile browser zoom.
- Labels sit above the shell with an `8px` gap.
- Field-to-field spacing: `16px`.

Use a consistent line icon set for email, lock, user, visibility, and related
field affordances. Do not reuse the Figma image fills for production icons.

### Primary Action

- Figma reference: `234x46px`.
- Production: minimum height `46px`, horizontal padding `24px`, `20px` radius.
- Fill: `#368BFE` in dark mode and `#1752F0` in light mode.
- Text: white Khula 600 at `18px`.
- On narrow screens, the button may grow to the full form width.
- Disabled state must retain readable text and expose `disabled` semantics.

### Focus And Interaction

Every interactive control uses a visible keyboard focus treatment:

```css
:focus-visible {
  outline: 3px solid var(--auth-border);
  outline-offset: 3px;
}
```

For controls whose border is already blue, include a canvas-colored separation
layer using `box-shadow` so the focus ring remains distinct. Do not remove the
outline unless an equivalent visible ring is present.

- Hover: a small brightness or border-opacity change only.
- Active: no layout shift; use color or `transform: translateY(1px)` at most.
- Transition duration: `100ms` to `150ms`.
- Under `prefers-reduced-motion: reduce`, remove nonessential transitions.

## Logo Asset

Local asset: `Alexandria/public/brand/alexandria-mark.svg`

- View box and intrinsic size: `56x56`.
- Approved display sizes: `56px` in the auth header and `24px` in compact UI.
- The artwork is tightly cropped to the visible mark.
- The Figma source is a masked, raster-backed image rather than a pure vector
  path. The local SVG intentionally preserves that source as an embedded image.
- Do not recolor it with CSS filters.
- Do not enlarge it beyond `56px`; request a clean vector master before using
  the mark at display scale.
- On the light theme, place it on a `#14181C` backing shape so the white mark
  remains visible.

When the adjacent `ALEXANDRIA` wordmark is visible, render the image with an
empty alt attribute because the wordmark already supplies the accessible name.

## Frontend Acceptance Checklist

- The 1440x1024 shell matches the recorded Figma positions within normal
  browser font-rendering tolerance.
- Content remains readable and unobscured at `1440`, `1024`, `768`, `390`, and
  `320px` viewport widths.
- Orbits never receive pointer events or enter the accessibility tree.
- No text uses `#565758` on the dark canvas.
- Visible labels remain present after users enter values.
- All controls have at least `44x44` targets on touch layouts.
- Focus is visible on the logo link, theme button, GitHub link, tabs, fields,
  password visibility controls, and primary action.
- Dark theme is the first-render default; theme changes do not resize controls.
- The logo is served locally and remains legible at `24px` and `56px`.
- Screen-specific states are left for sub-phases 03 and 04.
