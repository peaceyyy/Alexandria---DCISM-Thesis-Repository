# Alexandria Frontend Design Guide

Source: Figma design file `1qmHdfnQiOqPB6CCO6OacI`, page `Page 1`.

This guide translates the current Figma mockups into implementation rules for frontend developers. Treat Figma as the visual source of truth, but use the accessibility notes here when exact mockup values would be too small for production web UI.

## Design Intent

Alexandria is a dark-first academic discovery interface for DCISM thesis, research, and capstone work. The visual direction is restrained, technical, and archive-like: dark charcoal surfaces, white typography, thin separators, small metadata, and blue brand accents. The product should feel like a serious research index, not a marketing site.

The current Figma file defines three main screens:

- `Landing Page` at node `1:2`: brand introduction and entry CTA.
- `Main Page` at node `1:5`: searchable repository list with filters and FAQ.
- `Selected Page` at node `21:46`: selected-paper/detail state using the same shell.

## Color Palette

> **Source of truth**: `Alexandria/app/globals.css` — `:root` (dark default) and `:root[data-theme="light"]`.
> **Format**: All tokens use OKLCH for perceptual consistency. Hex approximations are noted for reference.

### Naming Rules

| Prefix | Purpose |
|---|---|
| `--color-bg` / `--color-surface` / `--color-surface-alt` | Page and panel backgrounds |
| `--color-text` / `--color-text-muted` / `--color-placeholder` | Text hierarchy |
| `--color-separator` / `--color-separator-mid` | Structural dividers. **Never** use for brand accents. |
| `--color-brand` / `--color-brand-bright` / `--color-brand-cyan` | Brand accent colors |
| `--color-chip-{cyan\|red\|green}-{bg\|bd\|text}` | Semantic status chip triplets (theme-aware) |
| `--color-danger` / `--color-success` / `--color-pronunciation` | Semantic one-off states |

> [!IMPORTANT]
> Do **not** use `--color-separator` for interactive highlights. Use `--color-brand` or `--color-brand-bright` for focus/active states. Do **not** add raw `rgba(255,255,255,0.X)` or `rgba(0,0,0,0.X)` in component classes — use `--color-separator` or `var(--color-text)/opacity` patterns instead.

### Core Token Values (Dual Theme)

| Token | Dark (`:root`) | Light (`[data-theme="light"]`) | Purpose |
|---|---|---|---|
| `--color-bg` | `oklch(0.14 0.009 264)` ≈ `#14181c` | `oklch(0.97 0.005 264)` ≈ `#f5f7fa` | Page background |
| `--color-surface` | `oklch(0.16 0.008 264)` ≈ `#1e1e1e` | `oklch(1 0 0)` = `#ffffff` | Card / panel surface |
| `--color-surface-alt` | `oklch(0.15 0.009 264)` ≈ `#1a1e23` | `oklch(0.95 0.005 264)` ≈ `#f0f2f5` | Nested / inset surface |
| `--color-text` | `oklch(1 0 0)` = `#ffffff` | `oklch(0.14 0.009 264)` ≈ `#14181c` | Primary text |
| `--color-text-muted` | `oklch(0.62 0.005 264)` ≈ `#969696` | `oklch(0.44 0.01 264)` ≈ `#59616a` | Secondary / supporting text |
| `--color-placeholder` | `oklch(0.73 0.004 264)` ≈ `#b3b3b3` | `oklch(0.50 0.01 264)` ≈ `#6d747c` | Input placeholder |
| `--color-separator` | `oklch(1 0 0 / 6%)` | `oklch(0 0 0 / 6%)` | Structural dividers |
| `--color-separator-mid` | `oklch(1 0 0 / 10%)` | `oklch(0 0 0 / 10%)` | More visible dividers |
| `--color-brand` | `oklch(0.47 0.22 264)` = `#1752f0` | same | Primary brand blue |
| `--color-brand-bright` | `oklch(0.60 0.20 264)` = `#368bfe` | same | CTA / hover bright |
| `--color-brand-cyan` | `oklch(0.63 0.12 220)` = `#1da0c9` | same | Cyan accent (base only) |
| `--color-danger` | `oklch(0.65 0.22 27)` ≈ `#ff6b6b` | `oklch(0.45 0.20 27)` ≈ `#d63031` | Error / destructive |
| `--color-success` | `oklch(0.72 0.17 150)` ≈ `#59c987` | `oklch(0.45 0.16 150)` ≈ `#27ae60` | Confirmation |
| `--color-pronunciation` | `oklch(0.88 0.17 90)` = `#ffd900` | `oklch(0.62 0.17 80)` = `#c8a000` | Yellow accent |

### Status Chip Token Pairs

Chips must **always** use the three-token triplet (`bg`, `bd`, `text`), never raw hex. The triplet inverts correctly in both themes:

