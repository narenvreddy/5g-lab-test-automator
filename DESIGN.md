# Design Brief: 5G Lab Test Automator

## Tone & Purpose
Industrial-utilitarian tech dashboard for network engineers. Functional, information-dense, professional. Prioritizes scannability and fast access to test controls. Dark mode reduces eye strain during extended use.

## Color Palette (Dark Mode)
| Token | OKLCH | Usage |
|-------|-------|-------|
| Primary | 0.65 0.18 230 | CTAs, interactive elements, deep cyan |
| Accent | 0.75 0.22 230 | Highlights, active states, bright cyan |
| Secondary | 0.22 0.04 240 | Borders, muted text, slate-grey |
| Success | 0.65 0.18 150 | Completion states, green |
| Destructive | 0.55 0.22 25 | Errors, stop states, warm red |
| Background | 0.12 0.01 240 | Near-black, minimal saturation |
| Card | 0.18 0.01 240 | Elevated surfaces, charcoal |

## Typography
| Layer | Font | Weight | Usage |
|-------|------|--------|-------|
| Display | General Sans | 500 | Header, titles, high-contrast UI |
| Body | DM Sans | 400–500 | Form fields, labels, body copy |
| Mono | JetBrains Mono | 400 | Test IDs, identifiers, code-like content |

## Structural Zones
| Zone | Treatment | Border | Shadow |
|------|-----------|--------|--------|
| Header | Card elevated, cyan accent lines | border-border | shadow-md |
| Test Rows | Card elevated, tight vertical stacking | border-border | shadow-subtle |
| Add Button | Inline with accent color, geometric | none | shadow-sm |
| Footer/Details | Muted background if present | border-subtle | none |

## Spacing & Rhythm
- **Radius**: 6px base, 4px smaller elements (sharp, geometric)
- **Vertical gap**: 12px between rows (tight density)
- **Horizontal padding**: 16px inside cards
- **Field spacing**: 8px between form fields within row

## Component Patterns
- **Rows**: Horizontal card layout with Test ID (mono), dropdown, details text, Start button
- **Buttons**: Accent color for primary actions, monospace labels for technical context
- **Forms**: Clean, label-above input, no background noise
- **Dropdowns**: Simple select, inherit card styling

## Motion
- Smooth transitions on hover (0.3s cubic-bezier)
- Opacity change on button hover (no color shift)
- Optional fade-in for new rows on add

## Signature Detail
Monospace Test IDs and field labels evoke developer tools, reinforcing the engineering/technical context. Tight vertical stacking maximizes information density. Cyan accent used sparingly for Start buttons and active states — creates visual focus without visual chaos.

## Constraints
- No decorative elements (backgrounds, gradients, illustrations)
- No rounded buttons (geometric, sharp forms)
- Minimal color — cyan + red + green only
- High contrast for accessibility
- Responsive on mobile (single-column layout)
