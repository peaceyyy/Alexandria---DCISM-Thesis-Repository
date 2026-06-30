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

### Core Tokens

| Token | Hex | Figma Evidence | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#14181C` | main frame fill, 69 uses | App background and primary page surface. |
| `--color-text-primary` | `#FFFFFF` | dominant text fill, 152 uses | Main text, icons, active labels, primary UI copy. |
| `--color-text-muted` | `#D8DADC` | icon and line color, 27 uses | Secondary icons, subtle dividers, supporting UI marks. |
| `--color-border` | `#D9D9D9` | separators, 12 uses | Standard separator lines and light outlines. |
| `--color-border-subtle` | `rgba(217, 217, 217, 0.15)` | nav separators, 14 uses | Low-emphasis vertical/horizontal section dividers. |
| `--color-brand-blue` | `#1752F0` | logo text, selected accents, 4 uses | Alexandria brand accent, selected state, focus accent. |
| `--color-brand-blue-bright` | `#368BFE` | landing CTA and wordmark gradient | Primary CTA fill and brighter blue highlights. |
| `--color-brand-cyan` | `#1DA0C9` | repeated chip/input strokes, 9 uses | Thin accent stroke for selected/filter affordances. |
| `--color-pronunciation` | `#FFD900` | pronunciation helper text | One-off yellow accent for pronunciation or warning-style emphasis only. |
| `--color-text-tertiary` | `#969696` | landing supporting copy | Muted hero subtitle and secondary landing copy. |
| `--color-placeholder` | `#B3B3B3` | search placeholder | Placeholder text in inputs. |

### Gradients

Use gradients sparingly. They are part of the landing identity, not general UI chrome.

- Landing wordmark: angular blue gradient from `#368BFE` to `#1752F0`.
- Landing tagline: linear light gradient from `#FFFFFF` to `#C5C5C5`.

Do not introduce broad background gradients or decorative glow fields. The mockup uses a flat charcoal base with layered wave artwork on the landing page.

### Suggested CSS Variables

```css
:root {
  --color-bg: #14181c;
  --color-text-primary: #ffffff;
  --color-text-muted: #d8dadc;
  --color-text-tertiary: #969696;
  --color-placeholder: #b3b3b3;
  --color-border: #d9d9d9;
  --color-border-subtle: rgba(217, 217, 217, 0.15);
  --color-brand-blue: #1752f0;
  --color-brand-blue-bright: #368bfe;
  --color-brand-cyan: #1da0c9;
  --color-pronunciation: #ffd900;
}
```

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
- Active selected filters: use `#1DA0C9` or `#1752F0` as the accent stroke/fill.
- Disabled/inactive: lower opacity to 30-50%, matching the mock's `#FFFFFF` at 0.3 usage.
- Theme toggle: keep dimensions stable; do not let icon changes resize the control.

## Accessibility Notes

The Figma mock contains several very small text sizes: 6px footer text, 7px tag text, and 10px filter labels. These communicate density in the mock, but they should be scaled for production:

- Body and abstracts: 14px minimum in cards, 16-18px in detail views.
- Tags and filter options: 12px minimum.
- Footer credits: 11-12px minimum.
- Interactive controls: 44px minimum touch target on mobile, even if the visual checkbox remains small.
- Maintain at least WCAG AA contrast for text. White on `#14181C` is safe; muted gray labels should be checked before use at small sizes.

## Implementation Checklist

- Use `#14181C` as the app background across all main screens.
- Install and load Inter and Khula before implementing the typography system.
- Encode palette tokens in `Alexandria/app/globals.css` or the project theme layer.
- Build the main app shell as a three-column desktop grid with responsive collapse.
- Keep content cards flat, sharp, and dense.
- Use blue only for brand, primary action, focus, selected state, and logo emphasis.
- Keep yellow reserved for the pronunciation accent unless a new semantic warning color is intentionally added.
- Replace Figma microtype with accessible production sizes.
- Preserve the research-index feel: precise lines, compact metadata, restrained accents, and no ornamental UI that does not help orientation.