| Chip | Token base | Dark feel | Light feel |
|---|---|---|---|
| Cyan (research area / under review) | `--color-chip-cyan-*` | Electric `#9ddff2` on teal wash | Deep teal ink on pale teal wash — no browser-select blue |
| Red (flagged / needs revision) | `--color-chip-red-*` | Soft `#ff9b9b` on rose wash | Deep crimson ink on pale rose wash |
| Green (accepted / published) | `--color-chip-green-*` | Soft `#8ee1ae` on mint wash | Deep forest ink on pale mint wash |
| Gray (archived / trashed) | `--color-separator` + text opacity | Subtle | Subtle |

### Gradients

Use gradients sparingly. They are part of the landing identity, not general UI chrome.

- Landing wordmark: `conic-gradient(from 180deg at 50% 50%, #368BFE 0deg, #1752F0 180deg, #368BFE 360deg)`.
- Landing tagline in dark: white-to-gray gradient (light mode: use `--color-text` directly — no gradient needed).

Do not introduce broad background gradients or decorative glow fields.

### Anti-Patterns: High Saturation Outlines

We explicitly avoid highly saturated, thick outlines or "streaks" for focus rings and highlights (e.g., solid `#368bfe` rings). These tend to look overwhelming and break the subtle visual density of the UI.
- **Instead of solid borders:** Use an alpha-blended approach.
- **For focus states:** Use `color-mix(in oklch, var(--color-brand-bright) 25%, transparent)` to create a softer, more integrated glow.
- **For active borders:** Use `var(--color-separator)` or heavily faded brand variants.

## Typography

### Font Families

| Role | Font | Figma Styles | Implementation Notes |
| --- | --- | --- | --- |
| Brand display | `Khula` | `Khula ExtraBold`, 120px; `Khula SemiBold`, 20px | Use only for the landing wordmark and primary CTA text. |
| UI and content | `Inter` | Light, Regular, Medium, Semi Bold, Bold, Extra Bold, Black | Default font for navigation, filters, cards, FAQ, metadata, and paper detail content. |

Fallback stack:

```css
--font-display: "Khula", "Inter", system-ui, sans-serif;
--font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Type Scale From Figma

| Role | Figma Value | Production Guidance |
| --- | --- | --- |
| Landing wordmark | Khula ExtraBold, 120px, tracking -6% | Use `clamp(4rem, 8vw, 7.5rem)` and preserve tight tracking. |
| Landing tagline | Inter Black, 55px, tracking -4% | Use `clamp(2.25rem, 4vw, 3.45rem)`. |
| Landing subheading | Inter Semi Bold, 28px, muted gray | Use 28px desktop, 20-22px mobile. |
| Header logo | Inter Black, 25px | Keep compact and highly recognizable. |
| Search placeholder | Inter Regular, 16px, line-height 100% | Use 16px minimum. |
| Content card title | Inter Extra Bold, 20px | Keep title max width near the card width and allow wrapping. |
| Paper body/abstract | Inter Light 12px in list cards; Inter Semi Bold 18px in detail | For production, use 14px minimum in list summaries and 18px for detail reading. |
| Filter headings | Inter Bold, 12px | Production minimum should be 12px, preferably 13-14px if space allows. |
| Filter options/chips | Inter Light, 10px or 7px in tags | Use 12px minimum for interactive options and tags. |
| Footer credits | Inter Regular, 6px | Increase to 11-12px for readable production UI. |

### Typography Rules

- Use Inter for all functional UI.
- Reserve Khula for the Alexandria landing wordmark and large CTA treatment.
- Use weight, not extra colors, for hierarchy.
- Keep body copy line-height around 1.45 to 1.6 in production. Figma uses `AUTO` heavily, but long abstracts need explicit readable line-height.
- The Figma mock uses negative tracking on small filter labels. Avoid negative tracking below 14px in production.

## Layout System

### Canvas and Breakpoints

The mockups are built at `1440x1024`. The main app shell has three columns:

| Area | Figma Position | Size | Purpose |
| --- | --- | --- | --- |
| Header | x 22, y 32 | 1391x65 | Logo, search, theme toggle, GitHub link. |
| Left sidebar | x 16-22, y 151+ | about 200px wide | Home/popular nav and filters. |
| Content list | x 272, y 175 | 809x750 | Search results or selected paper content. |
| Right rail | x 1103, y 181 | 310x372 | FAQ and submit prompt. |

Implementation should use CSS grid for the desktop shell:

```css
.app-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr) 310px;
  column-gap: 40px;
}
```

On tablet and mobile:

- Collapse the right FAQ rail below content.
- Turn the left filters into a drawer or collapsible panel.
- Keep search prominent below or inside the header.
- Preserve the dark background and thin separators.

### Spacing and Sizing

Observed spacing values:

- Header starts around `32px` from the top and `22px` from the left.
- Landing content starts around `87px` from the left.
- Main content starts around `272px` from the left.
- Content cards are `807x171` with about `17px` left padding.
- Repeated content cards are stacked with about `22px` vertical gap.
- Search input is `551x40`, with 16px horizontal padding, 12px vertical padding, and 8px icon/text gap.

Use an 8px scale in code where possible: `4`, `8`, `12`, `16`, `24`, `32`, `40`, `48`, `64`.

## Shape, Borders, and Effects

The design is mostly flat and precise.

| Element | Radius | Notes |
| --- | --- | --- |
| Most frames | 0px | The interface is intentionally sharp and grid-like. |
| Filter checkboxes/options | 2px | Small controls should be crisp, not pill-shaped. |
| Year inputs | 4px | Slight rounding for small input boxes. |
| FAQ panel and selected content panel | 7px | Use for larger contained panels. |
| Content tags | 9px | Small rounded label chips. |
| Search input | 9999px | Fully pill-shaped search field. |
| Toggle | about 46px | Pill toggle with circular internal controls. |

Effects are minimal:

- Thin outline/drop-shadow style is used as a 1px border substitute on small inputs and controls.
- Selected/focused search uses `#1752F0` spread accent.
- Avoid heavy shadows. The only large blur found is tied to imported background artwork, not normal UI surfaces.

## Component Patterns

### Landing Page

- Dark charcoal full-screen base.
- Header logo at top-left, theme toggle and GitHub icon at top-right.
- Large `ALEXANDRIA` wordmark in Khula with blue gradient.
- Tagline below in large Inter Black with white-to-gray gradient.
- Pronunciation helper uses yellow `#FFD900`.
- Primary CTA uses bright blue `#368BFE` and should be visually direct. It acts as a direct redirect to the main repository (view page) without requiring login or signup (per Decision 041).
- Keep the layered wave image as supporting background texture, not a competing hero element.

### Header

- Logo group: 56px mark plus 25px wordmark.
- Search: pill input, 40px height, white surface, muted placeholder.
- Theme toggle: compact pill using sun/moon icons.
- GitHub link: 49x48 hit area with 25px icon.

### Sidebar Filters

- Use a thin left navigation/filters rail with subtle separators.
- Home and Popular use icon plus 15px label.
- Filter groups: Year, Categories, Advisor, Department, Tags.
- Checkboxes/options are 72x15 in Figma; in production, increase hit target height to at least 32px while preserving the compact visual rhythm.
- Year range inputs use small dark boxes with white 1px outline.

### Content Cards

Repeated research cards are approximately `807x171`.

Structure:

- Metadata line at top: authors and year.
- Title: 20px Inter Extra Bold, max two lines before truncation.
- Abstract preview: compact summary text, 3-4 lines.
- Tags: small rounded chips at the bottom.
- Separator line at the bottom/right edge.

Cards should feel like rows in a research index, not marketing cards. Avoid large radius, large shadows, or oversized imagery.

### FAQ Rail

- Right rail panel is about `310x372`.
- Radius: 7px.
- FAQ items are spaced in repeated 38px vertical steps.
- Use disclosure buttons with compact chevron affordances.
- Keep the submit prompt below the FAQ rail.

### Selected Paper Page

Use the same shell as the main page. The selected state should replace the list area with one focused content panel, while preserving filters and FAQ context. Include a compact Back affordance near the top of the content area.

## Interaction States

Define these states explicitly in CSS/components:

- Hover: subtle increase in text brightness or border opacity.
- Focus: use `#1752F0` outline or ring, never remove keyboard focus indication.
- Active selected filters: use `--color-brand` or `--color-brand-cyan` as the accent stroke/fill.
- Disabled/inactive: lower opacity to 30-50%. Use `var(--color-text)/0.3` to stay theme-safe.
- Theme toggle: keep dimensions stable; do not let icon changes resize the control.

## Accessibility Notes

The Figma mock contains several very small text sizes: 6px footer text, 7px tag text, and 10px filter labels. These communicate density in the mock, but they should be scaled for production:

- Body and abstracts: 14px minimum in cards, 16-18px in detail views.
- Tags and filter options: 12px minimum.
- Footer credits: 11-12px minimum.
- Interactive controls: 44px minimum touch target on mobile, even if the visual checkbox remains small.
- Maintain at least WCAG AA contrast for text. White on `#14181C` is safe; muted gray labels should be checked before use at small sizes.

## Implementation Checklist

- Use `--color-bg` as the app background across all main screens (dark: `#14181c`, light: `#f5f7fa`).
- Install and load Inter and Khula before implementing the typography system.
- Encode palette tokens in `Alexandria/app/globals.css` using the OKLCH dual-theme token system.
- Build the main app shell as a three-column desktop grid with responsive collapse.
- Keep content cards flat, sharp, and dense.
- Use `--color-brand` only for primary action, focus ring, selected state, and logo emphasis. Never dump `--color-brand-bright` directly on a light background as a text or border color.
- Use the `--color-chip-{cyan|red|green}-{bg|bd|text}` triplet for all status chips — never raw hex.
- Use `--color-separator` for all structural dividers. Never use raw `rgba` opacity values for borders.
- Keep yellow (`--color-pronunciation`) reserved for the pronunciation accent unless a new semantic warning color is intentionally added.
- Replace Figma microtype with accessible production sizes.
- Preserve the research-index feel: precise lines, compact metadata, restrained accents, and no ornamental UI that does not help orientation.
